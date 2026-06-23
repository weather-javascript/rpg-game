// src/services/multiplayer.ts
import {
  doc, setDoc, deleteDoc, collection, query, orderBy, limit,
  onSnapshot, addDoc, getDoc, updateDoc, where, Unsubscribe, increment, getDocs,
  arrayUnion, arrayRemove, runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import type { OnlineUser, BoardMessage, BoardReply, AuctionListing, GambleBattle, GambleBattleData, BattleHistoryEntry, PokerTable, PokerCard, PokerPlayer, PokerPhase, NpcQuest, QuestType, QuestRank, StockId, StockMaster, StockPricePoint, StockTrendData } from '../types/game';
import { calcJackpotContrib, rollJackpot } from '../systems/minigames';
import { enqueueActivityFeed } from './activityFeedBuffer';

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

// ─── 釣り: 世界初発見システム ────────────────────────────────
/** 指定した魚の世界初発見者を記録する。初発見の場合は true を返す。 */
export async function tryRecordWorldFirstFish(fishId: string, uid: string, displayName: string): Promise<boolean> {
  try {
    const ref = doc(db, 'fish_world_first', fishId);
    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) return false;
      tx.set(ref, { fishId, uid, displayName, caughtAt: Date.now() });
      return true;
    });
    return result;
  } catch { return false; }
}

export async function getWorldFirstFish(fishId: string): Promise<{ uid: string; displayName: string; caughtAt: number } | null> {
  try {
    const snap = await getDoc(doc(db, 'fish_world_first', fishId));
    return snap.exists() ? (snap.data() as any) : null;
  } catch { return null; }
}

