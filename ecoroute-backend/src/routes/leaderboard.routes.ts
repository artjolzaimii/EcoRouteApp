import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────
// Returns top users ranked by total eco-points, plus the caller's own entry
// (even if they're outside the top N).
//
// Query params:
//   limit  – number of top entries to return (1–100, default 50)

router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.user!.profileId;
      const limit = Math.min(
        Math.max(parseInt(String(req.query.limit ?? "50"), 10) || 50, 1),
        100
      );

      // ── Guarantee the caller has a stats row ──────────────────────────────
      // Recovers gracefully if the trigger or register endpoint missed creating
      // the row (e.g. legacy accounts, partial failures, or manual DB edits).
      await prisma.userStats.upsert({
        where: { profileId },
        create: { profileId },
        update: {},
      });

      // ── Top N users by total points ────────────────────────────────────────
      const topStats = await prisma.userStats.findMany({
        where: { profile: { isActive: true } },
        include: {
          profile: { select: { fullName: true, avatarUrl: true } },
        },
        orderBy: { totalPoints: "desc" },
        take: limit,
      });

      const entries = topStats.map((s, idx) => ({
        profileId: s.profileId,
        rank: idx + 1,
        fullName: s.profile.fullName,
        avatarUrl: s.profile.avatarUrl ?? null,
        totalPoints: s.totalPoints,
        totalTrips: s.totalTrips,
        totalCo2SavedG: s.totalCo2SavedG,
        isMe: s.profileId === profileId,
      }));

      // ── Caller's own position (may be outside the top N) ──────────────────
      let me = entries.find((e) => e.isMe) ?? null;

      if (!me) {
        const myStats = await prisma.userStats.findUnique({
          where: { profileId },
          include: { profile: { select: { fullName: true, avatarUrl: true } } },
        });

        if (myStats) {
          // Count how many active users have strictly more points
          const usersAbove = await prisma.userStats.count({
            where: {
              totalPoints: { gt: myStats.totalPoints },
              profile: { isActive: true },
            },
          });

          me = {
            profileId,
            rank: usersAbove + 1,
            fullName: myStats.profile.fullName,
            avatarUrl: myStats.profile.avatarUrl ?? null,
            totalPoints: myStats.totalPoints,
            totalTrips: myStats.totalTrips,
            totalCo2SavedG: myStats.totalCo2SavedG,
            isMe: true,
          };
        }
      }

      // ── Total active users (for context) ──────────────────────────────────
      const total = await prisma.profile.count({ where: { isActive: true } });

      res.json({ success: true, data: { entries, me, total } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
