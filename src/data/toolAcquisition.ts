// src/data/toolAcquisition.ts
// 採取ツール入手経路データ：ドロップテーブル・クラフトレシピ・条件解放

// ============================================================
// ドロップテーブル
// ============================================================

export interface ToolDropEntry {
  toolId: string;
  rate: number; // 基本ドロップ率 (0.0〜1.0)
  tier: 'normal' | 'rare' | 'special'; // 通常/レア/特殊
}

export interface ToolDropTable {
  sourceId: string;
  entries: ToolDropEntry[];
}

export const TOOL_DROP_TABLES: Record<string, ToolDropEntry[]> = {
  // ============================================================
  // 採掘系ノード
  // ============================================================
  stone_quarry: [
    { toolId: 'stone_speed_pickaxe', rate: 0.010, tier: 'normal' },
    { toolId: 'stone_yield_pickaxe', rate: 0.010, tier: 'normal' },
    { toolId: 'stone_efficiency_pickaxe', rate: 0.008, tier: 'normal' },
    { toolId: 'stone_combo_pickaxe', rate: 0.010, tier: 'normal' },
    { toolId: 'stone_rare_pickaxe', rate: 0.002, tier: 'rare' },
  ],
  copper_cave: [
    { toolId: 'iron_speed_pickaxe', rate: 0.010, tier: 'normal' },
    { toolId: 'iron_yield_pickaxe', rate: 0.010, tier: 'normal' },
    { toolId: 'iron_combo_pickaxe', rate: 0.008, tier: 'normal' },
  ],
  iron_mine: [
    { toolId: 'iron_speed_pickaxe', rate: 0.010, tier: 'normal' },
    { toolId: 'iron_yield_pickaxe', rate: 0.010, tier: 'normal' },
    { toolId: 'iron_rare_pickaxe',  rate: 0.005, tier: 'rare'   },
    { toolId: 'iron_efficiency_pickaxe', rate: 0.008, tier: 'normal' },
  ],
  gold_vein: [
    { toolId: 'gold_speed_pickaxe', rate: 0.010, tier: 'normal' },
    { toolId: 'gold_rare_pickaxe',  rate: 0.005, tier: 'rare'   },
    { toolId: 'gold_efficiency_pickaxe', rate: 0.008, tier: 'normal' },
    { toolId: 'gold_yield_pickaxe', rate: 0.010, tier: 'normal' },
    { toolId: 'gold_combo_pickaxe', rate: 0.010, tier: 'normal' },
  ],
  mythril_depth: [
    { toolId: 'mythril_speed_pickaxe', rate: 0.008, tier: 'normal' },
    { toolId: 'mythril_yield_pickaxe', rate: 0.008, tier: 'normal' },
    { toolId: 'mythril_rare_pickaxe',  rate: 0.003, tier: 'rare'   },
    { toolId: 'mythril_combo_pickaxe', rate: 0.003, tier: 'rare'   },
    { toolId: 'mythril_efficiency_pickaxe', rate: 0.005, tier: 'normal' },
  ],

  // ============================================================
  // 伐採系ノード
  // ============================================================
  beginner_forest: [
    { toolId: 'wood_speed_axe',      rate: 0.010, tier: 'normal' },
    { toolId: 'wood_yield_axe',      rate: 0.010, tier: 'normal' },
    { toolId: 'wood_efficiency_axe', rate: 0.008, tier: 'normal' },
    { toolId: 'wood_speed_pickaxe',  rate: 0.010, tier: 'normal' },
    { toolId: 'wood_yield_pickaxe',  rate: 0.010, tier: 'normal' },
    { toolId: 'wood_rare_pickaxe',   rate: 0.002, tier: 'rare'   },
    { toolId: 'wood_combo_pickaxe',  rate: 0.010, tier: 'normal' },
    { toolId: 'wood_efficiency_pickaxe', rate: 0.008, tier: 'normal' },
    { toolId: 'wood_rare_axe',       rate: 0.002, tier: 'rare'   },
    { toolId: 'wood_combo_axe',      rate: 0.010, tier: 'normal' },
  ],
  dense_forest: [
    { toolId: 'stone_speed_axe',     rate: 0.010, tier: 'normal' },
    { toolId: 'stone_yield_axe',     rate: 0.010, tier: 'normal' },
    { toolId: 'stone_combo_axe',     rate: 0.008, tier: 'normal' },
    { toolId: 'stone_rare_axe',      rate: 0.002, tier: 'rare'   },
    { toolId: 'stone_efficiency_axe',rate: 0.010, tier: 'normal' },
  ],
  ancient_forest: [
    { toolId: 'iron_speed_axe',      rate: 0.010, tier: 'normal' },
    { toolId: 'iron_yield_axe',      rate: 0.010, tier: 'normal' },
    { toolId: 'gold_rare_axe',       rate: 0.003, tier: 'rare'   },
    { toolId: 'gold_efficiency_axe', rate: 0.005, tier: 'rare'   },
    { toolId: 'iron_rare_axe',       rate: 0.002, tier: 'rare'   },
    { toolId: 'iron_combo_axe',      rate: 0.010, tier: 'normal' },
    { toolId: 'iron_efficiency_axe', rate: 0.010, tier: 'normal' },
    { toolId: 'gold_speed_axe',      rate: 0.010, tier: 'normal' },
    { toolId: 'gold_yield_axe',      rate: 0.010, tier: 'normal' },
    { toolId: 'gold_combo_axe',      rate: 0.010, tier: 'normal' },
  ],
  cursed_woods: [
    { toolId: 'mythril_speed_axe',       rate: 0.008, tier: 'normal' },
    { toolId: 'mythril_rare_axe',        rate: 0.003, tier: 'rare'   },
    { toolId: 'mythril_combo_axe',       rate: 0.003, tier: 'rare'   },
    { toolId: 'mythril_efficiency_axe',  rate: 0.003, tier: 'rare'   },
    { toolId: 'mythril_yield_axe',       rate: 0.008, tier: 'normal' },
  ],

  // ============================================================
  // 時間帯限定
  // ============================================================
  morning_any: [
    { toolId: 'morning_boost', rate: 0.008, tier: 'rare'    },
    { toolId: 'morning_combo', rate: 0.008, tier: 'rare'    },
  ],
  daytime_any: [
    { toolId: 'day_boost',     rate: 0.008, tier: 'rare'    },
    { toolId: 'midday_stamina',rate: 0.005, tier: 'rare'    },
  ],
  evening_any: [
    { toolId: 'evening_boost', rate: 0.008, tier: 'rare'    },
    { toolId: 'evening_yield', rate: 0.008, tier: 'rare'    },
  ],
  night_any: [
    { toolId: 'night_boost',    rate: 0.008, tier: 'rare'   },
    { toolId: 'night_rare',     rate: 0.005, tier: 'rare'   },
    { toolId: 'deepnight_super',rate: 0.001, tier: 'special'},
    { toolId: 'time_adaptive',  rate: 0.005, tier: 'rare'   },
  ],

  // ============================================================
  // 天候限定
  // ============================================================
  rain_any: [
    { toolId: 'rain_yield',    rate: 0.008, tier: 'rare'    },
    { toolId: 'rain_speed',    rate: 0.008, tier: 'rare'    },
    { toolId: 'humidity_bonus',rate: 0.005, tier: 'rare'    },
    { toolId: 'weather_adaptive', rate: 0.005, tier: 'rare' },
  ],
  thunder_any: [
    { toolId: 'thunder_rare',  rate: 0.005, tier: 'rare'    },
    { toolId: 'thunder_extra', rate: 0.005, tier: 'rare'    },
    { toolId: 'storm_risk',    rate: 0.002, tier: 'special' },
    { toolId: 'chaos_weather', rate: 0.005, tier: 'rare'    },
  ],
  fog_any: [
    { toolId: 'fog_bonus',     rate: 0.008, tier: 'rare'    },
    { toolId: 'wind_combo',    rate: 0.005, tier: 'rare'    },
  ],

  // ============================================================
  // コンボ限定
  // ============================================================
  combo_5: [
    { toolId: 'combo_plus',    rate: 0.010, tier: 'normal'  },
    { toolId: 'combo_keep',    rate: 0.010, tier: 'normal'  },
    { toolId: 'combo_recover', rate: 0.010, tier: 'normal'  },
  ],
  combo_10: [
    { toolId: 'combo_double',    rate: 0.005, tier: 'rare'  },
    { toolId: 'combo_stable',    rate: 0.005, tier: 'rare'  },
    { toolId: 'combo_boost_low', rate: 0.005, tier: 'rare'  },
  ],
  combo_20: [
    { toolId: 'combo_explosion', rate: 0.002, tier: 'special'},
    { toolId: 'combo_no_decay',  rate: 0.002, tier: 'special'},
    { toolId: 'combo_master',    rate: 0.001, tier: 'special'},
    { toolId: 'combo_gamble',    rate: 0.001, tier: 'special'},
  ],

  // ============================================================
  // 危険ノード
  // ============================================================
  danger_node: [
    { toolId: 'danger_spawn', rate: 0.005, tier: 'rare'   },
    { toolId: 'risk_reduce',  rate: 0.005, tier: 'rare'   },
    { toolId: 'safe_mode',    rate: 0.005, tier: 'rare'   },
    { toolId: 'curse_resist', rate: 0.003, tier: 'rare'   },
  ],
  danger_success: [
    { toolId: 'danger_null',  rate: 0.003, tier: 'special'},
    { toolId: 'life_steal',   rate: 0.002, tier: 'special'},
    { toolId: 'hp_convert',   rate: 0.002, tier: 'special'},
    { toolId: 'no_penalty',   rate: 0.002, tier: 'special'},
    { toolId: 'risk_amplify', rate: 0.001, tier: 'special'},
    { toolId: 'insane_bonus', rate: 0.001, tier: 'special'},
  ],

  // ============================================================
  // 隠し・収集
  // ============================================================
  hidden_node: [
    { toolId: 'discover_boost', rate: 0.0005, tier: 'special'},
    { toolId: 'first_bonus',    rate: 0.0005, tier: 'special'},
    { toolId: 'random_extreme', rate: 0.0005, tier: 'special'},
    { toolId: 'perfect_stable', rate: 0.0002, tier: 'special'},
  ],
  collection_reward: [
    { toolId: 'collection_bonus', rate: 0.0005, tier: 'special'},
    { toolId: 'daily_legend',     rate: 0.0002, tier: 'special'},
  ],
};

