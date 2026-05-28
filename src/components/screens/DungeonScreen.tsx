// src/components/screens/DungeonScreen.tsx
// ダンジョン・PvE画面：モンスターと戦うシステム。

import { useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { DUNGEON_MASTER, MONSTER_MASTER, ITEM_MASTER } from '../../data/masters';
import type { MonsterMaster, CombatResult, CombatTurn } from '../../types/game';

// ============================================================
// === 戦闘ロジック（純粋関数） ===
// ============================================================

interface CombatState {
  monsterHp: number;
  playerHp: number;
}

function calcDamage(attack: number, defense: number): number {
  const base = Math.max(1, attack - defense);
  const variance = Math.floor(base * 0.2);
  return base + Math.floor(Math.random() * (variance + 1));
}

function calcDrops(monster: MonsterMaster, combatSkillLevel: number) {
  return monster.drops
    .filter((drop) => {
      const rate = Math.min(1.0, drop.baseRate + (drop.skillRateBonus ?? 0) * combatSkillLevel * 0.01);
      return Math.random() < rate;
    })
    .map((drop) => ({
      itemId: drop.itemId,
      amount: drop.minAmount + Math.floor(Math.random() * (drop.maxAmount - drop.minAmount + 1)),
    }));
}

/**
 * 戦闘をシミュレートし、全ターンの結果を返す。
 * 最大50ターンで強制終了（無限ループ防止）。
 */
function simulateCombat(
  playerAtk: number,
  playerDef: number,
  playerHp: number,
  monster: MonsterMaster,
  combatSkillLevel: number
): CombatResult {
  const turns: CombatTurn[] = [];
  let state: CombatState = { monsterHp: monster.maxHp, playerHp };
  const MAX_TURNS = 50;

  for (let i = 0; i < MAX_TURNS; i++) {
    // プレイヤーの攻撃
    const playerDmg = calcDamage(playerAtk, monster.defense);
    state.monsterHp = Math.max(0, state.monsterHp - playerDmg);

    let turn: CombatTurn = {
      playerDamage: playerDmg,
      monsterDamage: 0,
      playerHpAfter: state.playerHp,
      monsterHpAfter: state.monsterHp,
      log: `あなたは ${monster.name} に ${playerDmg} のダメージ！`,
    };

    if (state.monsterHp <= 0) {
      turns.push(turn);
      break;
    }

    // モンスターの反撃
    const monsterDmg = calcDamage(monster.attack, playerDef);
    state.playerHp = Math.max(0, state.playerHp - monsterDmg);

    turn = {
      ...turn,
      monsterDamage: monsterDmg,
      playerHpAfter: state.playerHp,
      log: turn.log + ` ${monster.name} の反撃で ${monsterDmg} ダメージを受けた！`,
    };
    turns.push(turn);

    if (state.playerHp <= 0) break;
  }

  const victory = state.monsterHp <= 0;
  const drops = victory ? calcDrops(monster, combatSkillLevel) : [];
  const expGained = victory
    ? Math.floor(monster.baseExp * (1 + combatSkillLevel * 0.01))
    : 0;
  const goldGained = victory
    ? Math.floor(monster.baseGold * (0.8 + Math.random() * 0.4))
    : 0;

  return { victory, turns, expGained, goldGained, drops };
}

// ============================================================
// === ダンジョン画面 ===
// ============================================================
export function DungeonScreen() {
  const player = useGameStore((s) => s.player);
  const changeHp = useGameStore((s) => s.changeHp);
  const addItems = useGameStore((s) => s.addItems);
  const changeGold = useGameStore((s) => s.changeGold);
  const addExp = useGameStore((s) => s.addExp);
  const addSkillExp = useGameStore((s) => s.addSkillExp);
  const addNotification = useGameStore((s) => s.addNotification);

  const [selectedDungeonId, setSelectedDungeonId] = useState<string | null>(null);
  const [result, setResult] = useState<CombatResult | null>(null);
  const [isFighting, setIsFighting] = useState(false);

  const dungeons = Object.values(DUNGEON_MASTER);

  const handleFight = useCallback(() => {
    if (!player || !selectedDungeonId) return;
    const dungeon = DUNGEON_MASTER[selectedDungeonId];
    if (!dungeon) return;

    if (player.stats.level < dungeon.requiredLevel) {
      addNotification('warning', `Lv.${dungeon.requiredLevel} 以上が必要です`);
      return;
    }

    if (player.stats.hp <= 0) {
      addNotification('error', 'HPが0です。回復薬を使うか休憩してください。');
      return;
    }

    setIsFighting(true);

    // ランダムにモンスターを選択
    const monsterId = dungeon.monsterIds[Math.floor(Math.random() * dungeon.monsterIds.length)];
    const monster = MONSTER_MASTER[monsterId];
    const combatSkillLevel = player.skillLevels['combat'] ?? 1;

    const combatResult = simulateCombat(
      player.stats.attack,
      player.stats.defense,
      player.stats.hp,
      monster,
      combatSkillLevel
    );

    // State に反映
    const lastTurn = combatResult.turns[combatResult.turns.length - 1];
    if (lastTurn) {
      changeHp(lastTurn.playerHpAfter - player.stats.hp);
    }

    if (combatResult.victory) {
      addExp(combatResult.expGained);
      addSkillExp('combat', Math.floor(combatResult.expGained / 2));
      changeGold(combatResult.goldGained);
      addItems(combatResult.drops);
    }

    setResult(combatResult);
    setIsFighting(false);
  }, [player, selectedDungeonId, changeHp, addExp, addSkillExp, changeGold, addItems, addNotification]);

  return (
    <div className="screen dungeon-screen">
      <h2 className="screen-title">⚔️ ダンジョン</h2>

      {/* ダンジョン選択 */}
      <div className="dungeon-list">
        {dungeons.map((dungeon) => {
          const isUnlocked = (player?.stats.level ?? 1) >= dungeon.requiredLevel;
          return (
            <button
              key={dungeon.id}
              className={`dungeon-card ${selectedDungeonId === dungeon.id ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`}
              onClick={() => isUnlocked && setSelectedDungeonId(dungeon.id)}
            >
              <span className="dungeon-icon">{dungeon.icon}</span>
              <div className="dungeon-info">
                <span className="dungeon-name">{dungeon.name}</span>
                <span className="dungeon-level">必要Lv.{dungeon.requiredLevel}</span>
              </div>
              {!isUnlocked && <span className="lock-badge">🔒</span>}
            </button>
          );
        })}
      </div>

      {/* 戦闘ボタン */}
      {selectedDungeonId && (
        <div className="combat-area">
          <h3>{DUNGEON_MASTER[selectedDungeonId]?.name} に挑戦</h3>
          <button
            className="fight-btn"
            onClick={handleFight}
            disabled={isFighting}
          >
            {isFighting ? '⚔️ 戦闘中...' : '⚔️ 戦闘開始'}
          </button>
        </div>
      )}

      {/* 戦闘結果 */}
      {result && (
        <div className={`combat-result ${result.victory ? 'victory' : 'defeat'}`}>
          <h3>{result.victory ? '🏆 勝利！' : '💀 敗北...'}</h3>
          {result.victory && (
            <div className="result-rewards">
              <p>✨ 経験値: +{result.expGained}</p>
              <p>💰 ゴールド: +{result.goldGained}</p>
              {result.drops.map((d) => (
                <p key={d.itemId}>
                  {ITEM_MASTER[d.itemId]?.icon} {ITEM_MASTER[d.itemId]?.name} ×{d.amount}
                </p>
              ))}
            </div>
          )}
          <div className="combat-log">
            {result.turns.slice(-5).map((turn, i) => (
              <div key={i} className="combat-log-entry">{turn.log}</div>
            ))}
          </div>
          <button className="close-btn" onClick={() => setResult(null)}>閉じる</button>
        </div>
      )}
    </div>
  );
}
