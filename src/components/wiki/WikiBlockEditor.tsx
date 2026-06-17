// src/components/wiki/WikiBlockEditor.tsx
// custom block editor。各ブロックを編集可能なコンポーネントとして表示し、
// ツールバーから見出し・装飾・リンク・アイコンを挿入できるようにする。

import { useState, useRef } from 'react';
import { GameIcon } from '../icons';
import { WikiIconPicker } from './WikiIconPicker';
import { WikiLinkPicker } from './WikiLinkPicker';
import type { ContentBlock, InlineRun, BlockKind } from '../../types/wiki';
import type { IconCandidate } from './wikiMasterBridge';

let _seq = 0;
function newId(): string {
  _seq += 1;
  return `b_${Date.now().toString(36)}_${_seq}`;
}

function plainText(runs: InlineRun[] = []): string {
  return runs.map(r => (r.kind === 'text' ? (r.text ?? '') : r.kind === 'internalLink' ? `[${r.linkLabel}]` : '🖼')).join('');
}

function textRun(t: string): InlineRun {
  return { kind: 'text', text: t };
}

const COLOR_PRESETS = ['#f0c060', '#5b8dee', '#4caf87', '#e05555', '#9b6df0', '#e8e6ff'];

interface WikiBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  recentIconRefs: string[];
  pushRecentIconRef: (ref: string) => void;
}

type ActiveTarget = { blockId: string; itemIndex?: number } | null;

