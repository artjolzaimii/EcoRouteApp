import { Colors, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { api, getEcoRoutes } from '@/lib/api';
import { reverseGeocode } from '@/lib/geocode';
import { routeStore } from '@/lib/routeStore';
import { TripMode } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  const { prefs, theme } = usePreferences();

  const [selectedMode, setSelectedMode] = useState<TripMode>(prefs.defaultMode.toUpperCase() as TripMode);
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

  const [partners, setPartners] = useState<EcoPartner[]>(FALLBACK_PARTNERS);
  const [partnersLoading, setPartnersLoading] = useState(false);

  const [userStats, setUserStats] = useState<{ totalPoints: number; totalCo2SavedG: number; totalTrips: number } | null>(null);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  useFocusEffect(
    useCallback(() => {
      api.get<{ totalPoints: number; totalCo2SavedG: number; totalTrips: number }>('/api/impact/today')
        .then((data) => setUserStats(data))
        .catch(() => { });
    }, []),
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
    } catch {
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
      );

      if (!ecoResponse.routes || ecoResponse.routes.length === 0) {
        Alert.alert('No routes found', 'No eco-routes are available for this journey. Try a different destination.');
        return;
      }

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
        routes: [] as any,
        selectedIndex: bestIndex,
        preferredMode: selectedMode,
        ecoResponse,
      });

      router.navigate('/(tabs)/routes');
    } catch (err: any) {
      Alert.alert('Could not get routes', err.message ?? 'Check your connection and try again.');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const displayName = prefs.fullName ?? session?.user?.email?.split('@')[0] ?? 'there';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={prefs.appearance === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>Hello, {displayName}</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Let's travel green</Text>
          </View>
          <TouchableOpacity
            style={[styles.profileBtn, { backgroundColor: theme.card }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/profile')}
          >
            {prefs.photoUri ? (
              <Image source={{ uri: prefs.photoUri }} style={styles.profileBtnImg} />
            ) : (
              <View style={styles.profileBtnPlaceholder}>
                <Ionicons name="person" size={20} color={theme.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: theme.card }]}
          onPress={() => router.push('/search')}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <Text style={[styles.searchPlaceholder, { color: theme.textSecondary }]}>Where to for your eco-trip?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={[theme.primary, theme.primary === Colors.emerald600 ? Colors.emerald700 : '#047857']} style={styles.impactCard}>
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
            <View style={styles.statItem}>
              <Ionicons name="leaf-outline" size={20} color={Colors.white} />
              <Text style={styles.statValue}>{userStats ? (userStats.totalCo2SavedG / 1000).toFixed(1) + ' kg' : '—'}</Text>
              <Text style={styles.statLabel}>CO₂ Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="navigate-outline" size={20} color={Colors.white} />
              <Text style={styles.statValue}>{userStats ? String(userStats.totalTrips) : '—'}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flash-outline" size={20} color={Colors.white} />
              <Text style={styles.statValue}>{userStats ? String(userStats.totalPoints) : '—'}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </LinearGradient>

        <View>
          <Text style={[styles.cardHeading, { color: theme.text }]}>Travel Mode</Text>
          <View style={styles.modesContainer}>
            {transportModes.map((mode) => {
              const isSelected = selectedMode === mode.id || (selectedMode === 'TRANSIT' && mode.id === 'TRANSIT');
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeBtn,
                    { backgroundColor: theme.card },
                    isSelected && { backgroundColor: theme.primary, ...Shadow.md },
                  ]}
                  onPress={() => setSelectedMode(mode.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={mode.icon}
                    size={24}
                    color={isSelected ? Colors.white : theme.textSecondary}
                  />
                  <Text style={[styles.modeLabel, { color: isSelected ? Colors.white : theme.text }]}>{mode.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, styles.mapCardOuter]}>
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
          </View>
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

        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Nearby Eco-Partners</Text>
            <TouchableOpacity onPress={() => router.push('/rewards')}>
              <Text style={[styles.sectionLink, { color: theme.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.partnersScroll} contentContainerStyle={styles.partnersContent}>
            {partners.map((partner) => (
              <TouchableOpacity key={partner.id} style={[styles.partnerCard, { backgroundColor: theme.card }]} activeOpacity={0.9} onPress={() => openPartnerSheet(partner)}>
                <View style={[styles.partnerLogo, { backgroundColor: theme.background }]}>
                  <Text style={styles.partnerLogoEmoji}>{partner.logo}</Text>
                </View>
                <Text style={[styles.partnerName, { color: theme.text }]} numberOfLines={1}>{partner.name}</Text>
                <Text style={[styles.partnerOffer, { color: theme.primary }]}>{partner.offer}</Text>
                <Text style={[styles.partnerDist, { color: theme.textSecondary }]}>{partner.distance}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 24 },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  profileBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...Shadow.sm, overflow: 'hidden' },
  profileBtnImg: { width: 44, height: 44 },
  profileBtnPlaceholder: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadow.md,
  },
  searchPlaceholder: { fontSize: 16, fontWeight: '500' },
  impactCard: { borderRadius: 20, padding: 20, ...Shadow.md },
  impactCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  impactLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  trendText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { color: Colors.white, fontWeight: '700', fontSize: 17 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  cardHeading: { fontWeight: '600', fontSize: 15, marginBottom: 12 },
  modesContainer: { flexDirection: 'row', gap: 12 },
  modeBtn: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  modeLabel: { fontSize: 13, fontWeight: '600' },
  card: { borderRadius: 16, overflow: 'hidden', ...Shadow.md },
  mapCardOuter: { borderRadius: 16, overflow: 'hidden' },
  miniMap: { height: 220, position: 'relative' },
  originDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(5,150,105,0.25)', alignItems: 'center', justifyContent: 'center' },
  originDotInner: { width: 12, height: 12, backgroundColor: Colors.emerald600, borderRadius: 6 },
  findBtn: { backgroundColor: Colors.emerald600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, minHeight: 50 },
  findBtnDisabled: { opacity: 0.55 },
  findBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  sectionLink: { fontWeight: '600', fontSize: 14 },
  partnersScroll: { marginHorizontal: -24 },
  partnersContent: { paddingHorizontal: 24, gap: 16 },
  partnerCard: { width: 160, borderRadius: 20, padding: 16, gap: 8, ...Shadow.md },
  partnerLogo: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  partnerLogoEmoji: { fontSize: 24 },
  partnerName: { fontWeight: '700', fontSize: 15 },
  partnerOffer: { fontWeight: '600', fontSize: 13 },
  partnerDist: { fontSize: 12 },
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
