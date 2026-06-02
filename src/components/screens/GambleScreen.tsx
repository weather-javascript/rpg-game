// src/components/screens/GambleScreen.tsx
// ギャンブル画面：還元率改善済み＋収支レポート機能

import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GAMBLE_MASTER, ITEM_MASTER } from '../../data/masters';
import { playChohan, playChinchiro, dealPoker, drawPoker } from '../../systems/minigames';
import { contributeAndRollJackpot, subscribeJackpotPool } from '../../services/multiplayer';
import type { GambleResult, GambleMaster } from '../../types/game';
import type { PokerState } from '../../systems/minigames';

// ============================================================
// 収支トラッカー（セッション内）
// ============================================================
interface SessionStats {
  totalBet: number;
  totalWon: number;
  gamesPlayed: number;
  wins: number;
  biggestWin: number;
  biggestLoss: number;
}

const initStats = (): SessionStats => ({ totalBet: 0, totalWon: 0, gamesPlayed: 0, wins: 0, biggestWin: 0, biggestLoss: 0 });

// ============================================================
// 共通ギャンブルロジック
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
// 収支レポートパネル
// ============================================================
function SessionReport({ stats }: { stats: SessionStats }) {
  const netProfit = stats.totalWon - stats.totalBet;
  const rr = stats.totalBet > 0 ? ((stats.totalWon / stats.totalBet) * 100).toFixed(1) : '0.0';
  const winRate = stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: '0.78rem' }}>
      <div style={{ fontWeight: 700, color: '#8a92b2', marginBottom: 6 }}>📊 セッション収支</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <span style={{ color: '#4a5070' }}>ゲーム数: <span style={{ color: '#e8e6ff' }}>{stats.gamesPlayed}</span></span>
        <span style={{ color: '#4a5070' }}>勝率: <span style={{ color: '#5b8dee' }}>{winRate}%</span></span>
        <span style={{ color: '#4a5070' }}>総賭け: <span style={{ color: '#f0c060' }}>{stats.totalBet.toLocaleString()}G</span></span>
        <span style={{ color: '#4a5070' }}>実還元率: <span style={{ color: Number(rr) >= 95 ? '#4caf87' : '#e05555' }}>{rr}%</span></span>
        <span style={{ color: '#4a5070' }}>最大勝利: <span style={{ color: '#4caf87' }}>+{stats.biggestWin.toLocaleString()}G</span></span>
        <span style={{ color: '#4a5070' }}>最大損失: <span style={{ color: '#e05555' }}>-{stats.biggestLoss.toLocaleString()}G</span></span>
      </div>
      <div style={{ marginTop: 6, padding: '4px 8px', background: netProfit >= 0 ? 'rgba(76,175,135,0.1)' : 'rgba(224,85,85,0.1)', borderRadius: 4, textAlign: 'center' }}>
        <span style={{ fontWeight: 700, color: netProfit >= 0 ? '#4caf87' : '#e05555' }}>
          セッション収支: {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}G
        </span>
      </div>
    </div>
  );
}

// ============================================================
// 賭け金入力
// ============================================================
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
          style={{ padding: '3px 8px', background: '#1c2235', color: '#f0c060', border: '1px solid #f0c060', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
          MAX
        </button>
      </div>
      <input
        type="number" value={bet} min={game.minBet} max={Math.min(game.maxBet, player?.gold ?? 0)}
        onChange={e => setBet(Math.max(game.minBet, Math.min(game.maxBet, Number(e.target.value))))}
        style={{ width: '100%', padding: '6px 10px', background: '#1c2235', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box' }}
      />
      <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 3 }}>
        期待還元率: <span style={{ color: game.returnRate >= 0.96 ? '#4caf87' : '#f0a830' }}>{(game.returnRate * 100).toFixed(0)}%</span>
        　最小: {game.minBet.toLocaleString()}G 〜 最大: {game.maxBet.toLocaleString()}G
      </div>
    </div>
  );
}

