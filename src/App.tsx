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
import { AquariumScreen }  from './components/screens/AquariumScreen';
import { subscribeSoldNotifications, markSoldNotificationRead, subscribeMaintenanceStatus, setPlayerActivity, subscribeTabMaintenance, subscribeActivityFeed } from './services/multiplayer';
import type { TabMaintenanceConfig } from './services/multiplayer';
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
  { id:'aquarium',  label:'水族館',   icon:'fishing_rod' },
  { id:'crafting',  label:'製作',     icon:'hammer' },
  { id:'market',    label:'市場',     icon:'market' },
  { id:'dungeon',   label:'ダンジョン', icon:'swords' },
  { id:'gamble',    label:'ギャンブル', icon:'slot_machine' },
  { id:'online',    label:'オンライン', icon:'globe' },
  { id:'status',    label:'状態',     icon:'chart' },
];

// ============================================================
// ローディングテーマ定義（15種）
// ============================================================
interface LoadingTheme {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  bg: string;
  accent: string;
  ember: string;
  ring1: string;
  ring2: string;
  ring3: string;
  barGradient: string;
  glow: string;
  titleColor: string;
  grid: string;
  hints: string[];
  progressLabels: [string, string, string, string]; // 0-30%, 30-60%, 60-90%, 90-100%
  particle: 'ember' | 'star' | 'bubble' | 'petal' | 'spark';
  bgPattern: 'rune' | 'hex' | 'wave' | 'circuit' | 'none';
}

