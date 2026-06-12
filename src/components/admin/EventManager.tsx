// src/components/admin/EventManager.tsx
import React, { useState, useEffect } from 'react';
import { getGameSettings, setGameSettings, GameSettings } from '../../services/multiplayer';

const DEFAULT_SETTINGS: GameSettings = {
  goldMultiplier: 1.0,
  gachaRateUp: false,
  startAt: 0,
  endAt: 0,
};

function toDateTimeLocal(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(s: string): number {
  if (!s) return 0;
  return new Date(s).getTime();
}

interface EventManagerProps {
  adminId: string;
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function EventManager({ adminId, addNotification }: EventManagerProps) {
  const [settings, setSettingsState] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getGameSettings()
      .then(s => { if (s) setSettingsState(s); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setGameSettings(settings, adminId);
      addNotification('success', 'イベント設定を更新しました');
    } catch (e: any) {
      addNotification('error', `保存失敗: ${e?.message ?? e}`);
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ color: '#8a92b2', textAlign: 'center', padding: 20 }}>読み込み中...</div>;
  }

  const active = settings.startAt > 0 && settings.endAt > 0 && Date.now() >= settings.startAt && Date.now() <= settings.endAt;

  return (
    <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
      <h3 style={{ color: '#5b8dee', marginBottom: 4, fontSize: '0.95rem' }}>🎉 イベント管理</h3>
      <div style={{ fontSize: '0.72rem', color: active ? '#4caf87' : '#8a92b2', marginBottom: 12 }}>
        現在ステータス: {active ? '🟢 イベント開催中' : '⚪ 通常運営'}
      </div>

      {/* ゴールド倍率 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 4 }}>ゴールド獲得倍率</div>
        <input
          type="number" step="0.1" min="0"
          value={settings.goldMultiplier}
          onChange={e => setSettingsState(s => ({ ...s, goldMultiplier: Number(e.target.value) }))}
          style={{ width: 120, padding: '6px 8px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem' }}
        />
        <span style={{ marginLeft: 8, color: '#4a5070', fontSize: '0.75rem' }}>（1.0 = 通常）</span>
      </div>

      {/* ガチャ確率UP */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={settings.gachaRateUp}
          onChange={e => setSettingsState(s => ({ ...s, gachaRateUp: e.target.checked }))}
          style={{ width: 16, height: 16 }}
        />
        <span style={{ fontSize: '0.82rem', color: '#e8e6ff' }}>ガチャ確率UPイベント ON/OFF</span>
      </div>

      {/* 開始・終了日時 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 4 }}>開始日時</div>
          <input
            type="datetime-local"
            value={toDateTimeLocal(settings.startAt)}
            onChange={e => setSettingsState(s => ({ ...s, startAt: fromDateTimeLocal(e.target.value) }))}
            style={{ width: '100%', padding: '6px 8px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.78rem', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 4 }}>終了日時</div>
          <input
            type="datetime-local"
            value={toDateTimeLocal(settings.endAt)}
            onChange={e => setSettingsState(s => ({ ...s, endAt: fromDateTimeLocal(e.target.value) }))}
            style={{ width: '100%', padding: '6px 8px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.78rem', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#5b8dee,#3a5fc0)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
      >
        {saving ? '保存中...' : '💾 イベント設定を保存'}
      </button>
    </div>
  );
}
