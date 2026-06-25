// src/systems/ffBattleSystem.ts
// フリーフィールド専用バトルシステム
// 2D ターン制バトル。向き・前方・背後依存は使用しない。
// 座標・範囲・ターン・確率・設置・ワープで表現する。

import {
  FFGG_ENCOUNTER_TABLE,
  FFGG_ALL_ENEMIES,
} from '../data/ffggMaster';
import { ITEM_MASTER } from '../data/masters';
import type { FFGGEnemyDefinition } from '../types/ffgg';
import type { FFBattleSession, FFBattleEnemy, FreeFieldHarvestNode, FFHarvestResult } from '../types/freefield';

// ============================================================
// 乱数ヘルパー
// ============================================================
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollChance(rate: number): boolean {
  return Math.random() < rate;
}

// ============================================================
// 戦闘トリガー敵を生成
// ============================================================
export function createTriggerEnemy(encounterProfileId: string): FFBattleEnemy | null {
  const profile = FFGG_ENCOUNTER_TABLE[encounterProfileId];
  if (!profile) return null;

  const triggerId = profile.triggerEnemyId;
  if (!triggerId) return null;

  const def = FFGG_ALL_ENEMIES[triggerId];
  if (!def) return null;

  return enemyDefToInstance(def);
}

// ============================================================
// スポーン敵を生成（トリガー撃破後）
// ============================================================
export function spawnEnemiesAfterTrigger(
  encounterProfileId: string,
  _nodeId: string,
): FFBattleEnemy[] {
  const profile = FFGG_ENCOUNTER_TABLE[encounterProfileId];
  if (!profile) return [];

  const result: FFBattleEnemy[] = [];

  // ── ボス出現チェック（bossId があれば低確率で出現）
  if (profile.bossId) {
    const bossDef = FFGG_ALL_ENEMIES[profile.bossId];
    if (bossDef && rollChance(0.15)) {
      result.push(enemyDefToInstance(bossDef));
      return result; // ボスが出たら他は出さない
    }
  }

  // ── 中ボス出現チェック（midBossId があれば中確率で出現）
  if (profile.midBossId) {
    const midDef = FFGG_ALL_ENEMIES[profile.midBossId];
    if (midDef && rollChance(0.30)) {
      result.push(enemyDefToInstance(midDef));
      // 中ボス＋通常敵を少数追加
      const pool = profile.normalEnemyIds.filter(id => {
        const d = FFGG_ALL_ENEMIES[id] as FFGGEnemyDefinition & { isBoss?: boolean; isMidBoss?: boolean };
        return d && !d.isBoss && !d.isMidBoss;
      });
      const extraCount = randInt(1, Math.min(3, profile.maxGroupSize));
      for (let i = 0; i < extraCount; i++) {
        const pickedId = pool[randInt(0, pool.length - 1)];
        const def = FFGG_ALL_ENEMIES[pickedId];
        if (def) result.push(enemyDefToInstance(def));
      }
      return result.slice(0, 8);
    }
  }

  // ── 通常スポーン
  const pool = profile.normalEnemyIds.filter(id => {
    const d = FFGG_ALL_ENEMIES[id] as FFGGEnemyDefinition & { isBoss?: boolean; isMidBoss?: boolean };
    return d && !d.isBoss && !d.isMidBoss;
  });
  if (!pool.length) return [];

  const maxCount = Math.min(8, profile.maxGroupSize * 2);
  const minCount = Math.min(2, maxCount);
  const count = randInt(minCount, maxCount);

  for (let i = 0; i < count; i++) {
    const pickedId = pool[randInt(0, pool.length - 1)];
    const def = FFGG_ALL_ENEMIES[pickedId];
    if (def) result.push(enemyDefToInstance(def));
  }

  return result.slice(0, 8);
}

// ============================================================
// 敵定義からバトルインスタンスを生成
// ============================================================
function enemyDefToInstance(def: FFGGEnemyDefinition): FFBattleEnemy {
  return {
    defId: def.id,
    name: def.name,
    hp: def.maxHp,
    maxHp: def.maxHp,
    attack: def.attack,
    defense: def.defense,
    drops: def.drops,
  };
}

