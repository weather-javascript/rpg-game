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
      sellerUid: listing.sellerUid, buyerUid, itemId: listing.itemId, amount: listing.amount,
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
  // orderByを外してインデックス不要に。クライアント側でソート＆フィルタ
  const q = query(
    collection(db, COLLECTIONS.BATTLES),
    where('status', '==', 'waiting'),
    limit(50)
  );
  return onSnapshot(q, snap => {
    const now = Date.now();
    const battles = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<GambleBattle,'id'>) }))
      .filter(b => b.expiresAt > now) // 期限切れをクライアント側で除外
      .sort((a, b) => b.createdAt - a.createdAt); // クライアント側でソート
    cb(battles);
  });
}

function _rollDice(n = 6) { return Math.floor(Math.random() * n) + 1; }

function _resolveChohan(): boolean {
  // 先行決め: 1個ずつ振って出目が大きい方が先攻（丁/半を選べる）
  let hostOrder = _rollDice(), guestOrder = _rollDice();
  while (hostOrder === guestOrder) { hostOrder = _rollDice(); guestOrder = _rollDice(); }
  const hostGoesFirst = hostOrder > guestOrder;
  const d1 = _rollDice(), d2 = _rollDice();
  const isEven = (d1 + d2) % 2 === 0;
  // 先行が丁を選ぶ、後攻は半が自動選択
  return hostGoesFirst ? isEven : !isEven;
}

function _chinchiroScore(dice: number[]): number {
  const d = dice.slice().sort((a,b)=>a-b);
  if (d[0]===1 && d[1]===1 && d[2]===1) return 1000; // ピンゾロ
  if (d[0]===1 && d[1]===2 && d[2]===3) return -1;   // ヒフミ（負け）
  if (d[0]===4 && d[1]===5 && d[2]===6) return 500;  // シゴロ
  if (d[0]===d[1] && d[1]===d[2]) return 300 + d[0]; // アラシ（ゾロ目）数字大きい方が強い
  // 通常目: 2つ被り + 残り1つ。残りの1つが目 (6が最強、1が最弱)
  const counts: Record<number,number> = {};
  for (const v of d) counts[v] = (counts[v]??0)+1;
  const singles = Object.entries(counts).filter(([,c])=>c===1).map(([v])=>Number(v));
  const pairs = Object.entries(counts).filter(([,c])=>c===2);
  if (pairs.length === 1 && singles.length === 1) return singles[0]; // 1〜6
  return 0; // 目なし（振り直し扱い → 0点）
}

function _resolveChinchiro(): boolean {
  // 役が出るまで最大3回振り、スコアが高い方が勝ち
  // ヒフミ(-1)は即負け、0は目なし（振り直し）
  const roll = () => [_rollDice(),_rollDice(),_rollDice()];
  let hostScore = 0;
  let hostInstantLoss = false;
  for (let i = 0; i < 3; i++) {
    hostScore = _chinchiroScore(roll());
    if (hostScore !== 0) break;
  }
  if (hostScore === -1) hostInstantLoss = true;
  // 親の一発終了ルール: ピンゾロ(1000)/シゴロ(500)/アラシ(300+) → 親総取り
  // ヒフミ(-1)/目なし3投目(0) → 親総負け
  if (hostScore >= 300 || hostScore === 500 || hostScore === 1000) return true;  // 親の即勝ち
  if (hostInstantLoss || hostScore === 0) return false; // 親の即負け
  // 通常目(1-6): 子もサイコロを振る
  let guestScore = 0;
  for (let i = 0; i < 3; i++) {
    guestScore = _chinchiroScore(roll());
    if (guestScore !== 0) break;
  }
  if (guestScore === -1 || guestScore === 0) return true; // 子がヒフミ/目なし → 親勝ち
  if (hostScore === guestScore) return Math.random() < 0.5;
  return hostScore > guestScore;
}

function _resolveCoinFlip(): boolean {
  // 先行決めサイコロ → 先行が丁（偶数）を選ぶ、コインはランダム（丁半と同じロジック）
  const hostFirst = _rollDice() >= _rollDice();
  const d1 = _rollDice(), d2 = _rollDice();
  const isEven = (d1 + d2) % 2 === 0;
  // 先行が丁（偶数）を選ぶ
  return hostFirst ? isEven : !isEven;
}

