import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Svg, { Path, Rect, Defs, Pattern } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type EcoPartner = {
  id: number;
  name: string;
  logo: string;
  offer: string;
  distance: string;
  description: string;
  points: number;
  position: { top: string; left: string };
};

const transportModes = [
  { id: 'bike', label: 'Bike', icon: 'bicycle-outline' as const },
  { id: 'bus', label: 'Transit', icon: 'bus-outline' as const },
  { id: 'ev', label: 'EV', icon: 'car-outline' as const },
];

const ecoPartners: EcoPartner[] = [
  {
    id: 1,
    name: 'Green Coffee Co.',
    logo: '☕',
    offer: 'Free coffee',
    distance: '120m from route',
    description: 'Organic fair-trade coffee shop using 100% renewable energy',
    points: 50,
    position: { top: '28%', left: '30%' },
  },
  {
    id: 2,
    name: 'EcoRide Bike Shop',
    logo: '🚴',
    offer: '10% off',
    distance: 'On your route',
    description: 'Local bike shop offering repairs and eco-friendly gear',
    points: 75,
    position: { top: '52%', left: '58%' },
  },
];

const quickRoutes = [
  { name: 'Morning Commute', from: 'Home', to: 'Office', distance: '5.2 km', time: '18 min', co2Saved: '1.2 kg' },
  { name: 'Grocery Run', from: 'Office', to: 'Whole Foods', distance: '2.1 km', time: '8 min', co2Saved: '0.5 kg' },
];

