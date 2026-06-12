// src/components/screens/AquariumScreen.tsx
import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  getFarmData, saveFarmData, initFarmData, getBreedingData, saveBreedingData,
  getBreedingBook, discoverRecipe, getPlayerFishIndividuals, saveFishIndividual,
  getAquarium, saveAquarium, initAquarium, likeAquarium,
  visitAquarium, addAquariumComment, getAquariumRanking, getMythicFishRanking,
  checkAndRecordWorldFirstBreed, getAllWorldFirstBreed, getOrCreateCurrentShow,
  submitToShow, nextIndividualId,
} from '../../services/fishAquaService';
import {
  BREED_RECIPES, BREED_RECIPE_MAP, TOTAL_RECIPES,
} from '../../data/fishAquaData';
import type {
  FishIndividual, FarmData, BreedingData, AquariumData, BreedingBook,
  WorldFirstFishRecord, ShowData, ShowEntry, GrowthStage, AquaRarity,
} from '../../types/fishAqua';
import {
  POND_EXPAND_COSTS, AQUA_EXPAND_COSTS, AQUA_EXPAND_AMOUNTS,
  FARM_UNLOCK_GOLD, FARM_UNLOCK_FISHING_LEVEL,
  GROWTH_STAGE_LABEL, GROWTH_TIME_NORMAL, AQUA_RARITY_LABEL, AQUA_RARITY_COLOR,
  MUTANT_LIST, SUPER_MUTANT_LIST,
} from '../../types/fishAqua';
import { FISH_MASTER } from '../../data/fishMasters';
import { postBoardMessage } from '../../services/multiplayer';

type Tab = 'farm' | 'breed' | 'book' | 'aquarium' | 'rank' | 'show' | 'world';

const S = {
  wrap: { padding: '8px', fontFamily: 'sans-serif', color: '#e8eaf6', maxWidth: 800, margin: '0 auto' },
  tabs: { display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' as const },
  tab: (a: boolean) => ({
    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: a ? '#f0c060' : '#1e2638', color: a ? '#1a1f2e' : '#8a92b2',
    fontWeight: a ? 700 : 400, fontSize: 13,
  }),
  card: {
    background: '#1e2638', borderRadius: 12, padding: 14, marginBottom: 10,
    border: '1px solid #2d3752',
  },
  btn: (color = '#f0c060', disabled = false) => ({
    padding: '7px 14px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#2d3752' : color, color: disabled ? '#555' : '#1a1f2e',
    fontWeight: 600, fontSize: 13, opacity: disabled ? 0.6 : 1,
  }),
  badge: (rarity: AquaRarity) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11,
    background: AQUA_RARITY_COLOR[rarity] + '33', color: AQUA_RARITY_COLOR[rarity],
    border: `1px solid ${AQUA_RARITY_COLOR[rarity]}`, fontWeight: 700,
  }),
  label: { fontSize: 11, color: '#8a92b2', marginBottom: 2 },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const },
  col: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  divider: { borderTop: '1px solid #2d3752', margin: '10px 0' },
  input: {
    background: '#131929', border: '1px solid #2d3752', borderRadius: 8,
    color: '#e8eaf6', padding: '6px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box' as const,
  },
  progressBar: (_pct: number) => ({
    height: 6, borderRadius: 3, background: '#2d3752', position: 'relative' as const, overflow: 'hidden',
  }),
};

// ─── 遺伝計算 ────────────────────────────────────────────
function calcChildStats(p1: FishIndividual, p2: FishIndividual): { sizeCm: number; weightKg: number; rarity: AquaRarity } {
  const minSize = Math.min(p1.sizeCm, p2.sizeCm) * 0.8;
  const maxSize = Math.max(p1.sizeCm, p2.sizeCm) * 1.2;
  const sizeCm = Math.round(minSize + Math.random() * (maxSize - minSize));
  const minW = Math.min(p1.weightKg, p2.weightKg) * 0.75;
  const maxW = Math.max(p1.weightKg, p2.weightKg) * 1.3;
  const weightKg = Math.round((minW + Math.random() * (maxW - minW)) * 100) / 100;
  const rarityLevels: AquaRarity[] = ['normal', 'rare', 'epic', 'legendary', 'mythic'];
  const r1 = rarityLevels.indexOf(p1.rarity);
  const r2 = rarityLevels.indexOf(p2.rarity);
  const base = Math.max(r1, r2);
  let rarity: AquaRarity = rarityLevels[base];
  // 確率でレア度上昇
  if (Math.random() < 0.08 && base < 4) rarity = rarityLevels[base + 1];
  return { sizeCm, weightKg, rarity };
}

function rollMutation(): 'none' | 'mutant' | 'super' {
  const r = Math.random();
  if (r < 0.0001) return 'super';
  if (r < 0.001) return 'mutant';
  return 'none';
}

function growthProgress(fish: FishIndividual): number {
  if (fish.growthStage === 'giant') return 100;
  const stages: GrowthStage[] = ['fry', 'juvenile', 'adult', 'large', 'giant'];
  const idx = stages.indexOf(fish.growthStage);
  const nextStage = stages[idx] as GrowthStage;
  const needed = GROWTH_TIME_NORMAL[nextStage];
  if (!needed) return 100;
  const elapsed = Date.now() - fish.lastGrowthAt;
  return Math.min(100, Math.floor((elapsed / needed) * 100));
}

