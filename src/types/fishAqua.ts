// src/types/fishAqua.ts – 養殖・交配・水族館システム型定義

// ─── レア度 ────────────────────────────────────────────────
export type AquaRarity = 'normal' | 'rare' | 'epic' | 'legendary' | 'mythic';

// ─── 成長段階 ─────────────────────────────────────────────
export type GrowthStage = 'fry' | 'juvenile' | 'adult' | 'large' | 'giant';

export const GROWTH_STAGE_LABEL: Record<GrowthStage, string> = {
  fry:      '稚魚',
  juvenile: '幼魚',
  adult:    '成魚',
  large:    '大型魚',
  giant:    '巨大魚',
};

// ─── 魚個体データ ──────────────────────────────────────────
export interface FishIndividual {
  individualId: string;      // #000001 形式
  fishId: string;            // FISH_MASTERのID（または交配産の新種ID）
  name: string;              // 表示名（突然変異は専用名）
  ownerUid: string;
  ownerName: string;
  rarity: AquaRarity;
  growthStage: GrowthStage;
  sizeCm: number;
  weightKg: number;
  bornAt: number;            // timestamp
  lastGrowthAt: number;      // 最後に成長チェックした時刻
  isBreeding?: boolean;      // 交配中フラグ
  isMutant?: boolean;        // 突然変異フラグ
  isSuperMutant?: boolean;   // 超突然変異フラグ
  mutantName?: string;       // 突然変異専用名
  mutantIcon?: string;       // 突然変異専用アイコン
  parentIds?: [string, string]; // 親の個体ID
  breedRecipeId?: string;    // 生成に使ったレシピID
  description?: string;      // プレイヤーが設定した説明文（水族館展示用）
  isDisplayed?: boolean;     // 水族館展示中フラグ
  displayOrder?: number;     // 水族館内の表示順
  caughtAt?: number;         // 釣った場合のタイムスタンプ
  pondSlot?: number;         // 養殖池スロット番号 (0-19)
  generation?: number;       // 何世代目か
  icon?: string;             // 元魚のアイコン（表示用）
}

// ─── 養殖池 ───────────────────────────────────────────────
export interface FarmData {
  uid: string;
  isUnlocked: boolean;
  unlockedAt?: number;
  slotCount: number;         // 現在の池の枠数 (初期2, 最大20)
  pond: (FishIndividual | null)[]; // スロットごとの魚
  lastUpdatedAt: number;
}

// ─── 交配 ─────────────────────────────────────────────────
export interface BreedingSlot {
  parent1Id: string;
  parent2Id: string;
  startedAt: number;
  completesAt: number;
  recipeId: string;
}

export interface BreedingData {
  uid: string;
  slots: BreedingSlot[];     // 同時交配スロット（最大3）
  completedChildren: FishIndividual[];
}

// ─── 交配レシピ ────────────────────────────────────────────
export interface BreedRecipe {
  id: string;
  name: string;              // 産まれる魚の名前
  parent1FishId: string;     // 親1の魚種ID（またはワイルドカード）
  parent2FishId: string;     // 親2の魚種ID
  childFishId: string;       // 産まれる魚種ID
  childName: string;         // 子の名前
  childIcon: string;
  childRarity: AquaRarity;
  breedTimeMs: number;       // 交配にかかる時間
  description: string;
  // ワイルドカードサポート
  parent1Tag?: string;       // 例: 'koi_family' -> コイ系統なら何でもOK
  parent2Tag?: string;
}

// ─── 交配図鑑 ─────────────────────────────────────────────
export interface BreedingBook {
  uid: string;
  discovered: string[];      // 発見済みレシピID
  lastUpdatedAt: number;
}

// ─── 水族館 ───────────────────────────────────────────────
export interface AquariumData {
  uid: string;
  displayName: string;
  displayedFish: FishIndividual[];  // 展示中の魚（最大100）
  maxDisplay: number;        // 最大展示枠（初期10）
  likes: number;
  likedBy: string[];         // いいねしたUID
  favorites: string[];       // お気に入り登録UID
  visitors: number;          // 総訪問者数
  comments: AquaComment[];
  isPublic: boolean;
  updatedAt: number;
  announcement?: string;     // オーナーからのアナウンス
}

