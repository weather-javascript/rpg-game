// src/data/ffggrMaster.ts
// FFGGR マスターデータ — 敵・エリア・ドロップ・取引・フィーバー・ポイント

// ============================================================
// 型定義
// ============================================================
export type FFGGRAreaId =
  | 'plains' | 'snow' | 'swamp' | 'wasteland'
  | 'cave' | 'volcano' | 'mountain' | 'forest'
  | 'jungle' | 'abyss';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface FFGGRDropEntry {
  itemId: string;
  rate: number;       // 0-1
  min: number;
  max: number;
}

export type MonsterActionType =
  | 'atk_normal'
  | 'atk_penetrate'
  | 'atk_multi'
  | 'atk_aoe'
  | 'atk_dot'
  | 'heal_self'
  | 'heal_party'
  | 'debuff_def'
  | 'debuff_atk'
  | 'buff_enrage'
  | 'summon'
  | 'trap'
  | 'absorb'
  | 'fly'
  | 'counter';

export interface FFGGRAction {
  id: string;
  name: string;
  emoji: string;
  type: MonsterActionType;
  weight: number;
  triggerHpPct?: number;  // このHP%以下で選択肢に追加
  triggerTurnMod?: number;
  power?: number;
  penetrateDmg?: number;
  hitCount?: number;
  healPct?: number;
  dotDamage?: number;
  dotTurns?: number;
  debuffPct?: number;
  debuffTurns?: number;
  summonId?: string;
  summonCount?: number;
  trapTurns?: number;
  message?: string;
}

export interface FFGGRMonster {
  id: string;
  name: string;
  emoji: string;
  description: string;
  areaIds: FFGGRAreaId[];
  maxHp: number;
  attack: number;
  defense: number;
  baseExp: number;
  baseGold: number;
  drops: FFGGRDropEntry[];
  actions: FFGGRAction[];
  isBoss?: boolean;
  isMidBoss?: boolean;
  isRareBoss?: boolean;
  isSpecialZombie?: boolean;
  powerLevel?: number;
  traits?: string[];
}

export interface FFGGRArea {
  id: FFGGRAreaId;
  name: string;
  emoji: string;
  color: string;
  description: string;
  monsterIds: string[];
  bossId?: string;
  midBossIds?: string[];
  rareBossId?: string;
  recommendedDef: number;
  tips: string;
  fixedDropId?: string;  // エリア固有ドロップ
}

export interface FFGGRCrateGrade {
  id: string;
  name: string;
  emoji: string;
  baseDrop: string[];
  additionalCost: number;
  additionalDrop: string[];
  ffggrPointGain: number;
}

export interface FFGGRTradeEntry {
  id: string;
  slot1ItemId: string;
  slot1Amount: number;
  slot2ItemId?: string;
  slot2Amount?: number;
  slot3ItemId?: string;
  slot3Amount?: number;
  resultItemId: string;
  resultAmount: number;
}

export interface FFGGRNPCShop {
  id: string;
  name: string;
  emoji: string;
  description: string;
  trades: FFGGRTradeEntry[];
}

// ============================================================
// アイテムID定数
// ============================================================
export const FFGGR_ITEMS = {
  // 欠片・結晶
  GREEN_FRAG:   'ffggr_green_frag',
  GREEN_CRYSTAL:'ffggr_green_crystal',
  GREEN_GEM:    'ffggr_green_gem',
  GREEN_JEWEL:  'ffggr_green_jewel',
  BLUE_FRAG:    'ffggr_blue_frag',
  BLUE_CRYSTAL: 'ffggr_blue_crystal',
  BLUE_GEM:     'ffggr_blue_gem',
  BLUE_JEWEL:   'ffggr_blue_jewel',
  RED_FRAG:     'ffggr_red_frag',
  RED_CRYSTAL:  'ffggr_red_crystal',
  RED_GEM:      'ffggr_red_gem',
  RED_JEWEL:    'ffggr_red_jewel',
  YELLOW_FRAG:  'ffggr_yellow_frag',
  YELLOW_CRYSTAL:'ffggr_yellow_crystal',
  YELLOW_GEM:   'ffggr_yellow_gem',
  YELLOW_JEWEL: 'ffggr_yellow_jewel',
  // ウロコ
  GREEN_SCALE_LOW:  'ffggr_green_scale_low',
  GREEN_SCALE_HIGH: 'ffggr_green_scale_high',
  BLUE_SCALE_LOW:   'ffggr_blue_scale_low',
  BLUE_SCALE_HIGH:  'ffggr_blue_scale_high',
  RED_SCALE_LOW:    'ffggr_red_scale_low',
  RED_SCALE_HIGH:   'ffggr_red_scale_high',
  YELLOW_SCALE_LOW: 'ffggr_yellow_scale_low',
  YELLOW_SCALE_HIGH:'ffggr_yellow_scale_high',
  // エリア固有
  AREA_A: 'ffggr_area_a', AREA_A2: 'ffggr_area_a2',
  AREA_B: 'ffggr_area_b', AREA_B2: 'ffggr_area_b2',
  AREA_C: 'ffggr_area_c', AREA_C2: 'ffggr_area_c2',
  AREA_D: 'ffggr_area_d', AREA_D2: 'ffggr_area_d2',
  AREA_E: 'ffggr_area_e', AREA_E2: 'ffggr_area_e2',
  AREA_F: 'ffggr_area_f', AREA_F2: 'ffggr_area_f2',
  AREA_F_POWDER: 'ffggr_area_f_powder',
  AREA_F_ROD:    'ffggr_area_f_rod',
  // 特殊素材
  SENRYOBAKO:   'ffggr_senryobako',
  ONTIME_TICKET:'ontime_ticket',
  NUTS:         'ffggr_nuts',
  HONEY:        'ffggr_honey',
  // バフ食料
  NANAKUSAGAYU:       'ffggr_nanakusagayu',
  LARABEE_HONEY:      'ffggr_larabee_honey',
  RAJUICE:            'ffggr_rajuice',
  MANA_MEAL_5:        'ffggr_mana_meal_5',
  MANA_MEAL_10:       'ffggr_mana_meal_10',
  MANA_MEAL_LIMIT:    'ffggr_mana_meal_limit',
  SWEET_FRUIT_S:      'ffggr_sweet_fruit_s',
  SWEET_FRUIT_M:      'ffggr_sweet_fruit_m',
  SWEET_FRUIT_L:      'ffggr_sweet_fruit_l',
  SWEET_FRUIT_XL:     'ffggr_sweet_fruit_xl',
  // テレポーター
  TP_INFINITE:        'ffggr_tp_infinite',
  TP_CONSUME:         'ffggr_tp_consume',
  RESCUE_CONSUME:     'ffggr_rescue_consume',
  // ロッド
  FFGG_ROD_R6:  'ffgg_rod_r6',
  FFGGR_ROD_R1: 'ffggr_rod_r1',
  FFGGR_ROD_R2: 'ffggr_rod_r2',
  FFGGR_ROD_R3: 'ffggr_rod_r3',
  FFGGR_ROD_R4: 'ffggr_rod_r4',
  // 武器
  DANJURI:          'ffggr_danjuri_replica',
  DANJURI_FINAL:    'ffggr_danjuri_final',
  RYUSEIQUN:        'ffggr_ryuseiqun',
  RYUSEIQUN_FINAL:  'ffggr_ryuseiqun_final',
  TAISHO:           'ffggr_taisho',
  TAISHO_FINAL:     'ffggr_taisho_final',
  HEBIYUMI:         'ffggr_hebiyumi',
  HEBIYUMI_FINAL:   'ffggr_hebiyumi_final',
  RYOIKIKO:         'ffggr_ryoikiko',
  RYOIKIKO_FINAL:   'ffggr_ryoikiko_final',
  TOUSEKI:          'ffggr_touseki',
  TOUSEKI_FINAL:    'ffggr_touseki_final',
  MANADRAIN:        'ffggr_manadrain',
  MANADRAIN_FINAL:  'ffggr_manadrain_final',
  KATANA_BLUE:      'ffggr_katana_blue',
  KATANA_FINAL:     'ffggr_katana_final',
  CHARLOTTE_GAZER:  'charlotte_gazer',
  SALAMANDER_FLAME: 'ffggr_salamander_flame',
  SALAMANDER_FINAL: 'ffggr_salamander_final',
  SURFACE:          'ffggr_surface',
  SURFACE_FINAL:    'ffggr_surface_ex',
  // 中間素材
  MID1:'ffggr_mid1', MID2:'ffggr_mid2', MID3:'ffggr_mid3', MID4:'ffggr_mid4',
  MID5:'ffggr_mid5', MID6:'ffggr_mid6', MID7:'ffggr_mid7', MID8:'ffggr_mid8',
  MID9:'ffggr_mid9', MID10:'ffggr_mid10',
  MEGALO_TRACE:     'ffggr_megalo_trace',
  // クレート
  CRATE_LEATHER:    'ffggr_crate_leather',
  CRATE_GOLD:       'ffggr_crate_gold',
  CRATE_DIAMOND:    'ffggr_crate_diamond',
  CRATE_DIAMOND_EX: 'ffggr_crate_diamond_ex',
  // バトル素材
  BRAVE_STAR:   'ffggr_brave_star',
  BRAVE_HEART:  'ffggr_brave_heart',
  HEALTH_BOMBER:'ffggr_health_bomber',
  BRAVE_PROOF:  'ffggr_brave_proof',
  UPGRADE_MAT:  'ffggr_upgrade_mat',
  EXCA_DREAM:   'ffggr_exca_dream',
  // 空の3素材（仮）
  EMPTY_MAT_1: 'ffggr_empty_mat_1',
  EMPTY_MAT_2: 'ffggr_empty_mat_2',
  EMPTY_MAT_3: 'ffggr_empty_mat_3',
} as const;

const I = FFGGR_ITEMS;

