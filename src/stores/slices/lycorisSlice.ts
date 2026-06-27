// src/stores/slices/lycorisSlice.ts
// Lycoris裏初級専用Zustandスライス

import { LycorisBattleState, restoreLycorisBattle } from '../../systems/lycorisBattle';

export interface LycorisSlice {
  lycorisBattle: LycorisBattleState | null;
  setLycorisBattle: (state: LycorisBattleState | null) => void;
  resetLycorisBattle: () => void;
  restoreLycorisBattleFromFirebase: (raw: LycorisBattleState) => void;
}

export const createLycorisSlice = (set: (fn: (s: any) => any) => void): LycorisSlice => ({
  lycorisBattle: null,

  setLycorisBattle: (state) =>
    set((s: any) => ({ ...s, lycorisBattle: state })),

  resetLycorisBattle: () =>
    set((s: any) => ({ ...s, lycorisBattle: null })),

  restoreLycorisBattleFromFirebase: (raw) =>
    set((s: any) => ({ ...s, lycorisBattle: restoreLycorisBattle(raw) })),
});
