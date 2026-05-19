import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { generateRoutes, generateEcoRoutes, detectJourneyType, haversineDistance, VALID_MOODS } from "../services/routing.service";
import { prisma } from "../config/prisma";
import type { LearnedWeights } from "../services/weightLearning.service";

const router = Router();

// ─── New route request schema (nested origin/destination) ─────────────────────

const EcoRouteRequestSchema = z.object({
  origin: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    name: z.string().optional(),
  }),
  destination: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    name: z.string().optional(),
  }),
  mood: z.enum(VALID_MOODS).optional(),
  departureTime: z.string().datetime().optional(),
});

// ─── Legacy route request schema (flat lat/lng + addresses) ──────────────────

const LegacyRouteRequestSchema = z.object({
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  originAddress: z.string().min(1).max(300),
  destAddress: z.string().min(1).max(300),
});

// ─── POST /api/routes ─────────────────────────────────────────────────────────
// Accepts both new {origin, destination} and legacy {originLat, ...} formats.

router.post(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // [PERF] Total request wall-clock
    const _perfReqStart = Date.now();
    console.log('[PERF][ROUTES] POST /api/routes received');

    try {
      const body = req.body;

      // New format: nested origin / destination
      const newParse = EcoRouteRequestSchema.safeParse(body);
      if (newParse.success) {
        const { origin, destination, mood, departureTime } = newParse.data;

        const profile = await prisma.profile.findUnique({
          where: { id: req.user!.profileId },
          select: { learnedWeights: true },
        });
        const learnedWeights = profile?.learnedWeights as LearnedWeights | undefined;

        let result;
        try {
          result = await generateEcoRoutes({ origin, destination, mood, departureTime, learnedWeights });
        } catch (googleErr: any) {
          if (googleErr?.message?.includes("GOOGLE_MAPS_API_KEY")) {
            res.status(503).json({ success: false, error: "Routing service unavailable — Google API key not configured" });
            return;
          }
          throw googleErr;
        }

        if (!result.routes || result.routes.length === 0) {
          console.log(`[PERF][ROUTES] POST /api/routes total=${Date.now() - _perfReqStart}ms (no routes)`);
          res.json({
            success: true,
            data: { ...result, message: "No eco-routes found for this journey" },
          });
          return;
        }

        console.log(`[PERF][ROUTES] POST /api/routes total=${Date.now() - _perfReqStart}ms | routes=${result.routes.length} | journey=${result.journeyType}`);
        res.json({ success: true, data: result });
        return;
      }

      // Legacy format: flat coordinates + addresses
      const legacyParse = LegacyRouteRequestSchema.safeParse(body);
      if (legacyParse.success) {
        const b = legacyParse.data;
        const routes = await generateRoutes(b);

        res.json({
          success: true,
          data: {
            routes,
            count: routes.length,
            recommended: routes.find((r) => r.isRecommended) ?? routes[0] ?? null,
          },
        });
        return;
      }

      // Neither format matched — return validation error
      res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: newParse.error?.issues ?? legacyParse.error?.issues,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/routes/journey-type ─────────────────────────────────────────────
// Returns journey classification and distance before the full route request.

router.get(
  "/journey-type",
  requireAuth,
  (req: Request, res: Response): void => {
    const { lat1, lng1, lat2, lng2 } = req.query;

    const schema = z.object({
      lat1: z.coerce.number().min(-90).max(90),
      lng1: z.coerce.number().min(-180).max(180),
      lat2: z.coerce.number().min(-90).max(90),
      lng2: z.coerce.number().min(-180).max(180),
    });

    const parsed = schema.safeParse({ lat1, lng1, lat2, lng2 });
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid query params", details: parsed.error.issues });
      return;
    }

    const { lat1: oLat, lng1: oLng, lat2: dLat, lng2: dLng } = parsed.data;
    const distanceKm = Math.round(haversineDistance(oLat, oLng, dLat, dLng) * 10) / 10;
    const journeyType = detectJourneyType(distanceKm);

    res.json({
      success: true,
      data: {
        journeyType,
        distanceKm,
        description: journeyTypeDescription(journeyType),
      },
    });
  }
);

function journeyTypeDescription(jt: string): string {
  switch (jt) {
    case "MICRO":         return "Short trip under 2km — walk or cycle";
    case "URBAN":         return "Urban trip up to 20km — transit options available";
    case "REGIONAL":      return "Regional trip up to 150km — trains may be available";
    case "INTERCITY":     return "Intercity trip up to 1500km — train vs flight comparison";
    case "INTERNATIONAL": return "International journey — flight comparison included";
    default:              return "Route calculation";
  }
}

export default router;
