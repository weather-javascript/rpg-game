// src/components/screens/StatusScreen.tsx
import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER, SKILL_MASTER, EXP_TABLE, SKILL_EXP_TABLE, CRAFT_RECIPES } from '../../data/masters';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { savePlayer } from '../../services/database';

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
    // クラフト後にFirebase即時保存（素材が復活するバグを防ぐ）
    const latestPlayer = useGameStore.getState().player;
    if (latestPlayer) savePlayer(latestPlayer).catch(() => {});
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
              <span style={{fontSize:'1.3rem'}}>{outItem?.icon}</span>
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
                    {ITEM_MASTER[inp.itemId]?.icon} {ITEM_MASTER[inp.itemId]?.name} {have}/{inp.amount}
                  </span>
                );
              })}
              <span style={{fontSize:'0.72rem', padding:'2px 6px', borderRadius:4, background:'rgba(91,141,238,0.15)', color:'#5b8dee'}}>
                → {outItem?.icon} {outItem?.name} ×{recipe.outputAmount}
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
function EmailSettingsPanel() {
  const player = useGameStore(s => s.player);
  const saveGame = useGameStore(s => s.saveGame);
  const addNotification = useGameStore(s => s.addNotification);
  const [email, setEmail] = useState(player?.emailAddress ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { useGameStore: store } = await import('../../stores/gameStore');
      const p = store.getState().player;
      if (p) {
        store.setState({ player: { ...p, emailAddress: email, emailNotifications: { auction: true, events: true, updates: true } } });
        await saveGame();
        addNotification('success', '📧 メール設定を保存しました');
      }
    } catch { addNotification('error', '保存に失敗しました'); }
    setSaving(false);
  };

  return (
    <div style={{background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:12}}>
      <div style={{fontSize:'0.82rem', color:'#8a92b2', marginBottom:8}}>
        オークションで売れたとき・イベント開始・バージョン更新時にメール通知が届きます。
        Googleアカウントの場合はGmailに届きます。
      </div>
      <input
        type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="メールアドレスを入力"
        style={{width:'100%', padding:'7px 10px', background:'#1c2235', border:'1px solid #2d3752', color:'#e8e6ff', borderRadius:6, fontSize:'0.85rem', boxSizing:'border-box', marginBottom:8}}
      />
      <button onClick={handleSave} disabled={saving}
        style={{width:'100%', padding:'7px', background:'#5b8dee', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.85rem', fontWeight:700}}>
        {saving ? '保存中...' : '📧 メール設定を保存'}
      </button>
    </div>
  );
}

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
  const canUseRelief = useGameStore(s => s.canUseRelief);
  const useRelief = useGameStore(s => s.useRelief);
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const [activeSection, setActiveSection] = useState<'stats'|'skills'|'inventory'|'crafting'|'email'>('stats');
  const [showRename, setShowRename] = useState(false);

  if (!player) return null;

  const reliefCheck = canUseRelief();
  const isStruggling = player.stats.hp <= 30 && player.stats.satiety <= 10 && player.gold < 500;

  const hpPct = (player.stats.hp / player.stats.maxHp) * 100;
  const satPct = (player.stats.satiety / player.stats.maxSatiety) * 100;
  const expPct = player.stats.level < 200 ? Math.min(100, (player.stats.exp / player.stats.expToNextLevel) * 100) : 100;

  const bar = (pct: number, color: string) => (
    <div style={{height:8, background:'#2d3752', borderRadius:4, overflow:'hidden', marginTop:3}}>
      <div style={{height:'100%', background:color, width:`${pct}%`, transition:'width 0.3s'}} />
    </div>
  );

  const SECTION_TABS = [
    { id:'stats', label:'基本', icon:'🧙' },
    { id:'skills', label:'スキル', icon:'⚡' },
    { id:'inventory', label:'所持', icon:'🎒' },
    { id:'crafting', label:'製作', icon:'🔨' },
    { id:'email', label:'通知', icon:'📧' },
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
            {t.icon} {t.label}
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
                  <span>{skill.icon} {skill.name}</span>
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
                <div key={id} style={{display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background: RARITY_COLORS[item.rarity] ?? '#2d3752', borderRadius:6, marginBottom:3}}>
                  <span style={{fontSize:'1.2rem'}}>{item.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.82rem', fontWeight:700}}>{item.name}</div>
                    <div style={{fontSize:'0.68rem', color:'#8a92b2'}}>{item.rarity} | {item.sellPrice}G/個</div>
                  </div>
                  <span style={{color:'#f0c060', fontWeight:700, fontSize:'0.9rem'}}>×{qty}</span>
                  {item.useEffect && (
                    <button onClick={() => useItem(id)} style={{padding:'3px 7px', background:'#9b6df0', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.7rem'}}>使用</button>
                  )}
                </div>
              );
            })
          }
        </section>
      )}

      {/* 製作 */}
      {activeSection === 'crafting' && (
        <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
          <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>🔨 製作</h3>
          <CraftingPanel />
        </section>
      )}

      {/* メール通知設定 */}
      {activeSection === 'email' && (
        <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
          <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>📧 メール通知設定</h3>
          <EmailSettingsPanel />
        </section>
      )}
    </div>
  );
}
