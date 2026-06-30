// src/stores/slices/lifeSlice.ts
// ver3.0.0: 生活系コンテンツ（農業・料理・錬金・精錬・標本収集）の操作アクション。

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import { defaultLifeSystemState, LIFE_EXP_TABLE, type FarmPlotState } from '../../types/buildTypes';
import { CROP_MASTER, FARM_WATER_YIELD_BONUS, FARM_FERTILIZER_QUALITY_BONUS } from '../../data/lifeSystemData';
import { LIFE_RECIPES, COLLECTION_MASTER } from '../../data/lifeSystemData';
import { randomChance } from '../../utils/random';

export interface LifeSlice {
  plantCrop: (plotIndex: number, cropId: string) => boolean;
  waterPlot: (plotIndex: number) => void;
  fertilizePlot: (plotIndex: number) => boolean;
  harvestPlot: (plotIndex: number) => { success: boolean; message: string };
  runLifeRecipe: (recipeId: string) => { success: boolean; message: string };
  submitSpecimen: (collectionId: string) => { success: boolean; message: string };
  getLifeLevel: (category: 'cooking' | 'alchemy' | 'refining') => number;
}

function lifeLevelFromExp(exp: number): number {
  let lv = 1;
  while (lv < LIFE_EXP_TABLE.length - 1 && exp >= LIFE_EXP_TABLE[lv + 1]) lv++;
  return lv;
}

