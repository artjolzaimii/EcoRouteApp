import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadow } from '@/constants/theme';
import { Co2TransparencyData, formatKg, modeDisplayName } from '@/lib/co2Transparency';

type Props = {
  visible: boolean;
  data: Co2TransparencyData | null;
  onClose: () => void;
};

export function Co2TransparencySheet({ visible, data, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>How is CO₂ calculated?</Text>
              <Text style={styles.subtitle}>A transparent estimate for this route.</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="close-outline" size={20} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          {data && (
            <>
              <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.summaryBox}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{data.distanceKm.toFixed(1)} km</Text>
                  <Text style={styles.summaryLabel}>distance used</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{modeDisplayName(data.mode)}</Text>
                  <Text style={styles.summaryLabel}>selected mode</Text>
                </View>
              </LinearGradient>

              <View style={styles.factList}>
                <Fact label="Emission factor" value={`${data.emissionFactor} g CO₂ per km`} />
                <Fact label="Driving baseline" value={`${formatKg(data.carBaselineGrams)} CO₂`} />
                <Fact label="This route emits" value={`${formatKg(data.co2EmittedGrams)} CO₂`} />
                <Fact label="CO₂ saved" value={`${formatKg(data.carBaselineGrams)} - ${formatKg(data.co2EmittedGrams)} = ${formatKg(data.co2SavedGrams)}`} />
                <Fact label="Points" value={`${Math.round(data.co2SavedGrams)}g saved / 10 x ${data.pointMultiplier} = ${data.greenPoints} pts`} />
              </View>

              <Text style={styles.note}>
                Emission factors are based on official and reputable environmental transport data stored in EcoRoute.
                Real-world results can vary with vehicle type, occupancy, energy source, and route conditions.
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.black40 },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 32,
    ...Shadow.xl,
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 },
  title: { color: Colors.gray900, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: Colors.gray600, fontSize: 13 },
  closeBtn: { width: 32, height: 32, backgroundColor: Colors.gray100, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  summaryBox: { borderRadius: 16, padding: 14, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: Colors.emerald100, marginBottom: 16 },
  summaryItem: { flex: 1 },
  summaryValue: { color: Colors.gray900, fontWeight: '700', fontSize: 16, marginBottom: 2 },
  summaryLabel: { color: Colors.gray600, fontSize: 12 },
  factList: { borderTopWidth: 1, borderTopColor: Colors.gray100 },
  factRow: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  factLabel: { color: Colors.gray600, fontSize: 12, marginBottom: 3 },
  factValue: { color: Colors.gray900, fontSize: 14, fontWeight: '600', lineHeight: 19 },
  note: { color: Colors.gray600, fontSize: 12, lineHeight: 18, marginTop: 14 },
});