export async function getAllWorldFirstFish(): Promise<Record<string, { uid: string; displayName: string; caughtAt: number }>> {
  try {
    const snap = await getDocs(collection(db, 'fish_world_first'));
    const out: Record<string, any> = {};
    snap.docs.forEach(d => { out[d.id] = d.data(); });
    return out;
  } catch { return {}; }
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
  const ref = doc(db, 'admin', 'maintenance');
  let stopped = false;
  const fetch = () => getDoc(ref).then(snap => {
    if (stopped) return;
    cb(snap.exists() ? (snap.data() as MaintenanceStatus) : null);
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 5 * 60 * 1000);
  return () => { stopped = true; clearInterval(timer); };
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
  type: string;   // 'mining'|'fishing'|'dungeon'|'gamble_win'|'gamble_lose'|'auction'|'level_up'|'crafting'|'boss_title'|'kill_log'
  message: string;
  timestamp: number;
  // 称号・キルログ専用の表示色（HEX、または "ALT:#色1,#色2" で1文字ごと2色交互表示）
  color?: string;
  // boss_title用：称号テキスト本体（強調表示に使用）
  title?: string;
}

const FEED_REF = () => doc(db, 'shared', 'activity_feed');

// ============================================================
// ActivityFeed — バッファ処理は activityFeedBuffer.ts に委譲
// ============================================================

/** アクティビティをバッファ経由でフィードに追記（再利用可能な共通API） */
export async function postActivityFeed(entry: Omit<ActivityFeedEntry, 'timestamp'>): Promise<void> {
  enqueueActivityFeed(entry);
}

/** アクティビティフィードをリアルタイム購読（onSnapshot） */
export function subscribeActivityFeed(cb: (entries: ActivityFeedEntry[]) => void): Unsubscribe {
  return onSnapshot(FEED_REF(), (snap) => {
    cb(snap.exists() ? ((snap.data()['entries'] ?? []) as ActivityFeedEntry[]) : []);
  }, () => {});
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
export interface TradeRecipeOutput { itemId: string; amount: number; }
export interface TradeRecipe {
  id: string;
  name: string;
  description: string;
  inputs: TradeRecipeInput[];
  outputItemId: string;
  outputAmount: number;
  outputs?: TradeRecipeOutput[]; // 複数アイテムを交換で得る場合に使用（指定時はoutputItemId/outputAmountより優先）
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
    await setDoc(doc(db, COLLECTIONS.ONLINE, uid), {
      currentActivityCode: activity,
      currentActivity: ACTIVITY_LABELS[activity],
      lastSeen: Date.now(),
      updatedAt: Date.now(),
    }, { merge: true });
  } catch { /* ignore */ }
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

const GAMBLE_FEED_REF = () => doc(db, 'gamble_feed', 'entries');

// 30秒バッファ: ローカルに貯めてまとめてFlush
let _gambleFeedBuffer: GambleFeedEntry[] = [];
let _gambleFeedFlushTimer: ReturnType<typeof setTimeout> | null = null;

async function _flushGambleFeed(): Promise<void> {
  if (_gambleFeedBuffer.length === 0) return;
  const toWrite = [..._gambleFeedBuffer];
  _gambleFeedBuffer = [];
  try {
    const snap = await getDoc(GAMBLE_FEED_REF());
    const prev: GambleFeedEntry[] = snap.exists() ? ((snap.data()['entries'] ?? []) as GambleFeedEntry[]) : [];
    const next = [...toWrite, ...prev].slice(0, 100);
    await setDoc(GAMBLE_FEED_REF(), { entries: next, updatedAt: Date.now() });
  } catch { /* ignore */ }
}

/** ギャンブル結果を30秒バッファ経由でフィードに追記 */
export async function postGambleFeed(entry: Omit<GambleFeedEntry, 'timestamp'>): Promise<void> {
  _gambleFeedBuffer.unshift({ ...entry, timestamp: Date.now() });
  if (!_gambleFeedFlushTimer) {
    _gambleFeedFlushTimer = setTimeout(() => {
      _gambleFeedFlushTimer = null;
      _flushGambleFeed();
    }, 30_000);
  }
}

/** ギャンブル速報をポーリング購読（20秒間隔） */
export function subscribeGambleFeed(cb: (entries: GambleFeedEntry[]) => void): Unsubscribe {
  let stopped = false;
  const fetch = () => getDoc(GAMBLE_FEED_REF()).then(snap => {
    if (stopped) return;
    cb(snap.exists() ? ((snap.data()['entries'] ?? []) as GambleFeedEntry[]) : []);
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 20_000);
  return () => { stopped = true; clearInterval(timer); };
}

// ============================================================
// プレイヤー送金システム
// ============================================================
export interface TransferRecord {
  id?: string;
  senderUid: string;
  senderName: string;
  receiverUid: string;
  receiverName: string;
  amount: number;      // 送金額（手数料込み）
  received: number;    // 受取額（手数料5%引き後）
  fee: number;
  createdAt: number;
}

export async function sendGold(
  sender: { uid: string; displayName: string; gold: number },
  receiverUid: string,
  amount: number,
): Promise<{ success: boolean; error?: string }> {
  if (amount <= 0) return { success: false, error: '金額が不正です' };
  if (amount > sender.gold) return { success: false, error: '所持金が不足しています' };
  const fee = Math.floor(amount * 0.05);
  const received = amount - fee;

  try {
    // Fetch receiver
    const receiverRef = doc(db, 'players', receiverUid);
    const receiverSnap = await getDoc(receiverRef);
    if (!receiverSnap.exists()) return { success: false, error: '受取人が見つかりません' };
    const receiverData = receiverSnap.data() as { displayName: string; gold: number };

    // Deduct from sender (save handled by caller)
    // Add to receiver
    await updateDoc(receiverRef, { gold: (receiverData.gold ?? 0) + received });

    // Record transfer
    const record: Omit<TransferRecord, 'id'> = {
      senderUid: sender.uid,
      senderName: sender.displayName,
      receiverUid,
      receiverName: receiverData.displayName ?? '名無し',
      amount,
      received,
      fee,
      createdAt: Date.now(),
    };
    await addDoc(collection(db, 'gold_transfers'), record);

    // Update transfer rankings
    const senderRankRef = doc(db, 'transfer_ranking', sender.uid);
    const receiverRankRef = doc(db, 'transfer_ranking', receiverUid);
    const [sr, rr] = await Promise.all([getDoc(senderRankRef), getDoc(receiverRankRef)]);
    await setDoc(senderRankRef, {
      uid: sender.uid,
      displayName: sender.displayName,
      totalSent: ((sr.exists() ? sr.data()['totalSent'] : 0) ?? 0) + amount,
      totalReceived: (sr.exists() ? sr.data()['totalReceived'] : 0) ?? 0,
      updatedAt: Date.now(),
    });
    await setDoc(receiverRankRef, {
      uid: receiverUid,
      displayName: receiverData.displayName ?? '名無し',
      totalSent: (rr.exists() ? rr.data()['totalSent'] : 0) ?? 0,
      totalReceived: ((rr.exists() ? rr.data()['totalReceived'] : 0) ?? 0) + received,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: String(e) };
  }
}

export async function fetchMyTransfers(uid: string): Promise<TransferRecord[]> {
  try {
    const q1 = query(collection(db, 'gold_transfers'), where('senderUid', '==', uid), orderBy('createdAt', 'desc'), limit(30));
    const q2 = query(collection(db, 'gold_transfers'), where('receiverUid', '==', uid), orderBy('createdAt', 'desc'), limit(30));
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const all: TransferRecord[] = [];
    s1.forEach(d => all.push({ id: d.id, ...d.data() } as TransferRecord));
    s2.forEach(d => { if (!all.find(x => x.id === d.id)) all.push({ id: d.id, ...d.data() } as TransferRecord); });
    return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
  } catch { return []; }
}

export async function fetchTransferRanking(): Promise<{ uid: string; displayName: string; totalSent: number; totalReceived: number }[]> {
  try {
    const snap = await getDocs(collection(db, 'transfer_ranking'));
    const list: { uid: string; displayName: string; totalSent: number; totalReceived: number }[] = [];
    snap.forEach(d => list.push(d.data() as { uid: string; displayName: string; totalSent: number; totalReceived: number }));
    return list;
  } catch { return []; }
}

export async function fetchOnlinePlayerList(): Promise<{ uid: string; displayName: string; level: number }[]> {
  try {
    const snap = await getDocs(query(collection(db, 'players'), orderBy('stats.level', 'desc'), limit(100)));
    const list: { uid: string; displayName: string; level: number }[] = [];
    snap.forEach(d => {
      const data = d.data();
      if (!data['banned']) list.push({ uid: d.id, displayName: data['displayName'] ?? '名無し', level: data['stats']?.['level'] ?? 1 });
    });
    return list;
  } catch { return []; }
}

// ============================================================
// NPC依頼システム
// ============================================================
export function subscribeNpcQuests(cb: (quests: NpcQuest[]) => void): () => void {
  const ref = collection(db, 'npc_quests');
  const unsub = onSnapshot(query(ref, orderBy('rank', 'asc'), limit(50)), snap => {
    const quests: NpcQuest[] = [];
    snap.forEach(d => quests.push({ id: d.id, ...d.data() } as NpcQuest));
    cb(quests);
  }, () => cb([]));
  return unsub;
}

export async function generateNpcQuests(): Promise<void> {
  // ============================================================
  // NPC定義（口調・背景あり）
  // ============================================================
  type NpcDef = { name: string; icon: string; type: NpcQuest['npcType']; rankRange: QuestRank[] };
  const NPC_DEFS: NpcDef[] = [
    { name: '農夫のガレス',  icon: '👨‍🌾', type: 'villager',    rankRange: ['C','C','B'] },
    { name: '農婦のミア',    icon: '👩‍🌾', type: 'villager',    rankRange: ['C','C','B'] },
    { name: '鍛冶屋のドーガ', icon: '⚒️',  type: 'blacksmith',  rankRange: ['B','B','A'] },
    { name: '行商人のクロス', icon: '🧑‍💼', type: 'merchant',    rankRange: ['B','A','A'] },
    { name: '錬金術師のセラ', icon: '⚗️',  type: 'alchemist',   rankRange: ['A','A','S'] },
    { name: '貴族のエルバン', icon: '👑',  type: 'noble',       rankRange: ['A','S','S'] },
    { name: '漁師のバルド',  icon: '🎣',  type: 'fisherman',   rankRange: ['B','B','A'] },
    { name: 'S級剣士ライオス', icon: '🗡️', type: 'adventurer',  rankRange: ['S','S','SS'] },
  ];

  // ============================================================
  // アイテムプール（ITEM_MASTERに実在するIDのみ）
  // 各エントリ: [itemId, name, sellPrice, rank]
  // ============================================================
  type ItemPool = { id: string; name: string; price: number; rank: QuestRank };
  const ITEM_POOL: ItemPool[] = [
    // C ランク素材
    { id: 'wood',          name: '木材',           price: 5,    rank: 'C' },
    { id: 'stone',         name: '石',             price: 4,    rank: 'C' },
    { id: 'coal',          name: '石炭',           price: 10,   rank: 'C' },
    { id: 'plank',         name: '板材',           price: 8,    rank: 'C' },
    { id: 'slime_gel',     name: 'スライムゼリー', price: 8,    rank: 'C' },
    { id: 'dwarf_fragment',name: 'ドワーフの欠片', price: 15,   rank: 'C' },
    { id: 'cave_fragment', name: '洞窟の欠片',     price: 8,    rank: 'C' },
    { id: 'gunpowder',     name: '火薬',           price: 8,    rank: 'C' },
    // B ランク素材
    { id: 'iron_ore',      name: '鉄鉱石',         price: 25,   rank: 'B' },
    { id: 'iron_ingot',    name: '鉄塊',           price: 40,   rank: 'B' },
    { id: 'mole_claw',     name: 'モグラの爪',     price: 40,   rank: 'B' },
    { id: 'goblin_ear',    name: 'ゴブリンの耳',   price: 30,   rank: 'B' },
    { id: 'magma_stone',   name: 'マグマストーン', price: 35,   rank: 'B' },
    { id: 'fortress_order',name: '要塞防衛出兵状', price: 20,   rank: 'B' },
    { id: 'spear_shaft',   name: '槍の柄',         price: 35,   rank: 'B' },
    { id: 'raw_salmon',    name: '生鮭',           price: 10,   rank: 'B' },
    { id: 'gold_ore',      name: '金鉱石',         price: 120,  rank: 'B' },
    // A ランク素材
    { id: 'cave_gem',      name: '洞窟王の宝石',   price: 200,  rank: 'A' },
    { id: 'golden_bar',    name: '金塊',           price: 180,  rank: 'A' },
    { id: 'spirit_ice',    name: '霊氷',           price: 80,   rank: 'A' },
    { id: 'stalactite',    name: '鍾乳石',         price: 150,  rank: 'A' },
    { id: 'diamond_ore',   name: 'ダイヤモンド鉱石', price: 400, rank: 'A' },
    { id: 'emerald',       name: 'エメラルド',     price: 200,  rank: 'A' },
    { id: 'memento',       name: '形見の写真',     price: 60,   rank: 'A' },
    { id: 'hard_magic_stone', name: '硬魔石',      price: 200,  rank: 'A' },
    { id: 'magic_stone',   name: '魔導石',         price: 80,   rank: 'A' },
    { id: 'upper_magic_book', name: '上級魔導書',  price: 300,  rank: 'A' },
    { id: 'wolf_fang',     name: 'ハーブウルフの牙', price: 300, rank: 'A' },
    { id: 'dragon_soul',   name: 'ドラゴンソール', price: 1000, rank: 'A' },
    { id: 'brilliant_salmon', name: 'ブリリアントキングサーモン', price: 80, rank: 'A' },
    // S ランク素材
    { id: 'wolf_crystal',  name: '狼牙魔結晶',     price: 1500, rank: 'S' },
    { id: 'devil_reactor', name: 'デビルリアクター', price: 500, rank: 'S' },
    { id: 'chaos_reactor', name: 'カオスリアクター', price: 600, rank: 'S' },
    { id: 'kx_mech_track', name: 'KX-MECHANIC-TRACK', price: 5000, rank: 'S' },
    { id: 'life_control_core', name: 'LIFE CONTROL CORE', price: 10000, rank: 'S' },
    { id: 'ancient_shard', name: '古代の欠片',     price: 45000, rank: 'S' },
    // SS ランク素材
    { id: 'dragon_scale',  name: 'ドラゴンの鱗',   price: 250000, rank: 'SS' },
  ];

  // ============================================================
  // NPC口調別メッセージ生成
  // ============================================================
  function buildDescription(
    npcType: NpcQuest['npcType'],
    itemName: string,
    amount: number,
    _questType: QuestType,
    isAlternate: boolean,
    isUrgent: boolean,
  ): string {
    const alt = isAlternate ? '代替品でも構いません。' : '';
    const urg = isUrgent ? '急いでいます！' : '';
    switch (npcType) {
      case 'villager':
        return `${urg}${itemName}が${amount}個必要なんじゃ。畑の修繕に使うんだ。${alt}`;
      case 'blacksmith':
        return `${urg}今すぐ${itemName}を${amount}個用意しろ。注文が立て込んでいて手が離せん。${alt}`;
      case 'merchant':
        return `${urg}${itemName}を${amount}個まとめて仕入れたい。需要が高騰しているうちに動かねば。${alt}`;
      case 'noble':
        return `${urg}${itemName}を${amount}個持参しなさい。見返りは保証しましょう。${alt}`;
      case 'alchemist':
        return `${urg}研究に${itemName}が${amount}個必要です。精製の最終段階に入ったところで。${alt}`;
      case 'fisherman':
        return `${urg}${itemName}を${amount}個分けてくれ。今が旬なんだ。${alt}`;
      case 'adventurer':
        return `${urg}${itemName}が${amount}個要る。詳しくは聞かないでくれ。${alt}`;
      default:
        return `${urg}${itemName}を${amount}個届けてほしい。${alt}`;
    }
  }

  // ============================================================
  // タイトル生成
  // ============================================================
  function buildTitle(questType: QuestType, itemName: string, _rank: QuestRank): string {
    switch (questType) {
      case 'bulk':    return `【大量】${itemName}の大口調達`;
      case 'urgent':  return `【至急】${itemName}の緊急納品`;
      case 'select':  return `${itemName}（代替可）の調達`;
      case 'chain':   return `【連続】${itemName}の継続供給`;
      default:        return `${itemName}の調達依頼`;
    }
  }

  // ============================================================
  // 報酬計算
  // ============================================================
  function calcReward(
    price: number,
    amount: number,
    rank: QuestRank,
    questType: QuestType,
    marketMult: number,
    isAlternate: boolean,
    isUrgent: boolean,
  ): number {
    const difficultyMult: Record<QuestRank, number> = { C: 2.2, B: 3.5, A: 5.0, S: 7.0, SS: 9.0 };
    const typeMult: Record<QuestType, number> = {
      delivery: 1.0, bulk: 1.1, urgent: 1.4, select: 0.85, chain: 1.2,
    };
    const altPenalty = isAlternate ? 0.8 : 1.0;
    const urgBonus   = isUrgent   ? 1.3 : 1.0;

    const raw = price * amount
      * difficultyMult[rank]
      * typeMult[questType]
      * marketMult
      * altPenalty
      * urgBonus;

    const minReward = price * amount * 1.2;
    const maxReward = price * amount * 10;
    return Math.round(Math.max(minReward, Math.min(maxReward, raw)) / 10) * 10;
  }

  // ============================================================
  // 市場連動 multiplier（0.7 〜 1.5）
  // ============================================================
  function marketMultiplier(rank: QuestRank): number {
    const base = 0.9 + Math.random() * 0.5; // 0.9〜1.4
    // ランクが高いほど変動幅大
    const volatility = { C: 0.05, B: 0.10, A: 0.15, S: 0.20, SS: 0.25 }[rank];
    const mult = base + (Math.random() - 0.5) * volatility;
    return Math.min(1.5, Math.max(0.7, parseFloat(mult.toFixed(2))));
  }

  // ============================================================
  // 依頼1件を動的生成
  // ============================================================
  function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

  function generateOne(npc: NpcDef): Omit<NpcQuest, 'id' | 'createdAt' | 'expiresAt'> {
    // NPCのランク帯からランクを選択
    const rank = rand(npc.rankRange);
    // アイテムプールからランクに合ったものを選ぶ（±1ランク許容）
    const rankOrder: QuestRank[] = ['C','B','A','S','SS'];
    const ri = rankOrder.indexOf(rank);
    const eligible = ITEM_POOL.filter(i => {
      const ii = rankOrder.indexOf(i.rank);
      return ii >= Math.max(0, ri - 1) && ii <= Math.min(rankOrder.length - 1, ri + 1);
    });
    const item = rand(eligible);

    // 依頼タイプ
    const questTypes: QuestType[] = ['delivery','delivery','bulk','urgent','select','chain'];
    const questType = rand(questTypes);

    // 数量（ランク・タイプ別）
    const amountMap: Record<QuestRank, [number, number]> = {
      C: [10, 60], B: [5, 40], A: [3, 20], S: [1, 8], SS: [1, 3],
    };
    const [minA, maxA] = amountMap[rank];
    const bulkMult = questType === 'bulk' ? 2 : 1;
    const amount = (Math.floor(Math.random() * (maxA - minA + 1)) + minA) * bulkMult;

    // 代替・至急フラグ
    const isAlternate = questType === 'select';
    const isUrgent    = questType === 'urgent';

    // 代替アイテム（同ランクから1〜2個）
    const alternateItemIds = isAlternate
      ? eligible.filter(i => i.id !== item.id).sort(() => Math.random() - 0.5).slice(0, 2).map(i => i.id)
      : undefined;

    const mMult = marketMultiplier(rank);
    const rewardGold = calcReward(item.price, amount, rank, questType, mMult, isAlternate, isUrgent);

    return {
      npcName: npc.name,
      npcIcon: npc.icon,
      npcType: npc.type,
      rank,
      questType,
      title: buildTitle(questType, item.name, rank),
      description: buildDescription(npc.type, item.name, amount, questType, isAlternate, isUrgent),
      requiredItemId: item.id,
      requiredAmount: amount,
      rewardGold,
      marketMultiplier: mMult,
      difficultyMultiplier: { C: 2.2, B: 3.5, A: 5.0, S: 7.0, SS: 9.0 }[rank],
      ...(alternateItemIds ? { alternateItemIds } : {}),
      ...(isUrgent ? { urgentDeadlineMs: 2 * 60 * 60 * 1000 } : {}), // 緊急は2時間
    };
  }

  // ============================================================
  // 8件生成（ランクバランスを確保: C×2, B×2, A×2, S×1, SS×1）
  // ============================================================
  const now = Date.now();
  const BASE_EXPIRY = 6 * 60 * 60 * 1000; // 6時間

  const rankSlots: QuestRank[] = ['C','C','B','B','A','A','S','SS'];
  const shuffledNpcs = [...NPC_DEFS].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 8; i++) {
    const npc = shuffledNpcs[i % shuffledNpcs.length];
    // ランクスロットに合わせてrankRangeを一時上書き
    const overriddenNpc: NpcDef = { ...npc, rankRange: [rankSlots[i]] };
    const quest = generateOne(overriddenNpc);
    const expiresAt = quest.urgentDeadlineMs
      ? now + quest.urgentDeadlineMs
      : now + BASE_EXPIRY;
    await addDoc(collection(db, 'npc_quests'), { ...quest, createdAt: now, expiresAt });
  }
}


export async function deleteExpiredNpcQuests(): Promise<void> {
  try {
    const snap = await getDocs(query(collection(db, 'npc_quests'), where('expiresAt', '<', Date.now())));
    for (const d of snap.docs) await deleteDoc(d.ref);
  } catch { /* ignore */ }
}

export async function completeNpcQuest(questId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'npc_quests', questId));
    return true;
  } catch { return false; }
}

