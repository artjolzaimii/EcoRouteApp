import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const STORAGE_KEY = 'ecoroute_preferences';

type DistanceUnit = 'km' | 'miles';
type TransportMode = 'WALKING' | 'CYCLING' | 'TRANSIT' | 'EV';

type Preferences = {
  distanceUnit: DistanceUnit;
  preferredModes: TransportMode[];
  showCo2OnMap: boolean;
  autoStartNavigation: boolean;
  weeklyGoalKg: number;
  reducedAnimations: boolean;
};

const DEFAULT_PREFS: Preferences = {
  distanceUnit: 'km',
  preferredModes: ['CYCLING', 'TRANSIT'],
  showCo2OnMap: true,
  autoStartNavigation: false,
  weeklyGoalKg: 5,
  reducedAnimations: false,
};

const MODES: { key: TransportMode; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }[] = [
  { key: 'WALKING', label: 'Walking', icon: 'walk-outline', color: Colors.emerald600 },
  { key: 'CYCLING', label: 'Cycling', icon: 'bicycle-outline', color: Colors.blue600 },
  { key: 'TRANSIT', label: 'Transit', icon: 'bus-outline', color: Colors.purple600 },
  { key: 'EV', label: 'Electric Vehicle', icon: 'car-outline', color: Colors.amber600 },
];

const GOAL_OPTIONS = [1, 2, 5, 10, 20];

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const savePrefs = async (updated: Preferences) => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPrefs(updated);
    } catch {
      Alert.alert('Error', 'Could not save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const toggleMode = (mode: TransportMode) => {
    const modes = prefs.preferredModes.includes(mode)
      ? prefs.preferredModes.filter((m) => m !== mode)
      : [...prefs.preferredModes, mode];
    if (modes.length === 0) {
      Alert.alert('At least one mode required', 'Please select at least one preferred transport mode.');
      return;
    }
    savePrefs({ ...prefs, preferredModes: modes });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.emerald600} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        {saving && <ActivityIndicator size="small" color={Colors.emerald600} />}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Units */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Units & Display</Text>
          <View style={styles.card}>
            <Text style={styles.rowLabel}>Distance Unit</Text>
            <View style={styles.segmentRow}>
              {(['km', 'miles'] as DistanceUnit[]).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.segment, prefs.distanceUnit === unit && styles.segmentActive]}
                  onPress={() => savePrefs({ ...prefs, distanceUnit: unit })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, prefs.distanceUnit === unit && styles.segmentTextActive]}>
                    {unit === 'km' ? 'Kilometres' : 'Miles'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Show CO₂ on map</Text>
                <Text style={styles.switchSub}>Display CO₂ savings for each route option</Text>
              </View>
              <Switch
                value={prefs.showCo2OnMap}
                onValueChange={(v) => savePrefs({ ...prefs, showCo2OnMap: v })}
                trackColor={{ false: Colors.gray300, true: Colors.emerald600 }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Reduce animations</Text>
                <Text style={styles.switchSub}>For lower battery usage and motion sensitivity</Text>
              </View>
              <Switch
                value={prefs.reducedAnimations}
                onValueChange={(v) => savePrefs({ ...prefs, reducedAnimations: v })}
                trackColor={{ false: Colors.gray300, true: Colors.emerald600 }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Transport Modes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Transport Modes</Text>
          <Text style={styles.sectionSub}>EcoRoute will prioritise these modes when planning routes</Text>
          <View style={styles.modesGrid}>
            {MODES.map((m) => {
              const active = prefs.preferredModes.includes(m.key);
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.modeCard, active && { borderColor: m.color, borderWidth: 2 }]}
                  onPress={() => toggleMode(m.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.modeIcon, { backgroundColor: active ? m.color + '20' : Colors.gray100 }]}>
                    <Ionicons name={m.icon} size={24} color={active ? m.color : Colors.gray400} />
                  </View>
                  <Text style={[styles.modeLabel, active && { color: m.color, fontWeight: '600' }]}>{m.label}</Text>
                  {active && (
                    <View style={[styles.modeCheck, { backgroundColor: m.color }]}>
                      <Ionicons name="checkmark" size={12} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Auto-start navigation</Text>
                <Text style={styles.switchSub}>Begin turn-by-turn guidance automatically after selecting a route</Text>
              </View>
              <Switch
                value={prefs.autoStartNavigation}
                onValueChange={(v) => savePrefs({ ...prefs, autoStartNavigation: v })}
                trackColor={{ false: Colors.gray300, true: Colors.emerald600 }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Weekly CO2 Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly CO₂ Saving Goal</Text>
          <Text style={styles.sectionSub}>Set a personal target for how much CO₂ you want to save each week</Text>
          <View style={styles.goalRow}>
            {GOAL_OPTIONS.map((kg) => (
              <TouchableOpacity
                key={kg}
                style={[styles.goalChip, prefs.weeklyGoalKg === kg && styles.goalChipActive]}
                onPress={() => savePrefs({ ...prefs, weeklyGoalKg: kg })}
                activeOpacity={0.8}
              >
                <Text style={[styles.goalChipText, prefs.weeklyGoalKg === kg && styles.goalChipTextActive]}>
                  {kg} kg
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.goalInfo}>
            <Ionicons name="leaf-outline" size={16} color={Colors.emerald600} />
            <Text style={styles.goalInfoText}>
              That's roughly {(prefs.weeklyGoalKg / 0.021).toFixed(0)} km of car travel avoided per week
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.gray50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: '#1A1A1A', fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  section: { gap: 10, marginBottom: 8 },
  sectionTitle: { color: Colors.gray500, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  sectionSub: { color: Colors.gray500, fontSize: 13, lineHeight: 18, marginTop: -4 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, gap: 16, ...Shadow.sm },
  rowLabel: { color: Colors.gray800, fontWeight: '600', fontSize: 15, marginBottom: 8 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: Colors.emerald600 },
  segmentText: { color: Colors.gray600, fontWeight: '600', fontSize: 14 },
  segmentTextActive: { color: Colors.white },
  divider: { height: 1, backgroundColor: Colors.gray100 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchInfo: { flex: 1 },
  switchLabel: { color: Colors.gray900, fontWeight: '600', fontSize: 15, marginBottom: 2 },
  switchSub: { color: Colors.gray500, fontSize: 12, lineHeight: 16 },
  modesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
    ...Shadow.sm,
    position: 'relative',
  },
  modeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modeLabel: { color: Colors.gray700, fontSize: 13, fontWeight: '500', textAlign: 'center' },
  modeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    ...Shadow.sm,
  },
  goalChipActive: { backgroundColor: Colors.emerald600, borderColor: Colors.emerald600 },
  goalChipText: { color: Colors.gray700, fontWeight: '600', fontSize: 14 },
  goalChipTextActive: { color: Colors.white },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.emerald50,
    borderRadius: 12,
    padding: 12,
  },
  goalInfoText: { flex: 1, color: Colors.emerald700, fontSize: 13, lineHeight: 18 },
});
