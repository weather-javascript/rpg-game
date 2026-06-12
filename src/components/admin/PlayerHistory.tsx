// src/components/admin/PlayerHistory.tsx
import React, { useState, useEffect } from 'react';
import { getPlayerSnapshots, restorePlayerSnapshot, PlayerSnapshot, AdminPlayerData } from '../../services/multiplayer';

interface PlayerHistoryProps {
  player: AdminPlayerData;
  adminId: string;
  onUpdated: (uid: string, updates: Record<string, unknown>) => void;
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function PlayerHistory({ player, adminId, onUpdated, addNotification }: PlayerHistoryProps) {
  const [snapshots, setSnapshots] = useState<PlayerSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getPlayerSnapshots(player.id)
      .then(setSnapshots)
      .catch(() => setSnapshots([]))
      .finally(() => setLoading(false));
  }, [player.id]);

  const handleRestore = async (snap: PlayerSnapshot) => {
    if (confirmRestore !== snap.id) {
      setConfirmRestore(snap.id);
      return;
    }
    setRestoring(snap.id);
    try {
      await restorePlayerSnapshot(player.id, snap, adminId);
      const { id, _snapshotAt, ...rest } = snap;
      void id; void _snapshotAt;
      onUpdated(player.id, rest);
      addNotification('success', `スナップショット（${new Date(snap._snapshotAt).toLocaleString('ja-JP')}）を復元しました`);
      setConfirmRestore(null);
    } catch (e: any) {
      addNotification('error', `復元失敗: ${e?.message ?? e}`);
    }
    setRestoring(null);
  };

  return (
    <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
      <h3 style={{ color: '#5b8dee', marginBottom: 10, fontSize: '0.95rem' }}>
        🕓 {player.displayName ?? '名無し'} - セーブデータ履歴
      </h3>
      {loading ? (
        <div style={{ color: '#8a92b2', textAlign: 'center', padding: 16, fontSize: '0.85rem' }}>読み込み中...</div>
      ) : snapshots.length === 0 ? (
        <div style={{ color: '#4a5070', textAlign: 'center', padding: 16, fontSize: '0.85rem' }}>
          履歴がありません（プレイヤー編集タブで「スナップショット保存」を実行してください）
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
          {snapshots.map(snap => (
            <div key={snap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161b26', border: '1px solid #2d3752', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: '0.78rem', color: '#e8e6ff' }}>
                <div>{new Date(snap._snapshotAt).toLocaleString('ja-JP')}</div>
                <div style={{ fontSize: '0.7rem', color: '#8a92b2' }}>
                  Lv.{(snap.stats as any)?.level ?? '?'} / 💰{(snap.gold as number ?? 0).toLocaleString()}G
                </div>
              </div>
              <button
                disabled={restoring === snap.id}
                onClick={() => handleRestore(snap)}
                style={{
                  padding: '6px 12px',
                  background: confirmRestore === snap.id ? 'rgba(224,85,85,0.4)' : 'rgba(91,141,238,0.2)',
                  color: confirmRestore === snap.id ? '#e05555' : '#5b8dee',
                  border: `1px solid ${confirmRestore === snap.id ? '#e05555' : '#5b8dee'}`,
                  borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap',
                }}
              >
                {restoring === snap.id ? '復元中...' : confirmRestore === snap.id ? '⚠️ 確定する' : '↩️ 復元'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
