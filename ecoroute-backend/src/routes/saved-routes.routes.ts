import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";

const router = Router();

// All endpoints require authentication
router.use(requireAuth);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SaveRouteSchema = z.object({
  originAddress: z.string().min(1),
  destAddress: z.string().min(1),
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  mode: z.string().min(1),
  subType: z.string().optional(),
  distanceKm: z.number(),
  durationMin: z.number().int(),
  co2Grams: z.number().int(),
  savedVsCar: z.number().int(),
  carEquivalentCO2: z.number().int(),
  carbonScore: z.number().int(),
  greenPoints: z.number().int(),
  finalScore: z.number().int().optional().default(0),
  mood: z.string().optional(),
  moodReason: z.string().optional(),
  routeData: z.record(z.unknown()),
});

// ─── GET /api/saved-routes ────────────────────────────────────────────────────

router.get("/", async (req, res, next) => {
  try {
    const profileId = req.user!.profileId;

    const routes = await prisma.savedRoute.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: routes });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/saved-routes ───────────────────────────────────────────────────

router.post("/", validateBody(SaveRouteSchema), async (req, res, next) => {
  try {
    const profileId = req.user!.profileId;
    const body = req.body as z.infer<typeof SaveRouteSchema>;

    // Round coordinates to 5 decimal places for consistent deduplication
    const originLat = Math.round(body.originLat * 1e5) / 1e5;
    const originLng = Math.round(body.originLng * 1e5) / 1e5;
    const destLat = Math.round(body.destLat * 1e5) / 1e5;
    const destLng = Math.round(body.destLng * 1e5) / 1e5;

    const route = await prisma.savedRoute.upsert({
      where: {
        profileId_originLat_originLng_destLat_destLng_mode: {
          profileId,
          originLat,
          originLng,
          destLat,
          destLng,
          mode: body.mode,
        },
      },
      update: {
        originAddress: body.originAddress,
        destAddress: body.destAddress,
        subType: body.subType ?? null,
        distanceKm: body.distanceKm,
        durationMin: body.durationMin,
        co2Grams: body.co2Grams,
        savedVsCar: body.savedVsCar,
        carEquivalentCO2: body.carEquivalentCO2,
        carbonScore: body.carbonScore,
        greenPoints: body.greenPoints,
        finalScore: body.finalScore ?? 0,
        mood: body.mood ?? null,
        moodReason: body.moodReason ?? null,
        routeData: body.routeData as unknown as Prisma.InputJsonValue,
      },
      create: {
        profileId,
        originAddress: body.originAddress,
        destAddress: body.destAddress,
        originLat,
        originLng,
        destLat,
        destLng,
        mode: body.mode,
        subType: body.subType ?? null,
        distanceKm: body.distanceKm,
        durationMin: body.durationMin,
        co2Grams: body.co2Grams,
        savedVsCar: body.savedVsCar,
        carEquivalentCO2: body.carEquivalentCO2,
        carbonScore: body.carbonScore,
        greenPoints: body.greenPoints,
        finalScore: body.finalScore ?? 0,
        mood: body.mood ?? null,
        moodReason: body.moodReason ?? null,
        routeData: body.routeData as unknown as Prisma.InputJsonValue,
      },
    });

    res.json({ success: true, data: route });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/saved-routes/:id ─────────────────────────────────────────────

router.delete("/:id", async (req, res, next) => {
  try {
    const profileId = req.user!.profileId;
    const { id } = req.params;

    const existing = await prisma.savedRoute.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Route not found" });
      return;
    }
    if (existing.profileId !== profileId) {
      res.status(403).json({ success: false, error: "Forbidden" });
      return;
    }

    await prisma.savedRoute.delete({ where: { id } });

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
