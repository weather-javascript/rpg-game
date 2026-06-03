// src/App.tsx
import { useGameStore } from './stores/gameStore';
import { useAuth } from './hooks/useAuth';
import { useAutoSave } from './hooks/useAutoSave';
import { useEffect, useState } from 'react';
import type { TabId } from './types/game';
import { GatheringScreen } from './components/screens/GatheringScreen';
import { MarketScreen }    from './components/screens/MarketScreen';
import { DungeonScreen }   from './components/screens/DungeonScreen';
import { GambleScreen }    from './components/screens/GambleScreen';
import { StatusScreen }    from './components/screens/StatusScreen';
import { OnlineScreen }    from './components/screens/OnlineScreen';
import { FishingScreen }   from './components/screens/FishingScreen';
import { AdminScreen }     from './components/screens/AdminScreen';
import { subscribeSoldNotifications, markSoldNotificationRead } from './services/multiplayer';
import { ITEM_MASTER, VERSION_PATCHES } from './data/masters';

const LATEST_VERSION = VERSION_PATCHES[0]?.version ?? '1.0.0';
const VERSION_STORAGE_KEY = 'rpg_seen_version';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id:'gathering', label:'採取',     icon:'⛏️' },
  { id:'fishing',   label:'釣り',     icon:'🎣' },
  { id:'market',    label:'市場',     icon:'🏪' },
  { id:'dungeon',   label:'ダンジョン', icon:'⚔️' },
  { id:'gamble',    label:'ギャンブル', icon:'🎰' },
  { id:'online',    label:'オンライン', icon:'🌐' },
  { id:'status',    label:'状態',     icon:'📊' },
];

function LoadingScreen() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:'3rem' }}>⚔️</div>
      <h1 style={{ fontFamily:'Cinzel,serif', fontSize:'2rem', color:'#f0c060', letterSpacing:'0.2em', textShadow:'0 0 30px rgba(240,192,96,0.4)' }}>RPG LIFE</h1>
      <p style={{ color:'#8a92b2', fontSize:'0.9rem' }}>データを読み込んでいます...</p>
    </div>
  );
}

