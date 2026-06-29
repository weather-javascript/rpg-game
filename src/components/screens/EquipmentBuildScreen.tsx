// src/components/screens/EquipmentBuildScreen.tsx
// ver3.0.0: 装備ビルド画面（特性・付与効果・セット効果・覚醒の確認・操作・比較・プリセット）。

import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { getItemTrait, AFFIX_MASTER, buildAutoSets, getAffixSlotCount } from '../../data/equipmentBuildData';
import { defaultEquipmentBuildState, AWAKENING_MAX } from '../../types/v3Types';

const RARITY_COLOR: Record<string, string> = { common: '#8a92b2', uncommon: '#7ec98a', rare: '#5fa8e0', epic: '#c060e0', legendary: '#f0c060' };
type SortKey = 'name' | 'rarity' | 'awakening';

export function EquipmentBuildScreen() {
  const player = useGameStore(s => s.player);
  const rerollAffixes = useGameStore(s => s.rerollAffixes);
  const awakenItem = useGameStore(s => s.awakenItem);
  const saveBuildPreset = useGameStore(s => s.saveBuildPreset);
  const loadBuildPreset = useGameStore(s => s.loadBuildPreset);
  const deleteBuildPreset = useGameStore(s => s.deleteBuildPreset);
  const addNotification = useGameStore(s => s.addNotification);

  const [filterCategory, setFilterCategory] = useState<'all' | 'weapon' | 'armor'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('rarity');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [presetName, setPresetName] = useState('');

  const autoSets = useMemo(() => buildAutoSets(ITEM_MASTER), []);

  if (!player) return null;
  const build = player.equipmentBuild ?? defaultEquipmentBuildState();
  const eq = player.equipment;
  const equippedIds = new Set([eq?.hotbar ?? [], eq?.helmet, eq?.chestplate, eq?.leggings, eq?.boots, eq?.offhand].flat().filter((x): x is string => !!x));

  const ownedEquipment = Object.keys(player.inventory)
    .filter(id => (player.inventory[id] ?? 0) > 0)
    .map(id => ITEM_MASTER[id])
    .filter((item): item is NonNullable<typeof item> => !!item && (item.category === 'weapon' || item.category === 'armor'))
    .filter(item => filterCategory === 'all' || item.category === filterCategory)
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'awakening') return (build.awakening[b.id] ?? 0) - (build.awakening[a.id] ?? 0);
      const order = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
      return order.indexOf(a.rarity) - order.indexOf(b.rarity);
    });

  const renderItemInfo = (itemId: string) => {
    const item = ITEM_MASTER[itemId];
    if (!item) return null;
    const trait = getItemTrait(itemId);
    const awakening = build.awakening[itemId] ?? 0;
    const slotCount = getAffixSlotCount(awakening);
    const rolls = build.affixRolls[itemId] ?? [];
    const setKey = Object.values(autoSets).find(s => s.itemIds.includes(itemId));

    return (
      <div style={{ background: '#1c2235', border: `1px solid ${RARITY_COLOR[item.rarity]}`, borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 700, color: RARITY_COLOR[item.rarity], fontSize: '0.88rem' }}>{item.name}</div>
        <div style={{ fontSize: '0.68rem', color: '#8a92b2', marginBottom: 6 }}>{item.description}</div>

        <div style={{ fontSize: '0.72rem', color: '#f0c060', marginBottom: 4 }}>
          特性: {trait.icon} {trait.name} — {trait.description}
        </div>

        <div style={{ fontSize: '0.72rem', color: '#c060e0', marginBottom: 4 }}>
          覚醒: +{awakening} / +{AWAKENING_MAX}　（付与効果スロット {rolls.length}/{slotCount}）
          <div style={{ height: 5, background: '#161b26', borderRadius: 3, marginTop: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(awakening / AWAKENING_MAX) * 100}%`, background: 'linear-gradient(90deg,#c060e0,#7050a0)' }} />
          </div>
        </div>

        <div style={{ fontSize: '0.7rem', color: '#5fa8e0', marginBottom: 6 }}>
          付与効果:
          {rolls.length === 0 ? ' なし（再抽選石で付与）' : rolls.map((r, i) => {
            const def = AFFIX_MASTER[r.affixId];
            return <div key={i} style={{ marginLeft: 8 }}>・{def?.name} +{(r.value * 100).toFixed(1)}%（tier{r.tier}）</div>;
          })}
        </div>

        {setKey && (
          <div style={{ fontSize: '0.7rem', color: '#7ec98a', marginBottom: 6 }}>
            セット: {setKey.name}（装備中{setKey.itemIds.filter(id => equippedIds.has(id)).length}/{setKey.itemIds.length}）
            {setKey.thresholds.map((th, i) => (
              <div key={i} style={{ marginLeft: 8, color: equippedIds.has(itemId) && setKey.itemIds.filter(id => equippedIds.has(id)).length >= th.count ? '#7ec98a' : '#4a5070' }}>
                ・{th.count}点: {th.description}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button onClick={() => rerollAffixes(itemId)}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #5fa8e0', background: 'rgba(95,168,224,0.15)', color: '#5fa8e0', cursor: 'pointer', fontSize: '0.7rem' }}>
            🔄 付与効果を再抽選（再抽選石×1）
          </button>
          <button onClick={() => { const r = awakenItem(itemId); addNotification(r.success ? 'success' : 'warning', r.message); }}
            disabled={awakening >= AWAKENING_MAX}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #c060e0', background: 'rgba(192,96,224,0.15)', color: '#c060e0', cursor: 'pointer', fontSize: '0.7rem' }}>
            🌟 覚醒する
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '12px 8px 80px' }}>
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', marginBottom: 4, fontSize: '1rem' }}>🛡️ 装備ビルド</h2>
      <p style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 12 }}>
        所持している武器・防具の特性・付与効果・セット効果・覚醒段階を確認・強化できます。
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['all', 'weapon', 'armor'] as const).map(c => (
          <button key={c} onClick={() => setFilterCategory(c)}
            style={{ padding: '5px 10px', background: filterCategory === c ? 'rgba(240,192,96,0.2)' : '#1c2235', border: `1px solid ${filterCategory === c ? '#f0c060' : '#2d3752'}`, color: filterCategory === c ? '#f0c060' : '#8a92b2', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem' }}>
            {c === 'all' ? '全部' : c === 'weapon' ? '武器' : '防具'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#8a92b2' }}>並び順:</span>
        {(['rarity', 'name', 'awakening'] as SortKey[]).map(s => (
          <button key={s} onClick={() => setSortKey(s)}
            style={{ padding: '5px 10px', background: sortKey === s ? 'rgba(240,192,96,0.2)' : '#1c2235', border: `1px solid ${sortKey === s ? '#f0c060' : '#2d3752'}`, color: sortKey === s ? '#f0c060' : '#8a92b2', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem' }}>
            {s === 'rarity' ? 'レア度' : s === 'name' ? '名前' : '覚醒段階'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: 240 }}>
          <div style={{ fontSize: '0.7rem', color: '#8a92b2', marginBottom: 6 }}>所持装備（クリックで選択 / Shiftクリックで比較対象に設定）</div>
          {ownedEquipment.length === 0 && <div style={{ color: '#4a5070', fontSize: '0.78rem' }}>武器・防具を所持していません。</div>}
          {ownedEquipment.map(item => (
            <div key={item.id}
              onClick={(e) => { if (e.shiftKey) setCompareId(item.id); else setSelectedId(item.id); }}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', marginBottom: 5, borderRadius: 6, cursor: 'pointer',
                background: selectedId === item.id ? 'rgba(240,192,96,0.12)' : compareId === item.id ? 'rgba(95,168,224,0.12)' : '#1c2235',
                border: `1px solid ${selectedId === item.id ? '#f0c060' : compareId === item.id ? '#5fa8e0' : '#2d3752'}` }}>
              <span style={{ color: RARITY_COLOR[item.rarity], fontSize: '0.76rem' }}>
                {item.name} {equippedIds.has(item.id) && '⚔️'}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#8a92b2' }}>覚醒+{build.awakening[item.id] ?? 0}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: '1 1 280px', minWidth: 260 }}>
          {selectedId ? renderItemInfo(selectedId) : <div style={{ color: '#4a5070', fontSize: '0.78rem' }}>装備を選択してください。</div>}
        </div>

        {compareId && (
          <div style={{ flex: '1 1 280px', minWidth: 260 }}>
            <div style={{ fontSize: '0.7rem', color: '#5fa8e0', marginBottom: 6 }}>比較対象</div>
            {renderItemInfo(compareId)}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid #2d3752', paddingTop: 12 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0c060', marginBottom: 6 }}>📌 ビルドプリセット</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="プリセット名"
            style={{ flex: 1, padding: '6px 8px', background: '#161b26', border: '1px solid #2d3752', borderRadius: 6, color: '#e8e6ff', fontSize: '0.75rem' }} />
          <button onClick={() => { saveBuildPreset(presetName); setPresetName(''); }}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #f0c060', background: 'rgba(240,192,96,0.15)', color: '#f0c060', cursor: 'pointer', fontSize: '0.75rem' }}>
            現在の装備を保存
          </button>
        </div>
        {build.presets.length === 0 && <div style={{ color: '#4a5070', fontSize: '0.76rem' }}>保存されたビルドはありません。</div>}
        {build.presets.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#1c2235', border: '1px solid #2d3752', borderRadius: 6, marginBottom: 6 }}>
            <span style={{ fontSize: '0.76rem' }}>{p.name}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => loadBuildPreset(p.id)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #5fa8e0', background: 'rgba(95,168,224,0.15)', color: '#5fa8e0', cursor: 'pointer', fontSize: '0.68rem' }}>読込</button>
              <button onClick={() => deleteBuildPreset(p.id)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #e05555', background: 'rgba(224,85,85,0.1)', color: '#e05555', cursor: 'pointer', fontSize: '0.68rem' }}>削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
