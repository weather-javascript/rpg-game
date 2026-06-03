// src/components/screens/GambleScreen.tsx
// ジャックポットは他のギャンブルで蓄積する仕様に変更
// PvP対戦機能追加

import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GAMBLE_MASTER, ITEM_MASTER } from '../../data/masters';
import { playChohan, playChinchiro, dealPoker, drawPoker } from '../../systems/minigames';
import {
  contributeToJackpot, checkJackpotWin, subscribeJackpotPool,
  createGambleBattle, subscribeGambleBattles, joinGambleBattle, cancelGambleBattle,
} from '../../services/multiplayer';
import type { GambleResult, GambleMaster } from '../../types/game';
import type { PokerState } from '../../systems/minigames';
import type { GambleBattle } from '../../types/game';

interface SessionStats {
  totalBet: number; totalWon: number; gamesPlayed: number; wins: number; biggestWin: number; biggestLoss: number;
}
const initStats = (): SessionStats => ({ totalBet: 0, totalWon: 0, gamesPlayed: 0, wins: 0, biggestWin: 0, biggestLoss: 0 });

function resolveGenericGamble(game: GambleMaster, bet: number, multiplierBonus = 1.0): GambleResult {
  const rand = Math.random();
  let cum = 0;
  for (const r of game.rewardTable) {
    cum += r.probability;
    if (rand < cum) {
      const effectiveMult = r.multiplier > 0 ? r.multiplier * multiplierBonus : 0;
      const goldDelta = Math.floor(bet * effectiveMult) - bet;
      return { rewardLabel: r.label, multiplier: effectiveMult, goldDelta, itemRewards: r.itemRewards ?? [], symbols: r.symbols };
    }
  }
  const last = game.rewardTable[game.rewardTable.length - 1];
  return { rewardLabel: last.label, multiplier: last.multiplier, goldDelta: Math.floor(bet * last.multiplier) - bet, itemRewards: last.itemRewards ?? [], symbols: last.symbols };
}

function ResultDisplay({ result }: { result: GambleResult }) {
  const isWin = result.goldDelta >= 0;
  return (
    <div style={{ padding: '10px', background: isWin ? 'rgba(76,175,135,0.1)' : 'rgba(224,85,85,0.1)', border: `1px solid ${isWin ? '#4caf87' : '#e05555'}`, borderRadius: 8, marginBottom: 10, textAlign: 'center' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isWin ? '#4caf87' : '#e05555', marginBottom: 4 }}>
        {result.symbols?.join(' ') ?? ''} {result.rewardLabel}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: isWin ? '#4caf87' : '#e05555' }}>
        {isWin ? `+${result.goldDelta.toLocaleString()}G` : `${result.goldDelta.toLocaleString()}G`}
      </div>
      {result.itemRewards.length > 0 && (
        <div style={{ marginTop: 6, fontSize: '0.8rem' }}>
          {result.itemRewards.map(r => <span key={r.itemId}>{ITEM_MASTER[r.itemId]?.icon} {ITEM_MASTER[r.itemId]?.name} ×{r.amount} </span>)}
        </div>
      )}
    </div>
  );
}

// ジャックポット表示（蓄積のみ、対戦中に偶然発生）
function JackpotBanner({ pool }: { pool: number }) {
  if (pool <= 0) return null;
  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(240,192,96,0.15),rgba(240,168,48,0.15))', border: '2px solid #f0c060', borderRadius: 10, padding: '10px 14px', marginBottom: 12, textAlign: 'center' }}>
      <div style={{ fontSize: '0.8rem', color: '#8a92b2', marginBottom: 2 }}>🌟 現在のジャックポットプール</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f0c060' }}>{pool.toLocaleString()}G</div>
      <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 4 }}>他のギャンブルをプレイするたびに蓄積されます。超低確率で自動当選！</div>
    </div>
  );
}

