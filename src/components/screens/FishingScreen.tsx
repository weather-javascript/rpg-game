// src/components/screens/FishingScreen.tsx  –  v3
import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  FISH_MASTER, FISH_IDS, TOTAL_FISH, calcWeight, calcFishSellPrice,
  getFishingBonuses, fishingExpRequired, RARITY_COLOR, RARITY_LABEL,
  FISHING_LEVEL_BONUSES, ROD_MASTER, ROD_IDS, BAIT_MASTER, BAIT_IDS,
  SPOT_MASTER, SPOT_IDS, rodEnhanceSuccessRate,
  FISHING_TITLES, FISHING_ACHIEVEMENTS,
} from '../../data/fishMasters';
import type { FishMaster, BaitMaster, RodMaster } from '../../data/fishMasters';
import {
  getCurrentWeather, getCurrentSeason, getActiveEventIds, fishCoinReward,
  FISH_COIN_SHOP, SEASON_LABEL, EVENT_DEFS, LEGENDARY_FISH_IDS,
} from '../../data/fishMastersExtra';
import type { WeatherEffect } from '../../data/fishMastersExtra';
import { postBoardMessage, tryRecordWorldFirstFish, getAllWorldFirstFish, subscribeFishingCastTime } from '../../services/multiplayer';
import { saveFishIndividual, nextIndividualId } from '../../services/fishAquaService';
import { queueSave } from '../../services/saveBuffer';
import type { AquaRarity } from '../../types/fishAqua';

// ─── catch simulation ────────────────────────────────────────
function tryCatch(
  fishingLevel: number,
  rod: RodMaster,
  enhanceLv: number,
  bait: BaitMaster | null,
  spot: typeof SPOT_MASTER[string],
  buffBonus: number,
  fishBook: Record<string, { maxSizeCm: number }>,
  weather: WeatherEffect,
  season: string,
  activeEvents: string[],
): { fish: FishMaster; sizeCm: number; weightKg: number; sellPrice: number; exp: number; isNew: boolean; isRecord: boolean } | null {
  const bonuses = getFishingBonuses(fishingLevel);
  const rodRarityBonus = rod.rarityBonus + enhanceLv * 0.01;
  const rodLargeBonus  = rod.largeFishBonus + enhanceLv * 0.005;
  const rodExpMult     = rod.expMult + enhanceLv * 0.02;
  // スポット適性ボーナス（竿のspotBonusフィールドを参照）
  const rodSpotBonus   = (rod.spotBonus?.[spot.id] ?? 0);
  // 伝説魚ボーナス（竿のlegendaryBonusフィールドを参照）
  const rodLegendBonus = (rod.legendaryBonus ?? 0);
  const baitRarity  = bait?.rarityBonus  ?? 0;
  const baitSize    = bait?.sizeBonus    ?? 0;
  const baitExp     = bait?.expBonus     ?? 0;
  const totalRarity = bonuses.rarityBonus + rodRarityBonus + baitRarity + weather.rarityBonus + rodSpotBonus;
  const totalLarge  = bonuses.largeFishBonus + rodLargeBonus;
  const totalLegend = bonuses.legendaryBonus + rodLegendBonus;

  const spotFishIds = FISH_IDS.filter(id => {
    const f = FISH_MASTER[id];
    if (f.minLevel > fishingLevel) return false;
    if (f.spots && f.spots.length > 0 && !f.spots.includes(spot.id)) return false;
    if (f.season && f.season !== season) return false;
    if (f.eventId && !activeEvents.includes(f.eventId)) return false;
    return true;
  });
  if (spotFishIds.length === 0) return null;

  const pool = spotFishIds.map(id => {
    const f = FISH_MASTER[id];
    let w = f.baseRate * spot.rarityMult * buffBonus;
    if (f.rarity === 'rare'  || f.rarity === 'epic') w += totalRarity * 0.5;
    if (f.rarity === 'legendary') w += (totalLegend + 0.01) * spot.rarityMult * weather.legendaryMult;
    if (f.minSizeCm >= 100) w += totalLarge * 0.3;
    return { f, w: Math.max(0, w) };
  });

  const total = pool.reduce((s, p) => s + p.w, 0);
  if (total === 0) return null;
  let rand = Math.random() * total; let chosen = pool[0].f;
  for (const p of pool) { rand -= p.w; if (rand <= 0) { chosen = p.f; break; } }

  let sizeRoll = Math.random();
  if (totalLarge > 0 && chosen.minSizeCm >= 50) sizeRoll = Math.max(sizeRoll, Math.random() * totalLarge + sizeRoll * (1 - totalLarge));
  sizeRoll = Math.min(1, sizeRoll * (1 + baitSize) * weather.sizeMult);
  const sizeCm    = Math.max(chosen.minSizeCm, Math.min(chosen.maxSizeCm, Math.round(chosen.minSizeCm + (chosen.maxSizeCm - chosen.minSizeCm) * sizeRoll)));
  const weightKg  = calcWeight(chosen, sizeCm) * (1 + (bait?.weightBonus ?? 0)) * weather.weightMult;
  const sellPrice = calcFishSellPrice(chosen, sizeCm);
  const exp       = Math.round((chosen.baseExp + Math.floor(sizeCm / chosen.maxSizeCm * chosen.baseExp)) * rodExpMult * spot.expMult * (1 + baitExp) * weather.expMult);
  const isNew     = !fishBook[chosen.id];
  const isRecord  = !isNew && sizeCm > (fishBook[chosen.id]?.maxSizeCm ?? 0);
  return { fish: chosen, sizeCm, weightKg: Math.round(weightKg * 100) / 100, sellPrice, exp, isNew, isRecord };
}

// ─── log ──────────────────────────────────────────────────────
interface LogEntry { id: number; msg: string; color?: string; label?: string; }
let logId = 0;

// ─── tabs ────────────────────────────────────────────────────
type Tab = 'fish' | 'book' | 'rod' | 'bait' | 'spot' | 'title' | 'rank' | 'shop' | 'roadmap';

// ─── ranking (Firestore) ──────────────────────────────────────
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface RankEntry { uid: string; name: string; val: number; }

async function fetchRanking(field: string, lim = 10): Promise<RankEntry[]> {
  try {
    const snap = await getDocs(query(collection(db, 'players'), orderBy(field, 'desc'), limit(lim)));
    return snap.docs.map((d: any) => ({ uid: d.id, name: d.data().displayName ?? '???', val: d.data()[field] ?? 0 }));
  } catch { return []; }
}

