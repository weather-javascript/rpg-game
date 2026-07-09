// src/data/gemDungeon.ts
// 深穿晶窟 リシュカ — 宝石採掘場ダンジョン定義
// tier: 'gemraid' / 火山40フロアの4/5 = 40フロア / ボスのみ異様に強い
// 入場: 強化ダイヤクレート×10 → NPC納品 → 入場証

import type { DungeonMaster, DungeonArea, MonsterMaster } from '../types/game';
import type { MoveBehavior } from '../types/position';

// ============================================================
// 新モンスター定義
// ============================================================
// moveBehavior is stored separately; GEM_MONSTERS satisfies MonsterMaster shape
export const GEM_MONSTERS: Record<string, MonsterMaster & { moveBehavior: MoveBehavior }> = {

  // ─── 第1層：採掘坑道 ───
  crystal_slime: {
    id:'crystal_slime', name:'クリスタルスライム', description:'宝石の欠片を体内に取り込んだスライム。弱いが宝石素材を確定ドロップ。',
    icon:'gem', maxHp:600, attack:80, defense:20, baseExp:100, baseGold:80,
    dungeonIds:['gem_mine'], isBoss:false, moveBehavior:'aggressive',
    drops:[
      { itemId:'ffggr_green_frag', baseRate:1.0, minAmount:1, maxAmount:1 },
      { itemId:'ffggr_blue_frag', baseRate:0.3, minAmount:1, maxAmount:1 },
    ],
  },

  mining_golem: {
    id:'mining_golem', name:'鉱山守衛ゴーレム', description:'採掘坑道の守衛ゴーレム。物理耐性が高く貫通攻撃が有効。動きが遅い。',
    icon:'rock', maxHp:2000, attack:150, defense:300, baseExp:180, baseGold:120,
    defensePct:0.4,
    dungeonIds:['gem_mine'], moveBehavior:'static',
    drops:[
      { itemId:'ffggr_green_frag', baseRate:0.6, minAmount:2, maxAmount:2 },
      { itemId:'ffggr_area_e', baseRate:0.12, minAmount:1, maxAmount:1 },
    ],
    traits:['物理耐性40%','貫通有効','低速'],
    skills:['岩盤防御'],
    effectiveAttack:150,
  },

  mining_bomb_bug: {
    id:'mining_bomb_bug', name:'採掘爆弾虫', description:'体内に爆薬を蓄えた虫。HPが低いと自爆して全体ダメージ。先に倒すのが鉄則。',
    icon:'explosion', maxHp:400, attack:200, defense:10, baseExp:150, baseGold:100,
    dungeonIds:['gem_mine'], moveBehavior:'aggressive',
    specialAttack:'自爆（HP30%以下で発動・全体600ダメージ）',
    drops:[
      { itemId:'ffggr_area_e', baseRate:0.15, minAmount:1, maxAmount:1 },
    ],
    traits:['自爆','先制処理推奨'],
  },

  crystal_moth: {
    id:'crystal_moth', name:'水晶蛾', description:'宝石の粉末を翅から散らす蛾。防御デバフ付与が厄介。遠距離タイプ。',
    icon:'sparkle', maxHp:800, attack:120, defense:40, baseExp:130, baseGold:90,
    dungeonIds:['gem_mine'], moveBehavior:'ranged',
    specialAttack:'鱗粉（防御30%ダウン・3ターン）',
    drops:[
      { itemId:'ffggr_green_crystal', baseRate:0.15, minAmount:1, maxAmount:1 },
      { itemId:'ffggr_blue_frag', baseRate:0.4, minAmount:1, maxAmount:1 },
    ],
    traits:['遠距離','防御デバフ'],
  },

  // ─── 第2層：地下神殿遺構 ───
  ruins_guardian: {
    id:'ruins_guardian', name:'遺跡の番人', description:'古代遺跡を守護するゴーレム。石化攻撃と拘束が厄介。近接型で突進してくる。',
    icon:'fortress', maxHp:4500, attack:280, defense:180, baseExp:350, baseGold:280,
    dungeonIds:['gem_mine'], moveBehavior:'aggressive',
    specialAttack:'石化拘束（2ターン行動不能・50%発動）',
    drops:[
      { itemId:'ffggr_blue_frag', baseRate:0.6, minAmount:2, maxAmount:2 },
      { itemId:'ffggr_blue_crystal', baseRate:0.15, minAmount:1, maxAmount:1 },
    ],
    traits:['石化攻撃','拘束'],
  },

  seal_crystal: {
    id:'seal_crystal', name:'封印結晶体', description:'ギミック敵。これを倒すと封印が解除されて先へ進める。攻撃は弱いが頑丈。',
    icon:'gem_blue', maxHp:5000, attack:50, defense:100, baseExp:200, baseGold:50,
    dungeonIds:['gem_mine'], moveBehavior:'static',
    drops:[
      { itemId:'ffggr_blue_crystal', baseRate:0.5, minAmount:1, maxAmount:1 },
      { itemId:'ffggr_red_frag', baseRate:0.25, minAmount:1, maxAmount:1 },
    ],
    traits:['封印解除','固定','攻撃力低'],
  },

  gem_golem_mk2: {
    id:'gem_golem_mk2', name:'宝石ゴーレムMk.Ⅱ', description:'4色の宝石属性を順番に使う改良型ゴーレム。毎ターン使う属性が変わり弱点も変わる。',
    icon:'gem', maxHp:8000, attack:320, defense:200, baseExp:500, baseGold:400,
    dungeonIds:['gem_mine'], moveBehavior:'static',
    specialAttack:'属性輪転（毎ターン緑→青→赤→黄→緑のサイクルで属性攻撃）',
    drops:[
      { itemId:'ffggr_red_frag', baseRate:0.5, minAmount:2, maxAmount:2 },
      { itemId:'ffggr_blue_crystal', baseRate:0.2, minAmount:1, maxAmount:1 },
      { itemId:'ffggr_area_e2', baseRate:0.05, minAmount:1, maxAmount:1 },
    ],
    traits:['4色属性輪転','弱点変化'],
    effectiveAttack:320,
  },

  rainbow_jellyfish: {
    id:'rainbow_jellyfish', name:'虹色クラゲ', description:'光を屈折させる虹色のクラゲ。回復持ちで逆ヒールもある。遠距離型で近づかない。',
    icon:'sparkle', maxHp:3500, attack:180, defense:60, baseExp:300, baseGold:250,
    dungeonIds:['gem_mine'], moveBehavior:'evasive',
    specialAttack:'逆ヒール（ダメージ→HP変換・40%発動）',
    drops:[
      { itemId:'ffggr_blue_frag', baseRate:0.5, minAmount:2, maxAmount:2 },
      { itemId:'ffggr_red_frag', baseRate:0.3, minAmount:1, maxAmount:1 },
      { itemId:'ffggr_blue_crystal', baseRate:0.15, minAmount:1, maxAmount:1 },
    ],
    traits:['回復持ち','逆ヒール','逃走型'],
  },

  // ─── 第3層：宝石龍の巣穴 ───
  dragon_kin_green: {
    id:'dragon_kin_green', name:'龍の眷属（緑）', description:'緑の宝石龍の眷属。猛毒付与とHP吸収が特徴。近距離型で突進してくる。',
    icon:'gem', maxHp:8000, attack:450, defense:200, baseExp:600, baseGold:500,
    dungeonIds:['gem_mine'], moveBehavior:'aggressive',
    specialAttack:'猛毒爪（毒3ターン・毎ターン200ダメ）',
    drops:[
      { itemId:'ffggr_green_crystal', baseRate:0.6, minAmount:2, maxAmount:2 },
      { itemId:'ffggr_green_gem', baseRate:0.1, minAmount:1, maxAmount:1 },
      { itemId:'gem_dragon_scale', baseRate:0.15, minAmount:1, maxAmount:1 },
    ],
  },

  dragon_kin_blue: {
    id:'dragon_kin_blue', name:'龍の眷属（青）', description:'青の宝石龍の眷属。氷結付与と遠距離吐息攻撃。飛行で近接が届きにくい。',
    icon:'gem_blue', maxHp:8000, attack:500, defense:180, baseExp:600, baseGold:500,
    dungeonIds:['gem_mine'], moveBehavior:'flying',
    specialAttack:'氷結吐息（氷結2ターン行動不能・全体攻撃）',
    drops:[
      { itemId:'ffggr_blue_crystal', baseRate:0.6, minAmount:2, maxAmount:2 },
      { itemId:'ffggr_blue_gem', baseRate:0.1, minAmount:1, maxAmount:1 },
      { itemId:'gem_dragon_scale', baseRate:0.15, minAmount:1, maxAmount:1 },
    ],
    traits:['飛行','近接無効（貫通有効）'],
  },

  dragon_kin_red: {
    id:'dragon_kin_red', name:'龍の眷属（赤）', description:'赤の宝石龍の眷属。燃焼付与と自己強化。HP50%以下で怒り覚醒して超危険。',
    icon:'gem', maxHp:9000, attack:600, defense:220, baseExp:700, baseGold:600,
    dungeonIds:['gem_mine'], moveBehavior:'aggressive',
    specialAttack:'炎の怒り（HP50%以下で攻撃力2倍・燃焼3ターン付与）',
    drops:[
      { itemId:'ffggr_red_crystal', baseRate:0.5, minAmount:2, maxAmount:2 },
      { itemId:'ffggr_red_gem', baseRate:0.1, minAmount:1, maxAmount:1 },
      { itemId:'gem_dragon_scale', baseRate:0.15, minAmount:1, maxAmount:1 },
    ],
    effectiveAttack:600,
  },

  dragon_kin_yellow: {
    id:'dragon_kin_yellow', name:'龍の眷属（黄）', description:'黄の宝石龍の眷属。麻痺付与と超高防御。ゆっくりした動きで油断を誘う。',
    icon:'gem', maxHp:10000, attack:400, defense:400, baseExp:700, baseGold:600,
    dungeonIds:['gem_mine'], moveBehavior:'static',
    specialAttack:'麻痺の鱗（麻痺2ターン行動不能・全体攻撃・30%発動）',
    drops:[
      { itemId:'ffggr_yellow_crystal', baseRate:0.4, minAmount:1, maxAmount:1 },
      { itemId:'ffggr_yellow_gem', baseRate:0.08, minAmount:1, maxAmount:1 },
      { itemId:'gem_dragon_scale', baseRate:0.2, minAmount:1, maxAmount:1 },
    ],
    defensePct:0.5,
    traits:['超高防御','麻痺付与','貫通推奨'],
  },

  // ─── ボス：宝石龍 クリスタリス ───
  crystallis: {
    id:'crystallis', name:'宝石龍 クリスタリス', description:'四色の宝石を身にまとう宝石龍の王。HP200,000の異様な体力とフェーズ制の攻撃パターンが恐怖。開催値3000で出現。ソロ前提だが協力者がいると有利。',
    icon:'gem_blue', maxHp:200000, attack:1800, defense:500, baseExp:50000, baseGold:100000,
    dungeonIds:['gem_mine'], isBoss:true, moveBehavior:'circling',
    specialAttack:'フェーズ制（HP75%/50%/25%で技セット変化・最終フェーズで物理無効3T）',
    defensePct:0.3,
    effectiveAttack:1800,
    drops:[
      { itemId:'ffggr_green_jewel', baseRate:0.05, minAmount:1, maxAmount:1 },  // 5%
      { itemId:'ffggr_blue_jewel', baseRate:0.05, minAmount:1, maxAmount:1 },  // 5%
      { itemId:'ffggr_red_jewel', baseRate:0.03, minAmount:1, maxAmount:1 },  // 3%
      { itemId:'ffggr_yellow_jewel', baseRate:0.02, minAmount:1, maxAmount:1 },  // 2%
      { itemId:'gem_dragon_scale', baseRate:0.15, minAmount:3, maxAmount:3 },  // 15%
      { itemId:'rainbow_jewel', baseRate:0.01, minAmount:1, maxAmount:1 },  // 1%・虹輝石
      { itemId:'gem_mine_map', baseRate:0.30, minAmount:1, maxAmount:1 },  // 30%
    ],
    traits:[
      'HP200,000','フェーズ制（4段階）',
      '75%以下：物理30%軽減追加','50%以下：攻撃力2倍バフ',
      '25%以下：3ターン物理無効＋自己回復5%',
      'ボスのみ異様に強い',
    ],
    skills:[
      '宝石の爪（2連撃）',
      '光輝の吐息（全体＋防御低下2T）',
      '七色乱射（4色ランダム×4貫通）',
      '龍眷属召喚',
      '宝石崩壊波（超全体＋毒3T）',
      '七色の逆鱗（攻撃2倍バフ3T）',
      '滅光の咆哮（全デバフ＋大ダメ）',
      '最終覚醒（物理無効3T＋攻撃3倍＋HP5%回復）',
    ],
  },
};

