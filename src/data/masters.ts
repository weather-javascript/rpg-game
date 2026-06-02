// src/data/masters.ts
// 新しいアイテム・モンスター・ダンジョンを追加する場合はここに追記するだけ。

import type {
  ItemMaster, SkillMaster, GatherNodeMaster,
  MonsterMaster, DungeonMaster, GambleMaster,
} from '../types/game';

// ============================================================
// アイテムマスター
// ============================================================
export const ITEM_MASTER: Record<string, ItemMaster> = {
  // --- 基本素材 ---
  wood:        { id:'wood',        name:'木材',      description:'伐採で手に入る基本素材。',                          category:'material',  rarity:'common',    sellPrice:5,    buyPrice:0,    maxStack:-1,  icon:'🪵' },
  stone:       { id:'stone',       name:'石',        description:'採掘で手に入る基本素材。',                          category:'material',  rarity:'common',    sellPrice:4,    buyPrice:0,    maxStack:-1,  icon:'🪨' },
  iron_ore:    { id:'iron_ore',    name:'鉄鉱石',    description:'採掘で手に入る鉱石。',                              category:'material',  rarity:'uncommon',  sellPrice:25,   buyPrice:0,    maxStack:-1,  icon:'⚫' },
  coal:        { id:'coal',        name:'石炭',      description:'鉱山で採れる燃料素材。',                            category:'material',  rarity:'common',    sellPrice:10,   buyPrice:0,    maxStack:-1,  icon:'🖤' },
  gold_ore:    { id:'gold_ore',    name:'金鉱石',    description:'希少な鉱石。高値で売れる。',                        category:'material',  rarity:'rare',      sellPrice:120,  buyPrice:0,    maxStack:-1,  icon:'✨' },
  emerald:     { id:'emerald',     name:'エメラルド', description:'美しい緑の宝石。売値が高い。',                      category:'material',  rarity:'rare',      sellPrice:200,  buyPrice:0,    maxStack:-1,  icon:'💚' },
  emerald_block:{ id:'emerald_block', name:'エメラルドブロック', description:'エメラルドの塊。非常に高値。',           category:'material',  rarity:'epic',      sellPrice:1800, buyPrice:0,    maxStack:99,  icon:'🟢' },
  ancient_shard:{ id:'ancient_shard', name:'古代の欠片', description:'ダンジョンの深部に眠る謎の素材。',              category:'material',  rarity:'epic',      sellPrice:500,  buyPrice:0,    maxStack:99,  icon:'💎' },
  iron_ingot:  { id:'iron_ingot',  name:'鉄塊',      description:'精錬された鉄。各種製造に必要。',                    category:'material',  rarity:'uncommon',  sellPrice:40,   buyPrice:0,    maxStack:-1,  icon:'🔩' },

  // --- モンスタードロップ ---
  cave_fragment:   { id:'cave_fragment',    name:'洞窟の欠片',    description:'洞窟王の手下が落とす欠片。',            category:'material',  rarity:'common',    sellPrice:8,    buyPrice:0,    maxStack:-1,  icon:'🗿' },
  cave_gem:        { id:'cave_gem',         name:'洞窟王の宝石',  description:'洞窟王が落とす輝く宝石。',              category:'material',  rarity:'rare',      sellPrice:200,  buyPrice:0,    maxStack:99,  icon:'💠' },
  rusty_sword:     { id:'rusty_sword',      name:'錆びた剣',      description:'洞窟王が落とす古い剣。',                category:'weapon',    rarity:'uncommon',  sellPrice:50,   buyPrice:0,    maxStack:1,   icon:'🗡️' },
  contract:        { id:'contract',         name:'契約書',        description:'各ダンジョンのモブが低確率で落とす。',   category:'treasure',  rarity:'uncommon',  sellPrice:30,   buyPrice:0,    maxStack:-1,  icon:'📜' },
  coin:            { id:'coin',             name:'硬貨',          description:'中級ダンジョンの通貨。',                category:'material',  rarity:'common',    sellPrice:1,    buyPrice:0,    maxStack:-1,  icon:'🪙' },
  fortress_order:  { id:'fortress_order',   name:'要塞防衛出兵状',description:'鉄戦士が落とす出兵命令書。',           category:'material',  rarity:'uncommon',  sellPrice:20,   buyPrice:0,    maxStack:-1,  icon:'📋' },
  crusher_box:     { id:'crusher_box',      name:'破壊人の道具箱',description:'クラッシャーが落とす道具箱。',         category:'material',  rarity:'uncommon',  sellPrice:25,   buyPrice:0,    maxStack:-1,  icon:'🧰' },
  memento:         { id:'memento',          name:'形見の写真',    description:'強戦士が落とす写真。',                  category:'material',  rarity:'rare',      sellPrice:60,   buyPrice:0,    maxStack:99,  icon:'🖼️' },
  hammer:          { id:'hammer',           name:'ハンマー',      description:'アルティメイトクラッシャーが落とす。',   category:'weapon',    rarity:'uncommon',  sellPrice:80,   buyPrice:0,    maxStack:1,   icon:'🔨' },
  spear_shaft:     { id:'spear_shaft',      name:'槍の柄',        description:'特殊戦闘槍兵が落とす槍の柄。',          category:'material',  rarity:'uncommon',  sellPrice:35,   buyPrice:0,    maxStack:-1,  icon:'🪄' },
  almighty_staff:  { id:'almighty_staff',   name:'万能杖',        description:'バイオマンサーが確定ドロップ。',         category:'weapon',    rarity:'rare',      sellPrice:300,  buyPrice:0,    maxStack:1,   icon:'🪄' },
  mole_claw:       { id:'mole_claw',        name:'モグラの爪',    description:'ドリュウが落とす硬い爪。',              category:'material',  rarity:'uncommon',  sellPrice:40,   buyPrice:0,    maxStack:-1,  icon:'🦡' },
  spirit_ice:      { id:'spirit_ice',       name:'霊氷',          description:'氷霊が落とす素材。',                    category:'material',  rarity:'rare',      sellPrice:80,   buyPrice:0,    maxStack:99,  icon:'🧊' },
  stalactite:      { id:'stalactite',       name:'鍾乳石',        description:'零が確定ドロップ。一度に8個落とす。',   category:'material',  rarity:'epic',      sellPrice:150,  buyPrice:0,    maxStack:-1,  icon:'🌙' },
  slime_gel:       { id:'slime_gel',        name:'スライムゼリー',description:'スライムが落とす粘液。',               category:'material',  rarity:'common',    sellPrice:8,    buyPrice:0,    maxStack:-1,  icon:'🫧' },
  goblin_ear:      { id:'goblin_ear',       name:'ゴブリンの耳', description:'ゴブリンの証。',                        category:'material',  rarity:'uncommon',  sellPrice:30,   buyPrice:0,    maxStack:-1,  icon:'👂' },
  dragon_scale:    { id:'dragon_scale',     name:'ドラゴンの鱗', description:'非常に希少な最高素材。',               category:'material',  rarity:'legendary', sellPrice:2000, buyPrice:0,    maxStack:10,  icon:'🐉' },

  // --- 道具 ---
  iron_pickaxe:    { id:'iron_pickaxe',     name:'鉄のツルハシ',  description:'採掘効率が上がる。',                    category:'tool',      rarity:'uncommon',  sellPrice:50,   buyPrice:200,  maxStack:1,   icon:'⛏️' },
  iron_axe:        { id:'iron_axe',         name:'鉄の斧',        description:'伐採効率が上がる。',                    category:'tool',      rarity:'uncommon',  sellPrice:50,   buyPrice:200,  maxStack:1,   icon:'🪓' },

  // ===== 釣り竿 =====
  basic_rod:      { id:'basic_rod',     name:'基本の釣り竿',   description:'最初からある釣り竿。バニラの魚が釣れる。',                                    category:'tool', rarity:'common',    sellPrice:10,   buyPrice:50,   maxStack:1, icon:'🎣' },
  ore_rod:        { id:'ore_rod',       name:'鉱石ロッド',     description:'謎の箱から出る釣り竿。鉱石も釣れる。',                                        category:'tool', rarity:'uncommon',  sellPrice:100,  buyPrice:0,    maxStack:1, icon:'🎣' },
  all_rod_x:      { id:'all_rod_x',     name:'オールロッドX',  description:'釣りチケットが釣れるようになる重要な竿。',                                     category:'tool', rarity:'rare',      sellPrice:500,  buyPrice:0,    maxStack:1, icon:'🎣' },
  master_rod:     { id:'master_rod',    name:'マスターロッド', description:'Yランダムボックスが釣れる高性能の竿。',                                         category:'tool', rarity:'epic',      sellPrice:2000, buyPrice:0,    maxStack:1, icon:'🎣' },
  master_rod_z:   { id:'master_rod_z',  name:'マスターロッドZ', description:'資源釣りが可能になる最上位の通常竿。エメラルドブロックも釣れる。',             category:'tool', rarity:'epic',      sellPrice:5000, buyPrice:0,    maxStack:1, icon:'🎣' },
  ffgg_rod_r1:    { id:'ffgg_rod_r1',   name:'FFGGロッドRank1', description:'FFGGエリアで使う専用釣り竿。',                                                category:'tool', rarity:'rare',      sellPrice:300,  buyPrice:0,    maxStack:1, icon:'🎣' },
  ffgg_rod_r3:    { id:'ffgg_rod_r3',   name:'FFGGロッドRank3', description:'投票チケット＋オンタイムチケット64枚で入手。',                                 category:'tool', rarity:'rare',      sellPrice:800,  buyPrice:0,    maxStack:1, icon:'🎣' },
  ffgg_rod_r6:    { id:'ffgg_rod_r6',   name:'FFGGロッドRank6', description:'FFGG釣り最強。鱗・牙・小判が大量に釣れる。強化推奨。',                         category:'tool', rarity:'epic',      sellPrice:5000, buyPrice:0,    maxStack:1, icon:'🎣' },
  ffggr_rod:      { id:'ffggr_rod',     name:'FFGGRロッド',     description:'GGR釣り専用。クレートとお金が釣れる。',                                        category:'tool', rarity:'legendary', sellPrice:8000, buyPrice:0,    maxStack:1, icon:'🎣' },

  // ===== 釣りで取れる魚（バニラ）=====
  raw_cod:      { id:'raw_cod',     name:'生鱈',     description:'バニラの魚。焚火交換所で釣りチケットプラスに交換できる。', category:'food', rarity:'common', sellPrice:8,  buyPrice:0, maxStack:-1, icon:'🐟',
    useEffect: { satietyRestore: 15, message: '生鱈を食べた。満腹度が少し回復した。' } },
  raw_salmon:   { id:'raw_salmon',  name:'生鮭',     description:'バニラの魚。', category:'food', rarity:'common', sellPrice:10, buyPrice:0, maxStack:-1, icon:'🐠',
    useEffect: { satietyRestore: 15, message: '生鮭を食べた。' } },
  pufferfish:   { id:'pufferfish',  name:'フグ',     description:'バニラの魚。毒がある。', category:'food', rarity:'uncommon', sellPrice:5, buyPrice:0, maxStack:-1, icon:'🐡',
    useEffect: { satietyRestore: 5, hpRestore: -20, message: 'フグを食べた！毒でHPが減った！' } },
  tropical_fish:{ id:'tropical_fish',name:'熱帯魚',  description:'バニラの魚。', category:'food', rarity:'uncommon', sellPrice:12, buyPrice:0, maxStack:-1, icon:'🐠',
    useEffect: { satietyRestore: 12, message: '熱帯魚を食べた。' } },

  // ===== FFGG魚 =====
  brilliant_salmon:{ id:'brilliant_salmon', name:'ブリリアントキングサーモン', description:'FFGGエリア産の高級魚。魔道食料庫にストック可能。', category:'food', rarity:'rare',   sellPrice:80, buyPrice:0, maxStack:99, icon:'🐟',
    useEffect: { satietyRestore: 50, hpRestore: 30, message: 'ブリリアントキングサーモンを食べた！HP・満腹度が大幅回復！' } },
  hoshi_tuna:  { id:'hoshi_tuna',  name:'ホシネツナ',      description:'FFGGエリア産の希少なマグロ。', category:'food', rarity:'rare',   sellPrice:90, buyPrice:0, maxStack:99, icon:'🐠',
    useEffect: { satietyRestore: 50, hpRestore: 25, message: 'ホシネツナを食べた！満腹度が大回復！' } },
  shell_fish:  { id:'shell_fish',  name:'オオグロリクサザエ', description:'FFGGエリア産の貝。', category:'food', rarity:'rare',   sellPrice:70, buyPrice:0, maxStack:99, icon:'🐚',
    useEffect: { satietyRestore: 40, hpRestore: 20, message: 'サザエを食べた！' } },
  arowanna:    { id:'arowanna',    name:'シンリンアロワナ', description:'FFGGエリア産の幻の魚。', category:'food', rarity:'epic',    sellPrice:150, buyPrice:0, maxStack:99, icon:'🐡',
    useEffect: { satietyRestore: 60, hpRestore: 40, message: 'アロワナを食べた！HP・満腹度が大幅回復！' } },

  // ===== 釣りで取れるその他アイテム =====
  fishing_ticket:  { id:'fishing_ticket',   name:'釣りチケット',       description:'焚火交換所で不死のトーテムに交換できる。さらにYリアクターへ変換可。', category:'treasure', rarity:'uncommon', sellPrice:50,   buyPrice:0, maxStack:-1, icon:'🎫' },
  fishing_ticket_p:{ id:'fishing_ticket_p', name:'釣りチケットプラス', description:'魚や釣りチケットを換算したもの。',                                        category:'treasure', rarity:'uncommon', sellPrice:80,   buyPrice:0, maxStack:-1, icon:'🎟️' },
  totem:           { id:'totem',            name:'不死のトーテム',     description:'釣りチケットと交換。Yリアクターの素材。',                                  category:'treasure', rarity:'rare',     sellPrice:200,  buyPrice:0, maxStack:99, icon:'🪬' },
  y_random_box:    { id:'y_random_box',     name:'Yランダムボックス',  description:'マスターロッド以上で釣れる宝箱。中身はランダム。',                         category:'treasure', rarity:'rare',     sellPrice:300,  buyPrice:0, maxStack:99, icon:'📦' },
  y_reactor:       { id:'y_reactor',        name:'Yリアクター',        description:'釣りの最重要アイテム。Zリアクターの素材。',                                 category:'material', rarity:'epic',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'⚡' },
  z_reactor:       { id:'z_reactor',        name:'Zリアクター',        description:'通常釣りの最終目標。非常に高価値。',                                        category:'material', rarity:'legendary',sellPrice:5000, buyPrice:0, maxStack:99, icon:'🔋' },
  nether_proof:    { id:'nether_proof',     name:'ネザー解放の証',     description:'Yランダムボックスを交換したもの。Zリアクターの素材。',                      category:'material', rarity:'rare',     sellPrice:500,  buyPrice:0, maxStack:99, icon:'🌋' },

  // ===== FF小判・大判 =====
  ff_coin_small:   { id:'ff_coin_small',    name:'FF小判',     description:'FFGGエリアで釣れる通貨。大判に交換してお金に。',           category:'treasure', rarity:'uncommon', sellPrice:100,  buyPrice:0, maxStack:-1, icon:'💴' },
  ff_coin_large:   { id:'ff_coin_large',    name:'FF大判',     description:'FF小判と交換できる。1st50万円ほどで売れる。',              category:'treasure', rarity:'rare',     sellPrice:500000, buyPrice:0, maxStack:99, icon:'💵' },

  // ===== 鱗・牙 =====
  scale_low_1:     { id:'scale_low_1',     name:'下位鱗（炎）',   description:'FFGGエリアの下位鱗4種のひとつ。',                     category:'material', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'🔴' },
  scale_low_2:     { id:'scale_low_2',     name:'下位鱗（水）',   description:'FFGGエリアの下位鱗4種のひとつ。',                     category:'material', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'🔵' },
  scale_low_3:     { id:'scale_low_3',     name:'下位鱗（風）',   description:'FFGGエリアの下位鱗4種のひとつ。',                     category:'material', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'🟢' },
  scale_low_4:     { id:'scale_low_4',     name:'下位鱗（土）',   description:'FFGGエリアの下位鱗4種のひとつ。',                     category:'material', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'🟤' },
  scale_high_1:    { id:'scale_high_1',    name:'上位鱗（炎）',   description:'Rank4以上で1000スコアごとに確定1枚。高価値。',         category:'material', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'🔥' },
  scale_high_2:    { id:'scale_high_2',    name:'上位鱗（水）',   description:'Rank4以上で釣れる上位鱗。武器素材に。',                category:'material', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'💧' },
  scale_high_3:    { id:'scale_high_3',    name:'上位鱗（風）',   description:'Rank4以上で釣れる上位鱗。',                           category:'material', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'🌀' },
  scale_high_4:    { id:'scale_high_4',    name:'上位鱗（土）',   description:'Rank4以上で釣れる上位鱗。',                           category:'material', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'⛰️' },
  wolf_fang:       { id:'wolf_fang',       name:'ハーブウルフの牙', description:'FFGGで釣れる牙。波浪の交換素材になる。',             category:'material', rarity:'uncommon', sellPrice:300,  buyPrice:0, maxStack:99, icon:'🦷' },
  wolf_crystal:    { id:'wolf_crystal',    name:'狼牙魔結晶',     description:'Rank4以上で釣れる。上位鱗と波浪の交換素材。',         category:'material', rarity:'rare',     sellPrice:1500, buyPrice:0, maxStack:99, icon:'🔮' },
  caribbean_wave:  { id:'caribbean_wave',  name:'カリブの荒波',   description:'フィーバー中のみ低確率。波浪の交換素材。',             category:'material', rarity:'rare',     sellPrice:800,  buyPrice:0, maxStack:99, icon:'🌊' },

  // ===== ラジュース（幸運バフ）=====
  la_juice_normal: { id:'la_juice_normal', name:'ラジュース',       description:'飲むと幸運バフが付く。釣り・採掘効率アップ。',       category:'potion', rarity:'rare',     sellPrice:500,  buyPrice:0, maxStack:99, icon:'🧉',
    useEffect: { hpRestore: 20, satietyRestore: 20, message: 'ラジュースを飲んだ！幸運バフが付いた！釣り・採掘効率+30%！' } },
  la_juice_high:   { id:'la_juice_high',   name:'上位ラジュース',   description:'GGR釣りのクレートから入手。より強力な幸運バフ。',     category:'potion', rarity:'epic',     sellPrice:2000, buyPrice:0, maxStack:99, icon:'🍹',
    useEffect: { hpRestore: 50, satietyRestore: 50, message: '上位ラジュースを飲んだ！強力な幸運バフ！釣り・採掘効率+60%！' } },

  // ===== GGR報酬クレート =====
  crate_leather:   { id:'crate_leather',   name:'革クレート',     description:'GGR釣りで入手。開封でアイテム入手。',       category:'treasure', rarity:'common',    sellPrice:50,   buyPrice:0, maxStack:99, icon:'📫' },
  crate_gold:      { id:'crate_gold',      name:'金クレート',     description:'GGR釣りで入手。革より豪華な報酬。',         category:'treasure', rarity:'uncommon',  sellPrice:200,  buyPrice:0, maxStack:99, icon:'📬' },
  crate_diamond:   { id:'crate_diamond',   name:'ダイヤクレート', description:'GGR釣りで入手。かなり良い報酬が出る。',     category:'treasure', rarity:'rare',      sellPrice:800,  buyPrice:0, maxStack:99, icon:'📭' },
  crate_enhanced:  { id:'crate_enhanced',  name:'強化ダイヤクレート', description:'GGR釣りの最高級クレート。豪華報酬確定。',  category:'treasure', rarity:'epic',      sellPrice:3000, buyPrice:0, maxStack:99, icon:'📮' },

  // ===== 採掘システムアイテム（Wiki準拠）=====
  polishing_agent_1: { id:'polishing_agent_1', name:'研磨剤Ⅰ',  description:'資源ピッケルの強化素材。対応装備で採掘すると入手。',  category:'material', rarity:'common',   sellPrice:10,  buyPrice:30,  maxStack:-1, icon:'🪨' },
  polishing_agent_5: { id:'polishing_agent_5', name:'研磨剤Ⅴ',  description:'研磨剤の中級品。資源ピッケルの強化に使用。',          category:'material', rarity:'uncommon', sellPrice:50,  buyPrice:150, maxStack:-1, icon:'💎' },
  resource_pickaxe:  { id:'resource_pickaxe',  name:'資源ピッケル', description:'採掘効率が大幅アップ。研磨剤で強化可能。',          category:'tool',     rarity:'rare',     sellPrice:500, buyPrice:0,   maxStack:1,  icon:'⛏️' },
  storage_box:       { id:'storage_box',       name:'ストレージボックス', description:'同一アイテムを大量収納。採掘時の必須アイテム。',  category:'tool',     rarity:'uncommon', sellPrice:100, buyPrice:300, maxStack:99, icon:'📦' },
  vote_ticket:       { id:'vote_ticket',       name:'投票チケット', description:'投票で入手。FFGGロッドの交換に使用。',               category:'treasure', rarity:'uncommon', sellPrice:200, buyPrice:0,   maxStack:99, icon:'🗳️' },
  ontime_ticket:     { id:'ontime_ticket',     name:'OTT(オンタイムチケット)', description:'接続時間で入手。各種交換に使用。',          category:'treasure', rarity:'uncommon', sellPrice:150, buyPrice:0,   maxStack:-1, icon:'⏰' },
  mystery_key:       { id:'mystery_key',       name:'謎の鍵',    description:'研磨剤から製造可能。ミステリーBOX開封に必要。',       category:'tool',     rarity:'uncommon', sellPrice:80,  buyPrice:0,   maxStack:99, icon:'🗝️' },
  mystery_box_ore:   { id:'mystery_box_ore',   name:'謎のミステリーBOX', description:'Yレイド・Zレイドで入手。カスタムチケットが出る。', category:'treasure', rarity:'rare',   sellPrice:0,   buyPrice:0,   maxStack:99, icon:'📦' },
  resource_ticket:   { id:'resource_ticket',   name:'資源チケット', description:'資源ピッケルで採掘時に入手。装備の素材。',           category:'treasure', rarity:'common',   sellPrice:30,  buyPrice:0,   maxStack:-1, icon:'📋' },
  ocean_heart:       { id:'ocean_heart',       name:'海洋の心',  description:'TF防具の作成素材。釣りの達人の証。',                  category:'material', rarity:'legendary',sellPrice:5000,buyPrice:0,   maxStack:10, icon:'💙' },
  dragon_soul:       { id:'dragon_soul',       name:'ドラゴンソール', description:'FFGGで釣れる。30000溜まるとドラフィが発生！',       category:'material', rarity:'epic',     sellPrice:1000,buyPrice:0,   maxStack:-1, icon:'🐲' },

  // ===== 消耗品 =====
  health_potion: {
    id:'health_potion', name:'回復薬', description:'HPを50回復する。',
    category:'potion', rarity:'common', sellPrice:20, buyPrice:60, maxStack:99, icon:'🧪',
    useEffect: { hpRestore: 50, message: '回復薬を飲んでHPが50回復した！' },
  },
  mega_potion: {
    id:'mega_potion', name:'メガポーション', description:'HPを150回復する。',
    category:'potion', rarity:'uncommon', sellPrice:60, buyPrice:180, maxStack:99, icon:'💊',
    useEffect: { hpRestore: 150, message: 'メガポーションを飲んでHPが150回復した！' },
  },
  food_ration: {
    id:'food_ration', name:'携帯食料', description:'満腹度を30回復する。',
    category:'food', rarity:'common', sellPrice:5, buyPrice:20, maxStack:99, icon:'🍖',
    useEffect: { satietyRestore: 30, message: '食料を食べて満腹度が30回復した！' },
  },
  roast_meat: {
    id:'roast_meat', name:'焼き肉', description:'満腹度を60・HPを20回復する。',
    category:'food', rarity:'uncommon', sellPrice:15, buyPrice:50, maxStack:99, icon:'🥩',
    useEffect: { satietyRestore: 60, hpRestore: 20, message: '焼き肉を食べてスタミナ全開！' },
  },
  elixir: {
    id:'elixir', name:'エリクサー', description:'HP・満腹度を全回復する。',
    category:'potion', rarity:'epic', sellPrice:500, buyPrice:2000, maxStack:10, icon:'✨',
    useEffect: { hpRestore: 9999, satietyRestore: 9999, message: 'エリクサーを使い完全回復した！' },
  },
  emergency_ration: {
    id:'emergency_ration', name:'緊急食料パック', description:'【救済】HPと満腹度を50ずつ回復する。所持金0G・HP30以下・満腹度10以下の緊急時に入手可能。',
    category:'food', rarity:'uncommon', sellPrice:0, buyPrice:0, maxStack:5, icon:'🆘',
    useEffect: { hpRestore: 50, satietyRestore: 50, message: '緊急食料パックを使用した！HP・満腹度が50回復！' },
  },
  // --- 宝箱 ---
  mystery_box: {
    id:'mystery_box', name:'謎の宝箱', description:'中身は分からない。',
    category:'treasure', rarity:'rare', sellPrice:0, buyPrice:500, maxStack:99, icon:'📦',
  },
};

