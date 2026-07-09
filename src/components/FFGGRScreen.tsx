// src/components/screens/FFGGRScreen.tsx
import { useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  FFGGR_AREAS, FFGGR_MONSTERS, FFGGR_SHOPS, FFGGR_FEVERS,
  FFGGR_ITEM_MASTER, FFGGR_POINT_KEY, FFGGR_NUTS_COUNT_KEY,
  getMonstersInArea, selectAction, rollDrops, FFGGR_ITEMS,
  type FFGGRMonster,
} from '../../data/ffggrMaster';

// ─── 型 ───────────────────────────────────────────────────────
interface StatusEffect {
  type: 'dot' | 'trap' | 'debuff_def' | 'debuff_atk' | 'buff_enrage' | 'fly';
  turnsLeft: number;
  value?: number;
  label: string;
  emoji: string;
}

interface EnemyPos {
  direction: 'N'|'NE'|'E'|'SE'|'S'|'SW'|'W'|'NW';
  distanceM: number;
  behavior: string;
}
const DIR_LABEL: Record<string,string> = { N:'北',NE:'北東',E:'東',SE:'南東',S:'南',SW:'南西',W:'西',NW:'北西' };
const DIR_EMOJI: Record<string,string> = { N:'⬆️',NE:'↗️',E:'➡️',SE:'↘️',S:'⬇️',SW:'↙️',W:'⬅️',NW:'↖️' };
const ALL_DIRS: EnemyPos['direction'][] = ['N','NE','E','SE','S','SW','W','NW'];
function randomDir(): EnemyPos['direction'] { return ALL_DIRS[Math.floor(Math.random()*8)]; }
function initPos(behavior:string): EnemyPos {
  const distMap: Record<string,[number,number]> = {
    aggressive:[8,15], ranged:[10,18], evasive:[12,20],
    flying:[10,18], circling:[6,12], erratic:[4,20], static:[0,5],
  };
  const [mn,mx] = distMap[behavior]??[5,15];
  return { direction:randomDir(), distanceM:mn+Math.floor(Math.random()*(mx-mn)), behavior };
}
function moveEnemyPos(p: EnemyPos): EnemyPos {
  const di = ALL_DIRS.indexOf(p.direction);
  switch(p.behavior){
    case 'aggressive': return {...p, distanceM:Math.max(0,p.distanceM-(3+Math.floor(Math.random()*3)))};
    case 'ranged': {
      const [mn,mx]=[5,12]; let d=p.distanceM;
      if(d<mn) d=Math.min(d+4,mx); else if(d>mx) d=Math.max(d-4,mn);
      return {...p,distanceM:d};
    }
    case 'evasive': {
      const newDi=(di+(Math.random()<0.5?1:-1)+8)%8;
      return {...p,distanceM:Math.min(p.distanceM+5,20),direction:ALL_DIRS[newDi]};
    }
    case 'flying': {
      const newDi=(di+(Math.random()<0.5?1:-1)+8)%8;
      const d=Math.max(8,Math.min(15,p.distanceM));
      return {...p,distanceM:d,direction:ALL_DIRS[newDi]};
    }
    case 'circling': return {...p,direction:ALL_DIRS[(di+(Math.random()<0.5?1:-1)+8)%8]};
    case 'erratic': return {...p,direction:randomDir(),distanceM:Math.max(0,Math.min(25,p.distanceM+(Math.random()-0.5)*6))};
    default: return p;
  }
}

interface BattleState {
  monster: FFGGRMonster;
  monsterHp: number;
  enemyPos: EnemyPos;
  playerHp: number;
  playerMaxHp: number;
  turn: number;
  log: { text: string; color: string }[];
  effects: StatusEffect[];
  monsterEffects: StatusEffect[];
  phase: 'fighting' | 'won' | 'fled' | 'dead';
  pendingDrops: { itemId: string; amount: number }[];
  expGained: number;
  pointGained: number;
}

