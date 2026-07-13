// src/components/GuideBanner.tsx
// ver3.3.0: 「やりたいこと」ガイドの進行状況をテロップ的に常時表示するフローティングバナー。
import { useGameStore } from '../stores/gameStore';
import { GUIDE_MASTER } from '../data/guides';

export function GuideBanner() {
  const activeGuide = useGameStore(s => s.activeGuide);
  const advanceGuide = useGameStore(s => s.advanceGuide);
  const clearGuide = useGameStore(s => s.clearGuide);
  const setActiveTab = useGameStore(s => s.setActiveTab);

  if (!activeGuide) return null;
  const guide = GUIDE_MASTER[activeGuide.id];
  if (!guide) return null;
  const step = guide.steps[activeGuide.stepIndex];
  const isLast = activeGuide.stepIndex >= guide.steps.length - 1;

  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 74, transform: 'translateX(-50%)', zIndex: 900,
      width: 'min(420px, 92vw)', background: 'linear-gradient(135deg, #1a2035, #0f1320)',
      border: '1px solid #f0c060', borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f0c060' }}>{guide.emoji} {guide.title}</span>
        <span style={{ fontSize: '0.62rem', color: '#4a5070' }}>{activeGuide.stepIndex + 1} / {guide.steps.length}</span>
      </div>
      <div style={{ fontSize: '0.76rem', color: '#e8e6ff', lineHeight: 1.5, marginBottom: 8 }}>{step}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setActiveTab(guide.targetTab)} style={{
          flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem',
          background: 'linear-gradient(135deg,#5b8dee,#3a6fd0)', color: '#fff',
        }}>🗺️ 移動する</button>
        {!isLast ? (
          <button onClick={advanceGuide} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #f0c060', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', background: 'rgba(240,192,96,0.15)', color: '#f0c060' }}>
            次へ ▶
          </button>
        ) : (
          <button onClick={clearGuide} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #4ca86a', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', background: 'rgba(76,168,106,0.15)', color: '#4ca86a' }}>
            🎉 完了！閉じる
          </button>
        )}
        <button onClick={clearGuide} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #2d3752', cursor: 'pointer', fontSize: '0.7rem', background: 'none', color: '#8a92b2' }}>
          やめる
        </button>
      </div>
    </div>
  );
}
