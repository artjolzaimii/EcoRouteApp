import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// ─── GET /api/badges ──────────────────────────────────────────────────────────
// Returns all badges with earned status for the current user.
// Frontend: impact.tsx (Achievements section), rewards.tsx

router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.user!.profileId;

      const [allBadges, userBadges, stats] = await Promise.all([
        prisma.badge.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        prisma.userBadge.findMany({ where: { profileId } }),
        prisma.userStats.findUnique({ where: { profileId } }),
      ]);

      const earnedSet = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

      const badges = allBadges.map((badge) => {
        const earnedAt = earnedSet.get(badge.id) ?? null;
        const condValue = parseInt(JSON.parse(badge.conditionValue) as string, 10);

        // Build progress for display
        let progress = 0;
        let progressMax = condValue;

        switch (badge.conditionType) {
          case "MIN_TRIPS":
            progress = stats?.totalTrips ?? 0;
            break;
          case "STREAK_DAYS":
            progress = stats?.currentStreak ?? 0;
            break;
          case "MIN_DISTANCE_KM":
            progress = Math.floor(Number(stats?.totalDistanceKm ?? 0));
            break;
          case "FIRST_TRIP":
            progress = (stats?.totalTrips ?? 0) >= 1 ? 1 : 0;
            progressMax = 1;
            break;
          default:
            break;
        }

        return {
          ...badge,
          earned: earnedAt !== null,
          earnedAt,
          progress: Math.min(progress, progressMax),
          progressMax,
        };
      });

      res.json({ success: true, data: { badges } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
