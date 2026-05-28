// src/hooks/useAutoSave.ts
// 一定間隔で自動セーブを実行するフック。

import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

const AUTO_SAVE_INTERVAL_MS = 5 * 60 * 1000; // 5分ごと

export function useAutoSave() {
  const { player, saveGame } = useGameStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!player) return;

    intervalRef.current = setInterval(() => {
      saveGame();
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [player, saveGame]);
}
