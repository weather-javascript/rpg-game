// src/data/lifeSystemData.ts
// ver3.0.0: 生活系コンテンツ拡張（農業・料理・錬金・精錬・標本収集/図鑑）データ。

import type { ItemMaster } from '../types/game';
import type { CropDef, LifeRecipeDef, CollectionDef } from '../types/buildTypes';

// ============================================================
// 農業
// ============================================================
export const CROP_MASTER: Record<string, CropDef> = {
  wheat_crop: {
    id: 'wheat_crop', name: '小麦', description: '基本の農作物。料理の主原料になる。', icon: 'wheat',
    seedItemId: 'wheat_seed', produceItemId: 'wheat', growthMs: 10 * 60 * 1000, baseYield: 3,
    qualityProduceItemId: 'wheat_quality', qualityChance: 0.15, requiredLevel: 1,
  },
  herb_crop: {
    id: 'herb_crop', name: '薬草', description: '錬金の基礎素材になる薬草。', icon: 'herb',
    seedItemId: 'herb_seed', produceItemId: 'medicinal_herb', growthMs: 20 * 60 * 1000, baseYield: 2,
    qualityProduceItemId: 'medicinal_herb_quality', qualityChance: 0.12, requiredLevel: 5,
  },
  spice_crop: {
    id: 'spice_crop', name: '香辛料', description: '料理に風味を加える。高品質ほど効果UP。', icon: 'spice',
    seedItemId: 'spice_seed', produceItemId: 'spice', growthMs: 30 * 60 * 1000, baseYield: 2,
    qualityProduceItemId: 'spice_quality', qualityChance: 0.10, requiredLevel: 10,
  },
  starflower_crop: {
    id: 'starflower_crop', name: '星花', description: '高級錬金素材。栽培難度が高い。', icon: 'flower',
    seedItemId: 'starflower_seed', produceItemId: 'starflower', growthMs: 60 * 60 * 1000, baseYield: 1,
    qualityProduceItemId: 'starflower_quality', qualityChance: 0.08, requiredLevel: 25,
  },
};

export const FARM_WATER_YIELD_BONUS = 0.20;     // 水やり済みなら収穫量+20%
export const FARM_FERTILIZER_QUALITY_BONUS = 0.10; // 肥料済みなら高品質化率+10%

export const FARM_ITEMS: Record<string, ItemMaster> = {
  wheat_seed:   { id:'wheat_seed', name:'小麦の種', description:'畑に植えると小麦が育つ。', category:'material', itemType:'Item', rarity:'common', sellPrice:5, buyPrice:10, maxStack:99, icon:'wheat' },
  wheat:        { id:'wheat', name:'小麦', description:'料理の基本素材。', category:'material', itemType:'Item', rarity:'common', sellPrice:8, buyPrice:0, maxStack:99, icon:'wheat' },
  wheat_quality:{ id:'wheat_quality', name:'高品質な小麦', description:'高品質な小麦。料理効果が高い。', category:'material', itemType:'Item', rarity:'uncommon', sellPrice:20, buyPrice:0, maxStack:99, icon:'wheat' },
  herb_seed:    { id:'herb_seed', name:'薬草の種', description:'畑に植えると薬草が育つ。', category:'material', itemType:'Item', rarity:'common', sellPrice:10, buyPrice:20, maxStack:99, icon:'herb' },
  medicinal_herb: { id:'medicinal_herb', name:'薬草', description:'錬金の基礎素材。', category:'material', itemType:'Item', rarity:'common', sellPrice:15, buyPrice:0, maxStack:99, icon:'herb' },
  medicinal_herb_quality: { id:'medicinal_herb_quality', name:'高品質な薬草', description:'高品質な薬草。錬金効果が高い。', category:'material', itemType:'Item', rarity:'uncommon', sellPrice:40, buyPrice:0, maxStack:99, icon:'herb' },
  spice_seed:   { id:'spice_seed', name:'香辛料の種', description:'畑に植えると香辛料が育つ。', category:'material', itemType:'Item', rarity:'uncommon', sellPrice:25, buyPrice:50, maxStack:99, icon:'spice' },
  spice:        { id:'spice', name:'香辛料', description:'料理の風味付けに使う。', category:'material', itemType:'Item', rarity:'uncommon', sellPrice:35, buyPrice:0, maxStack:99, icon:'spice' },
  spice_quality:{ id:'spice_quality', name:'極上の香辛料', description:'極上の香辛料。料理の大成功率を上げる。', category:'material', itemType:'Item', rarity:'rare', sellPrice:90, buyPrice:0, maxStack:99, icon:'spice' },
  starflower_seed: { id:'starflower_seed', name:'星花の種', description:'畑に植えると星花が育つ。栽培難度が高い。', category:'material', itemType:'Item', rarity:'rare', sellPrice:80, buyPrice:150, maxStack:99, icon:'flower' },
  starflower:   { id:'starflower', name:'星花', description:'高級錬金素材。', category:'material', itemType:'Item', rarity:'rare', sellPrice:150, buyPrice:0, maxStack:99, icon:'flower' },
  starflower_quality: { id:'starflower_quality', name:'満開の星花', description:'満開の星花。最上位錬金素材。', category:'material', itemType:'Item', rarity:'epic', sellPrice:400, buyPrice:0, maxStack:99, icon:'flower' },
  fertilizer:   { id:'fertilizer', name:'肥料', description:'畑に使うと高品質化率が上昇する。', category:'material', itemType:'Item', rarity:'common', sellPrice:10, buyPrice:30, maxStack:99, icon:'bag' },
};

