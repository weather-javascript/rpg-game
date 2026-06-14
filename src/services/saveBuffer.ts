// src/services/saveBuffer.ts
// Firestoreへの書き込みを15秒バッファリングする。
// 釣りを何度やっても、15秒に1回だけFirestoreへ書き込む。

import { useGameStore } from '../stores/gameStore';
import { savePlayer } from './database';
import { backupToLocalStorage } from '../hooks/useAutoSave';

const FLUSH_INTERVAL_MS = 15_000;

let flushTimer: ReturnType<typeof setInterval> | null = null;
let isDirty = false;
let isFlushing = false;

/** 保存が必要なことをマークする（即時書き込みしない） */
export function queueSave(): void {
  isDirty = true;
}

/** バッファをFlushしてFirestoreへ書き込む */
export async function flushSaveBuffer(): Promise<void> {
  if (!isDirty || isFlushing) return;
  const player = useGameStore.getState().player;
  if (!player) return;

  // admin override中はFirestoreへ書かない
  const adminOverrideAt = (player as any).adminOverrideAt ?? 0;
  if (Date.now() - adminOverrideAt < 30_000) {
    backupToLocalStorage(player);
    isDirty = false;
    return;
  }

  isFlushing = true;
  isDirty = false;
  useGameStore.setState({ isSaving: true });
  try {
    backupToLocalStorage(player);
    await savePlayer(player);
    useGameStore.setState({ lastSaveTime: Date.now() });
    // サイレント保存（通知なし）
  } catch (e) {
    console.error('[saveBuffer] Firestore保存失敗:', e);
    isDirty = true; // 失敗したら次回再試行
  } finally {
    isFlushing = false;
    useGameStore.setState({ isSaving: false });
  }
}

/** 15秒インターバルを開始する（アプリ起動時に1回呼ぶ） */
export function startSaveBufferInterval(): void {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flushSaveBuffer();
  }, FLUSH_INTERVAL_MS);
}

/** インターバルを停止する */
export function stopSaveBufferInterval(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}
