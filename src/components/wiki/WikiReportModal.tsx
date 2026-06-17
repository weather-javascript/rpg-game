// src/components/wiki/WikiReportModal.tsx
// 荒らし対策の通報導線。

import { useState } from 'react';
import { submitWikiReport } from '../../services/wikiService';
import type { WikiReportReason } from '../../types/wiki';

interface WikiReportModalProps {
  pageId: string;
  uid: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const REASONS: { id: WikiReportReason; label: string }[] = [
  { id: 'vandalism', label: '荒らし・破壊行為' },
  { id: 'spam', label: 'スパム' },
  { id: 'inappropriate', label: '不適切な内容' },
  { id: 'copyright', label: '著作権侵害' },
  { id: 'other', label: 'その他' },
];

export function WikiReportModal({ pageId, uid, onClose, onSubmitted }: WikiReportModalProps) {
  const [reason, setReason] = useState<WikiReportReason>('vandalism');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitWikiReport(pageId, uid, reason, comment);
      if (!result.success) { setError(result.error ?? '送信に失敗しました'); return; }
      onSubmitted();
    } catch (e) {
      console.error('[WikiReportModal] submit failed:', e);
      setError('送信中にエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 700, color: 'var(--accent-red)', fontSize: '0.9rem', marginBottom: 12 }}>🚩 このページを通報</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {REASONS.map(r => (
            <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
              <input type="radio" checked={reason === r.id} onChange={() => setReason(r.id)} />
              {r.label}
            </label>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="詳細（任意・500文字以内）"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text-primary)', fontSize: '0.78rem', marginBottom: 12, resize: 'vertical' }}
        />

        {error && <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)', marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>キャンセル</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #e05555, #c03f3f)', color: '#fff', fontWeight: 700, fontSize: '0.78rem', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? '送信中...' : '通報する'}
          </button>
        </div>
      </div>
    </div>
  );
}
