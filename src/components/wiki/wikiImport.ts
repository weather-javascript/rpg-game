// src/components/wiki/wikiImport.ts
// .wikimd（独自拡張子）ファイルをパースして WikiPageInput に変換するユーティリティ。
// .wikimd の書式:
//   ---
//   title: ページタイトル
//   category: dungeon
//   tags: タグ1,タグ2
//   summary: 概要テキスト
//   ---
//   # 見出し1
//   ## 見出し2
//   ### 見出し3
//   通常テキスト（段落）
//   - 箇条書き項目
//   1. 番号付きリスト
//   > 引用テキスト
//   ---（区切り線）

import type { ContentBlock, WikiCategory, WikiPageInput, InlineRun } from '../../types/wiki';

let _importSeq = 0;
function ibid(): string { _importSeq += 1; return `imp_${Date.now().toString(36)}_${_importSeq}`; }

const VALID_CATEGORIES: WikiCategory[] = [
  'item', 'weapon', 'armor', 'material', 'dungeon',
  'beginner_guide', 'glossary', 'faq', 'collection', 'strategy_chart', 'other',
];

function parseInline(text: string): InlineRun[] {
  // **bold** と *italic* をサポート
  const runs: InlineRun[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push({ kind: 'text', text: text.slice(last, m.index) });
    if (m[2]) runs.push({ kind: 'text', text: m[2], marks: { bold: true } });
    else if (m[3]) runs.push({ kind: 'text', text: m[3], marks: { italic: true } });
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push({ kind: 'text', text: text.slice(last) });
  return runs.length > 0 ? runs : [{ kind: 'text', text }];
}

interface ParsedFrontMatter {
  title: string;
  category: WikiCategory;
  tags: string[];
  summary: string;
}

function parseFrontMatter(raw: string): { fm: ParsedFrontMatter; body: string } {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const fm: ParsedFrontMatter = { title: '', category: 'other', tags: [], summary: '' };
  let body = raw;

  if (fmMatch) {
    const fmLines = fmMatch[1].split(/\r?\n/);
    body = fmMatch[2];
    for (const line of fmLines) {
      const sep = line.indexOf(':');
      if (sep === -1) continue;
      const key = line.slice(0, sep).trim();
      const val = line.slice(sep + 1).trim();
      if (key === 'title') fm.title = val;
      else if (key === 'category') {
        fm.category = (VALID_CATEGORIES.includes(val as WikiCategory) ? val : 'other') as WikiCategory;
      }
      else if (key === 'tags') fm.tags = val.split(',').map(t => t.trim()).filter(Boolean);
      else if (key === 'summary') fm.summary = val;
    }
  }

  return { fm, body };
}

function parseBody(body: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = body.split(/\r?\n/);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // 区切り線
    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ id: ibid(), kind: 'divider' });
      i++;
      continue;
    }

    // 見出し1
    if (trimmed.startsWith('# ')) {
      blocks.push({ id: ibid(), kind: 'heading1', runs: parseInline(trimmed.slice(2)) });
      i++; continue;
    }
    // 見出し2
    if (trimmed.startsWith('## ')) {
      blocks.push({ id: ibid(), kind: 'heading2', runs: parseInline(trimmed.slice(3)) });
      i++; continue;
    }
    // 見出し3
    if (trimmed.startsWith('### ')) {
      blocks.push({ id: ibid(), kind: 'heading3', runs: parseInline(trimmed.slice(4)) });
      i++; continue;
    }

    // 箇条書き（- または * で始まる行をまとめる）
    if (/^[-*]\s/.test(trimmed)) {
      const items: InlineRun[][] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(/^[-*]\s/, '')));
        i++;
      }
      blocks.push({ id: ibid(), kind: 'bulletList', items });
      continue;
    }

    // 番号付きリスト
    if (/^\d+\.\s/.test(trimmed)) {
      const items: InlineRun[][] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(/^\d+\.\s/, '')));
        i++;
      }
      blocks.push({ id: ibid(), kind: 'orderedList', items });
      continue;
    }

    // 引用
    if (trimmed.startsWith('> ')) {
      blocks.push({ id: ibid(), kind: 'quote', runs: parseInline(trimmed.slice(2)) });
      i++; continue;
    }

    // 段落（連続する非空行をまとめる）
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3}\s/.test(lines[i].trim()) &&
      !/^[-*]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !/^-{3,}$/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('> ')
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ id: ibid(), kind: 'paragraph', runs: parseInline(paraLines.join(' ')) });
    }
  }

  return blocks;
}

export type WikiImportResult =
  | { ok: true; page: WikiPageInput }
  | { ok: false; error: string };

export function parseWikimdFile(text: string): WikiImportResult {
  try {
    const { fm, body } = parseFrontMatter(text);
    const contentBlocks = parseBody(body);

    if (!fm.title) {
      // タイトルが無い場合はファイル内の最初の見出し1を使用
      const h1 = contentBlocks.find(b => b.kind === 'heading1');
      if (h1?.runs) {
        fm.title = h1.runs.map(r => r.text ?? '').join('');
      }
    }

    if (!fm.title) {
      return { ok: false, error: 'タイトルが見つかりません。フロントマター（---区切り）またはページ内に # 見出し1 を追加してください。' };
    }

    const page: WikiPageInput = {
      slug: fm.title.trim().toLowerCase().replace(/[\s　]+/g, '-').replace(/[^\w\u3040-\u30ff\u3400-\u9fff\-]/g, '').slice(0, 80) || `page-${Date.now()}`,
      title: fm.title.trim().slice(0, 60),
      category: fm.category,
      tags: fm.tags.slice(0, 10).map(t => t.slice(0, 20)),
      summary: fm.summary.slice(0, 200),
      contentBlocks,
    };

    return { ok: true, page };
  } catch (e) {
    return { ok: false, error: `パース中にエラーが発生しました: ${String(e)}` };
  }
}

// テキストファイル（.txt）のシンプルなインポート：タイトルを1行目から取得しあとは段落として扱う
export function parseTxtFile(text: string, filename: string): WikiImportResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) {
    return { ok: false, error: 'ファイルが空です。' };
  }

  // ファイル名からタイトルを生成（拡張子を除く）
  const titleFromFile = filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').trim();
  const firstLine = lines[0].trim();
  const title = firstLine.startsWith('#') ? firstLine.replace(/^#+\s*/, '') : (titleFromFile || firstLine.slice(0, 60));

  const bodyLines = firstLine.startsWith('#') ? lines.slice(1) : lines;
  const contentBlocks: ContentBlock[] = bodyLines
    .filter(l => l.trim())
    .map(l => ({ id: ibid(), kind: 'paragraph' as const, runs: parseInline(l.trim()) }));

  const page: WikiPageInput = {
    slug: title.toLowerCase().replace(/[\s　]+/g, '-').replace(/[^\w\u3040-\u30ff\u3400-\u9fff\-]/g, '').slice(0, 80) || `page-${Date.now()}`,
    title: title.slice(0, 60),
    category: 'other',
    tags: [],
    summary: '',
    contentBlocks,
  };

  return { ok: true, page };
}

// ファイル拡張子を判定してパーサーを振り分ける
export function parseWikiFile(text: string, filename: string): WikiImportResult {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.wikimd')) return parseWikimdFile(text);
  if (lower.endsWith('.txt')) return parseTxtFile(text, filename);
  if (lower.endsWith('.md')) return parseWikimdFile(text); // Markdownも同じパーサーで対応
  return { ok: false, error: `非対応のファイル形式です。.wikimd / .txt / .md のいずれかを使用してください。` };
}
