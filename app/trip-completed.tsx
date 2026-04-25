import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { tripResultStore, TripResult } from '@/lib/tripResultStore';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

function modeDisplay(mode: string): string {
  switch (mode.toUpperCase()) {
    case 'CYCLING':
    case 'BICYCLING':    return 'Cycling';
    case 'WALKING':      return 'Walking';
    case 'TRANSIT':      return 'Transit';
    case 'CYCLING_TRANSIT':
    case 'MIXED':        return 'Cycling + Transit';
    case 'TRAIN':        return 'Train';
    case 'PLANE':        return 'Flight';
    case 'EV':           return 'Electric Vehicle';
    default:             return mode;
  }
}

export default function TripCompletedScreen() {
  const insets = useSafeAreaInsets();

  // Consume the trip result once — keep a local copy for the lifetime of this screen
  const [result] = useState<TripResult | null>(() => tripResultStore.consume());

  const co2Kg      = result ? (result.co2SavedGrams / 1000).toFixed(2) : '0.00';
  const points     = result?.pointsEarned ?? 0;
  const bonus      = result?.streakBonusPoints ?? 0;
  const totalPoints = points + bonus;
  const distanceKm = result ? result.distanceKm.toFixed(1) : '—';
  const duration   = result ? `${result.durationMinutes} min` : '—';
  const modeText   = result ? modeDisplay(result.mode) : '—';

  // Animations
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(20)).current;
  const iconScale    = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide   = useRef(new Animated.Value(20)).current;
  const co2Scale     = useRef(new Animated.Value(0.9)).current;
  const co2Opacity   = useRef(new Animated.Value(0)).current;
  const pointsOpacity = useRef(new Animated.Value(0)).current;
  const pointsSlide  = useRef(new Animated.Value(20)).current;
  const summaryOpacity = useRef(new Animated.Value(0)).current;
  const summarySlide = useRef(new Animated.Value(20)).current;
  const motiveOpacity = useRef(new Animated.Value(0)).current;
  const btnsOpacity  = useRef(new Animated.Value(0)).current;
  const btnsSlide    = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleSlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.spring(co2Scale,   { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(co2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(pointsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(pointsSlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(summaryOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(summarySlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(700),
      Animated.timing(motiveOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(btnsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(btnsSlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Success Icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.white} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleSlide }] }]}>
            Trip completed!
          </Animated.Text>

          {/* CO2 Saved */}
          <Animated.View style={[styles.co2Card, { transform: [{ scale: co2Scale }], opacity: co2Opacity }]}>
            <View style={styles.co2Row}>
              <Ionicons name="leaf" size={32} color={ECO_GREEN} />
              <Text style={styles.co2Value}>{co2Kg} kg</Text>
            </View>
            <Text style={styles.co2Label}>CO₂ saved vs driving</Text>
          </Animated.View>

          {/* Points */}
          <Animated.View style={{ opacity: pointsOpacity, transform: [{ translateY: pointsSlide }], width: '100%' }}>
            <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.pointsBox}>
              <View style={styles.pointsRow}>
                <Ionicons name="flash-outline" size={24} color={ECO_GREEN} />
                <Text style={styles.pointsValue}>+{totalPoints}</Text>
              </View>
              <Text style={styles.pointsLabel}>Green Points earned</Text>
              {bonus > 0 && (
                <Text style={styles.bonusText}>Includes +{bonus} streak bonus 🔥</Text>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Journey Summary */}
          <Animated.View style={[styles.summaryCard, { opacity: summaryOpacity, transform: [{ translateY: summarySlide }] }]}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Ionicons name="location-outline" size={20} color={Colors.gray600} style={styles.summaryIcon} />
                <Text style={styles.summaryValue}>{distanceKm} km</Text>
                <Text style={styles.summaryItemLabel}>Distance</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="time-outline" size={20} color={Colors.gray600} style={styles.summaryIcon} />
                <Text style={styles.summaryValue}>{duration}</Text>
                <Text style={styles.summaryItemLabel}>Duration</Text>
              </View>
            </View>
            <View style={styles.modeRow}>
              <Text style={styles.modeLabel}>Transport mode</Text>
              <Text style={styles.modeValue}>{modeText}</Text>
            </View>
          </Animated.View>

          {/* Motivational */}
          <Animated.Text style={[styles.motive, { opacity: motiveOpacity }]}>
            Every green trip counts! 🌍
          </Animated.Text>

          {/* Buttons */}
          <Animated.View style={[styles.btnsWrap, { opacity: btnsOpacity, transform: [{ translateY: btnsSlide }] }]}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/(tabs)/impact')} activeOpacity={0.9}>
              <Text style={styles.outlineBtnText}>View Impact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.9}>
              <Text style={styles.primaryBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </Animated.View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
  inner: { alignItems: 'center' },

  iconWrap: { marginBottom: 24 },
  iconCircle: {
    width: 128, height: 128, backgroundColor: Colors.emerald600, borderRadius: 64,
    alignItems: 'center', justifyContent: 'center', ...Shadow.xl,
  },

  title: { color: '#1A1A1A', fontSize: 28, fontWeight: '700', marginBottom: 16 },

  co2Card: {
    backgroundColor: Colors.white, borderRadius: 28, padding: 24,
    alignItems: 'center', width: '100%', marginBottom: 16, ...Shadow.lg,
  },
  co2Row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  co2Value: { fontSize: 48, fontWeight: '700', color: Colors.emerald600 },
  co2Label: { color: Colors.gray600, fontSize: 17 },

  pointsBox: {
    borderRadius: 20, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.emerald100, marginBottom: 16, width: '100%',
  },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  pointsValue: { fontSize: 24, fontWeight: '700', color: Colors.emerald600 },
  pointsLabel: { color: Colors.gray600, fontSize: 15 },
  bonusText: { color: Colors.emerald700, fontSize: 12, marginTop: 4, fontWeight: '500' },

  summaryCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 16,
    width: '100%', marginBottom: 16, ...Shadow.md,
  },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  summaryItem: { alignItems: 'center' },
  summaryIcon: { marginBottom: 4 },
  summaryValue: { color: '#1A1A1A', fontWeight: '700', fontSize: 16 },
  summaryItemLabel: { color: Colors.gray600, fontSize: 13, marginTop: 2 },
  modeRow: { paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  modeLabel: { color: Colors.gray600, fontSize: 13, marginBottom: 4 },
  modeValue: { color: '#1A1A1A', fontWeight: '600', fontSize: 15 },

  motive: { color: Colors.gray600, fontSize: 17, marginBottom: 24 },

  btnsWrap: { width: '100%', gap: 12 },
  outlineBtn: {
    backgroundColor: Colors.white, borderRadius: 20, paddingVertical: 16,
    alignItems: 'center', borderWidth: 2, borderColor: ECO_GREEN,
  },
  outlineBtnText: { color: ECO_GREEN, fontWeight: '700', fontSize: 17 },
  primaryBtn: {
    backgroundColor: ECO_GREEN, borderRadius: 20, paddingVertical: 16,
    alignItems: 'center', ...Shadow.md,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
