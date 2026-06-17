// src/services/wikiService.ts
// 攻略WIKI機能のFirestore通信を担うモジュール。
// database.ts と同様の方針（必要なときだけRead/Write）に揃える。

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit as fbLimit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  WikiPage,
  WikiPageInput,
  WikiRevision,
  WikiReport,
  WikiReportReason,
  WikiRecentChange,
  WikiCategory,
  ContentBlock,
} from '../types/wiki';

// ============================================================
// コレクション名定数
// ============================================================
const WIKI_COLLECTIONS = {
  PAGES: 'wiki_pages',
  RECENT_CHANGES: 'wiki_recent_changes',
} as const;

// App.tsx の ADMIN_UIDS と同じ値（admin判定を独立して持つ）
export const WIKI_ADMIN_UIDS = ['jJ7BrZ0HhpeC5WYsdZbjRlQBRzK2', '49yFkciBJLhFbFq7YJrbg8dI8rf2'];
export function isWikiAdmin(uid: string | null | undefined): boolean {
  return !!uid && WIKI_ADMIN_UIDS.includes(uid);
}

// ============================================================
// バリデーション（クライアント側の最終防衛。Firestore rulesでも別途制約する）
// ============================================================
export const WIKI_LIMITS = {
  TITLE_MAX: 60,
  SLUG_MAX: 80,
  SUMMARY_MAX: 200,
  TAG_MAX: 20,
  TAG_COUNT_MAX: 10,
  EDIT_SUMMARY_MAX: 120,
  BLOCK_COUNT_MAX: 400,
  RUN_TEXT_MAX: 2000,
} as const;

export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\w\u3040-\u30ff\u3400-\u9fff\-]/g, '')
    .slice(0, WIKI_LIMITS.SLUG_MAX) || `page-${Date.now()}`;
}

export function validatePageInput(input: WikiPageInput): string | null {
  if (!input.title || input.title.trim().length === 0) return 'タイトルを入力してください';
  if (input.title.length > WIKI_LIMITS.TITLE_MAX) return `タイトルは${WIKI_LIMITS.TITLE_MAX}文字以内にしてください`;
  if (input.summary && input.summary.length > WIKI_LIMITS.SUMMARY_MAX) return `概要は${WIKI_LIMITS.SUMMARY_MAX}文字以内にしてください`;
  if (input.tags.length > WIKI_LIMITS.TAG_COUNT_MAX) return `タグは${WIKI_LIMITS.TAG_COUNT_MAX}個以内にしてください`;
  if (input.tags.some(t => t.length > WIKI_LIMITS.TAG_MAX)) return `タグは${WIKI_LIMITS.TAG_MAX}文字以内にしてください`;
  if (input.contentBlocks.length > WIKI_LIMITS.BLOCK_COUNT_MAX) return 'ページ内容が長すぎます';
  return null;
}

function diffSummaryOf(prevBlocks: ContentBlock[], nextBlocks: ContentBlock[]) {
  const prevIds = new Set(prevBlocks.map(b => b.id));
  const nextIds = new Set(nextBlocks.map(b => b.id));
  let added = 0, removed = 0, changed = 0;
  for (const b of nextBlocks) if (!prevIds.has(b.id)) added++;
  for (const b of prevBlocks) if (!nextIds.has(b.id)) removed++;
  const prevMap = new Map(prevBlocks.map(b => [b.id, b]));
  for (const b of nextBlocks) {
    const prev = prevMap.get(b.id);
    if (prev && JSON.stringify(prev) !== JSON.stringify(b)) changed++;
  }
  return { added, removed, changed };
}

// ============================================================
// ページ取得
// ============================================================
export async function fetchWikiPage(pageId: string): Promise<WikiPage | null> {
  const ref = doc(db, WIKI_COLLECTIONS.PAGES, pageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<WikiPage, 'id'>) };
}

