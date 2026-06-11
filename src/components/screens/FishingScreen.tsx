// src/components/screens/FishingScreen.tsx
// 釣りシステム v2 – 全面改修

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  FISH_MASTER, FISH_IDS, calcWeight, calcFishSellPrice,
  getFishingBonuses, fishingExpRequired, RARITY_COLOR, RARITY_LABEL,
  FISHING_LEVEL_BONUSES,
} from '../../data/fishMasters';
import type { FishMaster } from '../../data/fishMasters';
import { ITEM_MASTER } from '../../data/masters';

// ─── 釣り竿の種類 ───────────────────────────────────────────────
interface RodConfig {
  id: string;
  label: string;
  rarityBonus: number;   // 追加レア率
  legendBonus: number;   // 伝説魚追加率
  cooldownMs: number;
  minLevel: number;
  staminaCost: number;
}
const ROD_CONFIGS: Record<string, RodConfig> = {
  basic_rod:    { id: 'basic_rod',    label: '基本の釣り竿',    rarityBonus: 0,    legendBonus: 0,     cooldownMs: 5000, minLevel: 1,  staminaCost: 4 },
  ore_rod:      { id: 'ore_rod',      label: '鉱石ロッド',      rarityBonus: 0.02, legendBonus: 0,     cooldownMs: 4500, minLevel: 5,  staminaCost: 4 },
  all_rod_x:    { id: 'all_rod_x',    label: 'オールロッドX',   rarityBonus: 0.05, legendBonus: 0.005, cooldownMs: 4000, minLevel: 10, staminaCost: 5 },
  master_rod:   { id: 'master_rod',   label: 'マスターロッド',  rarityBonus: 0.08, legendBonus: 0.010, cooldownMs: 3500, minLevel: 20, staminaCost: 5 },
  master_rod_z: { id: 'master_rod_z', label: 'マスターロッドZ', rarityBonus: 0.12, legendBonus: 0.015, cooldownMs: 3000, minLevel: 30, staminaCost: 6 },
  ffgg_rod_r1:  { id: 'ffgg_rod_r1',  label: 'FFGGロッドR1',   rarityBonus: 0.10, legendBonus: 0.012, cooldownMs: 3500, minLevel: 15, staminaCost: 5 },
  ffgg_rod_r3:  { id: 'ffgg_rod_r3',  label: 'FFGGロッドR3',   rarityBonus: 0.15, legendBonus: 0.018, cooldownMs: 3000, minLevel: 25, staminaCost: 6 },
  ffgg_rod_r6:  { id: 'ffgg_rod_r6',  label: 'FFGGロッドR6',   rarityBonus: 0.20, legendBonus: 0.025, cooldownMs: 2500, minLevel: 40, staminaCost: 7 },
  ffggr_rod:    { id: 'ffggr_rod',    label: 'FFGGRロッド',     rarityBonus: 0.25, legendBonus: 0.035, cooldownMs: 2000, minLevel: 50, staminaCost: 8 },
};
const DEFAULT_ROD = ROD_CONFIGS['basic_rod'];

// ─── 釣り計算 ───────────────────────────────────────────────────
interface CatchResult {
  fish: FishMaster;
  sizeCm: number;
  weightKg: number;
  sellPrice: number;
  exp: number;
  isNew: boolean;
  isRecord: boolean;
}

