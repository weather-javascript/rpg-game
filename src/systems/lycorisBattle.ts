// src/systems/lycorisBattle.ts
// Lycoris裏初級専用戦闘状態機械（純粋関数群）
// 既存のffggBattle.ts / ffBattleSystem.ts には依存しない。

import {
  LYCORIS_DEF,
  LYCORIS_AWAKENED_DEF,
  LYCORIS_DROP_TABLE,
  MinionType,
  LycorisPhaseDefinition,
} from '../data/lycorisMaster';

// ============================================================
// 型定義
// ============================================================

export type LycorisPhase =
  | 'throne'
  | 'throne_critical'
  | 'direct'
  | 'awakened'
  | 'done';

export interface LycorisMinionInstance {
  id: string;
  type: MinionType;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  ownedByAwakened: boolean;
  transferProcessed: boolean;
}

export interface DropEntry {
  itemId: string;
  amount: number;
  source: 'normal_minion' | 'mid_boss' | 'boss' | 'awakened_bonus';
}

export type LogType =
  | 'boss_action' | 'minion_summon' | 'minion_death'
  | 'transfer_damage' | 'player_attack' | 'direct_summon_replace'
  | 'phase_change' | 'awaken_trigger' | 'awaken_success'
  | 'simultaneous_spawn' | 'victory' | 'defeat' | 'system';

export interface BattleLogEntry {
  turn: number;
  type: LogType;
  message: string;
  color: string;
}

export interface LycorisBattleState {
  bossHp: number;
  bossMaxHp: number;
  phase: LycorisPhase;
  onThrone: boolean;
  hpThresholdReached: boolean;

  minions: LycorisMinionInstance[];
  summonCooldown: number;
  summonLock: boolean;
  pendingSummon: number;

  pendingTransferDamage: number;
  reactionLock: boolean;

  awakenEligible: boolean;
  awakened: boolean;
  simultaneousSpawnMode: boolean;
  simultaneousBossHp: number;
  simultaneousBossSpawnTriggered: boolean;

  battleEnded: boolean;
  result: 'win' | 'lose' | 'escaped' | null;
  dropcache: DropEntry[];
  achievementsGranted: string[];
  playerCount: number;

  log: BattleLogEntry[];
  turn: number;
}

// ============================================================
// ヘルパー
// ============================================================

function makeLog(turn: number, type: LogType, message: string, color: string): BattleLogEntry {
  return { turn, type, message, color };
}

let _minionCounter = 0;
function createMinion(type: MinionType, ownedByAwakened: boolean): LycorisMinionInstance {
  const hpMap: Record<MinionType, number> = {
    vision: 30,
    evocator_x: 45,
    zombie_pigman_y: 50,
  };
  const hp = hpMap[type] ?? 30;
  return {
    id: `minion_${Date.now()}_${_minionCounter++}`,
    type,
    hp,
    maxHp: hp,
    isAlive: true,
    ownedByAwakened,
    transferProcessed: false,
  };
}

function getCurrentPhaseDef(state: LycorisBattleState): LycorisPhaseDefinition {
  const def = state.awakened ? LYCORIS_AWAKENED_DEF : LYCORIS_DEF;
  if (state.awakened) return def.phases[0];
  if (state.phase === 'direct') return def.phases[1];
  return def.phases[0];
}

function rollDropTable(
  table: { itemId: string; baseRate: number; min: number; max: number }[],
  rng: () => number
): { itemId: string; amount: number }[] {
  const results: { itemId: string; amount: number }[] = [];
  for (const entry of table) {
    if (rng() < entry.baseRate) {
      const amount = entry.min + Math.floor(rng() * (entry.max - entry.min + 1));
      results.push({ itemId: entry.itemId, amount });
    }
  }
  return results;
}

// ============================================================
// 初期化
// ============================================================

export function initLycorisBattle(playerCount = 1, _rng: () => number = Math.random): LycorisBattleState {
  const maxHp = LYCORIS_DEF.maxHp + (playerCount > 1 ? LYCORIS_DEF.hpPerPlayer! * (playerCount - 1) : 0);
  const initialMinions: LycorisMinionInstance[] = Array.from(
    { length: LYCORIS_DEF.initialSummonCount },
    () => createMinion('vision', false)
  );
  return {
    bossHp: maxHp,
    bossMaxHp: maxHp,
    phase: 'throne',
    onThrone: true,
    hpThresholdReached: false,
    minions: initialMinions,
    summonCooldown: LYCORIS_DEF.phases[0].summonCooldown,
    summonLock: false,
    pendingSummon: 0,
    pendingTransferDamage: 0,
    reactionLock: false,
    awakenEligible: false,
    awakened: false,
    simultaneousSpawnMode: false,
    simultaneousBossHp: 0,
    simultaneousBossSpawnTriggered: false,
    battleEnded: false,
    result: null,
    dropcache: [],
    achievementsGranted: [],
    playerCount,
    log: [makeLog(0, 'system', '💮 Lycorisが玉座に座している', '#cc88ff')],
    turn: 1,
  };
}

