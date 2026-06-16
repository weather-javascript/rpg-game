// src/data/ffggMaster.ts
// FFGG フリーフィールド マスターデータ
// 敵定義・ボス定義・フィーバー定義・エリア別エンカウンタープロファイル
// ※ 向き/前方/背後依存スキルは使用しない（2D ターン制バトル専用）
// ※ 数値は後から調整しやすいよう定数化

import type {
  FFGGEnemyDefinition,
  FFGGBossDefinition,
  FFGGFeverDefinition,
  EncounterTable,
} from '../types/ffgg';

// ============================================================
// 共通スキルスニペット（再利用）
// ============================================================

// 周囲波動（全体攻撃）
const SKILL_WAVE = {
  id: 'wave_aoe', name: '衝撃波', type: 'wave' as const,
  damageMult: 1.4, isAoe: true,
  telegraphText: '⚡ 周囲に衝撃波！',
  effectText: '全体攻撃',
  useChance: 0.3,
};

// 被弾反撃
const SKILL_COUNTER = {
  id: 'counter', name: '反撃', type: 'counter' as const,
  damageMult: 1.2,
  telegraphText: '🔄 反撃体勢！',
  effectText: '被弾時に反撃',
  useChance: 0.4,
};

// ============================================================
// ■ 全域共通の雑魚敵
// ============================================================
export const FFGG_COMMON_ENEMIES: Record<string, FFGGEnemyDefinition> = {

  pumpkin_head: {
    id: 'pumpkin_head', name: 'カボチャ頭', icon: 'lantern',
    description: '全エリアに出没するカボチャの怪物。動きは単純だが油断禁物。',
    category: 'swarm', dangerLevel: 2,
    maxHp: 120, attack: 18, defense: 5,
    baseExp: 35, baseGold: 20,
    areaIds: ['ffgg_forest','ffgg_plain','ffgg_desert','ffgg_snow','ffgg_savanna','ffgg_pirate'],
    drops: [
      { itemId: 'cave_fragment', baseRate: 0.6, minAmount: 1, maxAmount: 2 },
      { itemId: 'goblin_ear',    baseRate: 0.2, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'pumpkin_single', name: '噛みつき', type: 'single', damageMult: 1.0 },
      { id: 'pumpkin_aoe',    name: '種飛ばし', type: 'circle_aoe', damageMult: 0.8, isAoe: true,
        telegraphText: '🎃 種を撒き散らす！', effectText: '全体攻撃', useChance: 0.25 },
    ],
  },

  uni_eyed: {
    id: 'uni_eyed', name: 'ユーアイド', icon: 'magic_stone_blue',
    description: '浮遊する単眼生物。レーザーを発射する。',
    category: 'artillery', dangerLevel: 3,
    maxHp: 90, attack: 25, defense: 3,
    baseExp: 45, baseGold: 30,
    areaIds: ['ffgg_forest','ffgg_desert','ffgg_snow','ffgg_savanna'],
    drops: [
      { itemId: 'ancient_shard', baseRate: 0.3, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'uni_laser', name: 'アイレーザー', type: 'line_aoe', damageMult: 1.6,
        telegraphText: '👁 単眼がギラリと光る！', effectText: '直線貫通', useChance: 0.4 },
      { id: 'uni_single', name: '突進', type: 'single', damageMult: 1.0 },
    ],
  },

  silver_crystal: {
    id: 'silver_crystal', name: '白銀結晶', icon: 'ice',
    description: '全身が結晶質の敵。被弾すると反撃する。',
    category: 'counter', dangerLevel: 3,
    maxHp: 200, attack: 22, defense: 15,
    baseExp: 60, baseGold: 40,
    areaIds: ['ffgg_forest','ffgg_desert','ffgg_snow','ffgg_savanna','ffgg_pirate'],
    drops: [
      { itemId: 'spirit_ice',    baseRate: 0.4, minAmount: 1, maxAmount: 2 },
      { itemId: 'magic_stone',   baseRate: 0.2, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'crystal_single', name: '結晶刃', type: 'single', damageMult: 1.1 },
      SKILL_COUNTER,
      SKILL_WAVE,
    ],
  },
};

