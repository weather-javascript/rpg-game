// src/App.tsx
import { GameIcon } from './components/icons';
import { useGameStore } from './stores/gameStore';
import { useAuth } from './hooks/useAuth';
import { useAutoSave } from './hooks/useAutoSave';
import { useEffect, useState, useRef } from 'react';
import type { TabId, BoardMessage } from './types/game';
import { GatheringScreen } from './components/screens/GatheringScreen';
import { MarketScreen }    from './components/screens/MarketScreen';
import { DungeonScreen }   from './components/screens/DungeonScreen';
import { GambleScreen }    from './components/screens/GambleScreen';
import { StatusScreen }    from './components/screens/StatusScreen';
import { OnlineScreen }    from './components/screens/OnlineScreen';
import { FishingScreen }   from './components/screens/FishingScreen';
import { AdminScreen }     from './components/screens/AdminScreen';
import { CraftingScreen }   from './components/screens/CraftingScreen';
import { NaviScreen }       from './components/screens/NaviScreen';
import { subscribeSoldNotifications, markSoldNotificationRead, subscribeMaintenanceStatus, setPlayerActivity } from './services/multiplayer';
import type { PlayerActivityCode } from './services/multiplayer';

const TAB_TO_ACTIVITY: Partial<Record<string, PlayerActivityCode>> = {
  gathering: 'mining',
  fishing:   'fishing',
  crafting:  'crafting',
  market:    'market',
  gamble:    'gambling',
  online:    'home',
  status:    'home',
  navi:      'home',
  dungeon:   'other',
};
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './services/firebase';
import { ITEM_MASTER, VERSION_PATCHES } from './data/masters';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id:'navi',      label:'冒険ナビ',  icon:'compass' },
  { id:'gathering', label:'採取',     icon:'pickaxe' },
  { id:'fishing',   label:'釣り',     icon:'fishing_rod' },
  { id:'crafting',  label:'製作',     icon:'hammer' },
  { id:'market',    label:'市場',     icon:'market' },
  { id:'dungeon',   label:'ダンジョン', icon:'swords' },
  { id:'gamble',    label:'ギャンブル', icon:'slot_machine' },
  { id:'online',    label:'オンライン', icon:'globe' },
  { id:'status',    label:'状態',     icon:'chart' },
];

const LOADING_HINTS = [
  '⚔️ ダンジョンを生成しています...',
  '🪨 鉱脈を配置しています...',
  '🐉 モンスターを召喚しています...',
  '🎣 釣り場に魚を放流しています...',
  '💰 宝箱を配置しています...',
  '🌲 森を育てています...',
  '🔥 炎を灯しています...',
  '⚗️ 魔法陣を描いています...',
  '🗝️ 扉を開いています...',
  '🌟 星を配置しています...',
];

function LoadingScreen() {
  const [hint, setHint] = useState(() => LOADING_HINTS[Math.floor(Date.now() % LOADING_HINTS.length)]);
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const hintTimer = setInterval(() => {
      setHint(LOADING_HINTS[Math.floor(Date.now() % LOADING_HINTS.length)]);
    }, 1800);
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    const progTimer = setInterval(() => setProgress(p => Math.min(95, p + Math.random() * 12 + 2)), 300);
    return () => { clearInterval(hintTimer); clearInterval(dotTimer); clearInterval(progTimer); };
  }, []);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:20, background:'#0e1118' }}>
      <div style={{ fontSize:'3.5rem', filter:'drop-shadow(0 0 20px rgba(240,192,96,0.6))', animation:'none' }}>⚔️</div>
      <h1 style={{ fontFamily:'Cinzel,serif', fontSize:'2rem', color:'#f0c060', letterSpacing:'0.2em', margin:0, textShadow:'0 0 30px rgba(240,192,96,0.4)' }}>RPG LIFE</h1>
      <div style={{ width:260, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ height:4, background:'#1c2235', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#5b8dee,#f0c060)', width:`${progress}%`, transition:'width 0.3s ease', borderRadius:2 }} />
        </div>
        <p style={{ color:'#8a92b2', fontSize:'0.82rem', margin:0, textAlign:'center', minHeight:20 }}>{hint}{dots}</p>
      </div>
    </div>
  );
}

// ============================================================
// 管理者UID（メンテナンス免除）
const ADMIN_UIDS = ['jJ7BrZ0HhpeC5WYsdZbjRlQBRzK2', '49yFkciBJLhFbFq7YJrbg8dI8rf2'];

