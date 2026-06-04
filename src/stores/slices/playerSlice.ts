// src/stores/slices/playerSlice.ts
// プレイヤー基本ステータス・アイテム・ゴールド管理スライス

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import type { IdMap } from '../../types/game';
import { EXP_TABLE, SKILL_EXP_TABLE, ITEM_MASTER } from '../../data/masters';

export interface PlayerSlice {
  addItems:           (drops: { itemId: string; amount: number }[]) => void;
  consumeItem:        (itemId: string, amount: number) => boolean;
  changeGold:         (delta: number) => boolean;
  addExp:             (amount: number) => void;
  addSkillExp:        (skillId: string, amount: number) => void;
  changeHp:           (delta: number) => void;
  changeSatiety:      (delta: number) => void;
  applyPassiveRegen:  () => void;
  applyHungerPenalty: () => void;
  useItem:            (itemId: string) => { success: boolean; message: string };
  changeDisplayName:  (name: string) => boolean;
}

export const createPlayerSlice: StateCreator<GameState, [], [], PlayerSlice> = (set, get) => ({
  addItems: (drops) => {
    set((state) => {
      if (!state.player) return state;
      const inv: IdMap<number> = { ...state.player.inventory };
      for (const { itemId, amount } of drops) {
        inv[itemId] = (inv[itemId] ?? 0) + amount;
      }
      return { player: { ...state.player, inventory: inv } };
    });
  },

  consumeItem: (itemId, amount) => {
    const { player } = get();
    if (!player) return false;
    const current = player.inventory[itemId] ?? 0;
    if (current < amount) return false;
    set((state) => {
      if (!state.player) return state;
      const inv = { ...state.player.inventory };
      inv[itemId] = current - amount;
      if (inv[itemId] <= 0) delete inv[itemId];
      return { player: { ...state.player, inventory: inv } };
    });
    return true;
  },

  changeGold: (delta) => {
    const { player } = get();
    if (!player) return false;
    const newGold = player.gold + delta;
    if (newGold < 0) return false;
    set((state) => ({ player: state.player ? { ...state.player, gold: newGold } : null }));
    return true;
  },

  addExp: (amount) => {
    set((state) => {
      if (!state.player) return state;
      let { exp, level } = state.player.stats;
      exp += amount;
      while (level < EXP_TABLE.length - 1 && exp >= EXP_TABLE[level + 1]) level++;
      const expToNextLevel = EXP_TABLE[level + 1] ?? Infinity;
      return { player: { ...state.player, stats: { ...state.player.stats, exp, level, expToNextLevel } } };
    });
  },

  addSkillExp: (skillId, amount) => {
    set((state) => {
      if (!state.player) return state;
      const skillExp = { ...state.player.skillExp };
      const skillLevels = { ...state.player.skillLevels };
      skillExp[skillId] = (skillExp[skillId] ?? 0) + amount;
      let lv = skillLevels[skillId] ?? 1;
      while (lv < 100000 && SKILL_EXP_TABLE[lv + 1] !== undefined && skillExp[skillId] >= SKILL_EXP_TABLE[lv + 1]) lv++;
      skillLevels[skillId] = lv;
      return { player: { ...state.player, skillExp, skillLevels } };
    });
  },

  changeHp: (delta) => {
    set((state) => {
      if (!state.player) return state;
      const newHp = Math.max(0, Math.min(state.player.stats.maxHp, state.player.stats.hp + delta));
      return { player: { ...state.player, stats: { ...state.player.stats, hp: newHp } } };
    });
  },

  changeSatiety: (delta) => {
    set((state) => {
      if (!state.player) return state;
      const newSatiety = Math.max(0, Math.min(state.player.stats.maxSatiety, state.player.stats.satiety + delta));
      return { player: { ...state.player, stats: { ...state.player.stats, satiety: newSatiety } } };
    });
  },

  applyPassiveRegen: () => {
    const { player } = get();
    if (!player) return;
    const now = Date.now();
    const lastRegen = player.lastRegenAt ?? now;
    const elapsedSec = (now - lastRegen) / 1000;
    if (elapsedSec < 1) return;
    const hpToRegen = Math.floor(elapsedSec / 5);
    const satietyToRegen = Math.floor(elapsedSec / 60);
    if (hpToRegen <= 0 && satietyToRegen <= 0) return;
    set((state) => {
      if (!state.player) return state;
      const stats = state.player.stats;
      return {
        player: {
          ...state.player,
          stats: {
            ...stats,
            hp: Math.min(stats.maxHp, stats.hp + hpToRegen),
            satiety: Math.min(stats.maxSatiety, stats.satiety + satietyToRegen),
          },
          lastRegenAt: now,
        },
      };
    });
  },

  applyHungerPenalty: () => {
    const { player } = get();
    if (!player) return;
    if (player.stats.satiety <= 0) {
      get().changeHp(-5);
      get().addNotification('warning', '空腹のため体力が減っています！食料を補給してください。');
    }
  },

  useItem: (itemId) => {
    const { player, consumeItem, changeHp, changeSatiety, addNotification } = get();
    if (!player) return { success: false, message: 'プレイヤーデータがありません' };
    const item = ITEM_MASTER[itemId];
    if (!item) return { success: false, message: 'アイテムが見つかりません' };
    if (!item.useEffect) return { success: false, message: `${item.name}は使用できません` };
    if ((player.inventory[itemId] ?? 0) <= 0) return { success: false, message: `${item.name}を持っていません` };
    const ok = consumeItem(itemId, 1);
    if (!ok) return { success: false, message: 'アイテムの消費に失敗しました' };
    const { hpRestore, satietyRestore, message } = item.useEffect;
    if (hpRestore && hpRestore > 0) changeHp(Math.min(hpRestore, player.stats.maxHp - player.stats.hp));
    if (hpRestore && hpRestore < 0) changeHp(hpRestore);
    if (satietyRestore) changeSatiety(Math.min(satietyRestore, player.stats.maxSatiety - player.stats.satiety));
    const msg = message ?? `${item.name}を使用した！`;
    addNotification('success', msg);
    return { success: true, message: msg };
  },

  changeDisplayName: (name: string) => {
    const { player, changeGold, addNotification } = get();
    if (!player) return false;
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 1 || trimmed.length > 20) {
      addNotification('error', '名前は1〜20文字で入力してください');
      return false;
    }
    if (player.gold < 100) {
      addNotification('error', '名前変更には100Gが必要です');
      return false;
    }
    changeGold(-100);
    set((state) => state.player ? { player: { ...state.player, displayName: trimmed } } : state);
    addNotification('success', `名前を「${trimmed}」に変更しました（100G消費）`);
    return true;
  },
});
