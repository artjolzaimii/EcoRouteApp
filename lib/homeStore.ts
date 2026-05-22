// Module-level singleton cache for Home screen widgets (today's stats + challenges).
// Short 1-minute TTL because stats change after each trip completion.

export interface HomeTodayStats {
  totalPoints: number;
  totalCo2SavedG: number;
  totalTrips: number;
}

export interface HomeChallenge {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  rewardPoints: number;
  progress: number;
  completed: boolean;
}

interface HomeCache {
  stats: HomeTodayStats | null;
  challenges: HomeChallenge[];
  fetchedAt: number;
}

const TTL_MS = 60 * 1000; // 1 minute

let _cache: HomeCache | null = null;

export const homeStore = {
  get: (): HomeCache | null => _cache,

  set: (stats: HomeTodayStats | null, challenges: HomeChallenge[]) => {
    _cache = { stats, challenges, fetchedAt: Date.now() };
  },

  isFresh: (): boolean =>
    _cache !== null && Date.now() - _cache.fetchedAt < TTL_MS,

  /** Call after a trip is completed so home stats refresh on next focus. */
  clear: () => { _cache = null; },
};
