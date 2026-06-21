// src/components/screens/InfiniteCorridorScreen.tsx
// 無限深層回廊 専用画面（ステージ1: 初級1〜10階の最小プレイループ）
// 続行/帰還の選択UI、現在の獲得素材リスト、次階層の脅威度表示を実装。

import { GameIcon } from '../icons';
import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER } from '../../data/masters';
import { getICThreatStars, getICMultiplier } from '../../data/infiniteCorridorMaster';

export function InfiniteCorridorScreen({ onExit }: { onExit: () => void }) {
  const player = useGameStore(s => s.player);
  const icRunActive = useGameStore(s => s.icRunActive);
  const icCurrentFloor = useGameStore(s => s.icCurrentFloor);
  const icPendingMaterials = useGameStore(s => s.icPendingMaterials);
  const icRunLog = useGameStore(s => s.icRunLog);
  const icRunFailed = useGameStore(s => s.icRunFailed);
  const icFloorResolved = useGameStore(s => s.icFloorResolved);
  const icStartRun = useGameStore(s => s.icStartRun);
  const icStartFloorBattle = useGameStore(s => s.icStartFloorBattle);
  const icBattleActive = useGameStore(s => s.icBattleActive);
  const icContinueDeeper = useGameStore(s => s.icContinueDeeper);
  const icReturnSafely = useGameStore(s => s.icReturnSafely);
  const icAbandonRun = useGameStore(s => s.icAbandonRun);
  const icGetNextFloorWarning = useGameStore(s => s.icGetNextFloorWarning);

  if (!player) return null;

  const nextFloor = icCurrentFloor + 1;
  const threatStars = getICThreatStars(nextFloor);
  const multiplier = getICMultiplier(icCurrentFloor);
  const warning = icRunActive ? icGetNextFloorWarning() : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', margin: 0 }}>🌀 無限深層回廊</h2>
        <button onClick={() => { if (icRunActive) icAbandonRun(); onExit(); }} style={{ padding: '6px 12px', background: '#2d3752', color: '#8a92b2', border: '1px solid #2d3752', borderRadius: 6, cursor: 'pointer' }}>
          ← ダンジョン一覧へ
        </button>
      </div>

      {!icRunActive ? (
        <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 10, padding: 16, textAlign: 'center' }}>
          {icRunFailed && (
            <div style={{ color: '#e05555', marginBottom: 10, fontWeight: 700 }}>
              敗北した……未確定の素材は持ち帰れなかった。
            </div>
          )}
          <p style={{ color: '#8a92b2', fontSize: '0.85rem', marginBottom: 12 }}>
            1階ずつ潜りながら敵を倒し、続行（旨味は増えるが危険も増える）か帰還（今の素材を確定）かを毎階層選ぶ周回特化ダンジョン。
          </p>
          <button onClick={icStartRun}
            style={{ padding: '12px 24px', fontWeight: 700, background: 'linear-gradient(135deg,#e05555,#c03030)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            ⚔️ 回廊に入る
          </button>
        </div>
      ) : (
        <>
          <div style={{ background: '#161b26', border: '1px solid #2d3752', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#f0c060', fontWeight: 700 }}>B{icCurrentFloor}F</span>
              <span style={{ color: '#8a92b2', fontSize: '0.85rem' }}>素材倍率 ×{multiplier}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(icPendingMaterials).length === 0 && (
                <span style={{ color: '#8a92b2', fontSize: '0.78rem' }}>まだ素材を獲得していない</span>
              )}
              {Object.entries(icPendingMaterials).map(([itemId, amount]) => (
                <span key={itemId} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1c2235', borderRadius: 6, padding: '3px 8px', fontSize: '0.78rem' }}>
                  <GameIcon id={ITEM_MASTER[itemId]?.icon ?? 'sparkle'} size={16} />
                  {ITEM_MASTER[itemId]?.name ?? itemId} ×{amount}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background: '#0e1320', border: '1px solid #2d3752', borderRadius: 10, padding: 10, maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: 4 }}>
            {[...icRunLog].reverse().map((entry, i) => (
              <div key={i} style={{
                fontSize: '0.78rem',
                color: entry.kind === 'danger' ? '#e05555' : entry.kind === 'success' ? '#4caf87' : entry.kind === 'event' ? '#f0a040' : '#c4cae0',
              }}>
                {entry.message}
              </div>
            ))}
          </div>

          {icRunActive && (
            <>
              {!icFloorResolved ? (
                <button onClick={icStartFloorBattle}
                  disabled={player.stats.hp <= 0 || icBattleActive}
                  style={{ width: '100%', padding: '12px', fontWeight: 700, background: 'linear-gradient(135deg,#e05555,#c03030)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  ⚔️ B{icCurrentFloor}Fの敵と戦う
                </button>
              ) : (
                <>
                  {warning && (
                    <div style={{ background: '#2a1f10', border: '1px solid #f0a040', borderRadius: 8, padding: 10, color: '#f0c060', fontSize: '0.8rem', fontWeight: 700 }}>
                      ⚠️ {warning}
                    </div>
                  )}
                  <div style={{ color: '#8a92b2', fontSize: '0.78rem' }}>
                    次の階層（B{nextFloor}F）の脅威レベル：{'★'.repeat(threatStars)}{'☆'.repeat(5 - threatStars)}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={icContinueDeeper}
                      style={{ flex: 1, padding: '12px', fontWeight: 700, background: 'linear-gradient(135deg,#4caf87,#2d8f6f)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                      ⬇️ 続行する（B{nextFloor}Fへ）
                    </button>
                    <button onClick={icReturnSafely}
                      style={{ flex: 1, padding: '12px', fontWeight: 700, background: '#2d3752', color: '#f0c060', border: '1px solid #f0c060', borderRadius: 8, cursor: 'pointer' }}>
                      🏃 帰還する（素材確定）
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
