// src/components/admin/PlayerEditor.tsx
import React, { useState, useEffect } from 'react';
import { updatePlayerAdmin, addAdminLog, savePlayerSnapshot, AdminPlayerData } from '../../services/multiplayer';

type EditorTab = 'basic' | 'stats' | 'currency' | 'other';

const BASIC_KEYS = ['displayName', 'name', 'level', 'uid', 'id'];
const STATS_KEY_HINTS = ['hp', 'maxHp', 'mp', 'maxMp', 'exp', 'expToNextLevel', 'satiety', 'maxSatiety', 'atk', 'def', 'level'];
const CURRENCY_KEY_HINTS = ['gold', 'jewel', 'coin', 'wagered', 'price', 'asset', 'cash'];

function classifyKey(key: string): EditorTab {
  const lower = key.toLowerCase();
  if (BASIC_KEYS.includes(key)) return 'basic';
  if (CURRENCY_KEY_HINTS.some(h => lower.includes(h))) return 'currency';
  if (key === 'stats' || STATS_KEY_HINTS.some(h => lower.includes(h))) return 'stats';
  return 'other';
}

interface FieldEditorProps {
  path: string[];
  value: unknown;
  onChange: (path: string[], value: unknown) => void;
}

function FieldEditor({ path, value, onChange }: FieldEditorProps) {
  const key = path[path.length - 1];

  if (typeof value === 'number') {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 3 }}>{key}</div>
        <input
          type="number"
          value={value}
          onChange={e => onChange(path, Number(e.target.value))}
          style={{ width: '100%', padding: '6px 8px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.82rem', boxSizing: 'border-box' }}
        />
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={value}
          onChange={e => onChange(path, e.target.checked)}
          style={{ width: 16, height: 16 }}
        />
        <span style={{ fontSize: '0.78rem', color: '#e8e6ff' }}>{key}</span>
      </div>
    );
  }

  if (typeof value === 'string') {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 3 }}>{key}</div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(path, e.target.value)}
          style={{ width: '100%', padding: '6px 8px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.82rem', boxSizing: 'border-box' }}
        />
      </div>
    );
  }

  if (Array.isArray(value)) {
    // 配列：プリミティブのみリストUIで編集可能。オブジェクト配列は簡易表示のみ
    const isPrimitiveArray = value.every(v => typeof v === 'string' || typeof v === 'number');
    if (!isPrimitiveArray) {
      return (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 3 }}>{key}（{value.length}件・複雑な配列のため簡易表示）</div>
          <div style={{ fontSize: '0.7rem', color: '#4a5070', padding: '6px 8px', background: '#161b26', borderRadius: 6, maxHeight: 80, overflowY: 'auto' }}>
            {value.length === 0 ? '（空）' : `${value.length} 件の項目`}
          </div>
        </div>
      );
    }
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 3 }}>{key}（{value.length}件）</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
          {value.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 4 }}>
              <input
                type={typeof item === 'number' ? 'number' : 'text'}
                value={item as string | number}
                onChange={e => {
                  const newArr = [...value];
                  newArr[i] = typeof item === 'number' ? Number(e.target.value) : e.target.value;
                  onChange(path, newArr);
                }}
                style={{ flex: 1, padding: '4px 6px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 4, fontSize: '0.75rem' }}
              />
              <button
                onClick={() => {
                  const newArr = value.filter((_, idx) => idx !== i);
                  onChange(path, newArr);
                }}
                style={{ padding: '4px 8px', background: 'rgba(224,85,85,0.2)', color: '#e05555', border: '1px solid #e05555', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}
              >
                削除
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => onChange(path, [...value, typeof value[0] === 'number' ? 0 : ''])}
          style={{ marginTop: 4, padding: '4px 10px', background: 'rgba(76,175,135,0.2)', color: '#4caf87', border: '1px solid #4caf87', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}
        >
          ＋追加
        </button>
      </div>
    );
  }

  if (value === null || value === undefined) {
    return (
      <div style={{ marginBottom: 8, fontSize: '0.72rem', color: '#4a5070' }}>
        {key}: (null)
      </div>
    );
  }

  if (typeof value === 'object') {
    // オブジェクト：再帰展開（statsなど浅い構造を想定）
    return (
      <div style={{ marginBottom: 8, borderLeft: '2px solid #2d3752', paddingLeft: 10 }}>
        <div style={{ fontSize: '0.78rem', color: '#f0c060', fontWeight: 700, marginBottom: 6 }}>{key}</div>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <FieldEditor key={k} path={[...path, k]} value={v} onChange={onChange} />
        ))}
      </div>
    );
  }

  return null;
}

