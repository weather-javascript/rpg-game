// src/data/petsData.ts
// ver3.0.0: ペット（仲間）システムのマスターデータ。
// 統一名称は「ペット」。戦闘・採取・釣り・店売り・探索・収集を補助する。

import type { ItemMaster } from '../types/game';
import type { PetSkillDef, PetSpeciesDef } from '../types/buildTypes';

export const PET_SKILL_MASTER: Record<string, PetSkillDef> = {
  pet_follow_strike:   { id: 'pet_follow_strike', name: '追撃', description: '戦闘時、攻撃力に上乗せする追撃効果。', effects: { atkPct: 0.03 } },
  pet_guard:           { id: 'pet_guard', name: 'かばう', description: '戦闘時、防御力を高めて主人をかばう。', effects: { defPct: 0.04 } },
  pet_heal_aura:       { id: 'pet_heal_aura', name: '回復オーラ', description: '回復量が上昇する。', effects: { healPct: 0.06 } },
  pet_gather_helper:   { id: 'pet_gather_helper', name: '採取補助', description: '採取成功率・採取量が上昇する。', effects: { gatherSuccessPct: 0.04, gatherYieldPct: 0.05 } },
  pet_fish_helper:     { id: 'pet_fish_helper', name: '釣り補助', description: '釣りの成功率・レア度が上昇する。', effects: { fishSuccessMult: 1.05, fishRarePct: 0.03 } },
  pet_haggle:          { id: 'pet_haggle', name: '値切り上手', description: '店売り価格が上昇する。', effects: { sellPriceMult: 1.05 } },
  pet_scout:           { id: 'pet_scout', name: '探索の目', description: 'ドロップ率と先制率が上昇する。', effects: { dropRatePct: 0.04, preemptiveChance: 0.03 } },
  pet_collector_nose:  { id: 'pet_collector_nose', name: '収集の鼻', description: 'ドロップ率が上昇する。', effects: { dropRatePct: 0.06 } },
  pet_lucky_charm:     { id: 'pet_lucky_charm', name: '幸運のお守り', description: 'ギャンブル配当倍率が上昇する。', effects: { gambleMult: 1.04 } },
  pet_scholar:         { id: 'pet_scholar', name: '物覚えの良さ', description: '経験値獲得量が上昇する。', effects: { expMult: 1.05, skillExpMult: 1.05 } },
};