// ============================================================
// ガチャ排出テーブル（既存GACHAに追加）
// ============================================================
export const TOOL_GACHA_TABLE = [
  // 通常ツール 70%
  { toolId: 'stone_speed_pickaxe', rate: 0.070, rarity: '通常' },
  { toolId: 'stone_yield_axe',     rate: 0.070, rarity: '通常' },
  { toolId: 'iron_speed_pickaxe',  rate: 0.070, rarity: '通常' },
  { toolId: 'iron_yield_axe',      rate: 0.070, rarity: '通常' },
  { toolId: 'gold_speed_pickaxe',  rate: 0.070, rarity: '通常' },
  { toolId: 'gold_efficiency_axe', rate: 0.070, rarity: '通常' },
  { toolId: 'mythril_speed_pickaxe', rate: 0.070, rarity: '通常' },
  { toolId: 'mythril_yield_axe',   rate: 0.070, rarity: '通常' },
  { toolId: 'iron_combo_pickaxe',  rate: 0.070, rarity: '通常' },
  { toolId: 'mythril_efficiency_pickaxe', rate: 0.070, rarity: '通常' },
  // レアツール 25%
  { toolId: 'night_boost',         rate: 0.050, rarity: 'レア' },
  { toolId: 'rain_yield',          rate: 0.050, rarity: 'レア' },
  { toolId: 'combo_double',        rate: 0.050, rarity: 'レア' },
  { toolId: 'mythril_rare_pickaxe',rate: 0.050, rarity: 'レア' },
  { toolId: 'gold_rare_axe',       rate: 0.050, rarity: 'レア' },
  // 特殊ツール 5%（dungeon_gacha専用ツール）
  { toolId: 'double_drop',         rate: 0.0125, rarity: '特殊' },
  { toolId: 'copy_drop',           rate: 0.0125, rarity: '特殊' },
  { toolId: 'time_scale',          rate: 0.0125, rarity: '特殊' },
  { toolId: 'low_stamina_boost',   rate: 0.0125, rarity: '特殊' },
];

