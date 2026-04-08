import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { api } from '@/lib/api';
import { routeStore } from '@/lib/routeStore';
import { decodePolyline } from '@/lib/polyline';

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function NavigationScreen() {
  const insets = useSafeAreaInsets();
  const [completing, setCompleting] = useState(false);

  const state = routeStore.get();
  const route = state ? state.routes[state.selectedIndex] : null;
  const polylineCoords = route?.polyline ? decodePolyline(route.polyline) : [];

  const originCoord = state
    ? { latitude: state.originLat, longitude: state.originLng }
    : { latitude: 37.7749, longitude: -122.4194 };
  const destCoord = state
    ? { latitude: state.destLat, longitude: state.destLng }
    : { latitude: 37.7849, longitude: -122.4094 };

  const midLat = (originCoord.latitude + destCoord.latitude) / 2;
  const midLng = (originCoord.longitude + destCoord.longitude) / 2;
  const initialRegion = {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: Math.abs(originCoord.latitude - destCoord.latitude) * 2.5 + 0.01,
    longitudeDelta: Math.abs(originCoord.longitude - destCoord.longitude) * 2.5 + 0.01,
  };

  const co2SavedKg = route
    ? (route.co2SavedVsCar / 1000).toFixed(2)
    : '0.00';

  // Animations
  const instructionAnim = useRef(new Animated.Value(-120)).current;
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  const modeAnim = useRef(new Animated.Value(-120)).current;
  const modeOpacity = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(120)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const leafScale = useRef(new Animated.Value(1)).current;

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

  const firstStep = route?.steps?.[0];

  const handleEndRoute = async () => {
    Alert.alert('End Route?', 'Do you want to complete this trip and save your impact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete Trip',
        style: 'default',
        onPress: async () => {
          setCompleting(true);
          try {
            if (state && route) {
              await api.post('/api/trips/complete', {
                mode: route.mode,
                originLat: state.originLat,
                originLng: state.originLng,
                destLat: state.destLat,
                destLng: state.destLng,
                originAddress: state.originAddress,
                destAddress: state.destAddress,
                distanceKm: route.distanceKm,
                durationMinutes: route.durationMinutes,
              });
            }
          } catch {
            // Even if API fails, continue to trip-completed screen
          } finally {
            setCompleting(false);
            router.push('/trip-completed');
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
        style={styles.mapArea}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        {polylineCoords.length > 1 ? (
          <Polyline coordinates={polylineCoords} strokeColor={Colors.emerald600} strokeWidth={6} />
        ) : (
          // Fallback straight line if no polyline
          <Polyline
            coordinates={[originCoord, destCoord]}
            strokeColor={Colors.emerald600}
            strokeWidth={6}
          />
        )}
        <Marker coordinate={originCoord} title="Start" pinColor={Colors.emerald600} />
        <Marker coordinate={destCoord} title="Destination" pinColor={Colors.red600} />
      </MapView>

      {/* Instruction Card */}
      <Animated.View
        style={[styles.instructionCard, { top: insets.top + 16, transform: [{ translateY: instructionAnim }], opacity: instructionOpacity }]}
      >
        <View style={styles.instructionIconBox}>
          <Ionicons name="arrow-up-outline" size={36} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          {firstStep ? (
            <>
              <Text style={styles.instructionText} numberOfLines={2}>{firstStep.instruction}</Text>
              <Text style={styles.instructionSub}>
                {firstStep.distanceM < 1000 ? `${firstStep.distanceM}m` : `${(firstStep.distanceM / 1000).toFixed(1)} km`}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.instructionText}>Head towards destination</Text>
              <Text style={styles.instructionSub}>{state?.destAddress ?? 'Destination'}</Text>
            </>
          )}
        </View>
      </Animated.View>

      {/* Mode Pill */}
      <Animated.View
        style={[styles.modePill, { top: insets.top + 120, transform: [{ translateX: modeAnim }], opacity: modeOpacity }]}
      >
        <Ionicons name={modeNavIcon(route?.mode ?? 'CYCLING')} size={20} color={Colors.emerald600} />
        <Text style={styles.modePillText}>{modeLabel(route?.mode ?? 'CYCLING')}</Text>
      </Animated.View>

      {/* Bottom Panel */}
      <Animated.View
        style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16, transform: [{ translateY: panelAnim }], opacity: panelOpacity }]}
      >
        {/* Route info */}
        <View style={styles.routeInfoRow}>
          <View style={styles.routeInfoItem}>
            <Text style={styles.routeInfoValue}>{route?.durationMinutes ?? '—'} min</Text>
            <Text style={styles.routeInfoLabel}>Duration</Text>
          </View>
          <View style={styles.routeInfoDivider} />
          <View style={styles.routeInfoItem}>
            <Text style={styles.routeInfoValue}>{route ? `${route.distanceKm.toFixed(1)} km` : '—'}</Text>
            <Text style={styles.routeInfoLabel}>Distance</Text>
          </View>
          <View style={styles.routeInfoDivider} />
          <View style={styles.routeInfoItem}>
            <Text style={[styles.routeInfoValue, { color: Colors.emerald600 }]}>+{route?.greenPoints ?? 0}</Text>
            <Text style={styles.routeInfoLabel}>Points</Text>
          </View>
        </View>

        {/* CO2 Counter */}
        <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.co2Box}>
          <View>
            <Text style={styles.co2Label}>CO₂ saved vs car</Text>
            <Text style={styles.co2Value}>{co2SavedKg} kg</Text>
          </View>
          <Animated.View style={[styles.leafEmoji, { transform: [{ scale: leafScale }] }]}>
            <Text style={{ fontSize: 24 }}>🌱</Text>
          </Animated.View>
        </LinearGradient>

        {/* Destination */}
        <View style={styles.destBox}>
          <Ionicons name="location-outline" size={16} color={Colors.red600} />
          <Text style={styles.destText} numberOfLines={1}>{state?.destAddress ?? 'Destination'}</Text>
        </View>

        {/* End Route */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  mapArea: { ...StyleSheet.absoluteFillObject },
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
  modePill: {
    position: 'absolute', left: 16,
    backgroundColor: Colors.white, borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    ...Shadow.md,
  },
  modePillText: { color: '#1A1A1A', fontWeight: '600', fontSize: 14 },
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
  destBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.gray50, borderRadius: 12, padding: 12 },
  destText: { flex: 1, color: '#1A1A1A', fontWeight: '500', fontSize: 14 },
  endBtn: {
    backgroundColor: Colors.red600, borderRadius: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...Shadow.md,
  },
  endBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
