import { randomUUID } from "crypto";
import { TripMode } from "@prisma/client";
import { fetchDirections, parseSteps, parseDistanceDuration } from "./google.service";
import { calculateCarbon, scoreGoogleRoute, calculateGreenPoints, EMISSION_FACTORS } from "./carbon.service";
import { findNearbyPartners, recordPartnerView, getEcoBusinessPartnersAlongRoute, getMobilityStopsForRoute } from "./partners.service";
import { cacheGet, cacheSet, routeCacheKey } from "./cache.service";
import { prisma } from "../config/prisma";
import { haversineDistance, decodePolylineToCoords, clamp } from "../utils/helpers";
import { RouteOption } from "../types";

// ─────────────────────────────────────────────
// Re-export haversineDistance so legacy code works
// ─────────────────────────────────────────────
export { haversineDistance };

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type JourneyType = "MICRO" | "URBAN" | "REGIONAL" | "INTERCITY" | "INTERNATIONAL";

export type RouteMood = "RELAXED" | "HURRY" | "EXERCISE" | "CHEAPEST";
export const VALID_MOODS = ["RELAXED", "HURRY", "EXERCISE", "CHEAPEST"] as const;

export interface ScoredCandidate {
  mode: string;
  subType?: string;
  durationMin: number;
  distanceKm: number;
  co2Grams: number;
  carEquivalentCO2: number;
  savedVsCar: number;
  carbonScore: number;
  greenPoints: number;
  carbonBreakdown: Array<{
    mode: string;
    distanceKm: number;
    co2Grams: number;
    instruction: string;
    polyline?: string;
    startLocation?: { lat: number; lng: number };
    endLocation?: { lat: number; lng: number };
  }>;
  transferCount?: number;
  requiresBooking?: boolean;
  bookingUrl?: string;
  geometry?: string;
  originStation?: string;
  destStation?: string;
  originAirport?: string;
  destAirport?: string;
  price?: number | null;
  currency?: string;
  dataSource?: string;
  departureTime?: string;
  arrivalTime?: string;
  partnerStop?: {
    partnerId: string;
    partnerName: string;
    vehicleType: string;
    pickupLat: number;
    pickupLng: number;
    pickupAddress?: string;
  };
}

export interface RankedRoute extends ScoredCandidate {
  timeScore: number;
  practicalityScore: number;
  finalScore: number;
  recommended: boolean;
  recommendationReason?: string;
  moodReason?: string;
}

export interface PartnerPin {
  id: string;
  businessName: string;
  category: string;
  lat: number;
  lng: number;
  logoUrl: string | null;
  distanceFromRouteM: number;
  coupon: {
    title: string;
    discountType: string;
    discountValue: number;
    earnType: string;
    pointsRequired: number;
  } | null;
}

export interface EcoRoutesResponseData {
  success: boolean;
  journeyType: JourneyType;
  distanceKm: number;
  routes: RankedRoute[];
  topRoute: RankedRoute & { partnerPins: PartnerPin[] };
  carBaseline: { co2Grams: number; durationMin: number };
  dataQuality: "HIGH" | "MEDIUM" | "LOW";
  dataQualityMessage: string;
}

// ─────────────────────────────────────────────
// detectJourneyType
// ─────────────────────────────────────────────

export const detectJourneyType = (distanceKm: number): JourneyType => {
  if (distanceKm < 2)    return "MICRO";
  if (distanceKm < 20)   return "URBAN";
  if (distanceKm < 150)  return "REGIONAL";
  if (distanceKm < 1500) return "INTERCITY";
  return "INTERNATIONAL";
};

// Walking is realistic up to ~8 km (≈1h40 at 4.8 km/h). Beyond that we still
// show a fallback estimate if the journey is very short, but don't fetch Google.
const WALKING_MAX_KM = 8;
const WALKING_SPEED_KMH = 4.8;

// Cycling is realistic for urban / micro journeys up to 20 km.
const CYCLING_MAX_KM = 20;
const CYCLING_SPEED_KMH = 15;

// ─────────────────────────────────────────────
// Mood helpers
// ─────────────────────────────────────────────

/**
 * Returns a raw cost estimate for a candidate (lower = cheaper).
 * Real price data takes priority; mode-based proxy used otherwise.
 */
