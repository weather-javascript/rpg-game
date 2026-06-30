// src/components/screens/VocationScreen.tsx
// ver3.0.0: ランク／職業分岐（ヴォケーション）画面。

import { useGameStore } from '../../stores/gameStore';
import { VOCATION_MASTER, VOCATION_ORDER } from '../../data/vocationData';
import { defaultVocationState, VOCATION_EXP_TABLE, type VocationId, type VocationRankDef } from '../../types/buildTypes';

const card = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(240,192,96,0.1)' : '#1c2235',
  border: `1px solid ${active ? '#f0c060' : '#2d3752'}`,
  borderRadius: 10, padding: 12, marginBottom: 10,
});

function fmt(n: number): string { return Math.round(n).toLocaleString(); }

export function VocationScreen() {
  const player = useGameStore(s => s.player);
  const selectVocation = useGameStore(s => s.selectVocation);
  const switchVocation = useGameStore(s => s.switchVocation);
  const getVocationLevel = useGameStore(s => s.getVocationLevel);
  const addNotification = useGameStore(s => s.addNotification);

  if (!player) return null;
  const voc = player.vocation ?? defaultVocationState();
  const activeId = voc.activeVocationId;

  const handlePick = (id: VocationId) => {
    const res = activeId ? switchVocation(id) : selectVocation(id);
    if (!res.success) addNotification('warning', res.message);
  };

  return (
    <div style={{ padding: '12px 8px 80px' }}>
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', marginBottom: 4, fontSize: '1rem' }}>🎖️ 職業（ヴォケーション）</h2>
      <p style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 12 }}>
        職業はプレイスタイルを強化する常時パッシブです。経験値を得るたびに熟練度が上がり、ランクアップでさらに強化されます。
      </p>

      {VOCATION_ORDER.map(id => {
        const def = VOCATION_MASTER[id];
        const unlocked = voc.unlockedVocationIds.includes(id);
        const lockedByLevel = !unlocked && def.unlockCondition?.playerLevel && player.stats.level < def.unlockCondition.playerLevel;
        const isActive = activeId === id;
        const level = unlocked ? getVocationLevel(id) : 1;
        const exp = voc.vocationExp[id] ?? 0;
        const nextLevelExp = VOCATION_EXP_TABLE[level + 1] ?? exp;
        const curLevelExp = VOCATION_EXP_TABLE[level] ?? 0;
        const progress = nextLevelExp > curLevelExp ? Math.min(1, (exp - curLevelExp) / (nextLevelExp - curLevelExp)) : 1;
        const rank = voc.vocationRank[id] ?? 1;
        const rankDef = def.ranks.find((r: VocationRankDef) => r.rank === rank) ?? def.ranks[0];

        return (
          <div key={id} style={card(isActive)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: '1.6rem' }}>{def.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: isActive ? '#f0c060' : '#e8e6ff', fontSize: '0.92rem' }}>
                  {def.name} {isActive && <span style={{ fontSize: '0.65rem', color: '#f0c060' }}>（現在の職業）</span>}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#8a92b2' }}>{def.description}</div>
              </div>
              {lockedByLevel ? (
                <span style={{ fontSize: '0.7rem', color: '#e05555' }}>🔒 Lv{def.unlockCondition?.playerLevel}で解放</span>
              ) : (
                <button onClick={() => handlePick(id)} disabled={isActive}
                  style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${isActive ? '#2d3752' : '#f0c060'}`, background: isActive ? '#161b26' : 'rgba(240,192,96,0.15)', color: isActive ? '#4a5070' : '#f0c060', cursor: isActive ? 'default' : 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  {isActive ? '選択中' : '選ぶ'}
                </button>
              )}
            </div>

            {!lockedByLevel && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#8a92b2', marginBottom: 3 }}>
                  <span>職業Lv.{level}（ランク{rank}: {rankDef.name}）</span>
                  <span>{fmt(exp)} / {fmt(nextLevelExp)}</span>
                </div>
                <div style={{ height: 6, background: '#161b26', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress * 100}%`, background: 'linear-gradient(90deg,#f0c060,#e09030)' }} />
                </div>
                <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#7ec98a' }}>
                  専用スキル「{def.signatureSkillName}」: {def.signatureSkillDescription}
                </div>
                <div style={{ marginTop: 4, fontSize: '0.65rem', color: '#8a92b2' }}>
                  現在ランクパッシブ: {Object.entries(rankDef.passiveEffects).map(([k, v]) => `${k} ${v}`).join(' / ')}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 12, fontSize: '0.65rem', color: '#4a5070' }}>
        ※ 転職証を持っていない場合、職業の切り替えには10分のクールタイムがあります。
      </div>
    </div>
  );
}
