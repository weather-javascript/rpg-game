// src/data/missions.ts
import type { MissionDef } from '../types/game';

// ============================================================
// ランク定義
// ============================================================
export const GAMBLE_RANK_DEFS = [
  { name: '見習い',         threshold: 0,                color: '#8a92b2', badge: '🎮',
    perks: ['基本機能が使えます'] },
  { name: 'ギャンブラー',   threshold: 10_000_000,       color: '#4caf87', badge: '🎲',
    perks: ['デイリーミッション報酬 +10%', '称号「ギャンブラー」解放'] },
  { name: '熟練ギャンブラー', threshold: 100_000_000,    color: '#5b8dee', badge: '🎯',
    perks: ['デイリーミッション報酬 +25%', 'ウィークリー報酬 +10%', 'ランク限定称号「熟練ギャンブラー」解放'] },
  { name: '賭博王',          threshold: 10_000_000_000,  color: '#f0a040', badge: '👑',
    perks: ['全ミッション報酬 +50%', 'ジャックポット当選率 +0.5%', 'ランク限定演出「黄金エフェクト」解放', '称号「賭博王」解放'] },
  { name: 'レジェンド',      threshold: 100_000_000_000, color: '#e060e0', badge: '🌟',
    perks: ['全ミッション報酬 +100%', 'ジャックポット当選率 +1%', 'ランク限定演出「虹色エフェクト」解放', '称号「レジェンド」解放', '専用バッジ表示'] },
] as const;

export type GambleRankName = typeof GAMBLE_RANK_DEFS[number]['name'];

export function getGambleRankDef(totalWagered: number) {
  let rank: typeof GAMBLE_RANK_DEFS[number] = GAMBLE_RANK_DEFS[0];
  for (const r of GAMBLE_RANK_DEFS) {
    if (totalWagered >= r.threshold) rank = r;
  }
  return rank;
}

export function getMissionRewardBonus(totalWagered: number): number {
  const rank = getGambleRankDef(totalWagered);
  const name = rank.name as string;
  if (name === 'レジェンド') return 2.0;
  if (name === '賭博王') return 1.5;
  if (name === '熟練ギャンブラー') return 1.25;
  if (name === 'ギャンブラー') return 1.1;
  return 1.0;
}

export function getJackpotBonus(totalWagered: number): number {
  const rank = getGambleRankDef(totalWagered);
  const name = rank.name as string;
  if (name === 'レジェンド') return 0.01;
  if (name === '賭博王') return 0.005;
  return 0;
}