function tryFishCatch(
  fishingLevel: number,
  rod: RodConfig,
  buffBonus: number,
  fishBook: Record<string, { maxSizeCm: number }>,
): CatchResult | null {
  const bonuses = getFishingBonuses(fishingLevel);
  const totalRarityBonus = bonuses.rarityBonus + rod.rarityBonus;
  const totalLegendBonus = bonuses.legendaryBonus * rod.legendBonus + rod.legendBonus;

  // 魚ごとの重み計算
  const pool: { fish: FishMaster; weight: number }[] = [];
  for (const id of FISH_IDS) {
    const f = FISH_MASTER[id];
    if (f.minLevel > fishingLevel) continue;
    let w = f.baseRate;
    // レア率ボーナス適用
    if (f.rarity === 'rare' || f.rarity === 'epic') w += totalRarityBonus * 0.5;
    if (f.rarity === 'legendary') w += totalLegendBonus;
    // 大型魚ボーナス (大型魚=minSizeCm >= 100)
    if (f.minSizeCm >= 100) w += bonuses.largeFishBonus * 0.3;
    w *= buffBonus;
    if (w > 0) pool.push({ fish: f, weight: w });
  }
  if (pool.length === 0) return null;

  const total = pool.reduce((s, p) => s + p.weight, 0);
  const rand = Math.random() * total;
  let acc = 0;
  let chosen = pool[0].fish;
  for (const p of pool) {
    acc += p.weight;
    if (rand <= acc) { chosen = p.fish; break; }
  }

  // サイズ決定（大型魚ボーナスで上振れあり）
  const sizeRange = chosen.maxSizeCm - chosen.minSizeCm;
  let sizeRoll = Math.random();
  if (bonuses.largeFishBonus > 0 && chosen.minSizeCm >= 50) {
    sizeRoll = Math.max(sizeRoll, Math.random() * bonuses.largeFishBonus + sizeRoll * (1 - bonuses.largeFishBonus));
  }
  const sizeCm = Math.round(chosen.minSizeCm + sizeRange * sizeRoll);
  const weightKg = calcWeight(chosen, sizeCm);
  const sellPrice = calcFishSellPrice(chosen, sizeCm);
  const exp = chosen.baseExp + Math.floor(sizeCm / chosen.maxSizeCm * chosen.baseExp);

  const isNew = !fishBook[chosen.id];
  const isRecord = !isNew && sizeCm > (fishBook[chosen.id]?.maxSizeCm ?? 0);

  return { fish: chosen, sizeCm, weightKg, sellPrice, exp, isNew, isRecord };
}

// ─── ログエントリ ───────────────────────────────────────────────
interface LogEntry {
  id: number;
  message: string;
  rarity?: string;
  color?: string;
}

let logCounter = 0;

// ─── メインコンポーネント ───────────────────────────────────────
type Tab = 'fish' | 'book' | 'rod' | 'level';