// ============================================================
// スキルマスター
// ============================================================
export const SKILL_MASTER: Record<string, SkillMaster> = {
  mining:      { id:'mining',      name:'採掘', description:'岩や鉱脈から資源を採取する能力。', icon:'⛏️', maxLevel:50 },
  woodcutting: { id:'woodcutting', name:'伐採', description:'木を切り倒して木材を集める能力。', icon:'🪓', maxLevel:50 },
  combat:      { id:'combat',      name:'戦闘', description:'モンスターと戦う能力。',           icon:'⚔️', maxLevel:100 },
  fishing:     { id:'fishing',     name:'釣り', description:'魚や水中の素材を採取する能力。',   icon:'🎣', maxLevel:50 },
  crafting:    { id:'crafting',    name:'製作', description:'素材からアイテムを作成する能力。', icon:'🔨', maxLevel:50 },
};

// ============================================================
// 採取ノードマスター
// ============================================================
export const GATHER_NODE_MASTER: Record<string, GatherNodeMaster> = {
  pine_tree:      { id:'pine_tree',      name:'松の木',   description:'平原に生える一般的な木。', icon:'🌲', requiredSkill:{skillId:'woodcutting',minLevel:1},  cooldownMs:3000,  staminaCost:5,  drops:[{itemId:'wood',      baseRate:1.0, minAmount:1, maxAmount:3, skillRateBonus:0.05}] },
  oak_tree:       { id:'oak_tree',       name:'オークの木',description:'硬い木材が取れる大木。', icon:'🌳', requiredSkill:{skillId:'woodcutting',minLevel:5},  cooldownMs:5000,  staminaCost:8,  drops:[{itemId:'wood',      baseRate:1.0, minAmount:2, maxAmount:5, skillRateBonus:0.08}] },
  stone_deposit:  { id:'stone_deposit',  name:'岩場',     description:'地面にある岩の塊。',       icon:'🪨', requiredSkill:{skillId:'mining',     minLevel:1},  cooldownMs:4000,  staminaCost:6,  drops:[{itemId:'stone',     baseRate:1.0, minAmount:1, maxAmount:3},{itemId:'coal',  baseRate:0.15, minAmount:1, maxAmount:2},{itemId:'polishing_agent_1', baseRate:0.08, minAmount:1, maxAmount:1}] },
  iron_vein:      { id:'iron_vein',      name:'鉄鉱脈',   description:'鉄を含む鉱脈。鉄塊も出る。', icon:'⛏️', requiredSkill:{skillId:'mining',     minLevel:10}, cooldownMs:8000,  staminaCost:12, drops:[{itemId:'iron_ore',  baseRate:1.0, minAmount:1, maxAmount:3, skillRateBonus:0.1},{itemId:'iron_ingot', baseRate:0.3, minAmount:1, maxAmount:2},{itemId:'gold_ore', baseRate:0.05, minAmount:1, maxAmount:1},{itemId:'polishing_agent_1', baseRate:0.12, minAmount:1, maxAmount:2}] },
  gold_vein:      { id:'gold_vein',      name:'金鉱脈',   description:'希少な金を含む鉱脈。', icon:'✨', requiredSkill:{skillId:'mining',     minLevel:25}, cooldownMs:15000, staminaCost:20, drops:[{itemId:'gold_ore',  baseRate:1.0, minAmount:1, maxAmount:3, skillRateBonus:0.12},{itemId:'emerald', baseRate:0.15, minAmount:1, maxAmount:2}] },
  emerald_vein:   { id:'emerald_vein',   name:'エメラルド鉱脈', description:'エメラルドが取れる希少な鉱脈。', icon:'💚', requiredSkill:{skillId:'mining', minLevel:35}, cooldownMs:20000, staminaCost:25, drops:[{itemId:'emerald', baseRate:1.0, minAmount:1, maxAmount:3, skillRateBonus:0.15},{itemId:'emerald_block', baseRate:0.05, minAmount:1, maxAmount:1}] },
  // ===== 釣りノード =====
  fishing_pond: {
    id:'fishing_pond', name:'釣り場（基本）', description:'バニラの魚が釣れる。基本の釣り竿でOK。', icon:'🎣',
    requiredSkill:{skillId:'fishing',minLevel:1}, cooldownMs:5000, staminaCost:4,
    drops:[
      {itemId:'raw_cod',       baseRate:0.35, minAmount:1, maxAmount:1},
      {itemId:'raw_salmon',    baseRate:0.30, minAmount:1, maxAmount:1},
      {itemId:'tropical_fish', baseRate:0.15, minAmount:1, maxAmount:1},
      {itemId:'pufferfish',    baseRate:0.10, minAmount:1, maxAmount:1},
      {itemId:'stone',         baseRate:0.20, minAmount:1, maxAmount:2},
      {itemId:'iron_ore',      baseRate:0.05, minAmount:1, maxAmount:1},
    ],
  },
  fishing_ore_pond: {
    id:'fishing_ore_pond', name:'釣り場（鉱石ロッド）', description:'鉱石も釣れる中級釣り場。鉱石ロッド必要。', icon:'🎣',
    requiredSkill:{skillId:'fishing',minLevel:5}, cooldownMs:5000, staminaCost:5,
    drops:[
      {itemId:'raw_cod',         baseRate:0.25, minAmount:1, maxAmount:1},
      {itemId:'raw_salmon',      baseRate:0.20, minAmount:1, maxAmount:1},
      {itemId:'tropical_fish',   baseRate:0.10, minAmount:1, maxAmount:1},
      {itemId:'iron_ore',        baseRate:0.25, minAmount:1, maxAmount:2, skillRateBonus:0.02},
      {itemId:'gold_ore',        baseRate:0.08, minAmount:1, maxAmount:1},
      {itemId:'emerald',         baseRate:0.04, minAmount:1, maxAmount:1},
      {itemId:'coal',            baseRate:0.20, minAmount:1, maxAmount:2},
    ],
  },
  fishing_ticket_pond: {
    id:'fishing_ticket_pond', name:'釣り場（チケット）', description:'釣りチケットが釣れる！オールロッドX必要。', icon:'🎣',
    requiredSkill:{skillId:'fishing',minLevel:10}, cooldownMs:5000, staminaCost:5,
    drops:[
      {itemId:'fishing_ticket',  baseRate:0.20, minAmount:1, maxAmount:2, skillRateBonus:0.01},
      {itemId:'raw_cod',         baseRate:0.20, minAmount:1, maxAmount:1},
      {itemId:'raw_salmon',      baseRate:0.15, minAmount:1, maxAmount:1},
      {itemId:'iron_ore',        baseRate:0.20, minAmount:1, maxAmount:2},
      {itemId:'gold_ore',        baseRate:0.10, minAmount:1, maxAmount:1},
      {itemId:'emerald',         baseRate:0.06, minAmount:1, maxAmount:1},
    ],
  },
  fishing_master_pond: {
    id:'fishing_master_pond', name:'釣り場（マスターロッド）', description:'Yランダムボックスが釣れる！', icon:'🎣',
    requiredSkill:{skillId:'fishing',minLevel:20}, cooldownMs:5000, staminaCost:6,
    drops:[
      {itemId:'y_random_box',    baseRate:0.08, minAmount:1, maxAmount:1},
      {itemId:'fishing_ticket',  baseRate:0.25, minAmount:1, maxAmount:3},
      {itemId:'emerald',         baseRate:0.15, minAmount:1, maxAmount:2},
      {itemId:'emerald_block',   baseRate:0.02, minAmount:1, maxAmount:1},
      {itemId:'raw_cod',         baseRate:0.15, minAmount:1, maxAmount:1},
      {itemId:'raw_salmon',      baseRate:0.10, minAmount:1, maxAmount:1},
    ],
  },
  fishing_ffgg_pond: {
    id:'fishing_ffgg_pond', name:'FFGG釣り場', description:'FF小判・鱗・牙が釣れる！FFGGロッド必要。', icon:'🎣',
    requiredSkill:{skillId:'fishing',minLevel:15}, cooldownMs:4000, staminaCost:5,
    drops:[
      {itemId:'ff_coin_small',   baseRate:0.40, minAmount:1, maxAmount:3, skillRateBonus:0.01},
      {itemId:'brilliant_salmon',baseRate:0.20, minAmount:1, maxAmount:1},
      {itemId:'hoshi_tuna',      baseRate:0.15, minAmount:1, maxAmount:1},
      {itemId:'shell_fish',      baseRate:0.12, minAmount:1, maxAmount:1},
      {itemId:'arowanna',        baseRate:0.05, minAmount:1, maxAmount:1},
      {itemId:'scale_low_1',     baseRate:0.12, minAmount:1, maxAmount:1},
      {itemId:'scale_low_2',     baseRate:0.12, minAmount:1, maxAmount:1},
      {itemId:'scale_low_3',     baseRate:0.12, minAmount:1, maxAmount:1},
      {itemId:'scale_low_4',     baseRate:0.12, minAmount:1, maxAmount:1},
      {itemId:'wolf_fang',       baseRate:0.08, minAmount:1, maxAmount:1},
      {itemId:'scale_high_1',    baseRate:0.03, minAmount:1, maxAmount:1},
      {itemId:'scale_high_2',    baseRate:0.03, minAmount:1, maxAmount:1},
      {itemId:'wolf_crystal',    baseRate:0.02, minAmount:1, maxAmount:1},
      {itemId:'caribbean_wave',  baseRate:0.01, minAmount:1, maxAmount:1},
      {itemId:'dragon_soul',     baseRate:0.02, minAmount:1, maxAmount:1},
      {itemId:'la_juice_high',   baseRate:0.005,minAmount:1, maxAmount:1},
    ],
  },
  fishing_ggr_pond: {
    id:'fishing_ggr_pond', name:'GGR釣り場', description:'クレートとお金が釣れる！FFGGRロッド必要。', icon:'🎣',
    requiredSkill:{skillId:'fishing',minLevel:30}, cooldownMs:4000, staminaCost:6,
    drops:[
      {itemId:'crate_leather',   baseRate:0.40, minAmount:1, maxAmount:1},
      {itemId:'crate_gold',      baseRate:0.20, minAmount:1, maxAmount:1},
      {itemId:'crate_diamond',   baseRate:0.08, minAmount:1, maxAmount:1},
      {itemId:'crate_enhanced',  baseRate:0.02, minAmount:1, maxAmount:1},
      {itemId:'la_juice_high',   baseRate:0.05, minAmount:1, maxAmount:1},
      {itemId:'ff_coin_large',   baseRate:0.03, minAmount:1, maxAmount:1},
    ],
  },
};

