// src/types/game.ts

import type { EquipmentBuildState, VocationState, PetState, LifeSystemState } from './buildTypes';

export type IdMap<T> = Record<string, T>;
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemCategory = 'material' | 'tool' | 'consumable' | 'weapon' | 'armor' | 'treasure' | 'food' | 'potion' | 'bait';
export type ItemType = 'Weapon' | 'Armor' | 'Item' | 'Heal';
export type SkillId = 'mining' | 'woodcutting' | 'combat' | 'fishing' | 'crafting' | 'gathering' | 'herbalism' | 'insect';
export type GatherCategory = 'mining' | 'woodcutting' | 'gathering' | 'herbalism' | 'insect';

// ============================================================
// 共通バフ・デバフ型
// ============================================================
export interface CombatBuff {
  type: string;   // 'poison' | 'atk_up' | 'shield' | 'burn' | 'freeze' | 'curse' | ...
  value: number;  // ダメージ量 / 上昇量 / カット率など
  turns: number;  // 残ターン数
  meta?: { weaponId?: string; weaponName?: string; hits?: { dmg: number; count: number; penetrate: boolean }[]; cooldownTurns?: number; [key: string]: unknown };
}

// ============================================================
// 共通オフハンド効果型
// ============================================================
export interface OffhandEffect {
  type: 'offhand_mana_regen' | 'offhand_hp_regen' | 'offhand_crit_up' | 'offhand_mana_on_heal';
  value: number;
  chance?: number;
  requiredOffhandItemId?: string;
}

// ============================================================
// 武器スキル型
// ============================================================
export interface WeaponPassiveSkill {
  type: 'penetrate_per_turn';   // 毎ターン貫通ダメージ
  value: number;
}
export interface WeaponRegenSkill {
  type: 'regen_per_turn';       // 毎ターン回復
  hpRestore?: number;
  satietyRestore?: number;
}
export interface WeaponShieldSkill {
  type: 'hotbar_shield';        // ホットバー装備中に敵攻撃カット
  cutPercent: number;
}
/**
 * goliath_shield: 発動後shieldTurns分の敵の攻撃を全て被ダメージ1に固定（実質無敵）、
 * 無敵終了時にHP+20回復、
 * 出現している敵の1体を次のフェーズ攻撃不可にする
 * 発動後cooldownTurnsはクールダウン
 */
export interface WeaponGoliathSkill {
  type: 'goliath_shield';
  shieldTurns: number;     // 4（無敵ターン数）
  cooldownTurns: number;   // 7
}
/**
 * mana_charge: 毎ターン固定Mana獲得型（変幻など）
 * 共通Manaシステムを使用。manaMaxは武器固有。
 */
export interface WeaponManaSkill {
  type: 'mana_charge';          // MANAチャージ型必殺技
  manaPerTurn: number;
  manaMax: number;
}
/**
 * offhand_mana_on_heal: 回復アイテム使用時に確率でMana獲得（Memory of Flowerなど）
 * 共通Manaシステムを使用。
 */
export interface WeaponOffhandManaOnHealSkill {
  type: 'offhand_mana_on_heal';
  offhandItemId: string;
  chance: number;
  manaGain: number;
}
/**
 * mana_per_turn_random: 毎ターンランダムMana付与（Diamond Staffなど）
 * 共通Manaシステムを使用。manaMaxは武器固有。
 */
export interface WeaponManaPerTurnRandomSkill {
  type: 'mana_per_turn_random';
  manaMin: number;
  manaMax: number;
  manaStep: number;
}
/**
 * silvers_eye: 連続発動型必殺技（=Silvers eye=）
 * 発動するとマナをmanaCostずつ消費して物理attackDmg＋貫通penetrateDmgのダメージを与え、
 * 出現している敵が全滅するかマナが尽きるまで連続発動する。
 * 全て終わった時点でmanaRestoreだけマナを回復し、発動後cooldownTurnsターンは使用不可。
 */
export interface WeaponSilversEyeSkill {
  type: 'silvers_eye';
  manaCost: number;       // 1回の発動に必要なマナ
  attackDmg: number;       // 物理ダメージ
  penetrateDmg: number;    // 貫通ダメージ
  manaRestore: number;     // 連続発動が終了した時に回復するマナ量
  cooldownTurns: number;   // 発動後のクールダウンターン数
}
/**
 * frostbite_self_damage: 攻撃時に自分自身が凍傷ダメージを受ける（=冷海の覇魚=など）
 */
export interface WeaponFrostbiteSelfDamageSkill {
  type: 'frostbite_self_damage';
  selfDamage: number;
}
/**
 * penetrate_on_use_chance: 使用時に一定確率で敵に貫通ダメージを与える（=冷海の覇魚=など）
 */
export interface WeaponPenetrateOnUseChanceSkill {
  type: 'penetrate_on_use_chance';
  chance: number;          // 0.0〜1.0
  penetrateDamage: number;
}
/**
 * burn_per_turn: 毎ターン敵全体に燃焼ダメージを与える（=業炎の剣=など）
 * totalDamageを生存敵数で割った値を各敵に与える
 */
export interface WeaponBurnPerTurnSkill {
  type: 'burn_per_turn';
  totalDamage: number;
}
/**
 * multi_weapon_cast: 発動すると自身は攻撃判定にならず、追加で武器を選択数分選び、
 * 選んだ武器とこの武器を同時に発動できる（=-=Cataclysm Spear-Level1=-=など）。
 * 発動後manaRestoreだけMana回復し、cooldownTurnsターンは使用不可。
 */
