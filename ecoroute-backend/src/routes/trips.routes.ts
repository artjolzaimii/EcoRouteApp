import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TripMode, EarnType, ChallengeType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate.middleware";
import { calculateCarbon, calculateGreenPoints } from "../services/carbon.service";
import { awardPoints, updateStreak, checkAndAwardBadges } from "../services/points.service";

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
  // Optional: frontend-computed CO2 data (more accurate than backend re-calculation).
  // When provided, these take precedence for points calculation.
  co2SavedGrams: z.number().nonnegative().optional(),
  co2EmittedGrams: z.number().nonnegative().optional(),
  greenPoints: z.number().int().nonnegative().optional(),
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

      // Use legacy formula only for fallback CO2 data
      const carbon = calculateCarbon(body.mode, body.distanceKm, body.durationMinutes);

      // Prefer frontend-provided CO2 values (they're computed from the actual route,
      // including the correct mode — e.g. PLANE routes correctly have savedVsCar ≈ 0)
      const co2SavedG   = body.co2SavedGrams   ?? carbon.savedVsCar;
      const co2EmittedG = body.co2EmittedGrams  ?? carbon.co2Grams;

      // Prefer the selected route's precomputed points so completion matches the
      // route card exactly. No per-trip cap is applied here; the old 500-point cap
      // was undocumented and caused completed trips to show fewer points.
      const greenPoints = body.greenPoints ?? calculateGreenPoints(co2SavedG, body.mode);

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
          distanceKm: body.distanceKm,
          durationMinutes: body.durationMinutes,
          co2SavedG,
          co2EmittedG,
          ecoScore: carbon.ecoScore,
          pointsEarned: greenPoints,
          completedAt: new Date(),
        },
      });

      // Update aggregate stats
      await prisma.userStats.upsert({
        where: { profileId },
        create: {
          profileId,
          totalTrips: 1,
          totalDistanceKm: body.distanceKm,
          totalCo2SavedG: co2SavedG,
        },
        update: {
          totalTrips: { increment: 1 },
          totalDistanceKm: { increment: body.distanceKm },
          totalCo2SavedG: { increment: co2SavedG },
        },
      });

      // Award trip points
      const newBalance = await awardPoints(
        profileId,
        greenPoints,
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
          body: `You earned ${greenPoints} green points and saved ${co2SavedG}g of CO₂.`,
          refType: "trip",
          refId: trip.id,
        },
      });

      // ── Increment challenge progress ──────────────────────────────────────
      const now = new Date();
      const activeChallenges = await prisma.challenge.findMany({
        where: {
          isActive: true,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
      });

      for (const challenge of activeChallenges) {
        const existing = await prisma.userChallenge.findUnique({
          where: { profileId_challengeId: { profileId, challengeId: challenge.id } },
        });

        if (existing?.completed) continue;

        let increment = 0;
        switch (challenge.type) {
          case ChallengeType.TRIP_COUNT:
            increment = 1;
            break;
          case ChallengeType.DISTANCE_KM:
            increment = body.distanceKm;
            break;
          case ChallengeType.CO2_SAVED_G:
            increment = co2SavedG;
            break;
          case ChallengeType.CYCLING_KM:
            if (body.mode === TripMode.CYCLING) increment = body.distanceKm;
            break;
        }

        if (increment === 0) continue;

        const newProgress = Math.min((existing?.progress ?? 0) + increment, challenge.targetValue);
        const justCompleted = newProgress >= challenge.targetValue;
        const completedAt = justCompleted ? now : null;

        await prisma.userChallenge.upsert({
          where: { profileId_challengeId: { profileId, challengeId: challenge.id } },
          create: { profileId, challengeId: challenge.id, progress: newProgress, completed: justCompleted, completedAt },
          update: { progress: newProgress, completed: justCompleted, completedAt },
        });

        if (justCompleted) {
          finalBalance = await awardPoints(
            profileId,
            challenge.rewardPoints,
            EarnType.CHALLENGE_COMPLETE,
            `Challenge completed: ${challenge.title}`,
            challenge.id
          );
          await prisma.notification.create({
            data: {
              profileId,
              title: "Challenge Complete! 🎉",
              body: `You completed "${challenge.title}" and earned ${challenge.rewardPoints} bonus points!`,
              refType: "challenge",
              refId: challenge.id,
            },
          });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          trip,
          pointsEarned: greenPoints,
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
