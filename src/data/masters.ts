// src/data/masters.ts
// ゲームのすべてのマスターデータ。
// 新しいアイテム・モンスター・ダンジョン・スキルを追加する場合は、
// 対応するオブジェクトにエントリを追記するだけでゲームに反映される。

import type {
  ItemMaster,
  SkillMaster,
  GatherNodeMaster,
  MonsterMaster,
  DungeonMaster,
  GambleMaster,
} from '../types/game';

// ============================================================
// === アイテムマスター ===
// ============================================================
export const ITEM_MASTER: Record<string, ItemMaster> = {
  // --- 素材系 ---
  wood: {
    id: 'wood',
    name: '木材',
    description: '伐採で手に入る基本素材。',
    category: 'material',
    rarity: 'common',
    sellPrice: 5,
    buyPrice: 0,
    maxStack: -1,
    icon: '🪵',
  },
  stone: {
    id: 'stone',
    name: '石',
    description: '採掘で手に入る基本素材。',
    category: 'material',
    rarity: 'common',
    sellPrice: 4,
    buyPrice: 0,
    maxStack: -1,
    icon: '🪨',
  },
  iron_ore: {
    id: 'iron_ore',
    name: '鉄鉱石',
    description: '採掘で手に入る鉱石。加工すると様々な道具になる。',
    category: 'material',
    rarity: 'uncommon',
    sellPrice: 25,
    buyPrice: 0,
    maxStack: -1,
    icon: '⛏️',
  },
  coal: {
    id: 'coal',
    name: '石炭',
    description: '鉱山で採れる燃料素材。',
    category: 'material',
    rarity: 'common',
    sellPrice: 10,
    buyPrice: 0,
    maxStack: -1,
    icon: '🖤',
  },
  gold_ore: {
    id: 'gold_ore',
    name: '金鉱石',
    description: '希少な鉱石。高値で売れる。',
    category: 'material',
    rarity: 'rare',
    sellPrice: 120,
    buyPrice: 0,
    maxStack: -1,
    icon: '✨',
  },
  ancient_shard: {
    id: 'ancient_shard',
    name: '古代の欠片',
    description: 'ダンジョンの深部に眠る謎の素材。',
    category: 'material',
    rarity: 'epic',
    sellPrice: 500,
    buyPrice: 0,
    maxStack: 99,
    icon: '💎',
  },
  // --- モンスタードロップ ---
  slime_gel: {
    id: 'slime_gel',
    name: 'スライムゼリー',
    description: 'スライムが落とす粘液。薬の材料になる。',
    category: 'material',
    rarity: 'common',
    sellPrice: 8,
    buyPrice: 0,
    maxStack: -1,
    icon: '🫧',
  },
  goblin_ear: {
    id: 'goblin_ear',
    name: 'ゴブリンの耳',
    description: 'ゴブリンの証。',
    category: 'material',
    rarity: 'uncommon',
    sellPrice: 30,
    buyPrice: 0,
    maxStack: -1,
    icon: '👂',
  },
  dragon_scale: {
    id: 'dragon_scale',
    name: 'ドラゴンの鱗',
    description: '非常に希少。最高の防具の素材になる。',
    category: 'material',
    rarity: 'legendary',
    sellPrice: 2000,
    buyPrice: 0,
    maxStack: 10,
    icon: '🐉',
  },
  // --- 道具・ツール ---
  iron_pickaxe: {
    id: 'iron_pickaxe',
    name: '鉄のツルハシ',
    description: '採掘効率が上がる。',
    category: 'tool',
    rarity: 'uncommon',
    sellPrice: 50,
    buyPrice: 200,
    maxStack: 1,
    icon: '⛏️',
  },
  iron_axe: {
    id: 'iron_axe',
    name: '鉄の斧',
    description: '伐採効率が上がる。',
    category: 'tool',
    rarity: 'uncommon',
    sellPrice: 50,
    buyPrice: 200,
    maxStack: 1,
    icon: '🪓',
  },
  // --- 消耗品 ---
  health_potion: {
    id: 'health_potion',
    name: '回復薬',
    description: 'HPを50回復する。',
    category: 'consumable',
    rarity: 'common',
    sellPrice: 20,
    buyPrice: 60,
    maxStack: 99,
    icon: '🧪',
  },
  food_ration: {
    id: 'food_ration',
    name: '携帯食料',
    description: '満腹度を30回復する。',
    category: 'consumable',
    rarity: 'common',
    sellPrice: 5,
    buyPrice: 20,
    maxStack: 99,
    icon: '🍖',
  },
  // --- 宝箱 / ギャンブル ---
  mystery_box: {
    id: 'mystery_box',
    name: '謎の宝箱',
    description: '中身は分からない。良いものが入っているかも？',
    category: 'treasure',
    rarity: 'rare',
    sellPrice: 0,
    buyPrice: 500,
    maxStack: 99,
    icon: '📦',
  },
};

