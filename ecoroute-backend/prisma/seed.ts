import "dotenv/config";
import { PrismaClient, PartnerCategory, DiscountType, ConditionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Seeding database...");

  // ─── Badges ────────────────────────────────────────────────────────────────

  const badgeData = [
    {
      name: "First Steps",
      description: "Complete your very first eco trip",
      conditionType: ConditionType.FIRST_TRIP,
      conditionValue: JSON.stringify(1),
      pointsReward: 50,
    },
    {
      name: "Green Commuter",
      description: "Complete 10 eco trips",
      conditionType: ConditionType.MIN_TRIPS,
      conditionValue: JSON.stringify(10),
      pointsReward: 100,
    },
    {
      name: "Eco Warrior",
      description: "Complete 50 eco trips",
      conditionType: ConditionType.MIN_TRIPS,
      conditionValue: JSON.stringify(50),
      pointsReward: 300,
    },
    {
      name: "Century Club",
      description: "Complete 100 eco trips",
      conditionType: ConditionType.MIN_TRIPS,
      conditionValue: JSON.stringify(100),
      pointsReward: 750,
    },
    {
      name: "3-Day Streak",
      description: "Use EcoRoute 3 days in a row",
      conditionType: ConditionType.STREAK_DAYS,
      conditionValue: JSON.stringify(3),
      pointsReward: 30,
    },
    {
      name: "Week Warrior",
      description: "Use EcoRoute 7 days in a row",
      conditionType: ConditionType.STREAK_DAYS,
      conditionValue: JSON.stringify(7),
      pointsReward: 75,
    },
    {
      name: "Month Master",
      description: "Use EcoRoute 30 days in a row",
      conditionType: ConditionType.STREAK_DAYS,
      conditionValue: JSON.stringify(30),
      pointsReward: 500,
    },
    {
      name: "10K Traveller",
      description: "Travel 10 km total via eco modes",
      conditionType: ConditionType.MIN_DISTANCE_KM,
      conditionValue: JSON.stringify(10),
      pointsReward: 50,
    },
    {
      name: "100K Explorer",
      description: "Travel 100 km total via eco modes",
      conditionType: ConditionType.MIN_DISTANCE_KM,
      conditionValue: JSON.stringify(100),
      pointsReward: 200,
    },
    {
      name: "1000K Legend",
      description: "Travel 1000 km total via eco modes",
      conditionType: ConditionType.MIN_DISTANCE_KM,
      conditionValue: JSON.stringify(1000),
      pointsReward: 1000,
    },
  ];

  for (const badge of badgeData) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge,
    });
  }

  console.log(`  ✔ ${badgeData.length} badges seeded`);

  // ─── Demo Eco-Partners ─────────────────────────────────────────────────────

  const greenCoffee = await prisma.ecoPartner.upsert({
    where: { id: "seed-partner-green-coffee" },
    update: {},
    create: {
      id: "seed-partner-green-coffee",
      name: "Green Coffee Co.",
      description: "Ethically sourced coffee with zero single-use plastics. Bring your own cup for extra points.",
      category: PartnerCategory.FOOD,
      address: "12 Eco Lane, London EC1A 1BB",
      lat: 51.5174,
      lng: -0.1008,
      radiusMeters: 400,
      pointsPerVisit: 25,
    },
  });

  const ecoRide = await prisma.ecoPartner.upsert({
    where: { id: "seed-partner-ecoride" },
    update: {},
    create: {
      id: "seed-partner-ecoride",
      name: "EcoRide Bike Shop",
      description: "Sales, repairs, and rentals for cyclists. 10% discount for EcoRoute users.",
      category: PartnerCategory.TRANSPORT,
      address: "88 Cycle Road, London N1 9EF",
      lat: 51.5362,
      lng: -0.1031,
      radiusMeters: 600,
      pointsPerVisit: 40,
    },
  });

  const naturalMarket = await prisma.ecoPartner.upsert({
    where: { id: "seed-partner-natural-market" },
    update: {},
    create: {
      id: "seed-partner-natural-market",
      name: "The Natural Market",
      description: "Organic, package-free grocery store. Plastic-free shopping made easy.",
      category: PartnerCategory.RETAIL,
      address: "55 Green Street, London SE1 7PB",
      lat: 51.5035,
      lng: -0.0875,
      radiusMeters: 500,
      pointsPerVisit: 20,
    },
  });

  console.log("  ✔ 3 eco-partners seeded");

  // ─── Demo Coupons ──────────────────────────────────────────────────────────

  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  await prisma.coupon.upsert({
    where: { id: "seed-coupon-coffee-free" },
    update: {},
    create: {
      id: "seed-coupon-coffee-free",
      partnerId: greenCoffee.id,
      title: "Free Oat Latte",
      description: "Redeem for one free oat milk latte at any Green Coffee Co. location.",
      discountType: DiscountType.FREE_ITEM,
      discountValue: 4.5,
      pointsCost: 300,
      totalStock: 100,
      expiresAt: thirtyDays,
    },
  });

  await prisma.coupon.upsert({
    where: { id: "seed-coupon-bike-discount" },
    update: {},
    create: {
      id: "seed-coupon-bike-discount",
      partnerId: ecoRide.id,
      title: "10% Off Bike Service",
      description: "Get 10% off any bike servicing or repair at EcoRide Bike Shop.",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      pointsCost: 500,
      totalStock: 50,
      expiresAt: thirtyDays,
    },
  });

  await prisma.coupon.upsert({
    where: { id: "seed-coupon-market-5off" },
    update: {},
    create: {
      id: "seed-coupon-market-5off",
      partnerId: naturalMarket.id,
      title: "£5 Off Your Shop",
      description: "Get £5 off any purchase over £20 at The Natural Market.",
      discountType: DiscountType.FIXED,
      discountValue: 5,
      pointsCost: 400,
      totalStock: 75,
      expiresAt: thirtyDays,
    },
  });

  console.log("  ✔ 3 coupons seeded");
  console.log("🌿 Seed complete!");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