// 賭け金入力
function BetInput({ game, bet, setBet }: { game: GambleMaster; bet: number; setBet: (v: number) => void }) {
  const player = useGameStore(s => s.player);
  const presets = [game.minBet, Math.floor(game.maxBet * 0.1), Math.floor(game.maxBet * 0.25), game.maxBet].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {presets.map(p => (
          <button key={p} onClick={() => setBet(Math.min(p, player?.gold ?? 0))}
            style={{ padding: '3px 8px', background: bet === p ? '#5b8dee' : '#1c2235', color: bet === p ? '#fff' : '#8a92b2', border: `1px solid ${bet === p ? '#5b8dee' : '#2d3752'}`, borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
            {p.toLocaleString()}G
          </button>
        ))}
        <button onClick={() => setBet(Math.min(player?.gold ?? 0, game.maxBet))}
          style={{ padding: '3px 8px', background: '#1c2235', color: '#f0c060', border: '1px solid #f0c060', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>MAX</button>
      </div>
      <input type="number" value={bet} min={game.minBet} max={Math.min(game.maxBet, player?.gold ?? 0)}
        onChange={e => setBet(Math.max(game.minBet, Math.min(game.maxBet, Number(e.target.value))))}
        style={{ width: '100%', padding: '6px 10px', background: '#1c2235', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box' as const }}
      />
    </div>
  );
}

// ============================================================
// PvP対戦パネル
// ============================================================
function PvPPanel({ bet }: { bet: number }) {
  const player = useGameStore(s => s.player);
  const changeGold = useGameStore(s => s.changeGold);
  const addNotification = useGameStore(s => s.addNotification);
  const [battles, setBattles] = useState<GambleBattle[]>([]);
  const [myBattleId, setMyBattleId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState('chohan');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeGambleBattles(setBattles);
    return unsub;
  }, []);

  const GAME_NAMES: Record<string, string> = {
    chohan: '丁半', chinchiro: 'チンチロリン', coin_flip: 'コインフリップ', slot_machine: 'スロット',
  };

  const handleHost = async () => {
    if (!player || player.gold < bet) { addNotification('error', 'ゴールドが足りません'); return; }
    if (myBattleId) { addNotification('warning', '既に募集中です'); return; }
    setLoading(true);
    try {
      const id = await createGambleBattle(player.uid, player.displayName, player.stats.level, selectedGame, bet);
      setMyBattleId(id);
      addNotification('success', `⚔️ 対戦を募集開始しました！ (${bet.toLocaleString()}G)`);
    } catch { addNotification('error', '募集に失敗しました'); }
    setLoading(false);
  };

  const handleCancelHost = async () => {
    if (!player || !myBattleId) return;
    setLoading(true);
    try {
      await cancelGambleBattle(myBattleId, player.uid);
      setMyBattleId(null);
      addNotification('info', '募集をキャンセルしました');
    } catch { addNotification('error', 'キャンセルに失敗しました'); }
    setLoading(false);
  };

  const handleJoin = async (battle: GambleBattle) => {
    if (!player) return;
    if (player.gold < battle.betAmount) { addNotification('error', 'ゴールドが足りません'); return; }
    setLoading(true);
    try {
      const { success, battle: result } = await joinGambleBattle(battle.id, player.uid, player.displayName);
      if (success && result) {
        const iWon = result.winnerId === player.uid;
        const prize = battle.betAmount * 2;
        if (iWon) {
          changeGold(battle.betAmount); // 自分のbet + 相手のbet = 2倍 → netは+betAmount
          addNotification('success', `🏆 対戦勝利！+${battle.betAmount.toLocaleString()}G`);
        } else {
          changeGold(-battle.betAmount);
          addNotification('error', `💔 対戦敗北... -${battle.betAmount.toLocaleString()}G`);
        }
      } else {
        addNotification('error', '参加に失敗しました（既に終了）');
      }
    } catch { addNotification('error', '参加に失敗しました'); }
    setLoading(false);
  };

  const otherBattles = battles.filter(b => b.hostUid !== player?.uid);
  const myBattle = battles.find(b => b.id === myBattleId);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.85rem', color: '#f0c060', fontWeight: 700, marginBottom: 8 }}>⚔️ 対戦を募集する</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {Object.entries(GAME_NAMES).map(([id, name]) => (
            <button key={id} onClick={() => setSelectedGame(id)}
              style={{ flex: 1, padding: '5px 4px', fontSize: '0.72rem', background: selectedGame === id ? 'rgba(91,141,238,0.2)' : '#1c2235', border: `1px solid ${selectedGame === id ? '#5b8dee' : '#2d3752'}`, color: selectedGame === id ? '#e8e6ff' : '#8a92b2', borderRadius: 4, cursor: 'pointer' }}>
              {name}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginBottom: 8 }}>掛け金: {bet.toLocaleString()}G | ゲーム: {GAME_NAMES[selectedGame]}</div>
        {myBattleId && myBattle ? (
          <div style={{ background: 'rgba(91,141,238,0.1)', border: '1px solid #5b8dee', borderRadius: 6, padding: '8px 10px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#5b8dee' }}>🔄 参加者募集中...</span>
            <button onClick={handleCancelHost} disabled={loading} style={{ padding: '4px 10px', background: '#e05555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>取消</button>
          </div>
        ) : (
          <button onClick={handleHost} disabled={loading || (player?.gold ?? 0) < bet}
            style={{ width: '100%', padding: '8px', background: (player?.gold ?? 0) >= bet ? 'linear-gradient(135deg,#5b8dee,#3a6fd0)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            ⚔️ {bet.toLocaleString()}G で対戦を募集する
          </button>
        )}
      </div>

      <div style={{ fontSize: '0.85rem', color: '#f0c060', fontWeight: 700, marginBottom: 8 }}>🔍 募集中の対戦 ({otherBattles.length}件)</div>
      {otherBattles.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#4a5070', fontSize: '0.82rem', padding: '16px 0' }}>現在募集中の対戦はありません</div>
      ) : (
        otherBattles.map(b => (
          <div key={b.id} style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚔️ {b.hostName}</span>
                <span style={{ marginLeft: 6, fontSize: '0.72rem', color: '#5b8dee' }}>Lv.{b.hostLevel}</span>
              </div>
              <span style={{ color: '#f0c060', fontWeight: 700 }}>{b.betAmount.toLocaleString()}G</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginBottom: 8 }}>
              ゲーム: {GAME_NAMES[b.gambleType] ?? b.gambleType} | 勝者獲得: {(b.betAmount * 2).toLocaleString()}G
            </div>
            <button onClick={() => handleJoin(b)} disabled={loading || (player?.gold ?? 0) < b.betAmount}
              style={{ width: '100%', padding: '6px', background: (player?.gold ?? 0) >= b.betAmount ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
              {(player?.gold ?? 0) >= b.betAmount ? `参加する (${b.betAmount.toLocaleString()}G)` : 'Gが足りない'}
            </button>
          </div>
        ))
      )}
    </div>
  );
}

// ============================================================
// 各ゲームパネル（ジャックポット積立付き）
// ============================================================
function GenericPanel({ game, bet, onResult, onJackpotContrib }: { game: GambleMaster; bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void }) {
  const { player, changeGold, addItems, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addItems: s.addItems, addNotification: s.addNotification }));
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);

  const play = async () => {
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true);
    changeGold(-bet);
    onJackpotContrib(bet); // ジャックポット積立

    await new Promise(r => setTimeout(r, 400));
    const r = resolveGenericGamble(game, bet);
    if (r.multiplier > 0) changeGold(Math.floor(bet * r.multiplier));
    if (r.itemRewards.length > 0) addItems(r.itemRewards);
    setResult(r);
    onResult(r);

    // ジャックポット当選チェック
    try {
      const { won, pool } = await checkJackpotWin();
      if (won && pool > 0) {
        changeGold(pool);
        addNotification('success', `🌟🌟🌟 JACKPOT!! ${pool.toLocaleString()}G獲得！！🌟🌟🌟`);
      }
    } catch { /* ignore */ }

    setAnimating(false);
  };

  return (
    <div>
      {animating && <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}>🎲🎲🎲</div>}
      {result && !animating && <ResultDisplay result={result} />}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 12, background: animating ? '#2d3752' : 'linear-gradient(135deg,#5b8dee,#3a6fd0)', color: '#fff', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        {animating ? '結果を出しています...' : `${game.icon} ${bet.toLocaleString()}G で挑戦`}
      </button>
    </div>
  );
}

