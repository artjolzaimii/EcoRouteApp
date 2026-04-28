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

// ─────────────────────────────────────────────
// applyWeightedRanking
// ─────────────────────────────────────────────

export const applyWeightedRanking = (candidates: ScoredCandidate[]): RankedRoute[] => {
  if (candidates.length === 0) return [];

  const fastestDuration = Math.min(...candidates.map((c) => c.durationMin));

  const ranked: RankedRoute[] = candidates.map((candidate) => {
    const extraMinutes = candidate.durationMin - fastestDuration;
    const timeScore = Math.max(0, Math.round(100 - (extraMinutes / 10) * 4));

    let practicalityScore = 100;
    if (candidate.transferCount && candidate.transferCount > 0) {
      practicalityScore -= candidate.transferCount * 8;
    }
    if (candidate.requiresBooking) {
      practicalityScore -= 10;
    }
    practicalityScore = Math.max(0, practicalityScore);

    const finalScore = Math.round(
      (candidate.carbonScore    * 0.60) +
      (timeScore                * 0.25) +
      (practicalityScore        * 0.15)
    );

    return {
      ...candidate,
      timeScore,
      practicalityScore,
      finalScore,
      recommended: false,
      recommendationReason: undefined,
    };
  });

  ranked.sort((a, b) => b.finalScore - a.finalScore);

  if (ranked.length > 0) {
    ranked[0].recommended = true;
    const top = ranked[0];
    const savingPercent = top.carEquivalentCO2 > 0
      ? Math.round((top.savedVsCar / top.carEquivalentCO2) * 100)
      : 100;
    const extraMin = top.durationMin - fastestDuration;

    if (top.co2Grams === 0) {
      ranked[0].recommendationReason = `Zero emissions — saves ${Math.round(top.carEquivalentCO2 / 100) / 10}kg CO2 vs driving`;
    } else if (extraMin === 0) {
      ranked[0].recommendationReason = `Fastest AND ${savingPercent}% less CO2 than driving`;
    } else if (extraMin <= 10) {
      ranked[0].recommendationReason = `Only ${extraMin} min slower — saves ${savingPercent}% CO2 vs driving`;
    } else {
      ranked[0].recommendationReason = `${savingPercent}% less CO2 than driving — earns ${top.greenPoints} Green Points`;
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
  departureTime?: string;
}): Promise<EcoRoutesResponseData> {
  const { origin, destination, departureTime } = params;

  // v3: invalidates cached route responses that may be missing train geometry
  const cacheKey = `eco:v3:${routeCacheKey(origin.lat, origin.lng, destination.lat, destination.lng)}`;
  const cached = await cacheGet<EcoRoutesResponseData>(cacheKey);
  if (cached) {
    console.log(`[Routing] Cache HIT for ${cacheKey} — returning cached result (${cached.routes?.length ?? 0} routes)`);
    return cached;
  }
  console.log(`[Routing] Cache MISS for ${cacheKey} — building routes fresh`);

  const distanceKm = Math.round(haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng) * 10) / 10;
  const journeyType = detectJourneyType(distanceKm);

  const carBaselineCO2 = Math.round(distanceKm * 170);
  const carBaselineDuration = Math.round((distanceKm / 50) * 60 + 10);

  // Decide which Google modes to fetch based on journey type (Step 1 of algorithm).
  // MICRO  (< 2km):    walking + cycling only — no transit needed
  // URBAN  (2–20km):   cycling + transit (+ walking as fallback)
  // REGIONAL (20–150km): transit only — walking/cycling are impractical at this scale
  // INTERCITY/INTERNATIONAL: transit only (train/flight handled separately)
  const googleModes: Array<"walking" | "bicycling" | "transit"> = [];
  if (journeyType === "MICRO") {
    googleModes.push("walking", "bicycling");
  } else if (journeyType === "URBAN") {
    googleModes.push("bicycling", "transit");
  } else {
    // REGIONAL, INTERCITY, INTERNATIONAL — transit only from Google
    googleModes.push("transit");
  }

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

  const rankedRoutes = applyWeightedRanking(candidates);

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
