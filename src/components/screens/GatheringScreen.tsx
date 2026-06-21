// src/components/screens/GatheringScreen.tsx
// 採取画面 v2: カテゴリ・時間帯・天候・コンボ・装備・図鑑・危険ノード対応

import { useState, useCallback, useEffect } from 'react';
import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { GATHER_NODE_MASTER, ITEM_MASTER } from '../../data/masters';
import {
  TOOLS_MASTER,
  DEFAULT_MINING_TOOL_ID, DEFAULT_WOODCUTTING_TOOL_ID,
  DEFAULT_GATHERING_TOOL_ID, DEFAULT_HERBALISM_TOOL_ID, DEFAULT_INSECT_TOOL_ID,
} from '../../data/toolsMaster';
import { TOOL_CRAFT_RECIPES } from '../../data/toolAcquisition';
import {
  rollToolDrop, getTimeOfDay, getCurrentWeather, isNightTime,
  TOOL_UNLOCK_CONDITIONS, TOOL_DROP_TABLES, CRAFTING_ONLY_TOOL_IDS,
} from '../../data/toolAcquisition';
import type { ToolMaster, GatherCategory } from '../../types/game';
import { randomChance, randomIntRange } from '../../utils/random';
import { applySpecialEffect, getCurrentToolEffectContext, SPECIAL_EFFECT_LABELS } from '../../systems/toolEffects';
import {
  CATEGORY_CONFIG, calcAllMultipliers, getCollectionBonus, isDangerNodeAvailable,
  calcDangerPenalty, getCategoryFromSkillId,
} from '../../systems/gatheringSystem';

const TOD_LABEL: Record<string, string> = { morning:'朝(☀️)', daytime:'昼(🌤️)', evening:'夕(🌅)', night:'夜(🌙)' };
const WEATHER_LABEL: Record<string, string> = { clear:'晴れ☀️', rain:'雨🌧️', thunder:'雷⛈️', fog:'霧🌫️' };

const ALL_CATEGORIES: GatherCategory[] = ['mining', 'woodcutting', 'gathering', 'herbalism', 'insect'];

function getDefaultToolId(category: GatherCategory): string {
  if (category === 'woodcutting') return DEFAULT_WOODCUTTING_TOOL_ID;
  if (category === 'gathering')   return DEFAULT_GATHERING_TOOL_ID;
  if (category === 'herbalism')   return DEFAULT_HERBALISM_TOOL_ID;
  if (category === 'insect')      return DEFAULT_INSECT_TOOL_ID;
  return DEFAULT_MINING_TOOL_ID;
}

function getEquippedToolId(player: any, category: GatherCategory): string {
  const t = player?.equippedTools;
  if (category === 'mining')      return t?.miningToolId ?? DEFAULT_MINING_TOOL_ID;
  if (category === 'woodcutting') return t?.woodcuttingToolId ?? DEFAULT_WOODCUTTING_TOOL_ID;
  if (category === 'gathering')   return t?.gatheringToolId ?? DEFAULT_GATHERING_TOOL_ID;
  if (category === 'herbalism')   return t?.herbalismToolId ?? DEFAULT_HERBALISM_TOOL_ID;
  if (category === 'insect')      return t?.insectToolId ?? DEFAULT_INSECT_TOOL_ID;
  return DEFAULT_MINING_TOOL_ID;
}

// 図鑑: 全採取アイテムID一覧をカテゴリ別で返す
function buildCategoryItemMap(): Record<GatherCategory, string[]> {
  const map: Record<GatherCategory, string[]> = { mining:[], woodcutting:[], gathering:[], herbalism:[], insect:[] };
  for (const node of Object.values(GATHER_NODE_MASTER)) {
    if (node.isDanger) continue;
    const cat = getCategoryFromSkillId(node.requiredSkill.skillId as string);
    for (const d of node.drops) {
      if (!map[cat].includes(d.itemId)) map[cat].push(d.itemId);
    }
  }
  return map;
}

