import axios from "axios";
import {
  GoogleDirectionsResponse,
  GoogleDirectionsRoute,
  RouteStep,
} from "../types";

const MAPS_BASE = "https://maps.googleapis.com/maps/api/directions/json";

type GoogleTravelMode = "walking" | "bicycling" | "transit" | "driving";

interface DirectionsParams {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  mode: GoogleTravelMode;
}

/**
 * Fetch a single set of directions from Google Maps Directions API.
 * Returns the first route or null if no route found.
 */
export async function fetchDirections(
  params: DirectionsParams
): Promise<GoogleDirectionsRoute | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is not set");

  const origin = `${params.originLat},${params.originLng}`;
  const destination = `${params.destLat},${params.destLng}`;

  const response = await axios.get<GoogleDirectionsResponse>(MAPS_BASE, {
    params: {
      origin,
      destination,
      mode: params.mode,
      alternatives: true,
      key: apiKey,
    },
    timeout: 8000,
  });

  const data = response.data;

  if (data.status !== "OK" || data.routes.length === 0) {
    return null;
  }

  // Return the shortest-distance route
  const sorted = [...data.routes].sort(
    (a, b) => (a.legs[0]?.distance.value ?? 0) - (b.legs[0]?.distance.value ?? 0)
  );
  return sorted[0] ?? null;
}

/**
 * Parse Google Directions route into our RouteStep array.
 */
export function parseSteps(route: GoogleDirectionsRoute): RouteStep[] {
  const leg = route.legs[0];
  if (!leg) return [];

  return leg.steps.map((step) => ({
    mode: step.travel_mode.toLowerCase(),
    instruction: step.html_instructions.replace(/<[^>]+>/g, ""), // strip HTML
    distanceM: step.distance.value,
    durationS: step.duration.value,
    polyline: step.polyline?.points,
    startLocation: step.start_location,
    endLocation: step.end_location,
  }));
}

/**
 * Extract distance (km) and duration (minutes) from a route.
 */
export function parseDistanceDuration(route: GoogleDirectionsRoute): {
  distanceKm: number;
  durationMinutes: number;
} {
  const leg = route.legs[0];
  return {
    distanceKm: Math.round(((leg?.distance.value ?? 0) / 1000) * 100) / 100,
    durationMinutes: Math.ceil((leg?.duration.value ?? 0) / 60),
  };
}
