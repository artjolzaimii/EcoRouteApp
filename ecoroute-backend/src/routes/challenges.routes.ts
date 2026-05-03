import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// GET /api/challenges — active challenges with current user's progress
router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.user!.profileId;
      const now = new Date();

      const challenges = await prisma.challenge.findMany({
        where: {
          isActive: true,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        orderBy: { createdAt: "asc" },
      });

      const userChallenges = await prisma.userChallenge.findMany({
        where: {
          profileId,
          challengeId: { in: challenges.map((c) => c.id) },
        },
      });

      const progressMap = new Map(userChallenges.map((uc) => [uc.challengeId, uc]));

      const data = challenges.map((c) => {
        const uc = progressMap.get(c.id);
        return {
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.type,
          targetValue: c.targetValue,
          rewardPoints: c.rewardPoints,
          endsAt: c.endsAt,
          progress: uc?.progress ?? 0,
          completed: uc?.completed ?? false,
          completedAt: uc?.completedAt ?? null,
        };
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
