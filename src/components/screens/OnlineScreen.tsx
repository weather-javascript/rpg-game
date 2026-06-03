// src/components/screens/OnlineScreen.tsx
// オンライン画面：アクティビティフィード追加

import { useState, useEffect, useCallback } from 'react';
import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import {
  subscribeOnlineUsers, subscribeBoardMessages, postBoardMessage,
  subscribeAuctions, createAuction, buyAuction, cancelAuction,
  subscribeAllPlayersAdmin,
} from '../../services/multiplayer';
import type { OnlineUser, BoardMessage, AuctionListing } from '../../types/game';

type SubTab = 'online' | 'board' | 'auction' | 'activity' | 'ranking';

function OnlinePanel({ users }: { users: OnlineUser[] }) {
  return (
    <div>
      <h3 style={{color:'#4caf87', marginBottom:8, fontSize:'0.95rem'}}>🟢 オンライン ({users.length}人)</h3>
      {users.length === 0
        ? <p style={{color:'#4a5070', fontSize:'0.85rem'}}>現在オンラインのプレイヤーはいません</p>
        : users.map(u => (
          <div key={u.uid} style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, padding:'8px 10px', marginBottom:4}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
              <span style={{fontSize:'0.85rem', fontWeight:700}}>⚔️ {u.displayName}</span>
              <span style={{fontSize:'0.72rem', color:'#5b8dee'}}>Lv.{u.level}</span>
            </div>
            {u.currentActivity && (
              <div style={{fontSize:'0.72rem', color:'#8a92b2'}}>📍 {u.currentActivity}</div>
            )}
            {u.lastDungeonCleared && (
              <div style={{fontSize:'0.7rem', color:'#4caf87', marginTop:2}}>✅ 最近クリア: {u.lastDungeonCleared}</div>
            )}
          </div>
        ))
      }
    </div>
  );
}

function ActivityPanel({ users }: { users: OnlineUser[] }) {
  return (
    <div>
      <h3 style={{color:'#9b6df0', marginBottom:8, fontSize:'0.95rem'}}>📡 プレイヤーアクティビティ</h3>
      <p style={{fontSize:'0.75rem', color:'#4a5070', marginBottom:10}}>現在オンラインのプレイヤーが何をしているか確認できます。</p>
      {users.length === 0
        ? <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:20}}>オンラインのプレイヤーがいません</p>
        : users.map(u => (
          <div key={u.uid} style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'10px 12px', marginBottom:6}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
              <div style={{fontWeight:700, fontSize:'0.9rem'}}>⚔️ {u.displayName}</div>
              <div style={{fontSize:'0.72rem', color:'#5b8dee', background:'rgba(91,141,238,0.1)', padding:'2px 7px', borderRadius:10}}>Lv.{u.level}</div>
            </div>
            <div style={{fontSize:'0.8rem', color:'#e8e6ff', marginBottom:u.lastDungeonCleared ? 4 : 0}}>
              {u.currentActivity ? `🎮 ${u.currentActivity}` : '🟢 オンライン'}
            </div>
            {u.lastDungeonCleared && (
              <div style={{fontSize:'0.72rem', color:'#f0c060'}}>🏆 最近クリア: {u.lastDungeonCleared}</div>
            )}
            <div style={{fontSize:'0.65rem', color:'#4a5070', marginTop:4}}>
              最終確認: {new Date(u.lastSeen).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}
            </div>
          </div>
        ))
      }
    </div>
  );
}

