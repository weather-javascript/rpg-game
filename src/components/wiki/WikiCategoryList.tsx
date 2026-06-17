// src/components/wiki/WikiCategoryList.tsx
// カテゴリ別・タグ別のページ一覧画面。

import { useEffect, useState } from 'react';
import { fetchWikiPagesByCategory, fetchWikiPagesByTag } from '../../services/wikiService';
import { WIKI_CATEGORY_LABELS, type WikiCategory, type WikiPage } from '../../types/wiki';

interface WikiCategoryListProps {
  category?: WikiCategory;
  tag?: string;
  onOpenPage: (pageId: string) => void;
}

export function WikiCategoryList({ category, tag, onOpenPage }: WikiCategoryListProps) {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = category ? await fetchWikiPagesByCategory(category, 100) : tag ? await fetchWikiPagesByTag(tag, 100) : [];
        if (alive) setPages(r);
      } catch (e) {
        console.error('[WikiCategoryList] load failed:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [category, tag]);

  return (
    <div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 12 }}>
        {category ? `📂 ${WIKI_CATEGORY_LABELS[category]}` : `🏷️ #${tag}`}
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 8 }}>{pages.length}件</span>
      </div>
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: 12 }}>読み込み中...</div>
      ) : pages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, border: '1px dashed var(--border)', borderRadius: 10, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          まだこのカテゴリのページはありません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pages.map(p => (
            <button
              key={p.id}
              onClick={() => onOpenPage(p.id)}
              style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.title}</div>
              {p.summary && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 3 }}>{p.summary}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
