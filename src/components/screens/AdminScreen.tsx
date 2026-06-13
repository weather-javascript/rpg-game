// src/components/screens/AdminScreen.tsx
import React from 'react';
import { GameIcon } from '../icons';
import { useState, useEffect } from 'react';
import {
  getAllPlayersAdmin, subscribeAllPlayersAdmin,
  updatePlayerAdmin, getGambleMultipliers, setGambleMultipliers,
  setMaintenanceStatus, getMaintenanceStatus,
  setJackpotRate, getJackpotRate, getJackpotPool,
  saveAnnouncementToHistory, getAnnouncementHistory, deleteAnnouncementRecord, updateAnnouncementRecord,
  getItemPrices, setItemPrices,
  subscribeProposals, updateProposalStatus, Proposal,
  getTreasureProbs, setTreasureProbs,
  getTradeRecipes, setTradeRecipes as saveTradeRecipes,
  getMonsterOverrides, setMonsterOverrides,
  getDungeonOverrides, setDungeonOverrides,
  getFishingCastTime, setFishingCastTime,
  getTabMaintenance, setTabMaintenanceEntry,
} from '../../services/multiplayer';
import type { TreasureProbEntry, TradeRecipe, MonsterOverride, DungeonOverride, TabMaintenanceConfig, MaintainableTab } from '../../services/multiplayer';
import { GAMBLE_MASTER, DUNGEON_MASTER, ITEM_MASTER, MONSTER_MASTER, CRAFT_RECIPES } from '../../data/masters';
import { ROD_MASTER, ROD_IDS, BAIT_MASTER, BAIT_IDS, SPOT_MASTER, SPOT_IDS, FISHING_TITLES, FISHING_ACHIEVEMENTS } from '../../data/fishMasters';
import type { CraftRecipe } from '../../types/game';
import { useGameStore } from '../../stores/gameStore';
import { PlayerEditor } from '../admin/PlayerEditor';
import { AdminCommands } from '../admin/AdminCommands';
import { AdminLogs } from '../admin/AdminLogs';
import { PlayerHistory } from '../admin/PlayerHistory';
import { MasterEditor } from '../admin/MasterEditor';
import { EventManager } from '../admin/EventManager';
import { AnalyticsPanel } from '../admin/AnalyticsPanel';
import { filterPlayersAdmin } from '../../services/multiplayer';

type SubTab = 'players' | 'gamble' | 'items' | 'announce' | 'stats' | 'system' | 'recipes' | 'proposals' | 'trade' | 'dungeon' | 'console' | 'fishing_admin' | 'currency_admin';

