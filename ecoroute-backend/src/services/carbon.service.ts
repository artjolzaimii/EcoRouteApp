import { TripMode } from "@prisma/client";
import { CarbonResult, CarbonBreakdown } from "../types";
import { clamp } from "../utils/helpers";

// ─────────────────────────────────────────────
// Emission Factors (grams CO2 per kilometre)
// Sources: IPCC AR5, DEFRA 2023, EEA transport report
// ─────────────────────────────────────────────

export const EMISSION_FACTORS: Record<string, number> = {
  WALKING:             0,
  BICYCLING:           0,
  EBIKE:               8,
  ESCOOTER:            20,
  BUS_ELECTRIC:        35,
  BUS_DIESEL:          80,
  BUS_LONGDISTANCE:    27,
  SUBWAY:              30,
  TRAM:                35,
  RAIL_REGIONAL:       41,
  RAIL_HIGHSPEED:      14,
  FERRY:               187,
  CAR:                 170,
  PLANE_SHORT:         255,
  PLANE_MEDIUM:        195,
  PLANE_LONG:          147,
};

// ─────────────────────────────────────────────
// Legacy per-mode map (for calculateCarbon)
// ─────────────────────────────────────────────

const CO2_G_PER_KM: Record<TripMode, number> = {
  WALKING: 0,
  CYCLING: 0,
  TRANSIT: 89,        // average bus/metro mix
  CYCLING_TRANSIT: 45,
  EV: 53,
};

/** Car baseline — average petrol car (legacy) */
const CAR_BASELINE_G_PER_KM = 192;

/** Points awarded per 100 g of CO2 saved vs car */
const POINTS_PER_100G_SAVED = 5;

/** Points awarded per eco-trip regardless of savings */
const BASE_TRIP_POINTS = 10;

// ─────────────────────────────────────────────
// scoreGoogleRoute result shape
// ─────────────────────────────────────────────

export interface ScoreResult {
  co2Grams: number;
  distanceKm: number;
  durationMin: number;
  carEquivalentCO2: number;
  savedVsCar: number;
  carbonScore: number;
  carbonBreakdown: Array<{
    mode: string;
    distanceKm: number;
    co2Grams: number;
    instruction: string;
  }>;
}

// ─────────────────────────────────────────────
// scoreGoogleRoute
// ─────────────────────────────────────────────

/**
 * Score a raw Google Directions API response.
 * Processes each leg and step to calculate per-segment CO2.
 */
export const scoreGoogleRoute = (
  googleResponse: {
    routes: Array<{
      legs: Array<{
        distance: { value: number };
        duration: { value: number };
        steps: Array<{
          travel_mode: string;
          distance: { value: number };
          duration: { value: number };
          html_instructions: string;
          transit_details?: { line: { vehicle: { type: string } } };
        }>;
      }>;
    }>;
  },
  mode: string
): ScoreResult => {
  const route = googleResponse.routes?.[0];
  if (!route) {
    return {
      co2Grams: 0, distanceKm: 0, durationMin: 0,
      carEquivalentCO2: 0, savedVsCar: 0, carbonScore: 100,
      carbonBreakdown: [],
    };
  }

  let totalCO2 = 0;
  let totalDistanceM = 0;
  let totalDurationS = 0;
  const carbonBreakdown: ScoreResult["carbonBreakdown"] = [];

  for (const leg of route.legs) {
    for (const step of leg.steps) {
      const stepDistKm = step.distance.value / 1000;
      let stepMode = mode.toUpperCase();
      let factor: number;

      if (step.travel_mode === "WALKING") {
        factor = EMISSION_FACTORS.WALKING;
        stepMode = "WALKING";
      } else if (step.travel_mode === "BICYCLING") {
        factor = EMISSION_FACTORS.BICYCLING;
        stepMode = "BICYCLING";
      } else if (step.travel_mode === "TRANSIT" && step.transit_details) {
        const vehicleType = step.transit_details.line.vehicle.type.toUpperCase();
        if (vehicleType === "SUBWAY" || vehicleType === "METRO" || vehicleType === "HEAVY_RAIL") {
          factor = EMISSION_FACTORS.SUBWAY;
          stepMode = "SUBWAY";
        } else if (vehicleType === "TRAM" || vehicleType === "STREETCAR" || vehicleType === "LIGHT_RAIL") {
          factor = EMISSION_FACTORS.TRAM;
          stepMode = "TRAM";
        } else if (
          vehicleType === "RAIL" || vehicleType === "COMMUTER_TRAIN" ||
          vehicleType === "HIGH_SPEED_TRAIN" || vehicleType === "INTERCITY_BUS"
        ) {
          factor = EMISSION_FACTORS.RAIL_REGIONAL;
          stepMode = "RAIL";
        } else {
          factor = EMISSION_FACTORS.BUS_DIESEL;
          stepMode = "BUS";
        }
      } else {
        factor = EMISSION_FACTORS[mode.toUpperCase()] ?? EMISSION_FACTORS.BUS_DIESEL;
        stepMode = mode.toUpperCase();
      }

      const stepCO2 = stepDistKm * factor;
      totalCO2 += stepCO2;
      totalDistanceM += step.distance.value;
      totalDurationS += step.duration.value;

      carbonBreakdown.push({
        mode: stepMode,
        distanceKm: Math.round(stepDistKm * 100) / 100,
        co2Grams: Math.round(stepCO2),
        instruction: step.html_instructions?.replace(/<[^>]+>/g, "") ?? "",
      });
    }
  }

  const co2Grams = Math.round(totalCO2);
  const distanceKm = Math.round((totalDistanceM / 1000) * 100) / 100;
  const durationMin = Math.ceil(totalDurationS / 60);
  const carEquivalentCO2 = Math.round(distanceKm * EMISSION_FACTORS.CAR);
  const savedVsCar = Math.max(0, carEquivalentCO2 - co2Grams);
  const carbonScore = carEquivalentCO2 > 0
    ? Math.round(Math.max(0, 100 - (co2Grams / carEquivalentCO2) * 100))
    : 100;

  return { co2Grams, distanceKm, durationMin, carEquivalentCO2, savedVsCar, carbonScore, carbonBreakdown };
};

