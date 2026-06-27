// src/stores/gameStore.ts
// スライスパターンで内部を分割。useGameStore の公開インターフェースは変わらない。

import { create } from 'zustand';
import type { PlayerData, Notification, TabId } from '../types/game';
import { savePlayer } from '../services/database';
import { randomInt } from '../utils/random';
import { ITEM_MASTER, SKILL_EXP_TABLE } from '../data/masters';
import { DEFAULT_MINING_TOOL_ID, DEFAULT_WOODCUTTING_TOOL_ID } from '../data/toolsMaster';
import { createPlayerSlice, type PlayerSlice } from './slices/playerSlice';
import { createDungeonSlice, type DungeonSlice } from './slices/dungeonSlice';
import { createFishingSlice, type FishingSlice } from './slices/fishingSlice';
import { createReliefSlice, type ReliefSlice } from './slices/reliefSlice';
import { createInfiniteCorridorSlice, type InfiniteCorridorSlice } from './slices/infiniteCorridorSlice';
import { calcOfflineMiningResult } from '../systems/offlineMining';

// ============================================================
// GameState の型定義（スライス型を合成）
// ============================================================
export interface GameState extends PlayerSlice, DungeonSlice, FishingSlice, ReliefSlice, InfiniteCorridorSlice {
  // 認証・プレイヤー
  uid: string | null;
  isAuthLoading: boolean;
  player: PlayerData | null;
  isSaving: boolean;
  lastSaveTime: number;
  activeTab: TabId;
  notifications: Notification[];
  levelUpFlash: { level: number; ts: number } | null; // レベルアップ演出用の一時フラグ
  isFishingLocked: boolean;
  isGatheringLocked: boolean;

