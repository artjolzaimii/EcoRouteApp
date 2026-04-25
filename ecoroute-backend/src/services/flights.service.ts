import { haversineDistance } from "../utils/helpers";
import { calculateFlightCO2 } from "./carbon.service";
import { prisma } from "../config/prisma";

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

  try {
    const [originAirport, destAirport] = await Promise.all([
      findNearestAirport(originLat, originLng),
      findNearestAirport(destLat, destLng),
    ]);

    if (!originAirport || !destAirport) return null;
    if (originAirport.iata_code === destAirport.iata_code) return null;

    const flightDistanceKm = haversineDistance(
      Number(originAirport.lat), Number(originAirport.lng),
      Number(destAirport.lat), Number(destAirport.lng)
    ) + 95;

    const co2Grams = calculateFlightCO2(flightDistanceKm, "economy");
    const carEquivalentCO2 = Math.round(straightLineKm * 170);

    const flightTimeMin    = Math.round((flightDistanceKm / 800) * 60);
    const airportOverhead  = 150;
    const airportTravelMin = 60;
    const totalDurationMin = flightTimeMin + airportOverhead + airportTravelMin;

    return {
      mode:            "PLANE",
      durationMin:     totalDurationMin,
      co2Grams,
      distanceKm:      Math.round(flightDistanceKm),
      carEquivalentCO2,
      savedVsCar:      Math.max(0, carEquivalentCO2 - co2Grams),
      carbonScore:     Math.round(Math.max(0, 100 - (co2Grams / Math.max(1, carEquivalentCO2)) * 100)),
      greenPoints:     Math.round(Math.max(0, carEquivalentCO2 - co2Grams) / 10),
      carbonBreakdown: [{
        mode: "PLANE",
        distanceKm: Math.round(flightDistanceKm),
        co2Grams,
        instruction: `Flight from ${originAirport.name} (${originAirport.iata_code}) to ${destAirport.name} (${destAirport.iata_code})`,
      }],
      originAirport:   `${originAirport.name} (${originAirport.iata_code})`,
      destAirport:     `${destAirport.name} (${destAirport.iata_code})`,
      requiresBooking: true,
      bookingUrl:      `https://www.google.com/flights#flt=${originAirport.iata_code}.${destAirport.iata_code}`,
      note:            "Carbon estimate based on IPCC emission factors with radiative forcing index 1.9",
      dataSource:      "CALCULATED",
    };

  } catch {
    return null;
  }
};
