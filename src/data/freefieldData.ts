// src/data/freefieldData.ts
// フリーフィールドのワールド・エリア・ノード定義
// 将来 FF1 / FF2 / FFGG / FFGGR を追加しやすい形で管理する

import type { FreeFieldWorld } from '../types/freefield';

// ──────────────────────────────────────────────
// FFGG ワールド
// 画像の番号1〜15・ドラゴン・FFGGR(未実装エリア) を参考に配置
// 座標は地図画像に対する相対値 (0.0〜1.0)
// ──────────────────────────────────────────────
const FFGG_WORLD: FreeFieldWorld = {
  id: 'ffgg',
  label: 'FFGG',
  description: 'フリーフィールドGG。草原・砂漠・雪原が広がる広大な世界。',
  mapAspect: 0.82, // 画像の縦横比の概算
  areas: [
    {
      id: 'ffgg_north',
      label: '北部草原',
      description: '緑豊かな北部地帯',
      nodes: [
        { id: 'node_1',  label: '① 拠点',        kind: 'safe',     x: 0.26, y: 0.20, description: '北部の主要拠点' },
        { id: 'node_2',  label: '② 大森林',      kind: 'danger',   x: 0.52, y: 0.15, description: '深い森が広がるエリア' },
        { id: 'node_8',  label: '⑧ 北の砦',      kind: 'safe',     x: 0.49, y: 0.03, description: '北端の砦' },
        { id: 'node_3',  label: '③ 東の高地',    kind: 'danger',   x: 0.92, y: 0.18, description: '東側の高台エリア' },
        { id: 'node_9',  label: '⑨ 中央樹海',    kind: 'danger',   x: 0.51, y: 0.30, description: '中央部の巨大樹海' },
        { id: 'node_14', label: '⑭ 竜の棲み処',  kind: 'boss',     x: 0.21, y: 0.24, description: '水竜が守る湖上の島。ボスエリア(未実装)' },
      ],
    },
    {
      id: 'ffgg_central',
      label: '中央部',
      description: '拠点と砂漠の境界',
      nodes: [
        { id: 'node_6',  label: '⑥ 大草原',      kind: 'harvest',  x: 0.14, y: 0.32, description: '採取が豊富な大草原(採取未実装)' },
        { id: 'node_7',  label: '⑦ 西部荒地',    kind: 'danger',   x: 0.19, y: 0.47, description: '荒れた西部エリア' },
        { id: 'node_10', label: '⑩ 廃墟群',      kind: 'danger',   x: 0.44, y: 0.40, description: '廃墟が点在するエリア' },
        { id: 'node_5',  label: '⑤ 東部の丘',    kind: 'safe',     x: 0.74, y: 0.38, description: '見晴らしの良い東部の丘' },
        { id: 'node_11', label: '⑪ 砂漠入口',    kind: 'entrance', x: 0.38, y: 0.48, description: '砂漠地帯への入口' },
      ],
    },
    {
      id: 'ffgg_desert',
      label: '南部砂漠',
      description: '乾燥した砂漠地帯',
      nodes: [
        { id: 'node_4',  label: '④ 砂漠中心',    kind: 'danger',   x: 0.64, y: 0.60, description: '広大な砂漠の中心部' },
        { id: 'node_12', label: '⑫ 東部遺跡',    kind: 'harvest',  x: 0.88, y: 0.68, description: '砂漠東部の遺跡(採取未実装)' },
        { id: 'node_13', label: '⑬ 雪原',        kind: 'danger',   x: 0.10, y: 0.52, description: '西側の雪原エリア' },
        { id: 'node_15', label: '⑮ 砂漠深部',    kind: 'boss',     x: 0.44, y: 0.84, description: '砂漠最深部(ボス未実装)' },
      ],
    },
    {
      id: 'ffgg_r',
      label: 'FFGGR(未実装)',
      description: '未実装エリア。将来追加予定。',
      nodes: [
        { id: 'ffggr_entry', label: 'FFGGR入口', kind: 'entrance', x: 0.50, y: 0.95, description: '未実装エリアへの入口。現在は進入できません。' },
      ],
    },
  ],
};

// ──────────────────────────────────────────────
// FF1 ワールド（スタブ、後から充実させる）
// ──────────────────────────────────────────────
const FF1_WORLD: FreeFieldWorld = {
  id: 'ff1',
  label: 'FF1',
  description: 'フリーフィールド1。(データ準備中)',
  areas: [
    {
      id: 'ff1_start',
      label: '開始エリア',
      nodes: [
        { id: 'ff1_entrance', label: '入口', kind: 'entrance', x: 0.5, y: 0.5, description: 'FF1エリア入口 (準備中)' },
      ],
    },
  ],
};

// ──────────────────────────────────────────────
// FF2 ワールド（スタブ）
// ──────────────────────────────────────────────
const FF2_WORLD: FreeFieldWorld = {
  id: 'ff2',
  label: 'FF2',
  description: 'フリーフィールド2。(データ準備中)',
  areas: [
    {
      id: 'ff2_start',
      label: '開始エリア',
      nodes: [
        { id: 'ff2_entrance', label: '入口', kind: 'entrance', x: 0.5, y: 0.5, description: 'FF2エリア入口 (準備中)' },
      ],
    },
  ],
};

// ──────────────────────────────────────────────
// エクスポート
// ──────────────────────────────────────────────
export const FREE_FIELD_WORLDS: FreeFieldWorld[] = [FFGG_WORLD, FF1_WORLD, FF2_WORLD];

export const getFreeFieldWorld = (id: string): FreeFieldWorld | undefined =>
  FREE_FIELD_WORLDS.find(w => w.id === id);
