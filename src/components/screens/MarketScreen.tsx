// src/components/screens/MarketScreen.tsx
// 市場画面 - 売却後にFirebaseへ即時保存するよう修正

import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { savePlayer } from '../../services/database';

type ShopTab = 'sell' | 'buy' | 'use';

export function MarketScreen() {
  const player = useGameStore(s => s.player);
  const changeGold = useGameStore(s => s.changeGold);
  const consumeItem = useGameStore(s => s.consumeItem);
  const addItems = useGameStore(s => s.addItems);
  const useItem = useGameStore(s => s.useItem);
  const addNotification = useGameStore(s => s.addNotification);
  const [shopTab, setShopTab] = useState<ShopTab>('sell');
  const [saving, setSaving] = useState(false);

  // 売却: アイテム消費 → Gold加算 → Firebase即時保存（バグ修正）
  const handleSell = async (itemId: string, amount: number) => {
    const item = ITEM_MASTER[itemId];
    if (!item || item.sellPrice === 0) return;
    if (!consumeItem(itemId, amount)) return;
    changeGold(item.sellPrice * amount);
    addNotification('success', `${item.icon} ${item.name} ×${amount} を ${(item.sellPrice * amount).toLocaleString()}G で売却しました`);
    // 売却後にFirebaseへ即時保存（インベントリが元に戻るバグを防ぐ）
    setSaving(true);
    try {
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer) await savePlayer(currentPlayer);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleBuy = async (itemId: string, amount: number) => {
    const item = ITEM_MASTER[itemId];
    if (!item || item.buyPrice === 0) return;
    const total = item.buyPrice * amount;
    if (changeGold(-total)) {
      addItems([{ itemId, amount }]);
      addNotification('success', `${item.icon} ${item.name} ×${amount} を ${total.toLocaleString()}G で購入しました`);
      setSaving(true);
      try {
        const currentPlayer = useGameStore.getState().player;
        if (currentPlayer) await savePlayer(currentPlayer);
      } catch { /* ignore */ }
      setSaving(false);
    } else {
      addNotification('error', 'ゴールドが足りません！');
    }
  };

  const inventoryEntries = Object.entries(player?.inventory ?? {}).filter(([, qty]) => qty > 0);
  const sellable = inventoryEntries.map(([id, qty]) => ({ item: ITEM_MASTER[id], qty, id })).filter(e => e.item && e.item.sellPrice > 0);
  const buyable = Object.values(ITEM_MASTER).filter(item => item.buyPrice > 0);
  const usable = inventoryEntries.map(([id, qty]) => ({ item: ITEM_MASTER[id], qty, id })).filter(e => e.item?.useEffect);

  const ROW = { display:'flex', alignItems:'center', gap:10, background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, padding:'8px 12px', marginBottom:4 } as const;
  const BTN = (bg: string) => ({ padding:'5px 12px', background:bg, color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.8rem', whiteSpace:'nowrap' as const });

  return (
    <div style={{padding:'12px 8px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>
        <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', margin:0}}>🏪 市場</h2>
        {saving && <span style={{fontSize:'0.75rem', color:'#5b8dee'}}>💾 保存中...</span>}
      </div>

      <div style={{display:'flex', gap:6, marginBottom:14}}>
        {(['sell','buy','use'] as ShopTab[]).map(t => (
          <button key={t} onClick={() => setShopTab(t)} style={{
            flex:1, padding:'8px 4px', fontSize:'0.8rem',
            background: shopTab===t ? 'rgba(91,141,238,0.2)' : '#1c2235',
            border: `1px solid ${shopTab===t ? '#5b8dee' : '#2d3752'}`,
            color: shopTab===t ? '#e8e6ff' : '#8a92b2',
            borderRadius:6, cursor:'pointer',
          }}>
            {t==='sell' ? '💰 売却' : t==='buy' ? '🛒 購入' : '🍖 使用'}
          </button>
        ))}
      </div>

      {shopTab === 'sell' && (
        sellable.length === 0
          ? <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:20}}>売れるアイテムがありません</p>
          : sellable.map(({ item, qty, id }) => (
            <div key={id} style={ROW}>
              <span style={{fontSize:'1.4rem'}}>{item!.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600, fontSize:'0.9rem'}}>{item!.name}</div>
                <div style={{fontSize:'0.72rem', color:'#8a92b2'}}>所持: {qty}個</div>
              </div>
              <span style={{color:'#f0c060', fontSize:'0.85rem', whiteSpace:'nowrap'}}>{item!.sellPrice}G/個</span>
              <button style={BTN('#4caf87')} onClick={() => handleSell(id, 1)}>×1</button>
              <button style={BTN('#2d8060')} onClick={() => handleSell(id, qty)}>全部</button>
            </div>
          ))
      )}

      {shopTab === 'buy' && buyable.map(item => (
        <div key={item.id} style={ROW}>
          <span style={{fontSize:'1.4rem'}}>{item.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:600, fontSize:'0.9rem'}}>{item.name}</div>
            <div style={{fontSize:'0.72rem', color:'#8a92b2'}}>{item.description}</div>
          </div>
          <span style={{color:'#f0c060', fontSize:'0.85rem', whiteSpace:'nowrap'}}>{item.buyPrice}G</span>
          <button style={BTN('#5b8dee')} onClick={() => handleBuy(item.id, 1)} disabled={(player?.gold ?? 0) < item.buyPrice}>購入</button>
        </div>
      ))}

      {shopTab === 'use' && (
        <>
          <p style={{fontSize:'0.78rem', color:'#8a92b2', marginBottom:10}}>食料やポーションをインベントリから使用できます。</p>
          {usable.length === 0
            ? <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:20}}>使用できるアイテムがありません</p>
            : usable.map(({ item, qty, id }) => {
              const e = item!.useEffect!;
              return (
                <div key={id} style={ROW}>
                  <span style={{fontSize:'1.4rem'}}>{item!.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600, fontSize:'0.9rem'}}>{item!.name}</div>
                    <div style={{fontSize:'0.72rem', color:'#8a92b2', display:'flex', gap:8}}>
                      {e.hpRestore     && <span style={{color:'#e05555'}}>❤️ +{e.hpRestore}</span>}
                      {e.satietyRestore && <span style={{color:'#f0a830'}}>🍖 +{e.satietyRestore}</span>}
                      <span style={{color:'#4a5070'}}>所持: {qty}</span>
                    </div>
                  </div>
                  <button style={BTN('#9b6df0')} onClick={() => useItem(id)}>使用</button>
                </div>
              );
            })
          }
        </>
      )}
    </div>
  );
}