// ============================================================
// バトルセッション初期化
// ============================================================
export function initFFBattleSession(params: {
  nodeId: string;
  areaId: string;
  encounterProfileId: string;
  playerHp: number;
  playerMaxHp: number;
}): FFBattleSession | null {
  const trigger = createTriggerEnemy(params.encounterProfileId);
  if (!trigger) return null;

  return {
    nodeId: params.nodeId,
    areaId: params.areaId,
    encounterProfileId: params.encounterProfileId,
    phase: 'trigger',
    triggerEnemyId: trigger.defId,
    triggerEnemyHp: trigger.hp,
    triggerEnemyMaxHp: trigger.maxHp,
    spawnedEnemies: [],
    currentEnemyIdx: 0,
    log: [`⚔️ 戦闘トリガー「${trigger.name}」が現れた！`],
    playerHp: params.playerHp,
    playerMaxHp: params.playerMaxHp,
    turn: 'player',
    result: null,
    drops: [],
    expGained: 0,
    goldGained: 0,
  };
}

// ============================================================
// プレイヤー攻撃処理（1ターン）
// ============================================================
export function playerAttack(session: FFBattleSession, playerAttack: number): FFBattleSession {
  let s = { ...session };
  const log = [...s.log];

  if (s.turn !== 'player' || s.result) return s;

  if (s.phase === 'trigger') {
    // トリガー敵を攻撃
    const dmg = Math.max(1, playerAttack - Math.floor(20 * 0.5));
    const newHp = Math.max(0, s.triggerEnemyHp - dmg);
    log.push(`💥 ${dmg} ダメージ！（トリガー敵 HP: ${newHp}/${s.triggerEnemyMaxHp}）`);

    if (newHp <= 0) {
      // トリガー撃破 → スポーンフェーズへ
      log.push(`✅ 戦闘トリガーを撃破！`);
      const spawned = spawnEnemiesAfterTrigger(s.encounterProfileId ?? s.areaId, s.nodeId);

      if (spawned.length > 0) {
        log.push(`👾 ${spawned.length}体の敵がスポーンした！`);
        s = {
          ...s,
          triggerEnemyHp: 0,
          phase: 'spawn',
          spawnedEnemies: spawned,
          currentEnemyIdx: 0,
          log,
          turn: 'enemy',
        };
      } else {
        log.push(`💨 敵はスポーンしなかった。`);
        // トリガー撃破のドロップ
        const trigDef = FFGG_ALL_ENEMIES[s.triggerEnemyId];
        const trigDrops = collectDrops(trigDef);
        s = {
          ...s,
          triggerEnemyHp: 0,
          phase: 'done',
          log,
          result: 'win',
          drops: trigDrops.items,
          expGained: trigDef?.baseExp ?? 0,
          goldGained: trigDef?.baseGold ?? 0,
          turn: 'result',
        };
      }
    } else {
      s = { ...s, triggerEnemyHp: newHp, log, turn: 'enemy' };
    }
  } else if (s.phase === 'spawn') {
    // スポーン済み敵を順番に攻撃
    const enemies = [...s.spawnedEnemies];
    const idx = s.currentEnemyIdx;
    if (idx >= enemies.length) {
      s = { ...s, result: 'win', phase: 'done', turn: 'result', log };
      return s;
    }

    const target = { ...enemies[idx] };
    const dmg = Math.max(1, playerAttack - Math.floor(target.defense * 0.5));
    target.hp = Math.max(0, target.hp - dmg);
    log.push(`💥 ${target.name} に ${dmg} ダメージ！（HP: ${target.hp}/${target.maxHp}）`);
    enemies[idx] = target;

    if (target.hp <= 0) {
      log.push(`💀 ${target.name} を倒した！`);
      const def = FFGG_ALL_ENEMIES[target.defId];
      if (def) {
        const dropped = collectDrops(def);
        s = {
          ...s,
          spawnedEnemies: enemies,
          log,
          drops: [...s.drops, ...dropped.items],
          expGained: s.expGained + (def.baseExp ?? 0),
          goldGained: s.goldGained + (def.baseGold ?? 0),
        };
      }

      // 次の敵へ
      const nextIdx = idx + 1;
      if (nextIdx >= enemies.length) {
        log.push(`🎉 全ての敵を倒した！`);
        s = { ...s, spawnedEnemies: enemies, currentEnemyIdx: nextIdx, result: 'win', phase: 'done', turn: 'result', log };
      } else {
        log.push(`👾 次の敵：${enemies[nextIdx].name}`);
        s = { ...s, spawnedEnemies: enemies, currentEnemyIdx: nextIdx, log, turn: 'enemy' };
      }
    } else {
      s = { ...s, spawnedEnemies: enemies, log, turn: 'enemy' };
    }
  }

  return s;
}

