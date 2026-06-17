// src/components/wiki/wikiMasterBridge.ts
// 既存のゲームマスタデータ（ITEM_MASTER / MONSTER_MASTER / DUNGEON_MASTER）を
// WIKIのアイコン挿入UI・自動テンプレート生成で再利用するための橋渡しモジュール。
// 画像アセットは新規追加せず、既存の icon フィールドのみを参照する。

import { ITEM_MASTER, MONSTER_MASTER, DUNGEON_MASTER } from '../../data/masters';
import type { WikiCategory } from '../../types/wiki';

export interface IconCandidate {
  iconId: string;            // GameIconに渡すid
  sourceType: 'item' | 'monster' | 'dungeon';
  refId: string;             // マスタID
  label: string;             // 表示名
  sub?: string;               // 補足（カテゴリ名など）
}

function itemCategoryLabel(category: string): string {
  switch (category) {
    case 'weapon': return '武器';
    case 'armor': return '防具';
    case 'material': return '素材';
    default: return 'アイテム';
  }
}

export function getAllIconCandidates(): IconCandidate[] {
  const items: IconCandidate[] = Object.values(ITEM_MASTER).map(it => ({
    iconId: it.icon,
    sourceType: 'item',
    refId: it.id,
    label: it.name,
    sub: itemCategoryLabel(it.category),
  }));
  const monsters: IconCandidate[] = Object.values(MONSTER_MASTER).map(m => ({
    iconId: m.icon,
    sourceType: 'monster',
    refId: m.id,
    label: m.name,
    sub: 'モンスター',
  }));
  const dungeons: IconCandidate[] = Object.values(DUNGEON_MASTER).map(d => ({
    iconId: d.icon,
    sourceType: 'dungeon',
    refId: d.id,
    label: d.name,
    sub: 'ダンジョン',
  }));
  return [...items, ...monsters, ...dungeons];
}

export function searchIconCandidates(keyword: string, filter?: 'item' | 'weapon' | 'armor' | 'material' | 'monster' | 'dungeon' | 'all'): IconCandidate[] {
  const all = getAllIconCandidates();
  const kw = keyword.trim().toLowerCase();

  let filtered = all;
  if (filter && filter !== 'all') {
    if (filter === 'monster') filtered = all.filter(c => c.sourceType === 'monster');
    else if (filter === 'dungeon') filtered = all.filter(c => c.sourceType === 'dungeon');
    else {
      // item/weapon/armor/material は ITEM_MASTER の category に対応
      filtered = all.filter(c => {
        if (c.sourceType !== 'item') return false;
        const master = ITEM_MASTER[c.refId];
        if (!master) return false;
        if (filter === 'item') return true;
        return master.category === filter;
      });
    }
  }

  if (!kw) return filtered.slice(0, 60);
  return filtered.filter(c => c.label.toLowerCase().includes(kw) || c.refId.toLowerCase().includes(kw)).slice(0, 60);
}

export function getIconCandidateByRef(sourceType: 'item' | 'monster' | 'dungeon', refId: string): IconCandidate | null {
  if (sourceType === 'item') {
    const it = ITEM_MASTER[refId];
    if (!it) return null;
    return { iconId: it.icon, sourceType, refId, label: it.name, sub: itemCategoryLabel(it.category) };
  }
  if (sourceType === 'monster') {
    const m = MONSTER_MASTER[refId];
    if (!m) return null;
    return { iconId: m.icon, sourceType, refId, label: m.name, sub: 'モンスター' };
  }
  const d = DUNGEON_MASTER[refId];
  if (!d) return null;
  return { iconId: d.icon, sourceType, refId, label: d.name, sub: 'ダンジョン' };
}

// 進行度に応じたおすすめページ用：プレイヤーレベルから推奨ダンジョンIDを返す
export function recommendDungeonIdForLevel(level: number): string | null {
  const sorted = Object.values(DUNGEON_MASTER)
    .filter(d => typeof d.requiredLevel === 'number')
    .sort((a, b) => (a.requiredLevel ?? 0) - (b.requiredLevel ?? 0));
  let candidate: string | null = null;
  for (const d of sorted) {
    if ((d.requiredLevel ?? 0) <= level + 5) candidate = d.id;
  }
  return candidate ?? sorted[0]?.id ?? null;
}

// アイテム/ダンジョン専用ページの自動カテゴリ判定
export function categoryForItem(itemCategory: string): WikiCategory {
  if (itemCategory === 'weapon') return 'weapon';
  if (itemCategory === 'armor') return 'armor';
  if (itemCategory === 'material') return 'material';
  return 'item';
}