export function WikiBlockEditor({ blocks, onChange, recentIconRefs, pushRecentIconRef }: WikiBlockEditorProps) {
  const [activeTarget, setActiveTarget] = useState<ActiveTarget>(blocks[0] ? { blockId: blocks[0].id } : null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  function updateBlock(blockId: string, updater: (b: ContentBlock) => ContentBlock) {
    onChange(blocks.map(b => (b.id === blockId ? updater(b) : b)));
  }

  function setBlockText(blockId: string, itemIndex: number | undefined, value: string) {
    updateBlock(blockId, (b) => {
      if (itemIndex === undefined) {
        return { ...b, runs: [textRun(value)] };
      }
      const items = [...(b.items ?? [])];
      items[itemIndex] = [textRun(value)];
      return { ...b, items };
    });
  }

  function insertRunAtTarget(run: InlineRun) {
    if (!activeTarget) return;
    updateBlock(activeTarget.blockId, (b) => {
      if (activeTarget.itemIndex === undefined) {
        const runs = [...(b.runs ?? [])];
        const last = runs[runs.length - 1];
        if (last && last.kind === 'text' && run.kind !== 'text') {
          runs.push(run);
        } else if (run.kind === 'text' && last && last.kind === 'text') {
          runs[runs.length - 1] = textRun((last.text ?? '') + (run.text ?? ''));
        } else {
          runs.push(run);
        }
        return { ...b, runs };
      }
      const items = [...(b.items ?? [])];
      const runs = [...(items[activeTarget.itemIndex] ?? [])];
      runs.push(run);
      items[activeTarget.itemIndex] = runs;
      return { ...b, items };
    });
  }

  function toggleMarkOnTarget(mark: 'bold' | 'italic') {
    if (!activeTarget) return;
    updateBlock(activeTarget.blockId, (b) => {
      const apply = (runs: InlineRun[]) => runs.map(r => r.kind === 'text' ? { ...r, marks: { ...r.marks, [mark]: !r.marks?.[mark] } } : r);
      if (activeTarget.itemIndex === undefined) {
        return { ...b, runs: apply(b.runs ?? []) };
      }
      const items = [...(b.items ?? [])];
      items[activeTarget.itemIndex] = apply(items[activeTarget.itemIndex] ?? []);
      return { ...b, items };
    });
  }

  function applyColorToTarget(color: string) {
    if (!activeTarget) return;
    updateBlock(activeTarget.blockId, (b) => {
      const apply = (runs: InlineRun[]) => runs.map(r => r.kind === 'text' ? { ...r, marks: { ...r.marks, color } } : r);
      if (activeTarget.itemIndex === undefined) {
        return { ...b, runs: apply(b.runs ?? []) };
      }
      const items = [...(b.items ?? [])];
      items[activeTarget.itemIndex] = apply(items[activeTarget.itemIndex] ?? []);
      return { ...b, items };
    });
    setShowColorMenu(false);
  }

  function addBlock(kind: BlockKind, afterId?: string) {
    const block: ContentBlock = kind === 'bulletList' || kind === 'orderedList'
      ? { id: newId(), kind, items: [[textRun('')]] }
      : { id: newId(), kind, runs: [textRun('')] };
    if (!afterId) {
      onChange([...blocks, block]);
    } else {
      const idx = blocks.findIndex(b => b.id === afterId);
      const next = [...blocks];
      next.splice(idx + 1, 0, block);
      onChange(next);
    }
    setActiveTarget({ blockId: block.id });
  }

  function removeBlock(blockId: string) {
    onChange(blocks.filter(b => b.id !== blockId));
  }

  function changeBlockKind(blockId: string, kind: BlockKind) {
    updateBlock(blockId, (b) => {
      if (kind === 'bulletList' || kind === 'orderedList') {
        return { id: b.id, kind, items: b.runs ? [b.runs] : [[textRun('')]] };
      }
      return { id: b.id, kind, runs: b.items ? (b.items[0] ?? [textRun('')]) : (b.runs ?? [textRun('')]) };
    });
  }

  function addListItem(blockId: string) {
    updateBlock(blockId, (b) => ({ ...b, items: [...(b.items ?? []), [textRun('')]] }));
  }

  function removeListItem(blockId: string, itemIndex: number) {
    updateBlock(blockId, (b) => {
      const items = (b.items ?? []).filter((_, i) => i !== itemIndex);
      return { ...b, items: items.length > 0 ? items : [[textRun('')]] };
    });
  }

  const BLOCK_KIND_OPTIONS: { kind: BlockKind; label: string }[] = [
    { kind: 'heading1', label: 'H1 見出し' },
    { kind: 'heading2', label: 'H2 中見出し' },
    { kind: 'heading3', label: 'H3 小見出し' },
    { kind: 'paragraph', label: '本文' },
    { kind: 'bulletList', label: '箇条書き' },
    { kind: 'orderedList', label: '番号付きリスト' },
    { kind: 'quote', label: '引用' },
  ];

  return (
    <div>
      {/* ツールバー */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: 6,
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
        padding: 8, marginBottom: 12,
      }}>
        <select
          value=""
          onChange={(e) => { if (activeTarget) changeBlockKind(activeTarget.blockId, e.target.value as BlockKind); e.currentTarget.value = ''; }}
          style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.72rem', padding: '6px 4px' }}
        >
          <option value="" disabled>ブロック種別を変更</option>
          {BLOCK_KIND_OPTIONS.map(o => <option key={o.kind} value={o.kind}>{o.label}</option>)}
        </select>

        <ToolbarBtn label="B" title="太字" bold onClick={() => toggleMarkOnTarget('bold')} />
        <ToolbarBtn label="I" title="イタリック" italic onClick={() => toggleMarkOnTarget('italic')} />

        <div style={{ position: 'relative' }}>
          <ToolbarBtn label="🎨" title="文字色" onClick={() => setShowColorMenu(v => !v)} />
          {showColorMenu && (
            <div style={{ position: 'absolute', top: '110%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, display: 'flex', gap: 4, zIndex: 20 }}>
              {COLOR_PRESETS.map(c => (
                <button key={c} onClick={() => applyColorToTarget(c)} style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: '1px solid var(--border)' }} />
              ))}
            </div>
          )}
        </div>

        <ToolbarBtn label="🔗" title="内部ページリンク" onClick={() => setShowLinkPicker(true)} />
        <ToolbarBtn label="🖼️" title="アイコン挿入" onClick={() => setShowIconPicker(true)} />
        <ToolbarBtn label="❝❞" title="引用ブロックを追加" onClick={() => addBlock('quote', activeTarget?.blockId)} />
        <ToolbarBtn label="―" title="区切り線を追加" onClick={() => addBlock('divider', activeTarget?.blockId)} />
        <ToolbarBtn label="• リスト" title="箇条書きを追加" onClick={() => addBlock('bulletList', activeTarget?.blockId)} />
        <ToolbarBtn label="1. リスト" title="番号付きリストを追加" onClick={() => addBlock('orderedList', activeTarget?.blockId)} />
      </div>

      {/* ブロック一覧 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {blocks.map((block) => (
          <div
            key={block.id}
            style={{
              border: `1px solid ${activeTarget?.blockId === block.id ? 'var(--accent-blue)' : 'var(--border)'}`,
              borderRadius: 8, padding: 8, background: 'var(--bg-dark)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{blockKindLabel(block.kind)}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(block.kind === 'bulletList' || block.kind === 'orderedList') && (
                  <button onClick={() => addListItem(block.id)} style={{ fontSize: '0.62rem', padding: '2px 6px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderRadius: 4 }}>+項目</button>
                )}
                <button onClick={() => addBlock('paragraph', block.id)} style={{ fontSize: '0.62rem', padding: '2px 6px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderRadius: 4 }}>＋下に追加</button>
                <button onClick={() => removeBlock(block.id)} style={{ fontSize: '0.62rem', padding: '2px 6px', background: 'rgba(224,85,85,0.12)', color: 'var(--accent-red)', borderRadius: 4 }}>削除</button>
              </div>
            </div>

            {block.kind === 'divider' ? (
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            ) : block.kind === 'bulletList' || block.kind === 'orderedList' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(block.items ?? []).map((runs, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{block.kind === 'orderedList' ? `${idx + 1}.` : '・'}</span>
                    <textarea
                      ref={(el) => { textareaRefs.current[`${block.id}:${idx}`] = el; }}
                      value={plainText(runs)}
                      onFocus={() => setActiveTarget({ blockId: block.id, itemIndex: idx })}
                      onChange={(e) => setBlockText(block.id, idx, e.target.value)}
                      rows={1}
                      style={{ flex: 1, resize: 'vertical', background: 'transparent', border: 'none', color: previewColor(runs), fontWeight: previewBold(runs) ? 700 : 400, fontStyle: previewItalic(runs) ? 'italic' : 'normal', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none' }}
                    />
                    <button onClick={() => removeListItem(block.id, idx)} style={{ fontSize: '0.62rem', color: 'var(--text-muted)', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                ref={(el) => { textareaRefs.current[block.id] = el; }}
                value={plainText(block.runs)}
                onFocus={() => setActiveTarget({ blockId: block.id })}
                onChange={(e) => setBlockText(block.id, undefined, e.target.value)}
                rows={block.kind === 'heading1' || block.kind === 'heading2' || block.kind === 'heading3' ? 1 : 3}
                placeholder={placeholderFor(block.kind)}
                style={{
                  width: '100%', resize: 'vertical', background: 'transparent', border: 'none', outline: 'none',
                  color: previewColor(block.runs), fontWeight: previewBold(block.runs) || block.kind.startsWith('heading') ? 700 : 400,
                  fontStyle: previewItalic(block.runs) ? 'italic' : 'normal',
                  fontSize: block.kind === 'heading1' ? '1.1rem' : block.kind === 'heading2' ? '1rem' : block.kind === 'heading3' ? '0.92rem' : '0.85rem',
                  fontFamily: 'inherit',
                }}
              />
            )}

            {/* インライン要素（アイコン・リンク）のプレビューチップ */}
            <InlineExtrasPreview runs={block.kind === 'bulletList' || block.kind === 'orderedList' ? undefined : block.runs} />
          </div>
        ))}

        <button
          onClick={() => addBlock('paragraph')}
          style={{ padding: '10px 0', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.78rem' }}
        >
          ＋ ブロックを追加
        </button>
      </div>

      {showIconPicker && (
        <WikiIconPicker
          recentIconRefs={recentIconRefs}
          pushRecentIconRef={pushRecentIconRef}
          onClose={() => setShowIconPicker(false)}
          onSelect={(c: IconCandidate) => {
            insertRunAtTarget({ kind: 'iconEmbed', iconId: c.iconId, iconSourceType: c.sourceType, iconRefId: c.refId, iconLabel: c.label });
            setShowIconPicker(false);
          }}
        />
      )}
      {showLinkPicker && (
        <WikiLinkPicker
          onClose={() => setShowLinkPicker(false)}
          onSelect={({ pageId, label }) => {
            insertRunAtTarget({ kind: 'internalLink', linkPageId: pageId, linkLabel: label });
            setShowLinkPicker(false);
          }}
        />
      )}
    </div>
  );
}

