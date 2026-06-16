// src/types/freefield.ts
// フリーフィールド用の型定義

// ノード種別（将来の拡張用）
export type FreeFieldNodeKind =
  | 'entrance'   // 入口 / 出口
  | 'safe'       // 安全地帯 / 拠点
  | 'harvest'    // 採取ポイント (未実装)
  | 'danger'     // 通常敵エリア (未実装)
  | 'boss'       // ボスエリア (未実装)
  | 'shop'       // ショップ (未実装)
  | 'fishing'    // 釣りポイント (未実装)
  | 'test'       // テストエリア
  | 'shortcut';  // ショートカット

// 地図上のノード
export interface FreeFieldNode {
  id: string;
  label: string;
  kind: FreeFieldNodeKind;
  /** 地図画像に対する相対位置 (0.0〜1.0) */
  x: number;
  y: number;
  description?: string;
  /** 将来：解放条件 */
  // TODO: unlockCondition?: { ... }
  /** 将来：敵データ / 採取テーブルなど */
  // TODO: encounterTable?: ...
}

// エリア定義（世界内のゾーン）
export interface FreeFieldArea {
  id: string;
  label: string;
  description?: string;
  nodes: FreeFieldNode[];
}

// 世界定義（最上位）
export interface FreeFieldWorld {
  id: string;
  label: string;
  description?: string;
  /** 地図の背景色またはURL（将来） */
  mapBg?: string;
  /** 地図のアスペクト比 widthPx / heightPx */
  mapAspect?: number;
  areas: FreeFieldArea[];
}
