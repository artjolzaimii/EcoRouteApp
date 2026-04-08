import React from 'react';
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
import { routeStore } from '@/lib/routeStore';
import { RouteStep } from '@/lib/types';

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { decodePolyline } from '@/lib/polyline';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function stepIcon(mode: string): { icon: IoniconName; bg: string; color: string } {
  switch (mode.toUpperCase()) {
    case 'WALKING': return { icon: 'walk-outline', bg: Colors.blue100, color: Colors.blue600 };
    case 'CYCLING': return { icon: 'bicycle-outline', bg: Colors.emerald100, color: Colors.emerald600 };
    case 'TRANSIT':
    case 'BUS': return { icon: 'bus-outline', bg: Colors.purple100, color: Colors.purple600 };
    case 'TRAIN':
    case 'SUBWAY': return { icon: 'train-outline', bg: Colors.purple100, color: Colors.purple600 };
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

export default function RouteDetailScreen() {
  const insets = useSafeAreaInsets();
  const state = routeStore.get();
  const route = state ? state.routes[state.selectedIndex] : null;
  const polylineCoords = route?.polyline ? decodePolyline(route.polyline) : [];

  const originCoord = state ? { latitude: state.originLat, longitude: state.originLng } : null;
  const destCoord = state ? { latitude: state.destLat, longitude: state.destLng } : null;
  const midLat = state ? (state.originLat + state.destLat) / 2 : 37.7749;
  const midLng = state ? (state.originLng + state.destLng) / 2 : -122.4194;
  const initialRegion = {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: state ? Math.abs(state.originLat - state.destLat) * 2 + 0.01 : 0.05,
    longitudeDelta: state ? Math.abs(state.originLng - state.destLng) * 2 + 0.01 : 0.05,
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Map Area */}
      <View style={styles.mapArea}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          {polylineCoords.length > 1 && (
            <Polyline coordinates={polylineCoords} strokeColor={Colors.emerald600} strokeWidth={4} />
          )}
          {originCoord && <Marker coordinate={originCoord} title="Start" pinColor={Colors.emerald600} />}
          {destCoord && <Marker coordinate={destCoord} title="Destination" pinColor={Colors.red600} />}
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
            {route ? route.label : 'Journey breakdown'}
          </Text>

          {route && route.steps.length > 0 ? (
            <View style={styles.stepsWrap}>
              {route.steps.map((step: RouteStep, index: number) => {
                const { icon, bg, color } = stepIcon(step.mode);
                return (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <View style={[styles.stepIconBox, { backgroundColor: bg }]}>
                        <Ionicons name={icon} size={20} color={color} />
                      </View>
                      {index < route.steps.length - 1 && <View style={styles.stepConnector} />}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepInstruction}>{step.instruction}</Text>
                      <Text style={styles.stepMeta}>
                        {formatDistance(step.distanceM)} • {formatDuration(step.durationS)}
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
          {route && (
            <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="leaf-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                  <Text style={styles.summaryValue}>{route.co2Grams}g</Text>
                  <Text style={styles.summaryLabel}>CO₂</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="time-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                  <Text style={styles.summaryValue}>{route.durationMinutes} min</Text>
                  <Text style={styles.summaryLabel}>Duration</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="location-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                  <Text style={styles.summaryValue}>{route.distanceKm.toFixed(1)} km</Text>
                  <Text style={styles.summaryLabel}>Distance</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="flash-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                  <Text style={styles.summaryValue}>+{route.greenPoints}</Text>
                  <Text style={styles.summaryLabel}>Points</Text>
                </View>
              </View>
            </LinearGradient>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 16 }]}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  mapArea: { height: '45%', position: 'relative', overflow: 'hidden' },
  backBtn: {
    position: 'absolute', left: 16,
    width: 40, height: 40, backgroundColor: Colors.white, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', ...Shadow.md,
  },
  sheet: { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, ...Shadow.xl },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetScroll: { flex: 1, paddingHorizontal: 24 },
  sheetTitle: { color: '#1A1A1A', fontSize: 20, fontWeight: '700', marginBottom: 16 },
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
  summaryBox: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.emerald100, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryIcon: { marginBottom: 4 },
  summaryValue: { color: '#1A1A1A', fontWeight: '700', fontSize: 15 },
  summaryLabel: { color: Colors.gray600, fontSize: 12, marginTop: 2 },
  footerWrap: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  startBtn: {
    backgroundColor: Colors.emerald600, borderRadius: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...Shadow.lg,
  },
  startBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
