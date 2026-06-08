// src/types/game.ts

export type IdMap<T> = Record<string, T>;
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemCategory = 'material' | 'tool' | 'consumable' | 'weapon' | 'armor' | 'treasure' | 'food' | 'potion';
export type ItemType = 'Weapon' | 'Armor' | 'Item' | 'Heal';
export type SkillId = 'mining' | 'woodcutting' | 'combat' | 'fishing' | 'crafting';

// ============================================================
// 武器スキル型
// ============================================================
export interface WeaponPassiveSkill {
  type: 'penetrate_per_turn';   // 毎ターン貫通ダメージ
  value: number;
}
export interface WeaponRegenSkill {
  type: 'regen_per_turn';       // 毎ターン回復
  hpRestore?: number;
  satietyRestore?: number;
}
export interface WeaponShieldSkill {
  type: 'hotbar_shield';        // ホットバー装備中に敵攻撃カット
  cutPercent: number;
}
export interface WeaponManaSkill {
  type: 'mana_charge';          // MANAチャージ型必殺技
  manaPerTurn: number;
  manaMax: number;
}
export interface WeaponOffhandManaOnHealSkill {
  type: 'offhand_mana_on_heal';  // オフハンド装備時に回復使用で一定確率でMana蓄積
  offhandItemId: string;
  chance: number;
  manaGain: number;
}
export interface WeaponManaPerTurnRandomSkill {
  type: 'mana_per_turn_random';  // 毎ターンランダムにMana付与（サポート武器）
  manaMin: number;
  manaMax: number;
  manaStep: number;
}
export type WeaponSkill = WeaponPassiveSkill | WeaponRegenSkill | WeaponShieldSkill | WeaponManaSkill | WeaponOffhandManaOnHealSkill | WeaponManaPerTurnRandomSkill;

export interface WeaponUltimate {
  name: string;
  description: string;
  // 物理 × 回数 + 貫通 × 回数
  physDamage?: number;
  physHits?: number;
  penetrateDamage?: number;
  penetrateHits?: number;
  // 発動後バフ
  postBuffTurns?: number;
  postBuffPoisonDmg?: number;
}
export type TabId = 'gathering' | 'market' | 'dungeon' | 'gamble' | 'status' | 'online' | 'fishing' | 'admin' | 'crafting';
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
  itemType: ItemType;       // Weapon / Armor / Item / Heal
  rarity: Rarity;
  sellPrice: number;
  buyPrice: number;
  maxStack: number;
  icon: string;
  // 武器固有ステータス
  weaponAtk?: number;       // 武器固有攻撃力（通常攻撃をこの値で上書き）
  isAreaWeapon?: boolean;   // 範囲攻撃武器（全体攻撃）
  areaPenetrate?: number;   // 範囲攻撃の貫通ダメージ（防御無視）
  weaponDef?: number;       // 装備時防御ボーナス
  weaponHpBonus?: number;   // 装備時最大HP増加
  // 武器スキル（複数可）
  weaponSkills?: WeaponSkill[];
  weaponUltimate?: WeaponUltimate;
  // SVGアイコン文字列（カスタム武器など）
  svgIcon?: string;
  // PNG base64アイコン（カスタム武器など）
  pngIcon?: string;
  // 使用しても消費されない（消耗品でない）
  nonconsumable?: boolean;
  // 使用後クールダウンターン数
  cooldownTurns?: number;
  // オフハンド専用武器
  isOffhand?: boolean;
  // 防具スロット制限 (helmet / chestplate / leggings / boots)
  armorSlot?: 'helmet' | 'chestplate' | 'leggings' | 'boots';
  useEffect?: {
    hpRestore?: number;
    satietyRestore?: number;
    message?: string;
    attackBonus?: number;   // 武器使用時の追加攻撃ダメージ（後方互換）
    attackType?: string;
    buffType?: string;
    buffDuration?: number;
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
  monsters: { monsterId: string; count: number; isBoss?: boolean; isMidBoss?: boolean }[];
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
  isMidBoss?: boolean;
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
  /** 3×3グリッドのレシピ配置。長さ9の配列（インデックス0=左上, 8=右下）。
   *  空文字列はどのアイテムも不要なセル。
   *  省略した場合は従来通り位置不問マッチング。 */
  shape?: (string | '')[];
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
  baseMaxHp?: number;   // ホットバーボーナス適用前の素のmaxHp
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
  // 満腹度上限アップグレード購入回数
  satietyUpgradeCount?: number;
  hpUpgradeCount?: number;
  // ガチャコイン
  gachaCoins?: number;
  // プロフィール
  profile?: {
    icon: string;          // 絵文字アイコン
    comment: string;       // 一言コメント
    titleId: string;       // 称号ID
    favDungeonId: string;  // 好きなダンジョン
  };
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
  bossLoopMode?: boolean; // ボス周回モード（倒し続ける）
  kxBossMode?: boolean;   // KX裏ボス戦モード
  kxPhase?: number;       // KX形態（1-4）
  kxHp?: number;          // KX現在HP
  kxIsAwakened?: boolean; // KX覚醒状態
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

export interface BoardReply {
  uid: string;
  displayName: string;
  level: number;
  text: string;
  createdAt: number;
}

export interface BoardPoll {
  question: string;
  options: string[];
  votes: Record<string, number>; // optionIndex -> uid[]  stored as uid:optionIndex in Firestore
}

export interface BoardMessage {
  id: string;
  uid: string;
  displayName: string;
  level: number;
  text: string;
  createdAt: number;
  reactions?: Record<string, string[]>; // emoji -> uid[]
  replies?: BoardReply[];
  poll?: BoardPoll;
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
// テキサスホールデム マルチプレイヤー型
// ============================================================
export interface PokerCard {
  rank: string;
  suit: 'S' | 'H' | 'D' | 'C';
}

export interface PokerPlayer {
  uid: string;
  displayName: string;
  level: number;
  chips: number;       // テーブルでの所持チップ
  bet: number;         // 現在ラウンドのベット額
  hand: PokerCard[];   // 手札（本人のみ参照）
  folded: boolean;
  allIn: boolean;
  isReady: boolean;
}

export type PokerPhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'finished';

export interface PokerTable {
  id: string;
  hostUid: string;
  hostName: string;
  hostLevel: number;
  maxPlayers: number;          // 3〜6
  buyIn: number;               // 参加費（掛け金）
  status: 'waiting' | 'playing' | 'finished';
  phase: PokerPhase;
  players: PokerPlayer[];
  communityCards: PokerCard[];
  pot: number;
  currentTurnUid: string;
  smallBlindUid: string;
  bigBlindUid: string;
  dealerUid: string;
  currentBet: number;          // 現ラウンドの最高ベット額
  winners?: { uid: string; displayName: string; amount: number; handName: string }[];
  deck: PokerCard[];           // サーバー側で管理するデッキ（クライアントには見せない）
  createdAt: number;
  expiresAt: number;
  lastActionAt: number;
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