// ============================================================
// エリア定義ヘルパー
// ============================================================
type AreaOpts = {
  name: string; desc: string;
  monsters: { id: string; count: number; isMidBoss?: boolean }[];
  turns: number;
  isCheckpoint?: boolean; cpLabel?: string;
  isHardArea?: boolean;
  isBranchPoint?: boolean;
  eventRate?: number;
};

function area(o: AreaOpts): DungeonArea {
  return {
    name: o.name,
    description: o.desc,
    monsters: o.monsters.map(m => ({ monsterId: m.id, count: m.count, isMidBoss: m.isMidBoss })),
    turns: o.turns,
    isCheckpoint: o.isCheckpoint,
    checkpointLabel: o.cpLabel,
    isHardArea: o.isHardArea,
    isBranchPoint: o.isBranchPoint,
    eventRate: o.eventRate,
  };
}

// ============================================================
// 第1層：採掘坑道（共通・12エリア）
// ============================================================
const LAYER1: DungeonArea[] = [
  area({ name:'採掘坑道入口', turns:5, desc:'深穿晶窟の入口。かつて採掘者たちが掘り進んだ坑道が続く。壁面には小さな宝石の結晶が光り輝いている。まだ敵は少ない。', monsters:[] }),

  area({ name:'第1採掘区', turns:5, desc:'クリスタルスライムが点在する最初の採掘区。弱いが宝石素材を確定ドロップするため丁寧に処理したい。', monsters:[{id:'crystal_slime',count:4}] }),

  area({ name:'坑道の分かれ目', turns:5, desc:'坑道が複数方向に分岐している。鉱山守衛ゴーレムが2体で入口を塞いでいる。物理耐性が高いため貫通攻撃が有効。', monsters:[{id:'mining_golem',count:2},{id:'crystal_slime',count:3}] }),

  area({ name:'採掘作業場跡', turns:5, desc:'廃棄された採掘機材が散乱する作業場跡。採掘爆弾虫が潜んでいる。HP30%以下で自爆するため先に倒すこと。', monsters:[{id:'mining_bomb_bug',count:3},{id:'crystal_slime',count:2}] }),

  area({ name:'水晶回廊【CP1】', turns:5, desc:'水晶に覆われた美しい回廊。CP1を取得できる。水晶蛾が防御デバフを撒いてくるため優先処理推奨。', monsters:[{id:'crystal_moth',count:3},{id:'crystal_slime',count:2}], isCheckpoint:true, cpLabel:'CP1' }),

  area({ name:'深部採掘坑', turns:5, desc:'より深い採掘坑。鉱山守衛ゴーレムと採掘爆弾虫の複合配置。爆弾虫を先に処理してからゴーレムに集中すること。', monsters:[{id:'mining_golem',count:2},{id:'mining_bomb_bug',count:2},{id:'crystal_slime',count:2}], isHardArea:true }),

  area({ name:'宝石の泉', turns:5, desc:'地下水が宝石を溶かして湛まった泉。虹色クラゲが複数出現する。逃走型なので距離を詰めるか遠距離攻撃で。', monsters:[{id:'rainbow_jellyfish',count:2},{id:'crystal_slime',count:3}] }),

  area({ name:'崩落した採掘区', turns:5, desc:'天井が崩落しかけた危険区画。落石エフェクトで視界が悪い。鉱山守衛ゴーレムと水晶蛾の複合配置。', monsters:[{id:'mining_golem',count:2},{id:'crystal_moth',count:2},{id:'crystal_slime',count:2}], isHardArea:true }),

  area({ name:'第2採掘区深部', turns:5, desc:'採掘坑道の最深部手前。採掘爆弾虫の群れと水晶蛾が待ち伏せている。爆弾虫優先・蛾次という処理順を守れ。', monsters:[{id:'mining_bomb_bug',count:4},{id:'crystal_moth',count:3}], isHardArea:true }),

  area({ name:'坑道の底【CP2・分岐】', turns:5, desc:'採掘坑道の底。CP2取得後に分岐を選ぶ。A坑（素材多・敵少）・B坑（高EXP・敵多）・C坑（ショートカット・強敵）から1つが表示される。', monsters:[{id:'mining_golem',count:1},{id:'crystal_slime',count:3}], isCheckpoint:true, cpLabel:'CP2', isBranchPoint:true }),
];

