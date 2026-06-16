// src/data/freefieldData.ts
// フリーフィールド マスターデータ
// ※ 敵出現・ドロップ・採取・戦闘・フィーバー発生ロジックは一切含まない
// ※ 原文にない情報は補完せず notes / TODO に残すこと

import type {
  FreeFieldWorld,
  FreeFieldArea,
  FreeFieldNode,
  FreeFieldFever,
  FreeFieldCodexEntry,
} from '../types/freefield';

// ============================================================
// FFGG エリア定義
// ============================================================
export const FFGG_AREAS: Record<string, FreeFieldArea> = {

  ffgg_forest: {
    id: 'ffgg_forest',
    name: 'forest',
    displayName: '森地帯',
    description: '木が生い茂るエリア。ホワイトバジル採取場所あり。大樹の上には巨大彗星がスポーンする。',
    tags: ['forest', 'green', '緑竜'],
    notes: '固有モブあり（未実装）。緑鱗・ソール系・アンティークコイン・コスモニウム・FF小判/大判 が重要ドロップ候補（未実装）。',
    nodeIds: ['ffgg_node_09'],
  },

  ffgg_plain: {
    id: 'ffgg_plain',
    name: 'plain',
    displayName: '平原地帯',
    description: '特段のオブジェクトや地形が少ない。戦闘は比較的シンプル（未実装）。',
    tags: ['plain', '赤竜'],
    notes: '赤鱗が重要ドロップ候補（未実装）。safe と danger の中間として扱う想定。',
    nodeIds: ['ffgg_node_03'],
  },

  ffgg_desert: {
    id: 'ffgg_desert',
    name: 'desert',
    displayName: '砂漠地帯',
    description: '一面砂だらけ。FFGG の中でおそらく最も広い。骨や砂岩の建物がある。',
    tags: ['desert', '岩竜'],
    notes: '岩鱗・枯れた心・アンティークコイン・FF大判・熱砂の琥珀 が重要ドロップ候補（未実装）。',
    nodeIds: ['ffgg_node_11', 'ffgg_node_12'],
  },

  ffgg_snow: {
    id: 'ffgg_snow',
    name: 'snow',
    displayName: '雪山 / 水竜周辺',
    description: '雪が多く高低差が激しい。取れる君の強化場所や隠しSHOPがある。',
    tags: ['snow', '水竜', '雪山', '隠しSHOP'],
    notes: '水鱗・狼牙魔結晶・波狼 が重要ドロップ候補（未実装）。⑤ の displayName は「家っぽいとこ」、aliasNames に「雪山」を含む（原文表記ゆれ）。⑬ 線路(陰キャ) と接続関係あり。',
    nodeIds: ['ffgg_node_13'],
  },

  ffgg_savanna: {
    id: 'ffgg_savanna',
    name: 'savanna',
    displayName: 'サバンナ地帯',
    description: 'GGに出る敵がほぼ出てくるエリア。ミニボスが2種類存在する。',
    tags: ['savanna', 'ミニボス'],
    notes: '各鱗系・各ドロップ・FF大判・壊世賜杖レクイエム・シュヴァリエプレッジ が重要ドロップ候補（未実装）。⑥GGの木(屠る巨人) と ⑦マハドリュアス がこのエリアの中核ノード。',
    nodeIds: ['ffgg_node_06', 'ffgg_node_07'],
  },

  ffgg_pirate: {
    id: 'ffgg_pirate',
    name: 'pirate',
    displayName: '海賊船',
    description: '海賊が湧くエリア。高火力の大砲がある。',
    tags: ['pirate', '海賊', '大砲'],
    notes: 'パイレーツ系・パイレーツキャプテン が出現（未実装）。アンティークコイン・カリブの荒波 が重要ドロップ候補（未実装）。',
    nodeIds: ['ffgg_node_10'],
  },

  ffgg_special: {
    id: 'ffgg_special',
    name: 'special',
    displayName: '特殊地点',
    description: 'FFGG 内の特殊・イベント系ノードをまとめたエリア区分。',
    tags: ['special', 'fever', 'entrance', 'transition'],
    notes: '⑧FF2エリア(遷移)・⑭ドラゴンフィーバー会場・⑮FF高原(βテストボス)・①ショートカット入口 を含む。',
    nodeIds: ['ffgg_node_01', 'ffgg_node_08', 'ffgg_node_14', 'ffgg_node_15'],
  },
};