// 依頼ランキング
export interface QuestRankingEntry {
  uid: string;
  displayName: string;
  totalCompleted: number;
  totalRewardGold: number;
}

export async function updateQuestRanking(uid: string, displayName: string, rewardGold: number): Promise<void> {
  try {
    const ref = doc(db, 'quest_ranking', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { totalCompleted: increment(1), totalRewardGold: increment(rewardGold), displayName });
    } else {
      await setDoc(ref, { uid, displayName, totalCompleted: 1, totalRewardGold: rewardGold });
    }
  } catch { /* ignore */ }
}

export function subscribeQuestRanking(cb: (entries: QuestRankingEntry[]) => void): () => void {
  return onSnapshot(query(collection(db, 'quest_ranking'), orderBy('totalCompleted', 'desc'), limit(20)), snap => {
    const entries: QuestRankingEntry[] = [];
    snap.forEach(d => entries.push(d.data() as QuestRankingEntry));
    cb(entries);
  }, () => cb([]));
}

// ============================================================
// 株式市場（Wealth Exchange）
// ============================================================
export const STOCK_MASTERS: Record<StockId, StockMaster> = {
  wealth_mining: { id: 'wealth_mining', name: 'Wealth Mining', icon: '⛏️', basePrice: 1000, sector: 'industry', sharesOutstanding: 100_000_000, splitThreshold: 6000 },
  wealth_fishery: { id: 'wealth_fishery', name: 'Wealth Fishery', icon: '🎣', basePrice: 800, sector: 'consumer', sharesOutstanding: 100_000_000, splitThreshold: 5000 },
  wealth_casino: { id: 'wealth_casino', name: 'Wealth Casino', icon: '🎰', basePrice: 1200, sector: 'entertainment', sharesOutstanding: 100_000_000, splitThreshold: 7200 },
  wealth_tech: { id: 'wealth_tech', name: 'Wealth Tech', icon: '💻', basePrice: 2000, sector: 'tech', sharesOutstanding: 100_000_000, splitThreshold: 12000 },
  wealth_energy: { id: 'wealth_energy', name: 'Wealth Energy', icon: '⚡', basePrice: 900, sector: 'energy', sharesOutstanding: 100_000_000, splitThreshold: 5400 },
  wealth_logistics: { id: 'wealth_logistics', name: 'Wealth Logistics', icon: '🚚', basePrice: 700, sector: 'industry', sharesOutstanding: 100_000_000, splitThreshold: 5000 },
  wealth_foods: { id: 'wealth_foods', name: 'Wealth Foods', icon: '🍖', basePrice: 600, sector: 'consumer', sharesOutstanding: 100_000_000, splitThreshold: 5000 },
  wealth_finance: { id: 'wealth_finance', name: 'Wealth Finance', icon: '💰', basePrice: 1500, sector: 'finance', sharesOutstanding: 100_000_000, splitThreshold: 9000 },
  wealth_robotics: { id: 'wealth_robotics', name: 'Wealth Robotics', icon: '🤖', basePrice: 2500, sector: 'tech', sharesOutstanding: 100_000_000, splitThreshold: 15000 },
  wealth_software: { id: 'wealth_software', name: 'Wealth Software', icon: '🖥️', basePrice: 2200, sector: 'tech', sharesOutstanding: 100_000_000, splitThreshold: 13200 },
  wealth_chemical: { id: 'wealth_chemical', name: 'Wealth Chemical', icon: '🧪', basePrice: 850, sector: 'industry', sharesOutstanding: 100_000_000, splitThreshold: 5100 },
  wealth_steel: { id: 'wealth_steel', name: 'Wealth Steel', icon: '🏗️', basePrice: 750, sector: 'industry', sharesOutstanding: 100_000_000, splitThreshold: 5000 },
  wealth_realestate: { id: 'wealth_realestate', name: 'Wealth Realestate', icon: '🏢', basePrice: 1800, sector: 'finance', sharesOutstanding: 100_000_000, splitThreshold: 10800 },
  wealth_insurance: { id: 'wealth_insurance', name: 'Wealth Insurance', icon: '🛡️', basePrice: 1300, sector: 'finance', sharesOutstanding: 100_000_000, splitThreshold: 7800 },
  wealth_retail: { id: 'wealth_retail', name: 'Wealth Retail', icon: '🛒', basePrice: 650, sector: 'consumer', sharesOutstanding: 100_000_000, splitThreshold: 5000 },
  wealth_apparel: { id: 'wealth_apparel', name: 'Wealth Apparel', icon: '👕', basePrice: 550, sector: 'consumer', sharesOutstanding: 100_000_000, splitThreshold: 5000 },
  wealth_media: { id: 'wealth_media', name: 'Wealth Media', icon: '📺', basePrice: 1100, sector: 'entertainment', sharesOutstanding: 100_000_000, splitThreshold: 6600 },
  wealth_gaming: { id: 'wealth_gaming', name: 'Wealth Gaming', icon: '🎮', basePrice: 1900, sector: 'entertainment', sharesOutstanding: 100_000_000, splitThreshold: 11400 },
  wealth_airlines: { id: 'wealth_airlines', name: 'Wealth Airlines', icon: '✈️', basePrice: 500, sector: 'industry', sharesOutstanding: 100_000_000, splitThreshold: 5000 },
  wealth_solar: { id: 'wealth_solar', name: 'Wealth Solar', icon: '🌞', basePrice: 950, sector: 'energy', sharesOutstanding: 100_000_000, splitThreshold: 5700 },
  wealth_oil: { id: 'wealth_oil', name: 'Wealth Oil', icon: '🛢️', basePrice: 1050, sector: 'energy', sharesOutstanding: 100_000_000, splitThreshold: 6300 },
  wealth_pharma: { id: 'wealth_pharma', name: 'Wealth Pharma', icon: '💊', basePrice: 1700, sector: 'tech', sharesOutstanding: 100_000_000, splitThreshold: 10200 },
  wealth_telecom: { id: 'wealth_telecom', name: 'Wealth Telecom', icon: '📡', basePrice: 1000, sector: 'industry', sharesOutstanding: 100_000_000, splitThreshold: 6000 },
};

const STOCK_IDS: StockId[] = [
  'wealth_mining','wealth_fishery','wealth_casino','wealth_tech','wealth_energy','wealth_logistics','wealth_foods','wealth_finance',
  'wealth_robotics','wealth_software','wealth_chemical','wealth_steel','wealth_realestate','wealth_insurance','wealth_retail',
  'wealth_apparel','wealth_media','wealth_gaming','wealth_airlines','wealth_solar','wealth_oil','wealth_pharma','wealth_telecom',
];
export const STOCK_ID_LIST = STOCK_IDS;

const STOCK_DAY_PREFIX = 'day';
const STOCK_YEAR_PREFIX = 'year';
const deriveMarketKey = (now: number): string => new Date(now).toISOString().slice(0, 10);
const deriveYearKey = (now: number): string => String(new Date(now).getFullYear());
const stockKey = (prefix: string, id: StockId): string => `${prefix}_${id}`;
const stockDayKey = (id: StockId): string => stockKey(STOCK_DAY_PREFIX, id);
const stockYearKey = (id: StockId): string => stockKey(STOCK_YEAR_PREFIX, id);
const stockStatKey = (name: string, id: StockId): string => `${name}_${id}`;

const defaultTrend = (sector: import('../types/game').StockSector): import('../types/game').StockTrendData => ({
  trend: 0,
  volatility: (0.02 + Math.random() * 0.04) * SECTOR_VOL_MULT[sector],
  stability: Math.min(0.9, (0.3 + Math.random() * 0.5) * SECTOR_STABILITY_BASE[sector] / 0.5),
  consecutiveTicks: 0,
});


// セクター別ボラティリティ特性
const SECTOR_VOL_MULT: Record<import('../types/game').StockSector, number> = {
  tech: 1.35, industry: 0.75, finance: 1.0, consumer: 0.9, entertainment: 1.15, energy: 1.1,
};
// セクター別トレンド慣性（高いほど一方向に動きやすい＝安定）
const SECTOR_STABILITY_BASE: Record<import('../types/game').StockSector, number> = {
  tech: 0.35, industry: 0.6, finance: 0.45, consumer: 0.55, entertainment: 0.4, energy: 0.45,
};

// 市場の開場時間（毎日 07:00〜22:00）
export const MARKET_OPEN_HOUR = 7;
export const MARKET_CLOSE_HOUR = 22;

export interface MarketStatus {
  isOpen: boolean;
  nextChangeAt: number; // 次の開場/閉場切替時刻 (ms)
  msUntilChange: number;
}

