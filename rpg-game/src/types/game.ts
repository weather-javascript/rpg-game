// src/types/game.ts
// ゲーム全体で使用する型定義。新しい概念を追加する場合はここに型を追加する。

// ============================================================
// === 汎用ユーティリティ型 ===
// ============================================================

/** IDをキーとする汎用マップ型。Firestoreの柔軟なスキーマに対応。 */
export type IdMap<T> = Record<string, T>;

// ============================================================
// === マスターデータ型（ゲームの設計図） ===
// ============================================================

/** アイテムのレアリティ */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** アイテムの種別 */
export type ItemCategory = 'material' | 'tool' | 'consumable' | 'weapon' | 'armor' | 'treasure';

/** アイテムマスターデータ（1種類のアイテムの定義） */
export interface ItemMaster {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: Rarity;
  /** システムショップでの売却価格（0=売れない） */
  sellPrice: number;
  /** システムショップでの購入価格（0=買えない） */
  buyPrice: number;
  /** スタック上限。-1 = 無制限 */
  maxStack: number;
  /** アイコン（絵文字で代用） */
  icon: string;
}

/** スキルの種別 */
export type SkillId = 'mining' | 'woodcutting' | 'combat' | 'fishing' | 'crafting';

/** スキルマスターデータ */
export interface SkillMaster {
  id: SkillId;
  name: string;
  description: string;
  icon: string;
  /** 最大レベル */
  maxLevel: number;
}

/** ドロップテーブルの1エントリ */
export interface DropEntry {
  itemId: string;
  /** 基本ドロップ率 (0.0〜1.0) */
  baseRate: number;
  /** 最小ドロップ数 */
  minAmount: number;
  /** 最大ドロップ数 */
  maxAmount: number;
  /** スキルレベルによるドロップ率ボーナス係数 */
  skillRateBonus?: number;
}

/** 採取ノードのマスターデータ（木、岩、鉱脈など） */
export interface GatherNodeMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 必要スキルとその最低レベル */
  requiredSkill: { skillId: SkillId; minLevel: number };
  /** クールダウン（ミリ秒） */
  cooldownMs: number;
  /** ドロップテーブル */
  drops: DropEntry[];
  /** スタミナ消費量 */
  staminaCost: number;
}

/** モンスターマスターデータ */
export interface MonsterMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 最大HP */
  maxHp: number;
  /** 攻撃力（プレイヤーへのダメージ） */
  attack: number;
  /** 防御力 */
  defense: number;
  /** 撃破時の基本経験値 */
  baseExp: number;
  /** 撃破時の基本報酬金 */
  baseGold: number;
  /** ドロップテーブル */
  drops: DropEntry[];
  /** 出現するダンジョンIDのリスト */
  dungeonIds: string[];
}

/** ダンジョンマスターデータ */
export interface DungeonMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 入場に必要なプレイヤーレベル */
  requiredLevel: number;
  /** 出現モンスターIDのリスト（ランダム選択） */
  monsterIds: string[];
  /** フロア数 */
  floors: number;
}

/** ギャンブルゲームの種別 */
export type GambleType = 'slot' | 'treasure_box' | 'coin_flip';

/** ギャンブルゲームのマスターデータ */
export interface GambleMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: GambleType;
  /** 最低賭け金 */
  minBet: number;
  /** 最大賭け金 */
  maxBet: number;
  /** 報酬テーブル（ゲームタイプごとに構造が異なるため any を許容） */
  rewardTable: GambleReward[];
}

/** ギャンブルの報酬エントリ */
export interface GambleReward {
  label: string;
  /** 発生確率 (0.0〜1.0) */
  probability: number;
  /** 倍率（賭け金に対する倍率。1.0 = 元返し） */
  multiplier: number;
  /** アイテム報酬（オプション） */
  itemRewards?: { itemId: string; amount: number }[];
  /** スロット用シンボル */
  symbols?: string[];
}

// ============================================================
// === プレイヤーデータ型（Firestoreに保存されるデータ） ===
// ============================================================

/** プレイヤーの基本ステータス */
export interface PlayerStats {
  level: number;
  exp: number;
  /** 現在のレベルに必要な累積経験値（レベルアップ判定用） */
  expToNextLevel: number;
  hp: number;
  maxHp: number;
  /** 満腹度（採取行動のコスト） */
  satiety: number;
  maxSatiety: number;
  /** 攻撃力 */
  attack: number;
  /** 防御力 */
  defense: number;
}

/** プレイヤーの全データ（Firestoreドキュメントと1対1対応） */
export interface PlayerData {
  /** Firebase Authentication の UID */
  uid: string;
  /** 表示名 */
  displayName: string;
  /** 所持金 */
  gold: number;
  /** ステータス */
  stats: PlayerStats;
  /** インベントリ: { [itemId]: 数量 } */
  inventory: IdMap<number>;
  /** スキルレベル: { [skillId]: レベル } */
  skillLevels: IdMap<number>;
  /** スキル経験値: { [skillId]: 経験値 } */
  skillExp: IdMap<number>;
  /** 最終セーブ時刻 */
  lastSavedAt: number;
  /** アカウント作成日時 */
  createdAt: number;
}

// ============================================================
// === ゲーム内イベント・アクション型 ===
// ============================================================

/** 採取アクションの結果 */
export interface GatherResult {
  drops: { itemId: string; amount: number }[];
  expGained: IdMap<number>;
  staminaUsed: number;
}

/** 戦闘の1ターン結果 */
export interface CombatTurn {
  playerDamage: number;
  monsterDamage: number;
  playerHpAfter: number;
  monsterHpAfter: number;
  log: string;
}

/** 戦闘結果全体 */
export interface CombatResult {
  victory: boolean;
  turns: CombatTurn[];
  expGained: number;
  goldGained: number;
  drops: { itemId: string; amount: number }[];
}

/** ギャンブルの結果 */
export interface GambleResult {
  rewardLabel: string;
  multiplier: number;
  goldDelta: number;
  itemRewards: { itemId: string; amount: number }[];
  symbols?: string[];
}

// ============================================================
// === マーケット（オークション）型 ===
// ============================================================

/** オークション出品データ（Firestoreの `auctions` コレクションに対応） */
export interface AuctionListing {
  id: string;
  /** 出品者のUID */
  sellerUid: string;
  /** 出品者の表示名 */
  sellerName: string;
  itemId: string;
  amount: number;
  pricePerUnit: number;
  /** 出品期限（Unixタイムスタンプ ms） */
  expiresAt: number;
  createdAt: number;
}

// ============================================================
// === UI 状態型 ===
// ============================================================

/** メイン画面のタブ種別 */
export type TabId = 'gathering' | 'market' | 'dungeon' | 'gamble' | 'status';

/** 通知メッセージ */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
