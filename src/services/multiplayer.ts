// src/services/multiplayer.ts
import {
  doc, setDoc, deleteDoc, collection, query, orderBy, limit,
  onSnapshot, addDoc, getDoc, updateDoc, where, Unsubscribe, increment, getDocs,
  arrayUnion, arrayRemove, runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import type { OnlineUser, BoardMessage, BoardReply, AuctionListing, GambleBattle, GambleBattleData, BattleHistoryEntry, PokerTable, PokerCard, PokerPlayer, PokerPhase } from '../types/game';
import { calcJackpotContrib, rollJackpot } from '../systems/minigames';

const COLLECTIONS = {
  ONLINE:         'online_users',
  BOARD:          'board_messages',
  AUCTIONS:       'auctions',
  BATTLES:        'gamble_battles',
  POKER:          'poker_tables',
  BATTLE_HISTORY: 'battle_history',
} as const;

// ============================================================
// オンラインユーザー登録 — 30秒throttle
// ============================================================
let _onlineThrottleTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingOnlineData: { uid: string; displayName: string; level: number; activity: string; lastDungeonCleared?: string } | null = null;

function _flushOnline() {
  if (!_pendingOnlineData) return;
  const d = _pendingOnlineData;
  _pendingOnlineData = null;
  setDoc(doc(db, COLLECTIONS.ONLINE, d.uid), {
    uid: d.uid, displayName: d.displayName, level: d.level,
    lastSeen: Date.now(), currentActivity: d.activity,
    ...(d.lastDungeonCleared ? { lastDungeonCleared: d.lastDungeonCleared } : {}),
  }).catch(() => {});
}

export async function registerOnline(uid: string, displayName: string, level: number, activity?: string) {
  // 初回登録は即座に書き込む
  await setDoc(doc(db, COLLECTIONS.ONLINE, uid), {
    uid, displayName, level, lastSeen: Date.now(), currentActivity: activity ?? 'オンライン',
  });
}

export async function updateActivity(uid: string, activity: string, lastDungeonCleared?: string) {
  // 30秒throttle: 最後のupdateから30秒後にまとめて書き込む
  _pendingOnlineData = { uid, displayName: _pendingOnlineData?.displayName ?? '', level: _pendingOnlineData?.level ?? 1, activity, lastDungeonCleared };
  if (!_onlineThrottleTimer) {
    _onlineThrottleTimer = setTimeout(() => {
      _onlineThrottleTimer = null;
      _flushOnline();
    }, 30_000);
  }
}

export async function unregisterOnline(uid: string) {
  if (_onlineThrottleTimer) { clearTimeout(_onlineThrottleTimer); _onlineThrottleTimer = null; }
  await deleteDoc(doc(db, COLLECTIONS.ONLINE, uid));
}

// オンラインユーザーは60秒ポーリング（onSnapshotリスナー廃止でRead節約）
export function subscribeOnlineUsers(cb: (users: OnlineUser[]) => void): Unsubscribe {
  const POLL_INTERVAL = 60_000;
  const cutoff = () => Date.now() - 5 * 60 * 1000;
  const q = query(collection(db, COLLECTIONS.ONLINE), orderBy('lastSeen', 'desc'), limit(50));

  let timer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  const fetch = () => {
    getDocs(q).then(snap => {
      if (stopped) return;
      cb(snap.docs.map(d => d.data() as OnlineUser).filter(u => u.lastSeen > cutoff()));
    }).catch(() => {});
  };

  fetch(); // 初回即時
  timer = setInterval(fetch, POLL_INTERVAL);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
  };
}

export async function postBoardMessage(
  uid: string, displayName: string, level: number, text: string,
  poll?: { question: string; options: string[] }
) {
  const data: Record<string, unknown> = { uid, displayName, level, text: text.slice(0, 200), createdAt: Date.now(), reactions: {}, replies: [] };
  if (poll) data['poll'] = { question: poll.question, options: poll.options, votes: {} };
  await addDoc(collection(db, COLLECTIONS.BOARD), data);
}

export async function deleteBoardMessage(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.BOARD, id));
}

export async function addBoardReaction(id: string, emoji: string, uid: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.BOARD, id);
  await updateDoc(ref, { [`reactions.${emoji}`]: arrayUnion(uid) });
}

export async function removeBoardReaction(id: string, emoji: string, uid: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.BOARD, id);
  await updateDoc(ref, { [`reactions.${emoji}`]: arrayRemove(uid) });
}

export async function addBoardReply(id: string, reply: BoardReply): Promise<void> {
  const ref = doc(db, COLLECTIONS.BOARD, id);
  await updateDoc(ref, { replies: arrayUnion(reply) });
}

export async function voteBoardPoll(id: string, optionIndex: number, uid: string, prevOption?: number): Promise<void> {
  const ref = doc(db, COLLECTIONS.BOARD, id);
  const updates: Record<string, unknown> = { [`poll.votes.${uid}`]: optionIndex };
  await updateDoc(ref, updates);
  void prevOption; // track via votes map: uid->optionIndex
}

export function subscribeBoardMessages(cb: (msgs: BoardMessage[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.BOARD), orderBy('createdAt', 'desc'), limit(30));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<BoardMessage,'id'>) })));
  });
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

export async function cancelAuction(listingId: string, sellerUid: string): Promise<{ itemId: string; amount: number } | null> {
  const ref = doc(db, COLLECTIONS.AUCTIONS, listingId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data()['sellerUid'] !== sellerUid) return null;
  const data = snap.data() as AuctionListing;
  await deleteDoc(ref);
  return { itemId: data.itemId, amount: data.amount };
}

export function subscribeAuctions(cb: (listings: AuctionListing[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.AUCTIONS), orderBy('createdAt', 'desc'), limit(50));
  let stopped = false;
  const fetch = () => getDocs(q).then(snap => {
    if (stopped) return;
    const now = Date.now();
    cb(snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<AuctionListing,'id'>) }))
      .filter(l => l.expiresAt > now));
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 30_000);
  return () => { stopped = true; clearInterval(timer); };
}

export function subscribeSoldNotifications(uid: string, cb: (notifications: { id: string; itemId: string; amount: number; totalGold: number }[]) => void): Unsubscribe {
  const q = query(collection(db, 'sold_notifications'), where('sellerUid', '==', uid), orderBy('createdAt', 'desc'), limit(20));
  let stopped = false;
  const fetch = () => getDocs(q).then(snap => {
    if (stopped) return;
    cb(snap.docs
      .filter(d => d.data()['read'] === false)
      .map(d => ({ id: d.id, itemId: d.data()['itemId'] as string, amount: d.data()['amount'] as number, totalGold: d.data()['totalGold'] as number })));
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 60_000);
  return () => { stopped = true; clearInterval(timer); };
}

export async function markSoldNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'sold_notifications', notificationId), { read: true });
}

// ============================================================
// ジャックポット — ローカルバッファ+15秒flush
// ============================================================
const jackpotRef = () => doc(db, 'shared', 'jackpot');

// ローカル状態
let _localJackpotPool = 0;
let _pendingJackpotContrib = 0;
let _jackpotFlushTimer: ReturnType<typeof setTimeout> | null = null;

