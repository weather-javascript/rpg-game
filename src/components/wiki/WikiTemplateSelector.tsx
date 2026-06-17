// src/components/wiki/WikiTemplateSelector.tsx
// 新規ページ作成時にテンプレートを選ぶ画面。

import { WIKI_TEMPLATES } from './wikiTemplates';
import type { WikiTemplateId } from '../../types/wiki';

interface WikiTemplateSelectorProps {
  onSelect: (templateId: WikiTemplateId) => void;
  onCancel: () => void;
}

export function WikiTemplateSelector({ onSelect, onCancel }: WikiTemplateSelectorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-gold)' }}>テンプレートを選択</span>
        <button onClick={onCancel} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'transparent' }}>キャンセル</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {WIKI_TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{ textAlign: 'left', padding: 12, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <span style={{ fontSize: '1.4rem' }}>{t.emoji}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.label}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
