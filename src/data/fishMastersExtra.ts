// src/data/fishMastersExtra.ts – 釣り やりこみ拡張
import type { FishMaster, FishRarity } from './fishMasters';

// ─── 伝説魚 (50種, 出現率 0.01%以下) ─────────────────────────
// [id, name, icon, minLevel, baseExp, minSizeCm, maxSizeCm, sellPrice, description, baseRate]
const LEGEND_DATA: [string, string, string, number, number, number, number, number, string, number][] = [
  ['golden_tuna',    '黄金マグロ',   '🌟', 60,  3000, 200, 500,  2000, '全身が黄金に輝く伝説のマグロ。',           0.00008],
  ['deepsea_king',   '深海王',       '👑', 70,  3500, 300, 700,  2500, '深海の頂点に立つ王者。',                   0.00006],
  ['phantom_eel',    '幻影ウナギ',   '👻', 65,  3200, 250, 600,  2200, '実体を持たないとされる幻のウナギ。',       0.00007],
  ['sky_whale',      '天空クジラ',   '☁️', 75,  4000, 400, 900,  3000, '雲の上を泳ぐ巨大なクジラ。',               0.00005],
  ['time_fish',      '時空魚',       '🌀', 80,  4200, 100, 9999, 3200, '時空を超えて現れる謎の魚。',               0.00004],
  ['ancient_shark',  '古代サメ',     '🦴', 68,  3400, 280, 650,  2400, '太古から生き続ける古代のサメ。',           0.00007],
  ['god_dragon_fish','神龍魚',       '🐉', 90,  5000, 350, 800,  4000, '龍神の化身とされる神聖な魚。',             0.00003],
  ['underworld_envoy','冥府の使者',  '💀', 78,  3900, 200, 500,  2800, '冥府からの使者を名乗る黒い魚。',           0.00006],
  ['void_serpent',   '虚空の蛇',     '🕳️', 82,  4100, 300, 700,  3000, '虚空に潜む巨大な蛇のような魚。',           0.00005],
  ['dragon_king',    '龍王',         '🐲', 95,  5200, 400, 900,  4500, 'すべての龍を統べる王。',                   0.00003],
  ['phoenix_fish',   '不死鳥魚',     '🔥', 85,  4400, 200, 500,  3500, '炎をまとい何度でも蘇るとされる魚。',       0.00005],
  ['creator_fish',   '創造主の魚',   '✨', 100, 6000, 500, 9999, 5000, 'すべての魚の創造主と呼ばれる。',           0.00002],
  ['ruin_whale',     '滅びの大鯨',   '⚫', 88,  4600, 450, 999,  3800, 'その姿を見た者に終焉が訪れるという。',     0.00004],
  ['galaxy_fish',    '銀河魚',       '🌌', 83,  4300, 150, 500,  3300, '体内に銀河が広がっているという魚。',       0.00005],
  ['meteor_fish',    '隕石魚',       '☄️', 79,  3950, 100, 400,  2900, '隕石と共に飛来したとされる魚。',           0.00006],
  ['sun_fish_god',   '太陽魚',       '☀️', 86,  4500, 200, 600,  3600, '太陽の力を秘めた光り輝く魚。',             0.00005],
  ['moon_shadow_fish','月影魚',      '🌙', 84,  4350, 180, 550,  3400, '満月の夜にだけ影が見えるという魚。',       0.00005],
  ['thunder_god_fish','雷神魚',      '⚡', 87,  4550, 200, 600,  3650, '雷をまとい海を切り裂く神の魚。',           0.00005],
  ['storm_lord',     '嵐の覇者',     '🌪️', 89,  4700, 250, 650,  3750, '嵐そのものを支配するという魚。',           0.00004],
  ['ice_emperor_whale','氷皇クジラ', '🧊', 91,  4900, 400, 900,  3900, '氷の皇帝と呼ばれる巨大な鯨。',             0.00004],
  ['blaze_dragon_fish','灼熱竜魚',   '🌋', 92,  4950, 250, 650,  3950, '溶岩の中を泳ぐ竜の魚。',                   0.00004],
  ['dark_queen_fish','闇の女王',     '🖤', 81,  4150, 200, 550,  3150, '闇を統べる女王の化身。',                   0.00005],
  ['light_envoy_fish','光の使者',    '💡', 81,  4150, 200, 550,  3150, '光の世界からの使者とされる魚。',           0.00005],
  ['end_fish',       '終末魚',       '⚰️', 99,  5800, 400, 9999, 4800, '世界の終わりを告げるという伝承の魚。',     0.00002],
  ['origin_fish',    '始まりの魚',   '🥚', 99,  5800, 400, 9999, 4800, 'すべての始まりとされる原初の魚。',         0.00002],
  ['infinity_spiral_fish','無限螺旋魚','♾️',96, 5500, 300, 9999, 4600, '螺旋状の文様を持つ無限の魚。',             0.00003],
  ['black_dragon_fish','黒龍魚',     '🐉', 93,  5000, 350, 850,  4100, '闇の力をまとう黒い龍の魚。',               0.00004],
  ['white_tiger_fish','白虎魚',      '🐯', 88,  4650, 250, 650,  3700, '白虎の力を宿す伝説の魚。',                 0.00004],
  ['vermilion_bird_fish','朱雀魚',   '🐦', 88,  4650, 250, 650,  3700, '朱雀の名を冠した炎の魚。',                 0.00004],
  ['black_tortoise_fish','玄武魚',   '🐢', 88,  4650, 300, 700,  3700, '玄武の名を冠した堅牢な魚。',               0.00004],
  ['azure_dragon_fish','青龍魚',     '🐉', 93,  5000, 350, 850,  4100, '青龍の力をまとう神聖な魚。',               0.00004],
  ['phoenix_legend_fish','鳳凰魚',   '🔥', 94,  5100, 300, 800,  4200, '鳳凰の名を持つ伝説の魚。',                 0.00004],
  ['kirin_fish',     '麒麟魚',       '🦄', 94,  5100, 300, 800,  4200, '麒麟の如く気高い伝説の魚。',               0.00004],
  ['fairy_fish',     '妖精魚',       '🧚', 76,  3850, 50,  300,  2700, '妖精のように小さく美しい伝説の魚。',       0.00006],
  ['demon_ray',      '悪魔エイ',     '😈', 90,  4800, 300, 800,  3850, '悪魔のような姿をした巨大なエイ。',         0.00004],
  ['angel_fish_legend','天使フィッシュ','👼',90, 4800, 200, 600,  3850, '天使の翼を持つという伝説の魚。',           0.00004],
  ['destiny_fish',   '運命の魚',     '🔮', 97,  5600, 350, 900,  4700, '釣り上げた者の運命を変えるという。',       0.00003],
  ['miracle_fish',   '奇跡の魚',     '🍀', 97,  5600, 350, 900,  4700, '奇跡を呼ぶとされる伝説の魚。',             0.00003],
  ['golden_kraken',  '黄金クラーケン','🦑',98,  5700, 400, 9999, 4750, '黄金に輝く伝説のクラーケン。',             0.00003],
  ['deepsea_goddess','深海女神',     '🧜', 95,  5300, 300, 800,  4400, '深海に住むという女神の化身。',             0.00003],
  ['silver_phantom', '銀の幻影',     '🥈', 77,  3900, 200, 550,  2800, '銀色に光る幻のような魚。',                 0.00006],
  ['void_fish',      '虚無魚',       '🕳️', 86,  4500, 200, 9999, 3600, '虚無から生まれたとされる魚。',             0.00005],
  ['creation_dragon','創造龍',       '🐉', 99,  5900, 450, 9999, 4900, '世界を創造したという龍の化身。',           0.00002],
  ['destroyer_shark','破壊の鮫',     '🦈', 91,  4900, 350, 900,  3900, 'すべてを破壊するという伝説のサメ。',       0.00004],
  ['eternal_carp',   '永遠の鯉',     '🐠', 80,  4050, 250, 700,  3050, '永遠に生き続けるという伝説のコイ。',       0.00006],
  ['twilight_fish',  '黄昏の魚',     '🌆', 78,  3950, 200, 550,  2900, '黄昏時にだけ姿を見せる魚。',               0.00006],
  ['dawn_fish',      '夜明けの魚',   '🌅', 78,  3950, 200, 550,  2900, '夜明けの光と共に現れる魚。',               0.00006],
  ['stardust_fish',  '星屑魚',       '✨', 83,  4250, 150, 500,  3250, '体に星屑をまとう幻想的な魚。',             0.00005],
  ['dimension_fish', '異次元魚',     '🌐', 92,  4950, 300, 9999, 3950, '異次元から迷い込んだという魚。',           0.00004],
  ['myth_shark',     '神話の鮫',     '📜', 89,  4750, 300, 800,  3800, '神話に語り継がれる伝説のサメ。',           0.00004],
  ['legend_whale',   '伝承の鯨',     '📖', 87,  4600, 400, 900,  3700, '古い伝承に伝わる巨大な鯨。',               0.00005],
];

