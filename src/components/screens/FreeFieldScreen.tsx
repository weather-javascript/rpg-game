// src/components/screens/FreeFieldScreen.tsx
// フリーフィールド画面 — ノードアクション完全実装版
// 戦闘・採集・ワープ・ショップ・釣り・テスターを FreeField 内で動かす。
// GatheringScreen には混ぜない。向き依存表現は使わない。

import { useState, useMemo, useCallback } from 'react';
import {
  FREE_FIELD_WORLDS,
  FREE_FIELD_AREAS_ALL,
  FREE_FIELD_NODES_ALL,
  FFGG_HARVEST_NODES,
  getAreasByWorld,
  getNodesByWorld,
  getNodesByArea,
} from '../../data/freefieldData';
import type {
  FreeFieldWorld,
  FreeFieldArea,
  FreeFieldNode,
  FreeFieldNodeType,
  FreeFieldNodeAction,
  FreeFieldNodeActionType,
  FFBattleSession,
  FFHarvestResult,
} from '../../types/freefield';
import { FFGG_ENCOUNTER_TABLE, FFGG_ALL_ENEMIES, FFGG_FEVER_DEFINITIONS } from '../../data/ffggMaster';
import { useGameStore } from '../../stores/gameStore';
import {
  initFFBattleSession,
  playerAttack as doPlayerAttack,
  enemyTurn as doEnemyTurn,
  tryEscape,
  executeFFHarvest,
} from '../../systems/ffBattleSystem';

// ────────────────────────────────────────────
// アクション種別の表示設定
// ────────────────────────────────────────────
const ACTION_CFG: Record<FreeFieldNodeActionType, { emoji: string; color: string; label: string }> = {
  battleTrigger: { emoji: '⚔️', color: '#e06050', label: '戦う' },
  harvest:       { emoji: '🌿', color: '#40c080', label: '採取する' },
  warp:          { emoji: '🌀', color: '#a060d0', label: 'ワープ' },
  shop:          { emoji: '🛒', color: '#f0c060', label: 'ショップ' },
  fishing:       { emoji: '🎣', color: '#40b0d0', label: '釣りをする' },
  test:          { emoji: '🔬', color: '#8080a0', label: 'テスター' },
  fever:         { emoji: '🔥', color: '#ff8020', label: 'フィーバー' },
  landmark:      { emoji: '📍', color: '#80a0c0', label: '調べる' },
  hidden:        { emoji: '🔒', color: '#606878', label: '隠し要素' },
};

// ────────────────────────────────────────────
// ノード種別の表示設定
// ────────────────────────────────────────────
const NODE_CFG: Record<FreeFieldNodeType, { emoji: string; color: string; label: string }> = {
  entrance:   { emoji: '🚪', color: '#60c060', label: '入口' },
  safe:       { emoji: '🏕️',  color: '#6090ff', label: '安全地帯' },
  danger:     { emoji: '⚔️', color: '#e06050', label: '危険' },
  boss:       { emoji: '💀', color: '#c040c0', label: 'ボス' },
  harvest:    { emoji: '🌿', color: '#40c080', label: '採取' },
  shop:       { emoji: '🛒', color: '#f0c060', label: 'ショップ' },
  fishing:    { emoji: '🎣', color: '#40b0d0', label: '釣り' },
  test:       { emoji: '🔬', color: '#8080a0', label: 'テスト' },
  shortcut:   { emoji: '⚡', color: '#c0a020', label: 'ショートカット' },
  transition: { emoji: '🌀', color: '#a060d0', label: '遷移' },
  fever:      { emoji: '🔥', color: '#ff8020', label: 'フィーバー' },
  landmark:   { emoji: '📍', color: '#80a0c0', label: 'ランドマーク' },
};

// ────────────────────────────────────────────
// 接続線SVG
// ────────────────────────────────────────────
function ConnectionLines({ nodes }: { nodes: FreeFieldNode[] }) {
  const nodeMap = useMemo(() => {
    const m: Record<string, FreeFieldNode> = {};
    nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes]);

  const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  const drawn = new Set<string>();
  nodes.forEach(n => {
    n.connections.forEach(cid => {
      const target = nodeMap[cid];
      if (!target) return;
      const key = [n.id, cid].sort().join('|');
      if (drawn.has(key)) return;
      drawn.add(key);
      lines.push({
        x1: n.position.x * 100,
        y1: n.position.y * 100,
        x2: target.position.x * 100,
        y2: target.position.y * 100,
        key,
      });
    });
  });

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {lines.map(l => (
        <line
          key={l.key}
          x1={`${l.x1}%`} y1={`${l.y1}%`}
          x2={`${l.x2}%`} y2={`${l.y2}%`}
          stroke="rgba(120,140,200,0.35)"
          strokeWidth="0.6"
          strokeDasharray="2 1.5"
        />
      ))}
    </svg>
  );
}

