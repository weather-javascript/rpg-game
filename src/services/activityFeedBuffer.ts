/**
 * activityFeedBuffer.ts
 *
 * 再利用可能なアクティビティフィード用バッファサービス。
 * - 30秒ごとに定期flush
 * - バッファが15件以上になったら即flush
 * - beforeunload / visibilitychange でflush
 * - localStorageにバッファを永続化し、リロード後に復元
 * - 多重flush防止（isFlushingフラグ）
 */

import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import type { ActivityFeedEntry } from './multiplayer';

// ============================================================
// 定数
// ============================================================
const LS_KEY = 'activityFeedBuffer_v1';
const FLUSH_INTERVAL_MS = 30_000;
const FLUSH_THRESHOLD = 15;
const FEED_MAX = 100;
const FEED_REF = () => doc(db, 'shared', 'activity_feed');

// ============================================================
// 状態
// ============================================================
let _buffer: ActivityFeedEntry[] = [];
let _flushTimer: ReturnType<typeof setInterval> | null = null;
let _isFlushing = false;
let _initialized = false;

// ============================================================
// localStorage ヘルパー
// ============================================================
function _saveToLocalStorage(): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(_buffer));
  } catch (e) {
    console.warn('[ActivityFeedBuffer] localStorage書き込み失敗:', e);
  }
}

function _loadFromLocalStorage(): ActivityFeedEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ActivityFeedEntry[];
  } catch (e) {
    console.warn('[ActivityFeedBuffer] localStorage読み込み失敗:', e);
    return [];
  }
}

function _clearLocalStorage(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch (e) {
    console.warn('[ActivityFeedBuffer] localStorage削除失敗:', e);
  }
}

// ============================================================
// Firestore flush
// ============================================================
async function _flush(): Promise<void> {
  if (_isFlushing) return;
  if (_buffer.length === 0) return;

  _isFlushing = true;
  const toWrite = [..._buffer];
  _buffer = [];
  _clearLocalStorage();

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(FEED_REF());
      const prev: ActivityFeedEntry[] = snap.exists()
        ? ((snap.data()['entries'] ?? []) as ActivityFeedEntry[])
        : [];
      const next = [...toWrite, ...prev].slice(0, FEED_MAX);
      tx.set(FEED_REF(), { entries: next, updatedAt: Date.now() });
    });
  } catch (e) {
    console.error('[ActivityFeedBuffer] Firestoreへの書き込みに失敗しました:', e);
    // 失敗したエントリをバッファへ戻す（データロスト防止）
    _buffer = [...toWrite, ..._buffer];
    _saveToLocalStorage();
  } finally {
    _isFlushing = false;
  }
}

// ============================================================
// beforeunload / visibilitychange ハンドラ
// ============================================================
function _handleBeforeUnload(): void {
  if (_buffer.length === 0) return;
  // 同期的に保存（非同期flushは間に合わないためlocalStorageのみ確実に保存）
  _saveToLocalStorage();
  // ベストエフォートで非同期flush（ブラウザが許す限り）
  _flush().catch(() => {});
}

function _handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    _saveToLocalStorage();
    _flush().catch(() => {});
  }
}

// ============================================================
// 初期化
// ============================================================
function _init(): void {
  if (_initialized) return;
  _initialized = true;

  // localStorageから未送信バッファを復元
  const restored = _loadFromLocalStorage();
  if (restored.length > 0) {
    console.info(`[ActivityFeedBuffer] ${restored.length}件のバッファを復元しました`);
    _buffer = [...restored, ..._buffer];
    // 復元後すぐにflushを試みる
    _flush().catch(() => {});
  }

  // 定期flush（30秒ごと）
  _flushTimer = setInterval(() => {
    _flush().catch(() => {});
  }, FLUSH_INTERVAL_MS);

  // ページ離脱時
  window.addEventListener('beforeunload', _handleBeforeUnload);
  // タブ非表示時
  document.addEventListener('visibilitychange', _handleVisibilityChange);
}

// ============================================================
// 公開API
// ============================================================

/**
 * アクティビティをバッファに追加する。
 * 複数の機能から共通で呼び出せる再利用可能な関数。
 */
export function enqueueActivityFeed(entry: Omit<ActivityFeedEntry, 'timestamp'>): void {
  _init();

  _buffer.unshift({ ...entry, timestamp: Date.now() });
  _saveToLocalStorage();

  // 15件以上になったら即flush
  if (_buffer.length >= FLUSH_THRESHOLD) {
    _flush().catch(() => {});
  }
}

/**
 * バッファを手動でflushする（コンポーネントのアンマウント時などに使用）。
 */
export async function flushActivityFeed(): Promise<void> {
  await _flush();
}

/**
 * バッファサービスを破棄する（テスト用・SSR対策）。
 */
export function destroyActivityFeedBuffer(): void {
  if (_flushTimer !== null) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
  window.removeEventListener('beforeunload', _handleBeforeUnload);
  document.removeEventListener('visibilitychange', _handleVisibilityChange);
  _initialized = false;
  _buffer = [];
}