export interface AquaComment {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt: number;
}

// ─── 世界初発見 ────────────────────────────────────────────
export interface WorldFirstFishRecord {
  fishId: string;            // 魚種ID（交配産は独自ID）
  fishName: string;
  discovererUid: string;
  discovererName: string;
  discoveredAt: number;
  sizeCm: number;
  weightKg: number;
  individualId: string;
  isBreedResult?: boolean;
  isMutant?: boolean;
}

// ─── 品評会 ────────────────────────────────────────────────
export type ShowCategory = 'size' | 'weight' | 'rarity' | 'breed' | 'mutant';

export interface ShowEntry {
  uid: string;
  displayName: string;
  individualId: string;
  fishName: string;
  fishIcon: string;
  category: ShowCategory;
  sizeCm: number;
  weightKg: number;
  rarity: AquaRarity;
  isMutant: boolean;
  score: number;
  submittedAt: number;
}

export interface ShowData {
  id: string;               // weekly_2026_24 等
  weekStart: number;
  weekEnd: number;
  entries: Record<ShowCategory, ShowEntry[]>;
  settled: boolean;
  winners?: Record<ShowCategory, ShowEntry | null>;
}

// ─── プレイヤーの養殖・水族館プロフィール ────────────────────
export interface AquaProfile {
  uid: string;
  totalFishBred: number;
  totalMutants: number;
  totalSuperMutants: number;
  maxSizeCm: number;
  maxWeightKg: number;
  mythicFishCount: number;
  mutantFishCount: number;
  breedBookRate: number;     // 交配図鑑完成率 (0-100)
  showTitles: string[];      // 品評会で獲得した称号
  showBadges: string[];
}

// ─── 池拡張コスト ─────────────────────────────────────────
export const POND_EXPAND_COSTS: number[] = [
  10000,      // 2→3枠
  30000,      // 3→4枠
  100000,     // 4→5枠
  300000,     // 5→6枠
  1000000,    // 6→7枠
  3000000,    // 7→8枠
  10000000,   // 8→9枠
  30000000,   // 9→10枠
  100000000,  // 10→11枠
  300000000,  // 11→12枠
  500000000,  // 12→13枠
  800000000,  // 13→14枠
  1000000000, // 14→15枠
  1500000000, // 15→16枠
  2000000000, // 16→17枠
  2500000000, // 17→18枠
  3000000000, // 18→19枠
  4000000000, // 19→20枠 (最終)
];

// ─── 水族館展示枠拡張コスト ──────────────────────────────
export const AQUA_EXPAND_COSTS: number[] = [
  50000,      // 10→15
  200000,     // 15→20
  800000,     // 20→30
  3000000,    // 30→40
  10000000,   // 40→50
  50000000,   // 50→60
  200000000,  // 60→70
  500000000,  // 70→80
  1000000000, // 80→90
  3000000000, // 90→100 (最終)
];
export const AQUA_EXPAND_AMOUNTS = [5, 5, 10, 10, 10, 10, 10, 10, 10, 10];

// ─── 養殖場解放コスト ─────────────────────────────────────
export const FARM_UNLOCK_GOLD = 50000;
export const FARM_UNLOCK_FISHING_LEVEL = 20;

// ─── 成長時間 (ms) ────────────────────────────────────────
// 魚ごとに異なるが、基本は以下
export const GROWTH_TIME_NORMAL: Record<GrowthStage, number> = {
  fry:      2 * 60 * 60 * 1000,   // 2h -> 幼魚
  juvenile: 6 * 60 * 60 * 1000,   // 6h -> 成魚
  adult:    12 * 60 * 60 * 1000,  // 12h -> 大型魚
  large:    24 * 60 * 60 * 1000,  // 24h -> 巨大魚
  giant:    0,                     // 最終形態
};

