// Module-level singleton cache for Leaderboard data.
// Survives tab navigation without re-fetching — same pattern as routeStore.ts.

export interface LeaderEntry {
  profileId: string;
  rank: number;
  fullName: string;
  avatarUrl: string | null;
  totalPoints: number;
  totalTrips: number;
  totalCo2SavedG: number;
  isMe: boolean;
}

export interface LeaderboardData {
  entries: LeaderEntry[];
  me: LeaderEntry | null;
  total: number;
}

interface LeaderboardCache {
  data: LeaderboardData;
  fetchedAt: number;
}

const TTL_MS = 2 * 60 * 1000; // 2 minutes

let _cache: LeaderboardCache | null = null;

export const leaderboardStore = {
  get: (): LeaderboardCache | null => _cache,

  set: (data: LeaderboardData) => {
    _cache = { data, fetchedAt: Date.now() };
  },

  isFresh: (): boolean =>
    _cache !== null && Date.now() - _cache.fetchedAt < TTL_MS,

  clear: () => { _cache = null; },
};