// ============================================================
// === スキルマスター ===
// ============================================================
export const SKILL_MASTER: Record<string, SkillMaster> = {
  mining: {
    id: 'mining',
    name: '採掘',
    description: '岩や鉱脈から資源を採取する能力。',
    icon: '⛏️',
    maxLevel: 50,
  },
  woodcutting: {
    id: 'woodcutting',
    name: '伐採',
    description: '木を切り倒して木材を集める能力。',
    icon: '🪓',
    maxLevel: 50,
  },
  combat: {
    id: 'combat',
    name: '戦闘',
    description: 'モンスターと戦う能力。',
    icon: '⚔️',
    maxLevel: 100,
  },
  fishing: {
    id: 'fishing',
    name: '釣り',
    description: '魚や水中の素材を採取する能力。',
    icon: '🎣',
    maxLevel: 50,
  },
  crafting: {
    id: 'crafting',
    name: '製作',
    description: '素材からアイテムを作成する能力。',
    icon: '🔨',
    maxLevel: 50,
  },
};

// ============================================================
// === 採取ノードマスター ===
// ============================================================
export const GATHER_NODE_MASTER: Record<string, GatherNodeMaster> = {
  pine_tree: {
    id: 'pine_tree',
    name: '松の木',
    description: '平原に生える一般的な木。',
    icon: '🌲',
    requiredSkill: { skillId: 'woodcutting', minLevel: 1 },
    cooldownMs: 3000,
    staminaCost: 5,
    drops: [
      { itemId: 'wood', baseRate: 1.0, minAmount: 1, maxAmount: 3, skillRateBonus: 0.05 },
    ],
  },
  oak_tree: {
    id: 'oak_tree',
    name: 'オークの木',
    description: '硬い木材が取れる大木。',
    icon: '🌳',
    requiredSkill: { skillId: 'woodcutting', minLevel: 5 },
    cooldownMs: 5000,
    staminaCost: 8,
    drops: [
      { itemId: 'wood', baseRate: 1.0, minAmount: 2, maxAmount: 5, skillRateBonus: 0.08 },
    ],
  },
  stone_deposit: {
    id: 'stone_deposit',
    name: '岩場',
    description: '地面にある岩の塊。',
    icon: '🪨',
    requiredSkill: { skillId: 'mining', minLevel: 1 },
    cooldownMs: 4000,
    staminaCost: 6,
    drops: [
      { itemId: 'stone', baseRate: 1.0, minAmount: 1, maxAmount: 3, skillRateBonus: 0.05 },
      { itemId: 'coal', baseRate: 0.15, minAmount: 1, maxAmount: 2, skillRateBonus: 0.02 },
    ],
  },
  iron_vein: {
    id: 'iron_vein',
    name: '鉄鉱脈',
    description: '鉄を含む鉱脈。',
    icon: '⛏️',
    requiredSkill: { skillId: 'mining', minLevel: 10 },
    cooldownMs: 8000,
    staminaCost: 12,
    drops: [
      { itemId: 'iron_ore', baseRate: 1.0, minAmount: 1, maxAmount: 3, skillRateBonus: 0.1 },
      { itemId: 'stone', baseRate: 0.5, minAmount: 1, maxAmount: 2 },
      { itemId: 'gold_ore', baseRate: 0.05, minAmount: 1, maxAmount: 1, skillRateBonus: 0.01 },
    ],
  },
  gold_vein: {
    id: 'gold_vein',
    name: '金鉱脈',
    description: '希少な金を含む鉱脈。',
    icon: '✨',
    requiredSkill: { skillId: 'mining', minLevel: 25 },
    cooldownMs: 15000,
    staminaCost: 20,
    drops: [
      { itemId: 'gold_ore', baseRate: 1.0, minAmount: 1, maxAmount: 3, skillRateBonus: 0.12 },
      { itemId: 'iron_ore', baseRate: 0.3, minAmount: 1, maxAmount: 2 },
    ],
  },
};

