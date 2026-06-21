// src/data/infiniteCorridorMaster.ts
// 無限深層回廊（Infinite Corridor）専用マスターデータ
// 仕様書: 無限深層回廊 完全版ダンジョン設計仕様書 準拠
//
// 実装ステージ1: 初級（1〜10階）+ 共通システム設定（続行倍率・敵強化倍率・イベント表など）
// 中級/上級/超上級の敵・ボス・素材・クラフトは後続ステージで追加予定。

import type { ItemMaster, CraftRecipe } from '../types/game';

// ============================================================
// 階層帯 (Tier) 設定
// ============================================================
export type ICTierId = 'beginner' | 'intermediate' | 'advanced' | 'extreme';

export interface ICTierConfig {
  id: ICTierId;
  name: string;
  floorStart: number;
  floorEnd: number;
  theme: string;
  eliteRate: number; // この帯のベースエリート出現率
}

export const IC_TIERS: Record<ICTierId, ICTierConfig> = {
  beginner:     { id: 'beginner',     name: '初級',   floorStart: 1,  floorEnd: 10,  theme: '苔むした石造りの浅層回廊', eliteRate: 0.03 },
  intermediate: { id: 'intermediate', name: '中級',   floorStart: 11, floorEnd: 25,  theme: '黒ずんだ魔鉄の壁の中層回廊', eliteRate: 0.04 },
  advanced:     { id: 'advanced',     name: '上級',   floorStart: 26, floorEnd: 50,  theme: '紫黒に侵食された深淵の回廊', eliteRate: 0.05 },
  extreme:      { id: 'extreme',      name: '超上級', floorStart: 51, floorEnd: 100, theme: '崩壊しかけた虚無の境界',   eliteRate: 0.07 },
};

export function getICTierByFloor(floor: number): ICTierConfig {
  if (floor <= 10) return IC_TIERS.beginner;
  if (floor <= 25) return IC_TIERS.intermediate;
  if (floor <= 50) return IC_TIERS.advanced;
  return IC_TIERS.extreme;
}

// ============================================================
// 続行倍率テーブル（素材ドロップ倍率）
// ============================================================
export interface ICMultiplierBand { floorMin: number; floorMax: number; multiplier: number; }

export const IC_MULTIPLIER_TABLE: ICMultiplierBand[] = [
  { floorMin: 1,  floorMax: 10,  multiplier: 1.0 },
  { floorMin: 11, floorMax: 20,  multiplier: 1.5 },
  { floorMin: 21, floorMax: 30,  multiplier: 2.0 },
  { floorMin: 31, floorMax: 40,  multiplier: 3.0 },
  { floorMin: 41, floorMax: 50,  multiplier: 4.0 },
  { floorMin: 51, floorMax: 75,  multiplier: 6.0 },
  { floorMin: 76, floorMax: 100, multiplier: 10.0 },
];

export function getICMultiplier(floor: number): number {
  const band = IC_MULTIPLIER_TABLE.find(b => floor >= b.floorMin && floor <= b.floorMax);
  return band?.multiplier ?? 1.0;
}

// エリート出現率（階層帯ごとに段階上昇。仕様書: 初期3%→21階以降4%→41階以降5%→76階以降7%）
export function getICEliteRate(floor: number): number {
  if (floor >= 76) return 0.07;
  if (floor >= 41) return 0.05;
  if (floor >= 21) return 0.04;
  return 0.03;
}

// ============================================================
// 敵強化倍率（5階ごとに複利で積み上がる）
// HP+15% / 攻撃+12% / 防御+8%
// ============================================================
export const IC_SCALING_PER_BLOCK = { hp: 0.15, attack: 0.12, defense: 0.08 };

/** 指定階層に対応する強化ブロック数 (1〜5階=0回, 6〜10階=1回, 11〜15階=2回 ...) */
export function getICScaleBlockCount(floor: number): number {
  return Math.floor((floor - 1) / 5);
}

export function getICScaledStats(baseHp: number, baseAtk: number, baseDef: number, floor: number) {
  const blocks = getICScaleBlockCount(floor);
  const hp  = Math.round(baseHp  * Math.pow(1 + IC_SCALING_PER_BLOCK.hp,      blocks));
  const atk = Math.round(baseAtk * Math.pow(1 + IC_SCALING_PER_BLOCK.attack,  blocks));
  const def = Math.round(baseDef * Math.pow(1 + IC_SCALING_PER_BLOCK.defense, blocks));
  return { hp, atk, def };
}

