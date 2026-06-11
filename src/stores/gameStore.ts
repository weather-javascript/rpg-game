// src/stores/gameStore.ts
// スライスパターンで内部を分割。useGameStore の公開インターフェースは変わらない。

import { create } from 'zustand';
import type { PlayerData, Notification, TabId } from '../types/game';
import { savePlayer } from '../services/database';
import { randomInt } from '../utils/random';
import { ITEM_MASTER } from '../data/masters';
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
  // ホットバー内のweaponHpBonusを合算してmaxHpに反映
  const hotbar = player.equipment?.hotbar ?? [];
  let hpBonus = 0;
  for (const itemId of hotbar) {
    if (itemId) {
      const item = ITEM_MASTER[itemId];
      if (item?.weaponHpBonus) hpBonus += item.weaponHpBonus;
    }
  }
  // baseMaxHpを保持（初回のみ設定、以降はbonusを加算）
  const baseMaxHp = player.stats?.baseMaxHp ?? player.stats?.maxHp ?? 100;
  const newMaxHp = baseMaxHp + hpBonus;
  return {
    ...player,
    stats: player.stats ? {
      ...player.stats,
      baseMaxHp,
      maxHp: newMaxHp,
      hp: Math.min(player.stats.hp, newMaxHp),
    } : player.stats,
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
    lifetimeStats: player.lifetimeStats ?? { totalDamageDealt: 0, totalGoldEarned: 0, maxCombo: 0, monstersDefeated: 0 },
    unlockedAchievements: player.unlockedAchievements ?? [],
    totalWagered: player.totalWagered ?? 0,
    missionProgress: player.missionProgress ?? {
      dailySlotPlays:0, dailyChohanWins:0, dailyChinchiroWins:0, dailyCoinFlipWins:0,
      dailyHighlowWins:0, dailyPokerWins:0, dailyGamblePlays:0,
      dailyMinesWins:0, dailyDiceRaceWins:0, dailyRouletteWins:0, dailyBlackjackWins:0,
      dailyScratchWins:0, dailyRaceWins:0,
      weeklySlotPlays:0, weeklyChohanWins:0, weeklyChinchiroWins:0, weeklyPokerWins:0,
      weeklyGamblePlays:0, weeklyHighlowMaxStreak:0,
      weeklyMinesWins:0, weeklyDiceRaceWins:0, weeklyRouletteWins:0, weeklyBlackjackWins:0,
      weeklyScratchWins:0, weeklyRaceWins:0,
      totalSlotPlays:0, totalChohanPlays:0, totalChohanWins:0,
      totalChinchiroPlays:0, totalChinchiroWins:0, totalPokerPlays:0, totalPokerWins:0,
      totalCoinFlipPlays:0, totalCoinFlipWins:0, totalHighlowPlays:0,
      totalHighlowWins:0, totalHighlowMaxStreak:0,
      totalJackpotWins:0,
      totalMinesPlays:0, totalMinesWins:0, totalDiceRacePlays:0, totalDiceRaceWins:0,
      totalRoulettePlays:0, totalRouletteWins:0, totalBlackjackPlays:0, totalBlackjackWins:0,
      totalScratchPlays:0, totalScratchWins:0, totalRacePlays:0, totalRaceWins:0,
      totalWagered:0, totalWinAmount:0,
      totalLoseCount:0, totalWinCount:0, maxSingleWin:0, maxSingleBet:0, maxHighlowStreak:0,
      dailyResetAt:0, weeklyResetAt:0, completedMissions:[], claimedMissions:[],
    },
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
