// src/components/BattleSkillUI.tsx
// 位置システム連動の「間合い操作」コンパスUIと、装備武器のアクティブスキルボタン列。
// DungeonScreen(通常ダンジョン)とFFGGRScreen(FFGGR)の両方から共有される。
import { DIR_LABEL, type EnemyDirection, ALL_DIRS } from '../systems/enemyPosition';
import type { ItemMaster, WeaponSkill } from '../types/game';

export type CompassEnemyKind = 'mob' | 'midboss' | 'boss' | 'rareboss';

export interface CompassEnemyDot {
  idx: number;
  name: string;
  direction: EnemyDirection;
  distanceM: number;
  kind: CompassEnemyKind;
}

const KIND_COLOR: Record<CompassEnemyKind, string> = {
  mob: '#39ff6a',
  midboss: '#ffe642',
  boss: '#ff3b3b',
  rareboss: '#c85bff',
};

// ─── コンパスUI（間合い操作） ───────────────────────────────
export function CompassModal({ enemies, onSelectDirection, onClose, title }: {
  enemies: CompassEnemyDot[];
  onSelectDirection: (dir: EnemyDirection) => void;
  onClose: () => void;
  title?: string;
}) {
  const SIZE = 260;
  const CENTER = SIZE / 2;
  const MAX_R = SIZE / 2 - 24;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(5,7,14,0.85)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0a0d14', border: '1px solid #2d3752', borderRadius: 16, padding: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{ color: '#e8e6ff', fontWeight: 800, fontSize: '0.9rem' }}>{title ?? '🧭 間合い操作 — 方向を選択'}</div>
        <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1px solid #2d3752', background: 'radial-gradient(circle, #10141f 0%, #05070d 100%)',
          }} />
          <div style={{
            position: 'absolute', left: CENTER - MAX_R * 0.5, top: CENTER - MAX_R * 0.5,
            width: MAX_R, height: MAX_R, borderRadius: '50%', border: '1px dashed #1c2233',
          }} />
          <div style={{
            position: 'absolute', left: CENTER - 6, top: CENTER - 6, width: 12, height: 12,
            borderRadius: '50%', background: '#5b8dee', boxShadow: '0 0 10px 3px #5b8dee',
          }} />
          {enemies.map(en => {
            const angleIdx = ALL_DIRS.indexOf(en.direction);
            const angleDeg = angleIdx * 45 - 90;
            const rad = (angleDeg * Math.PI) / 180;
            const distRatio = Math.min(1, en.distanceM / 25);
            const r = 14 + distRatio * (MAX_R - 14);
            const x = CENTER + r * Math.cos(rad);
            const y = CENTER + r * Math.sin(rad);
            const color = KIND_COLOR[en.kind];
            return (
              <div key={en.idx} title={`${en.name} (${DIR_LABEL[en.direction]} ${Math.round(en.distanceM)}m)`} style={{
                position: 'absolute', left: x - 7, top: y - 7, width: 14, height: 14, borderRadius: '50%',
                background: color, boxShadow: `0 0 8px 3px ${color}`, border: '1px solid rgba(255,255,255,0.6)',
              }} />
            );
          })}
          {ALL_DIRS.map((dir, i) => {
            const angleDeg = i * 45 - 90;
            const rad = (angleDeg * Math.PI) / 180;
            const r = MAX_R + 14;
            const x = CENTER + r * Math.cos(rad);
            const y = CENTER + r * Math.sin(rad);
            return (
              <button key={dir} onClick={() => onSelectDirection(dir)} style={{
                position: 'absolute', left: x - 20, top: y - 14, width: 40, height: 28,
                background: '#161b26', border: '1px solid #5b8dee', borderRadius: 6,
                color: '#5b8dee', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 700,
              }}>{DIR_LABEL[dir]}</button>
            );
          })}
        </div>
        <div style={{ fontSize: '0.65rem', color: '#4a5070', display: 'flex', gap: 10 }}>
          <span>🟢 通常モブ</span><span>🟡 中ボス</span><span>🔴 ボス</span><span>🟣 レアボス</span>
        </div>
        <button onClick={onClose} style={{ padding: '5px 16px', background: '#2d3752', border: 'none', borderRadius: 6, color: '#e8e6ff', cursor: 'pointer', fontSize: '0.72rem' }}>閉じる</button>
      </div>
    </div>
  );
}

