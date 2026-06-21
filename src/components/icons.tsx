// src/components/icons.tsx
// ゲーム内全アイコンをSVGで定義するコンポーネント

import React from 'react';
import { ICON_ASSETS } from './iconAssets';

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
  navy:    '#3a4a78',
  navyDk:  '#22304e',

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
    <path d="M19 4 L25 8 L13 24 L8 21 Z" fill="${C.steel}" opacity="0.95"/>
    <path d="M21 5 L24 8 L13 23 L11 22 Z" fill="rgba(220,240,255,0.4)"/>
    <rect x="7" y="20" width="9" height="3.5" rx="1" transform="rotate(-42,11.5,21.75)" fill="${C.goldDk}"/>
    <rect x="5" y="24" width="5" height="6" rx="1.5" transform="rotate(-42,7.5,27)" fill="${C.iron}"/>
    <circle cx="5.5" cy="27.5" r="2" fill="${C.steelDk}"/>
    <line x1="20" y1="10" x2="22" y2="8" stroke="rgba(220,240,255,0.6)" stroke-width="1.5"/>
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

  compass: { content: `
    <circle cx="16" cy="16" r="11" fill="#6a8ba8" opacity="0.5" stroke="#9eb8d4" stroke-width="1.5"/>
    <circle cx="16" cy="16" r="2" fill="#f0c060"/>
    <polygon points="16,7 14,16 16,13 18,16" fill="#f06830"/>
    <polygon points="16,25 18,16 16,19 14,16" fill="rgba(232,240,255,0.6)"/>
    <polygon points="7,16 16,14 13,16 16,18" fill="rgba(232,240,255,0.6)"/>
    <polygon points="25,16 16,18 19,16 16,14" fill="#f06830"/>
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
  // 新規追加アイコン
  golden_bar: { content: `
    <path d="M6 22 L8 12 L24 12 L26 22 Z" fill="${C.gold}"/>
    <path d="M8 12 L10 8 L22 8 L24 12 Z" fill="${C.glow}"/>
    <line x1="8" y1="16" x2="24" y2="16" stroke="${C.goldDk}" stroke-width="1" opacity="0.6"/>
    <line x1="8" y1="19" x2="24" y2="19" stroke="${C.goldDk}" stroke-width="1" opacity="0.4"/>
    <line x1="10" y1="8" x2="22" y2="8" stroke="rgba(255,255,200,0.7)" stroke-width="1"/>
  ` },

  wooden_knife: { content: `
    <path d="M19 6 L23 8 L12 22 L9 20 Z" fill="${C.wood}" opacity="0.95"/>
    <path d="M20 7 L22 8 L12 21 L11 20 Z" fill="rgba(255,255,200,0.25)"/>
    <rect x="8" y="19" width="7" height="3" rx="1" transform="rotate(-42,11.5,20.5)" fill="${C.bark}"/>
    <rect x="6" y="23" width="5" height="5" rx="1" transform="rotate(-42,8.5,25.5)" fill="${C.woodDk}"/>
  ` },

  golden_knife: { content: `
    <path d="M19 5 L24 8 L12 23 L8 21 Z" fill="${C.gold}" opacity="0.95"/>
    <path d="M20 6 L23 8 L12 22 L11 21 Z" fill="rgba(255,255,200,0.4)"/>
    <rect x="7" y="20" width="7" height="3" rx="1" transform="rotate(-42,10.5,21.5)" fill="${C.goldDk}"/>
    <rect x="5" y="24" width="5" height="5" rx="1.5" transform="rotate(-42,7.5,26.5)" fill="${C.goldDk}"/>
    <circle cx="6.5" cy="27.5" r="1.5" fill="${C.gold}"/>
  ` },

  diamond_sword: { content: `
    <path d="M19 4 L25 7 L13 24 L8 22 Z" fill="#58d8f8" opacity="0.95"/>
    <path d="M21 5 L24 7 L13 23 L11 22 Z" fill="rgba(200,255,255,0.5)"/>
    <rect x="7" y="20" width="9" height="3.5" rx="1" transform="rotate(-42,11.5,21.75)" fill="${C.steelDk}"/>
    <rect x="5" y="25" width="5" height="5" rx="1.5" transform="rotate(-42,7.5,27.5)" fill="${C.steelDk}"/>
    <circle cx="6" cy="28" r="2" fill="#289ab8"/>
    <circle cx="18" cy="13" r="1.5" fill="rgba(200,255,255,0.7)"/>
  ` },

  endstone_sword: { content: `
    <path d="M19 4 L25 7 L13 24 L8 22 Z" fill="#c8d890" opacity="0.95"/>
    <path d="M21 5 L24 7 L13 23 L11 22 Z" fill="rgba(230,255,190,0.45)"/>
    <rect x="7" y="20" width="9" height="3.5" rx="1" transform="rotate(-42,11.5,21.75)" fill="#7a9050"/>
    <rect x="5" y="25" width="5" height="5" rx="1.5" transform="rotate(-42,7.5,27.5)" fill="#8aaa60"/>
    <circle cx="6" cy="28" r="2" fill="#b8c880"/>
    <circle cx="20" cy="11" r="1.2" fill="rgba(230,255,190,0.8)"/>
    <circle cx="16" cy="16" r="1" fill="rgba(230,255,190,0.6)"/>
    <circle cx="13" cy="20" r="0.9" fill="rgba(230,255,190,0.7)"/>
  ` },

  // 鉄装備（各部位の形をはっきりと）
  iron_chestplate: { content: `
    <path d="M11 7 L21 7 L23 9 L23 25 L9 25 L9 9 Z" fill="${C.iron}"/>
    <path d="M11 7 L21 7 L23 9 L23 13 L9 13 L9 9 Z" fill="${C.steelDk}"/>
    <path d="M9 9 L13 7 L13 5 L11 5 Z" fill="${C.iron}"/>
    <path d="M23 9 L19 7 L19 5 L21 5 Z" fill="${C.iron}"/>
    <line x1="16" y1="7" x2="16" y2="25" stroke="${C.steelDk}" stroke-width="1" opacity="0.5"/>
    <line x1="9" y1="18" x2="23" y2="18" stroke="${C.steelDk}" stroke-width="1" opacity="0.5"/>
    <line x1="9" y1="22" x2="23" y2="22" stroke="${C.steelDk}" stroke-width="1" opacity="0.4"/>
    <path d="M11 9 Q16 8 21 9" fill="none" stroke="${C.steel}" stroke-width="1"/>
  ` },

  iron_leggings: { content: `
    <rect x="9" y="6" width="14" height="5" rx="1" fill="${C.steelDk}"/>
    <rect x="9" y="10" width="6" height="16" rx="1" fill="${C.iron}"/>
    <rect x="17" y="10" width="6" height="16" rx="1" fill="${C.iron}"/>
    <line x1="9" y1="14" x2="15" y2="14" stroke="${C.steelDk}" stroke-width="1.5" opacity="0.5"/>
    <line x1="17" y1="14" x2="23" y2="14" stroke="${C.steelDk}" stroke-width="1.5" opacity="0.5"/>
    <line x1="9" y1="18" x2="15" y2="18" stroke="${C.steelDk}" stroke-width="1" opacity="0.4"/>
    <line x1="17" y1="18" x2="23" y2="18" stroke="${C.steelDk}" stroke-width="1" opacity="0.4"/>
    <path d="M9 8 Q16 7 23 8" fill="none" stroke="${C.steel}" stroke-width="1"/>
  ` },

  iron_boots: { content: `
    <rect x="8" y="9" width="6" height="13" rx="1" fill="${C.iron}"/>
    <rect x="18" y="9" width="6" height="13" rx="1" fill="${C.iron}"/>
    <rect x="7" y="20" width="9" height="4" rx="1" fill="${C.steelDk}"/>
    <rect x="17" y="20" width="9" height="4" rx="1" fill="${C.steelDk}"/>
    <path d="M8 11 Q11 10 14 11" fill="none" stroke="${C.steel}" stroke-width="1"/>
    <path d="M18 11 Q21 10 24 11" fill="none" stroke="${C.steel}" stroke-width="1"/>
    <line x1="8" y1="16" x2="14" y2="16" stroke="${C.steelDk}" stroke-width="1" opacity="0.4"/>
    <line x1="18" y1="16" x2="24" y2="16" stroke="${C.steelDk}" stroke-width="1" opacity="0.4"/>
  ` },

  golden_chestplate: { content: `
    <path d="M11 7 L21 7 L23 9 L23 25 L9 25 L9 9 Z" fill="${C.gold}"/>
    <path d="M11 7 L21 7 L23 9 L23 13 L9 13 L9 9 Z" fill="${C.goldDk}"/>
    <path d="M9 9 L13 7 L13 5 L11 5 Z" fill="${C.gold}"/>
    <path d="M23 9 L19 7 L19 5 L21 5 Z" fill="${C.gold}"/>
    <line x1="16" y1="7" x2="16" y2="25" stroke="${C.goldDk}" stroke-width="1" opacity="0.5"/>
    <line x1="9" y1="18" x2="23" y2="18" stroke="${C.goldDk}" stroke-width="1" opacity="0.5"/>
    <line x1="9" y1="22" x2="23" y2="22" stroke="${C.goldDk}" stroke-width="1" opacity="0.4"/>
    <path d="M11 9 Q16 8 21 9" fill="none" stroke="#ffe08a" stroke-width="1"/>
  ` },

  golden_helmet: { content: `
    <path d="M8 20 Q8 10 16 8 Q24 10 24 20 L22 20 Q22 14 16 12 Q10 14 10 20 Z" fill="${C.gold}"/>
    <path d="M8 20 L24 20 L23 24 L9 24 Z" fill="${C.goldDk}"/>
    <rect x="12" y="20" width="8" height="4" rx="1" fill="${C.gold}"/>
    <path d="M11 12 Q12 10 16 10 Q20 10 21 12" fill="none" stroke="#ffe08a" stroke-width="1.5"/>
  ` },

  golden_leggings: { content: `
    <rect x="9" y="6" width="14" height="5" rx="1" fill="${C.goldDk}"/>
    <rect x="9" y="10" width="6" height="16" rx="1" fill="${C.gold}"/>
    <rect x="17" y="10" width="6" height="16" rx="1" fill="${C.gold}"/>
    <line x1="9" y1="14" x2="15" y2="14" stroke="${C.goldDk}" stroke-width="1.5" opacity="0.5"/>
    <line x1="17" y1="14" x2="23" y2="14" stroke="${C.goldDk}" stroke-width="1.5" opacity="0.5"/>
    <line x1="9" y1="18" x2="15" y2="18" stroke="${C.goldDk}" stroke-width="1" opacity="0.4"/>
    <line x1="17" y1="18" x2="23" y2="18" stroke="${C.goldDk}" stroke-width="1" opacity="0.4"/>
    <path d="M9 8 Q16 7 23 8" fill="none" stroke="#ffe08a" stroke-width="1"/>
  ` },

  golden_boots: { content: `
    <rect x="8" y="9" width="6" height="13" rx="1" fill="${C.gold}"/>
    <rect x="18" y="9" width="6" height="13" rx="1" fill="${C.gold}"/>
    <rect x="7" y="20" width="9" height="4" rx="1" fill="${C.goldDk}"/>
    <rect x="17" y="20" width="9" height="4" rx="1" fill="${C.goldDk}"/>
    <path d="M8 11 Q11 10 14 11" fill="none" stroke="#ffe08a" stroke-width="1"/>
    <path d="M18 11 Q21 10 24 11" fill="none" stroke="#ffe08a" stroke-width="1"/>
    <line x1="8" y1="16" x2="14" y2="16" stroke="${C.goldDk}" stroke-width="1" opacity="0.4"/>
    <line x1="18" y1="16" x2="24" y2="16" stroke="${C.goldDk}" stroke-width="1" opacity="0.4"/>
  ` },

  reinforced_obsidian_chestplate: { content: `
    <path d="M11 7 L21 7 L23 9 L23 25 L9 25 L9 9 Z" fill="${C.navy}"/>
    <path d="M11 7 L21 7 L23 9 L23 13 L9 13 L9 9 Z" fill="${C.navyDk}"/>
    <path d="M9 9 L13 7 L13 5 L11 5 Z" fill="${C.navy}"/>
    <path d="M23 9 L19 7 L19 5 L21 5 Z" fill="${C.navy}"/>
    <line x1="16" y1="7" x2="16" y2="25" stroke="${C.navyDk}" stroke-width="1" opacity="0.5"/>
    <line x1="9" y1="18" x2="23" y2="18" stroke="${C.navyDk}" stroke-width="1" opacity="0.5"/>
    <line x1="9" y1="22" x2="23" y2="22" stroke="${C.navyDk}" stroke-width="1" opacity="0.4"/>
    <path d="M11 9 Q16 8 21 9" fill="none" stroke="#8aa0e0" stroke-width="1"/>
  ` },

  reinforced_obsidian_helmet: { content: `
    <path d="M8 20 Q8 10 16 8 Q24 10 24 20 L22 20 Q22 14 16 12 Q10 14 10 20 Z" fill="${C.navy}"/>
    <path d="M8 20 L24 20 L23 24 L9 24 Z" fill="${C.navyDk}"/>
    <rect x="12" y="20" width="8" height="4" rx="1" fill="${C.navy}"/>
    <path d="M11 12 Q12 10 16 10 Q20 10 21 12" fill="none" stroke="#8aa0e0" stroke-width="1.5"/>
  ` },

  reinforced_obsidian_leggings: { content: `
    <rect x="9" y="6" width="14" height="5" rx="1" fill="${C.navyDk}"/>
    <rect x="9" y="10" width="6" height="16" rx="1" fill="${C.navy}"/>
    <rect x="17" y="10" width="6" height="16" rx="1" fill="${C.navy}"/>
    <line x1="9" y1="14" x2="15" y2="14" stroke="${C.navyDk}" stroke-width="1.5" opacity="0.5"/>
    <line x1="17" y1="14" x2="23" y2="14" stroke="${C.navyDk}" stroke-width="1.5" opacity="0.5"/>
    <line x1="9" y1="18" x2="15" y2="18" stroke="${C.navyDk}" stroke-width="1" opacity="0.4"/>
    <line x1="17" y1="18" x2="23" y2="18" stroke="${C.navyDk}" stroke-width="1" opacity="0.4"/>
    <path d="M9 8 Q16 7 23 8" fill="none" stroke="#8aa0e0" stroke-width="1"/>
  ` },

  reinforced_obsidian_boots: { content: `
    <rect x="8" y="9" width="6" height="13" rx="1" fill="${C.navy}"/>
    <rect x="18" y="9" width="6" height="13" rx="1" fill="${C.navy}"/>
    <rect x="7" y="20" width="9" height="4" rx="1" fill="${C.navyDk}"/>
    <rect x="17" y="20" width="9" height="4" rx="1" fill="${C.navyDk}"/>
    <path d="M8 11 Q11 10 14 11" fill="none" stroke="#8aa0e0" stroke-width="1"/>
    <path d="M18 11 Q21 10 24 11" fill="none" stroke="#8aa0e0" stroke-width="1"/>
    <line x1="8" y1="16" x2="14" y2="16" stroke="${C.navyDk}" stroke-width="1" opacity="0.4"/>
    <line x1="18" y1="16" x2="24" y2="16" stroke="${C.navyDk}" stroke-width="1" opacity="0.4"/>
  ` },

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

  rev_armor_helmet: { content: `
    <path d="M8 20 Q8 10 16 8 Q24 10 24 20 L22 20 Q22 14 16 12 Q10 14 10 20 Z" fill="#3a9a50"/>
    <path d="M8 20 L24 20 L23 24 L9 24 Z" fill="#1e6634"/>
    <rect x="12" y="20" width="8" height="4" rx="1" fill="#3a9a50"/>
    <path d="M11 12 Q12 10 16 10 Q20 10 21 12" fill="none" stroke="#6dcc80" stroke-width="1.5"/>
    <circle cx="16" cy="10" r="2" fill="#a0ffb0" opacity="0.8"/>
  ` },

  rev_armor_chest: { content: `
    <rect x="9" y="8" width="14" height="16" rx="2" fill="#3a9a50"/>
    <rect x="9" y="8" width="14" height="5" rx="2" fill="#2a7a40"/>
    <rect x="11" y="10" width="10" height="2" rx="1" fill="#6dcc80" opacity="0.6"/>
    <rect x="10" y="14" width="12" height="1" fill="#1e6634" opacity="0.5"/>
    <rect x="10" y="17" width="12" height="1" fill="#1e6634" opacity="0.5"/>
    <rect x="10" y="20" width="12" height="1" fill="#1e6634" opacity="0.5"/>
    <circle cx="16" cy="9" r="1.5" fill="#a0ffb0" opacity="0.8"/>
  ` },

  rev_armor_leggings: { content: `
    <rect x="10" y="7" width="12" height="5" rx="1" fill="#2a7a40"/>
    <rect x="10" y="11" width="5" height="14" rx="1" fill="#3a9a50"/>
    <rect x="17" y="11" width="5" height="14" rx="1" fill="#3a9a50"/>
    <rect x="10" y="11" width="12" height="2" fill="#1e6634" opacity="0.4"/>
    <rect x="11" y="14" width="3" height="1" fill="#6dcc80" opacity="0.5"/>
    <rect x="18" y="14" width="3" height="1" fill="#6dcc80" opacity="0.5"/>
  ` },

  rev_armor_boots: { content: `
    <rect x="9" y="9" width="6" height="13" rx="1" fill="#3a9a50"/>
    <rect x="17" y="9" width="6" height="13" rx="1" fill="#3a9a50"/>
    <rect x="8" y="20" width="8" height="4" rx="1" fill="#2a7a40"/>
    <rect x="16" y="20" width="8" height="4" rx="1" fill="#2a7a40"/>
    <rect x="9" y="9" width="6" height="2" fill="#6dcc80" opacity="0.4"/>
    <rect x="17" y="9" width="6" height="2" fill="#6dcc80" opacity="0.4"/>
  ` },

  rev_defencer: { content: `
    <path d="M16 5 L24 9 L24 18 Q24 24 16 27 Q8 24 8 18 L8 9 Z" fill="#3a6ab0"/>
    <path d="M16 7 L22 10 L22 18 Q22 22 16 25 Q10 22 10 18 L10 10 Z" fill="#4a80d0"/>
    <path d="M16 10 L20 12 L20 18 Q20 21 16 23 Q12 21 12 18 L12 12 Z" fill="#3a6ab0" opacity="0.5"/>
    <circle cx="16" cy="17" r="3" fill="#a0d0ff" opacity="0.8"/>
    <path d="M14 7 Q16 6 18 7" fill="none" stroke="#c0e0ff" stroke-width="1" opacity="0.7"/>
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
  // 未登録アイテム補完（武器・素材）
  // ──────────────────────────────────────────
  empty_crossbow_item: { content: `
    <path d="M6 10 Q16 4 26 10" fill="none" stroke="${C.wood}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M6 10 Q16 5.5 26 10" fill="none" stroke="${C.woodDk}" stroke-width="1" opacity="0.6"/>
    <rect x="14.5" y="9" width="3" height="18" rx="1" fill="${C.woodDk}"/>
    <rect x="13.5" y="24" width="5" height="3.5" rx="1" fill="${C.steelDk}"/>
    <circle cx="6" cy="10" r="1.6" fill="${C.steel}"/>
    <circle cx="26" cy="10" r="1.6" fill="${C.steel}"/>
    <line x1="9" y1="14" x2="23" y2="14" stroke="${C.dimWhite}" stroke-width="0.6" stroke-dasharray="1.5 1.5" opacity="0.5"/>
  ` },

  faint_gold_fragment_item: { content: `
    <path d="M9 12 L18 7 L25 12 L21 21 L11 21 Z" fill="${C.gold}"/>
    <path d="M9 12 L18 7 L18 16 L11 21 Z" fill="${C.goldDk}" opacity="0.85"/>
    <path d="M18 7 L25 12 L21 21 L18 16 Z" fill="${C.gold}" opacity="0.7"/>
    <circle cx="17" cy="13" r="2.4" fill="${C.magic}" opacity="0.55"/>
    <circle cx="17" cy="13" r="1" fill="${C.white}" opacity="0.8"/>
    <path d="M14 9 L15 11 M21 10 L20 12" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
  ` },

  devil_reactor_item: { content: `
    <circle cx="16" cy="16" r="10" fill="#2a0810"/>
    <circle cx="16" cy="16" r="8.5" fill="#5a1020"/>
    <path d="M16 8 L19 14 L16 16 L13 14 Z" fill="${C.fireDk}"/>
    <path d="M24 16 L18 19 L16 16 L18 13 Z" fill="#c83040"/>
    <path d="M16 24 L13 18 L16 16 L19 18 Z" fill="${C.fireDk}"/>
    <path d="M8 16 L14 13 L16 16 L14 19 Z" fill="#c83040"/>
    <circle cx="16" cy="16" r="3.4" fill="#ff5060"/>
    <circle cx="16" cy="16" r="1.6" fill="${C.white}" opacity="0.9"/>
  ` },

  rusty_mystery_obj_item: { content: `
    <path d="M11 5 L21 5 L24 9 L24 23 L8 23 L8 9 Z" fill="${C.rust}"/>
    <path d="M11 5 L21 5 L24 9 L20 9 L17 6 L11 6 Z" fill="#8a4828" opacity="0.8"/>
    <circle cx="13" cy="13" r="1.6" fill="#5a3018"/>
    <circle cx="19" cy="17" r="1.3" fill="#5a3018"/>
    <path d="M9 9 L23 9 M9 16 L23 16" stroke="#6a3818" stroke-width="0.8" opacity="0.6"/>
    <text x="16" y="21" font-size="9" text-anchor="middle" fill="rgba(232,240,255,0.55)">?</text>
  ` },

  sword: { content: `
    <path d="M16 4 L19 7 L12 24 L8 22 Z" fill="${C.blade}" opacity="0.95"/>
    <path d="M16 4 L17.5 5.5 L11.5 22 L10 21.3 Z" fill="rgba(255,255,255,0.45)"/>
    <rect x="6" y="20" width="9" height="3" rx="1" transform="rotate(-65,10.5,21.5)" fill="${C.goldDk}"/>
    <circle cx="7" cy="27" r="2.3" fill="${C.gold}"/>
    <rect x="6" y="25" width="2.5" height="4" rx="1" fill="${C.steelDk}"/>
  ` },

  sword_iron: { content: `
    <path d="M16 4 L19 7 L12 24 L8 22 Z" fill="${C.iron}" opacity="0.95"/>
    <path d="M16 4 L17.5 5.5 L11.5 22 L10 21.3 Z" fill="rgba(255,255,255,0.3)"/>
    <rect x="6" y="20" width="9" height="3" rx="1" transform="rotate(-65,10.5,21.5)" fill="${C.steelDk}"/>
    <circle cx="7" cy="27" r="2.3" fill="${C.steel}"/>
    <rect x="6" y="25" width="2.5" height="4" rx="1" fill="${C.stoneDk}"/>
    <line x1="13" y1="9" x2="9.5" y2="20" stroke="rgba(0,0,30,0.25)" stroke-width="1"/>
  ` },

  arrow: { content: `
    <line x1="6" y1="26" x2="24" y2="8" stroke="${C.wood}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M24 8 L18 9 L23 14 Z" fill="${C.steel}"/>
    <path d="M24 8 L17 7 L18 9 Z" fill="${C.steelDk}"/>
    <path d="M7 25 L4 22 L8 23 Z" fill="${C.leaf}"/>
    <path d="M8 24 L5 27 L9 26 Z" fill="${C.leafDk}"/>
  ` },

  bullet: { content: `
    <path d="M16 4 Q21 4 21 10 L21 20 L11 20 L11 10 Q11 4 16 4 Z" fill="${C.gold}"/>
    <path d="M16 4 Q19 4 19 10 L19 18 L13 18 L13 10 Q13 4 16 4 Z" fill="${C.goldDk}" opacity="0.85"/>
    <rect x="11" y="20" width="10" height="6" rx="1" fill="${C.steelDk}"/>
    <rect x="11" y="20" width="10" height="2" fill="${C.steel}" opacity="0.6"/>
    <ellipse cx="16" cy="9" rx="2" ry="3" fill="rgba(255,255,255,0.4)"/>
  ` },

  gem_red: { content: `
    <path d="M16 5 L25 13 L20 27 L12 27 L7 13 Z" fill="#e85060"/>
    <path d="M16 5 L25 13 L16 17 Z" fill="#ff8a90" opacity="0.9"/>
    <path d="M7 13 L16 5 L16 17 Z" fill="#c83040"/>
    <path d="M7 13 L16 17 L12 27 Z" fill="#a82030"/>
    <path d="M25 13 L16 17 L20 27 Z" fill="#d83848"/>
    <path d="M16 5 L16 17 L20 27 L25 13 Z" fill="#e85060" opacity="0.5"/>
    <path d="M13 9 L16 5 L18 8" stroke="rgba(255,255,255,0.6)" stroke-width="1" fill="none"/>
  ` },

  gold: { content: `
    <ellipse cx="16" cy="22" rx="11" ry="5" fill="${C.goldDk}"/>
    <ellipse cx="16" cy="19" rx="11" ry="5" fill="${C.gold}"/>
    <ellipse cx="16" cy="19" rx="7" ry="3" fill="rgba(255,255,255,0.25)"/>
    <ellipse cx="16" cy="13" rx="9" ry="4.5" fill="${C.goldDk}"/>
    <ellipse cx="16" cy="11" rx="9" ry="4.5" fill="${C.gold}"/>
    <ellipse cx="13" cy="9.5" rx="3" ry="1.5" fill="rgba(255,255,255,0.5)"/>
  ` },

  potion: { content: `
    <path d="M14 4 L18 4 L18 9 L21 14 L21 26 Q21 28 19 28 L13 28 Q11 28 11 26 L11 14 Z" fill="rgba(232,240,255,0.18)" stroke="${C.steel}" stroke-width="1"/>
    <path d="M12.5 17 L19.5 17 L19.5 26 Q19.5 27 18.5 27 L13.5 27 Q12.5 27 12.5 26 Z" fill="#d84060"/>
    <path d="M12.5 17 L19.5 17 L19.5 19.5 L12.5 19.5 Z" fill="#f06080" opacity="0.8"/>
    <rect x="13.5" y="2.5" width="5" height="2.5" rx="1" fill="${C.goldDk}"/>
    <circle cx="15" cy="21" r="1" fill="rgba(255,255,255,0.5)"/>
    <circle cx="17.5" cy="23.5" r="0.7" fill="rgba(255,255,255,0.4)"/>
  ` },

  goliath_shield: { content: `
    <path d="M16 3 L28 8 L28 17 Q28 25 16 29 Q4 25 4 17 L4 8 Z" fill="${C.steelDk}"/>
    <path d="M16 5 L26 9 L26 17 Q26 23 16 27 Q6 23 6 17 L6 9 Z" fill="${C.iron}"/>
    <path d="M16 5 L26 9 L26 17 Q26 23 16 27 Z" fill="rgba(255,255,255,0.08)"/>
    <path d="M16 8 L22 11 L22 17 Q22 21 16 24 Q10 21 10 17 L10 11 Z" fill="${C.steel}" opacity="0.9"/>
    <path d="M16 11 L16 22 M11.5 16.5 L20.5 16.5" stroke="${C.goldDk}" stroke-width="1.8"/>
    <circle cx="16" cy="16.5" r="2.2" fill="${C.gold}"/>
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
// アニメーションスプライトシートアイコン
// 縦長スプライトシート（64x64フレーム x N）を一定間隔で切り替え表示
// ============================================================
interface AnimSheetDef {
  src: string;       // base64データ
  frameSize: number; // 1フレームのサイズ（px, 正方形）
  frameCount: number; // フレーム数
  intervalMs: number; // 切り替え間隔(ms)
  direction?: 'vertical' | 'horizontal';
}

const ANIM_SHEET_ICONS: Record<string, AnimSheetDef> = {
  silvers_eye_anim: {
    src: ICON_ASSETS.silvers_eye_anim_png,
    frameSize: 64,
    frameCount: 8,
    intervalMs: 250,
    direction: 'vertical',
  },
};

// ============================================================
// PNG アイコンマップ（base64データを使用）
const PNG_ICONS: Record<string, string> = ICON_ASSETS;

export function GameIcon({ id, size = 24, className, style }: IconProps) {
  // アニメーションスプライトシートアイコン
  const animDef = ANIM_SHEET_ICONS[id];
  if (animDef) {
    const { src, frameCount, intervalMs, direction = 'vertical' } = animDef;
    const totalDuration = (intervalMs * frameCount) / 1000;
    const animationName = `anim-sheet-${id}`;
    // 1フレーム = size x size として表示する。スプライトシート全体は
    // 縦長(vertical)なら size x (frameCount*size)、横長(horizontal)なら (frameCount*size) x size にスケールする。
    const bgSizeW = direction === 'vertical' ? `${size}px` : `${frameCount * size}px`;
    const bgSizeH = direction === 'vertical' ? `${frameCount * size}px` : `${size}px`;
    // steps(frameCount, jump-none) は補間なしでちょうど frameCount 個のフレームを均等表示する。
    // from=0 to=-(frameCount-1)*size とすることで
    // 0, -size, -2*size, ... -(frameCount-1)*size の全フレームが表示される。
    const lastFrameOffset = (frameCount - 1) * size;
    const keyframeSteps = direction === 'vertical'
      ? `from { background-position: 0 0; } to { background-position: 0 -${lastFrameOffset}px; }`
      : `from { background-position: 0 0; } to { background-position: -${lastFrameOffset}px 0; }`;
    return (
      <span
        className={className}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          flexShrink: 0,
          width: size,
          height: size,
          backgroundImage: `url(${src})`,
          backgroundSize: `${bgSizeW} ${bgSizeH}`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0 0',
          imageRendering: 'pixelated',
          animation: `${animationName} ${totalDuration}s steps(${frameCount}, jump-none) infinite`,
          ...style,
        }}
        aria-hidden="true"
      >
        <style>{`@keyframes ${animationName} { ${keyframeSteps} }`}</style>
      </span>
    );
  }

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
