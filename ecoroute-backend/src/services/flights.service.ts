import { haversineDistance } from "../utils/helpers";
import { calculateFlightCO2 } from "./carbon.service";
import { prisma } from "../config/prisma";
import { cacheGet, cacheSet } from "./cache.service";

export const findNearestAirport = async (lat: number, lng: number) => {
  try {
    const airports = await prisma.$queryRaw<any[]>`
      SELECT
        id, name, iata_code,
        CAST(latitude_deg AS FLOAT) as lat,
        CAST(longitude_deg AS FLOAT) as lng,
        (6371 * acos(
          LEAST(1.0, cos(radians(${lat})) * cos(radians(CAST(latitude_deg AS FLOAT))) *
          cos(radians(CAST(longitude_deg AS FLOAT)) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(CAST(latitude_deg AS FLOAT))))
        )) AS distance_km
      FROM airports
      WHERE type IN ('large_airport', 'medium_airport')
      AND iata_code IS NOT NULL
      AND iata_code != ''
      ORDER BY distance_km
      LIMIT 3
    `;

    return airports?.[0] ?? null;
  } catch {
    return null;
  }
};

export const getFlightOption = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<any | null> => {
  const straightLineKm = haversineDistance(originLat, originLng, destLat, destLng);

  if (straightLineKm < 300) return null;

  // Flight output is fully deterministic (no live data) — cache for 1 hour
  const cacheKey = `flights:${originLat.toFixed(3)}:${originLng.toFixed(3)}:${destLat.toFixed(3)}:${destLng.toFixed(3)}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  try {
    const [originAirport, destAirport] = await Promise.all([
      findNearestAirport(originLat, originLng),
      findNearestAirport(destLat, destLng),
    ]);

    if (!originAirport || !destAirport) return null;
    if (originAirport.iata_code === destAirport.iata_code) return null;

    const originAirportLat = Number(originAirport.lat);
    const originAirportLng = Number(originAirport.lng);
    const destAirportLat   = Number(destAirport.lat);
    const destAirportLng   = Number(destAirport.lng);

    const flightDistanceKm = haversineDistance(
      originAirportLat, originAirportLng,
      destAirportLat,   destAirportLng
    ) + 95; // add 95 km for takeoff/landing routing overhead

    const co2Grams = calculateFlightCO2(flightDistanceKm, "economy");
    const carEquivalentCO2 = Math.round(straightLineKm * 170);

    // Ground access/egress distances (airport ↔ user location)
    const accessKm = haversineDistance(originLat, originLng, originAirportLat, originAirportLng);
    const egressKm = haversineDistance(destAirportLat, destAirportLng, destLat, destLng);

    // Ground travel to/from airports at ~40 km/h average (public transit / taxi)
    const accessDurationMin  = Math.max(15, Math.round((accessKm  / 40) * 60));
    const egressDurationMin  = Math.max(15, Math.round((egressKm  / 40) * 60));
    const flightTimeMin      = Math.round((flightDistanceKm / 800) * 60);
    const airportOverheadMin = 150; // check-in + security + boarding
    const totalDurationMin   = accessDurationMin + airportOverheadMin + flightTimeMin + egressDurationMin;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Flight] ${originAirport.iata_code}→${destAirport.iata_code}: ` +
        `access=${accessKm.toFixed(1)}km/${accessDurationMin}min ` +
        `overhead=${airportOverheadMin}min ` +
        `flight=${Math.round(flightDistanceKm)}km/${flightTimeMin}min ` +
        `egress=${egressKm.toFixed(1)}km/${egressDurationMin}min ` +
        `total=${totalDurationMin}min co2=${co2Grams}g`
      );
    }

    const result = {
      mode:            "PLANE",
      durationMin:     totalDurationMin,
      co2Grams,
      distanceKm:      Math.round(flightDistanceKm),
      carEquivalentCO2,
      savedVsCar:      Math.max(0, carEquivalentCO2 - co2Grams),
      carbonScore:     Math.round(Math.max(0, 100 - (co2Grams / Math.max(1, carEquivalentCO2)) * 100)),
      greenPoints:     Math.round(Math.max(0, carEquivalentCO2 - co2Grams) / 10),
      // Three-segment breakdown: ground access → flight → ground egress.
      // Each leg has startLocation/endLocation so the map draws realistic segments
      // instead of a single straight line from origin to destination.
      carbonBreakdown: [
        {
          mode: "TRANSIT",
          distanceKm: Math.round(accessKm * 10) / 10,
          co2Grams: 0,
          instruction: `Travel to ${originAirport.name} (${originAirport.iata_code}) — approx. ${accessDurationMin} min`,
          startLocation: { lat: originLat, lng: originLng },
          endLocation:   { lat: originAirportLat, lng: originAirportLng },
        },
        {
          mode: "PLANE",
          distanceKm: Math.round(flightDistanceKm),
          co2Grams,
          instruction: `Flight ${originAirport.iata_code} → ${destAirport.iata_code} (${flightTimeMin} min) — includes ${Math.round(airportOverheadMin / 60 * 10) / 10}h airport time`,
          startLocation: { lat: originAirportLat, lng: originAirportLng },
          endLocation:   { lat: destAirportLat,   lng: destAirportLng   },
        },
        {
          mode: "TRANSIT",
          distanceKm: Math.round(egressKm * 10) / 10,
          co2Grams: 0,
          instruction: `Travel from ${destAirport.name} (${destAirport.iata_code}) to destination — approx. ${egressDurationMin} min`,
          startLocation: { lat: destAirportLat, lng: destAirportLng },
          endLocation:   { lat: destLat, lng: destLng },
        },
      ],
      originAirport:   `${originAirport.name} (${originAirport.iata_code})`,
      destAirport:     `${destAirport.name} (${destAirport.iata_code})`,
      requiresBooking: true,
      bookingUrl:      `https://www.google.com/flights#flt=${originAirport.iata_code}.${destAirport.iata_code}`,
      note:            "CO₂ estimate covers the flight segment only (IPCC factors, RFI 1.9). Ground access CO₂ not included.",
      dataSource:      "CALCULATED",
    };

    await cacheSet(cacheKey, result, 3600); // 1h — fully deterministic, airports don't move
    return result;

  } catch {
    return null;
  }
};
