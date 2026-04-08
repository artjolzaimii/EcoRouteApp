import { NextFunction, Request, Response, Router } from "express";
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
  authUserId: z.string().uuid(),
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Called immediately after Supabase sign-up to create the Profile row.
// The frontend handles the actual Supabase sign-up; this endpoint just
// provisions the profile + initial stats.

router.post(
  "/register",
  validateBody(RegisterSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fullName, email, authUserId } = req.body as z.infer<typeof RegisterSchema>;

      // Verify the authUserId actually exists in Supabase auth
      const { data: supaUser, error } = await supabaseAdmin.auth.admin.getUserById(authUserId);
      if (error || !supaUser.user) {
        res.status(400).json({ success: false, error: "Supabase user not found — sign up first" });
        return;
      }

      const existing = await prisma.profile.findUnique({ where: { authUserId } });
      if (existing) {
        res.status(200).json({ success: true, data: existing });
        return;
      }

      const profile = await prisma.$transaction(async (tx) => {
        const p = await tx.profile.create({
          data: { authUserId, email, fullName },
        });
        await tx.userStats.create({ data: { profileId: p.id } });
        return p;
      });

      res.status(201).json({ success: true, data: profile });
    } catch (err) {
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
