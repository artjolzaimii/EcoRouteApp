import { decodePolyline } from './polyline';
import { CarbonBreakdownLeg, EcoRoute, RouteOption, RouteStep } from './types';

export type MapCoordinate = { latitude: number; longitude: number };

export type RouteMapSegment = {
  mode: string;
  coordinates: MapCoordinate[];
};

export type RouteTransitionMarker = {
  mode: string;
  coordinate: MapCoordinate;
};

function toCoordinate(point?: { lat: number; lng: number } | null): MapCoordinate | null {
  if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') return null;
  return { latitude: point.lat, longitude: point.lng };
}

export function routeModeKey(mode?: string): string {
  const value = (mode ?? '').toUpperCase();
  if (value === 'BICYCLING' || value === 'CYCLING' || value === 'EBIKE' || value === 'ESCOOTER') return 'CYCLING';
  if (value === 'BUS' || value === 'TRANSIT' || value === 'TRAM' || value === 'STREETCAR') return 'BUS';
  if (value === 'TRAIN' || value === 'RAIL' || value === 'RAIL_HIGHSPEED' || value === 'HIGH_SPEED_TRAIN' || value === 'SUBWAY' || value === 'METRO' || value === 'HEAVY_RAIL' || value === 'COMMUTER_TRAIN') return 'TRAIN';
  if (value === 'EV' || value === 'DRIVING' || value === 'CAR') return 'CAR';
  if (value === 'WALKING') return 'WALKING';
  if (value === 'PLANE' || value === 'FLIGHT') return 'PLANE';
  return value || 'ROUTE';
}

export function routeModeStyle(mode?: string): { strokeColor: string; strokeWidth: number; lineDashPattern?: number[] } {
  switch (routeModeKey(mode)) {
    case 'WALKING':
      return { strokeColor: '#2563eb', strokeWidth: 5, lineDashPattern: [2, 8] };
    case 'CYCLING':
      return { strokeColor: '#059669', strokeWidth: 6 };
    case 'BUS':
      return { strokeColor: '#d97706', strokeWidth: 6 };
    case 'TRAIN':
      return { strokeColor: '#7e22ce', strokeWidth: 6 };
    case 'CAR':
      return { strokeColor: '#374151', strokeWidth: 6 };
    case 'PLANE':
      return { strokeColor: '#60a5fa', strokeWidth: 5, lineDashPattern: [6, 10] };
    default:
      return { strokeColor: '#059669', strokeWidth: 6 };
  }
}

export function routeModeIcon(mode?: string): string {
  switch (routeModeKey(mode)) {
    case 'WALKING': return 'walk-outline';
    case 'CYCLING': return 'bicycle-outline';
    case 'BUS': return 'bus-outline';
    case 'TRAIN': return 'train-outline';
    case 'CAR': return 'car-outline';
    case 'PLANE': return 'airplane-outline';
    default: return 'navigate-outline';
  }
}

type GeometryStep = Partial<RouteStep & CarbonBreakdownLeg>;

function decodedPolylineFromStep(step: GeometryStep): MapCoordinate[] {
  if (step.polyline) {
    const decoded = decodePolyline(step.polyline);
    if (decoded.length > 1) return decoded;
  }

  return [];
}

function coordinatesFromStep(step: GeometryStep): MapCoordinate[] {
  const decoded = decodedPolylineFromStep(step);
  if (decoded.length > 1) return decoded;

  const start = toCoordinate(step.startLocation);
  const end = toCoordinate(step.endLocation);
  return start && end ? [start, end] : [];
}

function buildStepSegments(steps: GeometryStep[]): RouteMapSegment[] {
  const segments = steps
    .map((step) => ({ mode: step.mode ?? 'ROUTE', coordinates: coordinatesFromStep(step) }))
    .filter((segment) => segment.coordinates.length > 1);

  return mergeAdjacentModeSegments(segments);
}

function mergeAdjacentModeSegments(segments: RouteMapSegment[]): RouteMapSegment[] {
  return segments.reduce<RouteMapSegment[]>((merged, segment) => {
    const previous = merged[merged.length - 1];
    if (!previous || routeModeKey(previous.mode) !== routeModeKey(segment.mode)) {
      merged.push({ mode: segment.mode, coordinates: segment.coordinates });
      return merged;
    }

    const lastCoordinate = previous.coordinates[previous.coordinates.length - 1];
    const nextCoordinates = lastCoordinate
      && lastCoordinate.latitude === segment.coordinates[0]?.latitude
      && lastCoordinate.longitude === segment.coordinates[0]?.longitude
      ? segment.coordinates.slice(1)
      : segment.coordinates;

    previous.coordinates = [...previous.coordinates, ...nextCoordinates];
    return merged;
  }, []);
}

