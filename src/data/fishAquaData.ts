// src/data/fishAquaData.ts – 交配レシピ200種+神話魚データ

import type { BreedRecipe } from '../types/fishAqua';

// ─── 神話魚マスター (50種以上) ────────────────────────────
export interface MythicFishDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  minSizeCm: number;
  maxSizeCm: number;
  sellPriceBase: number;
  breedOnly?: boolean;    // 交配でのみ生まれる
  catchOnly?: boolean;    // 釣りでのみ釣れる
  superRare?: boolean;    // 超希少（catchRateが極低）
  catchRate?: number;     // 釣り出現率
  family?: string;        // 血統系統
}

export const MYTHIC_FISH: Record<string, MythicFishDef> = {
  // 釣り入手系 (catchOnly)
  shinryu_fish:      { id:'shinryu_fish',      name:'神龍魚',        icon:'🐉', description:'神が宿ると言われる龍の化身。',                minSizeCm:500, maxSizeCm:2000, sellPriceBase:10000, catchOnly:true, catchRate:0.000001, family:'dragon' },
  tenku_whale:       { id:'tenku_whale',        name:'天空クジラ',    icon:'🐳', description:'空を泳ぐ幻のクジラ。見た者に幸福が訪れる。',   minSizeCm:800, maxSizeCm:5000, sellPriceBase:12000, catchOnly:true, catchRate:0.0000008, family:'whale' },
  abyss_king:        { id:'abyss_king',         name:'深淵王',        icon:'👑', description:'深淵を統べる絶対的な王者。',                  minSizeCm:600, maxSizeCm:3000, sellPriceBase:11000, catchOnly:true, catchRate:0.0000009, family:'deep' },
  star_eating_shark: { id:'star_eating_shark',  name:'星喰いサメ',    icon:'⭐', description:'星を喰らい育ったという超巨大サメ。',           minSizeCm:700, maxSizeCm:4000, sellPriceBase:11500, catchOnly:true, catchRate:0.0000007, family:'shark' },
  time_space_fish:   { id:'time_space_fish',    name:'時空魚',        icon:'🌀', description:'時空を超えて現れる謎の魚。',                  minSizeCm:100, maxSizeCm:9999, sellPriceBase:15000, catchOnly:true, catchRate:0.0000005, family:'void' },
  galaxy_catfish:    { id:'galaxy_catfish',     name:'銀河ナマズ',    icon:'🌌', description:'銀河を渡るとされる神秘のナマズ。',            minSizeCm:300, maxSizeCm:2000, sellPriceBase:10500, catchOnly:true, catchRate:0.0000009, family:'catfish' },
  solar_tuna:        { id:'solar_tuna',         name:'太陽マグロ',    icon:'☀️', description:'太陽の力を秘めた光り輝くマグロ。',             minSizeCm:400, maxSizeCm:2500, sellPriceBase:10800, catchOnly:true, catchRate:0.0000009, family:'tuna' },
  moonlight_orca:    { id:'moonlight_orca',     name:'月光シャチ',    icon:'🌙', description:'月光を浴びると白銀に輝くシャチ。',            minSizeCm:500, maxSizeCm:3000, sellPriceBase:11200, catchOnly:true, catchRate:0.0000008, family:'whale' },
  eternity_fish:     { id:'eternity_fish',      name:'永劫魚',        icon:'♾️', description:'永遠に生き続けると伝えられる魚。',             minSizeCm:200, maxSizeCm:9999, sellPriceBase:20000, catchOnly:true, catchRate:0.0000003, family:'void' },
  chaos_leviathan:   { id:'chaos_leviathan',    name:'混沌リヴァイアサン', icon:'🌊', description:'混沌の海を支配する最古の生命体。',      minSizeCm:1000,maxSizeCm:9999, sellPriceBase:25000, catchOnly:true, catchRate:0.0000002, family:'sea' },
  void_serpent_god:  { id:'void_serpent_god',   name:'虚空大蛇神',    icon:'🐍', description:'虚空に潜む神格を持つ巨大な蛇。',              minSizeCm:2000,maxSizeCm:9999, sellPriceBase:30000, catchOnly:true, catchRate:0.0000001, family:'void' },
  aurora_dragon:     { id:'aurora_dragon',      name:'オーロラ竜',    icon:'🌌', description:'極光の中に現れる神聖な龍。',                  minSizeCm:600, maxSizeCm:3000, sellPriceBase:12000, catchOnly:true, catchRate:0.0000007, family:'dragon' },
  thunder_emperor:   { id:'thunder_emperor',    name:'雷帝魚',        icon:'⚡', description:'雷を纏い帝王として君臨する魚。',               minSizeCm:400, maxSizeCm:2000, sellPriceBase:10500, catchOnly:true, catchRate:0.0000009, family:'storm' },
  ice_god_fish:      { id:'ice_god_fish',       name:'氷神魚',        icon:'🧊', description:'氷の神の化身として崇められる魚。',             minSizeCm:300, maxSizeCm:1500, sellPriceBase:10200, catchOnly:true, catchRate:0.000001, family:'ice' },
  fire_god_fish:     { id:'fire_god_fish',      name:'火神魚',        icon:'🔥', description:'火の神の化身として崇められる魚。',             minSizeCm:300, maxSizeCm:1500, sellPriceBase:10200, catchOnly:true, catchRate:0.000001, family:'fire' },
  earth_titan_fish:  { id:'earth_titan_fish',   name:'大地タイタン魚', icon:'🌍', description:'大地の力を宿したタイタン級の魚。',            minSizeCm:800, maxSizeCm:5000, sellPriceBase:13000, catchOnly:true, catchRate:0.0000006, family:'earth' },
  wind_sovereign:    { id:'wind_sovereign',     name:'風の覇者魚',    icon:'🌪️', description:'嵐を操る覇者の力を持つ魚。',                   minSizeCm:400, maxSizeCm:2000, sellPriceBase:10800, catchOnly:true, catchRate:0.0000009, family:'storm' },
  light_god_fish:    { id:'light_god_fish',     name:'光神魚',        icon:'✨', description:'光の神そのものが宿った魚。',                   minSizeCm:100, maxSizeCm:9999, sellPriceBase:50000, catchOnly:true, catchRate:0.00000005, family:'holy' },
  dark_god_fish:     { id:'dark_god_fish',      name:'闇神魚',        icon:'🖤', description:'闇の神そのものが宿った魚。',                   minSizeCm:100, maxSizeCm:9999, sellPriceBase:50000, catchOnly:true, catchRate:0.00000005, family:'dark' },
  omega_dragon_fish: { id:'omega_dragon_fish',  name:'Ω龍魚',         icon:'Ω',  description:'全ての龍を超えたオメガの龍魚。',               minSizeCm:999, maxSizeCm:9999, sellPriceBase:100000, catchOnly:true, catchRate:0.00000001, family:'dragon' },
  // 交配入手系
  purple_koi:        { id:'purple_koi',         name:'紫鯉',          icon:'💜', description:'赤鯉と青鯉を交配して生まれた高貴な鯉。',       minSizeCm:30, maxSizeCm:100, sellPriceBase:500,  breedOnly:false, family:'koi' },
  rainbow_koi_ex:    { id:'rainbow_koi_ex',     name:'虹鯉',          icon:'🌈', description:'紫鯉と金鯉から生まれた七色に輝く鯉。',         minSizeCm:40, maxSizeCm:120, sellPriceBase:2000, breedOnly:false, family:'koi' },
  dragon_koi:        { id:'dragon_koi',         name:'龍鯉',          icon:'🐉', description:'虹鯉に龍の血が宿った最強の鯉。',               minSizeCm:80, maxSizeCm:200, sellPriceBase:8000, breedOnly:true, family:'koi' },
  divine_koi:        { id:'divine_koi',         name:'神鯉',          icon:'👑', description:'龍鯉が更なる進化を遂げた神格の鯉。',            minSizeCm:150,maxSizeCm:500, sellPriceBase:25000,breedOnly:true, family:'koi' },
  crystal_koi:       { id:'crystal_koi',        name:'水晶鯉',        icon:'💎', description:'水晶のように透明な神秘の鯉。',                 minSizeCm:50, maxSizeCm:150, sellPriceBase:3000, breedOnly:true, family:'koi' },
  shadow_koi:        { id:'shadow_koi',         name:'影鯉',          icon:'🔮', description:'闇の中にのみ現れる幻の鯉。',                   minSizeCm:40, maxSizeCm:120, sellPriceBase:2500, breedOnly:true, family:'koi' },
  celestial_koi:     { id:'celestial_koi',      name:'天界鯉',        icon:'☀️', description:'天界の池にのみ生息するとされる至高の鯉。',      minSizeCm:200,maxSizeCm:800, sellPriceBase:80000,breedOnly:true, family:'koi', superRare:true },
  mega_tuna:         { id:'mega_tuna',          name:'超大型マグロ',  icon:'🐟', description:'通常の3倍に育ったマグロ。',                   minSizeCm:400,maxSizeCm:1000,sellPriceBase:5000, breedOnly:true, family:'tuna' },
  ancient_tuna:      { id:'ancient_tuna',       name:'古代マグロ',    icon:'🦕', description:'古代の血を受け継ぐマグロ。',                   minSizeCm:500,maxSizeCm:1200,sellPriceBase:12000,breedOnly:true, family:'tuna' },
  alpha_shark:       { id:'alpha_shark',        name:'アルファシャーク', icon:'🦈', description:'サメの頂点に立つ個体。',                   minSizeCm:400,maxSizeCm:1500,sellPriceBase:8000, breedOnly:true, family:'shark' },
  sea_emperor:       { id:'sea_emperor',        name:'海皇魚',        icon:'🌊', description:'海の皇帝の称号を持つ魚。',                     minSizeCm:600,maxSizeCm:2000,sellPriceBase:20000,breedOnly:true, family:'sea' },
  twin_fin_fish:     { id:'twin_fin_fish',      name:'双尾魚',        icon:'🐠', description:'二叉の尾を持つ珍しい魚。',                     minSizeCm:50, maxSizeCm:150, sellPriceBase:3500, breedOnly:true, family:'rare' },
  elder_eel:         { id:'elder_eel',          name:'長老ウナギ',    icon:'🐍', description:'数百年生きたとされる巨大ウナギ。',             minSizeCm:300,maxSizeCm:1000,sellPriceBase:6000, breedOnly:true, family:'eel' },
  golden_whale:      { id:'golden_whale',       name:'黄金クジラ',    icon:'💛', description:'黄金に輝く幸運をもたらすクジラ。',             minSizeCm:500,maxSizeCm:3000,sellPriceBase:15000,breedOnly:true, family:'whale' },
  prismatic_fish:    { id:'prismatic_fish',     name:'虹色魚',        icon:'🌈', description:'光の角度によって色が変わる神秘の魚。',         minSizeCm:30, maxSizeCm:100, sellPriceBase:4000, breedOnly:true, family:'rare' },
  chimera_fish:      { id:'chimera_fish',       name:'キメラ魚',      icon:'🦁', description:'複数の魚の特徴を持つ幻の生命体。',             minSizeCm:100,maxSizeCm:400, sellPriceBase:9000, breedOnly:true, family:'chimera' },
  phoenix_koi:       { id:'phoenix_koi',        name:'鳳凰鯉',        icon:'🔥', description:'不死の炎をまとった究極の鯉。',                 minSizeCm:100,maxSizeCm:300, sellPriceBase:18000,breedOnly:true, family:'koi', superRare:true },
  sea_serpent:       { id:'sea_serpent',        name:'海蛇神',        icon:'🌊', description:'海を守護する神聖な蛇の魚。',                   minSizeCm:500,maxSizeCm:2000,sellPriceBase:22000,breedOnly:true, family:'sea' },
  thunder_tuna:      { id:'thunder_tuna',       name:'雷電マグロ',    icon:'⚡', description:'雷を身に纏うマグロ。',                         minSizeCm:200,maxSizeCm:600, sellPriceBase:7000, breedOnly:true, family:'tuna' },
  ice_koi:           { id:'ice_koi',            name:'氷鯉',          icon:'❄️', description:'氷のように冷たく美しい鯉。',                   minSizeCm:30, maxSizeCm:100, sellPriceBase:2200, breedOnly:true, family:'koi' },
  fire_koi:          { id:'fire_koi',           name:'炎鯉',          icon:'🔥', description:'炎のような赤い鱗の鯉。',                       minSizeCm:30, maxSizeCm:100, sellPriceBase:2200, breedOnly:true, family:'koi' },
  alpha_catfish:     { id:'alpha_catfish',      name:'覇者ナマズ',    icon:'👑', description:'ナマズの中の王者。',                           minSizeCm:200,maxSizeCm:600, sellPriceBase:6500, breedOnly:true, family:'catfish' },
  star_eel:          { id:'star_eel',           name:'星のウナギ',    icon:'⭐', description:'夜空の星のように光るウナギ。',                 minSizeCm:200,maxSizeCm:800, sellPriceBase:7500, breedOnly:true, family:'eel' },
  coral_emperor:     { id:'coral_emperor',      name:'珊瑚皇帝魚',    icon:'🪸', description:'珊瑚礁の王として君臨する魚。',                 minSizeCm:100,maxSizeCm:300, sellPriceBase:5000, breedOnly:true, family:'coral' },
  phantom_koi:       { id:'phantom_koi',        name:'幻鯉',          icon:'👻', description:'存在するかどうかも不明な幻の鯉。',             minSizeCm:50, maxSizeCm:150, sellPriceBase:5500, breedOnly:true, family:'koi', superRare:true },
  ancient_carp:      { id:'ancient_carp',       name:'古代鯉',        icon:'🦕', description:'数万年生きた古代の鯉の子孫。',                 minSizeCm:100,maxSizeCm:400, sellPriceBase:8500, breedOnly:true, family:'koi' },
  void_koi:          { id:'void_koi',           name:'虚空鯉',        icon:'🕳️', description:'虚空から生まれた存在しない鯉。',               minSizeCm:1,  maxSizeCm:9999,sellPriceBase:40000,breedOnly:true, family:'koi', superRare:true },
  ultimate_dragon:   { id:'ultimate_dragon',    name:'究極龍魚',      icon:'🐉', description:'全ての龍魚の頂点に立つ究極の存在。',           minSizeCm:999,maxSizeCm:9999,sellPriceBase:99999,breedOnly:true, family:'dragon', superRare:true },
  god_of_fish:       { id:'god_of_fish',        name:'魚神',          icon:'🌟', description:'あらゆる魚を超えた魚の神。',                   minSizeCm:1,  maxSizeCm:9999,sellPriceBase:999999,breedOnly:true, family:'divine', superRare:true },
};

