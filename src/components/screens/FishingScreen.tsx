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
import { postBoardMessage, tryRecordWorldFirstFish, getAllWorldFirstFish } from '../../services/multiplayer';

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
  const baitRarity  = bait?.rarityBonus  ?? 0;
  const baitSize    = bait?.sizeBonus    ?? 0;
  const baitExp     = bait?.expBonus     ?? 0;
  const totalRarity = bonuses.rarityBonus + rodRarityBonus + baitRarity + weather.rarityBonus;
  const totalLarge  = bonuses.largeFishBonus + rodLargeBonus;
  const totalLegend = bonuses.legendaryBonus;

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
type Tab = 'fish' | 'book' | 'rod' | 'bait' | 'spot' | 'title' | 'rank' | 'shop';

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
  const savePlayer        = useGameStore((s: any) => s.savePlayer);
  const selectFishingSpot = useGameStore((s: any) => s.selectFishingSpot);
  const equipBait         = useGameStore((s: any) => s.equipBait);
  const useBait           = useGameStore((s: any) => s.useBait);
  const enhanceRod        = useGameStore((s: any) => s.enhanceRod);
  const spendFishCoin     = useGameStore((s: any) => s.spendFishCoin);
  const checkFishingAchievements = useGameStore((s: any) => s.checkFishingAchievements);

  const weather = getCurrentWeather();
  const season  = getCurrentSeason();
  const activeEvents = getActiveEventIds();
  const [worldFirsts, setWorldFirsts] = useState<Record<string, { uid: string; displayName: string; caughtAt: number }>>({});

  const [tab, setTab] = useState<Tab>('fish');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [casting, setCasting] = useState(false);
  const [autoFish, setAutoFish] = useState(false);
  const autoRef = useRef(false);
  const cdRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const expPct  = fishingLevel >= 100 ? 100 : Math.floor(fishingExp / expReq * 100);
  const bookCount = Object.keys(fishBook).length;
  const bookPct   = Math.floor(bookCount / TOTAL_FISH * 100);
  const staminaCost = spot.staminaCost;
  const cdMs    = spot.cooldownMs;

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
    if (!player || cooldown > 0 || casting) return;
    if ((player.stats.satiety ?? 0) < staminaCost) {
      addNotification('warning', '満腹度が足りません！');
      autoRef.current = false; setAutoFish(false); return;
    }
    setCasting(true);
    setTimeout(() => setCasting(false), 500);
    changeSatiety(-staminaCost);

    const buffBonus = getActiveBuffBonus('fishing');
    const result = tryCatch(fishingLevel, rod, enhLv, bait, spot, buffBonus, fishBook, weather, season, activeEvents);

    if (bait && equippedBaitId) useBait();

    const oldLv = fishingLevel;
    if (result) {
      addFishingExp(result.exp);
      const coinEarned = fishCoinReward(result.fish.rarity, weather);
      recordCatch(result.fish.id, result.sizeCm, result.weightKg, result.sellPrice, coinEarned);
      changeGold(result.sellPrice);
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
      const sizeLabel  = result.sizeCm >= result.fish.maxSizeCm * 0.95 ? ' 🏆最大級!' : '';
      const newLabel   = result.isNew ? ' ✨初図鑑!' : result.isRecord ? ' 📏記録更新!' : '';
      addLog(
        `${result.fish.icon} ${result.fish.name} ${result.sizeCm}cm/${result.weightKg}kg +${result.sellPrice}G +${result.exp}EXP${sizeLabel}${newLabel}`,
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
        addNotification('success', `🎣 釣りLvUP! Lv${newLv}！`);
        const m = FISHING_LEVEL_BONUSES.find(b => b.level === newLv);
        if (m) addNotification('info', `🎁 特典: ${m.description}`);
      }
      checkFishingAchievements();
    }, 150);

    savePlayer();
    setCooldown(cdMs);
  }, [player, cooldown, casting, staminaCost, cdMs, rod, enhLv, bait, spot, equippedBaitId, fishingLevel, fishBook, getActiveBuffBonus, addFishingExp, recordCatch, addItems, changeGold, changeSatiety, addNotification, addLog, savePlayer, useBait, checkFishingAchievements, weather, season, activeEvents]);

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
            <div style={{ fontSize:22, fontWeight:'bold' }}>Lv {fishingLevel}</div>
            <div style={{ fontSize:11, opacity:0.8 }}>{fishingLevel < 100 ? `${fishingExp}/${expReq} EXP` : 'MAX'}</div>
          </div>
        </div>
        {fishingLevel < 100 && (
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
        </div>
      </div>

      {/* tabs */}
      <div style={{ display:'flex', gap:3, marginBottom:10, flexWrap:'wrap' }}>
        {(['fish','book','rod','bait','spot','shop','title','rank'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...S.btn(tab===t), flex:'1 1 auto', padding:'6px 4px', fontSize:11 }}>
            {t==='fish'?'🎣釣り':t==='book'?'📖図鑑':t==='rod'?'🎣竿':t==='bait'?'🪱餌':t==='spot'?'📍場所':t==='shop'?'🐟交換所':t==='title'?'⭐称号':'🏆ランク'}
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
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                      レア+{Math.round((r.rarityBonus + eLv*0.01)*100)}% 大型+{Math.round((r.largeFishBonus + eLv*0.005)*100)}% EXP×{(r.expMult + eLv*0.02).toFixed(2)} Lv{r.minLevel}+
                    </div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{r.obtainHint}</div>
                    {owned && eLv < 20 && (
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                        次の強化成功率: {Math.round(successRate*100)}% (+{eLv}→+{eLv+1})
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {owned && !equipped && <button onClick={() => equipRod(rid)} style={S.btn()}>装備</button>}
                    {owned && eLv < 20 && (
                      <button onClick={() => { enhanceRod(rid); checkFishingAchievements(); savePlayer(); }} style={{ ...S.btn(), background:'#854d0e', fontSize:11 }}>
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
                  {unlocked && !selected && <button onClick={() => { selectFishingSpot(sid); savePlayer(); }} style={S.btn()}>選択</button>}
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
          </div>
          {FISH_COIN_SHOP.map(item => {
            const can = (player.fishCoin ?? 0) >= item.cost;
            return (
              <div key={item.id} style={{ ...S.card, display:'flex', gap:10, alignItems:'center', opacity: can ? 1 : 0.6 }}>
                <div style={{ fontSize:22 }}>{item.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:'bold', color:'#e2e8f0', fontSize:13 }}>{item.name}</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>{item.description}</div>
                </div>
                <button
                  onClick={() => {
                    if (!spendFishCoin(item.cost)) return;
                    addItems([{ itemId: item.grantItemId, amount: item.grantAmount }]);
                    addNotification('success', `${item.icon} ${item.name} と交換した！`);
                    savePlayer();
                  }}
                  disabled={!can}
                  style={{ ...S.btn(), background: can ? '#0ea5e9' : '#374151', cursor: can ? 'pointer' : 'not-allowed' }}
                >
                  {item.cost} Coin
                </button>
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

      {/* ─── ランキングタブ ─── */}
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
