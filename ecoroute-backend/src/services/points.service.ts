import { prisma } from "../config/prisma";
import { EarnType, PointsLedgerType } from "@prisma/client";
import { StreakResult } from "../types";

/**
 * Award points to a user. Appends a row to points_ledger, updates user_stats.
 */
export async function awardPoints(
  profileId: string,
  delta: number,
  earnType: EarnType,
  description: string,
  refId?: string
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const stats = await tx.userStats.upsert({
      where: { profileId },
      create: { profileId, totalPoints: 0 },
      update: {},
    });

    const newBalance = stats.totalPoints + delta;

    await tx.userStats.update({
      where: { profileId },
      data: { totalPoints: newBalance },
    });

    await tx.pointsLedger.create({
      data: {
        profileId,
        type: PointsLedgerType.EARN,
        earnType,
        delta,
        balanceAfter: newBalance,
        description,
        refId,
      },
    });

    return newBalance;
  });
}

/**
 * Redeem (deduct) points from a user. Returns the new balance.
 * Throws if balance is insufficient.
 */
export async function redeemPoints(
  profileId: string,
  amount: number,
  description: string,
  refId?: string
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const stats = await tx.userStats.findUnique({ where: { profileId } });
    const currentBalance = stats?.totalPoints ?? 0;

    if (currentBalance < amount) {
      throw Object.assign(new Error("Insufficient points"), { statusCode: 400 });
    }

    const newBalance = currentBalance - amount;

    await tx.userStats.update({
      where: { profileId },
      data: { totalPoints: newBalance },
    });

    await tx.pointsLedger.create({
      data: {
        profileId,
        type: PointsLedgerType.REDEEM,
        delta: -amount,
        balanceAfter: newBalance,
        description,
        refId,
      },
    });

    return newBalance;
  });
}

/**
 * Calculate and update streak after a completed trip.
 * Returns updated streak state + any bonus points earned.
 */
export async function updateStreak(profileId: string): Promise<StreakResult> {
  return prisma.$transaction(async (tx) => {
    const stats = await tx.userStats.upsert({
      where: { profileId },
      create: { profileId },
      update: {},
    });

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

    let currentStreak = stats.currentStreak;
    let streakBonusPoints = 0;

    const lastTrip = stats.lastTripAt;

    if (!lastTrip) {
      // First ever trip
      currentStreak = 1;
    } else if (lastTrip >= todayStart) {
      // Already tripped today — don't change streak
    } else if (lastTrip >= yesterdayStart) {
      // Consecutive day — increment streak
      currentStreak += 1;
    } else {
      // Gap — reset streak
      currentStreak = 1;
    }

    // Bonus points for streak milestones
    if (currentStreak === 3) streakBonusPoints = 20;
    else if (currentStreak === 7) streakBonusPoints = 50;
    else if (currentStreak === 14) streakBonusPoints = 100;
    else if (currentStreak === 30) streakBonusPoints = 250;

    const longestStreak = Math.max(stats.longestStreak, currentStreak);

    await tx.userStats.update({
      where: { profileId },
      data: {
        currentStreak,
        longestStreak,
        lastTripAt: now,
      },
    });

    return { currentStreak, longestStreak, streakBonusPoints };
  });
}

/**
 * Check and award badges to a user based on their current stats.
 * Returns list of newly awarded badge IDs.
 */
export async function checkAndAwardBadges(profileId: string): Promise<string[]> {
  const [badges, userBadges, stats, userStats] = await Promise.all([
    prisma.badge.findMany({ where: { isActive: true } }),
    prisma.userBadge.findMany({ where: { profileId }, select: { badgeId: true } }),
    prisma.userStats.findUnique({ where: { profileId } }),
    prisma.trip.count({ where: { profileId, status: "COMPLETED" } }),
  ]);

  const alreadyEarned = new Set(userBadges.map((b) => b.badgeId));
  const newlyEarned: string[] = [];

  for (const badge of badges) {
    if (alreadyEarned.has(badge.id)) continue;

    const condValue = JSON.parse(badge.conditionValue) as number;
    let qualifies = false;

    switch (badge.conditionType) {
      case "MIN_TRIPS":
        qualifies = userStats >= condValue;
        break;
      case "STREAK_DAYS":
        qualifies = (stats?.currentStreak ?? 0) >= condValue;
        break;
      case "MIN_DISTANCE_KM":
        qualifies = Number(stats?.totalDistanceKm ?? 0) >= condValue;
        break;
      case "FIRST_TRIP":
        qualifies = userStats >= 1;
        break;
      default:
        break;
    }

    if (qualifies) {
      await prisma.userBadge.create({ data: { profileId, badgeId: badge.id } });
      newlyEarned.push(badge.id);

      // Award badge points
      if (badge.pointsReward > 0) {
        await awardPoints(
          profileId,
          badge.pointsReward,
          EarnType.BADGE,
          `Badge earned: ${badge.name}`,
          badge.id
        );
      }

      // Create notification
      await prisma.notification.create({
        data: {
          profileId,
          title: "Badge Earned!",
          body: `You earned the "${badge.name}" badge!`,
          refType: "badge",
          refId: badge.id,
        },
      });
    }
  }

  return newlyEarned;
}
