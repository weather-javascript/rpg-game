// src/data/fishMasters.ts
// 魚マスターデータ

export type FishRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface FishMaster {
  id: string;
  name: string;
  rarity: FishRarity;
  minLevel: number;       // 釣り可能最小レベル
  baseExp: number;        // 獲得経験値
  minSizeCm: number;
  maxSizeCm: number;
  // 重量は size^1.8 * weightFactor で計算
  weightFactor: number;
  baseRate: number;       // 基本出現率
  sellPrice: number;      // 売却基本価格(cm当たり)
  icon: string;
  description: string;
}

export const FISH_MASTER: Record<string, FishMaster> = {
  // ─── コモン ───────────────────────────────
  iwashi: {
    id: 'iwashi', name: 'イワシ', rarity: 'common', minLevel: 1,
    baseExp: 5, minSizeCm: 10, maxSizeCm: 25, weightFactor: 0.0004,
    baseRate: 0.30, sellPrice: 2, icon: '🐟', description: 'どこにでもいる小魚。',
  },
  aji: {
    id: 'aji', name: 'アジ', rarity: 'common', minLevel: 1,
    baseExp: 7, minSizeCm: 15, maxSizeCm: 40, weightFactor: 0.0006,
    baseRate: 0.25, sellPrice: 3, icon: '🐟', description: '定番の青魚。',
  },
  fugu: {
    id: 'fugu', name: 'フグ', rarity: 'common', minLevel: 3,
    baseExp: 10, minSizeCm: 20, maxSizeCm: 50, weightFactor: 0.0008,
    baseRate: 0.18, sellPrice: 5, icon: '🐡', description: '毒があるが高値がつく。',
  },
  tai: {
    id: 'tai', name: 'タイ', rarity: 'common', minLevel: 5,
    baseExp: 12, minSizeCm: 30, maxSizeCm: 80, weightFactor: 0.0010,
    baseRate: 0.15, sellPrice: 4, icon: '🐟', description: 'めでたい魚。',
  },
  // ─── アンコモン ───────────────────────────
  sake: {
    id: 'sake', name: 'サケ', rarity: 'uncommon', minLevel: 8,
    baseExp: 20, minSizeCm: 50, maxSizeCm: 100, weightFactor: 0.0015,
    baseRate: 0.12, sellPrice: 8, icon: '🐟', description: '川を遡る力強い魚。',
  },
  buri: {
    id: 'buri', name: 'ブリ', rarity: 'uncommon', minLevel: 10,
    baseExp: 25, minSizeCm: 60, maxSizeCm: 120, weightFactor: 0.0018,
    baseRate: 0.10, sellPrice: 10, icon: '🐟', description: '出世魚として知られる。',
  },
  hirame: {
    id: 'hirame', name: 'ヒラメ', rarity: 'uncommon', minLevel: 12,
    baseExp: 22, minSizeCm: 40, maxSizeCm: 90, weightFactor: 0.0020,
    baseRate: 0.10, sellPrice: 12, icon: '🐠', description: '砂底に潜む白身魚。',
  },
  tako: {
    id: 'tako', name: 'タコ', rarity: 'uncommon', minLevel: 15,
    baseExp: 30, minSizeCm: 30, maxSizeCm: 80, weightFactor: 0.0025,
    baseRate: 0.08, sellPrice: 15, icon: '🐙', description: '足が8本ある。',
  },
  // ─── レア ────────────────────────────────
  maguro: {
    id: 'maguro', name: 'マグロ', rarity: 'rare', minLevel: 20,
    baseExp: 100, minSizeCm: 80, maxSizeCm: 250, weightFactor: 0.0030,
    baseRate: 0.05, sellPrice: 25, icon: '🐟', description: '海の王者。大型個体は価値が高い。',
  },
  katsuo: {
    id: 'katsuo', name: 'カツオ', rarity: 'rare', minLevel: 20,
    baseExp: 80, minSizeCm: 60, maxSizeCm: 120, weightFactor: 0.0022,
    baseRate: 0.06, sellPrice: 20, icon: '🐟', description: '鮮度が命の赤身魚。',
  },
  shark: {
    id: 'shark', name: 'コモンシャーク', rarity: 'rare', minLevel: 30,
    baseExp: 120, minSizeCm: 100, maxSizeCm: 300, weightFactor: 0.0035,
    baseRate: 0.04, sellPrice: 30, icon: '🦈', description: '海の捕食者。',
  },
  ika: {
    id: 'ika', name: 'ダイオウイカ', rarity: 'rare', minLevel: 35,
    baseExp: 150, minSizeCm: 150, maxSizeCm: 400, weightFactor: 0.0010,
    baseRate: 0.03, sellPrice: 35, icon: '🦑', description: '深海に潜む巨大イカ。',
  },
  // ─── エピック ────────────────────────────
  ryujin_sea_bass: {
    id: 'ryujin_sea_bass', name: '龍神スズキ', rarity: 'epic', minLevel: 40,
    baseExp: 300, minSizeCm: 80, maxSizeCm: 160, weightFactor: 0.0028,
    baseRate: 0.02, sellPrice: 80, icon: '🐟', description: '龍の加護を受けた輝くスズキ。',
  },
  golden_carp: {
    id: 'golden_carp', name: '黄金コイ', rarity: 'epic', minLevel: 50,
    baseExp: 400, minSizeCm: 60, maxSizeCm: 150, weightFactor: 0.0032,
    baseRate: 0.015, sellPrice: 100, icon: '🐠', description: '金色に輝く幸運の魚。',
  },
  deep_whale: {
    id: 'deep_whale', name: '深淵クジラ', rarity: 'epic', minLevel: 60,
    baseExp: 500, minSizeCm: 300, maxSizeCm: 800, weightFactor: 0.0040,
    baseRate: 0.01, sellPrice: 120, icon: '🐋', description: '深海から浮上する巨大クジラ。',
  },
  // ─── レジェンダリー ───────────────────────
  ryujin: {
    id: 'ryujin', name: '龍神', rarity: 'legendary', minLevel: 70,
    baseExp: 1000, minSizeCm: 200, maxSizeCm: 500, weightFactor: 0.0050,
    baseRate: 0.005, sellPrice: 500, icon: '🐉', description: '伝説の龍の化身。釣れること自体が奇跡。',
  },
  phantom_tuna: {
    id: 'phantom_tuna', name: '幻のマグロ', rarity: 'legendary', minLevel: 80,
    baseExp: 1000, minSizeCm: 250, maxSizeCm: 600, weightFactor: 0.0055,
    baseRate: 0.004, sellPrice: 600, icon: '🐟', description: '幻と呼ばれる最大級のマグロ。',
  },
  sea_god: {
    id: 'sea_god', name: '海神', rarity: 'legendary', minLevel: 90,
    baseExp: 1000, minSizeCm: 400, maxSizeCm: 1000, weightFactor: 0.0060,
    baseRate: 0.003, sellPrice: 800, icon: '🌊', description: '海の神が宿る魚。存在自体が伝説。',
  },
  infinity_fish: {
    id: 'infinity_fish', name: '∞魚', rarity: 'legendary', minLevel: 100,
    baseExp: 1000, minSizeCm: 100, maxSizeCm: 9999, weightFactor: 0.0070,
    baseRate: 0.002, sellPrice: 1000, icon: '♾️', description: '無限の可能性を秘めた最強の魚。',
  },
};

