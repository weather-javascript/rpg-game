// src/stores/slices/dungeonSlice.ts
// ダンジョンクリア記録・解放判定スライス

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import { DUNGEON_MASTER as DUNGEON_MASTER_DATA } from '../../data/masters';

export interface DungeonSlice {
  recordDungeonClear:    (dungeonId: string) => void;
  getDungeonClearedCount:(dungeonId: string) => number;
  isDungeonUnlocked:     (dungeonId: string) => boolean;
}

export const createDungeonSlice: StateCreator<GameState, [], [], DungeonSlice> = (set, get) => ({
  recordDungeonClear: (dungeonId) => {
    set((state) => {
      if (!state.player) return state;
      const dcc = { ...state.player.dungeonClearedCount };
      dcc[dungeonId] = (dcc[dungeonId] ?? 0) + 1;
      const dungeon = DUNGEON_MASTER_DATA[dungeonId];
      const log = [
        ...(state.player.activityLog ?? []),
        { type: 'dungeon_clear' as const, message: `${dungeon?.name ?? dungeonId}をクリア！`, timestamp: Date.now() },
      ].slice(-50);
      return { player: { ...state.player, dungeonClearedCount: dcc, activityLog: log } };
    });
  },

  getDungeonClearedCount: (dungeonId) => {
    return get().player?.dungeonClearedCount?.[dungeonId] ?? 0;
  },

  isDungeonUnlocked: (dungeonId) => {
    const dungeon = DUNGEON_MASTER_DATA[dungeonId];
    if (!dungeon) return false;
    if (!dungeon.unlockCondition) return true;
    const { player } = get();
    if (!player) return false;
    const { dungeonId: prereqId, clearedCount } = dungeon.unlockCondition;
    return (player.dungeonClearedCount?.[prereqId] ?? 0) >= clearedCount;
  },
});
