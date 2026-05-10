import { Co2TransparencySheet } from '@/components/co2-transparency-sheet';
import { Colors, Shadow } from '@/constants/theme';
import { recordPartnerClick } from '@/lib/api';
import { co2DataFromRoute } from '@/lib/co2Transparency';
import {
  flattenRouteSegments,
  getRouteMapSegments,
  getTransitionMarkers,
  routeModeIcon,
  routeModeStyle,
} from '@/lib/routeMap';
import { routeStore, useRouteStore } from '@/lib/routeStore';
import { EcoRoute, EcoRoutesResponse, NearbyPartner, PartnerPin } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapView, { Marker, Polyline } from 'react-native-maps';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.44);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function modeIcon(mode: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (mode) {
    case 'CYCLING':
    case 'BICYCLING':    return 'bicycle-outline';
    case 'TRANSIT':      return 'bus-outline';
    case 'WALKING':      return 'footsteps-outline';
    case 'MIXED':
    case 'CYCLING_TRANSIT': return 'git-merge-outline';
    case 'TRAIN':        return 'train-outline';
    case 'PLANE':        return 'airplane-outline';
    case 'EV':           return 'car-outline';
    default:             return 'navigate-outline';
  }
}

function modeLabel(mode: string, subType?: string): string {
  if (subType === 'CYCLING_TRANSIT' || mode === 'MIXED') return 'Cycling + Transit';
  switch (mode) {
    case 'CYCLING':
    case 'BICYCLING':    return 'Cycling';
    case 'TRANSIT':      return 'Transit';
    case 'WALKING':      return 'Walking';
    case 'TRAIN':        return 'Train';
    case 'PLANE':        return 'Flight';
    default:             return mode;
  }
}

function carbonScoreStyle(score: number): { bg: string; text: string; label: string } {
  if (score >= 80) return { bg: Colors.emerald100, text: Colors.emerald700, label: 'Best' };
  if (score >= 50) return { bg: Colors.amber100,   text: Colors.amber700,   label: 'Good' };
  return                  { bg: Colors.red100,      text: Colors.red600,     label: 'High CO2' };
}

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────