// ============================================================
// 料理・錬金・精錬
// ============================================================
export const LIFE_RECIPES: LifeRecipeDef[] = [
  // ---- 料理（戦闘向け／採取向け／釣り向け／店売り向け） ----
  {
    id: 'dish_power_stew', name: '力の濃厚シチュー', description: '食べると一定時間、攻撃力が上昇する。',
    category: 'cooking', inputs: [{ itemId: 'wheat', amount: 2 }, { itemId: 'spice', amount: 1 }],
    outputItemId: 'dish_power_stew', outputAmount: 1, requiredLevel: 1, expGain: 30,
    greatSuccessChance: 0.15, greatSuccessMultiplier: 2,
  },
  {
    id: 'dish_gatherers_bento', name: '採取人の弁当', description: '食べると一定時間、採取成功率と採取量が上昇する。',
    category: 'cooking', inputs: [{ itemId: 'wheat', amount: 2 }, { itemId: 'medicinal_herb', amount: 1 }],
    outputItemId: 'dish_gatherers_bento', outputAmount: 1, requiredLevel: 5, expGain: 50,
    greatSuccessChance: 0.15, greatSuccessMultiplier: 2,
  },
  {
    id: 'dish_anglers_rice_ball', name: '釣り人のおにぎり', description: '食べると一定時間、釣りの成功率とレア魚率が上昇する。',
    category: 'cooking', inputs: [{ itemId: 'wheat', amount: 2 }, { itemId: 'spice', amount: 1 }],
    outputItemId: 'dish_anglers_rice_ball', outputAmount: 1, requiredLevel: 5, expGain: 50,
    greatSuccessChance: 0.15, greatSuccessMultiplier: 2,
  },
  {
    id: 'dish_merchants_tea', name: '商人の特製茶', description: '飲むと一定時間、店売り価格が上昇する。',
    category: 'cooking', inputs: [{ itemId: 'medicinal_herb', amount: 2 }, { itemId: 'spice', amount: 1 }],
    outputItemId: 'dish_merchants_tea', outputAmount: 1, requiredLevel: 10, expGain: 70,
    greatSuccessChance: 0.12, greatSuccessMultiplier: 2,
  },
  {
    id: 'dish_feast_platter', name: '大成功の宴の皿', description: '高品質食材を使った豪華な料理。複数効果が同時に発動する。',
    category: 'cooking', inputs: [{ itemId: 'wheat_quality', amount: 1 }, { itemId: 'spice_quality', amount: 1 }, { itemId: 'medicinal_herb_quality', amount: 1 }],
    outputItemId: 'dish_feast_platter', outputAmount: 1, requiredLevel: 25, expGain: 200,
    greatSuccessChance: 0.20, greatSuccessMultiplier: 1.5,
  },
  // ---- 錬金 ----
  {
    id: 'alchemy_minor_potion', name: '簡易ポーション', description: '薬草から作る基本の回復薬。',
    category: 'alchemy', inputs: [{ itemId: 'medicinal_herb', amount: 3 }],
    outputItemId: 'alchemy_minor_potion', outputAmount: 2, requiredLevel: 1, expGain: 25,
    greatSuccessChance: 0.15, greatSuccessMultiplier: 2,
  },
  {
    id: 'alchemy_catalyst_powder', name: '触媒の粉', description: '生活スキルの効率を高める粉。',
    category: 'alchemy', inputs: [{ itemId: 'medicinal_herb_quality', amount: 2 }, { itemId: 'spice', amount: 1 }],
    outputItemId: 'alchemy_catalyst_powder', outputAmount: 1, requiredLevel: 15, expGain: 80,
    greatSuccessChance: 0.12, greatSuccessMultiplier: 2,
  },
  {
    id: 'alchemy_awaken_pity_shard_boost', name: '救済の残光・精製', description: '星花を使い、覚醒失敗時の救済素材を精製する。',
    category: 'alchemy', inputs: [{ itemId: 'starflower', amount: 2 }],
    outputItemId: 'awaken_pity_shard', outputAmount: 2, requiredLevel: 30, expGain: 150,
    greatSuccessChance: 0.10, greatSuccessMultiplier: 2,
  },
  {
    id: 'alchemy_grand_elixir', name: '満開エリクサー', description: '満開の星花から作る最上位回復薬。',
    category: 'alchemy', inputs: [{ itemId: 'starflower_quality', amount: 1 }, { itemId: 'medicinal_herb_quality', amount: 3 }],
    outputItemId: 'alchemy_grand_elixir', outputAmount: 1, requiredLevel: 45, expGain: 400,
    greatSuccessChance: 0.10, greatSuccessMultiplier: 2,
  },
  // ---- 精錬／加工 ----
  {
    id: 'refine_iron_ingot_plus', name: '高純度鉄インゴット', description: '鉄インゴットを精錬し、単純売却より高い価値を持つ素材にする。',
    category: 'refining', inputs: [{ itemId: 'iron_ingot', amount: 3 }],
    outputItemId: 'refined_iron_ingot', outputAmount: 1, requiredLevel: 1, expGain: 20,
    greatSuccessChance: 0.15, greatSuccessMultiplier: 2,
  },
  {
    id: 'refine_gold_ingot_plus', name: '高純度金インゴット', description: '金インゴットを精錬する。',
    category: 'refining', inputs: [{ itemId: 'golden_bar', amount: 3 }],
    outputItemId: 'refined_gold_ingot', outputAmount: 1, requiredLevel: 10, expGain: 60,
    greatSuccessChance: 0.13, greatSuccessMultiplier: 2,
  },
  {
    id: 'refine_fish_oil', name: '魚油の精製', description: '釣った魚を加工し、単純売却よりも高価値な魚油にする。',
    category: 'refining', inputs: [{ itemId: 'small_fish', amount: 5 }],
    outputItemId: 'refined_fish_oil', outputAmount: 1, requiredLevel: 5, expGain: 40,
    greatSuccessChance: 0.15, greatSuccessMultiplier: 2,
  },
];

