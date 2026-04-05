import React, { useState, useEffect, useRef } from 'react';
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
import Svg, { Rect } from 'react-native-svg';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

const redeemedCoupon = {
  businessName: 'Green Coffee Co.',
  offerHeadline: '10% off any purchase',
  code: 'ECO-X7K2M9',
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function CouponRedeemedScreen() {
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState(600);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
          {/* Success Icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={56} color={Colors.white} />
            </View>
          </Animated.View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Coupon Redeemed!</Text>
            <Text style={styles.businessName}>{redeemedCoupon.businessName}</Text>
            <Text style={styles.offerHeadline}>{redeemedCoupon.offerHeadline}</Text>
          </View>

          {/* Redemption Card */}
          <View style={styles.redemptionCard}>
            <Text style={styles.showLabel}>Show this to the cashier</Text>

            {/* Code */}
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{redeemedCoupon.code}</Text>
            </View>

            {/* QR Code (SVG-based mock) */}
            <View style={styles.qrWrap}>
              <View style={styles.qrBox}>
                <Svg width={160} height={160} viewBox="0 0 160 160">
                  {/* Top-left finder */}
                  <Rect x={10} y={10} width={50} height={50} fill="none" stroke="#1A1A1A" strokeWidth={8} />
                  <Rect x={22} y={22} width={26} height={26} fill="#1A1A1A" />
                  {/* Top-right finder */}
                  <Rect x={100} y={10} width={50} height={50} fill="none" stroke="#1A1A1A" strokeWidth={8} />
                  <Rect x={112} y={22} width={26} height={26} fill="#1A1A1A" />
                  {/* Bottom-left finder */}
                  <Rect x={10} y={100} width={50} height={50} fill="none" stroke="#1A1A1A" strokeWidth={8} />
                  <Rect x={22} y={112} width={26} height={26} fill="#1A1A1A" />
                  {/* Data blocks */}
                  <Rect x={70} y={20} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={80} y={20} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={70} y={30} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={70} y={70} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={80} y={70} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={90} y={70} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={100} y={70} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={110} y={70} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={120} y={90} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={130} y={90} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={70} y={100} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={80} y={100} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={90} y={100} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={100} y={110} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={110} y={110} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={120} y={110} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={70} y={120} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={80} y={130} width={8} height={8} fill="#1A1A1A" />
                  <Rect x={90} y={130} width={8} height={8} fill="#1A1A1A" />
                </Svg>
              </View>
            </View>

            {/* Timer */}
            {timeLeft > 0 && (
              <View style={styles.timerBox}>
                <Ionicons name="time-outline" size={20} color={Colors.amber600} />
                <Text style={styles.timerText}>Expires in {formatTime(timeLeft)}</Text>
              </View>
            )}
          </View>

          {/* Instruction */}
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>
              Present this screen to the cashier before payment to claim your discount
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Done Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.push('/(tabs)/rewards')}
          activeOpacity={0.9}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, gap: 20 },
  inner: { alignItems: 'center', gap: 20 },

  // Icon
  iconWrap: { marginTop: 16 },
  iconCircle: {
    width: 96,
    height: 96,
    backgroundColor: ECO_GREEN,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },

  // Title
  titleSection: { alignItems: 'center', gap: 4 },
  title: { color: '#1A1A1A', fontSize: 28, fontWeight: '700' },
  businessName: { color: Colors.gray600, fontSize: 16 },
  offerHeadline: { color: Colors.gray500, fontSize: 14 },

  // Redemption card
  redemptionCard: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    gap: 16,
    ...Shadow.lg,
  },
  showLabel: { color: Colors.gray600, fontSize: 14, fontWeight: '500' },

  codeBox: {
    backgroundColor: Colors.emerald50,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: ECO_GREEN,
  },
  codeText: { color: '#1A1A1A', fontSize: 32, fontWeight: '700', letterSpacing: 4, fontFamily: undefined },

  qrWrap: { alignItems: 'center' },
  qrBox: {
    width: 192,
    height: 192,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: ECO_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.amber100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.amber600,
    width: '100%',
    justifyContent: 'center',
  },
  timerText: { color: Colors.amber700, fontSize: 14, fontWeight: '600' },

  // Instruction
  instructionBox: {
    backgroundColor: Colors.emerald50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.emerald100,
    width: '100%',
  },
  instructionText: { color: Colors.emerald800, fontSize: 14, lineHeight: 20, textAlign: 'center' },

  // Footer
  footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: CREAM },
  doneBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.md,
  },
  doneBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