function ChohanPanel({ bet, onResult, onJackpotContrib }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void }) {
  const { player, changeGold, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addNotification: s.addNotification }));
  const [choice, setChoice] = useState<'cho'|'han'>('cho');
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);

  const play = async () => {
    if (!player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true);
    changeGold(-bet);
    onJackpotContrib(bet);
    await new Promise(r => setTimeout(r, 500));
    const r = playChohan(bet, choice);
    if (r.goldDelta > 0) changeGold(r.goldDelta + bet);
    setResult(r); onResult(r);
    try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeGold(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}G！`); } } catch { /* ignore */ }
    setAnimating(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {(['cho','han'] as const).map(c => (
          <button key={c} onClick={() => setChoice(c)}
            style={{ flex: 1, padding: '10px', background: choice === c ? (c==='cho' ? '#5b8dee' : '#e05555') : '#1c2235', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
            {c==='cho' ? '丁（偶数）' : '半（奇数）'}
          </button>
        ))}
      </div>
      {animating && <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}>🎲🎲</div>}
      {result && !animating && <ResultDisplay result={result} />}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 12, background: animating ? '#2d3752' : 'linear-gradient(135deg,#e05555,#c03030)', color: '#fff', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        🎲 {bet.toLocaleString()}G で投じる
      </button>
    </div>
  );
}

function ChinchiroPanel({ bet, onResult, onJackpotContrib }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void }) {
  const { player, changeGold, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addNotification: s.addNotification }));
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);

  const play = async () => {
    if (!player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true); changeGold(-bet); onJackpotContrib(bet);
    await new Promise(r => setTimeout(r, 600));
    const r = playChinchiro(bet);
    if (r.multiplier > 0) changeGold(Math.floor(bet * r.multiplier));
    setResult(r); onResult(r);
    try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeGold(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}G！`); } } catch { /* ignore */ }
    setAnimating(false);
  };

  return (
    <div>
      {animating && <div style={{ textAlign: 'center', fontSize: '2rem' }}>🎲🎲🎲</div>}
      {result && !animating && (
        <div>
          <div style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: 6 }}>{result.dice?.join(' ') ?? ''}</div>
          <ResultDisplay result={result} />
        </div>
      )}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 12, background: animating ? '#2d3752' : 'linear-gradient(135deg,#f0a830,#c08020)', color: '#000', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        🎯 {bet.toLocaleString()}G でサイコロを振る
      </button>
    </div>
  );
}