function estimateCandidateCost(candidate: ScoredCandidate): number {
  if (candidate.price != null && candidate.price > 0) return candidate.price;
  switch (candidate.mode.toUpperCase()) {
    case "WALKING":   return 0;
    case "BICYCLING":
    case "CYCLING":   return 0;
    case "MIXED":     return 1.5;  // free cycling leg + partial transit fare
    case "TRANSIT":   return 2.5;  // typical urban single fare
    case "TRAIN":     return 25;   // typical regional/intercity fare
    case "PLANE":     return 150;  // typical flight
    default:          return 5;
  }
}

/**
 * Returns physical effort score (0–100) for a mode and duration.
 * Walking = most effort, plane = none.
 * Very long walks reduce score slightly (exhausting, not optimal exercise).
 */
function calcPhysicalEffort(mode: string, durationMin: number): number {
  let base: number;
  switch (mode.toUpperCase()) {
    case "WALKING":   base = 100; break;
    case "BICYCLING":
    case "CYCLING":   base = 85;  break;
    case "MIXED":     base = 55;  break;  // cycling + transit combined
    case "TRANSIT":   base = 15;  break;
    case "TRAIN":     base = 10;  break;
    case "PLANE":     base = 0;   break;
    default:          base = 20;
  }
  // Diminishing returns for very long walks
  if (mode.toUpperCase() === "WALKING" && durationMin > 90) {
    return Math.max(40, base - Math.floor((durationMin - 90) / 10) * 5);
  }
  return base;
}

/**
 * 5-dimension mood weights — all five values sum to 1.0.
 *
 * carbon   — prefer lower CO2 emissions
 * time     — prefer faster routes
 * comfort  — prefer fewer transfers / no booking hassle
 * cost     — prefer cheaper routes (normalized across candidates)
 * effort   — prefer physically active modes (walking > cycling > transit)
 */
function moodWeights(mood?: RouteMood): {
  carbon: number; time: number; comfort: number; cost: number; effort: number;
} {
  switch (mood) {
    case "HURRY":
      // Time above all else; eco only as a secondary tie-breaker
      return { carbon: 0.05, time: 0.85, comfort: 0.05, cost: 0.00, effort: 0.05 };
    case "EXERCISE":
      // Physical effort dominant; carbon rewards eco-active modes
      return { carbon: 0.15, time: 0.05, comfort: 0.05, cost: 0.05, effort: 0.70 };
    case "RELAXED":
      // Fewest transfers + lowest stress first; eco second; slow is fine
      return { carbon: 0.30, time: 0.10, comfort: 0.50, cost: 0.05, effort: 0.05 };
    case "CHEAPEST":
      // Cost dominates; time secondary; carbon mild incentive
      return { carbon: 0.10, time: 0.15, comfort: 0.15, cost: 0.55, effort: 0.05 };
    default:
      // Eco-first default
      return { carbon: 0.55, time: 0.25, comfort: 0.15, cost: 0.00, effort: 0.05 };
  }
}

function moodRouteReason(mood: RouteMood, candidate: ScoredCandidate): string {
  switch (mood) {
    case "HURRY":
      return "Fastest option — time prioritized for your 'In a hurry' preference";
    case "EXERCISE":
      return "Most active route — physical effort prioritized for your 'Exercise' preference";
    case "RELAXED":
      return "Smoothest journey — fewest transfers and lowest stress for your 'Relaxed' preference";
    case "CHEAPEST":
      return candidate.price != null
        ? `Lowest fare (${candidate.currency ?? ""} ${candidate.price}) — cost prioritized for your 'Cheapest' preference`
        : "Free or lowest-cost option — cost prioritized for your 'Cheapest' preference";
  }
}

// ─────────────────────────────────────────────
// applyWeightedRanking
// ─────────────────────────────────────────────

