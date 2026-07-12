// 生活コンテンツのテーマ一覧（図鑑のフィルターに使用）
export interface LifeTheme { id: string; label: string; emoji: string; lvBase: number; color: string; }

export const LIFE_THEMES: LifeTheme[] = [
  { id: "plain", label: "平原", emoji: "🌾", lvBase: 1, color: "#8bc34a" },
  { id: "cave", label: "洞窟", emoji: "⛏️", lvBase: 8, color: "#6d8299" },
  { id: "volcano", label: "火山", emoji: "🌋", lvBase: 18, color: "#e05555" },
  { id: "fortress", label: "要塞", emoji: "🏰", lvBase: 25, color: "#9a9a9a" },
  { id: "sky", label: "天空城", emoji: "🏯", lvBase: 32, color: "#5b8dee" },
  { id: "astral", label: "アストラル・ノクス", emoji: "🌌", lvBase: 40, color: "#7c5be8" },
  { id: "chaite", label: "帝国", emoji: "⚔️", lvBase: 35, color: "#c8433c" },
  { id: "lycoris", label: "幽玄", emoji: "🌸", lvBase: 45, color: "#c060e0" },
  { id: "ffgg", label: "フィールド", emoji: "🌲", lvBase: 12, color: "#4ca86a" },
  { id: "abyss", label: "深淵", emoji: "🕳️", lvBase: 55, color: "#3a2050" },
];
