// src/components/wiki/WikiPageView.tsx
// ページ閲覧画面。中央に本文、右側に目次/関連ページ/編集導線を表示する（3カラムレイアウトの中央＋右）。

import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { GameIcon } from '../icons';
import { WikiBlockRenderer } from './WikiBlockRenderer';
import { buildOutline } from './wikiOutline';
import {
  fetchWikiPage,
  incrementPageView,
  fetchRelatedPages,
  setPageLocked,
  setPageProtected,
  toggleLikePage,
  isWikiAdmin,
} from '../../services/wikiService';
import { getIconCandidateByRef } from './wikiMasterBridge';
import { WIKI_CATEGORY_LABELS, type WikiPage } from '../../types/wiki';

interface WikiPageViewProps {
  pageId: string;
  uid: string | null;
  onNavigateToPage: (pageIdOrTitle: string, isId: boolean) => void;
  onEdit: (pageId: string) => void;
  onHistory: (pageId: string) => void;
  onReport: (pageId: string) => void;
  refreshKey?: number;
}

export function WikiPageView({ pageId, uid, onNavigateToPage, onEdit, onHistory, onReport, refreshKey }: WikiPageViewProps) {
  const [page, setPage] = useState<WikiPage | null>(null);
  const [related, setRelated] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const p = await fetchWikiPage(pageId);
      if (!p) { setNotFound(true); setPage(null); return; }
      if (p.redirectTo) {
        onNavigateToPage(p.redirectTo, true);
        return;
      }
      setPage(p);
      incrementPageView(pageId);
      const rel = await fetchRelatedPages(p, 6);
      setRelated(rel);
    } catch (e) {
      console.error('[WikiPageView] load failed:', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: 20 }}>読み込み中...</div>;

  if (notFound) {
    return (
      <div style={{ textAlign: 'center', padding: 30, border: '1px dashed var(--border)', borderRadius: 10 }}>
        <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>📄</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>このページはまだ作成されていません</div>
        <button
          onClick={() => onNavigateToPage(pageId, true)}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #f0a830, #e07820)', color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}
        >
          未作成ページを作成
        </button>
      </div>
    );
  }

  if (!page) return null;

  const outline = buildOutline(page.contentBlocks);
  const isAdmin = isWikiAdmin(uid);
  const masterIcon = page.linkedMasterType && page.linkedMasterId ? getIconCandidateByRef(page.linkedMasterType, page.linkedMasterId) : null;

  async function handleLike() {
    if (busy) return;
    setBusy(true);
    try {
      await toggleLikePage(page!.id, liked ? -1 : 1);
      setLiked(!liked);
      setPage(p => p ? { ...p, likeCount: p.likeCount + (liked ? -1 : 1) } : p);
    } catch (e) {
      console.error('[WikiPageView] like failed:', e);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleLock() {
    if (!uid || busy) return;
    setBusy(true);
    try {
      const result = await setPageLocked(page!.id, !page!.isLocked, uid);
      if (result.success) setPage(p => p ? { ...p, isLocked: !p.isLocked } : p);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleProtect() {
    if (!uid || busy) return;
    setBusy(true);
    try {
      const result = await setPageProtected(page!.id, !page!.isProtected, uid);
      if (result.success) setPage(p => p ? { ...p, isProtected: !p.isProtected } : p);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {masterIcon && (
          <div style={{ flexShrink: 0, padding: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <GameIcon id={masterIcon.iconId} size={36} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--accent-blue)', background: 'rgba(91,141,238,0.12)', borderRadius: 4, padding: '2px 6px' }}>{WIKI_CATEGORY_LABELS[page.category]}</span>
            {page.isOfficial && <span style={{ fontSize: '0.62rem', color: 'var(--accent-gold)', background: 'rgba(240,192,96,0.12)', borderRadius: 4, padding: '2px 6px' }}>公式</span>}
            {page.isLocked && <span style={{ fontSize: '0.62rem', color: 'var(--accent-red)', background: 'rgba(224,85,85,0.12)', borderRadius: 4, padding: '2px 6px' }}>🔒 ロック中</span>}
            {page.isProtected && <span style={{ fontSize: '0.62rem', color: 'var(--accent-purple)', background: 'rgba(155,109,240,0.12)', borderRadius: 4, padding: '2px 6px' }}>🛡️ 保護中</span>}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{page.title}</h2>
          {page.summary && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>{page.summary}</div>}
        </div>
      </div>

      {/* メタ情報 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
        <span>👁 {page.viewCount} views</span>
        <span>❤️ {page.likeCount}</span>
        <span>最終更新: {page.updatedByName} ({new Date(page.updatedAt).toLocaleString('ja-JP')})</span>
      </div>

      {/* タグ */}
      {page.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {page.tags.map(t => <span key={t} style={{ fontSize: '0.62rem', color: 'var(--accent-blue)', background: 'rgba(91,141,238,0.1)', borderRadius: 4, padding: '2px 8px' }}>#{t}</span>)}
        </div>
      )}

      {/* 操作ボタン */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <ActionBtn label="✏️ 編集する" onClick={() => onEdit(page.id)} primary />
        <ActionBtn label="🕓 履歴" onClick={() => onHistory(page.id)} />
        <ActionBtn label={liked ? '❤️ いいね済み' : '🤍 いいね'} onClick={handleLike} disabled={busy} />
        <ActionBtn label="🚩 通報" onClick={() => onReport(page.id)} />
        {isAdmin && <ActionBtn label={page.isLocked ? '🔓 ロック解除' : '🔒 ロック'} onClick={handleToggleLock} disabled={busy} />}
        {isAdmin && <ActionBtn label={page.isProtected ? '🛡️ 保護解除' : '🛡️ 保護'} onClick={handleToggleProtect} disabled={busy} />}
      </div>

      {/* 本文＋右カラム（目次・関連ページ） */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          {page.contentBlocks.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: 16, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8 }}>本文はまだありません</div>
          ) : (
            <WikiBlockRenderer blocks={page.contentBlocks} onNavigateToPage={onNavigateToPage} />
          )}
        </div>

        <div style={{ flex: '0 0 220px', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {outline.length > 0 && (
            <SidePanel title="目次">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {outline.map(o => (
                  <a key={o.blockId} href={`#${o.blockId}`} style={{ fontSize: '0.72rem', color: o.level === 1 ? 'var(--text-primary)' : 'var(--text-secondary)', paddingLeft: (o.level - 1) * 10, textDecoration: 'none' }}>
                    {o.text}
                  </a>
                ))}
              </div>
            </SidePanel>
          )}

          <SidePanel title="関連ページ">
            {related.length === 0 ? (
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>関連ページはありません</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {related.map(r => (
                  <button key={r.id} onClick={() => onNavigateToPage(r.id, true)} style={{ textAlign: 'left', fontSize: '0.72rem', color: 'var(--accent-blue)', background: 'transparent', padding: 0 }}>
                    📄 {r.title}
                  </button>
                ))}
              </div>
            )}
          </SidePanel>

          <SidePanel title="編集">
            <button
              onClick={() => onEdit(page.id)}
              style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #5b8dee, #3a6fd0)', color: '#fff', fontWeight: 700, fontSize: '0.74rem' }}
            >
              このページを編集
            </button>
          </SidePanel>
        </div>
      </div>
    </div>
  );
}

function SidePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function ActionBtn({ label, onClick, primary, disabled }: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 12px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 700,
        border: primary ? 'none' : '1px solid var(--border)',
        background: primary ? 'linear-gradient(135deg, #5b8dee, #3a6fd0)' : 'var(--bg-card)',
        color: primary ? '#fff' : 'var(--text-secondary)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}
