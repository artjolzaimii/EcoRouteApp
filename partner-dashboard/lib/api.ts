import { supabase } from './supabase'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const authHeaders = await getAuthHeader()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `HTTP ${res.status}`)
  }
  return json.data as T
}

// Multipart upload — do NOT set Content-Type; browser sets it with boundary
async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const authHeaders = await getAuthHeader()
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: authHeaders,
    body:    formData,
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `HTTP ${res.status}`)
  }
  return json.data as T
}

export const api = {
  get:    <T>(path: string)                           => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)            => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown)            => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown)            => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                           => request<T>('DELETE', path),
  upload: <T>(path: string, formData: FormData)       => uploadFile<T>(path, formData),
}
