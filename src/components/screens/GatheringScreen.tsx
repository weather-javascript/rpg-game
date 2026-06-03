// src/components/screens/GatheringScreen.tsx
// 採取画面：満腹度ペナルティ・スキルボーナス連動。

import { useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GATHER_NODE_MASTER, ITEM_MASTER } from '../../data/masters';
import type { GatherNodeMaster } from '../../types/game';
import { savePlayer } from '../../services/database';

function calcGatherResult(node: GatherNodeMaster, skillLevel: number, toolBonus: number = 1) {
  const drops: { itemId: string; amount: number }[] = [];
  const expGained: Record<string, number> = {};
  for (const drop of node.drops) {
    const rate = Math.min(1.0, drop.baseRate + (drop.skillRateBonus ?? 0) * skillLevel);
    if (Math.random() < rate) {
      // 鉄のツルハシ・斧があれば採取量にボーナス倍率
      const amount = Math.ceil((drop.minAmount + Math.floor(Math.random() * (drop.maxAmount - drop.minAmount + 1))) * toolBonus);
      drops.push({ itemId: drop.itemId, amount });
    }
  }
  expGained[node.requiredSkill.skillId] = 10 + skillLevel * 2;
  return { drops, expGained, staminaUsed: node.staminaCost };
}

export function GatheringScreen() {
  const player = useGameStore(s => s.player);
  const addItems = useGameStore(s => s.addItems);
  const changeSatiety = useGameStore(s => s.changeSatiety);
  const changeHp = useGameStore(s => s.changeHp);
  const addSkillExp = useGameStore(s => s.addSkillExp);
  const addNotification = useGameStore(s => s.addNotification);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [log, setLog] = useState<string[]>([]);

  const handleGather = useCallback((nodeId: string) => {
    const node = GATHER_NODE_MASTER[nodeId];
    if (!node || !player) return;

    // 満腹度チェック
    if (player.stats.satiety < node.staminaCost) {
      addNotification('warning', '満腹度が足りません！食料を補給してください。');
      return;
    }

    const skillLevel = player.skillLevels[node.requiredSkill.skillId] ?? 1;

    // 鉄のツルハシ（採掘）・鉄の斧（伐採）の効果：採取量1.5倍
    let toolBonus = 1;
    if (node.requiredSkill.skillId === 'mining' && (player.inventory['iron_pickaxe'] ?? 0) > 0) {
      toolBonus = 1.5;
    } else if (node.requiredSkill.skillId === 'woodcutting' && (player.inventory['iron_axe'] ?? 0) > 0) {
      toolBonus = 1.5;
    }

    const result = calcGatherResult(node, skillLevel, toolBonus);

    addItems(result.drops);
    changeSatiety(-result.staminaUsed);

    // 満腹度0の場合HP減少ペナルティ
    if (player.stats.satiety - result.staminaUsed <= 0) {
      changeHp(-3);
      addNotification('warning', '空腹で採取したためHPが減少しました！');
    }

    for (const [skillId, exp] of Object.entries(result.expGained)) {
      addSkillExp(skillId, exp);
    }

    const msgs = result.drops.length > 0
      ? result.drops.map(d => `${ITEM_MASTER[d.itemId]?.icon} ${ITEM_MASTER[d.itemId]?.name} ×${d.amount}`).join('、')
      : '何も手に入らなかった...';
    setLog(prev => [`[${node.name}] ${msgs}`, ...prev].slice(0, 20));

    // 採取後にFirebase即時保存（リログで消えるバグを防ぐ）
    const latestPlayer = useGameStore.getState().player;
    if (latestPlayer) savePlayer(latestPlayer).catch(() => {});

    // クールダウン
    setCooldowns(prev => ({ ...prev, [nodeId]: node.cooldownMs }));
    const start = Date.now();
    const tick = () => {
      const rem = node.cooldownMs - (Date.now() - start);
      if (rem <= 0) {
        setCooldowns(prev => { const n = { ...prev }; delete n[nodeId]; return n; });
      } else {
        setCooldowns(prev => ({ ...prev, [nodeId]: rem }));
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, [player, addItems, changeSatiety, changeHp, addSkillExp, addNotification]);

  const nodes = Object.values(GATHER_NODE_MASTER);
  const miningNodes = nodes.filter(n => n.requiredSkill.skillId === 'mining');
  const woodcuttingNodes = nodes.filter(n => n.requiredSkill.skillId === 'woodcutting');
  const [activeCategory, setActiveCategory] = useState<'mining'|'woodcutting'>('mining');

  const displayNodes = activeCategory === 'mining' ? miningNodes : woodcuttingNodes;

  return (
    <div style={{padding:'12px 8px'}}>
      <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>⛏️ 採取</h2>

      {player && player.stats.satiety <= 20 && (
        <div style={{background:'rgba(224,85,85,0.15)', border:'1px solid #e05555', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:'0.82rem', color:'#e05555'}}>
          ⚠️ 満腹度が低下しています！市場の「使用」タブで食料を補給してください。
        </div>
      )}

      {/* カテゴリ切り替え */}
      <div style={{display:'flex', gap:6, marginBottom:12}}>
        <button onClick={() => setActiveCategory('mining')}
          style={{flex:1, padding:'8px', background: activeCategory==='mining' ? 'rgba(91,141,238,0.2)' : '#1c2235', border:`1px solid ${activeCategory==='mining' ? '#5b8dee' : '#2d3752'}`, color: activeCategory==='mining' ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer', fontSize:'0.82rem', fontWeight: activeCategory==='mining' ? 700 : 400}}>
          ⛏️ 採掘 ({miningNodes.length})
        </button>
        <button onClick={() => setActiveCategory('woodcutting')}
          style={{flex:1, padding:'8px', background: activeCategory==='woodcutting' ? 'rgba(76,175,135,0.2)' : '#1c2235', border:`1px solid ${activeCategory==='woodcutting' ? '#4caf87' : '#2d3752'}`, color: activeCategory==='woodcutting' ? '#e8e6ff' : '#8a92b2', borderRadius:6, cursor:'pointer', fontSize:'0.82rem', fontWeight: activeCategory==='woodcutting' ? 700 : 400}}>
          🪓 伐採 ({woodcuttingNodes.length})
        </button>
      </div>

      <div style={{display:'grid', gap:10, gridTemplateColumns:'1fr 1fr'}}>
        {displayNodes.map(node => {
          const skillLv = player?.skillLevels[node.requiredSkill.skillId] ?? 1;
          const meetsLv = skillLv >= node.requiredSkill.minLevel;
          const cd = cooldowns[node.id] ?? 0;
          const disabled = !meetsLv || cd > 0;
          return (
            <div key={node.id} style={{background:'#1c2235', border:`1px solid ${!meetsLv ? '#2d3752' : '#2d3752'}`, borderRadius:10, padding:12, opacity: meetsLv ? 1 : 0.5}}>
              <div style={{display:'flex', gap:8, marginBottom:8}}>
                <span style={{fontSize:'1.8rem'}}>{node.icon}</span>
                <div>
                  <div style={{fontWeight:700, fontSize:'0.9rem'}}>{node.name}</div>
                  <div style={{fontSize:'0.72rem', color:'#8a92b2'}}>{node.description}</div>
                </div>
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:4, marginBottom:8}}>
                {node.drops.map(d => {
                  const rate = Math.min(100, Math.floor((d.baseRate + (d.skillRateBonus ?? 0) * skillLv) * 100));
                  return (
                    <span key={d.itemId} style={{background:'rgba(91,141,238,0.12)', border:'1px solid rgba(91,141,238,0.3)', borderRadius:20, padding:'2px 7px', fontSize:'0.68rem', color:'#5b8dee'}}>
                      {ITEM_MASTER[d.itemId]?.icon} {ITEM_MASTER[d.itemId]?.name} ({rate}%)
                    </span>
                  );
                })}
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.72rem', marginBottom:8}}>
                <span style={{color:'#8a92b2'}}>Lv.{node.requiredSkill.minLevel}〜 <span style={{color:'#4caf87'}}>(自分:Lv.{skillLv})</span></span>
                <span style={{color:'#f0a830'}}>🍖 -{node.staminaCost}</span>
              </div>
              <button
                onClick={() => handleGather(node.id)}
                disabled={disabled}
                style={{
                  width:'100%', padding:'8px', fontWeight:700, fontSize:'0.82rem',
                  background: disabled ? '#2d3752' : 'linear-gradient(135deg,#5b8dee,#3d6fd0)',
                  color: disabled ? '#4a5070' : '#fff',
                  border:'none', borderRadius:6, cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {!meetsLv ? `🔒 Lv.${node.requiredSkill.minLevel}必要` : cd > 0 ? `⏳ ${(cd/1000).toFixed(1)}s` : '採取する'}
              </button>
            </div>
          );
        })}
      </div>

      {log.length > 0 && (
        <div style={{marginTop:16, background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:12}}>
          <h3 style={{fontSize:'0.85rem', color:'#8a92b2', marginBottom:8}}>📋 採取ログ</h3>
          {log.map((e, i) => <div key={i} style={{fontSize:'0.78rem', color:'#e8e6ff', padding:'3px 0', borderBottom:'1px solid #2d3752'}}>{e}</div>)}
        </div>
      )}
    </div>
  );
}