// ============================================================
// 詰み防止: 緊急再召喚
// ============================================================

function guaranteeMinion(state: LycorisBattleState): LycorisBattleState {
  const alive = state.minions.filter(m => m.isAlive);
  if (alive.length === 0 && !state.battleEnded) {
    const type: MinionType = state.awakened ? 'evocator_x' : 'vision';
    const newMinion = createMinion(type, state.awakened);
    const log = makeLog(state.turn, 'minion_summon', '✨ 眷属の残滓が集まり、新たな眷属が現れた...', '#aa66ff');
    return { ...state, minions: [...state.minions, newMinion], log: [...state.log, log] };
  }
  return state;
}

// ============================================================
// 眷属撃破 + 転送ダメージ
// ============================================================

export function processMinionDeaths(state: LycorisBattleState): LycorisBattleState {
  const deadMinions = state.minions.filter(m => m.hp <= 0 && !m.transferProcessed);
  if (deadMinions.length === 0) return state;

  const def = state.awakened ? LYCORIS_AWAKENED_DEF : LYCORIS_DEF;
  const transferMult = state.playerCount === 1 ? (def.soloTransferMult ?? 1.5) : 1.0;
  const totalTransfer = deadMinions.length * def.transferDamagePerMinion * transferMult;

  const updatedMinions = state.minions.map(m =>
    deadMinions.find(d => d.id === m.id)
      ? { ...m, transferProcessed: true, isAlive: false }
      : m
  );

  const newBossHp = Math.max(0, state.bossHp - totalTransfer);
  const deathLogs = deadMinions.map(m =>
    makeLog(state.turn, 'minion_death', `💀 ${m.type} を撃破した！`, '#ffaa33')
  );
  const transferLog = makeLog(state.turn, 'transfer_damage',
    `⚡ Lycorisに${totalTransfer}の転送ダメージ！（HP: ${newBossHp}/${state.bossMaxHp}）`, '#ff6600');

  return {
    ...state,
    minions: updatedMinions,
    bossHp: newBossHp,
    pendingTransferDamage: 0,
    log: [...state.log, ...deathLogs, transferLog],
  };
}

// ============================================================
// 玉座中の直接攻撃処理
// ============================================================

export function handleBossDirectAttack(state: LycorisBattleState, damage: number): LycorisBattleState {
  if (!state.onThrone) {
    return { ...state, bossHp: Math.max(0, state.bossHp - damage) };
  }
  const log = makeLog(state.turn, 'direct_summon_replace',
    '🛡️ 玉座の加護が弾く——その代わり眷属が増えた！', '#ff9900');
  return { ...state, pendingSummon: state.pendingSummon + 1, log: [...state.log, log] };
}

// ============================================================
// 召喚処理
// ============================================================

export function processSummon(state: LycorisBattleState): LycorisBattleState {
  if (state.summonLock) return state;
  if (state.summonCooldown > 0 && state.pendingSummon === 0) return state;

  const phaseDef = getCurrentPhaseDef(state);
  const alive = state.minions.filter(m => m.isAlive);
  const slots = phaseDef.minionMaxCount - alive.length;
  const toSummon = Math.max(state.pendingSummon, state.summonCooldown === 0 ? 1 : 0);
  const actualSummon = Math.min(toSummon, slots);

  if (actualSummon <= 0) return { ...state, pendingSummon: 0 };

  const newMinions = Array.from({ length: actualSummon }, () =>
    createMinion(phaseDef.minionDef, state.awakened)
  );

  const log = makeLog(state.turn, 'minion_summon', `💮 眷属が${actualSummon}体現れた！`, '#aa66ff');
  return {
    ...state,
    minions: [...state.minions, ...newMinions],
    pendingSummon: 0,
    summonCooldown: phaseDef.summonCooldown,
    summonLock: true,
    log: [...state.log, log],
  };
}

// ============================================================
// フェーズ遷移チェック
// ============================================================

function checkPhaseTransition(state: LycorisBattleState): LycorisBattleState {
  if (state.hpThresholdReached || state.awakened) return state;
  if (state.bossHp <= state.bossMaxHp * 0.5) {
    const log = makeLog(state.turn, 'phase_change',
      '👑 Lycorisが玉座から立ち上がろうとしている...！', '#ffcc44');
    return { ...state, phase: 'throne_critical', hpThresholdReached: true, log: [...state.log, log] };
  }
  return state;
}

