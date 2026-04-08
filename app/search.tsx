import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { searchPlaces, GeocodeResult } from '@/lib/geocode';
import { routeStore } from '@/lib/routeStore';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const places = await searchPlaces(text);
        setResults(places);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handleSelect = (place: GeocodeResult) => {
    routeStore.setPendingDest({
      address: place.formattedAddress,
      lat: place.lat,
      lng: place.lng,
    });
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={20} color={Colors.emerald600} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.inputsSection}>
        <View style={styles.inputRow}>
          <View style={styles.dotGreen}>
            <View style={styles.dotGreenInner} />
          </View>
          <Text style={styles.locationInput}>Current location</Text>
        </View>

        <View style={styles.connector} />

        <View style={styles.inputRow}>
          <View style={styles.dotRed}>
            <Ionicons name="location-outline" size={16} color={Colors.red600} />
          </View>
          <TextInput
            style={styles.toInput}
            placeholder="Where to?"
            placeholderTextColor={Colors.gray400}
            value={query}
            onChangeText={handleChangeText}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <ScrollView style={styles.results} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.emerald600} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {!loading && results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results</Text>
            <View style={styles.listWrap}>
              {results.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.listItem}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.listIconBox, styles.listIconGreen]}>
                    <Ionicons name="location-outline" size={20} color={Colors.emerald600} />
                  </View>
                  <View style={styles.listText}>
                    <Text style={styles.listPrimary} numberOfLines={1}>{item.formattedAddress}</Text>
                    <Text style={styles.listSecondary}>
                      {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color={Colors.gray400} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!loading && query.length >= 3 && results.length === 0 && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={40} color={Colors.gray300} />
            <Text style={styles.noResultsText}>No places found for "{query}"</Text>
          </View>
        )}

        {query.length < 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tip</Text>
            <Text style={styles.tipText}>Type at least 3 characters to search for a destination.</Text>
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
  locationInput: { flex: 1, color: Colors.gray500, fontWeight: '500', fontSize: 15 },
  toInput: { flex: 1, color: '#1A1A1A', fontSize: 15, paddingVertical: 0 },
  connector: { height: 20, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: Colors.gray200, marginLeft: 15, marginVertical: 4 },

  results: { flex: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { color: Colors.gray500, fontSize: 14 },

  section: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  sectionTitle: { color: '#1A1A1A', fontWeight: '700', fontSize: 17, marginBottom: 12 },
  listWrap: { gap: 4 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderRadius: 12 },
  listIconBox: { width: 40, height: 40, backgroundColor: Colors.gray100, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  listIconGreen: { backgroundColor: Colors.emerald50 },
  listText: { flex: 1 },
  listPrimary: { color: '#1A1A1A', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  listSecondary: { color: Colors.gray500, fontSize: 12 },

  noResults: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  noResultsText: { color: Colors.gray400, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

  tipText: { color: Colors.gray500, fontSize: 14, lineHeight: 20 },
});
