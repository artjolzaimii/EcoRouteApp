// Module-level singleton cache for Marketplace data.
// Survives tab navigation without re-fetching — same pattern as routeStore.ts.

export interface MktCategory {
  id: string;
  slug: string;
  label: string;
  glyph: string;
}

export interface MktListing {
  id: string;
  title: string;
  description: string | null;
  pointsPrice: number | null;
  moneyPrice: number | null;
  payment: string;
  category: MktCategory;
  partner: { businessName: string; location: string | null; businessEmail: string | null };
  images: { url: string; isCover: boolean }[];
}

interface MarketplaceCache {
  categories: MktCategory[];
  listings: MktListing[];
  total: number;
  hasMore: boolean;
  userPoints: number;
  fetchedAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cache: MarketplaceCache | null = null;

export const marketplaceStore = {
  get: (): MarketplaceCache | null => _cache,

  set: (data: Omit<MarketplaceCache, 'fetchedAt'>) => {
    _cache = { ...data, fetchedAt: Date.now() };
  },

  appendListings: (newListings: MktListing[], total: number) => {
    if (!_cache) return;
    const seen = new Set(_cache.listings.map((l) => l.id));
    const deduped = newListings.filter((l) => !seen.has(l.id));
    const merged = [..._cache.listings, ...deduped];
    _cache = { ..._cache, listings: merged, total, hasMore: merged.length < total };
  },

  isFresh: (): boolean =>
    _cache !== null && Date.now() - _cache.fetchedAt < TTL_MS,

  clear: () => { _cache = null; },
};
