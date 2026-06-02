// src/stores/gameStore.ts
import { create } from 'zustand';
import type { PlayerData, Notification, TabId, IdMap } from '../types/game';
import { EXP_TABLE, SKILL_EXP_TABLE, ITEM_MASTER, DUNGEON_MASTER as DUNGEON_MASTER_DATA } from '../data/masters';
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
  useItem: (itemId: string) => { success: boolean; message: string };
  applyHungerPenalty: () => void;

  // ダンジョンクリア記録
  recordDungeonClear: (dungeonId: string) => void;
  getDungeonClearedCount: (dungeonId: string) => number;
  isDungeonUnlocked: (dungeonId: string) => boolean;

  // 釣りスコア
  addFishingScore: (amount: number) => void;

  // 釣り竿装備
  equipRod: (rodId: string) => void;

  // ジョブ
  setActiveJob: (jobId: string | null) => void;

  // バフ管理
  addBuff: (buff: { id: string; name: string; durationMs: number; fishingBonus?: number; miningBonus?: number }) => void;
  getActiveBuffBonus: (type: 'fishing' | 'mining') => number;

  // 詰み救済措置
  canUseRelief: () => { canUse: boolean; reason: string };
  useRelief: () => void;

  saveGame: () => Promise<void>;
  setActiveTab: (tab: TabId) => void;
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
}

