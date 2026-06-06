// src/components/screens/GambleScreen.tsx
// ジャックポットは他のギャンブルで蓄積する仕様に変更
// PvP対戦機能追加
import { GameIcon } from '../icons';
import { secureRandom } from '../../utils/random';
import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GAMBLE_MASTER, ITEM_MASTER } from '../../data/masters';
import { playChohan, playChinchiro, dealPoker, drawPoker } from '../../systems/minigames';
import {
  contributeToJackpot, checkJackpotWin, subscribeJackpotPool,
  createGambleBattle, subscribeGambleBattles, joinGambleBattle, cancelGambleBattle,
  subscribeGambleMultipliers, subscribeGambleBattle,
  postActivityFeed,
  createPokerTable, subscribePokerTables, subscribePokerTable,
  joinPokerTable, cancelPokerTable, leavePokerTable, startPokerGame, pokerAction,
} from '../../services/multiplayer';
import type { GambleResult, GambleMaster, PokerTable } from '../../types/game';
import type { PokerState } from '../../systems/minigames';
import type { GambleBattle } from '../../types/game';

interface SessionStats {
  totalBet: number; totalWon: number; gamesPlayed: number; wins: number; biggestWin: number; biggestLoss: number;
}
const initStats = (): SessionStats => ({ totalBet: 0, totalWon: 0, gamesPlayed: 0, wins: 0, biggestWin: 0, biggestLoss: 0 });

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
          {result.itemRewards.map(r => <span key={r.itemId} style={{display:'inline-flex',alignItems:'center',gap:3}}><GameIcon id={ITEM_MASTER[r.itemId]?.icon ?? ''} size={14} /> {ITEM_MASTER[r.itemId]?.name} ×{r.amount} </span>)}
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

function rollDice3(): number[] {
  return [Math.floor(secureRandom()*6)+1, Math.floor(secureRandom()*6)+1, Math.floor(secureRandom()*6)+1];
}

const DICE_EMOJI = ['⚀','⚁','⚂','⚃','⚄','⚅'];
const SLOT_SYMBOLS = ['🍒','💎','7️⃣','🍋','🔔','💰','🃏','⭐'];
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