// ============================================================
// アイテムマスター（FFGGR専用）
// ============================================================
export const FFGGR_ITEM_MASTER: Record<string, {
  id: string; name: string; emoji: string; description: string;
  category: string; rarity: ItemRarity; stackMax: number; sellPrice: number;
}> = {
  // 欠片・結晶チェーン
  [I.GREEN_FRAG]:    { id:I.GREEN_FRAG,    name:'緑の欠片',    emoji:'🟢', description:'GGRの緑系素材。32個で緑の結晶に。', category:'material', rarity:'common',    stackMax:9999, sellPrice:50   },
  [I.GREEN_CRYSTAL]: { id:I.GREEN_CRYSTAL, name:'緑の結晶',    emoji:'💚', description:'緑の欠片32個から作る圧縮素材。', category:'material', rarity:'uncommon',  stackMax:9999, sellPrice:500  },
  [I.GREEN_GEM]:     { id:I.GREEN_GEM,     name:'緑の宝石',    emoji:'🟩', description:'緑の結晶32個+ウロコから作る。', category:'material', rarity:'rare',      stackMax:999,  sellPrice:5000 },
  [I.GREEN_JEWEL]:   { id:I.GREEN_JEWEL,   name:'緑輝石',      emoji:'✨', description:'緑の最高素材。', category:'material', rarity:'epic',      stackMax:99,   sellPrice:50000},
  [I.BLUE_FRAG]:     { id:I.BLUE_FRAG,     name:'青の欠片',    emoji:'🔵', description:'GGRの青系素材。', category:'material', rarity:'uncommon',  stackMax:9999, sellPrice:150  },
  [I.BLUE_CRYSTAL]:  { id:I.BLUE_CRYSTAL,  name:'青の結晶',    emoji:'💙', description:'青の欠片32個から。', category:'material', rarity:'rare',      stackMax:9999, sellPrice:1500 },
  [I.BLUE_GEM]:      { id:I.BLUE_GEM,      name:'青の宝石',    emoji:'🟦', description:'青の結晶64個+ウロコ。', category:'material', rarity:'epic',      stackMax:999,  sellPrice:15000},
  [I.BLUE_JEWEL]:    { id:I.BLUE_JEWEL,    name:'青輝石',      emoji:'💎', description:'青の最高素材。', category:'material', rarity:'legendary', stackMax:99,   sellPrice:150000},
  [I.RED_FRAG]:      { id:I.RED_FRAG,      name:'赤の欠片',    emoji:'🔴', description:'GGRの赤系素材。', category:'material', rarity:'rare',      stackMax:9999, sellPrice:500  },
  [I.RED_CRYSTAL]:   { id:I.RED_CRYSTAL,   name:'赤の結晶',    emoji:'❤️', description:'赤の欠片32個から。', category:'material', rarity:'rare',      stackMax:9999, sellPrice:5000 },
  [I.RED_GEM]:       { id:I.RED_GEM,       name:'赤の宝石',    emoji:'🟥', description:'赤の結晶24個+ウロコ。', category:'material', rarity:'epic',      stackMax:999,  sellPrice:50000},
  [I.RED_JEWEL]:     { id:I.RED_JEWEL,     name:'赤輝石',      emoji:'💠', description:'赤の最高素材。', category:'material', rarity:'legendary', stackMax:99,   sellPrice:500000},
  [I.YELLOW_FRAG]:   { id:I.YELLOW_FRAG,   name:'黄の欠片',    emoji:'🟡', description:'GGRの黄系素材。希少。', category:'material', rarity:'epic',      stackMax:9999, sellPrice:2000 },
  [I.YELLOW_CRYSTAL]:{ id:I.YELLOW_CRYSTAL,name:'黄の結晶',    emoji:'💛', description:'黄の欠片32個から。', category:'material', rarity:'epic',      stackMax:9999, sellPrice:20000},
  [I.YELLOW_GEM]:    { id:I.YELLOW_GEM,    name:'黄の宝石',    emoji:'🌟', description:'黄の結晶16個+ウロコ。', category:'material', rarity:'legendary', stackMax:999,  sellPrice:200000},
  [I.YELLOW_JEWEL]:  { id:I.YELLOW_JEWEL,  name:'黄輝石',      emoji:'👑', description:'FFGGRの最高素材。', category:'material', rarity:'legendary', stackMax:99,   sellPrice:2000000},
  // ウロコ
  [I.GREEN_SCALE_LOW]:  { id:I.GREEN_SCALE_LOW,  name:'緑龍のウロコ(下位)', emoji:'🐉', description:'緑龍から採取。', category:'material', rarity:'rare',  stackMax:999, sellPrice:3000 },
  [I.GREEN_SCALE_HIGH]: { id:I.GREEN_SCALE_HIGH, name:'緑龍のウロコ(上位)', emoji:'🐲', description:'緑龍の精鋭から。', category:'material', rarity:'epic', stackMax:99,  sellPrice:30000 },
  [I.BLUE_SCALE_LOW]:   { id:I.BLUE_SCALE_LOW,   name:'水龍のウロコ(下位)', emoji:'🐉', description:'水龍から採取。', category:'material', rarity:'rare',  stackMax:999, sellPrice:5000 },
  [I.BLUE_SCALE_HIGH]:  { id:I.BLUE_SCALE_HIGH,  name:'水龍のウロコ(上位)', emoji:'🐲', description:'水龍の精鋭から。', category:'material', rarity:'epic', stackMax:99,  sellPrice:50000 },
  [I.RED_SCALE_LOW]:    { id:I.RED_SCALE_LOW,    name:'赤龍のウロコ(下位)', emoji:'🐉', description:'赤龍から採取。', category:'material', rarity:'rare',  stackMax:999, sellPrice:15000 },
  [I.RED_SCALE_HIGH]:   { id:I.RED_SCALE_HIGH,   name:'赤龍のウロコ(上位)', emoji:'🐲', description:'赤龍の精鋭から。', category:'material', rarity:'epic', stackMax:99,  sellPrice:150000 },
  [I.YELLOW_SCALE_LOW]: { id:I.YELLOW_SCALE_LOW, name:'岩龍のウロコ(下位)', emoji:'🐉', description:'岩龍から採取。', category:'material', rarity:'epic',     stackMax:999, sellPrice:50000 },
  [I.YELLOW_SCALE_HIGH]:{ id:I.YELLOW_SCALE_HIGH,name:'岩龍のウロコ(上位)', emoji:'🐲', description:'岩龍の精鋭から。', category:'material', rarity:'legendary', stackMax:99, sellPrice:500000 },
  // エリア固有
  [I.AREA_A]: { id:I.AREA_A, name:'エリアA',   emoji:'🅰️', description:'平原エリアの固有ドロップ。', category:'material', rarity:'uncommon', stackMax:9999, sellPrice:200  },
  [I.AREA_A2]:{ id:I.AREA_A2,name:'エリアA2',  emoji:'🅰️', description:'エリアA×64の圧縮素材。',   category:'material', rarity:'rare',     stackMax:999,  sellPrice:10000},
  [I.AREA_B]: { id:I.AREA_B, name:'エリアB',   emoji:'🅱️', description:'雪原エリアの固有ドロップ。', category:'material', rarity:'uncommon', stackMax:9999, sellPrice:200  },
  [I.AREA_B2]:{ id:I.AREA_B2,name:'エリアB2',  emoji:'🅱️', description:'エリアB×64の圧縮素材。',   category:'material', rarity:'rare',     stackMax:999,  sellPrice:10000},
  [I.AREA_C]: { id:I.AREA_C, name:'エリアC',   emoji:'🌿', description:'沼地エリアの固有ドロップ。', category:'material', rarity:'uncommon', stackMax:9999, sellPrice:200  },
  [I.AREA_C2]:{ id:I.AREA_C2,name:'エリアC2',  emoji:'🌿', description:'エリアC×64の圧縮素材。',   category:'material', rarity:'rare',     stackMax:999,  sellPrice:10000},
  [I.AREA_D]: { id:I.AREA_D, name:'エリアD',   emoji:'🏜️', description:'荒野エリアの固有ドロップ。', category:'material', rarity:'uncommon', stackMax:9999, sellPrice:200  },
  [I.AREA_D2]:{ id:I.AREA_D2,name:'エリアD2',  emoji:'🏜️', description:'エリアD×64の圧縮素材。',   category:'material', rarity:'rare',     stackMax:999,  sellPrice:10000},
  [I.AREA_E]: { id:I.AREA_E, name:'エリアE',   emoji:'🪨', description:'洞窟エリアの固有ドロップ。', category:'material', rarity:'uncommon', stackMax:9999, sellPrice:200  },
  [I.AREA_E2]:{ id:I.AREA_E2,name:'エリアE2',  emoji:'🪨', description:'エリアE×64の圧縮素材。',   category:'material', rarity:'rare',     stackMax:999,  sellPrice:10000},
  [I.AREA_F]: { id:I.AREA_F, name:'エリアF(通常)', emoji:'🔥', description:'火山エリアの固有ドロップ。', category:'material', rarity:'rare', stackMax:9999, sellPrice:500  },
  [I.AREA_F2]:{ id:I.AREA_F2,name:'エリアF2',     emoji:'🔥', description:'エリアF×64の圧縮素材。',   category:'material', rarity:'epic', stackMax:999,  sellPrice:30000},
  [I.AREA_F_POWDER]:{ id:I.AREA_F_POWDER, name:'エリアF(パウダー)', emoji:'💫', description:'火山エリアのレア固有。', category:'material', rarity:'epic',     stackMax:999,  sellPrice:5000 },
  [I.AREA_F_ROD]:   { id:I.AREA_F_ROD,    name:'エリアF(ロッド)',   emoji:'🎣', description:'火山エリアの最レア固有。',category:'material', rarity:'legendary',stackMax:99,   sellPrice:50000},
  // バフ食料
  [I.NANAKUSAGAYU]:    { id:I.NANAKUSAGAYU,    name:'七草粥',              emoji:'🍚', description:'HP回復バフ食料。',              category:'food', rarity:'uncommon', stackMax:99, sellPrice:1000 },
  [I.LARABEE_HONEY]:   { id:I.LARABEE_HONEY,   name:'ララビーのハチミツ♡', emoji:'🍯', description:'強力なバフ食料。',              category:'food', rarity:'rare',     stackMax:99, sellPrice:3000 },
  [I.RAJUICE]:         { id:I.RAJUICE,          name:'ラジュース【クイックフード】', emoji:'🧃', description:'クイックバフ飲料。', category:'food', rarity:'rare',     stackMax:99, sellPrice:2000 },
  [I.MANA_MEAL_5]:     { id:I.MANA_MEAL_5,     name:'マナ飯5',             emoji:'🍱', description:'マナ5%回復飯。',               category:'food', rarity:'uncommon', stackMax:99, sellPrice:500  },
  [I.MANA_MEAL_10]:    { id:I.MANA_MEAL_10,    name:'マナ飯10',            emoji:'🍱', description:'マナ10%回復飯。',              category:'food', rarity:'rare',     stackMax:99, sellPrice:1500 },
  [I.MANA_MEAL_LIMIT]: { id:I.MANA_MEAL_LIMIT, name:'マナ飯リミット',      emoji:'🍱', description:'マナ上限まで回復。',           category:'food', rarity:'epic',     stackMax:99, sellPrice:5000 },
  [I.SWEET_FRUIT_S]:   { id:I.SWEET_FRUIT_S,   name:'甘いフルーツ(小)',    emoji:'🍎', description:'20分間バフ(小)。',             category:'food', rarity:'uncommon', stackMax:99, sellPrice:2000 },
  [I.SWEET_FRUIT_M]:   { id:I.SWEET_FRUIT_M,   name:'甘いフルーツ(中)',    emoji:'🍊', description:'20分間バフ(中)。',             category:'food', rarity:'rare',     stackMax:99, sellPrice:5000 },
  [I.SWEET_FRUIT_L]:   { id:I.SWEET_FRUIT_L,   name:'甘いフルーツ(大)',    emoji:'🍇', description:'20分間バフ(大)。',             category:'food', rarity:'epic',     stackMax:99, sellPrice:15000},
  [I.SWEET_FRUIT_XL]:  { id:I.SWEET_FRUIT_XL,  name:'甘いフルーツ(特大)', emoji:'🍉', description:'20分間バフ(特大)。主力バフ。', category:'food', rarity:'legendary',stackMax:99, sellPrice:50000},
  // テレポーター
  [I.TP_INFINITE]:  { id:I.TP_INFINITE,  name:'FFGGRテレポーター',     emoji:'🔮', description:'FFGGRへ無制限にTP。千両箱16個が必要。', category:'tool', rarity:'legendary', stackMax:1,  sellPrice:0    },
  [I.TP_CONSUME]:   { id:I.TP_CONSUME,   name:'FFGGRテレポーター(消費)', emoji:'🌀', description:'1回限りTP。緑の結晶16個または青の結晶16個で交換。', category:'tool', rarity:'rare', stackMax:99, sellPrice:500  },
  [I.RESCUE_CONSUME]:{ id:I.RESCUE_CONSUME, name:'消費して救援を呼ぶ', emoji:'📣', description:'1回限りで救援を呼ぶ消費アイテム。', category:'tool', rarity:'uncommon', stackMax:99, sellPrice:300 },
  [I.SENRYOBAKO]:   { id:I.SENRYOBAKO,   name:'千両箱',                emoji:'📦', description:'超高級木箱。FFGGRテレポーター素材。', category:'material', rarity:'legendary', stackMax:99, sellPrice:50000},
  [I.NUTS]:         { id:I.NUTS,         name:'FFGGR産の木の実',         emoji:'🌰', description:'森エリアで採取。1日32個まで。', category:'material', rarity:'uncommon', stackMax:99, sellPrice:500 },
  [I.HONEY]:        { id:I.HONEY,        name:'ララビーのハチミツ♡',    emoji:'🍯', description:'甘いフルーツの素材。',          category:'material', rarity:'rare',     stackMax:99, sellPrice:2000},
  // ロッド
  [I.FFGG_ROD_R6]:  { id:I.FFGG_ROD_R6,  name:'ffggロッド Rank6',  emoji:'🎣', description:'FFGGの最高竿。GGRロッドのベース。', category:'tool', rarity:'epic',     stackMax:1, sellPrice:0 },
  [I.FFGGR_ROD_R1]: { id:I.FFGGR_ROD_R1, name:'ffggrロッド Rank1', emoji:'🎣', description:'FFGGR専用ロッドR1。',              category:'tool', rarity:'epic',     stackMax:1, sellPrice:0 },
  [I.FFGGR_ROD_R2]: { id:I.FFGGR_ROD_R2, name:'ffggrロッド Rank2', emoji:'🎣', description:'FFGGR専用ロッドR2。',              category:'tool', rarity:'epic',     stackMax:1, sellPrice:0 },
  [I.FFGGR_ROD_R3]: { id:I.FFGGR_ROD_R3, name:'ffggrロッド Rank3', emoji:'🎣', description:'FFGGR専用ロッドR3。',              category:'tool', rarity:'legendary',stackMax:1, sellPrice:0 },
  [I.FFGGR_ROD_R4]: { id:I.FFGGR_ROD_R4, name:'ffggrロッド Rank4', emoji:'🎣', description:'FFGGR専用最高位ロッドR4。',        category:'tool', rarity:'legendary',stackMax:1, sellPrice:0 },
  // 武器
  [I.DANJURI]:         { id:I.DANJURI,         name:'天丼(レプリカ)',    emoji:'🍜', description:'天丼の複製品。強化可能。',   category:'weapon', rarity:'rare',     stackMax:1, sellPrice:5000  },
  [I.DANJURI_FINAL]:   { id:I.DANJURI_FINAL,   name:'天丼が降ってきた！',emoji:'🌧️', description:'天丼レプリカの最終強化。', category:'weapon', rarity:'legendary',stackMax:1, sellPrice:500000},
  [I.RYUSEIQUN]:       { id:I.RYUSEIQUN,       name:'流星群',           emoji:'🌠', description:'流星群武器。強化可能。',    category:'weapon', rarity:'rare',     stackMax:1, sellPrice:8000  },
  [I.RYUSEIQUN_FINAL]: { id:I.RYUSEIQUN_FINAL, name:'数多の流星群',     emoji:'🌌', description:'流星群の最終強化。',       category:'weapon', rarity:'legendary',stackMax:1, sellPrice:800000},
  [I.TAISHO]:          { id:I.TAISHO,          name:'大剣',             emoji:'⚔️', description:'大きな剣。強化可能。',      category:'weapon', rarity:'uncommon', stackMax:1, sellPrice:3000  },
  [I.TAISHO_FINAL]:    { id:I.TAISHO_FINAL,    name:'緑葉の大剣',       emoji:'🌿', description:'大剣の最終強化。',         category:'weapon', rarity:'epic',     stackMax:1, sellPrice:100000},
  [I.HEBIYUMI]:        { id:I.HEBIYUMI,        name:'蛇弓',             emoji:'🏹', description:'蛇弓。バニラ弓の挙動継承。', category:'weapon', rarity:'rare',    stackMax:1, sellPrice:10000 },
  [I.HEBIYUMI_FINAL]:  { id:I.HEBIYUMI_FINAL,  name:'劇毒の蛇弓',       emoji:'☠️', description:'蛇弓の最終強化。',         category:'weapon', rarity:'legendary',stackMax:1, sellPrice:300000},
  [I.RYOIKIKO]:        { id:I.RYOIKIKO,        name:'領域光',           emoji:'💡', description:'領域光武器。需要高め。',    category:'weapon', rarity:'epic',     stackMax:1, sellPrice:20000 },
  [I.RYOIKIKO_FINAL]:  { id:I.RYOIKIKO_FINAL,  name:'増大の領域光',     emoji:'🌟', description:'領域光の最終強化。',       category:'weapon', rarity:'legendary',stackMax:1, sellPrice:500000},
  [I.TOUSEKI]:         { id:I.TOUSEKI,         name:'投石',             emoji:'🪨', description:'強力な投石武器。人気高。',  category:'weapon', rarity:'epic',     stackMax:1, sellPrice:30000 },
  [I.TOUSEKI_FINAL]:   { id:I.TOUSEKI_FINAL,   name:'剛力の投石',       emoji:'💪', description:'投石の最終強化。',         category:'weapon', rarity:'legendary',stackMax:1, sellPrice:600000},
  [I.MANADRAIN]:       { id:I.MANADRAIN,       name:'マナドレイン',     emoji:'🔵', description:'マナを1800回復可能。',      category:'weapon', rarity:'epic',     stackMax:1, sellPrice:25000 },
  [I.MANADRAIN_FINAL]: { id:I.MANADRAIN_FINAL, name:'永久のマナドレイン',emoji:'💎', description:'マナドレイン最終強化。',   category:'weapon', rarity:'legendary',stackMax:1, sellPrice:500000},
  [I.KATANA_BLUE]:     { id:I.KATANA_BLUE,     name:'剣',               emoji:'🗡️', description:'コレクター人気の剣。希少。',category:'weapon', rarity:'epic',     stackMax:1, sellPrice:50000 },
  [I.KATANA_FINAL]:    { id:I.KATANA_FINAL,    name:'おじさんの剣',     emoji:'🗡️', description:'剣の最終強化。',           category:'weapon', rarity:'legendary',stackMax:1, sellPrice:999999},
  [I.CHARLOTTE_GAZER]: { id:I.CHARLOTTE_GAZER, name:'Charlotte Gazer',  emoji:'👁️', description:'特殊な銃器。流星群の素材。',category:'weapon', rarity:'rare',     stackMax:10,sellPrice:5000 },
  [I.SALAMANDER_FLAME]:{ id:I.SALAMANDER_FLAME,name:'Salamander Flame', emoji:'🔥', description:'サラマンダーの炎武器。',   category:'weapon', rarity:'epic',     stackMax:1, sellPrice:20000 },
  [I.SALAMANDER_FINAL]:{ id:I.SALAMANDER_FINAL,name:'Salamander Flame Breath',emoji:'🐉',description:'最終強化炎武器。',   category:'weapon', rarity:'legendary',stackMax:1, sellPrice:500000},
  [I.SURFACE]:         { id:I.SURFACE,         name:'サーフェス',       emoji:'🌊', description:'エンドコンテンツ武器の素材。',category:'weapon',rarity:'legendary',stackMax:1, sellPrice:100000},
  [I.SURFACE_FINAL]:   { id:I.SURFACE_FINAL,   name:'サーフェスEX',     emoji:'⚡', description:'FFGGRの最終到達武器。',    category:'weapon', rarity:'legendary',stackMax:1, sellPrice:9999999},
  // 中間素材
  [I.MID1]: { id:I.MID1, name:'中間素材1', emoji:'⚙️', description:'生命の大剣の中間素材。', category:'material', rarity:'epic', stackMax:99, sellPrice:0 },
  [I.MID2]: { id:I.MID2, name:'中間素材2', emoji:'⚙️', description:'生命の大剣の中間素材。', category:'material', rarity:'epic', stackMax:99, sellPrice:0 },
  [I.MID3]: { id:I.MID3, name:'中間素材3', emoji:'⚙️', description:'生命の大剣の中間素材。', category:'material', rarity:'epic', stackMax:99, sellPrice:0 },
  [I.MID4]: { id:I.MID4, name:'中間素材4', emoji:'⚙️', description:'生命の大剣の中間素材。', category:'material', rarity:'epic', stackMax:99, sellPrice:0 },
  [I.MID5]: { id:I.MID5, name:'中間素材5', emoji:'⚙️', description:'生命の大剣の中間素材。', category:'material', rarity:'epic', stackMax:99, sellPrice:0 },
  [I.MID6]: { id:I.MID6, name:'中間素材6', emoji:'⚙️', description:'生命の大剣の中間素材。', category:'material', rarity:'epic', stackMax:99, sellPrice:0 },
  [I.MID7]: { id:I.MID7, name:'中間素材7', emoji:'⚙️', description:'生命の大剣の中間素材。', category:'material', rarity:'epic', stackMax:99, sellPrice:0 },
  [I.MID8]: { id:I.MID8, name:'中間素材8', emoji:'⚙️', description:'生命の大剣の中間素材。', category:'material', rarity:'epic', stackMax:99, sellPrice:0 },
  [I.MID9]: { id:I.MID9, name:'中間素材9', emoji:'⚙️', description:'生命の大剣の中間素材。', category:'material', rarity:'epic', stackMax:99, sellPrice:0 },
  [I.MID10]:{ id:I.MID10,name:'中間素材10',emoji:'⚙️', description:'生命の大剣の最終中間素材。', category:'material', rarity:'legendary', stackMax:99, sellPrice:0 },
  [I.MEGALO_TRACE]:   { id:I.MEGALO_TRACE,   name:'メガロスの魔力燃焼痕',emoji:'💥', description:'特殊武器合成素材。',   category:'material', rarity:'legendary', stackMax:99, sellPrice:10000},
  [I.BRAVE_STAR]:     { id:I.BRAVE_STAR,     name:'ブレイブスター',       emoji:'⭐', description:'サーフェスEXの素材。', category:'material', rarity:'legendary', stackMax:99, sellPrice:10000},
  [I.BRAVE_HEART]:    { id:I.BRAVE_HEART,    name:'ブレイブハート',       emoji:'💖', description:'サーフェスEXの素材。', category:'material', rarity:'legendary', stackMax:99, sellPrice:10000},
  [I.HEALTH_BOMBER]:  { id:I.HEALTH_BOMBER,  name:'ヘルスボンバー',       emoji:'💣', description:'サーフェスEXの素材。', category:'material', rarity:'legendary', stackMax:99, sellPrice:10000},
  [I.BRAVE_PROOF]:    { id:I.BRAVE_PROOF,    name:'ブレイブロードの証',   emoji:'🏆', description:'サーフェスEX合成用。',  category:'material', rarity:'legendary', stackMax:999,sellPrice:500 },
  [I.UPGRADE_MAT]:    { id:I.UPGRADE_MAT,    name:'固有アップグレード素材',emoji:'🔑', description:'最終武器合成素材。',  category:'material', rarity:'legendary', stackMax:99, sellPrice:0 },
  [I.EXCA_DREAM]:     { id:I.EXCA_DREAM,     name:'夢幻のエクスカリバー', emoji:'⚔️', description:'ジャングルの取引品。スキル未実装。', category:'weapon', rarity:'legendary', stackMax:1, sellPrice:0 },
  [I.EMPTY_MAT_1]:    { id:I.EMPTY_MAT_1,    name:'空の素材1',           emoji:'🌀', description:'空の3素材のひとつ。確定ドロップ。', category:'material', rarity:'common',   stackMax:99, sellPrice:10 },
  [I.EMPTY_MAT_2]:    { id:I.EMPTY_MAT_2,    name:'空の素材2',           emoji:'🌀', description:'空の3素材のひとつ。確定ドロップ。', category:'material', rarity:'common',   stackMax:99, sellPrice:10 },
  [I.EMPTY_MAT_3]:    { id:I.EMPTY_MAT_3,    name:'空の素材3',           emoji:'🌀', description:'空の3素材のひとつ。確定ドロップ。', category:'material', rarity:'common',   stackMax:99, sellPrice:10 },
  [I.CRATE_LEATHER]:  { id:I.CRATE_LEATHER,  name:'革クレート',          emoji:'📦', description:'GGR釣りの基本クレート。',  category:'tool', rarity:'common',   stackMax:99, sellPrice:100 },
  [I.CRATE_GOLD]:     { id:I.CRATE_GOLD,     name:'金クレート',          emoji:'🟨', description:'GGR釣りの金クレート。',    category:'tool', rarity:'uncommon', stackMax:99, sellPrice:500 },
  [I.CRATE_DIAMOND]:  { id:I.CRATE_DIAMOND,  name:'ダイヤクレート',      emoji:'💠', description:'GGR釣りのダイヤクレート。',category:'tool', rarity:'rare',     stackMax:99, sellPrice:2000},
  [I.CRATE_DIAMOND_EX]:{ id:I.CRATE_DIAMOND_EX,name:'強化ダイヤクレート',emoji:'💎', description:'GGR釣りの最高クレート。', category:'tool', rarity:'epic',     stackMax:99, sellPrice:5000},
  [I.ONTIME_TICKET]:  { id:I.ONTIME_TICKET,  name:'オンタイムチケット',  emoji:'🎟️', description:'バフ食料の素材チケット。', category:'material', rarity:'uncommon', stackMax:999, sellPrice:500},
};

