// src/data/fishMasters.ts  –  釣りシステム v3

export type FishRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// ─── 魚マスター ─────────────────────────────────────────────
export interface FishMaster {
  id: string; name: string; rarity: FishRarity; minLevel: number;
  baseExp: number; minSizeCm: number; maxSizeCm: number; weightFactor: number;
  baseRate: number; sellPrice: number; icon: string; description: string;
  spots?: string[]; // 出現スポットID (未指定=全スポット)
  season?: 'spring' | 'summer' | 'autumn' | 'winter'; // 季節限定
  eventId?: string; // イベント限定
}

export const FISH_MASTER: Record<string, FishMaster> = {
  // common
  iwashi:      { id:'iwashi',      name:'イワシ',        rarity:'common',    minLevel:1,  baseExp:5,   minSizeCm:10,  maxSizeCm:25,   weightFactor:0.0004, baseRate:0.32, sellPrice:2,   icon:'🐟', description:'どこにでもいる小魚。', spots:['pond','river','lake','sea','offshore'] },
  aji:         { id:'aji',         name:'アジ',          rarity:'common',    minLevel:1,  baseExp:7,   minSizeCm:15,  maxSizeCm:40,   weightFactor:0.0006, baseRate:0.28, sellPrice:3,   icon:'🐟', description:'定番の青魚。', spots:['river','lake','sea','offshore'] },
  fugu:        { id:'fugu',        name:'フグ',          rarity:'common',    minLevel:3,  baseExp:10,  minSizeCm:20,  maxSizeCm:50,   weightFactor:0.0008, baseRate:0.18, sellPrice:5,   icon:'🐡', description:'毒があるが高値がつく。', spots:['sea','offshore','deepsea'] },
  koi:         { id:'koi',         name:'コイ',          rarity:'common',    minLevel:1,  baseExp:8,   minSizeCm:20,  maxSizeCm:80,   weightFactor:0.0009, baseRate:0.25, sellPrice:3,   icon:'🐟', description:'池の定番。', spots:['pond','river','lake'] },
  tai:         { id:'tai',         name:'タイ',          rarity:'common',    minLevel:5,  baseExp:12,  minSizeCm:30,  maxSizeCm:80,   weightFactor:0.0010, baseRate:0.15, sellPrice:4,   icon:'🐟', description:'めでたい魚。', spots:['sea','offshore'] },
  unagi:       { id:'unagi',       name:'ウナギ',        rarity:'common',    minLevel:5,  baseExp:15,  minSizeCm:40,  maxSizeCm:100,  weightFactor:0.0007, baseRate:0.14, sellPrice:6,   icon:'🐍', description:'川に潜む長い魚。', spots:['river','lake'] },
  tanago:      { id:'tanago',      name:'タナゴ',        rarity:'common',    minLevel:1,  baseExp:5,   minSizeCm:5,   maxSizeCm:15,   weightFactor:0.0003, baseRate:0.30, sellPrice:2,   icon:'🐟', description:'小さく鮮やかな淡水魚。', spots:['pond','river'] },
  catfish:     { id:'catfish',     name:'ナマズ',        rarity:'common',    minLevel:4,  baseExp:14,  minSizeCm:30,  maxSizeCm:90,   weightFactor:0.0012, baseRate:0.14, sellPrice:5,   icon:'🐟', description:'ヒゲが特徴的な大型淡水魚。', spots:['river','lake','swamp'] },
  // uncommon
  sake:        { id:'sake',        name:'サケ',          rarity:'uncommon',  minLevel:8,  baseExp:20,  minSizeCm:50,  maxSizeCm:100,  weightFactor:0.0015, baseRate:0.12, sellPrice:8,   icon:'🐟', description:'川を遡る力強い魚。', spots:['river','lake','sea'] },
  buri:        { id:'buri',        name:'ブリ',          rarity:'uncommon',  minLevel:10, baseExp:25,  minSizeCm:60,  maxSizeCm:120,  weightFactor:0.0018, baseRate:0.10, sellPrice:10,  icon:'🐟', description:'出世魚として知られる。', spots:['sea','offshore'] },
  hirame:      { id:'hirame',      name:'ヒラメ',        rarity:'uncommon',  minLevel:12, baseExp:22,  minSizeCm:40,  maxSizeCm:90,   weightFactor:0.0020, baseRate:0.10, sellPrice:12,  icon:'🐠', description:'砂底に潜む白身魚。', spots:['sea','offshore','deepsea'] },
  tako:        { id:'tako',        name:'タコ',          rarity:'uncommon',  minLevel:15, baseExp:30,  minSizeCm:30,  maxSizeCm:80,   weightFactor:0.0025, baseRate:0.08, sellPrice:15,  icon:'🐙', description:'足が8本ある。', spots:['sea','offshore'] },
  ebi:         { id:'ebi',         name:'伊勢エビ',      rarity:'uncommon',  minLevel:12, baseExp:28,  minSizeCm:20,  maxSizeCm:60,   weightFactor:0.0030, baseRate:0.09, sellPrice:18,  icon:'🦐', description:'高級甲殻類。', spots:['sea','offshore'] },
  kani:        { id:'kani',        name:'ズワイガニ',    rarity:'uncommon',  minLevel:15, baseExp:35,  minSizeCm:15,  maxSizeCm:45,   weightFactor:0.0035, baseRate:0.07, sellPrice:20,  icon:'🦀', description:'甲殻類の人気者。', spots:['sea','offshore','deepsea'] },
  hotate:      { id:'hotate',      name:'ホタテ',        rarity:'uncommon',  minLevel:10, baseExp:18,  minSizeCm:10,  maxSizeCm:25,   weightFactor:0.0040, baseRate:0.11, sellPrice:10,  icon:'🐚', description:'貝柱が絶品。', spots:['sea','offshore'] },
  piranha:     { id:'piranha',     name:'ピラニア',      rarity:'uncommon',  minLevel:18, baseExp:40,  minSizeCm:20,  maxSizeCm:50,   weightFactor:0.0022, baseRate:0.07, sellPrice:22,  icon:'🐟', description:'鋭い歯を持つ凶暴な魚。', spots:['swamp','volcano_lake'] },
  // rare
  maguro:      { id:'maguro',      name:'マグロ',        rarity:'rare',      minLevel:20, baseExp:100, minSizeCm:80,  maxSizeCm:250,  weightFactor:0.0030, baseRate:0.05, sellPrice:25,  icon:'🐟', description:'海の王者。大型個体は価値が高い。', spots:['offshore','deepsea'] },
  katsuo:      { id:'katsuo',      name:'カツオ',        rarity:'rare',      minLevel:20, baseExp:80,  minSizeCm:60,  maxSizeCm:120,  weightFactor:0.0022, baseRate:0.06, sellPrice:20,  icon:'🐟', description:'鮮度が命の赤身魚。', spots:['offshore','sea'] },
  shark:       { id:'shark',       name:'コモンシャーク',rarity:'rare',      minLevel:30, baseExp:120, minSizeCm:100, maxSizeCm:300,  weightFactor:0.0035, baseRate:0.04, sellPrice:30,  icon:'🦈', description:'海の捕食者。', spots:['offshore','deepsea'] },
  ika:         { id:'ika',         name:'ダイオウイカ',  rarity:'rare',      minLevel:35, baseExp:150, minSizeCm:150, maxSizeCm:400,  weightFactor:0.0010, baseRate:0.03, sellPrice:35,  icon:'🦑', description:'深海に潜む巨大イカ。', spots:['deepsea'] },
  dragon_fish: { id:'dragon_fish', name:'ドラゴンフィッシュ', rarity:'rare', minLevel:40, baseExp:180, minSizeCm:80,  maxSizeCm:200,  weightFactor:0.0028, baseRate:0.03, sellPrice:45,  icon:'🐟', description:'炎のような鱗を持つ熱帯魚。', spots:['volcano_lake'] },
  rainbow_koi: { id:'rainbow_koi', name:'虹色コイ',      rarity:'rare',      minLevel:30, baseExp:130, minSizeCm:40,  maxSizeCm:120,  weightFactor:0.0020, baseRate:0.04, sellPrice:40,  icon:'🌈', description:'七色に輝く幻のコイ。', spots:['sky_lake','lake'] },
  abyssal_eel: { id:'abyssal_eel', name:'深淵ウミヘビ',  rarity:'rare',      minLevel:45, baseExp:160, minSizeCm:200, maxSizeCm:600,  weightFactor:0.0008, baseRate:0.025,sellPrice:50,  icon:'🐍', description:'深海の闇に潜む巨大ウミヘビ。', spots:['deepsea'] },
  // epic
  ryujin_bass: { id:'ryujin_bass', name:'龍神スズキ',    rarity:'epic',      minLevel:40, baseExp:300, minSizeCm:80,  maxSizeCm:160,  weightFactor:0.0028, baseRate:0.02, sellPrice:80,  icon:'🐟', description:'龍の加護を受けた輝くスズキ。', spots:['sky_lake','volcano_lake'] },
  golden_carp: { id:'golden_carp', name:'黄金コイ',      rarity:'epic',      minLevel:50, baseExp:400, minSizeCm:60,  maxSizeCm:150,  weightFactor:0.0032, baseRate:0.015,sellPrice:100, icon:'🐠', description:'金色に輝く幸運の魚。', spots:['sky_lake','lake'] },
  deep_whale:  { id:'deep_whale',  name:'深淵クジラ',    rarity:'epic',      minLevel:60, baseExp:500, minSizeCm:300, maxSizeCm:800,  weightFactor:0.0040, baseRate:0.010,sellPrice:120, icon:'🐋', description:'深海から浮上する巨大クジラ。', spots:['deepsea'] },
  lava_shark:  { id:'lava_shark',  name:'溶岩シャーク',  rarity:'epic',      minLevel:55, baseExp:450, minSizeCm:120, maxSizeCm:350,  weightFactor:0.0038, baseRate:0.012,sellPrice:110, icon:'🦈', description:'火山湖に潜む炎のサメ。', spots:['volcano_lake'] },
  storm_tuna:  { id:'storm_tuna',  name:'嵐マグロ',      rarity:'epic',      minLevel:65, baseExp:550, minSizeCm:150, maxSizeCm:400,  weightFactor:0.0045, baseRate:0.008,sellPrice:150, icon:'⚡', description:'嵐の中にしか現れないマグロ。', spots:['offshore','deepsea'] },
  crystal_fish:{ id:'crystal_fish',name:'水晶魚',        rarity:'epic',      minLevel:70, baseExp:600, minSizeCm:30,  maxSizeCm:90,   weightFactor:0.0050, baseRate:0.007,sellPrice:200, icon:'💎', description:'水晶のように透明な体を持つ幻魚。', spots:['sky_lake'] },
  // legendary
  ryujin:      { id:'ryujin',      name:'龍神',          rarity:'legendary', minLevel:70, baseExp:1000,minSizeCm:200, maxSizeCm:500,  weightFactor:0.0050, baseRate:0.005,sellPrice:500, icon:'🐉', description:'伝説の龍の化身。', spots:['sky_lake','volcano_lake'] },
  phantom_tuna:{ id:'phantom_tuna',name:'幻のマグロ',    rarity:'legendary', minLevel:80, baseExp:1000,minSizeCm:250, maxSizeCm:600,  weightFactor:0.0055, baseRate:0.004,sellPrice:600, icon:'🐟', description:'幻と呼ばれる最大級のマグロ。', spots:['deepsea','offshore'] },
  sea_god:     { id:'sea_god',     name:'海神',          rarity:'legendary', minLevel:90, baseExp:1000,minSizeCm:400, maxSizeCm:1000, weightFactor:0.0060, baseRate:0.003,sellPrice:800, icon:'🌊', description:'海の神が宿る魚。', spots:['deepsea'] },
  infinity_fish:{ id:'infinity_fish',name:'∞魚',         rarity:'legendary', minLevel:100,baseExp:1000,minSizeCm:100, maxSizeCm:9999, weightFactor:0.0070, baseRate:0.002,sellPrice:1000,icon:'♾️', description:'無限の可能性を秘めた最強の魚。', spots:['sky_lake'] },
  god_koi:     { id:'god_koi',     name:'神コイ',        rarity:'legendary', minLevel:85, baseExp:1000,minSizeCm:300, maxSizeCm:800,  weightFactor:0.0055, baseRate:0.003,sellPrice:700, icon:'👑', description:'神に愛された究極のコイ。', spots:['sky_lake','pond'] },
};
import { EXTRA_FISH } from './fishMastersExtra';
Object.assign(FISH_MASTER, EXTRA_FISH);
export const FISH_IDS = Object.keys(FISH_MASTER);
export const TOTAL_FISH = FISH_IDS.length;

