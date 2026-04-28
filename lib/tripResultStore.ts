/**
 * Lightweight store that carries the trip-completion result from
 * navigation.tsx → trip-completed.tsx.
 * Consumed once and then cleared.
 */

export type TripResult = {
  co2SavedGrams: number;
  co2EmittedGrams: number;
  carBaselineGrams: number;
  pointsEarned: number;
  streakBonusPoints: number;
  newBalance: number;
  currentStreak: number;
  distanceKm: number;
  durationMinutes: number;
  mode: string;
};

let _result: TripResult | null = null;

export const tripResultStore = {
  set: (r: TripResult) => { _result = r; },
  consume: (): TripResult | null => {
    const r = _result;
    _result = null;
    return r;
  },
  peek: (): TripResult | null => _result,
};
