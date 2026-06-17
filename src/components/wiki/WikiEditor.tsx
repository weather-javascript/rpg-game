// src/components/wiki/WikiEditor.tsx
// ページ作成・編集画面。ツールバー付きカスタムエディタ、プレビュー切替、保存前差分確認を提供する。

import { useEffect, useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { WikiBlockEditor } from './WikiBlockEditor';
import { WikiBlockRenderer } from './WikiBlockRenderer';
import { WikiTemplateSelector } from './WikiTemplateSelector';
import { getTemplateById } from './wikiTemplates';
import {
  fetchWikiPage,
  createWikiPage,
  updateWikiPage,
  validatePageInput,
  slugify,
  WIKI_LIMITS,
} from '../../services/wikiService';
import { WIKI_CATEGORY_LABELS, type WikiCategory, type WikiPageInput, type WikiTemplateId, type ContentBlock } from '../../types/wiki';

const RECENT_ICON_STORAGE_KEY = 'wiki_recent_icon_refs';
const RECENT_ICON_LIMIT = 16;

function loadRecentIconRefs(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_ICON_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveRecentIconRefs(refs: string[]) {
  try { localStorage.setItem(RECENT_ICON_STORAGE_KEY, JSON.stringify(refs.slice(0, RECENT_ICON_LIMIT))); } catch { /* ignore */ }
}

const CATEGORY_OPTIONS: WikiCategory[] = ['item', 'weapon', 'armor', 'material', 'dungeon', 'beginner_guide', 'glossary', 'faq', 'collection', 'strategy_chart', 'other'];

interface WikiEditorProps {
  pageId?: string; // 既存ページ編集の場合に指定
  initialTitle?: string; // 未作成ページから遷移してきた場合の初期タイトル
  initialTemplateId?: WikiTemplateId;
  uid: string;
  displayName: string;
  onDone: (pageId: string) => void;
  onCancel: () => void;
}

export function WikiEditor({ pageId, initialTitle, initialTemplateId, uid, displayName, onDone, onCancel }: WikiEditorProps) {
  const isNew = !pageId;
  const [loading, setLoading] = useState(!!pageId);
  const [needsTemplate, setNeedsTemplate] = useState(isNew && !initialTemplateId);

  const [title, setTitle] = useState(initialTitle ?? '');
  const [category, setCategory] = useState<WikiCategory>('other');
  const [tagsInput, setTagsInput] = useState('');
  const [summary, setSummary] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [editSummary, setEditSummary] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showDiffConfirm, setShowDiffConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalBlocks, setOriginalBlocks] = useState<ContentBlock[]>([]);
  const [recentIconRefs, setRecentIconRefs] = useState<string[]>(() => loadRecentIconRefs());

  const pushRecentIconRef = useCallback((ref: string) => {
    setRecentIconRefs(prev => {
      const next = [ref, ...prev.filter(r => r !== ref)].slice(0, RECENT_ICON_LIMIT);
      saveRecentIconRefs(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!pageId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const p = await fetchWikiPage(pageId);
        if (!alive || !p) return;
        setTitle(p.title);
        setCategory(p.category);
        setTagsInput(p.tags.join(', '));
        setSummary(p.summary);
        setBlocks(p.contentBlocks);
        setOriginalBlocks(p.contentBlocks);
        setIsLocked(p.isLocked);
      } catch (e) {
        console.error('[WikiEditor] load failed:', e);
        setError('ページの読み込みに失敗しました');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [pageId]);

  useEffect(() => {
    if (initialTemplateId) {
      applyTemplate(initialTemplateId);
      setNeedsTemplate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTemplateId]);

  function applyTemplate(templateId: WikiTemplateId) {
    const tpl = getTemplateById(templateId);
    setCategory(tpl.category);
    setBlocks(tpl.build({ title }));
    setNeedsTemplate(false);
  }

  function buildInput(): WikiPageInput {
    const tags = tagsInput.split(/[,、]/).map(t => t.trim()).filter(t => t.length > 0).slice(0, WIKI_LIMITS.TAG_COUNT_MAX);
    return {
      slug: slugify(title),
      title: title.trim(),
      category,
      tags,
      summary: summary.trim(),
      contentBlocks: blocks,
    };
  }

  function handleRequestSave() {
    const input = buildInput();
    const err = validatePageInput(input);
    if (err) { setError(err); return; }
    setError(null);
    if (isNew) {
      doSave();
    } else {
      setShowDiffConfirm(true);
    }
  }

  async function doSave() {
    setSaving(true);
    setError(null);
    try {
      const input = buildInput();
      if (isNew) {
        const result = await createWikiPage(input, uid, displayName);
        if (!result.success || !result.pageId) { setError(result.error ?? '作成に失敗しました'); return; }
        onDone(result.pageId);
      } else if (pageId) {
        const result = await updateWikiPage(pageId, input, uid, displayName, editSummary);
        if (!result.success) { setError(result.error ?? '保存に失敗しました'); return; }
        onDone(pageId);
      }
    } catch (e) {
      console.error('[WikiEditor] save failed:', e);
      setError('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
      setShowDiffConfirm(false);
    }
  }

  if (needsTemplate) {
    return <WikiTemplateSelector onSelect={applyTemplate} onCancel={onCancel} />;
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: 20 }}>読み込み中...</div>;

  const diff = computeSimpleDiff(originalBlocks, blocks);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{isNew ? '✏️ 新規ページ作成' : '✏️ ページ編集'}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode(m => m === 'edit' ? 'preview' : 'edit')} style={{ fontSize: '0.72rem', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: mode === 'preview' ? 'rgba(91,141,238,0.15)' : 'var(--bg-card)', color: mode === 'preview' ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
            {mode === 'edit' ? '👁️ プレビュー' : '✏️ 編集に戻る'}
          </button>
          <button onClick={onCancel} style={{ fontSize: '0.72rem', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>キャンセル</button>
        </div>
      </div>

      {isLocked && (
        <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)', background: 'rgba(224,85,85,0.1)', borderRadius: 8, padding: '8px 10px' }}>
          🔒 このページはロックされています。管理者のみ編集を保存できます。
        </div>
      )}

      {error && (
        <div style={{ fontSize: '0.74rem', color: 'var(--accent-red)', background: 'rgba(224,85,85,0.1)', borderRadius: 8, padding: '8px 10px' }}>{error}</div>
      )}

      {mode === 'edit' ? (
        <>
          <FieldLabel text={`タイトル（${title.length}/${WIKI_LIMITS.TITLE_MAX}）`} />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, WIKI_LIMITS.TITLE_MAX))}
            placeholder="ページタイトル"
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px' }}>
              <FieldLabel text="カテゴリ" />
              <select value={category} onChange={(e) => setCategory(e.target.value as WikiCategory)} style={inputStyle}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{WIKI_CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div style={{ flex: '2 1 220px' }}>
              <FieldLabel text="タグ（カンマ区切り）" />
              <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="例: 序盤, 武器, 採取" style={inputStyle} />
            </div>
          </div>

          <FieldLabel text={`概要（${summary.length}/${WIKI_LIMITS.SUMMARY_MAX}）`} />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value.slice(0, WIKI_LIMITS.SUMMARY_MAX))}
            rows={2}
            placeholder="一覧や検索結果に表示される概要文"
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          <FieldLabel text="本文" />
          <WikiBlockEditor blocks={blocks} onChange={setBlocks} recentIconRefs={recentIconRefs} pushRecentIconRef={pushRecentIconRef} />

          {!isNew && (
            <>
              <FieldLabel text={`編集内容の説明（${editSummary.length}/${WIKI_LIMITS.EDIT_SUMMARY_MAX}）`} />
              <input
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value.slice(0, WIKI_LIMITS.EDIT_SUMMARY_MAX))}
                placeholder="例: 入手方法を追記"
                style={inputStyle}
              />
            </>
          )}
        </>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 6 }}>{title || '(無題のページ)'}</h2>
          {summary && <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 10 }}>{summary}</div>}
          <WikiBlockRenderer blocks={blocks} onNavigateToPage={() => { /* プレビュー中はリンク遷移しない */ }} />
        </div>
      )}

      <button
        onClick={handleRequestSave}
        disabled={saving || title.trim().length === 0}
        style={{
          padding: '12px 0', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: '0.85rem',
          background: saving || title.trim().length === 0 ? 'var(--bg-hover)' : 'linear-gradient(135deg, #4caf87, #3a8c6a)',
          color: '#fff', opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? '保存中...' : isNew ? '✅ ページを作成' : '✅ 保存する'}
      </button>

      {showDiffConfirm && (
        <DiffConfirmModal
          diff={diff}
          editSummary={editSummary}
          onConfirm={doSave}
          onCancel={() => setShowDiffConfirm(false)}
          saving={saving}
        />
      )}
    </div>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>{text}</div>;
}