// ============================================================
// 敵ターン処理
// ============================================================
export function enemyTurn(session: FFBattleSession, playerDefense: number): FFBattleSession {
  let s = { ...session };
  const log = [...s.log];

  if (s.turn !== 'enemy' || s.result) return s;

  if (s.phase === 'trigger') {
    const def = FFGG_ALL_ENEMIES[s.triggerEnemyId];
    const atkPow = def?.attack ?? 20;
    const dmg = Math.max(1, atkPow - Math.floor(playerDefense * 0.5));
    const newPlayerHp = Math.max(0, s.playerHp - dmg);
    log.push(`🗡️ 戦闘トリガーの攻撃！ ${dmg} ダメージ受けた。（自HP: ${newPlayerHp}/${s.playerMaxHp}）`);

    if (newPlayerHp <= 0) {
      log.push(`💔 力尽きた...`);
      s = { ...s, playerHp: 0, result: 'lose', turn: 'result', log };
    } else {
      s = { ...s, playerHp: newPlayerHp, turn: 'player', log };
    }
  } else if (s.phase === 'spawn') {
    const enemies = s.spawnedEnemies;
    const idx = s.currentEnemyIdx;
    if (idx >= enemies.length) {
      s = { ...s, turn: 'player', log };
      return s;
    }
    const attacker = enemies[idx];
    const dmg = Math.max(1, attacker.attack - Math.floor(playerDefense * 0.5));
    const newPlayerHp = Math.max(0, s.playerHp - dmg);
    log.push(`🗡️ ${attacker.name} の攻撃！ ${dmg} ダメージ受けた。（自HP: ${newPlayerHp}/${s.playerMaxHp}）`);

    if (newPlayerHp <= 0) {
      log.push(`💔 力尽きた...`);
      s = { ...s, playerHp: 0, result: 'lose', turn: 'result', log };
    } else {
      s = { ...s, playerHp: newPlayerHp, turn: 'player', log };
    }
  }

  return s;
}

// ============================================================
// 逃げる処理
// ============================================================
export function tryEscape(session: FFBattleSession): FFBattleSession {
  const escapeChance = 0.60;
  const escaped = rollChance(escapeChance);
  const log = [...session.log];

  if (escaped) {
    log.push(`💨 逃げた！`);
    return { ...session, result: 'escaped', turn: 'result', log };
  } else {
    log.push(`❌ 逃げられなかった！`);
    return { ...session, log, turn: 'enemy' };
  }
}

// ============================================================
// ドロップ計算
// ============================================================
function collectDrops(def: FFGGEnemyDefinition | undefined): {
  items: { itemId: string; displayName: string; amount: number }[];
} {
  if (!def) return { items: [] };

  const items: { itemId: string; displayName: string; amount: number }[] = [];

  for (const drop of def.drops) {
    // 複数ドロップ（baseRate > 1.0 = 複数個確定）
    let totalAmount = 0;
    if (drop.baseRate > 1.0) {
      // 確定分
      totalAmount += Math.floor(drop.baseRate);
      // 端数は確率判定
      const remainder = drop.baseRate - Math.floor(drop.baseRate);
      if (rollChance(remainder)) totalAmount += 1;
    } else {
      if (rollChance(drop.baseRate)) {
        totalAmount = randInt(drop.minAmount, drop.maxAmount);
      }
    }

    if (totalAmount > 0) {
      items.push({
        itemId: drop.itemId,
        displayName: ITEM_MASTER[drop.itemId]?.name ?? drop.itemId,
        amount: totalAmount,
      });
    }
  }

  return { items };
}

// ============================================================
// FF専用採集処理
// ============================================================


export function executeFFHarvest(
  harvestNode: FreeFieldHarvestNode,
  _playerId: string,
): FFHarvestResult {
  const items: { itemId: string; displayName: string; amount: number }[] = [];

  for (const item of harvestNode.items) {
    if (rollChance(item.baseRate)) {
      const amount = randInt(item.minAmount, item.maxAmount);
      items.push({ itemId: item.itemId, displayName: item.displayName, amount });
    }
  }

  // 戦闘割り込み判定（危険度が高いほど割り込み確率UP）
  const danger = harvestNode.dangerLevel ?? 1;
  const combatChance = (danger - 1) * 0.1; // 危険度1=0%, 2=10%, 3=20%, 4=30%, 5=40%
  const triggeredCombat = rollChance(combatChance);

  const itemsDesc = items.length > 0
    ? items.map(i => `${i.displayName}×${i.amount}`).join('、')
    : 'なし';

  return {
    nodeId: harvestNode.id,
    items,
    triggeredCombat,
    message: items.length > 0
      ? `採集成功！ 入手: ${itemsDesc}${triggeredCombat ? '\n⚠️ 採集中に敵が出現した！' : ''}`
      : `採集したが何も見つからなかった。${triggeredCombat ? '\n⚠️ 採集中に敵が出現した！' : ''}`,
  };
}