// ============================================================
// エリア別アクション（〇〇エリアゾンビ）
// ============================================================
export const SPECIAL_ZOMBIE_ACTIONS: Record<string, FFGGRAction[]> = {
  player_buff: [
    { id:'hp_regen', name:'プレイヤー強化', emoji:'💚', type:'heal_party', weight:100,
      healPct:0.05, message:'プレイヤー強化エリアのゾンビが仲間のHPを回復！' },
  ],
  def_down: [
    { id:'def_debuff', name:'防御低下', emoji:'⬇️', type:'debuff_def', weight:100,
      debuffPct:1.0, debuffTurns:3, message:'防御低下エリアのゾンビが攻撃のダメージを倍化させた！（3ターン）' },
  ],
  weakening: [
    { id:'weaken', name:'弱体化', emoji:'🔽', type:'debuff_atk', weight:100,
      debuffPct:0.3, debuffTurns:3, message:'弱体化エリアのゾンビが128マス範囲内の敵を弱体化！プレイヤーの被ダメが下がった！' },
  ],
};

// ============================================================
// モンスター定義
// ============================================================
export const FFGGR_MONSTERS: Record<string, FFGGRMonster> = {

  // ─── 平原・森・ジャングル共通 ───
  rekisen_wolf: {
    id:'rekisen_wolf', name:'歴戦の狼', emoji:'🐺',
    description:'HPが低く攻撃も普通に通る。初心者向けの敵。',
    areaIds:['plains','forest','jungle','swamp'], maxHp:800, attack:120, defense:30, baseExp:80, baseGold:60, powerLevel:2,
    drops:[
      { itemId:I.GREEN_FRAG,  rate:0.6, min:1, max:3 },
      { itemId:I.AREA_A,      rate:0.08, min:1, max:1 },
      { itemId:I.EMPTY_MAT_1, rate:1.0, min:1, max:1 },
    ],
    actions:[
      { id:'bite',   name:'噛みつき', emoji:'🐺', type:'atk_normal', weight:70, power:1.0 },
      { id:'howl',   name:'遠吠え',   emoji:'🌕', type:'debuff_atk', weight:30, debuffPct:0.1, debuffTurns:1, message:'歴戦の狼が遠吠えした！攻撃力がわずかに下がった...' },
    ],
  },

  elder_trent: {
    id:'elder_trent', name:'エルダートレント', emoji:'🌳',
    description:'枝攻撃がプレイヤーに命中すると自分が300回復する。',
    areaIds:['plains','forest','jungle','swamp'], maxHp:1200, attack:150, defense:60, baseExp:120, baseGold:80, powerLevel:3,
    drops:[
      { itemId:I.GREEN_FRAG,  rate:0.7, min:1, max:4 },
      { itemId:I.AREA_A,      rate:0.10, min:1, max:1 },
      { itemId:I.EMPTY_MAT_2, rate:1.0, min:1, max:1 },
    ],
    actions:[
      { id:'branch',    name:'枝攻撃',     emoji:'🌿', type:'atk_normal', weight:50, power:1.0 },
      { id:'branch_heal',name:'吸収の枝', emoji:'🌿', type:'absorb',     weight:35, power:0.8, message:'エルダートレントの枝が命中！HPを300吸収した！' },
      { id:'root',      name:'根っこ縛り', emoji:'🌱', type:'trap',       weight:15, trapTurns:1, power:0, message:'根っこに絡まれた！次のターン行動不能！' },
    ],
  },

  rapid: {
    id:'rapid', name:'ラピッド', emoji:'⚡',
    description:'HPが高く回復あり。レベルが高いと面倒。',
    areaIds:['plains','forest','jungle'], maxHp:2000, attack:180, defense:80, baseExp:150, baseGold:100, powerLevel:4,
    drops:[
      { itemId:I.GREEN_FRAG,  rate:0.5, min:2, max:5 },
      { itemId:I.GREEN_CRYSTAL,rate:0.05, min:1, max:1 },
      { itemId:I.AREA_A,      rate:0.12, min:1, max:1 },
      { itemId:I.EMPTY_MAT_3, rate:1.0, min:1, max:1 },
    ],
    actions:[
      { id:'rapid_atk',  name:'高速攻撃', emoji:'⚡', type:'atk_multi',  weight:45, hitCount:2, power:0.8 },
      { id:'regen',      name:'自己回復', emoji:'💚', type:'heal_self',   weight:30, healPct:0.08 },
      { id:'normal',     name:'体当たり', emoji:'⚡', type:'atk_normal',  weight:25, power:1.0 },
    ],
  },

  // ─── 雪原② ───
  snow_sniper: {
    id:'snow_sniper', name:'スノースナイパー', emoji:'🎯',
    description:'遠くからちくちくちくちく攻撃してくる。',
    areaIds:['snow'], maxHp:900, attack:200, defense:20, baseExp:130, baseGold:90, powerLevel:3,
    drops:[
      { itemId:I.GREEN_FRAG, rate:0.4, min:1, max:2 },
      { itemId:I.BLUE_FRAG,  rate:0.3, min:1, max:2 },
      { itemId:I.AREA_B,     rate:0.08, min:1, max:1 },
    ],
    actions:[
      { id:'snipe',    name:'スナイプ',   emoji:'🎯', type:'atk_penetrate', weight:50, power:1.3, penetrateDmg:100 },
      { id:'rapid_shot',name:'速射',    emoji:'🏹', type:'atk_multi',      weight:30, hitCount:3, power:0.6 },
      { id:'normal',   name:'射撃',      emoji:'💫', type:'atk_normal',     weight:20, power:1.0 },
    ],
  },

  ice_titan: {
    id:'ice_titan', name:'アイスタイタン', emoji:'🧊', isBoss:true,
    description:'雪原のボス格。スカイラインや投石がよく刺さる。',
    areaIds:['snow'], maxHp:25000, attack:600, defense:200, baseExp:3000, baseGold:5000, powerLevel:5,
    drops:[
      { itemId:I.BLUE_CRYSTAL, rate:0.8, min:1, max:3 },
      { itemId:I.RED_FRAG,     rate:0.5, min:1, max:2 },
      { itemId:I.YELLOW_FRAG,  rate:0.2, min:1, max:1 },
      { itemId:I.AREA_B,       rate:0.5, min:2, max:5 },
      { itemId:I.AREA_B2,      rate:0.05, min:1, max:1 },
      { itemId:I.HEBIYUMI,     rate:0.03, min:1, max:1 },
    ],
    actions:[
      { id:'ice_crush',   name:'氷砕撃',   emoji:'🧊', type:'atk_penetrate', weight:30, power:1.3, penetrateDmg:300 },
      { id:'blizzard',    name:'猛吹雪',   emoji:'❄️', type:'atk_aoe',       weight:20, power:0.9, message:'猛吹雪が全体を叩きつけた！' },
      { id:'glacier',     name:'氷河落下', emoji:'🏔️', type:'atk_normal',    weight:25, power:1.5 },
      { id:'enrage',      name:'氷結激怒', emoji:'💢', type:'buff_enrage',   weight:10, triggerHpPct:0.5, message:'HPが50%以下！アイスタイタンが激怒した！' },
      { id:'ice_regen',   name:'氷結再生', emoji:'💚', type:'heal_self',     weight:15, healPct:0.05, triggerHpPct:0.7 },
    ],
  },

  aratie: {
    id:'aratie', name:'アラティー', emoji:'🌀', isMidBoss:true,
    description:'雪原のレア中ボス。逃げ回るだけだが高HP。攻撃しない。ドロップがうまい。',
    areaIds:['snow','mountain'], maxHp:8000, attack:0, defense:100, baseExp:1500, baseGold:2000, powerLevel:4,
    drops:[
      { itemId:I.BLUE_CRYSTAL, rate:0.6, min:1, max:2 },
      { itemId:I.RED_FRAG,     rate:0.4, min:1, max:2 },
      { itemId:I.YELLOW_FRAG,  rate:0.2, min:1, max:1 },
      { itemId:I.AREA_B,       rate:0.3, min:1, max:3 },
    ],
    actions:[
      { id:'evade', name:'回避行動', emoji:'🌀', type:'debuff_atk', weight:100,
        debuffPct:0.05, debuffTurns:1, message:'アラティーが素早く逃げ回る！命中しにくい！' },
    ],
    traits:['逃走型','攻撃しない','直殴りで削れる'],
  },

  // ─── 沼地③ ───
  slam_i: {
    id:'slam_i', name:'異形のスラムイ', emoji:'🫧',
    description:'HP回復持ち。弱い。',
    areaIds:['swamp'], maxHp:600, attack:80, defense:20, baseExp:60, baseGold:40, powerLevel:2,
    drops:[{ itemId:I.GREEN_FRAG, rate:0.5, min:1, max:2 }, { itemId:I.AREA_C, rate:0.06, min:1, max:1 }],
    actions:[
      { id:'normal', name:'体当たり', emoji:'🫧', type:'atk_normal', weight:60, power:1.0 },
      { id:'regen',  name:'再生',     emoji:'💚', type:'heal_self',  weight:40, healPct:0.10 },
    ],
  },

  doku_eki: {
    id:'doku_eki', name:'ドク疫', emoji:'💜',
    description:'紫色のエフェクトを飛ばしてくる。弱い。',
    areaIds:['swamp'], maxHp:500, attack:100, defense:10, baseExp:70, baseGold:50, powerLevel:2,
    drops:[{ itemId:I.GREEN_FRAG, rate:0.5, min:1, max:2 }, { itemId:I.AREA_C, rate:0.06, min:1, max:1 }],
    actions:[
      { id:'poison_shot', name:'毒液散布', emoji:'💜', type:'atk_dot', weight:60, power:0.8, dotDamage:60, dotTurns:3 },
      { id:'normal',      name:'突進',     emoji:'💜', type:'atk_normal', weight:40, power:1.0 },
    ],
  },

  doku_hebi: {
    id:'doku_hebi', name:'毒蛇', emoji:'🐍',
    description:'沼地の非常に凶悪な敵。高いHPを持ち逆ヒールでどんどん削ってくる。絡まれたら逃走推奨。',
    areaIds:['swamp'], maxHp:3500, attack:280, defense:60, baseExp:300, baseGold:200, powerLevel:5,
    drops:[
      { itemId:I.BLUE_FRAG,  rate:0.4, min:1, max:2 },
      { itemId:I.AREA_C,     rate:0.15, min:1, max:2 },
      { itemId:I.HEBIYUMI,   rate:0.01, min:1, max:1 },
    ],
    actions:[
      { id:'venom_bite', name:'猛毒の牙',  emoji:'🐍', type:'atk_dot',      weight:35, power:0.8, dotDamage:100, dotTurns:3, message:'毒蛇が猛毒を注入！3ターン毎ターン100ダメージ！' },
      { id:'absorb',     name:'逆ヒール', emoji:'🔴', type:'absorb',        weight:35, power:1.0, message:'毒蛇が逆ヒールを発動！ダメージがHPに変換された！' },
      { id:'normal',     name:'噛みつき', emoji:'🐍', type:'atk_normal',    weight:30, power:1.0 },
    ],
    traits:['逆ヒール持ち','要注意'],
  },

  hydra: {
    id:'hydra', name:'ヒュドラ', emoji:'🐲', isBoss:true,
    description:'沼地のボス格。直殴りでよく削れる。毒蛇を召喚する。',
    areaIds:['swamp'], maxHp:30000, attack:700, defense:180, baseExp:3500, baseGold:6000, powerLevel:5,
    drops:[
      { itemId:I.BLUE_CRYSTAL,  rate:0.8, min:1, max:3 },
      { itemId:I.RED_FRAG,      rate:0.5, min:1, max:3 },
      { itemId:I.AREA_C,        rate:0.5, min:2, max:5 },
      { itemId:I.AREA_C2,       rate:0.05, min:1, max:1 },
      { itemId:I.HEBIYUMI,      rate:0.05, min:1, max:1 },
    ],
    actions:[
      { id:'multi_bite',  name:'多頭噛み',  emoji:'🐲', type:'atk_multi',    weight:35, hitCount:3, power:0.65 },
      { id:'summon_snake',name:'毒蛇召喚', emoji:'🐍', type:'summon',        weight:25, summonId:'doku_hebi', summonCount:2, message:'ヒュドラが毒蛇を2匹召喚した！' },
      { id:'regen',       name:'首の再生', emoji:'💚', type:'heal_self',     weight:20, healPct:0.08, triggerHpPct:0.7, message:'ヒュドラの首が再生した！HPを回復！' },
      { id:'normal',      name:'噛みつき', emoji:'🐲', type:'atk_normal',    weight:20, power:1.0 },
    ],
  },

  // ─── 荒野④ ───
  boomerang: {
    id:'boomerang', name:'ブーメラン', emoji:'🪃',
    description:'なんか飛ばしてくる。ノックバックする。',
    areaIds:['wasteland'], maxHp:700, attack:160, defense:30, baseExp:100, baseGold:70, powerLevel:3,
    drops:[{ itemId:I.GREEN_FRAG, rate:0.5, min:1, max:2 }, { itemId:I.AREA_D, rate:0.08, min:1, max:1 }],
    actions:[
      { id:'throw',    name:'投擲',         emoji:'🪃', type:'atk_penetrate', weight:50, power:1.1, penetrateDmg:50 },
      { id:'knockback',name:'ノックバック', emoji:'💨', type:'debuff_def',    weight:30, debuffPct:0.2, debuffTurns:1 },
      { id:'normal',   name:'突進',         emoji:'🪃', type:'atk_normal',   weight:20, power:1.0 },
    ],
  },

  slowly: {
    id:'slowly', name:'スローリー', emoji:'🌀',
    description:'貫通攻撃をしてくる。ノックバックさせてくる。',
    areaIds:['wasteland'], maxHp:800, attack:180, defense:40, baseExp:110, baseGold:75, powerLevel:3,
    drops:[{ itemId:I.GREEN_FRAG, rate:0.5, min:1, max:2 }, { itemId:I.AREA_D, rate:0.08, min:1, max:1 }],
    actions:[
      { id:'penetrate', name:'貫通打',       emoji:'🌀', type:'atk_penetrate', weight:55, power:1.0, penetrateDmg:80 },
      { id:'knockback', name:'吹き飛ばし',   emoji:'💨', type:'debuff_atk',    weight:30, debuffPct:0.15, debuffTurns:1 },
      { id:'normal',    name:'突進',         emoji:'🌀', type:'atk_normal',    weight:15, power:1.0 },
    ],
  },

  grace_spider: {
    id:'grace_spider', name:'グレースパイダー', emoji:'🕷️',
    description:'高めの攻撃力・回復力を持つ。面倒。',
    areaIds:['wasteland'], maxHp:2500, attack:220, defense:70, baseExp:200, baseGold:150, powerLevel:4,
    drops:[
      { itemId:I.GREEN_FRAG,   rate:0.4, min:1, max:3 },
      { itemId:I.BLUE_FRAG,    rate:0.2, min:1, max:1 },
      { itemId:I.AREA_D,       rate:0.10, min:1, max:1 },
    ],
    actions:[
      { id:'web',    name:'蜘蛛の糸', emoji:'🕸️', type:'trap',      weight:35, trapTurns:1, power:0, message:'クモの糸で絡め取られた！次のターン行動不能！' },
      { id:'poison', name:'毒爪',     emoji:'💜', type:'atk_dot',   weight:30, power:0.9, dotDamage:80, dotTurns:2 },
      { id:'regen',  name:'吸血回復', emoji:'💚', type:'heal_self', weight:20, healPct:0.07 },
      { id:'normal', name:'爪攻撃',   emoji:'🕷️', type:'atk_normal',weight:15, power:1.0 },
    ],
  },

  master_spider: {
    id:'master_spider', name:'マスタースパイダー', emoji:'🦂',
    description:'グレースパイダーの強化版。HPが5倍程度。',
    areaIds:['wasteland'], maxHp:12000, attack:280, defense:100, baseExp:500, baseGold:400, powerLevel:5,
    drops:[
      { itemId:I.BLUE_FRAG,  rate:0.5, min:1, max:3 },
      { itemId:I.RED_FRAG,   rate:0.2, min:1, max:1 },
      { itemId:I.AREA_D,     rate:0.15, min:1, max:2 },
    ],
    actions:[
      { id:'web',     name:'超強力蜘蛛の糸', emoji:'🕸️', type:'trap',      weight:30, trapTurns:2, power:0, message:'超強力なクモの糸！2ターン行動不能！' },
      { id:'venom',   name:'猛毒',          emoji:'💜', type:'atk_dot',   weight:30, power:1.0, dotDamage:120, dotTurns:3 },
      { id:'enrage',  name:'激怒',          emoji:'💢', type:'buff_enrage',weight:10, triggerHpPct:0.5 },
      { id:'multi',   name:'多脚連打',       emoji:'🦂', type:'atk_multi', weight:20, hitCount:4, power:0.6 },
      { id:'normal',  name:'爪攻撃',        emoji:'🦂', type:'atk_normal',weight:10, power:1.2 },
    ],
  },

  kiken_zoudai: {
    id:'kiken_zoudai', name:'危険度増大中', emoji:'⚠️',
    description:'HPが高く貫通混じりの爆発エフェクトを大量に出してくる。面倒。',
    areaIds:['wasteland'], maxHp:5000, attack:300, defense:80, baseExp:400, baseGold:300, powerLevel:5,
    drops:[
      { itemId:I.BLUE_FRAG,  rate:0.5, min:2, max:4 },
      { itemId:I.AREA_D,     rate:0.12, min:1, max:2 },
    ],
    actions:[
      { id:'explosion',  name:'爆発散弾',  emoji:'💥', type:'atk_aoe',       weight:40, power:1.2, message:'危険度増大中が爆発！全体を攻撃！' },
      { id:'penetrate',  name:'貫通弾',    emoji:'⚡', type:'atk_penetrate', weight:35, power:1.0, penetrateDmg:150 },
      { id:'normal',     name:'体当たり', emoji:'⚠️', type:'atk_normal',    weight:25, power:1.0 },
    ],
  },

  hyper_inflation: {
    id:'hyper_inflation', name:'ハイパーインフレーション', emoji:'💰', isBoss:true,
    description:'荒野のボス格。卓越したHP。人を呼んで直殴りでぼこぼこにしよう。',
    areaIds:['wasteland'], maxHp:80000, attack:800, defense:250, baseExp:5000, baseGold:10000, powerLevel:5,
    drops:[
      { itemId:I.BLUE_CRYSTAL,  rate:0.7, min:1, max:3 },
      { itemId:I.RED_FRAG,      rate:0.6, min:2, max:5 },
      { itemId:I.YELLOW_FRAG,   rate:0.3, min:1, max:2 },
      { itemId:I.AREA_D,        rate:0.6, min:3, max:8 },
      { itemId:I.AREA_D2,       rate:0.05, min:1, max:1 },
      { itemId:I.RYOIKIKO,      rate:0.04, min:1, max:1 },
    ],
    actions:[
      { id:'economic_crash', name:'経済崩壊', emoji:'📉', type:'atk_aoe',       weight:30, power:1.5, message:'ハイパーインフレーションが経済崩壊を引き起こした！全体大ダメージ！' },
      { id:'heavy_blow',     name:'剛撃',     emoji:'💥', type:'atk_penetrate', weight:30, power:2.0, penetrateDmg:500 },
      { id:'enrage',         name:'暴走',     emoji:'💢', type:'buff_enrage',   weight:10, triggerHpPct:0.4 },
      { id:'debuff_def',     name:'デフレ打',  emoji:'💸', type:'debuff_def',   weight:15, debuffPct:0.3, debuffTurns:2 },
      { id:'normal',         name:'体当たり', emoji:'💰', type:'atk_normal',   weight:15, power:1.0 },
    ],
  },

  // ─── 洞窟⑤ ───
  iwark: {
    id:'iwark', name:'イワーク', emoji:'🪨',
    description:'洞窟エリアの癒し。弱い。',
    areaIds:['cave'], maxHp:400, attack:60, defense:150, baseExp:50, baseGold:30, powerLevel:1,
    drops:[{ itemId:I.GREEN_FRAG, rate:0.4, min:1, max:2 }, { itemId:I.AREA_E, rate:0.05, min:1, max:1 }],
    actions:[
      { id:'roll',  name:'ローリング', emoji:'🪨', type:'atk_normal', weight:80, power:0.8 },
      { id:'guard', name:'岩の守り',  emoji:'🛡️', type:'heal_self',  weight:20, healPct:0.03 },
    ],
    traits:['物理防御超高'],
  },

  iwa_wo_mo_ugatsu: {
    id:'iwa_wo_mo_ugatsu', name:'岩をも穿つ', emoji:'🦅',
    description:'飛んでいて物理無効＋そこそこ痛い遠距離攻撃をしてくる。しつこい。',
    areaIds:['cave','mountain'], maxHp:1500, attack:250, defense:0, baseExp:200, baseGold:150, powerLevel:5,
    drops:[
      { itemId:I.BLUE_FRAG,  rate:0.4, min:1, max:2 },
      { itemId:I.AREA_E,     rate:0.10, min:1, max:1 },
    ],
    traits:['飛行中は物理無効','貫通攻撃は有効'],
    actions:[
      { id:'fly_atk',   name:'飛翔突撃',  emoji:'🦅', type:'fly',           weight:30, message:'岩をも穿つが飛翔中！物理攻撃が届かない！（貫通は有効）' },
      { id:'drill_shot',name:'穿孔弾',    emoji:'💎', type:'atk_penetrate', weight:40, power:1.2, penetrateDmg:200 },
      { id:'normal',    name:'突進',      emoji:'🦅', type:'atk_normal',    weight:30, power:1.0 },
    ],
  },

  tenjuri: {
    id:'tenjuri', name:'天丼', emoji:'🍜',
    description:'ふざけた名前だがボス格に勝る圧倒的な攻撃力・物理ダメージ軽減。要注意。',
    areaIds:['cave','mountain'], maxHp:8000, attack:500, defense:300, baseExp:600, baseGold:500, powerLevel:5,
    drops:[
      { itemId:I.BLUE_FRAG,  rate:0.5, min:2, max:4 },
      { itemId:I.RED_FRAG,   rate:0.2, min:1, max:2 },
      { itemId:I.AREA_E,     rate:0.15, min:1, max:2 },
    ],
    traits:['物理ダメージ軽減'],
    actions:[
      { id:'heavy_slam', name:'天丼撃', emoji:'🍜', type:'atk_normal',   weight:50, power:2.0 },
      { id:'penetrate',  name:'貫通撃', emoji:'💥', type:'atk_penetrate',weight:30, power:1.5, penetrateDmg:300 },
      { id:'guard',      name:'防御',   emoji:'🛡️', type:'heal_self',    weight:20, healPct:0.05 },
    ],
  },

  philosopher_stone: {
    id:'philosopher_stone', name:"philosopher'S stone", emoji:'🔮', isBoss:true,
    description:'洞窟のボス格。地面から石を生やしてプレイヤーを拘束＋ダメージ。',
    areaIds:['cave'], maxHp:35000, attack:650, defense:220, baseExp:4000, baseGold:8000, powerLevel:5,
    drops:[
      { itemId:I.BLUE_CRYSTAL,  rate:0.7, min:1, max:3 },
      { itemId:I.RED_FRAG,      rate:0.6, min:2, max:4 },
      { itemId:I.YELLOW_FRAG,   rate:0.2, min:1, max:2 },
      { itemId:I.AREA_E,        rate:0.5, min:2, max:5 },
      { itemId:I.AREA_E2,       rate:0.04, min:1, max:1 },
      { itemId:I.TOUSEKI,       rate:0.04, min:1, max:1 },
      { itemId:I.KATANA_BLUE,   rate:0.02, min:1, max:1 },
    ],
    actions:[
      { id:'stone_trap',  name:'石柱拘束',  emoji:'⛏️', type:'trap',          weight:30, trapTurns:1, power:0.5, message:'石柱がプレイヤーを拘束！次のターン行動不能！' },
      { id:'stone_aoe',   name:'石礫散弾', emoji:'💥', type:'atk_aoe',       weight:25, power:0.9, message:'石礫が全体に降り注いだ！' },
      { id:'stone_heavy', name:'岩盤砕き', emoji:'🔮', type:'atk_penetrate', weight:25, power:1.5, penetrateDmg:400 },
      { id:'enrage',      name:'岩盤覚醒', emoji:'💢', type:'buff_enrage',   weight:10, triggerHpPct:0.3, message:'残HP30%以下！philosopher\'S stoneが覚醒した！' },
      { id:'normal',      name:'石の一撃', emoji:'🪨', type:'atk_normal',   weight:10, power:1.0 },
    ],
  },

  same_ga_kuruga: {
    id:'same_ga_kuruga', name:'サメガクルガ〔希少種〕', emoji:'🦈', isBoss:true, isRareBoss:true,
    description:'洞窟のレアボス。HP50000超・吸い込み・逆ヒール・高速移動。',
    areaIds:['cave'], maxHp:52000, attack:900, defense:300, baseExp:8000, baseGold:20000, powerLevel:5,
    drops:[
      { itemId:I.BLUE_CRYSTAL,   rate:1.0, min:2, max:5 },
      { itemId:I.RED_CRYSTAL,    rate:0.5, min:1, max:2 },
      { itemId:I.YELLOW_FRAG,    rate:0.5, min:2, max:4 },
      { itemId:I.AREA_E,         rate:0.8, min:3, max:8 },
      { itemId:I.AREA_E2,        rate:0.2, min:1, max:2 },
      { itemId:I.TOUSEKI,        rate:0.08, min:1, max:1 },
      { itemId:I.KATANA_BLUE,    rate:0.05, min:1, max:1 },
    ],
    traits:['超高HP','吸い込み','逆ヒール','高速移動'],
    actions:[
      { id:'suck',     name:'吸い込み',  emoji:'🌀', type:'atk_penetrate', weight:30, power:1.8, penetrateDmg:500, message:'サメガクルガが吸い込んだ！貫通大ダメージ！' },
      { id:'absorb',   name:'逆ヒール', emoji:'🔴', type:'absorb',        weight:25, power:1.3, message:'逆ヒールを発動！ダメージがHPに変換された！' },
      { id:'dash',     name:'高速移動', emoji:'💨', type:'debuff_atk',    weight:20, debuffPct:0.25, debuffTurns:2, message:'高速移動でかく乱！攻撃命中率が下がった！' },
      { id:'enrage',   name:'飢餓覚醒', emoji:'💢', type:'buff_enrage',  weight:10, triggerHpPct:0.5 },
      { id:'bite',     name:'噛みつき', emoji:'🦈', type:'atk_normal',   weight:15, power:1.5 },
    ],
  },

  // ─── 火山⑥ ───
  mag_quey: {
    id:'mag_quey', name:'マグキュイ', emoji:'🔥',
    description:'HP高めのマグマキューブ。高速で飛び回り爆発する火炎弾を連射する。',
    areaIds:['volcano'], maxHp:2200, attack:260, defense:50, baseExp:250, baseGold:200, powerLevel:5,
    drops:[
      { itemId:I.RED_FRAG,    rate:0.4, min:1, max:2 },
      { itemId:I.AREA_F,      rate:0.10, min:1, max:1 },
    ],
    actions:[
      { id:'fireball_burst', name:'火炎弾連射', emoji:'🔥', type:'atk_multi',      weight:45, hitCount:4, power:0.7, message:'マグキュイが火炎弾を連射！4連続攻撃！' },
      { id:'explosion',      name:'大爆発',     emoji:'💥', type:'atk_aoe',        weight:30, power:1.4, message:'マグキュイが大爆発！全体に大ダメージ！' },
      { id:'normal',         name:'体当たり',   emoji:'🔥', type:'atk_normal',     weight:25, power:1.0 },
    ],
  },

  fangurame: {
    id:'fangurame', name:'ファングラモ', emoji:'⬛',
    description:'地面に潜り下からソウルサンドを生やして拘束。非常に面倒。',
    areaIds:['volcano'], maxHp:1800, attack:200, defense:80, baseExp:200, baseGold:160, powerLevel:5,
    drops:[
      { itemId:I.RED_FRAG,   rate:0.4, min:1, max:2 },
      { itemId:I.AREA_F,     rate:0.10, min:1, max:1 },
    ],
    traits:['ソウルサンド設置','行動妨害特化'],
    actions:[
      { id:'soul_sand', name:'ソウルサンド生成', emoji:'⬛', type:'trap',      weight:50, trapTurns:2, power:0.3, message:'ファングラモが地中からソウルサンドを生やした！2ターン行動不能！' },
      { id:'ambush',    name:'地中からの奇襲',   emoji:'💥', type:'atk_penetrate', weight:30, power:1.3, penetrateDmg:200 },
      { id:'normal',    name:'突進',             emoji:'⬛', type:'atk_normal',    weight:20, power:1.0 },
    ],
  },

  phoenix_lieutenant: {
    id:'phoenix_lieutenant', name:'不死鳥の幹部', emoji:'🦜', isMidBoss:true,
    description:'火山の中ボス。ターゲットに向かって高ダメージの火炎放射。少し防御力が高い。',
    areaIds:['volcano','mountain'], maxHp:12000, attack:550, defense:200, baseExp:1200, baseGold:1500, powerLevel:5,
    drops:[
      { itemId:I.RED_CRYSTAL,     rate:0.3, min:1, max:2 },
      { itemId:I.AREA_F,          rate:0.2, min:1, max:3 },
      { itemId:I.AREA_F_POWDER,   rate:0.05, min:1, max:1 },
    ],
    actions:[
      { id:'flamethrower', name:'火炎放射',   emoji:'🔥', type:'atk_aoe',       weight:45, power:1.6, message:'不死鳥の幹部が火炎放射！全体に高ダメージ！' },
      { id:'dive_bomb',    name:'急降下爆撃', emoji:'💥', type:'atk_penetrate', weight:35, power:1.4, penetrateDmg:300 },
      { id:'normal',       name:'翼攻撃',     emoji:'🦜', type:'atk_normal',    weight:20, power:1.0 },
    ],
  },

  phoenix_dan: {
    id:'phoenix_dan', name:'不死鳥の騎士 ダン', emoji:'⚔️', isMidBoss:true,
    description:'火山の中ボス。物理無効＋回復＋剣を降らす＋高速移動。MMが死ぬ時間制限あり。対策: 高火力貫通攻撃を剣降らし後に。',
    areaIds:['volcano','mountain'], maxHp:20000, attack:700, defense:0, baseExp:2000, baseGold:3000, powerLevel:5,
    drops:[
      { itemId:I.RED_CRYSTAL,   rate:0.4, min:1, max:2 },
      { itemId:I.YELLOW_FRAG,   rate:0.2, min:1, max:2 },
      { itemId:I.AREA_F,        rate:0.3, min:2, max:5 },
      { itemId:I.AREA_F_POWDER, rate:0.08, min:1, max:1 },
      { itemId:I.AREA_F_ROD,    rate:0.03, min:1, max:1 },
    ],
    traits:['物理無効','回復持ち','時間制限あり（MMが死ぬ）'],
    actions:[
      { id:'fly_mode',     name:'飛行形態',  emoji:'🦅', type:'fly',           weight:25, triggerTurnMod:3, message:'ダンが上空へ飛翔！物理攻撃が届かない！（貫通攻撃は有効）' },
      { id:'sword_rain',   name:'天空剣雨',  emoji:'⚔️', type:'atk_aoe',       weight:30, power:1.6, message:'ダンが空から剣を降らせた！全体に大ダメージ！（剣雨後は高火力貫通チャンス！）' },
      { id:'immortal_regen',name:'不死の回復',emoji:'💚', type:'heal_self',    weight:25, healPct:0.07 },
      { id:'dash_slash',   name:'高速斬撃',  emoji:'⚡', type:'atk_multi',     weight:20, hitCount:2, power:0.9 },
    ],
  },

  // ─── 山岳⑦ ───
  mana_great_spirit: {
    id:'mana_great_spirit', name:'マナの大精霊', emoji:'🌈', isBoss:true,
    description:'山岳のボス格。各種攻撃・召喚スキル＋恵みの雨（回復）。',
    areaIds:['mountain'], maxHp:40000, attack:550, defense:200, baseExp:4500, baseGold:9000, powerLevel:5,
    drops:[
      { itemId:I.BLUE_CRYSTAL,  rate:0.8, min:1, max:3 },
      { itemId:I.RED_CRYSTAL,   rate:0.3, min:1, max:2 },
      { itemId:I.YELLOW_FRAG,   rate:0.4, min:2, max:5 },
      { itemId:I.MANADRAIN,     rate:0.05, min:1, max:1 },
    ],
    actions:[
      { id:'blessing_rain', name:'恵みの雨',   emoji:'🌧️', type:'heal_self',   weight:25, healPct:0.12, message:'マナの大精霊が恵みの雨を降らせた！HPを大回復！' },
      { id:'mana_burst',    name:'マナ爆発',   emoji:'✨', type:'atk_aoe',      weight:25, power:1.4, message:'マナ爆発！全体に魔法攻撃！' },
      { id:'summon_spirit', name:'精霊召喚',   emoji:'🌟', type:'summon',       weight:20, summonId:'rapid', summonCount:2, message:'マナの大精霊が精霊を2体召喚した！' },
      { id:'mana_beam',     name:'マナビーム', emoji:'💫', type:'atk_penetrate',weight:20, power:1.3, penetrateDmg:250 },
      { id:'normal',        name:'霊圧',       emoji:'🌈', type:'atk_normal',  weight:10, power:1.0 },
    ],
  },

  // ─── 〇〇エリアゾンビ（特殊） ───
  zombie_player_buff: {
    id:'zombie_player_buff', name:'プレイヤー強化エリア', emoji:'💚', isSpecialZombie:true,
    description:'定期的にプレイヤーのHPを回復してくれる。生存に貢献。',
    areaIds:['plains','snow','swamp','wasteland','cave','volcano','mountain','forest','jungle','abyss'],
    maxHp:500, attack:0, defense:50, baseExp:200, baseGold:100, powerLevel:1,
    drops:[{ itemId:I.GREEN_FRAG, rate:0.3, min:1, max:2 }],
    actions:[
      { id:'player_regen', name:'プレイヤー強化', emoji:'💚', type:'heal_party', weight:100, healPct:0.05,
        message:'プレイヤー強化エリアのゾンビがHPを回復してくれた！（最大HP×5%）' },
    ],
    traits:['プレイヤーを回復する（敵だが有益）'],
  },

  zombie_def_down: {
    id:'zombie_def_down', name:'防御低下エリア', emoji:'⬇️', isSpecialZombie:true,
    description:'敵に定期的に直接攻撃・飛び道具のダメージを倍化する効果を付与。重複不可。',
    areaIds:['plains','snow','swamp','wasteland','cave','volcano','mountain','forest','jungle','abyss'],
    maxHp:500, attack:50, defense:50, baseExp:200, baseGold:100, powerLevel:1,
    drops:[{ itemId:I.GREEN_FRAG, rate:0.3, min:1, max:2 }],
    actions:[
      { id:'def_down_aura', name:'防御低下オーラ', emoji:'⬇️', type:'debuff_def', weight:100,
        debuffPct:1.0, debuffTurns:3,
        message:'防御低下エリアのゾンビが敵の防御を低下させた！攻撃ダメージが倍化！（3ターン、重複不可）' },
    ],
  },

  zombie_weaken: {
    id:'zombie_weaken', name:'弱体化エリア', emoji:'🔽', isSpecialZombie:true,
    description:'128マス範囲内の敵に弱体化を付与。プレイヤーの被ダメを下げる。',
    areaIds:['plains','snow','swamp','wasteland','cave','volcano','mountain','forest','jungle','abyss'],
    maxHp:500, attack:50, defense:50, baseExp:200, baseGold:100, powerLevel:1,
    drops:[{ itemId:I.GREEN_FRAG, rate:0.3, min:1, max:2 }],
    actions:[
      { id:'weaken_aura', name:'弱体化オーラ', emoji:'🔽', type:'debuff_atk', weight:100,
        debuffPct:0.3, debuffTurns:3,
        message:'弱体化エリアのゾンビが128マス範囲内の敵を弱体化！プレイヤーの被ダメが30%減少！（3ターン）' },
    ],
  },
};