// ─── レア度ラベル ─────────────────────────────────────────
export const AQUA_RARITY_LABEL: Record<AquaRarity, string> = {
  normal:    'ノーマル',
  rare:      'レア',
  epic:      'エピック',
  legendary: 'レジェンダリー',
  mythic:    '神話',
};

export const AQUA_RARITY_COLOR: Record<AquaRarity, string> = {
  normal:    '#aaaaaa',
  rare:      '#4fc3f7',
  epic:      '#ce93d8',
  legendary: '#ffd700',
  mythic:    '#ff6b6b',
};

// ─── 突然変異リスト (超突然変異は特別) ──────────────────────
export interface MutantDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarityOverride?: AquaRarity;
}

export const MUTANT_LIST: MutantDef[] = [
  { id:'glowing_blue_koi',    name:'発光青鯉',      icon:'💙', description:'青く輝く光を放つ神秘の鯉。',              rarityOverride:'epic' },
  { id:'glowing_red_koi',     name:'発光赤鯉',      icon:'❤️', description:'赤い光で夜の池を照らす鯉。',            rarityOverride:'epic' },
  { id:'crystal_tuna',        name:'水晶マグロ',    icon:'💎', description:'体が水晶のように透明なマグロ。',          rarityOverride:'epic' },
  { id:'shadow_shark',        name:'影サメ',        icon:'👤', description:'影のように黒く光を吸収するサメ。',        rarityOverride:'epic' },
  { id:'golden_catfish',      name:'黄金ナマズ',    icon:'🌟', description:'全身が黄金に輝くナマズ。',               rarityOverride:'legendary' },
  { id:'electric_eel',        name:'電気ウナギ神',  icon:'⚡', description:'稲妻をまとった神聖なウナギ。',            rarityOverride:'legendary' },
  { id:'pink_whale',          name:'桃色クジラ',    icon:'🌸', description:'桜色に輝く幸運のクジラ。',               rarityOverride:'legendary' },
  { id:'neon_piranha',        name:'ネオンピラニア', icon:'🌈', description:'虹色に発光する奇妙なピラニア。',          rarityOverride:'legendary' },
  { id:'jade_koi',            name:'翡翠鯉',        icon:'🟢', description:'翡翠色に輝く幸運の鯉。',                 rarityOverride:'legendary' },
  { id:'silver_dragon_fish',  name:'銀龍魚',        icon:'🔷', description:'銀色の鱗を持つ龍の化身。',               rarityOverride:'legendary' },
];

export const SUPER_MUTANT_LIST: MutantDef[] = [
  { id:'stardust_koi',       name:'星屑鯉',        icon:'✨', description:'星屑をまとい宇宙を泳ぐ超稀少な鯉。',      rarityOverride:'mythic' },
  { id:'galaxy_tuna',        name:'銀河マグロ',    icon:'🌌', description:'体内に銀河が広がる伝説を超えた存在。',     rarityOverride:'mythic' },
  { id:'solar_fish',         name:'太陽魚',        icon:'☀️', description:'太陽そのものの熱を持つ超存在。',           rarityOverride:'mythic' },
  { id:'moonlight_shark',    name:'月光サメ',      icon:'🌙', description:'月光を集め輝く至高のサメ。',               rarityOverride:'mythic' },
  { id:'abyss_eel_god',      name:'深淵ウナギ神',  icon:'🕳️', description:'深淵の底から現れた神の使い。',             rarityOverride:'mythic' },
  { id:'nebula_whale',       name:'星雲クジラ',    icon:'🌠', description:'星雲をまとった宇宙最大の鯨。',             rarityOverride:'mythic' },
  { id:'aurora_koi',         name:'オーロラ鯉',    icon:'🌈', description:'オーロラの光で全てを癒す神聖な鯉。',       rarityOverride:'mythic' },
  { id:'void_dragon_fish',   name:'虚空竜魚',      icon:'⚫', description:'虚空から召喚された竜の化身。全てを超える存在。', rarityOverride:'mythic' },
];
