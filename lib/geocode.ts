const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

// ─── Places API circuit breaker ──────────────────────────────────────────────
// When Places Autocomplete returns REQUEST_DENIED (API not enabled or key
// restricted), skip retrying on every keystroke. Retry after 5 minutes in
// case the user has since enabled the API in their Cloud Console.
let _placesUnavailableUntil = 0;   // epoch ms; 0 = unknown/available

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
};

/**
 * A single place suggestion shown in the search list.
 * When `lat`/`lng` are present (Geocoding path), no extra detail call is needed.
 * When only `placeId` is present (Autocomplete path), call resolvePlaceId() on select.
 */
export type PlacePrediction = {
  placeId: string;
  mainText: string;       // Primary label  e.g. "Eiffel Tower"
  secondaryText: string;  // Context        e.g. "Paris, France"
  formattedAddress: string;
  lat?: number;           // Present when derived from Geocoding API (no extra call needed)
  lng?: number;
};

// ─── Label helpers ────────────────────────────────────────────────────────────

/**
 * Build mainText + secondaryText from a Geocoding API result's address_components
 * and formatted_address. Much friendlier than showing the raw full address.
 */
function buildLabelsFromGeocoding(result: any): { mainText: string; secondaryText: string } {
  const components: Array<{ long_name: string; types: string[] }> =
    result.address_components ?? [];
  const full: string = result.formatted_address ?? '';

  // Priority order for main name
  const mainTypes = [
    'point_of_interest',
    'establishment',
    'natural_feature',
    'premise',
    'route',
    'sublocality_level_1',
    'neighborhood',
    'locality',
  ];

  let mainText = '';
  for (const type of mainTypes) {
    const c = components.find((x) => x.types.includes(type));
    if (c) { mainText = c.long_name; break; }
  }

  // Fallback: first segment of formatted_address
  if (!mainText) {
    mainText = full.split(',')[0]?.trim() ?? full;
  }

  // Build secondary from locality → area → country
  const locality = components.find((c) => c.types.includes('locality'));
  const area = components.find(
    (c) =>
      c.types.includes('administrative_area_level_1') ||
      c.types.includes('administrative_area_level_2'),
  );
  const country = components.find((c) => c.types.includes('country'));

  const secondaryParts = [locality?.long_name, area?.long_name, country?.long_name]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe

  // If mainText already consumed locality, drop it from secondary
  const secondaryText =
    secondaryParts.filter((p) => p !== mainText).join(', ') ||
    full.split(',').slice(1).join(',').trim();

  return { mainText, secondaryText };
}

// ─── Geocoding search (primary / fallback) ────────────────────────────────────

async function searchViaGeocoding(query: string): Promise<PlacePrediction[]> {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(query)}` +
      `&key=${GOOGLE_MAPS_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') {
      console.warn('[EcoRoute] Geocoding API error:', data.status, data.error_message ?? '(no message)');
      return [];
    }

    return (data.results as any[]).slice(0, 6).map((r: any) => {
      const { mainText, secondaryText } = buildLabelsFromGeocoding(r);
      return {
        placeId: r.place_id ?? `geo-${r.geometry.location.lat}-${r.geometry.location.lng}`,
        mainText,
        secondaryText,
        formattedAddress: r.formatted_address,
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
      };
    });
  } catch (e) {
    console.error('[EcoRoute] Geocoding fetch failed:', e);
    return [];
  }
}

// ─── Places Autocomplete (preferred when enabled) ─────────────────────────────