// ============================================================
// モンスターマスター
// ============================================================
export const MONSTER_MASTER: Record<string, MonsterMaster> = {
  // 初級 - 始まりの洞窟
  cave_minion:  { id:'cave_minion',  name:'洞窟王の手下', description:'俊敏に動き回る。',         icon:'👤', maxHp:20,   attack:2,   defense:1,  baseExp:8,   baseGold:3,   dungeonIds:['beginner_cave'], drops:[{itemId:'cave_fragment', baseRate:0.7, minAmount:1, maxAmount:2},{itemId:'contract', baseRate:0.1, minAmount:1, maxAmount:1}] },
  minion_end:   { id:'minion_end',   name:'手下の末路',   description:'弱いが侮れない。',           icon:'💀', maxHp:6,    attack:1,   defense:0,  baseExp:3,   baseGold:1,   dungeonIds:['beginner_cave'], drops:[{itemId:'cave_fragment', baseRate:0.5, minAmount:1, maxAmount:1}] },
  cave_right:   { id:'cave_right',   name:'洞窟王の右腕', description:'洞窟王の側近。',             icon:'⚔️', maxHp:40,   attack:8,   defense:3,  baseExp:20,  baseGold:10,  dungeonIds:['beginner_cave'], drops:[{itemId:'cave_fragment', baseRate:0.8, minAmount:1, maxAmount:3},{itemId:'contract', baseRate:0.15, minAmount:1, maxAmount:1}] },
  cave_left:    { id:'cave_left',    name:'洞窟王の左腕', description:'洞窟王の側近。',             icon:'🛡️', maxHp:40,   attack:6,   defense:5,  baseExp:20,  baseGold:10,  dungeonIds:['beginner_cave'], drops:[{itemId:'cave_fragment', baseRate:0.8, minAmount:1, maxAmount:3},{itemId:'contract', baseRate:0.15, minAmount:1, maxAmount:1}] },
  cave_king:    { id:'cave_king',    name:'洞窟王',       description:'初級ダンジョンのボス。',     icon:'👑', maxHp:100,  attack:15,  defense:8,  baseExp:80,  baseGold:50,  dungeonIds:['beginner_cave'], isBoss:true, drops:[{itemId:'cave_fragment', baseRate:1.0, minAmount:2, maxAmount:5},{itemId:'cave_gem', baseRate:0.6, minAmount:1, maxAmount:1},{itemId:'rusty_sword', baseRate:0.01, minAmount:1, maxAmount:1},{itemId:'contract', baseRate:0.3, minAmount:1, maxAmount:1}] },
  // 中級 - 要塞
  rookie_soldier: { id:'rookie_soldier', name:'下っ端戦士',  description:'最弱の戦士。',            icon:'🪖', maxHp:10,  attack:3,  defense:4,  baseExp:5,  baseGold:4,  dungeonIds:['fortress'], drops:[{itemId:'coin', baseRate:1.0, minAmount:4, maxAmount:4},{itemId:'contract', baseRate:0.1, minAmount:1, maxAmount:1}] },
  gold_soldier:   { id:'gold_soldier',   name:'成金戦士',    description:'全身金装備の戦士。',      icon:'🥇', maxHp:20,  attack:5,  defense:4,  baseExp:8,  baseGold:4,  dungeonIds:['fortress'], drops:[{itemId:'coin', baseRate:1.0, minAmount:4, maxAmount:4},{itemId:'contract', baseRate:0.1, minAmount:1, maxAmount:1}] },
  veteran_soldier:{ id:'veteran_soldier',name:'いっぱし戦士', description:'それなりに強い戦士。',   icon:'⚔️', maxHp:25,  attack:6,  defense:4,  baseExp:10, baseGold:3,  dungeonIds:['fortress','underground_fortress'], drops:[{itemId:'coin', baseRate:1.0, minAmount:3, maxAmount:3},{itemId:'contract', baseRate:0.1, minAmount:1, maxAmount:1}] },
  iron_soldier:   { id:'iron_soldier',   name:'鉄戦士',      description:'高水準な全ステータス。', icon:'🔩', maxHp:45,  attack:12, defense:4,  baseExp:20, baseGold:7,  dungeonIds:['fortress','underground_fortress'], drops:[{itemId:'coin', baseRate:1.0, minAmount:7, maxAmount:7},{itemId:'fortress_order', baseRate:1.0, minAmount:1, maxAmount:1}] },
  strong_soldier: { id:'strong_soldier', name:'強戦士',       description:'フルダイヤの危険な奴。', icon:'💎', maxHp:60,  attack:16, defense:4,  baseExp:30, baseGold:10, dungeonIds:['underground_fortress'], drops:[{itemId:'coin', baseRate:1.0, minAmount:10, maxAmount:10},{itemId:'memento', baseRate:1.0, minAmount:1, maxAmount:1},{itemId:'contract', baseRate:0.1, minAmount:1, maxAmount:1}] },
  archer:         { id:'archer',          name:'弓兵',         description:'遠距離攻撃の戦士。',     icon:'🏹', maxHp:20,  attack:3,  defense:4,  baseExp:8,  baseGold:1,  dungeonIds:['fortress'], drops:[{itemId:'coin', baseRate:1.0, minAmount:1, maxAmount:1},{itemId:'contract', baseRate:0.1, minAmount:1, maxAmount:1}] },
  crusher:        { id:'crusher',         name:'クラッシャー',  description:'衝撃波で防御貫通攻撃。', icon:'🔨', maxHp:45,  attack:12, defense:4,  baseExp:25, baseGold:7,  dungeonIds:['underground_fortress'], specialAttack:'衝撃波', drops:[{itemId:'coin', baseRate:1.0, minAmount:7, maxAmount:7},{itemId:'crusher_box', baseRate:1.0, minAmount:1, maxAmount:1}] },
  blast_archer:   { id:'blast_archer',    name:'炸裂弓兵',     description:'爆破矢で打ち上げる。',   icon:'💥', maxHp:40,  attack:3,  defense:4,  baseExp:20, baseGold:15, dungeonIds:['underground_fortress'], drops:[{itemId:'coin', baseRate:1.0, minAmount:15, maxAmount:15},{itemId:'contract', baseRate:0.15, minAmount:1, maxAmount:1}] },
  spearman:       { id:'spearman',        name:'槍兵',          description:'射程の長い槍兵。',        icon:'🗡️', maxHp:50,  attack:8,  defense:4,  baseExp:22, baseGold:7,  dungeonIds:['underground_fortress'], drops:[{itemId:'coin', baseRate:1.0, minAmount:7, maxAmount:7},{itemId:'spear_shaft', baseRate:0.5, minAmount:1, maxAmount:1},{itemId:'contract', baseRate:0.1, minAmount:1, maxAmount:1}] },
  ultimate_crusher:{id:'ultimate_crusher',name:'アルティメイトクラッシャー',description:'衝撃波が強烈。',icon:'💢', maxHp:120, attack:20, defense:8,  baseExp:60, baseGold:20, dungeonIds:['underground_fortress'], specialAttack:'強衝撃波', drops:[{itemId:'coin', baseRate:1.0, minAmount:10, maxAmount:15},{itemId:'hammer', baseRate:0.5, minAmount:1, maxAmount:1},{itemId:'contract', baseRate:0.15, minAmount:1, maxAmount:1}] },
  special_spearman:{id:'special_spearman',name:'特殊戦闘槍兵',  description:'高火力の槍投擲。',        icon:'🎯', maxHp:110, attack:18, defense:8,  baseExp:55, baseGold:15, dungeonIds:['underground_fortress'], drops:[{itemId:'coin', baseRate:1.0, minAmount:10, maxAmount:10},{itemId:'spear_shaft', baseRate:0.5, minAmount:1, maxAmount:1},{itemId:'contract', baseRate:0.1, minAmount:1, maxAmount:1}] },
  biomancer:      { id:'biomancer',       name:'バイオマンサー', description:'地下要塞のボス。手下を召喚する。', icon:'🧙', maxHp:250, attack:25, defense:12, baseExp:200, baseGold:100, dungeonIds:['underground_fortress'], isBoss:true, specialAttack:'手下召喚', drops:[{itemId:'coin', baseRate:1.0, minAmount:20, maxAmount:30},{itemId:'almighty_staff', baseRate:1.0, minAmount:1, maxAmount:1}] },
  // 上級 - 箱庭庭園
  doryu:         { id:'doryu',        name:'ドリュウ',   description:'モグラ。開幕無敵+地中突撃。',   icon:'🦔', maxHp:80,  attack:5,  defense:0,  baseExp:40,  baseGold:20,  dungeonIds:['garden'], specialAttack:'昇土竜拳', drops:[{itemId:'mole_claw', baseRate:1.0, minAmount:1, maxAmount:1}] },
  pool_ghost:    { id:'pool_ghost',   name:'池ノ亡霊',  description:'毒矢を放つ骨。弱い。',           icon:'💀', maxHp:10,  attack:3,  defense:0,  baseExp:5,   baseGold:3,   dungeonIds:['garden'], drops:[{itemId:'ancient_shard', baseRate:0.05, minAmount:1, maxAmount:1}] },
  ice_spirit:    { id:'ice_spirit',   name:'氷霊',      description:'鈍足付与の弱い敵。',             icon:'❄️', maxHp:10,  attack:3,  defense:0,  baseExp:5,   baseGold:3,   dungeonIds:['garden'], drops:[{itemId:'spirit_ice', baseRate:0.4, minAmount:1, maxAmount:1}] },
  reicho:        { id:'reicho',       name:'冷焦',      description:'上級ダンジョンのボス（2体）。',  icon:'🔥', maxHp:200, attack:20, defense:10, baseExp:150, baseGold:80,  dungeonIds:['garden'], isBoss:true, specialAttack:'炎上+鈍足付与', drops:[{itemId:'spirit_ice', baseRate:0.5, minAmount:1, maxAmount:2},{itemId:'ancient_shard', baseRate:0.2, minAmount:1, maxAmount:1}] },
  // 上級隠し - 冷焦洞穴
  extreme_cold:  { id:'extreme_cold', name:'極冷',  description:'炎系攻撃で即死。アイスビームが凶悪。', icon:'🌨️', maxHp:2180, attack:25, defense:20, baseExp:400, baseGold:200, dungeonIds:['frozen_cave'], specialAttack:'アイスビーム', drops:[{itemId:'spirit_ice', baseRate:0.5, minAmount:2, maxAmount:3},{itemId:'ancient_shard', baseRate:0.3, minAmount:1, maxAmount:2}] },
  extreme_fire:  { id:'extreme_fire', name:'極焦',  description:'氷系攻撃で即死。溶岩即死が凶悪。',   icon:'🌋', maxHp:2180, attack:25, defense:20, baseExp:400, baseGold:200, dungeonIds:['frozen_cave'], specialAttack:'ラバクロップ',   drops:[{itemId:'ancient_shard', baseRate:0.5, minAmount:2, maxAmount:3}] },
  zero_boss:     { id:'zero_boss',    name:'零',    description:'洞窟そのもの。地形攻撃武器が必要。',  icon:'⚡', maxHp:100000,attack:1, defense:99, baseExp:5000, baseGold:3000, dungeonIds:['frozen_cave'], isBoss:true, drops:[{itemId:'stalactite', baseRate:1.0, minAmount:8, maxAmount:8}] },
  // 超上級 - 天空城
  roam_armor:    { id:'roam_armor',   name:'ロウムアーマー', description:'打ち上げスキル持ち。',      icon:'🤖', maxHp:60,  attack:20, defense:10, baseExp:50,  baseGold:30,  dungeonIds:['sky_castle'], drops:[{itemId:'ancient_shard', baseRate:0.3, minAmount:1, maxAmount:2}] },
  death_armor:   { id:'death_armor',  name:'デスアーマー',  description:'斬撃を5回飛ばす。',          icon:'💀', maxHp:75,  attack:30, defense:12, baseExp:65,  baseGold:40,  dungeonIds:['sky_castle'], drops:[{itemId:'ancient_shard', baseRate:0.4, minAmount:1, maxAmount:2}] },
  mad_guy_bot:   { id:'mad_guy_bot',  name:'マッドガイボット',description:'天空城のボス。スキルが厄介。',icon:'🤖',maxHp:500, attack:10, defense:20, baseExp:600, baseGold:400, dungeonIds:['sky_castle'], isBoss:true, drops:[{itemId:'ancient_shard', baseRate:1.0, minAmount:3, maxAmount:5},{itemId:'dragon_scale', baseRate:0.1, minAmount:1, maxAmount:1}] },
  // 汎用
  slime:  { id:'slime',  name:'スライム', description:'ゼリー状の初歩的なモンスター。', icon:'🫧', maxHp:30,  attack:5,  defense:2,  baseExp:15,  baseGold:8,   dungeonIds:['beginner_cave'], drops:[{itemId:'slime_gel', baseRate:0.8, minAmount:1, maxAmount:3}] },
  goblin: { id:'goblin', name:'ゴブリン', description:'小さいが油断できない緑の怪物。', icon:'👺', maxHp:60,  attack:12, defense:5,  baseExp:35,  baseGold:20,  dungeonIds:['goblin_den'],    drops:[{itemId:'goblin_ear', baseRate:0.6, minAmount:1, maxAmount:2}] },
  dragon: { id:'dragon', name:'ドラゴン', description:'最強クラスの古代生命体。',       icon:'🐉', maxHp:1000,attack:80, defense:50, baseExp:800, baseGold:500, dungeonIds:['dragons_lair'],  isBoss:true, drops:[{itemId:'dragon_scale', baseRate:0.3, minAmount:1, maxAmount:3},{itemId:'ancient_shard', baseRate:0.8, minAmount:2, maxAmount:5}] },
};

