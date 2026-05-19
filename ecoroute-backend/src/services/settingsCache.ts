import { prisma } from "../config/prisma";

export type ModeMultipliers = Record<string, number>;

const DEFAULTS: ModeMultipliers = {
  WALKING:         1.5,
  BICYCLING:       1.5,
  CYCLING:         1.5,
  EBIKE:           1.5,
  ESCOOTER:        1.2,
  TRANSIT:         1.0,
  TRAIN:           1.0,
  COACH:           1.0,
  EV:              1.0,
  MIXED:           1.2,
  CYCLING_TRANSIT: 1.2,
  PLANE:           0.0,
  DRIVING:         0.0,
};

const TTL_MS = 60_000;
let cache: { multipliers: ModeMultipliers; expiresAt: number } | null = null;

function buildMultipliers(settings: Record<string, string>): ModeMultipliers {
  const w = Number(settings.walkingMultiplier) || DEFAULTS.WALKING!;
  const c = Number(settings.cyclingMultiplier) || DEFAULTS.BICYCLING!;
  const t = Number(settings.transitMultiplier) || DEFAULTS.TRANSIT!;
  const m = Number(settings.mixedMultiplier)   || DEFAULTS.MIXED!;
  return {
    WALKING:         w,
    BICYCLING:       c,
    CYCLING:         c,
    EBIKE:           c,
    ESCOOTER:        m,
    TRANSIT:         t,
    TRAIN:           t,
    COACH:           t,
    EV:              t,
    MIXED:           m,
    CYCLING_TRANSIT: m,
    PLANE:           0.0,
    DRIVING:         0.0,
  };
}

async function refreshCache(): Promise<ModeMultipliers> {
  try {
    const rows = await prisma.appSetting.findMany({
      where: {
        key: { in: ["walkingMultiplier", "cyclingMultiplier", "transitMultiplier", "mixedMultiplier"] },
      },
    });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    const multipliers = buildMultipliers(map);
    cache = { multipliers, expiresAt: Date.now() + TTL_MS };
    return multipliers;
  } catch {
    return DEFAULTS;
  }
}

export async function getMultipliers(): Promise<ModeMultipliers> {
  if (cache && Date.now() < cache.expiresAt) return cache.multipliers;
  return refreshCache();
}

export function invalidateMultipliersCache(): void {
  cache = null;
}
