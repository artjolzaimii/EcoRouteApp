import { useEffect, useState } from 'react';
import { RouteSearch, PendingPlace, TripMode, RouteMood } from './types';
import { getRouteMapSegments } from './routeMap';

// ─── Module-level singleton ───────────────────────────────────────────────────
// Shared across all screens without a React context. Survives tab navigation.

let _state: RouteSearch | null = null;
let _pendingDest: PendingPlace | null = null;
let _pendingOrigin: PendingPlace | null = null;
let _listeners: Array<() => void> = [];

function notify() {
  _listeners.forEach((fn) => fn());
}

export const routeStore = {
  // Route search state
  get: (): RouteSearch | null => _state,

  set: (data: RouteSearch) => {
    const origin = { latitude: data.originLat, longitude: data.originLng };
    const destination = { latitude: data.destLat, longitude: data.destLng };
    const routes = data.ecoResponse?.routes ?? data.routes;

    // [PERF] Time polyline decode for all routes
    const _perfT0 = Date.now();
    console.log(`[PERF][ROUTES] routeStore.set: decoding ${routes.length} route(s)`);
    routes.forEach((route) => {
      const _perfTs = Date.now();
      getRouteMapSegments(route, route.mode, origin, destination);
      console.log(`[PERF][ROUTES] routeStore.set: mode=${route.mode} decoded in ${Date.now() - _perfTs}ms`);
    });
    console.log(`[PERF][ROUTES] routeStore.set: all routes decoded in ${Date.now() - _perfT0}ms`);

    _state = data;
    notify();
  },

  setSelectedIndex: (idx: number) => {
    if (_state) {
      _state = { ..._state, selectedIndex: idx };
      notify();
    }
  },

  setPreferredMode: (mode: TripMode) => {
    if (_state) {
      _state = { ..._state, preferredMode: mode };
      notify();
    }
  },

  setMood: (mood: RouteMood | undefined) => {
    if (_state) {
      _state = { ..._state, mood };
      notify();
    }
  },

  getMood: (): RouteMood | undefined => _state?.mood,

  clear: () => {
    _state = null;
    notify();
  },

  // Pending destination — set by search screen, consumed by home
  setPendingDest: (place: PendingPlace | null) => {
    _pendingDest = place;
    notify();
  },

  consumePendingDest: (): PendingPlace | null => {
    const d = _pendingDest;
    _pendingDest = null;
    return d;
  },

  getPendingDest: (): PendingPlace | null => _pendingDest,

  // Pending origin — set by search screen when user picks a custom "From"
  setPendingOrigin: (place: PendingPlace | null) => {
    _pendingOrigin = place;
    notify();
  },

  consumePendingOrigin: (): PendingPlace | null => {
    const d = _pendingOrigin;
    _pendingOrigin = null;
    return d;
  },

  getPendingOrigin: (): PendingPlace | null => _pendingOrigin,

  subscribe: (fn: () => void): (() => void) => {
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter((l) => l !== fn);
    };
  },
};

// ─── React hook ───────────────────────────────────────────────────────────────

export function useRouteStore() {
  const [state, setState] = useState<RouteSearch | null>(_state);
  const [pendingDest, setPendingDestState] = useState<PendingPlace | null>(_pendingDest);

  useEffect(() => {
    const unsub = routeStore.subscribe(() => {
      setState(routeStore.get());
      setPendingDestState(routeStore.getPendingDest());
    });
    // Sync immediately in case state changed before effect ran
    setState(routeStore.get());
    setPendingDestState(routeStore.getPendingDest());
    return unsub;
  }, []);

  return { state, pendingDest };
}