// ============================================================
// ■ 森地帯（群れ型 + 低〜中距離の圧）
// ============================================================
export const FFGG_FOREST_ENEMIES: Record<string, FFGGEnemyDefinition> = {

  grido: {
    id: 'grido', name: 'グリド', icon: 'goblin',
    description: '森に潜む小型の群れ型モブ。単体は弱いが複数で来る。',
    category: 'swarm', dangerLevel: 2,
    maxHp: 80, attack: 15, defense: 3,
    baseExp: 25, baseGold: 15,
    areaIds: ['ffgg_forest'],
    drops: [
      { itemId: 'cave_fragment', baseRate: 0.5, minAmount: 1, maxAmount: 2 },
      { itemId: 'coin',          baseRate: 1.0, minAmount: 5, maxAmount: 10 },
      { itemId: 'green_scale',   baseRate: 0.15, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'grido_bite',   name: 'ガブリ', type: 'single', damageMult: 1.0 },
      { id: 'grido_tackle', name: '体当たり', type: 'single', damageMult: 1.2, useChance: 0.3 },
    ],
    isTrigger: true,
  },

  grido_alpha: {
    id: 'grido_alpha', name: 'グリド・アルファ', icon: 'goblin',
    description: '群れのリーダー。仲間を呼ぶ。',
    category: 'summoner', dangerLevel: 3,
    maxHp: 150, attack: 20, defense: 6,
    baseExp: 50, baseGold: 30,
    areaIds: ['ffgg_forest'],
    drops: [
      { itemId: 'cave_fragment', baseRate: 0.7, minAmount: 2, maxAmount: 3 },
      { itemId: 'goblin_ear',    baseRate: 0.3, minAmount: 1, maxAmount: 1 },
      { itemId: 'green_scale',   baseRate: 0.25, minAmount: 1, maxAmount: 2 },
      { itemId: 'ff_coin_small', baseRate: 0.15, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'alpha_bite',   name: 'かみつき', type: 'single', damageMult: 1.1 },
      { id: 'alpha_summon', name: '援軍要請', type: 'summon', damageMult: 0,
        summonIds: ['grido'], telegraphText: '📯 仲間を呼んでいる！', useChance: 0.35 },
    ],
  },

  souldrop: {
    id: 'souldrop', name: 'ソールドロップ', icon: 'bubbles',
    description: '魂が凝縮した液状モブ。粘液攻撃で動きを鈍らせる。',
    category: 'trap', dangerLevel: 2,
    maxHp: 100, attack: 18, defense: 4,
    baseExp: 30, baseGold: 18,
    areaIds: ['ffgg_forest'],
    drops: [
      { itemId: 'slime_gel',     baseRate: 0.8, minAmount: 1, maxAmount: 3 },
      { itemId: 'ancient_shard', baseRate: 0.1, minAmount: 1, maxAmount: 1 },
      { itemId: 'slamy_liquid',  baseRate: 0.08, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'soul_single',  name: '粘液飛ばし', type: 'single', damageMult: 1.0 },
      { id: 'soul_zone',    name: '粘液地帯', type: 'place_zone', damageMult: 1.2, zoneTurns: 2,
        telegraphText: '💧 粘液を撒き散らした！', effectText: '鈍足地帯2ターン', useChance: 0.3 },
    ],
  },

  pirates_grunt: {
    id: 'pirates_grunt', name: 'パイレーツ（森）', icon: 'anchor',
    description: '森に迷い込んだ海賊の手下。',
    category: 'swarm', dangerLevel: 2,
    maxHp: 110, attack: 22, defense: 5,
    baseExp: 35, baseGold: 25,
    areaIds: ['ffgg_forest','ffgg_pirate'],
    drops: [
      { itemId: 'coin',           baseRate: 1.0, minAmount: 10, maxAmount: 20 },
      { itemId: 'cave_fragment',  baseRate: 0.3, minAmount: 1, maxAmount: 1 },
      { itemId: 'antique_coin',   baseRate: 0.05, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'pirate_slash', name: 'サーベル斬り', type: 'single', damageMult: 1.1 },
    ],
  },

  forest_ripper: {
    id: 'forest_ripper', name: 'フォレストリッパー', icon: 'dagger',
    description: '低確率で奇襲してくる危険な存在。高火力。',
    category: 'swarm', dangerLevel: 4,
    maxHp: 200, attack: 50, defense: 8,
    baseExp: 100, baseGold: 60,
    areaIds: ['ffgg_forest'],
    drops: [
      { itemId: 'hard_magic_stone', baseRate: 0.2, minAmount: 1, maxAmount: 1 },
      { itemId: 'goblin_ear',       baseRate: 0.5, minAmount: 2, maxAmount: 3 },
      { itemId: 'green_scale',      baseRate: 0.30, minAmount: 1, maxAmount: 2 },
      { itemId: 'cosmonium',        baseRate: 0.02, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'ripper_ambush', name: '奇襲斬り',     type: 'single',    damageMult: 1.5 },
      { id: 'ripper_wave',   name: '爪波動',        type: 'wave',      damageMult: 1.3, isAoe: true,
        telegraphText: '🌿 リッパーが爪を振り上げた！', useChance: 0.25 },
    ],
  },
};

// ============================================================
// ■ 砂漠地帯（砲台型 + 広範囲攻撃）
// ============================================================
export const FFGG_DESERT_ENEMIES: Record<string, FFGGEnemyDefinition> = {

  gadra: {
    id: 'gadra', name: 'ガドラ', icon: 'explosion',
    description: '砂漠の砲台型。広範囲ノックバックと貫通衝撃波が特徴。',
    category: 'artillery', dangerLevel: 3,
    maxHp: 160, attack: 30, defense: 8,
    baseExp: 55, baseGold: 35,
    areaIds: ['ffgg_desert'],
    drops: [
      { itemId: 'magma_stone',   baseRate: 0.5, minAmount: 1, maxAmount: 2 },
      { itemId: 'magic_stone',   baseRate: 0.2, minAmount: 1, maxAmount: 1 },
      { itemId: 'rock_scale',    baseRate: 0.20, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'gadra_single',  name: '砂弾', type: 'single', damageMult: 1.0 },
      { id: 'gadra_knockback', name: '広域衝撃波', type: 'wave', damageMult: 1.5, isAoe: true,
        telegraphText: '💥 ガドラが体を膨らませた！', effectText: '全体ノックバック相当', useChance: 0.35 },
      { id: 'gadra_line', name: '貫通射撃', type: 'line_aoe', damageMult: 2.0,
        telegraphText: '🎯 砲口が光った！', effectText: '直線貫通', useChance: 0.2 },
    ],
    isTrigger: true,
  },

  gadra_kai: {
    id: 'gadra_kai', name: 'ガドラ改', icon: 'explosion',
    description: '強化型ガドラ。範囲と火力が向上。',
    category: 'artillery', dangerLevel: 4,
    maxHp: 250, attack: 45, defense: 12,
    baseExp: 90, baseGold: 55,
    areaIds: ['ffgg_desert'],
    drops: [
      { itemId: 'hard_magic_stone', baseRate: 0.4, minAmount: 1, maxAmount: 2 },
      { itemId: 'magma_stone',      baseRate: 1.0, minAmount: 2, maxAmount: 3 },
      { itemId: 'rock_scale',       baseRate: 0.30, minAmount: 1, maxAmount: 2 },
      { itemId: 'hot_sand_amber',   baseRate: 0.08, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'gadrakai_wave',    name: '広域超衝撃波', type: 'wave', damageMult: 1.8, isAoe: true,
        telegraphText: '💥 ガドラ改が唸りを上げた！', useChance: 0.4 },
      { id: 'gadrakai_line',    name: '超貫通射撃', type: 'line_aoe', damageMult: 2.5,
        telegraphText: '🎯 二連砲口が光った！', useChance: 0.25 },
      { id: 'gadrakai_single',  name: '散弾', type: 'single', damageMult: 1.2 },
    ],
  },

  egard: {
    id: 'egard', name: 'エガルド', icon: 'swords',
    description: '砂漠の単体強敵。高火力で正面から圧を掛けてくる。',
    category: 'swarm', dangerLevel: 4,
    maxHp: 350, attack: 55, defense: 15,
    baseExp: 120, baseGold: 80,
    areaIds: ['ffgg_desert'],
    drops: [
      { itemId: 'hard_magic_stone', baseRate: 0.6, minAmount: 1, maxAmount: 2 },
      { itemId: 'ancient_shard',    baseRate: 0.3, minAmount: 1, maxAmount: 2 },
      { itemId: 'rock_scale',       baseRate: 0.35, minAmount: 1, maxAmount: 2 },
      { itemId: 'withered_heart',   baseRate: 0.03, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'egard_slash',  name: '大剣振り', type: 'single', damageMult: 1.3 },
      { id: 'egard_aoe',    name: '旋回斬り', type: 'circle_aoe', damageMult: 1.2, isAoe: true,
        telegraphText: '⚔ エガルドが大剣を構えた！', useChance: 0.3 },
    ],
  },
};

