import { haversineDistance } from "../utils/helpers";
import { cacheGet, cacheSet } from "./cache.service";

const DB_API = "https://v6.db.transport.rest";

// Hard cap on every DB REST API call. The /journeys endpoint regularly takes
// 10+ seconds with no error — without this the route request hangs indefinitely.
const DB_TIMEOUT_MS = 2500;

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

export const findNearestStation = async (lat: number, lng: number) => {
  // 3 decimal places ≈ 111 m precision — more than enough for station lookup
  const cacheKey = `station:nearby:${lat.toFixed(3)}:${lng.toFixed(3)}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `${DB_API}/locations/nearby?latitude=${lat}&longitude=${lng}&results=3&stops=true`,
      DB_TIMEOUT_MS
    );
    if (!response.ok) return null;
    const stations = await response.json() as any[];
    const station = stations?.[0] ?? null;
    if (station) await cacheSet(cacheKey, station, 86400); // 24h — stations don't move
    return station;
  } catch {
    return null;
  }
};

export const getTrainOptions = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  departureTime: Date = new Date()
): Promise<any[] | null> => {
  try {
    const [originStation, destStation] = await Promise.all([
      findNearestStation(originLat, originLng),
      findNearestStation(destLat, destLng),
    ]);

    if (!originStation || !destStation) return null;

    // Cache journey results by station pair + departure hour.
    // Searching the same route twice within the same hour returns instantly.
    const departureDateHour = departureTime.toISOString().slice(0, 13); // "2026-05-19T14"
    const journeyCacheKey = `trains:${originStation.id}:${destStation.id}:${departureDateHour}`;
    const cachedJourneys = await cacheGet<any[]>(journeyCacheKey);
    if (cachedJourneys) {
      console.log(`[Trains] Cache HIT for ${journeyCacheKey}`);
      return cachedJourneys;
    }

    const response = await fetchWithTimeout(
      `${DB_API}/journeys?` +
      `from=${encodeURIComponent(originStation.id)}&` +
      `to=${encodeURIComponent(destStation.id)}&` +
      `departure=${departureTime.toISOString()}&` +
      `results=3&` +
      `stopovers=false&` +
      `language=en`,
      DB_TIMEOUT_MS
    );

    if (!response.ok) return null;
    const data = await response.json() as any;

    if (!data.journeys?.length) return null;

    const distanceKm = haversineDistance(originLat, originLng, destLat, destLng) * 1.15;

    const results = data.journeys.slice(0, 2).map((journey: any) => {
      const departure = new Date(journey.legs[0].departure);
      const arrival   = new Date(journey.legs[journey.legs.length - 1].arrival);
      const durationMin = Math.round((arrival.getTime() - departure.getTime()) / 60000);
      const transferCount = journey.legs.filter((l: any) => !l.walking).length - 1;

      const co2Grams = Math.round(distanceKm * 14); // high-speed rail factor

      return {
        mode:           "TRAIN",
        subType:        "RAIL_HIGHSPEED",
        durationMin,
        co2Grams,
        distanceKm:     Math.round(distanceKm * 10) / 10,
        carEquivalentCO2: Math.round(distanceKm * 170),
        savedVsCar:     Math.round(distanceKm * 170) - co2Grams,
        carbonScore:    Math.round(Math.max(0, 100 - (co2Grams / (distanceKm * 170)) * 100)),
        greenPoints:    Math.round((distanceKm * 170 - co2Grams) / 10),
        carbonBreakdown: [{
          mode: "RAIL_HIGHSPEED",
          distanceKm: Math.round(distanceKm * 10) / 10,
          co2Grams,
          instruction: `Train from ${originStation.name} to ${destStation.name}`,
        }],
        transferCount,
        requiresBooking: true,
        bookingUrl:     "https://bahn.de",
        originStation:  originStation.name,
        destStation:    destStation.name,
        departureTime:  departure.toISOString(),
        arrivalTime:    arrival.toISOString(),
        price:          journey.price?.amount ?? null,
        currency:       journey.price?.currency ?? "EUR",
        dataSource:     "DB_API",
      };
    });

    await cacheSet(journeyCacheKey, results, 1800); // 30 min — schedules don't change that fast
    return results;

  } catch {
    return null;
  }
};
