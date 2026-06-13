// src/components/screens/GatheringScreen.tsx
// 採取画面：満腹度ペナルティ・スキルボーナス・採取ツール（100種）連動。

import { useState, useCallback } from 'react';
import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { GATHER_NODE_MASTER, ITEM_MASTER } from '../../data/masters';
import { TOOLS_MASTER, DEFAULT_MINING_TOOL_ID, DEFAULT_WOODCUTTING_TOOL_ID } from '../../data/toolsMaster';
import type { GatherNodeMaster, ToolMaster } from '../../types/game';
import { randomChance, randomIntRange } from '../../utils/random';
import { applySpecialEffect, getCurrentToolEffectContext, SPECIAL_EFFECT_LABELS } from '../../systems/toolEffects';

const MATERIAL_LABEL: Record<string, string> = { wood:'木', stone:'石', iron:'鉄', gold:'金', mythril:'ミスリル' };
const TYPE_LABEL: Record<string, string> = { speed:'速度', yield:'収穫', rare:'レア', combo:'コンボ', efficiency:'効率' };

function calcGatherResult(
  node: GatherNodeMaster,
  skillLevel: number,
  tool: ToolMaster,
  combo: number,
  satietyRatio: number,
) {
  const ctx = getCurrentToolEffectContext(combo, satietyRatio);
  const eff = applySpecialEffect(tool.specialEffectId, ctx);

  const yieldMult = tool.yieldMultiplier * eff.yieldMult;
  const rareMult = tool.rareMultiplier * eff.rareMult;
  const finalComboBonus = tool.comboBonus + eff.comboBonusAdd;

  const drops: { itemId: string; amount: number }[] = [];
  const expGained: Record<string, number> = {};
  for (const drop of node.drops) {
    const rate = Math.min(1.0, (drop.baseRate + (drop.skillRateBonus ?? 0) * skillLevel) * rareMult);
    if (randomChance(rate)) {
      let amount: number;
      if (eff.forceMaxAmount) {
        amount = drop.maxAmount;
      } else {
        amount = randomIntRange(drop.minAmount, drop.maxAmount);
      }
      amount = Math.ceil(amount * yieldMult * (1 + finalComboBonus));
      if (eff.extraAmount > 0) amount += eff.extraAmount;
      drops.push({ itemId: drop.itemId, amount });
    }
  }
  expGained[node.requiredSkill.skillId] = 10 + skillLevel * 2;

  const stamina = Math.max(1, Math.round(node.staminaCost * tool.staminaMultiplier * eff.staminaMult));
  const cooldownMs = Math.max(300, Math.round(node.cooldownMs / (tool.speedMultiplier * eff.speedMult)));

  return {
    drops, expGained, staminaUsed: stamina, cooldownMs,
    hpDelta: eff.hpDelta, noHpPenalty: eff.noHpPenalty, noComboDecay: eff.noComboDecay,
    message: eff.message, success: drops.length > 0,
  };
}

