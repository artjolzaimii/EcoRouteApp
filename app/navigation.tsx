import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import Svg, { Path, Rect, Defs, Pattern, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROGRESS = 45;

export default function NavigationScreen() {
  const insets = useSafeAreaInsets();

  const instructionAnim = useRef(new Animated.Value(-120)).current;
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  const modeAnim = useRef(new Animated.Value(-120)).current;
  const modeOpacity = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(120)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
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

    Animated.timing(progressAnim, { toValue: PROGRESS / 100, duration: 1000, useNativeDriver: false }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(leafScale, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(leafScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full-screen map */}
      <View style={styles.mapArea}>
        <LinearGradient colors={[Colors.emerald100, '#dbeafe']} style={StyleSheet.absoluteFillObject} />
        <Svg style={StyleSheet.absoluteFillObject}>
          <Defs>
            <Pattern id="nav-grid" width={40} height={40} patternUnits="userSpaceOnUse">
              <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.2" />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width={800} height={1200} fill="url(#nav-grid)" />
          {/* Route path */}
          <Path
            d={`M ${SCREEN_WIDTH / 2} 700 L ${SCREEN_WIDTH / 2} 500 L ${SCREEN_WIDTH / 2 + 35} 300 L ${SCREEN_WIDTH / 2 + 65} 150`}
            stroke={Colors.emerald600}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          {/* User position */}
          <Circle cx={SCREEN_WIDTH / 2} cy={500} r={12} fill={Colors.emerald600} stroke="white" strokeWidth={3} />
        </Svg>
      </View>

      {/* Instruction Card */}
      <Animated.View
        style={[styles.instructionCard, { top: insets.top + 16, transform: [{ translateY: instructionAnim }], opacity: instructionOpacity }]}
      >
        <View style={styles.instructionIconBox}>
          <Ionicons name="arrow-up-outline" size={36} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.instructionText}>Turn left onto Green Street</Text>
          <Text style={styles.instructionSub}>In 120m</Text>
        </View>
      </Animated.View>

      {/* Mode Pill */}
      <Animated.View
        style={[styles.modePill, { top: insets.top + 120, transform: [{ translateX: modeAnim }], opacity: modeOpacity }]}
      >
        <Ionicons name="bicycle-outline" size={20} color={Colors.emerald600} />
        <Text style={styles.modePillText}>Cycling</Text>
      </Animated.View>

      {/* Bottom Panel */}
      <Animated.View
        style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16, transform: [{ translateY: panelAnim }], opacity: panelOpacity }]}
      >
        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Route progress</Text>
            <Text style={styles.progressValue}>{PROGRESS}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        {/* Next Step */}
        <View style={styles.nextStepBox}>
          <Text style={styles.nextStepLabel}>Next step</Text>
          <Text style={styles.nextStepText}>Continue on Green Street for 800m</Text>
        </View>

        {/* CO2 Counter */}
        <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.co2Box}>
          <View>
            <Text style={styles.co2Label}>CO₂ saved so far</Text>
            <Text style={styles.co2Value}>0.6 kg</Text>
          </View>
          <Animated.View style={[styles.leafEmoji, { transform: [{ scale: leafScale }] }]}>
            <Text style={{ fontSize: 24 }}>🌱</Text>
          </Animated.View>
        </LinearGradient>

        {/* End Route */}
        <TouchableOpacity
          style={styles.endBtn}
          onPress={() => router.push('/trip-completed')}
          activeOpacity={0.9}
        >
          <Ionicons name="close-outline" size={20} color={Colors.white} />
          <Text style={styles.endBtnText}>End Route</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  mapArea: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },

  // Instruction card
  instructionCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...Shadow.xl,
  },
  instructionIconBox: {
    width: 64,
    height: 64,
    backgroundColor: Colors.emerald600,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  instructionText: { color: '#1A1A1A', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  instructionSub: { color: Colors.gray600, fontSize: 16, fontWeight: '600' },

  // Mode pill
  modePill: {
    position: 'absolute',
    left: 16,
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadow.md,
  },
  modePillText: { color: '#1A1A1A', fontWeight: '600', fontSize: 14 },

  // Bottom panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
    ...Shadow.xl,
  },
  progressSection: { gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: Colors.gray600, fontSize: 14, fontWeight: '500' },
  progressValue: { color: Colors.emerald600, fontSize: 14, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: Colors.gray200, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: Colors.emerald600, borderRadius: 4 },

  nextStepBox: { backgroundColor: Colors.gray50, borderRadius: 16, padding: 16 },
  nextStepLabel: { color: Colors.gray600, fontSize: 13, marginBottom: 4 },
  nextStepText: { color: '#1A1A1A', fontWeight: '600', fontSize: 15 },

  co2Box: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.emerald100,
  },
  co2Label: { color: Colors.gray600, fontSize: 13, marginBottom: 4 },
  co2Value: { color: Colors.emerald600, fontSize: 24, fontWeight: '700' },
  leafEmoji: {
    width: 48,
    height: 48,
    backgroundColor: Colors.emerald100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  endBtn: {
    backgroundColor: Colors.red600,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.md,
  },
  endBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
