import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { api } from '@/lib/api';

type TimeFrame = 'week' | 'month' | 'year';

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

type BadgeItem = {
  id: string;
  name: string;
  description: string;
  iconName: string;
  earned: boolean;
  earnedAt: string | null;
  progress: number;
  progressMax: number;
};

const BAR_MAX_HEIGHT = 96;

function gramsToKg(g: number): string {
  return (g / 1000).toFixed(1);
}

function badgeIcon(name: string): React.ComponentProps<typeof Ionicons>['name'] {
  const lower = name.toLowerCase();
  if (lower.includes('forest') || lower.includes('tree') || lower.includes('leaf')) return 'leaf-outline';
  if (lower.includes('water')) return 'water-outline';
  if (lower.includes('air') || lower.includes('cloud') || lower.includes('co2')) return 'cloudy-outline';
  if (lower.includes('streak') || lower.includes('flame')) return 'flame-outline';
  if (lower.includes('trip')) return 'location-outline';
  return 'trophy-outline';
}

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');
  const [weekData, setWeekData] = useState<ImpactSummary | null>(null);
  const [monthData, setMonthData] = useState<ImpactSummary | null>(null);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [weekly, monthly, badgesRes] = await Promise.all([
        api.get<ImpactSummary>('/api/impact/weekly'),
        api.get<ImpactSummary>('/api/impact/monthly'),
        api.get<{ badges: BadgeItem[] }>('/api/badges'),
      ]);
      setWeekData(weekly);
      setMonthData(monthly);
      setBadges(badgesRes.badges ?? []);
    } catch {
      // silently fail — show zeros
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derive displayed stats based on selected time frame
  const currentData: ImpactSummary | null = timeFrame === 'week' ? weekData : monthData;

  const co2Kg = currentData ? gramsToKg(currentData.totalCo2SavedG) : '0.0';
  const treesEq = currentData ? currentData.equivalentTreeDays.toFixed(1) : '0.0';
  const waterL = currentData ? Math.round(currentData.totalDistanceKm * 8) : 0; // rough proxy
  const distanceKm = currentData ? currentData.totalDistanceKm.toFixed(1) : '0.0';
  const trips = currentData?.totalTrips ?? 0;

  // Build bar chart data from daily breakdown (week only — last 7 days)
  const barData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!weekData?.dailyBreakdown?.length) {
      return days.map((day) => ({ day, value: 0 }));
    }
    // Build a map from day-of-week to co2 saved
    const map: Record<string, number> = {};
    weekData.dailyBreakdown.forEach((d) => {
      const dt = new Date(d.date);
      const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
      map[dayName] = (map[dayName] ?? 0) + d.co2SavedG / 1000;
    });
    return days.map((day) => ({ day, value: map[day] ?? 0 }));
  })();

  const maxBarValue = Math.max(...barData.map((d) => d.value), 0.1);

  const displayedBadges = badges.slice(0, 3);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.emerald600, Colors.emerald700]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.headerRow}>
          <Ionicons name="leaf-outline" size={24} color={Colors.white} />
          <Text style={styles.headerTitle}>Your Impact</Text>
        </View>
        <Text style={styles.headerSub}>Making the world greener, one trip at a time</Text>

        <View style={styles.timeSelector}>
          {(['week', 'month'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.timePill, timeFrame === period && styles.timePillActive]}
              onPress={() => setTimeFrame(period)}
              activeOpacity={0.85}
            >
              <Text style={[styles.timePillText, timeFrame === period && styles.timePillTextActive]}>
                {period === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Main Stats Card */}
      <View style={styles.statsCardWrap}>
        <View style={[styles.card, styles.statsCard]}>
          {loading ? (
            <ActivityIndicator color={Colors.emerald600} style={{ paddingVertical: 32 }} />
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statCell}>
                  <View style={styles.statCellHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: Colors.emerald100 }]}>
                      <Ionicons name="leaf-outline" size={18} color={Colors.emerald600} />
                    </View>
                    <Text style={styles.statCellLabel}>CO₂ Saved</Text>
                  </View>
                  <Text style={styles.statCellValue}>
                    {co2Kg}<Text style={styles.statUnit}> kg</Text>
                  </Text>
                </View>

                <View style={styles.statCell}>
                  <View style={styles.statCellHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: Colors.green100 }]}>
                      <Ionicons name="leaf" size={18} color={Colors.green600} />
                    </View>
                    <Text style={styles.statCellLabel}>Trees</Text>
                  </View>
                  <Text style={styles.statCellValue}>
                    {treesEq}<Text style={styles.statUnit}> eq.</Text>
                  </Text>
                </View>

                <View style={styles.statCell}>
                  <View style={styles.statCellHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: Colors.blue100 }]}>
                      <Ionicons name="water-outline" size={18} color={Colors.blue600} />
                    </View>
                    <Text style={styles.statCellLabel}>Water</Text>
                  </View>
                  <Text style={styles.statCellValue}>
                    {waterL}<Text style={styles.statUnit}> L</Text>
                  </Text>
                </View>

                <View style={styles.statCell}>
                  <View style={styles.statCellHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: Colors.orange100 }]}>
                      <Ionicons name="location-outline" size={18} color={Colors.orange600} />
                    </View>
                    <Text style={styles.statCellLabel}>Distance</Text>
                  </View>
                  <Text style={styles.statCellValue}>
                    {distanceKm}<Text style={styles.statUnit}> km</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.statsDivider}>
                <View style={styles.statsDividerLeft}>
                  <Ionicons name="time-outline" size={18} color={Colors.gray400} />
                  <Text style={styles.tripsText}>{trips} trips completed</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Weekly Bar Chart */}
      <View style={styles.section}>
        <View style={[styles.card, styles.chartCard]}>
          <Text style={styles.chartTitle}>This Week's Activity (kg CO₂)</Text>
          <View style={styles.barChart}>
            {barData.map((day) => {
              const barH = Math.round((day.value / maxBarValue) * BAR_MAX_HEIGHT);
              return (
                <View key={day.day} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <LinearGradient
                      colors={[Colors.emerald400, Colors.emerald600]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[styles.bar, { height: Math.max(barH, 2) }]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Achievements */}
      {displayedBadges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.achievementList}>
            {displayedBadges.map((badge) => {
              const pct = badge.progressMax > 0 ? Math.min((badge.progress / badge.progressMax) * 100, 100) : 0;
              const icon = badgeIcon(badge.name);
              return (
                <View
                  key={badge.id}
                  style={[styles.achievementCard, badge.earned && styles.achievementCardUnlocked]}
                >
                  <View style={styles.achievementTop}>
                    <View style={[styles.achievementIconBox, badge.earned && styles.achievementIconBoxUnlocked]}>
                      <Ionicons name={icon} size={24} color={badge.earned ? Colors.white : Colors.gray400} />
                    </View>
                    <View style={styles.achievementTextWrap}>
                      <View style={styles.achievementNameRow}>
                        <Text style={styles.achievementName}>{badge.name}</Text>
                        {badge.earned && <Ionicons name="trophy" size={18} color={Colors.yellow500} />}
                      </View>
                      <Text style={styles.achievementDesc}>{badge.description}</Text>
                    </View>
                  </View>

                  {!badge.earned && (
                    <View style={styles.progressWrap}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>
                          {badge.progress} / {badge.progressMax}
                        </Text>
                        <Text style={styles.progressPct}>{Math.round(pct)}%</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Monthly Report CTA */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.monthlyReportBtn}
          onPress={() => router.push('/monthly-report')}
          activeOpacity={0.9}
        >
          <View style={styles.monthlyReportLeft}>
            <View style={styles.monthlyReportIconBox}>
              <Ionicons name="bar-chart-outline" size={22} color={Colors.emerald600} />
            </View>
            <View>
              <Text style={styles.monthlyReportTitle}>Monthly Report</Text>
              <Text style={styles.monthlyReportSub}>View full breakdown</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color={Colors.emerald600} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { paddingHorizontal: 24, paddingBottom: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  headerSub: { color: Colors.emeraldText100, fontSize: 13 },
  timeSelector: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
  },
  timePill: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  timePillActive: { backgroundColor: Colors.white, ...Shadow.sm },
  timePillText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  timePillTextActive: { color: Colors.emerald700 },
  statsCardWrap: { paddingHorizontal: 24, marginTop: -24 },
  card: { backgroundColor: Colors.white, borderRadius: 16, ...Shadow.xl },
  statsCard: { padding: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  statCell: { width: '50%', paddingBottom: 24, paddingRight: 16 },
  statCellHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statCellLabel: { color: Colors.gray500, fontSize: 13 },
  statCellValue: { fontSize: 28, fontWeight: '700', color: Colors.gray900 },
  statUnit: { fontSize: 16, fontWeight: '400', color: Colors.gray500 },
  statsDivider: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  statsDividerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tripsText: { color: Colors.gray600, fontSize: 13 },
  section: { paddingHorizontal: 24, marginTop: 24 },
  chartCard: { padding: 24 },
  chartTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 17, marginBottom: 16 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_MAX_HEIGHT + 20 },
  barColumn: { flex: 1, alignItems: 'center' },
  barWrapper: { width: '80%', height: BAR_MAX_HEIGHT, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 11, color: Colors.gray500, fontWeight: '500', marginTop: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 17 },
  viewAll: { color: Colors.emerald600, fontSize: 13, fontWeight: '600' },
  achievementList: { gap: 12 },
  achievementCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, ...Shadow.sm },
  achievementCardUnlocked: { borderWidth: 2, borderColor: Colors.emerald200 },
  achievementTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 0 },
  achievementIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  achievementIconBoxUnlocked: { backgroundColor: Colors.emerald600 },
  achievementTextWrap: { flex: 1 },
  achievementNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  achievementName: { color: Colors.gray900, fontWeight: '600', fontSize: 14 },
  achievementDesc: { color: Colors.gray500, fontSize: 13 },
  progressWrap: { marginTop: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: Colors.gray600, fontSize: 12 },
  progressPct: { color: Colors.emerald600, fontWeight: '600', fontSize: 12 },
  progressTrack: { height: 8, backgroundColor: Colors.gray100, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.emerald600, borderRadius: 4 },
  monthlyReportBtn: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.emerald100,
    ...Shadow.sm,
  },
  monthlyReportLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthlyReportIconBox: {
    width: 44,
    height: 44,
    backgroundColor: Colors.emerald50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthlyReportTitle: { color: Colors.gray900, fontWeight: '600', fontSize: 15, marginBottom: 2 },
  monthlyReportSub: { color: Colors.gray500, fontSize: 13 },
});
