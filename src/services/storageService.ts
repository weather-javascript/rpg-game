// src/services/storageService.ts

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Chest, ChestColor } from '../types/storage';
import { CHEST_SLOTS } from '../types/storage';

const COL = 'chests';

// ============================================================
// 読み取り
// ============================================================

/** 自分のチェスト一覧をリアルタイム購読 */
export function subscribeMyChests(uid: string, cb: (chests: Chest[]) => void): Unsubscribe {
  const q = query(collection(db, COL), where('ownerUid', '==', uid), orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chest)));
  });
}

/** 共有チェスト一覧をリアルタイム購読 */
export function subscribeSharedChests(cb: (chests: Chest[]) => void): Unsubscribe {
  const q = query(collection(db, COL), where('isShared', '==', true), orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chest)));
  });
}

/** 全プレイヤー一覧（共有チェストの許可ユーザー選択に使う） */
export async function fetchAllPlayers(): Promise<{ uid: string; displayName: string }[]> {
  const snap = await getDocs(collection(db, 'players'));
  return snap.docs
    .map(d => ({ uid: d.id, displayName: (d.data().displayName as string) || d.id }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

// ============================================================
// 作成 / 削除
// ============================================================

export async function createChest(
  ownerUid: string,
  ownerName: string,
  name: string,
  icon: string,
  color: ChestColor,
  isShared: boolean,
  allowedUids: string[],
): Promise<{ success: boolean; chestId?: string; error?: string }> {
  try {
    const chestId = `chest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const chest: Omit<Chest, 'id'> = {
      ownerUid, ownerName, name, icon, color, isShared, allowedUids,
      slots: Array(CHEST_SLOTS).fill(null),
      createdAt: now, updatedAt: now,
    };
    await setDoc(doc(db, COL, chestId), chest);
    return { success: true, chestId };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteChest(chestId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COL, chestId));
    return true;
  } catch { return false; }
}

// ============================================================
// アイテム操作
// ============================================================

/** プレイヤーインベントリ → チェストのスロットへ */
export async function depositToChest(
  chestId: string,
  slotIdx: number,
  itemId: string,
  amount: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const ref = doc(db, COL, chestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: false, error: 'チェストが見つかりません' };
    const chest = { id: snap.id, ...snap.data() } as Chest;
    const slots = [...chest.slots];
    const existing = slots[slotIdx];
    if (existing && existing.itemId !== itemId)
      return { success: false, error: 'そのスロットには別のアイテムが入っています' };
    slots[slotIdx] = { itemId, amount: (existing?.amount ?? 0) + amount };
    await updateDoc(ref, { slots, updatedAt: Date.now() });
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/** チェストのスロット → プレイヤーインベントリへ */
export async function withdrawFromChest(
  chestId: string,
  slotIdx: number,
  amount: number,
): Promise<{ success: boolean; itemId?: string; amount?: number; error?: string }> {
  try {
    const ref = doc(db, COL, chestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: false, error: 'チェストが見つかりません' };
    const chest = { id: snap.id, ...snap.data() } as Chest;
    const slots = [...chest.slots];
    const slot = slots[slotIdx];
    if (!slot) return { success: false, error: 'スロットが空です' };
    const take = Math.min(amount, slot.amount);
    const remaining = slot.amount - take;
    slots[slotIdx] = remaining > 0 ? { itemId: slot.itemId, amount: remaining } : null;
    await updateDoc(ref, { slots, updatedAt: Date.now() });
    return { success: true, itemId: slot.itemId, amount: take };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/** スロット間移動（同チェスト内） */
export async function moveSlot(
  chestId: string,
  fromIdx: number,
  toIdx: number,
): Promise<boolean> {
  try {
    const ref = doc(db, COL, chestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const chest = { id: snap.id, ...snap.data() } as Chest;
    const slots = [...chest.slots];
    const from = slots[fromIdx];
    const to = slots[toIdx];
    // 同じアイテムならスタック
    if (from && to && from.itemId === to.itemId) {
      slots[toIdx] = { itemId: to.itemId, amount: to.amount + from.amount };
      slots[fromIdx] = null;
    } else {
      slots[fromIdx] = to;
      slots[toIdx] = from;
    }
    await updateDoc(ref, { slots, updatedAt: Date.now() });
    return true;
  } catch { return false; }
}

/** チェスト設定更新（名前・アイコン・色・共有設定） */
export async function updateChestSettings(
  chestId: string,
  patch: Partial<Pick<Chest, 'name' | 'icon' | 'color' | 'isShared' | 'allowedUids'>>,
): Promise<boolean> {
  try {
    await updateDoc(doc(db, COL, chestId), { ...patch, updatedAt: Date.now() });
    return true;
  } catch { return false; }
}

/** ユーザーがこのチェストに対してアクション可能か */
export function canWithdraw(chest: Chest, uid: string): boolean {
  if (chest.ownerUid === uid) return true;
  if (!chest.isShared) return false;
  if (chest.allowedUids.length === 0) return true; // 全員OK
  return chest.allowedUids.includes(uid);
}
