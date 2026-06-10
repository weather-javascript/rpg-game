// src/components/screens/GuildScreen.tsx
import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { GameIcon } from '../icons';
import type { GuildData, GuildMember, GuildChatMessage } from '../../types/game';
import {
  createGuild, joinGuild, leaveGuild, disbandGuild, searchGuilds,
  donateToGuild, depositToGuildWarehouse, withdrawFromGuildWarehouse,
  subscribeGuild, subscribeGuildMembers, subscribeGuildChat, postGuildChat,
  getGuildRanking, GUILD_LEVEL_TABLE,
} from '../../services/multiplayer';

type GuildTab = 'overview' | 'chat' | 'warehouse' | 'bank' | 'members' | 'ranking';

// ───────────────────────────────────────────────────────
// ギルドレベルバー
// ───────────────────────────────────────────────────────
function GuildLevelBar({ guild }: { guild: GuildData }) {
  const curr = GUILD_LEVEL_TABLE.find(r => r.level === guild.level);
  const next = GUILD_LEVEL_TABLE.find(r => r.level === guild.level + 1);
  const base = curr?.donateRequired ?? 0;
  const target = next?.donateRequired ?? null;
  const pct = target ? Math.min(100, Math.round((guild.totalDonated - base) / (target - base) * 100)) : 100;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8a92b2', marginBottom: 3 }}>
        <span>ギルドLv.{guild.level}</span>
        <span>{target ? `次のLvまで: ${(target - guild.totalDonated).toLocaleString()}G` : 'MAX'}</span>
      </div>
      <div style={{ height: 8, background: '#2d3752', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#9b6df0,#5b8dee)', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────
// ギルド概要
// ───────────────────────────────────────────────────────
function OverviewPanel({ guild }: { guild: GuildData; members?: GuildMember[]; isLeader?: boolean }) {
  const player = useGameStore(s => s.player);
  const setPlayer = useGameStore(s => s.setPlayer);
  const saveGame = useGameStore(s => s.saveGame);
  const addNotification = useGameStore(s => s.addNotification);
  const [donateAmount, setDonateAmount] = useState('');
  const [donating, setDonating] = useState(false);

  const handleDonate = async () => {
    if (!player) return;
    const amount = parseInt(donateAmount);
    if (!amount || amount <= 0) return;
    if (player.gold < amount) { addNotification('error', 'ゴールドが足りません'); return; }
    setDonating(true);
    const result = await donateToGuild(player.uid, guild.id, amount);
    if (result.success) {
      const newGold = player.gold - amount;
      setPlayer({ ...player, gold: newGold });
      await saveGame();
      addNotification('success', `${amount.toLocaleString()}G を寄付しました！`);
      setDonateAmount('');
    } else {
      addNotification('error', result.error ?? 'エラー');
    }
    setDonating(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: '2rem' }}>🏰</span>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0c060' }}>{guild.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#8a92b2' }}>リーダー: {guild.leaderName}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#9b6df0' }}>Lv.{guild.level}</div>
            <div style={{ fontSize: '0.65rem', color: '#4a5070' }}>ギルドLv</div>
          </div>
        </div>
        {guild.description && <div style={{ fontSize: '0.82rem', color: '#c0bcd8', fontStyle: 'italic', marginBottom: 8 }}>「{guild.description}」</div>}
        <GuildLevelBar guild={guild} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            ['👥 メンバー', `${guild.memberCount}/${guild.maxMembers}`],
            ['💰 銀行', `${guild.bankGold.toLocaleString()}G`],
            ['📦 倉庫', `${guild.warehouseCapacity}スロット`],
            ['💸 累計寄付', `${guild.totalDonated.toLocaleString()}G`],
          ].map(([label, val]) => (
            <div key={label} style={{ background: '#161b26', borderRadius: 6, padding: '7px 10px' }}>
              <div style={{ fontSize: '0.65rem', color: '#4a5070' }}>{label}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e8e6ff' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      {/* 銀行寄付 */}
      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0c060', marginBottom: 8 }}>💰 ギルド銀行へ寄付</div>
        <div style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 6 }}>寄付額がギルドEXPとなりレベルが上がります</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input type="number" value={donateAmount} onChange={e => setDonateAmount(e.target.value)}
            placeholder="金額" min={1}
            style={{ flex: 1, padding: '7px 10px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} />
          <button onClick={handleDonate} disabled={donating || !parseInt(donateAmount)}
            style={{ padding: '7px 14px', background: parseInt(donateAmount) > 0 ? '#f0c060' : '#2d3752', color: '#0d1117', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            寄付
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────
// ギルドチャット
// ───────────────────────────────────────────────────────
function ChatPanel({ guildId }: { guildId: string }) {
  const player = useGameStore(s => s.player);
  const addNotification = useGameStore(s => s.addNotification);
  const [messages, setMessages] = useState<GuildChatMessage[]>([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const unsub = subscribeGuildChat(guildId, setMessages);
    return unsub;
  }, [guildId]);

  const handlePost = async () => {
    if (!player || !text.trim() || posting) return;
    setPosting(true);
    try {
      await postGuildChat(guildId, player.uid, player.displayName, player.stats.level, text.trim());
      setText('');
    } catch { addNotification('error', '送信に失敗しました'); }
    setPosting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 500 }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5b8dee', marginBottom: 8 }}>💬 ギルドチャット</div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: 6, background: '#161b26', borderRadius: 8, padding: '8px 10px', border: '1px solid #2d3752', marginBottom: 8 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 6 }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: m.uid === player?.uid ? '#5b8dee' : '#f0c060' }}>{m.displayName}</span>
              <span style={{ fontSize: '0.68rem', color: '#4a5070', marginLeft: 4 }}>Lv.{m.level}</span>
              <span style={{ fontSize: '0.65rem', color: '#4a5070', marginLeft: 4 }}>{new Date(m.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
              <div style={{ fontSize: '0.82rem', color: '#e8e6ff', wordBreak: 'break-all' }}>{m.text}</div>
            </div>
          </div>
        ))}
        {messages.length === 0 && <div style={{ color: '#4a5070', textAlign: 'center', padding: 20, fontSize: '0.85rem' }}>まだメッセージがありません</div>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePost()}
          placeholder="メッセージを入力..." maxLength={200}
          style={{ flex: 1, padding: '7px 10px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem' }} />
        <button onClick={handlePost} disabled={posting || !text.trim()}
          style={{ padding: '7px 14px', background: text.trim() ? '#5b8dee' : '#2d3752', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
          送信
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────
// ギルド倉庫
// ───────────────────────────────────────────────────────
function WarehousePanel({ guild }: { guild: GuildData }) {
  const player = useGameStore(s => s.player);
  const consumeItem = useGameStore(s => s.consumeItem);
  const addItems = useGameStore(s => s.addItems);
  const addNotification = useGameStore(s => s.addNotification);
  const [depositItemId, setDepositItemId] = useState('');
  const [depositAmount, setDepositAmount] = useState(1);
  const [tab, setTab] = useState<'view' | 'deposit'>('view');

  const warehouseItems = Object.entries(guild.warehouseItems ?? {}).filter(([, qty]) => qty > 0);
  const inventoryItems = Object.entries(player?.inventory ?? {})
    .filter(([, qty]) => (qty as number) > 0)
    .map(([id, qty]) => ({ id, qty: qty as number, item: ITEM_MASTER[id] }))
    .filter(e => e.item);

  const handleDeposit = async () => {
    if (!player || !depositItemId) return;
    if ((player.inventory[depositItemId] ?? 0) < depositAmount) { addNotification('error', '所持数が足りません'); return; }
    if (!consumeItem(depositItemId, depositAmount)) return;
    const result = await depositToGuildWarehouse(guild.id, player.uid, depositItemId, depositAmount);
    if (result.success) {
      addNotification('success', `${ITEM_MASTER[depositItemId]?.name} ×${depositAmount} を預けました`);
      setDepositItemId('');
    } else {
      addNotification('error', result.error ?? 'エラー');
    }
  };

  const handleWithdraw = async (itemId: string, amount: number) => {
    if (!player) return;
    const result = await withdrawFromGuildWarehouse(guild.id, player.uid, itemId, amount);
    if (result.success) {
      addItems([{ itemId, amount }]);
      addNotification('success', `${ITEM_MASTER[itemId]?.name} ×${amount} を引き出しました`);
    } else {
      addNotification('error', result.error ?? 'エラー');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['view', 'deposit'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '6px', fontSize: '0.8rem', background: tab === t ? 'rgba(91,141,238,0.2)' : '#1c2235', border: `1px solid ${tab === t ? '#5b8dee' : '#2d3752'}`, color: tab === t ? '#5b8dee' : '#8a92b2', borderRadius: 6, cursor: 'pointer' }}>
            {t === 'view' ? '📦 倉庫一覧' : '📤 預ける'}
          </button>
        ))}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#4a5070', marginBottom: 8 }}>
        使用中: {warehouseItems.length} / {guild.warehouseCapacity} スロット
      </div>
      {tab === 'view' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {warehouseItems.length === 0 && <div style={{ color: '#4a5070', textAlign: 'center', padding: 20 }}>倉庫は空です</div>}
          {warehouseItems.map(([itemId, qty]) => {
            const item = ITEM_MASTER[itemId];
            return (
              <div key={itemId} style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 6, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GameIcon id={item?.icon ?? ''} size={22} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item?.name ?? itemId}</div>
                  <div style={{ fontSize: '0.7rem', color: '#8a92b2' }}>×{qty}</div>
                </div>
                <button onClick={() => handleWithdraw(itemId, 1)}
                  style={{ padding: '4px 10px', background: '#5b8dee', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                  引き出す(1)
                </button>
              </div>
            );
          })}
        </div>
      )}
      {tab === 'deposit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select value={depositItemId} onChange={e => setDepositItemId(e.target.value)}
            style={{ width: '100%', padding: '7px', background: '#1c2235', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem' }}>
            <option value="">アイテムを選択</option>
            {inventoryItems.map(({ id, qty, item }) => (
              <option key={id} value={id}>{item!.icon} {item!.name} (×{qty})</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="number" value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))} min={1}
              style={{ flex: 1, padding: '7px', background: '#1c2235', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6 }} />
            <button onClick={handleDeposit} disabled={!depositItemId}
              style={{ padding: '7px 14px', background: depositItemId ? '#4caf87' : '#2d3752', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
              預ける
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────
// ランキング
// ───────────────────────────────────────────────────────
function GuildRankingPanel() {
  const [type, setType] = useState<'totalAssets' | 'totalKills' | 'totalLevels'>('totalAssets');
  const [guilds, setGuilds] = useState<GuildData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getGuildRanking(type).then(gs => { setGuilds(gs); setLoading(false); });
  }, [type]);

  const TYPE_LABELS = { totalAssets: '💰 総資産', totalKills: '⚔️ 総討伐数', totalLevels: '📈 総レベル' };
  const getValue = (g: GuildData) => {
    if (type === 'totalAssets') return `${(g.totalAssets ?? 0).toLocaleString()}G`;
    if (type === 'totalKills') return `${(g.totalKills ?? 0).toLocaleString()}体`;
    return `${(g.totalLevels ?? 0).toLocaleString()}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {(Object.entries(TYPE_LABELS) as [typeof type, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setType(k)}
            style={{ padding: '5px 10px', fontSize: '0.78rem', background: type === k ? 'rgba(240,192,96,0.2)' : '#1c2235', border: `1px solid ${type === k ? '#f0c060' : '#2d3752'}`, color: type === k ? '#f0c060' : '#8a92b2', borderRadius: 6, cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>
      {loading ? <div style={{ color: '#8a92b2', textAlign: 'center', padding: 20 }}>読み込み中...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {guilds.map((g, i) => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#1c2235', border: '1px solid #2d3752', borderRadius: 6 }}>
              <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' }}>{['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f0c060' }}>{g.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#8a92b2' }}>Lv.{g.level} ・ {g.memberCount}人</div>
              </div>
              <span style={{ color: '#e8e6ff', fontSize: '0.85rem', fontWeight: 700 }}>{getValue(g)}</span>
            </div>
          ))}
          {guilds.length === 0 && <div style={{ color: '#4a5070', textAlign: 'center', padding: 20 }}>データなし</div>}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────
// ギルド内メンバーリスト
// ───────────────────────────────────────────────────────
function MembersPanel({ members, guild }: { members: GuildMember[]; guild: GuildData; isLeader?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4caf87', marginBottom: 8 }}>👥 メンバー ({members.length}/{guild.maxMembers})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {members.map(m => (
          <div key={m.uid} style={{ background: '#1c2235', border: `1px solid ${m.role === 'leader' ? '#f0c060' : '#2d3752'}`, borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>{m.role === 'leader' ? '👑' : '⚔️'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: m.role === 'leader' ? '#f0c060' : '#e8e6ff' }}>{m.displayName}</div>
              <div style={{ fontSize: '0.7rem', color: '#8a92b2' }}>Lv.{m.level} | 累計寄付: {m.totalDonated.toLocaleString()}G</div>
            </div>
            <span style={{ fontSize: '0.72rem', color: m.role === 'leader' ? '#f0c060' : '#4a5070' }}>{m.role === 'leader' ? 'リーダー' : 'メンバー'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────
// ギルドなし画面（作成・検索・加入）
// ───────────────────────────────────────────────────────
function NoGuildPanel() {
  const player = useGameStore(s => s.player);
  const addNotification = useGameStore(s => s.addNotification);
  const [tab, setTab] = useState<'create' | 'search'>('search');
  const [guildName, setGuildName] = useState('');
  const [guildDesc, setGuildDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<GuildData[]>([]);
  const [joining, setJoining] = useState('');

  const handleCreate = async () => {
    if (!player || !guildName.trim()) return;
    setCreating(true);
    const result = await createGuild(player.uid, player.displayName, guildName, guildDesc);
    if (result.success) {
      addNotification('success', `ギルド「${guildName}」を作成しました！`);
    } else {
      addNotification('error', result.error ?? 'エラー');
    }
    setCreating(false);
  };

  const handleSearch = async () => {
    const r = await searchGuilds(searchQuery);
    setResults(r);
  };

  const handleJoin = async (guildId: string) => {
    if (!player) return;
    setJoining(guildId);
    const result = await joinGuild(player.uid, player.displayName, player.stats.level, guildId);
    if (result.success) {
      addNotification('success', 'ギルドに加入しました！');
    } else {
      addNotification('error', result.error ?? 'エラー');
    }
    setJoining('');
  };

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 16 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>🏰</div>
        <div style={{ color: '#8a92b2', fontSize: '0.9rem' }}>まだギルドに所属していません</div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['search', 'create'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '7px', fontSize: '0.8rem', background: tab === t ? 'rgba(155,109,240,0.2)' : '#1c2235', border: `1px solid ${tab === t ? '#9b6df0' : '#2d3752'}`, color: tab === t ? '#9b6df0' : '#8a92b2', borderRadius: 6, cursor: 'pointer' }}>
            {t === 'search' ? '🔍 検索・加入' : '➕ 新規作成'}
          </button>
        ))}
      </div>
      {tab === 'search' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="ギルド名で検索..." style={{ flex: 1, padding: '7px 10px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem' }} />
            <button onClick={handleSearch} style={{ padding: '7px 14px', background: '#9b6df0', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>検索</button>
          </div>
          {results.length === 0 && <div style={{ color: '#4a5070', textAlign: 'center', padding: 12, fontSize: '0.82rem' }}>検索してギルドを探してください</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map(g => (
              <div key={g.id} style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.3rem' }}>🏰</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0c060' }}>{g.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#8a92b2' }}>Lv.{g.level} | {g.memberCount}/{g.maxMembers}人 | リーダー: {g.leaderName}</div>
                  </div>
                </div>
                {g.description && <div style={{ fontSize: '0.78rem', color: '#c0bcd8', marginBottom: 6, fontStyle: 'italic' }}>「{g.description}」</div>}
                <button onClick={() => handleJoin(g.id)} disabled={joining === g.id || g.memberCount >= g.maxMembers}
                  style={{ width: '100%', padding: '6px', background: g.memberCount >= g.maxMembers ? '#2d3752' : '#4caf87', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                  {g.memberCount >= g.maxMembers ? '満員' : joining === g.id ? '加入中...' : '加入する'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 3 }}>ギルド名 (必須)</div>
            <input value={guildName} onChange={e => setGuildName(e.target.value)} maxLength={20}
              placeholder="ギルド名を入力..." style={{ width: '100%', padding: '7px 10px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 3 }}>説明文 (任意)</div>
            <textarea value={guildDesc} onChange={e => setGuildDesc(e.target.value)} maxLength={100} rows={3}
              placeholder="ギルドの紹介文..." style={{ width: '100%', padding: '7px 10px', background: '#161b26', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
          <button onClick={handleCreate} disabled={creating || !guildName.trim()}
            style={{ padding: '10px', background: guildName.trim() ? 'linear-gradient(135deg,#9b6df0,#5b8dee)' : '#2d3752', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
            {creating ? '作成中...' : '🏰 ギルドを作成'}
          </button>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────
// メインギルド画面
// ───────────────────────────────────────────────────────
export function GuildScreen() {
  const player = useGameStore(s => s.player);
  const addNotification = useGameStore(s => s.addNotification);
  const [guild, setGuild] = useState<GuildData | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [subTab, setSubTab] = useState<GuildTab>('overview');
  const [leaving, setLeaving] = useState(false);

  const guildId = (player as any)?.guildId as string | undefined;

  useEffect(() => {
    if (!guildId) { setGuild(null); setMembers([]); return; }
    const unsub1 = subscribeGuild(guildId, setGuild);
    const unsub2 = subscribeGuildMembers(guildId, setMembers);
    return () => { unsub1(); unsub2(); };
  }, [guildId]);

  const isLeader = guild?.leaderUid === player?.uid;

  const handleLeave = async () => {
    if (!player || !guildId) return;
    setLeaving(true);
    const fn = isLeader ? disbandGuild : leaveGuild;
    const result = await fn(player.uid, guildId);
    if (result.success) {
      addNotification('success', isLeader ? 'ギルドを解散しました' : 'ギルドを脱退しました');
    } else {
      addNotification('error', result.error ?? 'エラー');
    }
    setLeaving(false);
  };

  const TABS: { id: GuildTab; label: string }[] = [
    { id: 'overview', label: '🏰 概要' },
    { id: 'chat', label: '💬 チャット' },
    { id: 'warehouse', label: '📦 倉庫' },
    { id: 'members', label: '👥 メンバー' },
    { id: 'ranking', label: '🏆 ランキング' },
  ];

  if (!guildId) return (
    <div style={{ padding: '12px 8px' }}>
      <h3 style={{ color: '#9b6df0', marginBottom: 12, fontFamily: 'Cinzel,serif' }}>🏰 ギルド</h3>
      <NoGuildPanel />
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: '0.72rem', color: '#4a5070', marginBottom: 6 }}>ランキングを見る</div>
        <GuildRankingPanel />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '12px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ color: '#9b6df0', margin: 0, fontFamily: 'Cinzel,serif' }}>🏰 {guild?.name ?? 'ギルド'}</h3>
        <button onClick={handleLeave} disabled={leaving}
          style={{ padding: '5px 10px', background: 'rgba(224,85,85,0.1)', border: '1px solid #e05555', color: '#e05555', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}>
          {isLeader ? '解散' : '脱退'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            style={{ flexShrink: 0, padding: '6px 10px', fontSize: '0.75rem', background: subTab === t.id ? 'rgba(155,109,240,0.2)' : '#1c2235', border: `1px solid ${subTab === t.id ? '#9b6df0' : '#2d3752'}`, color: subTab === t.id ? '#9b6df0' : '#8a92b2', borderRadius: 6, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>
      {guild ? (
        <>
          {subTab === 'overview' && <OverviewPanel guild={guild} members={members} isLeader={isLeader} />}
          {subTab === 'chat' && <ChatPanel guildId={guild.id} />}
          {subTab === 'warehouse' && <WarehousePanel guild={guild} />}
          {subTab === 'members' && <MembersPanel members={members} guild={guild} isLeader={isLeader} />}
          {subTab === 'ranking' && <GuildRankingPanel />}
        </>
      ) : <div style={{ color: '#8a92b2', textAlign: 'center', padding: 40 }}>読み込み中...</div>}
    </div>
  );
}