// ============================================================
// ミッション定義（200種以上）
// ============================================================
export const MISSION_DEFS: MissionDef[] = [
  // =========================================================
  // DAILY
  // =========================================================
  { id: 'd_gamble_5',       title: 'ギャンブル5回',       description: '本日5回ギャンブルをプレイ',         type: 'daily',  target: 5,   rewardWC: 5_000,   statKey: 'dailyGamblePlays' },
  { id: 'd_gamble_10',      title: 'ギャンブル10回',      description: '本日10回ギャンブルをプレイ',        type: 'daily',  target: 10,  rewardWC: 12_000,  statKey: 'dailyGamblePlays' },
  { id: 'd_gamble_20',      title: 'ギャンブル20回',      description: '本日20回ギャンブルをプレイ',        type: 'daily',  target: 20,  rewardWC: 25_000,  statKey: 'dailyGamblePlays' },
  { id: 'd_slot_3',         title: 'スロット3回',         description: '本日スロットを3回プレイ',           type: 'daily',  target: 3,   rewardWC: 3_000,   statKey: 'dailySlotPlays' },
  { id: 'd_slot_10',        title: 'スロット10回',        description: '本日スロットを10回プレイ',          type: 'daily',  target: 10,  rewardWC: 10_000,  statKey: 'dailySlotPlays' },
  { id: 'd_slot_30',        title: 'スロット30回',        description: '本日スロットを30回プレイ',          type: 'daily',  target: 30,  rewardWC: 30_000,  statKey: 'dailySlotPlays' },
  { id: 'd_chohan_win1',    title: '丁半1勝',             description: '本日丁半で1勝する',                 type: 'daily',  target: 1,   rewardWC: 2_000,   statKey: 'dailyChohanWins' },
  { id: 'd_chohan_win5',    title: '丁半5勝',             description: '本日丁半で5勝する',                 type: 'daily',  target: 5,   rewardWC: 8_000,   statKey: 'dailyChohanWins' },
  { id: 'd_chohan_win10',   title: '丁半10勝',            description: '本日丁半で10勝する',                type: 'daily',  target: 10,  rewardWC: 18_000,  statKey: 'dailyChohanWins' },
  { id: 'd_chinchiro_win1', title: 'チンチロ1勝',         description: '本日チンチロで1勝する',             type: 'daily',  target: 1,   rewardWC: 2_000,   statKey: 'dailyChinchiroWins' },
  { id: 'd_chinchiro_win5', title: 'チンチロ5勝',         description: '本日チンチロで5勝する',             type: 'daily',  target: 5,   rewardWC: 8_000,   statKey: 'dailyChinchiroWins' },
  { id: 'd_coinflip_win3',  title: 'コイン3勝',           description: '本日コインで3勝する',               type: 'daily',  target: 3,   rewardWC: 5_000,   statKey: 'dailyCoinFlipWins' },
  { id: 'd_coinflip_win10', title: 'コイン10勝',          description: '本日コインで10勝する',              type: 'daily',  target: 10,  rewardWC: 15_000,  statKey: 'dailyCoinFlipWins' },
  { id: 'd_highlow_win3',   title: 'ハイロー3勝',         description: '本日ハイローで3勝する',             type: 'daily',  target: 3,   rewardWC: 5_000,   statKey: 'dailyHighlowWins' },
  { id: 'd_highlow_win10',  title: 'ハイロー10勝',        description: '本日ハイローで10勝する',            type: 'daily',  target: 10,  rewardWC: 15_000,  statKey: 'dailyHighlowWins' },
  { id: 'd_poker_win1',     title: 'ポーカー1勝',         description: '本日ポーカーで1勝する',             type: 'daily',  target: 1,   rewardWC: 3_000,   statKey: 'dailyPokerWins' },
  { id: 'd_poker_win3',     title: 'ポーカー3勝',         description: '本日ポーカーで3勝する',             type: 'daily',  target: 3,   rewardWC: 10_000,  statKey: 'dailyPokerWins' },
  { id: 'd_poker_win5',     title: 'ポーカー5勝',         description: '本日ポーカーで5勝する',             type: 'daily',  target: 5,   rewardWC: 20_000,  statKey: 'dailyPokerWins' },

  // --- 新規ゲーム デイリー ---
  { id: 'd_mines_win3',     title: 'マイン3勝',           description: '本日ミニマインで3勝する',           type: 'daily',  target: 3,   rewardWC: 5_000,   statKey: 'dailyMinesWins' },
  { id: 'd_mines_win10',    title: 'マイン10勝',          description: '本日ミニマインで10勝する',          type: 'daily',  target: 10,  rewardWC: 15_000,  statKey: 'dailyMinesWins' },
  { id: 'd_dicerace_win3',  title: 'ダイスレース3勝',     description: '本日ダイスレースで3勝する',         type: 'daily',  target: 3,   rewardWC: 5_000,   statKey: 'dailyDiceRaceWins' },
  { id: 'd_dicerace_win10', title: 'ダイスレース10勝',    description: '本日ダイスレースで10勝する',        type: 'daily',  target: 10,  rewardWC: 15_000,  statKey: 'dailyDiceRaceWins' },
  { id: 'd_roulette_win3',  title: 'ルーレット3勝',       description: '本日ルーレットで3勝する',           type: 'daily',  target: 3,   rewardWC: 5_000,   statKey: 'dailyRouletteWins' },
  { id: 'd_roulette_win10', title: 'ルーレット10勝',      description: '本日ルーレットで10勝する',          type: 'daily',  target: 10,  rewardWC: 15_000,  statKey: 'dailyRouletteWins' },
  { id: 'd_bj_win3',        title: 'BJ3勝',               description: '本日ブラックジャックで3勝する',     type: 'daily',  target: 3,   rewardWC: 5_000,   statKey: 'dailyBlackjackWins' },
  { id: 'd_bj_win10',       title: 'BJ10勝',              description: '本日ブラックジャックで10勝する',    type: 'daily',  target: 10,  rewardWC: 15_000,  statKey: 'dailyBlackjackWins' },
  { id: 'd_scratch_win3',   title: 'スクラッチ3勝',       description: '本日スクラッチで3勝する',           type: 'daily',  target: 3,   rewardWC: 5_000,   statKey: 'dailyScratchWins' },
  { id: 'd_scratch_win10',  title: 'スクラッチ10勝',      description: '本日スクラッチで10勝する',          type: 'daily',  target: 10,  rewardWC: 15_000,  statKey: 'dailyScratchWins' },
  { id: 'd_race_win3',      title: 'レース3勝',           description: '本日ミニレースで3勝する',           type: 'daily',  target: 3,   rewardWC: 5_000,   statKey: 'dailyRaceWins' },
  { id: 'd_race_win10',     title: 'レース10勝',          description: '本日ミニレースで10勝する',          type: 'daily',  target: 10,  rewardWC: 15_000,  statKey: 'dailyRaceWins' },

  // =========================================================
  // WEEKLY
  // =========================================================
  { id: 'w_gamble_50',      title: '週50回プレイ',        description: '今週50回ギャンブルをプレイ',         type: 'weekly', target: 50,   rewardWC: 50_000,   statKey: 'weeklyGamblePlays' },
  { id: 'w_gamble_100',     title: '週100回プレイ',       description: '今週100回ギャンブルをプレイ',        type: 'weekly', target: 100,  rewardWC: 100_000,  statKey: 'weeklyGamblePlays' },
  { id: 'w_gamble_200',     title: '週200回プレイ',       description: '今週200回ギャンブルをプレイ',        type: 'weekly', target: 200,  rewardWC: 200_000,  statKey: 'weeklyGamblePlays' },
  { id: 'w_slot_30',        title: '週スロット30回',      description: '今週スロットを30回プレイ',           type: 'weekly', target: 30,   rewardWC: 40_000,   statKey: 'weeklySlotPlays' },
  { id: 'w_slot_100',       title: '週スロット100回',     description: '今週スロットを100回プレイ',          type: 'weekly', target: 100,  rewardWC: 120_000,  statKey: 'weeklySlotPlays' },
  { id: 'w_chohan_win20',   title: '週丁半20勝',          description: '今週丁半で20勝する',                 type: 'weekly', target: 20,   rewardWC: 60_000,   statKey: 'weeklyChohanWins' },
  { id: 'w_chohan_win50',   title: '週丁半50勝',          description: '今週丁半で50勝する',                 type: 'weekly', target: 50,   rewardWC: 150_000,  statKey: 'weeklyChohanWins' },
  { id: 'w_chinchiro_win20',title: '週チンチロ20勝',      description: '今週チンチロで20勝する',             type: 'weekly', target: 20,   rewardWC: 60_000,   statKey: 'weeklyChinchiroWins' },
  { id: 'w_poker_win10',    title: '週ポーカー10勝',      description: '今週ポーカーで10勝する',             type: 'weekly', target: 10,   rewardWC: 80_000,   statKey: 'weeklyPokerWins' },
  { id: 'w_poker_win30',    title: '週ポーカー30勝',      description: '今週ポーカーで30勝する',             type: 'weekly', target: 30,   rewardWC: 250_000,  statKey: 'weeklyPokerWins' },
  { id: 'w_highlow_streak3',title: '週ハイロー3連勝',     description: '今週ハイローで3連勝する',            type: 'weekly', target: 3,    rewardWC: 30_000,   statKey: 'weeklyHighlowMaxStreak' },
  { id: 'w_highlow_streak5',title: '週ハイロー5連勝',     description: '今週ハイローで5連勝する',            type: 'weekly', target: 5,    rewardWC: 100_000,  statKey: 'weeklyHighlowMaxStreak' },

  // --- 新規ゲーム ウィークリー ---
  { id: 'w_mines_win20',    title: '週マイン20勝',        description: '今週ミニマインで20勝する',           type: 'weekly', target: 20,   rewardWC: 60_000,   statKey: 'weeklyMinesWins' },
  { id: 'w_dicerace_win20', title: '週ダイスレース20勝',  description: '今週ダイスレースで20勝する',         type: 'weekly', target: 20,   rewardWC: 60_000,   statKey: 'weeklyDiceRaceWins' },
  { id: 'w_roulette_win20', title: '週ルーレット20勝',    description: '今週ルーレットで20勝する',           type: 'weekly', target: 20,   rewardWC: 60_000,   statKey: 'weeklyRouletteWins' },
  { id: 'w_bj_win20',       title: '週BJ20勝',            description: '今週ブラックジャックで20勝する',     type: 'weekly', target: 20,   rewardWC: 60_000,   statKey: 'weeklyBlackjackWins' },
  { id: 'w_scratch_win20',  title: '週スクラッチ20勝',    description: '今週スクラッチで20勝する',           type: 'weekly', target: 20,   rewardWC: 60_000,   statKey: 'weeklyScratchWins' },
  { id: 'w_race_win20',     title: '週レース20勝',        description: '今週ミニレースで20勝する',           type: 'weekly', target: 20,   rewardWC: 60_000,   statKey: 'weeklyRaceWins' },

  // =========================================================
  // ACHIEVEMENTS: スロット
  // =========================================================
  { id: 'a_slot_10',        title: 'スロット初心者',      description: 'スロットを10回プレイ',               type: 'achievement', target: 10,    rewardWC: 10_000,      statKey: 'totalSlotPlays' },
  { id: 'a_slot_50',        title: 'スロット好き',        description: 'スロットを50回プレイ',               type: 'achievement', target: 50,    rewardWC: 50_000,      statKey: 'totalSlotPlays' },
  { id: 'a_slot_100',       title: 'スロット愛好家',      description: 'スロットを100回プレイ',              type: 'achievement', target: 100,   rewardWC: 100_000,     statKey: 'totalSlotPlays' },
  { id: 'a_slot_500',       title: 'スロット中毒',        description: 'スロットを500回プレイ',              type: 'achievement', target: 500,   rewardWC: 500_000,     statKey: 'totalSlotPlays' },
  { id: 'a_slot_1000',      title: 'スロットマスター',    description: 'スロットを1000回プレイ',             type: 'achievement', target: 1000,  rewardWC: 1_000_000,   statKey: 'totalSlotPlays' },
  { id: 'a_slot_5000',      title: 'スロット伝説',        description: 'スロットを5000回プレイ',             type: 'achievement', target: 5000,  rewardWC: 5_000_000,   statKey: 'totalSlotPlays' },
  { id: 'a_slot_10000',     title: 'スロット神',          description: 'スロットを10000回プレイ',            type: 'achievement', target: 10000, rewardWC: 10_000_000,  statKey: 'totalSlotPlays' },

  // =========================================================
  // ACHIEVEMENTS: 丁半
  // =========================================================
  { id: 'a_chohan_p10',     title: '丁半デビュー',        description: '丁半を10回プレイ',                   type: 'achievement', target: 10,    rewardWC: 8_000,       statKey: 'totalChohanPlays' },
  { id: 'a_chohan_p100',    title: '丁半プレイヤー',      description: '丁半を100回プレイ',                  type: 'achievement', target: 100,   rewardWC: 80_000,      statKey: 'totalChohanPlays' },
  { id: 'a_chohan_p500',    title: '丁半常連',            description: '丁半を500回プレイ',                  type: 'achievement', target: 500,   rewardWC: 400_000,     statKey: 'totalChohanPlays' },
  { id: 'a_chohan_p1000',   title: '丁半通',              description: '丁半を1000回プレイ',                 type: 'achievement', target: 1000,  rewardWC: 800_000,     statKey: 'totalChohanPlays' },
  { id: 'a_chohan_w10',     title: '丁半10勝',            description: '丁半で通算10勝',                     type: 'achievement', target: 10,    rewardWC: 15_000,      statKey: 'totalChohanWins' },
  { id: 'a_chohan_w50',     title: '丁半50勝',            description: '丁半で通算50勝',                     type: 'achievement', target: 50,    rewardWC: 75_000,      statKey: 'totalChohanWins' },
  { id: 'a_chohan_w100',    title: '丁半100勝',           description: '丁半で通算100勝',                    type: 'achievement', target: 100,   rewardWC: 150_000,     statKey: 'totalChohanWins' },
  { id: 'a_chohan_w500',    title: '丁半500勝',           description: '丁半で通算500勝',                    type: 'achievement', target: 500,   rewardWC: 750_000,     statKey: 'totalChohanWins' },
  { id: 'a_chohan_w1000',   title: '丁半1000勝',          description: '丁半で通算1000勝',                   type: 'achievement', target: 1000,  rewardWC: 1_500_000,   statKey: 'totalChohanWins' },
  { id: 'a_chohan_w3000',   title: '丁半の覇者',          description: '丁半で通算3000勝',                   type: 'achievement', target: 3000,  rewardWC: 5_000_000,   statKey: 'totalChohanWins' },

  // =========================================================
  // ACHIEVEMENTS: チンチロ
  // =========================================================
  { id: 'a_chin_p10',       title: 'チンチロ入門',        description: 'チンチロを10回プレイ',               type: 'achievement', target: 10,    rewardWC: 8_000,       statKey: 'totalChinchiroPlays' },
  { id: 'a_chin_p100',      title: 'チンチロ好き',        description: 'チンチロを100回プレイ',              type: 'achievement', target: 100,   rewardWC: 80_000,      statKey: 'totalChinchiroPlays' },
  { id: 'a_chin_p500',      title: 'チンチロ常連',        description: 'チンチロを500回プレイ',              type: 'achievement', target: 500,   rewardWC: 400_000,     statKey: 'totalChinchiroPlays' },
  { id: 'a_chin_p1000',     title: 'チンチロ通',          description: 'チンチロを1000回プレイ',             type: 'achievement', target: 1000,  rewardWC: 800_000,     statKey: 'totalChinchiroPlays' },
  { id: 'a_chin_w10',       title: 'チンチロ10勝',        description: 'チンチロで通算10勝',                 type: 'achievement', target: 10,    rewardWC: 15_000,      statKey: 'totalChinchiroWins' },
  { id: 'a_chin_w50',       title: 'チンチロ50勝',        description: 'チンチロで通算50勝',                 type: 'achievement', target: 50,    rewardWC: 75_000,      statKey: 'totalChinchiroWins' },
  { id: 'a_chin_w100',      title: 'チンチロ100勝',       description: 'チンチロで通算100勝',                type: 'achievement', target: 100,   rewardWC: 150_000,     statKey: 'totalChinchiroWins' },
  { id: 'a_chin_w500',      title: 'チンチロ500勝',       description: 'チンチロで通算500勝',                type: 'achievement', target: 500,   rewardWC: 750_000,     statKey: 'totalChinchiroWins' },
  { id: 'a_chin_w1000',     title: 'チンチロ1000勝',      description: 'チンチロで通算1000勝',               type: 'achievement', target: 1000,  rewardWC: 1_500_000,   statKey: 'totalChinchiroWins' },

  // =========================================================
  // ACHIEVEMENTS: ポーカー
  // =========================================================
  { id: 'a_poker_p10',      title: 'ポーカー入門',        description: 'ポーカーを10回プレイ',               type: 'achievement', target: 10,    rewardWC: 10_000,      statKey: 'totalPokerPlays' },
  { id: 'a_poker_p50',      title: 'ポーカー好き',        description: 'ポーカーを50回プレイ',               type: 'achievement', target: 50,    rewardWC: 50_000,      statKey: 'totalPokerPlays' },
  { id: 'a_poker_p100',     title: 'ポーカーマン',        description: 'ポーカーを100回プレイ',              type: 'achievement', target: 100,   rewardWC: 100_000,     statKey: 'totalPokerPlays' },
  { id: 'a_poker_p500',     title: 'ポーカー常連',        description: 'ポーカーを500回プレイ',              type: 'achievement', target: 500,   rewardWC: 500_000,     statKey: 'totalPokerPlays' },
  { id: 'a_poker_p1000',    title: 'ポーカー達人',        description: 'ポーカーを1000回プレイ',             type: 'achievement', target: 1000,  rewardWC: 1_000_000,   statKey: 'totalPokerPlays' },
  { id: 'a_poker_w10',      title: 'ポーカー10勝',        description: 'ポーカーで通算10勝',                 type: 'achievement', target: 10,    rewardWC: 20_000,      statKey: 'totalPokerWins' },
  { id: 'a_poker_w50',      title: 'ポーカー50勝',        description: 'ポーカーで通算50勝',                 type: 'achievement', target: 50,    rewardWC: 100_000,     statKey: 'totalPokerWins' },
  { id: 'a_poker_w100',     title: 'ポーカー100勝',       description: 'ポーカーで通算100勝',                type: 'achievement', target: 100,   rewardWC: 200_000,     statKey: 'totalPokerWins' },
  { id: 'a_poker_w500',     title: 'ポーカー500勝',       description: 'ポーカーで通算500勝',                type: 'achievement', target: 500,   rewardWC: 1_000_000,   statKey: 'totalPokerWins' },
  { id: 'a_poker_w1000',    title: 'ポーカー1000勝',      description: 'ポーカーで通算1000勝',               type: 'achievement', target: 1000,  rewardWC: 2_000_000,   statKey: 'totalPokerWins' },
  { id: 'a_poker_w3000',    title: 'ポーカーキング',      description: 'ポーカーで通算3000勝',               type: 'achievement', target: 3000,  rewardWC: 5_000_000,   statKey: 'totalPokerWins' },

  // =========================================================
  // ACHIEVEMENTS: コインフリップ
  // =========================================================
  { id: 'a_coin_p10',       title: 'コイン投げ入門',      description: 'コインフリップを10回プレイ',         type: 'achievement', target: 10,    rewardWC: 8_000,       statKey: 'totalCoinFlipPlays' },
  { id: 'a_coin_p100',      title: 'コインフリッパー',    description: 'コインフリップを100回プレイ',        type: 'achievement', target: 100,   rewardWC: 80_000,      statKey: 'totalCoinFlipPlays' },
  { id: 'a_coin_p500',      title: 'コイン常連',          description: 'コインフリップを500回プレイ',        type: 'achievement', target: 500,   rewardWC: 400_000,     statKey: 'totalCoinFlipPlays' },
  { id: 'a_coin_p1000',     title: 'コインマスター',      description: 'コインフリップを1000回プレイ',       type: 'achievement', target: 1000,  rewardWC: 800_000,     statKey: 'totalCoinFlipPlays' },
  { id: 'a_coin_w10',       title: 'コイン10勝',          description: 'コインフリップで通算10勝',           type: 'achievement', target: 10,    rewardWC: 15_000,      statKey: 'totalCoinFlipWins' },
  { id: 'a_coin_w100',      title: 'コイン100勝',         description: 'コインフリップで通算100勝',          type: 'achievement', target: 100,   rewardWC: 150_000,     statKey: 'totalCoinFlipWins' },
  { id: 'a_coin_w500',      title: 'コイン500勝',         description: 'コインフリップで通算500勝',          type: 'achievement', target: 500,   rewardWC: 750_000,     statKey: 'totalCoinFlipWins' },
  { id: 'a_coin_w1000',     title: 'コイン1000勝',        description: 'コインフリップで通算1000勝',         type: 'achievement', target: 1000,  rewardWC: 1_500_000,   statKey: 'totalCoinFlipWins' },

  // =========================================================
  // ACHIEVEMENTS: ハイロー
  // =========================================================
  { id: 'a_hl_p10',         title: 'ハイロー入門',        description: 'ハイローを10回プレイ',               type: 'achievement', target: 10,    rewardWC: 10_000,      statKey: 'totalHighlowPlays' },
  { id: 'a_hl_p50',         title: 'ハイロー好き',        description: 'ハイローを50回プレイ',               type: 'achievement', target: 50,    rewardWC: 50_000,      statKey: 'totalHighlowPlays' },
  { id: 'a_hl_p100',        title: 'ハイローマン',        description: 'ハイローを100回プレイ',              type: 'achievement', target: 100,   rewardWC: 100_000,     statKey: 'totalHighlowPlays' },
  { id: 'a_hl_p500',        title: 'ハイロー常連',        description: 'ハイローを500回プレイ',              type: 'achievement', target: 500,   rewardWC: 500_000,     statKey: 'totalHighlowPlays' },
  { id: 'a_hl_p1000',       title: 'ハイロー達人',        description: 'ハイローを1000回プレイ',             type: 'achievement', target: 1000,  rewardWC: 1_000_000,   statKey: 'totalHighlowPlays' },
  { id: 'a_hl_w10',         title: 'ハイロー10勝',        description: 'ハイローで通算10勝',                 type: 'achievement', target: 10,    rewardWC: 15_000,      statKey: 'totalHighlowWins' },
  { id: 'a_hl_w100',        title: 'ハイロー100勝',       description: 'ハイローで通算100勝',                type: 'achievement', target: 100,   rewardWC: 150_000,     statKey: 'totalHighlowWins' },
  { id: 'a_hl_w500',        title: 'ハイロー500勝',       description: 'ハイローで通算500勝',                type: 'achievement', target: 500,   rewardWC: 750_000,     statKey: 'totalHighlowWins' },
  { id: 'a_hl_w1000',       title: 'ハイロー1000勝',      description: 'ハイローで通算1000勝',               type: 'achievement', target: 1000,  rewardWC: 1_500_000,   statKey: 'totalHighlowWins' },
  { id: 'a_hl_s3',          title: 'ハイロー3連勝',       description: 'ハイローで3連勝を達成',              type: 'achievement', target: 3,     rewardWC: 30_000,      statKey: 'maxHighlowStreak' },
  { id: 'a_hl_s5',          title: 'ハイロー5連勝',       description: 'ハイローで5連勝を達成',              type: 'achievement', target: 5,     rewardWC: 100_000,     statKey: 'maxHighlowStreak' },
  { id: 'a_hl_s10',         title: 'ハイロー10連勝！',    description: 'ハイローで10連勝を達成',             type: 'achievement', target: 10,    rewardWC: 1_000_000,   statKey: 'maxHighlowStreak' },

  // =========================================================
  // ACHIEVEMENTS: ジャックポット
  // =========================================================
  { id: 'a_jp_1',           title: 'ジャックポット初当選', description: 'ジャックポットを初めて当てる',      type: 'achievement', target: 1,   rewardWC: 500_000,     statKey: 'totalJackpotWins' },
  { id: 'a_jp_3',           title: 'JP3回',               description: 'ジャックポットを3回当てる',          type: 'achievement', target: 3,   rewardWC: 2_000_000,   statKey: 'totalJackpotWins' },
  { id: 'a_jp_5',           title: 'JP5回',               description: 'ジャックポットを5回当てる',          type: 'achievement', target: 5,   rewardWC: 5_000_000,   statKey: 'totalJackpotWins' },
  { id: 'a_jp_10',          title: 'JPマスター',          description: 'ジャックポットを10回当てる',         type: 'achievement', target: 10,  rewardWC: 10_000_000,  statKey: 'totalJackpotWins' },

  // =========================================================
  // ACHIEVEMENTS: 総賭け額
  // =========================================================
  { id: 'a_wager_100k',     title: '百万の賭け人',        description: '累計賭け額100万WC',                  type: 'achievement', target: 1_000_000,          rewardWC: 50_000,      statKey: 'totalWagered' },
  { id: 'a_wager_1m',       title: '千万の賭け人',        description: '累計賭け額1000万WC',                 type: 'achievement', target: 10_000_000,         rewardWC: 500_000,     statKey: 'totalWagered' },
  { id: 'a_wager_10m',      title: '億の賭け人',          description: '累計賭け額1億WC',                    type: 'achievement', target: 100_000_000,        rewardWC: 2_000_000,   statKey: 'totalWagered' },
  { id: 'a_wager_100m',     title: '十億の賭け人',        description: '累計賭け額10億WC',                   type: 'achievement', target: 1_000_000_000,      rewardWC: 10_000_000,  statKey: 'totalWagered' },
  { id: 'a_wager_1b',       title: '百億の賭け人',        description: '累計賭け額100億WC',                  type: 'achievement', target: 10_000_000_000,     rewardWC: 50_000_000,  statKey: 'totalWagered' },
  { id: 'a_wager_10b',      title: '兆の賭け人',          description: '累計賭け額1000億WC',                 type: 'achievement', target: 100_000_000_000,    rewardWC: 200_000_000, statKey: 'totalWagered' },

  // =========================================================
  // ACHIEVEMENTS: 総勝利額
  // =========================================================
  { id: 'a_win_100k',       title: '百万の勝ち人',        description: '累計勝利額100万WC',                  type: 'achievement', target: 1_000_000,          rewardWC: 50_000,      statKey: 'totalWinAmount' },
  { id: 'a_win_1m',         title: '千万の勝ち人',        description: '累計勝利額1000万WC',                 type: 'achievement', target: 10_000_000,         rewardWC: 500_000,     statKey: 'totalWinAmount' },
  { id: 'a_win_10m',        title: '億の勝ち人',          description: '累計勝利額1億WC',                    type: 'achievement', target: 100_000_000,        rewardWC: 2_000_000,   statKey: 'totalWinAmount' },
  { id: 'a_win_100m',       title: '十億の勝ち人',        description: '累計勝利額10億WC',                   type: 'achievement', target: 1_000_000_000,      rewardWC: 10_000_000,  statKey: 'totalWinAmount' },
  { id: 'a_win_1b',         title: '百億の勝ち人',        description: '累計勝利額100億WC',                  type: 'achievement', target: 10_000_000_000,     rewardWC: 50_000_000,  statKey: 'totalWinAmount' },

  // =========================================================
  // ACHIEVEMENTS: 総プレイ数
  // =========================================================
  { id: 'a_total_50',       title: 'ギャンブラー見習い',  description: '累計50回ギャンブル',                 type: 'achievement', target: 50,    rewardWC: 20_000,      statKey: 'totalWinCount' },
  { id: 'a_total_w100',     title: '100勝達成',           description: 'ギャンブル通算100勝',                type: 'achievement', target: 100,   rewardWC: 100_000,     statKey: 'totalWinCount' },
  { id: 'a_total_w500',     title: '500勝達成',           description: 'ギャンブル通算500勝',                type: 'achievement', target: 500,   rewardWC: 500_000,     statKey: 'totalWinCount' },
  { id: 'a_total_w1000',    title: '1000勝達成',          description: 'ギャンブル通算1000勝',               type: 'achievement', target: 1000,  rewardWC: 1_000_000,   statKey: 'totalWinCount' },
  { id: 'a_total_w5000',    title: '5000勝達成',          description: 'ギャンブル通算5000勝',               type: 'achievement', target: 5000,  rewardWC: 5_000_000,   statKey: 'totalWinCount' },
  { id: 'a_total_w10000',   title: '1万勝達成',           description: 'ギャンブル通算10000勝',              type: 'achievement', target: 10000, rewardWC: 10_000_000,  statKey: 'totalWinCount' },

  // =========================================================
  // ACHIEVEMENTS: 最大ベット
  // =========================================================
  { id: 'a_maxbet_100k',    title: '大きな賭け',          description: '1回のベット額10万WC',                type: 'achievement', target: 100_000,      rewardWC: 50_000,      statKey: 'maxSingleBet' },
  { id: 'a_maxbet_500k',    title: 'ビッグベット',        description: '1回のベット額50万WC',                type: 'achievement', target: 500_000,      rewardWC: 200_000,     statKey: 'maxSingleBet' },
  { id: 'a_maxbet_1m',      title: '百万ベット',          description: '1回のベット額100万WC',               type: 'achievement', target: 1_000_000,    rewardWC: 500_000,     statKey: 'maxSingleBet' },
  { id: 'a_maxbet_10m',     title: '千万ベット',          description: '1回のベット額1000万WC',              type: 'achievement', target: 10_000_000,   rewardWC: 2_000_000,   statKey: 'maxSingleBet' },
  { id: 'a_maxbet_100m',    title: '億ベット',            description: '1回のベット額1億WC',                 type: 'achievement', target: 100_000_000,  rewardWC: 10_000_000,  statKey: 'maxSingleBet' },

  // =========================================================
  // ACHIEVEMENTS: 最大1回勝利
  // =========================================================
  { id: 'a_maxwin_50k',     title: 'ビッグウィン',        description: '1回で5万WC以上獲得',                 type: 'achievement', target: 50_000,       rewardWC: 30_000,      statKey: 'maxSingleWin' },
  { id: 'a_maxwin_500k',    title: 'スーパービッグウィン', description: '1回で50万WC以上獲得',               type: 'achievement', target: 500_000,      rewardWC: 200_000,     statKey: 'maxSingleWin' },
  { id: 'a_maxwin_5m',      title: 'メガビッグウィン',    description: '1回で500万WC以上獲得',               type: 'achievement', target: 5_000_000,    rewardWC: 1_000_000,   statKey: 'maxSingleWin' },
  { id: 'a_maxwin_50m',     title: 'ギガウィン',          description: '1回で5000万WC以上獲得',              type: 'achievement', target: 50_000_000,   rewardWC: 5_000_000,   statKey: 'maxSingleWin' },
  { id: 'a_maxwin_500m',    title: '伝説の大勝利',        description: '1回で5億WC以上獲得',                 type: 'achievement', target: 500_000_000,  rewardWC: 20_000_000,  statKey: 'maxSingleWin' },

  // =========================================================
  // ACHIEVEMENTS: ロスト / 敗北
  // =========================================================
  { id: 'a_lose_10',        title: '負けも経験',          description: '通算10回敗北',                       type: 'achievement', target: 10,    rewardWC: 5_000,       statKey: 'totalLoseCount' },
  { id: 'a_lose_100',       title: '苦労人',              description: '通算100回敗北',                      type: 'achievement', target: 100,   rewardWC: 50_000,      statKey: 'totalLoseCount' },
  { id: 'a_lose_500',       title: '修羅場くぐり',        description: '通算500回敗北',                      type: 'achievement', target: 500,   rewardWC: 250_000,     statKey: 'totalLoseCount' },
  { id: 'a_lose_1000',      title: '不屈の精神',          description: '通算1000回敗北',                     type: 'achievement', target: 1000,  rewardWC: 500_000,     statKey: 'totalLoseCount' },
  { id: 'a_lose_5000',      title: '鉄の意志',            description: '通算5000回敗北',                     type: 'achievement', target: 5000,  rewardWC: 2_000_000,   statKey: 'totalLoseCount' },

  // =========================================================
  // ACHIEVEMENTS: ランク到達
  // =========================================================
  { id: 'a_rank_gambler',   title: 'ギャンブラー昇格',    description: 'ギャンブルランクがギャンブラーになる', type: 'achievement', target: 10_000_000,    rewardWC: 500_000,    statKey: 'totalWagered' },
  { id: 'a_rank_skilled',   title: '熟練ギャンブラー昇格', description: '熟練ギャンブラーになる',             type: 'achievement', target: 100_000_000,   rewardWC: 3_000_000,  statKey: 'totalWagered' },
  { id: 'a_rank_king',      title: '賭博王昇格',          description: '賭博王になる',                       type: 'achievement', target: 10_000_000_000, rewardWC: 30_000_000, statKey: 'totalWagered' },
  { id: 'a_rank_legend',    title: 'レジェンド昇格',      description: 'レジェンドになる',                   type: 'achievement', target: 100_000_000_000, rewardWC: 100_000_000, statKey: 'totalWagered' },

  // =========================================================
  // ACHIEVEMENTS: 追加（多様性）
  // =========================================================
  { id: 'a_slot_200',       title: 'スロット200回',       description: 'スロットを200回プレイ',              type: 'achievement', target: 200,   rewardWC: 200_000,     statKey: 'totalSlotPlays' },
  { id: 'a_slot_2000',      title: 'スロット2000回',      description: 'スロットを2000回プレイ',             type: 'achievement', target: 2000,  rewardWC: 2_000_000,   statKey: 'totalSlotPlays' },
  { id: 'a_chohan_p200',    title: '丁半200回',           description: '丁半を200回プレイ',                  type: 'achievement', target: 200,   rewardWC: 160_000,     statKey: 'totalChohanPlays' },
  { id: 'a_chohan_p2000',   title: '丁半2000回',          description: '丁半を2000回プレイ',                 type: 'achievement', target: 2000,  rewardWC: 1_600_000,   statKey: 'totalChohanPlays' },
  { id: 'a_chin_p200',      title: 'チンチロ200回',       description: 'チンチロを200回プレイ',              type: 'achievement', target: 200,   rewardWC: 160_000,     statKey: 'totalChinchiroPlays' },
  { id: 'a_chin_p2000',     title: 'チンチロ2000回',      description: 'チンチロを2000回プレイ',             type: 'achievement', target: 2000,  rewardWC: 1_600_000,   statKey: 'totalChinchiroPlays' },
  { id: 'a_poker_p200',     title: 'ポーカー200回',       description: 'ポーカーを200回プレイ',              type: 'achievement', target: 200,   rewardWC: 200_000,     statKey: 'totalPokerPlays' },
  { id: 'a_poker_p2000',    title: 'ポーカー2000回',      description: 'ポーカーを2000回プレイ',             type: 'achievement', target: 2000,  rewardWC: 2_000_000,   statKey: 'totalPokerPlays' },
  { id: 'a_coin_p200',      title: 'コイン200回',         description: 'コインを200回プレイ',                type: 'achievement', target: 200,   rewardWC: 160_000,     statKey: 'totalCoinFlipPlays' },
  { id: 'a_coin_p2000',     title: 'コイン2000回',        description: 'コインを2000回プレイ',               type: 'achievement', target: 2000,  rewardWC: 1_600_000,   statKey: 'totalCoinFlipPlays' },
  { id: 'a_hl_p200',        title: 'ハイロー200回',       description: 'ハイローを200回プレイ',              type: 'achievement', target: 200,   rewardWC: 200_000,     statKey: 'totalHighlowPlays' },
  { id: 'a_hl_p2000',       title: 'ハイロー2000回',      description: 'ハイローを2000回プレイ',             type: 'achievement', target: 2000,  rewardWC: 2_000_000,   statKey: 'totalHighlowPlays' },
  { id: 'a_hl_s7',          title: 'ハイロー7連勝',       description: 'ハイローで7連勝を達成',              type: 'achievement', target: 7,     rewardWC: 300_000,     statKey: 'maxHighlowStreak' },
  { id: 'a_wager_50m',      title: '五億賭け師',          description: '累計賭け額5億WC',                    type: 'achievement', target: 500_000_000,    rewardWC: 3_000_000,   statKey: 'totalWagered' },
  { id: 'a_wager_5b',       title: '五百億賭け師',        description: '累計賭け額500億WC',                  type: 'achievement', target: 50_000_000_000, rewardWC: 100_000_000, statKey: 'totalWagered' },
  { id: 'a_chohan_w200',    title: '丁半200勝',           description: '丁半で通算200勝',                    type: 'achievement', target: 200,   rewardWC: 300_000,     statKey: 'totalChohanWins' },
  { id: 'a_chin_w200',      title: 'チンチロ200勝',       description: 'チンチロで通算200勝',                type: 'achievement', target: 200,   rewardWC: 300_000,     statKey: 'totalChinchiroWins' },
  { id: 'a_poker_w200',     title: 'ポーカー200勝',       description: 'ポーカーで通算200勝',                type: 'achievement', target: 200,   rewardWC: 400_000,     statKey: 'totalPokerWins' },
  { id: 'a_coin_w200',      title: 'コイン200勝',         description: 'コインで通算200勝',                  type: 'achievement', target: 200,   rewardWC: 300_000,     statKey: 'totalCoinFlipWins' },
  { id: 'a_hl_w200',        title: 'ハイロー200勝',       description: 'ハイローで通算200勝',                type: 'achievement', target: 200,   rewardWC: 300_000,     statKey: 'totalHighlowWins' },
  { id: 'a_total_w2000',    title: '2000勝達成',          description: 'ギャンブル通算2000勝',               type: 'achievement', target: 2000,  rewardWC: 2_000_000,   statKey: 'totalWinCount' },
  { id: 'a_total_w3000',    title: '3000勝達成',          description: 'ギャンブル通算3000勝',               type: 'achievement', target: 3000,  rewardWC: 3_000_000,   statKey: 'totalWinCount' },
  { id: 'a_win_50k',        title: '小さな勝ち',          description: '累計勝利額5万WC',                    type: 'achievement', target: 50_000,         rewardWC: 5_000,       statKey: 'totalWinAmount' },
  { id: 'a_win_500k',       title: '50万の勝ち人',        description: '累計勝利額50万WC',                   type: 'achievement', target: 500_000,        rewardWC: 30_000,      statKey: 'totalWinAmount' },
  { id: 'a_win_5m',         title: '500万の勝ち人',       description: '累計勝利額500万WC',                  type: 'achievement', target: 5_000_000,      rewardWC: 200_000,     statKey: 'totalWinAmount' },
  { id: 'a_win_50m',        title: '5000万の勝ち人',      description: '累計勝利額5000万WC',                 type: 'achievement', target: 50_000_000,     rewardWC: 1_500_000,   statKey: 'totalWinAmount' },
  { id: 'a_win_500m',       title: '500億の勝ち人',       description: '累計勝利額500億WC',                  type: 'achievement', target: 5_000_000_000,  rewardWC: 20_000_000,  statKey: 'totalWinAmount' },
  { id: 'a_maxbet_5m',      title: '五百万ベット',        description: '1回のベット額500万WC',               type: 'achievement', target: 5_000_000,      rewardWC: 1_000_000,   statKey: 'maxSingleBet' },
  { id: 'a_maxbet_50m',     title: '五千万ベット',        description: '1回のベット額5000万WC',              type: 'achievement', target: 50_000_000,     rewardWC: 5_000_000,   statKey: 'maxSingleBet' },
  { id: 'a_maxwin_500k2',   title: '大きな利益',          description: '1回で50万WC以上の差益を得る',        type: 'achievement', target: 500_000,        rewardWC: 150_000,     statKey: 'maxSingleWin' },
  { id: 'a_maxwin_5m2',     title: '超大きな利益',        description: '1回で500万WC以上の差益を得る',       type: 'achievement', target: 5_000_000,      rewardWC: 800_000,     statKey: 'maxSingleWin' },
  { id: 'a_jp_7',           title: 'JP7回',               description: 'ジャックポットを7回当てる',           type: 'achievement', target: 7,    rewardWC: 7_000_000,   statKey: 'totalJackpotWins' },
  { id: 'a_lose_200',       title: '修羅の道',            description: '通算200回敗北',                      type: 'achievement', target: 200,   rewardWC: 100_000,     statKey: 'totalLoseCount' },
  { id: 'a_lose_2000',      title: '挫けない魂',          description: '通算2000回敗北',                     type: 'achievement', target: 2000,  rewardWC: 800_000,     statKey: 'totalLoseCount' },

  // =========================================================
  // ACHIEVEMENTS: 細かいマイルストーン追加
  // =========================================================
  { id: 'a_slot_3000',      title: 'スロット3000回',      description: 'スロットを3000回プレイ',             type: 'achievement', target: 3000,  rewardWC: 3_000_000,   statKey: 'totalSlotPlays' },
  { id: 'a_chohan_p3000',   title: '丁半3000回',          description: '丁半を3000回プレイ',                 type: 'achievement', target: 3000,  rewardWC: 2_400_000,   statKey: 'totalChohanPlays' },
  { id: 'a_chin_p3000',     title: 'チンチロ3000回',      description: 'チンチロを3000回プレイ',             type: 'achievement', target: 3000,  rewardWC: 2_400_000,   statKey: 'totalChinchiroPlays' },
  { id: 'a_poker_p3000',    title: 'ポーカー3000回',      description: 'ポーカーを3000回プレイ',             type: 'achievement', target: 3000,  rewardWC: 3_000_000,   statKey: 'totalPokerPlays' },
  { id: 'a_coin_p3000',     title: 'コイン3000回',        description: 'コインフリップを3000回プレイ',       type: 'achievement', target: 3000,  rewardWC: 2_400_000,   statKey: 'totalCoinFlipPlays' },
  { id: 'a_hl_p3000',       title: 'ハイロー3000回',      description: 'ハイローを3000回プレイ',             type: 'achievement', target: 3000,  rewardWC: 3_000_000,   statKey: 'totalHighlowPlays' },
  { id: 'a_chohan_w2000',   title: '丁半2000勝',          description: '丁半で通算2000勝',                   type: 'achievement', target: 2000,  rewardWC: 3_000_000,   statKey: 'totalChohanWins' },
  { id: 'a_chin_w2000',     title: 'チンチロ2000勝',      description: 'チンチロで通算2000勝',               type: 'achievement', target: 2000,  rewardWC: 3_000_000,   statKey: 'totalChinchiroWins' },
  { id: 'a_coin_w2000',     title: 'コイン2000勝',        description: 'コインで通算2000勝',                 type: 'achievement', target: 2000,  rewardWC: 3_000_000,   statKey: 'totalCoinFlipWins' },
  { id: 'a_hl_w2000',       title: 'ハイロー2000勝',      description: 'ハイローで通算2000勝',               type: 'achievement', target: 2000,  rewardWC: 3_000_000,   statKey: 'totalHighlowWins' },
  { id: 'a_poker_w2000',    title: 'ポーカー2000勝',      description: 'ポーカーで通算2000勝',               type: 'achievement', target: 2000,  rewardWC: 4_000_000,   statKey: 'totalPokerWins' },
  { id: 'a_total_w20000',   title: '2万勝達成',           description: 'ギャンブル通算20000勝',              type: 'achievement', target: 20000, rewardWC: 20_000_000,  statKey: 'totalWinCount' },
  { id: 'a_lose_10000',     title: '不死鳥',              description: '通算10000回敗北',                    type: 'achievement', target: 10000, rewardWC: 5_000_000,   statKey: 'totalLoseCount' },
  { id: 'a_maxbet_500m',    title: '五億ベット',          description: '1回のベット額5億WC',                 type: 'achievement', target: 500_000_000, rewardWC: 30_000_000, statKey: 'maxSingleBet' },
  { id: 'a_win_10b',        title: '超兆の勝ち人',        description: '累計勝利額1兆WC',                    type: 'achievement', target: 100_000_000_000, rewardWC: 100_000_000, statKey: 'totalWinAmount' },
  { id: 'a_jp_2',           title: 'JP2回',               description: 'ジャックポットを2回当てる',           type: 'achievement', target: 2,    rewardWC: 1_000_000,   statKey: 'totalJackpotWins' },
  { id: 'a_hl_s4',          title: 'ハイロー4連勝',       description: 'ハイローで4連勝を達成',              type: 'achievement', target: 4,     rewardWC: 60_000,      statKey: 'maxHighlowStreak' },
  { id: 'a_hl_s6',          title: 'ハイロー6連勝',       description: 'ハイローで6連勝を達成',              type: 'achievement', target: 6,     rewardWC: 200_000,     statKey: 'maxHighlowStreak' },
  { id: 'a_hl_s8',          title: 'ハイロー8連勝',       description: 'ハイローで8連勝を達成',              type: 'achievement', target: 8,     rewardWC: 500_000,     statKey: 'maxHighlowStreak' },
  { id: 'a_wager_10k',      title: '一万賭け人',          description: '累計賭け額10万WC',                   type: 'achievement', target: 100_000,         rewardWC: 5_000,       statKey: 'totalWagered' },
  { id: 'a_wager_500k',     title: '五百万賭け人',        description: '累計賭け額500万WC',                  type: 'achievement', target: 5_000_000,       rewardWC: 150_000,     statKey: 'totalWagered' },
  { id: 'a_wager_20m',      title: '二億賭け師',          description: '累計賭け額2億WC',                    type: 'achievement', target: 200_000_000,     rewardWC: 5_000_000,   statKey: 'totalWagered' },
  { id: 'a_wager_500m',     title: '五十億賭け師',        description: '累計賭け額50億WC',                   type: 'achievement', target: 5_000_000_000,   rewardWC: 30_000_000,  statKey: 'totalWagered' },
  { id: 'a_slot_20',        title: 'スロット20回',        description: 'スロットを20回プレイ',               type: 'achievement', target: 20,    rewardWC: 20_000,      statKey: 'totalSlotPlays' },
  { id: 'a_chohan_p20',     title: '丁半20回',            description: '丁半を20回プレイ',                   type: 'achievement', target: 20,    rewardWC: 16_000,      statKey: 'totalChohanPlays' },
  { id: 'a_chin_p20',       title: 'チンチロ20回',        description: 'チンチロを20回プレイ',               type: 'achievement', target: 20,    rewardWC: 16_000,      statKey: 'totalChinchiroPlays' },
  { id: 'a_poker_p20',      title: 'ポーカー20回',        description: 'ポーカーを20回プレイ',               type: 'achievement', target: 20,    rewardWC: 20_000,      statKey: 'totalPokerPlays' },
  { id: 'a_coin_p20',       title: 'コイン20回',          description: 'コインフリップを20回プレイ',         type: 'achievement', target: 20,    rewardWC: 16_000,      statKey: 'totalCoinFlipPlays' },
  { id: 'a_hl_p20',         title: 'ハイロー20回',        description: 'ハイローを20回プレイ',               type: 'achievement', target: 20,    rewardWC: 20_000,      statKey: 'totalHighlowPlays' },
  { id: 'a_chohan_w20',     title: '丁半20勝',            description: '丁半で通算20勝',                     type: 'achievement', target: 20,    rewardWC: 30_000,      statKey: 'totalChohanWins' },
  { id: 'a_chin_w20',       title: 'チンチロ20勝',        description: 'チンチロで通算20勝',                 type: 'achievement', target: 20,    rewardWC: 30_000,      statKey: 'totalChinchiroWins' },
  { id: 'a_poker_w20',      title: 'ポーカー20勝',        description: 'ポーカーで通算20勝',                 type: 'achievement', target: 20,    rewardWC: 40_000,      statKey: 'totalPokerWins' },
  { id: 'a_coin_w20',       title: 'コイン20勝',          description: 'コインで通算20勝',                   type: 'achievement', target: 20,    rewardWC: 30_000,      statKey: 'totalCoinFlipWins' },
  { id: 'a_hl_w20',         title: 'ハイロー20勝',        description: 'ハイローで通算20勝',                 type: 'achievement', target: 20,    rewardWC: 30_000,      statKey: 'totalHighlowWins' },
  { id: 'a_total_w50',      title: '50勝達成',            description: 'ギャンブル通算50勝',                 type: 'achievement', target: 50,    rewardWC: 50_000,      statKey: 'totalWinCount' },
  { id: 'a_total_w200',     title: '200勝達成',           description: 'ギャンブル通算200勝',                type: 'achievement', target: 200,   rewardWC: 200_000,     statKey: 'totalWinCount' },
  { id: 'a_total_w7000',    title: '7000勝達成',          description: 'ギャンブル通算7000勝',               type: 'achievement', target: 7000,  rewardWC: 7_000_000,   statKey: 'totalWinCount' },
  { id: 'a_lose_3000',      title: '百戦錬磨',            description: '通算3000回敗北',                     type: 'achievement', target: 3000,  rewardWC: 1_200_000,   statKey: 'totalLoseCount' },
  { id: 'a_chohan_p5000',   title: '丁半5000回',          description: '丁半を5000回プレイ',                 type: 'achievement', target: 5000,  rewardWC: 4_000_000,   statKey: 'totalChohanPlays' },
  { id: 'a_slot_7000',      title: 'スロット7000回',      description: 'スロットを7000回プレイ',             type: 'achievement', target: 7000,  rewardWC: 7_000_000,   statKey: 'totalSlotPlays' },
  { id: 'a_poker_w5000',    title: 'ポーカー5000勝',      description: 'ポーカーで通算5000勝',               type: 'achievement', target: 5000,  rewardWC: 8_000_000,   statKey: 'totalPokerWins' },

  // =========================================================
  // ACHIEVEMENTS: 新規ゲーム
  // =========================================================
  { id: 'a_mines_p10',      title: 'マイン入門',          description: 'ミニマインを10回プレイ',             type: 'achievement', target: 10,    rewardWC: 10_000,      statKey: 'totalMinesPlays' },
  { id: 'a_mines_p100',     title: 'マイン好き',          description: 'ミニマインを100回プレイ',            type: 'achievement', target: 100,   rewardWC: 100_000,     statKey: 'totalMinesPlays' },
  { id: 'a_mines_p500',     title: 'マイン常連',          description: 'ミニマインを500回プレイ',            type: 'achievement', target: 500,   rewardWC: 500_000,     statKey: 'totalMinesPlays' },
  { id: 'a_mines_w10',      title: 'マイン10勝',          description: 'ミニマインで通算10勝',               type: 'achievement', target: 10,    rewardWC: 15_000,      statKey: 'totalMinesWins' },
  { id: 'a_mines_w100',     title: 'マイン100勝',         description: 'ミニマインで通算100勝',              type: 'achievement', target: 100,   rewardWC: 150_000,     statKey: 'totalMinesWins' },
  { id: 'a_mines_w500',     title: 'マイン500勝',         description: 'ミニマインで通算500勝',              type: 'achievement', target: 500,   rewardWC: 750_000,     statKey: 'totalMinesWins' },
  { id: 'a_dicerace_p10',   title: 'ダイスレース入門',    description: 'ダイスレースを10回プレイ',           type: 'achievement', target: 10,    rewardWC: 10_000,      statKey: 'totalDiceRacePlays' },
  { id: 'a_dicerace_p100',  title: 'ダイスレース好き',    description: 'ダイスレースを100回プレイ',          type: 'achievement', target: 100,   rewardWC: 100_000,     statKey: 'totalDiceRacePlays' },
  { id: 'a_dicerace_w10',   title: 'ダイスレース10勝',    description: 'ダイスレースで通算10勝',             type: 'achievement', target: 10,    rewardWC: 15_000,      statKey: 'totalDiceRaceWins' },
  { id: 'a_dicerace_w100',  title: 'ダイスレース100勝',   description: 'ダイスレースで通算100勝',            type: 'achievement', target: 100,   rewardWC: 150_000,     statKey: 'totalDiceRaceWins' },
  { id: 'a_roulette_p10',   title: 'ルーレット入門',      description: 'ルーレットを10回プレイ',             type: 'achievement', target: 10,    rewardWC: 10_000,      statKey: 'totalRoulettePlays' },
  { id: 'a_roulette_p100',  title: 'ルーレット好き',      description: 'ルーレットを100回プレイ',            type: 'achievement', target: 100,   rewardWC: 100_000,     statKey: 'totalRoulettePlays' },
  { id: 'a_roulette_w10',   title: 'ルーレット10勝',      description: 'ルーレットで通算10勝',               type: 'achievement', target: 10,    rewardWC: 15_000,      statKey: 'totalRouletteWins' },
  { id: 'a_roulette_w100',  title: 'ルーレット100勝',     description: 'ルーレットで通算100勝',              type: 'achievement', target: 100,   rewardWC: 150_000,     statKey: 'totalRouletteWins' },
  { id: 'a_bj_p10',         title: 'BJ入門',              description: 'ブラックジャックを10回プレイ',       type: 'achievement', target: 10,    rewardWC: 10_000,      statKey: 'totalBlackjackPlays' },
  { id: 'a_bj_p100',        title: 'BJ好き',              description: 'ブラックジャックを100回プレイ',      type: 'achievement', target: 100,   rewardWC: 100_000,     statKey: 'totalBlackjackPlays' },
  { id: 'a_bj_w10',         title: 'BJ10勝',              description: 'ブラックジャックで通算10勝',         type: 'achievement', target: 10,    rewardWC: 15_000,      statKey: 'totalBlackjackWins' },
  { id: 'a_bj_w100',        title: 'BJ100勝',             description: 'ブラックジャックで通算100勝',        type: 'achievement', target: 100,   rewardWC: 150_000,     statKey: 'totalBlackjackWins' },
  { id: 'a_scratch_p10',    title: 'スクラッチ入門',      description: 'スクラッチを10回プレイ',             type: 'achievement', target: 10,    rewardWC: 10_000,      statKey: 'totalScratchPlays' },
  { id: 'a_scratch_p100',   title: 'スクラッチ好き',      description: 'スクラッチを100回プレイ',            type: 'achievement', target: 100,   rewardWC: 100_000,     statKey: 'totalScratchPlays' },
  { id: 'a_scratch_w10',    title: 'スクラッチ10勝',      description: 'スクラッチで通算10勝',               type: 'achievement', target: 10,    rewardWC: 15_000,      statKey: 'totalScratchWins' },
  { id: 'a_scratch_w100',   title: 'スクラッチ100勝',     description: 'スクラッチで通算100勝',              type: 'achievement', target: 100,   rewardWC: 150_000,     statKey: 'totalScratchWins' },
  { id: 'a_race_p10',       title: 'レース入門',          description: 'ミニレースを10回プレイ',             type: 'achievement', target: 10,    rewardWC: 10_000,      statKey: 'totalRacePlays' },
  { id: 'a_race_p100',      title: 'レース好き',          description: 'ミニレースを100回プレイ',            type: 'achievement', target: 100,   rewardWC: 100_000,     statKey: 'totalRacePlays' },
  { id: 'a_race_w10',       title: 'レース10勝',          description: 'ミニレースで通算10勝',               type: 'achievement', target: 10,    rewardWC: 15_000,      statKey: 'totalRaceWins' },
  { id: 'a_race_w100',      title: 'レース100勝',         description: 'ミニレースで通算100勝',              type: 'achievement', target: 100,   rewardWC: 150_000,     statKey: 'totalRaceWins' },
];

