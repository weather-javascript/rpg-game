// src/components/screens/CraftingScreen.tsx
// Minecraft風 3×3 クラフトグリッド
import { useState, useEffect, useCallback } from 'react';
import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER, CRAFT_RECIPES } from '../../data/masters';
import type { CraftRecipe } from '../../types/game';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

// ============================================================
// 型
// ============================================================
interface GridCell {
  itemId: string;
  amount: number;
}

const EMPTY_GRID: GridCell[] = Array(9).fill(null).map(() => ({ itemId: '', amount: 0 }));

// ============================================================
// レシピマッチング（shapeがあれば位置一致、なければ位置不問）
// ============================================================
function matchRecipe(grid: GridCell[], recipes: CraftRecipe[]): CraftRecipe | null {
  for (const recipe of recipes) {
    if (recipe.shape && recipe.shape.length === 9) {
      // 位置一致マッチング: shapeの各マスとグリッドを照合
      const match = recipe.shape.every((expected, i) => {
        if (!expected) return !grid[i].itemId; // 空指定は空マスのみOK
        return grid[i].itemId === expected;
      });
      if (match) return recipe;
    } else {
      // 位置不問マッチング（shapeなしレシピの後方互換）
      const used: Record<string, number> = {};
      for (const cell of grid) {
        if (cell.itemId) used[cell.itemId] = (used[cell.itemId] ?? 0) + cell.amount;
      }
      const usedKeys = Object.keys(used).filter(k => used[k] > 0);
      const reqKeys = recipe.inputs.map(i => i.itemId);
      if (reqKeys.length !== usedKeys.length) continue;
      if (!reqKeys.every(k => usedKeys.includes(k))) continue;
      if (recipe.inputs.every(inp => (used[inp.itemId] ?? 0) === inp.amount)) return recipe;
    }
  }
  return null;
}

