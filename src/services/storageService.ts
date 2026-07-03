// src/services/storageService.ts

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, addDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Chest, ChestLog, ChestColor } from '../types/storage';
import { CHEST_SLOTS, CHEST_STACK_LIMIT } from '../types/storage';

const COL       = 'chests';
const LOG_COL   = 'chest_logs';

// ============================================================
// ユーティリティ
// ============================================================

/** パスワードを SHA-256 でハッシュ化 */
export async function hashPassword(pw: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export function canWithdraw(chest: Chest, uid: string): boolean {
  if (chest.ownerUid === uid) return true;
  if (!chest.isShared) return false;
  if (chest.allowedUids.length === 0) return true;
  return chest.allowedUids.includes(uid);
}

export function getSlotCount(chest: Chest): number {
  return chest.expanded ? 54 : CHEST_SLOTS;
}

// ============================================================
// 購読
// ============================================================

export function subscribeMyChests(uid: string, cb: (chests: Chest[]) => void): Unsubscribe {
  const q = query(collection(db, COL), where('ownerUid', '==', uid), orderBy('sortOrder', 'asc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chest)));
  });
}

export function subscribeSharedChests(cb: (chests: Chest[]) => void): Unsubscribe {
  const q = query(collection(db, COL), where('isShared', '==', true), orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chest)));
  });
}

export function subscribeChestLogs(chestId: string, cb: (logs: ChestLog[]) => void): Unsubscribe {
  const q = query(collection(db, LOG_COL), where('chestId', '==', chestId), orderBy('at', 'desc'), limit(50));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChestLog)));
  });
}

