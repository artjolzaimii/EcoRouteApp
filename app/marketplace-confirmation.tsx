import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Pressable,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow, BorderRadius, FontSize } from '@/constants/theme';

const SHARE_PLATFORMS = [
  { name: 'Facebook', emoji: '📘' },
  { name: 'Twitter', emoji: '🐦' },
  { name: 'Instagram', emoji: '📷' },
  { name: 'WhatsApp', emoji: '💬' },
];

export default function MarketplaceConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const { pointsUsed, moneySimulated, remaining, name, image } = useLocalSearchParams<{
    pointsUsed: string;
    moneySimulated: string;
    remaining: string;
    name: string;
    image: string;
  }>();
  const [showShareModal, setShowShareModal] = useState(false);

  const redeemedPoints  = Number(pointsUsed   ?? 0);
  const moneyCharged    = Number(moneySimulated ?? 0);
  const remainingPoints = Number(remaining      ?? 0);
  const productName     = name  ?? 'Your reward';
  const productImage    = image ?? '🎁';

  const handleShare = async (platform: string) => {
    setShowShareModal(false);
    try {
      await Share.share({
        message: `I just redeemed "${productName}" on EcoRoute using my Green Points! 🌱♻️`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 32, paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Success Icon ── */}
        <View style={styles.iconSection}>
          <View style={styles.iconHalo} />
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.emerald600} />
          </View>
          <View style={styles.sparkleCorner}>
            <Ionicons name="sparkles" size={28} color="#EAB308" />
          </View>
        </View>

        {/* ── Heading ── */}
        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subtitle}>
          Your points have been successfully redeemed. Your reward details have been sent to your
          email.
        </Text>

        {/* ── Order Summary Card ── */}
        <View style={styles.redeemedCard}>
          <Text style={styles.redeemedProductName}>{productImage} {productName}</Text>

          {redeemedPoints > 0 && (
            <View style={styles.remainingRow}>
              <Text style={styles.remainingLabel}>Points deducted</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="sparkles-outline" size={16} color={Colors.emerald600} />
                <Text style={[styles.remainingVal, { color: Colors.emerald600 }]}>
                  {redeemedPoints.toLocaleString()} pts
                </Text>
              </View>
            </View>
          )}

          {moneyCharged > 0 && (
            <View style={styles.remainingRow}>
              <Text style={styles.remainingLabel}>Simulated payment</Text>
              <Text style={styles.remainingVal}>€{moneyCharged.toFixed(2)}</Text>
            </View>
          )}

          {moneyCharged === 0 && redeemedPoints > 0 && (
            <View style={styles.remainingRow}>
              <Text style={styles.remainingLabel}>Money charged</Text>
              <Text style={[styles.remainingVal, { color: Colors.emerald600 }]}>€0.00 🎉</Text>
            </View>
          )}

          <View style={styles.redeemedDivider} />
          <View style={styles.remainingRow}>
            <Text style={styles.remainingLabel}>Points remaining</Text>
            <Text style={styles.remainingVal}>{remainingPoints.toLocaleString()} pts</Text>
          </View>
        </View>

        {/* ── What's Next ── */}
        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>What's Next?</Text>
          {[
            'Check your email for redemption details',
            'Track your order in the Profile section',
            'Earn more points by taking eco-friendly trips',
          ].map((item, i) => (
            <View key={i} style={styles.nextItem}>
              <View style={styles.nextCheck}>
                <Ionicons name="checkmark" size={12} color={Colors.blue600} />
              </View>
              <Text style={styles.nextItemText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* ── Actions ── */}
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => setShowShareModal(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.purple600, Colors.pink600]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareBtnGradient}
          >
            <Ionicons name="share-social-outline" size={20} color={Colors.white} />
            <Text style={styles.shareBtnText}>Share Your Achievement</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => router.replace('/(tabs)/marketplace')}
          activeOpacity={0.85}
        >
          <Ionicons name="bag-handle-outline" size={20} color={Colors.white} />
          <Text style={styles.shopBtnText}>Continue Shopping</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
        >
          <Ionicons name="home-outline" size={20} color={Colors.gray700} />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Thank you for choosing eco-friendly rewards! 🌱</Text>
      </ScrollView>

      {/* ── Share Modal ── */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowShareModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Share Your Achievement</Text>
            <Text style={styles.modalSub}>Let others know about your eco-friendly choice!</Text>
            <View style={styles.sharePlatforms}>
              {SHARE_PLATFORMS.map((platform) => (
                <TouchableOpacity
                  key={platform.name}
                  style={styles.platformBtn}
                  onPress={() => handleShare(platform.name)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.emerald100, Colors.emerald200]}
                    style={styles.platformIcon}
                  >
                    <Text style={styles.platformEmoji}>{platform.emoji}</Text>
                  </LinearGradient>
                  <Text style={styles.platformLabel}>{platform.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowShareModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 20,
  },

  // ── Icon ──
  iconSection: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconHalo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.emerald100,
    opacity: 0.5,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.xl,
  },
  sparkleCorner: {
    position: 'absolute',
    top: -4,
    right: -12,
  },

  // ── Heading ──
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: '700',
    color: Colors.gray900,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },

  // ── Redeemed Card ──
  redeemedCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    ...Shadow.xl,
  },
  redeemedLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  redeemedAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redeemedAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.emerald600,
  },
  redeemedProductName: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: -4,
  },
  redeemedDivider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.gray200,
    marginVertical: 4,
  },
  remainingRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },
  remainingVal: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.gray900,
  },

  // ── What's Next ──
  nextCard: {
    width: '100%',
    backgroundColor: Colors.blue100,
    borderRadius: BorderRadius.xl,
    padding: 20,
    gap: 12,
  },
  nextTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  nextItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  nextCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(37,99,235,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  nextItemText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.blue600,
    lineHeight: 19,
  },

  // ── Buttons ──
  shareBtn: {
    width: '100%',
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadow.lg,
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  shareBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  shopBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.emerald600,
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    ...Shadow.lg,
  },
  shopBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  homeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  homeBtnText: {
    color: Colors.gray700,
    fontSize: FontSize.base,
    fontWeight: '600',
  },

  footer: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textAlign: 'center',
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 14,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.gray900,
  },
  modalSub: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    marginTop: -4,
  },
  sharePlatforms: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  platformBtn: {
    alignItems: 'center',
    gap: 8,
  },
  platformIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformEmoji: {
    fontSize: 26,
  },
  platformLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
    fontWeight: '500',
  },
  modalCancelBtn: {
    paddingVertical: 14,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.gray700,
  },
});
