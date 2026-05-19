import { prisma } from "../config/prisma";
import { haversineMeters, haversineDistance } from "../utils/helpers";
import { NearbyPartner } from "../types";
import { cacheGet, cacheSet } from "./cache.service";

const PARTNER_CACHE_TTL = 600; // 10 minutes

// ─────────────────────────────────────────────
// findNearbyPartners (existing — kept)
// ─────────────────────────────────────────────

export async function findNearbyPartners(
  lat: number,
  lng: number,
  radiusMeters: number = 1000
): Promise<NearbyPartner[]> {
  const cacheKey = "partners:all:active";
  let partners = await cacheGet<any[]>(cacheKey);

  if (partners) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Partners] Cache HIT: partners:all:active");
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("[Partners] Cache MISS: partners:all:active — querying DB");
    }
    partners = await prisma.ecoPartner.findMany({
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
                ],
              },
            ],
          },
          orderBy: { pointsCost: "asc" },
          take: 1,
        },
      },
    });
    // Ignore Redis errors — fallback is already the fresh DB result above
    await cacheSet(cacheKey, partners, PARTNER_CACHE_TTL);
  }

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

// ─────────────────────────────────────────────
// getMobilityPartnersNearLocation (new)
// ─────────────────────────────────────────────

export const getMobilityPartnersNearLocation = async (
  lat: number,
  lng: number,
  radiusMetres: number,
  prismaClient: typeof prisma = prisma
) => {
  try {
    const allPartners = await (prismaClient.ecoPartner as any).findMany({
      where: {
        status: "ACTIVE",
        partnerType: "MOBILITY_PROVIDER",
      },
      include: {
        locations: {
          where: { isActive: true },
        },
      } as any,
    });

    return (allPartners as any[]).filter((partner: any) => {
      const locations = partner.locations ?? [];
      const hasNearbyLocation = locations.some((location: any) => {
        const dist = haversineDistance(
          lat, lng,
          Number(location.lat), Number(location.lng)
        ) * 1000;
        return dist <= radiusMetres;
      });
      return hasNearbyLocation;
    }).map((partner: any) => ({
      ...partner,
      nearestLocation: (partner.locations ?? [])
        .map((loc: any) => ({
          ...loc,
          distanceMetres: Math.round(
            haversineDistance(lat, lng, Number(loc.lat), Number(loc.lng)) * 1000
          ),
        }))
        .sort((a: any, b: any) => a.distanceMetres - b.distanceMetres)[0],
    }));
  } catch {
    return [];
  }
};

// ─────────────────────────────────────────────
// getEcoBusinessPartnersAlongRoute (new)
// ─────────────────────────────────────────────

export const getEcoBusinessPartnersAlongRoute = async (
  routeCoordinates: Array<{ lat: number; lng: number }>,
  prismaClient: typeof prisma = prisma
) => {
  try {
    const cacheKey = "partners:eco_business:active";
    let allPartners = await cacheGet<any[]>(cacheKey);

    if (allPartners) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Partners] Cache HIT: partners:eco_business:active");
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log("[Partners] Cache MISS: partners:eco_business:active — querying DB");
      }
      allPartners = await (prismaClient.ecoPartner as any).findMany({
        where: {
          status: "ACTIVE",
          partnerType: "ECO_BUSINESS",
        },
        include: {
          coupons: {
            where: {
              isActive: true,
              expiresAt: { gt: new Date() },
            },
          },
        },
      });
      // Ignore Redis errors — fresh DB result is already in memory
      await cacheSet(cacheKey, allPartners, PARTNER_CACHE_TTL);
    }

    const nearby = (allPartners as any[]).filter((partner: any) => {
      const triggerRadius = partner.radiusMeters ?? 500;
      return routeCoordinates.some((point) => {
        const distMetres = haversineDistance(
          point.lat, point.lng,
          Number(partner.lat), Number(partner.lng)
        ) * 1000;
        return distMetres <= triggerRadius;
      });
    });

    // Fire analytics writes in the background — never block the route response
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    Promise.allSettled(
      nearby.map((partner: any) =>
        prismaClient.partnerAnalytics.upsert({
          where: { partnerId_date: { partnerId: partner.id, date: today } },
          update: { pinViews: { increment: 1 } },
          create: { partnerId: partner.id, date: today, pinViews: 1 },
        })
      )
    ).then((results) => {
      if (process.env.NODE_ENV === "development") {
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          console.warn(`[Partners] ${failed} analytics upsert(s) failed silently`);
        }
      }
    }).catch(() => {}); // Never surface analytics errors to the caller

    return nearby.map((partner: any) => ({
      id:           partner.id,
      businessName: partner.name,
      category:     partner.category,
      lat:          Number(partner.lat),
      lng:          Number(partner.lng),
      logoUrl:      partner.logoUrl,
      distanceFromRouteM: Math.round(
        Math.min(...routeCoordinates.map((p) =>
          haversineDistance(p.lat, p.lng, Number(partner.lat), Number(partner.lng)) * 1000
        ))
      ),
      coupon: partner.coupons.length > 0 ? {
        title:          partner.coupons[0].title,
        discountType:   partner.coupons[0].discountType,
        discountValue:  Number(partner.coupons[0].discountValue),
        earnType:       "COUPON_REDEEM",
        pointsRequired: partner.coupons[0].pointsCost,
      } : null,
    }));
  } catch {
    return [];
  }
};

// ─────────────────────────────────────────────
// getMobilityStopsForRoute (new)
// ─────────────────────────────────────────────