export interface WeaponMultiCastSkill {
  type: 'multi_weapon_cast';
  selectCount: number;     // 追加で選択できる武器数
  manaRestore: number;     // 発動後に回復するMana量
  cooldownTurns: number;   // 発動後のクールダウンターン数
  guaranteedSkillProc?: boolean;  // trueの場合、リンクした武器のスキル発動を確定させる
  linkedDmgBonus?: number;        // リンクした武器の合計ダメージに対するボーナス(%)
}
/**
 * delayed_multihit: 使用後delayTurnsターン後に複数ヒットのダメージを与える（Emerald Crusadeなど）。
 * hitsの各エントリは {dmg, count, penetrate} で、penetrate=trueなら防御無視の固定ダメージ。
 */
export interface WeaponDelayedMultiHitSkill {
  type: 'delayed_multihit';
  delayTurns: number;
  hits: { dmg: number; count: number; penetrate: boolean }[];
  cooldownTurns: number;
}
/**
 * self_lock: 使用時から指定ターンの間、回復不可＋HPを指定%以下に固定する（Emerald Crusadeなど）。
 */
export interface WeaponSelfLockSkill {
  type: 'self_lock';
  noHealTurns: number;
  hpCapPct: number;
  capTurns: number;
}
/**
 * scaling_attack: 生存敵数に比例した物理ダメージ＋固定貫通ダメージ（Amethyst Storeakなど）。
 */
export interface WeaponScalingAttackSkill {
  type: 'scaling_attack';
  base: number;
  perEnemy: number;
  penetrate: number;
}
/**
 * random_stun: ランダムな敵1体を指定ターン攻撃不可にする（Amethyst Storeakなど）。
 */
export interface WeaponRandomStunSkill {
  type: 'random_stun';
  stunTurns: number;
}
/**
 * def_buff_self_dmg: 自身の防御力を指定ターンの間倍率上昇させ、その後指定ターンの間
 * 自分のHPに比例した割合自傷ダメージを与える（jewelry caneなど）。
 */
export interface WeaponDefBuffSelfDamageSkill {
  type: 'def_buff_self_dmg';
  defMultiplier: number;
  buffTurns: number;
  selfDmgPct: number;
  selfDmgTurns: number;
  cooldownTurns: number;
}
/**
 * delayed_self_heal: 使用時に最大HPの一定%自傷し、delayTurns後に最大HPの一定%回復する（Damage-to-healなど）。
 */
export interface WeaponDelayedSelfHealSkill {
  type: 'delayed_self_heal';
  selfDamagePct: number;
  healDelayTurns: number;
  healPct: number;
  cooldownTurns: number;
}
/**
 * mana_drain_repeat: 共有Manaを消費しながら固定ダメージを連続発動する（Gread Strropheaなど）。
 * manaBudget分（または共有Manaが尽きるまで）、perHitManaCostずつ消費しながらperHitDamageを与え続ける。
 */
export interface WeaponManaDrainRepeatSkill {
  type: 'mana_drain_repeat';
  manaBudget: number;
  perHitManaCost: number;
  perHitDamage: number;
  cooldownTurns: number;
}
/**
 * satiety_from_damage_pct: このターンに与えた合計ダメージ／敵合計最大HPの割合(%)+bonusFlatだけ
 * 満腹度を引き上げる（上限はmaxSatiety）（Gread Strropheaなど）。
 */
export interface WeaponSatietyFromDamageSkill {
  type: 'satiety_from_damage_pct';
  bonusFlat: number;
}
/**
 * mana_restore_on_use: 使用時に共有Manaを回復する。攻撃判定なし・クールダウンなし（Mana Rodなど）。
 */
export interface WeaponManaRestoreOnUseSkill {
  type: 'mana_restore_on_use';
  amount: number;
  cooldownTurns?: number;
}
/**
 * mark_on_hit: 攻撃時に敵へ「刻印」スタックを付与する（最大maxStacks）（深淵の断魔剣など）。
 */
export interface WeaponMarkOnHitSkill {
  type: 'mark_on_hit';
  maxStacks: number;
}
/**
 * mark_burst: intervalターンごとに、付与済みの「刻印」スタック数×penetratePerStackの貫通ダメージを全体に与える（深淵の断魔剣など）。
 */
export interface WeaponMarkBurstSkill {
  type: 'mark_burst';
  interval: number;
  penetratePerStack: number;
}
/**
 * conditional_atk_bonus: HPが条件（hp_above_pct/hp_below_pct）を満たす間、攻撃力にbonusを加算する（竜眼の魔剣など）。
 */
export interface WeaponConditionalAtkBonusSkill {
  type: 'conditional_atk_bonus';
  condition: 'hp_above_pct' | 'hp_below_pct';
  threshold: number;
  bonus: number;
}
/**
 * conditional_penetrate_on_hit: HPが条件（hp_above_pct/hp_below_pct）を満たす間、攻撃時に追加で貫通ダメージを与える（竜眼の魔剣など）。
 */
export interface WeaponConditionalPenetrateOnHitSkill {
  type: 'conditional_penetrate_on_hit';
  condition: 'hp_above_pct' | 'hp_below_pct';
  threshold: number;
  penetrate: number;
}
/**
 * charge_and_fire: 毎ターンchargePerTurnずつ蓄積（最大maxCharge）し、任意のタイミングで発動すると
 * 物理physPerCharge×スタック数＋貫通penetratePerCharge×スタック数のダメージを与え、スタックをリセットする。
 * 発動後、自身の最大HPのselfDmgPctOnFire%分の自傷ダメージを受ける（Emerald Crusadeなど）。
 */
