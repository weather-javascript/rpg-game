// src/components/wiki/WikiBlockRenderer.tsx
// ContentBlock[] を実際の見た目に変換するレンダラー。
// dangerouslySetInnerHTML を使わず、structured データのみから安全に描画する。

import { GameIcon } from '../icons';
import type { ContentBlock, InlineRun } from '../../types/wiki';

interface RendererProps {
  blocks: ContentBlock[];
  onNavigateToPage: (pageIdOrTitle: string, isId: boolean) => void;
}

function RunView({ run, onNavigateToPage }: { run: InlineRun; onNavigateToPage: RendererProps['onNavigateToPage'] }) {
  if (run.kind === 'iconEmbed') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, verticalAlign: 'middle' }}>
        <GameIcon id={run.iconId ?? ''} size={20} />
        {run.iconLabel ? <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{run.iconLabel}</span> : null}
      </span>
    );
  }
  if (run.kind === 'internalLink') {
    const hasTarget = !!run.linkPageId;
    return (
      <span
        onClick={() => onNavigateToPage(run.linkPageId || run.linkLabel || '', hasTarget)}
        style={{
          color: hasTarget ? 'var(--accent-blue)' : '#e0a35c',
          textDecoration: 'underline',
          textDecorationStyle: hasTarget ? 'solid' : 'dashed',
          cursor: 'pointer',
        }}
        title={hasTarget ? 'クリックでページへ移動' : '未作成ページ（クリックで作成）'}
      >
        {run.linkLabel || run.linkPageId}
        {!hasTarget && <span style={{ fontSize: '0.65rem', marginLeft: 3 }}>（未作成）</span>}
      </span>
    );
  }
  const marks = run.marks ?? {};
  return (
    <span
      style={{
        fontWeight: marks.bold ? 700 : undefined,
        fontStyle: marks.italic ? 'italic' : undefined,
        color: marks.color || undefined,
        whiteSpace: 'pre-wrap',
      }}
    >
      {run.text ?? ''}
    </span>
  );
}

function RunsLine({ runs, onNavigateToPage }: { runs: InlineRun[]; onNavigateToPage: RendererProps['onNavigateToPage'] }) {
  if (!runs || runs.length === 0) return <span style={{ color: 'var(--text-muted)' }}>　</span>;
  return (
    <>
      {runs.map((r, i) => <RunView key={i} run={r} onNavigateToPage={onNavigateToPage} />)}
    </>
  );
}

export function WikiBlockRenderer({ blocks, onNavigateToPage }: RendererProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {blocks.map((block) => {
        switch (block.kind) {
          case 'heading1':
            return (
              <h2 key={block.id} style={{ fontSize: '1.25rem', color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', borderBottom: '2px solid var(--border)', paddingBottom: 6, marginTop: 6 }}>
                <RunsLine runs={block.runs ?? []} onNavigateToPage={onNavigateToPage} />
              </h2>
            );
          case 'heading2':
            return (
              <h3 key={block.id} style={{ fontSize: '1.05rem', color: 'var(--accent-blue)', marginTop: 4, borderLeft: '3px solid var(--accent-blue)', paddingLeft: 8 }}>
                <RunsLine runs={block.runs ?? []} onNavigateToPage={onNavigateToPage} />
              </h3>
            );
          case 'heading3':
            return (
              <h4 key={block.id} style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                <RunsLine runs={block.runs ?? []} onNavigateToPage={onNavigateToPage} />
              </h4>
            );
          case 'paragraph':
            return (
              <p key={block.id} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                <RunsLine runs={block.runs ?? []} onNavigateToPage={onNavigateToPage} />
              </p>
            );
          case 'bulletList':
            return (
              <ul key={block.id} style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(block.items ?? []).map((runs, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    <RunsLine runs={runs} onNavigateToPage={onNavigateToPage} />
                  </li>
                ))}
              </ul>
            );
          case 'orderedList':
            return (
              <ol key={block.id} style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(block.items ?? []).map((runs, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    <RunsLine runs={runs} onNavigateToPage={onNavigateToPage} />
                  </li>
                ))}
              </ol>
            );
          case 'quote':
            return (
              <blockquote key={block.id} style={{ borderLeft: '3px solid var(--accent-purple)', paddingLeft: 12, color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', background: 'rgba(155,109,240,0.06)', borderRadius: 6, padding: '8px 12px' }}>
                <RunsLine runs={block.runs ?? []} onNavigateToPage={onNavigateToPage} />
              </blockquote>
            );
          case 'divider':
            return <hr key={block.id} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
