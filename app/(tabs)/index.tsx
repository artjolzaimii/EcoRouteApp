import { MoodSelector } from '@/components/MoodSelector';
import { BrandLogo } from '@/components/BrandLogo';
import { Colors, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { api, getEcoRoutes } from '@/lib/api';
import { reverseGeocode } from '@/lib/geocode';
import { HomeChallenge, homeStore, HomeTodayStats } from '@/lib/homeStore';
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

type ProfileData = {
  fullName?: string;
  email?: string;
};

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

  const [profile, setProfile] = useState<ProfileData | null>(null);
  useEffect(() => {
    api.get<ProfileData>('/api/user/profile')
      .then((data) => setProfile(data))
      .catch(() => {});
  }, []);

  const [challenges, setChallenges] = useState<Challenge[]>(
    homeStore.get()?.challenges.filter((c) => !c.completed).slice(0, 2) ?? []
  );
  const [userStats, setUserStats] = useState<HomeTodayStats | null>(homeStore.get()?.stats ?? null);

  const mapRef = useRef<MapView>(null);

  useEffect(() => { loadCurrentLocation(); }, []);

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

  useFocusEffect(
    useCallback(() => {
      const cached = homeStore.get();
      if (cached) {
        setUserStats(cached.stats);
        setChallenges(cached.challenges.filter((c) => !c.completed).slice(0, 2));
        if (!homeStore.isFresh()) fetchHomeWidgets();
      } else {
        fetchHomeWidgets();
      }
    }, [fetchHomeWidgets]),
  );

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
    const _t0 = Date.now();
    console.log('[PERF][ROUTES] tap → handleFindRoute start');
    setLoadingRoutes(true);
    try {
      console.log('[PERF][ROUTES] API request starting');
      const ecoResponse = await getEcoRoutes(
        { lat: oLat, lng: oLng, name: originAddress },
        { lat: destCoords.lat, lng: destCoords.lng, name: destAddress },
        selectedMood,
      );
      console.log(`[PERF][ROUTES] response | routes=${ecoResponse.routes?.length ?? 0} | ms=${Date.now() - _t0}`);
      if (!ecoResponse.routes || ecoResponse.routes.length === 0) {
        Alert.alert('No routes found', 'No eco-routes are available for this journey. Try a different destination.');
        return;
      }
      let bestIndex = 0;
      const modeMatchIdx = ecoResponse.routes.findIndex((r: any) => modeMatchesTripMode(selectedMode, r.mode));
      if (modeMatchIdx !== -1) bestIndex = modeMatchIdx;
      else {
        const recIdx = ecoResponse.routes.findIndex((r: any) => r.recommended);
        if (recIdx !== -1) bestIndex = recIdx;
      }
      routeStore.set({
        originLat: oLat, originLng: oLng,
        destLat: destCoords.lat, destLng: destCoords.lng,
        originAddress, destAddress,
        routes: [] as any,
        selectedIndex: bestIndex,
        preferredMode: selectedMode,
        mood: selectedMood,
        ecoResponse,
      });
      console.log(`[PERF][ROUTES] done | total ms=${Date.now() - _t0}`);
      if (prefs.autoStartNavigation) {
        router.navigate('/navigation' as any);
      } else {
        router.navigate('/(tabs)/routes');
      }
    } catch (err: any) {
      Alert.alert('Could not get routes', err.message ?? 'Check your connection and try again.');
    } finally {
      setLoadingRoutes(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────
  const co2Kg = userStats ? (userStats.totalCo2SavedG / 1000).toFixed(1) + ' kg' : '—';
  const headerStats = [
    { icon: 'leaf-outline' as const,     value: co2Kg,                                        label: 'CO₂ Saved' },
    { icon: 'navigate-outline' as const, value: userStats ? String(userStats.totalTrips) : '—', label: 'Trips'     },
    { icon: 'flash-outline' as const,    value: userStats ? String(userStats.totalPoints) : '—', label: 'Points'   },
  ];

  const displayName =
    profile?.fullName?.trim() ||
    (session?.user?.user_metadata?.full_name as string | undefined) ||
    session?.user?.email?.split('@')[0] ||
    'there';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      {/* ════════════════════════════════════════════════════════════
          HEADER — deep premium green gradient
      ════════════════════════════════════════════════════════════ */}
      <LinearGradient
        colors={[Colors.emerald900, Colors.emerald800, Colors.emerald600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        {/* ── Decorative leaf shapes (purely visual, no interaction) ── */}
        <View style={styles.leafDecor1} pointerEvents="none">
          <Ionicons name="leaf" size={120} color="rgba(255,255,255,0.06)" />
        </View>
        <View style={styles.leafDecor2} pointerEvents="none">
          <Ionicons name="leaf" size={80} color="rgba(255,255,255,0.05)" />
        </View>
        <View style={styles.leafDecor3} pointerEvents="none">
          <Ionicons name="leaf" size={60} color="rgba(255,255,255,0.04)" />
        </View>

        {/* ── Top bar: logo + name left ── */}
        <View style={styles.topBar}>
          <View style={styles.logoBadge}>
            <BrandLogo size={18} style={{ borderRadius: 4 }} />
            <Text style={styles.logoText}>EcoRoute</Text>
          </View>
        </View>

        {/* ── Greeting ── */}
        <Text style={styles.greetingRow} numberOfLines={1} adjustsFontSizeToFit>
          <Text style={styles.greetingLine}>{greeting}, </Text>
          <Text style={styles.greetingName}>{displayName}</Text>
        </Text>
        <View style={styles.greetingTaglinePill}>
          <Ionicons name="leaf" size={11} color={Colors.emerald200} />
          <Text style={styles.greetingTagline}>Ready to make a difference?</Text>
        </View>

        {/* ── Today's Impact — glassy card ── */}
        <View style={styles.impactCard}>
          <View style={styles.impactCardHeader}>
            <Text style={styles.impactCardTitle}>Today's Impact</Text>
            <TouchableOpacity
              style={styles.viewAllPill}
              onPress={() => router.navigate('/(tabs)/impact')}
              activeOpacity={0.8}
            >
              <Ionicons name="leaf-outline" size={10} color={Colors.white} />
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.impactStatsRow}>
            {headerStats.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.impactDivider} />}
                <View style={styles.impactStatCell}>
                  <View style={styles.impactIconWrap}>
                    <Ionicons name={s.icon} size={13} color={Colors.white} />
                  </View>
                  <Text style={styles.impactStatValue}>{s.value}</Text>
                  <Text style={styles.impactStatLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* ════════════════════════════════════════════════════════════
          MAP CARD — overlaps header, main visual focus
      ════════════════════════════════════════════════════════════ */}
      <View style={styles.mapSection}>
        <View style={styles.mapCard}>

          {/* ── Search pill (destination) ── */}
          <TouchableOpacity
            style={styles.searchPill}
            onPress={() => router.push('/search')}
            activeOpacity={0.85}
          >
            <View style={styles.searchPillIcon}>
              <Ionicons name="search-outline" size={15} color={Colors.emerald700} />
            </View>
            <Text
              style={[styles.searchPillText, !destAddress && styles.searchPillPlaceholder]}
              numberOfLines={1}
            >
              {destAddress || 'Where to next?'}
            </Text>
            {destAddress ? (
              <TouchableOpacity
                onPress={() => { setDestAddress(''); setDestCoords(null); }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color={Colors.gray400} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-forward" size={14} color={Colors.emerald600} />
            )}
          </TouchableOpacity>

          {/* ── Origin row ── */}
          <TouchableOpacity
            style={styles.originRow}
            onPress={() => router.push('/search?field=origin')}
            activeOpacity={0.8}
          >
            <View style={styles.originDotOuter}>
              <View style={styles.originDotInnerSmall} />
            </View>
            <Text style={[styles.originText, !originAddress && styles.originPlaceholder]} numberOfLines={1}>
              {loadingLocation ? 'Getting location…' : (originAddress || 'Current location')}
            </Text>
            {loadingLocation
              ? <ActivityIndicator size="small" color={Colors.emerald600} style={{ marginLeft: 6 }} />
              : (
                <TouchableOpacity onPress={loadCurrentLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="navigate-outline" size={15} color={Colors.emerald600} />
                </TouchableOpacity>
              )
            }
          </TouchableOpacity>

          {/* ── Map tile ── */}
          <View style={styles.mapTile}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              region={mapRegion}
              onRegionChangeComplete={(r) => setMapRegion(r)}
              scrollEnabled
              zoomEnabled
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
              showsUserLocation
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
              <View style={styles.mapLoader}>
                <ActivityIndicator color={Colors.emerald600} size="small" />
              </View>
            )}

          </View>

          {/* ── Plan Route CTA ── */}
          <TouchableOpacity
            style={[styles.planBtn, (loadingRoutes || !destCoords) && styles.planBtnDisabled]}
            activeOpacity={0.9}
            onPress={handleFindRoute}
            disabled={loadingRoutes || !destCoords}
          >
            {loadingRoutes ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.planBtnText}>Find Eco Route</Text>
                <View style={styles.planBtnArrow}>
                  <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ════════════════════════════════════════════════════════════
          MOOD CARD
      ════════════════════════════════════════════════════════════ */}
      <View style={styles.section}>
        <View style={styles.moodCard}>
          <Text style={styles.moodCardTitle}>How are you feeling today?</Text>
          <Text style={styles.moodCardSub}>Your mood helps us suggest the best eco-route for you.</Text>
          <MoodSelector selected={selectedMood} onSelect={setSelectedMood} showHeader={false} />
        </View>
      </View>

      {/* ════════════════════════════════════════════════════════════
          COMMUNITY CARD
      ════════════════════════════════════════════════════════════ */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.communityCard}
          onPress={() => router.push('/heatmap')}
          activeOpacity={0.88}
        >
          <View style={styles.communityIconWrap}>
            <Ionicons name="earth-outline" size={24} color={Colors.emerald600} />
          </View>
          <View style={styles.communityText}>
            <Text style={styles.communityTitle}>We're making change together</Text>
            <Text style={styles.communitySub}>See where the community eco-routes most.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
        </TouchableOpacity>
      </View>

      {/* ════════════════════════════════════════════════════════════
          ACTIVE CHALLENGES
      ════════════════════════════════════════════════════════════ */}
      {challenges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/rewards')} activeOpacity={0.8}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.whiteCard, { padding: 16, gap: 12 }]}>
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

      <View style={{ height: insets.bottom + 24 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },

  // Decorative leaf shapes — absolute, behind content
  leafDecor1: { position: 'absolute', top: -20, right: -30, transform: [{ rotate: '30deg' }] },
  leafDecor2: { position: 'absolute', top: 60, right: 60, transform: [{ rotate: '-20deg' }] },
  leafDecor3: { position: 'absolute', bottom: 30, left: -10, transform: [{ rotate: '60deg' }] },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  logoText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Greeting
  greetingRow: {
    marginBottom: 8,
    flexShrink: 1,
  },
  greetingLine: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 22,
    fontWeight: '400',
  },
  greetingName: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingTaglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  greetingTagline: {
    color: Colors.emerald200,
    fontSize: 12,
    fontWeight: '600',
  },

  // Impact card — glassy translucent
  impactCard: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  impactCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  impactCardTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  viewAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  viewAllText: { color: Colors.white, fontSize: 9, fontWeight: '600' },

  impactStatsRow: { flexDirection: 'row', alignItems: 'center' },
  impactStatCell: { flex: 1, alignItems: 'center', gap: 2 },
  impactIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  impactStatValue: { color: Colors.white, fontWeight: '800', fontSize: 17 },
  impactStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9 },
  impactDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.15)' },

  // ── Map Section ───────────────────────────────────────────────────────────
  mapSection: {
    paddingHorizontal: 20,
    marginTop: -14,
  },
  mapCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadow.xl,
  },

  // Search pill (destination input)
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 14,
    marginBottom: 6,
    backgroundColor: Colors.gray50,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchPillIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPillText: { flex: 1, color: Colors.gray900, fontSize: 14, fontWeight: '600' },
  searchPillPlaceholder: { color: Colors.gray400, fontWeight: '400' },

  // Origin row
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  originDotOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  originDotInnerSmall: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.emerald600 },
  originText: { flex: 1, color: Colors.gray700, fontSize: 12, fontWeight: '400' },
  originPlaceholder: { color: Colors.gray400 },

  // Map tile
  mapTile: { height: 290, position: 'relative' },
  originDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(5,150,105,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originDotInner: { width: 12, height: 12, backgroundColor: Colors.emerald600, borderRadius: 6 },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Eco label overlay (bottom-left of map)
  ecoLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...Shadow.sm,
  },
  ecoLabelTitle: { color: Colors.emerald800, fontSize: 11, fontWeight: '700' },
  ecoLabelSub: { color: Colors.emerald700, fontSize: 9, fontWeight: '400' },

  // Plan Route CTA
  planBtn: {
    backgroundColor: Colors.emerald700,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    minHeight: 50,
    gap: 10,
  },
  planBtnDisabled: { opacity: 0.5 },
  planBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
  planBtnArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Sections ─────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 20, marginTop: 14 },
  whiteCard: { backgroundColor: Colors.white, borderRadius: 16, ...Shadow.lg },

  // Mood card — soft pale green
  moodCard: {
    backgroundColor: Colors.emerald50,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.emerald100,
    ...Shadow.sm,
  },
  moodCardTitle: { color: Colors.emerald900, fontWeight: '700', fontSize: 15, marginBottom: 3 },
  moodCardSub: { color: Colors.emerald700, fontSize: 12, marginBottom: 12 },

  // Community card — clean white with chevron
  communityCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.emerald100,
    ...Shadow.md,
  },
  communityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.emerald50,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  communityText: { flex: 1 },
  communityTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 14, marginBottom: 2 },
  communitySub: { color: Colors.gray500, fontSize: 12 },

  // Challenges
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 16 },
  seeAllText: { color: Colors.emerald600, fontWeight: '600', fontSize: 13 },
  challengeRow: { gap: 6 },
  challengeRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  challengeName: { color: Colors.gray900, fontWeight: '600', fontSize: 13 },
  challengePts: { color: Colors.emerald600, fontWeight: '700', fontSize: 12 },
  challengeTrack: { height: 6, backgroundColor: Colors.gray100, borderRadius: 3, overflow: 'hidden' },
  challengeFill: { height: '100%', backgroundColor: Colors.emerald600, borderRadius: 3 },
  challengeDesc: { color: Colors.gray500, fontSize: 11 },
});
