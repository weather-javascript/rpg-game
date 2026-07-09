// src/types/position.ts
// ダンジョン戦闘における位置・方位システムの型定義
// プレイヤーは常に (0,0) 固定。敵のみが方位×距離を持つ。

// ============================================================
// 8方位定義
// ============================================================
export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export const DIRECTION_LABEL: Record<Direction, string> = {
  N:'北', NE:'北東', E:'東', SE:'南東', S:'南', SW:'南西', W:'西', NW:'北西',
};

export const DIRECTION_EMOJI: Record<Direction, string> = {
  N:'⬆️', NE:'↗️', E:'➡️', SE:'↘️', S:'⬇️', SW:'↙️', W:'⬅️', NW:'↖️',
};

/** 8方位のベクトル（正規化）: X=東西、Y=南北 */
export const DIR_VECTOR: Record<Direction, [number, number]> = {
  N:  [0,1], NE: [1,1],  E:  [1,0],  SE: [1,-1],
  S:  [0,-1], SW:[-1,-1], W: [-1,0],  NW: [-1,1],
};

/** 2方位間の角度差（0〜4）*/
const DIR_ORDER: Direction[] = ['N','NE','E','SE','S','SW','W','NW'];
export function dirAngleDiff(a: Direction, b: Direction): number {
  const ai = DIR_ORDER.indexOf(a), bi = DIR_ORDER.indexOf(b);
  const diff = Math.abs(ai - bi);
  return Math.min(diff, 8 - diff);
}

/** 敵の移動行動タイプ */
export type MoveBehavior =
  | 'aggressive'   // 突進：毎ターン3〜5m接近
  | 'ranged'       // 遠距離維持：5〜10m を保つ
  | 'evasive'      // 逃走：10〜15m を保つ（アラティー等）
  | 'flying'       // 飛行：8〜15m 維持、近接無効
  | 'static'       // 固定：移動しない
  | 'circling'     // 旋回：距離維持しつつ方位を変え続ける
  | 'erratic';     // 不規則：毎ターンランダム移動

/** 敵の位置情報 */
export interface EnemyPosition {
  direction: Direction;
  distanceM: number;   // メートル距離
  behavior: MoveBehavior;
  preferredMinDist?: number;  // 維持したい最小距離
  preferredMaxDist?: number;  // 維持したい最大距離
}

// ============================================================
// 武器リーチ定義
// ============================================================
export type AttackShape =
  | 'melee_front'     // 近接・正面（N/NE/NW）
  | 'melee_360'       // 近接・全周（ハンマー等）
  | 'short_front180'  // 短距離・前方180°
  | 'mid_any'         // 中距離・任意1方位
  | 'long_line'       // 長距離・正面ライン（同方位の全敵貫通）
  | 'fan_3dir'        // 扇形・前方3方位
  | 'aoe_360'         // 全方位範囲
  | 'aoe_front_wide'  // 前方5方位
  | 'line_any'        // 任意方位のライン貫通
  | 'snipe';          // 狙撃：任意1方位・超長距離

export interface WeaponReach {
  shape: AttackShape;
  minDist: number;
  maxDist: number;
  description: string;
}

/** 攻撃形状の定義 */
export const ATTACK_SHAPES: Record<AttackShape, {
  label: string; emoji: string;
  inRange: (atkDir: Direction, target: EnemyPosition, minDist: number, maxDist: number) => boolean;
}> = {
  melee_front: {
    label:'近接（前方3方位）', emoji:'⚔️',
    inRange: (atkDir, t, min, max) =>
      t.distanceM >= min && t.distanceM <= max &&
      dirAngleDiff(atkDir, t.direction) <= 1,
  },
  melee_360: {
    label:'近接（全周）', emoji:'🔄',
    inRange: (_a, t, min, max) => t.distanceM >= min && t.distanceM <= max,
  },
  short_front180: {
    label:'短距離（前方180°）', emoji:'🏹',
    inRange: (atkDir, t, min, max) =>
      t.distanceM >= min && t.distanceM <= max &&
      dirAngleDiff(atkDir, t.direction) <= 2,
  },
  mid_any: {
    label:'中距離（任意方位）', emoji:'🎯',
    inRange: (_a, t, min, max) => t.distanceM >= min && t.distanceM <= max,
  },
  long_line: {
    label:'ライン（正面貫通）', emoji:'➡️',
    inRange: (atkDir, t, min, max) =>
      t.distanceM >= min && t.distanceM <= max &&
      dirAngleDiff(atkDir, t.direction) === 0,
  },
  fan_3dir: {
    label:'扇形（前方3方位）', emoji:'💥',
    inRange: (atkDir, t, min, max) =>
      t.distanceM >= min && t.distanceM <= max &&
      dirAngleDiff(atkDir, t.direction) <= 1,
  },
  aoe_360: {
    label:'全方位範囲', emoji:'🌀',
    inRange: (_a, t, min, max) => t.distanceM >= min && t.distanceM <= max,
  },
  aoe_front_wide: {
    label:'前方広範囲（5方位）', emoji:'🌊',
    inRange: (atkDir, t, min, max) =>
      t.distanceM >= min && t.distanceM <= max &&
      dirAngleDiff(atkDir, t.direction) <= 2,
  },
  line_any: {
    label:'任意ライン貫通', emoji:'⚡',
    inRange: (atkDir, t, min, max) =>
      t.distanceM >= min && t.distanceM <= max &&
      dirAngleDiff(atkDir, t.direction) === 0,
  },
  snipe: {
    label:'狙撃（超長距離）', emoji:'🔭',
    inRange: (_a, t, min, max) => t.distanceM >= min && t.distanceM <= max,
  },
};

