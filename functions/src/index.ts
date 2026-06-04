// functions/src/index.ts
// Cloud Functions — サーバー側で処理すべき高リスク処理のコード例
// デプロイ: cd functions && npm install && firebase deploy --only functions
//
// ⚠️ 現在はクライアント側で処理している以下をサーバー移行することを推奨:
//   - オークション購入（gold の二重消費防止）
//   - ギャンブル報酬決定（乱数の操作防止）
//   - ダンジョンドロップ報酬（レート改ざん防止）

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// ============================================================
// 型定義
// ============================================================
interface AuctionDoc {
  sellerUid: string;
  itemId: string;
  amount: number;
  pricePerUnit: number;
  expiresAt: number;
  status: 'active' | 'sold' | 'cancelled';
}

interface PlayerDoc {
  gold: number;
  inventory: Record<string, number>;
  [key: string]: unknown;
}

// ============================================================
// 1. オークション購入（トランザクション）
//    クライアントが buyAuction を呼ぶと、ここでサーバー側検証する。
// ============================================================
export const buyAuction = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'ログインが必要です');

  const { listingId } = data as { listingId: string };
  if (!listingId) throw new functions.https.HttpsError('invalid-argument', 'listingId が必要です');

  const buyerUid = context.auth.uid;

  return db.runTransaction(async (tx) => {
    const listingRef = db.collection('auctions').doc(listingId);
    const buyerRef   = db.collection('players').doc(buyerUid);
    const listingSnap = await tx.get(listingRef);
    const buyerSnap   = await tx.get(buyerRef);

    if (!listingSnap.exists) throw new functions.https.HttpsError('not-found', '出品が見つかりません');
    const listing = listingSnap.data() as AuctionDoc;

    if (listing.status !== 'active') throw new functions.https.HttpsError('failed-precondition', '既に売却済みまたはキャンセル済みです');
    if (listing.sellerUid === buyerUid) throw new functions.https.HttpsError('failed-precondition', '自分の出品は購入できません');
    if (listing.expiresAt < Date.now()) throw new functions.https.HttpsError('failed-precondition', '出品期限が切れています');

    if (!buyerSnap.exists) throw new functions.https.HttpsError('not-found', 'プレイヤーが見つかりません');
    const buyer = buyerSnap.data() as PlayerDoc;
    const totalCost = listing.pricePerUnit * listing.amount;

    if (buyer.gold < totalCost) throw new functions.https.HttpsError('failed-precondition', `所持金が不足しています（必要: ${totalCost}G）`);

    // 出品を売却済みに
    tx.update(listingRef, { status: 'sold', soldAt: Date.now(), buyerUid });

    // 買い手: gold 減算・アイテム加算
    const newBuyerInv = { ...buyer.inventory };
    newBuyerInv[listing.itemId] = (newBuyerInv[listing.itemId] ?? 0) + listing.amount;
    tx.update(buyerRef, { gold: buyer.gold - totalCost, inventory: newBuyerInv });

    // 売り手: gold 加算・売却通知
    const sellerRef = db.collection('players').doc(listing.sellerUid);
    const sellerSnap = await tx.get(sellerRef);
    if (sellerSnap.exists) {
      const seller = sellerSnap.data() as PlayerDoc;
      tx.update(sellerRef, { gold: seller.gold + totalCost });
    }

    // 売却通知ドキュメント
    const notifRef = db.collection('sold_notifications').doc();
    tx.set(notifRef, {
      sellerUid: listing.sellerUid,
      buyerUid,
      itemId: listing.itemId,
      amount: listing.amount,
      totalGold: totalCost,
      createdAt: Date.now(),
      read: false,
    });

    return { success: true, totalCost };
  });
});

// ============================================================
// 2. ギャンブル結果決定（サーバー側乱数）
//    クライアントが resolveGamble を呼ぶと、ここでサーバー側で乱数を生成する。
//    現状はクライアント側で計算しているが、こちらに移行すれば乱数操作を防げる。
// ============================================================
export const resolveGamble = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'ログインが必要です');

  const { gameId, betAmount } = data as { gameId: string; betAmount: number };
  if (!gameId || !betAmount || betAmount < 1) {
    throw new functions.https.HttpsError('invalid-argument', 'gameId と betAmount が必要です');
  }

  const uid = context.auth.uid;

  return db.runTransaction(async (tx) => {
    const playerRef  = db.collection('players').doc(uid);
    const playerSnap = await tx.get(playerRef);
    if (!playerSnap.exists) throw new functions.https.HttpsError('not-found', 'プレイヤーが見つかりません');

    const player = playerSnap.data() as PlayerDoc;
    if (player.gold < betAmount) throw new functions.https.HttpsError('failed-precondition', '所持金が不足しています');

    // サーバー側で乱数生成（crypto.randomBytes を使用）
    const crypto = await import('crypto');
    const rand = crypto.randomBytes(4).readUInt32BE(0) / 0x100000000;

    // ゲーム設定に基づく報酬計算（省略：実際にはmasters.tsの設定を参照）
    const WIN_RATE = 0.45;
    const MULTIPLIER = 2.0;

    let goldDelta: number;
    let won: boolean;

    if (rand < WIN_RATE) {
      goldDelta = Math.floor(betAmount * MULTIPLIER) - betAmount;
      won = true;
    } else {
      goldDelta = -betAmount;
      won = false;
    }

    tx.update(playerRef, { gold: player.gold + goldDelta });

    return { won, goldDelta, rand: rand.toFixed(6) };
  });
});

// ============================================================
// 3. 不正アクセス検知（Firestore トリガー）
//    players ドキュメントが更新されたとき、不審な変更を検知してアラート。
// ============================================================
export const detectCheat = functions.firestore
  .document('players/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as PlayerDoc;
    const after  = change.after.data()  as PlayerDoc;
    const uid    = context.params.uid;

    const goldDiff = (after.gold ?? 0) - (before.gold ?? 0);
    const SUSPICIOUS_GOLD_THRESHOLD = 100000; // 1回の更新で10万G以上増加

    if (goldDiff > SUSPICIOUS_GOLD_THRESHOLD) {
      console.warn(`[CheatDetect] UID: ${uid} — gold が ${goldDiff}G 増加 (${before.gold} → ${after.gold})`);
      // 実際のプロダクションでは: Slack通知 / Admin SDK でBANフラグ / BigQueryにログ 等
    }

    return null;
  });