export function getMarketStatus(now: number = Date.now()): MarketStatus {
  const d = new Date(now);
  const h = d.getHours();
  const isOpen = h >= MARKET_OPEN_HOUR && h < MARKET_CLOSE_HOUR;
  const next = new Date(d);
  if (isOpen) {
    next.setHours(MARKET_CLOSE_HOUR, 0, 0, 0);
  } else if (h < MARKET_OPEN_HOUR) {
    next.setHours(MARKET_OPEN_HOUR, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(MARKET_OPEN_HOUR, 0, 0, 0);
  }
  return { isOpen, nextChangeAt: next.getTime(), msUntilChange: next.getTime() - now };
}

export function isMarketOpen(now: number = Date.now()): boolean {
  return getMarketStatus(now).isOpen;
}


// 30種類以上のマーケットイベント
const MARKET_EVENTS: Array<{
  text: string;
  changePct: number;
  targets?: StockId[];
  sectors?: import('../types/game').StockSector[];
  allMarket?: boolean;
}> = [
  { text: '🤖 AI革命！次世代AIチップが実用化', changePct: 0.18, targets: ['wealth_tech'], sectors: ['tech'] },
  { text: '💻 大手テック企業が史上最高益を記録', changePct: 0.14, targets: ['wealth_tech'], sectors: ['tech'] },
  { text: '🔒 サイバー攻撃多発でセキュリティ需要急増', changePct: 0.12, targets: ['wealth_tech'], sectors: ['tech'] },
  { text: '⚡ 原油価格が急騰、エネルギー株に恩恵', changePct: 0.16, targets: ['wealth_energy'], sectors: ['energy'] },
  { text: '🌞 再生可能エネルギー政策が強化', changePct: 0.13, targets: ['wealth_energy'], sectors: ['energy'] },
  { text: '🛢️ 産油国が減産を決定', changePct: 0.10, targets: ['wealth_energy'], sectors: ['energy'] },
  { text: '🍣 食品安全基準の見直しで食品株上昇', changePct: 0.11, targets: ['wealth_foods'], sectors: ['consumer'] },
  { text: '🌾 農作物の大豊作で食品業績改善', changePct: 0.09, targets: ['wealth_foods'], sectors: ['consumer'] },
  { text: '⛏️ 希少金属の新鉱床を発見', changePct: 0.17, targets: ['wealth_mining'], sectors: ['industry'] },
  { text: '⛏️ 採掘コストが大幅に削減される新技術', changePct: 0.13, targets: ['wealth_mining'], sectors: ['industry'] },
  { text: '🎣 水産資源保護法の緩和で漁業回復', changePct: 0.12, targets: ['wealth_fishery'], sectors: ['consumer'] },
  { text: '🚚 物流DX化で配送コスト30%削減', changePct: 0.14, targets: ['wealth_logistics'], sectors: ['industry'] },
  { text: '🏦 金融緩和政策で投資マインド上昇', changePct: 0.12, targets: ['wealth_finance'], sectors: ['finance'] },
  { text: '💰 大型M&Aで金融コングロマリット誕生', changePct: 0.15, targets: ['wealth_finance'], sectors: ['finance'] },
  { text: '🎰 カジノライセンス新規発行で株価急騰', changePct: 0.16, targets: ['wealth_casino'], sectors: ['entertainment'] },
  { text: '🌍 世界同時株高！リスクオンムード', changePct: 0.08, allMarket: true },
  { text: '📈 外国人投資家の買い越しが続く', changePct: 0.07, allMarket: true },
  // ── 新セクター用イベント ──
  { text: '🤖 産業用ロボット需要が急拡大', changePct: 0.15, targets: ['wealth_robotics'], sectors: ['tech'] },
  { text: '🖥️ クラウドサービス契約数が急増', changePct: 0.13, targets: ['wealth_software'], sectors: ['tech'] },
  { text: '💊 新薬の臨床試験が成功', changePct: 0.17, targets: ['wealth_pharma'], sectors: ['tech'] },
  { text: '🏢 不動産価格指数が大幅上昇', changePct: 0.11, targets: ['wealth_realestate'], sectors: ['finance'] },
  { text: '🛡️ 保険料改定で増益見通し', changePct: 0.09, targets: ['wealth_insurance'], sectors: ['finance'] },
  { text: '🛒 大型セールで小売売上が好調', changePct: 0.10, targets: ['wealth_retail'], sectors: ['consumer'] },
  { text: '👕 新ブランドが世界的ヒット', changePct: 0.12, targets: ['wealth_apparel'], sectors: ['consumer'] },
  { text: '📺 大型ヒット番組が視聴率record', changePct: 0.13, targets: ['wealth_media'], sectors: ['entertainment'] },
  { text: '🎮 新作ゲームが世界的大ヒット', changePct: 0.18, targets: ['wealth_gaming'], sectors: ['entertainment'] },
  { text: '✈️ 旅行需要が急回復', changePct: 0.14, targets: ['wealth_airlines'], sectors: ['industry'] },
  { text: '🌞 太陽光パネルの新技術で発電効率向上', changePct: 0.15, targets: ['wealth_solar'], sectors: ['energy'] },
  { text: '🛢️ 新油田が発見される', changePct: 0.13, targets: ['wealth_oil'], sectors: ['energy'] },
  { text: '📡 5G通信網が全国展開完了', changePct: 0.11, targets: ['wealth_telecom'], sectors: ['industry'] },
  { text: '🧪 新素材の量産化に成功', changePct: 0.12, targets: ['wealth_chemical'], sectors: ['industry'] },
  { text: '🏗️ 大型建設プロジェクトが受注', changePct: 0.10, targets: ['wealth_steel'], sectors: ['industry'] },
  // 下落イベント
  { text: '💻 大手テック企業が業績下方修正', changePct: -0.16, targets: ['wealth_tech'], sectors: ['tech'] },
  { text: '🔌 半導体不足が深刻化', changePct: -0.13, targets: ['wealth_tech'], sectors: ['tech'] },
  { text: '⚡ 電力価格の高騰でエネルギー株急落', changePct: -0.12, targets: ['wealth_energy'], sectors: ['energy'] },
  { text: '🌊 大型台風で採掘施設が被害', changePct: -0.14, targets: ['wealth_mining'], sectors: ['industry'] },
  { text: '🐟 漁業資源の枯渇問題が浮上', changePct: -0.11, targets: ['wealth_fishery'], sectors: ['consumer'] },
  { text: '🍔 食品偽装問題が発覚し信頼失墜', changePct: -0.18, targets: ['wealth_foods'], sectors: ['consumer'] },
  { text: '🚛 燃料費高騰で物流コスト急増', changePct: -0.13, targets: ['wealth_logistics'], sectors: ['industry'] },
  { text: '🏦 金融不安が広がり銀行株急落', changePct: -0.15, targets: ['wealth_finance'], sectors: ['finance'] },
  { text: '🎰 カジノ規制強化の法案が可決', changePct: -0.19, targets: ['wealth_casino'], sectors: ['entertainment'] },
  { text: '📉 世界同時株安！リスクオフムード', changePct: -0.09, allMarket: true },
  { text: '🌐 地政学リスクが高まり全面安', changePct: -0.10, allMarket: true },
  { text: '💸 急激な円高で輸出関連株が下落', changePct: -0.07, allMarket: true },
  { text: '😱 著名投資家が大量売却を開始', changePct: -0.11, allMarket: true },
  { text: '⚠️ 規制当局が独占禁止法違反で調査開始', changePct: -0.12, targets: ['wealth_tech', 'wealth_finance'], sectors: ['tech','finance'] },
  { text: '🌋 天災により複数セクターで操業停止', changePct: -0.10, targets: ['wealth_mining', 'wealth_energy'], sectors: ['industry','energy'] },
  // ── 新セクター用イベント (下落) ──
  { text: '🤖 ロボット工場で大規模リコール', changePct: -0.14, targets: ['wealth_robotics'], sectors: ['tech'] },
  { text: '🖥️ 大規模システム障害が発生', changePct: -0.13, targets: ['wealth_software'], sectors: ['tech'] },
  { text: '💊 新薬の副作用問題が発覚', changePct: -0.17, targets: ['wealth_pharma'], sectors: ['tech'] },
  { text: '🏢 不動産バブル崩壊の懸念が拡大', changePct: -0.15, targets: ['wealth_realestate'], sectors: ['finance'] },
  { text: '🛡️ 大規模災害で保険金支払いが急増', changePct: -0.12, targets: ['wealth_insurance'], sectors: ['finance'] },
  { text: '🛒 消費低迷で小売業績が悪化', changePct: -0.10, targets: ['wealth_retail'], sectors: ['consumer'] },
  { text: '👕 ブランドイメージ悪化で不振', changePct: -0.11, targets: ['wealth_apparel'], sectors: ['consumer'] },
  { text: '📺 視聴率低迷で広告収入が減少', changePct: -0.12, targets: ['wealth_media'], sectors: ['entertainment'] },
  { text: '🎮 大型タイトルの発売延期が発表', changePct: -0.15, targets: ['wealth_gaming'], sectors: ['entertainment'] },
  { text: '✈️ 燃料費高騰で航空業界が打撃', changePct: -0.13, targets: ['wealth_airlines'], sectors: ['industry'] },
  { text: '🌞 補助金縮小で太陽光需要が減少', changePct: -0.12, targets: ['wealth_solar'], sectors: ['energy'] },
  { text: '🛢️ 原油価格が急落', changePct: -0.14, targets: ['wealth_oil'], sectors: ['energy'] },
  { text: '📡 通信障害で大規模な信頼低下', changePct: -0.11, targets: ['wealth_telecom'], sectors: ['industry'] },
];

const MARKET_EVENT_BIAS = MARKET_EVENTS.reduce((sum, ev) => sum + ev.changePct, 0) / MARKET_EVENTS.length;

// トレンドラベル変換
export function getTrendLabel(trend: number): { label: string; color: string; icon: string } {
  if (trend > 0.03)  return { label: '強い上昇トレンド', color: '#4caf87', icon: '🚀' };
  if (trend > 0.01)  return { label: '緩やかな上昇',     color: '#4caf87', icon: '📈' };
  if (trend > -0.01) return { label: '横ばい',           color: '#8a92b2', icon: '➡️' };
  if (trend > -0.03) return { label: '下落気味',         color: '#e08855', icon: '📉' };
  return                     { label: '強い下落トレンド', color: '#e05555', icon: '🔻' };
}

export function getVolatilityLabel(v: number): { label: string; color: string } {
  if (v < 0.03) return { label: '低', color: '#4caf87' };
  if (v < 0.07) return { label: '中', color: '#f0c060' };
  return               { label: '高', color: '#e05555' };
}

export function subscribeStockPrices(
  cb: (
    prices: Record<StockId, number>,
    history: Record<StockId, StockPricePoint[]>,
    trends: Record<StockId, StockTrendData>,
    stats: Record<StockId, import('../types/game').StockMarketStats>,
    splitEvents: import('../types/game').StockSplitEvent[]
  ) => void
): () => void {
  const ref = doc(db, 'stock_market', 'prices');
  getDoc(ref).then(snap => {
    if (!snap.exists()) {
      const initData: Record<string, unknown> = { lastTickAt: 0, splitEvents: [] };
      for (const id of STOCK_IDS) {
        const base = STOCK_MASTERS[id].basePrice;
        initData[id] = base;
        initData[`history_${id}`] = [{ timestamp: Date.now(), price: base }];
        initData[`trend_${id}`] = { trend: 0, volatility: 0.03, stability: 0.5, consecutiveTicks: 0 };
        initData[stockStatKey('prevClose', id)] = base;
        initData[stockStatKey('dayOpen', id)] = base;
        initData[stockStatKey('dayHigh', id)] = base;
        initData[stockStatKey('dayLow', id)] = base;
        initData[stockStatKey('dayVolume', id)] = 0;
        initData[stockStatKey('yearHigh', id)] = base;
        initData[stockStatKey('yearLow', id)] = base;
        initData[stockDayKey(id)] = deriveMarketKey(Date.now());
        initData[stockYearKey(id)] = deriveYearKey(Date.now());
      }
      setDoc(ref, initData).catch(() => {});
    }
  }).catch(() => {});

  return onSnapshot(ref, snap => {
    if (!snap.exists()) {
      cb({} as Record<StockId, number>, {} as Record<StockId, StockPricePoint[]>, {} as Record<StockId, StockTrendData>, {} as Record<StockId, import('../types/game').StockMarketStats>, []);
      return;
    }
    const data = snap.data();
    const prices = {} as Record<StockId, number>;
    const history = {} as Record<StockId, StockPricePoint[]>;
    const trends = {} as Record<StockId, StockTrendData>;
    const stats = {} as Record<StockId, import('../types/game').StockMarketStats>;
    for (const id of STOCK_IDS) {
      const price = Number(data[id] ?? STOCK_MASTERS[id].basePrice);
      prices[id] = price;
      history[id] = (data[`history_${id}`] as StockPricePoint[]) ?? [];
      trends[id] = (data[`trend_${id}`] as StockTrendData) ?? { trend: 0, volatility: 0.03, stability: 0.5, consecutiveTicks: 0 };
      const prevClose = Number(data[stockStatKey('prevClose', id)] ?? price);
      const dayOpen = Number(data[stockStatKey('dayOpen', id)] ?? prevClose);
      const dayHigh = Number(data[stockStatKey('dayHigh', id)] ?? Math.max(prevClose, price));
      const dayLow = Number(data[stockStatKey('dayLow', id)] ?? Math.min(prevClose, price));
      const dayVolume = Number(data[stockStatKey('dayVolume', id)] ?? 0);
      const yearHigh = Number(data[stockStatKey('yearHigh', id)] ?? price);
      const yearLow = Number(data[stockStatKey('yearLow', id)] ?? price);
      stats[id] = { prevClose, dayOpen, dayHigh, dayLow, dayVolume, yearHigh, yearLow };
    }
    const splitEvents = (data.splitEvents as import('../types/game').StockSplitEvent[]) ?? [];
    cb(prices, history, trends, stats, splitEvents);
  }, () => {});
}

// 1日あたり約5件のニュースになるよう確率調整（1tickあたり）
// 30秒tick × 120ticks/hour × 15hours(7-22) = 1800 ticks/day → 5/1800 ≈ 0.0028
// ただしイベント自体はtick毎に複数銘柄を評価するので、全体発生率を0.003程度に
const NEWS_PER_TICK_PROB = 0.003;
// 閉場中: 1日あたり約1件ペース（15h分のtick数に対し約1/15のニュース確率）
const NEWS_PER_TICK_PROB_CLOSED = NEWS_PER_TICK_PROB / 15;

export async function tickStockPrices(): Promise<{
  prices: Record<StockId, number>;
  news: string[];
  trends: Record<StockId, StockTrendData>;
  stats: Record<StockId, import('../types/game').StockMarketStats>;
  splitEvents: import('../types/game').StockSplitEvent[];
}> {
  const ref = doc(db, 'stock_market', 'prices');
  const now = Date.now();
  const prices: Record<string, number> = {};
  const newsItems: string[] = [];
  const trends: Record<string, StockTrendData> = {};
  const stats: Record<string, import('../types/game').StockMarketStats> = {};
  const splitEvents: import('../types/game').StockSplitEvent[] = [];

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists() ? snap.data() : {};

      const lastTick = (data['lastTickAt'] as number) ?? 0;
      if (lastTick !== 0 && now - lastTick < 25_000) {
        for (const id of STOCK_IDS) {
          prices[id] = Number(data[id] ?? STOCK_MASTERS[id].basePrice);
          trends[id] = (data[`trend_${id}`] as StockTrendData) ?? defaultTrend(STOCK_MASTERS[id].sector);
          stats[id] = {
            prevClose: Number(data[stockStatKey('prevClose', id)] ?? prices[id]),
            dayOpen: Number(data[stockStatKey('dayOpen', id)] ?? prices[id]),
            dayHigh: Number(data[stockStatKey('dayHigh', id)] ?? prices[id]),
            dayLow: Number(data[stockStatKey('dayLow', id)] ?? prices[id]),
            dayVolume: Number(data[stockStatKey('dayVolume', id)] ?? 0),
            yearHigh: Number(data[stockStatKey('yearHigh', id)] ?? prices[id]),
            yearLow: Number(data[stockStatKey('yearLow', id)] ?? prices[id]),
          };
        }
        return;
      }

      console.log('[tickStockPrices] tick実行 diff=', now - lastTick);

      const todayKey = deriveMarketKey(now);
      const yearKey = deriveYearKey(now);
      const marketOpen = isMarketOpen(now);

      let eventForTick: typeof MARKET_EVENTS[number] | null = null;
      if (Math.random() < (marketOpen ? NEWS_PER_TICK_PROB : NEWS_PER_TICK_PROB_CLOSED)) {
        eventForTick = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
      }

      const newData: Record<string, unknown> = { lastTickAt: now, splitEvents: [] };
      newsItems.length = 0;

      for (const id of STOCK_IDS) {
        const master = STOCK_MASTERS[id];
        const current: number = Number(data[id] ?? master.basePrice);
        let trendData: StockTrendData = (data[`trend_${id}`] as StockTrendData) ?? defaultTrend(master.sector);

        const storedDayKey = String(data[stockDayKey(id)] ?? '');
        const storedYearKey = String(data[stockYearKey(id)] ?? '');
        let prevClose = Number(data[stockStatKey('prevClose', id)] ?? current);
        let dayOpen = Number(data[stockStatKey('dayOpen', id)] ?? current);
        let dayHigh = Number(data[stockStatKey('dayHigh', id)] ?? current);
        let dayLow = Number(data[stockStatKey('dayLow', id)] ?? current);
        let dayVolume = Number(data[stockStatKey('dayVolume', id)] ?? 0);
        let yearHigh = Number(data[stockStatKey('yearHigh', id)] ?? current);
        let yearLow = Number(data[stockStatKey('yearLow', id)] ?? current);

        if (storedDayKey !== todayKey) {
          prevClose = current;
          dayOpen = current;
          dayHigh = current;
          dayLow = current;
          dayVolume = 0;
        }
        if (storedYearKey !== yearKey) {
          yearHigh = current;
          yearLow = current;
        }

        if (!marketOpen) {
          prices[id] = current;
          trends[id] = trendData;
          stats[id] = { prevClose, dayOpen, dayHigh, dayLow, dayVolume, yearHigh, yearLow };
          newData[id] = current;
          newData[`trend_${id}`] = trendData;
          newData[stockDayKey(id)] = todayKey;
          newData[stockYearKey(id)] = yearKey;
          newData[stockStatKey('prevClose', id)] = prevClose;
          newData[stockStatKey('dayOpen', id)] = dayOpen;
          newData[stockStatKey('dayHigh', id)] = dayHigh;
          newData[stockStatKey('dayLow', id)] = dayLow;
          newData[stockStatKey('dayVolume', id)] = dayVolume;
          newData[stockStatKey('yearHigh', id)] = yearHigh;
          newData[stockStatKey('yearLow', id)] = yearLow;
          continue;
        }

        const haltedAt = trendData.haltedAt;
        if (haltedAt && haltedAt >= new Date(now).setHours(0, 0, 0, 0)) {
          prices[id] = current;
          trends[id] = trendData;
          stats[id] = { prevClose, dayOpen, dayHigh, dayLow, dayVolume, yearHigh, yearLow };
          newData[id] = current;
          newData[`trend_${id}`] = trendData;
          newData[stockDayKey(id)] = todayKey;
          newData[stockYearKey(id)] = yearKey;
          newData[stockStatKey('prevClose', id)] = prevClose;
          newData[stockStatKey('dayOpen', id)] = dayOpen;
          newData[stockStatKey('dayHigh', id)] = dayHigh;
          newData[stockStatKey('dayLow', id)] = dayLow;
          newData[stockStatKey('dayVolume', id)] = dayVolume;
          newData[stockStatKey('yearHigh', id)] = yearHigh;
          newData[stockStatKey('yearLow', id)] = yearLow;
          continue;
        }

        const stabilityFactor = trendData.stability;
        const revertProb = Math.min(0.8, 0.05 + trendData.consecutiveTicks * 0.04);
        let newTrend = trendData.trend;
        if (Math.random() > stabilityFactor || Math.random() < revertProb) {
          newTrend = newTrend * 0.3 + (Math.random() - 0.5) * 0.08;
        } else {
          newTrend = newTrend * 0.9 + (Math.random() - 0.5) * 0.01;
        }
        newTrend = Math.max(-0.05, Math.min(0.05, newTrend));

        const newConsec = Math.sign(newTrend) === Math.sign(trendData.trend) ? trendData.consecutiveTicks + 1 : 0;
        const newVol = Math.max(0.01, Math.min(0.1, trendData.volatility + (Math.random() - 0.5) * 0.005));
        const noise = (Math.random() - 0.5) * 2 * newVol;
        let changePct = newTrend + noise;

        let newsText: string | undefined;
        const specialRoll = Math.random();
        const isStopHigh = Math.random() < 0.002;
        const isStopLow = !isStopHigh && Math.random() < 0.002;

        if (isStopHigh) {
          changePct = 0.5;
          newsText = `🚀 【ストップ高】${master.name} +50%！本日の取引終了`;
          trendData = { ...trendData, trend: newTrend, volatility: newVol, consecutiveTicks: newConsec, haltedAt: now };
        } else if (isStopLow) {
          changePct = -0.5;
          newsText = `📉 【ストップ安】${master.name} -50%！本日の取引終了`;
          trendData = { ...trendData, trend: newTrend, volatility: newVol, consecutiveTicks: newConsec, haltedAt: now };
        } else if (specialRoll < 0.012) {
          changePct = 0.45 + Math.random() * 0.55;
          newsText = `🚀 【バブル発生！】${master.name} が急騰中！`;
          trendData = { ...trendData, trend: 0.05, volatility: Math.min(0.1, newVol * 1.5), consecutiveTicks: 0 };
        } else if (specialRoll < 0.024) {
          changePct = -(0.45 + Math.random() * 0.55);
          newsText = `💥 【急落局面】${master.name} が投機売りで大幅下落`;
          trendData = { ...trendData, trend: -0.05, volatility: Math.min(0.1, newVol * 1.5), consecutiveTicks: 0 };
        } else if (eventForTick) {
          const affects = eventForTick.allMarket ||
            (eventForTick.targets && eventForTick.targets.includes(id)) ||
            (eventForTick.sectors && eventForTick.sectors.includes(master.sector));
          if (affects) {
            changePct = (eventForTick.changePct - MARKET_EVENT_BIAS) + noise * 0.2;
            if (Math.sign(changePct) !== Math.sign(eventForTick.changePct) && eventForTick.changePct !== 0) {
              changePct = eventForTick.changePct - MARKET_EVENT_BIAS;
            }
            newsText = `📰 ${eventForTick.text}（${changePct > 0 ? '+' : ''}${(changePct * 100).toFixed(1)}%）`;
            trendData = {
              ...trendData,
              trend: newTrend + (eventForTick.changePct - MARKET_EVENT_BIAS) * 0.3,
              volatility: newVol,
              consecutiveTicks: newConsec,
            };
          } else {
            trendData = { ...trendData, trend: newTrend, volatility: newVol, consecutiveTicks: newConsec };
          }
        } else {
          trendData = { ...trendData, trend: newTrend, volatility: newVol, consecutiveTicks: newConsec };
        }

        const anchorDrift = -((current - master.basePrice) / Math.max(master.basePrice, 1)) * 0.0025;
        changePct += anchorDrift;
        if (changePct > 4) changePct = 4;
        if (changePct < -0.95) changePct = -0.95;

        let newPrice = Math.max(1, Math.round(current * (1 + changePct)));
        const candleOpen = current;
        const candleClose = newPrice;
        const swing = Math.abs(changePct) * current * 0.3;
        const candleHigh = Math.max(candleOpen, candleClose) + Math.round(Math.random() * swing);
        const candleLow = Math.max(1, Math.min(candleOpen, candleClose) - Math.round(Math.random() * swing));

        if (newPrice >= master.splitThreshold) {
          const ratio = 2;
          const beforePrice = newPrice;
          newPrice = Math.max(1, Math.round(newPrice / ratio));
          prevClose = Math.max(1, Math.round(prevClose / ratio));
          dayOpen = Math.max(1, Math.round(dayOpen / ratio));
          dayHigh = Math.max(1, Math.round(dayHigh / ratio));
          dayLow = Math.max(1, Math.round(dayLow / ratio));
          yearHigh = Math.max(1, Math.round(yearHigh / ratio));
          yearLow = Math.max(1, Math.round(yearLow / ratio));
          const splitEvent: import('../types/game').StockSplitEvent = {
            stockId: id, ratio, timestamp: now, beforePrice, afterPrice: newPrice,
          };
          splitEvents.push(splitEvent);
          newsText = `📦 【株式分割】${master.name} が 1:${ratio} 分割（${beforePrice.toLocaleString()}WC → ${newPrice.toLocaleString()}WC）`;
          trendData = { ...trendData, trend: Math.max(-0.01, Math.min(0.01, trendData.trend * 0.5)), consecutiveTicks: 0 };
        }

        const volume = Math.max(1, Math.round((Math.abs(changePct) * 900 + 120) * (0.7 + Math.random() * 0.8)));
        dayHigh = Math.max(dayHigh, newPrice);
        dayLow = Math.min(dayLow, newPrice);
        dayVolume += volume;
        yearHigh = Math.max(yearHigh, newPrice);
        yearLow = Math.min(yearLow, newPrice);

        prices[id] = newPrice;
        trends[id] = trendData;
        stats[id] = { prevClose, dayOpen, dayHigh, dayLow, dayVolume, yearHigh, yearLow };
        newData[id] = newPrice;
        newData[`trend_${id}`] = trendData;
        newData[stockDayKey(id)] = todayKey;
        newData[stockYearKey(id)] = yearKey;
        newData[stockStatKey('prevClose', id)] = prevClose;
        newData[stockStatKey('dayOpen', id)] = dayOpen;
        newData[stockStatKey('dayHigh', id)] = dayHigh;
        newData[stockStatKey('dayLow', id)] = dayLow;
        newData[stockStatKey('dayVolume', id)] = dayVolume;
        newData[stockStatKey('yearHigh', id)] = yearHigh;
        newData[stockStatKey('yearLow', id)] = yearLow;

        const histKey = `history_${id}`;
        const hist: StockPricePoint[] = (data[histKey] as StockPricePoint[]) ?? [];
        const point: StockPricePoint = {
          timestamp: now,
          price: newPrice,
          open: candleOpen,
          high: candleHigh,
          low: candleLow,
          close: candleClose,
          volume,
          ...(newsText !== undefined ? { news: newsText } : {}),
        };
        hist.push(point);
        if (hist.length > 96) hist.splice(0, hist.length - 96);
        newData[histKey] = hist;

        if (newsText !== undefined) newsItems.push(newsText);
      }

      if (eventForTick && newsItems.length === 0) {
        newsItems.push(`📰 ${eventForTick.text}`);
      }

      newData.splitEvents = splitEvents;
      tx.set(ref, newData, { merge: true });
    });

    return {
      prices: prices as Record<StockId, number>,
      news: newsItems,
      trends: trends as Record<StockId, StockTrendData>,
      stats: stats as Record<StockId, import('../types/game').StockMarketStats>,
      splitEvents,
    };
  } catch (e) {
    console.error('[tickStockPrices] Firestoreへの書き込みに失敗:', e);
    throw e;
  }
}

