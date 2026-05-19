import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate.middleware";
import { awardPoints } from "../services/points.service";
import { invalidateMultipliersCache } from "../services/settingsCache";
import { geocodeAddress } from "../services/google.service";
import { Prisma } from "@prisma/client";

const router = Router();

// All admin routes require ADMIN role
router.use(requireAuth, requireRole("ADMIN"));

// ─── Schemas ──────────────────────────────────────────────────────────────────

const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().optional(),
});

const AdjustPointsSchema = z.object({
  delta: z.number().int().min(-100000).max(100000),
  reason: z.string().min(1).max(255),
});

const UpdatePartnerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING"]),
});

const AnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const BadgeBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  iconUrl: z.string().url().optional().nullable(),
  conditionType: z.enum(["MIN_DISTANCE_KM", "MIN_TRIPS", "STREAK_DAYS", "SPECIFIC_MODE", "FIRST_TRIP", "PARTNER_VISIT"]),
  conditionValue: z.string().min(1),
  pointsReward: z.number().int().min(0),
  isActive: z.boolean().default(true),
});

const BadgeUpdateSchema = BadgeBodySchema.partial();

const CouponBodySchema = z.object({
  partnerId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  discountType: z.enum(["PERCENTAGE", "FIXED", "FREE_ITEM"]),
  discountValue: z.number().min(0),
  pointsCost: z.number().int().min(0).default(0),
  conditionType: z.enum(["MIN_DISTANCE_KM", "MIN_TRIPS", "STREAK_DAYS", "SPECIFIC_MODE", "FIRST_TRIP", "PARTNER_VISIT"]).optional(),
  conditionValue: z.string().optional(),
  totalStock: z.number().int().min(0).optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

const CouponUpdateSchema = CouponBodySchema.omit({ partnerId: true }).partial();

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

router.get(
  "/users",
  validateQuery(PaginationSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit, offset, search } = req.query as unknown as z.infer<typeof PaginationSchema>;

      const where = search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.profile.findMany({
          where,
          include: { stats: true },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.profile.count({ where }),
      ]);

      res.json({ success: true, data: { users, total, limit, offset } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/admin/users/:id/suspend ──────────────────────────────────────

router.patch(
  "/users/:id/suspend",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const profile = await prisma.profile.findUnique({ where: { id } });
      if (!profile) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      const updated = await prisma.profile.update({
        where: { id },
        data: { isActive: !profile.isActive },
      });
      res.json({ success: true, data: { id: updated.id, isActive: updated.isActive } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/admin/users/:id/points ───────────────────────────────────────

router.patch(
  "/users/:id/points",
  validateBody(AdjustPointsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const { delta, reason } = req.body as z.infer<typeof AdjustPointsSchema>;

      const profile = await prisma.profile.findUnique({ where: { id } });
      if (!profile) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }

      const newBalance = await awardPoints(
        id,
        delta,
        "ADMIN_GRANT",
        `Admin adjustment: ${reason}`,
        req.user!.profileId // ref to admin who issued it
      );

      res.json({ success: true, data: { profileId: id, delta, newBalance } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/admin/partners ──────────────────────────────────────────────────

router.get(
  "/partners",
  validateQuery(PaginationSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit, offset, search } = req.query as unknown as z.infer<typeof PaginationSchema>;

      const where = search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {};

      const [partners, total] = await Promise.all([
        prisma.ecoPartner.findMany({
          where,
          include: {
            _count: { select: { coupons: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.ecoPartner.count({ where }),
      ]);

      res.json({ success: true, data: { partners, total, limit, offset } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/admin/partners ─────────────────────────────────────────────────

const CreatePartnerSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.enum(["FOOD", "RETAIL", "TRANSPORT", "FITNESS", "WELLNESS", "ENTERTAINMENT", "OTHER"]),
  partnerType: z.enum(["ECO_BUSINESS", "MOBILITY_PROVIDER"]).default("ECO_BUSINESS"),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED"]).default("ACTIVE"),
  address: z.string().min(5).max(300),
  description: z.string().min(1).max(2000).default(""),
  websiteUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  radiusMeters: z.coerce.number().int().min(50).max(10000).default(500),
});

router.post(
  "/partners",
  validateBody(CreatePartnerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof CreatePartnerSchema>;
      const coords = await geocodeAddress(body.address).catch(() => null);
      const partner = await prisma.ecoPartner.create({
        data: {
          name: body.name,
          category: body.category,
          partnerType: body.partnerType,
          status: body.status,
          address: body.address,
          lat: coords?.lat ?? 0,
          lng: coords?.lng ?? 0,
          description: body.description,
          websiteUrl: body.websiteUrl ?? null,
          radiusMeters: body.radiusMeters,
        },
      });
      res.status(201).json({ success: true, data: { partner } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/admin/partners/:id/status ────────────────────────────────────

router.patch(
  "/partners/:id/status",
  validateBody(UpdatePartnerStatusSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const { status } = req.body as z.infer<typeof UpdatePartnerStatusSchema>;

      const partner = await prisma.ecoPartner.findUnique({ where: { id } });
      if (!partner) {
        res.status(404).json({ success: false, error: "Partner not found" });
        return;
      }

      const updated = await prisma.ecoPartner.update({
        where: { id },
        data: { status },
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/admin/partners/:id ──────────────────────────────────────────

router.delete(
  "/partners/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;

      const partner = await prisma.ecoPartner.findUnique({ where: { id } });
      if (!partner) {
        res.status(404).json({ success: false, error: "Partner not found" });
        return;
      }

      if (partner.status === "ACTIVE") {
        res.status(400).json({ success: false, error: "Cannot delete an ACTIVE partner. Suspend them first." });
        return;
      }

      await prisma.ecoPartner.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

router.get(
  "/stats",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        usersToday,
        totalTrips,
        tripsLastWeek,
        tripsWeekBefore,
        co2Aggregate,
        activePartners,
        pendingPartners,
      ] = await Promise.all([
        prisma.profile.count(),
        prisma.profile.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.trip.count({ where: { status: "COMPLETED" } }),
        prisma.trip.count({ where: { status: "COMPLETED", completedAt: { gte: sevenDaysAgo } } }),
        prisma.trip.count({
          where: { status: "COMPLETED", completedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
        }),
        prisma.userStats.aggregate({ _sum: { totalCo2SavedG: true } }),
        prisma.ecoPartner.count({ where: { status: "ACTIVE" } }),
        prisma.ecoPartner.count({ where: { status: "PENDING" } }),
      ]);

      const co2SavedLifetimeG = co2Aggregate._sum.totalCo2SavedG ?? 0;
      const tripsWeeklyChange =
        tripsWeekBefore > 0
          ? Math.round(((tripsLastWeek - tripsWeekBefore) / tripsWeekBefore) * 1000) / 10
          : null;

      res.json({
        success: true,
        data: {
          totalUsers,
          usersToday,
          totalTrips,
          tripsLastWeek,
          tripsWeeklyChange,
          co2SavedLifetimeG,
          treesEquivalent: Math.round(co2SavedLifetimeG / 22000), // 22 kg CO2 per tree per year
          activePartners,
          pendingPartners,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────

router.get(
  "/analytics",
  validateQuery(AnalyticsQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { days } = req.query as unknown as z.infer<typeof AnalyticsQuerySchema>;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      type DailyRow = { date: Date; trips: bigint; co2_saved_g: bigint };
      type ModeRow = { mode: string; count: bigint };

      const [dailyRaw, modeRaw, pointsEarned, pointsRedeemed] = await Promise.all([
        prisma.$queryRaw<DailyRow[]>(Prisma.sql`
          SELECT
            DATE_TRUNC('day', completed_at)::date AS date,
            COUNT(*)::int                          AS trips,
            COALESCE(SUM(co2_saved_g), 0)::int     AS co2_saved_g
          FROM trips
          WHERE status = 'COMPLETED'
            AND completed_at >= ${cutoff}
          GROUP BY 1
          ORDER BY 1 ASC
        `),
        prisma.$queryRaw<ModeRow[]>(Prisma.sql`
          SELECT mode, COUNT(*)::int AS count
          FROM trips
          WHERE status = 'COMPLETED'
          GROUP BY mode
        `),
        prisma.pointsLedger.aggregate({ _sum: { delta: true }, where: { type: "EARN" } }),
        prisma.pointsLedger.aggregate({ _sum: { delta: true }, where: { type: "REDEEM" } }),
      ]);

      const dailyStats = dailyRaw.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        trips: Number(r.trips),
        co2SavedG: Number(r.co2_saved_g),
      }));

      const modeDistribution = modeRaw.map((r) => ({
        mode: r.mode,
        count: Number(r.count),
      }));

      const totalPointsIssued = pointsEarned._sum.delta ?? 0;
      const totalPointsRedeemed = Math.abs(pointsRedeemed._sum.delta ?? 0);

      res.json({
        success: true,
        data: {
          dailyStats,
          modeDistribution,
          points: {
            totalIssued: totalPointsIssued,
            totalRedeemed: totalPointsRedeemed,
            netOutstanding: totalPointsIssued - totalPointsRedeemed,
            redemptionRate:
              totalPointsIssued > 0
                ? Math.round((totalPointsRedeemed / totalPointsIssued) * 1000) / 10
                : 0,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/admin/activity ──────────────────────────────────────────────────

router.get(
  "/activity",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [recentUsers, recentTrips, recentBadgeGrants] = await Promise.all([
        prisma.profile.findMany({
          orderBy: { createdAt: "desc" },
          take: 15,
          select: { id: true, email: true, fullName: true, createdAt: true },
        }),
        prisma.trip.findMany({
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 15,
          select: { id: true, co2SavedG: true, mode: true, completedAt: true },
        }),
        prisma.pointsLedger.findMany({
          where: { earnType: "BADGE" },
          orderBy: { createdAt: "desc" },
          take: 15,
          select: { id: true, description: true, createdAt: true },
        }),
      ]);

      type ActivityEvent = {
        id: string;
        type: "user" | "trip" | "badge";
        description: string;
        timestamp: Date;
      };

      const events: ActivityEvent[] = [
        ...recentUsers.map((u) => ({
          id: `user-${u.id}`,
          type: "user" as const,
          description: `New user registered — ${u.email}`,
          timestamp: u.createdAt,
        })),
        ...recentTrips
          .filter((t) => t.completedAt !== null)
          .map((t) => ({
            id: `trip-${t.id}`,
            type: "trip" as const,
            description: `Trip completed — ${(t.co2SavedG / 1000).toFixed(1)}kg CO2 saved (${t.mode.toLowerCase()})`,
            timestamp: t.completedAt!,
          })),
        ...recentBadgeGrants.map((p) => ({
          id: `badge-${p.id}`,
          type: "badge" as const,
          description: p.description,
          timestamp: p.createdAt,
        })),
      ];

      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      res.json({
        success: true,
        data: events.slice(0, 30).map((e) => ({
          id: e.id,
          type: e.type,
          description: e.description,
          timestamp: e.timestamp.toISOString(),
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/admin/badges ────────────────────────────────────────────────────

router.get(
  "/badges",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const badges = await prisma.badge.findMany({
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { userBadges: true } } },
      });

      res.json({
        success: true,
        data: badges.map((b) => ({ ...b, earnedByCount: b._count.userBadges })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/admin/badges ───────────────────────────────────────────────────

router.post(
  "/badges",
  validateBody(BadgeBodySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as z.infer<typeof BadgeBodySchema>;
      const badge = await prisma.badge.create({ data });
      res.status(201).json({ success: true, data: badge });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/admin/badges/:id ────────────────────────────────────────────────

router.put(
  "/badges/:id",
  validateBody(BadgeUpdateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const data = req.body as z.infer<typeof BadgeUpdateSchema>;

      const exists = await prisma.badge.findUnique({ where: { id } });
      if (!exists) {
        res.status(404).json({ success: false, error: "Badge not found" });
        return;
      }

      const badge = await prisma.badge.update({ where: { id }, data });
      res.json({ success: true, data: badge });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/admin/badges/:id/toggle ───────────────────────────────────────

router.patch(
  "/badges/:id/toggle",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;

      const existing = await prisma.badge.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: "Badge not found" });
        return;
      }

      const badge = await prisma.badge.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });
      res.json({ success: true, data: badge });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/admin/coupons ───────────────────────────────────────────────────

router.get(
  "/coupons",
  validateQuery(PaginationSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit, offset, search } = req.query as unknown as z.infer<typeof PaginationSchema>;
      const partnerId = req.query["partnerId"] as string | undefined;

      const where: Prisma.CouponWhereInput = {};
      if (partnerId) where.partnerId = partnerId;
      if (search) where.title = { contains: search, mode: "insensitive" };

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where,
          include: { partner: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.coupon.count({ where }),
      ]);

      res.json({ success: true, data: { coupons, total, limit, offset } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/admin/coupons ──────────────────────────────────────────────────

router.post(
  "/coupons",
  validateBody(CouponBodySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { partnerId, discountValue, expiresAt, ...rest } = req.body as z.infer<typeof CouponBodySchema>;

      const partnerExists = await prisma.ecoPartner.findUnique({ where: { id: partnerId } });
      if (!partnerExists) {
        res.status(404).json({ success: false, error: "Partner not found" });
        return;
      }

      const coupon = await prisma.coupon.create({
        data: {
          ...rest,
          partnerId,
          discountValue,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
      });
      res.status(201).json({ success: true, data: coupon });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/admin/coupons/:id ───────────────────────────────────────────────

router.put(
  "/coupons/:id",
  validateBody(CouponUpdateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const { expiresAt, ...rest } = req.body as z.infer<typeof CouponUpdateSchema>;

      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: "Coupon not found" });
        return;
      }

      const coupon = await prisma.coupon.update({
        where: { id },
        data: {
          ...rest,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
      });
      res.json({ success: true, data: coupon });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/admin/coupons/:id/toggle ──────────────────────────────────────

router.patch(
  "/coupons/:id/toggle",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;

      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: "Coupon not found" });
        return;
      }

      const coupon = await prisma.coupon.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });
      res.json({ success: true, data: coupon });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/admin/coupons/:id ────────────────────────────────────────────

router.delete(
  "/coupons/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;

      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: "Coupon not found" });
        return;
      }

      await prisma.coupon.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/admin/settings ──────────────────────────────────────────────────

router.get(
  "/settings",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rows = await prisma.appSetting.findMany();
      const data: Record<string, string> = {};
      for (const row of rows) data[row.key] = row.value;
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/admin/settings ──────────────────────────────────────────────────

const SettingsBodySchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

router.put(
  "/settings",
  validateBody(SettingsBodySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as Record<string, string | number | boolean>;
      await Promise.all(
        Object.entries(body).map(([key, value]) =>
          prisma.appSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          })
        )
      );
      invalidateMultipliersCache();
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/admin/users/promote ────────────────────────────────────────────

const PromoteAdminSchema = z.object({ email: z.string().email() });

router.post(
  "/users/promote",
  validateBody(PromoteAdminSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as z.infer<typeof PromoteAdminSchema>;
      const profile = await prisma.profile.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
      if (!profile) {
        res.status(404).json({ success: false, error: "No user found with that email" });
        return;
      }
      if (profile.role === "ADMIN") {
        res.status(409).json({ success: false, error: "User is already an admin" });
        return;
      }
      const updated = await prisma.profile.update({ where: { id: profile.id }, data: { role: "ADMIN" } });
      res.json({ success: true, data: { id: updated.id, email: updated.email, fullName: updated.fullName, role: updated.role } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/admin/users/:id/admin ────────────────────────────────────────

router.delete(
  "/users/:id/admin",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      if (id === req.user!.profileId) {
        res.status(400).json({ success: false, error: "You cannot remove your own admin role" });
        return;
      }
      const profile = await prisma.profile.findUnique({ where: { id } });
      if (!profile) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      await prisma.profile.update({ where: { id }, data: { role: "USER" } });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/admin/danger/reset-points ──────────────────────────────────────

router.post(
  "/danger/reset-points",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.userStats.updateMany({ data: { totalPoints: 0 } });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/admin/trips/export ──────────────────────────────────────────────

router.get(
  "/trips/export",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const trips = await prisma.trip.findMany({
        where: { status: "COMPLETED" },
        select: {
          id: true, mode: true, distanceKm: true, co2SavedG: true,
          durationMinutes: true, completedAt: true,
          profile: { select: { email: true, fullName: true } },
        },
        orderBy: { completedAt: "desc" },
        take: 10000,
      });
      res.json({ success: true, data: { trips } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