// ============================================================
// 第1分岐：A坑・B坑・C坑（各4エリア）
// ============================================================
const BRANCH_A: DungeonArea[] = [
  area({ name:'A坑：結晶密集地帯①', turns:5, desc:'緑と青の結晶が密集した通路。クリスタルスライムが大量にいるが全て弱い。素材集めに最適。', monsters:[{id:'crystal_slime',count:6},{id:'crystal_moth',count:1}] }),
  area({ name:'A坑：採掘楽園②', turns:5, desc:'さらに結晶が密集した区画。鉱山守衛ゴーレムが1体いるが総じて穏やかな配置。', monsters:[{id:'crystal_slime',count:5},{id:'mining_golem',count:1}] }),
  area({ name:'A坑：宝石溜り③', turns:5, desc:'宝石が床に転がる区画。虹色クラゲ2体のみ。遠距離型だが数が少ないのでゆっくり対処できる。', monsters:[{id:'rainbow_jellyfish',count:2},{id:'crystal_slime',count:3}] }),
  area({ name:'A坑：神殿接続路④', turns:5, desc:'地下神殿への接続路。水晶蛾と採掘爆弾虫の混合だが密度は低め。', monsters:[{id:'crystal_moth',count:2},{id:'mining_bomb_bug',count:2}] }),
];