export interface StockRankingEntry {
  uid: string;
  displayName: string;
  totalProfit: number;
  totalAssets: number;
}

export async function updateStockRanking(uid: string, displayName: string, profit: number, assets: number): Promise<void> {
  try {
    const ref = doc(db, 'stock_ranking', uid);
    await setDoc(ref, { uid, displayName, totalProfit: increment(profit), totalAssets: assets }, { merge: true });
  } catch { /* ignore */ }
}

export function subscribeStockRanking(cb: (entries: StockRankingEntry[]) => void): () => void {
  return onSnapshot(query(collection(db, 'stock_ranking'), orderBy('totalProfit', 'desc'), limit(20)), snap => {
    const entries: StockRankingEntry[] = [];
    snap.forEach(d => entries.push(d.data() as StockRankingEntry));
    cb(entries);
  }, () => cb([]));
}



// ============================================================
// ギルドシステム
// ============================================================
import type { GuildData, GuildMember, GuildChatMessage, FriendRequest, FriendEntry, DirectMessage } from '../types/game';

const GUILD_LEVEL_TABLE = [
  { level: 1, donateRequired: 0,       maxMembers: 10, warehouseSlots: 20 },
  { level: 2, donateRequired: 100000,  maxMembers: 15, warehouseSlots: 30 },
  { level: 3, donateRequired: 300000,  maxMembers: 20, warehouseSlots: 40 },
  { level: 4, donateRequired: 600000,  maxMembers: 25, warehouseSlots: 50 },
  { level: 5, donateRequired: 1000000, maxMembers: 30, warehouseSlots: 60 },
  { level: 6, donateRequired: 2000000, maxMembers: 35, warehouseSlots: 70 },
  { level: 7, donateRequired: 4000000, maxMembers: 40, warehouseSlots: 80 },
  { level: 8, donateRequired: 7000000, maxMembers: 50, warehouseSlots: 90 },
  { level: 9, donateRequired: 12000000, maxMembers: 60, warehouseSlots: 100 },
  { level: 10, donateRequired: 20000000, maxMembers: 100, warehouseSlots: 200 },
];