// ─── component ───────────────────────────────────────────────
export function FishingScreen() {
  const player            = useGameStore((s: any) => s.player);
  const addItems          = useGameStore((s: any) => s.addItems);
  const changeSatiety     = useGameStore((s: any) => s.changeSatiety);
  const changeGold        = useGameStore((s: any) => s.changeGold);
  const addNotification   = useGameStore((s: any) => s.addNotification);
  const equipRod          = useGameStore((s: any) => s.equipRod);
  const addFishingExp     = useGameStore((s: any) => s.addFishingExp);
  const recordCatch       = useGameStore((s: any) => s.recordCatch);
  const getActiveBuffBonus= useGameStore((s: any) => s.getActiveBuffBonus);
  const selectFishingSpot = useGameStore((s: any) => s.selectFishingSpot);
  const equipBait         = useGameStore((s: any) => s.equipBait);
  const useBait           = useGameStore((s: any) => s.useBait);
  const enhanceRod        = useGameStore((s: any) => s.enhanceRod);
  const spendFishCoin     = useGameStore((s: any) => s.spendFishCoin);
  const convertFishMoneyToGold = useGameStore((s: any) => s.convertFishMoneyToGold);
  const checkFishingAchievements = useGameStore((s: any) => s.checkFishingAchievements);
  const setFishingLocked  = useGameStore((s: any) => s.setFishingLocked);

  const weather = getCurrentWeather();
  const season  = getCurrentSeason();
  const activeEvents = getActiveEventIds();
  const [worldFirsts, setWorldFirsts] = useState<Record<string, { uid: string; displayName: string; caughtAt: number }>>({});

  const [tab, setTab] = useState<Tab>('fish');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [casting, setCasting] = useState(false);
  const castingRef = useRef(false);
  const [autoFish, setAutoFish] = useState(false);
  const autoRef = useRef(false);
  const cdRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [castTimeOverride, setCastTimeOverride] = useState<number | null>(null);

  const [rankTab, setRankTab] = useState<'size'|'weight'|'level'|'book'|'legendary'|'totalweight'>('level');
  const [rankData, setRankData] = useState<RankEntry[]>([]);
  const [rankLoading, setRankLoading] = useState(false);

  const fishingLevel  = player?.fishingLevel  ?? 1;
  const fishingExp    = player?.fishingExp     ?? 0;
  const fishBook      = player?.fishBook       ?? {};
  const equippedRodId = player?.equippedRodId  ?? 'basic_rod';
  const selectedSpotId= player?.fishingSelectedSpotId ?? 'pond';
  const equippedBaitId= player?.fishingEquippedBaitId ?? '';
  const rodEnhance    = player?.fishingRodEnhance ?? {};
  const unlockedSpots = player?.fishingUnlockedSpots ?? ['pond','river'];
  const achievements  = player?.fishingAchievements ?? [];
  const unlockedTitles= player?.fishingUnlockedTitles ?? [];

  const rod   = ROD_MASTER[equippedRodId]  ?? ROD_MASTER['basic_rod'];
  const spot  = SPOT_MASTER[selectedSpotId] ?? SPOT_MASTER['pond'];
  const bait  = equippedBaitId ? (BAIT_MASTER[equippedBaitId] ?? null) : null;
  const enhLv = rodEnhance[equippedRodId] ?? 0;

  const expReq  = fishingExpRequired(fishingLevel);
  const expPct  = fishingLevel >= 100000 ? 100 : Math.floor(fishingExp / expReq * 100);
  const bookCount = Object.keys(fishBook).length;
  const bookPct   = Math.floor(bookCount / TOTAL_FISH * 100);
  const staminaCost = spot.staminaCost;
  const cdMs    = castTimeOverride !== null ? castTimeOverride : spot.cooldownMs;

  // 釣り中はタブ移動をロック
  useEffect(() => {
    setFishingLocked(autoFish || casting);
  }, [autoFish, casting, setFishingLocked]);

  // アンマウント時にロック解除
  useEffect(() => {
    return () => setFishingLocked(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 管理者設定のキャスト時間をSubscribe
  useEffect(() => {
    const unsub = subscribeFishingCastTime(v => setCastTimeOverride(v));
    return unsub;
  }, []);

  // cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) { if (cdRef.current) clearInterval(cdRef.current); return; }
    cdRef.current = setInterval(() => setCooldown((p: number) => { const n = p - 100; if (n <= 0) { clearInterval(cdRef.current!); return 0; } return n; }), 100);
    return () => { if (cdRef.current) clearInterval(cdRef.current); };
  }, [cooldown]);

  const addLog = useCallback((msg: string, color?: string, label?: string) => {
    setLog((p: LogEntry[]) => [{ id: ++logId, msg, color, label }, ...p].slice(0, 40));
  }, []);

  const doFish = useCallback(() => {
    if (!player || cooldown > 0 || castingRef.current) return;
    if ((player.stats.satiety ?? 0) < staminaCost) {
      addNotification('warning', '満腹度が足りません！');
      autoRef.current = false; setAutoFish(false); return;
    }
    castingRef.current = true;
    setCasting(true);
    setTimeout(() => { setCasting(false); castingRef.current = false; }, 1000);
    changeSatiety(-staminaCost);

    const buffBonus = getActiveBuffBonus('fishing');
    const result = tryCatch(fishingLevel, rod, enhLv, bait, spot, buffBonus, fishBook, weather, season, activeEvents);

    if (bait && equippedBaitId) useBait();

    const oldLv = fishingLevel;
    if (result) {
      addFishingExp(result.exp);
      const coinEarned = Math.floor(fishCoinReward(result.fish.rarity, weather) * (rod.fishCoinMult ?? 1.0));
      recordCatch(result.fish.id, result.sizeCm, result.weightKg, result.sellPrice, coinEarned);
      // map to inventory item
      const itemMap: Record<string, string> = {
        iwashi:'raw_cod', aji:'raw_cod', fugu:'pufferfish', koi:'raw_salmon', tai:'raw_salmon',
        unagi:'raw_cod', tanago:'raw_cod', catfish:'raw_cod', sake:'raw_salmon', buri:'raw_salmon',
        hirame:'raw_cod', tako:'raw_cod', ebi:'raw_cod', kani:'raw_cod', hotate:'raw_cod', piranha:'raw_cod',
        maguro:'hoshi_tuna', katsuo:'hoshi_tuna', shark:'brilliant_salmon', ika:'brilliant_salmon',
        dragon_fish:'arowanna', rainbow_koi:'arowanna', abyssal_eel:'arowanna',
        ryujin_bass:'arowanna', golden_carp:'arowanna', deep_whale:'arowanna',
        lava_shark:'arowanna', storm_tuna:'hoshi_tuna', crystal_fish:'arowanna',
        ryujin:'arowanna', phantom_tuna:'hoshi_tuna', sea_god:'arowanna',
        infinity_fish:'arowanna', god_koi:'arowanna',
      };
      addItems([{ itemId: itemMap[result.fish.id] ?? 'raw_cod', amount: 1 }]);
      // 魚個体として保存（養殖・水族館システム連携）- レジェンダリーのみ即時保存、それ以外はスキップ
      if (player?.uid && result.fish.rarity === 'legendary') {
        const aquaRarity: AquaRarity = 'legendary';
        nextIndividualId().then(indId => {
          saveFishIndividual({
            individualId: indId, fishId: result.fish.id, name: result.fish.name,
            ownerUid: player.uid, ownerName: player.displayName,
            rarity: aquaRarity, growthStage: 'adult',
            sizeCm: result.sizeCm, weightKg: result.weightKg,
            bornAt: Date.now(), lastGrowthAt: Date.now(),
            icon: result.fish.icon, caughtAt: Date.now(),
          });
        }).catch(() => {});
      }
      const sizeLabel  = result.sizeCm >= result.fish.maxSizeCm * 0.95 ? ' 🏆最大級!' : '';
      const newLabel   = result.isNew ? ' ✨初図鑑!' : result.isRecord ? ' 📏記録更新!' : '';
      addLog(
        `${result.fish.icon} ${result.fish.name} ${result.sizeCm}cm/${result.weightKg}kg +${result.sellPrice}FishMoney +${result.exp}EXP${sizeLabel}${newLabel}`,
        RARITY_COLOR[result.fish.rarity], RARITY_LABEL[result.fish.rarity],
      );
      if (result.fish.rarity === 'legendary') {
        addNotification('success', `🌟 伝説「${result.fish.name}」釣り上げ！`);
        postBoardMessage('system', '📢 ワールド通知', 0,
          `🌟 ${player.displayName} が伝説の魚「${result.fish.name}」(${result.sizeCm}cm/${result.weightKg}kg)を釣り上げました！`)
          .catch(() => {});
        tryRecordWorldFirstFish(result.fish.id, player.uid, player.displayName).then(isFirst => {
          if (isFirst) {
            addNotification('success', `🏆 世界初発見！「${result.fish.name}」を最初に釣ったのはあなたです！`);
            postBoardMessage('system', '📢 ワールド通知', 0,
              `🏆 ${player.displayName} が「${result.fish.name}」の世界初発見者になりました！`).catch(() => {});
          }
        });
      }
      else if (result.fish.rarity === 'epic') addNotification('success', `✨ エピック「${result.fish.name}」！`);
      if (result.isNew) addNotification('info', `📖 図鑑登録: ${result.fish.name}`);
    } else {
      addLog('…ボーズ。', '#6b7280');
    }

    setTimeout(() => {
      const newLv = useGameStore.getState().player?.fishingLevel ?? 1;
      if (newLv > oldLv) {
        addNotification('success', `🎣 釣りLvUP! Lv${newLv.toLocaleString()}！`);
        const m = FISHING_LEVEL_BONUSES.find(b => b.level === newLv);
        if (m) addNotification('info', `🎁 特典: ${m.description}`);
        // 節目FC報酬通知
        const milestoneFC: Record<number,number> = {200:100,500:300,1000:500,2000:800,5000:2000,10000:5000,20000:8000,50000:20000,100000:100000};
        if (milestoneFC[newLv]) addNotification('success', `🐟 節目報酬: Fish Coin +${milestoneFC[newLv].toLocaleString()}枚！`);
        // 特定レベルで竿を自動プレゼント
        if (newLv === 900) addItems([{ itemId:'god_rod', amount:1 }]);
        if (newLv === 1000) addItems([{ itemId:'crystal_rod', amount:1 }]);
      }
      checkFishingAchievements();
    }, 150);

    queueSave();
    setCooldown(cdMs);
  }, [player, cooldown, casting, staminaCost, cdMs, rod, enhLv, bait, spot, equippedBaitId, fishingLevel, fishBook, getActiveBuffBonus, addFishingExp, recordCatch, addItems, changeGold, changeSatiety, addNotification, addLog, useBait, checkFishingAchievements, weather, season, activeEvents]);

  // auto fish
  useEffect(() => { autoRef.current = autoFish; }, [autoFish]);
  useEffect(() => {
    if (!autoFish) return;
    const sch = () => {
      if (!autoRef.current) return;
      autoTimerRef.current = setTimeout(() => { doFish(); if (autoRef.current) sch(); }, cdMs + 300);
    };
    sch();
    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current); };
  }, [autoFish, cdMs, doFish]);

  // 世界初発見データ読み込み
  useEffect(() => {
    if (tab !== 'book') return;
    getAllWorldFirstFish().then(setWorldFirsts);
  }, [tab]);

  useEffect(() => {
    if (tab !== 'rank') return;
    setRankLoading(true);
    const fieldMap = { size:'fishingMaxSizeCm', weight:'fishingMaxWeightKg', level:'fishingLevel', book:'fishingTotalCount', legendary:'fishingLegendaryCount', totalweight:'fishingTotalWeightKg' };
    fetchRanking(fieldMap[rankTab as keyof typeof fieldMap]).then(d => { setRankData(d); setRankLoading(false); });
  }, [tab, rankTab]);

  if (!player) return null;
  const bonuses = getFishingBonuses(fishingLevel);

  // ── UI helpers ──
  const S = {
    card: { background:'#1e293b', borderRadius:10, padding:'10px 14px', marginBottom:8 } as Record<string,unknown>,
    h2:   { fontSize:15, fontWeight:'bold', color:'#e2e8f0', marginBottom:8 } as Record<string,unknown>,
    muted:{ color:'#94a3b8', fontSize:12 } as Record<string,unknown>,
    btn:  (active?: boolean) => ({ padding:'6px 14px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:'bold', background: active ? '#0ea5e9' : '#334155', color:'#fff' }) as Record<string,unknown>,
  };

  return (
    <div style={{ padding:'10px', maxWidth:500, margin:'0 auto', fontFamily:'sans-serif' }}>

      {/* header */}
      <div style={{ background:'linear-gradient(135deg,#0f4c81,#1a7db5)', borderRadius:12, padding:'12px 16px', marginBottom:10, color:'#fff' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:17, fontWeight:'bold' }}>🎣 釣り</div>
            <div style={{ fontSize:12, opacity:0.8 }}>{spot.icon} {spot.name} | {rod.icon} {rod.name}{enhLv > 0 ? ` +${enhLv}` : ''}</div>
            {bait && <div style={{ fontSize:11, opacity:0.7 }}>{bait.icon} {bait.name}({player.inventory[equippedBaitId] ?? 0})</div>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:22, fontWeight:'bold' }}>Lv {fishingLevel.toLocaleString()}</div>
            <div style={{ fontSize:11, opacity:0.8 }}>{fishingLevel < 100000 ? `${fishingExp}/${expReq} EXP` : 'MAX Lv100000'}</div>
          </div>
        </div>
        {fishingLevel < 100000 && (
          <div style={{ marginTop:6, background:'rgba(255,255,255,0.2)', borderRadius:5, height:6, overflow:'hidden' }}>
            <div style={{ width:`${expPct}%`, height:'100%', background:'#7dd3fc', transition:'width .3s' }} />
          </div>
        )}
        <div style={{ marginTop:6, fontSize:11, opacity:0.7 }}>
          図鑑 {bookCount}/{TOTAL_FISH}({bookPct}%) | 総釣果 {(player.fishingTotalCount ?? 0).toLocaleString()} | 実績 {achievements.length}/{FISHING_ACHIEVEMENTS.length}
        </div>
        <div style={{ marginTop:4, fontSize:11, display:'flex', gap:10, flexWrap:'wrap' }}>
          <span>{weather.icon} {weather.name}</span>
          <span>{SEASON_LABEL[season]}</span>
          {activeEvents.map(eid => {
            const ev = EVENT_DEFS.find(e => e.id === eid);
            return ev ? <span key={eid}>{ev.icon} {ev.name}</span> : null;
          })}
          <span>🐟 Fish Coin {(player.fishCoin ?? 0).toLocaleString()}</span>
          <span>💵 FishMoney {(player.fishMoney ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display:'flex', gap:3, marginBottom:10, flexWrap:'wrap' }}>
        {(['fish','book','rod','bait','spot','shop','title','rank','roadmap'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...S.btn(tab===t), flex:'1 1 auto', padding:'6px 4px', fontSize:11 }}>
            {t==='fish'?'🎣釣り':t==='book'?'📖図鑑':t==='rod'?'🎣竿':t==='bait'?'🪱餌':t==='spot'?'📍場所':t==='shop'?'🐟交換所':t==='title'?'⭐称号':t==='roadmap'?'🗺️攻略':'🏆ランク'}
          </button>
        ))}
      </div>

      {/* ─── 釣りタブ ─── */}
      {tab === 'fish' && (
        <div>
          <button onClick={doFish} disabled={cooldown > 0 || casting} style={{
            width:'100%', padding:'14px', fontSize:18, fontWeight:'bold', borderRadius:12, border:'none',
            cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
            background: casting ? '#f59e0b' : cooldown > 0 ? '#374151' : 'linear-gradient(135deg,#0ea5e9,#0284c7)',
            color:'#fff', transition:'all .15s', transform: casting ? 'scale(0.97)' : 'scale(1)', marginBottom:8,
          }}>
            {casting ? '🌊 キャスト中…' : cooldown > 0 ? `⏳ ${(cooldown/1000).toFixed(1)}s` : '🎣 釣る'}
          </button>
          <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
            <button onClick={() => setAutoFish(v => !v)} style={{ ...S.btn(), background: autoFish ? '#dc2626' : '#0f4c81', flex:1 }}>
              {autoFish ? '⏹ 自動停止' : '▶ 自動釣り'}
            </button>
            <span style={S.muted}>満腹度 {player.stats.satiety ?? 0} / コスト {staminaCost}</span>
          </div>
          {cooldown > 0 && (
            <div style={{ background:'#1e293b', borderRadius:5, height:5, overflow:'hidden', marginBottom:8 }}>
              <div style={{ width:`${(1 - cooldown/cdMs)*100}%`, height:'100%', background:'#0ea5e9', transition:'width .1s linear' }} />
            </div>
          )}
          <div style={{ background:'#0f172a', borderRadius:10, padding:10, minHeight:180, maxHeight:320, overflowY:'auto' }}>
            {log.length === 0 && <div style={{ ...S.muted, textAlign:'center', paddingTop:60 }}>🎣 釣り竿を投げよう！</div>}
            {log.map((e: LogEntry) => (
              <div key={e.id} style={{ marginBottom:3, fontSize:12 }}>
                {e.label && <span style={{ color:e.color, fontWeight:'bold', fontSize:10, marginRight:4 }}>[{e.label}]</span>}
                <span style={{ color:e.color ?? '#cbd5e1' }}>{e.msg}</span>
              </div>
            ))}
          </div>
          <div style={{ ...S.card, marginTop:8 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, fontSize:12, color:'#94a3b8' }}>
              <div>📏 最大 {player.fishingMaxSizeCm ?? 0}cm</div>
              <div>⚖️ 最大 {player.fishingMaxWeightKg ?? 0}kg</div>
              <div>🌟 レア+{Math.round((bonuses.rarityBonus + rod.rarityBonus + enhLv*0.01 + (bait?.rarityBonus ?? 0))*100)}%</div>
              <div>🐋 大型+{Math.round((bonuses.largeFishBonus + rod.largeFishBonus + enhLv*0.005)*100)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 図鑑タブ ─── */}
      {tab === 'book' && (
        <div>
          <div style={{ ...S.card, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={S.h2}>📖 魚図鑑</span>
            <span style={{ fontSize:18, fontWeight:'bold', color:'#fbbf24' }}>{bookCount}/{TOTAL_FISH} <span style={{ fontSize:12, color:'#94a3b8' }}>({bookPct}%)</span></span>
          </div>
          {Object.values(FISH_MASTER).map(fish => {
            const e = fishBook[fish.id];
            return (
              <div key={fish.id} style={{ ...S.card, display:'flex', gap:10, alignItems:'center', border:`1px solid ${e ? RARITY_COLOR[fish.rarity]+'44' : '#1e293b'}`, opacity: e ? 1 : 0.45 }}>
                <div style={{ fontSize:24, width:32, textAlign:'center' }}>{e ? fish.icon : '❓'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontWeight:'bold', color:'#e2e8f0', fontSize:13 }}>{e ? fish.name : '???'}</span>
                    <span style={{ fontSize:10, color:RARITY_COLOR[fish.rarity], fontWeight:'bold' }}>{RARITY_LABEL[fish.rarity]}</span>
                    <span style={{ fontSize:10, color:'#64748b' }}>Lv{fish.minLevel}+</span>
                  </div>
                  {e
                    ? <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>最大 {e.maxSizeCm}cm / {e.maxWeightKg}kg | {e.totalCaught}匹 | {new Date(e.firstCaughtAt).toLocaleDateString('ja-JP')}</div>
                    : <div style={{ fontSize:11, color:'#475569' }}>未発見（{fish.spots?.join('・') ?? '全スポット'}）</div>
                  }
                  {LEGENDARY_FISH_IDS.includes(fish.id) && worldFirsts[fish.id] && (
                    <div style={{ fontSize:11, color:'#fbbf24', marginTop:2 }}>🏆 世界初発見: {worldFirsts[fish.id].displayName}</div>
                  )}
                </div>
                {e && <div style={{ fontSize:11, color:'#64748b', textAlign:'right' }}>{fish.minSizeCm}~{fish.maxSizeCm}cm</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 竿タブ ─── */}
      {tab === 'rod' && (
        <div>
          <div style={S.card}>
            <div style={S.h2}>🎣 釣り竿一覧</div>
            <div style={{ fontSize:12, color:'#94a3b8' }}>強化素材: 強化石(仮) | 最大+20 | 失敗あり</div>
          </div>
          {ROD_IDS.map(rid => {
            const r = ROD_MASTER[rid];
            const owned = (player.inventory[rid] ?? 0) > 0;
            const equipped = equippedRodId === rid;
            const eLv = rodEnhance[rid] ?? 0;
            const successRate = rodEnhanceSuccessRate(eLv);
            return (
              <div key={rid} style={{ ...S.card, border:`1px solid ${equipped ? '#0ea5e9' : RARITY_COLOR[r.rarity]+'33'}`, background: equipped ? '#0f3055' : '#1e293b', opacity: owned ? 1 : 0.45 }}>
                <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <div style={{ fontSize:22 }}>{r.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ fontWeight:'bold', color:'#e2e8f0', fontSize:13 }}>{r.name}</span>
                      {eLv > 0 && <span style={{ color:'#fbbf24', fontSize:12, fontWeight:'bold' }}>+{eLv}</span>}
                      <span style={{ fontSize:10, color:RARITY_COLOR[r.rarity] }}>{RARITY_LABEL[r.rarity]}</span>
                      {equipped && <span style={{ fontSize:10, color:'#7dd3fc' }}>装備中</span>}
                    </div>
                    {r.role && <div style={{ fontSize:10, color:'#f59e0b', fontWeight:'bold', marginTop:1 }}>{r.role}</div>}
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                      レア+{Math.round((r.rarityBonus + eLv*0.01)*100)}% 大型+{Math.round((r.largeFishBonus + eLv*0.005)*100)}% EXP×{(r.expMult + eLv*0.02).toFixed(2)} FC×{r.fishCoinMult.toFixed(1)} Lv{r.minLevel}+
                    </div>
                    {r.spotBonus && Object.keys(r.spotBonus).length > 0 && (
                      <div style={{ fontSize:10, color:'#34d399', marginTop:1 }}>
                        📍 得意: {Object.entries(r.spotBonus).map(([sid, v]) => `${SPOT_MASTER[sid]?.name ?? sid}(+${Math.round((v as number)*100)}%)`).join(' / ')}
                      </div>
                    )}
                    {r.legendaryBonus != null && r.legendaryBonus > 0 && (
                      <div style={{ fontSize:10, color:'#fbbf24', marginTop:1 }}>🌟 伝説魚+{Math.round(r.legendaryBonus*100)}%</div>
                    )}
                    <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>{r.obtainHint}</div>
                    {owned && eLv < 20 && (
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                        次の強化成功率: {Math.round(successRate*100)}% (+{eLv}→+{eLv+1})
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {owned && !equipped && <button onClick={() => equipRod(rid)} style={S.btn()}>装備</button>}
                    {owned && eLv < 20 && (
                      <button onClick={() => { enhanceRod(rid); checkFishingAchievements(); queueSave(); }} style={{ ...S.btn(), background:'#854d0e', fontSize:11 }}>
                        強化
                      </button>
                    )}
                    {eLv >= 20 && <span style={{ fontSize:10, color:'#fbbf24' }}>MAX</span>}
                    {!owned && <span style={{ fontSize:10, color:'#475569' }}>未所持</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 餌タブ ─── */}
      {tab === 'bait' && (
        <div>
          <div style={S.card}>
            <div style={S.h2}>🪱 餌一覧</div>
            <div style={{ fontSize:12, color:'#94a3b8' }}>装備中: {bait ? `${bait.icon} ${bait.name} (${player.inventory[equippedBaitId] ?? 0}個)` : 'なし'}</div>
          </div>
          {BAIT_IDS.map(bid => {
            const b = BAIT_MASTER[bid];
            const qty = player.inventory[bid] ?? 0;
            const equipped2 = equippedBaitId === bid;
            return (
              <div key={bid} style={{ ...S.card, border:`1px solid ${equipped2 ? '#0ea5e9' : RARITY_COLOR[b.rarity]+'22'}`, opacity: qty > 0 ? 1 : 0.45 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ fontSize:22 }}>{b.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontWeight:'bold', color:'#e2e8f0', fontSize:13 }}>{b.name}</span>
                      <span style={{ fontSize:10, color:RARITY_COLOR[b.rarity] }}>{RARITY_LABEL[b.rarity]}</span>
                      {equipped2 && <span style={{ fontSize:10, color:'#7dd3fc' }}>装備中</span>}
                    </div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>
                      レア+{Math.round(b.rarityBonus*100)}% サイズ+{Math.round(b.sizeBonus*100)}% EXP+{Math.round(b.expBonus*100)}% | 所持: {qty}
                    </div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{b.description}</div>
                  </div>
                  <div>
                    {qty > 0 && !equipped2 && <button onClick={() => equipBait(bid)} style={S.btn()}>装備</button>}
                    {equipped2 && <button onClick={() => equipBait('')} style={{ ...S.btn(), background:'#6b7280' }}>外す</button>}
                    {qty === 0 && <span style={{ fontSize:11, color:'#475569' }}>なし</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── スポットタブ ─── */}
      {tab === 'spot' && (
        <div>
          <div style={S.card}><div style={S.h2}>📍 釣りスポット ({unlockedSpots.length}/{SPOT_IDS.length}解放)</div></div>
          {SPOT_IDS.map(sid => {
            const sp = SPOT_MASTER[sid];
            const unlocked = unlockedSpots.includes(sid);
            const selected = selectedSpotId === sid;
            return (
              <div key={sid} style={{ ...S.card, border:`1px solid ${selected ? '#0ea5e9' : unlocked ? '#334155' : '#1e293b'}`, background: selected ? '#0f3055' : '#1e293b', opacity: unlocked ? 1 : 0.4 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ fontSize:22 }}>{sp.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontWeight:'bold', color:'#e2e8f0', fontSize:13 }}>{sp.name}</span>
                      {selected && <span style={{ fontSize:10, color:'#7dd3fc' }}>選択中</span>}
                    </div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>
                      レア×{sp.rarityMult.toFixed(1)} EXP×{sp.expMult.toFixed(1)} 大型×{sp.largeFishMult.toFixed(1)} | CD {sp.cooldownMs/1000}s | コスト {sp.staminaCost}
                    </div>
                    {!unlocked && <div style={{ fontSize:11, color:'#f59e0b', marginTop:1 }}>🔒 {sp.unlockCond?.startsWith('level_') ? `釣りLv${sp.unlockCond.replace('level_','')}で解放` : `Lv${sp.minLevel}+`}</div>}
                    {unlocked && <div style={{ fontSize:11, color:'#64748b' }}>{sp.description}</div>}
                  </div>
                  {unlocked && !selected && <button onClick={() => { selectFishingSpot(sid); queueSave(); }} style={S.btn()}>選択</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Fish Coin交換所タブ ─── */}
      {tab === 'shop' && (
        <div>
          <div style={S.card}>
            <div style={S.h2}>🐟 Fish Coin交換所</div>
            <div style={{ fontSize:12, color:'#94a3b8' }}>所持 Fish Coin: <b style={{ color:'#fbbf24' }}>{(player.fishCoin ?? 0).toLocaleString()}</b></div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>レア・エピック・伝説の魚を釣るとFish Coinを獲得できます。神秘の日・赤い月は獲得量UP！</div>
            <div style={{ marginTop:8, background:'rgba(14,165,233,0.08)', borderRadius:6, padding:'6px 10px', fontSize:11, color:'#7dd3fc' }}>
              💡 Fish Coinの獲得方法: レア魚=1枚、エピック魚=3枚、伝説魚=10枚。天候イベント中は最大2倍獲得！
            </div>
          </div>
          <div style={S.card}>
            <div style={S.h2}>💵 FishMoney → G 変換</div>
            <div style={{ fontSize:12, color:'#94a3b8' }}>所持 FishMoney: <b style={{ color:'#34d399' }}>{(player.fishMoney ?? 0).toLocaleString()}</b></div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>60 FishMoney → 1 G に変換できます。</div>
            <button
              style={{ ...S.btn(true), marginTop:8 }}
              disabled={(player.fishMoney ?? 0) < 60}
              onClick={() => convertFishMoneyToGold()}
            >
              💱 全額をGに変換（{Math.floor((player.fishMoney ?? 0) / 60).toLocaleString()}G獲得）
            </button>
          </div>
          {FISH_COIN_SHOP.map(item => {
            const can = (player.fishCoin ?? 0) >= item.cost;
            // 竿アイテムかどうか
            const isRod = ['fc_all_rod_x','fc_master_rod_z','fc_sky_rod'].includes(item.id);
            // 餌アイテムの詳細効果を取得
            const baitDef = BAIT_MASTER[item.grantItemId];
            const effectLines: string[] = [];
            if (baitDef) {
              if (baitDef.rarityBonus > 0) effectLines.push(`レア率+${Math.round(baitDef.rarityBonus*100)}%`);
              if (baitDef.sizeBonus > 0) effectLines.push(`サイズ+${Math.round(baitDef.sizeBonus*100)}%`);
              if (baitDef.weightBonus > 0) effectLines.push(`重量+${Math.round(baitDef.weightBonus*100)}%`);
              if (baitDef.expBonus > 0) effectLines.push(`EXP+${Math.round(baitDef.expBonus*100)}%`);
              if (baitDef.id === 'infinity_bait') effectLines.push('♾️ 消費なし（無限使用）');
            }
            if (isRod) {
              const rodDef = ROD_MASTER[item.grantItemId];
              if (rodDef) {
                if (rodDef.role) effectLines.push(rodDef.role);
                effectLines.push(`レア+${Math.round(rodDef.rarityBonus*100)}% 大型+${Math.round(rodDef.largeFishBonus*100)}% EXP×${rodDef.expMult.toFixed(2)} FC×${rodDef.fishCoinMult.toFixed(1)}`);
                effectLines.push(`Lv${rodDef.minLevel}以上で使用可`);
              }
            }
            return (
              <div key={item.id} style={{ ...S.card, border:`1px solid ${can ? '#1e3a5f' : '#1e293b'}`, opacity: can ? 1 : 0.6 }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ fontSize:22 }}>{item.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:'bold', color:'#e2e8f0', fontSize:13 }}>{item.name}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{item.description}</div>
                    {effectLines.length > 0 && (
                      <div style={{ marginTop:4, background:'rgba(99,102,241,0.1)', borderRadius:5, padding:'4px 8px', display:'flex', flexWrap:'wrap', gap:'4px 10px' }}>
                        {effectLines.map((l,i) => (
                          <span key={i} style={{ fontSize:10, color:'#a5b4fc', fontWeight:'bold' }}>✦ {l}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (!spendFishCoin(item.cost)) return;
                      addItems([{ itemId: item.grantItemId, amount: item.grantAmount }]);
                      addNotification('success', `${item.icon} ${item.name} と交換した！`);
                      queueSave();
                    }}
                    disabled={!can}
                    style={{ ...S.btn(), background: can ? '#0ea5e9' : '#374151', cursor: can ? 'pointer' : 'not-allowed', whiteSpace:'nowrap' as const }}
                  >
                    {item.cost} Coin
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {tab === 'title' && (
        <div>
          <div style={S.card}>
            <div style={S.h2}>⭐ 釣り称号 ({unlockedTitles.length}/{FISHING_TITLES.length})</div>
          </div>
          {FISHING_TITLES.map(t => {
            const have = unlockedTitles.includes(t.id);
            return (
              <div key={t.id} style={{ ...S.card, opacity: have ? 1 : 0.4, background: have ? '#1e293b' : '#0f172a', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18 }}>{have ? '✅' : '🔒'}</span>
                <span style={{ color: have ? '#fbbf24' : '#475569', fontWeight:'bold', fontSize:13 }}>{t.label}</span>
              </div>
            );
          })}
          <div style={{ ...S.card, marginTop:12 }}>
            <div style={S.h2}>🏅 釣り実績 ({achievements.length}/{FISHING_ACHIEVEMENTS.length})</div>
          </div>
          {FISHING_ACHIEVEMENTS.map(a => {
            const have = achievements.includes(a.id);
            return (
              <div key={a.id} style={{ ...S.card, opacity: have ? 1 : 0.4, background: have ? '#1e293b' : '#0f172a', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18 }}>{a.icon}</span>
                <div>
                  <div style={{ color: have ? '#e2e8f0' : '#475569', fontWeight:'bold', fontSize:13 }}>{a.name}</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>{a.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ロードマップタブ ─── */}
      {tab === 'roadmap' && (
        <div>
          {/* 現在状況サマリー */}
          <div style={{ background:'linear-gradient(135deg,#0f3055,#1a4a7a)', borderRadius:10, padding:'10px 14px', marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:'bold', color:'#7dd3fc', marginBottom:6 }}>📊 現在の状況</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, fontSize:12, color:'#94a3b8' }}>
              <div>🎣 釣りLv: <b style={{color:'#e2e8f0'}}>{fishingLevel}</b></div>
              <div>📖 図鑑: <b style={{color:'#e2e8f0'}}>{bookCount}/{TOTAL_FISH}</b></div>
              <div>🎣 竿: <b style={{color:'#e2e8f0'}}>{rod.name}{enhLv>0?` +${enhLv}`:''}</b></div>
              <div>📍 スポット: <b style={{color:'#e2e8f0'}}>{spot.name}</b></div>
              <div>🪱 餌: <b style={{color:'#e2e8f0'}}>{bait ? bait.name : 'なし'}</b></div>
              <div>🐟 FC: <b style={{color:'#fbbf24'}}>{(player.fishCoin ?? 0).toLocaleString()}</b></div>
            </div>
          </div>

          {/* 釣り竿の強化 */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:'bold', color:'#fbbf24', marginBottom:6 }}>⚡ 釣り竿の入手・強化</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:8, lineHeight:1.6 }}>
              竿は「竿タブ」で装備・強化できます。強化するたびに確率でレベルアップし、最大+20まで強化可能。失敗することもあります。
            </div>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:6, fontWeight:'bold' }}>入手方法:</div>
            {[
              { icon:'🪵', name:'木の釣り竿', how:'ショップ購入（100G）| EXP+20%特化', lv:10 },
              { icon:'🎣', name:'鉄の釣り竿', how:'初期装備 | バランス型', lv:10 },
              { icon:'🎣', name:'銅の釣り竿', how:'ショップ購入（200G）| 大型魚特化', lv:30 },
              { icon:'🎣', name:'銀の釣り竿', how:'謎の箱 | レア率特化・FC×1.2', lv:50 },
              { icon:'🎣', name:'オールロッドX', how:'🐟 Fish Coin交換所 400枚 | FC×2倍', lv:100 },
              { icon:'💠', name:'水晶の釣り竿', how:'クラフト | EXP周回専用（×1.8）', lv:150 },
              { icon:'🏆', name:'黄金の釣り竿', how:'クラフト（黄金の延べ棒×3）| 大型×レアバランス', lv:200 },
              { icon:'🎣', name:'マスターロッド', how:'Yランダムボックスドロップ | 汎用エピック', lv:200 },
              { icon:'⚡', name:'マスターロッドZ', how:'🐟 Fish Coin交換所 800枚 | FC×3倍', lv:300 },
              { icon:'🌑', name:'深海竿', how:'クラフト（深海素材）| 深海/洞窟/奈落特化', lv:350 },
              { icon:'🌋', name:'溶岩竿', how:'クラフト（溶岩石・龍の鱗）| 火山湖特化', lv:450 },
              { icon:'☁️', name:'天空竿', how:'🐟 Fish Coin交換所 1500枚 | 天空湖特化+伝説魚UP', lv:600 },
              { icon:'🐉', name:'龍の釣り竿', how:'釣りLv70 + 龍神討伐後クラフト | 後半スポット+伝説魚特化', lv:700 },
              { icon:'✨', name:'神竿', how:'釣りLv90達成で解放 | 天界・奈落・混沌の海特化', lv:900 },
              { icon:'♾️', name:'∞竿', how:'釣りLv100 + 図鑑100%コンプリート | 全ステ最大', lv:1000 },
            ].map(r => (
              <div key={r.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom:'1px solid #1e293b', opacity: fishingLevel >= r.lv ? 1 : 0.5 }}>
                <span style={{ fontSize:16, width:20 }}>{r.icon}</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:12, color: fishingLevel >= r.lv ? '#e2e8f0' : '#64748b', fontWeight:'bold' }}>{r.name}</span>
                  <div style={{ fontSize:10, color:'#475569' }}>{r.how}</div>
                </div>
                <span style={{ fontSize:10, color: fishingLevel >= r.lv ? '#4ade80' : '#f59e0b' }}>{fishingLevel >= r.lv ? '✅' : `Lv${r.lv}～`}</span>
              </div>
            ))}
            <div style={{ marginTop:8, background:'rgba(251,191,36,0.08)', borderRadius:5, padding:'6px 8px', fontSize:11, color:'#fbbf24' }}>
              💡 強化のコツ: +10以降は成功率が下がります。失敗してもレベルは下がりません。
            </div>
          </div>

          {/* 餌の入手 */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:'bold', color:'#4ade80', marginBottom:6 }}>🪱 餌の入手方法</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:8, lineHeight:1.6 }}>
              餌を使うと釣り1回ごとに1個消費。∞の餌は例外で消費なし（無限使用可）。
            </div>
            {[
              { tier:'common', label:'初級餌', color:'#94a3b8', items:[
                { icon:'🪱', name:'ミミズ', how:'市場で購入（10G）' },
                { icon:'🦐', name:'小エビ', how:'市場で購入（15G）' },
                { icon:'🌽', name:'コーン', how:'市場で購入（10G）' },
              ]},
              { tier:'uncommon', label:'中級餌', color:'#4ade80', items:[
                { icon:'🦀', name:'カニの爪', how:'市場で購入（40G）' },
                { icon:'🪁', name:'基本ルアー', how:'市場で購入（50G）' },
                { icon:'🍤', name:'特製エビ', how:'市場で購入（70G）' },
              ]},
              { tier:'rare', label:'上級餌', color:'#60a5fa', items:[
                { icon:'✨', name:'光るミミズ', how:'🐟 交換所 20 Fish Coin' },
                { icon:'✨', name:'黄金の餌', how:'🐟 交換所 50 Fish Coin' },
                { icon:'🎯', name:'高級ルアー', how:'🐟 交換所 90 Fish Coin' },
              ]},
              { tier:'epic', label:'エピック餌', color:'#c084fc', items:[
                { icon:'🐉', name:'龍の血', how:'🐟 交換所 140 Fish Coin' },
              ]},
              { tier:'legendary', label:'伝説餌', color:'#fbbf24', items:[
                { icon:'🌟', name:'神の餌', how:'🐟 交換所 200 Fish Coin' },
                { icon:'🕳️', name:'虚空の餌', how:'🐟 交換所 220 Fish Coin' },
                { icon:'♾️', name:'∞の餌 ★消費なし', how:'🐟 交換所 300 Fish Coin ← 最終目標！' },
              ]},
            ].map(tier => (
              <div key={tier.tier} style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:tier.color, fontWeight:'bold', marginBottom:3 }}>▸ {tier.label}</div>
                {tier.items.map(it => (
                  <div key={it.name} style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 0', paddingLeft:8 }}>
                    <span style={{ fontSize:14 }}>{it.icon}</span>
                    <span style={{ fontSize:11, color:'#e2e8f0', flex:1 }}>{it.name}</span>
                    <span style={{ fontSize:10, color:'#64748b' }}>{it.how}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* スポット解放 */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:'bold', color:'#38bdf8', marginBottom:6 }}>📍 釣りスポットの解放</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:8 }}>
              釣りレベルが上がると自動で新スポットが解放されます。スポットタブで選択してください。
            </div>
            {[
              { lv:10,  icon:'🏞️', name:'近所の池 / 清流の川', desc:'基本スポット。序盤はここで稼ぐ。' },
              { lv:80,  icon:'🌊', name:'静寂の湖', desc:'大型淡水魚が出現。EXP効率UP。' },
              { lv:100, icon:'🌅', name:'浜辺の海', desc:'海水魚が登場。種類が一気に増える。' },
              { lv:120, icon:'🌿', name:'霧の沼地', desc:'ピラニアなど珍しい魚が出現。' },
              { lv:200, icon:'⛵', name:'沖合', desc:'マグロ・サメなど大型魚が狙える。' },
              { lv:350, icon:'🕳️', name:'水中洞窟', desc:'洞窟固有の希少魚が生息。' },
              { lv:400, icon:'🌑', name:'深海', desc:'ダイオウイカ・深淵クジラなど登場。' },
              { lv:450, icon:'🧊', name:'氷河の海', desc:'極寒の海に適応した魚。' },
              { lv:500, icon:'🌋', name:'火山湖', desc:'炎のルアーが有効。高レアリティ。' },
              { lv:550, icon:'🏛️', name:'古代の川', desc:'古代魚が出現。' },
              { lv:600, icon:'☁️', name:'天空湖', desc:'虹色コイ・黄金コイなど幻の魚。' },
              { lv:650, icon:'🌈', name:'虹の滝', desc:'神秘的な滝壺。' },
              { lv:700, icon:'✨', name:'黄金の川', desc:'EXP×3・レア×3。本格的な後半。' },
              { lv:750, icon:'💎', name:'水晶の海', desc:'透明な海でエピック魚多数。' },
              { lv:800, icon:'⚫', name:'奈落', desc:'最強クラスの魚が潜む。' },
              { lv:850, icon:'🌀', name:'混沌の海', desc:'何が出るか予測不能。' },
              { lv:900, icon:'🌟', name:'天界の海', desc:'EXP×5・レア×5。終盤の聖地。' },
            ].map(sp => (
              <div key={sp.lv} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom:'1px solid #0f172a', opacity: fishingLevel >= sp.lv ? 1 : 0.5 }}>
                <span style={{ fontSize:16, width:20 }}>{sp.icon}</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:12, color: fishingLevel >= sp.lv ? '#e2e8f0' : '#475569', fontWeight:'bold' }}>{sp.name}</span>
                  <div style={{ fontSize:10, color:'#475569' }}>{sp.desc}</div>
                </div>
                <span style={{ fontSize:10, color: fishingLevel >= sp.lv ? '#4ade80' : '#f59e0b', whiteSpace:'nowrap' as const }}>{fishingLevel >= sp.lv ? '✅解放済' : `Lv${sp.lv}で解放`}</span>
              </div>
            ))}
          </div>

          {/* Fish Coin攻略 */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:'bold', color:'#fbbf24', marginBottom:6 }}>🐟 Fish Coin 効率的な稼ぎ方</div>
            <div style={{ fontSize:11, color:'#94a3b8', lineHeight:1.7 }}>
              <div>・レア魚 = 1枚 / エピック魚 = 3枚 / 伝説魚 = 10枚</div>
              <div>・天候「神秘の日」「赤い月」のとき獲得量が2倍</div>
              <div>・高レアリティスポット（天空湖・奈落・天界の海）で効率UP</div>
              <div>・レア率を上げる竿・餌を組み合わせると◎</div>
              <div style={{ marginTop:6, color:'#fbbf24', fontWeight:'bold' }}>目標: 300枚 → ∞の餌（消費なし！）を最優先で狙おう</div>
            </div>
          </div>

          {/* レベル上げのコツ */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:'bold', color:'#a78bfa', marginBottom:6 }}>⬆️ 釣りレベルの上げ方・長期目標</div>
            <div style={{ fontSize:11, color:'#94a3b8', lineHeight:1.7 }}>
              <div>・魚を釣るたびにEXP獲得。レア・大型ほど多い</div>
              <div>・EXP倍率の高い竿を使う（マスターロッドZ: ×1.55、神竿: ×2.5）</div>
              <div>・EXP倍率の高いスポットを選ぶ（天界の海: ×5）</div>
              <div>・EXPボーナス付きの餌を使う（∞の餌: +100%）</div>
              <div>・自動釣りを活用してAFK放置が有効</div>
              <div style={{ marginTop:6, color:'#c084fc', fontWeight:'bold' }}>Lv100 + 図鑑100% → ∞竿入手！その先もレベルは続く</div>
            </div>

            {/* 長期節目ロードマップ */}
            <div style={{ marginTop:10, fontSize:12, fontWeight:'bold', color:'#fbbf24', marginBottom:6 }}>🗺️ Lv節目ロードマップ（Lv100000まで）</div>
            {[
              { lv:100,    phase:'【フェーズ1 完了】', reward:'∞竿＋伝説魚率+50%', color:'#fbbf24' },
              { lv:200,    phase:'【フェーズ2 入門】', reward:'FC+100枚＋称号「月の釣り師」', color:'#94a3b8' },
              { lv:500,    phase:'【フェーズ2 中盤】', reward:'FC+300枚＋称号「星の釣り師」＋伝説魚率+20%', color:'#94a3b8' },
              { lv:1000,   phase:'【フェーズ2 完了】', reward:'FC+500枚＋称号「伝説の釣り人」＋レア率+10%', color:'#60a5fa' },
              { lv:2000,   phase:'【フェーズ3 入門】', reward:'FC+800枚＋称号「神話の釣り人」＋大型魚+10%', color:'#60a5fa' },
              { lv:5000,   phase:'【フェーズ3 中盤】', reward:'FC+2000枚＋称号「宇宙の釣り師」＋伝説魚率+30%', color:'#a78bfa' },
              { lv:10000,  phase:'【フェーズ3 完了】', reward:'FC+5000枚＋称号「龍帝の釣り師」＋レア率+15%', color:'#a78bfa' },
              { lv:20000,  phase:'【フェーズ4 入門】', reward:'FC+8000枚＋称号「覇王の釣り師」＋大型魚+15%', color:'#f472b6' },
              { lv:50000,  phase:'【フェーズ4 中盤】', reward:'FC+20000枚＋称号「神々の釣り師」＋伝説魚率+50%', color:'#f472b6' },
              { lv:100000, phase:'【フェーズ4 完了・究極】', reward:'FC+100000枚＋称号「究極釣り師」＋全ボーナス最大', color:'#fbbf24' },
            ].map(m => {
              const reached = fishingLevel >= m.lv;
              const isCurrent = fishingLevel < m.lv && (
                m.lv === 200 ? fishingLevel >= 100 :
                m.lv === 500 ? fishingLevel >= 200 :
                m.lv === 1000 ? fishingLevel >= 500 :
                m.lv === 2000 ? fishingLevel >= 1000 :
                m.lv === 5000 ? fishingLevel >= 2000 :
                m.lv === 10000 ? fishingLevel >= 5000 :
                m.lv === 20000 ? fishingLevel >= 10000 :
                m.lv === 50000 ? fishingLevel >= 20000 :
                m.lv === 100000 ? fishingLevel >= 50000 : false
              );
              return (
                <div key={m.lv} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'5px 0', borderBottom:'1px solid #0f172a', opacity: reached ? 0.7 : isCurrent ? 1 : 0.45 }}>
                  <span style={{ fontSize:14, minWidth:20 }}>{reached ? '✅' : isCurrent ? '🎯' : '🔒'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color: m.color, fontWeight:'bold' }}>Lv{m.lv.toLocaleString()} {m.phase}</div>
                    <div style={{ fontSize:10, color:'#64748b' }}>{m.reward}</div>
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop:8, background:'rgba(251,191,36,0.08)', borderRadius:5, padding:'6px 8px', fontSize:11, color:'#fbbf24' }}>
              💡 現在 Lv{fishingLevel.toLocaleString()}。次の大きな節目: Lv{
                fishingLevel < 200 ? 200 :
                fishingLevel < 500 ? 500 :
                fishingLevel < 1000 ? 1000 :
                fishingLevel < 2000 ? 2000 :
                fishingLevel < 5000 ? 5000 :
                fishingLevel < 10000 ? 10000 :
                fishingLevel < 20000 ? 20000 :
                fishingLevel < 50000 ? 50000 :
                fishingLevel < 100000 ? 100000 : '∞（Lv100000達成済み！）'
              }
            </div>
          </div>
        </div>
      )}

      {tab === 'rank' && (
        <div>
          <div style={{ display:'flex', gap:4, marginBottom:8, flexWrap:'wrap' }}>
            {(['level','size','weight','book','legendary','totalweight'] as const).map(r => (
              <button key={r} onClick={() => setRankTab(r)} style={{ ...S.btn(rankTab===r), flex:'1 1 auto', fontSize:11 }}>
                {r==='level'?'🎣 釣りLv':r==='size'?'📏 最大サイズ':r==='weight'?'⚖️ 最大重量':r==='book'?'🐟 総釣果':r==='legendary'?'🌟 伝説魚数':'⚖️ 総重量'}
              </button>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.h2}>
              {rankTab==='level'?'🎣 釣りレベルランキング':rankTab==='size'?'📏 最大サイズランキング':rankTab==='weight'?'⚖️ 最大重量ランキング':rankTab==='book'?'🐟 総釣果ランキング':rankTab==='legendary'?'🌟 伝説魚数ランキング':'⚖️ 総重量ランキング'}
            </div>
            {rankLoading ? (
              <div style={{ ...S.muted, textAlign:'center', padding:'20px 0' }}>読み込み中...</div>
            ) : rankData.length === 0 ? (
              <div style={{ ...S.muted, textAlign:'center', padding:'20px 0' }}>データなし</div>
            ) : (
              rankData.map((r, i) => (
                <div key={r.uid} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid #1e293b' }}>
                  <span style={{ fontSize:16, width:28, textAlign:'center' }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}</span>
                  <span style={{ flex:1, color:'#e2e8f0', fontSize:13 }}>{r.name}</span>
                  <span style={{ color:'#fbbf24', fontWeight:'bold', fontSize:13 }}>
                    {rankTab==='level'?`Lv${r.val}`:rankTab==='size'?`${r.val}cm`:rankTab==='weight'?`${r.val}kg`:rankTab==='legendary'?`${r.val}匹`:rankTab==='totalweight'?`${r.val.toLocaleString()}kg`:`${r.val.toLocaleString()}匹`}
                  </span>
                </div>
              ))
            )}
          </div>
          <div style={{ ...S.card, marginTop:8 }}>
            <div style={S.h2}>自分の記録</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:13, color:'#94a3b8' }}>
              <div>🎣 Lv: <b style={{ color:'#e2e8f0' }}>{fishingLevel}</b></div>
              <div>📏 最大: <b style={{ color:'#e2e8f0' }}>{player.fishingMaxSizeCm ?? 0}cm</b></div>
              <div>⚖️ 最大: <b style={{ color:'#e2e8f0' }}>{player.fishingMaxWeightKg ?? 0}kg</b></div>
              <div>🐟 総数: <b style={{ color:'#e2e8f0' }}>{(player.fishingTotalCount ?? 0).toLocaleString()}</b></div>
              <div>📖 図鑑: <b style={{ color:'#e2e8f0' }}>{bookPct}%</b></div>
              <div>💰 総G: <b style={{ color:'#e2e8f0' }}>{(player.fishingTotalGoldEarned ?? 0).toLocaleString()}</b></div>
              <div>🌟 伝説魚: <b style={{ color:'#fbbf24' }}>{(player.fishingLegendaryCount ?? 0)}匹</b></div>
              <div>⚖️ 総重量: <b style={{ color:'#e2e8f0' }}>{(player.fishingTotalWeightKg ?? 0).toLocaleString()}kg</b></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
