import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { gramsToCo2TreeDays, gramsToCarTripsAvoided } from "../services/carbon.service";
import { daysAgo, startOfDay, toDateString } from "../utils/helpers";
import { DayImpact, ImpactSummary } from "../types";

const router = Router();

async function buildImpactSummary(
  profileId: string,
  fromDate: Date
): Promise<ImpactSummary> {
  const trips = await prisma.trip.findMany({
    where: {
      profileId,
      status: "COMPLETED",
      completedAt: { gte: fromDate },
    },
    select: {
      completedAt: true,
      co2SavedG: true,
      distanceKm: true,
    },
    orderBy: { completedAt: "asc" },
  });

  // Aggregate daily
  const byDay = new Map<string, DayImpact>();

  for (const trip of trips) {
    if (!trip.completedAt) continue;
    const dateStr = toDateString(trip.completedAt);

    const existing = byDay.get(dateStr) ?? {
      date: dateStr,
      co2SavedG: 0,
      trips: 0,
      distanceKm: 0,
    };

    byDay.set(dateStr, {
      date: dateStr,
      co2SavedG: existing.co2SavedG + trip.co2SavedG,
      trips: existing.trips + 1,
      distanceKm:
        Math.round((existing.distanceKm + Number(trip.distanceKm)) * 100) / 100,
    });
  }

  const dailyBreakdown = Array.from(byDay.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const totalCo2SavedG = dailyBreakdown.reduce((s, d) => s + d.co2SavedG, 0);
  const totalTrips = dailyBreakdown.reduce((s, d) => s + d.trips, 0);
  const totalDistanceKm =
    Math.round(dailyBreakdown.reduce((s, d) => s + d.distanceKm, 0) * 100) / 100;

  return {
    totalCo2SavedG,
    totalTrips,
    totalDistanceKm,
    equivalentTreeDays: gramsToCo2TreeDays(totalCo2SavedG),
    equivalentCarTripsAvoided: gramsToCarTripsAvoided(totalCo2SavedG),
    dailyBreakdown,
  };
}

// ─── GET /api/impact/today ────────────────────────────────────────────────────
// Frontend: index.tsx (home screen header stats)

router.get(
  "/today",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.user!.profileId;
      const todayStart = startOfDay(new Date());

      const trips = await prisma.trip.findMany({
        where: {
          profileId,
          status: "COMPLETED",
          completedAt: { gte: todayStart },
        },
        select: {
          co2SavedG: true,
          distanceKm: true,
          pointsEarned: true,
        },
      });

      const totalCo2SavedG = trips.reduce((s, t) => s + t.co2SavedG, 0);
      const totalTrips     = trips.length;
      const totalPoints    = trips.reduce((s, t) => s + t.pointsEarned, 0);
      const totalDistanceKm = Math.round(trips.reduce((s, t) => s + Number(t.distanceKm), 0) * 100) / 100;

      res.json({
        success: true,
        data: { totalCo2SavedG, totalTrips, totalPoints, totalDistanceKm },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/impact/weekly ───────────────────────────────────────────────────
// Frontend: impact.tsx (Week tab)

router.get(
  "/weekly",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await buildImpactSummary(req.user!.profileId, daysAgo(6));
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/impact/monthly ──────────────────────────────────────────────────
// Frontend: impact.tsx (Month tab), monthly-report.tsx

router.get(
  "/monthly",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await buildImpactSummary(req.user!.profileId, daysAgo(29));
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
