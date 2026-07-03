
// src/components/screens/StorageScreen.tsx
import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import {
  subscribeMyChests, subscribeSharedChests, subscribeChestLogs,
  createChest, deleteChest, depositToChest, withdrawFromChest,
  moveSlot, moveAcrossChests, updateChestSettings, updateSortOrders,
  expandChest, togglePin, canWithdraw, getSlotCount,
  fetchAllPlayers, hashPassword, verifyPassword,
} from '../../services/storageService';
import {
  CHEST_COST, CHEST_EXPAND_COST, CHEST_STACK_LIMIT,
  CHEST_COLOR_MAP,
  type Chest, type ChestColor, type ChestLog,
} from '../../types/storage';

const ICON_OPTIONS = ['📦','🧰','🗃️','💰','⚔️','🛡️','🧪','💎','🌿','🔮','🗝️','🎁','🏺','🪙','🧲'];
const COLOR_OPTIONS = Object.entries(CHEST_COLOR_MAP) as [ChestColor, typeof CHEST_COLOR_MAP[ChestColor]][];

/* ── スタイル定数 ── */
const ov:  React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 };
const mw:  React.CSSProperties = { background:'#161b26', border:'2px solid #2d3752', borderRadius:14, padding:20, minWidth:260, maxWidth:360, maxHeight:'80vh', overflowY:'auto' };
const mtt: React.CSSProperties = { fontWeight:800, fontSize:'0.95rem', color:'#f0c060', marginBottom:12 };
const lb:  React.CSSProperties = { fontSize:'0.72rem', color:'#8a92b2', display:'block', marginBottom:4, fontWeight:600 };
const inp: React.CSSProperties = { width:'100%', padding:'7px 10px', borderRadius:7, background:'#0d1018', border:'1px solid #2d3752', color:'#e8e6ff', fontSize:'0.85rem' };
const sb:  React.CSSProperties = { padding:'4px 10px', borderRadius:6, fontSize:'0.78rem', border:'1px solid #2d3752', background:'#0d1018', color:'#e8e6ff' };
const cb:  React.CSSProperties = { flex:1, padding:'8px', borderRadius:8, fontSize:'0.82rem', border:'1px solid #2d3752', background:'#0d1018', color:'#8a92b2' };
const ok:  React.CSSProperties = { flex:1, padding:'8px', borderRadius:8, fontSize:'0.82rem', fontWeight:700, border:'none', background:'linear-gradient(135deg,#5b8dee,#3d6fd0)', color:'#fff' };

function getIcon(icon: string) {
  const m: Record<string,string> = { log:'🪵', rock:'🪨', ore_black:'⬛', coal:'🖤', sparkle:'✨', emerald:'💚', ore_green:'🟢', gem_blue:'💎', herb:'🌿', flower:'🌸', mushroom:'🍄', fish:'🐟', meat:'🍖', sword:'⚔️', shield:'🛡️', bow:'🏹', scroll:'📜', gem:'💎', crystal:'🔷', bone:'🦴', feather:'🪶', coin:'🪙', ticket:'🎟️', key:'🗝️', chest:'📦', bag:'🎒', book:'📚', iron_ingot:'🔩', ancient_shard:'🔶', ore_dark:'⬛' };
  return m[icon] ?? '📦';
}

/* ── パスワード解除モーダル ── */
function UnlockModal({ chest, onUnlock, onCancel }: { chest: Chest; onUnlock: () => void; onCancel: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  async function handle() {
    const ok2 = await verifyPassword(chest, pw);
    if (ok2) onUnlock(); else setErr('パスワードが違います');
  }
  return (
    <div className="rpg-modal-backdrop" style={ov} onClick={onCancel}>
      <div className="rpg-modal-content" style={mw} onClick={e => e.stopPropagation()}>
        <div style={mtt}>🔒 パスワードを入力</div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} style={inp} placeholder="パスワード" onKeyDown={e => e.key==='Enter' && handle()} autoFocus />
        {err && <div style={{ color:'#e05555', fontSize:'0.75rem', marginTop:6 }}>{err}</div>}
        <div style={{ display:'flex', gap:8, marginTop:12 }}><button style={cb} onClick={onCancel}>キャンセル</button><button style={ok} onClick={handle}>解除</button></div>
      </div>
    </div>
  );
}

