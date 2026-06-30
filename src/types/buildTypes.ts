// src/types/buildTypes.ts
// ver3.0.0 大型アップデート用の型定義（装備ビルド／職業／ペット／生活系）。
// 既存の game.ts には依存させるが、game.ts 側からはこのファイルの型を
// optional フィールドとして PlayerData に追加するだけに留め、既存型は変更しない。

import type { Rarity } from './game';

// ============================================================
// 集約パワー修正値（装備ビルド・職業・ペットの効果を合算する共通単位）
// すべて「ボーナス分」であり、0 がデフォルト（無効果）。Mult系は 1.0 が基準。
// ============================================================
export interface PowerModifiers {
  atkFlat: number;
  defFlat: number;
  hpFlat: number;
  atkPct: number;          // 攻撃力% (クリティカル特化もここに統合)
  defPct: number;          // 防御力%
  healPct: number;         // 回復量%
  gatherSuccessPct: number; // 採取成功率 加算(0~1スケール)
  gatherYieldPct: number;   // 採取量%
  fishSuccessMult: number;  // 釣り成功率倍率(1.0基準)
  fishRarePct: number;      // レア魚率%
  sellPriceMult: number;    // 店売り価格倍率(1.0基準)
  dropRatePct: number;      // ドロップ率%
  goldDropPct: number;      // 撃破ゴールド%
  fleeRateBonus: number;    // 逃走成功率 加算(0~1スケール)
  preemptiveChance: number; // 先制（戦闘開始時の奇襲）発生率(0~1)
  expMult: number;          // 経験値獲得倍率(1.0基準)
  skillExpMult: number;     // 生活スキル経験値倍率(1.0基準)
  gambleMult: number;       // ギャンブル配当倍率(1.0基準)
  mpCostCutPct: number;     // 消費MP軽減%
}

export function emptyPowerModifiers(): PowerModifiers {
  return {
    atkFlat: 0, defFlat: 0, hpFlat: 0,
    atkPct: 0, defPct: 0, healPct: 0,
    gatherSuccessPct: 0, gatherYieldPct: 0,
    fishSuccessMult: 1, fishRarePct: 0,
    sellPriceMult: 1,
    dropRatePct: 0, goldDropPct: 0,
    fleeRateBonus: 0, preemptiveChance: 0,
    expMult: 1, skillExpMult: 1,
    gambleMult: 1,
    mpCostCutPct: 0,
  };
}

export function addPowerModifiers(base: PowerModifiers, add: Partial<PowerModifiers>): PowerModifiers {
  return {
    atkFlat: base.atkFlat + (add.atkFlat ?? 0),
    defFlat: base.defFlat + (add.defFlat ?? 0),
    hpFlat: base.hpFlat + (add.hpFlat ?? 0),
    atkPct: base.atkPct + (add.atkPct ?? 0),
    defPct: base.defPct + (add.defPct ?? 0),
    healPct: base.healPct + (add.healPct ?? 0),
    gatherSuccessPct: base.gatherSuccessPct + (add.gatherSuccessPct ?? 0),
    gatherYieldPct: base.gatherYieldPct + (add.gatherYieldPct ?? 0),
    fishSuccessMult: base.fishSuccessMult * (add.fishSuccessMult ?? 1),
    fishRarePct: base.fishRarePct + (add.fishRarePct ?? 0),
    sellPriceMult: base.sellPriceMult * (add.sellPriceMult ?? 1),
    dropRatePct: base.dropRatePct + (add.dropRatePct ?? 0),
    goldDropPct: base.goldDropPct + (add.goldDropPct ?? 0),
    fleeRateBonus: base.fleeRateBonus + (add.fleeRateBonus ?? 0),
    preemptiveChance: base.preemptiveChance + (add.preemptiveChance ?? 0),
    expMult: base.expMult * (add.expMult ?? 1),
    skillExpMult: base.skillExpMult * (add.skillExpMult ?? 1),
    gambleMult: base.gambleMult * (add.gambleMult ?? 1),
    mpCostCutPct: base.mpCostCutPct + (add.mpCostCutPct ?? 0),
  };
}

