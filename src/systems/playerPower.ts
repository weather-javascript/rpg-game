// src/systems/playerPower.ts
// ver3.0.0: 装備ビルド（特性/付与効果/セット/覚醒）・職業（ヴォケーション）・ペットの
// 効果を一つの PowerModifiers に集約する中央アグリゲーター。
// 既存の戦闘/採取/釣り/市場/ギャンブル処理へは、この関数の戻り値を1〜数行追加するだけで
// 連携できるように設計している（既存ロジック自体は書き換えない）。

import type { PlayerData } from '../types/game';
import { ITEM_MASTER } from '../data/masters';
import {
  type PowerModifiers, emptyPowerModifiers, addPowerModifiers,
  defaultEquipmentBuildState, defaultVocationState, defaultPetState,
} from '../types/buildTypes';
import { getItemTrait, AFFIX_MASTER, buildAutoSets } from '../data/equipmentBuildData';
import { VOCATION_MASTER } from '../data/vocationData';
import { PET_SPECIES_MASTER, PET_SKILL_MASTER } from '../data/petsData';
import type { AffixId, VocationId } from '../types/buildTypes';

const MULT_KEYS = new Set<keyof PowerModifiers>(['fishSuccessMult', 'sellPriceMult', 'expMult', 'skillExpMult', 'gambleMult']);

let _autoSetsCache: ReturnType<typeof buildAutoSets> | null = null;
function getAutoSets() {
  if (!_autoSetsCache) _autoSetsCache = buildAutoSets(ITEM_MASTER);
  return _autoSetsCache;
}

function getEquippedItemIds(player: PlayerData): string[] {
  const eq = player.equipment;
  if (!eq) return [];
  const ids = [...eq.hotbar, eq.helmet, eq.chestplate, eq.leggings, eq.boots, eq.offhand]
    .filter((x): x is string => !!x);
  return Array.from(new Set(ids));
}

/** 装備の特性・付与効果・覚醒・セット効果を集約する */
function collectEquipmentModifiers(player: PlayerData): PowerModifiers {
  let acc = emptyPowerModifiers();
  const build = player.equipmentBuild ?? defaultEquipmentBuildState();
  const equippedIds = getEquippedItemIds(player);
  if (equippedIds.length === 0) return acc;

  // 1) 特性 + 覚醒による特性強化
  for (const itemId of equippedIds) {
    const trait = getItemTrait(itemId);
    const awakening = build.awakening[itemId] ?? 0;
    acc = addPowerModifiers(acc, trait.effects);
    for (let i = 0; i < awakening; i++) acc = addPowerModifiers(acc, trait.effectsPerAwaken);
  }

  // 2) 付与効果（ロール済みのもののみ）
  for (const itemId of equippedIds) {
    const rolls = build.affixRolls[itemId];
    if (!rolls) continue;
    for (const roll of rolls) {
      const def = AFFIX_MASTER[roll.affixId as AffixId];
      if (!def) continue;
      const key = def.modifierKey;
      const partial: Partial<PowerModifiers> = MULT_KEYS.has(key)
        ? { [key]: 1 + roll.value } as Partial<PowerModifiers>
        : { [key]: roll.value } as Partial<PowerModifiers>;
      acc = addPowerModifiers(acc, partial);
    }
  }

  // 3) セット効果（自動グルーピング。装備中の数に応じて段階的に加算）
  const autoSets = getAutoSets();
  const equippedSet = new Set(equippedIds);
  for (const setDef of Object.values(autoSets)) {
    const equippedCount = setDef.itemIds.filter(id => equippedSet.has(id)).length;
    if (equippedCount < 2) continue;
    for (const th of setDef.thresholds) {
      if (equippedCount >= th.count) acc = addPowerModifiers(acc, th.effects);
    }
  }

  return acc;
}

/** 職業（ヴォケーション）のパッシブ＋専用スキル効果を集約する */
function collectVocationModifiers(player: PlayerData): PowerModifiers {
  let acc = emptyPowerModifiers();
  const voc = player.vocation ?? defaultVocationState();
  if (!voc.activeVocationId) return acc;
  const def = VOCATION_MASTER[voc.activeVocationId as VocationId];
  if (!def) return acc;
  acc = addPowerModifiers(acc, def.signatureSkillEffects);
  const rank = voc.vocationRank[voc.activeVocationId] ?? 1;
  for (const r of def.ranks) {
    if (r.rank <= rank) acc = addPowerModifiers(acc, r.passiveEffects);
  }
  return acc;
}

/** 編成中ペット（メイン/サブ/支援）の補助効果を集約する */
function collectPetModifiers(player: PlayerData): PowerModifiers {
  let acc = emptyPowerModifiers();
  const pets = player.pets ?? defaultPetState();
  const slots = [pets.party.main, pets.party.sub, pets.party.support].filter((x): x is string => !!x);
  const fishBookCount = Object.keys(player.fishBook ?? {}).length;

  for (const instanceId of slots) {
    const owned = pets.owned.find((p: typeof pets.owned[number]) => p.instanceId === instanceId);
    if (!owned) continue;
    const species = PET_SPECIES_MASTER[owned.speciesId];
    if (!species) continue;
    for (const skillId of species.passiveSkillIds) {
      const skill = PET_SKILL_MASTER[skillId];
      if (skill) acc = addPowerModifiers(acc, skill.effects);
    }
    if (species.aquariumLinkBonus && fishBookCount >= species.aquariumLinkBonus.requiredFishBookCount) {
      acc = addPowerModifiers(acc, species.aquariumLinkBonus.effects);
    }
  }
  return acc;
}

/** 生活系（料理バフ等）の一時効果を集約する */
function collectLifeBuffModifiers(player: PlayerData): PowerModifiers {
  let acc = emptyPowerModifiers();
  const life = player.life;
  if (!life?.activeDishBuffs) return acc;
  const now = Date.now();
  for (const buff of life.activeDishBuffs) {
    if (buff.expiry > now) acc = addPowerModifiers(acc, buff.effects);
  }
  return acc;
}

/**
 * すべてのビルド要素（装備/職業/ペット/生活バフ）を合算した最終 PowerModifiers を返す。
 * 戦闘・採取・釣り・市場・ギャンブルの各処理から、このまま参照する。
 */
export function getPlayerPowerProfile(player: PlayerData): PowerModifiers {
  let acc = emptyPowerModifiers();
  acc = addPowerModifiers(acc, collectEquipmentModifiers(player));
  acc = addPowerModifiers(acc, collectVocationModifiers(player));
  acc = addPowerModifiers(acc, collectPetModifiers(player));
  acc = addPowerModifiers(acc, collectLifeBuffModifiers(player));
  return acc;
}

/** ensureDefaults 等で attack/defense/maxHp の再計算に使う、装備由来のフラット加算値のみを返す */
export function getFlatStatBonuses(player: PlayerData): { atkFlat: number; defFlat: number; hpFlat: number; atkPct: number; defPct: number } {
  const p = getPlayerPowerProfile(player);
  return { atkFlat: p.atkFlat, defFlat: p.defFlat, hpFlat: p.hpFlat, atkPct: p.atkPct, defPct: p.defPct };
}
