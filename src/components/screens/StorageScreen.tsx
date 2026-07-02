// src/components/screens/StorageScreen.tsx

import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import {
  subscribeMyChests, subscribeSharedChests,
  createChest, deleteChest,
  depositToChest, withdrawFromChest, moveSlot,
  updateChestSettings, canWithdraw, fetchAllPlayers,
} from '../../services/storageService';
import {
  CHEST_SLOTS, CHEST_COST,
  CHEST_COLOR_MAP,
  type Chest, type ChestColor, type ChestSlot,
} from '../../types/storage';

// ============================================================
// 定数
// ============================================================
const ICON_OPTIONS = ['📦','🧰','🗃️','💰','⚔️','🛡️','🧪','💎','🌿','🔮','🗝️','🎁','🏺','🪙','🧲'];
const COLOR_OPTIONS = Object.entries(CHEST_COLOR_MAP) as [ChestColor, typeof CHEST_COLOR_MAP[ChestColor]][];

// ============================================================
// サブコンポーネント: スロットグリッド
// ============================================================
function SlotGrid({
  chest, myUid, myInventory,
  onDeposit, onWithdraw, onMove,
}: {
  chest: Chest;
  myUid: string;
  myInventory: Record<string, number>;
  onDeposit: (slotIdx: number, itemId: string, amount: number) => void;
  onWithdraw: (slotIdx: number, amount: number) => void;
  onMove: (from: number, to: number) => void;
}) {
  const isOwner = chest.ownerUid === myUid;
  const canTake = canWithdraw(chest, myUid);
  const [dragging, setDragging] = useState<number | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const [depositModal, setDepositModal] = useState<{ slotIdx: number } | null>(null);
  const [withdrawModal, setWithdrawModal] = useState<{ slotIdx: number; slot: ChestSlot } | null>(null);
  const [depositItemId, setDepositItemId] = useState('');
  const [depositAmt, setDepositAmt] = useState(1);
  const [withdrawAmt, setWithdrawAmt] = useState(1);

  const myItems = Object.entries(myInventory)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => ({ id, q, name: ITEM_MASTER[id]?.name ?? id, icon: ITEM_MASTER[id]?.icon ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      {/* スロットグリッド 9x3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 4, marginBottom: 10 }}>
        {chest.slots.map((slot, idx) => {
          const isDrag = dragging === idx;
          const isHover = hoverSlot === idx;
          const master = slot ? ITEM_MASTER[slot.itemId] : null;
          return (
            <div
              key={idx}
              draggable={!!slot && isOwner}
              onDragStart={() => setDragging(idx)}
              onDragEnd={() => { setDragging(null); setHoverSlot(null); }}
              onDragOver={e => { e.preventDefault(); setHoverSlot(idx); }}
              onDrop={() => {
                if (dragging !== null && dragging !== idx) onMove(dragging, idx);
                setDragging(null); setHoverSlot(null);
              }}
              onClick={() => {
                if (slot && canTake) {
                  setWithdrawAmt(1);
                  setWithdrawModal({ slotIdx: idx, slot });
                } else if (!slot && isOwner) {
                  setDepositItemId('');
                  setDepositAmt(1);
                  setDepositModal({ slotIdx: idx });
                }
              }}
              title={slot ? `${master?.name ?? slot.itemId} x${slot.amount}` : (isOwner ? 'クリックで預ける' : '')}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: 6,
                border: `2px solid ${isDrag ? '#f0c060' : isHover ? '#5b8dee' : '#2d3752'}`,
                background: isDrag ? 'rgba(240,192,96,0.1)' : isHover ? 'rgba(91,141,238,0.12)' : '#0d1018',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: slot ? (canTake ? 'pointer' : 'default') : (isOwner ? 'pointer' : 'default'),
                position: 'relative', fontSize: '1.1rem', transition: 'border-color 0.15s',
                opacity: isDrag ? 0.5 : 1,
              }}
            >
              {slot ? (
                <>
                  <span style={{ fontSize: '1.15rem' }}>{master?.icon ? getItemEmoji(master.icon) : '📦'}</span>
                  <span style={{
                    position: 'absolute', bottom: 2, right: 3,
                    fontSize: '0.55rem', fontWeight: 800, color: '#f0c060', lineHeight: 1,
                  }}>{slot.amount}</span>
                </>
              ) : (
                <span style={{ color: '#2d3752', fontSize: '0.8rem' }}>·</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 預けるモーダル */}
      {depositModal && (
        <div className="rpg-modal-backdrop" style={overlayStyle} onClick={() => setDepositModal(null)}>
          <div className="rpg-modal-content" style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={modalTitle}>📥 アイテムを預ける</div>
            <div style={{ marginBottom: 8, fontSize: '0.75rem', color: '#8a92b2' }}>スロット {depositModal.slotIdx + 1}</div>
            {myItems.length === 0 ? (
              <div style={{ color: '#4a5070', fontSize: '0.8rem' }}>所持アイテムがありません</div>
            ) : (
              <>
                <select
                  value={depositItemId}
                  onChange={e => { setDepositItemId(e.target.value); setDepositAmt(1); }}
                  style={selectStyle}
                >
                  <option value="">-- アイテムを選択 --</option>
                  {myItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name} (所持: {item.q})</option>
                  ))}
                </select>
                {depositItemId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: '#8a92b2' }}>個数</span>
                    <button style={smBtn} onClick={() => setDepositAmt(a => Math.max(1, a - 1))}>-</button>
                    <span style={{ minWidth: 32, textAlign: 'center', fontSize: '0.9rem' }}>{depositAmt}</span>
                    <button style={smBtn} onClick={() => setDepositAmt(a => Math.min(myInventory[depositItemId] ?? 1, a + 1))}>+</button>
                    <button style={smBtn} onClick={() => setDepositAmt(myInventory[depositItemId] ?? 1)}>MAX</button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button style={cancelBtn} onClick={() => setDepositModal(null)}>キャンセル</button>
                  <button
                    style={{ ...confirmBtn, opacity: depositItemId ? 1 : 0.4 }}
                    disabled={!depositItemId}
                    onClick={() => {
                      if (!depositItemId) return;
                      onDeposit(depositModal.slotIdx, depositItemId, depositAmt);
                      setDepositModal(null);
                    }}
                  >預ける</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 取り出すモーダル */}
      {withdrawModal && (
        <div className="rpg-modal-backdrop" style={overlayStyle} onClick={() => setWithdrawModal(null)}>
          <div className="rpg-modal-content" style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={modalTitle}>📤 アイテムを取り出す</div>
            <div style={{ marginBottom: 10, fontSize: '0.85rem' }}>
              {ITEM_MASTER[withdrawModal.slot.itemId]?.name ?? withdrawModal.slot.itemId}
              <span style={{ color: '#8a92b2', marginLeft: 8 }}>× {withdrawModal.slot.amount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#8a92b2' }}>個数</span>
              <button style={smBtn} onClick={() => setWithdrawAmt(a => Math.max(1, a - 1))}>-</button>
              <span style={{ minWidth: 32, textAlign: 'center', fontSize: '0.9rem' }}>{withdrawAmt}</span>
              <button style={smBtn} onClick={() => setWithdrawAmt(a => Math.min(withdrawModal.slot.amount, a + 1))}>+</button>
              <button style={smBtn} onClick={() => setWithdrawAmt(withdrawModal.slot.amount)}>MAX</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={cancelBtn} onClick={() => setWithdrawModal(null)}>キャンセル</button>
              <button style={confirmBtn} onClick={() => {
                onWithdraw(withdrawModal.slotIdx, withdrawAmt);
                setWithdrawModal(null);
              }}>取り出す</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// チェストカード
// ============================================================
function ChestCard({
  chest, myUid, myInventory,
  allPlayers,
  onDeposit, onWithdraw, onMove, onDelete, onUpdateSettings,
}: {
  chest: Chest; myUid: string; myInventory: Record<string, number>;
  allPlayers: { uid: string; displayName: string }[];
  onDeposit: (chestId: string, slotIdx: number, itemId: string, amount: number) => void;
  onWithdraw: (chestId: string, slotIdx: number, amount: number) => void;
  onMove: (chestId: string, from: number, to: number) => void;
  onDelete: (chestId: string) => void;
  onUpdateSettings: (chestId: string, patch: Partial<Pick<Chest, 'name'|'icon'|'color'|'isShared'|'allowedUids'>>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(chest.name);
  const [editIcon, setEditIcon] = useState(chest.icon);
  const [editColor, setEditColor] = useState<ChestColor>(chest.color);
  const [editShared, setEditShared] = useState(chest.isShared);
  const [editAllowed, setEditAllowed] = useState<string[]>(chest.allowedUids);
  const [playerSearch, setPlayerSearch] = useState('');

  const isOwner = chest.ownerUid === myUid;
  const canTake = canWithdraw(chest, myUid);
  const colors = CHEST_COLOR_MAP[chest.color];
  const usedSlots = chest.slots.filter(Boolean).length;

  const filteredPlayers = allPlayers.filter(p =>
    p.uid !== myUid &&
    p.displayName.toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <div style={{
      border: `2px solid ${colors.border}`,
      background: colors.bg,
      borderRadius: 12, marginBottom: 12,
      transition: 'box-shadow 0.2s',
      boxShadow: open ? `0 0 18px ${colors.border}44` : 'none',
    }}>
      {/* ヘッダー */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>{chest.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#e8e6ff' }}>{chest.name}</div>
          <div style={{ fontSize: '0.7rem', color: '#8a92b2', marginTop: 2 }}>
            {chest.isShared ? (
              <span style={{ color: '#5b8dee' }}>🌐 共有 </span>
            ) : (
              <span style={{ color: '#4a5070' }}>🔒 個人 </span>
            )}
            {usedSlots}/{CHEST_SLOTS}スロット使用
            {!isOwner && <span style={{ marginLeft: 6, color: '#f0c060' }}>by {chest.ownerName}</span>}
          </div>
        </div>
        <span style={{ color: '#4a5070', fontSize: '0.9rem' }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* 中身 */}
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          {!editing ? (
            <>
              <SlotGrid
                chest={chest} myUid={myUid} myInventory={myInventory}
                onDeposit={(idx, id, amt) => onDeposit(chest.id, idx, id, amt)}
                onWithdraw={(idx, amt) => onWithdraw(chest.id, idx, amt)}
                onMove={(f, t) => onMove(chest.id, f, t)}
              />
              {isOwner && (
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button style={{ ...smBtn, flex: 1 }} onClick={() => setEditing(true)}>⚙️ 設定</button>
                  <button
                    style={{ ...smBtn, flex: 1, borderColor: '#7a2020', color: '#e05555' }}
                    onClick={() => {
                      if (usedSlots > 0) { alert('チェストが空でないと削除できません'); return; }
                      if (confirm(`「${chest.name}」を削除しますか？`)) onDelete(chest.id);
                    }}
                  >🗑️ 削除</button>
                </div>
              )}
              {!isOwner && !canTake && (
                <div style={{ fontSize: '0.72rem', color: '#4a5070', textAlign: 'center', marginTop: 4 }}>
                  👁️ 閲覧のみ（取り出し権限なし）
                </div>
              )}
            </>
          ) : (
            /* 設定パネル */
            <div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>チェスト名</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value.slice(0, 20))}
                  style={inputStyle}
                  placeholder="最大20文字"
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>アイコン</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ICON_OPTIONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setEditIcon(ic)}
                      style={{
                        fontSize: '1.3rem', padding: '4px 6px', borderRadius: 6,
                        border: `2px solid ${editIcon === ic ? '#f0c060' : '#2d3752'}`,
                        background: editIcon === ic ? 'rgba(240,192,96,0.15)' : 'transparent',
                      }}
                    >{ic}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>テーマカラー</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {COLOR_OPTIONS.map(([key, c]) => (
                    <button
                      key={key}
                      onClick={() => setEditColor(key)}
                      title={c.label}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: `2px solid ${editColor === key ? '#f0c060' : c.border}`,
                        background: c.bg,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={editShared}
                    onChange={e => setEditShared(e.target.checked)}
                  />
                  共有チェストにする
                </label>
              </div>
              {editShared && (
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>取り出し可能なプレイヤー（未選択=全員）</label>
                  <input
                    value={playerSearch}
                    onChange={e => setPlayerSearch(e.target.value)}
                    placeholder="名前で検索…"
                    style={{ ...inputStyle, marginBottom: 6 }}
                  />
                  <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #2d3752', borderRadius: 6, padding: 4 }}>
                    {filteredPlayers.map(p => (
                      <label key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px', cursor: 'pointer', fontSize: '0.78rem' }}>
                        <input
                          type="checkbox"
                          checked={editAllowed.includes(p.uid)}
                          onChange={e => setEditAllowed(prev =>
                            e.target.checked ? [...prev, p.uid] : prev.filter(u => u !== p.uid)
                          )}
                        />
                        {p.displayName}
                      </label>
                    ))}
                    {filteredPlayers.length === 0 && (
                      <div style={{ color: '#4a5070', fontSize: '0.75rem', padding: 4 }}>該当なし</div>
                    )}
                  </div>
                  {editAllowed.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: '0.7rem', color: '#5b8dee' }}>
                      {editAllowed.length}人を指定中
                      <button style={{ ...smBtn, marginLeft: 8, fontSize: '0.65rem', padding: '1px 6px' }} onClick={() => setEditAllowed([])}>全解除</button>
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button style={cancelBtn} onClick={() => {
                  setEditName(chest.name); setEditIcon(chest.icon); setEditColor(chest.color);
                  setEditShared(chest.isShared); setEditAllowed(chest.allowedUids);
                  setEditing(false);
                }}>キャンセル</button>
                <button style={confirmBtn} onClick={() => {
                  if (!editName.trim()) { alert('名前を入力してください'); return; }
                  onUpdateSettings(chest.id, {
                    name: editName.trim(), icon: editIcon, color: editColor,
                    isShared: editShared, allowedUids: editAllowed,
                  });
                  setEditing(false);
                }}>保存</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// メイン画面
// ============================================================
export function StorageScreen() {
  const player = useGameStore(s => s.player);
  const addItems = useGameStore(s => s.addItems);
  const consumeItem = useGameStore(s => s.consumeItem);
  const changeGold = useGameStore(s => s.changeGold);
  const addNotification = useGameStore(s => s.addNotification);

  const [tab, setTab] = useState<'mine' | 'shared'>('mine');
  const [myChests, setMyChests] = useState<Chest[]>([]);
  const [sharedChests, setSharedChests] = useState<Chest[]>([]);
  const [allPlayers, setAllPlayers] = useState<{ uid: string; displayName: string }[]>([]);
  const [creating, setCreating] = useState(false);

  // 作成フォーム
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newColor, setNewColor] = useState<ChestColor>('default');
  const [newShared, setNewShared] = useState(false);
  const [newAllowed, setNewAllowed] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');

  const uid = player?.uid ?? '';

  useEffect(() => {
    if (!uid) return;
    const unsub1 = subscribeMyChests(uid, setMyChests);
    const unsub2 = subscribeSharedChests(setSharedChests);
    fetchAllPlayers().then(setAllPlayers);
    return () => { unsub1(); unsub2(); };
  }, [uid]);

  // 他人が作った共有チェスト（自分のは「マイチェスト」タブで表示）
  const othersShared = sharedChests.filter(c => c.ownerUid !== uid);

  async function handleCreate() {
    if (!newName.trim()) { addNotification('error', '名前を入力してください'); return; }
    if (!changeGold(-CHEST_COST)) { addNotification('error', 'Gが不足しています'); return; }
    const res = await createChest(uid, player?.displayName ?? '?', newName.trim(), newIcon, newColor, newShared, newAllowed);
    if (res.success) {
      addNotification('success', `「${newName}」を作成しました`);
      setCreating(false); setNewName(''); setNewIcon('📦'); setNewColor('default'); setNewShared(false); setNewAllowed([]);
    } else {
      changeGold(CHEST_COST); // 返金
      addNotification('error', '作成に失敗しました: ' + res.error);
    }
  }

  async function handleDeposit(chestId: string, slotIdx: number, itemId: string, amount: number) {
    const have = player?.inventory[itemId] ?? 0;
    if (have < amount) { addNotification('error', '所持数が足りません'); return; }
    const res = await depositToChest(chestId, slotIdx, itemId, amount);
    if (res.success) {
      consumeItem(itemId, amount);
      addNotification('success', `${ITEM_MASTER[itemId]?.name ?? itemId} x${amount} を預けました`);
    } else {
      addNotification('error', res.error ?? 'エラー');
    }
  }

  async function handleWithdraw(chestId: string, slotIdx: number, amount: number) {
    const res = await withdrawFromChest(chestId, slotIdx, amount);
    if (res.success && res.itemId) {
      addItems([{ itemId: res.itemId, amount: res.amount! }]);
      addNotification('success', `${ITEM_MASTER[res.itemId]?.name ?? res.itemId} x${res.amount} を取り出しました`);
    } else {
      addNotification('error', res.error ?? 'エラー');
    }
  }

  async function handleMove(chestId: string, from: number, to: number) {
    await moveSlot(chestId, from, to);
  }

  async function handleDelete(chestId: string) {
    const ok = await deleteChest(chestId);
    if (ok) addNotification('info', 'チェストを削除しました');
    else addNotification('error', '削除に失敗しました');
  }

  async function handleUpdateSettings(chestId: string, patch: Partial<Pick<Chest,'name'|'icon'|'color'|'isShared'|'allowedUids'>>) {
    const ok = await updateChestSettings(chestId, patch);
    if (ok) addNotification('success', '設定を保存しました');
    else addNotification('error', '保存に失敗しました');
  }

  const commonProps = {
    myUid: uid,
    myInventory: player?.inventory ?? {},
    allPlayers,
    onDeposit: handleDeposit,
    onWithdraw: handleWithdraw,
    onMove: handleMove,
    onDelete: handleDelete,
    onUpdateSettings: handleUpdateSettings,
  };

  const filteredForNew = allPlayers.filter(p =>
    p.uid !== uid && p.displayName.toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <div className="screen" style={{ padding: '14px 12px 80px' }}>
      {/* タイトル */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: '1.6rem' }}>📦</span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#f0c060' }}>ストレージ</div>
          <div style={{ fontSize: '0.72rem', color: '#8a92b2' }}>チェストにアイテムを保管・共有できます</div>
        </div>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {([['mine','🔒 マイチェスト'],['shared','🌐 共有チェスト']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
              border: `2px solid ${tab === id ? '#5b8dee' : '#2d3752'}`,
              background: tab === id ? 'rgba(91,141,238,0.15)' : 'transparent',
              color: tab === id ? '#5b8dee' : '#8a92b2',
            }}
          >{label}</button>
        ))}
      </div>

      {tab === 'mine' && (
        <>
          {/* 新規作成ボタン */}
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              style={{
                width: '100%', padding: '10px', marginBottom: 14, borderRadius: 10,
                border: '2px dashed #2d3752', background: 'transparent',
                color: '#5b8dee', fontWeight: 700, fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              ＋ 新しいチェストを作る（{CHEST_COST.toLocaleString()}G）
            </button>
          ) : (
            <div style={{
              background: '#161b26', border: '2px solid #2d3752',
              borderRadius: 12, padding: 14, marginBottom: 14,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: '#f0c060' }}>📦 チェスト作成</div>
              <div style={{ marginBottom: 8 }}>
                <label style={labelStyle}>名前（最大20文字）</label>
                <input value={newName} onChange={e => setNewName(e.target.value.slice(0,20))} style={inputStyle} placeholder="チェスト名…" />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={labelStyle}>アイコン</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ICON_OPTIONS.map(ic => (
                    <button key={ic} onClick={() => setNewIcon(ic)} style={{
                      fontSize: '1.3rem', padding: '4px 6px', borderRadius: 6,
                      border: `2px solid ${newIcon === ic ? '#f0c060' : '#2d3752'}`,
                      background: newIcon === ic ? 'rgba(240,192,96,0.15)' : 'transparent',
                    }}>{ic}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={labelStyle}>テーマカラー</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {COLOR_OPTIONS.map(([key, c]) => (
                    <button key={key} onClick={() => setNewColor(key)} title={c.label} style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: `2px solid ${newColor === key ? '#f0c060' : c.border}`,
                      background: c.bg,
                    }} />
                  ))}
                </div>
              </div>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input type="checkbox" checked={newShared} onChange={e => setNewShared(e.target.checked)} />
                共有チェストにする
              </label>
              {newShared && (
                <div style={{ marginBottom: 8 }}>
                  <label style={labelStyle}>取り出し可能なプレイヤー（未選択=全員）</label>
                  <input
                    value={playerSearch}
                    onChange={e => setPlayerSearch(e.target.value)}
                    placeholder="名前で検索…"
                    style={{ ...inputStyle, marginBottom: 6 }}
                  />
                  <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #2d3752', borderRadius: 6, padding: 4 }}>
                    {filteredForNew.map(p => (
                      <label key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px', cursor: 'pointer', fontSize: '0.78rem' }}>
                        <input
                          type="checkbox"
                          checked={newAllowed.includes(p.uid)}
                          onChange={e => setNewAllowed(prev =>
                            e.target.checked ? [...prev, p.uid] : prev.filter(u => u !== p.uid)
                          )}
                        />
                        {p.displayName}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginBottom: 10 }}>
                💰 作成費用: <span style={{ color: '#f0c060', fontWeight: 700 }}>{CHEST_COST.toLocaleString()}G</span>
                　所持: <span style={{ color: '#f0c060' }}>{(player?.gold ?? 0).toLocaleString()}G</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={cancelBtn} onClick={() => setCreating(false)}>キャンセル</button>
                <button style={confirmBtn} onClick={handleCreate}>作成する</button>
              </div>
            </div>
          )}

          {myChests.length === 0 && !creating && (
            <div style={{ textAlign: 'center', color: '#4a5070', padding: 32, fontSize: '0.85rem' }}>
              まだチェストがありません<br />
              <span style={{ fontSize: '0.75rem' }}>「＋ 新しいチェストを作る」から作成できます</span>
            </div>
          )}

          {myChests.map(chest => (
            <ChestCard key={chest.id} chest={chest} {...commonProps} />
          ))}
        </>
      )}

      {tab === 'shared' && (
        <>
          {othersShared.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#4a5070', padding: 32, fontSize: '0.85rem' }}>
              共有チェストはまだありません
            </div>
          ) : (
            othersShared.map(chest => (
              <ChestCard key={chest.id} chest={chest} {...commonProps} />
            ))
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// ユーティリティ
// ============================================================
function getItemEmoji(icon: string): string {
  const map: Record<string, string> = {
    log:'🪵', rock:'🪨', ore_black:'⚫', coal:'🖤', sparkle:'✨', emerald:'💚',
    ore_green:'🟢', gem_blue:'💎', herb:'🌿', flower:'🌸', mushroom:'🍄',
    fish:'🐟', meat:'🍖', potion:'🧪', sword:'⚔️', shield:'🛡️', bow:'🏹',
    hammer:'🔨', pickaxe:'⛏️', scroll:'📜', gem:'💎', crystal:'🔷', bone:'🦴',
    feather:'🪶', scale:'🐉', claw:'🦅', thread:'🧵', cloth:'🪢', leather:'🟫',
    coin:'🪙', ticket:'🎟️', key:'🗝️', chest:'📦', bag:'🎒', book:'📚',
  };
  return map[icon] ?? '📦';
}

// スタイル定数
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
};
const modalStyle: React.CSSProperties = {
  background: '#161b26', border: '2px solid #2d3752',
  borderRadius: 14, padding: 20, minWidth: 260, maxWidth: 340,
};
const modalTitle: React.CSSProperties = {
  fontWeight: 800, fontSize: '0.95rem', color: '#f0c060', marginBottom: 12,
};
const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem', color: '#8a92b2', display: 'block', marginBottom: 4, fontWeight: 600,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 7,
  background: '#0d1018', border: '1px solid #2d3752',
  color: '#e8e6ff', fontSize: '0.85rem',
};
const selectStyle: React.CSSProperties = {
  ...inputStyle, width: '100%',
};
const smBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem',
  border: '1px solid #2d3752', background: '#0d1018', color: '#e8e6ff',
};
const cancelBtn: React.CSSProperties = {
  flex: 1, padding: '8px', borderRadius: 8, fontSize: '0.82rem',
  border: '1px solid #2d3752', background: '#0d1018', color: '#8a92b2',
};
const confirmBtn: React.CSSProperties = {
  flex: 1, padding: '8px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
  border: 'none', background: 'linear-gradient(135deg,#5b8dee,#3d6fd0)', color: '#fff',
};