export async function fetchAllPlayers(): Promise<{ uid: string; displayName: string }[]> {
  const snap = await getDocs(collection(db, 'players'));
  return snap.docs
    .map(d => ({ uid: d.id, displayName: (d.data().displayName as string) || d.id }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

// ============================================================
// ログ書き込み（内部）
// ============================================================

async function writeLog(
  chest: Chest,
  actorUid: string, actorName: string,
  action: ChestLog['action'],
  itemId: string, itemName: string,
  amount: number, slotIdx: number,
): Promise<void> {
  if (!chest.isShared) return;  // 個人チェストはログ不要
  try {
    const log: Omit<ChestLog, 'id'> = {
      chestId: chest.id, chestName: chest.name,
      actorUid, actorName, action,
      itemId, itemName, amount, slotIdx,
      at: Date.now(),
    };
    await addDoc(collection(db, LOG_COL), log);
  } catch { /* ログ失敗は無視 */ }
}

// ============================================================
// 作成 / 削除 / 設定
// ============================================================

export async function createChest(
  ownerUid: string, ownerName: string,
  name: string, icon: string, color: ChestColor,
  isShared: boolean, allowedUids: string[],
  password: string, sortOrder: number,
): Promise<{ success: boolean; chestId?: string; error?: string }> {
  try {
    const chestId = `chest_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const now = Date.now();
    const passwordHash = password ? await hashPassword(password) : undefined;
    const chest: Omit<Chest,'id'> = {
      ownerUid, ownerName, name, icon, color, isShared, allowedUids,
      passwordHash,
      slots: Array(CHEST_SLOTS).fill(null),
      expanded: false,
      sortOrder,
      createdAt: now, updatedAt: now,
    };
    await setDoc(doc(db, COL, chestId), chest);
    return { success: true, chestId };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteChest(chestId: string): Promise<boolean> {
  try { await deleteDoc(doc(db, COL, chestId)); return true; } catch { return false; }
}

export async function updateChestSettings(
  chestId: string,
  patch: Partial<Pick<Chest,'name'|'icon'|'color'|'isShared'|'allowedUids'|'passwordHash'>>,
): Promise<boolean> {
  try {
    await updateDoc(doc(db, COL, chestId), { ...patch, updatedAt: Date.now() });
    return true;
  } catch { return false; }
}

export async function updateSortOrders(updates: { id: string; sortOrder: number }[]): Promise<void> {
  await Promise.all(updates.map(u => updateDoc(doc(db, COL, u.id), { sortOrder: u.sortOrder })));
}

export async function expandChest(chestId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, COL, chestId), { expanded: true, updatedAt: Date.now() });
    return true;
  } catch { return false; }
}

// ============================================================
// アイテム操作
// ============================================================

export async function depositToChest(
  chest: Chest,
  slotIdx: number, itemId: string, amount: number,
  actorUid: string, actorName: string, itemName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const ref = doc(db, COL, chest.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: false, error: 'チェストが見つかりません' };
    const fresh = { id: snap.id, ...snap.data() } as Chest;
    const slots = [...fresh.slots];
    const existing = slots[slotIdx];
    if (existing && existing.itemId !== itemId)
      return { success: false, error: 'そのスロットには別のアイテムが入っています' };
    const newAmount = (existing?.amount ?? 0) + amount;
    if (newAmount > CHEST_STACK_LIMIT)
      return { success: false, error: `スタック上限(${CHEST_STACK_LIMIT})を超えます` };
    slots[slotIdx] = { itemId, amount: newAmount, pinned: existing?.pinned };
    await updateDoc(ref, { slots, updatedAt: Date.now() });
    await writeLog(fresh, actorUid, actorName, 'deposit', itemId, itemName, amount, slotIdx);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function withdrawFromChest(
  chest: Chest, slotIdx: number, amount: number,
  actorUid: string, actorName: string, itemName: string,
): Promise<{ success: boolean; itemId?: string; amount?: number; error?: string }> {
  try {
    const ref = doc(db, COL, chest.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: false, error: 'チェストが見つかりません' };
    const fresh = { id: snap.id, ...snap.data() } as Chest;
    const slots = [...fresh.slots];
    const slot = slots[slotIdx];
    if (!slot) return { success: false, error: 'スロットが空です' };
    const take = Math.min(amount, slot.amount);
    const remaining = slot.amount - take;
    slots[slotIdx] = remaining > 0 ? { itemId: slot.itemId, amount: remaining, pinned: slot.pinned } : null;
    await updateDoc(ref, { slots, updatedAt: Date.now() });
    await writeLog(fresh, actorUid, actorName, 'withdraw', slot.itemId, itemName, take, slotIdx);
    return { success: true, itemId: slot.itemId, amount: take };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function moveSlot(chestId: string, fromIdx: number, toIdx: number): Promise<boolean> {
  try {
    const ref = doc(db, COL, chestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const chest = { id: snap.id, ...snap.data() } as Chest;
    const slots = [...chest.slots];
    const from = slots[fromIdx];
    const to = slots[toIdx];
    if (from && to && from.itemId === to.itemId) {
      const merged = from.amount + to.amount;
      if (merged > CHEST_STACK_LIMIT) {
        // 上限超え → 移動元に溢れた分を残す
        slots[toIdx]   = { ...to, amount: CHEST_STACK_LIMIT };
        slots[fromIdx] = { ...from, amount: merged - CHEST_STACK_LIMIT };
      } else {
        slots[toIdx]   = { ...to, amount: merged };
        slots[fromIdx] = null;
      }
    } else {
      slots[fromIdx] = to;
      slots[toIdx] = from;
    }
    await updateDoc(ref, { slots, updatedAt: Date.now() });
    return true;
  } catch { return false; }
}

/** チェスト間移動 */
export async function moveAcrossChests(
  fromChestId: string, fromSlotIdx: number,
  toChestId: string, toSlotIdx: number,
  _actorUid: string, _actorName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const [fromSnap, toSnap] = await Promise.all([
      getDoc(doc(db, COL, fromChestId)),
      getDoc(doc(db, COL, toChestId)),
    ]);
    if (!fromSnap.exists() || !toSnap.exists()) return { success: false, error: 'チェストが見つかりません' };
    const fromChest = { id: fromSnap.id, ...fromSnap.data() } as Chest;
    const toChest   = { id: toSnap.id,   ...toSnap.data()   } as Chest;
    const fromSlots = [...fromChest.slots];
    const toSlots   = [...toChest.slots];
    const item = fromSlots[fromSlotIdx];
    if (!item) return { success: false, error: '移動元スロットが空です' };
    const dest = toSlots[toSlotIdx];
    if (dest && dest.itemId !== item.itemId) return { success: false, error: '移動先に別のアイテムがあります' };
    const newAmt = (dest?.amount ?? 0) + item.amount;
    if (newAmt > CHEST_STACK_LIMIT) return { success: false, error: `スタック上限(${CHEST_STACK_LIMIT})を超えます` };
    toSlots[toSlotIdx]     = { itemId: item.itemId, amount: newAmt, pinned: dest?.pinned };
    fromSlots[fromSlotIdx] = null;
    await Promise.all([
      updateDoc(doc(db, COL, fromChestId), { slots: fromSlots, updatedAt: Date.now() }),
      updateDoc(doc(db, COL, toChestId),   { slots: toSlots,   updatedAt: Date.now() }),
    ]);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function togglePin(chestId: string, slotIdx: number): Promise<boolean> {
  try {
    const ref = doc(db, COL, chestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const chest = { id: snap.id, ...snap.data() } as Chest;
    const slots = [...chest.slots];
    const slot = slots[slotIdx];
    if (!slot) return false;
    slots[slotIdx] = { ...slot, pinned: !slot.pinned };
    await updateDoc(ref, { slots, updatedAt: Date.now() });
    return true;
  } catch { return false; }
}

export async function verifyPassword(chest: Chest, input: string): Promise<boolean> {
  if (!chest.passwordHash) return true;
  const hash = await hashPassword(input);
  return hash === chest.passwordHash;
}
