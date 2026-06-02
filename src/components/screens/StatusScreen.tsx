// src/components/screens/StatusScreen.tsx
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER, SKILL_MASTER, EXP_TABLE, SKILL_EXP_TABLE } from '../../data/masters';

export function StatusScreen() {
  const player = useGameStore(s => s.player);
  const saveGame = useGameStore(s => s.saveGame);
  const isSaving = useGameStore(s => s.isSaving);
  const useItem = useGameStore(s => s.useItem);
  if (!player) return null;

  const inventoryEntries = Object.entries(player.inventory).filter(([, qty]) => qty > 0);

  const RARITY_COLORS: Record<string, string> = {
    common:'#2d3752', uncommon:'#2d6644', rare:'#2d4488', epic:'#6030a0', legendary:'#a06020',
  };

  return (
    <div style={{padding:'12px 8px 80px'}}>
      <h2 style={{fontFamily:'Cinzel,serif', color:'#f0c060', marginBottom:12, borderBottom:'1px solid #2d3752', paddingBottom:8}}>📊 ステータス</h2>

      {/* 基本情報 */}
      <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
        <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>🧙 基本情報</h3>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
          {[
            ['名前', player.displayName],
            ['レベル', `Lv.${player.stats.level}`],
            ['経験値', `${player.stats.exp} / ${EXP_TABLE[player.stats.level + 1] ?? 'MAX'}`],
            ['所持金', `💰 ${player.gold.toLocaleString()}G`],
            ['HP', `❤️ ${player.stats.hp} / ${player.stats.maxHp}`],
            ['満腹度', `🍖 ${player.stats.satiety} / ${player.stats.maxSatiety}`],
            ['攻撃力', `⚔️ ${player.stats.attack}`],
            ['防御力', `🛡️ ${player.stats.defense}`],
          ].map(([label, val]) => (
            <div key={label as string} style={{display:'flex', justifyContent:'space-between', fontSize:'0.82rem', padding:'3px 0', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{color:'#8a92b2'}}>{label}</span>
              <span>{val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* スキル */}
      <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:12}}>
        <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>⚡ スキル</h3>
        {Object.values(SKILL_MASTER).map(skill => {
          const lv = player.skillLevels[skill.id] ?? 1;
          const exp = player.skillExp[skill.id] ?? 0;
          const next = SKILL_EXP_TABLE[lv + 1] ?? Infinity;
          const pct = next === Infinity ? 100 : Math.min(100, (exp / next) * 100);
          return (
            <div key={skill.id} style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
              <span style={{fontSize:'1.2rem'}}>{skill.icon}</span>
              <div style={{flex:1}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.82rem', marginBottom:4}}>
                  <span>{skill.name}</span>
                  <span style={{color:'#5b8dee', fontWeight:700}}>Lv.{lv}</span>
                </div>
                <div style={{height:5, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden'}}>
                  <div style={{height:'100%', background:'linear-gradient(90deg,#5b8dee,#9b6df0)', width:`${pct}%`, transition:'width 0.5s'}} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* インベントリ */}
      <section style={{background:'#1c2235', border:'1px solid #2d3752', borderRadius:10, padding:14, marginBottom:14}}>
        <h3 style={{fontSize:'0.9rem', color:'#f0c060', marginBottom:10}}>🎒 インベントリ ({inventoryEntries.length}種類)</h3>
        {inventoryEntries.length === 0
          ? <p style={{color:'#4a5070', fontSize:'0.82rem', textAlign:'center'}}>アイテムを所持していません</p>
          : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8}}>
              {inventoryEntries.map(([id, qty]) => {
                const item = ITEM_MASTER[id];
                if (!item) return null;
                return (
                  <div
                    key={id}
                    title={item.description}
                    style={{
                      background: RARITY_COLORS[item.rarity] ?? '#2d3752',
                      border:`1px solid ${RARITY_COLORS[item.rarity] ?? '#2d3752'}`,
                      borderRadius:6, padding:8, textAlign:'center', cursor: item.useEffect ? 'pointer' : 'default',
                    }}
                    onClick={() => item.useEffect && useItem(id)}
                  >
                    <div style={{fontSize:'1.5rem'}}>{item.icon}</div>
                    <div style={{fontSize:'0.72rem', color:'#8a92b2', marginTop:2}}>{item.name}</div>
                    <div style={{color:'#f0c060', fontWeight:700, fontSize:'0.82rem'}}>×{qty}</div>
                    {item.useEffect && <div style={{fontSize:'0.6rem', color:'#9b6df0', marginTop:2}}>タップで使用</div>}
                  </div>
                );
              })}
            </div>
          )
        }
      </section>

      {/* セーブ */}
      <div style={{textAlign:'center'}}>
        <button
          onClick={saveGame} disabled={isSaving}
          style={{padding:'12px 0', width:'100%', maxWidth:280, background:'linear-gradient(135deg,#4caf87,#2d8060)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:'1rem', cursor:'pointer'}}
        >
          {isSaving ? '💾 保存中...' : '💾 データをセーブする'}
        </button>
        <p style={{fontSize:'0.72rem', color:'#4a5070', marginTop:8}}>
          最終セーブ: {player.lastSavedAt ? new Date(player.lastSavedAt).toLocaleString('ja-JP') : '未セーブ'}
        </p>
      </div>
    </div>
  );
}
