// src/components/combat/CombatFx.tsx
// 武器固有の戦闘エフェクト — 各 element ごとに完全に異なる見た目で実装

import { FX_ELEMENT_COLORS, type FxElement } from '../../data/weaponEffectMap';
import type { FxInstance } from './useCombatFx';

let _injected = false;
function ensureCombatFxStyles() {
  if (_injected || typeof document === 'undefined') return;
  _injected = true;
  const style = document.createElement('style');
  style.textContent = `
/* ── 汎用アニメーション ── */
@keyframes cfx-slash   { 0%{opacity:0;transform:scaleX(0.1) skewX(-10deg)} 30%{opacity:1;transform:scaleX(1) skewX(-10deg)} 100%{opacity:0;transform:scaleX(1.1) skewX(-10deg)} }
@keyframes cfx-flash   { 0%{opacity:0} 18%{opacity:0.92} 100%{opacity:0} }
@keyframes cfx-pop     { 0%{opacity:0;transform:scale(0.5)} 40%{opacity:1;transform:scale(1.12)} 100%{opacity:0;transform:scale(1)} }
@keyframes cfx-ring    { 0%{opacity:0.9;transform:scale(0.3)} 100%{opacity:0;transform:scale(1.7)} }
@keyframes cfx-rise    { 0%{opacity:0;transform:translateY(0) scale(0.6)} 30%{opacity:1} 100%{opacity:0;transform:translateY(-16px) scale(1.15)} }
@keyframes cfx-beam    { 0%{opacity:0;transform:scaleX(0);transform-origin:left} 28%{opacity:1;transform:scaleX(1);transform-origin:left} 100%{opacity:0;transform:scaleX(1);transform-origin:left} }
@keyframes cfx-pulse   { 0%,100%{opacity:0.2} 50%{opacity:0.85} }
@keyframes cfx-expand  { 0%{opacity:0.8;transform:scale(0.2)} 100%{opacity:0;transform:scale(1.8)} }
@keyframes cfx-drip    { 0%{opacity:0;transform:translateY(-4px)} 30%{opacity:1} 100%{opacity:0.1;transform:translateY(10px)} }
@keyframes cfx-spin    { 0%{transform:rotate(0deg);opacity:0.9} 100%{transform:rotate(360deg);opacity:0} }
@keyframes cfx-shake   { 0%{transform:translate(0,0)} 20%{transform:translate(-2px,1px)} 40%{transform:translate(2px,-1px)} 60%{transform:translate(-1px,1px)} 80%{transform:translate(1px,-1px)} 100%{transform:translate(0,0)} }
@keyframes cfx-shake-crit { 0%{transform:translate(0,0)} 12%{transform:translate(-6px,3px)} 24%{transform:translate(6px,-4px)} 36%{transform:translate(-5px,3px)} 48%{transform:translate(5px,-3px)} 60%{transform:translate(-3px,2px)} 75%{transform:translate(2px,-1px)} 100%{transform:translate(0,0)} }
@keyframes cfx-crit-flash { 0%{opacity:0} 12%{opacity:0.5} 100%{opacity:0} }
@keyframes cfx-flicker { 0%{opacity:0} 10%{opacity:0.95} 25%{opacity:0.3} 40%{opacity:0.9} 60%{opacity:0.2} 80%{opacity:0.85} 100%{opacity:0} }
@keyframes cfx-freeze  { 0%{opacity:0;transform:scale(0.7)} 40%{opacity:1;transform:scale(1)} 70%{opacity:0.85} 100%{opacity:0;transform:scale(1.05)} }
@keyframes cfx-glow    { 0%{opacity:0;box-shadow:none} 35%{opacity:1} 100%{opacity:0} }
@keyframes cfx-hit-recoil { 0%{transform:scale(1) translateX(0)} 25%{transform:scale(0.88) translateX(-4px)} 55%{transform:scale(1.04) translateX(2px)} 100%{transform:scale(1) translateX(0)} }
@keyframes cfx-combo-pop { 0%{opacity:0;transform:scale(0.4) translateY(6px)} 35%{opacity:1;transform:scale(1.25) translateY(-4px)} 70%{transform:scale(1) translateY(-8px)} 100%{opacity:0;transform:scale(1) translateY(-18px)} }
@keyframes cfx-boss-defeat-flash { 0%{opacity:0} 8%{opacity:1} 35%{opacity:0.85} 100%{opacity:0} }
@keyframes cfx-slowmo-ring { 0%{opacity:0.95;transform:scale(0.2)} 100%{opacity:0;transform:scale(3.2)} }
@keyframes cfx-ultimate-cutin { 0%{opacity:0;transform:scale(0.7) translateY(8px)} 14%{opacity:1;transform:scale(1.04) translateY(0)} 80%{opacity:1;transform:scale(1) translateY(0)} 100%{opacity:0;transform:scale(1.05) translateY(-6px)} }
.combatfx-shake { animation: cfx-shake 0.26s ease-in-out; }
.combatfx-shake-crit { animation: cfx-shake-crit 0.42s ease-in-out; }
.combatfx-hit-punch { animation: cfx-hit-recoil 0.32s ease-out; }
`;
  document.head.appendChild(style);
}

