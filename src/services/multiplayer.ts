// src/services/multiplayer.ts
import {
  doc, setDoc, deleteDoc, collection, query, orderBy, limit,
  onSnapshot, addDoc, getDoc, updateDoc, where, Unsubscribe, increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { OnlineUser, BoardMessage, AuctionListing, GambleBattle } from '../types/game';
import { calcJackpotContrib, rollJackpot } from '../systems/minigames';

const COLLECTIONS = {
  ONLINE:   'online_users',
  BOARD:    'board_messages',
  AUCTIONS: 'auctions',
  BATTLES:  'gamble_battles',
} as const;

export async function registerOnline(uid: string, displayName: string, level: number, activity?: string) {
  await setDoc(doc(db, COLLECTIONS.ONLINE, uid), {
    uid, displayName, level, lastSeen: Date.now(), currentActivity: activity ?? 'オンライン',
  });
}

export async function updateActivity(uid: string, activity: string, lastDungeonCleared?: string) {
  try {
    await updateDoc(doc(db, COLLECTIONS.ONLINE, uid), {
      lastSeen: Date.now(),
      currentActivity: activity,
      ...(lastDungeonCleared ? { lastDungeonCleared } : {}),
    });
  } catch { /* ignore */ }
}

export async function unregisterOnline(uid: string) {
  await deleteDoc(doc(db, COLLECTIONS.ONLINE, uid));
}

export function subscribeOnlineUsers(cb: (users: OnlineUser[]) => void): Unsubscribe {
  // where+orderByの複合インデックス不要にするためorderByのみ使用、クライアント側でフィルタ
  const q = query(collection(db, COLLECTIONS.ONLINE), orderBy('lastSeen', 'desc'), limit(50));
  const cutoff = Date.now() - 5 * 60 * 1000;
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => d.data() as OnlineUser).filter(u => u.lastSeen > cutoff));
  });
}

export async function postBoardMessage(uid: string, displayName: string, level: number, text: string) {
  await addDoc(collection(db, COLLECTIONS.BOARD), { uid, displayName, level, text: text.slice(0, 100), createdAt: Date.now() });
}

export function subscribeBoardMessages(cb: (msgs: BoardMessage[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.BOARD), orderBy('createdAt', 'desc'), limit(30));
  return onSnapshot(q, snap => { cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<BoardMessage,'id'>) }))); });
}

export async function createAuction(listing: Omit<AuctionListing,'id'|'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.AUCTIONS), { ...listing, createdAt: Date.now() });
  return ref.id;
}

export async function buyAuction(listingId: string, buyerUid: string, buyerGold: number): Promise<{ success: boolean; listing: AuctionListing | null }> {
  const ref = doc(db, COLLECTIONS.AUCTIONS, listingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, listing: null };
  const listing = { id: snap.id, ...(snap.data() as Omit<AuctionListing,'id'>) };
  if (listing.sellerUid === buyerUid) return { success: false, listing };
  const totalCost = listing.pricePerUnit * listing.amount;
  if (buyerGold < totalCost) return { success: false, listing };
  await deleteDoc(ref);
  try { await updateDoc(doc(db, 'players', listing.sellerUid), { gold: increment(totalCost) }); } catch { /* ignore */ }
  try {
    await addDoc(collection(db, 'sold_notifications'), {
      sellerUid: listing.sellerUid, itemId: listing.itemId, amount: listing.amount,
      totalGold: totalCost, createdAt: Date.now(), read: false,
    });
  } catch { /* ignore */ }
  return { success: true, listing };
}

export async function cancelAuction(listingId: string, sellerUid: string): Promise<boolean> {
  const ref = doc(db, COLLECTIONS.AUCTIONS, listingId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data()['sellerUid'] !== sellerUid) return false;
  await deleteDoc(ref);
  return true;
}

export function subscribeAuctions(cb: (listings: AuctionListing[]) => void): Unsubscribe {
  // where+orderByの複合インデックス不要にするためcreatedAtでソート、クライアント側で期限フィルタ
  const q = query(collection(db, COLLECTIONS.AUCTIONS), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, snap => {
    const now = Date.now();
    cb(snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<AuctionListing,'id'>) }))
      .filter(l => l.expiresAt > now));
  });
}

export function subscribeSoldNotifications(uid: string, cb: (notifications: { id: string; itemId: string; amount: number; totalGold: number }[]) => void): Unsubscribe {
  // sellerUid==uid のみでクエリ、read==falseはクライアント側でフィルタ
  const q = query(collection(db, 'sold_notifications'), where('sellerUid', '==', uid), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(q, snap => {
    cb(snap.docs
      .filter(d => d.data()['read'] === false)
      .map(d => ({ id: d.id, itemId: d.data()['itemId'] as string, amount: d.data()['amount'] as number, totalGold: d.data()['totalGold'] as number })));
  });
}

export async function markSoldNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'sold_notifications', notificationId), { read: true });
}

