// src/types/game.ts

export type IdMap<T> = Record<string, T>;
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemCategory = 'material' | 'tool' | 'consumable' | 'weapon' | 'armor' | 'treasure' | 'food' | 'potion';
export type SkillId = 'mining' | 'woodcutting' | 'combat' | 'fishing' | 'crafting';
export type TabId = 'gathering' | 'market' | 'dungeon' | 'gamble' | 'status' | 'online' | 'fishing';
export type GambleType = 'slot' | 'treasure_box' | 'coin_flip' | 'chohan' | 'chinchiro' | 'jackpot' | 'poker';
export type DungeonTier = 'beginner' | 'intermediate' | 'advanced' | 'super' | 'extreme' | 'volcano';

// ============================================================
// マスターデータ型
// ============================================================
export interface ItemMaster {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: Rarity;
  sellPrice: number;
  buyPrice: number;
  maxStack: number;
  icon: string;
  // 消費アイテム用フィールド
  useEffect?: {
    hpRestore?: number;
    satietyRestore?: number;
    message?: string;
  };
}

export interface SkillMaster {
  id: SkillId;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
}

export interface DropEntry {
  itemId: string;
  baseRate: number;
  minAmount: number;
  maxAmount: number;
  skillRateBonus?: number;
}

export interface GatherNodeMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredSkill: { skillId: SkillId; minLevel: number };
  cooldownMs: number;
  drops: DropEntry[];
  staminaCost: number;
}

// ダンジョンのエリア（階層）定義
export interface DungeonArea {
  name: string;
  description?: string;
  monsters: { monsterId: string; count: number; isBoss?: boolean }[];
  isHardArea?: boolean;
}

export interface MonsterMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxHp: number;
  attack: number;
  defense: number;
  baseExp: number;
  baseGold: number;
  drops: DropEntry[];
  dungeonIds: string[];
  isBoss?: boolean;
  specialAttack?: string; // 特殊攻撃名
}

export interface DungeonMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: DungeonTier;
  requiredLevel: number;
  monsterIds: string[];
  floors: number;
  areas?: DungeonArea[];
  bossId?: string;
  // 報酬ボーナス係数
  expBonus: number;
  goldBonus: number;
  // 解放条件（前のダンジョンをN回クリア）
  unlockCondition?: { dungeonId: string; clearedCount: number };
}

export interface GambleReward {
  label: string;
  probability: number;
  multiplier: number;
  itemRewards?: { itemId: string; amount: number }[];
  symbols?: string[];
}

export interface GambleMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: GambleType;
  minBet: number;
  maxBet: number;
  rewardTable: GambleReward[];
  returnRate: number; // 期待還元率（表示用）
}

// ============================================================
// プレイヤーデータ型
// ============================================================
export interface PlayerStats {
  level: number;
  exp: number;
  expToNextLevel: number;
  hp: number;
  maxHp: number;
  satiety: number;
  maxSatiety: number;
  attack: number;
  defense: number;
}

export interface PlayerData {
  uid: string;
  displayName: string;
  gold: number;
  stats: PlayerStats;
  inventory: IdMap<number>;
  skillLevels: IdMap<number>;
  skillExp: IdMap<number>;
  lastSavedAt: number;
  createdAt: number;
  // ダンジョンクリア回数（解放条件追跡）
  dungeonClearedCount: IdMap<number>;
  // 釣りスコア（FFGG Rank4+でのみ蓄積）
  fishingScore: number;
  // 装備中の釣り竿ID
  equippedRodId: string;
  // アクティブジョブ
  activeJob: string | null;
  // 有効バフ
  activeBuffs: { id: string; name: string; expiry: number; fishingBonus?: number; miningBonus?: number }[];
  // 救済措置使用回数
  reliefUsedCount: number;
  // 救済措置最終使用時刻
  reliefLastUsed: number;
}

// ============================================================
// ゲーム内イベント型
// ============================================================
export interface GatherResult {
  drops: { itemId: string; amount: number }[];
  expGained: IdMap<number>;
  staminaUsed: number;
}

export interface CombatTurn {
  playerDamage: number;
  monsterDamage: number;
  playerHpAfter: number;
  monsterHpAfter: number;
  log: string;
  isSpecialAttack?: boolean;
}

export interface CombatResult {
  victory: boolean;
  turns: CombatTurn[];
  expGained: number;
  goldGained: number;
  drops: { itemId: string; amount: number }[];
  escaped?: boolean;
}

// ダンジョン探索の進行状態
export interface DungeonRunState {
  dungeonId: string;
  currentFloor: number;
  currentAreaName: string;
  monstersDefeated: number;
  totalExp: number;
  totalGold: number;
  totalDrops: { itemId: string; amount: number }[];
  isComplete: boolean;
  isFailed: boolean;
}

export interface GambleResult {
  rewardLabel: string;
  multiplier: number;
  goldDelta: number;
  itemRewards: { itemId: string; amount: number }[];
  symbols?: string[];
  // ポーカー用
  hand?: string[];
  handName?: string;
  // チンチロリン用
  dice?: number[];
  roleName?: string;
}

// ============================================================
// マーケット型
// ============================================================
export interface AuctionListing {
  id: string;
  sellerUid: string;
  sellerName: string;
  itemId: string;
  amount: number;
  pricePerUnit: number;
  expiresAt: number;
  createdAt: number;
}

export interface BoardMessage {
  id: string;
  uid: string;
  displayName: string;
  level: number;
  text: string;
  createdAt: number;
}

// ============================================================
// オンライン型
// ============================================================
export interface OnlineUser {
  uid: string;
  displayName: string;
  level: number;
  lastSeen: number;
}

// ============================================================
// UI 型
// ============================================================
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