export interface WeaponChargeAndFireSkill {
  type: 'charge_and_fire';
  chargePerTurn: number;
  maxCharge: number;
  physPerCharge: number;
  penetratePerCharge: number;
  selfDmgPctOnFire: number;
}
/**
 * periodic_barrier: intervalターンごとに結界を発動し、dmgReductPct%の被ダメージ軽減＋受けたダメージの
 * reflectPct%を反射する。発動中は攻撃力がatkPenaltyPct%減少する（jewelry caneなど）。
 */
export interface WeaponPeriodicBarrierSkill {
  type: 'periodic_barrier';
  interval: number;
  dmgReductPct: number;
  reflectPct: number;
  atkPenaltyPct: number;
}
export type WeaponSkill = WeaponPassiveSkill | WeaponRegenSkill | WeaponShieldSkill | WeaponManaSkill | WeaponOffhandManaOnHealSkill | WeaponManaPerTurnRandomSkill | WeaponGoliathSkill | WeaponSilversEyeSkill | WeaponFrostbiteSelfDamageSkill | WeaponPenetrateOnUseChanceSkill | WeaponBurnPerTurnSkill | WeaponMultiCastSkill | WeaponDelayedMultiHitSkill | WeaponSelfLockSkill | WeaponScalingAttackSkill | WeaponRandomStunSkill | WeaponDefBuffSelfDamageSkill | WeaponDelayedSelfHealSkill | WeaponManaDrainRepeatSkill | WeaponSatietyFromDamageSkill | WeaponManaRestoreOnUseSkill | WeaponMarkOnHitSkill | WeaponMarkBurstSkill | WeaponConditionalAtkBonusSkill | WeaponConditionalPenetrateOnHitSkill | WeaponChargeAndFireSkill | WeaponPeriodicBarrierSkill;

export interface WeaponUltimate {
  name: string;
  description: string;
  // 物理 × 回数 + 貫通 × 回数
  physDamage?: number;
  physHits?: number;
  penetrateDamage?: number;
  penetrateHits?: number;
  // 発動後バフ
  postBuffTurns?: number;
  postBuffPoisonDmg?: number;
}
export type TabId = 'gathering' | 'market' | 'dungeon' | 'gamble' | 'status' | 'online' | 'fishing' | 'admin' | 'crafting' | 'navi' | 'aquarium' | 'freefield' | 'vocation' | 'pets' | 'life' | 'equipmentBuild' | 'wiki';
export type GambleType = 'slot' | 'treasure_box' | 'coin_flip' | 'chohan' | 'chinchiro' | 'jackpot' | 'poker' | 'highlow' | 'mines' | 'dice_race' | 'roulette' | 'blackjack' | 'scratch' | 'race';
export type GambleGameCategory = 'instant' | 'choice' | 'step' | 'reveal' | 'card';
export type GambleRank = '見習い' | 'ギャンブラー' | '熟練ギャンブラー' | '賭博王' | 'レジェンド';

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'achievement';
  target: number;
  rewardWC: number;
  statKey: string; // key in MissionProgress
}

export interface MissionProgress {
  // counts reset daily/weekly
  dailySlotPlays: number;
  dailyChohanWins: number;
  dailyChinchiroWins: number;
  dailyCoinFlipWins: number;
  dailyHighlowWins: number;
  dailyPokerWins: number;
  dailyGamblePlays: number;
  dailyMinesWins: number;
  dailyDiceRaceWins: number;
  dailyRouletteWins: number;
  dailyBlackjackWins: number;
  dailyScratchWins: number;
  dailyRaceWins: number;
  weeklySlotPlays: number;
  weeklyChohanWins: number;
  weeklyChinchiroWins: number;
  weeklyPokerWins: number;
  weeklyGamblePlays: number;
  weeklyHighlowMaxStreak: number;
  weeklyMinesWins: number;
  weeklyDiceRaceWins: number;
  weeklyRouletteWins: number;
  weeklyBlackjackWins: number;
  weeklyScratchWins: number;
  weeklyRaceWins: number;
  // all-time stats
  totalSlotPlays: number;
  totalChohanPlays: number;
  totalChohanWins: number;
  totalChinchiroPlays: number;
  totalChinchiroWins: number;
  totalPokerPlays: number;
  totalPokerWins: number;
  totalCoinFlipPlays: number;
  totalCoinFlipWins: number;
  totalHighlowPlays: number;
  totalHighlowWins: number;
  totalHighlowMaxStreak: number;
  totalJackpotWins: number;
  totalMinesPlays: number;
  totalMinesWins: number;
  totalDiceRacePlays: number;
  totalDiceRaceWins: number;
  totalRoulettePlays: number;
  totalRouletteWins: number;
  totalBlackjackPlays: number;
  totalBlackjackWins: number;
  totalScratchPlays: number;
  totalScratchWins: number;
  totalRacePlays: number;
  totalRaceWins: number;
  totalWagered: number;
  totalWinAmount: number;
  totalLoseCount: number;
  totalWinCount: number;
  maxSingleWin: number;
  maxSingleBet: number;
  maxHighlowStreak: number;
  // timestamps for reset
  dailyResetAt: number;
  weeklyResetAt: number;
  // completed mission ids
  completedMissions: string[];
  // claimed mission reward ids (separate from completed)
  claimedMissions: string[];
}
export type DungeonTier = 'beginner' | 'intermediate' | 'advanced' | 'super' | 'extreme' | 'volcano' | 'cosmic' | 'infinite';