function BoardPanel() {
  const player = useGameStore(s => s.player);
  const addNotification = useGameStore(s => s.addNotification);
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

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
    } catch { addNotification('error', '投稿に失敗しました'); }
    setPosting(false);
  };

  return (
    <div>
      <h3 style={{color:'#5b8dee', marginBottom:8, fontSize:'0.95rem'}}>💬 掲示板</h3>
      <div style={{height:240, overflowY:'auto', display:'flex', flexDirection:'column', gap:6, marginBottom:10}}>
        {[...messages].reverse().map(m => (
          <div key={m.id} style={{background:'#1c2235', borderRadius:6, padding:'6px 10px', fontSize:'0.82rem'}}>
            <div style={{display:'flex', gap:6, marginBottom:2}}>
              <span style={{color:'#f0c060', fontWeight:700}}>{m.displayName}</span>
              <span style={{color:'#4a5070', fontSize:'0.7rem'}}>Lv.{m.level}</span>
              <span style={{color:'#4a5070', fontSize:'0.7rem', marginLeft:'auto'}}>{new Date(m.createdAt).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</span>
            </div>
            <div style={{color:'#e8e6ff'}}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex', gap:6}}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key==='Enter' && post()} placeholder="メッセージを入力..." maxLength={100}
          style={{flex:1, padding:'7px 10px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem'}} />
        <button onClick={post} disabled={posting || !text.trim()}
          style={{padding:'7px 14px', background: posting || !text.trim() ? '#2d3752' : '#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700}}>
          送信
        </button>
      </div>
    </div>
  );
}

function AuctionPanel() {
  const player = useGameStore(s => s.player);
  const changeGold = useGameStore(s => s.changeGold);
  const consumeItem = useGameStore(s => s.consumeItem);
  const addItems = useGameStore(s => s.addItems);
  const addNotification = useGameStore(s => s.addNotification);
  const [listings, setListings] = useState<AuctionListing[]>([]);
  const [sellItemId, setSellItemId] = useState('');
  const [sellAmount, setSellAmount] = useState(1);
  const [sellPrice, setSellPrice] = useState(100);
  const [tab, setTab] = useState<'browse'|'sell'>('browse');

  useEffect(() => {
    const unsub = subscribeAuctions(setListings);
    return unsub;
  }, []);

  const inventoryItems = Object.entries(player?.inventory ?? {})
    .filter(([,qty]) => qty > 0)
    .map(([id, qty]) => ({ id, qty, item: ITEM_MASTER[id] }))
    .filter(e => e.item);

  const handleBuy = async (listing: AuctionListing) => {
    if (!player) return;
    const total = listing.pricePerUnit * listing.amount;
    if (player.gold < total) { addNotification('error', 'ゴールドが足りません！'); return; }
    const { success } = await buyAuction(listing.id, player.uid, player.gold);
    if (success) {
      changeGold(-total);
      addItems([{ itemId: listing.itemId, amount: listing.amount }]);
      addNotification('success', `${ITEM_MASTER[listing.itemId]?.name} ×${listing.amount} を ${total.toLocaleString()}G で購入！`);
    } else {
      addNotification('error', '購入に失敗しました（売り切れか自分の出品）');
    }
  };

  const handleSell = async () => {
    if (!player || !sellItemId) return;
    const item = ITEM_MASTER[sellItemId];
    if (!item) return;
    if ((player.inventory[sellItemId] ?? 0) < sellAmount) { addNotification('error', '所持数が足りません'); return; }
    if (!consumeItem(sellItemId, sellAmount)) return;
    await createAuction({
      sellerUid: player.uid, sellerName: player.displayName,
      itemId: sellItemId, amount: sellAmount, pricePerUnit: sellPrice,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
    addNotification('success', `${item.name} を出品しました！`);
  };

  return (
    <div>
      <h3 style={{color:'#f0c060', marginBottom:8, fontSize:'0.95rem'}}>🏷️ オークション</h3>
      <div style={{display:'flex', gap:6, marginBottom:10}}>
        {(['browse','sell'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{flex:1, padding:'6px', fontSize:'0.8rem', background: tab===t ? 'rgba(240,192,96,0.15)' : '#1c2235', border:`1px solid ${tab===t ? '#f0c060' : '#2d3752'}`, color: tab===t ? '#f0c060' : '#8a92b2', borderRadius:6, cursor:'pointer'}}>
            {t==='browse' ? '🛒 一覧' : '📤 出品'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        listings.length === 0
          ? <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:20}}>出品中のアイテムがありません</p>
          : listings.map(l => {
            const item = ITEM_MASTER[l.itemId];
            const total = l.pricePerUnit * l.amount;
            const isMine = l.sellerUid === player?.uid;
            return (
              <div key={l.id} style={{background:'#1c2235', border:`1px solid ${isMine ? '#f0a830' : '#2d3752'}`, borderRadius:6, padding:'8px 10px', marginBottom:4}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                  <span style={{fontSize:'1.2rem'}}><GameIcon id={item?.icon ?? ''} size={22} /></span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:'0.85rem'}}>{item?.name ?? l.itemId}</div>
                    <div style={{fontSize:'0.7rem', color:'#8a92b2'}}>出品者: {l.sellerName} | ×{l.amount}</div>
                  </div>
                  <span style={{color:'#f0c060', fontWeight:700}}>{total.toLocaleString()}G</span>
                </div>
                {isMine ? (
                  <button onClick={() => cancelAuction(l.id, player!.uid).then(() => addNotification('info', '出品を取り消しました'))}
                    style={{width:'100%', padding:'5px', background:'rgba(240,168,48,0.15)', color:'#f0a830', border:'1px solid #f0a830', borderRadius:4, cursor:'pointer', fontSize:'0.75rem'}}>
                    取り消す
                  </button>
                ) : (
                  <button onClick={() => handleBuy(l)} disabled={(player?.gold ?? 0) < total}
                    style={{width:'100%', padding:'5px', background:(player?.gold ?? 0) >= total ? '#5b8dee' : '#2d3752', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.75rem'}}>
                    {(player?.gold ?? 0) >= total ? `購入 (${total.toLocaleString()}G)` : 'G不足'}
                  </button>
                )}
              </div>
            );
          })
      )}

      {tab === 'sell' && (
        <div>
          <div style={{marginBottom:8}}>
            <label style={{fontSize:'0.78rem', color:'#8a92b2', display:'block', marginBottom:4}}>出品するアイテム</label>
            <select value={sellItemId} onChange={e => setSellItemId(e.target.value)}
              style={{width:'100%', padding:'7px 10px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem'}}>
              <option value="">選択してください</option>
              {inventoryItems.map(({id, qty, item}) => (
                <option key={id} value={id}>{item!.icon} {item!.name} (×{qty})</option>
              ))}
            </select>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8}}>
            <div>
              <label style={{fontSize:'0.78rem', color:'#8a92b2', display:'block', marginBottom:4}}>数量</label>
              <input type="number" value={sellAmount} min={1} onChange={e => setSellAmount(Number(e.target.value))}
                style={{width:'100%', padding:'7px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, boxSizing:'border-box' as const}} />
            </div>
            <div>
              <label style={{fontSize:'0.78rem', color:'#8a92b2', display:'block', marginBottom:4}}>価格/個 (G)</label>
              <input type="number" value={sellPrice} min={1} onChange={e => setSellPrice(Number(e.target.value))}
                style={{width:'100%', padding:'7px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, boxSizing:'border-box' as const}} />
            </div>
          </div>
          <button onClick={handleSell} disabled={!sellItemId}
            style={{width:'100%', padding:'8px', background: sellItemId ? '#f0a830' : '#2d3752', color: sellItemId ? '#000' : '#4a5070', border:'none', borderRadius:6, cursor: sellItemId ? 'pointer' : 'not-allowed', fontWeight:700}}>
            出品する (24時間)
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ランキングパネル
// ============================================================
function RankingPanel() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingType, setRankingType] = useState<'gold' | 'level' | 'fishing' | 'dungeon'>('gold');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeAllPlayersAdmin(ps => {
      setPlayers(ps.filter(p => !p.banned));
      setLoading(false);
    });
    return unsub;
  }, []);

  const getRanking = useCallback(() => {
    const sorted = [...players];
    switch (rankingType) {
      case 'gold':    return sorted.sort((a,b) => (b.gold ?? 0) - (a.gold ?? 0)).slice(0, 20);
      case 'level':   return sorted.sort((a,b) => (b.stats?.level ?? 1) - (a.stats?.level ?? 1)).slice(0, 20);
      case 'fishing': return sorted.sort((a,b) => (b.fishingScore ?? 0) - (a.fishingScore ?? 0)).slice(0, 20);
      case 'dungeon': return sorted.sort((a,b) => {
        const aTotal = Object.values((a.dungeonClearedCount ?? {}) as Record<string,number>).reduce((s,v)=>s+v,0);
        const bTotal = Object.values((b.dungeonClearedCount ?? {}) as Record<string,number>).reduce((s,v)=>s+v,0);
        return bTotal - aTotal;
      }).slice(0, 20);
    }
  }, [players, rankingType]);

  return (
    <div>
      <div style={{display:'flex', gap:6, marginBottom:12, flexWrap:'wrap'}}>
        {([['gold','💰 所持金'],['level','⚔️ レベル'],['fishing','🎣 釣りスコア'],['dungeon','🏰 ダンジョン']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setRankingType(k)}
            style={{padding:'6px 10px', background: rankingType===k ? 'rgba(240,192,96,0.2)' : '#1c2235', border:`1px solid ${rankingType===k ? '#f0c060' : '#2d3752'}`, color: rankingType===k ? '#f0c060' : '#8a92b2', borderRadius:6, cursor:'pointer', fontSize:'0.78rem'}}>
            {l}
          </button>
        ))}
      </div>
      {loading
        ? <div style={{color:'#8a92b2', textAlign:'center', padding:16}}>読み込み中...</div>
        : (
          <div style={{display:'flex', flexDirection:'column', gap:4}}>
            {getRanking().map((p, i) => {
              const medals = ['🥇','🥈','🥉'];
              const rank = medals[i] ?? `${i+1}.`;
              let value = '';
              switch (rankingType) {
                case 'gold':    value = `${(p.gold ?? 0).toLocaleString()}G`; break;
                case 'level':   value = `Lv.${p.stats?.level ?? 1}`; break;
                case 'fishing': value = `${(p.fishingScore ?? 0).toLocaleString()}pt`; break;
                case 'dungeon': {
                  const total = Object.values((p.dungeonClearedCount ?? {}) as Record<string,number>).reduce((s,v)=>s+v,0);
                  value = `${total}回クリア`; break;
                }
              }
              return (
                <div key={p.id} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#1c2235', border:'1px solid #2d3752', borderRadius:6}}>
                  <span style={{fontSize:'1.1rem', width:24, textAlign:'center'}}>{rank}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.85rem', fontWeight:700}}>{p.displayName ?? '名無し'}</div>
                    <div style={{fontSize:'0.7rem', color:'#8a92b2'}}>Lv.{p.stats?.level ?? 1}</div>
                  </div>
                  <span style={{color:'#f0c060', fontSize:'0.85rem', fontWeight:700}}>{value}</span>
                </div>
              );
            })}
            {getRanking().length === 0 && <div style={{color:'#4a5070', textAlign:'center', padding:16}}>データなし</div>}
          </div>
        )
      }
    </div>
  );
}

export function OnlineScreen() {
  const [subTab, setSubTab] = useState<SubTab>('online');
  const [users, setUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const unsub = subscribeOnlineUsers(setUsers);
    return unsub;
  }, []);

  const SUB_TABS = [
    { id:'online'   as SubTab, label:'オンライン', icon:'dot_green' },
    { id:'activity' as SubTab, label:'活動',       icon:'radar' },
    { id:'board'    as SubTab, label:'掲示板',     icon:'chat' },
    { id:'auction'  as SubTab, label:'オークション', icon:'tag' },
    { id:'ranking'  as SubTab, label:'ランキング', icon:'trophy' },
  ];

  return (
    <div style={{padding:'12px 8px'}}>
      <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>🌐 オンライン</h2>
      <div style={{display:'flex', gap:4, marginBottom:12, overflowX:'auto'}}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            style={{flexShrink:0, padding:'6px 10px', fontSize:'0.75rem', background: subTab===t.id ? 'rgba(91,141,238,0.2)' : '#1c2235', border:`1px solid ${subTab===t.id ? '#5b8dee' : '#2d3752'}`, color: subTab===t.id ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer'}}>
            <GameIcon id={t.icon} size={15} style={{marginRight:3}} /> {t.label}
          </button>
        ))}
      </div>
      {subTab === 'online'   && <OnlinePanel users={users} />}
      {subTab === 'activity' && <ActivityPanel users={users} />}
      {subTab === 'board'    && <BoardPanel />}
      {subTab === 'auction'  && <AuctionPanel />}
      {subTab === 'ranking'  && <RankingPanel />}
    </div>
  );
}
