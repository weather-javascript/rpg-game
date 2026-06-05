// src/data/masters.ts

import type {
  ItemMaster, SkillMaster, GatherNodeMaster,
  MonsterMaster, DungeonMaster, GambleMaster, CraftRecipe,
} from '../types/game';

// ============================================================
// アイテムマスター
// ============================================================
export const ITEM_MASTER: Record<string, ItemMaster> = {
  wood:        { id:'wood',        name:'木材',      description:'伐採で手に入る基本素材。',    category:'material',  rarity:'common',    sellPrice:5,    buyPrice:0,    maxStack:-1,  icon:'log' },
  stone:       { id:'stone',       name:'石',        description:'採掘で手に入る基本素材。',    category:'material',  rarity:'common',    sellPrice:4,    buyPrice:0,    maxStack:-1,  icon:'rock' },
  iron_ore:    { id:'iron_ore',    name:'鉄鉱石',    description:'採掘で手に入る鉱石。',        category:'material',  rarity:'uncommon',  sellPrice:25,   buyPrice:0,    maxStack:-1,  icon:'ore_black' },
  coal:        { id:'coal',        name:'石炭',      description:'鉱山で採れる燃料素材。',      category:'material',  rarity:'common',    sellPrice:10,   buyPrice:0,    maxStack:-1,  icon:'coal' },
  gold_ore:    { id:'gold_ore',    name:'金鉱石',    description:'希少な鉱石。高値で売れる。',  category:'material',  rarity:'rare',      sellPrice:120,  buyPrice:0,    maxStack:-1,  icon:'sparkle' },
  emerald:     { id:'emerald',     name:'エメラルド', description:'美しい緑の宝石。',           category:'material',  rarity:'rare',      sellPrice:200,  buyPrice:0,    maxStack:-1,  icon:'emerald' },
  emerald_block:{ id:'emerald_block', name:'エメラルドブロック', description:'エメラルドの塊。', category:'material',  rarity:'epic',      sellPrice:1800, buyPrice:0,    maxStack:99,  icon:'ore_green' },
  ancient_shard:{ id:'ancient_shard', name:'古代の欠片', description:'ダンジョンの深部に眠る謎の素材。', category:'material', rarity:'epic', sellPrice:45000, buyPrice:0, maxStack:99, icon:'gem' },
  iron_ingot:  { id:'iron_ingot',  name:'鉄塊',      description:'精錬された鉄。各種製造に必要。', category:'material', rarity:'uncommon', sellPrice:40, buyPrice:0, maxStack:-1, icon:'iron_ingot' },
  plank:       { id:'plank',       name:'板材',      description:'木材を加工した板。製作に使用。', category:'material', rarity:'common',   sellPrice:8,  buyPrice:0, maxStack:-1, icon:'log' },
  iron_sword:  { id:'iron_sword',  name:'鉄の剣',    description:'鉄塊から作れる武器。攻撃力+5。', category:'weapon',   rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:1, icon:'swords', attackBonus:5 },
  iron_helmet: { id:'iron_helmet', name:'鉄のヘルメット', description:'鉄塊から作れる防具。防御力+3。', category:'armor', rarity:'uncommon', sellPrice:60, buyPrice:0, maxStack:1, icon:'helmet', defenseBonus:3 },
  wooden_bow:  { id:'wooden_bow',  name:'木の弓',    description:'木材から作れる武器。攻撃力+3。', category:'weapon',   rarity:'common',   sellPrice:40, buyPrice:0, maxStack:1, icon:'bow_arrow', attackBonus:3 },
  stone_knife: { id:'stone_knife', name:'石のナイフ', description:'石から作れる武器。攻撃力+2。', category:'weapon',   rarity:'common',   sellPrice:25, buyPrice:0, maxStack:1, icon:'dagger', attackBonus:2 },
  // モンスタードロップ
  cave_fragment:   { id:'cave_fragment',    name:'洞窟の欠片',    description:'洞窟王の手下が落とす欠片。', category:'material', rarity:'common',   sellPrice:8,   buyPrice:0, maxStack:-1, icon:'stone_idol' },
  cave_gem:        { id:'cave_gem',         name:'洞窟王の宝石',  description:'洞窟王が落とす輝く宝石。',  category:'material', rarity:'rare',     sellPrice:200, buyPrice:0, maxStack:99, icon:'gem_blue' },
  rusty_sword:     { id:'rusty_sword',      name:'錆びた剣',      description:'洞窟王が落とす古い剣。',    category:'weapon',   rarity:'uncommon', sellPrice:50,  buyPrice:0, maxStack:1,  icon:'dagger', attackBonus:3 },
  contract:        { id:'contract',         name:'契約書',        description:'各ダンジョンのモブが低確率で落とす。', category:'treasure', rarity:'uncommon', sellPrice:30, buyPrice:0, maxStack:-1, icon:'scroll' },
  coin:            { id:'coin',             name:'硬貨',          description:'中級ダンジョンの通貨。',    category:'material', rarity:'common',   sellPrice:1,   buyPrice:0, maxStack:-1, icon:'coin' },
  fortress_order:  { id:'fortress_order',   name:'要塞防衛出兵状',description:'鉄戦士が落とす出兵命令書。', category:'material', rarity:'uncommon', sellPrice:20, buyPrice:0, maxStack:-1, icon:'clipboard' },
  crusher_box:     { id:'crusher_box',      name:'破壊人の道具箱',description:'クラッシャーが落とす道具箱。', category:'material', rarity:'uncommon', sellPrice:25, buyPrice:0, maxStack:-1, icon:'toolbox' },
  memento:         { id:'memento',          name:'形見の写真',    description:'強戦士が落とす写真。',      category:'material', rarity:'rare',     sellPrice:60,  buyPrice:0, maxStack:99, icon:'photo_frame' },
  hammer:          { id:'hammer',           name:'ハンマー',      description:'アルティメイトクラッシャーが落とす。', category:'weapon', rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:1, icon:'hammer', attackBonus:7 },
  spear_shaft:     { id:'spear_shaft',      name:'槍の柄',        description:'特殊戦闘槍兵が落とす槍の柄。', category:'material', rarity:'uncommon', sellPrice:35, buyPrice:0, maxStack:-1, icon:'wand' },
  almighty_staff:  { id:'almighty_staff',   name:'万能杖',        description:'バイオマンサーが確定ドロップ。', category:'weapon', rarity:'rare',     sellPrice:300, buyPrice:0, maxStack:1, icon:'wand', attackBonus:12 },
  mole_claw:       { id:'mole_claw',        name:'モグラの爪',    description:'ドリュウが落とす硬い爪。', category:'material', rarity:'uncommon', sellPrice:40, buyPrice:0, maxStack:-1, icon:'badger' },
  spirit_ice:      { id:'spirit_ice',       name:'霊氷',          description:'氷霊が落とす素材。',       category:'material', rarity:'rare',     sellPrice:80, buyPrice:0, maxStack:99, icon:'ice' },
  stalactite:      { id:'stalactite',       name:'鍾乳石',        description:'零が確定ドロップ。一度に8個落とす。', category:'material', rarity:'epic', sellPrice:150, buyPrice:0, maxStack:-1, icon:'stalactite' },
  slime_gel:       { id:'slime_gel',        name:'スライムゼリー',description:'スライムが落とす粘液。',  category:'material', rarity:'common',   sellPrice:8,   buyPrice:0, maxStack:-1, icon:'bubbles' },
  goblin_ear:      { id:'goblin_ear',       name:'ゴブリンの耳', description:'ゴブリンの証。',           category:'material', rarity:'uncommon', sellPrice:30,  buyPrice:0, maxStack:-1, icon:'ear' },
  dragon_scale:    { id:'dragon_scale',     name:'ドラゴンの鱗', description:'非常に希少な最高素材。',   category:'material', rarity:'legendary',sellPrice:250000,buyPrice:0, maxStack:10, icon:'dragon' },
  // 火山ドロップ
  magma_stone:     { id:'magma_stone',      name:'マグマストーン', description:'火山内部に存在する岩石。製作の素材。', category:'material', rarity:'uncommon', sellPrice:35, buyPrice:0, maxStack:-1, icon:'rock' },
  dwarf_fragment:  { id:'dwarf_fragment',   name:'ドワーフの欠片', description:'ドワーフ系統が落とす欠片。', category:'material', rarity:'common',   sellPrice:15, buyPrice:0, maxStack:-1, icon:'pickaxe_hammer' },
  hard_magic_stone:{ id:'hard_magic_stone', name:'硬魔石',        description:'黒ドワーフ等が落とす硬い魔石。', category:'material', rarity:'rare',   sellPrice:200,buyPrice:0, maxStack:99, icon:'magic_stone_purple' },
  magic_stone:     { id:'magic_stone',      name:'魔導石',        description:'赤ドワーフが落とす魔石。', category:'material', rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:99, icon:'magic_stone_blue' },
  volcano_crown:   { id:'volcano_crown',    name:'獄炎帝の王冠', description:'獄炎帝が落とす伝説の王冠。', category:'treasure', rarity:'legendary',sellPrice:10000,buyPrice:0, maxStack:1, icon:'crown' },
  extreme_flame_aura:{ id:'extreme_flame_aura', name:'極炎のオーラ', description:'獄炎帝を倒すと入手。', category:'material', rarity:'legendary', sellPrice:5000, buyPrice:0, maxStack:1, icon:'flame' },
  // 道具
  iron_pickaxe:    { id:'iron_pickaxe',     name:'鉄のツルハシ',  description:'採掘効率が上がる。鉄鉱脈から材料を多く取れる。', category:'tool', rarity:'uncommon', sellPrice:50, buyPrice:200, maxStack:1, icon:'pickaxe' },
  iron_axe:        { id:'iron_axe',         name:'鉄の斧',        description:'伐採効率が上がる。木材を多く取れる。',           category:'tool', rarity:'uncommon', sellPrice:50, buyPrice:200, maxStack:1, icon:'axe' },
  // 釣り竿
  basic_rod:      { id:'basic_rod',     name:'基本の釣り竿',   description:'最初からある釣り竿。',  category:'tool', rarity:'common',    sellPrice:10,   buyPrice:50,   maxStack:1, icon:'fishing_rod' },
  ore_rod:        { id:'ore_rod',       name:'鉱石ロッド',     description:'謎の箱から出る釣り竿。', category:'tool', rarity:'uncommon',  sellPrice:100,  buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  all_rod_x:      { id:'all_rod_x',     name:'オールロッドX',  description:'釣りチケットが釣れる。', category:'tool', rarity:'rare',      sellPrice:500,  buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  master_rod:     { id:'master_rod',    name:'マスターロッド', description:'Yランダムボックスが釣れる。', category:'tool', rarity:'epic',   sellPrice:2000, buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  master_rod_z:   { id:'master_rod_z',  name:'マスターロッドZ', description:'資源釣り最上位の竿。', category:'tool', rarity:'epic',      sellPrice:5000, buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  ffgg_rod_r1:    { id:'ffgg_rod_r1',   name:'FFGGロッドRank1', description:'FFGG専用釣り竿。',     category:'tool', rarity:'rare',      sellPrice:300,  buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  ffgg_rod_r3:    { id:'ffgg_rod_r3',   name:'FFGGロッドRank3', description:'投票チケット+OTT64枚で入手。', category:'tool', rarity:'rare', sellPrice:800, buyPrice:0,   maxStack:1, icon:'fishing_rod' },
  ffgg_rod_r6:    { id:'ffgg_rod_r6',   name:'FFGGロッドRank6', description:'FFGG釣り最強。',        category:'tool', rarity:'epic',      sellPrice:5000, buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  ffggr_rod:      { id:'ffggr_rod',     name:'FFGGRロッド',     description:'GGR釣り専用。',         category:'tool', rarity:'legendary', sellPrice:8000, buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  // 魚
  raw_cod:      { id:'raw_cod',     name:'生鱈',     description:'バニラの魚。', category:'food', rarity:'common',   sellPrice:8,   buyPrice:0, maxStack:-1, icon:'fish', useEffect:{satietyRestore:15,message:'生鱈を食べた。'} },
  raw_salmon:   { id:'raw_salmon',  name:'生鮭',     description:'バニラの魚。', category:'food', rarity:'common',   sellPrice:10,  buyPrice:0, maxStack:-1, icon:'tropical_fish', useEffect:{satietyRestore:15,message:'生鮭を食べた。'} },
  pufferfish:   { id:'pufferfish',  name:'フグ',     description:'毒がある。',   category:'food', rarity:'uncommon', sellPrice:5,   buyPrice:0, maxStack:-1, icon:'pufferfish', useEffect:{satietyRestore:5,hpRestore:-20,message:'フグを食べた！毒でHPが減った！'} },
  tropical_fish:{ id:'tropical_fish',name:'熱帯魚',  description:'バニラの魚。', category:'food', rarity:'uncommon', sellPrice:12,  buyPrice:0, maxStack:-1, icon:'tropical_fish', useEffect:{satietyRestore:12,message:'熱帯魚を食べた。'} },
  brilliant_salmon:{ id:'brilliant_salmon', name:'ブリリアントキングサーモン', description:'FFGGエリア産。', category:'food', rarity:'rare', sellPrice:80, buyPrice:0, maxStack:99, icon:'fish', useEffect:{satietyRestore:50,hpRestore:30,message:'ブリリアントキングサーモンを食べた！'} },
  hoshi_tuna:  { id:'hoshi_tuna',  name:'ホシネツナ',      description:'FFGGエリア産。', category:'food', rarity:'rare', sellPrice:90, buyPrice:0, maxStack:99, icon:'tropical_fish', useEffect:{satietyRestore:50,hpRestore:25,message:'ホシネツナを食べた！'} },
  shell_fish:  { id:'shell_fish',  name:'オオグロリクサザエ', description:'FFGGエリア産の貝。', category:'food', rarity:'rare', sellPrice:70, buyPrice:0, maxStack:99, icon:'shell', useEffect:{satietyRestore:40,hpRestore:20,message:'サザエを食べた！'} },
  arowanna:    { id:'arowanna',    name:'シンリンアロワナ', description:'FFGGエリア産。', category:'food', rarity:'epic', sellPrice:150, buyPrice:0, maxStack:99, icon:'pufferfish', useEffect:{satietyRestore:60,hpRestore:40,message:'アロワナを食べた！'} },
  // 釣り系
  fishing_ticket:  { id:'fishing_ticket',   name:'釣りチケット',   description:'不死のトーテムに交換できる。', category:'treasure', rarity:'uncommon', sellPrice:50, buyPrice:0, maxStack:-1, icon:'ticket' },
  fishing_ticket_p:{ id:'fishing_ticket_p', name:'釣りチケットプラス', description:'魚や釣りチケットを換算したもの。', category:'treasure', rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:-1, icon:'ticket_striped' },
  totem:           { id:'totem',            name:'不死のトーテム',  description:'Yリアクターの素材。',          category:'treasure', rarity:'rare',     sellPrice:200, buyPrice:0, maxStack:99, icon:'totem' },
  y_random_box:    { id:'y_random_box',     name:'Yランダムボックス', description:'中身はランダム。',            category:'treasure', rarity:'rare',     sellPrice:300, buyPrice:0, maxStack:99, icon:'box' },
  y_reactor:       { id:'y_reactor',        name:'Yリアクター',     description:'釣りの最重要アイテム。',       category:'material', rarity:'epic',     sellPrice:1000,buyPrice:0, maxStack:99, icon:'lightning' },
  z_reactor:       { id:'z_reactor',        name:'Zリアクター',     description:'通常釣りの最終目標。',         category:'material', rarity:'legendary',sellPrice:5000,buyPrice:0, maxStack:99, icon:'battery' },
  nether_proof:    { id:'nether_proof',     name:'ネザー解放の証',  description:'Zリアクターの素材。',          category:'material', rarity:'rare',     sellPrice:500, buyPrice:0, maxStack:99, icon:'volcano' },
  ff_coin_small:   { id:'ff_coin_small',    name:'FF小判',         description:'大判に交換してお金に。',        category:'treasure', rarity:'uncommon', sellPrice:100, buyPrice:0, maxStack:-1, icon:'yen' },
  ff_coin_large:   { id:'ff_coin_large',    name:'FF大判',         description:'高額で売れる。',               category:'treasure', rarity:'rare',     sellPrice:500000,buyPrice:0,maxStack:99, icon:'dollar' },
  scale_low_1:     { id:'scale_low_1',     name:'下位鱗（炎）',   description:'FFGGエリアの下位鱗。', category:'material', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'ore_red' },
  scale_low_2:     { id:'scale_low_2',     name:'下位鱗（水）',   description:'FFGGエリアの下位鱗。', category:'material', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'ore_blue' },
  scale_low_3:     { id:'scale_low_3',     name:'下位鱗（風）',   description:'FFGGエリアの下位鱗。', category:'material', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'ore_green' },
  scale_low_4:     { id:'scale_low_4',     name:'下位鱗（土）',   description:'FFGGエリアの下位鱗。', category:'material', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'ore_brown' },
  scale_high_1:    { id:'scale_high_1',    name:'上位鱗（炎）',   description:'Rank4以上で入手。',    category:'material', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'flame' },
  scale_high_2:    { id:'scale_high_2',    name:'上位鱗（水）',   description:'Rank4以上で入手。',    category:'material', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'droplet' },
  scale_high_3:    { id:'scale_high_3',    name:'上位鱗（風）',   description:'Rank4以上で入手。',    category:'material', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'vortex' },
  scale_high_4:    { id:'scale_high_4',    name:'上位鱗（土）',   description:'Rank4以上で入手。',    category:'material', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'mountain' },
  wolf_fang:       { id:'wolf_fang',       name:'ハーブウルフの牙', description:'FFGGで釣れる牙。',  category:'material', rarity:'uncommon', sellPrice:300,  buyPrice:0, maxStack:99, icon:'tooth' },
  wolf_crystal:    { id:'wolf_crystal',    name:'狼牙魔結晶',     description:'上位鱗の交換素材。',  category:'material', rarity:'rare',     sellPrice:1500, buyPrice:0, maxStack:99, icon:'crystal_ball' },
  caribbean_wave:  { id:'caribbean_wave',  name:'カリブの荒波',   description:'フィーバー中のみ。',   category:'material', rarity:'rare',     sellPrice:800,  buyPrice:0, maxStack:99, icon:'wave' },
  la_juice_normal: { id:'la_juice_normal', name:'ラジュース',      description:'幸運バフ。釣り・採掘効率+30%。', category:'potion', rarity:'rare', sellPrice:500, buyPrice:0, maxStack:99, icon:'potion_mate', useEffect:{hpRestore:20,satietyRestore:20,message:'ラジュースを飲んだ！幸運バフが付いた！'} },
  la_juice_high:   { id:'la_juice_high',   name:'上位ラジュース',  description:'強力な幸運バフ。釣り・採掘効率+60%。', category:'potion', rarity:'epic', sellPrice:2000, buyPrice:0, maxStack:99, icon:'drink', useEffect:{hpRestore:50,satietyRestore:50,message:'上位ラジュースを飲んだ！'} },
  crate_leather:   { id:'crate_leather',   name:'革クレート',     description:'GGR釣りで入手。',  category:'treasure', rarity:'common',   sellPrice:50,  buyPrice:0, maxStack:99, icon:'mailbox_closed' },
  crate_gold:      { id:'crate_gold',      name:'金クレート',     description:'GGR釣りで入手。',  category:'treasure', rarity:'uncommon', sellPrice:200, buyPrice:0, maxStack:99, icon:'mailbox_open' },
  crate_diamond:   { id:'crate_diamond',   name:'ダイヤクレート', description:'GGR釣りで入手。',  category:'treasure', rarity:'rare',     sellPrice:800, buyPrice:0, maxStack:99, icon:'mailbox_empty' },
  crate_enhanced:  { id:'crate_enhanced',  name:'強化ダイヤクレート', description:'豪華報酬確定。', category:'treasure', rarity:'epic',    sellPrice:3000,buyPrice:0, maxStack:99, icon:'postbox' },
  polishing_agent_1: { id:'polishing_agent_1', name:'研磨剤Ⅰ',  description:'資源ピッケルの強化素材。', category:'material', rarity:'common',   sellPrice:10, buyPrice:30,  maxStack:-1, icon:'rock' },
  polishing_agent_5: { id:'polishing_agent_5', name:'研磨剤Ⅴ',  description:'研磨剤の中級品。',         category:'material', rarity:'uncommon', sellPrice:50, buyPrice:150, maxStack:-1, icon:'gem' },
  resource_pickaxe:  { id:'resource_pickaxe',  name:'資源ピッケル', description:'採掘効率大幅アップ。',    category:'tool',     rarity:'rare',     sellPrice:500,buyPrice:0,   maxStack:1,  icon:'pickaxe' },
  storage_box:       { id:'storage_box',       name:'ストレージボックス', description:'大量収納。',         category:'tool',     rarity:'uncommon', sellPrice:100,buyPrice:300, maxStack:99, icon:'box' },
  vote_ticket:       { id:'vote_ticket',       name:'投票チケット', description:'FFGGロッドの交換に使用。', category:'treasure', rarity:'uncommon', sellPrice:200,buyPrice:0,   maxStack:99, icon:'ballot_box' },
  ontime_ticket:     { id:'ontime_ticket',     name:'OTT(オンタイムチケット)', description:'各種交換に使用。', category:'treasure', rarity:'uncommon', sellPrice:150,buyPrice:0, maxStack:-1, icon:'clock' },
  mystery_key:       { id:'mystery_key',       name:'謎の鍵',    description:'ミステリーBOX開封に必要。', category:'tool', rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:99, icon:'old_key' },
  mystery_box_ore:   { id:'mystery_box_ore',   name:'謎のミステリーBOX', description:'カスタムチケットが出る。', category:'treasure', rarity:'rare', sellPrice:0, buyPrice:0, maxStack:99, icon:'box' },
  resource_ticket:   { id:'resource_ticket',   name:'資源チケット', description:'資源ピッケルで採掘時に入手。', category:'treasure', rarity:'common', sellPrice:30, buyPrice:0, maxStack:-1, icon:'clipboard' },
  ocean_heart:       { id:'ocean_heart',       name:'海洋の心',  description:'TF防具の作成素材。',          category:'material', rarity:'legendary',sellPrice:5000,buyPrice:0, maxStack:10, icon:'magic_stone_blue' },
  dragon_soul:       { id:'dragon_soul',       name:'ドラゴンソール', description:'FFGGで釣れる。',          category:'material', rarity:'epic',     sellPrice:1000,buyPrice:0, maxStack:-1, icon:'dragon_head' },
  // 消耗品
  health_potion:     { id:'health_potion',     name:'回復薬',     description:'HPを50回復する。',         category:'potion', rarity:'common',   sellPrice:20, buyPrice:60,   maxStack:99, icon:'flask', useEffect:{hpRestore:50,message:'回復薬を飲んでHPが50回復した！'} },
  mega_potion:       { id:'mega_potion',       name:'メガポーション', description:'HPを150回復する。',    category:'potion', rarity:'uncommon', sellPrice:60, buyPrice:180,  maxStack:99, icon:'pill', useEffect:{hpRestore:150,message:'メガポーションを飲んでHPが150回復した！'} },
  food_ration:       { id:'food_ration',       name:'携帯食料',   description:'満腹度を30回復する。',     category:'food',   rarity:'common',   sellPrice:5,  buyPrice:20,   maxStack:99, icon:'meat', useEffect:{satietyRestore:30,message:'食料を食べて満腹度が30回復した！'} },
  roast_meat:        { id:'roast_meat',        name:'焼き肉',     description:'満腹度60・HP20回復。',     category:'food',   rarity:'uncommon', sellPrice:15, buyPrice:50,   maxStack:99, icon:'raw_meat', useEffect:{satietyRestore:60,hpRestore:20,message:'焼き肉を食べてスタミナ全開！'} },
  elixir:            { id:'elixir',            name:'エリクサー', description:'HP・満腹度を全回復する。', category:'potion', rarity:'epic',     sellPrice:500,buyPrice:2000, maxStack:10, icon:'sparkle', useEffect:{hpRestore:9999,satietyRestore:9999,message:'エリクサーを使い完全回復した！'} },
  emergency_ration:  { id:'emergency_ration',  name:'緊急食料パック', description:'HP・満腹度を50回復する。', category:'food', rarity:'uncommon', sellPrice:0, buyPrice:0, maxStack:5, icon:'sos', useEffect:{hpRestore:50,satietyRestore:50,message:'緊急食料パックを使用した！'} },
  mystery_box:       { id:'mystery_box',       name:'謎の宝箱',  description:'中身は分からない。',        category:'treasure', rarity:'rare',   sellPrice:0, buyPrice:500, maxStack:99, icon:'box' },
  // ============================================================
  // 眠る素材（カスタム採掘素材）
  // ============================================================
  iron_meteorite:    { id:'iron_meteorite',    name:'鉄隕石の欠片',  description:'Y14〜63の通常資源。約4stに1個出現。', category:'material', rarity:'uncommon', sellPrice:80,   buyPrice:0, maxStack:-1, icon:'comet' },
  adamantite:        { id:'adamantite',        name:'アダマンタイト', description:'Y8以下の通常資源。約18stに1個出現。', category:'material', rarity:'rare',     sellPrice:300,  buyPrice:0, maxStack:-1, icon:'diamond_blue' },
  comet_shard:       { id:'comet_shard',       name:'彗星の欠片',    description:'Y50以上の通常資源。約8stに1個出現。', category:'material', rarity:'uncommon', sellPrice:120,  buyPrice:0, maxStack:-1, icon:'star_spin' },
  dragon_bone:       { id:'dragon_bone',       name:'竜の骨',        description:'Y15以上の通常資源。約4stに1個出現。', category:'material', rarity:'rare',     sellPrice:250,  buyPrice:0, maxStack:-1, icon:'bone' },
  super_alloy_maple: { id:'super_alloy_maple', name:'超合金メイプル', description:'Y8のみの通常資源。約36stに1個出現。', category:'material', rarity:'epic',     sellPrice:1200, buyPrice:0, maxStack:99, icon:'maple_leaf' },
  soul_flame:        { id:'soul_flame',        name:'魂の炎',        description:'ネザー全域の資源。約18stに1個出現。', category:'material', rarity:'rare',     sellPrice:400,  buyPrice:0, maxStack:99, icon:'flame' },
  blood_chain:       { id:'blood_chain',       name:'血の鎖',        description:'ネザーY45以下の資源。約18stに1個出現。', category:'material', rarity:'rare',   sellPrice:450,  buyPrice:0, maxStack:99, icon:'chain' },
  rutile_platinum:   { id:'rutile_platinum',   name:'ルチルプラチナ', description:'エンド全域の資源。約18stに1個出現。',  category:'material', rarity:'epic',   sellPrice:900,  buyPrice:0, maxStack:99, icon:'galaxy' },
  // ============================================================
  // マイクラ準拠：原木の種類
  // ============================================================
  oak_log:      { id:'oak_log',      name:'オーク原木',     description:'平原・森林バイオームの木。', category:'material', rarity:'common', sellPrice:6,  buyPrice:0, maxStack:-1, icon:'log' },
  spruce_log:   { id:'spruce_log',   name:'トウヒ原木',     description:'タイガバイオームの木。',     category:'material', rarity:'common', sellPrice:6,  buyPrice:0, maxStack:-1, icon:'pine_tree' },
  birch_log:    { id:'birch_log',    name:'シラカバ原木',   description:'森林バイオームの白い木。',   category:'material', rarity:'common', sellPrice:7,  buyPrice:0, maxStack:-1, icon:'oak_tree' },
  jungle_log:   { id:'jungle_log',   name:'ジャングル原木', description:'ジャングルバイオームの木。', category:'material', rarity:'uncommon', sellPrice:10, buyPrice:0, maxStack:-1, icon:'palm_tree' },
  acacia_log:   { id:'acacia_log',   name:'アカシア原木',   description:'サバンナバイオームの木。',   category:'material', rarity:'common', sellPrice:7,  buyPrice:0, maxStack:-1, icon:'leaf' },
  dark_oak_log: { id:'dark_oak_log', name:'ダークオーク原木','description':'巨大ツリーバイオームの木。',category:'material', rarity:'uncommon', sellPrice:9, buyPrice:0, maxStack:-1, icon:'log' },
  mangrove_log: { id:'mangrove_log', name:'マングローブ原木','description':'マングローブ湿地の木。',  category:'material', rarity:'uncommon', sellPrice:10, buyPrice:0, maxStack:-1, icon:'leaf' },
  cherry_log:   { id:'cherry_log',   name:'サクラ原木',     description:'サクラバイオームのピンクの木。', category:'material', rarity:'uncommon', sellPrice:12, buyPrice:0, maxStack:-1, icon:'cherry_blossom' },
  bamboo:       { id:'bamboo',       name:'竹',             description:'ジャングル・竹林で採れる。', category:'material', rarity:'common', sellPrice:3,  buyPrice:0, maxStack:-1, icon:'bamboo' },
  // ============================================================
  // マイクラ準拠：石・岩盤系
  // ============================================================
  cobblestone:    { id:'cobblestone',    name:'丸石',         description:'石を採掘すると取れる基本素材。', category:'material', rarity:'common', sellPrice:2,  buyPrice:0, maxStack:-1, icon:'rock' },
  granite:        { id:'granite',        name:'花崗岩',       description:'地下に生成される無骨な石。',    category:'material', rarity:'common', sellPrice:3,  buyPrice:0, maxStack:-1, icon:'rock' },
  diorite:        { id:'diorite',        name:'閃緑岩',       description:'白みがかった地下の石。',        category:'material', rarity:'common', sellPrice:3,  buyPrice:0, maxStack:-1, icon:'rock' },
  andesite:       { id:'andesite',       name:'安山岩',       description:'灰色の地下の石。',              category:'material', rarity:'common', sellPrice:3,  buyPrice:0, maxStack:-1, icon:'rock' },
  deepslate:      { id:'deepslate',      name:'深層岩',       description:'地下深部の硬い岩石。',          category:'material', rarity:'uncommon', sellPrice:8, buyPrice:0, maxStack:-1, icon:'ore_dark' },
  tuff:           { id:'tuff',           name:'凝灰岩',       description:'地下の鉱石周辺に生成される石。', category:'material', rarity:'common', sellPrice:4,  buyPrice:0, maxStack:-1, icon:'rock' },
  calcite:        { id:'calcite',        name:'方解石',       description:'白い鉱物。溶岩湖周辺に生成。',  category:'material', rarity:'common', sellPrice:5,  buyPrice:0, maxStack:-1, icon:'ore_white2' },
  netherrack:     { id:'netherrack',     name:'ネザーラック', description:'ネザーの基本岩盤。燃え続ける。', category:'material', rarity:'common', sellPrice:2,  buyPrice:0, maxStack:-1, icon:'ore_red' },
  end_stone:      { id:'end_stone',      name:'エンドストーン','description':'エンド次元の岩石。',          category:'material', rarity:'uncommon', sellPrice:15, buyPrice:0, maxStack:-1, icon:'ore_yellow' },
  // ============================================================
  // マイクラ準拠：鉱石
  // ============================================================
  copper_ore:     { id:'copper_ore',     name:'銅鉱石',       description:'Y48付近に多く生成。橙色の鉱石。', category:'material', rarity:'common',    sellPrice:15,   buyPrice:0, maxStack:-1, icon:'ore_brown' },
  copper_ingot:   { id:'copper_ingot',   name:'銅インゴット', description:'銅鉱石を精錬したもの。',         category:'material', rarity:'common',    sellPrice:20,   buyPrice:0, maxStack:-1, icon:'ore_dark_brown' },
  lapis_ore:      { id:'lapis_ore',      name:'ラピスラズリ鉱石','description':'Y0付近に多く生成。青い鉱石。', category:'material', rarity:'uncommon',  sellPrice:40,   buyPrice:0, maxStack:-1, icon:'ore_blue' },
  lapis_lazuli:   { id:'lapis_lazuli',   name:'ラピスラズリ', description:'エンチャントに必要な青い鉱物。', category:'material', rarity:'uncommon',  sellPrice:35,   buyPrice:0, maxStack:-1, icon:'magic_stone_blue' },
  redstone_ore:   { id:'redstone_ore',   name:'レッドストーン鉱石','description':'Y-60付近に多く生成。赤い鉱石。', category:'material', rarity:'uncommon', sellPrice:30,  buyPrice:0, maxStack:-1, icon:'ore_red' },
  redstone:       { id:'redstone',       name:'レッドストーン','description':'回路や醸造台に必要な素材。',   category:'material', rarity:'uncommon',  sellPrice:25,   buyPrice:0, maxStack:-1, icon:'heart' },
  diamond_ore:    { id:'diamond_ore',    name:'ダイヤモンド鉱石','description':'Y-58付近に多く生成。貴重な鉱石。', category:'material', rarity:'rare',    sellPrice:400,  buyPrice:0, maxStack:-1, icon:'gem' },
  diamond:        { id:'diamond',        name:'ダイヤモンド', description:'最高クラスの装備に必要な宝石。', category:'material', rarity:'rare',      sellPrice:350,  buyPrice:0, maxStack:-1, icon:'gem_blue' },
  nether_quartz:  { id:'nether_quartz',  name:'ネザー水晶',   description:'ネザーに生成される白い鉱石。',   category:'material', rarity:'uncommon',  sellPrice:30,   buyPrice:0, maxStack:-1, icon:'ore_white' },
  nether_gold_ore:{ id:'nether_gold_ore',name:'ネザー金鉱石', description:'ネザーに生成される金鉱石。',     category:'material', rarity:'uncommon',  sellPrice:50,   buyPrice:0, maxStack:-1, icon:'star_glow' },
  ancient_debris: { id:'ancient_debris', name:'古代の残骸',   description:'ネザー深部に極わずかに生成。',   category:'material', rarity:'legendary', sellPrice:3000, buyPrice:0, maxStack:64, icon:'ore_dark_brown' },
  netherite_scrap:{ id:'netherite_scrap',name:'ネザライトの欠片','description':'古代の残骸を精錬した素材。', category:'material', rarity:'legendary', sellPrice:2000, buyPrice:0, maxStack:64, icon:'ore_dark' },
  netherite_ingot:{ id:'netherite_ingot',name:'ネザライトインゴット','description':'最高位の素材。',        category:'material', rarity:'legendary', sellPrice:8000, buyPrice:0, maxStack:64, icon:'trophy' },
};

// ============================================================
// スキルマスター (上限100000)
// ============================================================
export const SKILL_MASTER: Record<string, SkillMaster> = {
  mining:      { id:'mining',      name:'採掘', description:'岩や鉱脈から資源を採取する能力。スキルレベルが上がると採掘量増加。', icon:'pickaxe', maxLevel:100000 },
  woodcutting: { id:'woodcutting', name:'伐採', description:'木を切り倒して木材を集める能力。スキルレベルが上がると伐採量増加。', icon:'axe', maxLevel:100000 },
  combat:      { id:'combat',      name:'戦闘', description:'モンスターと戦う能力。高いほどダンジョンで有利。',                   icon:'swords', maxLevel:100000 },
  fishing:     { id:'fishing',     name:'釣り', description:'魚や水中の素材を採取する能力。スキルレベルが上がると希少魚を釣りやすい。', icon:'fishing_rod', maxLevel:100000 },
  crafting:    { id:'crafting',    name:'製作', description:'素材からアイテムを作成する能力。レベルが上がると上位アイテムを製作可能。製作経験値で上がる。', icon:'hammer', maxLevel:100000 },
};

// ============================================================
// クラフトレシピ
// ============================================================
export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'plank_from_wood',
    name: '板材を作る',
    description: '木材から板材を作る。建築・武器製作の基本素材。',
    outputItemId: 'plank',
    outputAmount: 2,
    inputs: [{ itemId: 'wood', amount: 1 }],
    requiredCraftingLevel: 1,
    craftingExpGain: 5,
  },
  {
    id: 'stone_knife_from_stone',
    name: '石のナイフを作る',
    description: '石から基本的な武器を作る。',
    outputItemId: 'stone_knife',
    outputAmount: 1,
    inputs: [{ itemId: 'stone', amount: 3 }],
    requiredCraftingLevel: 1,
    craftingExpGain: 20,
  },
  {
    id: 'wooden_bow_from_wood',
    name: '木の弓を作る',
    description: '木材から弓を作る。射程のある武器。',
    outputItemId: 'wooden_bow',
    outputAmount: 1,
    inputs: [{ itemId: 'wood', amount: 5 }, { itemId: 'plank', amount: 2 }],
    requiredCraftingLevel: 3,
    craftingExpGain: 40,
  },
  {
    id: 'iron_ingot_from_ore',
    name: '鉄塊を精錬する',
    description: '鉄鉱石と石炭を使って鉄塊を作る。',
    outputItemId: 'iron_ingot',
    outputAmount: 1,
    inputs: [{ itemId: 'iron_ore', amount: 2 }, { itemId: 'coal', amount: 1 }],
    requiredCraftingLevel: 5,
    craftingExpGain: 35,
  },
  {
    id: 'iron_sword_from_ingot',
    name: '鉄の剣を作る',
    description: '鉄塊から武器を鍛造する。攻撃力+5。',
    outputItemId: 'iron_sword',
    outputAmount: 1,
    inputs: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'plank', amount: 1 }],
    requiredCraftingLevel: 8,
    craftingExpGain: 80,
  },
  {
    id: 'iron_helmet_from_ingot',
    name: '鉄のヘルメットを作る',
    description: '鉄塊から防具を鍛造する。防御力+3。',
    outputItemId: 'iron_helmet',
    outputAmount: 1,
    inputs: [{ itemId: 'iron_ingot', amount: 4 }],
    requiredCraftingLevel: 10,
    craftingExpGain: 100,
  },
  {
    id: 'health_potion_craft',
    name: '回復薬を調合する',
    description: '霊氷とスライムゼリーから回復薬を作る。',
    outputItemId: 'health_potion',
    outputAmount: 3,
    inputs: [{ itemId: 'spirit_ice', amount: 1 }, { itemId: 'slime_gel', amount: 2 }],
    requiredCraftingLevel: 12,
    craftingExpGain: 60,
  },
  {
    id: 'mega_potion_craft',
    name: 'メガポーションを調合する',
    description: '古代の欠片を使って強力な回復薬を作る。',
    outputItemId: 'mega_potion',
    outputAmount: 2,
    inputs: [{ itemId: 'ancient_shard', amount: 1 }, { itemId: 'health_potion', amount: 2 }],
    requiredCraftingLevel: 20,
    craftingExpGain: 150,
  },
  {
    id: 'mystery_key_craft',
    name: '謎の鍵を作る',
    description: '研磨剤から謎の鍵を製造する。',
    outputItemId: 'mystery_key',
    outputAmount: 1,
    inputs: [{ itemId: 'polishing_agent_1', amount: 5 }, { itemId: 'polishing_agent_5', amount: 1 }],
    requiredCraftingLevel: 15,
    craftingExpGain: 120,
  },
];

// ============================================================
// 採取ノードマスター
// ============================================================
export const GATHER_NODE_MASTER: Record<string, GatherNodeMaster> = {
  // 伐採ノード（マイクラ準拠の原木種類）
  pine_tree:      { id:'pine_tree',      name:'松の木（トウヒ）',  description:'タイガバイオームの木。', icon:'pine_tree', requiredSkill:{skillId:'woodcutting',minLevel:1},  cooldownMs:3000,  staminaCost:5,  drops:[{itemId:'wood',baseRate:1.0,minAmount:1,maxAmount:3,skillRateBonus:0.05},{itemId:'spruce_log',baseRate:0.5,minAmount:1,maxAmount:2}] },
  oak_tree:       { id:'oak_tree',       name:'オークの木',        description:'平原・森林の大木。',    icon:'oak_tree', requiredSkill:{skillId:'woodcutting',minLevel:5},  cooldownMs:5000,  staminaCost:8,  drops:[{itemId:'wood',baseRate:1.0,minAmount:2,maxAmount:5,skillRateBonus:0.08},{itemId:'oak_log',baseRate:0.6,minAmount:1,maxAmount:3}] },
  birch_tree:     { id:'birch_tree',     name:'シラカバの木',      description:'白い樹皮の木。',        icon:'oak_tree', requiredSkill:{skillId:'woodcutting',minLevel:3},  cooldownMs:4000,  staminaCost:6,  drops:[{itemId:'birch_log',baseRate:1.0,minAmount:1,maxAmount:3,skillRateBonus:0.06},{itemId:'wood',baseRate:0.5,minAmount:1,maxAmount:2}] },
  jungle_tree:    { id:'jungle_tree',    name:'ジャングルの木',    description:'熱帯の巨大な木。',      icon:'palm_tree', requiredSkill:{skillId:'woodcutting',minLevel:8},  cooldownMs:6000,  staminaCost:10, drops:[{itemId:'jungle_log',baseRate:1.0,minAmount:2,maxAmount:5,skillRateBonus:0.08},{itemId:'bamboo',baseRate:0.4,minAmount:1,maxAmount:3}] },
  acacia_tree:    { id:'acacia_tree',    name:'アカシアの木',      description:'サバンナの広葉樹。',    icon:'leaf', requiredSkill:{skillId:'woodcutting',minLevel:6},  cooldownMs:5000,  staminaCost:8,  drops:[{itemId:'acacia_log',baseRate:1.0,minAmount:1,maxAmount:4,skillRateBonus:0.07}] },
  dark_oak_tree:  { id:'dark_oak_tree',  name:'ダークオークの木',  description:'巨大で硬い暗い木。',    icon:'pine_tree', requiredSkill:{skillId:'woodcutting',minLevel:12}, cooldownMs:7000,  staminaCost:12, drops:[{itemId:'dark_oak_log',baseRate:1.0,minAmount:2,maxAmount:5,skillRateBonus:0.1},{itemId:'wood',baseRate:0.5,minAmount:1,maxAmount:2}] },
  mangrove_tree:  { id:'mangrove_tree',  name:'マングローブの木',  description:'湿地に生えるねじれた木。', icon:'leaf', requiredSkill:{skillId:'woodcutting',minLevel:10}, cooldownMs:6000,  staminaCost:10, drops:[{itemId:'mangrove_log',baseRate:1.0,minAmount:1,maxAmount:4,skillRateBonus:0.09}] },
  cherry_tree:    { id:'cherry_tree',    name:'サクラの木',        description:'ピンクの花びらが舞う木。', icon:'cherry_blossom', requiredSkill:{skillId:'woodcutting',minLevel:15}, cooldownMs:8000,  staminaCost:12, drops:[{itemId:'cherry_log',baseRate:1.0,minAmount:1,maxAmount:4,skillRateBonus:0.1}] },
  bamboo_grove:   { id:'bamboo_grove',   name:'竹林',              description:'まっすぐ伸びる竹。',    icon:'bamboo', requiredSkill:{skillId:'woodcutting',minLevel:2},  cooldownMs:3000,  staminaCost:4,  drops:[{itemId:'bamboo',baseRate:1.0,minAmount:3,maxAmount:8,skillRateBonus:0.05}] },
  // 採掘ノード（マイクラ準拠の石・鉱石）
  stone_deposit:  { id:'stone_deposit',  name:'岩場（石）',        description:'地面にある岩の塊。',    icon:'rock', requiredSkill:{skillId:'mining',minLevel:1},  cooldownMs:4000,  staminaCost:6,  drops:[{itemId:'stone',baseRate:1.0,minAmount:1,maxAmount:3},{itemId:'cobblestone',baseRate:0.8,minAmount:1,maxAmount:3},{itemId:'coal',baseRate:0.15,minAmount:1,maxAmount:2},{itemId:'polishing_agent_1',baseRate:0.08,minAmount:1,maxAmount:1}] },
  granite_deposit:{ id:'granite_deposit',name:'花崗岩の岩場',      description:'赤みがかった硬い岩石。', icon:'rock', requiredSkill:{skillId:'mining',minLevel:2},  cooldownMs:4000,  staminaCost:6,  drops:[{itemId:'granite',baseRate:1.0,minAmount:2,maxAmount:5},{itemId:'stone',baseRate:0.5,minAmount:1,maxAmount:2}] },
  diorite_deposit:{ id:'diorite_deposit',name:'閃緑岩の岩場',      description:'白い粒状の岩石。',      icon:'rock', requiredSkill:{skillId:'mining',minLevel:2},  cooldownMs:4000,  staminaCost:6,  drops:[{itemId:'diorite',baseRate:1.0,minAmount:2,maxAmount:5},{itemId:'stone',baseRate:0.5,minAmount:1,maxAmount:2}] },
  andesite_deposit:{id:'andesite_deposit',name:'安山岩の岩場',     description:'灰色の火成岩。',        icon:'rock', requiredSkill:{skillId:'mining',minLevel:2},  cooldownMs:4000,  staminaCost:6,  drops:[{itemId:'andesite',baseRate:1.0,minAmount:2,maxAmount:5},{itemId:'tuff',baseRate:0.3,minAmount:1,maxAmount:2}] },
  deepslate_deposit:{id:'deepslate_deposit',name:'深層岩の岩場',   description:'地下深部の硬い岩石。',  icon:'ore_dark', requiredSkill:{skillId:'mining',minLevel:20}, cooldownMs:8000,  staminaCost:15, drops:[{itemId:'deepslate',baseRate:1.0,minAmount:2,maxAmount:4},{itemId:'stone',baseRate:0.3,minAmount:1,maxAmount:2},{itemId:'tuff',baseRate:0.2,minAmount:1,maxAmount:2}] },
  copper_vein:    { id:'copper_vein',    name:'銅鉱脈',            description:'Y48付近で多く採れる。',  icon:'ore_brown', requiredSkill:{skillId:'mining',minLevel:5},  cooldownMs:6000,  staminaCost:8,  drops:[{itemId:'copper_ore',baseRate:1.0,minAmount:1,maxAmount:3,skillRateBonus:0.08},{itemId:'copper_ingot',baseRate:0.2,minAmount:1,maxAmount:1}] },
  lapis_vein:     { id:'lapis_vein',     name:'ラピスラズリ鉱脈',  description:'Y0付近で多く採れる青い鉱石。', icon:'ore_blue', requiredSkill:{skillId:'mining',minLevel:8}, cooldownMs:10000, staminaCost:12, drops:[{itemId:'lapis_ore',baseRate:1.0,minAmount:1,maxAmount:2,skillRateBonus:0.08},{itemId:'lapis_lazuli',baseRate:0.7,minAmount:1,maxAmount:4}] },
  redstone_vein:  { id:'redstone_vein',  name:'レッドストーン鉱脈','description':'Y-60付近で多く採れる赤い鉱石。', icon:'ore_red', requiredSkill:{skillId:'mining',minLevel:12}, cooldownMs:12000, staminaCost:15, drops:[{itemId:'redstone_ore',baseRate:1.0,minAmount:1,maxAmount:2,skillRateBonus:0.1},{itemId:'redstone',baseRate:0.8,minAmount:2,maxAmount:6}] },
  iron_vein:      { id:'iron_vein',      name:'鉄鉱脈',            description:'鉄を含む鉱脈。',        icon:'pickaxe', requiredSkill:{skillId:'mining',minLevel:10}, cooldownMs:8000,  staminaCost:12, drops:[{itemId:'iron_ore',baseRate:1.0,minAmount:1,maxAmount:3,skillRateBonus:0.1},{itemId:'iron_ingot',baseRate:0.3,minAmount:1,maxAmount:2},{itemId:'gold_ore',baseRate:0.05,minAmount:1,maxAmount:1},{itemId:'polishing_agent_1',baseRate:0.12,minAmount:1,maxAmount:2}] },
  gold_vein:      { id:'gold_vein',      name:'金鉱脈',            description:'希少な金を含む鉱脈。',  icon:'sparkle', requiredSkill:{skillId:'mining',minLevel:25}, cooldownMs:15000, staminaCost:20, drops:[{itemId:'gold_ore',baseRate:1.0,minAmount:1,maxAmount:3,skillRateBonus:0.12},{itemId:'emerald',baseRate:0.15,minAmount:1,maxAmount:2}] },
  diamond_vein:   { id:'diamond_vein',   name:'ダイヤモンド鉱脈',  description:'Y-58付近の極めて希少な鉱石。', icon:'gem', requiredSkill:{skillId:'mining',minLevel:40}, cooldownMs:30000, staminaCost:30, drops:[{itemId:'diamond_ore',baseRate:1.0,minAmount:1,maxAmount:2,skillRateBonus:0.05},{itemId:'diamond',baseRate:0.5,minAmount:1,maxAmount:2}] },
  emerald_vein:   { id:'emerald_vein',   name:'エメラルド鉱脈',    description:'エメラルドが取れる希少な鉱脈。', icon:'emerald', requiredSkill:{skillId:'mining',minLevel:35}, cooldownMs:20000, staminaCost:25, drops:[{itemId:'emerald',baseRate:1.0,minAmount:1,maxAmount:3,skillRateBonus:0.15},{itemId:'emerald_block',baseRate:0.05,minAmount:1,maxAmount:1}] },
  nether_quartz_vein:{ id:'nether_quartz_vein', name:'ネザー水晶鉱脈', description:'ネザーの白い鉱石。', icon:'ore_white', requiredSkill:{skillId:'mining',minLevel:20}, cooldownMs:10000, staminaCost:15, drops:[{itemId:'nether_quartz',baseRate:1.0,minAmount:1,maxAmount:4,skillRateBonus:0.1},{itemId:'netherrack',baseRate:0.5,minAmount:1,maxAmount:3}] },
  nether_gold_vein:  { id:'nether_gold_vein',   name:'ネザー金鉱脈',   description:'ネザーの金鉱石。',   icon:'star_glow', requiredSkill:{skillId:'mining',minLevel:22}, cooldownMs:12000, staminaCost:18, drops:[{itemId:'nether_gold_ore',baseRate:1.0,minAmount:1,maxAmount:3,skillRateBonus:0.1},{itemId:'gold_ore',baseRate:0.3,minAmount:1,maxAmount:1}] },
  ancient_debris_vein:{id:'ancient_debris_vein',name:'古代の残骸鉱脈',  description:'ネザー深部の超希少鉱石。', icon:'ore_dark_brown', requiredSkill:{skillId:'mining',minLevel:60}, cooldownMs:60000, staminaCost:40, drops:[{itemId:'ancient_debris',baseRate:0.25,minAmount:1,maxAmount:1,skillRateBonus:0.02},{itemId:'netherite_scrap',baseRate:0.1,minAmount:1,maxAmount:1}] },
  end_stone_deposit: { id:'end_stone_deposit',  name:'エンドストーン',   description:'エンド次元の岩石。', icon:'ore_yellow', requiredSkill:{skillId:'mining',minLevel:45}, cooldownMs:15000, staminaCost:20, drops:[{itemId:'end_stone',baseRate:1.0,minAmount:2,maxAmount:5},{itemId:'rutile_platinum',baseRate:0.06,minAmount:1,maxAmount:1}] },
  // 眠る素材採掘ノード（カスタム）
  sleeping_a_vein:   { id:'sleeping_a_vein',    name:'Aカスタム採掘場', description:'鉄隕石の欠片・アダマンタイト・彗星の欠片が眠る。', icon:'comet', requiredSkill:{skillId:'mining',minLevel:30}, cooldownMs:20000, staminaCost:25, drops:[{itemId:'iron_meteorite',baseRate:0.25,minAmount:1,maxAmount:1},{itemId:'adamantite',baseRate:0.06,minAmount:1,maxAmount:1},{itemId:'comet_shard',baseRate:0.13,minAmount:1,maxAmount:1}] },
  sleeping_b_vein:   { id:'sleeping_b_vein',    name:'Bカスタム採掘場', description:'竜の骨・超合金メイプルが眠る。',                   icon:'bone', requiredSkill:{skillId:'mining',minLevel:40}, cooldownMs:30000, staminaCost:30, drops:[{itemId:'dragon_bone',baseRate:0.25,minAmount:1,maxAmount:1},{itemId:'super_alloy_maple',baseRate:0.03,minAmount:1,maxAmount:1}] },
  sleeping_c_vein:   { id:'sleeping_c_vein',    name:'Cカスタム採掘場（ネザー）', description:'魂の炎・血の鎖が眠るネザー鉱脈。',          icon:'flame', requiredSkill:{skillId:'mining',minLevel:35}, cooldownMs:25000, staminaCost:28, drops:[{itemId:'soul_flame',baseRate:0.06,minAmount:1,maxAmount:1},{itemId:'blood_chain',baseRate:0.06,minAmount:1,maxAmount:1},{itemId:'netherrack',baseRate:0.8,minAmount:2,maxAmount:4}] },
  sleeping_d_vein:   { id:'sleeping_d_vein',    name:'Dカスタム採掘場（エンド）', description:'ルチルプラチナが眠るエンドの鉱脈。',          icon:'galaxy', requiredSkill:{skillId:'mining',minLevel:50}, cooldownMs:30000, staminaCost:35, drops:[{itemId:'rutile_platinum',baseRate:0.06,minAmount:1,maxAmount:1},{itemId:'end_stone',baseRate:0.8,minAmount:2,maxAmount:4}] },
  fishing_pond: {
    id:'fishing_pond', name:'釣り場（基本）', description:'バニラの魚が釣れる。', icon:'fishing_rod',
    requiredSkill:{skillId:'fishing',minLevel:1}, cooldownMs:5000, staminaCost:4,
    drops:[{itemId:'raw_cod',baseRate:0.35,minAmount:1,maxAmount:1},{itemId:'raw_salmon',baseRate:0.30,minAmount:1,maxAmount:1},{itemId:'tropical_fish',baseRate:0.15,minAmount:1,maxAmount:1},{itemId:'pufferfish',baseRate:0.10,minAmount:1,maxAmount:1},{itemId:'stone',baseRate:0.20,minAmount:1,maxAmount:2},{itemId:'iron_ore',baseRate:0.05,minAmount:1,maxAmount:1}],
  },
  fishing_ore_pond: {
    id:'fishing_ore_pond', name:'釣り場（鉱石ロッド）', description:'鉱石も釣れる。', icon:'fishing_rod',
    requiredSkill:{skillId:'fishing',minLevel:5}, cooldownMs:5000, staminaCost:5,
    drops:[{itemId:'raw_cod',baseRate:0.25,minAmount:1,maxAmount:1},{itemId:'raw_salmon',baseRate:0.20,minAmount:1,maxAmount:1},{itemId:'iron_ore',baseRate:0.25,minAmount:1,maxAmount:2,skillRateBonus:0.02},{itemId:'gold_ore',baseRate:0.08,minAmount:1,maxAmount:1},{itemId:'emerald',baseRate:0.04,minAmount:1,maxAmount:1},{itemId:'coal',baseRate:0.20,minAmount:1,maxAmount:2}],
  },
  fishing_ticket_pond: {
    id:'fishing_ticket_pond', name:'釣り場（チケット）', description:'釣りチケットが釣れる！', icon:'fishing_rod',
    requiredSkill:{skillId:'fishing',minLevel:10}, cooldownMs:5000, staminaCost:5,
    drops:[{itemId:'fishing_ticket',baseRate:0.20,minAmount:1,maxAmount:2,skillRateBonus:0.01},{itemId:'raw_cod',baseRate:0.20,minAmount:1,maxAmount:1},{itemId:'iron_ore',baseRate:0.20,minAmount:1,maxAmount:2},{itemId:'gold_ore',baseRate:0.10,minAmount:1,maxAmount:1}],
  },
  fishing_master_pond: {
    id:'fishing_master_pond', name:'釣り場（マスターロッド）', description:'Yランダムボックスが釣れる！', icon:'fishing_rod',
    requiredSkill:{skillId:'fishing',minLevel:20}, cooldownMs:5000, staminaCost:6,
    drops:[{itemId:'y_random_box',baseRate:0.08,minAmount:1,maxAmount:1},{itemId:'fishing_ticket',baseRate:0.25,minAmount:1,maxAmount:3},{itemId:'emerald',baseRate:0.15,minAmount:1,maxAmount:2},{itemId:'emerald_block',baseRate:0.02,minAmount:1,maxAmount:1}],
  },
  fishing_ffgg_pond: {
    id:'fishing_ffgg_pond', name:'FFGG釣り場', description:'FF小判・鱗・牙が釣れる！', icon:'fishing_rod',
    requiredSkill:{skillId:'fishing',minLevel:15}, cooldownMs:4000, staminaCost:5,
    drops:[{itemId:'ff_coin_small',baseRate:0.40,minAmount:1,maxAmount:3,skillRateBonus:0.01},{itemId:'brilliant_salmon',baseRate:0.20,minAmount:1,maxAmount:1},{itemId:'hoshi_tuna',baseRate:0.15,minAmount:1,maxAmount:1},{itemId:'scale_low_1',baseRate:0.12,minAmount:1,maxAmount:1},{itemId:'scale_low_2',baseRate:0.12,minAmount:1,maxAmount:1},{itemId:'wolf_fang',baseRate:0.08,minAmount:1,maxAmount:1},{itemId:'scale_high_1',baseRate:0.03,minAmount:1,maxAmount:1},{itemId:'wolf_crystal',baseRate:0.02,minAmount:1,maxAmount:1},{itemId:'dragon_soul',baseRate:0.02,minAmount:1,maxAmount:1}],
  },
  fishing_ggr_pond: {
    id:'fishing_ggr_pond', name:'GGR釣り場', description:'クレートとお金が釣れる！', icon:'fishing_rod',
    requiredSkill:{skillId:'fishing',minLevel:30}, cooldownMs:4000, staminaCost:6,
    drops:[{itemId:'crate_leather',baseRate:0.40,minAmount:1,maxAmount:1},{itemId:'crate_gold',baseRate:0.20,minAmount:1,maxAmount:1},{itemId:'crate_diamond',baseRate:0.08,minAmount:1,maxAmount:1},{itemId:'crate_enhanced',baseRate:0.02,minAmount:1,maxAmount:1},{itemId:'la_juice_high',baseRate:0.05,minAmount:1,maxAmount:1},{itemId:'ff_coin_large',baseRate:0.03,minAmount:1,maxAmount:1}],
  },
};

// ============================================================
// モンスターマスター
// ============================================================
export const MONSTER_MASTER: Record<string, MonsterMaster> = {
  // 初級
  cave_minion:  { id:'cave_minion',  name:'洞窟王の手下', description:'俊敏に動き回る。', icon:'silhouette', maxHp:20,  attack:2,  defense:1,  baseExp:8,   baseGold:3,   dungeonIds:['beginner_cave'], drops:[{itemId:'cave_fragment',baseRate:0.7,minAmount:1,maxAmount:2},{itemId:'contract',baseRate:0.1,minAmount:1,maxAmount:1}] },
  minion_end:   { id:'minion_end',   name:'手下の末路',   description:'弱いが侮れない。', icon:'skull', maxHp:6,   attack:1,  defense:0,  baseExp:3,   baseGold:1,   dungeonIds:['beginner_cave'], drops:[{itemId:'cave_fragment',baseRate:0.5,minAmount:1,maxAmount:1}] },
  cave_right:   { id:'cave_right',   name:'洞窟王の右腕', description:'洞窟王の側近。',  icon:'swords', maxHp:40,  attack:8,  defense:3,  baseExp:20,  baseGold:10,  dungeonIds:['beginner_cave'], drops:[{itemId:'cave_fragment',baseRate:0.8,minAmount:1,maxAmount:3},{itemId:'contract',baseRate:0.15,minAmount:1,maxAmount:1}] },
  cave_left:    { id:'cave_left',    name:'洞窟王の左腕', description:'洞窟王の側近。',  icon:'shield', maxHp:40,  attack:6,  defense:5,  baseExp:20,  baseGold:10,  dungeonIds:['beginner_cave'], drops:[{itemId:'cave_fragment',baseRate:0.8,minAmount:1,maxAmount:3},{itemId:'contract',baseRate:0.15,minAmount:1,maxAmount:1}] },
  cave_king:    { id:'cave_king',    name:'洞窟王',       description:'初級ダンジョンのボス。', icon:'crown', maxHp:100, attack:15, defense:8,  baseExp:80,  baseGold:50,  dungeonIds:['beginner_cave'], isBoss:true, drops:[{itemId:'cave_fragment',baseRate:1.0,minAmount:2,maxAmount:5},{itemId:'cave_gem',baseRate:0.6,minAmount:1,maxAmount:1},{itemId:'rusty_sword',baseRate:0.01,minAmount:1,maxAmount:1}] },
  // 中級
  rookie_soldier:  { id:'rookie_soldier', name:'下っ端戦士',  description:'最弱の戦士。', icon:'soldier_helmet', maxHp:10, attack:3, defense:4, baseExp:5, baseGold:4, dungeonIds:['fortress'], drops:[{itemId:'coin',baseRate:1.0,minAmount:4,maxAmount:4},{itemId:'contract',baseRate:0.1,minAmount:1,maxAmount:1}] },
  gold_soldier:    { id:'gold_soldier',   name:'成金戦士',    description:'全身金装備。',  icon:'gold_medal', maxHp:20, attack:5, defense:4, baseExp:8, baseGold:4, dungeonIds:['fortress'], drops:[{itemId:'coin',baseRate:1.0,minAmount:4,maxAmount:4}] },
  veteran_soldier: { id:'veteran_soldier',name:'いっぱし戦士',description:'それなりに強い。', icon:'swords', maxHp:25, attack:6, defense:4, baseExp:10, baseGold:3, dungeonIds:['fortress','underground_fortress'], drops:[{itemId:'coin',baseRate:1.0,minAmount:3,maxAmount:3}] },
  iron_soldier:    { id:'iron_soldier',   name:'鉄戦士',      description:'高水準なステータス。', icon:'iron_ingot', maxHp:45, attack:12, defense:4, baseExp:20, baseGold:7, dungeonIds:['fortress','underground_fortress'], drops:[{itemId:'coin',baseRate:1.0,minAmount:7,maxAmount:7},{itemId:'fortress_order',baseRate:1.0,minAmount:1,maxAmount:1}] },
  strong_soldier:  { id:'strong_soldier', name:'強戦士',       description:'フルダイヤの危険な奴。', icon:'gem', maxHp:60, attack:16, defense:4, baseExp:30, baseGold:10, dungeonIds:['underground_fortress'], drops:[{itemId:'coin',baseRate:1.0,minAmount:10,maxAmount:10},{itemId:'memento',baseRate:1.0,minAmount:1,maxAmount:1}] },
  archer:          { id:'archer',         name:'弓兵',         description:'遠距離攻撃。', icon:'bow_arrow', maxHp:20, attack:3, defense:4, baseExp:8, baseGold:1, dungeonIds:['fortress'], drops:[{itemId:'coin',baseRate:1.0,minAmount:1,maxAmount:1}] },
  crusher:         { id:'crusher',        name:'クラッシャー', description:'衝撃波で防御貫通。', icon:'hammer', maxHp:45, attack:12, defense:4, baseExp:25, baseGold:7, dungeonIds:['underground_fortress'], specialAttack:'衝撃波', drops:[{itemId:'coin',baseRate:1.0,minAmount:7,maxAmount:7},{itemId:'crusher_box',baseRate:1.0,minAmount:1,maxAmount:1}] },
  blast_archer:    { id:'blast_archer',   name:'炸裂弓兵',     description:'爆破矢で打ち上げる。', icon:'explosion', maxHp:40, attack:3, defense:4, baseExp:20, baseGold:15, dungeonIds:['underground_fortress'], drops:[{itemId:'coin',baseRate:1.0,minAmount:15,maxAmount:15}] },
  spearman:        { id:'spearman',       name:'槍兵',         description:'射程の長い槍兵。', icon:'dagger', maxHp:50, attack:8, defense:4, baseExp:22, baseGold:7, dungeonIds:['underground_fortress'], drops:[{itemId:'coin',baseRate:1.0,minAmount:7,maxAmount:7},{itemId:'spear_shaft',baseRate:0.5,minAmount:1,maxAmount:1}] },
  ultimate_crusher:{ id:'ultimate_crusher',name:'アルティメイトクラッシャー',description:'強烈な衝撃波。', icon:'impact', maxHp:120, attack:20, defense:8, baseExp:60, baseGold:20, dungeonIds:['underground_fortress'], specialAttack:'強衝撃波', drops:[{itemId:'coin',baseRate:1.0,minAmount:10,maxAmount:15},{itemId:'hammer',baseRate:0.5,minAmount:1,maxAmount:1}] },
  special_spearman:{ id:'special_spearman',name:'特殊戦闘槍兵', description:'高火力の槍投擲。', icon:'target', maxHp:110, attack:18, defense:8, baseExp:55, baseGold:15, dungeonIds:['underground_fortress'], drops:[{itemId:'coin',baseRate:1.0,minAmount:10,maxAmount:10},{itemId:'spear_shaft',baseRate:0.5,minAmount:1,maxAmount:1}] },
  biomancer:       { id:'biomancer',      name:'バイオマンサー', description:'手下を召喚する。', icon:'mage', maxHp:250, attack:25, defense:12, baseExp:200, baseGold:100, dungeonIds:['underground_fortress'], isBoss:true, specialAttack:'手下召喚', drops:[{itemId:'coin',baseRate:1.0,minAmount:20,maxAmount:30},{itemId:'almighty_staff',baseRate:1.0,minAmount:1,maxAmount:1}] },
  // 上級
  doryu:        { id:'doryu',     name:'ドリュウ', description:'開幕無敵+地中突撃。', icon:'hedgehog', maxHp:80,    attack:5,  defense:0,   baseExp:40,   baseGold:20,   dungeonIds:['garden'], specialAttack:'昇土竜拳', drops:[{itemId:'mole_claw',baseRate:1.0,minAmount:1,maxAmount:1}] },
  pool_ghost:   { id:'pool_ghost',name:'池ノ亡霊',description:'毒矢を放つ骨。',      icon:'skull', maxHp:10,    attack:3,  defense:0,   baseExp:5,    baseGold:3,    dungeonIds:['garden'], drops:[{itemId:'ancient_shard',baseRate:0.05,minAmount:1,maxAmount:1}] },
  ice_spirit:   { id:'ice_spirit',name:'氷霊',    description:'鈍足付与の弱い敵。',  icon:'snowflake', maxHp:10,    attack:3,  defense:0,   baseExp:5,    baseGold:3,    dungeonIds:['garden'], drops:[{itemId:'spirit_ice',baseRate:0.4,minAmount:1,maxAmount:1}] },
  reicho:       { id:'reicho',    name:'冷焦',    description:'ボス（2体）。',        icon:'flame', maxHp:200,   attack:20, defense:10,  baseExp:150,  baseGold:80,   dungeonIds:['garden'], isBoss:true, specialAttack:'炎上+鈍足', drops:[{itemId:'spirit_ice',baseRate:0.5,minAmount:1,maxAmount:2},{itemId:'ancient_shard',baseRate:0.2,minAmount:1,maxAmount:1}] },
  extreme_cold: { id:'extreme_cold',name:'極冷',  description:'炎系攻撃で即死。',     icon:'blizzard', maxHp:2180,  attack:25, defense:20,  baseExp:400,  baseGold:200,  dungeonIds:['frozen_cave'], specialAttack:'アイスビーム', drops:[{itemId:'spirit_ice',baseRate:0.5,minAmount:2,maxAmount:3},{itemId:'ancient_shard',baseRate:0.3,minAmount:1,maxAmount:2}] },
  extreme_fire: { id:'extreme_fire',name:'極焦',  description:'氷系攻撃で即死。',     icon:'volcano', maxHp:2180,  attack:25, defense:20,  baseExp:400,  baseGold:200,  dungeonIds:['frozen_cave'], specialAttack:'ラバクロップ', drops:[{itemId:'ancient_shard',baseRate:0.5,minAmount:2,maxAmount:3}] },
  zero_boss:    { id:'zero_boss', name:'零',      description:'洞窟そのもの。',       icon:'lightning', maxHp:100000,attack:1,  defense:99,  baseExp:5000, baseGold:3000, dungeonIds:['frozen_cave'], isBoss:true, drops:[{itemId:'stalactite',baseRate:1.0,minAmount:8,maxAmount:8}] },
  roam_armor:   { id:'roam_armor', name:'ロウムアーマー',description:'打ち上げスキル。', icon:'robot', maxHp:60,  attack:20, defense:10,  baseExp:50,   baseGold:30,   dungeonIds:['sky_castle'], drops:[{itemId:'ancient_shard',baseRate:0.3,minAmount:1,maxAmount:2}] },
  death_armor:  { id:'death_armor',name:'デスアーマー',  description:'斬撃5回。',        icon:'skull', maxHp:75,  attack:30, defense:12,  baseExp:65,   baseGold:40,   dungeonIds:['sky_castle'], drops:[{itemId:'ancient_shard',baseRate:0.4,minAmount:1,maxAmount:2}] },
  mad_guy_bot:  { id:'mad_guy_bot',name:'マッドガイボット',description:'天空城ボス。',  icon:'robot', maxHp:500, attack:10, defense:20,  baseExp:600,  baseGold:400,  dungeonIds:['sky_castle'], isBoss:true, drops:[{itemId:'ancient_shard',baseRate:1.0,minAmount:3,maxAmount:5},{itemId:'dragon_scale',baseRate:0.1,minAmount:1,maxAmount:1}] },
  // 火山モンスター
  dwarf_leather:   { id:'dwarf_leather',  name:'ドワーフ[皮]',  description:'皮防具のドワーフ。基本的な強さ。', icon:'mage', maxHp:60,  attack:8,  defense:3,  baseExp:25, baseGold:8,  dungeonIds:['volcano'], drops:[{itemId:'dwarf_fragment',baseRate:1.0,minAmount:1,maxAmount:2},{itemId:'magma_stone',baseRate:0.3,minAmount:1,maxAmount:1}] },
  dwarf_iron:      { id:'dwarf_iron',     name:'ドワーフ[鉄]',  description:'鉄防具のドワーフ。それなりに硬い。', icon:'pickaxe_hammer', maxHp:80,  attack:12, defense:6,  baseExp:35, baseGold:12, dungeonIds:['volcano'], drops:[{itemId:'dwarf_fragment',baseRate:1.0,minAmount:1,maxAmount:2},{itemId:'magma_stone',baseRate:0.5,minAmount:1,maxAmount:1}] },
  dwarf_diamond:   { id:'dwarf_diamond',  name:'ドワーフ[ダイヤ]', description:'ダイヤ防具。飛び道具を放つ。',   icon:'gem', maxHp:120, attack:18, defense:12, baseExp:60, baseGold:20, dungeonIds:['volcano'], drops:[{itemId:'dwarf_fragment',baseRate:1.0,minAmount:2,maxAmount:3},{itemId:'magma_stone',baseRate:0.8,minAmount:1,maxAmount:2}] },
  dwarf_red:       { id:'dwarf_red',      name:'ドワーフ[赤]',  description:'火山固有の赤ドワーフ。火炎攻撃。', icon:'ore_red', maxHp:100, attack:15, defense:8,  baseExp:50, baseGold:15, dungeonIds:['volcano'], drops:[{itemId:'magic_stone',baseRate:1.0,minAmount:1,maxAmount:1},{itemId:'magma_stone',baseRate:0.8,minAmount:1,maxAmount:2}] },
  dwarf_black:     { id:'dwarf_black',    name:'黒ドワーフ',    description:'火山最強のドワーフ系統。',         icon:'ore_dark', maxHp:160, attack:25, defense:15, baseExp:100,baseGold:40, dungeonIds:['volcano'], drops:[{itemId:'hard_magic_stone',baseRate:1.0,minAmount:1,maxAmount:1},{itemId:'magma_stone',baseRate:1.0,minAmount:2,maxAmount:3}] },
  stain_pot:       { id:'stain_pot',      name:'ステインポット', description:'HP1だが自爆ダメージが凄まじい。',   icon:'bomb', maxHp:1,   attack:80, defense:0,  baseExp:5,  baseGold:2,  dungeonIds:['volcano'], drops:[{itemId:'magma_stone',baseRate:0.1,minAmount:1,maxAmount:1}] },
  ragnalok:        { id:'ragnalok',       name:'ラグナロク',    description:'職業スケルトン最上位。極めて危険。', icon:'skull', maxHp:200, attack:45, defense:20, baseExp:200,baseGold:80, dungeonIds:['volcano'], specialAttack:'暗黒斬撃', drops:[{itemId:'hard_magic_stone',baseRate:1.0,minAmount:2,maxAmount:3},{itemId:'magma_stone',baseRate:1.0,minAmount:2,maxAmount:4}] },
  volcano_boss:    { id:'volcano_boss',   name:'獄炎帝',        description:'火山の最終ボス。',                icon:'volcano', maxHp:5000, attack:80, defense:30, baseExp:2000,baseGold:1000, dungeonIds:['volcano'], isBoss:true, specialAttack:'業火爆発', drops:[{itemId:'extreme_flame_aura',baseRate:1.0,minAmount:1,maxAmount:1},{itemId:'volcano_crown',baseRate:0.5,minAmount:1,maxAmount:1},{itemId:'hard_magic_stone',baseRate:1.0,minAmount:5,maxAmount:10}] },
  // 汎用
  slime:  { id:'slime',  name:'スライム', description:'初歩的なモンスター。', icon:'bubbles', maxHp:30,  attack:5,  defense:2,  baseExp:15,  baseGold:8,   dungeonIds:['beginner_cave'], drops:[{itemId:'slime_gel',baseRate:0.8,minAmount:1,maxAmount:3}] },
  goblin: { id:'goblin', name:'ゴブリン', description:'小さいが油断できない。', icon:'goblin', maxHp:60,  attack:12, defense:5,  baseExp:35,  baseGold:20,  dungeonIds:['goblin_den'], drops:[{itemId:'goblin_ear',baseRate:0.6,minAmount:1,maxAmount:2}] },
  dragon: { id:'dragon', name:'ドラゴン', description:'最強クラスの古代生命体。', icon:'dragon', maxHp:1000,attack:80, defense:50, baseExp:800, baseGold:500, dungeonIds:['dragons_lair'], isBoss:true, drops:[{itemId:'dragon_scale',baseRate:0.3,minAmount:1,maxAmount:3},{itemId:'ancient_shard',baseRate:0.8,minAmount:2,maxAmount:5}] },
};

// ============================================================
// ダンジョンマスター
// ============================================================
export const DUNGEON_MASTER: Record<string, DungeonMaster> = {
  beginner_cave: {
    id:'beginner_cave', name:'始まりの洞窟', description:'初心者向けダンジョン。',
    icon:'cave_hole', tier:'beginner', requiredLevel:1, floors:3, expBonus:1.0, goldBonus:1.0,
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
    icon:'dungeon_building', tier:'beginner', requiredLevel:3, floors:5, expBonus:1.1, goldBonus:1.1,
    monsterIds:['goblin'],
  },
  fortress: {
    id:'fortress', name:'要塞', description:'大砲に注意。正面を走り抜けて中に入ること。',
    icon:'fortress', tier:'intermediate', requiredLevel:5, floors:3, expBonus:1.2, goldBonus:1.3,
    monsterIds:['rookie_soldier','gold_soldier','veteran_soldier','iron_soldier','archer'],
    areas:[
      { name:'要塞1階', monsters:[{monsterId:'rookie_soldier',count:2},{monsterId:'gold_soldier',count:1}] },
      { name:'要塞2階', monsters:[{monsterId:'veteran_soldier',count:1},{monsterId:'archer',count:8}] },
      { name:'要塞3階', description:'鉄戦士が玉座に構える。', monsters:[{monsterId:'iron_soldier',count:1},{monsterId:'gold_soldier',count:2}], isHardArea:true },
    ],
  },
  underground_fortress: {
    id:'underground_fortress', name:'地下要塞', description:'防御貫通攻撃が初登場。',
    icon:'dungeon_building', tier:'intermediate', requiredLevel:15, floors:5, expBonus:1.5, goldBonus:1.8,
    monsterIds:['iron_soldier','crusher','blast_archer','spearman','strong_soldier','ultimate_crusher','special_spearman'],
    bossId:'biomancer',
    unlockCondition: { dungeonId:'fortress', clearedCount:3, requiredLevel:15 },
    areas:[
      { name:'地下通路',      monsters:[{monsterId:'iron_soldier',count:2},{monsterId:'crusher',count:1}] },
      { name:'カーペット通路', monsters:[{monsterId:'spearman',count:2},{monsterId:'strong_soldier',count:1},{monsterId:'crusher',count:2}] },
      { name:'小広場',        description:'アルティメイトクラッシャーが守る。', monsters:[{monsterId:'ultimate_crusher',count:1},{monsterId:'special_spearman',count:1},{monsterId:'blast_archer',count:4}], isHardArea:true },
      { name:'食堂',          monsters:[{monsterId:'crusher',count:3},{monsterId:'strong_soldier',count:3},{monsterId:'ultimate_crusher',count:1}], isHardArea:true },
      { name:'最後の広場',    description:'バイオマンサーが待ち受ける。', monsters:[{monsterId:'biomancer',count:1,isBoss:true}], isHardArea:true },
    ],
  },
  garden: {
    id:'garden', name:'箱庭庭園', description:'モグラのドリュウが死因の大半を占める。',
    icon:'cherry_blossom', tier:'advanced', requiredLevel:20, floors:4, expBonus:2.0, goldBonus:2.0,
    monsterIds:['doryu','pool_ghost','ice_spirit'],
    bossId:'reicho',
    unlockCondition: { dungeonId:'underground_fortress', clearedCount:1 },
    areas:[
      { name:'庭園地上部', monsters:[{monsterId:'doryu',count:3},{monsterId:'pool_ghost',count:5}], isHardArea:true },
      { name:'庭園地下部', monsters:[{monsterId:'ice_spirit',count:6}] },
      { name:'ボスエリア',  monsters:[{monsterId:'reicho',count:2,isBoss:true}], isHardArea:true },
    ],
  },
  frozen_cave: {
    id:'frozen_cave', name:'冷焦洞穴', description:'属性攻撃システムあり。',
    icon:'snowflake', tier:'advanced', requiredLevel:30, floors:3, expBonus:3.0, goldBonus:2.5,
    monsterIds:['ice_spirit','extreme_cold','extreme_fire'],
    bossId:'zero_boss',
    unlockCondition: { dungeonId:'garden', clearedCount:1 },
    areas:[
      { name:'洞窟1層', monsters:[{monsterId:'ice_spirit',count:5}] },
      { name:'極の試練', description:'極冷・極焦が出現。属性攻撃が必須。', monsters:[{monsterId:'extreme_cold',count:1},{monsterId:'extreme_fire',count:1}], isHardArea:true },
      { name:'零の間',  description:'零は洞窟そのもの。', monsters:[{monsterId:'zero_boss',count:1,isBoss:true}], isHardArea:true },
    ],
  },
  sky_castle: {
    id:'sky_castle', name:'天空城', description:'超上級ダンジョン。遠距離攻撃推奨。',
    icon:'castle_jp', tier:'super', requiredLevel:40, floors:5, expBonus:4.0, goldBonus:3.5,
    monsterIds:['roam_armor','death_armor'],
    bossId:'mad_guy_bot',
    unlockCondition: { dungeonId:'frozen_cave', clearedCount:1 },
    areas:[
      { name:'天空城1層', monsters:[{monsterId:'roam_armor',count:3}] },
      { name:'天空城2層', monsters:[{monsterId:'death_armor',count:2},{monsterId:'roam_armor',count:2}] },
      { name:'天空城最上部', description:'マッドガイボットと決戦。', monsters:[{monsterId:'mad_guy_bot',count:1,isBoss:true}], isHardArea:true },
    ],
  },
  dragons_lair: {
    id:'dragons_lair', name:'ドラゴンの塒', description:'伝説のダンジョン。最強の冒険者のみ。',
    icon:'flame', tier:'extreme', requiredLevel:50, floors:10, expBonus:8.0, goldBonus:6.0,
    monsterIds:['dragon'],
    bossId:'dragon',
    unlockCondition: { dungeonId:'sky_castle', clearedCount:1 },
  },
  volcano: {
    id:'volcano', name:'火山', description:'総スポナー数999個。ステインポット対策必須。最難関クラスのダンジョン。',
    icon:'volcano', tier:'volcano', requiredLevel:15, floors:12, expBonus:5.0, goldBonus:4.5,
    monsterIds:['dwarf_leather','dwarf_iron','dwarf_diamond','dwarf_red','dwarf_black','stain_pot','ragnalok'],
    bossId:'volcano_boss',
    unlockCondition: { dungeonId:'fortress', clearedCount:3, requiredLevel:15 },
    areas:[
      { name:'火山内部', description:'ステインポットが多い。最初の難所。', monsters:[{monsterId:'dwarf_leather',count:2},{monsterId:'stain_pot',count:8}] },
      { name:'石材加工場', description:'ドワーフの密度が増加。', monsters:[{monsterId:'dwarf_iron',count:2},{monsterId:'dwarf_leather',count:3},{monsterId:'stain_pot',count:6}] },
      { name:'ポータル街', description:'黒ドワーフとの初接敵！', monsters:[{monsterId:'dwarf_diamond',count:3},{monsterId:'dwarf_red',count:2},{monsterId:'dwarf_black',count:1}], isHardArea:true },
      { name:'炭鉱[難所]', description:'ラグナロクが初登場！黒ドワーフも複数湧く。', monsters:[{monsterId:'dwarf_black',count:3},{monsterId:'ragnalok',count:1},{monsterId:'stain_pot',count:10}], isHardArea:true },
      { name:'赤岩回廊', description:'後半戦の始まり。難易度が大幅上昇。', monsters:[{monsterId:'dwarf_red',count:3},{monsterId:'dwarf_black',count:2},{monsterId:'ragnalok',count:1},{monsterId:'stain_pot',count:8}], isHardArea:true },
      { name:'火山街[難所]', description:'全ての敵が総動員。ラグナロク2体が大門前に待つ。', monsters:[{monsterId:'ragnalok',count:2},{monsterId:'dwarf_black',count:4},{monsterId:'stain_pot',count:12}], isHardArea:true },
      { name:'大橋地帯[最難関]', description:'全モンスターが本気でプレイヤーを殺しに来る最終エリア。', monsters:[{monsterId:'volcano_boss',count:1,isBoss:true},{monsterId:'dwarf_black',count:5},{monsterId:'ragnalok',count:3}], isHardArea:true },
    ],
  },
};

// ============================================================
// ギャンブルマスター
// ============================================================
export const GAMBLE_MASTER: Record<string, GambleMaster> = {
  chohan: {
    id:'chohan', name:'丁半', description:'ダイス2個の合計が偶数(丁)か奇数(半)を当てる。',
    icon:'dice', type:'chohan', minBet:10, maxBet:50000, returnRate:0.97,
    rewardTable:[
      { label:'丁（偶数）当たり！', probability:0.4850, multiplier:2.0, symbols:['⚀⚂'] },
      { label:'半（奇数）当たり！', probability:0.4850, multiplier:2.0, symbols:['⚁⚃'] },
      { label:'ゾロ目（引き分け）', probability:0.0300, multiplier:0.7, symbols:['⚀⚀'] },
    ],
  },
  chinchiro: {
    id:'chinchiro', name:'チンチロリン', description:'ダイス3個で役を作る。',
    icon:'target', type:'chinchiro', minBet:50, maxBet:100000, returnRate:0.96,
    rewardTable:[
      { label:'ピンゾロ（1-1-1）',  probability:0.005, multiplier:10.0, symbols:['1','1','1'] },
      { label:'シゴロ（4-5-6）',    probability:0.028, multiplier:5.0,  symbols:['4','5','6'] },
      { label:'ゾロ目',            probability:0.090, multiplier:3.0,  symbols:['🎲','🎲','🎲'] },
      { label:'ヒフミ（1-2-3）',   probability:0.028, multiplier:0.5,  symbols:['1','2','3'] },
      { label:'目なし',            probability:0.150, multiplier:0.0,  symbols:['💨','💨','💨'] },
      { label:'通常（数字目）',    probability:0.699, multiplier:1.6,  symbols:['🎲','🎲','🔢'] },
    ],
  },
  jackpot: {
    id:'jackpot', name:'ジャックポット', description:'他のギャンブルで賭けるたびにプールが積み上がる。超低確率で全額獲得！',
    icon:'star_glow', type:'jackpot', minBet:100, maxBet:100, returnRate:0.60,
    rewardTable:[
      { label:'🌟 JACKPOT!! 🌟', probability:0.003, multiplier:0, symbols:['🌟','🌟','🌟'] },
      { label:'はずれ',          probability:0.997, multiplier:0, symbols:['💨','💨','💨'] },
    ],
  },
  poker: {
    id:'poker', name:'簡易ポーカー', description:'5枚の手札を1回チェンジ。役を作って配当ゲット。',
    icon:'joker_card', type:'poker', minBet:50, maxBet:50000, returnRate:0.99,
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
    icon:'slot_machine', type:'slot', minBet:10, maxBet:10000, returnRate:0.96,
    rewardTable:[
      { label:'💰💰💰 JACKPOT', probability:0.005, multiplier:50,  symbols:['💰','💰','💰'] },
      { label:'⭐⭐⭐ BIG WIN', probability:0.025, multiplier:10,  symbols:['⭐','⭐','⭐'] },
      { label:'🍒🍒🍒 MIDDLE', probability:0.060, multiplier:5,   symbols:['🍒','🍒','🍒'] },
      { label:'🍋🍋🍋 SMALL',  probability:0.110, multiplier:2.5, symbols:['🍋','🍋','🍋'] },
      { label:'🍒🍒 2枚揃い',  probability:0.280, multiplier:1.3, symbols:['🍒','🍒','🔔'] },
      { label:'ハズレ',        probability:0.520, multiplier:0,   symbols:['💨','💨','💨'] },
    ],
  },
  treasure_box: {
    id:'treasure_box', name:'宝箱くじ', description:'宝箱を開けてみよう。1回30,000G',
    icon:'box', type:'treasure_box', minBet:30000, maxBet:30000, returnRate:0.92,
    rewardTable:[
      { label:'ドラゴンの鱗（超激レア！）', probability:0.003, multiplier:0,   itemRewards:[{itemId:'dragon_scale',amount:1}], symbols:['🐉'] },
      { label:'古代の欠片×3（激レア）',     probability:0.005, multiplier:0,   itemRewards:[{itemId:'ancient_shard',amount:3}], symbols:['💎'] },
      { label:'300,000G大当たり！',          probability:0.002, multiplier:10,  symbols:['💰'] },
      { label:'100,000G当たり！',            probability:0.07,  multiplier:3.334, symbols:['🤑'] },
      { label:'回復セット（メガポ10・焼肉50）', probability:0.17, multiplier:0, itemRewards:[{itemId:'mega_potion',amount:10},{itemId:'roast_meat',amount:50}], symbols:['🧪'] },
      { label:'50,000G',                    probability:0.25,  multiplier:1.667, symbols:['🪙'] },
      { label:'ハズレ（空の宝箱）',          probability:0.50,  multiplier:0,   symbols:['📭'] },
    ],
  },
  coin_flip: {
    id:'coin_flip', name:'コインフリップ', description:'表か裏か。シンプルな50/50ギャンブル。',
    icon:'coin', type:'coin_flip', minBet:10, maxBet:50000, returnRate:0.98,
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
  id: string; name: string; requiredFishingLv: number; unlocksNode: string; description: string;
}> = {
  basic_rod:   { id:'basic_rod',   name:'基本の釣り竿',    requiredFishingLv:1,  unlocksNode:'fishing_pond',         description:'最初から使える竿。' },
  ore_rod:     { id:'ore_rod',     name:'鉱石ロッド',      requiredFishingLv:5,  unlocksNode:'fishing_ore_pond',     description:'鉱石も釣れる中級竿。' },
  all_rod_x:   { id:'all_rod_x',   name:'オールロッドX',   requiredFishingLv:10, unlocksNode:'fishing_ticket_pond',  description:'釣りチケットが釣れる。' },
  master_rod:  { id:'master_rod',  name:'マスターロッド',  requiredFishingLv:20, unlocksNode:'fishing_master_pond',  description:'Yランダムボックスが釣れる。' },
  ffgg_rod_r6: { id:'ffgg_rod_r6', name:'FFGGロッドRank6', requiredFishingLv:15, unlocksNode:'fishing_ffgg_pond',    description:'FFGG専用。鱗・牙・小判が大量に。' },
  ffggr_rod:   { id:'ffggr_rod',   name:'FFGGRロッド',     requiredFishingLv:30, unlocksNode:'fishing_ggr_pond',     description:'GGR専用。クレートとお金が釣れる。' },
};

// ============================================================
// ゲームバランス定数
// ============================================================
export const EXP_TABLE: number[] = (() => {
  const t = [0];
  for (let lv = 1; lv <= 200; lv++) t.push(Math.floor(Math.pow(lv, 1.8) * 50));
  return t;
})();

// スキル経験値テーブル: 指数関数的増大（現実的なもの）
// level n に達するのに必要な累計経験値 = floor(50 * n^1.6 * (1 + n/100))
export const SKILL_EXP_TABLE: number[] = (() => {
  const t = [0];
  for (let lv = 1; lv <= 100000; lv++) {
    // 1.6乗+補正で段階的に増大（2^nのような爆発的増大はしない）
    t.push(Math.floor(50 * Math.pow(lv, 1.6) * (1 + lv / 200)));
  }
  return t;
})();

export const DEFAULT_PLAYER_STATS = {
  level:1, exp:0, expToNextLevel:0,
  hp:100, maxHp:100, satiety:100, maxSatiety:100,
  attack:10, defense:5,
};

// ============================================================
// バージョン更新履歴
// 【重要】アプリに変更を加えたら必ずここに追記すること。
// このリストの先頭（index 0）が最新バージョンとして起動時ポップアップに表示される。
// フォーマット: { version: 'x.x.x', date: 'YYYY-MM-DD', changes: ['変更内容...'] }
// ============================================================
export const VERSION_PATCHES = [
  {
    version: '2.2.1',
    date: '2026-06-05',
    changes: [
      '⚔️ ダンジョンで装備した武器・防具のボーナスが攻撃力・防御力に正しく反映されるよう修正',
      '🧪 ダンジョン戦闘中に食料・回復アイテムが正常に使用できるよう修正',
      '🎰 PvP対戦で管理者以外のプレイヤーも参加できない問題を修正',
      '📡 オンラインプレイヤーのアクティビティ表示で名前が正しく表示されない問題を修正',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-06-04',
    changes: [
      '📡 プレイヤーアクティビティをチャット風のリアルタイムフィードに刷新！全員の行動が流れるように',
      '⛏️ 採掘・釣りでレアアイテムを入手するとアクティビティフィードに自動投稿',
      '🎰 ギャンブルの勝敗・JACKPOT獲得がアクティビティフィードに表示されるように',
      '🏰 ダンジョンクリアがアクティビティフィードに表示されるように',
      '🏷️ オークション出品がアクティビティフィードに表示されるように',
      '🔧 メンテナンス設定に「概要テキスト」欄を追加。メンテ中の画面に理由が表示されるように',
      '🛡️ 管理者パネルのデータ変更がオンライン中のプレイヤーにも即時強制反映されるよう修正',
      '⚡ Firebase読み取り・書き込みを大幅削減（採掘・クラフト・売買ごとの即時保存を廃止、自動保存のみに統一）',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-06-04',
    changes: [
      '⚔️ PvP対戦にバトルアニメーションを追加！カウントダウン→対戦演出→勝敗表示',
      '🏷️ オークションで出品したアイテムが売れると中央にポップアップ表示',
      '📋 プレイヤーアクティビティ画面に「最近の活動を見る」ボタンを追加',
      '🔍 プレイヤーのダンジョンクリア履歴などの詳細ログが確認可能に',
    ],
  },
  {
    version: '2.0.0',
    date: '2025-06-03',
    changes: [
      '🌋 新ダンジョン「火山」を追加！要塞3クリア・Lv15以上で解放',
      '🔨 製作(クラフト)システムを本実装！スキルLvを上げてアイテム作成',
      '⚔️ PvPギャンブル対戦機能を追加！他のプレイヤーと賭け勝負',
      '🌟 ジャックポットが他のギャンブルプレイで蓄積する仕様に変更',
      '🛠️ 鉄のツルハシ・鉄の斧が採掘/伐採効率を上昇するようになった',
      '👁️ オンライン画面にプレイヤーアクティビティ閲覧機能を追加',
      '⚙️ 管理者(ADMIN)パネルを追加',
      '📧 メール通知設定機能を追加',
      '📊 スキル上限を100000に拡張（経験値は指数関数的増大）',
      '❤️ 時間経過でHP・満腹度が自動回復（5秒で1HP、放置でも回復）',
      '💾 市場売却後にFirebaseへ即時保存するよう修正',
      '🔒 ダンジョン解放条件のバグを修正',
      '🔢 名前変更機能を追加（100G必要）',
      '📢 ゲーム更新時にポップアップ通知が表示されるように',
    ],
  },
];

export const COMMANDS: Record<string, { id:string; name:string; description:string; effect:string; category:'job'|'display'|'protect'|'economy'|'travel' }> = {
  jobs_mining:  { id:'jobs_mining',  name:'/jobs join miner',   description:'採掘職業に就く。',    effect:'mining_income',    category:'job' },
  jobs_fisher:  { id:'jobs_fisher',  name:'/jobs join fisher',  description:'釣り師職業に就く。',  effect:'fishing_income',   category:'job' },
  jobs_woodcut: { id:'jobs_woodcut', name:'/jobs join woodcut', description:'木こり職業に就く。',  effect:'woodcut_income',   category:'job' },
  mls:          { id:'mls',          name:'/mls',               description:'アイテム獲得ログ切替。', effect:'toggle_log',    category:'display' },
  dropnotify:   { id:'dropnotify',   name:'/dropnotify',        description:'ドロップ通知切替。',   effect:'toggle_dropnotify',category:'display' },
  dropprotect:  { id:'dropprotect',  name:'/dropprotect',       description:'レア度別ドロップ設定。', effect:'toggle_protect', category:'protect' },
  gomiprotect:  { id:'gomiprotect',  name:'/gomiprotect',       description:'アイテムを捨てないよう設定。', effect:'toggle_gomi', category:'protect' },
  fly:          { id:'fly',          name:'/fly',               description:'有料で飛行可能。',     effect:'enable_fly',       category:'travel' },
  speedfly:     { id:'speedfly',     name:'/speedfly',          description:'高速飛行。有料。',     effect:'enable_speedfly',  category:'travel' },
  ott:          { id:'ott',          name:'/ott',               description:'OTTに変換。',          effect:'convert_ott',      category:'economy' },
  sb_shop:      { id:'sb_shop',      name:'/sb shop',           description:'ストレージボックス購入。', effect:'open_sb_shop', category:'economy' },
};
