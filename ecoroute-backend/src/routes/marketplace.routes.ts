import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.middleware";
import { validateQuery, validateBody } from "../middleware/validate.middleware";
import { redeemPoints } from "../services/points.service";

const router = Router();
const prisma = new PrismaClient();

// ─── GET /api/marketplace/categories ──────────────────────────────────────────

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await (prisma as any).marketplaceCategory.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/marketplace/listings ────────────────────────────────────────────

const listingsQuerySchema = z.object({
  q:          z.string().optional(),
  categoryId: z.string().optional(),
  payment:    z.enum(["MONEY_ONLY", "FLEXIBLE"]).optional(),
  sort:       z.enum(["newest", "price_asc", "price_desc", "points_asc"]).optional(),
  limit:      z.coerce.number().min(1).max(100).default(40),
  offset:     z.coerce.number().min(0).default(0),
});

router.get(
  "/listings",
  validateQuery(listingsQuerySchema),
  async (req, res, next) => {
    try {
      const { q, categoryId, payment, sort, limit, offset } = req.query as unknown as z.infer<typeof listingsQuerySchema>;

      const where: Record<string, unknown> = { status: "ACTIVE" };
      if (categoryId) where.categoryId = categoryId;
      if (payment)    where.payment    = payment;
      if (q) {
        where.OR = [
          { title:       { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ];
      }

      let orderBy: Record<string, string> = { createdAt: "desc" };
      if (sort === "price_asc")   orderBy = { moneyPrice: "asc" };
      if (sort === "price_desc")  orderBy = { moneyPrice: "desc" };
      if (sort === "points_asc")  orderBy = { pointsPrice: "asc" };

      const [listings, total] = await Promise.all([
        (prisma as any).marketplaceListing.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            category: true,
            images:   { where: { isCover: true }, take: 1 },
            partner:  { select: { businessName: true, location: true, logoUrl: true } },
          },
        }),
        (prisma as any).marketplaceListing.count({ where }),
      ]);

      // DEBUG — remove after verification
      console.log("[marketplace/listings] returned:", total, "| IDs:", listings.map((l: any) => l.id), "| statuses:", listings.map((l: any) => l.status));

      res.json({ success: true, data: { listings, total, limit, offset } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/marketplace/listings/:id ────────────────────────────────────────

router.get("/listings/:id", async (req, res, next) => {
  try {
    const listing = await (prisma as any).marketplaceListing.findUnique({
      where: { id: req.params.id, status: "ACTIVE" },
      include: {
        category: true,
        images:   { orderBy: { sortOrder: "asc" } },
        partner:  { select: { id: true, businessName: true, location: true, logoUrl: true } },
      },
    });

    if (!listing) {
      res.status(404).json({ success: false, error: "Listing not found" });
      return;
    }

    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/marketplace/listings/:id/checkout ──────────────────────────────
//
// Unified checkout for both MONEY_ONLY and FLEXIBLE listings.
//
// MONEY_ONLY:  pointsToUse is ignored; moneyPaidSimulated = full money_price.
// FLEXIBLE:    pointsToUse in [0, min(userPoints, listing.pointsPrice)].
//              remaining_money = money_price × (1 − pointsToUse / pointsPrice)

const checkoutSchema = z.object({
  pointsToUse: z.number().int().min(0).default(0),
  note:        z.string().max(500).optional(),
});

router.post(
  "/listings/:id/checkout",
  requireAuth,
  validateBody(checkoutSchema),
  async (req, res, next) => {
    try {
      const { pointsToUse, note } = req.body as z.infer<typeof checkoutSchema>;
      const user = req.user!;

      const listing = await (prisma as any).marketplaceListing.findUnique({
        where: { id: req.params.id, status: "ACTIVE" },
      });
      if (!listing) {
        res.status(404).json({ success: false, error: "Listing not found" });
        return;
      }
      if (listing.stock !== null && listing.stock <= 0) {
        res.status(400).json({ success: false, error: "Out of stock" });
        return;
      }

      let actualPointsUsed = 0;
      let moneyPaidSimulated = 0;

      if (listing.payment === "MONEY_ONLY") {
        if (!listing.moneyPrice) {
          res.status(400).json({ success: false, error: "No money price set" });
          return;
        }
        moneyPaidSimulated = Number(listing.moneyPrice);
        actualPointsUsed   = 0;
      } else {
        // FLEXIBLE
        if (!listing.pointsPrice) {
          res.status(400).json({ success: false, error: "No points price set" });
          return;
        }
        if (!listing.moneyPrice) {
          res.status(400).json({ success: false, error: "No money price set" });
          return;
        }

        const stats = await (prisma as any).userStats.findUnique({
          where:  { profileId: user.profileId },
          select: { totalPoints: true },
        });
        const balance = stats?.totalPoints ?? 0;

        // Clamp: cannot exceed what the user has or what the listing costs
        actualPointsUsed = Math.min(pointsToUse, listing.pointsPrice, balance);
        actualPointsUsed = Math.max(actualPointsUsed, 0);

        const ratio        = actualPointsUsed / listing.pointsPrice;
        moneyPaidSimulated = Math.round(Number(listing.moneyPrice) * (1 - ratio) * 100) / 100;
        moneyPaidSimulated = Math.max(moneyPaidSimulated, 0);
      }

      // Deduct points first (has its own atomic ledger logic)
      if (actualPointsUsed > 0) {
        await redeemPoints(
          user.profileId,
          actualPointsUsed,
          `Marketplace: ${listing.title}`,
          listing.id
        );
      }

      // Decrement stock and create order atomically
      const order = await (prisma as any).$transaction(async (tx: any) => {
        if (listing.stock !== null) {
          await tx.marketplaceListing.update({
            where: { id: listing.id },
            data:  { stock: { decrement: 1 } },
          });
        }

        return tx.marketplaceOrder.create({
          data: {
            profileId:          user.profileId,
            partnerId:          listing.partnerId,
            listingId:          listing.id,
            pointsUsed:         actualPointsUsed,
            moneyPaidSimulated: moneyPaidSimulated,
            status:             "SIMULATED_PAID",
            note:               note ?? null,
          },
        });
      });

      res.status(201).json({
        success: true,
        data: {
          order,
          pointsUsed:         actualPointsUsed,
          moneyPaidSimulated,
        },
      });
    } catch (err: any) {
      if (err?.statusCode === 400) {
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }
);

export default router;
