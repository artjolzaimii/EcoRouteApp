import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { Co2TransparencySheet } from '@/components/co2-transparency-sheet';
import { co2DataFromRoute } from '@/lib/co2Transparency';
import { EcoRoute } from '@/lib/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function stepIcon(mode: string): { icon: IoniconName; bg: string; color: string } {
  switch (mode.toUpperCase()) {
    case 'WALKING':   return { icon: 'walk-outline',     bg: Colors.blue100,   color: Colors.blue600 };
    case 'CYCLING':
    case 'BICYCLING': return { icon: 'bicycle-outline',  bg: Colors.emerald100, color: Colors.emerald600 };
    case 'TRANSIT':
    case 'BUS':       return { icon: 'bus-outline',      bg: Colors.purple100,  color: Colors.purple600 };
    case 'SUBWAY':
    case 'TRAIN':
    case 'RAIL':
    case 'TRAM':      return { icon: 'train-outline',    bg: Colors.purple100,  color: Colors.purple600 };
    case 'PLANE':
    case 'FLIGHT':    return { icon: 'airplane-outline', bg: Colors.blue100,    color: Colors.blue600 };
    default:          return { icon: 'navigate-outline', bg: Colors.gray100,    color: Colors.gray600 };
  }
}

function formatDistance(km: number): string {
  const m = Math.round(km * 1000);
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m}m`;
}

function modeLabel(mode: string, subType?: string): string {
  if (subType === 'CYCLING_TRANSIT' || mode === 'MIXED') return 'Cycling + Transit';
  switch (mode) {
    case 'CYCLING':
    case 'BICYCLING': return 'Cycling';
    case 'TRANSIT':   return 'Transit';
    case 'WALKING':   return 'Walking';
    case 'TRAIN':     return 'Train';
    case 'PLANE':     return 'Flight';
    default:          return mode;
  }
}

function modeIcon(mode: string): IoniconName {
  switch (mode) {
    case 'CYCLING':
    case 'BICYCLING':    return 'bicycle-outline';
    case 'TRANSIT':      return 'bus-outline';
    case 'WALKING':      return 'footsteps-outline';
    case 'MIXED':
    case 'CYCLING_TRANSIT': return 'git-merge-outline';
    case 'TRAIN':        return 'train-outline';
    case 'PLANE':        return 'airplane-outline';
    default:             return 'navigate-outline';
  }
}

export type SaveState = 'idle' | 'saving' | 'saved';

interface Props {
  visible: boolean;
  route: EcoRoute | undefined;
  onClose: () => void;
  onStartRoute: () => void;
  onSave?: () => void;
  saveState?: SaveState;
}

export function RouteDetailSheet({ visible, route, onClose, onStartRoute, onSave, saveState = 'idle' }: Props) {
  const insets = useSafeAreaInsets();
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [co2SheetVisible, setCo2SheetVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(sheetAnim, { toValue: 0, damping: 30, stiffness: 300, useNativeDriver: true }).start();
    } else {
      sheetAnim.setValue(SCREEN_HEIGHT);
      setCo2SheetVisible(false);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(sheetAnim, { toValue: SCREEN_HEIGHT, duration: 280, useNativeDriver: true }).start(() => {
      onClose();
    });
  };

  if (!route) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalBackdrop} onPress={handleClose} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
            <View style={styles.sheetHandle} />

            {/* Header row */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.modeIconBox}>
                  <Ionicons name={modeIcon(route.mode)} size={20} color={Colors.emerald600} />
                </View>
                <Text style={styles.sheetTitle}>{modeLabel(route.mode, route.subType)}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
                <Ionicons name="close-outline" size={20} color={Colors.gray600} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
            >
              {/* Recommended + personalized label */}
              {route.recommended && (
                <View style={styles.recommendedRow}>
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
                </View>
              )}
              {route.recommendationReason && (
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonText}>{route.recommendationReason}</Text>
                </View>
              )}
              {route.moodReason && (
                <View style={styles.moodReasonBox}>
                  <Ionicons name="sparkles-outline" size={13} color={Colors.emerald700} />
                  <Text style={styles.moodReasonText}>{route.moodReason}</Text>
                </View>
              )}

              {/* Partner stop */}
              {route.partnerStop && (
                <View style={styles.partnerCard}>
                  <View style={styles.partnerCardHeader}>
                    <View style={styles.partnerCardIcon}>
                      <Ionicons name="bicycle-outline" size={18} color={Colors.emerald600} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.partnerCardTitle}>{route.partnerStop.partnerName}</Text>
                      <Text style={styles.partnerCardSub}>
                        Pick up {route.partnerStop.vehicleType.toLowerCase().replace('_', ' ')} at this stop
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Step-by-step breakdown */}
              {route.carbonBreakdown.length > 0 ? (
                <View style={styles.stepsWrap}>
                  {route.carbonBreakdown.map((leg, index) => {
                    const { icon, bg, color } = stepIcon(leg.mode);
                    return (
                      <View key={index} style={styles.stepRow}>
                        <View style={styles.stepLeft}>
                          <View style={[styles.stepIconBox, { backgroundColor: bg }]}>
                            <Ionicons name={icon} size={18} color={color} />
                          </View>
                          {index < route.carbonBreakdown.length - 1 && <View style={styles.stepConnector} />}
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={styles.stepInstruction}>{leg.instruction}</Text>
                          <Text style={styles.stepMeta}>
                            {formatDistance(leg.distanceKm)}
                            {leg.transitLine ? ` · ${leg.transitLine}` : ''}
                            {leg.co2Grams > 0 ? ` · ${leg.co2Grams}g CO₂` : ' · Zero emissions'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noSteps}>
                  <Text style={styles.noStepsText}>No step breakdown available.</Text>
                </View>
              )}

              {/* Summary stats */}
              <LinearGradient colors={[Colors.emerald50, '#eff6ff']} style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Ionicons name="leaf-outline" size={18} color={Colors.emerald600} style={styles.summaryIcon} />
                    <Text style={styles.summaryValue}>{route.co2Grams}g</Text>
                    <Text style={styles.summaryLabel}>CO₂</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="time-outline" size={18} color={Colors.emerald600} style={styles.summaryIcon} />
                    <Text style={styles.summaryValue}>{route.durationMin} min</Text>
                    <Text style={styles.summaryLabel}>Duration</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="location-outline" size={18} color={Colors.emerald600} style={styles.summaryIcon} />
                    <Text style={styles.summaryValue}>{route.distanceKm.toFixed(1)} km</Text>
                    <Text style={styles.summaryLabel}>Distance</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="flash-outline" size={18} color={Colors.emerald600} style={styles.summaryIcon} />
                    <Text style={styles.summaryValue}>+{route.greenPoints}</Text>
                    <Text style={styles.summaryLabel}>Points</Text>
                  </View>
                </View>
              </LinearGradient>

              <TouchableOpacity
                style={styles.co2InfoBtn}
                onPress={() => setCo2SheetVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle-outline" size={14} color={Colors.emerald700} />
                <Text style={styles.co2InfoText}>How is CO₂ calculated?</Text>
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.footerRow}>
                {onSave && (
                  <TouchableOpacity
                    style={[styles.saveBtn, saveState === 'saved' && styles.saveBtnSaved]}
                    onPress={onSave}
                    activeOpacity={0.8}
                    disabled={saveState !== 'idle'}
                  >
                    <Ionicons
                      name={saveState === 'saved' ? 'bookmark' : 'bookmark-outline'}
                      size={20}
                      color={saveState === 'saved' ? Colors.emerald600 : Colors.gray600}
                    />
                    <Text style={[styles.saveBtnText, saveState === 'saved' && styles.saveBtnTextSaved]}>
                      {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={onStartRoute}
                  activeOpacity={0.9}
                >
                  <Ionicons name="navigate-outline" size={20} color={Colors.white} />
                  <Text style={styles.startBtnText}>Start Route</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Co2TransparencySheet
        visible={co2SheetVisible}
        data={co2DataFromRoute(route)}
        onClose={() => setCo2SheetVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...Shadow.xl,
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeIconBox: {
    width: 36, height: 36,
    backgroundColor: Colors.emerald50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.gray900 },
  closeBtn: {
    width: 32, height: 32,
    backgroundColor: Colors.gray100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetScroll: { maxHeight: SCREEN_HEIGHT * 0.6 },
  sheetScrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  recommendedRow: { marginBottom: 6 },
  recommendedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.emerald100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recommendedText: { fontSize: 10, fontWeight: '700', color: Colors.emerald700 },
  recommendedSep: { fontSize: 10, color: Colors.emerald700, opacity: 0.6 },

  reasonBox: {
    backgroundColor: Colors.emerald50,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.emerald400,
  },
  reasonText: { fontSize: 12, color: Colors.emerald700, fontStyle: 'italic' },

  moodReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.emerald50,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.emerald100,
  },
  moodReasonText: { fontSize: 12, color: Colors.emerald700, flex: 1, lineHeight: 17 },

  partnerCard: {
    backgroundColor: Colors.emerald50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.emerald200,
    marginBottom: 16,
  },
  partnerCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  partnerCardIcon: {
    width: 36, height: 36,
    backgroundColor: Colors.emerald100,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  partnerCardTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 14 },
  partnerCardSub: { color: Colors.gray600, fontSize: 12, marginTop: 2 },

  stepsWrap: { gap: 0, marginBottom: 20 },
  stepRow: { flexDirection: 'row', gap: 14 },
  stepLeft: { alignItems: 'center' },
  stepIconBox: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepConnector: {
    width: 1,
    flex: 1,
    backgroundColor: Colors.gray200,
    marginVertical: 4,
    minHeight: 28,
  },
  stepContent: { flex: 1, paddingBottom: 16 },
  stepInstruction: { color: Colors.gray900, fontWeight: '600', fontSize: 14, marginBottom: 3 },
  stepMeta: { color: Colors.gray500, fontSize: 12 },

  noSteps: { paddingVertical: 24, alignItems: 'center' },
  noStepsText: { color: Colors.gray500, fontSize: 13 },

  summaryBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.emerald100,
    marginBottom: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryIcon: { marginBottom: 4 },
  summaryValue: { color: Colors.gray900, fontWeight: '700', fontSize: 14 },
  summaryLabel: { color: Colors.gray500, fontSize: 11, marginTop: 2 },

  co2InfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
    paddingVertical: 8,
  },
  co2InfoText: { color: Colors.emerald700, fontSize: 12, fontWeight: '600' },

  footerWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: Colors.gray100,
    borderRadius: 16,
    ...Shadow.sm,
  },
  saveBtnSaved: { backgroundColor: Colors.emerald50 },
  saveBtnText: { color: Colors.gray600, fontWeight: '600', fontSize: 14 },
  saveBtnTextSaved: { color: Colors.emerald600 },
  startBtn: {
    flex: 1,
    backgroundColor: Colors.emerald600,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.lg,
  },
  startBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