export const LEGENDARY_FISH: Record<string, FishMaster> = Object.fromEntries(
  LEGEND_DATA.map(([id, name, icon, minLevel, baseExp, minSizeCm, maxSizeCm, sellPrice, description, baseRate]) => [
    id,
    {
      id, name, rarity: 'legendary' as FishRarity, minLevel, baseExp,
      minSizeCm, maxSizeCm, weightFactor: 0.0060, baseRate, sellPrice, icon, description,
    } as FishMaster,
  ])
);
export const LEGENDARY_FISH_IDS = Object.keys(LEGENDARY_FISH);

// ─── 季節限定魚 (40種) ─────────────────────────────────────
type Season = 'spring' | 'summer' | 'autumn' | 'winter';
// [id, name, icon, season, minLevel, baseExp, minSize, maxSize, sellPrice, rarity, description]
const SEASONAL_DATA: [string, string, string, Season, number, number, number, number, number, FishRarity, string][] = [
  ['sakura_trout',    '桜マス',       '🌸', 'spring', 8,  40,  30, 80,  18, 'uncommon', '桜の咲く季節にだけ現れるマス。'],
  ['spring_smelt',    '春告げワカサギ','🌱','spring', 5,  20,  10, 25,  10, 'common',   '春の訪れを告げる小魚。'],
  ['hanami_koi',      '花見コイ',     '🌸', 'spring', 12, 60,  40, 110, 28, 'rare',     '桜の花びらを纏ったコイ。'],
  ['bud_fish',        '新芽フィッシュ','🌿','spring', 6,  25,  15, 40,  12, 'common',   '新芽のような若々しい魚。'],
  ['cherry_eel',      '桜ウナギ',     '🌸', 'spring', 18, 70,  50, 120, 30, 'rare',     '桜色をした珍しいウナギ。'],
  ['rain_frog_fish',  '春雨ガエル魚', '🐸', 'spring', 9,  35,  20, 50,  15, 'uncommon', '春雨の日に多く現れる魚。'],
  ['plum_blossom_fish','梅花魚',      '🌼', 'spring', 14, 65,  35, 90,  25, 'rare',     '梅の花のような模様を持つ魚。'],
  ['vernal_dragonet', '若竹ドラゴネット','🎋','spring',22, 90,  30, 80,  35, 'rare',     '竹のように柔らかい体を持つ魚。'],
  ['pollen_fish',     '花粉フィッシュ','🌾','spring', 7,  28,  18, 45,  13, 'common',   '花粉が舞う頃に姿を見せる。'],
  ['spring_breeze_fish','春風魚',     '🍃', 'spring', 16, 75,  40, 100, 27, 'uncommon', '春風と共に泳ぐ魚。'],
  ['sunfish_summer',  '夏の太陽魚',   '☀️', 'summer', 10, 45,  30, 90,  20, 'uncommon', '強い日差しの下で活発になる魚。'],
  ['firework_fish',   '花火フィッシュ','🎆','summer', 20, 95,  40, 130, 38, 'rare',     '花火大会の夜にだけ現れる。'],
  ['shaved_ice_fish', 'かき氷フィッシュ','🍧','summer',8,  35,  15, 50,  16, 'common',   '冷たい氷のような体を持つ魚。'],
  ['tropical_clownfish','トロピカルクラウン','🐠','summer',6, 22, 10, 35, 12, 'common',  '南国の海でよく見られる派手な魚。'],
  ['typhoon_marlin',  '台風カジキ',   '🌀', 'summer', 35, 160, 150, 350, 55, 'epic',    '台風と共に現れる巨大なカジキ。'],
  ['watermelon_fish', 'スイカ魚',     '🍉', 'summer', 9,  38,  20, 60,  17, 'common',   '体表がスイカ模様の魚。'],
  ['festival_goldfish','金魚すくい',  '🐡', 'summer', 4,  18,  5,  20,  8,  'common',   '夏祭りの金魚すくいでお馴染み。'],
  ['heatwave_tuna',   '猛暑マグロ',   '🥵', 'summer', 32, 150, 100, 300, 50, 'epic',    '猛暑の海で巨大化したマグロ。'],
  ['beach_crab',      'ビーチガニ',   '🦀', 'summer', 11, 50,  10, 35,  19, 'uncommon', '海水浴場でよく見かけるカニ。'],
  ['shavedrainbow_fish','虹色アイス魚','🍦','summer', 24, 105, 30, 90,  40, 'rare',     'カラフルなアイスのような魚。'],
  ['maple_carp',      '紅葉ゴイ',     '🍁', 'autumn', 12, 55,  35, 100, 24, 'uncommon', '紅葉の色を纏ったコイ。'],
  ['harvest_pumpkin_fish','ハロウィン南瓜魚','🎃','autumn',15,70, 30, 80, 28, 'uncommon','ハロウィンの時期に現れる魚。'],
  ['chestnut_fish',   '栗フィッシュ', '🌰', 'autumn', 7,  30,  15, 40,  14, 'common',   '栗のようなツヤを持つ小魚。'],
  ['moon_view_carp',  '月見ゴイ',     '🌕', 'autumn', 20, 90,  50, 130, 36, 'rare',     '満月の夜に最も活発になる。'],
  ['typhoon_eel',     '秋の嵐ウナギ', '🌪️', 'autumn', 28, 130, 80, 200, 45, 'epic',    '秋の嵐の中を泳ぐ巨大なウナギ。'],
  ['acorn_fish',      'どんぐり魚',   '🌳', 'autumn', 5,  22,  10, 30,  11, 'common',   'どんぐりのような丸い体。'],
  ['red_dragonfly_fish','赤とんぼ魚', '🪲', 'autumn', 9,  40,  15, 45,  16, 'common',   '赤とんぼが飛ぶ頃に現れる。'],
  ['harvest_moon_eel','収穫月ウナギ', '🌾', 'autumn', 18, 80,  45, 110, 32, 'rare',     '収穫祭の月夜に現れるウナギ。'],
  ['golden_wheat_fish','黄金麦魚',    '🌾', 'autumn', 14, 62,  30, 85,  26, 'uncommon', '黄金色の麦畑のような魚。'],
  ['foggy_carp',      '霧コイ',       '🌫️', 'autumn', 22, 100, 50, 140, 38, 'rare',     '秋霧の中でよく釣れるコイ。'],
  ['snow_trout',      '雪マス',       '❄️', 'winter', 16, 75,  40, 100, 30, 'rare',     '雪の積もる頃に現れるマス。'],
  ['icicle_fish',     'つらら魚',     '🧊', 'winter', 10, 45,  20, 55,  18, 'uncommon', '体が氷柱のように透き通る魚。'],
  ['hot_spring_carp', '温泉ゴイ',     '♨️', 'winter', 13, 58,  35, 95,  24, 'uncommon', '温泉地でよく釣れる温かいコイ。'],
  ['snowman_fish',    '雪だるま魚',   '⛄', 'winter', 6,  25,  15, 40,  12, 'common',   '雪だるまのような丸い体型。'],
  ['blizzard_shark',  '吹雪シャーク', '🌨️', 'winter', 33, 155, 120, 320, 52, 'epic',    '吹雪の中を泳ぐ大型のサメ。'],
  ['christmas_lights_fish','イルミ魚','🎇', 'winter', 19, 88,  40, 110, 34, 'rare',     'イルミネーションのように光る魚。'],
  ['frozen_pike',     '氷結パイク',   '🧊', 'winter', 25, 112, 60, 160, 42, 'rare',     '凍りつくほど冷たい体を持つ魚。'],
  ['new_year_tai',    '初日の出ダイ', '🌅', 'winter', 21, 95,  45, 120, 36, 'rare',     '初日の出と共に現れる縁起の良い魚。'],
  ['cold_wave_cod',   '寒波コッド',   '🥶', 'winter', 8,  35,  20, 55,  15, 'common',   '強烈な寒波で活性化する魚。'],
  ['mochi_fish',      '餅つき魚',     '🍡', 'winter', 5,  22,  10, 30,  11, 'common',   '丸くて餅のような体をした魚。'],
];

