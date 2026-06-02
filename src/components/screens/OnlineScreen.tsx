// src/components/screens/OnlineScreen.tsx
// オンライン画面：アクティブプレイヤー一覧・掲示板・オークション。

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import {
  subscribeOnlineUsers, subscribeBoardMessages, postBoardMessage,
  subscribeAuctions, createAuction, buyAuction, cancelAuction,
} from '../../services/multiplayer';
import type { OnlineUser, BoardMessage, AuctionListing } from '../../types/game';

type SubTab = 'online' | 'board' | 'auction';

// ============================================================
// オンラインプレイヤー一覧
// ============================================================
function OnlinePanel({ users }: { users: OnlineUser[] }) {
  return (
    <div>
      <h3 style={{color:'#4caf87', marginBottom:8, fontSize:'0.95rem'}}>🟢 オンライン ({users.length}人)</h3>
      {users.length === 0
        ? <p style={{color:'#4a5070', fontSize:'0.85rem'}}>現在オンラインのプレイヤーはいません</p>
        : users.map(u => (
          <div key={u.uid} style={{display:'flex', justifyContent:'space-between', padding:'6px 10px', background:'#1c2235', borderRadius:6, marginBottom:4}}>
            <span style={{fontSize:'0.85rem'}}>⚔️ {u.displayName}</span>
            <span style={{fontSize:'0.78rem', color:'#5b8dee'}}>Lv.{u.level}</span>
          </div>
        ))
      }
    </div>
  );
}