function BattleAnimation({ opponentName, gameName, result, onDone }: {
  opponentName: string;
  gameName: string;
  result: { won: boolean; amount: number };
  onDone: () => void;
}) {
  const GAME_NAMES_JP: Record<string, string> = {
    chohan: '丁半', chinchiro: 'チンチロリン', coin_flip: 'コイントス', slot_machine: 'スロット',
  };
  const gameNameJp = GAME_NAMES_JP[gameName] ?? gameName;

  type Phase = 'dice_roll' | 'choose' | 'chohan_roll' | 'coin_toss' | 'chinchiro_battle' | 'slot_battle' | 'final';
  const [phase, setPhase] = useState<Phase>('dice_roll');

  // 先攻決め
  const [myDice, setMyDice] = useState(0);
  const [oppDice, setOppDice] = useState(0);
  const [diceRolling, setDiceRolling] = useState(true);
  const [isFirst, setIsFirst] = useState(true);
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
  const [chinTurnState, setChinTurnState] = useState<'idle'|'rolling_opp'|'rolling_me'|'checking'|'done'>('idle');

  // スロット
  type SlotLog = { who:'me'|'opp'; symbols:string[]; rank: number; label:string };
  const [slotLogs, setSlotLogs] = useState<SlotLog[]>([]);
  const [slotSpinning, setSlotSpinning] = useState(false);
  const [slotSymbols, setSlotSymbols] = useState<string[]|null>(null);
  const [slotTurn, setSlotTurn] = useState<'me'|'opp'>('me');
  const [slotTurnState, setSlotTurnState] = useState<'idle'|'spinning'|'done'>('idle');

  const overlayStyle: React.CSSProperties = {
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
        const my = Math.floor(secureRandom()*6)+1;
        let opp = Math.floor(secureRandom()*6)+1;
        while (opp === my) opp = Math.floor(secureRandom()*6)+1;
        setMyDice(my); setOppDice(opp);
        setIsFirst(my > opp);
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
      const d1 = Math.floor(secureRandom()*6)+1;
      const d2 = Math.floor(secureRandom()*6)+1;
      const sum = d1+d2;
      const isEven = sum%2===0;
      setChohanDice([d1,d2]);
      setChohanRolling(false);
      const myC = isFirst ? myChoice : (myChoice || 'han');
      // result.wonを優先（サーバー決定）
      const oppC = myC==='cho' ? '半（奇数）' : '丁（偶数）';
      setChohanResult(`🎲 ${d1} ＋ ${d2} ＝ ${sum}（${isEven?'偶数＝丁':'奇数＝半'}）\nあなた:${myC==='cho'?'丁':'半'} / ${opponentName}:${oppC}`);
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
    if (currentIdx >= 6) {
      setCoinPhase('done');
      setTimeout(() => setPhase('final'), 1000);
      return;
    }
    setCoinFlipping(true);
    setCoinFace(null);
    const t = setTimeout(() => {
      const face: 'omote'|'ura' = secureRandom() < 0.5 ? 'omote' : 'ura';
      // 先攻は「表」を選んだとする（myChoiceで管理）
      const myPickOmote = (isFirst ? myChoice : (myChoice||'ura')) === 'omote';
      // ターン: 0=先攻, 1=後攻, 2=先攻, 3=後攻, 4=先攻, 5=後攻
      // 先攻選択面が出たら先攻ポイント
      const myWon = (face==='omote') === myPickOmote;
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
    setChinTurnState('rolling_opp'); // 子（相手）から先
  }, [phase]);

  useEffect(() => {
    if (phase !== 'chinchiro_battle') return;

    const runTurn = (who: 'me'|'opp', logs: ChinchiroLog[]) => {
      setChinRolling(who);
      setChinDice(prev => ({ ...prev, [who]: null }));
      const t = setTimeout(() => {
        let dice: number[];
        let rank: ChinchiroRank;
        let attempts = 0;
        do {
          dice = rollDice3();
          rank = evalChinchiro(dice);
          attempts++;
        } while (rank.type === 'nashi' && attempts < 8);
        // 最終ターンはサーバー結果に合わせる（勝敗整合）
        setChinDice(prev => ({ ...prev, [who]: dice }));
        setChinRolling(null);
        const newLog: ChinchiroLog = { who, dice, rank };
        const newLogs = [...logs, newLog];
        setChinLogs(newLogs);

        // 役なしならもう一度
        if (rank.type === 'nashi') {
          setTimeout(() => runTurn(who, newLogs), 1400);
        } else {
          // 相手→自分の順で終わったら勝敗
          const oppDone = newLogs.some(l => l.who === 'opp' && l.rank.type !== 'nashi');
          const meDone = newLogs.some(l => l.who === 'me' && l.rank.type !== 'nashi');
          if (oppDone && !meDone) {
            setTimeout(() => runTurn('me', newLogs), 1400);
          } else if (oppDone && meDone) {
            setTimeout(() => setChinTurnState('done'), 800);
          } else if (!oppDone && who === 'me') {
            setTimeout(() => runTurn('opp', newLogs), 1400);
          }
        }
      }, 1400);
      return () => clearTimeout(t);
    };

    if (chinTurnState === 'rolling_opp') {
      runTurn('opp', []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, chinTurnState]);

  useEffect(() => {
    if (chinTurnState === 'done') setTimeout(() => setPhase('final'), 1200);
  }, [chinTurnState]);

  // ========== スロット: 交互に役が出るまで回す ==========
  useEffect(() => {
    if (phase !== 'slot_battle') return;
    setSlotLogs([]);
    setSlotSpinning(false);
    setSlotSymbols(null);
    setSlotTurn(isFirst ? 'me' : 'opp');
    setSlotTurnState('idle');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'slot_battle' || slotTurnState !== 'idle') return;
    setSlotTurnState('spinning');
    setSlotSpinning(true);
    setSlotSymbols(null);
    const t = setTimeout(() => {
      const syms = [
        SLOT_SYMBOLS[Math.floor(secureRandom()*SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(secureRandom()*SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(secureRandom()*SLOT_SYMBOLS.length)],
      ];
      // 役判定: 3つ揃い or 2つ揃い
      const getRank = (s: string[]) => {
        if (s[0]===s[1] && s[1]===s[2]) return { rank: SLOT_RANKS[s[0]]??10, label:`${s[0]}${s[0]}${s[0]} ゾロ目！`, hasRole: true };
        if (s[0]===s[1] || s[1]===s[2] || s[0]===s[2]) return { rank: 1, label:'2つ揃い', hasRole: true };
        return { rank: 0, label:'役なし', hasRole: false };
      };
      const r = getRank(syms);
      setSlotSymbols(syms);
      setSlotSpinning(false);
      const newLog: SlotLog = { who: slotTurn, symbols: syms, rank: r.rank, label: r.label };
      setSlotLogs(prev => {
        const newLogs = [...prev, newLog];
        setTimeout(() => {
          const myLog = newLogs.find(l => l.who === 'me' && l.rank > 0);
          const oppLog = newLogs.find(l => l.who === 'opp' && l.rank > 0);
          if (myLog && oppLog) {
            setTimeout(() => setPhase('final'), 1200);
          } else if (!r.hasRole || (!myLog && !oppLog)) {
            const nextTurn = slotTurn === 'me' ? 'opp' : 'me';
            setSlotTurn(nextTurn);
            setSlotTurnState('idle');
          } else {
            // 片方だけ役あり → もう片方へ
            const nextTurn = slotTurn === 'me' ? 'opp' : 'me';
            setSlotTurn(nextTurn);
            setSlotTurnState('idle');
          }
        }, 1500);
        return newLogs;
      });
    }, 2000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, slotTurnState, slotTurn]);

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

      {/* スロット: 交互演出 */}
      {phase === 'slot_battle' && (
        <>
          <div style={{ fontSize:'1.1rem', color:'#f0c060', fontWeight:700 }}>🎰 スロット — 交互対決！</div>
          <div style={{ fontSize:'0.82rem', color: slotTurn==='me'?'#5b8dee':'#e05555', fontWeight:700 }}>
            {slotTurn==='me'?'⬇ あなたのターン！':` ⬇ ${opponentName}のターン！`}
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
          {/* ログ */}
          <div style={{ maxHeight:120, overflowY:'auto', width:'100%', maxWidth:320 }}>
            {slotLogs.map((l,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', padding:'3px 0', color: l.rank>0?(l.who==='me'?'#5b8dee':'#e05555'):'#4a5070', animation:'slideIn 0.3s ease' }}>
                <span>{l.who==='me'?'あなた':opponentName}: {l.symbols.join('')}</span>
                <span>{l.label}</span>
              </div>
            ))}
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
            {result.won ? `+${result.amount.toLocaleString()}G` : `-${result.amount.toLocaleString()}G`}
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
  const w = small ? 30 : 40, h = small ? 44 : 58;
  return (
    <div style={{
      width: w, height: h,
      background: faceDown ? 'linear-gradient(135deg,#1c2235,#2d3752)' : '#fff',
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
  const changeGold = useGameStore(s => s.changeGold);
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
          changeGold(me.chips);
        }
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTableId, player?.uid]);

  const handleCreate = async () => {
    if (!player) return;
    if (player.gold < createForm.buyIn) { addNotification('error', 'ゴールドが足りません'); return; }
    setLoading(true);
    try {
      changeGold(-createForm.buyIn);
      const id = await createPokerTable(player.uid, player.displayName, player.stats.level, createForm.maxPlayers, createForm.buyIn);
      setMyTableId(id);
      setShowCreateForm(false);
      addNotification('success', `♠ テーブルを作成しました！参加者を待っています (${createForm.buyIn.toLocaleString()}G)`);
    } catch (e) {
      changeGold(createForm.buyIn);
      addNotification('error', '作成に失敗しました');
    }
    setLoading(false);
  };

  const handleJoin = async (table: PokerTable) => {
    if (!player) return;
    if (player.gold < table.buyIn) { addNotification('error', 'ゴールドが足りません'); return; }
    setLoading(true);
    try {
      changeGold(-table.buyIn);
      const res = await joinPokerTable(table.id, player.uid, player.displayName, player.stats.level, table.buyIn);
      if (res.success) {
        setMyTableId(table.id);
        addNotification('success', `テーブルに参加しました！`);
      } else {
        changeGold(table.buyIn);
        addNotification('error', res.message ?? '参加に失敗しました');
      }
    } catch {
      changeGold(table.buyIn);
      addNotification('error', '参加に失敗しました');
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!player || !myTableId) return;
    setLoading(true);
    try {
      await cancelPokerTable(myTableId, player.uid);
      changeGold(createForm.buyIn); // 返金
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
      if (me) changeGold(me.chips); // 返金
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
          <span style={{ fontSize:'0.8rem', color:'#8a92b2' }}>ポット: <span style={{color:'#f0c060',fontWeight:700}}>{activeTable.pot.toLocaleString()}G</span></span>
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
                <span style={{ fontSize:'0.75rem', color:'#f0c060' }}>{p.chips.toLocaleString()}G</span>
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
                {w.displayName}（{w.handName}）+{w.amount.toLocaleString()}G
              </div>
            ))}
          </div>
        )}

        {/* アクションボタン */}
        {phase === 'waiting' && isHost && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ fontSize:'0.78rem', color:'#8a92b2', textAlign:'center' }}>
              参加者: {activeTable.players.length}/{activeTable.maxPlayers}人 | 参加費: {activeTable.buyIn.toLocaleString()}G
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
                  コール ({(activeTable.currentBet - (me?.bet ?? 0)).toLocaleString()}G)
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
                    {v.toLocaleString()}G
                  </button>
                ))}
              </div>
              <input type="number" value={createForm.buyIn} min={100}
                onChange={e => setCreateForm(f => ({...f, buyIn: Math.max(100, Number(e.target.value))}))}
                style={{ width:'100%', padding:'6px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem', boxSizing:'border-box' as const }}
              />
            </div>
            <div style={{ fontSize:'0.72rem', color:'#4a5070', marginBottom:8 }}>
              ブラインド: SB {Math.max(1,Math.floor(createForm.buyIn*0.01)).toLocaleString()}G / BB {Math.max(2,Math.floor(createForm.buyIn*0.02)).toLocaleString()}G<br/>
              ※ 参加費は先払い。キャンセルで全額返金。{createForm.maxPlayers}人全員が揃ったらホストがゲームを開始します。
            </div>
            <button onClick={handleCreate} disabled={loading || (player?.gold ?? 0) < createForm.buyIn}
              style={{ width:'100%', padding:'8px', background:(player?.gold ?? 0) >= createForm.buyIn ? 'linear-gradient(135deg,#5b8dee,#3a6fd0)' : '#2d3752', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
              {(player?.gold ?? 0) >= createForm.buyIn ? `♠ テーブルを作成 (${createForm.buyIn.toLocaleString()}G)` : 'Gが足りない'}
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
                <span style={{ color:'#f0c060', fontWeight:700 }}>{t.buyIn.toLocaleString()}G</span>
              </div>
              <div style={{ fontSize:'0.75rem', color:'#8a92b2', marginBottom:8 }}>
                参加: {t.players.length}/{t.maxPlayers}人 | ブラインド: {Math.max(1,Math.floor(t.buyIn*0.01)).toLocaleString()}G/{Math.max(2,Math.floor(t.buyIn*0.02)).toLocaleString()}G
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
                disabled={loading || isFull || alreadyIn || (player?.gold ?? 0) < t.buyIn}
                style={{ width:'100%', padding:'6px', background: (!isFull && !alreadyIn && (player?.gold??0) >= t.buyIn) ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
                {alreadyIn ? '参加済み' : isFull ? '満員' : (player?.gold??0) < t.buyIn ? 'Gが足りない' : `参加する (${t.buyIn.toLocaleString()}G)`}
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
  const changeGold = useGameStore(s => s.changeGold);
  const addNotification = useGameStore(s => s.addNotification);
  const [battles, setBattles] = useState<GambleBattle[]>([]);
  const [myBattleId, setMyBattleId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState('chohan');
  const [loading, setLoading] = useState(false);
  const [battleAnim, setBattleAnim] = useState<{ opponentName: string; gameName: string; result: { won: boolean; amount: number } } | null>(null);
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
          changeGold(battle.betAmount * 2); // 自分の掛け金 + 相手の掛け金
        }
        // 負けの場合は handleHost で既に -betAmount してあるので追加処理なし
        setBattleAnim({
          opponentName: battle.guestName ?? '相手',
          gameName: battle.gambleType,
          result: { won: iWon, amount: battle.betAmount },
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
    if (!player || player.gold < bet) { addNotification('error', 'ゴールドが足りません'); return; }
    if (myBattleId) { addNotification('warning', '既に募集中です'); return; }
    setLoading(true);
    try {
      // 募集時に掛け金を先払い（エスクロー）
      changeGold(-bet);
      const id = await createGambleBattle(player.uid, player.displayName, player.stats.level, selectedGame, bet);
      setMyBattleId(id);
      addNotification('success', `⚔️ 対戦を募集開始しました！ (${bet.toLocaleString()}G)`);
    } catch (e) {
      // 失敗したら返金
      changeGold(bet);
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
      changeGold(bet);
      setMyBattleId(null);
      addNotification('info', '募集をキャンセルしました（返金済み）');
    } catch { addNotification('error', 'キャンセルに失敗しました'); }
    setLoading(false);
  };

  const handleJoin = async (battle: GambleBattle) => {
    if (!player) return;
    if (player.gold < battle.betAmount) { addNotification('error', 'ゴールドが足りません'); return; }
    setLoading(true);
    try {
      // 参加時に掛け金を払う
      changeGold(-battle.betAmount);
      const { success, battle: result } = await joinGambleBattle(battle.id, player.uid, player.displayName);
      if (success && result) {
        const iWon = result.winnerId === player.uid;
        if (iWon) {
          // 勝ちなら自分の掛け金 + 相手の掛け金を受取
          changeGold(battle.betAmount * 2);
        }
        // 負けの場合は既に -betAmount 済みなので追加処理なし
        setBattleAnim({
          opponentName: battle.hostName,
          gameName: battle.gambleType,
          result: { won: iWon, amount: battle.betAmount },
        });
      } else {
        // 参加失敗→返金
        changeGold(battle.betAmount);
        addNotification('error', '参加に失敗しました（既に終了）');
      }
    } catch {
      changeGold(battle.betAmount);
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
          掛け金: {bet.toLocaleString()}G | ゲーム: {GAME_NAMES[selectedGame]}<br />
          <span style={{ color: '#4a5070' }}>※ 募集時に掛け金が引かれます。キャンセルで返金。</span>
        </div>
        {myBattleId && myBattle ? (
          <div style={{ background: 'rgba(91,141,238,0.1)', border: '1px solid #5b8dee', borderRadius: 6, padding: '8px 10px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#5b8dee' }}>🔄 参加者募集中... ({bet.toLocaleString()}G エスクロー中)</span>
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

// スロット専用パネル（リール本格演出）
function SlotPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0 }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number }) {
  const { player, changeGold, addItems, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addItems: s.addItems, addNotification: s.addNotification }));
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [finalSyms, setFinalSyms] = useState<string[]|null>(null);
  const [reelFrames, setReelFrames] = useState([0,0,0]);
  const SLOT_SYM = ['🍒','💎','7️⃣','🍋','🔔','💰','🃏','⭐'];
  const game = GAMBLE_MASTER['slot_machine'];

  const play = async () => {
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true); setResult(null); setFinalSyms(null);
    changeGold(-bet); onJackpotContrib(bet);
    const r = resolveGenericGamble(game, bet, multiplierBonus);

    setSpinning(true);
    // リール高速回転
    let cnt = 0;
    const t = setInterval(() => {
      setReelFrames([
        Math.floor(secureRandom()*SLOT_SYM.length),
        Math.floor(secureRandom()*SLOT_SYM.length),
        Math.floor(secureRandom()*SLOT_SYM.length),
      ]);
      cnt++;
    }, 80);

    // 各リールを時差停止
    const syms = r.symbols ?? [SLOT_SYM[0], SLOT_SYM[1], SLOT_SYM[2]];
    const stopReel = (idx: number, delay: number) => {
      setTimeout(() => {
        setReelFrames(prev => { const n=[...prev]; n[idx] = SLOT_SYM.indexOf(syms[idx] ?? SLOT_SYM[0]); return n; });
        setFinalSyms(prev => { const n = prev ? [...prev] : [null,null,null] as any; n[idx] = syms[idx]; return n; });
      }, delay);
    };
    stopReel(0, 900);
    stopReel(1, 1400);
    stopReel(2, 1900);

    setTimeout(async () => {
      clearInterval(t);
      setSpinning(false);
      setFinalSyms(syms as string[]);
      if (r.multiplier > 0) changeGold(r.goldDelta + bet);
      if (r.itemRewards.length > 0) addItems(r.itemRewards);
      setResult(r); onResult(r);
      if (player) {
        const winGold = Math.floor(bet * r.multiplier);
        const type = r.multiplier > 0 ? 'gamble_win' : 'gamble_lose';
        const msg = r.multiplier > 0 ? `が${game.name}で${(winGold-bet).toLocaleString()}G勝利しました！` : `が${game.name}で${bet.toLocaleString()}G負けました`;
        postActivityFeed({ uid: player.uid, displayName: player.displayName, type, message: msg }).catch(() => {});
      }
      try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeGold(pool); addNotification('success', `🌟🌟🌟 JACKPOT!! ${pool.toLocaleString()}G！`); } } catch { /**/ }
      setAnimating(false);
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
      {/* スロットマシン本体 */}
      <div style={{ background:'linear-gradient(135deg,#1a1f30,#0f1220)', border:'3px solid #f0c060', borderRadius:16, padding:'16px', marginBottom:10, textAlign:'center', boxShadow: result && isWin ? '0 0 30px rgba(240,192,96,0.4)' : 'none', animation: result && isWin ? 'jackpotGlow 1s infinite' : 'none' }}>
        <div style={{ fontSize:'0.7rem', color:'#4a5070', marginBottom:8, letterSpacing:2 }}>🎰 SLOT MACHINE 🎰</div>
        <div style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'center', marginBottom:10 }}>
          {[0,1,2].map(i => {
            const sym = finalSyms?.[i] ?? null;
            const stopped = sym !== null;
            return (
              <div key={i} style={{
                width:72, height:88, background:'#0a0d18', border:`3px solid ${stopped ? '#f0c060' : '#2d3752'}`,
                borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
                boxShadow: stopped && isWin ? '0 0 20px rgba(240,192,96,0.5)' : 'none',
                transition:'border-color 0.3s, box-shadow 0.3s',
              }}>
                <span style={{
                  fontSize:'2.5rem', display:'block',
                  animation: spinning && !stopped ? 'reelSpin 0.2s linear infinite' : stopped ? 'reelStop 0.3s ease' : 'none',
                }}>
                  {stopped ? sym : SLOT_SYM[reelFrames[i] % SLOT_SYM.length]}
                </span>
              </div>
            );
          })}
        </div>
        {/* ペイライン */}
        <div style={{ width:'100%', height:2, background: isWin ? '#f0c060' : '#2d3752', borderRadius:1, marginBottom:8, transition:'background 0.5s' }} />
        {result && (
          <div style={{ fontSize:'1rem', fontWeight:900, color: isWin ? '#f0c060' : '#4a5070' }}>
            {result.symbols?.join(' ') ?? ''} {result.rewardLabel}
          </div>
        )}
        {spinning && !finalSyms && (
          <div style={{ fontSize:'0.8rem', color:'#8a92b2', animation:'glow 0.5s infinite' }}>リール回転中...</div>
        )}
      </div>
      {result && <ResultDisplay result={result} />}
      <button onClick={play} disabled={animating}
        style={{ width:'100%', padding:12, background: animating ? '#2d3752' : 'linear-gradient(135deg,#f0c060,#d0a040)', color: animating ? '#8a92b2' : '#000', border:'none', borderRadius:8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:'1rem' }}>
        {animating ? '🎰 回転中...' : `🎰 ${bet.toLocaleString()}G でプレイ`}
      </button>
    </div>
  );
}

function GenericPanel({ game, bet, onResult, onJackpotContrib, multiplierBonus = 1.0 }: { game: GambleMaster; bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number }) {
  const { player, changeGold, addItems, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addItems: s.addItems, addNotification: s.addNotification }));
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const pendingRef = useState<{ r: GambleResult | null }>({ r: null })[0];

  const play = async () => {
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true);
    setResult(null);
    changeGold(-bet);
    onJackpotContrib(bet); // ジャックポット積立

    const r = resolveGenericGamble(game, bet, multiplierBonus);
    pendingRef.r = r;
    setShowAnim(true);
  };

  const handleAnimDone = async () => {
    setShowAnim(false);
    const r = pendingRef.r;
    if (!r) { setAnimating(false); return; }
    if (r.multiplier > 0) changeGold(r.goldDelta + bet);
    if (r.itemRewards.length > 0) addItems(r.itemRewards);
    setResult(r);
    onResult(r);
    // アクティビティフィードに投稿
    if (player) {
      const winGold = Math.floor(bet * r.multiplier);
      const type = r.multiplier > 0 ? 'gamble_win' : 'gamble_lose';
      const msg = r.multiplier > 0
        ? `が${game.name}で${(winGold - bet).toLocaleString()}G勝利しました！`
        : `が${game.name}で${bet.toLocaleString()}G負けました`;
      postActivityFeed({ uid: player.uid, displayName: player.displayName, type, message: msg }).catch(() => {});
    }
    try {
      const { won, pool } = await checkJackpotWin();
      if (won && pool > 0) {
        changeGold(pool);
        addNotification('success', `🌟🌟🌟 JACKPOT!! ${pool.toLocaleString()}G獲得！！🌟🌟🌟`);
        if (player) postActivityFeed({ uid: player.uid, displayName: player.displayName, type: 'gamble_win', message: `が🌟JACKPOTで${pool.toLocaleString()}G獲得！！` }).catch(() => {});
      }
    } catch { /* ignore */ }
    setAnimating(false);
  };

  const animType = game.type === 'slot' ? 'slot' : game.type === 'treasure_box' ? 'treasure_box' : 'generic';

  return (
    <div>
      {showAnim && <GameAnimation type={animType as 'slot'|'treasure_box'|'generic'} onDone={handleAnimDone} />}
      {result && !animating && <ResultDisplay result={result} />}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 12, background: animating ? '#2d3752' : 'linear-gradient(135deg,#5b8dee,#3a6fd0)', color: '#fff', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        {animating ? '結果を出しています...' : <span style={{display:'inline-flex',alignItems:'center',gap:6}}><GameIcon id={game.icon} size={18} /> {bet.toLocaleString()}G で挑戦</span>}
      </button>
    </div>
  );
}

function ChohanPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0 }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number }) {
  const { player, changeGold, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addNotification: s.addNotification }));
  const [choice, setChoice] = useState<'cho'|'han'>('cho');
  const [result, setResult] = useState<GambleResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [phase, setPhase] = useState<'idle'|'rolling'|'reveal'|'done'>('idle');
  const [rollingFrame, setRollingFrame] = useState(0);
  const [finalDice, setFinalDice] = useState<number[]|null>(null);
  const pendingRef = useState<{ r: GambleResult | null }>({ r: null })[0];
  const DICE_EJ = ['⚀','⚁','⚂','⚃','⚄','⚅'];

  const play = async () => {
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true); setResult(null); setFinalDice(null);
    changeGold(-bet); onJackpotContrib(bet);
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
          if (!rr) { setAnimating(false); return; }
          if (rr.goldDelta > 0) changeGold(rr.goldDelta + bet);
          setResult(rr); onResult(rr); setPhase('done');
          try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeGold(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}G！`); } } catch { /**/ }
          setAnimating(false);
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
      {phase === 'done' && result && <ResultDisplay result={result} />}
      <button onClick={play} disabled={animating}
        style={{ width: '100%', padding: 12, background: animating ? '#2d3752' : 'linear-gradient(135deg,#e05555,#c03030)', color: '#fff', border: 'none', borderRadius: 8, cursor: animating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        🎲 {bet.toLocaleString()}G で投じる
      </button>
    </div>
  );
}

function ChinchiroPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0 }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number }) {
  const { player, changeGold, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addNotification: s.addNotification }));
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
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    setAnimating(true); setResult(null); setRollLogs([]); setCurrentDice(null);
    changeGold(-bet); onJackpotContrib(bet);
    const r = playChinchiro(bet);
    const effectiveMult = r.multiplier > 0 ? r.multiplier * multiplierBonus : 0;
    pendingRef.r = { ...r, multiplier: effectiveMult, goldDelta: r.goldDelta > 0 ? Math.floor(bet * effectiveMult) - bet : r.goldDelta };

    // サイコロを何回か振るアニメーション
    const runRoll = (attempt: number, logs: typeof rollLogs) => {
      setRolling(true); setCurrentDice(null);
      setTimeout(() => {
        const dice = attempt < 3 && Math.random() < 0.4
          ? [1,2,4] // 役なし（演出用）
          : Array.isArray((r as any).dice) && attempt >= 2 ? (r as any).dice : [Math.floor(secureRandom()*6)+1, Math.floor(secureRandom()*6)+1, Math.floor(secureRandom()*6)+1];
        const ev = evalChinchiro(dice);
        const isLast = ev.type !== 'nashi' || attempt >= 3;
        setCurrentDice(dice);
        setRolling(false);
        const newLogs = [...logs, { dice, label: ev.label, isRole: ev.type !== 'nashi' }];
        setRollLogs(newLogs);
        if (!isLast) {
          setTimeout(() => runRoll(attempt+1, newLogs), 1200);
        } else {
          // 最終: 本当の結果サイコロを使う
          const finalDice = Array.isArray((r as any).dice) ? (r as any).dice as number[] : dice;
          const finalEv = evalChinchiro(finalDice);
          setCurrentDice(finalDice);
          const finalLogs = attempt === 0 ? newLogs : [...newLogs.slice(0,-1), { dice: finalDice, label: finalEv.label, isRole: true }];
          setRollLogs(finalLogs);
          setTimeout(async () => {
            const rr = pendingRef.r;
            if (!rr) { setAnimating(false); return; }
            if (rr.multiplier > 0) changeGold(rr.goldDelta + bet);
            setResult(rr); onResult(rr);
            try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeGold(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}G！`); } } catch { /**/ }
            setAnimating(false);
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