// ============================================================
// メンテナンス画面
// ============================================================
function MaintenanceScreen({ startedAt, estimatedMinutes, message, uid, displayName, level }: {
  startedAt: number; estimatedMinutes: number; message?: string;
  uid: string; displayName: string; level: number;
}) {
  const startTime = new Date(startedAt).toLocaleString('ja-JP');
  const endTime = new Date(startedAt + estimatedMinutes * 60 * 1000).toLocaleString('ja-JP');
  const [tab, setTab] = useState<'chat' | 'game'>('chat');

  // ---- チャット ----
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  useEffect(() => {
    let unsub: (() => void) | null = null;
    import('./services/multiplayer').then(m => {
      unsub = m.subscribeBoardMessages(setMessages);
    });
    return () => { unsub?.(); };
  }, []);
  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || text.length > 100) return;
    setChatInput('');
    const { postBoardMessage } = await import('./services/multiplayer');
    await postBoardMessage(uid, displayName, level, text);
  };

  // ---- ミニゲーム: 数字当てゲーム ----
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [guessCount, setGuessCount] = useState(0);
  const [hint, setHint] = useState('1〜100の数字を当てよう！');
  const [won, setWon] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(() => {
    try { const v = localStorage.getItem('mini_guess_best'); return v ? Number(v) : null; } catch { return null; }
  });

  const handleGuess = () => {
    const n = parseInt(guess);
    if (isNaN(n) || n < 1 || n > 100) { setHint('1〜100の整数を入力してください'); return; }
    const next = guessCount + 1;
    setGuessCount(next);
    if (n === target) {
      setWon(true);
      setHint(`🎉 正解！ ${next}回で当てました！`);
      if (bestScore === null || next < bestScore) {
        setBestScore(next);
        try { localStorage.setItem('mini_guess_best', String(next)); } catch { /* ignore */ }
      }
    } else if (n < target) {
      setHint(`📈 もっと大きい（${next}回目）`);
    } else {
      setHint(`📉 もっと小さい（${next}回目）`);
    }
    setGuess('');
  };
  const resetGame = () => {
    setTarget(Math.floor(Math.random() * 100) + 1);
    setGuess(''); setGuessCount(0); setHint('1〜100の数字を当てよう！'); setWon(false);
  };

  const S = {
    container: { minHeight:'100vh', background:'#0d0f14', display:'flex', flexDirection:'column' as const, alignItems:'center', padding:'20px 12px' },
    card: { width:'100%', maxWidth:480, background:'#1c2235', border:'1px solid #2d3752', borderRadius:12, overflow:'hidden' },
    header: { textAlign:'center' as const, padding:'20px 16px 12px', borderBottom:'1px solid #2d3752' },
    tabs: { display:'flex', borderBottom:'1px solid #2d3752' },
    tabBtn: (active: boolean) => ({
      flex:1, padding:'10px 0', fontSize:'0.85rem', background: active ? 'rgba(91,141,238,0.15)' : 'transparent',
      color: active ? '#5b8dee' : '#6a7290', border:'none', borderBottom: active ? '2px solid #5b8dee' : '2px solid transparent', cursor:'pointer',
    }),
    body: { padding:16 },
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        <div style={S.header}>
          <div style={{ fontSize:'2.2rem', marginBottom:8 }}>🔧</div>
          <h2 style={{ color:'#f0c060', fontFamily:'Cinzel,serif', margin:'0 0 6px' }}>メンテナンス中</h2>
          {message && (
            <div style={{ background:'rgba(240,192,96,0.08)', border:'1px solid rgba(240,192,96,0.25)', borderRadius:6, padding:'8px 12px', marginBottom:8, color:'#f0c060', fontSize:'0.82rem', lineHeight:1.7 }}>
              {message}
            </div>
          )}
          <p style={{ color:'#6a7290', fontSize:'0.78rem', margin:0, lineHeight:1.8 }}>
            開始: {startTime}　終了予定: {endTime}
          </p>
        </div>

        <div style={S.tabs}>
          <button style={S.tabBtn(tab==='chat')} onClick={() => setTab('chat')}>💬 チャット</button>
          <button style={S.tabBtn(tab==='game')} onClick={() => setTab('game')}>🎮 ミニゲーム</button>
        </div>

        <div style={S.body}>
          {tab === 'chat' && (
            <div>
              <div style={{ height:300, overflowY:'auto', display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
                {messages.length === 0 && (
                  <div style={{ color:'#4a5070', fontSize:'0.82rem', textAlign:'center', padding:'30px 0' }}>メッセージはまだありません</div>
                )}
                {messages.map(m => (
                  <div key={m.id} style={{ background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:'7px 10px' }}>
                    <div style={{ display:'flex', gap:6, alignItems:'baseline', marginBottom:2 }}>
                      <span style={{ fontSize:'0.78rem', color:'#5b8dee', fontWeight:600 }}>{m.displayName}</span>
                      <span style={{ fontSize:'0.68rem', color:'#4a5070' }}>Lv.{m.level}</span>
                    </div>
                    <div style={{ fontSize:'0.84rem', color:'#c8d0e8', wordBreak:'break-all' as const }}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="メッセージを入力..."
                  maxLength={100}
                  style={{ flex:1, background:'#161b26', border:'1px solid #2d3752', borderRadius:6, padding:'8px 10px', color:'#e8e6ff', fontSize:'0.84rem', outline:'none' }}
                />
                <button onClick={sendChat} disabled={!chatInput.trim()} style={{ padding:'8px 14px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.84rem' }}>送信</button>
              </div>
            </div>
          )}

          {tab === 'game' && (
            <div style={{ textAlign:'center' as const }}>
              <h3 style={{ color:'#e8e6ff', margin:'0 0 4px', fontSize:'1rem' }}>🔢 数字当てゲーム</h3>
              <p style={{ color:'#6a7290', fontSize:'0.78rem', margin:'0 0 16px' }}>1〜100の数字をできるだけ少ない回数で当てよう</p>
              {bestScore !== null && (
                <div style={{ background:'rgba(240,192,96,0.08)', border:'1px solid rgba(240,192,96,0.2)', borderRadius:6, padding:'6px 12px', marginBottom:12, fontSize:'0.8rem', color:'#f0c060' }}>
                  🏆 ベスト: {bestScore}回
                </div>
              )}
              <div style={{ background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:'14px', marginBottom:14, fontSize:'0.9rem', color: won ? '#4caf87' : '#c8d0e8', minHeight:44, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {hint}
              </div>
              {!won ? (
                <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                  <input
                    type="number" min={1} max={100}
                    value={guess}
                    onChange={e => setGuess(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGuess()}
                    placeholder="数字"
                    style={{ width:80, background:'#161b26', border:'1px solid #2d3752', borderRadius:6, padding:'8px', color:'#e8e6ff', fontSize:'1rem', textAlign:'center' as const, outline:'none' }}
                  />
                  <button onClick={handleGuess} style={{ padding:'8px 20px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.9rem' }}>答える</button>
                </div>
              ) : (
                <button onClick={resetGame} style={{ padding:'10px 28px', background:'linear-gradient(135deg,#4caf87,#2d8060)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.9rem', fontWeight:700 }}>
                  もう一度
                </button>
              )}
              <p style={{ color:'#4a5070', fontSize:'0.75rem', marginTop:12 }}>{guessCount}回目</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMINからのお知らせポップアップ
// ============================================================
function AdminAnnouncementPopup({ onClose }: { onClose: () => void }) {
  const [announcements, setAnnouncements] = useState<Array<{ id: string; text: string; timestamp: number; imageUrl?: string }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    import('./services/multiplayer').then(m => {
      m.getAnnouncementHistory().then(list => { setAnnouncements(list as any); setLoading(false); });
    });
  }, []);
  return (
    <div style={{ background:'rgba(0,0,0,0.85)', position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#1c2235', border:'2px solid #5b8dee', borderRadius:14, padding:20, width:'100%', maxWidth:460, maxHeight:'80vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ color:'#5b8dee', fontFamily:'Cinzel,serif', margin:0, fontSize:'1.1rem' }}>📢 ADMINからのお知らせ</h2>
          <button onClick={onClose} style={{ background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:'0.85rem' }}>✕ 閉じる</button>
        </div>
        {loading ? (
          <div style={{ textAlign:'center', color:'#4a5070', padding:'20px 0' }}>読み込み中...</div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign:'center', color:'#4a5070', padding:'20px 0' }}>お知らせはありません</div>
        ) : (
          announcements.map(a => (
            <div key={a.id} style={{ background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
              <div style={{ fontSize:'0.72rem', color:'#4a5070', marginBottom:6 }}>{new Date(a.timestamp).toLocaleString('ja-JP')}</div>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                {a.imageUrl && (
                  <img
                    src={a.imageUrl}
                    alt=""
                    style={{ width:56, height:56, objectFit:'contain', borderRadius:6, border:'1px solid #2d3752', flexShrink:0, background:'#0e1220' }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <div style={{ fontSize:'0.88rem', color:'#e8e6ff', flex:1, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{a.text}</div>
              </div>
            </div>
          ))
        )}
        <button onClick={onClose} style={{ width:'100%', padding:'10px', background:'linear-gradient(135deg,#5b8dee,#3a6fd0)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, marginTop:8 }}>
          閉じる
        </button>
      </div>
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

// ============================================================
// オークション売却成功ポップアップ
// ============================================================
interface SoldPopupInfo { itemName: string; itemIcon: string; amount: number; totalGold: number }
function SoldPopup({ info, onClose }: { info: SoldPopupInfo; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:550, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
      <div onClick={onClose} style={{
        pointerEvents:'auto',
        background:'linear-gradient(135deg,rgba(28,34,53,0.98),rgba(22,27,38,0.98))',
        border:'2px solid #f0c060',
        borderRadius:16,
        padding:'24px 32px',
        textAlign:'center',
        animation:'soldPopIn 0.4s ease',
        boxShadow:'0 0 40px rgba(240,192,96,0.4)',
        maxWidth:300,
        cursor:'pointer',
      }}>
        <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🏷️</div>
        <div style={{ fontSize:'0.85rem', color:'#8a92b2', marginBottom:8 }}>オークションで売れました！</div>
        <div style={{ fontSize:'1.3rem', fontWeight:700, color:'#e8e6ff', marginBottom:4 }}>
          {info.itemIcon} {info.itemName} ×{info.amount}
        </div>
        <div style={{ fontSize:'1.8rem', fontWeight:900, color:'#f0c060', textShadow:'0 0 20px rgba(240,192,96,0.6)' }}>
          +{info.totalGold.toLocaleString()}G
        </div>
        <div style={{ fontSize:'0.7rem', color:'#4a5070', marginTop:8 }}>タップで閉じる</div>
      </div>
      <style>{`@keyframes soldPopIn { from { transform: scale(0.7) translateY(20px); opacity:0; } to { transform: scale(1) translateY(0); opacity:1; } }`}</style>
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
        style={{ background:'#1c2235', color:isSaving ? '#4a5070' : '#8a92b2', border:`1px solid ${isSaving ? '#2d3752' : '#3d4762'}`, borderRadius:6, padding:'3px 9px', fontSize:'0.75rem', cursor: isSaving ? 'not-allowed' : 'pointer', flexShrink:0, display:'flex', alignItems:'center', gap:4 }}
        title={isSaving ? '保存中...' : 'セーブ'}
      >
        {isSaving
          ? <><span style={{display:'inline-block', animation:'spin 1s linear infinite', fontSize:'0.75rem'}}>⟳</span><span>保存中</span></>
          : '💾'
        }
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
          <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}><GameIcon id={tab.icon} size={20} /></span>
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
  const [dismissed, setDismissed] = useState(false);
  const [lastDangerKey, setLastDangerKey] = useState('');

  if (!player) return null;
  const { canUse, reason } = canUseRelief();
  const isStruggling = player.stats.hp <= 30 && player.stats.satiety <= 10 && player.gold < 500;
  const dangerKey = `${Math.floor(player.stats.hp/10)}-${Math.floor(player.stats.satiety/5)}-${Math.floor(player.gold/100)}`;

  // 危険状態が新しく変化したら再表示
  if (dangerKey !== lastDangerKey && isStruggling) {
    setLastDangerKey(dangerKey);
    setDismissed(false);
  }

  if (!isStruggling || dismissed) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#1c2235', border: '2px solid #e05555', borderRadius: 14,
        padding: 20, width: '100%', maxWidth: 360, textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⚠️</div>
        <div style={{ color: '#e05555', fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>ピンチ状態！</div>
        <div style={{ fontSize: '0.82rem', color: '#8a92b2', marginBottom: 14 }}>
          HP・満腹度・所持金が危機的な状態です。
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {canUse ? (
            <button onClick={() => { useRelief(); setDismissed(true); }}
              style={{ padding: '10px', background: 'linear-gradient(135deg,#e05555,#c03030)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
              🆘 緊急救済措置を使う
            </button>
          ) : (
            <div style={{ fontSize: '0.78rem', color: '#4a5070', padding: '8px', background: '#161b26', borderRadius: 6 }}>{reason}</div>
          )}
          <button onClick={() => setDismissed(true)}
            style={{ padding: '8px', background: '#2d3752', color: '#8a92b2', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveScreen({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'navi':      return <NaviScreen />;
    case 'gathering': return <GatheringScreen />;
    case 'fishing':   return <FishingScreen />;
    case 'crafting':  return <CraftingScreen />;
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

  const addItems = useGameStore(s => s.addItems);

  // OTT（オンタイムチケット）: 10分遊ぶと1枚付与
  useEffect(() => {
    if (!player) return;
    const OTT_INTERVAL_MS = 10 * 60 * 1000; // 10分
    const timer = setInterval(() => {
      addItems([{ itemId: 'ontime_ticket', amount: 1 }]);
      addNotification('success', '🎫 オンタイムチケットを1枚獲得しました！（10分プレイ報酬）');
    }, OTT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [player?.uid]);
  const [showVersionPopup, setShowVersionPopup] = useState(false);
  const [showAdminAnnounce, setShowAdminAnnounce] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState<{ active: boolean; startedAt: number; estimatedMinutes: number; message?: string } | null>(null);
  const [soldPopup, setSoldPopup] = useState<SoldPopupInfo | null>(null);
  const soldQueueRef = useRef<SoldPopupInfo[]>([]);
  useEffect(() => {
    if (!player) return;
    setShowVersionPopup(true);
  }, [player?.uid]);

  // メンテナンス監視
  useEffect(() => {
    const unsub = subscribeMaintenanceStatus(s => setMaintenanceStatus(s));
    return unsub;
  }, []);

  const handleCloseVersionPopup = () => {
    setShowVersionPopup(false);
    setShowAdminAnnounce(true);
  };

  // お知らせ購読（Firestoreのshared/announcementをリアルタイム監視）
  useEffect(() => {
    if (!player) return;
    const ref = doc(db, 'shared', 'announcement');
    let lastSeen = '';
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const text = data?.text ?? '';
      const timestamp = data?.timestamp ?? 0;
      const key = `${text}_${timestamp}`;
      if (text && key !== lastSeen) {
        lastSeen = key;
        addNotification('info', `📢 お知らせ: ${text}`);
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.uid]);

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
        changeGold(n.totalGold);
        soldQueueRef.current = [...soldQueueRef.current, { itemName, itemIcon, amount: n.amount, totalGold: n.totalGold }];
        try { await markSoldNotificationRead(n.id); } catch { /* ignore */ }
      }
      // バージョンポップアップもAdminお知らせも表示中でなければ即表示
      if (!showVersionPopup && !showAdminAnnounce && !soldPopup && soldQueueRef.current.length > 0) {
        setSoldPopup(soldQueueRef.current[0]);
        soldQueueRef.current = soldQueueRef.current.slice(1);
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.uid]);

  if (isAuthLoading || !player) return <LoadingScreen />;

  // メンテナンス中チェック（ADMIN除く）
  if (maintenanceStatus?.active && !ADMIN_UIDS.includes(player.uid)) {
    return <MaintenanceScreen startedAt={maintenanceStatus.startedAt} estimatedMinutes={maintenanceStatus.estimatedMinutes} message={maintenanceStatus.message} uid={player.uid} displayName={player.displayName} level={player.stats.level} />;
  }

  return (
    <div style={{ maxWidth:900, margin:'0 auto', minHeight:'100vh', background:'#0d0f14' }}>
      {showVersionPopup && <VersionPopup onClose={handleCloseVersionPopup} />}
      {showAdminAnnounce && <AdminAnnouncementPopup onClose={() => { setShowAdminAnnounce(false); const q = soldQueueRef.current; if (q.length > 0) { setSoldPopup(q[0]); soldQueueRef.current = q.slice(1); } }} />}
      {soldPopup && <SoldPopup info={soldPopup} onClose={() => { setSoldPopup(null); const q = soldQueueRef.current; if (q.length > 0) { setTimeout(() => { setSoldPopup(q[0]); soldQueueRef.current = q.slice(1); }, 300); } }} />}
      <StatusBar />
      <main style={{ paddingBottom:72 }}>
        <ActiveScreen tab={activeTab} />
      </main>
      <ReliefPanel />
      <TabNav activeTab={activeTab} setTab={(t) => {
        setActiveTab(t as TabId);
        if (player) {
          const code = TAB_TO_ACTIVITY[t] ?? 'home';
          setPlayerActivity(player.uid, code).catch(() => {});
        }
      }} />
      <NotificationToast />
    </div>
  );
}
