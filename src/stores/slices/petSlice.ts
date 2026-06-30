// src/stores/slices/petSlice.ts
// ver3.0.0: ペット（仲間）の所持・育成・編成の操作アクション。

import type { StateCreator } from 'zustand';
import type { GameState } from '../gameStore';
import { defaultPetState, PET_EXP_TABLE, type OwnedPetInstance, type PetRoleSlot } from '../../types/buildTypes';
type Pet = OwnedPetInstance;
import { PET_SPECIES_MASTER, PET_BOND_PER_TREAT, PET_BOND_MAX, PET_EXCHANGE_TABLE } from '../../data/petsData';

export interface PetSlice {
  acquirePet: (speciesId: string) => boolean;
  feedPet: (instanceId: string) => boolean;
  evolvePet: (instanceId: string) => { success: boolean; message: string };
  awakenPet: (instanceId: string) => { success: boolean; message: string };
  setPartySlot: (slot: PetRoleSlot, instanceId: string | null) => void;
  exchangePet: (speciesId: string) => { success: boolean; message: string };
  renamePet: (instanceId: string, nickname: string) => void;
}

function petLevelFromExp(exp: number): number {
  let lv = 1;
  while (lv < PET_EXP_TABLE.length - 1 && exp >= PET_EXP_TABLE[lv + 1]) lv++;
  return lv;
}

export const createPetSlice: StateCreator<GameState, [], [], PetSlice> = (set, get) => ({
  acquirePet: (speciesId) => {
    const species = PET_SPECIES_MASTER[speciesId];
    if (!species) return false;
    const newPet: OwnedPetInstance = {
      instanceId: `pet_${speciesId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      speciesId, level: 1, exp: 0, bond: 0, evolutionStage: 0, awakening: 0, obtainedAt: Date.now(),
    };
    set((state) => {
      if (!state.player) return state;
      const p = state.player.pets ?? defaultPetState();
      const seenSpeciesIds = p.seenSpeciesIds.includes(speciesId) ? p.seenSpeciesIds : [...p.seenSpeciesIds, speciesId];
      return { player: { ...state.player, pets: { ...p, owned: [...p.owned, newPet], seenSpeciesIds } } };
    });
    get().addNotification('success', `🐾 「${species.name}」が仲間になりました！`);
    return true;
  },

  feedPet: (instanceId) => {
    const { player, consumeItem, addNotification } = get();
    if (!player) return false;
    if (!consumeItem('pet_bond_treat', 1)) {
      addNotification('warning', '絆のエサが足りません。');
      return false;
    }
    set((state) => {
      if (!state.player) return state;
      const p = state.player.pets ?? defaultPetState();
      const owned = p.owned.map((pet: Pet) => pet.instanceId === instanceId
        ? { ...pet, bond: Math.min(PET_BOND_MAX, pet.bond + PET_BOND_PER_TREAT), exp: pet.exp + 20, level: petLevelFromExp(pet.exp + 20) }
        : pet);
      return { player: { ...state.player, pets: { ...p, owned } } };
    });
    return true;
  },

  evolvePet: (instanceId) => {
    const { player, consumeItem } = get();
    if (!player) return { success: false, message: '読み込みエラー' };
    const p = player.pets ?? defaultPetState();
    const pet = p.owned.find((x: Pet) => x.instanceId === instanceId);
    if (!pet) return { success: false, message: 'ペットが見つかりません' };
    const species = PET_SPECIES_MASTER[pet.speciesId];
    if (!species) return { success: false, message: '不明な種族です' };
    const nextStage = species.evolution[pet.evolutionStage + 1];
    if (!nextStage) return { success: false, message: 'すでに最終進化です' };
    if (pet.level < nextStage.requiredLevel || pet.bond < nextStage.requiredBond) {
      return { success: false, message: `進化にはLv${nextStage.requiredLevel}・絆${nextStage.requiredBond}が必要です` };
    }
    if (!consumeItem('pet_evolution_crystal', 1)) {
      return { success: false, message: '進化結晶が足りません' };
    }
    set((state) => {
      if (!state.player) return state;
      const ps = state.player.pets ?? defaultPetState();
      const owned = ps.owned.map((x: Pet) => x.instanceId === instanceId ? { ...x, evolutionStage: pet.evolutionStage + 1 } : x);
      return { player: { ...state.player, pets: { ...ps, owned } } };
    });
    get().addNotification('success', `✨ ${species.name}が「${nextStage.name}」に進化しました！`);
    return { success: true, message: `${nextStage.name}に進化しました` };
  },

  awakenPet: (instanceId) => {
    const { player, consumeItem } = get();
    if (!player) return { success: false, message: '読み込みエラー' };
    const p = player.pets ?? defaultPetState();
    const pet = p.owned.find((x: Pet) => x.instanceId === instanceId);
    if (!pet) return { success: false, message: 'ペットが見つかりません' };
    const species = PET_SPECIES_MASTER[pet.speciesId];
    if (!species) return { success: false, message: '不明な種族です' };
    if (pet.awakening >= species.awakeningMax) return { success: false, message: 'すでに覚醒上限です' };
    const needAmount = pet.awakening + 1;
    if ((player.inventory['pet_awaken_feather'] ?? 0) < needAmount) {
      return { success: false, message: `覚醒の羽根が${needAmount}個必要です` };
    }
    consumeItem('pet_awaken_feather', needAmount);
    set((state) => {
      if (!state.player) return state;
      const ps = state.player.pets ?? defaultPetState();
      const owned = ps.owned.map((x: Pet) => x.instanceId === instanceId ? { ...x, awakening: x.awakening + 1 } : x);
      return { player: { ...state.player, pets: { ...ps, owned } } };
    });
    get().addNotification('success', `🌟 ${species.name}が覚醒+${pet.awakening + 1}になりました！`);
    return { success: true, message: `覚醒+${pet.awakening + 1}に成功しました` };
  },

  setPartySlot: (slot, instanceId) => {
    set((state) => {
      if (!state.player) return state;
      const p = state.player.pets ?? defaultPetState();
      // 同じペットを複数枠に重複編成できないようにする
      const party = { ...p.party, [slot]: instanceId };
      for (const key of ['main', 'sub', 'support'] as PetRoleSlot[]) {
        if (key !== slot && party[key] === instanceId && instanceId !== null) party[key] = null;
      }
      return { player: { ...state.player, pets: { ...p, party } } };
    });
  },

  exchangePet: (speciesId) => {
    const { player, consumeItem } = get();
    if (!player) return { success: false, message: '読み込みエラー' };
    const entry = PET_EXCHANGE_TABLE.find(e => e.speciesId === speciesId);
    if (!entry) return { success: false, message: '交換対象ではありません' };
    for (const c of entry.cost) {
      if ((player.inventory[c.itemId] ?? 0) < c.amount) return { success: false, message: '素材が足りません' };
    }
    for (const c of entry.cost) consumeItem(c.itemId, c.amount);
    get().acquirePet(speciesId);
    return { success: true, message: '交換しました' };
  },

  renamePet: (instanceId, nickname) => {
    set((state) => {
      if (!state.player) return state;
      const p = state.player.pets ?? defaultPetState();
      const owned = p.owned.map((x: Pet) => x.instanceId === instanceId ? { ...x, nickname } : x);
      return { player: { ...state.player, pets: { ...p, owned } } };
    });
  },
});
