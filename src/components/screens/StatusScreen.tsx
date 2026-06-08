// src/components/screens/StatusScreen.tsx
import { useState } from 'react';
import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER, SKILL_MASTER, EXP_TABLE, SKILL_EXP_TABLE, DUNGEON_MASTER } from '../../data/masters';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { EquipmentSlots, PlayerData } from '../../types/game';
import { defaultEquipmentSlots } from '../../types/game';

// ============================================================
// 装備・ホットバーパネル
// ============================================================
const ARMOR_SLOTS = [
  { key: 'helmet',     label: '🪖 ヘルメット' },
  { key: 'chestplate', label: '🛡️ チェストプレート' },
  { key: 'leggings',   label: '👖 レギンス' },
  { key: 'boots',      label: '👟 ブーツ' },
  { key: 'offhand',    label: '✋ オフハンド' },
] as const;

function EquipmentPanel() {
  const player = useGameStore(s => s.player);
  const addNotification = useGameStore(s => s.addNotification);
  const [equipment, setEquipment] = useState<EquipmentSlots>(() => player?.equipment ?? defaultEquipmentSlots());
  const [selectingSlot, setSelectingSlot] = useState<{ slot: string; idx?: number } | null>(null);

  if (!player) return null;

  const eligibleFor = (slot: string) => {
    const isArmor = ARMOR_SLOTS.some(s => s.key === slot);
    return Object.entries(player.inventory)
      .filter(([id, qty]) => (qty as number) > 0 && ITEM_MASTER[id] && (isArmor
        ? (ITEM_MASTER[id].category === 'armor' && (!ITEM_MASTER[id].armorSlot || ITEM_MASTER[id].armorSlot === slot))
          || ITEM_MASTER[id].category === 'weapon'
        : ['consumable','potion','food','weapon','armor'].includes(ITEM_MASTER[id].category)))
      .map(([id]) => id);
  };

  const setSlot = (slot: string, idx: number | undefined, itemId: string | null) => {
    setEquipment(prev => {
      const next = { ...prev, hotbar: [...prev.hotbar] };
      if (slot === 'hotbar' && idx !== undefined) next.hotbar[idx] = itemId;
      else (next as any)[slot] = itemId;
      return next;
    });
    // playerのequipmentに保存
    useGameStore.setState(s => ({
      player: s.player ? { ...s.player, equipment: (() => {
        const next = { ...(s.player.equipment ?? defaultEquipmentSlots()), hotbar: [...(s.player.equipment?.hotbar ?? Array(9).fill(null))] };
        if (slot === 'hotbar' && idx !== undefined) next.hotbar[idx] = itemId;
        else (next as any)[slot] = itemId;
        return next;
      })() } : s.player
    }));
    addNotification('info', itemId ? `${ITEM_MASTER[itemId]?.name} をセットしました` : 'スロットを空にしました');
  };

  return (
    <div>
      <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:8}}>
        ホットバーや防具枠にアイテムをセットしておくと、ダンジョンで素早く使用できます。
      </div>

      {/* ホットバー */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:'0.82rem', fontWeight:700, color:'#5b8dee', marginBottom:6}}>🎒 ホットバー（9スロット）</div>
        <div style={{display:'flex', gap:5, flexWrap:'wrap'}}>
          {equipment.hotbar.map((itemId, i) => {
            const item = itemId ? ITEM_MASTER[itemId] : null;
            const qty = itemId ? (player.inventory[itemId] ?? 0) : 0;
            return (
              <button key={i} onClick={() => setSelectingSlot({ slot:'hotbar', idx:i })}
                title={item?.name ?? `スロット${i+1}`}
                style={{
                  width:44, height:44, background: item ? 'rgba(91,141,238,0.15)' : '#161b26',
                  border:`1px solid ${item ? '#5b8dee' : '#2d3752'}`, borderRadius:8, cursor:'pointer',
                  position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                }}>
                {item
                  ? <><GameIcon id={item.icon} size={20} /><span style={{fontSize:'0.55rem', color:'#f0c060'}}>×{qty}</span></>
                  : <span style={{fontSize:'0.7rem', color:'#4a5070'}}>{i+1}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 防具枠 */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:'0.82rem', fontWeight:700, color:'#4caf87', marginBottom:6}}>🛡️ 防具・オフハンド枠</div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {ARMOR_SLOTS.map(({ key, label }) => {
            const itemId = equipment[key as keyof EquipmentSlots] as string | null;
            const item = itemId ? ITEM_MASTER[itemId] : null;
            return (
              <button key={key} onClick={() => setSelectingSlot({ slot: key })}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                  background: item ? 'rgba(76,175,135,0.12)' : '#161b26',
                  border:`1px solid ${item ? '#4caf87' : '#2d3752'}`, borderRadius:8, cursor:'pointer', color:'#e8e6ff', textAlign:'left',
                }}>
                <span style={{width:32, textAlign:'center', fontSize:'1.4rem', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  {item ? <GameIcon id={item.icon} size={28} /> : <span style={{fontSize:'1.2rem'}}>{label.split(' ')[0]}</span>}
                </span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.75rem', color:'#8a92b2'}}>{label.split(' ').slice(1).join(' ')}</div>
                  {item
                    ? <div style={{fontSize:'0.85rem', fontWeight:700, color:'#4caf87'}}><GameIcon id={item.icon} size={14} style={{marginRight:4}} />{item.name}</div>
                    : <div style={{fontSize:'0.82rem', color:'#4a5070'}}>未装備（クリックでセット）</div>}
                </div>
                {item && (
                  <button onClick={e => { e.stopPropagation(); setSlot(key, undefined, null); }}
                    style={{padding:'3px 8px', background:'rgba(224,85,85,0.15)', color:'#e05555', border:'1px solid #e05555', borderRadius:4, cursor:'pointer', fontSize:'0.72rem'}}>
                    外す
                  </button>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* アイテム選択モーダル */}
      {selectingSlot && (
        <div style={{position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#1c2235', border:'2px solid #5b8dee', borderRadius:12, padding:16, width:'90%', maxWidth:340, maxHeight:'70vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
              <span style={{fontWeight:700, color:'#5b8dee', fontSize:'0.9rem'}}>
                {selectingSlot.slot === 'hotbar' ? `ホットバー ${(selectingSlot.idx??0)+1}` : selectingSlot.slot} にセット
              </span>
              <button onClick={() => setSelectingSlot(null)} style={{background:'none', border:'none', color:'#8a92b2', cursor:'pointer', fontSize:'1.2rem'}}>×</button>
            </div>
            <button onClick={() => { setSlot(selectingSlot.slot, selectingSlot.idx, null); setSelectingSlot(null); }}
              style={{width:'100%', padding:'7px', background:'rgba(224,85,85,0.1)', color:'#e05555', border:'1px solid #e05555', borderRadius:6, cursor:'pointer', fontSize:'0.8rem', marginBottom:8}}>
              🗑️ スロットを空にする
            </button>
            {eligibleFor(selectingSlot.slot).length === 0
              ? <div style={{color:'#4a5070', textAlign:'center', padding:16}}>セットできるアイテムなし</div>
              : eligibleFor(selectingSlot.slot).map(id => {
                  const item = ITEM_MASTER[id];
                  const qty = player.inventory[id];
                  return (
                    <button key={id} onClick={() => { setSlot(selectingSlot.slot, selectingSlot.idx, id); setSelectingSlot(null); }}
                      style={{width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'#161b26', border:'1px solid #2d3752', borderRadius:6, cursor:'pointer', color:'#e8e6ff', marginBottom:4, textAlign:'left'}}>
                      <GameIcon id={item.icon} size={20} />
                      <div style={{flex:1}}>
                        <div style={{fontSize:'0.85rem', fontWeight:700}}>{item.name}</div>
                        <div style={{fontSize:'0.68rem', color:'#8a92b2'}}>{item.description}</div>
                      </div>
                      <span style={{fontSize:'0.75rem', color:'#f0c060'}}>×{qty}</span>
                    </button>
                  );
                })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 製作パネル
// ============================================================

// ============================================================
// 名前変更パネル
// ============================================================
function RenamePanel({ onClose }: { onClose: () => void }) {
  const player = useGameStore(s => s.player);
  const changeDisplayName = useGameStore(s => s.changeDisplayName);
  const saveGame = useGameStore(s => s.saveGame);
  const [name, setName] = useState(player?.displayName ?? '');

  const handleRename = async () => {
    if (changeDisplayName(name)) {
      await saveGame();
      // Firestoreのオンラインユーザーも更新
      if (player) {
        try { await updateDoc(doc(db, 'online_users', player.uid), { displayName: name }); } catch { /* ignore */ }
      }
      onClose();
    }
  };

  return (
    <div style={{background:'rgba(0,0,0,0.8)', position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'#1c2235', border:'2px solid #5b8dee', borderRadius:12, padding:24, width:'90%', maxWidth:360}}>
        <h3 style={{color:'#f0c060', marginBottom:16}}>✏️ 名前変更</h3>
        <p style={{fontSize:'0.82rem', color:'#8a92b2', marginBottom:12}}>変更には100Gが必要です。現在: {player?.gold ?? 0}G</p>
        <input
          value={name} onChange={e => setName(e.target.value)} maxLength={20}
          placeholder="新しい名前 (1〜20文字)"
          style={{width:'100%', padding:'8px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.9rem', boxSizing:'border-box', marginBottom:12}}
        />
        <div style={{display:'flex', gap:8}}>
          <button onClick={handleRename} disabled={(player?.gold ?? 0) < 100}
            style={{flex:1, padding:'8px', background: (player?.gold ?? 0) >= 100 ? '#5b8dee' : '#2d3752', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700}}>
            変更する (100G)
          </button>
          <button onClick={onClose} style={{flex:1, padding:'8px', background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:6, cursor:'pointer'}}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// メール設定パネル
// ============================================================
// ============================================================
// ADMINパネル入口
// ============================================================
function AdminEntry({ onEnter }: { onEnter: () => void }) {
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);

  const handleCheck = () => {
    if (pw === 'ysmgd') { onEnter(); setShow(false); setPw(''); setErr(false); }
    else { setErr(true); setPw(''); }
  };

  return (
    <>
      <button onClick={() => setShow(true)}
        style={{width:'100%', padding:'10px', background:'rgba(224,85,85,0.1)', border:'2px solid #e05555', color:'#e05555', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.9rem'}}>
        🔐 ADMIN専用パネル
      </button>
      {show && (
        <div style={{background:'rgba(0,0,0,0.85)', position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#1c2235', border:'2px solid #e05555', borderRadius:12, padding:24, width:'90%', maxWidth:340}}>
            <h3 style={{color:'#e05555', marginBottom:12}}>🔐 管理者認証</h3>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="パスワード"
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              style={{width:'100%', padding:'8px 10px', background:'#161b26', border:`1px solid ${err ? '#e05555' : '#2d3752'}`, color:'#e8e6ff', borderRadius:6, fontSize:'0.9rem', boxSizing:'border-box', marginBottom:8}}
            />
            {err && <div style={{color:'#e05555', fontSize:'0.8rem', marginBottom:8}}>パスワードが違います</div>}
            <div style={{display:'flex', gap:8}}>
              <button onClick={handleCheck} style={{flex:1, padding:'8px', background:'#e05555', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700}}>認証</button>
              <button onClick={() => { setShow(false); setPw(''); setErr(false); }} style={{flex:1, padding:'8px', background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:6, cursor:'pointer'}}>閉じる</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// メインステータス画面
// ============================================================

const TITLE_MASTER: { id: string; label: string; condition: (p: PlayerData) => boolean }[] = [
  { id: 'beginner',  label: '🌱 見習い冒険者',     condition: () => true },
  { id: 'lv10',     label: '⚔️ 一人前',            condition: p => p.stats.level >= 10 },
  { id: 'lv30',     label: '🗡️ 熟練冒険者',        condition: p => p.stats.level >= 30 },
  { id: 'lv50',     label: '💎 エキスパート',       condition: p => p.stats.level >= 50 },
  { id: 'lv100',    label: '👑 レジェンド',         condition: p => p.stats.level >= 100 },
  { id: 'dungeon10',label: '🏰 ダンジョンマスター', condition: p => Object.values(p.dungeonClearedCount ?? {}).reduce((a,b)=>a+b,0) >= 10 },
  { id: 'dungeon50',label: '🌟 ダンジョン王',       condition: p => Object.values(p.dungeonClearedCount ?? {}).reduce((a,b)=>a+b,0) >= 50 },
  { id: 'rich',     label: '💰 大富豪',             condition: p => p.gold >= 1_000_000 },
  { id: 'fisher',   label: '🎣 釣り名人',           condition: p => (p.fishingScore ?? 0) >= 100 },
  { id: 'crafter',  label: '🔨 名工',               condition: p => (p.skillLevels?.crafting ?? 0) >= 10 },
];

const PROFILE_ICONS = ['⚔️','🛡️','🧙','🎣','💰','🏆','🌟','👑','🔥','💎','🐉','⚡','🌊','🌙','🎲','🗡️','🧪','🌱','💀','🦊'];

// ============================================================
// インベントリグリッド
// ============================================================
const INV_CATEGORY_TABS = [
  { id: 'all',      label: '全て' },
  { id: 'weapon',   label: '⚔️ 武器' },
  { id: 'armor',    label: '🛡️ 防具' },
  { id: 'food',     label: '🍖 食料' },
  { id: 'potion',   label: '🧪 薬' },
  { id: 'material', label: '🪨 素材' },
  { id: 'tool',     label: '🔧 道具' },
  { id: 'other',    label: '📦 その他' },
] as const;

const OTHER_CATEGORIES = new Set(['economy','display','job','protect','travel','treasure']);

const RARITY_BORDER: Record<string, string> = {
  common:'#2d3752', uncommon:'#2d6644', rare:'#2d4488', epic:'#6030a0', legendary:'#a06020',
};

function InventoryGrid({ player, useItem }: { player: NonNullable<ReturnType<typeof useGameStore.getState>['player']>; useItem: (id: string) => void }) {
  const [cat, setCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<string | null>(null);

  const entries = Object.entries(player.inventory)
    .filter(([, qty]) => (qty as number) > 0)
    .filter(([id]) => {
      const item = ITEM_MASTER[id];
      if (!item) return false;
      if (search && !item.name.includes(search)) return false;
      if (cat === 'all') return true;
      if (cat === 'other') return OTHER_CATEGORIES.has(item.category);
      return item.category === cat;
    })
    .sort(([, a], [, b]) => (b as number) - (a as number));

  const detailItem = detail ? ITEM_MASTER[detail] : null;
  const detailQty = detail ? (player.inventory[detail] ?? 0) : 0;

  return (
    <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
        <h3 style={{fontSize:'0.9rem', color:'#f0c060', margin:0}}>🎒 所持品 ({Object.values(player.inventory).filter(q => (q as number) > 0).length}種)</h3>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 名前で検索..."
        style={{width:'100%', padding:'6px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box', marginBottom:8}}
      />

      <div style={{display:'flex', gap:4, overflowX:'auto', marginBottom:10, paddingBottom:2}}>
        {INV_CATEGORY_TABS.map(t => (
          <button key={t.id} onClick={() => setCat(t.id)}
            style={{flexShrink:0, padding:'4px 8px', fontSize:'0.7rem', background: cat===t.id ? 'rgba(91,141,238,0.25)' : '#161b26', border:`1px solid ${cat===t.id ? '#5b8dee' : '#2d3752'}`, color: cat===t.id ? '#e8e6ff' : '#8a92b2', borderRadius:5, cursor:'pointer', whiteSpace:'nowrap'}}>
            {t.label}
          </button>
        ))}
      </div>

      {entries.length === 0
        ? <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:20}}>アイテムがありません</p>
        : <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:5}}>
            {entries.map(([id, qty]) => {
              const item = ITEM_MASTER[id];
              if (!item) return null;
              return (
                <button key={id} onClick={() => setDetail(id)}
                  title={item.name}
                  style={{position:'relative', background:'#161b26', border:`2px solid ${RARITY_BORDER[item.rarity] ?? '#2d3752'}`, borderRadius:7, padding:'6px 4px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, minHeight:56}}>
                  <GameIcon id={item.icon} size={26} />
                  <span style={{fontSize:'0.58rem', color:'#f0c060', fontWeight:700, lineHeight:1}}>×{qty}</span>
                </button>
              );
            })}
          </div>
      }

      {detail && detailItem && (
        <div style={{position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setDetail(null)}>
          <div style={{background:'#1c2235', border:`2px solid ${RARITY_BORDER[detailItem.rarity] ?? '#2d3752'}`, borderRadius:12, padding:18, width:'85%', maxWidth:320}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12}}>
              <GameIcon id={detailItem.icon} size={36} />
              <div>
                <div style={{fontWeight:700, fontSize:'1rem', color:'#e8e6ff'}}>{detailItem.name}</div>
                <div style={{fontSize:'0.7rem', color:'#8a92b2'}}>{detailItem.rarity} · ×{detailQty}</div>
              </div>
            </div>
            <div style={{fontSize:'0.8rem', color:'#8a92b2', marginBottom:10}}>{detailItem.description}</div>
            <div style={{fontSize:'0.75rem', color:'#4a5070', display:'flex', flexDirection:'column', gap:3, marginBottom:12}}>
              {detailItem.sellPrice > 0 && <span>💰 売値: {detailItem.sellPrice}G/個</span>}
              {detailItem.useEffect?.hpRestore && <span style={{color:'#4caf87'}}>❤️ HP+{detailItem.useEffect.hpRestore}</span>}
              {detailItem.useEffect?.satietyRestore && <span style={{color:'#f0a830'}}>🍖 満腹+{detailItem.useEffect.satietyRestore}</span>}
              {detailItem.useEffect?.attackBonus && <span style={{color:'#f0c060'}}>⚔️ 攻撃+{detailItem.useEffect.attackBonus}</span>}
              {(detailItem as any).attackBonus && <span style={{color:'#f0c060'}}>⚔️ 攻撃+{(detailItem as any).attackBonus}</span>}
              {(detailItem as any).defenseBonus && <span style={{color:'#5b8dee'}}>🛡️ 防御+{(detailItem as any).defenseBonus}</span>}
            </div>
            <div style={{display:'flex', gap:8}}>
              {detailItem.useEffect && detailItem.category !== 'weapon' && (
                <button onClick={() => { useItem(detail); setDetail(null); }}
                  style={{flex:1, padding:'8px', background:'#9b6df0', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem'}}>
                  使用する
                </button>
              )}
              <button onClick={() => setDetail(null)}
                style={{flex:1, padding:'8px', background:'#2d3752', color:'#8a92b2', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.85rem'}}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function StatusScreen() {
  const player = useGameStore(s => s.player);
  const saveGame = useGameStore(s => s.saveGame);
  const isSaving = useGameStore(s => s.isSaving);
  const useItem = useGameStore(s => s.useItem);
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const [activeSection, setActiveSection] = useState<'stats'|'skills'|'inventory'|'equipment'>('stats');
  const [profileIcon, setProfileIcon] = useState(() => player?.profile?.icon ?? '⚔️');
  const [profileComment, setProfileComment] = useState(() => player?.profile?.comment ?? '');
  const [profileTitleId, setProfileTitleId] = useState(() => player?.profile?.titleId ?? '');
  const [profileDungeonId, setProfileDungeonId] = useState(() => player?.profile?.favDungeonId ?? '');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showRename, setShowRename] = useState(false);

  if (!player) return null;

  const hpPct = (player.stats.hp / player.stats.maxHp) * 100;
  const satPct = (player.stats.satiety / player.stats.maxSatiety) * 100;
  const expPct = player.stats.level < 200 ? Math.min(100, (player.stats.exp / player.stats.expToNextLevel) * 100) : 100;

  const bar = (pct: number, color: string) => (
    <div style={{height:8, background:'#2d3752', borderRadius:4, overflow:'hidden', marginTop:3}}>
      <div style={{height:'100%', background:color, width:`${pct}%`, transition:'width 0.3s'}} />
    </div>
  );

  const SECTION_TABS = [
    { id:'stats', label:'基本', icon:'mage' },
    { id:'skills', label:'スキル', icon:'lightning' },
    { id:'inventory', label:'所持', icon:'backpack' },
    { id:'equipment', label:'装備', icon:'swords' },
  ] as const;

  return (
    <div style={{padding:'12px 8px 80px'}}>
      {showRename && <RenamePanel onClose={() => setShowRename(false)} />}

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>
        <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', margin:0}}>📊 ステータス</h2>
        <button onClick={saveGame} disabled={isSaving}
          style={{padding:'5px 12px', background:'#1c2235', color: isSaving ? '#4a5070' : '#5b8dee', border:'1px solid #2d3752', borderRadius:6, cursor:'pointer', fontSize:'0.8rem'}}>
          {isSaving ? '保存中...' : '💾 保存'}
        </button>
      </div>

      {/* 危険状態はポップアップで表示するためここでは非表示 */}

      {/* セクションタブ */}
      <div style={{display:'flex', gap:4, marginBottom:12, overflowX:'auto'}}>
        {SECTION_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveSection(t.id)}
            style={{flexShrink:0, padding:'6px 10px', fontSize:'0.75rem', background: activeSection===t.id ? 'rgba(91,141,238,0.2)' : '#1c2235', border:`1px solid ${activeSection===t.id ? '#5b8dee' : '#2d3752'}`, color: activeSection===t.id ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer'}}>
            <GameIcon id={t.icon} size={16} style={{marginRight:4}} /> {t.label}
          </button>
        ))}
      </div>

      {/* 基本情報 */}
      {activeSection === 'stats' && (
        <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
            <h3 style={{fontSize:'0.9rem', color:'#f0c060', margin:0}}>🧙 基本情報</h3>
            <button onClick={() => setShowRename(true)}
              style={{padding:'3px 8px', background:'#1c2235', border:'1px solid #5b8dee', color:'#5b8dee', borderRadius:4, cursor:'pointer', fontSize:'0.7rem'}}>
              ✏️ 名前変更(100G)
            </button>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
            {[
              ['名前', player.displayName],
              ['レベル', `Lv.${player.stats.level}`],
              ['経験値', `${player.stats.exp} / ${EXP_TABLE[player.stats.level + 1] ?? 'MAX'}`],
              ['所持金', `💰 ${player.gold.toLocaleString()}G`],
              ['攻撃力', `⚔️ ${player.stats.attack}`],
              ['防御力', `🛡️ ${player.stats.defense}`],
            ].map(([label, value]) => (
              <div key={label} style={{background:'#161b26', borderRadius:6, padding:'6px 10px'}}>
                <div style={{fontSize:'0.68rem', color:'#4a5070', marginBottom:2}}>{label}</div>
                <div style={{fontSize:'0.88rem', color:'#e8e6ff', fontWeight:700}}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10}}>
            <div style={{fontSize:'0.75rem', color:'#8a92b2'}}>❤️ HP {player.stats.hp}/{player.stats.maxHp}</div>
            {bar(hpPct, '#e05555')}
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginTop:6}}>🍖 満腹度 {player.stats.satiety}/{player.stats.maxSatiety}</div>
            {bar(satPct, satPct < 20 ? '#e05555' : '#f0a830')}
            <div style={{fontSize:'0.75rem', color:'#8a92b2', marginTop:6}}>✨ EXP {player.stats.exp}/{player.stats.expToNextLevel}</div>
            {bar(expPct, '#5b8dee')}
          </div>
          <div style={{marginTop:10, fontSize:'0.72rem', color:'#4a5070', background:'#161b26', borderRadius:6, padding:'6px 8px'}}>
            💡 HPは5秒ごとに1自動回復します。ゲームを閉じていても回復します。
          </div>
          {/* ADMIN入口 */}
          <div style={{marginTop:12}}>
            <AdminEntry onEnter={() => setActiveTab('admin')} />
          </div>
        </section>
      )}

      {/* プロフィール編集 */}
      {activeSection === 'stats' && (
        <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
          <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>👤 プロフィール</h3>
          {/* アイコン */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:'0.72rem', color:'#8a92b2', marginBottom:4}}>アイコン</div>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{fontSize:'2rem'}}>{profileIcon}</span>
              <button onClick={() => setShowIconPicker(v => !v)}
                style={{padding:'4px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#8a92b2', borderRadius:6, cursor:'pointer', fontSize:'0.75rem'}}>
                変更
              </button>
            </div>
            {showIconPicker && (
              <div style={{display:'flex', flexWrap:'wrap', gap:4, marginTop:6, background:'#161b26', borderRadius:6, padding:8}}>
                {PROFILE_ICONS.map(e => (
                  <button key={e} onClick={() => { setProfileIcon(e); setShowIconPicker(false); }}
                    style={{background: profileIcon === e ? 'rgba(91,141,238,0.3)' : 'none', border: profileIcon === e ? '1px solid #5b8dee' : '1px solid transparent', borderRadius:4, fontSize:'1.3rem', cursor:'pointer', padding:3}}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 一言コメント */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:'0.72rem', color:'#8a92b2', marginBottom:4}}>一言コメント（50文字以内）</div>
            <input value={profileComment} onChange={e => setProfileComment(e.target.value.slice(0,50))}
              placeholder="自己紹介を入力..."
              style={{width:'100%', padding:'6px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem', boxSizing:'border-box'}} />
          </div>
          {/* 称号 */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:'0.72rem', color:'#8a92b2', marginBottom:4}}>称号（解放済みから選択）</div>
            <select value={profileTitleId} onChange={e => setProfileTitleId(e.target.value)}
              style={{width:'100%', padding:'6px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem'}}>
              <option value="">-- なし --</option>
              {TITLE_MASTER.filter(t => player && t.condition(player)).map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          {/* 好きなダンジョン */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:'0.72rem', color:'#8a92b2', marginBottom:4}}>好きなダンジョン</div>
            <select value={profileDungeonId} onChange={e => setProfileDungeonId(e.target.value)}
              style={{width:'100%', padding:'6px 8px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.82rem'}}>
              <option value="">-- なし --</option>
              {Object.values(DUNGEON_MASTER).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          {/* 保存ボタン */}
          <button onClick={async () => {
            if (!player) return;
            const profile = { icon: profileIcon, comment: profileComment, titleId: profileTitleId, favDungeonId: profileDungeonId };
            useGameStore.setState(s => ({ player: s.player ? { ...s.player, profile } : s.player }));
            await saveGame();
          }} style={{width:'100%', padding:'8px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:'0.85rem'}}>
            💾 プロフィールを保存
          </button>
        </section>
      )}

      {/* スキル */}
      {activeSection === 'skills' && (
        <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
          <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>⚡ スキル <span style={{fontSize:'0.72rem', color:'#4a5070'}}>(最大Lv.100000)</span></h3>
          {Object.values(SKILL_MASTER).map(skill => {
            const lv = player.skillLevels[skill.id] ?? 1;
            const exp = player.skillExp[skill.id] ?? 0;
            const nextExp = SKILL_EXP_TABLE[lv + 1];
            const pct = nextExp !== undefined ? Math.min(100, (exp / nextExp) * 100) : 100;
            return (
              <div key={skill.id} style={{marginBottom:10}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem'}}>
                  <span style={{display:'flex',alignItems:'center',gap:6}}><GameIcon id={skill.icon} size={20} /> {skill.name}</span>
                  <span style={{color:'#5b8dee', fontWeight:700}}>Lv.{lv.toLocaleString()}</span>
                </div>
                <div style={{fontSize:'0.7rem', color:'#4a5070', marginBottom:2}}>{skill.description}</div>
                <div style={{height:5, background:'#2d3752', borderRadius:3, overflow:'hidden'}}>
                  <div style={{height:'100%', background:'#5b8dee', width:`${pct}%`, transition:'width 0.3s'}} />
                </div>
                <div style={{fontSize:'0.68rem', color:'#4a5070', marginTop:1}}>
                  {exp.toLocaleString()} / {nextExp?.toLocaleString() ?? 'MAX'} EXP
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* インベントリ */}
      {activeSection === 'inventory' && (
        <InventoryGrid player={player} useItem={useItem} />
      )}

      {/* 装備・ホットバー */}
      {activeSection === 'equipment' && (
        <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
          <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>⚔️ 装備・ホットバー</h3>
          <EquipmentPanel />
        </section>
      )}

      {/* メール通知設定 */}
    </div>
  );
}
