// src/components/screens/GambleScreen.tsx
// 拡充ギャンブル画面：丁半・チンチロリン・ジャックポット・ポーカー・スロット等。

import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GAMBLE_MASTER, ITEM_MASTER } from '../../data/masters';
import { playChohan, playChinchiro, dealPoker, drawPoker } from '../../systems/minigames';
import { contributeAndRollJackpot, subscribeJackpotPool } from '../../services/multiplayer';
import type { GambleResult, GambleMaster } from '../../types/game';
import type { PokerState } from '../../systems/minigames';

// ============================================================
// 共通スロット/宝箱ロジック（既存の rewardTable 方式）
// ============================================================
function resolveGenericGamble(game: GambleMaster, bet: number): GambleResult {
  const rand = Math.random();
  let cum = 0;
  for (const r of game.rewardTable) {
    cum += r.probability;
    if (rand < cum) {
      const goldDelta = Math.floor(bet * r.multiplier) - bet;
      return { rewardLabel: r.label, multiplier: r.multiplier, goldDelta, itemRewards: r.itemRewards ?? [], symbols: r.symbols };
    }
  }
  const last = game.rewardTable[game.rewardTable.length - 1];
  return { rewardLabel: last.label, multiplier: last.multiplier, goldDelta: Math.floor(bet * last.multiplier) - bet, itemRewards: last.itemRewards ?? [], symbols: last.symbols };
}

