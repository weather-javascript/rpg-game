// src/components/screens/GambleScreen.tsx
// ギャンブル画面：スロット・宝箱くじ・コインフリップ。

import { useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GAMBLE_MASTER, ITEM_MASTER } from '../../data/masters';
import type { GambleMaster, GambleResult } from '../../types/game';

// ============================================================
// === ギャンブルロジック（純粋関数） ===
// ============================================================

function resolveGamble(game: GambleMaster, bet: number): GambleResult {
  const rand = Math.random();
  let cumulative = 0;

  for (const reward of game.rewardTable) {
    cumulative += reward.probability;
    if (rand < cumulative) {
      const goldDelta = Math.floor(bet * reward.multiplier) - bet;
      return {
        rewardLabel: reward.label,
        multiplier: reward.multiplier,
        goldDelta,
        itemRewards: reward.itemRewards ?? [],
        symbols: reward.symbols,
      };
    }
  }

  // フォールバック（確率の合計が1.0未満の場合）
  const last = game.rewardTable[game.rewardTable.length - 1];
  return {
    rewardLabel: last.label,
    multiplier: last.multiplier,
    goldDelta: Math.floor(bet * last.multiplier) - bet,
    itemRewards: last.itemRewards ?? [],
    symbols: last.symbols,
  };
}

// ============================================================
// === ギャンブルゲームカード ===
// ============================================================
interface GambleCardProps {
  game: GambleMaster;
  onPlay: (gameId: string, bet: number) => GambleResult | null;
}

function GambleCard({ game, onPlay }: GambleCardProps) {
  const player = useGameStore((s) => s.player);
  const [bet, setBet] = useState(game.minBet);
  const [result, setResult] = useState<GambleResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePlay = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setResult(null);

    // アニメーション演出
    setTimeout(() => {
      const r = onPlay(game.id, bet);
      setResult(r);
      setIsAnimating(false);
    }, 800);
  };

  const canPlay = (player?.gold ?? 0) >= bet && !isAnimating;

  return (
    <div className="gamble-card">
      <div className="gamble-header">
        <span className="gamble-icon">{game.icon}</span>
        <div>
          <h3 className="gamble-name">{game.name}</h3>
          <p className="gamble-desc">{game.description}</p>
        </div>
      </div>

      {/* ベット額設定 */}
      <div className="bet-controls">
        <label>賭け金:</label>
        <button onClick={() => setBet(Math.max(game.minBet, bet - game.minBet))}>-</button>
        <input
          type="number"
          value={bet}
          onChange={(e) => setBet(Math.max(game.minBet, Math.min(game.maxBet, Number(e.target.value))))}
          min={game.minBet}
          max={game.maxBet}
        />
        <button onClick={() => setBet(Math.min(game.maxBet, bet + game.minBet))}>+</button>
        <button onClick={() => setBet(Math.min(game.maxBet, Math.floor((player?.gold ?? 0) / 2)))}>
          半額
        </button>
        <span className="bet-unit">G</span>
      </div>

      {/* プレイボタン */}
      <button
        className={`play-btn ${isAnimating ? 'animating' : ''}`}
        onClick={handlePlay}
        disabled={!canPlay}
      >
        {isAnimating
          ? (game.type === 'slot' ? '🎰🎰🎰' : game.type === 'coin_flip' ? '🪙...' : '📦...')
          : `${game.icon} プレイ（${bet}G）`}
      </button>

      {/* 結果表示 */}
      {result && !isAnimating && (
        <div className={`gamble-result ${result.goldDelta >= 0 ? 'win' : 'lose'}`}>
          {result.symbols && (
            <div className="result-symbols">
              {result.symbols.map((s, i) => <span key={i} className="symbol">{s}</span>)}
            </div>
          )}
          <p className="result-label">{result.rewardLabel}</p>
          <p className="result-delta">
            {result.goldDelta >= 0 ? `+${result.goldDelta}G 獲得！` : `${result.goldDelta}G 損失...`}
          </p>
          {result.itemRewards.length > 0 && (
            <div className="result-items">
              {result.itemRewards.map((r) => (
                <span key={r.itemId}>
                  {ITEM_MASTER[r.itemId]?.icon} {ITEM_MASTER[r.itemId]?.name} ×{r.amount}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// === ギャンブル画面 ===
// ============================================================
export function GambleScreen() {
  const changeGold = useGameStore((s) => s.changeGold);
  const addItems = useGameStore((s) => s.addItems);
  const addNotification = useGameStore((s) => s.addNotification);

  const handlePlay = useCallback(
    (gameId: string, bet: number): GambleResult | null => {
      const game = GAMBLE_MASTER[gameId];
      if (!game) return null;

      // 賭け金を消費
      const canAfford = changeGold(-bet);
      if (!canAfford) {
        addNotification('error', 'ゴールドが足りません！');
        return null;
      }

      const result = resolveGamble(game, bet);

      // 報酬を付与
      if (result.goldDelta > 0) {
        changeGold(result.goldDelta + bet); // bet分は既に引いているので
      }
      if (result.itemRewards.length > 0) {
        addItems(result.itemRewards);
      }

      return result;
    },
    [changeGold, addItems, addNotification]
  );

  const games = Object.values(GAMBLE_MASTER);

  return (
    <div className="screen gamble-screen">
      <h2 className="screen-title">🎰 ギャンブル</h2>
      <p className="gamble-warning">⚠️ ゲーム内通貨を使ったゲームです。節度を持って楽しみましょう！</p>
      <div className="gamble-grid">
        {games.map((game) => (
          <GambleCard key={game.id} game={game} onPlay={handlePlay} />
        ))}
      </div>
    </div>
  );
}
