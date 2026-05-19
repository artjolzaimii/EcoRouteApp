import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { routeStore, useRouteStore } from '@/lib/routeStore';
import { EcoRoute } from '@/lib/types';
import { RouteDetailSheet, SaveState } from '@/components/RouteDetailSheet';
import { saveRoute } from '@/lib/api';

function carbonScoreStyle(score: number): { bg: string; text: string; label: string } {
  if (score >= 80) return { bg: Colors.emerald100, text: Colors.emerald700, label: 'Eco' };
  if (score >= 50) return { bg: Colors.amber100,   text: Colors.amber700,   label: 'Low CO₂' };
  return                  { bg: Colors.red100,      text: Colors.red600,     label: 'High CO₂' };
}

export default function TransitAlternativesScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useRouteStore();
  const routes = state?.ecoResponse?.routes ?? [];

  const transitRoutes = routes
    .map((r, i) => ({ route: r, index: i }))
    .filter(x => x.route.mode === 'TRANSIT');

  const [detailSheetRoute, setDetailSheetRoute] = useState<EcoRoute | undefined>();
  const [detailSheetVisible, setDetailSheetVisible] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const openDetail = (route: EcoRoute, fullIndex: number) => {
    routeStore.setSelectedIndex(fullIndex);
    setDetailSheetRoute(route);
    setSaveState('idle');
    setDetailSheetVisible(true);
  };

  const handleSave = async () => {
    const route = detailSheetRoute;
    const s = routeStore.get();
    if (!route || !s || saveState !== 'idle') return;
    setSaveState('saving');
    try {
      await saveRoute({
        originAddress: s.originAddress,
        destAddress: s.destAddress,
        originLat: s.originLat,
        originLng: s.originLng,
        destLat: s.destLat,
        destLng: s.destLng,
        mode: route.mode,
        subType: route.subType,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        co2Grams: route.co2Grams,
        savedVsCar: route.savedVsCar,
        carEquivalentCO2: route.carEquivalentCO2,
        carbonScore: route.carbonScore,
        greenPoints: route.greenPoints,
        finalScore: route.finalScore,
        mood: s.mood,
        moodReason: route.moodReason,
        routeData: route,
      });
      setSaveState('saved');
    } catch {
      setSaveState('idle');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back-outline" size={20} color={Colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transit Options</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHint}>
          {transitRoutes.length} transit route{transitRoutes.length !== 1 ? 's' : ''} available — tap to see details
        </Text>

        {transitRoutes.map(({ route, index }) => {
          const cs = carbonScoreStyle(route.carbonScore);
          const lineLabel = route.transitLineName
            ? `Transit · via ${route.transitLineName}`
            : 'Transit · Local Transit';

          return (
            <TouchableOpacity
              key={`transit-alt-${index}`}
              style={styles.card}
              onPress={() => openDetail(route, index)}
              activeOpacity={0.85}
            >
              {route.recommended && (
                <View style={styles.recommendedBanner}>
                  <Ionicons name="star" size={11} color={Colors.emerald700} />
                  <Text style={styles.recommendedText}>Recommended</Text>
                  {route.personalizedLabel && (
                    <>
                      <Text style={styles.recommendedSep}> · </Text>
                      <Ionicons name="person-outline" size={10} color={Colors.emerald700} />
                      <Text style={styles.recommendedText}>{route.personalizedLabel}</Text>
                    </>
                  )}
                </View>
              )}

              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View style={styles.cardIconBox}>
                    <Ionicons name="bus-outline" size={22} color={Colors.gray600} />
                  </View>
                  <View>
                    <Text style={styles.cardName}>{lineLabel}</Text>
                    <View style={styles.cardMeta}>
                      <Ionicons name="time-outline" size={12} color={Colors.gray500} />
                      <Text style={styles.cardMetaText}>{route.durationMin} min</Text>
                      <Ionicons name="location-outline" size={12} color={Colors.gray500} />
                      <Text style={styles.cardMetaText}>{route.distanceKm.toFixed(1)} km</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.ratingBadge, { backgroundColor: cs.bg }]}>
                  <Text style={[styles.ratingText, { color: cs.text }]}>{cs.label}</Text>
                </View>
              </View>

              <View style={styles.cardStats}>
                <View style={styles.statItem}>
                  <Ionicons name="leaf-outline" size={13} color={Colors.emerald600} />
                  <Text style={styles.statEco}>
                    {route.co2Grams === 0
                      ? 'Zero emissions'
                      : `${(route.co2Grams / 1000).toFixed(2)} kg CO₂`}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="flash-outline" size={13} color={Colors.purple600} />
                  <Text style={styles.statGray}>
                    {route.greenPoints}{route.greenPoints > 0 ? '+' : ''} pts
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardTapHint}>See route details</Text>
                <Ionicons name="chevron-forward-outline" size={14} color={Colors.gray400} />
              </View>
            </TouchableOpacity>
          );
        })}

        {transitRoutes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bus-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>No transit routes available</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <RouteDetailSheet
        visible={detailSheetVisible}
        route={detailSheetRoute}
        onClose={() => setDetailSheetVisible(false)}
        onStartRoute={() => {
          setDetailSheetVisible(false);
          router.push('/navigation');
        }}
        onSave={handleSave}
        saveState={saveState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backBtn: {
    width: 40, height: 40,
    backgroundColor: Colors.gray100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray900 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  sectionHint: { fontSize: 13, color: Colors.gray500, marginBottom: 16 },

  card: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.gray200,
    padding: 16,
    backgroundColor: Colors.gray50,
    marginBottom: 12,
    ...Shadow.sm,
  },

  recommendedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.emerald100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  recommendedText: { fontSize: 10, fontWeight: '700', color: Colors.emerald700 },
  recommendedSep: { fontSize: 10, color: Colors.emerald700, opacity: 0.6 },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIconBox: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { fontWeight: '600', fontSize: 14, color: Colors.gray900, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { fontSize: 12, color: Colors.gray600 },

  ratingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  ratingText: { fontSize: 11, fontWeight: '600' },

  cardStats: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginBottom: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statEco: { fontSize: 12, fontWeight: '600', color: Colors.emerald600 },
  statGray: { fontSize: 12, color: Colors.gray600 },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: 8,
  },
  cardTapHint: { fontSize: 12, color: Colors.gray400 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.gray400 },
});