// ============================================================
// ダンジョンマスター
// ============================================================
export const DUNGEON_MASTER: Record<string, DungeonMaster> = {
  beginner_cave: {
    id:'beginner_cave', name:'始まりの洞窟', description:'バニラ武器でも攻略できる初心者向けダンジョン。数の暴力に注意。',
    icon:'🕳️', tier:'beginner', requiredLevel:1, floors:3, expBonus:1.0, goldBonus:1.0,
    monsterIds:['slime','cave_minion','minion_end','cave_right','cave_left'],
    bossId:'cave_king',
    areas:[
      { name:'洞窟入口', monsters:[{monsterId:'cave_minion',count:3},{monsterId:'minion_end',count:5}] },
      { name:'洞窟中層', monsters:[{monsterId:'cave_right',count:1},{monsterId:'cave_left',count:1},{monsterId:'cave_minion',count:4}] },
      { name:'洞窟最深部', description:'洞窟王が待ち受ける。', monsters:[{monsterId:'cave_king',count:1,isBoss:true}], isHardArea:true },
    ],
  },
  goblin_den: {
    id:'goblin_den', name:'ゴブリンの巣窟', description:'ゴブリンが群れをなして住む危険な場所。',
    icon:'🏚️', tier:'beginner', requiredLevel:3, floors:5, expBonus:1.1, goldBonus:1.1,
    monsterIds:['goblin'],
  },
  fortress: {
    id:'fortress', name:'要塞', description:'大砲に注意。正面を走り抜けて中に入ること。クレートから硬貨が大量に出る。',
    icon:'🏰', tier:'intermediate', requiredLevel:5, floors:3, expBonus:1.2, goldBonus:1.3,
    monsterIds:['rookie_soldier','gold_soldier','veteran_soldier','iron_soldier','archer'],
    areas:[
      { name:'要塞1階', description:'大砲に当たらないよう駆け抜けよう。', monsters:[{monsterId:'rookie_soldier',count:2},{monsterId:'gold_soldier',count:1}] },
      { name:'要塞2階', monsters:[{monsterId:'veteran_soldier',count:1},{monsterId:'archer',count:8}] },
      { name:'要塞3階', description:'鉄戦士が玉座に構える。', monsters:[{monsterId:'iron_soldier',count:1},{monsterId:'gold_soldier',count:2}], isHardArea:true },
    ],
  },
  underground_fortress: {
    id:'underground_fortress', name:'地下要塞', description:'中級の隠しダンジョン。防御貫通攻撃が初登場。要塞クリア後に解放。',
    icon:'🏚️', tier:'intermediate', requiredLevel:15, floors:5, expBonus:1.5, goldBonus:1.8,
    monsterIds:['iron_soldier','crusher','blast_archer','spearman','strong_soldier','ultimate_crusher','special_spearman'],
    bossId:'biomancer',
    unlockCondition: { dungeonId:'fortress', clearedCount:3 },
    areas:[
      { name:'地下通路',     monsters:[{monsterId:'iron_soldier',count:2},{monsterId:'crusher',count:1}] },
      { name:'カーペット通路', monsters:[{monsterId:'spearman',count:2},{monsterId:'strong_soldier',count:1},{monsterId:'crusher',count:2}] },
      { name:'小広場',       description:'アルティメイトクラッシャーが守る難所。', monsters:[{monsterId:'ultimate_crusher',count:1},{monsterId:'special_spearman',count:1},{monsterId:'blast_archer',count:4}], isHardArea:true },
      { name:'食堂',         description:'敵の数が多い。落ち着いて処理しよう。', monsters:[{monsterId:'crusher',count:3},{monsterId:'strong_soldier',count:3},{monsterId:'ultimate_crusher',count:1}], isHardArea:true },
      { name:'最後の広場',   description:'バイオマンサーが待ち受ける。手下召喚に注意！', monsters:[{monsterId:'biomancer',count:1,isBoss:true}], isHardArea:true },
    ],
  },
  garden: {
    id:'garden', name:'箱庭庭園', description:'モグラのドリュウが死因の大半を占める。開幕無敵に注意。地下要塞クリア後に解放。',
    icon:'🌸', tier:'advanced', requiredLevel:20, floors:4, expBonus:2.0, goldBonus:2.0,
    monsterIds:['doryu','pool_ghost','ice_spirit'],
    bossId:'reicho',
    unlockCondition: { dungeonId:'underground_fortress', clearedCount:1 },
    areas:[
      { name:'庭園地上部', description:'ドリュウが開幕昇土竜拳を仕掛けてくる。', monsters:[{monsterId:'doryu',count:3},{monsterId:'pool_ghost',count:5}], isHardArea:true },
      { name:'庭園地下部', monsters:[{monsterId:'ice_spirit',count:6}] },
      { name:'ボスエリア', description:'冷焦が2体湧く。サバイバルモードで挑もう。', monsters:[{monsterId:'reicho',count:2,isBoss:true}], isHardArea:true },
    ],
  },
  frozen_cave: {
    id:'frozen_cave', name:'冷焦洞穴', description:'属性攻撃システムあり。炎系→極冷、氷系→極焦が有効。裏ボス「零」は洞窟そのもの。箱庭庭園クリア後に解放。',
    icon:'❄️', tier:'advanced', requiredLevel:30, floors:3, expBonus:3.0, goldBonus:2.5,
    monsterIds:['ice_spirit','extreme_cold','extreme_fire'],
    bossId:'zero_boss',
    unlockCondition: { dungeonId:'garden', clearedCount:1 },
    areas:[
      { name:'洞窟1層', monsters:[{monsterId:'ice_spirit',count:5}] },
      { name:'極の試練', description:'極冷・極焦が出現。属性攻撃が必須。', monsters:[{monsterId:'extreme_cold',count:1},{monsterId:'extreme_fire',count:1}], isHardArea:true },
      { name:'零の間',   description:'零は洞窟そのもの。地形を攻撃する武器が必要。', monsters:[{monsterId:'zero_boss',count:1,isBoss:true}], isHardArea:true },
    ],
  },
  sky_castle: {
    id:'sky_castle', name:'天空城', description:'超上級ダンジョン。敵の数は少ないが一体ずつが強い。遠距離攻撃推奨。冷焦洞穴クリア後に解放。',
    icon:'🏯', tier:'super', requiredLevel:40, floors:5, expBonus:4.0, goldBonus:3.5,
    monsterIds:['roam_armor','death_armor'],
    bossId:'mad_guy_bot',
    unlockCondition: { dungeonId:'frozen_cave', clearedCount:1 },
    areas:[
      { name:'天空城1層', monsters:[{monsterId:'roam_armor',count:3}] },
      { name:'天空城2層', monsters:[{monsterId:'death_armor',count:2},{monsterId:'roam_armor',count:2}] },
      { name:'天空城最上部', description:'マッドガイボットと決戦。近距離は危険。', monsters:[{monsterId:'mad_guy_bot',count:1,isBoss:true}], isHardArea:true },
    ],
  },
  dragons_lair: {
    id:'dragons_lair', name:'ドラゴンの塒', description:'伝説のダンジョン。最強の冒険者のみが踏み込める。天空城クリア後に解放。',
    icon:'🔥', tier:'extreme', requiredLevel:50, floors:10, expBonus:8.0, goldBonus:6.0,
    monsterIds:['dragon'],
    bossId:'dragon',
    unlockCondition: { dungeonId:'sky_castle', clearedCount:1 },
  },
};