// ============================================================
// ■ 雪山 / 水竜周辺（近接連撃型 + 強ノックバック）
// ============================================================
export const FFGG_SNOW_ENEMIES: Record<string, FFGGEnemyDefinition> = {

  adora: {
    id: 'adora', name: 'アドーラ', icon: 'snowflake',
    description: '連続ヒットを狙う近接型。素早く複数回攻撃する。',
    category: 'swarm', dangerLevel: 3,
    maxHp: 180, attack: 28, defense: 8,
    baseExp: 60, baseGold: 35,
    areaIds: ['ffgg_snow'],
    drops: [
      { itemId: 'spirit_ice',    baseRate: 0.6, minAmount: 1, maxAmount: 2 },
      { itemId: 'cave_fragment', baseRate: 0.3, minAmount: 1, maxAmount: 2 },
      { itemId: 'water_scale',   baseRate: 0.20, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'adora_rush', name: '連続突き', type: 'single', damageMult: 0.7 },
      { id: 'adora_rush2', name: '二連撃', type: 'single', damageMult: 0.7 },
      { id: 'adora_rush3', name: '三連撃', type: 'single', damageMult: 0.7,
        useChance: 0.4, telegraphText: '❄️ アドーラが疾走する！' },
    ],
  },

  adora_kai: {
    id: 'adora_kai', name: 'アドーラ改', icon: 'snowflake',
    description: '強化版アドーラ。連撃に加えてノックバック波動も持つ。',
    category: 'swarm', dangerLevel: 4,
    maxHp: 300, attack: 40, defense: 12,
    baseExp: 100, baseGold: 60,
    areaIds: ['ffgg_snow'],
    drops: [
      { itemId: 'spirit_ice',       baseRate: 0.8, minAmount: 2, maxAmount: 3 },
      { itemId: 'hard_magic_stone', baseRate: 0.2, minAmount: 1, maxAmount: 1 },
      { itemId: 'water_scale',      baseRate: 0.35, minAmount: 1, maxAmount: 2 },
      { itemId: 'ocean_shard',      baseRate: 0.10, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'adorakai_rush',  name: '超連続突き', type: 'single', damageMult: 0.8 },
      { id: 'adorakai_rush2', name: '超二連撃',   type: 'single', damageMult: 0.8 },
      { id: 'adorakai_wave',  name: '氷塊衝撃波', type: 'wave', damageMult: 1.6, isAoe: true,
        telegraphText: '❄️ 氷の衝撃波！', useChance: 0.3 },
    ],
  },

  fang_wolf: {
    id: 'fang_wolf', name: '牙狼', icon: 'badger',
    description: '素早い単体圧。移動速度を追尾の強さで表現。',
    category: 'swarm', dangerLevel: 3,
    maxHp: 140, attack: 35, defense: 5,
    baseExp: 50, baseGold: 30,
    areaIds: ['ffgg_snow'],
    drops: [
      { itemId: 'mole_claw',        baseRate: 0.7, minAmount: 1, maxAmount: 2 },
      { itemId: 'spirit_ice',       baseRate: 0.2, minAmount: 1, maxAmount: 1 },
      { itemId: 'wolf_crystal',     baseRate: 0.10, minAmount: 1, maxAmount: 1 },
      { itemId: 'wolf_magic_crystal', baseRate: 0.04, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'fang_bite',  name: '牙噛み', type: 'single', damageMult: 1.2 },
      { id: 'fang_homing', name: '追尾突進', type: 'homing', damageMult: 1.5,
        telegraphText: '🐺 牙狼が加速した！', effectText: '回避不可追尾', useChance: 0.35 },
    ],
  },
};

// ============================================================
// ■ 平地（ドラグ系のみ、読みやすいが密度で押す）
// ============================================================
export const FFGG_PLAIN_ENEMIES: Record<string, FFGGEnemyDefinition> = {

  drag: {
    id: 'drag', name: 'ドラグ', icon: 'dragon',
    description: '平地のドラグ系。単純な攻撃パターンだが複数で来る。',
    category: 'swarm', dangerLevel: 2,
    maxHp: 130, attack: 20, defense: 6,
    baseExp: 35, baseGold: 22,
    areaIds: ['ffgg_plain'],
    drops: [
      { itemId: 'dragon_scale', baseRate: 0.05, minAmount: 1, maxAmount: 1 },
      { itemId: 'coin',         baseRate: 1.0,  minAmount: 8, maxAmount: 15 },
    ],
    skills: [
      { id: 'drag_claw',   name: '爪引っかき',  type: 'single', damageMult: 1.0 },
      { id: 'drag_breath', name: '火炎ブレス', type: 'line_aoe', damageMult: 1.3,
        telegraphText: '🐉 息を吸い込んでいる！', effectText: '直線炎', useChance: 0.25 },
    ],
    isTrigger: true,
  },

  drag_strong: {
    id: 'drag_strong', name: 'ドラグ強', icon: 'dragon',
    description: '強化ドラグ。高い HP で粘り強く戦う。',
    category: 'swarm', dangerLevel: 3,
    maxHp: 250, attack: 32, defense: 10,
    baseExp: 65, baseGold: 40,
    areaIds: ['ffgg_plain'],
    drops: [
      { itemId: 'dragon_scale', baseRate: 0.12, minAmount: 1, maxAmount: 1 },
      { itemId: 'magic_stone',  baseRate: 0.4,  minAmount: 1, maxAmount: 2 },
    ],
    skills: [
      { id: 'drag_strong_claw', name: '重爪',   type: 'single', damageMult: 1.2 },
      { id: 'drag_strong_aoe',  name: '尾薙払い', type: 'circle_aoe', damageMult: 1.0, isAoe: true,
        telegraphText: '🐉 尾を大きく振った！', useChance: 0.3 },
    ],
  },
};