export const LIFE_RECIPE_ITEMS: Record<string, ItemMaster> = {
  dish_power_stew:        { id:'dish_power_stew', name:'力の濃厚シチュー', description:'食べると一定時間、攻撃力+8%。', category:'food', itemType:'Heal', rarity:'common', sellPrice:60, buyPrice:0, maxStack:20, icon:'food', nonconsumable:false, useEffect:{ message:'攻撃力が一時的に上昇した！' } },
  dish_gatherers_bento:    { id:'dish_gatherers_bento', name:'採取人の弁当', description:'食べると一定時間、採取成功率・採取量が上昇する。', category:'food', itemType:'Heal', rarity:'common', sellPrice:60, buyPrice:0, maxStack:20, icon:'food' },
  dish_anglers_rice_ball:  { id:'dish_anglers_rice_ball', name:'釣り人のおにぎり', description:'食べると一定時間、釣りの成功率・レア魚率が上昇する。', category:'food', itemType:'Heal', rarity:'common', sellPrice:60, buyPrice:0, maxStack:20, icon:'food' },
  dish_merchants_tea:      { id:'dish_merchants_tea', name:'商人の特製茶', description:'飲むと一定時間、店売り価格が上昇する。', category:'food', itemType:'Heal', rarity:'uncommon', sellPrice:90, buyPrice:0, maxStack:20, icon:'food' },
  dish_feast_platter:      { id:'dish_feast_platter', name:'大成功の宴の皿', description:'複数効果が同時発動する豪華料理。', category:'food', itemType:'Heal', rarity:'rare', sellPrice:300, buyPrice:0, maxStack:10, icon:'food' },
  alchemy_minor_potion:    { id:'alchemy_minor_potion', name:'簡易ポーション', description:'HPを30回復する。', category:'potion', itemType:'Heal', rarity:'common', sellPrice:30, buyPrice:0, maxStack:99, icon:'potion', useEffect:{ hpRestore:30, message:'簡易ポーションでHPが30回復した！' } },
  alchemy_catalyst_powder: { id:'alchemy_catalyst_powder', name:'触媒の粉', description:'生活スキル経験値を一時的に増加させる。', category:'material', itemType:'Item', rarity:'rare', sellPrice:150, buyPrice:0, maxStack:99, icon:'gem' },
  alchemy_grand_elixir:    { id:'alchemy_grand_elixir', name:'満開エリクサー', description:'HPを200回復する最上位ポーション。', category:'potion', itemType:'Heal', rarity:'epic', sellPrice:600, buyPrice:0, maxStack:30, icon:'potion', useEffect:{ hpRestore:200, message:'満開エリクサーでHPが200回復した！' } },
  refined_iron_ingot:      { id:'refined_iron_ingot', name:'高純度鉄インゴット', description:'精錬済みの鉄。単純売却よりも価値が高い。', category:'material', itemType:'Item', rarity:'uncommon', sellPrice:40, buyPrice:0, maxStack:99, icon:'ingot' },
  refined_gold_ingot:      { id:'refined_gold_ingot', name:'高純度金インゴット', description:'精錬済みの金。単純売却よりも価値が高い。', category:'material', itemType:'Item', rarity:'rare', sellPrice:200, buyPrice:0, maxStack:99, icon:'ingot' },
  refined_fish_oil:        { id:'refined_fish_oil', name:'魚油', description:'魚を加工した高付加価値の素材。', category:'material', itemType:'Item', rarity:'uncommon', sellPrice:80, buyPrice:0, maxStack:99, icon:'fish' },
};

