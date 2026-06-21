// src/stores/slices/infiniteCorridorSlice.ts
// 無限深層回廊：周回ループ（進入→戦闘→続行/帰還→確定/離脱）の状態管理
// 戦闘自体は他ダンジョンと同じTurnBattle（ホットバー/武器選択UI）に委譲する。
// ステージ1: 初級（1〜10階）のみ対応。中級以降は敵データ追加後に自動的に動作する設計。

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import { randomIntRange, randomPick, secureRandom } from '../../utils/random';
import { MONSTER_MASTER, DUNGEON_MASTER } from '../../data/masters';
import {
  IC_ALL_BEGINNER_ENEMIES, IC_ENEMIES_BEGINNER, IC_BOSS_CAVE_OGRE,
  getICMultiplier, getICEliteRate, getICThreatStars,
  rollICEvent, icEnemyToMonsterMaster, IC_MULTIPLIER_JUMP_WARNING_FLOORS, type ICEnemy,
} from '../../data/infiniteCorridorMaster';

export interface ICRunLogEntry { message: string; kind: 'info' | 'combat' | 'event' | 'danger' | 'success'; }

export interface InfiniteCorridorSlice {
  icRunActive: boolean;
  icCurrentFloor: number;
  icPendingMaterials: Record<string, number>;
  icRunLog: ICRunLogEntry[];
  icRunFailed: boolean;
  icFloorResolved: boolean;
  // 実戦闘（ホットバー/武器選択TurnBattle）の進行管理
  icBattleActive: boolean;
  icBattleKey: number;
  icBattleEnemyId: string | null;
  icBattleFloor: number;
  icBattleMana: number;

  icStartRun: () => void;
  icStartFloorBattle: () => void;   // 現在階層の敵を確定し、TurnBattleを開始する
  icResolveBattleWin: () => void;   // TurnBattle勝利後：素材ドロップ・イベント確定
  icResolveBattleLose: () => void;  // TurnBattle敗北後：周回失敗
  icCancelBattle: () => void;       // TurnBattle逃走：階層は未解決のまま戦闘のみ終了
  icSetBattleMana: (mana: number) => void;
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

/** 指定階層の敵をMONSTER_MASTERへ登録し、infinite_corridorダンジョンのエリアを
 *  その敵1体だけのエリアに差し替える。TurnBattle側の既存スポーン処理（spawnEnemies）を
 *  そのまま使い回すための橋渡し。同一(敵×階層)組み合わせの再登録はスキップする。 */
function registerICEncounter(enemy: ICEnemy, floor: number): string {
  const monsterId = `${enemy.id}_f${floor}`;
  if (!MONSTER_MASTER[monsterId]) {
    MONSTER_MASTER[monsterId] = icEnemyToMonsterMaster(enemy, floor);
  }
  const dungeon = DUNGEON_MASTER.infinite_corridor;
  if (dungeon) {
    dungeon.areas = [{ name: `B${floor}F`, monsters: [{ monsterId, count: 1, isBoss: enemy.isBoss ?? false }] }];
  }
  return monsterId;
}

export const createInfiniteCorridorSlice: StateCreator<GameState, [], [], InfiniteCorridorSlice> = (set, get) => ({
  icRunActive: false,
  icCurrentFloor: 1,
  icPendingMaterials: {},
  icRunLog: [],
  icRunFailed: false,
  icFloorResolved: false,
  icBattleActive: false,
  icBattleKey: 0,
  icBattleEnemyId: null,
  icBattleFloor: 1,
  icBattleMana: 0,

  icStartRun: () => {
    set({
      icRunActive: true, icCurrentFloor: 1, icPendingMaterials: {}, icRunFailed: false, icFloorResolved: false,
      icBattleActive: false, icBattleEnemyId: null, icBattleMana: 0,
      icRunLog: [{ message: '無限深層回廊に突入した。', kind: 'info' }],
    });
  },

  icStartFloorBattle: () => {
    const { player, icCurrentFloor, icRunActive } = get();
    if (!player || !icRunActive) return;
    const floor = icCurrentFloor;
    const eliteRate = getICEliteRate(floor);
    const isEliteFloor = floor >= 6 && floor <= 9 && secureRandom() < eliteRate;
    const enemy = isEliteFloor ? IC_ENEMIES_BEGINNER.ic_enraged_ogre : pickFloorEnemy(floor);
    registerICEncounter(enemy, floor);
    set(state => ({
      icBattleActive: true,
      icBattleKey: state.icBattleKey + 1,
      icBattleEnemyId: enemy.id,
      icBattleFloor: floor,
      icBattleMana: 0,
    }));
  },

  icResolveBattleWin: () => {
    const { icBattleEnemyId, icBattleFloor } = get();
    const enemy = icBattleEnemyId ? IC_ALL_BEGINNER_ENEMIES[icBattleEnemyId] : null;
    set({ icBattleActive: false, icBattleEnemyId: null });
    if (!enemy) return;

    const floor = icBattleFloor;
    const multiplier = getICMultiplier(floor);
    const log: ICRunLogEntry[] = [];
    log.push({ message: `${enemy.name}を撃破した！`, kind: 'combat' });

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

  icResolveBattleLose: () => {
    const { icBattleEnemyId } = get();
    const enemy = icBattleEnemyId ? IC_ALL_BEGINNER_ENEMIES[icBattleEnemyId] : null;
    set((state) => ({
      icBattleActive: false,
      icBattleEnemyId: null,
      icRunLog: [...state.icRunLog, { message: `${enemy?.name ?? '敵'}に敗北した…！未確定の素材は持ち帰れない。`, kind: 'danger' }],
      icRunFailed: true,
      icRunActive: false,
      icFloorResolved: false,
    }));
  },

  icCancelBattle: () => {
    set((state) => ({
      icBattleActive: false,
      icBattleEnemyId: null,
      icRunLog: [...state.icRunLog, { message: '🏃 戦闘から逃走した。', kind: 'info' }],
    }));
  },

  icSetBattleMana: (mana: number) => set({ icBattleMana: mana }),

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
    set({ icRunActive: false, icPendingMaterials: {}, icRunFailed: false, icBattleActive: false, icBattleEnemyId: null });
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
