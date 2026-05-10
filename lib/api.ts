import { supabase } from './supabase';
import { EcoRoutesResponse } from './types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getAccessToken(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) return null;

  const expiresAt = session.expires_at ?? 0;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (expiresAt - nowSeconds < 60) {
    const { data: refreshData } = await supabase.auth.refreshSession();
    return refreshData.session?.access_token ?? null;
  }

  return session.access_token;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let json: { success: boolean; data?: T; error?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server returned non-JSON response (status ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(json.error ?? `Request failed with status ${res.status}`);
  }

  return json.data as T;
}

// ─────────────────────────────────────────────
// Core api object (existing — kept)
// ─────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// ─────────────────────────────────────────────
// Route generation (new EcoRoutes format)
// ─────────────────────────────────────────────

export const getEcoRoutes = async (
  origin: { lat: number; lng: number; name?: string },
  destination: { lat: number; lng: number; name?: string },
  departureTime?: Date
): Promise<EcoRoutesResponse> => {
  return request<EcoRoutesResponse>('POST', '/api/routes', {
    origin,
    destination,
    departureTime: departureTime?.toISOString(),
  });
};

export const getJourneyType = async (
  originLat: number, originLng: number,
  destLat: number, destLng: number
): Promise<{ journeyType: string; distanceKm: number; description: string }> => {
  return request<{ journeyType: string; distanceKm: number; description: string }>(
    'GET',
    `/api/routes/journey-type?lat1=${originLat}&lng1=${originLng}&lat2=${destLat}&lng2=${destLng}`
  );
};

// ─────────────────────────────────────────────
// Trip completion
// ─────────────────────────────────────────────

export const completeTrip = async (tripData: {
  mode: string;
  distanceKm: number;
  durationMin: number;
  co2Grams: number;
  co2SavedGrams: number;
  carBaselineG: number;
  greenPoints?: number;
  originName?: string;
  destName?: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}): Promise<unknown> => {
  return request<unknown>('POST', '/api/trips/complete', tripData);
};

// ─────────────────────────────────────────────
// Impact
// ─────────────────────────────────────────────

export const getWeeklyImpact = () => request<unknown>('GET', '/api/impact/weekly');
export const getMonthlyImpact = () => request<unknown>('GET', '/api/impact/monthly');

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────

export const getUserStats = () => request<unknown>('GET', '/api/user/stats');
export const getUserProfile = () => request<unknown>('GET', '/api/user/profile');

// ─────────────────────────────────────────────
// Badges
// ─────────────────────────────────────────────

export const getBadges = () => request<unknown>('GET', '/api/badges');

// ─────────────────────────────────────────────
// Coupons
// ─────────────────────────────────────────────

export const getCoupons = () => request<unknown>('GET', '/api/coupons');
export const redeemCoupon = (couponId: string): Promise<unknown> =>
  request<unknown>('POST', '/api/coupons/redeem', { couponId });

// ─────────────────────────────────────────────
// Partner analytics
// ─────────────────────────────────────────────

export const recordPartnerClick = (partnerId: string): Promise<unknown> =>
  request<unknown>('POST', '/api/partners/click', { partnerId });