// ============================================================
// FFGG ノード定義（①〜⑮）
// ============================================================
export const FFGG_NODES: Record<string, FreeFieldNode> = {

  ffgg_node_01: {
    id: 'ffgg_node_01',
    name: 'shortcut_entrance',
    displayName: 'FFGGショートカット入口＆釣り堀＆テスター',
    indexLabel: '①',
    type: 'shortcut',
    areaId: 'ffgg_special',
    position: { x: 0.26, y: 0.20 },
    connections: ['ffgg_node_02', 'ffgg_node_06'],
    tags: ['shortcut', 'fishing', 'test', 'entrance'],
    description: 'FFGGへのショートカット入口。釣り堀とテスターを兼ねる複合地点。',
    notes: '釣り堀の詳細仕様・テスターの詳細仕様は未確定。TODO: 釣り実装時に fishing ノードとして分離するか検討。',
    isSafeZone: true,
  },

  ffgg_node_02: {
    id: 'ffgg_node_02',
    name: 'forest_green_dragon',
    displayName: '森地帯（緑竜の狩場）',
    indexLabel: '②',
    type: 'danger',
    areaId: 'ffgg_forest',
    position: { x: 0.52, y: 0.15 },
    connections: ['ffgg_node_01', 'ffgg_node_09', 'ffgg_node_08', 'ffgg_node_10'],
    tags: ['forest', '緑竜', 'danger'],
    description: '木が生い茂る森地帯。緑竜の狩場。ホワイトバジル採取場所あり。',
    resourceHints: ['ホワイトバジル（white_basil）採取', '緑輝石（green_gem_ore）採取', 'コスモニウム（cosmonium）極低確率採取', '緑鱗（green_scale）敵ドロップ', 'FF小判（ff_coin_small）ドロップ'],
    encounterHints: ['グリド・グリド・アルファ→緑鱗', 'フォレストリッパー→緑鱗/コスモニウム（低確率）', 'ソールドロップ→スラムイ溶液'],
    gatherNodeIds: ['ffgg_forest_herb'],
    dangerLevel: 3,
    notes: '大樹ノード(⑨)はこのエリアに属するランドマーク。',
  },

  ffgg_node_03: {
    id: 'ffgg_node_03',
    name: 'plain_red_dragon',
    displayName: '平原地帯（赤竜の狩場）',
    indexLabel: '③',
    type: 'danger',
    areaId: 'ffgg_plain',
    position: { x: 0.87, y: 0.18 },
    connections: ['ffgg_node_02', 'ffgg_node_05'],
    tags: ['plain', '赤竜'],
    description: '特段のオブジェクトや地形が少ない平原。赤竜の狩場。',
    resourceHints: ['赤鱗（red_scale）敵ドロップ', '赤鱗（上位）（red_scale_high）上位敵ドロップ', 'ドラグ系→ドラゴンの鱗（低確率）'],
    encounterHints: ['ドラグ・ドラグ強→赤鱗', 'ドラゴンフィーバー連動'],
    dangerLevel: 2,
    notes: '原文に「脳死で戦える」との記載あり。safe と danger の中間的な扱いを想定。',
  },

  ffgg_node_04: {
    id: 'ffgg_node_04',
    name: 'desert_rock_dragon',
    displayName: '砂漠地帯（岩竜の狩場）',
    indexLabel: '④',
    type: 'danger',
    areaId: 'ffgg_desert',
    position: { x: 0.64, y: 0.60 },
    connections: ['ffgg_node_11', 'ffgg_node_12', 'ffgg_node_15'],
    tags: ['desert', '岩竜'],
    description: '一面砂だらけの広大な砂漠。岩竜の狩場。骨や砂岩の建物が点在する。',
    resourceHints: ['岩鱗（rock_scale）ガドラ/エガルド系', '熱砂の琥珀（hot_sand_amber）採取/ガドラ改', 'ニトロトリン（nitrotrin）採取（危険）', '枯れた心（withered_heart）エガルドン（レア）', 'アンティークコイン（antique_coin）一部敵', 'マテラカイト（matelakaite）採取'],
    encounterHints: ['ガドラ→岩鱗', 'ガドラ改→岩鱗/熱砂の琥珀', 'エガルド→岩鱗/枯れた心', 'エガルドン（ボス）→岩鱗上位/熱砂の琥珀/枯れた心'],
    gatherNodeIds: ['ffgg_desert_gather'],
    dangerLevel: 3,
    notes: 'FFGG 内で最も広いエリアとされる。',
  },

  ffgg_node_05: {
    id: 'ffgg_node_05',
    name: 'snow_water_dragon',
    displayName: '家っぽいとこ（水竜の狩場）',
    indexLabel: '⑤',
    aliasNames: ['雪山', '水竜周辺'],
    type: 'danger',
    areaId: 'ffgg_snow',
    position: { x: 0.74, y: 0.38 },
    connections: ['ffgg_node_03', 'ffgg_node_13'],
    tags: ['snow', '水竜', '隠しSHOP'],
    description: '雪が多く高低差が激しいエリア。水竜の狩場。取れる君の強化場所や隠しSHOPがある。',
    encounterHints: ['アドーラ/アドーラ改→水鱗/海原の欠片', '牙狼→狼牙魔結晶/wolf_crystal', '波狼（ボス）→狼牙魔結晶/水鱗上位/海原のオーブ', 'Sea Memoria（ボス）→海原のオーブ/水鱗上位'],
    resourceHints: ['水鱗（water_scale）アドーラ系', '狼牙魔結晶（wolf_magic_crystal）波狼/牙狼', '海原のオーブ（ocean_orb）Sea Memoriaボス', '海原の欠片（ocean_shard）採取/アドーラ改', '取れる君の強化場所（詳細未確定）', '隠しSHOP（未実装）'],
    gatherNodeIds: ['ffgg_snow_gather'],
    dangerLevel: 3,
    notes: '原文内で「雪山」と「家っぽいとこ」の表記ゆれあり。aliasNames に両方保持。',
  },

  ffgg_node_06: {
    id: 'ffgg_node_06',
    name: 'gg_tree_giant_slayer',
    displayName: 'GGの木（屠る巨人）',
    indexLabel: '⑥',
    type: 'boss',
    areaId: 'ffgg_savanna',
    position: { x: 0.14, y: 0.32 },
    connections: ['ffgg_node_01', 'ffgg_node_07'],
    tags: ['savanna', 'boss', 'ミニボス', '屠る巨人'],
    description: 'サバンナ地帯の大木。ミニボス「屠る巨人」の出現地点。',
    encounterHints: ['屠る巨人（ミニボス・未実装）'],
    dangerLevel: 4,
    notes: 'Codex エントリ: giant_slayer 参照。ドロップ詳細は未実装。',
  },

  ffgg_node_07: {
    id: 'ffgg_node_07',
    name: 'mahadryuas',
    displayName: 'マハドリュアス',
    indexLabel: '⑦',
    type: 'boss',
    areaId: 'ffgg_savanna',
    position: { x: 0.19, y: 0.47 },
    connections: ['ffgg_node_06'],
    tags: ['savanna', 'boss', 'ミニボス', 'マハドリュアス'],
    description: 'サバンナ地帯のミニボス「マハドリュアス」の出現地点。',
    encounterHints: ['マハドリュアス（ミニボス・未実装）'],
    dangerLevel: 4,
    notes: 'TODO: マハドリュアスの詳細仕様は原文から追加確認が必要。',
  },

  ffgg_node_08: {
    id: 'ffgg_node_08',
    name: 'ff2_area_transition',
    displayName: 'FF2エリア',
    indexLabel: '⑧',
    type: 'transition',
    areaId: 'ffgg_special',
    position: { x: 0.49, y: 0.03 },
    connections: ['ffgg_node_02'],
    tags: ['transition', 'FF2', 'ff2'],
    description: 'FFGG 内に存在する FF2 エリアへの遷移ポイント。スラムイ系・海原系・銀の弾丸・レイド系素材の入手場所。',
    resourceHints: ['スラムイ溶液（slamy_liquid）スラムイキング', 'ポイズンスフィア（poison_sphere）毒系敵', '銀の弾丸（silver_bullet）宝箱/ドロップ', '海原のオーブ（ocean_orb）ボスドロップ', '鯨油タンク（whale_oil_tank）大型魚型敵', 'ブラッドリィレイン（bloody_rain）暗黒系ボス（低確率）', '光輝トラス（light_trus）サバンナ/FF2強敵'],
    eventHints: ['FF2ワールドへの遷移（遷移実装未定）'],
    notes: 'FFGG 内に FF2 エリアが存在する。FF2 ワールドとの接続は別途実装。TODO: World 間遷移の実装方針が決まったら接続を更新する。',
  },

  ffgg_node_09: {
    id: 'ffgg_node_09',
    name: 'great_tree_comet',
    displayName: '大樹（巨大彗星）',
    indexLabel: '⑨',
    type: 'landmark',
    areaId: 'ffgg_forest',
    position: { x: 0.51, y: 0.30 },
    connections: ['ffgg_node_02'],
    tags: ['landmark', 'forest', '大樹', '巨大彗星', 'boss'],
    description: '森地帯にそびえる大樹。頂上に巨大彗星がスポーンする。',
    encounterHints: ['巨大彗星（大樹の上に出現・未実装）'],
    dangerLevel: 5,
    notes: 'Codex エントリ: giant_comet 参照。巨大彗星は森地帯エリアのランドマーク扱い。',
  },

  ffgg_node_10: {
    id: 'ffgg_node_10',
    name: 'pirate_ship',
    displayName: '海賊船',
    indexLabel: '⑩',
    type: 'danger',
    areaId: 'ffgg_pirate',
    position: { x: 0.44, y: 0.40 },
    connections: ['ffgg_node_02', 'ffgg_node_11'],
    tags: ['pirate', '海賊', '大砲'],
    description: '海賊が湧く海賊船。高火力の大砲がある。フィーバー時にカリブの荒波が入手可能。',
    encounterHints: ['パイレーツ系→アンティークコイン/FF小判', '脳筋盗賊リーダー（ボス）→アンティークコイン/カリブの荒波/FF小判'],
    resourceHints: ['アンティークコイン（antique_coin）パイレーツ系/ボス', 'カリブの荒波（carib_rough_wave）ボス/フィーバー限定', 'FF小判（ff_coin_small）大量ドロップ'],
    dangerLevel: 3,
  },

  ffgg_node_11: {
    id: 'ffgg_node_11',
    name: 'bone',
    displayName: '骨',
    indexLabel: '⑪',
    type: 'landmark',
    areaId: 'ffgg_desert',
    position: { x: 0.38, y: 0.48 },
    connections: ['ffgg_node_10', 'ffgg_node_04'],
    tags: ['desert', 'landmark', '骨'],
    description: '砂漠地帯に存在する骨のランドマーク。',
    notes: 'TODO: 骨の具体的な役割・仕様は未確定。採取か戦闘か不明。',
  },

  ffgg_node_12: {
    id: 'ffgg_node_12',
    name: 'pyramid',
    displayName: 'ピラミッド',
    indexLabel: '⑫',
    type: 'landmark',
    areaId: 'ffgg_desert',
    position: { x: 0.88, y: 0.68 },
    connections: ['ffgg_node_04'],
    tags: ['desert', 'landmark', 'ピラミッド', '砂岩'],
    description: '砂漠地帯にある砂岩のピラミッド状建造物。',
    notes: 'TODO: ピラミッド内部の詳細仕様は未確定。',
  },

  ffgg_node_13: {
    id: 'ffgg_node_13',
    name: 'railroad_dark',
    displayName: '線路（陰キャ）',
    indexLabel: '⑬',
    type: 'landmark',
    areaId: 'ffgg_snow',
    position: { x: 0.10, y: 0.52 },
    connections: ['ffgg_node_05'],
    tags: ['snow', 'landmark', '線路'],
    description: '雪山エリアにある線路地帯（通称: 陰キャ）。',
    notes: '「陰キャ」という通称の意味・背景は原文から不明。TODO: 詳細仕様未確定。',
  },

  ffgg_node_14: {
    id: 'ffgg_node_14',
    name: 'dragon_fever_venue',
    displayName: 'ドラゴンフィーバー会場',
    indexLabel: '⑭',
    type: 'fever',
    areaId: 'ffgg_special',
    position: { x: 0.21, y: 0.24 },
    connections: ['ffgg_node_01', 'ffgg_node_02'],
    tags: ['fever', 'dragon', 'ドラゴンフィーバー'],
    description: 'ドラゴンフィーバー専用の会場ノード。ドラゴンソールが30000まで溜まると発生するイベントの開催地。',
    eventHints: ['ドラゴンフィーバー（fever_dragon 参照・発生ロジック未実装）'],
    dangerLevel: 5,
    notes: 'フィーバー発生ロジックは未実装。FreeFieldFever: fever_dragon を参照。',
  },

  ffgg_node_15: {
    id: 'ffgg_node_15',
    name: 'ff_highland_beta_boss',
    displayName: 'FF高原（βテストボス）',
    indexLabel: '⑮',
    type: 'test',
    areaId: 'ffgg_special',
    position: { x: 0.44, y: 0.84 },
    connections: ['ffgg_node_04'],
    tags: ['boss', 'test', 'βテスト', 'FF高原'],
    description: 'FF高原に存在するβテストボスの地点。FFGGRへの接続が見込まれる地帯。',
    encounterHints: ['βテストボス（未実装）'],
    dangerLevel: 5,
    notes: 'FFGGR への接続地点に近い。TODO: βテストボスの詳細仕様は原文から追加確認が必要。',
  },
};

