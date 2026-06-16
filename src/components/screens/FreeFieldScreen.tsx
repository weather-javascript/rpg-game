// src/components/screens/FreeFieldScreen.tsx
// フリーフィールド画面（外枠実装）
// 敵・戦闘・採取・ドロップ・フィーバー・ボスは未実装

import { useState, useMemo } from 'react';
import { FREE_FIELD_WORLDS } from '../../data/freefieldData';
import type { FreeFieldWorld, FreeFieldArea, FreeFieldNode, FreeFieldNodeKind } from '../../types/freefield';

// ──────────────────────────────────────────────
// ノード種別の表示設定
// ──────────────────────────────────────────────
const NODE_KIND_CONFIG: Record<FreeFieldNodeKind, { emoji: string; color: string; label: string }> = {
  entrance:  { emoji: '🚪', color: '#60c060', label: '入口' },
  safe:      { emoji: '🏕️',  color: '#6090ff', label: '安全地帯' },
  harvest:   { emoji: '🌿', color: '#40c080', label: '採取' },
  danger:    { emoji: '⚔️', color: '#e06050', label: '危険' },
  boss:      { emoji: '💀', color: '#c040c0', label: 'ボス' },
  shop:      { emoji: '🛒', color: '#f0c060', label: 'ショップ' },
  fishing:   { emoji: '🎣', color: '#40b0d0', label: '釣り' },
  test:      { emoji: '🔬', color: '#8080a0', label: 'テスト' },
  shortcut:  { emoji: '⚡', color: '#c0a020', label: 'ショートカット' },
};

// ──────────────────────────────────────────────
// ノードピン（地図上に描画）
// ──────────────────────────────────────────────
interface NodePinProps {
  node: FreeFieldNode;
  selected: boolean;
  onClick: () => void;
}

