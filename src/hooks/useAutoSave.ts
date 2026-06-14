// src/hooks/useAutoSave.ts
// 自動セーブ・localStorage バックアップ・ページ離脱時保存を実装。

import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { savePlayer } from '../services/database';
import { db } from '../services/firebase';
import { doc } from 'firebase/firestore';
import type { PlayerData } from '../types/game';
import { startSaveBufferInterval, stopSaveBufferInterval, flushSaveBuffer } from '../services/saveBuffer';

const AUTO_SAVE_INTERVAL_MS = 15 * 1000; // 15秒ごと
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

  // saveBufferの15秒インターバルを開始・停止
  useEffect(() => {
    if (!player?.uid) return;
    startSaveBufferInterval();
    return () => stopSaveBufferInterval();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.uid]);

  // 保存処理（isSaving フラグ付き）
  const doSave = async (p: PlayerData, silent = true) => {
    if (isSavingRef.current) return;
    // 管理者が10秒以内に強制上書きした場合はローカル保存のみ行い、Firebaseへの書き込みをスキップ
    const adminOverrideAt = (p as PlayerData & { adminOverrideAt?: number }).adminOverrideAt ?? 0;
    const adminOverrideRecent = Date.now() - adminOverrideAt < 30_000;
    if (adminOverrideRecent) {
      backupToLocalStorage(p);
      return;
    }
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

  // 管理者によるFirestore上書きをポーリングで検知してローカルstateに反映（5分に1回）
  useEffect(() => {
    if (!player?.uid) return;
    const ref = doc(db, 'players', player.uid);
    let stopped = false;
    const check = async () => {
      if (stopped) return;
      try {
        const { getDoc } = await import('firebase/firestore');
        const snap = await getDoc(ref);
        if (!snap.exists() || stopped) return;
        const data = snap.data() as PlayerData & { adminOverrideAt?: number };
        if (!data.adminOverrideAt) return;
        const latest = useGameStore.getState().player;
        const localOverride = (latest as PlayerData & { adminOverrideAt?: number })?.adminOverrideAt ?? 0;
        if (data.adminOverrideAt > localOverride) {
          useGameStore.setState({ player: { ...(latest ?? {}), ...data } as PlayerData });
        }
      } catch { /* ignore */ }
    };
    check();
    const timer = setInterval(check, 5 * 60 * 1000); // 5分ポーリング
    return () => { stopped = true; clearInterval(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.uid]);

  // ページ離脱時
  useEffect(() => {
    if (!player) return;
    const handler = () => {
      const latest = useGameStore.getState().player;
      if (latest) backupToLocalStorage(latest); // 同期的にローカル保存
      // バッファに溜まった釣りデータをFlush試行
      flushSaveBuffer().catch(() => {});
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [player?.uid]);
}