const SLOT_SYMBOLS = ['🍒','🍋','💎','7️⃣','🔔','💰'];
function _slotRank(reels: string[]): number {
  if (reels[0]===reels[1] && reels[1]===reels[2]) {
    return reels[0]==='7️⃣' ? 100 : reels[0]==='💎' ? 50 : SLOT_SYMBOLS.indexOf(reels[0]) + 10;
  }
  if (reels[0]===reels[1] || reels[1]===reels[2]) return 1;
  return 0;
}

function _resolveSlot(): boolean {
  // 先行決めサイコロ → スロットを回して役が出るまで（最大5回）
  const spinUntilRoll = (): number => {
    for (let i = 0; i < 5; i++) {
      const reels = [0,1,2].map(() => SLOT_SYMBOLS[Math.floor(Math.random()*SLOT_SYMBOLS.length)]);
      const rank = _slotRank(reels);
      if (rank > 0) return rank;
    }
    return 0;
  };
  const hostRank = spinUntilRoll();
  const guestRank = spinUntilRoll();
  if (hostRank === guestRank) return Math.random() < 0.5;
  return hostRank > guestRank;
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

  // ゲームタイプに応じた対戦ロジック
  let hostWins: boolean;
  const gt = battle.gambleType;
  if (gt === 'chohan') hostWins = _resolveChohan();
  else if (gt === 'chinchiro') hostWins = _resolveChinchiro();
  else if (gt === 'coin_flip') hostWins = _resolveCoinFlip();
  else if (gt === 'slot_machine') hostWins = _resolveSlot();
  else hostWins = Math.random() < 0.5;

  const winnerId = hostWins ? battle.hostUid : guestUid;
  await updateDoc(ref, { status: 'finished', guestUid, guestName, winnerId });

  return { success: true, battle: { ...battle, guestUid, guestName, winnerId, status: 'finished' } };
}

// ホストが自分のバトルの状態変化（finished）を監視するための購読
export function subscribeGambleBattle(battleId: string, cb: (battle: GambleBattle | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.BATTLES, battleId), snap => {
    if (!snap.exists()) { cb(null); return; }
    cb({ id: snap.id, ...(snap.data() as Omit<GambleBattle, 'id'>) });
  });
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
// 管理者向けプレイヤーデータ型（全フィールドをPartialで安全に扱う）
export interface AdminPlayerData {
  id: string;
  uid: string;
  displayName?: string;
  gold?: number;
  banned?: boolean;
  banReason?: string;
  stats?: { level: number; hp: number; maxHp: number; satiety: number; maxSatiety: number; exp: number; expToNextLevel: number };
  fishingScore?: number;
  dungeonClearedCount?: Record<string, number>;
  skillLevels?: Record<string, number>;
  activityLog?: Array<{ type: string; message: string; timestamp: number }>;
  lastSavedAt?: number;
  createdAt?: number;
}

export async function getAllPlayersAdmin(): Promise<AdminPlayerData[]> {
  const snap = await import('firebase/firestore').then(({ getDocs }) =>
    getDocs(collection(db, 'players'))
  );
  return snap.docs.map(d => {
    const data = d.data() as Partial<AdminPlayerData>;
    return {
      id: d.id,
      uid: data.uid ?? d.id,
      ...data,
    } as AdminPlayerData;
  });
}

export function subscribeAllPlayersAdmin(cb: (players: AdminPlayerData[]) => void): () => void {
  // onSnapshotでリアルタイム更新（管理者権限が必要）
  try {
    const unsub = onSnapshot(collection(db, 'players'), snap => {
      cb(snap.docs.map(d => {
        const data = d.data() as Partial<AdminPlayerData>;
        return {
          id: d.id,
          uid: data.uid ?? d.id,
          ...data,
        } as AdminPlayerData;
      }));
    });
    return unsub;
  } catch {
    return () => {};
  }
}

export async function updatePlayerAdmin(uid: string, data: Partial<AdminPlayerData>): Promise<void> {
  // updateDocではなくsetDoc(merge:false)で完全上書きし、オンラインプレイヤーの
  // 自動保存で上書きされないよう adminOverrideAt タイムスタンプを付与する
  const ref = doc(db, 'players', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await updateDoc(ref, { ...data, adminOverrideAt: Date.now() });
    return;
  }
  const current = snap.data();
  // ネストフィールド（stats.level など）を展開してマージ
  const flatData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    flatData[k] = v;
  }
  await setDoc(ref, { ...current, ...flatData, adminOverrideAt: Date.now() });
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