const BRANCH_B: DungeonArea[] = [
  area({ name:'B坑：落石危険地帯①', turns:5, desc:'天井から落石が連続する危険地帯。全ての敵が密集して出現する高密度エリア。EXPが多いが消耗する。', monsters:[{id:'mining_bomb_bug',count:4},{id:'crystal_moth',count:3},{id:'crystal_slime',count:3}], isHardArea:true }),
  area({ name:'B坑：ゴーレム密集②', turns:5, desc:'鉱山守衛ゴーレムが4体も並ぶ難所。貫通攻撃なしでは時間がかかりすぎる。', monsters:[{id:'mining_golem',count:4},{id:'crystal_slime',count:2}], isHardArea:true }),
  area({ name:'B坑：爆虫の巣③', turns:5, desc:'採掘爆弾虫が大量発生している巣。自爆の連鎖に注意。水晶蛾の防御デバフも重なって危険。', monsters:[{id:'mining_bomb_bug',count:5},{id:'crystal_moth',count:3}], isHardArea:true }),
  area({ name:'B坑：落石の最深部④', turns:5, desc:'B坑最深部。鉱山守衛ゴーレム・爆弾虫・虹色クラゲの混合配置。高EXPの見返りはある。', monsters:[{id:'mining_golem',count:2},{id:'mining_bomb_bug',count:3},{id:'rainbow_jellyfish',count:2}], isHardArea:true }),
];

