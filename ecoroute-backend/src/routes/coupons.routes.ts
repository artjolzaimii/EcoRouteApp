import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { redeemPoints } from "../services/points.service";
import { recordCouponIssued, recordCouponRedeemed } from "../services/partners.service";
import { generateCouponCode } from "../utils/helpers";

const router = Router();

const RedeemSchema = z.object({
  couponId: z.string().min(1),
});

const UseSchema = z.object({
  userCouponId: z.string().min(1),
});

// ─── GET /api/coupons ─────────────────────────────────────────────────────────
// Frontend: rewards.tsx (Available / My Rewards tabs), coupon-detail.tsx

router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.user!.profileId;

      const [available, mine] = await Promise.all([
        // All active coupons not yet claimed by this user
        prisma.coupon.findMany({
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
            userCoupons: { none: { profileId } },
          },
          include: { partner: { select: { id: true, name: true, logoUrl: true } } },
          orderBy: { pointsCost: "asc" },
        }),
        // Coupons already owned by this user
        prisma.userCoupon.findMany({
          where: { profileId },
          include: {
            coupon: {
              include: { partner: { select: { id: true, name: true, logoUrl: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      res.json({
        success: true,
        data: { available, mine },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/coupons/redeem ─────────────────────────────────────────────────
// Frontend: rewards.tsx (Redeem button), coupon-detail.tsx

router.post(
  "/redeem",
  requireAuth,
  validateBody(RedeemSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { couponId } = req.body as z.infer<typeof RedeemSchema>;
      const profileId = req.user!.profileId;

      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
        include: { partner: true },
      });

      if (!coupon) {
        res.status(404).json({ success: false, error: "Coupon not found" });
        return;
      }

      if (!coupon.isActive) {
        res.status(400).json({ success: false, error: "Coupon is no longer active" });
        return;
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        res.status(400).json({ success: false, error: "Coupon has expired" });
        return;
      }

      // Check stock
      if (coupon.totalStock !== null && coupon.issuedCount >= coupon.totalStock) {
        res.status(400).json({ success: false, error: "Coupon is out of stock" });
        return;
      }

      // Check not already claimed
      const existing = await prisma.userCoupon.findFirst({
        where: { profileId, couponId },
      });

      if (existing) {
        res.status(400).json({ success: false, error: "Coupon already redeemed" });
        return;
      }

      // Deduct points (if required)
      if (coupon.pointsCost > 0) {
        await redeemPoints(
          profileId,
          coupon.pointsCost,
          `Redeemed coupon: ${coupon.title}`,
          coupon.id
        );
      }

      // Issue the coupon
      const expiresAt = coupon.expiresAt;
      const [userCoupon] = await prisma.$transaction([
        prisma.userCoupon.create({
          data: {
            profileId,
            couponId,
            code: generateCouponCode(),
            expiresAt,
          },
        }),
        prisma.coupon.update({
          where: { id: couponId },
          data: { issuedCount: { increment: 1 } },
        }),
      ]);

      // Record analytics
      await recordCouponIssued(coupon.partnerId);

      // Track redemption analytics if this is an in-store use
      await recordCouponRedeemed(coupon.partnerId);

      // Notify user
      await prisma.notification.create({
        data: {
          profileId,
          title: "Coupon Redeemed!",
          body: `Your coupon for ${coupon.partner.name} is ready. Code: ${userCoupon.code}`,
          refType: "coupon",
          refId: userCoupon.id,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          userCoupon,
          code: userCoupon.code,
          partnerName: coupon.partner.name,
          title: coupon.title,
          expiresAt: userCoupon.expiresAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/coupons/use ────────────────────────────────────────────────────
// Frontend: coupon-redeemed.tsx (Done button — marks coupon as used at the store)

router.post(
  "/use",
  requireAuth,
  validateBody(UseSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userCouponId } = req.body as z.infer<typeof UseSchema>;
      const profileId = req.user!.profileId;

      const userCoupon = await prisma.userCoupon.findFirst({
        where: { id: userCouponId, profileId },
      });

      if (!userCoupon) {
        res.status(404).json({ success: false, error: "Coupon not found" });
        return;
      }

      if (userCoupon.redeemedAt) {
        res.status(400).json({ success: false, error: "Coupon already used" });
        return;
      }

      const updated = await prisma.userCoupon.update({
        where: { id: userCouponId },
        data: { redeemedAt: new Date() },
      });

      res.json({ success: true, data: { redeemedAt: updated.redeemedAt } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
