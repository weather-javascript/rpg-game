// src/components/admin/MasterEditor.tsx
import React, { useState, useEffect } from 'react';
import {
  ITEM_MASTER, MONSTER_MASTER,
} from '../../data/masters';
import {
  getItemMasterOverrides, setItemMasterOverrides, ItemMasterOverride,
  getMonsterOverrides, setMonsterOverrides, MonsterOverride,
} from '../../services/multiplayer';

type MasterTab = 'item' | 'monster';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '5px 8px', background: '#161b26', border: '1px solid #2d3752',
  color: '#e8e6ff', borderRadius: 4, fontSize: '0.78rem', boxSizing: 'border-box',
};

interface MasterEditorProps {
  adminId: string;
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function MasterEditor({ adminId, addNotification }: MasterEditorProps) {
  const [tab, setTab] = useState<MasterTab>('item');
  const [itemOverrides, setItemOv] = useState<Record<string, ItemMasterOverride>>({});
  const [monsterOverrides, setMonsterOv] = useState<Record<string, MonsterOverride>>({});
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getItemMasterOverrides().then(o => { if (o) setItemOv(o); }).catch(() => {});
    getMonsterOverrides().then(o => { if (o) setMonsterOv(o); }).catch(() => {});
  }, []);

  const itemList = Object.values(ITEM_MASTER).filter(it =>
    !filter || it.name.includes(filter) || it.id.includes(filter)
  );
  const monsterList = Object.values(MONSTER_MASTER).filter(m =>
    !filter || m.name.includes(filter) || m.id.includes(filter)
  );

  const selectedItem = ITEM_MASTER[selectedId];
  const selectedMonster = MONSTER_MASTER[selectedId];
  const itemDraft: ItemMasterOverride = { ...(selectedItem ? { name: selectedItem.name, buyPrice: selectedItem.buyPrice, sellPrice: selectedItem.sellPrice, maxStack: selectedItem.maxStack } : {}), ...(itemOverrides[selectedId] ?? {}) };
  const monsterDraft: MonsterOverride = { ...(selectedMonster ? { maxHp: selectedMonster.maxHp, attack: selectedMonster.attack, defense: selectedMonster.defense, baseExp: selectedMonster.baseExp, baseGold: selectedMonster.baseGold } : {}), ...(monsterOverrides[selectedId] ?? {}), id: selectedId };

  const saveItemOverride = async (field: keyof ItemMasterOverride, value: number | string) => {
    const next = { ...itemOverrides, [selectedId]: { ...itemOverrides[selectedId], [field]: value } };
    setItemOv(next);
    setSaving(true);
    try {
      await setItemMasterOverrides(next, adminId);
      addNotification('success', `${selectedItem?.name ?? selectedId} の ${field} を更新しました`);
    } catch (e: any) {
      addNotification('error', `保存失敗: ${e?.message ?? e}`);
    }
    setSaving(false);
  };

  const saveMonsterOverride = async (field: keyof MonsterOverride, value: number | string) => {
    const next = { ...monsterOverrides, [selectedId]: { ...monsterOverrides[selectedId], id: selectedId, [field]: value } };
    setMonsterOv(next);
    setSaving(true);
    try {
      await setMonsterOverrides(next);
      addNotification('success', `${selectedMonster?.name ?? selectedId} の ${field} を更新しました`);
    } catch (e: any) {
      addNotification('error', `保存失敗: ${e?.message ?? e}`);
    }
    setSaving(false);
  };

  return (
    <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
      <h3 style={{ color: '#5b8dee', marginBottom: 10, fontSize: '0.95rem' }}>🧩 マスターデータ編集</h3>

      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['item', 'monster'] as MasterTab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setSelectedId(''); }}
            style={{ padding: '5px 10px', background: tab === t ? 'rgba(91,141,238,0.25)' : '#161b26', border: `1px solid ${tab === t ? '#5b8dee' : '#2d3752'}`, color: tab === t ? '#e8e6ff' : '#8a92b2', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}>
            {t === 'item' ? 'アイテム' : 'モンスター'}
          </button>
        ))}
      </div>

      <input
        value={filter} onChange={e => setFilter(e.target.value)}
        placeholder="名前・IDで検索..."
        style={{ ...inputStyle, marginBottom: 8 }}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {tab === 'item' && itemList.map(it => (
            <button key={it.id} onClick={() => setSelectedId(it.id)}
              style={{ textAlign: 'left', padding: '5px 8px', background: selectedId === it.id ? 'rgba(91,141,238,0.2)' : '#161b26', border: `1px solid ${selectedId === it.id ? '#5b8dee' : '#2d3752'}`, color: '#e8e6ff', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem' }}>
              {it.name} {itemOverrides[it.id] && <span style={{ color: '#f0c060' }}>★</span>}
            </button>
          ))}
          {tab === 'monster' && monsterList.map(m => (
            <button key={m.id} onClick={() => setSelectedId(m.id)}
              style={{ textAlign: 'left', padding: '5px 8px', background: selectedId === m.id ? 'rgba(91,141,238,0.2)' : '#161b26', border: `1px solid ${selectedId === m.id ? '#5b8dee' : '#2d3752'}`, color: '#e8e6ff', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem' }}>
              {m.name} {monsterOverrides[m.id] && <span style={{ color: '#f0c060' }}>★</span>}
            </button>
          ))}
        </div>

        <div style={{ flex: 1.2 }}>
          {!selectedId && (
            <div style={{ color: '#4a5070', textAlign: 'center', padding: 30, fontSize: '0.8rem' }}>左から項目を選択してください</div>
          )}
          {tab === 'item' && selectedItem && (
            <div>
              <div style={{ fontWeight: 700, color: '#f0c060', marginBottom: 8, fontSize: '0.85rem' }}>{selectedItem.name}</div>
              {[
                { label: '購入価格', field: 'buyPrice' as const, value: itemDraft.buyPrice ?? selectedItem.buyPrice },
                { label: '売却価格', field: 'sellPrice' as const, value: itemDraft.sellPrice ?? selectedItem.sellPrice },
                { label: '最大スタック数', field: 'maxStack' as const, value: itemDraft.maxStack ?? selectedItem.maxStack },
              ].map(f => (
                <div key={f.field} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: '#8a92b2', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="number" defaultValue={f.value} style={inputStyle}
                      onBlur={e => {
                        const v = Number(e.target.value);
                        if (v !== f.value) saveItemOverride(f.field, v);
                      }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: '0.7rem', color: '#4a5070', marginTop: 4 }}>※入力後フォーカスを外すと自動保存されます</div>
            </div>
          )}
          {tab === 'monster' && selectedMonster && (
            <div>
              <div style={{ fontWeight: 700, color: '#f0c060', marginBottom: 8, fontSize: '0.85rem' }}>{selectedMonster.name}</div>
              {[
                { label: 'HP', field: 'maxHp' as const, value: monsterDraft.maxHp ?? selectedMonster.maxHp },
                { label: '攻撃力', field: 'attack' as const, value: monsterDraft.attack ?? selectedMonster.attack },
                { label: '防御力', field: 'defense' as const, value: monsterDraft.defense ?? selectedMonster.defense },
                { label: '獲得EXP', field: 'baseExp' as const, value: monsterDraft.baseExp ?? selectedMonster.baseExp },
                { label: '獲得ゴールド', field: 'baseGold' as const, value: monsterDraft.baseGold ?? selectedMonster.baseGold },
              ].map(f => (
                <div key={f.field} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: '#8a92b2', marginBottom: 2 }}>{f.label}</div>
                  <input type="number" defaultValue={f.value} style={inputStyle}
                    onBlur={e => {
                      const v = Number(e.target.value);
                      if (v !== f.value) saveMonsterOverride(f.field, v);
                    }} />
                </div>
              ))}
              <div style={{ fontSize: '0.7rem', color: '#4a5070', marginTop: 4 }}>※入力後フォーカスを外すと自動保存されます</div>
            </div>
          )}
        </div>
      </div>
      {saving && <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#8a92b2' }}>保存中...</div>}
    </div>
  );
}