function _scheduleJackpotFlush() {
  if (_jackpotFlushTimer) return;
  _jackpotFlushTimer = setTimeout(async () => {
    _jackpotFlushTimer = null;
    const contrib = _pendingJackpotContrib;
    if (contrib <= 0) return;
    _pendingJackpotContrib = 0;
    try {
      await updateDoc(jackpotRef(), { pool: increment(contrib) });
    } catch {
      // ドキュメントが存在しない場合はsetDoc
      try { await setDoc(jackpotRef(), { pool: _localJackpotPool }); } catch { /* ignore */ }
    }
  }, 15_000);
}

export async function getJackpotPool(): Promise<number> {
  const snap = await getDoc(jackpotRef());
  const pool = snap.exists() ? (snap.data()['pool'] as number ?? 0) : 0;
  _localJackpotPool = pool + _pendingJackpotContrib;
  return _localJackpotPool;
}

export function subscribeJackpotPool(cb: (pool: number) => void): Unsubscribe {
  let stopped = false;
  const fetch = () => getDoc(jackpotRef()).then(snap => {
    if (stopped) return;
    const base = snap.exists() ? (snap.data()['pool'] as number ?? 0) : 0;
    _localJackpotPool = base;
    cb(_localJackpotPool);
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 10_000);
  return () => { stopped = true; clearInterval(timer); };
}

// 他のギャンブルで賭けるたびにプールへ積立（ローカル積算+15秒flush）
export async function contributeToJackpot(bet: number): Promise<number> {
  const contrib = calcJackpotContrib(bet);
  _pendingJackpotContrib += contrib;
  _localJackpotPool += contrib;
  _scheduleJackpotFlush();
  return _localJackpotPool;
}

// ジャックポット当選チェック（ローカルpool値を使用、当選時のみWrite）
export async function checkJackpotWin(): Promise<{ won: boolean; pool: number }> {
  const won = rollJackpot();
  if (!won) return { won: false, pool: 0 };
  const pool = _localJackpotPool;
  if (pool > 0) {
    _localJackpotPool = 0;
    _pendingJackpotContrib = 0;
    if (_jackpotFlushTimer) { clearTimeout(_jackpotFlushTimer); _jackpotFlushTimer = null; }
    try { await setDoc(jackpotRef(), { pool: 0 }); } catch { /* ignore */ }
  }
  return { won, pool };
}

// 旧API互換
export async function contributeAndRollJackpot(bet: number): Promise<{ won: boolean; pool: number }> {
  await contributeToJackpot(bet);
  return checkJackpotWin();
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
  const q = query(
    collection(db, COLLECTIONS.BATTLES),
    where('status', '==', 'waiting'),
    limit(50)
  );
  let stopped = false;
  const fetch = () => getDocs(q).then(snap => {
    if (stopped) return;
    const now = Date.now();
    cb(snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<GambleBattle,'id'>) }))
      .filter(b => b.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt));
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 10_000);
  return () => { stopped = true; clearInterval(timer); };
}

function _rollDice(n = 6) { return Math.floor(Math.random() * n) + 1; }

function _resolveChohan(): { hostWins: boolean; battleData: import('../types/game').ChohanBattleData } {
  const hostDice: [number, number] = [_rollDice(), _rollDice()];
  const guestDice: [number, number] = [_rollDice(), _rollDice()];
  return {
    hostWins: (hostDice[0] + hostDice[1]) % 2 === 0, // 偶数=丁=ホスト勝ち
    battleData: { type: 'chohan', hostDice, guestDice },
  };
}

function _chinchiroScore(dice: number[]): number {
  const d = dice.slice().sort((a,b)=>a-b);
  if (d[0]===1 && d[1]===1 && d[2]===1) return 1000;
  if (d[0]===1 && d[1]===2 && d[2]===3) return -1;
  if (d[0]===4 && d[1]===5 && d[2]===6) return 500;
  if (d[0]===d[1] && d[1]===d[2]) return 300 + d[0];
  const counts: Record<number,number> = {};
  for (const v of d) counts[v] = (counts[v]??0)+1;
  const singles = Object.entries(counts).filter(([,c])=>c===1).map(([v])=>Number(v));
  const pairs = Object.entries(counts).filter(([,c])=>c===2);
  if (pairs.length === 1 && singles.length === 1) return singles[0];
  return 0;
}

function _chinchiroRoleName(score: number): string {
  if (score === 1000) return 'ピンゾロ';
  if (score === -1) return 'ヒフミ';
  if (score === 500) return 'シゴロ';
  if (score >= 301) return `アラシ(${score - 300})`;
  if (score >= 1) return `${score}の目`;
  return '目なし';
}

function _resolveChinchiro(): { hostWins: boolean; battleData: import('../types/game').ChinchiroBattleData } {
  const roll = () => [_rollDice(), _rollDice(), _rollDice()];
  let hostDice = roll(); let hostScore = _chinchiroScore(hostDice);
  for (let i = 1; i < 3 && hostScore === 0; i++) { hostDice = roll(); hostScore = _chinchiroScore(hostDice); }
  let guestDice = roll(); let guestScore = _chinchiroScore(guestDice);
  for (let i = 1; i < 3 && guestScore === 0; i++) { guestDice = roll(); guestScore = _chinchiroScore(guestDice); }
  let hostWins: boolean;
  if (hostScore >= 300 || hostScore === 500 || hostScore === 1000) hostWins = true;
  else if (hostScore === -1 || hostScore === 0) hostWins = false;
  else if (guestScore === -1 || guestScore === 0) hostWins = true;
  else if (hostScore === guestScore) hostWins = Math.random() < 0.5;
  else hostWins = hostScore > guestScore;
  return {
    hostWins,
    battleData: {
      type: 'chinchiro',
      hostDice, guestDice,
      hostRole: _chinchiroRoleName(hostScore),
      guestRole: _chinchiroRoleName(guestScore),
    },
  };
}

function _resolveCoinFlip(): { hostWins: boolean; battleData: import('../types/game').CoinFlipBattleData } {
  const flips: ('heads' | 'tails')[] = [];
  let hostWins = 0, guestWins = 0;
  for (let i = 0; i < 6; i++) {
    const face: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
    flips.push(face);
    // ホストは表(heads)を選ぶ
    if (face === 'heads') hostWins++; else guestWins++;
  }
  return {
    hostWins: hostWins >= guestWins,
    battleData: { type: 'coin_flip', flips },
  };
}

const SLOT_SYMBOLS = ['🍒','🍋','💎','7️⃣','🔔','💰'];
function _slotRank(reels: string[]): number {
  if (reels[0]===reels[1] && reels[1]===reels[2]) {
    return reels[0]==='7️⃣' ? 100 : reels[0]==='💎' ? 50 : SLOT_SYMBOLS.indexOf(reels[0]) + 10;
  }
  if (reels[0]===reels[1] || reels[1]===reels[2]) return 1;
  return 0;
}

function _resolveSlot(): { hostWins: boolean; battleData: import('../types/game').SlotBattleData } {
  const spin = () => [0,1,2].map(() => SLOT_SYMBOLS[Math.floor(Math.random()*SLOT_SYMBOLS.length)]);
  let hostReels = spin(); let hostRank = _slotRank(hostReels);
  for (let i = 1; i < 5 && hostRank === 0; i++) { hostReels = spin(); hostRank = _slotRank(hostReels); }
  let guestReels = spin(); let guestRank = _slotRank(guestReels);
  for (let i = 1; i < 5 && guestRank === 0; i++) { guestReels = spin(); guestRank = _slotRank(guestReels); }
  const hostWins = hostRank >= guestRank ? (hostRank > guestRank ? true : Math.random() < 0.5) : false;
  return {
    hostWins,
    battleData: { type: 'slot_machine', hostReels, guestReels },
  };
}

