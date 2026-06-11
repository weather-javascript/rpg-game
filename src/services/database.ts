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
    wealthCoin: 0,
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
    fishingLevel: 1,
    fishingExp: 0,
    fishingTotalCount: 0,
    fishingMaxSizeCm: 0,
    fishingMaxWeightKg: 0,
    fishBook: {},
    fishingEquippedBaitId: '',
    fishingSelectedSpotId: 'pond',
    fishingUnlockedSpots: ['pond','river'],
    fishingRodEnhance: {},
    fishingRodDurability: {},
    fishingTotalBaitUsed: 0,
    fishingTotalGoldEarned: 0,
    fishingAchievements: [],
    fishingUnlockedTitles: [],
    activeJob: null,
    activeBuffs: [],
    reliefUsedCount: 0,
    reliefLastUsed: 0,
    lastRegenAt: now,
    emailAddress: '',
    emailNotifications: { auction: true, events: true, updates: true },
    activityLog: [],
    settings: {},
    profile: { icon: '⚔️', comment: '', titleId: '', favDungeonId: '' },
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
  // merge:trueだとネストオブジェクトが部分更新される恐れがあるため完全上書き
  await setDoc(ref, dataToSave);
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

// ============================================================
// ログインボーナス
// ============================================================
export interface LoginBonusState {
  uid: string;
  weekStart: number;   // 今週のサイクル開始Timestamp(ms)
  claimed: number[];   // 受取済み日数(1-7)
  updatedAt: number;
}

const LOGIN_BONUS_REWARDS: { day: number; gold: number; special?: string }[] = [
  { day: 1, gold: 1000 },
  { day: 2, gold: 3000 },
  { day: 3, gold: 5000 },
  { day: 4, gold: 10000 },
  { day: 5, gold: 30000 },
  { day: 6, gold: 50000 },
  { day: 7, gold: 0, special: 'treasure_box' },
];

export { LOGIN_BONUS_REWARDS };

function getWeekStart(): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
  return weekStart.getTime();
}

export async function fetchLoginBonus(uid: string): Promise<LoginBonusState> {
  const ref = doc(db, 'login_bonus', uid);
  const snap = await getDoc(ref);
  const weekStart = getWeekStart();
  if (!snap.exists()) {
    return { uid, weekStart, claimed: [], updatedAt: Date.now() };
  }
  const data = snap.data() as LoginBonusState;
  // 週が変わっていたらリセット
  if (data.weekStart < weekStart) {
    return { uid, weekStart, claimed: [], updatedAt: Date.now() };
  }
  return data;
}

export async function claimLoginBonus(uid: string, day: number): Promise<{ success: boolean; gold: number; special?: string; error?: string }> {
  const state = await fetchLoginBonus(uid);
  if (state.claimed.includes(day)) return { success: false, gold: 0, error: '受取済みです' };
  // 前の日を全部受け取っていないとNG (day-1 まで全部claimed)
  for (let d = 1; d < day; d++) {
    if (!state.claimed.includes(d)) return { success: false, gold: 0, error: `${d}日目を先に受け取ってください` };
  }
  const reward = LOGIN_BONUS_REWARDS.find(r => r.day === day);
  if (!reward) return { success: false, gold: 0, error: '無効な日数です' };

  const newClaimed = [...state.claimed, day];
  const ref = doc(db, 'login_bonus', uid);
  await setDoc(ref, { uid, weekStart: state.weekStart, claimed: newClaimed, updatedAt: Date.now() });
  return { success: true, gold: reward.gold, special: reward.special };
}
