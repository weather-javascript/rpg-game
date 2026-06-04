// src/stores/slices/fishingSlice.ts
// 釣りスコア・釣り竿装備・バフ管理スライス

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { randomInt } from '../../utils/random';

export type FishingSlice = Pick<GameState,
  'addFishingScore' | 'equipRod' | 'setActiveJob' | 'addBuff' | 'getActiveBuffBonus'
>;

export const createFishingSlice: StateCreator<GameState, [], [], FishingSlice> = (set, get) => ({
  addFishingScore: (amount) => {
    set((state) => {
      if (!state.player) return state;
      return { player: { ...state.player, fishingScore: (state.player.fishingScore ?? 0) + amount } };
    });
    const { player, addItems, addNotification } = get();
    if (!player) return;
    const score = player.fishingScore ?? 0;
    const prevMilestone = Math.floor((score - amount) / 1000);
    const currMilestone = Math.floor(score / 1000);
    if (currMilestone > prevMilestone) {
      const scales = ['scale_high_1', 'scale_high_2', 'scale_high_3', 'scale_high_4'];
      const scale = scales[randomInt(scales.length)];
      addItems([{ itemId: scale, amount: 1 }]);
      addNotification('success', `🎣 釣りスコア${currMilestone * 1000}達成！上位鱗を1枚入手！`);
    }
  },

  equipRod: (rodId) => {
    const { player, addNotification } = get();
    if (!player) return;
    if ((player.inventory[rodId] ?? 0) <= 0) {
      addNotification('error', 'その釣り竿を持っていません！');
      return;
    }
    set((state) => state.player ? { player: { ...state.player, equippedRodId: rodId } } : state);
    addNotification('success', `🎣 ${ITEM_MASTER[rodId]?.name ?? rodId} を装備した！`);
  },

  setActiveJob: (jobId) => {
    set((state) => state.player ? { player: { ...state.player, activeJob: jobId } } : state);
  },

  addBuff: (buff) => {
    set((state) => {
      if (!state.player) return state;
      const now = Date.now();
      const existing = (state.player.activeBuffs ?? []).filter(b => b.expiry > now && b.id !== buff.id);
      const newBuff = {
        id: buff.id, name: buff.name,
        expiry: now + buff.durationMs,
        fishingBonus: buff.fishingBonus,
        miningBonus: buff.miningBonus,
      };
      return { player: { ...state.player, activeBuffs: [...existing, newBuff] } };
    });
  },

  getActiveBuffBonus: (type) => {
    const { player } = get();
    if (!player) return 1.0;
    const now = Date.now();
    let bonus = 1.0;
    for (const b of (player.activeBuffs ?? []).filter(b => b.expiry > now)) {
      if (type === 'fishing' && b.fishingBonus) bonus *= b.fishingBonus;
      if (type === 'mining' && b.miningBonus) bonus *= b.miningBonus;
    }
    return bonus;
  },
});