export function AdminScreen() {
  const player = useGameStore(s => s.player);
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const addNotification = useGameStore(s => s.addNotification);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [editGold, setEditGold] = useState('');
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editHp, setEditHp] = useState('');
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  const [subTab, setSubTab] = useState<SubTab>('players');
  const [saving, setSaving] = useState(false);
  const [announceText, setAnnounceText] = useState('');
  const [announceImageUrl, setAnnounceImageUrl] = useState('');
  const [playerFilter, setPlayerFilter] = useState('');
  const [confirmBan, setConfirmBan] = useState<string | null>(null);
  const [jackpotRate, setJackpotRateState] = useState(0.20);
  const [jackpotPool, setJackpotPool] = useState(0);
  const [editJackpotPool, setEditJackpotPool] = useState('');
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceMinutes, setMaintenanceMinutes] = useState(30);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [announceHistory, setAnnounceHistory] = useState<Array<{ id: string; text: string; timestamp: number; imageUrl?: string }>>([]);
  const [editingAnnounceId, setEditingAnnounceId] = useState<string | null>(null);
  const [editingAnnounceText, setEditingAnnounceText] = useState('');
  const [editingAnnounceImageUrl, setEditingAnnounceImageUrl] = useState('');
  const [itemPrices, setItemPricesState] = useState<Record<string, { buyPrice: number; sellPrice: number }>>({});
  const [itemFilter, setItemFilter] = useState('');
  // インベントリ編集
  const [invEditItem, setInvEditItem] = useState('');
  const [invEditAmount, setInvEditAmount] = useState('1');
  const [invFilter, setInvFilter] = useState('');
  // クラフトレシピ管理
  const [customRecipes, setCustomRecipes] = useState<CraftRecipe[]>([]);
  const [deletedDefaultRecipeIds, setDeletedDefaultRecipeIds] = useState<string[]>([]);
  const [newRecipe, setNewRecipe] = useState<Partial<CraftRecipe>>({ inputs: [], outputAmount: 1, requiredCraftingLevel: 1, craftingExpGain: 10 });
  const [newShape, setNewShape] = useState<string[]>(Array(9).fill(''));
  const [selectedShapeItem, setSelectedShapeItem] = useState('');
  // 提案管理
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalProcessing, setProposalProcessing] = useState<string | null>(null);
  // 宝箱確率管理
  const [treasureProbs, setTreasureProbsState] = useState<TreasureProbEntry[]>([]);
  // 取引レシピ管理
  const [tradeRecipes, setTradeRecipesState] = useState<TradeRecipe[]>([]);
  const [editingTradeRecipe, setEditingTradeRecipe] = useState<TradeRecipe | null>(null);
  const [tradeRecipeSaving, setTradeRecipeSaving] = useState(false);
  // ダンジョン・モンスター管理
  const [monsterOverrides, setMonsterOverridesState] = useState<Record<string, MonsterOverride>>({});
  const [dungeonOverrides, setDungeonOverridesState] = useState<Record<string, DungeonOverride>>({});
  const [dungeonAdminTab, setDungeonAdminTab] = useState<'monsters' | 'areas'>('monsters');
  const [selectedDungeonId, setSelectedDungeonId] = useState<string>('');
  const [selectedMonsterId, setSelectedMonsterId] = useState<string>('');
  const [dungeonSaving, setDungeonSaving] = useState(false);
  // 釣りキャスト時間
  const [fishingCastTimeMs, setFishingCastTimeMsState] = useState<string>('');
  // タブ別メンテナンス
  const [tabMaintConfig, setTabMaintConfig] = useState<TabMaintenanceConfig>({});
  const [tabMaintMessages, setTabMaintMessages] = useState<Partial<Record<MaintainableTab, string>>>({});
  const [tabMaintEstimates, setTabMaintEstimates] = useState<Partial<Record<MaintainableTab, string>>>({});
  // 釣りデータ管理
  const [fishingAdminFilter, setFishingAdminFilter] = useState('');
  const [fishingAdminPlayer, setFishingAdminPlayer] = useState<any | null>(null);
  const [faFishCoin, setFaFishCoin] = useState('');
  const [faFishingLevel, setFaFishingLevel] = useState('');
  const [faFishingExp, setFaFishingExp] = useState('');
  const [faEquippedRodId, setFaEquippedRodId] = useState('');
  const [faEquippedBaitId, setFaEquippedBaitId] = useState('');
  const [faUnlockedSpots, setFaUnlockedSpots] = useState<string[]>([]);
  const [faRodEnhance, setFaRodEnhance] = useState<Record<string, string>>({});
  const [faFishingAchievements, setFaFishingAchievements] = useState<string[]>([]);
  const [faFishingTitles, setFaFishingTitles] = useState<string[]>([]);
  const [faFishBookCount, setFaFishBookCount] = useState(0);
  const [faSaving, setFaSaving] = useState(false);
  const [faResetAllConfirm, setFaResetAllConfirm] = useState(false);
  const [faResetAllRunning, setFaResetAllRunning] = useState(false);
  // 通貨編集
  const [currencyAdminFilter, setCurrencyAdminFilter] = useState('');
  const [currencyAdminPlayer, setCurrencyAdminPlayer] = useState<any | null>(null);
  const [caGold, setCaGold] = useState('');
  const [caFishCoin, setCaFishCoin] = useState('');
  const [caFishMoney, setCaFishMoney] = useState('');
  const [caWealthCoin, setCaWealthCoin] = useState('');
  const [caSaving, setCaSaving] = useState(false);
  // 運営コンソール
  const [consoleSection, setConsoleSection] = useState<'editor' | 'commands' | 'history' | 'logs' | 'master' | 'event' | 'analytics'>('editor');
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchMinLevel, setSearchMinLevel] = useState('');
  const [searchMaxLevel, setSearchMaxLevel] = useState('');
  const [searchMinGold, setSearchMinGold] = useState('');
  const [searchMaxGold, setSearchMaxGold] = useState('');
  const [consoleSelectedId, setConsoleSelectedId] = useState<string | null>(null);

  // リアルタイム購読でプレイヤー一覧を取得
  useEffect(() => {
    const unsub = subscribeProposals(setProposals);
    return unsub;
  }, []);
  useEffect(() => {
    setLoading(true);
    setError(null);

    // まずgetAllPlayersAdminで初回取得を試みる
    getAllPlayersAdmin()
      .then(ps => {
        setPlayers(ps);
        setLoading(false);
      })
      .catch(err => {
        // permission-deniedの場合は明示的なメッセージを表示
        if (err?.code === 'permission-denied') {
          setError('Firestoreのセキュリティルールで管理者の読み取りが拒否されました。\nfirestore.rules に管理者UIDの読み取り権限を追加してください。');
        } else {
          setError(`データ取得に失敗しました: ${err?.message ?? err}`);
        }
        setLoading(false);
      });

    // ギャンブル倍率取得
    getGambleMultipliers().then(m => setMultipliers(m)).catch(() => {});
    getJackpotRate().then(r => setJackpotRateState(r)).catch(() => {});
    getJackpotPool().then(p => setJackpotPool(p)).catch(() => {});
    getMaintenanceStatus().then(s => { if (s) setMaintenanceActive(s.active); }).catch(() => {});
    getAnnouncementHistory().then(h => setAnnounceHistory(h)).catch(() => {});
    getItemPrices().then(p => {
      // マスターデータをベースに上書き分をマージ
      const base: Record<string, { buyPrice: number; sellPrice: number }> = {};
      Object.values(ITEM_MASTER).forEach(item => {
        base[item.id] = { buyPrice: item.buyPrice, sellPrice: item.sellPrice };
      });
      setItemPricesState({ ...base, ...p });
    }).catch(() => {});

    // 宝箱確率読み込み
    getTreasureProbs().then(probs => {
      const master = GAMBLE_MASTER['treasure_box'].rewardTable;
      if (probs) {
        setTreasureProbsState(master.map((r, i) => ({ label: r.label, probability: probs[i]?.probability ?? r.probability })));
      } else {
        setTreasureProbsState(master.map(r => ({ label: r.label, probability: r.probability })));
      }
    }).catch(() => {});
    getTradeRecipes().then(r => { if (r) setTradeRecipesState(r); }).catch(() => {});
    getMonsterOverrides().then(o => { if (o) setMonsterOverridesState(o); }).catch(() => {});
    getDungeonOverrides().then(o => { if (o) setDungeonOverridesState(o); }).catch(() => {});
    getFishingCastTime().then(v => { setFishingCastTimeMsState(v !== null ? String(v) : ''); }).catch(() => {});
    getTabMaintenance().then(cfg => {
      setTabMaintConfig(cfg);
      const msgs: Partial<Record<MaintainableTab, string>> = {};
      const ests: Partial<Record<MaintainableTab, string>> = {};
      (Object.keys(cfg) as MaintainableTab[]).forEach(t => {
        msgs[t] = cfg[t]?.message ?? '';
        ests[t] = cfg[t]?.estimatedMinutes ? String(cfg[t]!.estimatedMinutes) : '';
      });
      setTabMaintMessages(msgs);
      setTabMaintEstimates(ests);
    }).catch(() => {});

    // カスタムクラフトレシピ取得
    import('firebase/firestore').then(({ doc, getDoc }) =>
      import('../../services/firebase').then(({ db }) =>
        getDoc(doc(db, 'admin', 'craft_recipes')).then(snap => {
          if (snap.exists()) {
            const data = snap.data();
            setCustomRecipes(Array.isArray(data.recipes) ? data.recipes : []);
            setDeletedDefaultRecipeIds(Array.isArray(data.deletedDefaults) ? data.deletedDefaults : []);
          }
        }).catch(() => {})
      )
    );

    // onSnapshotでリアルタイム更新も試みる
    const unsub = subscribeAllPlayersAdmin(ps => {
      setPlayers(ps);
      setLoading(false);
      setError(null);
    });
    return unsub;
  }, []);

  const handleSelectPlayer = (p: any) => {
    setSelectedPlayer(p);
    setEditGold(String(p.gold ?? 0));
    setEditName(p.displayName ?? '');
    setEditLevel(String(p.stats?.level ?? 1));
    setEditHp(String(p.stats?.hp ?? p.stats?.maxHp ?? 100));
  };

  const handleSavePlayer = async () => {
    if (!selectedPlayer) return;
    setSaving(true);
    try {
      const updates: any = {
        gold: Number(editGold),
        displayName: editName,
        stats: { ...(selectedPlayer.stats ?? {}), level: Number(editLevel), hp: Number(editHp) },
      };
      await updatePlayerAdmin(selectedPlayer.id, updates);
      setPlayers(prev => prev.map(p => p.id === selectedPlayer.id
        ? { ...p, gold: Number(editGold), displayName: editName, stats: { ...p.stats, level: Number(editLevel), hp: Number(editHp) } }
        : p));
      // 自分自身を編集した場合はローカルstoreも強制更新
      if (player && player.uid === selectedPlayer.id) {
        useGameStore.setState(s => ({
          player: s.player ? {
            ...s.player,
            gold: Number(editGold),
            displayName: editName,
            stats: { ...s.player.stats, level: Number(editLevel), hp: Number(editHp) },
          } : s.player
        }));
      }
      addNotification('success', `${editName} のデータを強制更新しました`);
    } catch (e: any) {
      addNotification('error', `更新に失敗: ${e?.message ?? e}`);
    }
    setSaving(false);
  };

  const handleBanPlayer = async (uid: string, name: string) => {
    if (confirmBan !== uid) {
      setConfirmBan(uid);
      return;
    }
    setSaving(true);
    try {
      await updatePlayerAdmin(uid, { banned: true, gold: 0 });
      setPlayers(prev => prev.map(p => p.id === uid ? { ...p, banned: true, gold: 0 } : p));
      addNotification('success', `${name} をBANしました`);
      setConfirmBan(null);
      if (selectedPlayer?.id === uid) setSelectedPlayer(null);
    } catch (e: any) {
      addNotification('error', `BAN失敗: ${e?.message ?? e}`);
    }
    setSaving(false);
  };

  const handleUnbanPlayer = async (uid: string, name: string) => {
    setSaving(true);
    try {
      await updatePlayerAdmin(uid, { banned: false });
      setPlayers(prev => prev.map(p => p.id === uid ? { ...p, banned: false } : p));
      addNotification('success', `${name} のBANを解除しました`);
    } catch (e: any) {
      addNotification('error', `BAN解除失敗: ${e?.message ?? e}`);
    }
    setSaving(false);
  };

  const handleSaveMultipliers = async () => {
    setSaving(true);
    try {
      await setGambleMultipliers(multipliers);
      addNotification('success', 'ギャンブル倍率を更新しました（全プレイヤーに反映）');
    } catch { addNotification('error', '更新に失敗しました'); }
    setSaving(false);
  };

  const handleResetGold = async (uid: string, name: string, amount: number) => {
    setSaving(true);
    try {
      await updatePlayerAdmin(uid, { gold: amount });
      setPlayers(prev => prev.map(p => p.id === uid ? { ...p, gold: amount } : p));
      addNotification('success', `${name} の所持金を ${amount.toLocaleString()}G にリセットしました`);
    } catch (e: any) {
      addNotification('error', `失敗: ${e?.message}`);
    }
    setSaving(false);
  };

  // 統計計算
  const stats = {
    total: players.length,
    banned: players.filter(p => p.banned).length,
    active: players.filter(p => (Date.now() - (p.lastSeen ?? 0)) < 24 * 60 * 60 * 1000).length,
    totalGold: players.reduce((s, p) => s + (p.gold ?? 0), 0),
    avgLevel: players.length > 0 ? Math.round(players.reduce((s,p)=>s+(p.stats?.level??1),0)/players.length) : 0,
    maxLevel: players.length > 0 ? Math.max(...players.map(p => p.stats?.level ?? 1)) : 0,
  };

  const filteredPlayers = players.filter(p =>
    !playerFilter || (p.displayName ?? '').includes(playerFilter) || p.id.includes(playerFilter)
  );

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '5px 8px', background: '#161b26', border: '1px solid #2d3752',
    color: '#e8e6ff', borderRadius: 4, fontSize: '0.78rem', boxSizing: 'border-box',
  };

  const SUB_TABS: { id: SubTab; label: string; icon: string }[] = [
    { id: 'players',   label: 'プレイヤー', icon: '👥' },
    { id: 'console',   label: '運営コンソール', icon: '🛠️' },
    { id: 'gamble',    label: 'ギャンブル', icon: '🎰' },
    { id: 'items',     label: 'アイテム',   icon: '🎒' },
    { id: 'recipes',   label: 'レシピ',     icon: '📖' },
    { id: 'trade',     label: '取引',       icon: '🔄' },
    { id: 'dungeon',   label: 'ダンジョン', icon: '⚔️' },
    { id: 'proposals', label: '提案',       icon: '💡' },
    { id: 'announce',  label: 'お知らせ',   icon: '📢' },
    { id: 'fishing_admin', label: '釣りデータ', icon: '🎣' },
    { id: 'currency_admin', label: '通貨編集', icon: '💰' },
    { id: 'system',    label: 'システム',   icon: '⚙️' },
    { id: 'stats',     label: '統計',       icon: '📊' },
  ];

  return (
    <div style={{padding:'12px 8px 80px'}}>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, borderBottom:'1px solid #e05555', paddingBottom:8}}>
        <h2 style={{fontFamily:'Cinzel,serif', color:'#e05555', margin:0, flex:1}}>🔐 管理者パネル</h2>
        <button onClick={() => setActiveTab('status')} style={{padding:'4px 10px', background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.8rem'}}>← 戻る</button>
      </div>

      {/* サブタブ */}
      <div style={{display:'flex', gap:4, marginBottom:12, overflowX:'auto', flexWrap:'wrap'}}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            style={{flexShrink:0, padding:'6px 10px', background: subTab===t.id ? 'rgba(224,85,85,0.2)' : '#1c2235', border:`1px solid ${subTab===t.id ? '#e05555' : '#2d3752'}`, color: subTab===t.id ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer', fontSize:'0.78rem'}}>
            <GameIcon id={t.icon} size={15} style={{marginRight:3}} /> {t.label}
          </button>
        ))}
      </div>

      {/* ===== プレイヤー管理 ===== */}
      {subTab === 'players' && (
        <div>
          {error && (
            <div style={{background:'rgba(224,85,85,0.15)', border:'1px solid #e05555', borderRadius:8, padding:'10px 12px', marginBottom:12, fontSize:'0.78rem', color:'#e05555', whiteSpace:'pre-wrap'}}>
              ⚠️ {error}
            </div>
          )}
          <input
            value={playerFilter} onChange={e => setPlayerFilter(e.target.value)}
            placeholder="名前・UIDで検索..."
            style={{width:'100%', padding:'7px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box', marginBottom:8}}
          />
          {loading
            ? <div style={{textAlign:'center', color:'#8a92b2', padding:20}}>読み込み中...</div>
            : (
              <div style={{display:'flex', flexDirection:'column', gap:4, marginBottom:16}}>
                {filteredPlayers.length === 0 && (
                  <div style={{color:'#4a5070', textAlign:'center', padding:16, fontSize:'0.85rem'}}>
                    {players.length === 0 ? 'プレイヤーデータなし（Firestoreルール要確認）' : '該当なし'}
                  </div>
                )}
                {filteredPlayers.map(p => (
                  <button key={p.id} onClick={() => handleSelectPlayer(p)}
                    style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background: selectedPlayer?.id === p.id ? 'rgba(91,141,238,0.2)' : p.banned ? 'rgba(224,85,85,0.08)' : '#1c2235', border:`1px solid ${selectedPlayer?.id === p.id ? '#5b8dee' : p.banned ? '#e05555' : '#2d3752'}`, borderRadius:6, cursor:'pointer', color: p.banned ? '#e05555' : '#e8e6ff', fontSize:'0.82rem', textAlign:'left'}}>
                    <span>{p.banned ? '🚫' : '⚔️'} {p.displayName ?? '名無し'} (Lv.{p.stats?.level ?? 1})</span>
                    <span style={{color:'#f0c060', flexShrink:0}}>💰 {(p.gold ?? 0).toLocaleString()}G</span>
                  </button>
                ))}
              </div>
            )}

          {selectedPlayer && (
            <div style={{background:'#1c2235', border:'2px solid #5b8dee', borderRadius:10, padding:14}}>
              <h3 style={{color:'#5b8dee', marginBottom:12, fontSize:'0.95rem'}}>✏️ {selectedPlayer.displayName} を編集</h3>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10}}>
                {[
                  { label:'表示名', value:editName, setter:setEditName, type:'text' },
                  { label:'所持金 (G)', value:editGold, setter:setEditGold, type:'number' },
                  { label:'レベル', value:editLevel, setter:setEditLevel, type:'number' },
                  { label:'HP', value:editHp, setter:setEditHp, type:'number' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{fontSize:'0.72rem', color:'#8a92b2', marginBottom:3}}>{f.label}</div>
                    <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)}
                      style={{width:'100%', padding:'6px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box'}} />
                  </div>
                ))}
              </div>
              <div style={{marginBottom:10, fontSize:'0.75rem', color:'#8a92b2'}}>
                <div>UID: {selectedPlayer.id.slice(0,12)}... | 所持アイテム: {Object.keys(selectedPlayer.inventory ?? {}).length}種</div>
                {selectedPlayer.dungeonClearedCount && (
                  <div>ダンジョン累計: {Object.values(selectedPlayer.dungeonClearedCount as Record<string,number>).reduce((s,v)=>s+v,0)}回クリア</div>
                )}
              </div>
              <div style={{display:'flex', gap:6}}>
                <button onClick={handleSavePlayer} disabled={saving}
                  style={{flex:1, padding:'8px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem'}}>
                  {saving ? '保存中...' : '💾 保存'}
                </button>
                <button onClick={() => handleResetGold(selectedPlayer.id, selectedPlayer.displayName, 1000)} disabled={saving}
                  style={{padding:'8px 10px', background:'rgba(240,168,48,0.2)', color:'#f0a830', border:'1px solid #f0a830', borderRadius:6, cursor:'pointer', fontSize:'0.78rem'}}>
                  🔄 1000Gリセット
                </button>
              </div>
              <button
                onClick={() => selectedPlayer.banned
                  ? handleUnbanPlayer(selectedPlayer.id, selectedPlayer.displayName)
                  : handleBanPlayer(selectedPlayer.id, selectedPlayer.displayName)
                }
                disabled={saving}
                style={{width:'100%', marginTop:8, padding:'8px', background: selectedPlayer.banned ? 'rgba(76,175,135,0.2)' : confirmBan===selectedPlayer.id ? 'rgba(224,85,85,0.5)' : 'rgba(224,85,85,0.15)', color: selectedPlayer.banned ? '#4caf87' : '#e05555', border:`1px solid ${selectedPlayer.banned ? '#4caf87' : '#e05555'}`, borderRadius:6, cursor:'pointer', fontSize:'0.82rem'}}>
                {selectedPlayer.banned ? '✅ BAN解除' : confirmBan===selectedPlayer.id ? '⚠️ 本当にBANする？（もう一度押す）' : '🚫 このプレイヤーをBAN'}
              </button>

              {/* ===== インベントリ編集 ===== */}
              <div style={{marginTop:14, borderTop:'1px solid #2d3752', paddingTop:12}}>
                <div style={{fontWeight:700, color:'#f0c060', fontSize:'0.85rem', marginBottom:8}}>📦 インベントリ編集</div>
                {/* 追加 */}
                <div style={{display:'flex', gap:6, marginBottom:8, alignItems:'center'}}>
                  <select value={invEditItem} onChange={e => setInvEditItem(e.target.value)}
                    style={{flex:1, padding:'5px 6px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.75rem'}}>
                    <option value="">-- アイテム選択 --</option>
                    {Object.values(ITEM_MASTER).map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <input type="number" min={1} value={invEditAmount} onChange={e => setInvEditAmount(e.target.value)}
                    style={{width:54, padding:'5px 6px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.75rem'}} />
                  <button disabled={!invEditItem || saving} onClick={async () => {
                    if (!invEditItem) return;
                    const amt = Math.max(1, Number(invEditAmount));
                    setSaving(true);
                    try {
                      const curInv = selectedPlayer.inventory ?? {};
                      const newInv = { ...curInv, [invEditItem]: (curInv[invEditItem] ?? 0) + amt };
                      await updatePlayerAdmin(selectedPlayer.id, { inventory: newInv });
                      setSelectedPlayer((p: any) => ({ ...p, inventory: newInv }));
                      setPlayers(prev => prev.map(p => p.id === selectedPlayer.id ? { ...p, inventory: newInv } : p));
                      if (player && player.uid === selectedPlayer.id) {
                        useGameStore.setState(s => ({ player: s.player ? { ...s.player, inventory: newInv } : s.player }));
                      }
                      addNotification('success', `${ITEM_MASTER[invEditItem]?.name ?? invEditItem} ×${amt} を追加`);
                    } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                    setSaving(false);
                  }}
                    style={{padding:'5px 10px', background:'rgba(76,175,135,0.2)', color:'#4caf87', border:'1px solid #4caf87', borderRadius:4, cursor:'pointer', fontSize:'0.75rem', whiteSpace:'nowrap'}}>
                    ＋追加
                  </button>
                </div>
                {/* 現在のインベントリ一覧 */}
                <input value={invFilter} onChange={e => setInvFilter(e.target.value)}
                  placeholder="アイテム名で絞り込み..."
                  style={{width:'100%', padding:'5px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.72rem', boxSizing:'border-box', marginBottom:6}} />
                <div style={{maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:3}}>
                  {Object.entries(selectedPlayer.inventory ?? {}).filter(([id]) => {
                    if (!invFilter) return true;
                    return (ITEM_MASTER[id]?.name ?? id).includes(invFilter) || id.includes(invFilter);
                  }).map(([itemId, amt]: [string, any]) => {
                    const item = ITEM_MASTER[itemId];
                    return (
                      <div key={itemId} style={{display:'flex', alignItems:'center', gap:6, padding:'4px 6px', background:'#161b26', borderRadius:4}}>
                        <GameIcon id={item?.icon ?? 'gem'} size={16} />
                        <span style={{flex:1, fontSize:'0.72rem', color:'#e8e6ff'}}>{item?.name ?? itemId}</span>
                        <input type="number" min={0} value={amt}
                          onChange={async e => {
                            const newAmt = Math.max(0, Number(e.target.value));
                            const curInv = { ...(selectedPlayer.inventory ?? {}) };
                            if (newAmt === 0) delete curInv[itemId]; else curInv[itemId] = newAmt;
                            setSelectedPlayer((p: any) => ({ ...p, inventory: curInv }));
                            setPlayers(prev => prev.map(p => p.id === selectedPlayer.id ? { ...p, inventory: curInv } : p));
                            if (player && player.uid === selectedPlayer.id) {
                              useGameStore.setState(s => ({ player: s.player ? { ...s.player, inventory: curInv } : s.player }));
                            }
                            try { await updatePlayerAdmin(selectedPlayer.id, { inventory: curInv }); }
                            catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                          }}
                          style={{width:54, padding:'3px 4px', background:'#1c2235', border:'1px solid #2d3752', color:'#f0c060', borderRadius:4, fontSize:'0.72rem'}}
                        />
                        <button onClick={async () => {
                          const curInv = { ...(selectedPlayer.inventory ?? {}) };
                          delete curInv[itemId];
                          setSaving(true);
                          try {
                            await updatePlayerAdmin(selectedPlayer.id, { inventory: curInv });
                            setSelectedPlayer((p: any) => ({ ...p, inventory: curInv }));
                            setPlayers(prev => prev.map(p => p.id === selectedPlayer.id ? { ...p, inventory: curInv } : p));
                            if (player && player.uid === selectedPlayer.id) {
                              useGameStore.setState(s => ({ player: s.player ? { ...s.player, inventory: curInv } : s.player }));
                            }
                          } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                          setSaving(false);
                        }} style={{padding:'2px 6px', background:'rgba(224,85,85,0.15)', color:'#e05555', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.68rem'}}>
                          削除
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== サーバー統計 ===== */}
      {subTab === 'stats' && (
        <div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16}}>
            {[
              { label:'総プレイヤー数', value:`${stats.total}人`, icon:'users' },
              { label:'BAN済み', value:`${stats.banned}人`, icon:'ban' },
              { label:'24h以内アクティブ', value:`${stats.active}人`, icon:'dot_green' },
              { label:'全プレイヤー総資産', value:`${stats.totalGold.toLocaleString()}G`, icon:'gold_bag' },
              { label:'平均レベル', value:`Lv.${stats.avgLevel}`, icon:'swords' },
              { label:'最高レベル', value:`Lv.${stats.maxLevel}`, icon:'trophy' },
            ].map(s => (
              <div key={s.label} style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'12px 14px', textAlign:'center'}}>
                <div style={{fontSize:'1.5rem', marginBottom:4}}><GameIcon id={s.icon} size={28} /></div>
                <div style={{fontSize:'0.7rem', color:'#8a92b2', marginBottom:4}}>{s.label}</div>
                <div style={{fontWeight:700, fontSize:'0.95rem', color:'#f0c060'}}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:12}}>
            <div style={{fontWeight:700, color:'#5b8dee', marginBottom:8, fontSize:'0.85rem'}}>🏰 ダンジョン攻略状況</div>
            {Object.values(DUNGEON_MASTER).map(d => {
              const cleared = players.filter(p => (p.dungeonClearedCount?.[d.id] ?? 0) > 0).length;
              const pct = stats.total > 0 ? Math.round(cleared / stats.total * 100) : 0;
              return (
                <div key={d.id} style={{marginBottom:6}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', marginBottom:2}}>
                    <span style={{display:'flex',alignItems:'center',gap:4}}><GameIcon id={d.icon} size={14} /> {d.name}</span>
                    <span style={{color:'#4caf87'}}>{cleared}人 ({pct}%)</span>
                  </div>
                  <div style={{height:4, background:'#2d3752', borderRadius:2, overflow:'hidden'}}>
                    <div style={{height:'100%', background:'#4caf87', width:`${pct}%`}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 釣りデータ管理 ===== */}
      {subTab === 'fishing_admin' && (() => {
        const filteredFishingPlayers = filterPlayersAdmin(players, {
          name: fishingAdminFilter || undefined,
          id: fishingAdminFilter || undefined,
        });
        const loadFishingPlayer = (p: any) => {
          setFishingAdminPlayer(p);
          setFaFishCoin(String(p.fishCoin ?? 0));
          setFaFishingLevel(String(p.fishingLevel ?? 1));
          setFaFishingExp(String(p.fishingExp ?? 0));
          setFaEquippedRodId(p.equippedRodId ?? 'basic_rod');
          setFaEquippedBaitId(p.fishingEquippedBaitId ?? '');
          setFaUnlockedSpots(p.fishingUnlockedSpots ?? ['pond', 'river']);
          const enhance = p.fishingRodEnhance ?? {};
          const enhStr: Record<string, string> = {};
          ROD_IDS.forEach(rid => { enhStr[rid] = String(enhance[rid] ?? 0); });
          setFaRodEnhance(enhStr);
          setFaFishingAchievements(p.fishingAchievements ?? []);
          setFaFishingTitles(p.fishingUnlockedTitles ?? []);
          setFaFishBookCount(Object.keys(p.fishBook ?? {}).length);
        };
        const saveFishingData = async () => {
          if (!fishingAdminPlayer) return;
          setFaSaving(true);
          try {
            const rodEnhance: Record<string, number> = {};
            ROD_IDS.forEach(rid => { const v = Number(faRodEnhance[rid] ?? 0); if (v > 0) rodEnhance[rid] = v; });
            await updatePlayerAdmin(fishingAdminPlayer.id, {
              fishCoin: Number(faFishCoin),
              fishingLevel: Number(faFishingLevel),
              fishingExp: Number(faFishingExp),
              equippedRodId: faEquippedRodId,
              fishingEquippedBaitId: faEquippedBaitId || undefined,
              fishingUnlockedSpots: faUnlockedSpots,
              fishingRodEnhance: rodEnhance,
              fishingAchievements: faFishingAchievements,
              fishingUnlockedTitles: faFishingTitles,
            } as any);
            addNotification('success', `${fishingAdminPlayer.displayName} の釣りデータを更新しました`);
          } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
          setFaSaving(false);
        };
        const FISHING_RESET_FIELDS: Record<string, any> = {
          fishingScore: 0,
          equippedRodId: 'basic_rod',
          fishingLevel: 1,
          fishingExp: 0,
          fishingTotalCount: 0,
          fishingMaxSizeCm: 0,
          fishingMaxWeightKg: 0,
          fishBook: {},
          fishingEquippedBaitId: '',
          fishingSelectedSpotId: 'pond',
          fishingUnlockedSpots: ['pond', 'river'],
          fishingRodEnhance: {},
          fishingRodDurability: {},
          fishingTotalBaitUsed: 0,
          fishingTotalGoldEarned: 0,
          fishingAchievements: [],
          fishingUnlockedTitles: [],
          fishCoin: 0,
          fishMoney: 0,
          fishingLegendaryCount: 0,
          fishingTotalWeightKg: 0,
        };
        const resetAllFishingData = async () => {
          setFaResetAllRunning(true);
          try {
            for (const p of players) {
              await updatePlayerAdmin(p.id, FISHING_RESET_FIELDS as any);
            }
            setPlayers(prev => prev.map(p => ({ ...p, ...FISHING_RESET_FIELDS })));
            if (fishingAdminPlayer) {
              setFishingAdminPlayer((prev: any) => prev ? { ...prev, ...FISHING_RESET_FIELDS } : prev);
              setFaFishCoin('0'); setFaFishingLevel('1'); setFaFishingExp('0');
              setFaEquippedRodId('basic_rod'); setFaEquippedBaitId('');
              setFaUnlockedSpots(['pond', 'river']); setFaRodEnhance({});
              setFaFishingAchievements([]); setFaFishingTitles([]); setFaFishBookCount(0);
            }
            addNotification('success', `全${players.length}人分の釣りデータをリセットしました`);
          } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
          setFaResetAllRunning(false);
          setFaResetAllConfirm(false);
        };

        const S2 = { label: { fontSize:'0.72rem', color:'#8a92b2', marginBottom:3 }, input: { width:'100%', padding:'6px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box' as const } };

        return (
          <div>
            <div style={{marginBottom:10}}>
              <input value={fishingAdminFilter} onChange={e => setFishingAdminFilter(e.target.value)}
                placeholder="名前・UIDで検索..." style={{width:'100%', padding:'7px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box'}} />
            </div>

            <div style={{marginBottom:14, padding:12, background:'rgba(224,85,85,0.08)', border:'1px solid #e05555', borderRadius:8}}>
              <div style={{color:'#e05555', fontWeight:700, fontSize:'0.85rem', marginBottom:6}}>⚠️ 全プレイヤー釣りデータ一括リセット</div>
              <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:8}}>
                全{players.length}人分の釣りLv・EXP・釣りコイン・FishMoney・図鑑・竿強化・実績・称号・解放スポット等を初期状態に戻します。この操作は取り消せません。
              </div>
              {!faResetAllConfirm ? (
                <button onClick={() => setFaResetAllConfirm(true)} disabled={faResetAllRunning}
                  style={{padding:'8px 14px', background:'rgba(224,85,85,0.2)', color:'#e05555', border:'1px solid #e05555', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem'}}>
                  🗑️ 全プレイヤーの釣りデータをリセット
                </button>
              ) : (
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <span style={{fontSize:'0.78rem', color:'#e05555', fontWeight:700}}>本当に実行しますか？</span>
                  <button onClick={resetAllFishingData} disabled={faResetAllRunning}
                    style={{padding:'7px 14px', background:'#e05555', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem'}}>
                    {faResetAllRunning ? '実行中...' : '✅ はい、リセットする'}
                  </button>
                  <button onClick={() => setFaResetAllConfirm(false)} disabled={faResetAllRunning}
                    style={{padding:'7px 14px', background:'#2d3752', color:'#8a92b2', border:'1px solid #3d4762', borderRadius:6, cursor:'pointer', fontSize:'0.82rem'}}>
                    キャンセル
                  </button>
                </div>
              )}
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:4, marginBottom:14, maxHeight:180, overflowY:'auto'}}>
              {filteredFishingPlayers.slice(0,30).map(p => (
                <button key={p.id} onClick={() => loadFishingPlayer(p)}
                  style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background: fishingAdminPlayer?.id === p.id ? 'rgba(14,165,233,0.15)' : '#1c2235', border:`1px solid ${fishingAdminPlayer?.id === p.id ? '#0ea5e9' : '#2d3752'}`, borderRadius:6, cursor:'pointer', color:'#e8e6ff', fontSize:'0.82rem', textAlign:'left'}}>
                  <span>🎣 {p.displayName ?? '名無し'} (Lv.{p.stats?.level ?? 1})</span>
                  <span style={{color:'#0ea5e9', fontSize:'0.75rem'}}>釣Lv.{(p as any).fishingLevel ?? 1} 🪙{((p as any).fishCoin ?? 0).toLocaleString()}</span>
                </button>
              ))}
            </div>

            {fishingAdminPlayer && (
              <div style={{background:'#1c2235', border:'2px solid #0ea5e9', borderRadius:10, padding:14}}>
                <div style={{color:'#0ea5e9', fontWeight:700, fontSize:'0.92rem', marginBottom:12}}>🎣 {fishingAdminPlayer.displayName} の釣りデータ編集</div>

                {/* 基本数値 */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12}}>
                  {[
                    { label:'🪙 釣りコイン', val:faFishCoin, set:setFaFishCoin },
                    { label:'⭐ 釣りLv', val:faFishingLevel, set:setFaFishingLevel },
                    { label:'✨ 釣りEXP', val:faFishingExp, set:setFaFishingExp },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={S2.label}>{f.label}</div>
                      <input type="number" min="0" value={f.val} onChange={e => f.set(e.target.value)} style={S2.input} />
                    </div>
                  ))}
                </div>

                {/* 装備竿 */}
                <div style={{marginBottom:10}}>
                  <div style={S2.label}>🎣 装備竿</div>
                  <select value={faEquippedRodId} onChange={e => setFaEquippedRodId(e.target.value)}
                    style={{...S2.input, cursor:'pointer'}}>
                    {ROD_IDS.map(rid => <option key={rid} value={rid}>{ROD_MASTER[rid].icon} {ROD_MASTER[rid].name}</option>)}
                  </select>
                </div>

                {/* 装備餌 */}
                <div style={{marginBottom:12}}>
                  <div style={S2.label}>🪱 装備エサ</div>
                  <select value={faEquippedBaitId} onChange={e => setFaEquippedBaitId(e.target.value)}
                    style={{...S2.input, cursor:'pointer'}}>
                    <option value="">なし</option>
                    {BAIT_IDS.map(bid => <option key={bid} value={bid}>{BAIT_MASTER[bid].icon} {BAIT_MASTER[bid].name}</option>)}
                  </select>
                </div>

                {/* 解放スポット */}
                <div style={{marginBottom:12}}>
                  <div style={{...S2.label, marginBottom:6}}>📍 解放済みスポット</div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
                    {SPOT_IDS.map(sid => {
                      const on = faUnlockedSpots.includes(sid);
                      return (
                        <button key={sid} onClick={() => setFaUnlockedSpots(p => on ? p.filter(x => x !== sid) : [...p, sid])}
                          style={{padding:'4px 8px', fontSize:'0.75rem', background: on ? 'rgba(14,165,233,0.2)' : '#161b26', border:`1px solid ${on ? '#0ea5e9' : '#2d3752'}`, color: on ? '#0ea5e9' : '#6a7290', borderRadius:5, cursor:'pointer'}}>
                          {SPOT_MASTER[sid].icon} {SPOT_MASTER[sid].name}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{display:'flex', gap:6, marginTop:6}}>
                    <button onClick={() => setFaUnlockedSpots(SPOT_IDS)} style={{padding:'4px 10px', fontSize:'0.75rem', background:'rgba(14,165,233,0.15)', border:'1px solid #0ea5e9', color:'#0ea5e9', borderRadius:5, cursor:'pointer'}}>全解放</button>
                    <button onClick={() => setFaUnlockedSpots(['pond','river'])} style={{padding:'4px 10px', fontSize:'0.75rem', background:'rgba(224,85,85,0.1)', border:'1px solid #e05555', color:'#e05555', borderRadius:5, cursor:'pointer'}}>リセット</button>
                  </div>
                </div>

                {/* 竿強化 */}
                <div style={{marginBottom:12}}>
                  <div style={{...S2.label, marginBottom:6}}>🔨 竿強化レベル</div>
                  <div style={{maxHeight:140, overflowY:'auto', display:'flex', flexDirection:'column', gap:4}}>
                    {ROD_IDS.filter(rid => Number(faRodEnhance[rid] ?? 0) > 0 || ['basic_rod','master_rod','god_rod','infinite_rod'].includes(rid)).map(rid => (
                      <div key={rid} style={{display:'flex', alignItems:'center', gap:8}}>
                        <span style={{flex:1, fontSize:'0.78rem', color:'#e8e6ff'}}>{ROD_MASTER[rid].icon} {ROD_MASTER[rid].name}</span>
                        <input type="number" min="0" max="20" value={faRodEnhance[rid] ?? '0'}
                          onChange={e => setFaRodEnhance(p => ({...p, [rid]: e.target.value}))}
                          style={{width:56, padding:'4px 6px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.82rem', textAlign:'center'}} />
                      </div>
                    ))}
                    <button onClick={() => {
                      const all: Record<string, string> = {};
                      ROD_IDS.forEach(rid => { all[rid] = faRodEnhance[rid] ?? '0'; });
                      setFaRodEnhance(all);
                    }} style={{fontSize:'0.72rem', padding:'3px 8px', background:'#2d3752', border:'1px solid #3d4762', color:'#8a92b2', borderRadius:4, cursor:'pointer', alignSelf:'flex-start'}}>全竿を表示</button>
                  </div>
                </div>

                {/* 実績 */}
                <div style={{marginBottom:10}}>
                  <div style={{...S2.label, marginBottom:6}}>🏅 実績 ({faFishingAchievements.length}/{FISHING_ACHIEVEMENTS.length})</div>
                  <div style={{display:'flex', gap:6}}>
                    <button onClick={() => setFaFishingAchievements(FISHING_ACHIEVEMENTS.map(a => a.id))} style={{padding:'4px 10px', fontSize:'0.75rem', background:'rgba(14,165,233,0.15)', border:'1px solid #0ea5e9', color:'#0ea5e9', borderRadius:5, cursor:'pointer'}}>全付与</button>
                    <button onClick={() => setFaFishingAchievements([])} style={{padding:'4px 10px', fontSize:'0.75rem', background:'rgba(224,85,85,0.1)', border:'1px solid #e05555', color:'#e05555', borderRadius:5, cursor:'pointer'}}>全リセット</button>
                  </div>
                </div>

                {/* 称号 */}
                <div style={{marginBottom:12}}>
                  <div style={{...S2.label, marginBottom:6}}>⭐ 称号 ({faFishingTitles.length}/{FISHING_TITLES.length})</div>
                  <div style={{display:'flex', gap:6}}>
                    <button onClick={() => setFaFishingTitles(FISHING_TITLES.map(t => t.id))} style={{padding:'4px 10px', fontSize:'0.75rem', background:'rgba(14,165,233,0.15)', border:'1px solid #0ea5e9', color:'#0ea5e9', borderRadius:5, cursor:'pointer'}}>全付与</button>
                    <button onClick={() => setFaFishingTitles([])} style={{padding:'4px 10px', fontSize:'0.75rem', background:'rgba(224,85,85,0.1)', border:'1px solid #e05555', color:'#e05555', borderRadius:5, cursor:'pointer'}}>全リセット</button>
                  </div>
                </div>

                {/* 図鑑情報 */}
                <div style={{marginBottom:14, padding:'8px 12px', background:'#161b26', borderRadius:6, border:'1px solid #2d3752'}}>
                  <span style={{fontSize:'0.8rem', color:'#8a92b2'}}>📖 図鑑: <span style={{color:'#e8e6ff', fontWeight:700}}>{faFishBookCount}種</span> 登録済み（直接編集はアイテムタブから）</span>
                </div>

                <button onClick={saveFishingData} disabled={faSaving}
                  style={{width:'100%', padding:'10px', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:'0.88rem'}}>
                  {faSaving ? '保存中...' : '💾 釣りデータを保存'}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ===== 通貨編集 ===== */}
      {subTab === 'currency_admin' && (() => {
        const filteredCurrencyPlayers = filterPlayersAdmin(players, {
          name: currencyAdminFilter || undefined,
          id: currencyAdminFilter || undefined,
        });
        const loadCurrencyPlayer = (p: any) => {
          setCurrencyAdminPlayer(p);
          setCaGold(String(p.gold ?? 0));
          setCaFishCoin(String(p.fishCoin ?? 0));
          setCaFishMoney(String(p.fishMoney ?? 0));
          setCaWealthCoin(String(p.wealthCoin ?? 0));
        };
        const saveCurrencyData = async () => {
          if (!currencyAdminPlayer) return;
          setCaSaving(true);
          try {
            const updates = {
              gold: Number(caGold) || 0,
              fishCoin: Number(caFishCoin) || 0,
              fishMoney: Number(caFishMoney) || 0,
              wealthCoin: Number(caWealthCoin) || 0,
            };
            await updatePlayerAdmin(currencyAdminPlayer.id, updates as any);
            setPlayers(prev => prev.map(p => p.id === currencyAdminPlayer.id ? { ...p, ...updates } : p));
            setCurrencyAdminPlayer((prev: any) => prev ? { ...prev, ...updates } : prev);
            addNotification('success', `${currencyAdminPlayer.displayName} の通貨データを更新しました`);
          } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
          setCaSaving(false);
        };
        const S3 = { label: { fontSize:'0.72rem', color:'#8a92b2', marginBottom:3 }, input: { width:'100%', padding:'6px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box' as const } };
        return (
          <div>
            <div style={{marginBottom:10}}>
              <input value={currencyAdminFilter} onChange={e => setCurrencyAdminFilter(e.target.value)}
                placeholder="名前・UIDで検索..." style={{width:'100%', padding:'7px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box'}} />
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:4, marginBottom:14, maxHeight:180, overflowY:'auto'}}>
              {filteredCurrencyPlayers.slice(0,30).map(p => (
                <button key={p.id} onClick={() => loadCurrencyPlayer(p)}
                  style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background: currencyAdminPlayer?.id === p.id ? 'rgba(240,168,48,0.15)' : '#1c2235', border:`1px solid ${currencyAdminPlayer?.id === p.id ? '#f0a830' : '#2d3752'}`, borderRadius:6, cursor:'pointer', color:'#e8e6ff', fontSize:'0.82rem', textAlign:'left'}}>
                  <span>💰 {p.displayName ?? '名無し'} (Lv.{p.stats?.level ?? 1})</span>
                  <span style={{color:'#f0a830', fontSize:'0.75rem'}}>
                    G{((p as any).gold ?? 0).toLocaleString()} / 🐟{((p as any).fishCoin ?? 0).toLocaleString()} / 💵{((p as any).fishMoney ?? 0).toLocaleString()} / 🎰{((p as any).wealthCoin ?? 0).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>

            {currencyAdminPlayer && (
              <div style={{background:'#1c2235', border:'2px solid #f0a830', borderRadius:10, padding:14}}>
                <div style={{color:'#f0a830', fontWeight:700, fontSize:'0.92rem', marginBottom:12}}>💰 {currencyAdminPlayer.displayName} の通貨データ編集</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12}}>
                  {[
                    { label:'💰 Gold (G)', val:caGold, set:setCaGold },
                    { label:'🐟 Fish Coin', val:caFishCoin, set:setCaFishCoin },
                    { label:'💵 FishMoney', val:caFishMoney, set:setCaFishMoney },
                    { label:'🎰 Wealth Coin', val:caWealthCoin, set:setCaWealthCoin },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={S3.label}>{f.label}</div>
                      <input type="number" min="0" value={f.val} onChange={e => f.set(e.target.value)} style={S3.input} />
                    </div>
                  ))}
                </div>
                <button onClick={saveCurrencyData} disabled={caSaving}
                  style={{width:'100%', padding:'10px', background:'linear-gradient(135deg,#f0a830,#c08020)', color:'#000', border:'none', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:'0.88rem'}}>
                  {caSaving ? '保存中...' : '💾 通貨データを保存'}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {subTab === 'console' && (() => {
        const filteredConsolePlayers = filterPlayersAdmin(players, {
          id: searchId || undefined,
          name: searchName || undefined,
          minLevel: searchMinLevel ? Number(searchMinLevel) : undefined,
          maxLevel: searchMaxLevel ? Number(searchMaxLevel) : undefined,
          minGold: searchMinGold ? Number(searchMinGold) : undefined,
          maxGold: searchMaxGold ? Number(searchMaxGold) : undefined,
        });
        const consolePlayer = players.find(p => p.id === consoleSelectedId) ?? null;
        const adminId = player?.uid ?? 'unknown_admin';
        const handleConsolePlayerUpdated = (uid: string, updates: Record<string, unknown>) => {
          setPlayers(prev => prev.map(p => p.id === uid ? { ...p, ...updates } as any : p));
          if (player && player.uid === uid) {
            useGameStore.setState(s => ({ player: s.player ? { ...s.player, ...updates } as any : s.player }));
          }
        };
        const CONSOLE_SECTIONS: { id: typeof consoleSection; label: string; needsPlayer: boolean }[] = [
          { id: 'editor',    label: '完全編集',     needsPlayer: true },
          { id: 'commands',  label: '強制コマンド', needsPlayer: true },
          { id: 'history',   label: '巻き戻し',     needsPlayer: true },
          { id: 'logs',      label: '管理ログ',     needsPlayer: false },
          { id: 'master',    label: 'マスター編集', needsPlayer: false },
          { id: 'event',     label: 'イベント',     needsPlayer: false },
          { id: 'analytics', label: '分析',         needsPlayer: false },
        ];
        return (
          <div>
            {/* プレイヤー検索強化 */}
            <div style={{background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:12, marginBottom:12}}>
              <div style={{fontSize:'0.85rem', fontWeight:700, color:'#f0c060', marginBottom:8}}>🔍 プレイヤー検索</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6}}>
                <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="名前（部分一致）" style={inputStyle} />
                <input value={searchId} onChange={e => setSearchId(e.target.value)} placeholder="UID（部分一致）" style={inputStyle} />
                <input type="number" value={searchMinLevel} onChange={e => setSearchMinLevel(e.target.value)} placeholder="レベル下限" style={inputStyle} />
                <input type="number" value={searchMaxLevel} onChange={e => setSearchMaxLevel(e.target.value)} placeholder="レベル上限" style={inputStyle} />
                <input type="number" value={searchMinGold} onChange={e => setSearchMinGold(e.target.value)} placeholder="ゴールド下限" style={inputStyle} />
                <input type="number" value={searchMaxGold} onChange={e => setSearchMaxGold(e.target.value)} placeholder="ゴールド上限" style={inputStyle} />
              </div>
              <div style={{maxHeight:160, overflowY:'auto', display:'flex', flexDirection:'column', gap:3}}>
                {filteredConsolePlayers.map(p => (
                  <button key={p.id} onClick={() => setConsoleSelectedId(p.id)}
                    style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background: consoleSelectedId === p.id ? 'rgba(91,141,238,0.2)' : '#1c2235', border:`1px solid ${consoleSelectedId === p.id ? '#5b8dee' : '#2d3752'}`, borderRadius:6, cursor:'pointer', color:'#e8e6ff', fontSize:'0.78rem', textAlign:'left'}}>
                    <span>{p.banned ? '🚫' : '⚔️'} {p.displayName ?? '名無し'} (Lv.{p.stats?.level ?? 1})</span>
                    <span style={{color:'#f0c060', flexShrink:0}}>💰 {(p.gold ?? 0).toLocaleString()}G</span>
                  </button>
                ))}
                {filteredConsolePlayers.length === 0 && (
                  <div style={{color:'#4a5070', textAlign:'center', padding:10, fontSize:'0.78rem'}}>該当なし</div>
                )}
              </div>
            </div>

            {/* セクション切り替え */}
            <div style={{display:'flex', gap:4, marginBottom:12, overflowX:'auto', flexWrap:'wrap'}}>
              {CONSOLE_SECTIONS.map(s => (
                <button key={s.id} onClick={() => setConsoleSection(s.id)}
                  style={{flexShrink:0, padding:'6px 10px', background: consoleSection===s.id ? 'rgba(224,85,85,0.2)' : '#1c2235', border:`1px solid ${consoleSection===s.id ? '#e05555' : '#2d3752'}`, color: consoleSection===s.id ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer', fontSize:'0.78rem'}}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* プレイヤー必須セクションでの未選択ガード */}
            {CONSOLE_SECTIONS.find(s => s.id === consoleSection)?.needsPlayer && !consolePlayer && (
              <div style={{color:'#4a5070', textAlign:'center', padding:20, fontSize:'0.85rem'}}>上の検索からプレイヤーを選択してください</div>
            )}

            {consoleSection === 'editor' && consolePlayer && (
              <PlayerEditor player={consolePlayer} adminId={adminId} onUpdated={handleConsolePlayerUpdated} addNotification={addNotification} />
            )}
            {consoleSection === 'commands' && consolePlayer && (
              <AdminCommands player={consolePlayer} adminId={adminId} onUpdated={handleConsolePlayerUpdated} addNotification={addNotification} />
            )}
            {consoleSection === 'history' && consolePlayer && (
              <PlayerHistory player={consolePlayer} adminId={adminId} onUpdated={handleConsolePlayerUpdated} addNotification={addNotification} />
            )}
            {consoleSection === 'logs' && <AdminLogs />}
            {consoleSection === 'master' && <MasterEditor adminId={adminId} addNotification={addNotification} />}
            {consoleSection === 'event' && <EventManager adminId={adminId} addNotification={addNotification} />}
            {consoleSection === 'analytics' && <AnalyticsPanel players={players} addNotification={addNotification} />}
          </div>
        );
      })()}


      {subTab === 'gamble' && (
        <div>
          <p style={{fontSize:'0.8rem', color:'#8a92b2', marginBottom:12}}>
            各ギャンブルの倍率ボーナスを設定します（1.0 = 通常、2.0 = 2倍）。全プレイヤーに反映されます。
          </p>
          {Object.values(GAMBLE_MASTER).map(g => (
            <div key={g.id} style={{display:'flex', alignItems:'center', gap:10, marginBottom:8, padding:'8px 10px', background:'#1c2235', border:'1px solid #2d3752', borderRadius:6}}>
              <span style={{fontSize:'1.2rem'}}><GameIcon id={g.icon} size={22} /></span>
              <span style={{flex:1, fontSize:'0.85rem'}}>{g.name}</span>
              <input
                type="number" step="0.1" min="0.1" max="10"
                value={multipliers[g.id] ?? 1.0}
                onChange={e => setMultipliers(prev => ({ ...prev, [g.id]: Number(e.target.value) }))}
                style={{width:70, padding:'4px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.85rem'}}
              />
              <span style={{fontSize:'0.75rem', color:'#8a92b2'}}>倍</span>
            </div>
          ))}
          <button onClick={handleSaveMultipliers} disabled={saving}
            style={{width:'100%', padding:'10px', background:'linear-gradient(135deg,#e05555,#c03030)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.9rem', marginTop:8}}>
            {saving ? '更新中...' : '🎰 全プレイヤーに反映する'}
          </button>

          {/* 宝箱確率編集 */}
          <div style={{marginTop:20}}>
            <p style={{fontSize:'0.82rem', fontWeight:700, color:'#f0c060', marginBottom:8}}>📦 宝箱の中身 確率設定</p>
            <p style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:10}}>合計が100%になるように調整してください。変更後に保存してください。</p>
            {(() => {
              const total = treasureProbs.reduce((s, e) => s + e.probability, 0);
              const isValid = Math.abs(total - 1.0) < 0.001;
              return (
                <>
                  {treasureProbs.map((entry, i) => (
                    <div key={i} style={{display:'flex', alignItems:'center', gap:8, marginBottom:6, padding:'7px 10px', background:'#1c2235', border:'1px solid #2d3752', borderRadius:6}}>
                      <span style={{flex:1, fontSize:'0.8rem', color:'#e8e6ff'}}>{entry.label}</span>
                      <input
                        type="number" step="0.001" min="0" max="1"
                        value={(entry.probability * 100).toFixed(3)}
                        onChange={e => {
                          const v = Math.max(0, Math.min(100, Number(e.target.value))) / 100;
                          setTreasureProbsState(prev => prev.map((x, j) => j === i ? { ...x, probability: v } : x));
                        }}
                        style={{width:80, padding:'4px 6px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.82rem', textAlign:'right'}}
                      />
                      <span style={{fontSize:'0.75rem', color:'#8a92b2'}}>%</span>
                    </div>
                  ))}
                  <div style={{textAlign:'right', fontSize:'0.78rem', marginBottom:8, color: isValid ? '#4caf87' : '#e05555', fontWeight:700}}>
                    合計: {(total * 100).toFixed(3)}% {isValid ? '✅' : '⚠️ 100%にしてください'}
                  </div>
                  <button
                    disabled={saving || !isValid}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await setTreasureProbs(treasureProbs);
                        addNotification('success', '宝箱確率を保存しました');
                      } catch { addNotification('error', '保存に失敗しました'); }
                      setSaving(false);
                    }}
                    style={{width:'100%', padding:'9px', background: isValid ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752', color:'#fff', border:'none', borderRadius:8, cursor: isValid ? 'pointer' : 'not-allowed', fontWeight:700, fontSize:'0.85rem'}}>
                    {saving ? '保存中...' : '📦 宝箱確率を保存する'}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===== アイテム価格設定 ===== */}
      {subTab === 'items' && (
        <div>
          <p style={{fontSize:'0.8rem', color:'#8a92b2', marginBottom:8}}>
            各アイテムの購入価格・売却価格を調整します。0=購入不可。変更後に保存してください。
          </p>
          <input
            value={itemFilter} onChange={e => setItemFilter(e.target.value)}
            placeholder="アイテム名で検索..."
            style={{width:'100%', padding:'6px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box' as const, marginBottom:8}}
          />
          <div style={{maxHeight:420, overflowY:'auto', display:'flex', flexDirection:'column', gap:4, marginBottom:8}}>
            {Object.values(ITEM_MASTER)
              .filter(item => !itemFilter || item.name.includes(itemFilter) || item.id.includes(itemFilter))
              .map(item => {
                const cur = itemPrices[item.id] ?? { buyPrice: item.buyPrice, sellPrice: item.sellPrice };
                return (
                  <div key={item.id} style={{display:'flex', alignItems:'center', gap:6, padding:'6px 8px', background:'#1c2235', border:'1px solid #2d3752', borderRadius:6}}>
                    <GameIcon id={item.icon} size={18} />
                    <span style={{flex:1, fontSize:'0.78rem', color:'#e8e6ff'}}>{item.name}</span>
                    <div style={{display:'flex', alignItems:'center', gap:4}}>
                      <span style={{fontSize:'0.65rem', color:'#4caf87'}}>買</span>
                      <input type="number" min={0} value={cur.buyPrice}
                        onChange={e => setItemPricesState(prev => ({
                          ...prev,
                          [item.id]: { ...cur, buyPrice: Math.max(0, Number(e.target.value)) }
                        }))}
                        style={{width:56, padding:'3px 4px', background:'#161b26', border:'1px solid #2d3752', color:'#4caf87', borderRadius:4, fontSize:'0.75rem'}}
                      />
                      <span style={{fontSize:'0.65rem', color:'#e05555'}}>売</span>
                      <input type="number" min={0} value={cur.sellPrice}
                        onChange={e => setItemPricesState(prev => ({
                          ...prev,
                          [item.id]: { ...cur, sellPrice: Math.max(0, Number(e.target.value)) }
                        }))}
                        style={{width:56, padding:'3px 4px', background:'#161b26', border:'1px solid #2d3752', color:'#e05555', borderRadius:4, fontSize:'0.75rem'}}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          <button
            onClick={async () => {
              setSaving(true);
              try {
                await setItemPrices(itemPrices);
                addNotification('success', 'アイテム価格を保存しました');
              } catch { addNotification('error', '保存に失敗しました'); }
              setSaving(false);
            }}
            disabled={saving}
            style={{width:'100%', padding:'10px', background:'linear-gradient(135deg,#4caf87,#2d8060)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.9rem'}}>
            {saving ? '保存中...' : '💾 アイテム価格を保存する'}
          </button>
        </div>
      )}

      {/* ===== お知らせ配信 ===== */}
      {subTab === 'announce' && (
        <div>
          <p style={{fontSize:'0.8rem', color:'#8a92b2', marginBottom:12}}>
            全プレイヤーのゲーム内に通知を配信します（Firestoreの shared/announcement に書き込み）。
          </p>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:4}}>画像URL（任意）</div>
            <input
              type="text"
              value={announceImageUrl}
              onChange={e => setAnnounceImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              style={{width:'100%', padding:'8px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem', boxSizing:'border-box'}}
            />
            {announceImageUrl && (
              <div style={{marginTop:6, display:'flex', alignItems:'center', gap:8}}>
                <img src={announceImageUrl} alt="プレビュー" style={{width:48, height:48, objectFit:'contain', borderRadius:4, border:'1px solid #2d3752'}} onError={e => (e.currentTarget.style.display='none')} />
                <span style={{fontSize:'0.72rem', color:'#4a5070'}}>画像プレビュー</span>
              </div>
            )}
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:4}}>お知らせ本文（最大100文字）</div>
            <textarea
              value={announceText}
              onChange={e => setAnnounceText(e.target.value.slice(0, 100))}
              rows={3}
              style={{width:'100%', padding:'8px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem', boxSizing:'border-box', resize:'vertical'}}
            />
            <div style={{fontSize:'0.72rem', color:'#4a5070', textAlign:'right'}}>{announceText.length}/100</div>
          </div>
          <button
            onClick={async () => {
              if (!announceText.trim()) return;
              setSaving(true);
              try {
                const { setDoc, doc } = await import('firebase/firestore');
                const { db } = await import('../../services/firebase');
                await setDoc(doc(db, 'shared', 'announcement'), {
                  text: announceText,
                  timestamp: Date.now(),
                  createdAt: Date.now(),
                  type: 'admin',
                  ...(announceImageUrl.trim() ? { imageUrl: announceImageUrl.trim() } : {}),
                });
                await saveAnnouncementToHistory(announceText, announceImageUrl.trim() || undefined);
                const h = await getAnnouncementHistory();
                setAnnounceHistory(h);
                addNotification('success', 'お知らせを配信しました');
                setAnnounceText('');
                setAnnounceImageUrl('');
              } catch (e: any) {
                addNotification('error', `配信失敗: ${e?.message ?? e}`);
              }
              setSaving(false);
            }}
            disabled={saving || !announceText.trim()}
            style={{width:'100%', padding:'10px', background: announceText.trim() ? 'linear-gradient(135deg,#5b8dee,#3d6fd0)' : '#2d3752', color:'#fff', border:'none', borderRadius:8, cursor: announceText.trim() ? 'pointer' : 'not-allowed', fontWeight:700, fontSize:'0.9rem'}}>
            {saving ? '配信中...' : '📢 全プレイヤーに配信'}
          </button>
          <div style={{marginTop:16}}>
            <div style={{fontSize:'0.82rem', color:'#f0c060', fontWeight:700, marginBottom:8}}>📋 過去のお知らせ一覧</div>
            {announceHistory.length === 0 ? (
              <div style={{color:'#4a5070', fontSize:'0.78rem', textAlign:'center', padding:'10px 0'}}>履歴なし</div>
            ) : announceHistory.map(a => (
              <div key={a.id} style={{background:'#161b26', border:'1px solid #2d3752', borderRadius:6, padding:'8px 10px', marginBottom:6}}>
                <div style={{fontSize:'0.68rem', color:'#4a5070', marginBottom:3, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span>{new Date(a.timestamp).toLocaleString('ja-JP')}</span>
                  <div style={{display:'flex', gap:4}}>
                    <button onClick={() => { setEditingAnnounceId(a.id); setEditingAnnounceText(a.text); setEditingAnnounceImageUrl(a.imageUrl ?? ''); }}
                      style={{fontSize:'0.7rem', padding:'2px 7px', background:'#2d3752', border:'1px solid #5b8dee', color:'#5b8dee', borderRadius:4, cursor:'pointer'}}>✏️ 編集</button>
                    <button onClick={async () => {
                      if (!window.confirm('このお知らせを削除しますか？')) return;
                      await deleteAnnouncementRecord(a.id);
                      setAnnounceHistory(h => h.filter(x => x.id !== a.id));
                      addNotification('success', '削除しました');
                    }} style={{fontSize:'0.7rem', padding:'2px 7px', background:'#2d3752', border:'1px solid #e05555', color:'#e05555', borderRadius:4, cursor:'pointer'}}>🗑️ 削除</button>
                  </div>
                </div>
                {editingAnnounceId === a.id ? (
                  <div style={{display:'flex', flexDirection:'column', gap:4}}>
                    <input value={editingAnnounceImageUrl} onChange={e => setEditingAnnounceImageUrl(e.target.value)}
                      placeholder="画像URL（任意）"
                      style={{padding:'5px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.78rem'}} />
                    <textarea value={editingAnnounceText} onChange={e => setEditingAnnounceText(e.target.value.slice(0, 500))}
                      rows={3} style={{padding:'5px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.78rem', resize:'vertical'}} />
                    <div style={{display:'flex', gap:4}}>
                      <button onClick={async () => {
                        await updateAnnouncementRecord(a.id, editingAnnounceText, editingAnnounceImageUrl);
                        const h = await getAnnouncementHistory();
                        setAnnounceHistory(h);
                        setEditingAnnounceId(null);
                        addNotification('success', '更新しました');
                      }} style={{flex:1, padding:'5px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.78rem', fontWeight:700}}>💾 保存</button>
                      <button onClick={() => setEditingAnnounceId(null)}
                        style={{padding:'5px 10px', background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.78rem'}}>キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex', alignItems:'flex-start', gap:8}}>
                    {a.imageUrl && <img src={a.imageUrl} alt="" style={{width:36, height:36, objectFit:'contain', borderRadius:4, flexShrink:0}} />}
                    <div style={{fontSize:'0.82rem', color:'#e8e6ff', whiteSpace:'pre-wrap', wordBreak:'break-word'}}>{a.text}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== クラフトレシピ管理 ===== */}
      {subTab === 'recipes' && (
        <div>
          <p style={{fontSize:'0.8rem', color:'#8a92b2', marginBottom:12}}>
            Firestoreにカスタムレシピを追加・削除します。追加したレシピはクラフト画面でリアルタイムに反映されます。
          </p>

          {/* 新規レシピ作成フォーム */}
          <div style={{background:'#1c2235', border:'1px solid #5b8dee', borderRadius:8, padding:12, marginBottom:14}}>
            <div style={{fontSize:'0.85rem', fontWeight:700, color:'#5b8dee', marginBottom:10}}>➕ 新規レシピ追加</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8}}>
              <div>
                <div style={{fontSize:'0.68rem', color:'#8a92b2', marginBottom:2}}>レシピID（英数字）</div>
                <input value={newRecipe.id ?? ''} onChange={e => setNewRecipe(r => ({...r, id: e.target.value}))}
                  placeholder="custom_recipe_1"
                  style={{width:'100%', padding:'5px 7px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.75rem', boxSizing:'border-box'}} />
              </div>
              <div>
                <div style={{fontSize:'0.68rem', color:'#8a92b2', marginBottom:2}}>レシピ名</div>
                <input value={newRecipe.name ?? ''} onChange={e => setNewRecipe(r => ({...r, name: e.target.value}))}
                  placeholder="例：究極の剣を作る"
                  style={{width:'100%', padding:'5px 7px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.75rem', boxSizing:'border-box'}} />
              </div>
              <div>
                <div style={{fontSize:'0.68rem', color:'#8a92b2', marginBottom:2}}>出力アイテム</div>
                <select value={newRecipe.outputItemId ?? ''} onChange={e => setNewRecipe(r => ({...r, outputItemId: e.target.value}))}
                  style={{width:'100%', padding:'5px 6px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.72rem'}}>
                  <option value="">-- 選択 --</option>
                  {Object.values(ITEM_MASTER).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:'0.68rem', color:'#8a92b2', marginBottom:2}}>出力個数</div>
                <input type="number" min={1} value={newRecipe.outputAmount ?? 1} onChange={e => setNewRecipe(r => ({...r, outputAmount: Number(e.target.value)}))}
                  style={{width:'100%', padding:'5px 7px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.75rem', boxSizing:'border-box'}} />
              </div>
              <div>
                <div style={{fontSize:'0.68rem', color:'#8a92b2', marginBottom:2}}>必要製作Lv</div>
                <input type="number" min={1} value={newRecipe.requiredCraftingLevel ?? 1} onChange={e => setNewRecipe(r => ({...r, requiredCraftingLevel: Number(e.target.value)}))}
                  style={{width:'100%', padding:'5px 7px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.75rem', boxSizing:'border-box'}} />
              </div>
              <div>
                <div style={{fontSize:'0.68rem', color:'#8a92b2', marginBottom:2}}>製作EXP</div>
                <input type="number" min={1} value={newRecipe.craftingExpGain ?? 10} onChange={e => setNewRecipe(r => ({...r, craftingExpGain: Number(e.target.value)}))}
                  style={{width:'100%', padding:'5px 7px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.75rem', boxSizing:'border-box'}} />
              </div>
            </div>
            {/* 3×3 クラフトグリッド */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:'0.72rem', color:'#f0c060', fontWeight:700, marginBottom:6}}>🔲 3×3 クラフト配置</div>
              <div style={{fontSize:'0.65rem', color:'#8a92b2', marginBottom:6}}>
                下でアイテムを選択してからマスをクリックで配置。右クリックまたは再クリックで削除。
              </div>
              {/* アイテム選択 */}
              <div style={{display:'flex', gap:4, marginBottom:8, alignItems:'center'}}>
                <select value={selectedShapeItem} onChange={e => setSelectedShapeItem(e.target.value)}
                  style={{flex:1, padding:'4px 6px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.68rem'}}>
                  <option value="">── グリッドに置くアイテムを選択 ──</option>
                  {Object.values(ITEM_MASTER).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <button onClick={() => setNewShape(Array(9).fill(''))}
                  style={{padding:'4px 8px', background:'rgba(224,85,85,0.12)', color:'#e05555', border:'1px solid #e05555', borderRadius:4, cursor:'pointer', fontSize:'0.65rem'}}>
                  クリア
                </button>
              </div>
              {/* 3×3グリッド本体 */}
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4, maxWidth:180, margin:'0 auto 8px'}}>
                {newShape.map((cellItem, idx) => {
                  const item = cellItem ? ITEM_MASTER[cellItem] : null;
                  return (
                    <div key={idx}
                      onClick={() => {
                        if (!selectedShapeItem) {
                          // 選択なし → クリックでそのセルを削除
                          setNewShape(prev => prev.map((c, i) => i === idx ? '' : c));
                        } else if (cellItem === selectedShapeItem) {
                          // 同じアイテム → 削除
                          setNewShape(prev => prev.map((c, i) => i === idx ? '' : c));
                        } else {
                          // 配置
                          setNewShape(prev => prev.map((c, i) => i === idx ? selectedShapeItem : c));
                        }
                      }}
                      style={{
                        width:'100%', aspectRatio:'1', background: cellItem ? 'rgba(91,141,238,0.15)' : '#161b26',
                        border: `2px solid ${cellItem ? '#5b8dee' : '#2d3752'}`,
                        borderRadius:4, display:'flex', flexDirection:'column', alignItems:'center',
                        justifyContent:'center', cursor:'pointer', padding:2, position:'relative',
                        transition:'border-color 0.15s, background 0.15s',
                      }}>
                      {item ? (
                        <>
                          <GameIcon id={item.icon ?? 'gem'} size={22} />
                          <span style={{fontSize:'0.5rem', color:'#8a92b2', textAlign:'center', lineHeight:1.1, marginTop:1, maxWidth:'90%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                            {item.name}
                          </span>
                        </>
                      ) : (
                        <span style={{color:'#2d3752', fontSize:'1rem'}}>+</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* グリッドから素材リストを自動生成（表示のみ） */}
              {(() => {
                const used: Record<string,number> = {};
                newShape.forEach(id => { if (id) used[id] = (used[id] ?? 0) + 1; });
                const entries = Object.entries(used);
                if (entries.length === 0) return null;
                return (
                  <div style={{fontSize:'0.68rem', color:'#8a92b2', background:'#161b26', borderRadius:4, padding:'4px 8px'}}>
                    素材: {entries.map(([id, n]) => `${ITEM_MASTER[id]?.name ?? id}×${n}`).join(' / ')}
                  </div>
                );
              })()}
            </div>
            <button disabled={saving || !newRecipe.id || !newRecipe.name || !newRecipe.outputItemId || newShape.every(c => !c)}
              onClick={async () => {
                if (!newRecipe.id || !newRecipe.name || !newRecipe.outputItemId || newShape.every(c => !c)) return;
                setSaving(true);
                try {
                  // shapeからinputsを自動生成
                  const used: Record<string,number> = {};
                  newShape.forEach(id => { if (id) used[id] = (used[id] ?? 0) + 1; });
                  const inputs = Object.entries(used).map(([itemId, amount]) => ({ itemId, amount }));
                  const recipe: CraftRecipe = {
                    id: newRecipe.id,
                    name: newRecipe.name,
                    description: newRecipe.description ?? '',
                    outputItemId: newRecipe.outputItemId,
                    outputAmount: newRecipe.outputAmount ?? 1,
                    inputs,
                    shape: newShape,
                    requiredCraftingLevel: newRecipe.requiredCraftingLevel ?? 1,
                    craftingExpGain: newRecipe.craftingExpGain ?? 10,
                  };
                  const updated = [...customRecipes.filter(r => r.id !== recipe.id), recipe];
                  const { setDoc, doc } = await import('firebase/firestore');
                  const { db } = await import('../../services/firebase');
                  await setDoc(doc(db, 'admin', 'craft_recipes'), { recipes: updated, deletedDefaults: deletedDefaultRecipeIds });
                  setCustomRecipes(updated);
                  setNewRecipe({ inputs: [], outputAmount: 1, requiredCraftingLevel: 1, craftingExpGain: 10 });
                  setNewShape(Array(9).fill(''));
                  setSelectedShapeItem('');
                  addNotification('success', `レシピ「${recipe.name}」を追加しました`);
                } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                setSaving(false);
              }}
              style={{width:'100%', padding:'8px', background: saving ? '#2d3752' : 'linear-gradient(135deg,#5b8dee,#3d6fd0)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.82rem'}}>
              {saving ? '保存中...' : '💾 レシピを追加・保存'}
            </button>
          </div>

          {/* カスタムレシピ一覧 */}
          <div style={{fontSize:'0.82rem', color:'#f0c060', fontWeight:700, marginBottom:8}}>📋 追加済みカスタムレシピ</div>
          {customRecipes.length === 0
            ? <div style={{color:'#4a5070', fontSize:'0.78rem', textAlign:'center', padding:12}}>カスタムレシピなし</div>
            : customRecipes.map(recipe => (
              <div key={recipe.id} style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, padding:'8px 10px', marginBottom:6}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom: recipe.shape ? 6 : 0}}>
                  <GameIcon id={ITEM_MASTER[recipe.outputItemId]?.icon ?? 'gem'} size={20} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.82rem', color:'#e8e6ff', fontWeight:700}}>{recipe.name}</div>
                    <div style={{fontSize:'0.65rem', color:'#8a92b2'}}>
                      → {ITEM_MASTER[recipe.outputItemId]?.name} ×{recipe.outputAmount} | Lv{recipe.requiredCraftingLevel}~
                    </div>
                  </div>
                  <button disabled={saving} onClick={async () => {
                    setSaving(true);
                    try {
                      const updated = customRecipes.filter(r => r.id !== recipe.id);
                      const { setDoc, doc } = await import('firebase/firestore');
                      const { db } = await import('../../services/firebase');
                      await setDoc(doc(db, 'admin', 'craft_recipes'), { recipes: updated, deletedDefaults: deletedDefaultRecipeIds });
                      setCustomRecipes(updated);
                      addNotification('success', `レシピ「${recipe.name}」を削除しました`);
                    } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                    setSaving(false);
                  }} style={{padding:'4px 8px', background:'rgba(224,85,85,0.15)', color:'#e05555', border:'1px solid #e05555', borderRadius:4, cursor:'pointer', fontSize:'0.7rem'}}>
                    削除
                  </button>
                </div>
                {/* shapeグリッドプレビュー */}
                {recipe.shape && recipe.shape.length === 9 && (
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3,24px)', gap:2, marginTop:4}}>
                    {recipe.shape.map((cellId, i) => {
                      const it = cellId ? ITEM_MASTER[cellId] : null;
                      return (
                        <div key={i} style={{width:24, height:24, background: cellId ? 'rgba(91,141,238,0.15)' : '#161b26', border:`1px solid ${cellId ? '#5b8dee' : '#2d3752'}`, borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center'}}>
                          {it ? <GameIcon id={it.icon ?? 'gem'} size={14} /> : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          }

          {/* ビルトインレシピ一覧（削除可能） */}
          <div style={{fontSize:'0.78rem', color:'#8a92b2', fontWeight:700, marginTop:14, marginBottom:6}}>📚 デフォルトレシピ</div>
          {CRAFT_RECIPES.filter(r => !deletedDefaultRecipeIds.includes(r.id)).map(recipe => (
            <div key={recipe.id} style={{background:'#161b26', border:'1px solid #2d3752', borderRadius:4, padding:'6px 8px', marginBottom:4}}>
              <div style={{display:'flex', alignItems:'center', gap:6}}>
                <GameIcon id={ITEM_MASTER[recipe.outputItemId]?.icon ?? 'gem'} size={16} />
                <span style={{fontSize:'0.75rem', color:'#8a92b2'}}>{recipe.name}</span>
                <span style={{marginLeft:'auto', fontSize:'0.65rem', color:'#4a5070'}}>Lv{recipe.requiredCraftingLevel}~</span>
                <button onClick={async () => {
                  const updated = [...deletedDefaultRecipeIds, recipe.id];
                  setDeletedDefaultRecipeIds(updated);
                  const { setDoc, doc } = await import('firebase/firestore');
                  const { db } = await import('../../services/firebase');
                  await setDoc(doc(db, 'admin', 'craft_recipes'), { recipes: customRecipes, deletedDefaults: updated });
                  addNotification('success', `デフォルトレシピ「${recipe.name}」を無効化しました`);
                }} style={{padding:'2px 7px', background:'#e05555', color:'#fff', border:'none', borderRadius:3, cursor:'pointer', fontSize:'0.65rem'}}>削除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== 取引レシピ管理 ===== */}
      {subTab === 'trade' && (
        <div>
          <p style={{fontSize:'0.8rem', color:'#8a92b2', marginBottom:12, lineHeight:1.6}}>
            市場の「取引」タブに表示されるレシピを管理します。複数素材→1アイテムの交換に対応しています。
          </p>
          {/* レシピ一覧 */}
          {tradeRecipes.map((recipe, idx) => (
            <div key={recipe.id} style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'10px 12px', marginBottom:8}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6}}>
                <span style={{fontWeight:700, fontSize:'0.88rem', color:'#e8e6ff'}}>{recipe.name}</span>
                <div style={{display:'flex', gap:4}}>
                  <button
                    onClick={() => setEditingTradeRecipe({ ...recipe, inputs: recipe.inputs.map(i => ({ ...i })) })}
                    style={{padding:'3px 10px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.75rem'}}>
                    編集
                  </button>
                  <button
                    onClick={async () => {
                      const updated = tradeRecipes.filter((_, i) => i !== idx);
                      setTradeRecipesState(updated);
                      await saveTradeRecipes(updated);
                      addNotification('success', 'レシピを削除しました');
                    }}
                    style={{padding:'3px 10px', background:'#e05555', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.75rem'}}>
                    削除
                  </button>
                </div>
              </div>
              <div style={{fontSize:'0.72rem', color:'#8a92b2', marginBottom:6}}>{recipe.description}</div>
              <div style={{fontSize:'0.72rem', color:'#4a5070'}}>
                必要素材: {recipe.inputs.map(inp => `${ITEM_MASTER[inp.itemId]?.name ?? inp.itemId} ×${inp.amount}`).join('、')}
              </div>
              <div style={{fontSize:'0.72rem', color:'#f0c060', marginTop:2}}>
                交換品: {ITEM_MASTER[recipe.outputItemId]?.name ?? recipe.outputItemId} ×{recipe.outputAmount}
              </div>
            </div>
          ))}

          {/* 新規追加 / 編集フォーム */}
          <div style={{background:'rgba(91,141,238,0.08)', border:'1px solid rgba(91,141,238,0.3)', borderRadius:8, padding:'12px 14px', marginTop:12}}>
            <div style={{fontWeight:700, fontSize:'0.88rem', color:'#5b8dee', marginBottom:10}}>
              {editingTradeRecipe?.id && tradeRecipes.find(r => r.id === editingTradeRecipe.id) ? '✏️ レシピを編集' : '➕ 新しいレシピを追加'}
            </div>
            {(() => {
              const recipe = editingTradeRecipe ?? { id: '', name: '', description: '', inputs: [], outputItemId: '', outputAmount: 1 };
              const setRecipe = setEditingTradeRecipe as React.Dispatch<React.SetStateAction<TradeRecipe | null>>;
              return (
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  <div style={{display:'flex', gap:6}}>
                    <input value={recipe.id} onChange={e => setRecipe(r => r ? { ...r, id: e.target.value } : { ...recipe, id: e.target.value })}
                      placeholder="ID (例: trade_sword)" style={inputStyle} />
                    <input value={recipe.name} onChange={e => setRecipe(r => r ? { ...r, name: e.target.value } : { ...recipe, name: e.target.value })}
                      placeholder="名前 (例: 鉄の剣と交換)" style={inputStyle} />
                  </div>
                  <input value={recipe.description} onChange={e => setRecipe(r => r ? { ...r, description: e.target.value } : { ...recipe, description: e.target.value })}
                    placeholder="説明文" style={inputStyle} />
                  {/* 必要素材リスト */}
                  <div>
                    <div style={{fontSize:'0.72rem', color:'#4a5070', marginBottom:4}}>必要素材</div>
                    {recipe.inputs.map((inp, i) => (
                      <div key={i} style={{display:'flex', gap:4, marginBottom:4, alignItems:'center'}}>
                        <select value={inp.itemId}
                          onChange={e => setRecipe(r => {
                            if (!r) return r;
                            const inputs = [...r.inputs];
                            inputs[i] = { ...inputs[i], itemId: e.target.value };
                            return { ...r, inputs };
                          })}
                          style={{...inputStyle, flex:2, background:'#1c2235', color:'#e8e6ff'}}>
                          <option value="">-- アイテムを選択 --</option>
                          {Object.values(ITEM_MASTER).map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                        <input type="number" min={1} value={inp.amount}
                          onChange={e => setRecipe(r => {
                            if (!r) return r;
                            const inputs = [...r.inputs];
                            inputs[i] = { ...inputs[i], amount: Math.max(1, Number(e.target.value)) };
                            return { ...r, inputs };
                          })}
                          style={{...inputStyle, width:60}} />
                        <button onClick={() => setRecipe(r => r ? { ...r, inputs: r.inputs.filter((_, j) => j !== i) } : r)}
                          style={{padding:'3px 8px', background:'#e05555', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.75rem'}}>✕</button>
                      </div>
                    ))}
                    <button
                      onClick={() => setRecipe(r => r ? { ...r, inputs: [...r.inputs, { itemId: '', amount: 1 }] } : { ...recipe, inputs: [...recipe.inputs, { itemId: '', amount: 1 }] })}
                      style={{padding:'4px 10px', background:'#2d3752', color:'#8a92b2', border:'1px solid #3d4762', borderRadius:4, cursor:'pointer', fontSize:'0.75rem', marginTop:2}}>
                      ＋ 素材を追加
                    </button>
                  </div>
                  {/* 交換品 */}
                  <div style={{display:'flex', gap:6, alignItems:'center'}}>
                    <select value={recipe.outputItemId}
                      onChange={e => setRecipe(r => r ? { ...r, outputItemId: e.target.value } : { ...recipe, outputItemId: e.target.value })}
                      style={{...inputStyle, flex:2, background:'#1c2235', color:'#f0c060'}}>
                      <option value="">-- 交換品を選択 --</option>
                      {Object.values(ITEM_MASTER).map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <input type="number" min={1} value={recipe.outputAmount}
                      onChange={e => setRecipe(r => r ? { ...r, outputAmount: Math.max(1, Number(e.target.value)) } : { ...recipe, outputAmount: Math.max(1, Number(e.target.value)) })}
                      style={{...inputStyle, width:60}} />
                    <span style={{fontSize:'0.7rem', color:'#4a5070'}}>個</span>
                  </div>
                  <div style={{display:'flex', gap:6}}>
                    <button
                      disabled={tradeRecipeSaving}
                      onClick={async () => {
                        if (!editingTradeRecipe) return;
                        if (!editingTradeRecipe.id || !editingTradeRecipe.name || !editingTradeRecipe.outputItemId) {
                          addNotification('error', 'ID・名前・交換品は必須です');
                          return;
                        }
                        setTradeRecipeSaving(true);
                        try {
                          const exists = tradeRecipes.findIndex(r => r.id === editingTradeRecipe.id);
                          const updated = exists >= 0
                            ? tradeRecipes.map((r, i) => i === exists ? editingTradeRecipe : r)
                            : [...tradeRecipes, editingTradeRecipe];
                          setTradeRecipesState(updated);
                          await saveTradeRecipes(updated);
                          addNotification('success', '取引レシピを保存しました');
                          setEditingTradeRecipe(null);
                        } catch { addNotification('error', '保存に失敗しました'); }
                        setTradeRecipeSaving(false);
                      }}
                      style={{flex:1, padding:'8px', background: tradeRecipeSaving ? '#2d3752' : 'linear-gradient(135deg,#4caf87,#2d8060)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem'}}>
                      {tradeRecipeSaving ? '保存中...' : '💾 保存'}
                    </button>
                    {editingTradeRecipe && (
                      <button onClick={() => setEditingTradeRecipe(null)}
                        style={{padding:'8px 16px', background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.85rem'}}>
                        キャンセル
                      </button>
                    )}
                    {!editingTradeRecipe && (
                      <button onClick={() => setEditingTradeRecipe({ id: '', name: '', description: '', inputs: [{ itemId: '', amount: 1 }], outputItemId: '', outputAmount: 1 })}
                        style={{padding:'8px 16px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.85rem'}}>
                        ✨ 新規作成
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===== ダンジョン管理 ===== */}
      {subTab === 'dungeon' && (() => {
        const allMonsters = Object.values(MONSTER_MASTER);
        const allDungeons = Object.values(DUNGEON_MASTER);
        const curMon = selectedMonsterId ? { ...MONSTER_MASTER[selectedMonsterId], ...monsterOverrides[selectedMonsterId] } : null;
        const curDungeon = selectedDungeonId ? DUNGEON_MASTER[selectedDungeonId] : null;
        const curDungeonAreas = selectedDungeonId
          ? (dungeonOverrides[selectedDungeonId]?.areas ?? curDungeon?.areas ?? [])
          : [];

        return (
          <div>
            <div style={{display:'flex', gap:6, marginBottom:12}}>
              {(['monsters','areas'] as const).map(t => (
                <button key={t} onClick={() => setDungeonAdminTab(t)}
                  style={{flex:1, padding:'7px', fontSize:'0.8rem',
                    background: dungeonAdminTab===t ? 'rgba(224,85,85,0.2)' : '#1c2235',
                    border:`1px solid ${dungeonAdminTab===t ? '#e05555' : '#2d3752'}`,
                    color: dungeonAdminTab===t ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer'}}>
                  {t === 'monsters' ? '👾 モンスター編集' : '🗺️ エリア出現MOB編集'}
                </button>
              ))}
            </div>

            {dungeonAdminTab === 'monsters' && (
              <div>
                <select value={selectedMonsterId} onChange={e => setSelectedMonsterId(e.target.value)}
                  style={{width:'100%', padding:'6px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', marginBottom:10, boxSizing:'border-box'}}>
                  <option value=''>-- モンスターを選択 --</option>
                  {allMonsters.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.id}){monsterOverrides[m.id] ? ' ✏️' : ''}</option>
                  ))}
                </select>
                {curMon && (() => {
                  const base = MONSTER_MASTER[selectedMonsterId];
                  const ov = monsterOverrides[selectedMonsterId] ?? {};
                  const setField = (field: keyof MonsterOverride, val: string | number) =>
                    setMonsterOverridesState(prev => ({
                      ...prev,
                      [selectedMonsterId]: { ...prev[selectedMonsterId], id: selectedMonsterId, [field]: val }
                    }));
                  const numField = (label: string, field: 'maxHp'|'attack'|'defense'|'baseExp'|'baseGold', color: string) => (
                    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                      <span style={{width:80, fontSize:'0.78rem', color}}>{label}</span>
                      <span style={{fontSize:'0.7rem', color:'#4a5070', width:40}}>元:{(base as any)[field]}</span>
                      <input type='number' min={0}
                        value={ov[field] ?? (base as any)[field]}
                        onChange={e => setField(field, Number(e.target.value))}
                        style={{flex:1, padding:'4px 6px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.8rem'}} />
                    </div>
                  );
                  return (
                    <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'12px 14px', marginBottom:8}}>
                      <div style={{fontWeight:700, fontSize:'0.88rem', color:'#e8e6ff', marginBottom:10, display:'flex', alignItems:'center', gap:8}}>
                        <GameIcon id={base.icon} size={22} />{base.name}
                      </div>
                      {numField('HP', 'maxHp', '#e05555')}
                      {numField('攻撃力', 'attack', '#f0a830')}
                      {numField('防御力', 'defense', '#5b8dee')}
                      {numField('経験値', 'baseExp', '#9b6df0')}
                      {numField('ゴールド', 'baseGold', '#f0c060')}
                      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
                        <span style={{width:80, fontSize:'0.78rem', color:'#8a92b2'}}>特殊技</span>
                        <input value={ov.specialAttack ?? base.specialAttack ?? ''}
                          onChange={e => setField('specialAttack', e.target.value)}
                          placeholder='特殊攻撃名（空欄=なし）'
                          style={{flex:1, padding:'4px 6px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.8rem'}} />
                      </div>
                      {/* ドロップ編集 */}
                      <div style={{marginBottom:8}}>
                        <div style={{fontSize:'0.72rem', color:'#4a5070', marginBottom:4}}>ドロップアイテム</div>
                        {(ov.drops ?? base.drops).map((d, i) => (
                          <div key={i} style={{display:'flex', gap:4, alignItems:'center', marginBottom:4, flexWrap:'wrap'}}>
                            <input value={d.itemId} onChange={e => {
                              const drops = [...(ov.drops ?? base.drops)];
                              drops[i] = { ...drops[i], itemId: e.target.value };
                              setMonsterOverridesState(prev => ({ ...prev, [selectedMonsterId]: { ...prev[selectedMonsterId], id: selectedMonsterId, drops } }));
                            }} placeholder='アイテムID' style={{flex:2, padding:'3px 5px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.72rem'}} />
                            <span style={{fontSize:'0.65rem', color:'#8a92b2', minWidth:40}}>{ITEM_MASTER[d.itemId]?.name ?? ''}</span>
                            <span style={{fontSize:'0.65rem', color:'#4a5070'}}>確率</span>
                            <input type='number' min={0} max={1} step={0.01} value={d.baseRate} onChange={e => {
                              const drops = [...(ov.drops ?? base.drops)];
                              drops[i] = { ...drops[i], baseRate: Math.min(1, Math.max(0, Number(e.target.value))) };
                              setMonsterOverridesState(prev => ({ ...prev, [selectedMonsterId]: { ...prev[selectedMonsterId], id: selectedMonsterId, drops } }));
                            }} style={{width:50, padding:'3px 4px', background:'#161b26', border:'1px solid #2d3752', color:'#4caf87', borderRadius:4, fontSize:'0.72rem'}} />
                            <span style={{fontSize:'0.65rem', color:'#4a5070'}}>個数</span>
                            <input type='number' min={1} value={d.minAmount} onChange={e => {
                              const drops = [...(ov.drops ?? base.drops)];
                              drops[i] = { ...drops[i], minAmount: Number(e.target.value) };
                              setMonsterOverridesState(prev => ({ ...prev, [selectedMonsterId]: { ...prev[selectedMonsterId], id: selectedMonsterId, drops } }));
                            }} style={{width:40, padding:'3px 4px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.72rem'}} />
                            <span style={{fontSize:'0.65rem', color:'#4a5070'}}>~</span>
                            <input type='number' min={1} value={d.maxAmount} onChange={e => {
                              const drops = [...(ov.drops ?? base.drops)];
                              drops[i] = { ...drops[i], maxAmount: Number(e.target.value) };
                              setMonsterOverridesState(prev => ({ ...prev, [selectedMonsterId]: { ...prev[selectedMonsterId], id: selectedMonsterId, drops } }));
                            }} style={{width:40, padding:'3px 4px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.72rem'}} />
                            <button onClick={() => {
                              const drops = (ov.drops ?? base.drops).filter((_, j) => j !== i);
                              setMonsterOverridesState(prev => ({ ...prev, [selectedMonsterId]: { ...prev[selectedMonsterId], id: selectedMonsterId, drops } }));
                            }} style={{padding:'2px 6px', background:'#e05555', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.7rem'}}>✕</button>
                          </div>
                        ))}
                        <button onClick={() => {
                          const drops = [...(ov.drops ?? base.drops), { itemId: '', baseRate: 1.0, minAmount: 1, maxAmount: 1 }];
                          setMonsterOverridesState(prev => ({ ...prev, [selectedMonsterId]: { ...prev[selectedMonsterId], id: selectedMonsterId, drops } }));
                        }} style={{padding:'3px 10px', background:'#2d3752', color:'#8a92b2', border:'1px solid #3d4762', borderRadius:4, cursor:'pointer', fontSize:'0.72rem', marginTop:2}}>
                          ＋ ドロップ追加
                        </button>
                      </div>
                      <div style={{display:'flex', gap:6, marginTop:4}}>
                        <button disabled={dungeonSaving} onClick={async () => {
                          setDungeonSaving(true);
                          try {
                            await setMonsterOverrides(monsterOverrides);
                            addNotification('success', `${base.name}のデータを保存しました`);
                          } catch { addNotification('error', '保存に失敗しました'); }
                          setDungeonSaving(false);
                        }} style={{flex:1, padding:'8px', background: dungeonSaving ? '#2d3752' : 'linear-gradient(135deg,#4caf87,#2d8060)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem'}}>
                          {dungeonSaving ? '保存中...' : '💾 保存'}
                        </button>
                        {monsterOverrides[selectedMonsterId] && (
                          <button onClick={async () => {
                            const updated = { ...monsterOverrides };
                            delete updated[selectedMonsterId];
                            setMonsterOverridesState(updated);
                            await setMonsterOverrides(updated);
                            addNotification('success', 'オーバーライドをリセットしました');
                          }} style={{padding:'8px 12px', background:'#e05555', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.82rem'}}>
                            🔄 リセット
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {dungeonAdminTab === 'areas' && (
              <div>
                <select value={selectedDungeonId} onChange={e => setSelectedDungeonId(e.target.value)}
                  style={{width:'100%', padding:'6px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', marginBottom:10, boxSizing:'border-box'}}>
                  <option value=''>-- ダンジョンを選択 --</option>
                  {allDungeons.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.id}){dungeonOverrides[d.id] ? ' ✏️' : ''}</option>
                  ))}
                </select>
                {selectedDungeonId && curDungeon && (
                  <div>
                    {curDungeonAreas.map((area, aIdx) => (
                      <div key={aIdx} style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, padding:'10px 12px', marginBottom:8}}>
                        <div style={{fontWeight:700, fontSize:'0.85rem', color:'#e8e6ff', marginBottom:6}}>{aIdx+1}: {area.name}</div>
                        <div style={{fontSize:'0.72rem', color:'#4a5070', marginBottom:6}}>出現MOB</div>
                        {area.monsters.map((mob, mIdx) => (
                          <div key={mIdx} style={{display:'flex', gap:4, alignItems:'center', marginBottom:4}}>
                            <select value={mob.monsterId}
                              onChange={e => {
                                const areas = curDungeonAreas.map((a, ai) => ai !== aIdx ? a : {
                                  ...a, monsters: a.monsters.map((m, mi) => mi !== mIdx ? m : { ...m, monsterId: e.target.value })
                                });
                                setDungeonOverridesState(prev => ({ ...prev, [selectedDungeonId]: { id: selectedDungeonId, areas } }));
                              }}
                              style={{flex:2, padding:'3px 5px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.72rem'}}>
                              {allMonsters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <span style={{fontSize:'0.65rem', color:'#4a5070'}}>数</span>
                            <input type='number' min={1} max={20} value={mob.count}
                              onChange={e => {
                                const areas = curDungeonAreas.map((a, ai) => ai !== aIdx ? a : {
                                  ...a, monsters: a.monsters.map((m, mi) => mi !== mIdx ? m : { ...m, count: Math.max(1, Number(e.target.value)) })
                                });
                                setDungeonOverridesState(prev => ({ ...prev, [selectedDungeonId]: { id: selectedDungeonId, areas } }));
                              }}
                              style={{width:44, padding:'3px 4px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.72rem'}} />
                            <label style={{fontSize:'0.65rem', color:'#e05555', display:'flex', alignItems:'center', gap:2}}>
                              <input type='checkbox' checked={!!mob.isBoss} onChange={e => {
                                const areas = curDungeonAreas.map((a, ai) => ai !== aIdx ? a : {
                                  ...a, monsters: a.monsters.map((m, mi) => mi !== mIdx ? m : { ...m, isBoss: e.target.checked })
                                });
                                setDungeonOverridesState(prev => ({ ...prev, [selectedDungeonId]: { id: selectedDungeonId, areas } }));
                              }} />ボス
                            </label>
                            <label style={{fontSize:'0.65rem', color:'#f0a830', display:'flex', alignItems:'center', gap:2}}>
                              <input type='checkbox' checked={!!mob.isMidBoss} onChange={e => {
                                const areas = curDungeonAreas.map((a, ai) => ai !== aIdx ? a : {
                                  ...a, monsters: a.monsters.map((m, mi) => mi !== mIdx ? m : { ...m, isMidBoss: e.target.checked })
                                });
                                setDungeonOverridesState(prev => ({ ...prev, [selectedDungeonId]: { id: selectedDungeonId, areas } }));
                              }} />中ボス
                            </label>
                            <button onClick={() => {
                              const areas = curDungeonAreas.map((a, ai) => ai !== aIdx ? a : {
                                ...a, monsters: a.monsters.filter((_, mi) => mi !== mIdx)
                              });
                              setDungeonOverridesState(prev => ({ ...prev, [selectedDungeonId]: { id: selectedDungeonId, areas } }));
                            }} style={{padding:'2px 6px', background:'#e05555', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.7rem'}}>✕</button>
                          </div>
                        ))}
                        <button onClick={() => {
                          const defaultMon = allMonsters[0]?.id ?? '';
                          const areas = curDungeonAreas.map((a, ai) => ai !== aIdx ? a : {
                            ...a, monsters: [...a.monsters, { monsterId: defaultMon, count: 1 }]
                          });
                          setDungeonOverridesState(prev => ({ ...prev, [selectedDungeonId]: { id: selectedDungeonId, areas } }));
                        }} style={{padding:'3px 10px', background:'#2d3752', color:'#8a92b2', border:'1px solid #3d4762', borderRadius:4, cursor:'pointer', fontSize:'0.72rem', marginTop:2}}>
                          ＋ MOB追加
                        </button>
                      </div>
                    ))}
                    <div style={{display:'flex', gap:6, marginTop:4}}>
                      <button disabled={dungeonSaving} onClick={async () => {
                        setDungeonSaving(true);
                        try {
                          await setDungeonOverrides(dungeonOverrides);
                          addNotification('success', `${curDungeon.name}のエリアを保存しました`);
                        } catch { addNotification('error', '保存に失敗しました'); }
                        setDungeonSaving(false);
                      }} style={{flex:1, padding:'8px', background: dungeonSaving ? '#2d3752' : 'linear-gradient(135deg,#4caf87,#2d8060)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem'}}>
                        {dungeonSaving ? '保存中...' : '💾 エリアを保存'}
                      </button>
                      {dungeonOverrides[selectedDungeonId] && (
                        <button onClick={async () => {
                          const updated = { ...dungeonOverrides };
                          delete updated[selectedDungeonId];
                          setDungeonOverridesState(updated);
                          await setDungeonOverrides(updated);
                          addNotification('success', 'エリアをリセットしました');
                        }} style={{padding:'8px 12px', background:'#e05555', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.82rem'}}>
                          🔄 リセット
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ===== 提案管理 ===== */}
      {subTab === 'proposals' && (
        <div>
          <div style={{fontSize:'0.82rem', color:'#8a92b2', marginBottom:12}}>
            プレイヤーからの機能提案一覧。承認すると提案チケットが付与されます。
          </div>
          {proposals.length === 0 && (
            <div style={{color:'#4a5070', fontSize:'0.82rem', textAlign:'center', padding:20}}>提案はまだありません</div>
          )}
          {proposals.map(p => {
            const statusColor = p.status === 'approved' ? '#4caf87' : p.status === 'rejected' ? '#e05555' : '#f0c060';
            const statusLabel = p.status === 'approved' ? '✅ 承認済' : p.status === 'rejected' ? '❌ 却下' : '⏳ 未処理';
            return (
              <div key={p.id} style={{background:'#1c2235', border:`1px solid ${statusColor}40`, borderRadius:8, padding:'10px 12px', marginBottom:8}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                  <span style={{fontWeight:700, color:'#e8e6ff', fontSize:'0.88rem', flex:1}}>{p.title}</span>
                  <span style={{fontSize:'0.72rem', color: statusColor, fontWeight:700}}>{statusLabel}</span>
                </div>
                <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:4}}>by {p.displayName} | {new Date(p.createdAt).toLocaleString('ja-JP')}</div>
                <div style={{fontSize:'0.78rem', color:'#c0c8e0', marginBottom:8, lineHeight:1.6, whiteSpace:'pre-wrap'}}>{p.body}</div>
                {p.status === 'pending' && (
                  <div style={{display:'flex', gap:6}}>
                    <button disabled={!!proposalProcessing}
                      onClick={async () => {
                        setProposalProcessing(p.id);
                        try {
                          await updateProposalStatus(p.id, 'approved');
                          // 提案チケット付与: Firestoreから最新データを直接取得して付与
                          const { doc: fsDoc, getDoc, setDoc } = await import('firebase/firestore');
                          const { db: fsDb } = await import('../../services/firebase');
                          const playerRef = fsDoc(fsDb, 'players', p.uid);
                          const playerSnap = await getDoc(playerRef);
                          if (playerSnap.exists()) {
                            const data = playerSnap.data();
                            const inv = { ...(data.inventory ?? {}), vote_ticket: ((data.inventory?.vote_ticket) ?? 0) + 1 };
                            await setDoc(playerRef, { ...data, inventory: inv, adminOverrideAt: Date.now() });
                          } else {
                            // ドキュメントが存在しない場合もローカルのplayersから試みる
                            const target = players.find(pl => pl.id === p.uid);
                            if (target) {
                              const inv = { ...(target.inventory ?? {}), vote_ticket: (target.inventory?.vote_ticket ?? 0) + 1 };
                              await updatePlayerAdmin(p.uid, { inventory: inv });
                            }
                          }
                          addNotification('success', `提案を承認し提案チケットを付与しました`);
                        } catch { addNotification('error', '処理に失敗しました'); }
                        setProposalProcessing(null);
                      }}
                      style={{padding:'5px 12px', background:'rgba(76,175,135,0.2)', color:'#4caf87', border:'1px solid #4caf87', borderRadius:4, cursor:'pointer', fontWeight:700, fontSize:'0.75rem'}}>
                      ✅ 承認（チケット付与）
                    </button>
                    <button disabled={!!proposalProcessing}
                      onClick={async () => {
                        setProposalProcessing(p.id);
                        try {
                          await updateProposalStatus(p.id, 'rejected');
                          addNotification('success', '提案を却下しました');
                        } catch { addNotification('error', '処理に失敗しました'); }
                        setProposalProcessing(null);
                      }}
                      style={{padding:'5px 12px', background:'rgba(224,85,85,0.15)', color:'#e05555', border:'1px solid #e05555', borderRadius:4, cursor:'pointer', fontWeight:700, fontSize:'0.75rem'}}>
                      ❌ 却下
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== システム設定 ===== */}
      {subTab === 'system' && (
        <div>
      {/* ジャックポット積立率 */}
          <div style={{marginBottom:18, background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:14}}>
            <div style={{fontSize:'0.9rem', fontWeight:700, color:'#f0c060', marginBottom:10}}>🌟 ジャックポット積立率</div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
              <input
                type="number" step="0.01" min="0" max="1"
                value={jackpotRate}
                onChange={e => setJackpotRateState(Number(e.target.value))}
                style={{width:90, padding:'6px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.9rem'}}
              />
              <span style={{color:'#8a92b2', fontSize:'0.85rem'}}>（平常時: 0.20 = 20%）</span>
            </div>
            <button onClick={async () => {
              setSaving(true);
              try {
                await setJackpotRate(jackpotRate);
                addNotification('success', `ジャックポット率を${(jackpotRate*100).toFixed(0)}%に設定しました`);
              } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
              setSaving(false);
            }} disabled={saving}
              style={{padding:'8px 16px', background:'linear-gradient(135deg,#f0a830,#c08020)', color:'#000', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem'}}>
              💾 保存
            </button>
          </div>

          {/* ジャックポットプール直接編集 */}
          <div style={{marginBottom:18, background:'#161b26', border:'1px solid #f0c060', borderRadius:8, padding:14}}>
            <div style={{fontSize:'0.9rem', fontWeight:700, color:'#f0c060', marginBottom:4}}>💰 ジャックポットプール残高</div>
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:10}}>現在のプール金額を直接変更できます（不正対策・イベント用）</div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
              <span style={{fontSize:'1.5rem', color:'#f0c060', fontWeight:900}}>{jackpotPool.toLocaleString()}G</span>
              <span style={{fontSize:'0.75rem', color:'#4a5070'}}>現在値</span>
            </div>
            <div style={{display:'flex', gap:8, marginBottom:8}}>
              <input
                type="number" min="0" step="1000"
                value={editJackpotPool}
                onChange={e => setEditJackpotPool(e.target.value)}
                placeholder="新しい金額を入力"
                style={{flex:1, padding:'6px 8px', background:'#1c2235', border:'1px solid #f0c060', color:'#e8e6ff', borderRadius:4, fontSize:'0.9rem'}}
              />
              <span style={{color:'#8a92b2', lineHeight:'34px', fontSize:'0.85rem'}}>G</span>
            </div>
            <div style={{display:'flex', gap:6}}>
              <button onClick={async () => {
                const val = Number(editJackpotPool);
                if (isNaN(val) || val < 0) { addNotification('error', '正しい金額を入力してください'); return; }
                setSaving(true);
                try {
                  const { setDoc, doc } = await import('firebase/firestore');
                  const { db } = await import('../../services/firebase');
                  await setDoc(doc(db, 'shared', 'jackpot'), { pool: val });
                  setJackpotPool(val);
                  addNotification('success', `ジャックポットプールを ${val.toLocaleString()}G に設定しました`);
                  setEditJackpotPool('');
                } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                setSaving(false);
              }} disabled={saving || editJackpotPool === ''}
                style={{flex:1, padding:'8px', background: editJackpotPool ? 'linear-gradient(135deg,#f0c060,#c08020)' : '#2d3752', color: editJackpotPool ? '#000' : '#4a5070', border:'none', borderRadius:6, cursor: editJackpotPool ? 'pointer' : 'not-allowed', fontWeight:700, fontSize:'0.82rem'}}>
                💾 プールを設定
              </button>
              <button onClick={async () => {
                setSaving(true);
                try {
                  const { setDoc, doc } = await import('firebase/firestore');
                  const { db } = await import('../../services/firebase');
                  await setDoc(doc(db, 'shared', 'jackpot'), { pool: 0 });
                  setJackpotPool(0);
                  addNotification('success', 'ジャックポットプールをリセットしました');
                } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                setSaving(false);
              }} disabled={saving}
                style={{padding:'8px 12px', background:'rgba(224,85,85,0.2)', color:'#e05555', border:'1px solid #e05555', borderRadius:6, cursor:'pointer', fontSize:'0.78rem'}}>
                🗑️ リセット
              </button>
            </div>
          </div>

          {/* タブ別メンテナンス */}
          <div style={{marginBottom:18, background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:14}}>
            <div style={{fontSize:'0.9rem', fontWeight:700, color:'#e05555', marginBottom:4}}>🔧 タブ別メンテナンス</div>
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:12}}>各タブを個別にメンテナンス状態にできます。管理者は通過できます。</div>
            {([
              { id:'gathering', label:'⛏️ 採取' },
              { id:'fishing',   label:'🎣 釣り' },
              { id:'crafting',  label:'🔨 製作' },
              { id:'market',    label:'🏪 市場' },
              { id:'dungeon',   label:'⚔️ ダンジョン' },
              { id:'gamble',    label:'🎰 ギャンブル' },
              { id:'online',    label:'🌐 オンライン' },
              { id:'navi',      label:'🧭 冒険ナビ' },
            ] as { id: MaintainableTab; label: string }[]).map(({ id, label }) => {
              const entry = tabMaintConfig[id];
              const isActive = entry?.active ?? false;
              return (
                <div key={id} style={{marginBottom:10, background:'#1c2235', border:`1px solid ${isActive ? '#e05555' : '#2d3752'}`, borderRadius:6, padding:10}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom: isActive ? 0 : 8}}>
                    <span style={{flex:1, fontSize:'0.85rem', fontWeight:700, color: isActive ? '#e05555' : '#e8e6ff'}}>{label}</span>
                    {isActive && <span style={{fontSize:'0.72rem', background:'rgba(224,85,85,0.2)', color:'#e05555', border:'1px solid #e05555', borderRadius:4, padding:'2px 6px'}}>稼働中</span>}
                    <button onClick={async () => {
                      if (isActive) {
                        // 停止
                        setSaving(true);
                        try {
                          await setTabMaintenanceEntry(id, null);
                          setTabMaintConfig(p => { const n = {...p}; delete n[id]; return n; });
                          addNotification('success', `${label} メンテナンスを終了しました`);
                        } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                        setSaving(false);
                      } else {
                        // 開始
                        const msg = tabMaintMessages[id] ?? '';
                        const est = Number(tabMaintEstimates[id] ?? 0);
                        setSaving(true);
                        try {
                          const newEntry = { active: true, message: msg, startedAt: Date.now(), estimatedMinutes: est || 0 };
                          await setTabMaintenanceEntry(id, newEntry);
                          setTabMaintConfig(p => ({ ...p, [id]: newEntry }));
                          addNotification('success', `${label} メンテナンスを開始しました`);
                        } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                        setSaving(false);
                      }
                    }} disabled={saving}
                      style={{padding:'5px 12px', background: isActive ? 'rgba(224,85,85,0.15)' : 'linear-gradient(135deg,#e05555,#b03030)', color: isActive ? '#e05555' : '#fff', border:`1px solid ${isActive ? '#e05555' : 'transparent'}`, borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:'0.78rem'}}>
                      {isActive ? '▶ 終了' : '⏸ 開始'}
                    </button>
                  </div>
                  {!isActive && (
                    <div style={{display:'flex', gap:6, flexWrap:'wrap' as const}}>
                      <input
                        type="text"
                        value={tabMaintMessages[id] ?? ''}
                        onChange={e => setTabMaintMessages(p => ({...p, [id]: e.target.value}))}
                        placeholder="メッセージ（任意）"
                        style={{flex:'1 1 160px', padding:'5px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.8rem'}}
                      />
                      <input
                        type="number" min="0" step="5"
                        value={tabMaintEstimates[id] ?? ''}
                        onChange={e => setTabMaintEstimates(p => ({...p, [id]: e.target.value}))}
                        placeholder="予定(分)"
                        style={{width:80, padding:'5px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.8rem'}}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 釣りキャスト時間 */}
          <div style={{marginBottom:18, background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:14}}>
            <div style={{fontSize:'0.9rem', fontWeight:700, color:'#0ea5e9', marginBottom:4}}>🎣 釣りキャスト時間（全スポット共通）</div>
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:10}}>空白にするとスポットごとのデフォルト値に戻ります（4000〜10000ms）</div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
              <input
                type="number" min="500" max="30000" step="100"
                value={fishingCastTimeMs}
                onChange={e => setFishingCastTimeMsState(e.target.value)}
                placeholder="例: 3000"
                style={{width:120, padding:'6px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.9rem'}}
              />
              <span style={{color:'#8a92b2', fontSize:'0.85rem'}}>ms</span>
              {fishingCastTimeMs && <span style={{color:'#0ea5e9', fontSize:'0.82rem'}}>= {(Number(fishingCastTimeMs)/1000).toFixed(1)}秒</span>}
            </div>
            <div style={{display:'flex', gap:6}}>
              <button onClick={async () => {
                setSaving(true);
                try {
                  const ms = fishingCastTimeMs === '' ? null : Number(fishingCastTimeMs);
                  if (ms !== null && (isNaN(ms) || ms < 500)) { addNotification('error', '500ms以上の値を入力してください'); setSaving(false); return; }
                  await setFishingCastTime(ms);
                  addNotification('success', ms === null ? 'キャスト時間をデフォルトに戻しました' : `キャスト時間を ${ms}ms (${(ms/1000).toFixed(1)}秒) に設定しました`);
                } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                setSaving(false);
              }} disabled={saving}
                style={{padding:'8px 16px', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem'}}>
                💾 保存
              </button>
              <button onClick={async () => {
                setSaving(true);
                try {
                  await setFishingCastTime(null);
                  setFishingCastTimeMsState('');
                  addNotification('success', 'キャスト時間をデフォルトに戻しました');
                } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                setSaving(false);
              }} disabled={saving}
                style={{padding:'8px 12px', background:'rgba(224,85,85,0.2)', color:'#e05555', border:'1px solid #e05555', borderRadius:6, cursor:'pointer', fontSize:'0.78rem'}}>
                🔄 デフォルトに戻す
              </button>
            </div>
          </div>

          {/* メンテナンスモード */}
          <div style={{background:'#161b26', border:`1px solid ${maintenanceActive ? '#e05555' : '#2d3752'}`, borderRadius:8, padding:14}}>
            <div style={{fontSize:'0.9rem', fontWeight:700, color: maintenanceActive ? '#e05555' : '#f0c060', marginBottom:10}}>
              🔧 メンテナンスモード {maintenanceActive ? '【稼働中】' : '【オフ】'}
            </div>
            {!maintenanceActive ? (
              <div>
                <div style={{fontSize:'0.78rem', color:'#8a92b2', marginBottom:6}}>メンテナンス予定時間（分）</div>
                <input
                  type="number" min="1" max="1440"
                  value={maintenanceMinutes}
                  onChange={e => setMaintenanceMinutes(Number(e.target.value))}
                  style={{width:100, padding:'6px 8px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:4, fontSize:'0.9rem', marginBottom:10}}
                />
                <div style={{fontSize:'0.78rem', color:'#8a92b2', marginBottom:4, marginTop:4}}>メンテナンス概要（プレイヤーに表示）</div>
                <textarea
                  value={maintenanceMessage}
                  onChange={e => setMaintenanceMessage(e.target.value.slice(0, 200))}
                  rows={3}
                  placeholder="例: サーバーメンテナンスのため一時停止中です。ご不便をおかけします。"
                  style={{width:'100%', padding:'8px 10px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box', resize:'vertical', marginBottom:10}}
                />
                <div style={{fontSize:'0.72rem', color:'#4a5070', textAlign:'right', marginBottom:8}}>{maintenanceMessage.length}/200</div>
                <button onClick={async () => {
                  setSaving(true);
                  try {
                    await setMaintenanceStatus({ active: true, startedAt: Date.now(), estimatedMinutes: maintenanceMinutes, message: maintenanceMessage });
                    setMaintenanceActive(true);
                    addNotification('success', 'メンテナンスモードを開始しました');
                  } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                  setSaving(false);
                }} disabled={saving}
                  style={{display:'block', width:'100%', padding:'10px', background:'linear-gradient(135deg,#e05555,#c03030)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.9rem'}}>
                  🔧 メンテナンス開始
                </button>
              </div>
            ) : (
              <button onClick={async () => {
                setSaving(true);
                try {
                  await setMaintenanceStatus({ active: false, startedAt: 0, estimatedMinutes: 0, message: '' });
                  setMaintenanceActive(false);
                  setMaintenanceMessage('');
                  addNotification('success', 'メンテナンスモードを終了しました');
                } catch (e: any) { addNotification('error', `失敗: ${e?.message ?? e}`); }
                setSaving(false);
              }} disabled={saving}
                style={{width:'100%', padding:'10px', background:'linear-gradient(135deg,#4caf87,#2d8060)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.9rem'}}>
                ✅ メンテナンス終了（平常運転に戻す）
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