export function GatheringScreen() {
  const player = useGameStore(s => s.player);
  const addItems = useGameStore(s => s.addItems);
  const changeSatiety = useGameStore(s => s.changeSatiety);
  const changeHp = useGameStore(s => s.changeHp);
  const addSkillExp = useGameStore(s => s.addSkillExp);
  const addNotification = useGameStore(s => s.addNotification);
  const setEquippedTool = useGameStore(s => s.setEquippedTool);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [log, setLog] = useState<string[]>([]);
  const [combo, setCombo] = useState<Record<string, number>>({ mining: 0, woodcutting: 0 });
  const [showTools, setShowTools] = useState(false);

  const handleGather = useCallback((nodeId: string) => {
    const node = GATHER_NODE_MASTER[nodeId];
    if (!node || !player) return;

    if (player.stats.satiety < node.staminaCost) {
      addNotification('warning', '満腹度が足りません！食料を補給してください。');
      return;
    }

    const skillId = node.requiredSkill.skillId;
    const skillLevel = player.skillLevels[skillId] ?? 1;
    const toolId = skillId === 'mining'
      ? (player.equippedTools?.miningToolId ?? DEFAULT_MINING_TOOL_ID)
      : (player.equippedTools?.woodcuttingToolId ?? DEFAULT_WOODCUTTING_TOOL_ID);
    const tool = TOOLS_MASTER[toolId] ?? TOOLS_MASTER[skillId === 'mining' ? DEFAULT_MINING_TOOL_ID : DEFAULT_WOODCUTTING_TOOL_ID];

    const satietyRatio = player.stats.satiety / player.stats.maxSatiety;
    const currentCombo = combo[skillId] ?? 0;
    const result = calcGatherResult(node, skillLevel, tool, currentCombo, satietyRatio);

    addItems(result.drops);
    changeSatiety(-result.staminaUsed);

    if (result.hpDelta !== 0) changeHp(result.hpDelta);

    // 満腹度0の場合HP減少ペナルティ（特殊効果で無効化可）
    if (player.stats.satiety - result.staminaUsed <= 0 && !result.noHpPenalty) {
      changeHp(-3);
      addNotification('warning', '空腹で採取したためHPが減少しました！');
    }

    for (const [sId, exp] of Object.entries(result.expGained)) {
      addSkillExp(sId, exp);
    }

    // コンボ更新
    setCombo(prev => {
      const next = { ...prev };
      if (result.success) next[skillId] = (prev[skillId] ?? 0) + 1;
      else if (!result.noComboDecay) next[skillId] = 0;
      return next;
    });

    const msgs = result.drops.length > 0
      ? result.drops.map(d => `${ITEM_MASTER[d.itemId]?.icon} ${ITEM_MASTER[d.itemId]?.name} ×${d.amount}`).join('、')
      : '何も手に入らなかった...';
    const effectMsg = result.message ? ` ${result.message}` : '';
    setLog(prev => [`[${node.name}] ${msgs}${effectMsg}`, ...prev].slice(0, 20));

    // レアドロップ時のみフィードに投稿
    const hasRare = result.drops.some(d => {
      const item = ITEM_MASTER[d.itemId];
      return item && (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary');
    });
    if (hasRare && player) {
      import('../../services/multiplayer').then(({ postActivityFeed }) => {
        postActivityFeed({ uid: player.uid, displayName: player.displayName, type: 'mining', message: `が採掘で${msgs}を手に入れました！` }).catch(() => {});
      });
    }

    // 採取後はlocalStorageのみバックアップ（Firebaseへの即時書き込みを廃止）
    const latestPlayer = useGameStore.getState().player;
    if (latestPlayer) {
      try { localStorage.setItem('rpg_backup', JSON.stringify({ data: latestPlayer, savedAt: Date.now() })); } catch { /* ignore */ }
    }

    // クールダウン（speedMultiplierで変動）
    const cooldownMs = result.cooldownMs;
    setCooldowns(prev => ({ ...prev, [nodeId]: cooldownMs }));
    const start = Date.now();
    const tick = () => {
      const rem = cooldownMs - (Date.now() - start);
      if (rem <= 0) {
        setCooldowns(prev => { const n = { ...prev }; delete n[nodeId]; return n; });
      } else {
        setCooldowns(prev => ({ ...prev, [nodeId]: rem }));
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, [player, addItems, changeSatiety, changeHp, addSkillExp, addNotification, combo]);

  const nodes = Object.values(GATHER_NODE_MASTER);
  const miningNodes = nodes.filter(n => n.requiredSkill.skillId === 'mining');
  const woodcuttingNodes = nodes.filter(n => n.requiredSkill.skillId === 'woodcutting');
  const [activeCategory, setActiveCategory] = useState<'mining'|'woodcutting'>('mining');

  const displayNodes = activeCategory === 'mining' ? miningNodes : woodcuttingNodes;

  const equippedToolId = activeCategory === 'mining'
    ? (player?.equippedTools?.miningToolId ?? DEFAULT_MINING_TOOL_ID)
    : (player?.equippedTools?.woodcuttingToolId ?? DEFAULT_WOODCUTTING_TOOL_ID);
  const equippedTool = TOOLS_MASTER[equippedToolId];

  const toolList = Object.values(TOOLS_MASTER).filter(t => t.category === activeCategory);

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

      {/* 装備中ツール表示 */}
      {equippedTool && (
        <div style={{background:'#1c2235', border:'1px solid #f0c060', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:'0.78rem'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
            <span style={{color:'#f0c060', fontWeight:700}}>🔧 装備中: {equippedTool.name}</span>
            <button onClick={() => setShowTools(s => !s)} style={{background:'#2d3752', border:'none', borderRadius:6, color:'#e8e6ff', padding:'4px 10px', fontSize:'0.72rem', cursor:'pointer'}}>
              {showTools ? '閉じる' : 'ツール変更'}
            </button>
          </div>
          <div style={{color:'#8a92b2', display:'flex', flexWrap:'wrap', gap:8}}>
            <span>素材:{MATERIAL_LABEL[equippedTool.material]}</span>
            <span>タイプ:{TYPE_LABEL[equippedTool.type]}</span>
            <span>速度×{equippedTool.speedMultiplier}</span>
            <span>収穫×{equippedTool.yieldMultiplier}</span>
            <span>レア×{equippedTool.rareMultiplier}</span>
            <span>スタミナ×{equippedTool.staminaMultiplier}</span>
            <span>コンボ+{equippedTool.comboBonus}</span>
            {equippedTool.specialEffectId && (
              <span style={{color:'#f0a830'}}>特殊:{SPECIAL_EFFECT_LABELS[equippedTool.specialEffectId] ?? equippedTool.specialEffectId}</span>
            )}
          </div>
          <div style={{color:'#5b8dee', marginTop:4}}>連続コンボ: {combo[activeCategory] ?? 0}</div>
        </div>
      )}

      {/* ツール一覧（100種） */}
      {showTools && (
        <div style={{background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:10, marginBottom:12, maxHeight:360, overflowY:'auto'}}>
          <h3 style={{fontSize:'0.85rem', color:'#8a92b2', marginBottom:8}}>
            🧰 {activeCategory === 'mining' ? '採掘ツール' : '伐採ツール'}一覧（{toolList.length}）
          </h3>
          <div style={{display:'grid', gap:6, gridTemplateColumns:'1fr 1fr'}}>
            {toolList.map(tool => {
              const equipped = tool.id === equippedToolId;
              return (
                <button key={tool.id}
                  onClick={() => setEquippedTool(activeCategory, tool.id)}
                  style={{
                    textAlign:'left', padding:'6px 8px', borderRadius:6, cursor:'pointer',
                    background: equipped ? 'rgba(240,192,96,0.15)' : '#1c2235',
                    border: equipped ? '1px solid #f0c060' : '1px solid #2d3752',
                    color:'#e8e6ff',
                  }}>
                  <div style={{fontWeight:700, fontSize:'0.76rem', color: equipped ? '#f0c060' : '#e8e6ff'}}>
                    {equipped ? '★ ' : ''}{tool.name}
                  </div>
                  <div style={{fontSize:'0.66rem', color:'#8a92b2'}}>
                    速{tool.speedMultiplier} 収{tool.yieldMultiplier} レ{tool.rareMultiplier} ス{tool.staminaMultiplier} コ{tool.comboBonus}
                  </div>
                  {tool.specialEffectId && (
                    <div style={{fontSize:'0.62rem', color:'#f0a830'}}>{SPECIAL_EFFECT_LABELS[tool.specialEffectId] ?? tool.specialEffectId}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{display:'grid', gap:10, gridTemplateColumns:'1fr 1fr'}}>
        {displayNodes.map(node => {
          const skillLv = player?.skillLevels[node.requiredSkill.skillId] ?? 1;
          const meetsLv = skillLv >= node.requiredSkill.minLevel;
          const cd = cooldowns[node.id] ?? 0;
          const disabled = !meetsLv || cd > 0;
          return (
            <div key={node.id} style={{background:'#1c2235', border:`1px solid ${!meetsLv ? '#2d3752' : '#2d3752'}`, borderRadius:10, padding:12, opacity: meetsLv ? 1 : 0.5}}>
              <div style={{display:'flex', gap:8, marginBottom:8}}>
                <span style={{fontSize:'1.8rem'}}><GameIcon id={node.icon} size={36} /></span>
                <div>
                  <div style={{fontWeight:700, fontSize:'0.9rem'}}>{node.name}</div>
                  <div style={{fontSize:'0.72rem', color:'#8a92b2'}}>{node.description}</div>
                </div>
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:4, marginBottom:8}}>
                {node.drops.map(d => {
                  const rate = Math.min(100, Math.floor((d.baseRate + (d.skillRateBonus ?? 0) * skillLv) * (equippedTool?.rareMultiplier ?? 1) * 100));
                  return (
                    <span key={d.itemId} style={{background:'rgba(91,141,238,0.12)', border:'1px solid rgba(91,141,238,0.3)', borderRadius:20, padding:'2px 7px', fontSize:'0.68rem', color:'#5b8dee'}}>
                      <GameIcon id={ITEM_MASTER[d.itemId]?.icon ?? ''} size={13} style={{marginRight:3}} /> {ITEM_MASTER[d.itemId]?.name} ({rate}%)
                    </span>
                  );
                })}
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.72rem', marginBottom:8}}>
                <span style={{color:'#8a92b2'}}>Lv.{node.requiredSkill.minLevel}〜 <span style={{color:'#4caf87'}}>(自分:Lv.{skillLv})</span></span>
                <span style={{color:'#f0a830'}}>🍖 -{Math.max(1, Math.round(node.staminaCost * (equippedTool?.staminaMultiplier ?? 1)))}</span>
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
