// src/components/screens/FreeFieldScreen.tsx
// フリーフィールド地図 UI（ノードアクション表示・各システム接続フェーズ）

import { useState, useMemo, useCallback } from 'react';
import {
  FREE_FIELD_WORLDS,
  FREE_FIELD_AREAS_ALL,
  FREE_FIELD_NODES_ALL,
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
} from '../../types/freefield';
import { FFGG_ENCOUNTER_TABLE, FFGG_ALL_ENEMIES, FFGG_FEVER_DEFINITIONS } from '../../data/ffggMaster';
import { useGameStore } from '../../stores/gameStore';

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

// ────────────────────────────────────────────
// ノードラベル
// ────────────────────────────────────────────
function NodeLabel({ node, selected }: { node: FreeFieldNode; selected: boolean }) {
  const cfg = NODE_CFG[node.type];
  const shortName = node.indexLabel
    ? `${node.indexLabel}`
    : node.displayName.slice(0, 4);
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

// ────────────────────────────────────────────
// エリア背景バッジ
// ────────────────────────────────────────────
const AREA_COLORS: Record<string, string> = {
  ffgg_forest:  'rgba(20,60,20,0.32)',
  ffgg_plain:   'rgba(50,60,20,0.28)',
  ffgg_desert:  'rgba(60,45,15,0.30)',
  ffgg_snow:    'rgba(30,50,70,0.30)',
  ffgg_savanna: 'rgba(50,35,10,0.30)',
  ffgg_pirate:  'rgba(10,30,60,0.35)',
  ffgg_special: 'rgba(40,20,60,0.28)',
};

// ────────────────────────────────────────────
// 地図View
// ────────────────────────────────────────────
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
  const isTodo = action.description?.includes('TODO') || action.label.includes('TODO');

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
          {isTodo && (
            <span style={{ fontSize: '0.58rem', color: '#806040', background: 'rgba(60,45,15,0.4)', borderRadius: 3, padding: '1px 4px' }}>
              TODO
            </span>
          )}
        </div>
        <button
          onClick={() => onExecute(action)}
          disabled={isTodo}
          style={{
            padding: '3px 10px',
            fontSize: '0.68rem',
            borderRadius: 5,
            cursor: isTodo ? 'not-allowed' : 'pointer',
            background: isTodo ? 'rgba(40,44,60,0.4)' : `rgba(${cfg.color.replace(/[^,\d]/g, '')},0.15)`,
            border: `1px solid ${isTodo ? '#3d4772' : cfg.color}`,
            color: isTodo ? '#505870' : cfg.color,
            fontWeight: 600,
          }}
        >
          {isTodo ? '🚧未実装' : `${cfg.emoji} 実行`}
        </button>
      </div>

      {action.description && (
        <div style={{ fontSize: '0.70rem', color: '#8a92b2', marginBottom: 3, lineHeight: 1.45 }}>
          {action.description}
        </div>
      )}

      {/* アクション固有情報 */}
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
        {action.onceOnly && (
          <span style={{ fontSize: '0.60rem', color: '#a060a0', background: 'rgba(30,20,40,0.5)', borderRadius: 3, padding: '1px 5px' }}>
            🔑一度限り
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

      {/* 解放条件 */}
      {hasUnlock && (
        <div style={{ marginTop: 4 }}>
          {(action.unlockConditions ?? []).map((c, i) => (
            <div key={i} style={{ fontSize: '0.60rem', color: '#806040', background: 'rgba(40,25,10,0.3)', borderRadius: 3, padding: '1px 6px', display: 'inline-block', marginRight: 3 }}>
              🔒 {c.description ?? c.type}
            </div>
          ))}
        </div>
      )}

      {/* 報酬ヒント */}
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
// アクション実行ハンドラ（既存システム接続）
// ────────────────────────────────────────────
function useActionHandler() {
  const setActiveTab = useGameStore(s => s.setActiveTab);

  const handleAction = useCallback((action: FreeFieldNodeAction, _node: FreeFieldNode) => {
    switch (action.type) {
      case 'fishing':
        // 既存釣り画面へ接続
        setActiveTab('fishing');
        break;
      case 'harvest':
        // 既存採取画面へ接続
        setActiveTab('gathering');
        break;
      case 'shop':
        // TODO: 既存ショップUIへの接続（shopId別に分岐）
        // 現状はmarket画面へ
        setActiveTab('market');
        break;
      case 'battleTrigger':
        // TODO: 既存ダンジョン/戦闘システムへのフック
        // DungeonScreenのダンジョン選択を経由する想定
        setActiveTab('dungeon');
        break;
      case 'test':
        // TODO: テスターUI（未実装）
        // 現状はダンジョンタブへ
        setActiveTab('dungeon');
        break;
      case 'warp':
        // TODO: ノード間移動・ワープ処理（未実装）
        // 現状はアラートのみ
        if (action.targetWorldId) {
          alert(`TODO: ワールド遷移 → ${action.targetWorldId}\n（遷移実装未定）`);
        }
        // ノード内移動はFreeFieldScreen側で処理
        break;
      case 'fever':
        // TODO: フィーバー発生ロジック（未実装）
        alert(`TODO: フィーバー発生\n条件: ${action.feverConditionText ?? '未確定'}`);
        break;
      case 'landmark':
        // 地点情報表示（パネル内に表示済みのため何もしない）
        break;
      case 'hidden':
        // TODO: 隠し要素の解放チェック（未実装）
        alert('TODO: 隠し要素の解放条件チェックは未実装');
        break;
      default:
        break;
    }
  }, [setActiveTab]);

  return handleAction;
}

// ────────────────────────────────────────────
// アクション一覧パネル
// ────────────────────────────────────────────
function NodeActionsPanel({
  node,
  onWarpToNode,
}: {
  node: FreeFieldNode;
  onWarpToNode?: (nodeId: string) => void;
}) {
  const handleAction = useActionHandler();
  const actions = node.actions ?? [];

  // hidden アクションは条件未確定のものも含めて薄く表示
  const visibleActions = actions.filter(a => !a.hidden || true); // 全部表示（TODOで薄く）

  if (visibleActions.length === 0) return null;

  // アクション種別サマリー（このノードでできること）
  const typeSet = new Set(actions.map(a => a.type));
  const hasBattle = typeSet.has('battleTrigger');
  const hasHarvest = typeSet.has('harvest');
  const hasFever = typeSet.has('fever');
  const warpActions = actions.filter(a => a.type === 'warp');

  return (
    <div style={{ marginTop: 10 }}>
      {/* このノードでできること サマリー */}
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
                background: `rgba(${cfg.color.slice(1).match(/.{2}/g)!.map(x => parseInt(x,16)).join(',')}, 0.12)`,
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
          {hasHarvest && <span>🌿 採取あり</span>}
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

      {/* アクションボタン一覧 */}
      <div style={{ fontSize: '0.68rem', color: '#8a92b2', marginBottom: 5, fontWeight: 700 }}>
        🎮 アクション
      </div>
      {visibleActions.map((action, idx) => (
        <ActionButton
          key={idx}
          action={action}
          onExecute={(a) => {
            if (a.type === 'warp' && a.targetNodeId && onWarpToNode) {
              onWarpToNode(a.targetNodeId);
            }
            handleAction(a, node);
          }}
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
}: {
  node: FreeFieldNode;
  onClose: () => void;
  onWarpToNode?: (nodeId: string) => void;
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
      {/* ヘッダー */}
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

      {/* 種別・エリア */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.70rem', color: '#8a92b2', marginBottom: 8 }}>
        <span>
          種別: <span style={{ color: cfg.color }}>{cfg.label}</span>
        </span>
        {area && (
          <span>
            エリア: <span style={{ color: '#9090c0' }}>{area.displayName}</span>
          </span>
        )}
        {node.dangerLevel != null && (
          <span style={{ color: '#c06040' }}>
            危険度: {'⭐'.repeat(node.dangerLevel)}
          </span>
        )}
        {node.isSafeZone && (
          <span style={{ color: '#60a060' }}>✅ 安全地帯</span>
        )}
      </div>

      {/* 説明 */}
      {node.description && (
        <div style={{ fontSize: '0.78rem', color: '#b0b8d0', marginBottom: 8, lineHeight: 1.55 }}>
          {node.description}
        </div>
      )}

      {/* アクション一覧 ← メイン */}
      <NodeActionsPanel node={node} onWarpToNode={onWarpToNode} />

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

      {/* タグ */}
      {node.tags && node.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {node.tags.map(t => (
            <span key={t} style={{ fontSize: '0.60rem', background: 'rgba(60,70,110,0.5)', border: '1px solid #3d4772', borderRadius: 4, padding: '1px 6px', color: '#8090c0' }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* 詳細情報トグル */}
      <button
        onClick={() => setShowDetail(v => !v)}
        style={{
          width: '100%', padding: '4px', marginTop: 4, marginBottom: showDetail ? 8 : 0,
          background: 'rgba(30,36,55,0.5)', border: '1px solid #2d3752',
          borderRadius: 5, color: '#6a7290', fontSize: '0.65rem', cursor: 'pointer',
        }}
      >
        {showDetail ? '▲ 詳細情報を閉じる' : '▼ 詳細情報を見る（ヒント・メモ）'}
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

          {/* FFGG エンカウンター情報パネル */}
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
                <div style={{ color: '#6090c0', marginBottom: 2 }}>
                  🔥 フィーバー種別: {Object.values(FFGG_FEVER_DEFINITIONS).filter(f => {
                    if (node.areaId === 'ffgg_plain') return f.type === 'red' || f.type === 'dragon';
                    if (node.areaId === 'ffgg_savanna') return f.type === 'red' || f.type === 'dragon';
                    return f.type === 'gold';
                  }).map(f => f.displayName).join(' / ')}
                </div>
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
// メイン
// ────────────────────────────────────────────
export function FreeFieldScreen() {
  const [selectedWorldId, setSelectedWorldId] = useState<string>(FREE_FIELD_WORLDS[0].id);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FreeFieldNode | null>(null);

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

  // ワープアクションからノードを選択
  const handleWarpToNode = useCallback((nodeId: string) => {
    const target = FREE_FIELD_NODES_ALL[nodeId];
    if (target) {
      setSelectedNode(target);
      // 対象エリアに切り替え
      if (target.areaId !== activeAreaId) {
        setActiveAreaId(target.areaId);
      }
    }
  }, [activeAreaId]);

  return (
    <div style={{ padding: '4px 0 80px' }}>
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
    </div>
  );
}