async function searchViaAutocomplete(
  query: string,
  locationBias?: { lat: number; lng: number },
): Promise<PlacePrediction[] | null> {
  // Circuit breaker: if Places was recently denied, skip until retry window passes
  if (_placesUnavailableUntil > 0 && Date.now() < _placesUnavailableUntil) {
    return null;
  }

  // Returns null on API error (not enabled / auth failure) so caller can fall back
  try {
    let url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(query)}` +
      `&language=en` +
      `&key=${GOOGLE_MAPS_KEY}`;

    if (locationBias) {
      url += `&location=${locationBias.lat},${locationBias.lng}&radius=50000`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'ZERO_RESULTS') return [];

    // REQUEST_DENIED / NOT_FOUND → set circuit breaker, signal fallback (log once)
    if (data.status !== 'OK') {
      const isFirstFailure = _placesUnavailableUntil === 0;
      _placesUnavailableUntil = Date.now() + 5 * 60 * 1000; // retry in 5 min
      if (isFirstFailure) {
        console.warn(
          '[EcoRoute] Places Autocomplete unavailable:', data.status,
          data.error_message ?? '(no message)',
          `— key prefix: ${GOOGLE_MAPS_KEY.slice(0, 8)}...`,
          '— Falling back to Geocoding. Will retry in 5 min.',
          '— Fix: enable "Places API" in Google Cloud Console for this key.',
        );
      }
      return null;
    }

    // Success — clear circuit breaker in case it was set from a previous failure
    _placesUnavailableUntil = 0;

    return (data.predictions as any[]).slice(0, 6).map((p: any) => ({
      placeId: p.place_id,
      mainText: p.structured_formatting?.main_text ?? p.description.split(',')[0],
      secondaryText: p.structured_formatting?.secondary_text ?? '',
      formattedAddress: p.description,
      // No lat/lng yet — will be resolved on select via resolvePlaceId
    }));
  } catch (e) {
    console.error('[EcoRoute] Places Autocomplete fetch failed:', e);
    return null; // network error → fall back
  }
}

// ─── Public: search with automatic fallback ───────────────────────────────────

/**
 * Main search function used by the search screen.
 * Tries Places Autocomplete first (better UX); falls back to Geocoding API
 * automatically if the Places API is not enabled or returns an error.
 */
export async function searchPlacesAutocomplete(
  query: string,
  locationBias?: { lat: number; lng: number },
): Promise<PlacePrediction[]> {
  if (!GOOGLE_MAPS_KEY) {
    console.error('[EcoRoute] EXPO_PUBLIC_GOOGLE_MAPS_KEY is not set — all search requests will fail.');
    return [];
  }
  if (query.trim().length < 2) return [];

  const autocompleteResults = await searchViaAutocomplete(query, locationBias);

  // null means Places API is unavailable — fall back to Geocoding (silently after first failure)
  if (autocompleteResults === null) {
    return searchViaGeocoding(query);
  }

  // Empty array means ZERO_RESULTS — no need to fall back
  return autocompleteResults;
}

/**
 * Resolve a place_id to lat/lng via Place Details API.
 * Only called for results that came from the Autocomplete path (no lat/lng yet).
 * Falls back to Geocoding if Place Details is also unavailable.
 */
export async function resolvePlaceId(
  placeId: string,
  fallbackQuery?: string,
): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_KEY) return null;

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}` +
      `&fields=geometry,formatted_address,name` +
      `&key=${GOOGLE_MAPS_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.result) {
      const r = data.result;
      return {
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
        formattedAddress: r.formatted_address ?? r.name ?? '',
      };
    }
    console.warn('[EcoRoute] Place Details API error:', data.status, data.error_message ?? '(no message)');
  } catch (e) {
    console.error('[EcoRoute] Place Details fetch failed:', e);
  }

  // Place Details failed — try Geocoding with the formattedAddress as query
  if (fallbackQuery) {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/geocode/json` +
        `?address=${encodeURIComponent(fallbackQuery)}` +
        `&key=${GOOGLE_MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const r = data.results[0];
        return {
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
          formattedAddress: r.formatted_address,
        };
      }
    } catch { /* ignore */ }
  }

  return null;
}

// ─── Existing functions (unchanged) ──────────────────────────────────────────

/**
 * Forward geocode — address string → lat/lng.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
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
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!GOOGLE_MAPS_KEY) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=street_address|locality&key=${GOOGLE_MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }

    const short = data.results[0].address_components?.find(
      (c: { types: string[] }) =>
        c.types.includes('neighborhood') || c.types.includes('sublocality_level_1'),
    );
    return short?.long_name ?? data.results[0].formatted_address ?? 'Current location';
  } catch {
    return 'Current location';
  }
}

/** @deprecated Use searchPlacesAutocomplete instead. */
export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const results = await searchViaGeocoding(query);
  return results.map((r) => ({
    lat: r.lat!,
    lng: r.lng!,
    formattedAddress: r.formattedAddress,
  }));
}
