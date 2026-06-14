// src/components/screens/GatheringScreen.tsx
// 採取画面：満腹度ペナルティ・スキルボーナス・採取ツール（100種）連動。

import { useState, useCallback } from 'react';
import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { GATHER_NODE_MASTER, ITEM_MASTER } from '../../data/masters';
import { TOOLS_MASTER, DEFAULT_MINING_TOOL_ID, DEFAULT_WOODCUTTING_TOOL_ID } from '../../data/toolsMaster';
import { TOOL_CRAFT_RECIPES } from '../../data/toolAcquisition';
import {
  rollToolDrop, getTimeOfDay, getCurrentWeather, isNightTime,
  TOOL_UNLOCK_CONDITIONS, TOOL_DROP_TABLES, CRAFTING_ONLY_TOOL_IDS,
} from '../../data/toolAcquisition';
import type { GatherNodeMaster, ToolMaster } from '../../types/game';
import { randomChance, randomIntRange } from '../../utils/random';
import { applySpecialEffect, getCurrentToolEffectContext, SPECIAL_EFFECT_LABELS } from '../../systems/toolEffects';

const MATERIAL_LABEL: Record<string, string> = { wood:'木', stone:'石', iron:'鉄', gold:'金', mythril:'ミスリル' };
const TYPE_LABEL: Record<string, string> = { speed:'速度', yield:'収穫', rare:'レア', combo:'コンボ', efficiency:'効率' };
const TOD_LABEL: Record<string, string> = { morning:'朝', daytime:'昼', evening:'夕', night:'夜' };
const WEATHER_LABEL: Record<string, string> = { clear:'晴れ', rain:'雨', thunder:'雷', fog:'霧' };

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
  const addOwnedTool = useGameStore(s => s.addOwnedTool);
  const addUnlockedToolGroup = useGameStore(s => s.addUnlockedToolGroup);
  const updateToolAcquisitionStats = useGameStore(s => s.updateToolAcquisitionStats);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [log, setLog] = useState<string[]>([]);
  const [combo, setCombo] = useState<Record<string, number>>({ mining: 0, woodcutting: 0 });
  const [showTools, setShowTools] = useState(false);
  const [toolTab, setToolTab] = useState<'owned' | 'all'>('owned');
  const [toolDropPopup, setToolDropPopup] = useState<{ toolId: string; source: string; tier: string } | null>(null);

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
    const newCombo = result.success ? currentCombo + 1 : (result.noComboDecay ? currentCombo : 0);
    setCombo(prev => {
      const next = { ...prev };
      if (result.success) next[skillId] = (prev[skillId] ?? 0) + 1;
      else if (!result.noComboDecay) next[skillId] = 0;
      return next;
    });

    // ===== ツールドロップ判定 =====
    const unlockedSet = new Set(player.unlockedToolIds ?? []);
    const toolDrop = rollToolDrop({
      nodeId,
      skillId: skillId as 'mining' | 'woodcutting',
      combo: newCombo,
      rareMultiplier: tool.rareMultiplier,
      unlockedToolIds: unlockedSet,
      ownedToolIds: new Set(player.ownedToolIds ?? []),
    });
    if (toolDrop) {
      addOwnedTool(toolDrop.toolId);
      const droppedTool = TOOLS_MASTER[toolDrop.toolId];
      const tierLabel = toolDrop.tier === 'special' ? '✨特殊' : toolDrop.tier === 'rare' ? '💎レア' : '🔧通常';
      addNotification('success', `${tierLabel}ツール入手！【${droppedTool?.name ?? toolDrop.toolId}】（${toolDrop.source}）`);
      setToolDropPopup({ toolId: toolDrop.toolId, source: toolDrop.source, tier: toolDrop.tier });
      setTimeout(() => setToolDropPopup(null), 3500);
    }

    // ===== 統計更新 =====
    const prevStats = player.toolAcquisitionStats ?? {
      totalGatherCount: 0, maxCombo: 0, nightGatherCount: 0, rainGatherCount: 0, dangerSuccessCount: 0,
    };
    const newTotal = prevStats.totalGatherCount + 1;
    const newMaxCombo = Math.max(prevStats.maxCombo, newCombo);
    const isNight = isNightTime();
    const weather = getCurrentWeather();
    const newNight = prevStats.nightGatherCount + (isNight ? 1 : 0);
    const newRain = prevStats.rainGatherCount + (weather !== 'clear' ? 1 : 0);
    updateToolAcquisitionStats({
      totalGatherCount: newTotal,
      maxCombo: newMaxCombo,
      nightGatherCount: newNight,
      rainGatherCount: newRain,
    });

    // ===== 条件解放チェック =====
    const updatedStats = {
      totalGatherCount: newTotal,
      maxCombo: newMaxCombo,
      nightGatherCount: newNight,
      rainGatherCount: newRain,
      dangerSuccessCount: prevStats.dangerSuccessCount,
    };
    for (const cond of TOOL_UNLOCK_CONDITIONS) {
      if (!unlockedSet.has(cond.id) && cond.checkFn(updatedStats)) {
        addUnlockedToolGroup(cond.id);
        addNotification('success', `🔓 解放！「${cond.label}」：${cond.unlocksGroup.length}種のツールが解放されました！`);
      }
    }

    const msgs = result.drops.length > 0
      ? result.drops.map(d => `${ITEM_MASTER[d.itemId]?.icon} ${ITEM_MASTER[d.itemId]?.name} ×${d.amount}`).join('、')
      : '何も手に入らなかった...';
    const effectMsg = result.message ? ` ${result.message}` : '';
    const todLabel = TOD_LABEL[getTimeOfDay()];
    const wLabel = weather !== 'clear' ? ` [${WEATHER_LABEL[weather]}]` : '';
    setLog(prev => [`[${node.name}] ${msgs}${effectMsg} (${todLabel}${wLabel})`, ...prev].slice(0, 20));

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

    // saveBufferに保存をキューイング（localStorage直書きはsaveBuffer側に任せる）
    import('../../services/saveBuffer').then(({ queueSave }) => queueSave());

    // クールダウン（200msポーリングでRe-render頻度を抑制）
    const cooldownMs = result.cooldownMs;
    const endTime = Date.now() + cooldownMs;
    setCooldowns(prev => ({ ...prev, [nodeId]: cooldownMs }));
    const timer = setInterval(() => {
      const rem = endTime - Date.now();
      if (rem <= 0) {
        clearInterval(timer);
        setCooldowns(prev => { const n = { ...prev }; delete n[nodeId]; return n; });
      } else {
        setCooldowns(prev => ({ ...prev, [nodeId]: rem }));
      }
    }, 200);
  }, [player, addItems, changeSatiety, changeHp, addSkillExp, addNotification, combo, addOwnedTool, addUnlockedToolGroup, updateToolAcquisitionStats]);

  const nodes = Object.values(GATHER_NODE_MASTER);
  const miningNodes = nodes.filter(n => n.requiredSkill.skillId === 'mining');
  const woodcuttingNodes = nodes.filter(n => n.requiredSkill.skillId === 'woodcutting');
  const [activeCategory, setActiveCategory] = useState<'mining'|'woodcutting'>('mining');

  const displayNodes = activeCategory === 'mining' ? miningNodes : woodcuttingNodes;

  const equippedToolId = activeCategory === 'mining'
    ? (player?.equippedTools?.miningToolId ?? DEFAULT_MINING_TOOL_ID)
    : (player?.equippedTools?.woodcuttingToolId ?? DEFAULT_WOODCUTTING_TOOL_ID);
  const equippedTool = TOOLS_MASTER[equippedToolId];

  const allToolList = Object.values(TOOLS_MASTER).filter(t => t.category === activeCategory);
  const ownedSet = new Set(player?.ownedToolIds ?? []);
  const unlockedGroups = new Set(player?.unlockedToolIds ?? []);

  // ツール状態判定
  const getToolStatus = (toolId: string): 'owned' | 'unowned' | 'locked' => {
    if (ownedSet.has(toolId) || toolId === DEFAULT_MINING_TOOL_ID || toolId === DEFAULT_WOODCUTTING_TOOL_ID) return 'owned';
    // クラフト専用ツールは解放とは別
    if (CRAFTING_ONLY_TOOL_IDS.has(toolId)) return 'unowned';
    // 解放条件があるツールのチェック
    for (const cond of TOOL_UNLOCK_CONDITIONS) {
      if (cond.unlocksGroup.includes(toolId) && !unlockedGroups.has(cond.id)) return 'locked';
    }
    return 'unowned';
  };

  // ツールの入手ヒント
  const getToolHint = (toolId: string): string => {
    if (CRAFTING_ONLY_TOOL_IDS.has(toolId)) return '🔨 クラフト専用';
    const dropSrc = Object.entries(TOOL_DROP_TABLES).find(([, entries]) => entries.some(e => e.toolId === toolId));
    if (dropSrc) return `📍 ドロップ: ${dropSrc[0]}`;
    const recipe = TOOL_CRAFT_RECIPES.find(r => r.toolId === toolId);
    if (recipe) return '🔨 クラフト可';
    return '';
  };

  const toolListFiltered = toolTab === 'owned'
    ? allToolList.filter(t => getToolStatus(t.id) === 'owned')
    : allToolList;

  // 条件解放の進捗表示
  const stats = player?.toolAcquisitionStats ?? { totalGatherCount:0, maxCombo:0, nightGatherCount:0, rainGatherCount:0, dangerSuccessCount:0 };

  return (
    <div style={{padding:'12px 8px'}}>
      <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>⛏️ 採取</h2>

      {/* ツールドロップポップアップ */}
      {toolDropPopup && (() => {
        const dt = TOOLS_MASTER[toolDropPopup.toolId];
        const tierColor = toolDropPopup.tier === 'special' ? '#c864ff' : toolDropPopup.tier === 'rare' ? '#f0c060' : '#4caf87';
        return (
          <div style={{position:'fixed', top:80, left:'50%', transform:'translateX(-50%)', zIndex:9999, background:'#1c2235', border:`2px solid ${tierColor}`, borderRadius:12, padding:'14px 20px', boxShadow:`0 0 20px ${tierColor}44`, textAlign:'center', minWidth:240}}>
            <div style={{color:tierColor, fontWeight:700, fontSize:'1rem', marginBottom:4}}>
              {toolDropPopup.tier === 'special' ? '✨ 特殊ツール入手！' : toolDropPopup.tier === 'rare' ? '💎 レアツール入手！' : '🔧 ツール入手！'}
            </div>
            <div style={{color:'#e8e6ff', fontWeight:700, fontSize:'0.9rem'}}>{dt?.name ?? toolDropPopup.toolId}</div>
            <div style={{color:'#8a92b2', fontSize:'0.72rem', marginTop:4}}>入手経路: {toolDropPopup.source}</div>
          </div>
        );
      })()}

      {player && player.stats.satiety <= 20 && (
        <div style={{background:'rgba(224,85,85,0.15)', border:'1px solid #e05555', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:'0.82rem', color:'#e05555'}}>
          ⚠️ 満腹度が低下しています！市場の「使用」タブで食料を補給してください。
        </div>
      )}

      {/* 時間帯・天候表示 */}
      <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:6, padding:'6px 12px', marginBottom:10, fontSize:'0.72rem', display:'flex', gap:12, color:'#8a92b2'}}>
        <span>🕐 {TOD_LABEL[getTimeOfDay()]}</span>
        <span>🌤️ {WEATHER_LABEL[getCurrentWeather()]}</span>
        <span>🔗 コンボ最大: {stats.maxCombo}</span>
      </div>

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
              {showTools ? '閉じる' : 'ツール管理'}
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

      {/* ツール管理パネル */}
      {showTools && (
        <div style={{background:'#161b26', border:'1px solid #2d3752', borderRadius:8, padding:10, marginBottom:12}}>
          {/* タブ */}
          <div style={{display:'flex', gap:6, marginBottom:8}}>
            <button onClick={() => setToolTab('owned')}
              style={{padding:'4px 10px', fontSize:'0.72rem', background: toolTab==='owned' ? '#5b8dee' : '#1c2235', border:`1px solid ${toolTab==='owned' ? '#5b8dee' : '#2d3752'}`, color: toolTab==='owned' ? '#fff' : '#8a92b2', borderRadius:6, cursor:'pointer'}}>
              所持 ({allToolList.filter(t => getToolStatus(t.id) === 'owned').length})
            </button>
            <button onClick={() => setToolTab('all')}
              style={{padding:'4px 10px', fontSize:'0.72rem', background: toolTab==='all' ? '#5b8dee' : '#1c2235', border:`1px solid ${toolTab==='all' ? '#5b8dee' : '#2d3752'}`, color: toolTab==='all' ? '#fff' : '#8a92b2', borderRadius:6, cursor:'pointer'}}>
              全種類 ({allToolList.length})
            </button>
          </div>
          <div style={{maxHeight:300, overflowY:'auto', display:'grid', gap:5, gridTemplateColumns:'1fr 1fr'}}>
            {toolListFiltered.map(tool => {
              const status = getToolStatus(tool.id);
              const equipped = tool.id === equippedToolId;
              const hint = getToolHint(tool.id);
              const borderColor = equipped ? '#f0c060' : status === 'owned' ? '#4caf87' : status === 'locked' ? '#e05555' : '#2d3752';
              const bg = equipped ? 'rgba(240,192,96,0.15)' : status === 'owned' ? 'rgba(76,175,135,0.08)' : '#1c2235';
              return (
                <button key={tool.id}
                  onClick={() => status === 'owned' && setEquippedTool(activeCategory, tool.id)}
                  disabled={status !== 'owned'}
                  style={{textAlign:'left', padding:'6px 8px', borderRadius:6, cursor: status==='owned' ? 'pointer' : 'default', background: bg, border:`1px solid ${borderColor}`, color:'#e8e6ff', opacity: status === 'locked' ? 0.45 : 1}}>
                  <div style={{fontWeight:700, fontSize:'0.74rem', color: equipped ? '#f0c060' : status === 'owned' ? '#e8e6ff' : '#4a5070'}}>
                    {equipped ? '★ ' : ''}{status === 'locked' ? '🔒 ' : status === 'unowned' ? '❓ ' : ''}{tool.name}
                  </div>
                  <div style={{fontSize:'0.64rem', color:'#8a92b2'}}>
                    速{tool.speedMultiplier} 収{tool.yieldMultiplier} レ{tool.rareMultiplier} ス{tool.staminaMultiplier}
                  </div>
                  {hint && <div style={{fontSize:'0.62rem', color:'#5b8dee'}}>{hint}</div>}
                  {tool.specialEffectId && (
                    <div style={{fontSize:'0.62rem', color:'#f0a830'}}>{SPECIAL_EFFECT_LABELS[tool.specialEffectId] ?? tool.specialEffectId}</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 条件解放進捗 */}
          <div style={{marginTop:10, borderTop:'1px solid #2d3752', paddingTop:8}}>
            <div style={{fontSize:'0.72rem', color:'#8a92b2', fontWeight:700, marginBottom:6}}>🔓 条件解放進捗</div>
            {TOOL_UNLOCK_CONDITIONS.map(cond => {
              const done = unlockedGroups.has(cond.id);
              const progress = (() => {
                if (cond.id === 'unlock_basic') return `${Math.min(stats.totalGatherCount, 100)}/100`;
                if (cond.id === 'unlock_combo') return `${Math.min(stats.maxCombo, 20)}/20`;
                if (cond.id === 'unlock_night') return `${Math.min(stats.nightGatherCount, 50)}/50`;
                if (cond.id === 'unlock_rain')  return `${Math.min(stats.rainGatherCount, 50)}/50`;
                if (cond.id === 'unlock_danger')return `${Math.min(stats.dangerSuccessCount, 10)}/10`;
                return '';
              })();
              return (
                <div key={cond.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'3px 0', fontSize:'0.7rem', borderBottom:'1px solid #1c2235'}}>
                  <span style={{color: done ? '#4caf87' : '#8a92b2'}}>{done ? '✅' : '⬜'} {cond.label}</span>
                  <span style={{color: done ? '#4caf87' : '#f0c060'}}>{done ? '解放済み' : progress}</span>
                </div>
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