export const SEASONAL_FISH: Record<string, FishMaster> = Object.fromEntries(
  SEASONAL_DATA.map(([id, name, icon, season, minLevel, baseExp, minSizeCm, maxSizeCm, sellPrice, rarity, description]) => [
    id,
    {
      id, name, rarity, minLevel, baseExp, minSizeCm, maxSizeCm,
      weightFactor: 0.0015, baseRate: rarity === 'epic' ? 0.02 : rarity === 'rare' ? 0.05 : 0.10,
      sellPrice, icon, description, season,
    } as FishMaster,
  ])
);
export const SEASONAL_FISH_IDS = Object.keys(SEASONAL_FISH);
export function getCurrentSeason(date: Date = new Date()): Season {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}
export const SEASON_LABEL: Record<Season, string> = {
  spring: '🌸 春', summer: '☀️ 夏', autumn: '🍁 秋', winter: '❄️ 冬',
};

// ─── イベント魚 (50種) ──────────────────────────────────────
export interface EventDef { id: string; name: string; icon: string; months: number[]; }
export const EVENT_DEFS: EventDef[] = [
  { id: 'newyear',   name: '正月',       icon: '🎍', months: [1] },
  { id: 'valentine', name: 'バレンタイン',icon: '💝', months: [2] },
  { id: 'hanami',    name: '花見祭り',   icon: '🌸', months: [3] },
  { id: 'golden_week', name: 'ゴールデンウィーク', icon: '🎏', months: [4, 5] },
  { id: 'summer_fest', name: '夏祭り',   icon: '🎆', months: [6, 7] },
  { id: 'obon',      name: 'お盆',       icon: '🏮', months: [8] },
  { id: 'moon_fest', name: '月見祭り',   icon: '🌕', months: [9] },
  { id: 'halloween', name: 'ハロウィン', icon: '🎃', months: [10] },
  { id: 'thanksgiving', name: '収穫祭',  icon: '🍁', months: [11] },
  { id: 'christmas', name: 'クリスマス', icon: '🎄', months: [12] },
];
export function getActiveEventIds(date: Date = new Date()): string[] {
  const m = date.getMonth() + 1;
  return EVENT_DEFS.filter(e => e.months.includes(m)).map(e => e.id);
}