// ────────────────────────────────────────────
// ノードピン
// ────────────────────────────────────────────
function NodePin({
  node,
  selected,
  onClick,
}: {
  node: FreeFieldNode;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = NODE_CFG[node.type];
  return (
    <button
      onClick={onClick}
      title={`${node.indexLabel ?? ''} ${node.displayName}`}
      style={{
        position: 'absolute',
        left: `${node.position.x * 100}%`,
        top: `${node.position.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        background: selected ? cfg.color : 'rgba(15,20,35,0.88)',
        border: `2px solid ${cfg.color}`,
        borderRadius: '50%',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: selected ? `0 0 10px ${cfg.color}` : '0 1px 4px rgba(0,0,0,0.5)',
        zIndex: selected ? 10 : 5,
        padding: 0,
        transition: 'all 0.15s',
        fontSize: '0.82rem',
      }}
    >
      {cfg.emoji}
    </button>
  );
}

function NodeLabel({ node, selected }: { node: FreeFieldNode; selected: boolean }) {
  const cfg = NODE_CFG[node.type];
  const shortName = node.indexLabel ? `${node.indexLabel}` : node.displayName.slice(0, 4);
  return (
    <div
      style={{
        position: 'absolute',
        left: `${node.position.x * 100}%`,
        top: `calc(${node.position.y * 100}% + 18px)`,
        transform: 'translateX(-50%)',
        fontSize: '0.55rem',
        color: selected ? cfg.color : '#8a92b2',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        fontWeight: selected ? 700 : 400,
        textShadow: '0 1px 2px rgba(0,0,0,0.9)',
        zIndex: 4,
        maxWidth: 60,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {shortName}
    </div>
  );
}

const AREA_COLORS: Record<string, string> = {
  ffgg_forest:  'rgba(20,60,20,0.32)',
  ffgg_plain:   'rgba(50,60,20,0.28)',
  ffgg_desert:  'rgba(60,45,15,0.30)',
  ffgg_snow:    'rgba(30,50,70,0.30)',
  ffgg_savanna: 'rgba(50,35,10,0.30)',
  ffgg_pirate:  'rgba(10,30,60,0.35)',
  ffgg_special: 'rgba(40,20,60,0.28)',
};

function MapView({
  world,
  activeAreaId,
  selectedNode,
  onSelectNode,
}: {
  world: FreeFieldWorld;
  activeAreaId: string | null;
  selectedNode: FreeFieldNode | null;
  onSelectNode: (n: FreeFieldNode) => void;
}) {
  const allNodes = useMemo(() => getNodesByWorld(world.id), [world.id]);
  const visibleNodes = useMemo(() => {
    if (!activeAreaId) return allNodes;
    return getNodesByArea(activeAreaId);
  }, [allNodes, activeAreaId]);

  const aspect = world.mapAspect ?? 0.82;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: `${(1 / aspect) * 100}%`,
        background: '#111827',
        border: '2px solid #2d3752',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {world.id === 'ffgg' && (
        <>
          <div style={{ position: 'absolute', left: '35%', top: '5%', width: '28%', height: '35%', background: AREA_COLORS.ffgg_forest, borderRadius: '50%', filter: 'blur(18px)' }} />
          <div style={{ position: 'absolute', left: '72%', top: '5%', width: '22%', height: '28%', background: AREA_COLORS.ffgg_plain, borderRadius: '50%', filter: 'blur(16px)' }} />
          <div style={{ position: 'absolute', left: '40%', top: '50%', width: '38%', height: '38%', background: AREA_COLORS.ffgg_desert, borderRadius: '50%', filter: 'blur(20px)' }} />
          <div style={{ position: 'absolute', left: '60%', top: '28%', width: '28%', height: '32%', background: AREA_COLORS.ffgg_snow, borderRadius: '50%', filter: 'blur(16px)' }} />
          <div style={{ position: 'absolute', left: '0%', top: '20%', width: '28%', height: '40%', background: AREA_COLORS.ffgg_savanna, borderRadius: '50%', filter: 'blur(18px)' }} />
          <div style={{ position: 'absolute', left: '30%', top: '32%', width: '24%', height: '22%', background: AREA_COLORS.ffgg_pirate, borderRadius: '50%', filter: 'blur(14px)' }} />
          <div style={{ position: 'absolute', left: '5%', top: '5%', width: '32%', height: '30%', background: AREA_COLORS.ffgg_special, borderRadius: '50%', filter: 'blur(16px)' }} />
        </>
      )}

      <div style={{ position: 'absolute', inset: 0 }}>
        {[...Array(10)].map((_, i) => (
          <div key={`h${i}`} style={{ position: 'absolute', top: `${i * 10}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.025)' }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={`v${i}`} style={{ position: 'absolute', left: `${i * 10}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.025)' }} />
        ))}
      </div>

      <ConnectionLines nodes={visibleNodes} />

      {visibleNodes.map(node => (
        <NodePin
          key={node.id}
          node={node}
          selected={selectedNode?.id === node.id}
          onClick={() => onSelectNode(node)}
        />
      ))}

      {visibleNodes.map(node => (
        <NodeLabel key={`lbl-${node.id}`} node={node} selected={selectedNode?.id === node.id} />
      ))}

      <div style={{
        position: 'absolute', bottom: 8, right: 6,
        background: 'rgba(8,12,22,0.90)', border: '1px solid #2d3752',
        borderRadius: 6, padding: '4px 7px', fontSize: '0.54rem', color: '#8a92b2',
        lineHeight: 1.6,
      }}>
        {(['entrance', 'safe', 'danger', 'boss', 'fever', 'landmark', 'transition', 'shortcut', 'test'] as FreeFieldNodeType[]).map(k => {
          const c = NODE_CFG[k];
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span>{c.emoji}</span>
              <span style={{ color: c.color }}>{c.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{
        position: 'absolute', top: 6, left: 8,
        background: 'rgba(8,12,22,0.85)', border: '1px solid #3d4772',
        borderRadius: 5, padding: '2px 8px', fontSize: '0.65rem',
        color: '#60a0ff', fontWeight: 700, letterSpacing: 1,
      }}>
        {world.displayName}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// エリアセレクター
// ────────────────────────────────────────────
function AreaSelector({
  areas,
  activeId,
  onSelect,
}: {
  areas: FreeFieldArea[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '4px 8px', fontSize: '0.70rem', borderRadius: 6, cursor: 'pointer',
          background: activeId === null ? 'rgba(240,192,96,0.15)' : '#1c2235',
          border: `1px solid ${activeId === null ? '#f0c060' : '#2d3752'}`,
          color: activeId === null ? '#f0c060' : '#8a92b2',
        }}
      >
        全体
      </button>
      {areas.map(a => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          style={{
            padding: '4px 8px', fontSize: '0.70rem', borderRadius: 6, cursor: 'pointer',
            background: activeId === a.id ? 'rgba(96,144,255,0.15)' : '#1c2235',
            border: `1px solid ${activeId === a.id ? '#6090ff' : '#2d3752'}`,
            color: activeId === a.id ? '#6090ff' : '#8a92b2',
          }}
        >
          {a.displayName}
        </button>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────
// FF専用バトルモーダル
// ────────────────────────────────────────────
function FFBattleModal({
  session,
  onPlayerAttack,
  onEscape,
  onClose,
}: {
  session: FFBattleSession;
  onPlayerAttack: () => void;
  onEscape: () => void;
  onClose: () => void;
}) {
  const playerHpPct = Math.max(0, (session.playerHp / session.playerMaxHp) * 100);
  const isResult = session.result !== null;

  const currentEnemy = session.phase === 'trigger'
    ? { name: FFGG_ALL_ENEMIES[session.triggerEnemyId]?.name ?? '???', hp: session.triggerEnemyHp, maxHp: session.triggerEnemyMaxHp }
    : session.phase === 'spawn' && session.spawnedEnemies[session.currentEnemyIdx]
      ? session.spawnedEnemies[session.currentEnemyIdx]
      : null;

  const totalEnemies = session.phase === 'spawn' ? session.spawnedEnemies.length : 1;
  const currentIdx = session.phase === 'spawn' ? session.currentEnemyIdx + 1 : 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#0f1420', border: '2px solid #e06050', borderRadius: 12,
        padding: 18, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ color: '#e06050', fontWeight: 700, fontSize: '0.95rem' }}>
            ⚔️ FF フィールドバトル
            {session.phase === 'trigger' && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#ff8060' }}>【戦闘トリガー】</span>}
            {session.phase === 'spawn' && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#ff6060' }}>【スポーン {currentIdx}/{totalEnemies}体】</span>}
            {session.phase === 'done' && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#60c060' }}>【戦闘終了】</span>}
          </div>
          {isResult && (
            <button onClick={onClose} style={{ background: 'none', border: '1px solid #3d4772', borderRadius: 4, color: '#8a92b2', cursor: 'pointer', padding: '2px 8px', fontSize: '0.70rem' }}>
              閉じる
            </button>
          )}
        </div>

        {/* 自分のHP */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 2 }}>
            自分のHP: {session.playerHp} / {session.playerMaxHp}
          </div>
          <div style={{ background: '#1a2030', borderRadius: 4, height: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${playerHpPct}%`,
              background: playerHpPct > 50 ? '#40c060' : playerHpPct > 25 ? '#f0c040' : '#e04040',
              transition: 'width 0.2s',
            }} />
          </div>
        </div>

        {/* 敵情報 */}
        {currentEnemy && (
          <div style={{
            background: 'rgba(224,96,80,0.10)', border: '1px solid #e06050',
            borderRadius: 8, padding: '8px 10px', marginBottom: 10,
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ff8060', marginBottom: 4 }}>
              👾 {currentEnemy.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 2 }}>
              HP: {currentEnemy.hp} / {currentEnemy.maxHp}
            </div>
            <div style={{ background: '#1a2030', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.max(0, (currentEnemy.hp / currentEnemy.maxHp) * 100)}%`,
                background: '#e04040',
                transition: 'width 0.2s',
              }} />
            </div>
          </div>
        )}

        {/* 戦闘ログ */}
        <div style={{
          background: '#080c14', border: '1px solid #2d3752', borderRadius: 6,
          padding: '6px 8px', marginBottom: 10, maxHeight: 140, overflowY: 'auto',
          fontSize: '0.70rem', lineHeight: 1.6,
        }}>
          {session.log.slice(-8).map((line, i) => (
            <div key={i} style={{ color: line.includes('💥') || line.includes('✅') || line.includes('🎉') ? '#80d0a0' : line.includes('🗡️') || line.includes('💔') ? '#e08060' : '#b0b8d0' }}>
              {line}
            </div>
          ))}
        </div>

        {/* 結果表示 */}
        {isResult && (
          <div style={{
            background: session.result === 'win' ? 'rgba(60,160,80,0.15)' : session.result === 'escaped' ? 'rgba(160,100,200,0.15)' : 'rgba(160,60,60,0.15)',
            border: `1px solid ${session.result === 'win' ? '#40c060' : session.result === 'escaped' ? '#a060d0' : '#c04040'}`,
            borderRadius: 8, padding: '8px 10px', marginBottom: 10,
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: session.result === 'win' ? '#60d080' : session.result === 'escaped' ? '#c080ff' : '#e06060', marginBottom: 4 }}>
              {session.result === 'win' ? '🎉 勝利！' : session.result === 'escaped' ? '💨 逃走成功' : '💔 敗北'}
            </div>
            {session.result === 'win' && (
              <>
                <div style={{ fontSize: '0.72rem', color: '#8a92b2' }}>EXP: +{session.expGained}　Gold: +{session.goldGained}</div>
                {session.drops.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: '0.65rem', color: '#6a7290', marginBottom: 2 }}>💎 ドロップ</div>
                    {session.drops.map((d, i) => (
                      <div key={i} style={{ fontSize: '0.68rem', color: '#70c090' }}>
                        {d.displayName} × {d.amount}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 行動ボタン */}
        {!isResult && session.turn === 'player' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onPlayerAttack}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 6, cursor: 'pointer',
                background: 'rgba(224,96,80,0.18)', border: '1px solid #e06050',
                color: '#e06050', fontWeight: 700, fontSize: '0.78rem',
              }}
            >
              ⚔️ 攻撃
            </button>
            <button
              onClick={onEscape}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 6, cursor: 'pointer',
                background: 'rgba(160,100,200,0.15)', border: '1px solid #a060d0',
                color: '#a060d0', fontWeight: 700, fontSize: '0.78rem',
              }}
            >
              💨 逃げる
            </button>
          </div>
        )}

        {!isResult && session.turn === 'enemy' && (
          <div style={{ textAlign: 'center', color: '#e08060', fontSize: '0.75rem', padding: '8px 0' }}>
            敵のターン...
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// FF採集モーダル
// ────────────────────────────────────────────
function FFHarvestModal({
  result,
  onClose,
}: {
  result: FFHarvestResult;
  onClose: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#0f1420', border: '2px solid #40c080', borderRadius: 12,
        padding: 18, maxWidth: 360, width: '100%',
      }}>
        <div style={{ fontWeight: 700, color: '#40c080', fontSize: '0.95rem', marginBottom: 10 }}>
          🌿 FF採集結果
        </div>
        <div style={{ fontSize: '0.80rem', color: '#b0b8d0', marginBottom: 10, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {result.message}
        </div>
        {result.items.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {result.items.map((item, i) => (
              <div key={i} style={{
                background: 'rgba(64,192,128,0.10)', border: '1px solid #40c080',
                borderRadius: 6, padding: '4px 8px', marginBottom: 4,
                fontSize: '0.78rem', color: '#70e0a0',
              }}>
                ✅ {item.displayName} × {item.amount}
              </div>
            ))}
          </div>
        )}
        {result.triggeredCombat && (
          <div style={{
            background: 'rgba(224,96,80,0.12)', border: '1px solid #e06050',
            borderRadius: 6, padding: '4px 8px', marginBottom: 10,
            fontSize: '0.72rem', color: '#e08060',
          }}>
            ⚠️ 採集中に敵が出現した！（戦闘は別途「戦う」ボタンから）
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(64,192,128,0.15)', border: '1px solid #40c080',
            color: '#40c080', fontWeight: 700, fontSize: '0.78rem',
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// テスターモーダル
// ────────────────────────────────────────────
function FFTesterModal({ onClose }: { onClose: () => void }) {
  const player = useGameStore(s => s.player);
  const atk = player?.stats?.attack ?? 0;
  const def = player?.stats?.defense ?? 0;
  const hp = player?.stats?.hp ?? 0;
  const maxHp = player?.stats?.maxHp ?? 0;

  // 仮想ダミー敵に対するダメージ計算
  const dummyDef = 20;
  const dmg = Math.max(1, atk - Math.floor(dummyDef * 0.5));

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#0f1420', border: '2px solid #8080a0', borderRadius: 12,
        padding: 18, maxWidth: 380, width: '100%',
      }}>
        <div style={{ fontWeight: 700, color: '#8080a0', fontSize: '0.95rem', marginBottom: 12 }}>
          🔬 武器テスター
        </div>

        <div style={{ background: 'rgba(40,45,70,0.6)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 6, fontWeight: 700 }}>現在のステータス</div>
          <div style={{ fontSize: '0.72rem', color: '#b0b8d0', lineHeight: 1.8 }}>
            <div>⚔️ 攻撃力: {atk}</div>
            <div>🛡️ 防御力: {def}</div>
            <div>❤️ HP: {hp} / {maxHp}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(128,128,160,0.12)', border: '1px solid #8080a0', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: '0.75rem', color: '#a0a0c0', marginBottom: 6, fontWeight: 700 }}>ダミー目標（防御20）への推定ダメージ</div>
          <div style={{ fontSize: '1.1rem', color: '#c0c0e0', fontWeight: 700 }}>約 {dmg} ダメージ</div>
          <div style={{ fontSize: '0.65rem', color: '#6a7290', marginTop: 4 }}>
            計算式: 攻撃力({atk}) - 防御({dummyDef})×0.5 = {dmg}
          </div>
        </div>

        <div style={{ fontSize: '0.65rem', color: '#606880', marginBottom: 12 }}>
          {/* TODO: 実際の武器別ダメージ計算・スキル試用は仕様確定後に追加 */}
          ※ テスターは参考値を表示します。実際の戦闘では敵の防御力・スキルによって変動します。
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(128,128,160,0.15)', border: '1px solid #8080a0',
            color: '#8080a0', fontWeight: 700, fontSize: '0.78rem',
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// フィーバー状態モーダル
// ────────────────────────────────────────────
function FFFeverModal({ action, onClose }: { action: FreeFieldNodeAction; onClose: () => void }) {
  // TODO: ドラゴンソール蓄積量は playerSlice 拡張後に取得
  const dragonSoulCurrent = 0; // TODO: useGameStore(s => s.player?.dragonSoulCount ?? 0)
  const dragonSoulTarget = 30000;
  const progress = Math.min(1, dragonSoulCurrent / dragonSoulTarget);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#0f1420', border: '2px solid #ff8020', borderRadius: 12,
        padding: 18, maxWidth: 380, width: '100%',
      }}>
        <div style={{ fontWeight: 700, color: '#ff8020', fontSize: '0.95rem', marginBottom: 12 }}>
          🔥 ドラゴンフィーバー状態
        </div>

        <div style={{ background: 'rgba(255,128,32,0.10)', border: '1px solid #ff8020', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: '0.75rem', color: '#ffa060', marginBottom: 6 }}>ドラゴンソール蓄積量</div>
          <div style={{ fontSize: '0.70rem', color: '#c08040', marginBottom: 4 }}>
            {dragonSoulCurrent.toLocaleString()} / {dragonSoulTarget.toLocaleString()}
          </div>
          <div style={{ background: '#1a2030', borderRadius: 4, height: 10, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{
              height: '100%', width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #ff8020, #ffd040)',
            }} />
          </div>
          {dragonSoulCurrent >= dragonSoulTarget
            ? <div style={{ fontSize: '0.72rem', color: '#ff6020', fontWeight: 700 }}>🔥 ドラゴンフィーバー発動可能！</div>
            : <div style={{ fontSize: '0.65rem', color: '#806040' }}>残り: {(dragonSoulTarget - dragonSoulCurrent).toLocaleString()}</div>
          }
        </div>

        <div style={{ fontSize: '0.65rem', color: '#606880', marginBottom: 12 }}>
          {/* TODO: ドラゴンソール蓄積・フィーバー発動ロジックは playerSlice 拡張後に実装 */}
          ※ ドラゴンソールは敵撃破で蓄積されます。30000に達するとドラゴンフィーバーが発動します。
          発動ロジックは実装準備中です。
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(255,128,32,0.15)', border: '1px solid #ff8020',
            color: '#ff8020', fontWeight: 700, fontSize: '0.78rem',
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// ランドマーク情報モーダル
// ────────────────────────────────────────────
function FFLandmarkModal({ node, action, onClose }: { node: FreeFieldNode; action: FreeFieldNodeAction; onClose: () => void }) {
  const cfg = NODE_CFG[node.type];
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#0f1420', border: `2px solid ${cfg.color}`, borderRadius: 12,
        padding: 18, maxWidth: 380, width: '100%',
      }}>
        <div style={{ fontWeight: 700, color: cfg.color, fontSize: '0.95rem', marginBottom: 8 }}>
          {cfg.emoji} {node.indexLabel} {node.displayName}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#b0b8d0', lineHeight: 1.6, marginBottom: 10 }}>
          {action.description ?? node.description ?? 'この地点の詳細情報はありません。'}
        </div>
        {node.encounterHints && node.encounterHints.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: '0.65rem', color: '#e06050', marginBottom: 4 }}>⚔️ 出現モブ情報</div>
            {node.encounterHints.map((h, i) => (
              <div key={i} style={{ fontSize: '0.68rem', color: '#b0a090', lineHeight: 1.5 }}>• {h}</div>
            ))}
          </div>
        )}
        {node.resourceHints && node.resourceHints.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: '0.65rem', color: '#40c080', marginBottom: 4 }}>🌿 素材情報</div>
            {node.resourceHints.map((h, i) => (
              <div key={i} style={{ fontSize: '0.68rem', color: '#80c0a0', lineHeight: 1.5 }}>• {h}</div>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 6, cursor: 'pointer',
            background: `rgba(${cfg.color.replace(/[^,\d]/g, '')},0.12)`,
            border: `1px solid ${cfg.color}`,
            color: cfg.color, fontWeight: 700, fontSize: '0.78rem',
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// アクションボタン
// ────────────────────────────────────────────
function ActionButton({
  action,
  onExecute,
}: {
  action: FreeFieldNodeAction;
  onExecute: (a: FreeFieldNodeAction) => void;
}) {
  const cfg = ACTION_CFG[action.type];
  const hasUnlock = (action.unlockConditions ?? []).length > 0;

  return (
    <div style={{
      background: 'rgba(22,28,44,0.9)',
      border: `1px solid ${action.hidden ? '#404860' : cfg.color}`,
      borderRadius: 8,
      padding: '8px 10px',
      marginBottom: 6,
      opacity: action.hidden ? 0.65 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '1rem' }}>{cfg.emoji}</span>
          <span style={{ fontSize: '0.80rem', fontWeight: 700, color: action.hidden ? '#606878' : cfg.color }}>
            {action.label}
          </span>
          {action.hidden && (
            <span style={{ fontSize: '0.60rem', color: '#606878', background: 'rgba(40,44,60,0.6)', borderRadius: 3, padding: '1px 4px' }}>
              隠し
            </span>
          )}
        </div>
        <button
          onClick={() => onExecute(action)}
          style={{
            padding: '3px 10px',
            fontSize: '0.68rem',
            borderRadius: 5,
            cursor: 'pointer',
            background: `rgba(${cfg.color.slice(1).match(/.{2}/g)?.map(x => parseInt(x,16)).join(',') ?? '255,255,255'},0.15)`,
            border: `1px solid ${action.hidden ? '#3d4772' : cfg.color}`,
            color: action.hidden ? '#505870' : cfg.color,
            fontWeight: 600,
          }}
        >
          {cfg.emoji} 実行
        </button>
      </div>

      {action.description && (
        <div style={{ fontSize: '0.70rem', color: '#8a92b2', marginBottom: 3, lineHeight: 1.45 }}>
          {action.description}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {action.triggerMode && (
          <span style={{ fontSize: '0.60rem', color: action.triggerMode === 'auto' ? '#e06050' : '#6090c0', background: 'rgba(30,35,55,0.5)', borderRadius: 3, padding: '1px 5px' }}>
            {action.triggerMode === 'auto' ? '⚡自動開始' : '🖐手動開始'}
          </span>
        )}
        {action.harvestDanger != null && (
          <span style={{ fontSize: '0.60rem', color: '#c06040', background: 'rgba(30,35,55,0.5)', borderRadius: 3, padding: '1px 5px' }}>
            採取危険度: {'⭐'.repeat(action.harvestDanger)}
          </span>
        )}
        {action.combatDuringHarvest && (
          <span style={{ fontSize: '0.60rem', color: '#e06050', background: 'rgba(40,20,20,0.4)', borderRadius: 3, padding: '1px 5px' }}>
            ⚔️採取中に戦闘発生あり
          </span>
        )}
        {action.cooldownSeconds != null && action.cooldownSeconds > 0 && (
          <span style={{ fontSize: '0.60rem', color: '#8090a0', background: 'rgba(30,35,55,0.5)', borderRadius: 3, padding: '1px 5px' }}>
            ⏱ CD: {action.cooldownSeconds}s
          </span>
        )}
        {action.feverType && (
          <span style={{ fontSize: '0.60rem', color: '#ff8020', background: 'rgba(40,20,10,0.4)', borderRadius: 3, padding: '1px 5px' }}>
            🔥 {action.feverType === 'dragon' ? 'ドラゴンフィーバー' : action.feverType === 'red' ? 'レッドフィーバー' : 'ゴールドフィーバー'}
          </span>
        )}
        {action.feverConditionText && (
          <span style={{ fontSize: '0.60rem', color: '#c08040', background: 'rgba(40,25,10,0.4)', borderRadius: 3, padding: '1px 5px' }}>
            条件: {action.feverConditionText}
          </span>
        )}
        {(action.targetNodeId || action.targetWorldId) && (
          <span style={{ fontSize: '0.60rem', color: '#a060d0', background: 'rgba(30,20,45,0.5)', borderRadius: 3, padding: '1px 5px' }}>
            {action.targetWorldId
              ? `→ ワールド: ${action.targetWorldId}`
              : `→ ${FREE_FIELD_NODES_ALL[action.targetNodeId!]?.displayName ?? action.targetNodeId}`}
          </span>
        )}
      </div>

      {hasUnlock && (
        <div style={{ marginTop: 4 }}>
          {(action.unlockConditions ?? []).map((c, i) => (
            <div key={i} style={{ fontSize: '0.60rem', color: '#806040', background: 'rgba(40,25,10,0.3)', borderRadius: 3, padding: '1px 6px', display: 'inline-block', marginRight: 3 }}>
              🔒 {c.description ?? c.type}
            </div>
          ))}
        </div>
      )}

      {(action.rewardHints ?? []).length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: '0.60rem', color: '#6a7290', marginBottom: 2 }}>💎 報酬ヒント</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {(action.rewardHints ?? []).map((rh, i) => (
              <span key={i} style={{ fontSize: '0.58rem', color: '#70c090', background: 'rgba(20,40,25,0.4)', borderRadius: 3, padding: '1px 5px' }}>
                {rh.description}{rh.dropRate ? ` (${rh.dropRate})` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// アクション一覧パネル（実行ハンドラ付き）
// ────────────────────────────────────────────
function NodeActionsPanel({
  node,
  onWarpToNode,
  onBattleStart,
  onHarvestStart,
  onFishingStart,
  onTestStart,
  onShopStart,
  onFeverStart,
  onLandmarkStart,
}: {
  node: FreeFieldNode;
  onWarpToNode?: (nodeId: string) => void;
  onBattleStart: (action: FreeFieldNodeAction, node: FreeFieldNode) => void;
  onHarvestStart: (action: FreeFieldNodeAction, node: FreeFieldNode) => void;
  onFishingStart: () => void;
  onTestStart: () => void;
  onShopStart: () => void;
  onFeverStart: (action: FreeFieldNodeAction) => void;
  onLandmarkStart: (action: FreeFieldNodeAction) => void;
}) {
  const actions = node.actions ?? [];
  const visibleActions = actions; // 全部表示（hidden は薄く）

  if (visibleActions.length === 0) return null;

  const typeSet = new Set(actions.map(a => a.type));
  const hasBattle = typeSet.has('battleTrigger');
  const hasHarvest = typeSet.has('harvest');
  const hasFever = typeSet.has('fever');
  const warpActions = actions.filter(a => a.type === 'warp');

  const handleExecute = (action: FreeFieldNodeAction) => {
    switch (action.type) {
      case 'battleTrigger':
        onBattleStart(action, node);
        break;
      case 'harvest':
        onHarvestStart(action, node);
        break;
      case 'warp':
        if (action.targetNodeId && onWarpToNode) {
          onWarpToNode(action.targetNodeId);
        } else if (action.targetWorldId) {
          // TODO: ワールド間遷移は実装準備中
          alert(`FF ワールド遷移: ${action.targetWorldId}\n（TODO: World 間遷移の実装方針が決まったら接続を更新する）`);
        }
        break;
      case 'fishing':
        onFishingStart();
        break;
      case 'test':
        onTestStart();
        break;
      case 'shop':
        onShopStart();
        break;
      case 'fever':
        onFeverStart(action);
        break;
      case 'landmark':
        onLandmarkStart(action);
        break;
      case 'hidden':
        // TODO: 隠し要素の解放条件チェックは未実装
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        background: 'rgba(20,26,42,0.8)',
        border: '1px solid #2d3752',
        borderRadius: 7,
        padding: '7px 10px',
        marginBottom: 8,
      }}>
        <div style={{ fontSize: '0.68rem', color: '#8a92b2', marginBottom: 5, fontWeight: 700 }}>
          📋 このノードでできること
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {Array.from(typeSet).map(t => {
            const cfg = ACTION_CFG[t];
            return (
              <span key={t} style={{
                fontSize: '0.65rem',
                color: cfg.color,
                background: `rgba(${cfg.color.slice(1).match(/.{2}/g)?.map(x => parseInt(x,16)).join(',') ?? '255,255,255'}, 0.12)`,
                border: `1px solid ${cfg.color}`,
                borderRadius: 5,
                padding: '2px 7px',
              }}>
                {cfg.emoji} {cfg.label}
              </span>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, fontSize: '0.62rem', color: '#6a7290' }}>
          {hasBattle && <span>⚔️ 戦闘あり</span>}
          {hasHarvest && <span>🌿 採取あり（FF専用）</span>}
          {hasFever && <span style={{ color: '#ff8020' }}>🔥 フィーバー関連</span>}
          {warpActions.length > 0 && (
            <span style={{ color: '#a060d0' }}>
              🌀 接続先: {warpActions.map(a =>
                a.targetWorldId
                  ? a.targetWorldId
                  : (FREE_FIELD_NODES_ALL[a.targetNodeId ?? '']?.displayName ?? a.targetNodeId ?? '?')
              ).join(' / ')}
            </span>
          )}
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: '#8a92b2', marginBottom: 5, fontWeight: 700 }}>
        🎮 アクション
      </div>
      {visibleActions.map((action, idx) => (
        <ActionButton
          key={idx}
          action={action}
          onExecute={handleExecute}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────
// ノード詳細パネル
// ────────────────────────────────────────────
function NodeDetailPanel({
  node,
  onClose,
  onWarpToNode,
  onBattleStart,
  onHarvestStart,
  onFishingStart,
  onTestStart,
  onShopStart,
  onFeverStart,
  onLandmarkStart,
}: {
  node: FreeFieldNode;
  onClose: () => void;
  onWarpToNode?: (nodeId: string) => void;
  onBattleStart: (action: FreeFieldNodeAction, node: FreeFieldNode) => void;
  onHarvestStart: (action: FreeFieldNodeAction, node: FreeFieldNode) => void;
  onFishingStart: () => void;
  onTestStart: () => void;
  onShopStart: () => void;
  onFeverStart: (action: FreeFieldNodeAction) => void;
  onLandmarkStart: (action: FreeFieldNodeAction) => void;
}) {
  const cfg = NODE_CFG[node.type];
  const area = FREE_FIELD_AREAS_ALL[node.areaId];
  const [showDetail, setShowDetail] = useState(false);

  const connectedNodes = node.connections
    .map(id => FREE_FIELD_NODES_ALL[id])
    .filter(Boolean);

  return (
    <div style={{
      background: '#161b26',
      border: `2px solid ${cfg.color}`,
      borderRadius: 10,
      padding: 14,
      marginTop: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: cfg.color }}>
            {cfg.emoji}{' '}
            {node.indexLabel && <span style={{ marginRight: 4 }}>{node.indexLabel}</span>}
            {node.displayName}
          </div>
          {node.aliasNames && node.aliasNames.length > 0 && (
            <div style={{ fontSize: '0.65rem', color: '#6a7290', marginTop: 2 }}>
              別名: {node.aliasNames.join(' / ')}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#8a92b2', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, paddingTop: 0 }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.70rem', color: '#8a92b2', marginBottom: 8 }}>
        <span>種別: <span style={{ color: cfg.color }}>{cfg.label}</span></span>
        {area && <span>エリア: <span style={{ color: '#9090c0' }}>{area.displayName}</span></span>}
        {node.dangerLevel != null && (
          <span style={{ color: '#c06040' }}>危険度: {'⭐'.repeat(node.dangerLevel)}</span>
        )}
        {node.isSafeZone && <span style={{ color: '#60a060' }}>✅ 安全地帯</span>}
      </div>

      {node.description && (
        <div style={{ fontSize: '0.78rem', color: '#b0b8d0', marginBottom: 8, lineHeight: 1.55 }}>
          {node.description}
        </div>
      )}

      {/* アクション一覧 ← メイン */}
      <NodeActionsPanel
        node={node}
        onWarpToNode={onWarpToNode}
        onBattleStart={onBattleStart}
        onHarvestStart={onHarvestStart}
        onFishingStart={onFishingStart}
        onTestStart={onTestStart}
        onShopStart={onShopStart}
        onFeverStart={onFeverStart}
        onLandmarkStart={onLandmarkStart}
      />

      {/* 接続先 */}
      {connectedNodes.length > 0 && (
        <div style={{ marginTop: 10, marginBottom: 8 }}>
          <div style={{ fontSize: '0.65rem', color: '#8a92b2', marginBottom: 4 }}>🔗 接続先ノード</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {connectedNodes.map(cn => {
              const ccfg = NODE_CFG[cn.type];
              return (
                <button
                  key={cn.id}
                  onClick={() => onWarpToNode?.(cn.id)}
                  style={{
                    fontSize: '0.65rem',
                    background: 'rgba(40,50,80,0.6)',
                    border: `1px solid ${ccfg.color}`,
                    borderRadius: 5,
                    padding: '2px 7px',
                    color: ccfg.color,
                    cursor: 'pointer',
                  }}
                >
                  {ccfg.emoji} {cn.indexLabel && `${cn.indexLabel} `}{cn.displayName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {node.tags && node.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {node.tags.map(t => (
            <span key={t} style={{ fontSize: '0.60rem', background: 'rgba(60,70,110,0.5)', border: '1px solid #3d4772', borderRadius: 4, padding: '1px 6px', color: '#8090c0' }}>
              {t}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowDetail(v => !v)}
        style={{
          width: '100%', padding: '4px', marginTop: 4, marginBottom: showDetail ? 8 : 0,
          background: 'rgba(30,36,55,0.5)', border: '1px solid #2d3752',
          borderRadius: 5, color: '#6a7290', fontSize: '0.65rem', cursor: 'pointer',
        }}
      >
        {showDetail ? '▲ 詳細情報を閉じる' : '▼ 詳細情報を見る（ヒント・エンカウンター）'}
      </button>

      {showDetail && (
        <>
          {(node.encounterHints ?? []).length > 0 && (
            <div style={{ fontSize: '0.68rem', color: '#e06050', marginBottom: 4 }}>
              ⚔️ 出現ヒント: {node.encounterHints!.join(' / ')}
            </div>
          )}
          {(node.resourceHints ?? []).length > 0 && (
            <div style={{ fontSize: '0.68rem', color: '#60c080', marginBottom: 4 }}>
              🌿 素材ヒント: {node.resourceHints!.join(' / ')}
            </div>
          )}
          {(node.eventHints ?? []).length > 0 && (
            <div style={{ fontSize: '0.68rem', color: '#ff8020', marginBottom: 4 }}>
              🔥 イベントヒント: {node.eventHints!.join(' / ')}
            </div>
          )}

          {area?.description && (
            <div style={{ fontSize: '0.65rem', color: '#707890', marginBottom: 6, borderTop: '1px solid #2d3752', paddingTop: 6 }}>
              📍 エリア説明: {area.description}
            </div>
          )}

          {node.notes && (
            <div style={{
              fontSize: '0.63rem', color: '#606880',
              background: 'rgba(30,35,55,0.5)', borderRadius: 5, padding: '5px 8px', marginBottom: 8,
            }}>
              📝 {node.notes}
            </div>
          )}

          {/* FFGGエンカウンター情報パネル */}
          {(() => {
            const profile = FFGG_ENCOUNTER_TABLE[node.areaId];
            if (!profile) return null;
            const normalEnemies = (profile.normalEnemyIds ?? []).map(id => FFGG_ALL_ENEMIES[id]?.name).filter(Boolean);
            const triggerEnemy = profile.triggerEnemyId ? FFGG_ALL_ENEMIES[profile.triggerEnemyId]?.name : null;
            const boss = profile.bossId ? FFGG_ALL_ENEMIES[profile.bossId]?.name : null;
            const midBoss = profile.midBossId ? FFGG_ALL_ENEMIES[profile.midBossId]?.name : null;
            const feverChancePct = profile.feverChance ? Math.round(profile.feverChance * 100) : 0;
            const dangerStars = '⭐'.repeat(profile.dangerLevel);
            return (
              <div style={{ fontSize: '0.68rem', borderTop: '1px solid #2d3752', paddingTop: 8, marginBottom: 8 }}>
                <div style={{ color: '#f0c060', fontWeight: 700, marginBottom: 4 }}>⚔️ エンカウンター情報</div>
                <div style={{ color: '#e06050', marginBottom: 2 }}>危険度: {dangerStars}</div>
                {triggerEnemy && <div style={{ color: '#ff8060', marginBottom: 2 }}>🎯 戦闘トリガー: {triggerEnemy}（倒すと仲間が出現）</div>}
                {normalEnemies.length > 0 && <div style={{ color: '#b0b8d0', marginBottom: 2 }}>👾 通常敵: {normalEnemies.slice(0, 5).join(' / ')}{normalEnemies.length > 5 ? ' ...' : ''}</div>}
                {midBoss && <div style={{ color: '#c060c0', marginBottom: 2 }}>⚡ 中ボス: {midBoss}</div>}
                {boss && <div style={{ color: '#e05555', marginBottom: 2 }}>💀 ボス: {boss}</div>}
                {feverChancePct > 0 && <div style={{ color: '#ff8020', marginBottom: 2 }}>🔥 フィーバー発生率: {feverChancePct}%</div>}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// ノード一覧（エリア選択時）
// ────────────────────────────────────────────
function NodeListPanel({
  nodes,
  selectedNode,
  onSelectNode,
}: {
  nodes: FreeFieldNode[];
  selectedNode: FreeFieldNode | null;
  onSelectNode: (n: FreeFieldNode) => void;
}) {
  if (nodes.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: '0.68rem', color: '#8a92b2', marginBottom: 5 }}>ノード一覧</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {nodes.map(node => {
          const cfg = NODE_CFG[node.type];
          const sel = selectedNode?.id === node.id;
          return (
            <button
              key={node.id}
              onClick={() => onSelectNode(node)}
              style={{
                padding: '4px 9px', borderRadius: 6, cursor: 'pointer', fontSize: '0.70rem',
                background: sel ? 'rgba(96,144,255,0.15)' : '#1c2235',
                border: `1px solid ${sel ? cfg.color : '#2d3752'}`,
                color: sel ? cfg.color : '#8a92b2',
              }}
            >
              {cfg.emoji}{node.indexLabel && ` ${node.indexLabel}`} {node.displayName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// FF採集タブ（FreeField専用・GatheringScreen非使用）
// ────────────────────────────────────────────
function FFHarvestTab() {
  const [lastResult, setLastResult] = useState<FFHarvestResult | null>(null);
  const [harvesting, setHarvesting] = useState<string | null>(null);
  const addNotification = useGameStore(s => s.addNotification);

  const handleHarvest = (nodeId: string) => {
    const harvestNode = FFGG_HARVEST_NODES[nodeId];
    if (!harvestNode) return;
    setHarvesting(nodeId);

    setTimeout(() => {
      const result = executeFFHarvest(harvestNode, 'player');
      setLastResult(result);
      setHarvesting(null);

      if (result.items.length > 0) {
        addNotification('success', `FF採集: ${result.items.map(i => `${i.displayName}×${i.amount}`).join(', ')}`);
      } else {
        addNotification('info', 'FF採集: 何も見つからなかった');
      }
    }, 800);
  };

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#40c080', fontWeight: 700, marginBottom: 10 }}>
        🌿 FF専用採集スポット
      </div>
      <div style={{ fontSize: '0.65rem', color: '#6a7290', marginBottom: 10 }}>
        ※ FF採集は通常採取タブとは別の専用システムです。各エリアのノードの採集アクションからも実行できます。
      </div>

      {Object.values(FFGG_HARVEST_NODES).map(hnode => (
        <div key={hnode.id} style={{
          background: '#161b26', border: '1px solid #2d3752', borderRadius: 8,
          padding: '10px 12px', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: '0.80rem', fontWeight: 700, color: '#40c080' }}>{hnode.displayName}</div>
              <div style={{ fontSize: '0.65rem', color: '#6a7290' }}>
                エリア: {FREE_FIELD_AREAS_ALL[hnode.areaId]?.displayName ?? hnode.areaId}
                {hnode.dangerLevel != null && ` | 危険度: ${'⭐'.repeat(hnode.dangerLevel)}`}
                {hnode.cooldownSeconds != null && hnode.cooldownSeconds > 0 && ` | CD: ${hnode.cooldownSeconds}s`}
              </div>
            </div>
            <button
              onClick={() => handleHarvest(hnode.id)}
              disabled={harvesting === hnode.id}
              style={{
                padding: '5px 12px', borderRadius: 6, cursor: harvesting === hnode.id ? 'not-allowed' : 'pointer',
                background: harvesting === hnode.id ? 'rgba(40,44,60,0.4)' : 'rgba(64,192,128,0.15)',
                border: '1px solid #40c080', color: '#40c080', fontWeight: 600, fontSize: '0.72rem',
              }}
            >
              {harvesting === hnode.id ? '採集中...' : '🌿 採集'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {hnode.items.map((item, i) => (
              <span key={i} style={{
                fontSize: '0.60rem', padding: '1px 6px',
                background: item.isRare ? 'rgba(255,180,20,0.12)' : 'rgba(40,60,40,0.4)',
                border: `1px solid ${item.isRare ? '#f0c060' : '#3d5040'}`,
                borderRadius: 4, color: item.isRare ? '#f0c060' : '#70c090',
              }}>
                {item.displayName} {Math.round(item.baseRate * 100)}%
                {item.isRare && ' ★'}
              </span>
            ))}
          </div>
        </div>
      ))}

      {lastResult && (
        <div style={{
          background: lastResult.items.length > 0 ? 'rgba(64,192,128,0.10)' : 'rgba(40,44,60,0.4)',
          border: `1px solid ${lastResult.items.length > 0 ? '#40c080' : '#3d4772'}`,
          borderRadius: 8, padding: '10px 12px', marginTop: 8,
        }}>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 4 }}>最後の採集結果</div>
          <div style={{ fontSize: '0.72rem', color: '#b0b8d0', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {lastResult.message}
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// メイン
// ────────────────────────────────────────────
export function FreeFieldScreen() {
  const [selectedWorldId, setSelectedWorldId] = useState<string>(FREE_FIELD_WORLDS[0].id);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FreeFieldNode | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'harvest'>('map');

  // モーダル状態
  const [battleSession, setBattleSession] = useState<FFBattleSession | null>(null);
  const [harvestResult, setHarvestResult] = useState<FFHarvestResult | null>(null);
  const [showTester, setShowTester] = useState(false);
  const [feverAction, setFeverAction] = useState<FreeFieldNodeAction | null>(null);
  const [landmarkAction, setLandmarkAction] = useState<{ action: FreeFieldNodeAction; node: FreeFieldNode } | null>(null);

  const player = useGameStore(s => s.player);
  const setGlobalTab = useGameStore(s => s.setActiveTab);
  const addNotification = useGameStore(s => s.addNotification);

  const playerHp = player?.stats?.hp ?? 100;
  const playerMaxHp = player?.stats?.maxHp ?? 100;
  const playerAtk = player?.stats?.attack ?? 30;
  const playerDef = player?.stats?.defense ?? 15;

  const world = FREE_FIELD_WORLDS.find(w => w.id === selectedWorldId)!;
  const areas = getAreasByWorld(world.id);
  const nodesInActiveArea = activeAreaId ? getNodesByArea(activeAreaId) : [];

  const handleSelectWorld = (id: string) => {
    setSelectedWorldId(id);
    setActiveAreaId(null);
    setSelectedNode(null);
  };

  const handleSelectArea = (id: string | null) => {
    setActiveAreaId(id);
    setSelectedNode(null);
  };

  const handleSelectNode = (node: FreeFieldNode) => {
    setSelectedNode(prev => (prev?.id === node.id ? null : node));
  };

  const handleWarpToNode = useCallback((nodeId: string) => {
    const target = FREE_FIELD_NODES_ALL[nodeId];
    if (target) {
      setSelectedNode(target);
      if (target.areaId !== activeAreaId) {
        setActiveAreaId(target.areaId);
      }
      addNotification('info', `${target.indexLabel ?? ''} ${target.displayName} へ移動`);
    }
  }, [activeAreaId, addNotification]);

  // ── バトル開始 ──
  const handleBattleStart = useCallback((action: FreeFieldNodeAction, node: FreeFieldNode) => {
    const profileId = action.encounterProfileId ?? node.areaId;
    const session = initFFBattleSession({
      nodeId: node.id,
      areaId: node.areaId,
      encounterProfileId: profileId,
      playerHp,
      playerMaxHp,
    });
    if (!session) {
      addNotification('error', 'このエリアに戦闘トリガーが設定されていません');
      return;
    }
    setBattleSession(session);
  }, [playerHp, playerMaxHp, addNotification]);

  // ── バトル操作 ──
  const handlePlayerAttack = useCallback(() => {
    if (!battleSession) return;
    let s = doPlayerAttack(battleSession, playerAtk);
    // 敵ターンを自動実行
    if (s.turn === 'enemy' && !s.result) {
      setTimeout(() => {
        setBattleSession(prev => {
          if (!prev) return prev;
          const afterEnemy = doEnemyTurn(prev, playerDef);
          return afterEnemy;
        });
      }, 600);
    }
    setBattleSession(s);
  }, [battleSession, playerAtk, playerDef]);

  const handleEscape = useCallback(() => {
    if (!battleSession) return;
    const s = tryEscape(battleSession);
    setBattleSession(s);
  }, [battleSession]);

  const handleBattleClose = useCallback(() => {
    if (battleSession?.result === 'win') {
      addNotification('success', `戦闘勝利！ EXP+${battleSession.expGained} Gold+${battleSession.goldGained}`);
      // TODO: 実際にプレイヤーにEXP/ゴールド付与するには playerSlice.addExp など追加が必要
    }
    setBattleSession(null);
  }, [battleSession, addNotification]);

  // ── 採集 ──
  const handleHarvestStart = useCallback((action: FreeFieldNodeAction, node: FreeFieldNode) => {
    const harvestNodeId = action.systemTargetId ?? node.gatherNodeIds?.[0];
    if (!harvestNodeId) {
      addNotification('error', 'この採集スポットのデータが未設定です');
      return;
    }
    const harvestNode = FFGG_HARVEST_NODES[harvestNodeId];
    if (!harvestNode) {
      addNotification('error', `採集スポット "${harvestNodeId}" が見つかりません`);
      return;
    }
    const result = executeFFHarvest(harvestNode, 'player');
    setHarvestResult(result);
    if (result.items.length > 0) {
      addNotification('success', `FF採集: ${result.items.map(i => `${i.displayName}×${i.amount}`).join(', ')}`);
      // TODO: 実際にインベントリへ追加するには playerSlice.addItem など追加が必要
    }
  }, [addNotification]);

  // ── 釣り ──
  const handleFishingStart = useCallback(() => {
    setGlobalTab('fishing');
    addNotification('info', '🎣 釣り画面へ移動');
  }, [setGlobalTab, addNotification]);

  // ── テスター ──
  const handleTestStart = useCallback(() => {
    setShowTester(true);
  }, []);

  // ── ショップ ──
  const handleShopStart = useCallback(() => {
    // TODO: FFGGの隠しSHOP専用UIは仕様確定後に実装
    setGlobalTab('market');
    addNotification('info', '🛒 ショップへ移動（FF専用ショップは準備中）');
  }, [setGlobalTab, addNotification]);

  // ── フィーバー ──
  const handleFeverStart = useCallback((action: FreeFieldNodeAction) => {
    setFeverAction(action);
  }, []);

  // ── ランドマーク ──
  const handleLandmarkStart = useCallback((action: FreeFieldNodeAction) => {
    if (selectedNode) setLandmarkAction({ action, node: selectedNode });
  }, [selectedNode]);

  return (
    <div style={{ padding: '4px 0 80px' }}>
      {/* バトルモーダル */}
      {battleSession && (
        <FFBattleModal
          session={battleSession}
          onPlayerAttack={handlePlayerAttack}
          onEscape={handleEscape}
          onClose={handleBattleClose}
        />
      )}
      {/* 採集結果モーダル */}
      {harvestResult && (
        <FFHarvestModal result={harvestResult} onClose={() => setHarvestResult(null)} />
      )}
      {/* テスターモーダル */}
      {showTester && <FFTesterModal onClose={() => setShowTester(false)} />}
      {/* フィーバーモーダル */}
      {feverAction && <FFFeverModal action={feverAction} onClose={() => setFeverAction(null)} />}
      {/* ランドマークモーダル */}
      {landmarkAction && (
        <FFLandmarkModal
          node={landmarkAction.node}
          action={landmarkAction.action}
          onClose={() => setLandmarkAction(null)}
        />
      )}

      <h2 style={{
        fontFamily: 'Cinzel,serif', color: '#60a0ff',
        borderBottom: '1px solid #2d3752', paddingBottom: 8, marginBottom: 12,
      }}>
        🗺️ フリーフィールド
      </h2>

      {/* ワールド選択 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {FREE_FIELD_WORLDS.map(w => (
          <button
            key={w.id}
            onClick={() => handleSelectWorld(w.id)}
            style={{
              flex: 1, minWidth: 60, padding: '6px 4px', fontWeight: 700, fontSize: '0.78rem',
              borderRadius: 8, cursor: 'pointer',
              background: selectedWorldId === w.id ? 'rgba(96,160,255,0.18)' : '#1c2235',
              border: `1px solid ${selectedWorldId === w.id ? '#60a0ff' : '#2d3752'}`,
              color: selectedWorldId === w.id ? '#60a0ff' : '#8a92b2',
            }}
          >
            {w.displayName}
          </button>
        ))}
      </div>

      {/* タブ：地図 / FF採集 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['map', 'harvest'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
              background: activeTab === tab ? 'rgba(64,192,128,0.15)' : '#1c2235',
              border: `1px solid ${activeTab === tab ? '#40c080' : '#2d3752'}`,
              color: activeTab === tab ? '#40c080' : '#8a92b2',
            }}
          >
            {tab === 'map' ? '🗺️ マップ' : '🌿 FF採集'}
          </button>
        ))}
      </div>

      {activeTab === 'harvest' ? (
        <FFHarvestTab />
      ) : (
        <>
          {/* ワールド説明 */}
          {world.description && (
            <div style={{ fontSize: '0.70rem', color: '#8a92b2', marginBottom: 6, lineHeight: 1.5 }}>
              {world.description}
              {world.mapSizeHint && (
                <span style={{ marginLeft: 8, color: '#606880' }}>({world.mapSizeHint})</span>
              )}
            </div>
          )}

          {/* エリアフィルター */}
          <AreaSelector areas={areas} activeId={activeAreaId} onSelect={handleSelectArea} />

          {/* 地図（横スクロール可） */}
          <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{ minWidth: 300 }}>
              <MapView
                world={world}
                activeAreaId={activeAreaId}
                selectedNode={selectedNode}
                onSelectNode={handleSelectNode}
              />
            </div>
          </div>

          {/* エリア説明 */}
          {activeAreaId && FREE_FIELD_AREAS_ALL[activeAreaId] && (
            <div style={{
              marginTop: 8, background: '#161b26', border: '1px solid #2d3752',
              borderRadius: 6, padding: '7px 10px', fontSize: '0.72rem', color: '#8a92b2',
            }}>
              <span style={{ color: '#6090ff', fontWeight: 700 }}>
                {FREE_FIELD_AREAS_ALL[activeAreaId].displayName}
              </span>
              {FREE_FIELD_AREAS_ALL[activeAreaId].description && (
                <span style={{ marginLeft: 6 }}>— {FREE_FIELD_AREAS_ALL[activeAreaId].description}</span>
              )}
            </div>
          )}

          {/* ノード詳細パネル（アクション含む） */}
          {selectedNode && (
            <NodeDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onWarpToNode={handleWarpToNode}
              onBattleStart={handleBattleStart}
              onHarvestStart={handleHarvestStart}
              onFishingStart={handleFishingStart}
              onTestStart={handleTestStart}
              onShopStart={handleShopStart}
              onFeverStart={handleFeverStart}
              onLandmarkStart={handleLandmarkStart}
            />
          )}

          {/* エリア内ノード一覧 */}
          {activeAreaId && (
            <NodeListPanel
              nodes={nodesInActiveArea}
              selectedNode={selectedNode}
              onSelectNode={handleSelectNode}
            />
          )}
        </>
      )}
    </div>
  );
}
