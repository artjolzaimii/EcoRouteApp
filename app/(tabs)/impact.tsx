import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

type TimeFrame = 'week' | 'month' | 'year';

const statsData = {
  week:  { co2: 18.5, trees: 2.8,  water: 450,   distance: 52.3,  trips: 14  },
  month: { co2: 76.2, trees: 11.4, water: 1850,  distance: 215.7, trips: 58  },
  year:  { co2: 892.4, trees: 134.2, water: 21600, distance: 2544.3, trips: 687 },
};

const achievements = [
  { icon: 'leaf-outline' as const,   title: 'Forest Guardian', description: 'Saved equivalent of 100 trees', progress: 134, target: 100,   unlocked: true  },
  { icon: 'water-outline' as const,  title: 'Water Saver',     description: 'Conserved 50,000L of water',   progress: 21600, target: 50000, unlocked: false },
  { icon: 'cloudy-outline' as const, title: 'Clean Air Hero',  description: '1 ton of CO₂ saved',            progress: 892,  target: 1000,  unlocked: false },
];

const weeklyData = [
  { day: 'Mon', value: 2.1 },
  { day: 'Tue', value: 3.5 },
  { day: 'Wed', value: 2.8 },
  { day: 'Thu', value: 4.2 },
  { day: 'Fri', value: 3.1 },
  { day: 'Sat', value: 1.5 },
  { day: 'Sun', value: 1.3 },
];

