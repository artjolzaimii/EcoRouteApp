import { blendWeights, applyWeightedRanking, ScoredCandidate } from "../routing.service";
import type { LearnedWeights } from "../weightLearning.service";

// Silence console output from the ranking logger during tests
beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => {}); });
afterAll(() => { (console.log as jest.Mock).mockRestore(); });

const sumWeights = (w: Record<string, number>) =>
  Object.values(w).reduce((s, v) => s + v, 0);

const ecoFirstMood = { carbon: 0.55, time: 0.25, comfort: 0.15, cost: 0.00, effort: 0.05 };

function makeLearnedWeights(
  dims: { carbon: number; time: number; comfort: number; cost: number; effort: number },
  tripCount: number,
): LearnedWeights {
  return { ...dims, tripCount, updatedAt: new Date().toISOString() };
}

// Minimal ScoredCandidate stub — only fields used by applyWeightedRanking
function makeCandidate(overrides: Partial<ScoredCandidate>): ScoredCandidate {
  return {
    mode: "TRANSIT",
    durationMin: 30,
    distanceKm: 10,
    co2Grams: 300,
    carEquivalentCO2: 1700,
    savedVsCar: 1400,
    carbonScore: 82,
    greenPoints: 14,
    carbonBreakdown: [],
    ...overrides,
  };
}

// ── blendWeights ──────────────────────────────────────────────────────────────

describe("blendWeights", () => {
  test("12. tripCount=0 → alpha=0, output equals mood weights exactly", () => {
    const learned = makeLearnedWeights(
      { carbon: 0.15, time: 0.05, comfort: 0.05, cost: 0.05, effort: 0.70 },
      0,
    );
    const result = blendWeights(ecoFirstMood, learned);
    expect(result.carbon).toBeCloseTo(ecoFirstMood.carbon, 4);
    expect(result.time).toBeCloseTo(ecoFirstMood.time, 4);
    expect(result.effort).toBeCloseTo(ecoFirstMood.effort, 4);
  });

  test("13. tripCount=10 → alpha=0.20, dims are weighted 80% mood + 20% learned (pre-normalize)", () => {
    const learned = makeLearnedWeights(
      { carbon: 0.0, time: 0.0, comfort: 0.0, cost: 0.0, effort: 1.0 },
      10,
    );
    // After blend: effort = 0.8*0.05 + 0.2*1.0 = 0.24 (before normalize)
    // Normalized value will be higher than ecoFirst's 0.05 effort
    const result = blendWeights(ecoFirstMood, learned);
    expect(result.effort).toBeGreaterThan(ecoFirstMood.effort);
    expect(sumWeights(result)).toBeCloseTo(1.0, 4);
  });

  test("14. tripCount=20 → alpha=0.40 (maximum)", () => {
    // With tripCount=20 and pure-carbon learned, carbon should shift toward learned
    const learned = makeLearnedWeights(
      { carbon: 1.0, time: 0.0, comfort: 0.0, cost: 0.0, effort: 0.0 },
      20,
    );
    const result = blendWeights(ecoFirstMood, learned);
    // carbon = 0.6*0.55 + 0.4*1.0 = 0.73 (pre-normalize), so still highest dim
    expect(result.carbon).toBeGreaterThan(result.time);
    expect(sumWeights(result)).toBeCloseTo(1.0, 4);
  });

  test("15. tripCount=50 → alpha capped at 0.40, same result as tripCount=20", () => {
    const dims = { carbon: 0.20, time: 0.20, comfort: 0.20, cost: 0.20, effort: 0.20 };
    const at20 = blendWeights(ecoFirstMood, makeLearnedWeights(dims, 20));
    const at50 = blendWeights(ecoFirstMood, makeLearnedWeights(dims, 50));
    expect(at20.carbon).toBeCloseTo(at50.carbon, 4);
    expect(at20.effort).toBeCloseTo(at50.effort, 4);
  });

  test("16. output always sums to 1.0 regardless of inputs", () => {
    const cases = [0, 1, 5, 10, 20, 100];
    for (const tripCount of cases) {
      const learned = makeLearnedWeights(
        { carbon: 0.3, time: 0.3, comfort: 0.2, cost: 0.1, effort: 0.1 },
        tripCount,
      );
      const result = blendWeights(ecoFirstMood, learned);
      expect(sumWeights(result)).toBeCloseTo(1.0, 4);
    }
  });

  test("17. identical mood and learned weights → output equals input weights", () => {
    const identical = makeLearnedWeights(ecoFirstMood, 10);
    const result = blendWeights(ecoFirstMood, identical);
    for (const [k, v] of Object.entries(ecoFirstMood)) {
      expect(result[k as keyof typeof ecoFirstMood]).toBeCloseTo(v, 4);
    }
  });
});