const inputStyle: CSSProperties = {
  width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg-dark)', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit',
};

function computeSimpleDiff(prev: ContentBlock[], next: ContentBlock[]) {
  const prevIds = new Set(prev.map(b => b.id));
  const nextIds = new Set(next.map(b => b.id));
  const added = next.filter(b => !prevIds.has(b.id)).length;
  const removed = prev.filter(b => !nextIds.has(b.id)).length;
  const prevMap = new Map(prev.map(b => [b.id, b]));
  let changed = 0;
  for (const b of next) {
    const p = prevMap.get(b.id);
    if (p && JSON.stringify(p) !== JSON.stringify(b)) changed++;
  }
  return { added, removed, changed };
}

function DiffConfirmModal({ diff, editSummary, onConfirm, onCancel, saving }: {
  diff: { added: number; removed: number; changed: number };
  editSummary: string;
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.9rem', marginBottom: 10 }}>変更内容の確認</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--accent-green)' }}>＋追加 {diff.added}</span>
          <span style={{ color: 'var(--accent-red)' }}>−削除 {diff.removed}</span>
          <span style={{ color: 'var(--accent-blue)' }}>変更 {diff.changed}</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          編集内容の説明: {editSummary || '(なし)'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>戻る</button>
          <button onClick={onConfirm} disabled={saving} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #4caf87, #3a8c6a)', color: '#fff', fontWeight: 700, fontSize: '0.78rem', opacity: saving ? 0.7 : 1 }}>
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