/* ── 履歴モーダル ── */
function LogModal({ chest, onClose }: { chest: Chest; onClose: () => void }) {
  const [logs, setLogs] = useState<ChestLog[]>([]);
  useEffect(() => subscribeChestLogs(chest.id, setLogs), [chest.id]);
  const actionLabel = (a: ChestLog['action']) => a === 'deposit' ? '📥 預けた' : a === 'withdraw' ? '📤 取り出した' : '🔀 移動';
  return (
    <div className="rpg-modal-backdrop" style={ov} onClick={onClose}>
      <div className="rpg-modal-content" style={{ ...mw, minWidth:300 }} onClick={e => e.stopPropagation()}>
        <div style={mtt}>📋 操作履歴 — {chest.name}</div>
        {logs.length === 0 ? <div style={{ color:'#4a5070', fontSize:'0.8rem' }}>履歴なし</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {logs.map(l => (
              <div key={l.id} style={{ fontSize:'0.72rem', borderBottom:'1px solid #1e2535', paddingBottom:4 }}>
                <span style={{ color:'#8a92b2' }}>{new Date(l.at).toLocaleString('ja-JP')}</span><br />
                <span style={{ color:'#e8e6ff' }}>{l.actorName}</span>
                <span style={{ color:'#f0c060', margin:'0 4px' }}>{actionLabel(l.action)}</span>
                <span style={{ color:'#e8e6ff' }}>{l.itemName} × {l.amount}</span>
              </div>
            ))}
          </div>
        )}
        <button style={{ ...ok, marginTop:12 }} onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
}

