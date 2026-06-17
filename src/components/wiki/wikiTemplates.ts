// src/components/wiki/wikiTemplates.ts
// ページテンプレート：見出し構成・基本情報欄・入手方法欄などをあらかじめ用意する。

import type { ContentBlock, WikiCategory, WikiTemplateId, InlineRun } from '../../types/wiki';

let _blockSeq = 0;
function bid(): string {
  _blockSeq += 1;
  return `b_${Date.now().toString(36)}_${_blockSeq}`;
}

function text(t: string, marks?: InlineRun['marks']): InlineRun {
  return { kind: 'text', text: t, ...(marks ? { marks } : {}) };
}

function heading(level: 1 | 2 | 3, t: string): ContentBlock {
  return { id: bid(), kind: level === 1 ? 'heading1' : level === 2 ? 'heading2' : 'heading3', runs: [text(t)] };
}

function paragraph(t: string): ContentBlock {
  return { id: bid(), kind: 'paragraph', runs: [text(t)] };
}

function divider(): ContentBlock {
  return { id: bid(), kind: 'divider' };
}

function iconEmbedBlock(iconId: string, sourceType: 'item' | 'monster' | 'dungeon' | 'icon', refId: string, label: string): ContentBlock {
  return {
    id: bid(),
    kind: 'paragraph',
    runs: [{ kind: 'iconEmbed', iconId, iconSourceType: sourceType, iconRefId: refId, iconLabel: label }, text(`  ${label}`)],
  };
}

export interface WikiTemplateDef {
  id: WikiTemplateId;
  label: string;
  emoji: string;
  category: WikiCategory;
  description: string;
  build: (opts?: { title?: string; iconId?: string; sourceType?: 'item' | 'monster' | 'dungeon' | 'icon'; refId?: string }) => ContentBlock[];
}

