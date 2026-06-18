// src/data/freefieldData.ts
// フリーフィールド マスターデータ
// ノードにアクションを追加済み

import type {
  FreeFieldWorld,
  FreeFieldArea,
  FreeFieldNode,
  FreeFieldFever,
  FreeFieldCodexEntry,
  FreeFieldHarvestNode,
} from '../types/freefield';

// ============================================================
// FFGG 専用採集ノード（FF採集タブ専用・GatheringScreenに混ぜない）
// ============================================================
export const FFGG_HARVEST_NODES: Record<string, FreeFieldHarvestNode> = {

  ffgg_forest_herb: {
    id: 'ffgg_forest_herb',
    displayName: '森地帯・薬草採取場',
    areaId: 'ffgg_forest',
    cooldownSeconds: 120,
    dangerLevel: 3,
    items: [
      { itemId: 'white_basil',   displayName: 'ホワイトバジル',   baseRate: 0.70, minAmount: 1, maxAmount: 3 },
      { itemId: 'green_gem_ore', displayName: '緑輝石',           baseRate: 0.30, minAmount: 1, maxAmount: 2 },
      { itemId: 'ff_coin_small', displayName: 'FF小判',           baseRate: 0.20, minAmount: 1, maxAmount: 2 },
      { itemId: 'cosmonium',     displayName: 'コスモニウム',     baseRate: 0.02, minAmount: 1, maxAmount: 1, isRare: true },
    ],
  },

  ffgg_desert_gather: {
    id: 'ffgg_desert_gather',
    displayName: '砂漠・採集場',
    areaId: 'ffgg_desert',
    cooldownSeconds: 180,
    dangerLevel: 4,
    items: [
      { itemId: 'hot_sand_amber', displayName: '熱砂の琥珀',     baseRate: 0.06, minAmount: 1, maxAmount: 1, isRare: true },
      { itemId: 'nitrotrin',      displayName: 'ニトロトリン',   baseRate: 0.40, minAmount: 1, maxAmount: 2 },
      { itemId: 'matelakaite',    displayName: 'マテラカイト',   baseRate: 0.35, minAmount: 1, maxAmount: 2 },
      { itemId: 'ff_coin_large',  displayName: 'FF大判',         baseRate: 0.05, minAmount: 1, maxAmount: 1, isRare: true },
    ],
  },

  ffgg_snow_gather: {
    id: 'ffgg_snow_gather',
    displayName: '雪山・採集場',
    areaId: 'ffgg_snow',
    cooldownSeconds: 150,
    dangerLevel: 3,
    items: [
      { itemId: 'ocean_shard',   displayName: '海原の欠片',     baseRate: 0.50, minAmount: 1, maxAmount: 2 },
      { itemId: 'ice_crystal',   displayName: '氷晶',           baseRate: 0.40, minAmount: 1, maxAmount: 3 },
      { itemId: 'snow_herb',     displayName: '雪山草',         baseRate: 0.60, minAmount: 1, maxAmount: 2 },
    ],
  },

  ffgg_pyramid_hidden: {
    id: 'ffgg_pyramid_hidden',
    displayName: 'ピラミッド内部・隠し採集',
    areaId: 'ffgg_desert',
    cooldownSeconds: 300,
    dangerLevel: 5,
    items: [
      { itemId: 'hot_sand_amber', displayName: '熱砂の琥珀',   baseRate: 0.12, minAmount: 1, maxAmount: 2, isRare: true },
      { itemId: 'antique_coin',   displayName: 'アンティークコイン', baseRate: 0.25, minAmount: 1, maxAmount: 2 },
      { itemId: 'ff_coin_large',  displayName: 'FF大判',       baseRate: 0.08, minAmount: 1, maxAmount: 1, isRare: true },
    ],
  },
};

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
    notes: '固有モブあり。緑鱗・ソール系・アンティークコイン・コスモニウム・FF小判/大判 が重要ドロップ候補。',
    nodeIds: ['ffgg_node_02', 'ffgg_node_09'],
  },

  ffgg_plain: {
    id: 'ffgg_plain',
    name: 'plain',
    displayName: '平原地帯',
    description: '特段のオブジェクトや地形が少ない。戦闘は比較的シンプル。',
    tags: ['plain', '赤竜'],
    notes: '赤鱗が重要ドロップ候補。safe と danger の中間として扱う想定。',
    nodeIds: ['ffgg_node_03'],
  },

  ffgg_desert: {
    id: 'ffgg_desert',
    name: 'desert',
    displayName: '砂漠地帯',
    description: '一面砂だらけ。FFGG の中でおそらく最も広い。骨や砂岩の建物がある。',
    tags: ['desert', '岩竜'],
    notes: '岩鱗・枯れた心・アンティークコイン・FF大判・熱砂の琥珀 が重要ドロップ候補。',
    nodeIds: ['ffgg_node_04', 'ffgg_node_11', 'ffgg_node_12'],
  },

  ffgg_snow: {
    id: 'ffgg_snow',
    name: 'snow',
    displayName: '雪山 / 水竜周辺',
    description: '雪が多く高低差が激しい。取れる君の強化場所や隠しSHOPがある。',
    tags: ['snow', '水竜', '雪山', '隠しSHOP'],
    notes: '水鱗・狼牙魔結晶・波狼 が重要ドロップ候補。',
    nodeIds: ['ffgg_node_05', 'ffgg_node_13'],
  },

  ffgg_savanna: {
    id: 'ffgg_savanna',
    name: 'savanna',
    displayName: 'サバンナ地帯',
    description: 'GGに出る敵がほぼ出てくるエリア。ミニボスが2種類存在する。',
    tags: ['savanna', 'ミニボス'],
    notes: '各鱗系・各ドロップ・FF大判・壊世賜杖レクイエム・シュヴァリエプレッジ が重要ドロップ候補。',
    nodeIds: ['ffgg_node_06', 'ffgg_node_07'],
  },

  ffgg_pirate: {
    id: 'ffgg_pirate',
    name: 'pirate',
    displayName: '海賊船',
    description: '海賊が湧くエリア。高火力の大砲がある。',
    tags: ['pirate', '海賊', '大砲'],
    notes: 'パイレーツ系・パイレーツキャプテン が出現。アンティークコイン・カリブの荒波 が重要ドロップ候補。',
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
// FFGG ノード定義（①〜⑮）— 各ノードにactions追加
// ============================================================
export const FFGG_NODES: Record<string, FreeFieldNode> = {

  // ──────────────────────────────────────────────
  // ① ショートカット入口＆釣り堀＆テスター（安全地帯）
  // ──────────────────────────────────────────────
  ffgg_node_01: {
    id: 'ffgg_node_01',
    name: 'shortcut_entrance',
    displayName: 'FFGGショートカット入口＆釣り堀＆テスター',
    indexLabel: '①',
    type: 'shortcut',
    areaId: 'ffgg_special',
    position: { x: 0.26, y: 0.20 },
    connections: ['ffgg_node_02', 'ffgg_node_06', 'ffgg_node_14'],
    tags: ['shortcut', 'fishing', 'test', 'entrance', 'safe'],
    description: 'FFGGへのショートカット入口。釣り堀とテスターを兼ねる複合地点。モブスポーンなしの安全地帯。',
    isSafeZone: true,
    notes: '釣り堀とテスターのみ。戦闘トリガーなし。',
    actions: [
      {
        type: 'fishing',
        label: '釣り堀で釣る',
        description: 'FFGG専用の釣り堀。珍しい魚が釣れることも。',
        cooldownSeconds: 0,
        rewardHints: [
          { description: 'FFGG固有の魚', dropRate: '要調査' },
        ],
      },
      {
        type: 'test',
        label: '武器テスター',
        description: '装備中の武器・防具の性能を試せる。ダメージ計算の確認に。',
        cooldownSeconds: 0,
      },
      {
        type: 'warp',
        label: '② 森地帯へ移動',
        description: '森地帯（緑竜の狩場）へ向かう。',
        targetNodeId: 'ffgg_node_02',
        triggerMode: 'manual',
      },
      {
        type: 'warp',
        label: '⑥ GGの木（屠る巨人）へ移動',
        description: 'サバンナ地帯のミニボスエリアへ向かう。',
        targetNodeId: 'ffgg_node_06',
        triggerMode: 'manual',
      },
      {
        type: 'landmark',
        label: 'ショートカット入口を確認',
        description: 'FFGG全体へのハブ地点。ここから各エリアへ移動できる。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ② 森地帯（緑竜の狩場）
  // ──────────────────────────────────────────────
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
    resourceHints: ['ホワイトバジル採取', '緑鱗・コスモニウム ドロップ', 'FF小判ドロップ'],
    encounterHints: ['グリド・グリド・アルファ→緑鱗', 'フォレストリッパー（低確率）', 'ソールドロップ→スラムイ溶液', '巨大彗星（大樹の上）'],
    gatherNodeIds: ['ffgg_forest_herb'],
    dangerLevel: 3,
    notes: '大樹ノード(⑨)はこのエリアに属するランドマーク。',
    actions: [
      {
        type: 'battleTrigger',
        label: '⚔️ 戦う（グリド系を呼び出す）',
        description: 'グリドの群れが戦闘トリガーとして現れる。撃破後にグリド系・ソールドロップ系・パイレーツ系が3〜10体出現する。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_forest',
        rewardHints: [
          { description: '緑鱗（下位）', dropRate: '40%' },
          { description: '緑鱗（上位）', dropRate: '5%' },
          { description: 'コスモニウム（フォレストリッパー）', dropRate: '低確率' },
          { description: 'ソール系各種', dropRate: 'Sサイズ40% / Lサイズ10%' },
          { description: 'アンティークコイン', dropRate: 'パイレーツ系から' },
          { description: 'FF小判', dropRate: '全敵共通' },
        ],
      },
      {
        type: 'harvest',
        label: '🌿 薬草採取（ホワイトバジル）',
        description: 'ホワイトバジル・緑輝石などを採集。危険度高め。専用採集ツールが必要。',
        harvestDanger: 3,
        combatDuringHarvest: true,
        cooldownSeconds: 120,
        systemTargetId: 'ffgg_forest_herb',
        rewardHints: [
          { description: 'ホワイトバジル', dropRate: '70%' },
          { description: '緑輝石', dropRate: '30%' },
          { description: 'コスモニウム', dropRate: '2%', },
          { description: 'FF小判', dropRate: '20%' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 森地帯を調べる',
        description: '森地帯の情報を確認。大樹（⑨）への道を探る。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ③ 平原地帯（赤竜の狩場）
  // ──────────────────────────────────────────────
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
    description: '特段のオブジェクトや地形が少ない平原。赤竜の狩場。脳死で戦える。',
    resourceHints: ['赤鱗（下位・上位）敵ドロップ'],
    encounterHints: ['ドラグ・ドラグ強→赤鱗', 'ドラゴンフィーバー連動'],
    dangerLevel: 2,
    notes: '原文に「脳死で戦える」との記載あり。safe と danger の中間的な扱いを想定。',
    actions: [
      {
        type: 'battleTrigger',
        label: '⚔️ 戦う（ドラグを呼び出す）',
        description: 'ドラグが戦闘トリガーとして現れる。撃破後にドラグ系が3〜8体出現する。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_plain',
        rewardHints: [
          { description: '赤鱗（下位）', dropRate: '40%' },
          { description: '赤鱗（上位）', dropRate: '5%' },
          { description: 'FF小判', dropRate: '全敵共通' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 平原を見渡す',
        description: 'どこまでも続く平原。戦闘に集中しやすい環境。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ④ 砂漠地帯（岩竜の狩場）
  // ──────────────────────────────────────────────
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
    resourceHints: ['岩鱗 ガドラ/エガルド系', '熱砂の琥珀 採取6%', 'ニトロトリン 採取', '枯れた心 エガルドン3%'],
    encounterHints: ['ガドラ→岩鱗', 'エガルド（5%確率でガドラから覚醒）', 'エガルドン（300ポイントで出現）'],
    gatherNodeIds: ['ffgg_desert_gather'],
    dangerLevel: 3,
    notes: 'FFGG 内で最も広いエリアとされる。エガルドンはエガルド撃破300ポイントで出現。',
    actions: [
      {
        type: 'battleTrigger',
        label: '⚔️ 戦う（ガドラを呼び出す）',
        description: 'ガドラが戦闘トリガーとして現れる。撃破後にガドラ系・エガルドが3〜8体出現。エガルドからは低確率でエガルドンが覚醒する。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_desert',
        rewardHints: [
          { description: '岩鱗（下位）', dropRate: '40%' },
          { description: '岩鱗（上位）', dropRate: '5%' },
          { description: '枯れた心', dropRate: 'エガルドン3%' },
          { description: 'アンティークコイン', dropRate: 'パイレーツ系から' },
          { description: 'FF大判', dropRate: '低確率' },
        ],
      },
      {
        type: 'harvest',
        label: '🌿 砂漠採集（熱砂の琥珀など）',
        description: '砂漠特有の素材を採集。危険度が高い。熱砂の琥珀は6%の確率で入手。',
        harvestDanger: 4,
        combatDuringHarvest: true,
        cooldownSeconds: 180,
        systemTargetId: 'ffgg_desert_gather',
        rewardHints: [
          { description: '熱砂の琥珀', dropRate: '6%' },
          { description: 'ニトロトリン', dropRate: '40%' },
          { description: 'マテラカイト', dropRate: '35%' },
          { description: 'FF大判', dropRate: '5%' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 砂漠を見渡す',
        description: '広大な砂漠地帯。⑪骨 と ⑫ピラミッド が見える。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑤ 家っぽいとこ（水竜の狩場）
  // ──────────────────────────────────────────────
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
    encounterHints: ['アドーラ/アドーラ改→水鱗', '牙狼→狼牙魔結晶', '波狼（牙狼5%覚醒）'],
    resourceHints: ['水鱗 アドーラ系', '狼牙魔結晶 牙狼/波狼', '海原の欠片 採取'],
    gatherNodeIds: ['ffgg_snow_gather'],
    dangerLevel: 3,
    notes: '原文内で「雪山」と「家っぽいとこ」の表記ゆれあり。',
    actions: [
      {
        type: 'battleTrigger',
        label: '⚔️ 戦う（アドーラを呼び出す）',
        description: 'アドーラが戦闘トリガーとして現れる。撃破後にアドーラ系・牙狼が3〜8体出現。牙狼を倒すと5%で波狼が覚醒する。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_snow',
        rewardHints: [
          { description: '水鱗（下位）', dropRate: '40%' },
          { description: '水鱗（上位）', dropRate: '5%' },
          { description: '狼牙魔結晶', dropRate: '牙狼60%' },
          { description: '波浪（波狼ドロップ）', dropRate: '波狼から' },
        ],
      },
      {
        type: 'harvest',
        label: '🌿 雪山採集',
        description: '雪山特有の素材を採集。',
        harvestDanger: 3,
        cooldownSeconds: 150,
        systemTargetId: 'ffgg_snow_gather',
        rewardHints: [
          { description: '海原の欠片', dropRate: '50%' },
          { description: '氷晶', dropRate: '40%' },
          { description: '雪山草', dropRate: '60%' },
        ],
      },
      {
        type: 'warp',
        label: '⑬ 線路（陰キャ）へのショートカット',
        description: '⑬線路（陰キャ）への近道。',
        targetNodeId: 'ffgg_node_13',
        hidden: true,
      },
      {
        type: 'shop',
        label: '🛒 隠しSHOP（雪山）',
        description: '雪山エリアに隠れたショップ。',
        hidden: true,
        // TODO: 隠しSHOPの商品ラインナップ・開放条件は仕様確定後に追加
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑥ GGの木（屠る巨人）
  // ──────────────────────────────────────────────
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
    description: 'サバンナ地帯の大木。ミニボス「屠る巨人」の出現地点。全種のドラゴン系・ソール系がランダム出現する。',
    encounterHints: ['屠る巨人（中ボス）', 'ドラゴン系4色全種', 'ソール系全種'],
    dangerLevel: 4,
    notes: 'サバンナ地帯はドラゴン全種がランダムスポーン。シュヴァリエプレッジは屠る巨人から2%。',
    actions: [
      {
        type: 'battleTrigger',
        label: '⚔️ 戦う（屠る巨人を探す）',
        description: 'サバンナの敵が戦闘トリガーとして現れる。撃破後にドラゴン系4色全種・ソール系全種が3〜10体ランダム出現する。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_savanna',
        rewardHints: [
          { description: '各鱗系', dropRate: '敵種別による' },
          { description: 'FF大判', dropRate: '低確率' },
          { description: 'シュヴァリエプレッジ（武器）', dropRate: '屠る巨人2%' },
          { description: 'ソール系各種', dropRate: '多数' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 大木を調べる',
        description: 'サバンナ地帯のシンボルとなる大木。屠る巨人がここに出没する。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑦ マハドリュアス
  // ──────────────────────────────────────────────
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
    description: 'サバンナ地帯のミニボス「マハドリュアス」の出現地点。ドラゴン系全種がランダムスポーンする。',
    encounterHints: ['マハドリュアス（中ボス）', 'ドラゴン系4色全種', 'ユーアイド系'],
    dangerLevel: 4,
    notes: 'TODO: マハドリュアスの詳細仕様は原文から追加確認が必要。',
    actions: [
      {
        type: 'battleTrigger',
        label: '⚔️ 戦う（マハドリュアスを探す）',
        description: 'サバンナの敵が戦闘トリガーとして現れる。撃破後にドラゴン系・ユーアイド系が3〜10体出現する。マハドリュアスも出現することがある。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_savanna_maha',
        rewardHints: [
          { description: '壊世賜杖レクイエム（武器）', dropRate: 'マハドリュアス2%' },
          { description: '各鱗系', dropRate: '敵種別による' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 マハドリュアスの地を調べる',
        description: 'サバンナ深部。マハドリュアスが支配する地点。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑧ FF2エリア（遷移）
  // ──────────────────────────────────────────────
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
    resourceHints: ['スラムイ溶液', '海原のオーブ', '銀の弾丸', '光輝トラス'],
    eventHints: ['FF2ワールドへの遷移（遷移実装未定）'],
    notes: 'TODO: World 間遷移の実装方針が決まったら接続を更新する。',
    actions: [
      {
        type: 'warp',
        label: '🌀 FF2エリアへ遷移',
        description: 'FF2ワールドへの遷移。（TODO: ワールド間遷移は未実装）',
        targetWorldId: 'ff2',
      },
      {
        type: 'landmark',
        label: '📍 遷移ポイントを調べる',
        description: 'FF2への入口。強力な素材が入手できる。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑨ 大樹（巨大彗星）
  // ──────────────────────────────────────────────
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
    description: '森地帯にそびえる大樹。頂上に巨大彗星がスポーンする。コスモニウムを大量に落とす。',
    encounterHints: ['巨大彗星（ボス）→コスモニウム150%・コスモニウムオーブ5%'],
    dangerLevel: 5,
    notes: '巨大彗星は森地帯エリアのランドマーク扱い。コスモニウムは複数個出ることがある。',
    actions: [
      {
        type: 'battleTrigger',
        label: '⚔️ 大樹の頂上へ（巨大彗星を呼ぶ）',
        description: '大樹の頂上で巨大彗星が出現する。コスモニウムが高確率でドロップ（150%=複数個確率あり）。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_forest',
        rewardHints: [
          { description: 'コスモニウム', dropRate: '150%（複数個の可能性）' },
          { description: 'コスモニウムオーブ', dropRate: '5%' },
        ],
      },
      {
        type: 'harvest',
        label: '🌿 大樹の根元で採取',
        description: '大樹の根元にはホワイトバジルが育つ。',
        harvestDanger: 4,
        cooldownSeconds: 300,
        systemTargetId: 'ffgg_forest_herb',
        rewardHints: [
          { description: 'ホワイトバジル', dropRate: '70%' },
          { description: 'コスモニウム', dropRate: '2%' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 大樹を調べる',
        description: '森地帯のシンボルとなる大樹。頂上には巨大彗星が宿る。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑩ 海賊船
  // ──────────────────────────────────────────────
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
    description: '海賊が湧く海賊船。高火力の大砲がある。防具が整っていれば理不尽ではない。',
    encounterHints: ['パイレーツ系→アンティークコイン', 'パイレーツキャプテン（ボス）→カリブの荒波'],
    resourceHints: ['アンティークコイン', 'カリブの荒波', 'FF大判'],
    dangerLevel: 3,
    actions: [
      {
        type: 'battleTrigger',
        label: '⚔️ 戦う（パイレーツキャプテンを呼ぶ）',
        description: 'パイレーツキャプテンが戦闘トリガーとして現れる。撃破後にパイレーツ系が3〜8体出現する。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_pirate',
        rewardHints: [
          { description: 'アンティークコイン', dropRate: '全パイレーツ系から' },
          { description: 'カリブの荒波', dropRate: 'ボス20%' },
          { description: 'FF大判', dropRate: '低確率' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 海賊船を調べる',
        description: '大きな海賊船。至るところにパイレーツが待ち構えている。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑪ 骨
  // ──────────────────────────────────────────────
  ffgg_node_11: {
    id: 'ffgg_node_11',
    name: 'bone',
    displayName: '骨',
    indexLabel: '⑪',
    type: 'landmark',
    areaId: 'ffgg_desert',
    position: { x: 0.38, y: 0.48 },
    connections: ['ffgg_node_10', 'ffgg_node_04'],
    tags: ['desert', 'landmark', '骨', 'hidden'],
    description: '砂漠地帯に存在する骨のランドマーク。隠し素材が埋まっているかもしれない。',
    notes: 'TODO: 骨の具体的な役割・仕様は未確定。隠し採集として扱う。',
    actions: [
      {
        type: 'harvest',
        label: '🦴 骨の周囲を掘る（隠し採集）',
        description: '骨の周囲を掘ると砂漠の素材が出てくることがある。',
        harvestDanger: 3,
        cooldownSeconds: 240,
        systemTargetId: 'ffgg_desert_gather',
        hidden: false,
        rewardHints: [
          { description: 'アンティークコイン', dropRate: '25%' },
          { description: '熱砂の琥珀', dropRate: '隠し採集6%' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 骨を調べる',
        description: '砂漠の真ん中に佇む謎の骨の構造物。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑫ ピラミッド
  // ──────────────────────────────────────────────
  ffgg_node_12: {
    id: 'ffgg_node_12',
    name: 'pyramid',
    displayName: 'ピラミッド',
    indexLabel: '⑫',
    type: 'landmark',
    areaId: 'ffgg_desert',
    position: { x: 0.88, y: 0.68 },
    connections: ['ffgg_node_04'],
    tags: ['desert', 'landmark', 'ピラミッド', '砂岩', 'hidden'],
    description: '砂漠地帯にある砂岩のピラミッド状建造物。内部には隠し採集スポットがある。',
    notes: 'TODO: ピラミッド内部の詳細仕様は未確定。戦闘が発生するかは不明。',
    actions: [
      {
        type: 'battleTrigger',
        label: '⚔️ ピラミッド内部を探索する',
        description: 'ピラミッド内部でガドラ系・エガルドが出現する。危険度高め。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_desert',
        hidden: false,
        rewardHints: [
          { description: '岩鱗（上位）', dropRate: '5%' },
          { description: '枯れた心', dropRate: 'エガルドン3%' },
        ],
      },
      {
        type: 'harvest',
        label: '🏺 ピラミッド内部を探索（隠し採集）',
        description: 'ピラミッド内部の隠し採集スポット。貴重なアイテムが入手できる。',
        harvestDanger: 5,
        cooldownSeconds: 300,
        systemTargetId: 'ffgg_pyramid_hidden',
        hidden: false,
        rewardHints: [
          { description: '熱砂の琥珀', dropRate: '12%' },
          { description: 'アンティークコイン', dropRate: '25%' },
          { description: 'FF大判', dropRate: '8%' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 ピラミッドを調べる',
        description: '砂漠に佇む古代のピラミッド。内部には宝が眠るという。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑬ 線路（陰キャ）
  // ──────────────────────────────────────────────
  ffgg_node_13: {
    id: 'ffgg_node_13',
    name: 'railroad_dark',
    displayName: '線路（陰キャ）',
    indexLabel: '⑬',
    type: 'landmark',
    areaId: 'ffgg_snow',
    position: { x: 0.10, y: 0.52 },
    connections: ['ffgg_node_05'],
    tags: ['snow', 'landmark', '線路', 'shortcut', 'hidden'],
    description: '雪山エリアにある線路地帯（通称: 陰キャ）。各エリアへのショートカットになっている。',
    notes: '「陰キャ」という通称の意味・背景は原文から不明。TODO: 詳細仕様未確定。',
    isSafeZone: true,
    actions: [
      {
        type: 'warp',
        label: '🌀 ⑤ 家っぽいとこ（水竜）へ',
        description: '⑤水竜の狩場へのショートカット。',
        targetNodeId: 'ffgg_node_05',
      },
      {
        type: 'warp',
        label: '🌀 別エリアへのショートカット（隠し）',
        description: '線路を使って離れたエリアに移動できる。（TODO: 詳細仕様未確定）',
        hidden: true,
        // TODO: ショートカット先は仕様確定後に追加
      },
      {
        type: 'landmark',
        label: '📍 線路を調べる',
        description: '雪山に通る謎の線路。どこかへ続いているようだ。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑭ ドラゴンフィーバー会場
  // ──────────────────────────────────────────────
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
    eventHints: ['ドラゴンフィーバー（ドラゴンソール30000で発動）'],
    dangerLevel: 5,
    notes: 'フィーバー発生ロジックは現状は状態表示のみ。FreeFieldFever: fever_dragon を参照。',
    actions: [
      {
        type: 'fever',
        label: '🔥 ドラゴンフィーバーを確認',
        description: 'ドラゴンソールが30000まで溜まるとドラゴンフィーバーが発動する。現在のフィーバー状態を確認。',
        feverType: 'dragon',
        feverConditionText: 'ドラゴンソール 30000 到達で発動',
      },
      {
        type: 'battleTrigger',
        label: '⚔️ フィーバー会場で戦う',
        description: 'フィーバー会場で敵を倒し、ドラゴンソールを蓄積させる。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_savanna',
        rewardHints: [
          { description: 'ドラゴンソール（フィーバーゲージ用）', dropRate: '敵撃破で加算' },
          { description: '各鱗系', dropRate: '敵種別による' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 フィーバー会場を調べる',
        description: 'ドラゴンフィーバーの開催地。フィーバー中はレアアイテムのドロップ率が上昇する。',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // ⑮ FF高原（βテストボス）
  // ──────────────────────────────────────────────
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
    encounterHints: ['βテストボス（TODO: 仕様確定待ち）'],
    dangerLevel: 5,
    notes: 'FFGGR への接続地点に近い。TODO: βテストボスの詳細仕様は原文から追加確認が必要。',
    actions: [
      {
        type: 'test',
        label: '🔬 βテストボスに挑む',
        description: 'βテストボスとの戦闘。仕様確定前の試験的な実装。',
        cooldownSeconds: 0,
      },
      {
        type: 'battleTrigger',
        label: '⚔️ 高原の敵と戦う',
        description: '砂漠地帯の強敵が高原に出現している。βテストボスへの前哨戦。',
        triggerMode: 'manual',
        encounterProfileId: 'ffgg_desert',
        rewardHints: [
          { description: '岩鱗（上位）', dropRate: '5%' },
          { description: '枯れた心', dropRate: 'エガルドン3%' },
        ],
      },
      {
        type: 'landmark',
        label: '📍 高原を調べる',
        description: 'FF高原。FFGGR への入口に近い秘境。βテストボスが待ち構える。',
      },
    ],
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
    notes: 'TODO: 発生確率・継続時間・ゴールドボーナス倍率は原文から追加確認が必要。',
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
    relatedBossHints: ['魔装騎士長（レッドフィーバー終了時・TODO）'],
    notes: 'TODO: 発生確率・継続時間・フィーバー中の効果は原文から追加確認が必要。',
  },

  fever_dragon: {
    id: 'fever_dragon',
    type: 'dragon',
    displayName: 'ドラゴンフィーバー',
    aliases: ['ドラゴンフィーバー'],
    triggerText: 'ドラゴンソールが30000まで溜まると発生する。',
    activationConditionText: 'ドラゴンソール蓄積 30000 到達',
    description: 'ドラゴンフィーバー状態。ドラゴン系のドロップ率が大幅上昇する。',
    onEndDescription: 'TODO: ドラゴンフィーバー終了時の挙動は原文から確認が必要。',
    relatedLootHints: ['ドラゴン系ドロップ率上昇', '各鱗の入手効率アップ'],
    notes: '⑭ドラゴンフィーバー会場ノードで状態確認可能。',
  },
};

// ============================================================
// Codex エントリ（主要ボス）
// ============================================================
export const FFGG_CODEX: Record<string, FreeFieldCodexEntry> = {
  giant_comet: {
    id: 'giant_comet', title: '巨大彗星', section: '大樹（⑨）',
    summary: '森地帯の大樹頂上にスポーンする強力な敵。コスモニウムを大量ドロップする。',
    dropsText: 'コスモニウム（ドロップ率150%・複数個の可能性）、コスモニウムオーブ（5%）',
    strategyText: 'HP が高く、全体攻撃が強力。回復アイテムを多めに持参すること。',
    notes: '',
  },
  egaldon: {
    id: 'egaldon', title: 'エガルドン', section: '砂漠地帯（④）',
    summary: 'エガルドを300体撃破で出現するボス。枯れた心を3%でドロップ。',
    dropsText: '枯れた心（3%）、岩鱗上位（高確率）、FF大判',
    strategyText: 'エガルドンが出現するまでに相当な戦闘が必要。計画的に撃破を積み重ねよう。',
    notes: 'TODO: 300ポイントカウントの永続化は playerSlice 拡張後に実装。',
  },
  slaughter_giant: {
    id: 'slaughter_giant', title: '屠る巨人', section: 'GGの木（⑥）',
    summary: 'サバンナ地帯のミニボス。シュヴァリエプレッジを2%でドロップ。',
    dropsText: 'シュヴァリエプレッジ（武器・2%）、各鱗系、FF大判',
    strategyText: 'ドラゴン系全種が同時に出現するため、範囲攻撃が有効。',
    notes: '',
  },
  mahadorias: {
    id: 'mahadorias', title: 'マハドリュアス', section: 'マハドリュアス（⑦）',
    summary: 'サバンナ地帯のミニボス。壊世賜杖レクイエムを2%でドロップ。',
    dropsText: '壊世賜杖レクイエム（武器・2%）、各鱗系',
    strategyText: 'TODO: 戦術詳細は原文から追加確認が必要。',
    notes: 'TODO: 詳細仕様は原文から追加確認が必要。',
  },
};

// ============================================================
// アイテム Codex（FF素材のヒント）
// ============================================================
export const FFGG_ITEM_CODEX: Record<string, {
  itemId: string; name: string; category: string;
  obtainFrom: string[]; usedFor: string[]; areaHint: string; beginnerTip: string; upgradesTo: string[];
}> = {
  green_scale: {
    itemId: 'green_scale', name: '緑鱗', category: 'scale',
    obtainFrom: ['グリド（40%下位）', 'グリド・アルファ（25%）', 'フォレストリッパー（30%）'],
    usedFor: ['緑竜装備の強化素材', '取れる君の強化（TODO）'],
    areaHint: '森地帯②⑨が最も効率的。グリドの群れを繰り返し倒そう。',
    beginnerTip: '緑鱗の下位は全敵から比較的入手しやすい。まず下位を集めて装備を整えよう。',
    upgradesTo: ['green_scale_high（強化素材として）'],
  },
  rock_scale: {
    itemId: 'rock_scale', name: '岩鱗', category: 'scale',
    obtainFrom: ['ガドラ（40%下位）', 'ガドラ改（上位も出る）', 'エガルド（5%確率で覚醒）'],
    usedFor: ['岩竜装備の強化素材'],
    areaHint: '砂漠④⑪⑫が主な入手場所。ガドラの群れを狙おう。',
    beginnerTip: '砂漠は危険度が高い。まず森地帯で装備を整えてから挑もう。',
    upgradesTo: [],
  },
  water_scale: {
    itemId: 'water_scale', name: '水鱗', category: 'scale',
    obtainFrom: ['アドーラ（40%下位）', 'アドーラ改（上位も出る）'],
    usedFor: ['水竜装備の強化素材'],
    areaHint: '雪山⑤が主な入手場所。アドーラを繰り返し倒そう。',
    beginnerTip: '牙狼の覚醒（波狼）に注意。5%で覚醒するので油断禁物。',
    upgradesTo: [],
  },
  red_scale: {
    itemId: 'red_scale', name: '赤鱗', category: 'scale',
    obtainFrom: ['ドラグ（40%下位）', 'ドラグ強（上位も出る）'],
    usedFor: ['赤竜装備の強化素材'],
    areaHint: '平原③が最も効率的。脳死で戦えるエリアなので周回しやすい。',
    beginnerTip: '平原は比較的安全。初心者にも扱いやすいエリア。',
    upgradesTo: [],
  },
  cosmonium: {
    itemId: 'cosmonium', name: 'コスモニウム', category: 'special',
    obtainFrom: ['巨大彗星（ドロップ率150%・複数個の可能性）', 'フォレストリッパー（2%）'],
    usedFor: ['コスモ系上位装備素材（TODO: レシピ確定後追加）', '売却価値高'],
    areaHint: '大樹⑨の巨大彗星が最も効率的。ドロップ率が150%なので複数個入手できることも。',
    beginnerTip: 'コスモニウムオーブは5%で出る希少素材。粘り強く周回しよう。',
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
  white_basil: {
    itemId: 'white_basil', name: 'ホワイトバジル', category: 'plant',
    obtainFrom: ['森地帯②採取（ffgg_forest_herb）70%'],
    usedFor: ['バジルエリクサー（クラフト）', 'スラムイ特殊ポーション（クラフト）'],
    areaHint: '森地帯②の採取スポットで安定入手。採集ツールが必要。',
    beginnerTip: '採取は戦闘割り込みの危険あり。戦力を整えてから向かおう。',
    upgradesTo: [],
  },
  ocean_orb: {
    itemId: 'ocean_orb', name: '海原のオーブ', category: 'combat',
    obtainFrom: ['Sea Memoria（雪山⑤ボス）30%', '雪山⑤アドーラ改（低確率）'],
    usedFor: ['海原の杖クラフト', '海系最上位装備'],
    areaHint: '雪山⑤のボス Sea Memoria が主なドロップ源。',
    beginnerTip: '反撃型ボスなので攻撃しすぎに注意。',
    upgradesTo: [],
  },
  slamy_liquid: {
    itemId: 'slamy_liquid', name: 'スラムイ溶液', category: 'combat',
    obtainFrom: ['森地帯②ソールドロップ（8%）', 'スラムイキング（サバンナ）50%'],
    usedFor: ['スラムイ特殊ポーション（クラフト）'],
    areaHint: 'サバンナのスラムイキングが最効率。',
    beginnerTip: 'サバンナは高難度エリア。まずは森地帯でソールドロップから集めよう。',
    upgradesTo: [],
  },
  ff_coin_small: {
    itemId: 'ff_coin_small', name: 'FF小判', category: 'coin',
    obtainFrom: ['FFGG全エリア敵ドロップ', '森地帯②採取ノード'],
    usedFor: ['FF大判（9枚→1枚クラフト）に変換して売却（500,000G）'],
    areaHint: 'FFGG全体で入手できる。海賊船⑩のボス討伐が最多ドロップ。',
    beginnerTip: '9枚集めてFF大判に変換すると一気に高値になる。',
    upgradesTo: ['ff_coin_large（クラフト変換）'],
  },
  carib_rough_wave: {
    itemId: 'carib_rough_wave', name: 'カリブの荒波', category: 'special',
    obtainFrom: ['海賊船⑩脳筋盗賊リーダーボスドロップ（20%）', 'フィーバー時ドロップ率上昇'],
    usedFor: ['海賊系最上位装備素材（TODO: レシピ確定後追加）'],
    areaHint: '海賊船⑩専用。ボスを繰り返し倒すのが基本。',
    beginnerTip: 'フィーバーが発生したら積極的に参加しよう。',
    upgradesTo: [],
  },
  hot_sand_amber: {
    itemId: 'hot_sand_amber', name: '熱砂の琥珀', category: 'special',
    obtainFrom: ['砂漠採集（6%）', '⑫ピラミッド隠し採集（12%）', 'ガドラ改（低確率）'],
    usedFor: ['砂漠系装備素材（TODO: レシピ確定後追加）'],
    areaHint: '⑫ピラミッドの隠し採集が最も効率的（12%）。',
    beginnerTip: '採集危険度が高い。十分な戦力を持って挑もう。',
    upgradesTo: [],
  },
  withered_heart: {
    itemId: 'withered_heart', name: '枯れた心', category: 'special',
    obtainFrom: ['エガルドン（ボス）3%'],
    usedFor: ['特殊武器素材（TODO: レシピ確定後追加）'],
    areaHint: 'エガルドを300体撃破してエガルドンを出現させる必要がある。長期戦覚悟で。',
    beginnerTip: '超希少素材。エガルドン出現自体が大変なので根気が必要。',
    upgradesTo: [],
  },
};

// ============================================================
// 全ワールド一覧（表示順）
// ============================================================
export const FREE_FIELD_WORLDS: FreeFieldWorld[] = [
  FFGG_WORLD,
  FF1_WORLD,
  FF2_WORLD,
  FFGGR_WORLD,
];

export const FREE_FIELD_AREAS_ALL: Record<string, FreeFieldArea> = {
  ...FFGG_AREAS,
  ...FF1_AREAS,
  ...FF2_AREAS,
  ...FFGGR_AREAS,
};

export const FREE_FIELD_NODES_ALL: Record<string, FreeFieldNode> = {
  ...FFGG_NODES,
  ...FF1_NODES,
  ...FF2_NODES,
  ...FFGGR_NODES,
};

export const getAreasByWorld = (worldId: string): FreeFieldArea[] => {
  const world = FREE_FIELD_WORLDS.find(w => w.id === worldId);
  if (!world) return [];
  return world.areaIds.map(id => FREE_FIELD_AREAS_ALL[id]).filter(Boolean);
};

export const getNodesByArea = (areaId: string): FreeFieldNode[] => {
  const area = FREE_FIELD_AREAS_ALL[areaId];
  if (!area) return [];
  return area.nodeIds.map(id => FREE_FIELD_NODES_ALL[id]).filter(Boolean);
};

export const getNodesByWorld = (worldId: string): FreeFieldNode[] => {
  return getAreasByWorld(worldId).flatMap(a => getNodesByArea(a.id));
};

export const getFreeFieldWorld = (id: string): FreeFieldWorld | undefined =>
  FREE_FIELD_WORLDS.find(w => w.id === id);