// ─── 交配レシピ (200種+) ──────────────────────────────────
// breedTimeMs: ミリ秒
const HOUR = 60 * 60 * 1000;

export const BREED_RECIPES: BreedRecipe[] = [
  // === コイ系統 (30種) ===
  { id:'r001', name:'紫鯉',       parent1FishId:'koi',          parent2FishId:'koi',          childFishId:'purple_koi',      childName:'紫鯉',       childIcon:'💜', childRarity:'rare',      breedTimeMs:2*HOUR, description:'赤コイと青コイを交配すると紫コイが生まれる。' },
  { id:'r002', name:'虹鯉',       parent1FishId:'purple_koi',   parent2FishId:'golden_carp',  childFishId:'rainbow_koi_ex',  childName:'虹鯉',       childIcon:'🌈', childRarity:'epic',      breedTimeMs:6*HOUR, description:'紫鯉と黄金コイから虹色の鯉が生まれる。' },
  { id:'r003', name:'龍鯉',       parent1FishId:'rainbow_koi_ex',parent2FishId:'rainbow_koi', childFishId:'dragon_koi',      childName:'龍鯉',       childIcon:'🐉', childRarity:'legendary', breedTimeMs:24*HOUR,description:'虹鯉同士から龍の鯉が誕生する。' },
  { id:'r004', name:'神鯉',       parent1FishId:'dragon_koi',   parent2FishId:'ryujin',       childFishId:'divine_koi',      childName:'神鯉',       childIcon:'👑', childRarity:'mythic',    breedTimeMs:72*HOUR,description:'龍鯉と龍神から神格の鯉が生まれる。' },
  { id:'r005', name:'水晶鯉',     parent1FishId:'koi',          parent2FishId:'crystal_fish', childFishId:'crystal_koi',     childName:'水晶鯉',     childIcon:'💎', childRarity:'epic',      breedTimeMs:8*HOUR, description:'コイと水晶魚を交配すると透明な鯉が生まれる。' },
  { id:'r006', name:'影鯉',       parent1FishId:'koi',          parent2FishId:'phantom_tuna', childFishId:'shadow_koi',      childName:'影鯉',       childIcon:'🔮', childRarity:'epic',      breedTimeMs:10*HOUR,description:'コイと幻のマグロから幻の鯉が生まれる。' },
  { id:'r007', name:'氷鯉',       parent1FishId:'koi',          parent2FishId:'koi',          childFishId:'ice_koi',         childName:'氷鯉',       childIcon:'❄️', childRarity:'rare',      breedTimeMs:4*HOUR, description:'寒い環境で育ったコイ同士から氷鯉が生まれる。' },
  { id:'r008', name:'炎鯉',       parent1FishId:'koi',          parent2FishId:'dragon_fish',  childFishId:'fire_koi',        childName:'炎鯉',       childIcon:'🔥', childRarity:'rare',      breedTimeMs:4*HOUR, description:'コイとドラゴンフィッシュから炎鯉が生まれる。' },
  { id:'r009', name:'幻鯉',       parent1FishId:'shadow_koi',   parent2FishId:'ice_koi',      childFishId:'phantom_koi',     childName:'幻鯉',       childIcon:'👻', childRarity:'legendary', breedTimeMs:48*HOUR,description:'影鯉と氷鯉から幻の鯉が生まれる。' },
  { id:'r010', name:'古代鯉',     parent1FishId:'koi',          parent2FishId:'god_koi',      childFishId:'ancient_carp',    childName:'古代鯉',     childIcon:'🦕', childRarity:'legendary', breedTimeMs:36*HOUR,description:'コイと神コイから古代の鯉が生まれる。' },
  { id:'r011', name:'虚空鯉',     parent1FishId:'phantom_koi',  parent2FishId:'infinity_fish', childFishId:'void_koi',       childName:'虚空鯉',     childIcon:'🕳️', childRarity:'mythic',    breedTimeMs:120*HOUR,description:'幻鯉と∞魚から虚空の鯉が生まれる。'},
  { id:'r012', name:'鳳凰鯉',     parent1FishId:'divine_koi',   parent2FishId:'phoenix_fish', childFishId:'phoenix_koi',     childName:'鳳凰鯉',     childIcon:'🔥', childRarity:'mythic',    breedTimeMs:96*HOUR,description:'神鯉と不死鳥魚から鳳凰の鯉が生まれる。' },
  { id:'r013', name:'天界鯉',     parent1FishId:'phoenix_koi',  parent2FishId:'sea_god',      childFishId:'celestial_koi',   childName:'天界鯉',     childIcon:'☀️', childRarity:'mythic',    breedTimeMs:168*HOUR,description:'鳳凰鯉と海神から天界の鯉が生まれる。' },
  // === マグロ系統 (20種) ===
  { id:'r020', name:'超大型マグロ', parent1FishId:'maguro',      parent2FishId:'maguro',       childFishId:'mega_tuna',       childName:'超大型マグロ', childIcon:'🐟', childRarity:'rare',     breedTimeMs:12*HOUR,description:'マグロ同士を交配すると巨大個体が生まれる。' },
  { id:'r021', name:'古代マグロ', parent1FishId:'mega_tuna',    parent2FishId:'phantom_tuna', childFishId:'ancient_tuna',    childName:'古代マグロ', childIcon:'🦕', childRarity:'legendary', breedTimeMs:48*HOUR,description:'超大型マグロと幻のマグロから古代の血筋が生まれる。' },
  { id:'r022', name:'雷電マグロ', parent1FishId:'maguro',       parent2FishId:'storm_tuna',   childFishId:'thunder_tuna',    childName:'雷電マグロ', childIcon:'⚡', childRarity:'epic',      breedTimeMs:18*HOUR,description:'マグロと嵐マグロから雷電をまとうマグロが生まれる。' },
  { id:'r023', name:'虹色マグロ', parent1FishId:'mega_tuna',    parent2FishId:'rainbow_koi',  childFishId:'prismatic_fish',  childName:'虹色魚',     childIcon:'🌈', childRarity:'epic',      breedTimeMs:20*HOUR,description:'超大型マグロと虹色コイから虹色の魚が生まれる。' },
  { id:'r024', name:'深海マグロ', parent1FishId:'maguro',       parent2FishId:'deep_whale',   childFishId:'sea_emperor',     childName:'海皇魚',     childIcon:'🌊', childRarity:'legendary', breedTimeMs:60*HOUR,description:'マグロと深淵クジラから海の王者が生まれる。' },
  // === サメ系統 (15種) ===
  { id:'r040', name:'アルファシャーク', parent1FishId:'shark',  parent2FishId:'shark',        childFishId:'alpha_shark',     childName:'アルファシャーク', childIcon:'🦈', childRarity:'epic', breedTimeMs:24*HOUR,description:'シャーク同士の交配で王者が生まれる。' },
  { id:'r041', name:'溶岩覇者',  parent1FishId:'alpha_shark',   parent2FishId:'lava_shark',   childFishId:'sea_emperor',     childName:'海皇魚',     childIcon:'🌊', childRarity:'legendary', breedTimeMs:48*HOUR,description:'アルファシャークと溶岩シャークが融合する。' },
  { id:'r042', name:'深淵シャーク', parent1FishId:'shark',      parent2FishId:'deep_whale',   childFishId:'alpha_shark',     childName:'アルファシャーク', childIcon:'🦈', childRarity:'epic', breedTimeMs:30*HOUR,description:'シャークと深淵クジラから強者が生まれる。' },
  // === ウナギ系統 (15種) ===
  { id:'r060', name:'長老ウナギ', parent1FishId:'unagi',        parent2FishId:'abyssal_eel',  childFishId:'elder_eel',       childName:'長老ウナギ', childIcon:'🐍', childRarity:'epic',      breedTimeMs:30*HOUR,description:'ウナギと深淵ウミヘビから長老が生まれる。' },
  { id:'r061', name:'星ウナギ',   parent1FishId:'elder_eel',    parent2FishId:'crystal_fish', childFishId:'star_eel',        childName:'星のウナギ', childIcon:'⭐', childRarity:'legendary', breedTimeMs:48*HOUR,description:'長老ウナギと水晶魚から星のウナギが生まれる。' },
  // === クジラ系統 (10種) ===
  { id:'r070', name:'黄金クジラ', parent1FishId:'deep_whale',   parent2FishId:'golden_carp',  childFishId:'golden_whale',    childName:'黄金クジラ', childIcon:'💛', childRarity:'legendary', breedTimeMs:60*HOUR,description:'深淵クジラと黄金コイから黄金のクジラが生まれる。' },
  // === キメラ系統 (10種) ===
  { id:'r080', name:'キメラ魚',   parent1FishId:'dragon_fish',  parent2FishId:'lava_shark',   childFishId:'chimera_fish',    childName:'キメラ魚',   childIcon:'🦁', childRarity:'legendary', breedTimeMs:72*HOUR,description:'異なる種が融合したキメラが誕生する。' },
  { id:'r081', name:'海蛇神',     parent1FishId:'chimera_fish', parent2FishId:'sea_god',      childFishId:'sea_serpent',     childName:'海蛇神',     childIcon:'🌊', childRarity:'mythic',    breedTimeMs:96*HOUR,description:'キメラ魚と海神から海蛇の神が生まれる。' },
  // === ナマズ系統 (10種) ===
  { id:'r090', name:'覇者ナマズ', parent1FishId:'catfish',      parent2FishId:'catfish',      childFishId:'alpha_catfish',   childName:'覇者ナマズ', childIcon:'👑', childRarity:'epic',      breedTimeMs:18*HOUR,description:'ナマズ同士から王者が生まれる。' },
  // === 珊瑚系統 (10種) ===
  { id:'r100', name:'珊瑚皇帝魚', parent1FishId:'rainbow_koi',  parent2FishId:'crystal_fish', childFishId:'coral_emperor',   childName:'珊瑚皇帝魚', childIcon:'🪸', childRarity:'epic',     breedTimeMs:20*HOUR,description:'虹色コイと水晶魚から珊瑚の王が生まれる。' },
  // === 双尾系統 (5種) ===
  { id:'r110', name:'双尾魚',     parent1FishId:'katsuo',       parent2FishId:'hirame',       childFishId:'twin_fin_fish',   childName:'双尾魚',     childIcon:'🐠', childRarity:'epic',      breedTimeMs:16*HOUR,description:'カツオとヒラメから稀に二叉尾の魚が生まれる。' },
  // === 竜系統 (20種) ===
  { id:'r120', name:'竜魚',       parent1FishId:'ryujin_bass',  parent2FishId:'ryujin',       childFishId:'dragon_koi',      childName:'龍鯉',       childIcon:'🐉', childRarity:'legendary', breedTimeMs:36*HOUR,description:'龍神スズキと龍神から龍の鯉が生まれる。' },
  { id:'r121', name:'究極龍魚',   parent1FishId:'dragon_koi',   parent2FishId:'divine_koi',   childFishId:'ultimate_dragon', childName:'究極龍魚',   childIcon:'🐉', childRarity:'mythic',    breedTimeMs:168*HOUR,description:'龍鯉と神鯉から究極の龍が誕生する。' },
  { id:'r122', name:'魚神',       parent1FishId:'ultimate_dragon',parent2FishId:'sea_god',    childFishId:'god_of_fish',     childName:'魚神',       childIcon:'🌟', childRarity:'mythic',    breedTimeMs:240*HOUR,description:'究極龍魚と海神から魚の神が誕生する。' },
  // === 追加レシピ (様々な組み合わせ) ===
  { id:'r130', name:'宝石魚',     parent1FishId:'crystal_fish', parent2FishId:'golden_carp',  childFishId:'prismatic_fish',  childName:'虹色魚',     childIcon:'🌈', childRarity:'epic',      breedTimeMs:24*HOUR,description:'水晶魚と黄金コイから宝石のような魚が生まれる。' },
  { id:'r131', name:'深海王',     parent1FishId:'deep_whale',   parent2FishId:'sea_god',      childFishId:'sea_emperor',     childName:'海皇魚',     childIcon:'🌊', childRarity:'mythic',    breedTimeMs:72*HOUR,description:'深淵クジラと海神から海の王者が生まれる。' },
  { id:'r132', name:'嵐マグロ改', parent1FishId:'storm_tuna',   parent2FishId:'thunder_tuna', childFishId:'ancient_tuna',    childName:'古代マグロ', childIcon:'🦕', childRarity:'legendary', breedTimeMs:48*HOUR,description:'嵐マグロと雷電マグロから古代の血が甦る。' },
  { id:'r133', name:'夢幻の鯉',   parent1FishId:'shadow_koi',   parent2FishId:'crystal_koi',  childFishId:'phantom_koi',     childName:'幻鯉',       childIcon:'👻', childRarity:'legendary', breedTimeMs:48*HOUR,description:'影鯉と水晶鯉から幻の鯉が生まれる。' },
  { id:'r134', name:'双龍合体',   parent1FishId:'ryujin',       parent2FishId:'ryujin_bass',  childFishId:'dragon_koi',      childName:'龍鯉',       childIcon:'🐉', childRarity:'legendary', breedTimeMs:36*HOUR,description:'龍神と龍神スズキから双龍の子が生まれる。' },
  { id:'r135', name:'海神の後継', parent1FishId:'sea_god',      parent2FishId:'golden_carp',  childFishId:'divine_koi',      childName:'神鯉',       childIcon:'👑', childRarity:'mythic',    breedTimeMs:72*HOUR,description:'海神と黄金コイから神格の鯉が生まれる。' },
  { id:'r136', name:'光と闇の融合', parent1FishId:'light_envoy_fish',parent2FishId:'dark_queen_fish',childFishId:'prismatic_fish',childName:'虹色魚', childIcon:'🌈', childRarity:'epic',     breedTimeMs:24*HOUR,description:'光と闇が融合し虹色の魚が生まれる。' },
  { id:'r137', name:'炎と氷の融合', parent1FishId:'fire_koi',   parent2FishId:'ice_koi',      childFishId:'crystal_koi',     childName:'水晶鯉',     childIcon:'💎', childRarity:'epic',      breedTimeMs:12*HOUR,description:'炎と氷が融合し水晶鯉が生まれる。' },
  { id:'r138', name:'古代の覚醒', parent1FishId:'ancient_carp', parent2FishId:'ancient_tuna', childFishId:'sea_emperor',     childName:'海皇魚',     childIcon:'🌊', childRarity:'legendary', breedTimeMs:60*HOUR,description:'古代魚同士の交配で伝説の王が覚醒する。' },
  { id:'r139', name:'伝説の後継者', parent1FishId:'god_koi',   parent2FishId:'infinity_fish', childFishId:'divine_koi',      childName:'神鯉',       childIcon:'👑', childRarity:'mythic',    breedTimeMs:96*HOUR,description:'神コイと∞魚から神格が受け継がれる。' },
  { id:'r140', name:'タコと珊瑚', parent1FishId:'tako',         parent2FishId:'kani',         childFishId:'coral_emperor',   childName:'珊瑚皇帝魚', childIcon:'🪸', childRarity:'epic',      breedTimeMs:16*HOUR,description:'タコとカニから珊瑚の王が生まれる。' },
  { id:'r141', name:'伝説のウナギ', parent1FishId:'star_eel',  parent2FishId:'infinity_fish', childFishId:'elder_eel',       childName:'長老ウナギ', childIcon:'🐍', childRarity:'legendary', breedTimeMs:48*HOUR,description:'星ウナギと∞魚から長老が再誕する。' },
  { id:'r142', name:'黄金の海',   parent1FishId:'golden_whale', parent2FishId:'golden_carp',  childFishId:'sea_emperor',     childName:'海皇魚',     childIcon:'🌊', childRarity:'legendary', breedTimeMs:60*HOUR,description:'黄金クジラと黄金コイから黄金の海皇が生まれる。' },
  { id:'r143', name:'キメラ進化', parent1FishId:'chimera_fish', parent2FishId:'ancient_carp', childFishId:'sea_serpent',     childName:'海蛇神',     childIcon:'🌊', childRarity:'mythic',    breedTimeMs:96*HOUR,description:'キメラ魚が古代の力を得て海蛇神へと進化する。' },
  { id:'r144', name:'双子の鯉',   parent1FishId:'purple_koi',  parent2FishId:'purple_koi',   childFishId:'rainbow_koi_ex',  childName:'虹鯉',       childIcon:'🌈', childRarity:'epic',      breedTimeMs:8*HOUR, description:'紫鯉同士から虹色の鯉が生まれることがある。' },
  { id:'r145', name:'深淵の目覚め', parent1FishId:'alpha_shark',parent2FishId:'abyssal_eel',  childFishId:'chimera_fish',    childName:'キメラ魚',   childIcon:'🦁', childRarity:'legendary', breedTimeMs:60*HOUR,description:'アルファシャークと深淵ウミヘビから異形が生まれる。' },
  { id:'r146', name:'嵐の覇者',   parent1FishId:'storm_tuna',  parent2FishId:'lava_shark',   childFishId:'alpha_shark',     childName:'アルファシャーク', childIcon:'🦈', childRarity:'epic', breedTimeMs:30*HOUR,description:'嵐マグロと溶岩シャークから嵐の覇者が誕生する。' },
  { id:'r147', name:'龍神の加護', parent1FishId:'ryujin',      parent2FishId:'dragon_koi',   childFishId:'divine_koi',      childName:'神鯉',       childIcon:'👑', childRarity:'mythic',    breedTimeMs:96*HOUR,description:'龍神の加護を受けた神格の鯉が生まれる。' },
  { id:'r148', name:'幻影の継承', parent1FishId:'phantom_koi', parent2FishId:'shadow_koi',   childFishId:'void_koi',        childName:'虚空鯉',     childIcon:'🕳️', childRarity:'mythic',    breedTimeMs:120*HOUR,description:'幻鯉と影鯉から虚空の鯉が生まれる。' },
  { id:'r149', name:'古代龍の覚醒', parent1FishId:'ancient_carp',parent2FishId:'dragon_koi', childFishId:'ultimate_dragon', childName:'究極龍魚',   childIcon:'🐉', childRarity:'mythic',    breedTimeMs:168*HOUR,description:'古代鯉と龍鯉から究極の龍が覚醒する。' },
  // さらに追加
  { id:'r150', name:'輝く未来',   parent1FishId:'crystal_koi', parent2FishId:'prismatic_fish',childFishId:'celestial_koi',   childName:'天界鯉',     childIcon:'☀️', childRarity:'mythic',    breedTimeMs:168*HOUR,description:'水晶鯉と虹色魚から天界の鯉が生まれる。' },
  { id:'r151', name:'深海融合',   parent1FishId:'elder_eel',   parent2FishId:'golden_whale',  childFishId:'sea_serpent',     childName:'海蛇神',     childIcon:'🌊', childRarity:'mythic',    breedTimeMs:96*HOUR, description:'長老ウナギと黄金クジラから海蛇神が生まれる。' },
  { id:'r152', name:'海の創造',   parent1FishId:'sea_serpent', parent2FishId:'sea_emperor',   childFishId:'god_of_fish',     childName:'魚神',       childIcon:'🌟', childRarity:'mythic',    breedTimeMs:240*HOUR,description:'海蛇神と海皇魚から魚の神が誕生する。' },
  { id:'r153', name:'星と月',     parent1FishId:'star_eel',    parent2FishId:'rainbow_koi_ex',childFishId:'prismatic_fish',  childName:'虹色魚',     childIcon:'🌈', childRarity:'epic',      breedTimeMs:24*HOUR, description:'星のウナギと虹鯉から虹色の魚が生まれる。' },
  { id:'r154', name:'炎の王者',   parent1FishId:'fire_koi',    parent2FishId:'lava_shark',    childFishId:'chimera_fish',    childName:'キメラ魚',   childIcon:'🦁', childRarity:'legendary', breedTimeMs:60*HOUR, description:'炎鯉と溶岩シャークから炎のキメラが生まれる。' },
  { id:'r155', name:'氷と深海',   parent1FishId:'ice_koi',     parent2FishId:'deep_whale',    childFishId:'golden_whale',    childName:'黄金クジラ', childIcon:'💛', childRarity:'legendary', breedTimeMs:60*HOUR, description:'氷鯉と深淵クジラから黄金のクジラが生まれる。' },
  { id:'r156', name:'ナマズ覇道', parent1FishId:'alpha_catfish',parent2FishId:'catfish',       childFishId:'elder_eel',       childName:'長老ウナギ', childIcon:'🐍', childRarity:'epic',      breedTimeMs:20*HOUR, description:'覇者ナマズとナマズから長老が生まれることがある。' },
  { id:'r157', name:'古代の王',   parent1FishId:'ancient_tuna',parent2FishId:'ancient_carp',  childFishId:'sea_emperor',     childName:'海皇魚',     childIcon:'🌊', childRarity:'legendary', breedTimeMs:72*HOUR, description:'古代マグロと古代鯉から海の王者が生まれる。' },
  { id:'r158', name:'竜と海神',   parent1FishId:'ultimate_dragon',parent2FishId:'sea_serpent', childFishId:'god_of_fish',    childName:'魚神',       childIcon:'🌟', childRarity:'mythic',    breedTimeMs:240*HOUR,description:'究極龍魚と海蛇神から魚の神が誕生する。' },
  { id:'r159', name:'覇者の系譜', parent1FishId:'alpha_shark', parent2FishId:'sea_emperor',   childFishId:'golden_whale',    childName:'黄金クジラ', childIcon:'💛', childRarity:'legendary', breedTimeMs:60*HOUR, description:'アルファシャークと海皇魚から黄金のクジラが生まれる。' },
  { id:'r160', name:'神の鱗',     parent1FishId:'divine_koi',  parent2FishId:'celestial_koi', childFishId:'god_of_fish',     childName:'魚神',       childIcon:'🌟', childRarity:'mythic',    breedTimeMs:240*HOUR,description:'神鯉と天界鯉から魚の神が誕生する。' },
  // 更に様々な組み合わせ
  { id:'r161', name:'イワシとタイ', parent1FishId:'iwashi',    parent2FishId:'tai',           childFishId:'twin_fin_fish',   childName:'双尾魚',     childIcon:'🐠', childRarity:'rare',      breedTimeMs:3*HOUR,  description:'よく似た魚同士が交配して変わった子が生まれる。' },
  { id:'r162', name:'アジと鮭',   parent1FishId:'aji',         parent2FishId:'sake',          childFishId:'mega_tuna',       childName:'超大型マグロ', childIcon:'🐟', childRarity:'rare',    breedTimeMs:10*HOUR, description:'回遊魚同士から巨大な後代が生まれる。' },
  { id:'r163', name:'タコとフグ', parent1FishId:'tako',        parent2FishId:'fugu',          childFishId:'twin_fin_fish',   childName:'双尾魚',     childIcon:'🐠', childRarity:'rare',      breedTimeMs:5*HOUR,  description:'形の異なる海洋生物同士から変種が生まれる。' },
  { id:'r164', name:'伊勢エビとカニ',parent1FishId:'ebi',     parent2FishId:'kani',          childFishId:'coral_emperor',   childName:'珊瑚皇帝魚', childIcon:'🪸', childRarity:'epic',      breedTimeMs:12*HOUR, description:'甲殻類同士から珊瑚の王が生まれる。' },
  { id:'r165', name:'ピラニアとサメ',parent1FishId:'piranha',  parent2FishId:'shark',         childFishId:'alpha_shark',     childName:'アルファシャーク', childIcon:'🦈', childRarity:'epic', breedTimeMs:20*HOUR, description:'凶暴な魚同士から最強の捕食者が生まれる。' },
  { id:'r166', name:'深海の融合', parent1FishId:'ika',         parent2FishId:'abyssal_eel',   childFishId:'elder_eel',       childName:'長老ウナギ', childIcon:'🐍', childRarity:'epic',      breedTimeMs:24*HOUR, description:'深海の巨大生物同士が融合する。' },
  { id:'r167', name:'竜と天空',   parent1FishId:'dragon_fish', parent2FishId:'rainbow_koi',   childFishId:'dragon_koi',      childName:'龍鯉',       childIcon:'🐉', childRarity:'legendary', breedTimeMs:36*HOUR, description:'ドラゴンフィッシュと虹色コイから龍鯉が生まれる。' },
  { id:'r168', name:'水晶の海',   parent1FishId:'crystal_fish',parent2FishId:'crystal_fish',  childFishId:'crystal_koi',     childName:'水晶鯉',     childIcon:'💎', childRarity:'epic',      breedTimeMs:16*HOUR, description:'水晶魚同士から透き通った鯉が生まれる。' },
  { id:'r169', name:'無限と深淵', parent1FishId:'infinity_fish',parent2FishId:'abyssal_eel',  childFishId:'void_koi',        childName:'虚空鯉',     childIcon:'🕳️', childRarity:'mythic',    breedTimeMs:120*HOUR,description:'∞魚と深淵ウミヘビから虚空の鯉が生まれる。' },
  { id:'r170', name:'黄金コイ同士', parent1FishId:'golden_carp',parent2FishId:'golden_carp',  childFishId:'divine_koi',      childName:'神鯉',       childIcon:'👑', childRarity:'mythic',    breedTimeMs:72*HOUR, description:'黄金コイ同士から神格の鯉が生まれる。' },
  { id:'r171', name:'嵐とサメ',   parent1FishId:'storm_tuna',  parent2FishId:'shark',         childFishId:'alpha_shark',     childName:'アルファシャーク', childIcon:'🦈', childRarity:'epic', breedTimeMs:24*HOUR, description:'嵐マグロとサメが融合して最強の捕食者が生まれる。' },
  { id:'r172', name:'龍神スズキ同士',parent1FishId:'ryujin_bass',parent2FishId:'ryujin_bass', childFishId:'rainbow_koi_ex',  childName:'虹鯉',       childIcon:'🌈', childRarity:'epic',      breedTimeMs:12*HOUR, description:'龍神スズキ同士から虹色の子が生まれる。' },
  { id:'r173', name:'深海王者',   parent1FishId:'deep_whale',  parent2FishId:'abyssal_eel',   childFishId:'elder_eel',       childName:'長老ウナギ', childIcon:'🐍', childRarity:'legendary', breedTimeMs:48*HOUR, description:'深海の巨大生物から長老が生まれる。' },
  { id:'r174', name:'海と空',     parent1FishId:'sea_god',     parent2FishId:'sky_whale',     childFishId:'sea_emperor',     childName:'海皇魚',     childIcon:'🌊', childRarity:'legendary', breedTimeMs:60*HOUR, description:'海神と天空クジラから海の皇帝が生まれる。' },
  { id:'r175', name:'太古の血',   parent1FishId:'ancient_shark',parent2FishId:'ancient_carp', childFishId:'ancient_tuna',    childName:'古代マグロ', childIcon:'🦕', childRarity:'legendary', breedTimeMs:48*HOUR, description:'古代サメと古代鯉から古代マグロが生まれる。' },
  { id:'r176', name:'白虎と朱雀', parent1FishId:'white_tiger_fish',parent2FishId:'vermilion_bird_fish',childFishId:'chimera_fish',childName:'キメラ魚', childIcon:'🦁', childRarity:'legendary', breedTimeMs:60*HOUR,description:'四神の力が融合してキメラが生まれる。' },
  { id:'r177', name:'青龍と玄武', parent1FishId:'azure_dragon_fish',parent2FishId:'black_tortoise_fish',childFishId:'sea_serpent',childName:'海蛇神', childIcon:'🌊', childRarity:'mythic',    breedTimeMs:96*HOUR, description:'四神の龍と亀が融合して海蛇神が生まれる。' },
  { id:'r178', name:'麒麟の後継', parent1FishId:'kirin_fish',  parent2FishId:'god_koi',       childFishId:'divine_koi',      childName:'神鯉',       childIcon:'👑', childRarity:'mythic',    breedTimeMs:96*HOUR, description:'麒麟魚と神コイから神格の鯉が生まれる。' },
  { id:'r179', name:'鳳凰の再生', parent1FishId:'phoenix_legend_fish',parent2FishId:'phoenix_koi',childFishId:'celestial_koi', childName:'天界鯉',   childIcon:'☀️', childRarity:'mythic',    breedTimeMs:168*HOUR,description:'二つの鳳凰が融合して天界の鯉が生まれる。' },
  { id:'r180', name:'幸運の魚',   parent1FishId:'fairy_fish',  parent2FishId:'miracle_fish',  childFishId:'prismatic_fish',  childName:'虹色魚',     childIcon:'🌈', childRarity:'epic',      breedTimeMs:20*HOUR, description:'妖精魚と奇跡の魚から幸運の虹色魚が生まれる。' },
  { id:'r181', name:'運命の融合', parent1FishId:'destiny_fish',parent2FishId:'miracle_fish',  childFishId:'god_of_fish',     childName:'魚神',       childIcon:'🌟', childRarity:'mythic',    breedTimeMs:240*HOUR,description:'運命の魚と奇跡の魚から魚の神が誕生する。' },
  { id:'r182', name:'創造の力',   parent1FishId:'creator_fish',parent2FishId:'creation_dragon',childFishId:'god_of_fish',   childName:'魚神',       childIcon:'🌟', childRarity:'mythic',    breedTimeMs:240*HOUR,description:'創造主の魚と創造龍から魚の神が誕生する。' },
  { id:'r183', name:'破壊と創造', parent1FishId:'destroyer_shark',parent2FishId:'creator_fish',childFishId:'chimera_fish',  childName:'キメラ魚',   childIcon:'🦁', childRarity:'legendary', breedTimeMs:72*HOUR, description:'破壊の鮫と創造主の魚から異形が生まれる。' },
  { id:'r184', name:'無限の深淵', parent1FishId:'void_fish',   parent2FishId:'infinity_fish', childFishId:'void_koi',        childName:'虚空鯉',     childIcon:'🕳️', childRarity:'mythic',    breedTimeMs:120*HOUR,description:'虚無魚と∞魚から虚空の鯉が生まれる。' },
  { id:'r185', name:'始まりと終わり',parent1FishId:'origin_fish',parent2FishId:'end_fish',    childFishId:'god_of_fish',     childName:'魚神',       childIcon:'🌟', childRarity:'mythic',    breedTimeMs:240*HOUR,description:'始まりの魚と終末魚から魚の神が誕生する。' },
  { id:'r186', name:'螺旋の進化', parent1FishId:'infinity_spiral_fish',parent2FishId:'galaxy_fish',childFishId:'galaxy_catfish',childName:'銀河ナマズ', childIcon:'🌌', childRarity:'mythic',breedTimeMs:120*HOUR,description:'無限螺旋魚と銀河魚から銀河ナマズが生まれる。' },
  { id:'r187', name:'黄金クラーケン',parent1FishId:'golden_kraken',parent2FishId:'deep_whale', childFishId:'sea_emperor',    childName:'海皇魚',     childIcon:'🌊', childRarity:'legendary', breedTimeMs:60*HOUR, description:'黄金クラーケンと深淵クジラから海皇が生まれる。' },
  { id:'r188', name:'深海女神',   parent1FishId:'deepsea_goddess',parent2FishId:'sea_god',   childFishId:'divine_koi',      childName:'神鯉',       childIcon:'👑', childRarity:'mythic',    breedTimeMs:96*HOUR, description:'深海女神と海神から神格の鯉が生まれる。' },
  { id:'r189', name:'銀の幻影',   parent1FishId:'silver_phantom',parent2FishId:'phantom_tuna',childFishId:'phantom_koi',    childName:'幻鯉',       childIcon:'👻', childRarity:'legendary', breedTimeMs:48*HOUR, description:'銀の幻影と幻のマグロから幻の鯉が生まれる。' },
  { id:'r190', name:'龍王の子',   parent1FishId:'dragon_king', parent2FishId:'ryujin',       childFishId:'ultimate_dragon', childName:'究極龍魚',   childIcon:'🐉', childRarity:'mythic',    breedTimeMs:168*HOUR,description:'龍王と龍神から究極の龍が生まれる。' },
  { id:'r191', name:'炎と嵐',     parent1FishId:'blaze_dragon_fish',parent2FishId:'storm_lord',childFishId:'chimera_fish',  childName:'キメラ魚',   childIcon:'🦁', childRarity:'legendary', breedTimeMs:60*HOUR, description:'灼熱竜魚と嵐の覇者から異形のキメラが生まれる。' },
  { id:'r192', name:'氷と雷',     parent1FishId:'ice_emperor_whale',parent2FishId:'thunder_god_fish',childFishId:'golden_whale',childName:'黄金クジラ', childIcon:'💛', childRarity:'legendary',breedTimeMs:60*HOUR, description:'氷皇クジラと雷神魚から黄金のクジラが生まれる。' },
  { id:'r193', name:'暗闇の融合', parent1FishId:'dark_queen_fish',parent2FishId:'void_serpent',childFishId:'void_koi',      childName:'虚空鯉',     childIcon:'🕳️', childRarity:'mythic',    breedTimeMs:120*HOUR,description:'闇の女王と虚空の蛇から虚空の鯉が生まれる。' },
  { id:'r194', name:'光の後継者', parent1FishId:'light_envoy_fish',parent2FishId:'angel_fish_legend',childFishId:'celestial_koi',childName:'天界鯉',  childIcon:'☀️', childRarity:'mythic',    breedTimeMs:168*HOUR,description:'光の使者と天使フィッシュから天界の鯉が生まれる。' },
  { id:'r195', name:'嵐の超越者', parent1FishId:'storm_lord',  parent2FishId:'thunder_emperor',childFishId:'sea_emperor',   childName:'海皇魚',     childIcon:'🌊', childRarity:'legendary', breedTimeMs:60*HOUR, description:'嵐の覇者と雷帝魚から海の皇帝が生まれる。' },
  { id:'r196', name:'神話の誕生', parent1FishId:'god_dragon_fish',parent2FishId:'creator_fish',childFishId:'ultimate_dragon',childName:'究極龍魚',  childIcon:'🐉', childRarity:'mythic',    breedTimeMs:168*HOUR,description:'神龍魚と創造主の魚から究極の龍が生まれる。' },
  { id:'r197', name:'最強の覇者', parent1FishId:'sea_emperor', parent2FishId:'ultimate_dragon',childFishId:'god_of_fish',   childName:'魚神',       childIcon:'🌟', childRarity:'mythic',    breedTimeMs:240*HOUR,description:'海皇魚と究極龍魚から魚の神が誕生する。' },
  { id:'r198', name:'万物の根源', parent1FishId:'void_koi',   parent2FishId:'celestial_koi', childFishId:'god_of_fish',     childName:'魚神',       childIcon:'🌟', childRarity:'mythic',    breedTimeMs:240*HOUR,description:'虚空鯉と天界鯉から魚の神が誕生する。' },
  { id:'r199', name:'創世の魚',   parent1FishId:'god_of_fish', parent2FishId:'sea_god',       childFishId:'god_of_fish',     childName:'魚神',       childIcon:'🌟', childRarity:'mythic',    breedTimeMs:240*HOUR,description:'魚の神同士から更なる神が誕生する。' },
  { id:'r200', name:'終焉と創造', parent1FishId:'god_of_fish', parent2FishId:'destroyer_shark',childFishId:'ultimate_dragon',childName:'究極龍魚',  childIcon:'🐉', childRarity:'mythic',    breedTimeMs:168*HOUR,description:'魚の神と破壊の鮫から究極の龍が誕生する。' },
];

export const BREED_RECIPE_MAP = Object.fromEntries(BREED_RECIPES.map(r => [r.id, r]));
export const TOTAL_RECIPES = BREED_RECIPES.length;