// ============================================================
// 結果表示
// ============================================================
function ResultDisplay({ result }: { result: GambleResult }) {
  return (
    <div style={{
      background: result.goldDelta >= 0 ? 'rgba(76,175,135,0.15)' : 'rgba(224,85,85,0.1)',
      border: `1px solid ${result.goldDelta >= 0 ? '#4caf87' : '#e05555'}`,
      borderRadius: 8, padding: 10, marginBottom: 10, textAlign: 'center',
    }}>
      {result.symbols && <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{result.symbols.join(' ')}</div>}
      <div style={{ fontWeight: 700 }}>{result.rewardLabel}</div>
      <div style={{ color: result.goldDelta >= 0 ? '#4caf87' : '#e05555', fontWeight: 700, fontSize: '1.1rem' }}>
        {result.goldDelta >= 0 ? `+${result.goldDelta.toLocaleString()}G` : `${result.goldDelta.toLocaleString()}G`}
      </div>
      {result.itemRewards.length > 0 && (
        <div style={{ fontSize: '0.8rem', color: '#f0c060', marginTop: 4 }}>
          {result.itemRewards.map(r => `${ITEM_MASTER[r.itemId]?.icon} ${ITEM_MASTER[r.itemId]?.name} ×${r.amount}`).join('　')}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 丁半
// ============================================================
function ChohanPanel({ bet, onResult }: { bet: number; onResult: (r: GambleResult) => void }) {
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
      onResult(r);
      setAnimating(false);
    }, 600);
  };

  return (
    <div>
      {animating && <div style={{ textAlign: 'center', fontSize: '2rem', margin: '12px 0' }}>🎲🎲</div>}
      {result && !animating && <ResultDisplay result={result} />}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => play('cho')} disabled={animating}
          style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg,#5b8dee,#3d6fd0)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
          丁（偶数）
        </button>
        <button onClick={() => play('han')} disabled={animating}
          style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg,#e05555,#c03030)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
          半（奇数）
        </button>
      </div>
    </div>
  );
}

// ============================================================
// チンチロリン
// ============================================================
function ChinchiroPanel({ bet, onResult }: { bet: number; onResult: (r: GambleResult) => void }) {
  const { changeGold, addNotification } = useGameStore();
  const player = useGameStore(s => s.player);
  const [result, setResult] = useState<(GambleResult & { dice: number[] }) | null>(null);
  const [animating, setAnimating] = useState(false);
  const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  const play = () => {
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true);
    changeGold(-bet);
    setTimeout(() => {
      const r = playChinchiro(bet);
      if (r.goldDelta + bet > 0) changeGold(r.goldDelta + bet);
      setResult(r);
      onResult(r);
      setAnimating(false);
    }, 700);
  };

  return (
    <div>
      {animating && <div style={{ textAlign: 'center', fontSize: '2.5rem', margin: '12px 0' }}>🎲🎲🎲</div>}
      {result && !animating && (
        <>
          <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 4 }}>
            {result.dice?.map(d => DICE_FACES[d]).join(' ')}
          </div>
          <ResultDisplay result={result} />
        </>
      )}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 10, background: 'linear-gradient(135deg,#9b6df0,#7b4dd0)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
        🎲 サイコロを振る
      </button>
    </div>
  );
}

// ============================================================
// スロット / 宝箱（汎用）
// ============================================================
function GenericPanel({ game, bet, onResult }: { game: GambleMaster; bet: number; onResult: (r: GambleResult) => void }) {
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
      if (r.goldDelta + bet > 0) changeGold(r.goldDelta + bet);
      if (r.itemRewards.length > 0) addItems(r.itemRewards);
      setResult(r);
      onResult(r);
      setAnimating(false);
    }, 600);
  };

  return (
    <div>
      {animating && <div style={{ textAlign: 'center', fontSize: '2rem', margin: '12px 0' }}>{'✨'.repeat(3)}</div>}
      {result && !animating && <ResultDisplay result={result} />}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 10, background: 'linear-gradient(135deg,#f0a830,#c08020)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
        {game.icon} {game.name}
      </button>
    </div>
  );
}