function nextGrowthStage(s: GrowthStage): GrowthStage {
  const m: Record<GrowthStage, GrowthStage> = { fry: 'juvenile', juvenile: 'adult', adult: 'large', large: 'giant', giant: 'giant' };
  return m[s];
}

function canGrow(fish: FishIndividual): boolean {
  if (fish.growthStage === 'giant') return false;
  const needed = GROWTH_TIME_NORMAL[fish.growthStage];
  return Date.now() - fish.lastGrowthAt >= needed;
}

function rarityScore(r: AquaRarity): number {
  return { normal: 1, rare: 3, epic: 10, legendary: 30, mythic: 100 }[r];
}

// ─── 金額フォーマット ─────────────────────────────────────
function fmt(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}億G`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万G`;
  return `${n.toLocaleString()}G`;
}

// ─── メインコンポーネント ─────────────────────────────────
export function AquariumScreen() {
  const player = useGameStore(s => s.player);
  const changeGold = useGameStore(s => s.changeGold);
  const addNotification = useGameStore(s => s.addNotification);
  const uid = player?.uid ?? '';
  const displayName = player?.displayName ?? '???';
  const fishingLevel = player?.fishingLevel ?? 0;

  const [tab, setTab] = useState<Tab>('farm');
  const [farm, setFarm] = useState<FarmData | null>(null);
  const [breeding, setBreeding] = useState<BreedingData | null>(null);
  const [breedBook, setBreedBook] = useState<BreedingBook | null>(null);
  const [myFish, setMyFish] = useState<FishIndividual[]>([]);
  const [aquarium, setAquarium] = useState<AquariumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [worldFirsts, setWorldFirsts] = useState<WorldFirstFishRecord[]>([]);
  const [showData, setShowData] = useState<ShowData | null>(null);
  const [aqRank, setAqRank] = useState<{ uid: string; displayName: string; val: number }[]>([]);
  const [mythicRank, setMythicRank] = useState<{ uid: string; name: string; count: number }[]>([]);
  const [visitUid, setVisitUid] = useState('');
  const [visitedAq, setVisitedAq] = useState<AquariumData | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoading(true);
      const [f, b, book, fish, aq] = await Promise.all([
        getFarmData(uid),
        getBreedingData(uid),
        getBreedingBook(uid),
        getPlayerFishIndividuals(uid),
        getAquarium(uid),
      ]);
      setFarm(f);
      setBreeding(b ?? { uid, slots: [], completedChildren: [] });
      setBreedBook(book);
      setMyFish(fish);
      setAquarium(aq);
      setLoading(false);
    })();
  }, [uid]);

  useEffect(() => {
    if (tab === 'world') getAllWorldFirstBreed().then(setWorldFirsts);
    if (tab === 'rank') {
      getAquariumRanking('likes').then(setAqRank);
      getMythicFishRanking().then(setMythicRank);
    }
    if (tab === 'show') getOrCreateCurrentShow().then(setShowData);
  }, [tab]);

  // ─── 養殖場解放 ───────────────────────────────────────
  const unlockFarm = useCallback(async () => {
    if (!player) return;
    const canByLevel = fishingLevel >= FARM_UNLOCK_FISHING_LEVEL;
    const canByGold = (player.gold ?? 0) >= FARM_UNLOCK_GOLD;
    if (!canByLevel && !canByGold) {
      addNotification('error', `釣りLv${FARM_UNLOCK_FISHING_LEVEL}以上、または${fmt(FARM_UNLOCK_GOLD)}が必要です`);
      return;
    }
    if (!canByLevel) {
      changeGold(-FARM_UNLOCK_GOLD);
    }
    const f = await initFarmData(uid);
    setFarm(f);
    addNotification('success', '🐟 魚養殖場を解放しました！');
  }, [player, fishingLevel, uid, changeGold, addNotification]);

  // ─── 池拡張 ───────────────────────────────────────────
  const expandPond = useCallback(async () => {
    if (!farm || !player) return;
    const idx = farm.slotCount - 2;
    if (idx >= POND_EXPAND_COSTS.length) {
      addNotification('info', '最大枠数に達しています');
      return;
    }
    const cost = POND_EXPAND_COSTS[idx];
    if ((player.gold ?? 0) < cost) {
      addNotification('error', `${fmt(cost)}が必要です`);
      return;
    }
    changeGold(-cost);
    const newFarm = { ...farm, slotCount: farm.slotCount + 1, pond: [...farm.pond, null] };
    await saveFarmData(newFarm);
    setFarm(newFarm);
    addNotification('success', `養殖池を拡張しました！(${newFarm.slotCount}枠)`);
  }, [farm, player, changeGold, addNotification]);

  // ─── 魚を池に入れる ───────────────────────────────────
  const [selectingSlot, setSelectingSlot] = useState<number | null>(null);
  const [fishPickerOpen, setFishPickerOpen] = useState(false);

  const placeFish = useCallback(async (slotIdx: number, fish: FishIndividual) => {
    if (!farm) return;
    if (fish.isDisplayed) { addNotification('error', '水族館展示中の魚は入れられません'); return; }
    const newPond = [...farm.pond];
    newPond[slotIdx] = { ...fish, pondSlot: slotIdx };
    const updFish = { ...fish, pondSlot: slotIdx };
    const newFarm = { ...farm, pond: newPond };
    await saveFarmData(newFarm);
    await saveFishIndividual(updFish);
    setFarm(newFarm);
    setMyFish(prev => prev.map(f => f.individualId === fish.individualId ? updFish : f));
    setFishPickerOpen(false);
    setSelectingSlot(null);
    addNotification('success', `${fish.name}を養殖池(${slotIdx + 1}番)に入れました`);
  }, [farm, addNotification]);

  const removeFishFromPond = useCallback(async (slotIdx: number) => {
    if (!farm) return;
    const fish = farm.pond[slotIdx];
    if (!fish) return;
    const newPond = [...farm.pond];
    newPond[slotIdx] = null;
    const updFish = { ...fish, pondSlot: undefined };
    const newFarm = { ...farm, pond: newPond };
    await saveFarmData(newFarm);
    await saveFishIndividual(updFish);
    setFarm(newFarm);
    setMyFish(prev => prev.map(f => f.individualId === fish.individualId ? updFish : f));
    addNotification('info', `${fish.name}を池から取り出しました`);
  }, [farm, addNotification]);

  // ─── 成長処理 ─────────────────────────────────────────
  const growFish = useCallback(async (fish: FishIndividual) => {
    if (!canGrow(fish)) return;
    const newStage = nextGrowthStage(fish.growthStage);
    const updFish = { ...fish, growthStage: newStage, lastGrowthAt: Date.now() };
    await saveFishIndividual(updFish);
    setMyFish(prev => prev.map(f => f.individualId === fish.individualId ? updFish : f));
    if (farm) {
      const newPond = farm.pond.map(p => p?.individualId === fish.individualId ? updFish : p);
      const newFarm = { ...farm, pond: newPond };
      await saveFarmData(newFarm);
      setFarm(newFarm);
    }
    addNotification('success', `🐟 ${fish.name}が${GROWTH_STAGE_LABEL[newStage]}に成長しました！`);
  }, [farm, addNotification]);

  // ─── 交配 ─────────────────────────────────────────────
  const [breedP1, setBreedP1] = useState<FishIndividual | null>(null);
  const [breedP2, setBreedP2] = useState<FishIndividual | null>(null);
  const [breedResult, setBreedResult] = useState<FishIndividual | null>(null);

  const findMatchingRecipe = useCallback((p1: FishIndividual, p2: FishIndividual) => {
    return BREED_RECIPES.find(r =>
      (r.parent1FishId === p1.fishId && r.parent2FishId === p2.fishId) ||
      (r.parent1FishId === p2.fishId && r.parent2FishId === p1.fishId)
    ) ?? null;
  }, []);

  const startBreeding = useCallback(async () => {
    if (!breedP1 || !breedP2 || !breeding) return;
    if (breeding.slots.length >= 3) { addNotification('error', '交配スロットが満杯です(最大3)'); return; }
    const recipe = findMatchingRecipe(breedP1, breedP2);
    const breedMs = recipe ? recipe.breedTimeMs : 4 * 60 * 60 * 1000;
    const slot = {
      parent1Id: breedP1.individualId, parent2Id: breedP2.individualId,
      startedAt: Date.now(), completesAt: Date.now() + breedMs,
      recipeId: recipe?.id ?? 'generic',
    };
    const updBreeding = { ...breeding, slots: [...breeding.slots, slot] };
    await saveBreedingData(updBreeding);
    setBreeding(updBreeding);
    setBreedP1(null); setBreedP2(null);
    addNotification('success', `交配開始！${recipe ? recipe.childName : '子供'}が誕生するまでお待ちください`);
  }, [breedP1, breedP2, breeding, findMatchingRecipe, addNotification]);

  const collectBreedResult = useCallback(async (slotIdx: number) => {
    if (!breeding) return;
    const slot = breeding.slots[slotIdx];
    if (Date.now() < slot.completesAt) { addNotification('error', 'まだ交配中です'); return; }

    const p1 = myFish.find(f => f.individualId === slot.parent1Id) ?? breeding.completedChildren.find(f => f.individualId === slot.parent1Id);
    const p2 = myFish.find(f => f.individualId === slot.parent2Id) ?? breeding.completedChildren.find(f => f.individualId === slot.parent2Id);

    const recipe = slot.recipeId !== 'generic' ? BREED_RECIPE_MAP[slot.recipeId] : null;
    const stats = p1 && p2 ? calcChildStats(p1, p2) : { sizeCm: 20, weightKg: 0.5, rarity: 'normal' as AquaRarity };

    const mutResult = rollMutation();
    let mutant: typeof MUTANT_LIST[0] | null = null;
    if (mutResult === 'super') {
      mutant = SUPER_MUTANT_LIST[Math.floor(Math.random() * SUPER_MUTANT_LIST.length)];
    } else if (mutResult === 'mutant') {
      mutant = MUTANT_LIST[Math.floor(Math.random() * MUTANT_LIST.length)];
    }

    const indId = await nextIndividualId();
    const childFishId = recipe ? recipe.childFishId : (p1?.fishId ?? 'koi');
    const baseFish = FISH_MASTER[childFishId] ?? FISH_MASTER['koi'];
    const child: FishIndividual = {
      individualId: indId,
      fishId: childFishId,
      name: mutant ? mutant.name : (recipe?.childName ?? baseFish.name),
      ownerUid: uid, ownerName: displayName,
      rarity: mutant?.rarityOverride ?? (recipe ? recipe.childRarity : stats.rarity),
      growthStage: 'fry',
      sizeCm: stats.sizeCm,
      weightKg: stats.weightKg,
      bornAt: Date.now(),
      lastGrowthAt: Date.now(),
      isMutant: mutResult !== 'none',
      isSuperMutant: mutResult === 'super',
      mutantName: mutant?.name,
      mutantIcon: mutant?.icon,
      parentIds: [slot.parent1Id, slot.parent2Id],
      breedRecipeId: slot.recipeId,
      icon: mutant?.icon ?? (recipe?.childIcon ?? baseFish.icon),
      generation: Math.max(p1?.generation ?? 1, p2?.generation ?? 1) + 1,
    };

    await saveFishIndividual(child);
    setMyFish(prev => [...prev, child]);

    // 図鑑に登録
    if (recipe && breedBook && !breedBook.discovered.includes(recipe.id)) {
      await discoverRecipe(uid, recipe.id);
      setBreedBook(prev => prev ? { ...prev, discovered: [...prev.discovered, recipe.id] } : prev);
      addNotification('info', `📖 交配図鑑に新種登録：${recipe.childName}`);
    }

    // 世界初発見チェック
    const isWorldFirst = await checkAndRecordWorldFirstBreed(
      childFishId, uid, displayName, child.sizeCm, child.weightKg, indId, child.name, mutResult !== 'none',
    );
    if (isWorldFirst) {
      addNotification('success', `🌍 世界初！${child.name}を初めて誕生させました！`);
      await postBoardMessage(uid, displayName, player?.stats.level ?? 1,
        `🌍 世界初！${displayName}さんが【${child.name}】を初めて交配で誕生させました！`);
    }

    if (mutResult === 'super') {
      addNotification('success', `✨ 超突然変異！！${child.name}が誕生しました！`);
      await postBoardMessage(uid, displayName, player?.stats.level ?? 1,
        `✨ 超突然変異発生！${displayName}さんに【${child.name}】が誕生しました！！`);
    } else if (mutResult === 'mutant') {
      addNotification('success', `🌟 突然変異！${child.name}が誕生しました！`);
    }

    const newSlots = breeding.slots.filter((_, i) => i !== slotIdx);
    const updBreeding = { ...breeding, slots: newSlots };
    await saveBreedingData(updBreeding);
    setBreeding(updBreeding);
    setBreedResult(child);
  }, [breeding, myFish, uid, displayName, player, breedBook, addNotification]);

  // ─── 水族館 ───────────────────────────────────────────
  const initMyAquarium = useCallback(async () => {
    const aq = await initAquarium(uid, displayName);
    setAquarium(aq);
  }, [uid, displayName]);

  const toggleDisplay = useCallback(async (fish: FishIndividual) => {
    if (!aquarium) return;
    if (!fish.isDisplayed && aquarium.displayedFish.length >= aquarium.maxDisplay) {
      addNotification('error', `展示枠が満杯です(最大${aquarium.maxDisplay}匹)`); return;
    }
    const upd = { ...fish, isDisplayed: !fish.isDisplayed };
    await saveFishIndividual(upd);
    setMyFish(prev => prev.map(f => f.individualId === fish.individualId ? upd : f));
    const newDisplayed = fish.isDisplayed
      ? aquarium.displayedFish.filter(f => f.individualId !== fish.individualId)
      : [...aquarium.displayedFish, upd];
    const newAq = { ...aquarium, displayedFish: newDisplayed };
    await saveAquarium(newAq);
    setAquarium(newAq);
    addNotification('success', fish.isDisplayed ? '展示を取り消しました' : '水族館に展示しました🐠');
  }, [aquarium, addNotification]);

  const expandAquarium = useCallback(async () => {
    if (!aquarium || !player) return;
    const cur = aquarium.maxDisplay;
    const expandSteps = [10, 15, 20, 30, 40, 50, 60, 70, 80, 90];
    const idx = expandSteps.indexOf(cur);
    if (idx < 0 || idx >= AQUA_EXPAND_COSTS.length) {
      addNotification('info', '最大展示枠に達しています'); return;
    }
    const cost = AQUA_EXPAND_COSTS[idx];
    if ((player.gold ?? 0) < cost) {
      addNotification('error', `${fmt(cost)}が必要です`); return;
    }
    changeGold(-cost);
    const newMax = cur + AQUA_EXPAND_AMOUNTS[idx];
    const newAq = { ...aquarium, maxDisplay: newMax };
    await saveAquarium(newAq);
    setAquarium(newAq);
    addNotification('success', `水族館を拡張しました！(${newMax}匹)`);
  }, [aquarium, player, changeGold, addNotification]);

  const handleVisit = useCallback(async () => {
    if (!visitUid.trim()) return;
    const res = await visitAquarium(visitUid.trim());
    setVisitedAq(res);
    if (!res) addNotification('error', '水族館が見つかりません');
  }, [visitUid, addNotification]);

  const handleLike = useCallback(async (targetUid: string) => {
    const already = visitedAq?.likedBy.includes(uid) ?? false;
    await likeAquarium(targetUid, uid, !already);
    const updated = await visitAquarium(targetUid);
    setVisitedAq(updated);
  }, [visitedAq, uid]);

  const handleComment = useCallback(async (targetUid: string) => {
    if (!commentText.trim()) return;
    const comment = {
      id: `${Date.now()}`, uid, displayName, text: commentText.trim(), createdAt: Date.now(),
    };
    await addAquariumComment(targetUid, comment);
    setCommentText('');
    const updated = await visitAquarium(targetUid);
    setVisitedAq(updated);
  }, [commentText, uid, displayName]);

  // ─── 品評会 ───────────────────────────────────────────
  const [showPickFish, setShowPickFish] = useState<FishIndividual | null>(null);
  const submitShow = useCallback(async (cat: 'size' | 'weight' | 'rarity' | 'breed' | 'mutant') => {
    if (!showPickFish || !showData) return;
    let score = 0;
    if (cat === 'size') score = showPickFish.sizeCm;
    else if (cat === 'weight') score = showPickFish.weightKg * 10;
    else if (cat === 'rarity') score = rarityScore(showPickFish.rarity) * 100;
    else if (cat === 'breed') score = showPickFish.breedRecipeId ? rarityScore(showPickFish.rarity) * 80 + showPickFish.sizeCm : 0;
    else if (cat === 'mutant') score = showPickFish.isMutant ? (showPickFish.isSuperMutant ? 10000 : 1000) + rarityScore(showPickFish.rarity) * 100 : 0;
    if (score === 0) { addNotification('error', 'この部門に参加できません'); return; }
    const entry: ShowEntry = {
      uid, displayName,
      individualId: showPickFish.individualId, fishName: showPickFish.name,
      fishIcon: showPickFish.icon ?? showPickFish.mutantIcon ?? '🐟',
      category: cat, sizeCm: showPickFish.sizeCm, weightKg: showPickFish.weightKg,
      rarity: showPickFish.rarity, isMutant: showPickFish.isMutant ?? false,
      score, submittedAt: Date.now(),
    };
    await submitToShow(entry);
    const updated = await getOrCreateCurrentShow();
    setShowData(updated);
    setShowPickFish(null);
    addNotification('success', '品評会に参加しました！');
  }, [showPickFish, showData, uid, displayName, addNotification]);

  if (loading) return <div style={{ padding: 24, color: '#8a92b2', textAlign: 'center' }}>読み込み中...</div>;

  const fishNotInPond = myFish.filter(f => f.pondSlot === undefined || f.pondSlot === null);

  return (
    <div style={S.wrap}>
      <div style={{ ...S.row, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>🐠</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f0c060' }}>魚養殖・交配・水族館</div>
          <div style={{ fontSize: 12, color: '#8a92b2' }}>所持魚 {myFish.length}匹 | 交配図鑑 {breedBook?.discovered.length ?? 0}/{TOTAL_RECIPES}種</div>
        </div>
      </div>

      <div style={S.tabs}>
        {(['farm','breed','book','aquarium','rank','show','world'] as Tab[]).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'farm' ? '🏊養殖場' : t === 'breed' ? '💞交配' : t === 'book' ? '📖図鑑' :
             t === 'aquarium' ? '🐠水族館' : t === 'rank' ? '🏆ランキング' : t === 'show' ? '🎪品評会' : '🌍世界初'}
          </button>
        ))}
      </div>

      {/* ─── 養殖場タブ ─── */}
      {tab === 'farm' && (
        <div>
          {!farm ? (
            <div style={S.card}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🔒 養殖場は未解放</div>
              <div style={{ color: '#8a92b2', marginBottom: 10, fontSize: 13 }}>
                釣りLv{FARM_UNLOCK_FISHING_LEVEL}以上、または{fmt(FARM_UNLOCK_GOLD)}で解放できます。
              </div>
              <div style={S.row}>
                <span style={{ fontSize: 12, color: '#8a92b2' }}>現在の釣りLv: {fishingLevel}</span>
                <button style={S.btn('#4fc3f7', fishingLevel < FARM_UNLOCK_FISHING_LEVEL && (player?.gold ?? 0) < FARM_UNLOCK_GOLD)} onClick={unlockFarm}>解放する</button>
              </div>
            </div>
          ) : (
            <>
              <div style={S.card}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>養殖池</span>
                  <span style={{ color: '#8a92b2', fontSize: 12 }}>{farm.slotCount}枠</span>
                  {farm.slotCount < 20 && (
                    <button style={S.btn('#4fc3f7')} onClick={expandPond}>
                      拡張 ({fmt(POND_EXPAND_COSTS[farm.slotCount - 2] ?? 0)})
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {Array.from({ length: farm.slotCount }, (_, i) => {
                  const fish = farm.pond[i];
                  return (
                    <div key={i} style={{ ...S.card, minHeight: 80, position: 'relative' }}>
                      <div style={{ fontSize: 11, color: '#8a92b2', marginBottom: 4 }}>スロット {i + 1}</div>
                      {fish ? (
                        <div>
                          <div style={S.row}>
                            <span style={{ fontSize: 20 }}>{fish.icon ?? '🐟'}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{fish.name}</div>
                              <span style={S.badge(fish.rarity)}>{AQUA_RARITY_LABEL[fish.rarity]}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: '#8a92b2', marginTop: 4 }}>
                            {GROWTH_STAGE_LABEL[fish.growthStage]} | {fish.sizeCm}cm | {fish.weightKg}kg
                          </div>
                          {/* 成長バー */}
                          <div style={{ marginTop: 6, height: 6, background: '#2d3752', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${growthProgress(fish)}%`, background: '#4fc3f7', transition: 'width 0.3s' }} />
                          </div>
                          <div style={{ ...S.row, marginTop: 6, gap: 4 }}>
                            {canGrow(fish) && <button style={S.btn('#81c784', false)} onClick={() => growFish(fish)}>成長↑</button>}
                            <button style={S.btn('#ef5350', false)} onClick={() => removeFishFromPond(i)}>取出</button>
                          </div>
                        </div>
                      ) : (
                        <button style={{ ...S.btn('#4fc3f7'), width: '100%', marginTop: 8 }}
                          onClick={() => { setSelectingSlot(i); setFishPickerOpen(true); }}>
                          + 魚を入れる
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* 魚ピッカー */}
              {fishPickerOpen && selectingSlot !== null && (
                <div style={{ ...S.card, marginTop: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>スロット {selectingSlot + 1} に入れる魚を選択</div>
                  {fishNotInPond.length === 0 ? (
                    <div style={{ color: '#8a92b2' }}>入れられる魚がいません（釣りで魚を入手してください）</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {fishNotInPond.map(f => (
                        <button key={f.individualId} style={{ ...S.btn('#4fc3f7'), fontSize: 12 }}
                          onClick={() => placeFish(selectingSlot, f)}>
                          {f.icon ?? '🐟'} {f.name} ({f.sizeCm}cm)
                        </button>
                      ))}
                    </div>
                  )}
                  <button style={{ ...S.btn('#8a92b2'), marginTop: 8 }} onClick={() => setFishPickerOpen(false)}>閉じる</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── 交配タブ ─── */}
      {tab === 'breed' && (
        <div>
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>💞 交配システム</div>
            <div style={{ color: '#8a92b2', fontSize: 12, marginBottom: 10 }}>
              親魚を2匹選んで交配させると新しい魚が生まれます。突然変異(0.1%)や超突然変異(0.01%)も発生します。
            </div>
            <div style={{ ...S.row, gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={S.label}>親魚1</div>
                <select style={S.input} value={breedP1?.individualId ?? ''}
                  onChange={e => setBreedP1(myFish.find(f => f.individualId === e.target.value) ?? null)}>
                  <option value=''>選択...</option>
                  {myFish.map(f => <option key={f.individualId} value={f.individualId}>{f.icon ?? '🐟'} {f.name} ({f.growthStage === 'adult' || f.growthStage === 'large' || f.growthStage === 'giant' ? '✓' : '×成魚以上必要'})</option>)}
                </select>
              </div>
              <div style={{ fontSize: 20 }}>💕</div>
              <div style={{ flex: 1 }}>
                <div style={S.label}>親魚2</div>
                <select style={S.input} value={breedP2?.individualId ?? ''}
                  onChange={e => setBreedP2(myFish.find(f => f.individualId === e.target.value) ?? null)}>
                  <option value=''>選択...</option>
                  {myFish.filter(f => f.individualId !== breedP1?.individualId).map(f => (
                    <option key={f.individualId} value={f.individualId}>{f.icon ?? '🐟'} {f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {breedP1 && breedP2 && (() => {
              const r = findMatchingRecipe(breedP1, breedP2);
              return r ? (
                <div style={{ background: '#131929', borderRadius: 8, padding: 8, marginBottom: 8, fontSize: 12 }}>
                  ✨ レシピ発見！<strong>{r.childName}</strong>が生まれる可能性があります
                  <span style={S.badge(r.childRarity)}>{AQUA_RARITY_LABEL[r.childRarity]}</span>
                </div>
              ) : (
                <div style={{ color: '#8a92b2', fontSize: 12, marginBottom: 8 }}>
                  既知のレシピなし（ランダムな子が生まれます）
                </div>
              );
            })()}
            <button style={S.btn('#f06292', !breedP1 || !breedP2)} onClick={startBreeding}>
              💞 交配開始
            </button>
          </div>

          {/* 交配スロット */}
          {breeding && breeding.slots.length > 0 && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>🥚 交配中</div>
              {breeding.slots.map((slot, i) => {
                const p1 = myFish.find(f => f.individualId === slot.parent1Id);
                const p2 = myFish.find(f => f.individualId === slot.parent2Id);
                const remaining = Math.max(0, slot.completesAt - Date.now());
                const done = remaining === 0;
                const pct = 100 - Math.floor(remaining / (slot.completesAt - slot.startedAt) * 100);
                const recipe = slot.recipeId !== 'generic' ? BREED_RECIPE_MAP[slot.recipeId] : null;
                return (
                  <div key={i} style={{ marginBottom: 10, padding: 8, background: '#131929', borderRadius: 8 }}>
                    <div style={S.row}>
                      <span>{p1?.icon ?? '🐟'} {p1?.name ?? '???'}</span>
                      <span>💕</span>
                      <span>{p2?.icon ?? '🐟'} {p2?.name ?? '???'}</span>
                    </div>
                    {recipe && <div style={{ fontSize: 11, color: '#f0c060', marginTop: 2 }}>→ {recipe.childName}を目指中</div>}
                    <div style={{ marginTop: 6, height: 6, background: '#2d3752', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: done ? '#81c784' : '#f0c060', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#8a92b2', marginTop: 2 }}>
                      {done ? '完了！' : `残り ${Math.floor(remaining / 3600000)}h ${Math.floor((remaining % 3600000) / 60000)}m`}
                    </div>
                    {done && <button style={S.btn('#81c784')} onClick={() => collectBreedResult(i)}>子供を受け取る</button>}
                  </div>
                );
              })}
            </div>
          )}

          {/* 生まれた子の表示 */}
          {breedResult && (
            <div style={{ ...S.card, border: `2px solid ${AQUA_RARITY_COLOR[breedResult.rarity]}` }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🎉 誕生！</div>
              <div style={{ fontSize: 32, textAlign: 'center' }}>{breedResult.icon ?? '🐟'}</div>
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 18, margin: '8px 0' }}>{breedResult.name}</div>
              <div style={{ textAlign: 'center' }}><span style={S.badge(breedResult.rarity)}>{AQUA_RARITY_LABEL[breedResult.rarity]}</span></div>
              <div style={{ color: '#8a92b2', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                個体番号: {breedResult.individualId} | {breedResult.sizeCm}cm | {breedResult.weightKg}kg
              </div>
              {breedResult.isSuperMutant && <div style={{ color: '#ff6b6b', fontWeight: 700, textAlign: 'center', marginTop: 4 }}>⚡ 超突然変異！！</div>}
              {breedResult.isMutant && !breedResult.isSuperMutant && <div style={{ color: '#ffd700', fontWeight: 700, textAlign: 'center', marginTop: 4 }}>✨ 突然変異！</div>}
              <button style={{ ...S.btn('#8a92b2'), marginTop: 8, display: 'block', width: '100%' }} onClick={() => setBreedResult(null)}>閉じる</button>
            </div>
          )}
        </div>
      )}

      {/* ─── 交配図鑑タブ ─── */}
      {tab === 'book' && (
        <div>
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📖 交配図鑑</div>
            <div style={{ color: '#8a92b2', fontSize: 13 }}>
              発見数: <strong style={{ color: '#f0c060' }}>{breedBook?.discovered.length ?? 0}</strong> / {TOTAL_RECIPES}
            </div>
            <div style={{ marginTop: 6, height: 8, background: '#2d3752', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.floor(((breedBook?.discovered.length ?? 0) / TOTAL_RECIPES) * 100)}%`, background: '#f0c060' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {BREED_RECIPES.map(r => {
              const found = breedBook?.discovered.includes(r.id) ?? false;
              return (
                <div key={r.id} style={{ ...S.card, opacity: found ? 1 : 0.5, padding: 8 }}>
                  {found ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{r.childIcon} {r.childName}</div>
                      <span style={S.badge(r.childRarity)}>{AQUA_RARITY_LABEL[r.childRarity]}</span>
                      <div style={{ fontSize: 11, color: '#8a92b2', marginTop: 2 }}>{r.description}</div>
                    </>
                  ) : (
                    <div style={{ fontWeight: 700, color: '#555' }}>？？？</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 水族館タブ ─── */}
      {tab === 'aquarium' && (
        <div>
          {!aquarium ? (
            <div style={S.card}>
              <button style={S.btn('#4fc3f7')} onClick={initMyAquarium}>🐠 マイ水族館を作る</button>
            </div>
          ) : (
            <>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🏛️ {displayName}の水族館</div>
                <div style={{ color: '#8a92b2', fontSize: 12 }}>
                  展示: {aquarium.displayedFish.length}/{aquarium.maxDisplay} | いいね: {aquarium.likes} | 訪問者: {aquarium.visitors}
                </div>
                <div style={{ ...S.row, marginTop: 8 }}>
                  {aquarium.maxDisplay < 100 && (
                    <button style={S.btn('#f0c060')} onClick={expandAquarium}>
                      展示枠拡張 ({fmt(AQUA_EXPAND_COSTS[([10,15,20,30,40,50,60,70,80,90]).indexOf(aquarium.maxDisplay)] ?? 0)})
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontWeight: 700, marginBottom: 8, marginTop: 8 }}>🐟 全ての所持魚</div>
              {myFish.length === 0 && <div style={{ color: '#8a92b2', fontSize: 13 }}>魚がいません。釣りや交配で魚を入手してください。</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {myFish.map(f => (
                  <div key={f.individualId} style={{ ...S.card, padding: 8, border: f.isDisplayed ? '1px solid #4fc3f7' : '1px solid #2d3752' }}>
                    <div style={S.row}>
                      <span style={{ fontSize: 20 }}>{f.icon ?? f.mutantIcon ?? '🐟'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{f.name}</div>
                        <span style={S.badge(f.rarity)}>{AQUA_RARITY_LABEL[f.rarity]}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#8a92b2', marginTop: 2 }}>
                      {f.individualId} | {f.sizeCm}cm | {f.weightKg}kg | {GROWTH_STAGE_LABEL[f.growthStage]}
                    </div>
                    {f.isMutant && <div style={{ fontSize: 11, color: '#ffd700' }}>{f.isSuperMutant ? '⚡超突然変異' : '✨突然変異'}</div>}
                    <button style={{ ...S.btn(f.isDisplayed ? '#ef5350' : '#4fc3f7'), marginTop: 6, fontSize: 11, padding: '4px 8px' }}
                      onClick={() => toggleDisplay(f)}>
                      {f.isDisplayed ? '展示解除' : '展示する'}
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ ...S.card, marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>🔍 他の水族館を訪問</div>
                <div style={S.row}>
                  <input style={{ ...S.input, flex: 1 }} placeholder='プレイヤーUID' value={visitUid} onChange={e => setVisitUid(e.target.value)} />
                  <button style={S.btn('#4fc3f7')} onClick={handleVisit}>訪問</button>
                </div>
                {visitedAq && (
                  <div style={{ marginTop: 10, padding: 10, background: '#131929', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>🏛️ {visitedAq.displayName}の水族館</div>
                    <div style={{ color: '#8a92b2', fontSize: 12 }}>いいね: {visitedAq.likes} | 訪問者: {visitedAq.visitors}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {visitedAq.displayedFish.map(f => (
                        <div key={f.individualId} style={{ background: '#1e2638', padding: 6, borderRadius: 8, fontSize: 12, textAlign: 'center' }}>
                          <div style={{ fontSize: 22 }}>{f.icon ?? '🐟'}</div>
                          <div>{f.name}</div>
                          <span style={S.badge(f.rarity)}>{AQUA_RARITY_LABEL[f.rarity]}</span>
                          {f.description && <div style={{ fontSize: 10, color: '#8a92b2', marginTop: 2 }}>{f.description}</div>}
                        </div>
                      ))}
                    </div>
                    <div style={{ ...S.row, marginTop: 8, gap: 8 }}>
                      <button style={S.btn(visitedAq.likedBy.includes(uid) ? '#ef5350' : '#f0c060')}
                        onClick={() => handleLike(visitedAq.uid)}>
                        {visitedAq.likedBy.includes(uid) ? '❤️ いいね取消' : '🤍 いいね'}
                      </button>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={S.label}>コメント</div>
                      {visitedAq.comments.map(c => (
                        <div key={c.id} style={{ background: '#0e1118', padding: 4, borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
                          <strong>{c.displayName}</strong>: {c.text}
                        </div>
                      ))}
                      <div style={{ ...S.row, marginTop: 4 }}>
                        <input style={{ ...S.input, flex: 1 }} placeholder='コメントを書く' value={commentText}
                          onChange={e => setCommentText(e.target.value)} />
                        <button style={S.btn('#4fc3f7')} onClick={() => handleComment(visitedAq.uid)}>送信</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── ランキングタブ ─── */}
      {tab === 'rank' && (
        <div>
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>❤️ いいね数ランキング</div>
            {aqRank.map((r, i) => (
              <div key={r.uid} style={{ ...S.row, padding: '4px 0', borderBottom: '1px solid #2d3752' }}>
                <span style={{ color: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#8a92b2', fontWeight: 700, minWidth: 24 }}>{i + 1}</span>
                <span style={{ flex: 1 }}>{r.displayName}</span>
                <span style={{ color: '#f0c060', fontWeight: 700 }}>❤️ {r.val}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>🐉 神話魚保有ランキング</div>
            {mythicRank.map((r, i) => (
              <div key={r.uid} style={{ ...S.row, padding: '4px 0', borderBottom: '1px solid #2d3752' }}>
                <span style={{ color: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#8a92b2', fontWeight: 700, minWidth: 24 }}>{i + 1}</span>
                <span style={{ flex: 1 }}>{r.name}</span>
                <span style={{ color: '#ff6b6b', fontWeight: 700 }}>🐉 {r.count}匹</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 品評会タブ ─── */}
      {tab === 'show' && showData && (
        <div>
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🎪 魚品評会</div>
            <div style={{ color: '#8a92b2', fontSize: 12 }}>毎週開催。自慢の魚を出品してください。</div>
            <div style={{ color: '#f0c060', fontSize: 12 }}>締切: {new Date(showData.weekEnd).toLocaleDateString('ja-JP')}</div>
          </div>
          {(['size', 'weight', 'rarity', 'breed', 'mutant'] as const).map(cat => {
            const catLabel = { size: '最大サイズ部門', weight: '最大重量部門', rarity: 'レア度部門', breed: '交配魚部門', mutant: '突然変異部門' }[cat];
            const entries = showData.entries[cat];
            return (
              <div key={cat} style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>🏆 {catLabel}</div>
                {entries.slice(0, 5).map((e, i) => (
                  <div key={e.uid} style={{ ...S.row, padding: '3px 0', fontSize: 12 }}>
                    <span style={{ color: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#8a92b2', minWidth: 20 }}>{i + 1}</span>
                    <span>{e.fishIcon} {e.fishName}</span>
                    <span style={{ color: '#8a92b2', flex: 1 }}> - {e.displayName}</span>
                    <span style={{ color: '#f0c060', fontWeight: 700 }}>
                      {cat === 'size' ? `${e.sizeCm}cm` : cat === 'weight' ? `${e.weightKg}kg` : cat === 'rarity' ? AQUA_RARITY_LABEL[e.rarity] : String(e.score)}
                    </span>
                  </div>
                ))}
                <div style={S.divider} />
                <div style={S.label}>出品する魚を選択</div>
                <select style={S.input} value={showPickFish?.individualId ?? ''}
                  onChange={e => setShowPickFish(myFish.find(f => f.individualId === e.target.value) ?? null)}>
                  <option value=''>魚を選択...</option>
                  {myFish.map(f => <option key={f.individualId} value={f.individualId}>{f.icon ?? '🐟'} {f.name} ({f.sizeCm}cm)</option>)}
                </select>
                <button style={{ ...S.btn('#f0c060'), marginTop: 6 }} onClick={() => submitShow(cat)}>出品する</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 世界初発見タブ ─── */}
      {tab === 'world' && (
        <div>
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>🌍 世界初発見記録</div>
            {worldFirsts.length === 0 && <div style={{ color: '#8a92b2' }}>まだ世界初発見がありません</div>}
            {worldFirsts.map(w => (
              <div key={w.individualId} style={{ borderBottom: '1px solid #2d3752', padding: '8px 0' }}>
                <div style={{ fontWeight: 700, color: '#f0c060' }}>🌍 {w.fishName}</div>
                <div style={{ fontSize: 12, color: '#8a92b2' }}>
                  発見者: <strong style={{ color: '#e8eaf6' }}>{w.discovererName}</strong> |
                  {new Date(w.discoveredAt).toLocaleDateString('ja-JP')} |
                  {w.sizeCm}cm / {w.weightKg}kg |
                  個体番号: {w.individualId}
                </div>
                {w.isMutant && <span style={{ fontSize: 11, color: '#ffd700' }}>✨ 突然変異個体</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
