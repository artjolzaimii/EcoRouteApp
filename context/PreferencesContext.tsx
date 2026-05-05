/**
 * PreferencesContext
 * Persists user preferences to AsyncStorage and exposes them app-wide.
 *
 * Preferences stored:
 *  - unit: 'km' | 'miles'
 *  - defaultMode: 'walk' | 'bike' | 'bus' | 'train'
 *  - appearance: 'system' | 'light' | 'dark'
 *  - photoUri: string | null
 *  - fullName: string | null
 *  - notificationsEnabled: boolean
 *
 * Helper exposed:
 *  - formatDistance(km: number) → "3.2 km" or "2.0 mi"
 *  - formatCO2(grams: number)  → "1.4 kg CO₂" (always kg — makes sense both ways)
 *  - toggleNotifications() → Handles real permissions via expo-notifications
 */

import { AppTheme, Theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, useColorScheme } from 'react-native';

const STORAGE_KEY = '@eco_preferences';

export type Unit = 'km' | 'miles';
export type TransportMode = 'walk' | 'bike' | 'bus' | 'train';
export type Appearance = 'system' | 'light' | 'dark';

export type Preferences = {
    unit: Unit;
    defaultMode: TransportMode;
    appearance: Appearance;
    photoUri: string | null;
    fullName: string | null;
    notificationsEnabled: boolean;
};

export type PreferencesContextType = {
    prefs: Preferences;
    setPrefs: (p: Partial<Preferences>) => void;
    /** Format a km distance value according to current unit setting */
    formatDistance: (km: number) => string;
    /** Format grams of CO₂ (always returns kg) */
    formatCO2: (g: number) => string;
    /** Toggle real system-level notification permissions */
    toggleNotifications: () => Promise<void>;
    loaded: boolean;
    theme: AppTheme;
};

const DEFAULTS: Preferences = {
    unit: 'km',
    defaultMode: 'bike',
    appearance: 'system',
    photoUri: null,
    fullName: null,
    notificationsEnabled: false,
};

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const [prefs, setPrefsState] = useState<Preferences>(DEFAULTS);
    const [loaded, setLoaded] = useState(false);
    const systemColorScheme = useColorScheme();

    // Load from AsyncStorage on mount
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((raw) => {
                if (raw) {
                    const saved: Partial<Preferences> = JSON.parse(raw);
                    setPrefsState((prev) => ({ ...prev, ...saved }));
                }
            })
            .catch(() => {/* ignore — use defaults */ })
            .finally(() => setLoaded(true));
    }, []);

    const setPrefs = useCallback((partial: Partial<Preferences>) => {
        setPrefsState((prev) => {
            const next = { ...prev, ...partial };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => { });
            return next;
        });
    }, []);

    const formatDistance = useCallback(
        (km: number) => {
            if (prefs.unit === 'miles') {
                return `${(km * 0.621371).toFixed(1)} mi`;
            }
            return `${km.toFixed(1)} km`;
        },
        [prefs.unit],
    );

    const formatCO2 = useCallback((g: number) => `${(g / 1000).toFixed(1)} kg CO₂`, []);

    const toggleNotifications = useCallback(async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus === 'denied') {
            Alert.alert(
                'Notifications Disabled',
                'Please enable notifications in your system settings to receive eco-alerts.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings() }
                ]
            );
            return;
        }

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus === 'granted') {
            setPrefs({ notificationsEnabled: !prefs.notificationsEnabled });
        } else {
            Alert.alert('Permission Required', 'We need your permission to send you eco-updates and rewards.');
        }
    }, [prefs.notificationsEnabled, setPrefs]);

    const theme = useMemo((): AppTheme => {
        let mode = prefs.appearance;
        if (mode === 'system') {
            mode = systemColorScheme === 'dark' ? 'dark' : 'light';
        }
        return Theme[mode as 'light' | 'dark'];
    }, [prefs.appearance, systemColorScheme]);

    return (
        <PreferencesContext.Provider value={{ prefs, setPrefs, formatDistance, formatCO2, toggleNotifications, loaded, theme }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences(): PreferencesContextType {
    const ctx = useContext(PreferencesContext);
    if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
    return ctx;
}