// ─── 釣りスポット ────────────────────────────────────────────
export interface SpotMaster {
  id: string; name: string; icon: string; description: string;
  minLevel: number; unlockCond?: string;
  fishFilter?: string[]; rarityMult: number; expMult: number;
  largeFishMult: number; staminaCost: number; cooldownMs: number;
}
export const SPOT_MASTER: Record<string, SpotMaster> = {
  pond:         { id:'pond',         name:'近所の池',        icon:'🏞️', description:'初心者向けの静かな池。',         minLevel:1,  rarityMult:1.0, expMult:1.0, largeFishMult:1.0, staminaCost:3, cooldownMs:4000 },
  river:        { id:'river',        name:'清流の川',        icon:'🏞️', description:'淡水魚が豊富な川。',           minLevel:3,  rarityMult:1.1, expMult:1.1, largeFishMult:1.0, staminaCost:3, cooldownMs:4000 },
  lake:         { id:'lake',         name:'静寂の湖',        icon:'🌊', description:'大型淡水魚が潜む湖。',         minLevel:8,  rarityMult:1.2, expMult:1.2, largeFishMult:1.2, staminaCost:4, cooldownMs:4500 },
  swamp:        { id:'swamp',        name:'霧の沼地',        icon:'🌿', description:'珍しい魚が生息する沼地。',     minLevel:12, rarityMult:1.3, expMult:1.2, largeFishMult:1.1, staminaCost:4, cooldownMs:4500 },
  sea:          { id:'sea',          name:'浜辺の海',        icon:'🌅', description:'海水魚が集まる浜辺。',         minLevel:10, rarityMult:1.2, expMult:1.2, largeFishMult:1.1, staminaCost:4, cooldownMs:4000 },
  offshore:     { id:'offshore',     name:'沖合',            icon:'⛵', description:'大型海水魚が現れる沖合。',     minLevel:20, rarityMult:1.4, expMult:1.4, largeFishMult:1.3, staminaCost:5, cooldownMs:5000 },
  coral_reef:   { id:'coral_reef',   name:'珊瑚礁',          icon:'🪸', description:'色鮮やかな熱帯魚の楽園。',   minLevel:25, rarityMult:1.5, expMult:1.4, largeFishMult:1.2, staminaCost:5, cooldownMs:4500 },
  deepsea:      { id:'deepsea',      name:'深海',            icon:'🌑', description:'未知の生物が潜む深海。',       minLevel:40, rarityMult:1.8, expMult:1.8, largeFishMult:1.5, staminaCost:7, cooldownMs:6000, unlockCond:'level_40' },
  underwater_cave:{ id:'underwater_cave',name:'水中洞窟',    icon:'🕳️', description:'洞窟に潜む希少魚。',         minLevel:35, rarityMult:1.6, expMult:1.5, largeFishMult:1.4, staminaCost:6, cooldownMs:5500, unlockCond:'level_35' },
  volcano_lake: { id:'volcano_lake', name:'火山湖',          icon:'🌋', description:'炎の魚が生息する火山湖。',     minLevel:50, rarityMult:2.0, expMult:2.0, largeFishMult:1.8, staminaCost:8, cooldownMs:6500, unlockCond:'level_50' },
  glacier_sea:  { id:'glacier_sea',  name:'氷河の海',        icon:'🧊', description:'極寒の海に適応した魚。',       minLevel:45, rarityMult:1.9, expMult:1.7, largeFishMult:1.6, staminaCost:7, cooldownMs:6000, unlockCond:'level_45' },
  sky_lake:     { id:'sky_lake',     name:'天空湖',          icon:'☁️', description:'雲の上に浮かぶ伝説の湖。',   minLevel:60, rarityMult:2.5, expMult:2.5, largeFishMult:2.0, staminaCost:10,cooldownMs:7000, unlockCond:'level_60' },
  ancient_river:{ id:'ancient_river',name:'古代の川',        icon:'🏛️', description:'古代魚が泳ぐ神秘の川。',     minLevel:55, rarityMult:2.2, expMult:2.0, largeFishMult:1.9, staminaCost:8, cooldownMs:6500, unlockCond:'level_55' },
  moonlit_pond: { id:'moonlit_pond', name:'月光の池',        icon:'🌙', description:'満月の夜だけ現れる神秘の池。',minLevel:30, rarityMult:1.7, expMult:1.6, largeFishMult:1.5, staminaCost:5, cooldownMs:5000 },
  golden_river: { id:'golden_river', name:'黄金の川',        icon:'✨', description:'黄金色に輝く伝説の川。',       minLevel:70, rarityMult:3.0, expMult:3.0, largeFishMult:2.5, staminaCost:12,cooldownMs:8000, unlockCond:'level_70' },
  abyss:        { id:'abyss',        name:'奈落',            icon:'⚫', description:'底なしの暗黒。最強の魚が潜む。',minLevel:80, rarityMult:4.0, expMult:4.0, largeFishMult:3.0, staminaCost:15,cooldownMs:9000, unlockCond:'level_80' },
  heaven:       { id:'heaven',       name:'天界の海',        icon:'🌟', description:'神々が泳ぐ究極の漁場。',       minLevel:90, rarityMult:5.0, expMult:5.0, largeFishMult:4.0, staminaCost:18,cooldownMs:10000,unlockCond:'level_90' },
  rainbow_falls:{ id:'rainbow_falls',name:'虹の滝',          icon:'🌈', description:'虹の根元にある神秘の滝壺。',  minLevel:65, rarityMult:2.8, expMult:2.6, largeFishMult:2.2, staminaCost:11,cooldownMs:7500, unlockCond:'level_65' },
  crystal_sea:  { id:'crystal_sea',  name:'水晶の海',        icon:'💎', description:'透明な水晶の海。',             minLevel:75, rarityMult:3.5, expMult:3.2, largeFishMult:2.8, staminaCost:13,cooldownMs:8500, unlockCond:'level_75' },
  chaos_sea:    { id:'chaos_sea',    name:'混沌の海',        icon:'🌀', description:'何が現れるか全く予測不能。',   minLevel:85, rarityMult:4.5, expMult:4.0, largeFishMult:3.5, staminaCost:16,cooldownMs:9500, unlockCond:'level_85' },
};
export const SPOT_IDS = Object.keys(SPOT_MASTER);

