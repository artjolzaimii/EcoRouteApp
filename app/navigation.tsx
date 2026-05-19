import { Co2TransparencySheet } from '@/components/co2-transparency-sheet';
import { Colors, Shadow } from '@/constants/theme';
import { api } from '@/lib/api';
import { co2DataFromRoute } from '@/lib/co2Transparency';
import { haversineDistance } from '@/lib/geoUtils';
import {
  flattenRouteSegments,
  getRouteMapSegments,
  getTransitionMarkers,
  routeModeIcon,
  routeModeStyle,
} from '@/lib/routeMap';
import { routeStore } from '@/lib/routeStore';
import { tripResultStore } from '@/lib/tripResultStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapView, { Marker, Polyline } from 'react-native-maps';

const STEP_ADVANCE_THRESHOLD_M = 30;

function modeLabel(mode: string): string {
  switch (mode) {
    case 'CYCLING': return 'Cycling';
    case 'TRANSIT': return 'Transit';
    case 'WALKING': return 'Walking';
    case 'CYCLING_TRANSIT': return 'Cycling + Transit';
    case 'EV': return 'Electric Vehicle';
    default: return 'Navigating';
  }
}

function modeNavIcon(mode: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (mode) {
    case 'CYCLING': return 'bicycle-outline';
    case 'TRANSIT': return 'bus-outline';
    case 'WALKING': return 'footsteps-outline';
    case 'CYCLING_TRANSIT': return 'git-merge-outline';
    default: return 'navigate-outline';
  }
}

function toTripMode(mode: string): string {
  switch (mode.toUpperCase()) {
    case 'BICYCLING': return 'CYCLING';
    case 'MIXED':     return 'CYCLING_TRANSIT';
    case 'TRAIN':     return 'TRANSIT';
    case 'PLANE':     return 'TRANSIT';
    default:          return mode.toUpperCase();
  }
}

function formatDistance(metres: number): string {
  return metres < 1000 ? `${metres} m` : `${(metres / 1000).toFixed(1)} km`;
}

