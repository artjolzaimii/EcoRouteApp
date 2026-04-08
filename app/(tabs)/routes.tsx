import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { useRouteStore, routeStore } from '@/lib/routeStore';
import { decodePolyline } from '@/lib/polyline';
import { RouteOption, NearbyPartner } from '@/lib/types';

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.44);

function modeIcon(mode: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (mode) {
    case 'CYCLING': return 'bicycle-outline';
    case 'TRANSIT': return 'bus-outline';
    case 'WALKING': return 'footsteps-outline';
    case 'CYCLING_TRANSIT': return 'git-merge-outline';
    case 'EV': return 'car-outline';
    default: return 'navigate-outline';
  }
}

function ratingLabel(score: number) {
  if (score >= 85) return { bg: Colors.emerald100, text: Colors.emerald700, label: 'Best' };
  if (score >= 65) return { bg: Colors.amber100, text: Colors.amber700, label: 'Great' };
  return { bg: Colors.blue100, text: Colors.blue600, label: 'Good' };
}

export default function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useRouteStore();
  const mapRef = useRef<MapView>(null);
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [selectedPartner, setSelectedPartner] = useState<NearbyPartner | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const selectedIndex = state?.selectedIndex ?? 0;
  const selectedRoute: RouteOption | undefined = state?.routes[selectedIndex];
  const polylineCoords = selectedRoute?.polyline ? decodePolyline(selectedRoute.polyline) : [];

  // Fit map to route whenever selected route changes
  useEffect(() => {
    if (polylineCoords.length < 2 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(polylineCoords, {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, [selectedIndex, polylineCoords.length]);

  const openPartnerSheet = (partner: NearbyPartner) => {
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

  // No route in store — show prompt
  if (!state) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <Ionicons name="map-outline" size={64} color={Colors.emerald400} />
        <Text style={styles.emptyTitle}>No route planned yet</Text>
        <Text style={styles.emptySub}>Search for a destination to see eco-friendly route options.</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.9}>
          <Text style={styles.emptyBtnText}>Plan a route</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const originCoord = { latitude: state.originLat, longitude: state.originLng };
  const destCoord = { latitude: state.destLat, longitude: state.destLng };
  const midLat = (state.originLat + state.destLat) / 2;
  const midLng = (state.originLng + state.destLng) / 2;
  const initialRegion = {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: Math.abs(state.originLat - state.destLat) * 2 + 0.01,
    longitudeDelta: Math.abs(state.originLng - state.destLng) * 2 + 0.01,
  };

  const nearbyPartners = selectedRoute?.nearbyPartners ?? [];

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Map */}
        <View style={[styles.mapArea, { height: MAP_HEIGHT }]}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {polylineCoords.length > 1 && (
              <Polyline
                coordinates={polylineCoords}
                strokeColor={Colors.emerald600}
                strokeWidth={4}
              />
            )}
            <Marker coordinate={originCoord} title="Start" pinColor={Colors.emerald600} />
            <Marker coordinate={destCoord} title="Destination" pinColor={Colors.red600} />
            {nearbyPartners.map((p) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                title={p.name}
                description={`${p.pointsPerVisit} pts`}
                pinColor={Colors.amber600}
              />
            ))}
          </MapView>

          {/* Top route bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarInner}>
              <View style={styles.navIconWrap}>
                <Ionicons name="navigate-outline" size={18} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topBarTitle} numberOfLines={1}>
                  {state.originAddress} → {state.destAddress}
                </Text>
                <TouchableOpacity onPress={() => router.push('/search')} activeOpacity={0.7}>
                  <Text style={styles.topBarSub}>Tap to change route</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Partner pins overlay */}
          {nearbyPartners.slice(0, 2).map((p, i) => (
            <View
              key={p.id}
              style={[styles.partnerPinAbsolute, { top: `${30 + i * 15}%`, left: `${35 + i * 12}%` }]}
            >
              <TouchableOpacity style={styles.pinCard} onPress={() => openPartnerSheet(p)} activeOpacity={0.9}>
                <Text style={styles.pinLogo}>🏪</Text>
                <View>
                  <Text style={styles.pinName} numberOfLines={1}>{p.name}</Text>
                  <View style={styles.pinBadge}>
                    <Text style={styles.pinBadgeText}>+{p.pointsPerVisit} pts</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Route Options Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.panelContent}>
              <Text style={styles.panelTitle}>Choose Your Route</Text>

              <View style={styles.routeList}>
                {state.routes.map((route, idx) => {
                  const active = selectedIndex === idx;
                  const rc = ratingLabel(route.ecoScore);
                  return (
                    <TouchableOpacity
                      key={route.id}
                      style={[styles.routeCard, active && styles.routeCardActive]}
                      onPress={() => routeStore.setSelectedIndex(idx)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.routeCardTop}>
                        <View style={styles.routeCardLeft}>
                          <View style={[styles.routeIconBox, active && styles.routeIconBoxActive]}>
                            <Ionicons name={modeIcon(route.mode)} size={22} color={active ? Colors.white : Colors.gray600} />
                          </View>
                          <View>
                            <Text style={[styles.routeCardName, active && styles.routeCardNameActive]}>
                              {route.label}
                            </Text>
                            <View style={styles.routeCardMeta}>
                              <Ionicons name="location-outline" size={12} color={Colors.gray500} />
                              <Text style={styles.routeCardMetaText}>{route.distanceKm.toFixed(1)} km</Text>
                              <Ionicons name="time-outline" size={12} color={Colors.gray500} />
                              <Text style={styles.routeCardMetaText}>{route.durationMinutes} min</Text>
                            </View>
                          </View>
                        </View>
                        <View style={[styles.ratingBadge, { backgroundColor: rc.bg }]}>
                          <Text style={[styles.ratingText, { color: rc.text }]}>{rc.label}</Text>
                        </View>
                      </View>

                      <View style={styles.routeCardStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="leaf-outline" size={13} color={Colors.emerald600} />
                          <Text style={styles.statEco}>
                            {(route.co2SavedVsCar / 1000).toFixed(2)} kg saved
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="flash-outline" size={13} color={Colors.purple600} />
                          <Text style={styles.statGray}>+{route.greenPoints} pts</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="analytics-outline" size={13} color={Colors.gray500} />
                          <Text style={styles.statGray}>Score {route.ecoScore}</Text>
                        </View>
                      </View>

                      {active && route.nearbyPartners.length > 0 && (
                        <View style={styles.partnerChipsRow}>
                          {route.nearbyPartners.slice(0, 3).map((p) => (
                            <View key={p.id} style={styles.partnerChip}>
                              <Text style={styles.partnerChipText}>🏪 {p.name}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.startBtn}
                activeOpacity={0.9}
                onPress={() => router.push('/route-detail')}
              >
                <Ionicons name="navigate-outline" size={20} color={Colors.white} />
                <Text style={styles.startBtnText}>Start Navigation</Text>
              </TouchableOpacity>

              <View style={{ height: 16 }} />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Partner Bottom Sheet */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalBackdrop} onPress={closeSheet} />
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
                    <Text style={{ fontSize: 28 }}>🏪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ecoLabel}>Eco-Partner</Text>
                    <Text style={styles.partnerName}>{selectedPartner.name}</Text>
                    <Text style={styles.partnerDist}>{selectedPartner.address}</Text>
                    <Text style={styles.partnerDist}>
                      {selectedPartner.distanceM < 1000
                        ? `${selectedPartner.distanceM}m from route`
                        : `${(selectedPartner.distanceM / 1000).toFixed(1)} km from route`}
                    </Text>
                  </View>
                </View>

                {selectedPartner.activeCoupon && (
                  <View style={styles.offerBox}>
                    <View style={styles.offerTitleRow}>
                      <Ionicons name="gift-outline" size={20} color={Colors.emerald600} />
                      <Text style={styles.offerTitleText}>{selectedPartner.activeCoupon.title}</Text>
                    </View>
                    <Text style={styles.offerDesc}>
                      {selectedPartner.activeCoupon.discountValue}% off — redeem for {selectedPartner.activeCoupon.pointsCost} points
                    </Text>
                  </View>
                )}

                <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.pointsRow}>
                  <Ionicons name="flash-outline" size={20} color={Colors.emerald600} />
                  <View>
                    <Text style={styles.pointsTitle}>Earn +{selectedPartner.pointsPerVisit} points</Text>
                    <Text style={styles.pointsSub}>When you visit on this route</Text>
                  </View>
                </LinearGradient>

                <TouchableOpacity
                  style={styles.earnBtn}
                  activeOpacity={0.9}
                  onPress={() => { closeSheet(); router.push('/route-detail'); }}
                >
                  <Text style={styles.earnBtnText}>Earn with this route</Text>
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

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16, backgroundColor: Colors.white },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.gray900, textAlign: 'center' },
  emptySub: { fontSize: 14, color: Colors.gray500, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: Colors.emerald600, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  // Map
  mapArea: { position: 'relative', overflow: 'hidden' },
  partnerPinAbsolute: { position: 'absolute', alignItems: 'center', zIndex: 5 },
  pinCard: {
    backgroundColor: Colors.white, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: Colors.emerald100,
    ...Shadow.md,
  },
  pinLogo: { fontSize: 14 },
  pinName: { fontSize: 9, fontWeight: '600', color: Colors.gray900, lineHeight: 13, maxWidth: 80 },
  pinBadge: { backgroundColor: Colors.emerald100, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1, marginTop: 1 },
  pinBadgeText: { fontSize: 8, fontWeight: '700', color: Colors.emerald700 },

  topBar: { position: 'absolute', top: 16, left: 24, right: 24, zIndex: 10 },
  topBarInner: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    ...Shadow.lg,
  },
  navIconWrap: { width: 36, height: 36, backgroundColor: Colors.emerald600, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { color: Colors.gray900, fontWeight: '600', fontSize: 13 },
  topBarSub: { color: Colors.emerald600, fontSize: 11, marginTop: 1 },

  // Panel
  panel: { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, ...Shadow.xl },
  panelHandle: { width: 48, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  panelContent: { paddingHorizontal: 24, paddingTop: 8 },
  panelTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 20, marginBottom: 16 },

  // Route cards
  routeList: { gap: 12, marginBottom: 24 },
  routeCard: { borderRadius: 16, borderWidth: 2, borderColor: Colors.gray200, padding: 16, backgroundColor: Colors.gray50 },
  routeCardActive: { backgroundColor: Colors.emerald50, borderColor: Colors.emerald600, ...Shadow.md },
  routeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  routeCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  routeIconBoxActive: { backgroundColor: Colors.emerald600 },
  routeCardName: { fontWeight: '600', fontSize: 15, color: Colors.gray900, marginBottom: 4 },
  routeCardNameActive: { color: Colors.emerald900 },
  routeCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  routeCardMetaText: { fontSize: 12, color: Colors.gray600 },
  ratingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  ratingText: { fontSize: 11, fontWeight: '600' },
  routeCardStats: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statEco: { fontSize: 12, fontWeight: '600', color: Colors.emerald600 },
  statGray: { fontSize: 12, color: Colors.gray600 },
  partnerChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.emerald200 },
  partnerChip: { backgroundColor: Colors.white, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.emerald200 },
  partnerChipText: { fontSize: 11, color: Colors.emerald700 },

  startBtn: { backgroundColor: Colors.emerald600, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...Shadow.lg },
  startBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },

  // Modal / Sheet
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.black40 },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, ...Shadow.xl },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetBody: { paddingHorizontal: 24, paddingBottom: 40 },
  rowEnd: { alignItems: 'flex-end', marginBottom: 8 },
  closeBtn: { width: 32, height: 32, backgroundColor: Colors.gray100, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  partnerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 16 },
  partnerLogoBox: { width: 64, height: 64, backgroundColor: Colors.emerald100, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ecoLabel: { color: Colors.emerald600, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  partnerName: { color: Colors.gray900, fontWeight: '700', fontSize: 20, marginBottom: 4 },
  partnerDist: { color: Colors.gray500, fontSize: 13 },
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