const LOADING_THEMES: LoadingTheme[] = [
  {
    id: 'dungeon', icon: '⚔️', title: 'ABYSS DUNGEON', subtitle: 'DESCENT INTO DARKNESS',
    bg: 'radial-gradient(ellipse at 50% 60%, #1a0000 0%, #0a0000 50%, #000 100%)',
    accent: '#cc2200', ember: '#ff4400', ring1: 'rgba(200,30,0,0.18)', ring2: 'rgba(255,60,0,0.13)', ring3: 'rgba(200,30,0,0.28)',
    barGradient: 'linear-gradient(90deg, #5a0000 0%, #aa1100 20%, #ff3300 45%, #ff6600 60%, #ffaa00 75%, #ff6600 85%, #ff3300 100%)',
    glow: 'drop-shadow(0 0 12px #cc2200) drop-shadow(0 0 30px #ff4400)',
    titleColor: '#ff4400', grid: 'rgba(200,30,0,0.04)',
    hints: ['⚔️ モンスターを召喚しています', '🐉 ダンジョンを生成しています', '💀 敵の配置を決めています', '🗡️ 武器に魔力を込めています'],
    progressLabels: ['モンスター召喚中...', '地下迷宮生成中...', 'ボス配置中...', '戦闘準備完了...'],
    particle: 'ember', bgPattern: 'rune',
  },
  {
    id: 'astral', icon: '🌌', title: 'ASTRAL REALM', subtitle: 'BEYOND THE STARS',
    bg: 'radial-gradient(ellipse at 50% 60%, #050012 0%, #020008 50%, #000 100%)',
    accent: '#8833ff', ember: '#aa66ff', ring1: 'rgba(136,51,255,0.18)', ring2: 'rgba(170,100,255,0.13)', ring3: 'rgba(136,51,255,0.28)',
    barGradient: 'linear-gradient(90deg, #2a0060 0%, #5500bb 20%, #8833ff 45%, #bb66ff 60%, #eeccff 75%, #bb66ff 85%, #8833ff 100%)',
    glow: 'drop-shadow(0 0 12px #8833ff) drop-shadow(0 0 30px #bb66ff)',
    titleColor: '#bb66ff', grid: 'rgba(136,51,255,0.04)',
    hints: ['🌌 星座を配置しています', '✨ 宇宙の法則を記述しています', '🪐 惑星軌道を計算しています', '💫 星の力を収束しています'],
    progressLabels: ['宇宙接続中...', '星座マッピング中...', '異次元接続中...', '転移準備完了...'],
    particle: 'star', bgPattern: 'hex',
  },
  {
    id: 'fishing', icon: '🎣', title: 'DAWN FISHING', subtitle: 'WHERE THE RIVER SINGS',
    bg: 'radial-gradient(ellipse at 50% 40%, #0a0800 0%, #050600 50%, #000 100%)',
    accent: '#ff8800', ember: '#ffaa33', ring1: 'rgba(255,140,0,0.15)', ring2: 'rgba(255,180,0,0.12)', ring3: 'rgba(255,140,0,0.25)',
    barGradient: 'linear-gradient(90deg, #3a2000 0%, #885500 20%, #ff8800 45%, #ffbb00 60%, #ffe080 75%, #ffbb00 85%, #ff8800 100%)',
    glow: 'drop-shadow(0 0 12px #ff8800) drop-shadow(0 0 30px #ffaa33)',
    titleColor: '#ffaa33', grid: 'rgba(255,140,0,0.03)',
    hints: ['🎣 釣り場に魚を放流しています', '🌊 水流を設定しています', '🐟 魚のデータを読込んでいます', '🌅 夜明けを準備しています'],
    progressLabels: ['釣り場接続中...', '魚群配置中...', 'レア魚召喚中...', '釣り糸を垂らす準備完了...'],
    particle: 'bubble', bgPattern: 'wave',
  },
  {
    id: 'forge', icon: '🔨', title: 'SACRED FORGE', subtitle: 'IRON AND FLAME',
    bg: 'radial-gradient(ellipse at 50% 70%, #120400 0%, #080200 50%, #000 100%)',
    accent: '#ff5500', ember: '#ff7700', ring1: 'rgba(255,85,0,0.18)', ring2: 'rgba(255,120,0,0.13)', ring3: 'rgba(255,85,0,0.28)',
    barGradient: 'linear-gradient(90deg, #3a0800 0%, #882200 20%, #ff5500 45%, #ff8800 60%, #ffcc44 75%, #ff8800 85%, #ff5500 100%)',
    glow: 'drop-shadow(0 0 12px #ff5500) drop-shadow(0 0 30px #ff7700)',
    titleColor: '#ff8800', grid: 'rgba(255,85,0,0.04)',
    hints: ['🔨 鍛冶炉に火を入れています', '⚒️ 鉱石を精錬しています', '🌡️ 炎の温度を調整しています', '⚙️ 設計図を展開しています'],
    progressLabels: ['炉に火入れ中...', '鉱石精錬中...', '装備鍛造中...', '焼き入れ完了...'],
    particle: 'spark', bgPattern: 'circuit',
  },
  {
    id: 'crystal', icon: '💎', title: 'CRYSTAL CAVERN', subtitle: 'HEART OF ICE',
    bg: 'radial-gradient(ellipse at 50% 60%, #000a1a 0%, #000510 50%, #000 100%)',
    accent: '#0099ee', ember: '#33ccff', ring1: 'rgba(0,153,238,0.15)', ring2: 'rgba(51,204,255,0.12)', ring3: 'rgba(0,153,238,0.25)',
    barGradient: 'linear-gradient(90deg, #002244 0%, #0055aa 20%, #0099ee 45%, #33ccff 60%, #aaeeff 75%, #33ccff 85%, #0099ee 100%)',
    glow: 'drop-shadow(0 0 12px #0099ee) drop-shadow(0 0 30px #33ccff)',
    titleColor: '#33ccff', grid: 'rgba(0,153,238,0.04)',
    hints: ['💎 水晶を配置しています', '❄️ 氷結魔法を展開しています', '🔮 魔力の流れを設定しています', '✨ 光の屈折率を計算しています'],
    progressLabels: ['氷結接続中...', '水晶生成中...', 'アイテム配置中...', '凍結完了...'],
    particle: 'star', bgPattern: 'hex',
  },
  {
    id: 'skycastle', icon: '🏯', title: 'SKY CITADEL', subtitle: 'ABOVE THE CLOUDS',
    bg: 'radial-gradient(ellipse at 50% 30%, #0d0a00 0%, #080700 50%, #000 100%)',
    accent: '#ddaa00', ember: '#ffcc33', ring1: 'rgba(221,170,0,0.15)', ring2: 'rgba(255,200,0,0.12)', ring3: 'rgba(221,170,0,0.25)',
    barGradient: 'linear-gradient(90deg, #3a2a00 0%, #886600 20%, #ddaa00 45%, #ffcc33 60%, #fff0a0 75%, #ffcc33 85%, #ddaa00 100%)',
    glow: 'drop-shadow(0 0 12px #ddaa00) drop-shadow(0 0 30px #ffcc33)',
    titleColor: '#ffcc33', grid: 'rgba(221,170,0,0.03)',
    hints: ['🏯 天空城を建設しています', '☁️ 雲の基盤を固めています', '🌤️ 風の流れを設定しています', '👑 王族の間を準備しています'],
    progressLabels: ['天空接続中...', '城郭生成中...', 'ボス配置中...', '天空への道が開く...'],
    particle: 'ember', bgPattern: 'rune',
  },
  {
    id: 'volcano', icon: '🌋', title: 'VOLCANIC ABYSS', subtitle: 'BORN OF MAGMA',
    bg: 'radial-gradient(ellipse at 50% 80%, #1a0300 0%, #0a0100 50%, #000 100%)',
    accent: '#ff3300', ember: '#ff5500', ring1: 'rgba(255,51,0,0.18)', ring2: 'rgba(255,80,0,0.13)', ring3: 'rgba(255,51,0,0.28)',
    barGradient: 'linear-gradient(90deg, #440000 0%, #992200 20%, #ff3300 45%, #ff6600 60%, #ffaa00 75%, #ff6600 85%, #ff3300 100%)',
    glow: 'drop-shadow(0 0 15px #ff3300) drop-shadow(0 0 35px #ff5500)',
    titleColor: '#ff6600', grid: 'rgba(255,51,0,0.05)',
    hints: ['🌋 マグマを注入しています', '🔥 噴火口を設定しています', '💥 爆発エフェクトを配置しています', '🪨 溶岩石を配置しています'],
    progressLabels: ['マグマ注入中...', '噴火口生成中...', '溶岩流配置中...', '灼熱準備完了...'],
    particle: 'spark', bgPattern: 'circuit',
  },
  {
    id: 'blackmarket', icon: '💰', title: 'SHADOW MARKET', subtitle: 'DEALS IN THE DARK',
    bg: 'radial-gradient(ellipse at 50% 60%, #010800 0%, #010500 50%, #000 100%)',
    accent: '#00cc44', ember: '#33ee66', ring1: 'rgba(0,204,68,0.15)', ring2: 'rgba(51,238,102,0.12)', ring3: 'rgba(0,204,68,0.25)',
    barGradient: 'linear-gradient(90deg, #002200 0%, #005500 20%, #00cc44 45%, #33ee66 60%, #aaffcc 75%, #33ee66 85%, #00cc44 100%)',
    glow: 'drop-shadow(0 0 12px #00cc44) drop-shadow(0 0 30px #33ee66)',
    titleColor: '#33ee66', grid: 'rgba(0,204,68,0.03)',
    hints: ['💰 商品を仕入れています', '🏷️ 価格を設定しています', '📦 在庫を確認しています', '🤝 取引先を接続しています'],
    progressLabels: ['市場接続中...', '価格更新中...', '在庫チェック中...', '取引開始準備完了...'],
    particle: 'ember', bgPattern: 'circuit',
  },
  {
    id: 'gamble', icon: '🎲', title: 'FORTUNE PALACE', subtitle: 'CHANCE AND FATE',
    bg: 'radial-gradient(ellipse at 50% 60%, #0d0020 0%, #060010 50%, #000 100%)',
    accent: '#aa44ff', ember: '#cc77ff', ring1: 'rgba(170,68,255,0.15)', ring2: 'rgba(200,110,255,0.12)', ring3: 'rgba(170,68,255,0.25)',
    barGradient: 'linear-gradient(90deg, #2a0060 0%, #6600bb 20%, #aa44ff 45%, #cc88ff 60%, #eeccff 75%, #cc88ff 85%, #aa44ff 100%)',
    glow: 'drop-shadow(0 0 12px #aa44ff) drop-shadow(0 0 30px #cc77ff)',
    titleColor: '#cc88ff', grid: 'rgba(170,68,255,0.04)',
    hints: ['🎲 乱数を生成しています', '🎰 スロットを設定しています', '🃏 カードデッキを切っています', '🍀 運命の歯車を回しています'],
    progressLabels: ['乱数生成中...', 'テーブル設定中...', 'ハウスエッジ調整中...', '運命の扉が開く...'],
    particle: 'spark', bgPattern: 'hex',
  },
  {
    id: 'aquarium', icon: '🐠', title: 'DEEP AQUARIUM', subtitle: 'TREASURES OF THE SEA',
    bg: 'radial-gradient(ellipse at 50% 40%, #000815 0%, #000510 50%, #000 100%)',
    accent: '#0077cc', ember: '#0099ff', ring1: 'rgba(0,119,204,0.15)', ring2: 'rgba(0,153,255,0.12)', ring3: 'rgba(0,119,204,0.25)',
    barGradient: 'linear-gradient(90deg, #001a33 0%, #004488 20%, #0077cc 45%, #0099ff 60%, #88ddff 75%, #0099ff 85%, #0077cc 100%)',
    glow: 'drop-shadow(0 0 12px #0077cc) drop-shadow(0 0 30px #0099ff)',
    titleColor: '#0099ff', grid: 'rgba(0,119,204,0.03)',
    hints: ['🐠 魚の生態を設定しています', '🌊 水流シミュレーション中', '🪸 珊瑚礁を生成しています', '🐙 深海生物を配置しています'],
    progressLabels: ['深海接続中...', '水槽充填中...', '魚群配置中...', '観察準備完了...'],
    particle: 'bubble', bgPattern: 'wave',
  },
  {
    id: 'lycoris', icon: '🌺', title: 'PHANTOM REALM', subtitle: 'WHERE FLOWERS BLOOM',
    bg: 'radial-gradient(ellipse at 50% 60%, #120010 0%, #0a0008 50%, #000 100%)',
    accent: '#cc2299', ember: '#ee44bb', ring1: 'rgba(204,34,153,0.15)', ring2: 'rgba(238,68,187,0.12)', ring3: 'rgba(204,34,153,0.25)',
    barGradient: 'linear-gradient(90deg, #330022 0%, #880055 20%, #cc2299 45%, #ee44bb 60%, #ffbbee 75%, #ee44bb 85%, #cc2299 100%)',
    glow: 'drop-shadow(0 0 12px #cc2299) drop-shadow(0 0 30px #ee44bb)',
    titleColor: '#ee44bb', grid: 'rgba(204,34,153,0.03)',
    hints: ['🌺 彼岸花を咲かせています', '🌙 月の光を降り注いでいます', '👻 幽霊をこの世に呼び戻しています', '🕯️ 幻影の炎を灯しています'],
    progressLabels: ['幽玄接続中...', '花弁展開中...', '霊力収束中...', '幻の扉が開く...'],
    particle: 'petal', bgPattern: 'none',
  },
  {
    id: 'guild', icon: '🏰', title: 'GUILD FORTRESS', subtitle: 'HONOR AND GLORY',
    bg: 'radial-gradient(ellipse at 50% 60%, #020800 0%, #010400 50%, #000 100%)',
    accent: '#448800', ember: '#66bb00', ring1: 'rgba(68,136,0,0.15)', ring2: 'rgba(102,187,0,0.12)', ring3: 'rgba(68,136,0,0.25)',
    barGradient: 'linear-gradient(90deg, #0a1a00 0%, #224400 20%, #448800 45%, #66bb00 60%, #aaee44 75%, #66bb00 85%, #448800 100%)',
    glow: 'drop-shadow(0 0 12px #448800) drop-shadow(0 0 30px #66bb00)',
    titleColor: '#88cc22', grid: 'rgba(68,136,0,0.03)',
    hints: ['🏰 ギルドホールを建設しています', '📋 クエストを配置しています', '🤝 メンバー名簿を更新しています', '🏆 ランキングを集計しています'],
    progressLabels: ['ギルド接続中...', 'クエスト更新中...', 'メンバー確認中...', '出陣準備完了...'],
    particle: 'ember', bgPattern: 'rune',
  },
  {
    id: 'storm', icon: '⛵', title: 'STORMY SEAS', subtitle: 'BRAVE THE TEMPEST',
    bg: 'radial-gradient(ellipse at 50% 30%, #000810 0%, #000508 50%, #000 100%)',
    accent: '#3366aa', ember: '#5588cc', ring1: 'rgba(51,102,170,0.15)', ring2: 'rgba(85,136,204,0.12)', ring3: 'rgba(51,102,170,0.25)',
    barGradient: 'linear-gradient(90deg, #001133 0%, #002266 20%, #3366aa 45%, #5588cc 60%, #99bbee 75%, #5588cc 85%, #3366aa 100%)',
    glow: 'drop-shadow(0 0 12px #3366aa) drop-shadow(0 0 30px #5588cc)',
    titleColor: '#88aadd', grid: 'rgba(51,102,170,0.04)',
    hints: ['⛵ 船を進水させています', '🌊 波のシミュレーション中', '⚡ 嵐の強度を設定しています', '🧭 航路を計算しています'],
    progressLabels: ['海図読込中...', '波浪生成中...', '嵐の目接近中...', '出航準備完了...'],
    particle: 'bubble', bgPattern: 'wave',
  },
  {
    id: 'ruin', icon: '🗿', title: 'ANCIENT RUINS', subtitle: 'ECHOES OF THE PAST',
    bg: 'radial-gradient(ellipse at 50% 60%, #0a0800 0%, #050400 50%, #000 100%)',
    accent: '#aa8833', ember: '#ccaa55', ring1: 'rgba(170,136,51,0.15)', ring2: 'rgba(204,170,85,0.12)', ring3: 'rgba(170,136,51,0.25)',
    barGradient: 'linear-gradient(90deg, #2a1a00 0%, #664400 20%, #aa8833 45%, #ccaa55 60%, #eedd99 75%, #ccaa55 85%, #aa8833 100%)',
    glow: 'drop-shadow(0 0 12px #aa8833) drop-shadow(0 0 30px #ccaa55)',
    titleColor: '#ccaa55', grid: 'rgba(170,136,51,0.03)',
    hints: ['🗿 古代文字を解読しています', '⚱️ 遺跡を発掘しています', '📜 歴史の断片を再構築しています', '🔍 隠された扉を探しています'],
    progressLabels: ['遺跡探索中...', '古代文字解読中...', '封印解除中...', '歴史の謎が明かされる...'],
    particle: 'ember', bgPattern: 'rune',
  },
  {
    id: 'apocalypse', icon: '☄️', title: 'END OF TIME', subtitle: 'THE FINAL HORIZON',
    bg: 'radial-gradient(ellipse at 50% 50%, #030004 0%, #010002 50%, #000 100%)',
    accent: '#6644aa', ember: '#9966cc', ring1: 'rgba(102,68,170,0.15)', ring2: 'rgba(153,102,204,0.12)', ring3: 'rgba(102,68,170,0.25)',
    barGradient: 'linear-gradient(90deg, #110022 0%, #330066 20%, #6644aa 45%, #9966cc 60%, #ccaaee 75%, #9966cc 85%, #6644aa 100%)',
    glow: 'drop-shadow(0 0 12px #6644aa) drop-shadow(0 0 35px #9966cc)',
    titleColor: '#aa88dd', grid: 'rgba(102,68,170,0.04)',
    hints: ['☄️ 世界の終わりを計算しています', '🌑 闇を展開しています', '💫 最後の星が輝いています', '∞ 永遠の静寂が訪れています'],
    progressLabels: ['終末接続中...', '時の流れ停止中...', '最後の審判準備中...', 'エンドロール開幕...'],
    particle: 'star', bgPattern: 'hex',
  },
];

