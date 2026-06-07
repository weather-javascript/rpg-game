// src/data/masters.ts

import type {
  ItemMaster, SkillMaster, GatherNodeMaster,
  MonsterMaster, DungeonMaster, GambleMaster, CraftRecipe,
} from '../types/game';

// ============================================================
// アイテムマスター
// ============================================================
export const ITEM_MASTER: Record<string, ItemMaster> = {
  wood:        { id:'wood',        name:'木材',      description:'伐採で手に入る基本素材。',    category:'material',  itemType:'Item',  rarity:'common',    sellPrice:5,    buyPrice:0,    maxStack:-1,  icon:'log' },
  stone:       { id:'stone',       name:'石',        description:'採掘で手に入る基本素材。',    category:'material',  itemType:'Item',  rarity:'common',    sellPrice:4,    buyPrice:0,    maxStack:-1,  icon:'rock' },
  iron_ore:    { id:'iron_ore',    name:'鉄鉱石',    description:'採掘で手に入る鉱石。',        category:'material',  itemType:'Item',  rarity:'uncommon',  sellPrice:25,   buyPrice:0,    maxStack:-1,  icon:'ore_black' },
  coal:        { id:'coal',        name:'石炭',      description:'鉱山で採れる燃料素材。',      category:'material',  itemType:'Item',  rarity:'common',    sellPrice:10,   buyPrice:0,    maxStack:-1,  icon:'coal' },
  gold_ore:    { id:'gold_ore',    name:'金鉱石',    description:'希少な鉱石。高値で売れる。',  category:'material',  itemType:'Item',  rarity:'rare',      sellPrice:120,  buyPrice:0,    maxStack:-1,  icon:'sparkle' },
  emerald:     { id:'emerald',     name:'エメラルド', description:'美しい緑の宝石。',           category:'material',  itemType:'Item',  rarity:'rare',      sellPrice:200,  buyPrice:0,    maxStack:-1,  icon:'emerald' },
  emerald_block:{ id:'emerald_block', name:'エメラルドブロック', description:'エメラルドの塊。', category:'material',  itemType:'Item',  rarity:'epic',      sellPrice:1800, buyPrice:0,    maxStack:99,  icon:'ore_green' },
  ancient_shard:{ id:'ancient_shard', name:'古代の欠片', description:'ダンジョンの深部に眠る謎の素材。', category:'material',  itemType:'Item', rarity:'epic', sellPrice:45000, buyPrice:0, maxStack:99, icon:'gem' },
  iron_ingot:  { id:'iron_ingot',  name:'鉄塊',      description:'精錬された鉄。各種製造に必要。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:40, buyPrice:0, maxStack:-1, icon:'iron_ingot' },
  plank:       { id:'plank',       name:'板材',      description:'木材を加工した板。製作に使用。', category:'material',  itemType:'Item', rarity:'common',   sellPrice:8,  buyPrice:0, maxStack:-1, icon:'log' },
  iron_sword:  { id:'iron_sword',  name:'鉄の剣',    description:'鉄塊から作れる武器。攻撃力+5。', category:'weapon',  itemType:'Weapon',   rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:1, icon:'swords', useEffect:{attackBonus:5, message:'鉄の剣で斬りつけた！', attackType:'physical'} },
  iron_helmet: { id:'iron_helmet', name:'鉄のヘルメット', description:'鉄塊から作れる防具。防御力+3。', category:'armor',  itemType:'Armor', rarity:'uncommon', sellPrice:60, buyPrice:0, maxStack:1, icon:'helmet' },
  // 新規追加武器
  golden_bar:  { id:'golden_bar',  name:'金塊',      description:'金鉱石と石炭を使って金塊を作る。', category:'material', itemType:'Item', rarity:'rare', sellPrice:180, buyPrice:0, maxStack:-1, icon:'golden_bar' },
  wooden_knife:{ id:'wooden_knife',name:'木のナイフ', description:'板材から作れるナイフ。攻撃力+1。', category:'weapon', itemType:'Weapon', rarity:'common', sellPrice:15, buyPrice:0, maxStack:1, icon:'wooden_knife', useEffect:{attackBonus:1, message:'木のナイフで刺した！', attackType:'physical'} },
  golden_knife:{ id:'golden_knife',name:'金のナイフ', description:'金塊から作れるナイフ。攻撃力+3。', category:'weapon', itemType:'Weapon', rarity:'uncommon', sellPrice:60, buyPrice:0, maxStack:1, icon:'golden_knife', useEffect:{attackBonus:3, message:'金のナイフで斬りつけた！', attackType:'physical'} },
  diamond_sword:{ id:'diamond_sword',name:'ダイヤの剣', description:'ダイヤモンドから作れる剣。攻撃力+7。', category:'weapon', itemType:'Weapon', rarity:'rare', sellPrice:500, buyPrice:0, maxStack:1, icon:'diamond_sword', useEffect:{attackBonus:7, message:'ダイヤの剣で斬りつけた！', attackType:'physical'} },
  endstone_sword:{ id:'endstone_sword',name:'エンドストーンの剣', description:'エンドストーンから作れる剣。攻撃力+8。', category:'weapon', itemType:'Weapon', rarity:'rare', sellPrice:600, buyPrice:0, maxStack:1, icon:'endstone_sword', useEffect:{attackBonus:8, message:'エンドストーンの剣で斬りつけた！', attackType:'physical'} },
  // 新規追加防具
  iron_chestplate:{ id:'iron_chestplate',name:'鉄のチェストプレート', description:'鉄塊から作れる防具。防御力+5。', category:'armor', itemType:'Armor', rarity:'uncommon', sellPrice:100, buyPrice:0, maxStack:1, icon:'iron_chestplate' },
  iron_leggings:{ id:'iron_leggings',name:'鉄のレギンス', description:'鉄塊から作れる防具。防御力+4。', category:'armor', itemType:'Armor', rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:1, icon:'iron_leggings' },
  iron_boots:  { id:'iron_boots',  name:'鉄のブーツ', description:'鉄塊から作れる防具。防御力+2。', category:'armor', itemType:'Armor', rarity:'uncommon', sellPrice:50, buyPrice:0, maxStack:1, icon:'iron_boots' },
  wooden_bow:  { id:'wooden_bow',  name:'木の弓',    description:'木材から作れる武器。攻撃力+3。', category:'weapon',  itemType:'Weapon',   rarity:'common',   sellPrice:40, buyPrice:0, maxStack:1, icon:'bow_arrow', useEffect:{attackBonus:3, message:'木の弓で矢を放った！', attackType:'physical'} },
  stone_knife: { id:'stone_knife', name:'石のナイフ', description:'石から作れる武器。攻撃力+2。', category:'weapon',  itemType:'Weapon',   rarity:'common',   sellPrice:25, buyPrice:0, maxStack:1, icon:'dagger', useEffect:{attackBonus:2, message:'石のナイフで刺した！', attackType:'physical'} },
  // モンスタードロップ
  cave_fragment:   { id:'cave_fragment',    name:'洞窟の欠片',    description:'洞窟王の手下が落とす欠片。', category:'material',  itemType:'Item', rarity:'common',   sellPrice:8,   buyPrice:0, maxStack:-1, icon:'stone_idol' },
  cave_gem:        { id:'cave_gem',         name:'洞窟王の宝石',  description:'洞窟王が落とす輝く宝石。',  category:'material',  itemType:'Item', rarity:'rare',     sellPrice:200, buyPrice:0, maxStack:99, icon:'gem_blue' },
  rusty_sword:     { id:'rusty_sword',      name:'錆びた剣',      description:'洞窟王が落とす古い剣。攻撃力+3。',    category:'weapon',  itemType:'Weapon',   rarity:'uncommon', sellPrice:50,  buyPrice:0, maxStack:1,  icon:'dagger', useEffect:{attackBonus:3, message:'錆びた剣で斬りつけた！', attackType:'physical'} },
  contract:        { id:'contract',         name:'契約書',        description:'各ダンジョンのモブが低確率で落とす。', category:'treasure',  itemType:'Item', rarity:'uncommon', sellPrice:30, buyPrice:0, maxStack:-1, icon:'scroll' },
  coin:            { id:'coin',             name:'硬貨',          description:'中級ダンジョンの通貨。',    category:'material',  itemType:'Item', rarity:'common',   sellPrice:1,   buyPrice:0, maxStack:-1, icon:'coin' },
  fortress_order:  { id:'fortress_order',   name:'要塞防衛出兵状',description:'鉄戦士が落とす出兵命令書。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:20, buyPrice:0, maxStack:-1, icon:'clipboard' },
  crusher_box:     { id:'crusher_box',      name:'破壊人の道具箱',description:'クラッシャーが落とす道具箱。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:25, buyPrice:0, maxStack:-1, icon:'toolbox' },
  memento:         { id:'memento',          name:'形見の写真',    description:'強戦士が落とす写真。',      category:'material',  itemType:'Item', rarity:'rare',     sellPrice:60,  buyPrice:0, maxStack:99, icon:'photo_frame' },
  hammer:          { id:'hammer',           name:'ハンマー',      description:'アルティメイトクラッシャーが落とす。攻撃力+6。', category:'weapon',  itemType:'Weapon', rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:1, icon:'hammer', useEffect:{attackBonus:6, message:'ハンマーで叩きつけた！', attackType:'physical'} },
  spear_shaft:     { id:'spear_shaft',      name:'槍の柄',        description:'特殊戦闘槍兵が落とす槍の柄。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:35, buyPrice:0, maxStack:-1, icon:'wand' },
  almighty_staff:  { id:'almighty_staff',   name:'万能杖',        description:'バイオマンサーが確定ドロップ。攻撃力+8。', category:'weapon',  itemType:'Weapon', rarity:'rare',     sellPrice:300, buyPrice:0, maxStack:1, icon:'wand', useEffect:{attackBonus:8, message:'万能杖で魔法攻撃！', attackType:'magic'} },
  mole_claw:       { id:'mole_claw',        name:'モグラの爪',    description:'ドリュウが落とす硬い爪。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:40, buyPrice:0, maxStack:-1, icon:'badger' },
  spirit_ice:      { id:'spirit_ice',       name:'霊氷',          description:'氷霊が落とす素材。',       category:'material',  itemType:'Item', rarity:'rare',     sellPrice:80, buyPrice:0, maxStack:99, icon:'ice' },
  stalactite:      { id:'stalactite',       name:'鍾乳石',        description:'零が確定ドロップ。一度に8個落とす。', category:'material',  itemType:'Item', rarity:'epic', sellPrice:150, buyPrice:0, maxStack:-1, icon:'stalactite' },
  slime_gel:       { id:'slime_gel',        name:'スライムゼリー',description:'スライムが落とす粘液。',  category:'material',  itemType:'Item', rarity:'common',   sellPrice:8,   buyPrice:0, maxStack:-1, icon:'bubbles' },
  goblin_ear:      { id:'goblin_ear',       name:'ゴブリンの耳', description:'ゴブリンの証。',           category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:30,  buyPrice:0, maxStack:-1, icon:'ear' },
  dragon_scale:    { id:'dragon_scale',     name:'ドラゴンの鱗', description:'非常に希少な最高素材。',   category:'material',  itemType:'Item', rarity:'legendary',sellPrice:250000,buyPrice:0, maxStack:10, icon:'dragon' },
  // 火山ドロップ
  magma_stone:     { id:'magma_stone',      name:'マグマストーン', description:'火山内部に存在する岩石。製作の素材。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:35, buyPrice:0, maxStack:-1, icon:'rock' },
  dwarf_fragment:  { id:'dwarf_fragment',   name:'ドワーフの欠片', description:'ドワーフ系統が落とす欠片。', category:'material',  itemType:'Item', rarity:'common',   sellPrice:15, buyPrice:0, maxStack:-1, icon:'pickaxe_hammer' },
  hard_magic_stone:{ id:'hard_magic_stone', name:'硬魔石',        description:'黒ドワーフ等が落とす硬い魔石。', category:'material',  itemType:'Item', rarity:'rare',   sellPrice:200,buyPrice:0, maxStack:99, icon:'magic_stone_purple' },
  magic_stone:     { id:'magic_stone',      name:'魔導石',        description:'赤ドワーフが落とす魔石。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:99, icon:'magic_stone_blue' },
  volcano_crown:   { id:'volcano_crown',    name:'獄炎帝の王冠', description:'獄炎帝が落とす伝説の王冠。', category:'treasure',  itemType:'Item', rarity:'legendary',sellPrice:10000,buyPrice:0, maxStack:1, icon:'crown' },
  extreme_flame_aura:{ id:'extreme_flame_aura', name:'極炎のオーラ', description:'獄炎帝を倒すと入手。', category:'material',  itemType:'Item', rarity:'legendary', sellPrice:5000, buyPrice:0, maxStack:1, icon:'flame' },
  // 道具
  iron_pickaxe:    { id:'iron_pickaxe',     name:'鉄のツルハシ',  description:'採掘効率が上がる。鉄鉱脈から材料を多く取れる。', category:'tool',  itemType:'Item', rarity:'uncommon', sellPrice:50, buyPrice:200, maxStack:1, icon:'pickaxe' },
  iron_axe:        { id:'iron_axe',         name:'鉄の斧',        description:'伐採効率が上がる。木材を多く取れる。',           category:'tool',  itemType:'Item', rarity:'uncommon', sellPrice:50, buyPrice:200, maxStack:1, icon:'axe' },
  // 釣り竿
  basic_rod:      { id:'basic_rod',     name:'基本の釣り竿',   description:'最初からある釣り竿。',  category:'tool',  itemType:'Item', rarity:'common',    sellPrice:10,   buyPrice:50,   maxStack:1, icon:'fishing_rod' },
  ore_rod:        { id:'ore_rod',       name:'鉱石ロッド',     description:'謎の箱から出る釣り竿。', category:'tool',  itemType:'Item', rarity:'uncommon',  sellPrice:100,  buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  all_rod_x:      { id:'all_rod_x',     name:'オールロッドX',  description:'釣りチケットが釣れる。', category:'tool',  itemType:'Item', rarity:'rare',      sellPrice:500,  buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  master_rod:     { id:'master_rod',    name:'マスターロッド', description:'Yランダムボックスが釣れる。', category:'tool',  itemType:'Item', rarity:'epic',   sellPrice:2000, buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  master_rod_z:   { id:'master_rod_z',  name:'マスターロッドZ', description:'資源釣り最上位の竿。', category:'tool',  itemType:'Item', rarity:'epic',      sellPrice:5000, buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  ffgg_rod_r1:    { id:'ffgg_rod_r1',   name:'FFGGロッドRank1', description:'FFGG専用釣り竿。',     category:'tool',  itemType:'Item', rarity:'rare',      sellPrice:300,  buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  ffgg_rod_r3:    { id:'ffgg_rod_r3',   name:'FFGGロッドRank3', description:'提案チケット+OTT64枚で入手。', category:'tool',  itemType:'Item', rarity:'rare', sellPrice:800, buyPrice:0,   maxStack:1, icon:'fishing_rod' },
  ffgg_rod_r6:    { id:'ffgg_rod_r6',   name:'FFGGロッドRank6', description:'FFGG釣り最強。',        category:'tool',  itemType:'Item', rarity:'epic',      sellPrice:5000, buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  ffggr_rod:      { id:'ffggr_rod',     name:'FFGGRロッド',     description:'GGR釣り専用。',         category:'tool',  itemType:'Item', rarity:'legendary', sellPrice:8000, buyPrice:0,    maxStack:1, icon:'fishing_rod' },
  // 魚
  raw_cod:      { id:'raw_cod',     name:'生鱈',     description:'バニラの魚。', category:'food',  itemType:'Heal', rarity:'common',   sellPrice:8,   buyPrice:0, maxStack:-1, icon:'fish', useEffect:{satietyRestore:15,message:'生鱈を食べた。'} },
  raw_salmon:   { id:'raw_salmon',  name:'生鮭',     description:'バニラの魚。', category:'food',  itemType:'Heal', rarity:'common',   sellPrice:10,  buyPrice:0, maxStack:-1, icon:'tropical_fish', useEffect:{satietyRestore:15,message:'生鮭を食べた。'} },
  pufferfish:   { id:'pufferfish',  name:'フグ',     description:'毒がある。',   category:'food',  itemType:'Heal', rarity:'uncommon', sellPrice:5,   buyPrice:0, maxStack:-1, icon:'pufferfish', useEffect:{satietyRestore:5,hpRestore:-20,message:'フグを食べた！毒でHPが減った！'} },
  tropical_fish:{ id:'tropical_fish',name:'熱帯魚',  description:'バニラの魚。', category:'food',  itemType:'Heal', rarity:'uncommon', sellPrice:12,  buyPrice:0, maxStack:-1, icon:'tropical_fish', useEffect:{satietyRestore:12,message:'熱帯魚を食べた。'} },
  brilliant_salmon:{ id:'brilliant_salmon', name:'ブリリアントキングサーモン', description:'FFGGエリア産。', category:'food',  itemType:'Heal', rarity:'rare', sellPrice:80, buyPrice:0, maxStack:99, icon:'fish', useEffect:{satietyRestore:50,hpRestore:30,message:'ブリリアントキングサーモンを食べた！'} },
  hoshi_tuna:  { id:'hoshi_tuna',  name:'ホシネツナ',      description:'FFGGエリア産。', category:'food',  itemType:'Heal', rarity:'rare', sellPrice:90, buyPrice:0, maxStack:99, icon:'tropical_fish', useEffect:{satietyRestore:50,hpRestore:25,message:'ホシネツナを食べた！'} },
  shell_fish:  { id:'shell_fish',  name:'オオグロリクサザエ', description:'FFGGエリア産の貝。', category:'food',  itemType:'Heal', rarity:'rare', sellPrice:70, buyPrice:0, maxStack:99, icon:'shell', useEffect:{satietyRestore:40,hpRestore:20,message:'サザエを食べた！'} },
  arowanna:    { id:'arowanna',    name:'シンリンアロワナ', description:'FFGGエリア産。', category:'food',  itemType:'Heal', rarity:'epic', sellPrice:150, buyPrice:0, maxStack:99, icon:'pufferfish', useEffect:{satietyRestore:60,hpRestore:40,message:'アロワナを食べた！'} },
  // 釣り系
  fishing_ticket:  { id:'fishing_ticket',   name:'釣りチケット',   description:'不死のトーテムに交換できる。', category:'treasure',  itemType:'Item', rarity:'uncommon', sellPrice:50, buyPrice:0, maxStack:-1, icon:'ticket' },
  fishing_ticket_p:{ id:'fishing_ticket_p', name:'釣りチケットプラス', description:'魚や釣りチケットを換算したもの。', category:'treasure',  itemType:'Item', rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:-1, icon:'ticket_striped' },
  totem:           { id:'totem',            name:'不死のトーテム',  description:'Yリアクターの素材。',          category:'treasure',  itemType:'Item', rarity:'rare',     sellPrice:200, buyPrice:0, maxStack:99, icon:'totem' },
  y_random_box:    { id:'y_random_box',     name:'Yランダムボックス', description:'中身はランダム。',            category:'treasure',  itemType:'Item', rarity:'rare',     sellPrice:300, buyPrice:0, maxStack:99, icon:'box' },
  y_reactor:       { id:'y_reactor',        name:'Yリアクター',     description:'釣りの最重要アイテム。',       category:'material',  itemType:'Item', rarity:'epic',     sellPrice:1000,buyPrice:0, maxStack:99, icon:'lightning' },
  z_reactor:       { id:'z_reactor',        name:'Zリアクター',     description:'通常釣りの最終目標。',         category:'material',  itemType:'Item', rarity:'legendary',sellPrice:5000,buyPrice:0, maxStack:99, icon:'battery' },
  nether_proof:    { id:'nether_proof',     name:'ネザー解放の証',  description:'Zリアクターの素材。',          category:'material',  itemType:'Item', rarity:'rare',     sellPrice:500, buyPrice:0, maxStack:99, icon:'volcano' },
  ff_coin_small:   { id:'ff_coin_small',    name:'FF小判',         description:'大判に交換してお金に。',        category:'treasure',  itemType:'Item', rarity:'uncommon', sellPrice:100, buyPrice:0, maxStack:-1, icon:'yen' },
  ff_coin_large:   { id:'ff_coin_large',    name:'FF大判',         description:'高額で売れる。',               category:'treasure',  itemType:'Item', rarity:'rare',     sellPrice:500000,buyPrice:0,maxStack:99, icon:'dollar' },
  scale_low_1:     { id:'scale_low_1',     name:'下位鱗（炎）',   description:'FFGGエリアの下位鱗。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'ore_red' },
  scale_low_2:     { id:'scale_low_2',     name:'下位鱗（水）',   description:'FFGGエリアの下位鱗。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'ore_blue' },
  scale_low_3:     { id:'scale_low_3',     name:'下位鱗（風）',   description:'FFGGエリアの下位鱗。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'ore_green' },
  scale_low_4:     { id:'scale_low_4',     name:'下位鱗（土）',   description:'FFGGエリアの下位鱗。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:200,  buyPrice:0, maxStack:99, icon:'ore_brown' },
  scale_high_1:    { id:'scale_high_1',    name:'上位鱗（炎）',   description:'Rank4以上で入手。',    category:'material',  itemType:'Item', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'flame' },
  scale_high_2:    { id:'scale_high_2',    name:'上位鱗（水）',   description:'Rank4以上で入手。',    category:'material',  itemType:'Item', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'droplet' },
  scale_high_3:    { id:'scale_high_3',    name:'上位鱗（風）',   description:'Rank4以上で入手。',    category:'material',  itemType:'Item', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'vortex' },
  scale_high_4:    { id:'scale_high_4',    name:'上位鱗（土）',   description:'Rank4以上で入手。',    category:'material',  itemType:'Item', rarity:'rare',     sellPrice:1000, buyPrice:0, maxStack:99, icon:'mountain' },
  wolf_fang:       { id:'wolf_fang',       name:'ハーブウルフの牙', description:'FFGGで釣れる牙。',  category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:300,  buyPrice:0, maxStack:99, icon:'tooth' },
  wolf_crystal:    { id:'wolf_crystal',    name:'狼牙魔結晶',     description:'上位鱗の交換素材。',  category:'material',  itemType:'Item', rarity:'rare',     sellPrice:1500, buyPrice:0, maxStack:99, icon:'crystal_ball' },
  caribbean_wave:  { id:'caribbean_wave',  name:'カリブの荒波',   description:'フィーバー中のみ。',   category:'material',  itemType:'Item', rarity:'rare',     sellPrice:800,  buyPrice:0, maxStack:99, icon:'wave' },
  la_juice_normal: { id:'la_juice_normal', name:'ラジュース',      description:'幸運バフ。釣り・採掘効率+30%。', category:'potion',  itemType:'Heal', rarity:'rare', sellPrice:500, buyPrice:0, maxStack:99, icon:'potion_mate', useEffect:{hpRestore:20,satietyRestore:20,message:'ラジュースを飲んだ！幸運バフが付いた！'} },
  la_juice_high:   { id:'la_juice_high',   name:'上位ラジュース',  description:'強力な幸運バフ。釣り・採掘効率+60%。', category:'potion',  itemType:'Heal', rarity:'epic', sellPrice:2000, buyPrice:0, maxStack:99, icon:'drink', useEffect:{hpRestore:50,satietyRestore:50,message:'上位ラジュースを飲んだ！'} },
  crate_leather:   { id:'crate_leather',   name:'革クレート',     description:'GGR釣りで入手。',  category:'treasure',  itemType:'Item', rarity:'common',   sellPrice:50,  buyPrice:0, maxStack:99, icon:'mailbox_closed' },
  crate_gold:      { id:'crate_gold',      name:'金クレート',     description:'GGR釣りで入手。',  category:'treasure',  itemType:'Item', rarity:'uncommon', sellPrice:200, buyPrice:0, maxStack:99, icon:'mailbox_open' },
  crate_diamond:   { id:'crate_diamond',   name:'ダイヤクレート', description:'GGR釣りで入手。',  category:'treasure',  itemType:'Item', rarity:'rare',     sellPrice:800, buyPrice:0, maxStack:99, icon:'mailbox_empty' },
  crate_enhanced:  { id:'crate_enhanced',  name:'強化ダイヤクレート', description:'豪華報酬確定。', category:'treasure',  itemType:'Item', rarity:'epic',    sellPrice:3000,buyPrice:0, maxStack:99, icon:'postbox' },
  polishing_agent_1: { id:'polishing_agent_1', name:'研磨剤Ⅰ',  description:'資源ピッケルの強化素材。', category:'material',  itemType:'Item', rarity:'common',   sellPrice:10, buyPrice:30,  maxStack:-1, icon:'rock' },
  polishing_agent_5: { id:'polishing_agent_5', name:'研磨剤Ⅴ',  description:'研磨剤の中級品。',         category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:50, buyPrice:150, maxStack:-1, icon:'gem' },
  resource_pickaxe:  { id:'resource_pickaxe',  name:'資源ピッケル', description:'採掘効率大幅アップ。',    category:'tool',  itemType:'Item',     rarity:'rare',     sellPrice:500,buyPrice:0,   maxStack:1,  icon:'pickaxe' },
  storage_box:       { id:'storage_box',       name:'ストレージボックス', description:'大量収納。',         category:'tool',  itemType:'Item',     rarity:'uncommon', sellPrice:100,buyPrice:300, maxStack:99, icon:'box' },
  vote_ticket:       { id:'vote_ticket',       name:'提案チケット', description:'運営への提案承認で入手。FFGGロッドの交換に使用。', category:'treasure',  itemType:'Item', rarity:'uncommon', sellPrice:200,buyPrice:0,   maxStack:99, icon:'ballot_box' },
  ontime_ticket:     { id:'ontime_ticket',     name:'OTT(オンタイムチケット)', description:'各種交換に使用。', category:'treasure',  itemType:'Item', rarity:'uncommon', sellPrice:150,buyPrice:0, maxStack:-1, icon:'clock' },
  mystery_key:       { id:'mystery_key',       name:'謎の鍵',    description:'ミステリーBOX開封に必要。', category:'tool',  itemType:'Item', rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:99, icon:'old_key' },
  mystery_box_ore:   { id:'mystery_box_ore',   name:'謎のミステリーBOX', description:'カスタムチケットが出る。', category:'treasure',  itemType:'Item', rarity:'rare', sellPrice:0, buyPrice:0, maxStack:99, icon:'box' },
  resource_ticket:   { id:'resource_ticket',   name:'資源チケット', description:'資源ピッケルで採掘時に入手。', category:'treasure',  itemType:'Item', rarity:'common', sellPrice:30, buyPrice:0, maxStack:-1, icon:'clipboard' },
  ocean_heart:       { id:'ocean_heart',       name:'海洋の心',  description:'TF防具の作成素材。',          category:'material',  itemType:'Item', rarity:'legendary',sellPrice:5000,buyPrice:0, maxStack:10, icon:'magic_stone_blue' },
  dragon_soul:       { id:'dragon_soul',       name:'ドラゴンソール', description:'FFGGで釣れる。',          category:'material',  itemType:'Item', rarity:'epic',     sellPrice:1000,buyPrice:0, maxStack:-1, icon:'dragon_head' },
  // 消耗品
  health_potion:     { id:'health_potion',     name:'回復薬',     description:'HPを50回復する。',         category:'potion',  itemType:'Heal', rarity:'common',   sellPrice:20, buyPrice:60,   maxStack:99, icon:'flask', useEffect:{hpRestore:50,message:'回復薬を飲んでHPが50回復した！'} },
  mega_potion:       { id:'mega_potion',       name:'メガポーション', description:'HPを150回復する。',    category:'potion',  itemType:'Heal', rarity:'uncommon', sellPrice:60, buyPrice:180,  maxStack:99, icon:'pill', useEffect:{hpRestore:150,message:'メガポーションを飲んでHPが150回復した！'} },
  food_ration:       { id:'food_ration',       name:'携帯食料',   description:'満腹度を30回復する。',     category:'food',  itemType:'Heal',   rarity:'common',   sellPrice:5,  buyPrice:20,   maxStack:99, icon:'meat', useEffect:{satietyRestore:30,message:'食料を食べて満腹度が30回復した！'} },
  roast_meat:        { id:'roast_meat',        name:'焼き肉',     description:'満腹度60・HP20回復。',     category:'food',  itemType:'Heal',   rarity:'uncommon', sellPrice:15, buyPrice:50,   maxStack:99, icon:'raw_meat', useEffect:{satietyRestore:60,hpRestore:20,message:'焼き肉を食べてスタミナ全開！'} },
  elixir:            { id:'elixir',            name:'エリクサー', description:'HP・満腹度を全回復する。', category:'potion',  itemType:'Heal', rarity:'epic',     sellPrice:500,buyPrice:2000, maxStack:10, icon:'sparkle', useEffect:{hpRestore:9999,satietyRestore:9999,message:'エリクサーを使い完全回復した！'} },
  emergency_ration:  { id:'emergency_ration',  name:'緊急食料パック', description:'HP・満腹度を50回復する。', category:'food',  itemType:'Heal', rarity:'uncommon', sellPrice:0, buyPrice:0, maxStack:5, icon:'sos', useEffect:{hpRestore:50,satietyRestore:50,message:'緊急食料パックを使用した！'} },
  mystery_box:       { id:'mystery_box',       name:'謎の宝箱',  description:'中身は分からない。',        category:'treasure',  itemType:'Item', rarity:'rare',   sellPrice:0, buyPrice:500, maxStack:99, icon:'box' },
  // ============================================================
  // 眠る素材（カスタム採掘素材）
  // ============================================================
  iron_meteorite:    { id:'iron_meteorite',    name:'鉄隕石の欠片',  description:'Y14〜63の通常資源。約4stに1個出現。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:80,   buyPrice:0, maxStack:-1, icon:'comet' },
  adamantite:        { id:'adamantite',        name:'アダマンタイト', description:'Y8以下の通常資源。約18stに1個出現。', category:'material',  itemType:'Item', rarity:'rare',     sellPrice:300,  buyPrice:0, maxStack:-1, icon:'diamond_blue' },
  comet_shard:       { id:'comet_shard',       name:'彗星の欠片',    description:'Y50以上の通常資源。約8stに1個出現。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:120,  buyPrice:0, maxStack:-1, icon:'star_spin' },
  dragon_bone:       { id:'dragon_bone',       name:'竜の骨',        description:'Y15以上の通常資源。約4stに1個出現。', category:'material',  itemType:'Item', rarity:'rare',     sellPrice:250,  buyPrice:0, maxStack:-1, icon:'bone' },
  super_alloy_maple: { id:'super_alloy_maple', name:'超合金メイプル', description:'Y8のみの通常資源。約36stに1個出現。', category:'material',  itemType:'Item', rarity:'epic',     sellPrice:1200, buyPrice:0, maxStack:99, icon:'maple_leaf' },
  soul_flame:        { id:'soul_flame',        name:'魂の炎',        description:'ネザー全域の資源。約18stに1個出現。', category:'material',  itemType:'Item', rarity:'rare',     sellPrice:400,  buyPrice:0, maxStack:99, icon:'flame' },
  blood_chain:       { id:'blood_chain',       name:'血の鎖',        description:'ネザーY45以下の資源。約18stに1個出現。', category:'material',  itemType:'Item', rarity:'rare',   sellPrice:450,  buyPrice:0, maxStack:99, icon:'chain' },
  rutile_platinum:   { id:'rutile_platinum',   name:'ルチルプラチナ', description:'エンド全域の資源。約18stに1個出現。',  category:'material',  itemType:'Item', rarity:'epic',   sellPrice:900,  buyPrice:0, maxStack:99, icon:'galaxy' },
  // ============================================================
  // マイクラ準拠：原木の種類
  // ============================================================
  oak_log:      { id:'oak_log',      name:'オーク原木',     description:'平原・森林バイオームの木。', category:'material',  itemType:'Item', rarity:'common', sellPrice:6,  buyPrice:0, maxStack:-1, icon:'log' },
  spruce_log:   { id:'spruce_log',   name:'トウヒ原木',     description:'タイガバイオームの木。',     category:'material',  itemType:'Item', rarity:'common', sellPrice:6,  buyPrice:0, maxStack:-1, icon:'pine_tree' },
  birch_log:    { id:'birch_log',    name:'シラカバ原木',   description:'森林バイオームの白い木。',   category:'material',  itemType:'Item', rarity:'common', sellPrice:7,  buyPrice:0, maxStack:-1, icon:'oak_tree' },
  jungle_log:   { id:'jungle_log',   name:'ジャングル原木', description:'ジャングルバイオームの木。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:10, buyPrice:0, maxStack:-1, icon:'palm_tree' },
  acacia_log:   { id:'acacia_log',   name:'アカシア原木',   description:'サバンナバイオームの木。',   category:'material',  itemType:'Item', rarity:'common', sellPrice:7,  buyPrice:0, maxStack:-1, icon:'leaf' },
  dark_oak_log: { id:'dark_oak_log', name:'ダークオーク原木','description':'巨大ツリーバイオームの木。',category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:9, buyPrice:0, maxStack:-1, icon:'log' },
  mangrove_log: { id:'mangrove_log', name:'マングローブ原木','description':'マングローブ湿地の木。',  category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:10, buyPrice:0, maxStack:-1, icon:'leaf' },
  cherry_log:   { id:'cherry_log',   name:'サクラ原木',     description:'サクラバイオームのピンクの木。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:12, buyPrice:0, maxStack:-1, icon:'cherry_blossom' },
  bamboo:       { id:'bamboo',       name:'竹',             description:'ジャングル・竹林で採れる。', category:'material',  itemType:'Item', rarity:'common', sellPrice:3,  buyPrice:0, maxStack:-1, icon:'bamboo' },
  // ============================================================
  // マイクラ準拠：石・岩盤系
  // ============================================================
  cobblestone:    { id:'cobblestone',    name:'丸石',         description:'石を採掘すると取れる基本素材。', category:'material',  itemType:'Item', rarity:'common', sellPrice:2,  buyPrice:0, maxStack:-1, icon:'rock' },
  granite:        { id:'granite',        name:'花崗岩',       description:'地下に生成される無骨な石。',    category:'material',  itemType:'Item', rarity:'common', sellPrice:3,  buyPrice:0, maxStack:-1, icon:'rock' },
  diorite:        { id:'diorite',        name:'閃緑岩',       description:'白みがかった地下の石。',        category:'material',  itemType:'Item', rarity:'common', sellPrice:3,  buyPrice:0, maxStack:-1, icon:'rock' },
  andesite:       { id:'andesite',       name:'安山岩',       description:'灰色の地下の石。',              category:'material',  itemType:'Item', rarity:'common', sellPrice:3,  buyPrice:0, maxStack:-1, icon:'rock' },
  deepslate:      { id:'deepslate',      name:'深層岩',       description:'地下深部の硬い岩石。',          category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:8, buyPrice:0, maxStack:-1, icon:'ore_dark' },
  tuff:           { id:'tuff',           name:'凝灰岩',       description:'地下の鉱石周辺に生成される石。', category:'material',  itemType:'Item', rarity:'common', sellPrice:4,  buyPrice:0, maxStack:-1, icon:'rock' },
  calcite:        { id:'calcite',        name:'方解石',       description:'白い鉱物。溶岩湖周辺に生成。',  category:'material',  itemType:'Item', rarity:'common', sellPrice:5,  buyPrice:0, maxStack:-1, icon:'ore_white2' },
  netherrack:     { id:'netherrack',     name:'ネザーラック', description:'ネザーの基本岩盤。燃え続ける。', category:'material',  itemType:'Item', rarity:'common', sellPrice:2,  buyPrice:0, maxStack:-1, icon:'ore_red' },
  end_stone:      { id:'end_stone',      name:'エンドストーン','description':'エンド次元の岩石。',          category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:15, buyPrice:0, maxStack:-1, icon:'ore_yellow' },
  // ============================================================
  // マイクラ準拠：鉱石
  // ============================================================
  copper_ore:     { id:'copper_ore',     name:'銅鉱石',       description:'Y48付近に多く生成。橙色の鉱石。', category:'material',  itemType:'Item', rarity:'common',    sellPrice:15,   buyPrice:0, maxStack:-1, icon:'ore_brown' },
  copper_ingot:   { id:'copper_ingot',   name:'銅インゴット', description:'銅鉱石を精錬したもの。',         category:'material',  itemType:'Item', rarity:'common',    sellPrice:20,   buyPrice:0, maxStack:-1, icon:'ore_dark_brown' },
  lapis_ore:      { id:'lapis_ore',      name:'ラピスラズリ鉱石','description':'Y0付近に多く生成。青い鉱石。', category:'material',  itemType:'Item', rarity:'uncommon',  sellPrice:40,   buyPrice:0, maxStack:-1, icon:'ore_blue' },
  lapis_lazuli:   { id:'lapis_lazuli',   name:'ラピスラズリ', description:'エンチャントに必要な青い鉱物。', category:'material',  itemType:'Item', rarity:'uncommon',  sellPrice:35,   buyPrice:0, maxStack:-1, icon:'magic_stone_blue' },
  redstone_ore:   { id:'redstone_ore',   name:'レッドストーン鉱石','description':'Y-60付近に多く生成。赤い鉱石。', category:'material',  itemType:'Item', rarity:'uncommon', sellPrice:30,  buyPrice:0, maxStack:-1, icon:'ore_red' },
  redstone:       { id:'redstone',       name:'レッドストーン','description':'回路や醸造台に必要な素材。',   category:'material',  itemType:'Item', rarity:'uncommon',  sellPrice:25,   buyPrice:0, maxStack:-1, icon:'heart' },
  diamond_ore:    { id:'diamond_ore',    name:'ダイヤモンド鉱石','description':'Y-58付近に多く生成。貴重な鉱石。', category:'material',  itemType:'Item', rarity:'rare',    sellPrice:400,  buyPrice:0, maxStack:-1, icon:'gem' },
  diamond:        { id:'diamond',        name:'ダイヤモンド', description:'最高クラスの装備に必要な宝石。', category:'material',  itemType:'Item', rarity:'rare',      sellPrice:350,  buyPrice:0, maxStack:-1, icon:'gem_blue' },
  nether_quartz:  { id:'nether_quartz',  name:'ネザー水晶',   description:'ネザーに生成される白い鉱石。',   category:'material',  itemType:'Item', rarity:'uncommon',  sellPrice:30,   buyPrice:0, maxStack:-1, icon:'ore_white' },
  nether_gold_ore:{ id:'nether_gold_ore',name:'ネザー金鉱石', description:'ネザーに生成される金鉱石。',     category:'material',  itemType:'Item', rarity:'uncommon',  sellPrice:50,   buyPrice:0, maxStack:-1, icon:'star_glow' },
  ancient_debris: { id:'ancient_debris', name:'古代の残骸',   description:'ネザー深部に極わずかに生成。',   category:'material',  itemType:'Item', rarity:'legendary', sellPrice:3000, buyPrice:0, maxStack:64, icon:'ore_dark_brown' },
  netherite_scrap:{ id:'netherite_scrap',name:'ネザライトの欠片','description':'古代の残骸を精錬した素材。', category:'material',  itemType:'Item', rarity:'legendary', sellPrice:2000, buyPrice:0, maxStack:64, icon:'ore_dark' },
  // ============================================================
  // 特殊武器
  // ============================================================
  hengen: {
    id: 'hengen',
    name: '変幻始動す原初の剣斧',
    description: '伝説の始まりを告げる原初の武器。物理と魔法を兼ね備えた剣斧。',
    category: 'weapon',  itemType: 'Weapon',
    rarity: 'legendary',
    sellPrice: 0,
    buyPrice: 0,
    maxStack: 1,
    icon: 'hengen',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="374" height="370"><path fill="#565656" d="M348 9h3l6 1v9l-1 8-4 1v7l-2 4h-5l1 3-1 8h-4v3l-1 7-6 1v4l-3 1-1 2-3 4-3 1-2 4h-4l1 5h-5v3h-2v2l-2 1-3 4v2h-4l-2 4h-3l-2 6-6 1v4l-4 1-1 5-3 1-3 1-1 4h-4l1 5h-5l-1 2q-1 4-5 5l-1 4-5 1v2l-1 2-3 1-1 2q-3 5-8 7l-3 3-7 4-4 4h14l3 5 7 1 8 1 1 4h10l5 1v5h10l1 5h19v4h-2l1 5-6-1v3h18l4 1v6l-4 1h-12l-1 5h-21l1 3h3l8 2v3h-2v2h-2v2l-4 2h6l1 6h10v8h-30l-11 2-2 2-2 2h-3l1 3 3 1 1 4 5 1 1 5h4l2 5h3l1 7-5 1h-12v-6h-7q-3 1-5-2-2-4-4-3h-16v15l-1 1h-5v16l-5 1v15l-1 1h-5v15l-4 2-3-2v-57q-4-3-9-1v20l-7 1v-11h-2l-3-1-1-8v-3l1-6-2 1-7 2-1 4-6 1v3l-1 6 3 5 3 1 1 2q5 3 9 2 3 2 2 5h7l4 4v8l-1 6-5 1v11l-2 6-3 1v20l-1 7h-4l-2 4h-2l-1 3-3-1v-2h-2l1-4v-4l-5-5v-8l-2 1v10l-1 3v5l-1 3h-6l-1-4v-2l-4-1v-2l-1-3v-3q-1-3-5-5l-2-4v-2l-1-2-2-4-5-1v21l-1 5-2 1-4-1v-10h-5q-2-4-2-10 0-2-3-5l-1-12v-3q0-3 2-5l2-1v-8l-4-1v-17q1-6 6-10l5-1v-2l2-5q4-4 4-9h2v-2c5-5 5-5 8-5v-4l4-1q2-9 0-19h-3v4h2q-1 6-5 8h-2v4h-4v4h-4l-1 2-4 6h-3v4h-4l-2 5h-2v2l-4 1v3l-3 1-1 3-1 2-4 1-3 5-3 3-1 2h-2l-2 1-1 3-5 5-2 2h-9q-2-3-2-8v-4l5-1v-2l1-4h5l1-5h4l1-5 5-1 1-4 4-1 1-5h2l3-3 3-3h2v-5h3l3-1 2-5 3-1 2-5h4l1-5h3l2-5h2v-2l-4-1v-2h-4v2l-4 1-1 4h-3l-1 4h-3v2q-5 4-12 5l-3 1v2q-1 4-6 7h-3v2q0 3-4 5H74l-2-1q-2 1-4-3v-3l-7 1-1 2-1 3-12 1-3-1-7-1-1-4h-7l-4-4 1-2H15c-1-4-1-4 1-8h26v-3l-2-1-4-3q-4-3-9-4l-4-2-8-2-1-5-4-1-1-5 16-1h5l1-4h-2l-3-1h-3l-4-4-2-1-8-7 1-5h32v-2l1-3q5-2 11-2h3l2-3h17v3q1 5 4 6 4 5 3 12h2l2 1 1 2 2 1q3 1 4 5 5 0 6-4l1-2h2l1-3h3v-2l3-6v-2h-2l-9 1h-3q-3 1-5-2l-2-4h-8l-1-5 4-2h18l1-8-60-1v-8h10l5 1v-5q4-2 10-1h7v-2l1-4h14l2-5h17l-1-2v-18h-5l-1-7v-5h-5v-9l1-9h5l1 5 6 2v3h2l2 1 1 2q1 4 4 4l2 1v4l1-2 2-1 1-2q2-2 5-2V54l4-2q4 5 3 11l1 7h8l7-1 1 4h3v-9l1-5h6v-2c-2-11-2-11 1-15h4l1 18v11l4-2v-4l1-6 6-1 1 10v7l5 1v10l5 2v11l1 3 5 3 1 6c-1 4-1 4 2 8l2 2 1 6v6l1-2 5-6h2l1-6h4l2-4h3v-2h2l-1-3 1-2h5v-5h2l2-1 1-2 1-2 5-1 1-5 4 1v-6h5l1-2q1-4 5-6l1-4 5 1 1-5h3v-2h2v-5h5v-5l5 1 1-6 6-1v-5h4v-5h5v-2h2v-3l5-1-1-5h6l1-5h3l7-2 1-5h8l4-6 8 1 1-2q2-6 9-4M143 73v4h3v-4zm10 0 1 3Zm1 4 1 4h2v-4zm40 65v3h2v-3zm-1 3 1 4Zm-35 18v2l-4 1-1 7 3 1h7v-4h18l1 3 8 1v-8c-8-5-24-11-32-3m64 6 1 4 1-4zm-119 1 1 4 4 1v-2h-2v-3zm112 1-1 2h4v-2zm-35 2 2 2v-2zm38 0 4 1Zm-48 2-1 7-4-1v7q2 4 6 4h3v-11l5-1 1-5zm-56 1 4 2v3h2v-4zm78 0v10h5v17l-5 1v10l9-1 1-5 4-1 1-14v-2q1-6-2-10h-2v-2l-1-2-6-1zm-78 5v4l4-1v-3zm-4 4 4 1Zm187 9 1 2Zm-127 3v4l4-2v-2zm19 0-3 1v3h4zm-51 17v3h4v-3zm4 3 4 2v-2zm147 2-3 2h4zm-103 28v2h4v-2zm-4 2v4h4v-4zm8 0 1 3Zm-10 4v4h2v-4zm11 5 1 3h2v-3zm3 3 2 2 1-2zm3 2 1 2Zm-32 7 1 3Z"/><path fill="#483d47" d="M224 142h11v11h6v-5h8q-5 6-14 11l-4 4h14l3 5 7 1 8 1 1 4h10l5 1v5h10l1 5h19v4h-2l1 5-6-1v3h18l4 1v6l-4 1h-12l-1 5h-21l1 3h3l8 2v3h-2v2h-2v2l-4 2h6l1 6h10v8h-3l-38 2-2 2-2 2h-3l1 3 3 1 1 4 5 1 1 5h4l2 5h3l1 7-5 1h-12v-6h-7q-3 1-5-2-2-4-4-3h-16v15l-1 1h-5v16l-5 1v15l-1 1h-5v15l-4 2-3-2v-57q-4-3-9-1v20l-7 1v-11h-2l-3-1-1-8v-3l1-6-2 1-7 2-1 4-6 1v3l-1 6 3 5 3 1 1 2q5 3 9 2 3 2 2 5h7l4 4v8l-1 6-5 1v11l-2 6-3 1v20l-1 7h-4l-2 4h-2l-1 3-3-1v-2h-2l1-4v-4l-5-5v-8l-2 1v10l-1 3v5l-1 3h-6l-1-4v-2l-4-1v-2l-1-3v-3q-1-3-5-5l-2-4v-2l-1-2-2-4-5-1v21l-1 5-2 1-4-1v-10h-5q-2-4-2-10 0-2-3-5l-1-12v-3q0-3 2-5l2-1v-8l-4-1v-17q1-6 6-10l5-1v-2l2-5q4-4 4-9h2v-2c5-5 5-5 8-5v-4l4-1q2-9 0-19h-3v4h2q-1 6-5 8h-2v4h-4v4h-4l-1 2-4 6h-3v4h-4l-2 5h-2v2l-4 1v3l-3 1-1 3-1 2-4 1-3 5-3 3-1 2h-2l-2 1-1 3-5 5-2 2h-9q-2-3-2-8v-4l5-1v-2l1-4h5l1-5h4l1-5 5-1 1-4 4-1 1-5h2l3-3 3-3h2v-5h3l3-1 2-5 3-1 2-5h4l1-5h3l2-5h2v-2l-4-1v-2h-4v2l-4 1-1 4h-3l-1 4h-3v2q-5 4-12 5l-3 1v2q-1 4-6 7h-3v2q0 3-4 5H74l-2-1q-2 1-4-3v-3l-7 1-1 2-3 4-9-1-3-1h-2v-6h11l-1-5h28v5h6v-5h5v-6h-5v-5H76v-6h11v-16h11v5h22v-5h16v-17h11v-5h6l1-7h9v-4q5-2 10-1h8l1 4h9v2l3 1h-2v10l5-1 1 11v4l-1 4h-5v10l9-2 1-4 3-1 1-14v-2c0-6 0-6-3-11l-1-1v-2l-4-2h8v-2h-4v-9h6v-5h5v-6h6v-5h5zm-2 27 1 4 1-4zm-7 2-1 2h4v-2zm-35 2 2 2v-2zm38 0 4 1Zm-48 2-1 7-4-1v7q2 4 6 4h3v-11l5-1 1-5zm127 19 1 2Zm-127 3v4l4-2v-2zm19 0-3 1v3h4zm-51 17v3h4v-3zm4 3 4 2v-2zm147 2-3 2h4zm-103 28v2h4v-2zm-4 2v4h4v-4zm8 0 1 3Zm-10 4v4h2v-4zm11 5 1 3h2v-3zm3 3 2 2 1-2zm3 2 1 2Zm-32 7 1 3Z"/><path fill="#d5d5d5" d="M348 9h3l6 1v9l-1 8-4 1v7l-2 4h-5l1 3-1 8h-4v3l-1 7-6 1v4l-3 1-1 2-3 4-3 1-2 4h-4l1 5h-5v3h-2v2l-2 1-3 4v2h-4l-2 4h-3l-2 6-6 1v4l-4 1-1 5-3 1-3 1-1 4h-4l1 5h-5l-1 2q-1 4-5 5l-1 4-5 1v2l-1 2-3 1-1 3-4 2h-8v5h-6v-11h-11v6h-5v5h-6v6h-5v5h-6v9h4v2l-6 1h-3l-6-1v-14h3v3h3v-11h-3v-4l3-1 1-3h4v-4h-4v-4h4v-2l4-4 1-3 1-2 4-1 1-6h4l2-4h3v-2h2l-1-3 1-2h5v-5h2l2-1 1-2 1-2 5-1 1-5 4 1v-6h5l1-2q1-4 5-6l1-4 5 1 1-5h3v-2h2v-5h5v-5l5 1 1-6 6-1v-5h4v-5h5v-2h2v-3l5-1-1-5h6l1-5h3l7-2 1-5h8l4-6 8 1 1-2q2-6 9-4"/><path fill="#5a4259" d="M224 142h11v11h6v-5h8q-5 6-14 11l-4 4h14l3 5 7 1 8 1 1 4h10l5 1v5h10l1 5h19v4h-2l1 5-6-1v3h18l4 1v6l-4 1h-12l-1 5h-21l1 3h3l8 2v3h-2v2h-2v2l-4 2h6l1 6h10v8h-3l-38 2-2 2-2 2h-3l1 3 3 1 1 4 5 1 1 5h4l2 5h3l1 7-5 1h-12v-6h-10l-4-5-3-1v-17h-5v-5h5v4h6v-4h5v-6l-11 1v-6h6v-11h-6v-6h-16v-11h-6v-11h17v16l6-2v2l10 1v5h6v-10l5-1v-5h-16v-17h-6v-5h-20l-4-1v4h-4v-2l-4 1v-2h-4v3h-8v-9h6v-5h5v-6h6v-5h5zm73 52 1 2Zm-8 25-3 2h4z"/><path fill="#675767" d="m130 265 1 4h5v5h6v28h5v-6h6v-16h-6v-6h17v-5h6l-1 2q0 5 3 8l3 1 1 2q5 3 9 2 3 2 2 5h7l4 4v8l-1 6-5 1v11l-2 6-3 1v20l-1 7h-4l-2 4h-2l-1 3-3-1v-2h-2l1-4v-4l-5-5v-8l-2 1v10l-1 3v5l-1 3h-6l-1-4v-2l-4-1v-2l-1-3v-3q-1-3-5-5l-2-4v-2l-1-2-2-4-5-1v21l-1 5-2 1-4-1v-10h-5q-2-4-2-10 0-2-3-5l-1-12v-3q0-3 2-5l2-1v-8l-4-1v-17q1-6 6-10l5-1zm35 5 1 3Z"/><path fill="#736773" d="M76 170v3q1 5 4 6 4 5 3 12h2l2 1 1 2 2 1q3 1 4 5 5 0 6-4l1-2h2l1-3h3l1-5h1v6h27v11h-16v5H98v-5H87v16H76v6h11v5h5v6h-5v5h-6v-5l-27 1v4H43v6l3 1-9-1-1-4h-7l-4-4 1-2H15c-1-4-1-4 1-8h26v-3l-2-1-4-3q-4-3-9-4l-4-2-8-2-1-5-4-1-1-5 16-1h5l1-4h-2l-3-1h-3l-4-4-2-1-8-7 1-5h32v-2l1-3q5-2 11-2h3l2-3z"/><path fill="#222022" d="M210 170h4v3h8l2-3h22v5h6v17h16v5l-4 1-1 10h-6v-5h-8l-4-1-2 1-2-1v-16h-17v11h6v11h3l4-1h4l5 1v6h6v11h-6l1 5h10v6h-5v4h-6v-4h-5v5h5v18h-15v15l-1 1h-5v16l-5 1v15l-1 1h-5v15l-4 2-3-2v-48l1-3v-3q0-3-4-5l-2-1v-5h-5v-6h11v-11h-6v-11h17v-5h16v-11h-16v-6h-14v-3l1-14c0-6 0-6-3-11l-1-1v-2l-4-2h8v-2h4z"/><path fill="#605460" d="M165 42h4l1 17v3l-1 25h-4v6h10v-6h5v22h-16v22h-6v6h-5v-6h-6v6h-5v-11l11-1v-5h-22v11h-6v-6l-5-1v-4h-11v11h5v17H92v5H81v6l-11 1H43v-8h10l5 1v-5q4-2 10-1h7v-2l1-4h14l2-5h17l-1-2v-18h-5l-1-7v-5h-5v-9l1-9h5l1 5 6 2v3h2l2 1 1 2q1 4 4 4l2 1v4l1-2 2-1 1-2q2-2 5-2V54l4-2q4 5 3 11l1 7h8l7-1 1 4h3v-9l1-5h6v-2c-2-11-2-11 1-15m-22 31v4h3v-4zm10 0 1 3Zm1 4 1 4h2v-4z"/><path fill="#ccc" d="M307 65h11v6h-6v5h-5v6h-6v5h-5v6h-6v5h-5v6h-6v5h-11v6h-5v5h-6v11h-16v-5h-6v5h-5v6h16v5h8l-3 6h-10v5h-6v-11h-11v6h-5v5h-6v6h-5v5h-6v9h4v2l-6 1h-3l-6-1v-14h3v3h3v-11h-3v-4l3-1 1-3h4v-4h-4v-4h4v-2l4-4 1-3 1-2 4-1 1-6h4l2-4h3v-2h2l-1-3 1-2h5v-5h2l4-2v3h6l-1 5-4 1-1 10h6v-5h5v-6h6v6h5v-6h6v-5h5v-6h11v-5h6v-6h5v-5h6v-6h5v-5h6z"/><path fill="#2e302f" d="m197 194 1 9-1 1h-5v10l9-2 1-4h17v6h16v11h-16v5h-17v11h6v11h-11v6h5v6l-4 1v20l-7 1v-11h-2l-3-1-1-8v-3l1-6h-4v-4h4v-4h4v-2h-4v-22h5v-11h-5v5h-6v11h-5v11h-6v11h-5v11h-6v-27h6v-6h-6v-5l6-1v-2q2-3 6-5l1-2-7-1v-11h5v5h6v-5h11v-2h4l1-4 1 2 4 3v-3zm-7 55 1 3Zm1 9 1 3h2v-3zm3 3 2 2 1-2zm3 2 1 2Z"/><path fill="#f1f1f1" d="M296 38h5v11h6v5h-6v6h6v11h-6v5h-5v6h-6v5h-5v6h-6v5h-11v6h-5v5h-6v6h-5v-6h-6v6h-5v5h-6v-10l2-1 4-3v-2h-6v-6l5-1 1-5 4 1v-6h5l1-2q1-4 5-6l1-4 5 1 1-5h3v-2h2v-5h5v-5l5 1 1-6 6-1v-5h4v-5h5v-2h2z"/><path fill="#8d408e" d="m66 291 4 1v4l2-1h3l1 4v3l-2 1-3 2v8l-4 2-2-1v2l-3 4q-2 2-2 6v3l-2 1q-5 2-5 6l-4 1v3l-3 7h-2l-2 5c-11-1-11-1-15-3v2H15l-1-10v-17h7l-1-6q4-2 10-1v-4l5-1 2-6h7l4-4h5l1-7h8z"/><path fill="#835184" d="M98 86h5l1 5 6 2v3h2l2 1 1 2q1 4 4 4l2 1 1 4 3 1v11h6v11h-6v-6l-5-1v-4h-11v11h5v17H92v5H81v6l-11 1H43v-8h10l5 1v-5q4-2 10-1h7v-2l1-4h14l2-5h17l-1-2v-18h-5l-1-7v-5h-5v-9z"/><path fill="#691a68" d="M173 169h8l1 4h9v2l3 1h-2v10l5-1v11l-1 3v3l-4-1-1-4-5 1v5h-11v5h-6v-5h-16l-1-5-10-1v11h-22v-5h16v-17h11v-5h6l1-7h9v-4q5-2 10-1m7 4 2 2v-2zm-10 2-1 7-4-1v7q2 4 6 4h3v-11l5-1 1-5zm0 22v4l4-2v-2z"/><path fill="#575757" d="M210 170h4v3h8l2-3h22v5h6v17h16v5l-4 1-1 10h-6v-5h-8l-4-1-2 1-2-1v-16h-17v17h-5v-6h-6v-5h-5v16l-3-1v-2l1-12v-2c0-6 0-6-3-11l-1-1v-2l-4-2h8v-2h4z"/><path fill="#5f4d5f" d="M263 219h5v6h14l14 2v3l11-1v8h-3l-38 2-2 2-2 2h-3l1 3 3 1 1 4 5 1 1 5h4l2 5h3l1 7-5 1h-12v-6h-10l-4-5-3-1v-17h-5v-5h5v4h6v-4h5v-11h6z"/><path fill="#a0a0a0" d="M224 142h11v11h6v-5h8q-5 6-14 11l-4 4h14l3 5 7 1 8 1 1 4 4 1v6h6v11h-22v-17h-6v-5h-20l-4-1v4h-4v-2l-4 1v-2h-4v3h-8v-9h6v-5h5v-6h6v-5h5z"/><path fill="#644763" d="M92 148h22v11h22v-6h-5v-5h11v11h5v5h-11v6h-27v5h11v2h-4l2 1v3h-4v4l-4-1v-3h-2l-9 1h-3q-3 1-5-2l-2-4h-8l-1-5 4-2h18l1-8-25-1 3-1v-6h11zm11 22 1 4 4 1v-2h-2v-3z"/><path fill="#393639" d="M142 148h5v5h17v-5h5v11h-11v6l-3 1-2 15h-6v5h-11v6h-27v-7l8-1 1-3h2v-6h-11v-5h27v-6h11v-5h-5z"/><path fill="#6c616c" d="M187 286v3h7l4 4v8l-1 6-5 1v11l-2 6-3 1v20l-1 7h-4l-2 4h-2l-1 3-3-1v-2h-2l1-4v-4l-5-5v-8l-2-1h3v-11h6v5h5v-27h-5v-11h5v-5z"/><path fill="#cfcfcf" d="M312 71h11v5l-5 1 1 5h-5v3h-2v2l-2 1-3 4v2h-4l-2 4h-3l-2 6-6 1v4l-4 1-1 5-3 1-3 1-1 4h-4l1 5h-5l-1 2q-1 4-5 5l-1 4-5 1-1 4h-11v-5l-2 1-14-1v-6h5v-5h6v5h16v-11h6v-5h5v-6h11v-5h6v-6h5v-5h6v-6h5v-5h6v-6h5z"/><path fill="#603f61" d="M165 42h4l1 17v3l-1 25h-4v6h10v-6h5v22h-16v17h-6l-1-16-4-1V87h4v-5h-4l1-9h3v-9l1-5h6v-2c-2-11-2-11 1-15m-11 35 1 4h2v-4z"/><path fill="#675c67" d="M76 170v3q2 6 6 9l-1 4h-5v6H65v-6H43v11c-15 2-15 2-22-1l-2-3-2-1-8-7 1-5h32v-2l1-3q5-2 11-2h3l2-3z"/><path fill="#120a13" d="M109 120h11l1 4 4 1v6h6v-11h22l1 6h-12v22h-11v5h5v6h-22v-28h-5z"/><path fill="#6e646e" d="M87 214h11v5h5v6h11v-6h11l1-2-1 4h-3l-1 4h-3v2q-5 4-12 5l-3 1v2q-1 4-6 7h-3v2q0 3-4 5H74l-2-1q-2 1-4-3v-3l-7 1-1 2-3 4-9-1-3-1h-2v-6h11l-1-5h28v5h6v-5h5v-6h-5v-5H76v-6h11z"/><path fill="#7d1e7c" d="m197 194 1 9-1 1h-5v10l10-2v7h-11v-5h-5v5h-6v11h-5v11h-6v11h-5v11h-6v-27h6v-6h-6v-5l6-1v-2q2-3 6-5l1-2-7-1v-11h5v5h6v-5h11v-2h4l1-4 1 2 4 3v-3z"/><path fill="#3d343e" d="M182 59v16l5 1v10l5 2v4l-1 11-4 1-1 5h5v11h-16v6h-11v-17h16V87h-5v6h-10v-6h4V71l5-2v-4l1-6z"/><path fill="#8a2388" d="M226 252h4v6l4 1h-3v15l-1 1h-5v16l-5 1v15l-1 1h-5v15l-4 2-3-2v-54l2 1 3-1 1-6h6v-9z"/><path fill="#c1c1c1" d="M307 65h11v6h-6v5h-5v6h-6v5h-5v6h-6v5h-5v6h-6v5h-11v6h-5v5h-6v11h-16v-5h-6v-6h6v-5h5v-6h6v6h5v-6h6v-5h5v-6h11v-5h6v-6h5v-5h6v-6h5v-5h6z"/><path fill="#594f59" d="M235 230h22v6h-5v4h-6v-4h-5v5h5v18l-16-1v-6l-10 2-1 9h-6v6l-4 1-1 4v-4l-3-6-2-1h5v-5h5v-22h22z"/><path fill="#441544" d="M152 196h1v7h11v11h-11v-6h-7l1 2v3l-3 1h-6v3l-4-1v-2h-4v2h-2l-2 1-1 2h-11v6h-11v-6h-5v-5H87v-11h11v5h44v-11l10 1z"/><path fill="#8f698f" d="M153 291h5v16h6v6h5v22h-3v11l-1 3v6l-1 3h-6l-1-4v-2l-4-1-1-5-1-3v-3l1-1v-26l-5-1v-16h6z"/><path fill="#dadada" d="M348 9h3l6 1c-1 6-1 6-3 8l-1 3h-13v6h-17v11h6v5h-6v6l-5-1v-5h-6v6h-11V38l-3-1h3l-1-5h6l1-5h3l7-2 1-5h8l4-6 8 1 1-2q2-6 9-4"/><path fill="#9c659c" d="m121 235 4 1v11h-11v11h4v2l-4 1v3l-3 1-1 3-1 2-4 1-3 5-3 3-1 2h-2l-2 1-1 3-5 5-2 2h-9q-2-3-2-8v-4l5-1v-2l1-4h5l1-5h4l1-5 5-1 1-4 4-1 1-5h2l3-3 3-3h2v-5h3l3-1z"/><path fill="#6f5c70" d="M43 203h10q6 0 11 2v2l6 1v6H54v5h5v6h6v5H43l-1-4-5-2-1-2q-4-3-9-4l-4-2-8-2-1-5-3-1h32z"/><path fill="#6c1c6c" d="M146 208h7v6h20l-2 1-1 2-5 5-1 3h-6l-1-5h-4v21h-5l2-1q2-9 0-19h-3v4h2q-1 6-5 8h-2v4h-4v4h-4l-1 2-4 6h-3v4h-4l-2 5h-6v-11h11v-11l-2-1 3-6h4l1-5h3l2-5h2v-2h4v-3l4-2zm-4 9 4 2v-2z"/><path fill="#7f777f" d="M108 186h1v6h27v11h-16v5H98v-5H87v5H76v-5h-6v-6h17l1-3q4 1 5 4l1 2q5 0 6-4l1-2h2l1-3h3z"/><path fill="#f39ff1" d="M92 136h8l3 1v11H92v5H81v6l-11 1H43v-8h10l5 1v-5q4-2 10-1h7v-2l1-4h14z"/><path fill="#595859" d="M202 208h17v6h16v11h-16v5h-33v-5h5v-6h11z"/><path fill="#bababa" d="M207 128h1v9h11v16h-6v6h-5v5h-6v9h4v2l-6 1h-3l-6-1v-14h3v3h3v-11h-3v-4l3-1 1-3h4v-4h-4v-4h4v-2l4-4z"/><path fill="#652164" d="M212 75h12l1 7 4-1q4 0 7 2v4l-11 1-1 5-4 1v8l-1 3h-5v10l-5 1-2-4v-6l-6-2v-8l1-4h5l-1-3 1-9h5z"/><path fill="#9f65a6" d="M279 130h6l1 11h4l1 7-1 3v2l-4 1-1 6h-10v4l-5 1h-7l-2-5h-8q-2-2-2-5v-2l7-2h4l1-4 10-1 1-5 4-1v-3z"/><path fill="#332d34" d="M213 175h39v17h16v5l-4 1-1 10h-6v-5h-8l-4-1-2 1-2-1v-10h5v-11h-27v5h-6z"/><path fill="#6c5f6b" d="m130 265 1 4h5v5h6v22h-16v15l-1-4-4-1 2-1v-8l-4-1v-17q1-6 6-10l5-1z"/><path fill="#c988ca" d="m15 229 50 1v6l-11 1v4H43v6l3 1-9-1-1-4h-7l-4-4 1-2H15z"/><path fill="#ed81ee" d="M43 186h16v17H43v5H10l-1-5 16-1h5l2-5h11z"/><path fill="#e0e0e0" d="M312 71h11v5l-5 1 1 5h-5v3h-2v2l-2 1-3 4v2h-4l-2 4h-3l-2 6-6 1v4l-4 1-1 5h-11v-6h5v-5h6v-6h5v-5h6v-6h5v-5h6v-6h5z"/><path fill="#453d45" d="M224 186h17v16l6-2v2l10 1v5h6v6h-17v-6h-16v-11h-6z"/><path fill="#873b87" d="M173 169h8l1 4h-2v-3h-5l-1 5 4 1-8-1-1 7h-3v6l4 4-1 5h-5v-5h-28v-6h11v-5h6l1-7h9v-4q5-2 10-1"/><path fill="#e891e8" d="M219 269h11l1 5-1 1h-5v16l-5 1v15l-1 1h-5v15l-4 2-3-2v-7l1-9v-5h5v-22h6z"/><path fill="#969696" d="M263 104h11v5h-6v6h-5v5h-6v11h-16v-5h-6v-6h6v-5h5v-6h6v6h5v-6h6z"/><path fill="#fca8fc" d="M133 52q4 2 4 5v4l1 9h8v3h-3v4h4v5h-5v17l4 1v9l-4-1v-4h-6V87h-5l-1-26v-7z"/><path fill="#424242" d="M208 192h5v5h6v6h5v-6h6v11h3l4-1h4l5 1v6h-5v11h-6v-11h-16v-6h-11z"/><path fill="#545053" d="M186 214h5v11h-5v24h-4v4h-2v-6h-5v11h-11v-6h5v-11h6v-11h5v-11h6z"/><path fill="#a585a5" d="M54 214h16l1 10 16 1v5h5v6h-5v5h-6v-5H65v-11h-6v-6h-5z"/><path fill="#624763" d="M130 81h1v6h5v17h6v2l1 2 3 1v-7l-4-4h5v17h-5v5h-17v-11l-3-1 5-7h3z"/><path fill="#8e788e" d="M256 169h2l5 1 1 4 4 1v6h6v11h-22v-17h-6v-5z"/><path fill="#362e37" d="M268 203h6v5h11v6l12-1 1 4h-2v2h-2v2l-4 2h6l1 6h6v1h-7l-1-3-10-1h-3l-3-1h-11zm21 16-3 2h4z"/><path fill="#1b191b" d="M87 203h11v5h27v6h-11v11h-11v-6h-5v-5H87z"/><path fill="#b6b6b6" d="M323 27h11v5h6v17h-6v5h-16v-5h-6v-6h6l1 5 4 1v-6h6v-5h-6z"/><path fill="#a642a9" d="M263 219h5v6h14l14 2v3l11-1v8h-33v-7h-11z"/><path fill="#cb90d2" d="M165 42h4l1 18v3l-1 19h-5v5h-6l-1-18v-3l1-7h6v-2c-2-11-2-11 1-15"/><path fill="#272427" d="M109 120h11l1 4 4 1v6h6v11h-6v6h-11v-17h-5z"/><path fill="#711970" d="M26 324h6v11h5v-6h11v6h2v2h-2v3H37v6H21v-17h5z"/><path fill="#727172" d="M175 120h16v17h-5v11h-11z"/><path fill="#4f4f50" d="M131 148h11v11h5v5h-11v6h-22v-11h22v-6h-5z"/><path fill="#ddd" d="M348 9h3l6 1c-1 6-1 6-3 8l-1 3h-13v6h-22l-1-6 8-1 4-4 1-2 8 1 1-2q2-6 9-4"/><path fill="#e2e2e2" d="M296 38h5v11h6v5h-6v6h6v11h-6v5h-5v-5h-6v-6h6v-5h-7l1-4v-3l1-2 2-1 3 1-1-3-1-7h2z"/><path fill="#261f26" d="M164 109h27v11h-16v6h-11z"/><path fill="#da9cdb" d="M252 241h6l1 5 4 1 1 4 5 1 1 5h4l2 5h3l1 7-5 1h-12v-6h-5v-1h5v-5h-6v-6h-5z"/><path fill="#df87df" d="m296 193 2 1v2h22l4 1v6l-4 1h-12l-1 5h-17v-2h-5v-4h5v-6h6z"/><path fill="#4f4a50" d="M136 192h28v11h-11l-1-5-10-1v11h-22v-5h16z"/><path fill="#bb57ba" d="M84 169h18l1 2q1 3 5 4l1-2v2h11v2h-4l2 1v3h-4v4l-4-1v-3h-2l-9 1h-3q-3 1-5-2l-2-4h-8l-1-5z"/><path fill="#b8b8b8" d="M125 192h11v11h-16v5H98v-5h11v-6h16z"/><path fill="#252325" d="M153 220h4l1 10h6v6h-6v22h-11v-17h6z"/><path fill="#764e75" d="M98 263h5v9q0 5-4 7l-1 2h-2l-2 1-1 3-5 5-2 2h-9q-2-3-2-8v-4h2l3-1 1-2v3h11v-11h6z"/><path fill="#8b7f8a" d="M164 269h6l-1 2q0 5 3 8l3 1 1 2q5 3 9 2l-5 2v5h-5v11h-6v-6h-5zm1 1 1 3Z"/><path fill="#c6c6c6" d="M356 13h1v9l-1 5-4 1v7l-2 4h-5l1 6-1-2h-5V32h-6v-5h6v-6h13v-5h3z"/><path fill="#744374" d="M53 236h28v5h-5v6l-6 1-2-6-7 1-1 2-3 4-9-1-3-1h-2v-6h11z"/><path fill="#cf8fcf" d="M65 147h4v1h-6v2h-2v3h20v6l-11 1H43v-8h10l5 1v-5z"/><path fill="#7a6f7a" d="M191 89h1v10l1 3 5 3 1 6c-1 4-1 4 2 8q3 2 2 5v6l-1 7h-4v4h4v4h-4l-1 4h-3v-4h2l1-25h-6v-11h-5v-5l4-1v-2z"/><path fill="#423b42" d="M175 60h5v27h-5v6h-10v-6h4V71l5-2v-8z"/><path fill="#574a57" d="M87 214h11v5h5v11H87v-5H76v-6h11z"/><path fill="#757575" d="M147 131h6v6h5v11h6v5h-17v-5h-5v-11h5z"/><path fill="#481749" d="M174 181h6v11h6v11h-11v5h-6v-5h-5v-6h5v-5h5zm-4 16v4l4-2v-2z"/><path fill="#995c99" d="M224 81h7l5 2v4l-11 1-1 5-4 1v8l-1 3h-5v10l-5 1-2-4 1-14h5v-5h6v-6h5z"/><path fill="#8c738b" d="M15 335h6v11h16v-6h11l1-3c-1 7-1 7-3 10h-2l-2 5c-11-1-11-1-15-3v2H15l-1-11 1-3z"/><path fill="#fbb2fc" d="M131 302h5l1 33v3l-1 13-5 1-1-8v-4l-4-2v-3h5z"/><path fill="#e17fe2" d="M164 313h5v22h-3v2h-2v14h-6v-27h6z"/><path fill="#a9a9aa" d="M158 236h17v5h-6v11h-5v11h-6z"/><path fill="#7f7f7f" d="M208 214h27v11h-22v-6h-5z"/><path fill="#555" d="M142 148h5v5h17v-5h5v11h-11v5h-11v-5h-5z"/><path fill="#926691" d="m66 291 4 1v4l2-1h3l1 4v3l-2 1-3 2v8l-4 2q-2-1-2-6v-3h-5v-4h-6v-7l8-1h2z"/><path fill="#610463" d="M274 148h16v5l-4 1-1 6h-10v4l-5 1h-7v-6h5v-6h6z"/><path fill="#d3d3d3" d="M268 109h6v6l2-1 6 2-3 1-1 4h-4l1 5h-5l-1 2q0 4-4 4l-2 1v-6l-6-1v-6h6v-5h5z"/><path fill="#4a3c49" d="M213 236h11v5h-4l-1 22h-6v6l-4 1-1 4v-4l-3-6-2-1h5v-5h5z"/><path fill="#181818" d="M175 247h5v10l2 1-2 1-3 3-1 2-6 1-1 4h-5v5h-6v-5h-5v-6h11v-5h11z"/><path fill="#c9bac9" d="M37 307h6v6h-6v5h-5v6h-6v5h-5v6h-7v-11h7l-1-6q4-2 10-1v-4h2l3-1z"/><path fill="#8d628d" d="M43 203h11v4h-6v7l-14 1H23l-8-1-1-5-3-1h32z"/><path fill="#7a5b7a" d="m121 235 4 1v11h-11v11h4v2l-4 1v3l-3 1-1 3-1 2-4 1-2 2v-10h6v-16l4-1v-5h3l3-1z"/><path fill="#c98cc9" d="M98 86h5l1 5 6 2v3h2l2 1 2 5 4 1v6h-11v-5h-6v-6h-5l-1 3v-9z"/><path fill="#534852" d="M37 219h22v6h6v5H43l-1-4-5-2z"/><path fill="#403241" d="m154 70-1 12h4v5h-4v6h-6v5h-5V82h5v-2l-1-2v-3l1-5z"/><path fill="#522352" d="M131 230h5v11h-2l-1 2-4 6h-3v4h-4l-2 5h-6v-11h11v-11h6z"/><path fill="#838383" d="M186 230h16v17h-11v-6h-5z"/><path fill="#2c2a2b" d="M191 120h6v22h-6v17h-5v-22h5z"/><path fill="#aeaeae" d="M307 65h11v6h-6v5h-5v6h-6v5h-11v-5h6v-6h5v-5h6z"/><path fill="#802781" d="M147 181h6v5l12-1 2 5 3 2-1 5h-5v-5h-28v-6h11z"/><path fill="#c1c1c1" d="M246 109h6v11h-6v6h11v5h-16v-5h-6v-6h6v-5h5z"/><path fill="#ababab" d="M224 142h11v11h6v-5h8c-11 11-11 11-16 11h-3v5l-5-1q-3-5-1-10h6v-5h-6z"/><path fill="#964395" d="m203 59 6 2v15l-6 1v5l-6 1q-2-4-1-9v-8l2-2h3z"/><path fill="#766876" d="m147 312 5 1 1 19v7l-4 1-6-12-4-3h-2v8h-1v-9h6v-6h5z"/><path fill="#e2e2e2" d="M340 43h5v7h-4v3l-1 7-6 1v4l-3 1-2 5h-5l-2-3 1-2v-6h6v-6h5v-5h6z"/><path fill="#181218" d="M241 214h11v11h-6v5h-22v-5h17z"/><path fill="#090907" d="M109 170h16v5h11v6h-4l-1 5h-11v-11h-11z"/><path fill="#3e3b3e" d="M246 208v6h-5v11h-6v-11h-16v-6l12-1h9z"/><path fill="#752d73" d="M146 208h7v6h20l-2 1-1 2-5 5-1 3h-6l-1-5-11-1v-2h-4v-3l4-2z"/><path fill="#323132" d="M213 175h33v6h-27v5h-6z"/><path fill="#a965a8" d="M119 308h1v10h5v-5h6v22h-5v3l5 2v5l-1-4h-5q-2-4-2-10 0-2-3-5l-1-12z"/><path fill="#574e56" d="M186 285v28h-6v-11h-5v-11h5v-5z"/><path fill="#2b262a" d="m289 180 1 5h19v4h-2l1 5h-2l-13-2h-8v-6h-6v-5z"/><path fill="#ab34ab" d="m120 104 1 2 4 3v11h6v11h-6v-6l-5-1v-4h-6v-11h6z"/><path fill="#714471" d="M136 280h6v16h-16v15l-1-4-4-1 2-1v-4l2-9q3-4 6-3v-4h5z"/><path fill="#a91ba9" d="M299 158h4q3 0 5 2l-1 5h-5v5l-10 1h-2l-5-1-1-5 1-2h5v-4z"/><path fill="#c2c2c2" d="M230 137h16v5h8l-3 6h-10v5h-6v-11h-5z"/><path fill="#b49ab5" d="M153 291h5v16h6v17h-6v-11h-5z"/><path fill="#ac8dac" d="M60 302v4h5v7H43v-6h-6v-1h7l4-4z"/><path fill="#88508a" d="M92 148h11l-1 12H78l3-1v-6h11z"/><path fill="#594e5a" d="M142 280h11v16h-6v6h-5z"/><path fill="#907f91" d="M43 186h16v17h-5v-6H43z"/><path fill="#9c5c9a" d="m185 260 1 3 4 1 1 5 5-1 1-2-5-1 1-3h4l1 8v15l-7 1v-11h-2l-3-1-1-8z"/><path fill="#413845" d="M230 241h5v6h6v5h4v4h-3l-1 3-11-1v-6h-6v-5h6z"/><path fill="#8b758c" d="m197 194 1 9-1 1h-5v10l10-2v7h-11v-5h-11v-6h6v-7h4l1-4 1 2 4 3v-3z"/><path fill="#b299b2" d="M175 302h5v27h-5v-5h-6v-11h6z"/><path fill="#241d25" d="M153 120h5v6h6v5h-6v6h-5v-6h-6v6h-5v-11l11-1z"/><path fill="#a15ba0" d="M226 252h4v6l4 1h-3v11l-12-1v-15z"/><path fill="#80587e" d="M246 241h6v11h5v6h6v5l-10 1-4-5-3-1z"/><path fill="#524952" d="M147 164h11l-3 2-1 7-1 4v4h-6v5h-5v-16h5z"/><path fill="#e782e7" d="M279 225c12 0 12 0 17 2v3l11-1v8h-10l-7-1v-6h-11z"/><path fill="#434343" d="M191 142h3v11h3v11h-3v-3h-3v8l-5-5v-3h-4v-2h-2v-11h6v11h5z"/><path fill="#949495" d="M114 159h11v5h11v6h-22z"/><path fill="#513f52" d="M125 131h6v11h-6v6h-11v-11h11z"/><path fill="#9d9d9d" d="M312 43h6l1 5 4 1v-6h11v11h-16v-5h-6z"/><path fill="#746774" d="M153 93h5v16h6v17h-6l-1-16-4-1z"/><path fill="#5b4e5c" d="M158 94h6v10h5v-6h6v11h-17z"/><path fill="#393439" d="M175 335h11l1 7v4l-1 5h-11z"/><path fill="#433c45" d="M59 181h22l1 4-4 1h-2v6H65v-6h-6z"/><path fill="#4c4a4b" d="M118 181h2v5h16v6h-27v-7l8-1z"/><path fill="#726672" d="M164 203h5v5h6v-5h11v5h-6v6h-16z"/><path fill="#6e0e6f" d="m213 76 3 1-2 7-2 3h1v11h-5v7l-7-1v-8l1-4h5l-1-3 1-6 6-1z"/><path fill="#ccc" d="M312 32h7l-1 5 11 1v5h-6v6l-5-1v-5h-10l-1-5h5z"/><path fill="#a6a6a6" d="M224 186h17v6h-6v5h3v4h-4v-4h-10z"/><path fill="#792977" d="M126 296h10v6h-5v11h-6v5h-5v-11h5z"/><path fill="#746774" d="M54 214h16v16h-5v-5h-6v-6h-5z"/><path fill="#474749" d="M202 208h17v6h-11v11h-6z"/><path fill="#705272" d="M175 222v14h-11v-6h-6v-5l8-1 2-1z"/><path fill="#766a76" d="m130 265 1 4h5v5l-4 1-1 5h-6v5h-5v-10q3-5 8-7h2z"/><path fill="#535353" d="M219 181h27v11h-5v-6h-22z"/><path fill="#0e0a0f" d="M142 120h11l1 6h-12v15l-1 1h-5v-16l5-1z"/><path fill="#c046c2" d="M43 230h22v6l-11 1v4h-6v-5h-5z"/><path fill="#dcdcdc" d="M285 98h5v6l4 1h-4v4l-4 1-1 5h-11v-6h5v-5h6z"/><path fill="#907f91" d="M70 197h17v11H76v-5h-6z"/><path fill="#9c8a9c" d="M164 285h10l1 5v12h-6v-6h-5z"/><path fill="#b3b3b3" d="M207 128h1v9h11v11h-11l-1-10-5-1 1-4 3-2z"/><path fill="#db69dd" d="M263 258h5v5h6l1-3 1 2h3l1 7-5 1h-12v-6h-5v-1h5z"/><path fill="#634863" d="M224 236h11v5h-5v6h-6v5l-5 2v-14l5 1z"/><path fill="#322c31" d="M125 208h17v3l-2 1-4 2h-6v2h-2l-2 1-1 2h-11v-5h11z"/><path fill="#636363" d="M213 186h11v17h-5v-6h-6z"/><path fill="#5c5c5d" d="M175 120h16v17h-5v-11h-11z"/><path fill="#514a51" d="M268 219h21l1 4h6l1 6h6v1h-7l-1-3-10-1h-3l-3-1h-11z"/><path fill="#bfbfbf" d="M340 21h5v17h5v1h-5l1 6-1-2h-5V32h-6v-5h6z"/><path fill="#dcdcdc" d="m234 101 1 3h6l-1 5-4 1-1 16h-5v-9l-1-7v-7h2z"/><path fill="#4b354b" d="M279 186h6v6h9l8 1v4h-4v-4h-2v4l-8 1h-8l-1-4z"/><path fill="#483d48" d="M252 192h16v5l-4 1-1 10h-6v-11h-5z"/><path fill="#3a333a" d="M13 180h11l3 1h10v5H10l-2-4q2-2 5-2"/><path fill="#7b627d" d="M142 98h5v17h-5v5h-6v-16h6v2l1 2 3 1v-7z"/><path fill="#725273" d="m98 169 5 1 1 3 4 2 1-2v2h11v2h-4l2 1v3h-4v4l-4-1v-3l-8 1 1-7h-5z"/><path fill="#b082b0" d="m296 193 2 1v2h22l4 1v6q-4 2-9 2h-8v-2l16-1-1-3h-16l-5-1v5h-11v-6h6z"/><path fill="#444244" d="M153 220h4l1 10h6v6h-6v5h-5z"/><path fill="#504350" d="M235 236h6v5h5v18h-4v-3h3v-4h-4v-5h-6z"/><path fill="#e49ae4" d="M208 302h5v5h6v1h-5v15l-4 2-3-2v-7l1-9z"/><path fill="#373037" d="M279 208h6v6l12-1 1 4h-2v2h-2v2h-4v-2h-11z"/><path fill="#e691e5" d="M32 197h22v5c-7 0-7 0-10-2h-6l-2 3-9 1h-4l-3 1H9v-2l16-1h5z"/><path fill="#6c516d" d="M263 218h5v1h-5v6h-6v5l-11 1v-6h6v-6z"/><path fill="#fb94fb" d="M158 329h6v22h-6z"/><path fill="#70676f" d="M146 241h1v11h-5v11h-10l4-11h2v-2c5-5 5-5 8-5z"/><path fill="#726572" d="m277 174 2 1v5l2 1h-2v11h-5v-11h-6v-6z"/><path fill="#8c2a8b" d="M103 136h11v12h-11z"/><path fill="#716172" d="M81 225h6v5h5v6h-5v5h-6z"/><path fill="#734273" d="m138 217 5 1 10 1v22h-5l2-1q2-9 0-19h-3v4h-11v-6h2z"/><path fill="#766b76" d="M76 186h5l1 2 3 4h2v5H70v-5h6z"/><path fill="#817381" d="M14 180h28l-4 1v5h5v11H32v-5h5v-11H14z"/><path fill="#e6e6e6" d="M296 87h5v11h-3l-2 6h-6V93h6z"/><path fill="#655365" d="M76 296v6l-2 1-3 2v8l-4 2q-2-2-2-5v-3l4-2v-3h-4v-6z"/><path fill="#a67ea5" d="M80 277h1v8h10q-3 7-6 7h-8q-2-3-2-8v-4l5-1z"/><path fill="#624762" d="M186 249h4l1 3 2 2-1 6 2 1-2 4 5 1-1 3h-5l-1-2-1-3-3-1v-6h-4v-4h4z"/><path fill="#695c69" d="M164 302h11v11h-11z"/><path fill="#463a46" d="M136 296h6v6h5v11h-5v-6h-6z"/><path fill="#80717f" d="M147 274h11v17h-5v-11h-6z"/><path fill="#664865" d="M65 236h16v5h-5v6l-6 1v-7h-6z"/><path fill="#2b232a" d="M219 225h5v5h11v6h-16z"/><path fill="#8a8b8b" d="M186 230h11v11h-11z"/><path fill="#6a6a6a" d="M108 186h1v6h16v5h-22v-5l4-1z"/><path fill="#705b70" d="M252 181h5v5h11v6h-16z"/><path fill="#1c191e" d="M169 115h17v5h-11v6h-6z"/><path fill="#ddd" d="M257 98h6v11h-6v6h-5v-11h5z"/><path fill="#3c233c" d="M131 120h11v5l-1 1h-5v11h-5z"/><path fill="#ababac" d="M125 192h11v11h-11z"/><path fill="#6a6069" d="M76 241h16v7q-9 2-18 0l2-1z"/><path fill="#706170" d="M22 214h26v5H37l-1 3-2-2-3-1c-4-1-4-1-9-5"/><path fill="#a167a0" d="m207 281 1 4h5v17h-5l1 9-2 1z"/><path fill="#393239" d="M241 192h5v5h11l1 6h-9l-4-1-2 1-2-1z"/><path fill="#691c68" d="M268 153h6v6l10-1 1 2h-10v4l-5 1h-7v-6h5z"/><path fill="#fbaffb" d="M219 269h11v4l-7 1v15h-3l-1 2z"/><path fill="#d4d4d4" d="M340 43h5v7h-4v3l-1 7-6 1q-3-4-1-9l1-3h6z"/><path fill="#251f24" d="M191 120h6v11c0 5 0 5-2 9l-2 1q-3-6-2-13z"/><path fill="#926492" d="M208 98h5v5h5v2h-4v10l-5 1-2-4z"/><path fill="#b18ab1" d="M22 236h15v5h6v6l3 1-9-1-1-4h-7l-4-4 1-2z"/><path fill="#9b819a" d="M48 337h1c-1 7-1 7-3 10h-2l-2 5h-6l1-12h11z"/><path fill="#a291a3" d="M48 324h12v5l-2 1q-5 2-5 6l-3 1v-2h-2z"/><path fill="#e78be8" d="M131 302h5v22h-5z"/><path fill="#9b389a" d="M263 219h5v6h11v5h-16z"/><path fill="#6e6e6f" d="M120 203h22v5h-22z"/><path fill="#959595" d="M175 126h11v5h-6v11h-5z"/><path fill="#987b98" d="M175 87h5v22h-5z"/><path fill="#662367" d="M290 197v6h-5v4h5l-1 2h-3q1 3 4 5h-5v-6h-6v-10z"/><path fill="#e799e7" d="M165 42h4l1 11h-2v3l-1 9-3-1c-2-18-2-18 1-22"/><path fill="#7b6f7b" d="m164 185 3 5 3 2-1 5h-5v-5h-11v-6z"/><path fill="#a802aa" d="M203 61h4v14h-5v6h-4v-9l4-1v-3z"/><path fill="#6f6e70" d="M235 192h6v11h-6v5h-5v-11h4v4h4v-4h-3z"/><path fill="#b838b5" d="M136 93h6v6l4 1v9l-4-1v-4h-6z"/><path fill="#b279b2" d="m121 235 4 1v11h-11l-1-6h3l3-1z"/><path fill="#e15de1" d="m157 70 7 1v16h-6z"/><path fill="#c9cac8" d="M15 323h6l3 1h2v5h-5v6h-7v-8z"/><path fill="#b948bb" d="M158 307h6v17h-6z"/><path fill="#582557" d="M208 258h11v5h-6v6l-4 1-1 4v-4l-3-6-2-1h5z"/><path fill="#776978" d="M246 208h17v6h-17z"/><path fill="#8a7b8a" d="M147 296h6v17h-5l-1-5z"/><path fill="#564a56" d="M119 285h12v4q-3 4-6 3v4l-5 1-1-4z"/><path fill="#b6b6b6" d="M114 197h13l-2 1v5h-5v5h-6v-4l-2-1h2z"/><path fill="#2d2b2e" d="M175 247h5v10l2 1-2 1-3 3-1 2-7 1 1-6 5-1z"/><path fill="#5f5160" d="M263 208h5v10l-16 1v-5h11z"/><path fill="#ab99aa" d="M237 164h3l4 2 2 1v2l4 1h-18l-6-1v-4h2v2l2-1q3-2 7-2"/><path fill="#916693" d="M263 147h7q-2 6-9 8h-2l-1 3 5 1-1 2-2-1h-3q-4 1-6-2v-5l7-2h4z"/><path fill="#d0d0d0" d="M202 153h11v6h-5v5h-7z"/><path fill="#ddd" d="M257 126h7l-1 11h-11v-6h5z"/><path fill="#ae71ae" d="M136 280h6v16h-6z"/><path fill="#b6b6b6" d="M219 219h16v6h-16z"/><path fill="#ad95ad" d="M43 186h16v6H43z"/><path fill="#342e35" d="m289 180 1 5 4 1h-4l1 6h-6v-6h-6v-5z"/><path fill="#282828" d="M213 175h11v6h-5v5h-6z"/><path fill="#7f617e" d="m54 203 10 2v2l6 1v6h-6l1-5H48v-2h6z"/><path fill="#523651" d="M130 81h1v6h5v17h-1v-6l-3 1-1 5h-6l2-3h3z"/><path fill="#8b858b" d="M54 313h12q-2 6-6 9l-1 2h-5z"/><path fill="#6f6470" d="M147 263h6v6h5v5h-11z"/><path fill="#4f4f4f" d="M202 241h6v11h-11v-5h5z"/><path fill="#6a646a" d="M191 219h6v11h-11v-5h5z"/><path fill="#7b2978" d="M186 203h5v11h-11v-6h6z"/><path fill="#2a2a29" d="M224 197h6v11h-11v-5h5z"/><path fill="#626161" d="M131 148h11v11h-6v-6h-5z"/><path fill="#999" d="M147 131h6v11h-11v-5h5z"/><path fill="#868586" d="M164 126h5v11h-11v-6h6z"/><path fill="#b4b4b4" d="M268 98h11v11h-5v-5h-6z"/><path fill="#f7a4f7" d="M213 291h5q2 5 1 9v7h-6z"/><path fill="#914d8e" d="M120 120h11v11h-6v-6l-5-1z"/><path fill="#4b4249" d="M158 94h6v15h-6z"/><path fill="#7d567f" d="M53 236h6v5l-4 2h-2l-5 1v3h11l-4 2h-3l-3-1-6-1v-6h11z"/><path fill="#faa5fb" d="M63 148h18v5H61v-3h2z"/><path fill="#8a738b" d="m122 324 4 1v4h5v6h-5v3l5 2v5l-1-4h-5q-2-4-2-9l-2-7z"/><path fill="#413c40" d="M235 247h6v5h4v4h-3l-1 3-6-1z"/><path fill="#d570d4" d="M32 324h11v5h-6v6h-5z"/><path fill="#443a43" d="M87 203h11v5h-6v6h-5z"/><path fill="#c396c5" d="M92 136h8l3 1v11h-5l-1-9h-3l-1 3-3-1z"/><path fill="#ddd" d="M219 137h11v5h-6v6h-5z"/><path fill="#595858" d="M142 126h11v5h-6v6h-5z"/><path fill="#a9a9a9" d="M296 76h5v11h-11v-5h6z"/><path fill="#855185" d="M198 273v12l-7 1v-12z"/><path fill="#853285" d="m207 269 2 1 4-1v16h-5l-1-10z"/><path fill="#060406" d="M224 225h16l1 5h-17z"/><path fill="#e6a2e7" d="M18 204h14v4H10v-3z"/><path fill="#68246b" d="m302 158 5 1 1 5-6 1v5l-11 1-1-2h6v-5h5v-2z"/><path fill="#2b272b" d="M175 60h5v16h-5l-1-7v-8z"/><path fill="#d089ce" d="m133 52 3 2 1 7-5-1v27h-1l-1-26v-7z"/><path fill="#b27bb2" d="M70 153h11v6l-11 1h-8v-1h8z"/><path fill="#ed8fed" d="M285 203h20l1 4h-21z"/><path fill="#b545b4" d="M267 149h7v4h-6v6l-10-1 1-4 8-2z"/><path fill="#635063" d="M241 236h5v4h6v-4h5v2h5l1 4-5 1v-2h-17z"/><path fill="#d5a6d4" d="M15 229h8l3 1v6l-11 1z"/><path fill="#a590a5" d="M54 214h16v5H54z"/><path fill="#282529" d="M109 170h16v5h-16z"/><path fill="#2e2930" d="M109 148h5v16h-5z"/><path fill="#4d4e4c" d="M103 164h11v6h-5v3h-3v-3l-4-1z"/><path fill="#858085" d="m230 159 4 1-3 3h11q3-1 5 3l1 2-2 1-2-2-12-2-4 2v-2h-2v4l4 1-8-1v-4l-3-1h11z"/><path fill="#504651" d="M175 335h5v16h-5z"/><path fill="#6d306d" d="m114 137 1 4 5-1v2h5v6h-11z"/><path fill="#f199f3" d="M94 139h3l1 9H86l1-6h3l3-1z"/><path fill="#1f1b20" d="M131 98h4l1 11-10 1-1-6h6z"/><path fill="#806982" d="M153 93h5v16h-5z"/><path fill="#935992" d="m86 271 1 3h5v6H81l-1-6 4-1h2z"/><path fill="#835883" d="M85 169h9l-2 1v5l-4 1h-3l-5-1q0-7 5-6"/><path fill="#90068f" d="m290 141 1 8-12-1v-6z"/><path fill="#6c6c6d" d="M202 129v8h-4v4h4v4h-4l-1 4h-3v-4h2l1-14h5z"/><path fill="#f794f8" d="M132 60h4l1 13 4 1v2h-9z"/><path fill="#ab79ab" d="M58 148h1v6H48v5h10v1H43v-8h10l5 1z"/><path fill="#787878" d="M191 142h3v11h3v11h-3v-7h-3z"/><path fill="#8f4f8e" d="M98 98h5v6h6v5h-6v5h-1v-10h-5z"/><path fill="#5f555f" d="m196 291 2 1-1 10h-6v-11z"/><path fill="#847a84" d="m197 117 6 4v6l-1 4h-5z"/><path fill="#d965d9" d="M109 98h2l2 6h7v5h-11z"/><path fill="#a26fa3" d="M164 337h1v18l-1 3h-6l-1-4v-2l-3-1h10z"/><path fill="#796a7a" d="M180 318h6v6l4 1-3 1-1 3h-6z"/><path fill="#aa34a9" d="M54 302h6v4h5v7h-6v-6h-5z"/><path fill="#ccc" d="M279 93h6l2 5h-2v6h-6z"/><path fill="#ad87ad" d="m230 271 1 3-1 1h-5v16l-5 1v15h-1v-10l1-8h3v-15l7-1z"/><path fill="#3b193c" d="M158 203h6v11l-8-1v-5h2z"/><path fill="#8f1c8e" d="M182 173h9v2l3 1h-2v10l-2-1-4 1v-11h-4z"/><path fill="#642764" d="M175 170h5l1 4 5 1v6l-6 1-2-2 2-5h-6z"/><path fill="#69416b" d="M59 203h17v5H62l2-1v-2l-5-1z"/><path fill="#5a5b5a" d="M169 153h6v6h3v2h-10q-6 0-10 2v-4h11z"/><path fill="#242424" d="M114 208h11v6h-11z"/><path fill="#978798" d="M70 197h8q3 0 5 2h-2v4H70z"/><path fill="#cbcbcb" d="M224 108h6l1 7h-7v5h-5v-5h3v-2h2l-1-3z"/><path fill="#b06bb1" d="M274 260q4 1 6 5l-1 5h-16v-6h-5v-1h6v5h14v-4h-4l-1 2-1-3h2z"/><path fill="#272727" d="M202 230h7l-1 11h-6z"/><path fill="#3f383f" d="M10 180h6l3 1h3l-1 5H10l-2-4z"/><path fill="#7e7d7d" d="M142 142h11l1 6h-12z"/><path fill="#483648" d="M114 120h6l1 4 4 1v6h-5v-5h-6z"/><path fill="#0f0a0f" d="M142 120h11l1 6h-12z"/><path fill="#c28ec4" d="M136 65h1l1 5h8v3h-3v4h4v5h-5l-1-8-5-1z"/><path fill="#ebebeb" d="M301 60h6v11l-7-1-1-2h2z"/><path fill="#4b174e" d="M26 340h11v6H26z"/><path fill="#a621a5" d="M26 324h6v11h-6z"/><path fill="#655f65" d="M48 313h6v11h-6z"/><path fill="#a38ca5" d="M169 313h6v11h-6z"/><path fill="#4d434e" d="M180 302h6v11h-6z"/><path fill="#483f48" d="M158 274h6v11h-6z"/><path fill="#be5cbe" d="M219 263h11v6h-11z"/><path fill="#939393" d="M158 252h6v11h-6z"/><path fill="#3b273b" d="M213 247h6v11h-6z"/><path fill="#b66db5" d="M54 230h11v6H54z"/><path fill="#848284" d="M164 230h11v6h-11z"/><path fill="#515151" d="M235 214h6v11h-6z"/><path fill="#5f5b5f" d="m125 217 1 3-4 1-1 4h-3v2l-4 2v-10h11z"/><path fill="#322a32" d="M103 219h11v6h-11z"/><path fill="#756a75" d="M92 219h11v6H92z"/><path fill="#362a34" d="M246 214h6v11h-6z"/><path fill="#5c5c5c" d="M208 208h11v6h-11z"/><path fill="#534954" d="M136 192h6v11h-6z"/><path fill="#bababa" d="M230 186h11v6h-11z"/><path fill="#ad91ae" d="M136 186h11v6h-11z"/><path fill="#656265" d="M125 186h11v6h-11z"/><path fill="#563e54" d="M151 170h2v11h-5q-2-4-1-10z"/><path fill="#191819" d="M224 175h11v6h-11z"/><path fill="#333434" d="M125 153h11v6h-11z"/><path fill="#494949" d="M158 137h6v11h-6z"/><path fill="#463943" d="M114 131h11v6h-11z"/><path fill="#79127a" d="M103 109h11v6h-11z"/><path fill="#4f414f" d="M180 98h6v11h-6z"/><path fill="#5c0b5c" d="m213 76 3 1-2 7-2 3h1v6l-5 1-2-7 1-4 6-1z"/><path fill="#cacaca" d="M318 54h11v6h-11z"/><path fill="#844683" d="m98 169 5 1 1 3 4 2 1-2v7h-6v-5h-5z"/><path fill="#812881" d="M218 75h6v12h-5z"/><path fill="#cfcfcf" d="m348 27 3 1 1 4v5l-4 1h-3v-9z"/><path fill="#191a19" d="M125 175h11v6h-8l-3-1z"/><path fill="#751879" d="M184 181h2v8l-1 3h-5v-8q-1-4 4-3"/><path fill="#912e8e" d="M92 148h11v5l-10 2z"/><path fill="#867584" d="M131 269h5v5l-4 1-1 5h-6v-6h6z"/><path fill="#6b506d" d="M142 225h7q-1 6-5 8h-2v4h-4v4h-2v-5h5z"/><path fill="#837582" d="M70 169v6H58l1-5z"/><path fill="#e1e1e1" d="M235 126h6v6h-5l-1 5h-5v-6h5z"/><path fill="#533e55" d="M154 73h4v4h-4l1 3 3 1v12h-5v-6h4v-5h-4z"/><path fill="#6b616b" d="m186 302 4 1q3 7 2 14l-2-3-4-1z"/><path fill="#be68be" d="M252 241h6l-1 11h-5z"/><path fill="#483e47" d="M48 219h6v10h-7z"/><path fill="#b15fb0" d="m290 197 11 1v5h-11z"/><path fill="#89808a" d="M15 335h6l-1 11h-5z"/><path fill="#604360" d="M43 329h5v6h2v2h-2v3h-5z"/><path fill="#939393" d="M202 164h6v6h2v3h-8z"/><path fill="#564254" d="M165 87h10v6h-10z"/><path fill="#923f92" d="M200 65h2v6l-3 1v11l-3-1V66z"/><path fill="#7a2e7b" d="M114 245v13h-5v-11z"/><path fill="#766778" d="M43 181h13l-2 5H43z"/><path fill="#524b53" d="M43 175h5v6h-5v5h-5v-5h4z"/><path fill="#7c397e" d="M186 258q6 0 7 2l1 1-2 4 5 1-1 3h-5l-1-2-1-3-3-1z"/><path fill="#651366" d="M142 192h11l-1 6-10-1z"/><path fill="#7f697f" d="M281 181h-2v11h-5v-11z"/><path fill="#a41aa4" d="M164 176v5h-6v4h-4l1-8z"/><path fill="#2c262d" d="m170 76 5 1v10h-6l1-7z"/><path fill="#7c767d" d="M164 269h6l-1 2 1 9h-6zm1 1 1 3Z"/><path fill="#7d7d7e" d="M114 159h11v5h-11z"/><path fill="#785377" d="m103 153-1 7-12-1v-2h6v-3z"/><path fill="#88368a" d="M163 297q3 5 1 10h-6v-9z"/><path fill="#4b204f" d="M274 197h6l-1 11h-5z"/><path fill="#100a0e" d="M120 148h11v5h-12z"/><path fill="#775176" d="M279 130h6l1 11h-2v-4h-6z"/><path fill="#c33fc2" d="m114 109 10 1v5h-10z"/><path fill="#bb6ebc" d="M213 93h5l-1 5h2l1 6-2 1v-2h-5z"/><path fill="#c8a0cb" d="M135 332q3 3 2 7v5l-1 7-4 1-2-1 1-5h4z"/><path fill="#a787a5" d="M213 307h6v1h-5v15l-4 2-3-2v-10l3 7 3-1z"/><path fill="#4b244d" d="M120 307h5v11h-5z"/><path fill="#978497" d="M175 302h5v11h-5z"/><path fill="#605160" d="M164 302h11v5h-11z"/><path fill="#cf6ecf" d="M131 302h5v11h-5z"/><path fill="#695c68" d="M142 291h5v11h-5z"/><path fill="#685b68" d="M175 291h5v11h-5z"/><path fill="#815682" d="M131 285h5v11h-5z"/><path fill="#3f1541" d="M81 280h11v5H81z"/><path fill="#6d6370" d="M125 280h11v5h-11z"/><path fill="#3e353f" d="M142 269h5v11h-5z"/><path fill="#691466" d="M98 263h5v11h-5z"/><path fill="#3f3940" d="M147 258h11v5h-11z"/><path fill="#816c81" d="M224 236h11v5h-11z"/><path fill="#cc74cc" d="M37 236h11v5H37z"/><path fill="#2e0d2f" d="M131 230h5v11h-5z"/><path fill="#fda0fe" d="M279 225h11v5h-11z"/><path fill="#3b313a" d="M92 225h11v5H92z"/><path fill="#b495b4" d="M70 225h11v5H70z"/><path fill="#9b719b" d="M175 219h5v11h-5z"/><path fill="#675868" d="M246 203h11v5h-11z"/><path fill="#272727" d="M208 192h5v11h-5z"/><path fill="#5b4c5d" d="M268 192h11v5h-11z"/><path fill="#a1a0a1" d="M125 192h11v5h-11z"/><path fill="#7c7b7c" d="M114 192h11v5h-11z"/><path fill="#7c667d" d="M32 192h11v5H32z"/><path fill="#786a79" d="M252 181h5v11h-5z"/><path fill="#625662" d="M235 170h11v5h-11z"/><path fill="#4a444a" d="M224 170h11v5h-11z"/><path fill="#484949" d="M125 170h11v5h-11z"/><path fill="#373737" d="M147 159h11v5h-11z"/><path fill="#696967" d="M125 159h11v5h-11z"/><path fill="#434343" d="M142 148h5v11h-5z"/><path fill="#df95df" d="M48 154h11v5H48z"/><path fill="#3c3c3c" d="M164 148h5v11h-5z"/><path fill="#ed94ef" d="M81 148h11v5H81z"/><path fill="#919191" d="M219 148h11v5h-11z"/><path fill="#382638" d="M142 115h11v5h-11z"/><path fill="#100d12" d="M175 115h11v5h-11z"/><path fill="#3b313b" d="M186 109h5v11h-5z"/><path fill="#999" d="M263 104h11v5h-11z"/><path fill="#493a4a" d="M148 98h5v11h-5z"/><path fill="#cc84cb" d="M164 71h5v11h-5z"/><path fill="#d5d5d5" d="M340 43h5v7h-4l-2 3-5-1v-3h6z"/><path fill="#655f65" d="m178 349 1 2h7v2h-4l-2 4h-2l-1 3-3-1 1-8h3z"/><path fill="#a77ea7" d="M48 324h6c0 7 0 7-2 10l-4 1z"/><path fill="#a793a8" d="M153 291h5v10l-5 1z"/><path fill="#151115" d="M208 236h5v10l-5 1z"/><path fill="#825381" d="m131 224 3 1-2 2-1 5v4h-8l3-7h4z"/><path fill="#5d4b5f" d="M180 219h6v8l-6 2z"/><path fill="#b228b5" d="M103 139h6v9h-6z"/><path fill="#816281" d="m157 340 1 11h-5l-1-10z"/><path fill="#c898c9" d="m32 197 4 1h-3v2l-1 4h-8l-4 1H9v-2l16-1h5z"/><path fill="#6b696b" d="M242 181h4v11h-5v-8z"/><path fill="#595a5a" d="M191 157h3v4h-3v8l-5-5v-3h-4v-2h9z"/><path fill="#281e27" d="M133 120h9v5l-3 1h-6z"/><path fill="#5f4261" d="M81 285h10q-3 7-7 7h-2l-1-4z"/><path fill="#e283e1" d="M219 269h11v4l-7 1h-4z"/><path fill="#41403e" d="M142 208h4l1 5-3 1h-6v3l-4-1v-2l5-4 3 1z"/><path fill="#ed9cef" d="M158 335h1v11h4v-10h1v15h-6z"/><path fill="#852685" d="M224 252v11h-5v-9z"/><path fill="#523654" d="M241 241h5v18h-4v-3h3v-4l-1-2-1-5-3 1z"/><path fill="#7a257c" d="M253 220h10v5l-8 1-2-2z"/><path fill="#a4a4a4" d="M198 145h4v8h-8v-4l3-1z"/><path fill="#665a65" d="M186 93h5v10l-5 1z"/><path fill="#675c6b" d="M48 214v5H37l1-4z"/><path fill="#242324" d="M131 208h11v3l-2 1-4 2h-5z"/><path fill="#d6d2d4" d="m21 317 7 2v4l4 1H21l-1-6z"/><path fill="#5d235e" d="M59 241v6H48v-3l4-1 2-1z"/><path fill="#7a717a" d="M147 219h6v22h-5l2-1q2-9 0-19h-3z"/><path fill="#927292" d="M279 203h6v4h5l-1 2h-3q1 3 4 5h-5v-6h-6z"/><path fill="#bb2dbc" d="M43 203h11v4l-11 1z"/><path fill="#b184b4" d="M165 42h4v11l-1-1-5-3z"/><path fill="#575058" d="M180 329h7v12h-1v-6h-6z"/><path fill="#474747" d="M125 208h6l-1 8-2 1-3-1z"/><path fill="#ae0daa" d="M295 158h6v6h-10v-4h3z"/><path fill="#777" d="M175 153h5v6h2v2h4v2l-7-1-1-3h-3z"/><path fill="#bd53bd" d="m157 70 2 1v11h5v5h-6z"/><path fill="#d39dd2" d="M308 230v6l-4 1h-9l1-2 6-1v-4z"/><path fill="#a37ba0" d="m285 219 4 1 1 3h6l1 6h6v1h-7l-1-3-10-2z"/><path fill="#772877" d="m54 203 10 2v2q-4 2-9 1h-7v-1h6z"/><path fill="#801983" d="M190 192h6v10l-4-1z"/><path fill="#914b90" d="M142 98h5v17h-5v-7l4 1v-7z"/><path fill="#f8b7f5" d="M126 335h5v4l4 1v6h-4v-3l-3-4-2-1z"/><path fill="#795d73" d="M119 308h1v10h5v6l-5 2-1-12z"/><path fill="#8f8990" d="M154 197h4v4h4v-4h2v6h-11z"/><path fill="#5c555a" d="M147 164h11l-3 2-2 4h-6z"/><path fill="#9c7a9d" d="M34 241h9v6l3 1-9-1-1-4z"/><path fill="#a997aa" d="M11 208h10l1 7-7-1-1-5z"/><path fill="#755475" d="M258 152v8h-5q-2-2-2-5v-2z"/><path fill="#4c424d" d="M127 109h4v10h-4l-1-7v-2z"/><path fill="#8b8488" d="M37 313h11l-1 4-10 1z"/><path fill="#9e3c9e" d="M209 285h4v11h-4z"/><path fill="#604861" d="M131 241h3q-1 5-5 8h-3v4l-4-1h3l-5-1 3-1v-3h2l1-2h5z"/><path fill="#ee8fee" d="M307 198h11v4h-11z"/><path fill="#737373" d="M210 170h4v3h6l4-1v3h-18v-2h4z"/><path fill="#e4e4e4" d="M301 87h6v7h-4l-2 3z"/><path fill="#e567e5" d="M132 76h4v11h-4z"/><path fill="#787078" d="M197 299v8l-6 2-2-7h8z"/><path fill="#4e384e" d="M114 252h7l1 3-2 3h-6z"/><path fill="#514e4f" d="m183 241 3 1v7h-4v4h-2v-7h2z"/><path fill="#891f8c" d="M53 236h6v5l-4 2h-2l-5 1v-3h6z"/><path fill="#858085" d="M164 203h5v2h-3v4h3v5h-5z"/><path fill="#4e3d4a" d="M115 137h10v5h-5v-2l-5 1z"/><path fill="#ebebeb" d="m257 75 6 1v6l-7 1-2-2 2-2z"/><path fill="#b4b3b6" d="M14 329h7v6h-7z"/><path fill="#343233" d="M306 185h3v4h-2l1 5-7-2 1-4 3-1z"/><path fill="#2d2b2d" d="M109 120h5l-1 8-4 3z"/><path fill="#a15ba0" d="m208 104 4 1-1 10h-3l-1-10z"/><path fill="#a13ea1" d="M130 81h1v6h5v6h-6z"/><path fill="#3f363f" d="m175 69 1 8-6-1 1 5-2 1V71z"/><path fill="#7c5f7b" d="M169 324h6v5l-4 1-1 6-4-1h3z"/><path fill="#90198e" d="M147 214h11v4h-10z"/><path fill="#632163" d="M146 208h7v6h-7z"/><path fill="#8a8a8a" d="m102 194 1 3h6v6h-6v-5l-2-1z"/><path fill="#767676" d="M101 194q3 4 2 9h-5v-2l-4-1 2-1q4-1 5-5"/><path fill="#a1a1a2" d="M230 192h5v5h3v4h-4v-4h-4z"/><path fill="#892f88" d="M81 153h7l-1 6-9 1 3-1z"/><path fill="#191619" d="M142 141v7h-7v-5z"/><path fill="#6a026c" d="M213 93v5h-6l-1 2v-3l-3 1v-4h4l3-1z"/><path fill="#996d99" d="M48 316v8l-5-1v-5h-5v-1h4l3-1z"/><path fill="#5c5c5c" d="M194 258h8v6l-4 1-1-4h-3z"/><path fill="#6f5c71" d="M109 258h9v2l-4 1v3l-4 1z"/><path fill="#4c414d" d="M70 241h6v6l-6 1z"/><path fill="#8e1c8b" d="M190 208v5h-9v-4z"/><path fill="#fba8fb" d="M21 204h11v4l-11-1z"/><path fill="#382d36" d="M143 87h4v10h-4z"/><path fill="#c37ec1" d="M158 59h6v6h-7z"/><path fill="#eeb3ee" d="M218 293h1v14h-6v-5h5z"/><path fill="#766b78" d="M76 296v6l-6 1v-7z"/><path fill="#4b4c4d" d="M175 241h7v5l-7 1z"/><path fill="#7d487a" d="m197 194 1 9q-6 2-12 0v-2h4l1-4 1 2 4 3v-3z"/><path fill="#a66aa6" d="M90 175q3 0 5 3 4 3 8 2l-1 2h-7l-4-2z"/><path fill="#9b8f9b" d="M235 164v6l-9-1v-4h2v2l2-1q2-2 5-2"/><path fill="#591c5a" d="m302 158 5 1 1 5h-7v-5z"/><path fill="#dd56d8" d="M102 138h1v10h-5v-6l3-1z"/><path fill="#b891ba" d="m107 92 3 1v3h2l2 1 2 5 4 2h-7l-2-6h-2z"/><path fill="#a947a8" d="M158 307h6v6h-5l-1 2z"/><path fill="#6c2e6d" d="m54 295 5 1v6h-5z"/><path fill="#b177b0" d="m81 273 6 2v5h-6l-1-6z"/><path fill="#c0c0c1" d="M245 142h9l-3 6h-5z"/><path fill="#595259" d="M202 129v8h-4l-1 4v-10h5z"/><path fill="#887787" d="M147 296h6v6l-6 1z"/><path fill="#c082bf" d="M137 283h3l1 8h-5v-7z"/><path fill="#827480" d="m178 283 7 1-5 2v5h-5v-4h3z"/><path fill="#454444" d="M174 258h3l-1 6-7 1q0-9 5-7"/><path fill="#f793f6" d="M296 203h9l1 4h-10z"/><path fill="#3e363e" d="M246 175h6v6l-6 1z"/><path fill="#aaa" d="M197 170h5v3h4v2l-12 1 3-1z"/><path fill="#554e55" d="M70 170h6v8l-6-3z"/><path fill="#930395" d="M268 153h6v5l-5 2-1-4z"/><path fill="#747474" d="M164 142h8l-2 1v5h-6z"/><path fill="#ee91ec" d="M158 65h6v6h-6z"/><path fill="#7a797a" d="m178 58 4 1v16l3 1h-5V60h-5z"/><path fill="#b1b1b1" d="M312 43h6l1 6h-7z"/><path fill="#906993" d="M37 340h6v6h-6z"/><path fill="#f581f3" d="M158 329h6v6h-6z"/><path fill="#ab3dab" d="M213 274h6v6h-6z"/><path fill="#4b374c" d="M208 258h5l-2 6h-2l-1 3-5-4h5z"/><path fill="#df7adf" d="M257 252h6v6h-6z"/><path fill="#161016" d="M147 252h6v6h-6z"/><path fill="#952f95" d="M246 241h6v6h-6z"/><path fill="#757575" d="M169 241h6v6h-6z"/><path fill="#6a5769" d="M224 241h6v6h-6z"/><path fill="#676767" d="M202 241h6v6h-6z"/><path fill="#636262" d="M191 241h6v6h-6z"/><path fill="#9a9a9a" d="M158 241h6v6h-6z"/><path fill="#322e32" d="M147 241h6v6h-6z"/><path fill="#463446" d="M268 230h6v6h-6z"/><path fill="#f6b4f9" d="M26 230h6v6h-6z"/><path fill="#3e353e" d="M235 230h6v6h-6z"/><path fill="#4b4e4a" d="M158 230h6v6h-6z"/><path fill="#643f65" d="M268 219h4l-1 3 9 2h5v1h-17z"/><path fill="#c389c3" d="M136 219h6v6h-6z"/><path fill="#3a3a3a" d="M202 219h6v6h-6z"/><path fill="#9b809b" d="M257 208h6v6h-6z"/><path fill="#0e0b0f" d="M92 208h6v6h-6z"/><path fill="#d197d1" d="M305 203h2l1 5q-5 2-10 1h-8v-2l15-1z"/><path fill="#543655" d="M268 197h6v6h-6z"/><path fill="#7c747c" d="M59 197h5l2 6h-7z"/><path fill="#daa0d9" d="M36 197h18v5l-6-2v-2H36z"/><path fill="#594c59" d="M279 186h6v6h-6z"/><path fill="#7e6d7e" d="M59 186h6v6h-6z"/><path fill="#a8a9a9" d="M114 164h6v6h-6z"/><path fill="#767676" d="M136 153h6v6h-6z"/><path fill="#2b2029" d="M125 142h6v6h-6z"/><path fill="#717071" d="M164 129h2v4h-4v4h-4v-6h6z"/><path fill="#c5c5c5" d="M257 120h6v6h-6z"/><path fill="#8f8f8f" d="M246 120h6v6h-6z"/><path fill="#969696" d="M235 120h6v6h-6z"/><path fill="#2d262d" d="M191 120h6v6h-6z"/><path fill="#645963" d="M158 120h6v6h-6z"/><path fill="#bababa" d="M268 109h6v6h-6z"/><path fill="#979797" d="M246 109h6v6h-6z"/><path fill="#d663d6" d="M103 98h6v6h-6z"/><path fill="#f5f5f5" d="M290 98h6v6h-6z"/><path fill="#c6c6c6" d="M268 98h6v6h-6z"/><path fill="#d8d8d8" d="M257 98h6v6h-6z"/><path fill="#8d3e8d" d="M158 87h6v6h-6z"/><path fill="#f24ef0" d="M136 87h6v6h-6z"/><path fill="#880687" d="M213 87h6v6h-6z"/><path fill="#e6e6e6" d="M279 87h6v6h-6z"/><path fill="#b9b9b9" d="M301 76h6v6h-6z"/><path fill="#e1e1e1" d="M290 76h6v6h-6z"/><path fill="#474246" d="m154 70-1 6-6-2-1 3 1-7z"/><path fill="#cecece" d="M290 65h6v6h-6z"/><path fill="#bfbfbf" d="M334 43h6v6h-6z"/><path fill="#acacac" d="M323 43h6v6h-6z"/><path fill="#bcbcbc" d="M301 43h6v6h-6z"/><path fill="#909090" d="M323 32h6v6h-6z"/><path fill="#d0d0d0" d="M334 21h6v6h-6z"/><path fill="#cbcbcb" d="m330 14 4 1-2 6h-6z"/><path fill="#b684b5" d="M125 329h6v6h-5l-1-4z"/><path fill="#8c298e" d="M37 329h6v5l-4 1h-2z"/><path fill="#716471" d="M180 324h10l-3 2-1 3h-6z"/><path fill="#aa8aa9" d="M59 313h7q-1 4-5 7l-2 1z"/><path fill="#7a367a" d="M80 277h1v8h-6v-5l5-1z"/><path fill="#5a505a" d="M147 263h6v6h-5l-1-4z"/><path fill="#96239a" d="M253 258h10v5q-6 1-10-5"/><path fill="#685969" d="M70 219h6v6h-5l-1-4z"/><path fill="#7f717f" d="M59 219h6v5l-4 1h-2z"/><path fill="#473e46" d="M37 219h6v6h-5l-1-4z"/><path fill="#6c616d" d="M81 208h6v6h-6z"/><path fill="#832a83" d="M279 158h5l1 2h-5l-3 1h-3l-1 2h-5l1-4z"/><path fill="#939393" d="M213 153h5l1 4v2h-6z"/><path fill="#c09ac1" d="M79 141h8v2l-10 1 1 3h-3v-5z"/><path fill="#772b79" d="M120 120h11v6h-1v-5h-5v4l-5-1z"/><path fill="#b8b9b8" d="M30 313h2v10h-4l-2-6h4z"/><path fill="#3f3840" d="M121 290h4v6l-5 1-1-4z"/><path fill="#eea9ed" d="M274 257v6h-6v-5z"/><path fill="#4d414d" d="M230 252h5v6l3 1-8-1z"/><path fill="#a193a1" d="M76 241h5v6l-7 1 2-1z"/><path fill="#5b185e" d="M164 214h9l-2 1-2 4h-5z"/><path fill="#695f69" d="m81 191 6 1v5h-6z"/><path fill="#3d353d" d="m71 186 5 1v5h-6v-5z"/><path fill="#af58b0" d="M98 169v5l-4 2-2-1v-5z"/><path fill="#837884" d="M254 170h-2v5h-6v-5z"/><path fill="#621e62" d="M281 149h4v3h4l1-3-1 5h-3l-1 3v-4l-3 1-2-4z"/><path fill="#892486" d="m290 141 1 8-4-2v-3l-8-1v-1z"/><path fill="#675e68" d="M197 113v7h-6v-5h6z"/><path fill="#c8c8c8" d="m282 115-1 2h-2l-1 4h-4v-6z"/><path fill="#e6e6e6" d="m280 76 5 1v5h-6v-5z"/><path fill="#a294a3" d="M48 337h1l-2 9h-4v-6h5z"/><path fill="#4b454b" d="m196 291 2 1-1 4h-6v-5z"/><path fill="#4b444c" d="m186 285-1 6-5 1v-6z"/><path fill="#936392" d="M192 262h5l1 11-3 1q0-5 2-8l-5-1z"/><path fill="#614462" d="M235 236h6v7l-6-2z"/><path fill="#ae96af" d="M15 229h10l-4 2-5 5 2 1-4-1z"/><path fill="#371636" d="M185 198h1v5h-11v-4h5l1 3 3-1z"/><path fill="#181017" d="M142 125v7l-6-1v-5z"/><path fill="#e9e9e9" d="M334 16h6v5h-8z"/><path fill="#2d2d2d" d="M164 258h7l1 3q-3 3-8 2z"/><path fill="#b2b2b2" d="M158 236h8l-2 1v4h-6z"/><path fill="#ef84f0" d="M37 231h6v5h-8l2-1z"/><path fill="#f79bf4" d="M296 230h6l1 5h-7z"/><path fill="#7e7f80" d="M230 197h4v8h-4z"/><path fill="#450a44" d="M175 197h10l-1 5h-3l-1-2-5-1z"/><path fill="#5b5b5b" d="M235 181h7v5h-7z"/><path fill="#998b99" d="m266 174 2 1v6h-6l1-6z"/><path fill="#6c5e69" d="M147 93h6l1 3-1 2h-6z"/><path fill="#484148" d="M142 317v7h-5v-6z"/><path fill="#312c30" d="M164 269v5h-6v-5z"/><path fill="#554755" d="M241 230h5v6h-5z"/><path fill="#554856" d="M54 219h5v6l-5 1z"/><path fill="#2d2a2d" d="M91 203h7v5h-6z"/><path fill="#4b404c" d="M136 192h6v6l-6-1z"/><path fill="#716470" d="M26 192h6v6l-6-1z"/><path fill="#643161" d="M198 186v8l-2 2-1-8h-4v-2z"/><path fill="#a283a3" d="M141 186h6v6h-5z"/><path fill="#7f137d" d="M184 181h2v6h-5l-1-5z"/><path fill="#886085" d="M182 173h9v2l3 1h-2v10h-1l-1-9-8-2z"/><path fill="#a618a5" d="M165 171h9v3l-9 1z"/><path fill="#904d92" d="M83 171h9v4l-7 1v-3z"/><path fill="#2c2c2c" d="M130 153h6v6h-5z"/><path fill="#323232" d="m189 152 2 1v6h-5v-6z"/><path fill="#4d4d4d" d="M180 148h6v5l-6 1z"/><path fill="#cfcdcf" d="m241 142 5 1 1 4-4 1h-2z"/><path fill="#898989" d="M207 128h1v9h-6l1-4 3-2z"/><path fill="#aaa" d="M180 126h6v5h-7z"/><path fill="#5b445e" d="m120 124 5 1v6h-5z"/><path fill="#e3e3e3" d="M268 115h6l1 2-1 3h-6z"/><path fill="#400a42" d="m213 76 3 1-3 9-5 1-2-2 3-3h4z"/><path fill="#f082ef" d="M132 71h4l1 2 4 1v2h-9z"/><path fill="#9d939f" d="M15 335h6v5h-6z"/><path fill="#4e1150" d="M37 335h6v5h-6z"/><path fill="#4c1d4c" d="M21 329h5v6h-5z"/><path fill="#c357c0" d="M32 329h5v6h-5z"/><path fill="#731c73" d="M26 324h6v5h-6z"/><path fill="#e267df" d="M158 324h6v5h-6z"/><path fill="#8a718c" d="M32 318h5v6h-5z"/><path fill="#c94dc7" d="M159 318h5v6h-5z"/><path fill="#927992" d="M169 313h6v5h-6z"/><path fill="#974796" d="M125 313h6v5h-6z"/><path fill="#462447" d="M48 313h6v5h-6z"/><path fill="#afaeb2" d="M43 307h5v6h-5z"/><path fill="#816882" d="M164 307h5v6h-5z"/><path fill="#7b547e" d="M61 302h8v5h-4v-2h-4z"/><path fill="#3f353e" d="M180 302h6v5h-6z"/><path fill="#992199" d="M131 296h5v6h-5z"/><path fill="#511950" d="M65 296h5v6h-5z"/><path fill="#938394" d="M169 296h5l1 6h-6z"/><path fill="#615461" d="M147 291h6v5h-6z"/><path fill="#aa99ac" d="M164 285h5v6h-5z"/><path fill="#d578d3" d="M213 280h6v5h-6z"/><path fill="#5a4f5a" d="M158 280h6v5h-6z"/><path fill="#655966" d="M147 280h6v5h-6z"/><path fill="#834f84" d="M92 269h6v5h-6z"/><path fill="#b334b5" d="M219 263h5v6h-5z"/><path fill="#2c292e" d="M153 263h5v6h-5z"/><path fill="#59505a" d="M131 263h5v6h-5z"/><path fill="#6f246f" d="M213 258h6v5h-6z"/><path fill="#090608" d="M202 258h6v5h-6z"/><path fill="#b983b6" d="M103 258h6v5h-6z"/><path fill="#191a1a" d="M197 252h5v6h-5z"/><path fill="#7e177d" d="M252 252h5v6h-5z"/><path fill="#403e40" d="M191 252h6v6h-5z"/><path fill="#686868" d="M164 252h5v6h-5z"/><path fill="#323232" d="M153 252h5v6h-5z"/><path fill="#594d5a" d="M142 252h5v6h-5z"/><path fill="#7c2b7c" d="M246 247h6v5h-6z"/><path fill="#241c24" d="M235 247h6v5h-6z"/><path fill="#4c384a" d="M224 247h6v5h-6z"/><path fill="#292929" d="M191 247h6v5h-6z"/><path fill="#565656" d="M169 247h6v5h-6z"/><path fill="#1f1a1f" d="M147 247h6v5h-6z"/><path fill="#4a424a" d="M87 241h5v6h-5z"/><path fill="#958796" d="M81 236h6v5h-6z"/><path fill="#343434" d="M202 236h6v5h-6z"/><path fill="#a6a6a6" d="M191 236h6v5h-6z"/><path fill="#9b9c9b" d="M169 236h6v5h-6z"/><path fill="#6a2c67" d="M136 230h5v6h-5z"/><path fill="#935c93" d="M65 230h5v6h-5z"/><path fill="#c778ca" d="M54 230h5v6h-5z"/><path fill="#372c37" d="M252 230h5v6h-5z"/><path fill="#938693" d="M87 230h5v6h-5z"/><path fill="#927e95" d="M76 230h5v6h-5z"/><path fill="#68506a" d="M169 225h6v5h-6z"/><path fill="#8b788b" d="M81 225h6v5h-6z"/><path fill="#ab4daa" d="M263 219h5v6h-5z"/><path fill="#aaa" d="M230 219h5v6h-5z"/><path fill="#ccc" d="M219 219h5v6h-5z"/><path fill="#666" d="M208 219h5v6h-5z"/><path fill="#675c67" d="M98 219h5v6h-5z"/><path fill="#544b54" d="M76 219h5v6h-5z"/><path fill="#988099" d="M180 214h6v5h-6z"/><path fill="#474048" d="M92 214h6v5h-6z"/><path fill="#454345" d="M235 214h6l-1 5-2 1-3-1z"/><path fill="#595959" d="M202 214h6v5h-6z"/><path fill="#716b72" d="M202 212v7h-5v-5z"/><path fill="#857584" d="M70 214h6v5h-6z"/><path fill="#836d85" d="M175 208h5v6h-5z"/><path fill="#6d5c6e" d="M263 208h5v6h-5z"/><path fill="#826d83" d="M252 208h5v6h-5z"/><path fill="#231624" d="M268 203h6v5h-6z"/><path fill="#db63dc" d="M37 203h6v5h-6z"/><path fill="#4c3e4c" d="M257 203h6v5h-6z"/><path fill="#5a5159" d="M235 203h6v5h-6z"/><path fill="#2f172e" d="M169 203h6v5h-6z"/><path fill="#271027" d="M158 203h6v5h-6z"/><path fill="#883d88" d="M285 197h5v6h-5z"/><path fill="#aa9dad" d="M54 197h5v6h-5z"/><path fill="#5f5f5f" d="M219 197h5v6h-5z"/><path fill="#160615" d="M164 197h5v6h-5z"/><path fill="#a2a2a2" d="M109 197h5v6h-5z"/><path fill="#251e26" d="M246 192h6v5h-6z"/><path fill="#b8b8b8" d="M224 192h6v5h-6z"/><path fill="#504b51" d="M59 192h6v5h-6z"/><path fill="#8d6d8e" d="M153 186h5v6h-5z"/><path fill="#858585" d="M219 186h5v6h-5z"/><path fill="#525252" d="M208 186h5v6h-5z"/><path fill="#716f70" d="M131 186h5v6h-5z"/><path fill="#584d57" d="M65 186h5v6h-5z"/><path fill="#a08ba0" d="M54 186h5v6h-5z"/><path fill="#5c4e5c" d="M32 186h5v6h-5z"/><path fill="#323232" d="M213 181h6v5h-6z"/><path fill="#937094" d="M147 181h6v5h-6z"/><path fill="#524654" d="M59 181h6v5h-6z"/><path fill="#4a464b" d="m10 180 5 1-2 5-4-1z"/><path fill="#1a1a1b" d="M241 175h5v6h-5z"/><path fill="#838383" d="M131 164h5v6h-5z"/><path fill="#777577" d="M109 164h5v6h-5z"/><path fill="#646164" d="M102 159h7v5h-6z"/><path fill="#42033e" d="M283 153h2v6h-6v-5z"/><path fill="#d7d7d7" d="M208 153h5v6h-5z"/><path fill="#ad5eae" d="M76 153h5v6h-5z"/><path fill="#171719" d="M120 153h5v6h-5z"/><path fill="#671f67" d="M103 148h6v5h-6z"/><path fill="#cfcfcf" d="M235 148h6v5h-6z"/><path fill="#dbdbdb" d="M213 148h6v5h-6z"/><path fill="#686868" d="M147 148h6v5h-6z"/><path fill="#aa3faa" d="M92 148h6v5h-6z"/><path fill="#605463" d="M120 142h5v6h-5z"/><path fill="#fbb0fb" d="m87 142 5 1v5h-6z"/><path fill="#818181" d="M175 142h5v6h-5z"/><path fill="#ececec" d="M224 137h6v5h-6z"/><path fill="#69586d" d="M125 137h6v5h-6z"/><path fill="#312f30" d="M153 131h5v6h-5z"/><path fill="#737374" d="M142 131h5v6h-5z"/><path fill="#ececec" d="M230 131h5v6h-5z"/><path fill="#545253" d="M186 131h5v6h-5z"/><path fill="#2b282b" d="M131 131h5v6h-5z"/><path fill="#2e232d" d="M120 131h5v6h-5z"/><path fill="#5e5563" d="m108 129 1 2h5v5h-5z"/><path fill="#413b3f" d="M158 126h6v5h-6z"/><path fill="#4c4c4c" d="M169 126h6v5h-6z"/><path fill="#d8d8d8" d="M241 120h5v6h-5z"/><path fill="#4e4d4d" d="M175 120h5v6h-5z"/><path fill="#050405" d="M142 120h5v6h-5z"/><path fill="#f89afa" d="M114 104h6v5h-6z"/><path fill="#f3f3f3" d="M257 104h6v5h-6z"/><path fill="#e2e2e2" d="M235 104h6l-1 5-5 1z"/><path fill="#d5d5d5" d="M234 101h1v8l-5-1-1-5h2z"/><path fill="#332530" d="M158 104h6v5h-6z"/><path fill="#393339" d="M125 104h6v5l-5 1z"/><path fill="#8f3291" d="M208 98h5v6h-5z"/><path fill="#755e77" d="M164 98h5v6h-5z"/><path fill="#786677" d="M169 93h6v5h-6z"/><path fill="#877487" d="M175 87h5v6h-5z"/><path fill="#919191" d="M296 76h5v6h-5z"/><path fill="#f8f8f8" d="M285 76h5v6h-5z"/><path fill="#919191" d="M301 71h6v5h-6z"/><path fill="#242325" d="M175 60h5v5h-6z"/><path fill="#bfbfbf" d="M318 54h5v6h-5z"/><path fill="#eaeaea" d="M307 54h5v6h-5z"/><path fill="#f1f1f1" d="M296 54h5v6h-5z"/><path fill="#e8e8e8" d="M301 49h6v5h-6z"/><path fill="#969696" d="M329 43h5v6h-5z"/><path fill="#d2d2d2" d="M323 38h6v5h-6z"/><path fill="#d3d3d3" d="M329 32h5v6h-5z"/><path fill="#c4c4c4" d="M334 27h6v5h-6z"/><path fill="#815d81" d="M43 335h7v2h-2v3h-5z"/><path fill="#d192cf" d="M208 313h5v6h-2l-1 2z"/><path fill="#a1929f" d="m48 307 7 1v4l-1-2h-4v3h-2z"/><path fill="#6f5f6e" d="M164 296h5v6l-5-1z"/><path fill="#912690" d="M213 269h6v5h-6z"/><path fill="#be6dc0" d="M98 263v6h-6v-4z"/><path fill="#898989" d="M159 258h5v5h-6z"/><path fill="#9d9d9d" d="M198 241h4v6h-5v-5z"/><path fill="#b11cb1" d="M48 236h5l1 5h-6z"/><path fill="#c935ca" d="M43 231h5l1 3 2 2h-8z"/><path fill="#999a9a" d="M186 230h5v5l-5 1z"/><path fill="#60575f" d="M98 230h5v6h-5z"/><path fill="#685f67" d="M22 214c9 1 9 1 12 3v2q-7 1-12-5"/><path fill="#554854" d="M71 203h5v5h-6z"/><path fill="#3b133a" d="M142 197h5v5l-5 1z"/><path fill="#574657" d="M153 192h5v5h-4l-1 4z"/><path fill="#635762" d="M42 177h1v9h-5v-5h4z"/><path fill="#433d45" d="M274 175h5v5l-5 1z"/><path fill="#242323" d="M131 175h5v6l-5-1z"/><path fill="#050607" d="M120 175h5v5l-5 1z"/><path fill="#998b97" d="m258 170-1 5h-5v-5z"/><path fill="#e5e5e5" d="M252 131h5v6h-5z"/><path fill="#9f9f9f" d="m260 114 3 1v5h-6z"/><path fill="#681c68" d="m103 109 1 2q2 3 6 3v-3l3-1v5h-10z"/><path fill="#691068" d="M200 65h2v5l-5 1-1-5z"/><path fill="#cfcfcf" d="M318 43h5v6l-5-1z"/><path fill="#e1e1e1" d="M308 43h4v6h-5v-5z"/><path fill="#bca5bb" d="M54 324h6v5h-6z"/><path fill="#da90dc" d="M165 318h4v10l-1-4h-3z"/><path fill="#978497" d="M148 302h5l-1 5h-5z"/><path fill="#b189ae" d="M136 280h6v10h-1l-1-7-4 1z"/><path fill="#746773" d="m132 274 4 1v5h-5v-5z"/><path fill="#d191ce" d="m87 268 5 1v5h-5z"/><path fill="#0e080f" d="m236 225 5 1v4h-6z"/><path fill="#363236" d="M76 181h5l1 4-4 1h-2z"/><path fill="#6a586a" d="M281 181h-2v5h-5v-5z"/><path fill="#974b97" d="M108 173h1v7h-6v-4h2l2-1z"/><path fill="#413843" d="M148 170h5l-1 5h-5z"/><path fill="#807681" d="m258 169 5 1v2l1 2 2 1h-7v-3l-2 2z"/><path fill="#e7a8e7" d="M81 143v5l-7 1h-4v-2h7v-3z"/><path fill="#f7f7f7" d="M246 110v5h-5l-1-5z"/><path fill="#f4a8f6" d="M103 93h5l1 5h-6z"/><path fill="#7f7183" d="m66 291 4 1v4h-8z"/><path fill="#774a77" d="m252 258 7 4-1 2h-5l-2-5z"/><path fill="#f2aaf3" d="M279 225h11v2h-2l-7 2z"/><path fill="#554a56" d="M233 170h2v5h-5l-1-4z"/><path fill="#888" d="M120 159h5v5l-5 1z"/><path fill="#b8b8b8" d="M197 153h5v6h-5z"/><path fill="#452345" d="M109 148h5v5l-5 1z"/><path fill="#b8b8b8" d="M235 148v5l-4 2-1-4v-2z"/><path fill="#322e33" d="M153 115v5h-8c5-5 5-5 8-5"/><path fill="#a134a0" d="m136 98 4 1v2h2v3h-6z"/><path fill="#605c61" d="M186 78h1v8l3 1v3h-2v2h-2z"/><path fill="#71696f" d="M154 73h4v4h-4q1 3 4 5h-5z"/><path fill="#dd68db" d="M159 71h5v10h-1l-2-6-2 1z"/><path fill="#3e193d" d="M37 341v5H27v-1h5l1-3z"/><path fill="#954d96" d="m43 323 5 1v5h-5z"/><path fill="#534654" d="M164 302h5l1 5h-6z"/><path fill="#89518a" d="m163 297 2 5h-7v-4z"/><path fill="#958796" d="M164 280h6l-1 5h-5z"/><path fill="#918392" d="M123 280h2v5h-5l-1-4z"/><path fill="#360c34" d="M87 280h5v5h-6z"/><path fill="#19181a" d="M213 246v6h-5v-5z"/><path fill="#d888d6" d="m121 235 4 1v5h-5v-5z"/><path fill="#8f8f8f" d="M197 236h5v5l-5 1z"/><path fill="#522354" d="M65 236h5v5h-6z"/><path fill="#776d78" d="M109 225h5v5l-4 1-1-4z"/><path fill="#685865" d="M274 192h5v5h-6z"/><path fill="#2f282f" d="M109 170h6l-1 5h-5z"/><path fill="#786c77" d="M66 169h4v6h-5z"/><path fill="#60605f" d="M141 159h6v5h-5z"/><path fill="#3c3d3c" d="M142 148h5v5l-4 1-1-4z"/><path fill="#373737" d="M164 137h6l-1 5h-5z"/><path fill="#756374" d="M32 346h5v5h-5z"/><path fill="#b6adb8" d="M21 324h5v5h-5z"/><path fill="#c87fc8" d="M32 324h6l-2 5h-4z"/><path fill="#9d889e" d="M175 324h5v5h-5z"/><path fill="#ddd8dc" d="M32 313h5v5h-5z"/><path fill="#c47ac1" d="M164 313h5v5h-5z"/><path fill="#a990a9" d="M175 313h5v5h-5z"/><path fill="#615463" d="M142 313h5v5h-5z"/><path fill="#816c81" d="M54 313h5v5h-5z"/><path fill="#d387d3" d="M208 302h5v5h-5z"/><path fill="#736473" d="M142 291h5v5h-5z"/><path fill="#584659" d="M131 280h5v5h-5z"/><path fill="#534953" d="M153 269h5v5h-5z"/><path fill="#312a2f" d="M142 269h5v5h-5z"/><path fill="#918393" d="M131 269h5v5h-5z"/><path fill="#4e114c" d="M98 269h5v5h-5z"/><path fill="#e26ce2" d="M263 258h5v5h-5z"/><path fill="#9a259a" d="M219 258h5v5h-5z"/><path fill="#4a4a4a" d="M153 258h5v5h-5z"/><path fill="#673b69" d="M109 253h5v5h-5z"/><path fill="#322d35" d="M230 247h5v5h-5z"/><path fill="#5a5a5a" d="M197 247h5v5h-5z"/><path fill="#393638" d="M175 247h5v5h-5z"/><path fill="#552b53" d="M125 241h6v4l-5 1z"/><path fill="#8a548a" d="M241 236h5v5h-5z"/><path fill="#250723" d="M131 236h5v5h-5z"/><path fill="#534453" d="M76 236h5v5h-5z"/><path fill="#706071" d="M230 236h5v5h-5z"/><path fill="#c63fc5" d="M285 230h5v5h-5z"/><path fill="#c65cc7" d="M274 225h5v5h-5z"/><path fill="#1f1a1f" d="M219 225h5v5h-5z"/><path fill="#a589a5" d="M76 225h5v5h-5z"/><path fill="#4a4a4a" d="M208 225h5v5h-5z"/><path fill="#a38da3" d="M175 225h5v5h-5z"/><path fill="#524652" d="M87 225h5v5h-5z"/><path fill="#523e52" d="M252 214h5v5h-5z"/><path fill="#727172" d="M230 214h5v5h-5z"/><path fill="#982097" d="M175 214h5v5h-5z"/><path fill="#978396" d="M65 214h5v5h-5z"/><path fill="#5e5361" d="M43 214h5v5h-5z"/><path fill="#463d48" d="M142 208h4l1 5-5 1z"/><path fill="#72276e" d="M274 203h5v5h-5z"/><path fill="#682368" d="M186 203h5v5h-5z"/><path fill="#858585" d="M120 203h5v5h-5z"/><path fill="#9f9f9f" d="M98 203h5v5h-5z"/><path fill="#877787" d="M76 203h5v5h-5z"/><path fill="#c568c5" d="M296 198h5v5h-5z"/><path fill="#881786" d="M175 192h5v5h-5z"/><path fill="#684e65" d="M142 192h5v5h-5z"/><path fill="#6b6b6b" d="M219 192h5v5h-5z"/><path fill="#333233" d="M208 192h5v5h-5z"/><path fill="#939594" d="M131 192h5v5h-5z"/><path fill="#878787" d="M120 192h5v5h-5z"/><path fill="#685e69" d="M65 192h5v5h-5z"/><path fill="#908791" d="M54 192h5v5h-5z"/><path fill="#705e70" d="M43 181h5v5h-5z"/><path fill="#473e45" d="M32 181h5v5h-5z"/><path fill="#494949" d="M219 181h5v5h-5z"/><path fill="#625060" d="M142 181h5v5h-5z"/><path fill="#262327" d="M120 181h5v5h-5z"/><path fill="#6d616d" d="M240 170h6v5l-5-1z"/><path fill="#616261" d="M131 170h5v5h-5z"/><path fill="#1b1d1c" d="M120 170h5v5h-5z"/><path fill="#474848" d="M109 159h5v5h-5z"/><path fill="#999" d="M208 159h5v5h-5z"/><path fill="#7c7c7b" d="M158 159h16v1h-6l-3 1-7 2z"/><path fill="#424242" d="M153 159h5v5h-5z"/><path fill="#616061" d="M131 159h5v5h-5z"/><path fill="#a36da7" d="M258 152h4l-1 3h-2l-1 3 5 1-1 2-5-2v-6z"/><path fill="#890588" d="M274 148h5v5h-5z"/><path fill="#5f5f5f" d="M175 148h5v5h-5z"/><path fill="#232323" d="M164 148h5v5h-5z"/><path fill="#dd82dd" d="M87 148h5v5h-5z"/><path fill="#9e9e9e" d="M175 137h5v5h-5z"/><path fill="#676867" d="M153 137h5v5h-5z"/><path fill="#b2b1b1" d="M142 137h5v5h-5z"/><path fill="#aaa" d="M241 126h5v5h-5z"/><path fill="#454745" d="M142 126h5v5h-5z"/><path fill="#1b1919" d="M156 125q3 2 2 6h-5v-5z"/><path fill="#deddde" d="M219 115h5v5h-5z"/><path fill="#bebebe" d="M263 115h5v5h-5z"/><path fill="#a0a0a0" d="M241 115h5v5h-5z"/><path fill="#252026" d="M186 115h5v5h-5z"/><path fill="#4a4349" d="M153 115h5v5h-5z"/><path fill="#68576b" d="M131 115h5v5h-5z"/><path fill="#613b64" d="M147 98h1v11h2l-1 6h-2z"/><path fill="#c7c7c7" d="M274 104h5v5h-5z"/><path fill="#a6a6a6" d="M263 104h5v5h-5z"/><path fill="#806a80" d="M175 104h5v5h-5z"/><path fill="#987e9c" d="M153 104h5v5h-5z"/><path fill="#a725a8" d="M104 104h5v5h-5z"/><path fill="#cc29cf" d="M136 93h5v5h-5z"/><path fill="#e2e2e2" d="M274 93h5v5h-5z"/><path fill="#a289a2" d="M175 93h5v5h-5z"/><path fill="#bababa" d="M296 82h5v5h-5z"/><path fill="#e7e7e7" d="M285 82h5v5h-5z"/><path fill="#5a4f5b" d="M175 82h5v5h-5z"/><path fill="#785b78" d="M164 82h5v5h-5z"/><path fill="#767575" d="M142 77h5v5h-5z"/><path fill="#c1c1c1" d="M307 71h5v5h-5z"/><path fill="#dcdcdc" d="M307 60h5v5h-5z"/><path fill="#d8d8d8" d="M296 60h5v5h-5z"/><path fill="#c5c5c5" d="M296 49h5v5h-5z"/><path fill="#b5b5b5" d="M329 49h5v5h-5z"/><path fill="#b1b1b1" d="M307 49h5v5h-5z"/><path fill="#919191" d="M318 38h5v5h-5z"/><path fill="#f2f2f2" d="M296 38h5v5h-5z"/><path fill="#b4b4b4" d="M340 27h5v5h-5z"/><path fill="#a3a3a3" d="M329 27h5v5h-5z"/><path fill="#846485" d="m157 353 2 1v2h4l1-3 1 4-4 1h-3z"/><path fill="#f390f2" d="M131 318h4v6h-4z"/><path fill="#6e1f6b" d="M126 296h4v6h-4z"/><path fill="#3d343d" d="M141 296v6h-4v-5z"/><path fill="#975198" d="M132 291h4v5h-5z"/><path fill="#9a8899" d="M153 291h5v5h-5z"/><path fill="#504250" d="M142 280h5l-1 5h-4z"/><path fill="#f796f7" d="M219 274h4v6h-4z"/><path fill="#080707" d="M208 236h5l-1 5h-4z"/><path fill="#894486" d="M274 230h2l1 5 3 1-4 1h-2z"/><path fill="#b229b3" d="M266 226h8v3h-8z"/><path fill="#58245a" d="M153 219h5l2 3 4 1v2h-6l-1-5z"/><path fill="#a81ea8" d="M48 203h6v4h-6z"/><path fill="#b362b1" d="M279 203h6v4h-6z"/><path fill="#4c4c4c" d="m208 203 5 1v4h-5z"/><path fill="#463745" d="M263 192h5v5l-5-1z"/><path fill="#9b7a9a" d="M52 192h2v5H43v-1h2l2-1h2z"/><path fill="#9d399e" d="M103 136h6v2l3 1-3 3v-3h-6z"/><path fill="#21151f" d="M131 137h5l1 3-6 2z"/><path fill="#bababa" d="M230 126h5v5l-5-1z"/><path fill="#972796" d="M125 121h5v5l-5-1z"/><path fill="#d13ed1" d="m115 110 5 1v4h-5z"/><path fill="#865787" d="M207 89h1v5l-5 1-1 6h-1v-8l4-1h2z"/><path fill="#f3f3f3" d="M318 71h5v5l-5-1z"/><path fill="#b45bb3" d="M126 318h5v5h-4z"/><path fill="#b557b5" d="M224 253h4l1 5h-5z"/><path fill="#f69bf6" d="m257 247 5 1 1 4h-6z"/><path fill="#221b23" d="M241 214h5v5h-4z"/><path fill="#0f0910" d="M99 214h4l-1 5h-4z"/><path fill="#c1c1c1" d="m109 203 5 1v4h-5z"/><path fill="#3d323d" d="m87 203 5 1v4h-5z"/><path fill="#463e47" d="M282 192h8l1 4-9-1z"/><path fill="#c28ec1" d="M62 147h7v1h-6v2h-2v3h-2v-5z"/><path fill="#be4ebf" d="M276 142h3v6h-4v-5z"/><path fill="#666465" d="M191 125v6h-5l1-4z"/><path fill="#38343a" d="M131 98h4v6h-4z"/><path fill="#544156" d="M158 94h6v9h-1l-2-7-1 2h-2z"/><path fill="#4c0f4b" d="M65 307h4v5l-4 1z"/><path fill="#8d3d8f" d="m191 264 6 2-1 3h-5z"/><path fill="#8a768a" d="m34 241 6 1v4h2l-1 2-4-1v-2z"/><path fill="#524251" d="M246 236h5l1 4h-6z"/><path fill="#7c747d" d="m285 219 4 1 1 5h-5z"/><path fill="#342a30" d="M153 220h4l1 5h-5z"/><path fill="#514d4f" d="m187 218 3 1-1 6h-3v-6z"/><path fill="#574c56" d="M87 214h5v5l-5-1z"/><path fill="#e382e1" d="M33 198h6l-3 5h-3z"/><path fill="#636363" d="M242 181h4v5l-5-1z"/><path fill="#6d2b6b" d="M169 176v6l-5-1 1-4z"/><path fill="#6b696b" d="M222 165h4v4l4 1-8-1z"/><path fill="#dd97dc" d="M65 153h5v4l-5 1z"/><path fill="#633962" d="M120 140v8h-6v-1h5v-4h-4v-2z"/><path fill="#5d535d" d="M186 93h5l-1 5h-4z"/><path fill="#756378" d="M153 93h5v5l-5-1z"/><path fill="#b147b1" d="M219 87h5l-1 5h-4z"/><path fill="#b78db4" d="m133 52 3 2 1 7-2-1v-5h-4l-1 2 1-4z"/><path fill="#d186d2" d="M165 45h3v4h2l-1 4-4-4z"/><path fill="#851482" d="M23 338h3v7h-3z"/><path fill="#af94af" d="m125 335 1 3 5 2v5l-1-4h-5z"/><path fill="#f298f1" d="M213 291h5l-1 5h-4z"/><path fill="#a247a3" d="m187 263 4 2v4h-4z"/><path fill="#a42a9f" d="M276 230h9l-1 4v-2h-6l-1 3z"/><path fill="#7b3b80" d="M253 220h4v6l-4-2z"/><path fill="#721373" d="M175 214v5h-6q2-6 6-5"/><path fill="#2c282a" d="M125 214v5l-5-1v-3z"/><path fill="#544852" d="m266 203 2 1v4h-5v-4z"/><path fill="#412043" d="M153 203h5v5h-4z"/><path fill="#d672d0" d="m318 198 5 1v3l-5 1z"/><path fill="#50154f" d="m147 197 5 1-1 4-2 1-2-1z"/><path fill="#838383" d="M194 157h3v7h-3z"/><path fill="#e897ea" d="M54 154h5v4h-5l-1-2z"/><path fill="#080409" d="m120 148 5 1-1 4h-5z"/><path fill="#594f57" d="m150 109 3 1v5h-4z"/><path fill="#af49af" d="M213 93h5l-1 5h-4z"/><path fill="#f99af9" d="m165 49 4 4-3 5h-1z"/><path fill="#e4e4e4" d="M334 49h6l-1 4-5-1z"/><path fill="#a569a3" d="M21 346h5v4h-5z"/><path fill="#cc86ce" d="M168 329h1v6h-3v2h-2v-4h3z"/><path fill="#ad89ad" d="m50 328 2 1v5l-4 1v-6z"/><path fill="#bb2abf" d="M54 302h5v4h-5z"/><path fill="#c92ac9" d="M264 263h4v5h-4z"/><path fill="#785077" d="M109 258h5l-1 4-4 1z"/><path fill="#4a1c4a" d="M218 249h1v9l-4-1z"/><path fill="#6d706b" d="M180 247h6v2h-4v4h-2z"/><path fill="#db67d7" d="M252 242h4v5h-4z"/><path fill="#b76db8" d="M32 236h5v4h-5z"/><path fill="#7f1480" d="M147 214h5l1 4h-5z"/><path fill="#d57fd4" d="M285 203h5v4h-5z"/><path fill="#f38af1" d="m43 199 2 1 9 2v1H42z"/><path fill="#911d8d" d="m193 196 3 1v5l-4-1z"/><path fill="#6f646e" d="m296 192 6 1v4h-4v-4z"/><path fill="#b460b4" d="M263 153v6l-5-1 1-4z"/><path fill="#be7bbd" d="m98 136 5 1-2 4-3 1z"/><path fill="#665863" d="M136 105h5v4h-5z"/><path fill="#942395" d="M99 98h4v5h-4z"/><path fill="#d076cd" d="M99 93h4v5h-4z"/><path fill="#8c0488" d="M219 77h4v5h-4z"/><path fill="#bb09be" d="M198 76h4v5h-4z"/><path fill="#d8a3d6" d="M126 335h5v5l-5-2z"/><path fill="#581e59" d="M124 309h1v9h-2l-1-7h2z"/><path fill="#816a81" d="m73 295 2 1-3 5h-2v-5z"/><path fill="#985c9b" d="M92 275v5h-5l1-4z"/><path fill="#c168be" d="M83 275h4v4h-5z"/><path fill="#b153af" d="M187 269h4v6l-4-2z"/><path fill="#8f588f" d="M103 263h7q-3 4-7 5z"/><path fill="#aa29aa" d="M100 258h3v5h-4z"/><path fill="#811d82" d="M132 226h4v4h-5z"/><path fill="#8e218e" d="m54 204 4 2v2H48v-1h6z"/><path fill="#6d0370" d="m274 153 4 1-1 4-3 1z"/><path fill="#372c34" d="M109 120h5v6l-5-4z"/><path fill="#707072" d="M130 97h1v7h-6l2-3h3z"/><path fill="#790478" d="m203 94 5 1-1 5-1-3-3 1z"/><path fill="#464246" d="m143 82 4 1v4h-4z"/><path fill="#d767d5" d="M132 82h4v5h-4z"/><path fill="#322c33" d="m147 74 6 2v5l-6-5z"/><path fill="#980294" d="M199 71h3v5h-4z"/><path fill="#988298" d="M138 70h8v3l-9-1z"/><path fill="#7c787b" d="M174 346h1v11h-3z"/><path fill="#7a107d" d="M26 335h10l-2 4-2-1v-1l-6-1z"/><path fill="#d971d9" d="M132 307h3v6h-3z"/><path fill="#31282e" d="M241 252h4v4h-3l-1 2z"/><path fill="#a774a7" d="M125 241v6l-5-2q1-3 5-4"/><path fill="#757177" d="M263 236h8l-2 1-6 4z"/><path fill="#741172" d="M143 220h3l-1 5h-3z"/><path fill="#474348" d="M288 215h2l1 3 3 1v2h-4v-2l-3-1z"/><path fill="#ba96b8" d="M15 208h6v4l-4 1v-3z"/><path fill="#908a91" d="M164 203h5v2h-3v4h-2z"/><path fill="#837784" d="M174 197h1v6h-6z"/><path fill="#8f9091" d="M178 159h4v2h4v2l-7-1z"/><path fill="#d167d0" d="m102 138 1 4-3 2-2 3v-5l3-1z"/><path fill="#9a019c" d="m286 143 2 1-1 4h-4l1-4z"/><path fill="#4e4d53" d="M115 137h5v3l-5 1z"/><path fill="#dc5adb" d="M136 87h6v6l-1-3-5-1z"/><path fill="#b38db6" d="M168 71h1v11h-4v-2l2-1 1-4z"/><path fill="#9a019a" d="M203 61h4v4l-5 1z"/><path fill="#818182" d="M27 346h5v4l-5-1z"/><path fill="#833f85" d="M192 280h4v4l-3 1z"/><path fill="#741c71" d="M213 269v5h-4v-4z"/><path fill="#724273" d="m189 258 4 2 1 1-1 3-3 1z"/><path fill="#8a468a" d="M247 252h5v6l-2-1v-3h-3z"/><path fill="#751975" d="M48 241h8q-3 4-8 3z"/><path fill="#873988" d="M246 241h6v2h-2l-4 4z"/><path fill="#4e424c" d="M257 226h4v4l-4 1z"/><path fill="#685069" d="M171 210h4v4h-5z"/><path fill="#bb9cbc" d="M18 202q-3 3-7 3H9v-2z"/><path fill="#931a90" d="M148 187h4v5h-3z"/><path fill="#c556c3" d="M100 175q-2 4-5 4l-2-3q4-3 7-1"/><path fill="#6a0670" d="M296 164h6l-5 5h-1z"/><path fill="#654f65" d="M251 153h2l2 5h-4z"/><path fill="#f496f1" d="m63 148 3 1-1 4h-4v-3h2z"/><path fill="#51014e" d="M285 148h5l-1 4h-4z"/><path fill="#ab56ab" d="M281 137h3v4l2 1h-5z"/><path fill="#fd9ffb" d="M109 98h2l2 6h-4z"/><path fill="#413b40" d="M154 82h3v5l-4-1z"/><path fill="#be82be" d="M164 76h4l-1 4h-2l-1 2z"/><path fill="#b203b6" d="M204 71h3v4h-5z"/><path fill="#656565" d="M290 211h4v2h-4z"/><path fill="#5d5d5d" d="m170 265 2 2-2 1z"/></svg>`,
    weaponAtk: 52,
    weaponDef: 25,
    weaponHpBonus: 20,
    weaponSkills: [
      { type: 'penetrate_per_turn', value: 40 },
      { type: 'regen_per_turn', hpRestore: 20, satietyRestore: 5 },
      { type: 'hotbar_shield', cutPercent: 50 },
      { type: 'mana_charge', manaPerTurn: 100, manaMax: 1200 },
    ],
    weaponUltimate: {
      name: '星天破滅創世光',
      description: '物理30×8+貫通20×8を与え、10ターン毒ダメージ(5)を付与する',
      physDamage: 30,
      physHits: 8,
      penetrateDamage: 20,
      penetrateHits: 8,
      postBuffTurns: 10,
      postBuffPoisonDmg: 5,
    },
    useEffect: { attackBonus: 52, message: '変幻始動す原初の剣斧で攻撃！', attackType: 'physical' },
  },
  // ========== ガチャ限定アイテム ==========
  revolution_sword: {
    id: 'revolution_sword', name: 'Revolution Sword',
    description: 'ガチャ限定の伝説の剣。3ターンに1回、貫通攻撃15を与える。装備中HP+10。',
    category: 'weapon', itemType: 'Weapon', rarity: 'legendary',
    sellPrice: 0, buyPrice: 0, maxStack: 1, icon: 'gacha_sword',
    pngIcon: 'data:image/png;base64,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',
    weaponAtk: 7,
    weaponHpBonus: 10,
    weaponSkills: [{ type: 'penetrate_per_turn' as const, value: 15 }],
    useEffect: { attackBonus: 7, message: 'Revolution Swordで斬りつけた！', attackType: 'physical' },
  },
  revolution_armor_helmet: {
    id: 'revolution_armor_helmet', name: 'Revolution Armor [頭]',
    description: 'Revolution Armorの頭部。25%の確率で被ダメージを75%カット。',
    category: 'armor', itemType: 'Armor', rarity: 'legendary',
    sellPrice: 0, buyPrice: 0, maxStack: 1, icon: 'rev_armor_helmet',
    weaponDef: 3,
    weaponSkills: [{ type: 'hotbar_shield' as const, cutPercent: 75 }],
  },
  revolution_armor_chest: {
    id: 'revolution_armor_chest', name: 'Revolution Armor [胸]',
    description: 'Revolution Armorの胴体。25%の確率で被ダメージを75%カット。',
    category: 'armor', itemType: 'Armor', rarity: 'legendary',
    sellPrice: 0, buyPrice: 0, maxStack: 1, icon: 'rev_armor_chest',
    weaponDef: 5,
    weaponSkills: [{ type: 'hotbar_shield' as const, cutPercent: 75 }],
  },
  revolution_armor_leggings: {
    id: 'revolution_armor_leggings', name: 'Revolution Armor [脚]',
    description: 'Revolution Armorの脚部。25%の確率で被ダメージを75%カット。',
    category: 'armor', itemType: 'Armor', rarity: 'legendary',
    sellPrice: 0, buyPrice: 0, maxStack: 1, icon: 'rev_armor_leggings',
    weaponDef: 3,
    weaponSkills: [{ type: 'hotbar_shield' as const, cutPercent: 75 }],
  },
  revolution_armor_boots: {
    id: 'revolution_armor_boots', name: 'Revolution Armor [足]',
    description: 'Revolution Armorの靴。25%の確率で被ダメージを75%カット。',
    category: 'armor', itemType: 'Armor', rarity: 'legendary',
    sellPrice: 0, buyPrice: 0, maxStack: 1, icon: 'rev_armor_boots',
    weaponDef: 2,
    weaponSkills: [{ type: 'hotbar_shield' as const, cutPercent: 75 }],
  },
  revolution_healwand: {
    id: 'revolution_healwand', name: 'Revolution Healwand',
    description: 'ガチャ限定の回復杖。使用するとHPを30回復。消耗しない。',
    category: 'weapon', itemType: 'Heal', rarity: 'legendary',
    sellPrice: 0, buyPrice: 0, maxStack: 1, icon: 'gacha_wand', nonconsumable: true,
    pngIcon: 'data:image/png;base64,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',
    useEffect: { hpRestore: 30, message: 'Revolution Healwandでオーラを放った！回復！' },
  },
  revolution_defencer: {
    id: 'revolution_defencer', name: 'Revolution Defencer',
    description: 'ガチャ限定の防御武器。使用すると2ターン間、被ダメージを80%カット。',
    category: 'weapon', itemType: 'Weapon', rarity: 'legendary',
    sellPrice: 0, buyPrice: 0, maxStack: 1, icon: 'rev_defencer',
    weaponAtk: 0,
    useEffect: { buffType: 'shield_80', buffDuration: 2, message: 'Revolution Defencerを構えた！2ターン間ダメージ80%カット！' },
  },
  gacha_multiplier_ticket: {
    id: 'gacha_multiplier_ticket', name: 'ギャンブル倍率2倍チケット',
    description: 'ギャンブルの倍率を一時的に2倍にする(1ゲームで消費)。',
    category: 'consumable', itemType: 'Item', rarity: 'rare',
    sellPrice: 0, buyPrice: 0, maxStack: 99, icon: 'ticket',
    useEffect: { buffType: 'gamble_double', message: 'ギャンブル倍率2倍チケットを使用！' },
  },
  gacha_lose_ticket: {
    id: 'gacha_lose_ticket', name: 'ハズレチケット',
    description: '20枚集めると20万Gと交換できる。',
    category: 'consumable', itemType: 'Item', rarity: 'common',
    sellPrice: 0, buyPrice: 0, maxStack: 99, icon: 'scroll',
  },
  netherite_ingot:{ id:'netherite_ingot',name:'ネザライトインゴット', description:'最高位の素材。',        category:'material',  itemType:'Item', rarity:'legendary', sellPrice:8000, buyPrice:0, maxStack:64, icon:'trophy' },
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
    shape: ['','','', '','wood','', '','',''],
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
    shape: ['stone','','', 'stone','','', 'stone','',''],
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
    shape: ['wood','plank','wood', 'wood','','wood', 'wood','plank','wood'],
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
    shape: ['','iron_ore','', '','iron_ore','', '','coal',''],
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
    shape: ['iron_ingot','','', 'iron_ingot','','', 'iron_ingot','','plank'],
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
    shape: ['iron_ingot','iron_ingot','iron_ingot', 'iron_ingot','','iron_ingot', '','',''],
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
    shape: ['','slime_gel','', '','spirit_ice','', '','slime_gel',''],
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
    shape: ['health_potion','','health_potion', '','ancient_shard','', '','',''],
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
    shape: ['polishing_agent_1','','polishing_agent_1', 'polishing_agent_1','polishing_agent_1','polishing_agent_1', '','polishing_agent_5',''],
    requiredCraftingLevel: 15,
    craftingExpGain: 120,
  },
  {
    id: 'golden_bar_from_ore',
    name: '金塊を精錬する',
    description: '金鉱石と石炭を使って金塊を作る。',
    outputItemId: 'golden_bar',
    outputAmount: 1,
    inputs: [{ itemId: 'gold_ore', amount: 2 }, { itemId: 'coal', amount: 1 }],
    shape: ['','gold_ore','', '','gold_ore','', '','coal',''],
    requiredCraftingLevel: 5,
    craftingExpGain: 40,
  },
  {
    id: 'wooden_knife_from_plank',
    name: '木のナイフを作る',
    description: '板材から素朴なナイフを作る。攻撃力+1。',
    outputItemId: 'wooden_knife',
    outputAmount: 1,
    inputs: [{ itemId: 'plank', amount: 2 }],
    shape: ['','plank','', '','plank','', '','',''],
    requiredCraftingLevel: 1,
    craftingExpGain: 10,
  },
  {
    id: 'golden_knife_from_bar',
    name: '金のナイフを作る',
    description: '金塊から輝くナイフを作る。攻撃力+3。',
    outputItemId: 'golden_knife',
    outputAmount: 1,
    inputs: [{ itemId: 'golden_bar', amount: 2 }, { itemId: 'plank', amount: 1 }],
    shape: ['','golden_bar','', '','golden_bar','', '','plank',''],
    requiredCraftingLevel: 6,
    craftingExpGain: 50,
  },
  {
    id: 'diamond_sword_from_diamond',
    name: 'ダイヤの剣を作る',
    description: 'ダイヤモンドから剣を鍛造する。攻撃力+7。',
    outputItemId: 'diamond_sword',
    outputAmount: 1,
    inputs: [{ itemId: 'diamond', amount: 2 }, { itemId: 'plank', amount: 1 }],
    shape: ['','diamond','', '','diamond','', '','plank',''],
    requiredCraftingLevel: 15,
    craftingExpGain: 200,
  },
  {
    id: 'endstone_sword_from_endstone',
    name: 'エンドストーンの剣を作る',
    description: 'エンドストーンから剣を作る。攻撃力+8。',
    outputItemId: 'endstone_sword',
    outputAmount: 1,
    inputs: [{ itemId: 'end_stone', amount: 3 }, { itemId: 'plank', amount: 1 }],
    shape: ['','end_stone','', 'end_stone','end_stone','', '','plank',''],
    requiredCraftingLevel: 18,
    craftingExpGain: 220,
  },
  {
    id: 'iron_chestplate_from_ingot',
    name: '鉄のチェストプレートを作る',
    description: '鉄塊から胴体防具を鍛造する。防御力+5。',
    outputItemId: 'iron_chestplate',
    outputAmount: 1,
    inputs: [{ itemId: 'iron_ingot', amount: 8 }],
    shape: ['iron_ingot','','iron_ingot', 'iron_ingot','iron_ingot','iron_ingot', 'iron_ingot','iron_ingot','iron_ingot'],
    requiredCraftingLevel: 12,
    craftingExpGain: 130,
  },
  {
    id: 'iron_leggings_from_ingot',
    name: '鉄のレギンスを作る',
    description: '鉄塊から脚部防具を鍛造する。防御力+4。',
    outputItemId: 'iron_leggings',
    outputAmount: 1,
    inputs: [{ itemId: 'iron_ingot', amount: 7 }],
    shape: ['iron_ingot','iron_ingot','iron_ingot', 'iron_ingot','','iron_ingot', 'iron_ingot','','iron_ingot'],
    requiredCraftingLevel: 11,
    craftingExpGain: 110,
  },
  {
    id: 'iron_boots_from_ingot',
    name: '鉄のブーツを作る',
    description: '鉄塊から足部防具を鍛造する。防御力+2。',
    outputItemId: 'iron_boots',
    outputAmount: 1,
    inputs: [{ itemId: 'iron_ingot', amount: 4 }],
    shape: ['','','', 'iron_ingot','','iron_ingot', 'iron_ingot','','iron_ingot'],
    requiredCraftingLevel: 10,
    craftingExpGain: 80,
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
  gold_vein:      { id:'gold_vein',      name:'金鉱脈',            description:'希少な金を含む鉱脈。',  icon:'sparkle', requiredSkill:{skillId:'mining',minLevel:25}, cooldownMs:15000, staminaCost:20, drops:[{itemId:'gold_ore',baseRate:1.0,minAmount:1,maxAmount:3,skillRateBonus:0.12},{itemId:'golden_bar',baseRate:0.30,minAmount:1,maxAmount:1},{itemId:'emerald',baseRate:0.15,minAmount:1,maxAmount:2}] },
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
    icon:'slot_machine', type:'slot', minBet:10, maxBet:10000, returnRate:0.95,
    rewardTable:[
      { label:'💰💰💰 JACKPOT!',  probability:0.003, multiplier:50,  symbols:['💰','💰','💰'] },
      { label:'🌟🌟🌟 BIG WIN!', probability:0.015, multiplier:10,  symbols:['🌟','🌟','🌟'] },
      { label:'🍒🍒🍒 MIDDLE',   probability:0.040, multiplier:5,   symbols:['🍒','🍒','🍒'] },
      { label:'🍋🍋🍋 SMALL',    probability:0.060, multiplier:2.5, symbols:['🍋','🍋','🍋'] },
      { label:'🔄🔄🔄 REPLAY',   probability:0.050, multiplier:1.0, symbols:['🔄','🔄','🔄'] },
      { label:'🥉 2枚揃い',      probability:0.230, multiplier:1.1, symbols:['🍒','🍒','💨'] },
      { label:'ハズレ',           probability:0.602, multiplier:0,   symbols:['💨','💨','💨'] },
    ],
  },
  treasure_box: {
    id:'treasure_box', name:'宝箱くじ', description:'宝箱を開けてみよう。1回30,000G',
    icon:'box', type:'treasure_box', minBet:30000, maxBet:30000, returnRate:0.92,
    rewardTable:[
      { label:'ドラゴンの鱗（超激レア！）', probability:0.008, multiplier:0,   itemRewards:[{itemId:'dragon_scale',amount:1}], symbols:['🐉'] },
      { label:'古代の欠片×3（激レア）',     probability:0.020, multiplier:0,   itemRewards:[{itemId:'ancient_shard',amount:3}], symbols:['💎'] },
      { label:'300,000G大当り！',           probability:0.010, multiplier:10,     symbols:['💰'] },
      { label:'100,000G当り！',             probability:0.070, multiplier:3.333,  symbols:['🤑'] },
      { label:'回復セット（メガポ10・焼肉50）', probability:0.170, multiplier:0, itemRewards:[{itemId:'mega_potion',amount:10},{itemId:'roast_meat',amount:50}], symbols:['🧪'] },
      { label:'50,000G',                    probability:0.239, multiplier:1.667,  symbols:['🪙'] },
      { label:'ハズレ（空の宝箱）',          probability:0.483, multiplier:0,   symbols:['📭'] },
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
    version: '2.2.8',
    date: '2026-06-07',
    changes: [
      '🎨 金塊・木のナイフ・金のナイフ・ダイヤの剣・エンドストーンの剣のアイコンを改善',
      '🗡️ 鉄の剣アイコンを剣らしいデザインに変更',
      '🛡️ 鉄の防具（胸・脚・足）アイコンを各部位の形状に改善',
      '🔰 Revolution Armor（胸・脚・足）が誤ってRevolution Defencerのアイコンになっていたバグを修正',
      '🪄 Revolution Healwandがダンジョンで消費されてしまうバグを修正',
      '💰 管理者パネルのアイテムタブで変更した購入・売却価格が市場に反映されるよう修正',
      '🛒 購入価格が0のアイテムは市場の購入タブに表示されないよう修正',
      '🎫 機能提案を承認した際に提案チケットが正しく付与されるよう修正',
      '🛡️ 状態タブの防具スロットで装備中のアイテムアイコンが正しく表示されるよう修正',
      '📦 宝箱の各景品の当選確率を調整',
      '⚙️ 管理者パネルのギャンブルタブから宝箱の当選確率をリアルタイムで変更できる機能を追加',
    ],
  },
  {
    version: '2.2.7',
    date: '2026-06-07',
    changes: [
      '🗡️ 新武器追加：木のナイフ(ATK+1)・金のナイフ(ATK+3)・ダイヤの剣(ATK+7)・エンドストーンの剣(ATK+8)',
      '🛡️ 新防具追加：鉄のチェストプレート(DEF+5)・鉄のレギンス(DEF+4)・鉄のブーツ(DEF+2)',
      '🥇 新素材追加：金塊（金鉱石×2＋石炭×1で精錬、または金鉱脈から30%でドロップ）',
      '⚒️ 上記すべての製作レシピをクラフト台に追加',
    ],
  },
  {
    version: '2.2.6',
    date: '2026-06-07',
    changes: [
      '🎰 ダンジョンガチャ追加：ダンジョンクリアでガチャコイン獲得、ダンジョンタブ内のガチャタブで引ける',
      '⚔️ ガチャ限定武器「Revolution Sword」追加：攻撃力7、HP+10、3ターンに1回貫通攻撃15',
      '🛡️ ガチャ限定防具「Revolution Armor」一式追加：防御力合計13、25%で被ダメ75%カット',
      '🪄 ガチャ限定回復武器「Revolution Healwand」追加：使用でHP+30（消耗なし）',
      '🔰 ガチャ限定防御武器「Revolution Defencer」追加：使用で2ターン間ダメ80%カット',
      '🎫 ギャンブル倍率2倍チケット追加：ガチャから入手、ギャンブルタブで使用可能',
      '💸 ハズレチケット追加：20枚集めると20万Gと交換',
    ],
  },
  {
    version: '2.2.5',
    date: '2026-06-06',
    changes: [
      '🎰 ソロスロット：払い出し表示を修正（100G賭けて2枚揃い→+110Gと正しく表示）',
      '⚒️ クラフト台：素材を複数置くと一括製作に対応（木材5個→板材10個など）',
      '💡 提案システム追加：オンライン→提案タブから運営に機能要望を送信可能に',
      '✅ 管理者パネルに提案タブ追加：承認で提案チケット付与・却下が可能に',
      '🎫 投票チケットを「提案チケット」に名称変更',
      '⏱️ OTT（オンタイムチケット）：10分プレイで1枚自動付与',
      '📖 管理者レシピタブ：3×3グリッドでクラフト配置を登録できるように',
    ],
  },
  {
    version: '2.2.4',
    date: '2026-06-06',
    changes: [
      '♠ TH対戦：2人対戦テーブルの作成が可能に（Firestoreルール修正）',
      '♠ TH対戦：チェック後にコミュニティカードが配られないバグを修正',
      '♠ TH対戦：全員オールイン時に自動でショーダウンまで進むよう修正',
      '📋 掲示板への投稿失敗バグを修正（コレクション名ミスマッチ修正）',
      '⚔️ ギャンブル対戦の勝敗がアクティビティに表示されるように（丁半・チンチロ等）',
      '⚙️ 管理者パネルでアイテム追加・編集時、自分のインベントリに即時反映されるよう修正',
    ],
  },
  {
    version: '2.2.3',
    date: '2026-06-06',
    changes: [
      '♠ TH対戦テーブルの作成失敗バグを修正（Firestoreルール更新）',
      '⛒️ クラフトが位置対応に！正しい配置でないと製作不可のマインクラフト風システムに',
      '🪙 コインフリップが「倍」チキンレース」に刷新！表が出るたびに2倍、裏で全没収。好きなタイミングで利確を',
      '🗡️ 変幻始動す原初の剣斧のアイコン背景黒調不具合を修正',
    ],
  },
  {
    version: '2.2.2',
    date: '2026-06-05',
    changes: [
      '🃏 TH対戦（テキサスホールデム）のテーブル作成バグを修正（Firestoreルール更新）',
      '🗡️ 武器（石のナイフ等）をホットバーから戦闘中に使用可能に！通常攻撃＋武器ボーナスダメージ',
      '📦 宝箱の当選金額が正しく反映されるようバグを修正（50,000G・100,000G・300,000G）',
      '📋 所持品タブでアイテムの説明文・詳細情報を確認できるようになった',
      '⚙️ 管理者パネルにアイテムの購入・売却金額調整機能を追加',
      '🍖 満腹度上限購入を市場の購入タブからも確認可能に',
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

export const COMMANDS: Record<string, { id:string; name:string; description:string; effect:string; category:'job'|'display'|'protect'|'economy'|'travel';  itemType:'Item' }> = {
  jobs_mining:  { id:'jobs_mining',  name:'/jobs join miner',   description:'採掘職業に就く。',    effect:'mining_income',    category:'job',  itemType:'Item' },
  jobs_fisher:  { id:'jobs_fisher',  name:'/jobs join fisher',  description:'釣り師職業に就く。',  effect:'fishing_income',   category:'job',  itemType:'Item' },
  jobs_woodcut: { id:'jobs_woodcut', name:'/jobs join woodcut', description:'木こり職業に就く。',  effect:'woodcut_income',   category:'job',  itemType:'Item' },
  mls:          { id:'mls',          name:'/mls',               description:'アイテム獲得ログ切替。', effect:'toggle_log',    category:'display',  itemType:'Item' },
  dropnotify:   { id:'dropnotify',   name:'/dropnotify',        description:'ドロップ通知切替。',   effect:'toggle_dropnotify',category:'display',  itemType:'Item' },
  dropprotect:  { id:'dropprotect',  name:'/dropprotect',       description:'レア度別ドロップ設定。', effect:'toggle_protect', category:'protect',  itemType:'Item' },
  gomiprotect:  { id:'gomiprotect',  name:'/gomiprotect',       description:'アイテムを捨てないよう設定。', effect:'toggle_gomi', category:'protect',  itemType:'Item' },
  fly:          { id:'fly',          name:'/fly',               description:'有料で飛行可能。',     effect:'enable_fly',       category:'travel',  itemType:'Item' },
  speedfly:     { id:'speedfly',     name:'/speedfly',          description:'高速飛行。有料。',     effect:'enable_speedfly',  category:'travel',  itemType:'Item' },
  ott:          { id:'ott',          name:'/ott',               description:'OTTに変換。',          effect:'convert_ott',      category:'economy',  itemType:'Item' },
  sb_shop:      { id:'sb_shop',      name:'/sb shop',           description:'ストレージボックス購入。', effect:'open_sb_shop', category:'economy',  itemType:'Item' },
};