// ============================================================
// FFGG ワールド定義
// ============================================================
export const FFGG_WORLD: FreeFieldWorld = {
  id: 'ffgg',
  name: 'ffgg',
  displayName: 'FFGG',
  description: 'FF の中で現状最も難易度が高いエリア。広大なフィールドに森・平原・砂漠・雪山・サバンナ・海賊船などが広がる。',
  mapSizeHint: '1120×1120ブロック相当',
  mapAspect: 0.82,
  areaIds: [
    'ffgg_forest',
    'ffgg_plain',
    'ffgg_desert',
    'ffgg_snow',
    'ffgg_savanna',
    'ffgg_pirate',
    'ffgg_special',
  ],
  notes: 'FFGG の先には FFGGR が存在する。',
};

// ============================================================
// FF1 ワールド（スタブ）
// ============================================================
export const FF1_WORLD: FreeFieldWorld = {
  id: 'ff1',
  name: 'ff1',
  displayName: 'FF1',
  description: 'フリーフィールド1。(データ準備中)',
  areaIds: ['ff1_start'],
  notes: 'TODO: FF1 エリア・ノードを追加する。',
};

export const FF1_AREAS: Record<string, FreeFieldArea> = {
  ff1_start: {
    id: 'ff1_start',
    name: 'ff1_start',
    displayName: '開始エリア',
    nodeIds: ['ff1_node_entrance'],
    notes: 'TODO: FF1 ノードを追加する。',
  },
};