export function FishingScreen() {
  const player = useGameStore((s: any) => s.player);
  const addItems = useGameStore((s: any) => s.addItems);
  const changeSatiety = useGameStore((s: any) => s.changeSatiety);
  const changeGold = useGameStore((s: any) => s.changeGold);
  const addNotification = useGameStore((s: any) => s.addNotification);
  const equipRod = useGameStore((s: any) => s.equipRod);
  const addFishingExp = useGameStore((s: any) => s.addFishingExp);
  const recordCatch = useGameStore((s: any) => s.recordCatch);
  const getActiveBuffBonus = useGameStore((s: any) => s.getActiveBuffBonus);
  const savePlayer = useGameStore((s: any) => s.savePlayer);

  const [tab, setTab] = useState<Tab>('fish');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [isFishing, setIsFishing] = useState(false);
  const [casting, setCasting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoFish, setAutoFish] = useState(false);
  const autoFishRef = useRef(false);

  const fishingLevel = player?.fishingLevel ?? 1;
  const fishingExp = player?.fishingExp ?? 0;
  const fishBook = player?.fishBook ?? {};
  const equippedRodId = player?.equippedRodId ?? 'basic_rod';
  const rod = ROD_CONFIGS[equippedRodId] ?? DEFAULT_ROD;
  const expRequired = fishingExpRequired(fishingLevel);
  const expPct = fishingLevel >= 100 ? 100 : Math.floor((fishingExp / expRequired) * 100);
  const bookCount = Object.keys(fishBook).length;
  const totalFish = Object.keys(FISH_MASTER).length;
  const bookPct = Math.floor((bookCount / totalFish) * 100);

  // クールダウンタイマー
  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((prev: number) => {
        const next = prev - 100;
        if (next <= 0) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cooldown]);

  const addLog = useCallback((msg: string, rarity?: string, color?: string) => {
    const entry: LogEntry = { id: ++logCounter, message: msg, rarity, color };
    setLog((prev: LogEntry[]) => [entry, ...prev].slice(0, 30));
  }, []);

  const doFish = useCallback(() => {
    if (!player || cooldown > 0 || isFishing) return;
    if ((player.stats.satiety ?? 0) < rod.staminaCost) {
      addNotification('warning', '満腹度が足りません！');
      autoFishRef.current = false;
      setAutoFish(false);
      return;
    }

    setIsFishing(true);
    setCasting(true);
    setTimeout(() => setCasting(false), 600);

    const buffBonus = getActiveBuffBonus('fishing');
    const result = tryFishCatch(fishingLevel, rod, buffBonus, fishBook);

    changeSatiety(-rod.staminaCost);

    if (result) {
      addFishingExp(result.exp);
      recordCatch(result.fish.id, result.sizeCm, result.weightKg);
      // インベントリには魚アイテムを追加（既存アイテムIDに合わせてマッピング）
      const fishItemMap: Record<string, string> = {
        iwashi: 'raw_cod', aji: 'raw_cod', fugu: 'pufferfish', tai: 'raw_salmon',
        sake: 'raw_salmon', buri: 'raw_salmon', hirame: 'raw_cod', tako: 'raw_cod',
        maguro: 'hoshi_tuna', katsuo: 'hoshi_tuna', shark: 'brilliant_salmon',
        ika: 'brilliant_salmon', ryujin_sea_bass: 'arowanna', golden_carp: 'arowanna',
        deep_whale: 'arowanna', ryujin: 'arowanna', phantom_tuna: 'hoshi_tuna',
        sea_god: 'arowanna', infinity_fish: 'arowanna',
      };
      const itemId = fishItemMap[result.fish.id] ?? 'raw_cod';
      addItems([{ itemId, amount: 1 }]);
      changeGold(result.sellPrice);

      const isLegendary = result.fish.rarity === 'legendary';
      const isEpic = result.fish.rarity === 'epic';
      const sizeLabel = result.sizeCm >= result.fish.maxSizeCm * 0.95 ? ' 🏆最大級!' : '';
      const newLabel = result.isNew ? ' ✨初図鑑登録!' : result.isRecord ? ' 📏自己記録更新!' : '';
      const color = RARITY_COLOR[result.fish.rarity];
      addLog(
        `${result.fish.icon} ${result.fish.name} ${result.sizeCm}cm / ${result.weightKg}kg +${result.sellPrice}G +${result.exp}EXP${sizeLabel}${newLabel}`,
        RARITY_LABEL[result.fish.rarity],
        color,
      );
      if (isLegendary) addNotification('success', `🌟 伝説の魚「${result.fish.name}」を釣り上げた！`);
      else if (isEpic) addNotification('success', `✨ エピック「${result.fish.name}」を釣り上げた！`);
      if (result.isNew) addNotification('info', `📖 魚図鑑に「${result.fish.name}」を初登録！`);
    } else {
      addLog('…ボーズ。何も釣れなかった。', undefined, '#6b7280');
    }

    // レベルアップ通知 (簡易チェック)
    const oldLv = fishingLevel;
    setTimeout(() => {
      const newLv = useGameStore.getState().player?.fishingLevel ?? 1;
      if (newLv > oldLv) {
        addNotification('success', `🎣 釣りレベルアップ！ Lv${newLv} になった！`);
        const bonusMilestone = FISHING_LEVEL_BONUSES.find(b => b.level === newLv);
        if (bonusMilestone) addNotification('info', `🎁 特典解放: ${bonusMilestone.description}`);
      }
    }, 100);

    savePlayer();
    setIsFishing(false);
    setCooldown(rod.cooldownMs);
  }, [player, cooldown, isFishing, rod, fishingLevel, fishBook, getActiveBuffBonus, addFishingExp, recordCatch, addItems, changeGold, changeSatiety, addNotification, addLog, savePlayer]);

  // 自動釣り
  useEffect(() => {
    autoFishRef.current = autoFish;
  }, [autoFish]);

  useEffect(() => {
    if (!autoFish) return;
    const schedule = () => {
      if (!autoFishRef.current) return;
      autoRef.current = setTimeout(() => {
        doFish();
        if (autoFishRef.current) schedule();
      }, rod.cooldownMs + 200);
    };
    schedule();
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
  }, [autoFish, rod.cooldownMs, doFish]);

  if (!player) return null;

  const bonuses = getFishingBonuses(fishingLevel);

  // ─── タブUI ─────────────────────────────────────────────────
  return (
    <div style={{ padding: '12px', maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif' }}>
      {/* ヘッダー */}
      <div style={{ background: 'linear-gradient(135deg,#0f4c81,#1a7db5)', borderRadius: 12, padding: '12px 16px', marginBottom: 12, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>🎣 釣りシステム</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>装備中: {rod.label}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>Lv {fishingLevel}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {fishingLevel >= 100 ? 'MAX' : `${fishingExp} / ${expRequired} EXP`}
            </div>
          </div>
        </div>
        {fishingLevel < 100 && (
          <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${expPct}%`, height: '100%', background: '#7dd3fc', transition: 'width 0.3s' }} />
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
          図鑑: {bookCount}/{totalFish} ({bookPct}%) | 総釣果: {(player.fishingTotalCount ?? 0).toLocaleString()}匹
        </div>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['fish', 'book', 'rod', 'level'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold',
            background: tab === t ? '#1a7db5' : '#1e293b', color: tab === t ? '#fff' : '#94a3b8',
          }}>
            {t === 'fish' ? '🎣 釣り' : t === 'book' ? '📖 図鑑' : t === 'rod' ? '🪄 竿' : '⭐ レベル'}
          </button>
        ))}
      </div>

      {/* ─── 釣りタブ ─── */}
      {tab === 'fish' && (
        <div>
          {/* 釣りボタン */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <button
              onClick={doFish}
              disabled={cooldown > 0 || isFishing}
              style={{
                width: '100%', padding: '16px', fontSize: 20, fontWeight: 'bold',
                borderRadius: 12, border: 'none', cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                background: casting ? '#f59e0b' : cooldown > 0 ? '#374151' : 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                color: '#fff', transition: 'all 0.15s',
                transform: casting ? 'scale(0.97)' : 'scale(1)',
              }}>
              {casting ? '🌊 キャスト中…' : cooldown > 0 ? `⏳ ${(cooldown / 1000).toFixed(1)}s` : '🎣 釣る'}
            </button>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => setAutoFish((v: boolean) => !v)} style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
                background: autoFish ? '#dc2626' : '#0f4c81', color: '#fff',
              }}>
                {autoFish ? '⏹ 自動停止' : '▶ 自動釣り'}
              </button>
              <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: '28px' }}>
                満腹度: {player.stats.satiety ?? 0} | コスト: {rod.staminaCost}
              </span>
            </div>
          </div>

          {/* クールダウンバー */}
          {cooldown > 0 && (
            <div style={{ background: '#1e293b', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                width: `${(1 - cooldown / rod.cooldownMs) * 100}%`,
                height: '100%', background: '#0ea5e9', transition: 'width 0.1s linear',
              }} />
            </div>
          )}

          {/* ログ */}
          <div style={{ background: '#0f172a', borderRadius: 10, padding: 10, minHeight: 200, maxHeight: 320, overflowY: 'auto' }}>
            {log.length === 0 && (
              <div style={{ color: '#475569', textAlign: 'center', marginTop: 60, fontSize: 14 }}>
                🎣 竿を投げて魚を釣ろう！
              </div>
            )}
            {log.map((entry: LogEntry) => (
              <div key={entry.id} style={{ marginBottom: 4, fontSize: 13, lineHeight: 1.4 }}>
                {entry.rarity && (
                  <span style={{ color: entry.color, fontWeight: 'bold', marginRight: 4, fontSize: 11 }}>
                    [{entry.rarity}]
                  </span>
                )}
                <span style={{ color: entry.color ?? '#cbd5e1' }}>{entry.message}</span>
              </div>
            ))}
          </div>

          {/* ステータス */}
          <div style={{ marginTop: 10, background: '#1e293b', borderRadius: 10, padding: 10, fontSize: 12, color: '#94a3b8' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div>📏 最大サイズ: <b style={{ color: '#e2e8f0' }}>{player.fishingMaxSizeCm ?? 0}cm</b></div>
              <div>⚖️ 最大重量: <b style={{ color: '#e2e8f0' }}>{player.fishingMaxWeightKg ?? 0}kg</b></div>
              <div>🎣 竿レベル制限: <b style={{ color: '#e2e8f0' }}>Lv{rod.minLevel}+</b></div>
              <div>⏱ クールダウン: <b style={{ color: '#e2e8f0' }}>{rod.cooldownMs / 1000}s</b></div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 図鑑タブ ─── */}
      {tab === 'book' && (
        <div>
          <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#e2e8f0' }}>📖 魚図鑑</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fbbf24' }}>{bookCount}/{totalFish}<span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>({bookPct}%)</span></div>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {Object.values(FISH_MASTER).map(fish => {
              const entry = fishBook[fish.id];
              const caught = !!entry;
              return (
                <div key={fish.id} style={{
                  background: caught ? '#1e293b' : '#0f172a',
                  border: `1px solid ${caught ? RARITY_COLOR[fish.rarity] + '44' : '#1e293b'}`,
                  borderRadius: 8, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  opacity: caught ? 1 : 0.5,
                }}>
                  <div style={{ fontSize: 24, width: 32, textAlign: 'center' }}>
                    {caught ? fish.icon : '❓'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: 14 }}>
                        {caught ? fish.name : '???'}
                      </span>
                      <span style={{ fontSize: 11, color: RARITY_COLOR[fish.rarity], fontWeight: 'bold' }}>
                        {RARITY_LABEL[fish.rarity]}
                      </span>
                    </div>
                    {caught ? (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        最大 {entry.maxSizeCm}cm / {entry.maxWeightKg}kg | {entry.totalCaught}匹獲得 |
                        初回: {new Date(entry.firstCaughtAt).toLocaleDateString('ja-JP')}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: '#475569' }}>Lv{fish.minLevel}~ 未発見</div>
                    )}
                  </div>
                  {caught && (
                    <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>
                      <div>範囲</div>
                      <div>{fish.minSizeCm}~{fish.maxSizeCm}cm</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 釣り竿タブ ─── */}
      {tab === 'rod' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {Object.values(ROD_CONFIGS).map(r => {
            const owned = (player.inventory[r.id] ?? 0) > 0;
            const equipped = equippedRodId === r.id;
            const itemMaster = ITEM_MASTER[r.id];
            return (
              <div key={r.id} style={{
                background: equipped ? '#0f4c81' : '#1e293b',
                border: equipped ? '1px solid #0ea5e9' : '1px solid #334155',
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: owned ? 1 : 0.5,
              }}>
                <div style={{ fontSize: 22 }}>🎣</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: 14 }}>
                    {r.label}
                    {equipped && <span style={{ marginLeft: 6, fontSize: 11, color: '#7dd3fc', fontWeight: 'normal' }}>装備中</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    レア+{Math.round(r.rarityBonus * 100)}% | 伝説+{Math.round(r.legendBonus * 100)}% | CD {r.cooldownMs / 1000}s | Lv{r.minLevel}+ | 所持:{player.inventory[r.id] ?? 0}
                  </div>
                  {itemMaster && <div style={{ fontSize: 11, color: '#64748b' }}>{itemMaster.description}</div>}
                </div>
                {owned && !equipped && (
                  <button onClick={() => equipRod(r.id)} style={{
                    padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: '#0ea5e9', color: '#fff', fontSize: 12, fontWeight: 'bold',
                  }}>装備</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── レベル特典タブ ─── */}
      {tab === 'level' && (
        <div>
          <div style={{ background: '#1e293b', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 8 }}>現在のボーナス</div>
            <div style={{ fontSize: 13, color: '#94a3b8', display: 'grid', gap: 4 }}>
              <div>📈 レア率 +{Math.round(bonuses.rarityBonus * 100)}%</div>
              <div>🐋 大型魚率 +{Math.round(bonuses.largeFishBonus * 100)}%</div>
              <div>🌟 伝説魚率 +{Math.round(bonuses.legendaryBonus * 100)}%</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {FISHING_LEVEL_BONUSES.map(bonus => {
              const unlocked = fishingLevel >= bonus.level;
              return (
                <div key={bonus.level} style={{
                  background: unlocked ? '#1e293b' : '#0f172a',
                  border: `1px solid ${unlocked ? '#0ea5e9' : '#1e293b'}`,
                  borderRadius: 8, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ fontSize: 20 }}>{unlocked ? '✅' : '🔒'}</div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: unlocked ? '#7dd3fc' : '#475569' }}>
                      Lv{bonus.level} 特典
                    </div>
                    <div style={{ fontSize: 13, color: unlocked ? '#e2e8f0' : '#475569' }}>
                      {bonus.description}
                    </div>
                  </div>
                  {!unlocked && (
                    <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
                      あと{bonus.level - fishingLevel}Lv
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* 経験値テーブル */}
          <div style={{ marginTop: 14, background: '#1e293b', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 8 }}>次のレベルまで</div>
            {fishingLevel < 100 ? (
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                現在: {fishingExp.toLocaleString()} EXP / 必要: {expRequired.toLocaleString()} EXP
                <div style={{ marginTop: 6, background: '#0f172a', borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${expPct}%`, height: '100%', background: '#0ea5e9', borderRadius: 4 }} />
                </div>
                <div style={{ marginTop: 4 }}>残り: {(expRequired - fishingExp).toLocaleString()} EXP</div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#fbbf24', fontWeight: 'bold' }}>🏆 最大レベル達成！</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
