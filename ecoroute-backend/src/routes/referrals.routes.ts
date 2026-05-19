import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";

const router = Router();

const REFERRAL_POINTS = 50;

// Derive referral code from Supabase auth UUID (same formula as the frontend)
function deriveReferralCode(authUserId: string): string {
  const raw = authUserId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `ECO-${raw}`;
}

// Find a profile by its derived referral code
async function findProfileByCode(code: string) {
  const prefix = code.replace(/^ECO-/, "").toLowerCase();
  if (prefix.length !== 6) return null;

  // Scan profiles whose authUserId (without dashes) starts with this prefix.
  // UUIDs are long enough that 6-char collisions are extremely rare.
  const profiles = await prisma.profile.findMany({
    where: { isActive: true },
    select: { id: true, authUserId: true },
  });

  return (
    profiles.find(
      (p) => p.authUserId.replace(/-/g, "").slice(0, 6).toLowerCase() === prefix
    ) ?? null
  );
}

// ─── POST /api/referrals/apply ────────────────────────────────────────────────
// Called after a new user completes registration. Awards 50 points to referrer.

const ApplySchema = z.object({
  referralCode: z.string().min(4).max(20),
});

router.post(
  "/apply",
  requireAuth,
  validateBody(ApplySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { referralCode } = req.body as z.infer<typeof ApplySchema>;
      const referreeProfileId = req.user!.profileId;

      // Prevent re-applying a referral
      const existing = await prisma.referral.findUnique({
        where: { referreeId: referreeProfileId },
      });
      if (existing) {
        res.status(409).json({ success: false, error: "Referral already applied" });
        return;
      }

      const referrerProfile = await findProfileByCode(referralCode.toUpperCase());
      if (!referrerProfile) {
        res.status(404).json({ success: false, error: "Invalid referral code" });
        return;
      }

      if (referrerProfile.id === referreeProfileId) {
        res.status(400).json({ success: false, error: "You cannot use your own referral code" });
        return;
      }

      // Create the referral record + award points to referrer in a transaction
      const [referral] = await prisma.$transaction([
        prisma.referral.create({
          data: { referrerId: referrerProfile.id, referreeId: referreeProfileId },
        }),
        prisma.userStats.update({
          where: { profileId: referrerProfile.id },
          data: { totalPoints: { increment: REFERRAL_POINTS } },
        }),
        prisma.pointsLedger.create({
          data: {
            profileId: referrerProfile.id,
            type: "EARN",
            earnType: "REFERRAL",
            delta: REFERRAL_POINTS,
            balanceAfter: 0, // updated below — placeholder for transaction
            description: "Referral bonus: a friend joined EcoRoute",
            refId: referreeProfileId,
          },
        }),
        prisma.notification.create({
          data: {
            profileId: referrerProfile.id,
            title: "Referral bonus!",
            body: `A friend joined EcoRoute using your code. You earned ${REFERRAL_POINTS} EcoPoints!`,
            refType: "points",
          },
        }),
      ]);

      // Fix balanceAfter now that we know the new total
      const updatedStats = await prisma.userStats.findUnique({
        where: { profileId: referrerProfile.id },
        select: { totalPoints: true },
      });
      if (updatedStats) {
        await prisma.pointsLedger.updateMany({
          where: {
            profileId: referrerProfile.id,
            earnType: "REFERRAL",
            refId: referreeProfileId,
            balanceAfter: 0,
          },
          data: { balanceAfter: updatedStats.totalPoints },
        });
      }

      res.json({ success: true, data: { referralId: referral.id } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/referrals/stats ─────────────────────────────────────────────────
// Returns how many friends the current user has successfully referred.

router.get(
  "/stats",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await prisma.referral.count({
        where: { referrerId: req.user!.profileId },
      });

      const myCode = deriveReferralCode(req.user!.authUserId);

      res.json({ success: true, data: { referralCount: count, referralCode: myCode } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
