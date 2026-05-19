import { prisma } from "../config/prisma";

export interface LearnedWeights {
  carbon: number;
  time: number;
  comfort: number;
  cost: number;
  effort: number;
  tripCount: number;
  updatedAt: string;
}

type Dims = Omit<LearnedWeights, "tripCount" | "updatedAt">;

const DIMS: (keyof Dims)[] = ["carbon", "time", "comfort", "cost", "effort"];

// Each mode implies a soft preference signal across the 5 scoring dimensions.
// These are heuristic: someone who walks probably cares more about carbon/effort
// than speed; someone who takes EV likely values time and comfort over effort.
const MODE_SIGNALS: Record<string, Dims> = {
  WALKING:         { carbon: 1.0, time: 0.1, comfort: 0.2, cost: 0.9, effort: 1.0 },
  CYCLING:         { carbon: 0.9, time: 0.3, comfort: 0.3, cost: 0.8, effort: 0.9 },
  TRANSIT:         { carbon: 0.5, time: 0.6, comfort: 0.7, cost: 0.5, effort: 0.1 },
  CYCLING_TRANSIT: { carbon: 0.7, time: 0.4, comfort: 0.5, cost: 0.6, effort: 0.5 },
  EV:              { carbon: 0.3, time: 0.8, comfort: 0.8, cost: 0.2, effort: 0.1 },
};

const FALLBACK_SIGNAL: Dims = { carbon: 0.55, time: 0.25, comfort: 0.15, cost: 0.0, effort: 0.05 };

function inferWeights(trips: { mode: string }[]): Dims {
  const n = trips.length;
  // Triangular weighting: trips[0] oldest (weight 1), trips[n-1] newest (weight n)
  const totalW = (n * (n + 1)) / 2;

  const acc: Dims = { carbon: 0, time: 0, comfort: 0, cost: 0, effort: 0 };

  trips.forEach((trip, i) => {
    const recencyW = (i + 1) / totalW;
    const sig = MODE_SIGNALS[trip.mode] ?? FALLBACK_SIGNAL;
    for (const dim of DIMS) acc[dim] += sig[dim] * recencyW;
  });

  // Normalize so dimensions sum to 1.0
  const total = DIMS.reduce((s, d) => s + acc[d], 0);
  for (const dim of DIMS) acc[dim] = acc[dim] / total;

  return acc;
}

/**
 * Reads the user's last 20 completed trips, derives learned weights from their
 * mode history, and persists the result on the Profile row.
 * Minimum 3 trips required before any weights are written (avoids noise).
 * Safe to call fire-and-forget — errors are logged, never thrown.
 */
export async function updateUserWeights(profileId: string): Promise<void> {
  try {
    const trips = await prisma.trip.findMany({
      where: { profileId, status: "COMPLETED" },
      orderBy: { completedAt: "asc" },
      take: 20,
      select: { mode: true },
    });

    if (trips.length < 3) return;

    const dims = inferWeights(trips);
    const weights: LearnedWeights = {
      ...dims,
      tripCount: trips.length,
      updatedAt: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.profile.update({
      where: { id: profileId },
      data: { learnedWeights: weights as any },
    });

    console.log(
      `[WeightLearning] Updated weights for ${profileId} (${trips.length} trips): ` +
      `carbon=${dims.carbon.toFixed(3)} time=${dims.time.toFixed(3)} ` +
      `comfort=${dims.comfort.toFixed(3)} cost=${dims.cost.toFixed(3)} effort=${dims.effort.toFixed(3)}`
    );
  } catch (err) {
    console.error("[WeightLearning] Failed to update weights:", err);
  }
}

export { inferWeights }; // exported for testing only
