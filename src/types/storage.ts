// src/types/storage.ts

export const CHEST_SLOTS = 27;
export const CHEST_COST = 10000;

export type ChestColor =
  | 'default' | 'red' | 'orange' | 'yellow'
  | 'green' | 'blue' | 'purple' | 'pink' | 'dark';

export const CHEST_COLOR_MAP: Record<ChestColor, { bg: string; border: string; label: string }> = {
  default: { bg: '#1c2235', border: '#2d3752',  label: 'デフォルト' },
  red:     { bg: '#2a1515', border: '#7a2020',  label: '赤' },
  orange:  { bg: '#2a1e10', border: '#8a5020',  label: 'オレンジ' },
  yellow:  { bg: '#282210', border: '#8a7a10',  label: '黄' },
  green:   { bg: '#122215', border: '#2a7040',  label: '緑' },
  blue:    { bg: '#101828', border: '#2050a0',  label: '青' },
  purple:  { bg: '#1a1030', border: '#6030a0',  label: '紫' },
  pink:    { bg: '#2a1020', border: '#902060',  label: 'ピンク' },
  dark:    { bg: '#0d0d0d', border: '#444',     label: '黒' },
};

/** スロット1つ分 */
export interface ChestSlot {
  itemId: string;
  amount: number;
}

/**
 * Firestore: chests/{chestId}
 */
export interface Chest {
  id: string;
  ownerUid: string;
  ownerName: string;
  name: string;
  icon: string;           // 絵文字
  color: ChestColor;
  isShared: boolean;
  /** isShared=true のとき、取り出し可能な uid 一覧（空 = 全員） */
  allowedUids: string[];
  /** 27スロット。空スロットは undefined */
  slots: (ChestSlot | null)[];
  createdAt: number;
  updatedAt: number;
}
