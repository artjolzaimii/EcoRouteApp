import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREFS_STORAGE_KEY = 'ecoroute_preferences';

export type DistanceUnit = 'km' | 'miles';
export type PreferredMode = 'WALKING' | 'CYCLING' | 'TRANSIT' | 'EV';

export type Preferences = {
  distanceUnit: DistanceUnit;
  preferredModes: PreferredMode[];
  showCo2OnMap: boolean;
  autoStartNavigation: boolean;
  weeklyGoalKg: number;
  reducedAnimations: boolean;
};

export const DEFAULT_PREFS: Preferences = {
  distanceUnit: 'km',
  preferredModes: ['CYCLING', 'TRANSIT'],
  showCo2OnMap: true,
  autoStartNavigation: false,
  weeklyGoalKg: 5,
  reducedAnimations: false,
};

export async function getPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  if (unit === 'miles') {
    const miles = km * 0.621371;
    return `${miles.toFixed(1)} mi`;
  }
  return `${km.toFixed(1)} km`;
}

export function usePreferences(): { prefs: Preferences; loaded: boolean } {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPreferences().then((p) => {
      setPrefs(p);
      setLoaded(true);
    });
  }, []);

  return { prefs, loaded };
}
