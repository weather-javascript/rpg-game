// src/types/freefield.ts
// フリーフィールド用の型定義（FFGG マスターデータ対応版）

// ──────────────────────────────────────────────
// ノード種別
// ──────────────────────────────────────────────
export type FreeFieldNodeType =
  | 'entrance'    // 入口 / 出口（ワールド間・エリア間）
  | 'safe'        // 安全地帯 / 拠点
  | 'danger'      // 通常戦闘エリア（未実装）
  | 'boss'        // ボス地点（未実装）
  | 'harvest'     // 採取ポイント（未実装）
  | 'shop'        // ショップ（未実装）
  | 'fishing'     // 釣りポイント（未実装）
  | 'test'        // テスト / βボス地点
  | 'shortcut'    // ショートカット
  | 'transition'  // 別ワールド / 別エリアへの遷移
  | 'fever'       // フィーバー専用会場
  | 'landmark';   // ランドマーク（独立した地形・建造物など）

// ──────────────────────────────────────────────
// フィーバー種別
// ──────────────────────────────────────────────
export type FreeFieldFeverType =
  | 'gold'    // ゴールドフィーバー
  | 'red'     // レッドフィーバー
  | 'dragon'; // ドラゴンフィーバー

// ──────────────────────────────────────────────
// ノード
// ──────────────────────────────────────────────
export interface FreeFieldNode {
  /** 一意ID（例: ffgg_node_01） */
  id: string;
  /** 内部名称（英字スネークケース推奨） */
  name: string;
  /** 表示名（日本語・原文準拠） */
  displayName: string;
  /** 原文に基づく説明 */
  description?: string;
  /** ノード種別 */
  type: FreeFieldNodeType;
  /** 所属エリアID */
  areaId: string;
  /** 地図上の相対座標 (0.0〜1.0) */
  position: { x: number; y: number };
  /** 接続先ノードID一覧 */
  connections: string[];
  /** 原文の番号ラベル（例: '①'） */
  indexLabel?: string;
  /** 別名・表記ゆれ（原文のまま保持） */
  aliasNames?: string[];
  /** タグ（バイオーム・役割など自由記述） */
  tags?: string[];
  /** 未確定事項・補足メモ（勝手に補完せずここに残す） */
  notes?: string;

  // ── 将来拡張フィールド（未実装・型のみ） ──
  /** 解放条件（未実装） */
  unlockConditions?: FreeFieldUnlockCondition[];
  /** 敵出現に関するヒント（未実装） */
  encounterHints?: string[];
  /** 採取に関するヒント（未実装） */
  resourceHints?: string[];
  /** イベント・フィーバーに関するヒント（未実装） */
  eventHints?: string[];
  /** 危険度（未実装。1〜5程度を想定） */
  dangerLevel?: number;
  /** 安全地帯フラグ */
  isSafeZone?: boolean;
  /** 隠しノードフラグ（未実装） */
  isHidden?: boolean;
}

// ──────────────────────────────────────────────
// 解放条件（将来用スタブ）
// ──────────────────────────────────────────────
export interface FreeFieldUnlockCondition {
  // TODO: 解放条件の詳細仕様が決まったら実装する
  type: string;
  value?: unknown;
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
  /** このエリアに属するノードID一覧（正引き用） */
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
  /** マップサイズ（原文記載のブロック数など） */
  mapSizeHint?: string;
  /** 地図のアスペクト比 width/height */
  mapAspect?: number;
  /** このワールドに属するエリアID一覧 */
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
  /** 発生トリガーの説明テキスト（原文準拠） */
  triggerText: string;
  /** 発生条件の説明テキスト（原文準拠） */
  activationConditionText: string;
  /** フィーバー中の説明 */
  description: string;
  /** フィーバー終了時の挙動説明 */
  onEndDescription?: string;
  /** 関連ドロップのヒント（実装なし、メモのみ） */
  relatedLootHints?: string[];
  /** 関連ボスのヒント（実装なし、メモのみ） */
  relatedBossHints?: string[];
  notes?: string;
}

// ──────────────────────────────────────────────
// Codex エントリ（FF1/FF2 ボス・説明文の分離保持用）
// ──────────────────────────────────────────────
export interface FreeFieldCodexEntry {
  id: string;
  title: string;
  /** どのセクション・ワールドに属するか（例: 'ff1', 'ff2', 'ffgg'） */
  section: string;
  summary?: string;
  statsText?: string;
  dropsText?: string;
  skillsText?: string;
  strategyText?: string;
  notes?: string;
}