// ============================================================
// 丁半パネル
// ============================================================
function ChohanPanel({ bet }: { bet: number }) {
  const { changeGold, addNotification } = useGameStore();
  const player = useGameStore(s => s.player);
  const [result, setResult] = useState<(GambleResult & { dice: number[] }) | null>(null);
  const [animating, setAnimating] = useState(false);

  const play = (choice: 'cho' | 'han') => {
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true);
    changeGold(-bet);
    setTimeout(() => {
      const r = playChohan(bet, choice);
      if (r.goldDelta > 0) changeGold(r.goldDelta + bet);
      else if (r.multiplier > 0) changeGold(Math.floor(bet * r.multiplier));
      setResult(r);
      setAnimating(false);
    }, 600);
  };

  return (
    <div>
      {animating && <div style={{textAlign:'center', fontSize:'2rem', margin:'12px 0'}}>🎲🎲</div>}
      {result && !animating && (
        <div style={{background: result.goldDelta >= 0 ? 'rgba(76,175,135,0.15)' : 'rgba(224,85,85,0.1)', border:`1px solid ${result.goldDelta >= 0 ? '#4caf87' : '#e05555'}`, borderRadius:8, padding:10, marginBottom:10, textAlign:'center'}}>
          <div style={{fontSize:'1.5rem'}}>{result.dice?.map(String).join(' - ')}</div>
          <div style={{fontWeight:700, marginTop:4}}>{result.rewardLabel}</div>
          <div style={{color: result.goldDelta >= 0 ? '#4caf87' : '#e05555', fontWeight:700}}>{result.goldDelta >= 0 ? `+${result.goldDelta}G` : `${result.goldDelta}G`}</div>
        </div>
      )}
      <div style={{display:'flex', gap:8}}>
        <button onClick={() => play('cho')} disabled={animating} style={{flex:1, padding:10, background:'linear-gradient(135deg,#5b8dee,#3d6fd0)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700}}>
          丁（偶数）
        </button>
        <button onClick={() => play('han')} disabled={animating} style={{flex:1, padding:10, background:'linear-gradient(135deg,#e05555,#c03030)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700}}>
          半（奇数）
        </button>
      </div>
    </div>
  );
}

// ============================================================
// チンチロリンパネル
// ============================================================
function ChinchiroPanel({ bet }: { bet: number }) {
  const { changeGold, addNotification } = useGameStore();
  const player = useGameStore(s => s.player);
  const [result, setResult] = useState<(GambleResult & { dice: number[] }) | null>(null);
  const [animating, setAnimating] = useState(false);

  const play = () => {
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true);
    changeGold(-bet);
    setTimeout(() => {
      const r = playChinchiro(bet);
      if (r.goldDelta + bet > 0) changeGold(r.goldDelta + bet);
      setResult(r);
      setAnimating(false);
    }, 700);
  };

  const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  return (
    <div>
      {animating && <div style={{textAlign:'center', fontSize:'2.5rem', margin:'12px 0'}}>🎲🎲🎲</div>}
      {result && !animating && (
        <div style={{background: result.goldDelta >= 0 ? 'rgba(76,175,135,0.15)' : 'rgba(224,85,85,0.1)', border:`1px solid ${result.goldDelta >= 0 ? '#4caf87' : '#e05555'}`, borderRadius:8, padding:10, marginBottom:10, textAlign:'center'}}>
          <div style={{fontSize:'2rem'}}>{result.dice?.map(d => DICE_FACES[d]).join(' ')}</div>
          <div style={{fontWeight:700, marginTop:4, color:'#f0c060'}}>{result.roleName}</div>
          <div style={{color: result.goldDelta >= 0 ? '#4caf87' : '#e05555', fontWeight:700}}>{result.goldDelta >= 0 ? `+${result.goldDelta}G` : `${result.goldDelta}G`}</div>
        </div>
      )}
      <button onClick={play} disabled={animating} style={{width:'100%', padding:10, background:'linear-gradient(135deg,#9b6df0,#7040cc)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700}}>
        🎯 チンチロリン！
      </button>
    </div>
  );
}

// ============================================================
// ジャックポットパネル
// ============================================================
function JackpotPanel() {
  const { changeGold, addNotification } = useGameStore();
  const player = useGameStore(s => s.player);
  const [pool, setPool] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [won, setWon] = useState(false);
  const BET = 100;

  useEffect(() => {
    const unsub = subscribeJackpotPool(setPool);
    return unsub;
  }, []);

  const play = async () => {
    if (!player || player.gold < BET) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true);
    changeGold(-BET);
    try {
      const { won: jackpotWon, pool: newPool } = await contributeAndRollJackpot(BET);
      setPool(newPool);
      if (jackpotWon) {
        changeGold(newPool);
        setWon(true);
        addNotification('success', `🌟 JACKPOT!! ${newPool.toLocaleString()}G 獲得！！`);
        setTimeout(() => setWon(false), 5000);
      } else {
        addNotification('info', `ハズレ。プールに${Math.floor(BET*0.3)}G積立された。`);
      }
    } catch {
      addNotification('error', '通信エラーが発生しました');
      changeGold(BET); // 返金
    }
    setAnimating(false);
  };

  return (
    <div>
      <div style={{textAlign:'center', marginBottom:12, background:'rgba(240,192,96,0.1)', border:'1px solid #f0c060', borderRadius:8, padding:12}}>
        <div style={{fontSize:'0.8rem', color:'#8a92b2'}}>現在のプール</div>
        <div style={{fontSize:'2rem', fontWeight:700, color:'#f0c060'}}>{pool.toLocaleString()}G</div>
        <div style={{fontSize:'0.7rem', color:'#4a5070'}}>当選確率 0.1% / 賭け金 {BET}G</div>
      </div>
      {won && <div style={{textAlign:'center', fontSize:'2rem', animation:'pulse 0.3s infinite alternate'}}>🌟🌟🌟 JACKPOT!! 🌟🌟🌟</div>}
      <button onClick={play} disabled={animating} style={{width:'100%', padding:12, background:'linear-gradient(135deg,#f0c060,#d4a020)', color:'#000', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'1rem'}}>
        {animating ? '🌟 抽選中...' : '🌟 100G でジャックポットに挑戦！'}
      </button>
    </div>
  );
}

// ============================================================
// ポーカーパネル
// ============================================================
const SUIT_COLORS: Record<string, string> = { '♠':'#e8e6ff', '♣':'#e8e6ff', '♥':'#e05555', '♦':'#e05555' };

function PokerPanel({ bet }: { bet: number }) {
  const { changeGold, addNotification } = useGameStore();
  const player = useGameStore(s => s.player);
  const [state, setState] = useState<PokerState | null>(null);

  const deal = () => {
    if (!player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    changeGold(-bet);
    setState(dealPoker(bet));
  };

  const toggleHold = (i: number) => {
    if (!state || state.phase !== 'deal') return;
    setState(prev => {
      if (!prev) return null;
      const held = [...prev.held];
      held[i] = !held[i];
      return { ...prev, held };
    });
  };

  const draw = () => {
    if (!state || state.phase !== 'deal') return;
    const next = drawPoker(state);
    setState(next);
    if (next.result) {
      const delta = next.result.goldDelta;
      if (delta + bet > 0) changeGold(delta + bet);
    }
  };

  const reset = () => setState(null);

  if (!state) {
    return (
      <button onClick={deal} style={{width:'100%', padding:12, background:'linear-gradient(135deg,#4caf87,#2d8060)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700}}>
        🃏 {bet}G でディール
      </button>
    );
  }

  return (
    <div>
      {/* 手札 */}
      <div style={{display:'flex', gap:6, justifyContent:'center', marginBottom:10, flexWrap:'wrap'}}>
        {state.hand.map((card, i) => {
          const suit = card.label[0];
          const held = state.held[i];
          return (
            <button
              key={i}
              onClick={() => toggleHold(i)}
              style={{
                width:54, height:76, borderRadius:6,
                background: held ? 'rgba(91,141,238,0.3)' : '#1c2235',
                border: `2px solid ${held ? '#5b8dee' : '#2d3752'}`,
                color: SUIT_COLORS[suit] ?? '#e8e6ff',
                fontSize:'0.9rem', cursor: state.phase==='deal' ? 'pointer' : 'default',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              }}
            >
              <div>{card.label}</div>
              {held && <div style={{fontSize:'0.55rem', color:'#5b8dee', marginTop:2}}>HOLD</div>}
            </button>
          );
        })}
      </div>

      {state.phase === 'deal' && (
        <button onClick={draw} style={{width:'100%', padding:10, background:'linear-gradient(135deg,#9b6df0,#7040cc)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700}}>
          🃏 ドロー（HOLD以外を交換）
        </button>
      )}

      {state.phase === 'result' && state.result && (
        <div style={{background: state.result.goldDelta >= 0 ? 'rgba(76,175,135,0.15)' : 'rgba(224,85,85,0.1)', border:`1px solid ${state.result.goldDelta >= 0 ? '#4caf87' : '#e05555'}`, borderRadius:8, padding:10, textAlign:'center', marginTop:8}}>
          <div style={{fontWeight:700, color:'#f0c060', fontSize:'1rem'}}>{state.result.handName}</div>
          <div style={{color: state.result.goldDelta >= 0 ? '#4caf87' : '#e05555', fontWeight:700, fontSize:'1.1rem'}}>
            {state.result.goldDelta >= 0 ? `+${state.result.goldDelta}G` : `${state.result.goldDelta}G`}
          </div>
          <button onClick={reset} style={{marginTop:8, padding:'6px 20px', background:'#2d3752', color:'#e8e6ff', border:'none', borderRadius:6, cursor:'pointer'}}>
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 汎用ゲームカード（スロット・宝箱・コインフリップ）
// ============================================================
function GenericGambleCard({ game, bet }: { game: GambleMaster; bet: number }) {
  const { changeGold, addItems, addNotification } = useGameStore();
  const player = useGameStore(s => s.player);
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);

  const play = () => {
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true);
    changeGold(-bet);
    setTimeout(() => {
      const r = resolveGenericGamble(game, bet);
      if (r.goldDelta > 0) changeGold(r.goldDelta + bet);
      if (r.itemRewards.length > 0) addItems(r.itemRewards);
      setResult(r);
      setAnimating(false);
    }, 700);
  };

  return (
    <div>
      {animating && <div style={{textAlign:'center', fontSize:'2rem', margin:'8px 0'}}>
        {game.type === 'slot' ? '🎰🎰🎰' : game.type === 'coin_flip' ? '🪙...' : '📦...'}
      </div>}
      {result && !animating && (
        <div style={{background: result.goldDelta >= 0 ? 'rgba(76,175,135,0.15)' : 'rgba(224,85,85,0.1)', border:`1px solid ${result.goldDelta >= 0 ? '#4caf87' : '#e05555'}`, borderRadius:8, padding:10, marginBottom:8, textAlign:'center'}}>
          {result.symbols && <div style={{fontSize:'1.8rem'}}>{result.symbols.join(' ')}</div>}
          <div style={{fontWeight:700, marginTop:4}}>{result.rewardLabel}</div>
          <div style={{color: result.goldDelta >= 0 ? '#4caf87' : '#e05555', fontWeight:700}}>{result.goldDelta >= 0 ? `+${result.goldDelta}G` : `${result.goldDelta}G`}</div>
          {result.itemRewards.map(r => (
            <div key={r.itemId} style={{fontSize:'0.8rem'}}>{ITEM_MASTER[r.itemId]?.icon} {ITEM_MASTER[r.itemId]?.name} ×{r.amount}</div>
          ))}
        </div>
      )}
      <button onClick={play} disabled={animating} style={{width:'100%', padding:10, background:'linear-gradient(135deg,#9b6df0,#7040cc)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700}}>
        {animating ? '...' : `${game.icon} プレイ（${bet}G）`}
      </button>
    </div>
  );
}

// ============================================================
// メイン
// ============================================================
const GAME_TABS = [
  { id:'chohan',     label:'丁半',       icon:'🎲' },
  { id:'chinchiro',  label:'チンチロ',   icon:'🎯' },
  { id:'jackpot',    label:'JP',         icon:'🌟' },
  { id:'poker',      label:'ポーカー',   icon:'🃏' },
  { id:'slot_machine',label:'スロット',  icon:'🎰' },
  { id:'coin_flip',  label:'コイン',     icon:'🪙' },
  { id:'treasure_box',label:'宝箱',      icon:'📦' },
] as const;
type GameTabId = typeof GAME_TABS[number]['id'];

export function GambleScreen() {
  const [gameId, setGameId] = useState<GameTabId>('chohan');
  const [bet, setBet] = useState(100);
  const player = useGameStore(s => s.player);
  const game = GAMBLE_MASTER[gameId];
  const minBet = game?.minBet ?? 10;
  const maxBet = game?.maxBet ?? 10000;

  const adjustedBet = Math.max(minBet, Math.min(maxBet, bet));

  return (
    <div style={{padding:'12px 8px'}}>
      <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', marginBottom:4, borderBottom:'1px solid #2d3752', paddingBottom:8}}>🎰 ギャンブル</h2>
      <p style={{color:'#f0a830', fontSize:'0.75rem', marginBottom:12}}>⚠️ ゲーム内通貨を使ったゲームです。節度を持って楽しみましょう！</p>

      {/* ゲーム種類タブ */}
      <div style={{display:'flex', gap:4, flexWrap:'wrap', marginBottom:16}}>
        {GAME_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setGameId(t.id)}
            style={{
              padding:'6px 10px', fontSize:'0.78rem',
              background: gameId === t.id ? 'rgba(155,109,240,0.3)' : '#1c2235',
              border: `1px solid ${gameId === t.id ? '#9b6df0' : '#2d3752'}`,
              color: gameId === t.id ? '#e8e6ff' : '#8a92b2',
              borderRadius:6, cursor:'pointer',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ゲーム説明 */}
      {game && (
        <div style={{background:'#161b26', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
            <span style={{fontWeight:700}}>{game.icon} {game.name}</span>
            <span style={{fontSize:'0.72rem', color:'#4caf87'}}>還元率 {Math.floor(game.returnRate*100)}%</span>
          </div>
          <p style={{fontSize:'0.78rem', color:'#8a92b2', marginBottom:10}}>{game.description}</p>

          {/* 賭け金設定（jackpotは固定100G） */}
          {game.type !== 'jackpot' && (
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12, fontSize:'0.85rem'}}>
              <span style={{color:'#8a92b2'}}>賭け金:</span>
              <button onClick={() => setBet(b => Math.max(minBet, b - minBet))} style={{width:28, height:28, borderRadius:4, background:'#2d3752', color:'#e8e6ff', border:'1px solid #2d3752', cursor:'pointer'}}>-</button>
              <input
                type="number" value={adjustedBet}
                onChange={e => setBet(Math.max(minBet, Math.min(maxBet, Number(e.target.value))))}
                style={{width:90, textAlign:'center', background:'#0d0f14', color:'#e8e6ff', border:'1px solid #2d3752', borderRadius:4, padding:'4px 8px', fontSize:'0.85rem'}}
              />
              <button onClick={() => setBet(b => Math.min(maxBet, b + minBet))} style={{width:28, height:28, borderRadius:4, background:'#2d3752', color:'#e8e6ff', border:'1px solid #2d3752', cursor:'pointer'}}>+</button>
              <button onClick={() => setBet(Math.min(maxBet, Math.floor((player?.gold ?? 0) / 2)))} style={{padding:'4px 8px', borderRadius:4, background:'#2d3752', color:'#8a92b2', border:'1px solid #2d3752', cursor:'pointer', fontSize:'0.75rem'}}>半額</button>
              <span style={{color:'#f0c060'}}>G</span>
            </div>
          )}

          {/* ゲーム本体 */}
          {gameId === 'chohan'      && <ChohanPanel bet={adjustedBet} />}
          {gameId === 'chinchiro'   && <ChinchiroPanel bet={adjustedBet} />}
          {gameId === 'jackpot'     && <JackpotPanel />}
          {gameId === 'poker'       && <PokerPanel bet={adjustedBet} />}
          {(gameId === 'slot_machine' || gameId === 'coin_flip' || gameId === 'treasure_box') && (
            <GenericGambleCard game={game} bet={adjustedBet} />
          )}
        </div>
      )}
    </div>
  );
}
