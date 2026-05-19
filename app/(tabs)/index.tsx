import { MoodSelector } from '@/components/MoodSelector';
import { Colors, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getEcoRoutes, api } from '@/lib/api';
import { reverseGeocode } from '@/lib/geocode';
import { routeStore } from '@/lib/routeStore';
import { usePreferences } from '@/lib/preferences';
import { TripMode, RouteMood } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

type TransportMode = {
  id: TripMode;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const transportModes: TransportMode[] = [
  { id: 'CYCLING', label: 'Bike', icon: 'bicycle-outline' },
  { id: 'TRANSIT', label: 'Transit', icon: 'bus-outline' },
  { id: 'WALKING', label: 'Walk', icon: 'footsteps-outline' },
];

type Challenge = {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  rewardPoints: number;
  progress: number;
  completed: boolean;
};

type EcoPartner = {
  id: string;
  name: string;
  logo: string;
  offer: string;
  distance: string;
  description: string;
  points: number;
};

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: '☕', TRANSPORT: '🚴', FITNESS: '🏋️', WELLNESS: '🌿',
  RETAIL: '🛍️', ENTERTAINMENT: '🎭', OTHER: '🏪',
};

const FALLBACK_PARTNERS: EcoPartner[] = [
  { id: 'static-1', name: 'Green Coffee Co.', logo: '☕', offer: 'Free coffee', distance: '120m away', description: 'Organic fair-trade coffee shop using 100% renewable energy', points: 50 },
  { id: 'static-2', name: 'EcoRide Bike Shop', logo: '🚴', offer: '10% off repairs', distance: 'On your route', description: 'Local bike shop offering repairs and eco-friendly gear', points: 75 },
];

