import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { deleteSavedRoute, getSavedRoutes } from '@/lib/api';
import { routeStore } from '@/lib/routeStore';
import { routeModeIcon } from '@/lib/routeMap';
import { usePreferences, formatDistance } from '@/lib/preferences';
import { EcoRoutesResponse, RouteMood, SavedRouteItem } from '@/lib/types';

const VALID_MOODS = new Set<string>(['RELAXED', 'HURRY', 'EXERCISE', 'CHEAPEST']);

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function modeLabelFor(item: SavedRouteItem): string {
  if (item.subType === 'CYCLING_TRANSIT') return 'Cycling + Transit';
  const m = item.mode.charAt(0) + item.mode.slice(1).toLowerCase();
  return m === 'Bicycling' ? 'Cycling' : m;
}

function reconstructStore(item: SavedRouteItem, navigate: 'navigation' | 'route-detail') {
  const ecoRoute = item.routeData;
  const fakeResponse: EcoRoutesResponse = {
    success: true,
    journeyType: 'URBAN',
    distanceKm: item.distanceKm,
    routes: [{ ...ecoRoute, recommended: true }],
    topRoute: { ...ecoRoute, recommended: true, partnerPins: [] },
    carBaseline: { co2Grams: item.carEquivalentCO2, durationMin: 0 },
    dataQuality: 'MEDIUM',
    dataQualityMessage: 'Saved route data',
  };

  routeStore.set({
    originLat: item.originLat,
    originLng: item.originLng,
    destLat: item.destLat,
    destLng: item.destLng,
    originAddress: item.originAddress,
    destAddress: item.destAddress,
    routes: [],
    selectedIndex: 0,
    preferredMode: 'CYCLING',
    mood: item.mood && VALID_MOODS.has(item.mood) ? (item.mood as RouteMood) : undefined,
    ecoResponse: fakeResponse,
  });

  router.push(navigate === 'navigation' ? '/navigation' : '/route-detail');
}