/* ── スロットグリッド ── */
function SlotGrid({
  chest, myUid, myInventory, xferMode, xferSlot,
  onDeposit, onWithdraw, onMove, onTogglePin, onStartXfer, onEndXfer,
}: {
  chest: Chest; myUid: string; myInventory: Record<string,number>;
  xferMode: boolean; xferSlot: { chestId: string; slotIdx: number } | null;
  onDeposit: (idx: number, id: string, amt: number) => void;
  onWithdraw: (idx: number, amt: number) => void;
  onMove: (from: number, to: number) => void;
  onTogglePin: (idx: number) => void;
  onStartXfer: (idx: number) => void;
  onEndXfer: (toIdx: number) => void;
}) {
  const isOwner = chest.ownerUid === myUid;
  const canTake = canWithdraw(chest, myUid);
  const slotCount = getSlotCount(chest);
  const [dragging, setDragging] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [depModal, setDepModal] = useState<number | null>(null);
  const [wdModal, setWdModal] = useState<{ idx: number; itemId: string; max: number } | null>(null);
  const [depId, setDepId] = useState('');
  const [depAmt, setDepAmt] = useState(1);
  const [wdAmt, setWdAmt] = useState(1);
  const [ctxMenu, setCtxMenu] = useState<{ idx: number; x: number; y: number } | null>(null);
  const [search, setSearch] = useState('');

  const myItems = Object.entries(myInventory)
    .filter(([,q]) => q > 0)
    .map(([id, q]) => ({ id, q, name: ITEM_MASTER[id]?.name ?? id, icon: ITEM_MASTER[id]?.icon ?? '' }))
    .filter(i => !search || i.name.includes(search))
    .sort((a,b) => a.name.localeCompare(b.name));

  const slots = [...chest.slots, ...Array(slotCount - chest.slots.length).fill(null)];

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(9,1fr)', gap:3, marginBottom:8 }}>
        {slots.map((slot, idx) => {
          const master = slot ? ITEM_MASTER[slot.itemId] : null;
          const isDrag = dragging === idx;
          const isHov  = hover === idx;
          const isXferSrc = xferSlot?.chestId === chest.id && xferSlot?.slotIdx === idx;
          const pct = slot ? Math.min(100, Math.round(slot.amount / CHEST_STACK_LIMIT * 100)) : 0;
          return (
            <div
              key={idx}
              draggable={!!slot && isOwner && !xferMode}
              onDragStart={() => setDragging(idx)}
              onDragEnd={() => { setDragging(null); setHover(null); }}
              onDragOver={e => { e.preventDefault(); setHover(idx); }}
              onDrop={() => { if (dragging !== null && dragging !== idx) onMove(dragging, idx); setDragging(null); setHover(null); }}
              onClick={() => {
                if (ctxMenu) { setCtxMenu(null); return; }
                if (xferMode) {
                  if (xferSlot?.chestId === chest.id) onEndXfer(idx);
                  return;
                }
                if (slot && canTake) { setWdAmt(1); setWdModal({ idx, itemId: slot.itemId, max: slot.amount }); }
                else if (!slot && isOwner) { setDepId(''); setDepAmt(1); setDepModal(idx); }
              }}
              onContextMenu={e => { e.preventDefault(); if (slot && isOwner) setCtxMenu({ idx, x: e.clientX, y: e.clientY }); }}
              title={slot ? `${master?.name ?? slot.itemId} × ${slot.amount}${slot.pinned ? ' 📌' : ''}` : (isOwner ? 'クリックで預ける' : '')}
              style={{
                aspectRatio:'1', borderRadius:5,
                border:`2px solid ${isXferSrc ? '#f0c060' : isDrag ? '#f0c060' : isHov ? '#5b8dee' : slot?.pinned ? '#c060f0' : '#1e2535'}`,
                background: isXferSrc ? 'rgba(240,192,96,0.15)' : isDrag ? 'rgba(240,192,96,0.1)' : isHov ? 'rgba(91,141,238,0.12)' : '#0a0d14',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                cursor: xferMode ? 'crosshair' : (slot ? (canTake ? 'pointer' : 'default') : (isOwner ? 'pointer' : 'default')),
                position:'relative', fontSize:'1rem', transition:'border-color 0.12s',
                opacity: isDrag ? 0.4 : 1,
              }}
            >
              {slot ? (
                <>
                  <span style={{ fontSize:'1rem', lineHeight:1 }}>{master?.icon ? getIcon(master.icon) : '📦'}</span>
                  <span style={{ position:'absolute', bottom:1, right:2, fontSize:'0.5rem', fontWeight:800, color:'#f0c060', lineHeight:1 }}>{slot.amount}</span>
                  {/* スタックバー */}
                  <div style={{ position:'absolute', bottom:0, left:0, width:`${pct}%`, height:2, background: pct>=100 ? '#e05555' : '#5b8dee', borderRadius:'0 0 3px 3px' }} />
                  {slot.pinned && <span style={{ position:'absolute', top:1, left:2, fontSize:'0.5rem' }}>📌</span>}
                </>
              ) : (
                <span style={{ color:'#1e2535', fontSize:'0.7rem' }}>·</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 右クリックコンテキストメニュー */}
      {ctxMenu && (
        <div style={{ position:'fixed', left:ctxMenu.x, top:ctxMenu.y, background:'#1c2235', border:'1px solid #2d3752', borderRadius:8, zIndex:400, minWidth:140, boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
          {[
            ['📌 ピン留め切替', () => { onTogglePin(ctxMenu.idx); setCtxMenu(null); }],
            ['🔀 別チェストへ移動', () => { onStartXfer(ctxMenu.idx); setCtxMenu(null); }],
            ['📤 取り出す', () => {
              const slot = chest.slots[ctxMenu.idx];
              if (slot) { setWdAmt(1); setWdModal({ idx: ctxMenu.idx, itemId: slot.itemId, max: slot.amount }); }
              setCtxMenu(null);
            }],
          ].map(([label, fn]) => (
            <button key={label as string} onClick={fn as () => void} style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 14px', background:'transparent', border:'none', color:'#e8e6ff', fontSize:'0.78rem', cursor:'pointer' }}>
              {label as string}
            </button>
          ))}
          <div style={{ height:1, background:'#2d3752', margin:'2px 0' }} />
          <button onClick={() => setCtxMenu(null)} style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 14px', background:'transparent', border:'none', color:'#8a92b2', fontSize:'0.78rem', cursor:'pointer' }}>閉じる</button>
        </div>
      )}

      {/* 預けるモーダル */}
      {depModal !== null && (
        <div className="rpg-modal-backdrop" style={ov} onClick={() => setDepModal(null)}>
          <div className="rpg-modal-content" style={mw} onClick={e => e.stopPropagation()}>
            <div style={mtt}>📥 アイテムを預ける — スロット{depModal+1}</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="アイテム検索…" style={{ ...inp, marginBottom:8 }} />
            {myItems.length === 0 ? <div style={{ color:'#4a5070', fontSize:'0.8rem' }}>所持アイテムなし</div> : (
              <>
                <select value={depId} onChange={e => { setDepId(e.target.value); setDepAmt(1); }} style={{ ...inp, marginBottom:8 }}>
                  <option value="">-- 選択 --</option>
                  {myItems.map(i => <option key={i.id} value={i.id}>{i.name}（所持:{i.q}）</option>)}
                </select>
                {depId && (() => {
                  const have = myInventory[depId] ?? 0;
                  const cur  = chest.slots[depModal]?.amount ?? 0;
                  const max  = Math.min(have, CHEST_STACK_LIMIT - cur);
                  return (
                    <div>
                      <div style={{ fontSize:'0.72rem', color:'#8a92b2', marginBottom:6 }}>
                        スロット残量: {CHEST_STACK_LIMIT - cur}/{CHEST_STACK_LIMIT}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                        <span style={{ fontSize:'0.8rem', color:'#8a92b2' }}>個数</span>
                        <button style={sb} onClick={() => setDepAmt(a => Math.max(1,a-1))}>-</button>
                        <span style={{ minWidth:32, textAlign:'center' }}>{depAmt}</span>
                        <button style={sb} onClick={() => setDepAmt(a => Math.min(max,a+1))}>+</button>
                        <button style={sb} onClick={() => setDepAmt(max)}>MAX({max})</button>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display:'flex', gap:8 }}>
                  <button style={cb} onClick={() => setDepModal(null)}>キャンセル</button>
                  <button style={{ ...ok, opacity: depId ? 1 : 0.4 }} disabled={!depId}
                    onClick={() => { if (depId) { onDeposit(depModal!, depId, depAmt); setDepModal(null); } }}>預ける</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 取り出しモーダル */}
      {wdModal && (
        <div className="rpg-modal-backdrop" style={ov} onClick={() => setWdModal(null)}>
          <div className="rpg-modal-content" style={mw} onClick={e => e.stopPropagation()}>
            <div style={mtt}>📤 取り出す</div>
            <div style={{ marginBottom:10, fontSize:'0.85rem' }}>
              {ITEM_MASTER[wdModal.itemId]?.name ?? wdModal.itemId}
              <span style={{ color:'#8a92b2', marginLeft:8 }}>× {wdModal.max}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <button style={sb} onClick={() => setWdAmt(a => Math.max(1,a-1))}>-</button>
              <span style={{ minWidth:32, textAlign:'center' }}>{wdAmt}</span>
              <button style={sb} onClick={() => setWdAmt(a => Math.min(wdModal.max,a+1))}>+</button>
              <button style={sb} onClick={() => setWdAmt(wdModal.max)}>MAX</button>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button style={cb} onClick={() => setWdModal(null)}>キャンセル</button>
              <button style={ok} onClick={() => { onWithdraw(wdModal.idx, wdAmt); setWdModal(null); }}>取り出す</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── チェストカード ── */
function ChestCard({
  chest, myUid, myInventory, allPlayers,
  xferMode, xferSlot,
  onDeposit, onWithdraw, onMove, onDelete, onUpdateSettings,
  onExpand, onTogglePin, onStartXfer, onEndXfer,
}: {
  chest: Chest; myUid: string; myInventory: Record<string,number>;
  allPlayers: { uid: string; displayName: string }[];
  allMyChests?: Chest[];
  xferMode: boolean;
  xferSlot: { chestId: string; slotIdx: number } | null;
  onDeposit: (c: Chest, idx: number, id: string, amt: number) => void;
  onWithdraw: (c: Chest, idx: number, amt: number) => void;
  onMove: (cid: string, f: number, t: number) => void;
  onXferAcross?: (toChest: Chest, toIdx: number) => void;
  onDelete: (cid: string) => void;
  onUpdateSettings: (cid: string, patch: Partial<Pick<Chest,'name'|'icon'|'color'|'isShared'|'allowedUids'|'passwordHash'>>) => void;
  onExpand: (cid: string) => void;
  onTogglePin: (cid: string, idx: number) => void;
  onStartXfer: (cid: string, idx: number) => void;
  onEndXfer: (toChest: Chest, toIdx: number) => void;
}) {
  const isOwner = chest.ownerUid === myUid;
  const colors  = CHEST_COLOR_MAP[chest.color];
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [unlocked, setUnlocked] = useState(!chest.passwordHash);
  const [showUnlock, setShowUnlock] = useState(false);
  const [editName, setEditName]   = useState(chest.name);
  const [editIcon, setEditIcon]   = useState(chest.icon);
  const [editColor, setEditColor] = useState<ChestColor>(chest.color);
  const [editShared, setEditShared] = useState(chest.isShared);
  const [editAllowed, setEditAllowed] = useState<string[]>(chest.allowedUids);
  const [editPw, setEditPw]   = useState('');
  const [psearch, setPsearch] = useState('');
  const usedSlots = chest.slots.filter(Boolean).length;
  const slotCount = getSlotCount(chest);

  function handleOpen() {
    if (!unlocked && chest.passwordHash) { setShowUnlock(true); return; }
    setOpen(o => !o);
  }

  return (
    <div style={{ border:`2px solid ${colors.border}`, background:colors.bg, borderRadius:12, marginBottom:10, transition:'box-shadow 0.2s', boxShadow: open ? `0 0 18px ${colors.border}44` : 'none' }}>
      {/* ヘッダー */}
      <div onClick={handleOpen} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer' }}>
        <span style={{ fontSize:'1.4rem' }}>{chest.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:'0.9rem', color:'#e8e6ff', display:'flex', alignItems:'center', gap:6 }}>
            {chest.name}
            {chest.passwordHash && <span title="鍵あり" style={{ fontSize:'0.7rem' }}>🔒</span>}
            {chest.expanded && <span title="拡張済み" style={{ fontSize:'0.65rem', color:'#5b8dee' }}>54s</span>}
          </div>
          <div style={{ fontSize:'0.68rem', color:'#8a92b2', marginTop:1 }}>
            {chest.isShared ? <span style={{ color:'#5b8dee' }}>🌐 共有 </span> : <span style={{ color:'#4a5070' }}>🔒 個人 </span>}
            {usedSlots}/{slotCount}スロット
            {!isOwner && <span style={{ color:'#f0c060', marginLeft:6 }}>by {chest.ownerName}</span>}
          </div>
        </div>
        {chest.isShared && <button onClick={e => { e.stopPropagation(); setShowLog(true); }} style={{ ...sb, fontSize:'0.65rem', padding:'3px 8px' }}>📋 履歴</button>}
        <span style={{ color:'#4a5070' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && !editing && (
        <div style={{ padding:'0 12px 12px' }}>
          <SlotGrid
            chest={chest} myUid={myUid} myInventory={myInventory}
            xferMode={xferMode} xferSlot={xferSlot}
            onDeposit={(idx,id,amt) => onDeposit(chest,idx,id,amt)}
            onWithdraw={(idx,amt) => onWithdraw(chest,idx,amt)}
            onMove={(f,t) => onMove(chest.id,f,t)}
            onTogglePin={idx => onTogglePin(chest.id,idx)}
            onStartXfer={idx => onStartXfer(chest.id,idx)}
            onEndXfer={idx => onEndXfer(chest,idx)}
          />
          {isOwner && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
              <button style={{ ...sb, flex:1 }} onClick={() => setEditing(true)}>⚙️ 設定</button>
              {!chest.expanded && (
                <button style={{ ...sb, flex:1, borderColor:'#5b8dee', color:'#5b8dee' }}
                  onClick={() => onExpand(chest.id)}>
                  🔓 拡張 ({CHEST_EXPAND_COST.toLocaleString()}G)
                </button>
              )}
              <button style={{ ...sb, flex:1, borderColor:'#7a2020', color:'#e05555' }}
                onClick={() => { if (usedSlots>0){alert('チェストが空でないと削除できません');return;} if(confirm(`「${chest.name}」を削除しますか？`)) onDelete(chest.id); }}>
                🗑️ 削除
              </button>
            </div>
          )}
        </div>
      )}

      {/* 設定パネル */}
      {open && editing && (
        <div style={{ padding:'0 12px 12px' }}>
          <div style={{ marginBottom:8 }}><label style={lb}>名前</label><input value={editName} onChange={e=>setEditName(e.target.value.slice(0,20))} style={inp} /></div>
          <div style={{ marginBottom:8 }}>
            <label style={lb}>アイコン</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {ICON_OPTIONS.map(ic=>(
                <button key={ic} onClick={()=>setEditIcon(ic)} style={{ fontSize:'1.2rem', padding:'3px 5px', borderRadius:5, border:`2px solid ${editIcon===ic?'#f0c060':'#2d3752'}`, background:editIcon===ic?'rgba(240,192,96,0.15)':'transparent' }}>{ic}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:8 }}>
            <label style={lb}>カラー</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {COLOR_OPTIONS.map(([k,c])=>(
                <button key={k} onClick={()=>setEditColor(k)} title={c.label} style={{ width:26, height:26, borderRadius:5, border:`2px solid ${editColor===k?'#f0c060':c.border}`, background:c.bg }} />
              ))}
            </div>
          </div>
          <label style={{ ...lb, display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <input type="checkbox" checked={editShared} onChange={e=>setEditShared(e.target.checked)} /> 共有チェスト
          </label>
          {editShared && (
            <div style={{ marginBottom:8 }}>
              <label style={lb}>取り出し可能ユーザー（未選択=全員）</label>
              <input value={psearch} onChange={e=>setPsearch(e.target.value)} placeholder="名前検索…" style={{ ...inp, marginBottom:6 }} />
              <div style={{ maxHeight:110, overflowY:'auto', border:'1px solid #2d3752', borderRadius:6, padding:4 }}>
                {allPlayers.filter(p=>p.uid!==myUid&&p.displayName.toLowerCase().includes(psearch.toLowerCase())).map(p=>(
                  <label key={p.uid} style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 4px', fontSize:'0.75rem', cursor:'pointer' }}>
                    <input type="checkbox" checked={editAllowed.includes(p.uid)} onChange={e=>setEditAllowed(prev=>e.target.checked?[...prev,p.uid]:prev.filter(u=>u!==p.uid))} />
                    {p.displayName}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom:8 }}>
            <label style={lb}>新しいパスワード（空=解除）</label>
            <input type="password" value={editPw} onChange={e=>setEditPw(e.target.value)} style={inp} placeholder="パスワード…" />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={cb} onClick={()=>{setEditName(chest.name);setEditIcon(chest.icon);setEditColor(chest.color);setEditShared(chest.isShared);setEditAllowed(chest.allowedUids);setEditing(false);}}>キャンセル</button>
            <button style={ok} onClick={async()=>{
              if(!editName.trim()){alert('名前を入力してください');return;}
              const passwordHash = editPw ? await hashPassword(editPw) : (editPw===''&&chest.passwordHash ? undefined : chest.passwordHash);
              onUpdateSettings(chest.id,{name:editName.trim(),icon:editIcon,color:editColor,isShared:editShared,allowedUids:editAllowed,passwordHash});
              setEditing(false);
            }}>保存</button>
          </div>
        </div>
      )}

      {showLog && <LogModal chest={chest} onClose={()=>setShowLog(false)} />}
      {showUnlock && <UnlockModal chest={chest} onUnlock={()=>{setUnlocked(true);setShowUnlock(false);setOpen(true);}} onCancel={()=>setShowUnlock(false)} />}
    </div>
  );
}

/* ── メイン ── */
export function StorageScreen() {
  const player        = useGameStore(s => s.player);
  const addItems      = useGameStore(s => s.addItems);
  const consumeItem   = useGameStore(s => s.consumeItem);
  const changeGold    = useGameStore(s => s.changeGold);
  const addNotif      = useGameStore(s => s.addNotification);

  const [tab, setTab]             = useState<'mine'|'shared'>('mine');
  const [myChests, setMyChests]   = useState<Chest[]>([]);
  const [shared, setShared]       = useState<Chest[]>([]);
  const [allPlayers, setAllPlayers] = useState<{uid:string;displayName:string}[]>([]);
  const [creating, setCreating]   = useState(false);
  const [dragOrder, setDragOrder] = useState<string[]>([]);
  const [draggingChest, setDraggingChest] = useState<string|null>(null);
  const [xferSlot, setXferSlot]   = useState<{chestId:string;slotIdx:number}|null>(null);

  // 作成フォーム
  const [nName,    setNName]    = useState('');
  const [nIcon,    setNIcon]    = useState('📦');
  const [nColor,   setNColor]   = useState<ChestColor>('default');
  const [nShared,  setNShared]  = useState(false);
  const [nAllowed, setNAllowed] = useState<string[]>([]);
  const [nPw,      setNPw]      = useState('');
  const [psearch,  setPsearch]  = useState('');

  const uid = player?.uid ?? '';

  useEffect(() => {
    if (!uid) return;
    const u1 = subscribeMyChests(uid,   cs => { setMyChests(cs); setDragOrder(cs.map(c=>c.id)); });
    const u2 = subscribeSharedChests(   cs => setShared(cs));
    fetchAllPlayers().then(setAllPlayers);
    return () => { u1(); u2(); };
  }, [uid]);

  /* チェスト並び替え保存 */
  async function saveSortOrder(ids: string[]) {
    await updateSortOrders(ids.map((id,i)=>({ id, sortOrder:i })));
  }

  /* 預ける */
  async function handleDeposit(chest: Chest, idx: number, itemId: string, amount: number) {
    const have = player?.inventory[itemId] ?? 0;
    if (have < amount) { addNotif('error','所持数が足りません'); return; }
    const cur  = chest.slots[idx]?.amount ?? 0;
    if (cur + amount > CHEST_STACK_LIMIT) { addNotif('error',`スタック上限(${CHEST_STACK_LIMIT})を超えます`); return; }
    const name = ITEM_MASTER[itemId]?.name ?? itemId;
    const res  = await depositToChest(chest, idx, itemId, amount, uid, player?.displayName ?? '?', name);
    if (res.success) { consumeItem(itemId, amount); addNotif('success',`${name} × ${amount} 預けました`); }
    else addNotif('error', res.error ?? 'エラー');
  }

  /* 取り出す */
  async function handleWithdraw(chest: Chest, idx: number, amount: number) {
    const slot = chest.slots[idx];
    if (!slot) return;
    const name = ITEM_MASTER[slot.itemId]?.name ?? slot.itemId;
    const res  = await withdrawFromChest(chest, idx, amount, uid, player?.displayName ?? '?', name);
    if (res.success && res.itemId) { addItems([{ itemId: res.itemId, amount: res.amount! }]); addNotif('success',`${name} × ${res.amount} 取り出しました`); }
    else addNotif('error', res.error ?? 'エラー');
  }

  /* チェスト内移動 */
  async function handleMove(chestId: string, f: number, t: number) {
    await moveSlot(chestId, f, t);
  }

  /* チェスト間移動 */
  async function handleXferAcross(toChest: Chest, toIdx: number) {
    if (!xferSlot) return;
    const res = await moveAcrossChests(xferSlot.chestId, xferSlot.slotIdx, toChest.id, toIdx, uid, player?.displayName ?? '?');
    if (res.success) addNotif('success','移動しました');
    else addNotif('error', res.error ?? 'エラー');
    setXferSlot(null);
  }

  /* 作成 */
  async function handleCreate() {
    if (!nName.trim()) { addNotif('error','名前を入力してください'); return; }
    if (!changeGold(-CHEST_COST)) { addNotif('error','Gが不足しています'); return; }
    const res = await createChest(uid, player?.displayName ?? '?', nName.trim(), nIcon, nColor, nShared, nAllowed, nPw, myChests.length);
    if (res.success) {
      addNotif('success',`「${nName}」を作成しました`);
      setCreating(false); setNName(''); setNIcon('📦'); setNColor('default'); setNShared(false); setNAllowed([]); setNPw('');
    } else { changeGold(CHEST_COST); addNotif('error','作成失敗: '+res.error); }
  }

  /* 拡張 */
  async function handleExpand(chestId: string) {
    if (!changeGold(-CHEST_EXPAND_COST)) { addNotif('error','Gが不足しています'); return; }
    const ok2 = await expandChest(chestId);
    if (ok2) addNotif('success','チェストを54スロットに拡張しました');
    else { changeGold(CHEST_EXPAND_COST); addNotif('error','拡張失敗'); }
  }

  /* 設定更新 */
  async function handleUpdateSettings(chestId: string, patch: Partial<Pick<Chest,'name'|'icon'|'color'|'isShared'|'allowedUids'|'passwordHash'>>) {
    const ok2 = await updateChestSettings(chestId, patch);
    if (ok2) addNotif('success','設定を保存しました');
    else addNotif('error','保存失敗');
  }

  const othersShared = shared.filter(c => c.ownerUid !== uid);

  const ordered = dragOrder.map(id => myChests.find(c=>c.id===id)).filter(Boolean) as Chest[];

  const commonProps = {
    myUid: uid,
    myInventory: player?.inventory ?? {},
    allPlayers,
    allMyChests: myChests,
    xferMode: !!xferSlot,
    xferSlot,
    onDeposit: handleDeposit,
    onWithdraw: handleWithdraw,
    onMove: handleMove,
    onXferAcross: handleXferAcross,
    onDelete: async (cid: string) => { const ok2 = await deleteChest(cid); if(ok2) addNotif('info','削除しました'); else addNotif('error','削除失敗'); },
    onUpdateSettings: handleUpdateSettings,
    onExpand: handleExpand,
    onTogglePin: async (cid: string, idx: number) => { await togglePin(cid, idx); },
    onStartXfer: (cid: string, idx: number) => { setXferSlot({ chestId:cid, slotIdx:idx }); addNotif('info','移動先のスロットをクリックしてください（右クリック→キャンセル）'); },
    onEndXfer: handleXferAcross,
  };

  const filteredForNew = allPlayers.filter(p => p.uid!==uid && p.displayName.toLowerCase().includes(psearch.toLowerCase()));

  return (
    <div className="screen" style={{ padding:'14px 12px 80px' }} onClick={()=>{ if(xferSlot) setXferSlot(null); }}>
      {/* ヘッダー */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <span style={{ fontSize:'1.5rem' }}>📦</span>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'#f0c060' }}>ストレージ</div>
          <div style={{ fontSize:'0.7rem', color:'#8a92b2' }}>チェストに仕分けして保管・共有</div>
        </div>
        {xferSlot && (
          <div style={{ marginLeft:'auto', background:'rgba(240,192,96,0.15)', border:'1px solid #f0c060', borderRadius:8, padding:'4px 10px', fontSize:'0.72rem', color:'#f0c060' }}>
            🔀 移動先を選択中 — ESC/タップでキャンセル
          </div>
        )}
      </div>

      {/* タブ */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>

        {([['mine','🔒 マイチェスト'],['shared','🌐 共有チェスト']] as const).map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:'8px 0', borderRadius:8, fontWeight:700, fontSize:'0.82rem', border:`2px solid ${tab===id?'#5b8dee':'#2d3752'}`, background:tab===id?'rgba(91,141,238,0.15)':'transparent', color:tab===id?'#5b8dee':'#8a92b2' }}>{label}</button>
        ))}
      </div>

      {tab==='mine' && (
        <>
          {/* 新規作成 */}
          {!creating ? (
            <button onClick={()=>setCreating(true)} style={{ width:'100%', padding:10, marginBottom:14, borderRadius:10, border:'2px dashed #2d3752', background:'transparent', color:'#5b8dee', fontWeight:700, fontSize:'0.85rem' }}>
              ＋ 新しいチェストを作る（{CHEST_COST.toLocaleString()}G）
            </button>
          ) : (
            <div style={{ background:'#161b26', border:'2px solid #2d3752', borderRadius:12, padding:14, marginBottom:14 }}>
              <div style={{ fontWeight:700, marginBottom:10, color:'#f0c060' }}>📦 チェスト作成</div>
              <div style={{ marginBottom:8 }}><label style={lb}>名前（最大20文字）</label><input value={nName} onChange={e=>setNName(e.target.value.slice(0,20))} style={inp} placeholder="チェスト名…" /></div>
              <div style={{ marginBottom:8 }}>
                <label style={lb}>アイコン</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {ICON_OPTIONS.map(ic=><button key={ic} onClick={()=>setNIcon(ic)} style={{ fontSize:'1.2rem', padding:'3px 5px', borderRadius:5, border:`2px solid ${nIcon===ic?'#f0c060':'#2d3752'}`, background:nIcon===ic?'rgba(240,192,96,0.15)':'transparent' }}>{ic}</button>)}
                </div>
              </div>
              <div style={{ marginBottom:8 }}>
                <label style={lb}>カラー</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {COLOR_OPTIONS.map(([k,c])=><button key={k} onClick={()=>setNColor(k)} title={c.label} style={{ width:26, height:26, borderRadius:5, border:`2px solid ${nColor===k?'#f0c060':c.border}`, background:c.bg }} />)}
                </div>
              </div>
              <label style={{ ...lb, display:'flex', alignItems:'center', gap:8, marginBottom:8 }}><input type="checkbox" checked={nShared} onChange={e=>setNShared(e.target.checked)} /> 共有チェストにする</label>
              {nShared && (
                <div style={{ marginBottom:8 }}>
                  <label style={lb}>取り出し可能ユーザー（未選択=全員）</label>
                  <input value={psearch} onChange={e=>setPsearch(e.target.value)} placeholder="名前検索…" style={{ ...inp, marginBottom:6 }} />
                  <div style={{ maxHeight:100, overflowY:'auto', border:'1px solid #2d3752', borderRadius:6, padding:4 }}>
                    {filteredForNew.map(p=>(
                      <label key={p.uid} style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 4px', fontSize:'0.75rem', cursor:'pointer' }}>
                        <input type="checkbox" checked={nAllowed.includes(p.uid)} onChange={e=>setNAllowed(prev=>e.target.checked?[...prev,p.uid]:prev.filter(u=>u!==p.uid))} />
                        {p.displayName}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom:8 }}><label style={lb}>パスワード（任意）</label><input type="password" value={nPw} onChange={e=>setNPw(e.target.value)} style={inp} placeholder="設定しない場合は空欄" /></div>
              <div style={{ fontSize:'0.75rem', color:'#8a92b2', marginBottom:10 }}>
                💰 作成費用: <span style={{ color:'#f0c060', fontWeight:700 }}>{CHEST_COST.toLocaleString()}G</span>　所持: <span style={{ color:'#f0c060' }}>{(player?.gold??0).toLocaleString()}G</span>
              </div>
              <div style={{ display:'flex', gap:8 }}><button style={cb} onClick={()=>setCreating(false)}>キャンセル</button><button style={ok} onClick={handleCreate}>作成する</button></div>
            </div>
          )}

          {ordered.length===0 && !creating && (
            <div style={{ textAlign:'center', color:'#4a5070', padding:32, fontSize:'0.85rem' }}>まだチェストがありません</div>
          )}

          {/* チェスト並び替えドラッグ */}
          {ordered.map(chest=>(
            <div
              key={chest.id}
              draggable
              onDragStart={()=>setDraggingChest(chest.id)}
              onDragOver={e=>{ e.preventDefault(); }}
              onDrop={()=>{
                if(!draggingChest||draggingChest===chest.id)return;
                const arr=[...dragOrder];
                const fi=arr.indexOf(draggingChest),ti=arr.indexOf(chest.id);
                arr.splice(fi,1); arr.splice(ti,0,draggingChest);
                setDragOrder(arr); setDraggingChest(null);
                saveSortOrder(arr);
              }}
              onDragEnd={()=>setDraggingChest(null)}
              style={{ opacity: draggingChest===chest.id ? 0.5 : 1, cursor:'grab' }}
            >
              <ChestCard chest={chest} {...commonProps} />
            </div>
          ))}
        </>
      )}

      {tab==='shared' && (
        <>
          {othersShared.length===0 ? (
            <div style={{ textAlign:'center', color:'#4a5070', padding:32, fontSize:'0.85rem' }}>共有チェストはまだありません</div>
          ) : (
            othersShared.map(chest=><ChestCard key={chest.id} chest={chest} {...commonProps} />)
          )}
        </>
      )}
    </div>
  );
}