export const FF1_NODES: Record<string, FreeFieldNode> = {
  ff1_node_entrance: {
    id: 'ff1_node_entrance',
    name: 'ff1_entrance',
    displayName: 'FF1 入口',
    type: 'entrance',
    areaId: 'ff1_start',
    position: { x: 0.5, y: 0.5 },
    connections: [],
    notes: 'TODO: FF1 マップ実装時に差し替える。',
  },
};

// ============================================================
// FF2 ワールド（スタブ）
// ============================================================
export const FF2_WORLD: FreeFieldWorld = {
  id: 'ff2',
  name: 'ff2',
  displayName: 'FF2',
  description: 'フリーフィールド2。(データ準備中)',
  areaIds: ['ff2_start'],
  notes: 'TODO: FF2 エリア・ノードを追加する。FFGG ⑧ FF2エリアから遷移する想定。',
};

export const FF2_AREAS: Record<string, FreeFieldArea> = {
  ff2_start: {
    id: 'ff2_start',
    name: 'ff2_start',
    displayName: '開始エリア',
    nodeIds: ['ff2_node_entrance'],
    notes: 'TODO: FF2 ノードを追加する。',
  },
};

export const FF2_NODES: Record<string, FreeFieldNode> = {
  ff2_node_entrance: {
    id: 'ff2_node_entrance',
    name: 'ff2_entrance',
    displayName: 'FF2 入口',
    type: 'entrance',
    areaId: 'ff2_start',
    position: { x: 0.5, y: 0.5 },
    connections: [],
    notes: 'TODO: FF2 マップ実装時に差し替える。FFGG ⑧ から接続される想定。',
  },
};