function canUseStepSegments(steps: GeometryStep[], segments: RouteMapSegment[], hasFullPolyline: boolean): boolean {
  if (steps.length === 0 || segments.length === 0) return false;

  const stepsWithDetailedPolylines = steps.filter((step) => decodedPolylineFromStep(step).length > 1).length;
  if (stepsWithDetailedPolylines === steps.length) return true;

  return !hasFullPolyline && segments.length === steps.length;
}

function logRouteGeometry(
  route: EcoRoute | RouteOption,
  steps: GeometryStep[],
  hasFullPolyline: boolean,
  fallbackUsed: 'steps' | 'route-polyline' | 'partner-stop' | 'straight-line' | 'none',
): void {
  const ecoRoute = route as EcoRoute;
  const legacyRoute = route as RouteOption;
  const stepsWithPolylines = steps.filter((step) => decodedPolylineFromStep(step).length > 1).length;
  const stepsWithCoordinates = steps.filter((step) => coordinatesFromStep(step).length > 1).length;

  console.log('[RouteGeometry]', {
    mode: ecoRoute.mode ?? legacyRoute.mode,
    hasRoutePolyline: hasFullPolyline,
    stepCount: steps.length,
    stepsWithPolylines,
    stepsWithCoordinates,
    straightLineFallbackUsed: fallbackUsed === 'straight-line',
    fallbackUsed,
  });
}

export function getRouteMapSegments(
  route?: EcoRoute | RouteOption | null,
  fallbackMode?: string,
  origin?: MapCoordinate | null,
  destination?: MapCoordinate | null,
): RouteMapSegment[] {
  if (!route) return origin && destination ? [{ mode: fallbackMode ?? 'ROUTE', coordinates: [origin, destination] }] : [];

  const ecoRoute = route as EcoRoute;
  const legacyRoute = route as RouteOption;
  const steps = legacyRoute.steps ?? [];
  const breakdown = ecoRoute.carbonBreakdown ?? [];
  const geometrySteps: GeometryStep[] = steps.length > 0 ? steps : breakdown;
  const fullPolyline = ecoRoute.geometry ?? legacyRoute.polyline ?? '';
  const fullCoordinates = fullPolyline ? decodePolyline(fullPolyline) : [];
  const hasFullPolyline = fullCoordinates.length > 1;

  const stepSegments = buildStepSegments(steps);
  if (canUseStepSegments(steps, stepSegments, hasFullPolyline)) {
    logRouteGeometry(route, geometrySteps, hasFullPolyline, 'steps');
    return stepSegments;
  }

  const breakdownSegments = buildStepSegments(breakdown);
  if (canUseStepSegments(breakdown, breakdownSegments, hasFullPolyline)) {
    logRouteGeometry(route, geometrySteps, hasFullPolyline, 'steps');
    return breakdownSegments;
  }

  if (hasFullPolyline) {
    logRouteGeometry(route, geometrySteps, hasFullPolyline, 'route-polyline');
    return [{ mode: fallbackMode ?? ecoRoute.mode ?? legacyRoute.mode ?? 'ROUTE', coordinates: fullCoordinates }];
  }

  const partnerStop = ecoRoute.partnerStop;
  if (partnerStop && origin && destination) {
    const stop = { latitude: partnerStop.pickupLat, longitude: partnerStop.pickupLng };
    logRouteGeometry(route, geometrySteps, hasFullPolyline, 'partner-stop');
    return [
      { mode: 'TRANSIT', coordinates: [origin, stop] },
      { mode: partnerStop.vehicleType ?? 'CYCLING', coordinates: [stop, destination] },
    ];
  }

  if (origin && destination) {
    logRouteGeometry(route, geometrySteps, hasFullPolyline, 'straight-line');
    return [{ mode: fallbackMode ?? ecoRoute.mode ?? legacyRoute.mode ?? 'ROUTE', coordinates: [origin, destination] }];
  }

  logRouteGeometry(route, geometrySteps, hasFullPolyline, 'none');
  return [];
}

export function flattenRouteSegments(segments: RouteMapSegment[]): MapCoordinate[] {
  return segments.flatMap((segment) => segment.coordinates);
}

export function getTransitionMarkers(segments: RouteMapSegment[]): RouteTransitionMarker[] {
  const markers: RouteTransitionMarker[] = [];
  let previousModeKey: string | null = null;

  segments.forEach((segment) => {
    const coordinate = segment.coordinates[0];
    const modeKey = routeModeKey(segment.mode);
    if (!coordinate || modeKey === previousModeKey) return;

    markers.push({ mode: segment.mode, coordinate });
    previousModeKey = modeKey;
  });

  return markers;
}