// [id, name, icon, eventId, minLevel, baseExp, minSize, maxSize, sellPrice, rarity, description]
const EVENT_DATA: [string, string, string, string, number, number, number, number, number, FishRarity, string][] = [
  ['kadomatsu_fish',  '門松魚',       '🎍', 'newyear', 10, 50, 30, 80,  20, 'uncommon', '正月飾りのような姿の魚。'],
  ['mochi_kagami_fish','鏡餅フィッシュ','🍡', 'newyear', 8, 40, 20, 60,  16, 'common',   '鏡餅のように丸い魚。'],
  ['otoshidama_fish', 'お年玉魚',     '💴', 'newyear', 18, 85, 40, 110, 34, 'rare',     '釣れると幸運が訪れるという。'],
  ['shishimai_fish',  '獅子舞フィッシュ','🦁','newyear',26, 120, 60, 180, 45, 'epic',    '獅子舞のような豪華な装飾を持つ。'],
  ['hatsumode_carp',  '初詣ゴイ',     '⛩️', 'newyear', 14, 65, 35, 95,  26, 'uncommon', '初詣の境内の池で見られるコイ。'],
  ['choco_fish',      'チョコフィッシュ','🍫','valentine',9, 42, 20, 55,  17, 'common',  'チョコレートのような色の魚。'],
  ['heart_fish',      'ハート魚',     '💗', 'valentine', 16, 75, 30, 90,  28, 'rare',    'ハート模様が浮き出ている魚。'],
  ['rose_betta',      'ローズベタ',   '🌹', 'valentine', 22, 100, 25, 70,  38, 'rare',    '薔薇のように美しいベタ。'],
  ['cupid_fish',      'キューピッド魚','💘','valentine', 30, 135, 50, 150, 48, 'epic',    '矢のような形をした幻の魚。'],
  ['giftbox_fish',    'ギフトボックス魚','🎁','valentine',12, 55, 25, 70,  22, 'uncommon','箱のような模様を持つ魚。'],
  ['sakura_mochi_fish','桜餅フィッシュ','🌸','hanami', 11, 52, 25, 70,  21, 'uncommon', '桜餅のような色合いの魚。'],
  ['hanami_dango_fish','花見団子魚',  '🍡', 'hanami', 13, 60, 30, 85,  24, 'uncommon', '三色団子のような模様の魚。'],
  ['petal_koi',       '花びらコイ',   '🌸', 'hanami', 19, 88, 45, 120, 33, 'rare',     '桜の花びらに包まれたコイ。'],
  ['picnic_fish',     'お花見魚',     '🧺', 'hanami', 7,  32, 15, 45,  14, 'common',   '花見シーズンに増える小魚。'],
  ['bloom_dragonfish','満開竜魚',     '🐉', 'hanami', 33, 150, 80, 220, 52, 'epic',    '満開の桜のように咲き誇る竜の魚。'],
  ['koinobori_fish',  '鯉のぼり魚',   '🎏', 'golden_week', 15, 70, 40, 110, 27, 'uncommon','鯉のぼりのように泳ぐ魚。'],
  ['golden_holiday_fish','黄金連休魚','✨','golden_week', 24, 110, 50, 140, 40, 'rare',  '休暇中にだけ現れる金色の魚。'],
  ['kashiwamochi_fish','柏餅フィッシュ','🍃','golden_week',10, 48, 20, 60, 19, 'common', '柏の葉のような模様の魚。'],
  ['may_breeze_fish', '五月風魚',     '🍃', 'golden_week', 17, 78, 40, 105, 30, 'uncommon','五月の爽やかな風と共に現れる。'],
  ['travel_fish',     '旅行魚',       '🧳', 'golden_week', 28, 128, 60, 170, 46, 'epic', '連休に遠くから泳いでくる魚。'],
  ['matsuri_goldfish','祭り金魚',     '🎏', 'summer_fest', 8,  38, 15, 45,  16, 'common', '夏祭りの屋台でよく見る金魚。'],
  ['yukata_fish',     '浴衣フィッシュ','👘','summer_fest', 14, 64, 30, 85,  25, 'uncommon','浴衣の柄のような模様を持つ。'],
  ['hanabi_dragonfish','花火竜魚',    '🎆', 'summer_fest', 36, 165, 90, 250, 56, 'epic',  '花火大会の夜に現れる幻の竜魚。'],
  ['suika_wari_fish', 'スイカ割り魚', '🍉', 'summer_fest', 11, 52, 25, 70,  20, 'uncommon','スイカ割りで使われそうな模様。'],
  ['ennichi_fish',    '縁日フィッシュ','🏮','summer_fest', 19, 88, 40, 110, 33, 'rare',   '縁日の提灯のように光る魚。'],
  ['chochin_fish',    '提灯魚',       '🏮', 'obon', 12, 56, 25, 75,  22, 'uncommon', '提灯のように光る不思議な魚。'],
  ['ancestor_carp',   '先祖コイ',     '🙏', 'obon', 27, 124, 60, 180, 44, 'epic',     '先祖の霊が宿るとされるコイ。'],
  ['bon_odori_fish',  '盆踊り魚',     '💃', 'obon', 16, 74, 35, 100, 29, 'uncommon', '盆踊りのように踊るように泳ぐ。'],
  ['spirit_fire_fish','精霊火魚',     '🔥', 'obon', 31, 142, 70, 200, 50, 'epic',     '精霊流しの灯りのように光る魚。'],
  ['somen_fish',      '素麺フィッシュ','🍜','obon', 9,  42, 18, 50,  17, 'common',   '細長く透明な麺のような魚。'],
  ['tsukimi_dango_fish','月見団子魚','🌕', 'moon_fest', 13, 60, 30, 85,  24, 'uncommon','月見団子のような丸い魚。'],
  ['susuki_fish',     'ススキ魚',     '🌾', 'moon_fest', 10, 48, 20, 60,  19, 'common', 'ススキのような細長い魚。'],
  ['harvest_moon_fish','中秋の魚',    '🌕', 'moon_fest', 25, 115, 55, 160, 42, 'rare',  '中秋の名月に現れる幻の魚。'],
  ['rabbit_fish_moon','月のうさぎ魚', '🐇', 'moon_fest', 34, 158, 80, 230, 54, 'epic',  '満月にうさぎの模様が浮かぶ魚。'],
  ['lantern_carp',    '灯篭コイ',     '🏮', 'moon_fest', 18, 84, 40, 110, 32, 'rare',  '灯篭流しの夜に現れるコイ。'],
  ['pumpkin_king_fish','パンプキンキング','🎃','halloween', 29, 132, 65, 190, 47, 'epic','ハロウィンの夜に現れる王者の魚。'],
  ['ghost_fish',      'おばけ魚',     '👻', 'halloween', 17, 80, 35, 100, 31, 'uncommon','おばけのように透き通る魚。'],
  ['candy_fish',      'キャンディ魚', '🍬', 'halloween', 8,  40, 15, 45,  16, 'common', 'キャンディのような縞模様。'],
  ['black_cat_fish',  '黒猫フィッシュ','🐈‍⬛','halloween', 20, 92, 45, 125, 35, 'rare', '黒猫のような姿の不思議な魚。'],
  ['witch_hat_fish',  '魔女帽子魚',   '🧙', 'halloween', 23, 105, 50, 140, 39, 'rare', '魔女の帽子のような形をした魚。'],
  ['maple_leaf_fish', 'もみじ魚',     '🍁', 'thanksgiving', 12, 56, 28, 80,  22, 'uncommon','紅葉のように色づく魚。'],
  ['harvest_king_fish','収穫王魚',    '👑', 'thanksgiving', 32, 146, 75, 210, 51, 'epic', '豊穣の象徴とされる伝説の魚。'],
  ['acorn_squirrel_fish','どんぐりリス魚','🐿️','thanksgiving',9, 44, 18, 50, 17, 'common','どんぐりを頬張るリスのような魚。'],
  ['rice_harvest_fish','稲刈り魚',    '🌾', 'thanksgiving', 15, 70, 32, 90,  27, 'uncommon','黄金の稲穂のような魚。'],
  ['turkey_fish',     'ターキーフィッシュ','🦃','thanksgiving',21, 96, 48, 130, 36, 'rare','感謝祭にちなんだ大きな魚。'],
  ['santa_fish',      'サンタ魚',     '🎅', 'christmas', 22, 100, 45, 130, 37, 'rare', 'サンタクロースのような赤白の魚。'],
  ['reindeer_fish',   'トナカイ魚',   '🦌', 'christmas', 26, 118, 58, 165, 43, 'epic', 'トナカイの角のようなヒレを持つ。'],
  ['snowman_carp',    'ゆきだるまゴイ','⛄', 'christmas', 14, 66, 32, 90,  25, 'uncommon','クリスマスの雪だるまのようなコイ。'],
  ['xmas_tree_fish',  'クリスマスツリー魚','🎄','christmas', 30, 138, 68, 195, 49, 'epic','クリスマスツリーのような飾りを持つ。'],
  ['gift_dragon_fish','プレゼント竜魚','🎁', 'christmas', 38, 175, 95, 270, 60, 'epic', 'クリスマスの夜だけ現れる伝説の竜魚。'],
];