// 起動時に1テーマをランダム選択（セッション固定）
const SELECTED_THEME = LOADING_THEMES[Math.floor(Math.random() * LOADING_THEMES.length)];

const LOADING_SCREEN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');

  @keyframes rpg-flicker {
    0%,100% { opacity:1; }
    25%      { opacity:.92; }
    50%      { opacity:.97; }
    75%      { opacity:.88; }
  }
  @keyframes rpg-pulse-ring {
    0%   { transform:scale(0.85); opacity:0.7; }
    50%  { transform:scale(1.12); opacity:0.3; }
    100% { transform:scale(0.85); opacity:0.7; }
  }
  @keyframes rpg-rotate-rune {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }
  @keyframes rpg-rotate-rune-rev {
    from { transform:rotate(360deg); }
    to   { transform:rotate(0deg); }
  }
  @keyframes rpg-sword-glow {
    0%,100% { transform: translateY(0px) rotate(-5deg); }
    50%     { transform: translateY(-12px) rotate(5deg); }
  }
  @keyframes rpg-ember {
    0%   { transform:translateY(0) translateX(0) scale(1); opacity:0.9; }
    100% { transform:translateY(-130px) translateX(var(--dx,10px)) scale(0.2); opacity:0; }
  }
  @keyframes rpg-star-fall {
    0%   { transform:translateY(-20px) translateX(0) scale(1) rotate(0deg); opacity:0.9; }
    100% { transform:translateY(100px) translateX(var(--dx,5px)) scale(0.4) rotate(180deg); opacity:0; }
  }
  @keyframes rpg-bubble-rise {
    0%   { transform:translateY(0) translateX(0) scale(1); opacity:0.6; }
    50%  { transform:translateY(-60px) translateX(var(--dx,8px)) scale(1.1); opacity:0.8; }
    100% { transform:translateY(-120px) translateX(var(--dx2,12px)) scale(0.5); opacity:0; }
  }
  @keyframes rpg-petal-fall {
    0%   { transform:translateY(-10px) translateX(0) rotate(0deg); opacity:0.8; }
    100% { transform:translateY(120px) translateX(var(--dx,20px)) rotate(var(--rot,360deg)); opacity:0; }
  }
  @keyframes rpg-spark-fly {
    0%   { transform:translateX(0) translateY(0) scaleX(1); opacity:1; }
    100% { transform:translateX(var(--dx,60px)) translateY(var(--dy,-20px)) scaleX(0.3); opacity:0; }
  }
  @keyframes rpg-bar-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes rpg-typewriter-cursor {
    0%,100% { opacity:1; }
    50%      { opacity:0; }
  }
  @keyframes rpg-particle-orbit {
    from { transform: rotate(var(--start-deg)) translateX(var(--r)) rotate(calc(var(--start-deg) * -1)); }
    to   { transform: rotate(calc(var(--start-deg) + 360deg)) translateX(var(--r)) rotate(calc((var(--start-deg) + 360deg) * -1)); }
  }
  @keyframes rpg-rules-in {
    0%   { opacity:0; transform:scale(0.92) translateY(20px); }
    100% { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes rpg-countdown-pulse {
    0%,100% { transform:scale(1); }
    50%     { transform:scale(1.15); }
  }
  @keyframes rpg-border-flow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes rpg-hint-card-in {
    0%   { opacity:0; transform:translateX(-12px); }
    100% { opacity:1; transform:translateX(0); }
  }
  @keyframes rpg-svg-spin-slow {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }
  @keyframes rpg-svg-pulse {
    0%,100% { opacity:0.06; }
    50%      { opacity:0.12; }
  }
`;

// ゲーム全体アニメーションCSS（<GlobalAnimations />でbodyに注入）
const GLOBAL_ANIM_CSS = `
  @keyframes fadeSlideUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeSlideIn {
    from { opacity:0; transform:translateX(-10px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes popIn {
    0%   { opacity:0; transform:scale(0.7); }
    70%  { opacity:1; transform:scale(1.05); }
    100% { transform:scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes pulseGlow {
    0%,100% { box-shadow: 0 0 8px rgba(91,141,238,0.4); }
    50%     { box-shadow: 0 0 20px rgba(91,141,238,0.8), 0 0 40px rgba(91,141,238,0.4); }
  }
  @keyframes badgePop {
    0%   { opacity:0; transform:scale(0) rotate(-20deg); }
    60%  { opacity:1; transform:scale(1.15) rotate(5deg); }
    100% { transform:scale(1) rotate(0); }
  }
  @keyframes floatUp {
    0%   { opacity:1; transform:translateY(0); }
    100% { opacity:0; transform:translateY(-40px); }
  }
  @keyframes hpBarAnim {
    0%   { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes tabActive {
    from { transform:scale(0.9); opacity:0.6; }
    to   { transform:scale(1);   opacity:1; }
  }
  @keyframes notifSlideIn {
    from { opacity:0; transform:translateX(40px) scale(0.9); }
    to   { opacity:1; transform:translateX(0)    scale(1);   }
  }
  @keyframes goldSpin {
    0%   { transform:rotateY(0deg); }
    100% { transform:rotateY(360deg); }
  }
  @keyframes levelUpBurst {
    0%   { opacity:1; transform:scale(1); }
    50%  { opacity:0.8; transform:scale(1.4); }
    100% { opacity:0; transform:scale(2); }
  }
  /* ナビバー・EXPバー用 */
  .rpg-tab-active {
    animation: tabActive 0.2s ease forwards;
  }
  /* 通知 */
  .rpg-notif-enter {
    animation: notifSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  /* カード汎用 */
  .rpg-card-appear {
    animation: fadeSlideUp 0.3s ease forwards;
  }
  /* アイテム獲得バッジ */
  .rpg-badge-pop {
    animation: badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }
  /* EXPバーシマー */
  .rpg-exp-shimmer {
    background: linear-gradient(90deg, #5b8dee 0%, #8ab0ff 40%, #5b8dee 60%, #3a6fd0 100%);
    background-size: 200% 100%;
    animation: hpBarAnim 2s linear infinite;
  }
  /* HPバーシマー */
  .rpg-hp-shimmer {
    background: linear-gradient(90deg, #4caf87 0%, #7dd9b0 40%, #4caf87 60%, #2d8a60 100%);
    background-size: 200% 100%;
    animation: hpBarAnim 2.5s linear infinite;
  }
  /* 全ボタン共通の軽いタップ・ホバー演出（インラインstyleは上書きしない） */
  button {
    transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
  }
  button:active:not(:disabled) {
    transform: scale(0.96);
    filter: brightness(0.94);
  }
  @media (hover: hover) {
    button:hover:not(:disabled) {
      filter: brightness(1.06);
    }
  }
`;

function GlobalAnimations() {
  return <style>{GLOBAL_ANIM_CSS}</style>;
}


// ============================================================
// LoadingScreen パーティクル生成ヘルパー
// ============================================================
function genParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    size: 3 + Math.random() * 6,
    delay: Math.random() * 4,
    dx: (Math.random() - 0.5) * 60,
    dx2: (Math.random() - 0.5) * 30,
    dy: -(20 + Math.random() * 40),
    rot: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
    dur: 2.2 + Math.random() * 2.2,
  }));
}

// ============================================================
// 背景SVGパターン
// ============================================================
function BgPattern({ pattern, accent }: { pattern: LoadingTheme['bgPattern']; accent: string }) {
  if (pattern === 'none') return null;

  if (pattern === 'rune') {
    return (
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', animation:'rpg-svg-pulse 4s ease-in-out infinite' }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="runePattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="30" fill="none" stroke={accent} strokeWidth="0.5" strokeDasharray="6 10" opacity="0.25"/>
            <line x1="40" y1="10" x2="40" y2="70" stroke={accent} strokeWidth="0.4" opacity="0.15"/>
            <line x1="10" y1="40" x2="70" y2="40" stroke={accent} strokeWidth="0.4" opacity="0.15"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#runePattern)"/>
      </svg>
    );
  }
  if (pattern === 'hex') {
    return (
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', animation:'rpg-svg-pulse 5s ease-in-out infinite' }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexPattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 56,16 56,44 30,58 4,44 4,16" fill="none" stroke={accent} strokeWidth="0.6" opacity="0.2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexPattern)"/>
      </svg>
    );
  }
  if (pattern === 'wave') {
    return (
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.12 }}
        xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        {[0,1,2,3,4].map(i => (
          <path key={i}
            d={`M0,${100+i*60} Q200,${60+i*60} 400,${100+i*60} Q600,${140+i*60} 800,${100+i*60} L800,${200+i*60} Q600,${160+i*60} 400,${200+i*60} Q200,${240+i*60} 0,${200+i*60} Z`}
            fill={accent} opacity={0.15 - i * 0.02}
          />
        ))}
      </svg>
    );
  }
  if (pattern === 'circuit') {
    return (
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', animation:'rpg-svg-pulse 3s ease-in-out infinite' }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuitPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M10,50 L40,50 L40,20 L70,20" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.2"/>
            <path d="M70,50 L90,50" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.2"/>
            <path d="M50,70 L50,90" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.2"/>
            <circle cx="40" cy="50" r="2.5" fill={accent} opacity="0.25"/>
            <circle cx="70" cy="20" r="2.5" fill={accent} opacity="0.25"/>
            <circle cx="70" cy="50" r="2.5" fill={accent} opacity="0.25"/>
            <circle cx="50" cy="70" r="2.5" fill={accent} opacity="0.25"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuitPattern)"/>
      </svg>
    );
  }
  return null;
}

// ============================================================
// LoadingScreen 本体
// ============================================================
function LoadingScreen({ authReady = false, onDone }: { authReady?: boolean; onDone?: () => void }) {
  const theme = SELECTED_THEME;
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'rules'>('loading');
  const [countdown, setCountdown] = useState(5);
  const [particles] = useState(() => genParticles(22));

  // タイプライター用
  const [hintIdx, setHintIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const authReadyRef = useRef(authReady);
  useEffect(() => { authReadyRef.current = authReady; }, [authReady]);

  // loading phase: 最低5秒 + 認証完了
  useEffect(() => {
    if (phase !== 'loading') return;
    const start = Date.now();
    const MIN_DURATION = 5000;
    let rafId: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const ready = authReadyRef.current;
      const p = ready
        ? Math.min(100, (elapsed / MIN_DURATION) * 100)
        : Math.min(90, (elapsed / MIN_DURATION) * 90);
      setProgress(p);
      if (p >= 100) { setTimeout(() => setPhase('rules'), 200); return; }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [phase]);

  // タイプライター演出
  useEffect(() => {
    if (phase !== 'loading') return;
    const hints = theme.hints;
    let charIdx = 0;
    const fullText = hints[hintIdx];
    setDisplayedText('');
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      charIdx++;
      setDisplayedText(fullText.slice(0, charIdx));
      if (charIdx >= fullText.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
        // 1.8秒停止後に次のヒントへ
        setTimeout(() => {
          setHintIdx(i => (i + 1) % hints.length);
        }, 1800);
      }
    }, 45);
    return () => clearInterval(typeInterval);
  }, [hintIdx, phase, theme.hints]);

  // rules countdown
  useEffect(() => {
    if (phase !== 'rules') return;
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); onDone?.(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, onDone]);

  // プログレスラベル
  const progressLabel = progress < 30 ? theme.progressLabels[0]
    : progress < 60 ? theme.progressLabels[1]
    : progress < 90 ? theme.progressLabels[2]
    : theme.progressLabels[3];

  // リング色（テーマから）
  const ringSpeed1 = theme.particle === 'spark' ? '10s' : theme.particle === 'star' ? '22s' : '18s';
  const ringSpeed2 = theme.particle === 'spark' ? '7s' : '12s';

  return (
    <>
      <GlobalAnimations />
      <style>{LOADING_SCREEN_CSS}</style>
      <div style={{
        position:'fixed', inset:0, zIndex:9999,
        background: theme.bg,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        overflow:'hidden',
      }}>

        {/* 背景SVGパターン */}
        <BgPattern pattern={theme.bgPattern} accent={theme.accent} />

        {/* パーティクル */}
        {particles.map(p => {
          const pt = theme.particle;
          if (pt === 'ember') return (
            <div key={p.id} style={{
              position:'absolute', left:`${p.x}%`, bottom:`${p.y * 0.3}%`,
              width:p.size, height:p.size, borderRadius:'50%',
              background:`radial-gradient(circle, #fff 0%, ${theme.ember} 40%, ${theme.ember}88 100%)`,
              boxShadow:`0 0 ${p.size*2}px ${theme.ember}`,
              animation:`rpg-ember ${p.dur}s ease-out ${p.delay}s infinite`,
              ['--dx' as any]: `${p.dx}px`, pointerEvents:'none',
            }} />
          );
          if (pt === 'star') return (
            <div key={p.id} style={{
              position:'absolute', left:`${p.x}%`, top:`${p.y * 0.4}%`,
              width:p.size * 0.6, height:p.size * 2,
              borderRadius:'50%',
              background:`linear-gradient(180deg, #fff 0%, ${theme.ember} 50%, transparent 100%)`,
              opacity:0.85,
              animation:`rpg-star-fall ${p.dur}s ease-in ${p.delay}s infinite`,
              ['--dx' as any]: `${p.dx * 0.3}px`, pointerEvents:'none',
            }} />
          );
          if (pt === 'bubble') return (
            <div key={p.id} style={{
              position:'absolute', left:`${p.x}%`, bottom:`${p.y * 0.2}%`,
              width:p.size + 4, height:p.size + 4, borderRadius:'50%',
              border:`1px solid ${theme.ember}99`,
              background:`radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), ${theme.ember}22)`,
              animation:`rpg-bubble-rise ${p.dur + 1}s ease-in-out ${p.delay}s infinite`,
              ['--dx' as any]: `${p.dx * 0.5}px`, ['--dx2' as any]: `${p.dx2}px`,
              pointerEvents:'none',
            }} />
          );
          if (pt === 'petal') return (
            <div key={p.id} style={{
              position:'absolute', left:`${p.x}%`, top:`-5%`,
              width:p.size * 1.5, height:p.size * 0.7,
              borderRadius:'50% 50% 0 50%',
              background:`linear-gradient(135deg, ${theme.ember}cc, ${theme.ember}55)`,
              animation:`rpg-petal-fall ${p.dur + 1.5}s ease-in ${p.delay}s infinite`,
              ['--dx' as any]: `${p.dx}px`, ['--rot' as any]: `${p.rot}deg`,
              pointerEvents:'none',
            }} />
          );
          // spark
          return (
            <div key={p.id} style={{
              position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
              width:p.size * 2.5, height:Math.max(1.5, p.size * 0.4),
              borderRadius:2,
              background:`linear-gradient(90deg, transparent, ${theme.ember}, #fff)`,
              animation:`rpg-spark-fly ${0.4 + p.delay * 0.15}s ease-out ${p.delay * 0.3}s infinite`,
              ['--dx' as any]: `${p.dx}px`, ['--dy' as any]: `${p.dy * 0.3}px`,
              pointerEvents:'none',
            }} />
          );
        })}

        {phase === 'loading' && (
          <>
            {/* 魔法陣リング */}
            <div style={{
              position:'absolute', width:340, height:340, borderRadius:'50%',
              border:`1px solid ${theme.ring1}`,
              animation:`rpg-rotate-rune ${ringSpeed1} linear infinite`,
            }}>
              {/* ダッシュ装飾 */}
              <svg width="340" height="340" style={{ position:'absolute', inset:0 }} xmlns="http://www.w3.org/2000/svg">
                <circle cx="170" cy="170" r="168" fill="none" stroke={theme.accent} strokeWidth="1" strokeDasharray="10 20" opacity="0.3"/>
                {[0,45,90,135,180,225,270,315].map(deg => (
                  <circle key={deg}
                    cx={170 + 168 * Math.cos(deg * Math.PI/180)}
                    cy={170 + 168 * Math.sin(deg * Math.PI/180)}
                    r="3" fill={theme.accent} opacity="0.5"
                  />
                ))}
              </svg>
            </div>
            <div style={{
              position:'absolute', width:260, height:260, borderRadius:'50%',
              border:`1px solid ${theme.ring2}`,
              animation:`rpg-rotate-rune-rev ${ringSpeed2} linear infinite`,
            }}>
              <svg width="260" height="260" style={{ position:'absolute', inset:0 }} xmlns="http://www.w3.org/2000/svg">
                <circle cx="130" cy="130" r="128" fill="none" stroke={theme.accent} strokeWidth="0.5" strokeDasharray="4 12" opacity="0.25"/>
              </svg>
            </div>
            <div style={{
              position:'absolute', width:200, height:200, borderRadius:'50%',
              border:`2px solid ${theme.ring3}`,
              animation:'rpg-pulse-ring 3s ease-in-out infinite',
            }} />

            {/* テーマアイコン */}
            <div style={{
              fontSize:'5rem', zIndex:1, marginBottom:8,
              filter: theme.glow,
              animation:'rpg-sword-glow 3.5s ease-in-out infinite',
            }}>{theme.icon}</div>

            {/* タイトル */}
            <h1 style={{
              fontFamily:'Cinzel,serif',
              fontSize:'clamp(1.4rem,4.5vw,2.2rem)',
              color: theme.titleColor,
              letterSpacing:'0.25em',
              margin:'0 0 2px',
              animation:'rpg-flicker 2.5s ease-in-out infinite',
              textShadow:`0 0 20px ${theme.accent}, 0 0 40px ${theme.accent}`,
              zIndex:1, whiteSpace:'nowrap',
            }}>{theme.title}</h1>
            <p style={{
              color:`${theme.titleColor}66`, fontSize:'0.65rem',
              letterSpacing:'0.4em', margin:'0 0 28px',
              fontFamily:'Cinzel,serif', zIndex:1,
            }}>{theme.subtitle}</p>

            {/* ローディングバー */}
            <div style={{ width:'min(320px,80vw)', zIndex:1, display:'flex', flexDirection:'column', gap:10 }}>
              {/* 段階ラベル */}
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                fontSize:'0.62rem', color:`${theme.titleColor}88`,
                fontFamily:'Cinzel,serif', letterSpacing:'0.05em',
                padding:'0 2px',
              }}>
                <span>{progressLabel}</span>
                <span style={{ color: theme.titleColor, fontWeight:700 }}>{Math.floor(progress)}%</span>
              </div>

              {/* バー外枠 */}
              <div style={{
                padding:3, borderRadius:10,
                background:`linear-gradient(180deg, ${theme.accent}44 0%, #0a0a0a 50%, ${theme.accent}44 100%)`,
                boxShadow:`0 0 15px ${theme.accent}44, inset 0 0 8px rgba(0,0,0,0.8)`,
                position:'relative',
              }}>
                {/* 区切りメモリ（30/60/90%） */}
                {[30,60,90].map(pct => (
                  <div key={pct} style={{
                    position:'absolute', top:3, bottom:3,
                    left:`calc(3px + ${pct}% * (100% - 6px) / 100)`,
                    width:1, background:`rgba(255,255,255,${progress > pct ? 0.3 : 0.1})`,
                    zIndex:2, pointerEvents:'none',
                  }} />
                ))}
                <div style={{ height:18, borderRadius:7, background:'#080808', overflow:'hidden', position:'relative' }}>
                  <div style={{
                    position:'absolute', inset:0, right:`${100-progress}%`,
                    background: theme.barGradient,
                    backgroundSize:'200% 100%',
                    animation:'rpg-bar-shimmer 1.5s linear infinite',
                    transition:'right 0.1s linear',
                    borderRadius:7,
                  }} />
                  <div style={{
                    position:'absolute', inset:0,
                    background:'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 60%)',
                    pointerEvents:'none',
                  }} />
                </div>
              </div>

              {/* ヒント（タイプライター） */}
              <div style={{
                minHeight:28,
                display:'flex', alignItems:'center', justifyContent:'center',
                padding:'4px 10px',
                borderRadius:6,
                background:`${theme.accent}11`,
                border:`1px solid ${theme.accent}22`,
                animation:'rpg-hint-card-in 0.3s ease forwards',
              }}>
                <p style={{
                  color:`${theme.titleColor}cc`, fontSize:'0.78rem', margin:0,
                  textAlign:'center', fontFamily:'sans-serif',
                  letterSpacing:'0.03em',
                }}>
                  {displayedText}
                  {isTyping && (
                    <span style={{
                      display:'inline-block', width:2, height:'0.85em',
                      background: theme.titleColor,
                      marginLeft:2, verticalAlign:'middle',
                      animation:'rpg-typewriter-cursor 0.6s ease-in-out infinite',
                    }} />
                  )}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ===== 注意事項フェーズ ===== */}
        {phase === 'rules' && (
          <div style={{
            animation:'rpg-rules-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
            zIndex:1,
            display:'flex', flexDirection:'column', alignItems:'center', gap:20,
            padding:'0 16px', width:'100%', maxWidth:480,
          }}>
            <div style={{ fontSize:'2.4rem' }}>📜</div>
            <h2 style={{
              fontFamily:'Cinzel,serif', color: theme.titleColor, margin:0,
              fontSize:'clamp(1rem,4vw,1.3rem)', letterSpacing:'0.2em',
              textShadow:`0 0 20px ${theme.accent}88`,
            }}>注意事項</h2>

            <div style={{
              width:'100%', padding:2, borderRadius:12,
              background:`linear-gradient(90deg, ${theme.accent}88, ${theme.titleColor}, ${theme.accent}88)`,
              backgroundSize:'300% 300%',
              animation:'rpg-border-flow 3s linear infinite',
              boxShadow:`0 0 20px ${theme.accent}44`,
            }}>
              <div style={{
                background:'rgba(5,5,8,0.96)', borderRadius:10,
                padding:'20px 24px', display:'flex', flexDirection:'column', gap:14,
              }}>
                {[
                  { icon:'🔇', text:'このゲームの内容を不特定多数の場で発言することは厳禁です（LINEやSNSなど）' },
                  { icon:'🐛', text:'バグを見つけた際は必ず運営に報告してください' },
                  { icon:'⚖️', text:'モラルを守って行動しましょう' },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <span style={{ fontSize:'1.2rem', flexShrink:0, marginTop:1 }}>{item.icon}</span>
                    <p style={{
                      margin:0, color:'rgba(255,220,150,0.9)', fontSize:'0.85rem', lineHeight:1.6,
                      borderLeft:`2px solid ${theme.accent}66`, paddingLeft:10,
                    }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ color:`${theme.titleColor}99`, fontSize:'0.8rem', margin:0, fontFamily:'Cinzel,serif' }}>
              {countdown > 0 ? (
                <>ゲーム開始まで <span style={{
                  animation:'rpg-countdown-pulse 1s ease-in-out infinite',
                  display:'inline-block', color: theme.titleColor, fontWeight:700, fontSize:'1rem',
                }}>{countdown}</span> 秒</>
              ) : (
                <span style={{ color: theme.titleColor }}>Loading...</span>
              )}
            </p>
          </div>
        )}
      </div>
    </>
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
// タブ別メンテナンス画面
// ============================================================
const TAB_LABELS: Record<string, string> = {
  gathering: '採取', fishing: '釣り', crafting: '製作',
  market: '市場', dungeon: 'ダンジョン', gamble: 'ギャンブル',
  online: 'オンライン', navi: '冒険ナビ',
};
function TabMaintenanceScreen({ tab, entry }: { tab: string; entry: { message?: string; startedAt?: number; estimatedMinutes?: number } }) {
  const startedAt = entry.startedAt ?? Date.now();
  const estimatedMinutes = entry.estimatedMinutes ?? 0;
  const startTime = new Date(startedAt).toLocaleString('ja-JP');
  const endTime = estimatedMinutes > 0 ? new Date(startedAt + estimatedMinutes * 60 * 1000).toLocaleString('ja-JP') : null;
  return (
    <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 16px' }}>
      <div style={{ width:'100%', maxWidth:420, background:'#1c2235', border:'1px solid #2d3752', borderRadius:14, overflow:'hidden', textAlign:'center' }}>
        <div style={{ padding:'28px 20px 20px', borderBottom:'1px solid #2d3752' }}>
          <div style={{ fontSize:'2.6rem', marginBottom:10 }}>🔧</div>
          <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#f0c060', marginBottom:6 }}>
            【{TAB_LABELS[tab] ?? tab}】メンテナンス中
          </div>
          {entry.message && (
            <div style={{ background:'rgba(240,192,96,0.08)', border:'1px solid rgba(240,192,96,0.25)', borderRadius:8, padding:'8px 12px', margin:'10px 0', color:'#f0d080', fontSize:'0.83rem', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
              {entry.message}
            </div>
          )}
          <div style={{ color:'#6a7290', fontSize:'0.77rem', lineHeight:1.9, marginTop:8 }}>
            <div>開始: {startTime}</div>
            {endTime && <div>終了予定: {endTime}</div>}
          </div>
        </div>
        <div style={{ padding:'16px 20px', color:'#8a92b2', fontSize:'0.8rem' }}>
          しばらくお待ちください。メンテナンス終了後、自動的に再開できます。
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
  const expPct = player.stats.level < 10_000_000 ? Math.min(100, (player.stats.exp / player.stats.expToNextLevel) * 100) : 100;
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
  const isFishingLocked = useGameStore(s => s.isFishingLocked);
  const isGatheringLocked = useGameStore(s => s.isGatheringLocked);
  const locked = (isFishingLocked && activeTab === 'fishing') || (isGatheringLocked && activeTab === 'gathering');
  const lockLabel = isGatheringLocked && activeTab === 'gathering' ? '⛏️ 採掘中…' : '🎣 釣り中…';

  return (
    <nav
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'stretch',
        background: 'linear-gradient(180deg, rgba(22,27,38,0.98), rgba(13,15,20,0.98))',
        borderTop: '1px solid rgba(45,55,82,0.95)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.28)',
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 900,
        zIndex: 100,
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: '8px 8px calc(8px + env(safe-area-inset-bottom))',
        boxSizing: 'border-box',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {locked && (
        <div
          style={{ position:'absolute', inset:0, background:'rgba(13,15,20,0.55)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'all', cursor:'not-allowed' }}
        >
          <span style={{ fontSize:'0.7rem', color:'#8a92b2', letterSpacing:1 }}>{lockLabel}</span>
        </div>
      )}
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { if (!locked) setTab(tab.id); }}
            style={{
              flex: '0 0 78px',
              minWidth: 78,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '8px 6px 10px',
              background: active
                ? 'linear-gradient(180deg, rgba(240,192,96,0.18), rgba(240,192,96,0.05))'
                : 'rgba(255,255,255,0.02)',
              color: active ? '#ffd98a' : '#8a92b2',
              border: '1px solid',
              borderColor: active ? 'rgba(240,192,96,0.55)' : 'rgba(90,100,130,0.18)',
              borderRadius: 14,
              cursor: locked ? 'not-allowed' : 'pointer',
              fontSize: '0.58rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
              transform: active ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: active
                ? '0 10px 22px rgba(0,0,0,0.32), 0 0 0 1px rgba(240,192,96,0.15) inset'
                : '0 4px 12px rgba(0,0,0,0.14)',
              opacity: locked && tab.id !== 'fishing' ? 0.4 : 1,
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', filter: active ? 'drop-shadow(0 0 8px rgba(240,192,96,0.35))' : 'none' }}>
              <GameIcon id={tab.icon} size={18} />
            </span>
            <span style={{ whiteSpace: 'nowrap', lineHeight: 1.1 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function LevelUpBanner() {
  const flash = useGameStore(s => s.levelUpFlash);
  const clear = useGameStore(s => s.clearLevelUp);
  if (!flash) return null;
  return (
    <div key={flash.ts} onClick={clear} style={{
      position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        {/* 拡散リング x2（タイミングをずらして重ねる） */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', width: 160, height: 160, marginLeft: -80, marginTop: -80,
          borderRadius: '50%', border: '3px solid #f0c060', boxShadow: '0 0 40px rgba(240,192,96,0.7)',
          animation: 'levelUpBurst 1.1s ease-out',
        }} />
        <div style={{
          position: 'absolute', left: '50%', top: '50%', width: 160, height: 160, marginLeft: -80, marginTop: -80,
          borderRadius: '50%', border: '3px solid #ffe9a8', boxShadow: '0 0 30px rgba(255,233,168,0.6)',
          animation: 'levelUpBurst 1.1s ease-out 0.18s',
        }} />
        <div className="rpg-badge-pop" style={{
          background: 'linear-gradient(135deg,#ffae00,#ff6a00)', color: '#fff', fontWeight: 900,
          padding: '14px 30px', borderRadius: 16, fontSize: '1.4rem', lineHeight: 1.3,
          boxShadow: '0 8px 30px rgba(255,140,0,0.5), 0 0 60px rgba(255,174,0,0.4)',
          border: '2px solid rgba(255,255,255,0.4)',
        }}>
          🎉 LEVEL UP!<br/>
          <span style={{ fontSize: '1.15rem' }}>Lv.{flash.level} に到達！</span>
        </div>
      </div>
    </div>
  );
}

function NotificationToast() {
  const notifications = useGameStore(s => s.notifications);
  const remove = useGameStore(s => s.removeNotification);
  const colors: Record<string, string> = { success:'rgba(76,175,135,0.95)', error:'rgba(224,85,85,0.95)', info:'rgba(91,141,238,0.95)', warning:'rgba(240,168,48,0.95)' };
  return (
    <div style={{ position:'fixed', top:56, right:10, zIndex:200, display:'flex', flexDirection:'column', gap:6, maxWidth:280 }}>
      {notifications.map(n => (
        <div
          key={n.id}
          onClick={() => remove(n.id)}
          style={{
            padding:'9px 13px', borderRadius:8, fontSize:'0.8rem', cursor:'pointer',
            background:colors[n.type], color: n.type === 'warning' ? '#000' : '#fff',
            animation:'notifSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
            boxShadow:'0 4px 16px rgba(0,0,0,0.4)',
            borderLeft: '3px solid rgba(255,255,255,0.4)',
          }}
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
    case 'aquarium':  return <AquariumScreen />;
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

// ============================================================
// オフライン採掘結果ポップアップ（ソシャゲ風）
// ============================================================
function MiningResultPopup({ result, onClose }: {
  result: { drops: {itemId:string;amount:number}[]; totalAmount:number; elapsedMinutes:number; capped:boolean };
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:600,
      background:'rgba(0,0,0,0.75)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:16,
      animation:'miningBgIn 0.3s ease',
    }}>
      <style>{`
        @keyframes miningBgIn { from{opacity:0} to{opacity:1} }
        @keyframes miningCardIn { from{transform:scale(0.85) translateY(30px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
        @keyframes miningItemIn { from{transform:translateX(-20px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes miningShine { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes miningFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
      <div style={{
        background:'linear-gradient(135deg, #1c2235 0%, #161b26 100%)',
        border:'2px solid #f0c060',
        borderRadius:18,
        padding:'24px 20px',
        width:'100%', maxWidth:420,
        boxShadow:'0 0 60px rgba(240,192,96,0.3), 0 20px 60px rgba(0,0,0,0.8)',
        animation: visible ? 'miningCardIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
      }}>
        {/* ヘッダー */}
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <div style={{ fontSize:'2.5rem', animation:'miningFloat 2s ease-in-out infinite', marginBottom:8 }}>🪨</div>
          <h2 style={{ color:'#f0c060', fontFamily:'Cinzel,serif', margin:'0 0 4px', fontSize:'1.1rem' }}>採掘隊が帰還しました！</h2>
          <div style={{ color:'#8a92b2', fontSize:'0.75rem' }}>
            {result.elapsedMinutes}分間の採掘 / 計{result.totalAmount}個獲得
            {result.capped && ' (満載)'}
          </div>
        </div>
        {/* 仕切り線 */}
        <div style={{ height:1, background:'linear-gradient(90deg, transparent, #f0c06040, transparent)', marginBottom:14 }} />
        {/* アイテムリスト */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:260, overflowY:'auto', marginBottom:16 }}>
          {result.drops.map((d, i) => {
            const item = ITEM_MASTER[d.itemId];
            return (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'8px 12px',
                background:'rgba(255,255,255,0.04)',
                borderRadius:10,
                border:'1px solid #2d3752',
                animation:`miningItemIn 0.3s ease ${i * 0.06}s both`,
              }}>
                <span style={{ fontSize:'1.3rem', flexShrink:0 }}>
                  {item?.icon ? '📦' : '📦'}
                </span>
                <span style={{ flex:1, fontSize:'0.88rem', fontWeight:600, color:'#e8e6ff' }}>
                  {item?.name ?? d.itemId}
                </span>
                <span style={{
                  padding:'2px 10px', borderRadius:999,
                  background:'rgba(240,192,96,0.15)', border:'1px solid #f0c06060',
                  color:'#f0c060', fontSize:'0.85rem', fontWeight:700,
                }}>
                  ×{d.amount}
                </span>
              </div>
            );
          })}
        </div>
        {/* 受け取りボタン */}
        <button onClick={onClose} style={{
          width:'100%', padding:'13px 0', borderRadius:10,
          border:'none', cursor:'pointer', fontWeight:800, fontSize:'0.95rem',
          background:'linear-gradient(135deg, #f0a830, #e07820)',
          color:'#fff',
          boxShadow:'0 4px 20px rgba(240,168,48,0.4)',
          letterSpacing:'0.05em',
        }}>
          ✨ 受け取る
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ワールドニュースポップアップ（ログイン後）
// ============================================================
function WorldNewsPopup({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<Array<{type:string;displayName:string;message:string;timestamp:number;title?:string}>>([]);
  const [loading, setLoading] = useState(true);

  const WORLD_NEWS_TYPES = new Set([
    'dungeon_clear','sky_castle_clear','sky_castle_ex_clear','volcano_clear',
    'boss_kx','boss_rei','boss_ragnarok','boss_hard','boss_title',
    'super_jackpot','jackpot','gamble_rank_up',
    'level_50','level_100','level_200','level_1000','level_10000','level_100000','level_1000000','level_10000000',
    'event_clear','admin_event',
  ]);
  const NEWS_STYLE: Record<string,{emoji:string;color:string}> = {
    dungeon_clear:{emoji:'🏰',color:'#f0c060'}, sky_castle_clear:{emoji:'🏯',color:'#f0c060'},
    sky_castle_ex_clear:{emoji:'✨',color:'#ff9933'}, volcano_clear:{emoji:'🌋',color:'#ff6644'},
    boss_kx:{emoji:'🤖',color:'#e05555'}, boss_rei:{emoji:'💀',color:'#cc44cc'},
    boss_ragnarok:{emoji:'🌪️',color:'#ff4444'}, boss_hard:{emoji:'⚔️',color:'#e05555'},
    boss_title:{emoji:'🏆',color:'#f0c060'}, super_jackpot:{emoji:'🌟',color:'#ffd700'},
    jackpot:{emoji:'💰',color:'#f0c060'}, gamble_rank_up:{emoji:'🎖️',color:'#9b6df0'},
    level_50:{emoji:'💎',color:'#5b8dee'}, level_100:{emoji:'👑',color:'#f0c060'},
    level_200:{emoji:'🔮',color:'#ff66cc'}, level_1000:{emoji:'🌠',color:'#ff44aa'},
    level_10000:{emoji:'🌌',color:'#cc22ff'}, level_100000:{emoji:'💫',color:'#ff0088'},
    level_1000000:{emoji:'🌈',color:'#ff0000'}, level_10000000:{emoji:'🔱',color:'#ffd700'},
    event_clear:{emoji:'🎉',color:'#4caf87'}, admin_event:{emoji:'📢',color:'#5b8dee'},
  };

  useEffect(() => {
    const unsub = subscribeActivityFeed((es) => {
      setEntries(es.filter(e => WORLD_NEWS_TYPES.has(e.type)).slice(0, 20) as typeof entries);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:600,
      background:'rgba(0,0,0,0.8)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:16,
    }}>
      <style>{`@keyframes newsIn { from{transform:scale(0.9) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }`}</style>
      <div style={{
        background:'#1c2235', border:'2px solid #2d3752',
        borderRadius:16, padding:'20px 16px',
        width:'100%', maxWidth:460, maxHeight:'80vh', overflowY:'auto',
        animation:'newsIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        boxShadow:'0 20px 60px rgba(0,0,0,0.8)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <h2 style={{ color:'#f0c060', margin:0, fontSize:'1.1rem', fontFamily:'Cinzel,serif' }}>🌍 ワールドニュース</h2>
            <div style={{ color:'#4a5070', fontSize:'0.72rem', marginTop:2 }}>世界で起きた重要イベント</div>
          </div>
          <button onClick={onClose} style={{ background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:'0.85rem' }}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {loading && <div style={{ color:'#8a92b2', textAlign:'center', padding:24 }}>読み込み中...</div>}
          {!loading && entries.length === 0 && <div style={{ color:'#4a5070', textAlign:'center', padding:24 }}>まだニュースがありません</div>}
          {entries.map((e, i) => {
            const s = NEWS_STYLE[e.type] ?? {emoji:'📌',color:'#8a92b2'};
            const diff = Date.now() - e.timestamp;
            const time = diff < 60_000 ? 'たった今'
              : diff < 3_600_000 ? `${Math.floor(diff/60_000)}分前`
              : diff < 86_400_000 ? `${Math.floor(diff/3_600_000)}時間前`
              : new Date(e.timestamp).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'});
            return (
              <div key={i} style={{ padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:`1px solid ${s.color}30`, animation:`newsIn 0.3s ease ${i*0.04}s both` }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:'1.1rem' }}>{s.emoji}</span>
                  <span style={{ flex:1, fontSize:'0.8rem', color:'#c8d0e0' }}>
                    <span style={{ color:s.color, fontWeight:700 }}>{e.displayName}</span> {e.message}
                  </span>
                  <span style={{ fontSize:'0.65rem', color:'#4a5070', flexShrink:0 }}>{time}</span>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={onClose} style={{ width:'100%', padding:'10px', background:'linear-gradient(135deg,#5b8dee,#3a6fd0)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, marginTop:14 }}>
          確認しました！
        </button>
      </div>
    </div>
  );
}

export default function App() {
  useAuth();
  useAutoSave();
  const isAuthLoading = useGameStore(s => s.isAuthLoading);
  const player = useGameStore(s => s.player);
  const [splashDone, setSplashDone] = useState(false);
  const activeTab = useGameStore(s => s.activeTab) as TabId;
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const addNotification = useGameStore(s => s.addNotification);
  const changeGold = useGameStore(s => s.changeGold);
  const applyPassiveRegen = useGameStore(s => s.applyPassiveRegen);
  const settleOfflineMining = useGameStore(s => s.settleOfflineMining);

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
  const [miningPopup, setMiningPopup] = useState<{ drops: {itemId:string;amount:number}[]; totalAmount:number; elapsedMinutes:number; capped:boolean } | null>(null);
  const [showWorldNewsPopup, setShowWorldNewsPopup] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState<{ active: boolean; startedAt: number; estimatedMinutes: number; message?: string } | null>(null);
  const [tabMaintenance, setTabMaintenance] = useState<TabMaintenanceConfig>({});
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

  // タブ別メンテナンス監視
  useEffect(() => {
    const unsub = subscribeTabMaintenance(cfg => setTabMaintenance(cfg));
    return unsub;
  }, []);

  const handleCloseVersionPopup = () => {
    setShowVersionPopup(false);
    setShowAdminAnnounce(true);
  };
  const handleCloseAdminAnnounce = () => {
    setShowAdminAnnounce(false);
    // アドミン告知後にワールドニュースポップアップを表示
    setShowWorldNewsPopup(true);
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

  // 採掘委任（オフライン採掘）: ログイン時に加え、一定間隔でも経過分を精算する
  useEffect(() => {
    if (!player) return;
    settleOfflineMining();
    // globalThisに結果が格納されていればポップアップ表示
    const pending = (globalThis as Record<string,unknown>)['__pendingMiningResult'];
    if (pending) {
      setTimeout(() => {
        setMiningPopup(pending as { drops: {itemId:string;amount:number}[]; totalAmount:number; elapsedMinutes:number; capped:boolean });
        delete (globalThis as Record<string,unknown>)['__pendingMiningResult'];
      }, 2000);
    }
    const miningInterval = setInterval(() => {
      settleOfflineMining();
    }, 60000);
    return () => clearInterval(miningInterval);
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

  if (isAuthLoading || !player || !splashDone) return <LoadingScreen authReady={!isAuthLoading && !!player} onDone={() => setSplashDone(true)} />;

  // メンテナンス中チェック（ADMIN除く）
  if (maintenanceStatus?.active && !ADMIN_UIDS.includes(player.uid)) {
    return <MaintenanceScreen startedAt={maintenanceStatus.startedAt} estimatedMinutes={maintenanceStatus.estimatedMinutes} message={maintenanceStatus.message} uid={player.uid} displayName={player.displayName} level={player.stats.level} />;
  }

  return (
    <div style={{ maxWidth:900, margin:'0 auto', minHeight:'100vh', background:'#0d0f14' }}>
      {showVersionPopup && <VersionPopup onClose={handleCloseVersionPopup} />}
      {miningPopup && <MiningResultPopup result={miningPopup} onClose={() => setMiningPopup(null)} />}
      {showWorldNewsPopup && <WorldNewsPopup onClose={() => setShowWorldNewsPopup(false)} />}
      {showAdminAnnounce && <AdminAnnouncementPopup onClose={() => { handleCloseAdminAnnounce(); const q = soldQueueRef.current; if (q.length > 0) { setSoldPopup(q[0]); soldQueueRef.current = q.slice(1); } }} />}
      {soldPopup && <SoldPopup info={soldPopup} onClose={() => { setSoldPopup(null); const q = soldQueueRef.current; if (q.length > 0) { setTimeout(() => { setSoldPopup(q[0]); soldQueueRef.current = q.slice(1); }, 300); } }} />}
      <StatusBar />
      <main style={{ paddingBottom:104 }}>
          {(() => {
            const tabEntry = tabMaintenance[activeTab as keyof TabMaintenanceConfig];
            if (tabEntry?.active && !ADMIN_UIDS.includes(player.uid)) {
              return <TabMaintenanceScreen tab={activeTab} entry={tabEntry} />;
            }
            return <div key={activeTab} className="rpg-card-appear"><ActiveScreen tab={activeTab} /></div>;
          })()}
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
      <LevelUpBanner />
    </div>
  );
}
