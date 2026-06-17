// src/components/wiki/WikiLinkPicker.tsx
// 内部ページリンクを本文に挿入するためのモーダル。
// ページID直指定だけでなく、表示名検索からも選択できる。

import { useState, useEffect } from 'react';
import { searchWikiPages } from '../../services/wikiService';
import type { WikiPage } from '../../types/wiki';

interface WikiLinkPickerProps {
  onSelect: (page: { pageId: string; label: string }) => void;
  onClose: () => void;
}

export function WikiLinkPicker({ onSelect, onClose }: WikiLinkPickerProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [customLabel, setCustomLabel] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (keyword.trim().length === 0) { setResults([]); return; }
      setLoading(true);
      try {
        const r = await searchWikiPages(keyword, 20);
        setResults(r);
      } catch (e) {
        console.error('[WikiLinkPicker] search failed:', e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '72vh', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.9rem' }}>🔗 ページリンクを挿入</span>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '1rem', padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ページ名で検索"
            autoFocus
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', padding: 16 }}>検索中...</div>}
          {!loading && keyword.trim().length > 0 && results.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', padding: 16 }}>該当するページがありません</div>
          )}
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect({ pageId: p.id, label: p.title })}
              style={{ textAlign: 'left', padding: '8px 10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8rem' }}
            >
              <div style={{ fontWeight: 700 }}>{p.title}</div>
              {p.summary && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{p.summary}</div>}
            </button>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>未作成ページへのリンクを作る（表示名のみ指定）</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="表示名を入力"
              style={{ flex: 1, padding: '7px 10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem' }}
            />
            <button
              disabled={customLabel.trim().length === 0}
              onClick={() => onSelect({ pageId: '', label: customLabel.trim() })}
              style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: customLabel.trim() ? 'linear-gradient(135deg, #5b8dee, #3a6fd0)' : 'var(--bg-hover)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, opacity: customLabel.trim() ? 1 : 0.5 }}
            >
              挿入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