// ============================================================
// クラフトレシピ（採取ツール専用）
// ============================================================
export interface ToolCraftRecipe {
  toolId: string;
  pattern: (string | null)[];  // 9要素
  requiredUnlockId: string | null;
}

// pattern内は ITEM_MASTER のキー名を使用（handle / rare_gem / combo_core / energy_core / mythril_ore / time_fragment 含む）
export const TOOL_CRAFT_RECIPES: ToolCraftRecipe[] = [
  // ■ 木ツール
  { toolId: 'wood_speed_pickaxe',
    pattern: ['wood','wood','wood', null,'handle',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'wood_speed_axe',
    pattern: ['wood','wood',null, 'wood','handle',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'wood_yield_pickaxe',
    pattern: ['wood','wood','wood', null,'wood',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'wood_yield_axe',
    pattern: ['wood','wood',null, 'wood','wood',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'wood_rare_pickaxe',
    pattern: ['wood','wood','wood', null,'rare_gem',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'wood_rare_axe',
    pattern: ['wood','wood',null, 'wood','rare_gem',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'wood_combo_pickaxe',
    pattern: ['wood','wood','wood', null,'combo_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'wood_combo_axe',
    pattern: ['wood','wood',null, 'wood','combo_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'wood_efficiency_pickaxe',
    pattern: ['wood','wood','wood', null,'energy_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'wood_efficiency_axe',
    pattern: ['wood','wood',null, 'wood','energy_core',null, null,'handle',null],
    requiredUnlockId: null },

  // ■ 石ツール
  { toolId: 'stone_speed_pickaxe',
    pattern: ['stone','stone','stone', null,'handle',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'stone_speed_axe',
    pattern: ['stone','stone',null, 'stone','handle',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'stone_yield_pickaxe',
    pattern: ['stone','stone','stone', null,'stone',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'stone_yield_axe',
    pattern: ['stone','stone',null, 'stone','stone',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'stone_rare_pickaxe',
    pattern: ['stone','stone','stone', null,'rare_gem',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'stone_rare_axe',
    pattern: ['stone','stone',null, 'stone','rare_gem',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'stone_combo_pickaxe',
    pattern: ['stone','stone','stone', null,'combo_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'stone_combo_axe',
    pattern: ['stone','stone',null, 'stone','combo_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'stone_efficiency_pickaxe',
    pattern: ['stone','stone','stone', null,'energy_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'stone_efficiency_axe',
    pattern: ['stone','stone',null, 'stone','energy_core',null, null,'handle',null],
    requiredUnlockId: null },

  // ■ 鉄ツール
  { toolId: 'iron_speed_pickaxe',
    pattern: ['iron_ore','iron_ore','iron_ore', null,'handle',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'iron_speed_axe',
    pattern: ['iron_ore','iron_ore',null, 'iron_ore','handle',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'iron_yield_pickaxe',
    pattern: ['iron_ore','iron_ore','iron_ore', null,'iron_ore',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'iron_yield_axe',
    pattern: ['iron_ore','iron_ore',null, 'iron_ore','iron_ore',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'iron_rare_pickaxe',
    pattern: ['iron_ore','iron_ore','iron_ore', null,'rare_gem',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'iron_rare_axe',
    pattern: ['iron_ore','iron_ore',null, 'iron_ore','rare_gem',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'iron_combo_pickaxe',
    pattern: ['iron_ore','iron_ore','iron_ore', null,'combo_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'iron_combo_axe',
    pattern: ['iron_ore','iron_ore',null, 'iron_ore','combo_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'iron_efficiency_pickaxe',
    pattern: ['iron_ore','iron_ore','iron_ore', null,'energy_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'iron_efficiency_axe',
    pattern: ['iron_ore','iron_ore',null, 'iron_ore','energy_core',null, null,'handle',null],
    requiredUnlockId: null },

  // ■ 金ツール
  { toolId: 'gold_speed_pickaxe',
    pattern: ['gold_ore','gold_ore','gold_ore', null,'handle',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'gold_speed_axe',
    pattern: ['gold_ore','gold_ore',null, 'gold_ore','handle',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'gold_yield_pickaxe',
    pattern: ['gold_ore','gold_ore','gold_ore', null,'gold_ore',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'gold_yield_axe',
    pattern: ['gold_ore','gold_ore',null, 'gold_ore','gold_ore',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'gold_rare_pickaxe',
    pattern: ['gold_ore','gold_ore','gold_ore', null,'rare_gem',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'gold_rare_axe',
    pattern: ['gold_ore','gold_ore',null, 'gold_ore','rare_gem',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'gold_combo_pickaxe',
    pattern: ['gold_ore','gold_ore','gold_ore', null,'combo_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'gold_combo_axe',
    pattern: ['gold_ore','gold_ore',null, 'gold_ore','combo_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'gold_efficiency_pickaxe',
    pattern: ['gold_ore','gold_ore','gold_ore', null,'energy_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'gold_efficiency_axe',
    pattern: ['gold_ore','gold_ore',null, 'gold_ore','energy_core',null, null,'handle',null],
    requiredUnlockId: null },

  // ■ ミスリルツール
  { toolId: 'mythril_speed_pickaxe',
    pattern: ['mythril_ore','mythril_ore','mythril_ore', null,'handle',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'mythril_speed_axe',
    pattern: ['mythril_ore','mythril_ore',null, 'mythril_ore','handle',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'mythril_yield_pickaxe',
    pattern: ['mythril_ore','mythril_ore','mythril_ore', null,'mythril_ore',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'mythril_yield_axe',
    pattern: ['mythril_ore','mythril_ore',null, 'mythril_ore','mythril_ore',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'mythril_rare_pickaxe',
    pattern: ['mythril_ore','mythril_ore','mythril_ore', null,'rare_gem',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'mythril_rare_axe',
    pattern: ['mythril_ore','mythril_ore',null, 'mythril_ore','rare_gem',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'mythril_combo_pickaxe',
    pattern: ['mythril_ore','mythril_ore','mythril_ore', null,'combo_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'mythril_combo_axe',
    pattern: ['mythril_ore','mythril_ore',null, 'mythril_ore','combo_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'mythril_efficiency_pickaxe',
    pattern: ['mythril_ore','mythril_ore','mythril_ore', null,'energy_core',null, null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'mythril_efficiency_axe',
    pattern: ['mythril_ore','mythril_ore',null, 'mythril_ore','energy_core',null, null,'handle',null],
    requiredUnlockId: null },

  // ■ クラフト専用特殊ツール (crafting_only)
  { toolId: 'double_drop',
    pattern: ['rare_gem','gold_ore','rare_gem', 'gold_ore','combo_core','gold_ore', null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'copy_drop',
    pattern: ['rare_gem','mythril_ore','rare_gem', 'mythril_ore','combo_core','mythril_ore', null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'time_scale',
    pattern: ['time_fragment','mythril_ore','time_fragment', 'mythril_ore','energy_core','mythril_ore', null,'handle',null],
    requiredUnlockId: null },
  { toolId: 'low_stamina_boost',
    pattern: ['energy_core','iron_ore','energy_core', 'iron_ore','rare_gem','iron_ore', null,'handle',null],
    requiredUnlockId: null },
];

// クラフト専用ツールID一覧
export const CRAFTING_ONLY_TOOL_IDS = new Set([
  'double_drop',
  'copy_drop',
  'time_scale',
  'low_stamina_boost',
]);

// ============================================================
// ノードID → ドロップソースID マッピング
// GatherNodeのidからTOOL_DROP_TABLESのキーを解決する
// ============================================================
export const NODE_TO_DROP_SOURCE: Record<string, string[]> = {
  // 採掘系（GatherNodeMasterのIDに対応）
  stone_vein:   ['stone_quarry'],
  granite_vein: ['stone_quarry'],
  copper_vein:  ['copper_cave'],
  iron_vein:    ['iron_mine'],
  gold_vein:    ['gold_vein'],
  mythril_vein: ['mythril_depth'],
  // 伐採系
  pine_tree:    ['beginner_forest'],
  birch_tree:   ['beginner_forest'],
  oak_tree:     ['dense_forest'],
  jungle_tree:  ['dense_forest'],
  dark_oak_tree:['ancient_forest'],
  ancient_tree: ['ancient_forest', 'hidden_node'],
  cursed_tree:  ['cursed_woods'],
  // 汎用フォールバック（mining/woodcutting全体）
  _mining_fallback:     ['stone_quarry'],
  _woodcutting_fallback:['beginner_forest'],
};

// ============================================================
// 条件解放定義
// ============================================================
export interface ToolUnlockCondition {
  id: string;
  label: string;
  description: string;
  checkFn: (stats: ToolAcquisitionStats) => boolean;
  unlocksGroup: string[]; // 解放されるtoolId一覧
}

export interface ToolAcquisitionStats {
  totalGatherCount: number;
  maxCombo: number;
  nightGatherCount: number;
  rainGatherCount: number;
  dangerSuccessCount: number;
}

export const TOOL_UNLOCK_CONDITIONS: ToolUnlockCondition[] = [
  {
    id: 'unlock_basic',
    label: '採取100回達成',
    description: '採取を合計100回行うと基本ツール系が解放されます。',
    checkFn: (s) => s.totalGatherCount >= 100,
    unlocksGroup: [
      'stone_speed_pickaxe','stone_yield_pickaxe','stone_efficiency_pickaxe',
      'stone_speed_axe','stone_yield_axe','stone_efficiency_axe',
      'iron_speed_pickaxe','iron_yield_pickaxe','iron_efficiency_pickaxe',
      'iron_speed_axe','iron_yield_axe','iron_efficiency_axe',
    ],
  },
  {
    id: 'unlock_combo',
    label: 'コンボ20達成',
    description: '採取コンボを20回以上繋げると コンボ系ツールが解放されます。',
    checkFn: (s) => s.maxCombo >= 20,
    unlocksGroup: [
      'combo_plus','combo_keep','combo_explosion','combo_no_decay','combo_double',
      'combo_recover','combo_stable','combo_gamble','combo_boost_low','combo_master',
    ],
  },
  {
    id: 'unlock_night',
    label: '夜採取50回達成',
    description: '夜間（22時〜4時）に採取を50回行うと 夜系ツールが解放されます。',
    checkFn: (s) => s.nightGatherCount >= 50,
    unlocksGroup: [
      'night_boost','night_rare','deepnight_super',
    ],
  },
  {
    id: 'unlock_rain',
    label: '雨採取50回達成',
    description: '雨天時に採取を50回行うと 雨系ツールが解放されます。',
    checkFn: (s) => s.rainGatherCount >= 50,
    unlocksGroup: [
      'rain_yield','rain_speed','humidity_bonus',
      'thunder_rare','thunder_extra','storm_risk',
      'fog_bonus','wind_combo',
    ],
  },
  {
    id: 'unlock_danger',
    label: '危険ノード成功10回達成',
    description: '危険ノードの採取に10回成功すると 危険系ツールが解放されます。',
    checkFn: (s) => s.dangerSuccessCount >= 10,
    unlocksGroup: [
      'danger_null','life_steal','hp_convert','no_penalty',
      'risk_amplify','insane_bonus','danger_spawn','risk_reduce','safe_mode','curse_resist',
    ],
  },
];

// ============================================================
// 時間帯判定ユーティリティ
// ============================================================
export type TimeOfDay = 'morning' | 'daytime' | 'evening' | 'night';

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'daytime';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

// 夜判定（22時〜4時）
export function isNightTime(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 4;
}

// ダミー天候（将来的に本実装可能）
export type Weather = 'clear' | 'rain' | 'thunder' | 'fog';
export function getCurrentWeather(): Weather {
  // 現在はランダムシード（将来にリアル天候連携可能）
  const seed = Math.floor(Date.now() / (1000 * 60 * 30)); // 30分ごとに変わる
  const r = (seed * 2654435761) % 100;
  if (r < 60) return 'clear';
  if (r < 80) return 'rain';
  if (r < 90) return 'thunder';
  return 'fog';
}

// ============================================================
// ツールドロップ判定メイン関数
// ============================================================
export interface ToolDropResult {
  toolId: string;
  source: string;
  tier: 'normal' | 'rare' | 'special';
}

export function rollToolDrop(params: {
  nodeId: string;
  skillId: 'mining' | 'woodcutting';
  combo: number;
  rareMultiplier: number;
  unlockedToolIds: Set<string>;
  ownedToolIds: Set<string>;
}): ToolDropResult | null {
  const { nodeId, skillId, combo, rareMultiplier, unlockedToolIds } = params;

  // 1. 適用するドロップソース一覧を構築
  const sources: string[] = [];

  // ノード固有
  const nodeSources = NODE_TO_DROP_SOURCE[nodeId] ?? [
    skillId === 'mining' ? '_mining_fallback' : '_woodcutting_fallback',
  ];
  sources.push(...nodeSources);

  // 時間帯
  const tod = getTimeOfDay();
  sources.push(`${tod}_any`);

  // 天候
  const weather = getCurrentWeather();
  if (weather !== 'clear') sources.push(`${weather}_any`);

  // コンボ
  if (combo >= 20) sources.push('combo_20');
  else if (combo >= 10) sources.push('combo_10');
  else if (combo >= 5)  sources.push('combo_5');

  // 隠しノード（低確率でany時に追加）
  if (Math.random() < 0.05) sources.push('hidden_node');

  // 2. 全エントリを収集（優先度：special > rare > normal）
  const allEntries: (ToolDropEntry & { source: string })[] = [];
  for (const src of sources) {
    const table = TOOL_DROP_TABLES[src];
    if (!table) continue;
    for (const entry of table) {
      // 未解放ツールは条件解放が必要なもの以外除外しない（ドロップ=解放）
      // 解放条件があるToolはunlockedToolIdsで管理
      if (!isToolDroppable(entry.toolId, unlockedToolIds)) continue;
      allEntries.push({ ...entry, source: src });
    }
  }

  // 優先度ソート：special > rare > normal
  const tierPriority = { special: 0, rare: 1, normal: 2 };
  allEntries.sort((a, b) => tierPriority[a.tier] - tierPriority[b.tier]);

  // 3. 抽選（レア倍率適用）
  for (const entry of allEntries) {
    const adjustedRate = entry.rate * rareMultiplier * (1 + combo * 0.001);
    if (Math.random() < adjustedRate) {
      return { toolId: entry.toolId, source: entry.source, tier: entry.tier };
    }
  }

  return null;
}

// 条件解放が必要なツールかどうかを判定
function isToolDroppable(toolId: string, unlockedToolIds: Set<string>): boolean {
  // クラフト専用ツールはドロップしない
  if (CRAFTING_ONLY_TOOL_IDS.has(toolId)) return false;

  // 解放条件があるツールグループ
  const comboGroup = ['combo_explosion','combo_no_decay','combo_master','combo_gamble','combo_double','combo_stable','combo_boost_low'];
  const nightGroup = ['night_boost','night_rare','deepnight_super'];
  const rainGroup  = ['rain_yield','rain_speed','humidity_bonus','thunder_rare','thunder_extra','storm_risk','fog_bonus','wind_combo'];
  const dangerGroup= ['danger_null','life_steal','hp_convert','no_penalty','risk_amplify','insane_bonus'];

  if (comboGroup.includes(toolId) && !unlockedToolIds.has('unlock_combo')) return false;
  if (nightGroup.includes(toolId)  && !unlockedToolIds.has('unlock_night')) return false;
  if (rainGroup.includes(toolId)   && !unlockedToolIds.has('unlock_rain'))  return false;
  if (dangerGroup.includes(toolId) && !unlockedToolIds.has('unlock_danger'))return false;

  return true;
}