// ============================================================
// エリアマスター
// ============================================================
export const FFGGR_AREAS: Record<FFGGRAreaId, FFGGRArea> = {
  plains: {
    id:'plains', name:'平原エリア ①', emoji:'🌾', color:'rgba(80,100,30,0.4)',
    description:'なだらかな地形で非常に戦いやすい。FFGGR拠点がある。各種強化村人NPC多数。レイドTP拠点。',
    monsterIds:['rekisen_wolf','elder_trent','rapid','zombie_player_buff','zombie_def_down','zombie_weaken'],
    bossId:'hyper_inflation', fixedDropId:I.AREA_A,
    recommendedDef:200,
    tips:'FFGGR拠点の上空にハイパーインフレーションが出没する。無限TPには千両箱×16が必要。',
  },
  snow: {
    id:'snow', name:'雪原エリア ②', emoji:'❄️', color:'rgba(50,80,120,0.4)',
    description:'大きな雪山とその周りに木が生えているエリア。GGR内で最も人気が高い。',
    monsterIds:['snow_sniper','zombie_player_buff','zombie_def_down','zombie_weaken'],
    bossId:'ice_titan', midBossIds:['aratie'], fixedDropId:I.AREA_B,
    recommendedDef:300,
    tips:'アイスタイタンは攻撃力がそれほど高くなく狩りやすい。アラティーは逃げ回るだけなので殴り続けよう。',
  },
  swamp: {
    id:'swamp', name:'沼地エリア ③', emoji:'🌿', color:'rgba(30,70,40,0.4)',
    description:'あまり人気がない。毒蛇が非常に凶悪。絡まれたら逃走推奨。',
    monsterIds:['rekisen_wolf','elder_trent','slam_i','doku_eki','doku_hebi','zombie_player_buff','zombie_def_down','zombie_weaken'],
    bossId:'hydra', fixedDropId:I.AREA_C,
    recommendedDef:350,
    tips:'毒蛇の逆ヒールに注意。ヒュドラは直殴りが効く。蛇弓・ヒュドラ装備は現環境では微妙。',
  },
  wasteland: {
    id:'wasteland', name:'荒野エリア ④', emoji:'🏜️', color:'rgba(100,70,20,0.4)',
    description:'GGR拠点横にあるメサ地形のエリア。領域光のレア泥が需要高め。',
    monsterIds:['boomerang','slowly','grace_spider','master_spider','kiken_zoudai','zombie_player_buff','zombie_def_down','zombie_weaken'],
    bossId:'hyper_inflation', fixedDropId:I.AREA_D,
    recommendedDef:400,
    tips:'領域光はかなり強力な武器。レア泥狙いで周回される人気エリア。',
  },
  cave: {
    id:'cave', name:'洞窟エリア ⑤', emoji:'🪨', color:'rgba(50,50,50,0.5)',
    description:'上下左右一面が石や鉱石のエリア。人気が高くレア泥が豊富。',
    monsterIds:['iwark','iwa_wo_mo_ugatsu','tenjuri','zombie_player_buff','zombie_def_down','zombie_weaken'],
    bossId:'philosopher_stone', rareBossId:'same_ga_kuruga', fixedDropId:I.AREA_E,
    recommendedDef:450,
    tips:'投石・剣のレア泥が美味しい。天丼は名前に騙されずに注意。サメガクルガは超高HPレアボス。',
  },
  volcano: {
    id:'volcano', name:'火山地帯エリア ⑥', emoji:'🌋', color:'rgba(150,50,20,0.4)',
    description:'戦いにくい地形。飛び道具や地形攻撃の敵多く防具が必要。固有ドロップFが目的。',
    monsterIds:['mag_quey','fangurame','zombie_player_buff','zombie_def_down','zombie_weaken'],
    midBossIds:['phoenix_lieutenant','phoenix_dan'], fixedDropId:I.AREA_F,
    recommendedDef:500,
    tips:'固有F(パウダー・ロッド)はレア泥で希少。ダンは物理無効+回復で厄介。剣雨後に高火力貫通が有効。',
  },
  mountain: {
    id:'mountain', name:'山岳エリア ⑦', emoji:'⛰️', color:'rgba(60,60,80,0.4)',
    description:'FFGGからやってきたプレイヤーが最初に来るエリア。フィーバー中に弱体化雑魚が大量スポーン。',
    monsterIds:['rekisen_wolf','elder_trent','rapid','iwark','iwa_wo_mo_ugatsu','tenjuri','doku_hebi','zombie_player_buff','zombie_def_down','zombie_weaken'],
    bossId:'mana_great_spirit', midBossIds:['aratie','phoenix_lieutenant','phoenix_dan'],
    recommendedDef:300,
    tips:'レイド開催値稼ぎや緑系素材収集に最適。マナドレインがボスのレア泥。弱体化雑魚は出てきたら無視が安定。',
  },
  forest: {
    id:'forest', name:'森エリア ⑧', emoji:'🌳', color:'rgba(20,60,20,0.4)',
    description:'拠点と雪山の間。平原と同じ敵。木の実が生成され「取れる君」で採取可能（1日32個）。',
    monsterIds:['rekisen_wolf','elder_trent','rapid','zombie_player_buff','zombie_def_down','zombie_weaken'],
    fixedDropId:I.AREA_A,
    recommendedDef:200,
    tips:'木の実採取は1日32個まで。甘いフルーツ(特大)の素材として重要。GGRポイント10消費で4回追加可能。',
  },
  jungle: {
    id:'jungle', name:'ジャングルエリア ⑨', emoji:'🌴', color:'rgba(10,80,30,0.4)',
    description:'池と川あり。上へ登ると夢幻のエクスカリバー取引場所がある（スキル未実装）。',
    monsterIds:['rekisen_wolf','elder_trent','rapid','zombie_player_buff','zombie_def_down','zombie_weaken'],
    fixedDropId:I.AREA_A,
    recommendedDef:200,
    tips:'池・川を登り続けると夢幻のエクスカリバーの取引場所がある。スキルは未実装。',
  },
  abyss: {
    id:'abyss', name:'奈落地帯 ⑩', emoji:'🕳️', color:'rgba(20,10,40,0.5)',
    description:'深淵の奈落。詳細は謎に包まれている。（将来実装予定）',
    monsterIds:[],
    recommendedDef:999,
    tips:'将来実装予定。現在は立入不可。',
  },
};

