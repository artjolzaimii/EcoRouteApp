import "dotenv/config";
import { PrismaClient, PartnerCategory, DiscountType, ConditionType, ChallengeType } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Airport seeding from OurAirports CSV
// ─────────────────────────────────────────────

async function seedAirports(): Promise<void> {
  const prismaAny = prisma as any;
  const count = await prismaAny.airport.count().catch(() => -1);
  if (count > 0) {
    console.log(`  ✔ ${count} airports already seeded — skipping`);
    return;
  }

  console.log("  ⬇ Downloading airports CSV from OurAirports...");

  try {
    const response = await fetch(
      "https://davidmegginson.github.io/ourairports-data/airports.csv"
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    const lines = text.split("\n");
    const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

    const nameIdx     = header.indexOf("name");
    const typeIdx     = header.indexOf("type");
    const latIdx      = header.indexOf("latitude_deg");
    const lngIdx      = header.indexOf("longitude_deg");
    const iataIdx     = header.indexOf("iata_code");
    const municipIdx  = header.indexOf("municipality");
    const countryIdx  = header.indexOf("iso_country");

    const airports: Array<{
      iataCode: string; name: string; city: string | null;
      country: string | null; latitudeDeg: string; longitudeDeg: string; type: string;
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simple CSV parse — handle quoted fields
      const cols = parseCsvLine(line);
      const type    = cols[typeIdx]?.replace(/"/g, "").trim() ?? "";
      const iata    = cols[iataIdx]?.replace(/"/g, "").trim() ?? "";
      const lat     = cols[latIdx]?.replace(/"/g, "").trim() ?? "";
      const lng     = cols[lngIdx]?.replace(/"/g, "").trim() ?? "";

      if (!["large_airport", "medium_airport"].includes(type)) continue;
      if (!iata || iata.length !== 3) continue;
      if (!lat || !lng) continue;

      airports.push({
        iataCode:     iata,
        name:         cols[nameIdx]?.replace(/"/g, "").trim() ?? "",
        city:         cols[municipIdx]?.replace(/"/g, "").trim() || null,
        country:      cols[countryIdx]?.replace(/"/g, "").trim() || null,
        latitudeDeg:  lat,
        longitudeDeg: lng,
        type,
      });
    }

    // Batch insert in chunks of 500
    let inserted = 0;
    const CHUNK = 500;
    for (let i = 0; i < airports.length; i += CHUNK) {
      const chunk = airports.slice(i, i + CHUNK);
      await prismaAny.airport.createMany({ data: chunk, skipDuplicates: true });
      inserted += chunk.length;
    }

    console.log(`  ✔ ${inserted} airports seeded`);
  } catch (err) {
    console.warn("  ⚠ Airport seeding skipped (network unavailable or table missing):", (err as Error).message);
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🌱 Seeding database...");

  // ─── Badges ──────────────────────────────────────────────────────────────────

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
    // New badges from UPDATE 8
    {
      name: "First Green Trip",
      description: "Complete your first green trip",
      conditionType: ConditionType.FIRST_TRIP,
      conditionValue: JSON.stringify(1),
      pointsReward: 50,
    },
    {
      name: "Car-Free Week",
      description: "Use EcoRoute every day for a week",
      conditionType: ConditionType.STREAK_DAYS,
      conditionValue: JSON.stringify(7),
      pointsReward: 200,
    },
    {
      name: "Century Saver",
      description: "Save 100g of CO2 across your trips",
      conditionType: ConditionType.MIN_DISTANCE_KM,
      conditionValue: JSON.stringify(1),
      pointsReward: 300,
    },
    {
      name: "500km Club",
      description: "Travel 500 km total via eco modes",
      conditionType: ConditionType.MIN_DISTANCE_KM,
      conditionValue: JSON.stringify(500),
      pointsReward: 250,
    },
    {
      name: "Clean Air Champion",
      description: "Complete 50+ eco trips",
      conditionType: ConditionType.MIN_TRIPS,
      conditionValue: JSON.stringify(50),
      pointsReward: 500,
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

  // ─── Demo Eco-Partners ──────────────────────────────────────────────────────

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

  // ─── Demo Coupons ─────────────────────────────────────────────────────────

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

  // ─── Challenges ───────────────────────────────────────────────────────────

  const challengeData = [
    {
      id: "seed-challenge-first-steps",
      title: "First Steps",
      description: "Complete 3 eco trips",
      type: ChallengeType.TRIP_COUNT,
      targetValue: 3,
      rewardPoints: 100,
    },
    {
      id: "seed-challenge-weekend-warrior",
      title: "Weekend Warrior",
      description: "Complete 5 eco trips",
      type: ChallengeType.TRIP_COUNT,
      targetValue: 5,
      rewardPoints: 200,
    },
    {
      id: "seed-challenge-bike-champion",
      title: "Bike Champion",
      description: "Cycle 50 km",
      type: ChallengeType.CYCLING_KM,
      targetValue: 50,
      rewardPoints: 500,
    },
    {
      id: "seed-challenge-co2-hero",
      title: "CO₂ Hero",
      description: "Save 5,000g of CO₂ vs driving",
      type: ChallengeType.CO2_SAVED_G,
      targetValue: 5000,
      rewardPoints: 300,
    },
  ];

  for (const c of challengeData) {
    await (prisma as any).challenge.upsert({
      where: { id: c.id },
      update: { title: c.title, description: c.description, rewardPoints: c.rewardPoints },
      create: c,
    });
  }

  console.log(`  ✔ ${challengeData.length} challenges seeded`);

  // ─── Airports ─────────────────────────────────────────────────────────────

  await seedAirports();

  // ─── Nextbike Halle/Saale — Mobility Partner (Berlin→Leipzig corridor) ───

  const nextbikeHalle = await (prisma as any).ecoPartner.upsert({
    where: { id: "seed-partner-nextbike-halle" },
    update: {},
    create: {
      id: "seed-partner-nextbike-halle",
      name: "Nextbike Halle/Saale",
      description:
        "Public bike-share station at Halle Hauptbahnhof. Take the ICE from Berlin, " +
        "pick up a bicycle here, and cycle the remaining ~30 km to Leipzig — zero emissions for the last leg.",
      category: PartnerCategory.TRANSPORT,
      status: "ACTIVE",
      address: "Bahnhofplatz 4, 06108 Halle (Saale)",
      lat: 51.4771,
      lng: 11.9857,
      radiusMeters: 500,
      pointsPerVisit: 50,
      partnerType: "MOBILITY_PROVIDER",
    },
  });

  await (prisma as any).partnerLocation.upsert({
    where: {
      partnerId_externalId: { partnerId: nextbikeHalle.id, externalId: "halle-hbf-north" },
    },
    update: {},
    create: {
      partnerId: nextbikeHalle.id,
      externalId: "halle-hbf-north",
      name: "Halle Hbf — North Entrance",
      lat: 51.4771,
      lng: 11.9857,
      vehicleCount: 15,
      vehicleType: "BICYCLE",
      isActive: true,
    },
  });

  await (prisma as any).partnerLocation.upsert({
    where: {
      partnerId_externalId: { partnerId: nextbikeHalle.id, externalId: "halle-hbf-south" },
    },
    update: {},
    create: {
      partnerId: nextbikeHalle.id,
      externalId: "halle-hbf-south",
      name: "Halle Hbf — South Exit",
      lat: 51.4755,
      lng: 11.9845,
      vehicleCount: 8,
      vehicleType: "EBIKE",
      isActive: true,
    },
  });

  console.log("  ✔ Nextbike Halle/Saale mobility partner seeded (2 locations)");

  // ─── Nextbike Riesa — Mobility Partner (Leipzig→Dresden corridor) ─────────

  const nextbikeRiesa = await (prisma as any).ecoPartner.upsert({
    where: { id: "seed-partner-nextbike-riesa" },
    update: {},
    create: {
      id: "seed-partner-nextbike-riesa",
      name: "Nextbike Riesa",
      description:
        "Public bike-share station at Riesa Hauptbahnhof. Take the regional train from Leipzig, " +
        "pick up a bicycle here, and cycle the remaining ~42 km to Dresden — zero emissions for the last leg.",
      category: PartnerCategory.TRANSPORT,
      status: "ACTIVE",
      address: "Bahnhofstraße 1, 01587 Riesa",
      lat: 51.3057,
      lng: 13.2943,
      radiusMeters: 500,
      pointsPerVisit: 50,
      partnerType: "MOBILITY_PROVIDER",
    },
  });

  await (prisma as any).partnerLocation.upsert({
    where: {
      partnerId_externalId: { partnerId: nextbikeRiesa.id, externalId: "riesa-hbf-main" },
    },
    update: {},
    create: {
      partnerId: nextbikeRiesa.id,
      externalId: "riesa-hbf-main",
      name: "Riesa Hbf — Main Entrance",
      lat: 51.3057,
      lng: 13.2943,
      vehicleCount: 12,
      vehicleType: "BICYCLE",
      isActive: true,
    },
  });

  await (prisma as any).partnerLocation.upsert({
    where: {
      partnerId_externalId: { partnerId: nextbikeRiesa.id, externalId: "riesa-hbf-east" },
    },
    update: {},
    create: {
      partnerId: nextbikeRiesa.id,
      externalId: "riesa-hbf-east",
      name: "Riesa Hbf — East Exit",
      lat: 51.3068,
      lng: 13.2961,
      vehicleCount: 6,
      vehicleType: "EBIKE",
      isActive: true,
    },
  });

  console.log("  ✔ Nextbike Riesa mobility partner seeded (2 locations)");

  console.log("🌿 Seed complete!");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
