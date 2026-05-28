// src/hooks/useAuth.ts
// Firebase Authentication の匿名ログインを管理するフック。

import { useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { loadOrCreatePlayer } from '../services/database';
import { useGameStore } from '../stores/gameStore';

export function useAuth() {
  const { setUid, setPlayer, setAuthLoading } = useGameStore();

  useEffect(() => {
    // Firebase Auth の状態変化を購読
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ログイン済み：プレイヤーデータをロード
        setUid(user.uid);
        try {
          const playerData = await loadOrCreatePlayer(user.uid);
          setPlayer(playerData);
        } catch (err) {
          console.error('Failed to load player:', err);
        }
      } else {
        // 未ログイン：匿名ログインを試みる
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged が再度発火し、上記の if(user) ブロックへ移行する
        } catch (err) {
          console.error('Anonymous sign-in failed:', err);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setUid, setPlayer, setAuthLoading]);
}