// デフォルトプレイヤー初期値
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
  };
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
  setPlayer: (player) => set({ player: ensureDefaults(player) }),

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
    if (hpRestore && hpRestore < 0) changeHp(hpRestore); // ダメージ系
    if (satietyRestore) changeSatiety(Math.min(satietyRestore, player.stats.maxSatiety - player.stats.satiety));

    const msg = message ?? `${item.name}を使用した！`;
    addNotification('success', msg);
    return { success: true, message: msg };
  },

  applyHungerPenalty: () => {
    const { player } = get();
    if (!player) return;
    if (player.stats.satiety <= 0) {
      get().changeHp(-5);
      get().addNotification('warning', '空腹のため体力が減っています！食料を補給してください。');
    }
  },

  // ============================================================
  // ダンジョンクリア記録
  // ============================================================
  recordDungeonClear: (dungeonId) => {
    set((state) => {
      if (!state.player) return state;
      const dcc = { ...state.player.dungeonClearedCount };
      dcc[dungeonId] = (dcc[dungeonId] ?? 0) + 1;
      return { player: { ...state.player, dungeonClearedCount: dcc } };
    });
  },

  getDungeonClearedCount: (dungeonId) => {
    const { player } = get();
    return player?.dungeonClearedCount?.[dungeonId] ?? 0;
  },

  isDungeonUnlocked: (dungeonId) => {
    const DUNGEON_MASTER = DUNGEON_MASTER_DATA;
    const dungeon = DUNGEON_MASTER[dungeonId];
    if (!dungeon) return false;
    if (!dungeon.unlockCondition) return true;
    const { player } = get();
    if (!player) return false;
    const cleared = player.dungeonClearedCount?.[dungeon.unlockCondition.dungeonId] ?? 0;
    return cleared >= dungeon.unlockCondition.clearedCount;
  },

  // ============================================================
  // 釣りスコア
  // ============================================================
  addFishingScore: (amount) => {
    set((state) => {
      if (!state.player) return state;
      const newScore = (state.player.fishingScore ?? 0) + amount;
      return { player: { ...state.player, fishingScore: newScore } };
    });
    // スコア1000で上位鱗を付与
    const { player, addItems, addNotification } = get();
    if (!player) return;
    const score = player.fishingScore ?? 0;
    const prevMilestone = Math.floor((score - amount) / 1000);
    const currMilestone = Math.floor(score / 1000);
    if (currMilestone > prevMilestone) {
      const scales = ['scale_high_1','scale_high_2','scale_high_3','scale_high_4'];
      const scale = scales[Math.floor(Math.random() * scales.length)];
      addItems([{ itemId: scale, amount: 1 }]);
      addNotification('success', `🎣 釣りスコア${currMilestone * 1000}達成！上位鱗を1枚入手！`);
    }
  },

  // ============================================================
  // 釣り竿装備
  // ============================================================
  equipRod: (rodId) => {
    const { player, addNotification } = get();
    if (!player) return;
    if ((player.inventory[rodId] ?? 0) <= 0) {
      addNotification('error', 'その釣り竿を持っていません！');
      return;
    }
    set((state) => state.player ? { player: { ...state.player, equippedRodId: rodId } } : state);
    const item = ITEM_MASTER[rodId];
    addNotification('success', `🎣 ${item?.name} を装備した！`);
  },

  // ============================================================
  // ジョブ
  // ============================================================
  setActiveJob: (jobId) => {
    set((state) => state.player ? { player: { ...state.player, activeJob: jobId } } : state);
  },

  // ============================================================
  // バフ管理
  // ============================================================
  addBuff: (buff) => {
    set((state) => {
      if (!state.player) return state;
      const now = Date.now();
      const existing = (state.player.activeBuffs ?? []).filter(b => b.expiry > now && b.id !== buff.id);
      const newBuff = {
        id: buff.id,
        name: buff.name,
        expiry: now + buff.durationMs,
        fishingBonus: buff.fishingBonus,
        miningBonus: buff.miningBonus,
      };
      return { player: { ...state.player, activeBuffs: [...existing, newBuff] } };
    });
  },

  getActiveBuffBonus: (type) => {
    const { player } = get();
    if (!player) return 1.0;
    const now = Date.now();
    const activeBuffs = (player.activeBuffs ?? []).filter(b => b.expiry > now);
    let bonus = 1.0;
    for (const b of activeBuffs) {
      if (type === 'fishing' && b.fishingBonus) bonus *= b.fishingBonus;
      if (type === 'mining' && b.miningBonus) bonus *= b.miningBonus;
    }
    return bonus;
  },

  // ============================================================
  // 詰み救済措置
  // ============================================================
  canUseRelief: () => {
    const { player } = get();
    if (!player) return { canUse: false, reason: 'プレイヤーデータなし' };

    const now = Date.now();
    const COOLDOWN_MS = 30 * 60 * 1000; // 30分クールダウン
    const MAX_USES_PER_DAY = 3;

    // HP30以下 かつ 満腹度10以下 かつ 所持金500未満
    const isStruggling =
      player.stats.hp <= 30 &&
      player.stats.satiety <= 10 &&
      player.gold < 500;

    if (!isStruggling) {
      const reasons = [];
      if (player.stats.hp > 30) reasons.push(`HP${player.stats.hp}（30以下が条件）`);
      if (player.stats.satiety > 10) reasons.push(`満腹度${player.stats.satiety}（10以下が条件）`);
      if (player.gold >= 500) reasons.push(`所持金${player.gold}G（500G未満が条件）`);
      return { canUse: false, reason: `条件未達成: ${reasons.join('、')}` };
    }

    // クールダウンチェック
    if (now - (player.reliefLastUsed ?? 0) < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - player.reliefLastUsed)) / 60000);
      return { canUse: false, reason: `クールダウン中（あと${remaining}分）` };
    }

    // 1日3回制限（簡易: reliefUsedCountが3以上かつ最後の使用が24時間以内）
    const DAILY_RESET_MS = 24 * 60 * 60 * 1000;
    if ((player.reliefUsedCount ?? 0) >= MAX_USES_PER_DAY &&
        now - (player.reliefLastUsed ?? 0) < DAILY_RESET_MS) {
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
    set((state) => {
      if (!state.player) return state;
      const prev = state.player.reliefUsedCount ?? 0;
      const DAILY_RESET_MS = 24 * 60 * 60 * 1000;
      const resetCount = now - (state.player.reliefLastUsed ?? 0) >= DAILY_RESET_MS ? 0 : prev;
      return {
        player: {
          ...state.player,
          reliefUsedCount: resetCount + 1,
          reliefLastUsed: now,
        },
      };
    });

    addItems([{ itemId: 'emergency_ration', amount: 2 }, { itemId: 'health_potion', amount: 1 }]);
    changeHp(30);
    changeSatiety(30);
    addNotification('success', '🆘 緊急救済措置発動！回復アイテムを受け取った。（1日3回まで）');
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
