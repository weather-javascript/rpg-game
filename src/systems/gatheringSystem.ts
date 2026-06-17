// src/systems/gatheringSystem.ts
// 採取システム拡張: カテゴリ・時間帯・天候・コンボ・装備・図鑑・危険ノード

import type { GatherCategory } from '../types/game';
import { getTimeOfDay, getCurrentWeather } from '../data/toolAcquisition';

// ============================================================
// カテゴリ定義
// ============================================================
export interface CategoryConfig {
  id: GatherCategory;
  label: string;
  icon: string;
  baseTime: number;    // ms
  baseStamina: number;
}

export const CATEGORY_CONFIG: Record<GatherCategory, CategoryConfig> = {
  mining:     { id:'mining',     label:'採掘',   icon:'⛏️',  baseTime:5000,  baseStamina:8  },
  woodcutting:{ id:'woodcutting',label:'伐採',   icon:'🪓',  baseTime:4000,  baseStamina:6  },
  gathering:  { id:'gathering',  label:'採集',   icon:'🌿',  baseTime:3000,  baseStamina:4  },
  herbalism:  { id:'herbalism',  label:'薬草',   icon:'🌱',  baseTime:4000,  baseStamina:5  },
  insect:     { id:'insect',     label:'採虫',   icon:'🐛',  baseTime:3500,  baseStamina:5  },
};

// ============================================================
// 時間帯補正
// ============================================================
export interface TimeBonus {
  yieldMult: number;
  rareMult: number;
  speedMult: number;
}

export function getTimeBonusForCategory(category: GatherCategory): TimeBonus {
  const tod = getTimeOfDay();
  let yieldMult = 1.0, rareMult = 1.0, speedMult = 1.0;

  // 全カテゴリ共通: night rare ×1.1
  if (tod === 'night') rareMult *= 1.1;

  if (tod === 'morning' && category === 'gathering')   yieldMult *= 1.2;
  if (tod === 'daytime' && category === 'woodcutting') speedMult *= 1.15;
  if (tod === 'evening' && category === 'herbalism')   rareMult *= 1.25;
  if (tod === 'night'   && category === 'insect')      yieldMult *= 1.4;

  return { yieldMult, rareMult, speedMult };
}

// ============================================================
// 天候補正
// ============================================================
export interface WeatherBonus {
  yieldMult: number;
  rareMult: number;
  successMod: number; // +/- on success rate
}

export function getWeatherBonusForCategory(category: GatherCategory): WeatherBonus {
  const weather = getCurrentWeather();
  let yieldMult = 1.0, rareMult = 1.0, successMod = 0;

  if (weather === 'rain') {
    if (category === 'herbalism') yieldMult *= 1.4;
    if (category === 'gathering') yieldMult *= 1.2;
  }
  if (weather === 'thunder') {
    rareMult *= 1.25;
    // danger node appearance UP handled in danger check
  }
  if (weather === 'fog') {
    if (category === 'insect') yieldMult *= 1.5;
    successMod -= 0.10;
  }

  return { yieldMult, rareMult, successMod };
}

// ============================================================
// コンボ補正
// ============================================================
export interface ComboBonus {
  efficiencyMult: number; // speed & yield
  rareMult: number;
}

export function getComboBonus(combo: number): ComboBonus {
  if (combo >= 20) return { efficiencyMult: 1.35, rareMult: 1.10 };
  if (combo >= 10) return { efficiencyMult: 1.20, rareMult: 1.05 };
  if (combo >= 5)  return { efficiencyMult: 1.10, rareMult: 1.00 };
  return { efficiencyMult: 1.0, rareMult: 1.0 };
}

// ============================================================
// 危険ノード判定
// ============================================================
export function isDangerNodeAvailable(): boolean {
  const tod = getTimeOfDay();
  const weather = getCurrentWeather();
  const baseChance = 0.05;
  let chance = baseChance;
  if (tod === 'night') chance += 0.05;
  if (weather === 'thunder') chance += 0.05;
  return Math.random() < chance;
}

