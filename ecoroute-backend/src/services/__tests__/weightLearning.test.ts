import { inferWeights, updateUserWeights } from "../weightLearning.service";

// Mock Prisma so tests never touch the real DB
jest.mock("../../config/prisma", () => ({
  prisma: {
    trip: { findMany: jest.fn() },
    profile: { update: jest.fn() },
  },
}));

import { prisma } from "../../config/prisma";

const mockFindMany = prisma.trip.findMany as jest.Mock;
const mockUpdate = prisma.profile.update as jest.Mock;

const sumWeights = (w: Record<string, number>) =>
  Object.values(w).reduce((s, v) => s + v, 0);

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockResolvedValue({});
});

// ── inferWeights ──────────────────────────────────────────────────────────────

describe("inferWeights", () => {
  test("1. single WALKING trip — carbon and effort are the two highest dims", () => {
    const result = inferWeights([{ mode: "WALKING" }]);
    const dims = ["carbon", "time", "comfort", "cost", "effort"] as const;
    const sorted = [...dims].sort((a, b) => result[b] - result[a]);
    expect(["carbon", "effort"]).toContain(sorted[0]);
    expect(["carbon", "effort"]).toContain(sorted[1]);
  });

  test("2. single TRANSIT trip — time and comfort are the two highest dims", () => {
    const result = inferWeights([{ mode: "TRANSIT" }]);
    const dims = ["carbon", "time", "comfort", "cost", "effort"] as const;
    const sorted = [...dims].sort((a, b) => result[b] - result[a]);
    expect(["time", "comfort"]).toContain(sorted[0]);
    expect(["time", "comfort"]).toContain(sorted[1]);
  });

  test("3. unknown mode falls back gracefully — output sums to 1.0", () => {
    const result = inferWeights([{ mode: "HOVERCRAFT" }]);
    expect(sumWeights(result)).toBeCloseTo(1.0, 4);
    // All dims must be non-negative
    for (const v of Object.values(result)) expect(v).toBeGreaterThanOrEqual(0);
  });

  test("4. three identical CYCLING trips — shape matches CYCLING signal, sums to 1.0", () => {
    const result = inferWeights([
      { mode: "CYCLING" },
      { mode: "CYCLING" },
      { mode: "CYCLING" },
    ]);
    // Ratios should match normalized CYCLING signal: carbon=0.9, effort=0.9 dominate
    expect(result.carbon).toBeGreaterThan(result.time);
    expect(result.effort).toBeGreaterThan(result.time);
    expect(sumWeights(result)).toBeCloseTo(1.0, 4);
  });

  test("5. recency bias — [TRANSIT,TRANSIT,WALKING] gives higher carbon than [WALKING,TRANSIT,TRANSIT]", () => {
    const walkingLast = inferWeights([
      { mode: "TRANSIT" },
      { mode: "TRANSIT" },
      { mode: "WALKING" }, // most recent
    ]);
    const walkingFirst = inferWeights([
      { mode: "WALKING" }, // oldest
      { mode: "TRANSIT" },
      { mode: "TRANSIT" },
    ]);
    // Walking is most recent in walkingLast → should pull carbon higher
    expect(walkingLast.carbon).toBeGreaterThan(walkingFirst.carbon);
  });

  test("6. all 5 known modes — each output sums to 1.0", () => {
    const modes = ["WALKING", "CYCLING", "TRANSIT", "CYCLING_TRANSIT", "EV"];
    for (const mode of modes) {
      const result = inferWeights([{ mode }]);
      expect(sumWeights(result)).toBeCloseTo(1.0, 4);
    }
  });
});

// ── updateUserWeights ─────────────────────────────────────────────────────────

describe("updateUserWeights", () => {
  test("7. 0 completed trips — profile.update is never called", async () => {
    mockFindMany.mockResolvedValue([]);
    await updateUserWeights("user-1");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("8. 2 completed trips — profile.update is never called (below 3-trip minimum)", async () => {
    mockFindMany.mockResolvedValue([{ mode: "WALKING" }, { mode: "CYCLING" }]);
    await updateUserWeights("user-2");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("9. 3 completed trips — profile.update called with correct JSON shape", async () => {
    mockFindMany.mockResolvedValue([
      { mode: "WALKING" },
      { mode: "CYCLING" },
      { mode: "TRANSIT" },
    ]);
    await updateUserWeights("user-3");
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const payload = mockUpdate.mock.calls[0][0].data.learnedWeights;
    expect(payload).toMatchObject({
      carbon: expect.any(Number),
      time: expect.any(Number),
      comfort: expect.any(Number),
      cost: expect.any(Number),
      effort: expect.any(Number),
      tripCount: 3,
      updatedAt: expect.any(String),
    });
    // Stored weights must sum to 1.0
    const { carbon, time, comfort, cost, effort } = payload;
    expect(carbon + time + comfort + cost + effort).toBeCloseTo(1.0, 4);
  });

  test("10. 20 completed trips — tripCount field equals 20 in stored weights", async () => {
    const trips = Array.from({ length: 20 }, () => ({ mode: "CYCLING" }));
    mockFindMany.mockResolvedValue(trips);
    await updateUserWeights("user-20");
    const payload = mockUpdate.mock.calls[0][0].data.learnedWeights;
    expect(payload.tripCount).toBe(20);
  });

  test("11. DB error — function resolves without throwing", async () => {
    mockFindMany.mockRejectedValue(new Error("DB connection lost"));
    await expect(updateUserWeights("user-err")).resolves.toBeUndefined();
  });
});
