import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Svg, { Path, Rect, Defs, Pattern, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.42);

type Route = {
  id: number;
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  distance: string;
  duration: string;
  co2Saved: string;
  calories: string;
  difficulty: string;
  rating: string;
  highlights: string[];
};

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

const routes: Route[] = [
  { id: 0, name: 'Eco-Optimal', icon: 'bicycle-outline', distance: '5.2 km', duration: '18 min', co2Saved: '1.2 kg', calories: '145 kcal', difficulty: 'Moderate', rating: 'Best', highlights: ['Protected bike lanes', 'Scenic route', 'Low traffic'] },
  { id: 1, name: 'Transit Mix', icon: 'bus-outline', distance: '5.4 km', duration: '22 min', co2Saved: '0.9 kg', calories: '45 kcal', difficulty: 'Easy', rating: 'Good', highlights: ['Express bus', '2 min wait', 'Air conditioned'] },
  { id: 2, name: 'Walking Path', icon: 'footsteps-outline', distance: '4.8 km', duration: '58 min', co2Saved: '1.3 kg', calories: '320 kcal', difficulty: 'Active', rating: 'Great', highlights: ['Park route', 'Shaded paths', 'Coffee stops'] },
];

const ecoPartners: EcoPartner[] = [
  { id: 1, name: 'Sustainable Smoothies', logo: '🥤', offer: '15% off', distance: '85m from route', description: '100% organic smoothies with reusable cups', points: 60, position: { top: '35%', left: '42%' } },
  { id: 2, name: 'Green Coffee Co.', logo: '☕', offer: 'Free coffee', distance: 'On your route', description: 'Organic fair-trade coffee shop using 100% renewable energy', points: 50, position: { top: '60%', left: '62%' } },
];

const sponsoredPartner = {
  logo: '🌿',
  name: 'Plant Power Café',
  headline: 'Stop at Plant Power — earn 50 bonus points',
  distance: '120m',
  offer: 'Free plant-based snack',
  points: 50,
};

function ratingColor(rating: string) {
  if (rating === 'Best') return { bg: Colors.emerald100, text: Colors.emerald700 };
  if (rating === 'Great') return { bg: Colors.amber100, text: Colors.amber700 };
  return { bg: Colors.blue100, text: Colors.blue600 };
}

