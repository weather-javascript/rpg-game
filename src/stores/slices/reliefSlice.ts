// src/stores/slices/reliefSlice.ts
// 緊急救済措置スライス

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';

export type ReliefSlice = Pick<GameState, 'canUseRelief' | 'useRelief'>;

const COOLDOWN_MS = 30 * 60 * 1000;
const MAX_USES_PER_DAY = 3;
const DAILY_RESET_MS = 24 * 60 * 60 * 1000;

export const createReliefSlice: StateCreator<GameState, [], [], ReliefSlice> = (_set, get) => ({
  canUseRelief: () => {
    const { player } = get();
    if (!player) return { canUse: false, reason: 'プレイヤーデータなし' };
    const now = Date.now();
    const isStruggling = player.stats.hp <= 30 && player.stats.satiety <= 10 && player.gold < 500;
    if (!isStruggling) {
      const reasons: string[] = [];
      if (player.stats.hp > 30) reasons.push(`HP${player.stats.hp}（30以下が条件）`);
      if (player.stats.satiety > 10) reasons.push(`満腹度${player.stats.satiety}（10以下が条件）`);
      if (player.gold >= 500) reasons.push(`所持金${player.gold}G（500G未満が条件）`);
      return { canUse: false, reason: `条件未達成: ${reasons.join('、')}` };
    }
    if (now - (player.reliefLastUsed ?? 0) < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - (player.reliefLastUsed ?? 0))) / 60000);
      return { canUse: false, reason: `クールダウン中（あと${remaining}分）` };
    }
    if ((player.reliefUsedCount ?? 0) >= MAX_USES_PER_DAY && now - (player.reliefLastUsed ?? 0) < DAILY_RESET_MS) {
      return { canUse: false, reason: '本日の救済回数上限（3回）に達しました' };
    }
    return { canUse: true, reason: 'OK' };
  },

  useRelief: () => {
    const { canUseRelief, addItems, changeHp, changeSatiety, addNotification } = get();
    const { canUse, reason } = canUseRelief();
    if (!canUse) {
      addNotification('error', `救済措置を使用できません: ${reason}`);
      return;
    }
    const now = Date.now();
    _set((state) => {
      if (!state.player) return state;
      const prev = state.player.reliefUsedCount ?? 0;
      const resetCount = now - (state.player.reliefLastUsed ?? 0) >= DAILY_RESET_MS ? 0 : prev;
      return { player: { ...state.player, reliefUsedCount: resetCount + 1, reliefLastUsed: now } };
    });
    addItems([{ itemId: 'emergency_ration', amount: 2 }, { itemId: 'health_potion', amount: 1 }]);
    changeHp(30);
    changeSatiety(30);
    addNotification('success', '🆘 緊急救済措置発動！回復アイテムを受け取った。（1日3回まで）');
  },
});