// ============================================================
// ■ サバンナ地帯（全種混成 + ミニボス）
// ============================================================
export const FFGG_SAVANNA_ENEMIES: Record<string, FFGGEnemyDefinition> = {

  // 各エリアの代表的な雑魚を混成で参照するため、
  // サバンナ専用 ID はミニボスのみ定義し、
  // 通常出現プールは grido / adora / drag 等を流用する

  savanna_wanderer: {
    id: 'savanna_wanderer', name: 'サバンナ徘徊者', icon: 'soldier_helmet',
    description: 'サバンナを行き来する謎の戦士。行動が読みにくい。',
    category: 'swarm', dangerLevel: 3,
    maxHp: 200, attack: 35, defense: 10,
    baseExp: 70, baseGold: 45,
    areaIds: ['ffgg_savanna'],
    drops: [
      { itemId: 'memento',    baseRate: 0.2, minAmount: 1, maxAmount: 1 },
      { itemId: 'magic_stone', baseRate: 0.4, minAmount: 1, maxAmount: 2 },
    ],
    skills: [
      { id: 'wander_slash', name: '乱切り', type: 'single', damageMult: 1.1 },
      { id: 'wander_aoe',   name: '砂嵐斬', type: 'circle_aoe', damageMult: 1.0, isAoe: true,
        telegraphText: '🌪 砂嵐が巻き起こる！', useChance: 0.25 },
    ],
    isTrigger: true,
  },
};

// ============================================================
// ■ 海賊船（砲台型 + 追尾弾 + 爆発）
// ============================================================
export const FFGG_PIRATE_ENEMIES: Record<string, FFGGEnemyDefinition> = {

  pirates_captain: {
    id: 'pirates_captain', name: 'パイレーツキャプテン', icon: 'anchor',
    description: '海賊船の指揮官。大砲と追尾弾で高火力を誇る。',
    category: 'artillery', dangerLevel: 4,
    maxHp: 400, attack: 50, defense: 15,
    baseExp: 130, baseGold: 90,
    areaIds: ['ffgg_pirate'],
    drops: [
      { itemId: 'coin',             baseRate: 1.0, minAmount: 50, maxAmount: 100 },
      { itemId: 'hard_magic_stone', baseRate: 0.4, minAmount: 1, maxAmount: 2 },
      { itemId: 'ancient_shard',    baseRate: 0.3, minAmount: 1, maxAmount: 2 },
    ],
    skills: [
      { id: 'cap_cannon',  name: '大砲斉射', type: 'circle_aoe', damageMult: 1.6, isAoe: true,
        telegraphText: '💣 大砲に火が入った！', useChance: 0.35 },
      { id: 'cap_homing',  name: '追尾砲弾', type: 'homing', damageMult: 2.0,
        telegraphText: '🎯 追尾砲弾を発射！', useChance: 0.25 },
      { id: 'cap_summon',  name: '海賊召集', type: 'summon', damageMult: 0,
        summonIds: ['pirates_grunt'], telegraphText: '📯 手下を呼んでいる！', useChance: 0.2 },
    ],
    isTrigger: true,
  },

  pirates_cannon: {
    id: 'pirates_cannon', name: 'パイレーツ砲手', icon: 'target',
    description: '大砲専任の砲手。爆発範囲が大きい。',
    category: 'artillery', dangerLevel: 3,
    maxHp: 180, attack: 35, defense: 8,
    baseExp: 65, baseGold: 40,
    areaIds: ['ffgg_pirate'],
    drops: [
      { itemId: 'coin',          baseRate: 1.0, minAmount: 20, maxAmount: 40 },
      { itemId: 'gunpowder',     baseRate: 0.5, minAmount: 1, maxAmount: 2 },
    ],
    skills: [
      { id: 'cannon_shot',  name: '大砲', type: 'circle_aoe', damageMult: 1.5, isAoe: true,
        telegraphText: '💥 砲撃体勢！', useChance: 0.5 },
      { id: 'cannon_homing', name: '追尾弾', type: 'homing', damageMult: 1.8,
        telegraphText: '🎯 追尾弾を装填！', useChance: 0.3 },
    ],
  },
};

