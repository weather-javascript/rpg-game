// src/components/screens/AdminScreen.tsx
import { useState, useEffect } from 'react';
import { getAllPlayersAdmin, updatePlayerAdmin, getGambleMultipliers, setGambleMultipliers } from '../../services/multiplayer';
import { ITEM_MASTER, GAMBLE_MASTER } from '../../data/masters';
import { useGameStore } from '../../stores/gameStore';

export function AdminScreen() {
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const addNotification = useGameStore(s => s.addNotification);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [editGold, setEditGold] = useState('');
  const [editName, setEditName] = useState('');
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  const [subTab, setSubTab] = useState<'players'|'gamble'>('players');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const ps = await getAllPlayersAdmin();
        setPlayers(ps);
        const m = await getGambleMultipliers();
        setMultipliers(m);
      } catch { addNotification('error', 'データ取得に失敗しました'); }
      setLoading(false);
    })();
  }, []);

  const handleSelectPlayer = (p: any) => {
    setSelectedPlayer(p);
    setEditGold(String(p.gold ?? 0));
    setEditName(p.displayName ?? '');
  };

  const handleSavePlayer = async () => {
    if (!selectedPlayer) return;
    setSaving(true);
    try {
      await updatePlayerAdmin(selectedPlayer.id, { gold: Number(editGold), displayName: editName });
      setPlayers(prev => prev.map(p => p.id === selectedPlayer.id ? { ...p, gold: Number(editGold), displayName: editName } : p));
      addNotification('success', `${editName} のデータを更新しました`);
    } catch { addNotification('error', '更新に失敗しました'); }
    setSaving(false);
  };

  const handleSaveMultipliers = async () => {
    setSaving(true);
    try {
      await setGambleMultipliers(multipliers);
      addNotification('success', 'ギャンブル倍率を更新しました（全プレイヤーに反映）');
    } catch { addNotification('error', '更新に失敗しました'); }
    setSaving(false);
  };

  return (
    <div style={{padding:'12px 8px 80px'}}>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, borderBottom:'1px solid #e05555', paddingBottom:8}}>
        <h2 style={{fontFamily:'Cinzel,serif', color:'#e05555', margin:0, flex:1}}>🔐 管理者パネル</h2>
        <button onClick={() => setActiveTab('status')} style={{padding:'4px 10px', background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.8rem'}}>← 戻る</button>
      </div>

      <div style={{display:'flex', gap:6, marginBottom:12}}>
        {(['players','gamble'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            style={{flex:1, padding:'8px', background: subTab===t ? 'rgba(224,85,85,0.2)' : '#1c2235', border:`1px solid ${subTab===t ? '#e05555' : '#2d3752'}`, color: subTab===t ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer', fontSize:'0.82rem'}}>
            {t==='players' ? '👥 プレイヤー管理' : '🎰 ギャンブル設定'}
          </button>
        ))}
      </div>

      {subTab === 'players' && (
        <div>
          {loading ? <div style={{textAlign:'center', color:'#8a92b2', padding:20}}>読み込み中...</div> : (
            <div style={{display:'flex', flexDirection:'column', gap:4, marginBottom:16}}>
              {players.map(p => (
                <button key={p.id} onClick={() => handleSelectPlayer(p)}
                  style={{display:'flex', justifyContent:'space-between', padding:'8px 12px', background: selectedPlayer?.id === p.id ? 'rgba(91,141,238,0.2)' : '#1c2235', border:`1px solid ${selectedPlayer?.id === p.id ? '#5b8dee' : '#2d3752'}`, borderRadius:6, cursor:'pointer', color:'#e8e6ff', fontSize:'0.85rem'}}>
                  <span>⚔️ {p.displayName ?? '名無し'} (Lv.{p.stats?.level ?? 1})</span>
                  <span style={{color:'#f0c060'}}>💰 {(p.gold ?? 0).toLocaleString()}G</span>
                </button>
              ))}
            </div>
          )}

          {selectedPlayer && (
            <div style={{background:'#1c2235', border:'2px solid #5b8dee', borderRadius:10, padding:14}}>
              <h3 style={{color:'#5b8dee', marginBottom:12, fontSize:'0.95rem'}}>✏️ {selectedPlayer.displayName} を編集</h3>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:4}}>表示名</div>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={{width:'100%', padding:'7px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem', boxSizing:'border-box'}} />
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:4}}>所持金 (G)</div>
                <input type="number" value={editGold} onChange={e => setEditGold(e.target.value)} style={{width:'100%', padding:'7px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem', boxSizing:'border-box'}} />
              </div>
              <div style={{marginBottom:12, fontSize:'0.78rem', color:'#8a92b2'}}>
                <div>HP: {selectedPlayer.stats?.hp ?? 0}/{selectedPlayer.stats?.maxHp ?? 100} | Satiety: {selectedPlayer.stats?.satiety ?? 0}</div>
                <div>所持アイテム数: {Object.keys(selectedPlayer.inventory ?? {}).length}種</div>
              </div>
              <button onClick={handleSavePlayer} disabled={saving}
                style={{width:'100%', padding:'8px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem'}}>
                {saving ? '保存中...' : '💾 保存'}
              </button>
            </div>
          )}
        </div>
      )}

      {subTab === 'gamble' && (
        <div>
          <p style={{fontSize:'0.8rem', color:'#8a92b2', marginBottom:12}}>
            各ギャンブルの倍率ボーナスを設定します（1.0 = 通常、2.0 = 2倍）。全プレイヤーに反映されます。
          </p>
          {Object.values(GAMBLE_MASTER).map(g => (
            <div key={g.id} style={{display:'flex', alignItems:'center', gap:10, marginBottom:8, padding:'8px 10px', background:'#1c2235', border:'1px solid #2d3752', borderRadius:6}}>
              <span style={{fontSize:'1.2rem'}}>{g.icon}</span>
              <span style={{flex:1, fontSize:'0.85rem'}}>{g.name}</span>
              <input
                type="number" step="0.1" min="0.1" max="10"
                value={multipliers[g.id] ?? 1.0}
                onChange={e => setMultipliers(prev => ({ ...prev, [g.id]: Number(e.target.value) }))}
                style={{width:70, padding:'4px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.85rem'}}
              />
              <span style={{fontSize:'0.75rem', color:'#8a92b2'}}>倍</span>
            </div>
          ))}
          <button onClick={handleSaveMultipliers} disabled={saving}
            style={{width:'100%', padding:'10px', background:'linear-gradient(135deg,#e05555,#c03030)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.9rem', marginTop:8}}>
            {saving ? '更新中...' : '🎰 全プレイヤーに反映する'}
          </button>
        </div>
      )}
    </div>
  );
}
