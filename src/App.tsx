// src/App.tsx
// メインアプリケーション。タブ切り替えとグローバルUIを管理する。

import { useGameStore } from './stores/gameStore';
import { useAuth } from './hooks/useAuth';
import { useAutoSave } from './hooks/useAutoSave';
import type { TabId } from './types/game';

// --- 画面コンポーネント（後続実装） ---
import { GatheringScreen } from './components/screens/GatheringScreen';
import { MarketScreen } from './components/screens/MarketScreen';
import { DungeonScreen } from './components/screens/DungeonScreen';
import { GambleScreen } from './components/screens/GambleScreen';
import { StatusScreen } from './components/screens/StatusScreen';

// ============================================================
// === タブ設定（新しいタブを追加するにはここに追記するだけ） ===
// ============================================================
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'gathering', label: '採取',     icon: '⛏️' },
  { id: 'market',    label: '市場',     icon: '🏪' },
  { id: 'dungeon',   label: 'ダンジョン', icon: '⚔️' },
  { id: 'gamble',    label: 'ギャンブル', icon: '🎰' },
  { id: 'status',   label: 'ステータス',  icon: '📊' },
];

// ============================================================
// === サブコンポーネント ===
// ============================================================

/** 読み込み画面 */
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">⚔️</div>
        <h1 className="loading-title">RPG LIFE</h1>
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
        <p className="loading-text">データを読み込んでいます...</p>
      </div>
    </div>
  );
}

/** 上部ステータスバー */
function StatusBar() {
  const player = useGameStore((s) => s.player);
  const isSaving = useGameStore((s) => s.isSaving);
  const saveGame = useGameStore((s) => s.saveGame);

  if (!player) return null;

  const hpPercent = (player.stats.hp / player.stats.maxHp) * 100;
  const expPercent =
    player.stats.level < 200
      ? (player.stats.exp / player.stats.expToNextLevel) * 100
      : 100;
  const satietyPercent = (player.stats.satiety / player.stats.maxSatiety) * 100;

  return (
    <header className="status-bar">
      <div className="status-player-info">
        <span className="status-name">⚔️ {player.displayName}</span>
        <span className="status-level">Lv.{player.stats.level}</span>
        <span className="status-gold">💰 {player.gold.toLocaleString()}G</span>
      </div>

      <div className="status-bars">
        <div className="mini-bar-wrap" title={`HP: ${player.stats.hp}/${player.stats.maxHp}`}>
          <span className="mini-bar-icon">❤️</span>
          <div className="mini-bar">
            <div className="mini-bar-fill hp" style={{ width: `${hpPercent}%` }} />
          </div>
        </div>

        <div className="mini-bar-wrap" title={`満腹度: ${player.stats.satiety}/${player.stats.maxSatiety}`}>
          <span className="mini-bar-icon">🍖</span>
          <div className="mini-bar">
            <div className="mini-bar-fill satiety" style={{ width: `${satietyPercent}%` }} />
          </div>
        </div>

        <div className="mini-bar-wrap" title={`EXP: ${player.stats.exp}/${player.stats.expToNextLevel}`}>
          <span className="mini-bar-icon">✨</span>
          <div className="mini-bar">
            <div className="mini-bar-fill exp" style={{ width: `${expPercent}%` }} />
          </div>
        </div>
      </div>

      <button
        className={`save-btn ${isSaving ? 'saving' : ''}`}
        onClick={saveGame}
        disabled={isSaving}
      >
        {isSaving ? '保存中...' : '💾 セーブ'}
      </button>
    </header>
  );
}

/** タブナビゲーション */
function TabNav() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  return (
    <nav className="tab-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

/** 通知トースト */
function NotificationToast() {
  const notifications = useGameStore((s) => s.notifications);
  const remove = useGameStore((s) => s.removeNotification);

  return (
    <div className="notification-container">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`notification notification-${n.type}`}
          onClick={() => remove(n.id)}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}

/** アクティブなタブに応じた画面を描画 */
function ActiveScreen() {
  const activeTab = useGameStore((s) => s.activeTab);

  switch (activeTab) {
    case 'gathering': return <GatheringScreen />;
    case 'market':    return <MarketScreen />;
    case 'dungeon':   return <DungeonScreen />;
    case 'gamble':    return <GambleScreen />;
    case 'status':    return <StatusScreen />;
    default:          return <GatheringScreen />;
  }
}

// ============================================================
// === メインアプリ ===
// ============================================================
export default function App() {
  // 認証フックを起動（匿名ログイン + データロード）
  useAuth();
  // 自動セーブフックを起動
  useAutoSave();

  const isAuthLoading = useGameStore((s) => s.isAuthLoading);
  const player = useGameStore((s) => s.player);

  if (isAuthLoading || !player) {
    return <LoadingScreen />;
  }

  return (
    <div className="app">
      <StatusBar />
      <TabNav />
      <main className="main-content">
        <ActiveScreen />
      </main>
      <NotificationToast />
    </div>
  );
}
