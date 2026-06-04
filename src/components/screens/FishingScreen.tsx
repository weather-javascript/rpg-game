// src/components/screens/FishingScreen.tsx
// 釣りシステム：Wiki準拠のFFGG・GGR・通常釣りを実装

import { useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { secureRandom, randomIntRange, randomChance, drawFromTableSecure } from '../../utils/random';
import { GATHER_NODE_MASTER, ITEM_MASTER, FISHING_RODS } from '../../data/masters';
import type { GatherNodeMaster } from '../../types/game';

// 釣り竿ごとに解放されるノードのマッピング
const ROD_NODE_MAP: Record<string, string> = {
  basic_rod:   'fishing_pond',
  ore_rod:     'fishing_ore_pond',
  all_rod_x:   'fishing_ticket_pond',
  master_rod:  'fishing_master_pond',
  master_rod_z:'fishing_master_pond',
  ffgg_rod_r1: 'fishing_ffgg_pond',
  ffgg_rod_r3: 'fishing_ffgg_pond',
  ffgg_rod_r6: 'fishing_ffgg_pond',
  ffggr_rod:   'fishing_ggr_pond',
};

function calcFishingResult(node: GatherNodeMaster, fishingLv: number, buffBonus: number) {
  const drops: { itemId: string; amount: number }[] = [];
  for (const drop of node.drops) {
    const rate = Math.min(1.0, (drop.baseRate + (drop.skillRateBonus ?? 0) * fishingLv) * buffBonus);
    if (randomChance(rate)) {
      const amount = randomIntRange(drop.minAmount, drop.maxAmount);
      drops.push({ itemId: drop.itemId, amount });
    }
  }
  const expGained = 8 + fishingLv * 2;
  return { drops, expGained };
}

// FF小判⇒大判交換レート（1大判 = 100小判）
const COIN_EXCHANGE_RATE = 100;

// 釣りチケット⇒Yリアクター変換チェーン
const TICKET_TO_TOTEM = 50;  // 釣りチケット50枚→不死のトーテム1つ
const TOTEM_TO_REACTOR = 5;  // 不死のトーテム5つ→Yリアクター1つ

interface FeverState {
  active: boolean;
  remaining: number;
  scoreBonus: number;
}

export function FishingScreen() {
  const player = useGameStore(s => s.player);
  const addItems = useGameStore(s => s.addItems);
  const consumeItem = useGameStore(s => s.consumeItem);
  const changeSatiety = useGameStore(s => s.changeSatiety);
  const addSkillExp = useGameStore(s => s.addSkillExp);
  const addExp = useGameStore(s => s.addExp);
  const changeGold = useGameStore(s => s.changeGold);
  const addNotification = useGameStore(s => s.addNotification);
  const equipRod = useGameStore(s => s.equipRod);
  const addFishingScore = useGameStore(s => s.addFishingScore);
  const getActiveBuffBonus = useGameStore(s => s.getActiveBuffBonus);
  const addBuff = useGameStore(s => s.addBuff);

  const [log, setLog] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [activeTab, setActiveTab] = useState<'fish' | 'rod' | 'exchange' | 'commands'>('fish');
  const [fever, setFever] = useState<FeverState>({ active: false, remaining: 0, scoreBonus: 1 });
  const [feverMissCount, setFeverMissCount] = useState(0);

  // フィーバー判定
  const checkFever = useCallback(() => {
    if (fever.active) return;
    // ミス回数が増えるほど発生しやすく（最大30%）
    const feverRate = Math.min(0.30, 0.02 + feverMissCount * 0.005);
    if (randomChance(feverRate)) {
      setFever({ active: true, remaining: 100, scoreBonus: 2 });
      setFeverMissCount(0);
      addNotification('success', '🔥 釣りフィーバー発動！スコア2倍・特別ドロップ確率UP！');
    } else {
      setFeverMissCount(prev => prev + 1);
    }
  }, [fever.active, feverMissCount, addNotification]);

  const equippedRodId = player?.equippedRodId ?? 'basic_rod';
  const nodeId = ROD_NODE_MAP[equippedRodId] ?? 'fishing_pond';
  const node = GATHER_NODE_MASTER[nodeId];

  const handleFish = useCallback(() => {
    if (!player || !node || cooldown > 0) return;
    if (player.stats.satiety < node.staminaCost) {
      addNotification('warning', '満腹度が足りません！');
      return;
    }

    const fishingLv = player.skillLevels['fishing'] ?? 1;
    const buffBonus = getActiveBuffBonus('fishing');
    const result = calcFishingResult(node, fishingLv, buffBonus);

    changeSatiety(-node.staminaCost);
    addSkillExp('fishing', result.expGained);
    addExp(Math.floor(result.expGained / 3));

    if (result.drops.length > 0) {
      addItems(result.drops);
      const msgs = result.drops.map(d => `${ITEM_MASTER[d.itemId]?.icon ?? '?'} ${ITEM_MASTER[d.itemId]?.name ?? d.itemId} ×${d.amount}`).join('、');
      const feverTag = fever.active ? '🔥' : '';
      setLog(prev => [`${feverTag}[${node.name}] ${msgs}`, ...prev].slice(0, 25));
    } else {
      setLog(prev => [`[${node.name}] 何も釣れなかった...`, ...prev].slice(0, 25));
    }

    // FFGGロッドRank4以上かつFFGG釣り場で釣りスコア加算
    if ((equippedRodId === 'ffgg_rod_r6' || equippedRodId === 'ffggr_rod') && nodeId === 'fishing_ffgg_pond') {
      const scoreGain = fever.active ? 3 : (randomChance(0.3) ? 2 : 1);
      addFishingScore(scoreGain * fever.scoreBonus);
    }

    // フィーバー消費
    if (fever.active) {
      setFever(prev => {
        const newRem = prev.remaining - 1;
        if (newRem <= 0) {
          addNotification('info', 'フィーバー終了！');
          return { active: false, remaining: 0, scoreBonus: 1 };
        }
        return { ...prev, remaining: newRem };
      });
    }

    // フィーバー判定
    checkFever();

    // ジョブ収入（釣り師）
    if (player.activeJob === 'fisher') {
      const jobGold = 5 + fishingLv * 2;
      changeGold(jobGold);
    }

    // クールダウン
    setCooldown(node.cooldownMs);
    const start = Date.now();
    const tick = () => {
      const rem = node.cooldownMs - (Date.now() - start);
      if (rem <= 0) setCooldown(0);
      else { setCooldown(rem); requestAnimationFrame(tick); }
    };
    requestAnimationFrame(tick);
  }, [player, node, cooldown, equippedRodId, nodeId, fever, feverMissCount, getActiveBuffBonus, changeSatiety, addSkillExp, addExp, addItems, addNotification, addFishingScore, changeGold, checkFever]);

  // ===== 交換処理 =====
  const exchangeCoins = () => {
    const small = player?.inventory['ff_coin_small'] ?? 0;
    const canExchange = Math.floor(small / COIN_EXCHANGE_RATE);
    if (canExchange <= 0) { addNotification('error', `FF小判が${COIN_EXCHANGE_RATE}枚未満です`); return; }
    consumeItem('ff_coin_small', canExchange * COIN_EXCHANGE_RATE);
    addItems([{ itemId: 'ff_coin_large', amount: canExchange }]);
    addNotification('success', `FF小判${canExchange * COIN_EXCHANGE_RATE}枚 → FF大判${canExchange}枚に交換！`);
  };

  const exchangeTicketToTotem = () => {
    const tickets = player?.inventory['fishing_ticket'] ?? 0;
    const canExchange = Math.floor(tickets / TICKET_TO_TOTEM);
    if (canExchange <= 0) { addNotification('error', `釣りチケットが${TICKET_TO_TOTEM}枚未満です`); return; }
    consumeItem('fishing_ticket', canExchange * TICKET_TO_TOTEM);
    addItems([{ itemId: 'totem', amount: canExchange }]);
    addNotification('success', `釣りチケット${canExchange * TICKET_TO_TOTEM}枚 → 不死のトーテム${canExchange}個！`);
  };

  const exchangeTotemToReactor = () => {
    const totems = player?.inventory['totem'] ?? 0;
    const canExchange = Math.floor(totems / TOTEM_TO_REACTOR);
    if (canExchange <= 0) { addNotification('error', `不死のトーテムが${TOTEM_TO_REACTOR}個未満です`); return; }
    consumeItem('totem', canExchange * TOTEM_TO_REACTOR);
    addItems([{ itemId: 'y_reactor', amount: canExchange }]);
    addNotification('success', `不死のトーテム${canExchange * TOTEM_TO_REACTOR}個 → Yリアクター${canExchange}個！`);
  };

  const exchangeYBoxToProof = () => {
    const boxes = player?.inventory['y_random_box'] ?? 0;
    if (boxes <= 0) { addNotification('error', 'Yランダムボックスがありません'); return; }
    consumeItem('y_random_box', boxes);
    addItems([{ itemId: 'nether_proof', amount: boxes }]);
    addNotification('success', `Yランダムボックス${boxes}個 → ネザー解放の証${boxes}個！`);
  };

  const exchangeToZReactor = () => {
    const reactors = player?.inventory['y_reactor'] ?? 0;
    const proofs = player?.inventory['nether_proof'] ?? 0;
    if (reactors < 3 || proofs < 2) {
      addNotification('error', 'Yリアクター×3・ネザー解放の証×2が必要');
      return;
    }
    consumeItem('y_reactor', 3);
    consumeItem('nether_proof', 2);
    addItems([{ itemId: 'z_reactor', amount: 1 }]);
    addNotification('success', '⚡ Zリアクター完成！通常釣りの到達点！');
  };

  const drinkRaJuice = (type: string) => {
    const has = player?.inventory[type] ?? 0;
    if (has <= 0) { addNotification('error', 'ラジュースを持っていません'); return; }
    consumeItem(type, 1);
    const bonus = type === 'la_juice_high' ? 1.6 : 1.3;
    const dur = type === 'la_juice_high' ? 10 * 60 * 1000 : 5 * 60 * 1000;
    addBuff({ id: 'la_juice', name: `ラジュース(${type === 'la_juice_high' ? '上位' : '通常'})`, durationMs: dur, fishingBonus: bonus, miningBonus: bonus });
    addNotification('success', `🧉 ラジュース効果発動！釣り・採掘効率${Math.round((bonus - 1) * 100)}%UP（${dur / 60000}分間）`);
  };

  const openCrate = (crateId: string) => {
    const has = player?.inventory[crateId] ?? 0;
    if (has <= 0) { addNotification('error', 'クレートがありません'); return; }
    consumeItem(crateId, 1);

    // クレートの報酬テーブル
    const tables: Record<string, { items: {itemId: string; amount: number}[]; gold: number; prob: number }[]> = {
      crate_leather: [
        { items: [{itemId:'health_potion', amount:3}], gold: 0, prob: 0.40 },
        { items: [{itemId:'food_ration', amount:5}], gold: 0, prob: 0.30 },
        { items: [], gold: 500, prob: 0.20 },
        { items: [{itemId:'la_juice_normal', amount:1}], gold: 0, prob: 0.10 },
      ],
      crate_gold: [
        { items: [{itemId:'mega_potion', amount:2}], gold: 0, prob: 0.30 },
        { items: [], gold: 2000, prob: 0.25 },
        { items: [{itemId:'la_juice_normal', amount:2}], gold: 0, prob: 0.20 },
        { items: [{itemId:'ff_coin_small', amount:5}], gold: 0, prob: 0.15 },
        { items: [{itemId:'scale_low_1', amount:1}], gold: 0, prob: 0.10 },
      ],
      crate_diamond: [
        { items: [], gold: 5000, prob: 0.30 },
        { items: [{itemId:'la_juice_high', amount:1}], gold: 0, prob: 0.20 },
        { items: [{itemId:'scale_high_1', amount:1}], gold: 0, prob: 0.20 },
        { items: [{itemId:'ff_coin_large', amount:1}], gold: 0, prob: 0.15 },
        { items: [{itemId:'elixir', amount:1}], gold: 0, prob: 0.10 },
        { items: [{itemId:'z_reactor', amount:1}], gold: 0, prob: 0.05 },
      ],
      crate_enhanced: [
        { items: [{itemId:'z_reactor', amount:1}], gold: 0, prob: 0.15 },
        { items: [{itemId:'la_juice_high', amount:3}], gold: 0, prob: 0.20 },
        { items: [], gold: 20000, prob: 0.25 },
        { items: [{itemId:'scale_high_1', amount:2},{itemId:'scale_high_2', amount:2}], gold: 0, prob: 0.20 },
        { items: [{itemId:'dragon_scale', amount:1}], gold: 0, prob: 0.05 },
        { items: [{itemId:'ff_coin_large', amount:5}], gold: 0, prob: 0.15 },
      ],
    };

    const table = tables[crateId] ?? tables['crate_leather'];
    const reward = drawFromTableSecure(table.map(r => ({ ...r, probability: r.prob })));

    if (reward.items.length > 0) addItems(reward.items);
    if (reward.gold > 0) changeGold(reward.gold);
    const itemStr = reward.items.map(i => `${ITEM_MASTER[i.itemId]?.icon} ${ITEM_MASTER[i.itemId]?.name}×${i.amount}`).join('、');
    addNotification('success', `📦 クレート開封！ ${itemStr || ''}${reward.gold > 0 ? ` ${reward.gold}G` : ''}`);
  };

  if (!player) return null;

  const fishingLv = player.skillLevels['fishing'] ?? 1;
  const buffBonus = getActiveBuffBonus('fishing');
  const equippedRod = ITEM_MASTER[equippedRodId];
  const fishingScore = player.fishingScore ?? 0;
  const buffActive = buffBonus > 1.0;

  const tabBtn = (id: typeof activeTab, label: string) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1, padding: '7px 2px', fontSize: '0.75rem',
        background: activeTab === id ? 'rgba(91,141,238,0.2)' : '#1c2235',
        border: `1px solid ${activeTab === id ? '#5b8dee' : '#2d3752'}`,
        color: activeTab === id ? '#e8e6ff' : '#8a92b2',
        borderRadius: 6, cursor: 'pointer',
      }}
    >{label}</button>
  );

  return (
    <div style={{ padding: '12px 8px' }}>
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', marginBottom: 8, borderBottom: '1px solid #2d3752', paddingBottom: 8 }}>
        🎣 釣り
      </h2>

      {/* フィーバーバナー */}
      {fever.active && (
        <div style={{ background: 'linear-gradient(135deg, rgba(240,168,48,0.3), rgba(224,85,85,0.3))', border: '2px solid #f0a830', borderRadius: 8, padding: '6px 12px', marginBottom: 8, textAlign: 'center', animation: 'pulse 1s infinite' }}>
          <span style={{ color: '#f0c060', fontWeight: 700 }}>🔥 フィーバー中！ 残り {fever.remaining}回 🔥</span>
        </div>
      )}

      {/* ステータスバー */}
      <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: '8px 12px', marginBottom: 8, display: 'flex', gap: 16, fontSize: '0.8rem', flexWrap: 'wrap' }}>
        <span>🎣 釣りLv.{fishingLv}</span>
        <span style={{ color: '#5b8dee' }}>⭐ スコア: {fishingScore} ({fishingScore % 1000}/1000→上位鱗)</span>
        {buffActive && <span style={{ color: '#f0a830' }}>🧉 ラジュース効果中 ×{buffBonus.toFixed(1)}</span>}
        <span style={{ color: '#f0c060' }}>🎣 装備: {equippedRod?.name ?? '基本の釣り竿'}</span>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {tabBtn('fish', '🎣 釣る')}
        {tabBtn('rod', '🔧 釣り竿')}
        {tabBtn('exchange', '🔄 交換')}
        {tabBtn('commands', '⌨️ コマンド')}
      </div>

      {/* ===== 釣るタブ ===== */}
      {activeTab === 'fish' && (
        <>
          <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{node?.icon} {node?.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#8a92b2', marginBottom: 8 }}>{node?.description}</div>
            <div style={{ fontSize: '0.75rem', color: '#4a5070', marginBottom: 8 }}>
              釣れるもの: {node?.drops.map(d => `${ITEM_MASTER[d.itemId]?.icon}${ITEM_MASTER[d.itemId]?.name}`).join(' / ')}
            </div>
            <div style={{ display: 'flex', gap: 6, fontSize: '0.75rem' }}>
              <span style={{ color: '#8a92b2' }}>満腹度消費: {node?.staminaCost}</span>
              <span style={{ color: '#8a92b2' }}>現在: {player.stats.satiety}/{player.stats.maxSatiety}</span>
            </div>
          </div>

          {player.stats.satiety <= 20 && (
            <div style={{ background: 'rgba(224,85,85,0.15)', border: '1px solid #e05555', borderRadius: 8, padding: '6px 12px', marginBottom: 8, fontSize: '0.8rem', color: '#e05555' }}>
              ⚠️ 満腹度が低い！市場で食料を補給してください。
            </div>
          )}

          <button
            onClick={handleFish}
            disabled={cooldown > 0 || player.stats.satiety < (node?.staminaCost ?? 5)}
            style={{
              width: '100%', padding: '14px', fontWeight: 700, fontSize: '1.1rem',
              background: cooldown > 0 ? '#2d3752' : fever.active ? 'linear-gradient(135deg,#f0a830,#e05555)' : 'linear-gradient(135deg,#4caf87,#2d8f6f)',
              color: '#fff', border: 'none', borderRadius: 8, cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              marginBottom: 10,
            }}
          >
            {cooldown > 0 ? `🎣 キャスト中... (${(cooldown / 1000).toFixed(1)}s)` : fever.active ? '🔥 フィーバー釣り！' : '🎣 釣りをする'}
          </button>

          {/* ラジュースボタン */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button
              onClick={() => drinkRaJuice('la_juice_normal')}
              disabled={(player.inventory['la_juice_normal'] ?? 0) <= 0}
              style={{ flex: 1, padding: '7px', background: '#1c2235', border: '1px solid #2d3752', color: '#e8e6ff', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}
            >
              🧉 ラジュース({player.inventory['la_juice_normal'] ?? 0})
            </button>
            <button
              onClick={() => drinkRaJuice('la_juice_high')}
              disabled={(player.inventory['la_juice_high'] ?? 0) <= 0}
              style={{ flex: 1, padding: '7px', background: '#1c2235', border: '1px solid #9b6df0', color: '#e8e6ff', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}
            >
              🍹 上位ラジュース({player.inventory['la_juice_high'] ?? 0})
            </button>
          </div>

          {/* クレート開封 */}
          {(['crate_leather','crate_gold','crate_diamond','crate_enhanced'] as const).some(id => (player.inventory[id] ?? 0) > 0) && (
            <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, color: '#f0c060' }}>📦 クレート開封</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'crate_leather', name: '革', color: '#8a92b2' },
                  { id: 'crate_gold', name: '金', color: '#f0c060' },
                  { id: 'crate_diamond', name: 'ダイヤ', color: '#5b8dee' },
                  { id: 'crate_enhanced', name: '強化ダイヤ', color: '#9b6df0' },
                ].map(c => (player.inventory[c.id] ?? 0) > 0 ? (
                  <button key={c.id} onClick={() => openCrate(c.id)}
                    style={{ padding: '6px 10px', background: '#161b26', border: `1px solid ${c.color}`, color: c.color, borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}>
                    {ITEM_MASTER[c.id]?.icon} {c.name}クレート×{player.inventory[c.id]}
                  </button>
                ) : null)}
              </div>
            </div>
          )}

          {/* ログ */}
          {log.length > 0 && (
            <div style={{ background: '#0d0f14', border: '1px solid #2d3752', borderRadius: 8, padding: 8, maxHeight: 160, overflowY: 'auto' }}>
              {log.map((l, i) => (
                <div key={i} style={{ fontSize: '0.75rem', color: '#8a92b2', borderBottom: '1px solid #2d3752', padding: '2px 0' }}>{l}</div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== 釣り竿タブ ===== */}
      {activeTab === 'rod' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.8rem', color: '#8a92b2', marginBottom: 4 }}>
            釣り竿を持っていれば装備できます。釣り竿によって釣れるものが変わります。
          </div>
          {Object.values(FISHING_RODS).map(rod => {
            const inInventory = (player.inventory[rod.id] ?? 0) > 0;
            const isEquipped = equippedRodId === rod.id;
            const rodItem = ITEM_MASTER[rod.id];
            return (
              <div key={rod.id} style={{
                background: isEquipped ? 'rgba(76,175,135,0.1)' : '#1c2235',
                border: `1px solid ${isEquipped ? '#4caf87' : '#2d3752'}`,
                borderRadius: 8, padding: '10px 12px',
                opacity: !inInventory ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{rodItem?.icon} {rod.name}</span>
                    {isEquipped && <span style={{ marginLeft: 8, color: '#4caf87', fontSize: '0.75rem' }}>✓ 装備中</span>}
                    <div style={{ fontSize: '0.75rem', color: '#8a92b2', marginTop: 2 }}>{rod.description}</div>
                    <div style={{ fontSize: '0.72rem', color: '#4a5070', marginTop: 2 }}>釣りLv.{rod.requiredFishingLv}以上で使用可</div>
                  </div>
                  {inInventory && !isEquipped && (
                    <button onClick={() => equipRod(rod.id)}
                      style={{ padding: '5px 12px', background: '#5b8dee', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      装備
                    </button>
                  )}
                  {!inInventory && (
                    <span style={{ fontSize: '0.75rem', color: '#4a5070' }}>未所持</span>
                  )}
                </div>
              </div>
            );
          })}
          <div style={{ background: '#1c2235', border: '1px dashed #2d3752', borderRadius: 8, padding: 10, fontSize: '0.78rem', color: '#4a5070' }}>
            💡 釣り竿は市場で購入するか、ダンジョン・ギャンブルで入手できます。
            FFGGロッドは投票チケット+OTT64枚で交換可能です。
          </div>
        </div>
      )}

      {/* ===== 交換タブ ===== */}
      {activeTab === 'exchange' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#f0c060' }}>🔄 焚火交換所（チケット系）</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span>🎫 釣りチケット×{TICKET_TO_TOTEM} → 🪬 不死のトーテム×1</span>
                <button onClick={exchangeTicketToTotem} style={{ padding: '4px 10px', background: '#4caf87', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                  交換 (持:{player.inventory['fishing_ticket'] ?? 0})
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span>🪬 不死のトーテム×{TOTEM_TO_REACTOR} → ⚡ Yリアクター×1</span>
                <button onClick={exchangeTotemToReactor} style={{ padding: '4px 10px', background: '#5b8dee', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                  交換 (持:{player.inventory['totem'] ?? 0})
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span>📦 Yランダムボックス全部 → 🌋 ネザー解放の証</span>
                <button onClick={exchangeYBoxToProof} style={{ padding: '4px 10px', background: '#f0a830', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                  変換 (持:{player.inventory['y_random_box'] ?? 0})
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span>⚡ Yリアクター×3 + 🌋 ネザー解放×2 → 🔋 Zリアクター</span>
                <button onClick={exchangeToZReactor} style={{ padding: '4px 10px', background: '#9b6df0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                  合成
                </button>
              </div>
            </div>
          </div>

          <div style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#f0c060' }}>💴 FF小判交換</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <span>💴 FF小判×{COIN_EXCHANGE_RATE} → 💵 FF大判×1</span>
              <button onClick={exchangeCoins} style={{ padding: '4px 10px', background: '#4caf87', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                交換 (持:{player.inventory['ff_coin_small'] ?? 0})
              </button>
            </div>
          </div>

          {/* 所持アイテムサマリー */}
          <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#8a92b2', fontSize: '0.82rem' }}>📦 釣り関連所持品</div>
            {[
              'fishing_ticket','totem','y_reactor','nether_proof','z_reactor',
              'ff_coin_small','ff_coin_large','scale_high_1','scale_high_2',
              'scale_high_3','scale_high_4','scale_low_1','scale_low_2',
              'wolf_crystal','caribbean_wave','dragon_soul',
            ].map(id => (player.inventory[id] ?? 0) > 0 ? (
              <div key={id} style={{ fontSize: '0.78rem', color: '#8a92b2', padding: '2px 0' }}>
                {ITEM_MASTER[id]?.icon} {ITEM_MASTER[id]?.name}: {player.inventory[id]}
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* ===== コマンドタブ ===== */}
      {activeTab === 'commands' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.82rem', color: '#8a92b2', marginBottom: 4 }}>
            life鯖で使えるコマンドの一覧です（ゲーム内では自動適用）
          </div>
          {[
            { cmd: '/jobs join fisher', desc: '釣り師ジョブに就く。釣りのたびにお金が入る。', effect: () => { get().setActiveJob('fisher'); addNotification('success', '🎣 釣り師ジョブに就いた！釣りのたびにお金が入ります。'); } },
            { cmd: '/jobs join miner',  desc: '採掘師ジョブに就く。採掘のたびにお金が入る。', effect: () => { get().setActiveJob('mining'); addNotification('success', '⛏️ 採掘師ジョブに就いた！'); } },
            { cmd: '/mls',             desc: 'アイテム獲得ログ表示切替（ゲーム内はログで常時ON）', effect: () => addNotification('info', '/mls: ゲーム内ではログに常時表示されます') },
            { cmd: '/dropprotect',     desc: 'アイテムドロップ保護設定', effect: () => addNotification('info', '/dropprotect: ゲーム内では自動保護されています') },
            { cmd: '/ott',             desc: 'オンタイムポイント→OTT変換', effect: () => addNotification('info', 'OTTはゲームプレイ時間に応じて自動獲得されます') },
          ].map((c, i) => (
            <div key={i} style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div>
                <div style={{ fontFamily: 'monospace', color: '#5b8dee', fontSize: '0.85rem' }}>{c.cmd}</div>
                <div style={{ fontSize: '0.75rem', color: '#4a5070', marginTop: 2 }}>{c.desc}</div>
              </div>
              <button onClick={c.effect} style={{ padding: '4px 10px', background: '#2d3752', color: '#8a92b2', border: '1px solid #4a5070', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                実行
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// useGameStore.getState() を使うために追加
function get() { return useGameStore.getState(); }