// ============================================================
// 敵データ型（仕様書のスキル構成をそのまま保持するための専用型）
// ============================================================
export interface ICEnemySkill {
  name: string;
  description: string;
}

export interface ICEnemy {
  id: string;
  name: string;
  species: string;          // システム/社会階級表記（例: 粘体, 獣, 亜人）
  icon: string;
  floorMin: number;
  floorMax: number;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  accuracy: number;         // 命中率 (0-1)
  role: string;             // 役割（雑魚火力型/速度型 等）
  resistance?: string;
  weakness?: string;
  passive?: ICEnemySkill;
  skills: ICEnemySkill[];
  flavorReason: string;     // 「嫌らしい理由」
  dexEntry: string;         // 図鑑登録テキスト
  drops: { itemId: string; rate: number; min: number; max: number }[];
  isElite?: boolean;
  isBoss?: boolean;
  eliteSpawnRate?: number;  // エリート専用：出現率
}

export interface ICBossPhase {
  hpThresholdPct: number; // このHP%以下で移行
  description: string;
  skills: string[];
}

export interface ICBoss extends ICEnemy {
  isBoss: true;
  phases: ICBossPhase[];
  craftUnlockItemId?: string; // 初回撃破で解放されるレシピの出力アイテムID
  repeatDropBonusItemId?: string;
  repeatDropBonusRate?: number;
}

