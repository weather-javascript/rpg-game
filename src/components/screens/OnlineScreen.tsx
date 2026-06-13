// src/components/screens/OnlineScreen.tsx
// オンライン画面：活動タブを4サブタブ構成にリニューアル
// 【変更履歴を更新する際の注意】
// このファイルを変更したら必ず src/data/masters.ts の VERSION_PATCHES[0] に変更内容を追記すること。

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import type { PlayerData } from '../../types/game';
import {
  subscribeOnlineUsers, subscribeBoardMessages, postBoardMessage,
  subscribeAuctions, createAuction, buyAuction, cancelAuction,
  subscribeAllPlayersAdmin,
  subscribeActivityFeed, ActivityFeedEntry, postActivityFeed,
  submitProposal,
  deleteBoardMessage, addBoardReaction, removeBoardReaction, addBoardReply, voteBoardPoll,
  sendGold, fetchMyTransfers, fetchTransferRanking, fetchOnlinePlayerList, TransferRecord,
} from '../../services/multiplayer';
import { fetchLoginBonus, claimLoginBonus, LOGIN_BONUS_REWARDS, LoginBonusState } from '../../services/database';
import type { OnlineUser, BoardMessage, AuctionListing } from '../../types/game';

import { GuildScreen } from './GuildScreen';
import { FriendScreen } from './FriendScreen';

type SubTab = 'online' | 'board' | 'auction' | 'activity' | 'ranking' | 'proposal' | 'transfer' | 'guild' | 'friend';
type ActivitySubTab = 'world_news' | 'player_status' | 'world_status' | 'gamble_flash' | 'natural_news';

// ============================================================
// 活動タブ内 サブタブ
// ============================================================

// ─── ワールドニュース ────────────────────────────────────────
const WORLD_NEWS_TYPES = new Set([
  'dungeon_clear','sky_castle_clear','sky_castle_ex_clear','volcano_clear',
  'boss_kx','boss_rei','boss_ragnarok','boss_hard',
  'super_jackpot','jackpot','gamble_rank_up',
  'level_50','level_100','level_200',
  'event_clear','admin_event',
]);

// ワールドニュースに表示するギャンブルの大勝ち閾値（WC）

const NEWS_STYLE: Record<string, { emoji: string; color: string }> = {
  dungeon_clear:        { emoji: '🏰', color: '#f0c060' },
  sky_castle_clear:     { emoji: '🏯', color: '#f0c060' },
  sky_castle_ex_clear:  { emoji: '✨', color: '#ff9933' },
  volcano_clear:        { emoji: '🌋', color: '#ff6644' },
  boss_kx:              { emoji: '🤖', color: '#e05555' },
  boss_rei:             { emoji: '💀', color: '#cc44cc' },
  boss_ragnarok:        { emoji: '🌪️', color: '#ff4444' },
  boss_hard:            { emoji: '⚔️', color: '#e05555' },
  super_jackpot:        { emoji: '🌟', color: '#ffd700' },
  jackpot:              { emoji: '💰', color: '#f0c060' },
  gamble_rank_up:       { emoji: '🎖️', color: '#9b6df0' },
  level_50:             { emoji: '💎', color: '#5b8dee' },
  level_100:            { emoji: '👑', color: '#f0c060' },
  level_200:            { emoji: '🔮', color: '#ff66cc' },
  event_clear:          { emoji: '🎉', color: '#4caf87' },
  admin_event:          { emoji: '📢', color: '#5b8dee' },
};

// ─── ワールドニュース ランクテーブル ────────────────────────
const NEWS_RANK: Record<string, number> = {
  super_jackpot: 5, sky_castle_ex_clear: 5, level_200: 5,
  volcano_clear: 4, boss_kx: 4, boss_rei: 4, boss_ragnarok: 4,
  jackpot: 3, sky_castle_clear: 3, boss_hard: 3, level_100: 3,
  dungeon_clear: 2, gamble_rank_up: 2, level_50: 2, event_clear: 2,
  admin_event: 1,
};

