// src/components/admin/AnalyticsPanel.tsx
import React, { useState } from 'react';
import { refreshAnalyticsSummary, AnalyticsSummary, AdminPlayerData } from '../../services/multiplayer';

interface AnalyticsPanelProps {
  players: AdminPlayerData[];
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function AnalyticsPanel({ players, addNotification }: AnalyticsPanelProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const s = await refreshAnalyticsSummary(players);
      setSummary(s);
      addNotification('success', '分析データを更新しました');
    } catch (e: any) {
      addNotification('error', `更新失敗: ${e?.message ?? e}`);
    }
    setRefreshing(false);
  };

  const totalGold = summary?.totalGold ?? players.reduce((s, p) => s + (p.gold ?? 0), 0);
  const playerCount = summary?.playerCount ?? players.length;
  const avgLevel = summary?.avgLevel ?? (players.length > 0 ? Math.round(players.reduce((s, p) => s + (p.stats?.level ?? 1), 0) / players.length) : 0);

  const CardStyle: React.CSSProperties = {
    flex: 1, background: '#161b26', border: '1px solid #2d3752', borderRadius: 8, padding: 14, textAlign: 'center',
  };

  return (
    <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ color: '#5b8dee', fontSize: '0.95rem', margin: 0 }}>📊 分析ダッシュボード</h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ padding: '5px 12px', background: 'rgba(91,141,238,0.2)', color: '#5b8dee', border: '1px solid #5b8dee', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}
        >
          {refreshing ? '更新中...' : '🔄 更新して保存'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={CardStyle}>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 6 }}>総ゴールド</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f0c060' }}>{totalGold.toLocaleString()}G</div>
        </div>
        <div style={CardStyle}>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 6 }}>プレイヤー数</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#5b8dee' }}>{playerCount.toLocaleString()}</div>
        </div>
        <div style={CardStyle}>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 6 }}>平均レベル</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4caf87' }}>{avgLevel}</div>
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', color: '#4a5070', marginTop: 10 }}>
        ※「更新して保存」を押すと現在の players コレクションから集計し /analytics/summary に保存します
      </div>
    </div>
  );
}