export const EVENT_FISH: Record<string, FishMaster> = Object.fromEntries(
  EVENT_DATA.map(([id, name, icon, eventId, minLevel, baseExp, minSizeCm, maxSizeCm, sellPrice, rarity, description]) => [
    id,
    {
      id, name, rarity, minLevel, baseExp, minSizeCm, maxSizeCm,
      weightFactor: 0.0020, baseRate: rarity === 'epic' ? 0.015 : rarity === 'rare' ? 0.04 : 0.08,
      sellPrice, icon, description, eventId,
    } as FishMaster,
  ])
);
export const EVENT_FISH_IDS = Object.keys(EVENT_FISH);

// 全拡張魚をまとめてFISH_MASTERへマージ
export const EXTRA_FISH: Record<string, FishMaster> = {
  ...LEGENDARY_FISH, ...SEASONAL_FISH, ...EVENT_FISH,
};

// ─── 天候システム (全プレイヤー共通・1時間毎更新) ───────────────
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'storm' | 'heatwave' | 'blizzard' | 'meteor' | 'aurora' | 'red_moon' | 'mystic';
export interface WeatherEffect {
  id: WeatherType; name: string; icon: string; description: string;
  rarityBonus: number;   // レア率への加算
  sizeMult: number;      // サイズ抽選への倍率
  weightMult: number;    // 重量への倍率
  expMult: number;       // 経験値への倍率
  legendaryMult: number; // 伝説魚出現率への倍率
  weight: number;        // 抽選用の重み(大きいほど出やすい)
}
export const WEATHER_MASTER: Record<WeatherType, WeatherEffect> = {
  sunny:    { id:'sunny',    name:'晴れ',     icon:'☀️', description:'穏やかな釣り日和。',                 rarityBonus:0,    sizeMult:1.0,  weightMult:1.0,  expMult:1.0,  legendaryMult:1,  weight:28 },
  cloudy:   { id:'cloudy',   name:'曇り',     icon:'☁️', description:'魚が落ち着いて活動している。',       rarityBonus:0,    sizeMult:1.0,  weightMult:1.0,  expMult:1.05, legendaryMult:1,  weight:20 },
  rainy:    { id:'rainy',    name:'雨',       icon:'🌧️', description:'雨の日は魚の活性が上がる。',         rarityBonus:0.02, sizeMult:1.0,  weightMult:1.0,  expMult:1.10, legendaryMult:1.2,weight:16 },
  storm:    { id:'storm',    name:'嵐',       icon:'🌩️', description:'嵐の日は大物が潜みやすい。',         rarityBonus:0.05, sizeMult:1.10, weightMult:1.05, expMult:1.20, legendaryMult:1.5,weight:8 },
  heatwave: { id:'heatwave', name:'猛暑',     icon:'🥵', description:'猛暑で魚が大きく育っている。',       rarityBonus:0.01, sizeMult:1.15, weightMult:1.10, expMult:1.05, legendaryMult:1.1,weight:8 },
  blizzard: { id:'blizzard', name:'吹雪',     icon:'🌨️', description:'吹雪の中、魚はずっしりと重い。',     rarityBonus:0.03, sizeMult:1.0,  weightMult:1.15, expMult:1.10, legendaryMult:1.2,weight:7 },
  meteor:   { id:'meteor',   name:'流星群',   icon:'☄️', description:'流星群の夜、伝説魚が現れやすい。',   rarityBonus:0.08, sizeMult:1.05, weightMult:1.05, expMult:1.30, legendaryMult:3,  weight:4 },
  aurora:   { id:'aurora',   name:'オーロラ', icon:'🌌', description:'オーロラが幻の魚を呼び寄せる。',     rarityBonus:0.06, sizeMult:1.05, weightMult:1.0,  expMult:1.30, legendaryMult:2,  weight:4 },
  red_moon: { id:'red_moon', name:'赤い月',   icon:'🔴', description:'赤い月の夜、不吉な大物が動き出す。', rarityBonus:0.10, sizeMult:1.10, weightMult:1.10, expMult:1.50, legendaryMult:5,  weight:2.5 },
  mystic:   { id:'mystic',   name:'神秘の日', icon:'🌈', description:'1日限定。すべての確率が大幅上昇する伝説の日。', rarityBonus:0.15, sizeMult:1.20, weightMult:1.20, expMult:2.00, legendaryMult:10, weight:1.5 },
};
const WEATHER_IDS = Object.keys(WEATHER_MASTER) as WeatherType[];
const WEATHER_TOTAL_WEIGHT = WEATHER_IDS.reduce((s, id) => s + WEATHER_MASTER[id].weight, 0);

