// src/components/screens/AdminScreen.tsx
import { useState, useEffect } from 'react';
import {
  getAllPlayersAdmin, subscribeAllPlayersAdmin,
  updatePlayerAdmin, getGambleMultipliers, setGambleMultipliers,
} from '../../services/multiplayer';
import { GAMBLE_MASTER, DUNGEON_MASTER } from '../../data/masters';
import { useGameStore } from '../../stores/gameStore';

type SubTab = 'players' | 'gamble' | 'announce' | 'stats';

export function AdminScreen() {
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const addNotification = useGameStore(s => s.addNotification);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [editGold, setEditGold] = useState('');
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editHp, setEditHp] = useState('');
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  const [subTab, setSubTab] = useState<SubTab>('players');
  const [saving, setSaving] = useState(false);
  const [announceText, setAnnounceText] = useState('');
  const [playerFilter, setPlayerFilter] = useState('');
  const [confirmBan, setConfirmBan] = useState<string | null>(null);

  // リアルタイム購読でプレイヤー一覧を取得
  useEffect(() => {
    setLoading(true);
    setError(null);

    // まずgetAllPlayersAdminで初回取得を試みる
    getAllPlayersAdmin()
      .then(ps => {
        setPlayers(ps);
        setLoading(false);
      })
      .catch(err => {
        // permission-deniedの場合は明示的なメッセージを表示
        if (err?.code === 'permission-denied') {
          setError('Firestoreのセキュリティルールで管理者の読み取りが拒否されました。\nfirestore.rules に管理者UIDの読み取り権限を追加してください。');
        } else {
          setError(`データ取得に失敗しました: ${err?.message ?? err}`);
        }
        setLoading(false);
      });

    // ギャンブル倍率取得
    getGambleMultipliers().then(m => setMultipliers(m)).catch(() => {});

    // onSnapshotでリアルタイム更新も試みる
    const unsub = subscribeAllPlayersAdmin(ps => {
      setPlayers(ps);
      setLoading(false);
      setError(null);
    });
    return unsub;
  }, []);

  const handleSelectPlayer = (p: any) => {
    setSelectedPlayer(p);
    setEditGold(String(p.gold ?? 0));
    setEditName(p.displayName ?? '');
    setEditLevel(String(p.stats?.level ?? 1));
    setEditHp(String(p.stats?.hp ?? p.stats?.maxHp ?? 100));
  };

  const handleSavePlayer = async () => {
    if (!selectedPlayer) return;
    setSaving(true);
    try {
      const updates: any = {
        gold: Number(editGold),
        displayName: editName,
        'stats.level': Number(editLevel),
        'stats.hp': Number(editHp),
      };
      await updatePlayerAdmin(selectedPlayer.id, updates);
      setPlayers(prev => prev.map(p => p.id === selectedPlayer.id
        ? { ...p, gold: Number(editGold), displayName: editName, stats: { ...p.stats, level: Number(editLevel), hp: Number(editHp) } }
        : p));
      addNotification('success', `${editName} のデータを更新しました`);
    } catch (e: any) {
      addNotification('error', `更新に失敗: ${e?.message ?? e}`);
    }
    setSaving(false);
  };

  const handleBanPlayer = async (uid: string, name: string) => {
    if (confirmBan !== uid) {
      setConfirmBan(uid);
      return;
    }
    setSaving(true);
    try {
      await updatePlayerAdmin(uid, { banned: true, gold: 0 });
      setPlayers(prev => prev.map(p => p.id === uid ? { ...p, banned: true, gold: 0 } : p));
      addNotification('success', `${name} をBANしました`);
      setConfirmBan(null);
      if (selectedPlayer?.id === uid) setSelectedPlayer(null);
    } catch (e: any) {
      addNotification('error', `BAN失敗: ${e?.message ?? e}`);
    }
    setSaving(false);
  };

  const handleUnbanPlayer = async (uid: string, name: string) => {
    setSaving(true);
    try {
      await updatePlayerAdmin(uid, { banned: false });
      setPlayers(prev => prev.map(p => p.id === uid ? { ...p, banned: false } : p));
      addNotification('success', `${name} のBANを解除しました`);
    } catch (e: any) {
      addNotification('error', `BAN解除失敗: ${e?.message ?? e}`);
    }
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

  const handleResetGold = async (uid: string, name: string, amount: number) => {
    setSaving(true);
    try {
      await updatePlayerAdmin(uid, { gold: amount });
      setPlayers(prev => prev.map(p => p.id === uid ? { ...p, gold: amount } : p));
      addNotification('success', `${name} の所持金を ${amount.toLocaleString()}G にリセットしました`);
    } catch (e: any) {
      addNotification('error', `失敗: ${e?.message}`);
    }
    setSaving(false);
  };

  // 統計計算
  const stats = {
    total: players.length,
    banned: players.filter(p => p.banned).length,
    active: players.filter(p => (Date.now() - (p.lastSeen ?? 0)) < 24 * 60 * 60 * 1000).length,
    totalGold: players.reduce((s, p) => s + (p.gold ?? 0), 0),
    avgLevel: players.length > 0 ? Math.round(players.reduce((s,p)=>s+(p.stats?.level??1),0)/players.length) : 0,
    maxLevel: players.length > 0 ? Math.max(...players.map(p => p.stats?.level ?? 1)) : 0,
  };

  const filteredPlayers = players.filter(p =>
    !playerFilter || (p.displayName ?? '').includes(playerFilter) || p.id.includes(playerFilter)
  );

  const SUB_TABS: { id: SubTab; label: string; icon: string }[] = [
    { id: 'players',  label: 'プレイヤー', icon: '👥' },
    { id: 'stats',    label: '統計',       icon: '📊' },
    { id: 'gamble',   label: 'ギャンブル', icon: '🎰' },
    { id: 'announce', label: 'お知らせ',   icon: '📢' },
  ];

  return (
    <div style={{padding:'12px 8px 80px'}}>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, borderBottom:'1px solid #e05555', paddingBottom:8}}>
        <h2 style={{fontFamily:'Cinzel,serif', color:'#e05555', margin:0, flex:1}}>🔐 管理者パネル</h2>
        <button onClick={() => setActiveTab('status')} style={{padding:'4px 10px', background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.8rem'}}>← 戻る</button>
      </div>

      {/* サブタブ */}
      <div style={{display:'flex', gap:4, marginBottom:12, overflowX:'auto', flexWrap:'wrap'}}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            style={{flexShrink:0, padding:'6px 10px', background: subTab===t.id ? 'rgba(224,85,85,0.2)' : '#1c2235', border:`1px solid ${subTab===t.id ? '#e05555' : '#2d3752'}`, color: subTab===t.id ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer', fontSize:'0.78rem'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== プレイヤー管理 ===== */}
      {subTab === 'players' && (
        <div>
          {error && (
            <div style={{background:'rgba(224,85,85,0.15)', border:'1px solid #e05555', borderRadius:8, padding:'10px 12px', marginBottom:12, fontSize:'0.78rem', color:'#e05555', whiteSpace:'pre-wrap'}}>
              ⚠️ {error}
            </div>
          )}
          <input
            value={playerFilter} onChange={e => setPlayerFilter(e.target.value)}
            placeholder="名前・UIDで検索..."
            style={{width:'100%', padding:'7px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box', marginBottom:8}}
          />
          {loading
            ? <div style={{textAlign:'center', color:'#8a92b2', padding:20}}>読み込み中...</div>
            : (
              <div style={{display:'flex', flexDirection:'column', gap:4, marginBottom:16}}>
                {filteredPlayers.length === 0 && (
                  <div style={{color:'#4a5070', textAlign:'center', padding:16, fontSize:'0.85rem'}}>
                    {players.length === 0 ? 'プレイヤーデータなし（Firestoreルール要確認）' : '該当なし'}
                  </div>
                )}
                {filteredPlayers.map(p => (
                  <button key={p.id} onClick={() => handleSelectPlayer(p)}
                    style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background: selectedPlayer?.id === p.id ? 'rgba(91,141,238,0.2)' : p.banned ? 'rgba(224,85,85,0.08)' : '#1c2235', border:`1px solid ${selectedPlayer?.id === p.id ? '#5b8dee' : p.banned ? '#e05555' : '#2d3752'}`, borderRadius:6, cursor:'pointer', color: p.banned ? '#e05555' : '#e8e6ff', fontSize:'0.82rem', textAlign:'left'}}>
                    <span>{p.banned ? '🚫' : '⚔️'} {p.displayName ?? '名無し'} (Lv.{p.stats?.level ?? 1})</span>
                    <span style={{color:'#f0c060', flexShrink:0}}>💰 {(p.gold ?? 0).toLocaleString()}G</span>
                  </button>
                ))}
              </div>
            )}

          {selectedPlayer && (
            <div style={{background:'#1c2235', border:'2px solid #5b8dee', borderRadius:10, padding:14}}>
              <h3 style={{color:'#5b8dee', marginBottom:12, fontSize:'0.95rem'}}>✏️ {selectedPlayer.displayName} を編集</h3>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10}}>
                {[
                  { label:'表示名', value:editName, setter:setEditName, type:'text' },
                  { label:'所持金 (G)', value:editGold, setter:setEditGold, type:'number' },
                  { label:'レベル', value:editLevel, setter:setEditLevel, type:'number' },
                  { label:'HP', value:editHp, setter:setEditHp, type:'number' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{fontSize:'0.72rem', color:'#8a92b2', marginBottom:3}}>{f.label}</div>
                    <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)}
                      style={{width:'100%', padding:'6px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box'}} />
                  </div>
                ))}
              </div>
              <div style={{marginBottom:10, fontSize:'0.75rem', color:'#8a92b2'}}>
                <div>UID: {selectedPlayer.id.slice(0,12)}... | 所持アイテム: {Object.keys(selectedPlayer.inventory ?? {}).length}種</div>
                {selectedPlayer.dungeonClearedCount && (
                  <div>ダンジョン累計: {Object.values(selectedPlayer.dungeonClearedCount as Record<string,number>).reduce((s,v)=>s+v,0)}回クリア</div>
                )}
              </div>
              <div style={{display:'flex', gap:6}}>
                <button onClick={handleSavePlayer} disabled={saving}
                  style={{flex:1, padding:'8px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem'}}>
                  {saving ? '保存中...' : '💾 保存'}
                </button>
                <button onClick={() => handleResetGold(selectedPlayer.id, selectedPlayer.displayName, 1000)} disabled={saving}
                  style={{padding:'8px 10px', background:'rgba(240,168,48,0.2)', color:'#f0a830', border:'1px solid #f0a830', borderRadius:6, cursor:'pointer', fontSize:'0.78rem'}}>
                  🔄 1000Gリセット
                </button>
              </div>
              <button
                onClick={() => selectedPlayer.banned
                  ? handleUnbanPlayer(selectedPlayer.id, selectedPlayer.displayName)
                  : handleBanPlayer(selectedPlayer.id, selectedPlayer.displayName)
                }
                disabled={saving}
                style={{width:'100%', marginTop:8, padding:'8px', background: selectedPlayer.banned ? 'rgba(76,175,135,0.2)' : confirmBan===selectedPlayer.id ? 'rgba(224,85,85,0.5)' : 'rgba(224,85,85,0.15)', color: selectedPlayer.banned ? '#4caf87' : '#e05555', border:`1px solid ${selectedPlayer.banned ? '#4caf87' : '#e05555'}`, borderRadius:6, cursor:'pointer', fontSize:'0.82rem'}}>
                {selectedPlayer.banned ? '✅ BAN解除' : confirmBan===selectedPlayer.id ? '⚠️ 本当にBANする？（もう一度押す）' : '🚫 このプレイヤーをBAN'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== サーバー統計 ===== */}
      {subTab === 'stats' && (
        <div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16}}>
            {[
              { label:'総プレイヤー数', value:`${stats.total}人`, icon:'👥' },
              { label:'BAN済み', value:`${stats.banned}人`, icon:'🚫' },
              { label:'24h以内アクティブ', value:`${stats.active}人`, icon:'🟢' },
              { label:'全プレイヤー総資産', value:`${stats.totalGold.toLocaleString()}G`, icon:'💰' },
              { label:'平均レベル', value:`Lv.${stats.avgLevel}`, icon:'⚔️' },
              { label:'最高レベル', value:`Lv.${stats.maxLevel}`, icon:'🏆' },
            ].map(s => (
              <div key={s.label} style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'12px 14px', textAlign:'center'}}>
                <div style={{fontSize:'1.5rem', marginBottom:4}}>{s.icon}</div>
                <div style={{fontSize:'0.7rem', color:'#8a92b2', marginBottom:4}}>{s.label}</div>
                <div style={{fontWeight:700, fontSize:'0.95rem', color:'#f0c060'}}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:12}}>
            <div style={{fontWeight:700, color:'#5b8dee', marginBottom:8, fontSize:'0.85rem'}}>🏰 ダンジョン攻略状況</div>
            {Object.values(DUNGEON_MASTER).map(d => {
              const cleared = players.filter(p => (p.dungeonClearedCount?.[d.id] ?? 0) > 0).length;
              const pct = stats.total > 0 ? Math.round(cleared / stats.total * 100) : 0;
              return (
                <div key={d.id} style={{marginBottom:6}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', marginBottom:2}}>
                    <span>{d.icon} {d.name}</span>
                    <span style={{color:'#4caf87'}}>{cleared}人 ({pct}%)</span>
                  </div>
                  <div style={{height:4, background:'#2d3752', borderRadius:2, overflow:'hidden'}}>
                    <div style={{height:'100%', background:'#4caf87', width:`${pct}%`}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ギャンブル設定 ===== */}
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

      {/* ===== お知らせ配信 ===== */}
      {subTab === 'announce' && (
        <div>
          <p style={{fontSize:'0.8rem', color:'#8a92b2', marginBottom:12}}>
            全プレイヤーのゲーム内に通知を配信します（Firestoreの shared/announcement に書き込み）。
          </p>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:4}}>お知らせ本文（最大100文字）</div>
            <textarea
              value={announceText}
              onChange={e => setAnnounceText(e.target.value.slice(0, 100))}
              rows={3}
              style={{width:'100%', padding:'8px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem', boxSizing:'border-box', resize:'vertical'}}
            />
            <div style={{fontSize:'0.72rem', color:'#4a5070', textAlign:'right'}}>{announceText.length}/100</div>
          </div>
          <button
            onClick={async () => {
              if (!announceText.trim()) return;
              setSaving(true);
              try {
                const { setDoc, doc } = await import('firebase/firestore');
                const { db } = await import('../../services/firebase');
                await setDoc(doc(db, 'shared', 'announcement'), {
                  text: announceText,
                  timestamp: Date.now(),
                  createdAt: Date.now(),
                  type: 'admin',
                });
                addNotification('success', 'お知らせを配信しました');
                setAnnounceText('');
              } catch (e: any) {
                addNotification('error', `配信失敗: ${e?.message ?? e}`);
              }
              setSaving(false);
            }}
            disabled={saving || !announceText.trim()}
            style={{width:'100%', padding:'10px', background: announceText.trim() ? 'linear-gradient(135deg,#5b8dee,#3d6fd0)' : '#2d3752', color:'#fff', border:'none', borderRadius:8, cursor: announceText.trim() ? 'pointer' : 'not-allowed', fontWeight:700, fontSize:'0.9rem'}}>
            {saving ? '配信中...' : '📢 全プレイヤーに配信'}
          </button>
          <div style={{marginTop:16, background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:10, fontSize:'0.75rem', color:'#4a5070'}}>
            💡 配信したお知らせはゲームを開いたプレイヤーの画面に通知として表示されます。
          </div>
        </div>
      )}
    </div>
  );
}
