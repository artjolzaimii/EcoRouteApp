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
import Svg, { Path, Rect, Defs, Pattern } from 'react-native-svg';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Step = {
  id: number;
  icon: IoniconName;
  instruction: string;
  distance: string;
  duration: string;
  co2: string;
  zeroCO2: boolean;
  iconBg: string;
  iconColor: string;
};

const routeSteps: Step[] = [
  {
    id: 1,
    icon: 'walk-outline',
    instruction: 'Walk to Green Street Station',
    distance: '280m',
    duration: '4 min',
    co2: '0g',
    zeroCO2: true,
    iconBg: Colors.blue100,
    iconColor: Colors.blue600,
  },
  {
    id: 2,
    icon: 'bicycle-outline',
    instruction: 'Cycle via Eco Lane',
    distance: '3.2 km',
    duration: '12 min',
    co2: '0g',
    zeroCO2: true,
    iconBg: Colors.emerald100,
    iconColor: Colors.emerald600,
  },
  {
    id: 3,
    icon: 'train-outline',
    instruction: 'Metro Line 2 — 2 stops',
    distance: '1.8 km',
    duration: '6 min',
    co2: '45g',
    zeroCO2: false,
    iconBg: Colors.purple100,
    iconColor: Colors.purple600,
  },
  {
    id: 4,
    icon: 'walk-outline',
    instruction: 'Walk to destination',
    distance: '150m',
    duration: '2 min',
    co2: '0g',
    zeroCO2: true,
    iconBg: Colors.blue100,
    iconColor: Colors.blue600,
  },
];

export default function RouteDetailScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Map Area */}
      <View style={styles.mapArea}>
        {/* Gradient background */}
        <LinearGradient
          colors={[Colors.emerald50, '#eff6ff']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Grid */}
        <Svg style={StyleSheet.absoluteFillObject}>
          <Defs>
            <Pattern id="detail-grid" width={30} height={30} patternUnits="userSpaceOnUse">
              <Path d="M 30 0 L 0 0 0 30" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.2" />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width={800} height={500} fill="url(#detail-grid)" />
          {/* Route path */}
          <Path
            d="M 50 300 L 150 200 L 250 180 L 350 100"
            stroke={Colors.emerald400}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="8 4"
          />
        </Svg>

        {/* Start/End markers */}
        <View style={[styles.marker, styles.markerStart]} />
        <View style={[styles.marker, styles.markerEnd, { backgroundColor: Colors.red600 }]} />

        {/* Back button */}
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
          <Text style={styles.sheetTitle}>Journey breakdown</Text>

          {/* Steps */}
          <View style={styles.stepsWrap}>
            {routeSteps.map((step, index) => (
              <View key={step.id} style={styles.stepRow}>
                {/* Icon + connector */}
                <View style={styles.stepLeft}>
                  <View style={[styles.stepIconBox, { backgroundColor: step.iconBg }]}>
                    <Ionicons name={step.icon} size={20} color={step.iconColor} />
                  </View>
                  {index < routeSteps.length - 1 && <View style={styles.stepConnector} />}
                </View>

                {/* Content */}
                <View style={styles.stepContent}>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                  <Text style={styles.stepMeta}>{step.distance} • {step.duration}</Text>
                  <View style={[styles.co2Badge, { backgroundColor: step.zeroCO2 ? Colors.emerald100 : Colors.gray100 }]}>
                    <Text style={[styles.co2BadgeText, { color: step.zeroCO2 ? Colors.emerald700 : Colors.gray600 }]}>
                      {step.co2} CO₂
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Summary */}
          <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="leaf-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                <Text style={styles.summaryValue}>45g</Text>
                <Text style={styles.summaryLabel}>Total CO₂</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="time-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                <Text style={styles.summaryValue}>24 min</Text>
                <Text style={styles.summaryLabel}>Total Time</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="cash-outline" size={20} color={Colors.emerald600} style={styles.summaryIcon} />
                <Text style={styles.summaryValue}>$2.50</Text>
                <Text style={styles.summaryLabel}>Total Cost</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Start Route Button */}
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

  // Map
  mapArea: { height: '50%', position: 'relative', overflow: 'hidden' },
  marker: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: Colors.emerald600,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadow.md,
  },
  markerStart: { top: '75%', left: '12%' },
  markerEnd: { top: '25%', right: '15%' },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },

  // Sheet
  sheet: { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, ...Shadow.xl },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetScroll: { flex: 1, paddingHorizontal: 24 },
  sheetTitle: { color: '#1A1A1A', fontSize: 20, fontWeight: '700', marginBottom: 16 },

  // Steps
  stepsWrap: { gap: 0, marginBottom: 24 },
  stepRow: { flexDirection: 'row', gap: 16 },
  stepLeft: { alignItems: 'center' },
  stepIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepConnector: { width: 1, flex: 1, backgroundColor: Colors.gray200, marginVertical: 4, minHeight: 32 },
  stepContent: { flex: 1, paddingBottom: 20 },
  stepInstruction: { color: '#1A1A1A', fontWeight: '600', fontSize: 15, marginBottom: 4 },
  stepMeta: { color: Colors.gray600, fontSize: 13, marginBottom: 8 },
  co2Badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  co2BadgeText: { fontSize: 12, fontWeight: '600' },

  // Summary
  summaryBox: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.emerald100 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryIcon: { marginBottom: 4 },
  summaryValue: { color: '#1A1A1A', fontWeight: '700', fontSize: 16 },
  summaryLabel: { color: Colors.gray600, fontSize: 12, marginTop: 2 },

  // Footer
  footerWrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  startBtn: {
    backgroundColor: Colors.emerald600,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.lg,
  },
  startBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