// ============================================================
// マスターデータ型
// ============================================================
export interface ItemMaster {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  itemType: ItemType;       // Weapon / Armor / Item / Heal
  rarity: Rarity;
  sellPrice: number;
  buyPrice: number;
  maxStack: number;
  icon: string;
  // 武器固有ステータス
  weaponAtk?: number;       // 武器固有攻撃力（通常攻撃をこの値で上書き）
  isAreaWeapon?: boolean;   // 範囲攻撃武器（全体攻撃）
  areaPenetrate?: number;   // 範囲攻撃の貫通ダメージ（防御無視）
  weaponDef?: number;       // 装備時防御ボーナス（防具）
  weaponHpBonus?: number;   // 装備時最大HP増加
  defenseMultiplier?: number; // 装備時、合計防御力に乗算される倍率（ホットバー所持で発動）
  armorToughness?: number;  // 防具強度（ダメージ軽減計算に使用）
  epf?: number;             // 装備時EPF（ダメージ軽減Ⅱ等によるダメージ軽減ポイント）
  armorAtkBonus?: number;   // 装備時攻撃力ボーナス（武器使用時に armorAtkBonus*0.5 の追加ダメージ）
  blastResist?: number;     // 爆破耐性（爆発スキルからのダメージを減らす%）
  moveSpeedPct?: number;    // 装備時移動速度変化（%、負の値で低下）
  // 武器スキル（複数可）
  weaponSkills?: WeaponSkill[];
  weaponUltimate?: WeaponUltimate;
  // SVGアイコン文字列（カスタム武器など）
  svgIcon?: string;
  // PNG base64アイコン（カスタム武器など）
  pngIcon?: string;
  // 使用しても消費されない（消耗品でない）
  nonconsumable?: boolean;
  // 使用後クールダウンターン数
  cooldownTurns?: number;
  // オフハンド専用武器
  isOffhand?: boolean;
  // 防具スロット制限 (helmet / chestplate / leggings / boots)
  armorSlot?: 'helmet' | 'chestplate' | 'leggings' | 'boots';
  useEffect?: {
    hpRestore?: number;
    satietyRestore?: number;
    message?: string;
    attackBonus?: number;   // 武器使用時の追加攻撃ダメージ（後方互換）
    attackType?: string;
    buffType?: string;
    buffDuration?: number;
    areaAttack?: boolean;   // 範囲攻撃フラグ（変幻始動す原初の剣斧など）
  };
}

export interface SkillMaster {
  id: SkillId;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
}

export interface DropEntry {
  itemId: string;
  baseRate: number;
  minAmount: number;
  maxAmount: number;
  skillRateBonus?: number;
}

// 採取ツールマスタ（採掘・伐採共通：100種）
export interface ToolMaster {
  id: string;
  name: string;
  category: 'mining' | 'woodcutting' | 'gathering' | 'herbalism' | 'insect';
  material: 'wood' | 'stone' | 'iron' | 'gold' | 'mythril';
  type: 'speed' | 'yield' | 'rare' | 'combo' | 'efficiency';
  speedMultiplier: number;
  yieldMultiplier: number;
  rareMultiplier: number;
  staminaMultiplier: number;
  comboBonus: number;
  specialEffectId: string | null;
  acquisitionTags?: string[];   // 入手経路タグ ('drop','craft','gacha','condition')
  dropSources?: string[];       // ドロップソースID一覧
}

export interface GatherNodeMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredSkill: { skillId: SkillId; minLevel: number };
  cooldownMs: number;
  drops: DropEntry[];
  staminaCost: number;
  isDanger?: boolean;       // 危険ノード
  dangerCategory?: 'danger_mining' | 'danger_wood' | 'danger_herb';
}

export interface DungeonArea {
  name: string;
  description?: string;
  monsters: { monsterId: string; count: number; isBoss?: boolean; isMidBoss?: boolean }[];
  isHardArea?: boolean;
  isCheckpoint?: boolean;   // CP表示用フラグ
  checkpointLabel?: string; // 'CP1'〜'CP5' など
  isBranchPoint?: boolean;  // ここでルート分岐UIを出す
  turns?: number;          // このエリアの想定戦闘ターン数（データ駆動のバランス調整・ルート設計用）
  eventRate?: number;      // このエリア進入時にランダムイベントが発生する確率(0〜1)。データ駆動のイベント密度調整用
}

// ============================================================
// ダンジョン分岐木（第1分岐3択 → 第2分岐3択 の9ルート構造）表示用メタデータ
// 実際の戦闘エリアは DungeonMaster.routes.branches[leafKey] に格納する。
// このメタデータは選択UIの表示・ルート差別化の説明にのみ使用し、戦闘ロジックには影響しない。
// ============================================================
export interface DungeonRouteLeafMeta {
  key: string;                       // routes.branches 内のキー
  label: string;                     // 選択ボタン等に表示する名称
  tagline: string;                   // 一行の特徴説明
  danger: 1 | 2 | 3 | 4 | 5;          // 危険度（★の数）
  estimatedTurns: number;            // 想定ターン数（表示用、areasのturns合計と一致させること）
  healSupply: 'low' | 'normal' | 'high'; // 回復・休憩機会の多さ
}

export interface DungeonRouteThemeMeta {
  themeKey: string;   // 第1分岐のキー（routes.lich/back/moon 等、または独自キー）
  label: string;       // '☀️ 太陽航路' 等
  icon: string;
  color: string;
  description: string;
  leaves: DungeonRouteLeafMeta[]; // 第2分岐の3ルート
}