// ============================================================
// 位置計算ユーティリティ
// ============================================================

/** 敵の移動処理：moveBehaviorに基づいて次ターンの位置を返す */
export function moveEnemy(pos: EnemyPosition, _playerAtk?: number): EnemyPosition {
  const { direction, distanceM, behavior } = pos;
  const dirs = DIR_ORDER;
  const di = dirs.indexOf(direction);

  switch (behavior) {
    case 'aggressive': {
      const speed = 3 + Math.floor(Math.random() * 3); // 3〜5m
      const newDist = Math.max(0, distanceM - speed);
      return { ...pos, distanceM: newDist };
    }
    case 'ranged': {
      const minD = pos.preferredMinDist ?? 5;
      const maxD = pos.preferredMaxDist ?? 12;
      let newDist = distanceM;
      if (distanceM < minD) newDist = Math.min(distanceM + 4, maxD);
      else if (distanceM > maxD) newDist = Math.max(distanceM - 4, minD);
      return { ...pos, distanceM: newDist };
    }
    case 'evasive': {
      const minD = pos.preferredMinDist ?? 10;
      const maxD = pos.preferredMaxDist ?? 18;
      let newDist = distanceM < minD ? Math.min(distanceM + 5, maxD) : distanceM;
      // 方位も変える
      const newDi = (di + (Math.random() < 0.5 ? 1 : -1) + 8) % 8;
      return { ...pos, distanceM: newDist, direction: dirs[newDi] };
    }
    case 'flying': {
      const minD = pos.preferredMinDist ?? 8;
      const maxD = pos.preferredMaxDist ?? 15;
      let newDist = distanceM < minD ? minD : distanceM > maxD ? maxD : distanceM;
      const newDi = (di + (Math.random() < 0.5 ? 1 : -1) + 8) % 8;
      return { ...pos, distanceM: newDist, direction: dirs[newDi] };
    }
    case 'circling': {
      const step = Math.random() < 0.5 ? 1 : -1;
      const newDi = (di + step + 8) % 8;
      return { ...pos, direction: dirs[newDi] };
    }
    case 'erratic': {
      const newDi = Math.floor(Math.random() * 8);
      const distChange = (Math.random() - 0.5) * 6;
      const newDist = Math.max(0, Math.min(25, distanceM + distChange));
      return { ...pos, direction: dirs[newDi], distanceM: newDist };
    }
    case 'static':
    default:
      return pos;
  }
}

/** 初期位置を生成（敵の種別に応じてランダム配置）*/
export function initialPosition(behavior: MoveBehavior): EnemyPosition {
  const dirs = DIR_ORDER;
  const dir = dirs[Math.floor(Math.random() * 8)];
  const distMap: Record<MoveBehavior, [number, number]> = {
    aggressive: [8, 15],
    ranged:     [10, 18],
    evasive:    [12, 20],
    flying:     [10, 18],
    circling:   [6, 12],
    erratic:    [4, 20],
    static:     [0, 5],
  };
  const [minD, maxD] = distMap[behavior];
  const dist = minD + Math.floor(Math.random() * (maxD - minD));
  const prefDist = { aggressive: [0,2], ranged: [5,12], evasive: [10,18], flying: [8,15], circling: [4,10], erratic: [0,20], static: [0,5] };
  return {
    direction: dir,
    distanceM: dist,
    behavior,
    preferredMinDist: prefDist[behavior][0],
    preferredMaxDist: prefDist[behavior][1],
  };
}

/** デフォルト武器リーチ（武器IDに対応。未定義なら近接）*/
export const DEFAULT_WEAPON_REACH: WeaponReach = {
  shape: 'melee_front', minDist: 0, maxDist: 2,
  description: '近接攻撃（前方3方位・2m以内）',
};
