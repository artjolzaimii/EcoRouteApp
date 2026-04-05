import React, { useRef, useEffect } from 'react';
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

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const dailyCO2Data = [
  { day: '1', value: 0.8 },
  { day: '5', value: 1.2 },
  { day: '10', value: 0.9 },
  { day: '15', value: 1.5 },
  { day: '20', value: 1.3 },
  { day: '25', value: 1.1 },
  { day: '30', value: 1.4 },
];

const maxValue = Math.max(...dailyCO2Data.map((d) => d.value));

const topStats: { icon: IoniconName; value: string; label: string }[] = [
  { icon: 'location-outline', value: '42', label: 'Trips' },
  { icon: 'leaf-outline', value: '156 km', label: 'Distance' },
  { icon: 'cash-outline', value: '$87', label: 'Saved' },
];

const equivalents = [
  { emoji: '🌳', title: '12 trees planted', subtitle: 'CO₂ absorption equivalent' },
  { emoji: '🚗', title: '85 km avoided', subtitle: 'Car trips equivalent' },
  { emoji: '✈️', title: '0.08 flights', subtitle: 'Short-haul flight equivalent' },
];

export default function MonthlyReportScreen() {
  const insets = useSafeAreaInsets();

  // Pre-initialize all animated values (fixed count — no hooks in loops)
  const bar0 = useRef(new Animated.Value(0)).current;
  const bar1 = useRef(new Animated.Value(0)).current;
  const bar2 = useRef(new Animated.Value(0)).current;
  const bar3 = useRef(new Animated.Value(0)).current;
  const bar4 = useRef(new Animated.Value(0)).current;
  const bar5 = useRef(new Animated.Value(0)).current;
  const bar6 = useRef(new Animated.Value(0)).current;
  const barAnims = [bar0, bar1, bar2, bar3, bar4, bar5, bar6];

  const stat0 = useRef(new Animated.Value(0)).current;
  const stat1 = useRef(new Animated.Value(0)).current;
  const stat2 = useRef(new Animated.Value(0)).current;
  const statsAnims = [stat0, stat1, stat2];

  useEffect(() => {
    Animated.stagger(100, statsAnims.map((a) =>
      Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: true }),
    )).start();

    Animated.stagger(100, barAnims.map((a, i) =>
      Animated.timing(a, { toValue: dailyCO2Data[i].value / maxValue, duration: 500, useNativeDriver: false }),
    )).start();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
    >
      {/* Header */}
      <LinearGradient colors={[Colors.emerald600, Colors.emerald700]} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
            <Ionicons name="arrow-back-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerMonth}>March 2026</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Hero Stat */}
        <View style={styles.heroWrap}>
          <Text style={styles.heroLabel}>Total CO₂ saved</Text>
          <Text style={styles.heroValue}>34.2 kg</Text>
          <Text style={styles.heroTrend}>↑ 18% from last month</Text>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsWrap}>
        <View style={styles.statsRow}>
          {topStats.map((stat, i) => (
            <Animated.View
              key={stat.label}
              style={[styles.statCard, { opacity: statsAnims[i], transform: [{ translateY: statsAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}
            >
              <Ionicons name={stat.icon} size={24} color={Colors.emerald600} style={styles.statIcon} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Environmental Equivalent */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environmental equivalent</Text>
        <View style={styles.equivCard}>
          {equivalents.map((item, i) => (
            <View key={i} style={[styles.equivRow, i < equivalents.length - 1 && styles.equivBorder]}>
              <View style={styles.equivIconBox}>
                <Text style={styles.equivEmoji}>{item.emoji}</Text>
              </View>
              <View>
                <Text style={styles.equivTitle}>{item.title}</Text>
                <Text style={styles.equivSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Badge */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This month's badge</Text>
        <LinearGradient colors={[Colors.emerald600, Colors.emerald700]} style={styles.badgeCard}>
          <View style={styles.badgeIconBox}>
            <Ionicons name="trophy-outline" size={48} color={Colors.white} />
          </View>
          <Text style={styles.badgeTitle}>Eco Champion</Text>
          <Text style={styles.badgeSubtitle}>Saved over 30kg CO₂ this month</Text>
        </LinearGradient>
      </View>

      {/* Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily CO₂ trend</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartBars}>
            {dailyCO2Data.map((item, i) => (
              <View key={i} style={styles.barWrap}>
                <View style={styles.barTrack}>
                  <Animated.View
                    style={[
                      styles.bar,
                      {
                        height: barAnims[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartMonth}>March 2026</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.section, { paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.9}>
          <Ionicons name="download-outline" size={20} color={Colors.emerald600} />
          <Text style={styles.outlineBtnText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9}>
          <Ionicons name="share-outline" size={20} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Share Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1EFE8' },

  // Header
  header: { paddingHorizontal: 24, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMonth: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  headerSpacer: { width: 40 },
  heroWrap: { alignItems: 'center' },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginBottom: 8 },
  heroValue: { color: Colors.white, fontSize: 60, fontWeight: '700', marginBottom: 8 },
  heroTrend: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },

  // Stats
  statsWrap: { paddingHorizontal: 24, marginTop: -16, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    ...Shadow.lg,
  },
  statIcon: { marginBottom: 8 },
  statValue: { color: '#1A1A1A', fontWeight: '700', fontSize: 17, marginBottom: 4 },
  statLabel: { color: Colors.gray600, fontSize: 12 },

  // Section
  section: { paddingHorizontal: 24, marginBottom: 24, gap: 12 },
  sectionTitle: { color: '#1A1A1A', fontWeight: '700', fontSize: 17 },

  // Equivalents
  equivCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, ...Shadow.md, gap: 16 },
  equivRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 16 },
  equivBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  equivIconBox: { width: 48, height: 48, backgroundColor: Colors.emerald50, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  equivEmoji: { fontSize: 24 },
  equivTitle: { color: '#1A1A1A', fontWeight: '700', fontSize: 15, marginBottom: 2 },
  equivSubtitle: { color: Colors.gray600, fontSize: 13 },

  // Badge
  badgeCard: { borderRadius: 20, padding: 24, alignItems: 'center', ...Shadow.md },
  badgeIconBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeTitle: { color: Colors.white, fontWeight: '700', fontSize: 20, marginBottom: 4 },
  badgeSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },

  // Chart
  chartCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, ...Shadow.md },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: 8, marginBottom: 8 },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: Colors.emerald600, borderRadius: 4 },
  barLabel: { color: Colors.gray600, fontSize: 11 },
  chartMonth: { color: Colors.gray600, fontSize: 13, textAlign: 'center', marginTop: 8 },

  // Buttons
  outlineBtn: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.emerald600,
  },
  outlineBtnText: { color: Colors.emerald600, fontWeight: '700', fontSize: 17 },
  primaryBtn: {
    backgroundColor: Colors.emerald600,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.md,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