export async function joinGambleBattle(
  battleId: string,
  guestUid: string, guestName: string
): Promise<{ success: boolean; battle: GambleBattle | null }> {
  const ref = doc(db, COLLECTIONS.BATTLES, battleId);
  let finalBattle: GambleBattle | null = null;
  let success = false;

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new Error('not_found');
      const battle = { id: snap.id, ...(snap.data() as Omit<GambleBattle,'id'>) };
      if (battle.status !== 'waiting') throw new Error('not_waiting');
      if (battle.hostUid === guestUid) throw new Error('self_join');

      // ゲームタイプに応じた対戦ロジック
      const gt = battle.gambleType;
      let hostWins: boolean;
      let battleData: GambleBattleData;

      if (gt === 'chohan') {
        const r = _resolveChohan(); hostWins = r.hostWins; battleData = r.battleData;
      } else if (gt === 'chinchiro') {
        const r = _resolveChinchiro(); hostWins = r.hostWins; battleData = r.battleData;
      } else if (gt === 'coin_flip') {
        const r = _resolveCoinFlip(); hostWins = r.hostWins; battleData = r.battleData;
      } else if (gt === 'slot_machine') {
        const r = _resolveSlot(); hostWins = r.hostWins; battleData = r.battleData;
      } else {
        hostWins = Math.random() < 0.5;
        battleData = { type: 'coin_flip', flips: [hostWins ? 'heads' : 'tails'] };
      }

      const winnerId = hostWins ? battle.hostUid : guestUid;
      transaction.update(ref, { status: 'finished', guestUid, guestName, winnerId, battleData });

      finalBattle = { ...battle, guestUid, guestName, winnerId, battleData, status: 'finished' };
      success = true;
    });
  } catch {
    if (!finalBattle) {
      const snap = await getDoc(ref).catch(() => null);
      if (snap && snap.exists()) {
        finalBattle = { id: snap.id, ...(snap.data() as Omit<GambleBattle,'id'>) };
      }
    }
    return { success: false, battle: finalBattle };
  }

  if (finalBattle && success) {
    const battle = finalBattle as GambleBattle;
    const GAME_NAMES_JP: Record<string, string> = {
      chohan: '丁半', chinchiro: 'チンチロリン', coin_flip: 'コイントス', slot_machine: 'スロット',
    };
    const gameNameJp = GAME_NAMES_JP[battle.gambleType] ?? battle.gambleType;
    const winnerName = battle.winnerId === battle.hostUid ? battle.hostName : guestName;
    const loserName = battle.winnerId === battle.hostUid ? guestName : battle.hostName;
    postActivityFeed({
      uid: battle.winnerId!,
      displayName: winnerName,
      type: 'gamble_battle',
      message: `が${loserName}との${gameNameJp}対戦に勝利！${battle.betAmount.toLocaleString()}G獲得！`,
    }).catch(() => {});
    // 対戦履歴保存
    if (battle.battleData) {
      saveBattleHistory({
        battleId: battle.id,
        hostUid: battle.hostUid,
        hostName: battle.hostName,
        guestUid,
        guestName,
        gambleType: battle.gambleType,
        betAmount: battle.betAmount,
        winnerId: battle.winnerId!,
        battleData: battle.battleData,
        createdAt: Date.now(),
      }).catch(() => {});
    }
  }

  return { success, battle: finalBattle };
}

// ホストが自分のバトルの状態変化（finished）を監視するための購読
export function subscribeGambleBattle(battleId: string, cb: (battle: GambleBattle | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.BATTLES, battleId), snap => {
    if (!snap.exists()) { cb(null); return; }
    cb({ id: snap.id, ...(snap.data() as Omit<GambleBattle, 'id'>) });
  });
}

// 観戦: spectatorCount +1/-1
export async function joinSpectate(battleId: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.BATTLES, battleId);
  await updateDoc(ref, { spectatorCount: increment(1) }).catch(() => {});
}

export async function leaveSpectate(battleId: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.BATTLES, battleId);
  await updateDoc(ref, { spectatorCount: increment(-1) }).catch(() => {});
}

// 観戦: 進行中・終了済みバトル一覧購読
export function subscribeActiveBattles(cb: (battles: GambleBattle[]) => void): () => void {
  const q = query(
    collection(db, COLLECTIONS.BATTLES),
    where('status', 'in', ['active', 'finished']),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, snap => {
    const now = Date.now();
    const cutoff = now - 30 * 60 * 1000; // 30分以内
    cb(snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<GambleBattle,'id'>) }))
      .filter(b => b.createdAt > cutoff)
    );
  }, () => {});
}

// 観戦: 1バトルのリアルタイム購読
export function spectateGambleBattle(battleId: string, cb: (battle: GambleBattle | null) => void): () => void {
  return onSnapshot(doc(db, COLLECTIONS.BATTLES, battleId), snap => {
    if (!snap.exists()) { cb(null); return; }
    cb({ id: snap.id, ...(snap.data() as Omit<GambleBattle,'id'>) });
  }, () => {});
}

// 対戦履歴保存
export async function saveBattleHistory(entry: Omit<BattleHistoryEntry, 'id'>): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.BATTLE_HISTORY), entry).catch(() => {});
}

// 対戦履歴取得（最新30件）
export async function getBattleHistory(limit_n = 30): Promise<BattleHistoryEntry[]> {
  const q = query(
    collection(db, COLLECTIONS.BATTLE_HISTORY),
    orderBy('createdAt', 'desc'),
    limit(limit_n)
  );
  const snap = await getDocs(q).catch(() => null);
  if (!snap) return [];
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<BattleHistoryEntry,'id'>) }));
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
  inventory?: Record<string, number>;
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
  // ルール修正後は認証ユーザー全員がplayersコレクションを読み取り可能
  const unsub = onSnapshot(
    collection(db, 'players'),
    snap => {
      cb(snap.docs.map(d => {
        const data = d.data() as Partial<AdminPlayerData>;
        return { id: d.id, uid: data.uid ?? d.id, ...data } as AdminPlayerData;
      }));
    },
    err => {
      console.error('[subscribeAllPlayers] error:', err.code, err.message);
      cb([]);
    }
  );
  return unsub;
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
  const ref = doc(db, 'admin', 'gamble_settings');
  let stopped = false;
  const fetch = () => getDoc(ref).then(snap => {
    if (stopped) return;
    cb(snap.exists() ? (snap.data() as Record<string, number>) : {});
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 60_000);
  return () => { stopped = true; clearInterval(timer); };
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
  const ref = doc(db, 'admin', 'jackpot_settings');
  let stopped = false;
  const fetch = () => getDoc(ref).then(snap => {
    if (stopped) return;
    cb(snap.exists() ? ((snap.data() as { rate: number }).rate ?? 0.20) : 0.20);
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 60_000);
  return () => { stopped = true; clearInterval(timer); };
}

// お知らせ履歴
export interface AnnouncementRecord {
  id: string;
  text: string;
  timestamp: number;
  imageUrl?: string;
}

export async function getAnnouncementHistory(): Promise<AnnouncementRecord[]> {
  try {
    const { query, collection: col, orderBy: ob, limit: lim, getDocs } = await import('firebase/firestore');
    const q = query(col(db, 'announcements'), ob('timestamp', 'desc'), lim(30));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AnnouncementRecord,'id'>) }));
  } catch { return []; }
}