/** タイトルまたはslugで検索（完全一致優先 → 部分一致フォールバック） */
export async function findWikiPageByTitleOrSlug(titleOrSlug: string): Promise<WikiPage | null> {
  const col = collection(db, WIKI_COLLECTIONS.PAGES);
  const normalizedSlug = slugify(titleOrSlug);

  const slugQ = query(col, where('slug', '==', normalizedSlug), fbLimit(1));
  const slugSnap = await getDocs(slugQ);
  if (!slugSnap.empty) {
    const d = slugSnap.docs[0];
    return { id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) };
  }

  const titleQ = query(col, where('title', '==', titleOrSlug), fbLimit(1));
  const titleSnap = await getDocs(titleQ);
  if (!titleSnap.empty) {
    const d = titleSnap.docs[0];
    return { id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) };
  }
  return null;
}

export async function searchWikiPages(keyword: string, max = 30): Promise<WikiPage[]> {
  const col = collection(db, WIKI_COLLECTIONS.PAGES);
  // Firestoreは全文検索が出来ないため、タイトル前方一致 + タグ一致のクエリを組み合わせる。
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const results = new Map<string, WikiPage>();

  try {
    const titleQ = query(
      col,
      orderBy('title'),
      where('title', '>=', trimmed),
      where('title', '<=', trimmed + '\uf8ff'),
      fbLimit(max)
    );
    const titleSnap = await getDocs(titleQ);
    titleSnap.docs.forEach(d => results.set(d.id, { id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) }));
  } catch (e) {
    console.error('[searchWikiPages] title query failed:', e);
  }

  try {
    const tagQ = query(col, where('tags', 'array-contains', trimmed), fbLimit(max));
    const tagSnap = await getDocs(tagQ);
    tagSnap.docs.forEach(d => results.set(d.id, { id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) }));
  } catch (e) {
    console.error('[searchWikiPages] tag query failed:', e);
  }

  return Array.from(results.values()).slice(0, max);
}

export async function fetchWikiPagesByCategory(category: WikiCategory, max = 50): Promise<WikiPage[]> {
  const col = collection(db, WIKI_COLLECTIONS.PAGES);
  const q = query(col, where('category', '==', category), orderBy('updatedAt', 'desc'), fbLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) }));
}

export async function fetchWikiPagesByTag(tag: string, max = 50): Promise<WikiPage[]> {
  const col = collection(db, WIKI_COLLECTIONS.PAGES);
  const q = query(col, where('tags', 'array-contains', tag), orderBy('updatedAt', 'desc'), fbLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) }));
}

export async function fetchRecentlyUpdatedPages(max = 20): Promise<WikiPage[]> {
  const col = collection(db, WIKI_COLLECTIONS.PAGES);
  const q = query(col, orderBy('updatedAt', 'desc'), fbLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) }));
}

export async function fetchPopularPages(max = 10): Promise<WikiPage[]> {
  const col = collection(db, WIKI_COLLECTIONS.PAGES);
  const q = query(col, orderBy('viewCount', 'desc'), fbLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) }));
}

export function subscribeRecentChanges(callback: (changes: WikiRecentChange[]) => void, max = 30): Unsubscribe {
  const col = collection(db, WIKI_COLLECTIONS.RECENT_CHANGES);
  const q = query(col, orderBy('editedAt', 'desc'), fbLimit(max));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<WikiRecentChange, 'id'>) })));
  });
}

// 全ページ一覧（カテゴリ画面・あいうえお順表示などに使う軽量版）
export async function fetchAllWikiPages(max = 200): Promise<WikiPage[]> {
  const col = collection(db, WIKI_COLLECTIONS.PAGES);
  const q = query(col, orderBy('title'), fbLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) }));
}