export default function SavedRoutesScreen() {
  const insets = useSafeAreaInsets();
  const { prefs } = usePreferences();
  const [routes, setRoutes] = useState<SavedRouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSavedRoutes();
      setRoutes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load saved routes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = (item: SavedRouteItem) => {
    Alert.alert(
      'Delete saved route?',
      `${item.originAddress} → ${item.destAddress}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(item.id);
            try {
              await deleteSavedRoute(item.id);
              setRoutes((prev) => prev.filter((r) => r.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not delete route. Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Routes</Text>
      </View>

      {loading ? (
        <View style={styles.centeredWrap}>
          <ActivityIndicator size="large" color={ECO_GREEN} />
        </View>
      ) : error ? (
        <View style={styles.centeredWrap}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.gray400} style={{ marginBottom: 16 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.9}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.centeredWrap}>
          <View style={styles.emptyCircle}>
            <Ionicons name="bookmark-outline" size={64} color={Colors.gray300} />
          </View>
          <Text style={styles.emptyTitle}>No saved routes yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the bookmark icon on any route detail to save it for quick access
          </Text>
          <TouchableOpacity style={styles.findBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.9}>
            <Text style={styles.findBtnText}>Find a Route</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {routes.map((item) => (
            <View key={item.id} style={styles.routeCard}>
              {/* Top row: mode label + delete */}
              <View style={styles.cardTopRow}>
                <View style={styles.modeBadge}>
                  <Ionicons
                    name={routeModeIcon(item.mode) as IoniconName}
                    size={14}
                    color={ECO_GREEN}
                  />
                  <Text style={styles.modeBadgeText}>{modeLabelFor(item)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.deleteBtn, deletingId === item.id && styles.deleteBtnDisabled]}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id
                    ? <ActivityIndicator size="small" color={Colors.red600} />
                    : <Ionicons name="trash-outline" size={18} color={Colors.red600} />
                  }
                </TouchableOpacity>
              </View>

              {/* Origin → Destination */}
              <View style={styles.locationWrap}>
                <View style={styles.locationRow}>
                  <View style={styles.locDotGreen} />
                  <Text style={styles.locationText} numberOfLines={1}>{item.originAddress}</Text>
                </View>
                <View style={styles.locationConnector} />
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.red600} />
                  <Text style={styles.locationText} numberOfLines={1}>{item.destAddress}</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="navigate-outline" size={13} color={Colors.gray500} />
                  <Text style={styles.statText}>{formatDistance(item.distanceKm, prefs.distanceUnit)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={13} color={Colors.gray500} />
                  <Text style={styles.statText}>{item.durationMin} min</Text>
                </View>
                {item.co2Grams === 0 ? (
                  <View style={styles.statItem}>
                    <Ionicons name="leaf-outline" size={13} color={ECO_GREEN} />
                    <Text style={[styles.statText, { color: ECO_GREEN, fontWeight: '600' }]}>Zero CO₂</Text>
                  </View>
                ) : (
                  <View style={styles.statItem}>
                    <Ionicons name="leaf-outline" size={13} color={Colors.gray500} />
                    <Text style={styles.statText}>{item.co2Grams}g CO₂</Text>
                  </View>
                )}
                <View style={styles.statItem}>
                  <Ionicons name="flash-outline" size={13} color={Colors.amber600} />
                  <Text style={[styles.statText, { color: Colors.amber700, fontWeight: '600' }]}>+{item.greenPoints} pts</Text>
                </View>
              </View>

              <Text style={styles.dateSaved}>Saved {formatDate(item.createdAt)}</Text>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => reconstructStore(item, 'route-detail')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={16} color={Colors.gray700} />
                  <Text style={styles.detailsBtnText}>Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => reconstructStore(item, 'navigation')}
                  activeOpacity={0.9}
                >
                  <Ionicons name="navigate-outline" size={16} color={Colors.white} />
                  <Text style={styles.startBtnText}>Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
  backBtn: {
    width: 40, height: 40, backgroundColor: Colors.white, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  headerTitle: { color: '#1A1A1A', fontSize: 24, fontWeight: '700' },

  centeredWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  errorText: { color: Colors.gray600, fontSize: 15, textAlign: 'center', marginBottom: 24 },
  retryBtn: { backgroundColor: ECO_GREEN, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  emptyCircle: {
    width: 128, height: 128, backgroundColor: Colors.white, borderRadius: 64,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24, ...Shadow.md,
  },
  emptyTitle: { color: '#1A1A1A', fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  emptySubtitle: { color: Colors.gray600, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  findBtn: { backgroundColor: ECO_GREEN, borderRadius: 20, paddingHorizontal: 32, paddingVertical: 16, ...Shadow.md },
  findBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },

  routeCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 18, ...Shadow.lg },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.emerald50, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.emerald100,
  },
  modeBadgeText: { color: ECO_GREEN, fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    width: 36, height: 36, backgroundColor: Colors.red100,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnDisabled: { opacity: 0.5 },

  locationWrap: { gap: 3, marginBottom: 14 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locDotGreen: { width: 11, height: 11, backgroundColor: ECO_GREEN, borderRadius: 6, flexShrink: 0 },
  locationConnector: { width: 1, height: 16, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: Colors.gray300, marginLeft: 4 },
  locationText: { color: Colors.gray800, fontSize: 14, flex: 1 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: Colors.gray600, fontSize: 13 },

  dateSaved: { color: Colors.gray400, fontSize: 12, marginBottom: 14 },

  actionRow: { flexDirection: 'row', gap: 10 },
  detailsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 11,
    backgroundColor: Colors.gray100, borderRadius: 14,
  },
  detailsBtnText: { color: Colors.gray700, fontWeight: '600', fontSize: 14 },
  startBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, backgroundColor: ECO_GREEN, borderRadius: 14, ...Shadow.sm,
  },
  startBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});