export async function saveAnnouncementToHistory(text: string, imageUrl?: string): Promise<void> {
  const { addDoc, collection: col } = await import('firebase/firestore');
  await addDoc(col(db, 'announcements'), { text, timestamp: Date.now(), ...(imageUrl ? { imageUrl } : {}) });
}

export async function deleteAnnouncementRecord(id: string): Promise<void> {
  const { doc: d, deleteDoc: del } = await import('firebase/firestore');
  await del(d(db, 'announcements', id));
}

export async function updateAnnouncementRecord(id: string, text: string, imageUrl?: string): Promise<void> {
  const { doc: d, updateDoc: upd } = await import('firebase/firestore');
  await upd(d(db, 'announcements', id), { text, ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}) });
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

// ============================================================
// ActivityFeed — バッファ+15秒flush（Read+Write毎回→15秒に1Write）
// ============================================================
let _feedBuffer: Omit<ActivityFeedEntry, 'timestamp'>[] = [];
let _feedFlushTimer: ReturnType<typeof setTimeout> | null = null;

async function _flushFeed() {
  _feedFlushTimer = null;
  if (_feedBuffer.length === 0) return;
  const toWrite = _feedBuffer.map(e => ({ ...e, timestamp: Date.now() }));
  _feedBuffer = [];
  try {
    const snap = await getDoc(FEED_REF());
    const prev: ActivityFeedEntry[] = snap.exists() ? ((snap.data()['entries'] ?? []) as ActivityFeedEntry[]) : [];
    const next = [...toWrite, ...prev].slice(0, 50);
    await setDoc(FEED_REF(), { entries: next, updatedAt: Date.now() });
  } catch { /* ignore */ }
}

/** アクティビティをフィードに追記（バッファして15秒に1回まとめてWrite） */
export async function postActivityFeed(entry: Omit<ActivityFeedEntry, 'timestamp'>): Promise<void> {
  _feedBuffer.unshift(entry);
  if (_feedBuffer.length > 10) _feedBuffer = _feedBuffer.slice(0, 10); // バッファ上限
  if (!_feedFlushTimer) {
    _feedFlushTimer = setTimeout(_flushFeed, 15_000);
  }
}