export interface MonsterMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxHp: number;
  attack: number;
  defense: number;
  baseExp: number;
  baseGold: number;
  drops: DropEntry[];
  dungeonIds: string[];
  isBoss?: boolean;
  isMidBoss?: boolean;
  specialAttack?: string;
  defensePct?: number; // ダメージ軽減率 (0.0〜1.0)、貫通攻撃で無効化
  skills?: string[]; // 保有スキル名一覧（フレーバー表示・参照用。各スキルの詳細効果はdescription/specialAttackで補足）
  traits?: string[]; // 出現時無敵・属性無効・ブロック率など特殊耐性・特徴のフレーバー表示用
  effectiveAttack?: number; // 実戦闘で使用する実効攻撃力。attackが元データ準拠のフレーバー値（剛撃等のスキル依存で実態と一致しない）の場合に設定し、被ダメージ計算ではこちらを優先使用する
}

export interface DungeonMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: DungeonTier;
  requiredLevel: number;
  monsterIds: string[];
  floors: number;
  areas?: DungeonArea[];
  // ノードベース分岐ルート（火山 CP3分岐などで使用）
  routes?: {
    main: DungeonArea[];   // 共通→分岐点まで
    lich?: DungeonArea[];  // 分岐A（レガシー互換。新設計では branches を使用）
    back?: DungeonArea[];  // 分岐B（レガシー互換。新設計では branches を使用）
    moon?: DungeonArea[];  // 隠しルート（レガシー互換。新設計では branches を使用）
    // 第1分岐(3択)→第2分岐(3択)の9ルート木構造。キー例: 'lich_inferno','back_drift' など
    branches?: Record<string, DungeonArea[]>;
  };
  // 9ルート選択UI表示用メタデータ（第1分岐3テーマ×各テーマ内3サブルート）
  routeTree?: DungeonRouteThemeMeta[];
  bossId?: string;
  expBonus: number;
  goldBonus: number;
  unlockCondition?: { dungeonId: string; clearedCount: number; requiredLevel?: number };
}

export interface GambleReward {
  label: string;
  probability: number;
  multiplier: number;
  itemRewards?: { itemId: string; amount: number }[];
  symbols?: string[];
}

export interface GambleMaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: GambleType;
  minBet: number;
  maxBet: number;
  rewardTable: GambleReward[];
  returnRate: number;
}

// ============================================================
// クラフトレシピ型
// ============================================================
export interface CraftRecipe {
  id: string;
  name: string;
  description: string;
  outputItemId: string;
  outputAmount: number;
  inputs: { itemId: string; amount: number }[];
  /** 3×3グリッドのレシピ配置。長さ9の配列（インデックス0=左上, 8=右下）。
   *  空文字列はどのアイテムも不要なセル。
   *  省略した場合は従来通り位置不問マッチング。 */
  shape?: (string | '')[];
  requiredCraftingLevel: number;
  craftingExpGain: number;
}

// ============================================================
// プレイヤーデータ型
// ============================================================
export interface PlayerStats {
  level: number;
  exp: number;
  expToNextLevel: number;
  hp: number;
  maxHp: number;
  baseMaxHp?: number;   // ホットバーボーナス適用前の素のmaxHp
  satiety: number;
  maxSatiety: number;
  attack: number;
  defense: number;
  baseAttack?: number;  // 装備ビルド/職業/ペットボーナス適用前の素の攻撃力
  baseDefense?: number; // 同上・防御力
}

// ホットバー（9スロット）+ 防具枠 + オフハンド
export interface EquipmentSlots {
  hotbar: (string | null)[];   // length 9, itemId or null
  helmet: string | null;
  chestplate: string | null;
  leggings: string | null;
  boots: string | null;
  offhand: string | null;
}

export function defaultEquipmentSlots(): EquipmentSlots {
  return { hotbar: Array(9).fill(null), helmet: null, chestplate: null, leggings: null, boots: null, offhand: null };
}

// 魚図鑑エントリ
export interface FishBookEntry {
  fishId: string;
  firstCaughtAt: number;
  totalCaught: number;
  maxSizeCm: number;
  maxWeightKg: number;
}

