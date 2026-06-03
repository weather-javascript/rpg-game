// src/components/screens/DungeonScreen.tsx
// ダンジョン画面：解放条件可視化・エリア別進行・ボス戦・空腹ペナルティ連動

import { useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { DUNGEON_MASTER, MONSTER_MASTER, ITEM_MASTER } from '../../data/masters';
import type { MonsterMaster, CombatResult, CombatTurn, DungeonRunState, DungeonMaster } from '../../types/game';

// ============================================================
// 戦闘ロジック
// ============================================================
function calcDamage(atk: number, def: number): number {
  const base = Math.max(1, atk - def);
  return base + Math.floor(Math.random() * Math.ceil(base * 0.2));
}

function calcMonsterDrops(monster: MonsterMaster, combatLv: number) {
  return monster.drops.filter(d => {
    const rate = Math.min(1, d.baseRate + (d.skillRateBonus ?? 0) * combatLv * 0.01);
    return Math.random() < rate;
  }).map(d => ({
    itemId: d.itemId,
    amount: d.minAmount + Math.floor(Math.random() * (d.maxAmount - d.minAmount + 1)),
  }));
}

function simulateCombat(
  pAtk: number, pDef: number, pHp: number,
  monster: MonsterMaster, combatLv: number,
  dungeonExpBonus: number, dungeonGoldBonus: number,
): CombatResult {
  const turns: CombatTurn[] = [];
  let mHp = monster.maxHp;
  let playerHp = pHp;
  const MAX_TURNS = 60;

  for (let i = 0; i < MAX_TURNS; i++) {
    const pDmg = calcDamage(pAtk, monster.defense);
    mHp = Math.max(0, mHp - pDmg);
    const isSpecial = monster.isBoss && Math.random() < 0.2;
    const mDmg = isSpecial
      ? Math.floor(calcDamage(monster.attack, pDef) * 1.5)
      : calcDamage(monster.attack, pDef);
    playerHp = Math.max(0, playerHp - mDmg);
    const log = `あなた→${pDmg}ダメージ。${monster.name}→${mDmg}ダメージ${isSpecial ? '（特殊攻撃！）' : ''}。`;
    turns.push({ playerDamage: pDmg, monsterDamage: mDmg, playerHpAfter: playerHp, monsterHpAfter: mHp, log, isSpecialAttack: isSpecial });
    if (mHp <= 0 || playerHp <= 0) break;
  }

  const victory = mHp <= 0;
  const drops = victory ? calcMonsterDrops(monster, combatLv) : [];
  const expGained = victory ? Math.floor(monster.baseExp * dungeonExpBonus * (1 + combatLv * 0.01)) : 0;
  const goldGained = victory ? Math.floor(monster.baseGold * dungeonGoldBonus * (0.8 + Math.random() * 0.4)) : 0;
  return { victory, turns, expGained, goldGained, drops };
}

// ============================================================
// 解放条件バッジ
// ============================================================
function UnlockBadge({ dungeon, clearedCount }: { dungeon: DungeonMaster; clearedCount: number }) {
  const uc = (dungeon as any).unlockCondition as { dungeonId: string; clearedCount: number } | undefined;
  if (!uc) return <span style={{ fontSize: '0.7rem', color: '#4caf87' }}>🔓 最初から解放</span>;

  const prereq = DUNGEON_MASTER[uc.dungeonId];
  const isUnlocked = clearedCount >= uc.clearedCount;
  const progress = Math.min(clearedCount, uc.clearedCount);

  return (
    <div style={{ marginTop: 4 }}>
      {isUnlocked ? (
        <span style={{ fontSize: '0.7rem', color: '#4caf87' }}>🔓 解放済み</span>
      ) : (
        <div>
          <div style={{ fontSize: '0.7rem', color: '#e05555', marginBottom: 3 }}>
            🔒 解放条件: {prereq?.name ?? uc.dungeonId} を {uc.clearedCount}回クリア
            （現在 {progress}/{uc.clearedCount}）
          </div>
          <div style={{ height: 4, background: '#2d3752', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#f0a830', width: `${(progress / uc.clearedCount) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ダンジョン選択カード（解放条件付き）
// ============================================================
function DungeonCard({ dungeon, selected, onSelect, playerLevel, clearedCount, isUnlocked }: {
  dungeon: DungeonMaster;
  selected: boolean;
  onSelect: () => void;
  playerLevel: number;
  clearedCount: number;
  isUnlocked: boolean;
}) {
  const meetsLevel = playerLevel >= dungeon.requiredLevel;
  // 解放済みならLv不足でもカードを選択できる（スタートボタン側でLvチェック）
  const canEnter = meetsLevel && isUnlocked;
  const canSelect = isUnlocked; // 解放済みなら選択可

  const tierColors: Record<string, string> = {
    beginner: '#4caf87', intermediate: '#5b8dee', advanced: '#f0a830',
    super: '#e05555', extreme: '#9b6df0', volcano: '#ff6b35',
  };
  const color = tierColors[dungeon.tier] ?? '#5b8dee';
  const uc = (dungeon as any).unlockCondition as { dungeonId: string; clearedCount: number } | undefined;

  return (
    <button
      onClick={() => canSelect && onSelect()}
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        background: selected ? 'rgba(91,141,238,0.15)' : '#1c2235',
        border: `2px solid ${selected ? color : canEnter ? '#2d3752' : canSelect ? 'rgba(240,168,48,0.3)' : '#1c2235'}`,
        borderRadius: 10, padding: '10px 14px', textAlign: 'left',
        color: '#e8e6ff', cursor: canSelect ? 'pointer' : 'not-allowed',
        opacity: canSelect ? 1 : 0.6, transition: 'all 0.2s', width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.8rem' }}>{dungeon.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            {dungeon.name}
            {!isUnlocked && <span style={{ fontSize: '1rem' }}>🔒</span>}
            {!meetsLevel && isUnlocked && <span style={{ fontSize: '0.7rem', color: '#e05555', background: 'rgba(224,85,85,0.15)', padding: '1px 5px', borderRadius: 4 }}>Lv不足</span>}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginTop: 2 }}>{dungeon.description}</div>
          <div style={{ fontSize: '0.7rem', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color }}>★ {dungeon.tier.toUpperCase()}</span>
            <span style={{ color: meetsLevel ? '#4caf87' : '#e05555' }}>Lv.{dungeon.requiredLevel}〜</span>
            <span style={{ color: '#f0c060' }}>EXP×{dungeon.expBonus} G×{dungeon.goldBonus}</span>
            {clearedCount > 0 && <span style={{ color: '#4caf87' }}>✓ {clearedCount}回クリア</span>}
          </div>
        </div>
      </div>
      {/* 解放条件バー */}
      <UnlockBadge dungeon={dungeon} clearedCount={uc ? (useGameStore.getState().player?.dungeonClearedCount?.[uc.dungeonId] ?? 0) : 0} />
    </button>
  );
}

// ============================================================
// 戦闘ログ
// ============================================================
function CombatLog({ result, onClose }: { result: CombatResult; onClose: () => void }) {
  return (
    <div style={{
      background: '#1c2235', border: `2px solid ${result.victory ? '#f0c060' : '#e05555'}`,
      borderRadius: 12, padding: 16, marginTop: 12,
    }}>
      <h3 style={{ color: result.victory ? '#f0c060' : '#e05555', marginBottom: 10 }}>
        {result.victory ? '🏆 勝利！' : result.escaped ? '🏃 逃走成功' : '💀 敗北...'}
      </h3>
      {result.victory && (
        <div style={{ fontSize: '0.85rem', marginBottom: 10 }}>
          <div>✨ EXP +{result.expGained}</div>
          <div>💰 +{result.goldGained}G</div>
          {result.drops.map(d => (
            <div key={d.itemId}>{ITEM_MASTER[d.itemId]?.icon} {ITEM_MASTER[d.itemId]?.name} ×{d.amount}</div>
          ))}
        </div>
      )}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 8, maxHeight: 160, overflowY: 'auto', fontSize: '0.75rem', color: '#8a92b2' }}>
        {result.turns.slice(-8).map((t, i) => (
          <div key={i} style={{ borderBottom: '1px solid #2d3752', padding: '3px 0', color: t.isSpecialAttack ? '#e05555' : '#8a92b2' }}>{t.log}</div>
        ))}
      </div>
      <button onClick={onClose} style={{ marginTop: 10, padding: '6px 20px', background: '#2d3752', color: '#e8e6ff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        閉じる
      </button>
    </div>
  );
}

// ============================================================
// メイン画面
// ============================================================
export function DungeonScreen() {
  const player = useGameStore(s => s.player);
  const changeHp = useGameStore(s => s.changeHp);
  const addItems = useGameStore(s => s.addItems);
  const changeGold = useGameStore(s => s.changeGold);
  const addExp = useGameStore(s => s.addExp);
  const addSkillExp = useGameStore(s => s.addSkillExp);
  const changeSatiety = useGameStore(s => s.changeSatiety);
  const applyHungerPenalty = useGameStore(s => s.applyHungerPenalty);
  const addNotification = useGameStore(s => s.addNotification);
  const recordDungeonClear = useGameStore(s => s.recordDungeonClear);
  const isDungeonUnlocked = useGameStore(s => s.isDungeonUnlocked);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runState, setRunState] = useState<DungeonRunState | null>(null);
  const [lastResult, setLastResult] = useState<CombatResult | null>(null);
  const [isFighting, setIsFighting] = useState(false);
  const [currentAreaIdx, setCurrentAreaIdx] = useState(0);
  const [showUnlockGuide, setShowUnlockGuide] = useState(false);

  const dungeons = Object.values(DUNGEON_MASTER);
  const lockedDungeons = dungeons.filter(d => !isDungeonUnlocked(d.id));

  const startDungeon = useCallback(() => {
    if (!player || !selectedId) return;
    const dungeon = DUNGEON_MASTER[selectedId];
    if (!dungeon || player.stats.level < dungeon.requiredLevel) {
      addNotification('warning', `Lv.${dungeon?.requiredLevel}以上が必要です`);
      return;
    }
    if (!isDungeonUnlocked(selectedId)) {
      addNotification('error', '🔒 このダンジョンはまだ解放されていません');
      return;
    }
    if (player.stats.hp <= 0) {
      addNotification('error', 'HPが0です。回復してから挑戦してください。');
      return;
    }
    setCurrentAreaIdx(0);
    setRunState({
      dungeonId: selectedId,
      currentFloor: 1,
      currentAreaName: dungeon.areas?.[0]?.name ?? 'エリア1',
      monstersDefeated: 0,
      totalExp: 0,
      totalGold: 0,
      totalDrops: [],
      isComplete: false,
      isFailed: false,
    });
    setLastResult(null);
  }, [player, selectedId, isDungeonUnlocked, addNotification]);

  const fight = useCallback(() => {
    if (!player || !runState || isFighting) return;
    const dungeon = DUNGEON_MASTER[runState.dungeonId];
    if (!dungeon) return;

    setIsFighting(true);
    applyHungerPenalty();
    changeSatiety(-3);

    let monsterId: string;
    const areas = dungeon.areas;
    if (areas && areas[currentAreaIdx]) {
      const area = areas[currentAreaIdx];
      const pool = area.monsters.flatMap(m => Array(m.count).fill(m.monsterId));
      monsterId = pool[Math.floor(Math.random() * pool.length)];
    } else {
      const pool = dungeon.monsterIds;
      monsterId = pool[Math.floor(Math.random() * pool.length)];
    }

    const monster = MONSTER_MASTER[monsterId];
    if (!monster) { setIsFighting(false); return; }

    const combatLv = player.skillLevels['combat'] ?? 1;
    const result = simulateCombat(
      player.stats.attack, player.stats.defense, player.stats.hp,
      monster, combatLv, dungeon.expBonus, dungeon.goldBonus,
    );

    const lastTurn = result.turns[result.turns.length - 1];
    if (lastTurn) changeHp(lastTurn.playerHpAfter - player.stats.hp);

    if (result.victory) {
      addExp(result.expGained);
      addSkillExp('combat', Math.floor(result.expGained / 2));
      changeGold(result.goldGained);
      addItems(result.drops);

      const newDefeated = runState.monstersDefeated + 1;
      const newExp = runState.totalExp + result.expGained;
      const newGold = runState.totalGold + result.goldGained;
      const allDrops = [...runState.totalDrops];
      for (const d of result.drops) {
        const ex = allDrops.find(x => x.itemId === d.itemId);
        if (ex) ex.amount += d.amount; else allDrops.push({ ...d });
      }

      const areaThreshold = 5;
      let nextAreaIdx = currentAreaIdx;
      let isComplete = false;
      if (newDefeated % areaThreshold === 0 && areas) {
        if (currentAreaIdx < areas.length - 1) {
          nextAreaIdx = currentAreaIdx + 1;
          addNotification('info', `✅ ${areas[nextAreaIdx].name} に進んだ！`);
          setCurrentAreaIdx(nextAreaIdx);
        } else {
          isComplete = true;
          recordDungeonClear(runState.dungeonId);
          addNotification('success', `🏆 ${dungeon.name} 攻略完了！`);
          // 解放チェック
          const justUnlocked = dungeons.find(d => {
            const ucCheck = (d as any).unlockCondition as { dungeonId: string; clearedCount: number } | undefined;
            if (!ucCheck || ucCheck.dungeonId !== runState.dungeonId) return false;
            const cleared = (player.dungeonClearedCount?.[runState.dungeonId] ?? 0) + 1;
            return cleared >= ucCheck.clearedCount;
          });
          if (justUnlocked) {
            setTimeout(() => addNotification('success', `🔓 新ダンジョン「${justUnlocked.name}」が解放されました！`), 800);
          }
        }
      }

      setRunState(prev => prev ? {
        ...prev,
        currentAreaName: areas?.[nextAreaIdx]?.name ?? prev.currentAreaName,
        monstersDefeated: newDefeated,
        totalExp: newExp,
        totalGold: newGold,
        totalDrops: allDrops,
        isComplete,
        currentFloor: Math.min(prev.currentFloor + 1, dungeon.floors),
      } : null);
    } else {
      addNotification('error', '敗北... HPが0になった。');
      setRunState(prev => prev ? { ...prev, isFailed: true } : null);
    }

    setLastResult(result);
    setIsFighting(false);
  }, [player, runState, isFighting, currentAreaIdx, dungeons, applyHungerPenalty, changeSatiety, changeHp, addExp, addSkillExp, changeGold, addItems, addNotification, recordDungeonClear]);

  const escape = useCallback(() => {
    addNotification('info', '🏃 ダンジョンから離脱した。');
    setRunState(null); setLastResult(null); setCurrentAreaIdx(0);
  }, [addNotification]);

  if (!player) return null;

  return (
    <div style={{ padding: '12px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', borderBottom: '1px solid #2d3752', paddingBottom: 8, flex: 1 }}>⚔️ ダンジョン</h2>
        {lockedDungeons.length > 0 && (
          <button
            onClick={() => setShowUnlockGuide(!showUnlockGuide)}
            style={{ padding: '5px 10px', background: '#1c2235', border: '1px solid #f0a830', color: '#f0a830', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', marginLeft: 8, flexShrink: 0 }}
          >
            🔒 解放ガイド ({lockedDungeons.length})
          </button>
        )}
      </div>

      {/* 解放ガイドパネル */}
      {showUnlockGuide && (
        <div style={{ background: '#161b26', border: '2px solid #f0a830', borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: '#f0a830', marginBottom: 8 }}>🗺️ ダンジョン解放ガイド</div>
          {dungeons.map(d => {
            const ucMap = (d as any).unlockCondition as { dungeonId: string; clearedCount: number } | undefined;
            const unlocked = isDungeonUnlocked(d.id);
            const prereq = ucMap ? DUNGEON_MASTER[ucMap.dungeonId] : null;
            const cleared = ucMap ? (player.dungeonClearedCount?.[ucMap.dungeonId] ?? 0) : 0;
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '4px 0', borderBottom: '1px solid #2d3752' }}>
                <span style={{ fontSize: '1.2rem' }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{d.name}</span>
                  {ucMap && prereq && (
                    <div style={{ fontSize: '0.72rem', color: '#8a92b2' }}>
                      ← {prereq.name}を{ucMap.clearedCount}回クリア（{cleared}/{ucMap.clearedCount}）
                    </div>
                  )}
                  {!ucMap && <div style={{ fontSize: '0.72rem', color: '#4caf87' }}>最初から解放</div>}
                </div>
                <span style={{ fontSize: '0.8rem' }}>{unlocked ? '✅' : '🔒'}</span>
              </div>
            );
          })}
          <div style={{ fontSize: '0.75rem', color: '#4a5070', marginTop: 6 }}>
            解放ルート: 始まりの洞窟 → 要塞(3クリア) → 地下要塞 → 箱庭庭園 → 冷焦洞穴 → 天空城 → ドラゴンの塒
          </div>
        </div>
      )}

      {!runState ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {dungeons.map(d => {
              return (
                <DungeonCard
                  key={d.id} dungeon={d}
                  selected={selectedId === d.id}
                  onSelect={() => setSelectedId(d.id)}
                  playerLevel={player.stats.level}
                  clearedCount={player.dungeonClearedCount?.[d.id] ?? 0}
                  isUnlocked={isDungeonUnlocked(d.id)}
                />
              );
            })}
          </div>

          {selectedId && (
            <button
              onClick={startDungeon}
              disabled={!isDungeonUnlocked(selectedId) || player.stats.level < (DUNGEON_MASTER[selectedId]?.requiredLevel ?? 0)}
              style={{
                width: '100%', padding: '12px', fontWeight: 700, fontSize: '1rem',
                background: isDungeonUnlocked(selectedId) && player.stats.level >= (DUNGEON_MASTER[selectedId]?.requiredLevel ?? 0) ? 'linear-gradient(135deg,#e05555,#c03030)' : '#2d3752',
                color: '#fff', border: 'none', borderRadius: 8, cursor: isDungeonUnlocked(selectedId) && player.stats.level >= (DUNGEON_MASTER[selectedId]?.requiredLevel ?? 0) ? 'pointer' : 'not-allowed',
              }}
            >
              {!isDungeonUnlocked(selectedId)
                ? '🔒 このダンジョンは解放されていません'
                : player.stats.level < (DUNGEON_MASTER[selectedId]?.requiredLevel ?? 0)
                  ? `⛔ Lv.${DUNGEON_MASTER[selectedId]?.requiredLevel}以上が必要です`
                  : `⚔️ ${DUNGEON_MASTER[selectedId]?.name} に挑む！`
              }
            </button>
          )}
        </>
      ) : (
        <>
          <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#f0c060', fontWeight: 700 }}>{DUNGEON_MASTER[runState.dungeonId]?.name}</span>
              <span style={{ color: '#8a92b2', fontSize: '0.85rem' }}>B{runState.currentFloor}F</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#5b8dee', marginBottom: 6 }}>📍 {runState.currentAreaName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.8rem' }}>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#8a92b2' }}>撃破数</div><div style={{ color: '#e8e6ff', fontWeight: 700 }}>{runState.monstersDefeated}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#8a92b2' }}>獲得EXP</div><div style={{ color: '#5b8dee', fontWeight: 700 }}>{runState.totalExp}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#8a92b2' }}>獲得G</div><div style={{ color: '#f0c060', fontWeight: 700 }}>{runState.totalGold}</div></div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: '#8a92b2' }}>HP {player.stats.hp}/{player.stats.maxHp}</div>
                <div style={{ height: 6, background: '#2d3752', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
                  <div style={{ height: '100%', background: '#e05555', width: `${(player.stats.hp / player.stats.maxHp) * 100}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: '#8a92b2' }}>満腹 {player.stats.satiety}/{player.stats.maxSatiety}</div>
                <div style={{ height: 6, background: '#2d3752', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
                  <div style={{ height: '100%', background: '#f0a830', width: `${(player.stats.satiety / player.stats.maxSatiety) * 100}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          </div>

          {runState.isComplete || runState.isFailed ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: runState.isComplete ? '#f0c060' : '#e05555', fontWeight: 700, marginBottom: 12 }}>
                {runState.isComplete ? '🎉 攻略完了！' : '💀 攻略失敗...'}
              </p>
              <button onClick={escape} style={{ padding: '10px 32px', background: '#4caf87', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                ダンジョン出口へ
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={fight}
                disabled={isFighting || player.stats.hp <= 0}
                style={{
                  flex: 2, padding: '12px', fontWeight: 700,
                  background: isFighting ? '#2d3752' : 'linear-gradient(135deg,#e05555,#c03030)',
                  color: '#fff', border: 'none', borderRadius: 8, cursor: isFighting ? 'not-allowed' : 'pointer',
                }}
              >
                {isFighting ? '⚔️ 戦闘中...' : '⚔️ 戦闘'}
              </button>
              <button onClick={escape} style={{ flex: 1, padding: '12px', background: '#2d3752', color: '#8a92b2', border: '1px solid #2d3752', borderRadius: 8, cursor: 'pointer' }}>
                🏃 離脱
              </button>
            </div>
          )}

          {lastResult && <CombatLog result={lastResult} onClose={() => setLastResult(null)} />}
        </>
      )}
    </div>
  );
}
