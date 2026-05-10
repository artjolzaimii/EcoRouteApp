import { NextFunction, Request, Response, Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { supabaseAdmin } from "../config/supabase";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  authUserId: z.string().min(1),
  supabaseUserIdConfirmed: z.literal(true),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSupabaseProjectRef(): string {
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!supabaseUrl) return "missing";

  try {
    return new URL(supabaseUrl).hostname.split(".")[0] ?? "unknown";
  } catch {
    return "invalid-url";
  }
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Called immediately after Supabase sign-up to create the Profile row.
// The frontend handles the actual Supabase sign-up; this endpoint just
// provisions the profile + initial stats.

router.post(
  "/register",
  validateBody(RegisterSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fullName, email, authUserId, supabaseUserIdConfirmed } = req.body as z.infer<typeof RegisterSchema>;
      const hasUuidFormat = UUID_REGEX.test(authUserId);

      console.info("[auth/register] request", {
        authUserId,
        email,
        authUserIdHasUuidFormat: hasUuidFormat,
        supabaseUserIdConfirmed,
        supabaseProjectRef: getSupabaseProjectRef(),
      });

      if (!hasUuidFormat) {
        res.status(400).json({ success: false, error: "Invalid Supabase auth user id" });
        return;
      }

      const { data: supaUser, error: supaError } = await supabaseAdmin.auth.admin.getUserById(authUserId);
      const supabaseEmail = supaUser?.user?.email;

      console.info("[auth/register] admin getUserById result", {
        authUserId,
        found: Boolean(supaUser?.user),
        supabaseEmail: supabaseEmail ?? null,
        supabaseErrorMessage: supaError?.message ?? null,
        supabaseProjectRef: getSupabaseProjectRef(),
      });

      // Hard block: refuse to create an orphan profile if Supabase doesn't recognise the user.
      // This protects against fake user IDs (e.g. from Supabase anti-enumeration responses).
      if (supaError || !supaUser?.user) {
        console.error("[auth/register] Supabase Admin verification failed — refusing to create profile", {
          authUserId,
          email,
          errorMessage: supaError?.message ?? "User not found in Supabase Auth",
          supabaseProjectRef: getSupabaseProjectRef(),
        });
        res.status(422).json({
          success: false,
          error:
            "Account verification failed: the user ID was not found in Supabase Auth. " +
            "This usually means you are signing up with an email that is already registered " +
            "(Supabase returns a fake ID to protect privacy), or email sign-ups are disabled " +
            "in your Supabase project. Please check the Supabase dashboard or try a different email.",
        });
        return;
      }

      if (supabaseEmail && supabaseEmail.toLowerCase() !== email.toLowerCase()) {
        console.warn("[auth/register] Supabase email differs from registration email; using Supabase email", {
          authUserId,
          registrationEmail: email,
          supabaseEmail,
        });
      }

      const profile = await prisma.profile.upsert({
        where: { authUserId },
        update: {},
        create: {
          authUserId,
          email: supabaseEmail ?? email,
          fullName,
          stats: { create: {} },
        },
      });

      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        res.status(409).json({ success: false, error: "A profile already exists for this email" });
        return;
      }

      next(err);
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id: req.user!.profileId },
        include: { stats: true },
      });

      if (!profile) {
        res.status(404).json({ success: false, error: "Profile not found" });
        return;
      }

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