// ============================================================
// バージョン更新ポップアップ
// ============================================================
function VersionPopup({ onClose }: { onClose: () => void }) {
  const patch = VERSION_PATCHES[0];
  if (!patch) return null;
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true });
  return (
    <div style={{ background:'rgba(0,0,0,0.85)', position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#1c2235', border:'2px solid #f0c060', borderRadius:14, padding:20, width:'100%', maxWidth:460, maxHeight:'80vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <h2 style={{ color:'#f0c060', fontFamily:'Cinzel,serif', margin:0, fontSize:'1.1rem' }}>🎉 アップデート情報</h2>
            <div style={{ color:'#4a5070', fontSize:'0.75rem', marginTop:2 }}>Ver.{patch.version} ({patch.date})</div>
          </div>
          <button onClick={onClose} style={{ background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:'0.85rem' }}>✕ 閉じる</button>
        </div>
        {VERSION_PATCHES.map((p, i) => (
          <div key={p.version} style={{ marginBottom:8 }}>
            <button
              onClick={() => setOpenSections(prev => ({ ...prev, [i]: !prev[i] }))}
              style={{ width:'100%', display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, cursor:'pointer', fontSize:'0.85rem', fontWeight:700 }}
            >
              <span>Ver.{p.version} ({p.date})</span>
              <span>{openSections[i] ? '▲' : '▼'}</span>
            </button>
            {openSections[i] && (
              <ul style={{ background:'#161b26', border:'1px solid #2d3752', borderTop:'none', borderRadius:'0 0 6px 6px', padding:'8px 12px 10px 28px', margin:0 }}>
                {p.changes.map((c, j) => (
                  <li key={j} style={{ color:'#8a92b2', fontSize:'0.8rem', marginBottom:3 }}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <button onClick={onClose} style={{ width:'100%', padding:'10px', background:'linear-gradient(135deg,#5b8dee,#3a6fd0)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, marginTop:8 }}>
          確認しました！
        </button>
      </div>
    </div>
  );
}

function StatusBar() {
  const player = useGameStore(s => s.player);
  const isSaving = useGameStore(s => s.isSaving);
  const saveGame = useGameStore(s => s.saveGame);
  if (!player) return null;

  const hpPct = (player.stats.hp / player.stats.maxHp) * 100;
  const satPct = (player.stats.satiety / player.stats.maxSatiety) * 100;
  const expPct = player.stats.level < 200 ? Math.min(100, (player.stats.exp / player.stats.expToNextLevel) * 100) : 100;
  const hpDanger = hpPct < 20;
  const satDanger = satPct < 15;

  const bar = (pct: number, color: string, dangerColor?: string) => (
    <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
      <div style={{ height:'100%', background: (dangerColor && pct < 20) ? dangerColor : color, width:`${pct}%`, transition:'width 0.3s' }} />
    </div>
  );

  return (
    <header style={{ display:'flex', alignItems:'center', gap:10, background:'#161b26', borderBottom:`1px solid ${(hpDanger || satDanger) ? '#e05555' : '#2d3752'}`, padding:'6px 12px', position:'sticky', top:0, zIndex:100 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <span style={{ fontWeight:700, color:'#f0c060', fontSize:'0.85rem' }}>⚔️ {player.displayName}</span>
        <span style={{ background:'#5b8dee', color:'#fff', padding:'1px 7px', borderRadius:20, fontSize:'0.72rem', fontWeight:700 }}>Lv.{player.stats.level}</span>
        <span style={{ color:'#f0c060', fontSize:'0.85rem' }}>💰 {player.gold.toLocaleString()}G</span>
      </div>
      <div style={{ display:'flex', gap:6, flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:3, flex:1 }} title={`HP: ${player.stats.hp}/${player.stats.maxHp}`}>
          <span style={{ fontSize:'0.7rem' }}>{hpDanger ? '💔' : '❤️'}</span>{bar(hpPct, '#e05555')}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:3, flex:1 }} title={`満腹度: ${player.stats.satiety}/${player.stats.maxSatiety}`}>
          <span style={{ fontSize:'0.7rem' }}>{satDanger ? '😵' : '🍖'}</span>{bar(satPct, '#f0a830', '#e05555')}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:3, flex:1 }} title={`EXP: ${player.stats.exp}/${player.stats.expToNextLevel}`}>
          <span style={{ fontSize:'0.7rem' }}>✨</span>{bar(expPct, '#5b8dee')}
        </div>
      </div>
      <button
        onClick={saveGame} disabled={isSaving}
        style={{ background:'#1c2235', color:isSaving ? '#4a5070' : '#8a92b2', border:'1px solid #2d3752', borderRadius:6, padding:'3px 9px', fontSize:'0.75rem', cursor:'pointer', flexShrink:0 }}
      >
        {isSaving ? '...' : '💾'}
      </button>
    </header>
  );
}

function TabNav({ activeTab, setTab }: { activeTab: TabId; setTab: (t: TabId) => void }) {
  return (
    <nav style={{ display:'flex', background:'#161b26', borderTop:'1px solid #2d3752', position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:900, zIndex:100 }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setTab(tab.id)}
          style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'7px 2px',
            background:'transparent', color: activeTab === tab.id ? '#f0c060' : '#8a92b2',
            border:'none', borderTop:`2px solid ${activeTab === tab.id ? '#f0c060' : 'transparent'}`,
            cursor:'pointer', fontSize:'0.6rem', transition:'all 0.2s',
          }}
        >
          <span style={{ fontSize:'1.1rem' }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function NotificationToast() {
  const notifications = useGameStore(s => s.notifications);
  const remove = useGameStore(s => s.removeNotification);
  const colors = { success:'rgba(76,175,135,0.95)', error:'rgba(224,85,85,0.95)', info:'rgba(91,141,238,0.95)', warning:'rgba(240,168,48,0.95)' };
  return (
    <div style={{ position:'fixed', top:56, right:10, zIndex:200, display:'flex', flexDirection:'column', gap:6, maxWidth:280 }}>
      {notifications.map(n => (
        <div
          key={n.id}
          onClick={() => remove(n.id)}
          style={{ padding:'9px 13px', borderRadius:6, fontSize:'0.8rem', cursor:'pointer', background:colors[n.type], color: n.type === 'warning' ? '#000' : '#fff' }}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}

function ReliefPanel() {
  const player = useGameStore(s => s.player);
  const canUseRelief = useGameStore(s => s.canUseRelief);
  const useRelief = useGameStore(s => s.useRelief);
  if (!player) return null;
  const { canUse, reason } = canUseRelief();
  const isDanger = player.stats.hp <= 50 || player.stats.satiety <= 20 || player.gold < 1000;
  if (!isDanger) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 24px)', maxWidth: 876, zIndex: 90,
      background: canUse ? 'rgba(224,85,85,0.95)' : 'rgba(29,34,50,0.95)',
      border: `1px solid ${canUse ? '#e05555' : '#2d3752'}`,
      borderRadius: 8, padding: '8px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    }}>
      <div style={{ fontSize: '0.78rem', color: canUse ? '#fff' : '#8a92b2' }}>
        {canUse ? '🆘 ピンチ！救済措置が利用できます' : `⚠️ 危険状態 | ${reason}`}
      </div>
      <button onClick={useRelief} disabled={!canUse}
        style={{ padding: '5px 12px', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap',
          background: canUse ? '#fff' : '#2d3752', color: canUse ? '#e05555' : '#4a5070',
          border: 'none', borderRadius: 6, cursor: canUse ? 'pointer' : 'not-allowed' }}>
        🆘 救済
      </button>
    </div>
  );
}

function ActiveScreen({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'gathering': return <GatheringScreen />;
    case 'fishing':   return <FishingScreen />;
    case 'market':    return <MarketScreen />;
    case 'dungeon':   return <DungeonScreen />;
    case 'gamble':    return <GambleScreen />;
    case 'online':    return <OnlineScreen />;
    case 'status':    return <StatusScreen />;
    case 'admin':     return <AdminScreen />;
    default:          return <GatheringScreen />;
  }
}

export default function App() {
  useAuth();
  useAutoSave();
  const isAuthLoading = useGameStore(s => s.isAuthLoading);
  const player = useGameStore(s => s.player);
  const activeTab = useGameStore(s => s.activeTab) as TabId;
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const addNotification = useGameStore(s => s.addNotification);
  const changeGold = useGameStore(s => s.changeGold);
  const applyPassiveRegen = useGameStore(s => s.applyPassiveRegen);

  // バージョン更新ポップアップ
  const [showVersionPopup, setShowVersionPopup] = useState(false);
  useEffect(() => {
    if (!player) return;
    const seen = localStorage.getItem(VERSION_STORAGE_KEY);
    if (seen !== LATEST_VERSION) setShowVersionPopup(true);
  }, [player?.uid]);

  const handleCloseVersionPopup = () => {
    localStorage.setItem(VERSION_STORAGE_KEY, LATEST_VERSION);
    setShowVersionPopup(false);
  };

  // 自動HP/満腹度回復（5秒に1HP、放置でも回復）
  useEffect(() => {
    if (!player) return;
    // 初回：過去の放置分を即時適用
    applyPassiveRegen();
    const interval = setInterval(() => {
      applyPassiveRegen();
    }, 5000);
    return () => clearInterval(interval);
  }, [player?.uid]);

  // 売却通知の購読
  useEffect(() => {
    if (!player) return;
    const unsub = subscribeSoldNotifications(player.uid, async (notifications) => {
      for (const n of notifications) {
        const itemName = ITEM_MASTER[n.itemId]?.name ?? n.itemId;
        const itemIcon = ITEM_MASTER[n.itemId]?.icon ?? '📦';
        addNotification('success', `🏷️ ${itemIcon} ${itemName} ×${n.amount} が購入されました！+${n.totalGold.toLocaleString()}G`);
        changeGold(n.totalGold);
        try { await markSoldNotificationRead(n.id); } catch { /* ignore */ }
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.uid]);

  if (isAuthLoading || !player) return <LoadingScreen />;

  return (
    <div style={{ maxWidth:900, margin:'0 auto', minHeight:'100vh', background:'#0d0f14' }}>
      {showVersionPopup && <VersionPopup onClose={handleCloseVersionPopup} />}
      <StatusBar />
      <main style={{ paddingBottom:72 }}>
        <ActiveScreen tab={activeTab} />
      </main>
      <ReliefPanel />
      <TabNav activeTab={activeTab} setTab={(t) => setActiveTab(t as TabId)} />
      <NotificationToast />
    </div>
  );
}
