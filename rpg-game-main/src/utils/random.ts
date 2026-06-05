// src/utils/random.ts
// crypto.getRandomValues() を使ったセキュアな乱数ユーティリティ。
// Math.random() はシードが予測可能なため、ゲームの公平性を高めるため全面置換する。

/**
 * [0, 1) の範囲の浮動小数点乱数を返す（Math.random() の代替）
 */
export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x100000000; // 2^32 で割る
}

/**
 * [0, n) の整数乱数を返す（Math.floor(Math.random() * n) の代替）
 */
export function randomInt(n: number): number {
  if (n <= 0) return 0;
  return Math.floor(secureRandom() * n);
}

/**
 * [min, max] の整数乱数を返す（両端含む）
 */
export function randomIntRange(min: number, max: number): number {
  return min + randomInt(max - min + 1);
}

/**
 * 確率 rate (0〜1) で true を返す
 */
export function randomChance(rate: number): boolean {
  return secureRandom() < rate;
}

/**
 * 配列からランダムに1要素を返す
 */
export function randomPick<T>(arr: T[]): T {
  return arr[randomInt(arr.length)];
}

/**
 * Fisher-Yates シャッフル（配列のコピーを返す）
 */
export function randomShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 確率テーブルから1エントリを選ぶ（drawFromTable の汎用版）
 */
export function drawFromTableSecure<T extends { probability: number }>(table: T[]): T {
  const rand = secureRandom();
  let cum = 0;
  for (const entry of table) {
    cum += entry.probability;
    if (rand < cum) return entry;
  }
  return table[table.length - 1];
}