// ============================================================
// 初級（1〜10階）敵データ
// ============================================================
export const IC_ENEMIES_BEGINNER: Record<string, ICEnemy> = {
  ic_slime: {
    id: 'ic_slime', name: 'スライム', species: '粘体', icon: 'slime_green',
    floorMin: 1, floorMax: 5, baseHp: 50, baseAttack: 8, baseDefense: 2, baseSpeed: 10,
    accuracy: 0.90, role: '雑魚火力型',
    weakness: '貫通攻撃に弱い（防御2しかないため）',
    passive: { name: '粘体の弾力', description: '被ダメージを固定5%軽減する。' },
    skills: [
      { name: '体当たり', description: '単体・低威力の通常攻撃。' },
      { name: '分裂', description: 'HP30%以下になった時、1回だけHP15のスライムを1体追加召喚する。' },
      { name: '体当たり（強化版）', description: '3ターンに1回、通常の1.5倍ダメージを与える。' },
    ],
    flavorReason: '分裂で数が増えると雑魚処理を誤った時にテンポが崩れる',
    dexEntry: '最も初歩的な深層生物。体当たりと分裂で数を増やす。貫通攻撃には弱い',
    drops: [{ itemId: 'ic_slime_jelly', rate: 0.80, min: 1, max: 2 }, { itemId: 'ic_mana_fragment', rate: 0.10, min: 1, max: 1 }],
  },
  ic_wolf: {
    id: 'ic_wolf', name: 'ウルフ', species: '獣', icon: 'wolf',
    floorMin: 2, floorMax: 8, baseHp: 70, baseAttack: 15, baseDefense: 5, baseSpeed: 20,
    accuracy: 0.95, role: '速度型',
    weakness: '範囲攻撃に弱い（単独行動のため囲まれると脆い）',
    passive: { name: '俊敏', description: '先制行動率+20%。' },
    skills: [
      { name: '噛みつき', description: '通常攻撃。' },
      { name: '連続噛みつき', description: '2回攻撃（各0.6倍ダメージ）。' },
      { name: '出血付与', description: '3ターン継続ダメージ、毎ターンHP4%。' },
    ],
    flavorReason: '出血の継続ダメージが地味に削ってくる上、速度が高く先制されやすい',
    dexEntry: '深層の獣。出血を撒き散らしながら噛みつく。先制を取られやすい',
    drops: [{ itemId: 'ic_beast_bone', rate: 0.60, min: 1, max: 1 }, { itemId: 'ic_ancient_leather', rate: 0.40, min: 1, max: 1 }],
  },
  ic_goblin: {
    id: 'ic_goblin', name: 'ゴブリン', species: '亜人', icon: 'goblin',
    floorMin: 1, floorMax: 10, baseHp: 100, baseAttack: 12, baseDefense: 10, baseSpeed: 12,
    accuracy: 0.88, role: 'バランス型',
    passive: { name: '群れの強さ', description: '同種が2体以上いる場合、攻撃+10%。' },
    skills: [
      { name: '棍棒打ち', description: '通常攻撃。' },
      { name: '投石', description: '中距離単体攻撃。' },
      { name: '集団突撃', description: 'ゴブリンが2体以上いる時、全体に1.3倍ダメージ。' },
    ],
    flavorReason: '複数体放置すると集団突撃の倍率が乗ってくる',
    dexEntry: '群れで行動する亜人。数が揃うと侮れない火力になる',
    drops: [{ itemId: 'ic_ancient_leather', rate: 0.30, min: 1, max: 1 }, { itemId: 'ic_mana_fragment', rate: 0.20, min: 1, max: 1 }],
  },
  ic_skeleton: {
    id: 'ic_skeleton', name: '朽ちた骸骨兵', species: '不死身', icon: 'skeleton',
    floorMin: 4, floorMax: 10, baseHp: 90, baseAttack: 14, baseDefense: 8, baseSpeed: 9,
    accuracy: 0.90, role: '雑魚火力型（物理特化）',
    resistance: '状態異常（毒・出血）完全耐性',
    weakness: '打撃武器に弱い（被ダメ+15%）',
    passive: { name: '不死の軀体', description: '状態異常無効。' },
    skills: [
      { name: '錆びた剣での斬撃', description: '通常攻撃。' },
      { name: '骨の盾構え', description: '次の1回の被ダメージを30%軽減する。' },
      { name: '強撃', description: '2ターンに1回、1.4倍ダメージ。' },
    ],
    flavorReason: '状態異常が一切効かないため、出血デバフ役のウルフと組み合わせて出されると対処を切り替える必要がある',
    dexEntry: '朽ちても動き続ける骸骨剣士。状態異常は一切通じない',
    drops: [{ itemId: 'ic_beast_bone', rate: 0.40, min: 1, max: 1 }, { itemId: 'ic_reinforced_bone', rate: 0.05, min: 1, max: 1 }],
  },
  ic_bat: {
    id: 'ic_bat', name: '洞窟コウモリ', species: 'フライト', icon: 'bat',
    floorMin: 3, floorMax: 9, baseHp: 40, baseAttack: 10, baseDefense: 12, baseSpeed: 25,
    accuracy: 0.85, role: '速度型（回避特化）',
    weakness: '範囲攻撃（回避不可のため確定ヒット）',
    passive: { name: '飛行', description: '地上専用攻撃を50%回避する。' },
    skills: [
      { name: '体当たり', description: '低威力・高頻度の通常攻撃。' },
      { name: '超音波', description: '次ターンのプレイヤー命中率-10%（2ターン継続）。' },
    ],
    flavorReason: '単体回避率が高く、単体狙い武器だと取りこぼしやすい',
    dexEntry: '素早く飛び回る小型コウモリ。単体攻撃を避けがち',
    drops: [{ itemId: 'ic_ancient_leather', rate: 0.20, min: 1, max: 1 }, { itemId: 'ic_mana_fragment', rate: 0.15, min: 1, max: 1 }],
  },
  ic_enraged_ogre: {
    id: 'ic_enraged_ogre', name: '狂暴なオーガ', species: '初級エリート', icon: 'ogre',
    floorMin: 6, floorMax: 9, baseHp: 600, baseAttack: 45, baseDefense: 25, baseSpeed: 8,
    accuracy: 0.90, role: 'エリート', isElite: true, eliteSpawnRate: 0.03,
    skills: [
      { name: '大振り', description: '1.8倍単体ダメージ。外れると2ターン隙が生まれる。' },
      { name: '激怒', description: 'HP50%以下で攻撃+30%（以後継続）。' },
      { name: '岩投げ', description: '範囲攻撃、全体0.8倍。' },
    ],
    flavorReason: '大振りの外し隙を狙うか手堅く受けるかの判断を強いられる',
    dexEntry: '初級帯では破格の強化骨ドロップ源。中級準備の近道となるエリート個体',
    drops: [{ itemId: 'ic_ogre_bone', rate: 1.00, min: 1, max: 1 }, { itemId: 'ic_reinforced_bone', rate: 0.30, min: 1, max: 1 }],
  },
};