const BRANCH_C: DungeonArea[] = [
  area({ name:'C坑：直通路①', turns:5, desc:'神殿への直通ショートカット。敵は少ないが出現する敵が強い。宝石ゴーレムMk.Ⅱが初登場。', monsters:[{id:'gem_golem_mk2',count:1},{id:'mining_golem',count:1}] }),
  area({ name:'C坑：直通路②', turns:5, desc:'ショートカット中盤。遺跡の番人が登場する。石化拘束に注意。', monsters:[{id:'ruins_guardian',count:1},{id:'crystal_moth',count:2}] }),
  area({ name:'C坑：直通路③', turns:5, desc:'ショートカット終盤。宝石ゴーレムMk.Ⅱと遺跡の番人の複合。属性輪転と石化が重なる難所。', monsters:[{id:'gem_golem_mk2',count:1},{id:'ruins_guardian',count:1}], isHardArea:true }),
  area({ name:'C坑：神殿接続口④', turns:5, desc:'地下神殿への接続口。虹色クラゲ2体のみ。ここを越えれば第2層へ。', monsters:[{id:'rainbow_jellyfish',count:2}] }),
];

// ============================================================
// 第2層：地下神殿遺構（共通12エリア）
// ============================================================
const LAYER2: DungeonArea[] = [
  area({ name:'神殿前庭', turns:5, desc:'古代の地下神殿の前庭。遺跡の番人が立ち並ぶ。石化拘束に備えて解除アイテムを確認しておくこと。', monsters:[{id:'ruins_guardian',count:2},{id:'crystal_slime',count:3}] }),

  area({ name:'第1封印の間', turns:5, desc:'封印結晶体が通路を塞いでいる。倒すことで次のドアが開く。封印結晶体は頑丈だが攻撃力は低い。', monsters:[{id:'seal_crystal',count:2},{id:'ruins_guardian',count:1}] }),

  area({ name:'属性回廊東翼', turns:5, desc:'宝石ゴーレムMk.Ⅱが出現する。毎ターン属性が変わるため弱点を読みながら戦うこと。虹色クラゲも回復しながら援護。', monsters:[{id:'gem_golem_mk2',count:1},{id:'rainbow_jellyfish',count:2},{id:'crystal_moth',count:2}], isHardArea:true }),

  area({ name:'神殿回廊【CP3】', turns:5, desc:'CP3を取得できる安全地帯に近い区画。遺跡の番人のみで比較的落ち着いた配置。', monsters:[{id:'ruins_guardian',count:2},{id:'seal_crystal',count:1}], isCheckpoint:true, cpLabel:'CP3' }),

  area({ name:'第2封印の間', turns:5, desc:'2つの封印結晶体が守る扉。遺跡の番人が援護している。封印を先に壊すか番人を先に倒すか判断が問われる。', monsters:[{id:'seal_crystal',count:2},{id:'ruins_guardian',count:2}] }),

  area({ name:'宝石祭壇の間', turns:5, desc:'宝石ゴーレムMk.Ⅱ2体が守る宝石祭壇。2体同時の属性輪転で弱点管理が複雑になる難所。', monsters:[{id:'gem_golem_mk2',count:2},{id:'ruins_guardian',count:1}], isHardArea:true }),

  area({ name:'深部神殿回廊', turns:5, desc:'神殿の深部。全種類の神殿系敵が混在する消耗地帯。丁寧に処理すること。', monsters:[{id:'ruins_guardian',count:2},{id:'gem_golem_mk2',count:1},{id:'rainbow_jellyfish',count:1},{id:'seal_crystal',count:1}], isHardArea:true }),

  area({ name:'第3封印の間', turns:5, desc:'最後の封印。3つの封印結晶体と宝石ゴーレムMk.Ⅱが守っている。ここを突破すれば分岐が待つ。', monsters:[{id:'seal_crystal',count:3},{id:'gem_golem_mk2',count:1}], isHardArea:true }),

  area({ name:'神殿奥院【CP4・分岐②】', turns:5, desc:'CP4取得後に第2分岐。試練の間（1体強モブ・ショートカット）か回廊（複数部屋・通常ルート）かを選ぶ。', monsters:[{id:'ruins_guardian',count:1}], isCheckpoint:true, cpLabel:'CP4', isBranchPoint:true }),
];

