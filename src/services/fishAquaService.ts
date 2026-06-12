// src/services/fishAquaService.ts
import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs,
  orderBy, query, limit, where, increment,
  arrayUnion, arrayRemove, runTransaction, deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { FishIndividual, FarmData, BreedingData, AquariumData, WorldFirstFishRecord, BreedingBook, ShowData, ShowEntry, AquaComment } from '../types/fishAqua';

// ─── 個体IDカウンター ─────────────────────────────────────
export async function nextIndividualId(): Promise<string> {
  const ref = doc(db, 'meta', 'fish_individual_counter');
  try {
    return await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      const cur = snap.exists() ? (snap.data().count as number) : 0;
      const next = cur + 1;
      tx.set(ref, { count: next }, { merge: true });
      return `#${String(next).padStart(6, '0')}`;
    });
  } catch { return `#${Date.now()}`; }
}

// ─── 養殖場 ───────────────────────────────────────────────
export async function getFarmData(uid: string): Promise<FarmData | null> {
  const snap = await getDoc(doc(db, 'fish_farms', uid));
  return snap.exists() ? (snap.data() as FarmData) : null;
}

export async function saveFarmData(farm: FarmData): Promise<void> {
  await setDoc(doc(db, 'fish_farms', farm.uid), { ...farm, lastUpdatedAt: Date.now() });
}

export async function initFarmData(uid: string): Promise<FarmData> {
  const farm: FarmData = {
    uid, isUnlocked: true, unlockedAt: Date.now(),
    slotCount: 2, pond: [null, null], lastUpdatedAt: Date.now(),
  };
  await setDoc(doc(db, 'fish_farms', uid), farm);
  return farm;
}

// ─── 交配 ─────────────────────────────────────────────────
export async function getBreedingData(uid: string): Promise<BreedingData | null> {
  const snap = await getDoc(doc(db, 'fish_breeding', uid));
  return snap.exists() ? (snap.data() as BreedingData) : null;
}

export async function saveBreedingData(data: BreedingData): Promise<void> {
  await setDoc(doc(db, 'fish_breeding', data.uid), data);
}

// ─── 交配図鑑 ─────────────────────────────────────────────
export async function getBreedingBook(uid: string): Promise<BreedingBook> {
  const snap = await getDoc(doc(db, 'fish_breed_book', uid));
  if (snap.exists()) return snap.data() as BreedingBook;
  const init: BreedingBook = { uid, discovered: [], lastUpdatedAt: Date.now() };
  await setDoc(doc(db, 'fish_breed_book', uid), init);
  return init;
}

export async function discoverRecipe(uid: string, recipeId: string): Promise<void> {
  await updateDoc(doc(db, 'fish_breed_book', uid), {
    discovered: arrayUnion(recipeId), lastUpdatedAt: Date.now(),
  });
}

// ─── 魚個体 ───────────────────────────────────────────────
export async function saveFishIndividual(fish: FishIndividual): Promise<void> {
  await setDoc(doc(db, 'fish_individuals', fish.individualId), fish);
}

export async function getPlayerFishIndividuals(uid: string): Promise<FishIndividual[]> {
  const snap = await getDocs(query(collection(db, 'fish_individuals'), where('ownerUid', '==', uid)));
  return snap.docs.map(d => d.data() as FishIndividual);
}

export async function deleteFishIndividual(id: string): Promise<void> {
  await deleteDoc(doc(db, 'fish_individuals', id));
}

// ─── 水族館 ───────────────────────────────────────────────
export async function getAquarium(uid: string): Promise<AquariumData | null> {
  const snap = await getDoc(doc(db, 'aquariums', uid));
  return snap.exists() ? (snap.data() as AquariumData) : null;
}

export async function saveAquarium(aq: AquariumData): Promise<void> {
  await setDoc(doc(db, 'aquariums', aq.uid), { ...aq, updatedAt: Date.now() });
}

export async function initAquarium(uid: string, displayName: string): Promise<AquariumData> {
  const aq: AquariumData = {
    uid, displayName, displayedFish: [], maxDisplay: 10,
    likes: 0, likedBy: [], favorites: [], visitors: 0,
    comments: [], isPublic: true, updatedAt: Date.now(),
  };
  await setDoc(doc(db, 'aquariums', uid), aq);
  return aq;
}

