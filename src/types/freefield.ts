// src/types/freefield.ts
// フリーフィールド用の型定義（FFGG マスターデータ対応版）

// ──────────────────────────────────────────────
// ノード種別
// ──────────────────────────────────────────────
export type FreeFieldNodeType =
  | 'entrance'    // 入口 / 出口（ワールド間・エリア間）
  | 'safe'        // 安全地帯 / 拠点
  | 'danger'      // 通常戦闘エリア
  | 'boss'        // ボス地点
  | 'harvest'     // 採取ポイント
  | 'shop'        // ショップ
  | 'fishing'     // 釣りポイント
  | 'test'        // テスト / βボス地点
  | 'shortcut'    // ショートカット
  | 'transition'  // 別ワールド / 別エリアへの遷移
  | 'fever'       // フィーバー専用会場
  | 'landmark';   // ランドマーク

// ──────────────────────────────────────────────
// フィーバー種別
// ──────────────────────────────────────────────
export type FreeFieldFeverType =
  | 'gold'
  | 'red'
  | 'dragon';

// ──────────────────────────────────────────────
// ノードアクション種別
// ──────────────────────────────────────────────
export type FreeFieldNodeActionType =
  | 'battleTrigger'  // 戦闘開始
  | 'harvest'        // 採取
  | 'warp'           // ワープ・移動
  | 'shop'           // ショップを開く
  | 'fishing'        // 釣りを始める
  | 'test'           // テスター（武器・装備試用）
  | 'fever'          // フィーバー関連
  | 'landmark'       // 地点確認・説明表示
  | 'hidden';        // 条件付き隠し要素

// ──────────────────────────────────────────────
// 解放条件
// ──────────────────────────────────────────────
export type FreeFieldUnlockCondition =
  | { type: 'itemOwned';      itemId: string;    amount: number;  description?: string }
  | { type: 'harvestCount';   count: number;                      description?: string }
  | { type: 'ffBattleWins';   count: number;                      description?: string }
  | { type: 'nodeVisited';    nodeId: string;                     description?: string }
  | { type: 'dragonSoul';     amount: number;                     description?: string };

// ──────────────────────────────────────────────
// 報酬ヒント
// ──────────────────────────────────────────────
export interface FreeFieldNodeRewardHint {
  itemId?: string;
  description: string;
  dropRate?: string;  // 例: '20%', '低確率'
}

// ──────────────────────────────────────────────
// ノードアクション
// ──────────────────────────────────────────────
export interface FreeFieldNodeAction {
  /** アクション種別 */
  type: FreeFieldNodeActionType;
  /** 表示ラベル（例: '戦う', '採取する', 'ショップを開く'） */
  label: string;
  /** 詳細説明 */
  description?: string;
  /** ターゲットノードID（warp先など） */
  targetNodeId?: string;
  /** ターゲットエリアID（warp先エリアなど） */
  targetAreaId?: string;
  /** ターゲットワールドID（遷移先） */
  targetWorldId?: string;
  /** 接続する既存システムID（gatherNodeId, shopId, dungeonId など） */
  systemTargetId?: string;
  /** 解放条件（なければ常に利用可能） */
  unlockConditions?: FreeFieldUnlockCondition[];
  /** コスト（例: {gold: 100} や {itemId: 'key', amount: 1}） */
  cost?: { gold?: number; itemId?: string; amount?: number };
  /** 報酬ヒント一覧 */
  rewardHints?: FreeFieldNodeRewardHint[];
  /** 一度しか使えないか */
  onceOnly?: boolean;
  /** 隠し要素か（条件を満たすまで表示しない） */
  hidden?: boolean;
  /** クールダウン（秒） */
  cooldownSeconds?: number;
  /** 戦闘開始が自動か手動か (battleTrigger のみ) */
  triggerMode?: 'auto' | 'manual';
  /** 採取の危険度 (harvest のみ: 1~5) */
  harvestDanger?: number;
  /** 採取中に戦闘が発生するか (harvest のみ) */
  combatDuringHarvest?: boolean;
  /** フィーバー種別 (fever のみ) */
  feverType?: FreeFieldFeverType;
  /** フィーバー発生条件説明 (fever のみ) */
  feverConditionText?: string;
  /** エンカウンタープロファイルID（battleTrigger のみ、省略時はareaIdを使用） */
  encounterProfileId?: string;
}

// ──────────────────────────────────────────────
// ノードインタラクション（アクション実行時の状態管理用）
// ──────────────────────────────────────────────
export interface FreeFieldNodeInteraction {
  nodeId: string;
  actionType: FreeFieldNodeActionType;
  lastUsedAt?: number;  // Unix ms
  useCount?: number;
  completed?: boolean;  // onceOnly 用
}

// ──────────────────────────────────────────────
// ノードアクセスルール
// ──────────────────────────────────────────────
export interface FreeFieldNodeAccessRule {
  nodeId: string;
  requiresItemId?: string;
  requiresQuestComplete?: string;
  requiresLevel?: number;
  description?: string;
}

// ──────────────────────────────────────────────
// FF専用採集ノード
// ──────────────────────────────────────────────
export interface FreeFieldHarvestNode {
  id: string;
  displayName: string;
  areaId: string;
  /** 採集できるアイテム */
  items: FreeFieldHarvestItem[];
  /** 採集回数上限（リセットまで） */
  maxUses?: number;
  /** クールダウン（秒） */
  cooldownSeconds?: number;
  /** 必要ツールID */
  requiredToolId?: string;
  /** 危険度 1-5（高いと戦闘が割り込む可能性） */
  dangerLevel?: number;
}

