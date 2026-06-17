// src/components/combat/useCombatFx.ts
// 戦闘エフェクト（敵HP付近 / 自分ホットバー付近）の一時的な表示状態を管理する軽量フック。
// 既存の戦闘ロジック（ダメージ計算・HP更新・ログ）には触れず、
// 「どの武器をどう使ったか」を渡すだけで見た目側のstateを更新する責務に閉じる。

import { useState, useRef, useCallback, useEffect } from 'react';
import { getWeaponFx, escalateIntensity, type FxIntensity } from '../../data/weaponEffectMap';

export interface FxInstance {
  fxId: string;            // 一意なID（自動消去のキー）
  itemId: string | null;   // 発動元の武器（nullは素手攻撃）
  elements: string[];
  intensity: FxIntensity;
  kind: 'attack' | 'ultimate' | 'self' | 'defeat'; // 表示種別（消滅エフェクトはdefeat）
  createdAt: number;
  damage?: number;         // ダメージ数値ポップアップ用（任意）
  isCritical?: boolean;
}

export type EnemyFxMap = Record<number, FxInstance[]>; // enemyIdx -> 同時表示エフェクト配列

const FX_LIFETIME_MS = 750;       // 通常/敵側エフェクトの表示時間
const FX_LIFETIME_STRONG_MS = 950; // 強め演出の表示時間
const SHAKE_LIFETIME_MS = 260;     // 画面シェイクの持続時間

let _fxSeq = 0;
function nextFxId(): string {
  _fxSeq += 1;
  return `fx_${Date.now().toString(36)}_${_fxSeq}`;
}

export function useCombatFx() {
  const [enemyFx, setEnemyFx] = useState<EnemyFxMap>({});
  const [selfFx, setSelfFx] = useState<FxInstance[]>([]);
  const [shakeKey, setShakeKey] = useState(0); // 値が変わるたびに画面シェイクCSSを再トリガー
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      // アンマウント時に未消化のタイマーを全て破棄（リーク防止）
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  const scheduleCleanup = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      fn();
      timersRef.current = timersRef.current.filter(x => x !== t);
    }, ms);
    timersRef.current.push(t);
  }, []);

  /**
   * 敵に対して武器エフェクトを発火する。
   * hits: ダメージが入った敵ごとの情報（複数可・貫通/全体攻撃/連続ヒット対応）
   */
  const triggerEnemyFx = useCallback((
    itemId: string | null,
    hits: { idx: number; damage?: number; isCritical?: boolean }[],
    opts?: { isUltimate?: boolean; shake?: boolean }
  ) => {
    if (hits.length === 0) return;
    const def = getWeaponFx(itemId);
    const anyCritical = hits.some(h => h.isCritical);
    const intensity = escalateIntensity(def.intensity, !!opts?.isUltimate, anyCritical);
    const lifetime = intensity === 'normal' ? FX_LIFETIME_MS : FX_LIFETIME_STRONG_MS;

    setEnemyFx(prev => {
      const next = { ...prev };
      for (const hit of hits) {
        const fx: FxInstance = {
          fxId: nextFxId(),
          itemId,
          elements: def.elements,
          intensity: hit.isCritical ? escalateIntensity(def.intensity, !!opts?.isUltimate, true) : intensity,
          kind: opts?.isUltimate ? 'ultimate' : 'attack',
          createdAt: Date.now(),
          damage: hit.damage,
          isCritical: hit.isCritical,
        };
        next[hit.idx] = [...(next[hit.idx] ?? []), fx];
        const capturedIdx = hit.idx;
        const capturedFxId = fx.fxId;
        scheduleCleanup(() => {
          setEnemyFx(p => ({ ...p, [capturedIdx]: (p[capturedIdx] ?? []).filter(f => f.fxId !== capturedFxId) }));
        }, lifetime);
      }
      return next;
    });

    if (opts?.shake !== false) {
      setShakeKey(k => k + 1);
    }
  }, [scheduleCleanup]);

  /** 敵撃破時の「消滅」エフェクト */
  const triggerDefeatFx = useCallback((targetIdx: number) => {
    const fx: FxInstance = {
      fxId: nextFxId(),
      itemId: null,
      elements: ['light'],
      intensity: 'strong',
      kind: 'defeat',
      createdAt: Date.now(),
    };
    setEnemyFx(prev => ({ ...prev, [targetIdx]: [...(prev[targetIdx] ?? []), fx] }));
    scheduleCleanup(() => {
      setEnemyFx(p => ({ ...p, [targetIdx]: (p[targetIdx] ?? []).filter(f => f.fxId !== fx.fxId) }));
    }, FX_LIFETIME_STRONG_MS);
  }, [scheduleCleanup]);

  /** 自分側（ホットバー/装備武器付近）に表示するエフェクト（回復・シールド・マナ・自己ダメージ等） */
  const triggerSelfFx = useCallback((itemId: string | null, kind: FxInstance['kind'] = 'self') => {
    const def = getWeaponFx(itemId);
    const intensity = escalateIntensity(def.intensity, false, false);
    const fx: FxInstance = {
      fxId: nextFxId(),
      itemId,
      elements: def.elements,
      intensity,
      kind,
      createdAt: Date.now(),
    };
    setSelfFx(prev => [...prev, fx]);
    scheduleCleanup(() => {
      setSelfFx(prev => prev.filter(f => f.fxId !== fx.fxId));
    }, intensity === 'normal' ? FX_LIFETIME_MS : FX_LIFETIME_STRONG_MS);
  }, [scheduleCleanup]);

  return { enemyFx, selfFx, shakeKey, triggerEnemyFx, triggerDefeatFx, triggerSelfFx };
}
