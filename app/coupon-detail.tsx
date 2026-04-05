import React, { useRef, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;
const DARK_GREEN = '#1A5C38';

const coupon = {
  businessName: 'Green Coffee Co.',
  category: 'Coffee & Café',
  logo: '☕',
  offerHeadline: '10% off any purchase',
  description:
    'Enjoy a discount on organic fair-trade coffee, pastries, and light meals. We use 100% renewable energy and compostable packaging.',
  pointsRequired: 0,
  freeWithEcoRoute: true,
  validUntil: 'March 31, 2026',
  howToRedeem: 'Show this screen at checkout before payment',
  terms:
    'Valid for in-store purchases only. Cannot be combined with other offers. One use per customer per day.',
};

export default function CouponDetailScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Business Info */}
          <View style={styles.card}>
            <View style={styles.businessRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoEmoji}>{coupon.logo}</Text>
              </View>
              <View style={styles.businessInfo}>
                <View style={styles.ecoPartnerBadge}>
                  <Text style={styles.ecoPartnerText}>Eco-Partner</Text>
                </View>
                <Text style={styles.businessName}>{coupon.businessName}</Text>
                <Text style={styles.businessCategory}>{coupon.category}</Text>
              </View>
            </View>
          </View>

          {/* Offer Headline */}
          <LinearGradient colors={[ECO_GREEN, DARK_GREEN]} style={styles.offerCard}>
            <View style={styles.offerHeaderRow}>
              <View style={styles.giftIconBox}>
                <Ionicons name="gift-outline" size={24} color={Colors.white} />
              </View>
              <Text style={styles.offerHeadline}>{coupon.offerHeadline}</Text>
            </View>
            <Text style={styles.offerDesc}>{coupon.description}</Text>
          </LinearGradient>

          {/* Points */}
          <View style={styles.card}>
            <View style={styles.pointsRow}>
              <View style={styles.pointsIconBox}>
                <Ionicons name="flash-outline" size={24} color={ECO_GREEN} />
              </View>
              <View>
                {coupon.freeWithEcoRoute ? (
                  <>
                    <Text style={styles.pointsTitle}>Free with eco route</Text>
                    <Text style={styles.pointsSubtitle}>No points required</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.pointsTitle}>{coupon.pointsRequired} Points</Text>
                    <Text style={styles.pointsSubtitle}>Required to unlock</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Valid Until */}
          <View style={styles.card}>
            <View style={styles.validRow}>
              <Ionicons name="time-outline" size={20} color={Colors.gray600} />
              <View>
                <Text style={styles.validLabel}>Valid until</Text>
                <Text style={styles.validValue}>{coupon.validUntil}</Text>
              </View>
            </View>
          </View>

          {/* How to Redeem */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>How to redeem</Text>
            <View style={styles.redeemRow}>
              <Ionicons name="location-outline" size={20} color={ECO_GREEN} />
              <Text style={styles.redeemText}>{coupon.howToRedeem}</Text>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{coupon.terms}</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Redeem Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.redeemBtn}
          onPress={() => router.push('/coupon-redeemed')}
          activeOpacity={0.9}
        >
          <Text style={styles.redeemBtnText}>Redeem Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, gap: 16 },
  inner: { gap: 16 },

  // Card
  card: { backgroundColor: Colors.white, borderRadius: 28, padding: 20, ...Shadow.md },
  cardTitle: { color: '#1A1A1A', fontWeight: '700', fontSize: 17, marginBottom: 12 },

  // Business
  businessRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: Colors.emerald100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoEmoji: { fontSize: 36 },
  businessInfo: { flex: 1, gap: 4 },
  ecoPartnerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.emerald50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ecoPartnerText: { color: Colors.emerald600, fontSize: 12, fontWeight: '700' },
  businessName: { color: '#1A1A1A', fontSize: 22, fontWeight: '700' },
  businessCategory: { color: Colors.gray600, fontSize: 14 },

  // Offer card
  offerCard: { borderRadius: 28, padding: 24, gap: 12, ...Shadow.md },
  offerHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  giftIconBox: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  offerHeadline: { color: Colors.white, fontSize: 26, fontWeight: '700', flex: 1 },
  offerDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 22 },

  // Points
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pointsIconBox: { width: 48, height: 48, backgroundColor: Colors.emerald100, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pointsTitle: { color: '#1A1A1A', fontWeight: '700', fontSize: 17 },
  pointsSubtitle: { color: Colors.gray600, fontSize: 13, marginTop: 2 },

  // Valid
  validRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  validLabel: { color: Colors.gray600, fontSize: 13, marginBottom: 4 },
  validValue: { color: '#1A1A1A', fontWeight: '600', fontSize: 15 },

  // Redeem
  redeemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  redeemText: { flex: 1, color: Colors.gray700, fontSize: 15, lineHeight: 22 },

  // Terms
  termsBox: { backgroundColor: Colors.gray50, borderRadius: 16, padding: 16 },
  termsTitle: { color: Colors.gray700, fontWeight: '600', fontSize: 13, marginBottom: 8 },
  termsText: { color: Colors.gray600, fontSize: 12, lineHeight: 18 },

  // Footer
  footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: CREAM },
  redeemBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.md,
  },
  redeemBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