// ============================================================
// 1. 装備ビルド要素（特性・付与効果・セット効果・覚醒）
// ============================================================
export type TraitId =
  | 'crit_focus' | 'heal_focus' | 'gather_focus' | 'fish_focus'
  | 'gamble_focus' | 'drop_focus' | 'flee_focus' | 'defense_focus'
  | 'preemptive_focus' | 'exp_focus';

export interface TraitDef {
  id: TraitId;
  name: string;
  description: string;
  icon: string;
  effects: Partial<PowerModifiers>; // 覚醒0時点の基礎効果
  effectsPerAwaken: Partial<PowerModifiers>; // 覚醒1段階ごとに追加される効果
}

export type AffixId =
  | 'atk_pct' | 'def_pct' | 'heal_pct' | 'gather_success_pct' | 'fish_success_pct'
  | 'sell_price_pct' | 'mana_cost_cut_pct' | 'crit_dmg_pct' | 'exp_pct' | 'drop_pct';

export interface AffixTierDef { tier: 1 | 2 | 3 | 4; min: number; max: number; rarity: Rarity; }
export interface AffixDef {
  id: AffixId;
  name: string;
  description: string;
  modifierKey: keyof PowerModifiers;
  tiers: AffixTierDef[];
}

export interface AffixInstance {
  affixId: AffixId;
  tier: 1 | 2 | 3 | 4;
  value: number;
}

export interface BuildPreset {
  id: string;
  name: string;
  equipment: {
    hotbar: (string | null)[];
    helmet: string | null;
    chestplate: string | null;
    leggings: string | null;
    boots: string | null;
    offhand: string | null;
  };
  savedAt: number;
}

export interface EquipmentBuildState {
  affixRolls: Record<string, AffixInstance[]>; // itemId -> ロール済み付与効果
  awakening: Record<string, number>;           // itemId -> 覚醒段階
  presets: BuildPreset[];
}

export function defaultEquipmentBuildState(): EquipmentBuildState {
  return { affixRolls: {}, awakening: {}, presets: [] };
}

export interface SetThreshold {
  count: number;
  description: string;
  effects: Partial<PowerModifiers>;
}

export interface SetDef {
  setKey: string;
  name: string;
  itemIds: string[];
  thresholds: SetThreshold[];
}

export const AWAKENING_MAX = 5;
export const AFFIX_SLOTS_BASE = 1;
export const AFFIX_SLOTS_PER_AWAKEN = [1, 1, 2, 2, 3, 4]; // index = awakening段階(0~5) -> 解放スロット数

// ============================================================
// 2. ランク／職業分岐
// ============================================================
export type VocationId =
  | 'warrior' | 'miner' | 'angler' | 'merchant'
  | 'alchemist' | 'gambler' | 'researcher' | 'collector' | 'hunter';

export interface VocationRankDef {
  rank: number;
  name: string;
  requiredVocationLevel: number;
  passiveEffects: Partial<PowerModifiers>;
}

export interface VocationDef {
  id: VocationId;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockCondition?: { playerLevel?: number; requiredItemId?: string };
  ranks: VocationRankDef[];
  signatureSkillName: string;
  signatureSkillDescription: string;
  signatureSkillEffects: Partial<PowerModifiers>; // ランク1到達時から常時有効な専用スキル効果
}

export interface VocationState {
  activeVocationId: VocationId | null;
  vocationExp: Record<string, number>;
  vocationRank: Record<string, number>;
  unlockedVocationIds: VocationId[];
  lastSwitchedAt: number;
}

export function defaultVocationState(): VocationState {
  return { activeVocationId: null, vocationExp: {}, vocationRank: {}, unlockedVocationIds: ['warrior'], lastSwitchedAt: 0 };
}

export const VOCATION_EXP_TABLE: number[] = (() => {
  const t = [0];
  for (let lv = 1; lv <= 200; lv++) t.push(Math.floor(Math.pow(lv, 1.6) * 120));
  return t;
})();