export interface PlayerData {
  uid: string;
  displayName: string;
  gold: number;
  stats: PlayerStats;
  inventory: IdMap<number>;
  skillLevels: IdMap<number>;
  skillExp: IdMap<number>;
  lastSavedAt: number;
  createdAt: number;
  dungeonClearedCount: IdMap<number>;
  fishingScore: number;
  equippedRodId: string;
  // 採取ツール装備（採掘・伐採・新カテゴリ）
  equippedTools?: {
    miningToolId: string;
    woodcuttingToolId: string;
    gatheringToolId?: string;
    herbalismToolId?: string;
    insectToolId?: string;
  };
  // 採取コンボ（カテゴリ別）
  gatherCombo?: { category: string; count: number; lastAt: number };
  // 採取図鑑
  gatherCollection?: { discoveredItems: string[]; itemCounts: Record<string, number> };
  // 採取ツール所持・解放
  ownedToolIds?: string[];
  unlockedToolIds?: string[]; // 条件解放済みグループID ('unlock_basic','unlock_combo',...)
  // オフライン採掘（採掘委任）：ログアウト中に進む採取の代行
  offlineMining?: {
    enabled: boolean;
    category: GatherCategory;
    startedAt: number;
    lastSettledAt: number;
  };
  toolAcquisitionStats?: {
    totalGatherCount: number;
    maxCombo: number;
    nightGatherCount: number;
    rainGatherCount: number;
    dangerSuccessCount: number;
  };
  // 釣りシステム v2
  fishingLevel?: number;
  fishingExp?: number;
  fishingTotalCount?: number;
  fishingMaxSizeCm?: number;
  fishingMaxWeightKg?: number;
  fishBook?: Record<string, FishBookEntry>; // key: fishId
  fishingEquippedBaitId?: string;
  fishingSelectedSpotId?: string;
  fishingUnlockedSpots?: string[];
  fishingRodEnhance?: Record<string, number>; // rodId -> enhance level (+0~+20)
  fishingRodDurability?: Record<string, number>; // rodId -> current durability
  fishingTotalBaitUsed?: number;
  fishingTotalGoldEarned?: number;
  fishingAchievements?: string[]; // achieved FA ids
  fishingUnlockedTitles?: string[]; // unlocked title ids
  fishCoin?: number; // 釣り専用通貨
  fishMoney?: number; // 釣りで得る専用マネー（2FishMoney→1G）
  fishingLegendaryCount?: number; // 伝説魚累計捕獲数
  fishingTotalWeightKg?: number; // 総重量(累計)
  activeJob: string | null;
  activeBuffs: { id: string; name: string; expiry: number; fishingBonus?: number; miningBonus?: number }[];
  reliefUsedCount: number;
  reliefLastUsed: number;
  // ホットバー・装備枠
  equipment?: EquipmentSlots;
  // HP/満腹度の自動回復用タイムスタンプ
  lastRegenAt?: number;
  // メール通知設定
  emailAddress?: string;
  emailNotifications?: { auction?: boolean; events?: boolean; updates?: boolean };
  // アクティビティログ
  activityLog?: ActivityEntry[];
  // 設定
  settings?: { gambleMultiplierBonus?: number };
  // 満腹度上限アップグレード購入回数
  satietyUpgradeCount?: number;
  hpUpgradeCount?: number;
  // ガチャコイン
  gachaCoins?: number;
  // ウェルスコイン（ギャンブル専用通貨）
  wealthCoin?: number;
  // 生涯統計
  lifetimeStats?: {
    totalDamageDealt: number;
    totalGoldEarned: number;
    maxCombo: number;
    monstersDefeated: number;
  };
  // 解放済み実績ID
  unlockedAchievements?: string[];
  // ギャンブル累計賭け額（ランク判定用）
  totalWagered?: number;
  // ギャンブルWC獲得集計（ランキング用）
  weeklyGambleWon?: number;
  monthlyGambleWon?: number;
  totalGambleWon?: number;
  weeklyGambleWonResetAt?: number;
  monthlyGambleWonResetAt?: number;
  // ミッション進捗
  missionProgress?: MissionProgress;
  // 送金統計
  totalGoldSent?: number;
  totalGoldReceived?: number;
  // NPC依頼
  npcQuestAcceptances?: QuestAcceptance[];
  totalQuestCompleted?: number;
  totalQuestRewardGold?: number;
  // 株式保有
  stockHoldings?: Record<string, StockHolding>; // key: StockId
  totalStockProfit?: number;
  stockSplitLedger?: Record<string, number>; // key: StockId, 最後に反映した株式分割時刻
  // ナビ報酬受取済み
  naviClaimed?: Record<string, boolean>;
  // ギルド
  guildId?: string | null;
  guildName?: string | null;
  // プロフィール
  profile?: {
    icon: string;          // 絵文字アイコン
    comment: string;       // 一言コメント
    titleId: string;       // 称号ID
    favDungeonId: string;  // 好きなダンジョン
  };
  // ── フリーフィールド ──
  dragonSoul?: number;                             // ドラゴンソウル蓄積量
  dragonSoulTotal?: number;                        // 累計獲得量
  feverActive?: boolean;                           // フィーバー発動中か
  feverActivatedAt?: number;                       // フィーバー開始時刻(ms)
  ffVisitedNodes?: string[];                       // 初回到達済みノードID
  ffHarvestCount?: number;                         // FF採集累計回数
  ffHarvestLog?: { itemId: string; displayName: string; amount: number; at: number }[]; // 採集履歴(最新50件)
  ffNodeInteractions?: Record<string, { lastUsedAt: number; useCount: number; completed: boolean }>; // ノードインタラクション状態
  ffBattleWins?: number;                           // FFフィールド戦闘勝利数
  // ── ver3.0.0: 装備ビルド／職業／ペット／生活系 ──
  equipmentBuild?: EquipmentBuildState;             // 装備の付与効果ロール・覚醒段階・ビルドプリセット
  vocation?: VocationState;                        // 職業（ヴォケーション）の選択・経験値・ランク
  pets?: PetState;                                 // ペット所持・編成・図鑑
  life?: LifeSystemState;                          // 農業・料理・錬金・精錬・標本収集
}

export interface ActivityEntry {
  type: 'dungeon_clear' | 'level_up' | 'crafting' | 'gamble_win' | 'online';
  message: string;
  timestamp: number;
}

// ============================================================
// ゲーム内イベント型
// ============================================================
export interface GatherResult {
  drops: { itemId: string; amount: number }[];
  expGained: IdMap<number>;
  staminaUsed: number;
}

export interface CombatTurn {
  playerDamage: number;
  monsterDamage: number;
  playerHpAfter: number;
  monsterHpAfter: number;
  log: string;
  isSpecialAttack?: boolean;
}

export interface CombatResult {
  victory: boolean;
  turns: CombatTurn[];
  expGained: number;
  goldGained: number;
  drops: { itemId: string; amount: number }[];
  escaped?: boolean;
}

