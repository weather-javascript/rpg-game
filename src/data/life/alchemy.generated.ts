// 自動生成: 10テーマ×4種 = 40錬金レシピ
import type { LifeRecipeDef } from '../../types/buildTypes';
import type { ItemMaster } from '../../types/game';

export const GEN_ALCHEMY_RECIPES: LifeRecipeDef[] = [
  { id: "alch_plain_1", name: "平原の強化石", description: "小麦の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "plain", inputs: [{ itemId: "crop_plain_1_1_quality", amount: 3 }], outputItemId: "alch_plain_1_item", outputAmount: 1, requiredLevel: 6, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_plain_2", name: "平原のエッセンス", description: "にんじんの高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "plain", inputs: [{ itemId: "crop_plain_6_1_quality", amount: 3 }], outputItemId: "alch_plain_2_item", outputAmount: 1, requiredLevel: 16, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_plain_3", name: "平原の秘薬", description: "豆の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "plain", inputs: [{ itemId: "crop_plain_9_1_quality", amount: 3 }], outputItemId: "alch_plain_3_item", outputAmount: 1, requiredLevel: 22, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_plain_4", name: "平原の触媒", description: "上質なかぼちゃの高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "plain", inputs: [{ itemId: "crop_plain_8_2_quality", amount: 3 }], outputItemId: "alch_plain_4_item", outputAmount: 1, requiredLevel: 28, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_cave_1", name: "洞窟の強化石", description: "洞窟キノコの高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "cave", inputs: [{ itemId: "crop_cave_1_1_quality", amount: 3 }], outputItemId: "alch_cave_1_item", outputAmount: 1, requiredLevel: 13, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_cave_2", name: "洞窟のエッセンス", description: "蛍光カビの高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "cave", inputs: [{ itemId: "crop_cave_6_1_quality", amount: 3 }], outputItemId: "alch_cave_2_item", outputAmount: 1, requiredLevel: 23, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_cave_3", name: "洞窟の秘薬", description: "地底イモの高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "cave", inputs: [{ itemId: "crop_cave_9_1_quality", amount: 3 }], outputItemId: "alch_cave_3_item", outputAmount: 1, requiredLevel: 29, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_cave_4", name: "洞窟の触媒", description: "上質な坑道苔の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "cave", inputs: [{ itemId: "crop_cave_8_2_quality", amount: 3 }], outputItemId: "alch_cave_4_item", outputAmount: 1, requiredLevel: 35, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_volcano_1", name: "火山の強化石", description: "溶岩トウガラシの高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "volcano", inputs: [{ itemId: "crop_volcano_1_1_quality", amount: 3 }], outputItemId: "alch_volcano_1_item", outputAmount: 1, requiredLevel: 23, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_volcano_2", name: "火山のエッセンス", description: "熔岩トマトの高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "volcano", inputs: [{ itemId: "crop_volcano_6_1_quality", amount: 3 }], outputItemId: "alch_volcano_2_item", outputAmount: 1, requiredLevel: 33, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_volcano_3", name: "火山の秘薬", description: "溶岩根菜の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "volcano", inputs: [{ itemId: "crop_volcano_9_1_quality", amount: 3 }], outputItemId: "alch_volcano_3_item", outputAmount: 1, requiredLevel: 39, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_volcano_4", name: "火山の触媒", description: "上質な火口豆の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "volcano", inputs: [{ itemId: "crop_volcano_8_2_quality", amount: 3 }], outputItemId: "alch_volcano_4_item", outputAmount: 1, requiredLevel: 45, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_fortress_1", name: "要塞の強化石", description: "鉄分穀物の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "fortress", inputs: [{ itemId: "crop_fortress_1_1_quality", amount: 3 }], outputItemId: "alch_fortress_1_item", outputAmount: 1, requiredLevel: 30, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_fortress_2", name: "要塞のエッセンス", description: "盾豆の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "fortress", inputs: [{ itemId: "crop_fortress_6_1_quality", amount: 3 }], outputItemId: "alch_fortress_2_item", outputAmount: 1, requiredLevel: 40, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_fortress_3", name: "要塞の秘薬", description: "軍糧米の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "fortress", inputs: [{ itemId: "crop_fortress_9_1_quality", amount: 3 }], outputItemId: "alch_fortress_3_item", outputAmount: 1, requiredLevel: 46, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_fortress_4", name: "要塞の触媒", description: "上質な陣中葱の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "fortress", inputs: [{ itemId: "crop_fortress_8_2_quality", amount: 3 }], outputItemId: "alch_fortress_4_item", outputAmount: 1, requiredLevel: 52, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_sky_1", name: "天空城の強化石", description: "雲綿花の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "sky", inputs: [{ itemId: "crop_sky_1_1_quality", amount: 3 }], outputItemId: "alch_sky_1_item", outputAmount: 1, requiredLevel: 37, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_sky_2", name: "天空城のエッセンス", description: "雲海茶葉の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "sky", inputs: [{ itemId: "crop_sky_6_1_quality", amount: 3 }], outputItemId: "alch_sky_2_item", outputAmount: 1, requiredLevel: 47, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_sky_3", name: "天空城の秘薬", description: "高地林檎の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "sky", inputs: [{ itemId: "crop_sky_9_1_quality", amount: 3 }], outputItemId: "alch_sky_3_item", outputAmount: 1, requiredLevel: 53, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_sky_4", name: "天空城の触媒", description: "上質な羽根菜の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "sky", inputs: [{ itemId: "crop_sky_8_2_quality", amount: 3 }], outputItemId: "alch_sky_4_item", outputAmount: 1, requiredLevel: 59, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_astral_1", name: "アストラル・ノクスの強化石", description: "隕石メロンの高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "astral", inputs: [{ itemId: "crop_astral_1_1_quality", amount: 3 }], outputItemId: "alch_astral_1_item", outputAmount: 1, requiredLevel: 45, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_astral_2", name: "アストラル・ノクスのエッセンス", description: "星間茸の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "astral", inputs: [{ itemId: "crop_astral_6_1_quality", amount: 3 }], outputItemId: "alch_astral_2_item", outputAmount: 1, requiredLevel: 55, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_astral_3", name: "アストラル・ノクスの秘薬", description: "虚空根の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "astral", inputs: [{ itemId: "crop_astral_9_1_quality", amount: 3 }], outputItemId: "alch_astral_3_item", outputAmount: 1, requiredLevel: 61, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_astral_4", name: "アストラル・ノクスの触媒", description: "上質な反物質豆の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "astral", inputs: [{ itemId: "crop_astral_8_2_quality", amount: 3 }], outputItemId: "alch_astral_4_item", outputAmount: 1, requiredLevel: 67, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_chaite_1", name: "帝国の強化石", description: "帝国米の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "chaite", inputs: [{ itemId: "crop_chaite_1_1_quality", amount: 3 }], outputItemId: "alch_chaite_1_item", outputAmount: 1, requiredLevel: 40, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_chaite_2", name: "帝国のエッセンス", description: "帝都葡萄の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "chaite", inputs: [{ itemId: "crop_chaite_6_1_quality", amount: 3 }], outputItemId: "alch_chaite_2_item", outputAmount: 1, requiredLevel: 50, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_chaite_3", name: "帝国の秘薬", description: "天下人麦の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "chaite", inputs: [{ itemId: "crop_chaite_9_1_quality", amount: 3 }], outputItemId: "alch_chaite_3_item", outputAmount: 1, requiredLevel: 56, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_chaite_4", name: "帝国の触媒", description: "上質な玄武イモの高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "chaite", inputs: [{ itemId: "crop_chaite_8_2_quality", amount: 3 }], outputItemId: "alch_chaite_4_item", outputAmount: 1, requiredLevel: 62, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_lycoris_1", name: "幽玄の強化石", description: "彼岸花球根の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "lycoris", inputs: [{ itemId: "crop_lycoris_1_1_quality", amount: 3 }], outputItemId: "alch_lycoris_1_item", outputAmount: 1, requiredLevel: 50, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_lycoris_2", name: "幽玄のエッセンス", description: "黄泉豆の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "lycoris", inputs: [{ itemId: "crop_lycoris_6_1_quality", amount: 3 }], outputItemId: "alch_lycoris_2_item", outputAmount: 1, requiredLevel: 60, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_lycoris_3", name: "幽玄の秘薬", description: "夢幻草の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "lycoris", inputs: [{ itemId: "crop_lycoris_9_1_quality", amount: 3 }], outputItemId: "alch_lycoris_3_item", outputAmount: 1, requiredLevel: 66, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_lycoris_4", name: "幽玄の触媒", description: "上質な霊木実の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "lycoris", inputs: [{ itemId: "crop_lycoris_8_2_quality", amount: 3 }], outputItemId: "alch_lycoris_4_item", outputAmount: 1, requiredLevel: 72, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_ffgg_1", name: "フィールドの強化石", description: "砂漠サボテンの高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "ffgg", inputs: [{ itemId: "crop_ffgg_1_1_quality", amount: 3 }], outputItemId: "alch_ffgg_1_item", outputAmount: 1, requiredLevel: 17, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_ffgg_2", name: "フィールドのエッセンス", description: "荒野草の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "ffgg", inputs: [{ itemId: "crop_ffgg_6_1_quality", amount: 3 }], outputItemId: "alch_ffgg_2_item", outputAmount: 1, requiredLevel: 27, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_ffgg_3", name: "フィールドの秘薬", description: "乾燥豆の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "ffgg", inputs: [{ itemId: "crop_ffgg_9_1_quality", amount: 3 }], outputItemId: "alch_ffgg_3_item", outputAmount: 1, requiredLevel: 33, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_ffgg_4", name: "フィールドの触媒", description: "上質な極寒芋の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "ffgg", inputs: [{ itemId: "crop_ffgg_8_2_quality", amount: 3 }], outputItemId: "alch_ffgg_4_item", outputAmount: 1, requiredLevel: 39, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_abyss_1", name: "深淵の強化石", description: "深淵の種の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "abyss", inputs: [{ itemId: "crop_abyss_1_1_quality", amount: 3 }], outputItemId: "alch_abyss_1_item", outputAmount: 1, requiredLevel: 60, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_abyss_2", name: "深淵のエッセンス", description: "忘却茶葉の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "abyss", inputs: [{ itemId: "crop_abyss_6_1_quality", amount: 3 }], outputItemId: "alch_abyss_2_item", outputAmount: 1, requiredLevel: 70, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_abyss_3", name: "深淵の秘薬", description: "業火草の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "abyss", inputs: [{ itemId: "crop_abyss_9_1_quality", amount: 3 }], outputItemId: "alch_abyss_3_item", outputAmount: 1, requiredLevel: 76, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
  { id: "alch_abyss_4", name: "深淵の触媒", description: "上質な漆黒麦の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。", category: "alchemy", theme: "abyss", inputs: [{ itemId: "crop_abyss_8_2_quality", amount: 3 }], outputItemId: "alch_abyss_4_item", outputAmount: 1, requiredLevel: 82, expGain: 25, greatSuccessChance: 0.12, greatSuccessMultiplier: 2 },
];

export const GEN_ALCHEMY_ITEMS: Record<string, ItemMaster> = {
  alch_plain_1_item: {
    id: "alch_plain_1_item", name: "平原の強化石", description: "小麦の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 92, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_plain_2_item: {
    id: "alch_plain_2_item", name: "平原のエッセンス", description: "にんじんの高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 112, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_plain_3_item: {
    id: "alch_plain_3_item", name: "平原の秘薬", description: "豆の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 124, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_plain_4_item: {
    id: "alch_plain_4_item", name: "平原の触媒", description: "上質なかぼちゃの高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 136, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_cave_1_item: {
    id: "alch_cave_1_item", name: "洞窟の強化石", description: "洞窟キノコの高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 106, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_cave_2_item: {
    id: "alch_cave_2_item", name: "洞窟のエッセンス", description: "蛍光カビの高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 126, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_cave_3_item: {
    id: "alch_cave_3_item", name: "洞窟の秘薬", description: "地底イモの高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 138, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_cave_4_item: {
    id: "alch_cave_4_item", name: "洞窟の触媒", description: "上質な坑道苔の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 150, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_volcano_1_item: {
    id: "alch_volcano_1_item", name: "火山の強化石", description: "溶岩トウガラシの高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 126, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_volcano_2_item: {
    id: "alch_volcano_2_item", name: "火山のエッセンス", description: "熔岩トマトの高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 146, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_volcano_3_item: {
    id: "alch_volcano_3_item", name: "火山の秘薬", description: "溶岩根菜の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 158, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_volcano_4_item: {
    id: "alch_volcano_4_item", name: "火山の触媒", description: "上質な火口豆の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 170, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_fortress_1_item: {
    id: "alch_fortress_1_item", name: "要塞の強化石", description: "鉄分穀物の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 140, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_fortress_2_item: {
    id: "alch_fortress_2_item", name: "要塞のエッセンス", description: "盾豆の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 160, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_fortress_3_item: {
    id: "alch_fortress_3_item", name: "要塞の秘薬", description: "軍糧米の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 172, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_fortress_4_item: {
    id: "alch_fortress_4_item", name: "要塞の触媒", description: "上質な陣中葱の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 184, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_sky_1_item: {
    id: "alch_sky_1_item", name: "天空城の強化石", description: "雲綿花の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 154, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_sky_2_item: {
    id: "alch_sky_2_item", name: "天空城のエッセンス", description: "雲海茶葉の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 174, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_sky_3_item: {
    id: "alch_sky_3_item", name: "天空城の秘薬", description: "高地林檎の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 186, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_sky_4_item: {
    id: "alch_sky_4_item", name: "天空城の触媒", description: "上質な羽根菜の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 198, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_astral_1_item: {
    id: "alch_astral_1_item", name: "アストラル・ノクスの強化石", description: "隕石メロンの高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 170, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_astral_2_item: {
    id: "alch_astral_2_item", name: "アストラル・ノクスのエッセンス", description: "星間茸の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 190, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_astral_3_item: {
    id: "alch_astral_3_item", name: "アストラル・ノクスの秘薬", description: "虚空根の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 202, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_astral_4_item: {
    id: "alch_astral_4_item", name: "アストラル・ノクスの触媒", description: "上質な反物質豆の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 214, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_chaite_1_item: {
    id: "alch_chaite_1_item", name: "帝国の強化石", description: "帝国米の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 160, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_chaite_2_item: {
    id: "alch_chaite_2_item", name: "帝国のエッセンス", description: "帝都葡萄の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 180, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_chaite_3_item: {
    id: "alch_chaite_3_item", name: "帝国の秘薬", description: "天下人麦の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 192, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_chaite_4_item: {
    id: "alch_chaite_4_item", name: "帝国の触媒", description: "上質な玄武イモの高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 204, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_lycoris_1_item: {
    id: "alch_lycoris_1_item", name: "幽玄の強化石", description: "彼岸花球根の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 180, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_lycoris_2_item: {
    id: "alch_lycoris_2_item", name: "幽玄のエッセンス", description: "黄泉豆の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 200, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_lycoris_3_item: {
    id: "alch_lycoris_3_item", name: "幽玄の秘薬", description: "夢幻草の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 212, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_lycoris_4_item: {
    id: "alch_lycoris_4_item", name: "幽玄の触媒", description: "上質な霊木実の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 224, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_ffgg_1_item: {
    id: "alch_ffgg_1_item", name: "フィールドの強化石", description: "砂漠サボテンの高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 114, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_ffgg_2_item: {
    id: "alch_ffgg_2_item", name: "フィールドのエッセンス", description: "荒野草の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 134, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_ffgg_3_item: {
    id: "alch_ffgg_3_item", name: "フィールドの秘薬", description: "乾燥豆の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 146, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_ffgg_4_item: {
    id: "alch_ffgg_4_item", name: "フィールドの触媒", description: "上質な極寒芋の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 158, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_abyss_1_item: {
    id: "alch_abyss_1_item", name: "深淵の強化石", description: "深淵の種の高品質な素材から精製した強化石。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 200, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_abyss_2_item: {
    id: "alch_abyss_2_item", name: "深淵のエッセンス", description: "忘却茶葉の高品質な素材から精製したエッセンス。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 220, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_abyss_3_item: {
    id: "alch_abyss_3_item", name: "深淵の秘薬", description: "業火草の高品質な素材から精製した秘薬。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 232, buyPrice: 0, maxStack: 99, icon: "gem",
  },
  alch_abyss_4_item: {
    id: "alch_abyss_4_item", name: "深淵の触媒", description: "上質な漆黒麦の高品質な素材から精製した触媒。装備の強化や特殊な調合に使われる。",
    category: "material", itemType: "Item", rarity: "rare",
    sellPrice: 244, buyPrice: 0, maxStack: 99, icon: "gem",
  },
};
