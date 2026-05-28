// src/stores/gameStore.ts
// Zustand を使ったグローバルゲーム状態管理。
// Firestore への書き込みは savePlayer() 呼び出し時のみ。
// ゲームプレイ中はすべてこの Store で状態管理する。

import { create } from 'zustand';
import type { PlayerData, Notification, TabId, IdMap } from '../types/game';
import { EXP_TABLE, SKILL_EXP_TABLE } from '../data/masters';
import { savePlayer } from '../services/database';

interface GameState {
  // --- 認証 ---
  uid: string | null;
  isAuthLoading: boolean;

  // --- プレイヤーデータ ---
  player: PlayerData | null;
  isSaving: boolean;
  lastSaveTime: number;

  // --- UI ---
  activeTab: TabId;
  notifications: Notification[];

  // --- アクション ---
  setUid: (uid: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setPlayer: (player: PlayerData) => void;

  /** アイテムをインベントリに追加する */
  addItems: (drops: { itemId: string; amount: number }[]) => void;

  /** アイテムをインベントリから消費する（不足時は失敗） */
  consumeItem: (itemId: string, amount: number) => boolean;

  /** ゴールドを変動させる（負の値で減少。残高不足は false を返す） */
  changeGold: (delta: number) => boolean;

  /** プレイヤー経験値を加算し、必要に応じてレベルアップ処理 */
  addExp: (amount: number) => void;

  /** スキル経験値を加算し、必要に応じてスキルレベルアップ処理 */
  addSkillExp: (skillId: string, amount: number) => void;

  /** HPを変動させる（0以下でダウン状態） */
  changeHp: (delta: number) => void;

  /** 満腹度を変動させる */
  changeSatiety: (delta: number) => void;

  /** 手動セーブ */
  saveGame: () => Promise<void>;

  /** タブを切り替える */
  setActiveTab: (tab: TabId) => void;

  /** 通知を追加する */
  addNotification: (type: Notification['type'], message: string) => void;

  /** 通知を削除する */
  removeNotification: (id: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // --- 初期状態 ---
  uid: null,
  isAuthLoading: true,
  player: null,
  isSaving: false,
  lastSaveTime: 0,
  activeTab: 'gathering',
  notifications: [],

  // --- 認証 ---
  setUid: (uid) => set({ uid }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setPlayer: (player) => set({ player }),

  // --- インベントリ操作 ---
  addItems: (drops) => {
    set((state) => {
      if (!state.player) return state;
      const newInventory: IdMap<number> = { ...state.player.inventory };
      for (const { itemId, amount } of drops) {
        newInventory[itemId] = (newInventory[itemId] ?? 0) + amount;
      }
      return { player: { ...state.player, inventory: newInventory } };
    });
  },

  consumeItem: (itemId, amount) => {
    const { player } = get();
    if (!player) return false;
    const current = player.inventory[itemId] ?? 0;
    if (current < amount) return false;

    set((state) => {
      if (!state.player) return state;
      const newInventory = { ...state.player.inventory };
      newInventory[itemId] = current - amount;
      if (newInventory[itemId] <= 0) delete newInventory[itemId];
      return { player: { ...state.player, inventory: newInventory } };
    });
    return true;
  },

  // --- 所持金 ---
  changeGold: (delta) => {
    const { player } = get();
    if (!player) return false;
    const newGold = player.gold + delta;
    if (newGold < 0) return false;
    set((state) => ({
      player: state.player ? { ...state.player, gold: newGold } : null,
    }));
    return true;
  },

  // --- プレイヤー経験値・レベルアップ ---
  addExp: (amount) => {
    set((state) => {
      if (!state.player) return state;
      let { exp, level } = state.player.stats;
      exp += amount;

      // レベルアップループ（複数レベルアップも対応）
      while (level < EXP_TABLE.length - 1 && exp >= EXP_TABLE[level + 1]) {
        level++;
      }

      const expToNextLevel = EXP_TABLE[level + 1] ?? Infinity;

      return {
        player: {
          ...state.player,
          stats: { ...state.player.stats, exp, level, expToNextLevel },
        },
      };
    });
  },

  // --- スキル経験値・レベルアップ ---
  addSkillExp: (skillId, amount) => {
    set((state) => {
      if (!state.player) return state;
      const newSkillExp = { ...state.player.skillExp };
      const newSkillLevels = { ...state.player.skillLevels };

      newSkillExp[skillId] = (newSkillExp[skillId] ?? 0) + amount;

      let currentLevel = newSkillLevels[skillId] ?? 1;
      while (
        currentLevel < SKILL_EXP_TABLE.length - 1 &&
        newSkillExp[skillId] >= SKILL_EXP_TABLE[currentLevel + 1]
      ) {
        currentLevel++;
      }
      newSkillLevels[skillId] = currentLevel;

      return {
        player: {
          ...state.player,
          skillExp: newSkillExp,
          skillLevels: newSkillLevels,
        },
      };
    });
  },

  // --- HP・満腹度 ---
  changeHp: (delta) => {
    set((state) => {
      if (!state.player) return state;
      const newHp = Math.max(
        0,
        Math.min(state.player.stats.maxHp, state.player.stats.hp + delta)
      );
      return {
        player: {
          ...state.player,
          stats: { ...state.player.stats, hp: newHp },
        },
      };
    });
  },

  changeSatiety: (delta) => {
    set((state) => {
      if (!state.player) return state;
      const newSatiety = Math.max(
        0,
        Math.min(state.player.stats.maxSatiety, state.player.stats.satiety + delta)
      );
      return {
        player: {
          ...state.player,
          stats: { ...state.player.stats, satiety: newSatiety },
        },
      };
    });
  },

  // --- セーブ ---
  saveGame: async () => {
    const { player } = get();
    if (!player) return;
    set({ isSaving: true });
    try {
      await savePlayer(player);
      set({ lastSaveTime: Date.now() });
      get().addNotification('success', 'ゲームを保存しました');
    } catch (err) {
      console.error('Save failed:', err);
      get().addNotification('error', 'セーブに失敗しました');
    } finally {
      set({ isSaving: false });
    }
  },

  // --- UI ---
  setActiveTab: (tab) => set({ activeTab: tab }),

  addNotification: (type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    const notification: Notification = { id, type, message };
    set((state) => ({
      notifications: [...state.notifications, notification],
    }));
    // 3秒後に自動削除
    setTimeout(() => get().removeNotification(id), 3000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
