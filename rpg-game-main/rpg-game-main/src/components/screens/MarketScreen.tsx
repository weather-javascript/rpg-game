// src/components/screens/MarketScreen.tsx
// 市場画面 - 売却後にFirebaseへ即時保存するよう修正

import { useState } from 'react';
import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';

type ShopTab = 'sell' | 'buy' | 'satiety' | 'use';

// 満腹度上限購入価格: 600 * 1.3^n
const SATIETY_BASE_PRICE = 600;
const SATIETY_RATE = 1.3;
function satietyUpgradePrice(n: number): number {
  return Math.floor(SATIETY_BASE_PRICE * Math.pow(SATIETY_RATE, n));
}

export function MarketScreen() {
  const player = useGameStore(s => s.player);
  const changeGold = useGameStore(s => s.changeGold);
  const consumeItem = useGameStore(s => s.consumeItem);
  const addItems = useGameStore(s => s.addItems);
  const useItem = useGameStore(s => s.useItem);
  const addNotification = useGameStore(s => s.addNotification);
  const [shopTab, setShopTab] = useState<ShopTab>('sell');

  // 売却: アイテム消費 → Gold加算 → Firebase即時保存（バグ修正）
  const handleSell = async (itemId: string, amount: number) => {
    const item = ITEM_MASTER[itemId];
    if (!item || item.sellPrice === 0) return;
    if (!consumeItem(itemId, amount)) return;
    changeGold(item.sellPrice * amount);
    addNotification('success', `${item.icon} ${item.name} ×${amount} を ${(item.sellPrice * amount).toLocaleString()}G で売却しました`);
    // localStorageのみバックアップ（自動保存でFirebase同期）
    const currentPlayer = useGameStore.getState().player;
    if (currentPlayer) {
      try { localStorage.setItem('rpg_backup', JSON.stringify({ data: currentPlayer, savedAt: Date.now() })); } catch { /* ignore */ }
    }
  };

  const handleBuy = async (itemId: string, amount: number) => {
    const item = ITEM_MASTER[itemId];
    if (!item || item.buyPrice === 0) return;
    const total = item.buyPrice * amount;
    if (changeGold(-total)) {
      addItems([{ itemId, amount }]);
      addNotification('success', `${item.icon} ${item.name} ×${amount} を ${total.toLocaleString()}G で購入しました`);
      // localStorageのみバックアップ（自動保存でFirebase同期）
      const cp = useGameStore.getState().player;
      if (cp) {
        try { localStorage.setItem('rpg_backup', JSON.stringify({ data: cp, savedAt: Date.now() })); } catch { /* ignore */ }
      }
    } else {
      addNotification('error', 'ゴールドが足りません！');
    }
  };

  const handleSatietyUpgrade = () => {
    if (!player) return;
    const count = player.satietyUpgradeCount ?? 0;
    const price = satietyUpgradePrice(count);
    if ((player.gold ?? 0) < price) {
      addNotification('error', 'ゴールドが足りません！');
      return;
    }
    changeGold(-price);
    const newMaxSatiety = player.stats.maxSatiety + 10;
    const latest = useGameStore.getState().player;
    if (latest) {
      useGameStore.setState({
        player: {
          ...latest,
          stats: { ...latest.stats, maxSatiety: newMaxSatiety },
          satietyUpgradeCount: count + 1,
        }
      });
      try { localStorage.setItem('rpg_backup', JSON.stringify({ data: useGameStore.getState().player, savedAt: Date.now() })); } catch { /* ignore */ }
    }
    addNotification('success', `🍖 満腹度上限が ${newMaxSatiety} になりました！`);
  };

  const inventoryEntries = Object.entries(player?.inventory ?? {}).filter(([, qty]) => qty > 0);
  const sellable = inventoryEntries.map(([id, qty]) => ({ item: ITEM_MASTER[id], qty, id })).filter(e => e.item && e.item.sellPrice > 0);
  const buyable = Object.values(ITEM_MASTER).filter(item => item.buyPrice > 0);
  const usable = inventoryEntries.map(([id, qty]) => ({ item: ITEM_MASTER[id], qty, id })).filter(e => e.item?.useEffect);

  const satietyCount = player?.satietyUpgradeCount ?? 0;
  const nextPrice = satietyUpgradePrice(satietyCount);
  const currentMaxSatiety = player?.stats.maxSatiety ?? 100;

  const ROW = { display:'flex', alignItems:'center', gap:10, background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, padding:'8px 12px', marginBottom:4 } as const;
  const BTN = (bg: string) => ({ padding:'5px 12px', background:bg, color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.8rem', whiteSpace:'nowrap' as const });
  const TABS_DEF: { id: ShopTab; label: string }[] = [
    { id:'sell',    label:'💰 売却' },
    { id:'buy',     label:'🛒 購入' },
    { id:'satiety', label:'🍖 満腹' },
    { id:'use',     label:'🧪 使用' },
  ];

  return (
    <div style={{padding:'12px 8px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>
        <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', margin:0}}>🏪 市場</h2>
      </div>

      <div style={{display:'flex', gap:6, marginBottom:14}}>
        {TABS_DEF.map(t => (
          <button key={t.id} onClick={() => setShopTab(t.id)} style={{
            flex:1, padding:'8px 2px', fontSize:'0.75rem',
            background: shopTab===t.id ? 'rgba(91,141,238,0.2)' : '#1c2235',
            border: `1px solid ${shopTab===t.id ? '#5b8dee' : '#2d3752'}`,
            color: shopTab===t.id ? '#e8e6ff' : '#8a92b2',
            borderRadius:6, cursor:'pointer',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {shopTab === 'sell' && (
        sellable.length === 0
          ? <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:20}}>売れるアイテムがありません</p>
          : sellable.map(({ item, qty, id }) => (
            <div key={id} style={ROW}>
              <span style={{fontSize:'1.4rem'}}><GameIcon id={item!.icon} size={28} /></span>
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
          <span style={{fontSize:'1.4rem'}}><GameIcon id={item.icon} size={28} /></span>
          <div style={{flex:1}}>
            <div style={{fontWeight:600, fontSize:'0.9rem'}}>{item.name}</div>
            <div style={{fontSize:'0.72rem', color:'#8a92b2'}}>{item.description}</div>
          </div>
          <span style={{color:'#f0c060', fontSize:'0.85rem', whiteSpace:'nowrap'}}>{item.buyPrice}G</span>
          <button style={BTN('#5b8dee')} onClick={() => handleBuy(item.id, 1)} disabled={(player?.gold ?? 0) < item.buyPrice}>購入</button>
        </div>
      ))}

      {shopTab === 'satiety' && (
        <div>
          <p style={{fontSize:'0.78rem', color:'#8a92b2', marginBottom:14, lineHeight:1.7}}>
            満腹度の上限を <strong style={{color:'#f0a830'}}>+10</strong> 増やせます。<br />
            購入するたびに価格が上がります（×1.3倍）。
          </p>
          <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:16, marginBottom:12}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <span style={{color:'#8a92b2', fontSize:'0.82rem'}}>現在の満腹度上限</span>
              <span style={{color:'#f0a830', fontWeight:700, fontSize:'1.1rem'}}>🍖 {currentMaxSatiety}</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <span style={{color:'#8a92b2', fontSize:'0.82rem'}}>購入後の上限</span>
              <span style={{color:'#4caf87', fontWeight:700, fontSize:'1.1rem'}}>🍖 {currentMaxSatiety + 10}</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
              <span style={{color:'#8a92b2', fontSize:'0.82rem'}}>購入価格</span>
              <span style={{color:'#f0c060', fontWeight:700, fontSize:'1.1rem'}}>{nextPrice.toLocaleString()}G</span>
            </div>
            <button
              onClick={handleSatietyUpgrade}
              disabled={(player?.gold ?? 0) < nextPrice}
              style={{
                width:'100%', padding:'10px 0', fontSize:'0.9rem', fontWeight:700,
                background: (player?.gold ?? 0) >= nextPrice ? 'linear-gradient(135deg,#f0a830,#e07820)' : '#2d3752',
                color: (player?.gold ?? 0) >= nextPrice ? '#fff' : '#4a5070',
                border:'none', borderRadius:8, cursor: (player?.gold ?? 0) >= nextPrice ? 'pointer' : 'not-allowed',
              }}
            >
              🍖 満腹度上限を +10 増やす
            </button>
          </div>
          <div style={{background:'rgba(240,168,48,0.05)', border:'1px solid rgba(240,168,48,0.15)', borderRadius:8, padding:'10px 14px'}}>
            <div style={{fontSize:'0.75rem', color:'#6a7290', marginBottom:6}}>価格推移（次回以降）</div>
            {[0,1,2,3,4].map(i => {
              const n = satietyCount + i;
              const p = satietyUpgradePrice(n);
              return (
                <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color: i===0 ? '#f0c060' : '#4a5070', padding:'2px 0'}}>
                  <span>{i===0 ? '▶ 今回' : `${i+1}回目以降`}（上限 {currentMaxSatiety + i*10 + 10}）</span>
                  <span>{p.toLocaleString()}G</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {shopTab === 'use' && (
        <>
          <p style={{fontSize:'0.78rem', color:'#8a92b2', marginBottom:10}}>食料やポーションをインベントリから使用できます。</p>
          {usable.length === 0
            ? <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:20}}>使用できるアイテムがありません</p>
            : usable.map(({ item, qty, id }) => {
              const e = item!.useEffect!;
              return (
                <div key={id} style={ROW}>
                  <span style={{fontSize:'1.4rem'}}><GameIcon id={item!.icon} size={28} /></span>
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