// ============================================================
// 掲示板
// ============================================================
function BoardPanel() {
  const player = useGameStore(s => s.player);
  const addNotification = useGameStore(s => s.addNotification);
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeBoardMessages(setMessages);
    return unsub;
  }, []);

  const post = async () => {
    if (!player || !text.trim() || posting) return;
    if (text.length > 100) { addNotification('warning', '100文字以内で入力してください'); return; }
    setPosting(true);
    try {
      await postBoardMessage(player.uid, player.displayName, player.stats.level, text.trim());
      setText('');
    } catch {
      addNotification('error', '投稿に失敗しました');
    }
    setPosting(false);
  };

  return (
    <div>
      <h3 style={{color:'#5b8dee', marginBottom:8, fontSize:'0.95rem'}}>💬 掲示板</h3>
      <div style={{height:260, overflowY:'auto', display:'flex', flexDirection:'column', gap:6, marginBottom:10}}>
        {[...messages].reverse().map(m => (
          <div key={m.id} style={{background:'#1c2235', borderRadius:6, padding:'6px 10px', fontSize:'0.82rem'}}>
            <div style={{display:'flex', gap:6, marginBottom:2}}>
              <span style={{color:'#f0c060', fontWeight:700}}>{m.displayName}</span>
              <span style={{color:'#4a5070', fontSize:'0.7rem'}}>Lv.{m.level}</span>
              <span style={{color:'#4a5070', fontSize:'0.7rem', marginLeft:'auto'}}>{new Date(m.createdAt).toLocaleTimeString('ja-JP', {hour:'2-digit',minute:'2-digit'})}</span>
            </div>
            <div style={{color:'#e8e6ff'}}>{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{display:'flex', gap:6}}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key==='Enter' && post()}
          placeholder="一言メッセージ（100文字以内）"
          maxLength={100}
          style={{flex:1, background:'#0d0f14', color:'#e8e6ff', border:'1px solid #2d3752', borderRadius:6, padding:'6px 10px', fontSize:'0.82rem'}}
        />
        <button onClick={post} disabled={posting || !text.trim()} style={{padding:'6px 14px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.82rem'}}>
          {posting ? '...' : '送信'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// オークション
// ============================================================
function AuctionPanel() {
  const player = useGameStore(s => s.player);
  const { changeGold, addItems, consumeItem, addNotification } = useGameStore();
  const [listings, setListings] = useState<AuctionListing[]>([]);
  const [sellItemId, setSellItemId] = useState('');
  const [sellAmount, setSellAmount] = useState(1);
  const [sellPrice, setSellPrice] = useState(100);
  const [showSell, setShowSell] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeAuctions(setListings);
    return unsub;
  }, []);

  const myListings = listings.filter(l => l.sellerUid === player?.uid);
  const otherListings = listings.filter(l => l.sellerUid !== player?.uid);

  const inv = Object.entries(player?.inventory ?? {})
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ id, qty, item: ITEM_MASTER[id] }))
    .filter(e => e.item);

  const listItem = async () => {
    if (!player || !sellItemId) return;
    const qty = player.inventory[sellItemId] ?? 0;
    if (qty < sellAmount) { addNotification('error', 'アイテムが足りません'); return; }
    const ok = consumeItem(sellItemId, sellAmount);
    if (!ok) return;
    try {
      await createAuction({
        sellerUid: player.uid,
        sellerName: player.displayName,
        itemId: sellItemId,
        amount: sellAmount,
        pricePerUnit: sellPrice,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24時間
      });
      addNotification('success', '出品しました！');
      setShowSell(false);
    } catch {
      addNotification('error', '出品に失敗しました');
      addItems([{ itemId: sellItemId, amount: sellAmount }]); // 返却
    }
  };

  const buyItem = async (listing: AuctionListing) => {
    if (!player || buying) return;
    const total = listing.pricePerUnit * listing.amount;
    if (player.gold < total) { addNotification('error', 'ゴールドが足りません'); return; }
    setBuying(listing.id);
    try {
      const { success, listing: l } = await buyAuction(listing.id, player.uid, player.gold);
      if (success && l) {
        changeGold(-total);
        addItems([{ itemId: l.itemId, amount: l.amount }]);
        addNotification('success', `${ITEM_MASTER[l.itemId]?.name} ×${l.amount} を購入しました！`);
      } else {
        addNotification('error', 'すでに購入されたか、条件を満たしません');
      }
    } catch {
      addNotification('error', '購入に失敗しました');
    }
    setBuying(null);
  };

  const cancelItem = async (listing: AuctionListing) => {
    if (!player) return;
    const ok = await cancelAuction(listing.id, player.uid);
    if (ok) {
      addItems([{ itemId: listing.itemId, amount: listing.amount }]);
      addNotification('success', '出品を取り下げました');
    }
  };

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
        <h3 style={{color:'#f0c060', fontSize:'0.95rem'}}>🏷️ オークション</h3>
        <button onClick={() => setShowSell(s => !s)} style={{padding:'4px 12px', background:'#4caf87', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.8rem'}}>
          + 出品
        </button>
      </div>

      {/* 出品フォーム */}
      {showSell && (
        <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:12, marginBottom:12}}>
          <select value={sellItemId} onChange={e => setSellItemId(e.target.value)} style={{width:'100%', background:'#0d0f14', color:'#e8e6ff', border:'1px solid #2d3752', borderRadius:6, padding:'6px 8px', marginBottom:8, fontSize:'0.82rem'}}>
            <option value="">アイテムを選択...</option>
            {inv.map(e => (
              <option key={e.id} value={e.id}>{e.item?.icon} {e.item?.name} (所持:{e.qty})</option>
            ))}
          </select>
          <div style={{display:'flex', gap:8, marginBottom:8}}>
            <div style={{flex:1}}>
              <label style={{fontSize:'0.72rem', color:'#8a92b2'}}>数量</label>
              <input type="number" value={sellAmount} min={1} onChange={e => setSellAmount(Number(e.target.value))} style={{width:'100%', background:'#0d0f14', color:'#e8e6ff', border:'1px solid #2d3752', borderRadius:4, padding:'4px 8px', fontSize:'0.82rem'}} />
            </div>
            <div style={{flex:2}}>
              <label style={{fontSize:'0.72rem', color:'#8a92b2'}}>単価 (G)</label>
              <input type="number" value={sellPrice} min={1} onChange={e => setSellPrice(Number(e.target.value))} style={{width:'100%', background:'#0d0f14', color:'#e8e6ff', border:'1px solid #2d3752', borderRadius:4, padding:'4px 8px', fontSize:'0.82rem'}} />
            </div>
          </div>
          <button onClick={listItem} disabled={!sellItemId} style={{width:'100%', padding:'8px', background:'#f0c060', color:'#000', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700}}>
            出品する（24時間）
          </button>
        </div>
      )}

      {/* 自分の出品 */}
      {myListings.length > 0 && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:'0.78rem', color:'#8a92b2', marginBottom:6}}>自分の出品</div>
          {myListings.map(l => (
            <div key={l.id} style={{display:'flex', alignItems:'center', gap:8, background:'rgba(240,192,96,0.08)', border:'1px solid rgba(240,192,96,0.3)', borderRadius:6, padding:'6px 10px', marginBottom:4}}>
              <span style={{fontSize:'1.2rem'}}>{ITEM_MASTER[l.itemId]?.icon}</span>
              <div style={{flex:1, fontSize:'0.8rem'}}>
                <div>{ITEM_MASTER[l.itemId]?.name} ×{l.amount}</div>
                <div style={{color:'#f0c060'}}>{l.pricePerUnit.toLocaleString()}G/個</div>
              </div>
              <button onClick={() => cancelItem(l)} style={{padding:'4px 8px', background:'#e05555', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.72rem'}}>
                取り下げ
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 他プレイヤーの出品 */}
      <div style={{fontSize:'0.78rem', color:'#8a92b2', marginBottom:6}}>出品一覧 ({otherListings.length}件)</div>
      {otherListings.length === 0
        ? <p style={{color:'#4a5070', fontSize:'0.82rem'}}>出品中のアイテムはありません</p>
        : otherListings.map(l => {
          const total = l.pricePerUnit * l.amount;
          const canBuy = (player?.gold ?? 0) >= total;
          return (
            <div key={l.id} style={{display:'flex', alignItems:'center', gap:8, background:'#1c2235', borderRadius:6, padding:'6px 10px', marginBottom:4}}>
              <span style={{fontSize:'1.2rem'}}>{ITEM_MASTER[l.itemId]?.icon}</span>
              <div style={{flex:1, fontSize:'0.8rem'}}>
                <div>{ITEM_MASTER[l.itemId]?.name} ×{l.amount}</div>
                <div style={{display:'flex', gap:6}}>
                  <span style={{color:'#f0c060'}}>{total.toLocaleString()}G</span>
                  <span style={{color:'#4a5070'}}>{l.sellerName}</span>
                </div>
              </div>
              <button
                onClick={() => buyItem(l)}
                disabled={!canBuy || buying === l.id}
                style={{padding:'4px 10px', background: canBuy ? '#5b8dee' : '#2d3752', color:'#fff', border:'none', borderRadius:4, cursor: canBuy ? 'pointer' : 'not-allowed', fontSize:'0.75rem', opacity: canBuy ? 1 : 0.5}}
              >
                {buying === l.id ? '...' : '購入'}
              </button>
            </div>
          );
        })
      }
    </div>
  );
}

// ============================================================
// メイン
// ============================================================
export function OnlineScreen() {
  const [subTab, setSubTab] = useState<SubTab>('online');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const unsub = subscribeOnlineUsers(setOnlineUsers);
    return unsub;
  }, []);

  return (
    <div style={{padding:'12px 8px'}}>
      <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>🌐 オンライン</h2>

      <div style={{display:'flex', gap:6, marginBottom:14}}>
        {(['online','board','auction'] as SubTab[]).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            style={{
              flex:1, padding:'8px 4px', fontSize:'0.8rem',
              background: subTab===t ? 'rgba(91,141,238,0.2)' : '#1c2235',
              border: `1px solid ${subTab===t ? '#5b8dee' : '#2d3752'}`,
              color: subTab===t ? '#e8e6ff' : '#8a92b2',
              borderRadius:6, cursor:'pointer',
            }}
          >
            {t==='online' ? '🟢 プレイヤー' : t==='board' ? '💬 掲示板' : '🏷️ オークション'}
          </button>
        ))}
      </div>

      {subTab === 'online'  && <OnlinePanel users={onlineUsers} />}
      {subTab === 'board'   && <BoardPanel />}
      {subTab === 'auction' && <AuctionPanel />}
    </div>
  );
}
