// src/types/wiki.ts
// 攻略WIKI機能の型定義。
// 本文は raw HTML を保存せず、block配列 + inline run配列の structured データとして保持する。

// ============================================================
// インラインラン（テキストの装飾単位）
// ============================================================
export type InlineRunKind = 'text' | 'internalLink' | 'iconEmbed';

export interface InlineRunMarks {
  bold?: boolean;
  italic?: boolean;
  color?: string; // 例: '#f0c060'
}

export interface InlineRun {
  kind: InlineRunKind;
  // kind === 'text' のときに使用
  text?: string;
  marks?: InlineRunMarks;
  // kind === 'internalLink' のときに使用
  linkPageId?: string;     // 既存ページのid（未作成リンクの場合は空文字）
  linkLabel?: string;      // 表示名（ページが見つからない場合のフォールバック表示にも使う）
  // kind === 'iconEmbed' のときに使用
  iconId?: string;         // GameIcon の id、または PNGアイコンID
  iconSourceType?: 'item' | 'monster' | 'dungeon' | 'icon'; // アイコンの取得元
  iconRefId?: string;      // item/monster/dungeon のマスターID（参照表示用）
  iconLabel?: string;      // アイコン横に表示するラベル（省略可）
}

// ============================================================
// コンテンツブロック
// ============================================================
export type BlockKind =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'paragraph'
  | 'bulletList'
  | 'orderedList'
  | 'quote'
  | 'divider';

export interface ContentBlock {
  id: string;
  kind: BlockKind;
  // heading1/2/3, paragraph, quote で使用（単一行の run配列）
  runs?: InlineRun[];
  // bulletList / orderedList で使用（各項目が run配列を持つ）
  items?: InlineRun[][];
}

// ============================================================
// カテゴリ・テンプレート
// ============================================================
export type WikiCategory =
  | 'item'
  | 'weapon'
  | 'armor'
  | 'material'
  | 'dungeon'
  | 'beginner_guide'
  | 'glossary'
  | 'faq'
  | 'collection'
  | 'strategy_chart'
  | 'other';

export const WIKI_CATEGORY_LABELS: Record<WikiCategory, string> = {
  item: 'アイテム',
  weapon: '武器',
  armor: '防具',
  material: '素材',
  dungeon: 'ダンジョン',
  beginner_guide: '初心者向けガイド',
  glossary: '用語集',
  faq: 'よくある質問',
  collection: '収集図鑑',
  strategy_chart: '攻略チャート',
  other: 'その他',
};

export type WikiTemplateId =
  | 'item'
  | 'weapon'
  | 'armor'
  | 'material'
  | 'dungeon'
  | 'beginner_guide'
  | 'glossary'
  | 'faq'
  | 'collection'
  | 'strategy_chart'
  | 'blank';

// ============================================================
// ページ本体（Firestore: wiki_pages/{pageId}）
// ============================================================
export interface WikiPage {
  id: string;
  slug: string;
  title: string;
  category: WikiCategory;
  tags: string[];
  summary: string;
  contentBlocks: ContentBlock[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  createdByName: string;
  updatedBy: string;
  updatedByName: string;
  viewCount: number;
  likeCount: number;
  isLocked: boolean;
  isProtected: boolean;
  isOfficial: boolean;
  isVerified: boolean;
  latestRevisionId: string;
  revisionCount: number;
  // ページ名変更によるリダイレクト先pageId（自身がリダイレクトページの場合のみ設定）
  redirectTo?: string;
  // 関連付け（マスタデータと自動連携するページの場合に設定）
  linkedMasterType?: 'item' | 'monster' | 'dungeon';
  linkedMasterId?: string;
}

// 新規作成時に必須フィールドのみで済むようにした入力型
export type WikiPageInput = {
  slug: string;
  title: string;
  category: WikiCategory;
  tags: string[];
  summary: string;
  contentBlocks: ContentBlock[];
  linkedMasterType?: 'item' | 'monster' | 'dungeon';
  linkedMasterId?: string;
};

// ============================================================
// 履歴（Firestore: wiki_pages/{pageId}/revisions/{revisionId}）
// ============================================================
export interface WikiRevision {
  id: string;
  pageId: string;
  editorUid: string;
  editorName: string;
  editedAt: number;
  editSummary: string;
  title: string;
  contentBlocks: ContentBlock[];
  // 簡易diff情報：直前リビジョンとのブロック数差分など
  diffSummary?: { added: number; removed: number; changed: number };
}

// ============================================================
// 通報（Firestore: wiki_pages/{pageId}/reports/{reportId}）
// ============================================================
export type WikiReportReason = 'spam' | 'inappropriate' | 'vandalism' | 'copyright' | 'other';

export interface WikiReport {
  id: string;
  pageId: string;
  reporterUid: string;
  reason: WikiReportReason;
  comment: string;
  createdAt: number;
  resolved: boolean;
}

// ============================================================
// 最近の更新（Firestore: wiki_recent_changes/{changeId}）
// 検索・一覧を軽量にクエリできるよう、ページ更新ごとに薄いレコードを追加する。
// ============================================================
export interface WikiRecentChange {
  id: string;
  pageId: string;
  pageTitle: string;
  category: WikiCategory;
  editorUid: string;
  editorName: string;
  editedAt: number;
  editSummary: string;
  changeType: 'create' | 'update' | 'revert';
}

// ============================================================
// 画面遷移state
// ============================================================
export type WikiViewMode = 'home' | 'page' | 'edit' | 'history' | 'search' | 'category' | 'tag';

export interface WikiNavState {
  mode: WikiViewMode;
  pageId?: string;     // page/edit/history で対象ページID
  pageSlugOrTitle?: string; // ページ未作成時、リンク元から渡される表示名
  searchQuery?: string;
  category?: WikiCategory;
  tag?: string;
  templateId?: WikiTemplateId; // edit(新規作成)時に使うテンプレート
}

// アイコン挿入UIの検索ソース種別
export type IconPickerSource = 'item' | 'weapon' | 'armor' | 'material' | 'monster' | 'dungeon' | 'recent' | 'all';
