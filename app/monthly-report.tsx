import { Colors, Shadow } from '@/constants/theme';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type DayImpact = {
  date: string;
  co2SavedG: number;
  trips: number;
  distanceKm: number;
};

type ImpactSummary = {
  totalCo2SavedG: number;
  totalTrips: number;
  totalDistanceKm: number;
  equivalentTreeDays: number;
  equivalentCarTripsAvoided: number;
  dailyBreakdown: DayImpact[];
};

const NUM_BARS = 7;

function sampleEvenly<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return [];
  if (arr.length <= n) return arr;
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i / (n - 1)) * (arr.length - 1));
    result.push(arr[idx]);
  }
  return result;
}

export default function MonthlyReportScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<ImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<ImpactSummary>('/api/impact/monthly');
      setData(result);
    } catch {
      // silently fail — show zeros
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derive 7 evenly-spaced chart points from the daily breakdown
  const chartData = (() => {
    const breakdown = data?.dailyBreakdown ?? [];
    const sampled = sampleEvenly(breakdown, NUM_BARS);
    while (sampled.length < NUM_BARS) {
      sampled.push({ date: '', co2SavedG: 0, trips: 0, distanceKm: 0 });
    }
    return sampled.map((d) => ({
      day: d.date ? new Date(d.date).getDate().toString() : '-',
      value: d.co2SavedG / 1000,
    }));
  })();

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 0.1);

  // Derived display values
  const co2Kg = data ? (data.totalCo2SavedG / 1000).toFixed(1) : '0.0';
  const treeDays = data ? Math.round(data.equivalentTreeDays) : 0;
  const carTrips = data ? Math.round(data.equivalentCarTripsAvoided) : 0;
  const flightsEq = data ? (data.totalCo2SavedG / 200000).toFixed(2) : '0.00';
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const topStats: { icon: IoniconName; value: string; label: string }[] = [
    { icon: 'location-outline', value: (data?.totalTrips ?? 0).toString(), label: 'Trips' },
    { icon: 'navigate-outline', value: `${Math.round(data?.totalDistanceKm ?? 0)} km`, label: 'Distance' },
    { icon: 'leaf-outline', value: treeDays.toString(), label: 'Tree days' },
  ];

  const equivalents = [
    { emoji: '🌳', title: `${treeDays} tree days`, subtitle: 'CO₂ absorption equivalent' },
    { emoji: '🚗', title: `${carTrips} car trips avoided`, subtitle: 'Car trips equivalent' },
    { emoji: '✈️', title: `${flightsEq} flights`, subtitle: 'Short-haul flight equivalent' },
  ];

  const badge = (() => {
    const kg = data ? data.totalCo2SavedG / 1000 : 0;
    if (kg >= 30) return { title: 'Eco Champion', subtitle: 'Saved over 30 kg CO₂ this month' };
    if (kg >= 10) return { title: 'Eco Hero', subtitle: 'Saved over 10 kg CO₂ this month' };
    if (kg >= 1)  return { title: 'Eco Starter', subtitle: 'Started your eco journey!' };
    return { title: 'Eco Explorer', subtitle: 'Complete trips to earn your first badge!' };
  })();

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
  }, []);

  // Re-animate bars whenever data loads
  useEffect(() => {
    if (!data) return;
    barAnims.forEach((a) => a.setValue(0));
    Animated.stagger(100, barAnims.map((a, i) =>
      Animated.timing(a, { toValue: chartData[i].value / maxChartValue, duration: 500, useNativeDriver: false }),
    )).start();
  }, [data]);

  const generateSummaryText = () => {
    return `🌍 My Eco Impact for ${monthLabel}:\n\n` +
           `✅ Saved ${co2Kg} kg of CO₂\n` +
           `✅ Completed ${data?.totalTrips ?? 0} green trips\n` +
           `✅ Traveled ${Math.round(data?.totalDistanceKm ?? 0)} km sustainably\n\n` +
           `That's equivalent to ${treeDays} tree days of absorption! 🌳\n\n` +
           `Join me on EcoRoute and start saving the planet! 🌿`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: generateSummaryText(),
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share the report');
    }
  };

  const handleDownloadPDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1A1A1A; }
            h1 { color: #059669; margin-bottom: 8px; }
            h2 { color: #4B5563; font-size: 18px; margin-bottom: 32px; }
            .stat-box { background: #F3F4F6; padding: 20px; border-radius: 12px; margin-bottom: 16px; }
            .stat-label { color: #6B7280; font-size: 14px; margin-bottom: 4px; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .footer { margin-top: 60px; font-size: 12px; color: #9CA3AF; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Monthly Eco Report</h1>
          <h2>${monthLabel}</h2>

          <div class="stat-box">
            <div class="stat-label">Total CO₂ Saved</div>
            <div class="stat-value">${co2Kg} kg</div>
          </div>

          <div class="stat-box">
            <div class="stat-label">Green Trips Completed</div>
            <div class="stat-value">${data?.totalTrips ?? 0}</div>
          </div>

          <div class="stat-box">
            <div class="stat-label">Total Distance</div>
            <div class="stat-value">${Math.round(data?.totalDistanceKm ?? 0)} km</div>
          </div>

          <div class="stat-box">
            <div class="stat-label">Environmental Equivalent</div>
            <div class="stat-value">${treeDays} tree days</div>
          </div>

          <div class="footer">
            Generated by EcoRoute App 🌿
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Error', 'Could not generate PDF');
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Back Button */}
      <TouchableOpacity 
        style={[styles.backBtn, styles.fixedBackBtn, { top: insets.top + 16 }]} 
        onPress={() => router.back()} 
        activeOpacity={0.9}
      >
        <Ionicons name="arrow-back-outline" size={20} color={Colors.white} />
      </TouchableOpacity>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={[Colors.emerald600, Colors.emerald700]} style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerMonth}>{monthLabel}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Hero Stat */}
          <View style={styles.heroWrap}>
            <Text style={styles.heroLabel}>Total CO₂ saved</Text>
            {loading ? (
              <ActivityIndicator color={Colors.white} size="large" style={styles.heroLoader} />
            ) : (
              <Text style={styles.heroValue}>{co2Kg} kg</Text>
            )}
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
            <Text style={styles.badgeTitle}>{badge.title}</Text>
            <Text style={styles.badgeSubtitle}>{badge.subtitle}</Text>
          </LinearGradient>
        </View>

        {/* Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily CO₂ trend</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {chartData.map((item, i) => (
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
            <Text style={styles.chartMonth}>{monthLabel}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.section, { paddingBottom: insets.bottom + 32 }]}>
          <TouchableOpacity 
            style={styles.outlineBtn} 
            activeOpacity={0.9}
            onPress={handleDownloadPDF}
          >
            <Ionicons name="download-outline" size={20} color={Colors.emerald600} />
            <Text style={styles.outlineBtnText}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            activeOpacity={0.9}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Share Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  fixedBackBtn: {
    position: 'absolute',
    left: 24,
    zIndex: 10,
  },
  headerMonth: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  headerSpacer: { width: 40 },
  heroWrap: { alignItems: 'center', minHeight: 80, justifyContent: 'center' },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginBottom: 8 },
  heroLoader: { marginVertical: 16 },
  heroValue: { color: Colors.white, fontSize: 60, fontWeight: '700', marginBottom: 8 },

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
