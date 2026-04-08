// Frontend types — mirror the backend's RouteOption and related shapes

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
  co2SavedVsCar: number;  // grams saved vs car baseline
  ecoScore: number;       // 0–100
  greenPoints: number;
  isRecommended: boolean;
  polyline: string;       // encoded Google polyline string
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
};

export type PendingPlace = {
  address: string;
  lat: number;
  lng: number;
};