function WorldNewsPanel() {
  const [entries, setEntries] = useState<ActivityFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeActivityFeed(es => {
      setEntries(es.filter(e => WORLD_NEWS_TYPES.has(e.type)));
      setLoading(false);
    });
    return unsub;
  }, []);

  // shimmer animation tick
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <h3 style={{color:'#f0c060', marginBottom:2, fontSize:'0.95rem', display:'flex', alignItems:'center', gap:6}}>
        <span style={{animation:`spin ${tick}s linear`}}>🌍</span> ワールドニュース
      </h3>
      <p style={{fontSize:'0.72rem', color:'#4a5070', marginBottom:10}}>世界で起きた重要イベント</p>
      <div style={{display:'flex', flexDirection:'column', gap:6, maxHeight:520, overflowY:'auto', paddingBottom:4}}>
        {loading && <div style={{color:'#8a92b2', textAlign:'center', padding:24, fontSize:'0.85rem'}}>読み込み中...</div>}
        {!loading && entries.length === 0 && <div style={{color:'#4a5070', textAlign:'center', padding:24, fontSize:'0.85rem'}}>まだニュースがありません</div>}
        {entries.map((e, i) => {
          const s = NEWS_STYLE[e.type] ?? { emoji: '📌', color: '#8a92b2' };
          const rank = NEWS_RANK[e.type] ?? 1;
          const now = Date.now();
          const diff = now - e.timestamp;
          const timeLabel = diff < 60_000 ? 'たった今'
            : diff < 3_600_000 ? `${Math.floor(diff/60_000)}分前`
            : diff < 86_400_000 ? `${Math.floor(diff/3_600_000)}時間前`
            : new Date(e.timestamp).toLocaleDateString('ja-JP', { month:'numeric', day:'numeric' });

          // rank5: super jackpot / sky_castle_ex / lv200
          if (rank >= 5) return (
            <div key={i} style={{
              position:'relative', borderRadius:8, overflow:'hidden',
              background:'rgba(255,215,0,0.06)',
              border:'1px solid #ffd700',
              padding:'7px 10px',
              display:'flex', alignItems:'center', gap:8,
            }}>
              {/* shimmer strip */}
              <div style={{position:'absolute',top:0,left:`${(tick*30)%160-40}%`,width:'40%',height:'100%',
                background:'linear-gradient(90deg,transparent,rgba(255,215,0,0.15),transparent)',
                pointerEvents:'none'}} />
              <span style={{fontSize:'1.1rem'}}>{s.emoji}✨</span>
              <div style={{flex:1, minWidth:0, wordBreak:'break-word', overflowWrap:'anywhere'}}>
                <span style={{fontSize:'0.82rem', fontWeight:800, color:'#ffd700'}}>{e.displayName}</span>
                <span style={{fontSize:'0.8rem', fontWeight:500, color:'#f0d880'}}>{e.message.replace(e.displayName,'')}</span>
              </div>
              <span style={{fontSize:'0.62rem', color:'#7a6a30', whiteSpace:'nowrap'}}>{timeLabel}</span>
            </div>
          );

          // rank4: volcano/boss_kx/boss_rei/boss_ragnarok
          if (rank === 4) return (
            <div key={i} style={{
              borderRadius:8,
              background:'rgba(255,255,255,0.03)',
              border:`1px solid ${s.color}88`,
              padding:'7px 10px',
              display:'flex', alignItems:'center', gap:8,
            }}>
              <span style={{fontSize:'1.05rem'}}>{s.emoji}</span>
              <div style={{flex:1, minWidth:0, wordBreak:'break-word', overflowWrap:'anywhere'}}>
                <span style={{fontSize:'0.82rem', fontWeight:700, color: s.color}}>{e.displayName}</span>
                <span style={{fontSize:'0.8rem', color:'#c0bcd8'}}>{e.message.replace(e.displayName,'')}</span>
              </div>
              <span style={{fontSize:'0.62rem', color:'#4a5070', whiteSpace:'nowrap'}}>{timeLabel}</span>
            </div>
          );

          // rank3: jackpot/sky_castle_clear/boss_hard/lv100
          if (rank === 3) return (
            <div key={i} style={{
              borderRadius:8,
              background:'rgba(255,255,255,0.03)',
              border:`1px solid ${s.color}88`,
              boxShadow:`inset 0 0 0 1px ${s.color}22`,
              padding:'9px 12px',
              display:'flex', alignItems:'center', gap:8,
            }}>
              <span style={{fontSize:'1.1rem'}}>{s.emoji}</span>
              <div style={{flex:1, minWidth:0, wordBreak:'break-word', overflowWrap:'anywhere'}}>
                <span style={{fontSize:'0.82rem', fontWeight:700, color: s.color}}>{e.displayName}</span>
                <span style={{fontSize:'0.8rem', color:'#c0bcd8'}}>{e.message.replace(e.displayName,'')}</span>
              </div>
              <span style={{fontSize:'0.62rem', color:'#4a5070', whiteSpace:'nowrap'}}>{timeLabel}</span>
            </div>
          );

          // rank1-2: default
          return (
            <div key={i} style={{
              borderRadius:7,
              background:'rgba(255,255,255,0.015)',
              border:'1px solid #1c2235',
              padding:'8px 12px',
              display:'flex', alignItems:'center', gap:8,
            }}>
              <span style={{fontSize:'1rem'}}>{s.emoji}</span>
              <div style={{flex:1, minWidth:0, wordBreak:'break-word', overflowWrap:'anywhere'}}>
                <span style={{fontSize:'0.8rem', fontWeight:600, color: s.color}}>{e.displayName}</span>
                <span style={{fontSize:'0.78rem', color:'#8a92b2'}}>{e.message.replace(e.displayName,'')}</span>
              </div>
              <span style={{fontSize:'0.62rem', color:'#4a5070', whiteSpace:'nowrap'}}>{timeLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── プレイヤー状況 ─────────────────────────────────────────
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'たった今';
  if (diff < 3_600_000) return `${Math.floor(diff/60_000)}分前`;
  if (diff < 86_400_000) return `${Math.floor(diff/3_600_000)}時間前`;
  return '1日以上前';
}

const TITLE_LABELS: Record<string, string> = {
  beginner:'🌱 見習い冒険者', lv10:'⚔️ 一人前', lv30:'🗡️ 熟練冒険者', lv50:'💎 エキスパート',
  lv100:'👑 レジェンド', dungeon10:'🏰 ダンジョンマスター', dungeon50:'🌟 ダンジョン王',
  rich:'💰 大富豪', fisher:'🎣 釣り名人', crafter:'🔨 名工',
};

function ProfilePopup({ uid, onClose }: { uid: string; onClose: () => void }) {
  const [pdata, setPdata] = useState<PlayerData | null>(null);
  const [actLog, setActLog] = useState<ActivityFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'players', uid));
        if (snap.exists()) setPdata(snap.data() as PlayerData);
      } catch { /* ignore */ }
      setLoading(false);
    })();
    // 活動履歴: activityFeedから該当uidの重要イベント最新10件
    const unsub = subscribeActivityFeed(es => {
      setActLog(es.filter(e => e.uid === uid && WORLD_NEWS_TYPES.has(e.type)).slice(0, 10));
    });
    return unsub;
  }, [uid]);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'#1c2235',border:'1px solid #2d3752',borderRadius:12,padding:20,width:'100%',maxWidth:340,position:'relative',maxHeight:'80vh',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'none',border:'none',color:'#4a5070',fontSize:'1.2rem',cursor:'pointer'}}>✕</button>
        {loading ? (
          <div style={{textAlign:'center',color:'#4a5070',padding:'20px 0'}}>読み込み中...</div>
        ) : !pdata ? (
          <div style={{textAlign:'center',color:'#4a5070',padding:'20px 0'}}>プロフィールが見つかりません</div>
        ) : (
          <>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:14}}>
              <span style={{fontSize:'2.5rem'}}>{pdata.profile?.icon ?? '⚔️'}</span>
              <div>
                <div style={{fontSize:'1rem',fontWeight:700,color:'#f0c060'}}>{pdata.displayName}</div>
                <div style={{fontSize:'0.78rem',color:'#5b8dee'}}>Lv.{pdata.stats.level}</div>
                {pdata.profile?.titleId && <div style={{fontSize:'0.75rem',color:'#8a92b2',marginTop:2}}>{TITLE_LABELS[pdata.profile.titleId] ?? ''}</div>}
              </div>
            </div>
            {pdata.profile?.comment && (
              <div style={{background:'#161b26',borderRadius:6,padding:'8px 10px',fontSize:'0.82rem',color:'#e8e6ff',marginBottom:10,fontStyle:'italic'}}>
                「{pdata.profile.comment}」
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
              {[
                ['攻撃力', `⚔️ ${pdata.stats.attack}`],
                ['防御力', `🛡️ ${pdata.stats.defense}`],
                ['所持金', `💰 ${pdata.gold.toLocaleString()}G`],
                ['釣りスコア', `🎣 ${pdata.fishingScore ?? 0}`],
              ].map(([label, value]) => (
                <div key={label} style={{background:'#161b26',borderRadius:6,padding:'6px 8px'}}>
                  <div style={{fontSize:'0.65rem',color:'#4a5070'}}>{label}</div>
                  <div style={{fontSize:'0.82rem',color:'#e8e6ff',fontWeight:700}}>{value}</div>
                </div>
              ))}
            </div>
            {actLog.length > 0 && (
              <div>
                <div style={{fontSize:'0.75rem',color:'#8a92b2',marginBottom:6}}>📋 活動履歴（重要イベント）</div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {actLog.map((e, i) => {
                    const style = NEWS_STYLE[e.type] ?? { emoji: '📌', color: '#8a92b2' };
                    return (
                      <div key={i} style={{fontSize:'0.75rem',background:'#161b26',borderRadius:4,padding:'4px 8px',display:'flex',gap:6,alignItems:'center'}}>
                        <span>{style.emoji}</span>
                        <span style={{color: style.color,flex:1}}>{e.message}</span>
                        <span style={{color:'#4a5070',fontSize:'0.65rem'}}>{timeAgo(e.timestamp)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PlayerStatusPanel({ users }: { users: OnlineUser[] }) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  if (users.length === 0) {
    return <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:20}}>現在オンラインのプレイヤーはいません</p>;
  }

  return (
    <div>
      <h3 style={{color:'#4caf87', marginBottom:8, fontSize:'0.95rem'}}>👥 プレイヤー状況 ({users.length}人)</h3>
      <p style={{fontSize:'0.72rem', color:'#4a5070', marginBottom:10}}>名前をタップでプロフィール表示</p>
      <div style={{display:'flex', flexDirection:'column', gap:6}}>
        {users.map(u => {
          const actLabel = u.currentActivity ?? 'ホーム画面';
          const isGambling = actLabel.includes('ギャンブル');
          const isDungeon = actLabel.includes('攻略') || actLabel.includes('戦闘');
          const accentColor = isGambling ? '#f0c060' : isDungeon ? '#e05555' : '#4caf87';
          const updatedAt = (u as { updatedAt?: number }).updatedAt;
          return (
            <div key={u.uid} style={{background:'#1c2235', border:`1px solid #2d3752`, borderRadius:8, padding:'10px 12px', borderLeft:`3px solid ${accentColor}`}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <span style={{fontSize:'0.88rem', fontWeight:700, color:'#e8e6ff', cursor:'pointer', textDecoration:'underline dotted'}}
                    onClick={() => setSelectedUid(u.uid)}>
                    ⚔️ {u.displayName}
                  </span>
                  <span style={{fontSize:'0.72rem', color:'#5b8dee', marginLeft:8}}>Lv.{u.level}</span>
                </div>
                <span style={{fontSize:'0.65rem', color:'#4a5070'}}>{updatedAt ? timeAgo(updatedAt) : ''}</span>
              </div>
              <div style={{fontSize:'0.78rem', color: accentColor, marginTop:5}}>
                📍 現在：{actLabel}
              </div>
            </div>
          );
        })}
      </div>
      {selectedUid && <ProfilePopup uid={selectedUid} onClose={() => setSelectedUid(null)} />}
    </div>
  );
}

// ─── ワールド状況 ────────────────────────────────────────────
function WorldStatusPanel({ users }: { users: OnlineUser[] }) {
  const counts: Record<string, number> = {};
  for (const u of users) {
    const label = u.currentActivity ?? 'ホーム画面';
    // カテゴリに集約
    let cat = 'ホーム画面';
    if (label.includes('攻略') || label.includes('戦闘')) cat = 'ダンジョン攻略中';
    else if (label === 'ギャンブル中') cat = 'ギャンブル中';
    else if (label === '採掘中') cat = '採掘中';
    else if (label === '釣り中') cat = '釣り中';
    else if (label.includes('PvP')) cat = 'PvP中';
    else if (label === 'マーケット閲覧中') cat = 'マーケット閲覧中';
    else if (label === 'クラフト中') cat = 'クラフト中';
    counts[cat] = (counts[cat] ?? 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  const catEmoji: Record<string,string> = {
    'ダンジョン攻略中':'⚔️','ギャンブル中':'🎰','採掘中':'⛏️',
    '釣り中':'🎣','PvP中':'🥊','マーケット閲覧中':'🛒',
    'クラフト中':'🔨','ホーム画面':'🏠',
  };

  return (
    <div>
      <h3 style={{color:'#9b6df0', marginBottom:8, fontSize:'0.95rem'}}>🌐 ワールド状況</h3>
      <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'12px 14px', marginBottom:12}}>
        <div style={{fontSize:'0.78rem', color:'#8a92b2', marginBottom:2}}>オンライン人数</div>
        <div style={{fontSize:'1.8rem', fontWeight:700, color:'#4caf87'}}>{users.length}人</div>
      </div>
      {sorted.length === 0 && <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:10}}>データなし</p>}
      <div style={{display:'flex', flexDirection:'column', gap:6}}>
        {sorted.map(([cat, cnt]) => {
          const pct = users.length > 0 ? Math.round(cnt / users.length * 100) : 0;
          return (
            <div key={cat} style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, padding:'8px 12px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
                <span style={{fontSize:'0.85rem'}}>{catEmoji[cat] ?? '📍'} {cat}</span>
                <span style={{fontSize:'0.85rem', fontWeight:700, color:'#f0c060'}}>{cnt}人</span>
              </div>
              <div style={{height:5, background:'#2d3752', borderRadius:3, overflow:'hidden'}}>
                <div style={{height:'100%', background:'linear-gradient(90deg,#5b8dee,#9b6df0)', width:`${pct}%`, transition:'width 0.3s'}} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ナチュラルニュース ───────────────────────────────────────
const NATURAL_TYPE_LABELS: Record<string, string> = {
  mining: '⛏️',
  fishing: '🎣',
  auction: '🏷️',
  crafting: '🔨',
  dungeon: '⚔️',
  level_up: '⬆️',
  dungeon_clear: '🏰',
  gamble_win: '🎲',
  gamble_lose: '🃏',
  pvp_win: '⚔️',
  pvp_lose: '💀',
  treasure: '🎁',
};

function NaturalNewsPanel() {
  const [entries, setEntries] = useState<ActivityFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeActivityFeed(es => {
      setEntries(es);
      setLoading(false);
    });
    return unsub;
  }, []);

  const natural = entries.filter(e =>
    ['mining','fishing','auction','crafting','level_up','dungeon_clear'].includes(e.type) && !WORLD_NEWS_TYPES.has(e.type)
  );

  return (
    <div>
      <h3 style={{color:'#4caf87', marginBottom:4, fontSize:'0.95rem'}}>🌿 ナチュラルニュース</h3>
      <p style={{fontSize:'0.72rem', color:'#4a5070', marginBottom:10}}>採掘・釣り・オークション・クラフト等の記録</p>
      <div style={{display:'flex', flexDirection:'column', background:'#161b26', border:'1px solid #2d3752', borderRadius:10, overflow:'hidden', maxHeight:520, overflowY:'auto'}}>
        {loading && <div style={{color:'#8a92b2', textAlign:'center', padding:24, fontSize:'0.85rem'}}>読み込み中...</div>}
        {!loading && natural.length === 0 && <div style={{color:'#4a5070', textAlign:'center', padding:24, fontSize:'0.85rem'}}>まだ記録がありません</div>}
        {natural.map((e, i) => {
          const icon = NATURAL_TYPE_LABELS[e.type] ?? '📌';
          const now = Date.now();
          const diff = now - e.timestamp;
          const timeLabel = diff < 60_000 ? 'たった今'
            : diff < 3_600_000 ? `${Math.floor(diff/60_000)}分前`
            : `${Math.floor(diff/3_600_000)}時間前`;
          return (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
              borderBottom: i < natural.length-1 ? '1px solid #1c2235' : 'none',
            }}>
              <span style={{fontSize:'1rem', minWidth:20, textAlign:'center'}}>{icon}</span>
              <div style={{flex:1, minWidth:0}}>
                <span style={{fontSize:'0.8rem', color:'#c0bcd8', fontWeight:600}}>{e.displayName}</span>
                <span style={{fontSize:'0.78rem', color:'#8a92b2'}}>{e.message.replace(e.displayName,'')}</span>
              </div>
              <span style={{fontSize:'0.62rem', color:'#4a5070', whiteSpace:'nowrap'}}>{timeLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ギャンブル速報 ──────────────────────────────────────────
const GAMBLE_TYPES = new Set(['gamble_win','gamble_lose','jackpot','super_jackpot','gamble_rank_up','treasure','pvp_win','pvp_lose']);

function GambleFlashPanel() {
  const [entries, setEntries] = useState<ActivityFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeActivityFeed(es => {
      setEntries(es.filter(e => GAMBLE_TYPES.has(e.type)));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div>
      <h3 style={{color:'#f0c060', marginBottom:4, fontSize:'0.95rem'}}>🎰 ギャンブル速報</h3>
      <p style={{fontSize:'0.72rem', color:'#4a5070', marginBottom:10}}>全ギャンブル結果リアルタイム</p>
      <div style={{display:'flex', flexDirection:'column', background:'#161b26', border:'1px solid #2d3752', borderRadius:10, overflow:'hidden', maxHeight:520, overflowY:'auto'}}>
        {loading && <div style={{color:'#8a92b2', textAlign:'center', padding:24, fontSize:'0.85rem'}}>読み込み中...</div>}
        {!loading && entries.length === 0 && <div style={{color:'#4a5070', textAlign:'center', padding:24, fontSize:'0.85rem'}}>まだ記録がありません</div>}
        {entries.map((e, i) => {
          const isSuperJP = e.type === 'super_jackpot';
          const isJP = e.type === 'jackpot';
          const isWin = e.type === 'gamble_win';
          const rowBg = isSuperJP ? 'rgba(255,215,0,0.1)' : isJP ? 'rgba(240,192,96,0.06)' : 'transparent';
          const msgColor = isSuperJP ? '#ffd700' : isJP ? '#f0c060' : isWin ? '#4caf87' : '#e05555';
          const now = Date.now();
          const diff = now - e.timestamp;
          const timeLabel = diff < 60_000 ? 'たった今'
            : diff < 3_600_000 ? `${Math.floor(diff/60_000)}分前`
            : `${Math.floor(diff/3_600_000)}時間前`;

          return (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
              borderBottom: i < entries.length-1 ? '1px solid #1c2235' : 'none',
              background: rowBg,
              boxShadow: isSuperJP ? 'inset 0 0 0 1px rgba(255,215,0,0.2)' : 'none',
            }}>
              <span style={{fontSize:'1rem', minWidth:20, textAlign:'center'}}>
                {isSuperJP ? '🌟' : isJP ? '💰' : isWin ? '🎲' : '🃏'}
              </span>
              <div style={{flex:1, minWidth:0}}>
                <span style={{fontSize:'0.8rem', color:'#c0bcd8', fontWeight:600}}>{e.displayName}</span>
                <span style={{fontSize:'0.82rem', color: msgColor, fontWeight:600}}>{e.message}</span>
              </div>
              <span style={{fontSize:'0.62rem', color:'#4a5070', whiteSpace:'nowrap'}}>{timeLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 活動タブ（4サブタブ）────────────────────────────────────
function ActivityTabPanel({ users }: { users: OnlineUser[] }) {
  const [actSubTab, setActSubTab] = useState<ActivitySubTab>('world_news');

  const ACT_TABS: { id: ActivitySubTab; label: string; emoji: string }[] = [
    { id: 'world_news',    label: 'ワールドニュース', emoji: '🌍' },
    { id: 'player_status', label: 'プレイヤー状況',   emoji: '👥' },
    { id: 'world_status',  label: 'ワールド状況',     emoji: '🌐' },
    { id: 'gamble_flash',  label: 'ギャンブル速報',   emoji: '🎰' },
    { id: 'natural_news',  label: 'ナチュラルニュース', emoji: '🌿' },
  ];

  return (
    <div>
      <div style={{display:'flex', gap:4, marginBottom:12, overflowX:'auto'}}>
        {ACT_TABS.map(t => (
          <button key={t.id} onClick={() => setActSubTab(t.id)}
            style={{flexShrink:0, padding:'5px 9px', fontSize:'0.72rem',
              background: actSubTab===t.id ? 'rgba(240,192,96,0.15)' : '#1c2235',
              border:`1px solid ${actSubTab===t.id ? '#f0c060' : '#2d3752'}`,
              color: actSubTab===t.id ? '#f0c060' : '#8a92b2',
              borderRadius:6, cursor:'pointer'}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      {actSubTab === 'world_news'    && <WorldNewsPanel />}
      {actSubTab === 'player_status' && <PlayerStatusPanel users={users} />}
      {actSubTab === 'world_status'  && <WorldStatusPanel users={users} />}
      {actSubTab === 'gamble_flash'  && <GambleFlashPanel />}
      {actSubTab === 'natural_news'  && <NaturalNewsPanel />}
    </div>
  );
}

// ============================================================
// 既存パネル（変更なし）
// ============================================================

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

const EMOJI_LIST = ['😀','😂','😍','🥺','😎','🤔','👍','❤️','🎉','🔥','💯','👀','😭','🙏','⚔️','🛡️','💰','🎲','🏆','😱'];
const REACTION_EMOJIS = ['👍','❤️','😂','😮','🎉','🔥'];

function BoardPanel() {
  const player = useGameStore(s => s.player);
  const addNotification = useGameStore(s => s.addNotification);
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [profileTarget, setProfileTarget] = useState<{uid:string} | null>(null);

  useEffect(() => {
    const unsub = subscribeBoardMessages(setMessages);
    return unsub;
  }, []);

  const post = async () => {
    if (!player || !text.trim() || posting) return;
    setPosting(true);
    try {
      const poll = showPollForm && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2
        ? { question: pollQuestion.trim(), options: pollOptions.filter(o => o.trim()) }
        : undefined;
      await postBoardMessage(player.uid, player.displayName, player.stats.level, text.trim(), poll);
      setText(''); setPollQuestion(''); setPollOptions(['', '']); setShowPollForm(false);
    } catch { addNotification('error', '投稿に失敗しました'); }
    setPosting(false);
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    if (!player) return;
    const msg = messages.find(m => m.id === msgId);
    const uids = msg?.reactions?.[emoji] ?? [];
    try {
      if (uids.includes(player.uid)) await removeBoardReaction(msgId, emoji, player.uid);
      else await addBoardReaction(msgId, emoji, player.uid);
    } catch { /* ignore */ }
  };

  const handleReply = async (msgId: string) => {
    if (!player || !replyText.trim()) return;
    try {
      await addBoardReply(msgId, { uid: player.uid, displayName: player.displayName, level: player.stats.level, text: replyText.trim(), createdAt: Date.now() });
      setReplyText(''); setReplyTarget(null);
    } catch { addNotification('error', '返信に失敗しました'); }
  };

  const handleVote = async (msgId: string, optIdx: number) => {
    if (!player) return;
    const msg = messages.find(m => m.id === msgId);
    const prev = msg?.poll?.votes ? Object.entries(msg.poll.votes).find(([uid]) => uid === player.uid)?.[1] as number | undefined : undefined;
    if (prev === optIdx) return;
    try { await voteBoardPoll(msgId, optIdx, player.uid, prev); } catch { /* ignore */ }
  };

  const toggleReplies = (id: string) => setExpandedReplies(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const msgStyle: CSSProperties = {background:'#1c2235', borderRadius:8, padding:'8px 10px', fontSize:'0.82rem', border:'1px solid #2d3752'};

  return (
    <div>
      <h3 style={{color:'#5b8dee', marginBottom:8, fontSize:'0.95rem'}}>💬 掲示板</h3>
      <div style={{maxHeight:420, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginBottom:10}}>
        {[...messages].reverse().map(m => {
          const isOwn = m.uid === player?.uid;
          const replies = m.replies ?? [];
          const showReplies = expandedReplies.has(m.id);
          return (
            <div key={m.id} style={msgStyle}>
              <div style={{display:'flex', gap:6, marginBottom:4, alignItems:'center'}}>
                <span style={{color:'#f0c060', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', textDecoration:'underline dotted'}} onClick={() => setProfileTarget({uid:m.uid})}>{m.displayName}</span>
                <span style={{color:'#4a5070', fontSize:'0.68rem'}}>Lv.{m.level}</span>
                <span style={{color:'#4a5070', fontSize:'0.68rem', marginLeft:'auto'}}>{new Date(m.createdAt).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</span>
                {isOwn && (
                  <button onClick={async () => { try { await deleteBoardMessage(m.id); } catch { addNotification('error', '削除に失敗しました'); } }}
                    style={{background:'none', border:'none', color:'#e05555', cursor:'pointer', fontSize:'0.75rem', padding:'0 2px'}}>🗑️</button>
                )}
              </div>
              <div style={{color:'#e8e6ff', marginBottom:6, wordBreak:'break-all'}}>{m.text}</div>
              {m.poll && (() => {
                const votes = m.poll.votes ?? {};
                const myVote = player ? votes[player.uid as keyof typeof votes] as number | undefined : undefined;
                const totals = m.poll.options.map((_: string, i: number) => Object.values(votes).filter((v: unknown) => v === i).length);
                const total = totals.reduce((a: number, b: number) => a + b, 0);
                return (
                  <div style={{background:'#161b26', borderRadius:6, padding:'8px 10px', marginBottom:6}}>
                    <div style={{fontSize:'0.78rem', color:'#f0c060', fontWeight:700, marginBottom:4}}>📊 {m.poll.question}</div>
                    {m.poll.options.map((opt: string, i: number) => {
                      const pct = total > 0 ? Math.round(totals[i] / total * 100) : 0;
                      const voted = myVote === i;
                      return (
                        <div key={i} onClick={() => handleVote(m.id, i)} style={{cursor:'pointer', marginBottom:4}}>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color: voted ? '#5b8dee' : '#8a92b2', marginBottom:2}}>
                            <span>{voted ? '✅ ' : ''}{opt}</span><span>{totals[i]}票 ({pct}%)</span>
                          </div>
                          <div style={{height:6, background:'#2d3752', borderRadius:3, overflow:'hidden'}}>
                            <div style={{height:'100%', background: voted ? '#5b8dee' : '#4a5070', width:`${pct}%`, transition:'width 0.3s'}} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{fontSize:'0.68rem', color:'#4a5070', marginTop:2}}>合計 {total}票</div>
                  </div>
                );
              })()}
              <div style={{display:'flex', gap:4, flexWrap:'wrap', marginBottom:4}}>
                {REACTION_EMOJIS.map(emoji => {
                  const uids = m.reactions?.[emoji] ?? [];
                  const reacted = player ? uids.includes(player.uid) : false;
                  return (
                    <button key={emoji} onClick={() => handleReaction(m.id, emoji)}
                      style={{padding:'2px 6px', background: reacted ? 'rgba(91,141,238,0.25)' : '#161b26', border:`1px solid ${reacted ? '#5b8dee' : '#2d3752'}`, borderRadius:12, cursor:'pointer', fontSize:'0.75rem', color:'#e8e6ff'}}>
                      {emoji}{uids.length > 0 ? ` ${uids.length}` : ''}
                    </button>
                  );
                })}
                <button onClick={() => setReplyTarget(replyTarget === m.id ? null : m.id)}
                  style={{padding:'2px 8px', background:'#161b26', border:'1px solid #2d3752', borderRadius:12, cursor:'pointer', fontSize:'0.72rem', color:'#8a92b2'}}>
                  💬 返信{replies.length > 0 ? ` (${replies.length})` : ''}
                </button>
                {replies.length > 0 && (
                  <button onClick={() => toggleReplies(m.id)}
                    style={{padding:'2px 8px', background:'#161b26', border:'1px solid #2d3752', borderRadius:12, cursor:'pointer', fontSize:'0.72rem', color:'#8a92b2'}}>
                    {showReplies ? '▲ 閉じる' : '▼ 展開'}
                  </button>
                )}
              </div>
              {showReplies && replies.length > 0 && (
                <div style={{borderLeft:'2px solid #2d3752', paddingLeft:8, marginBottom:4, display:'flex', flexDirection:'column', gap:4}}>
                  {replies.map((r, i) => (
                    <div key={i} style={{fontSize:'0.75rem'}}>
                      <span style={{color:'#f0c060', fontWeight:700}}>{r.displayName}</span>
                      <span style={{color:'#4a5070', marginLeft:4}}>Lv.{r.level}</span>
                      <span style={{color:'#4a5070', marginLeft:6, fontSize:'0.68rem'}}>{new Date(r.createdAt).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</span>
                      <div style={{color:'#c8c8e8', marginTop:1}}>{r.text}</div>
                    </div>
                  ))}
                </div>
              )}
              {replyTarget === m.id && (
                <div style={{display:'flex', gap:4, marginTop:4}}>
                  <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key==='Enter' && handleReply(m.id)}
                    placeholder="返信を入力..." maxLength={100}
                    style={{flex:1, padding:'5px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.78rem'}} />
                  <button onClick={() => handleReply(m.id)} disabled={!replyText.trim()}
                    style={{padding:'5px 10px', background: replyText.trim() ? '#5b8dee' : '#2d3752', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem'}}>送信</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {profileTarget && <ProfilePopup uid={profileTarget.uid} onClose={() => setProfileTarget(null)} />}
      <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'8px 10px'}}>
        {showEmojiPicker && (
          <div style={{display:'flex', flexWrap:'wrap', gap:4, marginBottom:8, background:'#161b26', borderRadius:6, padding:8}}>
            {EMOJI_LIST.map(e => (
              <button key={e} onClick={() => { setText(t => t + e); setShowEmojiPicker(false); }}
                style={{background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', padding:2}}>{e}</button>
            ))}
          </div>
        )}
        {showPollForm && (
          <div style={{marginBottom:8, background:'#161b26', borderRadius:6, padding:8}}>
            <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="投票の質問..." maxLength={60}
              style={{width:'100%', padding:'5px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.8rem', boxSizing:'border-box', marginBottom:4}} />
            {pollOptions.map((opt, i) => (
              <div key={i} style={{display:'flex', gap:4, marginBottom:4}}>
                <input value={opt} onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                  placeholder={`選択肢 ${i+1}`} maxLength={30}
                  style={{flex:1, padding:'4px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.78rem'}} />
                {pollOptions.length > 2 && <button onClick={() => setPollOptions(prev => prev.filter((_,j) => j !== i))}
                  style={{background:'none', border:'none', color:'#e05555', cursor:'pointer'}}>✕</button>}
              </div>
            ))}
            {pollOptions.length < 5 && (
              <button onClick={() => setPollOptions(prev => [...prev, ''])}
                style={{fontSize:'0.75rem', color:'#5b8dee', background:'none', border:'none', cursor:'pointer', padding:'2px 0'}}>＋ 選択肢を追加</button>
            )}
          </div>
        )}
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          <button onClick={() => setShowEmojiPicker(e => !e)}
            style={{padding:'6px 8px', background:'#161b26', border:'1px solid #2d3752', borderRadius:6, cursor:'pointer', fontSize:'1rem'}}>😀</button>
          <button onClick={() => setShowPollForm(e => !e)}
            style={{padding:'6px 8px', background: showPollForm ? 'rgba(91,141,238,0.2)' : '#161b26', border:`1px solid ${showPollForm ? '#5b8dee' : '#2d3752'}`, borderRadius:6, cursor:'pointer', fontSize:'0.78rem', color: showPollForm ? '#5b8dee' : '#8a92b2'}}>📊</button>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key==='Enter' && post()}
            placeholder="メッセージを入力..." maxLength={200}
            style={{flex:1, padding:'7px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem'}} />
          <button onClick={post} disabled={posting || !text.trim()}
            style={{padding:'7px 14px', background: posting || !text.trim() ? '#2d3752' : '#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700}}>
            送信
          </button>
        </div>
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
    .filter(([,qty]) => (qty as number) > 0)
    .map(([id, qty]) => ({ id, qty: qty as number, item: ITEM_MASTER[id] }))
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
    postActivityFeed({ uid: player.uid, displayName: player.displayName, type: 'auction', message: `が「${item.name}」×${sellAmount}を${sellPrice.toLocaleString()}G/個で出品しました` }).catch(() => {});
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
                  <button onClick={() => cancelAuction(l.id, player!.uid).then(result => {
                    if (result) {
                      addItems([{ itemId: result.itemId, amount: result.amount }]);
                      addNotification('info', '出品を取り消しました（アイテムを返却しました）');
                    } else {
                      addNotification('error', '取り消しに失敗しました');
                    }
                  })}
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

function ProposalPanel() {
  const player = useGameStore(s => s.player);
  const addNotification = useGameStore(s => s.addNotification);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!player || !title.trim() || !body.trim()) return;
    setSending(true);
    try {
      await submitProposal({ uid: player.uid, displayName: player.displayName, title: title.trim(), body: body.trim() });
      addNotification('success', '📨 提案を送信しました！承認されると提案チケットが付与されます。');
      setTitle(''); setBody('');
    } catch { addNotification('error', '送信に失敗しました'); }
    setSending(false);
  };

  return (
    <div>
      <h3 style={{color:'#5b8dee', marginBottom:6, fontSize:'0.95rem'}}>💡 運営への機能提案</h3>
      <p style={{color:'#8a92b2', fontSize:'0.78rem', marginBottom:12, lineHeight:1.6}}>
        ゲームへの要望・改善案を送信できます。承認された場合、<strong style={{color:'#f0c060'}}>提案チケット</strong>が付与されます。
      </p>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:'0.72rem', color:'#8a92b2', marginBottom:3}}>タイトル</div>
        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={50}
          placeholder="例：採掘スキルに新しい鉱石を追加してほしい"
          style={{width:'100%', padding:'7px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box'}} />
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:'0.72rem', color:'#8a92b2', marginBottom:3}}>詳細・理由</div>
        <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={500} rows={4}
          placeholder="提案の詳細を書いてください..."
          style={{width:'100%', padding:'7px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box', resize:'vertical'}} />
      </div>
      <button onClick={handleSubmit} disabled={sending || !title.trim() || !body.trim()}
        style={{width:'100%', padding:'9px', background: (!title.trim() || !body.trim()) ? '#2d3752' : 'linear-gradient(135deg,#5b8dee,#3d6fd0)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem'}}>
        {sending ? '送信中...' : '📨 提案を送信する'}
      </button>
    </div>
  );
}

// ============================================================
// 送金パネル
// ============================================================
function TransferPanel() {
  const player = useGameStore(s => s.player);
  const setPlayer = useGameStore(s => s.setPlayer);
  const saveGame = useGameStore(s => s.saveGame);
  const addNotification = useGameStore(s => s.addNotification);
  const [tab, setTab] = useState<'send' | 'history' | 'ranking'>('send');
  const [playerList, setPlayerList] = useState<{ uid: string; displayName: string; level: number }[]>([]);
  const [selectedUid, setSelectedUid] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<TransferRecord[]>([]);
  const [ranking, setRanking] = useState<{ uid: string; displayName: string; totalSent: number; totalReceived: number }[]>([]);
  const [rankMode, setRankMode] = useState<'sent' | 'received'>('sent');
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => { fetchOnlinePlayerList().then(setPlayerList); }, []);

  useEffect(() => {
    if (tab === 'history' && player) {
      setLoadingHistory(true);
      fetchMyTransfers(player.uid).then(h => { setHistory(h); setLoadingHistory(false); });
    }
    if (tab === 'ranking') {
      fetchTransferRanking().then(setRanking);
    }
  }, [tab, player]);

  if (!player) return null;
  const locked = player.stats.level < 10;

  if (locked) return (
    <div style={{textAlign:'center', padding:40, color:'#8a92b2'}}>
      <div style={{fontSize:'2rem', marginBottom:8}}>🔒</div>
      <div>レベル10以上で解放されます</div>
      <div style={{fontSize:'0.78rem', marginTop:4, color:'#4a5070'}}>現在 Lv.{player.stats.level}</div>
    </div>
  );

  const fee = Math.floor((parseInt(amount) || 0) * 0.05);
  const received = (parseInt(amount) || 0) - fee;
  const others = playerList.filter(p => p.uid !== player.uid);

  return (
    <div>
      <div style={{display:'flex', gap:6, marginBottom:12}}>
        {(['send','history','ranking'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{padding:'6px 12px', fontSize:'0.78rem', background: tab===t ? 'rgba(240,192,96,0.15)' : '#1c2235', border:`1px solid ${tab===t ? '#f0c060' : '#2d3752'}`, color: tab===t ? '#f0c060' : '#8a92b2', borderRadius:6, cursor:'pointer'}}>
            {t === 'send' ? '💸 送金' : t === 'history' ? '📜 履歴' : '🏆 ランキング'}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <div style={{background:'rgba(240,192,96,0.07)', border:'1px solid #2d3752', borderRadius:8, padding:12, fontSize:'0.8rem', color:'#8a92b2'}}>
            💡 手数料5%が差し引かれます（差額はゲームから消滅）
          </div>
          <div>
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:4}}>送金先プレイヤー</div>
            <select value={selectedUid} onChange={e => setSelectedUid(e.target.value)}
              style={{width:'100%', padding:'8px', background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, color:'#e8e6ff', fontSize:'0.85rem'}}>
              <option value=''>選択してください</option>
              {others.map(p => <option key={p.uid} value={p.uid}>{p.displayName} (Lv.{p.level})</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:4}}>金額 (所持: {player.gold.toLocaleString()}G)</div>
            <input type='number' value={amount} onChange={e => setAmount(e.target.value)}
              style={{width:'100%', padding:'8px', background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, color:'#e8e6ff', fontSize:'0.85rem', boxSizing:'border-box'}}
              placeholder='0' min={1} max={player.gold} />
          </div>
          {parseInt(amount) > 0 && (
            <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, padding:10, fontSize:'0.8rem'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#8a92b2'}}>送金額</span><span>{parseInt(amount).toLocaleString()}G</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#8a92b2'}}>手数料(5%)</span><span style={{color:'#e05555'}}>-{fee.toLocaleString()}G</span></div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:4, paddingTop:4, borderTop:'1px solid #2d3752'}}><span style={{color:'#f0c060', fontWeight:700}}>相手受取額</span><span style={{color:'#f0c060', fontWeight:700}}>{received.toLocaleString()}G</span></div>
            </div>
          )}
          <button onClick={async () => {
            if (!selectedUid || !parseInt(amount)) { addNotification('error', '送金先と金額を入力してください'); return; }
            setSending(true);
            const result = await sendGold({ uid: player.uid, displayName: player.displayName, gold: player.gold }, selectedUid, parseInt(amount));
            if (result.success) {
              setPlayer({ ...player, gold: player.gold - parseInt(amount) });
              await saveGame();
              addNotification('success', `${received.toLocaleString()}Gを送金しました`);
              setAmount('');
              setSelectedUid('');
            } else {
              addNotification('error', result.error ?? '送金失敗');
            }
            setSending(false);
          }} disabled={sending || !selectedUid || !parseInt(amount)}
            style={{padding:'10px', background:'#f0c060', color:'#0d1117', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.9rem', opacity: (sending || !selectedUid || !parseInt(amount)) ? 0.5 : 1}}>
            {sending ? '送金中...' : '💸 送金する'}
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {loadingHistory ? <div style={{color:'#8a92b2', textAlign:'center', padding:24}}>読み込み中...</div>
          : history.length === 0 ? <div style={{color:'#4a5070', textAlign:'center', padding:24}}>履歴がありません</div>
          : history.map(h => {
            const isSent = h.senderUid === player.uid;
            return (
              <div key={h.id} style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, padding:'10px 12px', marginBottom:6}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontSize:'0.85rem', fontWeight:700, color: isSent ? '#e05555' : '#4caf87'}}>
                    {isSent ? `↑ ${h.receiverName}へ送金` : `↓ ${h.senderName}から受取`}
                  </span>
                  <span style={{fontWeight:700, color: isSent ? '#e05555' : '#4caf87', fontSize:'0.9rem'}}>
                    {isSent ? `-${h.amount.toLocaleString()}G` : `+${h.received.toLocaleString()}G`}
                  </span>
                </div>
                {isSent && <div style={{fontSize:'0.72rem', color:'#4a5070', marginTop:2}}>手数料: {h.fee.toLocaleString()}G消滅</div>}
                <div style={{fontSize:'0.7rem', color:'#4a5070', marginTop:2}}>{new Date(h.createdAt).toLocaleString('ja-JP')}</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'ranking' && (
        <div>
          <div style={{display:'flex', gap:6, marginBottom:10}}>
            {(['sent','received'] as const).map(m => (
              <button key={m} onClick={() => setRankMode(m)}
                style={{padding:'5px 10px', fontSize:'0.78rem', background: rankMode===m ? 'rgba(240,192,96,0.15)' : '#1c2235', border:`1px solid ${rankMode===m ? '#f0c060' : '#2d3752'}`, color: rankMode===m ? '#f0c060' : '#8a92b2', borderRadius:6, cursor:'pointer'}}>
                {m === 'sent' ? '💸 総送金額' : '💰 総受取額'}
              </button>
            ))}
          </div>
          {[...ranking].sort((a,b) => rankMode === 'sent' ? b.totalSent - a.totalSent : b.totalReceived - a.totalReceived).slice(0,20).map((r, i) => (
            <div key={r.uid} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, marginBottom:4}}>
              <span style={{fontSize:'1.1rem', width:24, textAlign:'center'}}>{['🥇','🥈','🥉'][i] ?? `${i+1}.`}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:'0.85rem', fontWeight:700}}>{r.displayName}</div>
              </div>
              <span style={{color:'#f0c060', fontSize:'0.85rem', fontWeight:700}}>
                {rankMode === 'sent' ? `${r.totalSent.toLocaleString()}G送金` : `${r.totalReceived.toLocaleString()}G受取`}
              </span>
            </div>
          ))}
          {ranking.length === 0 && <div style={{color:'#4a5070', textAlign:'center', padding:24}}>データなし</div>}
        </div>
      )}
    </div>
  );
}
// ログインボーナスモーダル (OnlineScreenに統合)
// ============================================================
export function LoginBonusButton() {
  const player = useGameStore(s => s.player);
  const setPlayer = useGameStore(s => s.setPlayer);
  const saveGame = useGameStore(s => s.saveGame);
  const addNotification = useGameStore(s => s.addNotification);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoginBonusState | null>(null);
  const [claiming, setClaiming] = useState(false);

  const LOGIN_TITLE_MILESTONES = [
    { count: 1,  id: 'login_regular' },
    { count: 7,  id: 'login_adventurer' },
    { count: 14, id: 'login_challenger' },
    { count: 21, id: 'login_resilient' },
    { count: 30, id: 'login_master' },
  ];

  const load = async () => {
    if (!player) return;
    const s = await fetchLoginBonus(player.uid);
    setState(s);
  };

  useEffect(() => { if (open) load(); }, [open, player]);

  const handleClaim = async (day: number) => {
    if (!player || claiming) return;
    setClaiming(true);
    const result = await claimLoginBonus(player.uid, day);
    if (result.success) {
      const updates: Partial<typeof player> = {};
      if (result.gold > 0) updates.gold = player.gold + result.gold;
      // ログインボーナス称号チェック
      const totalClaimed = (state?.claimed.length ?? 0) + 1;
      const newAch = [...(player.unlockedAchievements ?? [])];
      LOGIN_TITLE_MILESTONES.forEach(m => {
        if (totalClaimed >= m.count && !newAch.includes(m.id)) newAch.push(m.id);
      });
      updates.unlockedAchievements = newAch;
      setPlayer({ ...player, ...updates });
      await saveGame();
      const label = result.special === 'treasure_box' ? '宝箱' : `${result.gold.toLocaleString()}G`;
      addNotification('success', `${day}日目ボーナス受取: ${label}！`);
      await load();
    } else {
      addNotification('error', result.error ?? 'エラー');
    }
    setClaiming(false);
  };

  if (!player) return null;
  const DAY_LABELS = ['','1000G','3000G','5000G','10000G','30000G','50000G','🎁宝箱'];

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{padding:'8px 14px', background:'rgba(240,192,96,0.15)', border:'1px solid #f0c060', borderRadius:8, color:'#f0c060', cursor:'pointer', fontSize:'0.85rem', fontWeight:700}}>
        🎁 ログインボーナス
      </button>
      {open && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setOpen(false)}>
          <div style={{background:'#161a2e', border:'1px solid #2d3752', borderRadius:12, padding:20, width:'min(400px,92vw)', maxHeight:'80vh', overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#f0c060', marginBottom:4}}>🎁 ログインボーナス</h3>
            <p style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:16}}>毎週リセット。順番に受け取ってください。</p>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:16}}>
              {LOGIN_BONUS_REWARDS.map(r => {
                const claimed = state?.claimed.includes(r.day) ?? false;
                const canClaim = !claimed && (r.day === 1 || (state?.claimed.includes(r.day - 1) ?? false));
                return (
                  <div key={r.day} style={{background: claimed ? 'rgba(76,175,87,0.1)' : canClaim ? 'rgba(240,192,96,0.1)' : '#1c2235', border:`1px solid ${claimed ? '#4caf57' : canClaim ? '#f0c060' : '#2d3752'}`, borderRadius:8, padding:12, textAlign:'center'}}>
                    <div style={{fontSize:'0.7rem', color:'#8a92b2', marginBottom:4}}>{r.day}日目</div>
                    <div style={{fontSize:'1.2rem', marginBottom:6}}>{r.special === 'treasure_box' ? '🎁' : '💰'}</div>
                    <div style={{fontSize:'0.8rem', fontWeight:700, color: claimed ? '#4caf87' : '#f0c060', marginBottom:6}}>{DAY_LABELS[r.day]}</div>
                    {claimed
                      ? <div style={{fontSize:'0.72rem', color:'#4caf87'}}>✅ 受取済み</div>
                      : canClaim
                        ? <button onClick={() => handleClaim(r.day)} disabled={claiming}
                            style={{padding:'5px 12px', background:'#f0c060', color:'#0d1117', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.78rem'}}>
                            受け取る
                          </button>
                        : <div style={{fontSize:'0.72rem', color:'#4a5070'}}>🔒 未解放</div>
                    }
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:4}}>
              今週: {state?.claimed.length ?? 0}/7日受取済み
            </div>
            <button onClick={() => setOpen(false)} style={{width:'100%', padding:'8px', background:'#2d3752', border:'none', borderRadius:8, color:'#e8e6ff', cursor:'pointer'}}>閉じる</button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// メイン OnlineScreen
// ============================================================
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
    { id:'transfer' as SubTab, label:'送金',       icon:'coin' },
    { id:'proposal' as SubTab, label:'提案',       icon:'ballot_box' },
    { id:'guild'    as SubTab, label:'ギルド',     icon:'castle' },
    { id:'friend'   as SubTab, label:'フレンド',   icon:'heart' },
  ];

  return (
    <div style={{padding:'12px 8px'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>
        <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', margin:0}}>🌐 オンライン</h2>
        <LoginBonusButton />
      </div>
      <div style={{display:'flex', gap:4, marginBottom:12, overflowX:'auto'}}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            style={{flexShrink:0, padding:'6px 10px', fontSize:'0.75rem', background: subTab===t.id ? 'rgba(91,141,238,0.2)' : '#1c2235', border:`1px solid ${subTab===t.id ? '#5b8dee' : '#2d3752'}`, color: subTab===t.id ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer'}}>
            <GameIcon id={t.icon} size={15} style={{marginRight:3}} /> {t.label}
          </button>
        ))}
      </div>
      {subTab === 'online'   && <OnlinePanel users={users} />}
      {subTab === 'activity' && <ActivityTabPanel users={users} />}
      {subTab === 'board'    && <BoardPanel />}
      {subTab === 'auction'  && <AuctionPanel />}
      {subTab === 'ranking'  && <RankingPanel />}
      {subTab === 'transfer' && <TransferPanel />}
      {subTab === 'proposal' && <ProposalPanel />}
      {subTab === 'guild'    && <GuildScreen />}
      {subTab === 'friend'   && <FriendScreen />}
    </div>
  );
}

