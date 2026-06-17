// src/components/combat/CombatFx.tsx
// 敵HPバー付近・自分のホットバー付近に重ねる軽量なエフェクトオーバーレイ。
// 既存のHPバーDOMの上に absolute で重ねるだけで、レイアウトには影響しない。

import { FX_ELEMENT_COLORS, type FxElement } from '../../data/weaponEffectMap';
import type { FxInstance } from './useCombatFx';

// CSSアニメーション定義（1回だけ document に注入されればよいので、グローバルstyleタグとして1か所にまとめる）
let _injected = false;
function ensureCombatFxStyles() {
  if (_injected || typeof document === 'undefined') return;
  _injected = true;
  const style = document.createElement('style');
  style.textContent = `
@keyframes combatfx-slash {
  0% { opacity: 0; transform: scaleX(0.2) skewX(-8deg); }
  35% { opacity: 1; transform: scaleX(1) skewX(-8deg); }
  100% { opacity: 0; transform: scaleX(1.05) skewX(-8deg); }
}
@keyframes combatfx-flash {
  0% { opacity: 0; }
  20% { opacity: 0.9; }
  100% { opacity: 0; }
}
@keyframes combatfx-pop {
  0% { opacity: 0; transform: scale(0.6); }
  40% { opacity: 1; transform: scale(1.08); }
  100% { opacity: 0; transform: scale(1); }
}
@keyframes combatfx-particle {
  0% { opacity: 0; transform: translateY(0) scale(0.6); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-14px) scale(1.1); }
}
@keyframes combatfx-ring {
  0% { opacity: 0.9; transform: scale(0.4); }
  100% { opacity: 0; transform: scale(1.6); }
}
@keyframes combatfx-beam {
  0% { opacity: 0; transform: scaleX(0); }
  30% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(1); }
}
@keyframes combatfx-screenshake {
  0% { transform: translate(0, 0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, 1px); }
  80% { transform: translate(1px, -1px); }
  100% { transform: translate(0, 0); }
}
.combatfx-shake { animation: combatfx-screenshake 0.26s ease-in-out; }
`;
  document.head.appendChild(style);
}

