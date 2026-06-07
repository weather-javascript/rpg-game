// src/components/screens/StatusScreen.tsx
import { useState } from 'react';
import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER, SKILL_MASTER, EXP_TABLE, SKILL_EXP_TABLE, CRAFT_RECIPES } from '../../data/masters';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { EquipmentSlots } from '../../types/game';
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
      .filter(([id, qty]) => qty > 0 && ITEM_MASTER[id] && (isArmor
        ? ['armor','weapon'].includes(ITEM_MASTER[id].category)
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
function CraftingPanel() {
  const player = useGameStore(s => s.player);
  const addItems = useGameStore(s => s.addItems);
  const consumeItem = useGameStore(s => s.consumeItem);
  const addSkillExp = useGameStore(s => s.addSkillExp);
  const addNotification = useGameStore(s => s.addNotification);
  const [filter, setFilter] = useState('');

  if (!player) return null;
  const craftingLv = player.skillLevels['crafting'] ?? 1;

  const canCraft = (recipe: typeof CRAFT_RECIPES[0]) => {
    if (craftingLv < recipe.requiredCraftingLevel) return false;
    return recipe.inputs.every(inp => (player.inventory[inp.itemId] ?? 0) >= inp.amount);
  };

  const handleCraft = (recipe: typeof CRAFT_RECIPES[0]) => {
    if (!canCraft(recipe)) return;
    for (const inp of recipe.inputs) consumeItem(inp.itemId, inp.amount);
    addItems([{ itemId: recipe.outputItemId, amount: recipe.outputAmount }]);
    addSkillExp('crafting', recipe.craftingExpGain);
    addNotification('success', `🔨 ${recipe.name} → ${ITEM_MASTER[recipe.outputItemId]?.name} ×${recipe.outputAmount} 製作成功！`);
    // クラフト後はlocalStorageのみバックアップ（次回自動保存でFirebase同期）
    const latestPlayer = useGameStore.getState().player;
    if (latestPlayer) {
      try { localStorage.setItem('rpg_backup', JSON.stringify({ data: latestPlayer, savedAt: Date.now() })); } catch { /* ignore */ }
    }
  };

  const filtered = CRAFT_RECIPES.filter(r =>
    r.name.includes(filter) || ITEM_MASTER[r.outputItemId]?.name.includes(filter)
  );

  return (
    <div>
      <input
        value={filter} onChange={e => setFilter(e.target.value)}
        placeholder="レシピを検索..."
        style={{width:'100%', padding:'6px 10px', background:'#161b26', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem', boxSizing:'border-box', marginBottom:10}}
      />
      <div style={{fontSize:'0.75rem', color:'#8a92b2', marginBottom:8}}>製作スキル Lv.{craftingLv}</div>
      {filtered.map(recipe => {
        const craftable = canCraft(recipe);
        const levelOk = craftingLv >= recipe.requiredCraftingLevel;
        const outItem = ITEM_MASTER[recipe.outputItemId];
        return (
          <div key={recipe.id} style={{background: craftable ? 'rgba(76,175,135,0.08)' : '#161b26', border:`1px solid ${craftable ? '#4caf87' : '#2d3752'}`, borderRadius:8, padding:'10px 12px', marginBottom:8}}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
              <span style={{fontSize:'1.3rem'}}><GameIcon id={outItem?.icon ?? ''} size={22} /></span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, fontSize:'0.9rem', color: craftable ? '#4caf87' : '#e8e6ff'}}>{recipe.name}</div>
                <div style={{fontSize:'0.72rem', color:'#8a92b2'}}>{recipe.description}</div>
              </div>
              <div style={{textAlign:'right', fontSize:'0.75rem'}}>
                <div style={{color:'#5b8dee'}}>Lv.{recipe.requiredCraftingLevel}〜</div>
                <div style={{color:'#f0c060'}}>EXP+{recipe.craftingExpGain}</div>
              </div>
            </div>
            <div style={{display:'flex', flexWrap:'wrap', gap:4, marginBottom:8}}>
              {recipe.inputs.map(inp => {
                const have = player.inventory[inp.itemId] ?? 0;
                const ok = have >= inp.amount;
                return (
                  <span key={inp.itemId} style={{fontSize:'0.72rem', padding:'2px 6px', borderRadius:4, background: ok ? 'rgba(76,175,135,0.15)' : 'rgba(224,85,85,0.15)', color: ok ? '#4caf87' : '#e05555'}}>
                    <GameIcon id={ITEM_MASTER[inp.itemId]?.icon ?? ''} size={14} style={{marginRight:2}} /> {ITEM_MASTER[inp.itemId]?.name} {have}/{inp.amount}
                  </span>
                );
              })}
              <span style={{fontSize:'0.72rem', padding:'2px 6px', borderRadius:4, background:'rgba(91,141,238,0.15)', color:'#5b8dee'}}>
                → <GameIcon id={outItem?.icon ?? ''} size={14} style={{marginRight:2}} /> {outItem?.name} ×{recipe.outputAmount}
              </span>
            </div>
            <button
              onClick={() => handleCraft(recipe)}
              disabled={!craftable}
              style={{width:'100%', padding:'6px', background: craftable ? 'linear-gradient(135deg,#4caf87,#2d8060)' : '#2d3752', color: craftable ? '#fff' : '#4a5070', border:'none', borderRadius:6, cursor: craftable ? 'pointer' : 'not-allowed', fontSize:'0.82rem', fontWeight:700}}
            >
              {!levelOk ? `🔒 Lv.${recipe.requiredCraftingLevel}が必要` : craftable ? '🔨 製作する' : '素材が足りない'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

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
export function StatusScreen() {
  const player = useGameStore(s => s.player);
  const saveGame = useGameStore(s => s.saveGame);
  const isSaving = useGameStore(s => s.isSaving);
  const useItem = useGameStore(s => s.useItem);
  const addNotification = useGameStore(s => s.addNotification);
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const [activeSection, setActiveSection] = useState<'stats'|'skills'|'inventory'|'equipment'>('stats');
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

  const inventoryEntries = Object.entries(player.inventory).filter(([, qty]) => qty > 0);
  const RARITY_COLORS: Record<string, string> = {
    common:'#2d3752', uncommon:'#2d6644', rare:'#2d4488', epic:'#6030a0', legendary:'#a06020',
  };

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
        <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
          <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>🎒 所持品 ({inventoryEntries.length}種)</h3>
          {inventoryEntries.length === 0
            ? <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center', padding:20}}>アイテムがありません</p>
            : inventoryEntries.map(([id, qty]) => {
              const item = ITEM_MASTER[id];
              if (!item) return null;
              return (
                <div key={id} style={{display:'flex', alignItems:'flex-start', gap:8, padding:'7px 8px', background: RARITY_COLORS[item.rarity] ?? '#2d3752', borderRadius:6, marginBottom:4}}>
                  <span style={{fontSize:'1.2rem', flexShrink:0, marginTop:2}}><GameIcon id={item.icon} size={22} /></span>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:'0.82rem', fontWeight:700}}>{item.name}</div>
                    <div style={{fontSize:'0.68rem', color:'#8a92b2', marginTop:1}}>{item.description}</div>
                    <div style={{fontSize:'0.65rem', color:'#4a5070', marginTop:2, display:'flex', gap:8, flexWrap:'wrap'}}>
                      <span>{item.rarity}</span>
                      {item.sellPrice > 0 && <span>売値: {item.sellPrice}G/個</span>}
                      {item.useEffect?.hpRestore && <span style={{color:'#4caf87'}}>HP+{item.useEffect.hpRestore}</span>}
                      {item.useEffect?.satietyRestore && <span style={{color:'#f0a830'}}>満腹+{item.useEffect.satietyRestore}</span>}
                      {item.useEffect?.attackBonus && <span style={{color:'#f0c060'}}>攻撃+{item.useEffect.attackBonus}</span>}
                    </div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0}}>
                    <span style={{color:'#f0c060', fontWeight:700, fontSize:'0.9rem'}}>×{qty}</span>
                    {item.useEffect && (
                      <button onClick={() => {
                        if (item.useEffect?.attackBonus) {
                          addNotification('info', `${item.name}はダンジョンのホットバーから使用してください`);
                        } else {
                          useItem(id);
                        }
                      }} style={{padding:'3px 7px', background: item.useEffect.attackBonus ? '#2d3752' : '#9b6df0', color: item.useEffect.attackBonus ? '#8a92b2' : '#fff', border: item.useEffect.attackBonus ? '1px solid #4a5070' : 'none', borderRadius:4, cursor:'pointer', fontSize:'0.7rem'}}>
                        {item.useEffect.attackBonus ? '⚔️武器' : '使用'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          }
        </section>
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