// ============================================================
// 称号 (rank-limited)
// ============================================================
export const GAMBLE_TITLES: Record<string, { label: string; color: string; requiredMissionId?: string; requiredRank?: string }> = {
  'title_gambler':       { label: '🎲 ギャンブラー',        color: '#4caf87', requiredRank: 'ギャンブラー' },
  'title_skilled':       { label: '🎯 熟練ギャンブラー',    color: '#5b8dee', requiredRank: '熟練ギャンブラー' },
  'title_king':          { label: '👑 賭博王',              color: '#f0a040', requiredRank: '賭博王' },
  'title_legend':        { label: '🌟 レジェンド',          color: '#e060e0', requiredRank: 'レジェンド' },
  'title_slot_god':      { label: '🎰 スロット神',          color: '#f0c060', requiredMissionId: 'a_slot_10000' },
  'title_chohan_master': { label: '🎲 丁半の覇者',          color: '#4caf87', requiredMissionId: 'a_chohan_w3000' },
  'title_poker_king':    { label: '🃏 ポーカーキング',       color: '#5b8dee', requiredMissionId: 'a_poker_w3000' },
  'title_highlow_legend':{ label: '🃏 ハイロー10連勝',      color: '#e060e0', requiredMissionId: 'a_hl_s10' },
  'title_jackpot_master':{ label: '💰 JPマスター',          color: '#f0c060', requiredMissionId: 'a_jp_10' },
  'title_big_loser':     { label: '💀 不屈の精神',          color: '#8a92b2', requiredMissionId: 'a_lose_5000' },
  'title_iron_will':     { label: '🔥 鉄の意志',            color: '#e05555', requiredMissionId: 'a_lose_5000' },
};

