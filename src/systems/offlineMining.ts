// src/systems/offlineMining.ts
// オフライン採掘（採掘委任）：ログアウト中に進んだ分の採取をログイン時に一括精算する。
// 重要な制約：
//  - リアルタイム処理は行わない（setIntervalで進行させない）
//  - 経過時間は最大60分にクランプ
//  - 最終獲得数は必ず15〜30個のランダム値で上限キャップする
//  - レア素材（rare/epic/legendary）の確率は通常の半分
//  - 経験値は通常の約50%
//  - 危険ノード・特殊イベントは対象外

import type { PlayerData, GatherCategory } from '../types/game';
import { GATHER_NODE_MASTER, ITEM_MASTER } from '../data/masters';
import { getCategoryFromSkillId } from './gatheringSystem';
import { randomChance, randomIntRange } from '../utils/random';

const MAX_ELAPSED_MS = 60 * 60 * 1000; // 最大60分
const MINUTES_PER_ROLL = 1;             // 1分=1回の採掘判定
const EXTRA_DROP_CHANCE = 0.2;          // 1回ごとに20%で追加1個
const RARE_RATE_MULT = 0.5;             // レア素材は確率半分
const EXP_RATIO = 0.5;                  // 経験値は通常の約50%
const CAP_MIN = 15;
const CAP_MAX = 30;

const RARE_RARITIES = new Set(['rare', 'epic', 'legendary']);

export interface OfflineMiningResult {
  drops: { itemId: string; amount: number }[];
  totalAmount: number;
  expGained: number;
  skillId: string;
  capped: boolean;
  elapsedMinutes: number;
}

/** 指定カテゴリの通常ノード（危険ノード除く）一覧を返す */
function getCategoryNodes(category: GatherCategory) {
  return Object.values(GATHER_NODE_MASTER).filter(n => {
    if (n.isDanger) return false; // 危険ノードは対象外
    return getCategoryFromSkillId(n.requiredSkill.skillId as string) === category;
  });
}

/**
 * オフライン採掘の精算を計算する（副作用なし・純粋関数）。
 * 呼び出し側でplayerのinventory/exp/図鑑への反映を行うこと。
 */
export function calcOfflineMiningResult(
  player: PlayerData,
  category: GatherCategory,
  elapsedMs: number
): OfflineMiningResult | null {
  const nodes = getCategoryNodes(category);
  if (nodes.length === 0) return null;

  const clampedMs = Math.min(elapsedMs, MAX_ELAPSED_MS);
  const elapsedMinutes = Math.floor(clampedMs / 60000);
  const rollCount = Math.floor(elapsedMinutes / MINUTES_PER_ROLL);
  if (rollCount <= 0) return null;

  const skillId = nodes[0].requiredSkill.skillId;
  const skillLevel = player.skillLevels?.[skillId] ?? 1;

  const totals: Record<string, number> = {};

  for (let i = 0; i < rollCount; i++) {
    // 候補ノードからランダムに1つ選ぶ（通常採取と同じドロップテーブルを使用）
    const node = nodes[randomIntRange(0, nodes.length - 1)];
    for (const drop of node.drops) {
      const item = ITEM_MASTER[drop.itemId];
      const isRare = !!item && RARE_RARITIES.has(item.rarity);
      let rate = drop.baseRate + (drop.skillRateBonus ?? 0) * skillLevel;
      if (isRare) rate *= RARE_RATE_MULT; // レア素材は確率半分
      rate = Math.min(1, Math.max(0, rate));
      if (!randomChance(rate)) continue;

      // 1回ごとに1個確定、20%で追加1個
      let amount = 1;
      if (randomChance(EXTRA_DROP_CHANCE)) amount += 1;
      totals[drop.itemId] = (totals[drop.itemId] ?? 0) + amount;
    }
  }

  let totalAmount = Object.values(totals).reduce((a, b) => a + b, 0);
  if (totalAmount <= 0) return null;

  // 最終キャップ：必ず15〜30個のランダム値で制限する
  const cap = randomIntRange(CAP_MIN, CAP_MAX);
  let capped = false;
  if (totalAmount > cap) {
    capped = true;
    // 比率を保ちながら全アイテムを按分カット
    let remaining = cap;
    const itemIds = Object.keys(totals);
    const scaled: Record<string, number> = {};
    for (const id of itemIds) {
      const ratio = totals[id] / totalAmount;
      const v = Math.max(0, Math.floor(cap * ratio));
      scaled[id] = v;
      remaining -= v;
    }
    // 端数を先頭から1個ずつ配る
    let idx = 0;
    while (remaining > 0 && itemIds.length > 0) {
      const id = itemIds[idx % itemIds.length];
      scaled[id] += 1;
      remaining -= 1;
      idx += 1;
    }
    for (const id of itemIds) totals[id] = scaled[id];
    totalAmount = cap;
  }

  const drops = Object.entries(totals)
    .filter(([, amt]) => amt > 0)
    .map(([itemId, amount]) => ({ itemId, amount }));

  const baseExpPerRoll = 10 + skillLevel * 2;
  const expFinal = Math.round(baseExpPerRoll * rollCount * EXP_RATIO);

  return {
    drops,
    totalAmount,
    expGained: expFinal,
    skillId,
    capped,
    elapsedMinutes,
  };
}