interface PlayerEditorProps {
  player: AdminPlayerData;
  adminId: string;
  onUpdated: (uid: string, updates: Record<string, unknown>) => void;
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function PlayerEditor({ player, adminId, onUpdated, addNotification }: PlayerEditorProps) {
  const [tab, setTab] = useState<EditorTab>('basic');
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({ ...player });
    setChanged(new Set());
    setTab('basic');
  }, [player.id]);

  const handleChange = (path: string[], value: unknown) => {
    setDraft(prev => {
      const next = { ...prev };
      if (path.length === 1) {
        (next as Record<string, unknown>)[path[0]] = value;
      } else {
        const top = { ...((next[path[0]] as Record<string, unknown>) ?? {}) };
        let cur: Record<string, unknown> = top;
        for (let i = 1; i < path.length - 1; i++) {
          cur[path[i]] = { ...((cur[path[i]] as Record<string, unknown>) ?? {}) };
          cur = cur[path[i]] as Record<string, unknown>;
        }
        cur[path[path.length - 1]] = value;
        next[path[0]] = top;
      }
      return next;
    });
    setChanged(prev => new Set(prev).add(path[0]));
  };

  const handleSave = async () => {
    if (changed.size === 0) {
      addNotification('info', '変更はありません');
      return;
    }
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      changed.forEach(k => { updates[k] = draft[k]; });
      await updatePlayerAdmin(player.id, updates);
      await addAdminLog({ adminId, targetId: player.id, action: 'editPlayerFull', value: Object.keys(updates) });
      onUpdated(player.id, updates);
      setChanged(new Set());
      addNotification('success', `${player.displayName ?? player.id} のデータを更新しました`);
    } catch (e: any) {
      addNotification('error', `保存に失敗: ${e?.message ?? e}`);
    }
    setSaving(false);
  };

  const handleSnapshot = async () => {
    setSaving(true);
    try {
      await savePlayerSnapshot(player.id, player as unknown as Record<string, unknown>, adminId);
      addNotification('success', 'スナップショットを保存しました（履歴タブから復元可能）');
    } catch (e: any) {
      addNotification('error', `スナップショット保存失敗: ${e?.message ?? e}`);
    }
    setSaving(false);
  };

  const entries = Object.entries(draft).filter(([k]) => k !== 'id');
  const grouped: Record<EditorTab, [string, unknown][]> = { basic: [], stats: [], currency: [], other: [] };
  entries.forEach(([k, v]) => grouped[classifyKey(k)].push([k, v]));

  const TABS: { id: EditorTab; label: string }[] = [
    { id: 'basic', label: '基本情報' },
    { id: 'stats', label: 'ステータス' },
    { id: 'currency', label: '通貨' },
    { id: 'other', label: 'その他' },
  ];

  return (
    <div style={{ background: '#1c2235', border: '2px solid #5b8dee', borderRadius: 10, padding: 14 }}>
      <h3 style={{ color: '#5b8dee', marginBottom: 10, fontSize: '0.95rem' }}>
        🛠 {player.displayName ?? '名無し'} - 完全編集モード
      </h3>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '5px 10px',
              background: tab === t.id ? 'rgba(91,141,238,0.25)' : '#161b26',
              border: `1px solid ${tab === t.id ? '#5b8dee' : '#2d3752'}`,
              color: tab === t.id ? '#e8e6ff' : '#8a92b2',
              borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem',
            }}
          >
            {t.label} ({grouped[t.id].length})
          </button>
        ))}
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 10, paddingRight: 4 }}>
        {grouped[tab].length === 0 && (
          <div style={{ color: '#4a5070', fontSize: '0.78rem', textAlign: 'center', padding: 12 }}>項目なし</div>
        )}
        {grouped[tab].map(([k, v]) => (
          <FieldEditor key={k} path={[k]} value={v} onChange={handleChange} />
        ))}
      </div>

      {changed.size > 0 && (
        <div style={{ fontSize: '0.72rem', color: '#f0c060', marginBottom: 6 }}>
          変更フィールド: {Array.from(changed).join(', ')}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleSave}
          disabled={saving || changed.size === 0}
          style={{
            flex: 1, padding: '8px',
            background: changed.size > 0 ? '#5b8dee' : '#2d3752',
            color: changed.size > 0 ? '#fff' : '#4a5070',
            border: 'none', borderRadius: 6,
            cursor: changed.size > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 700, fontSize: '0.82rem',
          }}
        >
          {saving ? '保存中...' : `💾 変更を保存 (${changed.size})`}
        </button>
        <button
          onClick={handleSnapshot}
          disabled={saving}
          style={{ padding: '8px 12px', background: 'rgba(240,168,48,0.2)', color: '#f0a830', border: '1px solid #f0a830', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
        >
          📸 スナップショット保存
        </button>
      </div>
    </div>
  );
}
