// src/stores/slices/infiniteCorridorSlice.ts
// 無限深層回廊：周回ループ（進入→戦闘→続行/帰還→確定/離脱）の状態管理
// ステージ1: 初級（1〜10階）のみ対応。中級以降は敵データ追加後に自動的に動作する設計。

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import { randomIntRange, randomPick, secureRandom } from '../../utils/random';
import {
  IC_ALL_BEGINNER_ENEMIES, IC_ENEMIES_BEGINNER, IC_BOSS_CAVE_OGRE,
  getICMultiplier, getICEliteRate, getICScaledStats, getICThreatStars,
  rollICEvent, IC_MULTIPLIER_JUMP_WARNING_FLOORS, type ICEnemy,
} from '../../data/infiniteCorridorMaster';

export interface ICRunLogEntry { message: string; kind: 'info' | 'combat' | 'event' | 'danger' | 'success'; }

export interface InfiniteCorridorSlice {
  icRunActive: boolean;
  icCurrentFloor: number;
  icPendingMaterials: Record<string, number>;
  icRunLog: ICRunLogEntry[];
  icRunFailed: boolean;
  icFloorResolved: boolean;

  icStartRun: () => void;
  icEncounterFloor: () => void; // 現在階層のイベント/戦闘を解決する
  icContinueDeeper: () => void; // 続行：次の階層へ
  icReturnSafely: () => void;   // 帰還：素材を確定して周回終了
  icAbandonRun: () => void;     // 死亡などで周回を破棄（素材は失われる）
  icGetNextFloorWarning: () => string | null;
}

function pickFloorEnemy(floor: number): ICEnemy {
  if (floor === 10) return IC_BOSS_CAVE_OGRE; // ステージ1時点では初級ボスのみ実装
  const candidates = Object.values(IC_ENEMIES_BEGINNER).filter(
    e => !e.isElite && floor >= e.floorMin && floor <= e.floorMax
  );
  if (candidates.length === 0) return IC_ENEMIES_BEGINNER.ic_slime;
  return randomPick(candidates);
}

export const createInfiniteCorridorSlice: StateCreator<GameState, [], [], InfiniteCorridorSlice> = (set, get) => ({
  icRunActive: false,
  icCurrentFloor: 1,
  icPendingMaterials: {},
  icRunLog: [],
  icRunFailed: false,
  icFloorResolved: false,

  icStartRun: () => {
    set({ icRunActive: true, icCurrentFloor: 1, icPendingMaterials: {}, icRunFailed: false, icFloorResolved: false, icRunLog: [{ message: '無限深層回廊に突入した。', kind: 'info' }] });
  },

  icEncounterFloor: () => {
    const { player, icCurrentFloor } = get();
    if (!player || !get().icRunActive) return;

    const floor = icCurrentFloor;
    const multiplier = getICMultiplier(floor);
    const eliteRate = getICEliteRate(floor);
    const log: ICRunLogEntry[] = [];

    // エリート抽選（6〜9階のみ、ステージ1時点で実装済みのエリートは狂暴なオーガのみ）
    const isEliteFloor = floor >= 6 && floor <= 9 && secureRandom() < eliteRate;
    const enemy = isEliteFloor ? IC_ENEMIES_BEGINNER.ic_enraged_ogre : pickFloorEnemy(floor);
    const { hp, atk, def } = getICScaledStats(enemy.baseHp, enemy.baseAttack, enemy.baseDefense, floor);

    // 簡易戦闘解決（ステージ1: プレイヤーステータスとの簡易比較。詳細な戦闘UIは次ステージで実装）
    const playerPower = (player.stats.attack ?? 10) + (player.skillLevels?.combat ?? 1) * 2;
    const enemyPower = atk + def * 0.5;
    const winChance = Math.max(0.55, Math.min(0.97, 0.85 + (playerPower - enemyPower) / 200));
    const won = secureRandom() < winChance;

    if (!won) {
      log.push({ message: `${enemy.name}に敗北した…！未確定の素材は持ち帰れない。`, kind: 'danger' });
      set((state) => ({ icRunLog: [...state.icRunLog, ...log], icRunFailed: true, icRunActive: false, icFloorResolved: false }));
      return;
    }

    log.push({ message: `${enemy.name}（HP${hp}/ATK${atk}/DEF${def}）を撃破した！`, kind: 'combat' });

    // ドロップ計算（続行倍率を乗算）
    const gained: Record<string, number> = {};
    for (const d of enemy.drops) {
      if (secureRandom() < d.rate) {
        const amount = Math.round(randomIntRange(d.min, d.max) * multiplier);
        gained[d.itemId] = (gained[d.itemId] ?? 0) + Math.max(1, amount);
      }
    }
    if (enemy.isBoss) {
      log.push({ message: `${enemy.name}を撃破した！ボス証を獲得した。`, kind: 'success' });
    }

    // ランダムイベント抽選（戦闘後に1回）
    const eventType = rollICEvent(secureRandom());
    if (eventType === 'mimic') {
      log.push({ message: 'ミミックが混じっていた！追加で素材を多く得た。', kind: 'event' });
      for (const k of Object.keys(gained)) gained[k] = Math.round(gained[k] * 2);
    } else if (eventType === 'spring') {
      log.push({ message: '泉を見つけた。HPが少し回復した。', kind: 'event' });
    } else if (eventType === 'altar') {
      log.push({ message: '祭壇があった（投資イベントは次ステージで実装予定）。', kind: 'event' });
    } else if (eventType === 'merchant') {
      log.push({ message: '素材交換商人に出会った（交換UIは次ステージで実装予定）。', kind: 'event' });
    } else {
      log.push({ message: '宝箱を見つけた！素材を獲得した。', kind: 'event' });
    }

    set((state) => {
      const pending = { ...state.icPendingMaterials };
      for (const [k, v] of Object.entries(gained)) pending[k] = (pending[k] ?? 0) + v;
      return { icPendingMaterials: pending, icRunLog: [...state.icRunLog, ...log], icFloorResolved: true };
    });
  },

  icContinueDeeper: () => {
    set((state) => ({ icCurrentFloor: state.icCurrentFloor + 1, icFloorResolved: false }));
  },

  icReturnSafely: () => {
    const { icPendingMaterials } = get();
    const drops = Object.entries(icPendingMaterials).map(([itemId, amount]) => ({ itemId, amount }));
    if (drops.length > 0) get().addItems(drops);
    set((state) => ({
      icRunActive: false,
      icPendingMaterials: {},
      icRunLog: [...state.icRunLog, { message: `帰還した。獲得素材を確定した（${drops.length}種）。`, kind: 'success' }],
    }));
  },

  icAbandonRun: () => {
    set({ icRunActive: false, icPendingMaterials: {}, icRunFailed: false });
  },

  icGetNextFloorWarning: () => {
    const nextFloor = get().icCurrentFloor + 1;
    if (!IC_MULTIPLIER_JUMP_WARNING_FLOORS.includes(get().icCurrentFloor)) return null;
    const mult = getICMultiplier(nextFloor);
    const stars = getICThreatStars(nextFloor);
    return `次に進むと素材倍率が×${mult}に上昇します（脅威度★${stars}）。敵も強くなりますが、続行しますか？`;
  },
});

// 後続ステージ参照用に再エクスポート（中級以降の敵データ追加時に拡張）
export { IC_ALL_BEGINNER_ENEMIES };
