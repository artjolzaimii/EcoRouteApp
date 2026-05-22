// Module-level singleton cache for Forum posts.
// Preserves loaded pages across tab navigation — same pattern as routeStore.ts.

export interface ForumPost {
  id: string;
  profileId: string;
  authorName: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export type ForumSort = 'comments' | 'likes' | 'newest';

interface ForumCache {
  posts: ForumPost[];
  cursor: string | undefined;
  hasMore: boolean;
  sort: ForumSort;
  fetchedAt: number;
}

const TTL_MS = 2 * 60 * 1000; // 2 minutes

let _cache: ForumCache | null = null;

export const forumStore = {
  get: (): ForumCache | null => _cache,

  set: (posts: ForumPost[], cursor: string | undefined, hasMore: boolean, sort: ForumSort) => {
    _cache = { posts, cursor, hasMore, sort, fetchedAt: Date.now() };
  },

  /** Append a new page of posts (deduplicates by id). Updates cursor + hasMore. */
  append: (newPosts: ForumPost[], cursor: string | undefined, hasMore: boolean) => {
    if (!_cache) return;
    const seen = new Set(_cache.posts.map((p) => p.id));
    const deduped = newPosts.filter((p) => !seen.has(p.id));
    _cache = { ..._cache, posts: [..._cache.posts, ...deduped], cursor, hasMore };
  },

  isFresh: (): boolean =>
    _cache !== null && Date.now() - _cache.fetchedAt < TTL_MS,

  clear: () => { _cache = null; },
};
