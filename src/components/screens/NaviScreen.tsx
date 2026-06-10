// src/components/screens/NaviScreen.tsx
// 冒険ナビゲーションシステム

import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { DUNGEON_MASTER } from '../../data/masters';
import type { PlayerData } from '../../types/game';

// ダンジョン進行順（メインルート）
const MAIN_DUNGEON_ORDER = [
  'beginner_cave',
  'goblin_den',
  'fortress',
  'underground_fortress',
  'garden',
  'frozen_cave',
  'sky_castle',
  'sky_castle_ex',
  'volcano',
];

interface NaviGoal {
  title: string;
  description: string;
  conditions: { text: string; met: boolean }[];
  reward: { text: string }[];
  targetTab: 'dungeon' | 'gathering' | 'crafting' | 'fishing' | 'gamble' | 'online' | 'status';
  progress?: { current: number; max: number; label: string };
  emoji: string;
}

function computeGoal(player: PlayerData): NaviGoal {
  const level = player.stats.level;
  const cleared = player.dungeonClearedCount ?? {};
  const mp = player.missionProgress;
  const totalGamblePlays = (mp?.totalSlotPlays ?? 0) + (mp?.totalChohanWins ?? 0) + (mp?.totalChinchiroWins ?? 0) + (mp?.totalPokerWins ?? 0) + (mp?.totalCoinFlipWins ?? 0) + (mp?.totalHighlowWins ?? 0) + (mp?.totalWagered ?? 0);
  const hasGambled = totalGamblePlays > 0 || (player.totalWagered ?? 0) > 0;
  const fishingScore = player.fishingScore ?? 0;

  // 1. メインダンジョン進行チェック
  for (const dungeonId of MAIN_DUNGEON_ORDER) {
    const dungeon = DUNGEON_MASTER[dungeonId];
    if (!dungeon) continue;
    const clears = cleared[dungeonId] ?? 0;

    if (clears === 0) {
      // このダンジョンが未クリア → 挑戦を提案
      const reqLevel = dungeon.requiredLevel ?? 1;
      const levelOk = level >= reqLevel;

      // アンロック条件チェック
      const unlock = (dungeon as { unlockCondition?: { dungeonId: string; clearedCount: number; requiredLevel?: number } }).unlockCondition;
      const unlockOk = !unlock || (cleared[unlock.dungeonId] ?? 0) >= unlock.clearedCount;

      if (!levelOk) {
        // レベル不足 → レベル上げ提案
        // 前のダンジョンを推奨狩場に
        const prevIdx = MAIN_DUNGEON_ORDER.indexOf(dungeonId) - 1;
        void (prevIdx >= 0 ? DUNGEON_MASTER[MAIN_DUNGEON_ORDER[prevIdx]] : null);
        return {
          emoji: '⚔️',
          title: `レベル${reqLevel}を目指そう`,
          description: `${dungeon.name}に挑戦するにはLv${reqLevel}が必要です。`,
          conditions: [{ text: `レベル${reqLevel}に到達する（現在Lv${level}）`, met: false }],
          reward: [{ text: `${dungeon.name}への挑戦権` }],
          targetTab: 'dungeon',
          progress: { current: level, max: reqLevel, label: 'レベル' },
        };
      }

      if (!unlockOk && unlock) {
        const prevDungeon = DUNGEON_MASTER[unlock.dungeonId];
        return {
          emoji: '🔓',
          title: `${prevDungeon?.name ?? unlock.dungeonId}をクリアしよう`,
          description: `${dungeon.name}への道を開くため、まず${prevDungeon?.name ?? unlock.dungeonId}を${unlock.clearedCount}回クリアしましょう。`,
          conditions: [
            { text: `${prevDungeon?.name ?? unlock.dungeonId}を${unlock.clearedCount}回クリア（現在${cleared[unlock.dungeonId] ?? 0}回）`, met: false },
            ...(unlock.requiredLevel ? [{ text: `レベル${unlock.requiredLevel}（現在Lv${level}）`, met: level >= unlock.requiredLevel }] : []),
          ],
          reward: [{ text: `${dungeon.name}のアンロック` }],
          targetTab: 'dungeon',
          progress: { current: cleared[unlock.dungeonId] ?? 0, max: unlock.clearedCount, label: 'クリア回数' },
        };
      }

      return {
        emoji: '🏰',
        title: `${dungeon.name}を攻略しよう`,
        description: dungeon.description,
        conditions: [
          { text: `レベル${reqLevel}（現在Lv${level}）`, met: levelOk },
          ...(unlock ? [{ text: `${DUNGEON_MASTER[unlock.dungeonId]?.name ?? unlock.dungeonId}クリア済み`, met: unlockOk }] : []),
        ],
        reward: [{ text: '経験値・ゴールド・アイテム獲得' }],
        targetTab: 'dungeon',
      };
    }
  }

  // 2. 全ダンジョンクリア済み → ギャンブル未体験チェック
  if (level >= 10 && !hasGambled) {
    return {
      emoji: '🎰',
      title: 'カジノに挑戦しよう',
      description: 'レベルも上がってきました。ギャンブルでWC（ウェルスコイン）を稼いでみましょう！',
      conditions: [
        { text: 'レベル10以上', met: level >= 10 },
        { text: 'ギャンブルを1回プレイする', met: hasGambled },
      ],
      reward: [{ text: 'WC獲得チャンス' }],
      targetTab: 'gamble',
    };
  }

  // 3. 釣り未体験
  if (fishingScore < 5) {
    return {
      emoji: '🎣',
      title: '釣りを5回してみよう',
      description: '釣りでレアアイテムが手に入ることも！まずは挑戦してみましょう。',
      conditions: [{ text: `釣りを5回行う（現在${fishingScore}回）`, met: fishingScore >= 5 }],
      reward: [{ text: 'レアアイテム・素材獲得チャンス' }],
      targetTab: 'fishing',
      progress: { current: fishingScore, max: 5, label: '釣り回数' },
    };
  }

  // 4. PvP未体験
  if (level >= 20) {
    void ((player.totalWagered ?? 0) > 0 || hasGambled);
    // PvP記録はないので、ギャンブルの対戦履歴で代用（pvp専用フィールドなし）
    return {
      emoji: '⚔️',
      title: 'PvPに挑戦しよう',
      description: 'ギャンブル画面から他プレイヤーと対戦できます！',
      conditions: [
        { text: 'レベル20以上', met: level >= 20 },
      ],
      reward: [{ text: 'WC獲得・ランキング上昇' }],
      targetTab: 'gamble',
    };
  }

  // 5. デフォルト：素材集め
  return {
    emoji: '⛏️',
    title: 'レベルアップを目指そう',
    description: 'ダンジョンや採取でレベルを上げましょう！',
    conditions: [{ text: 'ダンジョンや採取を続ける', met: false }],
    reward: [{ text: '経験値・素材・ゴールド' }],
    targetTab: 'dungeon',
  };
}

