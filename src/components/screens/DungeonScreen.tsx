// src/components/screens/DungeonScreen.tsx
import { FreeFieldScreen } from './FreeFieldScreen';
import type { FFBattleRequest } from './FreeFieldScreen';
import { InfiniteCorridorScreen } from './InfiniteCorridorScreen';
import { GameIcon } from '../icons';
import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { secureRandom, randomInt, randomIntRange, randomChance } from '../../utils/random';
import { DUNGEON_MASTER, MONSTER_MASTER, ITEM_MASTER, BOSS_TITLE_MASTER, KILL_LOG_MASTER } from '../../data/masters';
import type { MonsterMaster, DungeonRunState, DungeonMaster, DungeonArea, WeaponPassiveSkill, WeaponRegenSkill, WeaponShieldSkill, WeaponManaSkill, PlayerData } from '../../types/game';
import type { EquipmentSlots } from '../../types/game';
import { defaultEquipmentSlots } from '../../types/game';
import { postActivityFeed, subscribeMonsterOverrides, subscribeDungeonOverrides, setPlayerActivity } from '../../services/multiplayer';
import type { MonsterOverride, DungeonOverride } from '../../services/multiplayer';
import { TOOLS_MASTER } from '../../data/toolsMaster';
import { TOOL_GACHA_TABLE } from '../../data/toolAcquisition';
import { useCombatFx } from '../combat/useCombatFx';
import { EnemyFxOverlay, SelfFxBadge, SelfFxBanner } from '../combat/CombatFx';

// ============================================================
// 戦闘ロジック（1ターン分）
// ============================================================
function calcDamage(atk: number, def: number): number {
  const base = Math.max(1, atk - def);
  return base + randomInt(Math.ceil(base * 0.2) + 1);
}

// ============================================================
// モンスターのdefensePct（被ダメージ軽減率）を実戦闘に反映
// 貫通攻撃（penetrate / areaPenetrate）はこの軽減を無視する想定のため、
// 貫通分岐の外側（通常calcDamage結果）にのみ適用すること。
// ============================================================
function applyDefensePct(dmg: number, mon: MonsterMaster | null | undefined): number {
  if (!mon?.defensePct) return dmg;
  return Math.max(1, Math.round(dmg * (1 - mon.defensePct)));
}

