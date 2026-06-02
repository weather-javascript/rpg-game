// src/services/database.ts
// Firestoreとのすべてのデータ通信を担う唯一のモジュール。
//
// ■ 設計方針（無料枠対策）
//   - Read/Write はゲームプレイ中ではなく「手動セーブ」「ログイン」「重要な取引」時のみ。
//   - プレイヤーデータは React State で管理し、セーブ時にのみ Firestore へ書き込む。
//   - onSnapshot（リアルタイム購読）はオークション画面など必要な部分のみ使用。

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { PlayerData, AuctionListing } from '../types/game';
import { DEFAULT_PLAYER_STATS } from '../data/masters';

// ============================================================
// === Firestoreコレクション名定数 ===
// ============================================================
const COLLECTIONS = {
  PLAYERS: 'players',
  AUCTIONS: 'auctions',
} as const;

// ============================================================
// === ユーティリティ ===
// ============================================================

/**
 * ディープマージ：既存データに新しいフィールドだけを追加・上書きする。
 * Firestoreの `merge: true` だけではネストしたオブジェクトが
 * 完全上書きされるため、アプリ側でマージしてから保存する。
 * any を使って TypeScript の過剰な型チェックを回避している（意図的）。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(base: any, override: any): any {
  const result = { ...base };
  for (const key in override) {
    const overrideVal = override[key];
    const baseVal = base[key];
    if (
      overrideVal !== null &&
      overrideVal !== undefined &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      baseVal !== null &&
      baseVal !== undefined &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal, overrideVal);
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal;
    }
  }
  return result;
}

/** 新規プレイヤーデータを生成する */
function createNewPlayerData(uid: string): PlayerData {
  const now = Date.now();
  return {
    uid,
    displayName: `冒険者#${uid.slice(0, 6)}`,
    gold: 100,
    stats: { ...DEFAULT_PLAYER_STATS },
    inventory: {},
    skillLevels: {
      mining: 1,
      woodcutting: 1,
      combat: 1,
      fishing: 1,
      crafting: 1,
    },
    skillExp: {
      mining: 0,
      woodcutting: 0,
      combat: 0,
      fishing: 0,
      crafting: 0,
    },
    lastSavedAt: now,
    createdAt: now,
    dungeonClearedCount: {},
    fishingScore: 0,
    equippedRodId: 'basic_rod',
    activeJob: null,
    activeBuffs: [],
    reliefUsedCount: 0,
    reliefLastUsed: 0,
  };
}

// ============================================================
// === プレイヤーデータ CRUD ===
// ============================================================

/**
 * ログイン時にプレイヤーデータを取得する。
 * 存在しない場合は新規作成して返す。
 * （Read: 1回）
 */
export async function loadOrCreatePlayer(uid: string): Promise<PlayerData> {
  const ref = doc(db, COLLECTIONS.PLAYERS, uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    // Firestoreのデータとデフォルト値をディープマージ（将来のフィールド追加に対応）
    const saved = snap.data();
    const defaultData = createNewPlayerData(uid);
    return deepMerge(defaultData, saved) as PlayerData;
  } else {
    // 新規プレイヤー作成（Write: 1回）
    const newPlayer = createNewPlayerData(uid);
    await setDoc(ref, newPlayer);
    return newPlayer;
  }
}

/**
 * プレイヤーデータをFirestoreへ保存する（手動セーブ用）。
 * （Write: 1回）
 */
export async function savePlayer(playerData: PlayerData): Promise<void> {
  const ref = doc(db, COLLECTIONS.PLAYERS, playerData.uid);
  const dataToSave = {
    ...playerData,
    lastSavedAt: Date.now(),
  };
  await setDoc(ref, dataToSave, { merge: true });
}

/**
 * 表示名だけを更新する（設定変更など）。
 * （Write: 1回）
 */
export async function updateDisplayName(uid: string, name: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.PLAYERS, uid);
  await updateDoc(ref, { displayName: name });
}

// ============================================================
// === オークション CRUD ===
// ============================================================

/**
 * オークションに出品する。
 * （Write: 1回）
 */
export async function createAuctionListing(
  listing: Omit<AuctionListing, 'id' | 'createdAt'>
): Promise<string> {
  const ref = collection(db, COLLECTIONS.AUCTIONS);
  const docRef = await addDoc(ref, {
    ...listing,
    createdAt: Date.now(),
  });
  return docRef.id;
}

/**
 * オークションを購入する。
 * （Read + Write: 各1回）
 */
export async function purchaseAuctionListing(
  listingId: string,
  buyerUid: string,
  buyerGold: number
): Promise<{ success: boolean; listing: AuctionListing | null }> {
  const ref = doc(db, COLLECTIONS.AUCTIONS, listingId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { success: false, listing: null };
  }

  const listing = { id: snap.id, ...snap.data() } as AuctionListing;

  if (listing.sellerUid === buyerUid) {
    return { success: false, listing };
  }

  const totalCost = listing.pricePerUnit * listing.amount;
  if (buyerGold < totalCost) {
    return { success: false, listing };
  }

  await deleteDoc(ref);
  return { success: true, listing };
}

/**
 * 自分の出品を取り下げる。
 * （Read + Write: 各1回）
 */
export async function cancelAuctionListing(
  listingId: string,
  sellerUid: string
): Promise<boolean> {
  const ref = doc(db, COLLECTIONS.AUCTIONS, listingId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return false;
  const data = snap.data();
  if (data['sellerUid'] !== sellerUid) return false;

  await deleteDoc(ref);
  return true;
}

/**
 * オークション一覧をリアルタイム購読する（onSnapshot）。
 * オークション画面の表示にのみ使用すること。
 * 返値の unsubscribe を呼ぶと購読を停止できる。
 */
export function subscribeToAuctions(
  callback: (listings: AuctionListing[]) => void,
  options?: { itemId?: string; maxResults?: number }
): Unsubscribe {
  const col = collection(db, COLLECTIONS.AUCTIONS);
  const now = Date.now();

  const q = options?.itemId
    ? query(
        col,
        where('itemId', '==', options.itemId),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc'),
        limit(options.maxResults ?? 50)
      )
    : query(
        col,
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc'),
        limit(options?.maxResults ?? 50)
      );

  return onSnapshot(q, (snapshot) => {
    const listings: AuctionListing[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AuctionListing, 'id'>),
    }));
    callback(listings);
  });
}