export function NaviScreen() {
  const player = useGameStore(s => s.player);
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const changeGold = useGameStore(s => s.changeGold);
  const changeWealthCoin = useGameStore(s => s.changeWealthCoin);
  const addNotification = useGameStore(s => s.addNotification);

  const goal = useMemo(() => player ? computeGoal(player) : null, [
    player?.stats.level,
    player?.dungeonClearedCount,
    player?.fishingScore,
    player?.totalWagered,
    player?.missionProgress?.totalWagered,
    player?.missionProgress?.totalSlotPlays,
  ]);

  if (!player || !goal) return null;

  const allMet = goal.conditions.every(c => c.met);
  const progressPct = goal.progress ? Math.min(100, Math.round((goal.progress.current / goal.progress.max) * 100)) : null;

  const handleClaim = () => {
    if (!allMet) return;
    // 小額報酬付与
    changeGold(500);
    changeWealthCoin(100);
    addNotification('success', '🎉 目標達成！ 500G + 100WC 獲得！');
  };

  return (
    <div style={{ padding: '12px 12px 0' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.2rem' }}>🧭</span>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f0c060' }}>冒険ナビ</span>
        <span style={{ fontSize: '0.7rem', color: '#8a92b2', marginLeft: 4 }}>次に何をすべきか案内します</span>
      </div>

      {/* メインカード */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2035, #161b26)',
        border: '1px solid #2d3752',
        borderRadius: 12,
        padding: '16px',
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 背景装飾 */}
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '5rem', opacity: 0.06, pointerEvents: 'none', userSelect: 'none' }}>
          {goal.emoji}
        </div>

        {/* 現在のおすすめ */}
        <div style={{ fontSize: '0.65rem', color: '#5b8dee', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          現在のおすすめ
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          {goal.emoji} {goal.title}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginBottom: 12, lineHeight: 1.5 }}>
          {goal.description}
        </div>

        {/* 進捗バー */}
        {progressPct !== null && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8a92b2', marginBottom: 4 }}>
              <span>{goal.progress!.label}</span>
              <span>{goal.progress!.current} / {goal.progress!.max}</span>
            </div>
            <div style={{ background: '#0d0f14', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #5b8dee, #f0c060)',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* 達成条件 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.7rem', color: '#8a92b2', fontWeight: 700, marginBottom: 6 }}>達成条件</div>
          {goal.conditions.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
              <span style={{ color: c.met ? '#4caf87' : '#5b8dee', fontSize: '0.75rem', marginTop: 1, flexShrink: 0 }}>
                {c.met ? '✅' : '◻️'}
              </span>
              <span style={{ fontSize: '0.78rem', color: c.met ? '#4caf87' : '#c8d0e0', lineHeight: 1.4 }}>{c.text}</span>
            </div>
          ))}
        </div>

        {/* 報酬 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.7rem', color: '#8a92b2', fontWeight: 700, marginBottom: 6 }}>報酬</div>
          {goal.reward.map((r, i) => (
            <div key={i} style={{ fontSize: '0.78rem', color: '#f0c060', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🎁</span> {r.text}
            </div>
          ))}
          {allMet && (
            <div style={{ fontSize: '0.75rem', color: '#4caf87', marginTop: 4 }}>＋ 500G / 100WC（達成ボーナス）</div>
          )}
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab(goal.targetTab)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
              fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #5b8dee, #3a6fd0)', color: '#fff',
            }}
          >
            🗺️ 移動する
          </button>
          {allMet && (
            <button
              onClick={handleClaim}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #f0a830, #e07820)', color: '#fff',
              }}
            >
              🎉 報酬を受け取る
            </button>
          )}
        </div>
      </div>

      {/* ダンジョン進行状況 */}
      <DungeonProgress player={player} />
    </div>
  );
}