// ─── スタイル ──────────────────────────────────────────────────
const S = {
  card: { background:'#161b26', border:'1px solid #2d3752', borderRadius:10, padding:'10px 12px', marginBottom:8 } as React.CSSProperties,
  btn: (color='#5b8dee') => ({ padding:'8px 14px', borderRadius:8, border:'none', background:color, color:'#fff', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' } as React.CSSProperties),
  smBtn: { padding:'5px 10px', borderRadius:6, border:'1px solid #2d3752', background:'#0d1018', color:'#e8e6ff', fontSize:'0.76rem', cursor:'pointer' } as React.CSSProperties,
  tag: (c:string) => ({ padding:'2px 7px', borderRadius:10, background:c+'22', border:`1px solid ${c}44`, color:c, fontSize:'0.65rem', fontWeight:700 } as React.CSSProperties),
  rarityColor: { common:'#8a92b2', uncommon:'#4ca86a', rare:'#5b8dee', epic:'#b060e0', legendary:'#f0c060' } as Record<string,string>,
};

function rarityLabel(r:string){ return {common:'普通',uncommon:'良品',rare:'レア',epic:'エピック',legendary:'伝説'}[r]??r; }
function itemName(id:string){ return FFGGR_ITEM_MASTER[id]?.name ?? id; }
function itemEmoji(id:string){ return FFGGR_ITEM_MASTER[id]?.emoji ?? '📦'; }

// ─── バトルログ ──────────────────────────────────────────────
function BattleLog({ log }:{ log:{text:string;color:string}[] }){
  return (
    <div style={{ maxHeight:160, overflowY:'auto', display:'flex', flexDirection:'column-reverse', gap:2, padding:6, background:'#0a0d14', borderRadius:8, marginBottom:8 }}>
      {[...log].reverse().map((l,i)=>(
        <div key={i} style={{ fontSize:'0.72rem', color:l.color, lineHeight:1.4 }}>{l.text}</div>
      ))}
    </div>
  );
}

// ─── HPバー ──────────────────────────────────────────────────
function HpBar({ current, max, color='#4ca86a' }:{ current:number; max:number; color?:string }){
  const pct = Math.max(0, Math.min(100, current/max*100));
  return (
    <div style={{ height:8, background:'#1e2535', borderRadius:4, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:color, transition:'width 0.3s', borderRadius:4 }} />
    </div>
  );
}

// ─── 状態異常表示 ────────────────────────────────────────────
function EffectsRow({ effects }:{ effects:StatusEffect[] }){
  if (!effects.length) return null;
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
      {effects.map((e,i)=>(
        <span key={i} style={S.tag('#f0c060')}>{e.emoji}{e.label} {e.turnsLeft}T</span>
      ))}
    </div>
  );
}

// ─── バトル画面 ──────────────────────────────────────────────
function BattleScreen({ battle, onAction, onFlee }:{
  battle: BattleState;
  onAction: (type:'attack'|'skill') => void;
  onFlee: () => void;
}){
  const m = battle.monster;
  const hpPct = battle.monsterHp / m.maxHp;
  return (
    <div>
      {/* モンスター情報 */}
      {/* 位置表示 */}
      <div style={{ ...S.card, background:'#0a0d14', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:'0.68rem', color:'#8a92b2' }}>敵の位置</span>
        <span style={{ fontSize:'0.88rem' }}>{DIR_EMOJI[battle.enemyPos.direction]} {DIR_LABEL[battle.enemyPos.direction]}</span>
        <span style={{ fontSize:'0.78rem', color:'#f0c060', fontWeight:700 }}>{Math.round(battle.enemyPos.distanceM)}m</span>
        <span style={{ fontSize:'0.65rem', color:'#4a5070' }}>
          {battle.enemyPos.behavior==='aggressive'?'突進型':battle.enemyPos.behavior==='ranged'?'遠距離型':battle.enemyPos.behavior==='evasive'?'逃走型':battle.enemyPos.behavior==='flying'?'飛行型':battle.enemyPos.behavior==='circling'?'旋回型':battle.enemyPos.behavior==='erratic'?'不規則型':'固定型'}
        </span>
      </div>
      <div style={{ ...S.card, borderColor: hpPct < 0.3 ? '#7a2020' : '#2d3752' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <span style={{ fontSize:'2rem' }}>{m.emoji}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:'0.9rem', color:'#e8e6ff' }}>{m.name}</div>
            <div style={{ fontSize:'0.68rem', color:'#8a92b2' }}>
              {m.isBoss && <span style={S.tag('#e05555')}>BOSS</span>}
              {m.isMidBoss && <span style={S.tag('#f0a020')}>中ボス</span>}
              {m.isRareBoss && <span style={S.tag('#b060e0')}>レアボス</span>}
              {m.isSpecialZombie && <span style={S.tag('#4ca86a')}>特殊ゾンビ</span>}
              {m.traits?.map(t=><span key={t} style={{ marginLeft:4, color:'#8a92b2' }}>・{t}</span>)}
            </div>
          </div>
          <div style={{ textAlign:'right', fontSize:'0.75rem' }}>
            <div style={{ color:'#e05555', fontWeight:700 }}>{battle.monsterHp.toLocaleString()}</div>
            <div style={{ color:'#4a5070' }}>/ {m.maxHp.toLocaleString()}</div>
          </div>
        </div>
        <HpBar current={battle.monsterHp} max={m.maxHp} color={hpPct<0.3?'#e05555':hpPct<0.6?'#f0a020':'#4ca86a'} />
        <EffectsRow effects={battle.monsterEffects} />
      </div>

      {/* プレイヤー情報 */}
      <div style={{ ...S.card }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:'0.76rem' }}>
          <span style={{ color:'#e8e6ff' }}>あなたのHP</span>
          <span style={{ color:'#4ca86a', fontWeight:700 }}>{battle.playerHp.toLocaleString()} / {battle.playerMaxHp.toLocaleString()}</span>
        </div>
        <HpBar current={battle.playerHp} max={battle.playerMaxHp} color='#4ca86a' />
        <EffectsRow effects={battle.effects} />
        <div style={{ fontSize:'0.65rem', color:'#4a5070', marginTop:4 }}>ターン {battle.turn}</div>
      </div>

      {/* バトルログ */}
      <BattleLog log={battle.log} />

      {/* アクションボタン */}
      {battle.phase === 'fighting' && (
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ ...S.btn('#e05555'), flex:2 }} onClick={()=>onAction('attack')}>⚔️ 攻撃</button>
          <button style={{ ...S.btn('#2d3752'), flex:1, border:'1px solid #4a5070' }} onClick={onFlee}>🏃 逃げる</button>
        </div>
      )}

      {/* 結果表示 */}
      {battle.phase !== 'fighting' && (
        <div style={{ ...S.card, textAlign:'center', borderColor: battle.phase==='won'?'#4ca86a':battle.phase==='fled'?'#f0c060':'#e05555' }}>
          {battle.phase==='won' && (
            <>
              <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#4ca86a', marginBottom:8 }}>✨ 勝利！</div>
              <div style={{ fontSize:'0.76rem', color:'#f0c060' }}>EXP +{battle.expGained} / POINT +{battle.pointGained}</div>
              {battle.pendingDrops.length > 0 && (
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:'0.72rem', color:'#8a92b2', marginBottom:4 }}>ドロップ:</div>
                  {battle.pendingDrops.map((d,i)=>(
                    <div key={i} style={{ fontSize:'0.78rem', color:'#e8e6ff' }}>
                      {itemEmoji(d.itemId)} {itemName(d.itemId)} × {d.amount}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {battle.phase==='fled' && <div style={{ fontSize:'1rem', fontWeight:800, color:'#f0c060' }}>🏃 逃走した</div>}
          {battle.phase==='dead' && <div style={{ fontSize:'1rem', fontWeight:800, color:'#e05555' }}>💀 倒れた...</div>}
        </div>
      )}
    </div>
  );
}

// ─── NPCショップ ─────────────────────────────────────────────
function ShopPanel({ inventory, onTrade }:{ inventory:Record<string,number>; onTrade:(s1id:string,s1a:number,rid:string,ra:number,s2id?:string,s2a?:number,s3id?:string,s3a?:number)=>void }){
  const [shopId, setShopId] = useState(FFGGR_SHOPS[0].id);
  const shop = FFGGR_SHOPS.find(s=>s.id===shopId)!;
  function canTrade(t:typeof shop.trades[0]){
    if((inventory[t.slot1ItemId]??0)<t.slot1Amount) return false;
    if(t.slot2ItemId && (inventory[t.slot2ItemId]??0)<(t.slot2Amount??0)) return false;
    if(t.slot3ItemId && (inventory[t.slot3ItemId]??0)<(t.slot3Amount??0)) return false;
    return true;
  }
  return (
    <div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
        {FFGGR_SHOPS.map(s=>(
          <button key={s.id} onClick={()=>setShopId(s.id)} style={{
            padding:'5px 8px', borderRadius:6, fontSize:'0.68rem', fontWeight:700,
            border:`1px solid ${shopId===s.id?'#5b8dee':'#2d3752'}`,
            background:shopId===s.id?'rgba(91,141,238,0.15)':'transparent',
            color:shopId===s.id?'#5b8dee':'#8a92b2',
          }}>{s.emoji} {s.name}</button>
        ))}
      </div>
      <div style={S.card}>
        <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#f0c060', marginBottom:4 }}>{shop.emoji} {shop.name}</div>
        <div style={{ fontSize:'0.7rem', color:'#8a92b2', marginBottom:8 }}>{shop.description}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {shop.trades.map(t=>{
            const ok = canTrade(t);
            const ri = FFGGR_ITEM_MASTER[t.resultItemId];
            return (
              <div key={t.id} style={{ ...S.card, background:'#0d1018', display:'flex', alignItems:'center', gap:8, opacity:ok?1:0.5 }}>
                <div style={{ flex:1, fontSize:'0.72rem' }}>
                  <span style={{ color:'#e8e6ff' }}>{itemEmoji(t.slot1ItemId)} {itemName(t.slot1ItemId)}×{t.slot1Amount}</span>
                  {t.slot2ItemId && <span style={{ color:'#8a92b2' }}> + {itemEmoji(t.slot2ItemId)} {itemName(t.slot2ItemId)}×{t.slot2Amount}</span>}
                  {t.slot3ItemId && <span style={{ color:'#8a92b2' }}> + {itemEmoji(t.slot3ItemId)} {itemName(t.slot3ItemId)}×{t.slot3Amount}</span>}
                  <span style={{ color:'#f0c060' }}> → {ri?.emoji??'📦'} {ri?.name??t.resultItemId}×{t.resultAmount}</span>
                </div>
                <button
                  style={{ ...S.btn(ok?'#5b8dee':'#2d3752'), padding:'5px 10px', fontSize:'0.72rem', opacity:ok?1:0.4 }}
                  disabled={!ok}
                  onClick={()=>onTrade(t.slot1ItemId,t.slot1Amount,t.resultItemId,t.resultAmount,t.slot2ItemId,t.slot2Amount,t.slot3ItemId,t.slot3Amount)}
                >交換</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── アイテム図鑑 ─────────────────────────────────────────────
function ItemsPanel({ inventory }:{ inventory:Record<string,number> }){
  const [filter, setFilter] = useState('');
  const items = Object.values(FFGGR_ITEM_MASTER)
    .filter(i => !filter || i.name.includes(filter) || i.category.includes(filter))
    .sort((a,b)=>{
      const order = ['legendary','epic','rare','uncommon','common'];
      return order.indexOf(a.rarity) - order.indexOf(b.rarity);
    });
  return (
    <div>
      <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="アイテム検索..." style={{ width:'100%', padding:'7px 10px', borderRadius:7, background:'#0d1018', border:'1px solid #2d3752', color:'#e8e6ff', fontSize:'0.82rem', marginBottom:10 }} />
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {items.map(item=>{
          const have = inventory[item.id]??0;
          const rc = S.rarityColor[item.rarity]??'#8a92b2';
          return (
            <div key={item.id} style={{ ...S.card, display:'flex', alignItems:'center', gap:8, opacity:have>0?1:0.45 }}>
              <span style={{ fontSize:'1.2rem' }}>{item.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.8rem', fontWeight:700, color:'#e8e6ff' }}>{item.name}</div>
                <div style={{ fontSize:'0.65rem', color:'#8a92b2' }}>{item.description}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={S.tag(rc)}>{rarityLabel(item.rarity)}</span>
                <div style={{ fontSize:'0.75rem', color:have>0?'#f0c060':'#4a5070', marginTop:2, fontWeight:700 }}>×{have}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── フィーバー表示 ───────────────────────────────────────────
function FeverPanel({ ffggrPoint, onSpendPoint }:{ ffggrPoint:number; onSpendPoint:(cost:number,reward:string)=>void }){
  return (
    <div>
      <div style={{ ...S.card, borderColor:'#f0c060' }}>
        <div style={{ fontWeight:800, fontSize:'0.9rem', color:'#f0c060', marginBottom:4 }}>⭐ FFGGRポイント: {ffggrPoint}</div>
        <div style={{ fontSize:'0.72rem', color:'#8a92b2', marginBottom:10 }}>敵撃破（確率1pt）・釣りクレート開封で獲得。レイドTP(1pt)や木の実採取追加(10pt)に使用。</div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ ...S.btn('#5b8dee'), flex:1 }} onClick={()=>onSpendPoint(1,'raid_tp')} disabled={ffggrPoint<1}>1pt → レイドTP</button>
          <button style={{ ...S.btn('#b060e0'), flex:1 }} onClick={()=>onSpendPoint(10,'nuts_extra')} disabled={ffggrPoint<10}>10pt → 木の実採取+4</button>
        </div>
      </div>
      <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#e8e6ff', marginBottom:8 }}>🌈 フィーバー一覧</div>
      {Object.values(FFGGR_FEVERS).map(f=>(
        <div key={f.type} style={S.card}>
          <div style={{ fontWeight:700, fontSize:'0.82rem', color:'#f0c060' }}>{f.emoji} {f.name}</div>
          <div style={{ fontSize:'0.7rem', color:'#8a92b2', marginTop:2 }}>{f.description}</div>
          <div style={{ fontSize:'0.65rem', color:'#4a5070', marginTop:4 }}>
            発生条件: {f.triggerBy==='fishing'?'FFGGR釣りで確率':f.triggerBy==='battle'?'敵撃破で確率':'釣りまたは敵撃破（超低確率）'}
            　持続: {f.duration}回
          </div>
        </div>
      ))}
    </div>
  );
}


// ─── クレート開封パネル ──────────────────────────────────────
function CratePanel({ inventory, gold, onOpen }:{
  inventory:Record<string,number>; gold:number;
  onOpen:(crateId:string,payExtra:boolean,extraCost:number)=>void;
}){
  const crates = [
    { id:'ffggr_crate_leather',    name:'革クレート',        emoji:'📦', extraCost:50000   },
    { id:'ffggr_crate_gold',       name:'金クレート',        emoji:'🟨', extraCost:200000  },
    { id:'ffggr_crate_diamond',    name:'ダイヤクレート',    emoji:'💠', extraCost:1000000 },
    { id:'ffggr_crate_diamond_ex', name:'強化ダイヤクレート',emoji:'💎', extraCost:3000000 },
  ];
  return (
    <div>
      <div style={{ fontSize:'0.72rem', color:'#8a92b2', marginBottom:10 }}>
        クレートを開封してアイテムを入手。追加料金を払うとドロップ候補が拡張されます。
      </div>
      {crates.map(cr=>{
        const have = inventory[cr.id]??0;
        const canExtra = gold>=cr.extraCost;
        return (
          <div key={cr.id} style={{ ...S.card, opacity:have>0?1:0.4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontSize:'1.5rem' }}>{cr.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#e8e6ff' }}>{cr.name}</div>
                <div style={{ fontSize:'0.7rem', color:'#8a92b2' }}>所持: {have}個</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button style={{ ...S.btn('#2d3752'), flex:1, border:'1px solid #4a5070', opacity:have>0?1:0.3 }}
                disabled={have<=0}
                onClick={()=>onOpen(cr.id,false,0)}>
                開封（無料）
              </button>
              <button style={{ ...S.btn('#f0a020'), flex:1.5, fontSize:'0.75rem', opacity:(have>0&&canExtra)?1:0.3 }}
                disabled={have<=0||!canExtra}
                onClick={()=>onOpen(cr.id,true,cr.extraCost)}>
                追加ドロップ（{(cr.extraCost/10000).toFixed(0)}万G）
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── メイン画面 ──────────────────────────────────────────────
export function FFGGRScreen(){
  const player      = useGameStore(s=>s.player);
  const addItems    = useGameStore(s=>s.addItems);
  const consumeItem = useGameStore(s=>s.consumeItem);
  const changeGold  = useGameStore(s=>s.changeGold);
  const addNotif    = useGameStore(s=>s.addNotification);
  const [tab, setTab] = useState<'area'|'battle'|'shop'|'items'|'fever'|'crate'>('area');
  const [battle, setBattle] = useState<BattleState|null>(null);

  const inventory = player?.inventory ?? {};
  const ffggrPoint = (inventory[FFGGR_POINT_KEY] ?? 0);
  const playerMaxHp = 1000 + (player?.stats?.level ?? 1) * 50;

  // ─── 戦闘開始 ───
  function startBattle(monster: FFGGRMonster){
    const behavior = (monster as any).moveBehavior ?? 'aggressive';
    setBattle({
      monster,
      monsterHp: monster.maxHp,
      enemyPos: initPos(behavior),
      playerHp: playerMaxHp,
      playerMaxHp,
      turn: 1,
      log: [{ text:`⚔️ ${monster.emoji} ${monster.name} が現れた！`, color:'#f0c060' }],
      effects: [],
      monsterEffects: [],
      phase: 'fighting',
      pendingDrops: [],
      expGained: 0,
      pointGained: 0,
    });
    setTab('battle');
  }

  // ─── プレイヤー攻撃 ───
  const handleAttack = useCallback(()=>{
    if(!battle || battle.phase!=='fighting') return;
    const atk = 100 + (player?.stats?.level??1) * 10;
    const def = battle.monster.defense;
    // 状態異常チェック
    const isTrap = battle.effects.find(e=>e.type==='trap');
    if(isTrap){
      const newEffects = battle.effects.map(e=>e.type==='trap'?{...e,turnsLeft:e.turnsLeft-1}:e).filter(e=>e.turnsLeft>0);
      setBattle(prev=>prev?{...prev,effects:newEffects,log:[...prev.log,{text:`⛓️ 拘束中で行動不能！`,color:'#8a92b2'}],turn:prev.turn+1}:null);
      handleMonsterTurn();
      return;
    }
    // 飛行中は物理無効
    const isFlying = battle.monsterEffects.find(e=>e.type==='fly');
    let dmg = Math.max(1, Math.floor((atk - def*0.5) * (0.85 + Math.random()*0.3)));
    let logText = `⚔️ あなたの攻撃！ ${battle.monster.name}に ${dmg} ダメージ！`;
    if(isFlying){
      dmg = 0;
      logText = `🦅 ${battle.monster.name}は飛行中！物理攻撃が届かない！（貫通スキルは有効）`;
    }
    const newMonsterHp = Math.max(0, battle.monsterHp - dmg);
    const newMonsterEffects = battle.monsterEffects.map(e=>({...e,turnsLeft:e.turnsLeft-1})).filter(e=>e.turnsLeft>0);
    if(newMonsterHp<=0){
      // 勝利
      const drops = rollDrops(battle.monster);
      const exp = battle.monster.baseExp;
      const pointGain = Math.random()<0.3?1:0;
      drops.forEach(d=>addItems([d]));
      if(pointGain>0) addItems([{itemId:FFGGR_POINT_KEY, amount:pointGain}]);
      setBattle(prev=>prev?{
        ...prev, monsterHp:0, monsterEffects:newMonsterEffects,
        phase:'won', pendingDrops:drops, expGained:exp, pointGained:pointGain,
        log:[...prev.log,{text:logText,color:'#4ca86a'},{text:`🏆 ${prev.monster.name}を倒した！EXP+${exp}`,color:'#f0c060'}],
      }:null);
    } else {
      setBattle(prev=>prev?{...prev, monsterHp:newMonsterHp, monsterEffects:newMonsterEffects, log:[...prev.log,{text:logText,color:'#4ca86a'}]}:null);
      setTimeout(()=>handleMonsterTurn(), 300);
    }
  },[battle, player]);

  // ─── モンスターターン ───
  const handleMonsterTurn = useCallback(()=>{
    setBattle(prev=>{
      if(!prev||prev.phase!=='fighting') return prev;
      const m = prev.monster;
      const hpPct = prev.monsterHp/m.maxHp;
      const action = selectAction(m, hpPct, prev.turn);
      let newPlayerHp = prev.playerHp;
      let newEffects = [...prev.effects];
      let newMonsterHp = prev.monsterHp;
      let newMonsterEffects = [...prev.monsterEffects];
      const logs: {text:string;color:string}[] = [];

      // デバフ補正
      const defDebuff = prev.monsterEffects.find(e=>e.type==='debuff_def');
      const atkDebuff = prev.monsterEffects.find(e=>e.type==='debuff_atk');
      const enrage    = prev.monsterEffects.find(e=>e.type==='buff_enrage');
      const dmgMult   = (defDebuff?2.0:1.0) * (enrage?1.5:1.0) * (atkDebuff?0.7:1.0);

      function calcDmg(power:number, pen:number=0){
        const base = Math.floor(m.attack * power * dmgMult);
        return Math.max(1, base - Math.floor(50*0.3) + pen);
      }

      const msg = action.message ?? `${m.emoji} ${m.name}の「${action.name}」！`;

      switch(action.type){
        case 'atk_normal': {
          const d = calcDmg(action.power??1);
          newPlayerHp -= d;
          logs.push({text:`${msg} ${d}ダメージ！`,color:'#e05555'});
          break;
        }
        case 'atk_penetrate': {
          const d = calcDmg(action.power??1, action.penetrateDmg??0);
          newPlayerHp -= d;
          logs.push({text:`${msg} 貫通${d}ダメージ！`,color:'#e05555'});
          break;
        }
        case 'atk_multi': {
          const hits = action.hitCount??2;
          let total = 0;
          for(let i=0;i<hits;i++) total += calcDmg(action.power??0.7);
          newPlayerHp -= total;
          logs.push({text:`${msg} ${hits}連続攻撃！合計${total}ダメージ！`,color:'#e05555'});
          break;
        }
        case 'atk_aoe': {
          const d = calcDmg(action.power??1);
          newPlayerHp -= d;
          logs.push({text:`${msg} 全体攻撃！${d}ダメージ！`,color:'#e05555'});
          break;
        }
        case 'atk_dot': {
          const d = calcDmg(action.power??0.8);
          newPlayerHp -= d;
          const dot: StatusEffect = { type:'dot', turnsLeft:action.dotTurns??3, value:action.dotDamage??50, label:'毒', emoji:'☠️' };
          newEffects = [...newEffects.filter(e=>e.type!=='dot'), dot];
          logs.push({text:`${msg} ${d}ダメージ！☠️ ${action.dotTurns}ターン毒（毎ターン${action.dotDamage}ダメ）`,color:'#e05555'});
          break;
        }
        case 'heal_self': {
          const healAmt = Math.floor(m.maxHp * (action.healPct??0.05));
          newMonsterHp = Math.min(m.maxHp, prev.monsterHp + healAmt);
          logs.push({text:action.message??`💚 ${m.name}がHPを${healAmt}回復！`,color:'#4ca86a'});
          break;
        }
        case 'heal_party': {
          const healAmt = Math.floor(prev.playerMaxHp * (action.healPct??0.05));
          newPlayerHp = Math.min(prev.playerMaxHp, prev.playerHp + healAmt);
          logs.push({text:msg,color:'#4ca86a'});
          break;
        }
        case 'absorb': {
          const d = calcDmg(action.power??1);
          newPlayerHp -= d;
          newMonsterHp = Math.min(m.maxHp, prev.monsterHp + d);
          logs.push({text:msg,color:'#e05555'},{text:`💚 ${m.name}が${d}HP回復！`,color:'#4ca86a'});
          break;
        }
        case 'debuff_def': {
          const ef: StatusEffect = { type:'debuff_def', turnsLeft:action.debuffTurns??2, value:action.debuffPct??0.3, label:'防御低下', emoji:'⬇️' };
          newMonsterEffects = [...newMonsterEffects.filter(e=>e.type!=='debuff_def'), ef];
          logs.push({text:action.message??`⬇️ ${m.name}の防御が下がった！（${action.debuffTurns}T）`,color:'#f0c060'});
          break;
        }
        case 'debuff_atk': {
          const ef: StatusEffect = { type:'debuff_atk', turnsLeft:action.debuffTurns??2, value:action.debuffPct??0.3, label:'攻撃低下', emoji:'⬇️' };
          newMonsterEffects = [...newMonsterEffects.filter(e=>e.type!=='debuff_atk'), ef];
          logs.push({text:action.message??`⬇️ ${m.name}の攻撃が下がった！（${action.debuffTurns}T）`,color:'#f0c060'});
          break;
        }
        case 'buff_enrage': {
          const ef: StatusEffect = { type:'buff_enrage', turnsLeft:999, value:1.5, label:'激怒', emoji:'💢' };
          newMonsterEffects = [...newMonsterEffects.filter(e=>e.type!=='buff_enrage'), ef];
          logs.push({text:action.message??`💢 ${m.name}が激怒！攻撃力1.5倍！`,color:'#e05555'});
          break;
        }
        case 'trap': {
          const ef: StatusEffect = { type:'trap', turnsLeft:action.trapTurns??1, label:'拘束', emoji:'⛓️' };
          newEffects = [...newEffects.filter(e=>e.type!=='trap'), ef];
          if(action.power && action.power>0){
            const d = calcDmg(action.power);
            newPlayerHp -= d;
            logs.push({text:`${msg} ${d}ダメージ！⛓️ ${action.trapTurns}ターン行動不能！`,color:'#e05555'});
          } else {
            logs.push({text:msg,color:'#f0c060'});
          }
          break;
        }
        case 'fly': {
          const ef: StatusEffect = { type:'fly', turnsLeft:2, label:'飛行（物理無効）', emoji:'🦅' };
          newMonsterEffects = [...newMonsterEffects.filter(e=>e.type!=='fly'), ef];
          logs.push({text:msg,color:'#f0c060'});
          break;
        }
        case 'summon': {
          logs.push({text:msg,color:'#f0a020'});
          break;
        }
        default: {
          const d = calcDmg(1);
          newPlayerHp -= d;
          logs.push({text:`⚔️ ${m.name}の攻撃！ ${d}ダメージ！`,color:'#e05555'});
        }
      }

      // DOTダメージ処理
      const dotEffect = newEffects.find(e=>e.type==='dot');
      if(dotEffect){
        newPlayerHp -= dotEffect.value??50;
        logs.push({text:`☠️ 毒で${dotEffect.value}ダメージ！`,color:'#b060e0'});
        newEffects = newEffects.map(e=>e.type==='dot'?{...e,turnsLeft:e.turnsLeft-1}:e).filter(e=>e.turnsLeft>0);
      }

      const phase = newPlayerHp<=0 ? 'dead' : 'fighting';
      if(phase==='dead') logs.push({text:'💀 あなたは倒れた...',color:'#e05555'});

      const newPos = phase==='fighting' ? moveEnemyPos(prev.enemyPos) : prev.enemyPos;
      return {
        ...prev, playerHp:Math.max(0,newPlayerHp), monsterHp:newMonsterHp,
        effects:newEffects, monsterEffects:newMonsterEffects,
        log:[...prev.log,...logs], turn:prev.turn+1, phase, enemyPos:newPos,
      };
    });
  },[]);

  function handleFlee(){
    setBattle(prev=>prev?{...prev,phase:'fled',log:[...prev.log,{text:'🏃 逃走した！',color:'#f0c060'}]}:null);
  }

  // ─── NPC取引 ───
  function handleTrade(s1id:string,s1a:number,rid:string,ra:number,s2id?:string,s2a?:number,s3id?:string,s3a?:number){
    if(!consumeItem(s1id,s1a)){ addNotif('error',`${itemName(s1id)}が不足しています`); return; }
    if(s2id&&s2a){ if(!consumeItem(s2id,s2a)){ addItems([{itemId:s1id,amount:s1a}]); addNotif('error',`${itemName(s2id)}が不足しています`); return; } }
    if(s3id&&s3a){ if(!consumeItem(s3id,s3a)){ addItems([{itemId:s1id,amount:s1a}]); if(s2id&&s2a)addItems([{itemId:s2id,amount:s2a}]); addNotif('error',`${itemName(s3id)}が不足しています`); return; } }
    addItems([{itemId:rid,amount:ra}]);
    addNotif('success',`${FFGGR_ITEM_MASTER[rid]?.emoji??'📦'} ${itemName(rid)}×${ra}を入手！`);
  }

  // ─── ポイント消費 ───
  function handleSpendPoint(cost:number, reward:string){
    if(ffggrPoint<cost){ addNotif('error','FFGGRポイントが足りません'); return; }
    if(!consumeItem(FFGGR_POINT_KEY,cost)){ addNotif('error','ポイント消費失敗'); return; }
    if(reward==='nuts_extra'){
      addItems([{itemId:FFGGR_NUTS_COUNT_KEY,amount:4}]);
      addNotif('success','木の実採取回数を4回追加しました');
    } else {
      addNotif('success','レイドTPポイントを1消費しました（実際のTPはゲーム内で実行）');
    }
  }

  // ─── 木の実採取 ───
  function handleNutsHarvest(){
    const nutsDailyMax = 32 + (inventory[FFGGR_NUTS_COUNT_KEY]??0);
    const todayHarvested = inventory['ffggr_nuts_today']??0;
    if(todayHarvested>=nutsDailyMax){ addNotif('error',`本日の採取上限(${nutsDailyMax}個)に達しました`); return; }
    const gain = Math.min(4, nutsDailyMax - todayHarvested);
    addItems([{itemId:'ffggr_nuts',amount:gain},{itemId:'ffggr_nuts_today',amount:gain}]);
    addNotif('success',`🌰 FFGGR産の木の実×${gain}を採取した！（本日${todayHarvested+gain}/${nutsDailyMax}個）`);
  }

  // ─── クレート開封 ───
  function handleCrateOpen(crateId:string, payExtra:boolean, extraCost:number){
    if(!(inventory[crateId]>0)){ addNotif('error','クレートを所持していません'); return; }
    if(payExtra && (player?.gold??0)<extraCost){ addNotif('error','Gが不足しています'); return; }
    consumeItem(crateId,1);
    if(payExtra) changeGold(-extraCost);
    const crateData: Record<string,{base:string[][];extra:string[][];point:number}> = {
      'ffggr_crate_leather': {
        base:[[FFGGR_ITEMS.GREEN_FRAG,'1'],[FFGGR_ITEMS.GREEN_FRAG,'2'],[FFGGR_ITEMS.GREEN_FRAG,'3']],
        extra:[[FFGGR_ITEMS.BLUE_FRAG,'1'],[FFGGR_ITEMS.RAJUICE,'1'],[FFGGR_ITEMS.TP_CONSUME,'1'],[FFGGR_ITEMS.RESCUE_CONSUME,'1']],
        point:1,
      },
      'ffggr_crate_gold': {
        base:[[FFGGR_ITEMS.BLUE_FRAG,'1'],[FFGGR_ITEMS.BLUE_FRAG,'2'],[FFGGR_ITEMS.BLUE_FRAG,'3']],
        extra:[[FFGGR_ITEMS.RED_FRAG,'1'],[FFGGR_ITEMS.RAJUICE,'1'],[FFGGR_ITEMS.TP_CONSUME,'1'],[FFGGR_ITEMS.RESCUE_CONSUME,'1']],
        point:2,
      },
      'ffggr_crate_diamond': {
        base:[[FFGGR_ITEMS.RED_FRAG,'1'],[FFGGR_ITEMS.RED_FRAG,'2'],[FFGGR_ITEMS.TOUSEKI,'1'],[FFGGR_ITEMS.MANADRAIN,'1'],[FFGGR_ITEMS.HEBIYUMI,'1']],
        extra:[[FFGGR_ITEMS.YELLOW_FRAG,'1'],[FFGGR_ITEMS.RAJUICE,'1'],[FFGGR_ITEMS.TP_CONSUME,'1'],[FFGGR_ITEMS.RESCUE_CONSUME,'1'],[FFGGR_ITEMS.RYOIKIKO,'1']],
        point:5,
      },
      'ffggr_crate_diamond_ex': {
        base:[[FFGGR_ITEMS.YELLOW_FRAG,'1'],[FFGGR_ITEMS.YELLOW_FRAG,'2'],[FFGGR_ITEMS.TOUSEKI,'1'],[FFGGR_ITEMS.MANADRAIN,'1'],[FFGGR_ITEMS.RYOIKIKO,'1']],
        extra:[[FFGGR_ITEMS.YELLOW_FRAG,'2'],[FFGGR_ITEMS.RAJUICE,'1'],[FFGGR_ITEMS.TP_CONSUME,'1'],[FFGGR_ITEMS.RESCUE_CONSUME,'1'],[FFGGR_ITEMS.KATANA_BLUE,'1']],
        point:10,
      },
    };
    const d = crateData[crateId];
    if(!d){ addNotif('error','未対応のクレートです'); return; }
    const pool = payExtra ? [...d.base,...d.extra] : d.base;
    const picked = pool[Math.floor(Math.random()*pool.length)];
    addItems([{itemId:picked[0], amount:parseInt(picked[1])}]);
    addItems([{itemId:FFGGR_ITEMS.GREEN_FRAG, amount:0}]); // dummy to trigger save
    // point gain
    if(Math.random()<0.8) addItems([{itemId:FFGGR_POINT_KEY, amount:d.point}]);
    const iname = FFGGR_ITEM_MASTER[picked[0]]?.name??picked[0];
    addNotif('success',`📦 ${iname}×${picked[1]}を入手！${payExtra?'（追加ドロップあり）':''}`);
  }

  const areaList = Object.values(FFGGR_AREAS);

  return (
    <div className="rpg-subtab-fade" style={{ paddingBottom:20 }}>
      {/* タブ */}
      <div style={{ display:'flex', gap:4, marginBottom:10, flexWrap:'wrap' }}>
        {([['area','🗺️ エリア'],['shop','🛒 NPC取引'],['items','📦 アイテム'],['fever','⭐ ポイント/フィーバー']] as const).map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{
            padding:'6px 10px', borderRadius:7, fontSize:'0.75rem', fontWeight:700,
            border:`1px solid ${tab===id?'#5b8dee':'#2d3752'}`,
            background:tab===id?'rgba(91,141,238,0.15)':'transparent',
            color:tab===id?'#5b8dee':'#8a92b2',
          }}>{label}</button>
        ))}
        {battle && <button onClick={()=>setTab('battle')} style={{
          padding:'6px 10px', borderRadius:7, fontSize:'0.75rem', fontWeight:700,
          border:`1px solid ${tab==='battle'?'#e05555':'#2d3752'}`,
          background:tab==='battle'?'rgba(224,85,85,0.15)':'transparent',
          color:tab==='battle'?'#e05555':'#8a92b2',
        }}>⚔️ バトル中</button>}
      </div>

      {/* エリア選択 */}
      {tab==='area' && (
        <div>
          <div style={{ fontSize:'0.72rem', color:'#8a92b2', marginBottom:8 }}>エリアを選択して探索・戦闘を開始</div>
          {areaList.map(area=>{
            const monsters = getMonstersInArea(area.id);
            const boss = area.bossId ? FFGGR_MONSTERS[area.bossId] : null;
            return (
              <div key={area.id} style={{ ...S.card, borderLeft:`4px solid ${area.color.replace('0.4','1')}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:'1.4rem' }}>{area.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:'0.88rem', color:'#e8e6ff' }}>{area.name}</div>
                    <div style={{ fontSize:'0.67rem', color:'#8a92b2' }}>{area.description}</div>
                  </div>
                  <div style={{ fontSize:'0.67rem', color:'#4a5070' }}>推奨防御:{area.recommendedDef}</div>
                </div>
                <div style={{ fontSize:'0.65rem', color:'#f0c060', marginBottom:6, lineHeight:1.6 }}>💡 {area.tips}</div>
                {area.id==='abyss' ? (
                  <div style={{ fontSize:'0.75rem', color:'#4a5070', textAlign:'center', padding:8 }}>🔒 未実装（将来開放）</div>
                ) : (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {monsters.filter(m=>!m.isBoss&&!m.isRareBoss).slice(0,4).map(m=>(
                      <button key={m.id} onClick={()=>startBattle(m)} style={{ ...S.smBtn, display:'flex', alignItems:'center', gap:4 }}>
                        {m.emoji} {m.name}
                      </button>
                    ))}
                    {boss && <button onClick={()=>startBattle(boss)} style={{ ...S.btn('#e05555'), fontSize:'0.75rem', padding:'5px 12px' }}>{boss.emoji} {boss.name}[BOSS]</button>}
                    {area.midBossIds?.map(mid=>FFGGR_MONSTERS[mid]).filter(Boolean).map(m=>(
                      <button key={m.id} onClick={()=>startBattle(m)} style={{ ...S.btn('#f0a020'), fontSize:'0.75rem', padding:'5px 12px' }}>{m.emoji} {m.name}</button>
                    ))}
                    {area.rareBossId && FFGGR_MONSTERS[area.rareBossId] && (
                      <button onClick={()=>startBattle(FFGGR_MONSTERS[area.rareBossId!])} style={{ ...S.btn('#b060e0'), fontSize:'0.75rem', padding:'5px 12px' }}>
                        {FFGGR_MONSTERS[area.rareBossId].emoji} {FFGGR_MONSTERS[area.rareBossId].name}[RARE]
                      </button>
                    )}
                    {area.id==='forest' && (
                      <button onClick={handleNutsHarvest} style={{ ...S.btn('#4ca86a'), fontSize:'0.75rem', padding:'5px 12px' }}>🌰 木の実採取</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* バトル画面 */}
      {tab==='battle' && battle && (
        <div>
          <BattleScreen battle={battle} onAction={handleAttack} onFlee={handleFlee} />
          {battle.phase!=='fighting' && (
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button style={{ ...S.btn('#2d3752'), flex:1, border:'1px solid #4a5070' }} onClick={()=>{ setBattle(null); setTab('area'); }}>← エリアに戻る</button>
              {battle.phase==='won' && (
                <button style={{ ...S.btn('#5b8dee'), flex:1 }} onClick={()=>{
                  const m = battle.monster;
                  startBattle(m);
                }}>🔄 再挑戦</button>
              )}
            </div>
          )}
        </div>
      )}
      {tab==='battle' && !battle && (
        <div style={{ textAlign:'center', color:'#4a5070', padding:32 }}>
          バトル中ではありません。<br/>エリアタブから敵を選んでください。
        </div>
      )}

      {tab==='shop' && <ShopPanel inventory={inventory} onTrade={(s1id,s1a,rid,ra,s2id,s2a,s3id,s3a)=>handleTrade(s1id,s1a,rid,ra,s2id,s2a,s3id,s3a)} />}
      {tab==='items' && <ItemsPanel inventory={inventory} />}
      {tab==='fever' && <FeverPanel ffggrPoint={ffggrPoint} onSpendPoint={handleSpendPoint} />}
      {tab==='crate' && <CratePanel inventory={inventory} gold={player?.gold??0} onOpen={handleCrateOpen} />}
    </div>
  );
}