// ============================================================
// ギャンブルマスター（還元率改善済み）
// ============================================================
export const GAMBLE_MASTER: Record<string, GambleMaster> = {
  chohan: {
    id:'chohan', name:'丁半', description:'ダイス2個の合計が偶数(丁)か奇数(半)を当てる。',
    icon:'🎲', type:'chohan', minBet:10, maxBet:50000, returnRate:0.97,
    rewardTable:[
      { label:'丁（偶数）当たり！', probability:0.4850, multiplier:2.0, symbols:['⚀⚂'] },
      { label:'半（奇数）当たり！', probability:0.4850, multiplier:2.0, symbols:['⚁⚃'] },
      { label:'ゾロ目（引き分け）',  probability:0.0300, multiplier:0.7, symbols:['⚀⚀'] },
    ],
  },
  chinchiro: {
    id:'chinchiro', name:'チンチロリン', description:'ダイス3個で役を作る。役が高いほど配当アップ。',
    icon:'🎯', type:'chinchiro', minBet:50, maxBet:100000, returnRate:0.96,
    rewardTable:[
      { label:'ピンゾロ（1-1-1）',    probability:0.005,  multiplier:10.0, symbols:['1','1','1'] },
      { label:'シゴロ（4-5-6）',       probability:0.028,  multiplier:5.0,  symbols:['4','5','6'] },
      { label:'ゾロ目',                probability:0.090,  multiplier:3.0,  symbols:['🎲','🎲','🎲'] },
      { label:'ヒフミ（1-2-3）',       probability:0.028,  multiplier:0.5,  symbols:['1','2','3'] },
      { label:'目なし',                probability:0.150,  multiplier:0.0,  symbols:['💨','💨','💨'] },
      { label:'通常（数字目）',        probability:0.699,  multiplier:1.6,  symbols:['🎲','🎲','🔢'] },
    ],
  },
  jackpot: {
    id:'jackpot', name:'ジャックポット', description:'賭け金の一部がプールに追加。超低確率で大当たり！',
    icon:'🌟', type:'jackpot', minBet:100, maxBet:100, returnRate:0.60,
    rewardTable:[
      { label:'🌟 JACKPOT!! 🌟', probability:0.003,  multiplier:0,    symbols:['🌟','🌟','🌟'] },
      { label:'はずれ',           probability:0.997,  multiplier:0,    symbols:['💨','💨','💨'] },
    ],
  },
  poker: {
    id:'poker', name:'簡易ポーカー', description:'5枚の手札を1回チェンジ。役を作って配当ゲット。',
    icon:'🃏', type:'poker', minBet:50, maxBet:50000, returnRate:0.99,
    rewardTable:[
      { label:'ロイヤルストレートフラッシュ', probability:0.00015, multiplier:250, symbols:['🃏'] },
      { label:'ストレートフラッシュ',         probability:0.00140, multiplier:50,  symbols:['🃏'] },
      { label:'フォーカード',                 probability:0.02400, multiplier:25,  symbols:['🃏'] },
      { label:'フルハウス',                   probability:0.14400, multiplier:9,   symbols:['🃏'] },
      { label:'フラッシュ',                   probability:0.19700, multiplier:6,   symbols:['🃏'] },
      { label:'ストレート',                   probability:0.11200, multiplier:4,   symbols:['🃏'] },
      { label:'スリーカード',                 probability:0.07400, multiplier:3,   symbols:['🃏'] },
      { label:'ツーペア',                     probability:0.23500, multiplier:2,   symbols:['🃏'] },
      { label:'ワンペア（JJ以上）',           probability:0.19745, multiplier:1.5, symbols:['🃏'] },
      { label:'ブタ（役なし）',               probability:0.0050,  multiplier:0,   symbols:['🃏'] },
    ],
  },
  slot_machine: {
    id:'slot_machine', name:'スロットマシン', description:'3つのシンボルが揃えばジャックポット！',
    icon:'🎰', type:'slot', minBet:10, maxBet:10000, returnRate:0.96,
    rewardTable:[
      { label:'💰💰💰 JACKPOT',   probability:0.005, multiplier:50,  symbols:['💰','💰','💰'] },
      { label:'⭐⭐⭐ BIG WIN',   probability:0.025, multiplier:10,  symbols:['⭐','⭐','⭐'] },
      { label:'🍒🍒🍒 MIDDLE',   probability:0.060, multiplier:5,   symbols:['🍒','🍒','🍒'] },
      { label:'🍋🍋🍋 SMALL',    probability:0.110, multiplier:2.5, symbols:['🍋','🍋','🍋'] },
      { label:'🍒🍒 2枚揃い',    probability:0.280, multiplier:1.3, symbols:['🍒','🍒','🔔'] },
      { label:'ハズレ',           probability:0.520, multiplier:0,   symbols:['💨','💨','💨'] },
    ],
  },
  treasure_box: {
    id:'treasure_box', name:'宝箱くじ', description:'宝箱を開けてみよう。何が出るかはお楽しみ。',
    icon:'📦', type:'treasure_box', minBet:100, maxBet:100, returnRate:0.92,
    rewardTable:[
      { label:'レジェンダリー大当たり！', probability:0.01,  multiplier:0,   itemRewards:[{itemId:'dragon_scale',  amount:1}],                                    symbols:['🐉'] },
      { label:'エピックアイテム',          probability:0.05,  multiplier:0,   itemRewards:[{itemId:'ancient_shard', amount:3}],                                    symbols:['💎'] },
      { label:'ゴールド大量',              probability:0.12,  multiplier:6,   symbols:['💰'] },
      { label:'回復セット',                probability:0.15,  multiplier:0,   itemRewards:[{itemId:'mega_potion', amount:2},{itemId:'roast_meat', amount:3}],       symbols:['🧪'] },
      { label:'少しゴールド',              probability:0.35,  multiplier:2.0, symbols:['🪙'] },
      { label:'ハズレ（空の宝箱）',        probability:0.22,  multiplier:0,   symbols:['📭'] },
    ],
  },
  coin_flip: {
    id:'coin_flip', name:'コインフリップ', description:'表か裏か。シンプルな50/50ギャンブル。',
    icon:'🪙', type:'coin_flip', minBet:10, maxBet:50000, returnRate:0.98,
    rewardTable:[
      { label:'表（当たり）', probability:0.49, multiplier:2, symbols:['✨'] },
      { label:'裏（ハズレ）', probability:0.51, multiplier:0, symbols:['💨'] },
    ],
  },
};