// 危険ノードのペナルティ計算
export interface DangerPenalty {
  extraStamina: number;
  hpPenalty: number;
  debuffTurns: number; // 速度デバフ秒数
}

export function calcDangerPenalty(nodeStamina: number): DangerPenalty {
  return {
    extraStamina: nodeStamina, // スタミナ追加消費 (×1 extra)
    hpPenalty: 10,
    debuffTurns: 15, // 15秒速度-20%デバフ
  };
}

// ============================================================
// 図鑑コンプリート報酬倍率
// ============================================================
export interface CollectionBonus {
  efficiencyMult: number;
  rareMult: number;
}

export function getCollectionBonus(params: {
  discoveredItems: string[];
  categoryItems: Record<GatherCategory, string[]>;
  allItems: string[];
}): CollectionBonus {
  const { discoveredItems, categoryItems, allItems } = params;
  const discovered = new Set(discoveredItems);

  let efficiencyMult = 1.0;
  let rareMult = 1.0;

  // カテゴリコンプ → 効率 +10% each
  for (const cat of Object.keys(categoryItems) as GatherCategory[]) {
    const items = categoryItems[cat];
    if (items.length > 0 && items.every(id => discovered.has(id))) {
      efficiencyMult += 0.10;
    }
  }

  // レア10種 → rare +5%
  const rareItems = allItems.filter(id => id.includes('_rare') || id.includes('diamond') || id.includes('emerald') || id.includes('ancient'));
  const rareDiscovered = rareItems.filter(id => discovered.has(id));
  if (rareDiscovered.length >= 10) rareMult += 0.05;

  // 全体コンプ → 全効率 +10%
  if (allItems.length > 0 && allItems.every(id => discovered.has(id))) {
    efficiencyMult += 0.10;
  }

  return { efficiencyMult, rareMult };
}

// ============================================================
// 統合採取補正計算
// ============================================================
export interface GatherMultipliers {
  speedMult: number;
  yieldMult: number;
  rareMult: number;
  staminaMult: number;
  successMod: number;
}

export function calcAllMultipliers(params: {
  category: GatherCategory;
  combo: number;
  toolSpeedMult: number;
  toolYieldMult: number;
  toolRareMult: number;
  toolStaminaMult: number;
  toolComboBonus: number;
  collectionBonus: CollectionBonus;
}): GatherMultipliers {
  const {
    category, combo,
    toolSpeedMult, toolYieldMult, toolRareMult, toolStaminaMult, toolComboBonus,
    collectionBonus,
  } = params;

  const timeBonus    = getTimeBonusForCategory(category);
  const weatherBonus = getWeatherBonusForCategory(category);
  const comboBonus   = getComboBonus(combo);

  const speedMult  = toolSpeedMult * timeBonus.speedMult * comboBonus.efficiencyMult * collectionBonus.efficiencyMult;
  const yieldMult  = toolYieldMult * timeBonus.yieldMult * weatherBonus.yieldMult * comboBonus.efficiencyMult * (1 + toolComboBonus) * collectionBonus.efficiencyMult;
  const rareMult   = toolRareMult  * timeBonus.rareMult  * weatherBonus.rareMult  * comboBonus.rareMult * collectionBonus.rareMult;
  const staminaMult = toolStaminaMult;
  const successMod = weatherBonus.successMod;

  return { speedMult, yieldMult, rareMult, staminaMult, successMod };
}

// カテゴリ判定ユーティリティ
export function getCategoryFromSkillId(skillId: string): GatherCategory {
  if (skillId === 'gathering') return 'gathering';
  if (skillId === 'herbalism') return 'herbalism';
  if (skillId === 'insect') return 'insect';
  if (skillId === 'woodcutting') return 'woodcutting';
  return 'mining';
}