  setUid: (uid: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setPlayer: (player: PlayerData) => void;
  settleOfflineMining: () => void;
  saveGame: () => Promise<void>;
  setActiveTab: (tab: TabId) => void;
  setFishingLocked: (locked: boolean) => void;
  setGatheringLocked: (locked: boolean) => void;
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
  triggerLevelUp: (level: number) => void; // レベルアップ演出（カットイン）を発火
  clearLevelUp: () => void;
}

// ============================================================
// プレイヤーデータのデフォルト値補完
// ============================================================
function ensureDefaults(player: PlayerData): PlayerData {
  // ホットバー・オフハンド・防具スロット内のweaponHpBonusを合算してmaxHpに反映
  const hotbar = player.equipment?.hotbar ?? [];
  let hpBonus = 0;
  for (const itemId of hotbar) {
    if (itemId) {
      const item = ITEM_MASTER[itemId];
      if (item?.weaponHpBonus) hpBonus += item.weaponHpBonus;
    }
  }
  const offhandId = player.equipment?.offhand;
  if (offhandId) {
    const offItem = ITEM_MASTER[offhandId];
    if (offItem?.weaponHpBonus) hpBonus += offItem.weaponHpBonus;
  }
  // 防具スロット（helmet/chestplate/leggings/boots）のHPボーナスも加算
  for (const slotKey of ['helmet', 'chestplate', 'leggings', 'boots'] as const) {
    const slotId = player.equipment?.[slotKey];
    if (slotId) {
      const slotItem = ITEM_MASTER[slotId];
      if (slotItem?.weaponHpBonus) hpBonus += slotItem.weaponHpBonus;
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
    equippedTools: player.equippedTools ?? { miningToolId: DEFAULT_MINING_TOOL_ID, woodcuttingToolId: DEFAULT_WOODCUTTING_TOOL_ID },
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
    offlineMining: player.offlineMining ?? { enabled: false, category: 'mining', startedAt: 0, lastSettledAt: 0 },
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
// オフライン採掘（採掘委任）の精算
// ログイン時/プレイヤーデータ読み込み直後、および一定間隔（App.tsx側のタイマー）で
// 経過時間分をまとめて精算する。演出のためのリアルタイムドロップ表示は行わない。
// ============================================================
function settleOfflineMiningOnLoad(
  player: PlayerData,
  _addNotification: (type: Notification['type'], message: string) => void
): PlayerData {
  const om = player.offlineMining;
  if (!om || !om.enabled) return player;

  const now = Date.now();
  const elapsedMs = now - (om.lastSettledAt || om.startedAt || now);
  if (elapsedMs < 60000) {
    // 1分未満なら精算スキップ（次回ログイン時にまとめて精算）
    return player;
  }

  const result = calcOfflineMiningResult(player, om.category, elapsedMs);

  // 精算済みとして最終精算時刻を必ず更新（結果が0件でも進行を無駄にしない）
  const updatedOfflineMining = { ...om, lastSettledAt: now };

  if (!result || result.drops.length === 0) {
    return { ...player, offlineMining: updatedOfflineMining };
  }

  // インベントリ反映
  const inventory = { ...player.inventory };
  for (const d of result.drops) inventory[d.itemId] = (inventory[d.itemId] ?? 0) + d.amount;

  // 経験値反映（スキル経験値・レベルアップ判定はaddSkillExpと同一ロジック）
  const skillExp = { ...player.skillExp };
  const skillLevels = { ...player.skillLevels };
  skillExp[result.skillId] = (skillExp[result.skillId] ?? 0) + result.expGained;
  let lv = skillLevels[result.skillId] ?? 1;
  while (lv < 100000 && SKILL_EXP_TABLE[lv + 1] !== undefined && skillExp[result.skillId] >= SKILL_EXP_TABLE[lv + 1]) lv++;
  skillLevels[result.skillId] = lv;

  // 採取図鑑更新（既存のupdateGatherCollectionと同じロジック）
  const prevCollection = player.gatherCollection ?? { discoveredItems: [], itemCounts: {} };
  const discovered = new Set(prevCollection.discoveredItems);
  const counts = { ...prevCollection.itemCounts };
  for (const d of result.drops) {
    discovered.add(d.itemId);
    counts[d.itemId] = (counts[d.itemId] ?? 0) + d.amount;
  }

  // _pendingMiningResult: App.tsx側でポップアップ表示用にセット
  (globalThis as Record<string,unknown>)['__pendingMiningResult'] = {
    drops: result.drops,
    totalAmount: result.totalAmount,
    elapsedMinutes: result.elapsedMinutes,
    capped: result.capped,
  };

  return {
    ...player,
    inventory,
    skillExp,
    skillLevels,
    gatherCollection: { discoveredItems: [...discovered], itemCounts: counts },
    offlineMining: updatedOfflineMining,
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
  levelUpFlash: null,
  isFishingLocked: false,
  isGatheringLocked: false,

  setUid: (uid) => set({ uid }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setPlayer: (player) => {
    const isInitialLoad = get().player === null;
    let merged = ensureDefaults(player);
    if (isInitialLoad) {
      merged = settleOfflineMiningOnLoad(merged, get().addNotification);
    }
    set({ player: merged });
  },
  settleOfflineMining: () => {
    const state = get();
    if (!state.player) return;
    const updated = settleOfflineMiningOnLoad(state.player, state.addNotification);
    if (updated !== state.player) set({ player: updated });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setFishingLocked: (locked) => set({ isFishingLocked: locked }),
  setGatheringLocked: (locked) => set({ isGatheringLocked: locked }),

  addNotification: (type, message) => {
    const id = `${Date.now()}-${randomInt(1000000)}`;
    set((state) => ({ notifications: [...state.notifications, { id, type, message }] }));
    setTimeout(() => get().removeNotification(id), 3500);
  },

  removeNotification: (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
  },

  // レベルアップ演出（カットイン）：一定時間後に自動で消える
  triggerLevelUp: (level) => {
    set({ levelUpFlash: { level, ts: Date.now() } });
    setTimeout(() => {
      // その間に再度レベルアップしていなければクリア
      if (get().levelUpFlash?.level === level) set({ levelUpFlash: null });
    }, 2400);
  },
  clearLevelUp: () => set({ levelUpFlash: null }),

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
  ...createInfiniteCorridorSlice(set, get, api),
}));
