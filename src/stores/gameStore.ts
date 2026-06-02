// src/stores/gameStore.ts
import { create } from 'zustand';
import type { PlayerData, Notification, TabId, IdMap } from '../types/game';
import { EXP_TABLE, SKILL_EXP_TABLE, ITEM_MASTER } from '../data/masters';
import { savePlayer } from '../services/database';

interface GameState {
  uid: string | null;
  isAuthLoading: boolean;
  player: PlayerData | null;
  isSaving: boolean;
  lastSaveTime: number;
  activeTab: TabId;
  notifications: Notification[];

  setUid: (uid: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setPlayer: (player: PlayerData) => void;
  addItems: (drops: { itemId: string; amount: number }[]) => void;
  consumeItem: (itemId: string, amount: number) => boolean;
  changeGold: (delta: number) => boolean;
  addExp: (amount: number) => void;
  addSkillExp: (skillId: string, amount: number) => void;
  changeHp: (delta: number) => void;
  changeSatiety: (delta: number) => void;

  /** アイテムを使用する（食料・ポーション） */
  useItem: (itemId: string) => { success: boolean; message: string };

  /** 満腹度が0のとき行動時にHP減少ペナルティを与える */
  applyHungerPenalty: () => void;

  saveGame: () => Promise<void>;
  setActiveTab: (tab: TabId) => void;
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  uid: null,
  isAuthLoading: true,
  player: null,
  isSaving: false,
  lastSaveTime: 0,
  activeTab: 'gathering',
  notifications: [],

  setUid: (uid) => set({ uid }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setPlayer: (player) => set({ player }),

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
      while (lv < SKILL_EXP_TABLE.length - 1 && skillExp[skillId] >= SKILL_EXP_TABLE[lv + 1]) lv++;
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

  // ============================================================
  // アイテム使用（食料・ポーション）
  // ============================================================
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
    if (hpRestore) changeHp(Math.min(hpRestore, player.stats.maxHp - player.stats.hp));
    if (satietyRestore) changeSatiety(Math.min(satietyRestore, player.stats.maxSatiety - player.stats.satiety));

    const msg = message ?? `${item.name}を使用した！`;
    addNotification('success', msg);
    return { success: true, message: msg };
  },

  // ============================================================
  // 空腹ペナルティ（満腹度0 → 行動時にHP-5）
  // ============================================================
  applyHungerPenalty: () => {
    const { player } = get();
    if (!player) return;
    if (player.stats.satiety <= 0) {
      get().changeHp(-5);
      get().addNotification('warning', '空腹のため体力が減っています！食料を補給してください。');
    }
  },

  saveGame: async () => {
    const { player } = get();
    if (!player) return;
    set({ isSaving: true });
    try {
      await savePlayer(player);
      set({ lastSaveTime: Date.now() });
      get().addNotification('success', 'ゲームを保存しました');
    } catch {
      get().addNotification('error', 'セーブに失敗しました');
    } finally {
      set({ isSaving: false });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  addNotification: (type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({ notifications: [...state.notifications, { id, type, message }] }));
    setTimeout(() => get().removeNotification(id), 3500);
  },

  removeNotification: (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
  },
}));
