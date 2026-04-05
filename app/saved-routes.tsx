import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

type TransportMode = 'walk' | 'bike' | 'bus';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SavedRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  co2Saved: string;
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
    distance: '5.2 km',
    duration: '18 min',
    co2Saved: '1.2 kg',
    modes: ['bike', 'bus'],
    dateSaved: 'Mar 15, 2026',
  },
  {
    id: '2',
    name: 'Grocery Trip',
    origin: 'Office',
    destination: 'Whole Foods Market',
    distance: '2.1 km',
    duration: '8 min',
    co2Saved: '0.5 kg',
    modes: ['walk', 'bike'],
    dateSaved: 'Mar 10, 2026',
  },
  {
    id: '3',
    name: 'Gym Route',
    origin: 'Home',
    destination: 'Green Fitness Center',
    distance: '3.8 km',
    duration: '14 min',
    co2Saved: '0.8 kg',
    modes: ['bike'],
    dateSaved: 'Mar 5, 2026',
  },
];

export default function SavedRoutesScreen() {
  const insets = useSafeAreaInsets();
  const [routes, setRoutes] = useState<SavedRoute[]>(initialRoutes);

  const handleDelete = (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Routes</Text>
      </View>

      {routes.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCircle}>
            <Ionicons name="bookmark-outline" size={64} color={Colors.gray300} />
          </View>
          <Text style={styles.emptyTitle}>No saved routes yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a trip to save your favorite routes for quick access
          </Text>
          <TouchableOpacity style={styles.findBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.9}>
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
            <View key={route.id} style={styles.routeCard}>
              {/* Top: info + delete */}
              <View style={styles.routeTop}>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>

                  {/* Origin/destination */}
                  <View style={styles.locationWrap}>
                    <View style={styles.locationRow}>
                      <View style={styles.locDotGreen} />
                      <Text style={styles.locationText}>{route.origin}</Text>
                    </View>
                    <View style={styles.locationConnector} />
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color={Colors.red600} />
                      <Text style={styles.locationText}>{route.destination}</Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="location-outline" size={14} color={Colors.gray600} />
                      <Text style={styles.statText}>{route.distance}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={14} color={Colors.gray600} />
                      <Text style={styles.statText}>{route.duration}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="leaf-outline" size={14} color={ECO_GREEN} />
                      <Text style={[styles.statText, { color: ECO_GREEN, fontWeight: '600' }]}>{route.co2Saved}</Text>
                    </View>
                  </View>

                  {/* Transport modes */}
                  <View style={styles.modesRow}>
                    {route.modes.map((mode, idx) => (
                      <View key={idx} style={styles.modeIconBox}>
                        <Ionicons name={modeIcon[mode]} size={18} color={ECO_GREEN} />
                      </View>
                    ))}
                  </View>

                  <Text style={styles.dateSaved}>Saved on {route.dateSaved}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(route.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.red600} />
                </TouchableOpacity>
              </View>

              {/* Use route button */}
              <TouchableOpacity
                style={styles.useBtn}
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

  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: Colors.gray600, fontSize: 13 },

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
