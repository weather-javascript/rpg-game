// src/components/screens/FreeFieldScreen.tsx
// フリーフィールド地図 UI（表示・選択フェーズ）
// 敵・戦闘・採取・ドロップ・フィーバー発生は未実装

import { useState, useMemo } from 'react';
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
} from '../../types/freefield';
import { FFGG_ENCOUNTER_TABLE, FFGG_ALL_ENEMIES, FFGG_FEVER_DEFINITIONS } from '../../data/ffggMaster';

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
      {/* エリア色レイヤー（FFGG のみ） */}
      {world.id === 'ffgg' && (
        <>
          {/* 森 上部中央 */}
          <div style={{ position: 'absolute', left: '35%', top: '5%', width: '28%', height: '35%', background: AREA_COLORS.ffgg_forest, borderRadius: '50%', filter: 'blur(18px)' }} />
          {/* 平原 右上 */}
          <div style={{ position: 'absolute', left: '72%', top: '5%', width: '22%', height: '28%', background: AREA_COLORS.ffgg_plain, borderRadius: '50%', filter: 'blur(16px)' }} />
          {/* 砂漠 中央下 */}
          <div style={{ position: 'absolute', left: '40%', top: '50%', width: '38%', height: '38%', background: AREA_COLORS.ffgg_desert, borderRadius: '50%', filter: 'blur(20px)' }} />
          {/* 雪山 右中 */}
          <div style={{ position: 'absolute', left: '60%', top: '28%', width: '28%', height: '32%', background: AREA_COLORS.ffgg_snow, borderRadius: '50%', filter: 'blur(16px)' }} />
          {/* サバンナ 左 */}
          <div style={{ position: 'absolute', left: '0%', top: '20%', width: '28%', height: '40%', background: AREA_COLORS.ffgg_savanna, borderRadius: '50%', filter: 'blur(18px)' }} />
          {/* 海賊船 中央 */}
          <div style={{ position: 'absolute', left: '30%', top: '32%', width: '24%', height: '22%', background: AREA_COLORS.ffgg_pirate, borderRadius: '50%', filter: 'blur(14px)' }} />
          {/* 特殊 左上 */}
          <div style={{ position: 'absolute', left: '5%', top: '5%', width: '32%', height: '30%', background: AREA_COLORS.ffgg_special, borderRadius: '50%', filter: 'blur(16px)' }} />
        </>
      )}

      {/* グリッド */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {[...Array(10)].map((_, i) => (
          <div key={`h${i}`} style={{ position: 'absolute', top: `${i * 10}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.025)' }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={`v${i}`} style={{ position: 'absolute', left: `${i * 10}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.025)' }} />
        ))}
      </div>

      {/* 接続線 */}
      <ConnectionLines nodes={visibleNodes} />

      {/* ノードピン */}
      {visibleNodes.map(node => (
        <NodePin
          key={node.id}
          node={node}
          selected={selectedNode?.id === node.id}
          onClick={() => onSelectNode(node)}
        />
      ))}

      {/* ノードラベル */}
      {visibleNodes.map(node => (
        <NodeLabel key={`lbl-${node.id}`} node={node} selected={selectedNode?.id === node.id} />
      ))}

      {/* 凡例 */}
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

      {/* ワールド名バッジ */}
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
// ノード詳細パネル
// ────────────────────────────────────────────
function NodeDetailPanel({
  node,
  onClose,
}: {
  node: FreeFieldNode;
  onClose: () => void;
}) {
  const cfg = NODE_CFG[node.type];
  const area = FREE_FIELD_AREAS_ALL[node.areaId];

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

      {/* 接続先 */}
      {connectedNodes.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '0.65rem', color: '#8a92b2', marginBottom: 4 }}>🔗 接続先ノード</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {connectedNodes.map(cn => {
              const ccfg = NODE_CFG[cn.type];
              return (
                <span key={cn.id} style={{
                  fontSize: '0.65rem',
                  background: 'rgba(40,50,80,0.6)',
                  border: `1px solid ${ccfg.color}`,
                  borderRadius: 5,
                  padding: '2px 7px',
                  color: ccfg.color,
                }}>
                  {ccfg.emoji} {cn.indexLabel && `${cn.indexLabel} `}{cn.displayName}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ヒント群 */}
      {(node.encounterHints ?? []).length > 0 && (
        <div style={{ fontSize: '0.68rem', color: '#e06050', marginBottom: 4 }}>
          ⚔️ 出現ヒント（未実装）: {node.encounterHints!.join(' / ')}
        </div>
      )}
      {(node.resourceHints ?? []).length > 0 && (
        <div style={{ fontSize: '0.68rem', color: '#60c080', marginBottom: 4 }}>
          🌿 採取ヒント（未実装）: {node.resourceHints!.join(' / ')}
        </div>
      )}
      {(node.eventHints ?? []).length > 0 && (
        <div style={{ fontSize: '0.68rem', color: '#ff8020', marginBottom: 4 }}>
          🔥 イベントヒント（未実装）: {node.eventHints!.join(' / ')}
        </div>
      )}

      {/* エリア情報 */}
      {area?.description && (
        <div style={{ fontSize: '0.65rem', color: '#707890', marginBottom: 6, borderTop: '1px solid #2d3752', paddingTop: 6 }}>
          📍 エリア説明: {area.description}
        </div>
      )}

      {/* notes */}
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
            {node.type === 'danger' || node.type === 'boss' ? null : (
              <div style={{ color: '#60c080', marginTop: 4, fontSize: '0.62rem' }}>
                💡 トリガーを無視すれば採取のみも可能
              </div>
            )}
          </div>
        );
      })()}

      {/* TODO: 移動確定ボタン（将来の移動処理のプレースホルダー） */}
      <button
        disabled
        style={{
          width: '100%', padding: '7px 0', marginTop: 4,
          background: 'rgba(50,50,70,0.4)', border: '1px dashed #3d4772',
          borderRadius: 7, color: '#6a7290', fontSize: '0.75rem', cursor: 'not-allowed',
        }}
        title="TODO: 移動処理は未実装"
      >
        🚧 このノードへ移動（未実装）
      </button>
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

      {/* ノード詳細パネル */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
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

      {/* 未実装バナー */}
      <div style={{
        marginTop: 14, background: 'rgba(60,45,15,0.25)', border: '1px dashed #6a5030',
        borderRadius: 8, padding: '7px 10px', fontSize: '0.65rem', color: '#806040',
      }}>
        ⚠️ フリーフィールドは地図表示フェーズです。戦闘・採取・ドロップ・フィーバー発生は今後追加予定。
      </div>
    </div>
  );
}