export const PET_SPECIES_MASTER: Record<string, PetSpeciesDef> = {
  slime_pup: {
    id: 'slime_pup', name: 'スライムパップ', description: '始まりの洞窟のスライムから生まれた一番手軽な仲間。',
    rarity: 'common', roleTags: ['combat', 'gather'],
    baseAtk: 3, baseDef: 2, baseHp: 20,
    passiveSkillIds: ['pet_follow_strike'],
    evolution: [
      { stage: 0, name: 'スライムパップ', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'slime' },
      { stage: 1, name: 'スライムフレンド', requiredLevel: 20, requiredBond: 30, statMult: 1.6, icon: 'slime' },
      { stage: 2, name: 'キングスライム・パル', requiredLevel: 50, requiredBond: 70, statMult: 2.4, icon: 'slime' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'drop', detail: '始まりの洞窟・ゴブリンの巣窟のスライムから低確率ドロップ' }],
    codexHintWhenUnseen: '始まりの洞窟周辺で何かが懐いてくるかもしれない…',
  },
  goblin_cub: {
    id: 'goblin_cub', name: 'ゴブリンの子', description: 'ゴブリンの巣窟で保護された小さなゴブリン。',
    rarity: 'common', roleTags: ['combat', 'explore'],
    baseAtk: 5, baseDef: 1, baseHp: 18,
    passiveSkillIds: ['pet_scout'],
    evolution: [
      { stage: 0, name: 'ゴブリンの子', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'goblin' },
      { stage: 1, name: 'ゴブリン戦士パル', requiredLevel: 25, requiredBond: 40, statMult: 1.7, icon: 'goblin' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'drop', detail: 'ゴブリンの巣窟のゴブリンから低確率ドロップ' }],
    codexHintWhenUnseen: 'ゴブリンの巣窟の奥に、群れに馴染めない一匹がいるらしい。',
  },
  herb_wolf_cub: {
    id: 'herb_wolf_cub', name: 'ハーブウルフの仔', description: 'FF1ウルフゾーンで育った小さな狼。採取の鼻が利く。',
    rarity: 'uncommon', roleTags: ['gather', 'explore'],
    baseAtk: 6, baseDef: 3, baseHp: 26,
    passiveSkillIds: ['pet_gather_helper'],
    evolution: [
      { stage: 0, name: 'ハーブウルフの仔', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'wolf' },
      { stage: 1, name: 'ハーブウルフ', requiredLevel: 25, requiredBond: 40, statMult: 1.7, icon: 'wolf' },
      { stage: 2, name: '森の守り狼', requiredLevel: 55, requiredBond: 80, statMult: 2.6, icon: 'wolf' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'drop', detail: 'FF1ウルフゾーンのハーブウルフから低確率ドロップ' }],
    codexHintWhenUnseen: 'FF1のウルフゾーンで、ウルフマロウを運んでくる小さな影が見える。',
  },
  spirit_motelet: {
    id: 'spirit_motelet', name: 'リトルスピリット', description: 'FF洞窟群に住む精霊の幼体。宝石の匂いに敏感。',
    rarity: 'uncommon', roleTags: ['gather', 'collect'],
    baseAtk: 4, baseDef: 4, baseHp: 22,
    passiveSkillIds: ['pet_collector_nose'],
    evolution: [
      { stage: 0, name: 'リトルスピリット', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'spirit' },
      { stage: 1, name: 'スピリット', requiredLevel: 30, requiredBond: 45, statMult: 1.8, icon: 'spirit' },
      { stage: 2, name: '洞窟王の眷属', requiredLevel: 60, requiredBond: 85, statMult: 2.8, icon: 'spirit' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'drop', detail: 'FF洞窟1〜3の精霊・精霊王から低確率ドロップ' }],
    codexHintWhenUnseen: 'FF洞窟の奥、宝石の輝きに混じって小さな光が動いている。',
  },
  scout_squire: {
    id: 'scout_squire', name: '偵察騎士見習い', description: 'FF1で保護された幼い偵察騎士。商才がある。',
    rarity: 'rare', roleTags: ['market', 'explore'],
    baseAtk: 8, baseDef: 6, baseHp: 30,
    passiveSkillIds: ['pet_haggle'],
    evolution: [
      { stage: 0, name: '偵察騎士見習い', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'knight' },
      { stage: 1, name: '偵察騎士パル', requiredLevel: 35, requiredBond: 50, statMult: 1.9, icon: 'knight' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'drop', detail: 'FF1の偵察騎士から低確率ドロップ' }, { tag: 'exchange', detail: 'FF小判100枚と交換' }],
    codexHintWhenUnseen: 'FF1の偵察騎士の中に、やけに人懐っこい一体がいる。',
  },
  poison_slim_pal: {
    id: 'poison_slim_pal', name: 'スラムインの仔', description: 'FF2スラムイゾーンで育った小さな個体。',
    rarity: 'rare', roleTags: ['combat', 'collect'],
    baseAtk: 10, baseDef: 5, baseHp: 34,
    passiveSkillIds: ['pet_collector_nose', 'pet_follow_strike'],
    evolution: [
      { stage: 0, name: 'スラムインの仔', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'slime' },
      { stage: 1, name: 'スラムインパル', requiredLevel: 35, requiredBond: 55, statMult: 1.9, icon: 'slime' },
      { stage: 2, name: 'スラムイキングの血族', requiredLevel: 65, requiredBond: 90, statMult: 2.9, icon: 'slime' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'drop', detail: 'FF2スラムイゾーンのモンスターから低確率ドロップ' }],
    codexHintWhenUnseen: 'FF2のスラムイゾーンに、やや色の薄い個体が紛れている。',
  },
  comet_jelly: {
    id: 'comet_jelly', name: 'コメットジェリー', description: '海原・巨大彗星の欠片から生まれた水生生物。',
    rarity: 'rare', roleTags: ['fish', 'collect'],
    baseAtk: 5, baseDef: 5, baseHp: 28,
    passiveSkillIds: ['pet_fish_helper'],
    evolution: [
      { stage: 0, name: 'コメットジェリー', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'fish' },
      { stage: 1, name: 'コメットジェリー・ロイヤル', requiredLevel: 40, requiredBond: 60, statMult: 2.0, icon: 'fish' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'drop', detail: 'FF2海岸エリアの巨大彗星・シーメモリアから低確率ドロップ' }, { tag: 'aquarium', detail: '水族館の登録数が一定数を超えると交換所に出現' }],
    aquariumLinkBonus: { requiredFishBookCount: 20, effects: { fishSuccessMult: 1.08, fishRarePct: 0.04 } },
    codexHintWhenUnseen: '海岸の波間に、彗星の光をまとった何かが漂っている。',
  },
  dark_knight_squire: {
    id: 'dark_knight_squire', name: '暗黒騎士の従者', description: '暗黒騎士オメガに付き従う小さな騎士。',
    rarity: 'epic', roleTags: ['combat', 'explore'],
    baseAtk: 16, baseDef: 14, baseHp: 50,
    passiveSkillIds: ['pet_guard', 'pet_follow_strike'],
    evolution: [
      { stage: 0, name: '暗黒騎士の従者', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'dark_knight' },
      { stage: 1, name: '暗黒騎士パル',   requiredLevel: 45, requiredBond: 65, statMult: 2.1, icon: 'dark_knight' },
      { stage: 2, name: '無銘の従者',     requiredLevel: 75, requiredBond: 95, statMult: 3.2, icon: 'dark_knight' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'drop', detail: 'FF2暗黒騎士オメガ・ナイト・メアから超低確率ドロップ' }],
    codexHintWhenUnseen: '暗黒騎士オメガの周囲に、ごく稀に小さな従者の影が見える。',
  },
  deep_abyss_wisp: {
    id: 'deep_abyss_wisp', name: '深淵の灯', description: '深淵の断魔剣の刻印から生まれたとされる不思議な灯。',
    rarity: 'epic', roleTags: ['combat', 'collect'],
    baseAtk: 14, baseDef: 10, baseHp: 44,
    passiveSkillIds: ['pet_scholar', 'pet_collector_nose'],
    evolution: [
      { stage: 0, name: '深淵の灯', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'spirit' },
      { stage: 1, name: '深淵の灯火', requiredLevel: 45, requiredBond: 65, statMult: 2.1, icon: 'spirit' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'quest', detail: '深淵の断魔剣をクラフトすると報酬で入手できる' }],
    codexHintWhenUnseen: '深淵の断魔剣を鍛え上げた者だけが、その灯に気づくという。',
  },
  lycoris_familiar: {
    id: 'lycoris_familiar', name: 'リコリスの眷属', description: '彼岸花の檻のLycorisに従っていた小さな眷属。',
    rarity: 'epic', roleTags: ['combat', 'collect'],
    baseAtk: 18, baseDef: 12, baseHp: 48,
    passiveSkillIds: ['pet_collector_nose', 'pet_scout'],
    evolution: [
      { stage: 0, name: 'リコリスの眷属', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'spirit' },
      { stage: 1, name: 'リコリスの分体', requiredLevel: 50, requiredBond: 70, statMult: 2.2, icon: 'spirit' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'drop', detail: '彼岸花の檻【裏初級】のLycorisから低確率ドロップ' }, { tag: 'event', detail: '覚醒Lycoris撃破イベント報酬' }],
    codexHintWhenUnseen: '玉座の間で散った眷属の一部が、まだ淡く息づいているという噂がある。',
  },
  astral_motelet: {
    id: 'astral_motelet', name: 'アストラルウィスプ', description: '星骸宇宙砦 アストラル・ノクスの深部に住む光体。',
    rarity: 'legendary', roleTags: ['combat', 'explore', 'collect'],
    baseAtk: 26, baseDef: 20, baseHp: 70,
    passiveSkillIds: ['pet_scholar', 'pet_scout', 'pet_guard'],
    evolution: [
      { stage: 0, name: 'アストラルウィスプ', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'spirit' },
      { stage: 1, name: 'アストラルガーディアン', requiredLevel: 60, requiredBond: 80, statMult: 2.4, icon: 'spirit' },
      { stage: 2, name: 'コズミックウィスプ',     requiredLevel: 100, requiredBond: 99, statMult: 3.6, icon: 'spirit' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'quest', detail: '太陽航路・虚空航路・月面遺構いずれかのボス撃破報酬' }, { tag: 'codex', detail: '図鑑コンプリート報酬' }],
    codexHintWhenUnseen: 'アストラル・ノクスの最深部で、星のかけらが動いた気がした。',
  },
  golden_tortoise: {
    id: 'golden_tortoise', name: '黄金のミニ亀', description: '水族館の展示が一定数を超えた時にだけ現れる縁起物。',
    rarity: 'legendary', roleTags: ['market', 'collect'],
    baseAtk: 6, baseDef: 18, baseHp: 60,
    passiveSkillIds: ['pet_haggle', 'pet_lucky_charm'],
    evolution: [
      { stage: 0, name: '黄金のミニ亀', requiredLevel: 1,  requiredBond: 0,  statMult: 1.0, icon: 'turtle' },
      { stage: 1, name: '黄金の亀',     requiredLevel: 50, requiredBond: 75, statMult: 2.2, icon: 'turtle' },
    ],
    awakeningMax: 5,
    acquisition: [{ tag: 'aquarium', detail: '水族館の登録魚数が一定数を超えると入手チャンスが出現' }],
    aquariumLinkBonus: { requiredFishBookCount: 40, effects: { sellPriceMult: 1.08, gambleMult: 1.05 } },
    codexHintWhenUnseen: '水族館の水槽の隅に、黄金色の小さな影が映ることがあるらしい。',
  },
};