// ============================================================
// 第2分岐：試練の間 or 回廊（各3エリア）
// ============================================================
const TRIAL_ROOM: DungeonArea[] = [
  area({ name:'試練の間①：封鎖の守衛', turns:5, desc:'宝石ゴーレムMk.Ⅱ強化版「試練のゴーレム」が1体だけ出現。倒せば次へ。HP3倍・全属性。', monsters:[{id:'gem_golem_mk2',count:1,isMidBoss:true},{id:'seal_crystal',count:2}], isHardArea:true }),
  area({ name:'試練の間②：番人の頂点', turns:5, desc:'遺跡の番人最強個体が出現。石化拘束を2連続で使ってくる強化版。', monsters:[{id:'ruins_guardian',count:1,isMidBoss:true}], isHardArea:true }),
  area({ name:'試練の間③：虹の守護者', turns:5, desc:'虹色クラゲ強化版「虹の守護者」。逆ヒール+回復+防御デバフの三重苦。1体だが非常に厄介。', monsters:[{id:'rainbow_jellyfish',count:1,isMidBoss:true}], isHardArea:true }),
];

const CORRIDOR_ROUTE: DungeonArea[] = [
  area({ name:'回廊①：属性の祝路', turns:5, desc:'宝石ゴーレムMk.Ⅱと虹色クラゲの混成。試練の間より数は多いが個々は強化されていない。', monsters:[{id:'gem_golem_mk2',count:2},{id:'rainbow_jellyfish',count:2}], isHardArea:true }),
  area({ name:'回廊②：封印の回廊', turns:5, desc:'封印結晶体と遺跡の番人の最終配置。封印を優先的に処理して進路を確保。', monsters:[{id:'seal_crystal',count:3},{id:'ruins_guardian',count:3}], isHardArea:true }),
  area({ name:'回廊③：神殿最奥', turns:5, desc:'地下神殿の最奥。全神殿系敵の最終混成配置。ここを越えれば宝石龍の領域へ。', monsters:[{id:'gem_golem_mk2',count:1,isMidBoss:true},{id:'ruins_guardian',count:2,isMidBoss:true},{id:'rainbow_jellyfish',count:1},{id:'seal_crystal',count:2}], isHardArea:true }),
];

