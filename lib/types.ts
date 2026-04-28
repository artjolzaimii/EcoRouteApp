// Frontend types — existing + new EcoRoute types

// ─────────────────────────────────────────────
// Existing types (kept)
// ─────────────────────────────────────────────

export type TripMode =
  | 'CYCLING'
  | 'TRANSIT'
  | 'WALKING'
  | 'CYCLING_TRANSIT'
  | 'EV'
  | 'DRIVING';

export type RouteStep = {
  mode: string;
  instruction: string;
  distanceM: number;
  durationS: number;
  polyline?: string;
  startLocation?: LatLng;
  endLocation?: LatLng;
};

export type NearbyPartner = {
  id: string;
  name: string;
  category: string;
  logoUrl: string | null;
  address: string;
  lat: number;
  lng: number;
  distanceM: number;
  pointsPerVisit: number;
  activeCoupon: {
    id: string;
    title: string;
    discountValue: number;
    pointsCost: number;
  } | null;
};

export type RouteOption = {
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
};

export type RouteSearch = {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  originAddress: string;
  destAddress: string;
  routes: RouteOption[];
  selectedIndex: number;
  preferredMode: TripMode;
  // Optional: full EcoRoutesResponse when using the new API format
  ecoResponse?: EcoRoutesResponse;
};

export type PendingPlace = {
  address: string;
  lat: number;
  lng: number;
};

// ─────────────────────────────────────────────
// New EcoRoute types (UPDATE 10)
// ─────────────────────────────────────────────

export type JourneyType = 'MICRO' | 'URBAN' | 'REGIONAL' | 'INTERCITY' | 'INTERNATIONAL';

export interface LatLng {
  lat: number;
  lng: number;
  name?: string;
}

export interface CarbonBreakdownLeg {
  mode: string;
  distanceKm: number;
  co2Grams: number;
  instruction: string;
  polyline?: string;
  startLocation?: LatLng;
  endLocation?: LatLng;
}

export interface PartnerPin {
  id: string;
  businessName: string;
  category: string;
  lat: number;
  lng: number;
  logoUrl: string | null;
  distanceFromRouteM: number;
  coupon: {
    title: string;
    discountType: string;
    discountValue: number;
    earnType: string;
    pointsRequired: number;
  } | null;
}

export interface EcoRoute {
  mode: string;
  subType?: string;
  durationMin: number;
  distanceKm: number;
  co2Grams: number;
  carEquivalentCO2: number;
  savedVsCar: number;
  carbonScore: number;
  timeScore: number;
  practicalityScore: number;
  finalScore: number;
  greenPoints: number;
  recommended: boolean;
  recommendationReason?: string;
  transferCount?: number;
  requiresBooking?: boolean;
  bookingUrl?: string;
  carbonBreakdown: CarbonBreakdownLeg[];
  geometry?: string;
  originStation?: string;
  destStation?: string;
  originAirport?: string;
  destAirport?: string;
  price?: number | null;
  currency?: string;
  dataSource?: string;
  partnerStop?: {
    partnerId: string;
    partnerName: string;
    vehicleType: string;
    pickupLat: number;
    pickupLng: number;
    pickupAddress?: string;
  };
}

export interface EcoRoutesResponse {
  success: boolean;
  journeyType: JourneyType;
  distanceKm: number;
  routes: EcoRoute[];
  topRoute: EcoRoute & { partnerPins: PartnerPin[] };
  carBaseline: {
    co2Grams: number;
    durationMin: number;
  };
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  dataQualityMessage: string;
}

export interface UserStats {
  totalPoints: number;
  lifetimePoints?: number;
  totalTrips: number;
  totalCo2SavedG: number;
  totalKm?: number;
  currentStreak?: number;
  longestStreak?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  conditionType: string;
  conditionValue: number;
  pointsReward: number;
  earned: boolean;
  earnedAt?: string;
}

export interface ImpactData {
  totalCO2Saved: number;
  totalTrips: number;
  totalKm: number;
  moneySavedEur?: number;
  dailyBreakdown: Array<{
    date: string;
    co2Saved: number;
    trips: number;
  }>;
  equivalentTrees?: number;
  equivalentCarTrips?: number;
}
