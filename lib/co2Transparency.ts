import { EcoRoute, RouteOption } from './types';

const MODE_EMISSION_FACTORS: Record<string, number> = {
  WALKING: 0,
  BICYCLING: 0,
  CYCLING: 0,
  CYCLING_TRANSIT: 45,
  MIXED: 45,
  TRANSIT: 89,
  BUS: 80,
  TRAIN: 14,
  RAIL: 14,
  RAIL_HIGHSPEED: 14,
  SUBWAY: 30,
  TRAM: 35,
  EV: 53,
  PLANE: 195,
};

const MODE_POINT_MULTIPLIERS: Record<string, number> = {
  WALKING: 1.5,
  BICYCLING: 1.5,
  CYCLING: 1.5,
  CYCLING_TRANSIT: 1.2,
  MIXED: 1.2,
  TRANSIT: 1,
  TRAIN: 1,
  RAIL: 1,
  RAIL_HIGHSPEED: 1,
  BUS: 1,
  PLANE: 0,
  EV: 0.8,
};

export type Co2TransparencyData = {
  mode: string;
  distanceKm: number;
  co2EmittedGrams: number;
  co2SavedGrams: number;
  carBaselineGrams: number;
  greenPoints: number;
  emissionFactor: number;
  pointMultiplier: number;
};

function modeKey(mode?: string): string {
  return (mode ?? 'TRANSIT').toUpperCase();
}

export function modeDisplayName(mode?: string): string {
  switch (modeKey(mode)) {
    case 'WALKING': return 'Walking';
    case 'BICYCLING':
    case 'CYCLING': return 'Cycling';
    case 'CYCLING_TRANSIT':
    case 'MIXED': return 'Cycling + Transit';
    case 'TRAIN':
    case 'RAIL':
    case 'RAIL_HIGHSPEED': return 'Train';
    case 'BUS':
    case 'TRANSIT': return 'Transit';
    case 'PLANE': return 'Flight';
    case 'EV': return 'Electric Vehicle';
    default: return mode ?? 'Route';
  }
}

export function co2DataFromRoute(route?: EcoRoute | RouteOption | null): Co2TransparencyData | null {
  if (!route) return null;

  const ecoRoute = route as EcoRoute;
  const legacyRoute = route as RouteOption;
  const mode = ecoRoute.mode ?? legacyRoute.mode;
  const distanceKm = ecoRoute.distanceKm ?? legacyRoute.distanceKm ?? 0;
  const co2EmittedGrams = ecoRoute.co2Grams ?? legacyRoute.co2Grams ?? 0;
  const co2SavedGrams = ecoRoute.savedVsCar ?? legacyRoute.co2SavedVsCar ?? 0;
  const carBaselineGrams = ecoRoute.carEquivalentCO2 ?? co2SavedGrams + co2EmittedGrams;
  const greenPoints = ecoRoute.greenPoints ?? legacyRoute.greenPoints ?? 0;
  const key = modeKey(ecoRoute.subType ?? mode);

  return {
    mode,
    distanceKm,
    co2EmittedGrams,
    co2SavedGrams,
    carBaselineGrams,
    greenPoints,
    emissionFactor: distanceKm > 0
      ? Math.round((co2EmittedGrams / distanceKm) * 10) / 10
      : MODE_EMISSION_FACTORS[key] ?? MODE_EMISSION_FACTORS[modeKey(mode)] ?? 0,
    pointMultiplier: MODE_POINT_MULTIPLIERS[key] ?? MODE_POINT_MULTIPLIERS[modeKey(mode)] ?? 1,
  };
}

export function formatKg(grams: number): string {
  return `${(grams / 1000).toFixed(2)} kg`;
}