// ─── 釣り竿マスター ─────────────────────────────────────────
export interface RodMaster {
  id: string; name: string; icon: string; description: string; rarity: FishRarity;
  rarityBonus: number; largeFishBonus: number; expMult: number;
  maxDurability: number; minLevel: number; buyPrice?: number;
  obtainHint: string;
  // 拡張フィールド（data駆動）
  role: string;                          // 竿の役割ラベル（UI表示用）
  fishCoinMult: number;                  // Fish Coin獲得倍率（1.0=通常）
  spotBonus?: Partial<Record<string, number>>; // 特定スポットでのレア率追加ボーナス
  legendaryBonus?: number;               // 伝説魚出現率ボーナス
}
export const ROD_MASTER: Record<string, RodMaster> = {
  // ──────────────────────────────────────────────────────────
  // Lv1〜 【序盤・入門】EXP効率が唯一の強み。すぐ乗り換える竿
  // ──────────────────────────────────────────────────────────
  wood_rod: {
    id:'wood_rod', name:'木の釣り竿', icon:'🪵', rarity:'common', minLevel:1,
    rarityBonus:0, largeFishBonus:0, expMult:1.2, maxDurability:40, buyPrice:100,
    fishCoinMult:1.0,
    role:'🌱 EXP特化（序盤）',
    description:'粗削りだがEXPが多め。序盤のレベル上げに使える。',
    obtainHint:'ショップで購入（100G）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv1〜 【汎用・初期装備】最初から持っている。全方位平均的
  // ──────────────────────────────────────────────────────────
  basic_rod: {
    id:'basic_rod', name:'鉄の釣り竿', icon:'🎣', rarity:'common', minLevel:1,
    rarityBonus:0.02, largeFishBonus:0.02, expMult:1.0, maxDurability:80, buyPrice:300,
    fishCoinMult:1.0,
    role:'⚖️ バランス（初期）',
    description:'頑丈で扱いやすい標準的な竿。序盤〜中盤まで使える。',
    obtainHint:'初期装備（最初から所持）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv3〜 【大型魚特化・序盤】large特化。大きいサイズを狙う
  // ──────────────────────────────────────────────────────────
  copper_rod: {
    id:'copper_rod', name:'銅の釣り竿', icon:'🎣', rarity:'common', minLevel:3,
    rarityBonus:0, largeFishBonus:0.12, expMult:0.9, maxDurability:70, buyPrice:200,
    fishCoinMult:1.0,
    role:'📏 大型魚特化（序盤）',
    description:'重心が低く大型魚を引き寄せやすい。EXPは少なめ。',
    obtainHint:'ショップで購入（200G）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv5〜 【レア特化・中盤前半】レア率に全振り。EXPは犠牲
  // ──────────────────────────────────────────────────────────
  ore_rod: {
    id:'ore_rod', name:'銀の釣り竿', icon:'🎣', rarity:'uncommon', minLevel:5,
    rarityBonus:0.10, largeFishBonus:0, expMult:0.85, maxDurability:100,
    fishCoinMult:1.2,
    role:'✨ レア特化（中盤前半）',
    description:'希少な銀素材でできた竿。レア魚・Fish Coinが狙いやすいが EXP効率は低い。',
    obtainHint:'謎の箱・ショップ（中盤解放）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv10〜 【Fish Coin稼ぎ特化】コイン倍率2倍。レア率も中程度
  // ──────────────────────────────────────────────────────────
  all_rod_x: {
    id:'all_rod_x', name:'オールロッドX', icon:'🎣', rarity:'rare', minLevel:10,
    rarityBonus:0.06, largeFishBonus:0.04, expMult:1.1, maxDurability:110,
    fishCoinMult:2.0,
    role:'🐟 Fish Coin×2（中盤）',
    description:'釣るたびにFish Coinを2倍獲得。交換所アイテムを早く集めたい人向け。',
    obtainHint:'Fish Coin交換所（400枚）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv15〜 【EXP周回特化】expMultが圧倒的に高い。レベル上げ専用
  // ──────────────────────────────────────────────────────────
  crystal_rod: {
    id:'crystal_rod', name:'水晶の釣り竿', icon:'💠', rarity:'rare', minLevel:15,
    rarityBonus:0.04, largeFishBonus:0, expMult:1.8, maxDurability:120,
    fishCoinMult:1.0,
    role:'⬆️ EXP周回特化（中盤）',
    description:'水晶の共鳴でEXPが大幅増加。Lv上げ周回のメイン竿。レア率は平凡。',
    obtainHint:'クラフト（水晶×5 + 鉄×10）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv20〜 【大型魚+レア バランス型】中盤後半の主力
  // ──────────────────────────────────────────────────────────
  golden_rod: {
    id:'golden_rod', name:'黄金の釣り竿', icon:'🏆', rarity:'rare', minLevel:20,
    rarityBonus:0.10, largeFishBonus:0.15, expMult:1.2, maxDurability:130,
    fishCoinMult:1.5,
    role:'⚖️ 大型×レア バランス（中盤後半）',
    description:'レア率と大型魚ボーナスの両立。Lv20〜35の主力として幅広く活躍。',
    obtainHint:'クラフト（黄金の延べ棒×3）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv20〜 【汎用エピック】Yランダムボックスで入手できる強竿
  // ──────────────────────────────────────────────────────────
  master_rod: {
    id:'master_rod', name:'マスターロッド', icon:'🎣', rarity:'epic', minLevel:20,
    rarityBonus:0.14, largeFishBonus:0.10, expMult:1.4, maxDurability:150,
    fishCoinMult:1.3,
    role:'🎯 汎用エピック（中盤〜後半）',
    description:'全ステータスが高水準。入手できたら長く使える万能竿。',
    obtainHint:'Yランダムボックス（ドロップ）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv30〜 【Fish Coin×3特化】コイン稼ぎの最強候補
  // ──────────────────────────────────────────────────────────
  master_rod_z: {
    id:'master_rod_z', name:'マスターロッドZ', icon:'⚡', rarity:'epic', minLevel:30,
    rarityBonus:0.08, largeFishBonus:0.06, expMult:1.55, maxDurability:170,
    fishCoinMult:3.0,
    role:'🐟 Fish Coin×3（後半序盤）',
    description:'Fish Coin獲得量が3倍。交換所の高価なアイテムを狙うならこれ。EXP効率も高い。',
    obtainHint:'Fish Coin交換所（800枚）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv35〜 【深海+水中洞窟スポット特化】深海専用の圧力対応竿
  // ──────────────────────────────────────────────────────────
  deep_sea_rod: {
    id:'deep_sea_rod', name:'深海竿', icon:'🌑', rarity:'epic', minLevel:35,
    rarityBonus:0.15, largeFishBonus:0.20, expMult:1.3, maxDurability:160,
    fishCoinMult:1.5,
    spotBonus: { deepsea:0.25, underwater_cave:0.15, abyss:0.20 },
    role:'🌑 深海スポット特化',
    description:'深海・水中洞窟・奈落でレア率が大幅UP。深海専用設計。地上スポットでは平凡。',
    obtainHint:'クラフト（深海素材×5 + 鉄の延べ棒×5）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv40〜 【FFGG限定・レア+EXP複合型】イベント/コミュニティ限定
  // ──────────────────────────────────────────────────────────
  ffgg_rod_r1: {
    id:'ffgg_rod_r1', name:'FFGGロッドR1', icon:'🎣', rarity:'epic', minLevel:15,
    rarityBonus:0.12, largeFishBonus:0.08, expMult:1.6, maxDurability:160,
    fishCoinMult:1.8,
    role:'🎪 コミュニティ限定（中盤）',
    description:'FFGG限定の希少竿。レア率・EXP・Fish Coinすべて高め。通常入手不可。',
    obtainHint:'FFGG限定イベント報酬',
  },
  // ──────────────────────────────────────────────────────────
  // Lv45〜 【火山湖+溶岩スポット特化】炎系魚を大量狙い
  // ──────────────────────────────────────────────────────────
  lava_rod: {
    id:'lava_rod', name:'溶岩竿', icon:'🌋', rarity:'epic', minLevel:45,
    rarityBonus:0.12, largeFishBonus:0.25, expMult:1.5, maxDurability:180,
    fishCoinMult:1.5,
    spotBonus: { volcano_lake:0.30, deepsea:0.10 },
    role:'🌋 火山湖スポット特化',
    description:'耐熱素材で作られ火山湖でのレア率が大幅UP。大型魚ボーナスも高い。他スポットでは普通。',
    obtainHint:'火山湖解放後クラフト（溶岩石×5 + 龍の鱗×2）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv25〜 【FFGG中堅・大型特化】大型魚に偏った性能
  // ──────────────────────────────────────────────────────────
  ffgg_rod_r3: {
    id:'ffgg_rod_r3', name:'FFGGロッドR3', icon:'🎣', rarity:'epic', minLevel:25,
    rarityBonus:0.08, largeFishBonus:0.30, expMult:1.4, maxDurability:185,
    fishCoinMult:2.0,
    role:'📏 大型魚特化（コミュニティ上位）',
    description:'FFGG上位限定。大型魚ボーナスが際立って高い。サイズ記録を狙うのに最適。',
    obtainHint:'FFGG Rank3以上イベント報酬',
  },
  // ──────────────────────────────────────────────────────────
  // Lv60〜 【天空湖+虹滝スポット特化】幻魚・伝説へのアクセス
  // ──────────────────────────────────────────────────────────
  sky_rod: {
    id:'sky_rod', name:'天空竿', icon:'☁️', rarity:'legendary', minLevel:60,
    rarityBonus:0.20, largeFishBonus:0.15, expMult:1.8, maxDurability:220,
    fishCoinMult:2.0,
    spotBonus: { sky_lake:0.40, rainbow_falls:0.25, moonlit_pond:0.20 },
    legendaryBonus: 0.05,
    role:'☁️ 天空スポット特化',
    description:'天空湖・虹の滝でレア率が圧倒的にUP。神コイ・龍神など幻の魚に最も近づける。',
    obtainHint:'Fish Coin交換所（1500枚）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv40〜 【FFGG上位・Fish Coin×4】稼ぎに全振り
  // ──────────────────────────────────────────────────────────
  ffgg_rod_r6: {
    id:'ffgg_rod_r6', name:'FFGGロッドR6', icon:'🎣', rarity:'legendary', minLevel:40,
    rarityBonus:0.18, largeFishBonus:0.15, expMult:1.7, maxDurability:230,
    fishCoinMult:4.0,
    role:'🐟 Fish Coin×4（コミュニティ最上位）',
    description:'FFGG最高位限定。Fish Coinが4倍で稼げる究極の稼ぎ竿。',
    obtainHint:'FFGG Rank6以上イベント報酬',
  },
  // ──────────────────────────────────────────────────────────
  // Lv50〜 【FFGGR・全方位最強コミュニティ竿】
  // ──────────────────────────────────────────────────────────
  ffggr_rod: {
    id:'ffggr_rod', name:'FFGGRロッド', icon:'🌟', rarity:'legendary', minLevel:50,
    rarityBonus:0.25, largeFishBonus:0.20, expMult:2.1, maxDurability:270,
    fishCoinMult:3.5,
    role:'🌟 GGR全方位強化',
    description:'GGR最高ランク限定。レア・大型・EXP・Fish Coinすべて高水準。通常竿の最高峰。',
    obtainHint:'GGR最高ランク報酬',
  },
  // ──────────────────────────────────────────────────────────
  // Lv70〜 【伝説魚+深海+天空 複合特化】後半の最強竿候補
  // ──────────────────────────────────────────────────────────
  dragon_rod: {
    id:'dragon_rod', name:'龍の釣り竿', icon:'🐉', rarity:'legendary', minLevel:70,
    rarityBonus:0.22, largeFishBonus:0.35, expMult:2.0, maxDurability:250,
    fishCoinMult:2.5,
    spotBonus: { sky_lake:0.20, volcano_lake:0.20, golden_river:0.25, abyss:0.15 },
    legendaryBonus: 0.10,
    role:'🐉 伝説魚特化（後半）',
    description:'龍の力で伝説魚出現率が大幅UP。大型魚ボーナスも最高クラス。後半スポットで真価を発揮。',
    obtainHint:'釣りLv70達成 + 龍神討伐後クラフト（龍の骨×3 + 龍の鱗×5）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv90〜 【EXP+レア+伝説 極致の竿】到達者だけが使える
  // ──────────────────────────────────────────────────────────
  god_rod: {
    id:'god_rod', name:'神竿', icon:'✨', rarity:'legendary', minLevel:90,
    rarityBonus:0.35, largeFishBonus:0.30, expMult:2.5, maxDurability:999,
    fishCoinMult:3.0,
    spotBonus: { heaven:0.50, abyss:0.30, chaos_sea:0.30, crystal_sea:0.20 },
    legendaryBonus: 0.20,
    role:'✨ 全スペック最上位（Lv90）',
    description:'神が授かった竿。天界・奈落・混沌の海で全ステータスが極限まで上昇。Lv90到達証明。',
    obtainHint:'釣りLv90達成で自動解放（要スキルツリー確認）',
  },
  // ──────────────────────────────────────────────────────────
  // Lv100〜 【∞竿 図鑑100%コンプ報酬】ゲームの最終到達点
  // ──────────────────────────────────────────────────────────
  infinite_rod: {
    id:'infinite_rod', name:'∞竿', icon:'♾️', rarity:'legendary', minLevel:100,
    rarityBonus:0.50, largeFishBonus:0.50, expMult:3.0, maxDurability:9999,
    fishCoinMult:5.0,
    spotBonus: { heaven:0.80, abyss:0.60, chaos_sea:0.60, sky_lake:0.50, golden_river:0.50 },
    legendaryBonus: 0.50,
    role:'♾️ 究極・全ステ最大（Lv100+図鑑100%）',
    description:'無限の力を持つ究極の竿。全スポット・全魚種に対して最大ボーナス。伝説魚が大幅に釣れやすくなる。',
    obtainHint:'釣りLv100 + 魚図鑑100%コンプリートで入手',
  },
};
export const ROD_IDS = Object.keys(ROD_MASTER);

// ─── 餌マスター ─────────────────────────────────────────────
export interface BaitMaster {
  id: string; name: string; icon: string; rarity: FishRarity; description: string;
  rarityBonus: number; sizeBonus: number; weightBonus: number; expBonus: number;
  buyPrice?: number; stackSize: number;
}
export const BAIT_MASTER: Record<string, BaitMaster> = {
  mimizu:          { id:'mimizu',          name:'ミミズ',          icon:'🪱', rarity:'common',   rarityBonus:0,    sizeBonus:0,    weightBonus:0,    expBonus:0,    buyPrice:10,  stackSize:99, description:'一番基本の餌。' },
  ebi_bait:        { id:'ebi_bait',        name:'小エビ',          icon:'🦐', rarity:'common',   rarityBonus:0.01, sizeBonus:0.02, weightBonus:0.02, expBonus:0,    buyPrice:15,  stackSize:99, description:'小型の海の生き物。' },
  corn:            { id:'corn',            name:'コーン',          icon:'🌽', rarity:'common',   rarityBonus:0,    sizeBonus:0.03, weightBonus:0.01, expBonus:0.05, buyPrice:10,  stackSize:99, description:'コイに効果的。' },
  bread:           { id:'bread',           name:'パン粉',          icon:'🍞', rarity:'common',   rarityBonus:0.01, sizeBonus:0.02, weightBonus:0.02, expBonus:0,    buyPrice:12,  stackSize:99, description:'淡水魚に有効。' },
  small_fish:      { id:'small_fish',      name:'小魚',            icon:'🐟', rarity:'common',   rarityBonus:0.02, sizeBonus:0.03, weightBonus:0.03, expBonus:0.05, buyPrice:20,  stackSize:99, description:'肉食魚を引き寄せる。' },
  squid_bait:      { id:'squid_bait',      name:'イカ切り身',      icon:'🦑', rarity:'uncommon', rarityBonus:0.03, sizeBonus:0.05, weightBonus:0.05, expBonus:0.05, buyPrice:30,  stackSize:99, description:'海水魚に効果的。' },
  crab_bait:       { id:'crab_bait',       name:'カニの爪',        icon:'🦀', rarity:'uncommon', rarityBonus:0.04, sizeBonus:0.06, weightBonus:0.06, expBonus:0.10, buyPrice:40,  stackSize:99, description:'大型魚を誘引。' },
  lure_basic:      { id:'lure_basic',      name:'基本ルアー',      icon:'🪁', rarity:'uncommon', rarityBonus:0.04, sizeBonus:0.04, weightBonus:0.04, expBonus:0.10, buyPrice:50,  stackSize:50, description:'汎用の疑似餌。' },
  fly_lure:        { id:'fly_lure',        name:'フライルアー',    icon:'🪰', rarity:'uncommon', rarityBonus:0.05, sizeBonus:0.03, weightBonus:0.03, expBonus:0.15, buyPrice:60,  stackSize:50, description:'渓流釣り向け。' },
  shrimp_bait:     { id:'shrimp_bait',     name:'特製エビ',        icon:'🍤', rarity:'uncommon', rarityBonus:0.05, sizeBonus:0.07, weightBonus:0.07, expBonus:0.10, buyPrice:70,  stackSize:99, description:'高品質なエビ餌。' },
  glowing_worm:    { id:'glowing_worm',    name:'光るミミズ',      icon:'✨', rarity:'rare',     rarityBonus:0.08, sizeBonus:0.08, weightBonus:0.08, expBonus:0.20, buyPrice:150, stackSize:50, description:'暗所でも効果的。' },
  deep_lure:       { id:'deep_lure',       name:'深海ルアー',      icon:'🌑', rarity:'rare',     rarityBonus:0.10, sizeBonus:0.10, weightBonus:0.10, expBonus:0.20, buyPrice:200, stackSize:30, description:'深海魚専用の圧力対応ルアー。' },
  golden_bait:     { id:'golden_bait',     name:'黄金の餌',        icon:'✨', rarity:'rare',     rarityBonus:0.12, sizeBonus:0.12, weightBonus:0.12, expBonus:0.25, buyPrice:300, stackSize:30, description:'金箔をまとった高級餌。' },
  fire_lure:       { id:'fire_lure',       name:'炎のルアー',      icon:'🔥', rarity:'rare',     rarityBonus:0.10, sizeBonus:0.15, weightBonus:0.12, expBonus:0.20,              stackSize:30, description:'火山湖専用ルアー。' },
  magic_bait:      { id:'magic_bait',      name:'魔法の餌',        icon:'🔮', rarity:'rare',     rarityBonus:0.15, sizeBonus:0.10, weightBonus:0.10, expBonus:0.30,              stackSize:20, description:'魔力を帯びた神秘の餌。' },
  premium_lure:    { id:'premium_lure',    name:'高級ルアー',      icon:'🎯', rarity:'epic',     rarityBonus:0.18, sizeBonus:0.18, weightBonus:0.18, expBonus:0.40,              stackSize:20, description:'熟練釣り師が使う最高品質のルアー。' },
  crystal_bait:    { id:'crystal_bait',    name:'水晶の餌',        icon:'💎', rarity:'epic',     rarityBonus:0.20, sizeBonus:0.20, weightBonus:0.20, expBonus:0.40,              stackSize:15, description:'純粋な水晶から作られた餌。' },
  dragon_bait:     { id:'dragon_bait',     name:'龍の血',          icon:'🐉', rarity:'epic',     rarityBonus:0.25, sizeBonus:0.25, weightBonus:0.25, expBonus:0.50,              stackSize:10, description:'龍の血を使った伝説の餌。' },
  rainbow_lure:    { id:'rainbow_lure',    name:'虹色ルアー',      icon:'🌈', rarity:'epic',     rarityBonus:0.22, sizeBonus:0.22, weightBonus:0.22, expBonus:0.45,              stackSize:10, description:'七色に輝く幻のルアー。' },
  star_bait:       { id:'star_bait',       name:'星の破片',        icon:'⭐', rarity:'epic',     rarityBonus:0.28, sizeBonus:0.15, weightBonus:0.15, expBonus:0.60,              stackSize:10, description:'流れ星から採れた神秘の餌。' },
  god_bait:        { id:'god_bait',        name:'神の餌',          icon:'🌟', rarity:'legendary',rarityBonus:0.40, sizeBonus:0.40, weightBonus:0.40, expBonus:0.80,              stackSize:5,  description:'神が授けた究極の餌。伝説魚に有効。' },
  chaos_bait:      { id:'chaos_bait',      name:'混沌の餌',        icon:'🌀', rarity:'legendary',rarityBonus:0.45, sizeBonus:0.30, weightBonus:0.30, expBonus:0.70,              stackSize:5,  description:'予測不能な効果をもたらす餌。' },
  infinity_bait:   { id:'infinity_bait',   name:'∞の餌',           icon:'♾️', rarity:'legendary',rarityBonus:0.50, sizeBonus:0.50, weightBonus:0.50, expBonus:1.0,               stackSize:3,  description:'無限の釣果をもたらす伝説の餌。' },
  moon_bait:       { id:'moon_bait',       name:'月光の餌',        icon:'🌙', rarity:'legendary',rarityBonus:0.35, sizeBonus:0.45, weightBonus:0.45, expBonus:0.90,              stackSize:5,  description:'満月の力を宿した神秘の餌。' },
  thunder_lure:    { id:'thunder_lure',    name:'雷光ルアー',      icon:'⚡', rarity:'legendary',rarityBonus:0.42, sizeBonus:0.35, weightBonus:0.35, expBonus:0.85,              stackSize:5,  description:'雷を宿した最速のルアー。' },
  void_bait:       { id:'void_bait',       name:'虚空の餌',        icon:'🕳️', rarity:'legendary',rarityBonus:0.48, sizeBonus:0.20, weightBonus:0.20, expBonus:1.0,               stackSize:3,  description:'虚空から生まれた謎の餌。' },
  ancient_bait:    { id:'ancient_bait',    name:'古代の餌',        icon:'🏛️', rarity:'epic',     rarityBonus:0.24, sizeBonus:0.28, weightBonus:0.28, expBonus:0.55,              stackSize:10, description:'古代遺跡から発掘された餌。' },
  ice_lure:        { id:'ice_lure',        name:'氷河ルアー',      icon:'🧊', rarity:'rare',     rarityBonus:0.11, sizeBonus:0.13, weightBonus:0.13, expBonus:0.25,              stackSize:30, description:'氷河の海専用ルアー。' },
  soul_bait:       { id:'soul_bait',       name:'魂の餌',          icon:'👻', rarity:'legendary',rarityBonus:0.38, sizeBonus:0.42, weightBonus:0.42, expBonus:0.95,              stackSize:5,  description:'魂を呼び寄せる禁断の餌。' },
  poison_lure:     { id:'poison_lure',     name:'毒ルアー',        icon:'☠️', rarity:'rare',     rarityBonus:0.09, sizeBonus:0.08, weightBonus:0.08, expBonus:0.22, buyPrice:120, stackSize:30, description:'毒を仕込んだ危険なルアー。' },
};
export const BAIT_IDS = Object.keys(BAIT_MASTER);

// ─── 釣りレベル特典 ─────────────────────────────────────────
export interface FishingLevelBonus {
  level: number; description: string;
  rarityBonus?: number; largeFishBonus?: number; legendaryBonus?: number;
}
export const FISHING_LEVEL_BONUSES: FishingLevelBonus[] = [
  { level: 10,    description: 'レア率+5%',        rarityBonus: 0.05 },
  { level: 20,    description: 'レア率+10%',        rarityBonus: 0.10 },
  { level: 30,    description: '大型魚出現率+10%',  largeFishBonus: 0.10 },
  { level: 50,    description: '大型魚出現率+20%',  largeFishBonus: 0.20 },
  { level: 70,    description: 'レア率+15%',        rarityBonus: 0.15 },
  { level: 100,   description: '伝説魚率+50%',      legendaryBonus: 0.50 },
  // Lv100以降の長期ボーナス
  { level: 200,   description: 'レア率+5%',         rarityBonus: 0.05 },
  { level: 500,   description: '伝説魚率+20%',      legendaryBonus: 0.20 },
  { level: 1000,  description: 'レア率+10%',        rarityBonus: 0.10 },
  { level: 2000,  description: '大型魚出現率+10%',  largeFishBonus: 0.10 },
  { level: 5000,  description: '伝説魚率+30%',      legendaryBonus: 0.30 },
  { level: 10000, description: 'レア率+15%',        rarityBonus: 0.15 },
  { level: 20000, description: '大型魚出現率+15%',  largeFishBonus: 0.15 },
  { level: 50000, description: '伝説魚率+50%',      legendaryBonus: 0.50 },
  { level: 100000,description: 'すべての率+30%・伝説+100%', rarityBonus: 0.30, largeFishBonus: 0.30, legendaryBonus: 1.0 },
];
export function getFishingBonuses(lv: number) {
  let rarityBonus = 0, largeFishBonus = 0, legendaryBonus = 0;
  for (const b of FISHING_LEVEL_BONUSES) {
    if (lv >= b.level) {
      rarityBonus      += b.rarityBonus      ?? 0;
      largeFishBonus   += b.largeFishBonus   ?? 0;
      legendaryBonus   += b.legendaryBonus   ?? 0;
    }
  }
  return { rarityBonus, largeFishBonus, legendaryBonus };
}

// EXP計算（Lv100000対応・3段階スケール）
export function fishingExpRequired(level: number): number {
  if (level <= 100) return Math.floor(Math.pow(level, 1.8) * 60);
  if (level <= 1000) return Math.floor(Math.pow(level, 1.9) * 80);
  if (level <= 10000) return Math.floor(Math.pow(level, 2.0) * 100);
  return Math.floor(Math.pow(level, 2.1) * 120);
}

// サイズ→重量
export function calcWeight(fish: FishMaster, sizeCm: number): number {
  return Math.round(Math.pow(sizeCm, 1.8) * fish.weightFactor * 10) / 10;
}

// 売値
export function calcFishSellPrice(fish: FishMaster, sizeCm: number): number {
  const sizeRatio = sizeCm / fish.maxSizeCm;
  const rarityMult = { common:1, uncommon:2, rare:5, epic:15, legendary:50 }[fish.rarity];
  return Math.floor(fish.sellPrice * sizeCm * sizeRatio * rarityMult / 10);
}

// 強化成功率（+0〜+20）
export function rodEnhanceSuccessRate(currentLevel: number): number {
  if (currentLevel <= 3)  return 0.95;
  if (currentLevel <= 6)  return 0.80;
  if (currentLevel <= 10) return 0.60;
  if (currentLevel <= 14) return 0.35;
  if (currentLevel <= 17) return 0.20;
  return 0.10;
}

export const RARITY_COLOR: Record<FishRarity, string> = {
  common:'#9ca3af', uncommon:'#34d399', rare:'#60a5fa', epic:'#a78bfa', legendary:'#fbbf24',
};
export const RARITY_LABEL: Record<FishRarity, string> = {
  common:'コモン', uncommon:'アンコモン', rare:'レア', epic:'エピック', legendary:'レジェンダリー',
};

// ─── 釣り称号 ────────────────────────────────────────────────
export interface FishingTitle {
  id: string; label: string; condition: (p: FishingTitleContext) => boolean;
}
export interface FishingTitleContext {
  fishingLevel: number; totalCount: number; bookCount: number;
  maxSizeCm: number; maxWeightKg: number;
  fishBook: Record<string, { totalCaught: number; maxSizeCm: number }>;
  unlockedFishingAchievements: string[];
}
export const FISHING_TITLES: FishingTitle[] = [
  { id:'ft_beginner',   label:'🌱 釣り見習い',     condition: c => c.fishingLevel >= 1 },
  { id:'ft_novice',     label:'🎣 釣り初心者',     condition: c => c.fishingLevel >= 5 },
  { id:'ft_angler',     label:'🐟 アングラー',     condition: c => c.fishingLevel >= 10 },
  { id:'ft_fisherman',  label:'⚓ 漁師',           condition: c => c.fishingLevel >= 20 },
  { id:'ft_veteran',    label:'🏆 ベテラン漁師',   condition: c => c.fishingLevel >= 30 },
  { id:'ft_expert',     label:'💎 釣りエキスパート',condition: c => c.fishingLevel >= 40 },
  { id:'ft_master',     label:'👑 釣りマスター',   condition: c => c.fishingLevel >= 50 },
  { id:'ft_grandmaster',label:'🌟 グランドマスター',condition: c => c.fishingLevel >= 60 },
  { id:'ft_legend',     label:'🐉 釣り伝説',       condition: c => c.fishingLevel >= 70 },
  { id:'ft_hero',       label:'⚡ 釣り英雄',       condition: c => c.fishingLevel >= 80 },
  { id:'ft_god',        label:'✨ 釣りの神',       condition: c => c.fishingLevel >= 90 },
  { id:'ft_infinity',   label:'♾️ 釣り∞',         condition: c => c.fishingLevel >= 100 },
  // Lv100以降の長期称号
  { id:'ft_lv200',      label:'🌙 Lv200 月の釣り師',       condition: c => c.fishingLevel >= 200 },
  { id:'ft_lv500',      label:'⭐ Lv500 星の釣り師',       condition: c => c.fishingLevel >= 500 },
  { id:'ft_lv1000',     label:'💫 Lv1000 伝説の釣り人',    condition: c => c.fishingLevel >= 1000 },
  { id:'ft_lv2000',     label:'🌠 Lv2000 神話の釣り人',    condition: c => c.fishingLevel >= 2000 },
  { id:'ft_lv5000',     label:'🌌 Lv5000 宇宙の釣り師',    condition: c => c.fishingLevel >= 5000 },
  { id:'ft_lv10000',    label:'🐉 Lv10000 龍帝の釣り師',   condition: c => c.fishingLevel >= 10000 },
  { id:'ft_lv20000',    label:'👑 Lv20000 覇王の釣り師',   condition: c => c.fishingLevel >= 20000 },
  { id:'ft_lv50000',    label:'✨ Lv50000 神々の釣り師',   condition: c => c.fishingLevel >= 50000 },
  { id:'ft_lv100000',   label:'♾️ Lv100000 究極釣り師',   condition: c => c.fishingLevel >= 100000 },
  { id:'ft_catch10',    label:'🐟 初釣り師',       condition: c => c.totalCount >= 10 },
  { id:'ft_catch100',   label:'🐟 百匹釣り',       condition: c => c.totalCount >= 100 },
  { id:'ft_catch500',   label:'🐠 五百釣果',       condition: c => c.totalCount >= 500 },
  { id:'ft_catch1000',  label:'🦈 千匹の主',       condition: c => c.totalCount >= 1000 },
  { id:'ft_catch5000',  label:'🌊 五千釣果',       condition: c => c.totalCount >= 5000 },
  { id:'ft_catch10000', label:'🌊 万匹の漁師',     condition: c => c.totalCount >= 10000 },
  { id:'ft_book10',     label:'📖 図鑑初め',       condition: c => c.bookCount >= 10 },
  { id:'ft_book20',     label:'📚 図鑑収集者',     condition: c => c.bookCount >= 20 },
  { id:'ft_book30',     label:'📖 図鑑研究者',     condition: c => c.bookCount >= 30 },
  { id:'ft_book_all',   label:'🏅 図鑑完成！',     condition: c => c.bookCount >= TOTAL_FISH },
  { id:'ft_big50',      label:'📏 50cm達成',       condition: c => c.maxSizeCm >= 50 },
  { id:'ft_big100',     label:'📏 1m達成',         condition: c => c.maxSizeCm >= 100 },
  { id:'ft_big300',     label:'📐 3m達成',         condition: c => c.maxSizeCm >= 300 },
  { id:'ft_big1000',    label:'📐 10m達成',        condition: c => c.maxSizeCm >= 1000 },
  { id:'ft_big9999',    label:'♾️ 伝説のサイズ',  condition: c => c.maxSizeCm >= 9999 },
  { id:'ft_heavy10',    label:'⚖️ 10kg達成',       condition: c => c.maxWeightKg >= 10 },
  { id:'ft_heavy100',   label:'⚖️ 100kg達成',      condition: c => c.maxWeightKg >= 100 },
  { id:'ft_heavy1000',  label:'⚖️ 1トン達成',      condition: c => c.maxWeightKg >= 1000 },
  { id:'ft_ryujin',     label:'🐉 龍神釣り師',     condition: c => (c.fishBook['ryujin']?.totalCaught ?? 0) >= 1 },
  { id:'ft_infinity_catch',label:'♾️ ∞の釣り師',  condition: c => (c.fishBook['infinity_fish']?.totalCaught ?? 0) >= 1 },
  { id:'ft_sea_god',    label:'🌊 海神の使者',     condition: c => (c.fishBook['sea_god']?.totalCaught ?? 0) >= 1 },
  { id:'ft_phantom',    label:'👻 幻を追う者',     condition: c => (c.fishBook['phantom_tuna']?.totalCaught ?? 0) >= 1 },
  { id:'ft_legend_collector',label:'💎 伝説コレクター',condition: c => ['ryujin','phantom_tuna','sea_god','infinity_fish','god_koi'].every(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'ft_ryujin10',   label:'🐉 龍神の愛弟子',  condition: c => (c.fishBook['ryujin']?.totalCaught ?? 0) >= 10 },
  { id:'ft_all_epic',   label:'✨ エピック制覇',   condition: c => ['ryujin_bass','golden_carp','deep_whale','lava_shark','storm_tuna','crystal_fish'].every(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'ft_deep_explorer',label:'🌑 深海探検家',  condition: c => c.unlockedFishingAchievements.includes('fa_deepsea_unlock') },
  { id:'ft_sky_walker', label:'☁️ 天空の釣り師',  condition: c => c.unlockedFishingAchievements.includes('fa_sky_unlock') },
  { id:'ft_volcano',    label:'🌋 火山釣り師',    condition: c => c.unlockedFishingAchievements.includes('fa_volcano_unlock') },
  { id:'ft_heaven',     label:'🌟 天界の漁師',    condition: c => c.unlockedFishingAchievements.includes('fa_heaven_unlock') },
  { id:'ft_abyss',      label:'⚫ 奈落の主',      condition: c => c.unlockedFishingAchievements.includes('fa_abyss_unlock') },
  { id:'ft_rod_god',    label:'✨ 神竿の使い手',  condition: c => c.unlockedFishingAchievements.includes('fa_god_rod') },
  { id:'ft_enhance_max',label:'⚡ 強化の鬼',      condition: c => c.unlockedFishingAchievements.includes('fa_enhance_20') },
  { id:'ft_koi50',      label:'🐟 コイ50匹',      condition: c => (c.fishBook['koi']?.totalCaught ?? 0) >= 50 },
  { id:'ft_maguro10',   label:'🐟 マグロ10匹',    condition: c => (c.fishBook['maguro']?.totalCaught ?? 0) >= 10 },
  { id:'ft_shark10',    label:'🦈 サメ10匹',      condition: c => (c.fishBook['shark']?.totalCaught ?? 0) >= 10 },
  { id:'ft_tako10',     label:'🐙 タコ10匹',      condition: c => (c.fishBook['tako']?.totalCaught ?? 0) >= 10 },
  { id:'ft_3spot',      label:'📍 3スポット解放', condition: c => c.unlockedFishingAchievements.includes('fa_spots_3') },
  { id:'ft_10spot',     label:'🗺️ 10スポット解放',condition: c => c.unlockedFishingAchievements.includes('fa_spots_10') },
  { id:'ft_all_spot',   label:'🌍 全スポット制覇', condition: c => c.unlockedFishingAchievements.includes('fa_spots_all') },
  { id:'ft_bait100',    label:'🪱 餌100個使用',   condition: c => c.unlockedFishingAchievements.includes('fa_bait_100') },
  { id:'ft_bait1000',   label:'🍤 餌1000個使用',  condition: c => c.unlockedFishingAchievements.includes('fa_bait_1000') },
  { id:'ft_gold_fish',  label:'💰 釣り金持ち',    condition: c => c.unlockedFishingAchievements.includes('fa_gold_1m') },
  { id:'ft_common_all', label:'🐟 コモン全制覇',  condition: c => ['iwashi','aji','fugu','koi','tai','unagi','tanago','catfish'].every(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'ft_uncommon_all',label:'🐠 アンコモン全制覇',condition: c => ['sake','buri','hirame','tako','ebi','kani','hotate','piranha'].every(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'ft_rare_all',   label:'💎 レア全制覇',    condition: c => ['maguro','katsuo','shark','ika','dragon_fish','rainbow_koi','abyssal_eel'].every(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'ft_max_iwashi', label:'📏 イワシ最大',     condition: c => (c.fishBook['iwashi']?.maxSizeCm ?? 0) >= 25 },
  { id:'ft_max_maguro', label:'📏 マグロ最大',     condition: c => (c.fishBook['maguro']?.maxSizeCm ?? 0) >= 245 },
  { id:'ft_max_whale',  label:'🐋 クジラ最大',     condition: c => (c.fishBook['deep_whale']?.maxSizeCm ?? 0) >= 780 },
  { id:'ft_lv5_rod',    label:'⚡ 竿+5',           condition: c => c.unlockedFishingAchievements.includes('fa_rod_plus5') },
  { id:'ft_lv10_rod',   label:'⚡⚡ 竿+10',        condition: c => c.unlockedFishingAchievements.includes('fa_rod_plus10') },
  { id:'ft_lv20_rod',   label:'⚡⚡⚡ 竿+20',      condition: c => c.unlockedFishingAchievements.includes('fa_rod_plus20') },
  { id:'ft_first_legend',label:'🌟 初・伝説魚',   condition: c => ['ryujin','phantom_tuna','sea_god','infinity_fish','god_koi'].some(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'ft_catch50000', label:'🌊 五万釣果',       condition: c => c.totalCount >= 50000 },
  { id:'ft_book15',     label:'📗 図鑑15種',       condition: c => c.bookCount >= 15 },
  { id:'ft_lv25',       label:'🥈 Lv25',           condition: c => c.fishingLevel >= 25 },
  { id:'ft_lv45',       label:'🥇 Lv45',           condition: c => c.fishingLevel >= 45 },
  { id:'ft_lv55',       label:'💠 Lv55',           condition: c => c.fishingLevel >= 55 },
  { id:'ft_lv65',       label:'🔷 Lv65',           condition: c => c.fishingLevel >= 65 },
  { id:'ft_lv75',       label:'🔶 Lv75',           condition: c => c.fishingLevel >= 75 },
  { id:'ft_lv85',       label:'🟡 Lv85',           condition: c => c.fishingLevel >= 85 },
  { id:'ft_lv95',       label:'🟠 Lv95',           condition: c => c.fishingLevel >= 95 },
  { id:'ft_heavy500',   label:'⚖️ 500kg達成',      condition: c => c.maxWeightKg >= 500 },
  { id:'ft_book25',     label:'📘 図鑑25種',       condition: c => c.bookCount >= 25 },
  { id:'ft_god_koi',    label:'👑 神コイ召喚者',   condition: c => (c.fishBook['god_koi']?.totalCaught ?? 0) >= 1 },
  { id:'ft_chaos_fish', label:'🌀 混沌の漁師',     condition: c => c.unlockedFishingAchievements.includes('fa_chaos_unlock') },
  { id:'ft_rainbow_fish',label:'🌈 虹を釣った者', condition: c => (c.fishBook['rainbow_koi']?.totalCaught ?? 0) >= 1 },
  { id:'ft_crystal_catch',label:'💎 水晶魚ゲット', condition: c => (c.fishBook['crystal_fish']?.totalCaught ?? 0) >= 1 },
  { id:'ft_lava_master',label:'🌋 溶岩の主',       condition: c => (c.fishBook['lava_shark']?.totalCaught ?? 0) >= 1 },
  { id:'ft_storm_rider',label:'⚡ 嵐の釣り師',     condition: c => (c.fishBook['storm_tuna']?.totalCaught ?? 0) >= 1 },
  { id:'ft_piranha',    label:'😈 ピラニア釣り師',  condition: c => (c.fishBook['piranha']?.totalCaught ?? 0) >= 1 },
  { id:'ft_abyssal',    label:'🌑 深淵の漁師',     condition: c => (c.fishBook['abyssal_eel']?.totalCaught ?? 0) >= 1 },
  { id:'ft_all_rod',    label:'🎣 全竿コレクター', condition: c => c.unlockedFishingAchievements.includes('fa_all_rod') },
  { id:'ft_big500',     label:'📐 5m達成',         condition: c => c.maxSizeCm >= 500 },
  { id:'ft_heavy50',    label:'⚖️ 50kg達成',       condition: c => c.maxWeightKg >= 50 },
  { id:'ft_catch2000',  label:'🎣 2千釣果',        condition: c => c.totalCount >= 2000 },
  { id:'ft_dragon_rod', label:'🐉 龍竿の使い手',  condition: c => c.unlockedFishingAchievements.includes('fa_dragon_rod') },
  { id:'ft_infinite_rod',label:'♾️ ∞竿の使い手', condition: c => c.unlockedFishingAchievements.includes('fa_infinite_rod') },
  { id:'ft_bait_all',   label:'🍱 全餌コレクター', condition: c => c.unlockedFishingAchievements.includes('fa_all_bait') },
  { id:'ft_deep_whale10',label:'🐋 クジラ10匹',   condition: c => (c.fishBook['deep_whale']?.totalCaught ?? 0) >= 10 },
  { id:'ft_100years',   label:'⏳ 釣り百年',       condition: c => c.totalCount >= 100000 },
];

// ─── 釣り実績 ────────────────────────────────────────────────
export interface FishingAchievement {
  id: string; name: string; description: string; icon: string;
  checkFn: (ctx: FishingAchievContext) => boolean;
}
export interface FishingAchievContext {
  fishingLevel: number; totalCount: number; bookCount: number;
  maxSizeCm: number; maxWeightKg: number;
  fishBook: Record<string, { totalCaught: number; maxSizeCm: number; maxWeightKg: number }>;
  rodEnhanceLevel: Record<string, number>;
  unlockedSpots: string[];
  totalBaitUsed: number; totalGoldFromFishing: number;
}
export const FISHING_ACHIEVEMENTS: FishingAchievement[] = [
  { id:'fa_first_fish',    name:'初釣り',          description:'初めて魚を釣った',                      icon:'🎣', checkFn: c => c.totalCount >= 1 },
  { id:'fa_catch_10',      name:'10匹',            description:'合計10匹釣った',                        icon:'🐟', checkFn: c => c.totalCount >= 10 },
  { id:'fa_catch_100',     name:'100匹',           description:'合計100匹釣った',                       icon:'🐟', checkFn: c => c.totalCount >= 100 },
  { id:'fa_catch_500',     name:'500匹',           description:'合計500匹釣った',                       icon:'🐠', checkFn: c => c.totalCount >= 500 },
  { id:'fa_catch_1000',    name:'1000匹',          description:'合計1000匹釣った',                      icon:'🦈', checkFn: c => c.totalCount >= 1000 },
  { id:'fa_catch_5000',    name:'5000匹',          description:'合計5000匹釣った',                      icon:'🌊', checkFn: c => c.totalCount >= 5000 },
  { id:'fa_catch_10000',   name:'1万匹',           description:'合計10000匹釣った',                     icon:'🌊', checkFn: c => c.totalCount >= 10000 },
  { id:'fa_catch_50000',   name:'5万匹',           description:'合計50000匹釣った',                     icon:'🌊', checkFn: c => c.totalCount >= 50000 },
  { id:'fa_catch_100000',  name:'10万匹',          description:'合計10万匹釣った',                      icon:'🌊', checkFn: c => c.totalCount >= 100000 },
  { id:'fa_lv10',          name:'釣りLv10',        description:'釣りレベルが10になった',                icon:'⭐', checkFn: c => c.fishingLevel >= 10 },
  { id:'fa_lv20',          name:'釣りLv20',        description:'釣りレベルが20になった',                icon:'⭐', checkFn: c => c.fishingLevel >= 20 },
  { id:'fa_lv30',          name:'釣りLv30',        description:'釣りレベルが30になった',                icon:'⭐', checkFn: c => c.fishingLevel >= 30 },
  { id:'fa_lv50',          name:'釣りLv50',        description:'釣りレベルが50になった',                icon:'⭐', checkFn: c => c.fishingLevel >= 50 },
  { id:'fa_lv70',          name:'釣りLv70',        description:'釣りレベルが70になった',                icon:'🌟', checkFn: c => c.fishingLevel >= 70 },
  { id:'fa_lv100',         name:'釣りLv100',       description:'最大レベル到達！',                      icon:'👑', checkFn: c => c.fishingLevel >= 100 },
  { id:'fa_lv200',         name:'釣りLv200',       description:'釣りLv200到達',                         icon:'🌙', checkFn: c => c.fishingLevel >= 200 },
  { id:'fa_lv500',         name:'釣りLv500',       description:'釣りLv500到達',                         icon:'⭐', checkFn: c => c.fishingLevel >= 500 },
  { id:'fa_lv1000',        name:'釣りLv1000',      description:'釣りLv1000到達',                        icon:'💫', checkFn: c => c.fishingLevel >= 1000 },
  { id:'fa_lv2000',        name:'釣りLv2000',      description:'釣りLv2000到達',                        icon:'🌠', checkFn: c => c.fishingLevel >= 2000 },
  { id:'fa_lv5000',        name:'釣りLv5000',      description:'釣りLv5000到達',                        icon:'🌌', checkFn: c => c.fishingLevel >= 5000 },
  { id:'fa_lv10000',       name:'釣りLv10000',     description:'釣りLv10000到達',                       icon:'🐉', checkFn: c => c.fishingLevel >= 10000 },
  { id:'fa_lv50000',       name:'釣りLv50000',     description:'釣りLv50000到達',                       icon:'✨', checkFn: c => c.fishingLevel >= 50000 },
  { id:'fa_lv100000',      name:'釣りLv100000',    description:'究極の釣りLv100000到達！',               icon:'♾️', checkFn: c => c.fishingLevel >= 100000 },
  { id:'fa_book_5',        name:'図鑑5種',         description:'魚図鑑に5種登録した',                  icon:'📖', checkFn: c => c.bookCount >= 5 },
  { id:'fa_book_10',       name:'図鑑10種',        description:'魚図鑑に10種登録した',                  icon:'📚', checkFn: c => c.bookCount >= 10 },
  { id:'fa_book_20',       name:'図鑑20種',        description:'魚図鑑に20種登録した',                  icon:'📚', checkFn: c => c.bookCount >= 20 },
  { id:'fa_book_all',      name:'図鑑完成！',      description:'全種の魚を図鑑に登録した',              icon:'🏅', checkFn: c => c.bookCount >= TOTAL_FISH },
  { id:'fa_size_100',      name:'1m突破',          description:'100cm以上の魚を釣った',                icon:'📏', checkFn: c => c.maxSizeCm >= 100 },
  { id:'fa_size_300',      name:'3m突破',          description:'300cm以上の魚を釣った',                icon:'📐', checkFn: c => c.maxSizeCm >= 300 },
  { id:'fa_size_1000',     name:'10m突破',         description:'1000cm以上の魚を釣った',               icon:'🏟️', checkFn: c => c.maxSizeCm >= 1000 },
  { id:'fa_size_9999',     name:'∞サイズ',         description:'9999cmの∞魚を釣った',                  icon:'♾️', checkFn: c => c.maxSizeCm >= 9999 },
  { id:'fa_weight_100',    name:'100kg突破',       description:'100kg以上の魚を釣った',                icon:'⚖️', checkFn: c => c.maxWeightKg >= 100 },
  { id:'fa_weight_1000',   name:'1トン突破',       description:'1000kg以上の魚を釣った',               icon:'🏋️', checkFn: c => c.maxWeightKg >= 1000 },
  { id:'fa_legend_fish',   name:'初・伝説魚',      description:'初めて伝説の魚を釣った',                icon:'🌟', checkFn: c => ['ryujin','phantom_tuna','sea_god','infinity_fish','god_koi'].some(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'fa_all_legend',    name:'伝説全制覇',      description:'全伝説魚を釣った',                      icon:'💎', checkFn: c => ['ryujin','phantom_tuna','sea_god','infinity_fish','god_koi'].every(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'fa_deepsea_unlock',name:'深海解放',        description:'深海スポットを解放した',                icon:'🌑', checkFn: c => c.unlockedSpots.includes('deepsea') },
  { id:'fa_sky_unlock',    name:'天空湖解放',      description:'天空湖スポットを解放した',              icon:'☁️', checkFn: c => c.unlockedSpots.includes('sky_lake') },
  { id:'fa_volcano_unlock',name:'火山湖解放',      description:'火山湖スポットを解放した',              icon:'🌋', checkFn: c => c.unlockedSpots.includes('volcano_lake') },
  { id:'fa_heaven_unlock', name:'天界解放',        description:'天界の海スポットを解放した',            icon:'🌟', checkFn: c => c.unlockedSpots.includes('heaven') },
  { id:'fa_abyss_unlock',  name:'奈落解放',        description:'奈落スポットを解放した',                icon:'⚫', checkFn: c => c.unlockedSpots.includes('abyss') },
  { id:'fa_chaos_unlock',  name:'混沌解放',        description:'混沌の海スポットを解放した',            icon:'🌀', checkFn: c => c.unlockedSpots.includes('chaos_sea') },
  { id:'fa_spots_3',       name:'3スポット',       description:'3つのスポットを解放した',               icon:'📍', checkFn: c => c.unlockedSpots.length >= 3 },
  { id:'fa_spots_10',      name:'10スポット',      description:'10のスポットを解放した',                icon:'🗺️', checkFn: c => c.unlockedSpots.length >= 10 },
  { id:'fa_spots_all',     name:'全スポット制覇',  description:'全スポットを解放した',                  icon:'🌍', checkFn: c => c.unlockedSpots.length >= SPOT_IDS.length },
  { id:'fa_rod_plus5',     name:'竿+5強化',        description:'釣り竿を+5まで強化した',               icon:'⚡', checkFn: c => Object.values(c.rodEnhanceLevel).some(v => v >= 5) },
  { id:'fa_rod_plus10',    name:'竿+10強化',       description:'釣り竿を+10まで強化した',              icon:'⚡', checkFn: c => Object.values(c.rodEnhanceLevel).some(v => v >= 10) },
  { id:'fa_rod_plus15',    name:'竿+15強化',       description:'釣り竿を+15まで強化した',              icon:'⚡', checkFn: c => Object.values(c.rodEnhanceLevel).some(v => v >= 15) },
  { id:'fa_enhance_20',    name:'竿+20強化',       description:'釣り竿を最大+20まで強化した',          icon:'💥', checkFn: c => Object.values(c.rodEnhanceLevel).some(v => v >= 20) },
  { id:'fa_bait_100',      name:'餌100個',         description:'餌を合計100個使った',                  icon:'🪱', checkFn: c => c.totalBaitUsed >= 100 },
  { id:'fa_bait_1000',     name:'餌1000個',        description:'餌を合計1000個使った',                 icon:'🍤', checkFn: c => c.totalBaitUsed >= 1000 },
  { id:'fa_bait_5000',     name:'餌5000個',        description:'餌を合計5000個使った',                 icon:'🎯', checkFn: c => c.totalBaitUsed >= 5000 },
  { id:'fa_gold_1m',       name:'釣り金持ち',      description:'釣りで合計100万G以上稼いだ',           icon:'💰', checkFn: c => c.totalGoldFromFishing >= 1_000_000 },
  { id:'fa_gold_10m',      name:'釣り大富豪',      description:'釣りで合計1000万G以上稼いだ',          icon:'💎', checkFn: c => c.totalGoldFromFishing >= 10_000_000 },
  { id:'fa_ryujin_1',      name:'龍神釣り',        description:'龍神を釣った',                          icon:'🐉', checkFn: c => (c.fishBook['ryujin']?.totalCaught ?? 0) >= 1 },
  { id:'fa_ryujin_10',     name:'龍神×10',         description:'龍神を10匹釣った',                      icon:'🐉', checkFn: c => (c.fishBook['ryujin']?.totalCaught ?? 0) >= 10 },
  { id:'fa_sea_god',       name:'海神釣り',        description:'海神を釣った',                          icon:'🌊', checkFn: c => (c.fishBook['sea_god']?.totalCaught ?? 0) >= 1 },
  { id:'fa_infinity',      name:'∞魚釣り',         description:'∞魚を釣った',                          icon:'♾️', checkFn: c => (c.fishBook['infinity_fish']?.totalCaught ?? 0) >= 1 },
  { id:'fa_god_rod',       name:'神竿ゲット',       description:'神竿を入手した',                        icon:'✨', checkFn: c => (c.rodEnhanceLevel['god_rod'] !== undefined) },
  { id:'fa_dragon_rod',    name:'龍竿ゲット',       description:'龍の釣り竿を入手した',                  icon:'🐉', checkFn: c => (c.rodEnhanceLevel['dragon_rod'] !== undefined) },
  { id:'fa_infinite_rod',  name:'∞竿ゲット',       description:'∞竿を入手した',                        icon:'♾️', checkFn: c => (c.rodEnhanceLevel['infinite_rod'] !== undefined) },
  { id:'fa_all_rod',       name:'全竿コレクター',  description:'全ての釣り竿を入手した',                icon:'🎣', checkFn: c => ROD_IDS.every(id => c.rodEnhanceLevel[id] !== undefined) },
  { id:'fa_all_bait',      name:'全餌コレクター',  description:'全ての餌を一度以上使った',              icon:'🍱', checkFn: c => c.totalBaitUsed >= BAIT_IDS.length },
  { id:'fa_maguro_max',    name:'マグロ最大',       description:'250cmのマグロを釣った',                 icon:'🐟', checkFn: c => (c.fishBook['maguro']?.maxSizeCm ?? 0) >= 245 },
  { id:'fa_whale_max',     name:'クジラ最大',       description:'800cmのクジラを釣った',                 icon:'🐋', checkFn: c => (c.fishBook['deep_whale']?.maxSizeCm ?? 0) >= 780 },
  { id:'fa_epic_all',      name:'エピック全制覇',  description:'全エピック魚を釣った',                  icon:'💜', checkFn: c => ['ryujin_bass','golden_carp','deep_whale','lava_shark','storm_tuna','crystal_fish'].every(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'fa_rare_all',      name:'レア全制覇',      description:'全レア魚を釣った',                      icon:'💙', checkFn: c => ['maguro','katsuo','shark','ika','dragon_fish','rainbow_koi','abyssal_eel'].every(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'fa_common_all',    name:'コモン全制覇',    description:'全コモン魚を釣った',                    icon:'🟢', checkFn: c => ['iwashi','aji','fugu','koi','tai','unagi','tanago','catfish'].every(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'fa_uncommon_all',  name:'アンコモン全制覇',description:'全アンコモン魚を釣った',               icon:'🟡', checkFn: c => ['sake','buri','hirame','tako','ebi','kani','hotate','piranha'].every(id => (c.fishBook[id]?.totalCaught ?? 0) >= 1) },
  { id:'fa_rainbow_koi',   name:'虹コイ釣り',      description:'虹色コイを釣った',                      icon:'🌈', checkFn: c => (c.fishBook['rainbow_koi']?.totalCaught ?? 0) >= 1 },
  { id:'fa_god_koi',       name:'神コイ釣り',       description:'神コイを釣った',                        icon:'👑', checkFn: c => (c.fishBook['god_koi']?.totalCaught ?? 0) >= 1 },
  { id:'fa_crystal_fish',  name:'水晶魚釣り',      description:'水晶魚を釣った',                        icon:'💎', checkFn: c => (c.fishBook['crystal_fish']?.totalCaught ?? 0) >= 1 },
  { id:'fa_lava_shark',    name:'溶岩サメ釣り',    description:'溶岩シャークを釣った',                  icon:'🦈', checkFn: c => (c.fishBook['lava_shark']?.totalCaught ?? 0) >= 1 },
  { id:'fa_storm_tuna',    name:'嵐マグロ釣り',    description:'嵐マグロを釣った',                      icon:'⚡', checkFn: c => (c.fishBook['storm_tuna']?.totalCaught ?? 0) >= 1 },
  { id:'fa_dragon_fish',   name:'ドラゴンフィッシュ釣り',description:'ドラゴンフィッシュを釣った',     icon:'🔥', checkFn: c => (c.fishBook['dragon_fish']?.totalCaught ?? 0) >= 1 },
  { id:'fa_abyssal_eel',   name:'深淵ウミヘビ釣り',description:'深淵ウミヘビを釣った',                 icon:'🌑', checkFn: c => (c.fishBook['abyssal_eel']?.totalCaught ?? 0) >= 1 },
  { id:'fa_phantom_tuna',  name:'幻マグロ釣り',    description:'幻のマグロを釣った',                    icon:'👻', checkFn: c => (c.fishBook['phantom_tuna']?.totalCaught ?? 0) >= 1 },
  { id:'fa_catch_2000',    name:'2000匹',          description:'合計2000匹釣った',                      icon:'🎣', checkFn: c => c.totalCount >= 2000 },
  { id:'fa_catch_20000',   name:'2万匹',           description:'合計2万匹釣った',                       icon:'🌊', checkFn: c => c.totalCount >= 20000 },
  { id:'fa_rainbow_falls', name:'虹の滝解放',      description:'虹の滝スポットを解放した',              icon:'🌈', checkFn: c => c.unlockedSpots.includes('rainbow_falls') },
  { id:'fa_crystal_sea',   name:'水晶の海解放',    description:'水晶の海スポットを解放した',            icon:'💎', checkFn: c => c.unlockedSpots.includes('crystal_sea') },
  { id:'fa_golden_river',  name:'黄金の川解放',    description:'黄金の川スポットを解放した',            icon:'✨', checkFn: c => c.unlockedSpots.includes('golden_river') },
  { id:'fa_deep_whale',    name:'深淵クジラ釣り',  description:'深淵クジラを釣った',                    icon:'🐋', checkFn: c => (c.fishBook['deep_whale']?.totalCaught ?? 0) >= 1 },
  { id:'fa_golden_carp',   name:'黄金コイ釣り',    description:'黄金コイを釣った',                      icon:'🐠', checkFn: c => (c.fishBook['golden_carp']?.totalCaught ?? 0) >= 1 },
];