// ============================================================
// クレート定義
// ============================================================
export const FFGGR_CRATES: Record<string, FFGGRCrateGrade> = {
  leather: {
    id:'leather', name:'革クレート', emoji:'📦',
    baseDrop:[I.GREEN_FRAG],
    additionalCost:50000,
    additionalDrop:[I.BLUE_FRAG, I.RAJUICE, I.TP_CONSUME, I.RESCUE_CONSUME],
    ffggrPointGain:1,
  },
  gold: {
    id:'gold', name:'金クレート', emoji:'🟨',
    baseDrop:[I.BLUE_FRAG],
    additionalCost:200000,
    additionalDrop:[I.RED_FRAG, I.RAJUICE, I.TP_CONSUME, I.RESCUE_CONSUME],
    ffggrPointGain:2,
  },
  diamond: {
    id:'diamond', name:'ダイヤクレート', emoji:'💠',
    baseDrop:[I.RED_FRAG],
    additionalCost:1000000,
    additionalDrop:[I.YELLOW_FRAG, I.RAJUICE, I.TP_CONSUME, I.RESCUE_CONSUME, I.TOUSEKI, I.MANADRAIN],
    ffggrPointGain:5,
  },
  diamond_ex: {
    id:'diamond_ex', name:'強化ダイヤクレート', emoji:'💎',
    baseDrop:[I.YELLOW_FRAG],
    additionalCost:3000000,
    additionalDrop:[I.YELLOW_FRAG, I.RAJUICE, I.TP_CONSUME, I.RESCUE_CONSUME, I.TOUSEKI, I.MANADRAIN, I.RYOIKIKO],
    ffggrPointGain:10,
  },
};