// ============================================================
// 3. ペット／仲間／召喚獣
// ============================================================
export type PetRoleSlot = 'main' | 'sub' | 'support';
export type PetSourceTag = 'drop' | 'quest' | 'exchange' | 'fusion' | 'event' | 'codex' | 'aquarium';
export type PetRoleTag = 'combat' | 'gather' | 'fish' | 'market' | 'explore' | 'collect';

export interface PetSkillDef {
  id: string;
  name: string;
  description: string;
  effects: Partial<PowerModifiers>;
}

export interface PetEvolutionStageDef {
  stage: number;
  name: string;
  requiredLevel: number;
  requiredBond: number;
  statMult: number;
  icon: string;
}

export interface PetSpeciesDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  roleTags: PetRoleTag[];
  baseAtk: number;
  baseDef: number;
  baseHp: number;
  passiveSkillIds: string[];
  evolution: PetEvolutionStageDef[];
  awakeningMax: number;
  acquisition: { tag: PetSourceTag; detail: string }[];
  aquariumLinkBonus?: { requiredFishBookCount: number; effects: Partial<PowerModifiers> };
  codexHintWhenUnseen: string;
}

export interface OwnedPetInstance {
  instanceId: string;
  speciesId: string;
  level: number;
  exp: number;
  bond: number;
  evolutionStage: number;
  awakening: number;
  nickname?: string;
  obtainedAt: number;
}

export interface PetState {
  owned: OwnedPetInstance[];
  party: { main: string | null; sub: string | null; support: string | null };
  seenSpeciesIds: string[];
}

export function defaultPetState(): PetState {
  return { owned: [], party: { main: null, sub: null, support: null }, seenSpeciesIds: [] };
}

export const PET_EXP_TABLE: number[] = (() => {
  const t = [0];
  for (let lv = 1; lv <= 300; lv++) t.push(Math.floor(Math.pow(lv, 1.55) * 80));
  return t;
})();

// ============================================================
// 4. 生活系コンテンツ（農業・料理・錬金・精錬・標本収集）
// ============================================================
export interface CropDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  seedItemId: string;
  produceItemId: string;
  growthMs: number;
  baseYield: number;
  qualityProduceItemId?: string;
  qualityChance: number; // 肥料/水やり込みでの高品質化率
  requiredLevel: number;
}

export interface FarmPlotState {
  plotIndex: number;
  cropId: string | null;
  plantedAt: number;
  watered: boolean;
  fertilized: boolean;
}

export type LifeRecipeCategory = 'cooking' | 'alchemy' | 'refining';

export interface LifeRecipeDef {
  id: string;
  name: string;
  description: string;
  category: LifeRecipeCategory;
  inputs: { itemId: string; amount: number }[];
  outputItemId: string;
  outputAmount: number;
  requiredLevel: number;
  expGain: number;
  greatSuccessChance: number;
  greatSuccessMultiplier: number;
}

export type CollectionCategory = 'item' | 'fish' | 'monster' | 'gather' | 'cooking' | 'pet' | 'specimen';

export interface CollectionDef {
  id: string;
  name: string;
  description: string;
  category: CollectionCategory;
  targetIds: string[];
  rewardGold: number;
  rewardItems: { itemId: string; amount: number }[];
  rewardEffects: Partial<PowerModifiers>;
}

export interface LifeSystemState {
  farmPlots: FarmPlotState[];
  cookingExp: number;
  alchemyExp: number;
  refiningExp: number;
  specimenSubmitted: Record<string, number>;
  claimedCollectionIds: string[];
  activeDishBuffs: { dishId: string; expiry: number; effects: Partial<PowerModifiers> }[];
}

export function defaultLifeSystemState(): LifeSystemState {
  return {
    farmPlots: Array.from({ length: 6 }, (_, i) => ({ plotIndex: i, cropId: null, plantedAt: 0, watered: false, fertilized: false })),
    cookingExp: 0, alchemyExp: 0, refiningExp: 0,
    specimenSubmitted: {}, claimedCollectionIds: [], activeDishBuffs: [],
  };
}

export const LIFE_EXP_TABLE: number[] = (() => {
  const t = [0];
  for (let lv = 1; lv <= 200; lv++) t.push(Math.floor(Math.pow(lv, 1.5) * 100));
  return t;
})();
