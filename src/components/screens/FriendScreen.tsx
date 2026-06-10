// src/components/screens/FriendScreen.tsx
import { useState, useEffect } from 'react';
// firebase/firestore unused
// db unused
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { GameIcon } from '../icons';
import type { FriendEntry, FriendRequest, DirectMessage } from '../../types/game';
import {
  sendFriendRequest, respondFriendRequest, removeFriend, toggleFavoriteFriend,
  subscribeFriends, subscribeFriendRequests, sendDirectMessage, subscribeDirectMessages,
  markDmRead, fetchFriendCountRanking, updateFriendCountRanking,
  fetchOnlinePlayerList,
} from '../../services/multiplayer';

type FriendTab = 'friends' | 'requests' | 'dm' | 'ranking' | 'search';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'たった今';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}時間前`;
  return `${Math.floor(diff / 86_400_000)}日前`;
}

// ───────────────────────────────────────────────────────
// フレンドリスト
// ───────────────────────────────────────────────────────
function FriendListPanel({ friends, myUid, onDm }: { friends: FriendEntry[]; myUid: string; onDm: (uid: string, name: string) => void }) {
  const addNotification = useGameStore(s => s.addNotification);
  const [onlineUids, setOnlineUids] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOnlinePlayerList().then(list => {
      setOnlineUids(new Set(list.map(p => p.uid)));
    });
  }, []);

  const handleRemove = async (friendUid: string) => {
    if (!confirm('フレンドを削除しますか？')) return;
    await removeFriend(myUid, friendUid);
    addNotification('info', 'フレンドを削除しました');
  };

  const handleToggleFav = async (f: FriendEntry) => {
    await toggleFavoriteFriend(myUid, f.uid, !f.favorite);
  };

  const favs = friends.filter(f => f.favorite);
  const normals = friends.filter(f => !f.favorite);

  const renderFriend = (f: FriendEntry) => {
    const isOnline = onlineUids.has(f.uid);
    return (
      <div key={f.uid} style={{ background: '#1c2235', border: `1px solid ${f.favorite ? '#f0c060' : '#2d3752'}`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: isOnline ? '#4caf87' : '#4a5070', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: f.favorite ? '#f0c060' : '#e8e6ff' }}>{f.displayName}</div>
          <div style={{ fontSize: '0.7rem', color: '#8a92b2' }}>
            Lv.{f.level} | {isOnline ? '🟢 オンライン' : `最終: ${timeAgo(f.addedAt)}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleToggleFav(f)}
            style={{ padding: '4px 6px', background: f.favorite ? 'rgba(240,192,96,0.2)' : '#161b26', border: `1px solid ${f.favorite ? '#f0c060' : '#2d3752'}`, borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
            {f.favorite ? '⭐' : '☆'}
          </button>
          <button onClick={() => onDm(f.uid, f.displayName)}
            style={{ padding: '4px 8px', background: '#5b8dee', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
            DM
          </button>
          <button onClick={() => handleRemove(f.uid)}
            style={{ padding: '4px 6px', background: '#161b26', border: '1px solid #e05555', color: '#e05555', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize: '0.82rem', color: '#8a92b2', marginBottom: 8 }}>フレンド数: {friends.length}人</div>
      {favs.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.75rem', color: '#f0c060', marginBottom: 4 }}>⭐ お気に入り</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{favs.map(renderFriend)}</div>
        </div>
      )}
      {normals.length > 0 && (
        <div>
          {favs.length > 0 && <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 4 }}>その他</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{normals.map(renderFriend)}</div>
        </div>
      )}
      {friends.length === 0 && <div style={{ color: '#4a5070', textAlign: 'center', padding: 30, fontSize: '0.85rem' }}>まだフレンドがいません</div>}
    </div>
  );
}