// 倍々チキンレース コインフリップ
function CoinFlipPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0 }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number }) {
  const { player, changeGold, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addNotification: s.addNotification }));
  // phase: idle=未開始, playing=進行中（連続投げ可能）, busted=裏が出て終了, cashed=利確して終了
  const [phase, setPhase] = useState<'idle'|'playing'|'busted'|'cashed'>('idle');
  const [score, setScore] = useState(0);       // 現在の倍率（表が出るたびに2倍）
  const [flips, setFlips] = useState(0);       // 投げた回数
  const [animating, setAnimating] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [lastFlip, setLastFlip] = useState<'heads'|'tails'|null>(null);
  const pendingRef = useState<{ isHeads: boolean }>({ isHeads: false })[0];

  // ゲーム開始（初回コイン投げ）
  const startGame = () => {
    if (animating || !player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    changeGold(-bet);
    onJackpotContrib(bet);
    setPhase('playing');
    setScore(1);
    setFlips(0);
    setLastFlip(null);
    throwCoin();
  };

  const throwCoin = () => {
    setAnimating(true);
    const isHeads = secureRandom() < 0.5;
    pendingRef.isHeads = isHeads;
    setShowAnim(true);
  };

  const handleAnimDone = () => {
    setShowAnim(false);
    const isHeads = pendingRef.isHeads;
    setLastFlip(isHeads ? 'heads' : 'tails');
    if (isHeads) {
      setScore(prev => prev * 2);
      setFlips(prev => prev + 1);
      setAnimating(false);
    } else {
      // 裏が出たらバスト
      setFlips(prev => prev + 1);
      setPhase('busted');
      const r: GambleResult = { rewardLabel: '裏！全没収！', multiplier: 0, goldDelta: -bet, itemRewards: [], symbols: ['🌑','💥'] };
      onResult(r);
      setAnimating(false);
    }
  };

  // 利確（ストップ）
  const cashOut = async () => {
    if (phase !== 'playing' || animating) return;
    const multiplier = score * multiplierBonus;
    const winGold = Math.floor(bet * multiplier);
    changeGold(winGold);
    setPhase('cashed');
    const r: GambleResult = { rewardLabel: `利確！×${score}倍！`, multiplier, goldDelta: winGold - bet, itemRewards: [], symbols: ['🌕','✨'] };
    onResult(r);
    try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeGold(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}G！`); } } catch { /* ignore */ }
  };

  const reset = () => { setPhase('idle'); setScore(1); setFlips(0); setLastFlip(null); };

  const scoreGold = Math.floor(bet * score * multiplierBonus);

  return (
    <div>
      {/* タイトルと説明 */}
      <div style={{ background: 'rgba(240,192,96,0.08)', border: '1px solid rgba(240,192,96,0.3)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: '0.78rem', color: '#8a92b2', lineHeight: 1.6 }}>
        <div style={{ color: '#f0c060', fontWeight: 700, marginBottom: 4 }}>🪙 倍々チキンレース</div>
        表が出るたびにスコアが<span style={{ color: '#4caf87', fontWeight: 700 }}>2倍</span>に！
        裏が出たら<span style={{ color: '#e05555', fontWeight: 700 }}>全没収</span>。好きなタイミングで利確しよう。
      </div>

      {/* スコア表示 */}
      {phase !== 'idle' && (
        <div style={{ textAlign: 'center', padding: '12px 0', marginBottom: 12 }}>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 2 }}>現在のスコア</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f0c060' }}>×{score}倍</div>
          <div style={{ fontSize: '0.85rem', color: '#4caf87' }}>≈ {scoreGold.toLocaleString()}G</div>
          <div style={{ fontSize: '0.7rem', color: '#4a5070', marginTop: 2 }}>{flips}回投げた</div>
          {lastFlip && (
            <div style={{ fontSize: '1.4rem', marginTop: 6 }}>
              {lastFlip === 'heads' ? '🌕 表！' : '🌑 裏！'}
            </div>
          )}
        </div>
      )}

      {showAnim && <GameAnimation type="coin_flip" onDone={handleAnimDone} />}

      {/* バスト表示 */}
      {phase === 'busted' && !showAnim && (
        <div style={{ textAlign: 'center', background: 'rgba(224,85,85,0.1)', border: '1px solid #e05555', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: '1.2rem', color: '#e05555', fontWeight: 700 }}>💥 裏が出た！全没収！</div>
          <div style={{ color: '#8a92b2', fontSize: '0.78rem', marginTop: 4 }}>{flips}回連続で表を出したが…</div>
        </div>
      )}

      {/* 利確成功表示 */}
      {phase === 'cashed' && !showAnim && (
        <div style={{ textAlign: 'center', background: 'rgba(76,175,135,0.1)', border: '1px solid #4caf87', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: '1.1rem', color: '#4caf87', fontWeight: 700 }}>✅ 利確！×{score}倍 = {scoreGold.toLocaleString()}G 獲得！</div>
          <div style={{ color: '#8a92b2', fontSize: '0.78rem', marginTop: 4 }}>賢い判断だった！</div>
        </div>
      )}

      {/* ボタン群 */}
      {phase === 'idle' && (
        <button onClick={startGame} disabled={animating || (player?.gold ?? 0) < bet}
          style={{ width: '100%', padding: 12, background: (player?.gold ?? 0) >= bet ? 'linear-gradient(135deg,#f0c060,#c08020)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
          🪙 {bet.toLocaleString()}G でゲーム開始
        </button>
      )}

      {phase === 'playing' && !showAnim && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={throwCoin} disabled={animating}
            style={{ flex: 2, padding: 12, background: 'linear-gradient(135deg,#5b8dee,#3a6fd0)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}>
            🪙 もう一回投げる（×{score*2}倍狙い）
          </button>
          <button onClick={cashOut} disabled={animating}
            style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#4caf87,#2d8060)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
            💰 利確（{scoreGold.toLocaleString()}G）
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

function PokerPanel({ bet, onResult, onJackpotContrib, multiplierBonus = 1.0 }: { bet: number; onResult: (r: GambleResult) => void; onJackpotContrib: (bet: number) => void; multiplierBonus?: number }) {
  const { player, changeGold, addItems, addNotification } = useGameStore(s => ({ player: s.player, changeGold: s.changeGold, addItems: s.addItems, addNotification: s.addNotification }));
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
    if (!player || player.gold < bet) { addNotification('error', 'ゴールドが足りません！'); return; }
    changeGold(-bet); onJackpotContrib(bet);
    const state = dealPoker();
    pendingRef.state = state;
    setHold([false,false,false,false,false]);
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
    if (effectiveMult > 0) changeGold(adjustedResult.goldDelta + bet);
    if (r.itemRewards.length > 0) addItems(r.itemRewards);
    setResult(adjustedResult); onResult(adjustedResult);
    try { const { won, pool } = await checkJackpotWin(); if (won && pool > 0) { changeGold(pool); addNotification('success', `🌟 JACKPOT!! ${pool.toLocaleString()}G！`); } } catch { /* ignore */ }
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
type GameTab = 'chohan'|'chinchiro'|'coin_flip'|'slot'|'poker'|'treasure_box'|'pvp'|'texas';
const GAME_TABS: { id: GameTab; label: string; icon: string }[] = [
  { id:'chohan',       label:'丁半',     icon:'dice' },
  { id:'chinchiro',    label:'チンチロ', icon:'target' },
  { id:'coin_flip',    label:'コイン',   icon:'coin' },
  { id:'slot',         label:'スロット', icon:'slot_machine' },
  { id:'poker',        label:'ポーカー', icon:'joker_card' },
  { id:'treasure_box', label:'宝箱',     icon:'box' },
  { id:'pvp',          label:'対戦',     icon:'swords' },
  { id:'texas',        label:'TH対戦',   icon:'joker_card' },
];

export function GambleScreen() {
  const player = useGameStore(s => s.player);
  const [activeGame, setActiveGame] = useState<GameTab>('chohan');
  const [bet, setBet] = useState(100);
  const [stats, setStats] = useState<SessionStats>(initStats());
  const [jackpotPool, setJackpotPool] = useState(0);
  const [gambleMultipliers, setGambleMultipliers] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsub = subscribeJackpotPool(setJackpotPool);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeGambleMultipliers(setGambleMultipliers);
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
  const gameMasterKey = activeGame === 'slot' ? 'slot_machine' : activeGame;
  const game = GAMBLE_MASTER[gameMasterKey] ?? GAMBLE_MASTER['chohan'];
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
            <GameIcon id={t.icon} size={15} style={{marginRight:3}} /> {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
        {activeGame !== 'pvp' && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', display:'flex', alignItems:'center', gap:6 }}><GameIcon id={game.icon} size={20} /> {game.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginTop: 2 }}>{game.description}</div>
          </div>
        )}
        {activeGame !== 'pvp' && <BetInput game={game} bet={bet} setBet={setBet} />}

        {activeGame === 'chohan'       && <ChohanPanel    bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={gambleMultipliers['chohan'] ?? 1.0} />}
        {activeGame === 'chinchiro'    && <ChinchiroPanel bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={gambleMultipliers['chinchiro'] ?? 1.0} />}
        {activeGame === 'coin_flip'    && <CoinFlipPanel  bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={gambleMultipliers['coin_flip'] ?? 1.0} />}
        {activeGame === 'slot'         && <SlotPanel  bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={gambleMultipliers['slot_machine'] ?? 1.0} />}
        {activeGame === 'treasure_box' && <GenericPanel game={GAMBLE_MASTER['treasure_box']}  bet={30000} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={gambleMultipliers['treasure_box'] ?? 1.0} />}
        {activeGame === 'treasure_box' && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0c060', marginBottom: 8 }}>📦 宝箱の中身一覧</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {GAMBLE_MASTER['treasure_box'].rewardTable.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#161b26', border: '1px solid #2d3752', borderRadius: 6, padding: '7px 10px' }}>
                  <span style={{ fontSize: '1.1rem', minWidth: 24, textAlign: 'center' }}>{r.symbols?.[0] ?? '?'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e8e6ff' }}>{r.label}</div>
                    <div style={{ fontSize: '0.7rem', color: '#8a92b2', marginTop: 1 }}>
                      {r.multiplier > 0 && <span>💰 {r.multiplier}倍ゴールド</span>}
                      {r.itemRewards && r.itemRewards.length > 0 && r.itemRewards.map(ir => (
                        <span key={ir.itemId} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginRight: 4 }}>
                          <GameIcon id={ITEM_MASTER[ir.itemId]?.icon ?? ''} size={12} />
                          {ITEM_MASTER[ir.itemId]?.name ?? ir.itemId} ×{ir.amount}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#4a5070', flexShrink: 0 }}>{(r.probability * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 6, textAlign: 'center' }}>1回 30,000G固定</div>
          </div>
        )}
        {activeGame === 'poker'        && <PokerPanel    bet={bet} onResult={handleResult} onJackpotContrib={handleJackpotContrib} multiplierBonus={gambleMultipliers['poker'] ?? 1.0} />}
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
