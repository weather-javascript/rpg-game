// src/components/screens/LifeScreen.tsx
// ver3.0.0: 生活系コンテンツ画面（農業・料理・錬金・精錬・標本収集）。

import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { CROP_MASTER, LIFE_RECIPES, COLLECTION_MASTER } from '../../data/lifeSystemData';
import { defaultLifeSystemState, type FarmPlotState } from '../../types/buildTypes';

type Tab = 'farm' | 'cooking' | 'alchemy' | 'refining' | 'collection';

function itemName(id: string): string { return ITEM_MASTER[id]?.name ?? id; }
function itemIcon(id: string): string { return ITEM_MASTER[id]?.icon ?? '?'; }

export function LifeScreen() {
  const player = useGameStore(s => s.player);
  const plantCrop = useGameStore(s => s.plantCrop);
  const waterPlot = useGameStore(s => s.waterPlot);
  const fertilizePlot = useGameStore(s => s.fertilizePlot);
  const harvestPlot = useGameStore(s => s.harvestPlot);
  const runLifeRecipe = useGameStore(s => s.runLifeRecipe);
  const submitSpecimen = useGameStore(s => s.submitSpecimen);
  const getLifeLevel = useGameStore(s => s.getLifeLevel);
  const addNotification = useGameStore(s => s.addNotification);

  const [tab, setTab] = useState<Tab>('farm');
  const [pickerPlot, setPickerPlot] = useState<number | null>(null);

  if (!player) return null;
  const life = player.life ?? defaultLifeSystemState();
  const inv = player.inventory;

  return (
    <div style={{ padding: '12px 8px 80px' }}>
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', marginBottom: 4, fontSize: '1rem' }}>🌾 生活</h2>
      <p style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 12 }}>
        採取 → 加工(精錬) → 料理/錬金 → 戦闘/市場/標本展示 とつながる生活系コンテンツです。
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {([['farm', '🌱 農業'], ['cooking', '🍳 料理'], ['alchemy', '⚗️ 錬金'], ['refining', '🔨 精錬'], ['collection', '📦 標本収集']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '6px 12px', background: tab === t ? 'rgba(240,192,96,0.2)' : '#1c2235', border: `1px solid ${tab === t ? '#f0c060' : '#2d3752'}`, color: tab === t ? '#f0c060' : '#8a92b2', borderRadius: 6, cursor: 'pointer', fontSize: '0.76rem' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'farm' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {life.farmPlots.map((plot: FarmPlotState) => {
            const crop = plot.cropId ? CROP_MASTER[plot.cropId] : null;
            const ready = crop ? Date.now() - plot.plantedAt >= crop.growthMs : false;
            return (
              <div key={plot.plotIndex} style={{ background: '#1c2235', border: `1px solid ${ready ? '#7ec98a' : '#2d3752'}`, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 4 }}>畑 #{plot.plotIndex + 1}</div>
                {!crop ? (
                  pickerPlot === plot.plotIndex ? (
                    <div>
                      {Object.values(CROP_MASTER).map(c => (
                        <button key={c.id} onClick={() => { plantCrop(plot.plotIndex, c.id); setPickerPlot(null); }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '4px 6px', marginBottom: 3, background: '#161b26', border: '1px solid #2d3752', borderRadius: 4, color: '#e8e6ff', fontSize: '0.68rem', cursor: 'pointer' }}>
                          🌱 {c.name}（種×1 / 所持{inv[c.seedItemId] ?? 0}）
                        </button>
                      ))}
                      <button onClick={() => setPickerPlot(null)} style={{ fontSize: '0.65rem', color: '#8a92b2', background: 'none', border: 'none', cursor: 'pointer' }}>キャンセル</button>
                    </div>
                  ) : (
                    <button onClick={() => setPickerPlot(plot.plotIndex)}
                      style={{ width: '100%', padding: '8px', background: '#161b26', border: '1px dashed #2d3752', borderRadius: 6, color: '#8a92b2', cursor: 'pointer', fontSize: '0.72rem' }}>
                      ＋ 種を植える
                    </button>
                  )
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{ready ? '🌾' : '🌱'} {crop.name}</div>
                    <div style={{ fontSize: '0.65rem', color: ready ? '#7ec98a' : '#8a92b2' }}>
                      {ready ? '収穫可能！' : `成長中…（${Math.ceil((crop.growthMs - (Date.now() - plot.plantedAt)) / 60000)}分）`}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {!plot.watered && <button onClick={() => waterPlot(plot.plotIndex)} style={{ flex: 1, padding: '4px', fontSize: '0.65rem', background: '#161b26', border: '1px solid #2d3752', borderRadius: 4, color: '#5fa8e0', cursor: 'pointer' }}>💧水やり</button>}
                      {!plot.fertilized && <button onClick={() => fertilizePlot(plot.plotIndex)} style={{ flex: 1, padding: '4px', fontSize: '0.65rem', background: '#161b26', border: '1px solid #2d3752', borderRadius: 4, color: '#c08850', cursor: 'pointer' }}>🪴肥料</button>}
                      {ready && <button onClick={() => { const r = harvestPlot(plot.plotIndex); addNotification(r.success ? 'success' : 'warning', r.message); }} style={{ flex: 1, padding: '4px', fontSize: '0.65rem', background: 'rgba(126,201,138,0.15)', border: '1px solid #7ec98a', borderRadius: 4, color: '#7ec98a', cursor: 'pointer' }}>収穫</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(tab === 'cooking' || tab === 'alchemy' || tab === 'refining') && (
        <div>
          <div style={{ fontSize: '0.72rem', color: '#7ec98a', marginBottom: 8 }}>
            {tab}Lv. {getLifeLevel(tab)}
          </div>
          {LIFE_RECIPES.filter(r => r.category === tab).map(recipe => {
            const canMake = recipe.inputs.every(i => (inv[i.itemId] ?? 0) >= i.amount);
            return (
              <div key={recipe.id} style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{itemIcon(recipe.outputItemId)} {recipe.name}</span>
                  <span style={{ fontSize: '0.65rem', color: '#8a92b2' }}>必要Lv{recipe.requiredLevel}</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#8a92b2', margin: '4px 0' }}>{recipe.description}</div>
                <div style={{ fontSize: '0.65rem', color: '#5fa8e0' }}>
                  素材: {recipe.inputs.map(i => `${itemName(i.itemId)}×${i.amount}(所持${inv[i.itemId] ?? 0})`).join(' / ')}
                </div>
                <button onClick={() => { const r = runLifeRecipe(recipe.id); addNotification(r.success ? 'success' : 'warning', r.message); }} disabled={!canMake}
                  style={{ marginTop: 6, padding: '5px 12px', borderRadius: 6, border: `1px solid ${canMake ? '#f0c060' : '#2d3752'}`, background: canMake ? 'rgba(240,192,96,0.15)' : '#161b26', color: canMake ? '#f0c060' : '#4a5070', cursor: canMake ? 'pointer' : 'default', fontSize: '0.72rem' }}>
                  作成する
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'collection' && (
        <div>
          {COLLECTION_MASTER.map(def => {
            const claimed = life.claimedCollectionIds.includes(def.id);
            const canSubmit = def.targetIds.every(id => (inv[id] ?? 0) >= 1);
            return (
              <div key={def.id} style={{ background: '#1c2235', border: `1px solid ${claimed ? '#7ec98a' : '#2d3752'}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{claimed ? '✅' : '📦'} {def.name}</div>
                <div style={{ fontSize: '0.68rem', color: '#8a92b2', margin: '4px 0' }}>{def.description}</div>
                <div style={{ fontSize: '0.65rem', color: '#5fa8e0' }}>
                  必要素材: {def.targetIds.map(id => `${itemName(id)}(所持${inv[id] ?? 0})`).join(' / ')}
                </div>
                {!claimed && (
                  <button onClick={() => { const r = submitSpecimen(def.id); addNotification(r.success ? 'success' : 'warning', r.message); }} disabled={!canSubmit}
                    style={{ marginTop: 6, padding: '5px 12px', borderRadius: 6, border: `1px solid ${canSubmit ? '#f0c060' : '#2d3752'}`, background: canSubmit ? 'rgba(240,192,96,0.15)' : '#161b26', color: canSubmit ? '#f0c060' : '#4a5070', cursor: canSubmit ? 'pointer' : 'default', fontSize: '0.72rem' }}>
                    標本登録する
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
