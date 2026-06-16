// src/systems/ffggBattle.ts
// FFGG フリーフィールド 戦闘システム
// ※ 既存ダンジョン戦闘 (DungeonScreen / TurnBattle) とは独立したロジック
// ※ 向き/前方/背後依存は一切使用しない（2D ターン制）
// ※ Firebase 書き込みはドロップ確定時のみ（低頻度）

import {
  FFGG_ALL_ENEMIES,
  FFGG_FEVER_DEFINITIONS,
  FFGG_ENCOUNTER_TABLE,
} from '../data/ffggMaster';
import type {
  FFGGEnemyDefinition,
  FFGGEnemyInstance,
  EnemySkillDefinition,
  FFGGFeverState,
  FFGGDropEntry,
} from '../types/ffgg';

// ============================================================
// 乱数ユーティリティ（Math.random ベース、既存 random.ts 参照不要）
// ============================================================
const rng = () => Math.random();
const rndInt = (n: number) => Math.floor(rng() * n);
const rndRange = (min: number, max: number) => min + rndInt(max - min + 1);
const chance = (p: number) => rng() < p;

// ============================================================
// 敵インスタンス生成
// ============================================================
export function createFFGGEnemyInstance(defId: string): FFGGEnemyInstance | null {
  const def = FFGG_ALL_ENEMIES[defId];
  if (!def) return null;
  return {
    defId,
    hp: def.maxHp,
    maxHp: def.maxHp,
    zoneTurnsActive: 0,
    currentPhaseIdx: 0,
    counterUsedThisTurn: false,
  };
}

// ============================================================
// エリアのエンカウンターを生成する
// ── 戦闘トリガー型の場合：最初にトリガー敵 1 体のみ出現
// ── 通常の場合：ランダムに 1〜maxGroupSize 体選出
// ============================================================
export function spawnFFGGEncounter(
  areaId: string,
  triggerMode: boolean
): FFGGEnemyInstance[] {
  const profile = FFGG_ENCOUNTER_TABLE[areaId];
  if (!profile) return [];

  if (triggerMode && profile.triggerEnemyId) {
    const inst = createFFGGEnemyInstance(profile.triggerEnemyId);
    return inst ? [inst] : [];
  }

  const pool = profile.normalEnemyIds;
  if (pool.length === 0) return [];

  const count = rndRange(1, Math.min(pool.length, profile.maxGroupSize));
  const result: FFGGEnemyInstance[] = [];
  for (let i = 0; i < count; i++) {
    const id = pool[rndInt(pool.length)];
    const inst = createFFGGEnemyInstance(id);
    if (inst) result.push(inst);
  }
  return result;
}

// ============================================================
// ボス / 中ボスのスポーン
// ============================================================
export function spawnFFGGBoss(areaId: string, midBoss = false): FFGGEnemyInstance | null {
  const profile = FFGG_ENCOUNTER_TABLE[areaId];
  if (!profile) return null;
  const id = midBoss ? profile.midBossId : profile.bossId;
  if (!id) return null;
  return createFFGGEnemyInstance(id);
}

// ============================================================
// フィーバー初期化
// ============================================================
export function initFever(feverId: string): FFGGFeverState | null {
  const def = FFGG_FEVER_DEFINITIONS[feverId];
  if (!def) return null;
  return {
    active: true,
    feverId,
    wavesRemaining: def.maxWaves,
    dropMult: def.dropMult,
    expMult: def.expMult,
    goldMult: def.goldMult,
  };
}

// フィーバー中のウェーブスポーン
export function spawnFeverWave(feverId: string): FFGGEnemyInstance[] {
  const def = FFGG_FEVER_DEFINITIONS[feverId];
  if (!def) return [];
  const result: FFGGEnemyInstance[] = [];
  for (let i = 0; i < def.enemiesPerWave; i++) {
    const id = def.weakEnemyIds[rndInt(def.weakEnemyIds.length)];
    const inst = createFFGGEnemyInstance(id);
    if (inst) {
      // フィーバー敵は弱体化（HP 40%）
      inst.hp = Math.max(1, Math.floor(inst.maxHp * 0.4));
      inst.maxHp = inst.hp;
      result.push(inst);
    }
  }
  return result;
}