function ToolbarBtn({ label, title, onClick, bold, italic }: { label: string; title: string; onClick: () => void; bold?: boolean; italic?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-dark)',
        color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: bold ? 700 : 400, fontStyle: italic ? 'italic' : 'normal',
      }}
    >
      {label}
    </button>
  );
}

function InlineExtrasPreview({ runs }: { runs?: InlineRun[] }) {
  const extras = (runs ?? []).filter(r => r.kind !== 'text');
  if (extras.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border)' }}>
      {extras.map((r, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', borderRadius: 4, padding: '2px 6px' }}>
          {r.kind === 'iconEmbed' ? <><GameIcon id={r.iconId ?? ''} size={14} /> {r.iconLabel}</> : <>🔗 {r.linkLabel}</>}
        </span>
      ))}
    </div>
  );
}

function blockKindLabel(kind: BlockKind): string {
  switch (kind) {
    case 'heading1': return 'H1 見出し';
    case 'heading2': return 'H2 中見出し';
    case 'heading3': return 'H3 小見出し';
    case 'paragraph': return '本文';
    case 'bulletList': return '箇条書き';
    case 'orderedList': return '番号付きリスト';
    case 'quote': return '引用';
    case 'divider': return '区切り線';
    default: return '';
  }
}

function placeholderFor(kind: BlockKind): string {
  if (kind === 'heading1') return '大見出しを入力';
  if (kind === 'heading2') return '中見出しを入力';
  if (kind === 'heading3') return '小見出しを入力';
  if (kind === 'quote') return '引用文を入力';
  return '本文を入力';
}

function previewBold(runs?: InlineRun[]): boolean {
  return !!runs?.some(r => r.kind === 'text' && r.marks?.bold);
}
function previewItalic(runs?: InlineRun[]): boolean {
  return !!runs?.some(r => r.kind === 'text' && r.marks?.italic);
}
function previewColor(runs?: InlineRun[]): string | undefined {
  return runs?.find(r => r.kind === 'text' && r.marks?.color)?.marks?.color;
}
