import { MoodSelector } from '@/components/MoodSelector';
import { Colors, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { api, getEcoRoutes } from '@/lib/api';
import { reverseGeocode } from '@/lib/geocode';
import { homeStore, HomeTodayStats, HomeChallenge } from '@/lib/homeStore';
import { usePreferences } from '@/lib/preferences';
import { routeStore } from '@/lib/routeStore';
import { RouteMood, TripMode } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Try to get location — graceful if expo-location not installed
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

type Challenge = {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  rewardPoints: number;
  progress: number;
  completed: boolean;
};

// Default region — will be replaced by user's real location
const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function modeMatchesTripMode(modeId: TripMode, routeMode: string): boolean {
  return routeMode === modeId || (modeId === 'TRANSIT' && routeMode === 'CYCLING_TRANSIT');
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { prefs } = usePreferences();

  const [selectedMode, setSelectedMode] = useState<TripMode>('CYCLING');
  useEffect(() => {
    const first = prefs.preferredModes[0] as TripMode | undefined;
    if (first && (first === 'CYCLING' || first === 'TRANSIT' || first === 'WALKING')) {
      setSelectedMode(first);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.preferredModes.join(',')]);
  const [selectedMood, setSelectedMood] = useState<RouteMood | undefined>(undefined);
  const [originAddress, setOriginAddress] = useState('Current location');
  const [destAddress, setDestAddress] = useState('');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);

  // Active challenges preview — init from cache for instant display
  const [challenges, setChallenges] = useState<Challenge[]>(
    homeStore.get()?.challenges.filter((c) => !c.completed).slice(0, 2) ?? []
  );

  // Live stats for the header — init from cache for instant display
  const [userStats, setUserStats] = useState<HomeTodayStats | null>(homeStore.get()?.stats ?? null);

  const mapRef = useRef<MapView>(null);

  // Load current location on mount
  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const fetchHomeWidgets = useCallback(async () => {
    const [statsRes, challengesRes] = await Promise.allSettled([
      api.get<HomeTodayStats>('/api/impact/today'),
      api.get<HomeChallenge[]>('/api/challenges'),
    ]);
    const stats = statsRes.status === 'fulfilled' ? statsRes.value : (homeStore.get()?.stats ?? null);
    const allChals = challengesRes.status === 'fulfilled' && Array.isArray(challengesRes.value)
      ? challengesRes.value
      : (homeStore.get()?.challenges ?? []);
    if (statsRes.status === 'fulfilled') setUserStats(stats);
    if (challengesRes.status === 'fulfilled') setChallenges(allChals.filter((c) => !c.completed).slice(0, 2));
    homeStore.set(stats, allChals);
  }, []);

  // Load TODAY's stats and challenges — use cache to avoid re-fetching on every tab switch
  useFocusEffect(
    useCallback(() => {
      const cached = homeStore.get();
      if (cached) {
        setUserStats(cached.stats);
        setChallenges(cached.challenges.filter((c) => !c.completed).slice(0, 2));
        // Refresh in background only if stale (> 1 min)
        if (!homeStore.isFresh()) {
          fetchHomeWidgets();
        }
      } else {
        fetchHomeWidgets();
      }
    }, [fetchHomeWidgets]),
  );

  // Consume pending origin / destination from the search screen on focus
  useFocusEffect(
    useCallback(() => {
      const pendingOrigin = routeStore.consumePendingOrigin();
      if (pendingOrigin) {
        setOriginAddress(pendingOrigin.address);
        setOriginCoords({ lat: pendingOrigin.lat, lng: pendingOrigin.lng });
        const region = { latitude: pendingOrigin.lat, longitude: pendingOrigin.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 };
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 600);
      }

      const pendingDest = routeStore.consumePendingDest();
      if (pendingDest) {
        setDestAddress(pendingDest.address);
        setDestCoords({ lat: pendingDest.lat, lng: pendingDest.lng });

        // Fit map to show both origin and destination
        const oCoords = pendingOrigin ?? originCoords;
        if (oCoords) {
          const midLat = (oCoords.lat + pendingDest.lat) / 2;
          const midLng = (oCoords.lng + pendingDest.lng) / 2;
          const latDelta = Math.abs(oCoords.lat - pendingDest.lat) * 1.6 + 0.01;
          const lngDelta = Math.abs(oCoords.lng - pendingDest.lng) * 1.6 + 0.01;
          const newRegion = { latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
          setMapRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 600);
        }
      }
    }, [originCoords]),
  );

  const loadCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const loc = await tryGetCurrentLocation();
      if (loc) {
        setOriginCoords(loc);
        const address = await reverseGeocode(loc.lat, loc.lng);
        setOriginAddress(address);
        const region = { latitude: loc.lat, longitude: loc.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 };
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 600);

      }
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleFindRoute = async () => {
    if (!destCoords || !destAddress.trim()) {
      Alert.alert('Destination required', 'Please choose a destination first.');
      return;
    }

    const oLat = originCoords?.lat ?? DEFAULT_REGION.latitude;
    const oLng = originCoords?.lng ?? DEFAULT_REGION.longitude;

    // [PERF] T0 — button tap registered
    const _perfT0 = Date.now();
    console.log('[PERF][ROUTES] tap → handleFindRoute start');

    setLoadingRoutes(true);
    try {
      const _perfT1 = Date.now();
      console.log('[PERF][ROUTES] API request starting');
      const ecoResponse = await getEcoRoutes(
        { lat: oLat, lng: oLng, name: originAddress },
        { lat: destCoords.lat, lng: destCoords.lng, name: destAddress },
        selectedMood,
      );
      const _perfT2 = Date.now();
      console.log(`[PERF][ROUTES] API response received | duration=${_perfT2 - _perfT1}ms | routes=${ecoResponse.routes?.length ?? 0} | total-from-tap=${_perfT2 - _perfT0}ms`);

      if (!ecoResponse.routes || ecoResponse.routes.length === 0) {
        Alert.alert('No routes found', 'No eco-routes are available for this journey. Try a different destination.');
        return;
      }

      // Find best index — prefer selected mode, then recommended
      let bestIndex = 0;
      const modeMatchIdx = ecoResponse.routes.findIndex((r: any) =>
        modeMatchesTripMode(selectedMode, r.mode)
      );
      if (modeMatchIdx !== -1) bestIndex = modeMatchIdx;
      else {
        const recIdx = ecoResponse.routes.findIndex((r: any) => r.recommended);
        if (recIdx !== -1) bestIndex = recIdx;
      }

      const _perfT3 = Date.now();
      console.log('[PERF][ROUTES] routeStore.set() starting');
      routeStore.set({
        originLat: oLat,
        originLng: oLng,
        destLat: destCoords.lat,
        destLng: destCoords.lng,
        originAddress,
        destAddress,
        routes: [] as any, // ecoResponse.routes stored in ecoResponse field
        selectedIndex: bestIndex,
        preferredMode: selectedMode,
        mood: selectedMood,
        ecoResponse,
      });
      const _perfT4 = Date.now();
      console.log(`[PERF][ROUTES] routeStore.set() done | duration=${_perfT4 - _perfT3}ms | total-from-tap=${_perfT4 - _perfT0}ms`);


      // If autoStartNavigation is enabled, go straight to navigation; otherwise show route options
        if (prefs.autoStartNavigation) {
          router.navigate('/navigation' as any);
        } else {
          console.log('[PERF][ROUTES] navigating to RoutesScreen');
          router.navigate('/(tabs)/routes');
        }

    } catch (err: any) {
      Alert.alert('Could not get routes', err.message ?? 'Check your connection and try again.');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const co2Kg = userStats ? (userStats.totalCo2SavedG / 1000).toFixed(1) + ' kg' : '—';
  const headerStats = [
    { icon: 'leaf-outline' as const, value: co2Kg, label: 'CO₂ Saved' },
    { icon: 'navigate-outline' as const, value: userStats ? String(userStats.totalTrips) : '—', label: 'Trips' },
    { icon: 'flash-outline' as const, value: userStats ? String(userStats.totalPoints) : '—', label: 'Points' },
  ];

  const displayName = session?.user?.email?.split('@')[0] ?? 'there';

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <LinearGradient
          colors={[Colors.emerald600, Colors.emerald700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <Text style={styles.headerGreeting}>Good morning, {displayName}</Text>
          <Text style={styles.headerTitle}>Ready to make a difference?</Text>

          <View style={styles.impactCard}>
            <View style={styles.impactCardTop}>
              <Text style={styles.impactLabel}>Today's Impact</Text>
              <TouchableOpacity onPress={() => router.navigate('/(tabs)/impact')} activeOpacity={0.8}>
                <View style={styles.trendBadge}>
                  <Ionicons name="leaf-outline" size={12} color={Colors.white} />
                  <Text style={styles.trendText}>View all</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
              {headerStats.map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Ionicons name={s.icon} size={20} color={Colors.white} />
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* ── Community Heatmap Banner ── */}
        <View style={styles.sectionOffset}>
          <TouchableOpacity
            style={styles.heatmapBanner}
            onPress={() => router.push('/heatmap')}
            activeOpacity={0.88}
          >
            <View style={styles.heatmapBannerLeft}>
              <Text style={styles.heatmapBannerTitle}>We're making change together</Text>
              <Text style={styles.heatmapBannerSub}>See where the community eco-routes most</Text>
            </View>
            <View style={styles.heatmapBannerIcon}>
              <Ionicons name="earth-outline" size={28} color={Colors.emerald600} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Mood Selector ── */}
        <View style={styles.section}>
          <View style={[styles.card, styles.moodCardPad]}>
            <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />
          </View>
        </View>

        {/* ── Map + Route Inputs ── */}
        <View style={styles.section}>
          <View style={[styles.card, styles.mapCardOuter]}>

            {/* Mini Map — fully interactive */}
            <View style={styles.miniMap}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                region={mapRegion}
                onRegionChangeComplete={(r) => setMapRegion(r)}
                scrollEnabled={true}
                zoomEnabled={true}
                rotateEnabled={false}
                pitchEnabled={false}
                toolbarEnabled={false}
                showsUserLocation={true}
                showsMyLocationButton={false}
              >
                {originCoords && (
                  <Marker
                    coordinate={{ latitude: originCoords.lat, longitude: originCoords.lng }}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={styles.originDot}>
                      <View style={styles.originDotInner} />
                    </View>
                  </Marker>
                )}
                {destCoords && (
                  <Marker
                    coordinate={{ latitude: destCoords.lat, longitude: destCoords.lng }}
                    pinColor={Colors.red600}
                    title={destAddress}
                  />
                )}
              </MapView>

              {loadingLocation && (
                <View style={styles.mapOverlayLoader}>
                  <ActivityIndicator color={Colors.emerald600} />
                </View>
              )}
            </View>

            {/* Route Inputs */}
            <View style={styles.inputsWrap}>
              {/* From */}
              <TouchableOpacity style={styles.inputRow} onPress={() => router.push('/search?field=origin')} activeOpacity={0.8}>
                <View style={styles.inputDotGreen}>
                  <View style={styles.inputDotGreenInner} />
                </View>
                <View style={styles.inputTextWrap}>
                  <Text style={[styles.routeInputText, !originAddress && styles.routeInputPlaceholder]} numberOfLines={1}>
                    {loadingLocation ? 'Getting location…' : (originAddress || 'Current location')}
                  </Text>
                </View>
                {loadingLocation
                  ? <ActivityIndicator size="small" color={Colors.emerald600} style={{ marginLeft: 8 }} />
                  : (
                    <TouchableOpacity onPress={loadCurrentLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="navigate-outline" size={18} color={Colors.emerald600} />
                    </TouchableOpacity>
                  )
                }
              </TouchableOpacity>

              <View style={styles.inputDivider} />

              {/* To */}
              <TouchableOpacity
                style={styles.inputRow}
                onPress={() => router.push('/search')}
                activeOpacity={0.8}
              >
                <View style={styles.inputDotRed}>
                  <Ionicons name="location-outline" size={14} color={Colors.red600} />
                </View>
                <View style={styles.inputTextWrap}>
                  <Text
                    style={[styles.routeInputText, !destAddress && styles.routeInputPlaceholder]}
                    numberOfLines={1}
                  >
                    {destAddress || 'Where to?'}
                  </Text>
                </View>
                {destAddress ? (
                  <TouchableOpacity onPress={() => { setDestAddress(''); setDestCoords(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle-outline" size={18} color={Colors.gray400} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-forward-outline" size={16} color={Colors.gray400} />
                )}
              </TouchableOpacity>
            </View>

            {/* Find Button */}
            <TouchableOpacity
              style={[styles.findBtn, (loadingRoutes || !destCoords) && styles.findBtnDisabled]}
              activeOpacity={0.9}
              onPress={handleFindRoute}
              disabled={loadingRoutes || !destCoords}
            >
              {loadingRoutes ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="navigate-outline" size={20} color={Colors.white} />
                  <Text style={styles.findBtnText}>Find Eco-Route</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Active Challenges ── */}
        {challenges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Active Challenges</Text>
              <TouchableOpacity onPress={() => router.navigate('/(tabs)/rewards')} activeOpacity={0.8}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.card, { padding: 16, gap: 12 }]}>
              {challenges.map((c) => {
                const pct = Math.min((c.progress / c.targetValue) * 100, 100);
                return (
                  <View key={c.id} style={styles.challengeRow}>
                    <View style={styles.challengeRowTop}>
                      <Text style={styles.challengeName}>{c.title}</Text>
                      <Text style={styles.challengePts}>+{c.rewardPoints} pts</Text>
                    </View>
                    <View style={styles.challengeTrack}>
                      <View style={[styles.challengeFill, { width: `${pct}%` as any }]} />
                    </View>
                    <Text style={styles.challengeDesc}>{c.description}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  // Header
  header: { paddingHorizontal: 24, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerGreeting: { color: Colors.emeraldText100, fontSize: 13, marginBottom: 4 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700', marginBottom: 20 },
  impactCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  impactCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  impactLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trendText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { color: Colors.white, fontWeight: '700', fontSize: 17 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },

  // Sections
  sectionOffset: { paddingHorizontal: 24, marginTop: -16 },
  section: { paddingHorizontal: 24, marginTop: 24 },
  card: { backgroundColor: Colors.white, borderRadius: 16, ...Shadow.lg },

  // Mood card
  moodCardPad: { padding: 16, paddingBottom: 12 },

  // Map card
  mapCardOuter: { borderRadius: 16, overflow: 'hidden' },
  miniMap: { height: 220, position: 'relative' },
  originDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(5,150,105,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originDotInner: { width: 12, height: 12, backgroundColor: Colors.emerald600, borderRadius: 6 },
  mapOverlayLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Inputs
  inputsWrap: { padding: 16, gap: 0 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  inputDotGreen: { width: 32, height: 32, backgroundColor: Colors.emerald100, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  inputDotGreenInner: { width: 12, height: 12, backgroundColor: Colors.emerald600, borderRadius: 6 },
  inputDotRed: { width: 32, height: 32, backgroundColor: Colors.red100, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  inputTextWrap: { flex: 1 },
  routeInputText: { color: Colors.gray900, fontSize: 14, fontWeight: '500' },
  routeInputPlaceholder: { color: Colors.gray400, fontWeight: '400' },
  inputDivider: { height: 20, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: Colors.gray200, marginLeft: 15 },

  findBtn: {
    backgroundColor: Colors.emerald600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    minHeight: 50,
  },
  findBtnDisabled: { opacity: 0.55 },
  findBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },

  // Challenges
  seeAllText: { color: Colors.emerald600, fontWeight: '600', fontSize: 13 },
  challengeRow: { gap: 6 },
  challengeRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  challengeName: { color: Colors.gray900, fontWeight: '600', fontSize: 13 },
  challengePts: { color: Colors.emerald600, fontWeight: '700', fontSize: 12 },
  challengeTrack: { height: 6, backgroundColor: Colors.gray100, borderRadius: 3, overflow: 'hidden' },
  challengeFill: { height: '100%', backgroundColor: Colors.emerald600, borderRadius: 3 },
  challengeDesc: { color: Colors.gray500, fontSize: 11 },

  // Challenges header row / section titles
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 17 },

  heatmapBanner: {
    backgroundColor: Colors.emerald50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.emerald100,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.sm,
  },
  heatmapBannerLeft: { flex: 1, marginRight: 12 },
  heatmapBannerTitle: { fontSize: 15, fontWeight: '700', color: Colors.emerald900, marginBottom: 4 },
  heatmapBannerSub: { fontSize: 13, color: Colors.emerald700 },
  heatmapBannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
