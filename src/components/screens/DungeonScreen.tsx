// src/components/screens/DungeonScreen.tsx
import { GameIcon } from '../icons';
import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { secureRandom, randomInt, randomIntRange, randomChance } from '../../utils/random';
import { DUNGEON_MASTER, MONSTER_MASTER, ITEM_MASTER } from '../../data/masters';
import type { MonsterMaster, DungeonRunState, DungeonMaster, WeaponPassiveSkill, WeaponRegenSkill, WeaponShieldSkill, WeaponManaSkill, PlayerData } from '../../types/game';
import type { EquipmentSlots } from '../../types/game';
import { defaultEquipmentSlots } from '../../types/game';
import { postActivityFeed, subscribeMonsterOverrides, subscribeDungeonOverrides, setPlayerActivity } from '../../services/multiplayer';
import type { MonsterOverride, DungeonOverride } from '../../services/multiplayer';
import { TOOLS_MASTER } from '../../data/toolsMaster';
import { TOOL_GACHA_TABLE } from '../../data/toolAcquisition';

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
// ターン制バトル状態（複数敵対応）
// ============================================================
interface EnemyState {
  monsterId: string;
  hp: number;
  maxHp: number;
}

interface TurnBattleState {
  enemies: EnemyState[];       // 出現中の敵リスト
  targetIdx: number;           // 単発攻撃のターゲット
  playerHpSnapshot: number;
  turn: 'player' | 'monster' | 'result' | 'select_target';
  log: { text: string; color: string }[];
  result: 'win' | 'lose' | 'escaped' | null;
  expGained: number;
  goldGained: number;
  drops: { itemId: string; amount: number }[];
  isDefending: boolean;
  // ===== 共通Manaシステム =====
  // 武器固有ではなく戦闘全体で共有する単一のManaリソース
  // 獲得方法・消費量は武器スキル定義で管理する
  weaponMana: number;
  weaponManaMax: number;
  ultimateReady: boolean;
  // ===== 共通バフ・デバフシステム =====
  // 個別変数の代わりにバフ配列で統一管理
  // { type, value, turns } 形式で毒/シールド/攻撃上昇等を一括管理
  buffs: import('../../types/game').CombatBuff[];
  // 後方互換：poisonBuff/poisonDmgはbuffsから派生（削除は段階的に）
  poisonBuff: number;
  poisonDmg: number;
  equippedWeaponId: string | null;
  skillTurn: number;
  // アイテムクールダウン管理 { itemId: 残りターン数 }
  // tickCooldowns()で一括デクリメント
  itemCooldowns: Record<string, number>;
  // 単発攻撃の一時保存（ターゲット選択後に使う）
  pendingAction: null | { type: 'attack' | 'weapon' | 'ultimate'; itemId?: string };
  // KXモード用（省略可）
  kx?: KxState;
  // Goliathシールド：残りターン数（0=無効）
  goliathShieldTurns: number;
  // Goliathシールド：次フェーズ攻撃不可の敵インデックス（-1=なし）
  goliathStunnedEnemyIdx: number;
}

// KXボス戦専用状態
interface KxState {
  hp: number;
  maxHp: number;
  phase: number;       // 1-4
  isAwakened: boolean;
  awakeHp: number;
  awakeMaxHp: number;
  burnTurns: number;   // カオスフレア燃焼残りターン
}

// TurnBattle に渡す KX設定
interface KxConfig {
  initialHp: number;
  initialPhase: number;
  initialAwakened: boolean;
  onVictory: (isAwakened: boolean) => void;
  onDefeat: () => void;
}

// ============================================================
// モンスター・ダンジョンオーバーライドキャッシュ（モジュールレベル）
// ============================================================
let _monsterOverrideCache: Record<string, MonsterOverride> = {};
let _dungeonOverrideCache: Record<string, DungeonOverride> = {};

function getMergedMonster(id: string): MonsterMaster {
  const base = MONSTER_MASTER[id];
  const ov = _monsterOverrideCache[id];
  if (!base || !ov) return base;
  return {
    ...base,
    maxHp: ov.maxHp ?? base.maxHp,
    attack: ov.attack ?? base.attack,
    defense: ov.defense ?? base.defense,
    baseExp: ov.baseExp ?? base.baseExp,
    baseGold: ov.baseGold ?? base.baseGold,
    specialAttack: ov.specialAttack ?? base.specialAttack,
    drops: ov.drops ?? base.drops,
  };
}

// ターゲット選択モーダル
function TargetSelectModal({ enemies, onSelect, onCancel }: {
  enemies: EnemyState[];
  onSelect: (idx: number) => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:800, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1c2235', border:'2px solid #e05555', borderRadius:12, padding:16, width:'85%', maxWidth:320 }}>
        <div style={{ fontWeight:700, color:'#e05555', marginBottom:12, textAlign:'center' }}>🎯 誰に攻撃する？</div>
        {enemies.map((e, i) => {
          if (e.hp <= 0) return null;
          const m = getMergedMonster(e.monsterId);
          const pct = (e.hp / e.maxHp) * 100;
          return (
            <button key={i} onClick={() => onSelect(i)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(224,85,85,0.1)', border:'1px solid #e05555', borderRadius:8, cursor:'pointer', color:'#e8e6ff', marginBottom:8, textAlign:'left' }}>
              <GameIcon id={m?.icon ?? 'skull'} size={28} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'0.88rem' }}>{m?.name ?? '?'}</div>
                <div style={{ fontSize:'0.68rem', color:'#8a92b2' }}>HP {e.hp}/{e.maxHp}</div>
                <div style={{ height:4, background:'#2d3752', borderRadius:2, overflow:'hidden', marginTop:2 }}>
                  <div style={{ height:'100%', background:'#e05555', width:`${pct}%` }} />
                </div>
              </div>
              <span style={{ color:'#f0c060', fontSize:'1.2rem' }}>▶</span>
            </button>
          );
        })}
        <button onClick={onCancel} style={{ width:'100%', padding:'8px', background:'rgba(74,80,112,0.3)', border:'1px solid #4a5070', borderRadius:6, color:'#8a92b2', cursor:'pointer', fontSize:'0.8rem', marginTop:4 }}>キャンセル</button>
      </div>
    </div>
  );
}

// 敵グループをスポーンする（ボス除外、1〜3体ランダム）
function spawnEnemies(dungeon: DungeonMaster, areaIdx: number, _kxPhase?: number): EnemyState[] {
  const areas = dungeon.areas;
  let pool: string[] = [];
  if (areas && areas[areaIdx]) {
    const area = areas[areaIdx];
    // ボスエリアはボスのみ単体
    const bossEntry = area.monsters.find(m => {
      const mon = getMergedMonster(m.monsterId);
      return mon?.isBoss;
    });
    if (bossEntry) {
      const m = getMergedMonster(bossEntry.monsterId);
      return [{ monsterId: bossEntry.monsterId, hp: m?.maxHp ?? 50, maxHp: m?.maxHp ?? 50 }];
    }
    // 中ボスエリアは中ボスのみ単体（複数体禁止）
    const midBossEntry = area.monsters.find(m => {
      const mon = getMergedMonster(m.monsterId);
      return mon?.isMidBoss;
    });
    if (midBossEntry) {
      const m = getMergedMonster(midBossEntry.monsterId);
      return [{ monsterId: midBossEntry.monsterId, hp: m?.maxHp ?? 50, maxHp: m?.maxHp ?? 50 }];
    }
    pool = area.monsters.flatMap(m => Array(m.count).fill(m.monsterId));
  } else {
    pool = (dungeon.monsterIds ?? []).filter(id => !getMergedMonster(id)?.isBoss);
  }
  if (pool.length === 0) return [];
  // ボス・中ボス含まれていれば除外
  const nonBossPool = pool.filter(id => !getMergedMonster(id)?.isBoss && !getMergedMonster(id)?.isMidBoss);
  const finalPool = nonBossPool.length > 0 ? nonBossPool : pool;
  const maxEnemies = dungeon.id === 'sky_castle_ex' ? 15 : 3;
  const count = Math.min(finalPool.length, randomIntRange(1, maxEnemies));
  // ランダムにcount体選ぶ（重複可）
  const result: EnemyState[] = [];
  for (let i = 0; i < count; i++) {
    const id = finalPool[randomInt(finalPool.length)];
    const m = getMergedMonster(id);
    result.push({ monsterId: id, hp: m?.maxHp ?? 50, maxHp: m?.maxHp ?? 50 });
  }
  return result;
}

