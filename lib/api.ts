import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getAccessToken(): Promise<string | null> {
  // getSession() reads from the in-memory/AsyncStorage cache.
  // If the cached token is close to expiry or missing, refreshSession() will
  // fetch a fresh one from Supabase. We always prefer a validated fresh token.
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) return null;

  // If the token expires within the next 60 seconds, proactively refresh it
  // before sending the request so the backend never sees an expired token.
  const expiresAt = session.expires_at ?? 0; // Unix seconds
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

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