// ============================================================
// FFGGR ワールド（スタブ）
// ============================================================
export const FFGGR_WORLD: FreeFieldWorld = {
  id: 'ffggr',
  name: 'ffggr',
  displayName: 'FFGGR',
  description: 'FFGG の先に存在するエリア。(未実装)',
  areaIds: ['ffggr_start'],
  notes: 'TODO: FFGGR エリア・ノードを追加する。FFGG ⑮ FF高原周辺からの遷移を想定。',
};

export const FFGGR_AREAS: Record<string, FreeFieldArea> = {
  ffggr_start: {
    id: 'ffggr_start',
    name: 'ffggr_start',
    displayName: '未実装エリア',
    nodeIds: ['ffggr_node_entrance'],
    notes: 'TODO: FFGGR マップ実装時に差し替える。',
  },
};

export const FFGGR_NODES: Record<string, FreeFieldNode> = {
  ffggr_node_entrance: {
    id: 'ffggr_node_entrance',
    name: 'ffggr_entrance',
    displayName: 'FFGGR 入口（未実装）',
    type: 'entrance',
    areaId: 'ffggr_start',
    position: { x: 0.5, y: 0.5 },
    connections: [],
    isHidden: true,
    notes: 'TODO: FFGGR マップ実装時に差し替える。',
  },
};

// ============================================================
// フィーバーデータ
// ============================================================
export const FFGG_FEVERS: Record<string, FreeFieldFever> = {

  fever_gold: {
    id: 'fever_gold',
    type: 'gold',
    displayName: 'ゴールドフィーバー',
    aliases: ['ゴールドボーナス', 'ゴールドフィーバー'],
    triggerText: '敵を倒した際に低確率で発生する。',
    activationConditionText: '敵撃破時の低確率抽選（確率未確定）',
    description: 'ゴールド獲得量が増加するフィーバー状態。',
    onEndDescription: '未確定。TODO: 終了時の挙動を原文から確認する。',
    relatedLootHints: ['ゴールド増加（詳細未確定）'],
    notes: 'TODO: 発生確率・継続時間・ゴールドボーナス倍率は原文から追加確認が必要。発生ロジックは未実装。',
  },

  fever_red: {
    id: 'fever_red',
    type: 'red',
    displayName: 'レッドフィーバー',
    aliases: ['レッドフィーバー'],
    triggerText: '敵を倒した際に低確率で発生する。',
    activationConditionText: '敵撃破時の低確率抽選（確率未確定）',
    description: 'レッドフィーバー状態。終了時に特殊な敵が出現する。',
    onEndDescription: 'レッドフィーバー終了時に魔装騎士長が出現する。',
    relatedBossHints: ['魔装騎士長（レッドフィーバー終了時・未実装）'],
    notes: 'TODO: 発生確率・継続時間・フィーバー中の効果は原文から追加確認が必要。発生ロジックは未実装。Codex エントリ: magic_knight_captain 参照。',
  },

  fever_dragon: {
    id: 'fever_dragon',
    type: 'dragon',
    displayName: 'ドラゴンフィーバー',
    aliases: ['ドラゴンフィーバー'],
    triggerText: 'ドラゴンソールが30000まで溜まると出現する。',
    activationConditionText: 'ドラゴンソール累積30000達成',
    description: 'ドラゴンフィーバー会場（⑭）で発生するイベントフィーバー。',
    onEndDescription: '未確定。TODO: 終了時の挙動を原文から確認する。',
    relatedBossHints: ['フィーバー中のボス出現（詳細未確定）'],
    notes: 'TODO: ドラゴンフィーバー中の敵・ドロップ・継続条件は原文から追加確認が必要。発生ロジックは未実装。ノード: ffgg_node_14 参照。',
  },
};