// KX眷属スポーン（フェーズに応じて複数体）
function spawnKxMinions(phase: number): EnemyState[] {
  const mult = phase >= 4 ? 2 : 1;
  const base = [
    { monsterId: 'roam_armor', hp: 60, maxHp: 60 },
    { monsterId: 'death_armor', hp: 75, maxHp: 75 },
  ];
  const result: EnemyState[] = [];
  for (let i = 0; i < mult; i++) result.push(...base.map(m => ({ ...m })));
  return result;
}
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
function TurnBattle({ runState, equipment, onBattleEnd, onEscape, initialMana, onManaUpdate, kxConfig }: {
  runState: DungeonRunState;
  equipment: EquipmentSlots;
  onBattleEnd: (won: boolean, expGained: number, goldGained: number, drops: {itemId:string;amount:number}[], hpDelta: number) => void;
  onEscape: () => void;
  initialMana?: number;
  onManaUpdate?: (mana: number) => void;
  kxConfig?: KxConfig;
}) {
  const player = useGameStore(s => s.player)!;
  const consumeItem = useGameStore(s => s.consumeItem);
  const changeHp = useGameStore(s => s.changeHp);
  const changeSatiety = useGameStore(s => s.changeSatiety);
  const addNotification = useGameStore(s => s.addNotification);
  const addItems = useGameStore(s => s.addItems);

  const dungeon = { ...DUNGEON_MASTER[runState.dungeonId], areas: _dungeonOverrideCache[runState.dungeonId]?.areas ?? DUNGEON_MASTER[runState.dungeonId]?.areas };
  const combatLv = player.skillLevels['combat'] ?? 1;

  // 初期敵グループ生成
  const [battle, setBattle] = useState<TurnBattleState>(() => {
    const areaIdx = runState.currentAreaIdx ?? 0;
    const enemies = kxConfig
      ? spawnKxMinions(1)
      : spawnEnemies(dungeon, areaIdx);
    const hotbarWeaponId = equipment.hotbar.find(id => id && ITEM_MASTER[id]?.itemType === 'Weapon') ?? null;
    const weaponItem = hotbarWeaponId ? ITEM_MASTER[hotbarWeaponId] : null;
    const manaSkill = weaponItem?.weaponSkills?.find((s): s is WeaponManaSkill => s.type === 'mana_charge');
    const names = enemies.map(e => getMergedMonster(e.monsterId)?.name ?? '?').join('、');
    const KX_MAX_HP = 38750;
    const AWAKE_MAX_HP = 1900;
    return {
      enemies,
      targetIdx: 0,
      playerHpSnapshot: player.stats.hp,
      turn: 'player',
      log: kxConfig
        ? [{ text: '⚠️ KX-G21が現れた！眷属を倒してダメージを与えよ！', color: '#f0c060' }]
        : [{ text: `⚔️ ${names} が現れた！`, color: '#f0c060' }],
      result: null,
      expGained: 0, goldGained: 0, drops: [],
      isDefending: false,
      weaponMana: initialMana ?? 0,
      weaponManaMax: manaSkill?.manaMax ?? 1200,
      ultimateReady: false,
      // 共通バフ配列（毒などは{ type:'poison', value:5, turns:10 }形式）
      buffs: [],
      poisonBuff: 0,
      poisonDmg: 5,
      equippedWeaponId: hotbarWeaponId,
      skillTurn: 0,
      itemCooldowns: {},
      pendingAction: null,
      kx: kxConfig ? {
        hp: kxConfig.initialHp,
        maxHp: KX_MAX_HP,
        phase: kxConfig.initialPhase,
        isAwakened: kxConfig.initialAwakened,
        awakeHp: AWAKE_MAX_HP,
        awakeMaxHp: AWAKE_MAX_HP,
        burnTurns: 0,
      } : undefined,
      goliathShieldTurns: 0,
      goliathStunnedEnemyIdx: -1,
    };
  });

  const updateEquipment = useGameStore(s => s.updateEquipment);
  const [showHotbar, setShowHotbar] = useState(false);
  const [hotbarModal, setHotbarModal] = useState<{slot:string;idx?:number} | null>(null);
  const [localEquip, setLocalEquip] = useState<EquipmentSlots>(equipment);

  // Fix 7: sync localEquip changes to store so they persist after battle
  const setLocalEquipAndSave = useCallback((updater: (prev: EquipmentSlots) => EquipmentSlots) => {
    setLocalEquip(prev => {
      const next = updater(prev);
      updateEquipment(next);
      return next;
    });
  }, [updateEquipment]);

  // Fix 6: effective player defense including equipped item bonuses
  const getPlayerDef = useCallback((equip: EquipmentSlots = localEquip) => {
    let def = player.stats.defense;
    const allSlots: (string | null)[] = [
      ...equip.hotbar,
      equip.helmet, equip.chestplate, equip.leggings, equip.boots, equip.offhand,
    ];
    for (const itemId of allSlots) {
      if (!itemId) continue;
      const item = ITEM_MASTER[itemId];
      if (item?.weaponDef) def += item.weaponDef;
    }
    return def;
  }, [player.stats.defense, localEquip]);

  // 生存敵リスト（未使用だが将来用に保持）
  void battle.enemies.filter(e => e.hp > 0);

  // 勝利チェック＆ドロップ計算
  const calcWinRewards = (enemies: EnemyState[]) => {
    let totalExp = 0, totalGold = 0;
    const totalDrops: { itemId: string; amount: number }[] = [];
    for (const e of enemies) {
      const m = getMergedMonster(e.monsterId);
      if (!m) continue;
      const exp = Math.floor(m.baseExp * dungeon.expBonus * (1 + combatLv * 0.01));
      const gold = Math.floor(m.baseGold * dungeon.goldBonus * (0.8 + secureRandom() * 0.4));
      totalExp += exp;
      totalGold += gold;
      const drops = calcMonsterDrops(m, combatLv);
      for (const d of drops) {
        const ex = totalDrops.find(x => x.itemId === d.itemId);
        if (ex) ex.amount += d.amount; else totalDrops.push({ ...d });
      }
    }
    return { exp: totalExp, gold: totalGold, drops: totalDrops };
  };

  // モンスターターン（全生存敵が順に攻撃）
  const doMonsterTurn = useCallback((prevBattle: TurnBattleState): TurnBattleState => {
    let newLog = [...prevBattle.log];
    let newBattle = { ...prevBattle, enemies: prevBattle.enemies.map(e => ({ ...e })) };

    // ===== 共通ターン処理：クールダウンデクリメント =====
    const newSkillTurn = prevBattle.skillTurn + 1;
    newBattle = { ...newBattle, skillTurn: newSkillTurn };
    // tickCooldowns()で一括管理
    const newCooldowns: Record<string, number> = {};
    for (const [id, cd] of Object.entries(prevBattle.itemCooldowns)) {
      if (cd > 1) newCooldowns[id] = cd - 1;
    }
    newBattle = { ...newBattle, itemCooldowns: newCooldowns };

    // ===== 共通ターン処理：武器スキル（onTurnEnd相当） =====
    const weaponItem = prevBattle.equippedWeaponId ? ITEM_MASTER[prevBattle.equippedWeaponId] : null;
    if (weaponItem?.weaponSkills) {
      for (const skill of weaponItem.weaponSkills) {
        if (skill.type === 'penetrate_per_turn') {
          if (newSkillTurn % 3 === 0) {
            const pen = (skill as WeaponPassiveSkill).value;
            newBattle.enemies = newBattle.enemies.map(e =>
              e.hp > 0 ? { ...e, hp: Math.max(0, e.hp - pen) } : e
            );
            newLog.push({ text: `🔱 ${weaponItem.name}の貫通攻撃！ 全体${pen}ダメージ！`, color: '#9b6df0' });
          }
        }
        if (skill.type === 'regen_per_turn') {
          const regen = skill as WeaponRegenSkill;
          if (regen.hpRestore) { changeHp(regen.hpRestore); newLog.push({ text: `💚 ${weaponItem.name}の回復！ HP+${regen.hpRestore}`, color: '#4caf87' }); }
          if (regen.satietyRestore) { changeSatiety(regen.satietyRestore); }
        }
        // ===== 共通Manaシステム：mana_charge（変幻など） =====
        // 毎ターン固定量獲得。武器固有のmanaPerTurn/manaMaxだがMana変数は共通。
        if (skill.type === 'mana_charge') {
          const ms = skill as WeaponManaSkill;
          const newMana = Math.min(prevBattle.weaponMana + ms.manaPerTurn, ms.manaMax);
          newBattle = { ...newBattle, weaponMana: newMana, ultimateReady: newMana >= ms.manaMax };
          if (newMana >= ms.manaMax && prevBattle.weaponMana < ms.manaMax) {
            newLog.push({ text: `⭐ 必殺技「${weaponItem.weaponUltimate?.name}」が使えるようになった！`, color: '#f0c060' });
          }
        }
        // ===== 共通Manaシステム：mana_per_turn_random（Diamond Staffなど） =====
        // 毎ターンランダム量獲得。獲得方法は武器固有だがMana変数は共通。
        if (skill.type === 'mana_per_turn_random') {
          const s = skill as import('../../types/game').WeaponManaPerTurnRandomSkill;
          const steps = Math.floor((s.manaMax - s.manaMin) / s.manaStep) + 1;
          const gain = s.manaMin + Math.floor(secureRandom() * steps) * s.manaStep;
          const newMana = Math.min(newBattle.weaponMana + gain, newBattle.weaponManaMax);
          newBattle = { ...newBattle, weaponMana: newMana, ultimateReady: newMana >= newBattle.weaponManaMax };
          newLog.push({ text: `💠 ${weaponItem.name}がMana+${gain}付与！(${newMana}/${newBattle.weaponManaMax})`, color: '#4fc3f7' });
        }
      }
    }

    // ===== 共通オフハンド処理：hotbarの全スロットをチェック =====
    // offhand_mana_on_heal は回復使用時に処理するため、ここではmana_per_turn_randomのみ
    for (const slotId of localEquip.hotbar) {
      if (!slotId || slotId === prevBattle.equippedWeaponId) continue;
      const offItem = ITEM_MASTER[slotId];
      if (!offItem?.isOffhand || !offItem.weaponSkills) continue;
      for (const skill of offItem.weaponSkills) {
        if (skill.type === 'mana_per_turn_random') {
          const s = skill as import('../../types/game').WeaponManaPerTurnRandomSkill;
          const steps = Math.floor((s.manaMax - s.manaMin) / s.manaStep) + 1;
          const gain = s.manaMin + Math.floor(secureRandom() * steps) * s.manaStep;
          const newMana = Math.min(newBattle.weaponMana + gain, newBattle.weaponManaMax);
          newBattle = { ...newBattle, weaponMana: newMana, ultimateReady: newMana >= newBattle.weaponManaMax };
          newLog.push({ text: `💠 ${offItem.name}がMana+${gain}付与！(${newMana}/${newBattle.weaponManaMax})`, color: '#4fc3f7' });
        }
      }
    }

    // ===== 共通バフ・デバフ処理（onTurnEnd）=====
    // buffs配列を走査して毒ダメージなどを適用し、ターン数をデクリメント
    let newBuffs = newBattle.buffs ? [...newBattle.buffs] : [];
    const remainBuffs: typeof newBuffs = [];
    for (const buff of newBuffs) {
      if (buff.type === 'poison') {
        newBattle.enemies = newBattle.enemies.map(e =>
          e.hp > 0 ? { ...e, hp: Math.max(0, e.hp - buff.value) } : e
        );
        newLog.push({ text: `☠️ 毒！ 全体${buff.value}ダメージ (残${buff.turns - 1}ターン)`, color: '#9b6df0' });
      }
      if (buff.turns - 1 > 0) remainBuffs.push({ ...buff, turns: buff.turns - 1 });
    }
    newBattle = { ...newBattle, buffs: remainBuffs };

    // ===== Goliathシールドターン数デクリメント =====
    let newGoliathTurns = newBattle.goliathShieldTurns;
    if (newGoliathTurns > 0) {
      newGoliathTurns--;
      newBattle = { ...newBattle, goliathShieldTurns: newGoliathTurns };
      if (newGoliathTurns === 0) {
        newLog.push({ text: '🛡️ 魔造壊盾=Goliath=のシールド効果が切れた。', color: '#aaaaaa' });
      } else {
        newLog.push({ text: `🛡️ Goliathシールド有効（残${newGoliathTurns}ターン）`, color: '#00e5ff' });
      }
    }

    // 後方互換：poisonBuff（旧来の直接変数も処理）
    if (newBattle.poisonBuff > 0) {
      newBattle.enemies = newBattle.enemies.map(e =>
        e.hp > 0 ? { ...e, hp: Math.max(0, e.hp - newBattle.poisonDmg) } : e
      );
      newBattle = { ...newBattle, poisonBuff: newBattle.poisonBuff - 1 };
      newLog.push({ text: `☠️ 毒！ 全体${newBattle.poisonDmg}ダメージ (残${newBattle.poisonBuff}ターン)`, color: '#9b6df0' });
    }
    // 全滅チェック
    const aliveAfterPassive = newBattle.enemies.filter(e => e.hp > 0);
    if (aliveAfterPassive.length === 0) {
      // KXモード: 全眷属討伐時は勝利ではなく再召喚（executeAttack側で処理済みの場合あり）
      if (newBattle.kx && !newBattle.kx.isAwakened && newBattle.kx.hp > 0) {
        newLog.push({ text: 'KX-G21が眷属を再召喚した！', color: '#e05555' });
        return { ...newBattle, enemies: spawnKxMinions(newBattle.kx.phase), log: newLog, turn: 'player', isDefending: false };
      }
      if (!newBattle.kx) {
        const { exp, gold, drops } = calcWinRewards(newBattle.enemies);
        newLog.push({ text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' });
        return { ...newBattle, log: newLog, turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, isDefending: false };
      }
    }

    // === KXモード: KXのターン行動 ===
    if (newBattle.kx) {
      const kx = newBattle.kx;
      // 覚醒KXは普通に攻撃
      if (kx.isAwakened) {
        const dmg = 30 + Math.floor(secureRandom() * 40);
        changeHp(-dmg);
        newLog.push({ text: `⚡ KX-G21[ライフエナジー]の攻撃！${dmg}ダメージ！`, color: '#ff00ff' });
        if (player.stats.hp - dmg <= 0) {
          return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
        }
        return { ...newBattle, log: newLog, turn: 'player', isDefending: false };
      }
      // フェーズに応じたKXアクション選択
      const actions = ['minion_summon', 'cannon_create', 'summon_combat'];
      if (kx.phase >= 2) actions.push('stork_ex', 'slash');
      if (kx.phase >= 3) actions.push('chaos_flare', 'lightning_bolt', 'summon_tech_snipe');
      const action = actions[Math.floor(secureRandom() * actions.length)];
      let dmg = 0;
      let logText = '';
      let logColor = '#e05555';
      let newKxBurnTurns = kx.burnTurns;
      let extraEnemies: EnemyState[] = [];

      if (action === 'slash') {
        dmg = 15 + Math.floor(secureRandom() * 20);
        logText = `⚔️ 「貴様など叩き切ってくれるわ！」 KX-G21が貫通斬撃！${dmg}ダメ！`;
        changeHp(-dmg);
      } else if (action === 'chaos_flare') {
        dmg = 20 + Math.floor(secureRandom() * 15);
        newKxBurnTurns = 4;
        logText = `🔥 カオスフレア！${dmg}ダメ＋燃焼4ターン！`;
        changeHp(-dmg);
        logColor = '#ff6b00';
      } else if (action === 'lightning_bolt') {
        dmg = 60 + Math.floor(secureRandom() * 40);
        logText = `⚡ ライトニングボルト！超高火力${dmg}ダメ！`;
        changeHp(-dmg);
        logColor = '#f0f000';
      } else if (action === 'summon_tech_snipe') {
        dmg = 10;
        logText = `🎯 サモンテックスナイプ！貫通+10、エクス＆雷4体ずつ召喚！`;
        changeHp(-dmg);
        extraEnemies = [
          ...Array(4).fill(null).map(() => ({ monsterId: 'exs_minion', hp: 100, maxHp: 100 })),
          ...Array(4).fill(null).map(() => ({ monsterId: 'lightning_minion', hp: 60, maxHp: 60 })),
        ];
      } else if (action === 'cannon_create') {
        logText = `💣 キャノンクリエイト！キャノン付きゾンビを召喚！`;
        logColor = '#8a92b2';
        extraEnemies = [{ monsterId: 'cannon_zombie', hp: 120, maxHp: 120 }];
      } else if (action === 'summon_combat') {
        logText = `⚔️ サモン:コンバット！コンバットを召喚！`;
        logColor = '#8a92b2';
        extraEnemies = [{ monsterId: 'combat_minion', hp: 80, maxHp: 80 }];
      } else if (action === 'stork_ex') {
        logText = `🤖 ストークエクス！エクスを召喚！`;
        logColor = '#8a92b2';
        extraEnemies = [{ monsterId: 'exs_minion', hp: 100, maxHp: 100 }];
      } else {
        logText = `👾 眷属召喚！ロウムアーマーとデスアーマーが現れた！`;
        logColor = '#e05555';
        extraEnemies = spawnKxMinions(kx.phase);
      }

      // 燃焼ダメージ
      if (kx.burnTurns > 0) {
        const bDmg = 8;
        changeHp(-bDmg);
        newKxBurnTurns = kx.burnTurns - 1;
        logText += ` 🔥燃焼${bDmg}ダメ(残${newKxBurnTurns}T)`;
      }
      newLog.push({ text: logText, color: logColor });

      const liveEnemies = newBattle.enemies.filter(e => e.hp > 0);
      const finalEnemies = [...liveEnemies, ...extraEnemies];
      const updatedKx: KxState = { ...kx, burnTurns: newKxBurnTurns };

      if (player.stats.hp - dmg <= 0) {
        return { ...newBattle, kx: updatedKx, enemies: finalEnemies, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
      }
      return { ...newBattle, kx: updatedKx, enemies: finalEnemies, log: newLog, turn: 'player', isDefending: false };
    }

    // 生存敵が順に攻撃
    for (const enemy of aliveAfterPassive) {
      const monster = getMergedMonster(enemy.monsterId);
      if (!monster) continue;

      // Goliathシールドによるスタン：このターン攻撃不可
      const enemyIdx = newBattle.enemies.findIndex(e => e === enemy || (e.monsterId === enemy.monsterId && e.hp === enemy.hp));
      if (newBattle.goliathStunnedEnemyIdx >= 0 && enemyIdx === newBattle.goliathStunnedEnemyIdx) {
        newLog.push({ text: `🛡️ ${monster.name}はGoliathの力で攻撃できない！`, color: '#00e5ff' });
        // スタンリセット（1回のみ有効）
        newBattle = { ...newBattle, goliathStunnedEnemyIdx: -1 };
        continue;
      }

      // デビルアーマー系スキル処理
      if (monster.id === 'devil_armor' || monster.id === 'dead_armor') {
        const warningInterval = monster.id === 'dead_armor' ? 5 : 10;
        const penetrateInterval = warningInterval;
        // 警告ターン（貫通の1ターン前）
        if (newSkillTurn % penetrateInterval === penetrateInterval - 1) {
          newLog.push({ text: `😨 ${monster.name}：「不穏な予感がする....」`, color: '#cc44ff' });
        }
        // 貫通攻撃ターン
        if (newSkillTurn % penetrateInterval === 0 && newSkillTurn > 0) {
          const penDmg = 10000;
          changeHp(-penDmg);
          const newPlayerHp = Math.max(0, player.stats.hp - penDmg);
          newLog.push({ text: `💀 ${monster.name}の貫通攻撃！ 防御無視で${penDmg}ダメージ！`, color: '#ff0055' });
          if (newPlayerHp <= 0) {
            return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
          }
          continue;
        }
        // 通常攻撃
        const mDmg = calcDamage(monster.attack, newBattle.isDefending ? getPlayerDef() * 2 : getPlayerDef());
        const reducedDmg = newBattle.isDefending ? Math.floor(mDmg * 0.5) : mDmg;
        changeHp(-reducedDmg);
        const newPlayerHp2 = Math.max(0, player.stats.hp - reducedDmg);
        newLog.push({ text: `🐉 ${monster.name}の攻撃！ あなたに${reducedDmg}ダメージ${newBattle.isDefending ? '（防御中）' : ''}`, color: '#e05555' });
        if (newPlayerHp2 <= 0) {
          return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
        }
        continue;
      }

      const isSpecial = monster.isBoss && randomChance(0.2);
      let mDmg = isSpecial
        ? Math.floor(calcDamage(monster.attack, getPlayerDef()) * 1.5)
        : calcDamage(monster.attack, newBattle.isDefending ? getPlayerDef() * 2 : getPlayerDef());
      if (weaponItem?.weaponSkills) {
        const shield = weaponItem.weaponSkills.find(s => s.type === 'hotbar_shield') as WeaponShieldSkill | undefined;
        if (shield) {
          const cut = shield.cutPercent / 100;
          mDmg = Math.max(1, Math.floor(mDmg * (1 - cut)));
        }
      }
      // Goliathシールド：85%カット
      if (newBattle.goliathShieldTurns > 0) {
        mDmg = Math.max(1, Math.floor(mDmg * 0.15));
      }
      const reducedDmg = newBattle.isDefending ? Math.floor(mDmg * 0.5) : mDmg;
      // Goliathシールド：HP以上のダメージが来たらHP10残して耐える
      const currentHp = player.stats.hp;
      if (newBattle.goliathShieldTurns > 0 && reducedDmg >= currentHp && currentHp > 10) {
        changeHp(-(currentHp - 10));
        newLog.push({ text: `🛡️ Goliathが致命打を受けた！HP10で耐えた！`, color: '#00e5ff' });
        newLog.push(isSpecial
          ? { text: `💥 ${monster.name}の特殊攻撃！ しかしGoliathが守った！`, color: '#e05555' }
          : { text: `🐉 ${monster.name}の攻撃！ Goliathが守った！${newBattle.isDefending ? '（防御中）' : ''}`, color: '#e05555' }
        );
        continue;
      }
      changeHp(-reducedDmg);
      const newPlayerHp = Math.max(0, player.stats.hp - reducedDmg);
      newLog.push(isSpecial
        ? { text: `💥 ${monster.name}の特殊攻撃！ あなたに${reducedDmg}ダメージ！`, color: '#e05555' }
        : { text: `🐉 ${monster.name}の攻撃！ あなたに${reducedDmg}ダメージ${newBattle.isDefending ? '（防御中）' : ''}`, color: '#e05555' }
      );
      if (newPlayerHp <= 0) {
        return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
      }
    }
    return { ...newBattle, log: newLog, turn: 'player', isDefending: false };
  }, [player.stats, changeHp, changeSatiety, dungeon, combatLv, localEquip, getPlayerDef]);


  // 攻撃実行（範囲 or ターゲット選択後）
  const executeAttack = (targetIdx: number) => {
    const weaponItem = battle.equippedWeaponId ? ITEM_MASTER[battle.equippedWeaponId] : null;
    const atkBase = weaponItem?.weaponAtk ?? player.stats.attack;
    const isArea = !!weaponItem?.isAreaWeapon;
    const areaPen = weaponItem?.areaPenetrate ?? 0;
    const weaponMsg = weaponItem ? weaponItem.name : '素手';

    const newEnemies = battle.enemies.map((e, i) => {
      if (e.hp <= 0) return e;
      if (!isArea && i !== targetIdx) return e;
      const mon = getMergedMonster(e.monsterId);
      const dmg = areaPen > 0 ? areaPen : calcDamage(atkBase, mon?.defense ?? 0);
      return { ...e, hp: Math.max(0, e.hp - dmg) };
    });

    const totalDmg = battle.enemies.reduce((acc, e, i) => {
      if (e.hp <= 0) return acc;
      if (!isArea && i !== targetIdx) return acc;
      const mon = getMergedMonster(e.monsterId);
      return acc + (areaPen > 0 ? areaPen : calcDamage(atkBase, mon?.defense ?? 0));
    }, 0);

    const logMsg = isArea
      ? { text: `🌀 ${weaponMsg}で全体攻撃！ 合計${totalDmg}ダメージ！`, color: '#4caf87' }
      : { text: `⚔️ ${weaponMsg}で攻撃！ ${totalDmg}ダメージ！`, color: '#4caf87' };
    let newLog = [...battle.log, logMsg];

    // === KXモード: 眷属討伐でKXにダメージ ===
    if (battle.kx && !battle.kx.isAwakened) {
      const KX_MAX_HP = battle.kx.maxHp;
      const MINION_DMG: Record<string, number> = {
        roam_armor: Math.floor(KX_MAX_HP * 0.04),
        death_armor: Math.floor(KX_MAX_HP * 0.08),
      };
      let newKxHp = battle.kx.hp;
      let newDrops: {itemId:string;amount:number}[] = [];
      for (let i = 0; i < newEnemies.length; i++) {
        const prev = battle.enemies[i];
        const next = newEnemies[i];
        if (prev.hp > 0 && next.hp <= 0) {
          const fixedDmg = MINION_DMG[prev.monsterId];
          if (fixedDmg) {
            newKxHp = Math.max(0, newKxHp - fixedDmg);
            newLog.push({ text: `💥 ${getMergedMonster(prev.monsterId)?.name}を倒した！KX-G21に${fixedDmg}ダメージ！(HP: ${newKxHp}/${KX_MAX_HP})`, color: '#f0c060' });
          }
          if (prev.monsterId === 'roam_armor') newDrops.push({ itemId: 'mech_armor_oparts', amount: 1 });
          if (prev.monsterId === 'death_armor') newDrops.push({ itemId: 'rusty_mystery_obj', amount: 1 });
        }
      }
      if (newDrops.length > 0) addItems(newDrops);

      if (newKxHp <= 0) {
        // KX撃破 → 20%で覚醒
        if (secureRandom() < 0.2) {
          newLog.push({ text: '「さぁ、延長戦の始まりだ！」 KX-G21が覚醒した！', color: '#ff00ff' });
          const awakeKx: KxState = { ...battle.kx, hp: 0, isAwakened: true, awakeHp: battle.kx.awakeMaxHp, burnTurns: 0 };
          const after: TurnBattleState = { ...battle, enemies: [], log: newLog, turn: 'player', kx: awakeKx, pendingAction: null };
          setBattle(after);
        } else {
          newLog.push({ text: '🏆 KX-G21を討伐した！', color: '#f0c060' });
          addItems([{ itemId: 'super_spanner', amount: 10 }, { itemId: 'makai_bihin', amount: 10 }, { itemId: 'kx_mech_track', amount: 1 }]);
          setBattle(b => ({ ...b, enemies: newEnemies, log: [...newLog], turn: 'result', result: 'win', kx: { ...battle.kx!, hp: 0 }, pendingAction: null }));
        }
        return;
      }

      // フェーズ変化チェック
      const pct = newKxHp / KX_MAX_HP * 100;
      let newPhase = battle.kx.phase;
      if (pct <= 30 && newPhase < 4) newPhase = 4;
      else if (pct <= 50 && newPhase < 3) newPhase = 3;
      else if (pct <= 80 && newPhase < 2) newPhase = 2;
      const phaseMessages: Record<number, string> = {
        2: 'KX-G21.軽度の損傷を確認...攻撃方法を変更します...',
        3: 'KX-G21...ｷﾞｷﾞ...中度ﾉ損傷を確認...魔術回路を構成ｼまス...',
        4: 'KX-G21...ﾌｶイ損ｼｮ...ｦｶｸﾆﾝ...リミｯﾀｰヲかｲｼﾞｮｼまｽ..',
      };
      if (newPhase !== battle.kx.phase) {
        newLog.push({ text: `🔴 【第${newPhase}形態】${phaseMessages[newPhase]}`, color: '#ff6b6b' });
      }

      // 全眷属討伐でKXが再召喚
      const aliveAfter = newEnemies.filter(e => e.hp > 0);
      let finalEnemies = newEnemies;
      if (aliveAfter.length === 0 && newKxHp > 0) {
        newLog.push({ text: 'KX-G21が眷属を再召喚した！', color: '#e05555' });
        finalEnemies = spawnKxMinions(newPhase);
      }

      const updatedKx: KxState = { ...battle.kx, hp: newKxHp, phase: newPhase };
      const after: TurnBattleState = { ...battle, enemies: finalEnemies, log: newLog, turn: 'monster', isDefending: false, pendingAction: null, kx: updatedKx };
      setBattle(after);
      setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
      return;
    }

    // KX覚醒モード: 直接攻撃
    if (battle.kx?.isAwakened) {
      const newAwakeHp = Math.max(0, battle.kx.awakeHp - totalDmg);
      newLog.push({ text: `⚔️ KX覚醒に${totalDmg}ダメージ！(HP: ${newAwakeHp}/${battle.kx.awakeMaxHp})`, color: '#5b8dee' });
      if (newAwakeHp <= 0) {
        newLog.push({ text: '🏆 KX-G21[ライフエナジー]を討伐した！', color: '#f0c060' });
        addItems([{ itemId: 'life_control_core', amount: 1 }]);
        setBattle(b => ({ ...b, log: [...newLog], turn: 'result', result: 'win', kx: { ...battle.kx!, awakeHp: 0 }, pendingAction: null }));
        return;
      }
      const after: TurnBattleState = { ...battle, log: newLog, turn: 'monster', isDefending: false, pendingAction: null, kx: { ...battle.kx, awakeHp: newAwakeHp } };
      setBattle(after);
      setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
      return;
    }

    // 通常モード
    const alive = newEnemies.filter(e => e.hp > 0);
    if (alive.length === 0) {
      const { exp, gold, drops } = calcWinRewards(newEnemies);
      setBattle(b => ({ ...b, enemies: newEnemies, log: [...newLog, { text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' }], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, pendingAction: null }));
      return;
    }
    const after: TurnBattleState = { ...battle, enemies: newEnemies, log: newLog, turn: 'monster', isDefending: false, pendingAction: null };
    setBattle(after);
    setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
  };

  // プレイヤー行動: 攻撃
  const handleAttack = () => {
    if (battle.turn !== 'player' || battle.result) return;
    const weaponItem = battle.equippedWeaponId ? ITEM_MASTER[battle.equippedWeaponId] : null;
    const isArea = !!weaponItem?.isAreaWeapon;
    const alive = battle.enemies.filter(e => e.hp > 0);
    if (!isArea && alive.length > 1) {
      // 単発 + 複数敵 → ターゲット選択
      setBattle(b => ({ ...b, turn: 'select_target', pendingAction: { type: 'attack' } }));
      return;
    }
    const targetIdx = battle.enemies.findIndex(e => e.hp > 0);
    executeAttack(targetIdx);
  };

  // 必殺技発動
  const handleUltimate = () => {
    if (battle.turn !== 'player' || battle.result || !battle.ultimateReady) return;
    const weaponItem = battle.equippedWeaponId ? ITEM_MASTER[battle.equippedWeaponId] : null;
    const ult = weaponItem?.weaponUltimate;
    if (!ult) return;

    let dmgTotal = 0;
    const logEntries: { text: string; color: string }[] = [];
    logEntries.push({ text: `💫 必殺技「${ult.name}」発動！`, color: '#f0c060' });

    if (ult.physDamage && ult.physHits) {
      dmgTotal += ult.physDamage * ult.physHits;
      logEntries.push({ text: `⚔️ 物理${ult.physDamage}×${ult.physHits}ヒット！ 合計${ult.physDamage * ult.physHits}ダメージ！`, color: '#4caf87' });
    }
    if (ult.penetrateDamage && ult.penetrateHits) {
      dmgTotal += ult.penetrateDamage * ult.penetrateHits;
      logEntries.push({ text: `🔱 貫通${ult.penetrateDamage}×${ult.penetrateHits}ヒット！ 合計${ult.penetrateDamage * ult.penetrateHits}ダメージ！`, color: '#9b6df0' });
    }
    logEntries.push({ text: `💥 総ダメージ：${dmgTotal}！`, color: '#f0c060' });

    const newPoisonBuff = ult.postBuffTurns ?? 0;
    const newPoisonDmg = ult.postBuffPoisonDmg ?? 0;
    if (newPoisonBuff > 0) logEntries.push({ text: `☠️ ${newPoisonBuff}ターン毒付与！（毎ターン${newPoisonDmg}ダメージ）`, color: '#9b6df0' });

    // 毒を共通バフ配列に追加
    let newBuffsAfterUlt = battle.buffs ? [...battle.buffs] : [];
    if (newPoisonBuff > 0) {
      const existingPoison = newBuffsAfterUlt.findIndex(b => b.type === 'poison');
      const poisonBuff = { type: 'poison', value: newPoisonDmg, turns: newPoisonBuff };
      if (existingPoison >= 0) {
        newBuffsAfterUlt[existingPoison] = poisonBuff;
      } else {
        newBuffsAfterUlt = [...newBuffsAfterUlt, poisonBuff];
      }
    }

    // 必殺技は全体攻撃
    const newEnemies = battle.enemies.map(e =>
      e.hp > 0 ? { ...e, hp: Math.max(0, e.hp - dmgTotal) } : e
    );

    // KXモード: 眷属討伐でKXにダメージ
    if (battle.kx && !battle.kx.isAwakened) {
      const KX_MAX_HP = battle.kx.maxHp;
      const MINION_DMG: Record<string, number> = {
        roam_armor: Math.floor(KX_MAX_HP * 0.04),
        death_armor: Math.floor(KX_MAX_HP * 0.08),
      };
      let newKxHp = battle.kx.hp;
      for (let i = 0; i < newEnemies.length; i++) {
        if (battle.enemies[i].hp > 0 && newEnemies[i].hp <= 0) {
          const fd = MINION_DMG[battle.enemies[i].monsterId];
          if (fd) {
            newKxHp = Math.max(0, newKxHp - fd);
            logEntries.push({ text: `💥 ${getMergedMonster(battle.enemies[i].monsterId)?.name}撃破！KX-G21に${fd}ダメージ！(HP: ${newKxHp}/${KX_MAX_HP})`, color: '#f0c060' });
          }
        }
      }
      if (newKxHp <= 0) {
        if (secureRandom() < 0.2) {
          logEntries.push({ text: '「さぁ、延長戦の始まりだ！」 KX-G21が覚醒した！', color: '#ff00ff' });
          const awakeKx: KxState = { ...battle.kx, hp: 0, isAwakened: true, awakeHp: battle.kx.awakeMaxHp, burnTurns: 0 };
          setBattle(b => ({ ...b, enemies: [], log: [...b.log, ...logEntries], turn: 'player', kx: awakeKx, weaponMana: 0, ultimateReady: false }));
        } else {
          logEntries.push({ text: '🏆 KX-G21を討伐した！', color: '#f0c060' });
          addItems([{ itemId: 'super_spanner', amount: 10 }, { itemId: 'makai_bihin', amount: 10 }, { itemId: 'kx_mech_track', amount: 1 }]);
          setBattle(b => ({ ...b, enemies: newEnemies, log: [...b.log, ...logEntries], turn: 'result', result: 'win', kx: { ...battle.kx!, hp: 0 }, weaponMana: 0, ultimateReady: false }));
        }
        return;
      }
      const pct = newKxHp / KX_MAX_HP * 100;
      let np = battle.kx.phase;
      if (pct <= 30 && np < 4) np = 4;
      else if (pct <= 50 && np < 3) np = 3;
      else if (pct <= 80 && np < 2) np = 2;
      const aliveAfter = newEnemies.filter(e => e.hp > 0);
      let finalEnemies = newEnemies;
      if (aliveAfter.length === 0 && newKxHp > 0) {
        logEntries.push({ text: 'KX-G21が眷属を再召喚した！', color: '#e05555' });
        finalEnemies = spawnKxMinions(np);
      }
      const afterUlt: TurnBattleState = { ...battle, enemies: finalEnemies, log: [...battle.log, ...logEntries], turn: 'monster', isDefending: false, weaponMana: 0, ultimateReady: false, poisonBuff: newPoisonBuff, poisonDmg: newPoisonDmg, buffs: newBuffsAfterUlt, kx: { ...battle.kx, hp: newKxHp, phase: np } };
      setBattle(afterUlt);
      setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
      return;
    }

    // KX覚醒モード
    if (battle.kx?.isAwakened) {
      const newAwakeHp = Math.max(0, battle.kx.awakeHp - dmgTotal);
      logEntries.push({ text: `⚔️ KX覚醒に必殺技${dmgTotal}ダメージ！(HP: ${newAwakeHp}/${battle.kx.awakeMaxHp})`, color: '#5b8dee' });
      if (newAwakeHp <= 0) {
        logEntries.push({ text: '🏆 KX-G21[ライフエナジー]を討伐した！', color: '#f0c060' });
        addItems([{ itemId: 'life_control_core', amount: 1 }]);
        setBattle(b => ({ ...b, log: [...b.log, ...logEntries], turn: 'result', result: 'win', kx: { ...battle.kx!, awakeHp: 0 }, weaponMana: 0, ultimateReady: false }));
        return;
      }
      const afterUlt: TurnBattleState = { ...battle, log: [...battle.log, ...logEntries], turn: 'monster', isDefending: false, weaponMana: 0, ultimateReady: false, poisonBuff: newPoisonBuff, poisonDmg: newPoisonDmg, buffs: newBuffsAfterUlt, kx: { ...battle.kx, awakeHp: newAwakeHp } };
      setBattle(afterUlt);
      setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
      return;
    }

    const alive = newEnemies.filter(e => e.hp > 0);
    if (alive.length === 0) {
      const { exp, gold, drops } = calcWinRewards(newEnemies);
      logEntries.push({ text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' });
      setBattle(b => ({ ...b, enemies: newEnemies, log: [...b.log, ...logEntries], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, weaponMana: 0, ultimateReady: false }));
      return;
    }
    const afterUlt: TurnBattleState = { ...battle, enemies: newEnemies, log: [...battle.log, ...logEntries], turn: 'monster', isDefending: false, weaponMana: 0, ultimateReady: false, poisonBuff: newPoisonBuff, poisonDmg: newPoisonDmg, buffs: newBuffsAfterUlt };
    setBattle(afterUlt);
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
    if (!item) { addNotification('warning', `アイテムが見つかりません`); return; }
    // クールダウンチェック
    const remainingCd = battle.itemCooldowns[itemId] ?? 0;
    if (remainingCd > 0) { addNotification('warning', `${item.name}はクールダウン中です（残り${remainingCd}ターン）`); return; }

    if (item.itemType === 'Weapon') {
      // Goliathシールド特別処理：攻撃ではなくシールド発動
      const goliathSkill = item.weaponSkills?.find(s => s.type === 'goliath_shield') as import('../../types/game').WeaponGoliathSkill | undefined;
      if (goliathSkill) {
        const randomAliveIdx = battle.enemies.reduce<number[]>((acc, e, i) => e.hp > 0 ? [...acc, i] : acc, []);
        const finalStunIdx = randomAliveIdx.length > 0
          ? randomAliveIdx[Math.floor(Math.random() * randomAliveIdx.length)]
          : -1;
        const newCooldowns = { ...battle.itemCooldowns, [itemId]: goliathSkill.cooldownTurns };
        const logMsg = item.useEffect?.message ?? '魔造壊盾=Goliath=を発動！';
        const stunMonName = finalStunIdx >= 0 ? (getMergedMonster(battle.enemies[finalStunIdx].monsterId)?.name ?? '敵') : '';
        const stunnedMsg = finalStunIdx >= 0 ? ` ${stunMonName}は次のフェーズ攻撃不可！` : '';
        const afterGoliath: TurnBattleState = {
          ...battle,
          log: [...battle.log,
            { text: `🛡️ ${logMsg}`, color: '#00e5ff' },
            { text: `🛡️ 3ターン間ダメージ85%カット！${stunnedMsg}`, color: '#00e5ff' },
          ],
          turn: 'monster',
          isDefending: false,
          goliathShieldTurns: goliathSkill.shieldTurns,
          goliathStunnedEnemyIdx: finalStunIdx,
          itemCooldowns: newCooldowns,
          equippedWeaponId: itemId,
        };
        setBattle(afterGoliath);
        setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
        return;
      }
      const isArea = !!item.isAreaWeapon;
      const alive = battle.enemies.filter(e => e.hp > 0);
      // equippedWeaponId を更新してから executeAttack に委譲
      setBattle(b => ({ ...b, equippedWeaponId: itemId }));
      if (!isArea && alive.length > 1 && !battle.kx?.isAwakened) {
        setBattle(b => ({ ...b, turn: 'select_target', pendingAction: { type: 'weapon', itemId }, equippedWeaponId: itemId }));
        return;
      }
      const targetIdx = battle.enemies.findIndex(e => e.hp > 0);
      // 少し遅らせて state 更新を待つ
      setTimeout(() => {
        setBattle(prev => {
          const newBattle = { ...prev, equippedWeaponId: itemId };
          // executeAttack の参照が古い battle を使うため、直接計算
          const isAreaW = !!item.isAreaWeapon;
          const areaPen = item.areaPenetrate ?? 0;
          const atkBase = item.weaponAtk ?? (item.useEffect?.attackBonus ? player.stats.attack + item.useEffect.attackBonus : player.stats.attack);
          const newEnemies = prev.enemies.map((e, i) => {
            if (e.hp <= 0) return e;
            if (!isAreaW && i !== targetIdx) return e;
            const mon = getMergedMonster(e.monsterId);
            const dmg = areaPen > 0 ? areaPen : calcDamage(atkBase, mon?.defense ?? 0);
            return { ...e, hp: Math.max(0, e.hp - dmg) };
          });
          const msg = item.useEffect?.message ?? `${item.name}で攻撃した`;
          let logEntries: { text: string; color: string }[] = [{ text: `🗡️ ${msg}`, color: '#f0c060' }];

          // KXモード: 眷属討伐でKXにダメージ
          if (prev.kx && !prev.kx.isAwakened) {
            const KX_MAX_HP = prev.kx.maxHp;
            const MINION_DMG: Record<string, number> = {
              roam_armor: Math.floor(KX_MAX_HP * 0.04),
              death_armor: Math.floor(KX_MAX_HP * 0.08),
            };
            let newKxHp = prev.kx.hp;
            for (let i = 0; i < newEnemies.length; i++) {
              if (prev.enemies[i].hp > 0 && newEnemies[i].hp <= 0) {
                const fd = MINION_DMG[prev.enemies[i].monsterId];
                if (fd) {
                  newKxHp = Math.max(0, newKxHp - fd);
                  logEntries.push({ text: `💥 ${getMergedMonster(prev.enemies[i].monsterId)?.name}撃破！KX-G21に${fd}ダメージ！(HP: ${newKxHp}/${KX_MAX_HP})`, color: '#f0c060' });
                }
              }
            }
            if (newKxHp <= 0) {
              if (secureRandom() < 0.2) {
                logEntries.push({ text: '「さぁ、延長戦の始まりだ！」 KX-G21が覚醒した！', color: '#ff00ff' });
                return { ...newBattle, enemies: [], log: [...prev.log, ...logEntries], turn: 'player', kx: { ...prev.kx, hp: 0, isAwakened: true, awakeHp: prev.kx.awakeMaxHp, burnTurns: 0 } };
              }
              addItems([{ itemId: 'super_spanner', amount: 10 }, { itemId: 'makai_bihin', amount: 10 }, { itemId: 'kx_mech_track', amount: 1 }]);
              logEntries.push({ text: '🏆 KX-G21を討伐した！', color: '#f0c060' });
              return { ...newBattle, enemies: newEnemies, log: [...prev.log, ...logEntries], turn: 'result', result: 'win', kx: { ...prev.kx, hp: 0 } };
            }
            let np = prev.kx.phase;
            const pct = newKxHp / KX_MAX_HP * 100;
            if (pct <= 30 && np < 4) np = 4;
            else if (pct <= 50 && np < 3) np = 3;
            else if (pct <= 80 && np < 2) np = 2;
            const aliveAfter = newEnemies.filter(e => e.hp > 0);
            const finalEnemies = aliveAfter.length === 0 ? spawnKxMinions(np) : newEnemies;
            if (aliveAfter.length === 0) logEntries.push({ text: 'KX-G21が眷属を再召喚した！', color: '#e05555' });
            return { ...newBattle, enemies: finalEnemies, log: [...prev.log, ...logEntries], turn: 'monster', isDefending: false, kx: { ...prev.kx, hp: newKxHp, phase: np } };
          }

          // KX覚醒
          if (prev.kx?.isAwakened) {
            const newAwakeHp = Math.max(0, prev.kx.awakeHp - atkBase);
            logEntries.push({ text: `⚔️ KX覚醒に${atkBase}ダメージ！(HP: ${newAwakeHp}/${prev.kx.awakeMaxHp})`, color: '#5b8dee' });
            if (newAwakeHp <= 0) {
              addItems([{ itemId: 'life_control_core', amount: 1 }]);
              return { ...newBattle, log: [...prev.log, ...logEntries, { text: '🏆 KX-G21[ライフエナジー]を討伐した！', color: '#f0c060' }], turn: 'result', result: 'win', kx: { ...prev.kx, awakeHp: 0 } };
            }
            return { ...newBattle, log: [...prev.log, ...logEntries], turn: 'monster', isDefending: false, kx: { ...prev.kx, awakeHp: newAwakeHp } };
          }

          // 通常モード
          const aliveAfter = newEnemies.filter(e => e.hp > 0);
          if (aliveAfter.length === 0) {
            const { exp, gold, drops } = calcWinRewards(newEnemies);
            logEntries.push({ text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' });
            return { ...newBattle, enemies: newEnemies, log: [...prev.log, ...logEntries], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops };
          }
          return { ...newBattle, enemies: newEnemies, log: [...prev.log, ...logEntries], turn: 'monster', isDefending: false };
        });
        setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
      }, 0);
      return;
    }

    if (item.itemType === 'Heal') {
      if (!item.useEffect) { addNotification('warning', `${item.name}は使用できません`); return; }
      if (!item.nonconsumable) {
        const ok = consumeItem(itemId, 1);
        if (!ok) { addNotification('warning', `${item.name}が足りません`); return; }
      }
      const { hpRestore, satietyRestore, message } = item.useEffect;
      if (hpRestore && hpRestore > 0) changeHp(hpRestore);
      if (satietyRestore && satietyRestore > 0) changeSatiety(satietyRestore);
      const healParts = [];
      if (hpRestore && hpRestore > 0) healParts.push(`HP+${hpRestore}`);
      if (satietyRestore && satietyRestore > 0) healParts.push(`満腹+${satietyRestore}`);
      const logMsg = message ?? `${item.name}を使用した`;
      const logEntries: { text: string; color: string }[] = [{ text: `🧪 ${logMsg}${healParts.length ? ` (${healParts.join(', ')})` : ''}`, color: '#4caf87' }];
      // クールダウン設定
      const newCooldownsAfterHeal = { ...battle.itemCooldowns };
      if (item.cooldownTurns && item.cooldownTurns > 0) newCooldownsAfterHeal[itemId] = item.cooldownTurns;
      // ===== 共通Manaシステム：offhand_mana_on_heal処理 =====
      // 回復アイテム使用時に共通Manaを獲得する。Diamond Staffなどのオフハンド武器が対象。
      let manaAfterHeal = battle.weaponMana;
      for (const slotId of localEquip.hotbar) {
        if (!slotId) continue;
        const slotItem = ITEM_MASTER[slotId];
        if (!slotItem?.weaponSkills) continue;
        for (const skill of slotItem.weaponSkills) {
          if (skill.type === 'offhand_mana_on_heal') {
            const s = skill as import('../../types/game').WeaponOffhandManaOnHealSkill;
            // オフハンドアイテムがhotbarにあれば発動
            const hasOffhand = localEquip.hotbar.includes(s.offhandItemId);
            if (hasOffhand && secureRandom() < s.chance) {
              manaAfterHeal = Math.min(manaAfterHeal + s.manaGain, battle.weaponManaMax);
              logEntries.push({ text: `✨ ${slotItem.name}のスキル発動！Mana+${s.manaGain}！(${manaAfterHeal}/${battle.weaponManaMax})`, color: '#f0c060' });
            }
          }
        }
      }
      const afterItem: TurnBattleState = { ...battle, log: [...battle.log, ...logEntries], turn: 'monster', isDefending: false, itemCooldowns: newCooldownsAfterHeal, weaponMana: manaAfterHeal, ultimateReady: manaAfterHeal >= battle.weaponManaMax };
      setBattle(afterItem);
      setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
      return;
    }

    if (!item.useEffect) { addNotification('warning', `${item?.name}は使用できません`); return; }
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

  // 逃走
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
  // マナ変化を親へ通知
  useEffect(() => {
    if (!battle.result) onManaUpdate?.(battle.weaponMana);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.weaponMana]);

  useEffect(() => {
    if (!battle.result) return;
    if (battle.result === 'win') {
      onManaUpdate?.(0);
      if (kxConfig) {
        kxConfig.onVictory(battle.kx?.isAwakened ?? false);
      } else {
        onBattleEnd(true, battle.expGained, battle.goldGained, battle.drops, 0);
      }
    } else if (battle.result === 'lose') {
      onManaUpdate?.(0);
      if (kxConfig) {
        kxConfig.onDefeat();
      } else {
        onBattleEnd(false, 0, 0, [], 0);
      }
    } else if (battle.result === 'escaped') {
      onManaUpdate?.(battle.weaponMana);
      onEscape();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.result]);

  const hpPct = (player.stats.hp / player.stats.maxHp) * 100;

  return (
    <div style={{ background: '#161b26', border: '2px solid #e05555', borderRadius: 12, padding: 14 }}>
      {/* ターゲット選択モーダル */}
      {battle.turn === 'select_target' && (
        <TargetSelectModal
          enemies={battle.enemies}
          onSelect={(idx) => {
            const pending = battle.pendingAction;
            setBattle(b => ({ ...b, turn: 'player', pendingAction: null }));
            if (pending?.type === 'attack') {
              setTimeout(() => executeAttack(idx), 50);
            } else if (pending?.type === 'weapon' && pending.itemId) {
              const item = ITEM_MASTER[pending.itemId];
              const atkBase = item?.weaponAtk ?? (item?.useEffect?.attackBonus ? player.stats.attack + item.useEffect.attackBonus : player.stats.attack);
              setTimeout(() => {
                setBattle(prev => {
                  const newEnemies = prev.enemies.map((e, i) => {
                    if (e.hp <= 0 || i !== idx) return e;
                    const mon = getMergedMonster(e.monsterId);
                    const dmg = calcDamage(atkBase, mon?.defense ?? 0);
                    return { ...e, hp: Math.max(0, e.hp - dmg) };
                  });
                  const logEntries = [{ text: `🗡️ ${item?.name ?? ''}で攻撃！`, color: '#f0c060' }];
                  const alive = newEnemies.filter(e => e.hp > 0);
                  if (alive.length === 0) {
                    const { exp, gold, drops } = calcWinRewards(newEnemies);
                    return { ...prev, enemies: newEnemies, log: [...prev.log, ...logEntries, { text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' }], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, equippedWeaponId: pending.itemId! };
                  }
                  const after: TurnBattleState = { ...prev, enemies: newEnemies, log: [...prev.log, ...logEntries], turn: 'monster', isDefending: false, equippedWeaponId: pending.itemId! };
                  return after;
                });
                setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
              }, 50);
            }
          }}
          onCancel={() => setBattle(b => ({ ...b, turn: 'player', pendingAction: null }))}
        />
      )}

      {/* KXボスHP（KXモード時） */}
      {battle.kx && (
        <div style={{ background: '#0a0d18', border: `2px solid ${battle.kx.isAwakened ? '#ff00ff' : '#f0c060'}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
          {battle.kx.isAwakened ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: '#ff00ff', fontSize: '0.9rem' }}>⚡ KX-G21[ライフエナジー]</span>
                <span style={{ fontSize: '0.75rem', color: '#e05555' }}>{battle.kx.awakeHp}/{battle.kx.awakeMaxHp}</span>
              </div>
              <div style={{ height: 7, background: '#2d3752', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#ff00ff', width: `${(battle.kx.awakeHp / battle.kx.awakeMaxHp) * 100}%`, transition: 'width 0.3s' }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: ['#8a92b2','#f0a830','#e05555','#ff00ff'][battle.kx.phase - 1] ?? '#f0c060', fontSize: '0.9rem' }}>
                  🤖 KX-G21 【第{battle.kx.phase}形態】
                </span>
                <span style={{ fontSize: '0.75rem', color: '#f0c060' }}>{battle.kx.hp}/{battle.kx.maxHp}</span>
              </div>
              <div style={{ height: 7, background: '#2d3752', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', background: '#f0c060', width: `${(battle.kx.hp / battle.kx.maxHp) * 100}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: '0.65rem', color: '#4a5070' }}>※ 眷属（ロウムアーマー/デスアーマー）を倒すとKXにダメージ</div>
            </>
          )}
        </div>
      )}

      {/* 敵HP表示（複数対応） */}
      <div style={{ marginBottom: 10 }}>
        {battle.enemies.map((enemy, i) => {
          const monster = getMergedMonster(enemy.monsterId);
          const mHpPct = (enemy.hp / enemy.maxHp) * 100;
          const isDead = enemy.hp <= 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, opacity: isDead ? 0.35 : 1 }}>
              <span style={{ fontSize: '2.2rem' }}><GameIcon id={monster?.icon ?? 'skull'} size={36} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: isDead ? '#4a5070' : '#e05555', fontSize: '0.88rem' }}>
                  {monster?.name ?? '?'}{monster?.isBoss && ' 👑'}{isDead && ' 💀'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#8a92b2', marginBottom: 2 }}>HP {enemy.hp}/{enemy.maxHp}</div>
                <div style={{ height: 5, background: '#2d3752', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: isDead ? '#4a5070' : '#e05555', width: `${mHpPct}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
              {battle.turn === 'monster' && !battle.result && !isDead && (
                <span style={{ fontSize: '1rem', animation: 'pulse 0.5s infinite' }}>⚡</span>
              )}
            </div>
          );
        })}
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
      {(() => {
        return (
          <div
            style={{ background: '#0e1220', borderRadius: 6, padding: '6px 8px', height: 160, overflowY: 'auto', marginBottom: 10, fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 1 }}
            ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
          >
            {battle.log.map((l, i) => (
              <div key={i} style={{ color: l.color, padding: '1px 0', lineHeight: 1.4 }}>{l.text}</div>
            ))}
          </div>
        );
      })()}

      {/* 行動ボタン */}
      {!battle.result && battle.turn !== 'select_target' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
            <button onClick={handleAttack} disabled={battle.turn !== 'player'}
              style={{ padding: '10px', background: battle.turn === 'player' ? 'linear-gradient(135deg,#e05555,#c03030)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: battle.turn === 'player' ? 'pointer' : 'not-allowed', fontWeight: 700 }}>
              {(() => { const wi = battle.equippedWeaponId ? ITEM_MASTER[battle.equippedWeaponId] : null; return wi?.isAreaWeapon ? '🌀 全体攻撃' : '⚔️ 攻撃'; })()}
            </button>
            <button onClick={handleDefend} disabled={battle.turn !== 'player'}
              style={{ padding: '10px', background: battle.turn === 'player' ? 'linear-gradient(135deg,#5b8dee,#3d6fd0)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: battle.turn === 'player' ? 'pointer' : 'not-allowed', fontWeight: 700 }}>
              🛡️ 防御
            </button>
          </div>

          {/* 必殺技・MANAバー */}
          {battle.equippedWeaponId && (() => {
            const wi = ITEM_MASTER[battle.equippedWeaponId!];
            const hasUlt = !!wi?.weaponUltimate;
            const hasMana = wi?.weaponSkills?.some(s => s.type === 'mana_charge');
            if (!hasUlt && !hasMana) return null;
            return (
              <div style={{ marginBottom: 8 }}>
                {hasMana && (
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: '0.7rem', color: '#f0c060', display: 'flex', justifyContent: 'space-between' }}>
                      <span>⭐ MANA</span>
                      <span>{battle.weaponMana}/{battle.weaponManaMax}</span>
                    </div>
                    <div style={{ height: 5, background: '#2d3752', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
                      <div style={{ height: '100%', background: battle.ultimateReady ? '#f0c060' : '#9b6df0', width: `${(battle.weaponMana / battle.weaponManaMax) * 100}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
                {hasUlt && (
                  <button onClick={handleUltimate}
                    disabled={!battle.ultimateReady || battle.turn !== 'player'}
                    style={{ width: '100%', padding: '8px', background: battle.ultimateReady && battle.turn === 'player' ? 'linear-gradient(135deg,#f0c060,#e0a020)' : '#2d3752', color: battle.ultimateReady ? '#000' : '#4a5070', border: 'none', borderRadius: 8, cursor: battle.ultimateReady && battle.turn === 'player' ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.85rem' }}>
                    💫 必殺技「{wi?.weaponUltimate?.name}」{!battle.ultimateReady ? `（MANA ${battle.weaponMana}/${battle.weaponManaMax}）` : ''}
                  </button>
                )}
              </div>
            );
          })()}

          {/* ホットバーアイテム使用 */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {localEquip.hotbar.map((itemId, i) => {
              const item = itemId ? ITEM_MASTER[itemId] : null;
              const qty = itemId ? (player.inventory[itemId] ?? 0) : 0;
              const cd = itemId ? (battle.itemCooldowns[itemId] ?? 0) : 0;
              return (
                <button key={i} onClick={() => handleUseHotbarItem(i)}
                  disabled={battle.turn !== 'player' || !item || qty === 0 || cd > 0}
                  title={item ? `${item.name} ×${qty}${cd > 0 ? ` (CD:${cd})` : ''}` : `スロット${i+1}（空）`}
                  style={{
                    width: 38, height: 38, background: cd > 0 ? 'rgba(80,80,80,0.4)' : item && qty > 0 ? 'rgba(155,109,240,0.2)' : '#161b26',
                    border: `1px solid ${cd > 0 ? '#555' : item && qty > 0 ? '#9b6df0' : '#2d3752'}`, borderRadius: 6,
                    cursor: item && qty > 0 && battle.turn === 'player' && cd === 0 ? 'pointer' : 'not-allowed',
                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  {item
                    ? <><GameIcon id={item.icon} size={18} />
                        {cd > 0
                          ? <span style={{ position:'absolute', bottom:1, right:2, fontSize:'0.5rem', color:'#ff9999' }}>{cd}</span>
                          : <span style={{ position:'absolute', bottom:1, right:2, fontSize:'0.5rem', color:'#f0c060' }}>{qty}</span>}
                      </>
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
            setLocalEquipAndSave(prev => {
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
// ============================================================
// ガチャパネル
// ============================================================
const GACHA_TABLE = [
  { id: 'revolution_sword',          rate: 0.03, label: '⚔️ Revolution Sword',         rarity: '★★★' },
  { id: 'revolution_armor_set',      rate: 0.03, label: '🛡️ Revolution Armor (一式)',   rarity: '★★★' },
  { id: 'revolution_healwand',       rate: 0.03, label: '🪄 Revolution Healwand',       rarity: '★★★' },
  { id: 'revolution_defencer',       rate: 0.03, label: '🔰 Revolution Defencer',       rarity: '★★★' },
  { id: 'gacha_multiplier_ticket',   rate: 0.13, label: '🎫 ギャンブル倍率2倍チケット', rarity: '★★' },
  { id: 'gacha_lose_ticket',         rate: 0.75, label: '💸 ハズレチケット',            rarity: '★' },
];

function GachaPanel({ player, addItems, changeGold, addNotification }: {
  player: import('../../types/game').PlayerData;
  addItems: (items: { itemId: string; amount: number }[]) => void;
  changeGold: (delta: number) => void;
  addNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}) {
  const setPlayer = useGameStore(s => s.setPlayer);
  const addOwnedTool = useGameStore(s => s.addOwnedTool);
  const coins = player.gachaCoins ?? 0;
  const loseTickets = player.inventory?.['gacha_lose_ticket'] ?? 0;

  const pullGacha = () => {
    if (coins < 1) { addNotification('warning', 'ガチャコインが足りません！ダンジョンをクリアして獲得しよう。'); return; }
    setPlayer({ ...player, gachaCoins: coins - 1 });
    // ツールガチャ判定（15%でツール）
    const toolRoll = secureRandom();
    if (toolRoll < 0.15) {
      // ツールガチャ
      let cumTool = 0;
      let pickedTool = TOOL_GACHA_TABLE[TOOL_GACHA_TABLE.length - 1];
      for (const entry of TOOL_GACHA_TABLE) {
        cumTool += entry.rate;
        if (toolRoll / 0.15 < cumTool) { pickedTool = entry; break; }
      }
      addOwnedTool(pickedTool.toolId);
      const toolData = TOOLS_MASTER[pickedTool.toolId];
      const rarityLabel = pickedTool.rarity === '特殊' ? '★★★' : pickedTool.rarity === 'レア' ? '★★' : '★';
      addNotification(pickedTool.rarity === '特殊' ? 'success' : 'info',
        `🔧 ${rarityLabel} ツール【${toolData?.name ?? pickedTool.toolId}】を入手！（ガチャ）`);
      return;
    }
    // 既存ガチャ抽選
    const roll = secureRandom();
    let cumulative = 0;
    let result = GACHA_TABLE[GACHA_TABLE.length - 1];
    for (const entry of GACHA_TABLE) {
      cumulative += entry.rate;
      if (roll < cumulative) { result = entry; break; }
    }
    if (result.id === 'revolution_armor_set') {
      addItems([
        { itemId: 'revolution_armor_helmet', amount: 1 },
        { itemId: 'revolution_armor_chest', amount: 1 },
        { itemId: 'revolution_armor_leggings', amount: 1 },
        { itemId: 'revolution_armor_boots', amount: 1 },
      ]);
    } else {
      addItems([{ itemId: result.id, amount: 1 }]);
    }
    if (result.id === 'gacha_lose_ticket' && loseTickets + 1 >= 20) {
      const newInv = { ...player.inventory, gacha_lose_ticket: (loseTickets + 1) - 20 };
      setPlayer({ ...player, gachaCoins: coins - 1, inventory: newInv });
      changeGold(200000);
      addNotification('success', `🎉 ハズレチケット20枚達成！200,000Gを獲得！`);
      return;
    }
    addNotification(result.rarity === '★★★' ? 'success' : 'info',
      `${result.rarity} ${result.label} を入手！`);
  };

  return (
    <div style={{ padding: '0 0 20px' }}>
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#c864ff', borderBottom: '1px solid #2d3752', paddingBottom: 8, marginBottom: 12 }}>🎰 ダンジョンガチャ</h2>
      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#8a92b2' }}>所持ガチャコイン</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f0c060' }}>🪙 {coins}枚</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#8a92b2' }}>
            <div>ハズレチケット: {loseTickets}/20枚</div>
            <div>20枚→20万G交換</div>
          </div>
        </div>
        <button onClick={pullGacha} disabled={coins < 1}
          style={{ width: '100%', padding: '14px', fontWeight: 700, fontSize: '1rem', background: coins >= 1 ? 'linear-gradient(135deg,#c864ff,#8840cc)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: coins >= 1 ? 'pointer' : 'not-allowed', marginBottom: 8 }}>
          🎰 ガチャを引く（1コイン）
        </button>
        <div style={{ fontSize: '0.72rem', color: '#8a92b2', textAlign: 'center' }}>
          ダンジョンをクリアするとコイン獲得（初級1枚〜極限5枚）
        </div>
      </div>
      <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 10, padding: 12 }}>
        <div style={{ fontWeight: 700, color: '#c864ff', marginBottom: 8, fontSize: '0.85rem' }}>📋 排出確率</div>
        <div style={{ padding: '5px 0', borderBottom: '1px solid #2d3752', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4caf87' }}>
          <span>🔧 採取ツール（全種）</span>
          <span style={{ fontWeight: 700 }}>15%</span>
        </div>
        {GACHA_TABLE.map((e, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < GACHA_TABLE.length - 1 ? '1px solid #2d3752' : 'none' }}>
            <span style={{ fontSize: '0.8rem', color: e.rarity === '★★★' ? '#f0c060' : e.rarity === '★★' ? '#a0c0ff' : '#8a92b2' }}>
              {e.rarity} {e.label}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#e8e6ff', fontWeight: 700 }}>{(e.rate * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// トラップワールドパネル
// ============================================================

type TrapMobId = 'zombie' | 'skeleton' | 'enderman' | 'spider' | 'creeper';

interface TrapMob {
  id: TrapMobId;
  name: string;
  emoji: string;
  color: string;
  normalDrop: string;
  normalDropName: string;
  eliteName: string;
  eliteEmoji: string;
  eliteDrop: string;
  eliteDropName: string;
}

const TRAP_MOBS: TrapMob[] = [
  { id: 'zombie',   name: 'ゾンビ',       emoji: '🧟', color: '#4caf87', normalDrop: 'zombie_flesh',    normalDropName: 'ゾンビ肉',      eliteName: 'コンバットゾンビ',       eliteEmoji: '🧟‍♂️', eliteDrop: 'compressed_zombie_flesh', eliteDropName: '圧縮ゾンビ肉' },
  { id: 'skeleton', name: 'スケルトン',   emoji: '💀', color: '#c8c8c8', normalDrop: 'bone',            normalDropName: '骨',           eliteName: 'リジュリティスケルトン', eliteEmoji: '☠️',  eliteDrop: 'compressed_bone',         eliteDropName: '圧縮骨' },
  { id: 'enderman', name: 'エンダーマン', emoji: '👁️', color: '#8b5cf6', normalDrop: 'ender_eye',       normalDropName: 'エンダーアイ',  eliteName: 'アヴィッドエンダーマン', eliteEmoji: '🌌', eliteDrop: 'compressed_ender_eye',    eliteDropName: '圧縮エンダーアイ' },
  { id: 'spider',   name: 'クモ',         emoji: '🕷️', color: '#a855f7', normalDrop: 'trap_string',     normalDropName: '糸',           eliteName: 'クモン',                 eliteEmoji: '🕸️', eliteDrop: 'compressed_string',        eliteDropName: '圧縮糸' },
  { id: 'creeper',  name: 'クリーパー',   emoji: '💥', color: '#84cc16', normalDrop: 'gunpowder',       normalDropName: '火薬',          eliteName: 'ロードクリーパー',       eliteEmoji: '🔥', eliteDrop: 'compressed_gunpowder',     eliteDropName: '圧縮火薬' },
];

const TRAP_MOB_HP = 20;
const ELITE_MOB_HP = 120;
const ELITE_CHANCE = 0.05;

function TrapWorldPanel({ player, addItems, addNotification }: {
  player: PlayerData;
  addItems: (drops: { itemId: string; amount: number }[]) => void;
  addNotification: (type: 'success' | 'error' | 'info' | 'warning', msg: string) => void;
}) {
  const [_selectedMob, setSelectedMob] = useState<TrapMobId | null>(null);
  const [inTrap, setInTrap] = useState(false);
  const [mobHp, setMobHp] = useState(TRAP_MOB_HP);
  const [mobMaxHp, setMobMaxHp] = useState(TRAP_MOB_HP);
  const [isElite, setIsElite] = useState(false);
  const [currentMob, setCurrentMob] = useState<TrapMob | null>(null);
  const [log, setLog] = useState<{ text: string; color: string }[]>([]);
  const [attackCooldown, setAttackCooldown] = useState(false);
  const equipment = player.equipment ?? defaultEquipmentSlots();

  const getPlayerAtk = () => {
    let atk = player.stats.attack;
    for (const itemId of equipment.hotbar) {
      if (!itemId) continue;
      const item = ITEM_MASTER[itemId];
      if (item?.weaponAtk) { atk = item.weaponAtk; break; }
      if (item?.useEffect?.attackBonus) { atk += item.useEffect.attackBonus; break; }
    }
    return atk;
  };

  const spawnMob = (mob: TrapMob) => {
    const elite = randomChance(ELITE_CHANCE);
    const maxHp = elite ? ELITE_MOB_HP : TRAP_MOB_HP;
    setIsElite(elite);
    setMobMaxHp(maxHp);
    setMobHp(maxHp);
    setCurrentMob(mob);
    setLog([{ text: `${elite ? mob.eliteEmoji + ' [エリート] ' + mob.eliteName : mob.emoji + ' ' + mob.name} が現れた！`, color: elite ? '#f0c060' : '#e8e6ff' }]);
  };

  const enterTrap = (mobId: TrapMobId) => {
    const mob = TRAP_MOBS.find(m => m.id === mobId)!;
    setSelectedMob(mobId);
    setInTrap(true);
    spawnMob(mob);
  };

  const handleAttack = () => {
    if (!currentMob || attackCooldown) return;
    setAttackCooldown(true);
    setTimeout(() => setAttackCooldown(false), 500);
    const atk = getPlayerAtk();
    const dmg = Math.max(1, atk - 0) + randomInt(Math.ceil(atk * 0.2) + 1);
    const newHp = Math.max(0, mobHp - dmg);
    setMobHp(newHp);

    if (newHp <= 0) {
      // ドロップ計算：通常ドロップ120%
      const drops: { itemId: string; amount: number }[] = [];
      if (isElite) {
        // エリートは圧縮ドロップ5〜6個
        const amount = randomIntRange(5, 6);
        drops.push({ itemId: currentMob.eliteDrop, amount });
        addItems(drops);
        addNotification('success', `⭐ ${currentMob.eliteName} 撃破！${currentMob.eliteDropName}×${amount} 入手！`);
        setLog(prev => [...prev,
          { text: `${dmg} ダメージ！`, color: '#5b8dee' },
          { text: `⭐ ${currentMob.eliteName} 撃破！${currentMob.eliteDropName}×${amount} ゲット！`, color: '#f0c060' },
        ]);
      } else {
        // 通常：120%ドロップ = 必ず1個 + 20%で追加
        let amount = 1;
        while (randomChance(0.2) && amount < 3) amount++;
        drops.push({ itemId: currentMob.normalDrop, amount });
        addItems(drops);
        setLog(prev => [...prev,
          { text: `${dmg} ダメージ！`, color: '#5b8dee' },
          { text: `✅ ${currentMob.name} 撃破！${currentMob.normalDropName}×${amount} ゲット！`, color: '#4caf87' },
        ]);
      }
      // 即座に次のモブを湧き出す
      setTimeout(() => spawnMob(currentMob), 300);
    } else {
      setLog(prev => [...prev.slice(-5), { text: `⚔️ ${dmg} ダメージ！残りHP: ${newHp}/${mobMaxHp}`, color: '#5b8dee' }]);
    }
  };

  const exitTrap = () => {
    setInTrap(false);
    setSelectedMob(null);
    setCurrentMob(null);
    setLog([]);
    addNotification('info', '🏃 トラップワールドから離脱した。');
  };

  if (!inTrap) {
    return (
      <div style={{ padding: '4px 0' }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', color: '#ff6464', borderBottom: '1px solid #2d3752', paddingBottom: 8, marginBottom: 12 }}>🕷️ トラップワールド</h2>
        <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: '0.8rem', color: '#8a92b2' }}>
          <div style={{ color: '#ff9966', fontWeight: 700, marginBottom: 4 }}>📖 トラップワールドとは？</div>
          モブが無限に湧き続けます。いつでも離脱可能。<br />
          5%の確率でエリートモブが出現し、圧縮素材を5〜6個ドロップします。<br />
          ホットバーの武器で攻撃力が変わります。
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {TRAP_MOBS.map(mob => (
            <button key={mob.id} onClick={() => enterTrap(mob.id)}
              style={{ background: '#1c2235', border: `2px solid ${mob.color}44`, borderRadius: 10, padding: 12, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{mob.emoji}</div>
              <div style={{ color: mob.color, fontWeight: 700, fontSize: '0.9rem' }}>{mob.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginTop: 2 }}>ドロップ: {mob.normalDropName}</div>
              <div style={{ fontSize: '0.68rem', color: '#f0c060', marginTop: 1 }}>エリート: {mob.eliteDropName}×5〜6</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const mob = currentMob!;
  const hpPct = (mobHp / mobMaxHp) * 100;
  // ホットバー表示用
  const hotbarWeapon = equipment.hotbar.find(id => id && ITEM_MASTER[id]?.itemType === 'Weapon');
  const weaponItem = hotbarWeapon ? ITEM_MASTER[hotbarWeapon] : null;

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', color: '#ff6464', fontSize: '1rem', margin: 0 }}>
          🕷️ トラップワールド — {mob.name}エリア
        </h2>
        <button onClick={exitTrap}
          style={{ padding: '5px 12px', background: '#2d3752', color: '#8a92b2', border: '1px solid #2d3752', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>
          🏃 離脱
        </button>
      </div>

      {/* 武器情報 */}
      <div style={{ background: '#0e1220', border: '1px solid #2d3752', borderRadius: 6, padding: '6px 10px', marginBottom: 8, fontSize: '0.75rem', color: '#8a92b2' }}>
        ⚔️ 装備武器: {weaponItem ? `${weaponItem.name}（ATK +${weaponItem.useEffect?.attackBonus ?? weaponItem.weaponAtk ?? 0}）` : '素手'}
        <span style={{ marginLeft: 8, color: '#5b8dee' }}>ATK: {getPlayerAtk()}</span>
      </div>

      {/* モブ情報 */}
      <div style={{ background: '#161b26', border: `2px solid ${isElite ? '#f0c060' : mob.color}44`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: '2rem' }}>{isElite ? mob.eliteEmoji : mob.emoji}</span>
          <div>
            <div style={{ color: isElite ? '#f0c060' : mob.color, fontWeight: 700 }}>
              {isElite ? `⭐ [エリート] ${mob.eliteName}` : mob.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#8a92b2' }}>
              HP {mobHp}/{mobMaxHp}
            </div>
          </div>
        </div>
        {/* HPバー */}
        <div style={{ height: 10, background: '#2d3752', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: isElite ? '#f0c060' : '#e05555', width: `${hpPct}%`, transition: 'width 0.15s' }} />
        </div>
      </div>

      {/* 攻撃ボタン */}
      <button onClick={handleAttack} disabled={attackCooldown}
        style={{ width: '100%', padding: '16px', fontWeight: 700, fontSize: '1.1rem', background: attackCooldown ? '#2d3752' : 'linear-gradient(135deg,#e05555,#c03030)', color: attackCooldown ? '#4a5070' : '#fff', border: 'none', borderRadius: 8, cursor: attackCooldown ? 'not-allowed' : 'pointer', marginBottom: 10, transition: 'background 0.15s, color 0.15s' }}>
        {attackCooldown ? '…' : '⚔️ 攻撃！'}
      </button>

      {/* ホットバー（消耗品使用） */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {equipment.hotbar.map((itemId, i) => {
          const item = itemId ? ITEM_MASTER[itemId] : null;
          const qty = itemId ? (player.inventory[itemId] ?? 0) : 0;
          if (!item || item.itemType === 'Weapon' || item.itemType === 'Armor') return null;
          if (!item.useEffect || (!item.useEffect.hpRestore && !item.useEffect.satietyRestore)) return null;
          return (
            <button key={i} disabled={attackCooldown || qty <= 0}
              onClick={() => {
                if (!item.useEffect || attackCooldown || qty <= 0) return;
                setAttackCooldown(true);
                setTimeout(() => setAttackCooldown(false), 500);
                const { hpRestore, satietyRestore, message } = item.useEffect;
                useGameStore.getState().consumeItem(itemId!, 1);
                if (hpRestore) useGameStore.getState().changeHp(hpRestore);
                if (satietyRestore) useGameStore.getState().changeSatiety(satietyRestore);
                setLog(prev => [...prev.slice(-5), { text: `🧪 ${item.name} 使用${message ? '：' + message : ''}`, color: '#4caf87' }]);
              }}
              style={{ padding: '6px 8px', background: qty > 0 && !attackCooldown ? '#1c2235' : '#161b26', border: `1px solid ${qty > 0 ? '#2d3752' : '#1c2235'}`, borderRadius: 6, cursor: qty > 0 && !attackCooldown ? 'pointer' : 'not-allowed', fontSize: '0.72rem', color: qty > 0 ? '#e8e6ff' : '#4a5070', minWidth: 48, textAlign: 'center' }}>
              <div style={{ fontSize: '1rem' }}>{item.icon?.length <= 2 ? item.icon : '🧪'}</div>
              <div style={{ fontSize: '0.65rem', color: '#8a92b2' }}>×{qty}</div>
            </button>
          );
        })}
      </div>

      {/* ログ */}
      <div style={{ background: '#0e1220', borderRadius: 6, padding: '6px 10px', fontSize: '0.75rem', height: 120, overflowY: 'auto' }}
        ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
        {log.map((l, i) => <div key={i} style={{ color: l.color, lineHeight: 1.4 }}>{l.text}</div>)}
      </div>
    </div>
  );
}



export function DungeonScreen() {
  const player = useGameStore(s => s.player);
  const addItems = useGameStore(s => s.addItems);
  const changeGold = useGameStore(s => s.changeGold);
  const addExp = useGameStore(s => s.addExp);
  const addSkillExp = useGameStore(s => s.addSkillExp);
  const changeSatiety = useGameStore(s => s.changeSatiety);
  const addNotification = useGameStore(s => s.addNotification);
  const recordDungeonClear = useGameStore(s => s.recordDungeonClear);
  const isDungeonUnlocked = useGameStore(s => s.isDungeonUnlocked);

  const [monsterOverrides, setMonsterOverridesState] = useState<Record<string, MonsterOverride>>({});
  const [dungeonOverrides, setDungeonOverridesState] = useState<Record<string, DungeonOverride>>({});

  useEffect(() => {
    const u1 = subscribeMonsterOverrides(o => {
      if (o) { setMonsterOverridesState(o); _monsterOverrideCache = o; }
    });
    const u2 = subscribeDungeonOverrides(o => {
      if (o) { setDungeonOverridesState(o); _dungeonOverrideCache = o; }
    });
    return () => { u1(); u2(); };
  }, []);

  // マスターデータにオーバーライドをマージ

  const getDungeon = (id: string): typeof DUNGEON_MASTER[string] => {
    const base = DUNGEON_MASTER[id];
    const ov = dungeonOverrides[id];
    if (!base || !ov) return base;
    return {
      ...base,
      areas: ov.areas ?? base.areas,
    };
  };

  void monsterOverrides; // suppress unused warning

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runState, setRunState] = useState<DungeonRunState | null>(null);
  const [inBattle, setInBattle] = useState(false);
  const [battleKey, setBattleKey] = useState(0); // バトルコンポーネント再生成用
  const [equipment, _setEquipment] = useState<EquipmentSlots>(() => player?.equipment ?? defaultEquipmentSlots());
  const [showUnlockGuide, setShowUnlockGuide] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);
  const [dungeonInnerTab, setDungeonInnerTab] = useState<'dungeon' | 'gacha' | 'trap'>('dungeon');
  const [dungeonMana, setDungeonMana] = useState(0);
  const [showBossChoice, setShowBossChoice] = useState(false);
  const [kxBossMode, setKxBossMode] = useState(false);
  const [showDevilArmorChoice, setShowDevilArmorChoice] = useState(false);
  const [showZeroChoice, setShowZeroChoice] = useState(false);
  const [autoBattle, setAutoBattle] = useState(false);
  // 0=なし, 1=デビルアーマー戦, 2=デッドアーマー戦
  const [devilArmorPhase, setDevilArmorPhase] = useState(0);

  const HIDDEN_DUNGEON_IDS = ['devil_armor_fight', 'dead_armor_fight', 'sky_castle_ex', 'dragons_lair'];
  const dungeons = Object.values(DUNGEON_MASTER).filter(d => !HIDDEN_DUNGEON_IDS.includes(d.id));
  const lockedDungeons = dungeons.filter(d => !isDungeonUnlocked(d.id));

  const startDungeon = useCallback(() => {
    if (!player || !selectedId) return;
    const dungeon = getDungeon(selectedId);
    const combatLv = player.skillLevels['combat'] ?? 1;
    if (!dungeon || combatLv < dungeon.requiredLevel) {
      addNotification('warning', `戦闘スキルLv.${dungeon?.requiredLevel}以上が必要です（現在: Lv.${combatLv}）`);
      return;
    }
    if (!isDungeonUnlocked(selectedId)) { addNotification('error', '🔒 このダンジョンはまだ解放されていません'); return; }
    if (player.stats.hp <= 0) { addNotification('error', 'HPが0です。回復してから挑戦してください。'); return; }
    setRunState({ dungeonId: selectedId, currentFloor: 1, currentAreaName: getDungeon(selectedId)?.areas?.[0]?.name ?? 'エリア1', monstersDefeated: 0, totalExp: 0, totalGold: 0, totalDrops: [], isComplete: false, isFailed: false, currentAreaIdx: 0 });
    setRunLog([`⚔️ ${dungeon.name} に突入！`]);
    setInBattle(false);
    setDungeonMana(0);
    // プレイヤー状態更新（画面遷移時のみ）
    const actCode = selectedId === 'sky_castle' ? 'dungeon_sky'
      : selectedId === 'sky_castle_ex' ? 'dungeon_sky_ex'
      : selectedId === 'volcano' ? 'dungeon_volcano'
      : selectedId === 'beginner_cave' ? 'dungeon_cave'
      : selectedId === 'goblin_nest' ? 'dungeon_goblin'
      : selectedId === 'fortress' ? 'dungeon_fortress'
      : selectedId === 'underground_fortress' ? 'dungeon_underground'
      : selectedId === 'garden' ? 'dungeon_garden'
      : selectedId === 'frozen_cave' ? 'dungeon_ice'
      : selectedId === 'kx_fight' || selectedId === 'kx_ex_fight' ? 'boss_kx'
      : selectedId === 'rei_fight' ? 'boss_rei'
      : 'other';
    setPlayerActivity(player.uid, actCode as import('../../services/multiplayer').PlayerActivityCode).catch(() => {});
  }, [player, selectedId, isDungeonUnlocked, addNotification]);

  const handleBattleEnd = useCallback((won: boolean, expGained: number, goldGained: number, drops: {itemId:string;amount:number}[], _hpDelta: number) => {
    setInBattle(false);
    if (!runState || !player) return;
    const dungeon = getDungeon(runState.dungeonId);

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

    // 生涯統計を更新
    useGameStore.setState(state => {
      if (!state.player) return state;
      const ls = state.player.lifetimeStats ?? { totalDamageDealt: 0, totalGoldEarned: 0, maxCombo: 0, monstersDefeated: 0 };
      return { player: { ...state.player, lifetimeStats: { ...ls, totalGoldEarned: ls.totalGoldEarned + goldGained, monstersDefeated: ls.monstersDefeated + 1 } } };
    });

    const newDefeated = runState.monstersDefeated + 1;
    const newExp = runState.totalExp + expGained;
    const newGold = runState.totalGold + goldGained;
    const allDrops = [...runState.totalDrops];
    for (const d of drops) {
      const ex = allDrops.find(x => x.itemId === d.itemId);
      if (ex) ex.amount += d.amount; else allDrops.push({ ...d });
    }

    setRunLog(prev => [...prev, `✅ 撃破！EXP+${expGained} G+${goldGained}`]);

    // ボス周回モード中はエリアを固定してループ
    if (runState.bossLoopMode) {
      setRunState(prev => prev ? {
        ...prev,
        monstersDefeated: newDefeated, totalExp: newExp, totalGold: newGold, totalDrops: allDrops,
      } : null);
      return;
    }

    const areaThreshold = 5;
    const areas = dungeon?.areas;
    let nextAreaIdx = runState.currentAreaIdx ?? 0;
    let isComplete = false;
    if (newDefeated % areaThreshold === 0 && areas) {
      if (nextAreaIdx < areas.length - 1) {
        nextAreaIdx = nextAreaIdx + 1;
        addNotification('info', `✅ ${areas[nextAreaIdx].name} に進んだ！`);
        setRunLog(prev => [...prev, `📍 ${areas[nextAreaIdx].name} へ進んだ！`]);
        // 天空城の最上部（ボスエリア）に進む直前でデビルアーマーに挑戦するか選択
        if (runState.dungeonId === 'sky_castle' && nextAreaIdx === areas.length - 1) {
          setRunState(prev => prev ? {
            ...prev, currentAreaIdx: nextAreaIdx,
            currentAreaName: areas?.[nextAreaIdx]?.name ?? prev.currentAreaName,
            monstersDefeated: newDefeated, totalExp: newExp, totalGold: newGold,
            totalDrops: allDrops, isComplete, currentFloor: Math.min(prev.currentFloor + 1, dungeon?.floors ?? 1),
          } : null);
          setShowDevilArmorChoice(true);
          return;
        }
      } else {
        // ボスエリア最終撃破 → 初級ダンジョンのみ継続選択、他はクリア
        recordDungeonClear(runState.dungeonId);
        const gachaCoinReward = ({ beginner:1, intermediate:2, advanced:3, super:4, extreme:5, volcano:4 } as Record<string,number>)[dungeon?.tier ?? 'beginner'] ?? 1;
        addNotification('success', `🏆 ${dungeon?.name} ボス撃破！🪙 ガチャコイン+${gachaCoinReward}枚！`);
        if (player) { const dId = runState.dungeonId; const clearType = dId === 'sky_castle' ? 'sky_castle_clear' : dId === 'sky_castle_ex' ? 'sky_castle_ex_clear' : dId === 'volcano' ? 'volcano_clear' : dId === 'kx_fight' || dId === 'kx_ex_fight' ? 'boss_kx' : dId === 'rei_fight' ? 'boss_rei' : 'dungeon_clear'; postActivityFeed({ uid: player.uid, displayName: player.displayName, type: clearType, message: `が「${dungeon?.name}」をクリアしました！` }).catch(() => {}); }
        if (runState.dungeonId === 'beginner_cave') {
          // 初級のみ：帰還or継続の選択を表示
          setRunState(prev => prev ? {
            ...prev, currentAreaIdx: nextAreaIdx,
            currentAreaName: areas?.[nextAreaIdx]?.name ?? prev.currentAreaName,
            monstersDefeated: newDefeated, totalExp: newExp, totalGold: newGold,
            totalDrops: allDrops, isComplete: false, currentFloor: Math.min(prev.currentFloor + 1, dungeon?.floors ?? 1),
          } : null);
          setShowBossChoice(true);
        } else if (runState.dungeonId === 'frozen_cave') {
          // 冷焦洞穴：極冷焦撃破後に零と戦うか帰還か選択
          setRunState(prev => prev ? {
            ...prev, currentAreaIdx: nextAreaIdx,
            currentAreaName: areas?.[nextAreaIdx]?.name ?? prev.currentAreaName,
            monstersDefeated: newDefeated, totalExp: newExp, totalGold: newGold,
            totalDrops: allDrops, isComplete: false, currentFloor: Math.min(prev.currentFloor + 1, dungeon?.floors ?? 1),
          } : null);
          setShowZeroChoice(true);
        } else {
          // 他のダンジョンはそのままクリア（零討伐時はzerokiller実績付与）
          if (runState.currentAreaIdx === 3 && runState.dungeonId === 'frozen_cave') {
            useGameStore.setState(state => {
              if (!state.player) return state;
              const ua = state.player.unlockedAchievements ?? [];
              if (!ua.includes('zerokiller')) {
                addNotification('success', '⚡ 実績解除：「零の破壊者」！');
                return { player: { ...state.player, unlockedAchievements: [...ua, 'zerokiller'] } };
              }
              return state;
            });
          }
          setRunState(prev => prev ? {
            ...prev, currentAreaIdx: nextAreaIdx,
            currentAreaName: areas?.[nextAreaIdx]?.name ?? prev.currentAreaName,
            monstersDefeated: newDefeated, totalExp: newExp, totalGold: newGold,
            totalDrops: allDrops, isComplete: true, currentFloor: Math.min(prev.currentFloor + 1, dungeon?.floors ?? 1),
          } : null);
        }
        return;
      }
    }

    setRunState(prev => prev ? {
      ...prev, currentAreaIdx: nextAreaIdx,
      currentAreaName: areas?.[nextAreaIdx]?.name ?? prev.currentAreaName,
      monstersDefeated: newDefeated, totalExp: newExp, totalGold: newGold,
      totalDrops: allDrops, isComplete, currentFloor: Math.min(prev.currentFloor + 1, dungeon?.floors ?? 1),
    } : null);
  }, [runState, player, changeSatiety, addExp, addSkillExp, changeGold, addItems, addNotification, recordDungeonClear]);

  const handleEscapeBattle = useCallback(() => {
    setInBattle(false);
    setAutoBattle(false);
    setRunLog(prev => [...prev, '🏃 逃走した。']);
  }, []);

  // オートバトル：戦闘終了後に自動で次の戦闘を開始
  useEffect(() => {
    if (!autoBattle || inBattle || !runState || runState.isComplete || runState.isFailed || showBossChoice || showZeroChoice || showDevilArmorChoice || kxBossMode) return;
    if (player && player.stats.hp <= 0) return;
    const timer = setTimeout(() => {
      setBattleKey(k => k + 1);
      setInBattle(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [autoBattle, inBattle, runState, player, showBossChoice, showZeroChoice, showDevilArmorChoice, kxBossMode]);

  // デビルアーマー戦終了ハンドラ
  const handleDevilArmorBattleEnd = useCallback((won: boolean, expGained: number, goldGained: number, drops: {itemId:string;amount:number}[], _hpDelta: number) => {
    setInBattle(false);
    changeSatiety(-3);
    if (!won) {
      addNotification('error', '敗北... HPが0になった。');
      setRunState(prev => prev ? { ...prev, isFailed: true } : null);
      setDevilArmorPhase(0);
      setShowDevilArmorChoice(false);
      return;
    }
    addExp(expGained);
    addSkillExp('combat', Math.floor(expGained / 2));
    changeGold(goldGained);
    addItems(drops);
    // デビルアーマーを倒した時2%で覚醒（DEAD ARMORは覚醒しない）
    if (devilArmorPhase === 1 && secureRandom() < 0.02) {
      addNotification('warning', '⚠️ デビルアーマーが覚醒した！DEAD ARMORに変貌！');
      setRunLog(prev => [...prev, '⚠️ DEAD ARMORに覚醒！']);
      setDevilArmorPhase(2);
      setInBattle(true);
      setBattleKey(k => k + 1);
    } else {
      // 撃破後、通常通りマッドガイポット戦へ
      addNotification('success', '🗡️ デビルアーマーを撃破！マッドガイボットとの決戦へ！');
      setRunLog(prev => [...prev, '✅ デビルアーマー撃破！']);
      setDevilArmorPhase(0);
      setShowDevilArmorChoice(false);
    }
  }, [devilArmorPhase, changeSatiety, addExp, addSkillExp, changeGold, addItems, addNotification]);

  const handleDevilArmorEscape = useCallback(() => {
    setInBattle(false);
    setDevilArmorPhase(0);
    setRunLog(prev => [...prev, '🏃 逃走した。']);
  }, []);

  const escape = useCallback(() => {
    addNotification('info', '🏃 ダンジョンから離脱した。');
    setRunState(null); setInBattle(false); setRunLog([]); setShowBossChoice(false); setShowDevilArmorChoice(false); setDevilArmorPhase(0);
  }, [addNotification]);

  if (!player) return null;

  const dungeonTabActive = dungeonInnerTab === 'dungeon';
  const gachaTabActive = dungeonInnerTab === 'gacha';
  const trapTabActive = dungeonInnerTab === 'trap';

  return (
    <div style={{ padding: '12px 8px 80px' }}>
      {/* ダンジョン内タブ */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button onClick={() => setDungeonInnerTab('dungeon')}
          style={{ flex: 1, padding: '8px', fontWeight: 700, fontSize: '0.85rem', background: dungeonTabActive ? 'rgba(240,192,96,0.15)' : '#1c2235', border: `1px solid ${dungeonTabActive ? '#f0c060' : '#2d3752'}`, color: dungeonTabActive ? '#f0c060' : '#8a92b2', borderRadius: 8, cursor: 'pointer' }}>
          ⚔️ ダンジョン
        </button>
        <button onClick={() => setDungeonInnerTab('gacha')}
          style={{ flex: 1, padding: '8px', fontWeight: 700, fontSize: '0.85rem', background: gachaTabActive ? 'rgba(200,100,255,0.15)' : '#1c2235', border: `1px solid ${gachaTabActive ? '#c864ff' : '#2d3752'}`, color: gachaTabActive ? '#c864ff' : '#8a92b2', borderRadius: 8, cursor: 'pointer' }}>
          🎰 ガチャ <span style={{ fontSize: '0.75rem', color: '#f0c060' }}>({player.gachaCoins ?? 0}枚)</span>
        </button>
        <button onClick={() => setDungeonInnerTab('trap')}
          style={{ flex: 1, padding: '8px', fontWeight: 700, fontSize: '0.85rem', background: trapTabActive ? 'rgba(255,100,100,0.15)' : '#1c2235', border: `1px solid ${trapTabActive ? '#ff6464' : '#2d3752'}`, color: trapTabActive ? '#ff6464' : '#8a92b2', borderRadius: 8, cursor: 'pointer' }}>
          🕷️ トラップ
        </button>
      </div>

      {gachaTabActive && <GachaPanel player={player} addItems={addItems} changeGold={changeGold} addNotification={addNotification} />}
      {trapTabActive && <TrapWorldPanel player={player} addItems={addItems} addNotification={addNotification} />}
      {!gachaTabActive && !trapTabActive && <>
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
            {/* MANAバー（mana_chargeスキル付き武器装備時） */}
            {(() => {
              const weaponId = equipment.hotbar.find(id => id && ITEM_MASTER[id]?.itemType === 'Weapon') ?? null;
              const wi = weaponId ? ITEM_MASTER[weaponId] : null;
              const manaSkill = wi?.weaponSkills?.find(s => s.type === 'mana_charge') as import('../../types/game').WeaponManaSkill | undefined;
              if (!manaSkill) return null;
              const manaMax = manaSkill.manaMax;
              const mana = Math.min(dungeonMana, manaMax);
              const ready = mana >= manaMax;
              return (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: '0.7rem', color: ready ? '#f0c060' : '#9b6df0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>⭐ MANA{ready ? '（必殺技 準備完了！）' : ''}</span>
                    <span>{mana}/{manaMax}</span>
                  </div>
                  <div style={{ height: 6, background: '#2d3752', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
                    <div style={{ height: '100%', background: ready ? '#f0c060' : '#9b6df0', width: `${(mana / manaMax) * 100}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })()}
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
                {runState.isComplete ? (runState.kxBossMode ? '🌟 裏超上級クリア！「生命の超越」を達成！' : '🎉 攻略完了！') : '💀 攻略失敗...'}
              </p>
              <button onClick={escape} style={{ padding: '10px 32px', background: '#4caf87', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                ダンジョン出口へ
              </button>
            </div>
          ) : showDevilArmorChoice && devilArmorPhase === 0 ? (
            <div style={{ background: '#161b26', border: '2px solid #cc44ff', borderRadius: 12, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>😈</div>
              <div style={{ color: '#cc44ff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>デビルアーマーが立ちはだかる！</div>
              <div style={{ color: '#8a92b2', fontSize: '0.8rem', marginBottom: 4 }}>HP: ❤️×640 | 攻撃力: 30 | 10ターンに1回 貫通10000ダメージ</div>
              <div style={{ color: '#8a92b2', fontSize: '0.75rem', marginBottom: 16 }}>天空城の道中でデビルアーマーに挑戦しますか？</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  setDevilArmorPhase(1);
                  setInBattle(true);
                  setBattleKey(k => k + 1);
                }} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#cc44ff,#8800cc)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  ⚔️ 挑戦する
                </button>
                <button onClick={() => {
                  setShowDevilArmorChoice(false);
                }} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#4caf87,#2d8f6f)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  🚶 戦わない
                </button>
              </div>
            </div>
          ) : (devilArmorPhase === 1 || devilArmorPhase === 2) && inBattle ? (
            <TurnBattle
              key={battleKey}
              runState={{ ...runState, dungeonId: devilArmorPhase === 2 ? 'dead_armor_fight' : 'devil_armor_fight', currentAreaIdx: 0 }}
              equipment={equipment}
              onBattleEnd={handleDevilArmorBattleEnd}
              onEscape={handleDevilArmorEscape}
              initialMana={dungeonMana}
              onManaUpdate={setDungeonMana}
            />
          ) : showZeroChoice ? (
            <div style={{ background: '#161b26', border: '2px solid #00ccff', borderRadius: 12, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>⚡</div>
              <div style={{ color: '#00ccff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>極冷焦を撃破！</div>
              <div style={{ color: '#8a92b2', fontSize: '0.8rem', marginBottom: 4 }}>深淵に「零」の気配を感じる...</div>
              <div style={{ color: '#8a92b2', fontSize: '0.75rem', marginBottom: 16 }}>HP:100000 | 防御:99 | 洞窟そのもの。帰還しますか？それとも零と対峙しますか？</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  setShowZeroChoice(false);
                  setRunState(prev => prev ? { ...prev, isComplete: true } : null);
                }} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#4caf87,#2d8f6f)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  🏆 帰還する
                </button>
                <button onClick={() => {
                  setShowZeroChoice(false);
                  // monstersDefeated を (5の倍数-1) に合わせて次の1撃破でエリア進行
                  const cur = runState.monstersDefeated;
                  const aligned = Math.ceil((cur + 1) / 5) * 5 - 1;
                  setRunState(prev => prev ? { ...prev, currentAreaIdx: 3, currentAreaName: '零の間', bossLoopMode: false, monstersDefeated: aligned } : null);
                  setBattleKey(k => k + 1);
                  setInBattle(true);
                }} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#0088ff,#0044aa)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  ⚡ 零と戦う
                </button>
              </div>
            </div>
          ) : showBossChoice ? (
            <div style={{ background: '#161b26', border: '2px solid #f0c060', borderRadius: 12, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>👑</div>
              <div style={{ color: '#f0c060', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>洞窟王を撃破！</div>
              <div style={{ color: '#8a92b2', fontSize: '0.8rem', marginBottom: 16 }}>このままクリアしますか？それとも洞窟王と戦い続けますか？</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  setShowBossChoice(false);
                  setRunState(prev => prev ? { ...prev, isComplete: true } : null);
                }} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#4caf87,#2d8f6f)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  🏆 クリアする！
                </button>
                <button onClick={() => {
                  setShowBossChoice(false);
                  setRunState(prev => prev ? { ...prev, bossLoopMode: true } : null);
                }} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#e05555,#c03030)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  ⚔️ 戦闘を継続する！
                </button>
              </div>
            </div>
          ) : kxBossMode ? (
            <TurnBattle
              key={battleKey}
              runState={{ ...runState, dungeonId: 'sky_castle_ex', currentAreaIdx: 0 }}
              equipment={equipment}
              onBattleEnd={() => {}}
              onEscape={() => {
                setKxBossMode(false);
                setRunState(prev => prev ? { ...prev, isFailed: true } : null);
              }}
              initialMana={dungeonMana}
              onManaUpdate={setDungeonMana}
              kxConfig={{
                initialHp: runState.kxHp ?? 38750,
                initialPhase: runState.kxPhase ?? 1,
                initialAwakened: runState.kxIsAwakened ?? false,
                onVictory: (_isAwakened) => {
                  setKxBossMode(false);
                  addNotification('success', '🌟 裏超上級クリア！「生命の超越」を達成！');
                  postActivityFeed({ uid: player.uid, displayName: player.displayName, type: 'dungeon_clear', message: `が「生命の超越」を達成しました！` }).catch(() => {});
                  setRunState(prev => prev ? { ...prev, isComplete: true } : null);
                },
                onDefeat: () => {
                  setKxBossMode(false);
                  addNotification('error', 'KX-G21に敗北した...');
                  setRunState(prev => prev ? { ...prev, isFailed: true } : null);
                },
              }}
            />
          ) : inBattle ? (
            <TurnBattle
              key={battleKey}
              runState={runState}
              equipment={equipment}
              onBattleEnd={handleBattleEnd}
              onEscape={handleEscapeBattle}
              initialMana={dungeonMana}
              onManaUpdate={setDungeonMana}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {runState.bossLoopMode && (
                <button onClick={() => setRunState(prev => prev ? { ...prev, isComplete: true } : null)}
                  style={{ padding: '10px', background: 'linear-gradient(135deg,#4caf87,#2d8f6f)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                  🏆 クリアして出る
                </button>
              )}
              {(() => {
                const hasSkyPass = (player.inventory?.['sky_pass'] ?? 0) > 0;
                const isSkyTurn5 = runState.dungeonId === 'sky_castle' && runState.currentFloor >= 5;
                if (isSkyTurn5 && hasSkyPass) return (
                  <button onClick={() => {
                    useGameStore.getState().consumeItem('sky_pass', 1);
                    addNotification('success', '🔑 天空城通行書を使用！KX-G21との決戦が始まる！');
                    setRunState(prev => prev ? { ...prev, dungeonId:'sky_castle_ex', kxBossMode:true, kxPhase:1, kxHp:38750, kxIsAwakened:false, currentAreaIdx:0 } : null);
                    setKxBossMode(true);
                  }}
                    style={{ width:'100%', padding:'12px', fontWeight:700, fontSize:'0.95rem', background:'linear-gradient(135deg,#ff00ff,#aa00aa)', color:'#fff', border:'2px solid #ff00ff', borderRadius:8, cursor:'pointer', marginBottom:6 }}>
                    🔑 通行書を使ってKXに挑戦！
                  </button>
                );
                return null;
              })()}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setInBattle(true); setBattleKey(k => k + 1); }}
                  disabled={player.stats.hp <= 0}
                  style={{ flex: 2, padding: '12px', fontWeight: 700, background: player.stats.hp > 0 ? 'linear-gradient(135deg,#e05555,#c03030)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: player.stats.hp > 0 ? 'pointer' : 'not-allowed' }}>
                  {runState.bossLoopMode ? '👑 洞窟王に挑む' : '⚔️ 次の敵と戦う'}
                </button>
                <button onClick={() => setAutoBattle(v => !v)}
                  style={{ flex: 1, padding: '12px', fontWeight: 700, background: autoBattle ? 'linear-gradient(135deg,#f0a040,#c07020)' : '#2d3752', color: autoBattle ? '#fff' : '#8a92b2', border: `1px solid ${autoBattle ? '#f0a040' : '#2d3752'}`, borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem' }}>
                  {autoBattle ? '🤖 AUTO ON' : '🤖 AUTO'}
                </button>
                <button onClick={escape} style={{ flex: 1, padding: '12px', background: '#2d3752', color: '#8a92b2', border: '1px solid #2d3752', borderRadius: 8, cursor: 'pointer' }}>
                  🏃 離脱
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </>}
    </div>
  );
}