// 既存モンスターIDからのペットドロップ定義（MONSTER_MASTER 自体は無改修）
export const MONSTER_PET_DROPS: Record<string, { speciesId: string; rate: number }[]> = {
  slime: [{ speciesId: 'slime_pup', rate: 0.003 }],
  goblin: [{ speciesId: 'goblin_cub', rate: 0.003 }],
};

export const PET_ITEMS: Record<string, ItemMaster> = {
  pet_bond_treat: { id: 'pet_bond_treat', name: '絆のエサ', description: 'ペットに与えると絆ポイントが増える。', category: 'consumable', itemType: 'Item', rarity: 'common', sellPrice: 20, buyPrice: 40, maxStack: 99, icon: 'food' },
  pet_evolution_crystal: { id: 'pet_evolution_crystal', name: '進化結晶', description: 'ペットの進化に使用する結晶。', category: 'material', itemType: 'Item', rarity: 'rare', sellPrice: 300, buyPrice: 0, maxStack: 99, icon: 'gem_blue' },
  pet_awaken_feather: { id: 'pet_awaken_feather', name: '覚醒の羽根', description: 'ペットの覚醒（限界突破）に使用する羽根。', category: 'material', itemType: 'Item', rarity: 'epic', sellPrice: 800, buyPrice: 0, maxStack: 99, icon: 'feather' },
  pet_summon_whistle: { id: 'pet_summon_whistle', name: '召喚の口笛', description: '交換所でペットと交換する際に使用する。', category: 'material', itemType: 'Item', rarity: 'rare', sellPrice: 500, buyPrice: 0, maxStack: 99, icon: 'scroll' },
};

export const PET_EXCHANGE_TABLE: { speciesId: string; cost: { itemId: string; amount: number }[] }[] = [
  { speciesId: 'scout_squire', cost: [{ itemId: 'ff_coin_small', amount: 100 }] },
  { speciesId: 'comet_jelly', cost: [{ itemId: 'pet_summon_whistle', amount: 3 }] },
  { speciesId: 'golden_tortoise', cost: [{ itemId: 'pet_summon_whistle', amount: 10 }] },
];

export const PET_BOND_PER_TREAT = 5;
export const PET_BOND_MAX = 100;