// ============================================================
// 各エレメント固有レイヤー
// ============================================================

function PhysicalLayer({ intensity, seed }: { intensity: string; seed: number }) {
  const big = intensity !== 'normal';
  const huge = intensity === 'critical';
  const dur = huge ? 0.52 : big ? 0.40 : 0.32;
  return (
    <>
      {/* 斜め斬撃線 × 1〜2本 */}
      {[0, ...(big ? [1] : [])].map(n => (
        <div key={n} style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(${105 + n * 12}deg, transparent 28%, rgba(232,230,255,0.15) 44%, #e8e6ff ${50 + n}%, rgba(232,230,255,0.15) 56%, transparent 72%)`,
          animation: `cfx-slash ${dur}s ease-out`,
          animationDelay: `${n * 0.06 + seed * 0.02}s`,
          mixBlendMode: 'screen',
        }} />
      ))}
      {/* 白いヒットフラッシュ */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none',
        background: 'rgba(220,220,255,0.35)',
        animation: `cfx-flash ${big ? 0.38 : 0.26}s ease-out`,
      }} />
      {/* 金属光点 */}
      {Array.from({ length: huge ? 5 : big ? 3 : 1 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${20 + i * 18}%`, top: `${35 + (i % 2) * 20}%`,
          width: 4, height: 4, borderRadius: '50%',
          background: '#e8e6ff', boxShadow: '0 0 5px rgba(232,230,255,0.8)',
          animation: `cfx-rise 0.45s ease-out`, animationDelay: `${i * 0.04}s`,
        }} />
      ))}
    </>
  );
}

function DarkLayer({ intensity, seed }: { intensity: string; seed: number }) {
  const big = intensity !== 'normal';
  const huge = intensity === 'critical';
  return (
    <>
      {/* 紫黒の渦スラッシュ */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(110deg, transparent 20%, rgba(106,63,181,0.12) 38%, rgba(106,63,181,0.55) 50%, rgba(26,15,46,0.4) 58%, transparent 75%)`,
        animation: `cfx-slash ${huge ? 0.56 : big ? 0.44 : 0.36}s ease-out`,
        animationDelay: `${seed * 0.025}s`,
        mixBlendMode: 'screen',
      }} />
      {/* 影の残像 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none',
        background: 'rgba(40,10,70,0.45)',
        animation: `cfx-flash ${big ? 0.5 : 0.35}s ease-out`,
      }} />
      {/* 紫粒子 */}
      {Array.from({ length: huge ? 6 : big ? 4 : 2 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${12 + i * 15}%`, top: `${30 + (i % 3) * 18}%`,
          width: huge ? 5 : 3, height: huge ? 5 : 3, borderRadius: '50%',
          background: '#9b5fe0', boxShadow: '0 0 7px rgba(155,95,224,0.9)',
          animation: `cfx-rise ${0.5 + i * 0.05}s ease-out`, animationDelay: `${i * 0.04}s`,
        }} />
      ))}
      {/* 闇の輪 */}
      {big && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%', width: huge ? 44 : 30, height: huge ? 44 : 30,
          marginLeft: huge ? -22 : -15, marginTop: huge ? -22 : -15,
          borderRadius: '50%', border: '2px solid rgba(106,63,181,0.7)',
          boxShadow: '0 0 10px rgba(106,63,181,0.6)',
          animation: 'cfx-expand 0.5s ease-out', pointerEvents: 'none',
        }} />
      )}
    </>
  );
}

function FireLayer({ intensity, seed }: { intensity: string; seed: number }) {
  const big = intensity !== 'normal';
  const huge = intensity === 'critical';
  return (
    <>
      {/* 炎スラッシュ */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(108deg, transparent 18%, rgba(255,80,20,0.08) 35%, rgba(255,120,50,0.6) 48%, rgba(255,200,80,0.5) 52%, rgba(255,80,20,0.08) 65%, transparent 82%)`,
        animation: `cfx-slash ${huge ? 0.58 : big ? 0.46 : 0.36}s ease-out`,
        animationDelay: `${seed * 0.02}s`,
        mixBlendMode: 'screen',
        filter: 'blur(0.5px)',
      }} />
      {/* 熱波フラッシュ */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none',
        background: 'rgba(255,90,20,0.28)',
        animation: `cfx-flicker ${big ? 0.55 : 0.38}s ease-out`,
      }} />
      {/* 火の粉 */}
      {Array.from({ length: huge ? 8 : big ? 5 : 3 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${10 + i * 12}%`, top: `${20 + (i % 3) * 22}%`,
          width: huge ? 6 : 4, height: huge ? 6 : 4, borderRadius: '50%',
          background: i % 2 === 0 ? '#ff6a3d' : '#ffb84d',
          boxShadow: `0 0 8px ${i % 2 === 0 ? 'rgba(255,106,61,0.9)' : 'rgba(255,184,77,0.8)'}`,
          animation: `cfx-rise ${0.4 + i * 0.06}s ease-out`, animationDelay: `${i * 0.03}s`,
        }} />
      ))}
      {/* 炎の輪 */}
      {big && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%', width: huge ? 50 : 34, height: huge ? 50 : 34,
          marginLeft: huge ? -25 : -17, marginTop: huge ? -25 : -17,
          borderRadius: '50%', border: `2px solid rgba(255,140,40,0.7)`,
          boxShadow: '0 0 14px rgba(255,100,20,0.7)',
          animation: 'cfx-expand 0.55s ease-out', pointerEvents: 'none',
        }} />
      )}
    </>
  );
}

function IceLayer({ intensity, seed }: { intensity: string; seed: number }) {
  const big = intensity !== 'normal';
  const huge = intensity === 'critical';
  return (
    <>
      {/* 氷結スラッシュ */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(102deg, transparent 22%, rgba(127,214,255,0.1) 38%, rgba(180,240,255,0.65) 49%, rgba(232,249,255,0.5) 52%, rgba(127,214,255,0.1) 64%, transparent 80%)`,
        animation: `cfx-freeze ${huge ? 0.60 : big ? 0.48 : 0.36}s ease-out`,
        animationDelay: `${seed * 0.02}s`,
        mixBlendMode: 'screen',
        filter: 'blur(0.4px)',
      }} />
      {/* 冷気フラッシュ */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none',
        background: 'rgba(100,200,255,0.22)',
        animation: `cfx-flash ${big ? 0.44 : 0.30}s ease-out`,
      }} />
      {/* 霜粒子 */}
      {Array.from({ length: huge ? 7 : big ? 4 : 2 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${8 + i * 14}%`, top: `${25 + (i % 3) * 20}%`,
          width: huge ? 5 : 3, height: huge ? 7 : 4, borderRadius: 1,
          background: '#c8f4ff', boxShadow: '0 0 6px rgba(127,214,255,0.9)',
          animation: `cfx-rise ${0.48 + i * 0.05}s ease-out`, animationDelay: `${i * 0.04}s`,
          transform: `rotate(${i * 22}deg)`,
        }} />
      ))}
      {/* 氷の輪 */}
      {big && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%', width: huge ? 48 : 32, height: huge ? 48 : 32,
          marginLeft: huge ? -24 : -16, marginTop: huge ? -24 : -16,
          borderRadius: '50%', border: '1.5px solid rgba(180,240,255,0.75)',
          boxShadow: '0 0 12px rgba(127,214,255,0.65)',
          animation: 'cfx-expand 0.5s ease-out', pointerEvents: 'none',
        }} />
      )}
    </>
  );
}

function LightLayer({ intensity, seed }: { intensity: string; seed: number }) {
  const big = intensity !== 'normal';
  const huge = intensity === 'critical';
  return (
    <>
      {/* 白銀のビーム/スラッシュ */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '44%', height: huge ? 5 : big ? 3 : 2,
        background: `linear-gradient(90deg, transparent, ${FX_ELEMENT_COLORS.light.main}, transparent)`,
        transformOrigin: 'left center',
        animation: `cfx-beam ${big ? 0.42 : 0.30}s ease-out`,
        animationDelay: `${seed * 0.02}s`,
        boxShadow: `0 0 ${huge ? 14 : 8}px ${FX_ELEMENT_COLORS.light.glow}`,
        pointerEvents: 'none',
      }} />
      {/* 閃光 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none',
        background: 'rgba(255,255,255,0.35)',
        animation: `cfx-flash ${big ? 0.40 : 0.26}s ease-out`,
      }} />
      {/* 光粒子 */}
      {Array.from({ length: huge ? 6 : big ? 3 : 1 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${15 + i * 15}%`, top: `${30 + (i % 2) * 25}%`,
          width: huge ? 6 : 4, height: huge ? 6 : 4, borderRadius: '50%',
          background: '#ffffff', boxShadow: '0 0 8px rgba(255,255,255,0.95)',
          animation: `cfx-rise ${0.44 + i * 0.06}s ease-out`, animationDelay: `${i * 0.05}s`,
        }} />
      ))}
    </>
  );
}

