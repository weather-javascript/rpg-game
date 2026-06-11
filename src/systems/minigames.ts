// src/systems/minigames.ts
// ミニゲームの全ロジック。UI に依存しない純粋関数のみ。

import type { GambleResult } from '../types/game';
import { randomInt, randomChance, drawFromTableSecure } from '../utils/random';

// ============================================================
// 共通ユーティリティ
// ============================================================
const roll = (n: number) => randomInt(n) + 1;
const rollDice = (sides = 6) => roll(sides);

/**
 * 還元率テーブルから結果を引く共通関数。
 * rewardTable の probability 合計が 1.0 になるよう設計すること。
 */
export function drawFromTable<T extends { probability: number }>(table: T[]): T {
  return drawFromTableSecure(table);
}

// ============================================================
// 1. 丁半
// ============================================================
export interface ChohanBet { side: 'cho' | 'han' }

export function playChohan(bet: number, choice: 'cho' | 'han'): GambleResult & { dice: number[] } {
  const d1 = rollDice();
  const d2 = rollDice();
  const sum = d1 + d2;
  const isEven = sum % 2 === 0;

  let multiplier: number;
  let label: string;

  if ((isEven && choice === 'cho') || (!isEven && choice === 'han')) {
    multiplier = 1.9;
    label = `${choice === 'cho' ? '丁（偶数）' : '半（奇数）'} 当たり！ (${d1}+${d2}=${sum})`;
  } else {
    multiplier = 0;
    label = `${choice === 'cho' ? '丁（偶数）' : '半（奇数）'} ハズレ (${d1}+${d2}=${sum})`;
  }

  const goldDelta = Math.floor(bet * multiplier) - bet;
  return {
    rewardLabel: label,
    multiplier,
    goldDelta,
    itemRewards: [],
    symbols: [String(d1), String(d2)],
    dice: [d1, d2],
  };
}

// ============================================================
// 2. チンチロリン
// ============================================================
// チンチロリン役の強さを数値で返す（比較用）。role が無い場合は -1
// 戻り値: { rank: number, multiplier: number, name: string, isInstantLoss: boolean }
export interface ChinchiroRole {
  name: string;
  rank: number;       // 比較用強さ（高いほど強い）
  multiplier: number; // 払い戻し倍率（0=負け）
  isInstantWin: boolean;
  isInstantLoss: boolean;
}

export function getChinchiroRole(dice: number[]): ChinchiroRole | null {
  const s = dice.slice().sort((a, b) => a - b);
  // ピンゾロ 1-1-1
  if (s[0]===1 && s[1]===1 && s[2]===1) {
    return { name: 'ピンゾロ (1-1-1)', rank: 100, multiplier: 2, isInstantWin: true, isInstantLoss: false };
  }
  // ヒフミ 1-2-3 → 即負け
  if (s[0]===1 && s[1]===2 && s[2]===3) {
    return { name: 'ヒフミ (1-2-3)', rank: -1, multiplier: 0, isInstantWin: false, isInstantLoss: true };
  }
  // シゴロ 4-5-6
  if (s[0]===4 && s[1]===5 && s[2]===6) {
    return { name: 'シゴロ (4-5-6)', rank: 90, multiplier: 1.5, isInstantWin: false, isInstantLoss: false };
  }
  // アラシ（ゾロ目: ピンゾロ以外） → 通常勝利扱い 1.8倍
  if (s[0]===s[1] && s[1]===s[2]) {
    return { name: `アラシ (${s[0]}-${s[0]}-${s[0]})`, rank: 10 + s[0] * 10, multiplier: 1.3, isInstantWin: false, isInstantLoss: false };
  }
  // 通常目: 2つ被り + 残り1つ。残りの1つが目
  const counts: Record<number, number> = {};
  for (const d of dice) counts[d] = (counts[d] ?? 0) + 1;
  const pairs = Object.entries(counts).filter(([, c]) => c === 2);
  const singles = Object.entries(counts).filter(([, c]) => c === 1);
  if (pairs.length === 1 && singles.length === 1) {
    const pip = Number(singles[0][0]);
    return { name: `通常目 ${pip}`, rank: pip, multiplier: 1.2, isInstantWin: false, isInstantLoss: false };
  }
  // 目なし（3つとも別々 & 役なし）
  return null;
}