// ============================================================
// 初級ボス：洞窟オーガ（10階）
// ============================================================
export const IC_BOSS_CAVE_OGRE: ICBoss = {
  id: 'ic_cave_ogre', name: '洞窟オーガ', species: 'ボス', icon: 'ogre_boss',
  floorMin: 10, floorMax: 10, baseHp: 500, baseAttack: 35, baseDefense: 20, baseSpeed: 10,
  accuracy: 0.90, role: 'ボス', isBoss: true,
  skills: [
    { name: '通常攻撃（2連続）', description: '基本行動。通常攻撃を2回連続で行う。' },
    { name: '地響き', description: '全体0.7倍攻撃。' },
    { name: '岩石投擲', description: '単体1.3倍攻撃。' },
    { name: '激怒（フェーズ2）', description: 'HP50%で移行。攻撃+50%、地響きを追加使用。' },
  ],
  flavorReason: 'フェーズ2移行後の地響きで回復が追いつかなくなりやすい',
  dexEntry: '初級ダンジョンの主。フェーズ移行直後の連続行動に要警戒',
  drops: [{ itemId: 'ic_ogre_bone', rate: 1.00, min: 1, max: 1 }, { itemId: 'ic_beginner_boss_proof', rate: 1.00, min: 1, max: 1 }],
  phases: [
    { hpThresholdPct: 100, description: '通常攻撃を2回連続。', skills: ['通常攻撃×2'] },
    { hpThresholdPct: 50,  description: '激怒状態。攻撃+50%、地響きの使用頻度上昇。', skills: ['地響き', '岩石投擲', '激怒'] },
  ],
  craftUnlockItemId: 'ic_beast_leather_armor',
  repeatDropBonusItemId: 'ic_reinforced_bone',
  repeatDropBonusRate: 0.05,
};

export const IC_ALL_BEGINNER_ENEMIES: Record<string, ICEnemy> = {
  ...IC_ENEMIES_BEGINNER,
  ic_cave_ogre: IC_BOSS_CAVE_OGRE,
};

// ============================================================
// 素材・アイテム（初級帯分）
// ============================================================
export const IC_ITEMS: Record<string, ItemMaster> = {
  ic_slime_jelly:     { id: 'ic_slime_jelly',     name: 'スライムゼリー', description: '無限深層回廊・初級の基礎素材。スライムが落とす。', category: 'material', itemType: 'Item', rarity: 'common', sellPrice: 6,  buyPrice: 0, maxStack: -1, icon: 'slime_jelly' },
  ic_beast_bone:      { id: 'ic_beast_bone',      name: '獣骨',          description: '無限深層回廊・初級の基礎素材。ウルフや骸骨兵が落とす。', category: 'material', itemType: 'Item', rarity: 'common', sellPrice: 8,  buyPrice: 0, maxStack: -1, icon: 'bone' },
  ic_ancient_leather: { id: 'ic_ancient_leather', name: '古革',          description: '無限深層回廊・初級の基礎素材。', category: 'material', itemType: 'Item', rarity: 'common', sellPrice: 7,  buyPrice: 0, maxStack: -1, icon: 'leather' },
  ic_mana_fragment:   { id: 'ic_mana_fragment',   name: '魔力欠片',      description: '無限深層回廊・初級の基礎素材。消耗品強化に使う。', category: 'material', itemType: 'Item', rarity: 'common', sellPrice: 10, buyPrice: 0, maxStack: -1, icon: 'mana_shard' },
  ic_ogre_bone:        { id: 'ic_ogre_bone',        name: 'オーガ骨',      description: '狂暴なオーガ・洞窟オーガ限定の特殊素材。初級限定レシピに使用する最上位素材。', category: 'material', itemType: 'Item', rarity: 'uncommon', sellPrice: 40, buyPrice: 0, maxStack: -1, icon: 'ogre_bone' },
  ic_reinforced_bone:  { id: 'ic_reinforced_bone',  name: '強化骨',        description: '中級帯の中間素材。初級帯でも狂暴なオーガ等から先行ドロップする。', category: 'material', itemType: 'Item', rarity: 'uncommon', sellPrice: 35, buyPrice: 0, maxStack: -1, icon: 'reinforced_bone' },
  ic_beginner_boss_proof: { id: 'ic_beginner_boss_proof', name: '初級ボス証', description: '洞窟オーガ撃破の証。レシピ解放に使用。', category: 'material', itemType: 'Item', rarity: 'uncommon', sellPrice: 0, buyPrice: 0, maxStack: -1, icon: 'boss_proof' },

  // クラフト品
  ic_beast_leather_armor: { id: 'ic_beast_leather_armor', name: '獣革の軽装', description: '無限深層回廊初級ボス「洞窟オーガ」初回撃破で解放されるレシピ。防御力+15、スピード+5。', category: 'armor', itemType: 'Armor', rarity: 'common', sellPrice: 0, buyPrice: 0, maxStack: 1, icon: 'leather_armor', armorSlot: 'chestplate' as const, weaponDef: 15 },
  ic_slime_potion:        { id: 'ic_slime_potion',        name: 'スライムの応急薬', description: '戦闘中HPを30回復する消耗品。（無限深層回廊の周回判断用の保険アイテム）', category: 'consumable', itemType: 'Item', rarity: 'common', sellPrice: 0, buyPrice: 0, maxStack: -1, icon: 'potion_red', useEffect: { hpRestore: 30, message: 'スライムの応急薬を使った！' } },
};