export default function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedRoute, setSelectedRoute] = useState(0);
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Map Area */}
        <View style={[styles.mapArea, { height: MAP_HEIGHT }]}>
          <LinearGradient colors={[Colors.emerald100, '#dbeafe']} style={StyleSheet.absoluteFillObject} />

          {/* SVG Map */}
          <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 400 300">
            <Defs>
              <Pattern id="rgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <Path d="M 40 0 L 0 0 0 40" fill="none" stroke={Colors.emerald600} strokeWidth="0.5" opacity="0.1" />
              </Pattern>
            </Defs>
            <Rect x={0} y={0} width={400} height={300} fill="url(#rgrid)" />
            <Path d="M 50 250 Q 150 200, 200 150 T 350 50" stroke={Colors.emerald600} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="8 4" opacity="0.3" />
            <Path d="M 50 250 Q 120 180, 200 150 T 350 50" stroke={Colors.emerald600} strokeWidth="6" fill="none" strokeLinecap="round" />
            <Circle cx={50} cy={250} r={12} fill={Colors.emerald600} />
            <Circle cx={50} cy={250} r={6} fill="white" />
            <Circle cx={350} cy={50} r={12} fill={Colors.red600} />
            <Circle cx={350} cy={50} r={6} fill="white" />
          </Svg>

          {/* Eco-partner pins */}
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

          {/* Top search bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarInner}>
              <View style={styles.navIconWrap}>
                <Ionicons name="navigate-outline" size={20} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topBarTitle}>Home → Office</Text>
                <Text style={styles.topBarSub}>3 routes available</Text>
              </View>
            </View>
          </View>

          {/* Impact badge */}
          <View style={styles.impactBadge}>
            <Ionicons name="leaf-outline" size={16} color={Colors.emerald600} />
            <View>
              <Text style={styles.impactBadgeSub}>Today</Text>
              <Text style={styles.impactBadgeVal}>+3.8 kg saved</Text>
            </View>
          </View>
        </View>

        {/* Route Options Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.panelContent}>
              <Text style={styles.panelTitle}>Choose Your Route</Text>

              {/* Route cards */}
              <View style={styles.routeList}>
                {routes.map((route, idx) => {
                  const active = selectedRoute === idx;
                  const rc = ratingColor(route.rating);
                  return (
                    <TouchableOpacity
                      key={route.id}
                      style={[styles.routeCard, active && styles.routeCardActive]}
                      onPress={() => setSelectedRoute(idx)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.routeCardTop}>
                        <View style={styles.routeCardLeft}>
                          <View style={[styles.routeIconBox, active && styles.routeIconBoxActive]}>
                            <Ionicons name={route.icon} size={24} color={active ? Colors.white : Colors.gray600} />
                          </View>
                          <View>
                            <Text style={[styles.routeCardName, active && styles.routeCardNameActive]}>{route.name}</Text>
                            <View style={styles.routeCardMeta}>
                              <Ionicons name="location-outline" size={13} color={Colors.gray500} />
                              <Text style={styles.routeCardMetaText}>{route.distance}</Text>
                              <Ionicons name="time-outline" size={13} color={Colors.gray500} />
                              <Text style={styles.routeCardMetaText}>{route.duration}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={[styles.ratingBadge, { backgroundColor: rc.bg }]}>
                          <Text style={[styles.ratingText, { color: rc.text }]}>{route.rating}</Text>
                        </View>
                      </View>

                      <View style={styles.routeCardIcons}>
                        <View style={styles.routeCardIconStat}>
                          <Ionicons name="leaf-outline" size={14} color={Colors.emerald600} />
                          <Text style={styles.routeCardIconStatEco}>{route.co2Saved}</Text>
                        </View>
                        <View style={styles.routeCardIconStat}>
                          <Ionicons name="trending-up-outline" size={14} color={Colors.orange600} />
                          <Text style={styles.routeCardIconStatGray}>{route.calories}</Text>
                        </View>
                        <View style={styles.routeCardIconStat}>
                          <Ionicons name="alert-circle-outline" size={14} color={Colors.gray400} />
                          <Text style={styles.routeCardIconStatGray}>{route.difficulty}</Text>
                        </View>
                      </View>

                      {active && (
                        <View style={styles.highlightsWrap}>
                          {route.highlights.map((h) => (
                            <View key={h} style={styles.highlightChip}>
                              <Text style={styles.highlightChipText}>{h}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sponsored Eco-Partner Card */}
              <LinearGradient colors={[Colors.emerald50, '#f0fdf4']} style={styles.sponsoredCard}>
                <View style={styles.sponsoredBadgeWrap}>
                  <Text style={styles.sponsoredBadgeText}>Eco-Partner</Text>
                </View>
                <View style={styles.sponsoredTop}>
                  <View style={styles.sponsoredLogoWrap}>
                    <Text style={styles.sponsoredLogo}>{sponsoredPartner.logo}</Text>
                  </View>
                  <View style={{ flex: 1, paddingRight: 64 }}>
                    <Text style={styles.sponsoredHeadline}>{sponsoredPartner.headline}</Text>
                    <View style={styles.sponsoredTags}>
                      <View style={styles.sponsoredTagGreen}>
                        <Ionicons name="location-outline" size={12} color={Colors.white} />
                        <Text style={styles.sponsoredTagGreenText}>{sponsoredPartner.distance} from route</Text>
                      </View>
                      <View style={styles.sponsoredTagWhite}>
                        <Ionicons name="gift-outline" size={12} color={Colors.emerald700} />
                        <Text style={styles.sponsoredTagWhiteText}>{sponsoredPartner.offer}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.sponsoredBottom}>
                  <View style={styles.sponsoredPointsRow}>
                    <Ionicons name="flash-outline" size={14} color={Colors.emerald600} />
                    <Text style={styles.sponsoredPointsText}>+{sponsoredPartner.points} bonus points</Text>
                  </View>
                  <TouchableOpacity style={styles.addStopBtn} activeOpacity={0.7}>
                    <Text style={styles.addStopText}>Add stop</Text>
                    <Ionicons name="arrow-forward-outline" size={14} color={Colors.emerald700} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* Start Navigation */}
              <TouchableOpacity style={styles.startBtn} activeOpacity={0.9} onPress={() => router.push('/route-detail')}>
                <Ionicons name="navigate-outline" size={20} color={Colors.white} />
                <Text style={styles.startBtnText}>Start Navigation</Text>
              </TouchableOpacity>

              <View style={{ height: 16 }} />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Bottom Sheet Modal */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalBackdrop} onPress={closeSheet} />
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

  // Map
  mapArea: { position: 'relative', overflow: 'hidden' },
  mapPin: { position: 'absolute', alignItems: 'center' },
  pinCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.emerald100,
    marginBottom: 2,
    ...Shadow.md,
  },
  pinLogoWrap: { width: 20, height: 20, backgroundColor: Colors.emerald100, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pinLogoText: { fontSize: 10 },
  pinName: { fontSize: 9, fontWeight: '600', color: Colors.gray900, lineHeight: 13 },
  pinBadge: { backgroundColor: Colors.emerald100, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1, marginTop: 1 },
  pinBadgeText: { fontSize: 8, fontWeight: '700', color: Colors.emerald700 },
  pinStem: { width: 2, height: 6, backgroundColor: Colors.emerald600, borderRadius: 1 },
  pinDot: { width: 5, height: 5, backgroundColor: Colors.emerald600, borderRadius: 2.5 },

  // Top bar
  topBar: { position: 'absolute', top: 16, left: 24, right: 24, zIndex: 10 },
  topBarInner: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadow.lg,
  },
  navIconWrap: { width: 40, height: 40, backgroundColor: Colors.emerald600, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { color: Colors.gray900, fontWeight: '600', fontSize: 13 },
  topBarSub: { color: Colors.gray500, fontSize: 11, marginTop: 1 },

  // Impact badge
  impactBadge: {
    position: 'absolute',
    top: 88,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
    ...Shadow.lg,
  },
  impactBadgeSub: { fontSize: 11, color: Colors.gray500 },
  impactBadgeVal: { fontSize: 13, fontWeight: '700', color: Colors.emerald600 },

  // Panel
  panel: { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, ...Shadow.xl },
  panelHandle: { width: 48, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  panelContent: { paddingHorizontal: 24, paddingTop: 8 },
  panelTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 20, marginBottom: 16 },

  // Route cards
  routeList: { gap: 12, marginBottom: 24 },
  routeCard: { borderRadius: 16, borderWidth: 2, borderColor: Colors.gray200, padding: 16, backgroundColor: Colors.gray50 },
  routeCardActive: { backgroundColor: Colors.emerald50, borderColor: Colors.emerald600, ...Shadow.md },
  routeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  routeCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  routeIconBoxActive: { backgroundColor: Colors.emerald600 },
  routeCardName: { fontWeight: '600', fontSize: 15, color: Colors.gray900, marginBottom: 4 },
  routeCardNameActive: { color: Colors.emerald900 },
  routeCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeCardMetaText: { fontSize: 13, color: Colors.gray600 },
  ratingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  ratingText: { fontSize: 11, fontWeight: '600' },
  routeCardIcons: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  routeCardIconStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeCardIconStatEco: { fontSize: 13, fontWeight: '600', color: Colors.emerald600 },
  routeCardIconStatGray: { fontSize: 13, color: Colors.gray600 },
  highlightsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.emerald200 },
  highlightChip: { backgroundColor: Colors.white, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.emerald200 },
  highlightChipText: { fontSize: 11, color: Colors.emerald700 },

  // Sponsored card
  sponsoredCard: { borderRadius: 16, borderWidth: 2, borderColor: Colors.emerald200, padding: 16, marginBottom: 24, overflow: 'hidden', position: 'relative' },
  sponsoredBadgeWrap: { position: 'absolute', top: 12, right: 12 },
  sponsoredBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.emerald700, backgroundColor: Colors.emerald100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: Colors.emerald200 },
  sponsoredTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  sponsoredLogoWrap: { width: 56, height: 56, backgroundColor: Colors.white, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.emerald100, ...Shadow.sm },
  sponsoredLogo: { fontSize: 24 },
  sponsoredHeadline: { color: Colors.gray900, fontWeight: '700', fontSize: 14, marginBottom: 8 },
  sponsoredTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  sponsoredTagGreen: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.emerald600, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  sponsoredTagGreenText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  sponsoredTagWhite: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: Colors.emerald200 },
  sponsoredTagWhiteText: { color: Colors.emerald700, fontSize: 11, fontWeight: '600' },
  sponsoredBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sponsoredPointsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sponsoredPointsText: { color: Colors.gray700, fontSize: 13 },
  addStopBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addStopText: { color: Colors.emerald700, fontWeight: '600', fontSize: 13 },

  // Start button
  startBtn: { backgroundColor: Colors.emerald600, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...Shadow.lg },
  startBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },

  // Modal / Bottom sheet
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.black40 },
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