// ============================================================
// NPC取引
// ============================================================
export const FFGGR_SHOPS: FFGGRNPCShop[] = [
  {
    id:'onihenkan', name:'行商人（鬼変換）', emoji:'👹',
    description:'欠片を上位の欠片に変換。レートは鬼変換。',
    trades:[
      { id:'g2b', slot1ItemId:I.GREEN_FRAG, slot1Amount:32, resultItemId:I.BLUE_FRAG,   resultAmount:1 },
      { id:'b2r', slot1ItemId:I.BLUE_FRAG,  slot1Amount:32, resultItemId:I.RED_FRAG,    resultAmount:1 },
      { id:'r2y', slot1ItemId:I.RED_FRAG,   slot1Amount:32, resultItemId:I.YELLOW_FRAG, resultAmount:1 },
    ],
  },
  {
    id:'green_trader', name:'行商人（Green）', emoji:'🟢',
    description:'緑の欠片の強化取引。',
    trades:[
      { id:'gc1', slot1ItemId:I.GREEN_FRAG,    slot1Amount:32, resultItemId:I.GREEN_CRYSTAL, resultAmount:1 },
      { id:'gc2', slot1ItemId:I.GREEN_CRYSTAL, slot1Amount:32, slot2ItemId:I.GREEN_SCALE_LOW,  slot2Amount:10, resultItemId:I.GREEN_GEM,    resultAmount:1 },
      { id:'gc3', slot1ItemId:I.GREEN_GEM,     slot1Amount:16, slot2ItemId:I.GREEN_SCALE_HIGH, slot2Amount:12, resultItemId:I.GREEN_JEWEL,  resultAmount:1 },
    ],
  },
  {
    id:'blue_trader', name:'行商人（Blue）', emoji:'🔵',
    description:'青の欠片の強化取引。',
    trades:[
      { id:'bc1', slot1ItemId:I.BLUE_FRAG,    slot1Amount:32, resultItemId:I.BLUE_CRYSTAL,  resultAmount:1 },
      { id:'bc2', slot1ItemId:I.BLUE_CRYSTAL,  slot1Amount:64, slot2ItemId:I.BLUE_SCALE_LOW,  slot2Amount:10, resultItemId:I.BLUE_GEM,  resultAmount:1 },
      { id:'bc3', slot1ItemId:I.BLUE_GEM,      slot1Amount:16, slot2ItemId:I.BLUE_SCALE_HIGH, slot2Amount:12, resultItemId:I.BLUE_JEWEL,resultAmount:1 },
    ],
  },
  {
    id:'red_trader', name:'行商人（Red）', emoji:'🔴',
    description:'赤の欠片の強化取引。',
    trades:[
      { id:'rc1', slot1ItemId:I.RED_FRAG,    slot1Amount:32, resultItemId:I.RED_CRYSTAL,  resultAmount:1 },
      { id:'rc2', slot1ItemId:I.RED_CRYSTAL,  slot1Amount:24, slot2ItemId:I.RED_SCALE_LOW,  slot2Amount:10, resultItemId:I.RED_GEM,  resultAmount:1 },
      { id:'rc3', slot1ItemId:I.RED_GEM,      slot1Amount:16, slot2ItemId:I.RED_SCALE_HIGH, slot2Amount:12, resultItemId:I.RED_JEWEL,resultAmount:1 },
    ],
  },
  {
    id:'yellow_trader', name:'行商人（Yellow）', emoji:'🟡',
    description:'黄の欠片の強化取引。',
    trades:[
      { id:'yc1', slot1ItemId:I.YELLOW_FRAG,    slot1Amount:32, resultItemId:I.YELLOW_CRYSTAL, resultAmount:1 },
      { id:'yc2', slot1ItemId:I.YELLOW_CRYSTAL,  slot1Amount:16, slot2ItemId:I.YELLOW_SCALE_LOW,  slot2Amount:10, resultItemId:I.YELLOW_GEM,  resultAmount:1 },
      { id:'yc3', slot1ItemId:I.YELLOW_GEM,      slot1Amount:16, slot2ItemId:I.YELLOW_SCALE_HIGH, slot2Amount:12, resultItemId:I.YELLOW_JEWEL,resultAmount:1 },
    ],
  },
  {
    id:'buff_shop', name:'村人（BuffShop）', emoji:'🍱',
    description:'バフアイテム取引。',
    trades:[
      { id:'b1',  slot1ItemId:I.GREEN_CRYSTAL, slot1Amount:8,  slot2ItemId:I.ONTIME_TICKET, slot2Amount:1,  resultItemId:I.NANAKUSAGAYU,   resultAmount:2  },
      { id:'b2',  slot1ItemId:I.GREEN_GEM,     slot1Amount:8,  slot2ItemId:I.ONTIME_TICKET, slot2Amount:12, resultItemId:I.NANAKUSAGAYU,   resultAmount:32 },
      { id:'b3',  slot1ItemId:I.GREEN_JEWEL,   slot1Amount:1,                                              resultItemId:I.NANAKUSAGAYU,   resultAmount:32 },
      { id:'b4',  slot1ItemId:I.GREEN_CRYSTAL, slot1Amount:16, slot2ItemId:I.ONTIME_TICKET, slot2Amount:4,  resultItemId:I.LARABEE_HONEY,  resultAmount:1  },
      { id:'b5',  slot1ItemId:I.GREEN_GEM,     slot1Amount:2,  slot2ItemId:I.ONTIME_TICKET, slot2Amount:8,  resultItemId:I.RAJUICE,        resultAmount:1  },
      { id:'b6',  slot1ItemId:I.GREEN_CRYSTAL, slot1Amount:32,                                              resultItemId:I.LARABEE_HONEY,  resultAmount:1  },
      { id:'b7',  slot1ItemId:I.GREEN_GEM,     slot1Amount:4,                                               resultItemId:I.RAJUICE,        resultAmount:1  },
      { id:'b8',  slot1ItemId:I.GREEN_JEWEL,   slot1Amount:1,                                               resultItemId:I.RAJUICE,        resultAmount:3  },
      { id:'b9',  slot1ItemId:I.GREEN_GEM,     slot1Amount:1,                                               resultItemId:I.MANA_MEAL_5,    resultAmount:4  },
      { id:'b10', slot1ItemId:I.GREEN_GEM,     slot1Amount:2,  slot2ItemId:I.ONTIME_TICKET, slot2Amount:16, resultItemId:I.MANA_MEAL_5,    resultAmount:12 },
      { id:'b11', slot1ItemId:I.BLUE_GEM,      slot1Amount:1,                                               resultItemId:I.MANA_MEAL_10,   resultAmount:6  },
      { id:'b12', slot1ItemId:I.BLUE_GEM,      slot1Amount:2,  slot2ItemId:I.ONTIME_TICKET, slot2Amount:32, resultItemId:I.MANA_MEAL_10,   resultAmount:20 },
      { id:'b13', slot1ItemId:I.BLUE_GEM,      slot1Amount:2,                                               resultItemId:I.MANA_MEAL_LIMIT,resultAmount:6  },
      { id:'b14', slot1ItemId:I.BLUE_GEM,      slot1Amount:4,  slot2ItemId:I.ONTIME_TICKET, slot2Amount:64, resultItemId:I.MANA_MEAL_LIMIT,resultAmount:18 },
    ],
  },
  {
    id:'tp_sonota', name:'村人（TPsonota）', emoji:'🌀',
    description:'テレポーターとFFGGRロッドの取引。',
    trades:[
      { id:'tp1', slot1ItemId:I.SENRYOBAKO,   slot1Amount:16, resultItemId:I.TP_INFINITE, resultAmount:1 },
      { id:'tp2', slot1ItemId:I.GREEN_CRYSTAL, slot1Amount:2,  resultItemId:I.RESCUE_CONSUME, resultAmount:1 },
      { id:'tp3', slot1ItemId:I.BLUE_CRYSTAL,  slot1Amount:4,  resultItemId:I.RESCUE_CONSUME, resultAmount:1 },
      { id:'tp4', slot1ItemId:I.FFGG_ROD_R6,  slot1Amount:1,  slot2ItemId:I.GREEN_CRYSTAL, slot2Amount:64, resultItemId:I.FFGGR_ROD_R1, resultAmount:1 },
      { id:'tp5', slot1ItemId:I.FFGGR_ROD_R1, slot1Amount:1,  slot2ItemId:I.BLUE_CRYSTAL,  slot2Amount:48, resultItemId:I.FFGGR_ROD_R2, resultAmount:1 },
      { id:'tp6', slot1ItemId:I.FFGGR_ROD_R2, slot1Amount:1,  slot2ItemId:I.RED_CRYSTAL,   slot2Amount:32, resultItemId:I.FFGGR_ROD_R3, resultAmount:1 },
      { id:'tp7', slot1ItemId:I.FFGGR_ROD_R3, slot1Amount:1,  slot2ItemId:I.YELLOW_CRYSTAL,slot2Amount:16, resultItemId:I.FFGGR_ROD_R4, resultAmount:1 },
      { id:'tp8', slot1ItemId:I.BLUE_CRYSTAL,  slot1Amount:16, resultItemId:I.TP_CONSUME,   resultAmount:1 },
      { id:'tp9', slot1ItemId:I.GREEN_CRYSTAL, slot1Amount:16, resultItemId:I.TP_CONSUME,   resultAmount:1 },
    ],
  },
  {
    id:'sakusei', name:'農民（sakusei）', emoji:'🌰',
    description:'甘いフルーツの取引。木の実はFFGGR森エリアで採取。',
    trades:[
      { id:'sf1', slot1ItemId:I.NUTS, slot1Amount:6,  slot2ItemId:I.HONEY, slot2Amount:1, resultItemId:I.SWEET_FRUIT_S,  resultAmount:1 },
      { id:'sf2', slot1ItemId:I.NUTS, slot1Amount:12, slot2ItemId:I.HONEY, slot2Amount:1, resultItemId:I.SWEET_FRUIT_M,  resultAmount:1 },
      { id:'sf3', slot1ItemId:I.NUTS, slot1Amount:24, slot2ItemId:I.HONEY, slot2Amount:1, resultItemId:I.SWEET_FRUIT_L,  resultAmount:1 },
      { id:'sf4', slot1ItemId:I.NUTS, slot1Amount:32, slot2ItemId:I.HONEY, slot2Amount:1, resultItemId:I.SWEET_FRUIT_XL, resultAmount:1 },
    ],
  },
  {
    id:'area_trader', name:'村人（Area）', emoji:'🗺️',
    description:'エリア固有ドロップの圧縮・ガチャ。',
    trades:[
      { id:'ca1', slot1ItemId:I.AREA_A, slot1Amount:64, resultItemId:I.AREA_A2, resultAmount:1 },
      { id:'ca2', slot1ItemId:I.AREA_B, slot1Amount:64, resultItemId:I.AREA_B2, resultAmount:1 },
      { id:'ca3', slot1ItemId:I.AREA_C, slot1Amount:64, resultItemId:I.AREA_C2, resultAmount:1 },
      { id:'ca4', slot1ItemId:I.AREA_D, slot1Amount:64, resultItemId:I.AREA_D2, resultAmount:1 },
      { id:'ca5', slot1ItemId:I.AREA_E, slot1Amount:64, resultItemId:I.AREA_E2, resultAmount:1 },
      { id:'ca6', slot1ItemId:I.AREA_F, slot1Amount:64, resultItemId:I.AREA_F2, resultAmount:1 },
    ],
  },
  {
    id:'normal1', name:'村人（Normal1）', emoji:'🍜',
    description:'天丼レプリカ系・流星群系の強化取引。',
    trades:[
      { id:'n1_1', slot1ItemId:I.GREEN_GEM,    slot1Amount:4,  slot2ItemId:I.BLUE_GEM,   slot2Amount:4,  resultItemId:I.DANJURI,          resultAmount:1 },
      { id:'n1_2', slot1ItemId:I.DANJURI,      slot1Amount:1,  slot2ItemId:I.GREEN_GEM,  slot2Amount:4,  resultItemId:'ffggr_danjuri_p1',  resultAmount:1 },
      { id:'n1_3', slot1ItemId:'ffggr_danjuri_p1', slot1Amount:1, slot2ItemId:I.BLUE_GEM,slot2Amount:4,  resultItemId:'ffggr_danjuri_p2',  resultAmount:1 },
      { id:'n1_4', slot1ItemId:'ffggr_danjuri_p2', slot1Amount:1, slot2ItemId:I.GREEN_JEWEL,slot2Amount:1,resultItemId:'ffggr_danjuri_p3', resultAmount:1 },
      { id:'n1_5', slot1ItemId:'ffggr_danjuri_p3', slot1Amount:1, slot2ItemId:I.BLUE_JEWEL, slot2Amount:1,resultItemId:I.DANJURI_FINAL,   resultAmount:1 },
      { id:'n1_6', slot1ItemId:I.CHARLOTTE_GAZER,  slot1Amount:10, slot2ItemId:I.BLUE_GEM,slot2Amount:8, resultItemId:I.RYUSEIQUN,        resultAmount:1 },
      { id:'n1_7', slot1ItemId:I.RYUSEIQUN,    slot1Amount:1, slot2ItemId:I.BLUE_JEWEL,  slot2Amount:2, resultItemId:'ffggr_ryusei_p1',   resultAmount:1 },
      { id:'n1_8', slot1ItemId:'ffggr_ryusei_p1',slot1Amount:1, slot2ItemId:I.RED_GEM,   slot2Amount:8, resultItemId:'ffggr_ryusei_p2',   resultAmount:1 },
      { id:'n1_9', slot1ItemId:'ffggr_ryusei_p2',slot1Amount:1, slot2ItemId:I.RED_JEWEL, slot2Amount:2, resultItemId:'ffggr_ryusei_p3',   resultAmount:1 },
      { id:'n1_10',slot1ItemId:'ffggr_ryusei_p3',slot1Amount:1, slot2ItemId:I.YELLOW_JEWEL,slot2Amount:1,resultItemId:I.RYUSEIQUN_FINAL,  resultAmount:1 },
    ],
  },
  {
    id:'normal2', name:'村人（Normal2）', emoji:'⚔️',
    description:'大剣系・Salamander Flame系の強化取引。',
    trades:[
      { id:'n2_1', slot1ItemId:I.GREEN_GEM,      slot1Amount:6,  resultItemId:I.TAISHO,          resultAmount:1 },
      { id:'n2_2', slot1ItemId:I.TAISHO,          slot1Amount:1,  slot2ItemId:I.GREEN_GEM,  slot2Amount:12, resultItemId:'ffggr_taisho_p1',  resultAmount:1 },
      { id:'n2_3', slot1ItemId:'ffggr_taisho_p1', slot1Amount:1,  slot2ItemId:I.GREEN_GEM,  slot2Amount:24, resultItemId:'ffggr_taisho_p2',  resultAmount:1 },
      { id:'n2_4', slot1ItemId:'ffggr_taisho_p2', slot1Amount:1,  slot2ItemId:I.GREEN_GEM,  slot2Amount:48, resultItemId:'ffggr_taisho_p3',  resultAmount:1 },
      { id:'n2_5', slot1ItemId:'ffggr_taisho_p3', slot1Amount:1,  slot2ItemId:I.GREEN_JEWEL,slot2Amount:4,  resultItemId:I.TAISHO_FINAL,     resultAmount:1 },
      { id:'n2_6', slot1ItemId:I.SALAMANDER_FLAME,slot1Amount:1,  slot2ItemId:I.GREEN_CRYSTAL,slot2Amount:32,resultItemId:'ffggr_sala_p1',  resultAmount:1 },
      { id:'n2_7', slot1ItemId:'ffggr_sala_p1',   slot1Amount:1,  slot2ItemId:I.GREEN_CRYSTAL,slot2Amount:32,resultItemId:'ffggr_sala_p2',  resultAmount:1 },
      { id:'n2_8', slot1ItemId:'ffggr_sala_p2',   slot1Amount:1,  slot2ItemId:I.GREEN_CRYSTAL,slot2Amount:64,resultItemId:'ffggr_sala_p3',  resultAmount:1 },
      { id:'n2_9', slot1ItemId:'ffggr_sala_p3',   slot1Amount:1,  slot2ItemId:I.GREEN_GEM,  slot2Amount:8,  resultItemId:I.SALAMANDER_FINAL,resultAmount:1 },
    ],
  },
  {
    id:'rare1', name:'タイガ村人（Rare1）', emoji:'🏹',
    description:'蛇弓の強化取引。',
    trades:[
      { id:'r1_1', slot1ItemId:I.HEBIYUMI,       slot1Amount:1, slot2ItemId:I.GREEN_GEM, slot2Amount:8,  resultItemId:'ffggr_hebi_p1',     resultAmount:1 },
      { id:'r1_2', slot1ItemId:'ffggr_hebi_p1',   slot1Amount:1, slot2ItemId:I.RED_GEM,   slot2Amount:8,  resultItemId:'ffggr_hebi_p2',     resultAmount:1 },
      { id:'r1_3', slot1ItemId:'ffggr_hebi_p2',   slot1Amount:1, slot2ItemId:I.GREEN_JEWEL,slot2Amount:2, resultItemId:'ffggr_hebi_p3',     resultAmount:1 },
      { id:'r1_4', slot1ItemId:'ffggr_hebi_p3',   slot1Amount:1, slot2ItemId:I.GREEN_JEWEL,slot2Amount:4, resultItemId:'ffggr_hebi_p4',     resultAmount:1 },
      { id:'r1_5', slot1ItemId:'ffggr_hebi_p4',   slot1Amount:1, slot2ItemId:I.BLUE_JEWEL, slot2Amount:2, resultItemId:'ffggr_hebi_p5',     resultAmount:1 },
      { id:'r1_6', slot1ItemId:'ffggr_hebi_p5',   slot1Amount:1, slot2ItemId:I.RED_JEWEL,  slot2Amount:2, resultItemId:I.HEBIYUMI_FINAL,    resultAmount:1 },
    ],
  },
  {
    id:'rare2', name:'タイガ村人（Rare2）', emoji:'💡',
    description:'領域光の強化取引。',
    trades:[
      { id:'r2_1', slot1ItemId:I.RYOIKIKO,       slot1Amount:1, slot2ItemId:I.GREEN_GEM, slot2Amount:8,  resultItemId:'ffggr_ryoiki_p1',   resultAmount:1 },
      { id:'r2_2', slot1ItemId:'ffggr_ryoiki_p1', slot1Amount:1, slot2ItemId:I.RED_GEM,   slot2Amount:8,  resultItemId:'ffggr_ryoiki_p2',   resultAmount:1 },
      { id:'r2_3', slot1ItemId:'ffggr_ryoiki_p2', slot1Amount:1, slot2ItemId:I.GREEN_JEWEL,slot2Amount:2, resultItemId:'ffggr_ryoiki_p3',   resultAmount:1 },
      { id:'r2_4', slot1ItemId:'ffggr_ryoiki_p3', slot1Amount:1, slot2ItemId:I.GREEN_JEWEL,slot2Amount:4, resultItemId:'ffggr_ryoiki_p4',   resultAmount:1 },
      { id:'r2_5', slot1ItemId:'ffggr_ryoiki_p4', slot1Amount:1, slot2ItemId:I.BLUE_JEWEL, slot2Amount:2, resultItemId:'ffggr_ryoiki_p5',   resultAmount:1 },
      { id:'r2_6', slot1ItemId:'ffggr_ryoiki_p5', slot1Amount:1, slot2ItemId:I.RED_JEWEL,  slot2Amount:2, resultItemId:I.RYOIKIKO_FINAL,    resultAmount:1 },
    ],
  },
  {
    id:'rare3', name:'タイガ村人（Rare3）', emoji:'🪨',
    description:'投石の強化取引。',
    trades:[
      { id:'r3_1', slot1ItemId:I.TOUSEKI,        slot1Amount:1, slot2ItemId:I.RED_GEM,    slot2Amount:8,  resultItemId:'ffggr_touseki_p1',  resultAmount:1 },
      { id:'r3_2', slot1ItemId:'ffggr_touseki_p1',slot1Amount:1, slot2ItemId:I.YELLOW_GEM, slot2Amount:4,  resultItemId:'ffggr_touseki_p2',  resultAmount:1 },
      { id:'r3_3', slot1ItemId:'ffggr_touseki_p2',slot1Amount:1, slot2ItemId:I.GREEN_JEWEL,slot2Amount:2,  resultItemId:'ffggr_touseki_p3',  resultAmount:1 },
      { id:'r3_4', slot1ItemId:'ffggr_touseki_p3',slot1Amount:1, slot2ItemId:I.BLUE_JEWEL, slot2Amount:2,  resultItemId:'ffggr_touseki_p4',  resultAmount:1 },
      { id:'r3_5', slot1ItemId:'ffggr_touseki_p4',slot1Amount:1, slot2ItemId:I.BLUE_JEWEL, slot2Amount:2,  resultItemId:'ffggr_touseki_p5',  resultAmount:1 },
      { id:'r3_6', slot1ItemId:'ffggr_touseki_p5',slot1Amount:1, slot2ItemId:I.RED_JEWEL,  slot2Amount:2,  resultItemId:I.TOUSEKI_FINAL,     resultAmount:1 },
    ],
  },
  {
    id:'rare4', name:'タイガ村人（Rare4）', emoji:'🔵',
    description:'マナドレインの強化取引。',
    trades:[
      { id:'r4_1', slot1ItemId:I.MANADRAIN,       slot1Amount:1, slot2ItemId:I.RED_GEM,    slot2Amount:8, resultItemId:'ffggr_mana_p1',     resultAmount:1 },
      { id:'r4_2', slot1ItemId:'ffggr_mana_p1',    slot1Amount:1, slot2ItemId:I.YELLOW_GEM, slot2Amount:4, resultItemId:'ffggr_mana_p2',     resultAmount:1 },
      { id:'r4_3', slot1ItemId:'ffggr_mana_p2',    slot1Amount:1, slot2ItemId:I.GREEN_JEWEL,slot2Amount:2, resultItemId:'ffggr_mana_p3',     resultAmount:1 },
      { id:'r4_4', slot1ItemId:'ffggr_mana_p3',    slot1Amount:1, slot2ItemId:I.BLUE_JEWEL, slot2Amount:2, resultItemId:'ffggr_mana_p4',     resultAmount:1 },
      { id:'r4_5', slot1ItemId:'ffggr_mana_p4',    slot1Amount:1, slot2ItemId:I.BLUE_JEWEL, slot2Amount:2, resultItemId:'ffggr_mana_p5',     resultAmount:1 },
      { id:'r4_6', slot1ItemId:'ffggr_mana_p5',    slot1Amount:1, slot2ItemId:I.RED_JEWEL,  slot2Amount:2, resultItemId:I.MANADRAIN_FINAL,   resultAmount:1 },
    ],
  },
  {
    id:'rare5', name:'タイガ村人（Rare5）', emoji:'🐉',
    description:'メガロス・躍動の赫痕合成。',
    trades:[
      { id:'r5_1', slot1ItemId:I.RED_JEWEL,        slot1Amount:2, slot2ItemId:I.AREA_F_POWDER, slot2Amount:4, resultItemId:I.MEGALO_TRACE,  resultAmount:1 },
      { id:'r5_2', slot1ItemId:I.SALAMANDER_FINAL, slot1Amount:4, slot2ItemId:I.MEGALO_TRACE,  slot2Amount:2, resultItemId:'ffggr_shakkon', resultAmount:1 },
    ],
  },
  {
    id:'epic1', name:'サバンナ村人（Epic1）', emoji:'🗡️',
    description:'剣の強化取引（エンドコンテンツ）。',
    trades:[
      { id:'e1_1', slot1ItemId:I.KATANA_BLUE,     slot1Amount:1, slot2ItemId:I.BLUE_JEWEL,   slot2Amount:1, resultItemId:'ffggr_katana_p1',  resultAmount:1 },
      { id:'e1_2', slot1ItemId:'ffggr_katana_p1',  slot1Amount:1, slot2ItemId:I.RED_JEWEL,    slot2Amount:1, resultItemId:'ffggr_katana_p2',  resultAmount:1 },
      { id:'e1_3', slot1ItemId:'ffggr_katana_p2',  slot1Amount:1, slot2ItemId:I.YELLOW_JEWEL, slot2Amount:1, resultItemId:'ffggr_katana_p3',  resultAmount:1 },
      { id:'e1_4', slot1ItemId:'ffggr_katana_p3',  slot1Amount:1, slot2ItemId:I.BLUE_JEWEL,   slot2Amount:2, resultItemId:'ffggr_katana_p4',  resultAmount:1 },
      { id:'e1_5', slot1ItemId:'ffggr_katana_p4',  slot1Amount:1, slot2ItemId:I.RED_JEWEL,    slot2Amount:2, resultItemId:'ffggr_katana_p5',  resultAmount:1 },
      { id:'e1_6', slot1ItemId:'ffggr_katana_p5',  slot1Amount:1, slot2ItemId:I.YELLOW_JEWEL, slot2Amount:2, resultItemId:I.KATANA_FINAL,     resultAmount:1 },
    ],
  },
  {
    id:'epic2', name:'サバンナ村人（Epic2）', emoji:'🌿',
    description:'生命の大剣合成（超長期コンテンツ）。',
    trades:[
      { id:'e2_1', slot1ItemId:I.AREA_A2, slot1Amount:48, resultItemId:I.MID1, resultAmount:1 },
      { id:'e2_2', slot1ItemId:I.AREA_B2, slot1Amount:32, resultItemId:I.MID2, resultAmount:1 },
      { id:'e2_3', slot1ItemId:I.AREA_C,  slot1Amount:24, resultItemId:I.MID3, resultAmount:1 },
      { id:'e2_4', slot1ItemId:I.AREA_D2, slot1Amount:28, resultItemId:I.MID4, resultAmount:1 },
      { id:'e2_5', slot1ItemId:I.MID1,    slot1Amount:1,  slot2ItemId:I.MID2,  slot2Amount:1,  resultItemId:I.MID5, resultAmount:1 },
      { id:'e2_6', slot1ItemId:I.MID3,    slot1Amount:1,  slot2ItemId:I.MID4,  slot2Amount:1,  resultItemId:I.MID6, resultAmount:1 },
      { id:'e2_7', slot1ItemId:I.MID5,    slot1Amount:1,  slot2ItemId:I.MID6,  slot2Amount:1,  resultItemId:I.MID7, resultAmount:1 },
      { id:'e2_8', slot1ItemId:I.GREEN_CRYSTAL, slot1Amount:64, slot2ItemId:I.BLUE_CRYSTAL, slot2Amount:64, resultItemId:I.MID8, resultAmount:1 },
      { id:'e2_9', slot1ItemId:I.MID8,    slot1Amount:64, resultItemId:I.MID9, resultAmount:1 },
      { id:'e2_10',slot1ItemId:I.MID7,    slot1Amount:1,  slot2ItemId:I.MID9,  slot2Amount:1,  resultItemId:I.MID10, resultAmount:1 },
      { id:'e2_11',slot1ItemId:I.TAISHO_FINAL, slot1Amount:1, slot2ItemId:I.MID10, slot2Amount:1, resultItemId:'ffggr_seimei_taisho', resultAmount:1 },
      { id:'e2_12',slot1ItemId:I.GREEN_FRAG, slot1Amount:64, slot2ItemId:I.BLUE_FRAG, slot2Amount:64, resultItemId:'ffggr_seimei_taisho_trial', resultAmount:1 },
    ],
  },
  {
    id:'legendary1', name:'湿地帯村人（Legendary1）', emoji:'🌊',
    description:'サーフェス系合成（エンドコンテンツ）。',
    trades:[
      { id:'l1_1', slot1ItemId:I.AREA_F_ROD, slot1Amount:8, slot2ItemId:I.YELLOW_JEWEL, slot2Amount:2, resultItemId:I.SURFACE, resultAmount:1 },
      { id:'l1_2', slot1ItemId:I.SURFACE,    slot1Amount:1, slot2ItemId:I.AREA_A2, slot2Amount:64, resultItemId:'ffggr_surface001', resultAmount:1 },
      { id:'l1_3', slot1ItemId:'ffggr_surface001',slot1Amount:1,slot2ItemId:I.AREA_B2,slot2Amount:64,resultItemId:'ffggr_surface002',resultAmount:1 },
      { id:'l1_4', slot1ItemId:'ffggr_surface002',slot1Amount:1,slot2ItemId:I.AREA_C2,slot2Amount:64,resultItemId:'ffggr_surface003',resultAmount:1 },
      { id:'l1_5', slot1ItemId:'ffggr_surface003',slot1Amount:1,slot2ItemId:I.AREA_D2,slot2Amount:64,resultItemId:'ffggr_surface004',resultAmount:1 },
      { id:'l1_6', slot1ItemId:'ffggr_surface004',slot1Amount:1,slot2ItemId:I.AREA_E2,slot2Amount:64,resultItemId:'ffggr_surface005',resultAmount:1 },
      { id:'l1_7', slot1ItemId:'ffggr_surface005',slot1Amount:1,slot2ItemId:I.AREA_F2,slot2Amount:64,resultItemId:'ffggr_surface006',resultAmount:1 },
    ],
  },
  {
    id:'legendary2', name:'湿地帯村人（Legendary2）', emoji:'⚡',
    description:'サーフェスEX最終合成。',
    trades:[
      { id:'l2_1', slot1ItemId:I.BRAVE_PROOF, slot1Amount:192, resultItemId:I.UPGRADE_MAT, resultAmount:1 },
      { id:'l2_2', slot1ItemId:'ffggr_surface006', slot1Amount:1, slot2ItemId:I.BRAVE_STAR, slot2Amount:8, slot3ItemId:I.BRAVE_HEART, slot3Amount:16, resultItemId:I.SURFACE_FINAL, resultAmount:1 },
    ],
  },
];

