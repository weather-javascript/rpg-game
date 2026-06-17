// src/components/wiki/WikiSearch.tsx
// ページ検索画面。タイトル前方一致・タグ一致で検索する。

import { useState, useEffect } from 'react';
import { searchWikiPages } from '../../services/wikiService';
import { WIKI_CATEGORY_LABELS, type WikiPage } from '../../types/wiki';

interface WikiSearchProps {
  initialQuery?: string;
  onOpenPage: (pageId: string) => void;
  onCreateFromQuery: (title: string) => void;
}

export function WikiSearch({ initialQuery, onOpenPage, onCreateFromQuery }: WikiSearchProps) {
  const [keyword, setKeyword] = useState(initialQuery ?? '');
  const [results, setResults] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch(q: string) {
    if (q.trim().length === 0) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const r = await searchWikiPages(q, 40);
      setResults(r);
    } catch (e) {
      console.error('[WikiSearch] search failed:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runSearch(keyword); }}
          placeholder="ページ名・タグで検索"
          autoFocus
          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
        />
        <button onClick={() => runSearch(keyword)} style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5b8dee, #3a6fd0)', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
          検索
        </button>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: 12 }}>検索中...</div>}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24, border: '1px dashed var(--border)', borderRadius: 10 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 10 }}>「{keyword}」に該当するページが見つかりません</div>
          <button
            onClick={() => onCreateFromQuery(keyword)}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #f0a830, #e07820)', color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}
          >
            ＋「{keyword}」のページを作成
          </button>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => onOpenPage(p.id)}
              style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.title}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{WIKI_CATEGORY_LABELS[p.category]}</span>
              </div>
              {p.summary && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>{p.summary}</div>}
              {p.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {p.tags.map(t => <span key={t} style={{ fontSize: '0.6rem', color: 'var(--accent-blue)', background: 'rgba(91,141,238,0.1)', borderRadius: 4, padding: '2px 6px' }}>#{t}</span>)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
