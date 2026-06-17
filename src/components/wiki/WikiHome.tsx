// src/components/wiki/WikiHome.tsx
// 攻略WIKIのトップ画面。検索・カテゴリ一覧・最近更新・人気ページ・おすすめページを表示する。

import { useEffect, useState } from 'react';
import { GameIcon } from '../icons';
import {
  fetchRecentlyUpdatedPages,
  fetchPopularPages,
} from '../../services/wikiService';
import { recommendDungeonIdForLevel, getIconCandidateByRef } from './wikiMasterBridge';
import { DUNGEON_MASTER } from '../../data/masters';
import { WIKI_CATEGORY_LABELS, type WikiCategory, type WikiPage } from '../../types/wiki';

const CATEGORY_ORDER: WikiCategory[] = ['beginner_guide', 'item', 'weapon', 'armor', 'material', 'dungeon', 'glossary', 'faq', 'collection', 'strategy_chart', 'other'];
const CATEGORY_EMOJI: Record<WikiCategory, string> = {
  item: '🧪', weapon: '⚔️', armor: '🛡️', material: '⛏️', dungeon: '🏰',
  beginner_guide: '🔰', glossary: '📖', faq: '❓', collection: '📚', strategy_chart: '🗺️', other: '📄',
};

interface WikiHomeProps {
  playerLevel: number;
  onOpenPage: (pageId: string) => void;
  onOpenCategory: (category: WikiCategory) => void;
  onOpenSearch: () => void;
  onCreateNew: () => void;
  onOpenUnwrittenLink: (title: string) => void;
}

export function WikiHome({ playerLevel, onOpenPage, onOpenCategory, onOpenSearch, onCreateNew, onOpenUnwrittenLink }: WikiHomeProps) {
  const [recent, setRecent] = useState<WikiPage[]>([]);
  const [popular, setPopular] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [r, p] = await Promise.all([fetchRecentlyUpdatedPages(8), fetchPopularPages(6)]);
        if (alive) { setRecent(r); setPopular(p); }
      } catch (e) {
        console.error('[WikiHome] load failed:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const recommendedDungeonId = recommendDungeonIdForLevel(playerLevel);
  const recommendedDungeon = recommendedDungeonId ? DUNGEON_MASTER[recommendedDungeonId] : null;
  const recommendedIcon = recommendedDungeonId ? getIconCandidateByRef('dungeon', recommendedDungeonId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 検索バー */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onOpenSearch(); }}
          placeholder="WIKI内を検索（ページ名・タグ）"
          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
        />
        <button onClick={onOpenSearch} style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5b8dee, #3a6fd0)', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
          🔍 検索
        </button>
      </div>

      <button
        onClick={onCreateNew}
        style={{ padding: '12px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #f0a830, #e07820)', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}
      >
        ✏️ 新しいページを作成
      </button>

      {/* おすすめページ（進行度連動） */}
      {recommendedDungeon && (
        <div
          onClick={() => onOpenUnwrittenLink(recommendedDungeon.name)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, rgba(91,141,238,0.12), rgba(155,109,240,0.08))', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          {recommendedIcon && <GameIcon id={recommendedIcon.iconId} size={32} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>あなたへのおすすめ（Lv{playerLevel}）</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{recommendedDungeon.name}のページを見る</div>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>›</span>
        </div>
      )}

      {/* カテゴリ一覧 */}
      <div>
        <SectionTitle text="カテゴリ" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
          {CATEGORY_ORDER.map(cat => (
            <button
              key={cat}
              onClick={() => onOpenCategory(cat)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.76rem' }}
            >
              <span>{CATEGORY_EMOJI[cat]}</span>
              <span>{WIKI_CATEGORY_LABELS[cat]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 最近更新 */}
      <div>
        <SectionTitle text="最近更新されたページ" />
        {loading ? <LoadingRow /> : recent.length === 0 ? <EmptyRow text="まだページがありません。最初のページを作成しましょう！" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map(p => <PageRow key={p.id} page={p} onClick={() => onOpenPage(p.id)} />)}
          </div>
        )}
      </div>

      {/* 人気ページ */}
      <div>
        <SectionTitle text="人気ページ" />
        {loading ? <LoadingRow /> : popular.length === 0 ? <EmptyRow text="まだ閲覧データがありません。" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {popular.map(p => <PageRow key={p.id} page={p} onClick={() => onOpenPage(p.id)} showViews />)}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ text }: { text: string }) {
  return <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>{text}</div>;
}

function LoadingRow() {
  return <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: 12 }}>読み込み中...</div>;
}

function EmptyRow({ text }: { text: string }) {
  return <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', padding: 12, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8 }}>{text}</div>;
}

function PageRow({ page, onClick, showViews }: { page: WikiPage; onClick: () => void; showViews?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'left' }}
    >
      <span style={{ fontSize: '0.95rem' }}>{CATEGORY_EMOJI[page.category] ?? '📄'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.title}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{page.updatedByName} ・ {new Date(page.updatedAt).toLocaleDateString('ja-JP')}</div>
      </div>
      {showViews && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>👁 {page.viewCount}</span>}
    </button>
  );
}
