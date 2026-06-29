// src/stores/slices/buildSlice.ts
// ver3.0.0: 装備ビルド（付与効果の再抽選・覚醒・ビルドプリセット）の操作アクション。

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { defaultEquipmentBuildState, type BuildPreset, AWAKENING_MAX } from '../../types/v3Types';
import { rollAffixes, getAffixSlotCount, tryAwaken, awakenMaterialForLevel } from '../../data/equipmentBuildData';

export interface BuildSlice {
  rerollAffixes: (itemId: string) => boolean;
  awakenItem: (itemId: string) => { success: boolean; message: string };
  saveBuildPreset: (name: string) => void;
  loadBuildPreset: (presetId: string) => boolean;
  deleteBuildPreset: (presetId: string) => void;
}

export const createBuildSlice: StateCreator<GameState, [], [], BuildSlice> = (set, get) => ({
  rerollAffixes: (itemId) => {
    const { player, consumeItem, addNotification } = get();
    if (!player) return false;
    const item = ITEM_MASTER[itemId];
    if (!item) return false;
    if (!consumeItem('affix_reroll_stone', 1)) {
      addNotification('warning', '付与効果の再抽選石が足りません。');
      return false;
    }
    const build = player.equipmentBuild ?? defaultEquipmentBuildState();
    const awakening = build.awakening[itemId] ?? 0;
    const slotCount = getAffixSlotCount(awakening);
    const newRolls = rollAffixes(item.rarity, slotCount);
    set((state) => {
      if (!state.player) return state;
      const b = state.player.equipmentBuild ?? defaultEquipmentBuildState();
      return {
        player: {
          ...state.player,
          equipmentBuild: { ...b, affixRolls: { ...b.affixRolls, [itemId]: newRolls } },
        },
      };
    });
    addNotification('success', `✨ ${item.name} の付与効果を再抽選しました！`);
    return true;
  },

  awakenItem: (itemId) => {
    const { player, consumeItem, addNotification } = get();
    if (!player) return { success: false, message: '読み込みエラー' };
    const item = ITEM_MASTER[itemId];
    if (!item) return { success: false, message: 'アイテムが見つかりません' };
    const build = player.equipmentBuild ?? defaultEquipmentBuildState();
    const currentLevel = build.awakening[itemId] ?? 0;
    if (currentLevel >= AWAKENING_MAX) return { success: false, message: 'すでに最終段階まで覚醒しています' };

    const materialId = awakenMaterialForLevel(currentLevel);
    const needAmount = currentLevel + 1;
    if ((player.inventory[materialId] ?? 0) < needAmount) {
      return { success: false, message: `${ITEM_MASTER[materialId]?.name ?? materialId} が ${needAmount}個 必要です` };
    }
    const pityShards = player.inventory['awaken_pity_shard'] ?? 0;
    const result = tryAwaken(currentLevel, pityShards);
    consumeItem(materialId, needAmount);
    if (result.success && pityShards >= 10) {
      consumeItem('awaken_pity_shard', 10); // 救済ボーナス消費（成功時にリセット）
    }

    set((state) => {
      if (!state.player) return state;
      const b = state.player.equipmentBuild ?? defaultEquipmentBuildState();
      const newAwakening = { ...b.awakening, [itemId]: result.newLevel };
      return { player: { ...state.player, equipmentBuild: { ...b, awakening: newAwakening } } };
    });

    if (result.pityShardGained > 0) {
      get().addItems([{ itemId: 'awaken_pity_shard', amount: result.pityShardGained }]);
    }

    if (result.success) {
      addNotification('success', `🌟 ${item.name} が 覚醒+${result.newLevel} になりました！`);
      return { success: true, message: `覚醒+${result.newLevel}に成功！` };
    } else {
      addNotification('warning', `💢 ${item.name} の覚醒に失敗…（救済の残光+1）`);
      return { success: false, message: '覚醒に失敗しました（救済の残光を入手）' };
    }
  },

  saveBuildPreset: (name) => {
    set((state) => {
      if (!state.player) return state;
      const b = state.player.equipmentBuild ?? defaultEquipmentBuildState();
      const eq = state.player.equipment ?? { hotbar: Array(9).fill(null), helmet: null, chestplate: null, leggings: null, boots: null, offhand: null };
      const preset: BuildPreset = {
        id: `preset_${Date.now()}`,
        name: name || `ビルド${b.presets.length + 1}`,
        equipment: { hotbar: [...eq.hotbar], helmet: eq.helmet, chestplate: eq.chestplate, leggings: eq.leggings, boots: eq.boots, offhand: eq.offhand },
        savedAt: Date.now(),
      };
      const presets = [...b.presets, preset].slice(-10); // 最大10件保持
      return { player: { ...state.player, equipmentBuild: { ...b, presets } } };
    });
    get().addNotification('success', `📌 ビルド「${name}」を保存しました`);
  },

  loadBuildPreset: (presetId) => {
    const { player, addNotification } = get();
    if (!player) return false;
    const b = player.equipmentBuild ?? defaultEquipmentBuildState();
    const preset = b.presets.find(p => p.id === presetId);
    if (!preset) return false;
    set((state) => state.player ? { player: { ...state.player, equipment: { ...preset.equipment } } } : state);
    addNotification('success', `📌 ビルド「${preset.name}」を読み込みました`);
    return true;
  },

  deleteBuildPreset: (presetId) => {
    set((state) => {
      if (!state.player) return state;
      const b = state.player.equipmentBuild ?? defaultEquipmentBuildState();
      return { player: { ...state.player, equipmentBuild: { ...b, presets: b.presets.filter(p => p.id !== presetId) } } };
    });
  },
});
