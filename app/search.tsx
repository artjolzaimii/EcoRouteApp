import { Colors } from '@/constants/theme';
import { usePreferences } from '@/context/PreferencesContext';
import { PlacePrediction, resolvePlaceId, searchPlacesAutocomplete } from '@/lib/geocode';
import { routeStore } from '@/lib/routeStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

async function tryGetCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { theme, prefs } = usePreferences();
  const params = useLocalSearchParams<{ field?: string }>();

  // 'origin' = searching for the From location; 'dest' (default) = searching for To
  const field = params.field === 'origin' ? 'origin' : 'dest';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const locationBiasRef = useRef<{ lat: number; lng: number } | undefined>(undefined);

  // Static label for the non-active field
  const state = routeStore.get();
  const staticOriginLabel = state?.originAddress ?? 'Current location';
  const staticDestLabel = state?.destAddress ?? 'Where to?';

  useEffect(() => {
    // Grab current location for autocomplete bias (non-blocking)
    (async () => {
      try {
        const Location = require('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          locationBiasRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
      } catch { /* ignore — bias is optional */ }
    })();
    // Small delay so the screen transition finishes before focus
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const places = await searchPlacesAutocomplete(text, locationBiasRef.current);
        setResults(places);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  const handleSelect = async (prediction: PlacePrediction) => {
    setSelectingId(prediction.placeId);
    try {
      let lat: number;
      let lng: number;
      let formattedAddress: string;

      if (prediction.lat !== undefined && prediction.lng !== undefined) {
        // Geocoding path — lat/lng already available, no extra call needed
        lat = prediction.lat;
        lng = prediction.lng;
        formattedAddress = prediction.formattedAddress;
      } else {
        // Autocomplete path — resolve place_id to coordinates
        const resolved = await resolvePlaceId(prediction.placeId, prediction.formattedAddress);
        if (!resolved) {
          Alert.alert('Could not resolve location', 'Please try a different result.');
          return;
        }
        lat = resolved.lat;
        lng = resolved.lng;
        formattedAddress = resolved.formattedAddress;
      }

      // Build a clean display label
      const displayAddress = prediction.secondaryText
        ? `${prediction.mainText}, ${prediction.secondaryText}`
        : formattedAddress;

      if (field === 'origin') {
        routeStore.setPendingOrigin({ address: displayAddress, lat, lng });
      } else {
        routeStore.setPendingDest({ address: displayAddress, lat, lng });
      }
      router.back();
    } finally {
      setSelectingId(null);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocLoading(true);
    try {
      const loc = await tryGetCurrentLocation();
      if (!loc) return;
      const { reverseGeocode } = await import('@/lib/geocode');
      const address = await reverseGeocode(loc.lat, loc.lng);
      routeStore.setPendingOrigin({ address, lat: loc.lat, lng: loc.lng });
      router.back();
    } finally {
      setLocLoading(false);
    }
  };

  const isOriginField = field === 'origin';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <StatusBar style={prefs.appearance === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.gray100 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={20} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Search Inputs */}
      <View style={[styles.inputsSection, { borderBottomColor: theme.gray100 }]}>

        {/* From row */}
        <View style={styles.inputRow}>
          <View style={[styles.dotGreen, { backgroundColor: theme.primary + '20' }]}>
            <View style={[styles.dotGreenInner, { backgroundColor: theme.primary }]} />
          </View>
          {isOriginField ? (
            <TextInput
              ref={inputRef}
              style={[styles.activeInput, { color: theme.text }]}
              placeholder="From where?"
              placeholderTextColor={theme.gray400}
              value={query}
              onChangeText={handleChangeText}
              returnKeyType="search"
            />
          ) : (
            <Text style={[styles.staticLabel, { color: theme.textSecondary }]} numberOfLines={1}>{staticOriginLabel}</Text>
          )}
          {isOriginField && query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={theme.gray400} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.connector, { borderColor: theme.gray200 }]} />

        {/* To row */}
        <View style={styles.inputRow}>
          <View style={[styles.dotRed, { backgroundColor: theme.red100 }]}>
            <Ionicons name="location-outline" size={16} color={theme.red600} />
          </View>
          {!isOriginField ? (
            <TextInput
              ref={inputRef}
              style={[styles.activeInput, { color: theme.text }]}
              placeholder="Where to?"
              placeholderTextColor={theme.gray400}
              value={query}
              onChangeText={handleChangeText}
              returnKeyType="search"
            />
          ) : (
            <Text style={[styles.staticLabel, { color: theme.textSecondary }]} numberOfLines={1}>{staticDestLabel}</Text>
          )}
          {!isOriginField && query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={theme.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <ScrollView style={styles.results} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* "Use current location" shortcut — only when searching for origin */}
        {isOriginField && (
          <TouchableOpacity
            style={[styles.currentLocRow, { borderBottomColor: theme.gray100 }]}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.7}
            disabled={locLoading}
          >
            <View style={[styles.listIconBox, { backgroundColor: theme.primary + '15' }]}>
              {locLoading
                ? <ActivityIndicator size="small" color={theme.primary} />
                : <Ionicons name="navigate-outline" size={20} color={theme.primary} />
              }
            </View>
            <View style={styles.listText}>
              <Text style={[styles.listPrimary, { color: theme.text }]}>Use current location</Text>
              <Text style={[styles.listSecondary, { color: theme.textSecondary }]}>GPS — your exact position</Text>
            </View>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Searching...</Text>
          </View>
        )}

        {!loading && results.length > 0 && (
          <View style={[styles.section, { borderBottomColor: theme.gray100 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Results</Text>
            <View style={styles.listWrap}>
              {results.map((item) => {
                const isResolving = selectingId === item.placeId;
                return (
                  <TouchableOpacity
                    key={item.placeId}
                    style={styles.listItem}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                    disabled={selectingId !== null}
                  >
                    <View style={[styles.listIconBox, { backgroundColor: theme.primary + '15' }]}>
                      {isResolving
                        ? <ActivityIndicator size="small" color={theme.primary} />
                        : <Ionicons name="location-outline" size={20} color={theme.primary} />
                      }
                    </View>
                    <View style={styles.listText}>
                      <Text style={[styles.listPrimary, { color: theme.text }]} numberOfLines={1}>{item.mainText}</Text>
                      {item.secondaryText ? (
                        <Text style={[styles.listSecondary, { color: theme.textSecondary }]} numberOfLines={1}>{item.secondaryText}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward-outline" size={16} color={theme.gray400} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={40} color={theme.gray300} />
            <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>No places found for "{query}"</Text>
          </View>
        )}

        {query.trim().length < 2 && (
          <View style={[styles.section, { borderBottomColor: theme.gray100 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tip</Text>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              {isOriginField
                ? 'Type an address or use your current GPS location above.'
                : 'Start typing to search for a destination.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { color: Colors.emerald600, fontWeight: '600', fontSize: 16 },

  inputsSection: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dotGreen: { width: 32, height: 32, backgroundColor: Colors.emerald100, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dotGreenInner: { width: 12, height: 12, backgroundColor: Colors.emerald600, borderRadius: 6 },
  dotRed: { width: 32, height: 32, backgroundColor: Colors.red100, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activeInput: { flex: 1, color: '#1A1A1A', fontSize: 15, paddingVertical: 0 },
  staticLabel: { flex: 1, color: Colors.gray500, fontWeight: '500', fontSize: 15 },
  connector: { height: 20, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: Colors.gray200, marginLeft: 15, marginVertical: 4 },

  results: { flex: 1 },
  currentLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { color: Colors.gray500, fontSize: 14 },

  section: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  sectionTitle: { color: '#1A1A1A', fontWeight: '700', fontSize: 17, marginBottom: 12 },
  listWrap: { gap: 4 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderRadius: 12 },
  listIconBox: { width: 40, height: 40, backgroundColor: Colors.gray100, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  listIconGreen: { backgroundColor: Colors.emerald50 },
  listIconBlue: { backgroundColor: Colors.emerald50 },
  listText: { flex: 1 },
  listPrimary: { color: '#1A1A1A', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  listSecondary: { color: Colors.gray500, fontSize: 12 },

  noResults: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  noResultsText: { color: Colors.gray400, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

  tipText: { color: Colors.gray500, fontSize: 14, lineHeight: 20 },
});