// プレイヤーのアクティビティログを取得（詳細表示用）
export async function getPlayerActivityLog(uid: string): Promise<Array<{ type: string; message: string; timestamp: number }>> {
  try {
    const snap = await getDoc(doc(db, 'players', uid));
    if (!snap.exists()) return [];
    const data = snap.data() as Partial<AdminPlayerData>;
    return data.activityLog ?? [];
  } catch {
    return [];
  }
}

// ============================================================
// メンテナンスモード & ジャックポット率
// ============================================================
export interface MaintenanceStatus {
  active: boolean;
  startedAt: number;
  estimatedMinutes: number;
  message?: string;
}

export async function getMaintenanceStatus(): Promise<MaintenanceStatus | null> {
  const snap = await getDoc(doc(db, 'admin', 'maintenance'));
  if (!snap.exists()) return null;
  return snap.data() as MaintenanceStatus;
}

export function subscribeMaintenanceStatus(cb: (s: MaintenanceStatus | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'admin', 'maintenance'), snap => {
    cb(snap.exists() ? (snap.data() as MaintenanceStatus) : null);
  });
}

export async function setMaintenanceStatus(status: MaintenanceStatus): Promise<void> {
  await setDoc(doc(db, 'admin', 'maintenance'), status);
}

export async function getJackpotRate(): Promise<number> {
  const snap = await getDoc(doc(db, 'admin', 'jackpot_settings'));
  if (!snap.exists()) return 0.20;
  return (snap.data() as { rate: number }).rate ?? 0.20;
}

export async function setJackpotRate(rate: number): Promise<void> {
  await setDoc(doc(db, 'admin', 'jackpot_settings'), { rate });
}

export function subscribeJackpotRate(cb: (rate: number) => void): Unsubscribe {
  return onSnapshot(doc(db, 'admin', 'jackpot_settings'), snap => {
    cb(snap.exists() ? ((snap.data() as { rate: number }).rate ?? 0.20) : 0.20);
  });
}

// お知らせ履歴
export interface AnnouncementRecord {
  id: string;
  text: string;
  timestamp: number;
}

export async function getAnnouncementHistory(): Promise<AnnouncementRecord[]> {
  try {
    const { query, collection: col, orderBy: ob, limit: lim, getDocs } = await import('firebase/firestore');
    const q = query(col(db, 'announcements'), ob('timestamp', 'desc'), lim(30));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AnnouncementRecord,'id'>) }));
  } catch { return []; }
}

export async function saveAnnouncementToHistory(text: string): Promise<void> {
  const { addDoc, collection: col } = await import('firebase/firestore');
  await addDoc(col(db, 'announcements'), { text, timestamp: Date.now() });
}

// ============================================================
// グローバルアクティビティフィード（Firebase節約版）
// shared/activity_feed ドキュメント1本に最新50件を配列で保持
// ============================================================
export interface ActivityFeedEntry {
  uid: string;
  displayName: string;
  type: string;   // 'mining'|'fishing'|'dungeon'|'gamble_win'|'gamble_lose'|'auction'|'level_up'|'crafting'
  message: string;
  timestamp: number;
}

const FEED_REF = () => doc(db, 'shared', 'activity_feed');

/** アクティビティをフィードに追記（最新50件を保持） */
export async function postActivityFeed(entry: Omit<ActivityFeedEntry, 'timestamp'>): Promise<void> {
  try {
    const snap = await getDoc(FEED_REF());
    const prev: ActivityFeedEntry[] = snap.exists() ? ((snap.data()['entries'] ?? []) as ActivityFeedEntry[]) : [];
    const next = [{ ...entry, timestamp: Date.now() }, ...prev].slice(0, 50);
    await setDoc(FEED_REF(), { entries: next, updatedAt: Date.now() });
  } catch { /* ignore */ }
}

/** アクティビティフィードをリアルタイム購読（onSnapshot 1本） */
export function subscribeActivityFeed(cb: (entries: ActivityFeedEntry[]) => void): Unsubscribe {
  return onSnapshot(FEED_REF(), snap => {
    if (!snap.exists()) { cb([]); return; }
    cb((snap.data()['entries'] ?? []) as ActivityFeedEntry[]);
  });
}
