// Module-level singleton cache for Rewards screen data.
// Survives tab navigation — same pattern as routeStore.ts.

export interface RewardsCoupon {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountValue: number;
  discountType: string;
  expiresAt: string | null;
  partner: { id: string; name: string; logoUrl: string | null };
}

export interface RewardsUserCoupon {
  id: string;
  code: string;
  redeemedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  coupon: RewardsCoupon;
}

export interface RewardsCouponsData {
  available: RewardsCoupon[];
  mine: RewardsUserCoupon[];
}

export interface RewardsChallenge {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  rewardPoints: number;
  progress: number;
  completed: boolean;
}

interface RewardsCache {
  coupons: RewardsCouponsData;
  userPoints: number;
  challenges: RewardsChallenge[];
  fetchedAt: number;
}

const TTL_MS = 3 * 60 * 1000; // 3 minutes

let _cache: RewardsCache | null = null;

export const rewardsStore = {
  get: (): RewardsCache | null => _cache,

  set: (coupons: RewardsCouponsData, userPoints: number, challenges: RewardsChallenge[]) => {
    _cache = { coupons, userPoints, challenges, fetchedAt: Date.now() };
  },

  isFresh: (): boolean =>
    _cache !== null && Date.now() - _cache.fetchedAt < TTL_MS,

  /** Call after a successful redemption so the next load is always fresh. */
  clear: () => { _cache = null; },
};
