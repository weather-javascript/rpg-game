// src/systems/enemyPosition.ts
// 敵位置システム（方向・距離・行動パターン）を全ダンジョン共通で使うための共有モジュール。
// 元々FFGGRScreen.tsxにのみ実装されていたロジックをここに切り出し、
// DungeonScreenのTurnBattleからも利用できるようにしたもの。

export type EnemyDirection = 'N'|'NE'|'E'|'SE'|'S'|'SW'|'W'|'NW';

export interface EnemyPos {
  direction: EnemyDirection;
  distanceM: number;
  behavior: string;
}

export const DIR_LABEL: Record<string, string> = { N:'北',NE:'北東',E:'東',SE:'南東',S:'南',SW:'南西',W:'西',NW:'北西' };
export const DIR_EMOJI: Record<string, string> = { N:'⬆️',NE:'↗️',E:'➡️',SE:'↘️',S:'⬇️',SW:'↙️',W:'⬅️',NW:'↖️' };
export const ALL_DIRS: EnemyDirection[] = ['N','NE','E','SE','S','SW','W','NW'];

export function behaviorLabel(behavior: string): string {
  switch (behavior) {
    case 'aggressive': return '突進型';
    case 'ranged': return '遠距離型';
    case 'evasive': return '逃走型';
    case 'flying': return '飛行型';
    case 'circling': return '旋回型';
    case 'erratic': return '不規則型';
    default: return '固定型';
  }
}

export function randomDir(): EnemyDirection {
  return ALL_DIRS[Math.floor(Math.random() * 8)];
}

export function initPos(behavior: string): EnemyPos {
  const distMap: Record<string, [number, number]> = {
    aggressive: [8, 15], ranged: [10, 18], evasive: [12, 20],
    flying: [10, 18], circling: [6, 12], erratic: [4, 20], static: [0, 5],
  };
  const [mn, mx] = distMap[behavior] ?? [5, 15];
  return { direction: randomDir(), distanceM: mn + Math.floor(Math.random() * (mx - mn)), behavior };
}

export function moveEnemyPos(p: EnemyPos): EnemyPos {
  const di = ALL_DIRS.indexOf(p.direction);
  switch (p.behavior) {
    case 'aggressive':
      return { ...p, distanceM: Math.max(0, p.distanceM - (3 + Math.floor(Math.random() * 3))) };
    case 'ranged': {
      const [mn, mx] = [5, 12];
      let d = p.distanceM;
      if (d < mn) d = Math.min(d + 4, mx); else if (d > mx) d = Math.max(d - 4, mn);
      return { ...p, distanceM: d };
    }
    case 'evasive': {
      const newDi = (di + (Math.random() < 0.5 ? 1 : -1) + 8) % 8;
      return { ...p, distanceM: Math.min(p.distanceM + 5, 20), direction: ALL_DIRS[newDi] };
    }
    case 'flying': {
      const newDi = (di + (Math.random() < 0.5 ? 1 : -1) + 8) % 8;
      const d = Math.max(8, Math.min(15, p.distanceM));
      return { ...p, distanceM: d, direction: ALL_DIRS[newDi] };
    }
    case 'circling':
      return { ...p, direction: ALL_DIRS[(di + (Math.random() < 0.5 ? 1 : -1) + 8) % 8] };
    case 'erratic':
      return { ...p, direction: randomDir(), distanceM: Math.max(0, Math.min(25, p.distanceM + (Math.random() - 0.5) * 6)) };
    default:
      return p;
  }
}