// ── applyWeightedRanking ──────────────────────────────────────────────────────

describe("applyWeightedRanking — ranking effect of learned weights", () => {
  // Two candidates: fast TRANSIT (high time score) vs slow but zero-emission CYCLING
  const cycling = makeCandidate({
    mode: "CYCLING",
    durationMin: 45,
    co2Grams: 0,
    carbonScore: 100,
    greenPoints: 20,
  });
  const transit = makeCandidate({
    mode: "TRANSIT",
    durationMin: 20,
    co2Grams: 200,
    carbonScore: 70,
    greenPoints: 8,
  });

  test("18. no learnedWeights → default eco-first ranking (transit ranks above slow cycling)", () => {
    const ranked = applyWeightedRanking([cycling, transit], undefined, undefined);
    // Default: carbon=0.40, time=0.40 — transit (37min) beats cycling (45min, zero-emission)
    // because the time advantage outweighs the carbon score gap at equal weights.
    expect(ranked[0].mode).toBe("TRANSIT");
  });

  test("19. heavy TRANSIT user learned weights → transit final score increases vs no learned weights", () => {
    // A user who always takes transit — time and comfort dominate their learned weights
    const transitUser = makeLearnedWeights(
      { carbon: 0.10, time: 0.60, comfort: 0.20, cost: 0.05, effort: 0.05 },
      20,
    );
    const withLearned = applyWeightedRanking([cycling, transit], undefined, transitUser);
    const withoutLearned = applyWeightedRanking([cycling, transit], undefined, undefined);

    const transitScoreWith = withLearned.find((r) => r.mode === "TRANSIT")!.finalScore;
    const transitScoreWithout = withoutLearned.find((r) => r.mode === "TRANSIT")!.finalScore;
    expect(transitScoreWith).toBeGreaterThan(transitScoreWithout);
  });

  test("20. heavy CYCLING user learned weights → cycling ranks first even with mood undefined", () => {
    const cyclingUser = makeLearnedWeights(
      { carbon: 0.50, time: 0.10, comfort: 0.10, cost: 0.05, effort: 0.25 },
      20,
    );
    const ranked = applyWeightedRanking([cycling, transit], undefined, cyclingUser);
    expect(ranked[0].mode).toBe("CYCLING");
  });

  test("21. all finalScore values remain in 0–100 range regardless of blending", () => {
    const extremeLearned = makeLearnedWeights(
      { carbon: 1.0, time: 0.0, comfort: 0.0, cost: 0.0, effort: 0.0 },
      20,
    );
    const ranked = applyWeightedRanking([cycling, transit], "HURRY", extremeLearned);
    for (const route of ranked) {
      expect(route.finalScore).toBeGreaterThanOrEqual(0);
      expect(route.finalScore).toBeLessThanOrEqual(100);
    }
  });

  test("22. no mood + learnedWeights tripCount >= 3 → personalizedLabel is set to 'N trips'", () => {
    const learned = makeLearnedWeights(
      { carbon: 0.55, time: 0.25, comfort: 0.15, cost: 0.00, effort: 0.05 },
      12,
    );
    const ranked = applyWeightedRanking([cycling, transit], undefined, learned);
    expect(ranked[0].personalizedLabel).toBe("on past 12 trips");
  });

  test("23. explicit mood selected → personalizedLabel is NOT set (mood overrides completely)", () => {
    const learned = makeLearnedWeights(
      { carbon: 0.55, time: 0.25, comfort: 0.15, cost: 0.00, effort: 0.05 },
      12,
    );
    const ranked = applyWeightedRanking([cycling, transit], "HURRY", learned);
    expect(ranked[0].personalizedLabel).toBeUndefined();
  });
});