// ============================================================
// コンポーネント
// ============================================================
export function CraftingScreen() {
  const player = useGameStore(s => s.player);
  const addItems = useGameStore(s => s.addItems);
  const consumeItem = useGameStore(s => s.consumeItem);
  const addSkillExp = useGameStore(s => s.addSkillExp);
  const addNotification = useGameStore(s => s.addNotification);

  const [grid, setGrid] = useState<GridCell[]>(EMPTY_GRID.map(c => ({ ...c })));
  const [selected, setSelected] = useState<{ itemId: string } | null>(null); // インベントリ選択中アイテム
  const [customRecipes, setCustomRecipes] = useState<CraftRecipe[]>([]);
  const [tab, setTab] = useState<'craft' | 'recipes'>('craft');

  // Firestoreからカスタムレシピを購読
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'admin', 'craft_recipes'), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setCustomRecipes(Array.isArray(data.recipes) ? data.recipes : []);
      }
    });
    return unsub;
  }, []);

  const allRecipes = [...CRAFT_RECIPES, ...customRecipes];
  const matchedRecipe = matchRecipe(grid, allRecipes);

  const craftingLevel = player?.skillLevels?.['crafting'] ?? 1;

  // グリッドセルクリック
  const handleCellClick = (idx: number) => {
    const cell = grid[idx];
    if (selected) {
      // 選択中アイテムをセルに置く
      if (cell.itemId === selected.itemId) {
        // 同じアイテム→1個追加
        const inv = player?.inventory ?? {};
        const inGrid = grid.reduce((s, c) => s + (c.itemId === selected.itemId ? c.amount : 0), 0);
        const owned = inv[selected.itemId] ?? 0;
        if (inGrid >= owned) { addNotification('error', 'それ以上置けません'); return; }
        setGrid(prev => prev.map((c, i) => i === idx ? { ...c, amount: c.amount + 1 } : c));
      } else if (!cell.itemId) {
        // 空セル→1個置く
        const inv = player?.inventory ?? {};
        const inGrid = grid.reduce((s, c) => s + (c.itemId === selected.itemId ? c.amount : 0), 0);
        const owned = inv[selected.itemId] ?? 0;
        if (inGrid >= owned) { addNotification('error', 'インベントリにありません'); return; }
        setGrid(prev => prev.map((c, i) => i === idx ? { itemId: selected.itemId, amount: 1 } : c));
      } else {
        // 別のアイテム→セルの内容を回収して置き換え
        setGrid(prev => prev.map((c, i) => i === idx ? { itemId: selected.itemId, amount: 1 } : c));
      }
    } else {
      // 選択なし→セルのアイテムを1個取り除く
      if (!cell.itemId) return;
      setGrid(prev => {
        const next = [...prev];
        const newAmount = next[idx].amount - 1;
        next[idx] = newAmount > 0 ? { ...next[idx], amount: newAmount } : { itemId: '', amount: 0 };
        return next;
      });
    }
  };

  // グリッドリセット
  const clearGrid = () => setGrid(EMPTY_GRID.map(c => ({ ...c })));

  // クラフト実行
  const handleCraft = useCallback(() => {
    if (!matchedRecipe || !player) return;
    if (craftingLevel < matchedRecipe.requiredCraftingLevel) {
      addNotification('error', `製作スキルLv${matchedRecipe.requiredCraftingLevel}が必要です（現在Lv${craftingLevel}）`);
      return;
    }
    // 素材消費
    for (const inp of matchedRecipe.inputs) {
      const ok = consumeItem(inp.itemId, inp.amount);
      if (!ok) { addNotification('error', `${ITEM_MASTER[inp.itemId]?.name ?? inp.itemId} が不足しています`); return; }
    }
    addItems([{ itemId: matchedRecipe.outputItemId, amount: matchedRecipe.outputAmount }]);
    addSkillExp('crafting', matchedRecipe.craftingExpGain);
    const outItem = ITEM_MASTER[matchedRecipe.outputItemId];
    addNotification('success', `✨ ${outItem?.name ?? matchedRecipe.outputItemId} ×${matchedRecipe.outputAmount} を製作しました！`);
    clearGrid();
  }, [matchedRecipe, player, craftingLevel, consumeItem, addItems, addSkillExp, addNotification]);

  if (!player) return null;

  const inv = player.inventory;
  const invItems = Object.entries(inv).filter(([, amt]) => amt > 0);

  // グリッド上のアイテムをIDごとに集計（所持数との比較用）
  const gridUsed: Record<string, number> = {};
  for (const cell of grid) {
    if (cell.itemId) gridUsed[cell.itemId] = (gridUsed[cell.itemId] ?? 0) + cell.amount;
  }

  return (
    <div style={{ padding: '12px 8px 80px' }}>
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', marginBottom: 12, fontSize: '1rem' }}>
        ⚒️ クラフティング
      </h2>

      {/* タブ */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['craft', 'recipes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '6px 14px', background: tab === t ? 'rgba(240,192,96,0.2)' : '#1c2235', border: `1px solid ${tab === t ? '#f0c060' : '#2d3752'}`, color: tab === t ? '#f0c060' : '#8a92b2', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem' }}>
            {t === 'craft' ? '🔨 クラフト台' : '📖 レシピ一覧'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#8a92b2', lineHeight: '32px' }}>
          製作スキル Lv.{craftingLevel}
        </span>
      </div>

      {tab === 'craft' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* 3×3グリッド */}
            <div>
              <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 6 }}>クラフトグリッド</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: 4, marginBottom: 8 }}>
                {grid.map((cell, idx) => (
                  <button key={idx} onClick={() => handleCellClick(idx)}
                    style={{
                      width: 60, height: 60,
                      background: cell.itemId ? 'rgba(91,141,238,0.15)' : '#161b26',
                      border: `2px solid ${cell.itemId ? '#5b8dee' : '#2d3752'}`,
                      borderRadius: 6, cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', padding: 2, position: 'relative',
                    }}>
                    {cell.itemId ? (
                      <>
                        <GameIcon id={ITEM_MASTER[cell.itemId]?.icon ?? 'gem'} size={28} />
                        <span style={{ fontSize: '0.65rem', color: '#f0c060', fontWeight: 700, position: 'absolute', bottom: 3, right: 5 }}>
                          ×{cell.amount}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#2d3752', fontSize: '1.2rem' }}>+</span>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={clearGrid}
                style={{ width: '100%', padding: '4px', background: 'rgba(224,85,85,0.1)', border: '1px solid #e05555', color: '#e05555', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem' }}>
                🗑️ クリア
              </button>
            </div>

            {/* 矢印 + 結果 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 24 }}>
              <span style={{ fontSize: '1.5rem', color: matchedRecipe ? '#4caf87' : '#2d3752' }}>▶</span>
              <div style={{
                width: 70, height: 70,
                background: matchedRecipe ? 'rgba(76,175,135,0.15)' : '#161b26',
                border: `2px solid ${matchedRecipe ? '#4caf87' : '#2d3752'}`,
                borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {matchedRecipe ? (
                  <>
                    <GameIcon id={ITEM_MASTER[matchedRecipe.outputItemId]?.icon ?? 'gem'} size={32} />
                    <span style={{ fontSize: '0.65rem', color: '#f0c060', fontWeight: 700, position: 'absolute', bottom: 4, right: 6 }}>
                      ×{matchedRecipe.outputAmount}
                    </span>
                  </>
                ) : (
                  <span style={{ color: '#2d3752', fontSize: '1.5rem' }}>?</span>
                )}
              </div>
              {matchedRecipe && (
                <div style={{ fontSize: '0.68rem', color: '#4caf87', textAlign: 'center', maxWidth: 80 }}>
                  {ITEM_MASTER[matchedRecipe.outputItemId]?.name}
                </div>
              )}
              <button onClick={handleCraft} disabled={!matchedRecipe}
                style={{
                  padding: '8px 12px',
                  background: matchedRecipe && craftingLevel >= (matchedRecipe.requiredCraftingLevel ?? 1)
                    ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752',
                  color: matchedRecipe ? '#fff' : '#4a5070',
                  border: 'none', borderRadius: 6, cursor: matchedRecipe ? 'pointer' : 'not-allowed',
                  fontWeight: 700, fontSize: '0.82rem',
                }}>
                ⚒️ 製作
              </button>
            </div>
          </div>

          {/* マッチしたレシピ情報 */}
          {matchedRecipe && (
            <div style={{ background: 'rgba(76,175,135,0.1)', border: '1px solid #4caf87', borderRadius: 8, padding: '8px 12px', marginTop: 12, fontSize: '0.78rem' }}>
              <div style={{ color: '#4caf87', fontWeight: 700, marginBottom: 4 }}>✅ {matchedRecipe.name}</div>
              <div style={{ color: '#8a92b2' }}>{matchedRecipe.description}</div>
              <div style={{ color: '#f0c060', marginTop: 4 }}>
                必要Lv: {matchedRecipe.requiredCraftingLevel} | 製作EXP: +{matchedRecipe.craftingExpGain}
              </div>
            </div>
          )}

          {/* ヒント */}
          <div style={{ marginTop: 12, fontSize: '0.72rem', color: '#4a5070', lineHeight: 1.6 }}>
            💡 左のアイテムをタップして選択→グリッドをタップで配置。レシピ通りの位置に置かないとクラフトできません！レシピタブで配置パターンを確認しよう。
          </div>

          {/* インベントリ一覧（選択用） */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.8rem', color: '#8a92b2', marginBottom: 8, fontWeight: 700 }}>📦 所持アイテム（タップで選択）</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {invItems.length === 0 && <div style={{ color: '#4a5070', fontSize: '0.78rem' }}>アイテムなし</div>}
              {invItems.map(([itemId, amt]) => {
                const item = ITEM_MASTER[itemId];
                if (!item) return null;
                const inGrid = gridUsed[itemId] ?? 0;
                const available = amt - inGrid;
                const isSel = selected?.itemId === itemId;
                return (
                  <button key={itemId} onClick={() => setSelected(isSel ? null : { itemId })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                      background: isSel ? 'rgba(91,141,238,0.3)' : '#1c2235',
                      border: `1px solid ${isSel ? '#5b8dee' : '#2d3752'}`,
                      borderRadius: 6, cursor: available > 0 ? 'pointer' : 'not-allowed',
                      color: available > 0 ? '#e8e6ff' : '#4a5070', fontSize: '0.75rem',
                      opacity: available > 0 ? 1 : 0.5,
                    }}>
                    <GameIcon id={item.icon} size={18} />
                    <span>{item.name}</span>
                    <span style={{ color: '#f0c060', fontWeight: 700 }}>×{available}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'recipes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allRecipes.map(recipe => {
            const outItem = ITEM_MASTER[recipe.outputItemId];
            const canCraft = craftingLevel >= recipe.requiredCraftingLevel;
            const hasAll = recipe.inputs.every(inp => (inv[inp.itemId] ?? 0) >= inp.amount);
            return (
              <div key={recipe.id}
                style={{
                  background: '#1c2235', border: `1px solid ${hasAll && canCraft ? '#4caf87' : '#2d3752'}`,
                  borderRadius: 8, padding: '10px 12px',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <GameIcon id={outItem?.icon ?? 'gem'} size={24} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: canCraft ? '#e8e6ff' : '#4a5070' }}>
                      {recipe.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#4a5070' }}>{recipe.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#8a92b2' }}>
                    <div>Lv{recipe.requiredCraftingLevel}~</div>
                    <div style={{ color: '#f0c060' }}>→ ×{recipe.outputAmount}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {/* 3x3 shapeプレビュー */}
                  {recipe.shape && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 20px)', gap: 1, flexShrink: 0 }}>
                      {recipe.shape.map((cell, si) => {
                        const ci = cell ? ITEM_MASTER[cell] : null;
                        return (
                          <div key={si} style={{ width: 20, height: 20, background: cell ? 'rgba(91,141,238,0.25)' : '#111827', border: `1px solid ${cell ? '#5b8dee' : '#1c2235'}`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {ci && <GameIcon id={ci.icon} size={14} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {recipe.inputs.map(inp => {
                      const iitem = ITEM_MASTER[inp.itemId];
                      const have = inv[inp.itemId] ?? 0;
                      return (
                        <span key={inp.itemId}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', background: have >= inp.amount ? 'rgba(76,175,135,0.15)' : 'rgba(224,85,85,0.1)', border: `1px solid ${have >= inp.amount ? '#4caf87' : '#e05555'}`, borderRadius: 4, fontSize: '0.7rem', color: have >= inp.amount ? '#4caf87' : '#e05555' }}>
                          <GameIcon id={iitem?.icon ?? 'gem'} size={14} />
                          {iitem?.name ?? inp.itemId} ×{inp.amount}
                          <span style={{ color: '#8a92b2' }}>({have})</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
                {customRecipes.find(r => r.id === recipe.id) && (
                  <div style={{ fontSize: '0.62rem', color: '#5b8dee', marginTop: 4 }}>★ 管理者追加レシピ</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