// ============================================================
// === モンスターマスター ===
// ============================================================
export const MONSTER_MASTER: Record<string, MonsterMaster> = {
  slime: {
    id: 'slime',
    name: 'スライム',
    description: 'ゼリー状の初歩的なモンスター。',
    icon: '🫧',
    maxHp: 30,
    attack: 5,
    defense: 2,
    baseExp: 15,
    baseGold: 8,
    dungeonIds: ['beginner_cave'],
    drops: [
      { itemId: 'slime_gel', baseRate: 0.8, minAmount: 1, maxAmount: 3 },
    ],
  },
  goblin: {
    id: 'goblin',
    name: 'ゴブリン',
    description: '小さいが油断できない緑の怪物。',
    icon: '👺',
    maxHp: 60,
    attack: 12,
    defense: 5,
    baseExp: 35,
    baseGold: 20,
    dungeonIds: ['beginner_cave', 'goblin_den'],
    drops: [
      { itemId: 'goblin_ear', baseRate: 0.6, minAmount: 1, maxAmount: 2 },
      { itemId: 'iron_ore', baseRate: 0.2, minAmount: 1, maxAmount: 1 },
    ],
  },
  orc: {
    id: 'orc',
    name: 'オーク',
    description: '屈強な大型モンスター。',
    icon: '👹',
    maxHp: 150,
    attack: 28,
    defense: 15,
    baseExp: 90,
    baseGold: 60,
    dungeonIds: ['goblin_den', 'dark_forest'],
    drops: [
      { itemId: 'iron_ore', baseRate: 0.4, minAmount: 1, maxAmount: 3 },
      { itemId: 'ancient_shard', baseRate: 0.05, minAmount: 1, maxAmount: 1 },
    ],
  },
  dragon: {
    id: 'dragon',
    name: 'ドラゴン',
    description: '最強クラスの古代生命体。',
    icon: '🐉',
    maxHp: 1000,
    attack: 80,
    defense: 50,
    baseExp: 800,
    baseGold: 500,
    dungeonIds: ['dragons_lair'],
    drops: [
      { itemId: 'dragon_scale', baseRate: 0.3, minAmount: 1, maxAmount: 3 },
      { itemId: 'ancient_shard', baseRate: 0.8, minAmount: 2, maxAmount: 5 },
      { itemId: 'gold_ore', baseRate: 1.0, minAmount: 5, maxAmount: 10 },
    ],
  },
};

// ============================================================
// === ダンジョンマスター ===
// ============================================================
export const DUNGEON_MASTER: Record<string, DungeonMaster> = {
  beginner_cave: {
    id: 'beginner_cave',
    name: '初心者の洞窟',
    description: '冒険者が最初に挑む定番のダンジョン。',
    icon: '🕳️',
    requiredLevel: 1,
    monsterIds: ['slime', 'goblin'],
    floors: 5,
  },
  goblin_den: {
    id: 'goblin_den',
    name: 'ゴブリンの巣窟',
    description: 'ゴブリンが群れをなして住む危険な場所。',
    icon: '🏚️',
    requiredLevel: 10,
    monsterIds: ['goblin', 'orc'],
    floors: 10,
  },
  dark_forest: {
    id: 'dark_forest',
    name: '暗黒の森',
    description: '光が届かない深い森。強力なモンスターが潜む。',
    icon: '🌑',
    requiredLevel: 20,
    monsterIds: ['orc'],
    floors: 15,
  },
  dragons_lair: {
    id: 'dragons_lair',
    name: 'ドラゴンの塒',
    description: '伝説のダンジョン。最強の冒険者のみが踏み込める。',
    icon: '🔥',
    requiredLevel: 50,
    monsterIds: ['dragon'],
    floors: 20,
  },
};