/** アクティビティフィードをポーリング購読（60秒間隔） */
export function subscribeActivityFeed(cb: (entries: ActivityFeedEntry[]) => void): Unsubscribe {
  let stopped = false;
  const fetch = () => getDoc(FEED_REF()).then(snap => {
    if (stopped) return;
    cb(snap.exists() ? ((snap.data()['entries'] ?? []) as ActivityFeedEntry[]) : []);
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 60_000);
  return () => { stopped = true; clearInterval(timer); };
}

// ============================================================
// テキサスホールデム ポーカーテーブル
// ============================================================

const SUITS: PokerCard['suit'][] = ['S','H','D','C'];
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

function _makeDeck(): PokerCard[] {
  const deck: PokerCard[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  return deck;
}

function _shuffle(deck: PokerCard[]): PokerCard[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ハンドランク評価
function _rankVal(r: string): number {
  return ['2','3','4','5','6','7','8','9','10','J','Q','K','A'].indexOf(r);
}

function _evaluateHand(cards: PokerCard[]): { rank: number; name: string; tiebreaker: number[] } {
  // 7枚から最強5枚を選ぶ（全組み合わせ評価）
  const combos: PokerCard[][] = [];
  for (let i = 0; i < cards.length - 4; i++)
    for (let j = i+1; j < cards.length - 3; j++)
      for (let k = j+1; k < cards.length - 2; k++)
        for (let l = k+1; l < cards.length - 1; l++)
          for (let m = l+1; m < cards.length; m++)
            combos.push([cards[i],cards[j],cards[k],cards[l],cards[m]]);

  let best = { rank: -1, name: 'ハイカード', tiebreaker: [0] };
  for (const combo of combos) {
    const r = _eval5(combo);
    if (r.rank > best.rank || (r.rank === best.rank && _compareTie(r.tiebreaker, best.tiebreaker) > 0)) {
      best = r;
    }
  }
  return best;
}

function _compareTie(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function _eval5(cards: PokerCard[]): { rank: number; name: string; tiebreaker: number[] } {
  const vals = cards.map(c => _rankVal(c.rank)).sort((a,b) => b-a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  const isStr8 = vals[0]-vals[4] === 4 && new Set(vals).size === 5;
  // 特殊ストレート: A-2-3-4-5
  const isWheel = vals[0]===12 && vals[1]===3 && vals[2]===2 && vals[3]===1 && vals[4]===0;
  const counts: Record<number,number> = {};
  for (const v of vals) counts[v] = (counts[v]??0)+1;
  const groups = Object.entries(counts).map(([v,c]) => ({ v: Number(v), c })).sort((a,b) => b.c-a.c || b.v-a.v);

  if (isFlush && (isStr8 || isWheel)) {
    if (vals[0] === 12 && isStr8) return { rank: 9, name: 'ロイヤルフラッシュ', tiebreaker: vals };
    return { rank: 8, name: 'ストレートフラッシュ', tiebreaker: isWheel ? [3,2,1,0,-1] : vals };
  }
  if (groups[0].c === 4) return { rank: 7, name: 'フォーカード', tiebreaker: [groups[0].v, groups[1].v] };
  if (groups[0].c === 3 && groups[1].c === 2) return { rank: 6, name: 'フルハウス', tiebreaker: [groups[0].v, groups[1].v] };
  if (isFlush) return { rank: 5, name: 'フラッシュ', tiebreaker: vals };
  if (isStr8 || isWheel) return { rank: 4, name: 'ストレート', tiebreaker: isWheel ? [3,2,1,0,-1] : vals };
  if (groups[0].c === 3) return { rank: 3, name: 'スリーカード', tiebreaker: [groups[0].v, groups[1].v, groups[2].v] };
  if (groups[0].c === 2 && groups[1].c === 2) return { rank: 2, name: 'ツーペア', tiebreaker: [groups[0].v, groups[1].v, groups[2].v] };
  if (groups[0].c === 2) return { rank: 1, name: 'ワンペア', tiebreaker: [groups[0].v, groups[1].v, groups[2].v, groups[3].v] };
  return { rank: 0, name: 'ハイカード', tiebreaker: vals };
}

/** テキサスホールデムテーブルを作成 */
export async function createPokerTable(
  hostUid: string, hostName: string, hostLevel: number,
  maxPlayers: number, buyIn: number
): Promise<string> {
  const hostPlayer: PokerPlayer = {
    uid: hostUid, displayName: hostName, level: hostLevel,
    chips: buyIn, bet: 0, hand: [], folded: false, allIn: false, isReady: false,
  };
  const ref = await addDoc(collection(db, COLLECTIONS.POKER), {
    hostUid, hostName, hostLevel, maxPlayers, buyIn,
    status: 'waiting',
    phase: 'waiting',
    players: [hostPlayer],
    communityCards: [],
    pot: 0,
    currentTurnUid: '',
    smallBlindUid: '',
    bigBlindUid: '',
    dealerUid: '',
    currentBet: 0,
    deck: [],
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000,
    lastActionAt: Date.now(),
  } as Omit<PokerTable,'id'>);
  return ref.id;
}

/** テーブル一覧をリアルタイム購読 */
export function subscribePokerTables(cb: (tables: PokerTable[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.POKER), where('status', '==', 'waiting'), limit(20));
  return onSnapshot(q, snap => {
    const now = Date.now();
    const tables = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<PokerTable,'id'>) }))
      .filter(t => t.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
    cb(tables);
  });
}

/** 特定テーブルをリアルタイム購読 */
export function subscribePokerTable(tableId: string, cb: (table: PokerTable | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.POKER, tableId), snap => {
    if (!snap.exists()) { cb(null); return; }
    cb({ id: snap.id, ...(snap.data() as Omit<PokerTable,'id'>) });
  });
}

/** テーブルに参加 */
export async function joinPokerTable(
  tableId: string, uid: string, displayName: string, level: number, buyIn: number
): Promise<{ success: boolean; message?: string }> {
  const ref = doc(db, COLLECTIONS.POKER, tableId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, message: 'テーブルが見つかりません' };
  const table = { id: snap.id, ...(snap.data() as Omit<PokerTable,'id'>) };
  if (table.status !== 'waiting') return { success: false, message: 'ゲームは既に開始しています' };
  if (table.players.some(p => p.uid === uid)) return { success: false, message: '既に参加しています' };
  if (table.players.length >= table.maxPlayers) return { success: false, message: '満員です' };

  const newPlayer: PokerPlayer = {
    uid, displayName, level, chips: buyIn, bet: 0, hand: [], folded: false, allIn: false, isReady: false,
  };
  const newPlayers = [...table.players, newPlayer];
  await updateDoc(ref, { players: newPlayers, lastActionAt: Date.now() });
  return { success: true };
}

/** テーブルを取り消す（ホストのみ・waiting状態限定） */
export async function cancelPokerTable(tableId: string, hostUid: string): Promise<boolean> {
  const ref = doc(db, COLLECTIONS.POKER, tableId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data()['hostUid'] !== hostUid) return false;
  if (snap.data()['status'] !== 'waiting') return false;
  await deleteDoc(ref);
  return true;
}

/** テーブルから退出（waiting状態限定） */
export async function leavePokerTable(tableId: string, uid: string): Promise<boolean> {
  const ref = doc(db, COLLECTIONS.POKER, tableId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const table = { id: snap.id, ...(snap.data() as Omit<PokerTable,'id'>) };
  if (table.status !== 'waiting') return false;
  const newPlayers = table.players.filter(p => p.uid !== uid);
  if (newPlayers.length === 0) { await deleteDoc(ref); return true; }
  await updateDoc(ref, { players: newPlayers, lastActionAt: Date.now() });
  return true;
}

/** ゲームを開始（ホストのみ・2人以上） */
export async function startPokerGame(tableId: string, hostUid: string): Promise<{ success: boolean; message?: string }> {
  const ref = doc(db, COLLECTIONS.POKER, tableId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, message: 'テーブルが見つかりません' };
  const table = { id: snap.id, ...(snap.data() as Omit<PokerTable,'id'>) };
  if (table.hostUid !== hostUid) return { success: false, message: '権限がありません' };
  if (table.players.length < 2) return { success: false, message: '最低2人必要です' };
  if (table.status !== 'waiting') return { success: false, message: '既に開始しています' };

  const deck = _shuffle(_makeDeck());
  const players = table.players.map(p => ({ ...p, bet: 0, folded: false, allIn: false, isReady: false, hand: [] as PokerCard[] }));

  // 手札を2枚ずつ配る
  let deckIdx = 0;
  for (const p of players) { p.hand = [deck[deckIdx++], deck[deckIdx++]]; }

  // ブラインド設定
  const smallBlind = Math.max(1, Math.floor(table.buyIn * 0.01)); // buyInの1%
  const bigBlind = smallBlind * 2;
  const dealerIdx = 0;
  const sbIdx = (dealerIdx + 1) % players.length;
  const bbIdx = (dealerIdx + 2) % players.length;
  const firstActIdx = (dealerIdx + 3) % players.length;

  players[sbIdx].chips -= smallBlind;
  players[sbIdx].bet = smallBlind;
  players[bbIdx].chips -= bigBlind;
  players[bbIdx].bet = bigBlind;

  const remainingDeck = deck.slice(deckIdx);

  await updateDoc(ref, {
    status: 'playing',
    phase: 'preflop',
    players,
    deck: remainingDeck,
    communityCards: [],
    pot: smallBlind + bigBlind,
    currentBet: bigBlind,
    dealerUid: players[dealerIdx].uid,
    smallBlindUid: players[sbIdx].uid,
    bigBlindUid: players[bbIdx].uid,
    currentTurnUid: players[firstActIdx].uid,
    lastActionAt: Date.now(),
  });
  return { success: true };
}

/** プレイヤーアクション: fold / check / call / raise */
export async function pokerAction(
  tableId: string, uid: string,
  action: 'fold' | 'check' | 'call' | 'raise' | 'allin',
  raiseAmount?: number
): Promise<{ success: boolean; message?: string }> {
  const ref = doc(db, COLLECTIONS.POKER, tableId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, message: 'テーブルが見つかりません' };
  const table = { id: snap.id, ...(snap.data() as Omit<PokerTable,'id'>) };
  if (table.currentTurnUid !== uid) return { success: false, message: 'あなたのターンではありません' };

  const players = table.players.map(p => ({ ...p }));
  const pidx = players.findIndex(p => p.uid === uid);
  if (pidx < 0) return { success: false, message: 'プレイヤーが見つかりません' };
  const me = players[pidx];

  let pot = table.pot;
  let currentBet = table.currentBet;

  if (action === 'fold') {
    me.folded = true;
  } else if (action === 'check') {
    if (me.bet < currentBet) return { success: false, message: 'チェックできません' };
  } else if (action === 'call') {
    const toCall = currentBet - me.bet;
    const actual = Math.min(toCall, me.chips);
    me.chips -= actual;
    me.bet += actual;
    pot += actual;
    if (me.chips === 0) me.allIn = true;
  } else if (action === 'raise') {
    if (!raiseAmount) return { success: false, message: 'レイズ額が必要です' };
    const toCall = currentBet - me.bet;
    const total = toCall + raiseAmount;
    if (me.chips < total) return { success: false, message: 'チップが足りません' };
    me.chips -= total;
    me.bet += total;
    pot += total;
    currentBet = me.bet;
  } else if (action === 'allin') {
    const allInAmt = me.chips;
    me.bet += allInAmt;
    pot += allInAmt;
    me.chips = 0;
    me.allIn = true;
    if (me.bet > currentBet) currentBet = me.bet;
  }

  // 次のプレイヤーを決定
  const activePlayers = players.filter(p => !p.folded);
  const { nextTurnUid, shouldAdvancePhase } = _getNextTurn(players, pidx, currentBet);

  let updates: Record<string, unknown> = { players, pot, currentBet, currentTurnUid: nextTurnUid, lastActionAt: Date.now() };

  // フォールドで1人残ったら終了
  if (activePlayers.filter(p => p.uid !== uid || !me.folded).length === 1) {
    const winner = activePlayers.find(p => !p.folded || p.uid !== uid) ?? activePlayers[0];
    const winnerIdx = players.findIndex(p => p.uid === winner.uid);
    players[winnerIdx].chips += pot;
    updates = { ...(await _finishGame(table, players, pot, ref)), players, lastActionAt: Date.now() };
    await updateDoc(ref, updates);
    return { success: true };
  }

  if (shouldAdvancePhase) {
    // 全員オールイン→残りフェーズを一気に展開してショーダウン
    const allInOrFolded = players.every(p => p.folded || p.allIn);
    if (allInOrFolded) {
      const deck2 = table.deck as PokerCard[];
      let newDeck2 = [...deck2];
      let newCommunity2 = [...table.communityCards];
      let cur = table.phase;
      while (newCommunity2.length < 5) {
        const nxt = _nextPhase(cur);
        if (nxt === 'showdown') break;
        if (nxt === 'flop') { newCommunity2.push(newDeck2[0], newDeck2[1], newDeck2[2]); newDeck2 = newDeck2.slice(3); }
        else if (nxt === 'turn' || nxt === 'river') { newCommunity2.push(newDeck2[0]); newDeck2 = newDeck2.slice(1); }
        cur = nxt as PokerPhase;
      }
      const tableForShowdown = { ...table, communityCards: newCommunity2, deck: newDeck2 };
      const finalUpdates2 = await _resolveShowdown(tableForShowdown, players.map(p => ({ ...p, bet: 0 })), pot, ref);
      await updateDoc(ref, { ...finalUpdates2, lastActionAt: Date.now() });
      return { success: true };
    }
    const nextPhase = _nextPhase(table.phase);
    if (nextPhase === 'showdown') {
      const finalUpdates = await _resolveShowdown(table, players, pot, ref);
      await updateDoc(ref, { ...finalUpdates, lastActionAt: Date.now() });
      return { success: true };
    }
    // 新フェーズ用のコミュニティカードを追加
    const deck = table.deck as PokerCard[];
    const newCommunity = [...table.communityCards];
    let newDeck = [...deck];
    if (nextPhase === 'flop') { newCommunity.push(newDeck[0], newDeck[1], newDeck[2]); newDeck = newDeck.slice(3); }
    else if (nextPhase === 'turn' || nextPhase === 'river') { newCommunity.push(newDeck[0]); newDeck = newDeck.slice(1); }
    // 新フェーズではベットをリセット
    const resetPlayers = players.map(p => ({ ...p, bet: 0 }));
    const firstActIdx = resetPlayers.findIndex(p => !p.folded && !p.allIn);
    updates = { ...updates, players: resetPlayers, communityCards: newCommunity, deck: newDeck,
      phase: nextPhase, currentBet: 0, currentTurnUid: firstActIdx >= 0 ? resetPlayers[firstActIdx].uid : '' };
  }

  await updateDoc(ref, updates);
  return { success: true };
}

function _getNextTurn(players: PokerPlayer[], currentIdx: number, currentBet: number): { nextTurnUid: string; shouldAdvancePhase: boolean } {
  const n = players.length;
  const activePlayers = players.filter(p => !p.folded && !p.allIn);

  // 全員がcurrentBetに追いついているか確認
  const allMatched = activePlayers.every(p => p.bet >= currentBet || p.allIn);

  if (allMatched) {
    // 次のアクティブプレイヤーを探す（折り返しても全員確認）
    for (let i = 1; i <= n; i++) {
      const idx = (currentIdx + i) % n;
      if (!players[idx].folded && !players[idx].allIn) {
        // このプレイヤーが既にcurrentBetに追いついていれば、フェーズ進行
        if (players[idx].bet >= currentBet) {
          return { nextTurnUid: '', shouldAdvancePhase: true };
        }
        return { nextTurnUid: players[idx].uid, shouldAdvancePhase: false };
      }
    }
    return { nextTurnUid: '', shouldAdvancePhase: true };
  }

  // まだ追いついていないプレイヤーを探す
  for (let i = 1; i <= n; i++) {
    const idx = (currentIdx + i) % n;
    if (!players[idx].folded && !players[idx].allIn) {
      return { nextTurnUid: players[idx].uid, shouldAdvancePhase: false };
    }
  }
  return { nextTurnUid: '', shouldAdvancePhase: true };
}

function _nextPhase(current: string): string {
  const order = ['preflop','flop','turn','river','showdown'];
  const idx = order.indexOf(current);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 'showdown';
}

async function _resolveShowdown(
  table: PokerTable, players: PokerPlayer[], pot: number,
  ref: ReturnType<typeof doc>
): Promise<Record<string, unknown>> {
  const active = players.filter(p => !p.folded);
  const community = table.communityCards;

  const ranked = active.map(p => {
    const all = [...p.hand, ...community];
    const ev = _evaluateHand(all);
    return { ...p, ev };
  }).sort((a,b) => {
    const rd = b.ev.rank - a.ev.rank;
    if (rd !== 0) return rd;
    return _compareTie(b.ev.tiebreaker, a.ev.tiebreaker);
  });

  // 勝者にポット付与
  const winners = _splitPot(ranked, pot);
  const updatedPlayers = players.map(p => {
    const w = winners.find(w => w.uid === p.uid);
    return w ? { ...p, chips: p.chips + w.amount } : p;
  });

  return await _finishGame(table, updatedPlayers, pot, ref, winners.map(w => ({
    uid: w.uid,
    displayName: players.find(p => p.uid === w.uid)?.displayName ?? '',
    amount: w.amount,
    handName: ranked.find(r => r.uid === w.uid)?.ev.name ?? '',
  })));
}

function _splitPot(ranked: (PokerPlayer & { ev: ReturnType<typeof _evaluateHand> })[], pot: number) {
  // 同着の場合は均等分配
  const topRank = ranked[0].ev.rank;
  const topTie = ranked[0].ev.tiebreaker;
  const winners = ranked.filter(p => p.ev.rank === topRank && _compareTie(p.ev.tiebreaker, topTie) === 0);
  const each = Math.floor(pot / winners.length);
  return winners.map(w => ({ uid: w.uid, amount: each }));
}

async function _finishGame(
  _table: PokerTable, players: PokerPlayer[], _pot: number,
  _ref: ReturnType<typeof doc>,
  winners?: { uid: string; displayName: string; amount: number; handName: string }[]
): Promise<Record<string, unknown>> {
  return {
    status: 'finished',
    phase: 'finished',
    players,
    winners: winners ?? [],
    currentTurnUid: '',
  };
}

// ============================================================
// アイテム価格管理 (admin/item_prices)
// ============================================================
export interface ItemPriceOverride {
  buyPrice: number;
  sellPrice: number;
}

export async function getItemPrices(): Promise<Record<string, ItemPriceOverride>> {
  try {
    const snap = await getDoc(doc(db, 'admin', 'item_prices'));
    return snap.exists() ? (snap.data() as Record<string, ItemPriceOverride>) : {};
  } catch { return {}; }
}

export async function setItemPrices(prices: Record<string, ItemPriceOverride>): Promise<void> {
  await setDoc(doc(db, 'admin', 'item_prices'), prices);
}

export function subscribeItemPrices(cb: (prices: Record<string, ItemPriceOverride>) => void): () => void {
  return onSnapshot(doc(db, 'admin', 'item_prices'), snap => {
    cb(snap.exists() ? (snap.data() as Record<string, ItemPriceOverride>) : {});
  });
}

// ============================================================
// 提案システム (proposals)
// ============================================================
export interface Proposal {
  id: string;
  uid: string;
  displayName: string;
  title: string;
  body: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
}

export async function submitProposal(proposal: Omit<Proposal, 'id' | 'status' | 'createdAt'>): Promise<void> {
  const { addDoc, collection } = await import('firebase/firestore');
  await addDoc(collection(db, 'proposals'), {
    ...proposal,
    status: 'pending',
    createdAt: Date.now(),
  });
}

export function subscribeProposals(cb: (proposals: Proposal[]) => void): () => void {
  return onSnapshot(
    query(collection(db, 'proposals'), orderBy('createdAt', 'desc')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal)))
  );
}