function ManaLayer({ intensity, seed }: { intensity: string; seed: number }) {
  const big = intensity !== 'normal';
  const huge = intensity === 'critical';
  return (
    <>
      {/* 蒼紫の魔法波紋 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 50%, rgba(155,109,240,0.5) 0%, transparent 70%)`,
        animation: `cfx-expand ${big ? 0.52 : 0.38}s ease-out`,
        animationDelay: `${seed * 0.025}s`,
        mixBlendMode: 'screen',
      }} />
      {/* 波紋フラッシュ */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none',
        background: 'rgba(155,109,240,0.22)',
        animation: `cfx-pulse ${big ? 0.55 : 0.38}s ease-out`,
      }} />
      {/* マナ粒子 */}
      {Array.from({ length: huge ? 7 : big ? 4 : 2 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${10 + i * 13}%`, top: `${30 + (i % 3) * 16}%`,
          width: huge ? 5 : 3, height: huge ? 5 : 3, borderRadius: '50%',
          background: '#b084f8', boxShadow: '0 0 7px rgba(155,109,240,0.9)',
          animation: `cfx-rise ${0.50 + i * 0.06}s ease-out`, animationDelay: `${i * 0.04}s`,
        }} />
      ))}
      {/* 魔法陣リング */}
      {big && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%', width: huge ? 42 : 28, height: huge ? 42 : 28,
          marginLeft: huge ? -21 : -14, marginTop: huge ? -21 : -14,
          borderRadius: '50%', border: '1.5px solid rgba(155,109,240,0.75)',
          boxShadow: '0 0 10px rgba(155,109,240,0.65)',
          animation: `cfx-spin ${huge ? 0.7 : 0.5}s ease-out`, pointerEvents: 'none',
        }} />
      )}
    </>
  );
}

function HealLayer({ intensity, seed }: { intensity: string; seed: number }) {
  const big = intensity !== 'normal';
  const huge = intensity === 'critical';
  return (
    <>
      {/* 緑光の波 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 60%, rgba(124,255,178,0.5) 0%, transparent 70%)`,
        animation: `cfx-expand ${big ? 0.55 : 0.40}s ease-out`,
        animationDelay: `${seed * 0.02}s`,
        mixBlendMode: 'screen',
      }} />
      {/* 回復フラッシュ */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none',
        background: 'rgba(80,220,120,0.20)',
        animation: `cfx-flash ${big ? 0.50 : 0.35}s ease-out`,
      }} />
      {/* 光の粒 (上昇) */}
      {Array.from({ length: huge ? 8 : big ? 5 : 3 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${8 + i * 12}%`, top: `${50 + (i % 2) * 15}%`,
          width: huge ? 5 : 3, height: huge ? 5 : 3, borderRadius: '50%',
          background: '#7CFFB2', boxShadow: '0 0 7px rgba(124,255,178,0.9)',
          animation: `cfx-rise ${0.6 + i * 0.07}s ease-out`, animationDelay: `${i * 0.06}s`,
        }} />
      ))}
    </>
  );
}

function ShieldLayer({ intensity, seed }: { intensity: string; seed: number }) {
  const big = intensity !== 'normal';
  const huge = intensity === 'critical';
  return (
    <>
      {/* 青白いバリア展開 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none',
        border: `${huge ? 3 : big ? 2 : 1.5}px solid rgba(127,196,255,0.75)`,
        boxShadow: `0 0 ${huge ? 18 : 10}px rgba(127,196,255,0.55)`,
        background: 'rgba(127,196,255,0.08)',
        animation: `cfx-glow ${big ? 0.6 : 0.45}s ease-out`,
        animationDelay: `${seed * 0.02}s`,
      }} />
      {/* バリアフラッシュ */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none',
        background: 'rgba(100,180,255,0.18)',
        animation: `cfx-flash ${big ? 0.48 : 0.32}s ease-out`,
      }} />
      {/* シールドリング */}
      {big && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%', width: huge ? 46 : 30, height: huge ? 46 : 30,
          marginLeft: huge ? -23 : -15, marginTop: huge ? -23 : -15,
          borderRadius: '50%', border: '2px solid rgba(127,196,255,0.8)',
          boxShadow: '0 0 12px rgba(127,196,255,0.6)',
          animation: 'cfx-ring 0.6s ease-out', pointerEvents: 'none',
        }} />
      )}
    </>
  );
}

// ============================================================
// 武器ID固有の追加レイヤー（特定武器だけに出る演出）
// ============================================================
function WeaponSpecificLayer({ itemId, intensity }: { itemId: string | null; intensity: string }) {
  const huge = intensity === 'critical';
  const big = intensity !== 'normal';

  switch (itemId) {
    case 'hengen':
      // 紫黒の影渦 — 変幻らしさ
      return (
        <>
          <div style={{
            position: 'absolute', left: '50%', top: '50%', width: 52, height: 52,
            marginLeft: -26, marginTop: -26, borderRadius: '50%',
            border: '2px dashed rgba(120,50,200,0.6)',
            boxShadow: '0 0 16px rgba(80,20,150,0.6)',
            animation: 'cfx-spin 0.65s ease-out', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none',
            background: 'rgba(60,10,100,0.30)',
            animation: 'cfx-pulse 0.55s ease-out',
          }} />
        </>
      );

    case 'silvers_eye':
      // 白銀レーザービーム — 横断ビームを2本
      return (
        <>
          {[0, 1].map(n => (
            <div key={n} style={{
              position: 'absolute', left: 0, right: 0, top: `${40 + n * 12}%`, height: 2,
              background: 'linear-gradient(90deg, transparent, #ffffff, rgba(200,230,255,0.8), #ffffff, transparent)',
              animation: `cfx-beam 0.35s ease-out`,
              animationDelay: `${n * 0.08}s`,
              boxShadow: '0 0 10px rgba(255,255,255,0.85)',
              pointerEvents: 'none',
            }} />
          ))}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none',
            background: 'rgba(200,230,255,0.18)',
            animation: 'cfx-flash 0.40s ease-out',
          }} />
        </>
      );

    case 'reitoumaguro':
      // 氷結強化 — 結晶の輝き
      return (
        <div style={{
          position: 'absolute', inset: '-2px', borderRadius: 8, pointerEvents: 'none',
          border: '2px solid rgba(160,240,255,0.8)',
          boxShadow: '0 0 20px rgba(127,214,255,0.7), inset 0 0 10px rgba(127,214,255,0.2)',
          animation: 'cfx-freeze 0.6s ease-out',
        }} />
      );

    case 'gyouen_no_ken':
      // 業炎 — 炎の爆発リング × 2
      return (
        <>
          {[0, 1].map(n => (
            <div key={n} style={{
              position: 'absolute', left: '50%', top: '50%',
              width: huge ? 58 + n * 12 : big ? 42 + n * 10 : 30 + n * 8,
              height: huge ? 58 + n * 12 : big ? 42 + n * 10 : 30 + n * 8,
              marginLeft: -(huge ? 29 + n * 6 : big ? 21 + n * 5 : 15 + n * 4),
              marginTop: -(huge ? 29 + n * 6 : big ? 21 + n * 5 : 15 + n * 4),
              borderRadius: '50%', border: `2px solid rgba(255,${100 + n * 40},20,0.75)`,
              boxShadow: `0 0 ${14 + n * 4}px rgba(255,90,20,0.7)`,
              animation: `cfx-expand ${0.45 + n * 0.12}s ease-out`,
              animationDelay: `${n * 0.09}s`,
              pointerEvents: 'none',
            }} />
          ))}
        </>
      );

    case 'hammer':
      // 叩きつけ衝撃波 — 横方向の衝撃線
      return (
        <div style={{
          position: 'absolute', left: '-4%', right: '-4%', top: '30%', height: big ? 5 : 3,
          background: `linear-gradient(90deg, transparent, rgba(200,200,220,0.4), rgba(232,230,255,0.9), rgba(200,200,220,0.4), transparent)`,
          animation: 'cfx-beam 0.28s ease-out',
          boxShadow: '0 0 8px rgba(200,210,255,0.6)',
          pointerEvents: 'none',
        }} />
      );

    case 'revolution_sword':
      // 貫通軌跡 — 細い光線
      return (
        <div style={{
          position: 'absolute', left: '-2%', right: '-2%', top: '48%', height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
          animation: 'cfx-beam 0.32s ease-out',
          boxShadow: '0 0 10px rgba(255,255,255,0.75)',
          pointerEvents: 'none',
        }} />
      );

    case 'netherite_sword': case 'netherite_sacrifice_staff':
      // 黒赤の熱残光
      return (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none',
          background: 'rgba(100,20,10,0.35)',
          boxShadow: 'inset 0 0 14px rgba(180,30,10,0.5)',
          animation: 'cfx-flash 0.55s ease-out',
        }} />
      );

    case 'memory_of_flower':
      // 花びら状の光パーティクル
      return (
        <>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              position: 'absolute', pointerEvents: 'none',
              left: `${20 + Math.cos(i * 1.26) * 30}%`,
              top: `${40 + Math.sin(i * 1.26) * 25}%`,
              width: 5, height: 8, borderRadius: '50% 50% 40% 40%',
              background: 'rgba(180,255,160,0.85)',
              boxShadow: '0 0 6px rgba(124,255,178,0.7)',
              animation: `cfx-rise ${0.55 + i * 0.06}s ease-out`,
              animationDelay: `${i * 0.05}s`,
              transform: `rotate(${i * 72}deg)`,
            }} />
          ))}
        </>
      );

    case 'diamond_staff':
      // マナ柱
      return (
        <div style={{
          position: 'absolute', left: '48%', top: '-4px', bottom: '-4px', width: 4, borderRadius: 2,
          background: 'linear-gradient(180deg, transparent, rgba(155,109,240,0.7), rgba(127,196,255,0.7), transparent)',
          boxShadow: '0 0 10px rgba(155,109,240,0.6)',
          animation: 'cfx-beam 0.55s ease-out',
          transformOrigin: 'top center',
          pointerEvents: 'none',
        }} />
      );

    case 'goliath_shield':
      // 厚い重いバリア波
      return (
        <div style={{
          position: 'absolute', inset: '-3px', borderRadius: 10, pointerEvents: 'none',
          border: '3px solid rgba(100,150,255,0.7)',
          boxShadow: '0 0 22px rgba(80,100,200,0.6), inset 0 0 12px rgba(60,80,180,0.2)',
          animation: 'cfx-glow 0.65s ease-out',
        }} />
      );

    case 'cave_staff2':
      // 重い衝撃波リング
      return (
        <div style={{
          position: 'absolute', left: '50%', top: '50%', width: 50, height: 50,
          marginLeft: -25, marginTop: -25,
          borderRadius: '50%', border: '2px solid rgba(80,40,180,0.65)',
          boxShadow: '0 0 14px rgba(80,40,180,0.6)',
          animation: 'cfx-expand 0.48s ease-out', pointerEvents: 'none',
        }} />
      );

    default:
      return null;
  }
}

// ============================================================
// ElementLayer ディスパッチャー
// ============================================================
function ElementLayer({ element, intensity, seed }: { element: FxElement; intensity: string; seed: number }) {
  switch (element) {
    case 'physical': return <PhysicalLayer intensity={intensity} seed={seed} />;
    case 'dark':     return <DarkLayer intensity={intensity} seed={seed} />;
    case 'fire':     return <FireLayer intensity={intensity} seed={seed} />;
    case 'ice':      return <IceLayer intensity={intensity} seed={seed} />;
    case 'light':    return <LightLayer intensity={intensity} seed={seed} />;
    case 'mana':     return <ManaLayer intensity={intensity} seed={seed} />;
    case 'heal':     return <HealLayer intensity={intensity} seed={seed} />;
    case 'shield':   return <ShieldLayer intensity={intensity} seed={seed} />;
    default:         return <PhysicalLayer intensity={intensity} seed={seed} />;
  }
}

// ============================================================
// 公開コンポーネント
// ============================================================

export function EnemyFxOverlay({ fxList }: { fxList: FxInstance[] }) {
  ensureCombatFxStyles();
  if (fxList.length === 0) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'visible', borderRadius: 6, zIndex: 5 }}>
      {fxList.map((fx, fxIdx) => {
        if (fx.kind === 'defeat') {
          const isBoss = !!fx.isBoss;
          return (
            <div key={fx.fxId} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{
                position: 'absolute', left: '50%', top: '50%', width: isBoss ? 64 : 40, height: isBoss ? 64 : 40,
                marginLeft: isBoss ? -32 : -20, marginTop: isBoss ? -32 : -20, borderRadius: '50%',
                border: `${isBoss ? 3 : 2}px solid ${FX_ELEMENT_COLORS.light.main}`,
                boxShadow: `0 0 ${isBoss ? 30 : 16}px ${FX_ELEMENT_COLORS.light.glow}`,
                animation: `cfx-ring ${isBoss ? 1.1 : 0.6}s ease-out`,
              }} />
              {isBoss && (
                <div style={{
                  position: 'absolute', left: '50%', top: '50%', width: 90, height: 90,
                  marginLeft: -45, marginTop: -45, borderRadius: '50%',
                  border: '2px solid rgba(255,215,80,0.7)',
                  animation: 'cfx-slowmo-ring 1.1s ease-out',
                }} />
              )}
            </div>
          );
        }
        const showCombo = (fx.comboTotal ?? 1) >= 2 && fx.comboIndex === (fx.comboTotal ?? 1) - 1;
        return (
          <div key={fx.fxId} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* 各エレメントレイヤー */}
            {fx.elements.map((el, i) => (
              <ElementLayer key={i} element={el as FxElement} intensity={fx.intensity} seed={fxIdx + i} />
            ))}
            {/* 武器固有レイヤー */}
            <WeaponSpecificLayer itemId={fx.itemId} intensity={fx.intensity} />
            {/* ダメージ数値 */}
            {typeof fx.damage === 'number' && (
              <div style={{
                position: 'absolute', right: 2, top: -4,
                fontSize: fx.isCritical ? '0.95rem' : '0.78rem',
                fontWeight: 800,
                color: fx.isCritical ? '#ffd24d' : '#ffffff',
                textShadow: `0 0 6px ${fx.isCritical ? 'rgba(255,180,0,0.9)' : 'rgba(0,0,0,0.8)'}`,
                animation: 'cfx-rise 0.7s ease-out',
                pointerEvents: 'none',
              }}>
                {fx.isCritical ? `CRIT! -${fx.damage}` : `-${fx.damage}`}
              </div>
            )}
            {/* コンボヒット数ポップアップ */}
            {showCombo && (
              <div style={{
                position: 'absolute', left: '50%', top: '20%', marginLeft: -28,
                fontSize: '0.85rem', fontWeight: 900, color: '#ffe066',
                textShadow: '0 0 8px rgba(255,200,40,0.9), 0 1px 2px rgba(0,0,0,0.8)',
                animation: 'cfx-combo-pop 0.6s ease-out', pointerEvents: 'none', letterSpacing: 0.5,
              }}>
                {fx.comboTotal}HIT!
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// 会心ヒット時の画面フラッシュ（shakeKeyが変化した瞬間にcriticalがtrueなら呼び出し側で表示）
export function CritFlashOverlay({ flashKey }: { flashKey: number }) {
  ensureCombatFxStyles();
  return (
    <div key={flashKey} style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9,
      background: 'radial-gradient(circle, rgba(255,235,160,0.9) 0%, rgba(255,200,60,0.3) 45%, transparent 75%)',
      animation: 'cfx-crit-flash 0.32s ease-out',
    }} />
  );
}

// 被弾リアクション：fxList内に攻撃/必殺技の演出が含まれていればtrue（敵アイコンに combatfx-hit-punch クラスを当てるために使う）
export function hasHitReaction(fxList: FxInstance[]): boolean {
  return fxList.some(f => f.kind === 'attack' || f.kind === 'ultimate');
}

// ボス撃破時の画面全体フラッシュ＋スローモーション風の間
export function BossDefeatFlashOverlay({ flashKey }: { flashKey: number }) {
  ensureCombatFxStyles();
  if (flashKey <= 0) return null;
  return (
    <div key={flashKey} style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30,
      background: 'radial-gradient(circle, rgba(255,235,160,0.95) 0%, rgba(255,180,40,0.45) 40%, transparent 78%)',
      animation: 'cfx-boss-defeat-flash 1.1s ease-out',
    }} />
  );
}

// 必殺技カットイン：武器名＋技名を画面中央に一瞬表示
export function UltimateCutIn({ weaponName, skillName, cutInKey }: { weaponName: string; skillName: string; cutInKey: number }) {
  ensureCombatFxStyles();
  return (
    <div key={cutInKey} style={{
      position: 'absolute', inset: 0, zIndex: 25, display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(10,8,20,0.55) 45%, rgba(10,8,20,0.55) 55%, rgba(0,0,0,0) 100%)',
        animation: 'cfx-flash 1.3s ease-out',
      }} />
      <div style={{
        position: 'relative', textAlign: 'center',
        animation: 'cfx-ultimate-cutin 1.3s cubic-bezier(0.2,0.8,0.3,1)',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#cfe0ff', letterSpacing: 2, textShadow: '0 0 8px rgba(120,160,255,0.8)' }}>
          {weaponName}
        </div>
        <div style={{
          fontSize: '1.4rem', fontWeight: 900, color: '#ffe066', letterSpacing: 1,
          textShadow: '0 0 14px rgba(255,200,40,0.9), 0 2px 4px rgba(0,0,0,0.8)',
        }}>
          {skillName}
        </div>
      </div>
    </div>
  );
}

export function SelfFxBadge({ fxList }: { fxList: FxInstance[] }) {
  ensureCombatFxStyles();
  if (fxList.length === 0) return null;
  const latest = fxList[fxList.length - 1];
  const colors = FX_ELEMENT_COLORS[(latest.elements[0] as FxElement) ?? 'physical'];
  return (
    <div style={{
      position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: '50%',
      background: colors.main, boxShadow: `0 0 10px ${colors.glow}`,
      animation: 'cfx-pop 0.5s ease-out', pointerEvents: 'none', zIndex: 6,
    }} />
  );
}

export function SelfFxBanner({ fxList }: { fxList: FxInstance[] }) {
  ensureCombatFxStyles();
  if (fxList.length === 0) return null;
  const latest = fxList[fxList.length - 1];
  const colors = FX_ELEMENT_COLORS[(latest.elements[0] as FxElement) ?? 'physical'];
  const label = latest.elements.join(' + ');
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: -24, display: 'flex', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 6,
    }}>
      {/* 背景グロー */}
      <div style={{
        position: 'absolute', left: '20%', right: '20%', top: 0, bottom: 0,
        background: colors.glow, filter: 'blur(8px)', borderRadius: 8, opacity: 0.5,
        animation: 'cfx-flash 0.6s ease-out',
      }} />
      <div style={{
        position: 'relative', padding: '2px 10px', borderRadius: 10,
        fontSize: '0.62rem', fontWeight: 700,
        background: 'rgba(0,0,0,0.60)', border: `1px solid ${colors.main}`,
        color: colors.sub,
        boxShadow: `0 0 10px ${colors.glow}`,
        animation: 'cfx-pop 0.6s ease-out',
      }}>
        ✨ {label}
      </div>
    </div>
  );
}
