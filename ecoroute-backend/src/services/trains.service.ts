import { haversineDistance } from "../utils/helpers";

const DB_API = "https://v6.db.transport.rest";

export const findNearestStation = async (lat: number, lng: number) => {
  try {
    const response = await fetch(
      `${DB_API}/locations/nearby?latitude=${lat}&longitude=${lng}&results=3&stops=true`
    );
    if (!response.ok) return null;
    const stations = await response.json() as any[];
    return stations?.[0] ?? null;
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

    const response = await fetch(
      `${DB_API}/journeys?` +
      `from=${encodeURIComponent(originStation.id)}&` +
      `to=${encodeURIComponent(destStation.id)}&` +
      `departure=${departureTime.toISOString()}&` +
      `results=3&` +
      `stopovers=false&` +
      `language=en`
    );

    if (!response.ok) return null;
    const data = await response.json() as any;

    if (!data.journeys?.length) return null;

    const distanceKm = haversineDistance(originLat, originLng, destLat, destLng) * 1.15;

    return data.journeys.slice(0, 2).map((journey: any) => {
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

  } catch {
    return null;
  }
};