export function playChinchiro(bet: number): GambleResult & { dice: number[]; roleName: string } {
  // 最大3回振る。役が出た時点で終了。3回とも役なし → 目なし負け
  let dice: number[] = [];
  let role: ChinchiroRole | null = null;
  for (let i = 0; i < 3; i++) {
    dice = [rollDice(), rollDice(), rollDice()];
    role = getChinchiroRole(dice);
    if (role !== null) break;
  }
  if (!role) {
    return { rewardLabel: '目なし（ハズレ）', multiplier: 0, goldDelta: -bet, itemRewards: [], symbols: dice.map(String), dice, roleName: '目なし' };
  }
  const goldDelta = role.multiplier > 0 ? Math.floor(bet * role.multiplier) - bet : -bet;
  return {
    rewardLabel: role.name,
    multiplier: role.multiplier,
    goldDelta,
    itemRewards: [],
    symbols: dice.map(String),
    dice,
    roleName: role.name,
  };
}

// ============================================================
// 3. 簡易ポーカー
// ============================================================
type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 2|3|4|5|6|7|8|9|10|11|12|13|14; // 11=J,12=Q,13=K,14=A
type Card = { suit: Suit; rank: Rank; label: string };

const SUITS: Suit[] = ['♠','♥','♦','♣'];
const RANK_LABELS: Record<number, string> = { 11:'J', 12:'Q', 13:'K', 14:'A' };

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let r = 2; r <= 14; r++) {
      deck.push({ suit, rank: r as Rank, label: `${suit}${RANK_LABELS[r] ?? r}` });
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface PokerState {
  hand: Card[];
  held: boolean[];
  phase: 'deal' | 'draw' | 'result';
  result?: GambleResult;
  bet: number;
}

export function dealPoker(): PokerState {
  const deck = shuffle(buildDeck());
  return { hand: deck.slice(0, 5), held: [false,false,false,false,false], phase: 'deal', bet: 0 };
}

export function drawPoker(state: PokerState, hold: boolean[]): { result: GambleResult; newState: PokerState } {
  const deck = shuffle(buildDeck());
  const usedLabels = new Set(state.hand.map(c => c.label));
  const remaining = deck.filter(c => !usedLabels.has(c.label));
  const newHand = state.hand.map((c, i) => hold[i] ? c : remaining.shift()!);
  const result = evaluatePokerHand(newHand, state.bet);
  const newState: PokerState = { ...state, hand: newHand, held: hold, phase: 'result', result };
  return { result, newState };
}

function evaluatePokerHand(hand: Card[], bet: number): GambleResult {
  const ranks = hand.map(c => c.rank).sort((a, b) => a - b);
  const suits = hand.map(c => c.suit);
  const rankCounts: Record<number, number> = {};
  for (const r of ranks) rankCounts[r] = (rankCounts[r] ?? 0) + 1;
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const isFlush = new Set(suits).size === 1;
  const isStraight = ranks[4] - ranks[0] === 4 && new Set(ranks).size === 5;
  const isRoyalStraight = isStraight && ranks[0] === 10;

  let handName: string;
  let multiplier: number;

  if (isFlush && isRoyalStraight)            { handName='ロイヤルストレートフラッシュ'; multiplier=50;  }
  else if (isFlush && isStraight)            { handName='ストレートフラッシュ';         multiplier=20;  }
  else if (counts[0]===4)                    { handName='フォーカード';                 multiplier=10;  }
  else if (counts[0]===3 && counts[1]===2)   { handName='フルハウス';                   multiplier=5;   }
  else if (isFlush)                          { handName='フラッシュ';                   multiplier=2.8; }
  else if (isStraight)                       { handName='ストレート';                   multiplier=2.3; }
  else if (counts[0]===3)                    { handName='スリーカード';                 multiplier=2;   }
  else if (counts[0]===2 && counts[1]===2)   { handName='ツーペア';                    multiplier=1.5; }
  else if (counts[0]===2) {
    handName='ワンペア'; multiplier=1.2;
  }
  else { handName='ブタ（役なし）'; multiplier=0; }

  const goldDelta = Math.floor(bet * multiplier) - bet;
  return {
    rewardLabel: handName,
    multiplier,
    goldDelta,
    itemRewards: [],
    hand: hand.map(c => c.label),
    handName,
  };
}

// ============================================================
// 4. ジャックポット（Firestoreプール連動ロジック）
// プールへの積立・当選チェックはここで計算し、
// 実際のFirestore 読み書きは multiplayer.ts が担う。
// ============================================================
export const JACKPOT_POOL_RATE = 0.20;  // 賭け金の20%をプールへ
export const JACKPOT_WIN_PROB  = 0.001; // 当選確率 0.1%

export function calcJackpotContrib(bet: number): number {
  return Math.floor(bet * JACKPOT_POOL_RATE);
}

export function rollJackpot(): boolean {
  return randomChance(JACKPOT_WIN_PROB);
}