// ============================================================
// ジャックポット
// ============================================================
const jackpotRef = () => doc(db, 'shared', 'jackpot');

export async function getJackpotPool(): Promise<number> {
  const snap = await getDoc(jackpotRef());
  return snap.exists() ? (snap.data()['pool'] as number ?? 0) : 0;
}

export function subscribeJackpotPool(cb: (pool: number) => void): Unsubscribe {
  return onSnapshot(jackpotRef(), snap => { cb(snap.exists() ? (snap.data()['pool'] as number ?? 0) : 0); });
}

// 他のギャンブルで賭けるたびにプールへ積立（ジャックポットは挑戦なし、蓄積のみ）
export async function contributeToJackpot(bet: number): Promise<number> {
  const contrib = calcJackpotContrib(bet);
  const ref = jackpotRef();
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { pool: increment(contrib) });
  } else {
    await setDoc(ref, { pool: contrib });
  }
  const newSnap = await getDoc(ref);
  return newSnap.exists() ? (newSnap.data()['pool'] as number) : 0;
}

// ジャックポット当選チェック（他ギャンブル実行時にバックグラウンドで発生）
export async function checkJackpotWin(): Promise<{ won: boolean; pool: number }> {
  const won = rollJackpot();
  if (!won) return { won: false, pool: 0 };
  const ref = jackpotRef();
  const snap = await getDoc(ref);
  const pool = snap.exists() ? (snap.data()['pool'] as number) : 0;
  if (won && pool > 0) {
    await setDoc(ref, { pool: 0 });
  }
  return { won, pool };
}

// 旧API互換
export async function contributeAndRollJackpot(bet: number): Promise<{ won: boolean; pool: number }> {
  const pool = await contributeToJackpot(bet);
  const won = rollJackpot();
  if (won && pool > 0) {
    await setDoc(jackpotRef(), { pool: 0 });
  }
  return { won, pool };
}

// ============================================================
// PvPギャンブル対戦
// ============================================================
export async function createGambleBattle(
  hostUid: string, hostName: string, hostLevel: number,
  gambleType: string, betAmount: number
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.BATTLES), {
    hostUid, hostName, hostLevel, gambleType, betAmount,
    status: 'waiting',
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10分で期限切れ
  });
  return ref.id;
}

export function subscribeGambleBattles(cb: (battles: GambleBattle[]) => void): Unsubscribe {
  // 複合インデックス不要なシンプルなクエリに変更
  // status=='waiting'のみでフィルタ、期限切れはクライアント側でフィルタ
  const q = query(
    collection(db, COLLECTIONS.BATTLES),
    where('status', '==', 'waiting'),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, snap => {
    const now = Date.now();
    const battles = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<GambleBattle,'id'>) }))
      .filter(b => b.expiresAt > now); // 期限切れをクライアント側で除外
    cb(battles);
  });
}

export async function joinGambleBattle(
  battleId: string,
  guestUid: string, guestName: string
): Promise<{ success: boolean; battle: GambleBattle | null }> {
  const ref = doc(db, COLLECTIONS.BATTLES, battleId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, battle: null };
  const battle = { id: snap.id, ...(snap.data() as Omit<GambleBattle,'id'>) };
  if (battle.status !== 'waiting') return { success: false, battle };
  if (battle.hostUid === guestUid) return { success: false, battle };

  // 勝敗を決定（50/50）
  const hostWins = Math.random() < 0.5;
  const winnerId = hostWins ? battle.hostUid : guestUid;
  await updateDoc(ref, { status: 'finished', guestUid, guestName, winnerId });

  return { success: true, battle: { ...battle, guestUid, guestName, winnerId, status: 'finished' } };
}

export async function cancelGambleBattle(battleId: string, hostUid: string): Promise<boolean> {
  const ref = doc(db, COLLECTIONS.BATTLES, battleId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data()['hostUid'] !== hostUid) return false;
  await deleteDoc(ref);
  return true;
}

// ============================================================
// 管理者機能
// ============================================================
export async function getAllPlayersAdmin(): Promise<any[]> {
  const snap = await import('firebase/firestore').then(({ getDocs }) =>
    getDocs(collection(db, 'players'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updatePlayerAdmin(uid: string, data: Partial<any>): Promise<void> {
  await updateDoc(doc(db, 'players', uid), data);
}

export async function getGambleMultipliers(): Promise<Record<string, number>> {
  const snap = await getDoc(doc(db, 'admin', 'gamble_settings'));
  return snap.exists() ? (snap.data() as Record<string, number>) : {};
}

export async function setGambleMultipliers(multipliers: Record<string, number>): Promise<void> {
  await setDoc(doc(db, 'admin', 'gamble_settings'), multipliers);
}

export function subscribeGambleMultipliers(cb: (m: Record<string, number>) => void): Unsubscribe {
  return onSnapshot(doc(db, 'admin', 'gamble_settings'), snap => {
    cb(snap.exists() ? (snap.data() as Record<string, number>) : {});
  });
}