// ─────────────────────────────────────────────
// calculateGreenPoints
// ─────────────────────────────────────────────

export const calculateGreenPoints = (co2SavedGrams: number, mode: string): number => {
  const multipliers: Record<string, number> = {
    WALKING:          1.5,
    BICYCLING:        1.5,
    CYCLING:          1.5,  // Prisma TripMode alias for BICYCLING
    EBIKE:            1.3,
    ESCOOTER:         1.2,
    MIXED:            1.2,
    CYCLING_TRANSIT:  1.2,  // Prisma TripMode alias for MIXED
    TRANSIT:          1.0,
    TRAIN:            1.0,
    COACH:            1.0,
    EV:               0.8,
    // Modes that should earn 0 points
    PLANE:            0.0,
    DRIVING:          0.0,
  };
  const base = co2SavedGrams / 10;
  const multiplier = multipliers[mode.toUpperCase()] ?? 1.0;
  return Math.round(base * multiplier);
};

// ─────────────────────────────────────────────
// calculateFlightCO2
// ─────────────────────────────────────────────

export const calculateFlightCO2 = (
  flightDistanceKm: number,
  seatClass: "economy" | "business" = "economy"
): number => {
  let baseFactor: number;
  if (flightDistanceKm < 1500)      baseFactor = EMISSION_FACTORS.PLANE_SHORT;
  else if (flightDistanceKm < 4000) baseFactor = EMISSION_FACTORS.PLANE_MEDIUM;
  else                               baseFactor = EMISSION_FACTORS.PLANE_LONG;

  const classMultiplier = seatClass === "business" ? 2.9 : 1.0;
  const RFI = 1.9; // Radiative Forcing Index

  return Math.round(flightDistanceKm * baseFactor * classMultiplier * RFI);
};

// ─────────────────────────────────────────────
// calculateCarbon (legacy — kept for existing code)
// ─────────────────────────────────────────────

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

  const savingsRatio = totalSavedG / Math.max(1, carBaselineGPerKm * distanceKm);
  const timeEfficiencyBonus = durationMinutes < 30 ? 10 : durationMinutes < 60 ? 5 : 0;
  const ecoScore = clamp(Math.round(savingsRatio * 90 + timeEfficiencyBonus), 0, 100);

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

// ─────────────────────────────────────────────
// Utility helpers (kept)
// ─────────────────────────────────────────────

export function gramsToCo2TreeDays(grams: number): number {
  const gramsPerTreeDay = 57.5;
  return Math.round((grams / gramsPerTreeDay) * 10) / 10;
}

export function gramsToCarTripsAvoided(grams: number): number {
  const gramsPerAvgCarTrip = CAR_BASELINE_G_PER_KM * 10;
  return Math.round((grams / gramsPerAvgCarTrip) * 10) / 10;
}