// 1時間ごとに全プレイヤー共通の天候を決定（UTC基準のため自然に同期する）
export function getCurrentWeather(date: Date = new Date()): WeatherEffect {
  const hourBucket = Math.floor(date.getTime() / (60 * 60 * 1000));
  // 簡易ハッシュで疑似ランダムな値を生成
  let h = hourBucket;
  h = (h ^ (h >>> 16)) * 0x45d9f3b;
  h = (h ^ (h >>> 16)) * 0x45d9f3b;
  h = h ^ (h >>> 16);
  const r = (Math.abs(h) % 100000) / 100000 * WEATHER_TOTAL_WEIGHT;
  let acc = 0;
  for (const id of WEATHER_IDS) {
    acc += WEATHER_MASTER[id].weight;
    if (r < acc) return WEATHER_MASTER[id];
  }
  return WEATHER_MASTER.sunny;
}

// ─── Fish Coin（釣り専用通貨） ──────────────────────────────
export function fishCoinReward(rarity: FishRarity, weather: WeatherEffect): number {
  const base = { common:0, uncommon:0, rare:1, epic:3, legendary:50 }[rarity];
  if (base === 0) return 0;
  return Math.round(base * (weather.id === 'mystic' ? 3 : weather.id === 'red_moon' ? 2 : 1));
}