// ============================================================
// ページ作成・更新
// ============================================================
function generatePageId(): string {
  return `wp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateRevisionId(): string {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function createWikiPage(
  input: WikiPageInput,
  uid: string,
  displayName: string
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  const err = validatePageInput(input);
  if (err) return { success: false, error: err };

  const existing = await findWikiPageByTitleOrSlug(input.title);
  if (existing) return { success: false, error: '同名のページが既に存在します' };

  const pageId = generatePageId();
  const revisionId = generateRevisionId();
  const now = Date.now();

  const page: WikiPage = {
    id: pageId,
    slug: input.slug || slugify(input.title),
    title: input.title,
    category: input.category,
    tags: input.tags,
    summary: input.summary,
    contentBlocks: input.contentBlocks,
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
    createdByName: displayName,
    updatedBy: uid,
    updatedByName: displayName,
    viewCount: 0,
    likeCount: 0,
    isLocked: false,
    isProtected: false,
    isOfficial: false,
    isVerified: false,
    latestRevisionId: revisionId,
    revisionCount: 1,
    ...(input.linkedMasterType ? { linkedMasterType: input.linkedMasterType } : {}),
    ...(input.linkedMasterId ? { linkedMasterId: input.linkedMasterId } : {}),
  };

  const pageRef = doc(db, WIKI_COLLECTIONS.PAGES, pageId);
  await setDoc(pageRef, page);

  const revision: WikiRevision = {
    id: revisionId,
    pageId,
    editorUid: uid,
    editorName: displayName,
    editedAt: now,
    editSummary: '新規作成',
    title: input.title,
    contentBlocks: input.contentBlocks,
    diffSummary: { added: input.contentBlocks.length, removed: 0, changed: 0 },
  };
  await setDoc(doc(db, WIKI_COLLECTIONS.PAGES, pageId, 'revisions', revisionId), revision);

  await addRecentChange({
    pageId,
    pageTitle: input.title,
    category: input.category,
    editorUid: uid,
    editorName: displayName,
    editedAt: now,
    editSummary: '新規作成',
    changeType: 'create',
  });

  return { success: true, pageId };
}

export async function updateWikiPage(
  pageId: string,
  input: WikiPageInput,
  uid: string,
  displayName: string,
  editSummary: string
): Promise<{ success: boolean; error?: string }> {
  const err = validatePageInput(input);
  if (err) return { success: false, error: err };

  const ref = doc(db, WIKI_COLLECTIONS.PAGES, pageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, error: 'ページが見つかりません' };
  const current = snap.data() as WikiPage;

  if (current.isLocked && !isWikiAdmin(uid)) {
    return { success: false, error: 'このページはロックされています' };
  }

  const revisionId = generateRevisionId();
  const now = Date.now();
  const diff = diffSummaryOf(current.contentBlocks ?? [], input.contentBlocks);

  await updateDoc(ref, {
    title: input.title,
    category: input.category,
    tags: input.tags,
    summary: input.summary,
    contentBlocks: input.contentBlocks,
    updatedAt: now,
    updatedBy: uid,
    updatedByName: displayName,
    latestRevisionId: revisionId,
    revisionCount: increment(1),
  });

  const revision: WikiRevision = {
    id: revisionId,
    pageId,
    editorUid: uid,
    editorName: displayName,
    editedAt: now,
    editSummary: editSummary || '(編集内容の説明なし)',
    title: input.title,
    contentBlocks: input.contentBlocks,
    diffSummary: diff,
  };
  await setDoc(doc(db, WIKI_COLLECTIONS.PAGES, pageId, 'revisions', revisionId), revision);

  await addRecentChange({
    pageId,
    pageTitle: input.title,
    category: input.category,
    editorUid: uid,
    editorName: displayName,
    editedAt: now,
    editSummary: editSummary || '(編集内容の説明なし)',
    changeType: 'update',
  });

  return { success: true };
}

export async function incrementPageView(pageId: string): Promise<void> {
  try {
    const ref = doc(db, WIKI_COLLECTIONS.PAGES, pageId);
    await updateDoc(ref, { viewCount: increment(1) });
  } catch (e) {
    // ビューカウントの失敗は致命的ではないため握りつぶす
    console.error('[incrementPageView] failed:', e);
  }
}

export async function toggleLikePage(pageId: string, delta: 1 | -1): Promise<void> {
  const ref = doc(db, WIKI_COLLECTIONS.PAGES, pageId);
  await updateDoc(ref, { likeCount: increment(delta) });
}

// ============================================================
// ロック・保護（管理者のみ実効）
// ============================================================
export async function setPageLocked(pageId: string, locked: boolean, uid: string): Promise<{ success: boolean; error?: string }> {
  if (!isWikiAdmin(uid)) return { success: false, error: '権限がありません' };
  const ref = doc(db, WIKI_COLLECTIONS.PAGES, pageId);
  await updateDoc(ref, { isLocked: locked });
  return { success: true };
}

export async function setPageProtected(pageId: string, protectedFlag: boolean, uid: string): Promise<{ success: boolean; error?: string }> {
  if (!isWikiAdmin(uid)) return { success: false, error: '権限がありません' };
  const ref = doc(db, WIKI_COLLECTIONS.PAGES, pageId);
  await updateDoc(ref, { isProtected: protectedFlag });
  return { success: true };
}

// ============================================================
// 履歴・差し戻し
// ============================================================
export async function fetchPageRevisions(pageId: string, max = 50): Promise<WikiRevision[]> {
  const col = collection(db, WIKI_COLLECTIONS.PAGES, pageId, 'revisions');
  const q = query(col, orderBy('editedAt', 'desc'), fbLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<WikiRevision, 'id'>) }));
}

export async function fetchRevision(pageId: string, revisionId: string): Promise<WikiRevision | null> {
  const ref = doc(db, WIKI_COLLECTIONS.PAGES, pageId, 'revisions', revisionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<WikiRevision, 'id'>) };
}

export async function revertToRevision(
  pageId: string,
  revisionId: string,
  uid: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  const pageRef = doc(db, WIKI_COLLECTIONS.PAGES, pageId);
  const pageSnap = await getDoc(pageRef);
  if (!pageSnap.exists()) return { success: false, error: 'ページが見つかりません' };
  const page = pageSnap.data() as WikiPage;
  if (page.isLocked && !isWikiAdmin(uid)) return { success: false, error: 'このページはロックされています' };

  const target = await fetchRevision(pageId, revisionId);
  if (!target) return { success: false, error: '指定の履歴が見つかりません' };

  return updateWikiPage(
    pageId,
    {
      slug: page.slug,
      title: target.title,
      category: page.category,
      tags: page.tags,
      summary: page.summary,
      contentBlocks: target.contentBlocks,
    },
    uid,
    displayName,
    `リビジョン(${new Date(target.editedAt).toLocaleString('ja-JP')})へ差し戻し`
  );
}

// ============================================================
// ページ名変更（リダイレクト作成）
// ============================================================
export async function renameWikiPage(
  pageId: string,
  newTitle: string,
  uid: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  const ref = doc(db, WIKI_COLLECTIONS.PAGES, pageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, error: 'ページが見つかりません' };
  const page = snap.data() as WikiPage;
  if (page.isLocked && !isWikiAdmin(uid)) return { success: false, error: 'このページはロックされています' };
  if (!newTitle || newTitle.trim().length === 0) return { success: false, error: '新しいタイトルを入力してください' };
  if (newTitle.length > WIKI_LIMITS.TITLE_MAX) return { success: false, error: `タイトルは${WIKI_LIMITS.TITLE_MAX}文字以内にしてください` };

  const oldTitle = page.title;
  const result = await updateWikiPage(
    pageId,
    {
      slug: slugify(newTitle),
      title: newTitle,
      category: page.category,
      tags: page.tags,
      summary: page.summary,
      contentBlocks: page.contentBlocks,
    },
    uid,
    displayName,
    `ページ名変更: 「${oldTitle}」→「${newTitle}」`
  );
  if (!result.success) return result;

  // 旧名でアクセスしてきたユーザーのために、軽量なリダイレクトページを別IDで作成する。
  try {
    const redirectId = generatePageId();
    const redirectPage: WikiPage = {
      id: redirectId,
      slug: slugify(oldTitle),
      title: oldTitle,
      category: page.category,
      tags: [],
      summary: `「${newTitle}」へ移動しました`,
      contentBlocks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: uid,
      createdByName: displayName,
      updatedBy: uid,
      updatedByName: displayName,
      viewCount: 0,
      likeCount: 0,
      isLocked: false,
      isProtected: false,
      isOfficial: false,
      isVerified: false,
      latestRevisionId: '',
      revisionCount: 0,
      redirectTo: pageId,
    };
    await setDoc(doc(db, WIKI_COLLECTIONS.PAGES, redirectId), redirectPage);
  } catch (e) {
    console.error('[renameWikiPage] redirect page creation failed:', e);
  }

  return { success: true };
}

// ============================================================
// 関連ページ（タグ・カテゴリ一致から簡易推定）
// ============================================================
export async function fetchRelatedPages(page: WikiPage, max = 6): Promise<WikiPage[]> {
  const col = collection(db, WIKI_COLLECTIONS.PAGES);
  const results = new Map<string, WikiPage>();

  if (page.tags.length > 0) {
    try {
      const q = query(col, where('tags', 'array-contains-any', page.tags.slice(0, 10)), fbLimit(max + 1));
      const snap = await getDocs(q);
      snap.docs.forEach(d => { if (d.id !== page.id) results.set(d.id, { id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) }); });
    } catch (e) {
      console.error('[fetchRelatedPages] tag query failed:', e);
    }
  }

  if (results.size < max) {
    try {
      const q = query(col, where('category', '==', page.category), fbLimit(max + 1));
      const snap = await getDocs(q);
      snap.docs.forEach(d => { if (d.id !== page.id) results.set(d.id, { id: d.id, ...(d.data() as Omit<WikiPage, 'id'>) }); });
    } catch (e) {
      console.error('[fetchRelatedPages] category query failed:', e);
    }
  }

  return Array.from(results.values()).slice(0, max);
}

// ============================================================
// 最近の更新フィード書き込み（軽量レコード）
// ============================================================
async function addRecentChange(change: Omit<WikiRecentChange, 'id'>): Promise<void> {
  const id = `wc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  try {
    await setDoc(doc(db, WIKI_COLLECTIONS.RECENT_CHANGES, id), change);
  } catch (e) {
    console.error('[addRecentChange] failed:', e);
  }
}

