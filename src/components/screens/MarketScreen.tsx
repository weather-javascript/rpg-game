// src/components/screens/MarketScreen.tsx
// 市場画面 - 売却後にFirebaseへ即時保存するよう修正

import { useState, useEffect } from 'react';
import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { subscribeItemPrices, subscribeTradeRecipes, subscribeNpcQuests, generateNpcQuests, deleteExpiredNpcQuests, completeNpcQuest, updateQuestRanking, subscribeQuestRanking } from '../../services/multiplayer';
import type { TradeRecipe, QuestRankingEntry } from '../../services/multiplayer';
import type { NpcQuest, QuestRank } from '../../types/game';

type ShopTab = 'sell' | 'buy' | 'satiety' | 'use' | 'trade' | 'quest';

const DEFAULT_TRADE_RECIPES: TradeRecipe[] = [
  {
    id: 'trade_cave_staff',
    name: '洞窟の杖と交換',
    description: '洞窟王の宝石を64個納めると、洞窟の杖と交換してもらえる。',
    inputs: [{ itemId: 'cave_gem', amount: 64 }],
    outputItemId: 'cave_staff',
    outputAmount: 1,
  },
  {
    id: 'trade_cave_staff2',
    name: '岩窟の杖と交換',
    description: '洞窟の杖1本とモグラの爪4個を納めると、岩窟の杖と交換してもらえる。',
    inputs: [{ itemId: 'cave_staff', amount: 1 }, { itemId: 'mole_claw', amount: 4 }],
    outputItemId: 'cave_staff2',
    outputAmount: 1,
  },
];

// 満腹度上限購入価格: 600 * 1.3^n
const SATIETY_BASE_PRICE = 600;
const SATIETY_RATE = 1.3;
function satietyUpgradePrice(n: number): number {
  return Math.floor(SATIETY_BASE_PRICE * Math.pow(SATIETY_RATE, n));
}

// HP上限購入価格: 1000 * 1.4^n
const HP_BASE_PRICE = 1000;
const HP_RATE = 1.4;
function hpUpgradePrice(n: number): number {
  return Math.floor(HP_BASE_PRICE * Math.pow(HP_RATE, n));
}

