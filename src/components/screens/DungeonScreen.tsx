// src/components/screens/DungeonScreen.tsx
import { GameIcon } from '../icons';
import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { secureRandom, randomInt, randomIntRange, randomChance } from '../../utils/random';
import { DUNGEON_MASTER, MONSTER_MASTER, ITEM_MASTER } from '../../data/masters';
import type { MonsterMaster, DungeonRunState, DungeonMaster } from '../../types/game';
import type { EquipmentSlots } from '../../types/game';
import { defaultEquipmentSlots } from '../../types/game';
import { postActivityFeed } from '../../services/multiplayer';

// ============================================================
// 戦闘ロジック（1ターン分）
// ============================================================
function calcDamage(atk: number, def: number): number {
  const base = Math.max(1, atk - def);
  return base + randomInt(Math.ceil(base * 0.2) + 1);
}

function calcMonsterDrops(monster: MonsterMaster, combatLv: number) {
  return monster.drops.filter(d => {
    const rate = Math.min(1, d.baseRate + (d.skillRateBonus ?? 0) * combatLv * 0.01);
    return randomChance(rate);
  }).map(d => ({ itemId: d.itemId, amount: randomIntRange(d.minAmount, d.maxAmount) }));
}

// ============================================================
// ターン制バトル状態
// ============================================================
interface TurnBattleState {
  monsterId: string;
  monsterHp: number;
  monsterMaxHp: number;
  playerHpSnapshot: number; // バトル開始時HP（表示用）
  turn: 'player' | 'monster' | 'result';
  log: { text: string; color: string }[];
  result: 'win' | 'lose' | 'escaped' | null;
  expGained: number;
  goldGained: number;
  drops: { itemId: string; amount: number }[];
  isDefending: boolean; // 防御中フラグ
}

// ============================================================
// ホットバーUI
// ============================================================
const SLOT_LABELS: Record<string, string> = {
  helmet: '🪖', chestplate: '🛡️', leggings: '👖', boots: '👟', offhand: '✋'
};