// ============================================================
// 釣りシステム定数
// ============================================================
export const FISHING_RODS: Record<string, {
  id: string;
  name: string;
  requiredFishingLv: number;
  unlocksNode: string;
  description: string;
}> = {
  basic_rod:    { id:'basic_rod',    name:'基本の釣り竿',     requiredFishingLv:1,  unlocksNode:'fishing_pond',         description:'最初から使える竿。バニラの魚が釣れる。' },
  ore_rod:      { id:'ore_rod',      name:'鉱石ロッド',       requiredFishingLv:5,  unlocksNode:'fishing_ore_pond',     description:'鉱石も釣れる中級竿。謎の箱から入手。' },
  all_rod_x:    { id:'all_rod_x',    name:'オールロッドX',    requiredFishingLv:10, unlocksNode:'fishing_ticket_pond',  description:'釣りチケットが釣れる重要な竿。' },
  master_rod:   { id:'master_rod',   name:'マスターロッド',   requiredFishingLv:20, unlocksNode:'fishing_master_pond',  description:'Yランダムボックスが釣れる高性能竿。' },
  ffgg_rod_r6:  { id:'ffgg_rod_r6',  name:'FFGGロッドRank6',  requiredFishingLv:15, unlocksNode:'fishing_ffgg_pond',    description:'FFGG専用。鱗・牙・小判が大量に釣れる。' },
  ffggr_rod:    { id:'ffggr_rod',    name:'FFGGRロッド',      requiredFishingLv:30, unlocksNode:'fishing_ggr_pond',     description:'GGR専用。クレートとお金が釣れる。' },
};

