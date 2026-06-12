// src/components/admin/AdminLogs.tsx
import { useState, useEffect, useMemo } from 'react';
import { subscribeAdminLogs, AdminLogEntry } from '../../services/multiplayer';

export function AdminLogs() {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [filterTarget, setFilterTarget] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const unsub = subscribeAdminLogs(setLogs);
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    let arr = logs;
    if (filterTarget) arr = arr.filter(l => l.targetId.includes(filterTarget) || l.adminId.includes(filterTarget));
    arr = [...arr].sort((a, b) => sortAsc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt);
    return arr;
  }, [logs, filterTarget, sortAsc]);

  return (
    <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
      <h3 style={{ color: '#5b8dee', marginBottom: 10, fontSize: '0.95rem' }}>📜 管理操作ログ</h3>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input
          value={filterTarget}
          onChange={e => setFilterTarget(e.target.value)}
          placeholder="プレイヤーID・管理者IDで絞り込み..."
          style={{ flex: 1, padding: '6px 8px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.78rem', boxSizing: 'border-box' }}
        />
        <button
          onClick={() => setSortAsc(s => !s)}
          style={{ padding: '6px 10px', background: '#161b26', border: '1px solid #2d3752', color: '#8a92b2', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
        >
          {sortAsc ? '古い順' : '新しい順'} ⇅
        </button>
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.length === 0 && (
          <div style={{ color: '#4a5070', textAlign: 'center', padding: 16, fontSize: '0.85rem' }}>ログがありません</div>
        )}
        {filtered.map(log => (
          <div key={log.id} style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 6, padding: '6px 10px', fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8a92b2', marginBottom: 2 }}>
              <span>{new Date(log.createdAt).toLocaleString('ja-JP')}</span>
              <span style={{ color: '#f0c060' }}>{log.action}</span>
            </div>
            <div style={{ color: '#e8e6ff' }}>
              対象: {log.targetId} / 実行者: {log.adminId}
            </div>
            <div style={{ color: '#5b8dee', wordBreak: 'break-all' }}>
              値: {typeof log.value === 'object' ? JSON.stringify(log.value) : String(log.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
