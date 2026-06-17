// src/components/wiki/WikiTab.tsx
// 冒険ナビ内の「攻略WIKI」サブタブ本体。画面遷移（home/page/edit/history/search/category/tag）を統括する。
// レイアウト：左にカテゴリ/最近更新ナビ、中央〜右に本文（WikiHome/WikiPageView等が中央＋右の構成を内包）。
// スマホでは左カラムを折りたたみ式にしてレスポンシブ対応する。

import { useState, useCallback, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { WikiHome } from './WikiHome';
import { WikiPageView } from './WikiPageView';
import { WikiEditor } from './WikiEditor';
import { WikiHistory } from './WikiHistory';
import { WikiSearch } from './WikiSearch';
import { WikiCategoryList } from './WikiCategoryList';
import { WikiReportModal } from './WikiReportModal';
import { findWikiPageByTitleOrSlug } from '../../services/wikiService';
import { WIKI_CATEGORY_LABELS, type WikiCategory, type WikiNavState, type WikiTemplateId } from '../../types/wiki';

const CATEGORY_NAV: WikiCategory[] = ['beginner_guide', 'item', 'weapon', 'armor', 'material', 'dungeon', 'glossary', 'faq', 'collection', 'strategy_chart', 'other'];

export function WikiTab() {
  const player = useGameStore(s => s.player);
  const uid = useGameStore(s => s.uid);
  const addNotification = useGameStore(s => s.addNotification);

  const [nav, setNav] = useState<WikiNavState>({ mode: 'home' });
  const historyRef = useRef<WikiNavState[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reportingPageId, setReportingPageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resolving, setResolving] = useState(false);

  const displayName = player?.displayName ?? '名無しの冒険者';

  const pushNav = useCallback((next: WikiNavState) => {
    historyRef.current = [...historyRef.current, nav];
    setNav(next);
    setSidebarOpen(false);
  }, [nav]);

  const goBackOrHome = useCallback(() => {
    const h = historyRef.current;
    if (h.length === 0) { setNav({ mode: 'home' }); return; }
    const copy = [...h];
    const last = copy.pop()!;
    historyRef.current = copy;
    setNav(last);
  }, []);

  // ページIDまたは表示名へ遷移。未作成の場合はpage画面側で「未作成ページを作成」導線を出す。
  const handleNavigateToPage = useCallback(async (pageIdOrTitle: string, isId: boolean) => {
    if (isId) {
      pushNav({ mode: 'page', pageId: pageIdOrTitle });
      return;
    }
    setResolving(true);
    try {
      const found = await findWikiPageByTitleOrSlug(pageIdOrTitle);
      if (found) {
        pushNav({ mode: 'page', pageId: found.id });
      } else {
        pushNav({ mode: 'edit', pageSlugOrTitle: pageIdOrTitle });
      }
    } catch (e) {
      console.error('[WikiTab] navigate resolve failed:', e);
      addNotification('error', 'ページの検索に失敗しました');
    } finally {
      setResolving(false);
    }
  }, [pushNav, addNotification]);

  function handleOpenUnwrittenLink(title: string) {
    handleNavigateToPage(title, false);
  }

  function handleCreateNew() {
    pushNav({ mode: 'edit' });
  }

  function handleEditPage(pageId: string) {
    pushNav({ mode: 'edit', pageId });
  }

  function handleHistoryPage(pageId: string) {
    pushNav({ mode: 'history', pageId });
  }

  function handleReport(pageId: string) {
    setReportingPageId(pageId);
  }

  function handleEditorDone(pageId: string) {
    setRefreshKey(k => k + 1);
    setNav({ mode: 'page', pageId });
    historyRef.current = [];
  }

  function handleHistoryReverted() {
    setRefreshKey(k => k + 1);
    if (nav.mode === 'history' && nav.pageId) {
      setNav({ mode: 'page', pageId: nav.pageId });
    }
    addNotification('success', '指定の版に差し戻しました');
  }

  return (
    <div className="wiki-tab-root" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {/* 左カラム：カテゴリ・最近更新ナビ（モバイルは折りたたみ） */}
      <button
        className="wiki-sidebar-toggle"
        onClick={() => setSidebarOpen(v => !v)}
        style={{
          display: 'none', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '0.74rem', marginBottom: 8,
        }}
      >
        {sidebarOpen ? '✕ カテゴリを閉じる' : '☰ カテゴリ一覧'}
      </button>

      <aside className={`wiki-sidebar ${sidebarOpen ? 'wiki-sidebar-open' : ''}`} style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SidebarBtn label="🏠 トップ" active={nav.mode === 'home'} onClick={() => pushNav({ mode: 'home' })} />
        <SidebarBtn label="🔍 検索" active={nav.mode === 'search'} onClick={() => pushNav({ mode: 'search' })} />
        <SidebarBtn label="✏️ 新規作成" active={false} onClick={handleCreateNew} accent />
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 10, marginBottom: 2, paddingLeft: 4 }}>カテゴリ</div>
        {CATEGORY_NAV.map(cat => (
          <SidebarBtn key={cat} label={WIKI_CATEGORY_LABELS[cat]} active={nav.mode === 'category' && nav.category === cat} onClick={() => pushNav({ mode: 'category', category: cat })} />
        ))}
      </aside>

      {/* メインエリア */}
      <div style={{ flex: 1, minWidth: 0, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
        {nav.mode !== 'home' && (
          <button onClick={goBackOrHome} style={{ marginBottom: 10, fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'transparent', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← 戻る
          </button>
        )}

        {resolving && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 8 }}>ページを検索しています...</div>}

        {nav.mode === 'home' && (
          <WikiHome
            playerLevel={player?.stats.level ?? 1}
            onOpenPage={(pageId) => pushNav({ mode: 'page', pageId })}
            onOpenCategory={(category) => pushNav({ mode: 'category', category })}
            onOpenSearch={() => pushNav({ mode: 'search' })}
            onCreateNew={handleCreateNew}
            onOpenUnwrittenLink={handleOpenUnwrittenLink}
          />
        )}

        {nav.mode === 'search' && (
          <WikiSearch
            initialQuery={nav.searchQuery}
            onOpenPage={(pageId) => pushNav({ mode: 'page', pageId })}
            onCreateFromQuery={(title) => pushNav({ mode: 'edit', pageSlugOrTitle: title })}
          />
        )}

        {nav.mode === 'category' && nav.category && (
          <WikiCategoryList category={nav.category} onOpenPage={(pageId) => pushNav({ mode: 'page', pageId })} />
        )}

        {nav.mode === 'tag' && nav.tag && (
          <WikiCategoryList tag={nav.tag} onOpenPage={(pageId) => pushNav({ mode: 'page', pageId })} />
        )}

        {nav.mode === 'page' && nav.pageId && (
          <WikiPageView
            pageId={nav.pageId}
            uid={uid}
            refreshKey={refreshKey}
            onNavigateToPage={handleNavigateToPage}
            onEdit={handleEditPage}
            onHistory={handleHistoryPage}
            onReport={handleReport}
          />
        )}

        {nav.mode === 'edit' && uid && (
          <WikiEditor
            pageId={nav.pageId}
            initialTitle={nav.pageSlugOrTitle}
            initialTemplateId={nav.templateId as WikiTemplateId | undefined}
            uid={uid}
            displayName={displayName}
            onDone={handleEditorDone}
            onCancel={goBackOrHome}
          />
        )}

        {nav.mode === 'edit' && !uid && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: '0.8rem' }}>ログイン状態を確認しています...</div>
        )}

        {nav.mode === 'history' && nav.pageId && uid && (
          <WikiHistory
            pageId={nav.pageId}
            uid={uid}
            displayName={displayName}
            onReverted={handleHistoryReverted}
            onBack={goBackOrHome}
          />
        )}
      </div>

      {reportingPageId && uid && (
        <WikiReportModal
          pageId={reportingPageId}
          uid={uid}
          onClose={() => setReportingPageId(null)}
          onSubmitted={() => { setReportingPageId(null); addNotification('success', '通報を送信しました'); }}
        />
      )}

      <style>{`
        .wiki-tab-root input,
        .wiki-tab-root textarea,
        .wiki-tab-root [contenteditable="true"] {
          background: #ffffff !important;
          color: #111827 !important;
          caret-color: #111827 !important;
          border-color: #cbd5e1 !important;
        }

        .wiki-tab-root input::placeholder,
        .wiki-tab-root textarea::placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }

        .wiki-tab-root input:focus,
        .wiki-tab-root textarea:focus,
        .wiki-tab-root [contenteditable="true"]:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px rgba(91, 141, 238, 0.18) !important;
        }

        @media (max-width: 700px) {
          .wiki-sidebar-toggle { display: block !important; }
          .wiki-sidebar { display: none !important; }
          .wiki-sidebar-open {
            display: flex !important;
            position: fixed; top: 60px; left: 8px; right: 8px; z-index: 300;
            background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
            padding: 10px; max-height: 70vh; overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}

function SidebarBtn({ label, active, onClick, accent }: { label: string; active: boolean; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', padding: '8px 10px', borderRadius: 8, fontSize: '0.74rem',
        border: active ? '1px solid var(--accent-blue)' : '1px solid transparent',
        background: active ? 'rgba(91,141,238,0.15)' : accent ? 'rgba(240,168,48,0.12)' : 'transparent',
        color: active ? 'var(--accent-blue)' : accent ? 'var(--accent-gold)' : 'var(--text-secondary)',
        fontWeight: active || accent ? 700 : 400,
      }}
    >
      {label}
    </button>
  );
}
