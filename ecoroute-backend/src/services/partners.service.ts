import { prisma } from "../config/prisma";
import { haversineMeters } from "../utils/helpers";
import { NearbyPartner } from "../types";

/**
 * Find eco-partners within radiusMeters of a given point.
 * Returns partners sorted by distance, closest first.
 */
export async function findNearbyPartners(
  lat: number,
  lng: number,
  radiusMeters: number = 1000
): Promise<NearbyPartner[]> {
  const partners = await prisma.ecoPartner.findMany({
    where: { status: "ACTIVE" },
    include: {
      coupons: {
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
          AND: [
            {
              OR: [
                { totalStock: null },
                // Can't do arithmetic in Prisma where clause, filter post-query
              ],
            },
          ],
        },
        orderBy: { pointsCost: "asc" },
        take: 1,
      },
    },
  });

  const nearby: NearbyPartner[] = [];

  for (const partner of partners) {
    const distanceM = haversineMeters(
      lat, lng,
      Number(partner.lat), Number(partner.lng)
    );

    if (distanceM <= radiusMeters) {
      const coupon = partner.coupons[0];

      nearby.push({
        id: partner.id,
        name: partner.name,
        category: partner.category,
        logoUrl: partner.logoUrl,
        address: partner.address,
        lat: Number(partner.lat),
        lng: Number(partner.lng),
        distanceM: Math.round(distanceM),
        pointsPerVisit: partner.pointsPerVisit,
        activeCoupon: coupon
          ? {
              id: coupon.id,
              title: coupon.title,
              discountType: coupon.discountType,
              discountValue: Number(coupon.discountValue),
              pointsCost: coupon.pointsCost,
            }
          : null,
      });
    }
  }

  return nearby.sort((a, b) => a.distanceM - b.distanceM);
}

/**
 * Record a partner pin click in analytics.
 */
export async function recordPartnerClick(partnerId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.partnerAnalytics.upsert({
    where: { partnerId_date: { partnerId, date: today } },
    create: {
      partnerId,
      date: today,
      pinClicks: 1,
    },
    update: {
      pinClicks: { increment: 1 },
    },
  });
}

/**
 * Record a partner pin view (called when route is returned with partners).
 */
export async function recordPartnerView(partnerId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.partnerAnalytics.upsert({
    where: { partnerId_date: { partnerId, date: today } },
    create: {
      partnerId,
      date: today,
      pinViews: 1,
    },
    update: {
      pinViews: { increment: 1 },
    },
  });
}

/**
 * Record a coupon issued event for partner analytics.
 */
export async function recordCouponIssued(partnerId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.partnerAnalytics.upsert({
    where: { partnerId_date: { partnerId, date: today } },
    create: {
      partnerId,
      date: today,
      couponsIssued: 1,
    },
    update: {
      couponsIssued: { increment: 1 },
    },
  });
}

/**
 * Record a coupon redeemed event for partner analytics.
 */
export async function recordCouponRedeemed(partnerId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.partnerAnalytics.upsert({
    where: { partnerId_date: { partnerId, date: today } },
    create: {
      partnerId,
      date: today,
      couponsRedeemed: 1,
    },
    update: {
      couponsRedeemed: { increment: 1 },
    },
  });
}