const maxBarValue = Math.max(...weeklyData.map((d) => d.value));
const BAR_MAX_HEIGHT = 96;

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');
  const stats = statsData[timeFrame];

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

        {/* Time frame selector */}
        <View style={styles.timeSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.timePill, timeFrame === period && styles.timePillActive]}
              onPress={() => setTimeFrame(period)}
              activeOpacity={0.85}
            >
              <Text style={[styles.timePillText, timeFrame === period && styles.timePillTextActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Main Stats Card */}
      <View style={styles.statsCardWrap}>
        <View style={[styles.card, styles.statsCard]}>
          <View style={styles.statsGrid}>
            {/* CO₂ */}
            <View style={styles.statCell}>
              <View style={styles.statCellHeader}>
                <View style={[styles.statIconBox, { backgroundColor: Colors.emerald100 }]}>
                  <Ionicons name="leaf-outline" size={18} color={Colors.emerald600} />
                </View>
                <Text style={styles.statCellLabel}>CO₂ Saved</Text>
              </View>
              <Text style={styles.statCellValue}>
                {stats.co2}<Text style={styles.statUnit}> kg</Text>
              </Text>
            </View>

            {/* Trees */}
            <View style={styles.statCell}>
              <View style={styles.statCellHeader}>
                <View style={[styles.statIconBox, { backgroundColor: Colors.green100 }]}>
                  <Ionicons name="leaf" size={18} color={Colors.green600} />
                </View>
                <Text style={styles.statCellLabel}>Trees</Text>
              </View>
              <Text style={styles.statCellValue}>
                {stats.trees}<Text style={styles.statUnit}> eq.</Text>
              </Text>
            </View>

            {/* Water */}
            <View style={styles.statCell}>
              <View style={styles.statCellHeader}>
                <View style={[styles.statIconBox, { backgroundColor: Colors.blue100 }]}>
                  <Ionicons name="water-outline" size={18} color={Colors.blue600} />
                </View>
                <Text style={styles.statCellLabel}>Water</Text>
              </View>
              <Text style={styles.statCellValue}>
                {stats.water}<Text style={styles.statUnit}> L</Text>
              </Text>
            </View>

            {/* Distance */}
            <View style={styles.statCell}>
              <View style={styles.statCellHeader}>
                <View style={[styles.statIconBox, { backgroundColor: Colors.orange100 }]}>
                  <Ionicons name="location-outline" size={18} color={Colors.orange600} />
                </View>
                <Text style={styles.statCellLabel}>Distance</Text>
              </View>
              <Text style={styles.statCellValue}>
                {stats.distance}<Text style={styles.statUnit}> km</Text>
              </Text>
            </View>
          </View>

          <View style={styles.statsDivider}>
            <View style={styles.statsDividerLeft}>
              <Ionicons name="time-outline" size={18} color={Colors.gray400} />
              <Text style={styles.tripsText}>{stats.trips} trips completed</Text>
            </View>
            <View style={styles.trendRow}>
              <Ionicons name="trending-up-outline" size={14} color={Colors.emerald600} />
              <Text style={styles.trendVal}>+24%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Weekly Bar Chart */}
      <View style={styles.section}>
        <View style={[styles.card, styles.chartCard]}>
          <Text style={styles.chartTitle}>This Week's Activity</Text>
          <View style={styles.barChart}>
            {weeklyData.map((day) => {
              const barH = Math.round((day.value / maxBarValue) * BAR_MAX_HEIGHT);
              return (
                <View key={day.day} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <LinearGradient
                      colors={[Colors.emerald400, Colors.emerald600]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[styles.bar, { height: barH }]}
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
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.achievementList}>
          {achievements.map((a, idx) => {
            const pct = Math.min((a.progress / a.target) * 100, 100);
            return (
              <View
                key={a.title}
                style={[styles.achievementCard, a.unlocked && styles.achievementCardUnlocked]}
              >
                <View style={styles.achievementTop}>
                  <View style={[styles.achievementIconBox, a.unlocked && styles.achievementIconBoxUnlocked]}>
                    <Ionicons name={a.icon} size={24} color={a.unlocked ? Colors.white : Colors.gray400} />
                  </View>
                  <View style={styles.achievementTextWrap}>
                    <View style={styles.achievementNameRow}>
                      <Text style={styles.achievementName}>{a.title}</Text>
                      {a.unlocked && <Ionicons name="trophy" size={18} color={Colors.yellow500} />}
                    </View>
                    <Text style={styles.achievementDesc}>{a.description}</Text>
                  </View>
                </View>

                {!a.unlocked && (
                  <View style={styles.progressWrap}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>
                        {a.progress.toLocaleString()} / {a.target.toLocaleString()}
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
              <Text style={styles.monthlyReportSub}>View full March 2026 breakdown</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color={Colors.emerald600} />
        </TouchableOpacity>
      </View>

      {/* Comparison Card */}
      <View style={[styles.section, { marginBottom: 24 }]}>
        <LinearGradient colors={[Colors.emerald600, Colors.emerald700]} style={styles.comparisonCard}>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonIconBox}>
              <Ionicons name="flash-outline" size={24} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.comparisonTitle}>Keep it up!</Text>
              <Text style={styles.comparisonSub}>
                You're doing better than 87% of EcoRoute users in your area.
              </Text>
              <View style={styles.comparisonBarRow}>
                <View style={styles.comparisonTrack}>
                  <View style={[styles.comparisonFill, { width: '87%' }]} />
                </View>
                <Text style={styles.comparisonPct}>87%</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  // Header
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

  // Stats card
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
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendVal: { color: Colors.emerald600, fontWeight: '600', fontSize: 13 },

  // Chart
  section: { paddingHorizontal: 24, marginTop: 24 },
  chartCard: { padding: 24 },
  chartTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 17, marginBottom: 16 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_MAX_HEIGHT + 20 },
  barColumn: { flex: 1, alignItems: 'center' },
  barWrapper: { width: '80%', height: BAR_MAX_HEIGHT, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 11, color: Colors.gray500, fontWeight: '500', marginTop: 6 },

  // Achievements
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

  // Monthly report button
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

  // Comparison
  comparisonCard: { borderRadius: 16, padding: 24 },
  comparisonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  comparisonIconBox: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  comparisonTitle: { color: Colors.white, fontWeight: '700', fontSize: 17, marginBottom: 4 },
  comparisonSub: { color: Colors.emeraldText100, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  comparisonBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  comparisonTrack: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  comparisonFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 4 },
  comparisonPct: { color: Colors.white, fontWeight: '600', fontSize: 13 },
});
