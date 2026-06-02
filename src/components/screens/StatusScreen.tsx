// src/components/screens/StatusScreen.tsx
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER, SKILL_MASTER, EXP_TABLE, SKILL_EXP_TABLE } from '../../data/masters';

export function StatusScreen() {
  const player = useGameStore(s => s.player);
  const saveGame = useGameStore(s => s.saveGame);
  const isSaving = useGameStore(s => s.isSaving);
  const useItem = useGameStore(s => s.useItem);
  const canUseRelief = useGameStore(s => s.canUseRelief);
  const useRelief = useGameStore(s => s.useRelief);
  if (!player) return null;

  const reliefCheck = canUseRelief();
  const isStruggling = player.stats.hp <= 30 && player.stats.satiety <= 10 && player.gold < 500;

  const inventoryEntries = Object.entries(player.inventory).filter(([, qty]) => qty > 0);

  const RARITY_COLORS: Record<string, string> = {
    common:'#2d3752', uncommon:'#2d6644', rare:'#2d4488', epic:'#6030a0', legendary:'#a06020',
  };

  const hpPct = (player.stats.hp / player.stats.maxHp) * 100;
  const satPct = (player.stats.satiety / player.stats.maxSatiety) * 100;
  const expPct = player.stats.level < 200 ? Math.min(100, (player.stats.exp / player.stats.expToNextLevel) * 100) : 100;

  const bar = (pct: number, color: string) => (
    <div style={{height:8, background:'#2d3752', borderRadius:4, overflow:'hidden', marginTop:3}}>
      <div style={{height:'100%', background:color, width:`${pct}%`, transition:'width 0.3s'}} />
    </div>
  );

  return (
    <div style={{padding:'12px 8px 80px'}}>
      <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>📊 ステータス</h2>

      {/* 救済措置アラート */}
      {isStruggling && (
        <div style={{background:'rgba(224,85,85,0.15)', border:'2px solid #e05555', borderRadius:10, padding:'10px 14px', marginBottom:12, textAlign:'center'}}>
          <div style={{color:'#e05555', fontWeight:700, marginBottom:4}}>⚠️ ピンチ状態を検出！</div>
          <div style={{fontSize:'0.8rem', color:'#8a92b2', marginBottom:8}}>HP・満腹度・所持金が全て低下しています。救済措置が利用可能です。</div>
          {reliefCheck.canUse ? (
            <button onClick={useRelief}
              style={{padding:'8px 20px', background:'linear-gradient(135deg,#e05555,#c03030)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700}}>
              🆘 緊急救済措置を使う
            </button>
          ) : (
            <div style={{fontSize:'0.78rem', color:'#4a5070'}}>{reliefCheck.reason}</div>
          )}
        </div>
      )}

      {/* 基本情報 */}
      <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
        <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>🧙 基本情報</h3>
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
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#8a92b2'}}>
            <span>❤️ HP {player.stats.hp}/{player.stats.maxHp}</span>
          </div>
          {bar(hpPct, '#e05555')}
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#8a92b2', marginTop:6}}>
            <span>🍖 満腹度 {player.stats.satiety}/{player.stats.maxSatiety}</span>
          </div>
          {bar(satPct, satPct < 20 ? '#e05555' : '#f0a830')}
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#8a92b2', marginTop:6}}>
            <span>✨ EXP {player.stats.exp}/{player.stats.expToNextLevel}</span>
          </div>
          {bar(expPct, '#5b8dee')}
        </div>
      </section>

      {/* スキル */}
      <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
        <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>⚡ スキル</h3>
        {Object.values(SKILL_MASTER).map(skill => {
          const lv = player.skillLevels[skill.id] ?? 1;
          const exp = player.skillExp[skill.id] ?? 0;
          const nextExp = SKILL_EXP_TABLE[lv + 1] ?? Infinity;
          const pct = nextExp !== Infinity ? Math.min(100, (exp / nextExp) * 100) : 100;
          return (
            <div key={skill.id} style={{marginBottom:8}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem'}}>
                <span>{skill.icon} {skill.name}</span>
                <span style={{color:'#5b8dee', fontWeight:700}}>Lv.{lv}</span>
              </div>
              <div style={{height:4, background:'#2d3752', borderRadius:2, overflow:'hidden', marginTop:3}}>
                <div style={{height:'100%', background:'#5b8dee', width:`${pct}%`, transition:'width 0.3s'}} />
              </div>
            </div>
          );
        })}
      </section>

      {/* 装備・バフ情報 */}
      <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
        <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:8}}>🎣 装備・状態</h3>
        <div style={{fontSize:'0.82rem', color:'#8a92b2', display:'flex', flexDirection:'column', gap:5}}>
          <span>釣り竿: <span style={{color:'#e8e6ff'}}>{ITEM_MASTER[player.equippedRodId ?? 'basic_rod']?.name ?? '基本の釣り竿'}</span></span>
          <span>ジョブ: <span style={{color:'#e8e6ff'}}>{player.activeJob ?? 'なし'}</span></span>
          <span>釣りスコア: <span style={{color:'#5b8dee'}}>{player.fishingScore ?? 0}</span>（1000ごとに上位鱗確定）</span>
          <span>ダンジョンクリア: {Object.entries(player.dungeonClearedCount ?? {}).map(([id, n]) => `${id}:${n}回`).join('、') || 'なし'}</span>
        </div>
        {(player.activeBuffs ?? []).filter(b => b.expiry > Date.now()).length > 0 && (
          <div style={{marginTop:8}}>
            <div style={{fontSize:'0.8rem', fontWeight:700, color:'#f0a830', marginBottom:4}}>✨ アクティブバフ</div>
            {(player.activeBuffs ?? []).filter(b => b.expiry > Date.now()).map((b, i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'#8a92b2'}}>
                <span>{b.name}</span>
                <span style={{color:'#4caf87'}}>残り{Math.ceil((b.expiry - Date.now()) / 60000)}分</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 救済措置 */}
      <section style={{background: isStruggling ? 'rgba(224,85,85,0.08)' : '#1c2235', border:`1px solid ${isStruggling ? '#e05555' : '#2d3752'}`, borderRadius:10, padding:14, marginBottom:12}}>
        <h3 style={{fontSize:'0.9rem', color:'#8a92b2', marginBottom:8}}>🆘 緊急救済措置</h3>
        <div style={{fontSize:'0.78rem', color:'#4a5070', marginBottom:8}}>
          以下の条件を全て満たすと使用可能（1日3回・30分クールダウン）
        </div>
        <div style={{fontSize:'0.8rem', display:'flex', flexDirection:'column', gap:3, marginBottom:8}}>
          <span>HP 30以下: <span style={{color: player.stats.hp <= 30 ? '#4caf87' : '#4a5070'}}>{player.stats.hp <= 30 ? '✅ 達成' : `❌ 現在${player.stats.hp}`}</span></span>
          <span>満腹度 10以下: <span style={{color: player.stats.satiety <= 10 ? '#4caf87' : '#4a5070'}}>{player.stats.satiety <= 10 ? '✅ 達成' : `❌ 現在${player.stats.satiety}`}</span></span>
          <span>所持金 500G未満: <span style={{color: player.gold < 500 ? '#4caf87' : '#4a5070'}}>{player.gold < 500 ? '✅ 達成' : `❌ 現在${player.gold}G`}</span></span>
        </div>
        {reliefCheck.canUse ? (
          <button onClick={useRelief}
            style={{width:'100%', padding:'10px', background:'linear-gradient(135deg,#e05555,#c03030)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700}}>
            🆘 使用する（HP+30・満腹+30・緊急食料×2・回復薬×1）
          </button>
        ) : (
          <div style={{padding:'6px 10px', background:'#161b26', borderRadius:6, fontSize:'0.78rem', color:'#4a5070'}}>
            {reliefCheck.reason}
          </div>
        )}
        {(player.reliefUsedCount ?? 0) > 0 && (
          <div style={{marginTop:4, fontSize:'0.72rem', color:'#4a5070'}}>本日使用: {player.reliefUsedCount ?? 0}/3回</div>
        )}
      </section>

      {/* インベントリ */}
      <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
        <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>🎒 インベントリ ({inventoryEntries.length}種)</h3>
        {inventoryEntries.length === 0 ? (
          <p style={{color:'#4a5070', fontSize:'0.85rem', textAlign:'center'}}>アイテムがありません</p>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
            {inventoryEntries.map(([id, qty]) => {
              const item = ITEM_MASTER[id];
              if (!item) return null;
              return (
                <div key={id} style={{background:RARITY_COLORS[item.rarity] ?? '#2d3752', borderRadius:6, padding:'6px 8px', display:'flex', alignItems:'center', gap:6}}>
                  <span style={{fontSize:'1.2rem'}}>{item.icon}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:'0.75rem', color:'#e8e6ff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.name}</div>
                    <div style={{fontSize:'0.7rem', color:'#8a92b2'}}>×{qty.toLocaleString()}</div>
                  </div>
                  {item.useEffect && (
                    <button onClick={() => useItem(id)}
                      style={{padding:'2px 6px', background:'rgba(76,175,135,0.3)', color:'#4caf87', border:'1px solid #4caf87', borderRadius:3, cursor:'pointer', fontSize:'0.65rem'}}>
                      使用
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* セーブ */}
      <div style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
        <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>💾 セーブ</h3>
        <button
          onClick={saveGame} disabled={isSaving}
          style={{width:'100%', padding:'10px', background: isSaving ? '#2d3752' : 'linear-gradient(135deg,#4caf87,#2d8f6f)', color:'#fff', border:'none', borderRadius:8, cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight:700}}>
          {isSaving ? '💾 保存中...' : '💾 データをセーブする'}
        </button>
        <p style={{fontSize:'0.72rem', color:'#4a5070', marginTop:8}}>
          最終セーブ: {player.lastSavedAt ? new Date(player.lastSavedAt).toLocaleString('ja-JP') : '未セーブ'}
        </p>
      </div>
    </div>
  );
}
