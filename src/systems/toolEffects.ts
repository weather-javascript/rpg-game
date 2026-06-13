// src/systems/toolEffects.ts
// 採取ツール特殊効果（specialEffectId）の実装。
// 100ツール中50種の特殊ツールが持つ効果をここで一括処理する。

import { randomChance } from '../utils/random';
import { getCurrentWeather } from '../data/fishMastersExtra';

export interface ToolEffectContext {
  hour: number;        // 0-23
  weatherId: string;   // sunny / rainy / storm ...
  combo: number;       // 現在のコンボ数
  satietyRatio: number; // 0.0-1.0
}

export interface ToolEffectResult {
  speedMult: number;
  yieldMult: number;
  rareMult: number;
  staminaMult: number;
  comboBonusAdd: number;
  hpDelta: number;
  extraAmount: number;     // 追加ドロップ個数（主要ドロップに加算）
  forceMaxAmount: boolean; // 数量決定を常に最大値にする
  noHpPenalty: boolean;    // 満腹度0でもHPペナルティ無効
  noComboDecay: boolean;   // 取得失敗時もコンボを減少させない
  message: string | null;  // 発動時の演出ログ
}

function base(): ToolEffectResult {
  return {
    speedMult: 1, yieldMult: 1, rareMult: 1, staminaMult: 1,
    comboBonusAdd: 0, hpDelta: 0, extraAmount: 0,
    forceMaxAmount: false, noHpPenalty: false, noComboDecay: false,
    message: null,
  };
}

export function getCurrentToolEffectContext(combo: number, satietyRatio: number): ToolEffectContext {
  const hour = new Date().getHours();
  const weatherId = getCurrentWeather().id;
  return { hour, weatherId, combo, satietyRatio };
}

