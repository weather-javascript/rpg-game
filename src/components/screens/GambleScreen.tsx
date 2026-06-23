// src/components/screens/GambleScreen.tsx
// ジャックポットは他のギャンブルで蓄積する仕様に変更
// PvP対戦機能追加
import { GameIcon } from '../icons';
import { secureRandom } from '../../utils/random';
import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GAMBLE_MASTER, ITEM_MASTER } from '../../data/masters';
import { playChohan, playChinchiro, dealPoker, drawPoker } from '../../systems/minigames';
import { MISSION_DEFS, GAMBLE_RANK_DEFS, getMissionRewardBonus, ensureMissionProgress } from '../../data/missions';
import {
  contributeToJackpot, checkJackpotWin, subscribeJackpotPool,
  createGambleBattle, subscribeGambleBattles, joinGambleBattle, cancelGambleBattle,
  subscribeGambleMultipliers, subscribeGambleBattle,
  postActivityFeed,
  postGambleFeed,
  createPokerTable, subscribePokerTables, subscribePokerTable,
  joinPokerTable, cancelPokerTable, leavePokerTable, startPokerGame, pokerAction,
  subscribeTreasureProbs,
  contributeToSlotJackpot, subscribeSlotJackpotPool, checkSlotJackpotWin,
  subscribeGambleRanking, updateGambleRanking,
  subscribeActiveBattles, spectateGambleBattle, joinSpectate, leaveSpectate,
  subscribeStockPrices, tickStockPrices, STOCK_MASTERS, updateStockRanking, subscribeStockRanking, getTrendLabel, getVolatilityLabel,
  STOCK_ID_LIST, getMarketStatus, MARKET_OPEN_HOUR, MARKET_CLOSE_HOUR,
} from '../../services/multiplayer';
import type { TreasureProbEntry, GambleRankingEntry, StockRankingEntry } from '../../services/multiplayer';
import type { GambleResult, GambleMaster, PokerTable, BattleHistoryEntry as _BH, StockId, StockSector, StockHolding, StockPricePoint, StockTrendData } from '../../types/game';
import type { PokerState } from '../../systems/minigames';
import type { GambleBattle } from '../../types/game';

interface SessionStats {
  totalBet: number; totalWon: number; gamesPlayed: number; wins: number; biggestWin: number; biggestLoss: number;
}
const initStats = (): SessionStats => ({ totalBet: 0, totalWon: 0, gamesPlayed: 0, wins: 0, biggestWin: 0, biggestLoss: 0 });

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= breakpoint);
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, [breakpoint]);

  return isMobile;
}

const GAMBLE_UI_CSS = `
  @keyframes gamble-bg-drift {
    0%   { transform: translate3d(-2%, -1%, 0) scale(1); }
    50%  { transform: translate3d(2%, 1%, 0) scale(1.02); }
    100% { transform: translate3d(-1%, 2%, 0) scale(1.01); }
  }
  @keyframes gamble-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes gamble-float {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-4px); }
  }
  @keyframes gamble-pulse {
    0%,100% { box-shadow: 0 0 0 rgba(91,141,238,0); }
    50%     { box-shadow: 0 0 28px rgba(91,141,238,0.28); }
  }
  @keyframes gamble-sparkle {
    0%,100% { opacity: .45; filter: blur(0px); }
    50%     { opacity: 1; filter: blur(.2px); }
  }

  .gamble-shell {
    position: relative;
    isolation: isolate;
    overflow: hidden;
  }
  .gamble-shell::before,
  .gamble-shell::after {
    content: "";
    position: absolute;
    inset: -18%;
    pointer-events: none;
  }
  .gamble-shell::before {
    background:
      radial-gradient(circle at 12% 18%, rgba(240,192,96,0.14), transparent 18%),
      radial-gradient(circle at 82% 12%, rgba(91,141,238,0.16), transparent 18%),
      radial-gradient(circle at 64% 84%, rgba(224,96,224,0.12), transparent 18%),
      radial-gradient(circle at 45% 55%, rgba(76,175,135,0.10), transparent 20%);
    animation: gamble-bg-drift 14s ease-in-out infinite alternate;
    z-index: 0;
  }
  .gamble-shell::after {
    background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.08) 35%, transparent 70%);
    background-size: 200% 100%;
    animation: gamble-shimmer 8s linear infinite;
    mix-blend-mode: screen;
    opacity: .25;
    z-index: 0;
  }

  .gamble-card {
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    box-shadow: 0 14px 34px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04);
    backdrop-filter: blur(10px);
  }
  .gamble-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.12) 18%, transparent 36%, transparent 64%, rgba(255,255,255,0.10) 82%, transparent 100%);
    background-size: 220% 100%;
    animation: gamble-shimmer 6s linear infinite;
    pointer-events: none;
    opacity: .18;
  }

  .gamble-tabbar {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }
  .gamble-tabbar button {
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background-color .18s ease, opacity .18s ease;
    will-change: transform;
  }
  .gamble-tabbar button:hover {
    transform: translateY(-2px);
  }
  .gamble-tabbar button:active {
    transform: translateY(1px) scale(.985);
  }
  .gamble-tabbar button.gamble-active {
    animation: gamble-float 2.6s ease-in-out infinite, gamble-pulse 2.6s ease-in-out infinite;
  }

  .gamble-mobile-grid {
    display: grid;
    gap: 6px;
  }

  @media (max-width: 768px) {
    .gamble-shell {
      padding-left: 8px !important;
      padding-right: 8px !important;
      padding-top: 10px !important;
      padding-bottom: 18px !important;
    }
    .gamble-card {
      border-radius: 14px;
    }
    .gamble-main-title {
      font-size: 1.08rem !important;
    }
    .gamble-balance {
      padding: 8px 10px !important;
      gap: 6px !important;
    }
    .gamble-mainTabs {
      gap: 6px !important;
      flex-wrap: wrap !important;
      overflow-x: visible !important;
    }
    .gamble-mainTabs button {
      flex: 1 1 calc(25% - 6px) !important;
      min-width: 0 !important;
      padding: 7px 6px !important;
      font-size: 0.64rem !important;
    }
    .gamble-gameTabs {
      flex-wrap: wrap !important;
      overflow-x: visible !important;
    }
    .gamble-gameTabs button {
      flex: 1 1 calc(50% - 4px) !important;
      min-width: 0 !important;
      padding: 7px 8px !important;
      font-size: 0.72rem !important;
    }
    .gamble-panel {
      padding: 12px !important;
    }
  }
`;