// ============================================================
// 通報
// ============================================================
export async function submitWikiReport(
  pageId: string,
  reporterUid: string,
  reason: WikiReportReason,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  if (comment.length > 500) return { success: false, error: '通報内容は500文字以内にしてください' };
  const reportId = `rp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const report: WikiReport = {
    id: reportId,
    pageId,
    reporterUid,
    reason,
    comment,
    createdAt: Date.now(),
    resolved: false,
  };
  try {
    await setDoc(doc(db, WIKI_COLLECTIONS.PAGES, pageId, 'reports', reportId), report);
    return { success: true };
  } catch (e) {
    console.error('[submitWikiReport] failed:', e);
    return { success: false, error: '通報の送信に失敗しました' };
  }
}

// ============================================================
// 管理者用：ページ削除
// ============================================================
export async function deleteWikiPage(pageId: string, uid: string): Promise<{ success: boolean; error?: string }> {
  if (!isWikiAdmin(uid)) return { success: false, error: '権限がありません' };
  await deleteDoc(doc(db, WIKI_COLLECTIONS.PAGES, pageId));
  return { success: true };
}

// collectionGroup を使った全ページ横断のリビジョン検索などで将来拡張する場合に備え、
// importしたcollectionGroupを最低限利用する形だけ用意（現状は未使用関数のlintエラー回避のため呼び出し側で利用）
export async function fetchAnyPageRevisionsAcrossWiki(max = 20): Promise<WikiRevision[]> {
  const col = collectionGroup(db, 'revisions');
  const q = query(col, orderBy('editedAt', 'desc'), fbLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<WikiRevision, 'id'>) }));
}

export { serverTimestamp as wikiServerTimestamp };
