// src/stores/slices/fishingSlice.ts
// 釣りシステム v2 スライス

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { FISH_MASTER, fishingExpRequired } from '../../data/fishMasters';

export interface FishingSlice {
  addFishingScore:   (amount: number) => void;
  equipRod:          (rodId: string) => void;
  setActiveJob:      (jobId: string | null) => void;
  addBuff:           (buff: { id: string; name: string; durationMs: number; fishingBonus?: number; miningBonus?: number }) => void;
  getActiveBuffBonus:(type: 'fishing' | 'mining') => number;
  addFishingExp:     (exp: number) => void;
  recordCatch:       (fishId: string, sizeCm: number, weightKg: number) => void;
}

export const createFishingSlice: StateCreator<GameState, [], [], FishingSlice> = (set, get) => ({
  addFishingScore: (amount) => {
    set((state) => {
      if (!state.player) return state;
      return { player: { ...state.player, fishingScore: (state.player.fishingScore ?? 0) + amount } };
    });
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

  addFishingExp: (exp: number) => {
    set((state) => {
      if (!state.player) return state;
      let lv = state.player.fishingLevel ?? 1;
      let currentExp = (state.player.fishingExp ?? 0) + exp;
      // レベルアップ処理
      while (lv < 100) {
        const required = fishingExpRequired(lv);
        if (currentExp >= required) {
          currentExp -= required;
          lv += 1;
        } else {
          break;
        }
      }
      if (lv >= 100) currentExp = 0;
      return { player: { ...state.player, fishingLevel: lv, fishingExp: currentExp } };
    });
    // レベルアップ通知は外側でやる (stateが読めないため)
  },

  recordCatch: (fishId: string, sizeCm: number, weightKg: number) => {
    const fish = FISH_MASTER[fishId];
    if (!fish) return;
    set((state) => {
      if (!state.player) return state;
      const now = Date.now();
      const existing = state.player.fishBook?.[fishId];
      const newEntry = {
        fishId,
        firstCaughtAt: existing?.firstCaughtAt ?? now,
        totalCaught: (existing?.totalCaught ?? 0) + 1,
        maxSizeCm: Math.max(existing?.maxSizeCm ?? 0, sizeCm),
        maxWeightKg: Math.max(existing?.maxWeightKg ?? 0, weightKg),
      };
      return {
        player: {
          ...state.player,
          fishBook: { ...(state.player.fishBook ?? {}), [fishId]: newEntry },
          fishingTotalCount: (state.player.fishingTotalCount ?? 0) + 1,
          fishingMaxSizeCm: Math.max(state.player.fishingMaxSizeCm ?? 0, sizeCm),
          fishingMaxWeightKg: Math.max(state.player.fishingMaxWeightKg ?? 0, weightKg),
        },
      };
    });
  },
});
