// src/components/combat/UnifiedBattleUI.tsx
// ダンジョン戦闘・フリーフィールド戦闘を統一する共通バトルUI
// デザイン・レイアウト・操作感を DungeonScreen の TurnBattle に揃える。
// モード差分は BattleUIMode 型の props で吸収する。

// react import is used for JSX and React.ReactNode in props type
import type React from 'react';

// ────────────────────────────────────────────
// 共通型定義
// ────────────────────────────────────────────

/** 表示用の敵エントリ */
export interface BattleEnemyDisplay {
  id: string;           // ユニーク識別子（表示用）
  name: string;
  hp: number;
  maxHp: number;
  isDead: boolean;
  isBoss?: boolean;
  icon?: string;        // GameIcon ID（省略時はデフォルト表示）
}

/** バトルログ行 */
export interface BattleLogEntry {
  text: string;
  color: string;
}

/** 勝敗・逃走結果 */
export type BattleResult = 'win' | 'lose' | 'escaped' | null;

/** ターンの状態 */
export type BattleTurn = 'player' | 'enemy' | 'monster' | 'result' | 'select_target';

/**
 * UnifiedBattleUI に渡す Props
 * DungeonScreen の TurnBattle と FreeFieldScreen の FFBattleModal を統合。
 */
export interface UnifiedBattleUIProps {
  // ──── 必須：敵・プレイヤー情報 ────
  enemies: BattleEnemyDisplay[];
  playerHp: number;
  playerMaxHp: number;
  playerName?: string;

  // ──── 必須：ターン・結果 ────
  turn: BattleTurn;
  result: BattleResult;
  log: BattleLogEntry[];

  // ──── 必須：アクション ────
  onAttack: () => void;
  onEscape: () => void;
  onClose: () => void;   // 結果確定後に呼ばれる

  // ──── オプション：防御（FF戦闘では不使用） ────
  onDefend?: () => void;
  isDefending?: boolean;

  // ──── オプション：勝利報酬（結果パネルに表示） ────
  expGained?: number;
  goldGained?: number;
  drops?: { name: string; amount: number }[];

  // ──── オプション：モード表示 ────
  /** ヘッダーに表示するバトルタイトル */
  battleTitle?: string;
  /** ヘッダーサブテキスト（フェーズ表記など） */
  battleSubtitle?: string;
  /** 攻撃ボタンのラベル（省略時: '⚔️ 攻撃'） */
  attackLabel?: string;

  // ──── オプション：FF専用フェーズ表示 ────
  ffPhaseLabel?: string;   // '【戦闘トリガー】' など

  // ──── オプション：シェイクアニメ ────
  shakeKey?: number;

  // ──── オプション：追加コンテンツ（MANA/ホットバーなど） ────
  /** 攻撃ボタン下に挿入するカスタム要素（MANA/スキルボタンなど） */
  extraActions?: React.ReactNode;
}

// ────────────────────────────────────────────
// HPバーカラー
// ────────────────────────────────────────────
function hpColor(pct: number): string {
  if (pct > 50) return '#4caf87';
  if (pct > 25) return '#f0a830';
  return '#e05555';
}

