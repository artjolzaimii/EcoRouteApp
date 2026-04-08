import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TripMode } from "@prisma/client";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate.middleware";
import { calculateCarbon } from "../services/carbon.service";
import { awardPoints, updateStreak, checkAndAwardBadges } from "../services/points.service";
import { EarnType } from "@prisma/client";

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CompleteTripSchema = z.object({
  mode: z.nativeEnum(TripMode),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  originAddress: z.string().min(1).max(300),
  destAddress: z.string().min(1).max(300),
  distanceKm: z.number().positive(),
  durationMinutes: z.number().int().positive(),
});

const TripsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(["COMPLETED", "CANCELLED", "ACTIVE"]).optional(),
});

// ─── POST /api/trips/complete ─────────────────────────────────────────────────
// Frontend: trip-completed.tsx, navigation.tsx (End Route button)

router.post(
  "/complete",
  requireAuth,
  validateBody(CompleteTripSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof CompleteTripSchema>;
      const profileId = req.user!.profileId;

      const carbon = calculateCarbon(body.mode, body.distanceKm, body.durationMinutes);

      // Create the trip record
      const trip = await prisma.trip.create({
        data: {
          profileId,
          mode: body.mode,
          status: "COMPLETED",
          originLat: body.originLat,
          originLng: body.originLng,
          destLat: body.destLat,
          destLng: body.destLng,
          originAddress: body.originAddress,
          destAddress: body.destAddress,
          distanceKm: carbon.distanceKm,
          durationMinutes: carbon.durationMinutes,
          co2SavedG: carbon.savedVsCar,
          co2EmittedG: carbon.co2Grams,
          ecoScore: carbon.ecoScore,
          pointsEarned: carbon.greenPoints,
          completedAt: new Date(),
        },
      });

      // Update aggregate stats
      await prisma.userStats.upsert({
        where: { profileId },
        create: {
          profileId,
          totalTrips: 1,
          totalDistanceKm: carbon.distanceKm,
          totalCo2SavedG: carbon.savedVsCar,
        },
        update: {
          totalTrips: { increment: 1 },
          totalDistanceKm: { increment: carbon.distanceKm },
          totalCo2SavedG: { increment: carbon.savedVsCar },
        },
      });

      // Award trip points
      const newBalance = await awardPoints(
        profileId,
        carbon.greenPoints,
        EarnType.TRIP_COMPLETE,
        `Trip completed: ${body.originAddress} → ${body.destAddress}`,
        trip.id
      );

      // Update streak and check for streak bonus
      const streakResult = await updateStreak(profileId);
      let finalBalance = newBalance;

      if (streakResult.streakBonusPoints > 0) {
        finalBalance = await awardPoints(
          profileId,
          streakResult.streakBonusPoints,
          EarnType.STREAK,
          `${streakResult.currentStreak}-day streak bonus`,
          trip.id
        );
      }

      // Check badge eligibility
      const newBadges = await checkAndAwardBadges(profileId);

      // Notify user about points earned
      await prisma.notification.create({
        data: {
          profileId,
          title: "Trip Completed!",
          body: `You earned ${carbon.greenPoints} green points and saved ${carbon.savedVsCar}g of CO₂.`,
          refType: "trip",
          refId: trip.id,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          trip,
          carbon,
          pointsEarned: carbon.greenPoints,
          streakBonusPoints: streakResult.streakBonusPoints,
          newBalance: finalBalance,
          currentStreak: streakResult.currentStreak,
          newBadges,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/trips ───────────────────────────────────────────────────────────
// Frontend: profile.tsx (trip history), impact.tsx

router.get(
  "/",
  requireAuth,
  validateQuery(TripsQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit, offset, status } = req.query as unknown as z.infer<typeof TripsQuerySchema>;
      const profileId = req.user!.profileId;

      const [trips, total] = await Promise.all([
        prisma.trip.findMany({
          where: {
            profileId,
            ...(status ? { status } : {}),
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.trip.count({
          where: {
            profileId,
            ...(status ? { status } : {}),
          },
        }),
      ]);

      res.json({
        success: true,
        data: { trips, total, limit, offset },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