function HotbarPanel({ equipment, inventory, onSlotClick }: {
  equipment: EquipmentSlots;
  inventory: Record<string, number>;
  onSlotClick: (slot: string, idx?: number) => void;
}) {
  return (
    <div style={{ background: '#0e1220', border: '1px solid #2d3752', borderRadius: 8, padding: '8px 10px' }}>
      {/* ホットバー9スロット */}
      <div style={{ fontSize: '0.68rem', color: '#4a5070', marginBottom: 4 }}>ホットバー（クリックでアイテムをセット）</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {equipment.hotbar.map((itemId, i) => {
          const item = itemId ? ITEM_MASTER[itemId] : null;
          const qty = itemId ? (inventory[itemId] ?? 0) : 0;
          return (
            <button key={i} onClick={() => onSlotClick('hotbar', i)}
              title={item?.name ?? '空'}
              style={{
                width: 36, height: 36, background: item ? 'rgba(91,141,238,0.15)' : '#161b26',
                border: `1px solid ${item ? '#5b8dee' : '#2d3752'}`, borderRadius: 6,
                cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {item
                ? <><GameIcon id={item.icon} size={18} /><span style={{ position:'absolute', bottom:1, right:2, fontSize:'0.55rem', color:'#f0c060' }}>{qty}</span></>
                : <span style={{ fontSize: '0.65rem', color: '#4a5070' }}>{i + 1}</span>}
            </button>
          );
        })}
      </div>
      {/* 防具枠 */}
      <div style={{ fontSize: '0.68rem', color: '#4a5070', marginBottom: 4 }}>防具・オフハンド</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {(['helmet','chestplate','leggings','boots','offhand'] as const).map(slot => {
          const itemId = equipment[slot];
          const item = itemId ? ITEM_MASTER[itemId] : null;
          return (
            <button key={slot} onClick={() => onSlotClick(slot)}
              title={`${slot}: ${item?.name ?? '未装備'}`}
              style={{
                width: 36, height: 36, background: item ? 'rgba(76,175,135,0.15)' : '#161b26',
                border: `1px solid ${item ? '#4caf87' : '#2d3752'}`, borderRadius: 6,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
              <span style={{ fontSize: '0.9rem' }}>{SLOT_LABELS[slot]}</span>
              {item && <span style={{ fontSize: '0.5rem', color: '#4caf87', lineHeight: 1 }}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ホットバーセットモーダル
// ============================================================
function HotbarSetModal({ slot, idx, equipment, inventory, onSet, onClose }: {
  slot: string; idx?: number;
  equipment: EquipmentSlots; inventory: Record<string, number>;
  onSet: (itemId: string | null) => void; onClose: () => void;
}) {
  const isArmorSlot = ['helmet','chestplate','leggings','boots','offhand'].includes(slot);
  const categoryFilter = isArmorSlot ? ['armor','weapon'] : ['consumable','potion','food','weapon'];
  const eligible = Object.entries(inventory)
    .filter(([id, qty]) => qty > 0 && ITEM_MASTER[id] && categoryFilter.includes(ITEM_MASTER[id].category))
    .map(([id]) => id);

  const currentItem = slot === 'hotbar' && idx !== undefined ? equipment.hotbar[idx]
    : slot !== 'hotbar' ? equipment[slot as keyof EquipmentSlots] as string | null : null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:700, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1c2235', border:'2px solid #5b8dee', borderRadius:12, padding:16, width:'90%', maxWidth:340, maxHeight:'70vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontWeight:700, color:'#5b8dee', fontSize:'0.9rem' }}>
            {slot === 'hotbar' ? `ホットバー ${(idx??0)+1}` : `${SLOT_LABELS[slot] ?? slot} ${slot}`} にセット
          </span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#8a92b2', cursor:'pointer', fontSize:'1.2rem' }}>×</button>
        </div>
        {currentItem && (
          <button onClick={() => { onSet(null); onClose(); }}
            style={{ width:'100%', padding:'6px', background:'rgba(224,85,85,0.15)', color:'#e05555', border:'1px solid #e05555', borderRadius:6, cursor:'pointer', fontSize:'0.8rem', marginBottom:8 }}>
            🗑️ スロットを空にする
          </button>
        )}
        {eligible.length === 0
          ? <div style={{ color:'#4a5070', textAlign:'center', padding:16 }}>セットできるアイテムなし</div>
          : eligible.map(id => {
              const item = ITEM_MASTER[id];
              const qty = inventory[id];
              return (
                <button key={id} onClick={() => { onSet(id); onClose(); }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'#161b26', border:'1px solid #2d3752', borderRadius:6, cursor:'pointer', color:'#e8e6ff', marginBottom:4, textAlign:'left' }}>
                  <GameIcon id={item.icon} size={20} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.85rem', fontWeight:700 }}>{item.name}</div>
                    <div style={{ fontSize:'0.68rem', color:'#8a92b2' }}>{item.description}</div>
                  </div>
                  <span style={{ fontSize:'0.75rem', color:'#f0c060' }}>×{qty}</span>
                </button>
              );
            })}
      </div>
    </div>
  );
}

// ============================================================
// ターン制バトル画面
// ============================================================
function TurnBattle({ runState, equipment, onBattleEnd, onEscape }: {
  runState: DungeonRunState;
  equipment: EquipmentSlots;
  onBattleEnd: (won: boolean, expGained: number, goldGained: number, drops: {itemId:string;amount:number}[], hpDelta: number) => void;
  onEscape: () => void;
}) {
  const player = useGameStore(s => s.player)!;
  const consumeItem = useGameStore(s => s.consumeItem);
  const changeHp = useGameStore(s => s.changeHp);
  const addNotification = useGameStore(s => s.addNotification);

  const dungeon = DUNGEON_MASTER[runState.dungeonId];
  const combatLv = player.skillLevels['combat'] ?? 1;

  // モンスターを決定
  const [battle, setBattle] = useState<TurnBattleState>(() => {
    const areas = dungeon?.areas;
    const areaIdx = runState.currentAreaIdx ?? 0;
    let monsterId: string;
    if (areas && areas[areaIdx]) {
      const pool = areas[areaIdx].monsters.flatMap(m => Array(m.count).fill(m.monsterId));
      monsterId = pool[randomInt(pool.length)];
    } else {
      monsterId = dungeon.monsterIds[randomInt(dungeon.monsterIds.length)];
    }
    const monster = MONSTER_MASTER[monsterId];
    return {
      monsterId,
      monsterHp: monster?.maxHp ?? 50,
      monsterMaxHp: monster?.maxHp ?? 50,
      playerHpSnapshot: player.stats.hp,
      turn: 'player',
      log: [{ text: `⚔️ ${monster?.name ?? '?'} が現れた！`, color: '#f0c060' }],
      result: null,
      expGained: 0, goldGained: 0, drops: [],
      isDefending: false,
    };
  });

  const monster = MONSTER_MASTER[battle.monsterId];
  const [showHotbar, setShowHotbar] = useState(false);
  const [hotbarModal, setHotbarModal] = useState<{slot:string;idx?:number} | null>(null);
  const [localEquip, setLocalEquip] = useState<EquipmentSlots>(equipment);

  // モンスターターン実行
  const doMonsterTurn = useCallback((prevBattle: TurnBattleState): TurnBattleState => {
    if (!monster) return prevBattle;
    // 装備防具のdefenseBonusを加算
    const armorSlots: (keyof EquipmentSlots)[] = ['helmet','chestplate','leggings','boots','offhand'];
    const armorBonus = armorSlots.reduce((sum, slot) => {
      const id = localEquip[slot] as string | null;
      if (!id) return sum;
      const it = ITEM_MASTER[id];
      return it?.category === 'armor' ? sum + (it.defenseBonus ?? 0) : sum;
    }, 0);
    const totalDef = player.stats.defense + armorBonus;
    const isSpecial = monster.isBoss && randomChance(0.2);
    const mDmg = isSpecial
      ? Math.floor(calcDamage(monster.attack, totalDef) * 1.5)
      : calcDamage(monster.attack, prevBattle.isDefending ? totalDef * 2 : totalDef);
    const reducedDmg = prevBattle.isDefending ? Math.floor(mDmg * 0.5) : mDmg;
    changeHp(-reducedDmg);
    const newPlayerHp = Math.max(0, player.stats.hp - reducedDmg);
    const logEntry = isSpecial
      ? { text: `💥 ${monster.name}の特殊攻撃！ あなたに${reducedDmg}ダメージ！`, color: '#e05555' }
      : { text: `🐉 ${monster.name}の攻撃！ あなたに${reducedDmg}ダメージ${prevBattle.isDefending ? '（防御中）' : ''}`, color: '#e05555' };

    if (newPlayerHp <= 0) {
      return { ...prevBattle, log: [...prevBattle.log, logEntry, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
    }
    return { ...prevBattle, log: [...prevBattle.log, logEntry], turn: 'player', isDefending: false };
  }, [monster, player.stats, changeHp, localEquip]);

  // プレイヤー行動: 攻撃
  const handleAttack = () => {
    if (battle.turn !== 'player' || battle.result) return;
    // 装備武器のattackBonusを加算
    const weaponBonus = localEquip.hotbar.reduce((sum, id) => {
      if (!id) return sum;
      const it = ITEM_MASTER[id];
      return it?.category === 'weapon' ? sum + (it.attackBonus ?? 0) : sum;
    }, 0);
    const totalAtk = player.stats.attack + weaponBonus;
    const pDmg = calcDamage(totalAtk, monster?.defense ?? 0);
    const newMHp = Math.max(0, battle.monsterHp - pDmg);
    const log = [...battle.log, { text: `⚔️ あなたの攻撃！ ${pDmg}ダメージ！`, color: '#4caf87' }];

    if (newMHp <= 0) {
      const drops = calcMonsterDrops(monster!, combatLv);
      const exp = Math.floor(monster!.baseExp * dungeon.expBonus * (1 + combatLv * 0.01));
      const gold = Math.floor(monster!.baseGold * dungeon.goldBonus * (0.8 + secureRandom() * 0.4));
      setBattle(b => ({ ...b, monsterHp: 0, log: [...log, { text: `✨ ${monster!.name}を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' }], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops }));
      return;
    }
    // モンスターターンへ
    const afterAttack: TurnBattleState = { ...battle, monsterHp: newMHp, log, turn: 'monster', isDefending: false };
    setBattle(afterAttack);
    setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
  };

  // 防御
  const handleDefend = () => {
    if (battle.turn !== 'player' || battle.result) return;
    const log = [...battle.log, { text: '🛡️ 防御態勢を取った！（次の攻撃ダメージ半減）', color: '#5b8dee' }];
    const afterDefend: TurnBattleState = { ...battle, log, turn: 'monster', isDefending: true };
    setBattle(afterDefend);
    setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
  };

  // ホットバーアイテム使用
  const handleUseHotbarItem = (idx: number) => {
    if (battle.turn !== 'player' || battle.result) return;
    const itemId = localEquip.hotbar[idx];
    if (!itemId) { addNotification('warning', `スロット${idx+1}にアイテムがありません`); return; }
    const item = ITEM_MASTER[itemId];
    if (!item?.useEffect) { addNotification('warning', `${item?.name}は使用できません`); return; }
    const ok = consumeItem(itemId, 1);
    if (!ok) { addNotification('warning', `${item.name}が足りません`); return; }
    const { hpRestore, satietyRestore: _satietyRestore, message } = item.useEffect;
    if (hpRestore && hpRestore > 0) changeHp(Math.min(hpRestore, player.stats.maxHp - player.stats.hp));
    const logMsg = message ?? `${item.name}を使用した`;
    const log = [...battle.log, { text: `🧪 ${logMsg}`, color: '#9b6df0' }];
    const afterItem: TurnBattleState = { ...battle, log, turn: 'monster', isDefending: false };
    setBattle(afterItem);
    setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
  };

  // 逃走（30%成功）
  const handleEscape = () => {
    if (battle.turn !== 'player' || battle.result) return;
    if (randomChance(0.4)) {
      setBattle(b => ({ ...b, log: [...b.log, { text: '🏃 逃走成功！', color: '#f0a830' }], turn: 'result', result: 'escaped' }));
    } else {
      const log = [...battle.log, { text: '😰 逃走失敗！', color: '#e05555' }];
      const afterFail: TurnBattleState = { ...battle, log, turn: 'monster', isDefending: false };
      setBattle(afterFail);
      setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
    }
  };

  // 結果確定後に親へ通知
  useEffect(() => {
    if (!battle.result) return;
    if (battle.result === 'win') {
      onBattleEnd(true, battle.expGained, battle.goldGained, battle.drops, 0);
    } else if (battle.result === 'lose') {
      onBattleEnd(false, 0, 0, [], 0);
    } else if (battle.result === 'escaped') {
      onEscape();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.result]);

  const hpPct = (player.stats.hp / player.stats.maxHp) * 100;
  const mHpPct = (battle.monsterHp / battle.monsterMaxHp) * 100;

  return (
    <div style={{ background: '#161b26', border: '2px solid #e05555', borderRadius: 12, padding: 14 }}>
      {/* モンスター情報 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: '2.2rem' }}><GameIcon id={monster?.icon ?? 'skull'} size={40} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#e05555' }}>{monster?.name ?? '?'}{monster?.isBoss && ' 👑'}</div>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 3 }}>HP {battle.monsterHp}/{battle.monsterMaxHp}</div>
          <div style={{ height: 6, background: '#2d3752', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#e05555', width: `${mHpPct}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
        {battle.turn === 'monster' && !battle.result && (
          <span style={{ fontSize: '1.2rem', animation: 'pulse 0.5s infinite' }}>⚡</span>
        )}
      </div>

      {/* プレイヤーHP */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.7rem', color: '#8a92b2', display: 'flex', justifyContent: 'space-between' }}>
          <span>あなた HP {player.stats.hp}/{player.stats.maxHp}</span>
          {battle.isDefending && <span style={{ color: '#5b8dee' }}>🛡️ 防御中</span>}
        </div>
        <div style={{ height: 6, background: '#2d3752', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
          <div style={{ height: '100%', background: hpPct > 50 ? '#4caf87' : hpPct > 25 ? '#f0a830' : '#e05555', width: `${hpPct}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* ログ */}
      <div style={{ background: '#0e1220', borderRadius: 6, padding: '6px 8px', maxHeight: 90, overflowY: 'auto', marginBottom: 10, fontSize: '0.75rem' }}>
        {battle.log.slice(-6).map((l, i) => (
          <div key={i} style={{ color: l.color, padding: '1px 0' }}>{l.text}</div>
        ))}
      </div>

      {/* 行動ボタン */}
      {!battle.result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
            <button onClick={handleAttack} disabled={battle.turn !== 'player'}
              style={{ padding: '10px', background: battle.turn === 'player' ? 'linear-gradient(135deg,#e05555,#c03030)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: battle.turn === 'player' ? 'pointer' : 'not-allowed', fontWeight: 700 }}>
              ⚔️ 攻撃
            </button>
            <button onClick={handleDefend} disabled={battle.turn !== 'player'}
              style={{ padding: '10px', background: battle.turn === 'player' ? 'linear-gradient(135deg,#5b8dee,#3d6fd0)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: battle.turn === 'player' ? 'pointer' : 'not-allowed', fontWeight: 700 }}>
              🛡️ 防御
            </button>
          </div>

          {/* ホットバーアイテム使用 */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {localEquip.hotbar.map((itemId, i) => {
              const item = itemId ? ITEM_MASTER[itemId] : null;
              const qty = itemId ? (player.inventory[itemId] ?? 0) : 0;
              return (
                <button key={i} onClick={() => handleUseHotbarItem(i)}
                  disabled={battle.turn !== 'player' || !item || qty === 0}
                  title={item ? `${item.name} ×${qty}` : `スロット${i+1}（空）`}
                  style={{
                    width: 38, height: 38, background: item && qty > 0 ? 'rgba(155,109,240,0.2)' : '#161b26',
                    border: `1px solid ${item && qty > 0 ? '#9b6df0' : '#2d3752'}`, borderRadius: 6,
                    cursor: item && qty > 0 && battle.turn === 'player' ? 'pointer' : 'not-allowed',
                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  {item
                    ? <><GameIcon id={item.icon} size={18} /><span style={{ position:'absolute', bottom:1, right:2, fontSize:'0.5rem', color:'#f0c060' }}>{qty}</span></>
                    : <span style={{ fontSize: '0.6rem', color: '#4a5070' }}>{i+1}</span>}
                </button>
              );
            })}
            <button onClick={() => setShowHotbar(h => !h)} disabled={battle.turn !== 'player'}
              style={{ padding: '0 10px', height: 38, background: '#161b26', border: '1px dashed #5b8dee', borderRadius: 6, color: '#5b8dee', cursor: 'pointer', fontSize: '0.72rem' }}>
              🎒 装備
            </button>
            <button onClick={handleEscape} disabled={battle.turn !== 'player'}
              style={{ padding: '0 10px', height: 38, background: 'rgba(240,168,48,0.1)', border: '1px solid #f0a830', borderRadius: 6, color: '#f0a830', cursor: battle.turn === 'player' ? 'pointer' : 'not-allowed', fontSize: '0.78rem' }}>
              🏃 逃走
            </button>
          </div>

          {showHotbar && (
            <HotbarPanel equipment={localEquip} inventory={player.inventory}
              onSlotClick={(slot, idx) => setHotbarModal({ slot, idx })} />
          )}
        </>
      )}

      {hotbarModal && (
        <HotbarSetModal
          slot={hotbarModal.slot} idx={hotbarModal.idx}
          equipment={localEquip} inventory={player.inventory}
          onSet={itemId => {
            setLocalEquip(prev => {
              const next = { ...prev, hotbar: [...prev.hotbar] };
              if (hotbarModal.slot === 'hotbar' && hotbarModal.idx !== undefined) {
                next.hotbar[hotbarModal.idx] = itemId;
              } else {
                (next as any)[hotbarModal.slot] = itemId;
              }
              return next;
            });
          }}
          onClose={() => setHotbarModal(null)}
        />
      )}
    </div>
  );
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
            🔒 {prereq?.name ?? uc.dungeonId} を {uc.clearedCount}回クリア（現在 {progress}/{uc.clearedCount}）
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
// ダンジョン選択カード
// ============================================================
function DungeonCard({ dungeon, selected, onSelect, playerLevel, clearedCount, isUnlocked }: {
  dungeon: DungeonMaster; selected: boolean; onSelect: () => void;
  playerLevel: number; clearedCount: number; isUnlocked: boolean;
}) {
  const meetsLevel = playerLevel >= dungeon.requiredLevel;
  const canSelect = isUnlocked;
  const tierColors: Record<string, string> = {
    beginner: '#4caf87', intermediate: '#5b8dee', advanced: '#f0a830',
    super: '#e05555', extreme: '#9b6df0', volcano: '#ff6b35',
  };
  const color = tierColors[dungeon.tier] ?? '#5b8dee';
  const uc = (dungeon as any).unlockCondition as { dungeonId: string; clearedCount: number } | undefined;
  return (
    <button onClick={() => canSelect && onSelect()}
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        background: selected ? 'rgba(91,141,238,0.15)' : '#1c2235',
        border: `2px solid ${selected ? color : meetsLevel && isUnlocked ? '#2d3752' : canSelect ? 'rgba(240,168,48,0.3)' : '#1c2235'}`,
        borderRadius: 10, padding: '10px 14px', textAlign: 'left',
        color: '#e8e6ff', cursor: canSelect ? 'pointer' : 'not-allowed',
        opacity: canSelect ? 1 : 0.6, transition: 'all 0.2s', width: '100%',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.8rem' }}><GameIcon id={dungeon.icon} size={36} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            {dungeon.name}
            {!isUnlocked && <span>🔒</span>}
            {!meetsLevel && isUnlocked && <span style={{ fontSize: '0.7rem', color: '#e05555', background: 'rgba(224,85,85,0.15)', padding: '1px 5px', borderRadius: 4 }}>戦闘Lv不足</span>}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginTop: 2 }}>{dungeon.description}</div>
          <div style={{ fontSize: '0.7rem', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color }}>★ {dungeon.tier.toUpperCase()}</span>
            <span style={{ color: meetsLevel ? '#4caf87' : '#e05555' }}>戦闘Lv.{dungeon.requiredLevel}〜</span>
            <span style={{ color: '#f0c060' }}>EXP×{dungeon.expBonus} G×{dungeon.goldBonus}</span>
            {clearedCount > 0 && <span style={{ color: '#4caf87' }}>✓ {clearedCount}回クリア</span>}
          </div>
        </div>
      </div>
      <UnlockBadge dungeon={dungeon} clearedCount={uc ? (useGameStore.getState().player?.dungeonClearedCount?.[uc.dungeonId] ?? 0) : 0} />
    </button>
  );
}

// ============================================================
// メイン画面
// ============================================================
export function DungeonScreen() {
  const player = useGameStore(s => s.player);
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
  const [inBattle, setInBattle] = useState(false);
  const [battleKey, setBattleKey] = useState(0); // バトルコンポーネント再生成用
  const [equipment, _setEquipment] = useState<EquipmentSlots>(() => player?.equipment ?? defaultEquipmentSlots());
  const [showUnlockGuide, setShowUnlockGuide] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);

  const dungeons = Object.values(DUNGEON_MASTER);
  const lockedDungeons = dungeons.filter(d => !isDungeonUnlocked(d.id));

  const startDungeon = useCallback(() => {
    if (!player || !selectedId) return;
    const dungeon = DUNGEON_MASTER[selectedId];
    const combatLv = player.skillLevels['combat'] ?? 1;
    if (!dungeon || combatLv < dungeon.requiredLevel) {
      addNotification('warning', `戦闘スキルLv.${dungeon?.requiredLevel}以上が必要です（現在: Lv.${combatLv}）`);
      return;
    }
    if (!isDungeonUnlocked(selectedId)) { addNotification('error', '🔒 このダンジョンはまだ解放されていません'); return; }
    if (player.stats.hp <= 0) { addNotification('error', 'HPが0です。回復してから挑戦してください。'); return; }
    setRunState({ dungeonId: selectedId, currentFloor: 1, currentAreaName: DUNGEON_MASTER[selectedId]?.areas?.[0]?.name ?? 'エリア1', monstersDefeated: 0, totalExp: 0, totalGold: 0, totalDrops: [], isComplete: false, isFailed: false, currentAreaIdx: 0 });
    setRunLog([`⚔️ ${dungeon.name} に突入！`]);
    setInBattle(false);
  }, [player, selectedId, isDungeonUnlocked, addNotification]);

  const handleBattleEnd = useCallback((won: boolean, expGained: number, goldGained: number, drops: {itemId:string;amount:number}[], _hpDelta: number) => {
    setInBattle(false);
    if (!runState || !player) return;
    const dungeon = DUNGEON_MASTER[runState.dungeonId];

    applyHungerPenalty();
    changeSatiety(-3);

    if (!won) {
      addNotification('error', '敗北... HPが0になった。');
      setRunState(prev => prev ? { ...prev, isFailed: true } : null);
      return;
    }

    addExp(expGained);
    addSkillExp('combat', Math.floor(expGained / 2));
    changeGold(goldGained);
    addItems(drops);

    const newDefeated = runState.monstersDefeated + 1;
    const newExp = runState.totalExp + expGained;
    const newGold = runState.totalGold + goldGained;
    const allDrops = [...runState.totalDrops];
    for (const d of drops) {
      const ex = allDrops.find(x => x.itemId === d.itemId);
      if (ex) ex.amount += d.amount; else allDrops.push({ ...d });
    }

    setRunLog(prev => [...prev, `✅ 撃破！EXP+${expGained} G+${goldGained}`]);

    const areaThreshold = 5;
    const areas = dungeon?.areas;
    let nextAreaIdx = runState.currentAreaIdx ?? 0;
    let isComplete = false;
    if (newDefeated % areaThreshold === 0 && areas) {
      if (nextAreaIdx < areas.length - 1) {
        nextAreaIdx = nextAreaIdx + 1;
        addNotification('info', `✅ ${areas[nextAreaIdx].name} に進んだ！`);
        setRunLog(prev => [...prev, `📍 ${areas[nextAreaIdx].name} へ進んだ！`]);
      } else {
        isComplete = true;
        recordDungeonClear(runState.dungeonId);
        addNotification('success', `🏆 ${dungeon?.name} 攻略完了！`);
        if (player) postActivityFeed({ uid: player.uid, displayName: player.displayName, type: 'dungeon_clear', message: `が「${dungeon?.name}」をクリアしました！` }).catch(() => {});
      }
    }

    setRunState(prev => prev ? {
      ...prev, currentAreaIdx: nextAreaIdx,
      currentAreaName: areas?.[nextAreaIdx]?.name ?? prev.currentAreaName,
      monstersDefeated: newDefeated, totalExp: newExp, totalGold: newGold,
      totalDrops: allDrops, isComplete, currentFloor: Math.min(prev.currentFloor + 1, dungeon?.floors ?? 1),
    } : null);
  }, [runState, player, applyHungerPenalty, changeSatiety, addExp, addSkillExp, changeGold, addItems, addNotification, recordDungeonClear]);

  const handleEscapeBattle = useCallback(() => {
    setInBattle(false);
    setRunLog(prev => [...prev, '🏃 逃走した。']);
  }, []);

  const escape = useCallback(() => {
    addNotification('info', '🏃 ダンジョンから離脱した。');
    setRunState(null); setInBattle(false); setRunLog([]);
  }, [addNotification]);

  if (!player) return null;

  return (
    <div style={{ padding: '12px 8px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', borderBottom: '1px solid #2d3752', paddingBottom: 8, flex: 1 }}>⚔️ ダンジョン</h2>
        {lockedDungeons.length > 0 && (
          <button onClick={() => setShowUnlockGuide(!showUnlockGuide)}
            style={{ padding: '5px 10px', background: '#1c2235', border: '1px solid #f0a830', color: '#f0a830', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', marginLeft: 8 }}>
            🔒 解放ガイド ({lockedDungeons.length})
          </button>
        )}
      </div>

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
                <span style={{ fontSize: '1.2rem' }}><GameIcon id={d.icon} size={22} /></span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{d.name}</span>
                  {ucMap && prereq && <div style={{ fontSize: '0.72rem', color: '#8a92b2' }}>← {prereq.name}を{ucMap.clearedCount}回クリア（{cleared}/{ucMap.clearedCount}）</div>}
                  {!ucMap && <div style={{ fontSize: '0.72rem', color: '#4caf87' }}>最初から解放</div>}
                </div>
                <span>{unlocked ? '✅' : '🔒'}</span>
              </div>
            );
          })}
        </div>
      )}

      {!runState ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {dungeons.map(d => (
              <DungeonCard key={d.id} dungeon={d} selected={selectedId === d.id}
                onSelect={() => setSelectedId(d.id)}
                playerLevel={player.skillLevels['combat'] ?? 1}
                clearedCount={player.dungeonClearedCount?.[d.id] ?? 0}
                isUnlocked={isDungeonUnlocked(d.id)} />
            ))}
          </div>
          {selectedId && (() => {
            const combatLv = player.skillLevels['combat'] ?? 1;
            const reqLv = DUNGEON_MASTER[selectedId]?.requiredLevel ?? 0;
            const unlocked = isDungeonUnlocked(selectedId);
            const meetsLv = combatLv >= reqLv;
            return (
              <button onClick={startDungeon} disabled={!unlocked || !meetsLv}
                style={{ width: '100%', padding: '12px', fontWeight: 700, fontSize: '1rem', background: unlocked && meetsLv ? 'linear-gradient(135deg,#e05555,#c03030)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: unlocked && meetsLv ? 'pointer' : 'not-allowed' }}>
                {!unlocked ? '🔒 このダンジョンは解放されていません' : !meetsLv ? `⛔ 戦闘Lv.${reqLv}以上が必要です（現在: Lv.${combatLv}）` : `⚔️ ${DUNGEON_MASTER[selectedId]?.name} に挑む！`}
              </button>
            );
          })()}
        </>
      ) : (
        <>
          {/* ダンジョン進行状況 */}
          <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#f0c060', fontWeight: 700 }}>{DUNGEON_MASTER[runState.dungeonId]?.name}</span>
              <span style={{ color: '#8a92b2', fontSize: '0.85rem' }}>B{runState.currentFloor}F</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#5b8dee', marginBottom: 6 }}>📍 {runState.currentAreaName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.8rem', marginBottom: 8 }}>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#8a92b2' }}>撃破数</div><div style={{ color: '#e8e6ff', fontWeight: 700 }}>{runState.monstersDefeated}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#8a92b2' }}>獲得EXP</div><div style={{ color: '#5b8dee', fontWeight: 700 }}>{runState.totalExp}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#8a92b2' }}>獲得G</div><div style={{ color: '#f0c060', fontWeight: 700 }}>{runState.totalGold}</div></div>
            </div>
            {/* HP・満腹バー */}
            <div style={{ display: 'flex', gap: 8 }}>
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

          {/* 直近ログ */}
          {runLog.length > 0 && (
            <div style={{ background: '#0e1220', borderRadius: 6, padding: '6px 10px', marginBottom: 10, fontSize: '0.75rem', color: '#8a92b2', maxHeight: 60, overflowY: 'auto' }}>
              {runLog.slice(-4).map((l, i) => <div key={i}>{l}</div>)}
            </div>
          )}

          {runState.isComplete || runState.isFailed ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: runState.isComplete ? '#f0c060' : '#e05555', fontWeight: 700, marginBottom: 12 }}>
                {runState.isComplete ? '🎉 攻略完了！' : '💀 攻略失敗...'}
              </p>
              <button onClick={escape} style={{ padding: '10px 32px', background: '#4caf87', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                ダンジョン出口へ
              </button>
            </div>
          ) : inBattle ? (
            <TurnBattle
              key={battleKey}
              runState={runState}
              equipment={equipment}
              onBattleEnd={handleBattleEnd}
              onEscape={handleEscapeBattle}
            />
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setInBattle(true); setBattleKey(k => k + 1); }}
                disabled={player.stats.hp <= 0}
                style={{ flex: 2, padding: '12px', fontWeight: 700, background: player.stats.hp > 0 ? 'linear-gradient(135deg,#e05555,#c03030)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: player.stats.hp > 0 ? 'pointer' : 'not-allowed' }}>
                ⚔️ 次の敵と戦う
              </button>
              <button onClick={escape} style={{ flex: 1, padding: '12px', background: '#2d3752', color: '#8a92b2', border: '1px solid #2d3752', borderRadius: 8, cursor: 'pointer' }}>
                🏃 離脱
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
