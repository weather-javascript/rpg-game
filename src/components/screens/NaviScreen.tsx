// src/components/screens/NaviScreen.tsx
// 冒険ナビゲーションシステム（拡張版）

import { useEffect, useMemo, useState } from 'react';
import { useGameStore, type GameState } from '../../stores/gameStore';
import { DUNGEON_MASTER, ITEM_MASTER, CRAFT_RECIPES, MONSTER_MASTER } from '../../data/masters';
import type { PlayerData } from '../../types/game';
import { WikiTab } from '../wiki/WikiTab';

type NaviSubTab = 'navi' | 'wiki';
type NaviSection = 'goal' | 'analysis' | 'drops' | 'build';

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

// ============================================================
// ① クエスト・目標の提示
// ============================================================
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

  for (const dungeonId of MAIN_DUNGEON_ORDER) {
    const dungeon = DUNGEON_MASTER[dungeonId];
    if (!dungeon) continue;
    const clears = cleared[dungeonId] ?? 0;
    if (clears === 0) {
      const reqLevel = dungeon.requiredLevel ?? 1;
      const levelOk = level >= reqLevel;
      const unlock = (dungeon as { unlockCondition?: { dungeonId: string; clearedCount: number; requiredLevel?: number } }).unlockCondition;
      const unlockOk = !unlock || (cleared[unlock.dungeonId] ?? 0) >= unlock.clearedCount;
      if (!levelOk) {
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

  if (level >= 20) {
    return {
      emoji: '⚔️',
      title: 'PvPに挑戦しよう',
      description: 'ギャンブル画面から他プレイヤーと対戦できます！',
      conditions: [{ text: 'レベル20以上', met: level >= 20 }],
      reward: [{ text: 'WC獲得・ランキング上昇' }],
      targetTab: 'gamble',
    };
  }

  return {
    emoji: '⛏️',
    title: 'レベルアップを目指そう',
    description: 'ダンジョンや採取でレベルを上げましょう！',
    conditions: [{ text: 'ダンジョンや採取を続ける', met: false }],
    reward: [{ text: '経験値・素材・ゴールド' }],
    targetTab: 'dungeon',
  };
}

// ============================================================
// ② プレイヤー進捗の分析
// ============================================================
interface AnalysisPoint { emoji: string; label: string; desc: string; type: 'good' | 'weak' | 'tip' }

function computeAnalysis(player: PlayerData): AnalysisPoint[] {
  const level = player.stats.level;
  const atk = player.stats.attack;
  const def = player.stats.defense;
  const hp = player.stats.maxHp;
  const points: AnalysisPoint[] = [];

  // 装備確認
  const eq = player.equipment ?? { hotbar: Array(9).fill(null), helmet: null, chestplate: null, leggings: null, boots: null, offhand: null };
  const hasWeapon = (eq.hotbar ?? []).some((id) => id && ITEM_MASTER[id]?.category === 'weapon');
  const eqAny = eq as unknown as Record<string, unknown>;
  const armorCount = ['helmet','chestplate','leggings','boots'].filter(slot => !!eqAny[slot]).length;

  if (!hasWeapon) {
    points.push({ emoji: '⚠️', label: '武器未装備', desc: 'ホットバーに武器をセットすると攻撃力が上がります。', type: 'weak' });
  } else {
    points.push({ emoji: '✅', label: '武器装備済み', desc: `攻撃力 ${atk}。積極的にダンジョンへ挑みましょう。`, type: 'good' });
  }

  if (armorCount < 4) {
    points.push({ emoji: '🛡️', label: `防具 ${armorCount}/4スロット`, desc: '全スロットに防具を装備すると被ダメージが減ります。', type: armorCount === 0 ? 'weak' : 'tip' });
  } else {
    points.push({ emoji: '✅', label: '防具フル装備', desc: `防御力 ${def}。バランスの取れた装備です。`, type: 'good' });
  }

  // HP
  if (hp < 150 && level > 10) {
    points.push({ emoji: '❤️', label: 'HP不足気味', desc: 'HP+ボーナスのある装備やクラフトアイテムでHPを増やしましょう。', type: 'tip' });
  }

  // ダンジョン周回
  const cleared = player.dungeonClearedCount ?? {};
  const totalClears = Object.values(cleared).reduce((s, v) => s + (v ?? 0), 0);
  if (totalClears > 50) {
    points.push({ emoji: '🏆', label: `ダンジョン${totalClears}回クリア！`, desc: '経験豊富な冒険者です。次のダンジョンに挑戦してみましょう。', type: 'good' });
  }

  // 採取スキル
  const gatherSkills = player.skillExp?.gathering ?? 0;
  if (gatherSkills > 0) {
    points.push({ emoji: '⛏️', label: '採取スキル習得中', desc: 'スキルレベルが上がると希少素材の入手率が上昇します。', type: 'good' });
  } else {
    points.push({ emoji: '💡', label: '採取スキル未習得', desc: '採取画面で採取を行うとスキル経験値が得られます。', type: 'tip' });
  }

  // ゴールド
  const gold = player.gold ?? 0;
  if (gold < 500 && level > 5) {
    points.push({ emoji: '💰', label: 'ゴールド不足', desc: 'マーケットや採取でゴールドを稼ぎましょう。', type: 'weak' });
  }

  return points.slice(0, 5);
}

// ============================================================
// ③ ドロップ・素材の入手場所案内
// ============================================================
interface DropGuideEntry { itemName: string; source: string; rate: string; tab: 'dungeon' | 'gathering' | 'crafting' | 'fishing' }

function computeDropGuide(player: PlayerData): DropGuideEntry[] {
  const results: DropGuideEntry[] = [];
  const inv = player.inventory ?? {};

  // クラフトレシピのうち未所持の出力アイテムの素材を案内
  for (const recipe of CRAFT_RECIPES.slice(0, 60)) {
    const outItem = ITEM_MASTER[recipe.outputItemId];
    if (!outItem) continue;
    if ((inv[recipe.outputItemId] ?? 0) > 0) continue; // 既に持っている

    for (const ing of recipe.inputs) {
      if ((inv[ing.itemId] ?? 0) < ing.amount) {
        const ingItem = ITEM_MASTER[ing.itemId];
        if (!ingItem) continue;

        // モンスタードロップを探す
        for (const monster of Object.values(MONSTER_MASTER)) {
          const drop = monster.drops?.find(d => d.itemId === ing.itemId);
          if (drop) {
            const dungeonName = monster.dungeonIds?.[0] ? (DUNGEON_MASTER[monster.dungeonIds[0]]?.name ?? monster.dungeonIds[0]) : '不明';
            results.push({
              itemName: ingItem.name,
              source: `${dungeonName}（${monster.name}）`,
              rate: `${Math.round(drop.baseRate * 100)}%`,
              tab: 'dungeon',
            });
            break;
          }
        }
      }
    }
    if (results.length >= 5) break;
  }

  if (results.length < 3) {
    results.push({ itemName: '各種素材', source: '採取エリア', rate: 'スキル次第', tab: 'gathering' });
  }
  return results.slice(0, 6);
}

// ============================================================
// ④ ビルド提案
// ============================================================
interface BuildSuggestion { title: string; desc: string; items: string[]; emoji: string }

function computeBuildSuggestions(player: PlayerData): BuildSuggestion[] {
  const level = player.stats.level;
  const inv = player.inventory ?? {};
  const suggestions: BuildSuggestion[] = [];

  // 近接DPSビルド
  const meleeCandidates = Object.values(ITEM_MASTER).filter(
    i => i.category === 'weapon' && i.itemType === 'Weapon' && (inv[i.id] ?? 0) > 0
  ).sort((a, b) => ((b.useEffect?.attackBonus ?? 0) - (a.useEffect?.attackBonus ?? 0)));
  if (meleeCandidates.length > 0) {
    suggestions.push({
      emoji: '⚔️',
      title: '近接DPSビルド',
      desc: '持っている最強武器を軸に攻撃特化で組む構成です。',
      items: meleeCandidates.slice(0, 3).map(i => i.name),
    });
  }

  // タンクビルド
  const armorCandidates = Object.values(ITEM_MASTER).filter(
    i => i.category === 'armor' && i.itemType === 'Armor' && (inv[i.id] ?? 0) > 0
  ).sort((a, b) => ((b.weaponDef ?? 0) - (a.weaponDef ?? 0)));
  if (armorCandidates.length >= 2) {
    suggestions.push({
      emoji: '🛡️',
      title: 'タンクビルド',
      desc: '防御力重視。長期戦や強敵との戦いに向いています。',
      items: armorCandidates.slice(0, 4).map(i => i.name),
    });
  }

  // レベル帯別おすすめ
  if (level < 50) {
    suggestions.push({
      emoji: '💡',
      title: '序盤おすすめ',
      desc: `現在Lv${level}。まず鉄装備一式を揃えてダンジョンを進みましょう。`,
      items: ['鉄の剣', '鉄の胸当て', '鉄のヘルメット', '鉄のブーツ'],
    });
  } else if (level < 200) {
    suggestions.push({
      emoji: '💎',
      title: '中盤おすすめ',
      desc: `現在Lv${level}。エメラルド以上の装備を目指しましょう。`,
      items: ['エメラルドの剣', '強化黒曜石の胸当て', 'ネザライトの剣'],
    });
  } else {
    suggestions.push({
      emoji: '🌟',
      title: '高Lvおすすめ',
      desc: `現在Lv${level}。レジェンダリー装備とスキルの組み合わせで性能を最大化しましょう。`,
      items: ['深淵の断魔剣', 'シルバーズ・アイ', 'パルヴァトスセット'],
    });
  }

  return suggestions.slice(0, 3);
}

// ============================================================
// NaviScreen本体
// ============================================================
export function NaviScreen() {
  const [subTab, setSubTab] = useState<NaviSubTab>(() => {
    try {
      const saved = localStorage.getItem('navi_sub_tab');
      if (saved === 'navi' || saved === 'wiki') return saved;
    } catch { /* ignore */ }
    return 'navi';
  });

  useEffect(() => {
    try { localStorage.setItem('navi_sub_tab', subTab); } catch { /* ignore */ }
  }, [subTab]);

  const SUB_TABS: { id: NaviSubTab; label: string; hint: string }[] = [
    { id: 'navi', label: '🧭 冒険ナビ', hint: '次にやることを見る' },
    { id: 'wiki', label: '📖 攻略WIKI', hint: '検索・編集・履歴' },
  ];

  return (
    <div style={{ padding: '12px 12px 0' }}>
      <div style={{ marginBottom: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid #2d3752', background: 'linear-gradient(135deg, #1a2035, #161b26)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#f0c060' }}>冒険ナビ</div>
            <div style={{ fontSize: '0.74rem', color: '#8a92b2', marginTop: 2 }}>行き先案内と攻略WIKIを使い分けられます。</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {SUB_TABS.map(t => {
            const active = subTab === t.id;
            return (
              <button key={t.id} onClick={() => setSubTab(t.id)} style={{
                width: '100%', padding: '12px 10px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 800,
                border: `1px solid ${active ? '#5b8dee' : '#2d3752'}`,
                background: active ? 'rgba(91,141,238,0.18)' : '#161b26',
                color: active ? '#5b8dee' : '#c8d0e0',
                textAlign: 'left', lineHeight: 1.35,
              }}>
                <div>{t.label}</div>
                <div style={{ fontSize: '0.68rem', color: active ? '#a8c4ff' : '#8a92b2', marginTop: 3, fontWeight: 600 }}>{t.hint}</div>
              </button>
            );
          })}
        </div>
      </div>
      {subTab === 'navi' ? <NaviHomePanel onOpenWiki={() => setSubTab('wiki')} /> : <WikiTab />}
    </div>
  );
}

// ============================================================
// NaviHomePanel — セクション切り替えUI
// ============================================================
function NaviHomePanel({ onOpenWiki }: { onOpenWiki: () => void }) {
  const player = useGameStore((s: GameState) => s.player);
  const setActiveTab = useGameStore((s: GameState) => s.setActiveTab);
  const changeGold = useGameStore((s: GameState) => s.changeGold);
  const changeWealthCoin = useGameStore((s: GameState) => s.changeWealthCoin);
  const addNotification = useGameStore((s: GameState) => s.addNotification);
  const [section, setSection] = useState<NaviSection>('goal');

  const goal = useMemo(() => player ? computeGoal(player) : null, [
    player?.stats.level, player?.dungeonClearedCount, player?.fishingScore,
    player?.totalWagered, player?.missionProgress?.totalWagered, player?.missionProgress?.totalSlotPlays,
  ]);

  const analysis = useMemo(() => player ? computeAnalysis(player) : [], [
    player?.stats.level, player?.stats.attack, player?.stats.defense, player?.stats.maxHp,
    player?.equipment, player?.skillExp, player?.gold, player?.dungeonClearedCount,
  ]);

  const drops = useMemo(() => player ? computeDropGuide(player) : [], [player?.inventory]);

  const builds = useMemo(() => player ? computeBuildSuggestions(player) : [], [
    player?.stats.level, player?.inventory,
  ]);

  if (!player || !goal) return null;

  const SECTIONS: { id: NaviSection; label: string; emoji: string }[] = [
    { id: 'goal',     label: '目標',   emoji: '🎯' },
    { id: 'analysis', label: '分析',   emoji: '📊' },
    { id: 'drops',    label: '入手先', emoji: '📦' },
    { id: 'build',    label: 'ビルド', emoji: '⚒️' },
  ];

  const sectionBtnStyle = (id: NaviSection) => ({
    flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${section === id ? '#5b8dee' : '#2d3752'}`,
    background: section === id ? 'rgba(91,141,238,0.18)' : '#161b26',
    color: section === id ? '#5b8dee' : '#8a92b2',
    fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
  });

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* セクション切り替えボタン */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={sectionBtnStyle(s.id)}>
            {s.emoji}<br/>{s.label}
          </button>
        ))}
      </div>

      {/* ① 目標セクション */}
      {section === 'goal' && (
        <GoalSection goal={goal} player={player} setActiveTab={setActiveTab}
          changeGold={changeGold} changeWealthCoin={changeWealthCoin}
          addNotification={addNotification} onOpenWiki={onOpenWiki} />
      )}

      {/* ② 分析セクション */}
      {section === 'analysis' && (
        <div style={{ background: 'linear-gradient(135deg, #1a2035, #161b26)', border: '1px solid #2d3752', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: '0.65rem', color: '#5b8dee', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            あなたの現状分析
          </div>
          {analysis.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10,
              padding: '8px 10px', borderRadius: 8,
              background: p.type === 'good' ? 'rgba(76,175,135,0.1)' : p.type === 'weak' ? 'rgba(255,80,80,0.1)' : 'rgba(91,141,238,0.07)',
              border: `1px solid ${p.type === 'good' ? '#2d5e40' : p.type === 'weak' ? '#5e2d2d' : '#2d3752'}`,
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{p.emoji}</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: p.type === 'good' ? '#4caf87' : p.type === 'weak' ? '#ff6060' : '#c8d0e0', marginBottom: 2 }}>{p.label}</div>
                <div style={{ fontSize: '0.73rem', color: '#8a92b2', lineHeight: 1.45 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ③ 入手先セクション */}
      {section === 'drops' && (
        <div style={{ background: 'linear-gradient(135deg, #1a2035, #161b26)', border: '1px solid #2d3752', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: '0.65rem', color: '#5b8dee', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            素材・アイテムの入手場所
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4a5070', marginBottom: 10 }}>
            クラフトに必要な素材の主な入手先です。
          </div>
          {drops.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              padding: '8px 10px', background: '#0d0f14', borderRadius: 8, border: '1px solid #2d3752' }}>
              <span style={{ fontSize: '0.9rem' }}>{d.tab === 'dungeon' ? '🏰' : d.tab === 'gathering' ? '⛏️' : d.tab === 'crafting' ? '🔨' : '🎣'}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0c060' }}>{d.itemName}</span>
                <span style={{ fontSize: '0.7rem', color: '#8a92b2', marginLeft: 6 }}>{d.source}</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#4caf87', flexShrink: 0 }}>{d.rate}</span>
              <button onClick={() => setActiveTab(d.tab)} style={{
                padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: '#1a2035', color: '#5b8dee', fontSize: '0.65rem', fontWeight: 700,
              }}>移動</button>
            </div>
          ))}
        </div>
      )}

      {/* ④ ビルド提案セクション */}
      {section === 'build' && (
        <div style={{ background: 'linear-gradient(135deg, #1a2035, #161b26)', border: '1px solid #2d3752', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: '0.65rem', color: '#5b8dee', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            ビルド・装備提案
          </div>
          {builds.map((b, i) => (
            <div key={i} style={{ marginBottom: 12, padding: '10px 12px', background: '#0d0f14', borderRadius: 10, border: '1px solid #2d3752' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: '1rem' }}>{b.emoji}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0c060' }}>{b.title}</span>
              </div>
              <div style={{ fontSize: '0.73rem', color: '#8a92b2', marginBottom: 8, lineHeight: 1.45 }}>{b.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {b.items.map((item, j) => (
                  <span key={j} style={{ padding: '2px 8px', background: 'rgba(91,141,238,0.12)', borderRadius: 999,
                    border: '1px solid #2d3752', fontSize: '0.68rem', color: '#c8d0e0' }}>{item}</span>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setActiveTab('crafting')} style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.8rem',
            background: 'linear-gradient(135deg, #5b8dee, #3a6fd0)', color: '#fff', marginTop: 4,
          }}>🔨 クラフト画面へ</button>
        </div>
      )}

      {/* ダンジョン進行状況（目標タブのみ） */}
      {section === 'goal' && <DungeonProgress player={player} />}
    </div>
  );
}

// ============================================================
// GoalSection（以前のメインカード）
// ============================================================
function GoalSection({ goal, player, setActiveTab, changeGold, changeWealthCoin, addNotification, onOpenWiki }: {
  goal: NaviGoal; player: PlayerData;
  setActiveTab: (tab: import('../../types/game').TabId) => void;
  changeGold: (n: number) => void;
  changeWealthCoin: (n: number) => void;
  addNotification: (type: 'success' | 'error' | 'info' | 'warning', msg: string) => void;
  onOpenWiki: () => void;
}) {
  const allMet = goal.conditions.every(c => c.met);
  const progressPct = goal.progress ? Math.min(100, Math.round((goal.progress.current / goal.progress.max) * 100)) : null;

  const handleClaim = () => {
    if (!allMet) return;
    const claimedKey = `navi_claimed_${goal.title}`;
    const alreadyClaimed = player.naviClaimed?.[claimedKey];
    if (alreadyClaimed) { addNotification('info', '既にこの報酬は受け取り済みです'); return; }
    changeGold(500);
    changeWealthCoin(100);
    const updatedPlayer = useGameStore.getState().player;
    if (updatedPlayer) {
      useGameStore.getState().setPlayer({ ...updatedPlayer, naviClaimed: { ...(updatedPlayer.naviClaimed ?? {}), [claimedKey]: true } });
    }
    addNotification('success', '🎉 目標達成！ 500G + 100WC 獲得！');
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #1a2035, #161b26)', border: '1px solid #2d3752', borderRadius: 12, padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '5rem', opacity: 0.06, pointerEvents: 'none', userSelect: 'none' }}>{goal.emoji}</div>
      <div style={{ fontSize: '0.65rem', color: '#5b8dee', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>現在のおすすめ</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{goal.emoji} {goal.title}</div>
      <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginBottom: 12, lineHeight: 1.5 }}>{goal.description}</div>
      {progressPct !== null && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8a92b2', marginBottom: 4 }}>
            <span>{goal.progress!.label}</span><span>{goal.progress!.current} / {goal.progress!.max}</span>
          </div>
          <div style={{ background: '#0d0f14', borderRadius: 4, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #5b8dee, #f0c060)', borderRadius: 4, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.7rem', color: '#8a92b2', fontWeight: 700, marginBottom: 6 }}>達成条件</div>
        {goal.conditions.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
            <span style={{ color: c.met ? '#4caf87' : '#5b8dee', fontSize: '0.75rem', marginTop: 1, flexShrink: 0 }}>{c.met ? '✅' : '◻️'}</span>
            <span style={{ fontSize: '0.78rem', color: c.met ? '#4caf87' : '#c8d0e0', lineHeight: 1.4 }}>{c.text}</span>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: '0.7rem', color: '#8a92b2', fontWeight: 700, marginBottom: 6 }}>報酬</div>
        {goal.reward.map((r, i) => (
          <div key={i} style={{ fontSize: '0.78rem', color: '#f0c060', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🎁</span> {r.text}
          </div>
        ))}
        {allMet && <div style={{ fontSize: '0.75rem', color: '#4caf87', marginTop: 4 }}>＋ 500G / 100WC（達成ボーナス）</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setActiveTab(goal.targetTab)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: 'linear-gradient(135deg, #5b8dee, #3a6fd0)', color: '#fff' }}>🗺️ 移動する</button>
        {allMet && (
          <button onClick={handleClaim} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: 'linear-gradient(135deg, #f0a830, #e07820)', color: '#fff' }}>🎉 報酬を受け取る</button>
        )}
        <button onClick={onOpenWiki} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #2d3752', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: '#161b26', color: '#f0c060' }}>📖 WIKIを開く</button>
      </div>
    </div>
  );
}

// ============================================================
// DungeonProgress（変更なし）
// ============================================================
function DungeonProgress({ player }: { player: PlayerData }) {
  const cleared = player.dungeonClearedCount ?? {};
  return (
    <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
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
              <span style={{ fontSize: '0.78rem', color: done ? '#4caf87' : canTry && prevDone ? '#f0c060' : '#4a5070', flex: 1 }}>{dungeon.name}</span>
              <span style={{ fontSize: '0.65rem', color: '#4a5070' }}>Lv{reqLevel}</span>
              {clears > 0 && <span style={{ fontSize: '0.65rem', color: '#5b8dee' }}>{clears}回</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
