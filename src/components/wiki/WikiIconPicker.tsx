// src/components/wiki/WikiIconPicker.tsx
// ゲーム内アイコンを検索して本文に挿入するためのモーダル。
// アイテム名検索・カテゴリ検索・最近使ったアイコンに対応。

import { useState, useMemo, useEffect } from 'react';
import { GameIcon } from '../icons';
import { searchIconCandidates, type IconCandidate } from './wikiMasterBridge';

const RECENT_KEY_LIMIT = 16;

interface WikiIconPickerProps {
  onSelect: (candidate: IconCandidate) => void;
  onClose: () => void;
  recentIconRefs: string[]; // `${sourceType}:${refId}` の配列
  pushRecentIconRef: (ref: string) => void;
}

const FILTERS: { id: 'all' | 'item' | 'weapon' | 'armor' | 'material' | 'monster' | 'dungeon'; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'item', label: 'アイテム' },
  { id: 'weapon', label: '武器' },
  { id: 'armor', label: '防具' },
  { id: 'material', label: '素材' },
  { id: 'monster', label: 'モンスター' },
  { id: 'dungeon', label: 'ダンジョン' },
];

export function WikiIconPicker({ onSelect, onClose, recentIconRefs, pushRecentIconRef }: WikiIconPickerProps) {
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<typeof FILTERS[number]['id']>('all');
  const [showRecent, setShowRecent] = useState(recentIconRefs.length > 0);

  useEffect(() => {
    if (keyword.trim().length > 0) setShowRecent(false);
  }, [keyword]);

  const results = useMemo(() => {
    if (showRecent) {
      const all = searchIconCandidates('', 'all');
      const byRef = new Map(all.map(c => [`${c.sourceType}:${c.refId}`, c]));
      return recentIconRefs.map(r => byRef.get(r)).filter((c): c is IconCandidate => !!c).slice(0, RECENT_KEY_LIMIT);
    }
    return searchIconCandidates(keyword, filter);
  }, [keyword, filter, showRecent, recentIconRefs]);

  const handlePick = (c: IconCandidate) => {
    pushRecentIconRef(`${c.sourceType}:${c.refId}`);
    onSelect(c);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 460, maxHeight: '78vh', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.9rem' }}>🖼️ アイコンを挿入</span>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '1rem', padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="アイテム名・モンスター名・ダンジョン名で検索"
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }}
          />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {recentIconRefs.length > 0 && (
              <button
                onClick={() => { setShowRecent(true); setKeyword(''); }}
                style={{ flexShrink: 0, padding: '5px 10px', fontSize: '0.7rem', borderRadius: 6, border: `1px solid ${showRecent ? 'var(--accent-gold)' : 'var(--border)'}`, background: showRecent ? 'rgba(240,192,96,0.15)' : 'var(--bg-dark)', color: showRecent ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
              >
                🕓 最近使った
              </button>
            )}
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => { setShowRecent(false); setFilter(f.id); }}
                style={{ flexShrink: 0, padding: '5px 10px', fontSize: '0.7rem', borderRadius: 6, border: `1px solid ${!showRecent && filter === f.id ? 'var(--accent-blue)' : 'var(--border)'}`, background: !showRecent && filter === f.id ? 'rgba(91,141,238,0.15)' : 'var(--bg-dark)', color: !showRecent && filter === f.id ? 'var(--accent-blue)' : 'var(--text-secondary)' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
          {results.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', padding: 24 }}>
              {showRecent ? '最近使ったアイコンはありません' : '該当するアイコンが見つかりません'}
            </div>
          )}
          {results.map((c) => (
            <button
              key={`${c.sourceType}:${c.refId}`}
              onClick={() => handlePick(c)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 8 }}
            >
              <GameIcon id={c.iconId} size={28} />
              <span style={{ fontSize: '0.62rem', color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.2 }}>{c.label}</span>
              {c.sub && <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{c.sub}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