// ────────────────────────────────────────────
// UnifiedBattleUI 本体
// ────────────────────────────────────────────
export function UnifiedBattleUI({
  enemies,
  playerHp,
  playerMaxHp,
  playerName = 'あなた',
  turn,
  result,
  log,
  onAttack,
  onEscape,
  onClose,
  onDefend,
  isDefending = false,
  expGained = 0,
  goldGained = 0,
  drops = [],
  battleTitle = '⚔️ バトル',
  battleSubtitle,
  attackLabel,
  ffPhaseLabel,
  shakeKey = 0,
  extraActions,
}: UnifiedBattleUIProps) {
  const hpPct = playerMaxHp > 0 ? (playerHp / playerMaxHp) * 100 : 0;
  const isResult = result !== null;

  // 攻撃ボタンラベル（外部から上書き可能）
  const resolvedAttackLabel = attackLabel ?? '⚔️ 攻撃';

  // 敵のターン中か
  const isEnemyTurn = (turn === 'enemy' || turn === 'monster') && !isResult;
  // プレイヤーが操作可能か
  const canAct = turn === 'player' && !isResult;

  return (
    <div style={{
      background: '#161b26',
      border: '2px solid #e05555',
      borderRadius: 12,
      padding: 14,
      overflow: 'hidden',
    }}>
      <div
        key={shakeKey}
        className={shakeKey > 0 ? 'combatfx-shake' : undefined}
      >
        {/* ──── ヘッダー ──── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <div style={{ color: '#e05555', fontWeight: 700, fontSize: '0.95rem' }}>
            {battleTitle}
            {ffPhaseLabel && (
              <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#ff8060' }}>
                {ffPhaseLabel}
              </span>
            )}
            {battleSubtitle && (
              <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#8a92b2' }}>
                {battleSubtitle}
              </span>
            )}
          </div>
          {isResult && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid #3d4772',
                borderRadius: 4,
                color: '#8a92b2',
                cursor: 'pointer',
                padding: '2px 10px',
                fontSize: '0.70rem',
              }}
            >
              閉じる
            </button>
          )}
        </div>

        {/* ──── 敵HP表示（複数対応） ──── */}
        <div style={{ marginBottom: 10 }}>
          {enemies.map((enemy) => {
            const mHpPct = enemy.maxHp > 0 ? (enemy.hp / enemy.maxHp) * 100 : 0;
            const isDead = enemy.isDead || enemy.hp <= 0;
            return (
              <div
                key={enemy.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                  opacity: isDead ? 0.35 : 1,
                }}
              >
                {/* アイコン */}
                <span style={{ fontSize: '2.2rem', minWidth: 36, textAlign: 'center' }}>
                  {enemy.icon ? (
                    // GameIcon が渡せる場合はそのまま文字列絵文字として表示
                    <span>{getEnemyEmoji(enemy.icon)}</span>
                  ) : (
                    <span>👾</span>
                  )}
                </span>

                {/* HPバー・名前 */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700,
                    color: isDead ? '#4a5070' : '#e05555',
                    fontSize: '0.88rem',
                  }}>
                    {enemy.name}
                    {enemy.isBoss && ' 👑'}
                    {isDead && ' 💀'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#8a92b2', marginBottom: 2 }}>
                    HP {enemy.hp}/{enemy.maxHp}
                  </div>
                  <div style={{ height: 5, background: '#2d3752', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: isDead ? '#4a5070' : '#e05555',
                      width: `${mHpPct}%`,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>

                {/* 敵ターン中インジケーター */}
                {isEnemyTurn && !isDead && (
                  <span style={{ fontSize: '1rem', animation: 'pulse 0.5s infinite' }}>⚡</span>
                )}
              </div>
            );
          })}
        </div>

        {/* ──── プレイヤーHP ──── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: '0.7rem',
            color: '#8a92b2',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>{playerName} HP {playerHp}/{playerMaxHp}</span>
            {isDefending && <span style={{ color: '#5b8dee' }}>🛡️ 防御中</span>}
          </div>
          <div style={{ height: 6, background: '#2d3752', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
            <div style={{
              height: '100%',
              background: hpColor(hpPct),
              width: `${hpPct}%`,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* ──── 戦闘ログ ──── */}
        <div
          style={{
            background: '#0e1220',
            borderRadius: 6,
            padding: '6px 8px',
            height: 160,
            overflowY: 'auto',
            marginBottom: 10,
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
          ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
        >
          {log.map((l, i) => (
            <div key={i} style={{ color: l.color, padding: '1px 0', lineHeight: 1.4 }}>
              {l.text}
            </div>
          ))}
        </div>

        {/* ──── 行動ボタン（結果未確定時） ──── */}
        {!isResult && turn !== 'select_target' && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: onDefend ? '1fr 1fr' : '1fr',
              gap: 6,
              marginBottom: 8,
            }}>
              {/* 攻撃 */}
              <button
                onClick={onAttack}
                disabled={!canAct}
                style={{
                  padding: '10px',
                  background: canAct
                    ? 'linear-gradient(135deg,#e05555,#c03030)'
                    : '#2d3752',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: canAct ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {resolvedAttackLabel}
              </button>

              {/* 防御（渡された場合のみ） */}
              {onDefend && (
                <button
                  onClick={onDefend}
                  disabled={!canAct}
                  style={{
                    padding: '10px',
                    background: canAct
                      ? 'linear-gradient(135deg,#5b8dee,#3d6fd0)'
                      : '#2d3752',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: canAct ? 'pointer' : 'not-allowed',
                    fontWeight: 700,
                  }}
                >
                  🛡️ 防御
                </button>
              )}
            </div>

            {/* 追加アクション（MANA・ホットバーなど） */}
            {extraActions}

            {/* 逃走ボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onEscape}
                disabled={!canAct}
                style={{
                  padding: '6px 16px',
                  background: 'rgba(240,168,48,0.1)',
                  border: '1px solid #f0a830',
                  borderRadius: 6,
                  color: canAct ? '#f0a830' : '#555',
                  cursor: canAct ? 'pointer' : 'not-allowed',
                  fontSize: '0.78rem',
                }}
              >
                🏃 逃走
              </button>
            </div>

            {/* 敵のターン中テキスト */}
            {isEnemyTurn && (
              <div style={{
                textAlign: 'center',
                color: '#e08060',
                fontSize: '0.75rem',
                padding: '6px 0 0',
              }}>
                敵のターン...
              </div>
            )}
          </>
        )}

        {/* ──── 結果パネル ──── */}
        {isResult && (
          <div style={{
            background: result === 'win'
              ? 'rgba(60,160,80,0.15)'
              : result === 'escaped'
                ? 'rgba(160,100,200,0.15)'
                : 'rgba(160,60,60,0.15)',
            border: `1px solid ${result === 'win' ? '#40c060' : result === 'escaped' ? '#a060d0' : '#c04040'}`,
            borderRadius: 8,
            padding: '10px 12px',
          }}>
            <div style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: result === 'win' ? '#60d080' : result === 'escaped' ? '#c080ff' : '#e06060',
              marginBottom: 6,
            }}>
              {result === 'win' ? '🎉 勝利！' : result === 'escaped' ? '💨 逃走成功' : '💔 敗北...'}
            </div>

            {result === 'win' && (expGained > 0 || goldGained > 0) && (
              <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginBottom: 4 }}>
                ✨ EXP +{expGained}　💰 Gold +{goldGained}
              </div>
            )}

            {result === 'win' && drops.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: '0.65rem', color: '#6a7290', marginBottom: 2 }}>
                  💎 ドロップアイテム
                </div>
                {drops.map((d, i) => (
                  <div key={i} style={{ fontSize: '0.72rem', color: '#70c090' }}>
                    {d.name} × {d.amount}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '8px 0',
                borderRadius: 6,
                cursor: 'pointer',
                background: result === 'win'
                  ? 'rgba(64,192,128,0.18)'
                  : result === 'escaped'
                    ? 'rgba(160,100,200,0.18)'
                    : 'rgba(224,85,85,0.18)',
                border: `1px solid ${result === 'win' ? '#40c080' : result === 'escaped' ? '#a060d0' : '#e05555'}`,
                color: result === 'win' ? '#40c080' : result === 'escaped' ? '#c080ff' : '#e06060',
                fontWeight: 700,
                fontSize: '0.82rem',
              }}
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// ヘルパー：icon ID → 絵文字（DungeonScreen の GameIcon を使わない場合のフォールバック）
// DungeonScreen 側では GameIcon コンポーネントを直接使うため、
// FF側はシンプルな絵文字マップを使う。
// ────────────────────────────────────────────
function getEnemyEmoji(iconId: string): string {
  const map: Record<string, string> = {
    skull: '💀',
    sword: '⚔️',
    zombie: '🧟',
    dragon: '🐉',
    wolf: '🐺',
    slime: '🟢',
    goblin: '👺',
    skeleton: '💀',
    bat: '🦇',
    spider: '🕷️',
    boss: '👑',
  };
  return map[iconId] ?? '👾';
}

// ────────────────────────────────────────────
// FF戦闘専用アダプター
// FFBattleSession → UnifiedBattleUI props に変換する
// ────────────────────────────────────────────
import type { FFBattleSession } from '../../types/freefield';
import { FFGG_ALL_ENEMIES } from '../../data/ffggMaster';

export interface FFBattleUIProps {
  session: FFBattleSession;
  onPlayerAttack: () => void;
  onEscape: () => void;
  onClose: () => void;
}

/**
 * FreeFieldScreen で使う FF戦闘 UI。
 * 内部的に UnifiedBattleUI を使い、DungeonScreen の TurnBattle と同じ見た目・操作感を提供する。
 */
export function FFBattleUI({ session, onPlayerAttack, onEscape, onClose }: FFBattleUIProps) {
  // ── 敵リスト変換 ──
  const enemies: BattleEnemyDisplay[] = buildEnemyDisplayList(session);

  // ── ログ変換（FF側は string[] → BattleLogEntry[]） ──
  const log: BattleLogEntry[] = session.log.map(line => ({
    text: line,
    color: logLineColor(line),
  }));

  // ── フェーズサブテキスト ──
  let ffPhaseLabel: string | undefined;
  if (session.phase === 'trigger') {
    ffPhaseLabel = '【戦闘トリガー】';
  } else if (session.phase === 'spawn') {
    const total = session.spawnedEnemies.length;
    const cur = session.currentEnemyIdx + 1;
    ffPhaseLabel = `【スポーン ${cur}/${total}体】`;
  } else if (session.phase === 'done') {
    ffPhaseLabel = '【戦闘終了】';
  }

  // ── ドロップ変換 ──
  const drops = session.drops.map(d => ({ name: d.displayName || d.itemId, amount: d.amount }));

  // ── ターン変換（FF: 'enemy' → UI: 'monster' と同等として処理） ──
  const turn: BattleTurn = session.turn === 'result' ? 'result'
    : session.turn === 'enemy' ? 'monster'
    : 'player';

  return (
    <UnifiedBattleUI
      enemies={enemies}
      playerHp={session.playerHp}
      playerMaxHp={session.playerMaxHp}
      turn={turn}
      result={session.result}
      log={log}
      onAttack={onPlayerAttack}
      onEscape={onEscape}
      onClose={onClose}
      expGained={session.expGained}
      goldGained={session.goldGained}
      drops={drops}
      battleTitle="⚔️ フィールドバトル"
      ffPhaseLabel={ffPhaseLabel}
    />
  );
}

// ──────────────────
// ヘルパー
// ──────────────────

/** FFBattleSession から BattleEnemyDisplay[] を生成 */
function buildEnemyDisplayList(session: FFBattleSession): BattleEnemyDisplay[] {
  if (session.phase === 'trigger') {
    const def = FFGG_ALL_ENEMIES[session.triggerEnemyId];
    return [{
      id: session.triggerEnemyId,
      name: def?.name ?? session.triggerEnemyId,
      hp: session.triggerEnemyHp,
      maxHp: session.triggerEnemyMaxHp,
      isDead: session.triggerEnemyHp <= 0,
      isBoss: (def as any)?.isBoss ?? false,
    }];
  }

  if (session.phase === 'spawn') {
    return session.spawnedEnemies.map((e, i) => ({
      id: `${e.defId}_${i}`,
      name: e.name,
      hp: e.hp,
      maxHp: e.maxHp,
      isDead: e.hp <= 0,
      // 現在ターゲット以外は薄く表示
      isBoss: false,
    }));
  }

  // done フェーズ：最後の敵を表示（全滅済み）
  if (session.spawnedEnemies.length > 0) {
    return session.spawnedEnemies.map((e, i) => ({
      id: `${e.defId}_${i}`,
      name: e.name,
      hp: 0,
      maxHp: e.maxHp,
      isDead: true,
    }));
  }

  const def = FFGG_ALL_ENEMIES[session.triggerEnemyId];
  return [{
    id: session.triggerEnemyId,
    name: def?.name ?? session.triggerEnemyId,
    hp: 0,
    maxHp: session.triggerEnemyMaxHp,
    isDead: true,
  }];
}

/** ログ文字列からカラーを推定（ダンジョン側と色調を揃える） */
function logLineColor(line: string): string {
  if (line.includes('💥') || line.includes('✅') || line.includes('🎉') || line.includes('💀') && line.includes('倒')) {
    return '#4caf87'; // 緑：プレイヤー有利
  }
  if (line.includes('🗡️') || line.includes('💔') || line.includes('ダメージ受')) {
    return '#e05555'; // 赤：被ダメ
  }
  if (line.includes('💨') || line.includes('逃')) {
    return '#f0a830'; // 黄：逃走
  }
  if (line.includes('✨') || line.includes('EXP') || line.includes('Gold')) {
    return '#f0c060'; // 金：報酬
  }
  if (line.includes('👾') || line.includes('スポーン')) {
    return '#9b6df0'; // 紫：スポーン
  }
  return '#b0b8d0'; // デフォルト
}
