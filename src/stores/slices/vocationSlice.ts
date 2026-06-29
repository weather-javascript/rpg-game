// src/stores/slices/vocationSlice.ts
// ver3.0.0: ランク／職業分岐（ヴォケーション）の操作アクション。

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import { defaultVocationState, VOCATION_EXP_TABLE, type VocationId } from '../../types/v3Types';
import { VOCATION_MASTER, VOCATION_SWITCH_COOLDOWN_MS } from '../../data/vocationData';

export interface VocationSlice {
  selectVocation: (id: VocationId) => { success: boolean; message: string };
  switchVocation: (id: VocationId) => { success: boolean; message: string };
  gainVocationExp: (amount: number) => void;
  getVocationLevel: (id: VocationId) => number;
}

function vocationLevelFromExp(exp: number): number {
  let lv = 1;
  while (lv < VOCATION_EXP_TABLE.length - 1 && exp >= VOCATION_EXP_TABLE[lv + 1]) lv++;
  return lv;
}

function rankForLevel(id: VocationId, level: number): number {
  const def = VOCATION_MASTER[id];
  let rank = 1;
  for (const r of def.ranks) if (level >= r.requiredVocationLevel) rank = r.rank;
  return rank;
}

export const createVocationSlice: StateCreator<GameState, [], [], VocationSlice> = (set, get) => ({
  selectVocation: (id) => {
    const { player, addNotification } = get();
    if (!player) return { success: false, message: '読み込みエラー' };
    const def = VOCATION_MASTER[id];
    if (!def) return { success: false, message: '不明な職業です' };
    const voc = player.vocation ?? defaultVocationState();
    const alreadyUnlocked = voc.unlockedVocationIds.includes(id);
    if (!alreadyUnlocked) {
      const cond = def.unlockCondition;
      if (cond?.playerLevel && player.stats.level < cond.playerLevel) {
        return { success: false, message: `Lv${cond.playerLevel}以上で解放されます（現在Lv${player.stats.level}）` };
      }
    }
    set((state) => {
      if (!state.player) return state;
      const v = state.player.vocation ?? defaultVocationState();
      return {
        player: {
          ...state.player,
          vocation: {
            ...v,
            activeVocationId: id,
            unlockedVocationIds: v.unlockedVocationIds.includes(id) ? v.unlockedVocationIds : [...v.unlockedVocationIds, id],
            vocationExp: { ...v.vocationExp, [id]: v.vocationExp[id] ?? 0 },
            vocationRank: { ...v.vocationRank, [id]: v.vocationRank[id] ?? 1 },
            lastSwitchedAt: Date.now(),
          },
        },
      };
    });
    addNotification('success', `${def.icon} 職業を「${def.name}」に変更しました！`);
    return { success: true, message: `${def.name}になりました` };
  },

  switchVocation: (id) => {
    const { player, consumeItem, addNotification } = get();
    if (!player) return { success: false, message: '読み込みエラー' };
    const voc = player.vocation ?? defaultVocationState();
    if (voc.activeVocationId === id) return { success: false, message: 'すでにその職業です' };
    const now = Date.now();
    const elapsed = now - (voc.lastSwitchedAt ?? 0);
    if (elapsed < VOCATION_SWITCH_COOLDOWN_MS) {
      if (!consumeItem('vocation_change_ticket', 1)) {
        const remainMin = Math.ceil((VOCATION_SWITCH_COOLDOWN_MS - elapsed) / 60000);
        return { success: false, message: `転職クールタイム中です（残り${remainMin}分）。転職証があれば即時切替できます。` };
      }
      addNotification('success', '🎫 転職証を使用して即時転職しました！');
    }
    return get().selectVocation(id);
  },

  gainVocationExp: (amount) => {
    set((state) => {
      if (!state.player) return state;
      const v = state.player.vocation ?? defaultVocationState();
      if (!v.activeVocationId) return state;
      const id = v.activeVocationId;
      const prevExp = v.vocationExp[id] ?? 0;
      const newExp = prevExp + amount;
      const newLevel = vocationLevelFromExp(newExp);
      const newRank = rankForLevel(id, newLevel);
      return {
        player: {
          ...state.player,
          vocation: {
            ...v,
            vocationExp: { ...v.vocationExp, [id]: newExp },
            vocationRank: { ...v.vocationRank, [id]: newRank },
          },
        },
      };
    });
  },

  getVocationLevel: (id) => {
    const player = get().player;
    if (!player) return 1;
    const v = player.vocation ?? defaultVocationState();
    return vocationLevelFromExp(v.vocationExp[id] ?? 0);
  },
});
