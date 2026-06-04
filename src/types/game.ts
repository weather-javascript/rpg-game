// src/types/game.ts

export type IdMap<T> = Record<string, T>;
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemCategory = 'material' | 'tool' | 'consumable' | 'weapon' | 'armor' | 'treasure' | 'food' | 'potion';
export type SkillId = 'mining' | 'woodcutting' | 'combat' | 'fishing' | 'crafting';
export type TabId = 'gathering' | 'market' | 'dungeon' | 'gamble' | 'status' | 'online' | 'fishing' | 'admin';
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
  specialAttack?: string;
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
  expBonus: number;
  goldBonus: number;
  unlockCondition?: { dungeonId: string; clearedCount: number; requiredLevel?: number };
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
  returnRate: number;
}

// ============================================================
// クラフトレシピ型
// ============================================================
export interface CraftRecipe {
  id: string;
  name: string;
  description: string;
  outputItemId: string;
  outputAmount: number;
  inputs: { itemId: string; amount: number }[];
  requiredCraftingLevel: number;
  craftingExpGain: number;
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

// ホットバー（9スロット）+ 防具枠 + オフハンド
export interface EquipmentSlots {
  hotbar: (string | null)[];   // length 9, itemId or null
  helmet: string | null;
  chestplate: string | null;
  leggings: string | null;
  boots: string | null;
  offhand: string | null;
}

export function defaultEquipmentSlots(): EquipmentSlots {
  return { hotbar: Array(9).fill(null), helmet: null, chestplate: null, leggings: null, boots: null, offhand: null };
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
  dungeonClearedCount: IdMap<number>;
  fishingScore: number;
  equippedRodId: string;
  activeJob: string | null;
  activeBuffs: { id: string; name: string; expiry: number; fishingBonus?: number; miningBonus?: number }[];
  reliefUsedCount: number;
  reliefLastUsed: number;
  // ホットバー・装備枠
  equipment?: EquipmentSlots;
  // HP/満腹度の自動回復用タイムスタンプ
  lastRegenAt?: number;
  // メール通知設定
  emailAddress?: string;
  emailNotifications?: { auction?: boolean; events?: boolean; updates?: boolean };
  // アクティビティログ
  activityLog?: ActivityEntry[];
  // 設定
  settings?: { gambleMultiplierBonus?: number };
}

export interface ActivityEntry {
  type: 'dungeon_clear' | 'level_up' | 'crafting' | 'gamble_win' | 'online';
  message: string;
  timestamp: number;
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

export interface DungeonRunState {
  dungeonId: string;
  currentFloor: number;
  currentAreaName: string;
  currentAreaIdx?: number;
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
  hand?: string[];
  handName?: string;
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
  currentActivity?: string;
  lastDungeonCleared?: string;
}

// ============================================================
// PvPギャンブル対戦型
// ============================================================
export interface GambleBattle {
  id: string;
  hostUid: string;
  hostName: string;
  hostLevel: number;
  gambleType: string;
  betAmount: number;
  status: 'waiting' | 'active' | 'finished';
  guestUid?: string;
  guestName?: string;
  winnerId?: string;
  createdAt: number;
  expiresAt: number;
}

// ============================================================
// UI 型
// ============================================================
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

// ============================================================
// バージョン更新情報型
// ============================================================
export interface VersionPatch {
  version: string;
  date: string;
  changes: string[];
}
