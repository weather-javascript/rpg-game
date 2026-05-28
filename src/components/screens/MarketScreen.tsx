// src/components/screens/MarketScreen.tsx
// 市場画面：システムショップ + オークション（後続実装）。

import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';

type ShopTab = 'sell' | 'buy' | 'auction';

export function MarketScreen() {
  const player = useGameStore((s) => s.player);
  const changeGold = useGameStore((s) => s.changeGold);
  const consumeItem = useGameStore((s) => s.consumeItem);
  const addItems = useGameStore((s) => s.addItems);
  const addNotification = useGameStore((s) => s.addNotification);

  const [shopTab, setShopTab] = useState<ShopTab>('sell');

  // --- 売却 ---
  const handleSell = (itemId: string, amount: number) => {
    const item = ITEM_MASTER[itemId];
    if (!item || item.sellPrice === 0) return;
    const success = consumeItem(itemId, amount);
    if (success) {
      changeGold(item.sellPrice * amount);
      addNotification('success', `${item.icon} ${item.name} ×${amount} を ${item.sellPrice * amount}G で売却しました`);
    }
  };

  // --- 購入 ---
  const handleBuy = (itemId: string, amount: number) => {
    const item = ITEM_MASTER[itemId];
    if (!item || item.buyPrice === 0) return;
    const totalCost = item.buyPrice * amount;
    const success = changeGold(-totalCost);
    if (success) {
      addItems([{ itemId, amount }]);
      addNotification('success', `${item.icon} ${item.name} ×${amount} を ${totalCost}G で購入しました`);
    } else {
      addNotification('error', 'ゴールドが足りません！');
    }
  };

  // 売却可能アイテム（所持 + sellPrice > 0）
  const sellableItems = Object.entries(player?.inventory ?? {})
    .filter(([itemId, qty]) => qty > 0 && (ITEM_MASTER[itemId]?.sellPrice ?? 0) > 0)
    .map(([itemId, qty]) => ({ item: ITEM_MASTER[itemId], qty }))
    .filter((e) => e.item);

  // 購入可能アイテム（buyPrice > 0）
  const buyableItems = Object.values(ITEM_MASTER).filter((item) => item.buyPrice > 0);

  return (
    <div className="screen market-screen">
      <h2 className="screen-title">🏪 市場</h2>

      <div className="shop-tabs">
        {(['sell', 'buy', 'auction'] as ShopTab[]).map((t) => (
          <button
            key={t}
            className={`shop-tab-btn ${shopTab === t ? 'active' : ''}`}
            onClick={() => setShopTab(t)}
          >
            {t === 'sell' ? '💰 売却' : t === 'buy' ? '🛒 購入' : '🏷️ オークション'}
          </button>
        ))}
      </div>

      {shopTab === 'sell' && (
        <div className="item-list">
          {sellableItems.length === 0 ? (
            <p className="empty-msg">売れるアイテムがありません</p>
          ) : (
            sellableItems.map(({ item, qty }) => (
              <div key={item!.id} className="item-row">
                <span className="item-icon">{item!.icon}</span>
                <div className="item-info">
                  <span className="item-name">{item!.name}</span>
                  <span className="item-qty">所持: {qty}</span>
                </div>
                <span className="item-price">{item!.sellPrice}G/個</span>
                <button className="action-btn sell" onClick={() => handleSell(item!.id, 1)}>×1 売る</button>
                <button className="action-btn sell" onClick={() => handleSell(item!.id, qty)}>全部売る</button>
              </div>
            ))
          )}
        </div>
      )}

      {shopTab === 'buy' && (
        <div className="item-list">
          {buyableItems.map((item) => (
            <div key={item.id} className="item-row">
              <span className="item-icon">{item.icon}</span>
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-desc">{item.description}</span>
              </div>
              <span className="item-price">{item.buyPrice}G</span>
              <button
                className="action-btn buy"
                onClick={() => handleBuy(item.id, 1)}
                disabled={(player?.gold ?? 0) < item.buyPrice}
              >
                購入
              </button>
            </div>
          ))}
        </div>
      )}

      {shopTab === 'auction' && (
        <div className="auction-placeholder">
          <p>🏷️ オークション機能は次フェーズで実装予定です。</p>
          <p>他プレイヤーとリアルタイムでアイテム取引ができるようになります。</p>
        </div>
      )}
    </div>
  );
}