export function MarketScreen() {
  const player = useGameStore(s => s.player);
  const changeGold = useGameStore(s => s.changeGold);
  const consumeItem = useGameStore(s => s.consumeItem);
  const addItems = useGameStore(s => s.addItems);
  const useItem = useGameStore(s => s.useItem);
  const addNotification = useGameStore(s => s.addNotification);
  const [shopTab, setShopTab] = useState<ShopTab>('sell');
  const [priceOverrides, setPriceOverrides] = useState<Record<string, { buyPrice: number; sellPrice: number }>>({});
  const [tradeRecipes, setTradeRecipes] = useState<TradeRecipe[]>(DEFAULT_TRADE_RECIPES);
  const [sellSearch, setSellSearch] = useState('');
  const [sellCat, setSellCat] = useState('all');
  const [npcQuests, setNpcQuests] = useState<NpcQuest[]>([]);
  const [questRanking, setQuestRanking] = useState<QuestRankingEntry[]>([]);
  const [questRankTab, setQuestRankTab] = useState<'count' | 'gold'>('count');

  useEffect(() => {
    const unsub = subscribeItemPrices(p => setPriceOverrides(p));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeTradeRecipes(r => {
      if (r && r.length > 0) setTradeRecipes(r);
    });
    return unsub;
  }, []);

  // NPC依頼
  useEffect(() => {
    const unsub = subscribeNpcQuests(quests => setNpcQuests(quests));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeQuestRanking(entries => setQuestRanking(entries));
    return unsub;
  }, []);

  // 起動時に期限切れ依頼を削除し、依頼が0件なら生成
  useEffect(() => {
    deleteExpiredNpcQuests().then(() => {
      // 依頼がなければ生成
      setTimeout(() => {
        if (npcQuests.length === 0) generateNpcQuests().catch(() => {});
      }, 2000);
    }).catch(() => {});
  }, []);

  // 実効価格を取得（Firestoreオーバーライドが優先）
  const getEffectivePrice = (itemId: string) => {
    const master = ITEM_MASTER[itemId];
    if (!master) return { buyPrice: 0, sellPrice: 0 };
    const ov = priceOverrides[itemId];
    return {
      buyPrice: ov !== undefined ? ov.buyPrice : master.buyPrice,
      sellPrice: ov !== undefined ? ov.sellPrice : master.sellPrice,
    };
  };




  // 売却: アイテム消費 → Gold加算 → Firebase即時保存（バグ修正）
  const handleSell = async (itemId: string, amount: number) => {
    const item = ITEM_MASTER[itemId];
    if (!item) return;
    const { sellPrice } = getEffectivePrice(itemId);
    if (sellPrice === 0) return;
    if (!consumeItem(itemId, amount)) return;
    changeGold(sellPrice * amount);
    addNotification('success', `${item.icon} ${item.name} ×${amount} を ${(sellPrice * amount).toLocaleString()}G で売却しました`);
    // localStorageのみバックアップ（自動保存でFirebase同期）
    const currentPlayer = useGameStore.getState().player;
    if (currentPlayer) {
      try { localStorage.setItem('rpg_backup', JSON.stringify({ data: currentPlayer, savedAt: Date.now() })); } catch { /* ignore */ }
    }
  };

  const handleBuy = async (itemId: string, amount: number) => {
    const item = ITEM_MASTER[itemId];
    if (!item) return;
    const { buyPrice } = getEffectivePrice(itemId);
    if (buyPrice === 0) return;
    const total = buyPrice * amount;
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

  const handleHpUpgrade = () => {
    if (!player) return;
    const count = player.hpUpgradeCount ?? 0;
    const price = hpUpgradePrice(count);
    if ((player.gold ?? 0) < price) {
      addNotification('error', 'ゴールドが足りません！');
      return;
    }
    changeGold(-price);
    const newMaxHp = player.stats.maxHp + 5;
    const latest = useGameStore.getState().player;
    if (latest) {
      useGameStore.setState({
        player: {
          ...latest,
          stats: { ...latest.stats, maxHp: newMaxHp },
          hpUpgradeCount: count + 1,
        }
      });
      try { localStorage.setItem('rpg_backup', JSON.stringify({ data: useGameStore.getState().player, savedAt: Date.now() })); } catch { /* ignore */ }
    }
    addNotification('success', `❤️ HP上限が ${newMaxHp} になりました！`);
  };

  const inventoryEntries = Object.entries(player?.inventory ?? {}).filter(([, qty]) => (qty as number) > 0);
  const sellableAll = inventoryEntries.map(([id, qty]) => ({ item: ITEM_MASTER[id], qty: qty as number, id, sellPrice: getEffectivePrice(id).sellPrice })).filter(e => e.item && e.sellPrice > 0);
  const SELL_CATS = [
    { id: 'all', label: '全て' },
    { id: 'weapon', label: '⚔️ 武器' },
    { id: 'armor', label: '🛡️ 防具' },
    { id: 'food', label: '🍖 食料' },
    { id: 'potion', label: '🧪 薬' },
    { id: 'material', label: '🪨 素材' },
    { id: 'other', label: '📦 その他' },
  ];
  const OTHER_SELL_CATS = new Set(['economy','display','job','protect','travel','treasure','tool']);
  const sellable = sellableAll.filter(({ item, id: itemId }) => {
    if (!item) return false;
    if (sellSearch && !item.name.includes(sellSearch) && !itemId.includes(sellSearch)) return false;
    if (sellCat === 'all') return true;
    if (sellCat === 'other') return OTHER_SELL_CATS.has(item.category);
    return item.category === sellCat;
  });
  const buyable = Object.values(ITEM_MASTER).filter(item => getEffectivePrice(item.id).buyPrice > 0);
  const usable = inventoryEntries.map(([id, qty]) => ({ item: ITEM_MASTER[id], qty, id })).filter(e => e.item?.useEffect && e.item?.category === 'food');

  const satietyCount = player?.satietyUpgradeCount ?? 0;
  const nextPrice = satietyUpgradePrice(satietyCount);
  const currentMaxSatiety = player?.stats.maxSatiety ?? 100;
  const hpCount = player?.hpUpgradeCount ?? 0;
  const nextHpPrice = hpUpgradePrice(hpCount);
  const currentMaxHp = player?.stats.maxHp ?? 100;

  const QUEST_RANK_COLOR: Record<QuestRank, string> = { C: '#8a92b2', B: '#4caf87', A: '#5b8dee', S: '#f0c060', SS: '#e060e0' };

  const ROW = { display:'flex', alignItems:'center', gap:10, background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, padding:'8px 12px', marginBottom:4 } as const;
  const BTN = (bg: string) => ({ padding:'5px 12px', background:bg, color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.8rem', whiteSpace:'nowrap' as const });

  const handleQuestComplete = async (quest: NpcQuest) => {
    if (!player) return;
    // 代替素材対応：メイン→代替の順で納品可能なものを探す
    const allIds = [quest.requiredItemId, ...(quest.alternateItemIds ?? [])];
    const usableId = allIds.find(id => (player.inventory[id] ?? 0) >= quest.requiredAmount);
    if (!usableId) {
      addNotification('error', `素材が足りません (${allIds.map(id => ITEM_MASTER[id]?.name ?? id).join('/')} × ${quest.requiredAmount})`);
      return;
    }
    if (!consumeItem(usableId, quest.requiredAmount)) return;
    changeGold(quest.rewardGold);
    await completeNpcQuest(quest.id);
    await updateQuestRanking(player.uid, player.displayName, quest.rewardGold);
    // playerData更新
    const latest = useGameStore.getState().player;
    if (latest) {
      useGameStore.setState({
        player: {
          ...latest,
          totalQuestCompleted: (latest.totalQuestCompleted ?? 0) + 1,
          totalQuestRewardGold: (latest.totalQuestRewardGold ?? 0) + quest.rewardGold,
        }
      });
    }
    addNotification('success', `✅ 依頼達成！ ${quest.rewardGold.toLocaleString()}G を獲得しました`);
  };

  const TABS_DEF: { id: ShopTab; label: string }[] = [
    { id:'sell',    label:'💰 売却' },
    { id:'buy',     label:'🛒 購入' },
    { id:'satiety', label:'📊 ステータス' },
    { id:'use',     label:'🧪 使用' },
    { id:'trade',   label:'🔄 取引' },
    { id:'quest',   label:'📜 NPC依頼' },
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
        <>
          <input
            value={sellSearch} onChange={e => setSellSearch(e.target.value)}
            placeholder="🔍 名前で検索..."
            style={{width:'100%', padding:'6px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box', marginBottom:6}}
          />
          <div style={{display:'flex', gap:4, overflowX:'auto', marginBottom:8, paddingBottom:2}}>
            {SELL_CATS.map(t => (
              <button key={t.id} onClick={() => setSellCat(t.id)}
                style={{flexShrink:0, padding:'4px 8px', fontSize:'0.7rem', background: sellCat===t.id ? 'rgba(91,141,238,0.25)' : '#161b26', border:`1px solid ${sellCat===t.id ? '#5b8dee' : '#2d3752'}`, color: sellCat===t.id ? '#e8e6ff' : '#8a92b2', borderRadius:5, cursor:'pointer', whiteSpace:'nowrap'}}>
                {t.label}
              </button>
            ))}
          </div>
          {sellable.length === 0
            ? <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:20}}>売れるアイテムがありません</p>
            : sellable.map(({ item, qty, id, sellPrice }) => (
              <div key={id} style={ROW}>
                <span style={{fontSize:'1.4rem'}}><GameIcon id={item!.icon} size={28} /></span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600, fontSize:'0.9rem'}}>{item!.name}</div>
                  <div style={{fontSize:'0.72rem', color:'#8a92b2'}}>所持: {qty}個</div>
                </div>
                <span style={{color:'#f0c060', fontSize:'0.85rem', whiteSpace:'nowrap'}}>{sellPrice}G/個</span>
                <button style={BTN('#4caf87')} onClick={() => handleSell(id, 1)}>×1</button>
                <button style={BTN('#2d8060')} onClick={() => handleSell(id, qty)}>全部</button>
              </div>
            ))
          }
        </>
      )}

      {shopTab === 'buy' && (
        <>
          {/* 満腹度上限アップグレードバナー */}
          <div style={{background:'rgba(240,168,48,0.08)', border:'1px solid rgba(240,168,48,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
            <div>
              <div style={{fontSize:'0.82rem', fontWeight:700, color:'#f0a830'}}>🍖 満腹度上限アップグレード</div>
              <div style={{fontSize:'0.7rem', color:'#8a92b2', marginTop:2}}>現在の上限: {currentMaxSatiety} → 次回購入後: {currentMaxSatiety + 10}（{nextPrice.toLocaleString()}G）</div>
            </div>
            <button
              onClick={() => setShopTab('satiety')}
              style={{padding:'5px 10px', background:'linear-gradient(135deg,#f0a830,#e07820)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap' as const}}>
              購入へ
            </button>
          </div>
          {buyable.map(item => {
            const { buyPrice } = getEffectivePrice(item.id);
            return (
            <div key={item.id} style={ROW}>
              <span style={{fontSize:'1.4rem'}}><GameIcon id={item.icon} size={28} /></span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600, fontSize:'0.9rem'}}>{item.name}</div>
                <div style={{fontSize:'0.72rem', color:'#8a92b2'}}>{item.description}</div>
              </div>
              <span style={{color:'#f0c060', fontSize:'0.85rem', whiteSpace:'nowrap'}}>{buyPrice}G</span>
              <button style={BTN('#5b8dee')} onClick={() => handleBuy(item.id, 1)} disabled={(player?.gold ?? 0) < buyPrice}>購入</button>
            </div>
            );
          })}
        </>
      )}

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
          <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:16, marginBottom:12}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <span style={{color:'#8a92b2', fontSize:'0.82rem'}}>現在のHP上限</span>
              <span style={{color:'#e05555', fontWeight:700, fontSize:'1.1rem'}}>❤️ {currentMaxHp}</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <span style={{color:'#8a92b2', fontSize:'0.82rem'}}>購入後の上限</span>
              <span style={{color:'#4caf87', fontWeight:700, fontSize:'1.1rem'}}>❤️ {currentMaxHp + 5}</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
              <span style={{color:'#8a92b2', fontSize:'0.82rem'}}>購入価格</span>
              <span style={{color:'#f0c060', fontWeight:700, fontSize:'1.1rem'}}>{nextHpPrice.toLocaleString()}G</span>
            </div>
            <button
              onClick={handleHpUpgrade}
              disabled={(player?.gold ?? 0) < nextHpPrice}
              style={{
                width:'100%', padding:'10px 0', fontSize:'0.9rem', fontWeight:700,
                background: (player?.gold ?? 0) >= nextHpPrice ? 'linear-gradient(135deg,#e05555,#c03030)' : '#2d3752',
                color: (player?.gold ?? 0) >= nextHpPrice ? '#fff' : '#4a5070',
                border:'none', borderRadius:8, cursor: (player?.gold ?? 0) >= nextHpPrice ? 'pointer' : 'not-allowed',
              }}
            >
              ❤️ HP上限を +5 増やす
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

      {shopTab === 'trade' && (
        <>
          <p style={{fontSize:'0.78rem', color:'#8a92b2', marginBottom:12, lineHeight:1.6}}>
            🏪 素材を納めると特別なアイテムと交換してもらえます。
          </p>
          {tradeRecipes.map(recipe => {
            const outputItem = ITEM_MASTER[recipe.outputItemId];
            const canTrade = recipe.inputs.every(inp => (player?.inventory[inp.itemId] ?? 0) >= inp.amount);
            return (
              <div key={recipe.id} style={{background:'#1c2235', border:`1px solid ${canTrade ? '#4caf87' : '#2d3752'}`, borderRadius:8, padding:'12px 14px', marginBottom:10}}>
                <div style={{fontWeight:700, fontSize:'0.88rem', color:'#e8e6ff', marginBottom:6}}>{recipe.name}</div>
                <div style={{fontSize:'0.72rem', color:'#8a92b2', marginBottom:10}}>{recipe.description}</div>
                {/* 必要素材 */}
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:'0.68rem', color:'#4a5070', marginBottom:4}}>必要素材</div>
                  {recipe.inputs.map(inp => {
                    const inpItem = ITEM_MASTER[inp.itemId];
                    const have = player?.inventory[inp.itemId] ?? 0;
                    const ok = have >= inp.amount;
                    return (
                      <div key={inp.itemId} style={{display:'flex', alignItems:'center', gap:6, marginBottom:3}}>
                        <GameIcon id={inpItem?.icon ?? 'stone'} size={18} />
                        <span style={{fontSize:'0.8rem', flex:1}}>{inpItem?.name ?? inp.itemId}</span>
                        <span style={{fontSize:'0.8rem', color: ok ? '#4caf87' : '#e05555'}}>
                          {have}/{inp.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* 交換先 */}
                <div style={{display:'flex', alignItems:'center', gap:8, background:'rgba(240,192,96,0.07)', borderRadius:6, padding:'6px 10px', marginBottom:10}}>
                  <span style={{fontSize:'0.72rem', color:'#f0c060'}}>▶ 交換品</span>
                  <GameIcon id={outputItem?.icon ?? 'gem'} size={22} />
                  <span style={{fontSize:'0.85rem', fontWeight:700, color:'#f0c060'}}>{outputItem?.name ?? recipe.outputItemId}</span>
                  {recipe.outputAmount > 1 && <span style={{fontSize:'0.75rem', color:'#8a92b2'}}>×{recipe.outputAmount}</span>}
                </div>
                <button
                  disabled={!canTrade}
                  onClick={() => {
                    if (!canTrade) return;
                    for (const inp of recipe.inputs) {
                      if (!consumeItem(inp.itemId, inp.amount)) {
                        addNotification('error', '素材が足りません');
                        return;
                      }
                    }
                    addItems([{ itemId: recipe.outputItemId, amount: recipe.outputAmount }]);
                    addNotification('success', `🔄 ${outputItem?.name ?? recipe.outputItemId} と交換しました！`);
                  }}
                  style={{
                    width:'100%', padding:'8px', fontWeight:700, fontSize:'0.85rem',
                    background: canTrade ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752',
                    color: canTrade ? '#fff' : '#4a5070',
                    border:'none', borderRadius:6, cursor: canTrade ? 'pointer' : 'not-allowed',
                  }}>
                  {canTrade ? '🔄 交換する' : '素材不足'}
                </button>
              </div>
            );
          })}
        </>
      )}

      {shopTab === 'quest' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
            <div style={{fontSize:'0.82rem', color:'#8a92b2'}}>NPCからの依頼を達成してゴールドを獲得しよう</div>
            <button onClick={() => generateNpcQuests().catch(()=>{})}
              style={{padding:'4px 10px', background:'#1c2235', border:'1px solid #2d3752', color:'#8a92b2', borderRadius:5, cursor:'pointer', fontSize:'0.72rem'}}>
              🔄 更新
            </button>
          </div>

          {npcQuests.length === 0 && (
            <p style={{color:'#4a5070', textAlign:'center', padding:20}}>依頼がありません（しばらくお待ちください）</p>
          )}

          {npcQuests.map(quest => {
            const reqItem = ITEM_MASTER[quest.requiredItemId];
            const allCandidates = [quest.requiredItemId, ...(quest.alternateItemIds ?? [])];
            const have = player?.inventory[quest.requiredItemId] ?? 0;
            const canComplete = allCandidates.some(id => (player?.inventory[id] ?? 0) >= quest.requiredAmount);
            const timeLeft = Math.max(0, quest.expiresAt - Date.now());
            const hours = Math.floor(timeLeft / 3600000);
            const mins = Math.floor((timeLeft % 3600000) / 60000);
            const rankColor = QUEST_RANK_COLOR[quest.rank];
            const QUEST_TYPE_LABEL: Record<string, string> = {
              delivery: '📦 納品', bulk: '📦📦 大量', urgent: '⚡ 至急',
              select: '🔀 代替可', chain: '🔗 連続',
            };
            const questTypeBadge = quest.questType ? QUEST_TYPE_LABEL[quest.questType] ?? '' : '';
            const mMarket = quest.marketMultiplier;
            return (
              <div key={quest.id} style={{background:'#1c2235', border:`1px solid ${rankColor}44`, borderRadius:8, padding:'12px 14px', marginBottom:10}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                  <span style={{fontSize:'1.2rem'}}>{quest.npcIcon}</span>
                  <span style={{fontSize:'0.8rem', color:'#8a92b2'}}>{quest.npcName}</span>
                  <div style={{display:'flex', gap:4, marginLeft:'auto', alignItems:'center'}}>
                    {questTypeBadge && <span style={{padding:'2px 6px', background:'rgba(91,141,238,0.15)', border:'1px solid #5b8dee44', borderRadius:4, fontSize:'0.65rem', color:'#5b8dee'}}>{questTypeBadge}</span>}
                    {mMarket && mMarket > 1.1 && <span style={{padding:'2px 6px', background:'rgba(76,175,135,0.15)', border:'1px solid #4caf8744', borderRadius:4, fontSize:'0.65rem', color:'#4caf87'}}>📈 ×{mMarket.toFixed(2)}</span>}
                    {mMarket && mMarket < 0.9 && <span style={{padding:'2px 6px', background:'rgba(224,85,85,0.15)', border:'1px solid #e0555544', borderRadius:4, fontSize:'0.65rem', color:'#e05555'}}>📉 ×{mMarket.toFixed(2)}</span>}
                    <span style={{padding:'2px 8px', background:`${rankColor}22`, border:`1px solid ${rankColor}`, borderRadius:4, fontSize:'0.7rem', fontWeight:700, color:rankColor}}>{quest.rank}ランク</span>
                  </div>
                </div>
                <div style={{fontWeight:700, fontSize:'0.92rem', color:'#e8e6ff', marginBottom:4}}>{quest.title}</div>
                <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:8}}>{quest.description}</div>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8, background:'rgba(240,192,96,0.06)', borderRadius:6, padding:'6px 10px'}}>
                  <GameIcon id={reqItem?.icon ?? 'stone'} size={20} />
                  <span style={{fontSize:'0.82rem', flex:1}}>{reqItem?.name ?? quest.requiredItemId}</span>
                  <span style={{fontSize:'0.82rem', color: canComplete ? '#4caf87' : '#e05555', fontWeight:700}}>
                    {have}/{quest.requiredAmount}
                  </span>
                </div>
                {quest.alternateItemIds && quest.alternateItemIds.length > 0 && (
                  <div style={{fontSize:'0.7rem', color:'#8a92b2', marginBottom:6}}>
                    🔀 代替可: {quest.alternateItemIds.map(id => ITEM_MASTER[id]?.name ?? id).join(' / ')} <span style={{color:'#e05555'}}>(報酬-20%)</span>
                  </div>
                )}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <span style={{color:'#f0c060', fontSize:'0.85rem', fontWeight:700}}>💰 {quest.rewardGold.toLocaleString()}G</span>
                    <span style={{fontSize:'0.68rem', color:'#4a5070', marginLeft:8}}>⏰ {hours}h{mins}m</span>
                  </div>
                  <button onClick={() => handleQuestComplete(quest)} disabled={!canComplete}
                    style={{padding:'6px 14px', background: canComplete ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752',
                      color: canComplete ? '#fff' : '#4a5070', border:'none', borderRadius:6, cursor: canComplete ? 'pointer' : 'not-allowed', fontWeight:700, fontSize:'0.82rem'}}>
                    {canComplete ? '✅ 納品' : '素材不足'}
                  </button>
                </div>
              </div>
            );
          })}

          {/* ランキング */}
          <div style={{marginTop:16, background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'12px 14px'}}>
            <div style={{fontWeight:700, color:'#f0c060', fontSize:'0.85rem', marginBottom:8}}>🏆 依頼ランキング</div>
            <div style={{display:'flex', gap:6, marginBottom:10}}>
              {[{id:'count' as const, label:'総達成数'},{id:'gold' as const, label:'総報酬額'}].map(t => (
                <button key={t.id} onClick={() => setQuestRankTab(t.id)}
                  style={{padding:'4px 10px', fontSize:'0.72rem', background: questRankTab===t.id ? 'rgba(91,141,238,0.2)' : '#161b26', border:`1px solid ${questRankTab===t.id ? '#5b8dee' : '#2d3752'}`, color: questRankTab===t.id ? '#e8e6ff' : '#8a92b2', borderRadius:5, cursor:'pointer'}}>
                  {t.label}
                </button>
              ))}
            </div>
            {questRanking.length === 0 && <p style={{color:'#4a5070', fontSize:'0.8rem', textAlign:'center'}}>データなし</p>}
            {[...questRanking].sort((a,b) => questRankTab==='count' ? b.totalCompleted-a.totalCompleted : b.totalRewardGold-a.totalRewardGold).slice(0,10).map((e,i) => (
              <div key={e.uid} style={{display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom:'1px solid #2d3752'}}>
                <span style={{color: i===0?'#f0c060':i===1?'#8a92b2':i===2?'#cd7f32':'#4a5070', fontSize:'0.78rem', width:20}}>{i+1}.</span>
                <span style={{flex:1, fontSize:'0.82rem'}}>{e.displayName}</span>
                <span style={{fontSize:'0.78rem', color:'#4caf87'}}>
                  {questRankTab==='count' ? `${e.totalCompleted}件` : `${e.totalRewardGold.toLocaleString()}G`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