// ─── スキルボタン列（装備中の武器が持つアクティブスキルのみ動的表示） ───
const LEGACY_MANUAL_SKILL_TYPES: WeaponSkill['type'][] = [
  'goliath_shield', 'multi_weapon_cast', 'delayed_multihit', 'scaling_attack',
  'def_buff_self_dmg', 'delayed_self_heal', 'mana_drain_repeat', 'mana_restore_on_use', 'silvers_eye',
];
const NEW_MANUAL_SKILL_TYPES: WeaponSkill['type'][] = ['rush_strike', 'primal_slash', 'primal_return'];

export function getManualSkills(item: ItemMaster | null | undefined): WeaponSkill[] {
  if (!item?.weaponSkills) return [];
  return item.weaponSkills.filter(s =>
    LEGACY_MANUAL_SKILL_TYPES.includes(s.type) || NEW_MANUAL_SKILL_TYPES.includes(s.type)
  );
}
export function hasFreeReposition(item: ItemMaster | null | undefined): boolean {
  return !!item?.weaponSkills?.some(s => s.type === 'free_reposition');
}

const SKILL_LABEL: Partial<Record<WeaponSkill['type'], { icon: string; label: string }>> = {
  goliath_shield: { icon: '🛡️', label: '無敵展開' },
  multi_weapon_cast: { icon: '🔗', label: '武器連携' },
  delayed_multihit: { icon: '⏱️', label: '遅延連撃' },
  scaling_attack: { icon: '📈', label: 'スケーリング攻撃' },
  def_buff_self_dmg: { icon: '🛡️', label: '防御強化' },
  delayed_self_heal: { icon: '🩸', label: '自傷回復' },
  mana_drain_repeat: { icon: '💫', label: '連続攻撃' },
  mana_restore_on_use: { icon: '💠', label: 'マナ回復' },
  silvers_eye: { icon: '👁️', label: 'コンボ攻撃' },
  rush_strike: { icon: '⚡', label: '強襲突入' },
  primal_slash: { icon: '🌀', label: '原初の一閃' },
  primal_return: { icon: '💫', label: '原初への回帰' },
};

export function SkillButtonRow({ item, cooldownOf, disabled, onActivate, onOpenCompass, onOpenFacingCompass }: {
  item: ItemMaster | null;
  cooldownOf: (skillType: string) => number;
  disabled: boolean;
  onActivate: (skillType: WeaponSkill['type']) => void;
  onOpenCompass?: () => void;
  onOpenFacingCompass?: () => void;
}) {
  const manualSkills = getManualSkills(item);
  const showCompass = hasFreeReposition(item);
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {onOpenFacingCompass && (
        <button onClick={onOpenFacingCompass} disabled={disabled} style={{
          padding: '6px 10px', background: disabled ? '#1a1e2a' : '#161b26', border: '1px solid #4ca86a',
          borderRadius: 6, color: disabled ? '#4a5070' : '#4ca86a', fontSize: '0.7rem', fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}>↻ 向き変更</button>
      )}
      {showCompass && (
        <button onClick={onOpenCompass} disabled={disabled} style={{
          padding: '6px 10px', background: disabled ? '#1a1e2a' : '#161b26', border: '1px solid #5b8dee',
          borderRadius: 6, color: disabled ? '#4a5070' : '#5b8dee', fontSize: '0.7rem', fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}>🧭 間合い操作</button>
      )}
      {manualSkills.map(s => {
        const info = SKILL_LABEL[s.type] ?? { icon: '✨', label: s.type };
        const cd = cooldownOf(s.type);
        const isCd = cd > 0;
        return (
          <button key={s.type} disabled={disabled || isCd} onClick={() => onActivate(s.type)} style={{
            padding: '6px 10px', background: disabled || isCd ? '#1a1e2a' : '#1c1424',
            border: `1px solid ${disabled || isCd ? '#333' : '#b060e0'}`, borderRadius: 6,
            color: disabled || isCd ? '#4a5070' : '#c885ff', fontSize: '0.7rem', fontWeight: 700,
            cursor: disabled || isCd ? 'not-allowed' : 'pointer',
          }}>{info.icon} {info.label}{isCd ? `(CT${cd})` : ''}</button>
        );
      })}
    </div>
  );
}
