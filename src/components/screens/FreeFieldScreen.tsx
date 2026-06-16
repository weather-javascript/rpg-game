// src/components/screens/FreeFieldScreen.tsx
// フリーフィールド画面（外枠実装）
// 敵・戦闘・採取・ドロップ・フィーバー・ボスは未実装

import { useState, useMemo } from 'react';
import {
  FREE_FIELD_WORLDS,
  FREE_FIELD_AREAS_ALL,
  FREE_FIELD_NODES_ALL,
  getAreasByWorld,
  getNodesByWorld,
  getNodesByArea,
} from '../../data/freefieldData';
import type { FreeFieldWorld, FreeFieldArea, FreeFieldNode, FreeFieldNodeType } from '../../types/freefield';

// ──────────────────────────────────────────────
// ノード種別の表示設定
// ──────────────────────────────────────────────
const NODE_TYPE_CONFIG: Record<FreeFieldNodeType, { emoji: string; color: string; label: string }> = {
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

// ──────────────────────────────────────────────
// ノードピン
// ──────────────────────────────────────────────
function NodePin({ node, selected, onClick }: { node: FreeFieldNode; selected: boolean; onClick: () => void }) {
  const cfg = NODE_TYPE_CONFIG[node.type];
  return (
    <button
      onClick={onClick}
      title={`${node.indexLabel ?? ''} ${node.displayName}`}
      style={{
        position: 'absolute',
        left: `${node.position.x * 100}%`,
        top: `${node.position.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        background: selected ? cfg.color : 'rgba(20,25,40,0.85)',
        border: `2px solid ${cfg.color}`,
        borderRadius: '50%',
        width: 30, height: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: selected ? `0 0 8px ${cfg.color}` : '0 1px 4px rgba(0,0,0,0.5)',
        zIndex: selected ? 10 : 5,
        padding: 0,
        transition: 'all 0.15s',
        fontSize: '0.85rem',
      }}
    >
      {cfg.emoji}
    </button>
  );
}

// ──────────────────────────────────────────────
// 地図View
// ──────────────────────────────────────────────
function MapView({
  world, activeAreaId, selectedNode, onSelectNode,
}: {
  world: FreeFieldWorld;
  activeAreaId: string | null;
  selectedNode: FreeFieldNode | null;
  onSelectNode: (n: FreeFieldNode) => void;
}) {
  const visibleNodes = useMemo(() => {
    if (!activeAreaId) return getNodesByWorld(world.id);
    return getNodesByArea(activeAreaId);
  }, [world.id, activeAreaId]);

  const aspect = world.mapAspect ?? 0.82;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      paddingBottom: `${(1 / aspect) * 100}%`,
      background: '#1a2535',
      border: '2px solid #2d3752',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* 暫定バイオーム背景 */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg,#1a3520 0%,#223828 100%)', opacity: 0.7 }} />
        <div style={{ position: 'absolute', top: '48%', left: '25%', right: 0, bottom: '10%', background: 'linear-gradient(180deg,#3a2c10 0%,#4a3818 100%)', opacity: 0.7 }} />
        <div style={{ position: 'absolute', top: '45%', left: 0, width: '22%', bottom: '10%', background: '#2a2d38', opacity: 0.7 }} />
        <div style={{ position: 'absolute', top: '5%', left: 0, width: '25%', height: '25%', background: '#0d2a40', opacity: 0.9, borderRadius: '40% 20% 30% 10%' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '10%', background: '#1a1a1a', opacity: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: '#8060d0', fontWeight: 700, letterSpacing: 1 }}>FFGGR (未実装地帯)</span>
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={`h${i}`} style={{ position: 'absolute', top: `${i * 10}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.03)' }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={`v${i}`} style={{ position: 'absolute', left: `${i * 10}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>

      {/* ノードピン */}
      {visibleNodes.map(node => (
        <NodePin
          key={node.id}
          node={node}
          selected={selectedNode?.id === node.id}
          onClick={() => onSelectNode(node)}
        />
      ))}

      {/* 凡例 */}
      <div style={{
        position: 'absolute', bottom: 12, right: 8,
        background: 'rgba(10,14,24,0.88)', border: '1px solid #2d3752',
        borderRadius: 6, padding: '4px 8px', fontSize: '0.58rem', color: '#8a92b2',
      }}>
        {(['entrance','safe','danger','boss','fever','landmark','transition'] as FreeFieldNodeType[]).map(k => {
          const c = NODE_TYPE_CONFIG[k];
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
              <span>{c.emoji}</span><span style={{ color: c.color }}>{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// ノード詳細パネル
// ──────────────────────────────────────────────
function NodeDetailPanel({ node, onClose }: { node: FreeFieldNode; onClose: () => void }) {
  const cfg = NODE_TYPE_CONFIG[node.type];

  return (
    <div style={{
      background: '#161b26', border: `2px solid ${cfg.color}`,
      borderRadius: 10, padding: 14, marginTop: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: cfg.color }}>
          {cfg.emoji} {node.indexLabel && <span style={{ marginRight: 4 }}>{node.indexLabel}</span>}{node.displayName}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8a92b2', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
      </div>

      {node.aliasNames && node.aliasNames.length > 0 && (
        <div style={{ fontSize: '0.7rem', color: '#6a7290', marginBottom: 4 }}>
          別名: {node.aliasNames.join(' / ')}
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 6 }}>
        種別: <span style={{ color: cfg.color }}>{cfg.label}</span>
        {node.dangerLevel && (
          <span style={{ marginLeft: 10, color: '#c06040' }}>
            危険度: {'⭐'.repeat(node.dangerLevel)}
          </span>
        )}
        {node.isSafeZone && <span style={{ marginLeft: 10, color: '#60a060' }}>✅ 安全地帯</span>}
      </div>

      {node.description && (
        <div style={{ fontSize: '0.8rem', color: '#b0b8d0', marginBottom: 8 }}>{node.description}</div>
      )}

      {(node.resourceHints ?? []).length > 0 && (
        <div style={{ fontSize: '0.72rem', color: '#60c080', marginBottom: 4 }}>
          🌿 採取ヒント: {node.resourceHints!.join(' / ')}
        </div>
      )}

      {(node.encounterHints ?? []).length > 0 && (
        <div style={{ fontSize: '0.72rem', color: '#e06050', marginBottom: 4 }}>
          ⚔️ 出現ヒント: {node.encounterHints!.join(' / ')}
        </div>
      )}

      {(node.eventHints ?? []).length > 0 && (
        <div style={{ fontSize: '0.72rem', color: '#ff8020', marginBottom: 4 }}>
          🔥 イベントヒント: {node.eventHints!.join(' / ')}
        </div>
      )}

      {node.notes && (
        <div style={{
          marginTop: 6, fontSize: '0.68rem', color: '#606880',
          background: 'rgba(40,40,60,0.4)', borderRadius: 4, padding: '4px 8px',
        }}>
          📝 {node.notes}
        </div>
      )}

      <div style={{
        marginTop: 8, background: 'rgba(80,60,20,0.2)', border: '1px dashed #6a5030',
        borderRadius: 6, padding: '5px 8px', fontSize: '0.68rem', color: '#806040',
      }}>
        🚧 このノードの機能は未実装です。
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// エリアセレクター
// ──────────────────────────────────────────────
function AreaSelector({ areas, activeId, onSelect }: {
  areas: FreeFieldArea[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '4px 8px', fontSize: '0.72rem', borderRadius: 6, cursor: 'pointer',
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
            padding: '4px 8px', fontSize: '0.72rem', borderRadius: 6, cursor: 'pointer',
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

// ──────────────────────────────────────────────
// メイン
// ──────────────────────────────────────────────
export function FreeFieldScreen() {
  const [selectedWorldId, setSelectedWorldId] = useState<string>(FREE_FIELD_WORLDS[0].id);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FreeFieldNode | null>(null);

  const world = FREE_FIELD_WORLDS.find(w => w.id === selectedWorldId);
  const areas = world ? getAreasByWorld(world.id) : [];

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
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  };

  if (!world) return null;

  const nodesInActiveArea = activeAreaId ? getNodesByArea(activeAreaId) : [];

  return (
    <div style={{ padding: '4px 0 80px' }}>
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#60a0ff', borderBottom: '1px solid #2d3752', paddingBottom: 8, marginBottom: 12 }}>
        🗺️ フリーフィールド
      </h2>

      {/* ワールド選択 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {FREE_FIELD_WORLDS.map(w => (
          <button
            key={w.id}
            onClick={() => handleSelectWorld(w.id)}
            style={{
              flex: 1, padding: '6px 4px', fontWeight: 700, fontSize: '0.8rem',
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

      {world.description && (
        <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 6 }}>
          {world.description}
          {world.mapSizeHint && <span style={{ marginLeft: 8, color: '#606880' }}>({world.mapSizeHint})</span>}
        </div>
      )}

      {/* エリアフィルター */}
      <AreaSelector areas={areas} activeId={activeAreaId} onSelect={handleSelectArea} />

      {/* 地図 */}
      <MapView
        world={world}
        activeAreaId={activeAreaId}
        selectedNode={selectedNode}
        onSelectNode={handleSelectNode}
      />

      {/* エリア説明 */}
      {activeAreaId && FREE_FIELD_AREAS_ALL[activeAreaId] && (
        <div style={{
          marginTop: 8, background: '#161b26', border: '1px solid #2d3752',
          borderRadius: 6, padding: '8px 10px', fontSize: '0.75rem', color: '#8a92b2',
        }}>
          <span style={{ color: '#6090ff', fontWeight: 700 }}>
            {FREE_FIELD_AREAS_ALL[activeAreaId].displayName}
          </span>
          {FREE_FIELD_AREAS_ALL[activeAreaId].description && (
            <span> — {FREE_FIELD_AREAS_ALL[activeAreaId].description}</span>
          )}
        </div>
      )}

      {/* ノード詳細 */}
      {selectedNode && (
        <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

      {/* エリア内ノード一覧 */}
      {activeAreaId && nodesInActiveArea.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: '0.7rem', color: '#8a92b2', marginBottom: 5 }}>ノード一覧</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {nodesInActiveArea.map(node => {
              const cfg = NODE_TYPE_CONFIG[node.type];
              const sel = selectedNode?.id === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => handleSelectNode(node)}
                  style={{
                    padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem',
                    background: sel ? 'rgba(96,144,255,0.15)' : '#1c2235',
                    border: `1px solid ${sel ? cfg.color : '#2d3752'}`,
                    color: sel ? cfg.color : '#8a92b2',
                  }}
                >
                  {cfg.emoji} {node.indexLabel && `${node.indexLabel} `}{node.displayName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{
        marginTop: 14, background: 'rgba(80,60,20,0.2)', border: '1px dashed #6a5030',
        borderRadius: 8, padding: '7px 10px', fontSize: '0.68rem', color: '#806040',
      }}>
        ⚠️ フリーフィールドは外枠実装中です。戦闘・採取・ドロップ・フィーバー発生は今後追加予定。
      </div>
    </div>
  );
}