// ============================================================
// コマンドシステム
// ============================================================
export const COMMANDS: Record<string, {
  id: string;
  name: string;
  description: string;
  effect: string;
  category: 'job' | 'display' | 'protect' | 'economy' | 'travel';
}> = {
  jobs_mining:  { id:'jobs_mining',  name:'/jobs join miner',   description:'採掘職業に就く。採掘でお金が入る。',        effect:'mining_income',   category:'job' },
  jobs_fisher:  { id:'jobs_fisher',  name:'/jobs join fisher',  description:'釣り師職業に就く。釣りでお金が入る。',      effect:'fishing_income',  category:'job' },
  jobs_woodcut: { id:'jobs_woodcut', name:'/jobs join woodcut', description:'木こり職業に就く。伐採でお金が入る。',      effect:'woodcut_income',  category:'job' },
  mls:          { id:'mls',         name:'/mls',               description:'アイテム獲得ログの表示/非表示を切替。',     effect:'toggle_log',      category:'display' },
  dropnotify:   { id:'dropnotify',  name:'/dropnotify',        description:'ドロップ通知の表示/非表示を切替。',         effect:'toggle_dropnotify',category:'display' },
  dropprotect:  { id:'dropprotect', name:'/dropprotect',       description:'レア度別にドロップ可/不可を設定。',         effect:'toggle_protect',  category:'protect' },
  gomiprotect:  { id:'gomiprotect', name:'/gomiprotect',       description:'アイテムを捨てられないよう設定。',          effect:'toggle_gomi',     category:'protect' },
  fly:          { id:'fly',         name:'/fly',               description:'有料で一定時間クリエイト飛行が可能。',      effect:'enable_fly',      category:'travel' },
  speedfly:     { id:'speedfly',    name:'/speedfly',          description:'flyより速い移動手段。有料。',               effect:'enable_speedfly', category:'travel' },
  ott:          { id:'ott',         name:'/ott',               description:'オンタイムポイントをOTTに変換。',           effect:'convert_ott',     category:'economy' },
  sb_shop:      { id:'sb_shop',     name:'/sb shop',           description:'ストレージボックスを購入するショップ。',    effect:'open_sb_shop',    category:'economy' },
};

// ============================================================
// ゲームバランス定数
// ============================================================
export const EXP_TABLE: number[] = (() => {
  const t = [0];
  for (let lv = 1; lv <= 200; lv++) t.push(Math.floor(Math.pow(lv, 1.8) * 50));
  return t;
})();

export const SKILL_EXP_TABLE: number[] = (() => {
  const t = [0];
  for (let lv = 1; lv <= 100; lv++) t.push(Math.floor(Math.pow(lv, 1.5) * 30));
  return t;
})();

export const DEFAULT_PLAYER_STATS = {
  level:1, exp:0, expToNextLevel:0,
  hp:100, maxHp:100, satiety:100, maxSatiety:100,
  attack:10, defense:5,
};