function calcGuildLevel(totalDonated: number): { level: number; maxMembers: number; warehouseSlots: number } {
  let result = GUILD_LEVEL_TABLE[0];
  for (const row of GUILD_LEVEL_TABLE) {
    if (totalDonated >= row.donateRequired) result = row;
  }
  return { level: result.level, maxMembers: result.maxMembers, warehouseSlots: result.warehouseSlots };
}

export { calcGuildLevel, GUILD_LEVEL_TABLE };

export async function createGuild(leaderUid: string, leaderName: string, name: string, description: string): Promise<{ success: boolean; error?: string }> {
  const existing = await getDocs(query(collection(db, 'guilds'), where('name', '==', name.trim())));
  if (!existing.empty) return { success: false, error: 'そのギルド名は既に使用されています' };
  const playerSnap = await getDoc(doc(db, 'players', leaderUid));
  if (playerSnap.exists()) {
    const pd = playerSnap.data() as any;
    if (pd.guildId) return { success: false, error: '既にギルドに所属しています' };
  }
  const now = Date.now();
  const guildRef = doc(collection(db, 'guilds'));
  const guildData: Omit<GuildData, 'id'> = {
    name: name.trim(), description: description.trim(),
    leaderUid, leaderName,
    memberUids: [leaderUid], memberCount: 1,
    level: 1, totalDonated: 0, bankGold: 0,
    warehouseItems: {}, warehouseCapacity: 20, maxMembers: 10,
    totalAssets: 0, totalKills: 0, totalLevels: 0,
    createdAt: now, updatedAt: now,
  };
  await setDoc(guildRef, { id: guildRef.id, ...guildData });
  const memberRef = doc(db, 'guilds', guildRef.id, 'members', leaderUid);
  await setDoc(memberRef, { uid: leaderUid, displayName: leaderName, level: playerSnap.exists() ? (playerSnap.data() as any).stats?.level ?? 1 : 1, role: 'leader', joinedAt: now, totalDonated: 0 } as GuildMember);
  await updateDoc(doc(db, 'players', leaderUid), { guildId: guildRef.id, guildName: name.trim() });
  return { success: true };
}

export async function joinGuild(uid: string, displayName: string, level: number, guildId: string): Promise<{ success: boolean; error?: string }> {
  const playerSnap = await getDoc(doc(db, 'players', uid));
  if (playerSnap.exists() && (playerSnap.data() as any).guildId) return { success: false, error: '既にギルドに所属しています' };
  const guildSnap = await getDoc(doc(db, 'guilds', guildId));
  if (!guildSnap.exists()) return { success: false, error: 'ギルドが見つかりません' };
  const guild = guildSnap.data() as GuildData;
  if (guild.memberCount >= guild.maxMembers) return { success: false, error: 'ギルドの人数上限に達しています' };
  const now = Date.now();
  await updateDoc(doc(db, 'guilds', guildId), { memberUids: arrayUnion(uid), memberCount: increment(1), updatedAt: now });
  await setDoc(doc(db, 'guilds', guildId, 'members', uid), { uid, displayName, level, role: 'member', joinedAt: now, totalDonated: 0 } as GuildMember);
  await updateDoc(doc(db, 'players', uid), { guildId, guildName: guild.name });
  return { success: true };
}