function CoinFlipPanel({ bet, onResult, onJackpotContrib }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void }) {
  const { player, changeGold, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addNotification: s.addNotification }));
  const [choice, setChoice] = useState<'heads'|'tails'>('heads');
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const game = GAMBLE_MASTER['coin_flip'];

  const play = async () => {
    if (!player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true); changeGold(-bet); onJackpotContrib(bet);
    await new Promise(r => setTimeout(r, 500));
    const rand = Math.random();
    const win = (choice === 'heads' && rand < 0.49) || (choice === 'tails' && rand >= 0.49);
    const r: GambleResult = win
      ? { rewardLabel: '当たり！', multiplier: 2, goldDelta: bet, itemRewards: [], symbols: ['✨'] }
      : { rewardLabel: 'ハズレ', multiplier: 0, goldDelta: -bet, itemRewards: [], symbols: ['💨'] };
    if (win) changeGold(bet * 2);
    setResult(r); onResult(r);
    try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeGold(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}G！`); } } catch { /* ignore */ }
    setAnimating(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {(['heads','tails'] as const).map(c => (
          <button key={c} onClick={() => setChoice(c)}
            style={{ flex: 1, padding: '10px', background: choice === c ? '#5b8dee' : '#1c2235', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
            {c==='heads' ? '🌕 表' : '🌑 裏'}
          </button>
        ))}
      </div>
      {animating && <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}>🪙</div>}
      {result && !animating && <ResultDisplay result={result} />}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 12, background: animating ? '#2d3752' : 'linear-gradient(135deg,#4caf87,#2d8060)', color: '#fff', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        🪙 {bet.toLocaleString()}G でコインを投げる
      </button>
    </div>
  );
}

function PokerPanel({ bet, onResult, onJackpotContrib }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void }) {
  const { player, changeGold, addItems, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addItems: s.addItems, addNotification: s.addNotification }));
  const [pokerState, setPokerState] = useState<PokerState | null>(null);
  const [hold, setHold] = useState<boolean[]>([false,false,false,false,false]);
  const [phase, setPhase] = useState<'idle'|'deal'|'draw'|'result'>('idle');
  const [result, setResult] = useState<GambleResult | null>(null);

  const suitIcon = (s: string) => ({ S:'♠️',H:'♥️',D:'♦️',C:'♣️' }[s]??s);
  const cardStyle = (selected: boolean) => ({
    width:44, height:64, background: selected ? 'rgba(91,141,238,0.3)' : '#1c2235', border:`2px solid ${selected ? '#5b8dee' : '#2d3752'}`,
    borderRadius:6, display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center',
    cursor:'pointer', fontSize:'0.9rem', fontWeight:700, transition:'all 0.15s',
  });

  const handleDeal = () => {
    if (!player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    changeGold(-bet); onJackpotContrib(bet);
    const state = dealPoker();
    setPokerState(state);
    setHold([false,false,false,false,false]);
    setPhase('deal');
  };

  const handleDraw = async () => {
    if (!pokerState) return;
    const { result: r, newState } = drawPoker(pokerState, hold);
    setPokerState(newState);
    setPhase('result');
    if (r.multiplier > 0) changeGold(Math.floor(bet * r.multiplier));
    if (r.itemRewards.length > 0) addItems(r.itemRewards);
    setResult(r); onResult(r);
    try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeGold(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}G！`); } } catch { /* ignore */ }
  };

  return (
    <div>
      {pokerState && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
            {pokerState.hand.map((card, i) => (
              <div key={i} onClick={() => phase==='deal' && setHold(prev => { const n=[...prev]; n[i]=!n[i]; return n; })} style={cardStyle(hold[i])}>
                <span>{card.rank}</span>
                <span>{suitIcon(card.suit)}</span>
                {phase==='deal' && <span style={{fontSize:'0.55rem', color: hold[i] ? '#5b8dee' : '#4a5070'}}>{hold[i]?'HOLD':'　'}</span>}
              </div>
            ))}
          </div>
          {phase==='result' && result && <ResultDisplay result={result} />}
        </div>
      )}
      {phase==='idle' && (
        <button onClick={handleDeal} style={{ width:'100%', padding:12, background:'linear-gradient(135deg,#9b6df0,#7040c0)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'1rem' }}>
          🃏 {bet.toLocaleString()}G でカードを引く
        </button>
      )}
      {phase==='deal' && (
        <button onClick={handleDraw} style={{ width:'100%', padding:12, background:'linear-gradient(135deg,#e05555,#c03030)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'1rem' }}>
          🔄 チェンジ（HOLDしないカードを交換）
        </button>
      )}
      {phase==='result' && (
        <button onClick={() => { setPhase('idle'); setPokerState(null); setResult(null); }}
          style={{ width:'100%', padding:10, background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:8, cursor:'pointer', marginTop:8 }}>
          もう一度
        </button>
      )}
    </div>
  );
}

// ============================================================
// メイン画面
// ============================================================
type GameTab = 'chohan'|'chinchiro'|'coin_flip'|'slot'|'poker'|'treasure_box'|'pvp';
const GAME_TABS: { id: GameTab; label: string; icon: string }[] = [
  { id:'chohan',       label:'丁半',     icon:'🎲' },
  { id:'chinchiro',    label:'チンチロ', icon:'🎯' },
  { id:'coin_flip',    label:'コイン',   icon:'🪙' },
  { id:'slot',         label:'スロット', icon:'🎰' },
  { id:'poker',        label:'ポーカー', icon:'🃏' },
  { id:'treasure_box', label:'宝箱',     icon:'📦' },
  { id:'pvp',          label:'対戦',     icon:'⚔️' },
];

export function GambleScreen() {
  const player = useGameStore(s => s.player);
  const [activeGame, setActiveGame] = useState<GameTab>('chohan');
  const [bet, setBet] = useState(100);
  const [stats, setStats] = useState<SessionStats>(initStats());
  const [jackpotPool, setJackpotPool] = useState(0);

  useEffect(() => {
    const unsub = subscribeJackpotPool(setJackpotPool);
    return unsub;
  }, []);

  const handleResult = (r: GambleResult) => {
    setStats(prev => {
      const isWin = r.goldDelta >= 0;
      return {
        totalBet: prev.totalBet + bet,
        totalWon: prev.totalWon + Math.max(0, r.goldDelta + bet),
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins + (isWin ? 1 : 0),
        biggestWin: isWin ? Math.max(prev.biggestWin, r.goldDelta) : prev.biggestWin,
        biggestLoss: !isWin ? Math.max(prev.biggestLoss, Math.abs(r.goldDelta)) : prev.biggestLoss,
      };
    });
  };

  const handleJackpotContrib = async (betAmt: number) => {
    try { await contributeToJackpot(betAmt); } catch { /* ignore */ }
  };

  if (!player) return null;
  const game = GAMBLE_MASTER[activeGame] ?? GAMBLE_MASTER['chohan'];
  const netProfit = stats.totalWon - stats.totalBet;

  return (
    <div style={{ padding: '12px 8px' }}>
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', marginBottom: 8, borderBottom: '1px solid #2d3752', paddingBottom: 8 }}>🎰 ギャンブル</h2>

      <JackpotBanner pool={jackpotPool} />

      {stats.gamesPlayed > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.75rem' }}>
          <span style={{ color: '#4a5070' }}>収支:</span>
          <span style={{ color: netProfit >= 0 ? '#4caf87' : '#e05555', fontWeight: 700 }}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}G
          </span>
          <span style={{ color: '#8a92b2' }}>{stats.gamesPlayed}戦 {stats.wins}勝</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
        {GAME_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveGame(t.id)}
            style={{ flexShrink: 0, padding: '6px 10px', fontSize: '0.75rem', background: activeGame===t.id ? 'rgba(91,141,238,0.2)' : '#1c2235', border: `1px solid ${activeGame===t.id ? '#5b8dee' : '#2d3752'}`, color: activeGame===t.id ? '#e8e6ff' : '#8a92b2', borderRadius: 6, cursor: 'pointer' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
        {activeGame !== 'pvp' && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{game.icon} {game.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginTop: 2 }}>{game.description}</div>
          </div>
        )}
        {activeGame !== 'pvp' && <BetInput game={game} bet={bet} setBet={setBet} />}

        {activeGame === 'chohan'       && <ChohanPanel    bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} />}
        {activeGame === 'chinchiro'    && <ChinchiroPanel bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} />}
        {activeGame === 'coin_flip'    && <CoinFlipPanel  bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} />}
        {activeGame === 'slot'         && <GenericPanel game={GAMBLE_MASTER['slot_machine']}  bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} />}
        {activeGame === 'treasure_box' && <GenericPanel game={GAMBLE_MASTER['treasure_box']}  bet={100} onResult={handleResult} onJackpotContrib={handleJackpotContrib} />}
        {activeGame === 'poker'        && <PokerPanel    bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} />}
        {activeGame === 'pvp'          && (
          <>
            <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:8 }}>⚔️ PvP対戦</div>
            <BetInput game={GAMBLE_MASTER['chohan']} bet={bet} setBet={setBet} />
            <PvPPanel bet={bet} />
          </>
        )}
      </div>

      {activeGame !== 'pvp' && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', color: '#8a92b2', fontSize: '0.8rem', padding: '6px 0' }}>📋 配当表</summary>
          <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 8, padding: 10, marginTop: 6 }}>
            {game.rewardTable.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '3px 0', borderBottom: '1px solid #2d3752', color: '#8a92b2' }}>
                <span>{r.label}</span>
                <span><span style={{ color: '#f0c060' }}>×{r.multiplier}</span><span style={{ color: '#4a5070', marginLeft: 8 }}>{(r.probability * 100).toFixed(2)}%</span></span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
