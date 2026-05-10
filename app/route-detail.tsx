import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { Co2TransparencySheet } from '@/components/co2-transparency-sheet';
import { routeStore } from '@/lib/routeStore';
import { RouteStep } from '@/lib/types';
import { co2DataFromRoute } from '@/lib/co2Transparency';
import {
  flattenRouteSegments,
  getRouteMapSegments,
  getTransitionMarkers,
  routeModeIcon,
  routeModeStyle,
} from '@/lib/routeMap';
import { getMoodMeta } from '@/lib/mood';
import { saveRoute } from '@/lib/api';

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function stepIcon(mode: string): { icon: IoniconName; bg: string; color: string } {
  switch (mode.toUpperCase()) {
    case 'WALKING': return { icon: 'walk-outline', bg: Colors.blue100, color: Colors.blue600 };
    case 'CYCLING':
    case 'BICYCLING': return { icon: 'bicycle-outline', bg: Colors.emerald100, color: Colors.emerald600 };
    case 'TRANSIT':
    case 'BUS': return { icon: 'bus-outline', bg: Colors.purple100, color: Colors.purple600 };
    case 'TRAIN':
    case 'SUBWAY': return { icon: 'train-outline', bg: Colors.purple100, color: Colors.purple600 };
    case 'PLANE':
    case 'FLIGHT': return { icon: 'airplane-outline', bg: Colors.blue100, color: Colors.blue600 };
    case 'EV':
    case 'DRIVING': return { icon: 'car-outline', bg: Colors.amber100, color: Colors.amber700 };
    default: return { icon: 'navigate-outline', bg: Colors.gray100, color: Colors.gray600 };
  }
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m}m`;
}

function formatDuration(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}

type SaveState = 'idle' | 'saving' | 'saved';

export default function RouteDetailScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [co2SheetVisible, setCo2SheetVisible] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const state = routeStore.get();
  const selectedIndex = state?.selectedIndex ?? 0;

  // Prefer new EcoRoute format; fall back to legacy RouteOption
  const ecoRoute = state?.ecoResponse?.routes?.[selectedIndex];
  const legacyRoute = !state?.ecoResponse ? state?.routes?.[selectedIndex] : undefined;

  const routeLabel: string = ecoRoute
    ? (ecoRoute.subType === 'CYCLING_TRANSIT' ? 'Cycling + Transit' : ecoRoute.mode)
    : (legacyRoute?.label ?? 'Journey breakdown');

  // Derive steps: EcoRoute uses carbonBreakdown; legacy has steps[]
  const steps: RouteStep[] = ecoRoute?.carbonBreakdown?.map((leg) => ({
    mode: leg.mode,
    instruction: leg.instruction,
    distanceM: Math.round(leg.distanceKm * 1000),
    durationS: 0,
    polyline: leg.polyline,
    startLocation: leg.startLocation,
    endLocation: leg.endLocation,
  })) ?? legacyRoute?.steps ?? [];

  const partnerStop = ecoRoute?.partnerStop ?? null;
  const co2Grams: number = ecoRoute?.co2Grams ?? legacyRoute?.co2Grams ?? 0;
  const durationMinutes: number = ecoRoute?.durationMin ?? legacyRoute?.durationMinutes ?? 0;
  const distanceKm: number = ecoRoute?.distanceKm ?? legacyRoute?.distanceKm ?? 0;
  const greenPoints: number = ecoRoute?.greenPoints ?? legacyRoute?.greenPoints ?? 0;

  const selectedMood = state?.mood;
  const moodMeta = selectedMood ? getMoodMeta(selectedMood) : undefined;
  const moodReason = ecoRoute?.moodReason;

  const hasRoute = !!(ecoRoute ?? legacyRoute);
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
    () => getRouteMapSegments(ecoRoute ?? legacyRoute, ecoRoute?.mode ?? legacyRoute?.mode, originCoord, destCoord),
    [
      ecoRoute,
      legacyRoute,
      originCoord,
      destCoord,
    ],
  );
  const routeCoords = useMemo(() => flattenRouteSegments(routeSegments), [routeSegments]);
  const transitionMarkers = useMemo(() => getTransitionMarkers(routeSegments), [routeSegments]);
  const midLat = state ? (state.originLat + state.destLat) / 2 : 37.7749;
  const midLng = state ? (state.originLng + state.destLng) / 2 : -122.4194;
  const initialRegion = {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: state ? Math.abs(state.originLat - state.destLat) * 2 + 0.01 : 0.05,
    longitudeDelta: state ? Math.abs(state.originLng - state.destLng) * 2 + 0.01 : 0.05,
  };

  useEffect(() => {
    if (routeCoords.length < 2 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(routeCoords, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: false,
    });
  }, [routeCoords]);

  const handleSave = async () => {
    if (!ecoRoute || !state || saveState !== 'idle') return;
    setSaveState('saving');
    try {
      await saveRoute({
        originAddress: state.originAddress,
        destAddress: state.destAddress,
        originLat: state.originLat,
        originLng: state.originLng,
        destLat: state.destLat,
        destLng: state.destLng,
        mode: ecoRoute.mode,
        subType: ecoRoute.subType,
        distanceKm: ecoRoute.distanceKm,
        durationMin: ecoRoute.durationMin,
        co2Grams: ecoRoute.co2Grams,
        savedVsCar: ecoRoute.savedVsCar,
        carEquivalentCO2: ecoRoute.carEquivalentCO2,
        carbonScore: ecoRoute.carbonScore,
        greenPoints: ecoRoute.greenPoints,
        finalScore: ecoRoute.finalScore,
        mood: state.mood,
        moodReason: ecoRoute.moodReason,
        routeData: ecoRoute,
      });
      setSaveState('saved');
    } catch {
      setSaveState('idle');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Map Area */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          scrollEnabled
          zoomEnabled
          pitchEnabled
          rotateEnabled
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
          {originCoord && <Marker coordinate={originCoord} title="Start" pinColor={Colors.emerald600} />}
          {destCoord && <Marker coordinate={destCoord} title="Destination" pinColor={Colors.red600} />}
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

        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 16 }]}
          onPress={() => router.back()}
          activeOpacity={0.9}
        >
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
          <Text style={styles.sheetTitle}>
            {routeLabel}
          </Text>

          {moodMeta && (
            <View style={styles.moodBadgeWrap}>
              <Ionicons
                name={moodMeta.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={22}
                color={Colors.emerald700}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.moodBadgeLabel}>Optimized for: {moodMeta.label}</Text>
                {moodReason && <Text style={styles.moodBadgeReason}>{moodReason}</Text>}
              </View>
            </View>
          )}

          {partnerStop && (
            <View style={styles.partnerCard}>
              <View style={styles.partnerCardHeader}>
                <View style={styles.partnerCardIcon}>
                  <Ionicons name="bicycle-outline" size={20} color={Colors.emerald600} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerCardTitle}>{partnerStop.partnerName}</Text>
                  <Text style={styles.partnerCardSub}>
                    Pick up {partnerStop.vehicleType.toLowerCase().replace('_', ' ')} — partner stop on route
                  </Text>
                </View>
                <View style={styles.partnerCardBadge}>
                  <Text style={styles.partnerCardBadgeText}>Partner</Text>
                </View>
              </View>
              {partnerStop.pickupAddress && (
                <Text style={styles.partnerCardAddress}>
                  <Ionicons name="location-outline" size={12} color={Colors.gray500} /> {partnerStop.pickupAddress}
                </Text>
              )}
            </View>
          )}

          {steps.length > 0 ? (
            <View style={styles.stepsWrap}>
              {steps.map((step: RouteStep, index: number) => {
                const { icon, bg, color } = stepIcon(step.mode);
                return (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <View style={[styles.stepIconBox, { backgroundColor: bg }]}>
                        <Ionicons name={icon} size={20} color={color} />
                      </View>
                      {index < steps.length - 1 && <View style={styles.stepConnector} />}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepInstruction}>{step.instruction}</Text>
                      <Text style={styles.stepMeta}>
                        {formatDistance(step.distanceM)}{step.durationS > 0 ? ` • ${formatDuration(step.durationS)}` : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noSteps}>
              <Text style={styles.noStepsText}>No step-by-step breakdown available for this route.</Text>
            </View>
          )}

          {/* Summary */}
          {hasRoute && (
            <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="leaf-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                  <Text style={styles.summaryValue}>{co2Grams}g</Text>
                  <Text style={styles.summaryLabel}>CO₂</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="time-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                  <Text style={styles.summaryValue}>{durationMinutes} min</Text>
                  <Text style={styles.summaryLabel}>Duration</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="location-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                  <Text style={styles.summaryValue}>{distanceKm.toFixed(1)} km</Text>
                  <Text style={styles.summaryLabel}>Distance</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="flash-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                  <Text style={styles.summaryValue}>+{greenPoints}</Text>
                  <Text style={styles.summaryLabel}>Points</Text>
                </View>
              </View>
            </LinearGradient>
          )}

          {hasRoute && (
            <TouchableOpacity
              style={styles.co2InfoBtn}
              onPress={() => setCo2SheetVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle-outline" size={16} color={Colors.emerald700} />
              <Text style={styles.co2InfoText}>How is CO₂ calculated?</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.footerRow}>
            {ecoRoute && (
              <TouchableOpacity
                style={[styles.saveBtn, saveState === 'saved' && styles.saveBtnSaved]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={saveState !== 'idle'}
              >
                <Ionicons
                  name={saveState === 'saved' ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={saveState === 'saved' ? Colors.emerald600 : Colors.gray600}
                />
                <Text style={[styles.saveBtnText, saveState === 'saved' && styles.saveBtnTextSaved]}>
                  {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => router.push('/navigation')}
              activeOpacity={0.9}
            >
              <Ionicons name="navigate-outline" size={20} color={Colors.white} />
              <Text style={styles.startBtnText}>Start Route</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  mapArea: { height: '45%', position: 'relative', overflow: 'hidden' },
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
  backBtn: {
    position: 'absolute', left: 16,
    width: 40, height: 40, backgroundColor: Colors.white, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', ...Shadow.md,
  },
  sheet: { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, ...Shadow.xl },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetScroll: { flex: 1, paddingHorizontal: 24 },
  sheetTitle: { color: '#1A1A1A', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  moodBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.emerald50,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.emerald100,
  },
  moodBadgeLabel: { color: Colors.emerald800, fontWeight: '600', fontSize: 13 },
  moodBadgeReason: { color: Colors.emerald700, fontSize: 12, marginTop: 2 },
  stepsWrap: { gap: 0, marginBottom: 24 },
  stepRow: { flexDirection: 'row', gap: 16 },
  stepLeft: { alignItems: 'center' },
  stepIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepConnector: { width: 1, flex: 1, backgroundColor: Colors.gray200, marginVertical: 4, minHeight: 32 },
  stepContent: { flex: 1, paddingBottom: 20 },
  stepInstruction: { color: '#1A1A1A', fontWeight: '600', fontSize: 15, marginBottom: 4 },
  stepMeta: { color: Colors.gray600, fontSize: 13 },
  noSteps: { paddingVertical: 24, alignItems: 'center' },
  noStepsText: { color: Colors.gray500, fontSize: 14, textAlign: 'center' },

  partnerCard: {
    backgroundColor: Colors.emerald50, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.emerald200, marginBottom: 20,
  },
  partnerCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partnerCardIcon: {
    width: 40, height: 40, backgroundColor: Colors.emerald100,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  partnerCardTitle: { color: '#1A1A1A', fontWeight: '700', fontSize: 15, marginBottom: 2 },
  partnerCardSub: { color: Colors.gray600, fontSize: 12 },
  partnerCardBadge: {
    backgroundColor: Colors.emerald600, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  partnerCardBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  partnerCardAddress: { color: Colors.gray500, fontSize: 12, marginTop: 8, marginLeft: 52 },
  summaryBox: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.emerald100, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryIcon: { marginBottom: 4 },
  summaryValue: { color: '#1A1A1A', fontWeight: '700', fontSize: 15 },
  summaryLabel: { color: Colors.gray600, fontSize: 12, marginTop: 2 },
  co2InfoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginBottom: 16 },
  co2InfoText: { color: Colors.emerald700, fontSize: 13, fontWeight: '700' },
  footerWrap: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: Colors.gray100, borderRadius: 20, ...Shadow.sm,
  },
  saveBtnSaved: { backgroundColor: Colors.emerald50 },
  saveBtnText: { color: Colors.gray600, fontWeight: '600', fontSize: 15 },
  saveBtnTextSaved: { color: Colors.emerald600 },
  startBtn: {
    flex: 1, backgroundColor: Colors.emerald600, borderRadius: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...Shadow.lg,
  },
  startBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