// ============================================================
// ■ ボス定義
// ============================================================
export const FFGG_BOSSES: Record<string, FFGGBossDefinition> = {

  // ── 巨大彗星（高速接近型） ──
  giant_comet: {
    id: 'giant_comet', name: '巨大彗星', icon: 'lightning', isBoss: true,
    description: '大樹の上に生息する高速接近型のボス。追尾の強さが特徴。',
    category: 'phase', dangerLevel: 4,
    maxHp: 1500, attack: 60, defense: 10,
    baseExp: 500, baseGold: 300,
    areaIds: ['ffgg_forest'],
    drops: [
      { itemId: 'ancient_shard',    baseRate: 1.0, minAmount: 3, maxAmount: 5 },
      { itemId: 'hard_magic_stone', baseRate: 0.6, minAmount: 1, maxAmount: 2 },
      { itemId: 'dragon_scale',     baseRate: 0.1, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'comet_charge', name: '超高速突進', type: 'homing', damageMult: 1.8,
        telegraphText: '☄️ 彗星が光を帯びた！', effectText: '回避困難', useChance: 0.4 },
      { id: 'comet_impact', name: '近距離爆裂', type: 'circle_aoe', damageMult: 2.0, isAoe: true,
        telegraphText: '💥 彗星が膨張している！', useChance: 0.25 },
    ],
    phases: [
      { hpThreshold: 1.0, label: 'フェーズ1', description: '通常状態' },
      {
        hpThreshold: 0.5, label: 'フェーズ2', description: '高速化。追尾弾の回数が増える。',
        activeSkillIds: ['comet_charge','comet_impact'], attackMult: 1.4,
      },
    ],
  },

  // ── 暗黒騎士 オメガ・ナイト・メア ──
  omega_knight: {
    id: 'omega_knight', name: '暗黒騎士 オメガ・ナイト・メア', icon: 'skull', isBoss: true,
    description: '直線攻撃と周囲斬撃を持つ暗黒騎士。HP30%以下で強化フェーズ突入。',
    category: 'phase', dangerLevel: 5,
    maxHp: 3000, attack: 80, defense: 25,
    baseExp: 1200, baseGold: 800,
    areaIds: ['ffgg_special'],
    drops: [
      { itemId: 'hard_magic_stone', baseRate: 1.0, minAmount: 5, maxAmount: 8 },
      { itemId: 'ancient_shard',    baseRate: 0.8, minAmount: 3, maxAmount: 5 },
      { itemId: 'dragon_scale',     baseRate: 0.3, minAmount: 1, maxAmount: 2 },
    ],
    skills: [
      { id: 'omega_line',    name: '暗黒直線斬', type: 'line_aoe', damageMult: 2.0,
        telegraphText: '🌑 暗黒の剣が伸びる！', useChance: 0.3 },
      { id: 'omega_sweep',   name: '周囲斬撃', type: 'wave', damageMult: 1.5, isAoe: true,
        telegraphText: '🌑 剣が黒く輝いた！', useChance: 0.3 },
      { id: 'omega_aura',    name: '円形ダメージオーラ', type: 'circle_aoe', damageMult: 1.2, isAoe: true,
        telegraphText: '🌑 暗黒オーラが広がる…', useChance: 0.2 },
      { id: 'omega_burst',   name: '怒涛の暗黒劇', type: 'wave', damageMult: 2.5, isAoe: true,
        hpThreshold: 0.3, telegraphText: '💀 ナイト・メアが覚醒した！', useChance: 0.5 },
    ],
    phases: [
      { hpThreshold: 1.0, label: 'フェーズ1', description: '通常状態' },
      {
        hpThreshold: 0.3, label: '強化フェーズ', description: 'HP30%以下で超強化。全スキルの頻度と威力が上がる。',
        attackMult: 1.6, defenseMult: 1.3,
      },
    ],
  },

  // ── Sea Memoria ──
  sea_memoria: {
    id: 'sea_memoria', name: 'Sea Memoria', icon: 'bubbles', isBoss: true,
    description: '被弾すると反撃する水系ボス。バフ解除を持つ。陸から集中攻撃が有効。',
    category: 'counter', dangerLevel: 4,
    maxHp: 2000, attack: 70, defense: 5,
    baseExp: 800, baseGold: 500,
    areaIds: ['ffgg_snow'],
    drops: [
      { itemId: 'spirit_ice',       baseRate: 1.0, minAmount: 5, maxAmount: 8 },
      { itemId: 'ancient_shard',    baseRate: 0.5, minAmount: 2, maxAmount: 4 },
      { itemId: 'hard_magic_stone', baseRate: 0.3, minAmount: 1, maxAmount: 2 },
      { itemId: 'ocean_orb',        baseRate: 0.30, minAmount: 1, maxAmount: 1 },
      { itemId: 'ocean_shard',      baseRate: 0.70, minAmount: 2, maxAmount: 4 },
      { itemId: 'water_scale_high', baseRate: 0.35, minAmount: 1, maxAmount: 2 },
    ],
    skills: [
      { id: 'sea_counter', name: '水面反撃', type: 'counter', damageMult: 1.3,
        telegraphText: '🌊 Sea Memoriaが構えた…', useChance: 0.5 },
      { id: 'sea_wave',    name: '大波動', type: 'wave', damageMult: 1.6, isAoe: true,
        telegraphText: '🌊 大波が押し寄せる！', useChance: 0.3 },
      { id: 'sea_dispel',  name: 'バフ解除', type: 'buff_dispel', damageMult: 0.5,
        telegraphText: '💦 水流がバフを洗い流す！', dispelsBuff: true, useChance: 0.2 },
    ],
    phases: [
      { hpThreshold: 1.0, label: '水面', description: '通常。被弾反撃が中心。' },
      { hpThreshold: 0.5, label: '荒波', description: 'HP50%以下で大波動の頻度が上がる。', attackMult: 1.3 },
    ],
  },

  // ── Eliminator ──
  eliminator: {
    id: 'eliminator', name: 'Eliminator', icon: 'robot', isBoss: true,
    description: '高耐性を持つ機械型ボス。眷属召喚 → 眷属を倒すことで本体にダメージ。',
    category: 'summoner', dangerLevel: 5,
    maxHp: 4000, attack: 65, defense: 50,
    baseExp: 1500, baseGold: 1000,
    areaIds: ['ffgg_special'],
    drops: [
      { itemId: 'hard_magic_stone', baseRate: 1.0, minAmount: 5, maxAmount: 10 },
      { itemId: 'dragon_scale',     baseRate: 0.5, minAmount: 1, maxAmount: 2 },
    ],
    skills: [
      { id: 'elim_aoe',     name: '円形爆発', type: 'circle_aoe', damageMult: 1.8, isAoe: true,
        telegraphText: '⚙️ 予兆マーカーが現れた！', useChance: 0.35 },
      { id: 'elim_summon',  name: '眷属召喚', type: 'summon', damageMult: 0,
        summonIds: ['grido_alpha','souldrop'], telegraphText: '⚙️ 眷属を呼び出した！', useChance: 0.3 },
    ],
    phases: [
      { hpThreshold: 1.0, label: '通常', description: '高耐性。眷属を介してダメージを与える。' },
      { hpThreshold: 0.4, label: '怒り', description: 'HP40%以下で眷属召喚頻度増加。', attackMult: 1.2 },
    ],
  },

  // ── スラムイキング ──
  slam_iking: {
    id: 'slam_iking', name: 'スラムイキング', icon: 'crown', isBoss: true,
    description: '追尾弾と自己回復を持つ耐久型ボス。遠距離から削るのが有効。',
    category: 'summoner', dangerLevel: 4,
    maxHp: 3500, attack: 55, defense: 20,
    baseExp: 1000, baseGold: 700,
    areaIds: ['ffgg_savanna'],
    drops: [
      { itemId: 'hard_magic_stone', baseRate: 1.0, minAmount: 3, maxAmount: 6 },
      { itemId: 'ancient_shard',    baseRate: 0.8, minAmount: 2, maxAmount: 4 },
      { itemId: 'dragon_scale',     baseRate: 0.2, minAmount: 1, maxAmount: 1 },
      { itemId: 'slamy_liquid',     baseRate: 0.50, minAmount: 2, maxAmount: 4 },
      { itemId: 'poison_sphere',    baseRate: 0.30, minAmount: 1, maxAmount: 2 },
      { itemId: 'light_trus',       baseRate: 0.15, minAmount: 1, maxAmount: 1 },
    ],
    skills: [
      { id: 'slam_homing',  name: '王の追尾弾', type: 'homing', damageMult: 1.8,
        telegraphText: '👑 追尾弾を放った！', useChance: 0.4 },
      { id: 'slam_summon',  name: '手下召喚', type: 'summon', damageMult: 0,
        summonIds: ['savanna_wanderer'], telegraphText: '📯 手下を呼んでいる！', useChance: 0.25 },
      { id: 'slam_heal',    name: '王気回復', type: 'heal_self', damageMult: 0, healPct: 0.1,
        telegraphText: '✨ 王が回復している！', useChance: 0.2 },
    ],
    phases: [
      { hpThreshold: 1.0, label: '余裕', description: '追尾弾中心。回復持ち。' },
      { hpThreshold: 0.5, label: '本気', description: 'HP50%以下で全スキル頻度上昇。', attackMult: 1.3 },
    ],
  },

  // ── 脳筋盗賊リーダー ──
  brute_leader: {
    id: 'brute_leader', name: '脳筋盗賊リーダー', icon: 'hammer', isBoss: true,
    description: '直線・近距離の単純な強攻撃。ノックバック重視。シンプルだが油断は禁物。',
    category: 'swarm', dangerLevel: 3,
    maxHp: 2000, attack: 90, defense: 15,
    baseExp: 700, baseGold: 450,
    areaIds: ['ffgg_pirate'],
    drops: [
      { itemId: 'coin',             baseRate: 1.0, minAmount: 80, maxAmount: 150 },
      { itemId: 'hard_magic_stone', baseRate: 0.5, minAmount: 2, maxAmount: 3 },
      { itemId: 'antique_coin',     baseRate: 0.40, minAmount: 1, maxAmount: 3 },
      { itemId: 'carib_rough_wave', baseRate: 0.20, minAmount: 1, maxAmount: 1 },
      { itemId: 'ff_coin_small',    baseRate: 1.0,  minAmount: 5, maxAmount: 15 },
    ],
    skills: [
      { id: 'brute_smash',  name: '大槌叩き', type: 'single', damageMult: 1.5 },
      { id: 'brute_line',   name: '突進薙ぎ払い', type: 'line_aoe', damageMult: 2.2,
        telegraphText: '💥 リーダーが突進体勢！', useChance: 0.3 },
      { id: 'brute_wave',   name: 'ノックバック波', type: 'wave', damageMult: 1.8, isAoe: true,
        telegraphText: '💥 地面が揺れた！', useChance: 0.2 },
    ],
    phases: [
      { hpThreshold: 1.0, label: '通常', description: '単純だが高威力。' },
      { hpThreshold: 0.4, label: '激怒', description: 'HP40%以下でダメージ増加。', attackMult: 1.5 },
    ],
  },

  // ── 魔装騎士長 ──
  magic_knight_chief: {
    id: 'magic_knight_chief', name: '魔装騎士長', icon: 'shield', isBoss: true,
    description: '地雷設置型のボス。HP50%以下で回復と召喚。死亡時に爆発波動。',
    category: 'trap', dangerLevel: 5,
    maxHp: 2800, attack: 75, defense: 30,
    baseExp: 1100, baseGold: 750,
    areaIds: ['ffgg_savanna'],
    drops: [
      { itemId: 'hard_magic_stone', baseRate: 1.0, minAmount: 4, maxAmount: 7 },
      { itemId: 'dragon_scale',     baseRate: 0.35, minAmount: 1, maxAmount: 2 },
      { itemId: 'ancient_shard',    baseRate: 0.6,  minAmount: 2, maxAmount: 4 },
    ],
    skills: [
      { id: 'mkc_mine',   name: '地雷設置', type: 'place_zone', damageMult: 2.0, zoneTurns: 3,
        telegraphText: '💣 地面に地雷を仕掛けた！', useChance: 0.35 },
      { id: 'mkc_slash',  name: '魔装斬り', type: 'single', damageMult: 1.2 },
      { id: 'mkc_heal',   name: '魔装回復', type: 'heal_self', damageMult: 0, healPct: 0.08,
        hpThreshold: 0.5, telegraphText: '✨ 魔装騎士長が魔力を集めた！', useChance: 0.3 },
      { id: 'mkc_summon', name: '騎士団召集', type: 'summon', damageMult: 0,
        summonIds: ['savanna_wanderer','pumpkin_head'], hpThreshold: 0.5,
        telegraphText: '📯 騎士団が押し寄せる！', useChance: 0.25 },
      { id: 'mkc_death',  name: '魔装爆発波', type: 'wave', damageMult: 3.0, isAoe: true,
        hpThreshold: 0.05, deathExplosion: true,
        telegraphText: '💀 魔装騎士長が最後の力を解放！', useChance: 1.0 },
    ],
    phases: [
      { hpThreshold: 1.0, label: '通常', description: '地雷設置中心。' },
      { hpThreshold: 0.5, label: '追い詰められた', description: 'HP50%以下で回復+召喚が解禁。', attackMult: 1.2 },
    ],
  },

  // ── 屠る巨人（中ボス） ──
  slaughter_giant: {
    id: 'slaughter_giant', name: '屠る巨人', icon: 'impact', isBoss: true, isMidBoss: true,
    description: 'サバンナの危険枠。巨大な円形衝撃波と高HPで圧倒する中ボス。',
    category: 'phase', dangerLevel: 5,
    maxHp: 5000, attack: 100, defense: 20,
    baseExp: 1800, baseGold: 1200,
    areaIds: ['ffgg_savanna'],
    drops: [
      { itemId: 'hard_magic_stone', baseRate: 1.0, minAmount: 6, maxAmount: 10 },
      { itemId: 'dragon_scale',     baseRate: 0.4,  minAmount: 1, maxAmount: 3 },
      { itemId: 'ancient_shard',    baseRate: 1.0,  minAmount: 4, maxAmount: 6 },
    ],
    skills: [
      { id: 'giant_stomp',  name: '巨大踏みつけ', type: 'circle_aoe', damageMult: 2.5, isAoe: true,
        telegraphText: '⚠️ 巨人が足を上げた！', useChance: 0.4 },
      { id: 'giant_wave',   name: '衝撃波爆震', type: 'wave', damageMult: 3.0, isAoe: true,
        telegraphText: '⚠️ 大地が揺れる！', useChance: 0.3 },
      { id: 'giant_smash',  name: '腕叩きつけ', type: 'single', damageMult: 1.8 },
    ],
    phases: [
      { hpThreshold: 1.0, label: '通常', description: '規則的な踏みつけ攻撃。' },
      { hpThreshold: 0.6, label: '怒り', description: 'HP60%以下で衝撃波が増加。', attackMult: 1.3 },
      { hpThreshold: 0.3, label: '暴走', description: 'HP30%以下で全攻撃が超強化。', attackMult: 1.7, defenseMult: 0.8 },
    ],
  },

  // ── マハドリュアス（中ボス） ──
  mahadorias: {
    id: 'mahadorias', name: 'マハドリュアス', icon: 'mage', isBoss: true, isMidBoss: true,
    description: 'サバンナのもう一つの中ボス。魔法系の広範囲攻撃が主体。',
    category: 'artillery', dangerLevel: 5,
    maxHp: 4000, attack: 85, defense: 15,
    baseExp: 1500, baseGold: 1000,
    areaIds: ['ffgg_savanna'],
    drops: [
      { itemId: 'hard_magic_stone', baseRate: 1.0, minAmount: 5, maxAmount: 8 },
      { itemId: 'ancient_shard',    baseRate: 0.7,  minAmount: 3, maxAmount: 5 },
      { itemId: 'dragon_scale',     baseRate: 0.25, minAmount: 1, maxAmount: 2 },
    ],
    skills: [
      { id: 'maha_aoe',    name: '魔術円陣', type: 'circle_aoe', damageMult: 2.0, isAoe: true,
        telegraphText: '✨ 魔法陣が展開された！', useChance: 0.4 },
      { id: 'maha_homing', name: '魔力誘導弾', type: 'homing', damageMult: 1.8,
        telegraphText: '✨ 追尾の弾が生まれた！', useChance: 0.3 },
      { id: 'maha_zone',   name: '魔力地帯', type: 'place_zone', damageMult: 1.5, zoneTurns: 3,
        telegraphText: '✨ 地面に魔力が溜まっていく！', useChance: 0.25 },
    ],
    phases: [
      { hpThreshold: 1.0, label: '通常', description: '広範囲魔術が中心。' },
      { hpThreshold: 0.5, label: '本気', description: 'HP50%以下で全スキル強化。', attackMult: 1.4 },
    ],
  },

  // ── 波狼（ボス） ──
  wave_wolf: {
    id: 'wave_wolf', name: '波狼', icon: 'badger', isBoss: true,
    description: '雪山の大型ボス。円形衝撃波と連続波動で戦場を支配する。',
    category: 'phase', dangerLevel: 5,
    maxHp: 4500, attack: 90, defense: 22,
    baseExp: 1600, baseGold: 1100,
    areaIds: ['ffgg_snow'],
    drops: [
      { itemId: 'spirit_ice',         baseRate: 1.0, minAmount: 6, maxAmount: 10 },
      { itemId: 'hard_magic_stone',   baseRate: 0.7,  minAmount: 3, maxAmount: 5 },
      { itemId: 'dragon_scale',       baseRate: 0.3,  minAmount: 1, maxAmount: 2 },
      { itemId: 'wolf_magic_crystal', baseRate: 0.50, minAmount: 1, maxAmount: 2 },
      { itemId: 'water_scale_high',   baseRate: 0.40, minAmount: 1, maxAmount: 2 },
    ],
    skills: [
      { id: 'wwolf_wave',  name: '円形衝撃波', type: 'wave', damageMult: 2.0, isAoe: true,
        telegraphText: '🐺 波狼が遠吠えした！', useChance: 0.4 },
      { id: 'wwolf_multi', name: '連続波動', type: 'wave', damageMult: 1.4, isAoe: true,
        telegraphText: '🐺 波動が連続する！', useChance: 0.3 },
      { id: 'wwolf_bite',  name: '大牙', type: 'single', damageMult: 1.6 },
    ],
    phases: [
      { hpThreshold: 1.0, label: '通常', description: '衝撃波中心。' },
      { hpThreshold: 0.5, label: '覚醒', description: 'HP50%以下で連続波動追加。', attackMult: 1.4 },
    ],
  },

  // ── エガルドン（段階変化型） ──
  egaldon: {
    id: 'egaldon', name: 'エガルドン', icon: 'explosion', isBoss: true,
    description: '砂漠の段階変化型ボス。HP蓄積しきい値で行動が変わる。',
    category: 'phase', dangerLevel: 5,
    maxHp: 5000, attack: 95, defense: 28,
    baseExp: 2000, baseGold: 1300,
    areaIds: ['ffgg_desert'],
    drops: [
      { itemId: 'hard_magic_stone', baseRate: 1.0, minAmount: 8, maxAmount: 12 },
      { itemId: 'dragon_scale',     baseRate: 0.5,  minAmount: 2, maxAmount: 3 },
      { itemId: 'ancient_shard',    baseRate: 1.0,  minAmount: 5, maxAmount: 8 },
      { itemId: 'rock_scale_high',  baseRate: 0.60, minAmount: 1, maxAmount: 3 },
      { itemId: 'withered_heart',   baseRate: 0.20, minAmount: 1, maxAmount: 1 },
      { itemId: 'hot_sand_amber',   baseRate: 0.40, minAmount: 1, maxAmount: 2 },
    ],
    skills: [
      { id: 'egaldon_wave',  name: '砂嵐衝撃波', type: 'wave', damageMult: 1.8, isAoe: true,
        telegraphText: '💥 砂嵐が荒れ狂う！', useChance: 0.35 },
      { id: 'egaldon_line',  name: '超貫通砲撃', type: 'line_aoe', damageMult: 2.8,
        telegraphText: '💥 エガルドンが照準を合わせた！', useChance: 0.25 },
      { id: 'egaldon_rage',  name: '怒涛衝撃連打', type: 'wave', damageMult: 2.5, isAoe: true,
        hpThreshold: 0.4, telegraphText: '💀 エガルドンが暴走した！', useChance: 0.5 },
    ],
    phases: [
      { hpThreshold: 1.0, label: '通常', description: '砂嵐系攻撃。' },
      { hpThreshold: 0.7, label: '強化', description: 'HP70%以下で範囲が拡大。', attackMult: 1.2 },
      { hpThreshold: 0.4, label: '暴走', description: 'HP40%以下で全攻撃の頻度・威力が大幅上昇。', attackMult: 1.7 },
    ],
  },
};

