import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate.middleware";
import { findNearbyPartners, recordPartnerClick } from "../services/partners.service";
import { prisma } from "../config/prisma";

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

// ─── POST /api/partners/apply ─────────────────────────────────────────────────
// Public endpoint — no auth required. Creates a PENDING partner application.

const ApplySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(20).max(2000),
  category: z.enum(["FOOD", "RETAIL", "TRANSPORT", "FITNESS", "WELLNESS", "ENTERTAINMENT", "OTHER"]),
  partnerType: z.enum(["ECO_BUSINESS", "MOBILITY_PROVIDER"]).default("ECO_BUSINESS"),
  address: z.string().min(5).max(300),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  websiteUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  contactName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(30).optional(),
});

router.post(
  "/apply",
  validateBody(ApplySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof ApplySchema>;

      const contactBlock = [
        "[Application Contact]",
        `Name: ${body.contactName}`,
        `Email: ${body.contactEmail}`,
        body.contactPhone ? `Phone: ${body.contactPhone}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await prisma.ecoPartner.create({
        data: {
          name: body.name,
          description: `${contactBlock}\n\n${body.description}`,
          category: body.category,
          partnerType: body.partnerType,
          status: "PENDING",
          address: body.address,
          lat: body.lat,
          lng: body.lng,
          websiteUrl: body.websiteUrl ?? null,
        },
      });

      res.status(201).json({
        success: true,
        message: "Your application has been submitted and is pending review.",
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