// ============================================================
// Codex エントリ（FF1/FF2 ボス・説明文の分離保持）
// 今フェーズは構造のみ。内容は原文準拠の範囲で記述する。
// ============================================================
export const FREEFIELD_CODEX: Record<string, FreeFieldCodexEntry> = {

  giant_comet: {
    id: 'giant_comet',
    title: '巨大彗星',
    section: 'ffgg',
    summary: '森地帯・大樹の上にスポーンするボス。',
    statsText: '未確定。TODO: 原文から数値を追加する。',
    dropsText: '未確定。TODO: 原文からドロップを追加する。',
    skillsText: '未確定。',
    strategyText: '未確定。',
    notes: 'ノード: ffgg_node_09 参照。',
  },

  omega_nightmare: {
    id: 'omega_nightmare',
    title: '暗黒騎士 オメガ・ナイト・メア',
    section: 'ff1',
    summary: 'FF1 に登場するボス。',
    statsText: '未確定。TODO: 原文から数値を追加する。',
    dropsText: '未確定。',
    skillsText: '未確定。',
    strategyText: '未確定。',
    notes: 'TODO: 原文の記載内容を追加する。',
  },

  sea_memoria: {
    id: 'sea_memoria',
    title: 'Sea Memoria',
    section: 'ff2',
    summary: 'FF2 に登場するボス。',
    statsText: '未確定。TODO: 原文から数値を追加する。',
    dropsText: '未確定。',
    skillsText: '未確定。',
    strategyText: '未確定。',
    notes: 'TODO: 原文の記載内容を追加する。',
  },

  eliminator: {
    id: 'eliminator',
    title: 'Eliminator',
    section: 'ff2',
    summary: 'FF2 に登場するボス。',
    statsText: '未確定。TODO: 原文から数値を追加する。',
    dropsText: '未確定。',
    skillsText: '未確定。',
    strategyText: '未確定。',
    notes: 'TODO: 原文の記載内容を追加する。',
  },

  slam_king: {
    id: 'slam_king',
    title: 'スラムイキング',
    section: 'ff1',
    summary: 'FF1 に登場するボス。',
    statsText: '未確定。TODO: 原文から数値を追加する。',
    dropsText: '未確定。',
    skillsText: '未確定。',
    strategyText: '未確定。',
    notes: 'TODO: 原文の記載内容を追加する。',
  },

  muscle_thief_leader: {
    id: 'muscle_thief_leader',
    title: '脳筋盗賊リーダー',
    section: 'ff1',
    summary: 'FF1 に登場するボス。',
    statsText: '未確定。TODO: 原文から数値を追加する。',
    dropsText: '未確定。',
    skillsText: '未確定。',
    strategyText: '未確定。',
    notes: 'TODO: 原文の記載内容を追加する。',
  },

  magic_knight_captain: {
    id: 'magic_knight_captain',
    title: '魔装騎士長',
    section: 'ffgg',
    summary: 'レッドフィーバー終了時に出現するボス。',
    statsText: '未確定。TODO: 原文から数値を追加する。',
    dropsText: '未確定。',
    skillsText: '未確定。',
    strategyText: '未確定。',
    notes: 'フィーバー: fever_red 参照。発生ロジックは未実装。',
  },

  giant_slayer: {
    id: 'giant_slayer',
    title: '屠る巨人',
    section: 'ffgg',
    summary: 'サバンナ地帯・GGの木(⑥)に出現するミニボス。',
    statsText: '未確定。TODO: 原文から数値を追加する。',
    dropsText: '未確定。壊世賜杖レクイエム・シュヴァリエプレッジなどのヒントあり（未実装）。',
    skillsText: '未確定。',
    strategyText: '未確定。',
    notes: 'ノード: ffgg_node_06 参照。',
  },
};

// ============================================================
// FFGG 素材ガイド（図鑑・入手導線・用途のまとめ）
// ============================================================