// ─── Fish Coin交換所 ────────────────────────────────────────
export interface FishCoinShopItem {
  id: string; name: string; icon: string; cost: number; description: string;
  grantItemId: string; grantAmount: number;
}
export const FISH_COIN_SHOP: FishCoinShopItem[] = [
  { id:'fc_glowing_worm',  name:'光るミミズ ×5',   icon:'✨', cost:20,  description:'暗所でも効果的な餌を5個。',        grantItemId:'glowing_worm', grantAmount:5 },
  { id:'fc_golden_bait',   name:'黄金の餌 ×3',     icon:'✨', cost:50,  description:'金箔をまとった高級餌を3個。',      grantItemId:'golden_bait',  grantAmount:3 },
  { id:'fc_premium_lure',  name:'高級ルアー ×2',   icon:'🎯', cost:90,  description:'熟練者向けの高級ルアーを2個。',    grantItemId:'premium_lure', grantAmount:2 },
  { id:'fc_dragon_bait',   name:'龍の血 ×2',       icon:'🐉', cost:140, description:'伝説の餌「龍の血」を2個。',        grantItemId:'dragon_bait',  grantAmount:2 },
  { id:'fc_god_bait',      name:'神の餌 ×1',       icon:'🌟', cost:200, description:'伝説魚に有効な「神の餌」を1個。',  grantItemId:'god_bait',     grantAmount:1 },
  { id:'fc_void_bait',     name:'虚空の餌 ×1',     icon:'🕳️', cost:220, description:'予測不能な効果の「虚空の餌」。',   grantItemId:'void_bait',    grantAmount:1 },
  { id:'fc_infinity_bait', name:'∞の餌 ×1',        icon:'♾️', cost:300, description:'無限の釣果をもたらす究極の餌。',   grantItemId:'infinity_bait',grantAmount:1 },
  { id:'fc_all_rod_x',     name:'オールロッドX',   icon:'🎣', cost:400, description:'オールラウンドな名竿と交換。',     grantItemId:'all_rod_x',    grantAmount:1 },
  { id:'fc_master_rod_z',  name:'マスターロッドZ', icon:'⚡', cost:800, description:'Z改良型マスターロッドと交換。',    grantItemId:'master_rod_z', grantAmount:1 },
  { id:'fc_sky_rod',       name:'天空竿',           icon:'☁️', cost:1500,description:'天空湖専用の神秘の竿と交換。',     grantItemId:'sky_rod',      grantAmount:1 },
];
