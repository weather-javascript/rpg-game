// src/hooks/useAutoSave.ts
// 自動セーブ・localStorage バックアップ・ページ離脱時保存を実装。

import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { savePlayer } from '../services/database';
import type { PlayerData } from '../types/game';

const AUTO_SAVE_INTERVAL_MS = 30 * 1000; // 30秒ごと
const LS_KEY = 'rpg_backup';

/** localStorage にバックアップ保存（失敗しても無視） */
export function backupToLocalStorage(player: PlayerData): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ data: player, savedAt: Date.now() }));
  } catch { /* quota exceeded 等は無視 */ }
}

/** localStorage からバックアップを読み出す */
export function loadLocalStorageBackup(): { data: PlayerData; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { data: PlayerData; savedAt: number };
  } catch {
    return null;
  }
}

/** localStorage バックアップを削除 */
export function clearLocalStorageBackup(): void {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

export function useAutoSave() {
  const { player, addNotification } = useGameStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSavingRef = useRef(false);

  // 保存処理（isSaving フラグ付き）
  const doSave = async (p: PlayerData, silent = true) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    useGameStore.setState({ isSaving: true });
    try {
      backupToLocalStorage(p); // まずローカルへ
      await savePlayer(p);
      useGameStore.setState({ lastSaveTime: Date.now() });
      if (!silent) addNotification('success', 'ゲームを保存しました');
    } catch (e) {
      console.error('[AutoSave] Firestore 保存失敗:', e);
      // バックアップは残しておく（次回ログイン時に復元可能）
      if (!silent) addNotification('error', 'セーブに失敗しました。ローカルにバックアップしました。');
    } finally {
      isSavingRef.current = false;
      useGameStore.setState({ isSaving: false });
    }
  };

  // 30秒インターバル
  useEffect(() => {
    if (!player) return;
    intervalRef.current = setInterval(() => {
      const latest = useGameStore.getState().player;
      if (latest) doSave(latest);
    }, AUTO_SAVE_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.uid]);

  // ページ離脱時
  useEffect(() => {
    if (!player) return;
    const handler = () => {
      const latest = useGameStore.getState().player;
      if (latest) backupToLocalStorage(latest); // 同期的にローカル保存
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [player?.uid]);
}