// ───────────────────────────────────────────────────────
// フレンド申請
// ───────────────────────────────────────────────────────
function RequestsPanel({ myUid, myName, myLevel }: { myUid: string; myName: string; myLevel: number }) {
  const addNotification = useGameStore(s => s.addNotification);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchResult, setSearchResult] = useState<{ uid: string; displayName: string; level: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [playerList, setPlayerList] = useState<{ uid: string; displayName: string; level: number }[]>([]);

  useEffect(() => {
    const unsub = subscribeFriendRequests(myUid, setRequests);
    fetchOnlinePlayerList().then(setPlayerList);
    return unsub;
  }, [myUid]);

  const handleSearch = () => {
    const found = playerList.find(p => p.displayName === searchName.trim() || p.uid === searchName.trim());
    if (found) {
      setSearchResult(found);
    } else {
      addNotification('error', 'プレイヤーが見つかりません（オンラインプレイヤーのみ検索可能）');
    }
  };

  const handleSend = async () => {
    if (!searchResult) return;
    setSending(true);
    const result = await sendFriendRequest(myUid, myName, myLevel, searchResult.uid);
    if (result.success) {
      addNotification('success', `${searchResult.displayName}にフレンド申請を送りました`);
      setSearchResult(null);
      setSearchName('');
    } else {
      addNotification('error', result.error ?? 'エラー');
    }
    setSending(false);
  };

  const handleRespond = async (reqId: string, accept: boolean) => {
    await respondFriendRequest(reqId, accept, myUid);
    addNotification('success', accept ? 'フレンドになりました！' : '申請を拒否しました');
  };

  return (
    <div>
      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5b8dee', marginBottom: 8 }}>🔍 フレンド申請を送る</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="プレイヤー名を入力..." style={{ flex: 1, padding: '7px 10px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem' }} />
          <button onClick={handleSearch} style={{ padding: '7px 12px', background: '#5b8dee', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>検索</button>
        </div>
        {searchResult && (
          <div style={{ background: '#161b26', borderRadius: 6, padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{searchResult.displayName}</div>
              <div style={{ fontSize: '0.72rem', color: '#8a92b2' }}>Lv.{searchResult.level}</div>
            </div>
            <button onClick={handleSend} disabled={sending}
              style={{ padding: '6px 12px', background: '#4caf87', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
              申請する
            </button>
          </div>
        )}
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0c060', marginBottom: 8 }}>📬 届いた申請 ({requests.length})</div>
      {requests.length === 0 && <div style={{ color: '#4a5070', textAlign: 'center', padding: 16, fontSize: '0.82rem' }}>申請はありません</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {requests.map(r => (
          <div key={r.id} style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e8e6ff' }}>{r.fromName}</div>
              <div style={{ fontSize: '0.7rem', color: '#8a92b2' }}>Lv.{r.fromLevel} | {timeAgo(r.createdAt)}</div>
            </div>
            <button onClick={() => handleRespond(r.id, true)}
              style={{ padding: '5px 10px', background: '#4caf87', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>承認</button>
            <button onClick={() => handleRespond(r.id, false)}
              style={{ padding: '5px 10px', background: '#e05555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem' }}>拒否</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────
// DM
// ───────────────────────────────────────────────────────
function DmPanel({ myUid, myName, defaultToUid, friends }: { myUid: string; myName: string; defaultToUid?: string; defaultToName?: string; friends: FriendEntry[] }) {
  const player = useGameStore(s => s.player);
  const consumeItem = useGameStore(s => s.consumeItem);
  const setPlayer = useGameStore(s => s.setPlayer);
  const saveGame = useGameStore(s => s.saveGame);
  const addNotification = useGameStore(s => s.addNotification);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedFriendUid, setSelectedFriendUid] = useState(defaultToUid ?? '');
  const [text, setText] = useState('');
  const [giftItemId, setGiftItemId] = useState('');
  const [giftAmount, setGiftAmount] = useState(1);
  const [goldAmount, setGoldAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [showGift, setShowGift] = useState(false);

  useEffect(() => {
    const unsub = subscribeDirectMessages(myUid, msgs => {
      setMessages(msgs);
      msgs.filter(m => !m.read).forEach(m => markDmRead(m.id));
    });
    return unsub;
  }, [myUid]);

  const inventoryItems = Object.entries(player?.inventory ?? {})
    .filter(([, qty]) => (qty as number) > 0)
    .map(([id, qty]) => ({ id, qty: qty as number, item: ITEM_MASTER[id] }))
    .filter(e => e.item);

  const handleSend = async () => {
    if (!player || !selectedFriendUid || !text.trim()) return;
    setSending(true);
    let gift: { itemId: string; amount: number } | undefined;
    let gold: number | undefined;
    if (showGift && giftItemId && giftAmount > 0) {
      if ((player.inventory[giftItemId] ?? 0) < giftAmount) { addNotification('error', '所持数が足りません'); setSending(false); return; }
      consumeItem(giftItemId, giftAmount);
      gift = { itemId: giftItemId, amount: giftAmount };
    }
    if (showGift && parseInt(goldAmount) > 0) {
      const ga = parseInt(goldAmount);
      if (player.gold < ga) { addNotification('error', 'ゴールドが足りません'); setSending(false); return; }
      setPlayer({ ...player, gold: player.gold - ga });
      await saveGame();
      gold = ga;
    }
    const result = await sendDirectMessage(myUid, myName, selectedFriendUid, text.trim(), gift, gold);
    if (result.success) {
      addNotification('success', 'DMを送信しました');
      setText(''); setGiftItemId(''); setGoldAmount(''); setShowGift(false);
    } else {
      addNotification('error', result.error ?? 'エラー');
    }
    setSending(false);
  };

  const inbox = messages.filter(m => m.toUid === myUid);

  return (
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5b8dee', marginBottom: 8 }}>📬 ダイレクトメッセージ</div>
      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginBottom: 6 }}>送信先フレンド</div>
        <select value={selectedFriendUid} onChange={e => setSelectedFriendUid(e.target.value)}
          style={{ width: '100%', padding: '7px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem', marginBottom: 8 }}>
          <option value="">選択してください</option>
          {friends.map(f => <option key={f.uid} value={f.uid}>{f.displayName}</option>)}
        </select>
        <textarea value={text} onChange={e => setText(e.target.value)} maxLength={300} rows={3}
          placeholder="メッセージを入力..." style={{ width: '100%', padding: '7px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box', resize: 'vertical', marginBottom: 6 }} />
        <button onClick={() => setShowGift(g => !g)}
          style={{ padding: '5px 10px', background: showGift ? 'rgba(76,175,87,0.2)' : '#161b26', border: `1px solid ${showGift ? '#4caf87' : '#2d3752'}`, color: showGift ? '#4caf87' : '#8a92b2', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', marginBottom: showGift ? 8 : 0 }}>
          🎁 プレゼント・送金
        </button>
        {showGift && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            <div style={{ fontSize: '0.75rem', color: '#8a92b2' }}>アイテム送付</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={giftItemId} onChange={e => setGiftItemId(e.target.value)}
                style={{ flex: 2, padding: '6px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.82rem' }}>
                <option value="">アイテムなし</option>
                {inventoryItems.map(({ id, qty, item }) => <option key={id} value={id}>{item!.icon} {item!.name} (×{qty})</option>)}
              </select>
              <input type="number" value={giftAmount} onChange={e => setGiftAmount(Number(e.target.value))} min={1}
                style={{ flex: 1, padding: '6px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.82rem' }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8a92b2' }}>ゴールド送金（フレンド限定・手数料なし）</div>
            <input type="number" value={goldAmount} onChange={e => setGoldAmount(e.target.value)}
              placeholder="0" min={0}
              style={{ width: '100%', padding: '6px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.82rem', boxSizing: 'border-box' }} />
          </div>
        )}
        <button onClick={handleSend} disabled={sending || !selectedFriendUid || !text.trim()}
          style={{ width: '100%', marginTop: 8, padding: '8px', background: (!selectedFriendUid || !text.trim()) ? '#2d3752' : '#5b8dee', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
          {sending ? '送信中...' : '📤 送信'}
        </button>
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0c060', marginBottom: 8 }}>📥 受信箱 ({inbox.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {inbox.length === 0 && <div style={{ color: '#4a5070', textAlign: 'center', padding: 16, fontSize: '0.82rem' }}>受信したDMはありません</div>}
        {inbox.map(m => (
          <div key={m.id} style={{ background: '#1c2235', border: `1px solid ${m.read ? '#2d3752' : '#5b8dee'}`, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0c060' }}>{m.fromName}</span>
              <span style={{ fontSize: '0.68rem', color: '#4a5070' }}>{timeAgo(m.createdAt)}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#e8e6ff', marginBottom: m.gift || m.goldAmount ? 6 : 0 }}>{m.text}</div>
            {m.gift && (
              <div style={{ background: 'rgba(76,175,87,0.1)', border: '1px solid #4caf87', borderRadius: 4, padding: '5px 8px', fontSize: '0.78rem', color: '#4caf87', display: 'flex', alignItems: 'center', gap: 6 }}>
                🎁 <GameIcon id={ITEM_MASTER[m.gift.itemId]?.icon ?? ''} size={18} /> {ITEM_MASTER[m.gift.itemId]?.name ?? m.gift.itemId} ×{m.gift.amount}
              </div>
            )}
            {m.goldAmount && m.goldAmount > 0 && (
              <div style={{ background: 'rgba(240,192,96,0.1)', border: '1px solid #f0c060', borderRadius: 4, padding: '5px 8px', fontSize: '0.78rem', color: '#f0c060', marginTop: 4 }}>
                💰 {m.goldAmount.toLocaleString()}G 受取済み
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────
// フレンド数ランキング
// ───────────────────────────────────────────────────────
function FriendRankingPanel() {
  const [ranking, setRanking] = useState<{ uid: string; displayName: string; friendCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriendCountRanking().then(r => { setRanking(r); setLoading(false); });
  }, []);

  return (
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0c060', marginBottom: 8 }}>👥 フレンド数ランキング</div>
      {loading ? <div style={{ color: '#8a92b2', textAlign: 'center', padding: 20 }}>読み込み中...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ranking.map((r, i) => (
            <div key={r.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#1c2235', border: '1px solid #2d3752', borderRadius: 6 }}>
              <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' }}>{['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{r.displayName}</div>
              </div>
              <span style={{ color: '#4caf87', fontSize: '0.85rem', fontWeight: 700 }}>{r.friendCount}人</span>
            </div>
          ))}
          {ranking.length === 0 && <div style={{ color: '#4a5070', textAlign: 'center', padding: 16 }}>データなし</div>}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────
// メイン
// ───────────────────────────────────────────────────────
export function FriendScreen() {
  const player = useGameStore(s => s.player);
  const [tab, setTab] = useState<FriendTab>('friends');
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [dmTo, setDmTo] = useState<{ uid: string; name: string } | undefined>();

  useEffect(() => {
    if (!player) return;
    const unsub1 = subscribeFriends(player.uid, setFriends);
    const unsub2 = subscribeFriendRequests(player.uid, setRequests);
    // フレンド数ランキング更新
    updateFriendCountRanking(player.uid, player.displayName).catch(() => {});
    return () => { unsub1(); unsub2(); };
  }, [player?.uid]);

  if (!player) return null;

  const handleDm = (uid: string, name: string) => {
    setDmTo({ uid, name });
    setTab('dm');
  };

  const TABS: { id: FriendTab; label: string }[] = [
    { id: 'friends', label: `👥 フレンド(${friends.length})` },
    { id: 'requests', label: `📬 申請${requests.length > 0 ? `(${requests.length})` : ''}` },
    { id: 'dm', label: '💌 DM' },
    { id: 'ranking', label: '🏆 ランキング' },
  ];

  return (
    <div style={{ padding: '12px 8px' }}>
      <h3 style={{ color: '#4caf87', marginBottom: 12, fontFamily: 'Cinzel,serif' }}>👥 フレンド</h3>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flexShrink: 0, padding: '6px 10px', fontSize: '0.75rem', background: tab === t.id ? 'rgba(76,175,87,0.2)' : '#1c2235', border: `1px solid ${tab === t.id ? '#4caf87' : '#2d3752'}`, color: tab === t.id ? '#4caf87' : '#8a92b2', borderRadius: 6, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'friends' && <FriendListPanel friends={friends} myUid={player.uid} onDm={handleDm} />}
      {tab === 'requests' && <RequestsPanel myUid={player.uid} myName={player.displayName} myLevel={player.stats.level} />}
      {tab === 'dm' && <DmPanel myUid={player.uid} myName={player.displayName} defaultToUid={dmTo?.uid} defaultToName={dmTo?.name} friends={friends} />}
      {tab === 'ranking' && <FriendRankingPanel />}
    </div>
  );
}