export const applyWeightedRanking = (candidates: ScoredCandidate[], mood?: RouteMood): RankedRoute[] => {
  if (candidates.length === 0) return [];

  const weights = moodWeights(mood);
  const fastestDuration = Math.min(...candidates.map((c) => c.durationMin));

  // Pre-compute raw costs then normalise to a 0–100 score (100 = free/cheapest).
  // Normalisation is relative to the candidate set, so comparison is fair
  // regardless of whether the trip includes flights, trains, or only local modes.
  const rawCosts = candidates.map(estimateCandidateCost);
  const maxCost = Math.max(...rawCosts, 1); // guard against all-free sets

  const ranked: RankedRoute[] = candidates.map((candidate, idx) => {
    // ── Time score ────────────────────────────────────────────────────────────
    // Ratio-based: fastest candidate = 100; 3× slower = 33.
    const timeScore = Math.round(
      Math.max(0, Math.min(100, (fastestDuration / candidate.durationMin) * 100))
    );

    // ── Comfort score ─────────────────────────────────────────────────────────
    // Measures transfer hassle and booking friction — weighted heavily by RELAXED.
    let comfortScore = 100;
    if (candidate.transferCount && candidate.transferCount > 0) {
      comfortScore -= candidate.transferCount * 8;
    }
    if (candidate.requiresBooking) {
      comfortScore -= 10;
    }
    // Long walks are tiring, not comfortable — penalise comfort dimension only.
    // EXERCISE mood compensates via high effort weight, not a raw bonus.
    if (candidate.mode === "WALKING") {
      if (candidate.durationMin > 75)      comfortScore -= 50;
      else if (candidate.durationMin > 45) comfortScore -= 20;
    }
    comfortScore = Math.max(0, comfortScore);

    // ── Cost score ────────────────────────────────────────────────────────────
    // 100 = free/cheapest relative to other candidates; 0 = most expensive.
    const costScore = Math.round(100 - (rawCosts[idx] / maxCost) * 100);

    // ── Physical effort score ─────────────────────────────────────────────────
    const effortScore = calcPhysicalEffort(candidate.mode, candidate.durationMin);

    // ── Weighted composite ────────────────────────────────────────────────────
    // Inputs are all 0–100; weights sum to 1.0 → result naturally stays 0–100.
    // No artificial cap before the estimated-cycling penalty.
    const baseScore =
      (candidate.carbonScore * weights.carbon)  +
      (timeScore             * weights.time)    +
      (comfortScore          * weights.comfort) +
      (costScore             * weights.cost)    +
      (effortScore           * weights.effort);

    // Estimated cycling (Google bicycling API failed) should not beat real-data
    // routes in default/HURRY mode. EXERCISE's high effort weight naturally
    // offsets most of this penalty for users who want active travel.
    const estimatedCyclingPenalty =
      (candidate.mode === "BICYCLING" || candidate.mode === "CYCLING") &&
      candidate.dataSource === "ESTIMATED" ? 20 : 0;

    const finalScore = Math.max(0, Math.round(baseScore) - estimatedCyclingPenalty);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Ranking] ${candidate.mode}${candidate.subType ? `/${candidate.subType}` : ""}: ` +
        `duration=${candidate.durationMin}min dist=${candidate.distanceKm}km ` +
        `co2=${candidate.co2Grams}g carbonScore=${candidate.carbonScore} ` +
        `timeScore=${timeScore} comfortScore=${comfortScore} ` +
        `costScore=${costScore} effortScore=${effortScore} ` +
        `baseScore=${Math.round(baseScore)} estimatedPenalty=${estimatedCyclingPenalty} ` +
        `finalScore=${finalScore} dataSource=${candidate.dataSource ?? "?"} mood=${mood ?? "none"}`
      );
    }

    return {
      ...candidate,
      timeScore,
      practicalityScore: comfortScore, // field kept for backwards compatibility
      finalScore,
      recommended: false,
      recommendationReason: undefined,
      moodReason: undefined,
    };
  });

  // Primary sort: finalScore descending.
  // Tie-breaker: shorter duration wins (faster route preferred when scores equal).
  ranked.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    return a.durationMin - b.durationMin;
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`[Ranking] Final order (mood=${mood ?? "none"}):`);
    ranked.forEach((r, i) => {
      console.log(
        `  ${i + 1}. ${r.mode}${r.subType ? `/${r.subType}` : ""} ` +
        `finalScore=${r.finalScore} ` +
        `(carbon=${r.carbonScore} time=${r.timeScore} comfort=${r.practicalityScore} ` +
        `effort=${calcPhysicalEffort(r.mode, r.durationMin)})`
      );
    });
  }

  if (ranked.length > 0) {
    ranked[0].recommended = true;
    const top = ranked[0];
    const savingPercent = top.carEquivalentCO2 > 0
      ? Math.round((top.savedVsCar / top.carEquivalentCO2) * 100)
      : 100;
    const extraMin = top.durationMin - fastestDuration;

    if (top.co2Grams === 0) {
      ranked[0].recommendationReason = `Zero emissions — saves ${Math.round(top.carEquivalentCO2 / 100) / 10} kg CO2 vs driving`;
    } else if (extraMin === 0) {
      ranked[0].recommendationReason = `Fastest AND ${savingPercent}% less CO2 than driving`;
    } else if (extraMin <= 10) {
      ranked[0].recommendationReason = `Only ${extraMin} min slower — saves ${savingPercent}% CO2 vs driving`;
    } else {
      ranked[0].recommendationReason = `${savingPercent}% less CO2 than driving — earns ${top.greenPoints} Green Points`;
    }

    if (mood) {
      ranked[0].moodReason = moodRouteReason(mood, top);
    }
  }

  return ranked;
};

// ─────────────────────────────────────────────
// buildCyclingPlusTransit
// ─────────────────────────────────────────────

export const buildCyclingPlusTransit = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ routes: any[] } | null> => {
  try {
    const midpoint = {
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng + destination.lng) / 2,
    };

    const [cyclingRoute, transitRoute] = await Promise.all([
      fetchDirections({
        originLat: origin.lat, originLng: origin.lng,
        destLat: midpoint.lat, destLng: midpoint.lng,
        mode: "bicycling",
      }),
      fetchDirections({
        originLat: midpoint.lat, originLng: midpoint.lng,
        destLat: destination.lat, destLng: destination.lng,
        mode: "transit",
      }),
    ]);

    if (!cyclingRoute || !transitRoute) return null;

    return {
      routes: [{
        legs: [...(cyclingRoute.legs || []), ...(transitRoute.legs || [])],
        overview_polyline: cyclingRoute.overview_polyline,
      }],
    };
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// buildPartnerAssistedCandidates
// ─────────────────────────────────────────────

/**
 * Finds MOBILITY_PROVIDER partner stops along the route corridor and builds
 * a ScoredCandidate for each: transit (origin → stop) + cycling (stop → dest).
 * These are added to the normal candidates pool so they rank naturally.
 */
async function buildPartnerAssistedCandidates(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  totalDistanceKm: number
): Promise<ScoredCandidate[]> {
  const stops = await getMobilityStopsForRoute(origin, destination, 30);
  if (stops.length === 0) return [];

  const carBaselineCO2 = Math.round(totalDistanceKm * 170);
  const candidates: ScoredCandidate[] = [];

  for (const stop of stops.slice(0, 2)) {
    const leg1Km = stop.distanceFromOriginKm;
    const leg2Km = stop.distanceToDestKm;

    // Use high-speed rail CO2 factor for the transit leg
    const leg1CO2 = Math.round(leg1Km * EMISSION_FACTORS.RAIL_HIGHSPEED);

    // Cycling speed: e-bikes are faster
    const cycleKmh = stop.vehicleType === "EBIKE" ? 22 : 15;
    const leg1DurationMin = Math.round((leg1Km / 80) * 60);  // train ~80 km/h avg
    const leg2DurationMin = Math.round((leg2Km / cycleKmh) * 60);
    const totalDurationMin = leg1DurationMin + leg2DurationMin + 15; // +15 min transfer

    const totalCO2   = leg1CO2;
    const savedVsCar = Math.max(0, carBaselineCO2 - totalCO2);
    const carbonScore = clamp(Math.round((savedVsCar / carBaselineCO2) * 100), 0, 100);

    const vehicleLabel =
      stop.vehicleType === "EBIKE"       ? "e-bike"
      : stop.vehicleType === "ESCOOTER"  ? "scooter"
      : stop.vehicleType === "CARGO_BIKE"? "cargo bike"
      : "bicycle";

    candidates.push({
      mode: "MIXED",
      subType: "PARTNER_ASSISTED",
      durationMin: totalDurationMin,
      distanceKm: Math.round((leg1Km + leg2Km) * 10) / 10,
      co2Grams: totalCO2,
      carEquivalentCO2: carBaselineCO2,
      savedVsCar,
      carbonScore,
      greenPoints: calculateGreenPoints(savedVsCar, "CYCLING_TRANSIT"),
      carbonBreakdown: [
        {
          mode: "TRANSIT",
          distanceKm: leg1Km,
          co2Grams: leg1CO2,
          instruction: `Take train to ${stop.partnerName} (${leg1Km.toFixed(0)} km)`,
          startLocation: origin,
          endLocation: { lat: stop.pickupLat, lng: stop.pickupLng },
        },
        {
          mode: "CYCLING",
          distanceKm: leg2Km,
          co2Grams: 0,
          instruction: `Pick up ${vehicleLabel} at ${stop.locationName} — cycle ${leg2Km.toFixed(0)} km to destination`,
          startLocation: { lat: stop.pickupLat, lng: stop.pickupLng },
          endLocation: destination,
        },
      ],
      dataSource: "PARTNER",
      partnerStop: {
        partnerId: stop.partnerId,
        partnerName: stop.partnerName,
        vehicleType: stop.vehicleType,
        pickupLat: stop.pickupLat,
        pickupLng: stop.pickupLng,
        pickupAddress: stop.locationName,
      },
    });
  }

  return candidates;
}

// ─────────────────────────────────────────────
// generateEcoRoutes — master function
// ─────────────────────────────────────────────

export async function generateEcoRoutes(params: {
  origin: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name?: string };
  mood?: RouteMood;
  departureTime?: string;
}): Promise<EcoRoutesResponseData> {
  const { origin, destination, mood, departureTime } = params;

  // v6: HURRY weights carbon→0.10/time→0.80; flight multi-segment; estimated cycling penalty
  const cacheKey = `eco:v6:${routeCacheKey(origin.lat, origin.lng, destination.lat, destination.lng)}-${mood ?? "none"}`;
  const cached = await cacheGet<EcoRoutesResponseData>(cacheKey);
  if (cached) {
    console.log(`[Routing] Cache HIT for ${cacheKey} — returning cached result (${cached.routes?.length ?? 0} routes)`);
    return cached;
  }
  console.log(`[Routing] Cache MISS for ${cacheKey} — building routes fresh`);

  const distanceKm = Math.round(haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng) * 10) / 10;
  const journeyType = detectJourneyType(distanceKm);

  console.log(`[Routing] Journey: ${distanceKm} km | type=${journeyType} | mood=${mood ?? "none"}`);
  console.log(`[Routing] Origin: (${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}) → Dest: (${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)})`);

  const carBaselineCO2 = Math.round(distanceKm * 170);
  const carBaselineDuration = Math.round((distanceKm / 50) * 60 + 10);

  // Decide which Google modes to fetch based on journey type.
  // MICRO  (< 2 km):           walking + cycling
  // URBAN  (2–20 km):          cycling + transit; also walking when ≤ WALKING_MAX_KM (8 km)
  // REGIONAL/INTERCITY/INTL:   transit only (walking/cycling impractical)
  const googleModes: Array<"walking" | "bicycling" | "transit"> = [];
  if (journeyType === "MICRO") {
    googleModes.push("walking", "bicycling");
  } else if (journeyType === "URBAN") {
    if (distanceKm <= WALKING_MAX_KM) {
      googleModes.push("walking");
    }
    googleModes.push("bicycling", "transit");
  } else {
    googleModes.push("transit");
  }
  console.log(`[Routing] Modes to fetch: [${googleModes.join(", ")}]`);

  const googleFetches = googleModes.map((mode) =>
    fetchDirections({
      originLat: origin.lat, originLng: origin.lng,
      destLat: destination.lat, destLng: destination.lng,
      mode,
    }).then((route) => ({ mode, route })).catch(() => ({ mode, route: null as null }))
  );

  // Cycling + Transit combo only makes sense for URBAN journeys
  const cyclingTransitPromise =
    journeyType === "URBAN"
      ? buildCyclingPlusTransit(origin, destination)
      : Promise.resolve(null);

  const [googleResults, cyclingTransitResult] = await Promise.all([
    Promise.all(googleFetches),
    cyclingTransitPromise,
  ]);

  const candidates: ScoredCandidate[] = [];
  let googleTransitGeometry = "";
  let googleTransitBreakdown: ScoredCandidate["carbonBreakdown"] = [];

  for (const { mode, route } of googleResults) {
    if (!route) continue;
    const scored = scoreGoogleRoute({ routes: [route] }, mode.toUpperCase());
    if (scored.distanceKm === 0) continue;

    const modeKey = mode === "walking" ? "WALKING"
      : mode === "bicycling" ? "BICYCLING"
      : "TRANSIT";

    candidates.push({
      mode: modeKey,
      ...scored,
      greenPoints: calculateGreenPoints(scored.savedVsCar, modeKey),
      geometry: route.overview_polyline?.points ?? "",
      dataSource: "GOOGLE_MAPS",
    });

    if (mode === "transit") {
      googleTransitGeometry = route.overview_polyline?.points ?? "";
      googleTransitBreakdown = scored.carbonBreakdown;
    }
  }

  if (cyclingTransitResult) {
    const scored = scoreGoogleRoute(cyclingTransitResult, "TRANSIT");
    if (scored.distanceKm > 0) {
      candidates.push({
        mode: "MIXED",
        subType: "CYCLING_TRANSIT",
        ...scored,
        greenPoints: calculateGreenPoints(scored.savedVsCar, "MIXED"),
        dataSource: "GOOGLE_MAPS",
      });
    }
  }

  // ── Post-Google diagnostics ────────────────────────────────────────────────
  {
    const gotModes = candidates.map(c => c.mode);
    console.log(`[Routing] Google succeeded: [${gotModes.join(", ")}]`);
    const attempted = googleModes.map(m =>
      m === "walking" ? "WALKING" : m === "bicycling" ? "BICYCLING" : "TRANSIT"
    );
    const failed = attempted.filter(m => !gotModes.includes(m));
    if (failed.length > 0) {
      console.log(`[Routing] Google failed/empty: [${failed.join(", ")}]`);
    }
  }

  // ── Fallback walking — if distance is walkable but Google returned nothing ─
  const hasWalking = candidates.some(c => c.mode === "WALKING");
  if (!hasWalking && distanceKm <= WALKING_MAX_KM) {
    const walkDurationMin = Math.round((distanceKm / WALKING_SPEED_KMH) * 60);
    const existingGeom = candidates.find(c => c.geometry)?.geometry ?? "";
    console.log(`[Routing] No walking from Google — adding estimated fallback (${distanceKm} km, ~${walkDurationMin} min)`);
    candidates.push({
      mode: "WALKING",
      durationMin: walkDurationMin,
      distanceKm,
      co2Grams: 0,
      carEquivalentCO2: carBaselineCO2,
      savedVsCar: carBaselineCO2,
      carbonScore: 100,
      greenPoints: calculateGreenPoints(carBaselineCO2, "WALKING"),
      carbonBreakdown: [{
        mode: "WALKING",
        distanceKm,
        co2Grams: 0,
        instruction: `Walk ${distanceKm.toFixed(1)} km to destination`,
        startLocation: origin,
        endLocation: destination,
      }],
      geometry: existingGeom,
      dataSource: "ESTIMATED",
    });
  }

  // ── Fallback cycling — if distance is cyclable but Google returned nothing ──
  const hasCycling = candidates.some(c => c.mode === "BICYCLING" || c.mode === "CYCLING");
  if (!hasCycling && distanceKm <= CYCLING_MAX_KM && (journeyType === "MICRO" || journeyType === "URBAN")) {
    const cyclingDurationMin = Math.round((distanceKm / CYCLING_SPEED_KMH) * 60);
    const existingGeom = candidates.find(c => c.geometry)?.geometry ?? "";
    console.log(`[Routing] No cycling from Google — adding estimated fallback (${distanceKm} km, ~${cyclingDurationMin} min)`);
    candidates.push({
      mode: "BICYCLING",
      durationMin: cyclingDurationMin,
      distanceKm,
      co2Grams: 0,
      carEquivalentCO2: carBaselineCO2,
      savedVsCar: carBaselineCO2,
      carbonScore: 100,
      greenPoints: calculateGreenPoints(carBaselineCO2, "BICYCLING"),
      carbonBreakdown: [{
        mode: "BICYCLING",
        distanceKm,
        co2Grams: 0,
        instruction: `Cycle ${distanceKm.toFixed(1)} km to destination`,
        startLocation: origin,
        endLocation: destination,
      }],
      geometry: existingGeom,
      dataSource: "ESTIMATED",
    });
  }

  let hasTrainData = false;

  if (journeyType === "INTERCITY" || journeyType === "REGIONAL") {
    try {
      const trainsMod = await import("./trains.service");
      const departureDate = departureTime ? new Date(departureTime) : new Date();
      const trainOptions = await trainsMod.getTrainOptions(
        origin.lat, origin.lng,
        destination.lat, destination.lng,
        departureDate
      );
      if (trainOptions && trainOptions.length > 0) {
        const trainCandidates = (trainOptions as ScoredCandidate[]).map((option) => {
          const hasStepGeometry = option.carbonBreakdown.some((step) => step.polyline || (step.startLocation && step.endLocation));
          return {
            ...option,
            geometry: option.geometry || googleTransitGeometry,
            carbonBreakdown: hasStepGeometry || googleTransitBreakdown.length === 0
              ? option.carbonBreakdown
              : googleTransitBreakdown,
          };
        });
        candidates.push(...trainCandidates);
        hasTrainData = true;
      }
    } catch {
      // trains service unavailable
    }
  }

  if (journeyType === "INTERCITY" || journeyType === "INTERNATIONAL") {
    try {
      const flightsMod = await import("./flights.service");
      const flightOption = await flightsMod.getFlightOption(
        origin.lat, origin.lng,
        destination.lat, destination.lng
      );
      if (flightOption) {
        candidates.push(flightOption as ScoredCandidate);
      }
    } catch {
      // flights service unavailable
    }
  }

  // Partner-assisted route candidates (transit + partner bike pickup)
  try {
    const partnerCandidates = await buildPartnerAssistedCandidates(origin, destination, distanceKm);
    if (partnerCandidates.length > 0) {
      console.log(`[Routing] Added ${partnerCandidates.length} partner-assisted candidate(s):`,
        partnerCandidates.map(c => `${c.partnerStop?.partnerName} (${c.co2Grams}g CO2, ${c.durationMin}min)`).join(', ')
      );
    } else {
      console.log(`[Routing] No partner-assisted candidates found for this route.`);
    }
    candidates.push(...partnerCandidates);
  } catch (e) {
    console.error('[Routing] buildPartnerAssistedCandidates failed:', e);
  }

  const rankedRoutes = applyWeightedRanking(candidates, mood);
  console.log(
    `[Routing] Final ranked (${rankedRoutes.length}): ` +
    rankedRoutes.map((r, i) =>
      `${i + 1}. ${r.mode}${r.subType ? `/${r.subType}` : ""} score=${r.finalScore}${r.recommended ? " ★" : ""}`
    ).join(" | ")
  );

  // Partner pins along top route
  let partnerPins: PartnerPin[] = [];
  if (rankedRoutes.length > 0 && rankedRoutes[0].geometry) {
    try {
      const routeCoords = decodePolylineToCoords(rankedRoutes[0].geometry as string);
      const pins = await getEcoBusinessPartnersAlongRoute(routeCoords, prisma);
      partnerPins = pins as PartnerPin[];
    } catch {
      try {
        const midLat = (origin.lat + destination.lat) / 2;
        const midLng = (origin.lng + destination.lng) / 2;
        const nearby = await findNearbyPartners(midLat, midLng, 800);
        await Promise.allSettled(nearby.map((p) => recordPartnerView(p.id)));
      } catch {
        // silently ignore
      }
    }
  }

  // Data quality
  let dataQuality: "HIGH" | "MEDIUM" | "LOW";
  let dataQualityMessage: string;

  if ((journeyType === "URBAN" || journeyType === "REGIONAL") && candidates.some((c) => c.mode === "TRANSIT")) {
    dataQuality = "HIGH";
    dataQualityMessage = "Real-time transit data from Google Maps";
  } else if (journeyType === "INTERCITY" && hasTrainData) {
    dataQuality = "HIGH";
    dataQualityMessage = "Live train data from Deutsche Bahn API";
  } else if (journeyType === "INTERNATIONAL") {
    dataQuality = "MEDIUM";
    dataQualityMessage = "Flight CO2 estimates based on IPCC emission factors";
  } else if (candidates.length === 0) {
    dataQuality = "LOW";
    dataQualityMessage = "Limited route data available for this journey";
  } else {
    dataQuality = "MEDIUM";
    dataQualityMessage = "Route data from Google Maps";
  }

  const fallbackTopRoute: RankedRoute = {
    mode: "WALKING",
    durationMin: carBaselineDuration,
    distanceKm,
    co2Grams: 0,
    carEquivalentCO2: carBaselineCO2,
    savedVsCar: carBaselineCO2,
    carbonScore: 100,
    greenPoints: 0,
    carbonBreakdown: [],
    timeScore: 0,
    practicalityScore: 100,
    finalScore: 0,
    recommended: true,
  };

  const result: EcoRoutesResponseData = {
    success: true,
    journeyType,
    distanceKm,
    routes: rankedRoutes,
    topRoute: { ...(rankedRoutes[0] ?? fallbackTopRoute), partnerPins },
    carBaseline: { co2Grams: carBaselineCO2, durationMin: carBaselineDuration },
    dataQuality,
    dataQualityMessage,
  };

  await cacheSet(cacheKey, result, 3600);
  return result;
}

// ─────────────────────────────────────────────
// generateRoutes (legacy — kept)
// ─────────────────────────────────────────────

interface RouteRequest {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  originAddress: string;
  destAddress: string;
}

const MODE_CONFIG: Array<{
  mode: TripMode;
  googleMode: "walking" | "bicycling" | "transit";
  label: string;
}> = [
  { mode: TripMode.CYCLING, googleMode: "bicycling", label: "Cycling" },
  { mode: TripMode.TRANSIT, googleMode: "transit", label: "Transit" },
  { mode: TripMode.WALKING, googleMode: "walking", label: "Walking" },
];

export async function generateRoutes(req: RouteRequest): Promise<RouteOption[]> {
  const cacheKey = routeCacheKey(req.originLat, req.originLng, req.destLat, req.destLng);
  const cached = await cacheGet<RouteOption[]>(cacheKey);
  if (cached) return cached;

  const routePromises = MODE_CONFIG.map(async (cfg) => {
    const googleRoute = await fetchDirections({
      originLat: req.originLat, originLng: req.originLng,
      destLat: req.destLat, destLng: req.destLng,
      mode: cfg.googleMode,
    });

    if (!googleRoute) return null;

    const { distanceKm, durationMinutes } = parseDistanceDuration(googleRoute);
    const steps = parseSteps(googleRoute);
    const carbon = calculateCarbon(cfg.mode, distanceKm, durationMinutes);
    const polyline = googleRoute.overview_polyline?.points ?? "";

    const nearbyPartners = await findNearbyPartners(
      (req.originLat + req.destLat) / 2,
      (req.originLng + req.destLng) / 2,
      800
    );

    await Promise.allSettled(nearbyPartners.map((p) => recordPartnerView(p.id)));

    return {
      id: randomUUID() as string,
      mode: cfg.mode,
      label: cfg.label,
      distanceKm: carbon.distanceKm,
      durationMinutes: carbon.durationMinutes,
      co2Grams: carbon.co2Grams,
      co2SavedVsCar: carbon.savedVsCar,
      ecoScore: carbon.ecoScore,
      greenPoints: carbon.greenPoints,
      isRecommended: false,
      polyline,
      steps,
      nearbyPartners,
    } as RouteOption;
  });

  const rawResults = await Promise.allSettled(routePromises);
  const routes: RouteOption[] = rawResults
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<RouteOption | null>).value)
    .filter((r): r is RouteOption => r !== null);

  const cyclingRoute = routes.find((r) => r.mode === TripMode.CYCLING);
  const transitRoute = routes.find((r) => r.mode === TripMode.TRANSIT);

  if (cyclingRoute && transitRoute) {
    const blendedDistanceKm = cyclingRoute.distanceKm * 0.4 + transitRoute.distanceKm * 0.6;
    const blendedDuration = Math.ceil(cyclingRoute.durationMinutes * 0.4 + transitRoute.durationMinutes * 0.6);
    const carbon = calculateCarbon(TripMode.CYCLING_TRANSIT, blendedDistanceKm, blendedDuration);

    routes.push({
      id: randomUUID(),
      mode: TripMode.CYCLING_TRANSIT,
      label: "Cycling + Transit",
      distanceKm: carbon.distanceKm,
      durationMinutes: carbon.durationMinutes,
      co2Grams: carbon.co2Grams,
      co2SavedVsCar: carbon.savedVsCar,
      ecoScore: carbon.ecoScore,
      greenPoints: carbon.greenPoints,
      isRecommended: false,
      polyline: cyclingRoute.polyline,
      steps: [...cyclingRoute.steps, ...transitRoute.steps],
      nearbyPartners: cyclingRoute.nearbyPartners,
    });
  }

  routes.sort((a, b) => {
    if (b.ecoScore !== a.ecoScore) return b.ecoScore - a.ecoScore;
    return a.durationMinutes - b.durationMinutes;
  });

  if (routes.length > 0) routes[0]!.isRecommended = true;

  await cacheSet(cacheKey, routes, 300);
  return routes;
}