function DungeonProgress({ player }: { player: PlayerData }) {
  const cleared = player.dungeonClearedCount ?? {};

  return (
    <div style={{
      background: '#161b26',
      border: '1px solid #2d3752',
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 12,
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8a92b2', marginBottom: 10 }}>ダンジョン進行状況</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {MAIN_DUNGEON_ORDER.map((id, idx) => {
          const dungeon = DUNGEON_MASTER[id];
          if (!dungeon) return null;
          const clears = cleared[id] ?? 0;
          const done = clears > 0;
          const reqLevel = dungeon.requiredLevel ?? 1;
          const canTry = player.stats.level >= reqLevel;
          const prevDone = idx === 0 || (cleared[MAIN_DUNGEON_ORDER[idx - 1]] ?? 0) > 0;

          let statusText = '🔒';
          if (done) { statusText = '✅'; }
          else if (canTry && prevDone) { statusText = '👉'; }

          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', width: 20, textAlign: 'center' }}>{statusText}</span>
              <span style={{ fontSize: '0.78rem', color: done ? '#4caf87' : canTry && prevDone ? '#f0c060' : '#4a5070', flex: 1 }}>
                {dungeon.name}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#4a5070' }}>Lv{reqLevel}</span>
              {clears > 0 && <span style={{ fontSize: '0.65rem', color: '#5b8dee' }}>{clears}回</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