const CATEGORY_ITEM_MAP = buildCategoryItemMap();
const ALL_GATHER_ITEMS = Object.values(CATEGORY_ITEM_MAP).flat();

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
  const updateGatherCombo = useGameStore(s => s.updateGatherCombo);
  const updateGatherCollection = useGameStore(s => s.updateGatherCollection);
  const setOfflineMining = useGameStore(s => s.setOfflineMining);
  const setGatheringLocked = useGameStore((s: any) => s.setGatheringLocked);

  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [log, setLog] = useState<string[]>([]);
  const [showTools, setShowTools] = useState(false);
  const [toolTab, setToolTab] = useState<'owned' | 'all'>('owned');
  const [activeCategory, setActiveCategory] = useState<GatherCategory>('mining');
  const [activeTab, setActiveTab] = useState<'gather' | 'collection'>('gather');
  const [toolDropPopup, setToolDropPopup] = useState<{ toolId: string; source: string; tier: string } | null>(null);
  const [dangerDebuff, setDangerDebuff] = useState<{ expiresAt: number } | null>(null);

  // 現在コンボ
  const gatherCombo = player?.gatherCombo;
  const currentCombo = (gatherCombo && gatherCombo.category === activeCategory && (Date.now() - gatherCombo.lastAt) < 30000)
    ? gatherCombo.count : 0;

  // 図鑑
  const collection = player?.gatherCollection ?? { discoveredItems: [], itemCounts: {} };
  const collectionBonus = getCollectionBonus({
    discoveredItems: collection.discoveredItems,
    categoryItems: CATEGORY_ITEM_MAP,
    allItems: ALL_GATHER_ITEMS,
  });

  // 危険ノード: 表示制御
  const [showDangerNodes, setShowDangerNodes] = useState(false);
  useEffect(() => {
    setShowDangerNodes(isDangerNodeAvailable());
    const iv = setInterval(() => setShowDangerNodes(isDangerNodeAvailable()), 60000);
    return () => clearInterval(iv);
  }, []);

  const handleGather = useCallback((nodeId: string) => {
    const node = GATHER_NODE_MASTER[nodeId];
    if (!node || !player) return;

    const category = getCategoryFromSkillId(node.requiredSkill.skillId as string);
    const toolId = getEquippedToolId(player, category);
    const tool: ToolMaster = TOOLS_MASTER[toolId] ?? TOOLS_MASTER[getDefaultToolId(category)];

    // 危険ノードデバフチェック
    if (node.isDanger && dangerDebuff && Date.now() < dangerDebuff.expiresAt) {
      addNotification('warning', '⚠️ 危険ノードの余波デバフ中です。しばらく待ってください。');
      return;
    }

    const staminaNeeded = node.isDanger ? node.staminaCost * 2 : node.staminaCost;
    if (player.stats.satiety < staminaNeeded) {
      addNotification('warning', '満腹度が足りません！食料を補給してください。');
      return;
    }

    // コンボ取得（放置チェック）
    const combo = (gatherCombo && gatherCombo.category === category && (Date.now() - gatherCombo.lastAt) < 30000)
      ? gatherCombo.count : 0;

    // 全補正計算
    const mults = calcAllMultipliers({
      category,
      combo,
      toolSpeedMult: tool.speedMultiplier,
      toolYieldMult: tool.yieldMultiplier,
      toolRareMult: tool.rareMultiplier,
      toolStaminaMult: tool.staminaMultiplier,
      toolComboBonus: tool.comboBonus,
      collectionBonus,
    });

    const skillId = node.requiredSkill.skillId;
    const skillLevel = player.skillLevels[skillId] ?? 1;
    const satietyRatio = player.stats.satiety / player.stats.maxSatiety;
    const ctx = getCurrentToolEffectContext(combo, satietyRatio);
    const eff = applySpecialEffect(tool.specialEffectId, ctx);

    // fog成功率補正
    const successMod = mults.successMod;

    const drops: { itemId: string; amount: number }[] = [];
    const expGained: Record<string, number> = {};
    for (const drop of node.drops) {
      let rate = Math.min(1.0, (drop.baseRate + (drop.skillRateBonus ?? 0) * skillLevel) * mults.rareMult * eff.rareMult);
      // success mod (fog -10%)
      rate = Math.max(0, rate + successMod);
      if (randomChance(rate)) {
        let amount: number;
        if (eff.forceMaxAmount) {
          amount = drop.maxAmount;
        } else {
          amount = randomIntRange(drop.minAmount, drop.maxAmount);
        }
        // 危険ノードは ×(2〜5)
        const dangerMult = node.isDanger ? (2 + Math.random() * 3) : 1;
        amount = Math.ceil(amount * mults.yieldMult * dangerMult);
        if (eff.extraAmount > 0) amount += eff.extraAmount;
        drops.push({ itemId: drop.itemId, amount });
      }
    }
    expGained[skillId] = 10 + skillLevel * 2;

    const success = drops.length > 0;

    // 危険ノード失敗ペナルティ
    if (node.isDanger && !success) {
      const penalty = calcDangerPenalty(node.staminaCost);
      changeSatiety(-(penalty.extraStamina));
      changeHp(-penalty.hpPenalty);
      setDangerDebuff({ expiresAt: Date.now() + penalty.debuffTurns * 1000 });
      addNotification('warning', `⚠️ 危険ノード失敗！HP-${penalty.hpPenalty}、スタミナ追加消費、${penalty.debuffTurns}秒デバフ`);
    }

    // スタミナ消費
    const stamina = Math.max(1, Math.round(staminaNeeded * mults.staminaMult * eff.staminaMult));
    addItems(drops);
    changeSatiety(-stamina);
    if (eff.hpDelta !== 0) changeHp(eff.hpDelta);
    if (player.stats.satiety - stamina <= 0 && !eff.noHpPenalty) {
      changeHp(-3);
      addNotification('warning', '空腹で採取したためHPが減少しました！');
    }
    for (const [sId, exp] of Object.entries(expGained)) addSkillExp(sId, exp);

    // コンボ更新 (store)
    updateGatherCombo(category, success && !eff.noComboDecay ? true : (!success ? false : true));
    if (!success) updateGatherCombo(category, false);

    // 図鑑更新
    if (drops.length > 0) {
      const amountMap: Record<string, number> = {};
      for (const d of drops) amountMap[d.itemId] = d.amount;
      updateGatherCollection(drops.map(d => d.itemId), amountMap);
    }

    // ツールドロップ (mining/woodcutting のみ)
    if (category === 'mining' || category === 'woodcutting') {
      const unlockedSet = new Set(player.unlockedToolIds ?? []);
      const toolDrop = rollToolDrop({
        nodeId,
        skillId: category,
        combo: combo + (success ? 1 : 0),
        rareMultiplier: tool.rareMultiplier * mults.rareMult,
        unlockedToolIds: unlockedSet,
        ownedToolIds: new Set(player.ownedToolIds ?? []),
      });
      if (toolDrop) {
        addOwnedTool(toolDrop.toolId);
        const droppedTool = TOOLS_MASTER[toolDrop.toolId];
        const tierLabel = toolDrop.tier === 'special' ? '✨特殊' : toolDrop.tier === 'rare' ? '💎レア' : '🔧通常';
        addNotification('success', `${tierLabel}ツール入手！【${droppedTool?.name ?? toolDrop.toolId}】`);
        setToolDropPopup({ toolId: toolDrop.toolId, source: toolDrop.source, tier: toolDrop.tier });
        setTimeout(() => setToolDropPopup(null), 3500);
      }
    }

    // 統計更新
    const prevStats = player.toolAcquisitionStats ?? { totalGatherCount:0, maxCombo:0, nightGatherCount:0, rainGatherCount:0, dangerSuccessCount:0 };
    const newTotal = prevStats.totalGatherCount + 1;
    const newComboVal = combo + (success ? 1 : 0);
    const newMaxCombo = Math.max(prevStats.maxCombo, newComboVal);
    const isNight = isNightTime();
    const weather = getCurrentWeather();
    const newNight = prevStats.nightGatherCount + (isNight ? 1 : 0);
    const newRain = prevStats.rainGatherCount + (weather !== 'clear' ? 1 : 0);
    const newDanger = prevStats.dangerSuccessCount + (node.isDanger && success ? 1 : 0);
    updateToolAcquisitionStats({ totalGatherCount: newTotal, maxCombo: newMaxCombo, nightGatherCount: newNight, rainGatherCount: newRain, dangerSuccessCount: newDanger });

    // 条件解放
    const unlockedSet2 = new Set(player.unlockedToolIds ?? []);
    const updatedStats = { totalGatherCount:newTotal, maxCombo:newMaxCombo, nightGatherCount:newNight, rainGatherCount:newRain, dangerSuccessCount:newDanger };
    for (const cond of TOOL_UNLOCK_CONDITIONS) {
      if (!unlockedSet2.has(cond.id) && cond.checkFn(updatedStats)) {
        addUnlockedToolGroup(cond.id);
        addNotification('success', `🔓 解放！「${cond.label}」：${cond.unlocksGroup.length}種のツールが解放されました！`);
      }
    }

    const msgs = drops.length > 0
      ? drops.map(d => `${ITEM_MASTER[d.itemId]?.icon ?? '?'} ${ITEM_MASTER[d.itemId]?.name ?? d.itemId} ×${d.amount}`).join('、')
      : '何も手に入らなかった...';
    const todLabel = TOD_LABEL[getTimeOfDay()];
    const wLabel = weather !== 'clear' ? ` [${WEATHER_LABEL[weather]}]` : '';
    const comboLabel = newComboVal >= 5 ? ` 🔗×${newComboVal}` : '';
    setLog(prev => [`[${node.name}] ${msgs}${eff.message ? ' '+eff.message : ''} (${todLabel}${wLabel}${comboLabel})`, ...prev].slice(0, 20));

    // レアドロップ時フィード
    const hasRare = drops.some(d => { const it = ITEM_MASTER[d.itemId]; return it && (it.rarity === 'rare' || it.rarity === 'epic' || it.rarity === 'legendary'); });
    if (hasRare && player) {
      import('../../services/multiplayer').then(({ postActivityFeed }) => {
        postActivityFeed({ uid: player.uid, displayName: player.displayName, type: 'mining', message: `が採取で${msgs}を手に入れました！` }).catch(() => {});
      });
    }

    import('../../services/saveBuffer').then(({ queueSave }) => queueSave());

    // クールダウン
    const cooldownMs = Math.max(300, Math.round(node.cooldownMs / mults.speedMult));
    const endTime = Date.now() + cooldownMs;
    setCooldowns(prev => ({ ...prev, [nodeId]: cooldownMs }));
    setGatheringLocked(true);
    const timer = setInterval(() => {
      const rem = endTime - Date.now();
      if (rem <= 0) {
        clearInterval(timer);
        setCooldowns(prev => { const n = { ...prev }; delete n[nodeId]; return n; });
        setGatheringLocked(false);
      } else {
        setCooldowns(prev => ({ ...prev, [nodeId]: rem }));
      }
    }, 200);
  }, [player, addItems, changeSatiety, changeHp, addSkillExp, addNotification, gatherCombo,
      addOwnedTool, addUnlockedToolGroup, updateToolAcquisitionStats, updateGatherCombo,
      updateGatherCollection, setGatheringLocked, collectionBonus, dangerDebuff]);

  const nodes = Object.values(GATHER_NODE_MASTER);
  const categoryNodes = nodes.filter(n => {
    if (n.isDanger) return false;
    return getCategoryFromSkillId(n.requiredSkill.skillId as string) === activeCategory;
  });
  const dangerNodes = nodes.filter(n => n.isDanger && showDangerNodes);

  const equippedToolId = getEquippedToolId(player, activeCategory);
  const equippedTool = TOOLS_MASTER[equippedToolId];

  const allToolList = Object.values(TOOLS_MASTER).filter((t: any) => t.category === activeCategory);
  const ownedSet = new Set(player?.ownedToolIds ?? []);
  const unlockedGroups = new Set(player?.unlockedToolIds ?? []);

  const getToolStatus = (toolId: string): 'owned' | 'unowned' | 'locked' => {
    const defaults = [DEFAULT_MINING_TOOL_ID, DEFAULT_WOODCUTTING_TOOL_ID, DEFAULT_GATHERING_TOOL_ID, DEFAULT_HERBALISM_TOOL_ID, DEFAULT_INSECT_TOOL_ID];
    if (ownedSet.has(toolId) || defaults.includes(toolId)) return 'owned';
    if (CRAFTING_ONLY_TOOL_IDS.has(toolId)) return 'unowned';
    for (const cond of TOOL_UNLOCK_CONDITIONS) {
      if (cond.unlocksGroup.includes(toolId) && !unlockedGroups.has(cond.id)) return 'locked';
    }
    return 'unowned';
  };

  const getToolHint = (toolId: string): string => {
    if (CRAFTING_ONLY_TOOL_IDS.has(toolId)) return '🔨 クラフト専用';
    const dropSrc = Object.entries(TOOL_DROP_TABLES).find(([, entries]) => entries.some((e: any) => e.toolId === toolId));
    if (dropSrc) return `📍 ドロップ: ${dropSrc[0]}`;
    const recipe = TOOL_CRAFT_RECIPES.find((r: any) => r.toolId === toolId);
    if (recipe) return '🔨 クラフト可';
    return '';
  };

  const toolListFiltered = toolTab === 'owned'
    ? allToolList.filter(t => getToolStatus(t.id) === 'owned')
    : allToolList;

  const stats = player?.toolAcquisitionStats ?? { totalGatherCount:0, maxCombo:0, nightGatherCount:0, rainGatherCount:0, dangerSuccessCount:0 };
  const weather = getCurrentWeather();
  const tod = getTimeOfDay();

  useEffect(() => { return () => { setGatheringLocked(false); }; }, [setGatheringLocked]);

  // コンボゲージ
  const comboStage = currentCombo >= 20 ? 3 : currentCombo >= 10 ? 2 : currentCombo >= 5 ? 1 : 0;
  const comboColors = ['#4a5070','#4caf87','#f0c060','#e07030'];
  const comboLabels = ['','×5','×10','×20'];
  const comboProgress = comboStage === 0
    ? Math.min(currentCombo / 5, 1)
    : comboStage === 1 ? Math.min(currentCombo / 10, 1)
    : comboStage === 2 ? Math.min(currentCombo / 20, 1) : 1;

  return (
    <div style={{padding:'12px 8px'}}>
      <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>⛏️ 採取</h2>

      {/* ツールドロップポップアップ */}
      {toolDropPopup && (() => {
        const dt = TOOLS_MASTER[toolDropPopup.toolId];
        const tierColor = toolDropPopup.tier === 'special' ? '#c864ff' : toolDropPopup.tier === 'rare' ? '#f0c060' : '#4caf87';
        return (
          <div style={{position:'fixed',top:80,left:'50%',transform:'translateX(-50%)',zIndex:9999,background:'#1c2235',border:`2px solid ${tierColor}`,borderRadius:12,padding:'14px 20px',boxShadow:`0 0 20px ${tierColor}44`,textAlign:'center',minWidth:240}}>
            <div style={{color:tierColor,fontWeight:700,fontSize:'1rem',marginBottom:4}}>
              {toolDropPopup.tier==='special'?'✨ 特殊ツール入手！':toolDropPopup.tier==='rare'?'💎 レアツール入手！':'🔧 ツール入手！'}
            </div>
            <div style={{color:'#e8e6ff',fontWeight:700,fontSize:'0.9rem'}}>{dt?.name ?? toolDropPopup.toolId}</div>
          </div>
        );
      })()}

      {/* 危険デバフ表示 */}
      {dangerDebuff && Date.now() < dangerDebuff.expiresAt && (
        <div style={{background:'rgba(224,85,85,0.15)',border:'1px solid #e05555',borderRadius:8,padding:'6px 12px',marginBottom:8,fontSize:'0.78rem',color:'#e05555'}}>
          ⚠️ 危険ノードデバフ中（{Math.ceil((dangerDebuff.expiresAt - Date.now())/1000)}秒残り）
        </div>
      )}

      {player && player.stats.satiety <= 20 && (
        <div style={{background:'rgba(224,85,85,0.15)',border:'1px solid #e05555',borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:'0.82rem',color:'#e05555'}}>
          ⚠️ 満腹度が低下しています！
        </div>
      )}

      {/* 時間帯・天候・コンボゲージ */}
      <div style={{background:'#1c2235',border:'1px solid #2d3752',borderRadius:6,padding:'8px 12px',marginBottom:10,fontSize:'0.75rem'}}>
        <div style={{display:'flex',gap:12,color:'#8a92b2',marginBottom:6}}>
          <span>🕐 {TOD_LABEL[tod]}</span>
          <span>{WEATHER_LABEL[weather]}</span>
          <span style={{color:'#f0c060'}}>📖 図鑑 {collection.discoveredItems.length}/{ALL_GATHER_ITEMS.length}</span>
        </div>
        {/* コンボゲージ */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:comboColors[comboStage],fontWeight:700,minWidth:60}}>🔗 ×{currentCombo}{comboLabels[comboStage]&&` (${comboLabels[comboStage]})`}</span>
          <div style={{flex:1,height:6,background:'#2d3752',borderRadius:3}}>
            <div style={{height:'100%',borderRadius:3,background:comboColors[comboStage],width:`${comboProgress*100}%`,transition:'width 0.3s'}} />
          </div>
          {comboStage>0&&<span style={{fontSize:'0.68rem',color:comboColors[comboStage]}}>効率+{[0,10,20,35][comboStage]}%</span>}
        </div>
      </div>

      {/* タブ: 採取 / 図鑑 */}
      <div style={{display:'flex',gap:6,marginBottom:12}}>
        <button onClick={() => setActiveTab('gather')} style={{flex:1,padding:'7px',background:activeTab==='gather'?'rgba(91,141,238,0.2)':'#1c2235',border:`1px solid ${activeTab==='gather'?'#5b8dee':'#2d3752'}`,color:activeTab==='gather'?'#e8e6ff':'#8a92b2',borderRadius:6,cursor:'pointer',fontSize:'0.82rem',fontWeight:activeTab==='gather'?700:400}}>
          ⛏️ 採取
        </button>
        <button onClick={() => setActiveTab('collection')} style={{flex:1,padding:'7px',background:activeTab==='collection'?'rgba(240,168,48,0.2)':'#1c2235',border:`1px solid ${activeTab==='collection'?'#f0a830':'#2d3752'}`,color:activeTab==='collection'?'#e8e6ff':'#8a92b2',borderRadius:6,cursor:'pointer',fontSize:'0.82rem',fontWeight:activeTab==='collection'?700:400}}>
          📖 採取図鑑
        </button>
      </div>

      {/* ─── 図鑑タブ ─── */}
      {activeTab === 'collection' && (
        <div>
          {/* 報酬状況 */}
          <div style={{background:'#1c2235',border:'1px solid #f0a830',borderRadius:8,padding:10,marginBottom:12,fontSize:'0.78rem'}}>
            <div style={{color:'#f0a830',fontWeight:700,marginBottom:6}}>📖 図鑑報酬</div>
            <div style={{display:'grid',gap:4}}>
              {ALL_CATEGORIES.map(cat => {
                const items = CATEGORY_ITEM_MAP[cat];
                const disc = items.filter(id => collection.discoveredItems.includes(id)).length;
                const done = disc === items.length && items.length > 0;
                return (
                  <div key={cat} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{color:done?'#4caf87':'#8a92b2'}}>{done?'✅':'⬜'} {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}コンプ → 効率+10%</span>
                    <span style={{color:done?'#4caf87':'#f0c060'}}>{disc}/{items.length}</span>
                  </div>
                );
              })}
              {(() => {
                const rareCount = ALL_GATHER_ITEMS.filter(id => {
                  const it = ITEM_MASTER[id]; return it && (it.rarity === 'rare' || it.rarity === 'epic' || it.rarity === 'legendary');
                }).filter(id => collection.discoveredItems.includes(id)).length;
                return <div style={{display:'flex',justifyContent:'space-between',color:rareCount>=10?'#4caf87':'#8a92b2'}}><span>{rareCount>=10?'✅':'⬜'} レア10種発見 → rare+5%</span><span style={{color:rareCount>=10?'#4caf87':'#f0c060'}}>{rareCount}/10</span></div>;
              })()}
              {(() => {
                const all = collection.discoveredItems.length >= ALL_GATHER_ITEMS.length && ALL_GATHER_ITEMS.length > 0;
                return <div style={{display:'flex',justifyContent:'space-between',color:all?'#4caf87':'#8a92b2'}}><span>{all?'✅':'⬜'} 全体コンプ → 全効率+10%</span><span style={{color:all?'#4caf87':'#f0c060'}}>{collection.discoveredItems.length}/{ALL_GATHER_ITEMS.length}</span></div>;
              })()}
            </div>
          </div>
          {/* カテゴリ別アイテム一覧 */}
          {ALL_CATEGORIES.map(cat => (
            <div key={cat} style={{background:'#161b26',border:'1px solid #2d3752',borderRadius:8,padding:10,marginBottom:10}}>
              <div style={{color:'#f0c060',fontWeight:700,marginBottom:6,fontSize:'0.82rem'}}>{CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                {CATEGORY_ITEM_MAP[cat].map(itemId => {
                  const discovered = collection.discoveredItems.includes(itemId);
                  const count = collection.itemCounts[itemId] ?? 0;
                  const item = ITEM_MASTER[itemId];
                  return (
                    <div key={itemId} style={{background:'#1c2235',border:`1px solid ${discovered?'#2d3752':'#1c2235'}`,borderRadius:6,padding:'4px 8px',opacity:discovered?1:0.4}}>
                      <span style={{fontSize:'0.75rem',color:discovered?'#e8e6ff':'#4a5070'}}>{discovered?(item?.icon?item.icon:''):''} {discovered?(item?.name??itemId):'???'}</span>
                      {discovered&&<span style={{fontSize:'0.65rem',color:'#8a92b2',marginLeft:4}}>×{count}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── 採取タブ ─── */}
      {activeTab === 'gather' && (
        <>
          {/* カテゴリ切り替え */}
          <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
            {ALL_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{flex:'1 0 auto',minWidth:60,padding:'7px 4px',background:activeCategory===cat?'rgba(91,141,238,0.2)':'#1c2235',border:`1px solid ${activeCategory===cat?'#5b8dee':'#2d3752'}`,color:activeCategory===cat?'#e8e6ff':'#8a92b2',borderRadius:6,cursor:'pointer',fontSize:'0.75rem',fontWeight:activeCategory===cat?700:400}}>
                {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
              </button>
            ))}
          </div>

          {/* 装備中ツール */}
          {equippedTool && (
            <div style={{background:'#1c2235',border:'1px solid #f0c060',borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:'0.78rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{color:'#f0c060',fontWeight:700}}>🔧 装備中: {equippedTool.name}</span>
                <button onClick={() => setShowTools(s => !s)} style={{background:'#2d3752',border:'none',borderRadius:6,color:'#e8e6ff',padding:'4px 10px',fontSize:'0.72rem',cursor:'pointer'}}>
                  {showTools?'閉じる':'ツール管理'}
                </button>
              </div>
              <div style={{color:'#8a92b2',display:'flex',flexWrap:'wrap',gap:8}}>
                <span>速度×{equippedTool.speedMultiplier}</span>
                <span>収穫×{equippedTool.yieldMultiplier}</span>
                <span>レア×{equippedTool.rareMultiplier}</span>
                <span>スタミナ×{equippedTool.staminaMultiplier}</span>
                <span>コンボ+{equippedTool.comboBonus}</span>
                {equippedTool.specialEffectId&&<span style={{color:'#f0a830'}}>特殊:{SPECIAL_EFFECT_LABELS[equippedTool.specialEffectId]??equippedTool.specialEffectId}</span>}
              </div>
            </div>
          )}

          {/* ツール管理 */}
          {showTools && (
            <div style={{background:'#161b26',border:'1px solid #2d3752',borderRadius:8,padding:10,marginBottom:12}}>
              <div style={{display:'flex',gap:6,marginBottom:8}}>
                {(['owned','all'] as const).map(t => (
                  <button key={t} onClick={() => setToolTab(t)} style={{padding:'4px 10px',fontSize:'0.72rem',background:toolTab===t?'#5b8dee':'#1c2235',border:`1px solid ${toolTab===t?'#5b8dee':'#2d3752'}`,color:toolTab===t?'#fff':'#8a92b2',borderRadius:6,cursor:'pointer'}}>
                    {t==='owned'?`所持 (${allToolList.filter(t2=>getToolStatus(t2.id)==='owned').length})`:`全種類 (${allToolList.length})`}
                  </button>
                ))}
              </div>
              <div style={{maxHeight:250,overflowY:'auto',display:'grid',gap:5,gridTemplateColumns:'1fr 1fr'}}>
                {toolListFiltered.map(tool => {
                  const status = getToolStatus(tool.id);
                  const equipped = tool.id === equippedToolId;
                  const hint = getToolHint(tool.id);
                  const borderColor = equipped?'#f0c060':status==='owned'?'#4caf87':status==='locked'?'#e05555':'#2d3752';
                  const bg = equipped?'rgba(240,192,96,0.15)':status==='owned'?'rgba(76,175,135,0.08)':'#1c2235';
                  return (
                    <button key={tool.id} onClick={() => status==='owned' && setEquippedTool(activeCategory, tool.id)} disabled={status!=='owned'}
                      style={{textAlign:'left',padding:'6px 8px',borderRadius:6,cursor:status==='owned'?'pointer':'default',background:bg,border:`1px solid ${borderColor}`,color:'#e8e6ff',opacity:status==='locked'?0.45:1}}>
                      <div style={{fontWeight:700,fontSize:'0.74rem',color:equipped?'#f0c060':status==='owned'?'#e8e6ff':'#4a5070'}}>
                        {equipped?'★ ':''}{status==='locked'?'🔒 ':status==='unowned'?'❓ ':''}{tool.name}
                      </div>
                      <div style={{fontSize:'0.64rem',color:'#8a92b2'}}>速{tool.speedMultiplier} 収{tool.yieldMultiplier} レ{tool.rareMultiplier}</div>
                      {hint&&<div style={{fontSize:'0.62rem',color:'#5b8dee'}}>{hint}</div>}
                      {tool.specialEffectId&&<div style={{fontSize:'0.62rem',color:'#f0a830'}}>{SPECIAL_EFFECT_LABELS[tool.specialEffectId]??tool.specialEffectId}</div>}
                    </button>
                  );
                })}
              </div>
              {/* 条件解放進捗 */}
              <div style={{marginTop:10,borderTop:'1px solid #2d3752',paddingTop:8}}>
                <div style={{fontSize:'0.72rem',color:'#8a92b2',fontWeight:700,marginBottom:6}}>🔓 条件解放進捗</div>
                {TOOL_UNLOCK_CONDITIONS.map(cond => {
                  const done = unlockedGroups.has(cond.id);
                  const progress = (() => {
                    if (cond.id==='unlock_basic') return `${Math.min(stats.totalGatherCount,100)}/100`;
                    if (cond.id==='unlock_combo') return `${Math.min(stats.maxCombo,20)}/20`;
                    if (cond.id==='unlock_night') return `${Math.min(stats.nightGatherCount,50)}/50`;
                    if (cond.id==='unlock_rain')  return `${Math.min(stats.rainGatherCount,50)}/50`;
                    if (cond.id==='unlock_danger')return `${Math.min(stats.dangerSuccessCount,10)}/10`;
                    return '';
                  })();
                  return (
                    <div key={cond.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',fontSize:'0.7rem',borderBottom:'1px solid #1c2235'}}>
                      <span style={{color:done?'#4caf87':'#8a92b2'}}>{done?'✅':'⬜'} {cond.label}</span>
                      <span style={{color:done?'#4caf87':'#f0c060'}}>{done?'解放済み':progress}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 採掘委任（オフライン採掘） */}
          {(() => {
            const om = player?.offlineMining ?? { enabled: false, category: activeCategory, startedAt: 0, lastSettledAt: 0 };
            const isOnForThisCategory = om.enabled && om.category === activeCategory;
            return (
              <div style={{background:'#1c2235',border:`1px solid ${om.enabled?'#4caf87':'#2d3752'}`,borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:'0.78rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{color:om.enabled?'#4caf87':'#8a92b2',fontWeight:700}}>
                      🏕️ 採掘委任：{om.enabled?'採掘中':'停止中'}
                    </div>
                    <div style={{fontSize:'0.68rem',color:'#8a92b2',marginTop:2}}>
                      留守中に採掘を行います（最大30個まで）
                    </div>
                    {om.enabled && (
                      <div style={{fontSize:'0.68rem',color:'#5b8dee',marginTop:2}}>
                        対象カテゴリ: {CATEGORY_CONFIG[om.category as GatherCategory]?.icon} {CATEGORY_CONFIG[om.category as GatherCategory]?.label}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setOfflineMining(!(om.enabled), activeCategory)}
                    style={{
                      minWidth:60, padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer',
                      fontWeight:700, fontSize:'0.76rem', color:'#fff',
                      background: om.enabled ? 'linear-gradient(135deg,#4caf87,#2f8a5f)' : '#2d3752',
                    }}
                  >
                    {om.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {!isOnForThisCategory && om.enabled && (
                  <div style={{fontSize:'0.66rem',color:'#f0a830',marginTop:6}}>
                    ※ 現在は「{CATEGORY_CONFIG[om.category as GatherCategory]?.label}」が対象です。このカテゴリに切り替えるには一度OFFにしてから再度ONにしてください。
                  </div>
                )}
              </div>
            );
          })()}

          {/* 通常ノード */}
          <div style={{display:'grid',gap:10,gridTemplateColumns:'1fr 1fr'}}>
            {categoryNodes.map(node => {
              const skillLv = player?.skillLevels[node.requiredSkill.skillId] ?? 1;
              const meetsLv = skillLv >= node.requiredSkill.minLevel;
              const cd = cooldowns[node.id] ?? 0;
              const disabled = !meetsLv || cd > 0;
              return (
                <div key={node.id} style={{background:'#1c2235',border:'1px solid #2d3752',borderRadius:10,padding:12,opacity:meetsLv?1:0.5}}>
                  <div style={{display:'flex',gap:8,marginBottom:8}}>
                    <span style={{fontSize:'1.8rem'}}><GameIcon id={node.icon} size={36} /></span>
                    <div>
                      <div style={{fontWeight:700,fontSize:'0.9rem'}}>{node.name}</div>
                      <div style={{fontSize:'0.72rem',color:'#8a92b2'}}>{node.description}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
                    {node.drops.map(d => {
                      const rate = Math.min(100,Math.floor((d.baseRate+(d.skillRateBonus??0)*skillLv)*(equippedTool?.rareMultiplier??1)*100));
                      return (
                        <span key={d.itemId} style={{background:'rgba(91,141,238,0.12)',border:'1px solid rgba(91,141,238,0.3)',borderRadius:20,padding:'2px 7px',fontSize:'0.68rem',color:'#5b8dee'}}>
                          {ITEM_MASTER[d.itemId]?.name??d.itemId} ({rate}%)
                        </span>
                      );
                    })}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.72rem',marginBottom:8}}>
                    <span style={{color:'#8a92b2'}}>Lv.{node.requiredSkill.minLevel}〜 <span style={{color:'#4caf87'}}>(自Lv.{skillLv})</span></span>
                    <span style={{color:'#f0a830'}}>🍖 -{Math.max(1,Math.round(node.staminaCost*(equippedTool?.staminaMultiplier??1)))}</span>
                  </div>
                  <button onClick={() => handleGather(node.id)} disabled={disabled}
                    style={{width:'100%',padding:'8px',fontWeight:700,fontSize:'0.82rem',background:disabled?'#2d3752':'linear-gradient(135deg,#5b8dee,#3d6fd0)',color:disabled?'#4a5070':'#fff',border:'none',borderRadius:6,cursor:disabled?'not-allowed':'pointer'}}>
                    {!meetsLv?`🔒 Lv.${node.requiredSkill.minLevel}必要`:cd>0?`⏳ ${(cd/1000).toFixed(1)}s`:'採取する'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 危険ノード */}
          {dangerNodes.length > 0 && (
            <div style={{marginTop:16}}>
              <div style={{color:'#e05555',fontWeight:700,fontSize:'0.85rem',marginBottom:8}}>⚠️ 危険ノード（高報酬・高リスク）</div>
              <div style={{display:'grid',gap:10,gridTemplateColumns:'1fr 1fr'}}>
                {dangerNodes.map(node => {
                  const skillLv = player?.skillLevels[node.requiredSkill.skillId] ?? 1;
                  const meetsLv = skillLv >= node.requiredSkill.minLevel;
                  const cd = cooldowns[node.id] ?? 0;
                  const disabled = !meetsLv || cd > 0;
                  return (
                    <div key={node.id} style={{background:'rgba(224,85,85,0.08)',border:'2px solid #e05555',borderRadius:10,padding:12,opacity:meetsLv?1:0.5}}>
                      <div style={{fontWeight:700,fontSize:'0.88rem',color:'#e05555',marginBottom:4}}>{node.name}</div>
                      <div style={{fontSize:'0.7rem',color:'#8a92b2',marginBottom:6}}>{node.description}</div>
                      <div style={{fontSize:'0.7rem',color:'#f0a830',marginBottom:6}}>🍖 -{node.staminaCost*2} (×2消費) | 報酬×2〜5</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
                        {node.drops.map(d => (
                          <span key={d.itemId} style={{background:'rgba(224,85,85,0.12)',border:'1px solid rgba(224,85,85,0.3)',borderRadius:20,padding:'2px 7px',fontSize:'0.68rem',color:'#e05555'}}>
                            {ITEM_MASTER[d.itemId]?.name??d.itemId}
                          </span>
                        ))}
                      </div>
                      <button onClick={() => handleGather(node.id)} disabled={disabled}
                        style={{width:'100%',padding:'8px',fontWeight:700,fontSize:'0.82rem',background:disabled?'#2d3752':'linear-gradient(135deg,#e05555,#a03030)',color:disabled?'#4a5070':'#fff',border:'none',borderRadius:6,cursor:disabled?'not-allowed':'pointer'}}>
                        {!meetsLv?`🔒 Lv.${node.requiredSkill.minLevel}必要`:cd>0?`⏳ ${(cd/1000).toFixed(1)}s`:'⚠️ 危険採取'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ログ */}
      {log.length > 0 && (
        <div style={{marginTop:16,background:'#161b26',border:'1px solid #2d3752',borderRadius:8,padding:12}}>
          <h3 style={{fontSize:'0.85rem',color:'#8a92b2',marginBottom:8}}>📋 採取ログ</h3>
          {log.map((e, i) => <div key={i} style={{fontSize:'0.78rem',color:'#e8e6ff',padding:'3px 0',borderBottom:'1px solid #2d3752'}}>{e}</div>)}
        </div>
      )}
    </div>
  );
}