export interface DungeonRunState {
  dungeonId: string;
  currentFloor: number;
  currentAreaName: string;
  currentAreaIdx?: number;
  monstersDefeated: number;
  totalExp: number;
  totalGold: number;
  totalDrops: { itemId: string; amount: number }[];
  isComplete: boolean;
  isFailed: boolean;
  bossLoopMode?: boolean; // ボス周回モード（倒し続ける）
  kxBossMode?: boolean;   // KX裏ボス戦モード
  kxPhase?: number;       // KX形態（1-4）
  kxHp?: number;          // KX現在HP
  kxIsAwakened?: boolean; // KX覚醒状態
  kxAwakened?: boolean;   // 覚醒KXを討伐してクリア（生命の超越）
  // 火山CP3分岐管理（アストラル・ノクスでは9ルート木のリーフキーも格納する）
  volcanoRoute?: string; // main=共通ルート, lich/back/moon=旧分岐 or 新リーフキー（例: 'lich_inferno'）
}

export interface GambleResult {
  rewardLabel: string;
  multiplier: number;
  goldDelta: number;
  itemRewards: { itemId: string; amount: number }[];
  symbols?: string[];
  hand?: string[];
  handName?: string;
  dice?: number[];
  roleName?: string;
}

// ============================================================
// マーケット型
// ============================================================
export interface AuctionListing {
  id: string;
  sellerUid: string;
  sellerName: string;
  itemId: string;
  amount: number;
  pricePerUnit: number;
  expiresAt: number;
  createdAt: number;
}

export interface BoardReply {
  uid: string;
  displayName: string;
  level: number;
  text: string;
  createdAt: number;
}

export interface BoardPoll {
  question: string;
  options: string[];
  votes: Record<string, number>; // optionIndex -> uid[]  stored as uid:optionIndex in Firestore
}

export interface BoardMessage {
  id: string;
  uid: string;
  displayName: string;
  level: number;
  text: string;
  createdAt: number;
  reactions?: Record<string, string[]>; // emoji -> uid[]
  replies?: BoardReply[];
  poll?: BoardPoll;
}

// ============================================================
// オンライン型
// ============================================================
export interface OnlineUser {
  uid: string;
  displayName: string;
  level: number;
  lastSeen: number;
  currentActivity?: string;
  lastDungeonCleared?: string;
}

// ============================================================
// PvPギャンブル対戦型
// ============================================================
export interface ChohanBattleData {
  type: 'chohan';
  hostDice: [number, number];
  guestDice: [number, number];
}
export interface ChinchiroBattleData {
  type: 'chinchiro';
  hostDice: number[];
  guestDice: number[];
  hostRole: string;
  guestRole: string;
}
export interface CoinFlipBattleData {
  type: 'coin_flip';
  flips: ('heads' | 'tails')[];
}
export interface SlotBattleData {
  type: 'slot_machine';
  hostReels: string[];
  guestReels: string[];
}
export type GambleBattleData = ChohanBattleData | ChinchiroBattleData | CoinFlipBattleData | SlotBattleData;

export interface GambleBattle {
  id: string;
  hostUid: string;
  hostName: string;
  hostLevel: number;
  gambleType: string;
  betAmount: number;
  status: 'waiting' | 'active' | 'finished';
  guestUid?: string;
  guestName?: string;
  winnerId?: string;
  battleData?: GambleBattleData;
  createdAt: number;
  expiresAt: number;
  spectatorCount?: number;
}

export interface BattleHistoryEntry {
  id?: string;
  battleId: string;
  hostUid: string;
  hostName: string;
  guestUid: string;
  guestName: string;
  gambleType: string;
  betAmount: number;
  winnerId: string;
  battleData: GambleBattleData;
  createdAt: number;
}

// ============================================================
// テキサスホールデム マルチプレイヤー型
// ============================================================
export interface PokerCard {
  rank: string;
  suit: 'S' | 'H' | 'D' | 'C';
}

export interface PokerPlayer {
  uid: string;
  displayName: string;
  level: number;
  chips: number;       // テーブルでの所持チップ
  bet: number;         // 現在ラウンドのベット額
  hand: PokerCard[];   // 手札（本人のみ参照）
  folded: boolean;
  allIn: boolean;
  isReady: boolean;
}

export type PokerPhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'finished';

export interface PokerTable {
  id: string;
  hostUid: string;
  hostName: string;
  hostLevel: number;
  maxPlayers: number;          // 3〜6
  buyIn: number;               // 参加費（掛け金）
  status: 'waiting' | 'playing' | 'finished';
  phase: PokerPhase;
  players: PokerPlayer[];
  communityCards: PokerCard[];
  pot: number;
  currentTurnUid: string;
  smallBlindUid: string;
  bigBlindUid: string;
  dealerUid: string;
  currentBet: number;          // 現ラウンドの最高ベット額
  winners?: { uid: string; displayName: string; amount: number; handName: string }[];
  deck: PokerCard[];           // サーバー側で管理するデッキ（クライアントには見せない）
  createdAt: number;
  expiresAt: number;
  lastActionAt: number;
}

// ============================================================
// NPC依頼システム型
// ============================================================
export type QuestRank = 'C' | 'B' | 'A' | 'S' | 'SS';

export type QuestType = 'delivery' | 'bulk' | 'urgent' | 'select' | 'chain';

export interface NpcQuest {
  id: string;
  npcName: string;
  npcIcon: string;
  rank: QuestRank;
  title: string;
  description: string;
  requiredItemId: string;
  requiredAmount: number;
  rewardGold: number;
  expiresAt: number;   // タイムスタンプ（定期更新）
  createdAt: number;
  // 拡張フィールド
  questType?: QuestType;
  alternateItemIds?: string[];   // select型：代替可能なアイテムID（報酬-20%）
  urgentDeadlineMs?: number;     // urgent型：短縮期限（ms）
  marketMultiplier?: number;     // 市場連動補正（0.7〜1.5）
  difficultyMultiplier?: number; // 難易度係数
  npcType?: 'villager' | 'blacksmith' | 'merchant' | 'noble' | 'alchemist' | 'adventurer' | 'fisherman';
}