// ============================================================
// フィーバー発生チェック（エリアプロファイルの確率で発火）
// ============================================================
export function rollFeverChance(areaId: string): string | null {
  const profile = FFGG_ENCOUNTER_TABLE[areaId];
  if (!profile || !profile.feverChance) return null;
  if (!chance(profile.feverChance)) return null;

  // エリアごとに偏ったフィーバーを返す
  const feverByArea: Record<string, string> = {
    ffgg_forest:  'gold_fever',
    ffgg_plain:   'red_fever',
    ffgg_desert:  'gold_fever',
    ffgg_snow:    'gold_fever',
    ffgg_savanna: 'red_fever',
    ffgg_pirate:  'gold_fever',
  };
  // 平地・森 → dragon_fever も低確率で
  if (areaId === 'ffgg_plain' && chance(0.2)) return 'dragon_fever';
  if (areaId === 'ffgg_savanna' && chance(0.15)) return 'dragon_fever';
  return feverByArea[areaId] ?? 'gold_fever';
}

// ============================================================
// 1 ターン分の敵行動を決定する（スキル選択）
// ── 座標・距離・範囲ベース（向き依存なし）
// ============================================================
export function decideEnemySkill(
  instance: FFGGEnemyInstance
): EnemySkillDefinition {
  const def = FFGG_ALL_ENEMIES[instance.defId];
  if (!def || def.skills.length === 0) {
    return { id: 'normal', name: '通常攻撃', type: 'single', damageMult: 1.0 };
  }

  const hpRatio = instance.hp / instance.maxHp;

  // フェーズ変化チェック（ボスのみ）
  const bossSkillIds = (() => {
    const bossAny = def as any;
    if (!bossAny.phases) return null;
    for (let i = bossAny.phases.length - 1; i >= 0; i--) {
      if (hpRatio <= bossAny.phases[i].hpThreshold) {
        return bossAny.phases[i].activeSkillIds ?? null;
      }
    }
    return null;
  })();

  // HP しきい値フィルタ + フェーズフィルタ
  const available = def.skills.filter(s => {
    if (s.hpThreshold !== undefined && hpRatio > s.hpThreshold) return false;
    if (s.type === 'phase_change') return false;
    if (bossSkillIds && !bossSkillIds.includes(s.id)) return false;
    return true;
  });

  if (available.length === 0) {
    return { id: 'normal', name: '通常攻撃', type: 'single', damageMult: 1.0 };
  }

  // 確率ルーレット
  // useChance が設定されているスキルを優先的に選ぶ
  for (const skill of available) {
    if (skill.useChance !== undefined && chance(skill.useChance)) {
      return skill;
    }
  }

  // フォールバック: 最初のスキル（通常攻撃扱い）
  return available[0];
}

// ============================================================
// ダメージ計算（FFGG 専用）
// playerDef: プレイヤー防御力相当値
// ============================================================
export function calcFFGGEnemyDamage(
  skill: EnemySkillDefinition,
  enemyDef: FFGGEnemyDefinition,
  playerDef: number,
  feverState?: FFGGFeverState
): number {
  const baseAtk = enemyDef.attack;
  const raw = Math.max(1, baseAtk * skill.damageMult - playerDef * 0.5);
  const variance = raw * 0.15;
  let dmg = Math.floor(raw + (rng() - 0.5) * variance);

  // フィーバー中の敵は弱体化（ダメージ 50%）
  if (feverState?.active) dmg = Math.floor(dmg * 0.5);

  return Math.max(1, dmg);
}

