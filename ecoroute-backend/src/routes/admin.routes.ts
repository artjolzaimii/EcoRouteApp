import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate.middleware";
import { awardPoints } from "../services/points.service";

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

export default router;