export const WIKI_TEMPLATES: WikiTemplateDef[] = [
  {
    id: 'item',
    label: 'アイテムページ',
    emoji: '🧪',
    category: 'item',
    description: 'アイテムの基本情報・入手方法・用途をまとめるテンプレート。',
    build: (opts) => [
      ...(opts?.iconId ? [iconEmbedBlock(opts.iconId, opts.sourceType ?? 'item', opts.refId ?? '', opts.title ?? 'アイテム')] : []),
      heading(2, '基本情報'),
      paragraph('（レアリティ・売却価格・スタック数などをここに記載）'),
      heading(2, '入手方法'),
      paragraph('（採取・ダンジョンドロップ・クラフトなどの入手手段を記載）'),
      heading(2, '用途'),
      paragraph('（クラフト材料・装備強化・売却用途などを記載）'),
      heading(2, '攻略メモ'),
      paragraph('（効率的な集め方や使い方のコツを記載）'),
      divider(),
      heading(3, '関連ページ'),
      paragraph('（関連する武器・防具・ダンジョンページへのリンクをここに追加）'),
    ],
  },
  {
    id: 'weapon',
    label: '武器ページ',
    emoji: '⚔️',
    category: 'weapon',
    description: '武器の性能・入手方法・運用方法をまとめるテンプレート。',
    build: (opts) => [
      ...(opts?.iconId ? [iconEmbedBlock(opts.iconId, opts.sourceType ?? 'item', opts.refId ?? '', opts.title ?? '武器')] : []),
      heading(2, '基本情報'),
      paragraph('（攻撃力・レアリティ・必要素材などを記載）'),
      heading(2, '入手方法'),
      paragraph('（クラフト・ドロップなどの入手手段を記載）'),
      heading(2, '用途・運用'),
      paragraph('（おすすめの使い方、相性の良いダンジョンなどを記載）'),
      heading(2, '攻略メモ'),
      paragraph('（強化のコツ、立ち回りなどを記載）'),
      divider(),
      heading(3, '関連ページ'),
      paragraph('（同系統の武器や対応する防具ページへのリンクをここに追加）'),
    ],
  },
  {
    id: 'armor',
    label: '防具ページ',
    emoji: '🛡️',
    category: 'armor',
    description: '防具の性能・入手方法・セット運用をまとめるテンプレート。',
    build: (opts) => [
      ...(opts?.iconId ? [iconEmbedBlock(opts.iconId, opts.sourceType ?? 'item', opts.refId ?? '', opts.title ?? '防具')] : []),
      heading(2, '基本情報'),
      paragraph('（防御力・防具強度・移動速度補正などを記載）'),
      heading(2, '入手方法'),
      paragraph('（クラフト・ドロップなどの入手手段を記載）'),
      heading(2, '用途'),
      paragraph('（セット運用や着用推奨シーンを記載）'),
      heading(2, '攻略メモ'),
      paragraph('（強化優先度や組み合わせのコツを記載）'),
      divider(),
      heading(3, '関連ページ'),
      paragraph('（同系統の防具ページへのリンクをここに追加）'),
    ],
  },
  {
    id: 'material',
    label: '素材ページ',
    emoji: '⛏️',
    category: 'material',
    description: '素材の入手場所・用途をまとめるテンプレート。',
    build: (opts) => [
      ...(opts?.iconId ? [iconEmbedBlock(opts.iconId, opts.sourceType ?? 'item', opts.refId ?? '', opts.title ?? '素材')] : []),
      heading(2, '基本情報'),
      paragraph('（レアリティ・売却価格などを記載）'),
      heading(2, '入手方法'),
      paragraph('（採取・採掘・ドロップ元などを記載）'),
      heading(2, '用途'),
      paragraph('（クラフトレシピでの使い道を記載）'),
      heading(2, '攻略メモ'),
      paragraph('（効率の良い集め方を記載）'),
    ],
  },
  {
    id: 'dungeon',
    label: 'ダンジョンページ',
    emoji: '🏰',
    category: 'dungeon',
    description: 'ダンジョンの構成・出現モンスター・攻略法をまとめるテンプレート。',
    build: (opts) => [
      ...(opts?.iconId ? [iconEmbedBlock(opts.iconId, opts.sourceType ?? 'dungeon', opts.refId ?? '', opts.title ?? 'ダンジョン')] : []),
      heading(2, '基本情報'),
      paragraph('（推奨レベル・階層数・経験値/ゴールド倍率などを記載）'),
      heading(2, '出現モンスター'),
      paragraph('（各エリアの出現モンスターとボス情報を記載）'),
      heading(2, '攻略チャート'),
      paragraph('（エリアごとの立ち回り、危険エリアの注意点を記載）'),
      heading(2, '入手アイテム'),
      paragraph('（ドロップする主な素材・装備を記載）'),
      heading(2, '攻略メモ'),
      paragraph('（推奨装備や立ち回りのコツを記載）'),
      divider(),
      heading(3, '関連ページ'),
      paragraph('（前後のダンジョンや関連装備ページへのリンクをここに追加）'),
    ],
  },
  {
    id: 'beginner_guide',
    label: '初心者向けガイド',
    emoji: '🔰',
    category: 'beginner_guide',
    description: '序盤の進め方をまとめるガイドテンプレート。',
    build: () => [
      heading(1, 'はじめに'),
      paragraph('このゲームを始めたばかりの方向けのガイドです。'),
      heading(2, '最初にすべきこと'),
      paragraph('（採取・ステータス確認など最初の行動を記載）'),
      heading(2, 'レベル上げの流れ'),
      paragraph('（推奨ダンジョン進行順、狩場の目安を記載）'),
      heading(2, '装備の整え方'),
      paragraph('（クラフトの優先順位、序盤おすすめ装備を記載）'),
      heading(2, 'よくある失敗'),
      paragraph('（初心者が陥りがちなミスとその対策を記載）'),
      divider(),
      heading(3, '関連ページ'),
      paragraph('（用語集やよくある質問ページへのリンクをここに追加）'),
    ],
  },
  {
    id: 'glossary',
    label: '用語集',
    emoji: '📖',
    category: 'glossary',
    description: 'ゲーム内用語の意味をまとめるテンプレート。',
    build: () => [
      heading(1, '用語集'),
      paragraph('ゲーム内で使われる用語をまとめています。'),
      heading(2, '用語A'),
      paragraph('（説明文をここに記載）'),
      heading(2, '用語B'),
      paragraph('（説明文をここに記載）'),
    ],
  },
  {
    id: 'faq',
    label: 'よくある質問',
    emoji: '❓',
    category: 'faq',
    description: 'よくある質問と回答をまとめるテンプレート。',
    build: () => [
      heading(1, 'よくある質問'),
      heading(3, 'Q. 質問内容をここに記載'),
      paragraph('A. 回答内容をここに記載'),
      heading(3, 'Q. 質問内容をここに記載'),
      paragraph('A. 回答内容をここに記載'),
    ],
  },
  {
    id: 'collection',
    label: '収集図鑑系ページ',
    emoji: '📚',
    category: 'collection',
    description: '図鑑・コレクション系の一覧をまとめるテンプレート。',
    build: () => [
      heading(1, '図鑑一覧'),
      paragraph('対象のコレクション要素を一覧でまとめています。'),
      heading(2, '一覧'),
      { id: bid(), kind: 'bulletList', items: [[text('項目1の説明')], [text('項目2の説明')]] } as ContentBlock,
      heading(2, '入手状況の確認方法'),
      paragraph('（図鑑の確認場所や進捗の見方を記載）'),
    ],
  },
  {
    id: 'strategy_chart',
    label: '攻略チャート系ページ',
    emoji: '🗺️',
    category: 'strategy_chart',
    description: '進行ルートをチャート形式でまとめるテンプレート。',
    build: () => [
      heading(1, '攻略チャート'),
      paragraph('効率的な進行ルートをまとめています。'),
      heading(2, '序盤'),
      { id: bid(), kind: 'orderedList', items: [[text('やること1')], [text('やること2')]] } as ContentBlock,
      heading(2, '中盤'),
      { id: bid(), kind: 'orderedList', items: [[text('やること1')], [text('やること2')]] } as ContentBlock,
      heading(2, '終盤'),
      { id: bid(), kind: 'orderedList', items: [[text('やること1')]] } as ContentBlock,
    ],
  },
  {
    id: 'blank',
    label: '白紙から作成',
    emoji: '📄',
    category: 'other',
    description: '何も入れずに白紙のページから作成します。',
    build: () => [paragraph('')],
  },
];

export function getTemplateById(id: WikiTemplateId): WikiTemplateDef {
  return WIKI_TEMPLATES.find(t => t.id === id) ?? WIKI_TEMPLATES[WIKI_TEMPLATES.length - 1];
}
