// src/data/lycorisMaster.ts
// 裏ダンジョン初級（Lycoris）専用マスターデータ

export type MinionType = 'vision' | 'evocator_x' | 'zombie_pigman_y';

export interface LycorisPhaseDefinition {
  id: string;
  hpThreshold: number;
  label: string;
  onThrone: boolean;
  attackPatterns: string[];
  attackMult: number;
  minionDef: MinionType;
  minionMaxCount: number;
  summonCooldown: number;
}

export interface LycorisDefinition {
  id: string;
  name: string;
  maxHp: number;
  hpPerPlayer?: number;
  phases: LycorisPhaseDefinition[];
  initialSummonCount: number;
  transferDamagePerMinion: number;
  soloTransferMult?: number;
  awakenRate: number;
  drops?: DropTableEntry[];
}

export interface DropTableEntry {
  itemId: string;
  baseRate: number;
  min: number;
  max: number;
}

export const LYCORIS_DEF: LycorisDefinition = {
  id: 'lycoris',
  name: 'Lycoris',
  maxHp: 12000,
  hpPerPlayer: 4000,
  phases: [
    {
      id: 'throne',
      hpThreshold: 1.0,
      label: '玉座フェーズ（第一波）',
      onThrone: true,
      attackPatterns: ['そっちだよ', 'あっちだよ', 'こっちだよ'],
      attackMult: 1.2,
      minionDef: 'vision',
      minionMaxCount: 3,
      summonCooldown: 2,
    },
    {
      id: 'throne_pressure',
      hpThreshold: 0.75,
      label: '玉座フェーズ（第二波）',
      onThrone: true,
      attackPatterns: ['そっちだよ！', 'あっちだよ！', 'こっちだよ！'],
      attackMult: 1.5,
      minionDef: 'vision',
      minionMaxCount: 4,
      summonCooldown: 2,
    },
    {
      id: 'throne_fury',
      hpThreshold: 0.5,
      label: '玉座フェーズ（第三波）',
      onThrone: true,
      attackPatterns: ['全方向だよ！', 'どこ見てるの！', 'もう遅い！'],
      attackMult: 1.8,
      minionDef: 'vision',
      minionMaxCount: 5,
      summonCooldown: 1,
    },
    {
      id: 'direct',
      hpThreshold: 0.25,
      label: '直接攻撃フェーズ（前半）',
      onThrone: false,
      attackPatterns: ['そっちだよ', 'あっちだよ', 'こっちだよ'],
      attackMult: 2.2,
      minionDef: 'vision',
      minionMaxCount: 5,
      summonCooldown: 1,
    },
    {
      id: 'direct_enrage',
      hpThreshold: 0.1,
      label: '直接攻撃フェーズ（激昂）',
      onThrone: false,
      attackPatterns: ['死ねえええ！', '消えろおおお！', 'うるさいうるさいうるさい！'],
      attackMult: 2.8,
      minionDef: 'vision',
      minionMaxCount: 6,
      summonCooldown: 1,
    },
  ],
  initialSummonCount: 2,
  transferDamagePerMinion: 60,
  soloTransferMult: 1.5,
  awakenRate: 0.06,
};

export const LYCORIS_AWAKENED_DEF: LycorisDefinition = {
  id: 'lycoris_awakened',
  name: '覚醒Lycoris',
  maxHp: 19000,
  phases: [
    {
      id: 'awakened',
      hpThreshold: 1.0,
      label: '覚醒フェーズ（前半）',
      onThrone: false,
      attackPatterns: ['そっちだよ（覚醒）', 'あっちだよ（覚醒）', 'こっちだよ（覚醒）'],
      attackMult: 2.0,
      minionDef: 'evocator_x',
      minionMaxCount: 4,
      summonCooldown: 2,
    },
    {
      id: 'awakened_fury',
      hpThreshold: 0.5,
      label: '覚醒フェーズ（暴走）',
      onThrone: false,
      attackPatterns: ['——黒く染まれ', '——全て喰らえ', '——終わりだ'],
      attackMult: 3.0,
      minionDef: 'zombie_pigman_y',
      minionMaxCount: 5,
      summonCooldown: 1,
    },
  ],
  initialSummonCount: 2,
  transferDamagePerMinion: 80,
  awakenRate: 0,
};

export const LYCORIS_DROP_TABLE = {
  normal_enemy: [
    { itemId: 'higanbana_petal',  baseRate: 1.0,  min: 1, max: 2 },
    { itemId: 'dimension_energy', baseRate: 1.0,  min: 1, max: 1 },
    { itemId: 'lycoris_gleam',    baseRate: 0.15, min: 1, max: 1 },
    { itemId: 'eerie_seed',       baseRate: 0.60, min: 1, max: 1 },
    { itemId: 'growth_pot',       baseRate: 0.50, min: 1, max: 1 },
    { itemId: 'nutrient_water',   baseRate: 0.10, min: 1, max: 1 },
    { itemId: 'petal_gacha_key',  baseRate: 0.05, min: 1, max: 1 },
  ],
  rightarm: [
    { itemId: 'higanbana_petal',       baseRate: 1.0,  min: 2, max: 4 },
    { itemId: 'nutrient_water',        baseRate: 0.05, min: 1, max: 1 },
    { itemId: 'high_dimension_energy', baseRate: 0.30, min: 1, max: 1 },
  ],
  leftarm: [
    { itemId: 'higanbana_petal',       baseRate: 1.0,  min: 2, max: 4 },
    { itemId: 'growth_pot',            baseRate: 0.05, min: 1, max: 1 },
    { itemId: 'high_dimension_energy', baseRate: 0.30, min: 1, max: 1 },
  ],
  vision_of_lycoris: [
    { itemId: 'higanbana_petal',       baseRate: 1.0,  min: 2, max: 4 },
    { itemId: 'eerie_seed',            baseRate: 0.05, min: 1, max: 1 },
    { itemId: 'high_dimension_energy', baseRate: 0.30, min: 1, max: 1 },
  ],
  boss_normal: [
    { itemId: 'higanbana_petal',  baseRate: 1.0,  min: 3, max: 6 },
    { itemId: 'dimension_energy', baseRate: 1.0,  min: 2, max: 3 },
    { itemId: 'lycoris_gleam',    baseRate: 0.40, min: 1, max: 1 },
    { itemId: 'eerie_seed',       baseRate: 1.0,  min: 1, max: 2 },
    { itemId: 'nutrient_water',   baseRate: 0.20, min: 1, max: 1 },
    { itemId: 'petal_gacha_key',  baseRate: 0.15, min: 1, max: 1 },
  ],
  boss_awakened_bonus: [
    { itemId: 'black_higanbana', baseRate: 0.04, min: 1, max: 1 },
  ],
};

export const AWAKENED_MINION_DEFS = {
  evocator_x: {
    defId: 'evocator_x',
    hp: 45,
    attack: 20,
    ownedByAwakened: true,
    reactiveSkill: { trigger: 'on_hit' as const, effect: 'counter_magic', chance: 0.30 },
  },
  zombie_pigman_y: {
    defId: 'zombie_pigman_y',
    hp: 50,
    attack: 18,
    ownedByAwakened: true,
    reactiveSkill: { trigger: 'hp_below_50pct' as const, effect: 'enrage', atkMultiplier: 1.5 },
  },
};
