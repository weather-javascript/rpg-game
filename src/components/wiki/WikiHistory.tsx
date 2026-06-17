// src/components/wiki/WikiHistory.tsx
// ページ履歴画面。リビジョン一覧表示、内容プレビュー、差し戻しを提供する。

import { useEffect, useState } from 'react';
import { WikiBlockRenderer } from './WikiBlockRenderer';
import { fetchPageRevisions, revertToRevision, isWikiAdmin } from '../../services/wikiService';
import type { WikiRevision } from '../../types/wiki';

interface WikiHistoryProps {
  pageId: string;
  uid: string | null;
  displayName: string;
  onReverted: () => void;
  onBack: () => void;
}

export function WikiHistory({ pageId, uid, displayName, onReverted, onBack }: WikiHistoryProps) {
  const [revisions, setRevisions] = useState<WikiRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState<WikiRevision | null>(null);
  const [reverting, setReverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetchPageRevisions(pageId, 80);
        if (alive) setRevisions(r);
      } catch (e) {
        console.error('[WikiHistory] load failed:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [pageId]);

  async function handleRevert(revisionId: string) {
    if (!uid) return;
    setReverting(true);
    setError(null);
    try {
      const result = await revertToRevision(pageId, revisionId, uid, displayName);
      if (!result.success) { setError(result.error ?? '差し戻しに失敗しました'); return; }
      onReverted();
    } catch (e) {
      console.error('[WikiHistory] revert failed:', e);
      setError('差し戻し中にエラーが発生しました');
    } finally {
      setReverting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-gold)' }}>🕓 ページ履歴</span>
        <button onClick={onBack} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'transparent' }}>戻る</button>
      </div>

      {error && <div style={{ fontSize: '0.74rem', color: 'var(--accent-red)', background: 'rgba(224,85,85,0.1)', borderRadius: 8, padding: '8px 10px' }}>{error}</div>}

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: 16 }}>読み込み中...</div>
      ) : revisions.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: 16, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8 }}>履歴がありません</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {revisions.map((rev, i) => (
            <div key={rev.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {i === 0 && <span style={{ color: 'var(--accent-green)', marginRight: 6 }}>●最新</span>}
                    {rev.editSummary}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {rev.editorName} ・ {new Date(rev.editedAt).toLocaleString('ja-JP')}
                  </div>
                  {rev.diffSummary && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--accent-green)' }}>＋{rev.diffSummary.added}</span>
                      <span style={{ color: 'var(--accent-red)' }}>−{rev.diffSummary.removed}</span>
                      <span style={{ color: 'var(--accent-blue)' }}>変更{rev.diffSummary.changed}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setPreviewing(rev)} style={{ fontSize: '0.65rem', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text-secondary)' }}>内容を見る</button>
                  {i !== 0 && uid && (
                    <button
                      onClick={() => handleRevert(rev.id)}
                      disabled={reverting}
                      style={{ fontSize: '0.65rem', padding: '5px 8px', borderRadius: 6, border: 'none', background: 'rgba(224,85,85,0.15)', color: 'var(--accent-red)', opacity: reverting ? 0.6 : 1 }}
                    >
                      この版に戻す
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewing && (
        <div onClick={() => setPreviewing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '78vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{previewing.title}</span>
              <button onClick={() => setPreviewing(null)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <WikiBlockRenderer blocks={previewing.contentBlocks} onNavigateToPage={() => { /* 履歴プレビュー中はリンク遷移しない */ }} />
          </div>
        </div>
      )}

      {!isWikiAdmin(uid) && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>※ 重要ページの保護・ロックは管理者のみ操作できます。</div>
      )}
    </div>
  );
}
