// src/systems/minigames.ts
// ミニゲームの全ロジック。UI に依存しない純粋関数のみ。

import type { GambleResult } from '../types/game';

// ============================================================
// 共通ユーティリティ
// ============================================================
const roll = (n: number) => Math.floor(Math.random() * n) + 1;
const rollDice = (sides = 6) => roll(sides);

/**
 * 還元率テーブルから結果を引く共通関数。
 * rewardTable の probability 合計が 1.0 になるよう設計すること。
 */
export function drawFromTable<T extends { probability: number }>(table: T[]): T {
  const rand = Math.random();
  let cum = 0;
  for (const entry of table) {
    cum += entry.probability;
    if (rand < cum) return entry;
  }
  return table[table.length - 1];
}

// ============================================================
// 1. 丁半
// ============================================================
export interface ChohanBet { side: 'cho' | 'han' }

export function playChohan(bet: number, choice: 'cho' | 'han'): GambleResult & { dice: number[] } {
  const d1 = rollDice();
  const d2 = rollDice();
  const sum = d1 + d2;
  const isDouble = d1 === d2;
  const isEven = sum % 2 === 0;

  let multiplier: number;
  let label: string;

  if (isDouble) {
    multiplier = 0.5;
    label = `ゾロ目（${d1}-${d2}）引き分け`;
  } else if ((isEven && choice === 'cho') || (!isEven && choice === 'han')) {
    multiplier = 2.0;
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
const CHINCHIRO_ROLES = [
  { name: 'ピンゾロ (1-1-1)',  multiplier: 10, check: (d: number[]) => d[0]===1 && d[1]===1 && d[2]===1 },
  { name: 'シゴロ (4-5-6)',    multiplier: 5,  check: (d: number[]) => { const s=d.slice().sort(); return s[0]===4&&s[1]===5&&s[2]===6; } },
  { name: 'ゾロ目',            multiplier: 3,  check: (d: number[]) => d[0]===d[1] && d[1]===d[2] },
  { name: 'ヒフミ (1-2-3)',    multiplier: 0,  check: (d: number[]) => { const s=d.slice().sort(); return s[0]===1&&s[1]===2&&s[2]===3; } },
];

export function playChinchiro(bet: number): GambleResult & { dice: number[] } {
  const dice = [rollDice(), rollDice(), rollDice()];
  const sorted = dice.slice().sort((a, b) => a - b);

  for (const role of CHINCHIRO_ROLES) {
    if (role.check(dice)) {
      const goldDelta = Math.floor(bet * role.multiplier) - bet;
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
  }

  // 目なし（どの出目も揃わない）or 通常目
  const hasSequence = (sorted[2] - sorted[0] === 2) && (new Set(sorted).size === 3);
  if (hasSequence) {
    const max = sorted[2];
    const multiplier = max >= 4 ? 1.5 : 0;
    const goldDelta = Math.floor(bet * multiplier) - bet;
    return { rewardLabel: `数字目 ${max}`, multiplier, goldDelta, itemRewards: [], symbols: dice.map(String), dice, roleName: `目 ${max}` };
  }

  return { rewardLabel: '目なし（ハズレ）', multiplier: 0, goldDelta: -bet, itemRewards: [], symbols: dice.map(String), dice, roleName: '目なし' };
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
    const j = Math.floor(Math.random() * (i + 1));
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

export function dealPoker(bet: number): PokerState {
  const deck = shuffle(buildDeck());
  return { hand: deck.slice(0, 5), held: [false,false,false,false,false], phase: 'deal', bet };
}

export function drawPoker(state: PokerState): PokerState {
  const deck = shuffle(buildDeck());
  const usedLabels = new Set(state.hand.map(c => c.label));
  const remaining = deck.filter(c => !usedLabels.has(c.label));
  const newHand = state.hand.map((c, i) => state.held[i] ? c : remaining.shift()!);
  const result = evaluatePokerHand(newHand, state.bet);
  return { ...state, hand: newHand, phase: 'result', result };
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

  if (isFlush && isRoyalStraight)            { handName='ロイヤルストレートフラッシュ'; multiplier=250; }
  else if (isFlush && isStraight)            { handName='ストレートフラッシュ';         multiplier=50;  }
  else if (counts[0]===4)                    { handName='フォーカード';                 multiplier=25;  }
  else if (counts[0]===3 && counts[1]===2)   { handName='フルハウス';                   multiplier=9;   }
  else if (isFlush)                          { handName='フラッシュ';                   multiplier=6;   }
  else if (isStraight)                       { handName='ストレート';                   multiplier=4;   }
  else if (counts[0]===3)                    { handName='スリーカード';                 multiplier=3;   }
  else if (counts[0]===2 && counts[1]===2)   { handName='ツーペア';                    multiplier=2;   }
  else if (counts[0]===2 && Math.max(...Object.keys(rankCounts).filter(k => rankCounts[Number(k)]===2).map(Number)) >= 11) {
    handName='ワンペア（JJ以上）'; multiplier=1;
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
export const JACKPOT_POOL_RATE = 0.30;  // 賭け金の30%をプールへ
export const JACKPOT_WIN_PROB  = 0.001; // 当選確率 0.1%

export function calcJackpotContrib(bet: number): number {
  return Math.floor(bet * JACKPOT_POOL_RATE);
}

export function rollJackpot(): boolean {
  return Math.random() < JACKPOT_WIN_PROB;
}
