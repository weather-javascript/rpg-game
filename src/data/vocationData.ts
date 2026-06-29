// src/data/vocationData.ts
// ver3.0.0: ランク／職業分岐システムのマスターデータ。
// 既存の /jobs コマンド系（mining_income等の経済職業）とは別概念として
// 「ヴォケーション(職業)」を新設し、プレイスタイル全体に影響するパッシブを与える。

import type { ItemMaster } from '../types/game';
import type { VocationDef, VocationId } from '../types/v3Types';

export const VOCATION_MASTER: Record<VocationId, VocationDef> = {
  warrior: {
    id: 'warrior', name: '戦士', icon: '⚔️', color: '#e05050',
    description: '戦闘特化。攻防の両面に優れ、最初から選べる基本職。',
    ranks: [
      { rank: 1, name: '見習い戦士', requiredVocationLevel: 1,  passiveEffects: { atkPct: 0.03, defPct: 0.03 } },
      { rank: 2, name: '戦士',       requiredVocationLevel: 15, passiveEffects: { atkPct: 0.05, defPct: 0.05 } },
      { rank: 3, name: '剛の戦士',   requiredVocationLevel: 40, passiveEffects: { atkPct: 0.08, defPct: 0.07, fleeRateBonus: 0.04 } },
      { rank: 4, name: '剣聖',       requiredVocationLevel: 80, passiveEffects: { atkPct: 0.12, defPct: 0.10, preemptiveChance: 0.05 } },
    ],
    signatureSkillName: '武の心得', signatureSkillDescription: '常時、攻撃力と防御力が上昇する。',
    signatureSkillEffects: { atkPct: 0.02, defPct: 0.02 },
  },
  miner: {
    id: 'miner', name: '採掘師', icon: '⛏️', color: '#a08050',
    description: '採取特化。資源集めの効率を高める生活系職業。',
    ranks: [
      { rank: 1, name: '見習い採掘師', requiredVocationLevel: 1,  passiveEffects: { gatherSuccessPct: 0.04, gatherYieldPct: 0.04 } },
      { rank: 2, name: '採掘師',       requiredVocationLevel: 15, passiveEffects: { gatherSuccessPct: 0.07, gatherYieldPct: 0.07 } },
      { rank: 3, name: '熟練採掘師',   requiredVocationLevel: 40, passiveEffects: { gatherSuccessPct: 0.10, gatherYieldPct: 0.12, skillExpMult: 1.1 } },
      { rank: 4, name: '採掘王',       requiredVocationLevel: 80, passiveEffects: { gatherSuccessPct: 0.15, gatherYieldPct: 0.18, skillExpMult: 1.2 } },
    ],
    signatureSkillName: '資源の眼', signatureSkillDescription: '常時、採取量が上昇する。',
    signatureSkillEffects: { gatherYieldPct: 0.03 },
  },
  angler: {
    id: 'angler', name: '釣師', icon: '🎣', color: '#4a90c0',
    description: '釣り特化。レア魚との遭遇率と釣果を高める。',
    ranks: [
      { rank: 1, name: '見習い釣師', requiredVocationLevel: 1,  passiveEffects: { fishSuccessMult: 1.05, fishRarePct: 0.02 } },
      { rank: 2, name: '釣師',       requiredVocationLevel: 15, passiveEffects: { fishSuccessMult: 1.08, fishRarePct: 0.04 } },
      { rank: 3, name: '熟練釣師',   requiredVocationLevel: 40, passiveEffects: { fishSuccessMult: 1.12, fishRarePct: 0.06, skillExpMult: 1.1 } },
      { rank: 4, name: '釣聖',       requiredVocationLevel: 80, passiveEffects: { fishSuccessMult: 1.18, fishRarePct: 0.09, skillExpMult: 1.2 } },
    ],
    signatureSkillName: '潮目の勘', signatureSkillDescription: '常時、レア魚との遭遇率が上昇する。',
    signatureSkillEffects: { fishRarePct: 0.015 },
  },
  merchant: {
    id: 'merchant', name: '商人', icon: '💰', color: '#d0b030',
    description: '経済特化。市場取引・ドロップ品の収益性を高める。',
    ranks: [
      { rank: 1, name: '見習い商人', requiredVocationLevel: 1,  passiveEffects: { sellPriceMult: 1.04, goldDropPct: 0.03 } },
      { rank: 2, name: '商人',       requiredVocationLevel: 15, passiveEffects: { sellPriceMult: 1.07, goldDropPct: 0.05 } },
      { rank: 3, name: '豪商',       requiredVocationLevel: 40, passiveEffects: { sellPriceMult: 1.11, goldDropPct: 0.08 } },
      { rank: 4, name: '大商人',     requiredVocationLevel: 80, passiveEffects: { sellPriceMult: 1.16, goldDropPct: 0.12 } },
    ],
    signatureSkillName: '目利き', signatureSkillDescription: '常時、店売り価格が上昇する。',
    signatureSkillEffects: { sellPriceMult: 1.02 },
  },
  alchemist: {
    id: 'alchemist', name: '錬金術師', icon: '⚗️', color: '#7050c0',
    description: '生活系の上級職。回復・生活スキル全般を強化する。',
    unlockCondition: { playerLevel: 15 },
    ranks: [
      { rank: 1, name: '見習い錬金術師', requiredVocationLevel: 1,  passiveEffects: { healPct: 0.06, skillExpMult: 1.05 } },
      { rank: 2, name: '錬金術師',       requiredVocationLevel: 15, passiveEffects: { healPct: 0.10, skillExpMult: 1.10 } },
      { rank: 3, name: '上級錬金術師',   requiredVocationLevel: 40, passiveEffects: { healPct: 0.15, skillExpMult: 1.15, mpCostCutPct: 0.05 } },
      { rank: 4, name: '賢者',           requiredVocationLevel: 80, passiveEffects: { healPct: 0.22, skillExpMult: 1.22, mpCostCutPct: 0.10 } },
    ],
    signatureSkillName: '触媒の知識', signatureSkillDescription: '常時、消費MPが軽減される。',
    signatureSkillEffects: { mpCostCutPct: 0.02 },
  },
  gambler: {
    id: 'gambler', name: '賭博師', icon: '🎰', color: '#c04090',
    description: 'ギャンブル特化。一発逆転を狙う異色の上級職。',
    unlockCondition: { playerLevel: 20 },
    ranks: [
      { rank: 1, name: '見習い賭博師', requiredVocationLevel: 1,  passiveEffects: { gambleMult: 1.04 } },
      { rank: 2, name: '賭博師',       requiredVocationLevel: 15, passiveEffects: { gambleMult: 1.08 } },
      { rank: 3, name: '常勝賭博師',   requiredVocationLevel: 40, passiveEffects: { gambleMult: 1.13 } },
      { rank: 4, name: '幸運の支配者', requiredVocationLevel: 80, passiveEffects: { gambleMult: 1.20 } },
    ],
    signatureSkillName: '幸運の女神', signatureSkillDescription: '常時、ギャンブルの配当倍率が上昇する。',
    signatureSkillEffects: { gambleMult: 1.02 },
  },
  researcher: {
    id: 'researcher', name: '研究者', icon: '🔬', color: '#40b0a0',
    description: '経験値・育成全般に強い知識特化の上級職。',
    unlockCondition: { playerLevel: 25 },
    ranks: [
      { rank: 1, name: '見習い研究者', requiredVocationLevel: 1,  passiveEffects: { expMult: 1.05, skillExpMult: 1.05 } },
      { rank: 2, name: '研究者',       requiredVocationLevel: 15, passiveEffects: { expMult: 1.09, skillExpMult: 1.09 } },
      { rank: 3, name: '主任研究者',   requiredVocationLevel: 40, passiveEffects: { expMult: 1.14, skillExpMult: 1.14 } },
      { rank: 4, name: '賢人',         requiredVocationLevel: 80, passiveEffects: { expMult: 1.20, skillExpMult: 1.20 } },
    ],
    signatureSkillName: '探求心', signatureSkillDescription: '常時、すべての経験値獲得量が上昇する。',
    signatureSkillEffects: { expMult: 1.02, skillExpMult: 1.02 },
  },
  collector: {
    id: 'collector', name: '収集家', icon: '📚', color: '#b08040',
    description: 'ドロップ・図鑑特化。レアアイテムの入手を後押しする。',
    unlockCondition: { playerLevel: 30 },
    ranks: [
      { rank: 1, name: '見習い収集家', requiredVocationLevel: 1,  passiveEffects: { dropRatePct: 0.04 } },
      { rank: 2, name: '収集家',       requiredVocationLevel: 15, passiveEffects: { dropRatePct: 0.07 } },
      { rank: 3, name: '熟練収集家',   requiredVocationLevel: 40, passiveEffects: { dropRatePct: 0.11 } },
      { rank: 4, name: '万物の蒐集者', requiredVocationLevel: 80, passiveEffects: { dropRatePct: 0.16 } },
    ],
    signatureSkillName: '蒐集の目', signatureSkillDescription: '常時、アイテムドロップ率が上昇する。',
    signatureSkillEffects: { dropRatePct: 0.02 },
  },
  hunter: {
    id: 'hunter', name: '狩人', icon: '🏹', color: '#50a060',
    description: '逃走・先制特化。立ち回りの巧さで戦うトリッキーな上級職。',
    unlockCondition: { playerLevel: 35 },
    ranks: [
      { rank: 1, name: '見習い狩人', requiredVocationLevel: 1,  passiveEffects: { fleeRateBonus: 0.05, preemptiveChance: 0.04 } },
      { rank: 2, name: '狩人',       requiredVocationLevel: 15, passiveEffects: { fleeRateBonus: 0.08, preemptiveChance: 0.07 } },
      { rank: 3, name: '熟練狩人',   requiredVocationLevel: 40, passiveEffects: { fleeRateBonus: 0.12, preemptiveChance: 0.10, atkPct: 0.03 } },
      { rank: 4, name: '影狩り',     requiredVocationLevel: 80, passiveEffects: { fleeRateBonus: 0.18, preemptiveChance: 0.15, atkPct: 0.05 } },
    ],
    signatureSkillName: '気配断ち', signatureSkillDescription: '常時、先制と逃走の成功率が上昇する。',
    signatureSkillEffects: { fleeRateBonus: 0.02, preemptiveChance: 0.02 },
  },
};

export const VOCATION_ORDER: VocationId[] = ['warrior', 'miner', 'angler', 'merchant', 'alchemist', 'gambler', 'researcher', 'collector', 'hunter'];

export const VOCATION_ITEMS: Record<string, ItemMaster> = {
  vocation_change_ticket: {
    id: 'vocation_change_ticket', name: '転職証', description: '職業をクールタイム無しで即時切り替える券。所持していなくても切り替えは可能（その場合は短いクールタイムが発生）。',
    category: 'material', itemType: 'Item', rarity: 'rare', sellPrice: 200, buyPrice: 0, maxStack: 99, icon: 'scroll',
  },
};

export const VOCATION_SWITCH_COOLDOWN_MS = 10 * 60 * 1000; // 転職証なし切替時のクールタイム
