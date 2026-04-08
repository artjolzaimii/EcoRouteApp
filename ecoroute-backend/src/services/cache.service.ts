import { redis } from "../config/redis";

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

/**
 * Generic cache getter. Returns null on miss or Redis error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get<T>(key);
    return raw ?? null;
  } catch (err) {
    console.warn("[Redis] GET failed", { key, err });
    return null;
  }
}

/**
 * Generic cache setter. Silently ignores Redis errors so the app keeps working.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn("[Redis] SET failed", { key, err });
  }
}

/**
 * Delete a cache key.
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.warn("[Redis] DEL failed", { key, err });
  }
}

/**
 * Build a canonical cache key for a routes request.
 */
export function routeCacheKey(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): string {
  // Round to 4 decimal places (~11 m precision) to maximise cache hits
  const r = (n: number) => n.toFixed(4);
  return `route:${r(originLat)},${r(originLng)}->${r(destLat)},${r(destLng)}`;
}