export const createLifeSlice: StateCreator<GameState, [], [], LifeSlice> = (set, get) => ({
  plantCrop: (plotIndex, cropId) => {
    const { player, consumeItem, addNotification } = get();
    if (!player) return false;
    const crop = CROP_MASTER[cropId];
    if (!crop) return false;
    const life = player.life ?? defaultLifeSystemState();
    const plot = life.farmPlots[plotIndex];
    if (!plot || plot.cropId) {
      addNotification('warning', 'その畑にはすでに何か植えられています。');
      return false;
    }
    if (!consumeItem(crop.seedItemId, 1)) {
      addNotification('warning', `${ITEM_NAME(crop.seedItemId)}が足りません。`);
      return false;
    }
    set((state) => {
      if (!state.player) return state;
      const l = state.player.life ?? defaultLifeSystemState();
      const farmPlots = l.farmPlots.map((p: FarmPlotState) => p.plotIndex === plotIndex
        ? { ...p, cropId, plantedAt: Date.now(), watered: false, fertilized: false }
        : p);
      return { player: { ...state.player, life: { ...l, farmPlots } } };
    });
    addNotification('success', `🌱 ${crop.name}を植えました。`);
    return true;
  },

  waterPlot: (plotIndex) => {
    set((state) => {
      if (!state.player) return state;
      const l = state.player.life ?? defaultLifeSystemState();
      const farmPlots = l.farmPlots.map((p: FarmPlotState) => p.plotIndex === plotIndex ? { ...p, watered: true } : p);
      return { player: { ...state.player, life: { ...l, farmPlots } } };
    });
  },

  fertilizePlot: (plotIndex) => {
    const { consumeItem, addNotification } = get();
    if (!consumeItem('fertilizer', 1)) {
      addNotification('warning', '肥料が足りません。');
      return false;
    }
    set((state) => {
      if (!state.player) return state;
      const l = state.player.life ?? defaultLifeSystemState();
      const farmPlots = l.farmPlots.map((p: FarmPlotState) => p.plotIndex === plotIndex ? { ...p, fertilized: true } : p);
      return { player: { ...state.player, life: { ...l, farmPlots } } };
    });
    return true;
  },

  harvestPlot: (plotIndex) => {
    const { player, addItems, addNotification } = get();
    if (!player) return { success: false, message: '読み込みエラー' };
    const life = player.life ?? defaultLifeSystemState();
    const plot = life.farmPlots[plotIndex];
    if (!plot?.cropId) return { success: false, message: '何も植えられていません' };
    const crop = CROP_MASTER[plot.cropId];
    if (!crop) return { success: false, message: '不明な作物です' };
    if (Date.now() - plot.plantedAt < crop.growthMs) {
      const remainMin = Math.ceil((crop.growthMs - (Date.now() - plot.plantedAt)) / 60000);
      return { success: false, message: `収穫まであと${remainMin}分です` };
    }
    let amount = crop.baseYield;
    if (plot.watered) amount = Math.ceil(amount * (1 + FARM_WATER_YIELD_BONUS));
    const qualityChance = crop.qualityChance + (plot.fertilized ? FARM_FERTILIZER_QUALITY_BONUS : 0);
    const drops: { itemId: string; amount: number }[] = [];
    if (crop.qualityProduceItemId && randomChance(qualityChance)) {
      drops.push({ itemId: crop.qualityProduceItemId, amount: Math.max(1, Math.floor(amount / 2)) });
    } else {
      drops.push({ itemId: crop.produceItemId, amount });
    }
    addItems(drops);
    set((state) => {
      if (!state.player) return state;
      const l = state.player.life ?? defaultLifeSystemState();
      const farmPlots = l.farmPlots.map((p: FarmPlotState) => p.plotIndex === plotIndex ? { ...p, cropId: null, plantedAt: 0, watered: false, fertilized: false } : p);
      return { player: { ...state.player, life: { ...l, farmPlots } } };
    });
    addNotification('success', `🌾 ${crop.name}を収穫しました！`);
    return { success: true, message: '収穫しました' };
  },

  runLifeRecipe: (recipeId) => {
    const { player, consumeItem, addItems, addNotification } = get();
    if (!player) return { success: false, message: '読み込みエラー' };
    const recipe = LIFE_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return { success: false, message: '不明なレシピです' };
    const life = player.life ?? defaultLifeSystemState();
    const expKey = recipe.category === 'cooking' ? 'cookingExp' : recipe.category === 'alchemy' ? 'alchemyExp' : 'refiningExp';
    const currentLevel = lifeLevelFromExp(life[expKey]);
    if (currentLevel < recipe.requiredLevel) {
      return { success: false, message: `${recipe.category}Lv${recipe.requiredLevel}が必要です（現在Lv${currentLevel}）` };
    }
    for (const input of recipe.inputs) {
      if ((player.inventory[input.itemId] ?? 0) < input.amount) {
        return { success: false, message: `${ITEM_NAME(input.itemId)}が足りません` };
      }
    }
    for (const input of recipe.inputs) consumeItem(input.itemId, input.amount);
    const greatSuccess = randomChance(recipe.greatSuccessChance);
    const outputAmount = greatSuccess ? Math.ceil(recipe.outputAmount * recipe.greatSuccessMultiplier) : recipe.outputAmount;
    addItems([{ itemId: recipe.outputItemId, amount: outputAmount }]);

    const _p = get().player;
    const expMult = _p ? getPlayerPowerProfileSafe(_p) : 1;
    set((state) => {
      if (!state.player) return state;
      const l = state.player.life ?? defaultLifeSystemState();
      return { player: { ...state.player, life: { ...l, [expKey]: l[expKey] + Math.round(recipe.expGain * expMult) } } };
    });
    addNotification('success', greatSuccess
      ? `🌟 大成功！${recipe.name}を${outputAmount}個作成しました！`
      : `✅ ${recipe.name}を${outputAmount}個作成しました。`);
    return { success: true, message: greatSuccess ? '大成功！' : '作成しました' };
  },

  submitSpecimen: (collectionId) => {
    const { player, consumeItem, addItems, changeGold, addNotification } = get();
    if (!player) return { success: false, message: '読み込みエラー' };
    const def = COLLECTION_MASTER.find(c => c.id === collectionId);
    if (!def) return { success: false, message: '不明な標本セットです' };
    const life = player.life ?? defaultLifeSystemState();
    if (life.claimedCollectionIds.includes(collectionId)) return { success: false, message: 'すでに報酬を受け取っています' };
    for (const id of def.targetIds) {
      if ((player.inventory[id] ?? 0) < 1) return { success: false, message: `${ITEM_NAME(id)}が足りません` };
    }
    for (const id of def.targetIds) consumeItem(id, 1);
    if (def.rewardGold) changeGold(def.rewardGold);
    if (def.rewardItems.length) addItems(def.rewardItems);
    set((state) => {
      if (!state.player) return state;
      const l = state.player.life ?? defaultLifeSystemState();
      return { player: { ...state.player, life: { ...l, claimedCollectionIds: [...l.claimedCollectionIds, collectionId] } } };
    });
    addNotification('success', `📖 標本「${def.name}」を登録しました！恒常ボーナスを獲得！`);
    return { success: true, message: '登録しました' };
  },

  getLifeLevel: (category) => {
    const player = get().player;
    if (!player) return 1;
    const life = player.life ?? defaultLifeSystemState();
    const expKey = category === 'cooking' ? 'cookingExp' : category === 'alchemy' ? 'alchemyExp' : 'refiningExp';
    return lifeLevelFromExp(life[expKey]);
  },
});

// ローカルヘルパー（循環import回避のため最小限の実装をここに保持）
import { ITEM_MASTER } from '../../data/masters';
import { getPlayerPowerProfile } from '../../systems/playerPower';
import type { PlayerData } from '../../types/game';
function ITEM_NAME(itemId: string): string { return ITEM_MASTER[itemId]?.name ?? itemId; }
function getPlayerPowerProfileSafe(player: PlayerData): number { return getPlayerPowerProfile(player).skillExpMult; }
