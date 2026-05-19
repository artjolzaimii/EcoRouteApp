import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { supabaseAdmin } from "../config/supabase";

const router = Router();

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

// ─── GET /api/user/profile ────────────────────────────────────────────────────
// Frontend: profile.tsx, edit-profile.tsx

router.get(
  "/profile",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id: req.user!.profileId },
        include: {
          stats: true,
          userBadges: {
            include: { badge: true },
            orderBy: { earnedAt: "desc" },
            take: 5,
          },
        },
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

// ─── PATCH /api/user/profile ──────────────────────────────────────────────────
// Frontend: edit-profile.tsx

router.patch(
  "/profile",
  requireAuth,
  validateBody(UpdateProfileSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof UpdateProfileSchema>;
      const profile = await prisma.profile.update({
        where: { id: req.user!.profileId },
        data: {
          ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
          ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
        },
      });
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/user/stats ──────────────────────────────────────────────────────
// Frontend: profile.tsx (stats cards), impact.tsx

router.get(
  "/stats",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await prisma.userStats.upsert({
        where: { profileId: req.user!.profileId },
        create: { profileId: req.user!.profileId },
        update: {},
      });

      const badgeCount = await prisma.userBadge.count({
        where: { profileId: req.user!.profileId },
      });

      res.json({
        success: true,
        data: { ...stats, badgeCount },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/user/account ─────────────────────────────────────────────────
// Permanently deletes all user data then removes the Supabase auth account.

router.delete(
  "/account",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { profileId, authUserId } = req.user!;

      // Delete profile row — all child rows (trips, badges, points, etc.) cascade automatically
      await prisma.profile.delete({ where: { id: profileId } });

      // Remove the Supabase Auth user so they cannot log back in
      const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (error) {
        console.error("[user/account] Supabase user deletion failed:", error.message);
      }

      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
