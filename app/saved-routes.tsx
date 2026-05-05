import { Colors, Shadow } from '@/constants/theme';
import { usePreferences } from '@/context/PreferencesContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

type TransportMode = 'walk' | 'bike' | 'bus';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SavedRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  duration: string;
  co2SavedG: number;
  modes: TransportMode[];
  dateSaved: string;
}

const modeIcon: Record<TransportMode, IoniconName> = {
  walk: 'walk-outline',
  bike: 'bicycle-outline',
  bus: 'bus-outline',
};

const initialRoutes: SavedRoute[] = [
  {
    id: '1',
    name: 'Morning Commute',
    origin: 'Home',
    destination: 'Office',
    distanceKm: 5.2,
    duration: '18 min',
    co2SavedG: 1200,
    modes: ['bike', 'bus'],
    dateSaved: 'Mar 15, 2026',
  },
  {
    id: '2',
    name: 'Grocery Trip',
    origin: 'Office',
    destination: 'Whole Foods Market',
    distanceKm: 2.1,
    duration: '8 min',
    co2SavedG: 500,
    modes: ['walk', 'bike'],
    dateSaved: 'Mar 10, 2026',
  },
  {
    id: '3',
    name: 'Gym Route',
    origin: 'Home',
    destination: 'Green Fitness Center',
    distanceKm: 3.8,
    duration: '14 min',
    co2SavedG: 800,
    modes: ['bike'],
    dateSaved: 'Mar 5, 2026',
  },
];

export default function SavedRoutesScreen() {
  const insets = useSafeAreaInsets();
  const { formatDistance, formatCO2, theme, prefs } = usePreferences();
  const [routes, setRoutes] = useState<SavedRoute[]>(initialRoutes);

  const handleDelete = (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar style={prefs.appearance === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Saved Routes</Text>
      </View>

      {routes.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyCircle, { backgroundColor: theme.card }]}>
            <Ionicons name="bookmark-outline" size={64} color={theme.gray300} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved routes yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Start a trip to save your favorite routes for quick access
          </Text>
          <TouchableOpacity style={[styles.findBtn, { backgroundColor: theme.primary }]} onPress={() => router.replace('/(tabs)')} activeOpacity={0.9}>
            <Text style={styles.findBtnText}>Find a Route</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {routes.map((route) => (
            <View key={route.id} style={[styles.routeCard, { backgroundColor: theme.card }]}>
              {/* Top: info + delete */}
              <View style={styles.routeTop}>
                <View style={styles.routeInfo}>
                  <Text style={[styles.routeName, { color: theme.text }]}>{route.name}</Text>

                  {/* Origin/destination */}
                  <View style={styles.locationWrap}>
                    <View style={styles.locationRow}>
                      <View style={[styles.locDotGreen, { backgroundColor: theme.primary }]} />
                      <Text style={[styles.locationText, { color: theme.textSecondary }]}>{route.origin}</Text>
                    </View>
                    <View style={[styles.locationConnector, { borderColor: theme.gray300 }]} />
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color={Colors.red600} />
                      <Text style={[styles.locationText, { color: theme.textSecondary }]}>{route.destination}</Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={styles.routeMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="navigate-outline" size={14} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>{formatDistance(route.distanceKm)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>{route.duration}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="leaf-outline" size={14} color={theme.primary} />
                      <Text style={[styles.metaText, { color: theme.primary, fontWeight: '700' }]}>
                        {formatCO2(route.co2SavedG)}
                      </Text>
                    </View>
                  </View>

                  {/* Transport modes */}
                  <View style={styles.modesRow}>
                    {route.modes.map((mode, idx) => (
                      <View key={idx} style={[styles.modeIconBox, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name={modeIcon[mode]} size={18} color={theme.primary} />
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.dateSaved, { color: theme.textSecondary }]}>Saved on {route.dateSaved}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: theme.gray100 }]}
                  onPress={() => handleDelete(route.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.red600} />
                </TouchableOpacity>
              </View>

              {/* Use route button */}
              <TouchableOpacity
                style={[styles.useBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/(tabs)/routes')}
                activeOpacity={0.9}
              >
                <Text style={styles.useBtnText}>Use this route</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: { color: '#1A1A1A', fontSize: 24, fontWeight: '700' },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyCircle: {
    width: 128,
    height: 128,
    backgroundColor: Colors.white,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Shadow.md,
  },
  emptyTitle: { color: '#1A1A1A', fontSize: 24, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  emptySubtitle: { color: Colors.gray600, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  findBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
    ...Shadow.md,
  },
  findBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },

  routeCard: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 20,
    ...Shadow.lg,
  },
  routeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  routeInfo: { flex: 1 },
  routeName: { color: '#1A1A1A', fontSize: 17, fontWeight: '700', marginBottom: 12 },

  locationWrap: { gap: 4, marginBottom: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locDotGreen: { width: 12, height: 12, backgroundColor: ECO_GREEN, borderRadius: 6 },
  locationConnector: { width: 1, height: 20, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: Colors.gray300, marginLeft: 5 },
  locationText: { color: Colors.gray700, fontSize: 14 },

  routeMeta: { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: Colors.gray600, fontSize: 13, fontWeight: '500' },

  modesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  modeIconBox: { width: 32, height: 32, backgroundColor: Colors.emerald100, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  dateSaved: { color: Colors.gray500, fontSize: 12 },

  deleteBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.red100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  useBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  useBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
});