// ============================================================
// ドロップロール（FFGG 専用）
// ============================================================
export function rollFFGGDrops(
  drops: FFGGDropEntry[],
  dropMult = 1.0
): { itemId: string; amount: number }[] {
  const result: { itemId: string; amount: number }[] = [];
  for (const d of drops) {
    const rate = Math.min(1, d.baseRate * dropMult);
    if (chance(rate)) {
      const amount = rndRange(d.minAmount, d.maxAmount);
      result.push({ itemId: d.itemId, amount });
    }
  }
  return result;
}

// ============================================================
// 被弾反撃の発動判定
// ============================================================
export function checkCounterAttack(
  instance: FFGGEnemyInstance
): EnemySkillDefinition | null {
  if (instance.counterUsedThisTurn) return null;
  const def = FFGG_ALL_ENEMIES[instance.defId];
  if (!def) return null;
  const counterSkill = def.skills.find(s => s.type === 'counter');
  if (!counterSkill) return null;
  if (counterSkill.useChance === undefined || chance(counterSkill.useChance)) {
    return counterSkill;
  }
  return null;
}

// ============================================================
// 危険地帯ダメージ（毎ターン開始時に発動）
// ============================================================
export function tickZoneDamage(
  instance: FFGGEnemyInstance,
  playerDef: number
): { damage: number; zoneTurnsRemaining: number } {
  if (instance.zoneTurnsActive <= 0) return { damage: 0, zoneTurnsRemaining: 0 };
  const def = FFGG_ALL_ENEMIES[instance.defId];
  const zoneSkill = def?.skills.find(s => s.type === 'place_zone');
  const dmg = zoneSkill
    ? Math.max(1, Math.floor(def!.attack * zoneSkill.damageMult * 0.5 - playerDef * 0.3))
    : 0;
  return { damage: dmg, zoneTurnsRemaining: instance.zoneTurnsActive - 1 };
}

// ============================================================
// 召喚スキル処理：返すのは追加インスタンス
// ============================================================
export function processSummonSkill(
  skill: EnemySkillDefinition
): FFGGEnemyInstance[] {
  if (skill.type !== 'summon' || !skill.summonIds) return [];
  const result: FFGGEnemyInstance[] = [];
  for (const id of skill.summonIds) {
    const inst = createFFGGEnemyInstance(id);
    if (inst) result.push(inst);
  }
  return result;
}

// ============================================================
// 自己回復処理
// ============================================================
export function processHealSelf(
  instance: FFGGEnemyInstance,
  skill: EnemySkillDefinition
): number {
  if (skill.type !== 'heal_self') return instance.hp;
  const def = FFGG_ALL_ENEMIES[instance.defId];
  if (!def) return instance.hp;
  const healAmt = Math.floor(def.maxHp * (skill.healPct ?? 0.1));
  return Math.min(def.maxHp, instance.hp + healAmt);
}

// ============================================================
// バフ解除スキルが使われたか判定
// ============================================================
export function isBuffDispel(skill: EnemySkillDefinition): boolean {
  return skill.type === 'buff_dispel' || !!skill.dispelsBuff;
}

// ============================================================
// 敵の EXP・ゴールド（フィーバー倍率適用）
// ============================================================
export function getFFGGEnemyRewards(
  defId: string,
  feverState?: FFGGFeverState
): { exp: number; gold: number } {
  const def = FFGG_ALL_ENEMIES[defId];
  if (!def) return { exp: 0, gold: 0 };
  const em = feverState?.expMult ?? 1.0;
  const gm = feverState?.goldMult ?? 1.0;
  return {
    exp:  Math.floor(def.baseExp  * em),
    gold: Math.floor(def.baseGold * gm),
  };
}

// ============================================================
// ヘルパー: 敵定義を ID で取得
// ============================================================
export function getFFGGEnemyDef(id: string): FFGGEnemyDefinition | undefined {
  return FFGG_ALL_ENEMIES[id];
}

// ============================================================
// ヘルパー: フィーバー定義を ID で取得
// ============================================================
export function getFFGGFeverDef(id: string) {
  return FFGG_FEVER_DEFINITIONS[id];
}
