import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { supabaseAdmin } from "../config/supabase";

const router = Router();

// multer: keep file in memory (no disk write needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WebP images are allowed"));
    }
  },
});

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
      const [profile, badgeCount] = await Promise.all([
        prisma.profile.findUnique({
          where: { id: req.user!.profileId },
          include: {
            stats: true,
            userBadges: {
              include: { badge: true },
              orderBy: { earnedAt: "desc" },
              take: 5,
            },
          },
        }),
        prisma.userBadge.count({
          where: { profileId: req.user!.profileId },
        }),
      ]);

      if (!profile) {
        res.status(404).json({ success: false, error: "Profile not found" });
        return;
      }

      res.json({
        success: true,
        data: {
          ...profile,
          stats: profile.stats ? { ...profile.stats, badgeCount } : { badgeCount },
        },
      });
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

// ─── POST /api/user/avatar ────────────────────────────────────────────────────
// Accepts a multipart image upload, stores it in Supabase Storage using the
// service-role key (bypasses RLS), and patches the profile avatarUrl.
// Frontend: edit-profile.tsx

router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "No image file provided" });
        return;
      }

      const ext = req.file.mimetype === "image/png" ? "png"
                : req.file.mimetype === "image/webp" ? "webp"
                : "jpg";
      const fileName = `${req.user!.profileId}-${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("avatars")
        .upload(fileName, req.file.buffer, {
          upsert: true,
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        res.status(500).json({ success: false, error: uploadError.message });
        return;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("avatars")
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;

      await prisma.profile.update({
        where: { id: req.user!.profileId },
        data: { avatarUrl: publicUrl },
      });

      res.json({ success: true, data: { avatarUrl: publicUrl } });
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

// ─── POST /api/user/push-token ────────────────────────────────────────────────
// Saves/updates the Expo push token for the authenticated user.

const PushTokenSchema = z.object({
  token: z.string().min(1).max(200),
});

router.post(
  "/push-token",
  requireAuth,
  validateBody(PushTokenSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // ── DIAGNOSTIC LOG — remove after confirming token registration works ──────
    console.log("[push] POST /api/user/push-token received, profileId:", req.user!.profileId);
    try {
      const { token } = req.body as z.infer<typeof PushTokenSchema>;
      await prisma.profile.update({
        where: { id: req.user!.profileId },
        data: { expoPushToken: token },
      });
      console.log("[push] token saved OK, profileId:", req.user!.profileId);
      res.json({ success: true, data: null });
    } catch (err) {
      console.error("[push] token save FAILED:", (err as Error).message);
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