function mapApiPartner(p: any, index: number): EcoPartner {
  const distM: number = p.distanceM ?? 0;
  const distStr = distM < 1000 ? `${distM}m away` : `${(distM / 1000).toFixed(1)} km away`;
  return {
    id: p.id ?? `api-${index}`,
    name: p.name,
    logo: CATEGORY_EMOJI[p.category as string] ?? '🏪',
    offer: p.activeCoupon?.title ?? 'Eco-certified partner',
    distance: distStr,
    description: p.address ?? p.category ?? 'Visit to earn green points',
    points: p.pointsPerVisit ?? 0,
  };
}

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

  // Default selected mode to the user's first preferred mode once preferences load
  const [selectedMode, setSelectedMode] = useState<TripMode>('CYCLING');
  useEffect(() => {
    if (prefs.preferredModes.length > 0) {
      const first = prefs.preferredModes[0] as TripMode;
      if (transportModes.some((m) => m.id === first)) {
        setSelectedMode(first);
      }
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

  const [selectedPartner, setSelectedPartner] = useState<EcoPartner | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Partners — loaded from API once location is known; falls back to static list
  const [partners, setPartners] = useState<EcoPartner[]>(FALLBACK_PARTNERS);
  const [partnersLoading, setPartnersLoading] = useState(false);

  // Active challenges preview
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  // Live stats for the header "Today's Impact" strip
  const [userStats, setUserStats] = useState<{ totalPoints: number; totalCo2SavedG: number; totalTrips: number } | null>(null);

  const mapRef = useRef<MapView>(null);

  // Load current location on mount
  useEffect(() => {
    loadCurrentLocation();
  }, []);

  // Load TODAY's stats and challenges on every focus so they refresh after a trip
  useFocusEffect(
    useCallback(() => {
      api.get<{ totalPoints: number; totalCo2SavedG: number; totalTrips: number }>('/api/impact/today')
        .then((data) => setUserStats(data))
        .catch(() => {});
      api.get<Challenge[]>('/api/challenges')
        .then((data) => setChallenges(Array.isArray(data) ? data.filter((c) => !c.completed).slice(0, 2) : []))
        .catch(() => {});
    }, []),
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

        // Load nearby partners for current location (non-blocking)
        loadNearbyPartners(loc.lat, loc.lng);
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  const loadNearbyPartners = async (lat: number, lng: number) => {
    setPartnersLoading(true);
    try {
      const data = await api.get<{ partners: any[]; count: number }>(
        `/api/partners/nearby?lat=${lat}&lng=${lng}&radiusMeters=2000`
      );
      if (data?.partners && data.partners.length > 0) {
        setPartners(data.partners.map(mapApiPartner));
      }
      // If empty, keep the fallback list
    } catch {
      // API unavailable — fallback list stays
    } finally {
      setPartnersLoading(false);
    }
  };

  const openPartnerSheet = (partner: EcoPartner) => {
    setSelectedPartner(partner);
    setModalVisible(true);
    Animated.spring(sheetAnim, { toValue: 0, damping: 30, stiffness: 300, useNativeDriver: true }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, { toValue: SCREEN_HEIGHT, duration: 280, useNativeDriver: true }).start(() => {
      setModalVisible(false);
      setSelectedPartner(null);
    });
  };

  const handleFindRoute = async () => {
    if (!destCoords || !destAddress.trim()) {
      Alert.alert('Destination required', 'Please choose a destination first.');
      return;
    }

    const oLat = originCoords?.lat ?? DEFAULT_REGION.latitude;
    const oLng = originCoords?.lng ?? DEFAULT_REGION.longitude;

    setLoadingRoutes(true);
    try {
      const ecoResponse = await getEcoRoutes(
        { lat: oLat, lng: oLng, name: originAddress },
        { lat: destCoords.lat, lng: destCoords.lng, name: destAddress },
        selectedMood,
      );

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

      // If autoStartNavigation is enabled, go straight to navigation; otherwise show route options
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

        {/* ── Transport Mode ── */}
        <View style={styles.sectionOffset}>
          <View style={[styles.card, styles.modeCardPad]}>
            <Text style={styles.cardHeading}>Travel Mode</Text>
            <View style={styles.modeRow}>
              {transportModes.map((mode) => {
                const active = selectedMode === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.modeBtn, active && styles.modeBtnActive]}
                    onPress={() => setSelectedMode(mode.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={mode.icon} size={24} color={active ? Colors.emerald600 : Colors.gray400} />
                    <Text style={[styles.modeBtnLabel, active && styles.modeBtnLabelActive]}>{mode.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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
                provider={PROVIDER_GOOGLE}
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

        {/* ── Eco Partners ── */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Eco Partners on Route</Text>
            {partnersLoading && <ActivityIndicator size="small" color={Colors.emerald600} />}
          </View>
          <View style={styles.partnerListWrap}>
            {partners.map((partner) => (
              <TouchableOpacity
                key={partner.id}
                style={styles.partnerCard}
                activeOpacity={0.85}
                onPress={() => openPartnerSheet(partner)}
              >
                <Text style={styles.partnerLogo}>{partner.logo}</Text>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  <Text style={styles.partnerOffer}>{partner.offer}</Text>
                  <View style={styles.partnerDistRow}>
                    <Ionicons name="location-outline" size={12} color={Colors.gray400} />
                    <Text style={styles.partnerDist}>{partner.distance}</Text>
                  </View>
                </View>
                <View style={styles.partnerPointsBadge}>
                  <Ionicons name="flash-outline" size={12} color={Colors.emerald600} />
                  <Text style={styles.partnerPointsText}>+{partner.points}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Eco Partner Bottom Sheet ── */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.backdrop} onPress={closeSheet} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
            <View style={styles.sheetHandle} />
            {selectedPartner && (
              <View style={styles.sheetBody}>
                <View style={styles.rowEnd}>
                  <TouchableOpacity style={styles.closeBtn} onPress={closeSheet}>
                    <Ionicons name="close-outline" size={20} color={Colors.gray600} />
                  </TouchableOpacity>
                </View>
                <View style={styles.partnerRow}>
                  <View style={styles.partnerLogoBox}>
                    <Text style={styles.partnerLogoText}>{selectedPartner.logo}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ecoLabel}>Eco-Partner</Text>
                    <Text style={styles.partnerModalName}>{selectedPartner.name}</Text>
                    <Text style={styles.partnerModalDist}>{selectedPartner.distance}</Text>
                  </View>
                </View>
                <View style={styles.offerBox}>
                  <View style={styles.offerTitleRow}>
                    <Ionicons name="gift-outline" size={20} color={Colors.emerald600} />
                    <Text style={styles.offerTitleText}>{selectedPartner.offer}</Text>
                  </View>
                  <Text style={styles.offerDesc}>{selectedPartner.description}</Text>
                </View>
                <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.pointsRow}>
                  <Ionicons name="flash-outline" size={20} color={Colors.emerald600} />
                  <View>
                    <Text style={styles.pointsTitle}>Earn +{selectedPartner.points} points</Text>
                    <Text style={styles.pointsSub}>When you visit on this route</Text>
                  </View>
                </LinearGradient>
                <TouchableOpacity
                  style={styles.earnBtn}
                  activeOpacity={0.9}
                  onPress={() => { closeSheet(); router.push('/search'); }}
                >
                  <Text style={styles.earnBtnText}>Find routes passing here</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
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
  modeCardPad: { padding: 16 },
  cardHeading: { color: Colors.gray900, fontWeight: '600', fontSize: 15, marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    gap: 4,
  },
  modeBtnActive: { backgroundColor: Colors.emerald50, borderColor: Colors.emerald600 },
  modeBtnLabel: { fontSize: 12, fontWeight: '500', color: Colors.gray600 },
  modeBtnLabelActive: { color: Colors.emerald700 },

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

  // Partners section
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 17 },
  partnerListWrap: { gap: 12 },
  partnerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadow.sm,
  },
  partnerLogo: { fontSize: 32, width: 48, textAlign: 'center' },
  partnerInfo: { flex: 1 },
  partnerName: { color: Colors.gray900, fontWeight: '600', fontSize: 15, marginBottom: 2 },
  partnerOffer: { color: Colors.emerald600, fontSize: 13, fontWeight: '500', marginBottom: 4 },
  partnerDistRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  partnerDist: { color: Colors.gray400, fontSize: 12 },
  partnerPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.emerald50,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.emerald100,
  },
  partnerPointsText: { color: Colors.emerald600, fontWeight: '700', fontSize: 13 },

  // Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.black40 },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, ...Shadow.xl },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetBody: { paddingHorizontal: 24, paddingBottom: 40 },
  rowEnd: { alignItems: 'flex-end', marginBottom: 8 },
  closeBtn: { width: 32, height: 32, backgroundColor: Colors.gray100, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  partnerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 16 },
  partnerLogoBox: { width: 64, height: 64, backgroundColor: Colors.emerald100, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  partnerLogoText: { fontSize: 28 },
  ecoLabel: { color: Colors.emerald600, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  partnerModalName: { color: Colors.gray900, fontWeight: '700', fontSize: 20, marginBottom: 4 },
  partnerModalDist: { color: Colors.gray500, fontSize: 13 },
  offerBox: { backgroundColor: Colors.emerald50, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.emerald100, marginBottom: 12 },
  offerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  offerTitleText: { color: Colors.emerald900, fontWeight: '700', fontSize: 17 },
  offerDesc: { color: Colors.emerald700, fontSize: 13, lineHeight: 18 },
  pointsRow: { borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  pointsTitle: { color: Colors.gray900, fontWeight: '600', fontSize: 14 },
  pointsSub: { color: Colors.gray600, fontSize: 11, marginTop: 2 },
  earnBtn: { backgroundColor: Colors.emerald600, borderRadius: 16, paddingVertical: 16, alignItems: 'center', ...Shadow.lg },
  earnBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