export async function leaveGuild(uid: string, guildId: string): Promise<{ success: boolean; error?: string }> {
  const guildSnap = await getDoc(doc(db, 'guilds', guildId));
  if (!guildSnap.exists()) return { success: false, error: 'ギルドが見つかりません' };
  const guild = guildSnap.data() as GuildData;
  if (guild.leaderUid === uid) return { success: false, error: 'リーダーは脱退できません（ギルドを解散してください）' };
  await updateDoc(doc(db, 'guilds', guildId), { memberUids: arrayRemove(uid), memberCount: increment(-1), updatedAt: Date.now() });
  await deleteDoc(doc(db, 'guilds', guildId, 'members', uid));
  await updateDoc(doc(db, 'players', uid), { guildId: null, guildName: null });
  return { success: true };
}

export async function disbandGuild(uid: string, guildId: string): Promise<{ success: boolean; error?: string }> {
  const guildSnap = await getDoc(doc(db, 'guilds', guildId));
  if (!guildSnap.exists()) return { success: false, error: 'ギルドが見つかりません' };
  const guild = guildSnap.data() as GuildData;
  if (guild.leaderUid !== uid) return { success: false, error: 'リーダーのみ解散できます' };
  // メンバー全員のguildIdをクリア
  for (const memberUid of guild.memberUids) {
    await updateDoc(doc(db, 'players', memberUid), { guildId: null, guildName: null }).catch(() => {});
  }
  await deleteDoc(doc(db, 'guilds', guildId));
  return { success: true };
}

export async function searchGuilds(nameQuery: string): Promise<GuildData[]> {
  const snap = await getDocs(query(collection(db, 'guilds'), orderBy('memberCount', 'desc'), limit(20)));
  const all = snap.docs.map(d => d.data() as GuildData);
  if (!nameQuery.trim()) return all;
  return all.filter(g => g.name.includes(nameQuery.trim()));
}

export async function donateToGuild(uid: string, guildId: string, gold: number): Promise<{ success: boolean; error?: string }> {
  if (gold <= 0) return { success: false, error: '無効な金額' };
  const now = Date.now();
  const guildSnap = await getDoc(doc(db, 'guilds', guildId));
  if (!guildSnap.exists()) return { success: false, error: 'ギルドが見つかりません' };
  const guild = guildSnap.data() as GuildData;
  const newDonated = guild.totalDonated + gold;
  const newLevel = calcGuildLevel(newDonated);
  await updateDoc(doc(db, 'guilds', guildId), {
    bankGold: increment(gold),
    totalDonated: increment(gold),
    level: newLevel.level,
    maxMembers: newLevel.maxMembers,
    warehouseCapacity: newLevel.warehouseSlots,
    updatedAt: now,
  });
  const memberRef = doc(db, 'guilds', guildId, 'members', uid);
  await updateDoc(memberRef, { totalDonated: increment(gold) }).catch(() => {});
  return { success: true };
}

export async function depositToGuildWarehouse(guildId: string, _uid: string, itemId: string, amount: number): Promise<{ success: boolean; error?: string }> {
  const guildSnap = await getDoc(doc(db, 'guilds', guildId));
  if (!guildSnap.exists()) return { success: false, error: 'ギルドが見つかりません' };
  const guild = guildSnap.data() as GuildData;
  const currentItems = guild.warehouseItems ?? {};
  const slotCount = Object.keys(currentItems).filter(k => (currentItems[k] ?? 0) > 0).length;
  if (!currentItems[itemId] && slotCount >= guild.warehouseCapacity) return { success: false, error: '倉庫がいっぱいです' };
  await updateDoc(doc(db, 'guilds', guildId), { [`warehouseItems.${itemId}`]: increment(amount), updatedAt: Date.now() });
  return { success: true };
}

export async function withdrawFromGuildWarehouse(guildId: string, _uid: string, itemId: string, amount: number): Promise<{ success: boolean; error?: string }> {
  const guildSnap = await getDoc(doc(db, 'guilds', guildId));
  if (!guildSnap.exists()) return { success: false, error: 'ギルドが見つかりません' };
  const guild = guildSnap.data() as GuildData;
  const current = (guild.warehouseItems ?? {})[itemId] ?? 0;
  if (current < amount) return { success: false, error: '在庫が不足しています' };
  await updateDoc(doc(db, 'guilds', guildId), { [`warehouseItems.${itemId}`]: increment(-amount), updatedAt: Date.now() });
  return { success: true };
}

export async function getGuildById(guildId: string): Promise<GuildData | null> {
  const snap = await getDoc(doc(db, 'guilds', guildId));
  return snap.exists() ? (snap.data() as GuildData) : null;
}

export function subscribeGuild(guildId: string, cb: (g: GuildData | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'guilds', guildId), snap => {
    cb(snap.exists() ? (snap.data() as GuildData) : null);
  });
}

export function subscribeGuildMembers(guildId: string, cb: (members: GuildMember[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'guilds', guildId, 'members'), snap => {
    cb(snap.docs.map(d => d.data() as GuildMember).sort((a,b) => a.role === 'leader' ? -1 : b.role === 'leader' ? 1 : b.totalDonated - a.totalDonated));
  });
}

export async function postGuildChat(guildId: string, uid: string, displayName: string, level: number, text: string): Promise<void> {
  await addDoc(collection(db, 'guilds', guildId, 'chat'), { uid, displayName, level, text: text.slice(0, 200), createdAt: Date.now() } as Omit<GuildChatMessage, 'id'>);
}

export function subscribeGuildChat(guildId: string, cb: (msgs: GuildChatMessage[]) => void): Unsubscribe {
  const q = query(collection(db, 'guilds', guildId, 'chat'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as GuildChatMessage)));
  });
}

export async function getGuildRanking(type: 'totalAssets' | 'totalKills' | 'totalLevels'): Promise<GuildData[]> {
  const snap = await getDocs(query(collection(db, 'guilds'), orderBy(type, 'desc'), limit(20)));
  return snap.docs.map(d => d.data() as GuildData);
}

export async function updateGuildStats(guildId: string, stats: { totalAssets?: number; totalKills?: number; totalLevels?: number }): Promise<void> {
  await updateDoc(doc(db, 'guilds', guildId), { ...stats, updatedAt: Date.now() }).catch(() => {});
}

// ============================================================
// フレンドシステム
// ============================================================

export async function sendFriendRequest(fromUid: string, fromName: string, fromLevel: number, toUid: string): Promise<{ success: boolean; error?: string }> {
  if (fromUid === toUid) return { success: false, error: '自分にフレンド申請はできません' };
  // 既存確認
  const existing = await getDocs(query(collection(db, 'friend_requests'), where('fromUid', '==', fromUid), where('toUid', '==', toUid)));
  if (!existing.empty) return { success: false, error: '既に申請済みです' };
  // 既にフレンドか確認
  const friendSnap = await getDoc(doc(db, 'friends', fromUid, 'list', toUid));
  if (friendSnap.exists()) return { success: false, error: '既にフレンドです' };
  await addDoc(collection(db, 'friend_requests'), { fromUid, fromName, fromLevel, toUid, status: 'pending', createdAt: Date.now() } as Omit<FriendRequest, 'id'>);
  return { success: true };
}

export async function respondFriendRequest(requestId: string, accept: boolean, currentUid: string): Promise<{ success: boolean }> {
  const reqSnap = await getDoc(doc(db, 'friend_requests', requestId));
  if (!reqSnap.exists()) return { success: false };
  const req = reqSnap.data() as FriendRequest;
  if (req.toUid !== currentUid) return { success: false };
  if (accept) {
    const now = Date.now();
    const toSnap = await getDoc(doc(db, 'players', req.toUid));
    const toName = toSnap.exists() ? (toSnap.data() as any).displayName ?? '' : '';
    const toLevel = toSnap.exists() ? (toSnap.data() as any).stats?.level ?? 1 : 1;
    await setDoc(doc(db, 'friends', req.fromUid, 'list', req.toUid), { uid: req.toUid, displayName: toName, level: toLevel, favorite: false, addedAt: now } as FriendEntry);
    await setDoc(doc(db, 'friends', req.toUid, 'list', req.fromUid), { uid: req.fromUid, displayName: req.fromName, level: req.fromLevel, favorite: false, addedAt: now } as FriendEntry);
  }
  await deleteDoc(doc(db, 'friend_requests', requestId));
  return { success: true };
}

export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  await deleteDoc(doc(db, 'friends', myUid, 'list', friendUid)).catch(() => {});
  await deleteDoc(doc(db, 'friends', friendUid, 'list', myUid)).catch(() => {});
}

export async function toggleFavoriteFriend(myUid: string, friendUid: string, favorite: boolean): Promise<void> {
  await updateDoc(doc(db, 'friends', myUid, 'list', friendUid), { favorite });
}

export function subscribeFriends(myUid: string, cb: (friends: FriendEntry[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'friends', myUid, 'list'), snap => {
    cb(snap.docs.map(d => d.data() as FriendEntry).sort((a,b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)));
  });
}

export function subscribeFriendRequests(myUid: string, cb: (reqs: FriendRequest[]) => void): Unsubscribe {
  const q = query(collection(db, 'friend_requests'), where('toUid', '==', myUid), where('status', '==', 'pending'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest)));
  });
}

export async function sendDirectMessage(fromUid: string, fromName: string, toUid: string, text: string, gift?: { itemId: string; amount: number }, goldAmount?: number): Promise<{ success: boolean; error?: string }> {
  const friendSnap = await getDoc(doc(db, 'friends', fromUid, 'list', toUid));
  if (!friendSnap.exists()) return { success: false, error: 'フレンドのみDMを送れます' };
  const msg: Omit<DirectMessage, 'id'> = { fromUid, fromName, toUid, text: text.slice(0, 300), read: false, createdAt: Date.now() };
  if (gift) msg.gift = gift;
  if (goldAmount && goldAmount > 0) msg.goldAmount = goldAmount;
  await addDoc(collection(db, 'direct_messages'), msg);
  return { success: true };
}

export function subscribeDirectMessages(myUid: string, cb: (msgs: DirectMessage[]) => void): Unsubscribe {
  const q = query(collection(db, 'direct_messages'), where('toUid', '==', myUid), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as DirectMessage)));
  });
}

export async function markDmRead(dmId: string): Promise<void> {
  await updateDoc(doc(db, 'direct_messages', dmId), { read: true }).catch(() => {});
}

export async function getFriendCount(uid: string): Promise<number> {
  const snap = await getDocs(collection(db, 'friends', uid, 'list'));
  return snap.size;
}

export async function fetchFriendCountRanking(): Promise<{ uid: string; displayName: string; friendCount: number }[]> {
  // players全員のfriendカウントを集計 (簡易実装: friend_count_rankingコレクション利用)
  const snap = await getDocs(query(collection(db, 'friend_count_ranking'), orderBy('friendCount', 'desc'), limit(20)));
  return snap.docs.map(d => d.data() as { uid: string; displayName: string; friendCount: number });
}

