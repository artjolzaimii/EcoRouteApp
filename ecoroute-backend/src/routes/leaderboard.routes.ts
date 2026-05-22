import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { cacheGet, cacheSet } from "../services/cache.service";

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

      // Fire-and-forget: ensure stats row exists without blocking response
      prisma.userStats.upsert({ where: { profileId }, create: { profileId }, update: {} })
        .catch((err) => console.warn("[leaderboard] stats upsert failed:", err));

      // ── Top N users — cached for 2 min (public data, same for all users) ──
      type TopPayload = { entries: typeof entries; total: number };
      const cacheKey = `leaderboard:top:${limit}`;
      let entries: Array<{
        profileId: string; rank: number; fullName: string;
        avatarUrl: string | null; totalPoints: number;
        totalTrips: number; totalCo2SavedG: number; isMe: boolean;
      }>;
      let total: number;

      const cachedTop = await cacheGet<TopPayload>(cacheKey);
      if (cachedTop) {
        entries = cachedTop.entries;
        total   = cachedTop.total;
      } else {
        const topStats = await prisma.userStats.findMany({
          where: { profile: { isActive: true } },
          include: { profile: { select: { fullName: true, avatarUrl: true } } },
          orderBy: { totalPoints: "desc" },
          take: limit,
        });

        entries = topStats.map((s, idx) => ({
          profileId:      s.profileId,
          rank:           idx + 1,
          fullName:       s.profile.fullName,
          avatarUrl:      s.profile.avatarUrl ?? null,
          totalPoints:    s.totalPoints,
          totalTrips:     s.totalTrips,
          totalCo2SavedG: s.totalCo2SavedG,
          isMe:           false, // set per-user below — don't cache user-specific flag
        }));

        total = await prisma.profile.count({ where: { isActive: true } });
        await cacheSet(cacheKey, { entries, total }, 2 * 60); // 2 min TTL
      }

      // Mark which entry belongs to the caller (not stored in cache)
      entries = entries.map((e) => ({ ...e, isMe: e.profileId === profileId }));

      // ── Caller's own position (may be outside the top N) ──────────────────
      let me = entries.find((e) => e.isMe) ?? null;

      if (!me) {
        const myStats = await prisma.userStats.findUnique({
          where: { profileId },
          include: { profile: { select: { fullName: true, avatarUrl: true } } },
        });

        if (myStats) {
          const usersAbove = await prisma.userStats.count({
            where: { totalPoints: { gt: myStats.totalPoints }, profile: { isActive: true } },
          });

          me = {
            profileId,
            rank:           usersAbove + 1,
            fullName:       myStats.profile.fullName,
            avatarUrl:      myStats.profile.avatarUrl ?? null,
            totalPoints:    myStats.totalPoints,
            totalTrips:     myStats.totalTrips,
            totalCo2SavedG: myStats.totalCo2SavedG,
            isMe:           true,
          };
        }
      }

      res.json({ success: true, data: { entries, me, total } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