export async function updateProposalStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
  const { updateDoc, doc: firestoreDoc } = await import('firebase/firestore');
  await updateDoc(firestoreDoc(db, 'proposals', id), { status });
}

// ============================================================
// 宝箱確率オーバーライド
// ============================================================
export interface TreasureProbEntry { label: string; probability: number; }

export async function getTreasureProbs(): Promise<TreasureProbEntry[] | null> {
  try {
    const snap = await getDoc(doc(db, 'admin', 'treasure_probs'));
    return snap.exists() ? (snap.data().entries as TreasureProbEntry[]) : null;
  } catch { return null; }
}

export async function setTreasureProbs(entries: TreasureProbEntry[]): Promise<void> {
  await setDoc(doc(db, 'admin', 'treasure_probs'), { entries });
}

export function subscribeTreasureProbs(cb: (entries: TreasureProbEntry[] | null) => void): () => void {
  return onSnapshot(doc(db, 'admin', 'treasure_probs'), snap => {
    cb(snap.exists() ? (snap.data().entries as TreasureProbEntry[]) : null);
  });
}

// ============================================================
// 取引レシピ管理
// ============================================================
export interface TradeRecipeInput { itemId: string; amount: number; }
export interface TradeRecipe {
  id: string;
  name: string;
  description: string;
  inputs: TradeRecipeInput[];
  outputItemId: string;
  outputAmount: number;
}