export interface MobilityStop {
  partnerId: string;
  partnerName: string;
  locationId: string;
  locationName: string;
  pickupLat: number;
  pickupLng: number;
  vehicleType: string;          // "BICYCLE" | "EBIKE" | "ESCOOTER" | "CARGO_BIKE"
  vehicleCount: number | null;
  distanceToLineKm: number;     // perpendicular distance to direct origin→dest line
  distanceFromOriginKm: number;
  distanceToDestKm: number;
}

/**
 * Returns active MOBILITY_PROVIDER locations that:
 *  1. Lie within `corridorKm` of the straight origin→destination line
 *  2. Are closer to the destination than to the origin (last-mile candidates)
 *  3. Have a cycling leg to destination between 5 and 80 km
 * Sorted by how close they are to the straight line (most on-the-way first).
 */
export async function getMobilityStopsForRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  corridorKm = 30,
  prismaClient: typeof prisma = prisma
): Promise<MobilityStop[]> {
  try {
    const mobilityCacheKey = "partners:mobility:active";
    let partners = await cacheGet<any[]>(mobilityCacheKey);

    if (partners) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Partners] Cache HIT: partners:mobility:active");
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log("[Partners] Cache MISS: partners:mobility:active — querying DB");
      }
      partners = await (prismaClient as any).ecoPartner.findMany({
        where: { status: "ACTIVE", partnerType: "MOBILITY_PROVIDER" },
        include: { locations: { where: { isActive: true } } },
      });
      await cacheSet(mobilityCacheKey, partners, PARTNER_CACHE_TTL);
    }

    const directKm = haversineDistance(
      origin.lat, origin.lng,
      destination.lat, destination.lng
    );

    const stops: MobilityStop[] = [];

    // Pre-compute segment direction for projection
    const _sdx = destination.lng - origin.lng;
    const _sdy = destination.lat - origin.lat;
    const _sLenSq = _sdx * _sdx + _sdy * _sdy;

    for (const partner of partners as any[]) {
      for (const loc of (partner.locations ?? []) as any[]) {
        const lat = Number(loc.lat);
        const lng = Number(loc.lng);

        const fromOrigin = haversineDistance(origin.lat, origin.lng, lat, lng);
        const toDest     = haversineDistance(lat, lng, destination.lat, destination.lng);

        // Must be a last-mile stop: closer to destination, feasible cycling leg (5–80 km)
        if (toDest >= fromOrigin) continue;
        if (toDest < 5 || toDest > 80) continue;

        // Going via the stop must not add more than 35% extra distance
        if (fromOrigin + toDest > directKm * 1.35) continue;

        // Perpendicular distance from stop to the direct origin→destination line.
        // IMPORTANT: when t ≥ 0.85 the stop projects onto/past the destination endpoint,
        // so "perpendicular distance" equals toDest — which we already checked above.
        // Applying the corridor gate again in that case would falsely reject valid last-mile
        // stops that are slightly west/east of the destination (e.g. Halle vs Leipzig).
        const _t = _sLenSq < 1e-12 ? 0 : Math.max(0, Math.min(1,
          ((lng - origin.lng) * _sdx + (lat - origin.lat) * _sdy) / _sLenSq
        ));
        const toLine = _distToSegmentKm({ lat, lng }, origin, destination);
        if (_t < 0.85 && toLine > corridorKm) {
          console.log(`[Partner] ${partner.name}@${loc.name}: rejected by corridor (${toLine.toFixed(1)} km > ${corridorKm} km, t=${_t.toFixed(2)})`);
          continue;
        }

        stops.push({
          partnerId: partner.id,
          partnerName: partner.name,
          locationId: loc.id,
          locationName: (loc.name as string | null) ?? partner.name,
          pickupLat: lat,
          pickupLng: lng,
          vehicleType: (loc.vehicleType as string | null) ?? "BICYCLE",
          vehicleCount: (loc.vehicleCount as number | null) ?? null,
          distanceToLineKm:     Math.round(toLine * 10) / 10,
          distanceFromOriginKm: Math.round(fromOrigin * 10) / 10,
          distanceToDestKm:     Math.round(toDest * 10) / 10,
        });
      }
    }

    return stops.sort((a, b) => a.distanceToLineKm - b.distanceToLineKm);
  } catch {
    return [];
  }
}

/** Perpendicular distance (km) from point P to segment A→B. */
function _distToSegmentKm(
  p: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 1e-12) return haversineDistance(p.lat, p.lng, a.lat, a.lng);

  const t = Math.max(0, Math.min(1,
    ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / lenSq
  ));

  return haversineDistance(p.lat, p.lng, a.lat + t * dy, a.lng + t * dx);
}

// ─────────────────────────────────────────────
// Analytics helpers (existing — kept)
// ─────────────────────────────────────────────

export async function recordPartnerClick(partnerId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.partnerAnalytics.upsert({
    where: { partnerId_date: { partnerId, date: today } },
    create: { partnerId, date: today, pinClicks: 1 },
    update: { pinClicks: { increment: 1 } },
  });
}

export async function recordPartnerView(partnerId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.partnerAnalytics.upsert({
    where: { partnerId_date: { partnerId, date: today } },
    create: { partnerId, date: today, pinViews: 1 },
    update: { pinViews: { increment: 1 } },
  });
}

export async function recordCouponIssued(partnerId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.partnerAnalytics.upsert({
    where: { partnerId_date: { partnerId, date: today } },
    create: { partnerId, date: today, couponsIssued: 1 },
    update: { couponsIssued: { increment: 1 } },
  });
}

export async function recordCouponRedeemed(partnerId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.partnerAnalytics.upsert({
    where: { partnerId_date: { partnerId, date: today } },
    create: { partnerId, date: today, couponsRedeemed: 1 },
    update: { couponsRedeemed: { increment: 1 } },
  });
}
