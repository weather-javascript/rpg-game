// src/components/icons.tsx
// ゲーム内全アイコンをSVGで定義するコンポーネント

import React from 'react';

interface IconProps {
  id: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================
// SVGアイコン定義 — Claudeの感性でデザインした完全オリジナルSVG
// ============================================================

// 共通パレット（ゲームのダーク系UIに映える色調）
const C = {
  // 武器・金属系
  steel:   '#9eb8d4',
  steelDk: '#6a8ba8',
  blade:   '#c8ddef',
  rust:    '#a05a3a',
  gold:    '#f0c060',
  goldDk:  '#c89028',
  iron:    '#8090a0',

  // 自然・植物系
  wood:    '#c87840',
  woodDk:  '#9a5828',
  leaf:    '#58a84a',
  leafDk:  '#347830',
  bark:    '#7a5030',
  stone:   '#8898a8',
  stoneDk: '#506070',

  // 魔法・宝石系
  gem:     '#58d8f8',
  gemDk:   '#289ab8',
  magic:   '#a070f0',
  magicDk: '#6840c0',
  fire:    '#f06830',
  fireDk:  '#c83800',
  ice:     '#a0d8f0',
  iceDk:   '#60a8d0',

  // UI系
  glow:    'rgba(255,220,100,0.9)',
  shadow:  'rgba(0,0,30,0.5)',
  white:   '#e8f0ff',
  dimWhite:'rgba(232,240,255,0.6)',
} as const;

type SvgDef = {
  vb?: string; // viewBox (default "0 0 32 32")
  content: string;
};

const ICONS: Record<string, SvgDef> = {

  // ──────────────────────────────────────────
  // ナビゲーションタブ
  // ──────────────────────────────────────────
  pickaxe: { content: `
    <g transform="rotate(-45,16,16)">
      <rect x="14" y="6" width="4" height="18" rx="2" fill="${C.wood}"/>
      <path d="M6 10 Q10 6 14 10 L14 14 Q10 18 6 14 Z" fill="${C.steel}"/>
      <path d="M14 10 L18 10 L18 14 L14 14 Z" fill="${C.steelDk}"/>
    </g>
    <line x1="8" y1="24" x2="11" y2="21" stroke="${C.goldDk}" stroke-width="1.5" stroke-linecap="round"/>
  ` },

  fishing_rod: { content: `
    <line x1="8" y1="4" x2="26" y2="8" stroke="${C.wood}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="26" y1="8" x2="27" y2="14" stroke="${C.wood}" stroke-width="2" stroke-linecap="round"/>
    <line x1="27" y1="14" x2="24" y2="22" stroke="${C.dimWhite}" stroke-width="1" stroke-dasharray="2 2"/>
    <circle cx="24" cy="23" r="2.5" fill="none" stroke="${C.gold}" stroke-width="1.5"/>
    <ellipse cx="24" cy="28" rx="3" ry="1.5" fill="${C.ice}" opacity="0.7"/>
  ` },

  market: { content: `
    <path d="M6 14 L10 8 L22 8 L26 14 Z" fill="${C.stone}"/>
    <rect x="6" y="14" width="20" height="12" rx="1" fill="${C.stoneDk}"/>
    <rect x="13" y="18" width="6" height="8" rx="1" fill="${C.wood}"/>
    <rect x="8" y="16" width="5" height="5" rx="1" fill="${C.gem}" opacity="0.8"/>
    <rect x="19" y="16" width="5" height="5" rx="1" fill="${C.gold}" opacity="0.9"/>
    <line x1="6" y1="12" x2="26" y2="12" stroke="${C.gold}" stroke-width="1.5"/>
  ` },

  hengen: { vb: '0 0 374 370', content: `<path fill="#565656" d="M348 9h3l6 1v9l-1 8-4 1v7l-2 4h-5l1 3-1 8h-4v3l-1 7-6 1v4l-3 1-1 2-3 4-3 1-2 4h-4l1 5h-5v3h-2v2l-2 1-3 4v2h-4l-2 4h-3l-2 6-6 1v4l-4 1-1 5-3 1-3 1-1 4h-4l1 5h-5l-1 2q-1 4-5 5l-1 4-5 1v2l-1 2-3 1-1 2q-3 5-8 7l-3 3-7 4-4 4h14l3 5 7 1 8 1 1 4h10l5 1v5h10l1 5h19v4h-2l1 5-6-1v3h18l4 1v6l-4 1h-12l-1 5h-21l1 3h3l8 2v3h-2v2h-2v2l-4 2h6l1 6h10v8h-30l-11 2-2 2-2 2h-3l1 3 3 1 1 4 5 1 1 5h4l2 5h3l1 7-5 1h-12v-6h-7q-3 1-5-2-2-4-4-3h-16v15l-1 1h-5v16l-5 1v15l-1 1h-5v15l-4 2-3-2v-57q-4-3-9-1v20l-7 1v-11h-2l-3-1-1-8v-3l1-6-2 1-7 2-1 4-6 1v3l-1 6 3 5 3 1 1 2q5 3 9 2 3 2 2 5h7l4 4v8l-1 6-5 1v11l-2 6-3 1v20l-1 7h-4l-2 4h-2l-1 3-3-1v-2h-2l1-4v-4l-5-5v-8l-2 1v10l-1 3v5l-1 3h-6l-1-4v-2l-4-1v-2l-1-3v-3q-1-3-5-5l-2-4v-2l-1-2-2-4-5-1v21l-1 5-2 1-4-1v-10h-5q-2-4-2-10 0-2-3-5l-1-12v-3q0-3 2-5l2-1v-8l-4-1v-17q1-6 6-10l5-1v-2l2-5q4-4 4-9h2v-2c5-5 5-5 8-5v-4l4-1q2-9 0-19h-3v4h2q-1 6-5 8h-2v4h-4v4h-4l-1 2-4 6h-3v4h-4l-2 5h-2v2l-4 1v3l-3 1-1 3-1 2-4 1-3 5-3 3-1 2h-2l-2 1-1 3-5 5-2 2h-9q-2-3-2-8v-4l5-1v-2l1-4h5l1-5h4l1-5 5-1 1-4 4-1 1-5h2l3-3 3-3h2v-5h3l3-1 2-5 3-1 2-5h4l1-5h3l2-5h2v-2l-4-1v-2h-4v2l-4 1-1 4h-3l-1 4h-3v2q-5 4-12 5l-3 1v2q-1 4-6 7h-3v2q0 3-4 5H74l-2-1q-2 1-4-3v-3l-7 1-1 2-1 3-12 1-3-1-7-1-1-4h-7l-4-4 1-2H15c-1-4-1-4 1-8h26v-3l-2-1-4-3q-4-3-9-4l-4-2-8-2-1-5-4-1-1-5 16-1h5l1-4h-2l-3-1h-3l-4-4-2-1-8-7 1-5h32v-2l1-3q5-2 11-2h3l2-3h17v3q1 5 4 6 4 5 3 12h2l2 1 1 2 2 1q3 1 4 5 5 0 6-4l1-2h2l1-3h3v-2l3-6v-2h-2l-9 1h-3q-3 1-5-2l-2-4h-8l-1-5 4-2h18l1-8-60-1v-8h10l5 1v-5q4-2 10-1h7v-2l1-4h14l2-5h17l-1-2v-18h-5l-1-7v-5h-5v-9l1-9h5l1 5 6 2v3h2l2 1 1 2q1 4 4 4l2 1v4l1-2 2-1 1-2q2-2 5-2V54l4-2q4 5 3 11l1 7h8l7-1 1 4h3v-9l1-5h6v-2c-2-11-2-11 1-15h4l1 18v11l4-2v-4l1-6 6-1 1 10v7l5 1v10l5 2v11l1 3 5 3 1 6c-1 4-1 4 2 8l2 2 1 6v6l1-2 5-6h2l1-6h4l2-4h3v-2h2l-1-3 1-2h5v-5h2l2-1 1-2 1-2 5-1 1-5 4 1v-6h5l1-2q1-4 5-6l1-4 5 1 1-5h3v-2h2v-5h5v-5l5 1 1-6 6-1v-5h4v-5h5v-2h2v-3l5-1-1-5h6l1-5h3l7-2 1-5h8l4-6 8 1 1-2q2-6 9-4"/><path fill="#d5d5d5" d="M348 9h3l6 1v9l-1 8-4 1v7l-2 4h-5l1 3-1 8h-4v3l-1 7-6 1v4l-3 1-1 2-3 4-3 1-2 4h-4l1 5h-5v3h-2v2l-2 1-3 4v2h-4l-2 4h-3l-2 6-6 1v4l-4 1-1 5-3 1-3 1-1 4h-4l1 5h-5l-1 2q-1 4-5 5l-1 4-5 1v2l-1 2-3 1-1 3-4 2h-8v5h-6v-11h-11v6h-5v5h-6v6h-5v5h-6v9h4v2l-6 1h-3l-6-1v-14h3v3h3v-11h-3v-4l3-1 1-3h4v-4h-4v-4h4v-2l4-4 1-3 1-2 4-1 1-6h4l2-4h3v-2h2l-1-3 1-2h5v-5h2l2-1 1-2 1-2 5-1 1-5 4 1v-6h5l1-2q1-4 5-6l1-4 5 1 1-5h3v-2h2v-5h5v-5l5 1 1-6 6-1v-5h4v-5h5v-2h2v-3l5-1-1-5h6l1-5h3l7-2 1-5h8l4-6 8 1 1-2q2-6 9-4"/><path fill="#8d408e" d="m66 291 4 1v4l2-1h3l1 4v3l-2 1-3 2v8l-4 2-2-1v2l-3 4q-2 2-2 6v3l-2 1q-5 2-5 6l-4 1v3l-3 7h-2l-2 5c-11-1-11-1-15-3v2H15l-1-10v-17h7l-1-6q4-2 10-1v-4l5-1 2-6h7l4-4h5l1-7h8z"/><path fill="#691a68" d="M173 169h8l1 4h9v2l3 1h-2v10l5-1v11l-1 3v3l-4-1-1-4-5 1v5h-11v5h-6v-5h-16l-1-5-10-1v11h-22v-5h16v-17h11v-5h6l1-7h9v-4q5-2 10-1"/><path fill="#835184" d="M98 86h5l1 5 6 2v3h2l2 1 1 2q1 4 4 4l2 1 1 4 3 1v11h6v11h-6v-6l-5-1v-4h-11v11h5v17H92v5H81v6l-11 1H43v-8h10l5 1v-5q4-2 10-1h7v-2l1-4h14l2-5h17l-1-2v-18h-5l-1-7v-5h-5v-9z"/>` },

  swords: { content: `
    <line x1="5" y1="27" x2="21" y2="11" stroke="${C.blade}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M20 10 L23 7 L26 8 L27 11 L24 14 Z" fill="${C.steel}"/>
    <path d="M5 27 L8 24" stroke="${C.goldDk}" stroke-width="3" stroke-linecap="round"/>
    <line x1="27" y1="5" x2="11" y2="21" stroke="${C.blade}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M12 20 L9 23 L6 22 L5 19 L8 16 Z" fill="${C.steel}"/>
    <path d="M27 5 L24 8" stroke="${C.goldDk}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="16" cy="16" r="3" fill="${C.gold}" stroke="${C.goldDk}" stroke-width="1"/>
  ` },

  slot_machine: { content: `
    <rect x="6" y="8" width="20" height="18" rx="3" fill="${C.stoneDk}"/>
    <rect x="8" y="10" width="16" height="10" rx="2" fill="${C.iron}" opacity="0.9"/>
    <rect x="9" y="11" width="4" height="8" rx="1" fill="${C.white}" opacity="0.9"/>
    <rect x="14" y="11" width="4" height="8" rx="1" fill="${C.white}" opacity="0.9"/>
    <rect x="19" y="11" width="4" height="8" rx="1" fill="${C.white}" opacity="0.9"/>
    <text x="11" y="17" font-size="5" text-anchor="middle" fill="${C.fireDk}">7</text>
    <text x="16" y="17" font-size="5" text-anchor="middle" fill="${C.gold}">★</text>
    <text x="21" y="17" font-size="5" text-anchor="middle" fill="${C.fireDk}">7</text>
    <rect x="22" y="6" width="4" height="7" rx="2" fill="${C.rust}"/>
    <circle cx="24" cy="6" r="2" fill="${C.goldDk}"/>
    <rect x="11" y="20" width="10" height="3" rx="1" fill="${C.gold}" opacity="0.8"/>
  ` },

  globe: { content: `
    <circle cx="16" cy="16" r="11" fill="${C.iceDk}" opacity="0.4" stroke="${C.ice}" stroke-width="1.5"/>
    <ellipse cx="16" cy="16" rx="6" ry="11" fill="none" stroke="${C.dimWhite}" stroke-width="1"/>
    <line x1="5" y1="16" x2="27" y2="16" stroke="${C.dimWhite}" stroke-width="1"/>
    <path d="M7 10 Q16 13 25 10" fill="none" stroke="${C.dimWhite}" stroke-width="0.8"/>
    <path d="M7 22 Q16 19 25 22" fill="none" stroke="${C.dimWhite}" stroke-width="0.8"/>
    <circle cx="21" cy="12" r="2.5" fill="${C.gold}" opacity="0.9"/>
  ` },

  chart: { content: `
    <rect x="6" y="20" width="5" height="7" rx="1" fill="${C.gem}" opacity="0.9"/>
    <rect x="13" y="14" width="5" height="13" rx="1" fill="${C.magic}" opacity="0.9"/>
    <rect x="20" y="9" width="5" height="18" rx="1" fill="${C.gold}" opacity="0.9"/>
    <line x1="6" y1="28" x2="26" y2="28" stroke="${C.dimWhite}" stroke-width="1.5"/>
    <line x1="6" y1="8" x2="6" y2="28" stroke="${C.dimWhite}" stroke-width="1.5"/>
  ` },

  // ──────────────────────────────────────────
  // アイテム：素材系
  // ──────────────────────────────────────────
  log: { content: `
    <ellipse cx="16" cy="22" rx="12" ry="5" fill="${C.woodDk}"/>
    <ellipse cx="16" cy="18" rx="12" ry="5" fill="${C.wood}"/>
    <ellipse cx="16" cy="18" rx="8" ry="3.5" fill="${C.woodDk}" opacity="0.6"/>
    <path d="M10 14 Q12 12 14 13" fill="none" stroke="${C.woodDk}" stroke-width="1"/>
    <path d="M18 12 Q21 11 22 13" fill="none" stroke="${C.woodDk}" stroke-width="1"/>
  ` },

  rock: { content: `
    <path d="M8 24 Q7 16 12 11 Q17 6 22 10 Q27 14 24 20 Q21 26 8 24Z" fill="${C.stone}"/>
    <path d="M12 12 Q15 9 19 12" fill="none" stroke="${C.white}" stroke-width="1" opacity="0.5"/>
    <path d="M20 14 Q22 12 23 15" fill="none" stroke="${C.white}" stroke-width="0.8" opacity="0.4"/>
  ` },

  ore_black: { content: `
    <path d="M10 24 L8 14 L16 8 L24 14 L22 24 Z" fill="#2a3540"/>
    <path d="M14 10 L18 10 L20 14 L16 12 Z" fill="#445060" opacity="0.8"/>
    <circle cx="17" cy="18" r="2" fill="#607080" opacity="0.6"/>
  ` },

  coal: { content: `
    <path d="M9 22 L10 12 L16 8 L22 12 L23 22 Q16 26 9 22Z" fill="#202830"/>
    <path d="M12 11 L16 9 L20 11 L19 15 L16 13 L13 15Z" fill="#384858"/>
    <circle cx="16" cy="18" r="2.5" fill="#1a2028"/>
    <path d="M11 20 Q14 22 18 20" fill="none" stroke="#384858" stroke-width="1"/>
  ` },

  iron_ingot: { content: `
    <path d="M6 22 L8 12 L24 12 L26 22 Z" fill="${C.iron}"/>
    <path d="M8 12 L10 8 L22 8 L24 12 Z" fill="${C.steel}"/>
    <line x1="8" y1="16" x2="24" y2="16" stroke="${C.steelDk}" stroke-width="1" opacity="0.6"/>
    <line x1="8" y1="19" x2="24" y2="19" stroke="${C.steelDk}" stroke-width="1" opacity="0.4"/>
  ` },

  sparkle: { content: `
    <path d="M16 4 L17.5 13 L26 11 L19 16 L26 21 L17.5 19 L16 28 L14.5 19 L6 21 L13 16 L6 11 L14.5 13 Z" fill="${C.gold}"/>
    <circle cx="16" cy="16" r="3" fill="${C.white}"/>
  ` },

  emerald: { content: `
    <path d="M12 6 L20 6 L26 12 L26 20 L20 26 L12 26 L6 20 L6 12 Z" fill="#40c870"/>
    <path d="M13 8 L19 8 L23 12 L23 20 L19 24 L13 24 L9 20 L9 12 Z" fill="#58e888" opacity="0.6"/>
    <path d="M14 10 L18 10 L21 13" fill="none" stroke="${C.white}" stroke-width="1.5" opacity="0.7"/>
  ` },

  gem: { content: `
    <path d="M10 14 L16 6 L22 14 L16 26 Z" fill="${C.gem}"/>
    <path d="M10 14 L22 14 L16 26 Z" fill="${C.gemDk}" opacity="0.6"/>
    <path d="M10 14 L16 6 L22 14 Z" fill="${C.ice}" opacity="0.8"/>
    <line x1="13" y1="10" x2="19" y2="10" stroke="${C.white}" stroke-width="1" opacity="0.7"/>
  ` },

  gem_blue: { content: `
    <path d="M11 15 L16 6 L21 15 L16 26 Z" fill="#4090e0"/>
    <path d="M11 15 L21 15 L16 26 Z" fill="#2060b0" opacity="0.7"/>
    <path d="M11 15 L16 6 L21 15 Z" fill="#80c0ff" opacity="0.8"/>
  ` },

  magic_stone_blue: { content: `
    <circle cx="16" cy="16" r="10" fill="#2050a0" opacity="0.8"/>
    <circle cx="16" cy="16" r="7" fill="#3070d0" opacity="0.7"/>
    <path d="M13 10 L16 16 L19 10" fill="none" stroke="#80c0ff" stroke-width="1.5"/>
    <circle cx="16" cy="16" r="3" fill="#a0d0ff" opacity="0.9"/>
  ` },

  magic_stone_purple: { content: `
    <circle cx="16" cy="16" r="10" fill="#500890" opacity="0.8"/>
    <circle cx="16" cy="16" r="7" fill="#7020b0" opacity="0.7"/>
    <path d="M13 10 L16 16 L19 10" fill="none" stroke="#d080ff" stroke-width="1.5"/>
    <circle cx="16" cy="16" r="3" fill="#e0b0ff" opacity="0.9"/>
  ` },

  ore_red: { content: `
    <path d="M9 22 L10 12 L16 8 L22 12 L23 22 Q16 26 9 22Z" fill="#c02020"/>
    <path d="M12 11 L16 9 L20 11" fill="none" stroke="#ff8080" stroke-width="1.5"/>
    <circle cx="16" cy="18" r="3" fill="#ff4040" opacity="0.7"/>
  ` },

  ore_blue: { content: `
    <path d="M9 22 L10 12 L16 8 L22 12 L23 22 Q16 26 9 22Z" fill="#1840a0"/>
    <path d="M12 11 L16 9 L20 11" fill="none" stroke="#80a8ff" stroke-width="1.5"/>
    <circle cx="16" cy="18" r="3" fill="#4080ff" opacity="0.7"/>
  ` },

  ore_green: { content: `
    <path d="M9 22 L10 12 L16 8 L22 12 L23 22 Q16 26 9 22Z" fill="#104820"/>
    <path d="M12 11 L16 9 L20 11" fill="none" stroke="#70e870" stroke-width="1.5"/>
    <circle cx="16" cy="18" r="3" fill="#30c040" opacity="0.7"/>
  ` },

  ore_yellow: { content: `
    <path d="M9 22 L10 12 L16 8 L22 12 L23 22 Q16 26 9 22Z" fill="#806000"/>
    <path d="M12 11 L16 9 L20 11" fill="none" stroke="${C.gold}" stroke-width="1.5"/>
    <circle cx="16" cy="18" r="3" fill="${C.gold}" opacity="0.8"/>
  ` },

  ore_brown: { content: `
    <path d="M9 22 L10 12 L16 8 L22 12 L23 22 Q16 26 9 22Z" fill="#604020"/>
    <path d="M12 11 L16 9 L20 11" fill="none" stroke="#c08060" stroke-width="1.5"/>
    <circle cx="16" cy="18" r="3" fill="#904828" opacity="0.8"/>
  ` },

  ore_dark: { content: `
    <path d="M9 22 L10 12 L16 8 L22 12 L23 22 Q16 26 9 22Z" fill="#202020"/>
    <path d="M12 11 L16 9 L20 11" fill="none" stroke="#606060" stroke-width="1.5"/>
    <circle cx="16" cy="18" r="3" fill="#404040" opacity="0.8"/>
  ` },

  ore_dark_brown: { content: `
    <path d="M9 22 L10 12 L16 8 L22 12 L23 22 Q16 26 9 22Z" fill="#3a2010"/>
    <path d="M12 11 L16 9 L20 11" fill="none" stroke="#907060" stroke-width="1.5"/>
    <circle cx="16" cy="18" r="3" fill="#604030" opacity="0.8"/>
  ` },

  ore_white: { content: `
    <path d="M9 22 L10 12 L16 8 L22 12 L23 22 Q16 26 9 22Z" fill="#d0d8e0"/>
    <path d="M12 11 L16 9 L20 11" fill="none" stroke="${C.white}" stroke-width="1.5"/>
    <circle cx="16" cy="18" r="3" fill="${C.white}" opacity="0.9"/>
  ` },

  ore_white2: { content: `
    <path d="M9 22 L10 12 L16 8 L22 12 L23 22 Q16 26 9 22Z" fill="#d8d8e8"/>
    <path d="M12 11 L16 9 L20 11" fill="none" stroke="#f0f0ff" stroke-width="1.5"/>
    <circle cx="16" cy="18" r="3" fill="#f0f0ff" opacity="0.9"/>
  ` },

  diamond_blue: { content: `
    <path d="M16 6 L22 14 L16 26 L10 14 Z" fill="#5090e0"/>
    <path d="M10 14 L22 14 L16 26 Z" fill="#2060b0" opacity="0.7"/>
    <path d="M16 6 L22 14 L16 10 Z" fill="#90c8ff" opacity="0.8"/>
  ` },

  stalactite: { content: `
    <rect x="6" y="8" width="20" height="4" rx="1" fill="${C.stone}"/>
    <path d="M10 12 L8 24 L12 12 Z" fill="${C.stone}" opacity="0.9"/>
    <path d="M16 12 L14 22 L18 12 Z" fill="${C.stoneDk}"/>
    <path d="M22 12 L20 18 L24 12 Z" fill="${C.stone}" opacity="0.8"/>
    <path d="M9 16 L10 20 L11 16" fill="none" stroke="${C.ice}" stroke-width="0.8" opacity="0.7"/>
  ` },

  ice: { content: `
    <path d="M16 5 L16 27 M5 16 L27 16 M9 9 L23 23 M23 9 L9 23" stroke="${C.ice}" stroke-width="1.5" fill="none"/>
    <circle cx="16" cy="16" r="4" fill="${C.iceDk}" opacity="0.5"/>
    <circle cx="16" cy="16" r="2" fill="${C.white}" opacity="0.9"/>
    <circle cx="14" cy="9" r="1.5" fill="${C.ice}" opacity="0.7"/>
    <circle cx="18" cy="23" r="1.5" fill="${C.ice}" opacity="0.7"/>
    <circle cx="9" cy="14" r="1.5" fill="${C.ice}" opacity="0.7"/>
    <circle cx="23" cy="18" r="1.5" fill="${C.ice}" opacity="0.7"/>
  ` },

  coin: { content: `
    <circle cx="16" cy="16" r="11" fill="${C.goldDk}"/>
    <circle cx="16" cy="16" r="9" fill="${C.gold}"/>
    <text x="16" y="20" font-size="9" text-anchor="middle" fill="${C.goldDk}" font-weight="bold">G</text>
    <circle cx="16" cy="16" r="9" fill="none" stroke="${C.goldDk}" stroke-width="0.8" opacity="0.5"/>
  ` },

  gold_bag: { content: `
    <path d="M10 28 Q6 22 8 16 Q10 10 16 10 Q22 10 24 16 Q26 22 22 28 Z" fill="${C.gold}"/>
    <path d="M13 10 Q14 6 16 6 Q18 6 19 10" fill="none" stroke="${C.goldDk}" stroke-width="2" stroke-linecap="round"/>
    <line x1="11" y1="20" x2="21" y2="20" stroke="${C.goldDk}" stroke-width="1.5" opacity="0.6"/>
    <line x1="10" y1="23" x2="22" y2="23" stroke="${C.goldDk}" stroke-width="1.5" opacity="0.4"/>
    <text x="16" y="19" font-size="7" text-anchor="middle" fill="${C.goldDk}" font-weight="bold">G</text>
  ` },

  scroll: { content: `
    <path d="M9 6 Q7 6 7 9 L7 23 Q7 26 9 26 L22 26 Q24 26 24 23 L24 9 Q24 6 22 6 Z" fill="#d4a860"/>
    <path d="M7 9 Q9 11 9 14 Q9 17 7 19" fill="none" stroke="#b08040" stroke-width="2"/>
    <line x1="11" y1="11" x2="21" y2="11" stroke="#8a6030" stroke-width="1"/>
    <line x1="11" y1="14" x2="21" y2="14" stroke="#8a6030" stroke-width="1"/>
    <line x1="11" y1="17" x2="18" y2="17" stroke="#8a6030" stroke-width="1"/>
    <line x1="11" y1="20" x2="19" y2="20" stroke="#8a6030" stroke-width="1"/>
  ` },

  clipboard: { content: `
    <rect x="9" y="8" width="14" height="18" rx="1" fill="${C.stone}"/>
    <rect x="12" y="6" width="8" height="4" rx="1" fill="${C.stoneDk}"/>
    <line x1="11" y1="13" x2="21" y2="13" stroke="${C.white}" stroke-width="1" opacity="0.7"/>
    <line x1="11" y1="16" x2="21" y2="16" stroke="${C.white}" stroke-width="1" opacity="0.7"/>
    <line x1="11" y1="19" x2="17" y2="19" stroke="${C.white}" stroke-width="1" opacity="0.7"/>
  ` },

  box: { content: `
    <path d="M6 12 L16 8 L26 12 L26 24 L16 28 L6 24 Z" fill="${C.wood}"/>
    <path d="M6 12 L16 16 L26 12" fill="none" stroke="${C.woodDk}" stroke-width="1.5"/>
    <line x1="16" y1="16" x2="16" y2="28" stroke="${C.woodDk}" stroke-width="1.5"/>
    <path d="M14 8 L16 7 L18 8 L18 12 L16 13 L14 12 Z" fill="${C.gold}"/>
  ` },

  toolbox: { content: `
    <rect x="6" y="14" width="20" height="14" rx="2" fill="${C.stone}"/>
    <path d="M11 14 L11 10 Q11 8 13 8 L19 8 Q21 8 21 10 L21 14" fill="none" stroke="${C.steel}" stroke-width="2"/>
    <line x1="6" y1="18" x2="26" y2="18" stroke="${C.steelDk}" stroke-width="1"/>
    <rect x="13" y="17" width="6" height="4" rx="1" fill="${C.gold}"/>
  ` },

  slime_gel: { content: `
    <ellipse cx="16" cy="18" rx="10" ry="8" fill="#50d870" opacity="0.8"/>
    <circle cx="13" cy="14" r="3" fill="#70f890" opacity="0.7"/>
    <circle cx="20" cy="16" r="2.5" fill="#70f890" opacity="0.6"/>
    <path d="M12 14 Q14 10 18 12" fill="none" stroke="#a0ffb0" stroke-width="1" opacity="0.6"/>
  ` },

  bubbles: { content: `
    <circle cx="12" cy="20" r="5" fill="none" stroke="#80d0ff" stroke-width="1.5" opacity="0.9"/>
    <circle cx="20" cy="18" r="4" fill="none" stroke="#80d0ff" stroke-width="1.5" opacity="0.8"/>
    <circle cx="16" cy="12" r="3" fill="none" stroke="#a0e0ff" stroke-width="1.2" opacity="0.7"/>
    <circle cx="10" cy="13" r="2" fill="none" stroke="#a0e0ff" stroke-width="1" opacity="0.6"/>
    <circle cx="22" cy="24" r="2.5" fill="none" stroke="#80d0ff" stroke-width="1" opacity="0.7"/>
  ` },

  stone_idol: { content: `
    <path d="M12 26 L10 10 Q16 4 22 10 L20 26 Z" fill="${C.stone}"/>
    <circle cx="13" cy="15" r="2" fill="${C.stoneDk}"/>
    <circle cx="19" cy="15" r="2" fill="${C.stoneDk}"/>
    <path d="M13 20 Q16 22 19 20" fill="none" stroke="${C.stoneDk}" stroke-width="1.5"/>
    <rect x="8" y="24" width="16" height="3" rx="1" fill="${C.stoneDk}"/>
  ` },

  // ──────────────────────────────────────────
  // アイテム：武器・防具系
  // ──────────────────────────────────────────
  dagger: { content: `
    <line x1="8" y1="26" x2="22" y2="12" stroke="${C.blade}" stroke-width="3" stroke-linecap="round"/>
    <path d="M20 10 L24 10 L24 14 L22 12 Z" fill="${C.steel}"/>
    <rect x="6" y="24" width="6" height="2" rx="1" transform="rotate(-45,9,25)" fill="${C.goldDk}"/>
    <circle cx="8" cy="27" r="2" fill="${C.gold}"/>
  ` },

  shield: { content: `
    <path d="M16 5 L26 9 L26 18 Q26 24 16 28 Q6 24 6 18 L6 9 Z" fill="${C.steelDk}"/>
    <path d="M16 7 L24 10 L24 18 Q24 23 16 26 Q8 23 8 18 L8 10 Z" fill="${C.steel}"/>
    <path d="M16 10 L16 24 M10 16 L22 16" stroke="${C.goldDk}" stroke-width="1.5"/>
  ` },

  helmet: { content: `
    <path d="M8 20 Q8 10 16 8 Q24 10 24 20 L22 20 Q22 14 16 12 Q10 14 10 20 Z" fill="${C.iron}"/>
    <path d="M8 20 L24 20 L23 24 L9 24 Z" fill="${C.steelDk}"/>
    <rect x="12" y="20" width="8" height="4" rx="1" fill="${C.iron}"/>
    <path d="M11 12 Q12 10 16 10 Q20 10 21 12" fill="none" stroke="${C.steel}" stroke-width="1.5"/>
  ` },

  soldier_helmet: { content: `
    <path d="M8 18 Q8 9 16 7 Q24 9 24 18 L22 19 Q22 12 16 10 Q10 12 10 19 Z" fill="#506070"/>
    <path d="M7 18 L25 18 L24 22 L8 22 Z" fill="#384858"/>
    <path d="M14 22 L12 26 L20 26 L18 22 Z" fill="#506070"/>
    <line x1="8" y1="15" x2="24" y2="15" stroke="#708090" stroke-width="1"/>
  ` },

  bow_arrow: { content: `
    <path d="M8 6 Q14 12 14 16 Q14 20 8 26" fill="none" stroke="${C.wood}" stroke-width="3" stroke-linecap="round"/>
    <line x1="8" y1="6" x2="8" y2="26" stroke="${C.wood}" stroke-width="1" stroke-dasharray="2 2"/>
    <line x1="12" y1="10" x2="26" y2="16" stroke="${C.blade}" stroke-width="2" stroke-linecap="round"/>
    <path d="M26 14 L28 16 L26 18 L25 16 Z" fill="${C.iron}"/>
    <path d="M13 12 L15 13 L13 14 Z" fill="${C.gold}"/>
  ` },

  hammer: { content: `
    <rect x="6" y="10" width="14" height="9" rx="2" fill="${C.iron}"/>
    <rect x="6" y="12" width="14" height="4" fill="${C.steelDk}" opacity="0.4"/>
    <rect x="14" y="7" width="5" height="5" rx="1" fill="${C.stone}"/>
    <line x1="20" y1="16" x2="27" y2="26" stroke="${C.wood}" stroke-width="3.5" stroke-linecap="round"/>
  ` },

  wand: { content: `
    <line x1="7" y1="25" x2="22" y2="10" stroke="${C.wood}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="23" cy="9" r="4" fill="${C.magic}" opacity="0.9"/>
    <circle cx="23" cy="9" r="2" fill="${C.white}"/>
    <path d="M19 6 L21 5 M26 6 L27 5 M19 12 L18 14 M26 12 L27 14" stroke="${C.magic}" stroke-width="1.2" stroke-linecap="round"/>
  ` },

  axe: { content: `
    <line x1="22" y1="10" x2="10" y2="24" stroke="${C.wood}" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 6 Q24 6 25 12 Q22 14 18 12 Q15 9 18 6Z" fill="${C.steel}"/>
    <path d="M18 6 Q20 8 20 12 L18 12 Z" fill="${C.blade}" opacity="0.7"/>
    <path d="M20 14 L22 16 L18 18 Z" fill="${C.iron}"/>
  ` },

  chain: { content: `
    <ellipse cx="10" cy="10" rx="5" ry="3" fill="none" stroke="${C.iron}" stroke-width="2" transform="rotate(-30,10,10)"/>
    <ellipse cx="16" cy="16" rx="5" ry="3" fill="none" stroke="${C.iron}" stroke-width="2"/>
    <ellipse cx="22" cy="22" rx="5" ry="3" fill="none" stroke="${C.iron}" stroke-width="2" transform="rotate(-30,22,22)"/>
  ` },

  // ──────────────────────────────────────────
  // アイテム：食料・ポーション
  // ──────────────────────────────────────────
  meat: { content: `
    <path d="M12 24 Q8 20 10 14 Q12 8 18 8 Q24 10 22 16 Q20 22 16 24 Z" fill="#c84830"/>
    <path d="M13 22 Q10 18 11 14 Q13 10 18 10" fill="none" stroke="#e06040" stroke-width="1.5"/>
    <circle cx="10" cy="8" r="4" fill="${C.stone}"/>
    <circle cx="10" cy="8" r="2" fill="${C.stoneDk}"/>
  ` },

  raw_meat: { content: `
    <path d="M10 22 Q7 18 9 13 Q11 8 17 8 Q23 10 21 15 Q19 20 14 22 Z" fill="#d04030"/>
    <path d="M11 20 Q9 16 10 13 Q12 10 17 10" fill="none" stroke="#e87060" stroke-width="1.5"/>
    <circle cx="8" cy="8" r="3.5" fill="${C.stone}"/>
    <circle cx="8" cy="8" r="1.5" fill="${C.stoneDk}"/>
    <path d="M14 12 Q18 13 20 16" fill="none" stroke="#ff9080" stroke-width="1" opacity="0.7"/>
  ` },

  drink: { content: `
    <path d="M11 8 L9 26 L23 26 L21 8 Z" fill="#1060c0" opacity="0.7"/>
    <path d="M11 8 L21 8" stroke="${C.steel}" stroke-width="2"/>
    <path d="M10 14 Q16 16 22 14" fill="none" stroke="#4090f0" stroke-width="1.5" opacity="0.8"/>
    <path d="M19 8 L26 6 L25 10 L20 12 Z" fill="#20a060"/>
    <circle cx="14" cy="19" r="2" fill="#80c0ff" opacity="0.5"/>
  ` },

  flask: { content: `
    <path d="M14 6 L14 14 L9 24 Q8 27 10 27 L22 27 Q24 27 23 24 L18 14 L18 6 Z" fill="#2060a0" opacity="0.8"/>
    <path d="M14 6 L18 6" stroke="${C.steel}" stroke-width="2"/>
    <path d="M10 22 Q16 24 22 22" fill="none" stroke="#60a8ff" stroke-width="1.5" opacity="0.7"/>
    <circle cx="14" cy="20" r="2" fill="#80d0ff" opacity="0.6"/>
    <circle cx="18" cy="23" r="1.5" fill="#80d0ff" opacity="0.5"/>
  ` },

  pill: { content: `
    <ellipse cx="16" cy="16" rx="10" ry="6" rx="12" ry="7" fill="${C.stone}" transform="rotate(-30,16,16)"/>
    <ellipse cx="16" cy="16" rx="6" ry="3.5" fill="#e04060" opacity="0.9" transform="rotate(-30,16,16)" clip-path="url(#pill-clip)"/>
    <path d="M10 12 Q14 10 16 16" fill="#ff6080" opacity="0.6" transform="rotate(-30,16,16)"/>
  ` },

  droplet: { content: `
    <path d="M16 6 Q22 13 22 18 Q22 23 16 24 Q10 23 10 18 Q10 13 16 6Z" fill="${C.gem}" opacity="0.8"/>
    <path d="M13 14 Q14 12 16 12" fill="none" stroke="${C.white}" stroke-width="1.5" opacity="0.6"/>
  ` },

  potion_mate: { content: `
    <path d="M12 8 L12 14 L8 22 L8 26 L24 26 L24 22 L20 14 L20 8 Z" fill="#a0d840" opacity="0.85"/>
    <path d="M12 8 L20 8" stroke="${C.stone}" stroke-width="2"/>
    <path d="M14 6 L18 6" stroke="${C.stoneDk}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M9 22 Q16 24 23 22" fill="none" stroke="#d0ff60" stroke-width="1.5" opacity="0.7"/>
    <circle cx="13" cy="18" r="2" fill="#d0ff80" opacity="0.6"/>
  ` },

  // ──────────────────────────────────────────
  // アイテム：特殊・トレジャー
  // ──────────────────────────────────────────
  crown: { content: `
    <path d="M5 22 L5 14 L10 18 L16 8 L22 18 L27 14 L27 22 Z" fill="${C.gold}"/>
    <path d="M5 22 L27 22 L26 26 L6 26 Z" fill="${C.goldDk}"/>
    <circle cx="16" cy="8" r="3" fill="#e04040"/>
    <circle cx="5" cy="14" r="2" fill="#4080ff"/>
    <circle cx="27" cy="14" r="2" fill="#40c040"/>
    <rect x="6" y="22" width="20" height="4" rx="1" fill="${C.gold}" opacity="0.4"/>
  ` },

  ticket: { content: `
    <rect x="5" y="10" width="22" height="12" rx="2" fill="${C.gold}"/>
    <rect x="5" y="14" width="22" height="1" stroke="${C.goldDk}" stroke-width="0.5" stroke-dasharray="2 2" fill="none"/>
    <circle cx="5" cy="14" r="3" fill="#161a28"/>
    <circle cx="27" cy="14" r="3" fill="#161a28"/>
    <line x1="9" y1="12" x2="20" y2="12" stroke="${C.goldDk}" stroke-width="1"/>
    <line x1="9" y1="20" x2="16" y2="20" stroke="${C.goldDk}" stroke-width="1" opacity="0.6"/>
  ` },

  ticket_striped: { content: `
    <rect x="5" y="10" width="22" height="12" rx="2" fill="#e05080"/>
    <path d="M5 14 L27 14 M5 18 L27 18" stroke="${C.white}" stroke-width="0.5" stroke-dasharray="3 2" fill="none" opacity="0.5"/>
    <circle cx="5" cy="16" r="3" fill="#161a28"/>
    <circle cx="27" cy="16" r="3" fill="#161a28"/>
    <path d="M8 10 L10 22 M12 10 L14 22" stroke="${C.white}" stroke-width="1" opacity="0.3"/>
  ` },

  totem: { content: `
    <rect x="14" y="4" width="4" height="24" rx="1" fill="${C.wood}"/>
    <ellipse cx="16" cy="10" rx="7" ry="6" fill="#40a060"/>
    <circle cx="13" cy="9" r="1.5" fill="${C.white}"/>
    <circle cx="19" cy="9" r="1.5" fill="${C.white}"/>
    <circle cx="13" cy="9" r="0.8" fill="#202020"/>
    <circle cx="19" cy="9" r="0.8" fill="#202020"/>
    <path d="M13 13 Q16 15 19 13" fill="none" stroke="${C.white}" stroke-width="1.2"/>
    <path d="M9 8 L11 11 M23 8 L21 11" stroke="#80d080" stroke-width="1.5" stroke-linecap="round"/>
  ` },

  photo_frame: { content: `
    <rect x="6" y="7" width="20" height="18" rx="2" fill="${C.stoneDk}"/>
    <rect x="8" y="9" width="16" height="14" rx="1" fill="${C.stone}" opacity="0.6"/>
    <path d="M8 18 Q12 14 16 16 Q20 18 24 13 L24 23 L8 23 Z" fill="#4080a0" opacity="0.7"/>
    <circle cx="12" cy="14" r="2" fill="${C.gold}" opacity="0.8"/>
  ` },

  ancient_shard: { content: `
    <path d="M16 4 L20 12 L27 14 L22 20 L24 28 L16 24 L8 28 L10 20 L5 14 L12 12 Z" fill="${C.magic}" opacity="0.7"/>
    <path d="M16 4 L20 12 L16 14 L12 12 Z" fill="${C.white}" opacity="0.7"/>
    <path d="M22 20 L16 14 L10 20" fill="none" stroke="${C.white}" stroke-width="1" opacity="0.5"/>
    <circle cx="16" cy="14" r="2" fill="${C.white}"/>
  ` },

  flame: { content: `
    <path d="M16 28 Q8 22 9 15 Q10 10 14 8 Q12 14 16 14 Q14 10 16 4 Q20 8 22 14 Q26 10 22 18 Q24 22 16 28Z" fill="${C.fire}"/>
    <path d="M16 26 Q10 21 11 16 Q13 12 15 11 Q14 15 16 16 Q18 12 20 16 Q24 20 16 26Z" fill="#f0a020" opacity="0.8"/>
    <path d="M16 24 Q13 20 14 17 Q15 14 16 14 Q17 17 18 19 Q18 22 16 24Z" fill="${C.white}" opacity="0.7"/>
  ` },

  explosion: { content: `
    <circle cx="16" cy="16" r="7" fill="${C.fire}" opacity="0.9"/>
    <path d="M8 8 L11 14 M24 8 L21 14 M8 24 L11 18 M24 24 L21 18 M5 16 L10 16 M27 16 L22 16" stroke="${C.gold}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="16" cy="16" r="4" fill="${C.gold}" opacity="0.8"/>
    <circle cx="16" cy="16" r="2" fill="${C.white}"/>
  ` },

  impact: { content: `
    <path d="M16 4 L20 12 L28 10 L22 16 L28 22 L20 20 L16 28 L12 20 L4 22 L10 16 L4 10 L12 12 Z" fill="${C.fire}" opacity="0.9"/>
    <circle cx="16" cy="16" r="5" fill="${C.gold}"/>
    <circle cx="16" cy="16" r="2" fill="${C.white}"/>
  ` },

  bomb: { content: `
    <circle cx="16" cy="19" r="9" fill="#303030"/>
    <path d="M16 10 L18 6 L22 8" fill="none" stroke="${C.goldDk}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="22" cy="8" r="2" fill="${C.fire}"/>
    <circle cx="12" cy="14" r="2.5" fill="#505050" opacity="0.8"/>
  ` },

  skull: { content: `
    <path d="M9 20 Q7 14 9 10 Q11 5 16 5 Q21 5 23 10 Q25 14 23 20 L23 24 L9 24 Z" fill="#d0d8e0"/>
    <circle cx="13" cy="14" r="3" fill="${C.stoneDk}"/>
    <circle cx="19" cy="14" r="3" fill="${C.stoneDk}"/>
    <circle cx="13" cy="14" r="1.5" fill="#101518"/>
    <circle cx="19" cy="14" r="1.5" fill="#101518"/>
    <path d="M11 24 L11 26 L13 26 M15 24 L15 26 M19 24 L19 26 L17 26" stroke="${C.stone}" stroke-width="1.5" fill="none"/>
    <path d="M12 21 Q16 22 20 21" fill="none" stroke="${C.stone}" stroke-width="1"/>
  ` },

  dragon: { content: `
    <path d="M6 20 Q8 14 14 12 Q18 10 22 12 Q26 14 26 20 Q24 26 16 27 Q8 26 6 20Z" fill="#2040c0"/>
    <path d="M14 12 Q16 8 18 12" fill="none" stroke="#4070e0" stroke-width="2"/>
    <circle cx="13" cy="16" r="2" fill="#f0d000"/>
    <circle cx="19" cy="16" r="2" fill="#f0d000"/>
    <circle cx="13" cy="16" r="1" fill="#202020"/>
    <circle cx="19" cy="16" r="1" fill="#202020"/>
    <path d="M12 22 Q16 24 20 22" fill="none" stroke="#4070e0" stroke-width="1.5"/>
    <path d="M6 16 Q4 12 7 10 M26 16 Q28 12 25 10" stroke="#4070e0" stroke-width="2" fill="none"/>
    <path d="M7 10 L10 14" stroke="#f0d000" stroke-width="1.5"/>
    <path d="M25 10 L22 14" stroke="#f0d000" stroke-width="1.5"/>
  ` },

  dragon_head: { content: `
    <path d="M8 22 Q8 14 14 11 Q19 8 22 11 Q26 15 24 22 Q22 26 16 26 Q10 26 8 22Z" fill="#3050c8"/>
    <circle cx="13" cy="17" r="2.5" fill="#f0d000"/>
    <circle cx="13" cy="17" r="1.2" fill="#181820"/>
    <circle cx="20" cy="17" r="2.5" fill="#f0d000"/>
    <circle cx="20" cy="17" r="1.2" fill="#181820"/>
    <path d="M12 22 Q16 24 20 22" fill="none" stroke="#6080ff" stroke-width="1.5"/>
    <path d="M14 11 L12 7 M18 10 L18 6 M22 11 L24 8" stroke="#f0d000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M10 14 Q8 13 7 10 L10 11 Z" fill="#f04020"/>
  ` },

  goblin: { content: `
    <path d="M10 24 Q8 18 10 14 Q12 9 16 9 Q20 9 22 14 Q24 18 22 24 Q18 27 16 27 Q14 27 10 24Z" fill="#30a030"/>
    <circle cx="13" cy="16" r="2.5" fill="#f0d000"/>
    <circle cx="13" cy="16" r="1.2" fill="#181818"/>
    <circle cx="19" cy="16" r="2.5" fill="#f0d000"/>
    <circle cx="19" cy="16" r="1.2" fill="#181818"/>
    <path d="M13 21 Q16 23 19 21" fill="none" stroke="#20c020" stroke-width="1.5"/>
    <path d="M11 11 Q10 7 13 9 M21 11 Q22 7 19 9" stroke="#30a030" stroke-width="1.5" fill="none"/>
    <path d="M13 22 L12 26 M19 22 L20 26" stroke="#308030" stroke-width="1.5" stroke-linecap="round"/>
  ` },

  robot: { content: `
    <rect x="9" y="10" width="14" height="12" rx="2" fill="#506070"/>
    <rect x="11" y="13" width="4" height="4" rx="1" fill="#80d0ff"/>
    <rect x="17" y="13" width="4" height="4" rx="1" fill="#80d0ff"/>
    <rect x="13" y="19" width="6" height="2" rx="1" fill="#40b080"/>
    <rect x="13" y="7" width="6" height="4" rx="1" fill="#607080"/>
    <line x1="16" y1="7" x2="16" y2="4" stroke="#708090" stroke-width="2"/>
    <circle cx="16" cy="4" r="2" fill="#f0a020"/>
    <rect x="6" y="13" width="3" height="6" rx="1" fill="#506070"/>
    <rect x="23" y="13" width="3" height="6" rx="1" fill="#506070"/>
    <rect x="10" y="22" width="4" height="5" rx="1" fill="#405060"/>
    <rect x="18" y="22" width="4" height="5" rx="1" fill="#405060"/>
  ` },

  mage: { content: `
    <path d="M10 28 Q10 18 16 16 Q22 18 22 28 Z" fill="#4040a0"/>
    <circle cx="16" cy="12" r="7" fill="#5858b8"/>
    <circle cx="13" cy="11" r="1.5" fill="${C.white}" opacity="0.8"/>
    <circle cx="19" cy="11" r="1.5" fill="${C.white}" opacity="0.8"/>
    <circle cx="13" cy="11" r="0.8" fill="#181830"/>
    <circle cx="19" cy="11" r="0.8" fill="#181830"/>
    <path d="M13 14 Q16 16 19 14" fill="none" stroke="${C.white}" stroke-width="1" opacity="0.6"/>
    <path d="M9 9 Q10 4 16 5 Q22 4 23 9" fill="#6060c0"/>
    <path d="M9 9 Q6 9 7 6 L10 8 Z M23 9 Q26 9 25 6 L22 8 Z" fill="#8080d8"/>
  ` },

  silhouette: { content: `
    <circle cx="16" cy="10" r="6" fill="${C.steelDk}"/>
    <path d="M8 28 Q8 20 16 18 Q24 20 24 28 Z" fill="${C.steelDk}"/>
  ` },

  ear: { content: `
    <path d="M11 8 Q8 8 8 16 Q8 24 14 24 Q16 24 17 22 Q15 20 15 16 Q15 12 17 10 Q19 8 16 7 Q13 6 11 8Z" fill="#d09070"/>
    <path d="M14 12 Q13 14 13 17 Q13 20 15 21" fill="none" stroke="#c07858" stroke-width="1.2"/>
    <path d="M17 9 Q21 11 20 16 Q19 20 18 22" fill="none" stroke="${C.stone}" stroke-width="1" opacity="0.5"/>
  ` },

  bone: { content: `
    <line x1="8" y1="24" x2="24" y2="8" stroke="${C.stone}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="8" cy="24" r="4" fill="${C.stone}"/>
    <circle cx="6" cy="22" r="3" fill="${C.stone}"/>
    <circle cx="10" cy="26" r="3" fill="${C.stone}"/>
    <circle cx="24" cy="8" r="4" fill="${C.stone}"/>
    <circle cx="22" cy="6" r="3" fill="${C.stone}"/>
    <circle cx="26" cy="10" r="3" fill="${C.stone}"/>
  ` },

  tooth: { content: `
    <path d="M11 6 Q9 10 10 16 Q11 22 13 24 Q14 26 15 24 Q16 22 16 18 Q16 22 17 24 Q18 26 19 24 Q21 22 22 16 Q23 10 21 6 Q18 4 16 6 Q14 4 11 6Z" fill="${C.white}"/>
    <path d="M13 7 Q12 10 12 15" fill="none" stroke="#d0d8e0" stroke-width="1" opacity="0.7"/>
  ` },

  hedgehog: { content: `
    <ellipse cx="15" cy="20" rx="10" ry="7" fill="#806040"/>
    <path d="M10 16 Q12 8 16 10 Q14 14 18 13 Q16 8 20 11 Q18 15 22 14 Q22 10 24 13 Q22 16 24 18" fill="none" stroke="#604020" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="19" r="2" fill="#181010"/>
    <path d="M10 22 Q14 24 18 22" fill="none" stroke="#604020" stroke-width="1"/>
    <circle cx="10" cy="21" r="1.5" fill="#181010"/>
  ` },

  badger: { content: `
    <ellipse cx="16" cy="20" rx="10" ry="7" fill="#606068"/>
    <path d="M10 14 Q10 10 14 10 Q16 10 16 14" fill="#d0d0d0"/>
    <path d="M16 14 Q16 10 18 10 Q22 10 22 14" fill="#d0d0d0"/>
    <ellipse cx="11" cy="13" rx="2" ry="2.5" fill="#181820"/>
    <ellipse cx="21" cy="13" rx="2" ry="2.5" fill="#181820"/>
    <path d="M13 18 Q16 20 19 18" fill="none" stroke="#808090" stroke-width="1.5"/>
    <circle cx="16" cy="21" r="1.5" fill="#181820"/>
  ` },

  mole_claw: { content: `
    <path d="M10 26 Q8 20 12 16 Q14 13 16 14" fill="none" stroke="#907060" stroke-width="3" stroke-linecap="round"/>
    <path d="M16 26 Q15 20 18 16 Q20 13 22 14" fill="none" stroke="#907060" stroke-width="3" stroke-linecap="round"/>
    <path d="M22 26 Q22 20 24 16 Q26 13 27 15" fill="none" stroke="#907060" stroke-width="3" stroke-linecap="round"/>
    <path d="M8 26 Q8 20 11 16 Q13 12 15 12 L17 14 L19 12 Q21 12 23 16 Q26 20 27 26" fill="#604828" opacity="0.4"/>
  ` },

  photo_frame2: { content: `
    <rect x="6" y="6" width="20" height="20" rx="2" fill="${C.stoneDk}"/>
    <rect x="8" y="8" width="16" height="16" fill="#a09070"/>
    <path d="M8 18 L12 14 L17 17 L21 12 L24 16 L24 24 L8 24 Z" fill="#5080a0"/>
    <circle cx="12" cy="13" r="2" fill="${C.gold}" opacity="0.8"/>
  ` },

  goblin_ear: { content: `
    <path d="M10 8 Q7 8 7 16 Q7 24 13 24 Q15 24 16 22 Q14 20 14 16 Q14 12 16 10 Q18 8 15 7 Q12 6 10 8Z" fill="#308030"/>
    <path d="M13 12 Q12 14 12 17 Q12 20 14 21" fill="none" stroke="#206020" stroke-width="1.2"/>
    <path d="M16 9 Q20 11 19 16 Q18 20 17 22" fill="none" stroke="#204820" stroke-width="1" opacity="0.6"/>
  ` },

  // ──────────────────────────────────────────
  // ダンジョン・地形系
  // ──────────────────────────────────────────
  cave_hole: { content: `
    <ellipse cx="16" cy="20" rx="12" ry="8" fill="#101418"/>
    <ellipse cx="16" cy="18" rx="12" ry="8" fill="#1a2028" opacity="0.9"/>
    <ellipse cx="16" cy="16" rx="10" ry="6" fill="#101418"/>
    <ellipse cx="16" cy="15" rx="7" ry="4" fill="#0a0e12"/>
    <path d="M6 16 Q8 12 12 11" fill="none" stroke="#303840" stroke-width="2" stroke-linecap="round"/>
    <path d="M26 16 Q24 12 20 11" fill="none" stroke="#303840" stroke-width="2" stroke-linecap="round"/>
  ` },

  dungeon_building: { content: `
    <rect x="6" y="12" width="20" height="16" rx="1" fill="${C.stoneDk}"/>
    <path d="M6 12 L8 6 L24 6 L26 12 Z" fill="${C.stone}"/>
    <rect x="14" y="20" width="4" height="8" rx="1" fill="#101418"/>
    <rect x="9" y="14" width="4" height="4" rx="1" fill="#303848" opacity="0.8"/>
    <rect x="19" y="14" width="4" height="4" rx="1" fill="#303848" opacity="0.8"/>
    <path d="M8 6 L10 3 L14 5 L16 3 L18 5 L22 3 L24 6" fill="none" stroke="${C.stone}" stroke-width="1.5"/>
  ` },

  fortress: { content: `
    <rect x="4" y="14" width="24" height="14" fill="${C.stoneDk}"/>
    <rect x="4" y="10" width="6" height="10" fill="${C.stone}"/>
    <rect x="13" y="10" width="6" height="10" fill="${C.stone}"/>
    <rect x="22" y="10" width="6" height="10" fill="${C.stone}"/>
    <rect x="4" y="7" width="5" height="4" fill="${C.stoneDk}"/>
    <rect x="13" y="7" width="5" height="4" fill="${C.stoneDk}"/>
    <rect x="22" y="7" width="5" height="4" fill="${C.stoneDk}"/>
    <rect x="12" y="20" width="8" height="8" rx="1" fill="#101418"/>
    <rect x="9" y="16" width="4" height="4" rx="1" fill="#202830" opacity="0.8"/>
    <rect x="19" y="16" width="4" height="4" rx="1" fill="#202830" opacity="0.8"/>
  ` },

  castle_jp: { content: `
    <rect x="8" y="20" width="16" height="8" fill="${C.stoneDk}"/>
    <rect x="10" y="14" width="12" height="8" fill="${C.stone}"/>
    <rect x="12" y="9" width="8" height="7" fill="${C.stoneDk}"/>
    <path d="M8 20 Q6 18 8 16" fill="${C.stone}" opacity="0.7"/>
    <path d="M24 20 Q26 18 24 16" fill="${C.stone}" opacity="0.7"/>
    <path d="M10 14 Q8 12 10 10" fill="${C.stone}" opacity="0.6"/>
    <path d="M22 14 Q24 12 22 10" fill="${C.stone}" opacity="0.6"/>
    <rect x="14" y="22" width="4" height="6" rx="1" fill="#101418"/>
    <path d="M10 9 Q12 7 16 7 Q20 7 22 9" fill="${C.wood}" stroke="${C.woodDk}" stroke-width="1"/>
  ` },

  mountain: { content: `
    <path d="M4 28 L16 6 L28 28 Z" fill="${C.stone}"/>
    <path d="M10 28 L16 16 L22 28 Z" fill="${C.stoneDk}" opacity="0.7"/>
    <path d="M13 10 L16 6 L19 10 Q16 12 13 10Z" fill="${C.white}" opacity="0.8"/>
  ` },

  volcano: { content: `
    <path d="M4 28 L12 12 L20 12 L28 28 Z" fill="#606060"/>
    <path d="M12 12 L16 8 L20 12 Z" fill="#808080"/>
    <path d="M13 6 Q14 4 16 4 Q18 4 19 6 L18 8 Q16 7 14 8 Z" fill="${C.fire}" opacity="0.9"/>
    <path d="M14 5 Q16 3 18 5" fill="none" stroke="${C.gold}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M10 28 L14 18 L18 18 L22 28 Z" fill="#404040" opacity="0.7"/>
  ` },

  galaxy: { content: `
    <circle cx="16" cy="16" r="12" fill="#080c18" opacity="0.8"/>
    <ellipse cx="16" cy="16" rx="11" ry="5" fill="none" stroke="#4060c0" stroke-width="2" transform="rotate(-20,16,16)" opacity="0.7"/>
    <circle cx="16" cy="16" r="4" fill="#2030a0" opacity="0.9"/>
    <circle cx="16" cy="16" r="2" fill="#8090f0"/>
    <circle cx="9" cy="11" r="1" fill="${C.white}" opacity="0.8"/>
    <circle cx="23" cy="12" r="0.8" fill="${C.white}" opacity="0.7"/>
    <circle cx="22" cy="22" r="1" fill="${C.white}" opacity="0.8"/>
    <circle cx="10" cy="21" r="0.7" fill="${C.white}" opacity="0.6"/>
  ` },

  comet: { content: `
    <circle cx="22" cy="10" r="5" fill="${C.gold}" opacity="0.9"/>
    <circle cx="22" cy="10" r="3" fill="${C.white}"/>
    <path d="M18 13 Q10 18 6 24" stroke="${C.gold}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8"/>
    <path d="M17 15 Q11 20 8 26" stroke="${C.gold}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/>
    <path d="M19 14 Q14 22 12 28" stroke="${C.gold}" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.3"/>
  ` },

  pine_tree: { content: `
    <rect x="14" y="22" width="4" height="6" rx="1" fill="${C.bark}"/>
    <path d="M16 4 L24 14 L20 14 L26 20 L21 20 L27 26 L5 26 L11 20 L6 20 L12 14 L8 14 Z" fill="${C.leaf}"/>
    <path d="M12 14 L16 8 L20 14 L18 14 L22 20 L18 20 L20 24 L12 24 L14 20 L10 20 L14 14 Z" fill="${C.leafDk}" opacity="0.6"/>
  ` },

  oak_tree: { content: `
    <rect x="14" y="20" width="4" height="8" rx="1" fill="${C.bark}"/>
    <circle cx="16" cy="14" r="10" fill="${C.leaf}"/>
    <circle cx="10" cy="14" r="7" fill="${C.leaf}"/>
    <circle cx="22" cy="14" r="7" fill="${C.leaf}"/>
    <circle cx="16" cy="8" r="7" fill="${C.leafDk}"/>
    <circle cx="16" cy="14" r="5" fill="${C.leafDk}" opacity="0.4"/>
  ` },

  palm_tree: { content: `
    <line x1="16" y1="28" x2="18" y2="8" stroke="${C.bark}" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 8 Q24 4 28 8 Q24 12 20 10" fill="${C.leaf}"/>
    <path d="M18 8 Q14 3 10 6 Q13 11 17 10" fill="${C.leaf}"/>
    <path d="M18 8 Q12 8 8 12 Q11 14 16 12" fill="${C.leafDk}"/>
    <path d="M18 8 Q20 14 18 18 Q16 14 18 8" fill="${C.leafDk}" opacity="0.7"/>
  ` },

  cherry_blossom: { content: `
    <rect x="14" y="18" width="4" height="10" rx="1" fill="${C.bark}"/>
    <circle cx="16" cy="13" r="9" fill="#e890b0" opacity="0.8"/>
    <circle cx="10" cy="14" r="6" fill="#f0a8c8" opacity="0.7"/>
    <circle cx="22" cy="14" r="6" fill="#f0a8c8" opacity="0.7"/>
    <circle cx="16" cy="8" r="5" fill="#ffc0d8" opacity="0.8"/>
    <circle cx="14" cy="12" r="2" fill="${C.white}" opacity="0.6"/>
    <circle cx="20" cy="14" r="1.5" fill="${C.white}" opacity="0.5"/>
  ` },

  leaf: { content: `
    <path d="M16 26 Q6 20 7 12 Q8 5 16 4 Q24 5 25 12 Q26 20 16 26Z" fill="${C.leaf}"/>
    <line x1="16" y1="26" x2="16" y2="6" stroke="${C.leafDk}" stroke-width="1.5"/>
    <path d="M16 12 Q12 14 10 18 M16 12 Q20 14 22 18" fill="none" stroke="${C.leafDk}" stroke-width="1" opacity="0.7"/>
  ` },

  maple_leaf: { content: `
    <path d="M16 4 L18 9 L22 8 L20 12 L26 12 L22 16 L24 20 L19 18 L16 24 L13 18 L8 20 L10 16 L6 12 L12 12 L10 8 L14 9 Z" fill="#e05020"/>
    <line x1="16" y1="4" x2="16" y2="24" stroke="#c03010" stroke-width="1" opacity="0.5"/>
  ` },

  bamboo: { content: `
    <rect x="13" y="4" width="4" height="24" rx="2" fill="#508040"/>
    <line x1="13" y1="10" x2="17" y2="10" stroke="#386028" stroke-width="1.5"/>
    <line x1="13" y1="16" x2="17" y2="16" stroke="#386028" stroke-width="1.5"/>
    <line x1="13" y1="22" x2="17" y2="22" stroke="#386028" stroke-width="1.5"/>
    <path d="M17 10 Q22 8 24 10" fill="none" stroke="#508040" stroke-width="2" stroke-linecap="round"/>
    <path d="M13 16 Q8 14 6 16" fill="none" stroke="#508040" stroke-width="2" stroke-linecap="round"/>
  ` },

  snowflake: { content: `
    <line x1="16" y1="4" x2="16" y2="28" stroke="${C.ice}" stroke-width="2"/>
    <line x1="4" y1="16" x2="28" y2="16" stroke="${C.ice}" stroke-width="2"/>
    <line x1="8" y1="8" x2="24" y2="24" stroke="${C.ice}" stroke-width="2"/>
    <line x1="24" y1="8" x2="8" y2="24" stroke="${C.ice}" stroke-width="2"/>
    <circle cx="16" cy="16" r="3" fill="${C.white}"/>
    <circle cx="16" cy="6" r="2" fill="${C.ice}"/>
    <circle cx="16" cy="26" r="2" fill="${C.ice}"/>
    <circle cx="6" cy="16" r="2" fill="${C.ice}"/>
    <circle cx="26" cy="16" r="2" fill="${C.ice}"/>
  ` },

  blizzard: { content: `
    <path d="M8 8 Q16 6 24 10 Q28 16 24 22 Q16 26 8 22 Q4 16 8 8Z" fill="${C.ice}" opacity="0.3"/>
    <path d="M16 6 L16 26 M7 11 L25 21 M7 21 L25 11" stroke="${C.white}" stroke-width="1.5" fill="none" opacity="0.8"/>
    <circle cx="16" cy="16" r="3" fill="${C.white}"/>
    <circle cx="10" cy="10" r="2" fill="${C.ice}" opacity="0.7"/>
    <circle cx="22" cy="22" r="2" fill="${C.ice}" opacity="0.7"/>
  ` },

  wave: { content: `
    <path d="M4 14 Q8 10 12 14 Q16 18 20 14 Q24 10 28 14" fill="none" stroke="#4090d0" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M4 18 Q8 14 12 18 Q16 22 20 18 Q24 14 28 18" fill="none" stroke="#2070b0" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
    <path d="M4 22 Q8 18 12 22 Q16 26 20 22 Q24 18 28 22" fill="none" stroke="#60b0e0" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  ` },

  lightning: { content: `
    <path d="M18 4 L10 16 L15 16 L12 28 L22 14 L17 14 L22 4 Z" fill="${C.gold}"/>
    <path d="M17 4 L11 16 L16 16 L14 24 L21 14 L16 14 L20 4 Z" fill="${C.white}" opacity="0.6"/>
  ` },

  vortex: { content: `
    <path d="M16 16 Q18 8 24 8 Q28 8 26 14 Q24 20 18 20 Q12 20 12 14 Q12 8 18 8" fill="none" stroke="${C.magic}" stroke-width="2" opacity="0.9"/>
    <path d="M16 16 Q20 12 24 14" fill="none" stroke="${C.magic}" stroke-width="1.5" opacity="0.7"/>
    <circle cx="16" cy="16" r="3" fill="${C.magic}" opacity="0.8"/>
    <circle cx="16" cy="16" r="1.5" fill="${C.white}"/>
  ` },

  crystal_ball: { content: `
    <circle cx="16" cy="15" r="11" fill="#1830a0" opacity="0.7"/>
    <circle cx="16" cy="15" r="9" fill="none" stroke="${C.ice}" stroke-width="1" opacity="0.5"/>
    <circle cx="12" cy="11" r="3" fill="${C.magic}" opacity="0.5"/>
    <path d="M18 10 Q22 13 20 18" fill="none" stroke="${C.white}" stroke-width="1" opacity="0.4"/>
    <circle cx="12" cy="11" r="1.5" fill="${C.white}" opacity="0.7"/>
    <ellipse cx="16" cy="26" rx="6" ry="2" fill="${C.stoneDk}"/>
    <rect x="13" y="24" width="6" height="3" rx="1" fill="${C.stoneDk}"/>
  ` },

  star_glow: { content: `
    <path d="M16 4 L17.8 12.2 L26 10 L20 16 L26 22 L17.8 19.8 L16 28 L14.2 19.8 L6 22 L12 16 L6 10 L14.2 12.2 Z" fill="${C.gold}"/>
    <circle cx="16" cy="16" r="4" fill="${C.white}" opacity="0.9"/>
    <path d="M16 8 L17 12 L16 10 L15 12 Z M16 24 L17 20 L16 22 L15 20 Z M8 16 L12 17 L10 16 L12 15 Z M24 16 L20 17 L22 16 L20 15 Z" fill="${C.gold}" opacity="0.8"/>
  ` },

  star_spin: { content: `
    <path d="M16 5 L17.5 13 L25 10 L19 16 L24 22 L16.5 20 L15 28 L13.5 20 L6 22 L11 16 L6 10 L13.5 13 Z" fill="${C.white}" opacity="0.9"/>
    <circle cx="16" cy="16" r="3" fill="${C.gold}"/>
  ` },

  heart: { content: `
    <path d="M16 26 Q6 20 6 13 Q6 7 11 7 Q14 7 16 10 Q18 7 21 7 Q26 7 26 13 Q26 20 16 26Z" fill="#e03050"/>
    <path d="M10 10 Q10 8 13 9" fill="none" stroke="#ff7090" stroke-width="1.5" opacity="0.7"/>
  ` },

  // ──────────────────────────────────────────
  // ゲームシステム系
  // ──────────────────────────────────────────
  dice: { content: `
    <rect x="5" y="8" width="18" height="18" rx="3" fill="${C.stone}" transform="rotate(10,14,17)"/>
    <rect x="5" y="8" width="18" height="18" rx="3" fill="${C.white}" transform="rotate(-5,14,17)" opacity="0.9"/>
    <circle cx="10" cy="12" r="2" fill="${C.stoneDk}"/>
    <circle cx="18" cy="12" r="2" fill="${C.stoneDk}"/>
    <circle cx="14" cy="17" r="2" fill="${C.stoneDk}"/>
    <circle cx="10" cy="22" r="2" fill="${C.stoneDk}"/>
    <circle cx="18" cy="22" r="2" fill="${C.stoneDk}"/>
  ` },

  joker_card: { content: `
    <rect x="7" y="5" width="18" height="22" rx="2" fill="${C.white}"/>
    <rect x="7" y="5" width="18" height="22" rx="2" fill="none" stroke="${C.stoneDk}" stroke-width="0.8"/>
    <text x="16" y="20" font-size="14" text-anchor="middle" fill="${C.magic}">♠</text>
    <text x="9" y="11" font-size="6" fill="${C.stoneDk}">J</text>
    <text x="23" y="25" font-size="6" text-anchor="middle" fill="${C.stoneDk}" transform="rotate(180,23,25)">J</text>
  ` },

  target: { content: `
    <circle cx="16" cy="16" r="12" fill="none" stroke="#e04040" stroke-width="2"/>
    <circle cx="16" cy="16" r="8" fill="none" stroke="#e04040" stroke-width="1.5"/>
    <circle cx="16" cy="16" r="4" fill="#e04040"/>
    <line x1="4" y1="16" x2="12" y2="16" stroke="${C.stoneDk}" stroke-width="1.5"/>
    <line x1="20" y1="16" x2="28" y2="16" stroke="${C.stoneDk}" stroke-width="1.5"/>
    <line x1="16" y1="4" x2="16" y2="12" stroke="${C.stoneDk}" stroke-width="1.5"/>
    <line x1="16" y1="20" x2="16" y2="28" stroke="${C.stoneDk}" stroke-width="1.5"/>
  ` },

  trophy: { content: `
    <path d="M10 6 L10 16 Q10 22 16 22 Q22 22 22 16 L22 6 Z" fill="${C.gold}"/>
    <path d="M6 8 Q6 14 10 16" fill="none" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/>
    <path d="M26 8 Q26 14 22 16" fill="none" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/>
    <rect x="13" y="22" width="6" height="4" rx="1" fill="${C.goldDk}"/>
    <rect x="9" y="26" width="14" height="2.5" rx="1" fill="${C.goldDk}"/>
    <path d="M12 8 Q16 12 20 8" fill="none" stroke="${C.goldDk}" stroke-width="1" opacity="0.6"/>
  ` },

  gold_medal: { content: `
    <circle cx="16" cy="18" r="10" fill="${C.gold}"/>
    <circle cx="16" cy="18" r="8" fill="${C.goldDk}" opacity="0.4"/>
    <text x="16" y="22" font-size="10" text-anchor="middle" fill="${C.goldDk}" font-weight="bold">1</text>
    <path d="M12 8 L14 5 L16 7 L18 5 L20 8 L16 9 Z" fill="${C.gold}"/>
    <rect x="14" y="8" width="4" height="2" fill="${C.goldDk}"/>
  ` },

  // ──────────────────────────────────────────
  // UI・通知系
  // ──────────────────────────────────────────
  users: { content: `
    <circle cx="12" cy="10" r="5" fill="${C.steel}"/>
    <path d="M4 26 Q4 20 12 18 Q20 20 20 26" fill="${C.steelDk}"/>
    <circle cx="22" cy="11" r="4" fill="${C.stone}"/>
    <path d="M18 26 Q18 21 24 19 Q28 20 28 26" fill="${C.stone}" opacity="0.8"/>
  ` },

  ban: { content: `
    <circle cx="16" cy="16" r="12" fill="none" stroke="#e04040" stroke-width="3"/>
    <line x1="7" y1="7" x2="25" y2="25" stroke="#e04040" stroke-width="3"/>
  ` },

  dot_green: { content: `
    <circle cx="16" cy="16" r="8" fill="#30c050"/>
    <circle cx="16" cy="16" r="5" fill="#50e870" opacity="0.8"/>
    <circle cx="13" cy="13" r="2" fill="${C.white}" opacity="0.4"/>
  ` },

  radar: { content: `
    <circle cx="16" cy="16" r="12" fill="none" stroke="#30c080" stroke-width="1.5" opacity="0.7"/>
    <circle cx="16" cy="16" r="8" fill="none" stroke="#30c080" stroke-width="1" opacity="0.5"/>
    <circle cx="16" cy="16" r="4" fill="none" stroke="#30c080" stroke-width="1" opacity="0.4"/>
    <line x1="4" y1="16" x2="28" y2="16" stroke="#30c080" stroke-width="0.8" opacity="0.4"/>
    <line x1="16" y1="4" x2="16" y2="28" stroke="#30c080" stroke-width="0.8" opacity="0.4"/>
    <path d="M16 16 L26 10" stroke="#50e880" stroke-width="2" stroke-linecap="round"/>
    <circle cx="22" cy="10" r="2.5" fill="#50e880" opacity="0.9"/>
    <circle cx="16" cy="16" r="2" fill="#30c080"/>
  ` },

  chat: { content: `
    <path d="M5 8 Q5 6 7 6 L25 6 Q27 6 27 8 L27 18 Q27 20 25 20 L12 20 L7 25 L7 20 Q5 20 5 18 Z" fill="${C.steelDk}"/>
    <line x1="9" y1="11" x2="23" y2="11" stroke="${C.dimWhite}" stroke-width="1.5"/>
    <line x1="9" y1="14" x2="20" y2="14" stroke="${C.dimWhite}" stroke-width="1.5"/>
    <line x1="9" y1="17" x2="16" y2="17" stroke="${C.dimWhite}" stroke-width="1.5"/>
  ` },

  tag: { content: `
    <path d="M5 5 L16 5 L27 16 Q28 17 27 18 L18 27 Q17 28 16 27 L5 16 Z" fill="${C.stone}"/>
    <circle cx="10" cy="10" r="2" fill="${C.white}"/>
    <path d="M13 18 L18 13 M16 20 L21 15" stroke="${C.dimWhite}" stroke-width="1.5" stroke-linecap="round"/>
  ` },

  mail: { content: `
    <rect x="5" y="8" width="22" height="16" rx="2" fill="${C.steelDk}"/>
    <path d="M5 10 L16 18 L27 10" fill="none" stroke="${C.dimWhite}" stroke-width="1.5"/>
    <line x1="5" y1="22" x2="12" y2="16" stroke="${C.dimWhite}" stroke-width="1" opacity="0.6"/>
    <line x1="27" y1="22" x2="20" y2="16" stroke="${C.dimWhite}" stroke-width="1" opacity="0.6"/>
  ` },

  mailbox_closed: { content: `
    <rect x="6" y="12" width="20" height="14" rx="2" fill="${C.stone}"/>
    <path d="M6 18 Q16 14 26 18" fill="none" stroke="${C.dimWhite}" stroke-width="1.5"/>
    <rect x="13" y="22" width="6" height="2" rx="1" fill="${C.stoneDk}"/>
    <rect x="14" y="6" width="2" height="8" rx="1" fill="${C.iron}"/>
    <circle cx="15" cy="6" r="2" fill="${C.iron}"/>
  ` },

  mailbox_open: { content: `
    <rect x="6" y="14" width="20" height="12" rx="2" fill="${C.stone}"/>
    <path d="M6 14 Q16 8 26 14" fill="${C.stoneDk}" opacity="0.7"/>
    <rect x="13" y="22" width="6" height="2" rx="1" fill="${C.stoneDk}"/>
    <rect x="14" y="6" width="2" height="8" rx="1" fill="${C.iron}"/>
  ` },

  mailbox_empty: { content: `
    <rect x="6" y="12" width="20" height="14" rx="2" fill="${C.stoneDk}"/>
    <path d="M6 16 Q16 14 26 16" fill="none" stroke="${C.stone}" stroke-width="1" opacity="0.5"/>
    <rect x="13" y="22" width="6" height="2" rx="1" fill="${C.stoneDk}"/>
    <rect x="14" y="6" width="2" height="8" rx="1" fill="${C.iron}"/>
  ` },

  postbox: { content: `
    <rect x="7" y="10" width="18" height="18" rx="2" fill="#d02020"/>
    <rect x="13" y="8" width="6" height="4" rx="1" fill="#b01010"/>
    <rect x="10" y="14" width="12" height="2" rx="1" fill="#ff4040" opacity="0.6"/>
    <circle cx="16" cy="22" r="3" fill="#b01010"/>
    <circle cx="16" cy="22" r="1.5" fill="#d02020"/>
  ` },

  battery: { content: `
    <rect x="5" y="10" width="20" height="12" rx="2" fill="${C.stoneDk}"/>
    <rect x="25" y="13" width="3" height="6" rx="1" fill="${C.stone}"/>
    <rect x="7" y="12" width="14" height="8" rx="1" fill="#40c060" opacity="0.9"/>
    <rect x="7" y="12" width="4" height="8" rx="1" fill="#60e080"/>
  ` },

  yen: { content: `
    <text x="16" y="22" font-size="20" text-anchor="middle" fill="${C.gold}" font-weight="bold">¥</text>
  ` },

  dollar: { content: `
    <text x="16" y="22" font-size="20" text-anchor="middle" fill="#50c860" font-weight="bold">$</text>
  ` },

  old_key: { content: `
    <circle cx="11" cy="13" r="7" fill="none" stroke="${C.goldDk}" stroke-width="2.5"/>
    <circle cx="11" cy="13" r="4" fill="none" stroke="${C.goldDk}" stroke-width="1.5"/>
    <line x1="18" y1="17" x2="28" y2="26" stroke="${C.goldDk}" stroke-width="3" stroke-linecap="round"/>
    <line x1="22" y1="22" x2="24" y2="20" stroke="${C.goldDk}" stroke-width="2" stroke-linecap="round"/>
    <line x1="25" y1="24" x2="27" y2="22" stroke="${C.goldDk}" stroke-width="2" stroke-linecap="round"/>
  ` },

  ballot_box: { content: `
    <rect x="6" y="10" width="20" height="18" rx="2" fill="${C.stoneDk}"/>
    <rect x="12" y="7" width="8" height="5" rx="1" fill="${C.stone}"/>
    <path d="M10 18 L14 22 L22 14" fill="none" stroke="#40c060" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  ` },

  sos: { content: `
    <rect x="4" y="10" width="24" height="12" rx="3" fill="#e04040"/>
    <text x="16" y="20" font-size="10" text-anchor="middle" fill="${C.white}" font-weight="bold">SOS</text>
  ` },

  clock: { content: `
    <circle cx="16" cy="16" r="12" fill="${C.stoneDk}"/>
    <circle cx="16" cy="16" r="10" fill="${C.stone}" opacity="0.4"/>
    <line x1="16" y1="16" x2="16" y2="8" stroke="${C.white}" stroke-width="2" stroke-linecap="round"/>
    <line x1="16" y1="16" x2="21" y2="18" stroke="${C.white}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="16" cy="16" r="2" fill="${C.gold}"/>
  ` },

  backpack: { content: `
    <rect x="8" y="10" width="16" height="18" rx="3" fill="${C.steelDk}"/>
    <path d="M12 10 Q12 6 16 6 Q20 6 20 10" fill="none" stroke="${C.steel}" stroke-width="2.5"/>
    <rect x="11" y="16" width="10" height="5" rx="1" fill="${C.iron}"/>
    <rect x="14" y="14" width="4" height="2" rx="1" fill="${C.gold}"/>
    <rect x="10" y="11" width="2" height="16" rx="1" fill="${C.iron}" opacity="0.6"/>
    <rect x="20" y="11" width="2" height="16" rx="1" fill="${C.iron}" opacity="0.6"/>
  ` },

  pickaxe_hammer: { content: `
    <line x1="6" y1="26" x2="22" y2="10" stroke="${C.wood}" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 8 L24 10 L22 16 Z" fill="${C.iron}"/>
    <path d="M18 6 Q21 5 24 8 L22 10 Z" fill="${C.steel}"/>
    <rect x="4" y="18" width="8" height="6" rx="1" fill="${C.iron}" transform="rotate(-45,8,21)"/>
  ` },

  shell: { content: `
    <path d="M16 26 Q8 22 8 14 Q8 6 16 5 Q24 6 24 14 Q24 22 16 26Z" fill="#e8d090"/>
    <path d="M16 26 Q12 20 12 14 Q12 8 16 7" fill="none" stroke="#c0a060" stroke-width="1.5"/>
    <path d="M16 26 Q20 20 20 14 Q20 8 16 7" fill="none" stroke="#c0a060" stroke-width="1.5"/>
    <path d="M10 14 Q14 16 18 14 Q22 12 24 14" fill="none" stroke="#c0a060" stroke-width="1" opacity="0.7"/>
  ` },

  fish: { content: `
    <path d="M6 16 Q12 10 20 12 Q26 14 26 16 Q26 18 20 20 Q12 22 6 16Z" fill="#6090d0"/>
    <path d="M6 16 Q4 12 5 8 L9 14 L5 24 Q4 20 6 16Z" fill="#4070b0"/>
    <circle cx="22" cy="14" r="2" fill="${C.white}"/>
    <circle cx="22" cy="14" r="1" fill="#181830"/>
    <path d="M14 12 Q16 14 14 16" fill="none" stroke="#4070b0" stroke-width="1"/>
  ` },

  tropical_fish: { content: `
    <path d="M6 16 Q12 10 20 12 Q26 14 26 16 Q26 18 20 20 Q12 22 6 16Z" fill="#f08020"/>
    <path d="M6 16 Q4 12 5 8 L9 14 L5 24 Q4 20 6 16Z" fill="#e06010"/>
    <path d="M14 12 Q16 11 18 12 Q20 13 18 14 Q16 15 14 14 Z" fill="${C.white}" opacity="0.8"/>
    <circle cx="22" cy="14" r="1.5" fill="${C.white}"/>
    <circle cx="22" cy="14" r="0.8" fill="#181820"/>
  ` },

  pufferfish: { content: `
    <circle cx="16" cy="16" r="9" fill="#e8c040"/>
    <path d="M10 10 L8 6 M16 8 L16 4 M22 10 L24 6 M10 22 L8 26 M22 22 L24 26 M8 16 L4 16 M24 16 L28 16" stroke="#c0a030" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="13" cy="14" r="2" fill="#181820"/>
    <circle cx="19" cy="14" r="2" fill="#181820"/>
    <path d="M13 19 Q16 21 19 19" fill="none" stroke="#c0a030" stroke-width="1.5"/>
  ` },

  // ──────────────────────────────────────────
  // 鉱石採掘場系
  // ──────────────────────────────────────────
  iron_vein: { content: `
    <path d="M6 24 Q6 12 12 8 L16 8 L20 8 Q26 12 26 24 Z" fill="${C.stoneDk}"/>
    <path d="M10 16 Q14 12 18 14 Q22 16 20 20 Q16 22 12 20 Z" fill="${C.iron}" opacity="0.9"/>
    <path d="M12 16 L16 13 L20 16 L18 20 L14 20 Z" fill="${C.steel}" opacity="0.7"/>
  ` },

  // ──────────────────────────────────────────
  // フォールバック（未定義IDの場合）
  // ──────────────────────────────────────────
  _fallback: { content: `
    <rect x="6" y="6" width="20" height="20" rx="4" fill="${C.stoneDk}" opacity="0.5"/>
    <text x="16" y="20" font-size="11" text-anchor="middle" fill="${C.dimWhite}">?</text>
  ` },
};

// ============================================================
// GameIcon コンポーネント
// ============================================================
// PNG アイコンマップ（SVGの代わりに画像ファイルを使用するアイコン）
const PNG_ICONS: Record<string, string> = {
  hengen: '/icons/hengen_sword_axe.png',
  gacha_sword: 'data:image/png;base64,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',
  gacha_shield: 'data:image/png;base64,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',
  gacha_wand: 'data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCACAAIADASIAAhEBAxEB/8QAGwABAAMBAQEBAAAAAAAAAAAAAAYHCAUEAwH/xAAyEAABAwMDAwMCBAYDAAAAAAABAgMEAAURBhIhBzFBEyJRFGEIFTJxFiOBkaGxM0JS/8QAGgEBAAIDAQAAAAAAAAAAAAAAAAQFAQIDBv/EAC4RAAIBAwIDBgYDAQAAAAAAAAABAgMEESExEkHwBRNRcYGhMmGRscHxIiPR4f/aAAwDAQACEQMRAD8AxlSlKAUpSgFWl010M1rLpjfHGUNNXCDK9RmQpscexPtUoDdtOFcdgTnBqvbLFtkr638zuqrf6MRx2NiMXfqHhjazwRs3c+85Ax2qy+guuZkW+wNIyW4jkG5SW4w9SOztRkEJyVJOBvKVFWCe5UHMbD2pzhRTnUWVh9c2voT7B04VP7dU0114Fb2+xzpmp4mncNMTZUpuKn1V+xC1qCRuKc8ZIzjNerX+nv4T1nddN/mUW5fl8hTP1UY5Q5j/AEodlJ5woEZOM1Nta9Ltby9XXmQtEi44nvtmWpp9fq7FqRkKKVEj24HuPGOaiFtkkavt7mumZ02IVkPonPPIUEOKWVL3AFeAtanDtHuO7yTWIRzTjJrHFhp8sGlS2dNJTjjL0b2x1qRulSjVVhs8VkO6duEu6NNhS5D62UpaCCoenswdxODhW5KSCDx3xF64pp7EacHB4YpSlZNBSlKAUpSgFKUoBSlKAklr1BZoegLtp93S0WTdp77bjV5cdy5FbQUn00IKTjOFgkEEhXOdorZP4fuk2lNOdKWL1doUZ+9TWluq+pAcC+FISEgjlBSrtjsrnBzWUdcdMZ+lenmndYSLpFks3pDa/QbSoFoOIK0cn9XCVBWQnChxuB3VtfTlzYndNdOmOmPLZahNFtxpYUlQSEqXuH/YAJPbHY96uez7eUqmJrDWPDbfrmX3ZttUlUxNYax4bPL/AHz3R17Xbra3YWGpUVhD0lBLSQAPQaQAoBGAQBtGTj5wQQMVXPVnQ9m1fp6al2Gh6S0FpjLjD0ytSThChnhJ79+MKI+SelPluMuNJLgKmshCF8kDg7fsAc/vnI710mZTbFqjp9VSdvqOy1lR2lJQFJUo9gM7sAn5PmvRzt44cZPOd/kesdro+N8Sly5LpYRge2OSbZeTGcBSoOFh9sK4POCMj4NejWloest7XFehvRfaCEONlH2OAaPt/X62fTFUlz1Z7imyj3BY3kjGO+fH71JuukuO7qliGwUK+jYLSlJYU1u95IJCsHOP8YrwUo4npt1zPAd2u5m87NY9zp9SWtCJ6L6E/Ib9Mm3xAc+siOTluoY3+57+SRhnDmAnG3eMqO/9VVXVqdc+mdq0JadPTbHPm3aNcGsvzyUqjOKLTS0FspGEhW5zAKlZCeDwaqupN1GUamJLDwtvIXkJQq8M4pPC28hSlKjkQUpSgFKUoBSlKAlR1rKm6Ziaev8Ab2LzFt7T6Lc6+88h6GXEBI2lKwlQSpCDhaVcJ25AxiX9Ius+oNH282B99Ui1q3bAt0pLQ2qwgHB4JwPtk+O1UNuLbVuQog9j9x8H5FdtKrBcA0p8Ktj/ALULSykqbVgAb+ScZIJPjJOMDArtG7q05KSevW/iTKN1WhNTjLVe/n4+voam0xcntUXO3NQUMN+q04hcx6Sl0IdUgnIbG1SyCkJ4IGcntxXH68Lv2m4NwssBb0pL0VLa3FDY2ggBKylsg5B5OVFRBGQd2VGv+lms4Oji3Ft18gRgpZCn1tBS8Ed8qyByT4x3+TVt9ZXJ87TMPUTIioluxcx3ZUxol8Aow8NykpBySQAADgcHiqO87RvJXS7yf8Xpjb69eZ6J3U7ik25ctcGXrK0bGyLu6tCJBbPoBSRlKiCOMg4VjscZBwQRjNcK4zplxlrlz5LsmQvG5xxWVHH3r6Xd6Q9cHvqZZlOBZ3ObwoKV5IIJB58jv3rx1aRzjU8rOenAtjt3fVmo7tp626fuV3kSbXbM/SR1kYbz2ycZVgcJ3E7RkDA4riUpW8pOTy2aynKTzJ5FKUrBqKUpQClKUApSlAKsjprpLT130Hf7/ezISqC4EIWhZAbTsJ3YA5Ocd89u1RjU1z07M09pyFZrI9BnwYrjdzluPBRluKdUpJASkDCQeCfdhQSSQgKN06etj8P8Kk919P8Ayeo4gjOClSSof4I/zU6zpRlUlnVJN+xa9m0ISqycsSUYt/LODPUSQ5FlNyWdnqNqCk70JWMj5SoEH+oq8dDPQtT9LrnEuj8+53qQ5hoNtZ9Q5T/LUsNkggD9RUABjggYNE1ofpreZWnui0RDTa2JEp5zYpSdpUlTgAUD3xhRPHeo1G2jXb4pOKSy2t8eHqZ7Ijx1JKTxHDbKAuMZ6HPkRZDCo7rLikLaUclBB7feupeNI6ls+nbZqG52aVFtd0BMOStI2uDnHHdOQCU7gNwBKcgZrx6iTIRfZoluKcfLyitSlFRJPPJPevI9IfebZbefdcQwgtspWskNpKirakHsNylHA8qJ81onHD9itfCnJNeX/T5UpStTmKUpQClKUApSlAKUpQCtta7ska0/hJcajN7G0wEqbSSTtBBPcnPnzWJa3b1ju1re/CoSzPiLQu1R221JeSQs+kkYBzycnGPmrKwbUZ48P9LbsyTUZ46WGYSq1LVrm1yuncew3CQI8qM16LSQycK2qCkK3cgZwATx57DmoZorSU7Vjs9qBPtERcOI5JKZ85uOXghKllLe48nalRJ4SkDKlJ4zw4jDsqU1FYRveeWG205AyonAHP3qJTnOmnhaSWCJb1qtvlxWkljzNGWDS0HVegLiJ0UupRhxtbR2ltatxBH3z/sjsTWc5TDsWU7GfTsdZWW1pyDhQOCOPvWir1qlfTy3WiztqLP0raXLi2g79z2N5BIOFYWAjAIHuPjNZ5ukr665ypuz0/qHlu7M527lE4z571JvO7VOnBfFFYZY9rulwU4r44rD9vsealKVXlGKUpQClKUApSlAKUpQCvU5cbg5bm7a5OlLhNK3txlOqLSFc8hOcA+5XP3PzXlpWU2tjKbWwr2WSU3BvUGa6FKbjyG3VhI5ISoE4+/FeOlE8PIjJxaaLn1UYGtr/NVCmtGPMdLrTuzdtDiQrlPykjBHg/tVa610tddJ3c2+5sLSFDcy4RgOJ+fPI7EZOD8jBMq6Dx3rhqRUJGxLKAXnXFHAbSByo/bgD+tS38TL9kutst14talKKZamEhXBSgoCjxnyeOf/ACcVNjQjVoVK70edPz9y8nQhc2c7qWks/soulKVBKIUpSgFKUoBSlKAUpSgFKUoBSlKAuDoyiPB6fX68NNhNwfmNW8PFSspaUNxAGcfqSPHbI81XGrXpi7glqS8pbaQpxtHhJWoqUcfJUSf7fAA+mmL/AHG2tP2ph0qhT1IDrKjwFBQIWn4UMYz5HHxi+em9kg6qjToVyt0Wa3G9J9tKsEZc9TJweD2HPjJ+al0ou5qQoxeNH9dX9i6t6SvowoQfC0vTOr/BmmlXF1i6Ux9P2gXmxNvoZYA+pjrClHBP6wTkjHnPGB4xzTtc7i3nbz4JlfeWdW0qd3U3FKUrgRRSlKAUpSgFKUoBSlKAUpSgP1KlJUFJJSoHIIPINWjP1FedO2hi86dlLimRHDSX2z7kIKkE53DyUgYqras+ZqvRSukjFgRbnHr4zjDziFbVJOeFHfgEE5BAHYcnkHlOpKnKMoJ5zy5Eu1m48TUuF4InB1rqFmHPhSrlLnxZ0ZbDrcl9S8ZBwpJVnBB/uMj7iOUpUiU5SxxPJwnVnUxxvOBSlK0OYpSlAf/Z',
};

export function GameIcon({ id, size = 24, className, style }: IconProps) {
  // PNGアイコンが定義されている場合はimgタグで表示
  if (PNG_ICONS[id]) {
    return (
      <img
        src={PNG_ICONS[id]}
        width={size}
        height={size}
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, objectFit: 'contain', ...style }}
        aria-hidden="true"
        alt=""
      />
    );
  }

  const def = ICONS[id] ?? ICONS['_fallback'];
  const vb = def.vb ?? '0 0 32 32';

  return (
    <svg
      viewBox={vb}
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <g dangerouslySetInnerHTML={{ __html: def.content }} />
    </svg>
  );
}

// ============================================================
// アイコン一覧（開発用）
// ============================================================
export const ICON_IDS = Object.keys(ICONS).filter(k => k !== '_fallback');