export default function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useRouteStore();
  const mapRef = useRef<MapView>(null);
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const [selectedPartner, setSelectedPartner] = useState<PartnerPin | NearbyPartner | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [co2SheetRoute, setCo2SheetRoute] = useState<EcoRoute | any | null>(null);

  // Determine which route format we have
  const ecoResponse: EcoRoutesResponse | undefined = state?.ecoResponse;
  const selectedIndex = state?.selectedIndex ?? 0;

  // Support both new EcoRoute format and legacy RouteOption format
  const routes: EcoRoute[] = ecoResponse?.routes ?? [];
  const legacyRoutes = !ecoResponse ? (state?.routes ?? []) : [];
  const hasEcoRoutes = routes.length > 0;
  const hasLegacyRoutes = legacyRoutes.length > 0;
  const hasAnyRoutes = hasEcoRoutes || hasLegacyRoutes;

  const selectedEcoRoute: EcoRoute | undefined = hasEcoRoutes ? routes[selectedIndex] : undefined;
  const selectedLegacyRoute = hasLegacyRoutes ? (legacyRoutes as any)[selectedIndex] : undefined;

  const originLat = state?.originLat;
  const originLng = state?.originLng;
  const destLat = state?.destLat;
  const destLng = state?.destLng;
  const originCoord = useMemo(
    () => originLat != null && originLng != null ? { latitude: originLat, longitude: originLng } : null,
    [originLat, originLng],
  );
  const destCoord = useMemo(
    () => destLat != null && destLng != null ? { latitude: destLat, longitude: destLng } : null,
    [destLat, destLng],
  );
  const routeSegments = useMemo(
    () => getRouteMapSegments(
      selectedEcoRoute ?? selectedLegacyRoute,
      selectedEcoRoute?.mode ?? selectedLegacyRoute?.mode,
      originCoord,
      destCoord,
    ),
    [
      selectedEcoRoute,
      selectedLegacyRoute,
      originCoord,
      destCoord,
    ],
  );
  const routeCoords = useMemo(() => flattenRouteSegments(routeSegments), [routeSegments]);
  const transitionMarkers = useMemo(() => getTransitionMarkers(routeSegments), [routeSegments]);

  // Partner pins
  const partnerPins: PartnerPin[] = ecoResponse?.topRoute?.partnerPins ?? [];
  const nearbyPartners: NearbyPartner[] = !ecoResponse ? ((selectedLegacyRoute as any)?.nearbyPartners ?? []) : [];

  useEffect(() => {
    if (routeCoords.length < 2 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(routeCoords, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [selectedIndex, routeCoords]);

  // Must be declared before the early return to satisfy Rules of Hooks
  const syntheticInjected = useRef(false);
  useEffect(() => {
    if (syntheticInjected.current) return;
    const s = routeStore.get();
    const ecoResp = s?.ecoResponse;
    if (!s || !ecoResp) return;

    const alreadyHasCycling = ecoResp.routes.some(
      r => r.mode === 'CYCLING' || r.mode === 'BICYCLING',
    );
    syntheticInjected.current = true;
    if (alreadyHasCycling) return;

    const walkingRoute = ecoResp.routes.find(r => r.mode === 'WALKING');
    if (!walkingRoute) return;

    const synthetic: EcoRoute & { _synthetic?: boolean } = {
      ...walkingRoute,
      mode: 'BICYCLING' as EcoRoute['mode'],
      durationMin: Math.round(walkingRoute.durationMin / 2),
      recommended: false,
      recommendationReason: 'No cycling data for this area — follows the walking path',
      partnerStop: undefined,
      _synthetic: true,
    };

    const updatedRoutes = ecoResp.routes.flatMap(r =>
      r.mode === 'WALKING' ? [r, synthetic] : [r],
    );

    routeStore.set({ ...s, ecoResponse: { ...ecoResp, routes: updatedRoutes } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openPartnerSheet = (partner: PartnerPin | NearbyPartner) => {
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

  const handlePartnerClick = async (partner: PartnerPin | NearbyPartner) => {
    openPartnerSheet(partner);
    try { await recordPartnerClick(partner.id); } catch { /* non-critical */ }
  };

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!state || !hasAnyRoutes) {
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

  const resolvedOriginCoord = { latitude: state.originLat, longitude: state.originLng };
  const resolvedDestCoord   = { latitude: state.destLat,   longitude: state.destLng   };
  const midLat = (state.originLat + state.destLat) / 2;
  const midLng = (state.originLng + state.destLng) / 2;
  const initialRegion = {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: Math.abs(state.originLat - state.destLat) * 2 + 0.01,
    longitudeDelta: Math.abs(state.originLng - state.destLng) * 2 + 0.01,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const renderEcoRouteCard = (route: EcoRoute & { _synthetic?: boolean }, idx: number) => {
    const active = selectedIndex === idx;
    const cs = carbonScoreStyle(route.carbonScore);
    const isRecommended = route.recommended;

    return (
      <TouchableOpacity
        key={`eco-${idx}`}
        style={[styles.routeCard, active && styles.routeCardActive]}
        onPress={() => routeStore.setSelectedIndex(idx)}
        activeOpacity={0.85}
      >
        {isRecommended && (
          <View style={styles.recommendedBanner}>
            <Ionicons name="star" size={11} color={Colors.emerald700} />
            <Text style={styles.recommendedText}>Recommended</Text>
          </View>
        )}
        {route.partnerStop && (
          <View style={styles.partnerStopBadge}>
            <Ionicons name="bicycle-outline" size={11} color={Colors.emerald700} />
            <Text style={styles.partnerStopBadgeText}>via {route.partnerStop.partnerName}</Text>
          </View>
        )}

        <View style={styles.routeCardTop}>
          <View style={styles.routeCardLeft}>
            <View style={[styles.routeIconBox, active && styles.routeIconBoxActive]}>
              <Ionicons name={modeIcon(route.mode)} size={22} color={active ? Colors.white : Colors.gray600} />
            </View>
            <View>
              <Text style={[styles.routeCardName, active && styles.routeCardNameActive]}>
                {modeLabel(route.mode, route.subType)}
              </Text>
              <View style={styles.routeCardMeta}>
                <Ionicons name="location-outline" size={12} color={Colors.gray500} />
                <Text style={styles.routeCardMetaText}>{route.distanceKm.toFixed(1)} km</Text>
                <Ionicons name="time-outline" size={12} color={Colors.gray500} />
                <Text style={styles.routeCardMetaText}>{route.durationMin} min</Text>
              </View>
            </View>
          </View>
          <View style={[styles.ratingBadge, { backgroundColor: cs.bg }]}>
            <Text style={[styles.ratingText, { color: cs.text }]}>{cs.label}</Text>
          </View>
        </View>

        <View style={styles.routeCardStats}>
          <View style={styles.statItem}>
            <Ionicons name="leaf-outline" size={13} color={Colors.emerald600} />
            <Text style={styles.statEco}>
              {route.co2Grams === 0
                ? 'Zero emissions'
                : `${(route.co2Grams / 1000).toFixed(2)} kg CO2`}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flash-outline" size={13} color={Colors.purple600} />
            <Text style={styles.statGray}>
              {route.greenPoints}{route.greenPoints > 0 ? '+' : ''} pts
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="analytics-outline" size={13} color={Colors.gray500} />
            <Text style={styles.statGray}>Score {route.carbonScore}</Text>
          </View>
        </View>

        {/* Train / Flight extra info */}
        {route.originStation && route.destStation && (
          <View style={styles.extraInfo}>
            <Ionicons name="train-outline" size={12} color={Colors.blue600} />
            <Text style={styles.extraInfoText} numberOfLines={1}>
              {route.originStation} → {route.destStation}
            </Text>
            {route.price != null && (
              <Text style={styles.priceTag}>{route.currency} {route.price}</Text>
            )}
          </View>
        )}
        {route.originAirport && route.destAirport && (
          <View style={styles.extraInfo}>
            <Ionicons name="airplane-outline" size={12} color={Colors.blue600} />
            <Text style={styles.extraInfoText} numberOfLines={1}>
              {route.originAirport} → {route.destAirport}
            </Text>
          </View>
        )}

        {isRecommended && route.recommendationReason && (
          <View style={styles.reasonRow}>
            <Text style={styles.reasonText}>{route.recommendationReason}</Text>
          </View>
        )}
        {route._synthetic && (
          <View style={styles.syntheticNote}>
            <Ionicons name="information-circle-outline" size={12} color={Colors.gray400} />
            <Text style={styles.syntheticNoteText}>No cycling data — uses the walking path</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.co2InfoBtn}
          onPress={() => setCo2SheetRoute(route)}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle-outline" size={14} color={Colors.emerald700} />
          <Text style={styles.co2InfoText}>How is CO₂ calculated?</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderLegacyRouteCard = (route: any, idx: number) => {
    const active = selectedIndex === idx;
    const cs = carbonScoreStyle(route.ecoScore ?? 0);
    return (
      <TouchableOpacity
        key={`legacy-${idx}`}
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
                <Text style={styles.routeCardMetaText}>{route.distanceKm?.toFixed(1)} km</Text>
                <Ionicons name="time-outline" size={12} color={Colors.gray500} />
                <Text style={styles.routeCardMetaText}>{route.durationMinutes} min</Text>
              </View>
            </View>
          </View>
          <View style={[styles.ratingBadge, { backgroundColor: cs.bg }]}>
            <Text style={[styles.ratingText, { color: cs.text }]}>{cs.label}</Text>
          </View>
        </View>
        <View style={styles.routeCardStats}>
          <View style={styles.statItem}>
            <Ionicons name="leaf-outline" size={13} color={Colors.emerald600} />
            <Text style={styles.statEco}>{((route.co2SavedVsCar ?? 0) / 1000).toFixed(2)} kg saved</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flash-outline" size={13} color={Colors.purple600} />
            <Text style={styles.statGray}>
              {route.greenPoints}{route.greenPoints > 0 ? '+' : ''} pts
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.co2InfoBtn}
          onPress={() => setCo2SheetRoute(route)}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle-outline" size={14} color={Colors.emerald700} />
          <Text style={styles.co2InfoText}>How is CO₂ calculated?</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Map */}
        <View style={[styles.mapArea, { height: MAP_HEIGHT }]}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {routeSegments.map((segment, index) => {
              const style = routeModeStyle(segment.mode);
              return (
                <Polyline
                  key={`route-segment-${selectedIndex}-${index}`}
                  coordinates={segment.coordinates}
                  strokeColor={style.strokeColor}
                  strokeWidth={style.strokeWidth}
                  lineDashPattern={style.lineDashPattern}
                  zIndex={10 + index}
                />
              );
            })}
            <Marker coordinate={resolvedOriginCoord} title="Start" pinColor={Colors.emerald600} />
            <Marker coordinate={resolvedDestCoord}   title="Destination" pinColor={Colors.red600} />
            {transitionMarkers.map((marker, index) => (
              <Marker key={`transition-${selectedIndex}-${index}`} coordinate={marker.coordinate} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.transitionMarker}>
                  <Ionicons
                    name={routeModeIcon(marker.mode) as React.ComponentProps<typeof Ionicons>['name']}
                    size={13}
                    color={Colors.white}
                  />
                </View>
              </Marker>
            ))}

            {/* Eco-business partner pins */}
            {partnerPins.map((p) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                title={p.businessName}
                description={p.coupon ? p.coupon.title : undefined}
                pinColor={Colors.amber600}
              />
            ))}

            {/* Mobility partner pickup stop for the selected route */}
            {selectedEcoRoute?.partnerStop && (
              <Marker
                key={`stop-${selectedEcoRoute.partnerStop.partnerId}`}
                coordinate={{
                  latitude: selectedEcoRoute.partnerStop.pickupLat,
                  longitude: selectedEcoRoute.partnerStop.pickupLng,
                }}
                title={selectedEcoRoute.partnerStop.partnerName}
                description={`Pick up ${selectedEcoRoute.partnerStop.vehicleType.toLowerCase().replace('_', ' ')} here`}
                pinColor="#10B981"
              />
            )}

            {/* Legacy nearby partner pins */}
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

          {/* Partner overlay pins */}
          {partnerPins.slice(0, 2).map((p, i) => (
            <View
              key={p.id}
              style={[styles.partnerPinAbsolute, { top: `${30 + i * 15}%` as any, left: `${35 + i * 12}%` as any }]}
            >
              <TouchableOpacity style={styles.pinCard} onPress={() => handlePartnerClick(p)} activeOpacity={0.9}>
                <Text style={styles.pinLogo}>🏪</Text>
                <View>
                  <Text style={styles.pinName} numberOfLines={1}>{p.businessName}</Text>
                  {p.coupon && (
                    <View style={styles.pinBadge}>
                      <Text style={styles.pinBadgeText}>{p.coupon.discountValue}% off</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          ))}

          {/* Legacy partner overlay */}
          {nearbyPartners.slice(0, 2).map((p, i) => (
            <View
              key={p.id}
              style={[styles.partnerPinAbsolute, { top: `${30 + i * 15}%` as any, left: `${35 + i * 12}%` as any }]}
            >
              <TouchableOpacity style={styles.pinCard} onPress={() => handlePartnerClick(p)} activeOpacity={0.9}>
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
                {hasEcoRoutes
                  ? routes.map((r, idx) => renderEcoRouteCard(r, idx))
                  : legacyRoutes.map((r: any, idx: number) => renderLegacyRouteCard(r, idx))
                }
              </View>

              {/* Car baseline comparison */}
              {ecoResponse?.carBaseline && (
                <View style={styles.baselineRow}>
                  <Ionicons name="car-outline" size={14} color={Colors.gray500} />
                  <Text style={styles.baselineText}>
                    Driving would emit {(ecoResponse.carBaseline.co2Grams / 1000).toFixed(1)} kg CO2
                    {' '}({ecoResponse.carBaseline.durationMin} min)
                  </Text>
                </View>
              )}

              {/* Partner pins section */}
              {partnerPins.length > 0 && (
                <View style={styles.partnersSection}>
                  <Text style={styles.partnersSectionTitle}>Eco Partners on Route</Text>
                  <View style={styles.partnerChipsRow}>
                    {partnerPins.slice(0, 4).map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.partnerChip}
                        onPress={() => handlePartnerClick(p)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.partnerChipText}>🏪 {p.businessName}</Text>
                        {p.coupon && <Text style={styles.partnerChipOffer}>{p.coupon.discountValue}% off</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Data quality note */}
              {ecoResponse && ecoResponse.dataQuality !== 'HIGH' && (
                <Text style={styles.dataQualityNote}>{ecoResponse.dataQualityMessage}</Text>
              )}

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

                {/* Partner info — handles both PartnerPin and NearbyPartner */}
                <View style={styles.partnerRow}>
                  <View style={styles.partnerLogoBox}>
                    <Text style={{ fontSize: 28 }}>🏪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ecoLabel}>Eco-Partner</Text>
                    <Text style={styles.partnerName}>
                      {'businessName' in selectedPartner ? selectedPartner.businessName : (selectedPartner as NearbyPartner).name}
                    </Text>
                    {'address' in selectedPartner && (
                      <Text style={styles.partnerDist}>{(selectedPartner as NearbyPartner).address}</Text>
                    )}
                    {'distanceFromRouteM' in selectedPartner && (
                      <Text style={styles.partnerDist}>
                        {(selectedPartner as PartnerPin).distanceFromRouteM < 1000
                          ? `${(selectedPartner as PartnerPin).distanceFromRouteM}m from route`
                          : `${((selectedPartner as PartnerPin).distanceFromRouteM / 1000).toFixed(1)} km from route`}
                      </Text>
                    )}
                    {'distanceM' in selectedPartner && (
                      <Text style={styles.partnerDist}>
                        {(selectedPartner as NearbyPartner).distanceM < 1000
                          ? `${(selectedPartner as NearbyPartner).distanceM}m from route`
                          : `${((selectedPartner as NearbyPartner).distanceM / 1000).toFixed(1)} km from route`}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Coupon info */}
                {('coupon' in selectedPartner) && (selectedPartner as PartnerPin).coupon && (
                  <View style={styles.offerBox}>
                    <View style={styles.offerTitleRow}>
                      <Ionicons name="gift-outline" size={20} color={Colors.emerald600} />
                      <Text style={styles.offerTitleText}>{(selectedPartner as PartnerPin).coupon!.title}</Text>
                    </View>
                    <Text style={styles.offerDesc}>
                      {(selectedPartner as PartnerPin).coupon!.discountValue}% off
                    </Text>
                  </View>
                )}
                {('activeCoupon' in selectedPartner) && (selectedPartner as NearbyPartner).activeCoupon && (
                  <View style={styles.offerBox}>
                    <View style={styles.offerTitleRow}>
                      <Ionicons name="gift-outline" size={20} color={Colors.emerald600} />
                      <Text style={styles.offerTitleText}>{(selectedPartner as NearbyPartner).activeCoupon!.title}</Text>
                    </View>
                    <Text style={styles.offerDesc}>
                      {(selectedPartner as NearbyPartner).activeCoupon!.discountValue}% off — redeem for{' '}
                      {(selectedPartner as NearbyPartner).activeCoupon!.pointsCost} points
                    </Text>
                  </View>
                )}

                <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.pointsRow}>
                  <Ionicons name="leaf-outline" size={20} color={Colors.emerald600} />
                  <View>
                    <Text style={styles.pointsTitle}>Eco-certified partner</Text>
                    <Text style={styles.pointsSub}>Visit on this route to earn points</Text>
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
      <Co2TransparencySheet
        visible={!!co2SheetRoute}
        data={co2DataFromRoute(co2SheetRoute)}
        onClose={() => setCo2SheetRoute(null)}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16, backgroundColor: Colors.white },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.gray900, textAlign: 'center' },
  emptySub: { fontSize: 14, color: Colors.gray500, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: Colors.emerald600, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  mapArea: { position: 'relative', overflow: 'hidden' },
  transitionMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.gray900,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
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
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12, ...Shadow.lg,
  },
  navIconWrap: { width: 36, height: 36, backgroundColor: Colors.emerald600, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { color: Colors.gray900, fontWeight: '600', fontSize: 13 },
  topBarSub: { color: Colors.emerald600, fontSize: 11, marginTop: 1 },

  panel: { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, ...Shadow.xl },
  panelHandle: { width: 48, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  panelContent: { paddingHorizontal: 24, paddingTop: 8 },
  panelTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 20, marginBottom: 16 },

  routeList: { gap: 12, marginBottom: 16 },
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
  co2InfoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 10 },
  co2InfoText: { color: Colors.emerald700, fontSize: 12, fontWeight: '600' },

  recommendedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.emerald100, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8,
  },
  recommendedText: { fontSize: 10, fontWeight: '700', color: Colors.emerald700 },

  partnerStopBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.emerald50, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8,
    borderWidth: 1, borderColor: Colors.emerald200,
  },
  partnerStopBadgeText: { fontSize: 10, fontWeight: '600', color: Colors.emerald700 },

  reasonRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.emerald200 },
  reasonText: { fontSize: 12, color: Colors.emerald700, fontStyle: 'italic' },
  syntheticNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  syntheticNoteText: { fontSize: 11, color: Colors.gray400, fontStyle: 'italic' },

  extraInfo: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  extraInfoText: { fontSize: 11, color: Colors.blue600, flex: 1 },
  priceTag: { fontSize: 11, fontWeight: '700', color: Colors.gray900 },

  baselineRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gray100, borderRadius: 8, padding: 10, marginBottom: 16,
  },
  baselineText: { fontSize: 12, color: Colors.gray600, flex: 1 },

  partnersSection: { marginBottom: 16 },
  partnersSectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.gray900, marginBottom: 8 },
  partnerChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  partnerChip: {
    backgroundColor: Colors.white, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.emerald200,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  partnerChipText: { fontSize: 11, color: Colors.emerald700 },
  partnerChipOffer: { fontSize: 10, color: Colors.emerald600, fontWeight: '700' },

  dataQualityNote: { fontSize: 11, color: Colors.gray400, textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },

  startBtn: { backgroundColor: Colors.emerald600, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...Shadow.lg },
  startBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },

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