// ============================================================
// ■ フィーバー定義
// ============================================================
export const FFGG_FEVER_DEFINITIONS: Record<string, FFGGFeverDefinition> = {

  gold_fever: {
    id: 'gold_fever', type: 'gold', displayName: 'ゴールドフィーバー',
    description: '弱体化した雑魚が大量湧き！ゴールド大量獲得のチャンス。',
    weakEnemyIds: ['grido','pumpkin_head','souldrop'],
    maxWaves: 5, enemiesPerWave: 3,
    dropMult: 1.0, expMult: 0.5, goldMult: 3.0,
    onEndNote: 'TODO: フィーバー終了後に次段階（レッドフィーバー）へ繋がる処理を実装する',
  },

  red_fever: {
    id: 'red_fever', type: 'red', displayName: 'レッドフィーバー',
    description: '弱体化した赤い雑魚が大量湧き！ドロップ素材の大量取得が狙える。',
    weakEnemyIds: ['drag','pirates_grunt','uni_eyed'],
    maxWaves: 5, enemiesPerWave: 3,
    dropMult: 2.0, expMult: 0.8, goldMult: 1.5,
    onEndNote: 'TODO: フィーバー終了後に次段階（ドラゴンフィーバー）へ繋がる処理を実装する',
  },

  dragon_fever: {
    id: 'dragon_fever', type: 'dragon', displayName: 'ドラゴンフィーバー',
    description: '高密度のドラグ系が出現！鱗や素材を狙う上級者向けフィーバー。',
    weakEnemyIds: ['drag','drag_strong'],
    maxWaves: 7, enemiesPerWave: 3,
    dropMult: 4.0, expMult: 2.0, goldMult: 2.0,
    onEndNote: 'TODO: フィーバー終了後の次段階処理（未定）を実装する',
  },
};

