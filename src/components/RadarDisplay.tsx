// src/components/RadarDisplay.tsx
// 戦闘画面下部に常設する「敵位置レーダー」。戦闘機のレーダーのように敵の方向・距離を表示する。
// ダンジョンの種類によって背景テーマ（火山なら溶岩色、要塞なら石色など）が変わる。
import { ALL_DIRS, DIR_LABEL, type EnemyDirection } from '../systems/enemyPosition';
import type { CompassEnemyDot } from './BattleSkillUI';

interface RadarTheme {
  bg: string;
  ring: string;
  sweep: string;
  label: string;
}

const RADAR_THEMES: Record<string, RadarTheme> = {
  volcano: { bg: 'radial-gradient(circle, #2a0f05 0%, #140502 80%)', ring: 'rgba(255,110,40,0.35)', sweep: 'rgba(255,140,40,0.5)', label: '🌋 火山レーダー' },
  fortress: { bg: 'radial-gradient(circle, #24262b 0%, #101114 80%)', ring: 'rgba(160,170,190,0.35)', sweep: 'rgba(190,200,220,0.5)', label: '🏰 要塞レーダー' },
  beginner_cave: { bg: 'radial-gradient(circle, #0c1f22 0%, #060f11 80%)', ring: 'rgba(60,200,190,0.3)', sweep: 'rgba(80,220,210,0.5)', label: '⛏️ 洞窟レーダー' },
  lycoris_dungeon: { bg: 'radial-gradient(circle, #1c0d24 0%, #0c0510 80%)', ring: 'rgba(190,90,230,0.3)', sweep: 'rgba(210,120,250,0.5)', label: '🌸 幽玄レーダー' },
  sky_castle: { bg: 'radial-gradient(circle, #0b1230 0%, #05071a 80%)', ring: 'rgba(120,150,255,0.35)', sweep: 'rgba(150,180,255,0.55)', label: '🏯 天空城レーダー' },
  sky_castle_ex: { bg: 'radial-gradient(circle, #12082e 0%, #05041a 80%)', ring: 'rgba(170,120,255,0.35)', sweep: 'rgba(200,150,255,0.55)', label: '🏯 天空城EXレーダー' },
  astral_nox: { bg: 'radial-gradient(circle, #05061c 0%, #020209 80%)', ring: 'rgba(120,200,255,0.35)', sweep: 'rgba(160,220,255,0.55)', label: '🌌 アストラル・ノクスレーダー' },
  chaite: { bg: 'radial-gradient(circle, #2a0508 0%, #120103 80%)', ring: 'rgba(255,70,70,0.35)', sweep: 'rgba(255,100,100,0.55)', label: '⚔️ 帝国レーダー' },
  ffgg: { bg: 'radial-gradient(circle, #0a1f12 0%, #04100a 80%)', ring: 'rgba(90,200,120,0.3)', sweep: 'rgba(120,230,150,0.5)', label: '🌲 フィールドレーダー' },
  default: { bg: 'radial-gradient(circle, #0a0d1a 0%, #05060c 80%)', ring: 'rgba(91,141,238,0.3)', sweep: 'rgba(120,160,255,0.5)', label: '📡 レーダー' },
};

function getTheme(dungeonId?: string): RadarTheme {
  if (!dungeonId) return RADAR_THEMES.default;
  if (dungeonId.startsWith('ffgg') || dungeonId.startsWith('ff')) return RADAR_THEMES.ffgg;
  return RADAR_THEMES[dungeonId] ?? RADAR_THEMES.default;
}

export function RadarDisplay({ dungeonId, enemies, facingDirection }: {
  dungeonId?: string;
  enemies: CompassEnemyDot[];
  facingDirection?: EnemyDirection;
}) {
  const theme = getTheme(dungeonId);
  const SIZE = 180;
  const CENTER = SIZE / 2;
  const MAX_R = SIZE / 2 - 10;
  const KIND_COLOR: Record<string, string> = { mob: '#39ff6a', midboss: '#ffe642', boss: '#ff3b3b', rareboss: '#c85bff' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, margin: '10px 0' }}>
      <div style={{ fontSize: '0.62rem', color: '#4a5070' }}>{theme.label}</div>
      <div style={{
        position: 'relative', width: SIZE, height: SIZE, borderRadius: '50%',
        background: theme.bg, border: `1px solid ${theme.ring}`, overflow: 'hidden',
        boxShadow: `inset 0 0 20px ${theme.ring}`,
      }}>
        {/* 同心円グリッド */}
        {[0.33, 0.66, 1].map(f => (
          <div key={f} style={{
            position: 'absolute', left: CENTER - MAX_R * f, top: CENTER - MAX_R * f,
            width: MAX_R * f * 2, height: MAX_R * f * 2, borderRadius: '50%', border: `1px solid ${theme.ring}`,
          }} />
        ))}
        {/* 十字線 */}
        <div style={{ position: 'absolute', left: 0, top: CENTER, width: SIZE, height: 1, background: theme.ring }} />
        <div style={{ position: 'absolute', left: CENTER, top: 0, width: 1, height: SIZE, background: theme.ring }} />
        {/* スイープ（回転する扇形の光） */}
        <div style={{
          position: 'absolute', left: CENTER, top: CENTER, width: MAX_R, height: 2, transformOrigin: '0 50%',
          background: `linear-gradient(90deg, ${theme.sweep}, transparent)`,
          animation: 'radar-sweep 3.5s linear infinite',
        }} />
        {/* 中心（自分） */}
        <div style={{
          position: 'absolute', left: CENTER - 3, top: CENTER - 3, width: 6, height: 6, borderRadius: '50%',
          background: '#fff', boxShadow: '0 0 6px 2px #fff',
        }} />
        {/* 自機の向き（向いている方向を示す矢印） */}
        {facingDirection && (() => {
          const fi = ALL_DIRS.indexOf(facingDirection);
          const rad = ((fi * 45 - 90) * Math.PI) / 180;
          const x = CENTER + 14 * Math.cos(rad);
          const y = CENTER + 14 * Math.sin(rad);
          return <div style={{ position: 'absolute', left: x - 3, top: y - 3, width: 6, height: 6, borderRadius: '50%', background: '#4ca86a', boxShadow: '0 0 6px 2px #4ca86a' }} />;
        })()}
        {/* 敵ブリップ */}
        {enemies.map(en => {
          const i = ALL_DIRS.indexOf(en.direction);
          const rad = ((i * 45 - 90) * Math.PI) / 180;
          const distRatio = Math.min(1, en.distanceM / 25);
          const r = 8 + distRatio * (MAX_R - 8);
          const x = CENTER + r * Math.cos(rad);
          const y = CENTER + r * Math.sin(rad);
          const color = KIND_COLOR[en.kind] ?? '#39ff6a';
          return (
            <div key={en.idx} title={`${en.name} (${DIR_LABEL[en.direction]} ${Math.round(en.distanceM)}m)`} style={{
              position: 'absolute', left: x - 4, top: y - 4, width: 8, height: 8, borderRadius: '50%',
              background: color, boxShadow: `0 0 6px 2px ${color}`, animation: 'radar-blip 1.6s ease-in-out infinite',
            }} />
          );
        })}
      </div>
      <style>{`
        @keyframes radar-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes radar-blip { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
