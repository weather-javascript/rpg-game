// src/stores/slices/fishingSlice.ts  –  v3
import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import { ITEM_MASTER } from '../../data/masters';
import {
  FISH_MASTER, fishingExpRequired, FISHING_ACHIEVEMENTS, FISHING_TITLES,
  SPOT_MASTER, rodEnhanceSuccessRate,
} from '../../data/fishMasters';

export interface FishingSlice {
  addFishingScore:    (amount: number) => void;
  equipRod:           (rodId: string) => void;
  setActiveJob:       (jobId: string | null) => void;
  addBuff:            (buff: { id: string; name: string; durationMs: number; fishingBonus?: number; miningBonus?: number }) => void;
  getActiveBuffBonus: (type: 'fishing' | 'mining') => number;
  addFishingExp:      (exp: number) => void;
  recordCatch:        (fishId: string, sizeCm: number, weightKg: number, goldEarned: number) => void;
  selectFishingSpot:  (spotId: string) => void;
  unlockFishingSpot:  (spotId: string) => void;
  equipBait:          (baitId: string) => void;
  useBait:            () => void;
  enhanceRod:         (rodId: string) => boolean; // returns success
  damageRod:          (rodId: string, amount: number) => void;
  checkFishingAchievements: () => void;
}

export const createFishingSlice: StateCreator<GameState, [], [], FishingSlice> = (set, get) => ({
  addFishingScore: (amount) => {
    set((state: any) => {
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
    set((state: any) => state.player ? { player: { ...state.player, equippedRodId: rodId } } : state);
    const name = ITEM_MASTER[rodId]?.name ?? rodId;
    addNotification('success', `🎣 ${name} を装備した！`);
  },

  setActiveJob: (jobId) => {
    set((state: any) => state.player ? { player: { ...state.player, activeJob: jobId } } : state);
  },

  addBuff: (buff) => {
    set((state: any) => {
      if (!state.player) return state;
      const now = Date.now();
      const existing = (state.player.activeBuffs ?? []).filter((b: any) => b.expiry > now && b.id !== buff.id);
      return { player: { ...state.player, activeBuffs: [...existing, { id: buff.id, name: buff.name, expiry: now + buff.durationMs, fishingBonus: buff.fishingBonus, miningBonus: buff.miningBonus }] } };
    });
  },

  getActiveBuffBonus: (type) => {
    const { player } = get();
    if (!player) return 1.0;
    const now = Date.now();
    let bonus = 1.0;
    for (const b of (player.activeBuffs ?? []).filter((b: any) => b.expiry > now)) {
      if (type === 'fishing' && b.fishingBonus) bonus *= b.fishingBonus;
      if (type === 'mining' && b.miningBonus) bonus *= b.miningBonus;
    }
    return bonus;
  },

  addFishingExp: (exp) => {
    set((state: any) => {
      if (!state.player) return state;
      let lv = state.player.fishingLevel ?? 1;
      let cur = (state.player.fishingExp ?? 0) + exp;
      while (lv < 100) {
        const req = fishingExpRequired(lv);
        if (cur >= req) { cur -= req; lv += 1; } else break;
      }
      if (lv >= 100) cur = 0;
      // spot unlock based on level
      const unlockedSpots = [...(state.player.fishingUnlockedSpots ?? ['pond', 'river'])];
      for (const spot of Object.values(SPOT_MASTER)) {
        if (spot.unlockCond?.startsWith('level_')) {
          const reqLv = parseInt(spot.unlockCond.replace('level_', ''));
          if (lv >= reqLv && !unlockedSpots.includes(spot.id)) {
            unlockedSpots.push(spot.id);
          }
        }
        if (!spot.unlockCond && lv >= spot.minLevel && !unlockedSpots.includes(spot.id)) {
          unlockedSpots.push(spot.id);
        }
      }
      return { player: { ...state.player, fishingLevel: lv, fishingExp: cur, fishingUnlockedSpots: unlockedSpots } };
    });
  },

  recordCatch: (fishId, sizeCm, weightKg, goldEarned) => {
    const fish = FISH_MASTER[fishId];
    if (!fish) return;
    set((state: any) => {
      if (!state.player) return state;
      const now = Date.now();
      const existing = state.player.fishBook?.[fishId];
      const newEntry = {
        fishId, firstCaughtAt: existing?.firstCaughtAt ?? now,
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
          fishingTotalGoldEarned: (state.player.fishingTotalGoldEarned ?? 0) + goldEarned,
        },
      };
    });
  },

  selectFishingSpot: (spotId) => {
    set((state: any) => state.player ? { player: { ...state.player, fishingSelectedSpotId: spotId } } : state);
  },

  unlockFishingSpot: (spotId) => {
    set((state: any) => {
      if (!state.player) return state;
      const unlocked = state.player.fishingUnlockedSpots ?? [];
      if (unlocked.includes(spotId)) return state;
      return { player: { ...state.player, fishingUnlockedSpots: [...unlocked, spotId] } };
    });
  },

  equipBait: (baitId) => {
    const { player, addNotification } = get();
    if (!player) return;
    if (baitId && (player.inventory[baitId] ?? 0) <= 0) {
      addNotification('error', 'その餌を持っていません！');
      return;
    }
    set((state: any) => state.player ? { player: { ...state.player, fishingEquippedBaitId: baitId } } : state);
  },

  useBait: () => {
    set((state: any) => {
      if (!state.player) return state;
      const baitId = state.player.fishingEquippedBaitId;
      if (!baitId) return state;
      const qty = state.player.inventory[baitId] ?? 0;
      if (qty <= 0) return { player: { ...state.player, fishingEquippedBaitId: '' } };
      const newInv = { ...state.player.inventory, [baitId]: qty - 1 };
      return {
        player: {
          ...state.player,
          inventory: newInv,
          fishingTotalBaitUsed: (state.player.fishingTotalBaitUsed ?? 0) + 1,
        },
      };
    });
  },

  enhanceRod: (rodId) => {
    const { player, addNotification } = get();
    if (!player) return false;
    const currentLv = player.fishingRodEnhance?.[rodId] ?? 0;
    if (currentLv >= 20) {
      addNotification('warning', '既に最大強化レベルです！');
      return false;
    }
    const successRate = rodEnhanceSuccessRate(currentLv);
    const success = Math.random() < successRate;
    if (success) {
      set((state: any) => {
        if (!state.player) return state;
        const newEnhance = { ...(state.player.fishingRodEnhance ?? {}), [rodId]: currentLv + 1 };
        return { player: { ...state.player, fishingRodEnhance: newEnhance } };
      });
      addNotification('success', `⚡ 強化成功！ ${ITEM_MASTER[rodId]?.name ?? rodId} +${currentLv + 1}！`);
    } else {
      addNotification('error', `💥 強化失敗…`);
    }
    return success;
  },

  damageRod: (rodId, amount) => {
    set((state: any) => {
      if (!state.player) return state;
      const cur = state.player.fishingRodDurability?.[rodId];
      if (cur === undefined) return state;
      const next = Math.max(0, cur - amount);
      return { player: { ...state.player, fishingRodDurability: { ...(state.player.fishingRodDurability ?? {}), [rodId]: next } } };
    });
  },

  checkFishingAchievements: () => {
    const { player, addNotification } = get();
    if (!player) return;
    const fishBook = player.fishBook ?? {};
    const unlockedSpots = player.fishingUnlockedSpots ?? [];
    const ctx = {
      fishingLevel: player.fishingLevel ?? 1,
      totalCount: player.fishingTotalCount ?? 0,
      bookCount: Object.keys(fishBook).length,
      maxSizeCm: player.fishingMaxSizeCm ?? 0,
      maxWeightKg: player.fishingMaxWeightKg ?? 0,
      fishBook: fishBook as any,
      rodEnhanceLevel: player.fishingRodEnhance ?? {},
      unlockedSpots,
      totalBaitUsed: player.fishingTotalBaitUsed ?? 0,
      totalGoldFromFishing: player.fishingTotalGoldEarned ?? 0,
    };
    const already = new Set(player.fishingAchievements ?? []);
    const newAchievs: string[] = [];
    for (const ach of FISHING_ACHIEVEMENTS) {
      if (!already.has(ach.id) && ach.checkFn(ctx)) newAchievs.push(ach.id);
    }
    if (newAchievs.length > 0) {
      set((state: any) => {
        if (!state.player) return state;
        return { player: { ...state.player, fishingAchievements: [...(state.player.fishingAchievements ?? []), ...newAchievs] } };
      });
      for (const id of newAchievs) {
        const ach = FISHING_ACHIEVEMENTS.find(a => a.id === id);
        if (ach) addNotification('success', `${ach.icon} 釣り実績解放: ${ach.name}`);
      }
    }
    // check titles
    const titleCtx = {
      fishingLevel: ctx.fishingLevel, totalCount: ctx.totalCount, bookCount: ctx.bookCount,
      maxSizeCm: ctx.maxSizeCm, maxWeightKg: ctx.maxWeightKg,
      fishBook: fishBook as any,
      unlockedFishingAchievements: [...already, ...newAchievs],
    };
    const alreadyTitles = new Set(player.fishingUnlockedTitles ?? []);
    const newTitles: string[] = [];
    for (const t of FISHING_TITLES) {
      if (!alreadyTitles.has(t.id) && t.condition(titleCtx as any)) newTitles.push(t.id);
    }
    if (newTitles.length > 0) {
      set((state: any) => {
        if (!state.player) return state;
        return { player: { ...state.player, fishingUnlockedTitles: [...(state.player.fishingUnlockedTitles ?? []), ...newTitles] } };
      });
    }
  },
});