// ============================================================
// ■ エリア別エンカウンタープロファイル
// ============================================================
export const FFGG_ENCOUNTER_TABLE: EncounterTable = {

  ffgg_forest: {
    areaId: 'ffgg_forest',
    normalEnemyIds: ['grido','grido_alpha','souldrop','pirates_grunt','pumpkin_head','uni_eyed','silver_crystal'],
    triggerEnemyId: 'grido',
    bossId: 'giant_comet',
    maxGroupSize: 3, dangerLevel: 2,
    feverChance: 0.05,
  },

  ffgg_plain: {
    areaId: 'ffgg_plain',
    normalEnemyIds: ['drag','drag_strong','pumpkin_head','silver_crystal'],
    triggerEnemyId: 'drag',
    maxGroupSize: 3, dangerLevel: 2,
    feverChance: 0.08,
  },

  ffgg_desert: {
    areaId: 'ffgg_desert',
    normalEnemyIds: ['gadra','gadra_kai','egard','pumpkin_head','uni_eyed','silver_crystal'],
    triggerEnemyId: 'gadra',
    bossId: 'egaldon',
    maxGroupSize: 2, dangerLevel: 4,
    feverChance: 0.04,
  },

  ffgg_snow: {
    areaId: 'ffgg_snow',
    normalEnemyIds: ['adora','adora_kai','fang_wolf','pumpkin_head','silver_crystal'],
    triggerEnemyId: 'adora',
    bossId: 'wave_wolf',
    maxGroupSize: 3, dangerLevel: 3,
    feverChance: 0.05,
  },

  ffgg_savanna: {
    areaId: 'ffgg_savanna',
    normalEnemyIds: ['savanna_wanderer','grido','gadra','adora','drag','pumpkin_head','uni_eyed','silver_crystal'],
    triggerEnemyId: 'savanna_wanderer',
    midBossId: 'slaughter_giant',
    bossId: 'slam_iking',
    maxGroupSize: 3, dangerLevel: 4,
    feverChance: 0.06,
  },

  ffgg_pirate: {
    areaId: 'ffgg_pirate',
    normalEnemyIds: ['pirates_grunt','pirates_cannon','pumpkin_head','silver_crystal'],
    triggerEnemyId: 'pirates_captain',
    bossId: 'brute_leader',
    maxGroupSize: 2, dangerLevel: 4,
    feverChance: 0.04,
  },

  // サバンナ特殊ノードにあるもう一つの中ボス
  ffgg_savanna_maha: {
    areaId: 'ffgg_savanna',
    normalEnemyIds: ['savanna_wanderer','uni_eyed'],
    midBossId: 'mahadorias',
    maxGroupSize: 2, dangerLevel: 5,
    feverChance: 0.03,
  },
};

// ============================================================
// 全敵定義まとめ（UI・戦闘ロジックから参照）
// ============================================================
export const FFGG_ALL_ENEMIES: Record<string, FFGGEnemyDefinition> = {
  ...FFGG_COMMON_ENEMIES,
  ...FFGG_FOREST_ENEMIES,
  ...FFGG_DESERT_ENEMIES,
  ...FFGG_SNOW_ENEMIES,
  ...FFGG_PLAIN_ENEMIES,
  ...FFGG_SAVANNA_ENEMIES,
  ...FFGG_PIRATE_ENEMIES,
  ...(FFGG_BOSSES as unknown as Record<string, FFGGEnemyDefinition>),
};
