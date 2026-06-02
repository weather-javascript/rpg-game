// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { loadOrCreatePlayer } from '../services/database';
import { registerOnline, unregisterOnline } from '../services/multiplayer';
import { useGameStore } from '../stores/gameStore';

export function useAuth() {
  const { setUid, setPlayer, setAuthLoading } = useGameStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const playerData = await loadOrCreatePlayer(user.uid);
          setPlayer(playerData);
          // オンライン登録
          await registerOnline(user.uid, playerData.displayName, playerData.stats.level);
        } catch (err) {
          console.error('Failed to load player:', err);
        }
      } else {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error('Anonymous sign-in failed:', err);
        }
      }
      setAuthLoading(false);
    });

    // タブを閉じる・リロード時にオンライン登録を削除
    const handleUnload = () => {
      const uid = auth.currentUser?.uid;
      if (uid) unregisterOnline(uid);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [setUid, setPlayer, setAuthLoading]);
}
