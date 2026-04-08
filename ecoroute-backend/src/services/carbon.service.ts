import { TripMode } from "@prisma/client";
import { CarbonResult, CarbonBreakdown } from "../types";
import { clamp } from "../utils/helpers";

/**
 * CO2 emission factors in grams per kilometre.
 * Sources: UK DEFRA / IPCC transport emission factors.
 */
const CO2_G_PER_KM: Record<TripMode, number> = {
  WALKING: 0,
  CYCLING: 0,
  TRANSIT: 89,        // average bus/metro mix
  CYCLING_TRANSIT: 45, // approx half transit
  EV: 53,             // average grid electricity (UK average)
};

/** Car baseline — average petrol car */
const CAR_BASELINE_G_PER_KM = 192;

/** Points awarded per 100 g of CO2 saved vs car */
const POINTS_PER_100G_SAVED = 5;

/** Points awarded per eco-trip regardless of savings */
const BASE_TRIP_POINTS = 10;

/**
 * Calculate full carbon result for a trip.
 */
export function calculateCarbon(
  mode: TripMode,
  distanceKm: number,
  durationMinutes: number
): CarbonResult {
  const modeEmissionsGPerKm = CO2_G_PER_KM[mode];
  const carBaselineGPerKm = CAR_BASELINE_G_PER_KM;

  const totalEmittedG = Math.round(modeEmissionsGPerKm * distanceKm);
  const totalSavedG = Math.max(0, Math.round((carBaselineGPerKm - modeEmissionsGPerKm) * distanceKm));

  const carbonBreakdown: CarbonBreakdown = {
    modeEmissionsGPerKm,
    carBaselineGPerKm,
    totalEmittedG,
    totalSavedG,
  };

  // Eco score: 0-100 based on savings ratio + time efficiency
  const savingsRatio = totalSavedG / Math.max(1, carBaselineGPerKm * distanceKm);
  const timeEfficiencyBonus = durationMinutes < 30 ? 10 : durationMinutes < 60 ? 5 : 0;
  const ecoScore = clamp(Math.round(savingsRatio * 90 + timeEfficiencyBonus), 0, 100);

  // Green points: base + savings bonus
  const savingsBonus = Math.floor(totalSavedG / 100) * POINTS_PER_100G_SAVED;
  const greenPoints = BASE_TRIP_POINTS + savingsBonus;

  return {
    co2Grams: totalEmittedG,
    savedVsCar: totalSavedG,
    ecoScore,
    greenPoints,
    distanceKm,
    durationMinutes,
    carbonBreakdown,
  };
}

/**
 * Equivalent tree-days absorbing CO2.
 * A tree absorbs ~21 kg CO2 per year ≈ 57.5 g per day.
 */
export function gramsToCo2TreeDays(grams: number): number {
  const gramsPerTreeDay = 57.5;
  return Math.round((grams / gramsPerTreeDay) * 10) / 10;
}

/**
 * Number of car trips (avg 10 km) avoided.
 */
export function gramsToCarTripsAvoided(grams: number): number {
  const gramsPerAvgCarTrip = CAR_BASELINE_G_PER_KM * 10;
  return Math.round((grams / gramsPerAvgCarTrip) * 10) / 10;
}