function ElementLayer({ element, intensity, seed }: { element: FxElement; intensity: 'normal' | 'strong' | 'critical'; seed: number }) {
  const colors = FX_ELEMENT_COLORS[element];
  const big = intensity !== 'normal';
  const huge = intensity === 'critical';

  return (
    <>
      {/* スラッシュ */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(100deg, transparent 30%, ${colors.glow} 48%, ${colors.main} 50%, ${colors.glow} 52%, transparent 70%)`,
          animation: `combatfx-slash ${huge ? 0.5 : 0.38}s ease-out`,
          animationDelay: `${seed * 0.04}s`,
          mixBlendMode: 'screen',
        }}
      />
      {/* ヒットフラッシュ */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 6,
          background: colors.glow,
          animation: `combatfx-flash ${big ? 0.45 : 0.3}s ease-out`,
        }}
      />
      {/* 粒子（簡易：小さな光点を数個） */}
      {Array.from({ length: huge ? 6 : big ? 4 : 2 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', pointerEvents: 'none',
            left: `${15 + i * (70 / (huge ? 6 : big ? 4 : 2))}%`,
            top: '40%',
            width: huge ? 6 : 4, height: huge ? 6 : 4, borderRadius: '50%',
            background: colors.sub,
            boxShadow: `0 0 6px ${colors.glow}`,
            animation: `combatfx-particle ${0.5 + (i % 3) * 0.08}s ease-out`,
            animationDelay: `${i * 0.03}s`,
          }}
        />
      ))}
    </>
  );
}

interface EnemyFxOverlayProps {
  fxList: FxInstance[];
}

/** 敵カードのHPバー領域に absolute で重ねるオーバーレイ。親要素は position:relative が必要。 */
export function EnemyFxOverlay({ fxList }: EnemyFxOverlayProps) {
  ensureCombatFxStyles();
  if (fxList.length === 0) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'visible', borderRadius: 6, zIndex: 5 }}>
      {fxList.map((fx, fxIdx) => {
        if (fx.kind === 'defeat') {
          return (
            <div key={fx.fxId} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div
                style={{
                  position: 'absolute', left: '50%', top: '50%', width: 36, height: 36, marginLeft: -18, marginTop: -18,
                  borderRadius: '50%', border: `2px solid ${FX_ELEMENT_COLORS.light.main}`,
                  boxShadow: `0 0 14px ${FX_ELEMENT_COLORS.light.glow}`,
                  animation: 'combatfx-ring 0.6s ease-out',
                }}
              />
            </div>
          );
        }
        return (
          <div key={fx.fxId} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {fx.elements.map((el, i) => (
              <ElementLayer key={i} element={el as FxElement} intensity={fx.intensity} seed={fxIdx + i} />
            ))}
            {fx.elements.includes('light') && fx.intensity !== 'normal' && (
              <div
                style={{
                  position: 'absolute', left: 0, right: 0, top: '46%', height: 3,
                  background: `linear-gradient(90deg, transparent, ${FX_ELEMENT_COLORS.light.main}, transparent)`,
                  transformOrigin: 'left center',
                  animation: 'combatfx-beam 0.4s ease-out',
                  boxShadow: `0 0 8px ${FX_ELEMENT_COLORS.light.glow}`,
                }}
              />
            )}
            {typeof fx.damage === 'number' && (
              <div
                style={{
                  position: 'absolute', right: 2, top: -4,
                  fontSize: fx.isCritical ? '0.95rem' : '0.78rem',
                  fontWeight: 800,
                  color: fx.isCritical ? '#ffd24d' : '#ffffff',
                  textShadow: `0 0 6px ${fx.isCritical ? 'rgba(255,180,0,0.9)' : 'rgba(0,0,0,0.8)'}`,
                  animation: 'combatfx-particle 0.7s ease-out',
                }}
              >
                {fx.isCritical ? `CRIT! -${fx.damage}` : `-${fx.damage}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SelfFxBadgeProps {
  fxList: FxInstance[];
}

/** ホットバー/装備武器スロット付近に出す自分側エフェクト（小さなバッジ＋発光） */
export function SelfFxBadge({ fxList }: SelfFxBadgeProps) {
  ensureCombatFxStyles();
  if (fxList.length === 0) return null;
  const latest = fxList[fxList.length - 1];
  const colors = FX_ELEMENT_COLORS[(latest.elements[0] as FxElement) ?? 'physical'];
  return (
    <div
      style={{
        position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: '50%',
        background: colors.main, boxShadow: `0 0 10px ${colors.glow}`,
        animation: 'combatfx-pop 0.5s ease-out', pointerEvents: 'none', zIndex: 6,
      }}
    />
  );
}

/** 自分側エフェクトをホットバー全体の上に帯状に出す簡易バナー（回復/シールド/マナ獲得など） */
export function SelfFxBanner({ fxList }: SelfFxBadgeProps) {
  ensureCombatFxStyles();
  if (fxList.length === 0) return null;
  const latest = fxList[fxList.length - 1];
  const colors = FX_ELEMENT_COLORS[(latest.elements[0] as FxElement) ?? 'physical'];
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, top: -22, display: 'flex', justifyContent: 'center',
        pointerEvents: 'none', zIndex: 6,
      }}
    >
      <div
        style={{
          padding: '2px 10px', borderRadius: 10, fontSize: '0.62rem', fontWeight: 700,
          background: `rgba(0,0,0,0.55)`, border: `1px solid ${colors.main}`, color: colors.sub,
          boxShadow: `0 0 10px ${colors.glow}`,
          animation: 'combatfx-pop 0.6s ease-out',
        }}
      >
        ✨ {latest.elements.join(' + ')}
      </div>
    </div>
  );
}

// 画面シェイクは呼び出し側で `<div key={shakeKey} className="combatfx-shake">` のように
// key を変化させて再マウントすることでアニメーションを毎回再トリガーする。