export async function updateFriendCountRanking(uid: string, displayName: string): Promise<void> {
  const count = await getFriendCount(uid);
  await setDoc(doc(db, 'friend_count_ranking', uid), { uid, displayName, friendCount: count });
}

// ============================================================
// 運営コンソール拡張機能（追加実装・既存構造非破壊）
// ============================================================

// ---- 管理ログ (/adminLogs) ----
export interface AdminLogEntry {
  id: string;
  adminId: string;
  targetId: string;
  action: string;
  value: unknown;
  createdAt: number;
}

export async function addAdminLog(log: Omit<AdminLogEntry, 'id' | 'createdAt'>): Promise<void> {
  const { addDoc, collection: col } = await import('firebase/firestore');
  await addDoc(col(db, 'adminLogs'), { ...log, createdAt: Date.now() });
}

export function subscribeAdminLogs(cb: (logs: AdminLogEntry[]) => void): () => void {
  return onSnapshot(
    query(collection(db, 'adminLogs'), orderBy('createdAt', 'desc'), limit(200)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminLogEntry, 'id'>) })))
  );
}

// ---- 強制コマンド（既存playerフィールドを上書きするのみ） ----
export async function adminGiveGold(uid: string, amount: number, adminId: string): Promise<void> {
  await updateDoc(doc(db, 'players', uid), { gold: increment(amount) });
  await addAdminLog({ adminId, targetId: uid, action: 'giveGold', value: amount });
}

export async function adminGiveItem(uid: string, itemId: string, amount: number, adminId: string): Promise<void> {
  const ref = doc(db, 'players', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const inventory = { ...(data.inventory ?? {}) };
  inventory[itemId] = (inventory[itemId] ?? 0) + amount;
  await updateDoc(ref, { inventory });
  await addAdminLog({ adminId, targetId: uid, action: 'giveItem', value: { itemId, amount } });
}

export async function adminSetHp(uid: string, value: number, adminId: string): Promise<void> {
  const ref = doc(db, 'players', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const stats = { ...(snap.data().stats ?? {}), hp: value };
  await updateDoc(ref, { stats });
  await addAdminLog({ adminId, targetId: uid, action: 'setHP', value });
}

export async function adminTeleport(uid: string, dungeonId: string, floor: number, adminId: string): Promise<void> {
  await updateDoc(doc(db, 'players', uid), { dungeonId, floor });
  await addAdminLog({ adminId, targetId: uid, action: 'teleport', value: { dungeonId, floor } });
}

export async function adminBanPlayer(uid: string, adminId: string): Promise<void> {
  await updateDoc(doc(db, 'players', uid), { banned: true });
  await addAdminLog({ adminId, targetId: uid, action: 'banPlayer', value: true });
}

// ---- セーブデータ巻き戻し (/playerHistory/{playerId}/{timestamp}) ----
export async function savePlayerSnapshot(uid: string, playerData: Record<string, unknown>, adminId: string): Promise<void> {
  const ts = Date.now();
  const { setDoc: setD, doc: d, collection: col } = await import('firebase/firestore');
  await setD(d(col(db, 'playerHistory', uid, 'snapshots'), String(ts)), { ...playerData, _snapshotAt: ts });
  await addAdminLog({ adminId, targetId: uid, action: 'saveSnapshot', value: ts });
}

export interface PlayerSnapshot {
  id: string;
  _snapshotAt: number;
  [key: string]: unknown;
}

export async function getPlayerSnapshots(uid: string): Promise<PlayerSnapshot[]> {
  const { collection: col, getDocs: gd, query: q, orderBy: ob } = await import('firebase/firestore');
  const snap = await gd(q(col(db, 'playerHistory', uid, 'snapshots'), ob('_snapshotAt', 'desc')));
  return snap.docs.map(dd => ({ id: dd.id, ...dd.data() } as PlayerSnapshot));
}

export async function restorePlayerSnapshot(uid: string, snapshot: Record<string, unknown>, adminId: string): Promise<void> {
  const { _snapshotAt, ...rest } = snapshot as { _snapshotAt?: number } & Record<string, unknown>;
  void _snapshotAt;
  await updateDoc(doc(db, 'players', uid), rest);
  await addAdminLog({ adminId, targetId: uid, action: 'restoreSnapshot', value: snapshot._snapshotAt });
}

// ---- ゲーム設定 / イベント管理 (/gameSettings) ----
export interface GameSettings {
  goldMultiplier: number;
  gachaRateUp: boolean;
  startAt: number;
  endAt: number;
}

export async function getGameSettings(): Promise<GameSettings | null> {
  try {
    const snap = await getDoc(doc(db, 'gameSettings', 'current'));
    return snap.exists() ? (snap.data() as GameSettings) : null;
  } catch { return null; }
}

export async function setGameSettings(settings: GameSettings, adminId: string): Promise<void> {
  await setDoc(doc(db, 'gameSettings', 'current'), settings);
  await addAdminLog({ adminId, targetId: '-', action: 'setGameSettings', value: settings });
}

// ---- マスターデータ上書き (/admin/item_master_overrides) ----
export interface ItemMasterOverride {
  name?: string;
  description?: string;
  buyPrice?: number;
  sellPrice?: number;
  maxStack?: number;
  weaponAtk?: number;
  weaponDef?: number;
  weaponHpBonus?: number;
}

export async function getItemMasterOverrides(): Promise<Record<string, ItemMasterOverride> | null> {
  try {
    const snap = await getDoc(doc(db, 'admin', 'item_master_overrides'));
    return snap.exists() ? (snap.data().overrides as Record<string, ItemMasterOverride>) : null;
  } catch { return null; }
}

export async function setItemMasterOverrides(overrides: Record<string, ItemMasterOverride>, adminId: string): Promise<void> {
  await setDoc(doc(db, 'admin', 'item_master_overrides'), { overrides });
  await addAdminLog({ adminId, targetId: '-', action: 'setItemMasterOverrides', value: Object.keys(overrides) });
}

// ---- 分析ダッシュボード (/analytics) ----
export interface AnalyticsSummary {
  totalGold: number;
  playerCount: number;
  avgLevel: number;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  try {
    const snap = await getDoc(doc(db, 'analytics', 'summary'));
    return snap.exists() ? (snap.data() as AnalyticsSummary) : null;
  } catch { return null; }
}

export async function refreshAnalyticsSummary(players: AdminPlayerData[]): Promise<AnalyticsSummary> {
  const totalGold = players.reduce((s, p) => s + (p.gold ?? 0), 0);
  const playerCount = players.length;
  const avgLevel = playerCount > 0
    ? Math.round(players.reduce((s, p) => s + (p.stats?.level ?? 1), 0) / playerCount)
    : 0;
  const summary: AnalyticsSummary = { totalGold, playerCount, avgLevel };
  await setDoc(doc(db, 'analytics', 'summary'), { ...summary, updatedAt: Date.now() });
  return summary;
}

// ---- タブ別メンテナンス ----
export type MaintainableTab = 'gathering' | 'fishing' | 'crafting' | 'market' | 'dungeon' | 'gamble' | 'online' | 'navi';
export interface TabMaintenanceEntry { active: boolean; message?: string; startedAt?: number; estimatedMinutes?: number; }
export type TabMaintenanceConfig = Partial<Record<MaintainableTab, TabMaintenanceEntry>>;

const TAB_MAINT_REF = () => doc(db, 'admin', 'tab_maintenance');

export async function getTabMaintenance(): Promise<TabMaintenanceConfig> {
  const snap = await getDoc(TAB_MAINT_REF());
  if (!snap.exists()) return {};
  return (snap.data() as { tabs: TabMaintenanceConfig }).tabs ?? {};
}

export async function setTabMaintenanceEntry(tab: MaintainableTab, entry: TabMaintenanceEntry | null): Promise<void> {
  const current = await getTabMaintenance();
  if (entry === null) { delete current[tab]; } else { current[tab] = entry; }
  await setDoc(TAB_MAINT_REF(), { tabs: current });
}

export function subscribeTabMaintenance(cb: (config: TabMaintenanceConfig) => void): Unsubscribe {
  let stopped = false;
  const fetch = () => getDoc(TAB_MAINT_REF()).then(snap => {
    if (stopped) return;
    cb(snap.exists() ? ((snap.data() as { tabs: TabMaintenanceConfig }).tabs ?? {}) : {});
  }).catch(() => {});
  fetch();
  const timer = setInterval(fetch, 5 * 60 * 1000);
  return () => { stopped = true; clearInterval(timer); };
}

// ---- 釣りキャスト時間設定 ----
const FISHING_CONFIG_REF = () => doc(db, 'admin', 'fishing_config');

export async function getFishingCastTime(): Promise<number | null> {
  const snap = await getDoc(FISHING_CONFIG_REF());
  if (!snap.exists()) return null;
  const data = snap.data() as { castTimeMs?: number };
  return data.castTimeMs ?? null;
}

export async function setFishingCastTime(castTimeMs: number | null): Promise<void> {
  await setDoc(FISHING_CONFIG_REF(), { castTimeMs });
}

export function subscribeFishingCastTime(cb: (castTimeMs: number | null) => void): Unsubscribe {
  const ref = FISHING_CONFIG_REF();
  let stopped = false;
  const fetch = () => getDoc(ref).then(snap => {
    if (stopped) return;
    if (!snap.exists()) { cb(null); return; }
    const data = snap.data() as { castTimeMs?: number };
    cb(data.castTimeMs ?? null);
  }).catch(() => cb(null));
  fetch();
  const unsub = onSnapshot(ref, snap => {
    if (stopped) return;
    if (!snap.exists()) { cb(null); return; }
    const data = snap.data() as { castTimeMs?: number };
    cb(data.castTimeMs ?? null);
  });
  return () => { stopped = true; unsub(); };
}

// ---- プレイヤー検索強化（フロントフィルタ用ヘルパー） ----
export function filterPlayersAdmin(
  players: AdminPlayerData[],
  opts: { id?: string; name?: string; idOrName?: string; minLevel?: number; maxLevel?: number; minGold?: number; maxGold?: number }
): AdminPlayerData[] {
  return players.filter(p => {
    // idOrName: ID または 表示名のいずれかに部分一致すればOK（OR検索）
    if (opts.idOrName) {
      const q = opts.idOrName;
      const idMatch = p.id.includes(q);
      const nameMatch = (p.displayName ?? '').includes(q);
      if (!idMatch && !nameMatch) return false;
    }
    if (opts.id && !p.id.includes(opts.id)) return false;
    if (opts.name && !(p.displayName ?? '').includes(opts.name)) return false;
    const lvl = p.stats?.level ?? 1;
    if (opts.minLevel !== undefined && lvl < opts.minLevel) return false;
    if (opts.maxLevel !== undefined && lvl > opts.maxLevel) return false;
    const gold = p.gold ?? 0;
    if (opts.minGold !== undefined && gold < opts.minGold) return false;
    if (opts.maxGold !== undefined && gold > opts.maxGold) return false;
    return true;
  });
}