// ============================================================
// フィーバー定義
// ============================================================
export type FFGGRFeverType = 'monster_hunter' | 'fishing' | 'rainbow';

export interface FFGGRFever {
  type: FFGGRFeverType;
  name: string;
  emoji: string;
  description: string;
  triggerBy: 'fishing' | 'battle' | 'both';
  baseChance: number;
  duration: number;  // 回数
  rainbowMhfDuration?: number;
}

export const FFGGR_FEVERS: Record<FFGGRFeverType, FFGGRFever> = {
  monster_hunter: {
    type:'monster_hunter', name:'モンスターハンターフィーバー', emoji:'🏹',
    description:'山岳地帯に弱体化した各エリアの雑魚が大量にスポーンする。',
    triggerBy:'fishing', baseChance:0.05, duration:30,
  },
  fishing: {
    type:'fishing', name:'釣りフィーバー', emoji:'🎣',
    description:'FFGGR釣りでクレートが釣れる確率が大幅UP。',
    triggerBy:'battle', baseChance:0.03, duration:250,
  },
  rainbow: {
    type:'rainbow', name:'レインボーフィーバー', emoji:'🌈',
    description:'モンスターハンターフィーバーと釣りフィーバーの両方の回数が増加する最高峰フィーバー。',
    triggerBy:'both', baseChance:0.005, duration:1000, rainbowMhfDuration:50,
  },
};

