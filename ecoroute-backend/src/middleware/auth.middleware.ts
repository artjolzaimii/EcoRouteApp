import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { prisma } from "../config/prisma";
import { supabaseAdmin } from "../config/supabase";
import { AuthUser, Role } from "../types";

interface SupabaseJwtPayload {
  sub: string;        // Supabase auth user UUID
  email?: string;
  role?: string;
  exp?: number;
  aud?: string | string[];
}

// ── JWKS public key cache ────────────────────────────────────────────────────
// Supabase issues ES256 (ECDSA P-256) JWTs, not HS256.
// We fetch the public key from the JWKS endpoint and cache it.
// Node.js 18+ crypto supports JWK → PEM natively — no extra packages needed.

let _cachedPem: string | null = null;
let _cachedAt = 0;
const JWKS_TTL_MS = 6 * 60 * 60 * 1000; // refresh every 6 hours

async function getSupabasePublicKeyPem(): Promise<string | null> {
  if (_cachedPem && Date.now() - _cachedAt < JWKS_TTL_MS) {
    return _cachedPem;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("[auth] SUPABASE_URL is not set — cannot fetch JWKS");
    return null;
  }

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as { keys: Record<string, unknown>[] };
    if (!data.keys?.length) throw new Error("JWKS response contains no keys");

    // Supabase publishes exactly one signing key
    const jwk = data.keys[0];
    const publicKey = crypto.createPublicKey({ key: jwk as any, format: "jwk" });
    _cachedPem = publicKey.export({ type: "spki", format: "pem" }) as string;
    _cachedAt = Date.now();

    console.log(`[auth] JWKS loaded — alg: ${jwk.alg}, kid: ${jwk.kid}`);
    return _cachedPem;
  } catch (err) {
    console.error("[auth] JWKS fetch failed:", (err as Error).message);
    return null;
  }
}

// Pre-warm the cache at startup so the first real request isn't slow
getSupabasePublicKeyPem().catch(() => {});

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Decode the JWT header without verifying — for debug logging only. */
function peekTokenHeader(token: string): Record<string, unknown> | null {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return (decoded as any)?.header ?? null;
  } catch {
    return null;
  }
}

/**
 * Fallback: verify via Supabase Admin API.
 * Slower (network call) but always correct, regardless of local JWKS state.
 */
async function verifyViaSupabaseApi(token: string): Promise<SupabaseJwtPayload | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return {
    sub: data.user.id,
    email: data.user.email,
    role: (data.user as any).role ?? "authenticated",
  };
}

// ── Middleware ───────────────────────────────────────────────────────────────

/**
 * Verifies the Supabase-issued Bearer JWT.
 * Primary path: local ES256 verification via JWKS public key (fast, no network).
 * Fallback path: supabaseAdmin.auth.getUser() (correct even if JWKS is stale).
 * On success, attaches req.user = { authUserId, email, role, profileId }.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  // Debug: log what algorithm the token claims to use
  const header = peekTokenHeader(token);
  if (header) {
    console.log(`[auth] Token header — alg: ${header.alg}, kid: ${header.kid ?? "none"}`);
  }

  let payload: SupabaseJwtPayload | null = null;

  // ── Primary: local JWKS verification ──────────────────────────────────────
  const pem = await getSupabasePublicKeyPem();

  if (pem) {
    try {
      payload = jwt.verify(token, pem, {
        algorithms: ["ES256"],
        audience: "authenticated",
      }) as SupabaseJwtPayload;
      console.log(`[auth] Local JWKS verification succeeded — sub: ${payload.sub}`);
    } catch (err) {
      console.warn(`[auth] Local JWKS verification failed: ${(err as Error).message} — trying Supabase API fallback`);
    }
  } else {
    console.warn("[auth] JWKS unavailable — skipping local verification, using Supabase API");
  }

  // ── Fallback: Supabase Admin API verification ──────────────────────────────
  if (!payload) {
    payload = await verifyViaSupabaseApi(token);
    if (payload) {
      console.log(`[auth] Supabase API fallback verification succeeded — sub: ${payload.sub}`);
    }
  }

  if (!payload) {
    console.error("[auth] Both verification paths failed — rejecting request");
    res.status(401).json({ success: false, error: "Invalid or expired token" });
    return;
  }

  // ── Profile lookup ─────────────────────────────────────────────────────────
  const authUserId = payload.sub;
  const email = payload.email ?? "";

  const profile = await prisma.profile.findUnique({
    where: { authUserId },
    select: { id: true, role: true, isActive: true },
  });

  if (!profile) {
    res.status(401).json({ success: false, error: "Profile not found — call POST /api/auth/register first" });
    return;
  }

  if (!profile.isActive) {
    res.status(403).json({ success: false, error: "Account suspended" });
    return;
  }

  req.user = {
    authUserId,
    email,
    role: profile.role,
    profileId: profile.id,
  } as AuthUser;

  next();
}

/**
 * Role guard — must be used after requireAuth.
 * Usage: router.get("/admin/...", requireAuth, requireRole("ADMIN"), handler)
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: "Forbidden — insufficient role" });
      return;
    }
    next();
  };
}
