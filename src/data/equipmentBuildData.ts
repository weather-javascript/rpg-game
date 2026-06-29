// src/data/equipmentBuildData.ts
// ver3.0.0: 装備の特性・付与効果・セット効果・覚醒段階データ。
// 既存の ITEM_MASTER / masters.ts は直接編集せず、ここで定義した素材・レシピを
// masters.ts 側の末尾で Object.assign / push して合成する（既存データは無傷）。

import type { ItemMaster, CraftRecipe } from '../types/game';
import type {
  TraitId, TraitDef, AffixId, AffixDef, AffixInstance, SetDef,
} from '../types/v3Types';
import { AWAKENING_MAX, AFFIX_SLOTS_PER_AWAKEN } from '../types/v3Types';
import { randomIntRange, randomChance } from '../utils/random';

// ============================================================
// 特性マスター（10種）
// ============================================================
export const TRAIT_MASTER: Record<TraitId, TraitDef> = {
  crit_focus:        { id: 'crit_focus',        name: 'クリティカル特化', icon: '🗲', description: '攻撃力が常時上昇する。一撃の重さを追求するタイプ。',
    effects: { atkPct: 0.04 }, effectsPerAwaken: { atkPct: 0.02 } },
  heal_focus:        { id: 'heal_focus',        name: '回復特化',       icon: '✨', description: 'アイテム・スキルによる回復量が増加する。',
    effects: { healPct: 0.08 }, effectsPerAwaken: { healPct: 0.04 } },
  gather_focus:      { id: 'gather_focus',      name: '採取特化',       icon: '⛏️', description: '採取の成功率・採取量が増加する。',
    effects: { gatherSuccessPct: 0.04, gatherYieldPct: 0.05 }, effectsPerAwaken: { gatherSuccessPct: 0.02, gatherYieldPct: 0.03 } },
  fish_focus:        { id: 'fish_focus',        name: '釣り特化',       icon: '🎣', description: '釣りの成功率・レア魚率が上昇する。',
    effects: { fishSuccessMult: 1.06, fishRarePct: 0.03 }, effectsPerAwaken: { fishSuccessMult: 1.03, fishRarePct: 0.02 } },
  gamble_focus:      { id: 'gamble_focus',      name: 'ギャンブル補正', icon: '🎰', description: 'ギャンブルの配当倍率が上昇する。',
    effects: { gambleMult: 1.03 }, effectsPerAwaken: { gambleMult: 1.02 } },
  drop_focus:        { id: 'drop_focus',        name: 'ドロップ率上昇', icon: '💎', description: 'モンスター討伐時のアイテムドロップ率が上昇する。',
    effects: { dropRatePct: 0.05 }, effectsPerAwaken: { dropRatePct: 0.03 } },
  flee_focus:        { id: 'flee_focus',        name: '逃走成功率上昇', icon: '🏃', description: 'ダンジョンでの逃走成功率が上昇する。',
    effects: { fleeRateBonus: 0.08 }, effectsPerAwaken: { fleeRateBonus: 0.04 } },
  defense_focus:     { id: 'defense_focus',     name: '防御特化',       icon: '🛡️', description: '防御力が常時上昇する。耐久重視タイプ。',
    effects: { defPct: 0.05 }, effectsPerAwaken: { defPct: 0.03 } },
  preemptive_focus:  { id: 'preemptive_focus',  name: '先制率上昇',     icon: '⚡', description: '戦闘開始時に奇襲が発生しやすくなる。',
    effects: { preemptiveChance: 0.06 }, effectsPerAwaken: { preemptiveChance: 0.03 } },
  exp_focus:         { id: 'exp_focus',         name: '経験値獲得量上昇', icon: '📈', description: '戦闘経験値・生活スキル経験値が増加する。',
    effects: { expMult: 1.04, skillExpMult: 1.04 }, effectsPerAwaken: { expMult: 1.02, skillExpMult: 1.02 } },
};

const TRAIT_ID_LIST = Object.keys(TRAIT_MASTER) as TraitId[];