// ============================================================
// 覚醒抽選
// ============================================================

export function processAwakenRoll(state: LycorisBattleState, rng: () => number): LycorisBattleState {
  if (!state.awakenEligible || state.awakened) return state;

  const rollLog = makeLog(state.turn, 'awaken_trigger', '🎲 覚醒の抽選が行われている...', '#cc88ff');
  const success = rng() < LYCORIS_DEF.awakenRate;

  if (!success) {
    return {
      ...state,
      awakenEligible: false,
      result: 'win',
      battleEnded: true,
      log: [...state.log, rollLog, makeLog(state.turn, 'awaken_trigger', '✨ 静寂が戻る。Lycorisは倒れた。', '#aaaaff')],
    };
  }

  const initialMinions = Array.from({ length: LYCORIS_AWAKENED_DEF.initialSummonCount }, (_, i) =>
    createMinion(i % 2 === 0 ? 'evocator_x' : 'zombie_pigman_y', true)
  );

  return {
    ...state,
    awakenEligible: false,
    awakened: true,
    phase: 'awakened',
    onThrone: false,
    bossHp: LYCORIS_AWAKENED_DEF.maxHp,
    bossMaxHp: LYCORIS_AWAKENED_DEF.maxHp,
    minions: initialMinions,
    summonCooldown: LYCORIS_AWAKENED_DEF.phases[0].summonCooldown,
    hpThresholdReached: false,
    log: [...state.log, rollLog,
      makeLog(state.turn, 'awaken_success', '🌑 ——目が覚める。彼岸花が黒く染まっていく。覚醒Lycorisが現れた！', '#9900cc')],
  };
}

// ============================================================
// ドロップ処理
// ============================================================

export function collectDrops(state: LycorisBattleState, rng: () => number): DropEntry[] {
  if (state.dropcache.some(d => d.source === 'boss')) return state.dropcache;

  const newDrops = rollDropTable(LYCORIS_DROP_TABLE.boss_normal, rng).map(d => ({
    ...d, source: 'boss' as const,
  }));

  if (state.awakened) {
    const awakenDrops = rollDropTable(LYCORIS_DROP_TABLE.boss_awakened_bonus, rng).map(d => ({
      ...d, source: 'awakened_bonus' as const,
    }));
    return [...state.dropcache, ...newDrops, ...awakenDrops];
  }

  return [...state.dropcache, ...newDrops];
}

// ============================================================
// ターン末尾処理
// ============================================================

export function endTurn(state: LycorisBattleState, rng: () => number = Math.random): LycorisBattleState {
  if (state.battleEnded) return state;

  // 眷属死亡 + 転送
  let s = processMinionDeaths(state);

  // 死亡眷属を配列から削除
  s = { ...s, minions: s.minions.filter(m => m.isAlive) };

  // HP閾値チェック
  s = checkPhaseTransition(s);

  // 覚醒or勝利判定
  if (s.bossHp <= 0 && !s.battleEnded) {
    s = { ...s, awakenEligible: true };
    s = processAwakenRoll(s, rng);
  }

  // 覚醒後同時湧き
  if (s.awakened && !s.simultaneousBossSpawnTriggered && s.bossHp <= s.bossMaxHp * 0.5) {
    s = {
      ...s,
      simultaneousBossSpawnTriggered: true,
      simultaneousSpawnMode: true,
      simultaneousBossHp: LYCORIS_DEF.maxHp * 0.5,
      log: [...s.log, makeLog(s.turn, 'simultaneous_spawn', '👥 Lycorisの幻が戦場に現れた！過去の自分が攻撃を仕掛けてくる！', '#ff88cc')],
    };
  }

  // 召喚処理
  s = processSummon(s);

  // 詰み防止
  s = guaranteeMinion(s);

  // throne_critical → direct への遷移（次ターン冒頭）
  if (s.phase === 'throne_critical') {
    s = {
      ...s,
      phase: 'direct',
      onThrone: false,
      log: [...s.log, makeLog(s.turn, 'phase_change', '💢 Lycorisが玉座を降り、直接攻撃を仕掛けてくる！', '#ff4444')],
    };
  }

  // ターン内一時フラグリセット
  s = {
    ...s,
    summonCooldown: Math.max(0, s.summonCooldown - 1),
    summonLock: false,
    reactionLock: false,
    pendingSummon: 0,
    turn: s.turn + 1,
  };

  return s;
}

// ============================================================
// 再接続時の状態復元
// ============================================================

export function restoreLycorisBattle(raw: LycorisBattleState): LycorisBattleState {
  return {
    ...raw,
    summonLock: false,
    reactionLock: false,
    pendingTransferDamage: 0,
    pendingSummon: 0,
  };
}