// ============================================================
// === ギャンブルマスター ===
// ============================================================
export const GAMBLE_MASTER: Record<string, GambleMaster> = {
  slot_machine: {
    id: 'slot_machine',
    name: 'スロットマシン',
    description: '3つのシンボルが揃えばジャックポット！',
    icon: '🎰',
    type: 'slot',
    minBet: 10,
    maxBet: 10000,
    rewardTable: [
      { label: 'ジャックポット 💰💰💰', probability: 0.005, multiplier: 50, symbols: ['💰', '💰', '💰'] },
      { label: 'ビッグウィン ⭐⭐⭐', probability: 0.02,  multiplier: 10, symbols: ['⭐', '⭐', '⭐'] },
      { label: 'ミドルヒット 🍒🍒🍒', probability: 0.05,  multiplier: 5,  symbols: ['🍒', '🍒', '🍒'] },
      { label: 'スモールヒット 🍋🍋🍋', probability: 0.10, multiplier: 2,  symbols: ['🍋', '🍋', '🍋'] },
      { label: '2枚揃い 🍒🍒-',  probability: 0.20, multiplier: 1.2, symbols: ['🍒', '🍒', '🔔'] },
      { label: 'ハズレ',           probability: 0.625, multiplier: 0, symbols: ['💨', '💨', '💨'] },
    ],
  },
  treasure_box: {
    id: 'treasure_box',
    name: '宝箱くじ',
    description: '宝箱を開けてみよう。何が出るかはお楽しみ。',
    icon: '📦',
    type: 'treasure_box',
    minBet: 100,
    maxBet: 100,
    rewardTable: [
      {
        label: '大当たり！レジェンダリー',
        probability: 0.01,
        multiplier: 0,
        itemRewards: [{ itemId: 'dragon_scale', amount: 1 }],
        symbols: ['🐉'],
      },
      {
        label: 'エピックアイテム',
        probability: 0.05,
        multiplier: 0,
        itemRewards: [{ itemId: 'ancient_shard', amount: 3 }],
        symbols: ['💎'],
      },
      {
        label: 'ゴールド大量',
        probability: 0.10,
        multiplier: 5,
        symbols: ['💰'],
      },
      {
        label: '回復薬セット',
        probability: 0.30,
        multiplier: 0,
        itemRewards: [{ itemId: 'health_potion', amount: 5 }],
        symbols: ['🧪'],
      },
      {
        label: '少しゴールド',
        probability: 0.30,
        multiplier: 1.5,
        symbols: ['🪙'],
      },
      {
        label: 'ハズレ（空の宝箱）',
        probability: 0.24,
        multiplier: 0,
        symbols: ['📭'],
      },
    ],
  },
  coin_flip: {
    id: 'coin_flip',
    name: 'コインフリップ',
    description: '表か裏か。シンプルな50/50ギャンブル。',
    icon: '🪙',
    type: 'coin_flip',
    minBet: 10,
    maxBet: 50000,
    rewardTable: [
      { label: '表（当たり）', probability: 0.49, multiplier: 2, symbols: ['✨'] },
      { label: '裏（ハズレ）', probability: 0.51, multiplier: 0, symbols: ['💨'] },
    ],
  },
};

// ============================================================
// === ゲームバランス定数 ===
// ============================================================

/** レベルアップに必要な経験値テーブル（レベル→必要経験値） */
export const EXP_TABLE: number[] = (() => {
  const table = [0]; // インデックス0はダミー（レベル0）
  for (let lv = 1; lv <= 200; lv++) {
    // RuneScapeライクな経験値曲線
    table.push(Math.floor(Math.pow(lv, 1.8) * 50));
  }
  return table;
})();

/** スキルレベルアップに必要な経験値（スキルレベル→必要経験値） */
export const SKILL_EXP_TABLE: number[] = (() => {
  const table = [0];
  for (let lv = 1; lv <= 50; lv++) {
    table.push(Math.floor(Math.pow(lv, 1.5) * 30));
  }
  return table;
})();

/** 新規プレイヤーのデフォルトデータ */
export const DEFAULT_PLAYER_STATS = {
  level: 1,
  exp: 0,
  expToNextLevel: EXP_TABLE[1],
  hp: 100,
  maxHp: 100,
  satiety: 100,
  maxSatiety: 100,
  attack: 10,
  defense: 5,
};
