import { randomUUID } from "crypto";
import { TripMode } from "@prisma/client";
import { fetchDirections, parseSteps, parseDistanceDuration } from "./google.service";
import { calculateCarbon } from "./carbon.service";
import { findNearbyPartners, recordPartnerView } from "./partners.service";
import { cacheGet, cacheSet, routeCacheKey } from "./cache.service";
import { RouteOption } from "../types";

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

/**
 * Generate scored and ranked route options for a given origin → destination.
 * Results are cached in Redis for 5 minutes.
 */
export async function generateRoutes(req: RouteRequest): Promise<RouteOption[]> {
  const cacheKey = routeCacheKey(req.originLat, req.originLng, req.destLat, req.destLng);
  const cached = await cacheGet<RouteOption[]>(cacheKey);
  if (cached) return cached;

  const routePromises = MODE_CONFIG.map(async (cfg) => {
    const googleRoute = await fetchDirections({
      originLat: req.originLat,
      originLng: req.originLng,
      destLat: req.destLat,
      destLng: req.destLng,
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

    // Record view analytics for nearby partners
    await Promise.allSettled(nearbyPartners.map((p) => recordPartnerView(p.id)));

    const option: RouteOption = {
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
    };
    return option;
  });

  // Also build a cycling + transit combo option (if both are available)
  const rawResults = await Promise.allSettled(routePromises);
  const routes: RouteOption[] = rawResults
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<RouteOption | null>).value)
    .filter((r): r is RouteOption => r !== null);

  // Add cycling+transit combo if we have both modes
  const cyclingRoute = routes.find((r) => r.mode === TripMode.CYCLING);
  const transitRoute = routes.find((r) => r.mode === TripMode.TRANSIT);

  if (cyclingRoute && transitRoute) {
    const blendedDistanceKm =
      cyclingRoute.distanceKm * 0.4 + transitRoute.distanceKm * 0.6;
    const blendedDuration =
      Math.ceil(cyclingRoute.durationMinutes * 0.4 + transitRoute.durationMinutes * 0.6);
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

  // Rank: primary sort by ecoScore DESC, secondary by durationMinutes ASC
  routes.sort((a, b) => {
    if (b.ecoScore !== a.ecoScore) return b.ecoScore - a.ecoScore;
    return a.durationMinutes - b.durationMinutes;
  });

  // Mark the best route
  if (routes.length > 0) {
    routes[0]!.isRecommended = true;
  }

  await cacheSet(cacheKey, routes, 300);
  return routes;
}