export async function likeAquarium(targetUid: string, myUid: string, isLiking: boolean): Promise<void> {
  const ref = doc(db, 'aquariums', targetUid);
  if (isLiking) {
    await updateDoc(ref, { likes: increment(1), likedBy: arrayUnion(myUid) });
  } else {
    await updateDoc(ref, { likes: increment(-1), likedBy: arrayRemove(myUid) });
  }
}

export async function visitAquarium(targetUid: string): Promise<AquariumData | null> {
  const ref = doc(db, 'aquariums', targetUid);
  await updateDoc(ref, { visitors: increment(1) }).catch(() => {});
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() as AquariumData : null;
}

export async function addAquariumComment(targetUid: string, comment: AquaComment): Promise<void> {
  const ref = doc(db, 'aquariums', targetUid);
  await updateDoc(ref, { comments: arrayUnion(comment) });
}

// ─── ランキング ────────────────────────────────────────────
export async function getAquariumRanking(field: 'likes' | 'visitors', lim = 10): Promise<{ uid: string; displayName: string; val: number }[]> {
  try {
    const snap = await getDocs(query(collection(db, 'aquariums'), orderBy(field, 'desc'), limit(lim)));
    return snap.docs.map(d => ({ uid: d.id, displayName: (d.data() as AquariumData).displayName, val: d.data()[field] as number ?? 0 }));
  } catch { return []; }
}

export async function getMythicFishRanking(lim = 10): Promise<{ uid: string; name: string; count: number }[]> {
  try {
    const snap = await getDocs(query(collection(db, 'fish_individuals'), where('rarity', '==', 'mythic'), orderBy('bornAt', 'asc'), limit(lim * 5)));
    const countMap: Record<string, { name: string; count: number }> = {};
    for (const d of snap.docs) {
      const f = d.data() as FishIndividual;
      if (!countMap[f.ownerUid]) countMap[f.ownerUid] = { name: f.ownerName, count: 0 };
      countMap[f.ownerUid].count++;
    }
    return Object.entries(countMap).map(([uid, v]) => ({ uid, name: v.name, count: v.count }))
      .sort((a, b) => b.count - a.count).slice(0, lim);
  } catch { return []; }
}

// ─── 世界初発見 ────────────────────────────────────────────
export async function checkAndRecordWorldFirstBreed(
  fishId: string, uid: string, displayName: string,
  sizeCm: number, weightKg: number, individualId: string, fishName: string, isMutant = false,
): Promise<boolean> {
  const ref = doc(db, 'world_first_fish', `breed_${fishId}`);
  try {
    return await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (snap.exists()) return false;
      const record: WorldFirstFishRecord = {
        fishId: `breed_${fishId}`, fishName, discovererUid: uid, discovererName: displayName,
        discoveredAt: Date.now(), sizeCm, weightKg, individualId, isBreedResult: true, isMutant,
      };
      tx.set(ref, record);
      return true;
    });
  } catch { return false; }
}

export async function getAllWorldFirstBreed(): Promise<WorldFirstFishRecord[]> {
  try {
    const snap = await getDocs(query(collection(db, 'world_first_fish'), orderBy('discoveredAt', 'asc')));
    return snap.docs.map(d => d.data() as WorldFirstFishRecord);
  } catch { return []; }
}

// ─── 品評会 ───────────────────────────────────────────────
function getCurrentShowId(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const week = Math.floor((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 3600 * 1000));
  return `show_${year}_${week}`;
}

export async function getOrCreateCurrentShow(): Promise<ShowData> {
  const id = getCurrentShowId();
  const ref = doc(db, 'fish_shows', id);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as ShowData;
  const now = new Date();
  const weekStart = new Date(now); weekStart.setUTCHours(0,0,0,0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 3600 * 1000);
  const show: ShowData = {
    id, weekStart: weekStart.getTime(), weekEnd: weekEnd.getTime(),
    entries: { size: [], weight: [], rarity: [], breed: [], mutant: [] },
    settled: false,
  };
  await setDoc(ref, show);
  return show;
}

export async function submitToShow(entry: ShowEntry): Promise<void> {
  const id = getCurrentShowId();
  const ref = doc(db, 'fish_shows', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const show = snap.data() as ShowData;
  const cat = entry.category;
  const existing = show.entries[cat].filter(e => e.uid !== entry.uid);
  existing.push(entry);
  existing.sort((a, b) => b.score - a.score);
  const top = existing.slice(0, 20);
  await updateDoc(ref, { [`entries.${cat}`]: top });
}
