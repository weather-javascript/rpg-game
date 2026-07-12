// src/components/TutorialCard.tsx
// 各タブ共通の「お試しチュートリアル」バナー。ソシャゲ的に「お試しの○○をあげるから実際にやってみよう」という
// オンボーディングを、任意の画面に1行で差し込めるようにした共通コンポーネント。
import { useGameStore } from '../stores/gameStore';

export interface TutorialStep {
  text: string;
}

export function TutorialCard({ tutorialId, title, steps, starterItems, starterLabel, claimLabel }: {
  tutorialId: string;
  title: string;
  steps: TutorialStep[];
  starterItems: { itemId: string; amount: number }[];
  starterLabel: string;
  claimLabel?: string;
}) {
  const player = useGameStore(s => s.player);
  const claimTutorial = useGameStore(s => s.claimTutorial);
  const addNotification = useGameStore(s => s.addNotification);

  const claimed = (player?.claimedTutorials ?? []).includes(tutorialId);
  if (claimed) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(240,192,96,0.14), rgba(91,141,238,0.1))',
      border: '1px solid rgba(240,192,96,0.4)', borderRadius: 10, padding: '10px 12px', marginBottom: 12,
    }}>
      <div style={{ fontWeight: 800, color: '#f0c060', fontSize: '0.8rem', marginBottom: 6 }}>🔰 {title}</div>
      <ol style={{ margin: '0 0 8px 18px', padding: 0, fontSize: '0.7rem', color: '#c8d0e8', lineHeight: 1.8 }}>
        {steps.map((s, i) => <li key={i}>{s.text}</li>)}
      </ol>
      <button
        onClick={() => {
          const r = claimTutorial(tutorialId, starterItems);
          addNotification(r.success ? 'success' : 'warning', r.message);
        }}
        style={{
          padding: '7px 14px', borderRadius: 8, border: '1px solid #f0c060',
          background: 'rgba(240,192,96,0.2)', color: '#f0c060', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700,
        }}>
        🎁 {claimLabel ?? `お試し${starterLabel}をもらう`}
      </button>
    </div>
  );
}