export async function getTradeRecipes(): Promise<TradeRecipe[] | null> {
  try {
    const snap = await getDoc(doc(db, 'admin', 'trade_recipes'));
    return snap.exists() ? (snap.data().recipes as TradeRecipe[]) : null;
  } catch { return null; }
}

export async function setTradeRecipes(recipes: TradeRecipe[]): Promise<void> {
  await setDoc(doc(db, 'admin', 'trade_recipes'), { recipes });
}

export function subscribeTradeRecipes(cb: (recipes: TradeRecipe[] | null) => void): () => void {
  return onSnapshot(doc(db, 'admin', 'trade_recipes'), snap => {
    cb(snap.exists() ? (snap.data().recipes as TradeRecipe[]) : null);
  });
}

// ============================================================
// ダンジョン・モンスターオーバーライド
// ============================================================
export interface MonsterOverride {
  id: string;
  maxHp?: number;
  attack?: number;
  defense?: number;
  baseExp?: number;
  baseGold?: number;
  specialAttack?: string;
  drops?: { itemId: string; baseRate: number; minAmount: number; maxAmount: number }[];
}

export interface DungeonAreaOverride {
  name: string;
  monsters: { monsterId: string; count: number; isBoss?: boolean; isMidBoss?: boolean }[];
  isHardArea?: boolean;
  description?: string;
}

export interface DungeonOverride {
  id: string;
  areas?: DungeonAreaOverride[];
}

export async function getMonsterOverrides(): Promise<Record<string, MonsterOverride> | null> {
  try {
    const snap = await getDoc(doc(db, 'admin', 'monster_overrides'));
    return snap.exists() ? (snap.data().overrides as Record<string, MonsterOverride>) : null;
  } catch { return null; }
}

export async function setMonsterOverrides(overrides: Record<string, MonsterOverride>): Promise<void> {
  await setDoc(doc(db, 'admin', 'monster_overrides'), { overrides });
}

export function subscribeMonsterOverrides(cb: (o: Record<string, MonsterOverride> | null) => void): () => void {
  return onSnapshot(doc(db, 'admin', 'monster_overrides'), snap => {
    cb(snap.exists() ? (snap.data().overrides as Record<string, MonsterOverride>) : null);
  });
}

export async function getDungeonOverrides(): Promise<Record<string, DungeonOverride> | null> {
  try {
    const snap = await getDoc(doc(db, 'admin', 'dungeon_overrides'));
    return snap.exists() ? (snap.data().overrides as Record<string, DungeonOverride>) : null;
  } catch { return null; }
}

export async function setDungeonOverrides(overrides: Record<string, DungeonOverride>): Promise<void> {
  await setDoc(doc(db, 'admin', 'dungeon_overrides'), { overrides });
}

export function subscribeDungeonOverrides(cb: (o: Record<string, DungeonOverride> | null) => void): () => void {
  return onSnapshot(doc(db, 'admin', 'dungeon_overrides'), snap => {
    cb(snap.exists() ? (snap.data().overrides as Record<string, DungeonOverride>) : null);
  });
}

// ============================================================
// ギャンブルランキング
// ============================================================
export interface GambleRankingEntry {
  uid: string;
  displayName: string;
  weeklyWon: number;
  monthlyWon: number;
  totalWon: number;
  updatedAt: number;
}

export async function updateGambleRanking(uid: string, displayName: string, wonAmount: number): Promise<void> {
  if (wonAmount <= 0) return;
  try {
    const ref = doc(db, 'gamble_ranking', uid);
    const snap = await getDoc(ref);
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
    if (snap.exists()) {
      const d = snap.data() as GambleRankingEntry & { weeklyResetAt?: number; monthlyResetAt?: number };
      const weeklyReset = d.weeklyResetAt ?? 0;
      const monthlyReset = d.monthlyResetAt ?? 0;
      const newWeekly = now - weeklyReset > ONE_WEEK ? wonAmount : (d.weeklyWon ?? 0) + wonAmount;
      const newMonthly = now - monthlyReset > ONE_MONTH ? wonAmount : (d.monthlyWon ?? 0) + wonAmount;
      await setDoc(ref, {
        uid, displayName,
        weeklyWon: newWeekly,
        monthlyWon: newMonthly,
        totalWon: (d.totalWon ?? 0) + wonAmount,
        weeklyResetAt: now - weeklyReset > ONE_WEEK ? now : weeklyReset,
        monthlyResetAt: now - monthlyReset > ONE_MONTH ? now : monthlyReset,
        updatedAt: now,
      });
    } else {
      await setDoc(ref, {
        uid, displayName,
        weeklyWon: wonAmount,
        monthlyWon: wonAmount,
        totalWon: wonAmount,
        weeklyResetAt: now,
        monthlyResetAt: now,
        updatedAt: now,
      });
    }
  } catch { /* ignore */ }
}