export function applySpecialEffect(effectId: string | null, ctx: ToolEffectContext): ToolEffectResult {
  const r = base();
  if (!effectId) return r;
  const isNight = ctx.hour >= 22 || ctx.hour < 5;
  const isDay = ctx.hour >= 6 && ctx.hour < 18;
  const isMorning = ctx.hour >= 5 && ctx.hour < 10;
  const isEvening = ctx.hour >= 17 && ctx.hour < 20;
  const isMidday = ctx.hour >= 11 && ctx.hour < 14;
  const isDeepNight = ctx.hour >= 0 && ctx.hour < 3;
  const w = ctx.weatherId;

  switch (effectId) {
    // ── 時間帯 ─────────────────────────
    case 'night_boost':
      if (isNight) { r.yieldMult *= 1.5; r.message = '🌙 深夜ボーナス！採取量UP'; }
      break;
    case 'day_boost':
      if (isDay) { r.yieldMult *= 1.3; r.message = '☀️ 昼間ボーナス！採取量UP'; }
      break;
    case 'morning_boost':
      if (isMorning) { r.speedMult *= 1.4; r.message = '🌅 朝の活力！速度UP'; }
      break;
    case 'evening_boost':
      if (isEvening) { r.rareMult *= 1.5; r.message = '🌇 夕暮れの輝き！レア率UP'; }
      break;
    case 'night_rare':
      if (isNight) { r.rareMult *= 2.0; r.message = '🌌 夜のレア確率2倍！'; }
      break;
    case 'morning_combo':
      if (isMorning) { r.comboBonusAdd += 0.3; r.message = '🌄 朝のコンボ強化！'; }
      break;
    case 'evening_yield':
      if (isEvening) { r.yieldMult *= 1.6; r.message = '🌆 夕方の大量採取！'; }
      break;
    case 'midday_stamina':
      if (isMidday) { r.staminaMult *= 0.5; r.message = '🕛 真昼の省エネ！'; }
      break;
    case 'deepnight_super':
      if (isDeepNight) {
        r.speedMult *= 1.5; r.yieldMult *= 1.5; r.rareMult *= 1.5;
        r.message = '🌃 深夜スーパーブースト！全能力1.5倍';
      }
      break;
    case 'time_adaptive':
      if (isNight) { r.yieldMult *= 1.3; r.message = '🔄 適応：夜→採取量UP'; }
      else { r.speedMult *= 1.3; r.message = '🔄 適応：昼→速度UP'; }
      break;

    // ── 天候 ─────────────────────────
    case 'rain_yield':
      if (w === 'rainy' || w === 'storm') { r.yieldMult *= 1.5; r.message = '🌧️ 雨で採取量UP！'; }
      break;
    case 'thunder_rare':
      if (w === 'storm') { r.rareMult *= 2.0; r.message = '⚡ 雷雨でレア率2倍！'; }
      break;
    case 'fog_bonus':
      if (w === 'cloudy') { r.staminaMult *= 0.7; r.message = '🌫️ 霧で省エネ！'; }
      break;
    case 'storm_risk':
      if (w === 'storm') { r.yieldMult *= 2.0; r.hpDelta -= 2; r.message = '🌩️ 嵐の中の大量採取…HPが減った！'; }
      break;
    case 'rain_speed':
      if (w === 'rainy') { r.speedMult *= 1.4; r.message = '☔ 雨で速度UP！'; }
      break;
    case 'thunder_extra':
      if (w === 'storm') { r.extraAmount += 1; r.message = '⚡ 雷で追加ドロップ！'; }
      break;
    case 'weather_adaptive':
      if (w === 'sunny') { r.speedMult *= 1.3; r.message = '🌤️ 適応：晴れ→速度UP'; }
      else if (w === 'rainy' || w === 'storm') { r.yieldMult *= 1.3; r.message = '🌧️ 適応：雨→採取量UP'; }
      else { r.rareMult *= 1.2; r.message = '🌥️ 適応：レア率UP'; }
      break;
    case 'chaos_weather': {
      const roll = Math.floor(Math.random() * 3);
      if (roll === 0) { r.speedMult *= 1.5; r.message = '🌀 混沌：速度1.5倍！'; }
      else if (roll === 1) { r.yieldMult *= 1.5; r.message = '🌀 混沌：採取量1.5倍！'; }
      else { r.rareMult *= 1.5; r.message = '🌀 混沌：レア率1.5倍！'; }
      break;
    }
    case 'humidity_bonus':
      if (w === 'rainy' || w === 'cloudy') { r.yieldMult *= 1.2; r.rareMult *= 1.1; r.message = '💧 湿度ボーナス！'; }
      break;
    case 'wind_combo':
      if (w === 'storm' || w === 'blizzard') { r.comboBonusAdd += 0.25; r.message = '🌬️ 強風でコンボ強化！'; }
      break;

    // ── コンボ ─────────────────────────
    case 'combo_plus':
      r.comboBonusAdd += ctx.combo * 0.05;
      break;
    case 'combo_keep':
      r.noComboDecay = true;
      break;
    case 'combo_explosion':
      if (ctx.combo >= 10) { r.yieldMult *= 3.0; r.message = '💥 コンボ大爆発！採取量3倍！'; }
      break;
    case 'combo_no_decay':
      r.noComboDecay = true;
      break;
    case 'combo_double':
      r.comboBonusAdd += ctx.combo * 0.04;
      break;
    case 'combo_recover':
      r.noComboDecay = true;
      break;
    case 'combo_stable':
      r.comboBonusAdd += 0.2;
      break;
    case 'combo_gamble':
      if (randomChance(0.5)) { r.comboBonusAdd += 0.5; r.message = '🎲 コンボギャンブル成功！'; }
      else { r.comboBonusAdd -= 0.2; r.message = '🎲 コンボギャンブル失敗…'; }
      break;
    case 'combo_boost_low':
      if (ctx.combo < 3) { r.yieldMult *= 1.5; r.message = '🔰 序盤コンボブースト！'; }
      break;
    case 'combo_master':
      r.comboBonusAdd += Math.min(ctx.combo, 20) * 0.02;
      break;

    // ── 危険ノード ─────────────────────────
    case 'danger_null':
      r.noHpPenalty = true;
      break;
    case 'curse_resist':
      r.rareMult *= 1.2; r.noHpPenalty = true;
      break;
    case 'life_steal':
      r.hpDelta += 2; r.message = '🩸 ライフスティール！HP+2';
      break;
    case 'risk_reduce':
      r.staminaMult *= 0.7;
      break;
    case 'hp_convert':
      r.extraAmount += 1; r.hpDelta -= 1; r.message = '🔄 HPを変換して追加ドロップ！';
      break;
    case 'risk_amplify':
      r.yieldMult *= 2.0; r.hpDelta -= 5; r.message = '☠️ リスク増幅！採取量2倍だがHP-5';
      break;
    case 'safe_mode':
      r.staminaMult *= 0.5; r.noHpPenalty = true;
      break;
    case 'insane_bonus':
      r.rareMult *= 3.0; r.hpDelta -= 3; r.message = '🌀 狂気のボーナス！レア率3倍だがHP-3';
      break;
    case 'no_penalty':
      r.noHpPenalty = true;
      break;
    case 'danger_spawn':
      if (randomChance(0.2)) { r.yieldMult *= 2.5; r.message = '👹 危険な気配…採取量2.5倍！'; }
      break;

    // ── 特殊 ─────────────────────────
    case 'double_drop':
      r.yieldMult *= 2.0; r.message = '✨ ダブルドロップ！';
      break;
    case 'copy_drop':
      r.extraAmount += 1; r.message = '📑 コピードロップ！';
      break;
    case 'discover_boost':
      r.rareMult *= 1.8; r.message = '🔍 発見ブースト！レア率UP';
      break;
    case 'collection_bonus':
      r.yieldMult *= 1.1; r.message = '📚 コレクションボーナス！';
      break;
    case 'time_scale':
      r.speedMult *= 1.3; r.message = '⏱️ 時間圧縮！速度UP';
      break;
    case 'first_bonus':
      r.yieldMult *= 1.5; r.message = '🆕 初取りボーナス！';
      break;
    case 'low_stamina_boost':
      if (ctx.satietyRatio < 0.3) { r.yieldMult *= 1.8; r.message = '🔥 ハングリーブースト！'; }
      break;
    case 'perfect_stable':
      r.forceMaxAmount = true; r.message = '🎯 パーフェクト安定！常に最大量';
      break;
    case 'random_extreme': {
      const mult = 0.5 + Math.random() * 2.5;
      r.yieldMult *= mult;
      r.message = `🎰 極端運発動！採取量×${mult.toFixed(2)}`;
      break;
    }
    case 'daily_legend':
      if (randomChance(0.05)) { r.rareMult *= 5.0; r.yieldMult *= 3.0; r.message = '👑 日替り伝説発動！レア率5倍・採取量3倍！'; }
      break;

    default:
      break;
  }
  return r;
}

