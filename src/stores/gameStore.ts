// src/stores/gameStore.ts
// スライスパターンで内部を分割。useGameStore の公開インターフェースは変わらない。

import { create } from 'zustand';
import type { PlayerData, Notification, TabId } from '../types/game';
import { savePlayer } from '../services/database';
import { randomInt } from '../utils/random';
import { createPlayerSlice, type PlayerSlice } from './slices/playerSlice';
import { createDungeonSlice, type DungeonSlice } from './slices/dungeonSlice';
import { createFishingSlice, type FishingSlice } from './slices/fishingSlice';
import { createReliefSlice, type ReliefSlice } from './slices/reliefSlice';

// ============================================================
// GameState の型定義（スライス型を合成）
// ============================================================
export interface GameState extends PlayerSlice, DungeonSlice, FishingSlice, ReliefSlice {
  // 認証・プレイヤー
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
  saveGame: () => Promise<void>;
  setActiveTab: (tab: TabId) => void;
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
}

// ============================================================
// プレイヤーデータのデフォルト値補完
// ============================================================
function ensureDefaults(player: PlayerData): PlayerData {
  return {
    ...player,
    dungeonClearedCount: player.dungeonClearedCount ?? {},
    fishingScore: player.fishingScore ?? 0,
    equippedRodId: player.equippedRodId ?? 'basic_rod',
    activeJob: player.activeJob ?? null,
    activeBuffs: player.activeBuffs ?? [],
    reliefUsedCount: player.reliefUsedCount ?? 0,
    reliefLastUsed: player.reliefLastUsed ?? 0,
    lastRegenAt: player.lastRegenAt ?? Date.now(),
    emailAddress: player.emailAddress ?? '',
    emailNotifications: player.emailNotifications ?? { auction: true, events: true, updates: true },
    activityLog: player.activityLog ?? [],
    settings: player.settings ?? {},
  };
}

// ============================================================
// Store 本体（スライスを合成）
// ============================================================
export const useGameStore = create<GameState>((set, get, api) => ({
  // ---- 基本状態 ----
  uid: null,
  isAuthLoading: true,
  player: null,
  isSaving: false,
  lastSaveTime: 0,
  activeTab: 'gathering',
  notifications: [],

  setUid: (uid) => set({ uid }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setPlayer: (player) => set({ player: ensureDefaults(player) }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  addNotification: (type, message) => {
    const id = `${Date.now()}-${randomInt(1000000)}`;
    set((state) => ({ notifications: [...state.notifications, { id, type, message }] }));
    setTimeout(() => get().removeNotification(id), 3500);
  },

  removeNotification: (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
  },

  saveGame: async () => {
    const { player } = get();
    if (!player) return;
    set({ isSaving: true });
    try {
      try { localStorage.setItem('rpg_backup', JSON.stringify({ data: player, savedAt: Date.now() })); } catch { /* ignore */ }
      await savePlayer(player);
      set({ lastSaveTime: Date.now() });
      get().addNotification('success', 'ゲームを保存しました');
    } catch (e) {
      console.error('[saveGame] Firestore保存失敗:', e);
      get().addNotification('error', 'セーブに失敗しました。ローカルにバックアップしました。');
    } finally {
      set({ isSaving: false });
    }
  },

  // ---- スライスから合成 ----
  ...createPlayerSlice(set, get, api),
  ...createDungeonSlice(set, get, api),
  ...createFishingSlice(set, get, api),
  ...createReliefSlice(set, get, api),
}));