export const FISH_IDS = Object.keys(FISH_MASTER);

// 釣りレベル特典
export interface FishingLevelBonus {
  level: number;
  description: string;
  rarityBonus?: number;    // レア率補正 (加算)
  largeFishBonus?: number; // 大型魚出現率補正
  legendaryBonus?: number; // 伝説魚率補正
}

export const FISHING_LEVEL_BONUSES: FishingLevelBonus[] = [
  { level: 10, description: 'レア率+5%',       rarityBonus: 0.05 },
  { level: 20, description: 'レア率+10%',      rarityBonus: 0.10 },
  { level: 50, description: '大型魚出現率+20%', largeFishBonus: 0.20 },
  { level: 100, description: '伝説魚率+50%',   legendaryBonus: 0.50 },
];

// 釣りレベル→経験値テーブル (Lv1→2に必要な経験値 = 100, Lv^1.8 * 60)
export function fishingExpRequired(level: number): number {
  return Math.floor(Math.pow(level, 1.8) * 60);
}

// 釣りレベルに応じたボーナス集計
export function getFishingBonuses(fishingLevel: number) {
  let rarityBonus = 0;
  let largeFishBonus = 0;
  let legendaryBonus = 0;
  for (const bonus of FISHING_LEVEL_BONUSES) {
    if (fishingLevel >= bonus.level) {
      rarityBonus += bonus.rarityBonus ?? 0;
      largeFishBonus += bonus.largeFishBonus ?? 0;
      legendaryBonus += bonus.legendaryBonus ?? 0;
    }
  }
  return { rarityBonus, largeFishBonus, legendaryBonus };
}

// サイズから重量計算 (kg)
export function calcWeight(fish: FishMaster, sizeCm: number): number {
  return Math.round(Math.pow(sizeCm, 1.8) * fish.weightFactor * 10) / 10;
}

// サイズから売値計算
export function calcFishSellPrice(fish: FishMaster, sizeCm: number): number {
  const sizeRatio = sizeCm / fish.maxSizeCm;
  const rarityMult = { common: 1, uncommon: 2, rare: 5, epic: 15, legendary: 50 }[fish.rarity];
  return Math.floor(fish.sellPrice * sizeCm * sizeRatio * rarityMult);
}

export const RARITY_COLOR: Record<FishRarity, string> = {
  common: '#9ca3af',
  uncommon: '#34d399',
  rare: '#60a5fa',
  epic: '#a78bfa',
  legendary: '#fbbf24',
};

export const RARITY_LABEL: Record<FishRarity, string> = {
  common: 'コモン',
  uncommon: 'アンコモン',
  rare: 'レア',
  epic: 'エピック',
  legendary: 'レジェンダリー',
};