// ============================================================
// 防具によるダメージ軽減（統一計算式）
// 最終被ダメージ = 元のダメージ * (1 - 軽減ポイント/25) * (1 - 合計EPF/25)
// 軽減ポイント = min(20, max(防御力/5, 防御力 - (4*元のダメージ)/(防具強度+8)))
// ============================================================
function calcArmorReducedDamage(rawDamage: number, totalDef: number, totalToughness: number, totalEpf: number): number {
  const reductionPoint = Math.min(20, Math.max(totalDef / 5, totalDef - (4 * rawDamage) / (totalToughness + 8)));
  // 【修正】EPF合計が25以上になると (1 - totalEpf/25) が0以下（負数）になり、
  // 軽減後ダメージが必ず1まで潰れてしまうバグがあった（AEGISフルセット等、装備のEPF合計が25を超えるケースで発生）。
  // reductionPoint と同様に上限20でクランプし、軽減倍率が0未満にならないようにする。
  const cappedEpf = Math.min(20, totalEpf);
  const reduced = rawDamage * (1 - reductionPoint / 25) * (1 - cappedEpf / 25);
  return Math.max(1, Math.round(reduced));
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
  turn: 'player' | 'monster' | 'result' | 'select_target' | 'select_support_weapon';
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
  pendingAction: null | { type: 'attack' | 'weapon' | 'ultimate' | 'multicast' | 'scaling_weapon'; itemId?: string; itemIds?: string[] };
  // KXモード用（省略可）
  kx?: KxState;
  // Goliathシールド：残りターン数（0=無効）
  goliathShieldTurns: number;
  // Goliathシールド：次フェーズ攻撃不可の敵インデックス（-1=なし）
  goliathStunnedEnemyIdx: number;
  // =-=Cataclysm Spear-Level1=-= 等のサポート武器選択待ち状態
  pendingMultiCast: { itemId: string; remaining: number; selectedIds: string[] } | null;
  // 敵インデックス→残りスタンターン数（Amethyst Storeakなど複数ターンスタン用）
  enemyStunTurns: Record<number, number>;
  // ===== チェイテ専用バフ・デバフ =====
  chaiteBleedTurns: number;
  chaiteBleedDmg: number;
  chaiteDefDownTurns: number;
  chaiteSlowTurns: number;
  chaiteEnragedIdx: number;
  chaiteIronWallIdx: number;
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

// 撃破した敵の中に称号対象がいればワールドニュースへ通知（1戦闘内で同一個体は1回まで）
function postBossTitleIfAny(enemies: EnemyState[], uid: string, displayName: string): void {
  const seen = new Set<string>();
  for (const e of enemies) {
    const t = BOSS_TITLE_MASTER[e.monsterId];
    if (!t || seen.has(e.monsterId)) continue;
    seen.add(e.monsterId);
    postActivityFeed({ uid, displayName, type: 'boss_title', message: `が称号「${t.title}」を獲得しました！`, color: t.color, title: t.title }).catch(() => {});
  }
}

// 敵に倒された際、固有のキルログをナチュラルニュースへ通知
function postKillLog(enemies: EnemyState[], uid: string, displayName: string): void {
  const alive = enemies.filter(e => e.hp > 0);
  const pool = alive.length > 0 ? alive : enemies;
  if (pool.length === 0) return;
  // 生存している敵の中で最も攻撃力が高い個体を「致命傷を与えた敵」とみなす
  const killer = pool.reduce((strongest, cur) => {
    const a = getMergedMonster(cur.monsterId)?.attack ?? 0;
    const b = getMergedMonster(strongest.monsterId)?.attack ?? 0;
    return a > b ? cur : strongest;
  }, pool[0]);
  const log = KILL_LOG_MASTER[killer.monsterId];
  const mon = getMergedMonster(killer.monsterId);
  const text = log?.text ?? `は${mon?.name ?? '謎の敵'}に敗れた。`;
  const color = log?.color ?? '#e05555';
  postActivityFeed({ uid, displayName, type: 'kill_log', message: text, color }).catch(() => {});
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

// 火山の分岐ルートに対応したエリアリストを返す
function getVolcanoAreas(dungeon: DungeonMaster, volcanoRoute?: string): DungeonArea[] | undefined {
  if (dungeon.id !== 'volcano' || !dungeon.routes) return dungeon.areas;
  if (volcanoRoute === 'lich') return dungeon.routes.lich;
  if (volcanoRoute === 'back') return dungeon.routes.back;
  return dungeon.routes.main; // デフォルトは共通ルート
}

// 敵グループをスポーンする（BOSSのみ単体、それ以外は複数体ランダム）
function spawnEnemies(dungeon: DungeonMaster, areaIdx: number, _kxPhase?: number, volcanoRoute?: string): EnemyState[] {
  const areas = getVolcanoAreas(dungeon, volcanoRoute) ?? dungeon.areas;
  let pool: string[] = [];
  if (areas && areas[areaIdx]) {
    const area = areas[areaIdx];
    // ボスエリアはボスのみ単体（BOSSは例外的にソロ出現）
    const bossEntry = area.monsters.find(m => {
      const mon = getMergedMonster(m.monsterId);
      return mon?.isBoss;
    });
    if (bossEntry) {
      const m = getMergedMonster(bossEntry.monsterId);
      return [{ monsterId: bossEntry.monsterId, hp: m?.maxHp ?? 50, maxHp: m?.maxHp ?? 50 }];
    }
    // 中ボス(isMidBoss)は単体固定にしない：通常モブと同じプールに混ぜ、複数体・同時出現を許可する
    pool = area.monsters.flatMap(m => Array(m.count).fill(m.monsterId));
  } else {
    pool = (dungeon.monsterIds ?? []).filter(id => !getMergedMonster(id)?.isBoss);
  }
  if (pool.length === 0) return [];
  // ボスのみプールから除外（中ボスは含めたままにする）
  const nonBossPool = pool.filter(id => !getMergedMonster(id)?.isBoss);
  const finalPool = nonBossPool.length > 0 ? nonBossPool : pool;
  // 同時出現数の上限：火山は群れ・複数中ボス同時出現を前提にした難度のため引き上げる。チェイテは敵量3倍仕様。
  const maxEnemies = dungeon.id === 'sky_castle_ex' ? 15 : dungeon.id === 'volcano' ? 6 : dungeon.id === 'chaite' ? 9 : 3;
  const minEnemies = dungeon.id === 'chaite' ? 3 : 1;
  const count = Math.min(finalPool.length, randomIntRange(minEnemies, maxEnemies));
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
  // 戦闘ログの高さ可変（デフォルト220px、拡大時400px）
  const [logExpanded, setLogExpanded] = useState(false);

  // 初期敵グループ生成
  const [battle, setBattle] = useState<TurnBattleState>(() => {
    const areaIdx = runState.currentAreaIdx ?? 0;
    const enemies = kxConfig
      ? (kxConfig.initialAwakened ? [] : spawnKxMinions(1))
      : spawnEnemies(dungeon, areaIdx, undefined, runState.volcanoRoute);
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
        ? (kxConfig.initialAwakened
          ? [{ text: '⚡ KX-G21[覚醒体]が立ちはだかる！直接攻撃せよ！', color: '#ff00ff' }]
          : [{ text: '⚠️ KX-G21が現れた！眷属を倒してダメージを与えよ！', color: '#f0c060' }])
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
      pendingMultiCast: null,
      enemyStunTurns: {},
      chaiteBleedTurns: 0,
      chaiteBleedDmg: 0,
      chaiteDefDownTurns: 0,
      chaiteSlowTurns: 0,
      chaiteEnragedIdx: -1,
      chaiteIronWallIdx: -1,
    };
  });

  const updateEquipment = useGameStore(s => s.updateEquipment);
  const [showHotbar, setShowHotbar] = useState(false);
  const [hotbarModal, setHotbarModal] = useState<{slot:string;idx?:number} | null>(null);
  const [localEquip, setLocalEquip] = useState<EquipmentSlots>(equipment);
  const combatFx = useCombatFx();

  // Fix 7: sync localEquip changes to store so they persist after battle
  const setLocalEquipAndSave = useCallback((updater: (prev: EquipmentSlots) => EquipmentSlots) => {
    setLocalEquip(prev => {
      const next = updater(prev);
      updateEquipment(next);
      return next;
    });
  }, [updateEquipment]);

  // Fix 6: effective player defense including equipped item bonuses（バフ由来の倍率は除く：軽減式の上限でかき消されないよう別計算する）
  const getPlayerDef = useCallback((equip: EquipmentSlots = localEquip) => {
    let def = player.stats.defense;
    const allSlots: (string | null)[] = [
      ...equip.hotbar,
      equip.helmet, equip.chestplate, equip.leggings, equip.boots, equip.offhand,
    ];
    let defMultiplier = 1;
    for (const itemId of allSlots) {
      if (!itemId) continue;
      const item = ITEM_MASTER[itemId];
      if (item?.weaponDef) def += item.weaponDef;
    }
    for (const itemId of equip.hotbar) {
      if (!itemId) continue;
      const item = ITEM_MASTER[itemId];
      if (item?.defenseMultiplier) defMultiplier *= item.defenseMultiplier;
    }
    return Math.round(def * defMultiplier);
  }, [player.stats.defense, localEquip]);

  // バフによる防御力倍率（jewelry caneなど）。軽減式の上限(20)に埋もれず常に効果が出るよう、最終ダメージに直接掛ける
  const getBuffDefMultiplier = useCallback(() => {
    let mult = 1;
    for (const buff of battle.buffs ?? []) {
      if (buff.type === 'def_mult' && buff.turns > 0) mult *= buff.value;
    }
    return mult;
  }, [battle.buffs]);

  // 防具強度の合計（ダメージ軽減計算用）
  const getPlayerArmorToughness = useCallback((equip: EquipmentSlots = localEquip) => {
    let toughness = 0;
    const allSlots: (string | null)[] = [
      ...equip.hotbar,
      equip.helmet, equip.chestplate, equip.leggings, equip.boots, equip.offhand,
    ];
    for (const itemId of allSlots) {
      if (!itemId) continue;
      const item = ITEM_MASTER[itemId];
      if (item?.armorToughness) toughness += item.armorToughness;
    }
    return toughness;
  }, [localEquip]);

  // EPF（ダメージ軽減）の合計
  const getPlayerEPF = useCallback((equip: EquipmentSlots = localEquip) => {
    let epf = 0;
    const allSlots: (string | null)[] = [
      ...equip.hotbar,
      equip.helmet, equip.chestplate, equip.leggings, equip.boots, equip.offhand,
    ];
    for (const itemId of allSlots) {
      if (!itemId) continue;
      const item = ITEM_MASTER[itemId];
      if (item?.epf) epf += item.epf;
    }
    return epf;
  }, [localEquip]);

  // 防具のダメージ軽減を適用した最終被ダメージ（統一計算式）
  const getArmorReducedDamage = useCallback((rawDamage: number, equip: EquipmentSlots = localEquip) => {
    const totalDef = getPlayerDef(equip);
    const totalToughness = getPlayerArmorToughness(equip);
    const totalEpf = getPlayerEPF(equip);
    const baseReduced = calcArmorReducedDamage(rawDamage, totalDef, totalToughness, totalEpf);
    const buffMult = getBuffDefMultiplier();
    return buffMult > 1 ? Math.max(1, Math.round(baseReduced / buffMult)) : baseReduced;
  }, [getPlayerDef, getPlayerArmorToughness, getPlayerEPF, getBuffDefMultiplier, localEquip]);


  // 生存敵リスト（未使用だが将来用に保持）
  void battle.enemies.filter(e => e.hp > 0);

  // ドロップアイテムをバトルログエントリに変換するヘルパー
  const buildDropLogEntries = (drops: { itemId: string; amount: number }[]): { text: string; color: string }[] => {
    if (drops.length === 0) return [];
    const entries: { text: string; color: string }[] = [];
    entries.push({ text: '💎 ドロップアイテム', color: '#7a82aa' });
    for (const d of drops) {
      const item = ITEM_MASTER[d.itemId];
      if (!item) continue;
      const rarity = item.rarity;
      const color = rarity === 'legendary' ? '#ffd700' : rarity === 'epic' ? '#c97aff' : rarity === 'rare' ? '#5b8dee' : '#70c090';
      const prefix = rarity === 'legendary' ? '🌟' : rarity === 'epic' ? '✨' : rarity === 'rare' ? '💠' : '▸';
      entries.push({ text: `${prefix} ${item.name} × ${d.amount}`, color });
    }
    return entries;
  };

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
    // Goliathシールド：このターンの被弾が無敵対象かどうかは、デクリメント前（=今ターン開始時点）の残ターン数で判定する。
    // こうすることで「発動後4ターン無敵」が文字どおり4回分の被弾を完全カバーし、4ターン目の被弾後に回復処理に入る。
    const goliathProtectedThisTurn = prevBattle.goliathShieldTurns > 0;

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
        // ===== 燃焼per turn（業炎の剣など） =====
        // 生存敵数でtotalDamageを割った値を各敵に毎ターン与える
        if (skill.type === 'burn_per_turn') {
          const burn = skill as import('../../types/game').WeaponBurnPerTurnSkill;
          const aliveCount = newBattle.enemies.filter(e => e.hp > 0).length;
          if (aliveCount > 0) {
            const burnDmg = Math.max(1, Math.floor(burn.totalDamage / aliveCount));
            newBattle.enemies = newBattle.enemies.map(e =>
              e.hp > 0 ? { ...e, hp: Math.max(0, e.hp - burnDmg) } : e
            );
            newLog.push({ text: `🔥 ${weaponItem.name}の燃焼！ 敵各々に${burnDmg}ダメージ！`, color: '#ff6f3c' });
          }
        }
        if (skill.type === 'regen_per_turn') {
          const regen = skill as WeaponRegenSkill;
          const noHealActive = newBattle.buffs?.some(b => b.type === 'no_heal' && b.turns > 0);
          if (regen.hpRestore && !noHealActive) { changeHp(regen.hpRestore); newLog.push({ text: `💚 ${weaponItem.name}の回復！ HP+${regen.hpRestore}`, color: '#4caf87' }); }
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
      // ===== 自傷割合ダメージ（jewelry caneなど） =====
      if (buff.type === 'self_dmg_pct_hp') {
        const selfDmg = Math.max(1, Math.round(player.stats.hp * (buff.value / 100)));
        changeHp(-selfDmg);
        newLog.push({ text: `🩸 ${buff.meta?.weaponName ?? '装備'}の反動で自分に${selfDmg}ダメージ！(残${buff.turns - 1}ターン)`, color: '#e05555' });
      }
      // ===== HP上限固定（Emerald Crusadeなど） =====
      if (buff.type === 'hp_cap_pct') {
        const cap = Math.floor(player.stats.maxHp * (buff.value / 100));
        if (player.stats.hp > cap) {
          changeHp(cap - player.stats.hp);
          newLog.push({ text: `⚠️ HPが${buff.value}%以下に固定されている！`, color: '#9b6df0' });
        }
      }
      // ===== 遅延複数ヒット発動（Emerald Crusadeなど・0.1秒間隔で段階発動） =====
      if (buff.type === 'delayed_multihit' && buff.turns - 1 === 0) {
        const hits = buff.meta?.hits ?? [];
        const weaponName = buff.meta?.weaponName ?? '武器';
        const weaponIdForCd = buff.meta?.weaponId;
        const cdTurns = buff.meta?.cooldownTurns ?? 7;
        if (weaponIdForCd) {
          newBattle = { ...newBattle, itemCooldowns: { ...newBattle.itemCooldowns, [weaponIdForCd]: cdTurns } };
        }
        // 1ヒットずつフラット化し、0.1秒間隔で段階的に反映する
        const flatHits: { dmg: number; penetrate?: boolean }[] = [];
        for (const h of hits) {
          for (let i = 0; i < h.count; i++) flatHits.push({ dmg: h.dmg, penetrate: h.penetrate });
        }
        if (flatHits.length > 0) {
          newLog.push({ text: `💥 ${weaponName}の遅延発動！（0.1秒間隔で${flatHits.length}連続ヒット）`, color: '#9b6df0' });
          const applyStagedHit = (hitIdx: number) => {
            setBattle(prev => {
              const tIdx = prev.enemies.findIndex(e => e.hp > 0);
              if (tIdx < 0 || hitIdx >= flatHits.length) return prev;
              const h = flatHits[hitIdx];
              const cur = prev.enemies[tIdx];
              const mon = getMergedMonster(cur.monsterId);
              const dmg = h.penetrate ? h.dmg : applyDefensePct(calcDamage(h.dmg, mon?.defense ?? 0), mon);
              const prevHp = cur.hp;
              const newHp = Math.max(0, prevHp - dmg);
              const newEnemiesArr = prev.enemies.map((e, i) => i === tIdx ? { ...e, hp: newHp } : e);
              combatFx.triggerEnemyFx(weaponIdForCd ?? null, [{ idx: tIdx, damage: dmg, isCritical: false }]);
              if (prevHp > 0 && newHp <= 0) combatFx.triggerDefeatFx(tIdx);
              return {
                ...prev,
                enemies: newEnemiesArr,
                log: [...prev.log, { text: `💥 ${weaponName} ${hitIdx + 1}/${flatHits.length}撃目！ ${dmg}ダメージ！`, color: '#9b6df0' }],
              };
            });
            if (hitIdx + 1 < flatHits.length) {
              setTimeout(() => applyStagedHit(hitIdx + 1), 100);
            }
          };
          setTimeout(() => applyStagedHit(0), 100);
        }
      }
      // ===== 遅延自己回復（Damage-to-healなど） =====
      if (buff.type === 'delayed_heal_pct' && buff.turns - 1 === 0) {
        const healAmt = Math.round(player.stats.maxHp * (buff.value / 100));
        changeHp(healAmt);
        newLog.push({ text: `💚 ${buff.meta?.weaponName ?? '武器'}の効果でHP+${healAmt}回復！`, color: '#4caf87' });
      }
      if (buff.turns - 1 > 0) remainBuffs.push({ ...buff, turns: buff.turns - 1 });
    }
    newBattle = { ...newBattle, buffs: remainBuffs };

    // ===== HP固定中（Emerald Crusadeなど）は敵の攻撃ダメージを完全カット =====
    const hpCapActive = remainBuffs.some(b => b.type === 'hp_cap_pct' && b.turns > 0);

    // ===== 敵スタンターン数デクリメント（Amethyst Storeakなど） =====
    if (newBattle.enemyStunTurns && Object.keys(newBattle.enemyStunTurns).length > 0) {
      const newStun: Record<number, number> = {};
      for (const [k, v] of Object.entries(newBattle.enemyStunTurns)) {
        if (v - 1 > 0) newStun[Number(k)] = v - 1;
      }
      newBattle = { ...newBattle, enemyStunTurns: newStun };
    }

    // ===== Goliathシールドターン数デクリメント =====
    let newGoliathTurns = newBattle.goliathShieldTurns;
    if (newGoliathTurns > 0) {
      newGoliathTurns--;
      newBattle = { ...newBattle, goliathShieldTurns: newGoliathTurns };
      if (newGoliathTurns === 0) {
        const goliathHealAmt = 20;
        changeHp(goliathHealAmt);
        newLog.push({ text: `🛡️ 魔造壊盾=Goliath=の無敵が切れた！HP+${goliathHealAmt}回復！`, color: '#4caf87' });
      } else {
        newLog.push({ text: `🛡️ Goliath無敵発動中（残${newGoliathTurns}ターン）`, color: '#00e5ff' });
      }
    }

    // ===== チェイテ出血ダメージ tick =====
    if (newBattle.chaiteBleedTurns > 0) {
      const bleedDmg = newBattle.chaiteBleedDmg;
      changeHp(-bleedDmg);
      const newBleedTurns = newBattle.chaiteBleedTurns - 1;
      newBattle = { ...newBattle, chaiteBleedTurns: newBleedTurns, chaiteBleedDmg: newBleedTurns > 0 ? bleedDmg : 0 };
      newLog.push({ text: `🩸 出血ダメージ！あなたに${bleedDmg}ダメージ！（残${newBleedTurns}ターン）`, color: '#c62828' });
    }
    // ===== チェイテ防御低下 tick =====
    if (newBattle.chaiteDefDownTurns > 0) {
      const newDefDownTurns = newBattle.chaiteDefDownTurns - 1;
      newBattle = { ...newBattle, chaiteDefDownTurns: newDefDownTurns };
      if (newDefDownTurns === 0) newLog.push({ text: `💔 防御低下が解除された！`, color: '#9b6df0' });
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
        newLog.push(...buildDropLogEntries(drops));
        return { ...newBattle, log: newLog, turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, isDefending: false };
      }
    }

    // === KXモード: KXのターン行動 ===
    if (newBattle.kx) {
      const kx = newBattle.kx;
      // 覚醒KXは普通に攻撃（防具で軽減可能な物理攻撃）
      if (kx.isAwakened) {
        const rawDmg = 30 + Math.floor(secureRandom() * 40);
        let dmg = newBattle.isDefending ? Math.floor(getArmorReducedDamage(rawDmg) * 0.5) : getArmorReducedDamage(rawDmg);
        if (hpCapActive) dmg = 0;
        changeHp(-dmg);
        newLog.push({ text: hpCapActive ? `⚡ KX-G21[ライフエナジー]の攻撃！HP固定により無効化！` : `⚡ KX-G21[ライフエナジー]の攻撃！${dmg}ダメージ！`, color: '#ff00ff' });
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
        const rawDmg = 15 + Math.floor(secureRandom() * 20);
        dmg = newBattle.isDefending ? Math.floor(getArmorReducedDamage(rawDmg) * 0.5) : getArmorReducedDamage(rawDmg);
        if (hpCapActive) dmg = 0;
        logText = hpCapActive ? `⚔️ 「貴様など叩き切ってくれるわ！」 KX-G21の斬撃！HP固定により無効化！` : `⚔️ 「貴様など叩き切ってくれるわ！」 KX-G21の斬撃！${dmg}ダメ！`;
        changeHp(-dmg);
      } else if (action === 'chaos_flare') {
        const rawDmg = 20 + Math.floor(secureRandom() * 15);
        dmg = newBattle.isDefending ? Math.floor(getArmorReducedDamage(rawDmg) * 0.5) : getArmorReducedDamage(rawDmg);
        if (hpCapActive) dmg = 0;
        newKxBurnTurns = hpCapActive ? kx.burnTurns : 4;
        logText = hpCapActive ? `🔥 カオスフレア！HP固定により無効化！` : `🔥 カオスフレア！${dmg}ダメ＋燃焼4ターン！`;
        changeHp(-dmg);
        logColor = '#ff6b00';
      } else if (action === 'lightning_bolt') {
        const rawDmg = 60 + Math.floor(secureRandom() * 40);
        dmg = newBattle.isDefending ? Math.floor(getArmorReducedDamage(rawDmg) * 0.5) : getArmorReducedDamage(rawDmg);
        if (hpCapActive) dmg = 0;
        logText = hpCapActive ? `⚡ ライトニングボルト！HP固定により無効化！` : `⚡ ライトニングボルト！超高火力${dmg}ダメ！`;
        changeHp(-dmg);
        logColor = '#f0f000';
      } else if (action === 'summon_tech_snipe') {
        const rawDmg = 10;
        dmg = newBattle.isDefending ? Math.floor(getArmorReducedDamage(rawDmg) * 0.5) : getArmorReducedDamage(rawDmg);
        if (hpCapActive) dmg = 0;
        logText = hpCapActive ? `🎯 サモンテックスナイプ！HP固定により無効化＋エクス＆雷4体ずつ召喚！` : `🎯 サモンテックスナイプ！${dmg}ダメ＋エクス＆雷4体ずつ召喚！`;
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
        const bDmg = hpCapActive ? 0 : 8;
        changeHp(-bDmg);
        newKxBurnTurns = kx.burnTurns - 1;
        logText += hpCapActive ? ` 🔥燃焼はHP固定により無効化(残${newKxBurnTurns}T)` : ` 🔥燃焼${bDmg}ダメ(残${newKxBurnTurns}T)`;
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
      // 実効攻撃力：attackがフレーバー値止まり（ドワーフ系等のスキル依存個体）の場合は
      // effectiveAttackを実戦闘ダメージに使用する。未設定の個体は従来通りattackを使用。
      const realAtk = monster.effectiveAttack ?? monster.attack;

      // Goliathシールドによるスタン：このターン攻撃不可
      const enemyIdx = newBattle.enemies.findIndex(e => e === enemy || (e.monsterId === enemy.monsterId && e.hp === enemy.hp));
      if (newBattle.goliathStunnedEnemyIdx >= 0 && enemyIdx === newBattle.goliathStunnedEnemyIdx) {
        newLog.push({ text: `🛡️ ${monster.name}はGoliathの力で攻撃できない！`, color: '#00e5ff' });
        // スタンリセット（1回のみ有効）
        newBattle = { ...newBattle, goliathStunnedEnemyIdx: -1 };
        continue;
      }

      // Amethyst Storeak等：複数ターンスタン
      if (enemyIdx >= 0 && (newBattle.enemyStunTurns[enemyIdx] ?? 0) > 0) {
        newLog.push({ text: `💫 ${monster.name}は拘束されて動けない！(残${newBattle.enemyStunTurns[enemyIdx]}ターン)`, color: '#9b6df0' });
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
        // 物理攻撃ターン（防具で軽減可能）
        if (newSkillTurn % penetrateInterval === 0 && newSkillTurn > 0) {
          const rawPenDmg = 10000;
          let penDmg = newBattle.isDefending ? Math.floor(getArmorReducedDamage(rawPenDmg) * 0.5) : getArmorReducedDamage(rawPenDmg);
          if (hpCapActive) penDmg = 0;
          changeHp(-penDmg);
          const newPlayerHp = Math.max(0, player.stats.hp - penDmg);
          newLog.push({ text: hpCapActive ? `💀 ${monster.name}の強力な一撃！ HP固定により無効化！` : `💀 ${monster.name}の強力な一撃！ 防具ごと${penDmg}ダメージ！`, color: '#ff0055' });
          if (newPlayerHp <= 0) {
            return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
          }
          continue;
        }
        // 通常攻撃
        const mDmg = getArmorReducedDamage(realAtk);
        let reducedDmg = newBattle.isDefending ? Math.floor(mDmg * 0.5) : mDmg;
        if (hpCapActive) reducedDmg = 0;
        changeHp(-reducedDmg);
        const newPlayerHp2 = Math.max(0, player.stats.hp - reducedDmg);
        newLog.push({ text: hpCapActive ? `🐉 ${monster.name}の攻撃！ HP固定により無効化！` : `🐉 ${monster.name}の攻撃！ あなたに${reducedDmg}ダメージ${newBattle.isDefending ? '（防御中）' : ''}`, color: '#e05555' });
        if (newPlayerHp2 <= 0) {
          return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
        }
        continue;
      }

      // ===== チェイテ専用スキル処理 =====
      const isChaiteMonster = ['chaite_silver_gladiator','chaite_gold_gladiator','chaite_black_knight','chaite_gold_mage','chaite_hero_knight','chaite_black_gladiator','chaite_nightmare'].includes(monster.id);
      if (isChaiteMonster) {
        // 防御低下デバフ: 被ダメ+30%
        const defDownMult = newBattle.chaiteDefDownTurns > 0 ? 1.3 : 1.0;
        // 鈍足: このターン攻撃不可（鈍足解除後に通常攻撃へ）
        if (newBattle.chaiteSlowTurns > 0) {
          newBattle = { ...newBattle, chaiteSlowTurns: newBattle.chaiteSlowTurns - 1 };
          newLog.push({ text: `🐢 鈍足でプレイヤーは行動が遅れた！（残${newBattle.chaiteSlowTurns}ターン）`, color: '#9b6df0' });
          continue;
        }
        // 鉄壁: 被ダメ50%軽減（1ターン、黒装騎士）
        if (newBattle.chaiteIronWallIdx >= 0 && enemyIdx === newBattle.chaiteIronWallIdx) {
          newBattle = { ...newBattle, chaiteIronWallIdx: -1 };
          newLog.push({ text: `🛡️ ${monster.name}は鉄壁の構えで攻撃を受け止めた！プレイヤーの攻撃を50%軽減！`, color: '#00bcd4' });
          // 鉄壁は「このターン被ダメ50%軽減」なので敵ターンには攻撃してくる
        }
        // 戦意高揚: HP50%以下で攻撃力1.5倍（英雄騎士・暗黒騎士）
        const enragedMult = (newBattle.chaiteEnragedIdx === enemyIdx) ? 1.5 : 1.0;
        // HP50%以下になったら戦意高揚発動
        if (['chaite_hero_knight','chaite_nightmare'].includes(monster.id)) {
          const enemyHpPct = enemy.hp / enemy.maxHp;
          if (enemyHpPct <= 0.5 && newBattle.chaiteEnragedIdx !== enemyIdx) {
            newBattle = { ...newBattle, chaiteEnragedIdx: enemyIdx };
            newLog.push({ text: `💢 ${monster.name}の戦意が高揚した！攻撃力が1.5倍になった！`, color: '#ff6b00' });
          }
        }
        // スキル抽選
        const skillRoll = secureRandom();
        // 銀装剣闘士: 30%で連撃2回
        if (monster.id === 'chaite_silver_gladiator' && skillRoll < 0.30) {
          let totalDmg = 0;
          let died = false;
          for (let hit = 0; hit < 2; hit++) {
            const raw = Math.floor(realAtk * (0.6 + secureRandom() * 0.2));
            const dmg = Math.max(1, Math.round(getArmorReducedDamage(raw) * defDownMult * enragedMult));
            const fd = hpCapActive ? 0 : (newBattle.isDefending ? Math.floor(dmg * 0.5) : dmg);
            changeHp(-fd); totalDmg += fd;
            if (player.stats.hp - fd <= 0) { died = true; break; }
          }
          newLog.push({ text: `⚔️⚔️ ${monster.name}の【連撃】！2連続攻撃 合計${totalDmg}ダメージ！`, color: '#e05555' });
          if (died) return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
          continue;
        }
        // 金装剣闘士: 25%で突進斬り(1.8倍単体)、25%で連撃3回
        if (monster.id === 'chaite_gold_gladiator') {
          if (skillRoll < 0.25) {
            const raw = Math.floor(realAtk * 1.8);
            const dmg = Math.max(1, Math.round(getArmorReducedDamage(raw) * defDownMult * enragedMult));
            const fd = hpCapActive ? 0 : (newBattle.isDefending ? Math.floor(dmg * 0.5) : dmg);
            changeHp(-fd);
            newLog.push({ text: `🏃 ${monster.name}の【突進斬り】！${fd}ダメージ！`, color: '#ff4444' });
            if (player.stats.hp - fd <= 0) return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
            continue;
          } else if (skillRoll < 0.50) {
            let totalDmg = 0; let died = false;
            for (let hit = 0; hit < 3; hit++) {
              const raw = Math.floor(realAtk * (0.5 + secureRandom() * 0.2));
              const dmg = Math.max(1, Math.round(getArmorReducedDamage(raw) * defDownMult * enragedMult));
              const fd = hpCapActive ? 0 : (newBattle.isDefending ? Math.floor(dmg * 0.5) : dmg);
              changeHp(-fd); totalDmg += fd;
              if (player.stats.hp - fd <= 0) { died = true; break; }
            }
            newLog.push({ text: `⚔️⚔️⚔️ ${monster.name}の【3連撃】！合計${totalDmg}ダメージ！`, color: '#e05555' });
            if (died) return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
            continue;
          }
        }
        // 黒装騎士: 30%で鉄壁（次ターン被ダメ50%軽減）、30%で反撃準備
        if (monster.id === 'chaite_black_knight' && skillRoll < 0.30) {
          newBattle = { ...newBattle, chaiteIronWallIdx: enemyIdx };
          newLog.push({ text: `🛡️ ${monster.name}が【鉄壁】の構えを取った！次の攻撃を50%軽減する！`, color: '#00bcd4' });
          // 鉄壁発動ターンは通常攻撃も行う（fall through）
        }
        // 金装魔導士: 30%で鈍足(2T)、25%で防御低下(3T)、20%で魔弾(防具無効+epfのみ軽減)
        if (monster.id === 'chaite_gold_mage') {
          if (skillRoll < 0.30) {
            newBattle = { ...newBattle, chaiteSlowTurns: 2 };
            newLog.push({ text: `🐢 ${monster.name}の【鈍足】！プレイヤーは2ターン行動が遅くなった！`, color: '#9b6df0' });
            continue;
          } else if (skillRoll < 0.55) {
            newBattle = { ...newBattle, chaiteDefDownTurns: 3 };
            newLog.push({ text: `💔 ${monster.name}の【防御低下】！プレイヤーの被ダメージが3ターン+30%に！`, color: '#e040fb' });
            // 防御低下発動ターンは魔弾も打つ（fall through）
          } else if (skillRoll < 0.75) {
            // 魔弾: EPFのみ軽減（防具の通常減少を無視）
            const armorSlots = [localEquip.helmet, localEquip.chestplate, localEquip.leggings, localEquip.boots, ...(localEquip.hotbar.filter(id => id && ITEM_MASTER[id]?.isOffhand) as string[])];
            const totalEpf = armorSlots.reduce((sum, id) => sum + (ITEM_MASTER[id ?? '']?.epf ?? 0), 0);
            const cappedEpf = Math.min(20, totalEpf);
            const rawMagic = realAtk;
            const magicDmg = Math.max(1, Math.round(rawMagic * (1 - cappedEpf / 25) * defDownMult));
            const fd = hpCapActive ? 0 : (newBattle.isDefending ? Math.floor(magicDmg * 0.7) : magicDmg);
            changeHp(-fd);
            newLog.push({ text: `✨ ${monster.name}の【魔弾】！防具を貫通する魔法攻撃${fd}ダメージ！(耐性のみ有効)`, color: '#ab47bc' });
            if (player.stats.hp - fd <= 0) return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
            continue;
          }
        }
        // 黒装剣闘士: 35%で出血(3T,毎ターン実atk*0.15)、30%で高速斬撃(4回)
        if (monster.id === 'chaite_black_gladiator') {
          if (skillRoll < 0.35) {
            const bleedDmg = Math.max(1, Math.floor(realAtk * 0.15));
            newBattle = { ...newBattle, chaiteBleedTurns: 3, chaiteBleedDmg: bleedDmg };
            newLog.push({ text: `🩸 ${monster.name}の【出血斬り】！プレイヤーは出血状態！3ターン毎ターン${bleedDmg}ダメージ！`, color: '#c62828' });
            // 出血発動ターンも通常攻撃（fall through）
          } else if (skillRoll < 0.65) {
            let totalDmg = 0; let died = false;
            for (let hit = 0; hit < 4; hit++) {
              const raw = Math.floor(realAtk * (0.35 + secureRandom() * 0.15));
              const dmg = Math.max(1, Math.round(getArmorReducedDamage(raw) * defDownMult * enragedMult));
              const fd = hpCapActive ? 0 : (newBattle.isDefending ? Math.floor(dmg * 0.5) : dmg);
              changeHp(-fd); totalDmg += fd;
              if (player.stats.hp - fd <= 0) { died = true; break; }
            }
            newLog.push({ text: `⚡ ${monster.name}の【高速斬撃】！4連続攻撃 合計${totalDmg}ダメージ！`, color: '#e05555' });
            if (died) return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
            continue;
          }
        }
        // 英雄騎士: 25%でパリィ警告、20%でカウンター準備
        if (monster.id === 'chaite_hero_knight' && skillRoll < 0.25) {
          // パリィ: 被ダメ40%カットして通常攻撃
          const raw = Math.floor(realAtk * (1.0 + secureRandom() * 0.3) * enragedMult);
          const dmg = Math.max(1, Math.round(getArmorReducedDamage(raw) * defDownMult));
          const fd = hpCapActive ? 0 : (newBattle.isDefending ? Math.floor(dmg * 0.5) : dmg);
          changeHp(-fd);
          newLog.push({ text: `🗡️ ${monster.name}の【カウンター】！${fd}ダメージ！（戦意高揚: ${enragedMult > 1 ? 'ON' : 'OFF'}）`, color: '#ff8a65' });
          if (player.stats.hp - fd <= 0) return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
          continue;
        }
        // 暗黒騎士: 30%でナイトメアブレード(2倍ダメ+出血)、20%で暴走時3連撃
        if (monster.id === 'chaite_nightmare') {
          const nightmareEnraged = enemy.hp / enemy.maxHp <= 0.3;
          if (skillRoll < 0.30) {
            const raw = Math.floor(realAtk * 2.0 * enragedMult);
            const dmg = Math.max(1, Math.round(getArmorReducedDamage(raw) * defDownMult));
            const fd = hpCapActive ? 0 : (newBattle.isDefending ? Math.floor(dmg * 0.5) : dmg);
            const bleedDmg2 = Math.max(1, Math.floor(realAtk * 0.2));
            newBattle = { ...newBattle, chaiteBleedTurns: 2, chaiteBleedDmg: bleedDmg2 };
            changeHp(-fd);
            newLog.push({ text: `💀 ${monster.name}の【ナイトメアブレード】！${fd}ダメージ＋出血2ターン！`, color: '#7b1fa2' });
            if (player.stats.hp - fd <= 0) return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
            continue;
          }
          if (nightmareEnraged && skillRoll < 0.55) {
            let totalDmg = 0; let died = false;
            for (let hit = 0; hit < 3; hit++) {
              const raw = Math.floor(realAtk * (0.7 + secureRandom() * 0.3) * 1.5);
              const dmg = Math.max(1, Math.round(getArmorReducedDamage(raw) * defDownMult));
              const fd = hpCapActive ? 0 : (newBattle.isDefending ? Math.floor(dmg * 0.5) : dmg);
              changeHp(-fd); totalDmg += fd;
              if (player.stats.hp - fd <= 0) { died = true; break; }
            }
            newLog.push({ text: `🌑 ${monster.name}の【暴走・3連斬】！HP30%以下で発動！合計${totalDmg}ダメージ！`, color: '#880e4f' });
            if (died) return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
            continue;
          }
        }
        // チェイテ通常攻撃（スキル未発動 or fall-through）
        const chRaw = Math.floor(realAtk * (0.85 + secureRandom() * 0.3) * enragedMult);
        const chDmg = Math.max(1, Math.round(getArmorReducedDamage(chRaw) * defDownMult));
        const chFd = hpCapActive ? 0 : (newBattle.isDefending ? Math.floor(chDmg * 0.5) : chDmg);
        changeHp(-chFd);
        newLog.push({ text: `⚔️ ${monster.name}の攻撃！あなたに${chFd}ダメージ${newBattle.chaiteDefDownTurns > 0 ? '（防御低下中）' : ''}${newBattle.isDefending ? '（防御中）' : ''}`, color: '#e05555' });
        if (player.stats.hp - chFd <= 0) return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
        continue;
      }

      const isSpecial = monster.isBoss && randomChance(0.2);
      let mDmg = isSpecial
        ? Math.floor(getArmorReducedDamage(realAtk) * 1.5)
        : getArmorReducedDamage(realAtk);
      if (weaponItem?.weaponSkills) {
        const shield = weaponItem.weaponSkills.find(s => s.type === 'hotbar_shield') as WeaponShieldSkill | undefined;
        if (shield) {
          const cut = shield.cutPercent / 100;
          mDmg = Math.max(1, Math.floor(mDmg * (1 - cut)));
        }
      }
      let reducedDmg0 = newBattle.isDefending ? Math.floor(mDmg * 0.5) : mDmg;
      // Goliathシールド：発動中はどんな攻撃を食らっても被ダメージ1に固定（実質無敵）
      if (goliathProtectedThisTurn) {
        reducedDmg0 = 1;
      }
      const reducedDmg = hpCapActive ? 0 : reducedDmg0;
      changeHp(-reducedDmg);
      const newPlayerHp = Math.max(0, player.stats.hp - reducedDmg);
      newLog.push(hpCapActive
        ? { text: `🐉 ${monster.name}の攻撃！ HP固定により無効化！`, color: '#e05555' }
        : goliathProtectedThisTurn
          ? { text: `🛡️ ${monster.name}の攻撃！ Goliathの加護で1ダメージに軽減！（無敵 残${newBattle.goliathShieldTurns}ターン）`, color: '#00e5ff' }
          : isSpecial
            ? { text: `💥 ${monster.name}の「${monster.specialAttack ?? '特殊攻撃'}」！ あなたに${reducedDmg}ダメージ！`, color: '#e05555' }
            : { text: `🐉 ${monster.name}の攻撃！ あなたに${reducedDmg}ダメージ${newBattle.isDefending ? '（防御中）' : ''}`, color: '#e05555' }
      );
      if (newPlayerHp <= 0) {
        return { ...newBattle, log: [...newLog, { text: '💀 あなたは倒れた...', color: '#e05555' }], turn: 'result', result: 'lose', isDefending: false };
      }
    }
    return { ...newBattle, log: newLog, turn: 'player', isDefending: false };
  }, [player.stats, changeHp, changeSatiety, dungeon, combatLv, localEquip, getPlayerDef, getArmorReducedDamage]);


  // 攻撃実行（範囲 or ターゲット選択後）
  const executeAttack = (targetIdx: number) => {
    const weaponItem = battle.equippedWeaponId ? ITEM_MASTER[battle.equippedWeaponId] : null;
    const atkBase = weaponItem?.weaponAtk ?? player.stats.attack;
    const isArea = !!weaponItem?.isAreaWeapon;
    const areaPen = weaponItem?.areaPenetrate ?? 0;
    const weaponMsg = weaponItem ? weaponItem.name : '素手';
    // パルヴァトス装備の攻撃力ボーナス（armorAtkBonus×0.5 追加ダメージ）
    const armorSlotIds = [localEquip.helmet, localEquip.chestplate, localEquip.leggings, localEquip.boots];
    const offhandArmorId = localEquip.offhand;
    const totalArmorAtkBonus = [...armorSlotIds, offhandArmorId].reduce((sum, id) => sum + (ITEM_MASTER[id ?? '']?.armorAtkBonus ?? 0), 0);
    const armorAtkExtraDmg = Math.floor(totalArmorAtkBonus * 0.5);

    // =冷海の覇魚=: 攻撃時凍傷ダメージ（自分） / 使用時15%で貫通300
    const frostbiteSkill = weaponItem?.weaponSkills?.find(s => s.type === 'frostbite_self_damage') as import('../../types/game').WeaponFrostbiteSelfDamageSkill | undefined;
    const penetrateChanceSkill = weaponItem?.weaponSkills?.find(s => s.type === 'penetrate_on_use_chance') as import('../../types/game').WeaponPenetrateOnUseChanceSkill | undefined;
    const reitoumaguroExtra: { text: string; color: string }[] = [];
    let reitoumaguroPenetrateDmg = 0;
    if (frostbiteSkill) {
      changeHp(-frostbiteSkill.selfDamage);
      reitoumaguroExtra.push({ text: `🥶 =冷海の覇魚=の凍傷で自分に${frostbiteSkill.selfDamage}ダメージ！`, color: '#5b8dee' });
    }
    if (penetrateChanceSkill && secureRandom() < penetrateChanceSkill.chance) {
      reitoumaguroPenetrateDmg = penetrateChanceSkill.penetrateDamage;
      reitoumaguroExtra.push({ text: `❄️ =冷海の覇魚=が発動！ 貫通${reitoumaguroPenetrateDmg}ダメージ追加！`, color: '#9b6df0' });
    }

    const fxHits: { idx: number; damage: number; isCritical: boolean }[] = [];
    const newEnemies = battle.enemies.map((e, i) => {
      if (e.hp <= 0) return e;
      if (!isArea && i !== targetIdx) return e;
      const mon = getMergedMonster(e.monsterId);
      const dmg = (areaPen > 0 ? areaPen : applyDefensePct(calcDamage(atkBase, mon?.defense ?? 0), mon)) + reitoumaguroPenetrateDmg + armorAtkExtraDmg;
      fxHits.push({ idx: i, damage: dmg, isCritical: reitoumaguroPenetrateDmg > 0 });
      return { ...e, hp: Math.max(0, e.hp - dmg) };
    });
    if (fxHits.length > 0) {
      combatFx.triggerEnemyFx(battle.equippedWeaponId, fxHits);
      for (const hit of fxHits) {
        if (battle.enemies[hit.idx].hp > 0 && newEnemies[hit.idx].hp <= 0) {
          combatFx.triggerDefeatFx(hit.idx);
        }
      }
    }
    if (frostbiteSkill || (penetrateChanceSkill && reitoumaguroPenetrateDmg > 0)) {
      combatFx.triggerSelfFx(battle.equippedWeaponId, 'self');
    }

    const totalDmg = battle.enemies.reduce((acc, e, i) => {
      if (e.hp <= 0) return acc;
      if (!isArea && i !== targetIdx) return acc;
      const mon = getMergedMonster(e.monsterId);
      return acc + (areaPen > 0 ? areaPen : applyDefensePct(calcDamage(atkBase, mon?.defense ?? 0), mon)) + reitoumaguroPenetrateDmg;
    }, 0);

    const logMsg = isArea
      ? { text: `🌀 ${weaponMsg}で全体攻撃！ 合計${totalDmg}ダメージ！`, color: '#4caf87' }
      : { text: `⚔️ ${weaponMsg}で攻撃！ ${totalDmg}ダメージ！`, color: '#4caf87' };
    let newLog = [...battle.log, logMsg, ...reitoumaguroExtra];

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
        // KX撃破（覚醒抽選は撃破後の演出が終わってからonVictoryで行う）
        newLog.push({ text: '🏆 KX-G21を討伐した！', color: '#f0c060' });
        addItems([{ itemId: 'super_spanner', amount: 10 }, { itemId: 'makai_bihin', amount: 10 }, { itemId: 'kx_mech_track', amount: 1 }]);
        setBattle(b => ({ ...b, enemies: newEnemies, log: [...newLog], turn: 'result', result: 'win', kx: { ...battle.kx!, hp: 0 }, pendingAction: null }));
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
      setBattle(b => ({ ...b, enemies: newEnemies, log: [...newLog, { text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' }, ...buildDropLogEntries(drops)], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, pendingAction: null }));
      return;
    }
    const after: TurnBattleState = { ...battle, enemies: newEnemies, log: newLog, turn: 'monster', isDefending: false, pendingAction: null };
    setBattle(after);
    setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
  };

  // =-=Cataclysm Spear-Level1=-=用: 選択した2武器を同時に発動
  const executeMultiCast = (targetIdx: number, itemIds: string[], spearItemId: string) => {
    const weapons = itemIds.map(id => ITEM_MASTER[id]).filter((w): w is NonNullable<typeof w> => !!w);
    const anyArea = weapons.some(w => !!w.isAreaWeapon);

    const fxHits: { idx: number; damage: number; isCritical: boolean }[] = [];
    const perWeaponLogs: { text: string; color: string }[] = [];
    const newEnemies = battle.enemies.map((e) => ({ ...e }));
    const newEnemyStunTurns: Record<number, number> = { ...battle.enemyStunTurns };

    for (const w of weapons) {
      // 選んだ武器固有のスキルを取得（=冷海の覇魚=, Amethyst Storeakなど）
      const frostbiteSkill = w.weaponSkills?.find(s => s.type === 'frostbite_self_damage') as import('../../types/game').WeaponFrostbiteSelfDamageSkill | undefined;
      const penetrateChanceSkill = w.weaponSkills?.find(s => s.type === 'penetrate_on_use_chance') as import('../../types/game').WeaponPenetrateOnUseChanceSkill | undefined;
      const scalingSkill = w.weaponSkills?.find(s => s.type === 'scaling_attack') as import('../../types/game').WeaponScalingAttackSkill | undefined;
      const stunSkill = w.weaponSkills?.find(s => s.type === 'random_stun') as import('../../types/game').WeaponRandomStunSkill | undefined;

      // =冷海の覇魚= の凍傷自傷
      if (frostbiteSkill) {
        changeHp(-frostbiteSkill.selfDamage);
        combatFx.triggerSelfFx(w.id, 'self');
        perWeaponLogs.push({ text: `🥶 ${w.name}の凍傷で自分に${frostbiteSkill.selfDamage}ダメージ！`, color: '#5b8dee' });
      }
      // =冷海の覇魚= の貫通追加発動チャンス
      let extraPenetrateDmg = 0;
      if (penetrateChanceSkill && secureRandom() < penetrateChanceSkill.chance) {
        extraPenetrateDmg = penetrateChanceSkill.penetrateDamage;
        perWeaponLogs.push({ text: `❄️ ${w.name}が発動！貫通${extraPenetrateDmg}ダメージ追加！`, color: '#9b6df0' });
      }
      // Amethyst Storeak のスケーリング攻撃（生存数依存）
      const aliveCountNow = newEnemies.filter(e => e.hp > 0).length;
      const atkBase = scalingSkill ? (scalingSkill.base + aliveCountNow * scalingSkill.perEnemy) : (w.weaponAtk ?? player.stats.attack);
      const areaPen = scalingSkill ? scalingSkill.penetrate : (w.areaPenetrate ?? 0);
      const isArea = !!w.isAreaWeapon || anyArea;

      let weaponTotal = 0;
      for (let i = 0; i < newEnemies.length; i++) {
        const e = newEnemies[i];
        if (e.hp <= 0) continue;
        if (!isArea && i !== targetIdx) continue;
        const mon = getMergedMonster(e.monsterId);
        const dmg = (areaPen > 0 ? areaPen : applyDefensePct(calcDamage(atkBase, mon?.defense ?? 0), mon)) + extraPenetrateDmg;
        weaponTotal += dmg;
        const prevHp = e.hp;
        e.hp = Math.max(0, e.hp - dmg);
        fxHits.push({ idx: i, damage: dmg, isCritical: extraPenetrateDmg > 0 });
        if (prevHp > 0 && e.hp <= 0) combatFx.triggerDefeatFx(i);
      }
      perWeaponLogs.push({ text: `⚔️ ${w.name}で攻撃！ ${weaponTotal}ダメージ！`, color: '#4caf87' });

      // Amethyst Storeak のランダムスタン
      if (stunSkill) {
        const aliveIdxs = newEnemies.reduce<number[]>((acc, e, i) => e.hp > 0 ? [...acc, i] : acc, []);
        if (aliveIdxs.length > 0) {
          const stunIdx = aliveIdxs[Math.floor(secureRandom() * aliveIdxs.length)];
          newEnemyStunTurns[stunIdx] = stunSkill.stunTurns;
          const stunName = getMergedMonster(newEnemies[stunIdx].monsterId)?.name ?? '敵';
          perWeaponLogs.push({ text: `💫 ${w.name}が${stunName}を拘束した！(${stunSkill.stunTurns}ターン攻撃不可)`, color: '#9b6df0' });
        }
      }
    }
    if (fxHits.length > 0) combatFx.triggerEnemyFx(itemIds[0] ?? null, fxHits);

    const spear = ITEM_MASTER[spearItemId];
    const multiSkill = spear?.weaponSkills?.find(s => s.type === 'multi_weapon_cast') as import('../../types/game').WeaponMultiCastSkill | undefined;
    const finalMana = Math.min(battle.weaponMana + (multiSkill?.manaRestore ?? 0), battle.weaponManaMax);
    const newCooldowns = { ...battle.itemCooldowns };
    if (multiSkill) newCooldowns[spearItemId] = multiSkill.cooldownTurns;
    for (const id of itemIds) {
      const wi = ITEM_MASTER[id];
      if (wi?.cooldownTurns) newCooldowns[id] = wi.cooldownTurns;
    }

    let newLog = [
      ...battle.log,
      { text: `🔱 =-=Cataclysm Spear-Level1=-=発動！${weapons.map(w => w.name).join('・')}が同時に襲いかかる！`, color: '#9b6df0' },
      ...perWeaponLogs,
      { text: `💠 Manaが${multiSkill?.manaRestore ?? 0}回復した！（${finalMana}/${battle.weaponManaMax}）`, color: '#4fc3f7' },
    ];

    // === KXモード: 眷属討伐でKXにダメージ ===
    if (battle.kx && !battle.kx.isAwakened) {
      const KX_MAX_HP = battle.kx.maxHp;
      const MINION_DMG: Record<string, number> = {
        roam_armor: Math.floor(KX_MAX_HP * 0.04),
        death_armor: Math.floor(KX_MAX_HP * 0.08),
      };
      let newKxHp = battle.kx.hp;
      let newDrops: { itemId: string; amount: number }[] = [];
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
        newLog.push({ text: '🏆 KX-G21を討伐した！', color: '#f0c060' });
        addItems([{ itemId: 'super_spanner', amount: 10 }, { itemId: 'makai_bihin', amount: 10 }, { itemId: 'kx_mech_track', amount: 1 }]);
        setBattle(b => ({ ...b, enemies: newEnemies, log: [...newLog], turn: 'result', result: 'win', kx: { ...battle.kx!, hp: 0 }, pendingAction: null, pendingMultiCast: null, weaponMana: finalMana, itemCooldowns: newCooldowns }));
        return;
      }

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
      const aliveAfter = newEnemies.filter(e => e.hp > 0);
      let finalEnemies = newEnemies;
      if (aliveAfter.length === 0 && newKxHp > 0) {
        newLog.push({ text: 'KX-G21が眷属を再召喚した！', color: '#e05555' });
        finalEnemies = spawnKxMinions(newPhase);
      }
      const updatedKx: KxState = { ...battle.kx, hp: newKxHp, phase: newPhase };
      setBattle(b => ({ ...b, enemies: finalEnemies, log: newLog, turn: 'monster', isDefending: false, pendingAction: null, pendingMultiCast: null, kx: updatedKx, weaponMana: finalMana, itemCooldowns: newCooldowns, enemyStunTurns: newEnemyStunTurns }));
      setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
      return;
    }

    if (battle.kx?.isAwakened) {
      const combinedAwakenedDmg = weapons.reduce((acc, w) => {
        const atkBase = w.weaponAtk ?? player.stats.attack;
        const areaPen = w.areaPenetrate ?? 0;
        return acc + (areaPen > 0 ? areaPen : calcDamage(atkBase, 0));
      }, 0);
      const newAwakeHp = Math.max(0, battle.kx.awakeHp - combinedAwakenedDmg);
      newLog.push({ text: `⚔️ KX覚醒に${combinedAwakenedDmg}ダメージ！(HP: ${newAwakeHp}/${battle.kx.awakeMaxHp})`, color: '#5b8dee' });
      if (newAwakeHp <= 0) {
        newLog.push({ text: '🏆 KX-G21[ライフエナジー]を討伐した！', color: '#f0c060' });
        addItems([{ itemId: 'life_control_core', amount: 1 }]);
        setBattle(b => ({ ...b, log: [...newLog], turn: 'result', result: 'win', kx: { ...battle.kx!, awakeHp: 0 }, pendingAction: null, pendingMultiCast: null, weaponMana: finalMana, itemCooldowns: newCooldowns }));
        return;
      }
      setBattle(b => ({ ...b, log: newLog, turn: 'monster', isDefending: false, pendingAction: null, pendingMultiCast: null, kx: { ...battle.kx!, awakeHp: newAwakeHp }, weaponMana: finalMana, itemCooldowns: newCooldowns }));
      setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
      return;
    }

    // 通常モード
    const alive = newEnemies.filter(e => e.hp > 0);
    if (alive.length === 0) {
      const { exp, gold, drops } = calcWinRewards(newEnemies);
      setBattle(b => ({ ...b, enemies: newEnemies, log: [...newLog, { text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' }, ...buildDropLogEntries(drops)], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, pendingAction: null, pendingMultiCast: null, weaponMana: finalMana, itemCooldowns: newCooldowns }));
      return;
    }
    setBattle(b => ({ ...b, enemies: newEnemies, log: newLog, turn: 'monster', isDefending: false, pendingAction: null, pendingMultiCast: null, weaponMana: finalMana, itemCooldowns: newCooldowns, enemyStunTurns: newEnemyStunTurns }));
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
    const ultFxHits: { idx: number; damage: number; isCritical: boolean }[] = [];
    const newEnemies = battle.enemies.map((e, i) => {
      if (e.hp <= 0) return e;
      ultFxHits.push({ idx: i, damage: dmgTotal, isCritical: true });
      return { ...e, hp: Math.max(0, e.hp - dmgTotal) };
    });
    if (ultFxHits.length > 0) {
      combatFx.triggerEnemyFx(battle.equippedWeaponId, ultFxHits, { isUltimate: true });
      for (const hit of ultFxHits) {
        if (battle.enemies[hit.idx].hp > 0 && newEnemies[hit.idx].hp <= 0) {
          combatFx.triggerDefeatFx(hit.idx);
        }
      }
    }

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
        logEntries.push({ text: '🏆 KX-G21を討伐した！', color: '#f0c060' });
        addItems([{ itemId: 'super_spanner', amount: 10 }, { itemId: 'makai_bihin', amount: 10 }, { itemId: 'kx_mech_track', amount: 1 }]);
        setBattle(b => ({ ...b, enemies: newEnemies, log: [...b.log, ...logEntries], turn: 'result', result: 'win', kx: { ...battle.kx!, hp: 0 }, weaponMana: 0, ultimateReady: false }));
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
      logEntries.push(...buildDropLogEntries(drops));
      setBattle(b => ({ ...b, enemies: newEnemies, log: [...b.log, ...logEntries], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, weaponMana: 0, ultimateReady: false }));
      return;
    }
    setBattle(b => ({ ...b, enemies: newEnemies, log: [...b.log, ...logEntries], turn: 'monster', isDefending: false, weaponMana: 0, ultimateReady: false, poisonBuff: newPoisonBuff, poisonDmg: newPoisonDmg, buffs: newBuffsAfterUlt }));
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
        combatFx.triggerSelfFx(itemId, 'self');
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
            { text: `🛡️ ${goliathSkill.shieldTurns}ターン無敵（被ダメージ1に軽減）！終了時HP+20回復！${stunnedMsg}`, color: '#00e5ff' },
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
      // =-=Cataclysm Spear-Level1=-= 特別処理：自身は攻撃判定にならず、追加で武器を選択
      const multiCastSkill = item.weaponSkills?.find(s => s.type === 'multi_weapon_cast') as import('../../types/game').WeaponMultiCastSkill | undefined;
      if (multiCastSkill) {
        const candidates = localEquip.hotbar.filter((id) => {
          if (!id || id === itemId) return false;
          const cand = ITEM_MASTER[id];
          if (!cand || cand.itemType !== 'Weapon') return false;
          if ((battle.itemCooldowns[id] ?? 0) > 0) return false;
          return true;
        });
        const uniqueCandidates = Array.from(new Set(candidates));
        if (uniqueCandidates.length < multiCastSkill.selectCount) {
          addNotification('warning', `発動には武器があと${multiCastSkill.selectCount}個必要です`);
          return;
        }
        const logMsg = item.useEffect?.message ?? '=-=Cataclysm Spear-Level1=-=を発動！';
        setBattle(b => ({
          ...b,
          log: [...b.log, { text: `🔱 ${logMsg}（残り${multiCastSkill.selectCount}回）`, color: '#9b6df0' }],
          turn: 'select_support_weapon',
          pendingMultiCast: { itemId, remaining: multiCastSkill.selectCount, selectedIds: [] },
          equippedWeaponId: itemId,
        }));
        return;
      }
      // Emerald Crusade特別処理：遅延複数ヒット＋回復不可/HP上限固定
      const delayedSkill = item.weaponSkills?.find(s => s.type === 'delayed_multihit') as import('../../types/game').WeaponDelayedMultiHitSkill | undefined;
      const selfLockSkill = item.weaponSkills?.find(s => s.type === 'self_lock') as import('../../types/game').WeaponSelfLockSkill | undefined;
      if (delayedSkill || selfLockSkill) {
        combatFx.triggerSelfFx(itemId, 'self');
        const newBuffs = [...battle.buffs];
        if (delayedSkill) {
          newBuffs.push({ type: 'delayed_multihit', value: 0, turns: delayedSkill.delayTurns, meta: { weaponId: itemId, weaponName: item.name, hits: delayedSkill.hits, cooldownTurns: delayedSkill.cooldownTurns } });
        }
        let immediateLog: { text: string; color: string }[] = [];
        if (selfLockSkill) {
          newBuffs.push({ type: 'no_heal', value: 0, turns: selfLockSkill.noHealTurns });
          newBuffs.push({ type: 'hp_cap_pct', value: selfLockSkill.hpCapPct, turns: selfLockSkill.capTurns });
          const cap = Math.floor(player.stats.maxHp * (selfLockSkill.hpCapPct / 100));
          if (player.stats.hp > cap) changeHp(cap - player.stats.hp);
          immediateLog.push({ text: `⚠️ ${selfLockSkill.noHealTurns}ターン回復不可、HPが${selfLockSkill.hpCapPct}%以下に固定された！`, color: '#9b6df0' });
        }
        const logMsg2 = item.useEffect?.message ?? `${item.name}を発動！`;
        setBattle(b => ({
          ...b,
          log: [...b.log, { text: `🔱 ${logMsg2}（${delayedSkill?.delayTurns ?? 0}ターン後に発動する）`, color: '#9b6df0' }, ...immediateLog],
          turn: 'monster',
          isDefending: false,
          buffs: newBuffs,
          equippedWeaponId: itemId,
        }));
        setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
        return;
      }
      // Amethyst Storeak特別処理：敵数依存の物理＋貫通攻撃＋ランダムスタン
      const scalingSkill = item.weaponSkills?.find(s => s.type === 'scaling_attack') as import('../../types/game').WeaponScalingAttackSkill | undefined;
      if (scalingSkill) {
        const stunSkill = item.weaponSkills?.find(s => s.type === 'random_stun') as import('../../types/game').WeaponRandomStunSkill | undefined;
        const aliveIdxs = battle.enemies.reduce<number[]>((acc, e, i) => e.hp > 0 ? [...acc, i] : acc, []);
        const stunIdx = stunSkill && aliveIdxs.length > 0 ? aliveIdxs[Math.floor(secureRandom() * aliveIdxs.length)] : -1;
        const stunName = stunIdx >= 0 ? (getMergedMonster(battle.enemies[stunIdx].monsterId)?.name ?? '敵') : '';
        setBattle(b => ({ ...b, equippedWeaponId: itemId }));
        if (aliveIdxs.length > 1) {
          setBattle(b => ({
            ...b,
            turn: 'select_target',
            pendingAction: { type: 'scaling_weapon', itemId },
            equippedWeaponId: itemId,
            enemyStunTurns: stunIdx >= 0 ? { ...b.enemyStunTurns, [stunIdx]: stunSkill!.stunTurns } : b.enemyStunTurns,
            log: stunIdx >= 0 ? [...b.log, { text: `💫 ${stunName}を拘束した！(${stunSkill!.stunTurns}ターン攻撃不可)`, color: '#9b6df0' }] : b.log,
          }));
          return;
        }
        const targetIdx = aliveIdxs[0] ?? -1;
        setTimeout(() => {
          setBattle(prev => {
            if (targetIdx < 0) return { ...prev, turn: 'monster', equippedWeaponId: itemId };
            const aliveCount = prev.enemies.filter(e => e.hp > 0).length;
            const atkBase = scalingSkill.base + aliveCount * scalingSkill.perEnemy;
            const mon = getMergedMonster(prev.enemies[targetIdx].monsterId);
            const dmg = applyDefensePct(calcDamage(atkBase, mon?.defense ?? 0), mon) + scalingSkill.penetrate;
            const newEnemies = prev.enemies.map((e, i) => i === targetIdx ? { ...e, hp: Math.max(0, e.hp - dmg) } : e);
            combatFx.triggerEnemyFx(itemId, [{ idx: targetIdx, damage: dmg, isCritical: false }]);
            const logEntries = [{ text: `⚔️ ${item.name}で攻撃！ ${dmg}ダメージ！`, color: '#f0c060' }];
            const alive = newEnemies.filter(e => e.hp > 0);
            if (alive.length === 0) {
              const { exp, gold, drops } = calcWinRewards(newEnemies);
              return { ...prev, enemies: newEnemies, log: [...prev.log, ...logEntries, { text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' }, ...buildDropLogEntries(drops)], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, equippedWeaponId: itemId };
            }
            return { ...prev, enemies: newEnemies, log: [...prev.log, ...logEntries], turn: 'monster', isDefending: false, equippedWeaponId: itemId,
              enemyStunTurns: stunIdx >= 0 ? { ...prev.enemyStunTurns, [stunIdx]: stunSkill!.stunTurns } : prev.enemyStunTurns,
            };
          });
          setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
        }, 50);
        return;
      }
      // jewelry cane特別処理：防御力上昇後、割合自傷ダメージ
      const defBuffSkill = item.weaponSkills?.find(s => s.type === 'def_buff_self_dmg') as import('../../types/game').WeaponDefBuffSelfDamageSkill | undefined;
      if (defBuffSkill) {
        combatFx.triggerSelfFx(itemId, 'self');
        const newBuffs = [
          ...battle.buffs,
          { type: 'def_mult', value: defBuffSkill.defMultiplier, turns: defBuffSkill.buffTurns },
          { type: 'self_dmg_pct_hp', value: defBuffSkill.selfDmgPct, turns: defBuffSkill.selfDmgTurns, meta: { weaponName: item.name } },
        ];
        const logMsg3 = item.useEffect?.message ?? `${item.name}を発動！`;
        const newCooldowns3 = { ...battle.itemCooldowns, [itemId]: defBuffSkill.cooldownTurns };
        setBattle(b => ({
          ...b,
          log: [...b.log, { text: `🛡️ ${logMsg3} 防御力${defBuffSkill.defMultiplier}倍（${defBuffSkill.buffTurns}ターン）`, color: '#00e5ff' }],
          turn: 'monster',
          isDefending: false,
          buffs: newBuffs,
          itemCooldowns: newCooldowns3,
          equippedWeaponId: itemId,
        }));
        setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
        return;
      }
      // Damage-to-heal特別処理：自傷後、遅延回復
      const delayedHealSkill = item.weaponSkills?.find(s => s.type === 'delayed_self_heal') as import('../../types/game').WeaponDelayedSelfHealSkill | undefined;
      if (delayedHealSkill) {
        combatFx.triggerSelfFx(itemId, 'self');
        const selfDmg = Math.round(player.stats.maxHp * (delayedHealSkill.selfDamagePct / 100));
        changeHp(-selfDmg);
        const newBuffs = [...battle.buffs, { type: 'delayed_heal_pct', value: delayedHealSkill.healPct, turns: delayedHealSkill.healDelayTurns, meta: { weaponName: item.name } }];
        const newCooldowns4 = { ...battle.itemCooldowns, [itemId]: delayedHealSkill.cooldownTurns };
        const logMsg4 = item.useEffect?.message ?? `${item.name}を発動！`;
        setBattle(b => ({
          ...b,
          log: [...b.log, { text: `🩸 ${logMsg4} 自分に${selfDmg}ダメージ！（${delayedHealSkill.healDelayTurns}ターン後にHP${delayedHealSkill.healPct}%回復）`, color: '#e05555' }],
          turn: 'monster',
          isDefending: false,
          buffs: newBuffs,
          itemCooldowns: newCooldowns4,
          equippedWeaponId: itemId,
        }));
        setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
        return;
      }
      // Gread Strophea特別処理：マナを消費しながら連続攻撃＋満腹度上昇（0.1秒間隔で段階発動）
      const manaDrainSkill = item.weaponSkills?.find(s => s.type === 'mana_drain_repeat') as import('../../types/game').WeaponManaDrainRepeatSkill | undefined;
      if (manaDrainSkill) {
        const satietySkill = item.weaponSkills?.find(s => s.type === 'satiety_from_damage_pct') as import('../../types/game').WeaponSatietyFromDamageSkill | undefined;
        let mana = battle.weaponMana;
        let budgetUsed = 0;
        let enemiesSim = battle.enemies.map(e => ({ ...e }));
        let guard = 0;

        // 事前に各ヒットの結果を計算しておく（表示は0.1秒間隔で段階的に行う）
        const hitResults: { enemies: typeof enemiesSim; tIdx: number; dmg: number }[] = [];
        while (mana >= manaDrainSkill.perHitManaCost && budgetUsed < manaDrainSkill.manaBudget && enemiesSim.some(e => e.hp > 0) && guard < 200) {
          guard++;
          const tIdx = enemiesSim.findIndex(e => e.hp > 0);
          const mon = getMergedMonster(enemiesSim[tIdx].monsterId);
          const dmg = applyDefensePct(calcDamage(manaDrainSkill.perHitDamage, mon?.defense ?? 0), mon);
          enemiesSim = enemiesSim.map((e, i) => i === tIdx ? { ...e, hp: Math.max(0, e.hp - dmg) } : e);
          hitResults.push({ enemies: enemiesSim.map(e => ({ ...e })), tIdx, dmg });
          mana -= manaDrainSkill.perHitManaCost;
          budgetUsed += manaDrainSkill.perHitManaCost;
        }

        const totalDmgDealt = hitResults.reduce((acc, h) => acc + h.dmg, 0);
        const totalEnemyMaxHp = battle.enemies.reduce((acc, e) => acc + e.maxHp, 0);
        const satietyLog: { text: string; color: string }[] = [];
        if (satietySkill && totalEnemyMaxHp > 0) {
          const pct = (totalDmgDealt / totalEnemyMaxHp) * 100;
          const target = Math.min(100, pct + satietySkill.bonusFlat);
          const delta = target - player.stats.satiety;
          if (delta > 0) {
            changeSatiety(delta);
            satietyLog.push({ text: `🍖 満腹度が${Math.round(target)}まで上昇した！`, color: '#f0a830' });
          }
        }
        const finalMana = mana;
        const newCooldowns5 = { ...battle.itemCooldowns, [itemId]: manaDrainSkill.cooldownTurns };
        const logMsg5 = item.useEffect?.message ?? `${item.name}を発動！`;

        if (hitResults.length === 0) {
          setBattle(b => ({ ...b, log: [...b.log, { text: `⚔️ ${logMsg5} しかしマナが足りず発動しなかった！`, color: '#8a92b2' }], turn: 'monster', isDefending: false, weaponMana: finalMana, itemCooldowns: newCooldowns5, equippedWeaponId: itemId }));
          setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
          return;
        }

        const applyHit = (hitIdx: number, prevState: TurnBattleState) => {
          if (hitIdx >= hitResults.length) {
            setBattle(prev => {
              const manaLog = [...prev.log, ...satietyLog];
              const alive = prev.enemies.filter(e => e.hp > 0);
              if (alive.length === 0) {
                const { exp, gold, drops } = calcWinRewards(prev.enemies);
                return { ...prev, log: [...manaLog, { text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' }, ...buildDropLogEntries(drops)], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, weaponMana: finalMana, itemCooldowns: newCooldowns5 };
              }
              return { ...prev, log: manaLog, turn: 'monster', isDefending: false, weaponMana: finalMana, itemCooldowns: newCooldowns5 };
            });
            setTimeout(() => setBattle(prev => prev.turn === 'monster' ? doMonsterTurn(prev) : prev), 600);
            return;
          }
          const hr = hitResults[hitIdx];
          const prevEnemyHp = prevState.enemies[hr.tIdx]?.hp ?? 0;
          const newEnemiesArr = prevState.enemies.map((e, i) => i === hr.tIdx ? { ...e, hp: hr.enemies[hr.tIdx].hp } : e);
          combatFx.triggerEnemyFx(itemId, [{ idx: hr.tIdx, damage: hr.dmg, isCritical: false }], { shake: hitIdx === 0 });
          if (prevEnemyHp > 0 && hr.enemies[hr.tIdx].hp <= 0) combatFx.triggerDefeatFx(hr.tIdx);
          const nextState: TurnBattleState = {
            ...prevState,
            enemies: newEnemiesArr,
            log: [...prevState.log, { text: `⚔️ ${item.name} ${hitIdx + 1}/${hitResults.length}撃目！ ${hr.dmg}ダメージ！`, color: '#f0c060' }],
          };
          setBattle(nextState);
          setTimeout(() => applyHit(hitIdx + 1, nextState), 100);
        };
        applyHit(0, { ...battle, equippedWeaponId: itemId });
        return;
      }
      // Mana Rod特別処理：使用時Mana回復のみ（攻撃判定なし）
      const manaRestoreSkill = item.weaponSkills?.find(s => s.type === 'mana_restore_on_use') as import('../../types/game').WeaponManaRestoreOnUseSkill | undefined;
      if (manaRestoreSkill) {
        combatFx.triggerSelfFx(itemId, 'self');
        const newMana = Math.min(battle.weaponMana + manaRestoreSkill.amount, battle.weaponManaMax);
        const logMsg6 = item.useEffect?.message ?? `${item.name}を発動！`;
        const newCooldowns6 = manaRestoreSkill.cooldownTurns ? { ...battle.itemCooldowns, [itemId]: manaRestoreSkill.cooldownTurns } : battle.itemCooldowns;
        setBattle(b => ({
          ...b,
          log: [...b.log, { text: `💠 ${logMsg6} Mana+${manaRestoreSkill.amount}！（${newMana}/${b.weaponManaMax}）`, color: '#4fc3f7' }],
          turn: 'monster',
          isDefending: false,
          weaponMana: newMana,
          ultimateReady: newMana >= b.weaponManaMax,
          itemCooldowns: newCooldowns6,
          equippedWeaponId: itemId,
        }));
        setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
        return;
      }
      // Silvers eye特別処理：マナを消費しながら連続発動（0.2秒間隔のコンボ演出）
      const silversSkill = item.weaponSkills?.find(s => s.type === 'silvers_eye') as import('../../types/game').WeaponSilversEyeSkill | undefined;
      if (silversSkill) {
        let mana = battle.weaponMana;
        let enemies = battle.enemies.map(e => ({ ...e }));
        let activations = 0;

        // 事前に発動回数と各ヒットの結果を計算しておく
        const hitResults: { enemies: typeof enemies; dmgList: { name: string; dmg: number }[]; prevEnemies: typeof enemies }[] = [];
        while (mana >= silversSkill.manaCost && enemies.some(e => e.hp > 0)) {
          mana -= silversSkill.manaCost;
          activations++;
          const dmgList: { name: string; dmg: number }[] = [];
          const prevEnemies = enemies.map(e => ({ ...e }));
          enemies = enemies.map(e => {
            if (e.hp <= 0) return e;
            const mon = getMergedMonster(e.monsterId);
            const dmg = applyDefensePct(calcDamage(silversSkill.attackDmg, mon?.defense ?? 0), mon) + silversSkill.penetrateDmg;
            dmgList.push({ name: mon?.name ?? e.monsterId, dmg });
            return { ...e, hp: Math.max(0, e.hp - dmg) };
          });
          hitResults.push({ enemies: enemies.map(e => ({ ...e })), dmgList, prevEnemies });
        }

        // KXモード: 全ヒット合算で眷属撃破によるKXダメージを計算
        const silversKxLogs: { text: string; color: string }[] = [];
        let silversNewKxHp = battle.kx && !battle.kx.isAwakened ? battle.kx.hp : -1;
        let silversKxAwakened = false;
        let silversKxWin = false;
        if (battle.kx && !battle.kx.isAwakened && silversNewKxHp >= 0) {
          const KX_MAX_HP = battle.kx.maxHp;
          const MINION_DMG: Record<string, number> = {
            roam_armor: Math.floor(KX_MAX_HP * 0.04),
            death_armor: Math.floor(KX_MAX_HP * 0.08),
          };
          // 各ヒットで新たに死んだ眷属を集計
          let runningEnemies = battle.enemies.map(e => ({ ...e }));
          for (const hr of hitResults) {
            for (let i = 0; i < hr.enemies.length; i++) {
              if (runningEnemies[i].hp > 0 && hr.enemies[i].hp <= 0) {
                const fd = MINION_DMG[runningEnemies[i].monsterId];
                if (fd) {
                  silversNewKxHp = Math.max(0, silversNewKxHp - fd);
                  silversKxLogs.push({ text: `💥 ${getMergedMonster(runningEnemies[i].monsterId)?.name}撃破！KX-G21に${fd}ダメージ！(HP: ${silversNewKxHp}/${KX_MAX_HP})`, color: '#f0c060' });
                }
              }
            }
            runningEnemies = hr.enemies.map(e => ({ ...e }));
          }
          if (silversNewKxHp <= 0) {
            silversKxWin = true;
            addItems([{ itemId: 'super_spanner', amount: 10 }, { itemId: 'makai_bihin', amount: 10 }, { itemId: 'kx_mech_track', amount: 1 }]);
          }
        }

        const finalMana = Math.min(mana + silversSkill.manaRestore, battle.weaponManaMax);
        const newCooldowns = { ...battle.itemCooldowns, [itemId]: silversSkill.cooldownTurns };

        if (activations === 0) {
          const noManaLog = [...battle.log, { text: `👁️ マナが足りず=Silvers eye=は発動しなかった！`, color: '#8a92b2' }];
          const noManaState: TurnBattleState = {
            ...battle,
            log: noManaLog,
            turn: 'monster',
            isDefending: false,
            weaponMana: finalMana,
            itemCooldowns: newCooldowns,
            equippedWeaponId: itemId,
          };
          setBattle(noManaState);
          setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
          return;
        }

        // 最初のヒットをすぐに表示
        const applyHit = (hitIdx: number, prevState: TurnBattleState) => {
          if (hitIdx >= hitResults.length) {
            // 全ヒット完了 → KXダメージ適用 → マナ回復ログ追加してモンスターターンへ
            setBattle(prev => {
              const manaLog = [...prev.log, ...silversKxLogs, { text: `💠 =Silvers eye=の効果でマナが${silversSkill.manaRestore}回復した！（${finalMana}/${battle.weaponManaMax}）`, color: '#4fc3f7' }];
              if (silversKxAwakened) {
                return { ...prev, log: [...manaLog, { text: '「さぁ、延長戦の始まりだ！」 KX-G21が覚醒した！', color: '#ff00ff' }], enemies: [], turn: 'player', weaponMana: finalMana, itemCooldowns: newCooldowns, equippedWeaponId: itemId, kx: { ...prev.kx!, hp: 0, isAwakened: true, awakeHp: prev.kx!.awakeMaxHp, burnTurns: 0 } };
              }
              if (silversKxWin) {
                return { ...prev, log: [...manaLog, { text: '🏆 KX-G21を討伐した！', color: '#f0c060' }], weaponMana: finalMana, itemCooldowns: newCooldowns, equippedWeaponId: itemId, turn: 'result', result: 'win', kx: { ...prev.kx!, hp: 0 } };
              }
              const updatedKx = prev.kx && silversNewKxHp >= 0 ? { ...prev.kx, hp: silversNewKxHp } : prev.kx;
              return {
                ...prev,
                log: manaLog,
                weaponMana: finalMana,
                itemCooldowns: newCooldowns,
                equippedWeaponId: itemId,
                turn: 'monster',
                isDefending: false,
                kx: updatedKx,
              };
            });
            if (!silversKxWin) setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
            return;
          }
          const { enemies: hitEnemies, prevEnemies: hitPrevEnemies } = hitResults[hitIdx];
          const hitLog = [...prevState.log, {
            text: `👁️ =Silvers eye= ${hitIdx + 1}撃目！（${hitIdx + 1}/${activations}）`,
            color: '#c0c8ff',
          }];
          const silversFxHits: { idx: number; damage: number; isCritical: boolean }[] = [];
          for (let i = 0; i < hitEnemies.length; i++) {
            if (hitPrevEnemies[i].hp > 0) {
              silversFxHits.push({ idx: i, damage: hitPrevEnemies[i].hp - hitEnemies[i].hp, isCritical: false });
            }
          }
          if (silversFxHits.length > 0) combatFx.triggerEnemyFx(itemId, silversFxHits, { shake: hitIdx === 0 });
          for (let i = 0; i < hitEnemies.length; i++) {
            if (hitPrevEnemies[i].hp > 0 && hitEnemies[i].hp <= 0) combatFx.triggerDefeatFx(i);
          }
          const nextState: TurnBattleState = {
            ...prevState,
            enemies: hitEnemies,
            log: hitLog,
          };
          setBattle(nextState);
          setTimeout(() => applyHit(hitIdx + 1, nextState), 200);
        };

        applyHit(0, { ...battle, equippedWeaponId: itemId });
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
          const inlineFxHits: { idx: number; damage: number; isCritical: boolean }[] = [];
          const newEnemies = prev.enemies.map((e, i) => {
            if (e.hp <= 0) return e;
            if (!isAreaW && i !== targetIdx) return e;
            const mon = getMergedMonster(e.monsterId);
            const dmg = areaPen > 0 ? areaPen : applyDefensePct(calcDamage(atkBase, mon?.defense ?? 0), mon);
            inlineFxHits.push({ idx: i, damage: dmg, isCritical: false });
            return { ...e, hp: Math.max(0, e.hp - dmg) };
          });
          if (inlineFxHits.length > 0) {
            combatFx.triggerEnemyFx(itemId, inlineFxHits);
            for (const hit of inlineFxHits) {
              if (prev.enemies[hit.idx].hp > 0 && newEnemies[hit.idx].hp <= 0) combatFx.triggerDefeatFx(hit.idx);
            }
          }
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
            logEntries.push(...buildDropLogEntries(drops));
            return { ...newBattle, enemies: newEnemies, log: [...prev.log, ...logEntries], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops };
          }
          return { ...newBattle, enemies: newEnemies, log: [...prev.log, ...logEntries], turn: 'monster', isDefending: false };
        });
        setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
      }, 0);
      return;
    }

    if (item.itemType === 'Heal') {
      if (battle.buffs?.some(b => b.type === 'no_heal' && b.turns > 0)) {
        addNotification('warning', `${item.name}は使用できない！（回復不可状態）`);
        return;
      }
      if (!item.useEffect) { addNotification('warning', `${item.name}は使用できません`); return; }
      if (!item.nonconsumable) {
        const ok = consumeItem(itemId, 1);
        if (!ok) { addNotification('warning', `${item.name}が足りません`); return; }
      }
      combatFx.triggerSelfFx(itemId, 'self');
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

  // =-=Cataclysm Spear-Level1=-= サポート武器選択
  const handleSelectSupportWeapon = (chosenItemId: string) => {
    if (battle.turn !== 'select_support_weapon' || !battle.pendingMultiCast) return;
    const pending = battle.pendingMultiCast;
    if (pending.selectedIds.includes(chosenItemId)) return;
    const chosenItem = ITEM_MASTER[chosenItemId];
    const newSelected = [...pending.selectedIds, chosenItemId];
    const newRemaining = pending.remaining - 1;
    const selectLog = { text: `🗡️ ${chosenItem?.name ?? chosenItemId}を選択！（残り${Math.max(0, newRemaining)}回）`, color: '#c0c8ff' };

    if (newRemaining > 0) {
      setBattle(b => ({
        ...b,
        log: [...b.log, selectLog],
        pendingMultiCast: { ...pending, remaining: newRemaining, selectedIds: newSelected },
      }));
      return;
    }

    // 選択完了 → 同時発動
    const spearItemId = pending.itemId;
    const anyArea = newSelected.some(id => !!ITEM_MASTER[id]?.isAreaWeapon);
    const alive = battle.enemies.filter(e => e.hp > 0);
    setBattle(b => ({ ...b, log: [...b.log, selectLog] }));
    if (!anyArea && alive.length > 1 && !battle.kx?.isAwakened) {
      setBattle(b => ({
        ...b,
        turn: 'select_target',
        pendingAction: { type: 'multicast', itemIds: newSelected, itemId: spearItemId },
        pendingMultiCast: { ...pending, remaining: 0, selectedIds: newSelected },
      }));
      return;
    }
    const targetIdx = battle.enemies.findIndex(e => e.hp > 0);
    setTimeout(() => executeMultiCast(targetIdx, newSelected, spearItemId), 50);
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
      // レアドロップ（epic/legendary）をナチュラルニュースに投稿
      for (const d of battle.drops) {
        const item = ITEM_MASTER[d.itemId];
        if (!item) continue;
        if (item.rarity === 'epic' || item.rarity === 'legendary') {
          const prefix = item.rarity === 'legendary' ? '🌟' : '✨';
          const color = item.rarity === 'legendary' ? '#ffd700' : '#c97aff';
          postActivityFeed({
            uid: player.uid, displayName: player.displayName,
            type: 'dungeon_clear',
            message: `がダンジョンで${prefix}【${item.name}】を入手した！`,
            color,
          }).catch(() => {});
        }
      }
      if (kxConfig) {
        kxConfig.onVictory(battle.kx?.isAwakened ?? false);
      } else {
        postBossTitleIfAny(battle.enemies, player.uid, player.displayName);
        onBattleEnd(true, battle.expGained, battle.goldGained, battle.drops, 0);
      }
    } else if (battle.result === 'lose') {
      onManaUpdate?.(0);
      if (kxConfig) {
        const kxId = battle.kx?.isAwakened ? 'kx_g21_awake' : 'kx_g21';
        postActivityFeed({
          uid: player.uid, displayName: player.displayName, type: 'kill_log',
          message: KILL_LOG_MASTER[kxId]?.text ?? 'はKX-G21に敗れた。',
          color: KILL_LOG_MASTER[kxId]?.color ?? '#e05555',
        }).catch(() => {});
        kxConfig.onDefeat();
      } else {
        postKillLog(battle.enemies, player.uid, player.displayName);
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
    <div style={{ background: '#161b26', border: '2px solid #e05555', borderRadius: 12, padding: 14, overflow: 'hidden' }}>
      <div key={combatFx.shakeKey} className={combatFx.shakeKey > 0 ? 'combatfx-shake' : undefined}>
      {/* ターゲット選択モーダル */}
      {battle.turn === 'select_target' && (
        <TargetSelectModal
          enemies={battle.enemies}
          onSelect={(idx) => {
            const pending = battle.pendingAction;
            setBattle(b => ({ ...b, turn: 'player', pendingAction: null }));
            if (pending?.type === 'multicast' && pending.itemIds && pending.itemId) {
              setTimeout(() => executeMultiCast(idx, pending.itemIds!, pending.itemId!), 50);
            } else if (pending?.type === 'scaling_weapon' && pending.itemId) {
              const scItem = ITEM_MASTER[pending.itemId];
              const scSkill = scItem?.weaponSkills?.find(s => s.type === 'scaling_attack') as import('../../types/game').WeaponScalingAttackSkill | undefined;
              setTimeout(() => {
                setBattle(prev => {
                  if (!scSkill) return prev;
                  const aliveCount = prev.enemies.filter(e => e.hp > 0).length;
                  const atkBase = scSkill.base + aliveCount * scSkill.perEnemy;
                  const mon = getMergedMonster(prev.enemies[idx].monsterId);
                  const dmg = applyDefensePct(calcDamage(atkBase, mon?.defense ?? 0), mon) + scSkill.penetrate;
                  const newEnemies = prev.enemies.map((e, i) => i === idx ? { ...e, hp: Math.max(0, e.hp - dmg) } : e);
                  combatFx.triggerEnemyFx(pending.itemId!, [{ idx, damage: dmg, isCritical: false }]);
                  const logEntries = [{ text: `⚔️ ${scItem?.name ?? ''}で攻撃！ ${dmg}ダメージ！`, color: '#f0c060' }];
                  const alive = newEnemies.filter(e => e.hp > 0);
                  if (alive.length === 0) {
                    const { exp, gold, drops } = calcWinRewards(newEnemies);
                    return { ...prev, enemies: newEnemies, log: [...prev.log, ...logEntries, { text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' }, ...buildDropLogEntries(drops)], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, equippedWeaponId: pending.itemId! };
                  }
                  return { ...prev, enemies: newEnemies, log: [...prev.log, ...logEntries], turn: 'monster', isDefending: false, equippedWeaponId: pending.itemId! };
                });
                setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
              }, 50);
            } else if (pending?.type === 'attack') {
              setTimeout(() => executeAttack(idx), 50);
            } else if (pending?.type === 'weapon' && pending.itemId) {
              const item = ITEM_MASTER[pending.itemId];
              const atkBase = item?.weaponAtk ?? (item?.useEffect?.attackBonus ? player.stats.attack + item.useEffect.attackBonus : player.stats.attack);
              setTimeout(() => {
                setBattle(prev => {
                  const newEnemies = prev.enemies.map((e, i) => {
                    if (e.hp <= 0 || i !== idx) return e;
                    const mon = getMergedMonster(e.monsterId);
                    const dmg = applyDefensePct(calcDamage(atkBase, mon?.defense ?? 0), mon);
                    return { ...e, hp: Math.max(0, e.hp - dmg) };
                  });
                  const logEntries = [{ text: `🗡️ ${item?.name ?? ''}で攻撃！`, color: '#f0c060' }];
                  const alive = newEnemies.filter(e => e.hp > 0);
                  if (alive.length === 0) {
                    const { exp, gold, drops } = calcWinRewards(newEnemies);
                    return { ...prev, enemies: newEnemies, log: [...prev.log, ...logEntries, { text: `✨ 全敵を倒した！ EXP+${exp} G+${gold}`, color: '#f0c060' }, ...buildDropLogEntries(drops)], turn: 'result', result: 'win', expGained: exp, goldGained: gold, drops, equippedWeaponId: pending.itemId! };
                  }
                  const after: TurnBattleState = { ...prev, enemies: newEnemies, log: [...prev.log, ...logEntries], turn: 'monster', isDefending: false, equippedWeaponId: pending.itemId! };
                  return after;
                });
                setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
              }, 50);
            }
          }}
          onCancel={() => setBattle(b => ({ ...b, turn: 'player', pendingAction: null, pendingMultiCast: null }))}
        />
      )}

      {/* =-=Cataclysm Spear-Level1=-= サポート武器選択モーダル */}
      {battle.turn === 'select_support_weapon' && battle.pendingMultiCast && (
        <div style={{ background: '#0a0d18', border: '2px solid #9b6df0', borderRadius: 10, padding: 14, marginBottom: 10 }}>
          <div style={{ color: '#9b6df0', fontWeight: 700, marginBottom: 8 }}>
            武器を選んでください（残り{battle.pendingMultiCast.remaining}回）
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {localEquip.hotbar.map((slotId, idx) => {
              if (!slotId || slotId === battle.pendingMultiCast!.itemId) return null;
              const slotItem = ITEM_MASTER[slotId];
              if (!slotItem || slotItem.itemType !== 'Weapon') return null;
              if (battle.pendingMultiCast!.selectedIds.includes(slotId)) return null;
              const cd = battle.itemCooldowns[slotId] ?? 0;
              const disabled = cd > 0;
              return (
                <button
                  key={`${slotId}-${idx}`}
                  disabled={disabled}
                  onClick={() => handleSelectSupportWeapon(slotId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                    background: disabled ? '#222' : '#1b2030', border: '1px solid #9b6df0',
                    borderRadius: 8, color: disabled ? '#666' : '#e8e6ff', cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <GameIcon id={slotItem.icon} size={20} />
                  {slotItem.name}{disabled ? `（CD${cd}）` : ''}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setBattle(b => ({ ...b, turn: 'player', pendingMultiCast: null }))}
            style={{ marginTop: 10, padding: '4px 10px', background: '#222', border: '1px solid #555', borderRadius: 6, color: '#ccc', cursor: 'pointer' }}
          >
            キャンセル
          </button>
        </div>
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
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ fontWeight: 700, color: isDead ? '#4a5070' : '#e05555', fontSize: '0.88rem' }}>
                  {monster?.name ?? '?'}{monster?.isBoss && ' 👑'}{isDead && ' 💀'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#8a92b2', marginBottom: 2 }}>HP {enemy.hp}/{enemy.maxHp}</div>
                <div style={{ height: 5, background: '#2d3752', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: isDead ? '#4a5070' : '#e05555', width: `${mHpPct}%`, transition: 'width 0.3s' }} />
                </div>
                <EnemyFxOverlay fxList={combatFx.enemyFx[i] ?? []} />
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
        {/* アクティブなバフ・デバフ表示（防御力強化・HP固定など発動確認用） */}
        {battle.buffs && battle.buffs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {battle.buffs.filter(b => b.turns > 0).map((b, i) => {
              const labelMap: Record<string, { text: string; color: string }> = {
                def_mult: { text: `🛡️ 防御力${b.value}倍`, color: '#00e5ff' },
                self_dmg_pct_hp: { text: `🩸 自傷${b.value}%/turn`, color: '#e05555' },
                hp_cap_pct: { text: `⚠️ HP${b.value}%固定`, color: '#9b6df0' },
                no_heal: { text: `🚫 回復不可`, color: '#9b6df0' },
                delayed_multihit: { text: `⏳ ${b.meta?.weaponName ?? '武器'}発動待ち`, color: '#9b6df0' },
                delayed_heal_pct: { text: `⏳ ${b.meta?.weaponName ?? '武器'}回復待ち`, color: '#4caf87' },
                poison: { text: `☠️ 毒`, color: '#9b6df0' },
              };
              const info = labelMap[b.type] ?? { text: b.type, color: '#8a92b2' };
              return (
                <span key={`${b.type}-${i}`} style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${info.color}`, color: info.color }}>
                  {info.text}（残{b.turns}T）
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ログ */}
      {(() => {
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
              <button onClick={() => setLogExpanded(v => !v)}
                style={{ background: 'none', border: '1px solid #2d3752', borderRadius: 4, color: '#7a82aa', cursor: 'pointer', padding: '1px 8px', fontSize: '0.65rem' }}>
                {logExpanded ? '⤡ ログを縮小' : '⤢ ログを拡大'}
              </button>
            </div>
            <div
              style={{ background: '#0e1220', borderRadius: 6, padding: '6px 8px', height: logExpanded ? 400 : 220, transition: 'height 0.2s', overflowY: 'auto', marginBottom: 10, fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 1 }}
              ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
            >
              {battle.log.map((l, i) => (
                <div key={i} style={{ color: l.color, padding: '1px 0', lineHeight: 1.4 }}>{l.text}</div>
              ))}
            </div>
          </>
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

          {/* パルヴァトス一式スキル：マナ回復 */}
          {(() => {
            const armorIds = [localEquip.helmet, localEquip.chestplate, localEquip.leggings, localEquip.boots, localEquip.offhand];
            const parvatosCount = armorIds.filter(id => id && ['parvatos_helmet','parvatos_chest','parvatos_leggings','parvatos_boots','parvatos_offhand'].includes(id)).length;
            const hasFullSet = parvatosCount >= 5;
            const canActivate = hasFullSet && battle.weaponMana <= 800 && battle.turn === 'player' && !battle.result;
            if (parvatosCount === 0) return null;
            return (
              <button
                disabled={!canActivate}
                onClick={() => {
                  if (!canActivate) return;
                  const newMana = Math.min(800, battle.weaponManaMax);
                  setBattle(b => ({
                    ...b,
                    weaponMana: newMana,
                    ultimateReady: newMana >= b.weaponManaMax,
                    log: [...b.log, { text: `⚙️ パルヴァトス【マナ回復】発動！MANAを800まで回復した！(${newMana}/${b.weaponManaMax})`, color: '#00e5ff' }],
                    turn: 'monster',
                  }));
                  setTimeout(() => setBattle(prev => doMonsterTurn(prev)), 600);
                }}
                style={{
                  width: '100%', padding: '7px', marginBottom: 8,
                  background: canActivate ? 'linear-gradient(135deg,#006064,#00838f)' : '#1c2235',
                  color: canActivate ? '#e0f7fa' : '#4a5070',
                  border: `1px solid ${canActivate ? '#00e5ff' : '#2d3752'}`,
                  borderRadius: 8, cursor: canActivate ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.8rem',
                }}>
                ⚙️ パルヴァトス【マナ回復】{!hasFullSet ? `（一式装備で解放 ${parvatosCount}/5）` : battle.weaponMana > 800 ? `（MANA≤800で発動可）` : ''}
              </button>
            );
          })()}

          {/* ホットバーアイテム使用 */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap', position: 'relative' }}>
            <SelfFxBanner fxList={combatFx.selfFx} />
            {localEquip.hotbar.map((itemId, i) => {
              const item = itemId ? ITEM_MASTER[itemId] : null;
              const qty = itemId ? (player.inventory[itemId] ?? 0) : 0;
              const cd = itemId ? (battle.itemCooldowns[itemId] ?? 0) : 0;
              const isEquippedAndActive = !!itemId && itemId === battle.equippedWeaponId && combatFx.selfFx.length > 0;
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
                  {isEquippedAndActive && <SelfFxBadge fxList={combatFx.selfFx} />}
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
    </div>
  );
}

// ============================================================
// 解放条件バッジ
// ============================================================
// ダンジョンの推奨装備ヒントを判定（複数敵が多いか、ボスが高防御か等のヒューリスティック）
function getEquipmentHint(dungeon: DungeonMaster): string | null {
  const areas = dungeon.areas ?? dungeon.routes?.main;
  if (!areas || areas.length === 0) return null;
  let totalCount = 0, areaCount = 0, bossDefPct = 0;
  for (const area of areas) {
    if (!area.monsters || area.monsters.length === 0) continue;
    totalCount += area.monsters.reduce((s, m) => s + (m.count ?? 1), 0);
    areaCount++;
    for (const m of area.monsters) {
      if (m.isBoss) {
        const mm = MONSTER_MASTER[m.monsterId];
        if (mm?.defensePct) bossDefPct = Math.max(bossDefPct, mm.defensePct);
      }
    }
  }
  const avgPerArea = areaCount > 0 ? totalCount / areaCount : 0;
  if (avgPerArea >= 3) return '👥 範囲武器が有効（多数の敵が同時出現）';
  if (bossDefPct >= 0.5) return '🛡️ 貫通武器がおすすめ（ボスは高防御）';
  if (dungeon.tier === 'volcano' || dungeon.tier === 'extreme') return '⚔️ 火力・防御を両立した装備で挑もう';
  return null;
}

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
function DungeonCard({ dungeon, selected, onSelect, playerLevel, clearedCount, isUnlocked, isRecommended }: {
  dungeon: DungeonMaster; selected: boolean; onSelect: () => void;
  playerLevel: number; clearedCount: number; isUnlocked: boolean; isRecommended?: boolean;
}) {
  const meetsLevel = playerLevel >= dungeon.requiredLevel;
  const canSelect = isUnlocked;
  const tierColors: Record<string, string> = {
    beginner: '#4caf87', intermediate: '#5b8dee', advanced: '#f0a830',
    super: '#e05555', extreme: '#9b6df0', volcano: '#ff6b35',
  };
  const color = tierColors[dungeon.tier] ?? '#5b8dee';
  const uc = (dungeon as any).unlockCondition as { dungeonId: string; clearedCount: number } | undefined;
  const equipmentHint = getEquipmentHint(dungeon);
  return (
    <button onClick={() => canSelect && onSelect()}
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        background: selected ? 'rgba(91,141,238,0.15)' : '#1c2235',
        border: `2px solid ${selected ? color : isRecommended && canSelect ? '#f0c060' : meetsLevel && isUnlocked ? '#2d3752' : canSelect ? 'rgba(240,168,48,0.3)' : '#1c2235'}`,
        borderRadius: 10, padding: '10px 14px', textAlign: 'left',
        color: '#e8e6ff', cursor: canSelect ? 'pointer' : 'not-allowed',
        opacity: canSelect ? 1 : 0.6, transition: 'all 0.2s', width: '100%',
        boxShadow: isRecommended && canSelect && !selected ? '0 0 0 1px rgba(240,192,96,0.4)' : 'none',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.8rem' }}><GameIcon id={dungeon.icon} size={36} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            {dungeon.name}
            {!isUnlocked && <span>🔒</span>}
            {isRecommended && canSelect && <span style={{ fontSize: '0.65rem', color: '#1c2235', background: '#f0c060', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>🌟 おすすめ</span>}
            {!meetsLevel && isUnlocked && <span style={{ fontSize: '0.7rem', color: '#e05555', background: 'rgba(224,85,85,0.15)', padding: '1px 5px', borderRadius: 4 }}>戦闘Lv不足</span>}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginTop: 2 }}>{dungeon.description}</div>
          <div style={{ fontSize: '0.7rem', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color }}>★ {dungeon.tier.toUpperCase()}</span>
            <span style={{ color: meetsLevel ? '#4caf87' : '#e05555' }}>戦闘Lv.{dungeon.requiredLevel}〜</span>
            <span style={{ color: '#f0c060' }}>EXP×{dungeon.expBonus} G×{dungeon.goldBonus}</span>
            {clearedCount > 0 && <span style={{ color: '#4caf87' }}>✓ {clearedCount}回クリア</span>}
          </div>
          {equipmentHint && <div style={{ fontSize: '0.68rem', color: '#7fb3ff', marginTop: 3 }}>{equipmentHint}</div>}
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
  const [icActive, setIcActive] = useState(false);
  const [runState, setRunState] = useState<DungeonRunState | null>(null);
  const [inBattle, setInBattle] = useState(false);
  const [battleKey, setBattleKey] = useState(0); // バトルコンポーネント再生成用
  const [equipment, _setEquipment] = useState<EquipmentSlots>(() => player?.equipment ?? defaultEquipmentSlots());
  const [showUnlockGuide, setShowUnlockGuide] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);
  const [dungeonInnerTab, setDungeonInnerTab] = useState<'dungeon' | 'gacha' | 'trap' | 'freefield'>('dungeon');
  const [dungeonMana, setDungeonMana] = useState(0);
  const [showBossChoice, setShowBossChoice] = useState(false);
  const [kxBossMode, setKxBossMode] = useState(false);
  const [showDevilArmorChoice, setShowDevilArmorChoice] = useState(false);
  const [showZeroChoice, setShowZeroChoice] = useState(false);
  const [showVolcanoRouteChoice, setShowVolcanoRouteChoice] = useState(false); // 火山CP3分岐UI
  const [volcanoRoutePending, setVolcanoRoutePending] = useState<'lich'|'back'|null>(null); // 大橋突破後に切り替えるルート
  const [autoBattle, setAutoBattle] = useState(false);
  // 0=なし, 1=デビルアーマー戦, 2=デッドアーマー戦
  const [devilArmorPhase, setDevilArmorPhase] = useState(0);
  // FF フリーフィールド戦闘
  const [ffBattleRunState, setFfBattleRunState] = useState<DungeonRunState | null>(null);
  const [ffBattleKey, setFfBattleKey] = useState(0);
  const [ffBattleMana, setFfBattleMana] = useState(0);
  const [ffEncounterProfileId, setFfEncounterProfileId] = useState<string>('');  // ループ用：現在のenounterProfileId
  const [ffBattleAreaName, setFfBattleAreaName] = useState<string>('');           // ループ用：表示エリア名
  const [ffLoopStats, setFfLoopStats] = useState<{wins:number;totalExp:number;totalGold:number}>({wins:0,totalExp:0,totalGold:0});
  // 無限深層回廊：実戦闘（ホットバー/武器選択TurnBattle）
  const icCurrentFloor = useGameStore(s => s.icCurrentFloor);
  const icBattleActive = useGameStore(s => s.icBattleActive);
  const icBattleKey = useGameStore(s => s.icBattleKey);
  const icBattleMana = useGameStore(s => s.icBattleMana);
  const icResolveBattleWin = useGameStore(s => s.icResolveBattleWin);
  const icResolveBattleLose = useGameStore(s => s.icResolveBattleLose);
  const icCancelBattle = useGameStore(s => s.icCancelBattle);
  const icSetBattleMana = useGameStore(s => s.icSetBattleMana);

  const HIDDEN_DUNGEON_IDS = ['devil_armor_fight', 'dead_armor_fight', 'sky_castle_ex', 'dragons_lair', 'ff_forest', 'ff_plain', 'ff_desert', 'ff_snow', 'ff_savanna', 'ff_pirate', 'chaite', 'ff1_main', 'ff1_cave1', 'ff1_cave2', 'ff1_cave3', 'ff2_main', 'ff_dungeon'];
  const dungeons = Object.values(DUNGEON_MASTER).filter(d => !HIDDEN_DUNGEON_IDS.includes(d.id));
  const lockedDungeons = dungeons.filter(d => !isDungeonUnlocked(d.id));

  // 戦闘Lvに最適な「おすすめ」ダンジョンを判定（解放済み＆Lv要件を満たす中で最も要求Lvが高いもの＝今の実力に最適）
  const recommendedDungeonId = (() => {
    const combatLvNow = player?.skillLevels['combat'] ?? 1;
    const unlockedDungeons = dungeons.filter(d => isDungeonUnlocked(d.id));
    const eligible = unlockedDungeons.filter(d => combatLvNow >= d.requiredLevel);
    if (eligible.length > 0) {
      return eligible.reduce((best, d) => d.requiredLevel > best.requiredLevel ? d : best).id;
    }
    if (unlockedDungeons.length > 0) {
      return unlockedDungeons.reduce((best, d) => d.requiredLevel < best.requiredLevel ? d : best).id;
    }
    return null;
  })();

  const startDungeon = useCallback(() => {
    if (!player || !selectedId) return;
    if (selectedId === 'infinite_corridor') { setIcActive(true); return; }
    const dungeon = getDungeon(selectedId);
    const combatLv = player.skillLevels['combat'] ?? 1;
    if (!dungeon || combatLv < dungeon.requiredLevel) {
      addNotification('warning', `戦闘スキルLv.${dungeon?.requiredLevel}以上が必要です（現在: Lv.${combatLv}）`);
      return;
    }
    if (!isDungeonUnlocked(selectedId)) { addNotification('error', '🔒 このダンジョンはまだ解放されていません'); return; }
    if (player.stats.hp <= 0) { addNotification('error', 'HPが0です。回復してから挑戦してください。'); return; }
    const _dg = getDungeon(selectedId);
    const _entryAreas = (_dg as any)?.routes?.main ?? _dg?.areas;
    // 敵が一切いない通過専用エリア（観賞用の導入区間など）は戦闘なしで自動的に通過する
    let _startAreaIdx = 0;
    const _skipLog: string[] = [];
    if (_entryAreas) {
      while (_startAreaIdx < _entryAreas.length - 1 && (_entryAreas[_startAreaIdx] as any)?.monsters?.length === 0) {
        _skipLog.push(`📍 ${(_entryAreas[_startAreaIdx] as any).name} を通過した（敵なし）。`);
        _startAreaIdx++;
      }
    }
    const _firstAreaName = _entryAreas?.[_startAreaIdx]?.name ?? 'エリア1';
    setRunState({ dungeonId: selectedId, currentFloor: 1, currentAreaName: _firstAreaName, monstersDefeated: 0, totalExp: 0, totalGold: 0, totalDrops: [], isComplete: false, isFailed: false, currentAreaIdx: _startAreaIdx, volcanoRoute: selectedId === 'volcano' ? undefined : undefined });
    setRunLog([`⚔️ ${dungeon.name} に突入！`, ..._skipLog]);
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
    // 火山の場合はvolcanoRouteに応じたエリアリストを使用
    const volcanoMaster = dungeon?.id === 'volcano' ? dungeon as any : null;
    const currentVolcanoRoute = runState.volcanoRoute;
    const areas = dungeon?.id === 'volcano' && volcanoMaster?.routes
      ? (currentVolcanoRoute === 'lich' ? volcanoMaster.routes.lich
        : currentVolcanoRoute === 'back' ? volcanoMaster.routes.back
        : volcanoMaster.routes.main)
      : dungeon?.areas;
    let nextAreaIdx = runState.currentAreaIdx ?? 0;
    let isComplete = false;

    // 洞窟王（初級ダンジョンの最終エリア）は1体倒したらクリア選択を即表示
    if (
      runState.dungeonId === 'beginner_cave' &&
      areas &&
      nextAreaIdx === areas.length - 1
    ) {
      recordDungeonClear(runState.dungeonId);
      addNotification('success', `🏆 洞窟王撃破！🪙 ガチャコイン+1枚！`);
      if (player) postActivityFeed({ uid: player.uid, displayName: player.displayName, type: 'dungeon_clear', message: `が「${dungeon?.name}」をクリアしました！` }).catch(() => {});
      setRunState(prev => prev ? {
        ...prev, monstersDefeated: newDefeated, totalExp: newExp, totalGold: newGold,
        totalDrops: allDrops, isComplete: false,
      } : null);
      setShowBossChoice(true);
      return;
    }

    // ボスが配置されたエリアは1体倒せば即クリア扱いとする
    // （ボスエリアは常に単体スポーンのため、5体撃破を待つと同じ相手と何度も再戦になってしまう）
    // ※中ボス(isMidBoss)は他エリアで道中の圧として意図的に何度も出現させている場合があるため対象外とし、
    //   チェイテのナイト・メア部屋（中ボス単体の専用ルーム）のみ個別に同様の即クリア対象とする。
    const currentAreaForBossCheck = areas?.[nextAreaIdx] as any;
    const isCurrentAreaBossFight = !!currentAreaForBossCheck?.monsters?.some((m: any) => {
      const mon = getMergedMonster(m.monsterId);
      return mon?.isBoss;
    }) || (runState.dungeonId === 'chaite' && !!currentAreaForBossCheck?.monsters?.some((m: any) => m.monsterId === 'chaite_nightmare'));

    if ((newDefeated % areaThreshold === 0 || isCurrentAreaBossFight) && areas) {
      if (nextAreaIdx < areas.length - 1) {
        nextAreaIdx = nextAreaIdx + 1;
        // 敵が一切いない通過専用エリア（休憩地帯など）は戦闘なしで自動的に通過する
        const skipMsgs: string[] = [];
        while (nextAreaIdx < areas.length - 1 && (areas[nextAreaIdx] as any)?.monsters?.length === 0) {
          skipMsgs.push(`📍 ${(areas[nextAreaIdx] as any).name} を通過した（敵なし）。`);
          nextAreaIdx++;
        }
        const nextArea = areas[nextAreaIdx] as any;
        addNotification('info', `✅ ${nextArea.name} に進んだ！`);
        setRunLog(prev => [...prev, ...skipMsgs, `📍 ${nextArea.name} へ進んだ！`]);

        // ── 火山CP3分岐：共通ルートのisBranchPointエリアに進んだ時に分岐選択UIを出す ──
        if (runState.dungeonId === 'volcano' && !currentVolcanoRoute && nextArea.isBranchPoint) {
          setRunState(prev => prev ? {
            ...prev, currentAreaIdx: nextAreaIdx,
            currentAreaName: nextArea.name,
            monstersDefeated: newDefeated, totalExp: newExp, totalGold: newGold,
            totalDrops: allDrops, currentFloor: Math.min(prev.currentFloor + 1, dungeon?.floors ?? 1),
          } : null);
          setShowVolcanoRouteChoice(true);
          return;
        }

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
        // ── 火山：mainルート最終エリア（大橋地帯3層目）突破 → pendingルートへ切り替え ──
        if (runState.dungeonId === 'volcano' && currentVolcanoRoute === 'main' && volcanoRoutePending) {
          const pendingRoute = volcanoRoutePending;
          const volcanoMasterForRoute = dungeon as any;
          const nextRouteAreas = pendingRoute === 'lich'
            ? volcanoMasterForRoute?.routes?.lich
            : volcanoMasterForRoute?.routes?.back;
          const firstAreaName = nextRouteAreas?.[0]?.name ?? (pendingRoute === 'lich' ? 'リッチの間・前哨' : '裏火山入口');
          const routeLabel = pendingRoute === 'lich' ? '🔮 リッチ討伐ルート' : '🏯 裏火山本線';
          addNotification('success', `${routeLabel} へ突入！`);
          setRunLog(prev => [...prev, `🌋 大橋地帯を突破！${routeLabel} へ切り替え`, `📍 ${firstAreaName} へ進んだ！`]);
          // monstersDefeatedを次のエリア進行のために5の倍数-1に調整
          const cur = newDefeated;
          const aligned = Math.ceil((cur + 1) / 5) * 5 - 1;
          setRunState(prev => prev ? {
            ...prev, volcanoRoute: pendingRoute, currentAreaIdx: 0,
            currentAreaName: firstAreaName,
            monstersDefeated: aligned, totalExp: newExp, totalGold: newGold,
            totalDrops: allDrops, currentFloor: Math.min(prev.currentFloor + 1, dungeon?.floors ?? 1),
          } : null);
          setVolcanoRoutePending(null);
          setBattleKey(k => k + 1);
          setInBattle(true);
          return;
        }

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
  }, [runState, player, changeSatiety, addExp, addSkillExp, changeGold, addItems, addNotification, recordDungeonClear, volcanoRoutePending]);

  const handleEscapeBattle = useCallback(() => {
    setInBattle(false);
    setAutoBattle(false);
    setRunLog(prev => [...prev, '🏃 逃走した。']);
  }, []);

  // ── フリーフィールド戦闘ハンドラ ──
  const handleStartFFBattle = useCallback((req: FFBattleRequest) => {
    if (!player) return;
    // チェイテ（chaite）は多階層ダンジョン → 通常のダンジョン実行フローで起動する
    if (req.dungeonId === 'chaite') {
      const dungeon = getDungeon('chaite');
      if (!dungeon || !dungeon.areas) return;
      const firstArea = dungeon.areas[0];
      const rs: DungeonRunState = {
        dungeonId: 'chaite',
        currentFloor: 1,
        currentAreaName: firstArea.name,
        currentAreaIdx: 0,
        monstersDefeated: 0,
        totalExp: 0,
        totalGold: 0,
        totalDrops: [],
        isComplete: false,
        isFailed: false,
      };
      setRunState(rs);
      setInBattle(true);
      setBattleKey(k => k + 1);
      setDungeonInnerTab('dungeon');
      return;
    }
    const profileId = req.dungeonId; // dungeonIdをenounterProfileIdとして使う
    setFfEncounterProfileId(profileId);
    setFfBattleAreaName(req.areaName);
    setFfLoopStats({ wins: 0, totalExp: 0, totalGold: 0 });
    const rs: DungeonRunState = {
      dungeonId: profileId,
      currentFloor: 1,
      currentAreaName: req.areaName,
      currentAreaIdx: 0,
      monstersDefeated: 0,
      totalExp: 0,
      totalGold: 0,
      totalDrops: [],
      isComplete: false,
      isFailed: false,
    };
    setFfBattleRunState(rs);
    setFfBattleKey(k => k + 1);
    setFfBattleMana(0);
  }, [player, getDungeon]);

  // 勝利 → ループ継続（nullにしない）、敗北 → 画面を閉じる
  const handleFFBattleEnd = useCallback((won: boolean, expGained: number, goldGained: number, drops: {itemId:string;amount:number}[], _hpDelta: number) => {
    if (won) {
      addItems(drops);
      addExp(expGained);
      changeGold(goldGained);
      addSkillExp('combat', Math.floor(expGained / 2));
      setFfLoopStats(prev => ({ wins: prev.wins + 1, totalExp: prev.totalExp + expGained, totalGold: prev.totalGold + goldGained }));
      // 同じenounterProfileIdで新しいバトルを即起動（ループ）
      setFfBattleRunState(prev => prev ? {
        ...prev,
        monstersDefeated: (prev.monstersDefeated ?? 0) + 1,
        totalExp: (prev.totalExp ?? 0) + expGained,
        totalGold: (prev.totalGold ?? 0) + goldGained,
        isComplete: false,
        isFailed: false,
      } : null);
      setFfBattleKey(k => k + 1);
    } else {
      addNotification('error', '💀 FF戦闘敗北...');
      setFfBattleRunState(null);
      setFfLoopStats({ wins: 0, totalExp: 0, totalGold: 0 });
    }
  }, [addNotification, addItems, addExp, changeGold, addSkillExp]);

  // 逃走（敵がいなくなっても続行しない意思表示） → ループ継続
  const handleFFBattleEscape = useCallback(() => {
    addNotification('info', '💨 逃走した。次の敵が出現...');
    setFfBattleKey(k => k + 1);
  }, [addNotification]);

  // 「フィールドを離れる」ボタン → 完全終了
  const handleFFBattleLeave = useCallback(() => {
    addNotification('info', `🚪 フリーフィールドを離れた（${ffLoopStats.wins}戦 EXP+${ffLoopStats.totalExp} G+${ffLoopStats.totalGold}）`);
    setFfBattleRunState(null);
    setFfLoopStats({ wins: 0, totalExp: 0, totalGold: 0 });
  }, [addNotification, ffLoopStats]);

  // オートバトル：戦闘終了後に自動で次の戦闘を開始
  useEffect(() => {
    if (!autoBattle || inBattle || !runState || runState.isComplete || runState.isFailed || showBossChoice || showZeroChoice || showDevilArmorChoice || showVolcanoRouteChoice || kxBossMode) return;
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
    setRunState(null); setInBattle(false); setRunLog([]); setShowBossChoice(false); setShowDevilArmorChoice(false); setDevilArmorPhase(0); setShowVolcanoRouteChoice(false);
  }, [addNotification]);

  if (!player) return null;

  const dungeonTabActive = dungeonInnerTab === 'dungeon';
  const gachaTabActive = dungeonInnerTab === 'gacha';
  const trapTabActive = dungeonInnerTab === 'trap';
  const freeFieldTabActive = dungeonInnerTab === 'freefield';

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
        <button onClick={() => setDungeonInnerTab('freefield')}
          style={{ flex: 1, padding: '8px', fontWeight: 700, fontSize: '0.85rem', background: freeFieldTabActive ? 'rgba(96,160,255,0.15)' : '#1c2235', border: `1px solid ${freeFieldTabActive ? '#60a0ff' : '#2d3752'}`, color: freeFieldTabActive ? '#60a0ff' : '#8a92b2', borderRadius: 8, cursor: 'pointer' }}>
          🗺️ FF
        </button>
      </div>

      {gachaTabActive && <GachaPanel player={player} addItems={addItems} changeGold={changeGold} addNotification={addNotification} />}
      {trapTabActive && <TrapWorldPanel player={player} addItems={addItems} addNotification={addNotification} />}
      {freeFieldTabActive && <FreeFieldScreen onStartFFBattle={handleStartFFBattle} />}
      {/* FF フリーフィールド戦闘オーバーレイ（TurnBattle） */}
      {ffBattleRunState && freeFieldTabActive && (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0d14', zIndex: 1000, overflowY: 'auto' }}>
          <div style={{ maxWidth: 520, margin: '0 auto', padding: '12px 12px 80px' }}>
            {/* ヘッダー：エリア名・ループ統計・離脱ボタン */}
            <div style={{ background: 'rgba(96,160,255,0.10)', border: '1px solid #2d3752', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#60a0ff', fontWeight: 700 }}>
                  🗺️ {ffBattleAreaName || ffBattleRunState.currentAreaName}
                </span>
                <button
                  onClick={handleFFBattleLeave}
                  style={{ padding: '4px 10px', background: 'rgba(200,80,80,0.2)', border: '1px solid #c05050', color: '#e07070', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  🚪 フィールドを離れる
                </button>
              </div>
              {ffLoopStats.wins > 0 && (
                <div style={{ marginTop: 4, fontSize: '0.68rem', color: '#8a92b2' }}>
                  🔁 {ffLoopStats.wins}戦 ／ EXP+{ffLoopStats.totalExp} ／ G+{ffLoopStats.totalGold}
                </div>
              )}
            </div>
            <TurnBattle
              key={ffBattleKey}
              runState={ffBattleRunState}
              equipment={player?.equipment ?? defaultEquipmentSlots()}
              onBattleEnd={handleFFBattleEnd}
              onEscape={handleFFBattleEscape}
              initialMana={ffBattleMana}
              onManaUpdate={setFfBattleMana}
            />
          </div>
        </div>
      )}
      {!gachaTabActive && !trapTabActive && !freeFieldTabActive && !icActive && <>
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
                isUnlocked={isDungeonUnlocked(d.id)}
                isRecommended={d.id === recommendedDungeonId} />
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
            <div style={{ fontSize: '0.8rem', color: '#5b8dee', marginBottom: 6 }}>
              📍 {runState.currentAreaName}
              {/* CP・難所・ルートバッジ */}
              {(() => {
                const _vm = DUNGEON_MASTER[runState.dungeonId] as any;
                const _vr = runState.volcanoRoute;
                const _areas = (_vm?.routes && runState.dungeonId === 'volcano')
                  ? (_vr === 'lich' ? _vm.routes.lich : _vr === 'back' ? _vm.routes.back : _vm.routes.main)
                  : _vm?.areas;
                const _area = _areas?.[runState.currentAreaIdx ?? 0] as any;
                return <>
                  {_area?.checkpointLabel && <span style={{ marginLeft: 6, fontSize:'0.7rem', background:'#1a6640', color:'#4caf87', borderRadius:4, padding:'1px 6px', fontWeight:700 }}>{_area.checkpointLabel}</span>}
                  {_area?.isHardArea && !_area?.checkpointLabel && <span style={{ marginLeft: 6, fontSize:'0.7rem', background:'#4a1a1a', color:'#e05555', borderRadius:4, padding:'1px 6px', fontWeight:700 }}>⚠ 難所</span>}
                  {_area?.isBranchPoint && <span style={{ marginLeft: 6, fontSize:'0.7rem', background:'#3a2a00', color:'#ff9900', borderRadius:4, padding:'1px 6px', fontWeight:700 }}>🔀 分岐点</span>}
                  {runState.volcanoRoute === 'lich' && <span style={{ marginLeft: 6, fontSize:'0.7rem', background:'#2a0050', color:'#cc88ff', borderRadius:4, padding:'1px 6px', fontWeight:700 }}>🔮 リッチルート</span>}
                  {runState.volcanoRoute === 'back' && <span style={{ marginLeft: 6, fontSize:'0.7rem', background:'#500000', color:'#ff6666', borderRadius:4, padding:'1px 6px', fontWeight:700 }}>🏯 裏火山本線</span>}
                </>;
              })()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.8rem', marginBottom: 8 }}>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#8a92b2' }}>撃破数</div><div style={{ color: '#e8e6ff', fontWeight: 700 }}>{runState.monstersDefeated}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#8a92b2' }}>獲得EXP</div><div style={{ color: '#5b8dee', fontWeight: 700 }}>{runState.totalExp}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#8a92b2' }}>獲得G</div><div style={{ color: '#f0c060', fontWeight: 700 }}>{runState.totalGold}</div></div>
            </div>
            {/* 総ドロップ一覧（このダンジョンで入手したアイテムを集計表示） */}
            {runState.totalDrops.length > 0 && (
              <div style={{ marginBottom: 8, paddingTop: 8, borderTop: '1px solid #2d3752' }}>
                <div style={{ fontSize: '0.7rem', color: '#8a92b2', marginBottom: 4 }}>💎 総ドロップ一覧</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {runState.totalDrops.map(d => {
                    const item = ITEM_MASTER[d.itemId];
                    if (!item) return null;
                    const rarity = item.rarity;
                    const dcolor = rarity === 'legendary' ? '#ffd700' : rarity === 'epic' ? '#c97aff' : rarity === 'rare' ? '#5b8dee' : '#70c090';
                    return (
                      <span key={d.itemId} style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: `1px solid ${dcolor}`, color: dcolor, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <GameIcon id={item.icon} size={14} />{item.name} ×{d.amount}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
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
                {runState.isComplete ? (runState.kxAwakened ? '🌟 裏超上級クリア！「生命の超越」を達成！' : runState.kxBossMode ? '🌟 裏超上級クリア！' : '🎉 攻略完了！') : '💀 攻略失敗...'}
              </p>
              <button onClick={escape} style={{ padding: '10px 32px', background: '#4caf87', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                ダンジョン出口へ
              </button>
            </div>
          ) : showDevilArmorChoice && devilArmorPhase === 0 ? (
            <div style={{ background: '#161b26', border: '2px solid #cc44ff', borderRadius: 12, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>😈</div>
              <div style={{ color: '#cc44ff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>デビルアーマーが立ちはだかる！</div>
              <div style={{ color: '#8a92b2', fontSize: '0.8rem', marginBottom: 4 }}>HP: ❤️×640 | 攻撃力: 30 | 10ターンに1回 強力な物理攻撃（防具で軽減可）</div>
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
          ) : showVolcanoRouteChoice ? (
            /* ── 火山CP3ルート分岐UI ── */
            <div style={{ background: '#161b26', border: '2px solid #ff6600', borderRadius: 12, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>🌋</div>
              <div style={{ color: '#ff6600', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>
                赤岩回廊を制圧。CP3取得！
              </div>
              <div style={{ color: '#e8d4b0', fontSize: '0.85rem', marginBottom: 4 }}>
                大橋地帯を越えた先に<strong style={{ color: '#ff9900' }}>2つのルート</strong>が待ち受ける。
              </div>
              <div style={{ color: '#8a92b2', fontSize: '0.78rem', marginBottom: 16, lineHeight: 1.6 }}>
                <span style={{ color: '#cc88ff' }}>🔮 リッチ討伐ルート</span> ─ 大橋攻略後、単体ボス「リッチ」と決戦。ここで完結。<br/>
                <span style={{ color: '#ff4444' }}>🏯 裏火山本線</span> ─ CP4（エヴァンスの家）→ CP5（終焉の大橋）→ 獄炎帝・絶炎帝。真の終点へ。
              </div>
              <div style={{ color: '#666', fontSize: '0.72rem', marginBottom: 14 }}>
                ※ まず大橋地帯（共通ルート）を突破してからルートが確定します。引き続き大橋地帯の攻略を続けてください。
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => {
                  setShowVolcanoRouteChoice(false);
                  setVolcanoRoutePending('lich');
                  setRunState(prev => prev ? { ...prev, volcanoRoute: 'main' } : null);
                  setBattleKey(k => k + 1);
                  setInBattle(true);
                }} style={{ padding: '11px', background: 'linear-gradient(135deg,#cc88ff,#8800cc)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  🔮 リッチ討伐ルートへ（大橋突破後にリッチ単体ボス）
                </button>
                <button onClick={() => {
                  setShowVolcanoRouteChoice(false);
                  setVolcanoRoutePending('back');
                  setRunState(prev => prev ? { ...prev, volcanoRoute: 'main' } : null);
                  setBattleKey(k => k + 1);
                  setInBattle(true);
                }} style={{ padding: '11px', background: 'linear-gradient(135deg,#ff4444,#cc0000)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  🏯 裏火山本線へ（CP4→CP5→獄炎帝・絶炎帝）
                </button>
                <button onClick={() => {
                  setShowVolcanoRouteChoice(false);
                  setVolcanoRoutePending(null);
                  setRunState(prev => prev ? { ...prev, volcanoRoute: undefined } : null);
                  setBattleKey(k => k + 1);
                  setInBattle(true);
                }} style={{ padding: '8px', background: '#2a2f3f', color: '#8a92b2', border: '1px solid #3a3f52', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                  ⚔️ 今は選ばず戦闘を続ける（CP3エリアで鍛える）
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
                onVictory: (isAwakened) => {
                  if (isAwakened) {
                    // 覚醒KX討伐 → 生命の超越
                    setKxBossMode(false);
                    const awakeLines: { text: string; color: string }[] = [
                      { text: '「馬鹿な...」', color: '#00e5ff' },
                      { text: '「この力を持ってしてもまだ敵わないと言うのか..?」', color: '#00e5ff' },
                    ];
                    let delay = 0;
                    awakeLines.forEach(({ text }) => {
                      setTimeout(() => addNotification('info', text), delay);
                      delay += 2000;
                    });
                    setTimeout(() => {
                      addNotification('success', '🌟 裏超上級クリア！「生命の超越」を達成！');
                      postActivityFeed({ uid: player.uid, displayName: player.displayName, type: 'boss_title', message: `が称号「${BOSS_TITLE_MASTER.kx_g21_awake.title}」を獲得しました！`, color: BOSS_TITLE_MASTER.kx_g21_awake.color, title: BOSS_TITLE_MASTER.kx_g21_awake.title }).catch(() => {});
                      setRunState(prev => prev ? { ...prev, isComplete: true, kxAwakened: true } : null);
                    }, delay);
                  } else {
                    // 通常KX討伐 → ダイアログ → ダイアログ終了後に20%で覚醒抽選
                    // ※ ダイアログ・抽選が終わるまでkxBossModeはtrueのまま維持し、
                    //   HP0になった通常KXの撃破画面をその場に残す（AUTOモードによる別バトル開始を防止）
                    const normalLines: { text: string; color: string }[] = [
                      { text: 'ｷﾞｷﾞｷﾞ....損傷率99%...LCSﾆﾖﾙ修復不可...', color: '#ff8c00' },
                      { text: '再ﾘｽ...ﾎﾟｰﾝをｾｯﾃｲｼﾏ...ｼﾏｼﾀ', color: '#ff8c00' },
                      { text: 'ｷﾞｷﾞｷﾞ...ｶﾂﾄﾞｳｦﾃｲｼｼﾏｽ...', color: '#ff8c00' },
                      { text: '回線がショートしています。離れてください', color: '#ff8c00' },
                      { text: '次こそはｶﾅﾗｽﾞ....ﾀｵ...', color: '#ff8c00' },
                    ];
                    let delay = 0;
                    normalLines.forEach(({ text }) => {
                      setTimeout(() => addNotification('warning', text), delay);
                      delay += 2000;
                    });
                    // 覚醒抽選（最後のコメントが終わってから判定する）
                    setTimeout(() => {
                      const willAwaken = secureRandom() < 0.2;
                      if (willAwaken) {
                        const awakenLines: { text: string; color: string }[] = [
                          { text: '....', color: '#ff8c00' },
                          { text: 'ｲﾔ..ﾏﾃ..', color: '#ff8c00' },
                          { text: 'ｺﾉ我が身 ﾊｲﾏﾆﾓ砕けｿｳﾀﾞｶﾞ...', color: '#ff8c00' },
                          { text: 'ﾅﾆｶｶﾞﾜｷｱｶﾞｯﾃｸﾙ...', color: '#ff8c00' },
                          { text: 'このチカラはﾓｼﾔ', color: '#ff8c00' },
                          { text: 'ｶﾝｾｲしたのﾀﾞﾛｳｶ...?', color: '#ff8c00' },
                          { text: 'この最後の最期にﾂｲﾆ....', color: '#ff8c00' },
                          { text: '私の成し遂げられなかった「生命」の完成に', color: '#ff8c00' },
                          { text: 'ハハ...我は蘇ったぞ', color: '#00e5ff' },
                          { text: '新しく、そして貴様らと同じ「命」を持ってな', color: '#00e5ff' },
                          { text: 'いざ決戦だ！！！！！！', color: '#00e5ff' },
                        ];
                        let awakenDelay = 0;
                        awakenLines.forEach(({ text }) => {
                          setTimeout(() => addNotification('info', text), awakenDelay);
                          awakenDelay += 2000;
                        });
                        setTimeout(() => {
                          // 覚醒KX戦を開始（覚醒の台詞が終わるまでここには来ない／kxBossModeは継続してtrue）
                          setRunState(prev => prev ? { ...prev, dungeonId: 'sky_castle_ex', kxBossMode: true, kxPhase: 1, kxHp: 38750, kxIsAwakened: true, currentAreaIdx: 0 } : null);
                          setBattleKey(k => k + 1);
                        }, awakenDelay);
                      } else {
                        // 覚醒なし → ガチャコイン4枚付与してクリア
                        recordDungeonClear('sky_castle_ex');
                        addNotification('success', '🌟 裏超上級クリア！🪙 ガチャコイン+4枚獲得！');
                        setKxBossMode(false);
                        setRunState(prev => prev ? { ...prev, isComplete: true } : null);
                      }
                    }, delay);
                  }
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
      {icActive && icBattleActive && (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0d14', zIndex: 1000, overflowY: 'auto' }}>
          <div style={{ maxWidth: 520, margin: '0 auto', padding: '12px 12px 80px' }}>
            <div style={{ background: 'rgba(224,85,85,0.10)', border: '1px solid #2d3752', borderRadius: 8, padding: '6px 12px', marginBottom: 10, fontSize: '0.72rem', color: '#e05555', fontWeight: 700 }}>
              🌀 無限深層回廊 — B{icCurrentFloor}F
            </div>
            <TurnBattle
              key={icBattleKey}
              runState={{ dungeonId: 'infinite_corridor', currentFloor: icCurrentFloor, currentAreaName: `B${icCurrentFloor}F`, currentAreaIdx: 0, monstersDefeated: 0, totalExp: 0, totalGold: 0, totalDrops: [], isComplete: false, isFailed: false }}
              equipment={player?.equipment ?? defaultEquipmentSlots()}
              onBattleEnd={(won) => { if (won) icResolveBattleWin(); else icResolveBattleLose(); }}
              onEscape={icCancelBattle}
              initialMana={icBattleMana}
              onManaUpdate={icSetBattleMana}
            />
          </div>
        </div>
      )}
      {icActive && <InfiniteCorridorScreen onExit={() => setIcActive(false)} />}
    </div>
  );
}