function NodePin({ node, selected, onClick }: NodePinProps) {
  const cfg = NODE_KIND_CONFIG[node.kind];
  return (
    <button
      onClick={onClick}
      title={node.label}
      style={{
        position: 'absolute',
        left: `${node.x * 100}%`,
        top: `${node.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        background: selected ? cfg.color : 'rgba(20,25,40,0.85)',
        border: `2px solid ${cfg.color}`,
        borderRadius: '50%',
        width: 30,
        height: 30,
        fontSize: '0.8rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: selected ? `0 0 8px ${cfg.color}` : '0 1px 4px rgba(0,0,0,0.5)',
        zIndex: selected ? 10 : 5,
        padding: 0,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{cfg.emoji}</span>
    </button>
  );
}

// ──────────────────────────────────────────────
// 地図コンポーネント
// ──────────────────────────────────────────────
interface MapViewProps {
  world: FreeFieldWorld;
  activeAreaId: string | null;
  selectedNode: FreeFieldNode | null;
  onSelectNode: (node: FreeFieldNode) => void;
}

function MapView({ world, activeAreaId, selectedNode, onSelectNode }: MapViewProps) {
  const visibleNodes = useMemo(() => {
    if (!activeAreaId) return world.areas.flatMap(a => a.nodes);
    return world.areas.find(a => a.id === activeAreaId)?.nodes ?? [];
  }, [world, activeAreaId]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      paddingBottom: `${(1 / (world.mapAspect ?? 0.82)) * 100}%`,
      background: '#1a2535',
      border: '2px solid #2d3752',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* 地図背景（暫定：ビオーム別色分けで表現） */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* 北部草原 */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg,#1a3520 0%,#223828 100%)', opacity: 0.7 }} />
        {/* 中央部 */}
        <div style={{ position: 'absolute', top: '35%', left: 0, right: 0, height: '20%', background: '#25302a', opacity: 0.5 }} />
        {/* 砂漠 */}
        <div style={{ position: 'absolute', top: '48%', left: '25%', right: 0, bottom: 0, background: 'linear-gradient(180deg,#3a2c10 0%,#4a3818 100%)', opacity: 0.7 }} />
        {/* 西雪原 */}
        <div style={{ position: 'absolute', top: '50%', left: 0, width: '22%', bottom: 0, background: '#2a2d38', opacity: 0.7 }} />
        {/* 北部の湖 */}
        <div style={{ position: 'absolute', top: '5%', left: 0, width: '25%', height: '25%', background: '#0d2a40', opacity: 0.9, borderRadius: '40% 20% 30% 10%' }} />
        {/* FFGGR(未実装)帯 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '10%', background: '#1a1a1a', opacity: 0.85 }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#8060d0', fontWeight: 700, letterSpacing: 1 }}>
            FFGGR (未実装地帯)
          </div>
        </div>

        {/* グリッド線（薄く） */}
        {[...Array(10)].map((_, i) => (
          <div key={`h${i}`} style={{ position: 'absolute', top: `${i * 10}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.04)' }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={`v${i}`} style={{ position: 'absolute', left: `${i * 10}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.04)' }} />
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
        background: 'rgba(10,14,24,0.85)', border: '1px solid #2d3752',
        borderRadius: 6, padding: '4px 8px', fontSize: '0.6rem', color: '#8a92b2',
      }}>
        {(['entrance','safe','danger','boss'] as FreeFieldNodeKind[]).map(k => {
          const c = NODE_KIND_CONFIG[k];
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
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
interface NodeDetailProps {
  node: FreeFieldNode;
  onClose: () => void;
}

function NodeDetailPanel({ node, onClose }: NodeDetailProps) {
  const cfg = NODE_KIND_CONFIG[node.kind];
  const isUnimplemented = ['harvest','danger','boss','shop','fishing'].includes(node.kind) || node.id === 'ffggr_entry';

  return (
    <div style={{
      background: '#161b26', border: `2px solid ${cfg.color}`,
      borderRadius: 10, padding: 14, marginTop: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: cfg.color }}>
          {cfg.emoji} {node.label}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#8a92b2', cursor: 'pointer', fontSize: '1rem' }}
        >✕</button>
      </div>

      <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 8 }}>
        種別：<span style={{ color: cfg.color }}>{cfg.label}</span>
      </div>

      {node.description && (
        <div style={{ fontSize: '0.8rem', color: '#b0b8d0', marginBottom: 10 }}>
          {node.description}
        </div>
      )}

      {isUnimplemented ? (
        <div style={{
          background: 'rgba(80,80,120,0.2)', border: '1px dashed #4040a0',
          borderRadius: 6, padding: '8px 10px', fontSize: '0.75rem', color: '#6060a0',
        }}>
          🚧 このノードの機能は未実装です。将来のアップデートで追加予定。
          {/* TODO: 戦闘・採取・ボス戦などの実装をここに追加 */}
        </div>
      ) : (
        <div style={{
          background: 'rgba(60,100,60,0.2)', border: '1px solid #40804040',
          borderRadius: 6, padding: '8px 10px', fontSize: '0.75rem', color: '#80c080',
        }}>
          安全な場所です。（機能は今後追加予定）
          {/* TODO: 拠点・ショップなどの実装 */}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// エリアセレクター
// ──────────────────────────────────────────────
interface AreaSelectorProps {
  areas: FreeFieldArea[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

function AreaSelector({ areas, activeId, onSelect }: AreaSelectorProps) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '5px 10px', fontSize: '0.75rem', borderRadius: 6, cursor: 'pointer',
          background: activeId === null ? 'rgba(240,192,96,0.15)' : '#1c2235',
          border: `1px solid ${activeId === null ? '#f0c060' : '#2d3752'}`,
          color: activeId === null ? '#f0c060' : '#8a92b2',
        }}
      >
        すべて
      </button>
      {areas.map(a => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          style={{
            padding: '5px 10px', fontSize: '0.75rem', borderRadius: 6, cursor: 'pointer',
            background: activeId === a.id ? 'rgba(96,144,255,0.15)' : '#1c2235',
            border: `1px solid ${activeId === a.id ? '#6090ff' : '#2d3752'}`,
            color: activeId === a.id ? '#6090ff' : '#8a92b2',
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// メイン FreeFieldScreen
// ──────────────────────────────────────────────
export function FreeFieldScreen() {
  const [selectedWorldId, setSelectedWorldId] = useState<string>(FREE_FIELD_WORLDS[0].id);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FreeFieldNode | null>(null);

  const world: FreeFieldWorld | undefined = FREE_FIELD_WORLDS.find(w => w.id === selectedWorldId);

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

  return (
    <div style={{ padding: '4px 0 80px' }}>
      {/* ヘッダー */}
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#60a0ff', borderBottom: '1px solid #2d3752', paddingBottom: 8, marginBottom: 12 }}>
        🗺️ フリーフィールド
      </h2>

      {/* ワールド選択 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {FREE_FIELD_WORLDS.map(w => (
          <button
            key={w.id}
            onClick={() => handleSelectWorld(w.id)}
            style={{
              flex: 1, padding: '7px 4px', fontWeight: 700, fontSize: '0.82rem',
              borderRadius: 8, cursor: 'pointer',
              background: selectedWorldId === w.id ? 'rgba(96,160,255,0.18)' : '#1c2235',
              border: `1px solid ${selectedWorldId === w.id ? '#60a0ff' : '#2d3752'}`,
              color: selectedWorldId === w.id ? '#60a0ff' : '#8a92b2',
            }}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* ワールド説明 */}
      {world.description && (
        <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 8 }}>
          {world.description}
        </div>
      )}

      {/* エリアフィルター */}
      <AreaSelector areas={world.areas} activeId={activeAreaId} onSelect={handleSelectArea} />

      {/* 地図 */}
      <MapView
        world={world}
        activeAreaId={activeAreaId}
        selectedNode={selectedNode}
        onSelectNode={handleSelectNode}
      />

      {/* ノード詳細 */}
      {selectedNode && (
        <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

      {/* ノードリスト（アクティブエリアのノードを一覧） */}
      {activeAreaId && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 6 }}>
            ノード一覧
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(world.areas.find(a => a.id === activeAreaId)?.nodes ?? []).map(node => {
              const cfg = NODE_KIND_CONFIG[node.kind];
              const sel = selectedNode?.id === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => handleSelectNode(node)}
                  style={{
                    padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem',
                    background: sel ? `rgba(${cfg.color === '#e06050' ? '224,96,80' : '96,144,255'},0.15)` : '#1c2235',
                    border: `1px solid ${sel ? cfg.color : '#2d3752'}`,
                    color: sel ? cfg.color : '#8a92b2',
                  }}
                >
                  {cfg.emoji} {node.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 未実装通知 */}
      <div style={{
        marginTop: 16, background: 'rgba(80,60,20,0.2)', border: '1px dashed #6a5030',
        borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem', color: '#806040',
      }}>
        ⚠️ フリーフィールドは現在外枠実装中です。戦闘・採取・ドロップ・ボスなどは今後追加予定です。
      </div>
    </div>
  );
}