// UI表示用：特殊効果の説明文
export const SPECIAL_EFFECT_LABELS: Record<string, string> = {
  night_boost: '深夜(22-5時)に採取量+50%',
  day_boost: '昼間(6-18時)に採取量+30%',
  morning_boost: '早朝(5-10時)に速度+40%',
  evening_boost: '夕方(17-20時)にレア率+50%',
  night_rare: '深夜(22-5時)にレア率×2',
  morning_combo: '早朝(5-10時)にコンボ+0.3',
  evening_yield: '夕方(17-20時)に採取量+60%',
  midday_stamina: '正午(11-14時)にスタミナ消費-50%',
  deepnight_super: '深夜0-3時に全能力+50%',
  time_adaptive: '夜は採取量UP、昼は速度UP',
  rain_yield: '雨/嵐で採取量+50%',
  thunder_rare: '嵐でレア率×2',
  fog_bonus: '曇りでスタミナ消費-30%',
  storm_risk: '嵐で採取量×2、HP-2',
  rain_speed: '雨で速度+40%',
  thunder_extra: '嵐で追加ドロップ+1',
  weather_adaptive: '天候に応じて速度/採取量/レア率が変化',
  chaos_weather: '毎回ランダムで速度/採取量/レア率のいずれかが+50%',
  humidity_bonus: '雨/曇りで採取量+20%・レア率+10%',
  wind_combo: '嵐/吹雪でコンボ+0.25',
  combo_plus: 'コンボ数×0.05のコンボボーナス',
  combo_keep: 'コンボが減少しない',
  combo_explosion: 'コンボ10以上で採取量×3',
  combo_no_decay: 'コンボが減少しない',
  combo_double: 'コンボ数×0.04のコンボボーナス',
  combo_recover: 'コンボが減少しない',
  combo_stable: '常時コンボ+0.2',
  combo_gamble: '50%でコンボ+0.5、50%でコンボ-0.2',
  combo_boost_low: 'コンボ3未満で採取量+50%',
  combo_master: 'コンボ数(最大20)×0.02のコンボボーナス',
  danger_null: '満腹度0のHPペナルティを無効化',
  curse_resist: 'レア率+20%、HPペナルティ無効',
  life_steal: '採取成功時にHP+2',
  risk_reduce: 'スタミナ消費-30%',
  hp_convert: 'HP-1で追加ドロップ+1',
  risk_amplify: '採取量×2、HP-5',
  safe_mode: 'スタミナ消費-50%、HPペナルティ無効',
  insane_bonus: 'レア率×3、HP-3',
  no_penalty: 'HPペナルティを無効化',
  danger_spawn: '20%で採取量×2.5',
  double_drop: '採取量×2',
  copy_drop: '追加ドロップ+1',
  discover_boost: 'レア率+80%',
  collection_bonus: '採取量+10%',
  time_scale: '速度+30%',
  first_bonus: '採取量+50%',
  low_stamina_boost: '満腹度30%未満で採取量+80%',
  perfect_stable: '常に最大量を取得',
  random_extreme: '採取量に0.5〜3.0倍のランダム補正',
  daily_legend: '5%でレア率×5・採取量×3',
};