// ============================================================
// 第3層：宝石龍の巣穴（共通10エリア）
// ============================================================
const LAYER3: DungeonArea[] = [
  area({ name:'龍域の入口', turns:5, desc:'宝石龍クリスタリスの縄張りへの入口。空気が宝石の粉末で満たされ、緑の眷属が最初の番をしている。', monsters:[{id:'dragon_kin_green',count:1},{id:'crystal_slime',count:3}] }),

  area({ name:'緑の眷属の巣', turns:5, desc:'緑の龍の眷属が複数出現する。猛毒付与の連続が厄介。毒解除手段を準備しておくこと。', monsters:[{id:'dragon_kin_green',count:2},{id:'crystal_moth',count:2}], isHardArea:true }),

  area({ name:'蒼氷の回廊', turns:5, desc:'青い氷結晶が壁を覆う回廊。青の眷属が飛行しながら出現する。近接武器が届かないため遠距離・貫通で対処。', monsters:[{id:'dragon_kin_blue',count:1},{id:'dragon_kin_green',count:1}], isHardArea:true }),

  area({ name:'龍の巣穴【CP5】', turns:5, desc:'CP5取得の重要地点。青の眷属と緑の眷属の混合。ここで必ずCPを取得してから先へ進め。', monsters:[{id:'dragon_kin_blue',count:1},{id:'dragon_kin_green',count:1},{id:'rainbow_jellyfish',count:1}], isCheckpoint:true, cpLabel:'CP5' }),

  area({ name:'炎熱の岩盤', turns:5, desc:'赤の眷属が出現する高熱の区画。HP50%以下で怒り覚醒するため、攻撃が急に激化する点に注意。', monsters:[{id:'dragon_kin_red',count:1},{id:'dragon_kin_green',count:1}], isHardArea:true }),

  area({ name:'4色眷属の交差路', turns:5, desc:'緑・青・赤・黄の眷属が全色出現する恐ろしい交差路。毒・氷結・燃焼・麻痺が同時に飛んでくる最難所の1つ。', monsters:[{id:'dragon_kin_green',count:1},{id:'dragon_kin_blue',count:1},{id:'dragon_kin_red',count:1},{id:'dragon_kin_yellow',count:1}], isHardArea:true }),

  area({ name:'黄金結晶の大広間', turns:5, desc:'黄の眷属が守る大広間。超高防御で貫通攻撃推奨。麻痺付与で行動不能になることも。', monsters:[{id:'dragon_kin_yellow',count:1},{id:'dragon_kin_green',count:1}], isHardArea:true }),

  area({ name:'龍の寝所前【CP6】', turns:5, desc:'クリスタリスの寝所への最後の廊下。CP6を必ず取得。眷属の最終護衛隊が出現する。', monsters:[{id:'dragon_kin_red',count:1,isMidBoss:true},{id:'dragon_kin_blue',count:1,isMidBoss:true},{id:'dragon_kin_yellow',count:1,isMidBoss:true}], isHardArea:true, isCheckpoint:true, cpLabel:'CP6' }),

  area({ name:'宝石龍の寝所', turns:5, desc:'クリスタリスの眠る神聖な寝所。寝所の壁面は全色の宝石で覆われている。ここを越えれば宝石龍との決戦。', monsters:[{id:'dragon_kin_green',count:1,isMidBoss:true},{id:'dragon_kin_blue',count:1,isMidBoss:true},{id:'dragon_kin_red',count:1,isMidBoss:true},{id:'dragon_kin_yellow',count:1,isMidBoss:true}], isHardArea:true }),

  area({ name:'宝石龍の玉座', turns:5, desc:'宝石龍クリスタリスの玉座。HP200,000・フェーズ制の最恐ボスが待つ。75%/50%/25%でフェーズが移行する。25%以下では物理無効3ターンが発動するため貫通スキルが必須。', monsters:[{id:'crystallis',count:1,isMidBoss:false}], isHardArea:true }),
];

