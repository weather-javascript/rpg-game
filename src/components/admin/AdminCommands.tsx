// src/components/admin/AdminCommands.tsx
import React, { useState } from 'react';
import { adminGiveGold, adminGiveItem, adminSetHp, adminTeleport, adminBanPlayer, AdminPlayerData } from '../../services/multiplayer';
import { ITEM_MASTER, DUNGEON_MASTER } from '../../data/masters';

interface AdminCommandsProps {
  player: AdminPlayerData;
  adminId: string;
  onUpdated: (uid: string, updates: Record<string, unknown>) => void;
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', background: '#161b26', border: '1px solid #2d3752',
  color: '#e8e6ff', borderRadius: 6, fontSize: '0.8rem', boxSizing: 'border-box',
};

const btnStyle = (color: string): React.CSSProperties => ({
  padding: '8px 12px', background: `rgba(${color},0.18)`, color: `rgb(${color})`,
  border: `1px solid rgb(${color})`, borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
});

export function AdminCommands({ player, adminId, onUpdated, addNotification }: AdminCommandsProps) {
  const [goldAmount, setGoldAmount] = useState('1000');
  const [itemId, setItemId] = useState('');
  const [itemAmount, setItemAmount] = useState('1');
  const [hpValue, setHpValue] = useState(String(player.stats?.hp ?? 100));
  const [dungeonId, setDungeonId] = useState('');
  const [floor, setFloor] = useState('1');
  const [confirmBan, setConfirmBan] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, successMsg: string) => {
    setBusy(true);
    try {
      await fn();
      addNotification('success', successMsg);
    } catch (e: any) {
      addNotification('error', `失敗: ${e?.message ?? e}`);
    }
    setBusy(false);
  };

  return (
    <div style={{ background: '#1c2235', border: '2px solid #f0a830', borderRadius: 10, padding: 14 }}>
      <h3 style={{ color: '#f0a830', marginBottom: 10, fontSize: '0.95rem' }}>
        ⚡ {player.displayName ?? '名無し'} - 強制コマンド
      </h3>

      {/* ゴールド付与 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 3 }}>ゴールド付与（負数で減算）</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input type="number" value={goldAmount} onChange={e => setGoldAmount(e.target.value)} style={inputStyle} />
          <button
            disabled={busy}
            onClick={() => run(async () => {
              const amt = Number(goldAmount);
              await adminGiveGold(player.id, amt, adminId);
              onUpdated(player.id, { gold: (player.gold ?? 0) + amt });
            }, `${goldAmount}G を付与しました`)}
            style={btnStyle('76,175,135')}
          >
            付与
          </button>
        </div>
      </div>

      {/* アイテム付与 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 3 }}>アイテム付与</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <select value={itemId} onChange={e => setItemId(e.target.value)} style={{ ...inputStyle, flex: 2 }}>
            <option value="">-- アイテム選択 --</option>
            {Object.values(ITEM_MASTER).map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <input type="number" min={1} value={itemAmount} onChange={e => setItemAmount(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <button
            disabled={busy || !itemId}
            onClick={() => run(async () => {
              await adminGiveItem(player.id, itemId, Number(itemAmount), adminId);
              const newInv = { ...(player.inventory ?? {}) };
              newInv[itemId] = (newInv[itemId] ?? 0) + Number(itemAmount);
              onUpdated(player.id, { inventory: newInv });
            }, `${ITEM_MASTER[itemId]?.name ?? itemId} ×${itemAmount} を付与しました`)}
            style={btnStyle('76,175,135')}
          >
            付与
          </button>
        </div>
      </div>

      {/* HP設定 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 3 }}>HP設定</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input type="number" min={0} value={hpValue} onChange={e => setHpValue(e.target.value)} style={inputStyle} />
          <button
            disabled={busy}
            onClick={() => run(async () => {
              const val = Number(hpValue);
              await adminSetHp(player.id, val, adminId);
              onUpdated(player.id, { stats: { ...(player.stats ?? {}), hp: val } });
            }, `HPを${hpValue}に設定しました`)}
            style={btnStyle('91,141,238')}
          >
            設定
          </button>
        </div>
      </div>

      {/* テレポート */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 3 }}>テレポート（ダンジョン・階層）</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <select value={dungeonId} onChange={e => setDungeonId(e.target.value)} style={{ ...inputStyle, flex: 2 }}>
            <option value="">-- ダンジョン選択 --</option>
            {Object.values(DUNGEON_MASTER).map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input type="number" min={1} value={floor} onChange={e => setFloor(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="階層" />
          <button
            disabled={busy || !dungeonId}
            onClick={() => run(async () => {
              await adminTeleport(player.id, dungeonId, Number(floor), adminId);
              onUpdated(player.id, { dungeonId, floor: Number(floor) });
            }, `${DUNGEON_MASTER[dungeonId]?.name ?? dungeonId} ${floor}階へ移動しました`)}
            style={btnStyle('91,141,238')}
          >
            移動
          </button>
        </div>
      </div>

      {/* BAN */}
      <div style={{ borderTop: '1px solid #2d3752', paddingTop: 10 }}>
        <button
          disabled={busy || player.banned}
          onClick={() => {
            if (!confirmBan) { setConfirmBan(true); return; }
            run(async () => {
              await adminBanPlayer(player.id, adminId);
              onUpdated(player.id, { banned: true });
              setConfirmBan(false);
            }, `${player.displayName ?? player.id} をBANしました`);
          }}
          style={{
            width: '100%', padding: '8px',
            background: player.banned ? 'rgba(76,175,135,0.15)' : confirmBan ? 'rgba(224,85,85,0.5)' : 'rgba(224,85,85,0.15)',
            color: player.banned ? '#4caf87' : '#e05555',
            border: `1px solid ${player.banned ? '#4caf87' : '#e05555'}`,
            borderRadius: 6, cursor: player.banned ? 'not-allowed' : 'pointer', fontSize: '0.82rem',
          }}
        >
          {player.banned ? '✅ 既にBAN済み' : confirmBan ? '⚠️ もう一度押すと確定します' : '🚫 BAN実行'}
        </button>
      </div>
    </div>
  );
}
