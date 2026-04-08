import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate.middleware";
import { findNearbyPartners, recordPartnerClick } from "../services/partners.service";

const router = Router();

const NearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().int().min(100).max(5000).default(1000),
});

const ClickSchema = z.object({
  partnerId: z.string().min(1),
});

// ─── GET /api/partners/nearby ─────────────────────────────────────────────────
// Frontend: home index.tsx (map pins), routes.tsx (sponsored card)

router.get(
  "/nearby",
  requireAuth,
  validateQuery(NearbyQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lat, lng, radiusMeters } = req.query as unknown as z.infer<typeof NearbyQuerySchema>;
      const partners = await findNearbyPartners(lat, lng, radiusMeters);

      res.json({
        success: true,
        data: { partners, count: partners.length },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/partners/click ─────────────────────────────────────────────────
// Called when user taps a partner pin on the map

router.post(
  "/click",
  requireAuth,
  validateBody(ClickSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { partnerId } = req.body as z.infer<typeof ClickSchema>;
      await recordPartnerClick(partnerId);
      res.json({ success: true, data: { recorded: true } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