// ============================================================
// 標本収集・図鑑系コレクション
// ============================================================
export const COLLECTION_MASTER: CollectionDef[] = [
  {
    id: 'collection_gems', name: '宝石標本セット', description: 'FF洞窟群の宝石を集めて標本登録する。',
    category: 'specimen', targetIds: ['aurora_spinel', 'nether_ruby', 'cave_king_gem'],
    rewardGold: 5000, rewardItems: [{ itemId: 'awaken_stone_1', amount: 3 }], rewardEffects: { dropRatePct: 0.02 },
  },
  {
    id: 'collection_first_dungeons', name: '初心者ダンジョン討伐標本', description: '初心者向けダンジョンのモンスター証を集める。',
    category: 'specimen', targetIds: ['slime_essence', 'goblin_ear'],
    rewardGold: 1000, rewardItems: [{ itemId: 'pet_bond_treat', amount: 5 }], rewardEffects: { expMult: 1.01 },
  },
  {
    id: 'collection_revolution_set', name: 'Revolutionコンプリート標本', description: 'Revolutionシリーズの武器・防具をすべて所持する。',
    category: 'specimen', targetIds: ['revolution_sword', 'revolution_healwand', 'revolution_defencer', 'revolution_armor_helmet', 'revolution_armor_chest', 'revolution_armor_leggings', 'revolution_armor_boots'],
    rewardGold: 20000, rewardItems: [{ itemId: 'awaken_stone_2', amount: 3 }], rewardEffects: { atkPct: 0.02, defPct: 0.02 },
  },
];

export const COLLECTION_ITEMS: Record<string, ItemMaster> = {
  slime_essence: { id:'slime_essence', name:'スライムの核', description:'標本収集用素材。', category:'material', itemType:'Item', rarity:'common', sellPrice:5, buyPrice:0, maxStack:99, icon:'slime' },
};