export type FFGGItemGuide = {
  itemId: string;
  name: string;
  category: 'scale' | 'plant' | 'gem' | 'combat' | 'special' | 'coin';
  obtainFrom: string[];   // 入手元の説明
  usedFor: string[];      // 主な用途
  areaHint: string;       // どのエリアで集めるか
  beginnerTip?: string;   // 初心者向けヒント
  upgradesTo?: string[];  // 上位素材への変換先
};

export const FFGG_ITEM_GUIDE: Record<string, FFGGItemGuide> = {
  // ── 鱗系 ──
  green_scale: {
    itemId: 'green_scale', name: '緑鱗', category: 'scale',
    obtainFrom: ['森地帯②グリド/グリド・アルファ/フォレストリッパードロップ'],
    usedFor: ['緑竜刃（クラフト）', '鱗系上位装備素材'],
    areaHint: '森地帯②が主な入手場所。グリドを倒しながら周回するのが効率的。',
    beginnerTip: 'グリドは群れで来るので範囲攻撃があると集めやすい。',
    upgradesTo: ['green_scale_high（上位敵/フィーバー）'],
  },
  red_scale: {
    itemId: 'red_scale', name: '赤鱗', category: 'scale',
    obtainFrom: ['平原地帯③のドラグ/ドラグ強ドロップ'],
    usedFor: ['赤竜刃（クラフト）', '攻撃系装備素材'],
    areaHint: '平原地帯③が主な入手場所。比較的安全で周回しやすい。',
    beginnerTip: 'FFGGの入門エリア。赤鱗を集めながら慣れよう。',
    upgradesTo: ['red_scale_high（上位敵/ドラゴンフィーバー）'],
  },
  rock_scale: {
    itemId: 'rock_scale', name: '岩鱗', category: 'scale',
    obtainFrom: ['砂漠地帯④ガドラ/ガドラ改/エガルドドロップ', '砂漠採取ノード（ffgg_desert_gather）'],
    usedFor: ['岩鱗の鎧（クラフト）', '防御系装備素材'],
    areaHint: '砂漠地帯④。ガドラ系を倒しながら集める。採取でも入手可能。',
    beginnerTip: '砂漠は広いので迷いやすい。まず④の中心部を目指そう。',
    upgradesTo: ['rock_scale_high（エガルドンボス）'],
  },
  water_scale: {
    itemId: 'water_scale', name: '水鱗', category: 'scale',
    obtainFrom: ['雪山⑤アドーラ/アドーラ改ドロップ', '雪山採取ノード（ffgg_snow_gather）'],
    usedFor: ['水系装備素材', '杖系クラフト素材'],
    areaHint: '雪山⑤が主な入手場所。アドーラ系を倒しながら周回。',
    beginnerTip: '連続攻撃が特徴のアドーラに注意。回復アイテムを多めに持とう。',
    upgradesTo: ['water_scale_high（波狼/Sea Memoriaボス）'],
  },
  // ── 宝石・鉱石 ──
  aurora_spinel: {
    itemId: 'aurora_spinel', name: 'オーロラスピネル', category: 'gem',
    obtainFrom: ['洞窟系採取ノード（ffgg_cave_gem_vein）', '洞窟系ボスドロップ'],
    usedFor: ['岩窟の杖クラフト', '上位魔装素材'],
    areaHint: '洞窟系ダンジョン深部の採取ノード。採掘Lv50以上推奨。',
    beginnerTip: '洞窟系は難度が高い。岩窟の杖を目指すなら最低20個は集めよう。',
    upgradesTo: [],
  },
  cosmonium: {
    itemId: 'cosmonium', name: 'コスモニウム', category: 'gem',
    obtainFrom: ['森地帯②採取（ffgg_forest_herb）極低確率', 'フォレストリッパードロップ（低確率）'],
    usedFor: ['最終強化素材（TODO: レシピ確定後に追加）'],
    areaHint: '森地帯②の採取ノードで稀に入手。フォレストリッパーも落とす。',
    beginnerTip: 'とにかく希少。見かけたら逃さずに拾うこと。',
    upgradesTo: [],
  },
  antique_coin: {
    itemId: 'antique_coin', name: 'アンティークコイン', category: 'coin',
    obtainFrom: ['海賊船⑩脳筋盗賊リーダーボスドロップ', 'パイレーツ系低確率', '砂漠④一部敵'],
    usedFor: ['売却（2000G）', '交換素材（TODO）'],
    areaHint: '海賊船⑩が最も効率的。ボスを繰り返し討伐しよう。',
    beginnerTip: '売却価値が高い。序盤の資金稼ぎにも使える。',
    upgradesTo: [],
  },
  // ── 植物 ──
  white_basil: {
    itemId: 'white_basil', name: 'ホワイトバジル', category: 'plant',
    obtainFrom: ['森地帯②採取ノード（ffgg_forest_herb）'],
    usedFor: ['バジルエリクサー（クラフト）', 'スラムイ特殊ポーション（クラフト）', '上位ポーション素材'],
    areaHint: '森地帯②の採取ノードで安定入手。採掘Lv20以上推奨。',
    beginnerTip: '採取ノードは敵の出る危険エリア内にある。戦力を整えてから向かおう。',
    upgradesTo: [],
  },
  // ── 戦闘ドロップ系 ──
  ocean_orb: {
    itemId: 'ocean_orb', name: '海原のオーブ', category: 'combat',
    obtainFrom: ['Sea Memoria（雪山⑤ボス）30%', '雪山⑤アドーラ改（低確率）'],
    usedFor: ['海原の杖クラフト', '海系最上位装備'],
    areaHint: '雪山⑤のボス Sea Memoria が主なドロップ源。水鱗も同時に集まる。',
    beginnerTip: '反撃型ボスなので攻撃しすぎに注意。遠距離から少しずつ削ろう。',
    upgradesTo: [],
  },
  slamy_liquid: {
    itemId: 'slamy_liquid', name: 'スラムイ溶液', category: 'combat',
    obtainFrom: ['森地帯②ソールドロップ（8%）', 'スラムイキング（サバンナ）50%'],
    usedFor: ['スラムイ特殊ポーション（クラフト）', '特殊武器素材'],
    areaHint: 'サバンナのスラムイキングが最効率。ソールドロップからも少量入手可能。',
    beginnerTip: 'サバンナは高難度エリア。まずは森地帯でソールドロップから集めよう。',
    upgradesTo: [],
  },
  // ── コイン系 ──
  ff_coin_small: {
    itemId: 'ff_coin_small', name: 'FF小判', category: 'coin',
    obtainFrom: ['FFGG全エリア敵ドロップ', '森地帯②採取ノード', 'GGR釣り場'],
    usedFor: ['FF大判（9枚→1枚クラフト）に変換して売却（500,000G）'],
    areaHint: 'FFGG全体で入手できる。海賊船⑩のボス討伐が最多ドロップ。',
    beginnerTip: '9枚集めてFF大判に変換すると一気に高値になる。まず9枚を目標に。',
    upgradesTo: ['ff_coin_large（クラフト変換）'],
  },
  carib_rough_wave: {
    itemId: 'carib_rough_wave', name: 'カリブの荒波', category: 'special',
    obtainFrom: ['海賊船⑩脳筋盗賊リーダーボスドロップ（20%）', 'フィーバー時ドロップ率上昇'],
    usedFor: ['海賊系最上位装備素材（TODO: レシピ確定後追加）'],
    areaHint: '海賊船⑩専用。ボスを繰り返し倒すのが基本。フィーバー中は確率上昇。',
    beginnerTip: 'フィーバーが発生したら積極的に参加しよう。',
    upgradesTo: [],
  },
};

