// src/data/weaponEffectMap.ts
// 武器使用時の戦闘エフェクト定義を1箇所に集約する。
// itemId をキーに、敵側/自分側どちらにどんな見た目のエフェクトを出すかを定義する。
// 新しい武器を追加する場合は WEAPON_EFFECT_MAP にエントリを追加するだけでよい。
// 未定義の武器は DEFAULT_EFFECT（物理・軽量）にフォールバックする。

// 演出の色味分類（アニメテーブルの分類に対応）
export type FxElement = 'dark' | 'fire' | 'ice' | 'light' | 'physical' | 'heal' | 'shield' | 'mana' | 'hybrid';

// エフェクトの強さ（通常 / 強め(必殺技・連続発動) / 特大(クリティカル・必殺技)）
export type FxIntensity = 'normal' | 'strong' | 'critical';

// エフェクトを誰の近くに出すか
export type FxDisplayTarget = 'enemy_hp' | 'self_hotbar' | 'both';

export interface WeaponFxDef {
  elements: FxElement[];        // 複数指定可（hybrid的に重ねて表示）
  displayTarget: FxDisplayTarget;
  intensity?: FxIntensity;      // 武器固有の基本強度（省略時は normal）
  selfDamageOnUse?: boolean;    // 自己ダメージ/反動がある武器（敵攻撃時でも自分側に小さく表示）
  label?: string;               // ログ等に出せる短い演出名（任意）
}

// 色パレット（エレメントごとの基準色。CSSの linear-gradient / box-shadow に使う）
export const FX_ELEMENT_COLORS: Record<FxElement, { main: string; sub: string; glow: string }> = {
  dark:     { main: '#6a3fb5', sub: '#1a0f2e', glow: 'rgba(106,63,181,0.65)' },
  fire:     { main: '#ff6a3d', sub: '#ffb84d', glow: 'rgba(255,106,61,0.65)' },
  ice:      { main: '#7fd6ff', sub: '#e8f9ff', glow: 'rgba(127,214,255,0.65)' },
  light:    { main: '#ffffff', sub: '#cfe0ff', glow: 'rgba(255,255,255,0.75)' },
  physical: { main: '#e8e6ff', sub: '#9aa3c9', glow: 'rgba(232,230,255,0.55)' },
  heal:     { main: '#7CFFB2', sub: '#e8fff0', glow: 'rgba(124,255,178,0.6)' },
  shield:   { main: '#7fc4ff', sub: '#e0f3ff', glow: 'rgba(127,196,255,0.6)' },
  mana:     { main: '#9b6df0', sub: '#d6c6ff', glow: 'rgba(155,109,240,0.6)' },
  hybrid:   { main: '#f0c060', sub: '#ffffff', glow: 'rgba(240,192,96,0.6)' },
};

export const DEFAULT_EFFECT: WeaponFxDef = {
  elements: ['physical'],
  displayTarget: 'enemy_hp',
};

// ============================================================
// 演出対応表本体（アニメテーブル.txt に基づく）
// ============================================================
export const WEAPON_EFFECT_MAP: Record<string, WeaponFxDef> = {
  // ---- enemy_hp 系（攻撃武器） ----
  hengen:                      { elements: ['dark', 'physical'], displayTarget: 'enemy_hp', label: '変幻の斬撃' },
  revolution_sword:            { elements: ['physical', 'light'], displayTarget: 'enemy_hp', label: '貫通斬撃' },
  iron_sword:                  { elements: ['physical'], displayTarget: 'enemy_hp' },
  wooden_knife:                { elements: ['physical'], displayTarget: 'enemy_hp' },
  golden_knife:                { elements: ['physical', 'light'], displayTarget: 'enemy_hp' },
  diamond_sword:                { elements: ['light', 'physical'], displayTarget: 'enemy_hp' },
  endstone_sword:              { elements: ['dark', 'physical'], displayTarget: 'enemy_hp' },
  wooden_bow:                  { elements: ['light', 'physical'], displayTarget: 'enemy_hp' },
  stone_knife:                 { elements: ['physical'], displayTarget: 'enemy_hp' },
  cave_staff:                  { elements: ['dark', 'mana'], displayTarget: 'enemy_hp' },
  cave_staff2:                 { elements: ['dark', 'mana'], displayTarget: 'enemy_hp', intensity: 'strong' },
  emerald_sword:                { elements: ['light', 'physical'], displayTarget: 'enemy_hp' },
  netherite_sword:             { elements: ['dark', 'physical'], displayTarget: 'enemy_hp', intensity: 'strong' },
  iron_sacrifice_staff:        { elements: ['physical', 'dark'], displayTarget: 'enemy_hp' },
  gold_sacrifice_staff:        { elements: ['light', 'physical'], displayTarget: 'enemy_hp' },
  diamond_sacrifice_staff:     { elements: ['light', 'mana'], displayTarget: 'enemy_hp' },
  emerald_sacrifice_staff:     { elements: ['light', 'mana'], displayTarget: 'enemy_hp' },
  netherite_sacrifice_staff:   { elements: ['dark', 'light', 'mana'], displayTarget: 'enemy_hp', intensity: 'strong' },
  rusty_sword:                  { elements: ['physical'], displayTarget: 'enemy_hp' },
  hammer:                       { elements: ['physical'], displayTarget: 'enemy_hp', intensity: 'strong', label: '叩きつけ' },
  almighty_staff:               { elements: ['mana', 'light'], displayTarget: 'enemy_hp' },
  silvers_eye:                  { elements: ['light', 'mana'], displayTarget: 'enemy_hp', intensity: 'strong', label: '銀のレーザー' },
  reitoumaguro:                 { elements: ['ice', 'physical'], displayTarget: 'both', selfDamageOnUse: true, label: '冷海の斬撃' },
  gyouen_no_ken:                 { elements: ['fire', 'physical'], displayTarget: 'enemy_hp', intensity: 'strong', label: '業炎斬' },

  // ---- self_hotbar 系（回復・支援武器） ----
  revolution_healwand:          { elements: ['heal', 'light'], displayTarget: 'self_hotbar', label: '回復オーラ' },
  memory_of_flower:             { elements: ['heal', 'mana', 'light'], displayTarget: 'self_hotbar', label: '花の波' },
  diamond_staff:                 { elements: ['mana', 'shield'], displayTarget: 'self_hotbar', label: 'マナ柱' },
  revolution_defencer:           { elements: ['shield'], displayTarget: 'self_hotbar', label: 'シールド展開' },
  goliath_shield:                 { elements: ['shield', 'dark'], displayTarget: 'self_hotbar', intensity: 'strong', label: '守りの重波' },
};

export function getWeaponFx(itemId: string | null | undefined): WeaponFxDef {
  if (!itemId) return DEFAULT_EFFECT;
  return WEAPON_EFFECT_MAP[itemId] ?? DEFAULT_EFFECT;
}

// クリティカル/必殺技時に強度を一段階上げる
export function escalateIntensity(base: FxIntensity | undefined, isUltimate: boolean, isCritical: boolean): FxIntensity {
  if (isUltimate) return 'critical';
  if (isCritical) return base === 'strong' ? 'critical' : 'strong';
  return base ?? 'normal';
}
