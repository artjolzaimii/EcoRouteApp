import { useEffect, useState } from 'react';
import { RouteSearch, PendingPlace, TripMode } from './types';

// ─── Module-level singleton ───────────────────────────────────────────────────
// Shared across all screens without a React context. Survives tab navigation.

let _state: RouteSearch | null = null;
let _pendingDest: PendingPlace | null = null;
let _listeners: Array<() => void> = [];

function notify() {
  _listeners.forEach((fn) => fn());
}

export const routeStore = {
  // Route search state
  get: (): RouteSearch | null => _state,

  set: (data: RouteSearch) => {
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

  clear: () => {
    _state = null;
    notify();
  },

  // Pending destination — set by search screen, consumed by home/routes
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
