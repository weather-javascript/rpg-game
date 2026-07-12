// src/components/screens/LifeScreen.tsx
// ver3.0.0: 生活系コンテンツ画面（農業・料理・錬金・精錬・標本収集）。

import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { CROP_MASTER, LIFE_RECIPES, COLLECTION_MASTER, LIFE_THEMES } from '../../data/lifeSystemData';
import { defaultLifeSystemState, type FarmPlotState } from '../../types/buildTypes';
import { TutorialCard } from '../TutorialCard';

type Tab = 'farm' | 'cooking' | 'alchemy' | 'refining' | 'collection' | 'codex';

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
  const [codexSearch, setCodexSearch] = useState('');
  const [codexTheme, setCodexTheme] = useState<string>('all');
  const [codexCat, setCodexCat] = useState<'all'|'crop'|'cooking'|'alchemy'|'refining'>('all');
  const [seedSearch, setSeedSearch] = useState('');
  const [seedTheme, setSeedTheme] = useState<string>('all');
  const [seedOwnedOnly, setSeedOwnedOnly] = useState(true);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeCraftableOnly, setRecipeCraftableOnly] = useState(true);
  const [codexOwnedOnly, setCodexOwnedOnly] = useState(true);

  if (!player) return null;
  const life = player.life ?? defaultLifeSystemState();
  const inv = player.inventory;

  return (
    <div style={{ padding: '12px 8px 80px' }}>
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', marginBottom: 4, fontSize: '1rem' }}>🌾 生活</h2>
      <p style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 6 }}>
        採取 → 加工(精錬) → 料理/錬金 → 戦闘/市場/標本展示 とつながる生活系コンテンツです。
      </p>
      <div style={{ background:'rgba(76,168,106,0.1)', border:'1px solid rgba(76,168,106,0.3)', borderRadius:8, padding:'8px 10px', marginBottom:12, fontSize:'0.7rem', color:'#4ca86a' }}>
        🌾 種・肥料が見つからない場合は、マーケット画面の「購入」タブ→「🌾生活素材(種)のみ」で絞り込むと見つけやすいです。
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {([['farm', '🌱 農業'], ['cooking', '🍳 料理'], ['alchemy', '⚗️ 錬金'], ['refining', '🔨 精錬'], ['collection', '📦 標本収集'], ['codex', '📖 図鑑']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '6px 12px', background: tab === t ? 'rgba(240,192,96,0.2)' : '#1c2235', border: `1px solid ${tab === t ? '#f0c060' : '#2d3752'}`, color: tab === t ? '#f0c060' : '#8a92b2', borderRadius: 6, cursor: 'pointer', fontSize: '0.76rem' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'farm' && (
        <TutorialCard
          tutorialId="farm_starter"
          title="はじめての農業"
          starterLabel="種セット"
          steps={[
            { text: 'お試しの種と肥料を受け取る' },
            { text: '空いている畑（点線の枠）をタップして「＋ 種を植える」を選ぶ' },
            { text: '一覧からもらった種を選んで植える（自動で「所持している種のみ」が表示されます）' },
            { text: '水やり・肥料をあげると収穫量や高品質率がアップ' },
            { text: '成長時間が経過したら「収穫」ボタンで受け取り、料理タブで使ってみよう' },
          ]}
          starterItems={[
            { itemId: 'wheat_seed', amount: 3 },
            { itemId: 'crop_plain_1_1_seed', amount: 3 },
            { itemId: 'fertilizer', amount: 2 },
          ]}
        />
      )}
      {tab === 'farm' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {life.farmPlots.map((plot: FarmPlotState) => {
            const crop = plot.cropId ? CROP_MASTER[plot.cropId] : null;
            const ready = crop ? Date.now() - plot.plantedAt >= crop.growthMs : false;
            return (
              <div key={plot.plotIndex} style={{ background: '#1c2235', border: `1px solid ${ready ? '#7ec98a' : '#2d3752'}`, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 4 }}>畑 #{plot.plotIndex + 1}</div>
                {!crop ? (
                  <button onClick={() => { setPickerPlot(plot.plotIndex); setSeedSearch(''); }}
                    style={{ width: '100%', padding: '8px', background: '#161b26', border: '1px dashed #2d3752', borderRadius: 6, color: '#8a92b2', cursor: 'pointer', fontSize: '0.72rem' }}>
                    ＋ 種を植える
                  </button>
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

      {tab === 'farm' && pickerPlot !== null && (() => {
        const ownedSeedCrops = Object.values(CROP_MASTER).filter(c => (inv[c.seedItemId] ?? 0) > 0);
        const pool = seedOwnedOnly ? ownedSeedCrops : Object.values(CROP_MASTER);
        const q = seedSearch.trim();
        const filtered = pool.filter(c =>
          (seedTheme === 'all' || c.theme === seedTheme) &&
          (!q || c.name.includes(q) || c.description.includes(q))
        ).slice(0, 60);
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(5,7,14,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setPickerPlot(null)}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#0a0d14', border:'1px solid #2d3752', borderRadius:14, padding:16, width:'min(420px, 92vw)', maxHeight:'80vh', overflowY:'auto' }}>
              <div style={{ fontWeight:800, color:'#f0c060', marginBottom:8, fontSize:'0.88rem' }}>🌱 畑#{pickerPlot+1} に植える種を選択</div>
              <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                <input value={seedSearch} onChange={e=>setSeedSearch(e.target.value)} placeholder="🔍 名前・説明で検索"
                  style={{ flex:1, padding:'6px 10px', background:'#161b26', border:'1px solid #2d3752', borderRadius:6, color:'#e8e6ff', fontSize:'0.78rem' }} />
              </div>
              <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap', alignItems:'center' }}>
                <button onClick={()=>setSeedOwnedOnly(v=>!v)} style={{ padding:'4px 10px', fontSize:'0.68rem', borderRadius:6, cursor:'pointer',
                  background: seedOwnedOnly ? 'rgba(76,168,106,0.2)' : '#161b26', border:`1px solid ${seedOwnedOnly?'#4ca86a':'#2d3752'}`, color: seedOwnedOnly?'#4ca86a':'#8a92b2' }}>
                  {seedOwnedOnly ? '✅ 所持している種のみ' : '所持している種のみ'}
                </button>
                <select value={seedTheme} onChange={e=>setSeedTheme(e.target.value)}
                  style={{ padding:'4px 8px', fontSize:'0.7rem', background:'#161b26', border:'1px solid #2d3752', borderRadius:6, color:'#8a92b2' }}>
                  <option value="all">全テーマ</option>
                  {LIFE_THEMES.map(t => <option key={t.id} value={t.id}>{t.emoji}{t.label}</option>)}
                </select>
              </div>
              {seedOwnedOnly && ownedSeedCrops.length === 0 && (
                <div style={{ fontSize:'0.7rem', color:'#8a92b2', marginBottom:8 }}>
                  種を所持していません。マーケットの「購入」タブ→「🌾生活素材(種)のみ」で購入するか、上のチェックを外して全種類を見られます。
                </div>
              )}
              {filtered.map(c => (
                <button key={c.id} onClick={() => { plantCrop(pickerPlot, c.id); setPickerPlot(null); }}
                  style={{ display:'block', width:'100%', textAlign:'left', padding:'6px 8px', marginBottom:4, background:'#161b26', border:'1px solid #2d3752', borderRadius:6, color:'#e8e6ff', fontSize:'0.72rem', cursor:'pointer' }}>
                  <div style={{ fontWeight:700 }}>🌱 {c.name}（所持 {inv[c.seedItemId] ?? 0}）</div>
                  <div style={{ fontSize:'0.64rem', color:'#8a92b2', marginTop:2 }}>{c.description}</div>
                </button>
              ))}
              <button onClick={()=>setPickerPlot(null)} style={{ width:'100%', marginTop:6, padding:'6px', fontSize:'0.72rem', color:'#8a92b2', background:'none', border:'1px solid #2d3752', borderRadius:6, cursor:'pointer' }}>キャンセル</button>
            </div>
          </div>
        );
      })()}

      {tab === 'cooking' && (
        <TutorialCard
          tutorialId="cooking_starter"
          title="はじめての料理"
          starterLabel="食材セット"
          steps={[
            { text: 'お試しの食材を受け取る' },
            { text: '「作れるものだけ」チェックがONの状態だと、今の所持素材で作れる料理だけが表示されます' },
            { text: '作りたい料理の「作成する」ボタンを押すと完成' },
            { text: '完成した料理はアイテム欄から使用すると、攻撃力や採取成功率などが一定時間アップします' },
          ]}
          starterItems={[
            { itemId: 'crop_plain_1_1_produce', amount: 4 },
            { itemId: 'crop_plain_2_1_produce', amount: 2 },
          ]}
        />
      )}
      {(tab === 'cooking' || tab === 'alchemy' || tab === 'refining') && (() => {
        const q = recipeSearch.trim();
        const all = LIFE_RECIPES.filter(r => r.category === tab).map(r => ({
          recipe: r, canMake: r.inputs.every(i => (inv[i.itemId] ?? 0) >= i.amount),
        }));
        const filtered = all
          .filter(({ recipe }) => !q || recipe.name.includes(q) || recipe.description.includes(q))
          .filter(({ canMake }) => !recipeCraftableOnly || canMake)
          .sort((a, b) => (a.canMake === b.canMake ? 0 : a.canMake ? -1 : 1));
        const shown = filtered.slice(0, 80);
        return (
        <div>
          <div style={{ fontSize: '0.72rem', color: '#7ec98a', marginBottom: 8 }}>
            {tab}Lv. {getLifeLevel(tab)}
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:8 }}>
            <input value={recipeSearch} onChange={e=>setRecipeSearch(e.target.value)} placeholder="🔍 料理名・素材で検索"
              style={{ flex:1, padding:'6px 10px', background:'#161b26', border:'1px solid #2d3752', borderRadius:6, color:'#e8e6ff', fontSize:'0.78rem' }} />
            <button onClick={()=>setRecipeCraftableOnly(v=>!v)} style={{ padding:'6px 10px', fontSize:'0.7rem', borderRadius:6, cursor:'pointer', whiteSpace:'nowrap' as const,
              background: recipeCraftableOnly ? 'rgba(76,168,106,0.2)' : '#161b26', border:`1px solid ${recipeCraftableOnly?'#4ca86a':'#2d3752'}`, color: recipeCraftableOnly?'#4ca86a':'#8a92b2' }}>
              {recipeCraftableOnly ? '✅ 作れるものだけ' : '作れるものだけ'}
            </button>
          </div>
          <div style={{ fontSize:'0.65rem', color:'#4a5070', marginBottom:8 }}>
            {filtered.length}件ヒット（作成可能: {all.filter(a=>a.canMake).length}/{all.length}）{filtered.length>80?'　先頭80件を表示':''}
          </div>
          {recipeCraftableOnly && all.filter(a=>a.canMake).length===0 && (
            <div style={{ fontSize:'0.7rem', color:'#8a92b2', marginBottom:8 }}>
              現在の所持素材で作れるレシピがありません。チェックを外すと必要な素材を確認できます。
            </div>
          )}
          {shown.map(({ recipe, canMake }) => {
            return (
              <div key={recipe.id} style={{ background: '#1c2235', border: `1px solid ${canMake ? '#4ca86a' : '#2d3752'}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{canMake ? '✅' : itemIcon(recipe.outputItemId)} {recipe.name}</span>
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
        );
      })()}

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
      {tab === 'codex' && (() => {
        const q = codexSearch.trim();
        type CodexEntry = { id: string; name: string; description: string; theme?: string; requiredLevel: number; kind: 'crop'|'cooking'|'alchemy'|'refining'; icon?: string; owned: boolean };
        const entries: CodexEntry[] = [
          ...Object.values(CROP_MASTER).map(c => ({
            id: c.id, name: c.name, description: c.description, theme: c.theme, requiredLevel: c.requiredLevel, kind: 'crop' as const, icon: c.icon,
            owned: (inv[c.seedItemId] ?? 0) > 0 || (inv[c.produceItemId] ?? 0) > 0 || (c.qualityProduceItemId ? (inv[c.qualityProduceItemId] ?? 0) > 0 : false),
          })),
          ...LIFE_RECIPES.map(r => ({
            id: r.id, name: r.name, description: r.description, theme: r.theme, requiredLevel: r.requiredLevel, kind: r.category as 'cooking'|'alchemy'|'refining',
            owned: (inv[r.outputItemId] ?? 0) > 0 || r.inputs.every(i => (inv[i.itemId] ?? 0) >= i.amount),
          })),
        ];
        const filtered = entries.filter(e =>
          (codexCat === 'all' || e.kind === codexCat) &&
          (codexTheme === 'all' || e.theme === codexTheme) &&
          (!codexOwnedOnly || e.owned) &&
          (!q || e.name.includes(q) || e.description.includes(q))
        );
        const LIMIT = 60;
        const shown = filtered.slice(0, LIMIT);
        return (
          <div>
            <div style={{ display:'flex', gap:6, marginBottom:8 }}>
              <input value={codexSearch} onChange={e=>setCodexSearch(e.target.value)} placeholder="🔍 名前・説明で検索"
                style={{ flex:1, padding:'6px 10px', background:'#161b26', border:'1px solid #2d3752', borderRadius:6, color:'#e8e6ff', fontSize:'0.8rem' }} />
              <button onClick={()=>setCodexOwnedOnly(v=>!v)} style={{ padding:'6px 10px', fontSize:'0.7rem', borderRadius:6, cursor:'pointer', whiteSpace:'nowrap' as const,
                background: codexOwnedOnly ? 'rgba(76,168,106,0.2)' : '#161b26', border:`1px solid ${codexOwnedOnly?'#4ca86a':'#2d3752'}`, color: codexOwnedOnly?'#4ca86a':'#8a92b2' }}>
                {codexOwnedOnly ? '✅ 所持/作成可能のみ' : '所持/作成可能のみ'}
              </button>
            </div>
            <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
              {(['all','crop','cooking','alchemy','refining'] as const).map(c => (
                <button key={c} onClick={()=>setCodexCat(c)} style={{ padding:'4px 10px', fontSize:'0.68rem', borderRadius:6, cursor:'pointer',
                  background: codexCat===c ? 'rgba(240,192,96,0.2)' : '#161b26', border:`1px solid ${codexCat===c?'#f0c060':'#2d3752'}`, color: codexCat===c?'#f0c060':'#8a92b2' }}>
                  {{all:'すべて',crop:'🌾作物',cooking:'🍳料理',alchemy:'⚗️錬金',refining:'🔨精錬'}[c]}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
              <button onClick={()=>setCodexTheme('all')} style={{ padding:'4px 10px', fontSize:'0.66rem', borderRadius:6, cursor:'pointer',
                background: codexTheme==='all' ? 'rgba(91,141,238,0.2)' : '#161b26', border:`1px solid ${codexTheme==='all'?'#5b8dee':'#2d3752'}`, color: codexTheme==='all'?'#5b8dee':'#8a92b2' }}>全テーマ</button>
              {LIFE_THEMES.map(t => (
                <button key={t.id} onClick={()=>setCodexTheme(t.id)} style={{ padding:'4px 10px', fontSize:'0.66rem', borderRadius:6, cursor:'pointer',
                  background: codexTheme===t.id ? 'rgba(91,141,238,0.2)' : '#161b26', border:`1px solid ${codexTheme===t.id?'#5b8dee':'#2d3752'}`, color: codexTheme===t.id?'#5b8dee':'#8a92b2' }}>
                  {t.emoji}{t.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize:'0.68rem', color:'#4a5070', marginBottom:8 }}>
              {filtered.length}件ヒット{filtered.length > LIMIT ? `（先頭${LIMIT}件を表示。絞り込むとすべて見つけやすくなります）` : ''}　全{entries.length}件登録済み
            </div>
            {codexOwnedOnly && filtered.length === 0 && (
              <div style={{ fontSize:'0.7rem', color:'#8a92b2', marginBottom:8 }}>
                所持/作成可能なものがまだありません。「所持/作成可能のみ」のチェックを外すと図鑑全体を見られます。
              </div>
            )}
            {shown.map(e => (
              <div key={e.id} style={{ background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:10, marginBottom:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#e8e6ff' }}>
                    {{crop:'🌾',cooking:'🍳',alchemy:'⚗️',refining:'🔨'}[e.kind]} {e.name}
                  </span>
                  <span style={{ fontSize:'0.64rem', color:'#4a5070' }}>Lv{e.requiredLevel}{e.theme ? ` ・ ${LIFE_THEMES.find(t=>t.id===e.theme)?.label ?? e.theme}` : ''}</span>
                </div>
                <div style={{ fontSize:'0.68rem', color:'#8a92b2', marginTop:4, lineHeight:1.5 }}>{e.description}</div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