// 旗艦装備への意味づけ（フレーバー一致のための明示割当。未掲載のIDはハッシュで自動割当）
export const TRAIT_OVERRIDE: Record<string, TraitId> = {
  aegis_lifeguard_helmet: 'defense_focus', aegis_lifeguard_chestplate: 'defense_focus',
  aegis_lifeguard_leggings: 'defense_focus', aegis_lifeguard_boots: 'defense_focus',
  aegis_lifeguard_offhand: 'defense_focus',
  iron_sacrifice_staff: 'heal_focus', emerald_sacrifice_staff: 'heal_focus', netherite_sacrifice_staff: 'heal_focus',
  gold_sacrifice_staff: 'drop_focus', diamond_sacrifice_staff: 'defense_focus',
  shinen_dan_ken: 'crit_focus',
  revolution_sword: 'crit_focus', revolution_defencer: 'defense_focus', revolution_healwand: 'heal_focus',
  memory_of_flower: 'heal_focus', diamond_staff: 'exp_focus',
  revolution_armor_helmet: 'defense_focus', revolution_armor_chest: 'defense_focus',
  revolution_armor_leggings: 'defense_focus', revolution_armor_boots: 'defense_focus',
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** itemId に対し常に同じ特性を返す（再ロール不可・装備個性の固定パラメータ） */
export function getItemTrait(itemId: string): TraitDef {
  const overridden = TRAIT_OVERRIDE[itemId];
  if (overridden) return TRAIT_MASTER[overridden];
  const idx = hashStr(itemId) % TRAIT_ID_LIST.length;
  return TRAIT_MASTER[TRAIT_ID_LIST[idx]];
}

// ============================================================
// 付与効果マスター（10種 × 4段階レアリティ）
// ============================================================
export const AFFIX_MASTER: Record<AffixId, AffixDef> = {
  atk_pct:             { id: 'atk_pct', name: '攻撃+%', description: '攻撃力が上昇する', modifierKey: 'atkPct',
    tiers: [{ tier:1, min:0.02, max:0.04, rarity:'common' }, { tier:2, min:0.04, max:0.07, rarity:'rare' }, { tier:3, min:0.07, max:0.11, rarity:'epic' }, { tier:4, min:0.11, max:0.16, rarity:'legendary' }] },
  def_pct:             { id: 'def_pct', name: '防御+%', description: '防御力が上昇する', modifierKey: 'defPct',
    tiers: [{ tier:1, min:0.02, max:0.04, rarity:'common' }, { tier:2, min:0.04, max:0.07, rarity:'rare' }, { tier:3, min:0.07, max:0.11, rarity:'epic' }, { tier:4, min:0.11, max:0.16, rarity:'legendary' }] },
  heal_pct:            { id: 'heal_pct', name: 'HP回復量+%', description: '回復量が上昇する', modifierKey: 'healPct',
    tiers: [{ tier:1, min:0.03, max:0.06, rarity:'common' }, { tier:2, min:0.06, max:0.10, rarity:'rare' }, { tier:3, min:0.10, max:0.15, rarity:'epic' }, { tier:4, min:0.15, max:0.22, rarity:'legendary' }] },
  gather_success_pct:  { id: 'gather_success_pct', name: '採取成功率+%', description: '採取成功率が上昇する', modifierKey: 'gatherSuccessPct',
    tiers: [{ tier:1, min:0.02, max:0.04, rarity:'common' }, { tier:2, min:0.04, max:0.07, rarity:'rare' }, { tier:3, min:0.07, max:0.10, rarity:'epic' }, { tier:4, min:0.10, max:0.15, rarity:'legendary' }] },
  fish_success_pct:    { id: 'fish_success_pct', name: '釣り成功率+%', description: '釣りの成功率が上昇する', modifierKey: 'fishSuccessMult',
    tiers: [{ tier:1, min:0.02, max:0.04, rarity:'common' }, { tier:2, min:0.04, max:0.07, rarity:'rare' }, { tier:3, min:0.07, max:0.10, rarity:'epic' }, { tier:4, min:0.10, max:0.15, rarity:'legendary' }] },
  sell_price_pct:      { id: 'sell_price_pct', name: '店売り価格+%', description: '店売り価格が上昇する', modifierKey: 'sellPriceMult',
    tiers: [{ tier:1, min:0.02, max:0.04, rarity:'common' }, { tier:2, min:0.04, max:0.08, rarity:'rare' }, { tier:3, min:0.08, max:0.12, rarity:'epic' }, { tier:4, min:0.12, max:0.18, rarity:'legendary' }] },
  mana_cost_cut_pct:   { id: 'mana_cost_cut_pct', name: '消費MP軽減', description: 'スキル使用時の消費MPが軽減される', modifierKey: 'mpCostCutPct',
    tiers: [{ tier:1, min:0.02, max:0.04, rarity:'common' }, { tier:2, min:0.04, max:0.07, rarity:'rare' }, { tier:3, min:0.07, max:0.10, rarity:'epic' }, { tier:4, min:0.10, max:0.15, rarity:'legendary' }] },
  crit_dmg_pct:        { id: 'crit_dmg_pct', name: 'クリティカルダメージ+%', description: '攻撃力にさらに上乗せされる', modifierKey: 'atkPct',
    tiers: [{ tier:1, min:0.02, max:0.03, rarity:'common' }, { tier:2, min:0.03, max:0.05, rarity:'rare' }, { tier:3, min:0.05, max:0.08, rarity:'epic' }, { tier:4, min:0.08, max:0.12, rarity:'legendary' }] },
  exp_pct:             { id: 'exp_pct', name: '経験値+%', description: '獲得経験値が上昇する', modifierKey: 'expMult',
    tiers: [{ tier:1, min:0.02, max:0.04, rarity:'common' }, { tier:2, min:0.04, max:0.07, rarity:'rare' }, { tier:3, min:0.07, max:0.10, rarity:'epic' }, { tier:4, min:0.10, max:0.15, rarity:'legendary' }] },
  drop_pct:            { id: 'drop_pct', name: 'ドロップ率+%', description: 'アイテムドロップ率が上昇する', modifierKey: 'dropRatePct',
    tiers: [{ tier:1, min:0.02, max:0.04, rarity:'common' }, { tier:2, min:0.04, max:0.07, rarity:'rare' }, { tier:3, min:0.07, max:0.10, rarity:'epic' }, { tier:4, min:0.10, max:0.15, rarity:'legendary' }] },
};

const AFFIX_ID_LIST = Object.keys(AFFIX_MASTER) as AffixId[];

/** 装備の覚醒段階から、現在解放されている付与効果スロット数を返す */
export function getAffixSlotCount(awakening: number): number {
  const idx = Math.max(0, Math.min(AWAKENING_MAX, awakening));
  return AFFIX_SLOTS_PER_AWAKEN[idx] ?? 1;
}

/** レアリティに応じた抽選重み（高レアリティ品ほど上位tierが出やすい） */
function tierWeightsForRarity(rarity: string): [number, number, number, number] {
  switch (rarity) {
    case 'legendary': return [10, 25, 35, 30];
    case 'epic':       return [20, 35, 30, 15];
    case 'rare':       return [35, 40, 20, 5];
    default:           return [60, 30, 9, 1];
  }
}

function pickTier(rarity: string): 1 | 2 | 3 | 4 {
  const w = tierWeightsForRarity(rarity);
  const total = w[0] + w[1] + w[2] + w[3];
  let roll = randomIntRange(1, total);
  for (let i = 0; i < 4; i++) {
    if (roll <= w[i]) return (i + 1) as 1 | 2 | 3 | 4;
    roll -= w[i];
  }
  return 1;
}

/** 付与効果を slotCount 個、重複なしで抽選する */
export function rollAffixes(itemRarity: string, slotCount: number): AffixInstance[] {
  const pool = [...AFFIX_ID_LIST];
  const result: AffixInstance[] = [];
  for (let i = 0; i < slotCount && pool.length > 0; i++) {
    const pickIdx = randomIntRange(0, pool.length - 1);
    const affixId = pool.splice(pickIdx, 1)[0];
    const tier = pickTier(itemRarity);
    const def = AFFIX_MASTER[affixId];
    const tierDef = def.tiers[tier - 1];
    const value = tierDef.min + Math.random() * (tierDef.max - tierDef.min);
    result.push({ affixId, tier, value: Math.round(value * 1000) / 1000 });
  }
  return result;
}

// ============================================================
// セット効果（同一系統の防具をスロット接尾辞で自動グルーピング）
// ============================================================
const SLOT_SUFFIX_RE = /_(helmet|chestplate|chest|leggings|boots|offhand)$/;

export function getItemSetKey(itemId: string): string | null {
  const m = itemId.match(SLOT_SUFFIX_RE);
  if (!m) return null;
  return itemId.slice(0, itemId.length - m[0].length);
}

const RARITY_SET_POWER: Record<string, number> = { common: 1, uncommon: 1.2, rare: 1.6, epic: 2.4, legendary: 3.5 };

/**
 * ITEM_MASTER 全体を走査し、防具スロット系武器・防具を setKey ごとに自動グルーピングして
 * 2点/4点/5点セット効果を自動生成する。手動でのセット登録は不要（将来追加装備にも自動対応）。
 */
export function buildAutoSets(itemMaster: Record<string, ItemMaster>): Record<string, SetDef> {
  const groups: Record<string, string[]> = {};
  for (const [id, item] of Object.entries(itemMaster)) {
    if (item.category !== 'armor' && item.itemType !== 'Armor') continue;
    const setKey = getItemSetKey(id);
    if (!setKey) continue;
    (groups[setKey] ??= []).push(id);
  }
  const sets: Record<string, SetDef> = {};
  for (const [setKey, itemIds] of Object.entries(groups)) {
    if (itemIds.length < 2) continue; // 1点しかない場合はセットとして扱わない
    const maxRarityPower = Math.max(...itemIds.map(id => RARITY_SET_POWER[itemMaster[id].rarity] ?? 1));
    const thresholds = [];
    if (itemIds.length >= 2) {
      thresholds.push({
        count: 2,
        description: `採取・釣りの成功率+${Math.round(2 * maxRarityPower)}%`,
        effects: { gatherSuccessPct: 0.02 * maxRarityPower, fishSuccessMult: 1 + 0.02 * maxRarityPower },
      });
    }
    if (itemIds.length >= 3) {
      thresholds.push({
        count: 3,
        description: '戦闘開始時、自身に防御バフ(3ターン)相当の防御%上昇',
        effects: { defPct: 0.04 * maxRarityPower },
      });
    }
    if (itemIds.length >= 4) {
      thresholds.push({
        count: 4,
        description: `獲得ゴールド+${Math.round(4 * maxRarityPower)}%`,
        effects: { goldDropPct: 0.04 * maxRarityPower },
      });
    }
    if (itemIds.length >= 5) {
      thresholds.push({
        count: 5,
        description: 'フルセット特別効果：全ステータスさらに強化',
        effects: { atkPct: 0.05 * maxRarityPower, defPct: 0.05 * maxRarityPower, expMult: 1 + 0.03 * maxRarityPower },
      });
    }
    sets[setKey] = { setKey, name: `${itemMaster[itemIds[0]].name.replace(SLOT_SUFFIX_RE, '')}セット`, itemIds, thresholds };
  }
  return sets;
}

// ============================================================
// 覚醒判定（失敗ありだが、失敗時も救済の欠片を獲得できる）
// ============================================================
export interface AwakenResult { success: boolean; newLevel: number; consumedStones: number; pityShardGained: number; }

const AWAKEN_SUCCESS_RATE = [1, 0.95, 0.85, 0.7, 0.55, 0.4]; // 現在段階(0~4) -> 次段階成功率

export function tryAwaken(currentLevel: number, pityShards: number): AwakenResult {
  if (currentLevel >= AWAKENING_MAX) return { success: false, newLevel: currentLevel, consumedStones: 0, pityShardGained: 0 };
  // 救済: 欠片が10個貯まっていれば成功率+25%(上限98%)
  const pityBonus = pityShards >= 10 ? 0.25 : 0;
  const rate = Math.min(0.98, (AWAKEN_SUCCESS_RATE[currentLevel] ?? 0.4) + pityBonus);
  const success = randomChance(rate);
  if (success) {
    return { success: true, newLevel: currentLevel + 1, consumedStones: currentLevel + 1, pityShardGained: 0 };
  }
  return { success: false, newLevel: currentLevel, consumedStones: currentLevel + 1, pityShardGained: 1 };
}

// ============================================================
// 新規アイテム（覚醒石・再抽選石）— masters.ts 側でObject.assignして合成
// ============================================================
export const BUILD_MATERIAL_ITEMS: Record<string, ItemMaster> = {
  awaken_stone_1: { id:'awaken_stone_1', name:'覚醒の欠片', description:'装備の覚醒(+1〜+2)に使用する基礎素材。', category:'material', itemType:'Item', rarity:'uncommon', sellPrice:50, buyPrice:0, maxStack:99, icon:'gem' },
  awaken_stone_2: { id:'awaken_stone_2', name:'覚醒の輝石', description:'装備の覚醒(+3〜+4)に使用する素材。', category:'material', itemType:'Item', rarity:'rare', sellPrice:300, buyPrice:0, maxStack:99, icon:'gem_blue' },
  awaken_stone_3: { id:'awaken_stone_3', name:'覚醒の聖石', description:'装備の覚醒(+5/最終段階)に使用する最上位素材。', category:'material', itemType:'Item', rarity:'epic', sellPrice:2000, buyPrice:0, maxStack:99, icon:'gem' },
  awaken_pity_shard: { id:'awaken_pity_shard', name:'救済の残光', description:'覚醒に失敗すると手に入る欠片。10個集めると次回成功率が上昇する。', category:'material', itemType:'Item', rarity:'rare', sellPrice:100, buyPrice:0, maxStack:99, icon:'gem' },
  affix_reroll_stone: { id:'affix_reroll_stone', name:'付与効果の再抽選石', description:'装備の付与効果を再抽選する。', category:'material', itemType:'Item', rarity:'rare', sellPrice:500, buyPrice:0, maxStack:99, icon:'gem_blue' },
};

export const BUILD_CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'affix_reroll_stone_from_materials', name: '付与効果の再抽選石を作る',
    description: '覚醒の欠片3個とハードマジックストーン2個から再抽選石を作る。',
    outputItemId: 'affix_reroll_stone', outputAmount: 1,
    inputs: [{ itemId: 'awaken_stone_1', amount: 3 }, { itemId: 'hard_magic_stone', amount: 2 }],
    requiredCraftingLevel: 20, craftingExpGain: 400,
  },
  {
    id: 'awaken_stone_2_from_1', name: '覚醒の輝石を作る',
    description: '覚醒の欠片5個を圧縮して輝石を作る。',
    outputItemId: 'awaken_stone_2', outputAmount: 1,
    inputs: [{ itemId: 'awaken_stone_1', amount: 5 }],
    requiredCraftingLevel: 30, craftingExpGain: 800,
  },
  {
    id: 'awaken_stone_3_from_2', name: '覚醒の聖石を作る',
    description: '覚醒の輝石5個と救済の残光3個から聖石を作る。',
    outputItemId: 'awaken_stone_3', outputAmount: 1,
    inputs: [{ itemId: 'awaken_stone_2', amount: 5 }, { itemId: 'awaken_pity_shard', amount: 3 }],
    requiredCraftingLevel: 45, craftingExpGain: 2500,
  },
];

/** 覚醒段階に応じて消費する素材itemId（高段階ほど上位素材） */
export function awakenMaterialForLevel(currentLevel: number): string {
  if (currentLevel <= 1) return 'awaken_stone_1';
  if (currentLevel <= 3) return 'awaken_stone_2';
  return 'awaken_stone_3';
}