export const IC_CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'ic_recipe_beast_leather_armor',
    name: '獣革の軽装',
    description: '古革10枚、獣の骨5個から作る初級防具。洞窟オーガ初回撃破で解放。',
    outputItemId: 'ic_beast_leather_armor', outputAmount: 1,
    inputs: [{ itemId: 'ic_ancient_leather', amount: 10 }, { itemId: 'ic_beast_bone', amount: 5 }],
    requiredCraftingLevel: 1, craftingExpGain: 20,
  },
  {
    id: 'ic_recipe_slime_potion',
    name: 'スライムの応急薬',
    description: 'スライムゼリー3個から作る消耗品。戦闘中HP30%回復。',
    outputItemId: 'ic_slime_potion', outputAmount: 1,
    inputs: [{ itemId: 'ic_slime_jelly', amount: 3 }],
    requiredCraftingLevel: 1, craftingExpGain: 5,
  },
];

// ============================================================
// 素材昇格（商人交換）：下位素材5個→上位素材1個
// ============================================================
export const IC_MERCHANT_UPGRADES: { fromItemId: string; toItemId: string; fromAmount: number }[] = [
  { fromItemId: 'ic_slime_jelly', toItemId: 'ic_reinforced_bone', fromAmount: 5 },
];

// ============================================================
// ランダムイベント表（出現率は仕様書の指定値）
// ============================================================
export type ICEventType = 'treasure' | 'mimic' | 'spring' | 'altar' | 'merchant';

export const IC_EVENT_TABLE: { type: ICEventType; rate: number; label: string }[] = [
  { type: 'treasure', rate: 0.60, label: '宝箱' },
  { type: 'mimic',     rate: 0.15, label: 'ミミック' },
  { type: 'spring',    rate: 0.10, label: '泉' },
  { type: 'altar',     rate: 0.10, label: '祭壇' },
  { type: 'merchant',  rate: 0.05, label: '商人' },
];

export function rollICEvent(rand: number): ICEventType {
  let acc = 0;
  for (const e of IC_EVENT_TABLE) {
    acc += e.rate;
    if (rand < acc) return e.type;
  }
  return 'treasure';
}

// ============================================================
// 続行/帰還の脅威レベル（★1〜★5）算出
// ============================================================
export function getICThreatStars(nextFloor: number): number {
  const mult = getICMultiplier(nextFloor);
  if (mult >= 10) return 5;
  if (mult >= 6)  return 4;
  if (mult >= 3)  return 3;
  if (mult >= 1.5) return 2;
  return 1;
}

// 倍率帯が切り替わる直前階層（警告メッセージを出す階層）
export const IC_MULTIPLIER_JUMP_WARNING_FLOORS = [20, 30, 50, 75];