export default function NavigationScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [completing, setCompleting] = useState(false);
  const [co2SheetVisible, setCo2SheetVisible] = useState(false);

  // ── Step tracking ──────────────────────────────────────
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToNext, setDistanceToNext] = useState<number | null>(null);
  const [cameraLocked, setCameraLocked] = useState(true);

  // Refs mirror state so the location callback closure never goes stale
  const stepIndexRef = useRef(0);
  const cameraLockedRef = useRef(true);
  const locationSubRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => { stepIndexRef.current = currentStepIndex; }, [currentStepIndex]);
  useEffect(() => { cameraLockedRef.current = cameraLocked; }, [cameraLocked]);

  // ── Route data ─────────────────────────────────────────
  const state = routeStore.get();
  const selectedIndex = state?.selectedIndex ?? 0;

  const ecoRoute = state?.ecoResponse?.routes?.[selectedIndex];
  const legacyRoute = !state?.ecoResponse ? state?.routes?.[selectedIndex] : undefined;

  const routeMode: string   = ecoRoute?.mode ?? legacyRoute?.mode ?? 'CYCLING';
  const partnerStop = ecoRoute?.partnerStop ?? null;
  const distanceKm: number  = ecoRoute?.distanceKm ?? legacyRoute?.distanceKm ?? 0;
  const durationMin: number = ecoRoute?.durationMin ?? legacyRoute?.durationMinutes ?? 0;
  const greenPoints: number = ecoRoute?.greenPoints ?? legacyRoute?.greenPoints ?? 0;
  const co2SavedG: number   = ecoRoute?.savedVsCar ?? legacyRoute?.co2SavedVsCar ?? 0;
  const co2EmittedG: number = ecoRoute?.co2Grams ?? legacyRoute?.co2Grams ?? 0;
  const carBaselineG: number = ecoRoute?.carEquivalentCO2 ?? co2SavedG + co2EmittedG;
  const steps = legacyRoute?.steps ?? ecoRoute?.carbonBreakdown?.map((leg) => ({
    mode: leg.mode,
    instruction: leg.instruction,
    distanceM: Math.round(leg.distanceKm * 1000),
    durationS: 0,
    polyline: leg.polyline,
    startLocation: leg.startLocation,
    endLocation: leg.endLocation,
  })) ?? [];

  const originLat = state?.originLat;
  const originLng = state?.originLng;
  const destLat = state?.destLat;
  const destLng = state?.destLng;
  const originCoord = useMemo(
    () => originLat != null && originLng != null
      ? { latitude: originLat, longitude: originLng }
      : { latitude: 37.7749, longitude: -122.4194 },
    [originLat, originLng],
  );
  const destCoord = useMemo(
    () => destLat != null && destLng != null
      ? { latitude: destLat, longitude: destLng }
      : { latitude: 37.7849, longitude: -122.4094 },
    [destLat, destLng],
  );

  const midLat = (originCoord.latitude + destCoord.latitude) / 2;
  const midLng = (originCoord.longitude + destCoord.longitude) / 2;
  const initialRegion = {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: Math.abs(originCoord.latitude - destCoord.latitude) * 2.5 + 0.01,
    longitudeDelta: Math.abs(originCoord.longitude - destCoord.longitude) * 2.5 + 0.01,
  };

  const routeSegments = useMemo(
    () => getRouteMapSegments(ecoRoute ?? legacyRoute, routeMode, originCoord, destCoord),
    [ecoRoute, legacyRoute, routeMode, originCoord, destCoord],
  );
  const routeCoords = useMemo(() => flattenRouteSegments(routeSegments), [routeSegments]);
  const transitionMarkers = useMemo(() => getTransitionMarkers(routeSegments), [routeSegments]);

  const co2SavedKg = (co2SavedG / 1000).toFixed(2);

  // ── Animations ─────────────────────────────────────────
  const instructionAnim = useRef(new Animated.Value(-120)).current;
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  const modeAnim = useRef(new Animated.Value(-120)).current;
  const modeOpacity = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(120)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const leafScale = useRef(new Animated.Value(1)).current;

  // Entry animations
  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.spring(instructionAnim, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
        Animated.timing(instructionOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(modeAnim, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
        Animated.timing(modeOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(panelAnim, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
        Animated.timing(panelOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(leafScale, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
        Animated.timing(leafScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  // Fit map to route on load
  useEffect(() => {
    if (routeCoords.length < 2 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(routeCoords, {
      edgePadding: { top: 160, right: 48, bottom: 260, left: 48 },
      animated: false,
    });
  }, [routeCoords]);

  // ── Instruction card step-change animation ─────────────
  const triggerInstructionAnimation = useCallback(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(instructionAnim, { toValue: -40, duration: 200, useNativeDriver: true }),
        Animated.timing(instructionOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(instructionAnim, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
        Animated.timing(instructionOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [instructionAnim, instructionOpacity]);

  // ── GPS watch ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const Location = require('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          (loc: { coords: { latitude: number; longitude: number } }) => {
            handleLocationUpdate(loc.coords.latitude, loc.coords.longitude);
          },
        );
        if (!cancelled) {
          locationSubRef.current = sub;
        } else {
          sub.remove();
        }
      } catch {
        // expo-location unavailable or permissions denied — graceful no-op
      }
    })();

    return () => {
      cancelled = true;
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
  }, []);

  function handleLocationUpdate(latitude: number, longitude: number) {
    // Follow camera
    if (cameraLockedRef.current && mapRef.current) {
      mapRef.current.animateCamera(
        { center: { latitude, longitude }, zoom: 17 },
        { duration: 600 },
      );
    }

    // Step advancement
    const step = steps[stepIndexRef.current];
    if (!step?.endLocation) return;

    const dist = haversineDistance(
      latitude, longitude,
      step.endLocation.lat, step.endLocation.lng,
    );
    setDistanceToNext(Math.round(dist));

    if (dist < STEP_ADVANCE_THRESHOLD_M && stepIndexRef.current < steps.length - 1) {
      const next = stepIndexRef.current + 1;
      stepIndexRef.current = next;
      setCurrentStepIndex(next);
      setDistanceToNext(null);
      triggerInstructionAnimation();
    }
  }

  // ── Current step ───────────────────────────────────────
  const currentStep = steps[currentStepIndex] ?? null;

  // ── Trip completion ────────────────────────────────────
  const handleEndRoute = async () => {
    Alert.alert('End Route?', 'Do you want to complete this trip and save your impact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete Trip',
        style: 'default',
        onPress: async () => {
          if (ecoRoute?.geometry) {
            api.post('/api/heatmap/save', {
              encoded_polyline: ecoRoute.geometry,
              co2_saved_kg: co2SavedG / 1000,
              distance_km: distanceKm,
            }).catch(() => {});
          }
          setCompleting(true);
          try {
            if (state) {
              const cyclingDistanceKm = ecoRoute?.carbonBreakdown
                ?.filter(leg => leg.mode === 'CYCLING' || leg.mode === 'BICYCLING')
                .reduce((sum, leg) => sum + leg.distanceKm, 0) ?? 0;

              const res = await api.post<{
                pointsEarned: number;
                streakBonusPoints: number;
                newBalance: number;
                currentStreak: number;
              }>('/api/trips/complete', {
                mode: toTripMode(routeMode),
                originLat: state.originLat,
                originLng: state.originLng,
                destLat: state.destLat,
                destLng: state.destLng,
                originAddress: state.originAddress,
                destAddress: state.destAddress,
                distanceKm,
                durationMinutes: durationMin,
                co2SavedGrams: co2SavedG,
                co2EmittedGrams: co2EmittedG,
                greenPoints,
                ...(cyclingDistanceKm > 0 ? { cyclingDistanceKm } : {}),
              });

              tripResultStore.set({
                co2SavedGrams: co2SavedG,
                co2EmittedGrams: co2EmittedG,
                carBaselineGrams: carBaselineG,
                pointsEarned: res?.pointsEarned ?? greenPoints,
                streakBonusPoints: res?.streakBonusPoints ?? 0,
                newBalance: res?.newBalance ?? 0,
                currentStreak: res?.currentStreak ?? 0,
                distanceKm,
                durationMinutes: durationMin,
                mode: routeMode,
              });
            }
          } catch {
            tripResultStore.set({
              co2SavedGrams: co2SavedG,
              co2EmittedGrams: co2EmittedG,
              carBaselineGrams: carBaselineG,
              pointsEarned: greenPoints,
              streakBonusPoints: 0,
              newBalance: 0,
              currentStreak: 0,
              distanceKm,
              durationMinutes: durationMin,
              mode: routeMode,
            });
          } finally {
            setCompleting(false);
            router.replace('/trip-completed');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full-screen map */}
      <MapView
        ref={mapRef}
        style={styles.mapArea}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        scrollEnabled
        zoomEnabled
        pitchEnabled
        rotateEnabled
        onPanDrag={() => {
          if (cameraLockedRef.current) setCameraLocked(false);
        }}
      >
        {routeSegments.map((segment, index) => {
          const style = routeModeStyle(segment.mode);
          return (
            <Polyline
              key={`route-segment-${index}`}
              coordinates={segment.coordinates}
              strokeColor={style.strokeColor}
              strokeWidth={style.strokeWidth}
              lineDashPattern={style.lineDashPattern}
              zIndex={10 + index}
            />
          );
        })}
        <Marker coordinate={originCoord} title="Start" pinColor={Colors.emerald600} />
        <Marker coordinate={destCoord} title="Destination" pinColor={Colors.red600} />
        {transitionMarkers.map((marker, index) => (
          <Marker key={`transition-${index}`} coordinate={marker.coordinate} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.transitionMarker}>
              <Ionicons
                name={routeModeIcon(marker.mode) as React.ComponentProps<typeof Ionicons>['name']}
                size={13}
                color={Colors.white}
              />
            </View>
          </Marker>
        ))}
        {partnerStop && (
          <Marker
            coordinate={{ latitude: partnerStop.pickupLat, longitude: partnerStop.pickupLng }}
            title={partnerStop.partnerName}
            description={`Pick up ${partnerStop.vehicleType.toLowerCase().replace('_', ' ')} here`}
            pinColor="#10B981"
          />
        )}
      </MapView>

      {/* Instruction Card */}
      <Animated.View
        style={[styles.instructionCard, { top: insets.top + 16, transform: [{ translateY: instructionAnim }], opacity: instructionOpacity }]}
      >
        <View style={styles.instructionIconBox}>
          <Ionicons name="arrow-up-outline" size={36} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          {currentStep ? (
            <>
              <Text style={styles.instructionText} numberOfLines={2}>{currentStep.instruction}</Text>
              <Text style={styles.instructionSub}>
                {distanceToNext != null
                  ? formatDistance(distanceToNext)
                  : formatDistance(currentStep.distanceM)
                }
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.instructionText}>Head towards destination</Text>
              <Text style={styles.instructionSub}>{state?.destAddress ?? 'Destination'}</Text>
            </>
          )}
        </View>
        {/* Step progress counter */}
        {steps.length > 1 && (
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{currentStepIndex + 1}/{steps.length}</Text>
          </View>
        )}
      </Animated.View>

      {/* Mode Pill */}
      <Animated.View
        style={[styles.modePill, { top: insets.top + 120, transform: [{ translateX: modeAnim }], opacity: modeOpacity }]}
      >
        <Ionicons name={modeNavIcon(routeMode)} size={20} color={Colors.emerald600} />
        <Text style={styles.modePillText}>{modeLabel(routeMode)}</Text>
      </Animated.View>

      {/* Camera lock button */}
      <TouchableOpacity
        style={[styles.cameraLockBtn, { top: insets.top + 120 }]}
        onPress={() => setCameraLocked(l => !l)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={cameraLocked ? 'navigate' : 'navigate-outline'}
          size={20}
          color={cameraLocked ? Colors.emerald600 : Colors.gray400}
        />
      </TouchableOpacity>

      {/* Bottom Panel */}
      <Animated.View
        style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16, transform: [{ translateY: panelAnim }], opacity: panelOpacity }]}
      >
        <View style={styles.routeInfoRow}>
          <View style={styles.routeInfoItem}>
            <Text style={styles.routeInfoValue}>{durationMin > 0 ? `${durationMin} min` : '—'}</Text>
            <Text style={styles.routeInfoLabel}>Duration</Text>
          </View>
          <View style={styles.routeInfoDivider} />
          <View style={styles.routeInfoItem}>
            <Text style={styles.routeInfoValue}>{distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : '—'}</Text>
            <Text style={styles.routeInfoLabel}>Distance</Text>
          </View>
          <View style={styles.routeInfoDivider} />
          <View style={styles.routeInfoItem}>
            <Text style={[styles.routeInfoValue, { color: Colors.emerald600 }]}>+{greenPoints}</Text>
            <Text style={styles.routeInfoLabel}>Points</Text>
          </View>
        </View>

        <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.co2Box}>
          <View>
            <Text style={styles.co2Label}>CO₂ saved vs car</Text>
            <Text style={styles.co2Value}>{co2SavedKg} kg</Text>
          </View>
          <Animated.View style={[styles.leafEmoji, { transform: [{ scale: leafScale }] }]}>
            <Text style={{ fontSize: 24 }}>🌱</Text>
          </Animated.View>
        </LinearGradient>

        <TouchableOpacity
          style={styles.co2InfoBtn}
          onPress={() => setCo2SheetVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle-outline" size={15} color={Colors.emerald700} />
          <Text style={styles.co2InfoText}>How is CO₂ calculated?</Text>
        </TouchableOpacity>

        <View style={styles.destBox}>
          <Ionicons name="location-outline" size={16} color={Colors.red600} />
          <Text style={styles.destText} numberOfLines={1}>{state?.destAddress ?? 'Destination'}</Text>
        </View>

        <TouchableOpacity
          style={[styles.endBtn, completing && { opacity: 0.7 }]}
          onPress={handleEndRoute}
          activeOpacity={0.9}
          disabled={completing}
        >
          <Ionicons name="close-outline" size={20} color={Colors.white} />
          <Text style={styles.endBtnText}>{completing ? 'Saving trip…' : 'End Route'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Co2TransparencySheet
        visible={co2SheetVisible}
        data={co2DataFromRoute(ecoRoute ?? legacyRoute)}
        onClose={() => setCo2SheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  mapArea: { ...StyleSheet.absoluteFillObject },
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
  instructionCard: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: Colors.white, borderRadius: 24,
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
    ...Shadow.xl,
  },
  instructionIconBox: {
    width: 64, height: 64, backgroundColor: Colors.emerald600, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  instructionText: { color: '#1A1A1A', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  instructionSub: { color: Colors.gray600, fontSize: 15, fontWeight: '600' },
  stepBadge: {
    backgroundColor: Colors.emerald50,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.emerald100,
    flexShrink: 0,
  },
  stepBadgeText: { color: Colors.emerald700, fontSize: 12, fontWeight: '700' },
  modePill: {
    position: 'absolute', left: 16,
    backgroundColor: Colors.white, borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    ...Shadow.md,
  },
  modePillText: { color: '#1A1A1A', fontWeight: '600', fontSize: 14 },
  cameraLockBtn: {
    position: 'absolute', right: 16,
    width: 40, height: 40,
    backgroundColor: Colors.white, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 20, gap: 14,
    ...Shadow.xl,
  },
  routeInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 4 },
  routeInfoItem: { alignItems: 'center' },
  routeInfoValue: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  routeInfoLabel: { fontSize: 12, color: Colors.gray500, marginTop: 2 },
  routeInfoDivider: { width: 1, height: 32, backgroundColor: Colors.gray200 },
  co2Box: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.emerald100 },
  co2Label: { color: Colors.gray600, fontSize: 13, marginBottom: 4 },
  co2Value: { color: Colors.emerald600, fontSize: 24, fontWeight: '700' },
  leafEmoji: { width: 48, height: 48, backgroundColor: Colors.emerald100, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  co2InfoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: -6 },
  co2InfoText: { color: Colors.emerald700, fontSize: 12, fontWeight: '700' },
  destBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.gray50, borderRadius: 12, padding: 12 },
  destText: { flex: 1, color: '#1A1A1A', fontWeight: '500', fontSize: 14 },
  endBtn: {
    backgroundColor: Colors.red600, borderRadius: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...Shadow.md,
  },
  endBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
