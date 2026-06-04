// functions/src/index.ts
// Cloud Functions — サーバー側で処理すべき高リスク処理

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
// 0. 管理者カスタムクレーム設定
//    Firestoreの admins/{uid} ドキュメントの存在で管理者を管理。
//    管理者を追加するには Firebase Console で admins/{uid} を作成するか、
//    このFunctionを呼び出す。
// ============================================================

// admins/{uid} ドキュメントが作成/削除されたとき、カスタムクレームを自動更新
export const onAdminDocChange = functions.firestore
  .document('admins/{uid}')
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    try {
      if (change.after.exists) {
        // ドキュメントが存在する → admin: true クレームをセット
        await admin.auth().setCustomUserClaims(uid, { admin: true });
        console.log(`[Admin] カスタムクレーム admin=true をセット: ${uid}`);
      } else {
        // ドキュメントが削除された → admin クレームを削除
        await admin.auth().setCustomUserClaims(uid, { admin: false });
        console.log(`[Admin] カスタムクレーム admin=false をセット: ${uid}`);
      }
    } catch (e) {
      console.error(`[Admin] クレーム設定失敗 ${uid}:`, e);
    }
    return null;
  });

// クライアントから呼び出してトークンを強制更新させるための確認Function
// 管理者がログイン後にこれを呼ぶことでクレームが即時反映される
export const refreshAdminClaim = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'ログインが必要です');
  }
  const uid = context.auth.uid;
  // admins コレクションを確認
  const adminDoc = await db.collection('admins').doc(uid).get();
  const isAdmin = adminDoc.exists;

  // クレームを最新状態に同期
  await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });

  return { isAdmin };
});

// ============================================================
// 1. オークション購入（トランザクション）
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

    tx.update(listingRef, { status: 'sold', soldAt: Date.now(), buyerUid });

    const newBuyerInv = { ...buyer.inventory };
    newBuyerInv[listing.itemId] = (newBuyerInv[listing.itemId] ?? 0) + listing.amount;
    tx.update(buyerRef, { gold: buyer.gold - totalCost, inventory: newBuyerInv });

    const sellerRef = db.collection('players').doc(listing.sellerUid);
    const sellerSnap = await tx.get(sellerRef);
    if (sellerSnap.exists) {
      const seller = sellerSnap.data() as PlayerDoc;
      tx.update(sellerRef, { gold: seller.gold + totalCost });
    }

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
// 2. 不正アクセス検知（Firestore トリガー）
// ============================================================
export const detectCheat = functions.firestore
  .document('players/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as PlayerDoc;
    const after  = change.after.data()  as PlayerDoc;
    const uid    = context.params.uid;

    const goldDiff = (after.gold ?? 0) - (before.gold ?? 0);
    const SUSPICIOUS_GOLD_THRESHOLD = 100000;

    if (goldDiff > SUSPICIOUS_GOLD_THRESHOLD) {
      console.warn(`[CheatDetect] UID: ${uid} — gold が ${goldDiff}G 増加 (${before.gold} → ${after.gold})`);
    }

    return null;
  });