// ============================================================
// ダンジョン定義
// ============================================================
export const GEM_MINE_DUNGEON: DungeonMaster = {
  id: 'gem_mine',
  name: '深穿晶窟 リシュカ',
  description: '四色の宝石龍が守護する地下採掘場の遺跡。鉱山→神殿→龍の巣穴の3層構造で、分岐ルートが毎回変わる。ボスの宝石龍クリスタリスは異様に強く、開催値3000の蓄積が入場条件。輝石ドロップ率は5%と低いが、道中の宝石素材は豊富。',
  icon: 'gem_blue',
  tier: 'gemraid' as any,
  requiredLevel: 55,
  floors: 40,
  expBonus: 6.0,
  goldBonus: 5.5,
  monsterIds: Object.keys(GEM_MONSTERS),
  bossId: 'crystallis',
  unlockCondition: { dungeonId:'volcano', clearedCount:1, requiredLevel:55 } as any,
  routes: {
    main: [...LAYER1, ...LAYER2],
    branches: {
      // 第1分岐（坑道底から）
      branch_a: [...BRANCH_A, ...LAYER2, ...TRIAL_ROOM,   ...LAYER3],
      branch_b: [...BRANCH_B, ...LAYER2, ...CORRIDOR_ROUTE,...LAYER3],
      branch_c: [...BRANCH_C, ...LAYER2, ...TRIAL_ROOM,   ...LAYER3],
      // 第2分岐（神殿奥院から）
      trial:    TRIAL_ROOM,
      corridor: CORRIDOR_ROUTE,
    },
    lich: [],
    back: [],
    moon: [],
  },
};

// ============================================================
// 新素材アイテム定義
// ============================================================
export const GEM_DUNGEON_ITEMS: Record<string, {
  id: string; name: string; emoji: string; description: string;
  category: string; rarity: string; sellPrice: number;
}> = {
  gem_dragon_scale: {
    id:'gem_dragon_scale', name:'宝石龍のウロコ', emoji:'🐲',
    description:'宝石龍の眷属やクリスタリスから採取。全色ウロコの代替として使用可能な汎用素材。',
    category:'material', rarity:'legendary', sellPrice:20000,
  },
  rainbow_jewel: {
    id:'rainbow_jewel', name:'虹輝石', emoji:'🌈',
    description:'宝石龍クリスタリスのみからドロップする最希少素材。1%でしか出ない。将来の武器超強化素材。',
    category:'material', rarity:'legendary', sellPrice:500000,
  },
  gem_mine_map: {
    id:'gem_mine_map', name:'採掘場の地図（欠片）', emoji:'🗺️',
    description:'深穿晶窟リシュカの再入場証。クリスタリスからのドロップ率30%。',
    category:'tool', rarity:'epic', sellPrice:5000,
  },
  gem_mine_ticket: {
    id:'gem_mine_ticket', name:'宝石採掘場の入場証', emoji:'🎫',
    description:'強化ダイヤクレート×10をRakuza蒐集家NPCに納品して入手。深穿晶窟リシュカへの入場に必要。',
    category:'tool', rarity:'epic', sellPrice:0,
  },
};