function resolveGenericGamble(game: GambleMaster, bet: number, multiplierBonus = 1.0): GambleResult {
  const rand = secureRandom();
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

function ResultDisplay({ result, bet = 0 }: { result: GambleResult; bet?: number }) {
  const mobile = useIsMobile();
  const isReplay = result.rewardLabel.includes('REPLAY');
  const isWin = result.goldDelta > 0;
  const labelColor = isReplay ? '#5b8dee' : isWin ? '#4caf87' : '#e05555';
  const bgColor = isReplay ? 'rgba(91,141,238,0.1)' : isWin ? 'rgba(76,175,135,0.1)' : 'rgba(224,85,85,0.1)';
  const borderColor = isReplay ? '#5b8dee' : isWin ? '#4caf87' : '#e05555';
  // 手元に戻る合計額（賭け金返還分 + 差益）を表示
  const totalReturn = result.goldDelta + bet;
  return (
    <div className="gamble-card" style={{ padding: mobile ? '12px' : '10px', background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 8, marginBottom: 10, textAlign: 'center', boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 10px 26px ${borderColor}22` }}>
      <div style={{ fontSize: mobile ? '1.02rem' : '1.2rem', fontWeight: 700, color: labelColor, marginBottom: 4 }}>
        {result.symbols?.join(' ') ?? ''} {result.rewardLabel}
      </div>
      <div style={{ fontSize: mobile ? '0.9rem' : '1rem', fontWeight: 700, color: labelColor }}>
        {isReplay ? `🔄 掛け金返還 (+${bet.toLocaleString()}WC)` : isWin ? `+${totalReturn.toLocaleString()}WC` : `${result.goldDelta.toLocaleString()}WC`}
      </div>
      {result.itemRewards.length > 0 && (
        <div style={{ marginTop: 6, fontSize: mobile ? '0.72rem' : '0.8rem' }}>
          {result.itemRewards.map(r => <span key={r.itemId} style={{display:'inline-flex',alignItems:'center',gap:3}}><GameIcon id={ITEM_MASTER[r.itemId]?.icon ?? ''} size={14} /> {ITEM_MASTER[r.itemId]?.name} ×{r.amount} </span>)}
        </div>
      )}
    </div>
  );
}

// ジャックポット表示（蓄積のみ、対戦中に偶然発生）
function JackpotBanner({ pool }: { pool: number }) {
  const mobile = useIsMobile();
  if (pool <= 0) return null;
  return (
    <div className="gamble-card" style={{ background: 'linear-gradient(135deg,rgba(240,192,96,0.15),rgba(240,168,48,0.15))', border: '2px solid #f0c060', borderRadius: 10, padding: mobile ? '9px 12px' : '10px 14px', marginBottom: 12, textAlign: 'center', animation: 'gamble-pulse 2.8s ease-in-out infinite' }}>
      <div style={{ fontSize: mobile ? '0.72rem' : '0.8rem', color: '#8a92b2', marginBottom: 2 }}>🌟 現在のジャックポットプール</div>
      <div style={{ fontSize: mobile ? '1.5rem' : '2rem', fontWeight: 700, color: '#f0c060' }}>{pool.toLocaleString()}WC</div>
      <div style={{ fontSize: mobile ? '0.68rem' : '0.72rem', color: '#4a5070', marginTop: 4 }}>他のギャンブルをプレイするたびに蓄積されます。超低確率で自動当選！</div>
    </div>
  );
}

// 賭け金入力
function BetInput({ game, bet, setBet, disabled = false }: { game: GambleMaster; bet: number; setBet: (v: number) => void; disabled?: boolean }) {
  const mobile = useIsMobile();
  const player = useGameStore(s => s.player);
  const presets = [game.minBet, Math.floor(game.maxBet * 0.1), Math.floor(game.maxBet * 0.25), game.maxBet].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <div style={{ marginBottom: 10 }}>
      {disabled && <div style={{ fontSize: '0.72rem', color: '#e05555', marginBottom: 4 }}>⚠ ゲーム中は賭け金を変更できません</div>}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, auto))', gap: 4, marginBottom: 6 }}>
        {presets.map(p => (
          <button key={p} onClick={() => !disabled && setBet(Math.min(p, player?.wealthCoin ?? 0))}
            style={{ padding: mobile ? '8px 6px' : '3px 8px', background: bet === p ? '#5b8dee' : '#1c2235', color: bet === p ? '#fff' : '#8a92b2', border: `1px solid ${bet === p ? '#5b8dee' : '#2d3752'}`, borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: mobile ? '0.72rem' : '0.75rem', opacity: disabled ? 0.5 : 1, minHeight: mobile ? 36 : undefined }}>
            {p.toLocaleString()}WC
          </button>
        ))}
        <button onClick={() => !disabled && setBet(Math.min(player?.wealthCoin ?? 0, game.maxBet))}
          style={{ padding: '3px 8px', background: '#1c2235', color: '#f0c060', border: '1px solid #f0c060', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.75rem', opacity: disabled ? 0.5 : 1 }}>MAX</button>
      </div>
      <input type="number" value={bet} min={game.minBet} max={Math.min(game.maxBet, player?.wealthCoin ?? 0)}
        onChange={e => !disabled && setBet(Math.max(game.minBet, Math.min(game.maxBet, Number(e.target.value))))}
        disabled={disabled}
        style={{ width: '100%', padding: mobile ? '12px 12px' : '6px 10px', background: disabled ? '#161b26' : '#1c2235', border: `1px solid ${disabled ? '#4a5070' : '#2d3752'}`, color: disabled ? '#4a5070' : '#e8e6ff', borderRadius: 10, fontSize: mobile ? '1rem' : '0.9rem', boxSizing: 'border-box' as const, cursor: disabled ? 'not-allowed' : 'text', minHeight: mobile ? 44 : undefined }}
      />
    </div>
  );
}

// ============================================================
// ゲーム別アニメーション（連投防止用）
// ============================================================
function GameAnimation({ type, onDone }: { type: 'chohan'|'chinchiro'|'coin_flip'|'slot'|'poker'|'treasure_box'|'generic'; onDone: () => void }) {
  const [frame, setFrame] = useState(0);

  const configs: Record<string, { frames: string[][]; duration: number; label: string }> = {
    chohan:      { frames: [['🎲','🎲'],['⬜','⬜'],['🎲','🎲'],['1️⃣','2️⃣'],['🎲','🎲'],['3️⃣','4️⃣'],['🎲','🎲'],['5️⃣','6️⃣']], duration: 80, label: 'サイコロを振っています...' },
    chinchiro:   { frames: [['🎲','🎲','🎲'],['⬜','⬜','⬜'],['🎲','🎲','🎲'],['1️⃣','2️⃣','3️⃣'],['🎲','🎲','🎲'],['4️⃣','5️⃣','6️⃣'],['🎲','🎲','🎲'],['⬜','⬜','⬜']], duration: 80, label: 'サイコロを振っています...' },
    coin_flip:   { frames: [['🌕'],['🌑'],['🌕'],['🌑'],['🌕'],['🌑'],['🌕'],['🌑'],['🌕'],['🌑']], duration: 90, label: 'コインを投げています...' },
    slot:        { frames: [['🍒','💎','7️⃣'],['💰','🍋','🔔'],['7️⃣','🍒','💎'],['🔔','💰','🍋'],['🍋','7️⃣','🍒'],['💎','🔔','💰'],['🍒','🍋','7️⃣'],['💰','💎','🔔']], duration: 80, label: 'スロットが回っています...' },
    poker:       { frames: [['🂠','🂠','🂠','🂠','🂠'],['🂠','🂠','🂠','🂠','🂡'],['🂠','🂠','🂠','🃁','🂡'],['🂠','🂠','🂱','🃁','🂡'],['🂠','🂢','🂱','🃁','🂡'],['🂲','🂢','🂱','🃁','🂡']], duration: 130, label: 'カードを配っています...' },
    treasure_box:{ frames: [['📦'],['🔐'],['📦'],['🔐'],['📦'],['✨'],['🎁'],['✨']], duration: 100, label: '宝箱を開けています...' },
    generic:     { frames: [['🎮'],['⭐'],['🎮'],['✨'],['🎮'],['⭐']], duration: 110, label: 'プレイ中...' },
  };

  const cfg = configs[type] ?? configs.generic;

  useEffect(() => {
    let idx = 0;
    const t = setInterval(() => {
      idx++;
      setFrame(idx % cfg.frames.length);
      if (idx >= cfg.frames.length * 3) { clearInterval(t); setTimeout(onDone, 150); }
    }, cfg.duration);
    return () => clearInterval(t);
  }, []);

  const icons = cfg.frames[frame];
  return (
    <div style={{ textAlign: 'center', padding: '10px 0 8px', minHeight: 60 }}>
      <div style={{ fontSize: '2rem', letterSpacing: 6, marginBottom: 4, transition: 'all 0.07s' }}>
        {icons.map((ic, i) => <span key={i}>{ic}</span>)}
      </div>
      <div style={{ fontSize: '0.78rem', color: '#8a92b2' }}>{cfg.label}</div>
    </div>
  );
}

// ============================================================
// PvP対戦バトルアニメーション（ゲーム別フル演出版）
// ============================================================

// チンチロ役判定ヘルパー
type ChinchiroRank = { type: 'shigoro' | 'arashi' | 'normal' | 'hifumi' | 'nashi'; value: number; label: string };
function evalChinchiro(dice: number[]): ChinchiroRank {
  const sorted = [...dice].sort((a,b) => a-b);
  if (sorted[0]===4 && sorted[1]===5 && sorted[2]===6) return { type:'shigoro', value:1000, label:'シゴロ（4・5・6）最強！' };
  if (sorted[0]===sorted[1] && sorted[1]===sorted[2]) return { type:'arashi', value:100 + sorted[0]*10, label:`嵐（${sorted[0]}のゾロ目）` };
  if (sorted[0]===1 && sorted[1]===2 && sorted[2]===3) return { type:'hifumi', value:0, label:'ヒフミ（1・2・3）最弱' };
  if (sorted[0]===sorted[1]) return { type:'normal', value:sorted[2], label:`目 ${sorted[2]}` };
  if (sorted[1]===sorted[2]) return { type:'normal', value:sorted[0], label:`目 ${sorted[0]}` };
  return { type:'nashi', value:-1, label:'役なし（やり直し）' };
}


const DICE_EMOJI = ['⚀','⚁','⚂','⚃','⚄','⚅'];
const SLOT_SYMBOLS = ['🍒','💰','🌟','🍋','🔄','👑','🔔','⭐'];
const SLOT_RANKS: Record<string,number> = { '7️⃣':100,'💎':80,'💰':60,'🃏':50,'⭐':40,'🔔':30,'🍒':20,'🍋':10 };

// ダイスアニメーションコンポーネント
function RollingDice({ count, finalDice, rolling }: { count: 2|3; finalDice: number[]|null; rolling: boolean }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!rolling) return;
    const t = setInterval(() => setFrame(f => (f+1)%6), 80);
    return () => clearInterval(t);
  }, [rolling]);
  const display = finalDice ?? Array.from({length:count}, (_,i) => (frame+i*2)%6);
  const isNum = !!finalDice;
  return (
    <div style={{ display:'flex', gap:12, justifyContent:'center', alignItems:'center' }}>
      {display.map((d, i) => (
        <div key={i} style={{
          fontSize:'3rem', lineHeight:1, filter: rolling ? 'blur(0.5px)' : 'none',
          transition: isNum ? 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
          transform: rolling ? `rotate(${(frame*37+i*90)%360}deg)` : 'rotate(0deg)',
        }}>
          {DICE_EMOJI[isNum ? d-1 : d]}
        </div>
      ))}
    </div>
  );
}

// スロットアニメーション（リール回転）
function SlotReel({ finalSymbol, spinning, delay = 0 }: { finalSymbol: string|null; spinning: boolean; delay?: number }) {
  const [offset, setOffset] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [displayed, setDisplayed] = useState(SLOT_SYMBOLS[0]);

  useEffect(() => {
    if (!spinning) { setStopped(false); return; }
    setStopped(false);
    let t: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      let speed = 60;
      let idx = 0;
      t = setInterval(() => {
        setDisplayed(SLOT_SYMBOLS[idx % SLOT_SYMBOLS.length]);
        setOffset(o => o + 1);
        idx++;
      }, speed);
    }, delay);
    return () => { clearTimeout(start); clearInterval(t); };
  }, [spinning, delay]);

  useEffect(() => {
    if (finalSymbol && spinning) {
      const to = setTimeout(() => {
        setDisplayed(finalSymbol);
        setStopped(true);
      }, delay + 600);
      return () => clearTimeout(to);
    }
  }, [finalSymbol, spinning, delay]);

  return (
    <div style={{
      width:64, height:80, background:'#1c2235', border:`3px solid ${stopped && finalSymbol ? '#f0c060' : '#2d3752'}`,
      borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
      fontSize:'2.2rem', position:'relative',
      boxShadow: stopped && finalSymbol ? '0 0 18px rgba(240,192,96,0.5)' : 'none',
      transition:'border-color 0.3s, box-shadow 0.3s',
    }}>
      <span style={{
        display:'block',
        animation: spinning && !stopped ? 'none' : undefined,
        transform: spinning && !stopped ? `translateY(${(offset%4)*-20}%)` : 'translateY(0)',
        transition: stopped ? 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
      }}>{displayed}</span>
    </div>
  );
}

// 決定論的擬似乱数（battleIdをシードに）
import type { GambleBattleData } from '../../types/game';

function BattleAnimation({ opponentName, gameName, result, battleData, iAmHost, onDone }: {
  opponentName: string;
  gameName: string;
  result: { won: boolean; amount: number };
  battleData: GambleBattleData | undefined;
  iAmHost: boolean;
  onDone: () => void;
}) {
  const GAME_NAMES_JP: Record<string, string> = {
    chohan: '丁半', chinchiro: 'チンチロリン', coin_flip: 'コイントス', slot_machine: 'スロット',
  };
  const gameNameJp = GAME_NAMES_JP[gameName] ?? gameName;

  // 先攻決め: チンチロの場合ホストが親(後攻)、ゲストが子(先攻)
  // それ以外: battleDataがない場合はresult.wonで仮決め
  const isFirstFixed = useMemo(() => {
    if (gameName === 'chinchiro') return !iAmHost; // 子=先攻=ゲスト
    return result.won; // fallback
  }, [gameName, iAmHost, result.won]);

  type Phase = 'dice_roll' | 'choose' | 'chohan_roll' | 'coin_toss' | 'chinchiro_battle' | 'slot_battle' | 'final';
  const [phase, setPhase] = useState<Phase>(() => {
    // battleDataがあればdice_rollフェーズをスキップしてもよいが演出として残す
    return 'dice_roll';
  });

  // 先攻決めサイコロ演出用（battleDataとは無関係な純粋演出）
  const myDiceFixed = iAmHost ? 4 : 3; // 演出用固定値（実際の勝敗はbattleDataで決まる）
  const oppDiceFixed = iAmHost ? 3 : 4;

  const [myDice, setMyDice] = useState(0);
  const [oppDice, setOppDice] = useState(0);
  const [diceRolling, setDiceRolling] = useState(true);
  const [isFirst] = useState(isFirstFixed);
  const [myChoice, setMyChoice] = useState<string>('');

  // 丁半
  const [chohanDice, setChohanDice] = useState<number[]|null>(null);
  const [chohanRolling, setChohanRolling] = useState(false);
  const [chohanResult, setChohanResult] = useState<string>('');

  // コイントス
  type CoinLog = { flip: number; face: 'omote'|'ura'; myWon: boolean };
  const [coinLogs, setCoinLogs] = useState<CoinLog[]>([]);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinFace, setCoinFace] = useState<'omote'|'ura'|null>(null);
  const [coinTossIdx, setCoinTossIdx] = useState(0);
  const [coinPhase, setCoinPhase] = useState<'idle'|'flipping'|'done'>('idle');

  // チンチロ
  type ChinchiroLog = { who: 'me'|'opp'; dice: number[]; rank: ChinchiroRank };
  const [chinLogs, setChinLogs] = useState<ChinchiroLog[]>([]);
  const [chinRolling, setChinRolling] = useState<'me'|'opp'|null>(null);
  const [chinDice, setChinDice] = useState<{me:number[]|null; opp:number[]|null}>({me:null,opp:null});
  // chinTurnState removed

  // スロット
  type SlotLog = { who:'me'|'opp'; symbols:string[]; rank: number; label:string };
  const [slotLogs, setSlotLogs] = useState<SlotLog[]>([]);
  const [slotSpinning, setSlotSpinning] = useState(false);
  const [slotSymbols, setSlotSymbols] = useState<string[]|null>(null);
  const [slotTurn, setSlotTurn] = useState<'me'|'opp'>('me');
  // slotTurnState removed - now managed via slotStep

  const overlayStyle: import('react').CSSProperties = {
    position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.97)',
    display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14,
    padding:'0 20px', overflowY:'auto',
  };

  // ========== 先攻決め ==========
  useEffect(() => {
    let cnt = 0;
    setDiceRolling(true);
    const t = setInterval(() => {
      cnt++;
      if (cnt >= 20) {
        clearInterval(t);
        setMyDice(myDiceFixed); setOppDice(oppDiceFixed);
        setDiceRolling(false);
        setTimeout(() => setPhase('choose'), 1200);
      }
    }, 80);
    return () => clearInterval(t);
  }, []);

  // ========== 選択フェーズ → 後攻なら自動で逆選択 ==========
  useEffect(() => {
    if (phase !== 'choose') return;
    if (isFirst) return; // 先攻なら手動
    // 後攻は1秒後に自動選択（先攻の逆）
    const auto = setTimeout(() => {
      if (gameName === 'chohan') setMyChoice('han'); // 先攻=丁、後攻=半(仮)→実際は先攻が決めるのでここではopponentが丁を選んだとして後攻=半
      if (gameName === 'coin_flip') setMyChoice('ura');
      // チンチロ・スロットは選択肢なし
      goToGame();
    }, 1200);
    return () => clearTimeout(auto);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isFirst]);

  const goToGame = () => {
    if (gameName === 'chohan') setPhase('chohan_roll');
    else if (gameName === 'coin_flip') setPhase('coin_toss');
    else if (gameName === 'chinchiro') setPhase('chinchiro_battle');
    else if (gameName === 'slot_machine') setPhase('slot_battle');
    else setPhase('final');
  };

  const handleChoose = (choice: string) => {
    setMyChoice(choice);
    goToGame();
  };

  // ========== 丁半: 2つのサイコロ演出 ==========
  useEffect(() => {
    if (phase !== 'chohan_roll') return;
    setChohanRolling(true);
    setChohanDice(null);
    const t = setTimeout(() => {
      let d1: number, d2: number;
      if (battleData?.type === 'chohan') {
        [d1, d2] = battleData.hostDice;
      } else {
        d1 = 3; d2 = 4;
      }
      const sum = d1 + d2;
      const isEven = sum % 2 === 0;
      setChohanDice([d1, d2]);
      setChohanRolling(false);
      const myC = isFirst ? myChoice : (myChoice || 'han');
      const oppC = myC === 'cho' ? '半（奇数）' : '丁（偶数）';
      setChohanResult(`🎲 ${d1} ＋ ${d2} ＝ ${sum}（${isEven ? '偶数＝丁' : '奇数＝半'}）\nあなた:${myC === 'cho' ? '丁' : '半'} / ${opponentName}:${oppC}`);
      setTimeout(() => setPhase('final'), 2200);
    }, 1600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ========== コイントス: 6回投げる演出 ==========
  useEffect(() => {
    if (phase !== 'coin_toss') return;
    setCoinLogs([]);
    setCoinTossIdx(0);
    setCoinPhase('idle');
  }, [phase]);

  const runNextCoinToss = (currentIdx: number, logs: CoinLog[]) => {
    const flips = battleData?.type === 'coin_flip' ? battleData.flips : [];
    const totalFlips = flips.length || 6;
    if (currentIdx >= totalFlips) {
      setCoinPhase('done');
      setTimeout(() => setPhase('final'), 1000);
      return;
    }
    setCoinFlipping(true);
    setCoinFace(null);
    const t = setTimeout(() => {
      // battleDataから実際のフリップ結果を使用
      const rawFace = flips[currentIdx] ?? (Math.random() < 0.5 ? 'heads' : 'tails');
      const face: 'omote'|'ura' = rawFace === 'heads' ? 'omote' : 'ura';
      const myPickOmote = (isFirst ? myChoice : (myChoice||'ura')) === 'omote';
      const myWon = (face === 'omote') === myPickOmote;
      const newLog: CoinLog = { flip: currentIdx+1, face, myWon };
      const newLogs = [...logs, newLog];
      setCoinLogs(newLogs);
      setCoinFace(face);
      setCoinFlipping(false);
      setCoinTossIdx(currentIdx+1);
      setTimeout(() => runNextCoinToss(currentIdx+1, newLogs), 1000);
    }, 1200);
    return () => clearTimeout(t);
  };

  useEffect(() => {
    if (phase === 'coin_toss' && coinPhase === 'idle') {
      setCoinPhase('flipping');
      runNextCoinToss(0, []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, coinPhase]);

  // ========== チンチロ: 交互に役が出るまで振る ==========
  useEffect(() => {
    if (phase !== 'chinchiro_battle') return;
    setChinLogs([]);
    setChinDice({me:null,opp:null});
    // battleDataから実際のサイコロ結果を取得して再生
    const myDiceArr = battleData?.type === 'chinchiro' ? (iAmHost ? battleData.hostDice : battleData.guestDice) : [1,2,4];
    const oppDiceArr = battleData?.type === 'chinchiro' ? (iAmHost ? battleData.guestDice : battleData.hostDice) : [1,2,3];
    const myRoleLabel = battleData?.type === 'chinchiro' ? (iAmHost ? battleData.hostRole : battleData.guestRole) : '目なし';
    const oppRoleLabel = battleData?.type === 'chinchiro' ? (iAmHost ? battleData.guestRole : battleData.hostRole) : '目なし';

    const myRank: ChinchiroRank = evalChinchiro(myDiceArr);
    const oppRank: ChinchiroRank = evalChinchiro(oppDiceArr);
    // 役ラベルはサーバー保存値を優先
    const myRankDisplay: ChinchiroRank = { ...myRank, label: myRoleLabel };
    const oppRankDisplay: ChinchiroRank = { ...oppRank, label: oppRoleLabel };

    // 相手（子）→ 自分（親）の順に表示
    const queue: Array<{who:'me'|'opp'; dice:number[]; rank:ChinchiroRank}> = [
      { who: 'opp', dice: oppDiceArr, rank: oppRankDisplay },
      { who: 'me', dice: myDiceArr, rank: myRankDisplay },
    ];
    let idx = 0;
    const runNext = () => {
      if (idx >= queue.length) {
        setTimeout(() => setPhase('final'), 1200);
        return;
      }
      const entry = queue[idx++];
      setChinRolling(entry.who);
      setChinDice(prev => ({ ...prev, [entry.who]: null }));
      setTimeout(() => {
        setChinDice(prev => ({ ...prev, [entry.who]: entry.dice }));
        setChinRolling(null);
        setChinLogs(prev => [...prev, entry]);
        setTimeout(runNext, 1800);
      }, 1400);
    };
    const t = setTimeout(runNext, 300);
    return () => clearTimeout(t);
  }, [phase]);

  // ========== スロット: 止める！ボタン式 ==========
  // slotPhase: 'idle'=待機, 'opp_spinning'=相手ターン自動, 'spinning'=自分ターン, 'done'=終了
  const [slotPhase, setSlotPhase] = useState<'idle'|'opp_spinning'|'spinning'|'result'|'done'>('idle');
  const [slotMyResult, setSlotMyResult] = useState<SlotLog|null>(null);
  const [slotOppResult, setSlotOppResult] = useState<SlotLog|null>(null);

  const _getSlotRank = (s: string[]) => {
    if (s[0]===s[1] && s[1]===s[2]) return { rank: SLOT_RANKS[s[0]]??10, label:`${s[0]}${s[0]}${s[0]} ゾロ目！` };
    if (s[0]===s[1] || s[1]===s[2] || s[0]===s[2]) return { rank: 1, label:'2つ揃い' };
    return { rank: 0, label:'役なし' };
  };

  // スロット開始: battleDataからmy/oppリールを決定して順番に再生
  useEffect(() => {
    if (phase !== 'slot_battle') return;
    setSlotLogs([]);
    setSlotSymbols(null);
    setSlotSpinning(false);
    setSlotMyResult(null);
    setSlotOppResult(null);
    // battleDataからリールを取得
    const oppReels = battleData?.type === 'slot_machine' ? (iAmHost ? battleData.guestReels : battleData.hostReels) : ['❓','❓','❓'];
    const firstPlayer: 'me'|'opp' = isFirst ? 'me' : 'opp';
    setSlotTurn(firstPlayer);

    if (isFirst) {
      // 自分先攻: まず自分が回す（止めるボタン付き、実際にはbattleDataの結果を使う）
      setSlotPhase('spinning');
      setSlotSpinning(true);
    } else {
      // 後攻: 相手が先に自動で回す
      setSlotPhase('opp_spinning');
      setSlotSpinning(true);
      // 2秒後に相手のリール表示
      const t = setTimeout(() => {
        const r = _getSlotRank(oppReels);
        const log: SlotLog = { who: 'opp', symbols: oppReels, rank: r.rank, label: r.label };
        setSlotOppResult(log);
        setSlotSymbols(oppReels);
        setSlotSpinning(false);
        setSlotLogs([log]);
        setSlotTurn('me');
        setTimeout(() => {
          setSlotSymbols(null);
          setSlotSpinning(true);
          setSlotPhase('spinning');
        }, 1500);
      }, 2500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleSlotStop = () => {
    if (phase !== 'slot_battle' || slotPhase !== 'spinning') return;
    // battleDataから自分のリール結果を使用
    const myReels = battleData?.type === 'slot_machine' ? (iAmHost ? battleData.hostReels : battleData.guestReels) : ['❓','❓','❓'];
    const oppReels = battleData?.type === 'slot_machine' ? (iAmHost ? battleData.guestReels : battleData.hostReels) : ['❓','❓','❓'];
    const r = _getSlotRank(myReels);
    const log: SlotLog = { who: 'me', symbols: myReels, rank: r.rank, label: r.label };
    setSlotMyResult(log);
    setSlotSymbols(myReels);
    setSlotSpinning(false);
    setSlotLogs(prev => [...prev, log]);
    setSlotPhase('result');
    if (isFirst) {
      // 自分先攻 → 相手後攻を自動で回す
      setTimeout(() => {
        setSlotTurn('opp');
        setSlotSymbols(null);
        setSlotSpinning(true);
        setSlotPhase('opp_spinning');
        setTimeout(() => {
          const or = _getSlotRank(oppReels);
          const oppLog: SlotLog = { who: 'opp', symbols: oppReels, rank: or.rank, label: or.label };
          setSlotOppResult(oppLog);
          setSlotSymbols(oppReels);
          setSlotSpinning(false);
          setSlotLogs(prev => [...prev, oppLog]);
          setSlotPhase('done');
          setTimeout(() => setPhase('final'), 1800);
        }, 2500);
      }, 1200);
    } else {
      setSlotPhase('done');
      setTimeout(() => setPhase('final'), 1800);
    }
  };

  // ========== render ==========
  return (
    <div style={overlayStyle}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translate(0,0) rotate(0deg)} 20%{transform:translate(-4px,2px) rotate(-3deg)} 40%{transform:translate(4px,-2px) rotate(3deg)} 60%{transform:translate(-2px,4px) rotate(-2deg)} 80%{transform:translate(2px,-4px) rotate(2deg)} }
        @keyframes coinSpin { 0%{transform:scaleX(1)} 25%{transform:scaleX(0.1)} 50%{transform:scaleX(1)} 75%{transform:scaleX(0.1)} 100%{transform:scaleX(1)} }
        @keyframes glow { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes slideIn { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes victoryPulse { 0%,100%{text-shadow:0 0 20px rgba(76,175,135,0.8)} 50%{text-shadow:0 0 60px rgba(76,175,135,1),0 0 100px rgba(76,175,135,0.5)} }
        @keyframes defeatPulse { 0%,100%{text-shadow:0 0 20px rgba(224,85,85,0.8)} 50%{text-shadow:0 0 60px rgba(224,85,85,1)} }
        @keyframes reelSpin { 0%{transform:translateY(0)} 100%{transform:translateY(-200%)} }
      `}</style>

      {/* 先攻決めサイコロ */}
      {phase === 'dice_roll' && (
        <>
          <div style={{ fontSize:'0.9rem', color:'#8a92b2' }}>⚔️ {opponentName} との対戦</div>
          <div style={{ fontSize:'1rem', color:'#f0c060', fontWeight:700 }}>先攻を決めるサイコロ！</div>
          <div style={{ display:'flex', gap:40, alignItems:'center' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'0.8rem', color:'#5b8dee', marginBottom:8 }}>あなた</div>
              <div style={{ animation: diceRolling ? 'shake 0.3s infinite' : 'none' }}>
                <div style={{ fontSize:'4rem' }}>{myDice ? DICE_EMOJI[myDice-1] : DICE_EMOJI[Math.floor(secureRandom()*6)]}</div>
              </div>
              {myDice > 0 && <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#e8e6ff', animation:'pop 0.4s ease' }}>{myDice}</div>}
            </div>
            <div style={{ fontSize:'2rem', color:'#4a5070', fontWeight:900 }}>VS</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'0.8rem', color:'#e05555', marginBottom:8 }}>{opponentName}</div>
              <div style={{ animation: diceRolling ? 'shake 0.3s infinite 0.1s' : 'none' }}>
                <div style={{ fontSize:'4rem' }}>{oppDice ? DICE_EMOJI[oppDice-1] : DICE_EMOJI[Math.floor(secureRandom()*6)]}</div>
              </div>
              {oppDice > 0 && <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#e8e6ff', animation:'pop 0.4s ease' }}>{oppDice}</div>}
            </div>
          </div>
          {!diceRolling && myDice > 0 && (
            <div style={{ fontSize:'1.3rem', color: isFirst ? '#4caf87' : '#f0a830', fontWeight:900, animation:'pop 0.5s ease', background: isFirst ? 'rgba(76,175,135,0.15)' : 'rgba(240,168,48,0.15)', border:`2px solid ${isFirst?'#4caf87':'#f0a830'}`, borderRadius:12, padding:'10px 24px' }}>
              {isFirst ? '🥇 あなたの先攻！' : '🥈 相手の先攻...'}
            </div>
          )}
        </>
      )}

      {/* 選択フェーズ */}
      {phase === 'choose' && (
        <>
          <div style={{ fontSize:'1.2rem', color:'#f0c060', fontWeight:700 }}>
            {isFirst ? '🥇 先攻！' : '🥈 後攻'} — {gameNameJp}
          </div>
          {isFirst ? (
            <>
              <div style={{ fontSize:'0.9rem', color:'#8a92b2', textAlign:'center' }}>
                あなたが選ぶと相手は自動で逆が割り当てられます
              </div>
              {gameName === 'chohan' && (
                <div style={{ display:'flex', gap:14 }}>
                  <button onClick={() => handleChoose('cho')} style={{ padding:'16px 28px', background:'rgba(91,141,238,0.2)', border:'2px solid #5b8dee', color:'#fff', borderRadius:12, cursor:'pointer', fontWeight:900, fontSize:'1.1rem' }}>丁（偶数）</button>
                  <button onClick={() => handleChoose('han')} style={{ padding:'16px 28px', background:'rgba(224,85,85,0.2)', border:'2px solid #e05555', color:'#fff', borderRadius:12, cursor:'pointer', fontWeight:900, fontSize:'1.1rem' }}>半（奇数）</button>
                </div>
              )}
              {gameName === 'coin_flip' && (
                <div style={{ display:'flex', gap:14 }}>
                  <button onClick={() => handleChoose('omote')} style={{ padding:'16px 28px', background:'rgba(240,192,96,0.2)', border:'2px solid #f0c060', color:'#fff', borderRadius:12, cursor:'pointer', fontWeight:900, fontSize:'1.1rem' }}>🌕 表</button>
                  <button onClick={() => handleChoose('ura')} style={{ padding:'16px 28px', background:'rgba(138,146,178,0.2)', border:'2px solid #8a92b2', color:'#fff', borderRadius:12, cursor:'pointer', fontWeight:900, fontSize:'1.1rem' }}>🌑 裏</button>
                </div>
              )}
              {(gameName === 'chinchiro' || gameName === 'slot_machine') && (
                <button onClick={() => handleChoose('go')} style={{ padding:'16px 40px', background:'linear-gradient(135deg,#5b8dee,#3a6fd0)', border:'none', color:'#fff', borderRadius:12, cursor:'pointer', fontWeight:900, fontSize:'1.2rem' }}>
                  🎲 勝負！
                </button>
              )}
            </>
          ) : (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'0.9rem', color:'#8a92b2', marginBottom:8 }}>{opponentName}が選択中...</div>
              <div style={{ fontSize:'2rem', animation:'glow 0.8s infinite' }}>⏳</div>
              <div style={{ fontSize:'0.8rem', color:'#4a5070', marginTop:8 }}>あなたは逆が自動割当されます</div>
            </div>
          )}
        </>
      )}

      {/* 丁半: サイコロ演出 */}
      {phase === 'chohan_roll' && (
        <>
          <div style={{ fontSize:'1.2rem', color:'#f0c060', fontWeight:700 }}>🎲 丁半 — サイコロ投擲！</div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'2px solid #2d3752', borderRadius:16, padding:'20px 30px', textAlign:'center' }}>
            <div style={{ fontSize:'0.8rem', color:'#8a92b2', marginBottom:10 }}>どんぶりの中へ...</div>
            <RollingDice count={2} finalDice={chohanDice} rolling={chohanRolling} />
            {chohanDice && (
              <div style={{ marginTop:14, animation:'slideIn 0.4s ease' }}>
                <div style={{ fontSize:'1.4rem', fontWeight:900, color:'#e8e6ff' }}>
                  {chohanDice[0]} ＋ {chohanDice[1]} ＝ <span style={{ color:'#f0c060', fontSize:'1.8rem' }}>{chohanDice[0]+chohanDice[1]}</span>
                </div>
                <div style={{ fontSize:'1.1rem', fontWeight:700, color:(chohanDice[0]+chohanDice[1])%2===0?'#5b8dee':'#e05555', marginTop:6 }}>
                  {(chohanDice[0]+chohanDice[1])%2===0 ? '⬅ 偶数 ＝ 丁！' : '⬅ 奇数 ＝ 半！'}
                </div>
                <div style={{ fontSize:'0.82rem', color:'#8a92b2', marginTop:8, whiteSpace:'pre-line' }}>{chohanResult}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* コイントス: 6回 */}
      {phase === 'coin_toss' && (
        <>
          <div style={{ fontSize:'1.1rem', color:'#f0c060', fontWeight:700 }}>🪙 コイントス — 6回勝負！</div>
          <div style={{ fontSize:'0.8rem', color:'#8a92b2' }}>あなた:{isFirst?'先攻':'後攻'} / 先攻:{myChoice==='omote'&&isFirst?'表':'裏'}</div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'2px solid #2d3752', borderRadius:16, padding:'16px 24px', textAlign:'center', minWidth:240 }}>
            {coinPhase === 'flipping' && (
              <div style={{ fontSize:'4rem', animation: coinFlipping ? 'coinSpin 0.3s infinite' : 'pop 0.3s ease' }}>
                {coinFace === 'omote' ? '🌕' : coinFace === 'ura' ? '🌑' : '🌗'}
              </div>
            )}
            <div style={{ fontSize:'1rem', fontWeight:700, color:'#e8e6ff', marginTop:8 }}>
              第{coinTossIdx}投 / 6投
            </div>
            {coinFace && (
              <div style={{ fontSize:'0.9rem', color: coinFace==='omote'?'#f0c060':'#8a92b2', fontWeight:700, marginTop:4 }}>
                {coinFace==='omote'?'🌕 表！':'🌑 裏！'}
              </div>
            )}
          </div>
          {/* 投げ結果ログ */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', maxWidth:300 }}>
            {coinLogs.map((l,i) => (
              <div key={i} style={{ fontSize:'0.75rem', background: l.face==='omote'?'rgba(240,192,96,0.15)':'rgba(138,146,178,0.15)', border:`1px solid ${l.face==='omote'?'#f0c060':'#8a92b2'}`, borderRadius:6, padding:'3px 8px', animation:'pop 0.3s ease' }}>
                {i+1}: {l.face==='omote'?'🌕表':'🌑裏'}
              </div>
            ))}
          </div>
          {coinLogs.length > 0 && (
            <div style={{ fontSize:'0.85rem', color:'#8a92b2' }}>
              表: {coinLogs.filter(l=>l.face==='omote').length} / 裏: {coinLogs.filter(l=>l.face==='ura').length}
            </div>
          )}
        </>
      )}

      {/* チンチロ: 交互投擲 */}
      {phase === 'chinchiro_battle' && (
        <>
          <div style={{ fontSize:'1.1rem', color:'#f0c060', fontWeight:700 }}>🎲 チンチロリン — 交互対決！</div>
          <div style={{ display:'flex', gap:16, width:'100%', maxWidth:340 }}>
            {/* 相手（子=先攻） */}
            <div style={{ flex:1, background: chinRolling==='opp'?'rgba(224,85,85,0.15)':'rgba(255,255,255,0.03)', border:`2px solid ${chinRolling==='opp'?'#e05555':'#2d3752'}`, borderRadius:12, padding:'12px 8px', textAlign:'center', transition:'all 0.3s' }}>
              <div style={{ fontSize:'0.75rem', color:'#e05555', marginBottom:6 }}>{opponentName}（子）</div>
              {chinRolling==='opp' ? (
                <div style={{ animation:'shake 0.2s infinite' }}>
                  <RollingDice count={3} finalDice={null} rolling={true} />
                </div>
              ) : chinDice.opp ? (
                <RollingDice count={3} finalDice={chinDice.opp} rolling={false} />
              ) : <div style={{ fontSize:'1.5rem', color:'#4a5070' }}>???</div>}
              {chinLogs.filter(l=>l.who==='opp').slice(-1).map((l,i) => (
                <div key={i} style={{ fontSize:'0.78rem', color: l.rank.type==='nashi'?'#4a5070':'#e05555', marginTop:6, animation:'slideIn 0.3s ease' }}>{l.rank.label}</div>
              ))}
            </div>
            <div style={{ fontSize:'1.2rem', color:'#4a5070', alignSelf:'center', fontWeight:900 }}>VS</div>
            {/* 自分（親=後攻） */}
            <div style={{ flex:1, background: chinRolling==='me'?'rgba(91,141,238,0.15)':'rgba(255,255,255,0.03)', border:`2px solid ${chinRolling==='me'?'#5b8dee':'#2d3752'}`, borderRadius:12, padding:'12px 8px', textAlign:'center', transition:'all 0.3s' }}>
              <div style={{ fontSize:'0.75rem', color:'#5b8dee', marginBottom:6 }}>あなた（親）</div>
              {chinRolling==='me' ? (
                <div style={{ animation:'shake 0.2s infinite' }}>
                  <RollingDice count={3} finalDice={null} rolling={true} />
                </div>
              ) : chinDice.me ? (
                <RollingDice count={3} finalDice={chinDice.me} rolling={false} />
              ) : <div style={{ fontSize:'1.5rem', color:'#4a5070' }}>???</div>}
              {chinLogs.filter(l=>l.who==='me').slice(-1).map((l,i) => (
                <div key={i} style={{ fontSize:'0.78rem', color: l.rank.type==='nashi'?'#4a5070':'#5b8dee', marginTop:6, animation:'slideIn 0.3s ease' }}>{l.rank.label}</div>
              ))}
            </div>
          </div>
          {/* 投擲ログ */}
          <div style={{ maxHeight:100, overflowY:'auto', width:'100%', maxWidth:340 }}>
            {chinLogs.map((l,i) => (
              <div key={i} style={{ fontSize:'0.72rem', color: l.rank.type==='nashi'?'#4a5070': l.who==='me'?'#5b8dee':'#e05555', padding:'2px 0', animation:'slideIn 0.3s ease' }}>
                {l.who==='me'?'あなた':opponentName}: {l.dice.map(d=>DICE_EMOJI[d-1]).join('')} → {l.rank.label}
              </div>
            ))}
          </div>
        </>
      )}

      {/* スロット: 止める！ボタン式 */}
      {phase === 'slot_battle' && (
        <>
          <div style={{ fontSize:'1.1rem', color:'#f0c060', fontWeight:700 }}>🎰 スロット — 止めて勝負！</div>
          <div style={{ fontSize:'0.82rem', color: slotTurn==='me'?'#5b8dee':'#e05555', fontWeight:700 }}>
            {slotPhase === 'opp_spinning' ? `⏳ ${opponentName}が回転中...` : slotPhase === 'spinning' ? '⬇ あなたのターン！止めて！' : ''}
          </div>
          {/* リール */}
          <div style={{ background:'rgba(0,0,0,0.5)', border:'3px solid #f0c060', borderRadius:16, padding:'16px 20px' }}>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              {[0,1,2].map(i => (
                <SlotReel key={i} finalSymbol={slotSymbols?.[i]??null} spinning={slotSpinning} delay={i*300} />
              ))}
            </div>
            {slotSymbols && (
              <div style={{ textAlign:'center', marginTop:10, fontSize:'0.85rem', fontWeight:700, animation:'slideIn 0.4s ease',
                color: slotLogs.slice(-1)[0]?.rank>0?'#f0c060':'#4a5070' }}>
                {slotLogs.slice(-1)[0]?.label ?? ''}
              </div>
            )}
          </div>
          {/* 止めるボタン */}
          {slotPhase === 'spinning' && (
            <button onClick={handleSlotStop}
              style={{ padding:'14px 48px', background:'linear-gradient(135deg,#e05555,#a02020)', color:'#fff', border:'none', borderRadius:12, cursor:'pointer', fontWeight:900, fontSize:'1.2rem', animation:'glow 0.8s infinite', boxShadow:'0 0 20px rgba(224,85,85,0.5)' }}>
              🛑 止める！
            </button>
          )}
          {/* 結果ログ */}
          <div style={{ display:'flex', gap:12, width:'100%', maxWidth:320 }}>
            {slotMyResult && (
              <div style={{ flex:1, background:'rgba(91,141,238,0.1)', border:'1px solid #5b8dee', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                <div style={{ fontSize:'0.7rem', color:'#5b8dee', marginBottom:4 }}>あなた</div>
                <div style={{ fontSize:'1.2rem' }}>{slotMyResult.symbols.join('')}</div>
                <div style={{ fontSize:'0.72rem', color: slotMyResult.rank>0?'#f0c060':'#4a5070', marginTop:2 }}>{slotMyResult.label}</div>
              </div>
            )}
            {slotOppResult && (
              <div style={{ flex:1, background:'rgba(224,85,85,0.1)', border:'1px solid #e05555', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                <div style={{ fontSize:'0.7rem', color:'#e05555', marginBottom:4 }}>{opponentName}</div>
                <div style={{ fontSize:'1.2rem' }}>{slotOppResult.symbols.join('')}</div>
                <div style={{ fontSize:'0.72rem', color: slotOppResult.rank>0?'#f0c060':'#4a5070', marginTop:2 }}>{slotOppResult.label}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 最終勝敗 */}
      {phase === 'final' && (
        <>
          <div style={{ fontSize:'5rem', animation:'pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {result.won ? '🏆' : '💔'}
          </div>
          <div style={{ fontSize:'2.5rem', fontWeight:900,
            color: result.won ? '#4caf87' : '#e05555',
            animation: result.won ? 'victoryPulse 1.5s infinite' : 'defeatPulse 1.5s infinite' }}>
            {result.won ? '勝利！！' : '敗北...'}
          </div>
          <div style={{ fontSize:'1.5rem', color: result.won ? '#4caf87' : '#e05555', fontWeight:700, animation:'pop 0.6s ease 0.2s both' }}>
            {result.won ? `+${result.amount.toLocaleString()}WC` : `-${result.amount.toLocaleString()}WC`}
          </div>
          <div style={{ fontSize:'0.82rem', color:'#8a92b2' }}>vs {opponentName} / {gameNameJp}</div>
          <button onClick={onDone} style={{
            marginTop:10, padding:'13px 40px',
            background: result.won ? 'linear-gradient(135deg,#4caf87,#2d8060)' : 'linear-gradient(135deg,#555,#333)',
            color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:900, fontSize:'1rem',
            boxShadow: result.won ? '0 0 20px rgba(76,175,135,0.4)' : 'none',
          }}>
            閉じる
          </button>
        </>
      )}
    </div>
  );
}

// ============================================================
// テキサスホールデム PvP パネル
// ============================================================

const SUIT_ICONS: Record<string,string> = { S:'♠', H:'♥', D:'♦', C:'♣' };
const SUIT_COLORS: Record<string,string> = { S:'#e8e6ff', H:'#e05555', D:'#e05555', C:'#e8e6ff' };

function TxCard({ rank, suit, faceDown = false, small = false }: { rank: string; suit: string; faceDown?: boolean; small?: boolean }) {
  const mobile = useIsMobile();
  const w = small ? (mobile ? 26 : 30) : (mobile ? 34 : 40), h = small ? (mobile ? 38 : 44) : (mobile ? 50 : 58);
  return (
    <div style={{
      width: w, height: h,
      background: faceDown ? 'linear-gradient(135deg,#1c2235,#2d3752)' : '#fff',
      boxShadow: faceDown ? 'inset 0 0 10px rgba(255,255,255,0.03)' : '0 6px 16px rgba(0,0,0,0.16)',
      border: `1.5px solid ${faceDown ? '#4a5070' : '#ccc'}`,
      borderRadius: 5, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontSize: small ? '0.7rem' : '0.85rem', fontWeight: 700,
      color: faceDown ? '#4a5070' : SUIT_COLORS[suit] ?? '#333',
      flexShrink: 0, userSelect: 'none',
    }}>
      {faceDown ? <span style={{fontSize:'1rem'}}>🂠</span> : <><span>{rank}</span><span>{SUIT_ICONS[suit]??suit}</span></>}
    </div>
  );
}

// ============================================================
// TH ルール説明パネル
// ============================================================
function THRulesPanel() {
  const [open, setOpen] = useState(false);
  const S = {
    wrap: { marginTop:10, background:'rgba(91,141,238,0.05)', border:'1px solid #2d3752', borderRadius:8, overflow:'hidden' as const },
    header: { display:'flex' as const, justifyContent:'space-between' as const, alignItems:'center' as const, padding:'8px 12px', cursor:'pointer' as const },
    body: { padding:'0 12px 12px' },
    h: { fontSize:'0.8rem', color:'#5b8dee', fontWeight:700 } as const,
    p: { fontSize:'0.72rem', color:'#8a92b2', lineHeight:1.6 } as const,
    section: { marginBottom:10 },
    title: { fontSize:'0.75rem', color:'#f0c060', fontWeight:700, marginBottom:4 } as const,
    hand: { display:'flex' as const, gap:6, flexWrap:'wrap' as const, marginBottom:4 },
    handItem: { fontSize:'0.68rem', background:'rgba(240,192,96,0.08)', border:'1px solid rgba(240,192,96,0.25)', borderRadius:4, padding:'2px 6px', color:'#e8e6ff' },
    action: { display:'flex' as const, gap:6, flexWrap:'wrap' as const, marginBottom:4 },
    actionItem: { fontSize:'0.68rem', borderRadius:4, padding:'2px 6px' },
  };
  return (
    <div style={S.wrap}>
      <div style={S.header} onClick={() => setOpen(o => !o)}>
        <span style={S.h}>📜 テキサスホールデム ルール説明</span>
        <span style={{ fontSize:'0.75rem', color:'#5b8dee' }}>{open ? '▲ 閉じる' : '▼ 開く'}</span>
      </div>
      {open && (
        <div style={S.body}>
          {/* 基本ルール */}
          <div style={S.section}>
            <div style={S.title}>🃏 基本ルール</div>
            <p style={S.p}>
              ジョーカーなし52枚のデッキを使用。2〜6人でプレイ。<br/>
              各プレイヤーに<strong style={{color:'#e8e6ff'}}>秘密の手札2枚（ホールカード）</strong>が配られ、
              全員共通の<strong style={{color:'#e8e6ff'}}>場のカード5枚（コミュニティカード）</strong>を合わせた
              計7枚の中から<strong style={{color:'#f0c060'}}>最も強い5枚の組み合わせ</strong>を作る。<br/>
              最強の役を持つプレイヤーが積み立てられたチップ（ポット）を総取り！
              他の全員がフォールドしても勝利になる。
            </p>
          </div>
          {/* ゲームの流れ */}
          <div style={S.section}>
            <div style={S.title}>🔄 ゲームの流れ</div>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:4 }}>
              {[
                ['①プリフロップ','手札2枚が配られる。SB・BBが強制ベット。UTG（BBの左隣）から時計回りにアクション開始。'],
                ['②フロップ','コミュニティカード3枚を公開。残っているプレイヤーでSBからアクション。'],
                ['③ターン','コミュニティカードをもう1枚追加（計4枚）。フロップと同様にアクション。'],
                ['④リバー','最後のコミュニティカードを公開（計5枚）。最後のベッティングラウンド。'],
                ['⑤ショーダウン','2人以上残っていれば手札を公開して勝敗決定。最強の5枚役を持つプレイヤーが勝利！'],
              ].map(([name, desc]) => (
                <div key={name} style={{ display:'flex', gap:8 }}>
                  <span style={{ fontSize:'0.72rem', color:'#5b8dee', fontWeight:700, whiteSpace:'nowrap' as const, minWidth:80 }}>{name}</span>
                  <span style={{ fontSize:'0.7rem', color:'#8a92b2', lineHeight:1.5 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
          {/* アクション */}
          <div style={S.section}>
            <div style={S.title}>⚡ アクション（行動）</div>
            <div style={S.action}>
              {[
                ['フォールド','rgba(224,85,85,0.2)','#e05555','手札を捨ててゲームから降りる。それまでの賭けは戻らない。'],
                ['チェック','rgba(76,175,135,0.2)','#4caf87','ベットせずに次の人へ。直前に賭けが上がっていない場合のみ可能。'],
                ['コール','rgba(91,141,238,0.2)','#5b8dee','直前のプレイヤーと同じ金額を出してゲームに残る。'],
                ['ベット','rgba(240,192,96,0.2)','#f0c060','そのラウンドで最初にチップを賭ける。'],
                ['レイズ','rgba(240,192,96,0.2)','#f0c060','直前の賭け金を上乗せしてさらに賭ける。'],
                ['オールイン','rgba(240,168,48,0.2)','#f0a830','持っているチップを全部賭ける！'],
              ].map(([name, bg, color, desc]) => (
                <div key={name} style={{ width:'100%', display:'flex', gap:8, alignItems:'flex-start' }}>
                  <span style={{ ...S.actionItem, background:bg, color, minWidth:60, textAlign:'center' as const, flexShrink:0 }}>{name}</span>
                  <span style={{ fontSize:'0.7rem', color:'#8a92b2' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 役の強さ */}
          <div style={S.section}>
            <div style={S.title}>👑 役の強さ（弱い順）</div>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:3 }}>
              {[
                ['①ハイカード','役なし。カード単体の強さで比較（A最強・2最弱）'],
                ['②ワンペア','同じ数字のペア1組（例：A♠A♥）'],
                ['③ツーペア','同じ数字のペア2組（例：K♠K♥と10♠10♥）'],
                ['④スリーカード','同じ数字3枚（セット・トリップスとも呼ぶ）'],
                ['⑤ストレート','数字が5枚連続（A-2-3-4-5が最弱、10-J-Q-K-Aが最強）'],
                ['⑥フラッシュ','同じマーク（スート）のカード5枚'],
                ['⑦フルハウス','スリーカード＋ワンペアの組み合わせ（例：Q-Q-Q と 7-7）'],
                ['⑧フォーカード','同じ数字4枚（クワッズ）'],
                ['⑨ストレートフラッシュ','同じマークで数字が5枚連続'],
                ['⑩ロイヤルフラッシュ','同じマークの10-J-Q-K-A。最強の役！'],
              ].map(([name, desc]) => (
                <div key={name} style={{ display:'flex', gap:8 }}>
                  <span style={{ fontSize:'0.7rem', color:'#f0c060', fontWeight:700, whiteSpace:'nowrap' as const, minWidth:100 }}>{name}</span>
                  <span style={{ fontSize:'0.68rem', color:'#8a92b2' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
          {/* ポジション */}
          <div style={S.section}>
            <div style={S.title}>📍 ポジションとブラインド</div>
            <p style={S.p}>
              <strong style={{color:'#e8e6ff'}}>ディーラー(D)</strong>: ゲームを仕切る役。各ゲームで時計回りに変わる。<br/>
              <strong style={{color:'#4caf87'}}>スモールブラインド(SB)</strong>: Dの左隣。参加費の1%を強制ベット。<br/>
              <strong style={{color:'#5b8dee'}}>ビッグブラインド(BB)</strong>: SBの左隣。参加費の2%を強制ベット。<br/>
              プリフロップはBBの左隣（UTG）からアクション開始。フロップ以降はSBからスタート。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TexasHoldemPanel() {
  const player = useGameStore(s => s.player);
  const changeWealthCoin = useGameStore(s => s.changeWealthCoin);
  const addNotification = useGameStore(s => s.addNotification);

  // ロビービュー
  const [tables, setTables] = useState<PokerTable[]>([]);
  const [myTableId, setMyTableId] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState<PokerTable | null>(null);

  // テーブル作成フォーム
  const [createForm, setCreateForm] = useState({ maxPlayers: 4, buyIn: 1000 });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ゲーム内アクション
  const [raiseInput, setRaiseInput] = useState(0);
  const [showRaise, setShowRaise] = useState(false);

  // ロビー購読
  useEffect(() => {
    const unsub = subscribePokerTables(setTables);
    return unsub;
  }, []);

  // 自分がいるテーブルを購読
  useEffect(() => {
    if (!myTableId) { setActiveTable(null); return; }
    const unsub = subscribePokerTable(myTableId, (t) => {
      if (!t) { setMyTableId(null); setActiveTable(null); return; }
      setActiveTable(t);
      // ゲーム終了時のゴールド処理
      if (t.status === 'finished' && player) {
        const me = t.players.find(p => p.uid === player.uid);
        if (me && me.chips > 0) {
          changeWealthCoin(me.chips);
          const net = me.chips - t.buyIn;
          postGambleFeed({ uid: player.uid, displayName: player.displayName, gameType: 'texas', amount: net }).catch(() => {}); if (net !== 0) postActivityFeed({ uid: player.uid, displayName: player.displayName, type: net > 0 ? 'gamble_win' : 'gamble_lose', message: net > 0 ? `がテキサスホールデムで${net.toLocaleString()}WC勝利しました！` : `がテキサスホールデムで${Math.abs(net).toLocaleString()}WC負けました` }).catch(() => {});
          if (net > 0) updateGambleRanking(player.uid, player.displayName, net).catch(() => {});
        }
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTableId, player?.uid]);

  const handleCreate = async () => {
    if (!player) return;
    if ((player.wealthCoin ?? 0) < createForm.buyIn) { addNotification('error', 'WCが足りません'); return; }
    setLoading(true);
    try {
      changeWealthCoin(-createForm.buyIn);
      const id = await createPokerTable(player.uid, player.displayName, player.stats.level, createForm.maxPlayers, createForm.buyIn);
      setMyTableId(id);
      setShowCreateForm(false);
      addNotification('success', `♠ テーブルを作成しました！参加者を待っています (${createForm.buyIn.toLocaleString()}WC)`);
    } catch (e) {
      changeWealthCoin(createForm.buyIn);
      addNotification('error', '作成に失敗しました');
    }
    setLoading(false);
  };

  const handleJoin = async (table: PokerTable) => {
    if (!player) return;
    if ((player.wealthCoin ?? 0) < table.buyIn) { addNotification('error', 'WCが足りません'); return; }
    setLoading(true);
    try {
      changeWealthCoin(-table.buyIn);
      const res = await joinPokerTable(table.id, player.uid, player.displayName, player.stats.level, table.buyIn);
      if (res.success) {
        setMyTableId(table.id);
        addNotification('success', `テーブルに参加しました！`);
      } else {
        changeWealthCoin(table.buyIn);
        addNotification('error', res.message ?? '参加に失敗しました');
      }
    } catch {
      changeWealthCoin(table.buyIn);
      addNotification('error', '参加に失敗しました');
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!player || !myTableId) return;
    setLoading(true);
    try {
      await cancelPokerTable(myTableId, player.uid);
      changeWealthCoin(createForm.buyIn); // 返金
      setMyTableId(null);
      addNotification('info', 'テーブルを取り消しました（返金済み）');
    } catch { addNotification('error', '取り消しに失敗しました'); }
    setLoading(false);
  };

  const handleLeave = async () => {
    if (!player || !myTableId || !activeTable) return;
    setLoading(true);
    try {
      await leavePokerTable(myTableId, player.uid);
      const me = activeTable.players.find(p => p.uid === player.uid);
      if (me) changeWealthCoin(me.chips); // 返金
      setMyTableId(null);
      addNotification('info', 'テーブルから退出しました（返金済み）');
    } catch { addNotification('error', '退出に失敗しました'); }
    setLoading(false);
  };

  const handleStart = async () => {
    if (!player || !myTableId) return;
    setLoading(true);
    try {
      const res = await startPokerGame(myTableId, player.uid);
      if (!res.success) addNotification('error', res.message ?? '開始に失敗しました');
    } catch { addNotification('error', '開始に失敗しました'); }
    setLoading(false);
  };

  const handleAction = async (action: 'fold'|'check'|'call'|'raise'|'allin', amount?: number) => {
    if (!player || !myTableId) return;
    setLoading(true);
    try {
      const res = await pokerAction(myTableId, player.uid, action, amount);
      if (!res.success) addNotification('error', res.message ?? 'アクションに失敗しました');
      setShowRaise(false);
    } catch { addNotification('error', 'アクションに失敗しました'); }
    setLoading(false);
  };

  // アクティブテーブルビュー（ゲーム中）
  if (activeTable && player) {
    const me = activeTable.players.find(p => p.uid === player.uid);
    const isHost = activeTable.hostUid === player.uid;
    const isMyTurn = activeTable.currentTurnUid === player.uid;
    const phase = activeTable.phase;
    const phaseName: Record<string,string> = { waiting:'待機中', preflop:'プリフロップ', flop:'フロップ', turn:'ターン', river:'リバー', showdown:'ショーダウン', finished:'終了' };
    const canCheck = me && !me.folded && me.bet >= activeTable.currentBet;
    const smallBlind = Math.max(1, Math.floor(activeTable.buyIn * 0.01));

    return (
      <div style={{ minHeight: 400 }}>
        {/* ヘッダー */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div>
            <span style={{ fontWeight:700, fontSize:'0.9rem', color:'#f0c060' }}>♠ テキサスホールデム</span>
            <span style={{ marginLeft:8, fontSize:'0.75rem', background:'rgba(91,141,238,0.2)', color:'#5b8dee', border:'1px solid #5b8dee', borderRadius:4, padding:'1px 6px' }}>{phaseName[phase] ?? phase}</span>
          </div>
          <span style={{ fontSize:'0.8rem', color:'#8a92b2' }}>ポット: <span style={{color:'#f0c060',fontWeight:700}}>{activeTable.pot.toLocaleString()}WC</span></span>
        </div>

        {/* コミュニティカード */}
        <div style={{ background:'rgba(76,175,135,0.08)', border:'1px solid #2d3752', borderRadius:8, padding:'10px', marginBottom:10, textAlign:'center' }}>
          <div style={{ fontSize:'0.72rem', color:'#4a5070', marginBottom:6 }}>コミュニティカード</div>
          <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
            {activeTable.communityCards.length === 0
              ? <span style={{ color:'#4a5070', fontSize:'0.78rem' }}>まだ公開されていません</span>
              : activeTable.communityCards.map((c,i) => <TxCard key={i} rank={c.rank} suit={c.suit} />)
            }
            {/* 残りはフェイスダウン */}
            {Array.from({ length: Math.max(0, 5 - activeTable.communityCards.length) }).map((_,i) => (
              <TxCard key={`fd-${i}`} rank='' suit='' faceDown />
            ))}
          </div>
        </div>

        {/* 自分の手札 */}
        {me && phase !== 'waiting' && (
          <div style={{ background:'rgba(91,141,238,0.08)', border:'1px solid #2d3752', borderRadius:8, padding:'10px', marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:'0.72rem', color:'#5b8dee' }}>あなたの手札</span>
              <span style={{ fontSize:'0.75rem', color:'#f0c060' }}>{me.chips.toLocaleString()} chips</span>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              {me.hand.map((c,i) => <TxCard key={i} rank={c.rank} suit={c.suit} />)}
            </div>
            {me.folded && <div style={{ textAlign:'center', color:'#e05555', fontSize:'0.8rem', marginTop:4 }}>フォールド済み</div>}
            {me.allIn && <div style={{ textAlign:'center', color:'#f0a830', fontSize:'0.8rem', marginTop:4 }}>オールイン！</div>}
          </div>
        )}

        {/* プレイヤー一覧 */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:'0.72rem', color:'#4a5070', marginBottom:4 }}>プレイヤー</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {activeTable.players.map(p => (
              <div key={p.uid} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', background: p.uid === activeTable.currentTurnUid ? 'rgba(240,192,96,0.1)' : '#161b26', border:`1px solid ${p.uid === activeTable.currentTurnUid ? '#f0c060' : '#2d3752'}`, borderRadius:6 }}>
                {p.uid === activeTable.dealerUid && <span style={{fontSize:'0.65rem',color:'#f0c060',fontWeight:700}}>D</span>}
                {p.uid === activeTable.smallBlindUid && phase !== 'waiting' && <span style={{fontSize:'0.65rem',color:'#4caf87',fontWeight:700}}>SB</span>}
                {p.uid === activeTable.bigBlindUid && phase !== 'waiting' && <span style={{fontSize:'0.65rem',color:'#5b8dee',fontWeight:700}}>BB</span>}
                <span style={{ fontWeight:700, fontSize:'0.82rem', flex:1, color: p.folded ? '#4a5070' : '#e8e6ff' }}>
                  {p.displayName}{p.uid === player.uid ? ' (あなた)' : ''} Lv.{p.level}
                </span>
                <span style={{ fontSize:'0.75rem', color:'#f0c060' }}>{p.chips.toLocaleString()}WC</span>
                {p.bet > 0 && <span style={{ fontSize:'0.7rem', color:'#8a92b2' }}>bet:{p.bet.toLocaleString()}</span>}
                {p.folded && <span style={{ fontSize:'0.65rem', color:'#e05555' }}>FOLD</span>}
                {p.allIn && <span style={{ fontSize:'0.65rem', color:'#f0a830' }}>ALL IN</span>}
                {/* ショーダウン時は全員の手札を表示 */}
                {(phase === 'showdown' || phase === 'finished') && p.hand.length > 0 && (
                  <div style={{ display:'flex', gap:2 }}>
                    {p.hand.map((c,i) => <TxCard key={i} rank={c.rank} suit={c.suit} small />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ショーダウン/終了結果 */}
        {(phase === 'showdown' || phase === 'finished') && activeTable.winners && activeTable.winners.length > 0 && (
          <div style={{ background:'rgba(76,175,135,0.1)', border:'1px solid #4caf87', borderRadius:8, padding:'10px', marginBottom:10, textAlign:'center' }}>
            <div style={{ fontWeight:700, color:'#4caf87', marginBottom:4 }}>🏆 勝者</div>
            {activeTable.winners.map((w,i) => (
              <div key={i} style={{ fontSize:'0.85rem', color:'#e8e6ff' }}>
                {w.displayName}（{w.handName}）+{w.amount.toLocaleString()}WC
              </div>
            ))}
          </div>
        )}

        {/* アクションボタン */}
        {phase === 'waiting' && isHost && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ fontSize:'0.78rem', color:'#8a92b2', textAlign:'center' }}>
              参加者: {activeTable.players.length}/{activeTable.maxPlayers}人 | 参加費: {activeTable.buyIn.toLocaleString()}WC
            </div>
            <button onClick={handleStart} disabled={loading || activeTable.players.length < 2}
              style={{ padding:'9px', background: activeTable.players.length >= 3 ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
              {activeTable.players.length < 2 ? `あと${2 - activeTable.players.length}人必要` : '▶ ゲームを開始する'}
            </button>
            <button onClick={handleCancel} disabled={loading}
              style={{ padding:'7px', background:'#1c2235', color:'#e05555', border:'1px solid #e05555', borderRadius:7, cursor:'pointer', fontSize:'0.8rem' }}>
              テーブルを取り消す（返金）
            </button>
          </div>
        )}
        {phase === 'waiting' && !isHost && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ fontSize:'0.78rem', color:'#8a92b2', textAlign:'center' }}>
              ホスト({activeTable.hostName})がゲームを開始するのを待っています... ({activeTable.players.length}/{activeTable.maxPlayers}人)
            </div>
            <button onClick={handleLeave} disabled={loading}
              style={{ padding:'7px', background:'#1c2235', color:'#e05555', border:'1px solid #e05555', borderRadius:7, cursor:'pointer', fontSize:'0.8rem' }}>
              退出する（返金）
            </button>
          </div>
        )}
        {isMyTurn && !me?.folded && phase !== 'waiting' && phase !== 'finished' && phase !== 'showdown' && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:'0.75rem', color:'#f0c060', textAlign:'center', marginBottom:6, fontWeight:700 }}>🎯 あなたのターン！</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <button onClick={() => handleAction('fold')} disabled={loading}
                style={{ flex:1, minWidth:60, padding:'8px 4px', background:'rgba(224,85,85,0.2)', color:'#e05555', border:'1px solid #e05555', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
                フォールド
              </button>
              {canCheck ? (
                <button onClick={() => handleAction('check')} disabled={loading}
                  style={{ flex:1, minWidth:60, padding:'8px 4px', background:'rgba(76,175,135,0.2)', color:'#4caf87', border:'1px solid #4caf87', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
                  チェック
                </button>
              ) : (
                <button onClick={() => handleAction('call')} disabled={loading}
                  style={{ flex:1, minWidth:60, padding:'8px 4px', background:'rgba(91,141,238,0.2)', color:'#5b8dee', border:'1px solid #5b8dee', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
                  コール ({(activeTable.currentBet - (me?.bet ?? 0)).toLocaleString()}WC)
                </button>
              )}
              <button onClick={() => setShowRaise(!showRaise)} disabled={loading}
                style={{ flex:1, minWidth:60, padding:'8px 4px', background:'rgba(240,192,96,0.2)', color:'#f0c060', border:'1px solid #f0c060', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
                レイズ
              </button>
              <button onClick={() => handleAction('allin')} disabled={loading}
                style={{ flex:1, minWidth:60, padding:'8px 4px', background:'rgba(240,168,48,0.2)', color:'#f0a830', border:'1px solid #f0a830', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
                オールイン
              </button>
            </div>
            {showRaise && (
              <div style={{ marginTop:8, display:'flex', gap:6, alignItems:'center' }}>
                <input type="number" value={raiseInput} min={smallBlind} max={me?.chips ?? 0}
                  onChange={e => setRaiseInput(Number(e.target.value))}
                  style={{ flex:1, padding:'6px 8px', background:'#1c2235', border:'1px solid #f0c060', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem' }}
                />
                <button onClick={() => handleAction('raise', raiseInput)} disabled={loading || raiseInput < smallBlind}
                  style={{ padding:'6px 14px', background:'linear-gradient(135deg,#f0c060,#d0a040)', color:'#000', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
                  レイズ確定
                </button>
              </div>
            )}
          </div>
        )}
        {!isMyTurn && phase !== 'waiting' && phase !== 'finished' && phase !== 'showdown' && (
          <div style={{ textAlign:'center', color:'#8a92b2', fontSize:'0.8rem', padding:'8px 0' }}>
            {activeTable.players.find(p => p.uid === activeTable.currentTurnUid)?.displayName ?? '？'} のターンを待っています...
          </div>
        )}
        {phase === 'finished' && (
          <button onClick={() => setMyTableId(null)}
            style={{ width:'100%', marginTop:8, padding:'9px', background:'#2d3752', color:'#e8e6ff', border:'none', borderRadius:7, cursor:'pointer', fontWeight:700 }}>
            ロビーに戻る
          </button>
        )}
      </div>
    );
  }

  // ロビービュー
  return (
    <div>
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:'0.85rem', color:'#f0c060', fontWeight:700 }}>♠ テキサスホールデム対戦</span>
          <button onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ padding:'5px 12px', background: showCreateForm ? '#2d3752' : 'linear-gradient(135deg,#5b8dee,#3a6fd0)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem', fontWeight:700 }}>
            {showCreateForm ? 'キャンセル' : '+ テーブルを作る'}
          </button>
        </div>

        {showCreateForm && (
          <div style={{ background:'rgba(91,141,238,0.08)', border:'1px solid #2d3752', borderRadius:8, padding:'12px', marginBottom:12 }}>
            <div style={{ fontSize:'0.8rem', color:'#8a92b2', marginBottom:8 }}>テーブル設定</div>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:'0.75rem', color:'#8a92b2', marginBottom:4 }}>参加人数（2〜6人）</div>
              <div style={{ display:'flex', gap:4 }}>
                {[2,3,4,5,6].map(n => (
                  <button key={n} onClick={() => setCreateForm(f => ({...f, maxPlayers:n}))}
                    style={{ flex:1, padding:'6px', background: createForm.maxPlayers === n ? 'rgba(91,141,238,0.3)' : '#1c2235', border:`1px solid ${createForm.maxPlayers === n ? '#5b8dee' : '#2d3752'}`, color: createForm.maxPlayers === n ? '#e8e6ff' : '#8a92b2', borderRadius:4, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
                    {n}人
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:'0.75rem', color:'#8a92b2', marginBottom:4 }}>参加費（掛け金）</div>
              <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                {[500,1000,5000,10000].map(v => (
                  <button key={v} onClick={() => setCreateForm(f => ({...f, buyIn:v}))}
                    style={{ flex:1, padding:'4px 2px', background: createForm.buyIn === v ? 'rgba(240,192,96,0.2)' : '#1c2235', border:`1px solid ${createForm.buyIn === v ? '#f0c060' : '#2d3752'}`, color: createForm.buyIn === v ? '#f0c060' : '#8a92b2', borderRadius:4, cursor:'pointer', fontSize:'0.72rem' }}>
                    {v.toLocaleString()}WC
                  </button>
                ))}
              </div>
              <input type="number" value={createForm.buyIn} min={100}
                onChange={e => setCreateForm(f => ({...f, buyIn: Math.max(100, Number(e.target.value))}))}
                style={{ width:'100%', padding:'6px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem', boxSizing:'border-box' as const }}
              />
            </div>
            <div style={{ fontSize:'0.72rem', color:'#4a5070', marginBottom:8 }}>
              ブラインド: SB {Math.max(1,Math.floor(createForm.buyIn*0.01)).toLocaleString()}WC / BB {Math.max(2,Math.floor(createForm.buyIn*0.02)).toLocaleString()}WC<br/>
              ※ 参加費は先払い。キャンセルで全額返金。{createForm.maxPlayers}人全員が揃ったらホストがゲームを開始します。
            </div>
            <button onClick={handleCreate} disabled={loading || (player?.wealthCoin ?? 0) < createForm.buyIn}
              style={{ width:'100%', padding:'8px', background:(player?.wealthCoin ?? 0) >= createForm.buyIn ? 'linear-gradient(135deg,#5b8dee,#3a6fd0)' : '#2d3752', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
              {(player?.wealthCoin ?? 0) >= createForm.buyIn ? `♠ テーブルを作成 (${createForm.buyIn.toLocaleString()}WC)` : 'WCが足りない'}
            </button>
          </div>
        )}
      </div>

      <div style={{ fontSize:'0.85rem', color:'#f0c060', fontWeight:700, marginBottom:8 }}>🔍 募集中のテーブル ({tables.length}件)</div>
      {tables.length === 0 ? (
        <div style={{ textAlign:'center', color:'#4a5070', fontSize:'0.82rem', padding:'20px 0' }}>
          現在募集中のテーブルはありません<br />
          <span style={{ fontSize:'0.75rem' }}>テーブルを作って仲間を募集しよう！</span>
        </div>
      ) : (
        tables.map(t => {
          const isFull = t.players.length >= t.maxPlayers;
          const alreadyIn = t.players.some(p => p.uid === player?.uid);
          return (
            <div key={t.id} style={{ background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'10px 12px', marginBottom:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div>
                  <span style={{ fontWeight:700, fontSize:'0.9rem' }}>♠ {t.hostName}</span>
                  <span style={{ marginLeft:6, fontSize:'0.72rem', color:'#5b8dee' }}>Lv.{t.hostLevel}</span>
                </div>
                <span style={{ color:'#f0c060', fontWeight:700 }}>{t.buyIn.toLocaleString()}WC</span>
              </div>
              <div style={{ fontSize:'0.75rem', color:'#8a92b2', marginBottom:8 }}>
                参加: {t.players.length}/{t.maxPlayers}人 | ブラインド: {Math.max(1,Math.floor(t.buyIn*0.01)).toLocaleString()}WC/{Math.max(2,Math.floor(t.buyIn*0.02)).toLocaleString()}WC
              </div>
              {/* プレイヤーリスト */}
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
                {t.players.map(p => (
                  <span key={p.uid} style={{ fontSize:'0.68rem', background:'rgba(91,141,238,0.15)', color:'#5b8dee', border:'1px solid #2d3752', borderRadius:3, padding:'1px 5px' }}>
                    {p.displayName}
                  </span>
                ))}
                {Array.from({length: t.maxPlayers - t.players.length}).map((_,i) => (
                  <span key={`empty-${i}`} style={{ fontSize:'0.68rem', background:'#161b26', color:'#4a5070', border:'1px dashed #2d3752', borderRadius:3, padding:'1px 5px' }}>
                    空席
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleJoin(t)}
                disabled={loading || isFull || alreadyIn || (player?.wealthCoin ?? 0) < t.buyIn}
                style={{ width:'100%', padding:'6px', background: (!isFull && !alreadyIn && (player?.wealthCoin??0) >= t.buyIn) ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
                {alreadyIn ? '参加済み' : isFull ? '満員' : (player?.wealthCoin??0) < t.buyIn ? 'WCが足りない' : `参加する (${t.buyIn.toLocaleString()}WC)`}
              </button>
            </div>
          );
        })
      )}
      {/* ルール説明 */}
      <THRulesPanel />
    </div>
  );
}

// ============================================================
// PvP対戦パネル
// ============================================================
function PvPPanel({ bet }: { bet: number }) {
  const player = useGameStore(s => s.player);
  const changeWealthCoin = useGameStore(s => s.changeWealthCoin);
  const addNotification = useGameStore(s => s.addNotification);
  const [battles, setBattles] = useState<GambleBattle[]>([]);
  const [myBattleId, setMyBattleId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState('chohan');
  const [loading, setLoading] = useState(false);
  const [battleAnim, setBattleAnim] = useState<{ opponentName: string; gameName: string; result: { won: boolean; amount: number }; battleData: import('../../types/game').GambleBattleData | undefined; iAmHost: boolean } | null>(null);
  // ホスト側：既に金を処理済みかフラグ管理
  const processedBattleRef = useState<Set<string>>(() => new Set())[0];

  useEffect(() => {
    const unsub = subscribeGambleBattles(setBattles);
    return unsub;
  }, []);

  // ホストが自分のバトルをリアルタイム監視
  useEffect(() => {
    if (!myBattleId || !player) return;
    const unsub = subscribeGambleBattle(myBattleId, (battle) => {
      if (!battle) { setMyBattleId(null); return; }
      if (battle.status === 'finished' && battle.winnerId && !processedBattleRef.has(battle.id)) {
        processedBattleRef.add(battle.id);
        const iWon = battle.winnerId === player.uid;
        // ホストは募集時に金を引いていないので、勝ちなら+betAmount×2、負けなら-betAmount
        if (iWon) {
          changeWealthCoin(battle.betAmount * 2); // 自分の掛け金 + 相手の掛け金
        }
        // 負けの場合は handleHost で既に -betAmount してあるので追加処理なし
        const pvpNet = iWon ? battle.betAmount : -battle.betAmount;
        postGambleFeed({ uid: player.uid, displayName: player.displayName, gameType: battle.gambleType ?? 'pvp', amount: pvpNet }).catch(() => {});
        postActivityFeed({ uid: player.uid, displayName: player.displayName, type: iWon ? 'gamble_win' : 'gamble_lose', message: iWon ? `がPvPで${battle.betAmount.toLocaleString()}WC勝利しました！` : `がPvPで${battle.betAmount.toLocaleString()}WC負けました` }).catch(() => {});
        if (iWon) updateGambleRanking(player.uid, player.displayName, battle.betAmount).catch(() => {});
        setBattleAnim({
          opponentName: battle.guestName ?? '相手',
          gameName: battle.gambleType,
          result: { won: iWon, amount: battle.betAmount },
          battleData: battle.battleData,
          iAmHost: true,
        });
        setMyBattleId(null);
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myBattleId, player?.uid]);

  const GAME_NAMES: Record<string, string> = {
    chohan: '丁半', chinchiro: 'チンチロリン', coin_flip: 'コインフリップ', slot_machine: 'スロット',
  };

  const handleHost = async () => {
    if (!player || (player.wealthCoin ?? 0) < bet) { addNotification('error', 'WCが足りません'); return; }
    if (myBattleId) { addNotification('warning', '既に募集中です'); return; }
    setLoading(true);
    try {
      // 募集時に掛け金を先払い（エスクロー）
      changeWealthCoin(-bet);
      const id = await createGambleBattle(player.uid, player.displayName, player.stats.level, selectedGame, bet);
      setMyBattleId(id);
      addNotification('success', `⚔️ 対戦を募集開始しました！ (${bet.toLocaleString()}WC)`);
    } catch (e) {
      // 失敗したら返金
      changeWealthCoin(bet);
      const msg = e instanceof Error ? e.message : String(e);
      addNotification('error', `募集に失敗しました: ${msg.slice(0, 60)}`);
    }
    setLoading(false);
  };

  const handleCancelHost = async () => {
    if (!player || !myBattleId) return;
    setLoading(true);
    try {
      await cancelGambleBattle(myBattleId, player.uid);
      // キャンセル時は返金
      changeWealthCoin(bet);
      setMyBattleId(null);
      addNotification('info', '募集をキャンセルしました（返金済み）');
    } catch { addNotification('error', 'キャンセルに失敗しました'); }
    setLoading(false);
  };

  const handleJoin = async (battle: GambleBattle) => {
    if (!player) return;
    if ((player.wealthCoin ?? 0) < battle.betAmount) { addNotification('error', 'WCが足りません'); return; }
    setLoading(true);
    try {
      // 参加時に掛け金を払う
      changeWealthCoin(-battle.betAmount);
      const { success, battle: result } = await joinGambleBattle(battle.id, player.uid, player.displayName);
      if (success && result) {
        const iWon = result.winnerId === player.uid;
        if (iWon) {
          // 勝ちなら自分の掛け金 + 相手の掛け金を受取
          changeWealthCoin(battle.betAmount * 2);
        }
        // 負けの場合は既に -betAmount 済みなので追加処理なし
        const pvpNet = iWon ? battle.betAmount : -battle.betAmount;
        postGambleFeed({ uid: player.uid, displayName: player.displayName, gameType: battle.gambleType ?? 'pvp', amount: pvpNet }).catch(() => {});
        postActivityFeed({ uid: player.uid, displayName: player.displayName, type: iWon ? 'gamble_win' : 'gamble_lose', message: iWon ? `がPvPで${battle.betAmount.toLocaleString()}WC勝利しました！` : `がPvPで${battle.betAmount.toLocaleString()}WC負けました` }).catch(() => {});
        if (iWon) updateGambleRanking(player.uid, player.displayName, battle.betAmount).catch(() => {});
        setBattleAnim({
          opponentName: battle.hostName,
          gameName: battle.gambleType,
          result: { won: iWon, amount: battle.betAmount },
          battleData: result?.battleData,
          iAmHost: false,
        });
      } else {
        // 参加失敗→返金
        changeWealthCoin(battle.betAmount);
        addNotification('error', '参加に失敗しました（既に終了）');
      }
    } catch {
      changeWealthCoin(battle.betAmount);
      addNotification('error', '参加に失敗しました');
    }
    setLoading(false);
  };

  const otherBattles = battles.filter(b => b.hostUid !== player?.uid);
  const myBattle = battles.find(b => b.id === myBattleId);

  return (
    <div>
      {battleAnim && (
        <BattleAnimation
          opponentName={battleAnim.opponentName}
          gameName={battleAnim.gameName}
          result={battleAnim.result}
          battleData={battleAnim.battleData}
          iAmHost={battleAnim.iAmHost}
          onDone={() => setBattleAnim(null)}
        />
      )}
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
        <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 8 }}>
          掛け金: {bet.toLocaleString()}WC | ゲーム: {GAME_NAMES[selectedGame]}<br />
          <span style={{ color: '#4a5070' }}>※ 募集時に掛け金が引かれます。キャンセルで返金。</span>
        </div>
        {myBattleId && myBattle ? (
          <div style={{ background: 'rgba(91,141,238,0.1)', border: '1px solid #5b8dee', borderRadius: 6, padding: '8px 10px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#5b8dee' }}>🔄 参加者募集中... ({bet.toLocaleString()}WC エスクロー中)</span>
            <button onClick={handleCancelHost} disabled={loading} style={{ padding: '4px 10px', background: '#e05555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>取消</button>
          </div>
        ) : (
          <button onClick={handleHost} disabled={loading || (player?.wealthCoin ?? 0) < bet}
            style={{ width: '100%', padding: '8px', background: (player?.wealthCoin ?? 0) >= bet ? 'linear-gradient(135deg,#5b8dee,#3a6fd0)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            ⚔️ {bet.toLocaleString()}WC で対戦を募集する
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
              <span style={{ color: '#f0c060', fontWeight: 700 }}>{b.betAmount.toLocaleString()}WC</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginBottom: 8 }}>
              ゲーム: {GAME_NAMES[b.gambleType] ?? b.gambleType} | 勝者獲得: {(b.betAmount * 2).toLocaleString()}WC
            </div>
            <button onClick={() => handleJoin(b)} disabled={loading || (player?.wealthCoin ?? 0) < b.betAmount}
              style={{ width: '100%', padding: '6px', background: (player?.wealthCoin ?? 0) >= b.betAmount ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
              {(player?.wealthCoin ?? 0) >= b.betAmount ? `参加する (${b.betAmount.toLocaleString()}WC)` : 'WCが足りない'}
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

// スロット専用パネル（リール本格演出）
// スロット台定義
const SLOT_TIERS = [
  { bet: 100,     label: '100WC台',       color: '#8a92b2' },
  { bet: 1000,    label: '1,000WC台',     color: '#4caf87' },
  { bet: 10000,   label: '10,000WC台',    color: '#5b8dee' },
  { bet: 100000,  label: '100,000WC台',   color: '#f0a830' },
  { bet: 1000000, label: '1,000,000WC台', color: '#e060e0' },
] as const;

// スロット専用パネル（固定台制・台別ジャックポット）
function SlotPanel({ onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: { onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void }) {
  const { player, changeWealthCoin, addItems, addNotification } = useGameStore(s => ({ player: s.player, changeWealthCoin: s.changeWealthCoin, addItems: s.addItems, addNotification: s.addNotification }));
  const [selectedTier, setSelectedTier] = useState(0); // index into SLOT_TIERS
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [finalSyms, setFinalSyms] = useState<string[]|null>(null);
  const [reelFrames, setReelFrames] = useState([0,0,0]);
  const [tierPools, setTierPools] = useState<number[]>([0,0,0,0,0]);
  const SLOT_SYM = ['🍒','💰','🌟','🍋','🔄','👑','🔔','⭐'];
  const game = GAMBLE_MASTER['slot_machine'];
  const tier = SLOT_TIERS[selectedTier];
  const bet = tier.bet;

  useEffect(() => {
    const unsubs = SLOT_TIERS.map((t, i) =>
      subscribeSlotJackpotPool(t.bet, (pool) => {
        setTierPools(prev => { const n = [...prev]; n[i] = pool; return n; });
      })
    );
    return () => unsubs.forEach(u => u());
  }, []);

  const play = async () => {
    if (animating || !player || (player.wealthCoin ?? 0) < bet) { addNotification('error', 'WCが足りません！'); return; }
    setAnimating(true); setResult(null); setFinalSyms(null);
    onLockChange?.(true);
    changeWealthCoin(-bet);
    onJackpotContrib(bet);
    await contributeToSlotJackpot(bet, bet);
    const r = resolveGenericGamble(game, bet, multiplierBonus);

    setSpinning(true);
    let cnt = 0;
    const t = setInterval(() => {
      setReelFrames([
        Math.floor(secureRandom()*SLOT_SYM.length),
        Math.floor(secureRandom()*SLOT_SYM.length),
        Math.floor(secureRandom()*SLOT_SYM.length),
      ]);
      cnt++;
    }, 80);

    const syms = r.symbols ?? [SLOT_SYM[0], SLOT_SYM[1], SLOT_SYM[2]];
    const stopReel = (idx: number, delay: number) => {
      setTimeout(() => {
        setReelFrames(prev => { const n=[...prev]; n[idx] = SLOT_SYM.indexOf(syms[idx] ?? SLOT_SYM[0]); return n; });
        setFinalSyms(prev => { const n = prev ? [...prev] : [null,null,null] as any; n[idx] = syms[idx]; return n; });
      }, delay);
    };
    stopReel(0, 900); stopReel(1, 1400); stopReel(2, 1900);

    setTimeout(async () => {
      clearInterval(t);
      setSpinning(false);
      setFinalSyms(syms as string[]);
      if (r.multiplier > 0) changeWealthCoin(r.goldDelta + bet);
      if (r.itemRewards.length > 0) addItems(r.itemRewards);
      if (r.rewardLabel.includes('REPLAY')) addNotification('success', '🔄 REPLAY！掛け金返還！');
      setResult(r); onResult(r);
      if (player) {
        const winGold = Math.floor(bet * r.multiplier);
        const netWinSlot = winGold - bet;
        const type = r.multiplier > 0 ? (netWinSlot >= 50000 ? 'super_jackpot' : 'gamble_win') : 'gamble_lose';
        const msg = r.multiplier > 0 ? `が${game.name}で${netWinSlot.toLocaleString()}WC勝利しました！` : `が${game.name}で${bet.toLocaleString()}WC負けました`;
        postActivityFeed({ uid: player.uid, displayName: player.displayName, type, message: msg }).catch(() => {});
        const netAmount = r.multiplier > 0 ? Math.floor(bet * (r.multiplier - 1)) : -bet;
        postGambleFeed({ uid: player.uid, displayName: player.displayName, gameType: 'slot', amount: netAmount }).catch(() => {});
      }
      try {
        const { won, pool } = await checkSlotJackpotWin(bet);
        if (won && pool > 0) {
          changeWealthCoin(pool);
          addNotification('success', `🌟🌟🌟 ${tier.label} JACKPOT!! ${pool.toLocaleString()}WC！`);
          if (player) postGambleFeed({ uid: player.uid, displayName: player.displayName, gameType: 'jackpot', amount: pool, isJackpot: true }).catch(() => {});
        }
      } catch { /**/ }
      setAnimating(false);
      onLockChange?.(false);
    }, 2300);
  };

  const isWin = result && result.goldDelta >= 0;

  return (
    <div>
      <style>{`
        @keyframes reelSpin{0%{transform:translateY(0)}100%{transform:translateY(-600%)}}
        @keyframes reelStop{0%{transform:translateY(-20px)}100%{transform:translateY(0)}}
        @keyframes jackpotGlow{0%,100%{box-shadow:0 0 10px rgba(240,192,96,0.5)}50%{box-shadow:0 0 40px rgba(240,192,96,1),0 0 80px rgba(240,192,96,0.5)}}
      `}</style>
      {/* 台選択 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 6 }}>🎰 台を選択</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SLOT_TIERS.map((t, i) => (
            <button key={i} onClick={() => { setSelectedTier(i); setResult(null); setFinalSyms(null); }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px',
                background: selectedTier === i ? `rgba(${t.color === '#8a92b2' ? '138,146,178' : t.color === '#4caf87' ? '76,175,135' : t.color === '#5b8dee' ? '91,141,238' : t.color === '#f0a830' ? '240,168,48' : '224,96,224'},0.2)` : '#161b26',
                border: `1px solid ${selectedTier === i ? t.color : '#2d3752'}`, borderRadius: 8, cursor: 'pointer' }}>
              <div>
                <span style={{ fontWeight: 700, color: t.color, fontSize: '0.85rem' }}>{t.label}</span>
                <span style={{ fontSize: '0.7rem', color: '#4a5070', marginLeft: 8 }}>賭け金: {t.bet.toLocaleString()}WC</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#f0c060' }}>JP: {tierPools[i].toLocaleString()}WC</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* JP表示（選択中台） */}
      {tierPools[selectedTier] > 0 && (
        <div style={{ background: 'linear-gradient(135deg,rgba(240,192,96,0.12),rgba(240,168,48,0.12))', border: `2px solid ${tier.color}`, borderRadius: 10, padding: '8px 14px', marginBottom: 10, textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2' }}>🌟 {tier.label} ジャックポット</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f0c060' }}>{tierPools[selectedTier].toLocaleString()}WC</div>
        </div>
      )}
      {/* スロットマシン本体 */}
      <div style={{ background:'linear-gradient(135deg,#1a1f30,#0f1220)', border:`3px solid ${tier.color}`, borderRadius:16, padding:'16px', marginBottom:10, textAlign:'center', boxShadow: result && isWin ? '0 0 30px rgba(240,192,96,0.4)' : 'none', animation: result && isWin ? 'jackpotGlow 1s infinite' : 'none' }}>
        <div style={{ fontSize:'0.7rem', color:'#4a5070', marginBottom:8, letterSpacing:2 }}>🎰 {tier.label} 🎰</div>
        <div style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'center', marginBottom:10 }}>
          {[0,1,2].map(i => {
            const sym = finalSyms?.[i] ?? null;
            const stopped = sym !== null;
            return (
              <div key={i} style={{ width:72, height:88, background:'#0a0d18', border:`3px solid ${stopped ? tier.color : '#2d3752'}`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', boxShadow: stopped && isWin ? `0 0 20px rgba(240,192,96,0.5)` : 'none', transition:'border-color 0.3s, box-shadow 0.3s' }}>
                <span style={{ fontSize:'2.5rem', display:'block', animation: spinning && !stopped ? 'reelSpin 0.2s linear infinite' : stopped ? 'reelStop 0.3s ease' : 'none' }}>
                  {stopped ? sym : SLOT_SYM[reelFrames[i] % SLOT_SYM.length]}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ width:'100%', height:2, background: isWin ? '#f0c060' : '#2d3752', borderRadius:1, marginBottom:8, transition:'background 0.5s' }} />
        {result && <div style={{ fontSize:'1rem', fontWeight:900, color: isWin ? '#f0c060' : '#4a5070' }}>{result.symbols?.join(' ') ?? ''} {result.rewardLabel}</div>}
        {spinning && !finalSyms && <div style={{ fontSize:'0.8rem', color:'#8a92b2' }}>リール回転中...</div>}
      </div>
      {result && <ResultDisplay result={result} bet={bet} />}
      <button onClick={play} disabled={animating}
        style={{ width:'100%', padding:12, background: animating ? '#2d3752' : `linear-gradient(135deg,${tier.color},${tier.color}cc)`, color: animating ? '#8a92b2' : '#fff', border:'none', borderRadius:8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:'1rem' }}>
        {animating ? '🎰 回転中...' : `🎰 ${bet.toLocaleString()}WC でプレイ`}
      </button>
    </div>
  );
}

function GenericPanel({ game, bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: { game: GambleMaster; bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void }) {
  const { player, changeGold: _cg2, changeWealthCoin, addItems, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, changeWealthCoin: s.changeWealthCoin, addItems: s.addItems, addNotification: s.addNotification }));
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const pendingRef = useState<{ r: GambleResult | null }>({ r: null })[0];

  const play = async () => {
    if (animating || !player || (player.wealthCoin ?? 0) < bet) { addNotification('error', 'WCが足りません！'); return; }
    setAnimating(true);
    setResult(null);
    onLockChange?.(true);
    changeWealthCoin(-bet);
    onJackpotContrib(bet); // ジャックポット積立

    const r = resolveGenericGamble(game, bet, multiplierBonus);
    pendingRef.r = r;
    setShowAnim(true);
  };

  const handleAnimDone = async () => {
    setShowAnim(false);
    const r = pendingRef.r;
    if (!r) { setAnimating(false); onLockChange?.(false); return; }
    if (r.multiplier > 0) changeWealthCoin(r.goldDelta + bet);
    if (r.itemRewards.length > 0) addItems(r.itemRewards);
    setResult(r);
    onResult(r);
    // アクティビティフィードに投稿
    if (player) {
      const winGold = Math.floor(bet * r.multiplier);
      const netWin = winGold - bet;
      const type = r.multiplier > 0 ? (netWin >= 50000 ? 'super_jackpot' : 'gamble_win') : 'gamble_lose';
      const msg = r.multiplier > 0
        ? `が${game.name}で${netWin.toLocaleString()}WC勝利しました！`
        : `が${game.name}で${bet.toLocaleString()}WC負けました`;
      postActivityFeed({ uid: player.uid, displayName: player.displayName, type, message: msg }).catch(() => {});
      // ギャンブル速報
      const gameTypeCode = game.type === 'slot' ? 'slot'
        : game.type === 'highlow' ? 'highlow'
        : game.type === 'chohan' ? 'chohan'
        : game.type === 'chinchiro' ? 'chinchiro'
        : game.type === 'coin_flip' ? 'coin_flip'
        : game.type === 'treasure_box' ? 'treasure'
        : game.type === 'poker' ? 'poker'
        : 'slot';
      const netAmt2 = r.multiplier > 0 ? Math.floor(bet * (r.multiplier - 1)) : -bet;
      postGambleFeed({ uid: player.uid, displayName: player.displayName, gameType: gameTypeCode, amount: netAmt2 }).catch(() => {});
    }
    try {
      const { won, pool } = await checkJackpotWin();
      if (won && pool > 0) {
        changeWealthCoin(pool);
        addNotification('success', `🌟🌟🌟 JACKPOT!! ${pool.toLocaleString()}WC獲得！！🌟🌟🌟`);
        if (player) {
          postActivityFeed({ uid: player.uid, displayName: player.displayName, type: 'gamble_win', message: `が🌟JACKPOTで${pool.toLocaleString()}WC獲得！！` }).catch(() => {});
          postGambleFeed({ uid: player.uid, displayName: player.displayName, gameType: 'jackpot', amount: pool, isJackpot: true }).catch(() => {});
        }
      }
    } catch { /* ignore */ }
    setAnimating(false);
    onLockChange?.(false);
  };

  const animType = game.type === 'slot' ? 'slot' : game.type === 'treasure_box' ? 'treasure_box' : 'generic';

  return (
    <div>
      {showAnim && <GameAnimation type={animType as 'slot'|'treasure_box'|'generic'} onDone={handleAnimDone} />}
      {result && !animating && <ResultDisplay result={result} bet={bet} />}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 12, background: animating ? '#2d3752' : 'linear-gradient(135deg,#5b8dee,#3a6fd0)', color: '#fff', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        {animating ? '結果を出しています...' : <span style={{display:'inline-flex',alignItems:'center',gap:6}}><GameIcon id={game.icon} size={18} /> {bet.toLocaleString()}WC で挑戦</span>}
      </button>
    </div>
  );
}

function ChohanPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void }) {
  const { player, changeWealthCoin, addNotification } = useGameStore(s => ({ player: s.player, changeWealthCoin: s.changeWealthCoin, addNotification: s.addNotification }));
  const [choice, setChoice] = useState<'cho'|'han'>('cho');
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [phase, setPhase] = useState<'idle'|'rolling'|'reveal'|'done'>('idle');
  const [rollingFrame, setRollingFrame] = useState(0);
  const [finalDice, setFinalDice] = useState<number[]|null>(null);
  const pendingRef = useState<{ r: GambleResult | null }>({ r: null })[0];
  const DICE_EJ = ['⚀','⚁','⚂','⚃','⚄','⚅'];

  const play = async () => {
    if (animating || !player || (player.wealthCoin ?? 0) < bet) { addNotification('error', 'WCが足りません！'); return; }
    setAnimating(true); setResult(null); setFinalDice(null);
    onLockChange?.(true);
    changeWealthCoin(-bet); onJackpotContrib(bet);
    const r = playChohan(bet, choice);
    const adjustedDelta = r.goldDelta > 0 ? Math.floor(r.goldDelta * multiplierBonus) : r.goldDelta;
    pendingRef.r = { ...r, goldDelta: adjustedDelta };
    setPhase('rolling');
    let cnt = 0;
    const t = setInterval(() => {
      setRollingFrame(f => (f+1)%6);
      cnt++;
      if (cnt >= 20) {
        clearInterval(t);
        const dice = Array.isArray((r as any).dice) ? (r as any).dice as number[] : [Math.floor(secureRandom()*6)+1, Math.floor(secureRandom()*6)+1];
        setFinalDice(dice);
        setPhase('reveal');
        setTimeout(async () => {
          const rr = pendingRef.r;
          if (!rr) { setAnimating(false); onLockChange?.(false); return; }
          if (rr.goldDelta > 0) changeWealthCoin(rr.goldDelta + bet);
          setResult(rr); onResult(rr); setPhase('done');
          try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeWealthCoin(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}WC！`); } } catch { /**/ }
          setAnimating(false); onLockChange?.(false);
        }, 1000);
      }
    }, 70);
  };

  return (
    <div>
      <style>{`@keyframes dShk{0%,100%{transform:rotate(0deg) scale(1)}25%{transform:rotate(-15deg) scale(1.1)}75%{transform:rotate(15deg) scale(1.1)}}`}</style>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {(['cho','han'] as const).map(c => (
          <button key={c} onClick={() => !animating && setChoice(c)}
            style={{ flex: 1, padding: '10px', background: choice === c ? (c==='cho' ? '#5b8dee' : '#e05555') : '#1c2235', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
            {c==='cho' ? '丁（偶数）' : '半（奇数）'}
          </button>
        ))}
      </div>
      {(phase === 'rolling' || phase === 'reveal') && (
        <div style={{ textAlign:'center', padding:'16px 0', background:'rgba(255,255,255,0.03)', border:'1px solid #2d3752', borderRadius:12, marginBottom:10 }}>
          <div style={{ fontSize:'0.8rem', color:'#8a92b2', marginBottom:10 }}>🎲 どんぶりへ投擲！</div>
          <div style={{ display:'flex', gap:24, justifyContent:'center' }}>
            {[0,1].map(i => (
              <div key={i} style={{ fontSize:'3.5rem', display:'inline-block', animation: phase==='rolling' ? `dShk 0.2s infinite ${i*0.07}s` : 'none', transition: finalDice ? 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none' }}>
                {finalDice ? DICE_EJ[finalDice[i]-1] : DICE_EJ[(rollingFrame+i*3)%6]}
              </div>
            ))}
          </div>
          {finalDice && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:'1.4rem', fontWeight:900, color:'#e8e6ff' }}>
                {finalDice[0]} ＋ {finalDice[1]} ＝ <span style={{ color:'#f0c060', fontSize:'1.8rem' }}>{finalDice[0]+finalDice[1]}</span>
              </div>
              <div style={{ fontSize:'1.1rem', fontWeight:700, marginTop:6, color:(finalDice[0]+finalDice[1])%2===0?'#5b8dee':'#e05555' }}>
                {(finalDice[0]+finalDice[1])%2===0 ? '⬅ 偶数 ＝ 丁！' : '⬅ 奇数 ＝ 半！'}
              </div>
              <div style={{ fontSize:'0.78rem', color:'#8a92b2', marginTop:4 }}>あなたの選択: {choice==='cho'?'丁（偶数）':'半（奇数）'}</div>
            </div>
          )}
        </div>
      )}
      {phase === 'done' && result && <ResultDisplay result={result} bet={bet} />}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 12, background: animating ? '#2d3752' : 'linear-gradient(135deg,#e05555,#c03030)', color: '#fff', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        🎲 {bet.toLocaleString()}WC で投じる
      </button>
    </div>
  );
}

function ChinchiroPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void }) {
  const { player, changeWealthCoin, addNotification } = useGameStore(s => ({ player: s.player, changeWealthCoin: s.changeWealthCoin, addNotification: s.addNotification }));
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [rollLogs, setRollLogs] = useState<{dice:number[];label:string;isRole:boolean}[]>([]);
  const [currentDice, setCurrentDice] = useState<number[]|null>(null);
  const [rolling, setRolling] = useState(false);
  const [rollingFrame, setRollingFrame] = useState(0);
  const pendingRef = useState<{ r: GambleResult | null }>({ r: null })[0];
  const DICE_EJ = ['⚀','⚁','⚂','⚃','⚄','⚅'];

  useEffect(() => {
    if (!rolling) return;
    const t = setInterval(() => setRollingFrame(f => (f+1)%6), 80);
    return () => clearInterval(t);
  }, [rolling]);

  const play = async () => {
    if (animating || !player || (player.wealthCoin ?? 0) < bet) { addNotification('error', 'WCが足りません！'); return; }
    setAnimating(true); setResult(null); setRollLogs([]); setCurrentDice(null);
    onLockChange?.(true);
    changeWealthCoin(-bet); onJackpotContrib(bet);
    const r = playChinchiro(bet);
    const effectiveMult = r.multiplier > 0 ? r.multiplier * multiplierBonus : 0;
    pendingRef.r = { ...r, multiplier: effectiveMult, goldDelta: r.goldDelta > 0 ? Math.floor(bet * effectiveMult) - bet : r.goldDelta };

    // rollHistoryを使ってサイコロ演出を完全同期
    const history: number[][] = Array.isArray((r as any).rollHistory) ? (r as any).rollHistory : [r.dice];
    const runRoll = (attempt: number, logs: typeof rollLogs) => {
      setRolling(true); setCurrentDice(null);
      setTimeout(() => {
        const dice = history[attempt] ?? r.dice;
        const ev = evalChinchiro(dice);
        setCurrentDice(dice);
        setRolling(false);
        const newLogs = [...logs, { dice, label: ev.label, isRole: ev.type !== 'nashi' }];
        setRollLogs(newLogs);
        const isLast = attempt >= history.length - 1;
        if (!isLast) {
          setTimeout(() => runRoll(attempt + 1, newLogs), 1200);
        } else {
          setTimeout(async () => {
            const rr = pendingRef.r;
            if (!rr) { setAnimating(false); onLockChange?.(false); return; }
            if (rr.multiplier > 0) changeWealthCoin(rr.goldDelta + bet);
            setResult(rr); onResult(rr);
            try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeWealthCoin(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}WC！`); } } catch { /**/ }
            setAnimating(false); onLockChange?.(false);
          }, 1200);
        }
      }, 1000);
    };
    runRoll(0, []);
  };

  return (
    <div>
      <style>{`@keyframes dShk3{0%,100%{transform:rotate(0deg) translateY(0)}33%{transform:rotate(-10deg) translateY(-4px)}66%{transform:rotate(10deg) translateY(-4px)}}`}</style>
      {/* 投擲表示 */}
      {animating && (
        <div style={{ textAlign:'center', padding:'14px 0', background:'rgba(255,255,255,0.03)', border:'1px solid #2d3752', borderRadius:12, marginBottom:10 }}>
          <div style={{ fontSize:'0.78rem', color:'#8a92b2', marginBottom:8 }}>🎲 チンチロリン！</div>
          <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ fontSize:'2.8rem', display:'inline-block', animation: rolling ? `dShk3 0.2s infinite ${i*0.07}s` : 'none', transition: currentDice ? 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none' }}>
                {currentDice ? DICE_EJ[currentDice[i]-1] : DICE_EJ[(rollingFrame+i*2)%6]}
              </div>
            ))}
          </div>
          {/* 履歴 */}
          <div style={{ marginTop:10, maxHeight:80, overflowY:'auto' }}>
            {rollLogs.map((l,i) => (
              <div key={i} style={{ fontSize:'0.75rem', color: l.isRole ? '#f0c060' : '#4a5070', margin:'2px 0' }}>
                {l.dice.map(d=>DICE_EJ[d-1]).join(' ')} → {l.label}
              </div>
            ))}
          </div>
        </div>
      )}
      {result && !animating && (
        <div>
          <div style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: 6 }}>{result.dice?.join(' ') ?? ''}</div>
          <ResultDisplay result={result} bet={bet} />
        </div>
      )}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 12, background: animating ? '#2d3752' : 'linear-gradient(135deg,#f0a830,#c08020)', color: '#000', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        🎯 {bet.toLocaleString()}WC でサイコロを振る
      </button>
    </div>
  );
}

// 倍々チキンレース コインフリップ
function CoinFlipPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void }) {
  const { player, changeWealthCoin, addNotification } = useGameStore(s => ({ player: s.player, changeWealthCoin: s.changeWealthCoin, addNotification: s.addNotification }));
  // phase: idle=未開始, choosing=表裏選択中, playing=進行中, busted=負け, cashed=利確
  const [phase, setPhase] = useState<'idle'|'choosing'|'playing'|'busted'|'cashed'>('idle');
  const [pick, setPick] = useState<'omote'|'ura'>('omote');  // 毎回選んだ面
  const [score, setScore] = useState(0);
  const [flips, setFlips] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [lastFlip, setLastFlip] = useState<'heads'|'tails'|null>(null);
  const pendingRef = useState<{ isHeads: boolean }>({ isHeads: false })[0];

  // ゲーム開始ボタン押下 → 表裏選択フェーズへ
  const handleStart = () => {
    if (!player || (player.wealthCoin ?? 0) < bet) { addNotification('error', 'WCが足りません！'); return; }
    setPhase('choosing');
    setScore(0);
    setFlips(0);
    setLastFlip(null);
    onLockChange?.(true);
  };

  // 表/裏を選んで投げる（初回 or 継続）
  const throwCoin = (choice: 'omote' | 'ura') => {
    if (animating) return;
    if (phase === 'choosing') {
      // 初回：ここで掛け金を払う
      changeWealthCoin(-bet);
      onJackpotContrib(bet);
      setScore(1);
      setPhase('playing');
    }
    setPick(choice);
    setAnimating(true);
    // 選んだ面が出る確率40%、出ない確率60%
    const pickedOmoteNow = choice === 'omote';
    const hitNow = secureRandom() < 0.4;
    pendingRef.isHeads = hitNow ? pickedOmoteNow : !pickedOmoteNow;
    setShowAnim(true);
  };

  const handleAnimDone = () => {
    setShowAnim(false);
    const isHeads = pendingRef.isHeads;
    setLastFlip(isHeads ? 'heads' : 'tails');
    const pickedOmote = pick === 'omote';
    const hit = isHeads === pickedOmote; // 選んだ面が出たか
    if (hit) {
      setScore(prev => prev * 2);
      setFlips(prev => prev + 1);
      setAnimating(false);
    } else {
      setFlips(prev => prev + 1);
      setPhase('busted');
      onLockChange?.(false);
      const r: GambleResult = { rewardLabel: `${pick === 'omote' ? '裏' : '表'}が出た！全没収！`, multiplier: 0, goldDelta: -bet, itemRewards: [], symbols: ['🌑','💥'] };
      onResult(r);
      setAnimating(false);
    }
  };

  // 利確
  const cashOut = async () => {
    if (phase !== 'playing' || animating) return;
    const multiplier = score * multiplierBonus;
    const winGold = Math.floor(bet * multiplier);
    changeWealthCoin(winGold);
    setPhase('cashed');
    onLockChange?.(false);
    const r: GambleResult = { rewardLabel: `利確！×${score}倍！`, multiplier, goldDelta: winGold - bet, itemRewards: [], symbols: ['🌕','✨'] };
    onResult(r);
    try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeWealthCoin(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}WC！`); } } catch { /* ignore */ }
  };

  const reset = () => { setPhase('idle'); setScore(0); setFlips(0); setLastFlip(null); onLockChange?.(false); };

  const scoreGold = Math.floor(bet * score * multiplierBonus);

  // 表裏選択ボタン（初回 or 継続投げ用）
  const ChoiceButtons = ({ isFirst }: { isFirst: boolean }) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => throwCoin('omote')} disabled={animating}
        style={{ flex: 1, padding: '14px 0', background: 'rgba(240,192,96,0.18)', border: '2px solid #f0c060', color: '#f0c060', borderRadius: 10, cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem' }}>
        🌕 表{isFirst ? '' : `（×${score * 2}倍狙い）`}
      </button>
      <button onClick={() => throwCoin('ura')} disabled={animating}
        style={{ flex: 1, padding: '14px 0', background: 'rgba(138,146,178,0.18)', border: '2px solid #8a92b2', color: '#c0c8e0', borderRadius: 10, cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem' }}>
        🌑 裏{isFirst ? '' : `（×${score * 2}倍狙い）`}
      </button>
    </div>
  );

  return (
    <div>
      {/* タイトルと説明 */}
      <div style={{ background: 'rgba(240,192,96,0.08)', border: '1px solid rgba(240,192,96,0.3)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: '0.78rem', color: '#8a92b2', lineHeight: 1.6 }}>
        <div style={{ color: '#f0c060', fontWeight: 700, marginBottom: 4 }}>🪙 倍々チキンレース</div>
        表か裏かを選んで投げ、当たるたびにスコアが<span style={{ color: '#4caf87', fontWeight: 700 }}>2倍</span>に！
        外れたら<span style={{ color: '#e05555', fontWeight: 700 }}>全没収</span>。好きなタイミングで利確しよう。
      </div>

      {/* スコア表示 */}
      {phase !== 'idle' && phase !== 'choosing' && (
        <div style={{ textAlign: 'center', padding: '10px 0', marginBottom: 10 }}>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 2 }}>現在のスコア</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f0c060' }}>×{score}倍</div>
          <div style={{ fontSize: '0.85rem', color: '#4caf87' }}>≈ {scoreGold.toLocaleString()}WC</div>
          <div style={{ fontSize: '0.7rem', color: '#4a5070', marginTop: 2 }}>{flips}回当てた</div>
          {lastFlip && (
            <div style={{ fontSize: '1.2rem', marginTop: 4 }}>
              {lastFlip === 'heads' ? '🌕 表！' : '🌑 裏！'}
              {' '}
              <span style={{ fontSize: '0.8rem', color: lastFlip === (pick === 'omote' ? 'heads' : 'tails') ? '#4caf87' : '#e05555' }}>
                {lastFlip === (pick === 'omote' ? 'heads' : 'tails') ? '当たり！' : 'はずれ…'}
              </span>
            </div>
          )}
        </div>
      )}

      {showAnim && <GameAnimation type="coin_flip" onDone={handleAnimDone} />}

      {/* バスト表示 */}
      {phase === 'busted' && !showAnim && (
        <div style={{ textAlign: 'center', background: 'rgba(224,85,85,0.1)', border: '1px solid #e05555', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: '1.2rem', color: '#e05555', fontWeight: 700 }}>💥 外れ！全没収！</div>
          <div style={{ color: '#8a92b2', fontSize: '0.78rem', marginTop: 4 }}>{flips}回連続で当てたが…</div>
        </div>
      )}

      {/* 利確成功表示 */}
      {phase === 'cashed' && !showAnim && (
        <div style={{ textAlign: 'center', background: 'rgba(76,175,135,0.1)', border: '1px solid #4caf87', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: '1.1rem', color: '#4caf87', fontWeight: 700 }}>✅ 利確！×{score}倍 = {scoreGold.toLocaleString()}WC 獲得！</div>
          <div style={{ color: '#8a92b2', fontSize: '0.78rem', marginTop: 4 }}>賢い判断だった！</div>
        </div>
      )}

      {/* ボタン群 */}
      {phase === 'idle' && (
        <button onClick={handleStart} disabled={(player?.wealthCoin ?? 0) < bet}
          style={{ width: '100%', padding: 12, background: (player?.wealthCoin ?? 0) >= bet ? 'linear-gradient(135deg,#f0c060,#c08020)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
          🪙 {bet.toLocaleString()}WC でゲーム開始
        </button>
      )}

      {phase === 'choosing' && (
        <div>
          <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#8a92b2', marginBottom: 8 }}>どちらを選ぶ？</div>
          <ChoiceButtons isFirst={true} />
        </div>
      )}

      {phase === 'playing' && !showAnim && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.78rem', color: '#8a92b2', textAlign: 'center' }}>次はどちら？</div>
          <ChoiceButtons isFirst={false} />
          <button onClick={cashOut} disabled={animating}
            style={{ width: '100%', padding: 11, background: 'linear-gradient(135deg,#4caf87,#2d8060)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
            💰 利確（{scoreGold.toLocaleString()}WC）
          </button>
        </div>
      )}

      {(phase === 'busted' || phase === 'cashed') && !showAnim && (
        <button onClick={reset}
          style={{ width: '100%', padding: 10, background: '#2d3752', color: '#8a92b2', border: '1px solid #4a5070', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
          🔄 もう一度プレイ
        </button>
      )}
    </div>
  );
}

function PokerPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onBetLock }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onBetLock?: (locked: boolean) => void }) {
  const { player, changeWealthCoin, addItems, addNotification } = useGameStore(s => ({ player: s.player, changeWealthCoin: s.changeWealthCoin, addItems: s.addItems, addNotification: s.addNotification }));
  const [pokerState, setPokerState] = useState<PokerState | null>(null);
  const [hold, setHold] = useState<boolean[]>([false,false,false,false,false]);
  const [phase, setPhase] = useState<'idle'|'dealing'|'deal'|'drawing'|'result'>('idle');
  const [result, setResult] = useState<GambleResult | null>(null);
  const pendingRef = useState<{ state: PokerState | null }>({ state: null })[0];
  const pendingDrawRef = useState<{ r: GambleResult | null; state: PokerState | null }>({ r: null, state: null })[0];

  const suitIcon = (s: string) => ({ S:'♠️',H:'♥️',D:'♦️',C:'♣️' }[s]??s);
  const cardStyle = (selected: boolean) => ({
    width:44, height:64, background: selected ? 'rgba(91,141,238,0.3)' : '#1c2235', border:`2px solid ${selected ? '#5b8dee' : '#2d3752'}`,
    borderRadius:6, display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center',
    cursor:'pointer', fontSize:'0.9rem', fontWeight:700, transition:'all 0.15s',
  });

  const handleDeal = () => {
    if (!player || (player.wealthCoin ?? 0) < bet) { addNotification('error', 'WCが足りません！'); return; }
    changeWealthCoin(-bet); onJackpotContrib(bet);
    const state = dealPoker();
    pendingRef.state = state;
    setHold([false,false,false,false,false]);
    onBetLock?.(true); // ゲーム開始でbetをロック
    setPhase('dealing');
  };

  const handleDealAnimDone = () => {
    setPokerState(pendingRef.state);
    setPhase('deal');
  };

  const handleDraw = async () => {
    if (!pokerState) return;
    const { result: r, newState } = drawPoker(pokerState, hold);
    pendingDrawRef.r = r;
    pendingDrawRef.state = newState;
    setPhase('drawing');
  };

  const handleDrawAnimDone = async () => {
    const r = pendingDrawRef.r;
    const newState = pendingDrawRef.state;
    if (!r || !newState) { setPhase('result'); return; }
    setPokerState(newState);
    setPhase('result');
    const effectiveMult = r.multiplier > 0 ? r.multiplier * multiplierBonus : 0;
    const adjustedResult = { ...r, multiplier: effectiveMult, goldDelta: r.multiplier > 0 ? Math.floor(bet * effectiveMult) - bet : r.goldDelta };
    if (effectiveMult > 0) changeWealthCoin(adjustedResult.goldDelta + bet);
    if (r.itemRewards.length > 0) addItems(r.itemRewards);
    setResult(adjustedResult); onResult(adjustedResult);
    try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeWealthCoin(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}WC！`); } } catch { /* ignore */ }
  };

  return (
    <div>
      {phase === 'dealing' && <GameAnimation type="poker" onDone={handleDealAnimDone} />}
      {phase === 'drawing' && <GameAnimation type="poker" onDone={handleDrawAnimDone} />}
      {(phase === 'deal' || phase === 'result') && pokerState && (
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
          {phase==='result' && result && <ResultDisplay result={result} bet={bet} />}
        </div>
      )}
      {phase==='idle' && (
        <button onClick={handleDeal} style={{ width:'100%', padding:12, background:'linear-gradient(135deg,#9b6df0,#7040c0)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'1rem' }}>
          🃏 {bet.toLocaleString()}WC でカードを引く
        </button>
      )}
      {phase==='deal' && (
        <button onClick={handleDraw} style={{ width:'100%', padding:12, background:'linear-gradient(135deg,#e05555,#c03030)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'1rem' }}>
          🔄 チェンジ（HOLDしないカードを交換）
        </button>
      )}
      {phase==='result' && (
        <button onClick={() => { setPhase('idle'); setPokerState(null); setResult(null); onBetLock?.(false); }}
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
type GameTab = 'chohan'|'chinchiro'|'coin_flip'|'slot'|'poker'|'treasure_box'|'pvp'|'texas'|'highlow'|'mines'|'dice_race'|'roulette'|'blackjack'|'scratch'|'race';
const GAME_TABS: { id: GameTab; label: string; icon: string }[] = [
  { id:'chohan',       label:'丁半',     icon:'dice' },
  { id:'chinchiro',    label:'チンチロ', icon:'target' },
  { id:'coin_flip',    label:'コイン',   icon:'coin' },
  { id:'slot',         label:'スロット', icon:'slot_machine' },
  { id:'poker',        label:'ポーカー', icon:'joker_card' },
  { id:'treasure_box', label:'宝箱',     icon:'box' },
  { id:'highlow',      label:'ハイロー', icon:'joker_card' },
  { id:'mines',        label:'マイン',   icon:'target' },
  { id:'dice_race',    label:'ダイス',   icon:'dice' },
  { id:'roulette',     label:'ルーレット', icon:'target' },
  { id:'blackjack',    label:'BJ',       icon:'joker_card' },
  { id:'scratch',      label:'スクラッチ', icon:'coin' },
  { id:'race',         label:'レース',   icon:'swords' },
  { id:'pvp',          label:'対戦',     icon:'swords' },
  { id:'texas',        label:'TH対戦',   icon:'joker_card' },
];

// ============================================================
// 宝箱セレクターパネル
// ============================================================
const TREASURE_BOX_DEFS = [
  { id: 'treasure_box_wood',   label: '木箱',   emoji: '📦', color: '#8B4513', bet: 1000 },
  { id: 'treasure_box_iron',   label: '鉄箱',   emoji: '🔒', color: '#8a92b2', bet: 10000 },
  { id: 'treasure_box_silver', label: '銀箱',   emoji: '🪙', color: '#c0c0c0', bet: 41000 },
  { id: 'treasure_box_gold',   label: '金箱',   emoji: '💛', color: '#f0c060', bet: 400000 },
  { id: 'treasure_box_mystic', label: '神秘箱', emoji: '✨', color: '#e060e0', bet: 4000000 },
] as const;

function TreasureBoxPanel({ onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: {
  onResult: (r: GambleResult) => void;
  onJackpotContrib: (bet: number) => void;
  multiplierBonus?: number;
  onLockChange?: (locked: boolean) => void;
}) {
  const [selectedBox, setSelectedBox] = useState(0);
  const boxDef = TREASURE_BOX_DEFS[selectedBox];
  const game = GAMBLE_MASTER[boxDef.id] ?? GAMBLE_MASTER['treasure_box_silver'];
  const bet = boxDef.bet;

  return (
    <div>
      {/* 箱選択 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 6 }}>📦 宝箱を選択</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TREASURE_BOX_DEFS.map((b, i) => (
            <button key={i} onClick={() => setSelectedBox(i)}
              style={{ flex: 1, minWidth: 60, padding: '8px 4px', textAlign: 'center',
                background: selectedBox === i ? `rgba(${b.color === '#f0c060' ? '240,192,96' : b.color === '#e060e0' ? '224,96,224' : b.color === '#c0c0c0' ? '192,192,192' : b.color === '#8a92b2' ? '138,146,178' : '139,69,19'},0.2)` : '#161b26',
                border: `2px solid ${selectedBox === i ? b.color : '#2d3752'}`,
                borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ fontSize: '1.4rem' }}>{b.emoji}</div>
              <div style={{ fontSize: '0.65rem', color: selectedBox === i ? b.color : '#8a92b2', fontWeight: 700 }}>{b.label}</div>
              <div style={{ fontSize: '0.62rem', color: '#4a5070' }}>{b.bet.toLocaleString()}WC</div>
            </button>
          ))}
        </div>
      </div>
      {/* 選択した宝箱の中身一覧 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: boxDef.color, marginBottom: 6 }}>
          {boxDef.emoji} {boxDef.label}の中身一覧
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {game.rewardTable.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#161b26', border: '1px solid #2d3752', borderRadius: 6, padding: '6px 10px' }}>
              <span style={{ fontSize: '1rem', minWidth: 22, textAlign: 'center' }}>{r.symbols?.[0] ?? '?'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e8e6ff' }}>{r.label}</div>
                {r.multiplier > 0 && <div style={{ fontSize: '0.68rem', color: '#8a92b2' }}>→ {Math.floor(bet * r.multiplier).toLocaleString()}WC</div>}
                {r.itemRewards && r.itemRewards.map(ir => (
                  <span key={ir.itemId} style={{ fontSize: '0.68rem', color: '#8a92b2', marginRight: 4 }}>
                    {ITEM_MASTER[ir.itemId]?.name ?? ir.itemId} ×{ir.amount}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#4a5070' }}>{(r.probability * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <GenericPanel game={game} bet={bet} onResult={onResult} onJackpotContrib={onJackpotContrib} multiplierBonus={multiplierBonus} onLockChange={onLockChange} />
    </div>
  );
}

// ============================================================
// ギャンブルランク
// ============================================================
export type GambleRank = '見習い' | 'ギャンブラー' | '熟練ギャンブラー' | '賭博王' | 'レジェンド';
const GAMBLE_RANKS: { name: GambleRank; threshold: number; multiplier: number; color: string }[] = [
  { name: '見習い',           threshold: 0,                multiplier: 1.00, color: '#8a92b2' },
  { name: 'ギャンブラー',     threshold: 10_000_000,       multiplier: 1.00, color: '#4caf87' },
  { name: '熟練ギャンブラー', threshold: 100_000_000,      multiplier: 1.00, color: '#5b8dee' },
  { name: '賭博王',           threshold: 10_000_000_000,   multiplier: 1.00, color: '#f0a040' },
  { name: 'レジェンド',       threshold: 100_000_000_000,  multiplier: 1.00, color: '#e060e0' },
];
export function getGambleRank(totalWagered: number) {
  let rank = GAMBLE_RANKS[0];
  for (const r of GAMBLE_RANKS) { if (totalWagered >= r.threshold) rank = r; }
  return rank;
}


// ============================================================
// HighLow Panel
// ============================================================
const HIGHLOW_MULTIPLIERS = [1.3, 1.8, 2.5, 3.5, 5.0, 7.5, 11.0, 16.0, 24.0, 35.0];
function HighLowPanel({ bet, onResult, onMissionUpdate, onLockChange }: {
  bet: number;
  onResult: (r: GambleResult) => void;
  onMissionUpdate?: (won: boolean, streak: number) => void;
  onLockChange?: (locked: boolean) => void;
}) {
  const { player, changeWealthCoin, addNotification } = useGameStore(s => ({
    player: s.player, changeWealthCoin: s.changeWealthCoin, addNotification: s.addNotification,
  }));
  const setPlayer = useGameStore(s => s.setPlayer);
  const [currentCard, setCurrentCard] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [lastResult, setLastResult] = useState<'win' | 'lose' | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  if (!player) return null;
  const totalWagered = player.totalWagered ?? 0;
  const rankInfo = getGambleRank(totalWagered);

  const drawCard = () => Math.floor(Math.random() * 13) + 1;
  const cardLabel = (n: number) => {
    if (n === 1) return 'A';
    if (n === 11) return 'J';
    if (n === 12) return 'Q';
    if (n === 13) return 'K';
    return String(n);
  };

  const startGame = () => {
    if ((player.wealthCoin ?? 0) < bet) { addNotification('error', 'WCが足りません'); return; }
    changeWealthCoin(-bet);
    // update totalWagered using latest store state to preserve wealthCoin updated by changeWealthCoin
    const latest = useGameStore.getState().player ?? player;
    const newWagered = (latest.totalWagered ?? 0) + bet;
    setPlayer({ ...latest, totalWagered: newWagered });
    const card = drawCard();
    setCurrentCard(card);
    setStreak(0);
    setGameActive(true);
    setLastResult(null);
    setHistory([card]);
    onLockChange?.(true);
  };

  const guess = (choice: 'high' | 'low') => {
    if (!gameActive || currentCard === null || animating) return;
    setAnimating(true);
    setTimeout(() => {
      const newCard = drawCard();
      setHistory(prev => [...prev, newCard]);
      const won = (choice === 'high' && newCard > currentCard) || (choice === 'low' && newCard < currentCard);
      if (!won) {
        // lose
        setLastResult('lose');
        setCurrentCard(newCard);
        setStreak(0);
        setGameActive(false);
        setAnimating(false);
        onLockChange?.(false);
        const goldDelta = -bet;
        onResult({ rewardLabel: '敗北', multiplier: 0, goldDelta, itemRewards: [], symbols: ['💀'] });
        onMissionUpdate?.(false, 0);
      } else {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setCurrentCard(newCard);
        setLastResult('win');
        setAnimating(false);
        if (onMissionUpdate) onMissionUpdate(true, newStreak);
      }
    }, 400);
  };

  const cashOut = () => {
    if (!gameActive || streak === 0) return;
    const mult = (HIGHLOW_MULTIPLIERS[Math.min(streak, HIGHLOW_MULTIPLIERS.length) - 1] ?? HIGHLOW_MULTIPLIERS[HIGHLOW_MULTIPLIERS.length - 1]) * rankInfo.multiplier;
    const winAmount = Math.floor(bet * mult);
    changeWealthCoin(winAmount);
    const goldDelta = winAmount - bet;
    onResult({ rewardLabel: `${streak}連勝！`, multiplier: mult, goldDelta, itemRewards: [], symbols: ['🃏'] });
    setGameActive(false);
    setStreak(0);
    setCurrentCard(null);
    setHistory([]);
    onLockChange?.(false);
    addNotification('success', `+${winAmount.toLocaleString()}WC 獲得！（×${mult.toFixed(2)}）`);
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.8rem', color: '#8a92b2', marginBottom: 4 }}>倍率表</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {HIGHLOW_MULTIPLIERS.map((m, i) => (
            <span key={i} style={{ padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem',
              background: streak === i + 1 ? 'rgba(240,192,96,0.3)' : '#161b26',
              border: `1px solid ${streak === i + 1 ? '#f0c060' : '#2d3752'}`,
              color: streak === i + 1 ? '#f0c060' : '#8a92b2' }}>
              {i + 1}連勝: ×{m}
            </span>
          ))}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 4 }}>ランクボーナス: ×{rankInfo.multiplier.toFixed(2)}（{rankInfo.name}）</div>
      </div>

      {currentCard !== null && (
        <div style={{ textAlign: 'center', margin: '12px 0' }}>
          <div style={{ fontSize: '0.8rem', color: '#8a92b2', marginBottom: 4 }}>現在のカード</div>
          <div style={{ fontSize: '3.5rem', fontWeight: 700, color: '#f0c060', letterSpacing: 4 }}>
            {animating ? '🃏' : cardLabel(currentCard)}
          </div>
          {streak > 0 && <div style={{ fontSize: '0.85rem', color: '#4caf87', marginTop: 4 }}>{streak}連勝中！ 確定倍率: ×{((HIGHLOW_MULTIPLIERS[Math.min(streak, HIGHLOW_MULTIPLIERS.length) - 1] ?? HIGHLOW_MULTIPLIERS[HIGHLOW_MULTIPLIERS.length - 1]) * rankInfo.multiplier).toFixed(2)}</div>}
        </div>
      )}

      {history.length > 1 && (
        <div style={{ display: 'flex', gap: 3, marginBottom: 8, flexWrap: 'wrap' }}>
          {history.map((c, i) => <span key={i} style={{ padding: '2px 5px', background: '#161b26', border: '1px solid #2d3752', borderRadius: 4, fontSize: '0.72rem', color: '#8a92b2' }}>{cardLabel(c)}</span>)}
        </div>
      )}

      {lastResult && (
        <div style={{ textAlign: 'center', marginBottom: 8, fontWeight: 700, fontSize: '0.9rem',
          color: lastResult === 'win' ? '#4caf87' : '#e05555' }}>
          {lastResult === 'win' ? '✅ 正解！' : '❌ ハズレ…'}
        </div>
      )}

      {!gameActive ? (
        <button onClick={startGame} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#5b8dee,#3a5bb0)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
          🃏 ゲーム開始（{bet.toLocaleString()}WC）
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => guess('high')} disabled={animating}
            style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#4caf87,#2d8060)', color: '#fff', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', opacity: animating ? 0.5 : 1 }}>
            ▲ HIGH
          </button>
          <button onClick={() => guess('low')} disabled={animating}
            style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#e05555,#a02020)', color: '#fff', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', opacity: animating ? 0.5 : 1 }}>
            ▼ LOW
          </button>
          {streak > 0 && (
            <button onClick={cashOut} disabled={animating}
              style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#f0c060,#c08020)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
              💰 確定
            </button>
          )}
        </div>
      )}
      <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 8, textAlign: 'center' }}>同値は敗北。任意タイミングで確定可能。</div>
    </div>
  );
}

// ============================================================
// 観戦パネル
// ============================================================
const GAME_NAMES_JP: Record<string, string> = {
  chohan: '丁半', chinchiro: 'チンチロリン', coin_flip: 'コイントス', slot_machine: 'スロット',
};

// ============================================================
// ミニマインパネル
// ============================================================
function MinesPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: {
  bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void;
}) {
  const player = useGameStore(s => s.player);
  const setPlayer = useGameStore(s => s.setPlayer);
  // 5マス: null=未選択, false=安全, true=爆弾
  const [board, setBoard] = useState<(boolean | null)[]>(Array(5).fill(null));
  const [safeCount, setSafeCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [bombPos, setBombPos] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const [msg, setMsg] = useState('');

  const MULTIPLIERS = [0, 1.2, 1.5, 2.2, 3.5];

  const startGame = () => {
    if (!player || (player.wealthCoin ?? 0) < bet) { setMsg('WCが不足しています'); return; }
    const bomb = Math.floor(secureRandom() * 5);
    const newBoard = Array(5).fill(null);
    setBombPos(bomb);
    setBoard(newBoard);
    setSafeCount(0);
    setGameOver(false);
    setWon(false);
    setPlaying(true);
    setMsg('マスを選択してください');
    onLockChange?.(true);
    const latest = useGameStore.getState().player ?? player;
    setPlayer({ ...latest, wealthCoin: (latest.wealthCoin ?? 0) - bet });
    onJackpotContrib(bet);
  };

  const selectCell = (i: number) => {
    if (!playing || gameOver || board[i] !== null) return;
    const newBoard = [...board];
    if (i === bombPos) {
      newBoard[i] = true;
      setBoard(newBoard);
      setGameOver(true);
      setPlaying(false);
      setMsg('💣 爆弾！ゲームオーバー');
      onLockChange?.(false);
      onResult({ rewardLabel: '爆弾！ハズレ', multiplier: 0, goldDelta: -bet, itemRewards: [], symbols: ['💣'] });
    } else {
      newBoard[i] = false;
      const newSafe = safeCount + 1;
      setBoard(newBoard);
      setSafeCount(newSafe);
      setMsg(`✅ ${newSafe}マス成功！ 止める or 続ける`);
      if (newSafe === 4) {
        // 全部安全マス選んだ
        cashOut(newSafe);
      }
    }
  };

  const cashOut = (count?: number) => {
    const sc = count ?? safeCount;
    if (sc === 0) { setMsg('まずマスを選んでください'); return; }
    const mult = MULTIPLIERS[sc] * multiplierBonus;
    const goldDelta = Math.floor(bet * mult) - bet;
    const latest = useGameStore.getState().player ?? player!;
    setPlayer({ ...latest, wealthCoin: (latest.wealthCoin ?? 0) + Math.floor(bet * mult) });
    setGameOver(true);
    setWon(true);
    setPlaying(false);
    setMsg(`🎉 ${sc}マス成功で ${mult.toFixed(2)}x！`);
    onLockChange?.(false);
    onResult({ rewardLabel: `${sc}マス成功`, multiplier: mult, goldDelta, itemRewards: [], symbols: ['⛏️'] });
  };

  return (
    <div>
      {!playing && !gameOver && (
        <button onClick={startGame} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#4caf87,#2d8060)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>
          ▶ ゲーム開始 ({bet.toLocaleString()}WC)
        </button>
      )}
      {msg && <div style={{ textAlign: 'center', marginBottom: 8, fontSize: '0.85rem', color: won ? '#4caf87' : gameOver ? '#e05555' : '#8a92b2' }}>{msg}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
        {board.map((cell, i) => (
          <button key={i} onClick={() => selectCell(i)} disabled={!playing || cell !== null}
            style={{ width: 52, height: 52, fontSize: '1.4rem', border: `2px solid ${cell === true ? '#e05555' : cell === false ? '#4caf87' : '#2d3752'}`, background: cell === true ? 'rgba(224,85,85,0.2)' : cell === false ? 'rgba(76,175,135,0.2)' : '#1c2235', borderRadius: 8, cursor: playing && cell === null ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cell === true ? '💣' : cell === false ? '✅' : playing ? '❓' : '⬜'}
          </button>
        ))}
      </div>
      {playing && safeCount > 0 && (
        <button onClick={() => cashOut()} style={{ width: '100%', padding: '9px', background: 'linear-gradient(135deg,#f0c060,#c08020)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>
          💰 止める ({(MULTIPLIERS[safeCount] * multiplierBonus).toFixed(2)}x = {Math.floor(bet * MULTIPLIERS[safeCount] * multiplierBonus).toLocaleString()}WC)
        </button>
      )}
      {gameOver && (
        <button onClick={startGame} style={{ width: '100%', padding: '9px', background: '#1c2235', color: '#8a92b2', border: '1px solid #2d3752', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
          🔄 もう一度
        </button>
      )}
      <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 6 }}>
        倍率: 1マス×1.2 / 2マス×1.5 / 3マス×2.2 / 4マス×3.5
      </div>
    </div>
  );
}

// ============================================================
// ダイスレースパネル
// ============================================================
function DiceRacePanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: {
  bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void;
}) {
  const player = useGameStore(s => s.player);
  const setPlayer = useGameStore(s => s.setPlayer);
  const [diceValues, setDiceValues] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const roll = () => {
    if (!player || (player.wealthCoin ?? 0) < bet || chosen === null) return;
    setLoading(true);
    onLockChange?.(true);
    const latest = useGameStore.getState().player ?? player;
    setPlayer({ ...latest, wealthCoin: (latest.wealthCoin ?? 0) - bet });
    onJackpotContrib(bet);
    setTimeout(() => {
      const dice = [
        Math.floor(secureRandom() * 6) + 1,
        Math.floor(secureRandom() * 6) + 1,
        Math.floor(secureRandom() * 6) + 1,
      ];
      setDiceValues(dice);
      const myVal = dice[chosen];
      const maxVal = Math.max(...dice);
      const winners = dice.filter(d => d === maxVal).length;
      let mult = 0, label = '負け';
      if (myVal === maxVal && winners === 1) { mult = 2.7 * multiplierBonus; label = '勝ち！'; }
      else if (myVal === maxVal && winners > 1) { mult = 1.3 * multiplierBonus; label = '同点'; }
      const goldDelta = Math.floor(bet * mult) - bet;
      const latestP = useGameStore.getState().player ?? player;
      if (mult > 0) setPlayer({ ...latestP, wealthCoin: (latestP.wealthCoin ?? 0) + Math.floor(bet * mult) });
      setResult(label);
      onResult({ rewardLabel: label, multiplier: mult, goldDelta, itemRewards: [], symbols: ['🎲'] });
      setLoading(false);
      onLockChange?.(false);
      setChosen(null);
    }, 600);
  };

  return (
    <div>
      <div style={{ fontSize: '0.82rem', color: '#8a92b2', marginBottom: 8 }}>どのダイスが最大値になるか選んでください</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
        {['🎲 A', '🎲 B', '🎲 C'].map((label, i) => (
          <button key={i} onClick={() => setChosen(i)} disabled={loading}
            style={{ flex: 1, padding: '14px 8px', fontSize: '1rem', fontWeight: 700, background: chosen === i ? 'rgba(91,141,238,0.3)' : '#1c2235', border: `2px solid ${chosen === i ? '#5b8dee' : '#2d3752'}`, color: chosen === i ? '#e8e6ff' : '#8a92b2', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {label}
            {diceValues[i] !== undefined && <div style={{ fontSize: '1.4rem' }}>{['⚀','⚁','⚂','⚃','⚄','⚅'][diceValues[i]-1]}</div>}
          </button>
        ))}
      </div>
      <button onClick={roll} disabled={loading || chosen === null || !player || (player.wealthCoin ?? 0) < bet}
        style={{ width: '100%', padding: '10px', background: chosen !== null ? 'linear-gradient(135deg,#5b8dee,#3a6fd0)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: chosen !== null ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.9rem', marginBottom: 8 }}>
        {loading ? '🎲 転がし中...' : `▶ ダイスを転がす (${bet.toLocaleString()}WC)`}
      </button>
      {result && <div style={{ textAlign: 'center', fontSize: '0.9rem', color: result === '勝ち！' ? '#4caf87' : result === '同点' ? '#5b8dee' : '#e05555', fontWeight: 700 }}>{result}</div>}
      <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 6 }}>
        勝ち×2.7 / 同点×1.3 / 負け×0
      </div>
    </div>
  );
}

// ============================================================
// ルーレットパネル
// ============================================================
function RoulettePanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: {
  bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void;
}) {
  const player = useGameStore(s => s.player);
  const setPlayer = useGameStore(s => s.setPlayer);
  const [choice, setChoice] = useState<'red' | 'black' | 'green' | null>(null);
  const [landed, setLanded] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const spin = () => {
    if (!player || (player.wealthCoin ?? 0) < bet || !choice) return;
    setLoading(true);
    onLockChange?.(true);
    const latest = useGameStore.getState().player ?? player;
    setPlayer({ ...latest, wealthCoin: (latest.wealthCoin ?? 0) - bet });
    onJackpotContrib(bet);
    setTimeout(() => {
      const r = secureRandom();
      let landColor: 'red' | 'black' | 'green';
      if (r < 0.45) landColor = 'red';
      else if (r < 0.90) landColor = 'black';
      else if (r < 0.93) landColor = 'green';
      else landColor = Math.random() < 0.5 ? 'red' : 'black'; // 7% fallthrough to red/black
      const colorEmoji = landColor === 'red' ? '🔴' : landColor === 'black' ? '⚫' : '🟢';
      setLanded(colorEmoji);
      const win = choice === landColor;
      let mult = 0;
      if (win) mult = (landColor === 'green' ? 9.3 : 2.0) * multiplierBonus;
      const goldDelta = Math.floor(bet * mult) - bet;
      const latestP = useGameStore.getState().player ?? player;
      if (mult > 0) setPlayer({ ...latestP, wealthCoin: (latestP.wealthCoin ?? 0) + Math.floor(bet * mult) });
      const label = win ? `${colorEmoji} 当たり！` : `外れ（${colorEmoji}）`;
      onResult({ rewardLabel: label, multiplier: mult, goldDelta, itemRewards: [], symbols: [colorEmoji] });
      setLoading(false);
      onLockChange?.(false);
      setChoice(null);
    }, 700);
  };

  return (
    <div>
      <div style={{ fontSize: '0.82rem', color: '#8a92b2', marginBottom: 8 }}>色を選んでください</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
        {([['red','🔴 赤','×2.0 (45%)'], ['black','⚫ 黒','×2.0 (45%)'], ['green','🟢 緑','×9.3 (3%)']] as const).map(([id, label, sub]) => (
          <button key={id} onClick={() => setChoice(id)} disabled={loading}
            style={{ flex: 1, padding: '10px 4px', fontSize: '0.82rem', fontWeight: 700, background: choice === id ? `rgba(${id==='red'?'224,85,85':id==='black'?'100,100,100':'76,175,135'},0.3)` : '#1c2235', border: `2px solid ${choice === id ? (id==='red'?'#e05555':id==='black'?'#8a92b2':'#4caf87') : '#2d3752'}`, color: choice === id ? '#e8e6ff' : '#8a92b2', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {label}<br /><span style={{ fontSize: '0.68rem' }}>{sub}</span>
          </button>
        ))}
      </div>
      {landed && <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}>{landed}</div>}
      <button onClick={spin} disabled={loading || !choice || !player || (player.wealthCoin ?? 0) < bet}
        style={{ width: '100%', padding: '10px', background: choice ? 'linear-gradient(135deg,#e060e0,#903090)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: choice ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.9rem' }}>
        {loading ? '🎡 回転中...' : `▶ 回す (${bet.toLocaleString()}WC)`}
      </button>
    </div>
  );
}

// ============================================================
// ブラックジャックパネル
// ============================================================
function BlackjackPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: {
  bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void;
}) {
  const player = useGameStore(s => s.player);
  const setPlayer = useGameStore(s => s.setPlayer);
  const [playerHand, setPlayerHand] = useState<number[]>([]);
  const [dealerHand, setDealerHand] = useState<number[]>([]);
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [msg, setMsg] = useState('');

  const drawCard = () => Math.floor(secureRandom() * 10) + 1;
  const sum = (h: number[]) => h.reduce((a, b) => a + b, 0);

  const startGame = () => {
    if (!player || (player.wealthCoin ?? 0) < bet) { setMsg('WCが不足しています'); return; }
    const ph = [drawCard(), drawCard()];
    const dh = [drawCard(), drawCard()];
    const latest = useGameStore.getState().player ?? player;
    setPlayer({ ...latest, wealthCoin: (latest.wealthCoin ?? 0) - bet });
    onJackpotContrib(bet);
    setPlayerHand(ph);
    setDealerHand(dh);
    setPhase('playing');
    setMsg('ヒット or スタンド？');
    onLockChange?.(true);
    if (sum(ph) === 21) stand(ph, dh);
  };

  const hit = () => {
    const newHand = [...playerHand, drawCard()];
    setPlayerHand(newHand);
    if (sum(newHand) > 21) {
      setPhase('done');
      setMsg('💥 バースト！負け');
      onLockChange?.(false);
      onResult({ rewardLabel: '負け（バースト）', multiplier: 0, goldDelta: -bet, itemRewards: [], symbols: ['🃏💨'] });
    } else if (sum(newHand) === 21) {
      stand(newHand, dealerHand);
    }
  };

  const stand = (ph?: number[], dh?: number[]) => {
    const pHand = ph ?? playerHand;
    let dHand = [...(dh ?? dealerHand)];
    while (sum(dHand) < 17) dHand.push(drawCard());
    setDealerHand(dHand);
    setPhase('done');
    const ps = sum(pHand), ds = sum(dHand);
    let mult = 0, label = '負け';
    if (ds > 21 || ps > ds) { mult = 1.9 * multiplierBonus; label = '勝ち！'; }
    else if (ps === ds) { mult = 1.0; label = '引き分け'; }
    const goldDelta = Math.floor(bet * mult) - bet;
    const latest = useGameStore.getState().player ?? player!;
    if (mult > 0) setPlayer({ ...latest, wealthCoin: (latest.wealthCoin ?? 0) + Math.floor(bet * mult) });
    setMsg(label === '勝ち！' ? `🎉 ${label} (Player:${ps} vs Dealer:${ds})` : label === '引き分け' ? `🤝 ${label} (${ps}点)` : `💀 ${label} (Player:${ps} vs Dealer:${ds})`);
    onLockChange?.(false);
    onResult({ rewardLabel: label, multiplier: mult, goldDelta, itemRewards: [], symbols: ['🃏'] });
  };

  const cardLabel = (v: number) => v === 1 ? 'A' : v === 10 ? '10' : String(v);

  return (
    <div>
      {phase === 'idle' && (
        <button onClick={startGame} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#4caf87,#2d8060)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>
          ▶ ゲーム開始 ({bet.toLocaleString()}WC)
        </button>
      )}
      {phase !== 'idle' && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.8rem', color: '#8a92b2', marginBottom: 4 }}>ディーラー: {sum(dealerHand)}点 {phase === 'playing' ? '(2枚目伏せ)' : ''}</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {dealerHand.map((v, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 48, background: '#1c2235', border: '1px solid #2d3752', borderRadius: 6, fontSize: '0.9rem', color: '#e8e6ff', fontWeight: 700 }}>
                {phase === 'playing' && i === 1 ? '🂠' : cardLabel(v)}
              </span>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#8a92b2', marginBottom: 4 }}>あなた: {sum(playerHand)}点</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {playerHand.map((v, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 48, background: 'rgba(91,141,238,0.15)', border: '1px solid #5b8dee', borderRadius: 6, fontSize: '0.9rem', color: '#e8e6ff', fontWeight: 700 }}>
                {cardLabel(v)}
              </span>
            ))}
          </div>
        </div>
      )}
      {msg && <div style={{ textAlign: 'center', fontSize: '0.85rem', color: msg.includes('勝ち') ? '#4caf87' : msg.includes('引き分け') ? '#5b8dee' : '#e05555', fontWeight: 700, marginBottom: 8 }}>{msg}</div>}
      {phase === 'playing' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={hit} style={{ flex: 1, padding: '9px', background: 'linear-gradient(135deg,#5b8dee,#3a6fd0)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>🃏 ヒット</button>
          <button onClick={() => stand()} style={{ flex: 1, padding: '9px', background: 'linear-gradient(135deg,#f0a040,#c07020)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>🛑 スタンド</button>
        </div>
      )}
      {phase === 'done' && (
        <button onClick={startGame} style={{ width: '100%', padding: '9px', background: '#1c2235', color: '#8a92b2', border: '1px solid #2d3752', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', marginTop: 8 }}>
          🔄 もう一度
        </button>
      )}
      <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 6 }}>
        勝ち×1.9 / 引き分け×1.0（返却）/ 負け×0
      </div>
    </div>
  );
}

// ============================================================
// スクラッチパネル
// ============================================================
function ScratchPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: {
  bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void;
}) {
  const player = useGameStore(s => s.player);
  const setPlayer = useGameStore(s => s.setPlayer);
  const SYMBOLS = ['🌟','💎','🍀','🎲','🍒','🔔'];
  const [grid, setGrid] = useState<string[]>(Array(9).fill(''));
  const [revealed, setRevealed] = useState<boolean[]>(Array(9).fill(false));
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [phase, setPhase] = useState<'idle' | 'selecting' | 'done'>('idle');
  const [msg, setMsg] = useState('');

  const startGame = () => {
    if (!player || (player.wealthCoin ?? 0) < bet) { setMsg('WCが不足しています'); return; }
    const latest = useGameStore.getState().player ?? player;
    setPlayer({ ...latest, wealthCoin: (latest.wealthCoin ?? 0) - bet });
    onJackpotContrib(bet);
    // generate grid
    const r = secureRandom();
    let winSymbol: string | null = null;
    let newGrid: string[];
    if (r < 0.05) { winSymbol = '🌟'; }
    else if (r < 0.20) { winSymbol = '💎'; }
    else if (r < 0.55) { winSymbol = '🍀'; }
    if (winSymbol) {
      // place 3 of winSymbol at random positions
      const positions = [0,1,2,3,4,5,6,7,8];
      const shuffled = positions.sort(() => secureRandom() - 0.5);
      newGrid = Array(9).fill('');
      shuffled.slice(0, 3).forEach(pos => { newGrid[pos] = winSymbol!; });
      for (let i = 0; i < 9; i++) {
        if (!newGrid[i]) {
          const other = SYMBOLS.filter(s => s !== winSymbol);
          newGrid[i] = other[Math.floor(secureRandom() * other.length)];
        }
      }
    } else {
      // no match guaranteed
      newGrid = Array(9).fill('').map(() => SYMBOLS[Math.floor(secureRandom() * SYMBOLS.length)]);
      // ensure no 3 of same
    }
    setGrid(newGrid);
    setRevealed(Array(9).fill(false));
    setSelectedCells([]);
    setPhase('selecting');
    onLockChange?.(true);
    setMsg('3マスを選んでスクラッチ！');
  };

  const selectCell = (i: number) => {
    if (phase !== 'selecting' || revealed[i] || selectedCells.length >= 3) return;
    const newRevealed = [...revealed];
    newRevealed[i] = true;
    const newSelected = [...selectedCells, i];
    setRevealed(newRevealed);
    setSelectedCells(newSelected);
    if (newSelected.length === 3) {
      // check result
      const chosen = newSelected.map(idx => grid[idx]);
      const counts: Record<string, number> = {};
      chosen.forEach(s => { counts[s] = (counts[s] ?? 0) + 1; });
      const matchSymbol = Object.entries(counts).find(([, v]) => v >= 3)?.[0];
      let mult = 0, label = 'ハズレ';
      if (matchSymbol === '🌟') { mult = 10.0 * multiplierBonus; label = '🌟 大当たり！'; }
      else if (matchSymbol === '💎') { mult = 3.0 * multiplierBonus; label = '💎 中当たり！'; }
      else if (matchSymbol === '🍀') { mult = 1.5 * multiplierBonus; label = '🍀 小当たり！'; }
      const goldDelta = Math.floor(bet * mult) - bet;
      const latestP = useGameStore.getState().player ?? player!;
      if (mult > 0) setPlayer({ ...latestP, wealthCoin: (latestP.wealthCoin ?? 0) + Math.floor(bet * mult) });
      setPhase('done');
      setMsg(label);
      onLockChange?.(false);
      onResult({ rewardLabel: label, multiplier: mult, goldDelta, itemRewards: [], symbols: [matchSymbol ?? '💨'] });
    }
  };

  return (
    <div>
      {phase === 'idle' && (
        <button onClick={startGame} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#4caf87,#2d8060)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>
          ▶ スクラッチ購入 ({bet.toLocaleString()}WC)
        </button>
      )}
      {msg && <div style={{ textAlign: 'center', marginBottom: 8, fontSize: '0.9rem', color: msg.includes('当たり') ? '#4caf87' : msg.includes('大当たり') ? '#f0c060' : '#8a92b2', fontWeight: 700 }}>{msg}</div>}
      {phase !== 'idle' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
          {grid.map((sym, i) => (
            <button key={i} onClick={() => selectCell(i)} disabled={phase !== 'selecting' || revealed[i] || selectedCells.length >= 3}
              style={{ aspectRatio: '1', fontSize: '1.4rem', background: revealed[i] ? 'rgba(91,141,238,0.15)' : '#1c2235', border: `2px solid ${revealed[i] ? '#5b8dee' : selectedCells.length >= 3 && !revealed[i] ? '#1c2235' : '#2d3752'}`, borderRadius: 8, cursor: phase === 'selecting' && !revealed[i] && selectedCells.length < 3 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {revealed[i] ? sym : '🎫'}
            </button>
          ))}
        </div>
      )}
      {phase === 'done' && (
        <button onClick={startGame} style={{ width: '100%', padding: '9px', background: '#1c2235', color: '#8a92b2', border: '1px solid #2d3752', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
          🔄 もう一度
        </button>
      )}
      <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 6 }}>
        🌟×3=大当たり×10(5%) / 💎×3=中当たり×3(15%) / 🍀×3=小当たり×1.5(35%)
      </div>
    </div>
  );
}

// ============================================================
// ミニレースパネル
// ============================================================
function RacePanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0, onLockChange }: {
  bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number; onLockChange?: (locked: boolean) => void;
}) {
  const player = useGameStore(s => s.player);
  const setPlayer = useGameStore(s => s.setPlayer);
  const [choice, setChoice] = useState<'A'|'B'|'C'|null>(null);
  const [winner, setWinner] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const RACE_DEFS = [
    { id: 'A', emoji: '🐎', label: 'A（確率50%）', prob: 0.50, mult: 1.8 },
    { id: 'B', emoji: '🏇', label: 'B（確率30%）', prob: 0.30, mult: 3.0 },
    { id: 'C', emoji: '🦄', label: 'C（確率20%）', prob: 0.20, mult: 5.0 },
  ] as const;

  const race = () => {
    if (!player || (player.wealthCoin ?? 0) < bet || !choice) return;
    setLoading(true);
    onLockChange?.(true);
    const latest = useGameStore.getState().player ?? player;
    setPlayer({ ...latest, wealthCoin: (latest.wealthCoin ?? 0) - bet });
    onJackpotContrib(bet);
    setTimeout(() => {
      const r = secureRandom();
      let w: 'A'|'B'|'C';
      if (r < 0.50) w = 'A';
      else if (r < 0.80) w = 'B';
      else w = 'C';
      setWinner(w);
      const win = choice === w;
      const def = RACE_DEFS.find(d => d.id === w)!;
      const choiceDef = RACE_DEFS.find(d => d.id === choice)!;
      const mult = win ? choiceDef.mult * multiplierBonus : 0;
      const goldDelta = Math.floor(bet * mult) - bet;
      const latestP = useGameStore.getState().player ?? player;
      if (mult > 0) setPlayer({ ...latestP, wealthCoin: (latestP.wealthCoin ?? 0) + Math.floor(bet * mult) });
      onResult({ rewardLabel: win ? `${w}が勝った！` : '負け', multiplier: mult, goldDelta, itemRewards: [], symbols: [def.emoji] });
      setLoading(false);
      onLockChange?.(false);
      setChoice(null);
    }, 800);
  };

  return (
    <div>
      <div style={{ fontSize: '0.82rem', color: '#8a92b2', marginBottom: 8 }}>どのキャラが1位になるか予想してください</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {RACE_DEFS.map(d => (
          <button key={d.id} onClick={() => setChoice(d.id)} disabled={loading}
            style={{ flex: 1, padding: '12px 4px', fontSize: '0.82rem', fontWeight: 700, background: choice === d.id ? 'rgba(240,192,96,0.2)' : '#1c2235', border: `2px solid ${choice === d.id ? '#f0c060' : '#2d3752'}`, color: choice === d.id ? '#f0c060' : '#8a92b2', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem' }}>{d.emoji}</div>
            <div>{d.id}</div>
            <div style={{ fontSize: '0.7rem', color: '#4a5070' }}>×{d.mult}</div>
          </button>
        ))}
      </div>
      {winner && <div style={{ textAlign: 'center', fontSize: '1rem', marginBottom: 8, color: winner === choice ? '#4caf87' : '#e05555', fontWeight: 700 }}>
        優勝: {RACE_DEFS.find(d=>d.id===winner)?.emoji}{winner}
      </div>}
      <button onClick={race} disabled={loading || !choice || !player || (player.wealthCoin ?? 0) < bet}
        style={{ width: '100%', padding: '10px', background: choice ? 'linear-gradient(135deg,#f0a040,#c07020)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: choice ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.9rem' }}>
        {loading ? '🏁 レース中...' : `▶ スタート (${bet.toLocaleString()}WC)`}
      </button>
      <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 6 }}>
        A:50%→×1.8 / B:30%→×3.0 / C:20%→×5.0
      </div>
    </div>
  );
}

function SpectatePanel() {
  const player = useGameStore(s => s.player);
  const [battles, setBattles] = useState<import('../../types/game').GambleBattle[]>([]);
  const [watching, setWatching] = useState<import('../../types/game').GambleBattle | null>(null);
  const [replayAnim, setReplayAnim] = useState<import('../../types/game').GambleBattle | null>(null);
  const watchingIdRef = useState<{ id: string | null }>({ id: null })[0];

  useEffect(() => {
    const unsub = subscribeActiveBattles(setBattles);
    return unsub;
  }, []);

  // 観戦開始
  const startWatch = (battle: import('../../types/game').GambleBattle) => {
    if (watchingIdRef.id) leaveSpectate(watchingIdRef.id).catch(() => {});
    watchingIdRef.id = battle.id;
    joinSpectate(battle.id).catch(() => {});
    if (battle.status === 'finished') {
      setReplayAnim(battle);
    } else {
      setWatching(battle);
    }
  };

  // 観戦終了
  const stopWatch = () => {
    if (watchingIdRef.id) {
      leaveSpectate(watchingIdRef.id).catch(() => {});
      watchingIdRef.id = null;
    }
    setWatching(null);
    setReplayAnim(null);
  };

  // リアルタイム観戦: battleをポーリング
  useEffect(() => {
    if (!watching) return;
    const unsub = spectateGambleBattle(watching.id, (b) => {
      if (!b) { stopWatch(); return; }
      setWatching(b);
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watching?.id]);

  // リプレイ表示中
  if (replayAnim?.battleData) {
    return (
      <div>
        <div style={{ marginBottom: 8, fontSize: '0.82rem', color: '#8a92b2' }}>
          📺 リプレイ: {replayAnim.hostName} vs {replayAnim.guestName ?? '???'}
        </div>
        <BattleAnimation
          opponentName={replayAnim.guestName ?? '???'}
          gameName={replayAnim.gambleType}
          result={{ won: replayAnim.winnerId === replayAnim.hostUid, amount: replayAnim.betAmount }}
          battleData={replayAnim.battleData}
          iAmHost={true}
          onDone={stopWatch}
        />
        <button onClick={stopWatch} style={{ marginTop: 8, padding: '6px 16px', background: '#2d3752', color: '#8a92b2', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>
          ✕ 閉じる
        </button>
      </div>
    );
  }

  // 対戦中観戦表示
  if (watching) {
    return (
      <div>
        <div style={{ marginBottom: 8, fontSize: '0.82rem', color: '#8a92b2' }}>
          📺 観戦中: {watching.hostName} vs {watching.guestName ?? '対戦相手待ち'}
        </div>
        {watching.status === 'finished' && watching.battleData ? (
          <>
            <div style={{ color: '#4caf87', fontSize: '0.85rem', marginBottom: 8 }}>
              🏆 勝者: {watching.winnerId === watching.hostUid ? watching.hostName : watching.guestName}
            </div>
            <BattleAnimation
              opponentName={watching.guestName ?? '???'}
              gameName={watching.gambleType}
              result={{ won: watching.winnerId === watching.hostUid, amount: watching.betAmount }}
              battleData={watching.battleData}
              iAmHost={true}
              onDone={stopWatch}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#8a92b2', padding: '24px 0', fontSize: '0.85rem' }}>
            ⏳ 対戦中... ({GAME_NAMES_JP[watching.gambleType] ?? watching.gambleType} / {watching.betAmount.toLocaleString()}WC)
            <br />
            <span style={{ color: '#4a5070', fontSize: '0.75rem' }}>観戦者: {watching.spectatorCount ?? 1}人</span>
          </div>
        )}
        <button onClick={stopWatch} style={{ marginTop: 8, padding: '6px 16px', background: '#2d3752', color: '#8a92b2', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>
          ✕ 観戦をやめる
        </button>
      </div>
    );
  }

  const activeBattles = battles.filter(b => b.status === 'active');
  const finishedBattles = battles.filter(b => b.status === 'finished');

  return (
    <div>
      <div style={{ fontSize: '0.85rem', color: '#f0c060', fontWeight: 700, marginBottom: 8 }}>📺 対戦中 ({activeBattles.length}件)</div>
      {activeBattles.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#4a5070', fontSize: '0.82rem', padding: '12px 0' }}>現在対戦中のPvPはありません</div>
      ) : activeBattles.map(b => (
        <div key={b.id} style={{ background: '#1c2235', border: '1px solid #2d5230', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>⚔️ {b.hostName} vs {b.guestName ?? '???'}</span>
            <span style={{ color: '#4caf87', fontSize: '0.75rem', fontWeight: 700 }}>対戦中</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 6 }}>
            {GAME_NAMES_JP[b.gambleType] ?? b.gambleType} / {b.betAmount.toLocaleString()}WC
            {(b.spectatorCount ?? 0) > 0 && <span style={{ marginLeft: 8, color: '#5b8dee' }}>👁 {b.spectatorCount}人観戦中</span>}
          </div>
          <button onClick={() => startWatch(b)} disabled={b.hostUid === player?.uid || b.guestUid === player?.uid}
            style={{ width: '100%', padding: '5px', background: 'rgba(76,175,135,0.15)', border: '1px solid #4caf87', color: '#4caf87', borderRadius: 5, cursor: 'pointer', fontSize: '0.78rem' }}>
            👁 観戦する
          </button>
        </div>
      ))}

      <div style={{ fontSize: '0.85rem', color: '#8a92b2', fontWeight: 700, marginTop: 12, marginBottom: 8 }}>🕑 終了済み ({finishedBattles.length}件)</div>
      {finishedBattles.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#4a5070', fontSize: '0.82rem', padding: '8px 0' }}>終了済みの対戦はありません</div>
      ) : finishedBattles.map(b => (
        <div key={b.id} style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{b.hostName} vs {b.guestName ?? '???'}</span>
            <span style={{ color: '#4a5070', fontSize: '0.75rem' }}>終了</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 4 }}>
            {GAME_NAMES_JP[b.gambleType] ?? b.gambleType} / {b.betAmount.toLocaleString()}WC
          </div>
          {b.winnerId && (
            <div style={{ fontSize: '0.75rem', color: '#f0c060', marginBottom: 6 }}>
              🏆 勝者: {b.winnerId === b.hostUid ? b.hostName : b.guestName}
            </div>
          )}
          {b.battleData && (
            <button onClick={() => startWatch(b)}
              style={{ width: '100%', padding: '5px', background: 'rgba(91,141,238,0.1)', border: '1px solid #5b8dee', color: '#5b8dee', borderRadius: 5, cursor: 'pointer', fontSize: '0.78rem' }}>
              ▶ リプレイを見る
            </button>
          )}
        </div>
      ))}
    </div>
  );
}


// ============================================================
// ランクパネル
// ============================================================
function RankPanel() {
  const player = useGameStore(s => s.player);
  if (!player) return null;
  const totalWagered = player.totalWagered ?? 0;
  const rankInfo = getGambleRank(totalWagered);
  const currentRankDef = GAMBLE_RANK_DEFS.find(r => r.name === rankInfo.name) ?? GAMBLE_RANK_DEFS[0];
  const nextRankDef = GAMBLE_RANK_DEFS[GAMBLE_RANK_DEFS.indexOf(currentRankDef) + 1];

  const progressPct = nextRankDef
    ? Math.min(100, ((totalWagered - currentRankDef.threshold) / (nextRankDef.threshold - currentRankDef.threshold)) * 100)
    : 100;

  return (
    <div style={{ padding: '0 4px' }}>
      {/* 現在のランク */}
      <div style={{ background: `linear-gradient(135deg,rgba(${rankInfo.color === '#e060e0' ? '224,96,224' : rankInfo.color === '#f0a040' ? '240,160,64' : rankInfo.color === '#5b8dee' ? '91,141,238' : rankInfo.color === '#4caf87' ? '76,175,135' : '138,146,178'},0.15),transparent)`, border: `2px solid ${rankInfo.color}`, borderRadius: 12, padding: 16, marginBottom: 14, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>{currentRankDef.badge}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: rankInfo.color, marginBottom: 4 }}>{rankInfo.name}</div>
        <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginBottom: 10 }}>累計賭け額: <span style={{ color: '#f0c060', fontWeight: 700 }}>{totalWagered.toLocaleString()}WC</span></div>
        {/* 進捗バー */}
        {nextRankDef ? (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#4a5070', marginBottom: 4 }}>
              <span>{totalWagered.toLocaleString()}WC</span>
              <span>{nextRankDef.threshold.toLocaleString()}WC</span>
            </div>
            <div style={{ background: '#161b26', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: `linear-gradient(90deg,${rankInfo.color},${nextRankDef.color})`, borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8a92b2', marginTop: 4 }}>
              次のランク「{nextRankDef.name}」まで {(nextRankDef.threshold - totalWagered).toLocaleString()}WC
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.82rem', color: '#e060e0', fontWeight: 700 }}>🌟 最高ランク到達！</div>
        )}
      </div>

      {/* 特典一覧 */}
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0c060', marginBottom: 8 }}>🎁 現在のランク特典</div>
      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 12, marginBottom: 14 }}>
        {currentRankDef.perks.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < currentRankDef.perks.length - 1 ? '1px solid #2d3752' : 'none' }}>
            <span style={{ color: rankInfo.color }}>✦</span>
            <span style={{ fontSize: '0.82rem', color: '#e8e6ff' }}>{p}</span>
          </div>
        ))}
      </div>

      {/* 全ランク表 */}
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8a92b2', marginBottom: 8 }}>📊 ランク一覧</div>
      {GAMBLE_RANK_DEFS.map((r, i) => {
        const isCurrentRank = r.name === rankInfo.name;
        const isUnlocked = totalWagered >= r.threshold;
        return (
          <div key={r.name} style={{ background: isCurrentRank ? 'rgba(91,141,238,0.08)' : '#1c2235', border: `1px solid ${isCurrentRank ? '#5b8dee' : '#2d3752'}`, borderRadius: 8, padding: '10px 12px', marginBottom: 6, opacity: isUnlocked ? 1 : 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1.4rem' }}>{r.badge}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: r.color }}>{r.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#4a5070' }}>{r.threshold === 0 ? '初期ランク' : `累計${r.threshold.toLocaleString()}WC〜`}</div>
              </div>
              {isCurrentRank && <span style={{ fontSize: '0.7rem', background: '#5b8dee', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>現在</span>}
              {!isCurrentRank && isUnlocked && i < GAMBLE_RANK_DEFS.indexOf(GAMBLE_RANK_DEFS.find(x => x.name === rankInfo.name)!) && <span style={{ fontSize: '0.7rem', color: '#4caf87' }}>✓</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {r.perks.map((p, pi) => <div key={pi} style={{ fontSize: '0.72rem', color: '#8a92b2', paddingLeft: 8 }}>• {p}</div>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// ミッションパネル
// ============================================================
function MissionPanel() {
  const { player, changeWealthCoin, addNotification } = useGameStore(s => ({
    player: s.player, changeWealthCoin: s.changeWealthCoin, addNotification: s.addNotification,
  }));
  const setPlayer = useGameStore(s => s.setPlayer);
  const [missionTab, setMissionTab] = useState<'daily' | 'weekly' | 'achievement'>('daily');

  if (!player) return null;

  const mp = ensureMissionProgress(player.missionProgress);
  const totalWagered = player.totalWagered ?? 0;
  const rewardBonus = getMissionRewardBonus(totalWagered);
  const rankInfo = getGambleRank(totalWagered);

  // デイリー/ウィークリーリセット確認
  const now = Date.now();
  const DAY_MS = 86_400_000;
  const _WEEK_MS = 604_800_000; void _WEEK_MS;

  const missionsForTab = MISSION_DEFS.filter(m => m.type === missionTab);

  const getProgress = (m: typeof MISSION_DEFS[0]) => {
    const val = (mp as unknown as Record<string, number>)[m.statKey] ?? 0;
    return Math.min(val, m.target);
  };

  const isMissionCompleted = (m: typeof MISSION_DEFS[0]) => {
    if (m.type === 'achievement') return mp.completedMissions.includes(m.id);
    // daily/weekly: check progress
    return getProgress(m) >= m.target;
  };

  const isRewarded = (m: typeof MISSION_DEFS[0]) => mp.claimedMissions.includes(m.id);

  const claimReward = (m: typeof MISSION_DEFS[0]) => {
    if (!isMissionCompleted(m) || isRewarded(m)) return;
    const reward = Math.floor(m.rewardWC * rewardBonus);
    changeWealthCoin(reward);
    const latest = useGameStore.getState().player ?? player;
    const latestMp = ensureMissionProgress(latest.missionProgress);
    const newMp = {
      ...latestMp,
      claimedMissions: [...latestMp.claimedMissions, m.id],
      completedMissions: m.type === 'achievement' ? [...latestMp.completedMissions, m.id] : latestMp.completedMissions,
    };
    setPlayer({ ...latest, missionProgress: newMp });
    addNotification('success', `🎁 ${m.title} クリア！ +${reward.toLocaleString()}WC`);
  };

  const completedCount = missionsForTab.filter(m => isRewarded(m)).length;
  const claimableCount = missionsForTab.filter(m => isMissionCompleted(m) && !isRewarded(m)).length;

  const claimAll = () => {
    const claimable = missionsForTab.filter(m => isMissionCompleted(m) && !isRewarded(m));
    if (claimable.length === 0) return;
    let totalWC = 0;
    const latestAfter = useGameStore.getState().player ?? player!;
    const latestMp = ensureMissionProgress(latestAfter.missionProgress);
    const newClaimed = [...latestMp.claimedMissions];
    const newCompleted = [...latestMp.completedMissions];
    for (const m of claimable) {
      const reward = Math.floor(m.rewardWC * rewardBonus);
      totalWC += reward;
      newClaimed.push(m.id);
      if (m.type === 'achievement' && !newCompleted.includes(m.id)) newCompleted.push(m.id);
    }
    changeWealthCoin(totalWC);
    const latest2 = useGameStore.getState().player ?? player!;
    setPlayer({ ...latest2, missionProgress: { ...ensureMissionProgress(latest2.missionProgress), claimedMissions: newClaimed, completedMissions: newCompleted } });
    addNotification('success', `🎁 ${claimable.length}件一括受取！ +${totalWC.toLocaleString()}WC`);
  };

  return (
    <div style={{ padding: '0 4px' }}>
      {/* ランクボーナス表示 */}
      {rewardBonus > 1 && (
        <div style={{ background: 'rgba(240,192,96,0.08)', border: '1px solid #f0c060', borderRadius: 8, padding: '6px 12px', marginBottom: 10, fontSize: '0.78rem', color: '#f0c060' }}>
          🏅 {rankInfo.name}ボーナス: ミッション報酬×{rewardBonus.toFixed(2)}
        </div>
      )}

      {/* サブタブ */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['daily', 'weekly', 'achievement'] as const).map(t => (
          <button key={t} onClick={() => setMissionTab(t)}
            style={{ flex: 1, padding: '7px 0', fontSize: '0.75rem', fontWeight: 700,
              background: missionTab === t ? 'rgba(91,141,238,0.2)' : '#1c2235',
              border: `1px solid ${missionTab === t ? '#5b8dee' : '#2d3752'}`,
              color: missionTab === t ? '#e8e6ff' : '#8a92b2', borderRadius: 6, cursor: 'pointer' }}>
            {t === 'daily' ? '📅 デイリー' : t === 'weekly' ? '📆 ウィークリー' : '🏆 実績'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: '0.72rem', color: '#4a5070' }}>
          {completedCount}/{missionsForTab.length} クリア済み
          {missionTab === 'daily' && now - mp.dailyResetAt > DAY_MS && <span style={{ color: '#e05555', marginLeft: 8 }}>（明日リセット）</span>}
        </div>
        {claimableCount > 0 && (
          <button onClick={claimAll}
            style={{ padding: '5px 12px', background: 'linear-gradient(135deg,#f0c060,#c08020)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
            🎁 一括受取（{claimableCount}件）
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {missionsForTab.map(m => {
          const prog = getProgress(m);
          const completed = isMissionCompleted(m);
          const rewarded = isRewarded(m);
          const pct = Math.min(100, (prog / m.target) * 100);
          const rewardWCDisplay = Math.floor(m.rewardWC * rewardBonus);

          return (
            <div key={m.id} style={{
              background: rewarded ? 'rgba(76,175,135,0.06)' : '#1c2235',
              border: `1px solid ${rewarded ? '#2d5240' : completed ? '#4caf87' : '#2d3752'}`,
              borderRadius: 8, padding: '10px 12px', opacity: rewarded ? 0.65 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: rewarded ? '#4caf87' : '#e8e6ff' }}>
                    {rewarded ? '✅ ' : completed ? '🎁 ' : ''}{m.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginTop: 2 }}>{m.description}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginLeft: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: '#f0c060', fontWeight: 700 }}>+{rewardWCDisplay.toLocaleString()}WC</span>
                  {completed && !rewarded && (
                    <button onClick={() => claimReward(m)}
                      style={{ padding: '4px 10px', background: 'linear-gradient(135deg,#4caf87,#2d8060)', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                      受取
                    </button>
                  )}
                </div>
              </div>
              {/* 進捗バー */}
              <div style={{ background: '#161b26', borderRadius: 3, height: 5, overflow: 'hidden', marginTop: 4 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: completed ? '#4caf87' : '#5b8dee', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: '0.68rem', color: '#4a5070', marginTop: 3, textAlign: 'right' }}>
                {prog.toLocaleString()} / {m.target.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExchangePanel() {
  const { player, changeGold, changeWealthCoin, addNotification } = useGameStore(s => ({
    player: s.player, changeGold: s.changeGold, changeWealthCoin: s.changeWealthCoin, addNotification: s.addNotification
  }));
  const [gwcAmount, setGwcAmount] = useState(10);
  const [wcgAmount, setWcgAmount] = useState(300);
  if (!player) return null;
  const wc = player.wealthCoin ?? 0;

  const buyWC = () => {
    if (gwcAmount <= 0) return;
    if (!changeGold(-gwcAmount)) { addNotification('error', 'Gが足りません'); return; }
    changeWealthCoin(gwcAmount * 30);
    addNotification('success', `${(gwcAmount * 30).toLocaleString()}WC を取得しました！`);
  };

  const sellWC = () => {
    if (wcgAmount <= 0) return;
    if (wc < wcgAmount) { addNotification('error', 'WCが足りません'); return; }
    changeWealthCoin(-wcgAmount);
    const receive = Math.floor(wcgAmount / 300 * 7);
    changeGold(receive);
    addNotification('success', `${receive.toLocaleString()}G を受け取りました！`);
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: '0.9rem', color: '#8a92b2' }}>所持G: <span style={{ color: '#f0c060', fontWeight: 700 }}>{player.gold.toLocaleString()}G</span></div>
          <div style={{ fontSize: '0.9rem', color: '#8a92b2' }}>所持WC: <span style={{ color: '#4caf87', fontWeight: 700 }}>{wc.toLocaleString()}WC</span></div>
        </div>
        <div style={{ marginBottom: 16, padding: 12, background: '#161b26', borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#e8e6ff' }}>G → WC（10G = 300WC）</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="number" value={gwcAmount} min={1} onChange={e => setGwcAmount(Math.max(1, Number(e.target.value)))}
              style={{ flex: 1, padding: '6px 8px', background: '#1c2235', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem' }} />
            <span style={{ color: '#8a92b2', fontSize: '0.75rem' }}>G →</span>
            <span style={{ color: '#4caf87', fontWeight: 700, fontSize: '0.85rem' }}>{(gwcAmount * 30).toLocaleString()}WC</span>
          </div>
          <button onClick={buyWC} disabled={(player.gold ?? 0) < gwcAmount}
            style={{ width: '100%', marginTop: 8, padding: '8px', background: (player.gold ?? 0) >= gwcAmount ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            {(player.gold ?? 0) >= gwcAmount ? '両替する' : 'Gが足りない'}
          </button>
        </div>
        <div style={{ padding: 12, background: '#161b26', borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#e8e6ff' }}>WC → G（300WC = 7G）</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="number" value={wcgAmount} min={300} step={300} onChange={e => setWcgAmount(Math.max(300, Number(e.target.value)))}
              style={{ flex: 1, padding: '6px 8px', background: '#1c2235', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem' }} />
            <span style={{ color: '#8a92b2', fontSize: '0.75rem' }}>WC →</span>
            <span style={{ color: '#f0c060', fontWeight: 700, fontSize: '0.85rem' }}>{Math.floor(wcgAmount / 300 * 7).toLocaleString()}G</span>
          </div>
          <button onClick={sellWC} disabled={wc < wcgAmount}
            style={{ width: '100%', marginTop: 8, padding: '8px', background: wc >= wcgAmount ? 'linear-gradient(135deg,#f0c060,#c08020)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            {wc >= wcgAmount ? 'WC → G に両替' : 'WCが足りない'}
          </button>
        </div>
      </div>
      <div style={{ fontSize: '0.72rem', color: '#4a5070', textAlign: 'center' }}>※10G → 300WC　/　300WC → 7G</div>
    </div>
  );
}

// ============================================================
// 株式市場パネル（Wealth Exchange）
// ============================================================
const SECTOR_LABEL: Record<StockSector, string> = {
  tech: 'テック', industry: '工業', finance: '金融', consumer: '消費財', entertainment: '娯楽', energy: 'エネルギー',
};

function StockMarketPanel() {
  const player = useGameStore(s => s.player);
  const changeWealthCoin = useGameStore(s => s.changeWealthCoin);
  const addNotification = useGameStore(s => s.addNotification);

  const [prices, setPrices] = useState<Record<StockId, number>>(() => {
    const p = {} as Record<StockId, number>;
    for (const id of STOCK_ID_LIST) p[id] = STOCK_MASTERS[id].basePrice;
    return p;
  });
  const [history, setHistory] = useState<Record<StockId, StockPricePoint[]>>({} as Record<StockId, StockPricePoint[]>);
  const [trends, setTrends] = useState<Record<StockId, StockTrendData>>({} as Record<StockId, StockTrendData>);
  const [news, setNews] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockId>('wealth_mining');
  const [buyAmt, setBuyAmt] = useState(1);
  const [stockRanking, setStockRanking] = useState<StockRankingEntry[]>([]);
  const [rankTab, setRankTab] = useState<'profit' | 'assets'>('profit');
  const [stockView, setStockView] = useState<'overview' | 'market' | 'detail' | 'portfolio' | 'analysis' | 'ranking'>('overview');
  const [chartMode, setChartMode] = useState<'line' | 'candle'>('line');
  const [_prevPrices, setPrevPrices] = useState<Record<StockId, number>>({} as Record<StockId, number>);
  const [clockNow, setClockNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = subscribeStockPrices((p, h, t) => {
      setPrevPrices(prev => {
        const updated = { ...prev };
        for (const id of STOCK_ID_LIST) if (!updated[id]) updated[id] = STOCK_MASTERS[id].basePrice;
        return updated;
      });
      const initPrices = { ...p } as Record<StockId, number>;
      for (const id of STOCK_ID_LIST) if (!initPrices[id]) initPrices[id] = STOCK_MASTERS[id].basePrice;
      setPrices(initPrices);
      setHistory({ ...h });
      setTrends({ ...t });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeStockRanking(entries => setStockRanking(entries));
    return unsub;
  }, []);

  useEffect(() => {
    const DEBUG_SKIP_MARKET_HOURS = false;
    const doTick = () => {
      if (!DEBUG_SKIP_MARKET_HOURS) {
        const now = new Date();
        const h = now.getHours();
        if (h < MARKET_OPEN_HOUR || h >= MARKET_CLOSE_HOUR) return;
      }
      tickStockPrices().then(({ news: newN }) => {
        if (newN.length > 0) setNews(prev => [...newN, ...prev].slice(0, 30));
      }).catch((e) => { console.error('[StockTick] tick失敗:', e); });
    };
    doTick();
    const interval = setInterval(doTick, 30_000);
    return () => { clearInterval(interval); };
  }, []);

  const holdings: Record<string, StockHolding> = (player?.stockHoldings ?? {}) as Record<string, StockHolding>;
  const getPrice = (id: StockId) => prices[id] ?? STOCK_MASTERS[id].basePrice;

  // 保有ボーナス計算（1時間ごとに+2%、上限+50%）
  const getHoldBonus = (id: StockId): number => {
    const h = holdings[id];
    if (!h || !h.purchasedAt) return 0;
    const hours = (Date.now() - h.purchasedAt) / 3_600_000;
    return Math.min(0.5, hours * 0.02);
  };

  // 今日の取引停止チェック
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const isHalted = (id: StockId): boolean => {
    const t = trends[id];
    if (!t || !t.haltedAt) return false;
    return t.haltedAt >= todayStart.getTime();
  };

  type PortfolioRow = {
    id: StockId;
    name: string;
    icon: string;
    sector: StockSector;
    amount: number;
    avgBuyPrice: number;
    currentPrice: number;
    bonus: number;
    totalValue: number;
    baseCost: number;
    profit: number;
    profitRate: number;
    dayChange: number;
    dayChangeRate: number;
    weight: number;
    halted: boolean;
  };

  const portfolioRows = useMemo<PortfolioRow[]>(() => {
    const rows: PortfolioRow[] = STOCK_ID_LIST
      .filter((id) => (holdings[id]?.amount ?? 0) > 0)
      .map((id) => {
        const h = holdings[id];
        const m = STOCK_MASTERS[id];
        const currentPrice = getPrice(id);
        const bonus = getHoldBonus(id);
        const totalValue = Math.round(currentPrice * h.amount * (1 + bonus));
        const baseCost = h.avgBuyPrice * h.amount;
        const profit = totalValue - baseCost;
        const profitRate = baseCost > 0 ? profit / baseCost : 0;
        const hist = history[id] ?? [];
        const prevPoint = hist.length >= 2 ? hist[hist.length - 2] : hist[hist.length - 1];
        const prevClose = prevPoint ? (prevPoint.close ?? prevPoint.price) : currentPrice;
        const dayChange = currentPrice - prevClose;
        const dayChangeRate = prevClose > 0 ? dayChange / prevClose : 0;
        return {
          id,
          name: m.name,
          icon: m.icon,
          sector: m.sector,
          amount: h.amount,
          avgBuyPrice: h.avgBuyPrice,
          currentPrice,
          bonus,
          totalValue,
          baseCost,
          profit,
          profitRate,
          dayChange,
          dayChangeRate,
          weight: 0,
          halted: isHalted(id),
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue);

    const totalValue = rows.reduce((sum, row) => sum + row.totalValue, 0);
    for (const row of rows) row.weight = totalValue > 0 ? row.totalValue / totalValue : 0;
    return rows;
  }, [holdings, prices, trends, history, clockNow]);

  const portfolioSummary = useMemo(() => {
    const totalValue = portfolioRows.reduce((sum, row) => sum + row.totalValue, 0);
    const totalCost = portfolioRows.reduce((sum, row) => sum + row.baseCost, 0);
    const totalProfit = totalValue - totalCost;
    const totalProfitRate = totalCost > 0 ? totalProfit / totalCost : 0;
    const totalShares = portfolioRows.reduce((sum, row) => sum + row.amount, 0);
    const winningCount = portfolioRows.filter(row => row.profit >= 0).length;
    const losingCount = portfolioRows.length - winningCount;
    const sectorValue: Record<StockSector, number> = {
      tech: 0, industry: 0, finance: 0, consumer: 0, entertainment: 0, energy: 0,
    };
    for (const row of portfolioRows) sectorValue[row.sector] += row.totalValue;
    const topGain = portfolioRows.reduce<PortfolioRow | null>((best, row) => (!best || row.profit > best.profit ? row : best), null);
    const topLoss = portfolioRows.reduce<PortfolioRow | null>((worst, row) => (!worst || row.profit < worst.profit ? row : worst), null);
    const largest = portfolioRows[0] ?? null;
    return {
      totalValue,
      totalCost,
      totalProfit,
      totalProfitRate,
      totalShares,
      winningCount,
      losingCount,
      sectorValue,
      topGain,
      topLoss,
      largest,
    };
  }, [portfolioRows]);

  const handleBuy = () => {
    if (!player) return;
    if (!getMarketStatus(clockNow).isOpen) { addNotification('error', '閉場中は取引できません'); return; }
    if (isHalted(selectedStock)) { addNotification('error', '本日の取引は停止しています'); return; }
    const price = getPrice(selectedStock);
    const total = price * buyAmt;
    if ((player.wealthCoin ?? 0) < total) { addNotification('error', 'WCが足りません'); return; }
    changeWealthCoin(-total);
    const prev = holdings[selectedStock];
    const newAvg = prev ? Math.round((prev.avgBuyPrice * prev.amount + price * buyAmt) / (prev.amount + buyAmt)) : price;
    const newHolding: StockHolding = {
      stockId: selectedStock, amount: (prev?.amount ?? 0) + buyAmt,
      avgBuyPrice: newAvg, purchasedAt: prev?.purchasedAt ?? Date.now(),
    };
    const latest = useGameStore.getState().player;
    if (latest) useGameStore.setState({ player: { ...latest, stockHoldings: { ...latest.stockHoldings, [selectedStock]: newHolding } } });
    addNotification('success', `📈 ${STOCK_MASTERS[selectedStock].name} ×${buyAmt} 購入（${total.toLocaleString()}WC）`);
  };

  const handleSell = (id: StockId) => {
    if (!player) return;
    if (!getMarketStatus(clockNow).isOpen) { addNotification('error', '閉場中は取引できません'); return; }
    const h = holdings[id];
    if (!h || h.amount <= 0) return;
    if (h.purchasedAt && Date.now() - h.purchasedAt < 86_400_000) {
      const remaining = Math.ceil((h.purchasedAt + 86_400_000 - Date.now()) / 3_600_000);
      addNotification('error', `購入から24時間は売却できません（あと約${remaining}時間）`);
      return;
    }
    const price = getPrice(id);
    const bonus = getHoldBonus(id);
    const bonusMult = 1 + bonus;
    const total = Math.round(price * h.amount * bonusMult);
    const profit = total - h.avgBuyPrice * h.amount;
    changeWealthCoin(total);
    const latest = useGameStore.getState().player;
    if (latest) {
      const newHoldings = { ...(latest.stockHoldings ?? {}) };
      delete newHoldings[id];
      const newProfit = (latest.totalStockProfit ?? 0) + profit;
      useGameStore.setState({ player: { ...latest, stockHoldings: newHoldings, totalStockProfit: newProfit } });
      const totalAssets = STOCK_ID_LIST.reduce((sum, sid) => {
        const sh = newHoldings[sid] as StockHolding | undefined;
        return sum + (sh ? getPrice(sid) * sh.amount : 0);
      }, 0);
      updateStockRanking(latest.uid, latest.displayName, profit, totalAssets).catch(() => {});
    }
    const bonusStr = bonus > 0 ? ` (保有ボーナス +${(bonus*100).toFixed(0)}%)` : '';
    addNotification(profit >= 0 ? 'success' : 'info', `📉 ${STOCK_MASTERS[id].name} 全売却: ${total.toLocaleString()}WC（${profit >= 0 ? '+' : ''}${profit.toLocaleString()}WC）${bonusStr}`);
  };

  // 折れ線グラフ
  const renderLineChart = (id: StockId, compact = false) => {
    const hist = history[id] ?? [];
    const currentPrice = getPrice(id);
    const h = compact ? 50 : 120;
    if (hist.length < 2) return (
      <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
        <circle cx="50" cy={h*0.5} r="2" fill="#5b8dee" vectorEffect="non-scaling-stroke" />
      </svg>
    );
    const pts = hist.slice(-60);
    const allPrices = pts.map(p => p.price); allPrices.push(currentPrice);
    const maxP = Math.max(...allPrices), minP = Math.min(...allPrices);
    const range = maxP - minP || maxP * 0.01;
    const pad = compact ? 4 : 8;
    const chartH = h - pad * 2;
    const w = 100 / Math.max(pts.length - 1, 1);
    const toY = (price: number) => (pad + ((maxP - price) / range) * chartH).toFixed(1);
    const points = pts.map((p, i) => `${(i * w).toFixed(1)},${toY(p.price)}`).join(' ');
    const isUp = pts[pts.length-1].price >= pts[0].price;
    const lineColor = isUp ? '#4caf87' : '#e05555';
    const fillColor = isUp ? 'rgba(76,175,135,0.12)' : 'rgba(224,85,85,0.12)';
    const lastX = ((pts.length - 1) * w).toFixed(1);
    const lastY = toY(pts[pts.length-1].price);
    const fillPts = `0,${h} ` + points + ` ${lastX},${h}`;
    // バブル点を強調
    return (
      <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
        <polygon points={fillPts} fill={fillColor} />
        <polyline points={points} fill="none" stroke={lineColor} strokeWidth={compact ? '1.2' : '1.5'} vectorEffect="non-scaling-stroke" />
        {!compact && pts.map((p, i) => p.news && p.news.includes('バブル') ? (
          <circle key={i} cx={(i * w).toFixed(1)} cy={toY(p.price)} r="3" fill="#f0c060" vectorEffect="non-scaling-stroke" />
        ) : null)}
        <circle cx={lastX} cy={lastY} r={compact ? '1.5' : '2'} fill={lineColor} vectorEffect="non-scaling-stroke" />
      </svg>
    );
  };

  // ローソク足チャート
  const renderCandleChart = (id: StockId) => {
    const hist = history[id] ?? [];
    if (hist.length < 2) return <svg viewBox="0 0 100 120" style={{width:'100%',height:'100%'}}></svg>;
    const pts = hist.slice(-40);
    const allPrices = pts.flatMap(p => [p.open ?? p.price, p.high ?? p.price, p.low ?? p.price, p.close ?? p.price]);
    const maxP = Math.max(...allPrices), minP = Math.min(...allPrices);
    const range = maxP - minP || maxP * 0.01;
    const h = 120; const pad = 8; const chartH = h - pad * 2;
    const w = 100 / pts.length;
    const toY = (price: number) => pad + ((maxP - price) / range) * chartH;
    return (
      <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
        {pts.map((p, i) => {
          const open = p.open ?? p.price; const close = p.close ?? p.price;
          const high = p.high ?? Math.max(open, close); const low = p.low ?? Math.min(open, close);
          const isUp = close >= open;
          const color = isUp ? '#4caf87' : '#e05555';
          const x = i * w + w * 0.1;
          const bw = w * 0.8;
          const bodyTop = toY(Math.max(open, close));
          const bodyBot = toY(Math.min(open, close));
          const bodyH = Math.max(0.5, bodyBot - bodyTop);
          const cx = i * w + w * 0.5;
          const isBubble = p.news && p.news.includes('バブル');
          return (
            <g key={i}>
              {/* ヒゲ */}
              <line x1={cx.toFixed(1)} y1={toY(high).toFixed(1)} x2={cx.toFixed(1)} y2={toY(low).toFixed(1)}
                stroke={color} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
              {/* ボディ */}
              <rect x={x.toFixed(1)} y={bodyTop.toFixed(1)} width={bw.toFixed(1)} height={bodyH.toFixed(1)}
                fill={isBubble ? '#f0c060' : color} stroke={isBubble ? '#f0c060' : color} strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
    );
  };

  const renderChart = (id: StockId, compact = false) => {
    if (!compact && chartMode === 'candle') return renderCandleChart(id);
    return renderLineChart(id, compact);
  };

  const selectedHistory = history[selectedStock] ?? [];
  const selectedPrice = getPrice(selectedStock);
  const selectedMaster = STOCK_MASTERS[selectedStock];
  const selectedTrend = trends[selectedStock];

  const TAB_STYLE = (active: boolean) => ({
    flex: 1, padding: '6px 2px', fontSize: '0.68rem', fontWeight: 700,
    background: active ? 'rgba(91,141,238,0.2)' : '#1c2235',
    border: `1px solid ${active ? '#5b8dee' : '#2d3752'}`,
    color: active ? '#e8e6ff' : '#8a92b2', borderRadius: 6, cursor: 'pointer' as const,
  });

  return (
    <div>
      {/* 開場/閉場ステータスバー */}
      {(() => {
        const status = getMarketStatus(clockNow);
        const msLeft = status.msUntilChange;
        const hh = Math.floor(msLeft / 3_600_000);
        const mm = Math.floor((msLeft % 3_600_000) / 60_000);
        const ss = Math.floor((msLeft % 60_000) / 1000);
        return (
          <div style={{
            display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
            background: status.isOpen ? 'rgba(76,175,135,0.08)' : 'rgba(224,85,85,0.08)',
            border: `1px solid ${status.isOpen ? 'rgba(76,175,135,0.35)' : 'rgba(224,85,85,0.35)'}`,
            borderRadius:8, padding:'8px 12px', marginBottom:10,
          }}>
            <span style={{fontWeight:700, fontSize:'0.82rem', color: status.isOpen ? '#4caf87' : '#e05555'}}>
              {status.isOpen ? '🟢 開場中' : '🔴 閉場中'}
            </span>
            <span style={{fontSize:'0.7rem', color:'#8a92b2'}}>⏰ 開場時間 {MARKET_OPEN_HOUR}:00〜{MARKET_CLOSE_HOUR}:00</span>
            <span style={{fontSize:'0.7rem', color:'#8a92b2', marginLeft:'auto'}}>
              {status.isOpen ? '閉場まで' : '開場まで'} {hh}:{mm.toString().padStart(2,'0')}:{ss.toString().padStart(2,'0')}
            </span>
            {!status.isOpen && (
              <span style={{fontSize:'0.68rem', color:'#e05555', width:'100%'}}>
                ⚠️ 閉場中は売買・価格更新が停止されます（ニュースのみ低頻度で配信）
              </span>
            )}
          </div>
        );
      })()}

      {/* メインタブ */}
      <div style={{display:'flex', gap:4, marginBottom:10, flexWrap:'wrap'}}>
        {([['overview','🏛️ 概要'],['market','📈 市場'],['detail','🔍 詳細'],['portfolio','💼 保有'],['analysis','🧠 分析'],['ranking','🏆 ランク']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setStockView(v)} style={TAB_STYLE(stockView === v)}>{label}</button>
        ))}
      </div>

      {/* ========== 概要タブ ========== */}
      {stockView === 'overview' && (() => {
        const status = getMarketStatus(clockNow);
        const movers = STOCK_ID_LIST.map(id => {
          const m = STOCK_MASTERS[id];
          const p = getPrice(id);
          const hist = history[id] ?? [];
          const prevPrice = hist.length > 1 ? hist[hist.length-2].price : m.basePrice;
          const change = prevPrice > 0 ? (p - prevPrice) / prevPrice * 100 : 0;
          return { id, m, p, change, halted: isHalted(id) };
        });
        const up = movers.filter(s => s.change > 0.01).length;
        const down = movers.filter(s => s.change < -0.01).length;
        const flat = movers.length - up - down;
        const overallChange = movers.reduce((sum, s) => sum + s.change, 0) / (movers.length || 1);
        const topMovers = [...movers].sort((a,b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5);
        return (
          <div>
            <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'12px 14px', marginBottom:10}}>
              <div style={{fontWeight:700, fontSize:'0.85rem', marginBottom:8}}>📊 市場サマリー</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8}}>
                <div style={{textAlign:'center', background:'#161b26', borderRadius:6, padding:'8px 4px'}}>
                  <div style={{fontSize:'0.65rem', color:'#4a5070'}}>上昇</div>
                  <div style={{fontSize:'1rem', fontWeight:700, color:'#4caf87'}}>▲ {up}</div>
                </div>
                <div style={{textAlign:'center', background:'#161b26', borderRadius:6, padding:'8px 4px'}}>
                  <div style={{fontSize:'0.65rem', color:'#4a5070'}}>横ばい</div>
                  <div style={{fontSize:'1rem', fontWeight:700, color:'#8a92b2'}}>➡️ {flat}</div>
                </div>
                <div style={{textAlign:'center', background:'#161b26', borderRadius:6, padding:'8px 4px'}}>
                  <div style={{fontSize:'0.65rem', color:'#4a5070'}}>下落</div>
                  <div style={{fontSize:'1rem', fontWeight:700, color:'#e05555'}}>▼ {down}</div>
                </div>
              </div>
              <div style={{textAlign:'center', background:'#161b26', borderRadius:6, padding:'8px 4px'}}>
                <div style={{fontSize:'0.65rem', color:'#4a5070'}}>市場全体騰落率（平均）</div>
                <div style={{fontSize:'1.1rem', fontWeight:700, color: overallChange >= 0 ? '#4caf87' : '#e05555'}}>
                  {overallChange >= 0 ? '▲' : '▼'} {Math.abs(overallChange).toFixed(2)}%
                </div>
              </div>
            </div>

            <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'12px 14px', marginBottom:10}}>
              <div style={{fontWeight:700, fontSize:'0.85rem', marginBottom:6}}>🔥 急変動銘柄 TOP5</div>
              {topMovers.map(s => (
                <div key={s.id} onClick={() => { setSelectedStock(s.id); setStockView('detail'); }}
                  style={{display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid #1a1f30', cursor:'pointer'}}>
                  <span>{s.m.icon}</span>
                  <span style={{flex:1, fontSize:'0.78rem', fontWeight:600}}>{s.m.name}</span>
                  {s.halted && <span style={{fontSize:'0.6rem', color:'#e05555', border:'1px solid #e05555', borderRadius:3, padding:'0 4px'}}>🚫停止</span>}
                  <span style={{fontSize:'0.78rem', color: s.change >= 0 ? '#4caf87' : '#e05555'}}>
                    {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>

            <div style={{background:'rgba(240,192,96,0.08)', border:'1px solid rgba(240,192,96,0.25)', borderRadius:8, padding:'10px 14px', marginBottom:10, maxHeight:120, overflowY:'auto'}}>
              <div style={{fontSize:'0.78rem', color:'#f0c060', fontWeight:700, marginBottom:4}}>📰 最新ニュース</div>
              {news.length === 0 && <div style={{fontSize:'0.72rem', color:'#4a5070'}}>本日のニュースはまだありません</div>}
              {news.slice(0,5).map((n,i) => <div key={i} style={{fontSize:'0.72rem', color:'#8a92b2', padding:'2px 0'}}>{n}</div>)}
            </div>

            <div style={{background: status.isOpen ? 'rgba(76,175,135,0.08)' : 'rgba(224,85,85,0.08)', border:`1px solid ${status.isOpen ? 'rgba(76,175,135,0.3)' : 'rgba(224,85,85,0.3)'}`, borderRadius:8, padding:'10px 14px'}}>
              <div style={{fontSize:'0.78rem', fontWeight:700, color: status.isOpen ? '#4caf87' : '#e05555', marginBottom:4}}>
                {status.isOpen ? '✅ 現在取引可能です' : '🚫 現在取引できません'}
              </div>
              <div style={{fontSize:'0.7rem', color:'#8a92b2'}}>
                市場は毎日 {MARKET_OPEN_HOUR}:00〜{MARKET_CLOSE_HOUR}:00 の間に開場します。開場中は約30秒ごとに価格が更新され、1日あたり平均5件のニュースが配信されます。閉場中は価格が固定され、ニュースは1日1件程度に減少します。
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========== 市場タブ ========== */}
      {stockView === 'market' && (
        <>
          {news.length > 0 && (
            <div style={{background:'rgba(240,192,96,0.08)', border:'1px solid rgba(240,192,96,0.25)', borderRadius:8, padding:'8px 12px', marginBottom:10, maxHeight:80, overflowY:'auto'}}>
              <div style={{fontSize:'0.68rem', color:'#f0c060', fontWeight:700, marginBottom:3}}>📰 マーケットニュース</div>
              {news.slice(0,5).map((n,i) => <div key={i} style={{fontSize:'0.7rem', color:'#8a92b2', padding:'1px 0'}}>{n}</div>)}
            </div>
          )}
          <div style={{marginBottom:10}}>
            {STOCK_ID_LIST.map(id => {
              const m = STOCK_MASTERS[id];
              const p = getPrice(id);
              const hist = history[id] ?? [];
              const prevPrice = hist.length > 1 ? hist[hist.length-2].price : m.basePrice;
              const change = prevPrice > 0 ? (p - prevPrice) / prevPrice * 100 : 0;
              const isSelected = selectedStock === id;
              const halted = isHalted(id);
              const trendInfo = selectedTrend && id === selectedStock ? getTrendLabel(selectedTrend.trend) : null; void trendInfo;
              const trend = trends[id];
              const tl = trend ? getTrendLabel(trend.trend) : null;
              return (
                <div key={id} onClick={() => { setSelectedStock(id); setStockView('detail'); }}
                  style={{display:'flex', alignItems:'center', gap:8, padding:'7px 10px', marginBottom:3, borderRadius:6, cursor:'pointer',
                    background: halted ? 'rgba(60,20,20,0.7)' : isSelected ? 'rgba(91,141,238,0.15)' : '#1c2235',
                    border:`1px solid ${halted ? '#e05555' : isSelected ? '#5b8dee' : '#2d3752'}`,
                    opacity: halted ? 0.7 : 1}}>
                  <span style={{fontSize:'1.1rem'}}>{m.icon}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:'0.78rem', fontWeight:600, display:'flex', alignItems:'center', gap:4}}>
                      {m.name}
                      <span style={{fontSize:'0.58rem', color:'#4a5070', border:'1px solid #2d3752', borderRadius:3, padding:'0 4px'}}>{SECTOR_LABEL[m.sector]}</span>
                      {halted && <span style={{fontSize:'0.6rem', color:'#e05555', background:'rgba(224,85,85,0.15)', border:'1px solid #e05555', borderRadius:3, padding:'0 4px'}}>🚫 取引停止</span>}
                      {!halted && tl && <span style={{fontSize:'0.6rem', color: tl.color}}>{tl.icon}</span>}
                    </div>
                  </div>
                  <div style={{width:55, height:26, flexShrink:0}}>
                    {renderLineChart(id, true)}
                  </div>
                  <div style={{textAlign:'right', minWidth:72}}>
                    <div style={{fontSize:'0.85rem', fontWeight:700, color: halted ? '#e05555' : '#e8e6ff'}}>{p.toLocaleString()}<span style={{fontSize:'0.65rem',color:'#4a5070'}}>WC</span></div>
                    <div style={{fontSize:'0.68rem', color: change >= 0 ? '#4caf87' : '#e05555'}}>
                      {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ========== 詳細タブ (Yahoo Finance風) ========== */}
      {stockView === 'detail' && (
        <div>
          {/* 銘柄セレクター */}
          <div style={{display:'flex', gap:4, marginBottom:10, flexWrap:'wrap'}}>
            {STOCK_ID_LIST.map(id => (
              <button key={id} onClick={() => setSelectedStock(id)}
                style={{padding:'4px 8px', fontSize:'0.7rem', fontWeight:700,
                  background: selectedStock===id ? 'rgba(91,141,238,0.25)' : '#1c2235',
                  border:`1px solid ${selectedStock===id ? '#5b8dee' : '#2d3752'}`,
                  color: selectedStock===id ? '#e8e6ff' : '#8a92b2', borderRadius:5, cursor:'pointer'}}>
                {STOCK_MASTERS[id].icon}
              </button>
            ))}
          </div>

          {/* ヘッダー */}
          <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'12px 14px', marginBottom:8}}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
              <span style={{fontSize:'1.4rem'}}>{selectedMaster.icon}</span>
              <div>
                <div style={{fontWeight:700, fontSize:'1rem'}}>{selectedMaster.name}</div>
                {isHalted(selectedStock) && (
                  <div style={{fontSize:'0.72rem', color:'#e05555', background:'rgba(224,85,85,0.12)', border:'1px solid rgba(224,85,85,0.4)', borderRadius:4, padding:'2px 8px', display:'inline-block', marginTop:2}}>
                    🚫 本日の取引停止（ストップ高/安）
                  </div>
                )}
              </div>
              <div style={{marginLeft:'auto', textAlign:'right'}}>
                <div style={{fontSize:'1.3rem', fontWeight:700, color:'#e8e6ff'}}>{selectedPrice.toLocaleString()}<span style={{fontSize:'0.75rem', color:'#4a5070'}}>WC</span></div>
                {(() => {
                  const hist = selectedHistory; const prev = hist.length > 1 ? hist[hist.length-2].price : selectedMaster.basePrice;
                  const chg = selectedPrice - prev; const chgPct = prev > 0 ? chg/prev*100 : 0;
                  return <div style={{fontSize:'0.8rem', color: chg >= 0 ? '#4caf87' : '#e05555'}}>{chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toLocaleString()}WC ({Math.abs(chgPct).toFixed(2)}%)</div>;
                })()}
              </div>
            </div>

            {/* チャートトグル */}
            <div style={{display:'flex', gap:6, marginBottom:6}}>
              {(['line','candle'] as const).map(m => (
                <button key={m} onClick={() => setChartMode(m)} style={{padding:'3px 10px', fontSize:'0.7rem', fontWeight:700,
                  background: chartMode===m ? 'rgba(240,192,96,0.2)' : '#161b26',
                  border:`1px solid ${chartMode===m ? '#f0c060' : '#2d3752'}`,
                  color: chartMode===m ? '#f0c060' : '#8a92b2', borderRadius:4, cursor:'pointer'}}>
                  {m === 'line' ? '📈 折れ線' : '🕯️ ローソク足'}
                </button>
              ))}
            </div>

            {/* チャート */}
            <div style={{height:120, background:'#161b26', borderRadius:6, overflow:'hidden', marginBottom:8}}>
              {renderChart(selectedStock, false)}
            </div>

            {/* 価格レンジ */}
            {selectedHistory.length > 1 && (() => {
              const pts = selectedHistory.slice(-60);
              const maxP = Math.max(...pts.map(p => p.price));
              const minP = Math.min(...pts.map(p => p.price));
              return (
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.65rem', color:'#4a5070', marginBottom:8}}>
                  <span>最安: {minP.toLocaleString()}WC</span>
                  <span style={{color:'#f0c060'}}>基準: {selectedMaster.basePrice.toLocaleString()}WC</span>
                  <span>最高: {maxP.toLocaleString()}WC</span>
                </div>
              );
            })()}
          </div>

          {/* アナリシス */}
          {selectedTrend && (() => {
            const tl = getTrendLabel(selectedTrend.trend);
            const vl = getVolatilityLabel(selectedTrend.volatility);
            const stabLabel = selectedTrend.stability > 0.6 ? '安定' : selectedTrend.stability > 0.3 ? '普通' : '不安定';
            const stabColor = selectedTrend.stability > 0.6 ? '#4caf87' : selectedTrend.stability > 0.3 ? '#f0c060' : '#e05555';
            return (
              <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'12px 14px', marginBottom:8}}>
                <div style={{fontWeight:700, fontSize:'0.82rem', marginBottom:8}}>📊 テクニカル分析</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8}}>
                  <div style={{textAlign:'center', background:'#161b26', borderRadius:6, padding:'8px 4px'}}>
                    <div style={{fontSize:'0.65rem', color:'#4a5070', marginBottom:2}}>トレンド</div>
                    <div style={{fontSize:'0.75rem', fontWeight:700, color: tl.color}}>{tl.icon} {tl.label}</div>
                  </div>
                  <div style={{textAlign:'center', background:'#161b26', borderRadius:6, padding:'8px 4px'}}>
                    <div style={{fontSize:'0.65rem', color:'#4a5070', marginBottom:2}}>安定性</div>
                    <div style={{fontSize:'0.85rem', fontWeight:700, color: stabColor}}>{stabLabel}</div>
                  </div>
                  <div style={{textAlign:'center', background:'#161b26', borderRadius:6, padding:'8px 4px'}}>
                    <div style={{fontSize:'0.65rem', color:'#4a5070', marginBottom:2}}>ボラティリティ</div>
                    <div style={{fontSize:'0.85rem', fontWeight:700, color: vl.color}}>{vl.label}</div>
                  </div>
                </div>
                <div style={{fontSize:'0.72rem', color:'#8a92b2', background:'#161b26', borderRadius:6, padding:'6px 10px'}}>
                  {tl.icon} {selectedMaster.name}は現在<span style={{color: tl.color, fontWeight:700}}>{tl.label}</span>。
                  安定性は<span style={{color: stabColor, fontWeight:700}}>{stabLabel}</span>、
                  価格変動は<span style={{color: vl.color, fontWeight:700}}>{vl.label}</span>リスクです。
                  {selectedTrend.consecutiveTicks > 5 && <span style={{color:'#f0c060'}}> ⚠️ 同方向継続中（反転注意）</span>}
                </div>
              </div>
            );
          })()}

          {/* 最新ニュース */}
          {selectedHistory.filter(p => p.news).slice(-5).reverse().length > 0 && (
            <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'10px 14px', marginBottom:8}}>
              <div style={{fontWeight:700, fontSize:'0.82rem', marginBottom:6}}>📰 関連ニュース</div>
              {selectedHistory.filter(p => p.news).slice(-5).reverse().map((p, i) => (
                <div key={i} style={{fontSize:'0.72rem', color:'#8a92b2', padding:'3px 0', borderBottom:'1px solid #1a1f30'}}>
                  <span style={{color:'#4a5070', marginRight:6, fontSize:'0.65rem'}}>{new Date(p.timestamp).toLocaleTimeString('ja-JP', {hour:'2-digit', minute:'2-digit'})}</span>
                  {p.news}
                </div>
              ))}
            </div>
          )}

          {/* 購入UI */}
          <div style={{background:'#1c2235', border:`1px solid ${isHalted(selectedStock) ? '#e05555' : '#2d3752'}`, borderRadius:8, padding:'12px 14px'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#8a92b2', marginBottom:8}}>
              <span>保有: <strong style={{color:'#e8e6ff'}}>{holdings[selectedStock]?.amount ?? 0}株</strong></span>
              {getHoldBonus(selectedStock) > 0 && (
                <span style={{color:'#4caf87'}}>保有ボーナス <strong>+{(getHoldBonus(selectedStock)*100).toFixed(0)}%</strong></span>
              )}
            </div>
            <div style={{display:'flex', gap:6, alignItems:'center'}}>
              <input type="number" min={1} value={buyAmt} onChange={e => setBuyAmt(Math.max(1, parseInt(e.target.value)||1))}
                style={{width:70, padding:'5px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:5, fontSize:'0.8rem'}} />
              <span style={{fontSize:'0.75rem', color:'#8a92b2'}}>株</span>
              <span style={{fontSize:'0.8rem', color:'#4caf87', flex:1}}>{(selectedPrice * buyAmt).toLocaleString()}WC</span>
              <button onClick={handleBuy} disabled={isHalted(selectedStock) || !getMarketStatus(clockNow).isOpen || (player?.wealthCoin ?? 0) < selectedPrice * buyAmt}
                style={{padding:'6px 14px', background: (isHalted(selectedStock) || !getMarketStatus(clockNow).isOpen) ? '#2d3752' : 'linear-gradient(135deg,#4caf87,#2d8060)',
                  color:'#fff', border:'none', borderRadius:6, cursor: (isHalted(selectedStock) || !getMarketStatus(clockNow).isOpen) ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:'0.8rem',
                  opacity: isHalted(selectedStock) || !getMarketStatus(clockNow).isOpen || (player?.wealthCoin ?? 0) < selectedPrice * buyAmt ? 0.5 : 1}}>
                {isHalted(selectedStock) ? '🚫 停止中' : !getMarketStatus(clockNow).isOpen ? '🔴 閉場中' : '📈 購入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== 分析タブ ========== */}
      {stockView === 'analysis' && (
        <div>
          <div style={{fontSize:'0.82rem', color:'#8a92b2', marginBottom:10}}>📊 AIアナリスト推奨（リアルタイム分析）</div>
          {(() => {
            const scored = STOCK_ID_LIST.map(id => {
              const t = trends[id] ?? { trend: 0, volatility: 0.03, stability: 0.5, consecutiveTicks: 0 };
              const hist = history[id] ?? []; void hist;
              const p = getPrice(id);
              const base = STOCK_MASTERS[id].basePrice;
              const fromBase = (p - base) / base;
              const halted = isHalted(id);
              return { id, t, p, fromBase, halted };
            });
            const recommended = scored.filter(s => !s.halted && s.t.trend > 0.01 && s.t.stability > 0.4).sort((a,b) => b.t.trend - a.t.trend).slice(0,3);
            const danger = scored.filter(s => !s.halted && s.t.trend < -0.01).sort((a,b) => a.t.trend - b.t.trend).slice(0,3);
            const gamble = scored.filter(s => !s.halted && s.t.volatility > 0.06).sort((a,b) => b.t.volatility - a.t.volatility).slice(0,3);
            const haltedList = scored.filter(s => s.halted);
            return (
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                <div style={{background:'rgba(76,175,135,0.07)', border:'1px solid rgba(76,175,135,0.3)', borderRadius:8, padding:'10px 14px'}}>
                  <div style={{fontWeight:700, fontSize:'0.82rem', color:'#4caf87', marginBottom:6}}>💎 おすすめ銘柄</div>
                  {recommended.length === 0 && <div style={{fontSize:'0.75rem', color:'#4a5070'}}>現在おすすめなし</div>}
                  {recommended.map(s => {
                    const tl = getTrendLabel(s.t.trend);
                    return (
                      <div key={s.id} onClick={() => { setSelectedStock(s.id); setStockView('detail'); }}
                        style={{display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(76,175,135,0.1)', cursor:'pointer'}}>
                        <span>{STOCK_MASTERS[s.id].icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'0.78rem', fontWeight:600}}>{STOCK_MASTERS[s.id].name}</div>
                          <div style={{fontSize:'0.68rem', color: tl.color}}>{tl.icon} {tl.label}</div>
                        </div>
                        <div style={{textAlign:'right', fontSize:'0.75rem', color:'#e8e6ff'}}>{s.p.toLocaleString()}WC</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{background:'rgba(224,85,85,0.07)', border:'1px solid rgba(224,85,85,0.3)', borderRadius:8, padding:'10px 14px'}}>
                  <div style={{fontWeight:700, fontSize:'0.82rem', color:'#e05555', marginBottom:6}}>⚠️ 危険銘柄</div>
                  {danger.length === 0 && <div style={{fontSize:'0.75rem', color:'#4a5070'}}>現在危険なし</div>}
                  {danger.map(s => {
                    const tl = getTrendLabel(s.t.trend);
                    return (
                      <div key={s.id} onClick={() => { setSelectedStock(s.id); setStockView('detail'); }}
                        style={{display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(224,85,85,0.1)', cursor:'pointer'}}>
                        <span>{STOCK_MASTERS[s.id].icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'0.78rem', fontWeight:600}}>{STOCK_MASTERS[s.id].name}</div>
                          <div style={{fontSize:'0.68rem', color: tl.color}}>{tl.icon} {tl.label}</div>
                        </div>
                        <div style={{textAlign:'right', fontSize:'0.75rem', color:'#e8e6ff'}}>{s.p.toLocaleString()}WC</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{background:'rgba(240,192,96,0.07)', border:'1px solid rgba(240,192,96,0.3)', borderRadius:8, padding:'10px 14px'}}>
                  <div style={{fontWeight:700, fontSize:'0.82rem', color:'#f0c060', marginBottom:6}}>🎲 ギャンブル銘柄（高ボラ）</div>
                  {gamble.length === 0 && <div style={{fontSize:'0.75rem', color:'#4a5070'}}>現在なし</div>}
                  {gamble.map(s => {
                    const vl = getVolatilityLabel(s.t.volatility);
                    return (
                      <div key={s.id} onClick={() => { setSelectedStock(s.id); setStockView('detail'); }}
                        style={{display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(240,192,96,0.1)', cursor:'pointer'}}>
                        <span>{STOCK_MASTERS[s.id].icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'0.78rem', fontWeight:600}}>{STOCK_MASTERS[s.id].name}</div>
                          <div style={{fontSize:'0.68rem', color: vl.color}}>ボラ {vl.label}</div>
                        </div>
                        <div style={{textAlign:'right', fontSize:'0.75rem', color:'#e8e6ff'}}>{s.p.toLocaleString()}WC</div>
                      </div>
                    );
                  })}
                </div>
                {haltedList.length > 0 && (
                  <div style={{background:'rgba(60,20,20,0.5)', border:'1px solid rgba(224,85,85,0.4)', borderRadius:8, padding:'10px 14px'}}>
                    <div style={{fontWeight:700, fontSize:'0.82rem', color:'#e05555', marginBottom:6}}>🚫 本日取引停止</div>
                    {haltedList.map(s => (
                      <div key={s.id} style={{display:'flex', alignItems:'center', gap:6, fontSize:'0.75rem', padding:'3px 0'}}>
                        <span>{STOCK_MASTERS[s.id].icon}</span><span>{STOCK_MASTERS[s.id].name}</span>
                        <span style={{color:'#e05555', marginLeft:'auto'}}>ストップ高/安</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========== 保有タブ ========== */}
      {stockView === 'portfolio' && (
        <div>
          <div style={{fontSize:'0.82rem', color:'#8a92b2', marginBottom:10}}>保有株式の一覧と資産状況です</div>

          {portfolioRows.length === 0 ? (
            <p style={{color:'#4a5070', textAlign:'center', padding:20}}>保有株式がありません</p>
          ) : (
            <>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:8, marginBottom:10}}>
                <div style={{background:'linear-gradient(135deg, rgba(91,141,238,0.18), rgba(91,141,238,0.08))', border:'1px solid #2d3752', borderRadius:10, padding:'10px 12px'}}>
                  <div style={{fontSize:'0.7rem', color:'#8a92b2'}}>総評価額</div>
                  <div style={{fontSize:'1.05rem', fontWeight:800, color:'#e8e6ff'}}>{portfolioSummary.totalValue.toLocaleString()}WC</div>
                  <div style={{fontSize:'0.72rem', color: portfolioSummary.totalProfit >= 0 ? '#4caf87' : '#e05555'}}>
                    {portfolioSummary.totalProfit >= 0 ? '+' : ''}{portfolioSummary.totalProfit.toLocaleString()}WC / {portfolioSummary.totalProfitRate >= 0 ? '+' : ''}{(portfolioSummary.totalProfitRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{background:'linear-gradient(135deg, rgba(240,192,96,0.15), rgba(240,192,96,0.06))', border:'1px solid #2d3752', borderRadius:10, padding:'10px 12px'}}>
                  <div style={{fontSize:'0.7rem', color:'#8a92b2'}}>総取得額 / 保有株数</div>
                  <div style={{fontSize:'1.05rem', fontWeight:800, color:'#e8e6ff'}}>{portfolioSummary.totalCost.toLocaleString()}WC</div>
                  <div style={{fontSize:'0.72rem', color:'#8a92b2'}}>{portfolioSummary.totalShares.toLocaleString()}株 / {portfolioSummary.winningCount}勝 {portfolioSummary.losingCount}敗</div>
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:8, marginBottom:12}}>
                {([
                  ['tech', 'テック'], ['industry', '工業'], ['finance', '金融'], ['consumer', '消費財'], ['entertainment', '娯楽'], ['energy', 'エネルギー'],
                ] as const).map(([sector, label]) => {
                  const value = portfolioSummary.sectorValue[sector] ?? 0;
                  const ratio = portfolioSummary.totalValue > 0 ? value / portfolioSummary.totalValue : 0;
                  return (
                    <div key={sector} style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'8px 10px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'#8a92b2'}}>
                        <span>{label}</span><span>{(ratio * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{height:6, background:'#0f1320', borderRadius:999, overflow:'hidden', marginTop:6}}>
                        <div style={{width:`${Math.max(3, ratio * 100)}%`, height:'100%', background:'linear-gradient(90deg, #5b8dee, #4caf87)'}} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:8, marginBottom:12}}>
                <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'8px 10px'}}>
                  <div style={{fontSize:'0.7rem', color:'#8a92b2'}}>最大保有銘柄</div>
                  <div style={{fontWeight:700, color:'#e8e6ff'}}>{portfolioSummary.largest ? `${portfolioSummary.largest.icon} ${portfolioSummary.largest.name}` : '—'}</div>
                </div>
                <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'8px 10px'}}>
                  <div style={{fontSize:'0.7rem', color:'#8a92b2'}}>最大含み益</div>
                  <div style={{fontWeight:700, color:'#4caf87'}}>{portfolioSummary.topGain ? `${portfolioSummary.topGain.icon} ${portfolioSummary.topGain.name}` : '—'}</div>
                </div>
                <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'8px 10px'}}>
                  <div style={{fontSize:'0.7rem', color:'#8a92b2'}}>最大含み損</div>
                  <div style={{fontWeight:700, color:'#e05555'}}>{portfolioSummary.topLoss ? `${portfolioSummary.topLoss.icon} ${portfolioSummary.topLoss.name}` : '—'}</div>
                </div>
              </div>

              <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:12}}>
                <div style={{padding:'6px 10px', background:'rgba(76,175,135,0.1)', border:'1px solid rgba(76,175,135,0.25)', borderRadius:999, fontSize:'0.75rem', color:'#bff2d6'}}>
                  含み損益 {portfolioSummary.totalProfit >= 0 ? '+' : ''}{portfolioSummary.totalProfit.toLocaleString()}WC
                </div>
                <div style={{padding:'6px 10px', background:'rgba(91,141,238,0.1)', border:'1px solid rgba(91,141,238,0.25)', borderRadius:999, fontSize:'0.75rem', color:'#d8e4ff'}}>
                  前日比は各銘柄カードで確認できます
                </div>
                <div style={{padding:'6px 10px', background:'rgba(240,192,96,0.1)', border:'1px solid rgba(240,192,96,0.25)', borderRadius:999, fontSize:'0.75rem', color:'#fff0c4'}}>
                  保有ボーナスは売却時評価に反映
                </div>
              </div>

              {portfolioRows.map((row) => (
                <div key={row.id} style={{background: row.halted ? 'rgba(60,20,20,0.6)' : '#1c2235', border:`1px solid ${row.halted ? '#e05555' : '#2d3752'}`, borderRadius:10, padding:'12px 14px', marginBottom:8}}>
                  <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap'}}>
                    <span>{row.icon}</span>
                    <span style={{fontWeight:700, fontSize:'0.88rem'}}>{row.name}</span>
                    <span style={{fontSize:'0.62rem', color:'#8a92b2', border:'1px solid #2d3752', borderRadius:4, padding:'1px 5px'}}>{SECTOR_LABEL[row.sector]}</span>
                    {row.halted && <span style={{fontSize:'0.6rem', color:'#e05555', border:'1px solid #e05555', borderRadius:3, padding:'0 4px'}}>🚫 停止</span>}
                    <span style={{marginLeft:'auto', fontSize:'0.78rem', color:'#8a92b2'}}>{row.amount}株 / 構成比 {(row.weight * 100).toFixed(1)}%</span>
                  </div>

                  <div style={{height:40, marginBottom:6, background:'#161b26', borderRadius:4, overflow:'hidden'}}>
                    {renderLineChart(row.id, true)}
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:6, fontSize:'0.76rem', marginBottom:6}}>
                    <span style={{color:'#8a92b2'}}>取得均価: {row.avgBuyPrice.toLocaleString()}WC</span>
                    <span style={{color:'#e8e6ff'}}>現在値: {row.currentPrice.toLocaleString()}WC</span>
                    <span style={{color:'#8a92b2'}}>評価額: {row.totalValue.toLocaleString()}WC</span>
                    <span style={{color: row.dayChangeRate >= 0 ? '#4caf87' : '#e05555'}}>前日比: {row.dayChangeRate >= 0 ? '+' : ''}{(row.dayChangeRate * 100).toFixed(1)}%</span>
                    <span style={{color:'#8a92b2'}}>保有ボーナス: +{(row.bonus * 100).toFixed(0)}%</span>
                    <span style={{color:'#8a92b2'}}>時価/取得比: {(row.currentPrice / Math.max(1, row.avgBuyPrice) * 100).toFixed(1)}%</span>
                  </div>

                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap'}}>
                    <span style={{fontSize:'0.82rem', fontWeight:700, color: row.profit >= 0 ? '#4caf87' : '#e05555'}}>
                      {row.profit >= 0 ? '+' : ''}{row.profit.toLocaleString()}WC
                    </span>
                    <span style={{fontSize:'0.72rem', color:'#8a92b2'}}>
                      含み損益率 {row.profitRate >= 0 ? '+' : ''}{(row.profitRate * 100).toFixed(1)}%
                    </span>
                    <button onClick={() => handleSell(row.id)}
                      style={{padding:'5px 12px', background:'linear-gradient(135deg,#e05555,#c03030)',
                        color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontSize:'0.78rem', fontWeight:700}}>
                      📉 全売却
                    </button>
                  </div>
                </div>
              ))}

              <div style={{marginTop:12, padding:'10px 14px', background:'rgba(91,141,238,0.07)', border:'1px solid #2d3752', borderRadius:8}}>
                <div style={{fontSize:'0.78rem', color:'#8a92b2'}}>累計投資利益: <strong style={{color:'#f0c060'}}>{(player?.totalStockProfit ?? 0).toLocaleString()}WC</strong></div>
                <div style={{fontSize:'0.72rem', color:'#6e7696', marginTop:4}}>
                  総評価額 {portfolioSummary.totalValue.toLocaleString()}WC / 総取得額 {portfolioSummary.totalCost.toLocaleString()}WC
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========== ランキングタブ ========== */}
      {stockView === 'ranking' && (
        <div>
          <div style={{display:'flex', gap:6, marginBottom:10}}>
            {[{id:'profit' as const, label:'投資利益'},{id:'assets' as const, label:'株資産'}].map(t => (
              <button key={t.id} onClick={() => setRankTab(t.id)}
                style={{flex:1, padding:'6px', fontSize:'0.75rem', background: rankTab===t.id ? 'rgba(91,141,238,0.2)' : '#1c2235',
                  border:`1px solid ${rankTab===t.id ? '#5b8dee' : '#2d3752'}`, color: rankTab===t.id ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer'}}>
                {t.label}
              </button>
            ))}
          </div>
          {stockRanking.length === 0 && <p style={{color:'#4a5070', textAlign:'center', padding:20}}>データなし</p>}
          {[...stockRanking].sort((a,b) => rankTab==='profit' ? b.totalProfit-a.totalProfit : b.totalAssets-a.totalAssets).slice(0,10).map((e,i) => (
            <div key={e.uid} style={{display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, marginBottom:4}}>
              <span style={{color: i===0?'#f0c060':i===1?'#8a92b2':i===2?'#cd7f32':'#4a5070', width:20, fontSize:'0.8rem'}}>{i+1}.</span>
              <span style={{flex:1, fontSize:'0.85rem'}}>{e.displayName}</span>
              <span style={{fontSize:'0.78rem', color:'#4caf87'}}>
                {rankTab==='profit' ? `${e.totalProfit.toLocaleString()}WC` : `${e.totalAssets.toLocaleString()}WC`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


type MainTab = 'home' | 'gamble' | 'rank' | 'mission' | 'ranking' | 'exchange' | 'spectate' | 'stock';

// ============================================================
// デイリーカジノ設定
// ============================================================
const DAILY_CASINO_GAMES = [
  { id: 'chohan',    label: '丁半',       icon: '🎲', bonus: 1.3 },
  { id: 'chinchiro', label: 'チンチロ',   icon: '🎲', bonus: 1.3 },
  { id: 'coin_flip', label: 'コイン',     icon: '🪙', bonus: 1.3 },
  { id: 'slot',      label: 'スロット',   icon: '🎰', bonus: 1.3 },
  { id: 'poker',     label: 'ポーカー',   icon: '🃏', bonus: 1.3 },
  { id: 'mines',     label: 'ミニマイン', icon: '⛏️', bonus: 1.3 },
  { id: 'dice_race', label: 'ダイスレース', icon: '🎲', bonus: 1.3 },
  { id: 'roulette',  label: 'ルーレット', icon: '🎡', bonus: 1.3 },
  { id: 'blackjack', label: 'ブラックジャック', icon: '🃏', bonus: 1.3 },
  { id: 'scratch',   label: 'スクラッチ', icon: '🎫', bonus: 1.3 },
  { id: 'race',      label: 'ミニレース', icon: '🐎', bonus: 1.3 },
];

function getDailyCasino(): { id: string; label: string; icon: string; bonus: number } {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth()+1) * 100 + now.getDate();
  return DAILY_CASINO_GAMES[seed % DAILY_CASINO_GAMES.length];
}

// ============================================================
// イベント設定（偶数日 12:00〜13:00 のみ）
// ============================================================
interface DailyEvent {
  name: string;
  emoji: string;
  effect: string;
  gameId: string;
  bonusType: 'multiplier' | 'rare' | 'jackpot';
  bonusValue: number;
}

const DAILY_EVENTS: DailyEvent[] = [
  { name: 'スロットフェス',       emoji: '🎰', effect: '配当+10%',    gameId: 'slot',      bonusType: 'multiplier', bonusValue: 1.1 },
  { name: '丁半祭',               emoji: '🎲', effect: '配当+10%',    gameId: 'chohan',    bonusType: 'multiplier', bonusValue: 1.1 },
  { name: 'ジャックポット祭',     emoji: '🌟', effect: 'JP率1.5倍',   gameId: 'all',       bonusType: 'jackpot',    bonusValue: 1.5 },
  { name: 'チンチロ祭',           emoji: '🎯', effect: '配当+10%',    gameId: 'chinchiro', bonusType: 'multiplier', bonusValue: 1.1 },
  { name: 'ポーカー祭',           emoji: '🃏', effect: '配当+10%',    gameId: 'poker',     bonusType: 'multiplier', bonusValue: 1.1 },
  { name: 'レア率フェス',         emoji: '💎', effect: 'レア率1.3倍', gameId: 'treasure_box_silver', bonusType: 'rare', bonusValue: 1.3 },
  { name: 'マイン祭',             emoji: '⛏️', effect: '配当+10%',    gameId: 'mines',     bonusType: 'multiplier', bonusValue: 1.1 },
  { name: 'ダイスレース祭',       emoji: '🎲', effect: '配当+10%',    gameId: 'dice_race', bonusType: 'multiplier', bonusValue: 1.1 },
  { name: 'ルーレットフェス',     emoji: '🎡', effect: '配当+10%',    gameId: 'roulette',  bonusType: 'multiplier', bonusValue: 1.1 },
  { name: 'ブラックジャック祭',   emoji: '🃏', effect: '配当+10%',    gameId: 'blackjack', bonusType: 'multiplier', bonusValue: 1.1 },
  { name: 'スクラッチフェス',     emoji: '🎫', effect: '配当+10%',    gameId: 'scratch',   bonusType: 'multiplier', bonusValue: 1.1 },
  { name: 'レース祭',             emoji: '🐎', effect: '配当+10%',    gameId: 'race',      bonusType: 'multiplier', bonusValue: 1.1 },
];

function getActiveEvent(): DailyEvent | null {
  const now = new Date();
  const day = now.getDate();
  const hour = now.getHours();
  // 偶数日 12:00〜13:00 のみ
  if (day % 2 !== 0) return null;
  if (hour !== 12) return null;
  const seed = now.getFullYear() * 10000 + (now.getMonth()+1) * 100 + day;
  return DAILY_EVENTS[seed % DAILY_EVENTS.length];
}

// ============================================================
// ランキングパネル
// ============================================================
function GambleRankingPanel() {
  const [entries, setEntries] = useState<GambleRankingEntry[]>([]);
  const [rankTab, setRankTab] = useState<'weekly' | 'monthly' | 'total'>('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const player = useGameStore(s => s.player);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsub = subscribeGambleRanking((data) => {
      setEntries(data);
      setLoading(false);
    });
    // timeout fallback: if still loading after 8s, show error
    const timer = setTimeout(() => {
      setLoading(prev => { if (prev) setError('ランキングデータの読み込みに失敗しました。Firestoreインデックスが必要な場合があります。'); return false; });
    }, 8000);
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (rankTab === 'weekly') return (b.weeklyWon ?? 0) - (a.weeklyWon ?? 0);
    if (rankTab === 'monthly') return (b.monthlyWon ?? 0) - (a.monthlyWon ?? 0);
    return (b.totalWon ?? 0) - (a.totalWon ?? 0);
  });

  const getValue = (e: GambleRankingEntry) => {
    if (rankTab === 'weekly') return e.weeklyWon ?? 0;
    if (rankTab === 'monthly') return e.monthlyWon ?? 0;
    return e.totalWon ?? 0;
  };

  const titleByRank: Record<number, string> = { 0: '👑 今週の賭博王', 1: '🥈 ギャンブルキング', 2: '🥉 3位' };
  const monthTitles: Record<number, string> = { 0: '👑 月間ギャンブルキング', 1: '🥈 月間2位', 2: '🥉 月間3位' };

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['weekly','monthly','total'] as const).map(t => (
          <button key={t} onClick={() => setRankTab(t)}
            style={{ flex: 1, padding: '7px 0', fontSize: '0.75rem', fontWeight: 700,
              background: rankTab === t ? 'rgba(240,192,96,0.2)' : '#1c2235',
              border: `1px solid ${rankTab === t ? '#f0c060' : '#2d3752'}`,
              color: rankTab === t ? '#f0c060' : '#8a92b2', borderRadius: 6, cursor: 'pointer' }}>
            {t === 'weekly' ? '📅 週間' : t === 'monthly' ? '📆 月間' : '🏆 総合'}
          </button>
        ))}
      </div>

      {/* 称号表示 */}
      {sorted.slice(0, 3).map((e, i) => {
        const title = rankTab === 'weekly' ? titleByRank[i] : rankTab === 'monthly' ? monthTitles[i] : `🏆 総合${i+1}位`;
        return (
          <div key={e.uid} style={{ background: i === 0 ? 'rgba(240,192,96,0.12)' : '#1c2235', border: `2px solid ${i === 0 ? '#f0c060' : i === 1 ? '#8a92b2' : '#cd7f32'}`, borderRadius: 10, padding: '12px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e8e6ff' }}>{e.displayName}</div>
                <div style={{ fontSize: '0.7rem', color: '#f0c060', marginTop: 2 }}>{title}</div>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0c060' }}>{getValue(e).toLocaleString()}WC</div>
            </div>
          </div>
        );
      })}

      {sorted.length > 3 && (
        <div style={{ marginTop: 4 }}>
          {sorted.slice(3).map((e, i) => (
            <div key={e.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: e.uid === player?.uid ? 'rgba(91,141,238,0.1)' : '#161b26', border: `1px solid ${e.uid === player?.uid ? '#5b8dee' : '#2d3752'}`, borderRadius: 6, marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', color: '#8a92b2' }}>{i+4}位 {e.displayName}{e.uid === player?.uid ? ' (あなた)' : ''}</span>
              <span style={{ fontSize: '0.78rem', color: '#f0c060', fontWeight: 700 }}>{getValue(e).toLocaleString()}WC</span>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', color: '#8a92b2', fontSize: '0.82rem', padding: '20px 0' }}>
          ⏳ 読み込み中...
        </div>
      )}
      {error && !loading && (
        <div style={{ textAlign: 'center', color: '#e05555', fontSize: '0.78rem', padding: '12px', background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: 8 }}>
          ⚠️ {error}
        </div>
      )}
      {!loading && !error && sorted.length === 0 && (
        <div style={{ textAlign: 'center', color: '#4a5070', fontSize: '0.82rem', padding: '20px 0' }}>
          ランキングデータがありません<br/>
          <span style={{ fontSize: '0.72rem' }}>ギャンブルで勝利するとランキングに載ります！</span>
        </div>
      )}
    </div>
  );
}
export function GambleScreen() {
  const player = useGameStore(s => s.player);
  const setPlayer = useGameStore(s => s.setPlayer);
  const [activeGame, setActiveGame] = useState<GameTab>('chohan');
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [bet, setBet] = useState(100);
  const [stats, setStats] = useState<SessionStats>(initStats());
  const [jackpotPool, setJackpotPool] = useState(0);
  const [gambleMultipliers, setGambleMultipliers] = useState<Record<string, number>>({});
  const [pokerBetLocked, setPokerBetLocked] = useState(false);
  const [coinFlipBetLocked, setCoinFlipBetLocked] = useState(false);
  const [chohanBetLocked, setChohanBetLocked] = useState(false);
  const [chinchiroBetLocked, setChinchiroBetLocked] = useState(false);
  const [highlowBetLocked, setHighlowBetLocked] = useState(false);
  const [slotBetLocked, setSlotBetLocked] = useState(false);
  const [minesBetLocked, setMinesBetLocked] = useState(false);
  const [diceRaceBetLocked, setDiceRaceBetLocked] = useState(false);
  const [rouletteBetLocked, setRouletteBetLocked] = useState(false);
  const [blackjackBetLocked, setBlackjackBetLocked] = useState(false);
  const [scratchBetLocked, setScratchBetLocked] = useState(false);
  const [raceBetLocked, setRaceBetLocked] = useState(false);
  const [treasureBoxBetLocked, setTreasureBoxBetLocked] = useState(false);
  const isGambling = pokerBetLocked || coinFlipBetLocked || chohanBetLocked || chinchiroBetLocked || highlowBetLocked || slotBetLocked || minesBetLocked || diceRaceBetLocked || rouletteBetLocked || blackjackBetLocked || scratchBetLocked || raceBetLocked || treasureBoxBetLocked;
  const [ticketActive, setTicketActive] = useState(false);
  const [_treasureProbs, setTreasureProbs] = useState<TreasureProbEntry[] | null>(null);
  const [activeEvent, setActiveEvent] = useState<ReturnType<typeof getActiveEvent>>(null);
  const [dailyCasino] = useState(getDailyCasino);

  // イベント判定（毎分更新）
  useEffect(() => {
    setActiveEvent(getActiveEvent());
    const t = setInterval(() => setActiveEvent(getActiveEvent()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = subscribeTreasureProbs(setTreasureProbs);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeJackpotPool(setJackpotPool);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeGambleMultipliers(setGambleMultipliers);
    return unsub;
  }, []);

  const handleResult = (r: GambleResult) => {
    // チケット消費（1ゲーム後）
    if (ticketActive && player) {
      const latestForTicket = useGameStore.getState().player ?? player;
      const cur = latestForTicket.inventory?.['gacha_multiplier_ticket'] ?? 0;
      if (cur > 0) {
        setPlayer({ ...latestForTicket, inventory: { ...latestForTicket.inventory, gacha_multiplier_ticket: cur - 1 } });
      }
      setTicketActive(false);
    }
    // ランキング用WC集計
    if (player && r.goldDelta > 0) {
      updateGambleRanking(player.uid, player.displayName, r.goldDelta).catch(() => {});
    }
    // 累計賭け額・ミッション進捗更新
    if (player && activeGame !== 'highlow') {
      const latest = useGameStore.getState().player ?? player;
      const isWin = r.goldDelta >= 0;
      const mp = ensureMissionProgress(latest.missionProgress);
      const inc = (k: keyof typeof mp) => { (mp as unknown as Record<string,number>)[k as string] = ((mp as unknown as Record<string,number>)[k as string] ?? 0) + 1; };
      mp.totalWagered = (mp.totalWagered ?? 0) + bet;
      mp.dailyGamblePlays = (mp.dailyGamblePlays ?? 0) + 1;
      mp.weeklyGamblePlays = (mp.weeklyGamblePlays ?? 0) + 1;
      mp.maxSingleBet = Math.max(mp.maxSingleBet ?? 0, bet);
      if (isWin) {
        mp.totalWinCount = (mp.totalWinCount ?? 0) + 1;
        mp.totalWinAmount = (mp.totalWinAmount ?? 0) + r.goldDelta;
        mp.maxSingleWin = Math.max(mp.maxSingleWin ?? 0, r.goldDelta);
      } else {
        mp.totalLoseCount = (mp.totalLoseCount ?? 0) + 1;
      }
      if (activeGame === 'slot') { inc('totalSlotPlays'); inc('dailySlotPlays'); inc('weeklySlotPlays'); }
      if (activeGame === 'chohan') { inc('totalChohanPlays'); if (isWin) { inc('totalChohanWins'); inc('dailyChohanWins'); inc('weeklyChohanWins'); } }
      if (activeGame === 'chinchiro') { inc('totalChinchiroPlays'); if (isWin) { inc('totalChinchiroWins'); inc('dailyChinchiroWins'); inc('weeklyChinchiroWins'); } }
      if (activeGame === 'coin_flip') { inc('totalCoinFlipPlays'); if (isWin) { inc('totalCoinFlipWins'); inc('dailyCoinFlipWins'); } }
      if (activeGame === 'poker') { inc('totalPokerPlays'); if (isWin) { inc('totalPokerWins'); inc('dailyPokerWins'); inc('weeklyPokerWins'); } }
      if (activeGame === 'mines') { inc('totalMinesPlays'); if (isWin) { inc('totalMinesWins'); inc('dailyMinesWins'); inc('weeklyMinesWins'); } }
      if (activeGame === 'dice_race') { inc('totalDiceRacePlays'); if (isWin) { inc('totalDiceRaceWins'); inc('dailyDiceRaceWins'); inc('weeklyDiceRaceWins'); } }
      if (activeGame === 'roulette') { inc('totalRoulettePlays'); if (isWin) { inc('totalRouletteWins'); inc('dailyRouletteWins'); inc('weeklyRouletteWins'); } }
      if (activeGame === 'blackjack') { inc('totalBlackjackPlays'); if (isWin) { inc('totalBlackjackWins'); inc('dailyBlackjackWins'); inc('weeklyBlackjackWins'); } }
      if (activeGame === 'scratch') { inc('totalScratchPlays'); if (isWin) { inc('totalScratchWins'); inc('dailyScratchWins'); inc('weeklyScratchWins'); } }
      if (activeGame === 'race') { inc('totalRacePlays'); if (isWin) { inc('totalRaceWins'); inc('dailyRaceWins'); inc('weeklyRaceWins'); } }
      if (r.rewardLabel?.includes('JACKPOT') || r.rewardLabel?.includes('ジャックポット')) { inc('totalJackpotWins'); }
      // achievement auto-complete check
      const newCompleted = [...mp.completedMissions];
      for (const m of MISSION_DEFS.filter(x => x.type === 'achievement')) {
        if (newCompleted.includes(m.id)) continue;
        const val = (mp as unknown as Record<string,number>)[m.statKey] ?? 0;
        if (val >= m.target) newCompleted.push(m.id);
      }
      mp.completedMissions = newCompleted;
      const newWagered = (latest.totalWagered ?? 0) + bet;
      setPlayer({ ...latest, totalWagered: newWagered, missionProgress: mp });
    }
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

  const handleHighlowMissionUpdate = (won: boolean, streak: number) => {
    if (!player) return;
    const latest = useGameStore.getState().player ?? player;
    const mp = ensureMissionProgress(latest.missionProgress);
    inc('totalHighlowPlays')(mp);
    if (won) {
      mp.totalHighlowWins = (mp.totalHighlowWins ?? 0) + 1;
      mp.dailyHighlowWins = (mp.dailyHighlowWins ?? 0) + 1;
      mp.totalHighlowMaxStreak = Math.max(mp.totalHighlowMaxStreak ?? 0, streak);
      mp.weeklyHighlowMaxStreak = Math.max(mp.weeklyHighlowMaxStreak ?? 0, streak);
      mp.maxHighlowStreak = Math.max(mp.maxHighlowStreak ?? 0, streak);
      mp.totalWinCount = (mp.totalWinCount ?? 0) + 1;
    } else {
      mp.totalLoseCount = (mp.totalLoseCount ?? 0) + 1;
    }
    // achievement check
    const newCompleted = [...mp.completedMissions];
    for (const m of MISSION_DEFS.filter(x => x.type === 'achievement')) {
      if (newCompleted.includes(m.id)) continue;
      const val = (mp as unknown as Record<string,number>)[m.statKey] ?? 0;
      if (val >= m.target) newCompleted.push(m.id);
    }
    mp.completedMissions = newCompleted;
    setPlayer({ ...latest, missionProgress: mp });
  };

  function inc(k: string) {
    return (mp: ReturnType<typeof ensureMissionProgress>) => {
      (mp as unknown as Record<string,number>)[k] = ((mp as unknown as Record<string,number>)[k] ?? 0) + 1;
    };
  }

  const handleJackpotContrib = async (betAmt: number) => {
    try { await contributeToJackpot(betAmt); } catch { /* ignore */ }
  };

  if (!player) return null;
  const gameMasterKey = activeGame === 'slot' ? 'slot_machine' : activeGame === 'treasure_box' ? 'treasure_box_silver' : activeGame === 'pvp' ? 'chohan' : activeGame;
  const game = GAMBLE_MASTER[gameMasterKey] ?? GAMBLE_MASTER['chohan'];
  const netProfit = stats.totalWon - stats.totalBet;
  const gambleRankInfo = getGambleRank(player.totalWagered ?? 0);

  const isMobile = useIsMobile();

  return (
    <div className="gamble-shell" style={{ padding: isMobile ? '10px 8px 18px' : '12px 8px' }}>
      <style>{GAMBLE_UI_CSS}</style>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 className="gamble-main-title" style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', marginBottom: 8, borderBottom: '1px solid #2d3752', paddingBottom: 8 }}>🎰 ギャンブル</h2>

        {/* G/WC残高表示 */}
        <div className="gamble-card gamble-balance" style={{ display: 'flex', gap: 8, marginBottom: 10, background: 'linear-gradient(135deg, rgba(28,34,53,0.95), rgba(22,27,38,0.95))', border: '1px solid #2d3752', borderRadius: 8, padding: '8px 12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#8a92b2' }}>💰 <span style={{ color: '#f0c060', fontWeight: 700 }}>{player.gold.toLocaleString()}G</span></span>
        <span style={{ color: '#2d3752' }}>|</span>
        <span style={{ fontSize: '0.85rem', color: '#8a92b2' }}>🪙 WC: <span style={{ color: '#4caf87', fontWeight: 700 }}>{(player.wealthCoin ?? 0).toLocaleString()}WC</span></span>
        <span style={{ color: '#2d3752' }}>|</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: gambleRankInfo.color }}>🏅 {gambleRankInfo.name}</span>
      </div>

      {/* メインタブ */}
      <div className="gamble-tabbar gamble-mainTabs" style={{ marginBottom: 12 }}>
        {([
          ['home','🏠','ホーム'],
          ['gamble','🎲','ゲーム'],
          ['rank','🏅','ランク'],
          ['mission','📋','任務'],
          ['ranking','🏆','順位'],
          ['exchange','🔄','両替'],
          ['spectate','📺','観戦'],
          ['stock','📈','株式'],
        ] as [MainTab, string, string][]).map(([id, icon, name]) => (
          <button key={id} onClick={() => setMainTab(id)}
            className={mainTab === id ? 'gamble-active' : ''}
            style={{ flexShrink: 0, padding: '6px 7px', fontSize: '0.68rem', fontWeight: 700, background: mainTab === id ? 'linear-gradient(135deg, rgba(91,141,238,0.30), rgba(91,141,238,0.16))' : '#1c2235', border: `1px solid ${mainTab === id ? '#5b8dee' : '#2d3752'}`, color: mainTab === id ? '#e8e6ff' : '#8a92b2', borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, boxShadow: mainTab === id ? '0 10px 24px rgba(91,141,238,0.22)' : 'none' }}>
            <span style={{fontSize:'0.9rem'}}>{icon}</span>
            <span>{name}</span>
          </button>
        ))}
      </div>

      {mainTab === 'exchange' && <ExchangePanel />}
      {mainTab === 'stock' && <StockMarketPanel />}
      {mainTab === 'ranking' && <GambleRankingPanel />}
      {mainTab === 'spectate' && <SpectatePanel />}
      {mainTab === 'rank' && <RankPanel />}
      {mainTab === 'mission' && <MissionPanel />}
      {mainTab === 'home' && (
        <div>
          {/* デイリーカジノ */}
          <div style={{ background: 'linear-gradient(135deg,rgba(240,192,96,0.12),rgba(240,168,48,0.08))', border: '2px solid #f0c060', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
            <div style={{ fontSize: '0.75rem', color: '#f0c060', fontWeight: 700, marginBottom: 6 }}>🎰 本日のラッキーギャンブル</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '2.5rem' }}>{dailyCasino.icon}</span>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e8e6ff' }}>{dailyCasino.label}</div>
                <div style={{ fontSize: '0.82rem', color: '#4caf87', fontWeight: 700 }}>配当{dailyCasino.bonus}倍</div>
              </div>
              <button onClick={() => { setActiveGame(dailyCasino.id as GameTab); setMainTab('gamble'); }}
                style={{ marginLeft: 'auto', padding: '8px 16px', background: 'linear-gradient(135deg,#f0c060,#c08020)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                プレイ →
              </button>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#4a5070', marginTop: 6 }}>毎日0時に更新</div>
          </div>

          {/* イベント */}
          {activeEvent ? (
            <div style={{ background: 'linear-gradient(135deg,rgba(224,96,224,0.12),rgba(91,141,238,0.08))', border: '2px solid #e060e0', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
              <div style={{ fontSize: '0.72rem', color: '#e060e0', fontWeight: 700, marginBottom: 6 }}>🎉 開催中イベント（偶数日 12:00〜13:00）</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '2rem' }}>{activeEvent.emoji}</span>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e8e6ff' }}>{activeEvent.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#e060e0', fontWeight: 700 }}>{activeEvent.effect}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: '12px', marginBottom: 14 }}>
              <div style={{ fontSize: '0.75rem', color: '#4a5070', marginBottom: 4 }}>🎉 イベント</div>
              <div style={{ fontSize: '0.82rem', color: '#8a92b2' }}>次のイベントは偶数日の 12:00〜13:00 に開催</div>
              <div style={{ fontSize: '0.7rem', color: '#4a5070', marginTop: 4 }}>スロットフェス・丁半祭・ジャックポット祭など</div>
            </div>
          )}

          {/* ジャックポットプール表示 */}
          <JackpotBanner pool={jackpotPool} />

          {/* ランキングTop3 */}
          <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: '12px', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f0c060', marginBottom: 8 }}>🏆 今週のランキング（プレビュー）</div>
            <button onClick={() => setMainTab('ranking')} style={{ width: '100%', padding: '6px', background: 'rgba(240,192,96,0.1)', border: '1px solid #f0c060', borderRadius: 6, color: '#f0c060', cursor: 'pointer', fontSize: '0.78rem' }}>
              ランキング全体を見る →
            </button>
          </div>

          {/* ミッション・ランクへのナビ */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMainTab('gamble')} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#5b8dee,#3a6fd0)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
              🎲 ギャンブルへ
            </button>
            <button onClick={() => setMainTab('exchange')} style={{ flex: 1, padding: '10px', background: 'rgba(76,175,135,0.2)', color: '#4caf87', border: '1px solid #4caf87', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
              🔄 交換所
            </button>
          </div>
        </div>
      )}
      {mainTab === 'gamble' && <>

      <JackpotBanner pool={jackpotPool} />

      {/* ギャンブル倍率2倍チケット */}
      {(() => {
        const ticketCount = player.inventory?.['gacha_multiplier_ticket'] ?? 0;
        return ticketCount > 0 || ticketActive ? (
          <div style={{ background: ticketActive ? 'rgba(255,200,0,0.12)' : '#1c2235', border: `1px solid ${ticketActive ? '#f0c060' : '#2d3752'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: ticketActive ? '#f0c060' : '#8a92b2' }}>
              🎫 倍率2倍チケット: {ticketCount}枚
              {ticketActive && <span style={{ color: '#f0c060', fontWeight: 700 }}> ▶ 次の1ゲームに適用中！</span>}
            </span>
            <button onClick={() => {
              if (!ticketActive && ticketCount > 0) setTicketActive(true);
              else if (ticketActive) setTicketActive(false);
            }}
              disabled={!ticketActive && ticketCount < 1}
              style={{ padding: '4px 10px', fontSize: '0.75rem', background: ticketActive ? '#e05555' : '#3a5070', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              {ticketActive ? 'キャンセル' : '使用する'}
            </button>
          </div>
        ) : null;
      })()}

      {stats.gamesPlayed > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.75rem' }}>
          <span style={{ color: '#4a5070' }}>収支:</span>
          <span style={{ color: netProfit >= 0 ? '#4caf87' : '#e05555', fontWeight: 700 }}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}WC
          </span>
          <span style={{ color: '#8a92b2' }}>{stats.gamesPlayed}戦 {stats.wins}勝</span>
        </div>
      )}

      <div className="gamble-tabbar gamble-gameTabs" style={{ marginBottom: 12 }}>
        {GAME_TABS.map(t => (
          <button key={t.id} onClick={() => !isGambling && setActiveGame(t.id)}
            className={activeGame===t.id ? 'gamble-active' : ''}
            style={{ flexShrink: 0, padding: '6px 10px', fontSize: '0.75rem', background: activeGame===t.id ? 'linear-gradient(135deg, rgba(91,141,238,0.28), rgba(91,141,238,0.16))' : '#1c2235', border: `1px solid ${activeGame===t.id ? '#5b8dee' : '#2d3752'}`, color: activeGame===t.id ? '#e8e6ff' : isGambling ? '#4a5070' : '#8a92b2', borderRadius: 8, cursor: isGambling ? 'not-allowed' : 'pointer', opacity: isGambling && activeGame!==t.id ? 0.5 : 1, boxShadow: activeGame===t.id ? '0 8px 18px rgba(91,141,238,0.18)' : 'none' }}>
            <GameIcon id={t.icon} size={15} style={{marginRight:3}} /> {t.label}
          </button>
        ))}
      </div>

      <div className="gamble-card gamble-panel" style={{ background: 'linear-gradient(180deg, rgba(28,34,53,0.96), rgba(22,27,38,0.96))', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
        {activeGame !== 'pvp' && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', display:'flex', alignItems:'center', gap:6 }}><GameIcon id={game.icon} size={20} /> {game.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginTop: 2 }}>{game.description}</div>
          </div>
        )}
        {activeGame !== 'pvp' && activeGame !== 'treasure_box' && activeGame !== 'highlow' && activeGame !== 'slot' && activeGame !== 'mines' && activeGame !== 'blackjack' && activeGame !== 'scratch' && activeGame !== 'dice_race' && activeGame !== 'roulette' && activeGame !== 'race' && <BetInput game={game} bet={bet} setBet={setBet} disabled={(activeGame === 'poker' && pokerBetLocked) || (activeGame === 'coin_flip' && coinFlipBetLocked) || (activeGame === 'chohan' && chohanBetLocked) || (activeGame === 'chinchiro' && chinchiroBetLocked)} />}
        {(activeGame === 'mines' || activeGame === 'dice_race' || activeGame === 'roulette' || activeGame === 'blackjack' || activeGame === 'scratch' || activeGame === 'race') && <BetInput game={{ minBet: 50, maxBet: 200000 } as GambleMaster} bet={bet} setBet={setBet} disabled={(activeGame === 'mines' && minesBetLocked) || (activeGame === 'dice_race' && diceRaceBetLocked) || (activeGame === 'roulette' && rouletteBetLocked) || (activeGame === 'blackjack' && blackjackBetLocked) || (activeGame === 'scratch' && scratchBetLocked) || (activeGame === 'race' && raceBetLocked)} />}
        {activeGame === 'highlow' && <BetInput game={{ minBet: 100, maxBet: 1000000 } as GambleMaster} bet={bet} setBet={setBet} disabled={highlowBetLocked} />}

        {activeGame === 'chohan'       && <ChohanPanel    bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['chohan'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'chohan' ? dailyCasino.bonus : 1) * (activeEvent?.gameId === 'chohan' ? activeEvent.bonusValue : 1)} onLockChange={setChohanBetLocked} />}
        {activeGame === 'chinchiro'    && <ChinchiroPanel bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['chinchiro'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'chinchiro' ? dailyCasino.bonus : 1) * (activeEvent?.gameId === 'chinchiro' ? activeEvent.bonusValue : 1)} onLockChange={setChinchiroBetLocked} />}
        {activeGame === 'coin_flip'    && <CoinFlipPanel  bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['coin_flip'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'coin_flip' ? dailyCasino.bonus : 1)} onLockChange={setCoinFlipBetLocked} />}
        {activeGame === 'slot'         && <SlotPanel onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['slot_machine'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'slot' ? dailyCasino.bonus : 1) * (activeEvent?.gameId === 'slot' ? activeEvent.bonusValue : 1)} onLockChange={setSlotBetLocked} />}
        {activeGame === 'treasure_box' && <TreasureBoxPanel onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['treasure_box'] ?? 1.0) * (ticketActive ? 2 : 1)} onLockChange={setTreasureBoxBetLocked} />}
        {activeGame === 'poker'        && <PokerPanel    bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['poker'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'poker' ? dailyCasino.bonus : 1) * (activeEvent?.gameId === 'poker' ? activeEvent.bonusValue : 1)} onBetLock={setPokerBetLocked} />}
        {activeGame === 'highlow'      && <HighLowPanel  bet={bet} onResult={handleResult} onMissionUpdate={handleHighlowMissionUpdate} onLockChange={setHighlowBetLocked} />}
        {activeGame === 'mines'        && <MinesPanel     bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['mines'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'mines' ? dailyCasino.bonus : 1) * (activeEvent?.gameId === 'mines' ? activeEvent.bonusValue : 1)} onLockChange={setMinesBetLocked} />}
        {activeGame === 'dice_race'    && <DiceRacePanel  bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['dice_race'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'dice_race' ? dailyCasino.bonus : 1) * (activeEvent?.gameId === 'dice_race' ? activeEvent.bonusValue : 1)} onLockChange={setDiceRaceBetLocked} />}
        {activeGame === 'roulette'     && <RoulettePanel  bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['roulette'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'roulette' ? dailyCasino.bonus : 1) * (activeEvent?.gameId === 'roulette' ? activeEvent.bonusValue : 1)} onLockChange={setRouletteBetLocked} />}
        {activeGame === 'blackjack'    && <BlackjackPanel bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['blackjack'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'blackjack' ? dailyCasino.bonus : 1) * (activeEvent?.gameId === 'blackjack' ? activeEvent.bonusValue : 1)} onLockChange={setBlackjackBetLocked} />}
        {activeGame === 'scratch'      && <ScratchPanel   bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['scratch'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'scratch' ? dailyCasino.bonus : 1) * (activeEvent?.gameId === 'scratch' ? activeEvent.bonusValue : 1)} onLockChange={setScratchBetLocked} />}
        {activeGame === 'race'         && <RacePanel      bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={(gambleMultipliers['race'] ?? 1.0) * (ticketActive ? 2 : 1) * (dailyCasino.id === 'race' ? dailyCasino.bonus : 1) * (activeEvent?.gameId === 'race' ? activeEvent.bonusValue : 1)} onLockChange={setRaceBetLocked} />}
        {activeGame === 'pvp'          && (
          <>
            <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:8 }}>⚔️ PvP対戦</div>
            <BetInput game={GAMBLE_MASTER['chohan']} bet={bet} setBet={setBet} />
            <PvPPanel bet={bet} />
          </>
        )}
        {activeGame === 'texas'        && (
          <>
            <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:8 }}>♠ テキサスホールデム</div>
            <TexasHoldemPanel />
          </>
        )}
      </div>

      {activeGame !== 'pvp' && activeGame !== 'treasure_box' && activeGame !== 'slot' && activeGame !== 'highlow' && activeGame !== 'mines' && activeGame !== 'blackjack' && activeGame !== 'scratch' && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', color: '#8a92b2', fontSize: '0.8rem', padding: '6px 0' }}>📋 {activeGame === 'texas' ? '役の出現確率' : '配当表'}</summary>
          <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 8, padding: 10, marginTop: 6 }}>
            {activeGame === 'texas' && <div style={{ fontSize: '0.7rem', color: '#5b8dee', marginBottom: 6 }}>※勝者がポットを総取りします。倍率はゲーム参加人数により変動。</div>}
            {game.rewardTable.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '3px 0', borderBottom: '1px solid #2d3752', color: '#8a92b2' }}>
                <span>{r.label}</span>
                <span>
                  {activeGame !== 'texas' && <span style={{ color: '#f0c060' }}>{r.multiplier > 0 ? `×${r.multiplier}` : 'ハズレ'}</span>}
                  <span style={{ color: '#4a5070', marginLeft: 8 }}>{(r.probability * 100).toFixed(2)}%</span>
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
      </>}
      </div>
    </div>
  );
}
