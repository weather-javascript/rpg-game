// src/services/multiplayer.ts
// オンラインプレイヤー・チャット・オークション・ジャックポットのFirestore通信。
// onSnapshot はこのファイルで使用を完結させる。

import {
  doc, setDoc, deleteDoc, collection, query, orderBy, limit,
  onSnapshot, addDoc, getDoc, updateDoc, where, Unsubscribe, increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { OnlineUser, BoardMessage, AuctionListing } from '../types/game';
import { calcJackpotContrib, rollJackpot } from '../systems/minigames';

const COLLECTIONS = {
  ONLINE:   'online_users',
  BOARD:    'board_messages',
  AUCTIONS: 'auctions',
  JACKPOT:  'shared/jackpot',
} as const;

// ============================================================
// オンラインプレイヤー管理
// ============================================================
export async function registerOnline(uid: string, displayName: string, level: number) {
  await setDoc(doc(db, COLLECTIONS.ONLINE, uid), {
    uid, displayName, level, lastSeen: Date.now(),
  });
}

export async function unregisterOnline(uid: string) {
  await deleteDoc(doc(db, COLLECTIONS.ONLINE, uid));
}

export function subscribeOnlineUsers(cb: (users: OnlineUser[]) => void): Unsubscribe {
  const cutoff = Date.now() - 5 * 60 * 1000; // 5分以内をオンライン判定
  const q = query(
    collection(db, COLLECTIONS.ONLINE),
    where('lastSeen', '>', cutoff),
    orderBy('lastSeen', 'desc'),
    limit(50),
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => d.data() as OnlineUser));
  });
}

// ============================================================
// 掲示板
// ============================================================
export async function postBoardMessage(uid: string, displayName: string, level: number, text: string) {
  await addDoc(collection(db, COLLECTIONS.BOARD), {
    uid, displayName, level, text: text.slice(0, 100), createdAt: Date.now(),
  });
}

export function subscribeBoardMessages(cb: (msgs: BoardMessage[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.BOARD), orderBy('createdAt', 'desc'), limit(30));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<BoardMessage,'id'>) })));
  });
}

// ============================================================
// オークション
// ============================================================
export async function createAuction(listing: Omit<AuctionListing,'id'|'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.AUCTIONS), {
    ...listing, createdAt: Date.now(),
  });
  return ref.id;
}

export async function buyAuction(
  listingId: string, buyerUid: string, buyerGold: number
): Promise<{ success: boolean; listing: AuctionListing | null }> {
  const ref = doc(db, COLLECTIONS.AUCTIONS, listingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, listing: null };
  const listing = { id: snap.id, ...(snap.data() as Omit<AuctionListing,'id'>) };
  if (listing.sellerUid === buyerUid) return { success: false, listing };
  const totalCost = listing.pricePerUnit * listing.amount;
  if (buyerGold < totalCost) return { success: false, listing };
  await deleteDoc(ref);

  // 出品者のgoldをFirestoreで直接加算
  try {
    const sellerRef = doc(db, 'players', listing.sellerUid);
    await updateDoc(sellerRef, { gold: increment(totalCost) });
  } catch {
    // 出品者データ更新失敗は購入処理自体は成功とする
  }

  // 出品者への売却通知をFirestoreに書き込む
  try {
    await addDoc(collection(db, 'sold_notifications'), {
      sellerUid: listing.sellerUid,
      itemId: listing.itemId,
      amount: listing.amount,
      totalGold: totalCost,
      createdAt: Date.now(),
      read: false,
    });
  } catch {
    // 通知書き込み失敗は無視
  }

  return { success: true, listing };
}

export async function cancelAuction(listingId: string, sellerUid: string): Promise<boolean> {
  const ref = doc(db, COLLECTIONS.AUCTIONS, listingId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data()['sellerUid'] !== sellerUid) return false;
  await deleteDoc(ref);
  return true;
}

export function subscribeAuctions(cb: (listings: AuctionListing[]) => void): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.AUCTIONS),
    where('expiresAt', '>', Date.now()),
    orderBy('expiresAt', 'asc'),
    limit(50),
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AuctionListing,'id'>) })));
  });
}

// ============================================================
// 売却通知（出品者へのリアルタイム通知）
// ============================================================
export function subscribeSoldNotifications(
  uid: string,
  cb: (notifications: { id: string; itemId: string; amount: number; totalGold: number }[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'sold_notifications'),
    where('sellerUid', '==', uid),
    where('read', '==', false),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({
      id: d.id,
      itemId: d.data()['itemId'] as string,
      amount: d.data()['amount'] as number,
      totalGold: d.data()['totalGold'] as number,
    })));
  });
}

export async function markSoldNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'sold_notifications', notificationId), { read: true });
}

// ============================================================
// ジャックポット（共有プール）
// ============================================================
const jackpotRef = () => doc(db, 'shared', 'jackpot');

export async function getJackpotPool(): Promise<number> {
  const snap = await getDoc(jackpotRef());
  return snap.exists() ? (snap.data()['pool'] as number ?? 0) : 0;
}

export function subscribeJackpotPool(cb: (pool: number) => void): Unsubscribe {
  return onSnapshot(jackpotRef(), snap => {
    cb(snap.exists() ? (snap.data()['pool'] as number ?? 0) : 0);
  });
}

export async function contributeAndRollJackpot(
  bet: number
): Promise<{ won: boolean; pool: number }> {
  const contrib = calcJackpotContrib(bet);
  const ref = jackpotRef();
  // プールに積立
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { pool: increment(contrib) });
  } else {
    await setDoc(ref, { pool: contrib });
  }
  const currentSnap = await getDoc(ref);
  const pool: number = currentSnap.exists() ? (currentSnap.data()['pool'] as number) : 0;
  const won = rollJackpot();
  if (won) {
    await setDoc(ref, { pool: 0 }); // 当選でリセット
  }
  return { won, pool };
}
