const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
};

/**
 * Forward geocode — address string → lat/lng.
 * Uses the Google Maps Geocoding API.
 */
export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_KEY || !address.trim()) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.[0]) return null;

    const top = data.results[0];
    return {
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
      formattedAddress: top.formatted_address,
    };
  } catch {
    return null;
  }
}

/**
 * Reverse geocode — lat/lng → human-readable address string.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  if (!GOOGLE_MAPS_KEY) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=street_address|locality&key=${GOOGLE_MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }

    // Prefer a short neighborhood/locality name for "Current Location" display
    const short = data.results[0].address_components?.find(
      (c: { types: string[] }) =>
        c.types.includes('neighborhood') || c.types.includes('sublocality_level_1'),
    );
    return short?.long_name ?? data.results[0].formatted_address ?? 'Current location';
  } catch {
    return 'Current location';
  }
}

/**
 * Places text search — returns top N autocomplete-like results for a query.
 * Uses Geocoding API with multiple results for a lightweight suggestion list.
 */
export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  if (!GOOGLE_MAPS_KEY || query.length < 3) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') return [];

    return (data.results as any[]).slice(0, 5).map((r: any) => ({
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      formattedAddress: r.formatted_address,
    }));
  } catch {
    return [];
  }
}