// ============================================================
// コインフリップ
// ============================================================
function CoinFlipPanel({ bet, onResult }: { bet: number; onResult: (r: GambleResult) => void }) {
  const { changeGold, addNotification } = useGameStore();
  const player = useGameStore(s => s.player);
  const game = GAMBLE_MASTER['coin_flip'];
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);

  const play = () => {
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true);
    changeGold(-bet);
    setTimeout(() => {
      const r = resolveGenericGamble(game, bet);
      if (r.goldDelta + bet > 0) changeGold(r.goldDelta + bet);
      setResult(r);
      onResult(r);
      setAnimating(false);
    }, 500);
  };

  return (
    <div>
      {animating && <div style={{ textAlign: 'center', fontSize: '3rem', margin: '10px 0' }}>🪙</div>}
      {result && !animating && <ResultDisplay result={result} />}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={play} disabled={animating}
          style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg,#4caf87,#2d8f6f)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
          🪙 コインを投げる
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ポーカー
// ============================================================
function PokerPanel({ bet, onResult }: { bet: number; onResult: (r: GambleResult) => void }) {
  const { changeGold, addNotification } = useGameStore();
  const player = useGameStore(s => s.player);
  const [pokerState, setPokerState] = useState<PokerState | null>(null);
  const [result, setResult] = useState<GambleResult | null>(null);
  const [phase, setPhase] = useState<'idle' | 'discard' | 'done'>('idle');

  const deal = () => {
    if (!player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    changeGold(-bet);
    const ps = dealPoker(bet);
    setPokerState(ps);
    setPhase('discard');
    setResult(null);
  };

  const toggleHeld = (i: number) => {
    if (!pokerState || phase !== 'discard') return;
    const newHeld = [...pokerState.held];
    newHeld[i] = !newHeld[i];
    setPokerState({ ...pokerState, held: newHeld });
  };

  const draw = () => {
    if (!pokerState) return;
    const finalState = drawPoker(pokerState);
    setPokerState(finalState);
    if (finalState.result) {
      const r = finalState.result;
      if (r.goldDelta + bet > 0) changeGold(r.goldDelta + bet);
      setResult(r);
      onResult(r);
    }
    setPhase('done');
  };

  const SUIT_COLORS: Record<string, string> = { '♥': '#e05555', '♦': '#e05555', '♠': '#e8e6ff', '♣': '#e8e6ff' };

  return (
    <div>
      {phase === 'idle' && (
        <button onClick={deal}
          style={{ width: '100%', padding: 10, background: 'linear-gradient(135deg,#5b8dee,#3d6fd0)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
          🃏 ディール（{bet.toLocaleString()}G）
        </button>
      )}
      {(phase === 'discard' || phase === 'done') && pokerState && (
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {pokerState.hand.map((card, i) => (
              <button key={i} onClick={() => toggleHeld(i)}
                style={{
                  width: 50, height: 70, background: pokerState.held[i] ? 'rgba(76,175,135,0.3)' : '#e8e6ff',
                  border: `2px solid ${pokerState.held[i] ? '#4caf87' : '#2d3752'}`,
                  borderRadius: 6, cursor: phase === 'discard' ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: SUIT_COLORS[card.suit] ?? '#333',
                  fontWeight: 700, fontSize: '0.85rem', padding: 2,
                }}>
                <div style={{ fontSize: '0.8rem' }}>{card.rank <= 10 ? card.rank : ['J','Q','K','A'][card.rank - 11]}</div>
                <div style={{ fontSize: '1.2rem' }}>{card.suit}</div>
                {pokerState.held[i] && phase === 'discard' && <div style={{ fontSize: '0.6rem', color: '#4caf87' }}>HOLD</div>}
              </button>
            ))}
          </div>
          {phase === 'discard' && (
            <button onClick={draw}
              style={{ width: '100%', padding: 10, background: 'linear-gradient(135deg,#4caf87,#2d8f6f)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
              🔄 チェンジ（{pokerState.held.filter(h => !h).length}枚交換）
            </button>
          )}
          {phase === 'done' && result && (
            <>
              <ResultDisplay result={result} />
              <button onClick={() => setPhase('idle')}
                style={{ width: '100%', padding: 8, background: '#2d3752', color: '#8a92b2', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                もう一度
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ジャックポット
// ============================================================
function JackpotPanel({ onResult }: { onResult: (r: GambleResult) => void }) {
  const { changeGold, addNotification } = useGameStore();
  const player = useGameStore(s => s.player);
  const game = GAMBLE_MASTER['jackpot'];
  const [pool, setPool] = useState(0);
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const unsub = subscribeJackpotPool(setPool);
    return unsub;
  }, []);

  const play = async () => {
    if (animating || !player || player.gold < 100) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true);
    changeGold(-100);
    try {
      const { won: jackpotWon, pool: newPool } = await contributeAndRollJackpot(100);
      setPool(newPool);
      if (jackpotWon) {
        changeGold(newPool);
        const r: GambleResult = { rewardLabel: '🌟 JACKPOT!! 🌟', multiplier: newPool / 100, goldDelta: newPool - 100, itemRewards: [], symbols: ['🌟', '🌟', '🌟'] };
        setResult(r);
        onResult(r);
        addNotification('success', `🌟 JACKPOT!! ${newPool.toLocaleString()}G獲得！`);
      } else {
        const r: GambleResult = { rewardLabel: 'はずれ', multiplier: 0, goldDelta: -100, itemRewards: [], symbols: ['💨', '💨', '💨'] };
        setResult(r);
        onResult(r);
      }
    } catch {
      const r = resolveGenericGamble(game, 100);
      if (r.multiplier > 0) changeGold(r.multiplier > 1 ? pool : Math.floor(100 * r.multiplier));
      setResult(r);
      onResult(r);
    }
    setAnimating(false);
  };

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '10px 0', marginBottom: 8 }}>
        <div style={{ fontSize: '0.8rem', color: '#8a92b2' }}>現在のジャックポット</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f0c060' }}>{pool.toLocaleString()}G</div>
      </div>
      {animating && <div style={{ textAlign: 'center', fontSize: '2rem' }}>🌟🌟🌟</div>}
      {result && !animating && <ResultDisplay result={result} />}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#f0c060,#c09030)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        🌟 100G で挑戦
      </button>
    </div>
  );
}

// ============================================================
// メイン画面
// ============================================================
type GameTab = 'chohan' | 'chinchiro' | 'slot' | 'coin_flip' | 'poker' | 'jackpot' | 'treasure_box';

const GAME_TABS: { id: GameTab; label: string; icon: string }[] = [
  { id: 'chohan',       label: '丁半',     icon: '🎲' },
  { id: 'chinchiro',    label: 'チンチロ', icon: '🎯' },
  { id: 'coin_flip',    label: 'コイン',   icon: '🪙' },
  { id: 'slot',         label: 'スロット', icon: '🎰' },
  { id: 'poker',        label: 'ポーカー', icon: '🃏' },
  { id: 'treasure_box', label: '宝箱',     icon: '📦' },
  { id: 'jackpot',      label: 'JP',       icon: '🌟' },
];

export function GambleScreen() {
  const player = useGameStore(s => s.player);
  const [activeGame, setActiveGame] = useState<GameTab>('chohan');
  const [bet, setBet] = useState(100);
  const [showReport, setShowReport] = useState(false);
  const [stats, setStats] = useState<SessionStats>(initStats());
  const [showAdvice, setShowAdvice] = useState(false);

  const game = GAMBLE_MASTER[activeGame] ?? GAMBLE_MASTER['chohan'];

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

  if (!player) return null;

  const netProfit = stats.totalWon - stats.totalBet;
  const realRR = stats.totalBet > 0 ? (stats.totalWon / stats.totalBet * 100).toFixed(1) : null;

  return (
    <div style={{ padding: '12px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', borderBottom: '1px solid #2d3752', paddingBottom: 8, flex: 1 }}>🎰 ギャンブル</h2>
        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
          <button onClick={() => setShowReport(!showReport)}
            style={{ padding: '4px 8px', background: '#1c2235', border: '1px solid #5b8dee', color: '#5b8dee', borderRadius: 5, cursor: 'pointer', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
            📊 収支
          </button>
          <button onClick={() => setShowAdvice(!showAdvice)}
            style={{ padding: '4px 8px', background: '#1c2235', border: '1px solid #f0a830', color: '#f0a830', borderRadius: 5, cursor: 'pointer', fontSize: '0.72rem' }}>
            💡 改善
          </button>
        </div>
      </div>

      {/* 改善レポートパネル */}
      {showAdvice && (
        <div style={{ background: '#161b26', border: '2px solid #f0a830', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: '0.8rem' }}>
          <div style={{ fontWeight: 700, color: '#f0a830', marginBottom: 8 }}>💡 ギャンブル改善レポート（旧バージョンの問題と改善点）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { title: '🔴 コインフリップ (旧: 還元率 96%)', issue: '表48% vs 裏52% と非対称。長期では必ず損', fix: '→ 表49% / 裏51%に改善。還元率98%に向上' },
              { title: '🔴 スロット (旧: 還元率 92%)', issue: '中間配当(×1.2)が少なく、ハズレ62.5%で資金が急速に減少', fix: '→ 2枚揃い確率28%・配当×1.3に改善。還元率96%' },
              { title: '🔴 宝箱くじ (旧: 還元率 85%)', issue: 'ハズレ24%・空振り30%で約半分が無価値な報酬', fix: '→ 小G配当2.0倍・回復セット強化。還元率92%に改善' },
              { title: '🟡 チンチロリン (旧: 還元率 93%)', issue: '目なし20%・通常配当×1.5が低すぎて期待値が低い', fix: '→ 通常×1.6・ヒフミ0.5倍返し。還元率96%' },
              { title: '🟡 丁半 (旧: 還元率 95%)', issue: 'ゾロ目で賭け金半没収(×0.5)は引き分け扱いなのに損が大きい', fix: '→ ゾロ目を×0.7返しに改善。還元率97%' },
              { title: '🟢 ポーカー', issue: 'ワンペアで1.0倍返し（損益ゼロ）のため長期で減りがち', fix: '→ JJ以上ワンペアを×1.5に改善。還元率99%' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '6px 8px' }}>
                <div style={{ fontWeight: 700, color: '#e8e6ff', marginBottom: 2 }}>{item.title}</div>
                <div style={{ color: '#e05555' }}>❌ 問題: {item.issue}</div>
                <div style={{ color: '#4caf87' }}>✅ {item.fix}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(76,175,135,0.1)', borderRadius: 6, color: '#4caf87', fontSize: '0.75rem' }}>
            💎 推奨: 長期安定ならコインフリップ(98%)・短期高リターンならポーカー(99%)。ジャックポットはロマン枠。
          </div>
        </div>
      )}

      {/* 収支レポート */}
      {showReport && stats.gamesPlayed > 0 && <SessionReport stats={stats} />}

      {/* セッション簡易インジケーター */}
      {stats.gamesPlayed > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.75rem' }}>
          <span style={{ color: '#4a5070' }}>収支:</span>
          <span style={{ color: netProfit >= 0 ? '#4caf87' : '#e05555', fontWeight: 700 }}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}G
          </span>
          {realRR && <span style={{ color: '#8a92b2' }}>実還元率: {realRR}%</span>}
        </div>
      )}

      {/* ゲームタブ */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
        {GAME_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveGame(t.id)}
            style={{
              flexShrink: 0, padding: '6px 10px', fontSize: '0.75rem',
              background: activeGame === t.id ? 'rgba(91,141,238,0.2)' : '#1c2235',
              border: `1px solid ${activeGame === t.id ? '#5b8dee' : '#2d3752'}`,
              color: activeGame === t.id ? '#e8e6ff' : '#8a92b2',
              borderRadius: 6, cursor: 'pointer',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ゲームパネル */}
      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{game.icon} {game.name}</div>
          <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginTop: 2 }}>{game.description}</div>
        </div>

        {activeGame !== 'jackpot' && <BetInput game={game} bet={bet} setBet={setBet} />}

        {activeGame === 'chohan'       && <ChohanPanel       bet={bet} onResult={handleResult} />}
        {activeGame === 'chinchiro'    && <ChinchiroPanel    bet={bet} onResult={handleResult} />}
        {activeGame === 'coin_flip'    && <CoinFlipPanel     bet={bet} onResult={handleResult} />}
        {activeGame === 'slot'         && <GenericPanel game={GAMBLE_MASTER['slot_machine']}   bet={bet} onResult={handleResult} />}
        {activeGame === 'treasure_box' && <GenericPanel game={GAMBLE_MASTER['treasure_box']}   bet={100} onResult={handleResult} />}
        {activeGame === 'poker'        && <PokerPanel        bet={bet} onResult={handleResult} />}
        {activeGame === 'jackpot'      && <JackpotPanel      onResult={handleResult} />}
      </div>

      {/* 配当表 */}
      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: 'pointer', color: '#8a92b2', fontSize: '0.8rem', padding: '6px 0' }}>📋 配当表を見る</summary>
        <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 8, padding: 10, marginTop: 6 }}>
          {game.rewardTable.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '3px 0', borderBottom: '1px solid #2d3752', color: '#8a92b2' }}>
              <span>{r.label}</span>
              <span>
                <span style={{ color: '#f0c060' }}>×{r.multiplier}</span>
                <span style={{ color: '#4a5070', marginLeft: 8 }}>{(r.probability * 100).toFixed(2)}%</span>
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