export interface QuestAcceptance {
  questId: string;
  acceptedAt: number;
  completedAt?: number;
  rewardGold: number;
}

// ============================================================
// 株式市場型
// ============================================================
export type StockSector = 'tech' | 'industry' | 'finance' | 'consumer' | 'entertainment' | 'energy';

export type StockId =
  | 'wealth_mining'
  | 'wealth_fishery'
  | 'wealth_casino'
  | 'wealth_tech'
  | 'wealth_energy'
  | 'wealth_logistics'
  | 'wealth_foods'
  | 'wealth_finance'
  | 'wealth_robotics'
  | 'wealth_software'
  | 'wealth_chemical'
  | 'wealth_steel'
  | 'wealth_realestate'
  | 'wealth_insurance'
  | 'wealth_retail'
  | 'wealth_apparel'
  | 'wealth_media'
  | 'wealth_gaming'
  | 'wealth_airlines'
  | 'wealth_solar'
  | 'wealth_oil'
  | 'wealth_pharma'
  | 'wealth_telecom'
  | 'wealth_ai'
  | 'wealth_chip'
  | 'wealth_cloud'
  | 'wealth_cyber'
  | 'wealth_bio'
  | 'wealth_quantum'
  | 'wealth_drone'
  | 'wealth_semicon'
  | 'wealth_construction'
  | 'wealth_machinery'
  | 'wealth_ports'
  | 'wealth_tools'
  | 'wealth_aerospace'
  | 'wealth_materials'
  | 'wealth_metals'
  | 'wealth_trucking'
  | 'wealth_bank'
  | 'wealth_payments'
  | 'wealth_asset'
  | 'wealth_brokerage'
  | 'wealth_insurtech'
  | 'wealth_reit'
  | 'wealth_leasing'
  | 'wealth_vc'
  | 'wealth_beverage'
  | 'wealth_snack'
  | 'wealth_cosmetic'
  | 'wealth_appliance'
  | 'wealth_homegoods'
  | 'wealth_toys'
  | 'wealth_books'
  | 'wealth_drugstore'
  | 'wealth_stream'
  | 'wealth_music'
  | 'wealth_esports'
  | 'wealth_themepark'
  | 'wealth_film'
  | 'wealth_live'
  | 'wealth_tickets'
  | 'wealth_idol'
  | 'wealth_gas'
  | 'wealth_grid'
  | 'wealth_battery'
  | 'wealth_wind'
  | 'wealth_hydrogen'
  | 'wealth_nuclear'
  | 'wealth_storage'
  | 'wealth_geo'

export interface StockMaster {
  id: StockId;
  name: string;
  icon: string;
  basePrice: number;
  sector: StockSector;
  sharesOutstanding: number;
  splitThreshold: number;
}

export interface StockPricePoint {
  timestamp: number;
  price: number;
  news?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface StockTrendData {
  trend: number;        // -0.05 ~ 0.05
  volatility: number;  // 0.01 ~ 0.1
  stability: number;   // 0 ~ 1
  consecutiveTicks: number;
  haltedAt?: number;   // ストップ高/安で取引停止した timestamp (ms), ない場合はundefined
}

export interface StockHolding {
  stockId: StockId;
  amount: number;
  avgBuyPrice: number;   // 平均購入価格
  purchasedAt: number;   // 最後の購入時刻（24h売却禁止用）
}

// ============================================================
// UI 型
// ============================================================
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

// ============================================================
// バージョン更新情報型
// ============================================================
export interface VersionPatch {
  version: string;
  date: string;
  changes: string[];
}

// ============================================================
// ギルド型
// ============================================================
export interface GuildData {
  id: string;
  name: string;
  description: string;
  leaderUid: string;
  leaderName: string;
  memberUids: string[];
  memberCount: number;
  level: number;               // ギルドレベル (1〜10)
  totalDonated: number;        // 累計寄付額 (ギルドEXP)
  bankGold: number;            // ギルド銀行残高
  warehouseItems: IdMap<number>; // ギルド倉庫
  warehouseCapacity: number;   // 倉庫スロット数
  maxMembers: number;          // 人数上限
  totalAssets: number;         // 総資産（ランキング用）
  totalKills: number;          // 総討伐数（ランキング用）
  totalLevels: number;         // 総レベル（ランキング用）
  createdAt: number;
  updatedAt: number;
}

export interface GuildMember {
  uid: string;
  displayName: string;
  level: number;
  role: 'leader' | 'member';
  joinedAt: number;
  totalDonated: number;
}

export interface GuildChatMessage {
  id: string;
  uid: string;
  displayName: string;
  level: number;
  text: string;
  createdAt: number;
}

// ============================================================
// フレンド型
// ============================================================
export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromLevel: number;
  toUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface FriendEntry {
  uid: string;
  displayName: string;
  level: number;
  favorite: boolean;
  addedAt: number;
}

export interface DirectMessage {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  text: string;
  gift?: { itemId: string; amount: number };
  goldAmount?: number;
  read: boolean;
  createdAt: number;
}

export interface StockSplitEvent {
  stockId: StockId;
  ratio: number;
  timestamp: number;
  beforePrice: number;
  afterPrice: number;
}


export interface StockMarketStats {
  prevClose: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  dayVolume: number;
  yearHigh: number;
  yearLow: number;
}
export interface StockMarketSnapshot {
  prices: Record<StockId, number>;
  history: Record<StockId, StockPricePoint[]>;
  trends: Record<StockId, StockTrendData>;
  stats: Record<StockId, StockMarketStats>;
  splitEvents: StockSplitEvent[];
}