export function subscribeGambleRanking(cb: (entries: GambleRankingEntry[]) => void): () => void {
  const q = query(collection(db, 'gamble_ranking'), orderBy('totalWon', 'desc'), limit(50));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => d.data() as GambleRankingEntry));
  }, () => cb([]));
}

// ============================================================
// スロット台別ジャックポットプール
// ============================================================
const _slotLocalPools: Record<number, number> = {};
const _slotPendingContribs: Record<number, number> = {};
const _slotFlushTimers: Record<number, ReturnType<typeof setTimeout> | null> = {};

function slotJackpotRef(tier: number) { return doc(db, 'slot_jackpot', `tier_${tier}`); }

function _scheduleSlotFlush(tier: number) {
  if (_slotFlushTimers[tier]) return;
  _slotFlushTimers[tier] = setTimeout(async () => {
    _slotFlushTimers[tier] = null;
    const contrib = _slotPendingContribs[tier] ?? 0;
    if (contrib <= 0) return;
    _slotPendingContribs[tier] = 0;
    try {
      await updateDoc(slotJackpotRef(tier), { pool: increment(contrib) });
    } catch {
      try { await setDoc(slotJackpotRef(tier), { pool: _slotLocalPools[tier] ?? 0 }); } catch { /* ignore */ }
    }
  }, 15_000);
}

export async function contributeToSlotJackpot(tier: number, bet: number): Promise<number> {
  const contrib = Math.floor(bet * 0.01);
  _slotPendingContribs[tier] = (_slotPendingContribs[tier] ?? 0) + contrib;
  _slotLocalPools[tier] = (_slotLocalPools[tier] ?? 0) + contrib;
  _scheduleSlotFlush(tier);
  return _slotLocalPools[tier];
}

export function subscribeSlotJackpotPool(tier: number, cb: (pool: number) => void): () => void {
  let stopped = false;
  const fetch = () => getDoc(slotJackpotRef(tier)).then(snap => {
    if (stopped) return;
    const base = snap.exists() ? (snap.data()['pool'] as number ?? 0) : 0;
    _slotLocalPools[tier] = base;
    cb(base);
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 15_000);
  return () => { stopped = true; clearInterval(timer); };
}

export async function checkSlotJackpotWin(tier: number): Promise<{ won: boolean; pool: number }> {
  const won = rollJackpot();
  if (!won) return { won: false, pool: 0 };
  const pool = _slotLocalPools[tier] ?? 0;
  if (pool > 0) {
    _slotLocalPools[tier] = 0;
    _slotPendingContribs[tier] = 0;
    if (_slotFlushTimers[tier]) { clearTimeout(_slotFlushTimers[tier]!); _slotFlushTimers[tier] = null; }
    try { await setDoc(slotJackpotRef(tier), { pool: 0 }); } catch { /* ignore */ }
  }
  return { won, pool };
}

// ============================================================
// プレイヤー状態管理（画面遷移時のみ更新）
// ============================================================
export type PlayerActivityCode =
  | 'home' | 'dungeon_cave' | 'dungeon_goblin' | 'dungeon_fortress'
  | 'dungeon_underground' | 'dungeon_garden' | 'dungeon_ice'
  | 'dungeon_sky' | 'dungeon_sky_ex' | 'dungeon_volcano'
  | 'boss_kx' | 'boss_rei' | 'mining' | 'fishing' | 'gambling'
  | 'pvp_waiting' | 'pvp_battle' | 'market' | 'crafting' | 'other';

export const ACTIVITY_LABELS: Record<PlayerActivityCode, string> = {
  home: 'ホーム画面',
  dungeon_cave: '始まりの洞窟攻略中',
  dungeon_goblin: 'ゴブリンの巣窟攻略中',
  dungeon_fortress: '要塞攻略中',
  dungeon_underground: '地下要塞攻略中',
  dungeon_garden: '箱庭庭園攻略中',
  dungeon_ice: '冷焦洞穴攻略中',
  dungeon_sky: '天空城攻略中',
  dungeon_sky_ex: '天空城EX攻略中',
  dungeon_volcano: '火山攻略中',
  boss_kx: 'KX戦闘中',
  boss_rei: '零戦闘中',
  mining: '採掘中',
  fishing: '釣り中',
  gambling: 'ギャンブル中',
  pvp_waiting: 'PvP待機中',
  pvp_battle: 'PvP対戦中',
  market: 'マーケット閲覧中',
  crafting: 'クラフト中',
  other: 'その他',
};

/** 画面遷移時のみ呼ぶ（Firebase節約: 状態変更時のみ） */
export async function setPlayerActivity(uid: string, activity: PlayerActivityCode): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.ONLINE, uid), {
      currentActivityCode: activity,
      currentActivity: ACTIVITY_LABELS[activity],
      updatedAt: Date.now(),
    });
  } catch { /* ignore — online doc may not exist yet */ }
}

// ============================================================
// ギャンブル速報フィード（最新100件、バッファ+10秒flush）
// ============================================================
export interface GambleFeedEntry {
  uid: string;
  displayName: string;
  gameType: string;   // 'slot'|'highlow'|'blackjack'|'roulette'|'treasure'|'jackpot'|'super_jackpot'
  amount: number;     // 正=勝ち 負=負け 0=neutral
  timestamp: number;
  isJackpot?: boolean;
  isSuperJackpot?: boolean;
}

const GAMBLE_FEED_REF = () => doc(db, 'shared', 'gamble_feed');

let _gambleFeedBuffer: Omit<GambleFeedEntry, 'timestamp'>[] = [];
let _gambleFeedFlushTimer: ReturnType<typeof setTimeout> | null = null;

async function _flushGambleFeed() {
  _gambleFeedFlushTimer = null;
  if (_gambleFeedBuffer.length === 0) return;
  const toWrite = _gambleFeedBuffer.map(e => ({ ...e, timestamp: Date.now() }));
  _gambleFeedBuffer = [];
  try {
    const snap = await getDoc(GAMBLE_FEED_REF());
    const prev: GambleFeedEntry[] = snap.exists() ? ((snap.data()['entries'] ?? []) as GambleFeedEntry[]) : [];
    const next = [...toWrite, ...prev].slice(0, 100); // 最新100件のみ保持
    await setDoc(GAMBLE_FEED_REF(), { entries: next, updatedAt: Date.now() });
  } catch { /* ignore */ }
}

/** ギャンブル結果をフィードに追記（バッファして10秒に1回まとめてWrite） */
export async function postGambleFeed(entry: Omit<GambleFeedEntry, 'timestamp'>): Promise<void> {
  _gambleFeedBuffer.unshift(entry);
  if (_gambleFeedBuffer.length > 20) _gambleFeedBuffer = _gambleFeedBuffer.slice(0, 20);
  if (!_gambleFeedFlushTimer) {
    _gambleFeedFlushTimer = setTimeout(_flushGambleFeed, 10_000);
  }
}

/** ギャンブル速報をポーリング購読（30秒間隔） */
export function subscribeGambleFeed(cb: (entries: GambleFeedEntry[]) => void): Unsubscribe {
  let stopped = false;
  const fetch = () => getDoc(GAMBLE_FEED_REF()).then(snap => {
    if (stopped) return;
    cb(snap.exists() ? ((snap.data()['entries'] ?? []) as GambleFeedEntry[]) : []);
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 30_000);
  return () => { stopped = true; clearInterval(timer); };
}