// ============================================================
// ============================================================

/** 全ワールド一覧（表示順） */
export const FREE_FIELD_WORLDS: FreeFieldWorld[] = [
  FFGG_WORLD,
  FF1_WORLD,
  FF2_WORLD,
  FFGGR_WORLD,
];

/** エリアの全テーブル（worldId は現時点で混在しているため、areaId で一意に引く） */
export const FREE_FIELD_AREAS_ALL: Record<string, FreeFieldArea> = {
  ...FFGG_AREAS,
  ...FF1_AREAS,
  ...FF2_AREAS,
  ...FFGGR_AREAS,
};

/** ノードの全テーブル */
export const FREE_FIELD_NODES_ALL: Record<string, FreeFieldNode> = {
  ...FFGG_NODES,
  ...FF1_NODES,
  ...FF2_NODES,
  ...FFGGR_NODES,
};

/** ヘルパー: ワールドIDからエリア一覧を取得 */
export const getAreasByWorld = (worldId: string): FreeFieldArea[] => {
  const world = FREE_FIELD_WORLDS.find(w => w.id === worldId);
  if (!world) return [];
  return world.areaIds.map(id => FREE_FIELD_AREAS_ALL[id]).filter(Boolean);
};

/** ヘルパー: エリアIDからノード一覧を取得 */
export const getNodesByArea = (areaId: string): FreeFieldNode[] => {
  const area = FREE_FIELD_AREAS_ALL[areaId];
  if (!area) return [];
  return area.nodeIds.map(id => FREE_FIELD_NODES_ALL[id]).filter(Boolean);
};

/** ヘルパー: ワールドIDから全ノードを取得 */
export const getNodesByWorld = (worldId: string): FreeFieldNode[] => {
  return getAreasByWorld(worldId).flatMap(a => getNodesByArea(a.id));
};

/** ヘルパー: ワールドオブジェクトを取得 */
export const getFreeFieldWorld = (id: string): FreeFieldWorld | undefined =>
  FREE_FIELD_WORLDS.find(w => w.id === id);