const headerStats = [
  { icon: 'leaf-outline' as const, value: '3.8 kg', label: 'CO₂ Saved' },
  { icon: 'time-outline' as const, value: '45 min', label: 'Active Time' },
  { icon: 'flash-outline' as const, value: '280', label: 'Points' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedMode, setSelectedMode] = useState('bike');
  const [selectedPartner, setSelectedPartner] = useState<EcoPartner | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const openSheet = (partner: EcoPartner) => {
    setSelectedPartner(partner);
    setModalVisible(true);
    Animated.spring(sheetAnim, { toValue: 0, damping: 30, stiffness: 300, useNativeDriver: true }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, { toValue: SCREEN_HEIGHT, duration: 280, useNativeDriver: true }).start(() => {
      setModalVisible(false);
      setSelectedPartner(null);
    });
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.emerald600, Colors.emerald700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <Text style={styles.headerGreeting}>Good morning,</Text>
          <Text style={styles.headerTitle}>Ready to make a difference?</Text>

          <View style={styles.impactCard}>
            <View style={styles.impactCardTop}>
              <Text style={styles.impactLabel}>Today's Impact</Text>
              <View style={styles.trendBadge}>
                <Ionicons name="trending-up-outline" size={12} color={Colors.white} />
                <Text style={styles.trendText}>+12%</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              {headerStats.map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Ionicons name={s.icon} size={20} color={Colors.white} />
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Transport Mode */}
        <View style={styles.sectionOffset}>
          <View style={[styles.card, styles.modeCardPad]}>
            <Text style={styles.cardHeading}>Travel Mode</Text>
            <View style={styles.modeRow}>
              {transportModes.map((mode) => {
                const active = selectedMode === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.modeBtn, active && styles.modeBtnActive]}
                    onPress={() => setSelectedMode(mode.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={mode.icon} size={24} color={active ? Colors.emerald600 : Colors.gray400} />
                    <Text style={[styles.modeBtnLabel, active && styles.modeBtnLabelActive]}>{mode.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Mini Map + Route Input */}
        <View style={styles.section}>
          <View style={[styles.card, styles.mapCardOuter]}>
            {/* Mini Map */}
            <View style={styles.miniMap}>
              <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={StyleSheet.absoluteFillObject} />
              <Svg style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <Pattern id="hgrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <Path d="M 30 0 L 0 0 0 30" fill="none" stroke={Colors.emerald600} strokeWidth="0.5" opacity="0.2" />
                  </Pattern>
                </Defs>
                <Rect x={0} y={0} width={800} height={400} fill="url(#hgrid)" />
                <Path d="M 30 120 Q 120 80, 200 100 T 370 40" stroke={Colors.emerald600} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
              </Svg>

              {ecoPartners.map((partner) => (
                <View key={partner.id} style={[styles.mapPin, { top: partner.position.top as any, left: partner.position.left as any }]}>
                  <TouchableOpacity style={styles.pinCard} onPress={() => openSheet(partner)} activeOpacity={0.9}>
                    <View style={styles.pinLogoWrap}>
                      <Text style={styles.pinLogoText}>{partner.logo}</Text>
                    </View>
                    <View>
                      <Text style={styles.pinName}>{partner.name}</Text>
                      <View style={styles.pinBadge}>
                        <Text style={styles.pinBadgeText}>{partner.offer}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.pinStem} />
                  <View style={styles.pinDot} />
                </View>
              ))}
            </View>

            {/* Inputs */}
            <View style={styles.inputsWrap}>
              <View style={styles.inputRow}>
                <View style={styles.inputDotGreen}>
                  <View style={styles.inputDotGreenInner} />
                </View>
                <TextInput style={styles.routeInput} defaultValue="Home" placeholder="Current location" placeholderTextColor={Colors.gray400} />
              </View>
              <View style={styles.inputDivider} />
              <View style={styles.inputRow}>
                <View style={styles.inputDotRed}>
                  <Ionicons name="location-outline" size={14} color={Colors.red600} />
                </View>
                <TextInput style={styles.routeInput} placeholder="Where to?" placeholderTextColor={Colors.gray400} />
              </View>
            </View>

            <TouchableOpacity style={styles.findBtn} activeOpacity={0.9} onPress={() => router.push('/search')}>
              <Ionicons name="navigate-outline" size={20} color={Colors.white} />
              <Text style={styles.findBtnText}>Find Eco-Route</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Routes */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Quick Routes</Text>
            <TouchableOpacity style={styles.viewAllRow} activeOpacity={0.7} onPress={() => router.push('/(tabs)/routes')}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward-outline" size={16} color={Colors.emerald600} />
            </TouchableOpacity>
          </View>
          <View style={styles.routeListWrap}>
            {quickRoutes.map((route) => (
              <TouchableOpacity key={route.name} style={styles.routeCard} activeOpacity={0.85} onPress={() => router.push('/route-detail')}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.routeCardName}>{route.name}</Text>
                    <Text style={styles.routeCardSub}>{route.from} → {route.to}</Text>
                  </View>
                  <View style={styles.routeCardIconWrap}>
                    <Ionicons name="bicycle-outline" size={20} color={Colors.emerald600} />
                  </View>
                </View>
                <View style={[styles.statsRow, { marginTop: 12 }]}>
                  <View style={styles.miniStat}>
                    <Ionicons name="location-outline" size={14} color={Colors.gray500} />
                    <Text style={styles.miniStatText}>{route.distance}</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Ionicons name="time-outline" size={14} color={Colors.gray500} />
                    <Text style={styles.miniStatText}>{route.time}</Text>
                  </View>
                  <View style={[styles.miniStat, { marginLeft: 'auto' }]}>
                    <Ionicons name="leaf-outline" size={14} color={Colors.emerald600} />
                    <Text style={[styles.miniStatText, { color: Colors.emerald600, fontWeight: '600' }]}>{route.co2Saved}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Bottom Sheet Modal */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.backdrop} onPress={closeSheet} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
            <View style={styles.sheetHandle} />
            {selectedPartner && (
              <View style={styles.sheetBody}>
                <View style={styles.rowEnd}>
                  <TouchableOpacity style={styles.closeBtn} onPress={closeSheet}>
                    <Ionicons name="close-outline" size={20} color={Colors.gray600} />
                  </TouchableOpacity>
                </View>

                <View style={styles.partnerRow}>
                  <View style={styles.partnerLogoBox}>
                    <Text style={styles.partnerLogoText}>{selectedPartner.logo}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ecoLabel}>Eco-Partner</Text>
                    <Text style={styles.partnerName}>{selectedPartner.name}</Text>
                    <Text style={styles.partnerDist}>{selectedPartner.distance}</Text>
                  </View>
                </View>

                <View style={styles.offerBox}>
                  <View style={styles.offerTitleRow}>
                    <Ionicons name="gift-outline" size={20} color={Colors.emerald600} />
                    <Text style={styles.offerTitleText}>{selectedPartner.offer}</Text>
                  </View>
                  <Text style={styles.offerDesc}>{selectedPartner.description}</Text>
                </View>

                <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.pointsRow}>
                  <Ionicons name="flash-outline" size={20} color={Colors.emerald600} />
                  <View>
                    <Text style={styles.pointsTitle}>Earn +{selectedPartner.points} points</Text>
                    <Text style={styles.pointsSub}>When you visit on this route</Text>
                  </View>
                </LinearGradient>

                <TouchableOpacity style={styles.earnBtn} activeOpacity={0.9} onPress={() => { closeSheet(); router.push('/route-detail'); }}>
                  <Text style={styles.earnBtnText}>Earn with this route</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  // Header
  header: { paddingHorizontal: 24, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerGreeting: { color: Colors.emeraldText100, fontSize: 13, marginBottom: 4 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700', marginBottom: 20 },
  impactCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  impactCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  impactLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trendText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { color: Colors.white, fontWeight: '700', fontSize: 17 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },

  // Sections
  sectionOffset: { paddingHorizontal: 24, marginTop: -16 },
  section: { paddingHorizontal: 24, marginTop: 24 },
  card: { backgroundColor: Colors.white, borderRadius: 16, ...Shadow.lg },
  modeCardPad: { padding: 16 },
  cardHeading: { color: Colors.gray900, fontWeight: '600', fontSize: 15, marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    gap: 4,
  },
  modeBtnActive: { backgroundColor: Colors.emerald50, borderColor: Colors.emerald600 },
  modeBtnLabel: { fontSize: 12, fontWeight: '500', color: Colors.gray600 },
  modeBtnLabelActive: { color: Colors.emerald700 },

  // Map
  mapCardOuter: { overflow: 'hidden' },
  miniMap: { height: 160, position: 'relative', overflow: 'hidden' },
  mapPin: { position: 'absolute', alignItems: 'center' },
  pinCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.emerald100,
    marginBottom: 2,
    ...Shadow.md,
  },
  pinLogoWrap: { width: 22, height: 22, backgroundColor: Colors.emerald100, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pinLogoText: { fontSize: 11 },
  pinName: { fontSize: 10, fontWeight: '600', color: Colors.gray900, lineHeight: 14 },
  pinBadge: { backgroundColor: Colors.emerald100, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginTop: 2 },
  pinBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.emerald700 },
  pinStem: { width: 2, height: 8, backgroundColor: Colors.emerald600, borderRadius: 1 },
  pinDot: { width: 6, height: 6, backgroundColor: Colors.emerald600, borderRadius: 3 },

  // Inputs
  inputsWrap: { padding: 16, gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inputDotGreen: { width: 32, height: 32, backgroundColor: Colors.emerald100, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inputDotGreenInner: { width: 12, height: 12, backgroundColor: Colors.emerald600, borderRadius: 6 },
  inputDotRed: { width: 32, height: 32, backgroundColor: Colors.red100, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  routeInput: { flex: 1, color: Colors.gray900, fontSize: 14, paddingVertical: 0 },
  inputDivider: { height: 20, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: Colors.gray200, marginLeft: 15 },
  findBtn: { backgroundColor: Colors.emerald600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  findBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },

  // Quick routes
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 17 },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: Colors.emerald600, fontSize: 13, fontWeight: '600' },
  routeListWrap: { gap: 12 },
  routeCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, ...Shadow.sm },
  routeCardName: { color: Colors.gray900, fontWeight: '600', fontSize: 15, marginBottom: 4 },
  routeCardSub: { color: Colors.gray500, fontSize: 13 },
  routeCardIconWrap: { width: 40, height: 40, backgroundColor: Colors.emerald100, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniStatText: { color: Colors.gray600, fontSize: 13 },

  // Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.black40 },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, ...Shadow.xl },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetBody: { paddingHorizontal: 24, paddingBottom: 40 },
  rowEnd: { alignItems: 'flex-end', marginBottom: 8 },
  closeBtn: { width: 32, height: 32, backgroundColor: Colors.gray100, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  partnerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 16 },
  partnerLogoBox: { width: 64, height: 64, backgroundColor: Colors.emerald100, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  partnerLogoText: { fontSize: 28 },
  ecoLabel: { color: Colors.emerald600, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  partnerName: { color: Colors.gray900, fontWeight: '700', fontSize: 20, marginBottom: 4 },
  partnerDist: { color: Colors.gray500, fontSize: 13 },
  offerBox: { backgroundColor: Colors.emerald50, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.emerald100, marginBottom: 12 },
  offerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  offerTitleText: { color: Colors.emerald900, fontWeight: '700', fontSize: 17 },
  offerDesc: { color: Colors.emerald700, fontSize: 13, lineHeight: 18 },
  pointsRow: { borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  pointsTitle: { color: Colors.gray900, fontWeight: '600', fontSize: 14 },
  pointsSub: { color: Colors.gray600, fontSize: 11, marginTop: 2 },
  earnBtn: { backgroundColor: Colors.emerald600, borderRadius: 16, paddingVertical: 16, alignItems: 'center', ...Shadow.lg },
  earnBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
