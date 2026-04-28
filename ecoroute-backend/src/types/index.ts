import { Role, TripMode, TripStatus, PartnerCategory, PartnerStatus, DiscountType, EarnType, ConditionType, PointsLedgerType } from "@prisma/client";

// ─────────────────────────────────────────────
// Re-export Prisma enums for use across the app
// ─────────────────────────────────────────────
export { Role, TripMode, TripStatus, PartnerCategory, PartnerStatus, DiscountType, EarnType, ConditionType, PointsLedgerType };

// ─────────────────────────────────────────────
// Auth — attached to req.user by middleware
// ─────────────────────────────────────────────
export interface AuthUser {
  authUserId: string;
  email: string;
  role: Role;
  profileId: string;
}

// ─────────────────────────────────────────────
// Express augmentation
// ─────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ─────────────────────────────────────────────
// Standard API response shapes
// ─────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────
// Google Maps types
// ─────────────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

export interface GoogleLeg {
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  start_address: string;
  end_address: string;
  steps: GoogleStep[];
}

export interface GoogleStep {
  travel_mode: string;
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  html_instructions: string;
  polyline?: { points: string };
  start_location?: LatLng;
  end_location?: LatLng;
  transit_details?: {
    line: { vehicle: { type: string } };
  };
}

export interface GoogleDirectionsRoute {
  legs: GoogleLeg[];
  overview_polyline: { points: string };
  summary: string;
}

export interface GoogleDirectionsResponse {
  status: string;
  routes: GoogleDirectionsRoute[];
}

// ─────────────────────────────────────────────
// Carbon / Scoring types
// ─────────────────────────────────────────────
export interface CarbonBreakdown {
  modeEmissionsGPerKm: number;
  carBaselineGPerKm: number;
  totalEmittedG: number;
  totalSavedG: number;
}

export interface CarbonResult {
  co2Grams: number;
  savedVsCar: number;
  ecoScore: number;
  greenPoints: number;
  distanceKm: number;
  durationMinutes: number;
  carbonBreakdown: CarbonBreakdown;
}

// ─────────────────────────────────────────────
// Route option returned to the frontend
// ─────────────────────────────────────────────
export interface RouteOption {
  id: string;
  mode: TripMode;
  label: string;
  distanceKm: number;
  durationMinutes: number;
  co2Grams: number;
  co2SavedVsCar: number;
  ecoScore: number;
  greenPoints: number;
  isRecommended: boolean;
  polyline: string;
  steps: RouteStep[];
  nearbyPartners: NearbyPartner[];
}

export interface RouteStep {
  mode: string;
  instruction: string;
  distanceM: number;
  durationS: number;
  polyline?: string;
  startLocation?: LatLng;
  endLocation?: LatLng;
}

// ─────────────────────────────────────────────
// Partner types
// ─────────────────────────────────────────────
export interface NearbyPartner {
  id: string;
  name: string;
  category: PartnerCategory;
  logoUrl: string | null;
  address: string;
  lat: number;
  lng: number;
  distanceM: number;
  pointsPerVisit: number;
  activeCoupon: ActiveCouponSummary | null;
}

export interface ActiveCouponSummary {
  id: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  pointsCost: number;
}

// ─────────────────────────────────────────────
// Impact summary types
// ─────────────────────────────────────────────
export interface DayImpact {
  date: string;      // ISO date string YYYY-MM-DD
  co2SavedG: number;
  trips: number;
  distanceKm: number;
}

export interface ImpactSummary {
  totalCo2SavedG: number;
  totalTrips: number;
  totalDistanceKm: number;
  equivalentTreeDays: number;
  equivalentCarTripsAvoided: number;
  dailyBreakdown: DayImpact[];
}

// ─────────────────────────────────────────────
// Streak result
// ─────────────────────────────────────────────
export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  streakBonusPoints: number;
}
