// src/components/wiki/wikiOutline.ts
// 本文の heading1/2/3 ブロックから目次（TOC）を自動生成するユーティリティ。

import type { ContentBlock } from '../../types/wiki';

export interface OutlineEntry {
  blockId: string;
  level: 1 | 2 | 3;
  text: string;
}

export function buildOutline(blocks: ContentBlock[]): OutlineEntry[] {
  const entries: OutlineEntry[] = [];
  for (const b of blocks) {
    if (b.kind === 'heading1' || b.kind === 'heading2' || b.kind === 'heading3') {
      const level = b.kind === 'heading1' ? 1 : b.kind === 'heading2' ? 2 : 3;
      const text = (b.runs ?? []).filter(r => r.kind === 'text').map(r => r.text ?? '').join('').trim();
      if (text.length > 0) entries.push({ blockId: b.id, level, text });
    }
  }
  return entries;
}