// ============================================================
// ポイント報酬定義
// ============================================================
export const FFGGR_POINT_KEY = 'ffggr_point';
export const FFGGR_NUTS_COUNT_KEY = 'ffggr_nuts_daily';

// ============================================================
// ヘルパー関数
// ============================================================

/** エリアの敵一覧を返す */
export function getMonstersInArea(areaId: FFGGRAreaId): FFGGRMonster[] {
  const area = FFGGR_AREAS[areaId];
  if (!area) return [];
  return area.monsterIds.map(id => FFGGR_MONSTERS[id]).filter(Boolean);
}

/** 敵の行動を重みに基づいて選択する */
export function selectAction(monster: FFGGRMonster, currentHpPct: number, turn: number): FFGGRAction {
  const available = monster.actions.filter(a => {
    if (a.triggerHpPct !== undefined && currentHpPct > a.triggerHpPct) return false;
    if (a.triggerTurnMod !== undefined && turn % a.triggerTurnMod !== 0) return false;
    return true;
  });
  const total = available.reduce((s, a) => s + a.weight, 0);
  let r = Math.random() * total;
  for (const a of available) { r -= a.weight; if (r <= 0) return a; }
  return available[available.length - 1] ?? monster.actions[0];
}

/** ドロップロールを実行する */
export function rollDrops(monster: FFGGRMonster): { itemId: string; amount: number }[] {
  const result: { itemId: string; amount: number }[] = [];
  for (const drop of monster.drops) {
    if (Math.random() < drop.rate) {
      const amount = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
      result.push({ itemId: drop.itemId, amount });
    }
  }
  return result;
}
