// src/types/ffgg.ts
// FFGG フリーフィールド専用型定義
// 2D ターン制バトルに合わせた座標・範囲・フェーズベースの設計

// ============================================================
// 攻撃タイプ（2D Web ゲーム向け統一表現）
// ============================================================
export type AttackType =
  | 'single'          // 単体攻撃
  | 'circle_aoe'      // 円形範囲攻撃（全敵 or プレイヤー周囲全体）
  | 'line_aoe'        // 直線状範囲攻撃
  | 'wave'            // 周囲全体への波動
  | 'homing'          // プレイヤー追尾弾
  | 'place_zone'      // 一定時間残る危険地帯を設置
  | 'counter'         // 被弾時反撃
  | 'summon'          // 周囲召喚
  | 'buff_dispel'     // バフ解除
  | 'heal_self'       // 自己回復
  | 'phase_change';   // フェーズ変化（HPしきい値）

// ============================================================
// 敵スキル定義
// ============================================================
export interface EnemySkillDefinition {
  id: string;
  name: string;
  type: AttackType;
  /** ダメージ倍率（基礎ダメージに掛ける） */
  damageMult: number;
  /** 全体攻撃か */
  isAoe?: boolean;
  /** 追加効果説明 */
  effectText?: string;
  /** 使用確率（0〜1）。未指定なら通常攻撃の代替として使う */
  useChance?: number;
  /** HP しきい値以下で使用可能に（0.0〜1.0） */
  hpThreshold?: number;
  /** 発動後の予兆テキスト */
  telegraphText?: string;
  /** 危険地帯が何ターン残るか */
  zoneTurns?: number;
  /** 召喚する敵のIDリスト */
  summonIds?: string[];
  /** バフ解除する場合 */
  dispelsBuff?: boolean;
  /** 自己回復量（HPの割合） */
  healPct?: number;
  /** 死亡時爆発フラグ */
  deathExplosion?: boolean;
}

// ============================================================
// 敵定義（FFGG 専用、MonsterMaster とは分離）
// ============================================================
export interface FFGGEnemyDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** カテゴリ */
  category: 'swarm' | 'artillery' | 'trap' | 'counter' | 'phase' | 'summoner';
  maxHp: number;
  attack: number;
  defense: number;
  baseExp: number;
  baseGold: number;
  drops: FFGGDropEntry[];
  skills: EnemySkillDefinition[];
  isBoss?: boolean;
  isMidBoss?: boolean;
  /** 出現エリアID（複数可） */
  areaIds: string[];
  /** 危険度 1〜5 */
  dangerLevel: number;
  /** 戦闘トリガー型か（倒されるまで他の敵が出ない） */
  isTrigger?: boolean;
}

// ============================================================
// ドロップエントリ
// ============================================================
export interface FFGGDropEntry {
  itemId: string;
  baseRate: number;
  minAmount: number;
  maxAmount: number;
}

// ============================================================
// ボス定義
// ============================================================
export interface FFGGBossDefinition extends FFGGEnemyDefinition {
  isBoss: true;
  /** フェーズ数 */
  phases: FFGGBossPhase[];
  /** 専用BGMヒント（未実装） */
  bgmHint?: string;
}

export interface FFGGBossPhase {
  /** このフェーズになる HP しきい値（0.0〜1.0） */
  hpThreshold: number;
  label: string;
  description: string;
  /** このフェーズで使うスキルIDリスト（未指定なら全スキル使用） */
  activeSkillIds?: string[];
  /** ステータス倍率 */
  attackMult?: number;
  defenseMult?: number;
}

// ============================================================
// エリア別エンカウンタープロファイル
// ============================================================
export interface AreaEncounterProfile {
  areaId: string;
  /** 通常敵プール（warping ID） */
  normalEnemyIds: string[];
  /** 戦闘トリガー敵 ID（いなければ通常出現） */
  triggerEnemyId?: string;
  /** 中ボス ID */
  midBossId?: string;
  /** ボス ID */
  bossId?: string;
  /** 1 グループの最大数 */
  maxGroupSize: number;
  /** エリア全体の危険度 */
  dangerLevel: number;
  /** フィーバー発生確率（0〜1） */
  feverChance?: number;
}

// ============================================================
// エンカウンターテーブル（全エリアまとめ）
// ============================================================
export interface EncounterTable {
  [areaId: string]: AreaEncounterProfile;
}

// ============================================================
// フィーバー定義
// ============================================================
export interface FFGGFeverDefinition {
  id: string;
  type: 'gold' | 'red' | 'dragon';
  displayName: string;
  description: string;
  /** 出現する弱化雑魚の ID リスト */
  weakEnemyIds: string[];
  /** 湧き数（最大） */
  maxWaves: number;
  /** 1 Wave あたりの敵数 */
  enemiesPerWave: number;
  /** 終了後の処理説明（TODO 残し） */
  onEndNote: string;
  /** ドロップ倍率 */
  dropMult: number;
  /** EXP 倍率 */
  expMult: number;
  /** ゴールド倍率 */
  goldMult: number;
}

// ============================================================
// バトル中のフィーバー状態
// ============================================================
export interface FFGGFeverState {
  active: boolean;
  feverId: string | null;
  wavesRemaining: number;
  dropMult: number;
  expMult: number;
  goldMult: number;
}

// ============================================================
// FFGG バトル用敵インスタンス
// ============================================================
export interface FFGGEnemyInstance {
  defId: string;
  hp: number;
  maxHp: number;
  /** 設置された危険地帯の残ターン数（0=なし） */
  zoneTurnsActive: number;
  /** 現在のフェーズインデックス（ボスのみ） */
  currentPhaseIdx: number;
  /** 被弾反撃フラグ（counter 型が既にこのターン発動済みか） */
  counterUsedThisTurn: boolean;
}