export interface FreeFieldHarvestItem {
  itemId: string;
  displayName: string;
  baseRate: number;    // 0.0-1.0
  minAmount: number;
  maxAmount: number;
  isRare?: boolean;
}

// ──────────────────────────────────────────────
// FF専用ワープターゲット
// ──────────────────────────────────────────────
export interface FreeFieldWarpTarget {
  targetType: 'node' | 'area' | 'world';
  targetId: string;
  displayName: string;
  hidden?: boolean;
  requiresCondition?: FreeFieldUnlockCondition;
}

// ──────────────────────────────────────────────
// FF専用戦闘トリガー設定
// ──────────────────────────────────────────────
export interface FreeFieldBattleTrigger {
  /** トリガー敵ID（ffggMaster の FFGG_ALL_ENEMIES キー） */
  triggerEnemyId: string;
  /** スポーン敵プール（triggerEnemyId 撃破後に出る） */
  spawnEnemyIds: string[];
  /** スポーン数 min/max */
  spawnMin: number;
  spawnMax: number;
  /** スポーン発生確率 (0-1) */
  spawnChance: number;
  /** 最大同時出現上限 */
  maxConcurrent: number;
}

// ──────────────────────────────────────────────
// FF専用ショップリンク
// ──────────────────────────────────────────────
export interface FreeFieldShopLink {
  shopId: string;
  displayName: string;
  // TODO: ショップアイテムリストは仕様確定後に追加
}

// ──────────────────────────────────────────────
// ノード
// ──────────────────────────────────────────────
export interface FreeFieldNode {
  /** 一意ID */
  id: string;
  /** 内部名称 */
  name: string;
  /** 表示名 */
  displayName: string;
  /** 説明 */
  description?: string;
  /** ノード種別 */
  type: FreeFieldNodeType;
  /** 所属ワールドID */
  worldId?: string;
  /** 所属エリアID */
  areaId: string;
  /** 地図上の相対座標 (0.0〜1.0) */
  position: { x: number; y: number };
  /** 接続先ノードID一覧 */
  connections: string[];
  /** 原文の番号ラベル */
  indexLabel?: string;
  /** 別名・表記ゆれ */
  aliasNames?: string[];
  /** タグ */
  tags?: string[];
  /** 未確定事項・補足メモ */
  notes?: string;

  // ── アクション定義 ──
  /** このノードで実行できるアクション一覧 */
  actions?: FreeFieldNodeAction[];

  // ── 将来拡張フィールド（未実装・型のみ） ──
  unlockConditions?: FreeFieldUnlockCondition[];
  encounterHints?: string[];
  resourceHints?: string[];
  eventHints?: string[];
  dangerLevel?: number;
  isSafeZone?: boolean;
  isHidden?: boolean;

  // freefieldData.ts 側の拡張フィールド（型エラー回避）
  gatherNodeIds?: string[];
}

// ──────────────────────────────────────────────
// エリア
// ──────────────────────────────────────────────
export interface FreeFieldArea {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  notes?: string;
  tags?: string[];
  nodeIds: string[];
}

// ──────────────────────────────────────────────
// ワールド
// ──────────────────────────────────────────────
export interface FreeFieldWorld {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  notes?: string;
  mapSizeHint?: string;
  mapAspect?: number;
  areaIds: string[];
}

// ──────────────────────────────────────────────
// フィーバーデータ
// ──────────────────────────────────────────────
export interface FreeFieldFever {
  id: string;
  type: FreeFieldFeverType;
  displayName: string;
  aliases?: string[];
  triggerText: string;
  activationConditionText: string;
  description: string;
  onEndDescription?: string;
  relatedLootHints?: string[];
  relatedBossHints?: string[];
  notes?: string;
}

// ──────────────────────────────────────────────
// Codex エントリ
// ──────────────────────────────────────────────
export interface FreeFieldCodexEntry {
  id: string;
  title: string;
  section: string;
  summary?: string;
  statsText?: string;
  dropsText?: string;
  skillsText?: string;
  strategyText?: string;
  notes?: string;
}

// ──────────────────────────────────────────────
// FF採集結果
// ──────────────────────────────────────────────
export interface FFHarvestResult {
  nodeId: string;
  items: { itemId: string; displayName: string; amount: number }[];
  triggeredCombat: boolean;
  message: string;
}

// ──────────────────────────────────────────────
// FFバトルセッション（インラインバトル用）
// ──────────────────────────────────────────────
export interface FFBattleSession {
  nodeId: string;
  areaId: string;
  encounterProfileId?: string;
  phase: 'trigger' | 'spawn' | 'done';
  triggerEnemyId: string;
  triggerEnemyHp: number;
  triggerEnemyMaxHp: number;
  spawnedEnemies: FFBattleEnemy[];
  currentEnemyIdx: number;
  log: string[];
  playerHp: number;
  playerMaxHp: number;
  turn: 'player' | 'enemy' | 'result';
  result: 'win' | 'lose' | 'escaped' | null;
  drops: { itemId: string; displayName: string; amount: number }[];
  expGained: number;
  goldGained: number;
}

export interface FFBattleEnemy {
  defId: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  drops: { itemId: string; baseRate: number; minAmount: number; maxAmount: number }[];
}
