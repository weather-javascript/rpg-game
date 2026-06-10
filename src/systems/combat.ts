// src/systems/combat.ts
// 戦闘システム共通フレームワーク

// ============================================================
// バフ・デバフ共通型
// ============================================================
export interface Buff {
  type: string;   // 'poison' | 'atk_up' | 'shield' | 'burn' | 'freeze' | 'curse' | ...
  value: number;  // ダメージ量 / 上昇量 / カット率など
  turns: number;  // 残ターン数
}

// ============================================================
// オフハンド効果共通型
// ============================================================
export interface OffhandEffect {
  type: 'offhand_mana_regen' | 'offhand_hp_regen' | 'offhand_crit_up' | 'offhand_mana_on_heal';
  value: number;
  // offhand_mana_on_heal 専用
  chance?: number;
  requiredOffhandItemId?: string;
}

// ============================================================
// 武器のMana設定（共通）
// ============================================================
export interface WeaponManaConfig {
  manaGainPerTurn?: number;       // 毎ターン固定獲得
  manaGainPerTurnMin?: number;    // 毎ターンランダム（最小）
  manaGainPerTurnMax?: number;    // 毎ターンランダム（最大）
  manaGainPerTurnStep?: number;   // ランダムのステップ
  manaGainOnHeal?: number;        // 回復使用時獲得
  manaGainOnHealChance?: number;  // 回復使用時獲得確率
  manaCost?: number;              // 必殺技消費量
  manaMax: number;                // 最大Mana
}

// ============================================================
// ターン処理フック型
// ============================================================
export interface TurnEffect {
  type: 'mana_gain' | 'hp_regen' | 'poison_damage' | 'shield_grant' | 'buff_tick';
  value?: number;
  buffType?: string;
}

// ============================================================
// 共通Manaシステム状態
// ============================================================
export interface ManaState {
  current: number;
  max: number;
}

// ============================================================
// 共通バトル状態
// ============================================================
export interface CombatState {
  mana: ManaState;
  buffs: Buff[];
  ultimateReady: boolean;
}

// ============================================================
// onTurnStart / onTurnEnd 共通処理エンジン
// ============================================================
export function processTurnEffects(
  state: CombatState,
  effects: TurnEffect[]
): { state: CombatState; logs: { text: string; color: string }[] } {
  let newState = { ...state, buffs: state.buffs.map(b => ({ ...b })) };
  const logs: { text: string; color: string }[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case 'mana_gain':
        if (effect.value !== undefined) {
          const newMana = Math.min(newState.mana.current + effect.value, newState.mana.max);
          newState = {
            ...newState,
            mana: { ...newState.mana, current: newMana },
            ultimateReady: newMana >= newState.mana.max,
          };
        }
        break;
      case 'buff_tick':
        newState = {
          ...newState,
          buffs: newState.buffs
            .map(b => ({ ...b, turns: b.turns - 1 }))
            .filter(b => b.turns > 0),
        };
        break;
    }
  }

  return { state: newState, logs };
}

// ============================================================
// バフ追加ユーティリティ
// ============================================================
export function addBuff(buffs: Buff[], newBuff: Buff): Buff[] {
  const existing = buffs.findIndex(b => b.type === newBuff.type);
  if (existing >= 0) {
    const updated = [...buffs];
    updated[existing] = {
      ...updated[existing],
      value: Math.max(updated[existing].value, newBuff.value),
      turns: Math.max(updated[existing].turns, newBuff.turns),
    };
    return updated;
  }
  return [...buffs, newBuff];
}

// ============================================================
// バフ値取得ユーティリティ
// ============================================================
export function getBuffValue(buffs: Buff[], type: string): number {
  const buff = buffs.find(b => b.type === type);
  return buff ? buff.value : 0;
}

export function hasBuff(buffs: Buff[], type: string): boolean {
  return buffs.some(b => b.type === type && b.turns > 0);
}

// ============================================================
// 必殺技管理ユーティリティ
// ============================================================
export function isUltimateReady(mana: ManaState): boolean {
  return mana.current >= mana.max;
}

export function consumeUltimateMana(mana: ManaState): ManaState {
  return { ...mana, current: 0 };
}

export function gainMana(mana: ManaState, amount: number): ManaState {
  return { ...mana, current: Math.min(mana.current + amount, mana.max) };
}

// ============================================================
// クールダウン管理ユーティリティ
// ============================================================
export type CooldownMap = Record<string, number>;

export function tickCooldowns(cooldowns: CooldownMap): CooldownMap {
  const result: CooldownMap = {};
  for (const [id, cd] of Object.entries(cooldowns)) {
    if (cd > 1) result[id] = cd - 1;
  }
  return result;
}

export function isOnCooldown(cooldowns: CooldownMap, itemId: string): boolean {
  return (cooldowns[itemId] ?? 0) > 0;
}

export function setCooldown(cooldowns: CooldownMap, itemId: string, turns: number): CooldownMap {
  if (turns <= 0) return cooldowns;
  return { ...cooldowns, [itemId]: turns };
}