// ============================================================
// デフォルトMissionProgress
// ============================================================
export function defaultMissionProgress(): import('../types/game').MissionProgress {
  const now = Date.now();
  return {
    dailySlotPlays: 0, dailyChohanWins: 0, dailyChinchiroWins: 0,
    dailyCoinFlipWins: 0, dailyHighlowWins: 0, dailyPokerWins: 0, dailyGamblePlays: 0,
    dailyMinesWins: 0, dailyDiceRaceWins: 0, dailyRouletteWins: 0,
    dailyBlackjackWins: 0, dailyScratchWins: 0, dailyRaceWins: 0,
    weeklySlotPlays: 0, weeklyChohanWins: 0, weeklyChinchiroWins: 0,
    weeklyPokerWins: 0, weeklyGamblePlays: 0, weeklyHighlowMaxStreak: 0,
    weeklyMinesWins: 0, weeklyDiceRaceWins: 0, weeklyRouletteWins: 0,
    weeklyBlackjackWins: 0, weeklyScratchWins: 0, weeklyRaceWins: 0,
    totalSlotPlays: 0, totalChohanPlays: 0, totalChohanWins: 0,
    totalChinchiroPlays: 0, totalChinchiroWins: 0,
    totalPokerPlays: 0, totalPokerWins: 0,
    totalCoinFlipPlays: 0, totalCoinFlipWins: 0,
    totalHighlowPlays: 0, totalHighlowWins: 0, totalHighlowMaxStreak: 0,
    totalMinesPlays: 0, totalMinesWins: 0,
    totalDiceRacePlays: 0, totalDiceRaceWins: 0,
    totalRoulettePlays: 0, totalRouletteWins: 0,
    totalBlackjackPlays: 0, totalBlackjackWins: 0,
    totalScratchPlays: 0, totalScratchWins: 0,
    totalRacePlays: 0, totalRaceWins: 0,
    totalJackpotWins: 0, totalWagered: 0, totalWinAmount: 0,
    totalLoseCount: 0, totalWinCount: 0, maxSingleWin: 0, maxSingleBet: 0,
    maxHighlowStreak: 0,
    dailyResetAt: now, weeklyResetAt: now,
    completedMissions: [], claimedMissions: [],
  };
}

export function ensureMissionProgress(mp: Partial<import('../types/game').MissionProgress> | undefined): import('../types/game').MissionProgress {
  const def = defaultMissionProgress();
  if (!mp) return def;
  return { ...def, ...mp, completedMissions: mp.completedMissions ?? [], claimedMissions: mp.claimedMissions ?? [] };
}
