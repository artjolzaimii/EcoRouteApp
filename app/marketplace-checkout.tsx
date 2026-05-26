import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow, BorderRadius, FontSize } from '@/constants/theme';
import { api } from '@/lib/api';

interface ApiListing {
  id: string;
  title: string;
  description: string | null;
  pointsPrice: number | null;
  moneyPrice: number | null;
  payment: string;       // 'MONEY_ONLY' | 'FLEXIBLE'
  location: string | null;
  category: { glyph: string };
  images: { url: string; isCover: boolean; sortOrder: number }[];
}

export default function MarketplaceCheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [userPoints,     setUserPoints]     = useState(0);
  const [loadingPoints,  setLoadingPoints]  = useState(true);
  const [listing,        setListing]        = useState<ApiListing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [agreed,         setAgreed]         = useState(true);

  // Points-slider state (only used for FLEXIBLE)
  const [pointsToUse, setPointsToUse] = useState(0);

  // Simulated-payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [confirming,   setConfirming]   = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingPoints(true);
      try {
        const stats = await api.get<{ totalPoints: number }>('/api/user/stats');
        setUserPoints(stats.totalPoints ?? 0);
      } catch { /* keep 0 */ } finally {
        setLoadingPoints(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get<ApiListing>(`/api/marketplace/listings/${id}`)
      .then((l) => {
        setListing(l);
        // Pre-fill slider to maximum affordable points
        if (l.payment === 'FLEXIBLE' && l.pointsPrice) {
          setPointsToUse(0);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingListing(false));
  }, [id]);

  // ── Derived values ────────────────────────────────────────────────────────

  const isFlexible   = listing?.payment === 'FLEXIBLE';
  const moneyPrice   = Number(listing?.moneyPrice  ?? 0);
  const fullPtsCost  = Number(listing?.pointsPrice ?? 0);

  // Max points user can actually use
  const maxSlider = isFlexible ? Math.min(userPoints, fullPtsCost) : 0;

  // Remaining € after using selected points
  const remainingMoney = isFlexible && fullPtsCost > 0
    ? Math.max(Math.round(moneyPrice * (1 - pointsToUse / fullPtsCost) * 100) / 100, 0)
    : moneyPrice;

  const pointsAfterPurchase = userPoints - pointsToUse;

  // Show pay-modal only when money > 0; otherwise confirm directly
  const needsMoneyModal = remainingMoney > 0;

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleProceed = () => {
    if (!agreed || !listing) return;
    if (needsMoneyModal) {
      setShowPayModal(true);
    } else {
      // Fully covered by points — confirm directly
      submitOrder();
    }
  };

  const submitOrder = async () => {
    if (!listing) return;
    setShowPayModal(false);
    setConfirming(true);
    try {
      const result = await api.post<{
        pointsUsed: number;
        moneyPaidSimulated: number;
      }>(`/api/marketplace/listings/${id}/checkout`, {
        pointsToUse: isFlexible ? pointsToUse : 0,
      });

      router.push({
        pathname: '/marketplace-confirmation',
        params: {
          pointsUsed:    String(result.pointsUsed ?? pointsToUse),
          moneySimulated: String(result.moneyPaidSimulated ?? remainingMoney),
          remaining:     String(Math.max(pointsAfterPurchase, 0)),
          name:          listing.title,
          image:         listing.category?.glyph ?? '📦',
        },
      });
    } catch (err: any) {
      alert(err?.message ?? 'Failed to complete purchase. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  // ── Loading / not-found guards ────────────────────────────────────────────

  if (loadingListing) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.emerald600} size="large" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ color: Colors.gray500 }}>Product not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.emerald600, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back-outline" size={22} color={Colors.gray700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 220 + insets.bottom, gap: 16 }}
      >

        {/* ── Order Summary ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.orderProduct}>
            {(() => {
              const coverUrl = listing.images
                ?.slice()
                .sort((a, b) => (a.isCover ? -1 : 1) - (b.isCover ? -1 : 1))[0]?.url ?? null;
              return coverUrl ? (
                <Image
                  source={{ uri: coverUrl }}
                  style={styles.orderProductImage}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient colors={[Colors.emerald50, Colors.emerald100]} style={styles.orderProductImage}>
                  <Text style={styles.orderProductEmoji}>{listing.category?.glyph ?? '📦'}</Text>
                </LinearGradient>
              );
            })()}
            <View style={styles.orderProductInfo}>
              <Text style={styles.orderProductName}>{listing.title}</Text>
              <Text style={styles.orderProductDesc} numberOfLines={2}>{listing.description ?? ''}</Text>
              <Text style={styles.orderShipping}>
                {listing.location ? `Pickup at ${listing.location}` : 'Contact partner for details'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {isFlexible ? (
            <View style={styles.orderMetaRow}>
              <Text style={styles.orderMetaLabel}>Full cost</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={styles.orderMetaVal}>{fullPtsCost.toLocaleString()} pts</Text>
                <Text style={[styles.orderMetaLabel, { color: Colors.gray400 }]}>or</Text>
                <Text style={styles.orderMetaVal}>€{moneyPrice.toFixed(2)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.orderMetaRow}>
              <Text style={styles.orderMetaLabel}>Price</Text>
              <Text style={styles.orderMetaVal}>€{moneyPrice.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* ── Points Selector (FLEXIBLE only) ── */}
        {isFlexible && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Use Your Points</Text>

            <View style={styles.orderMetaRow}>
              <Text style={styles.orderMetaLabel}>Your balance</Text>
              {loadingPoints ? (
                <ActivityIndicator size="small" color={Colors.gray700} />
              ) : (
                <Text style={styles.orderMetaVal}>{userPoints.toLocaleString()} pts</Text>
              )}
            </View>

            {maxSlider > 0 ? (
              <>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>Points to use</Text>
                  <Text style={styles.sliderValue}>{pointsToUse.toLocaleString()} pts</Text>
                </View>

                {/* Step-based percentage selector */}
                <View style={styles.stepRow}>
                  {([0, 25, 50, 75, 100] as const).map((pct) => {
                    const v = Math.round(maxSlider * pct / 100);
                    const active = pointsToUse === v;
                    return (
                      <TouchableOpacity
                        key={pct}
                        style={[styles.stepBtn, active && styles.stepBtnActive]}
                        onPress={() => setPointsToUse(v)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.stepBtnText, active && styles.stepBtnTextActive]}>
                          {pct === 100 ? 'Max' : `${pct}%`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.divider} />

                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>Points deducted</Text>
                  <Text style={{ color: Colors.red600, fontWeight: '600', fontSize: FontSize.sm }}>
                    -{pointsToUse.toLocaleString()} pts
                  </Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>Remaining payment</Text>
                  <Text style={[styles.orderMetaVal, { color: remainingMoney === 0 ? Colors.emerald600 : Colors.gray900 }]}>
                    {remainingMoney === 0 ? 'FREE 🎉' : `€${remainingMoney.toFixed(2)}`}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.noticeCard}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.blue600} />
                <Text style={styles.noticeText}>
                  You have no points to use. You'll pay the full amount of €{moneyPrice.toFixed(2)}.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Cost Breakdown ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cost Breakdown</Text>

          {isFlexible && pointsToUse > 0 && (
            <View style={styles.orderMetaRow}>
              <Text style={styles.orderMetaLabel}>Points ({pointsToUse.toLocaleString()} pts)</Text>
              <Text style={{ color: Colors.emerald600, fontWeight: '600', fontSize: FontSize.sm }}>
                -{((pointsToUse / fullPtsCost) * 100).toFixed(0)}% discount
              </Text>
            </View>
          )}

          <View style={styles.orderMetaRow}>
            <Text style={styles.balanceTotalLabel}>
              {isFlexible && remainingMoney === 0 ? 'Total (fully covered)' : 'Simulated payment'}
            </Text>
            <Text style={styles.balanceTotalVal}>
              {remainingMoney === 0 ? '€0.00' : `€${remainingMoney.toFixed(2)}`}
            </Text>
          </View>

          {isFlexible && (
            <View style={styles.orderMetaRow}>
              <Text style={styles.orderMetaLabel}>Points after purchase</Text>
              <Text style={styles.orderMetaVal}>{Math.max(pointsAfterPurchase, 0).toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* ── Notice ── */}
        <View style={[styles.noticeCard, { backgroundColor: Colors.blue100, gap: 10 }]}>
          <Ionicons name="alert-circle-outline" size={20} color={Colors.blue600} style={{ marginTop: 1 }} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.noticeText, { fontWeight: '600', color: '#1e3a8a' }]}>MVP Demo Mode</Text>
            <Text style={styles.noticeText}>
              {remainingMoney > 0
                ? 'A simulated payment will be shown. No real money will be charged.'
                : 'This order will be fully covered by your Green Points.'}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[styles.bottomCTA, { paddingBottom: Math.max(insets.bottom, 16) }]}>

        {/* Terms lives here so it can never overlap the scroll content */}
        <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
          <Ionicons
            name={agreed ? 'checkbox' : 'square-outline'}
            size={22}
            color={agreed ? Colors.emerald600 : Colors.gray400}
          />
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsLink}>terms and conditions</Text>
            {' '}and confirm all order details are correct.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmBtn, (!agreed || confirming) && styles.confirmBtnDisabled]}
          onPress={agreed && !confirming ? handleProceed : undefined}
          activeOpacity={agreed ? 0.8 : 1}
        >
          {confirming ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Ionicons
                name={needsMoneyModal ? 'card-outline' : 'checkmark'}
                size={20}
                color={agreed ? Colors.white : Colors.gray400}
              />
              <Text style={[styles.confirmBtnText, !agreed && styles.confirmBtnTextDisabled]}>
                {needsMoneyModal ? `Pay €${remainingMoney.toFixed(2)}` : 'Confirm with Points'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>

      {/* ── Simulated Payment Modal ── */}
      <Modal
        visible={showPayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPayModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPayModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />

            <View style={styles.modalIconRow}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="card-outline" size={36} color={Colors.emerald600} />
              </View>
            </View>

            <Text style={styles.modalTitle}>Demo Payment</Text>
            <Text style={styles.modalSub}>
              This is a simulated transaction for MVP testing.{'\n'}
              <Text style={{ fontWeight: '700', color: Colors.gray900 }}>No real money will be charged.</Text>
            </Text>

            <View style={styles.modalAmountCard}>
              {isFlexible && pointsToUse > 0 && (
                <View style={styles.modalAmountRow}>
                  <Text style={styles.modalAmountLabel}>Points deducted</Text>
                  <Text style={[styles.modalAmountVal, { color: Colors.emerald600 }]}>
                    {pointsToUse.toLocaleString()} pts
                  </Text>
                </View>
              )}
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalAmountLabel}>Simulated charge</Text>
                <Text style={styles.modalAmountVal}>€{remainingMoney.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={submitOrder}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.emerald600, Colors.emerald700]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalConfirmGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.modalConfirmText}>Confirm Demo Payment</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowPayModal(false)}
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
    backgroundColor: Colors.gray50,
  },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.gray900,
  },

  scroll: { flex: 1 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 20,
    gap: 14,
    ...Shadow.lg,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.gray900,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray100,
  },

  orderProduct: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  orderProductImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  orderProductEmoji: { fontSize: 34 },
  orderProductInfo:  { flex: 1, gap: 3 },
  orderProductName: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.gray900,
    lineHeight: 20,
  },
  orderProductDesc: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    lineHeight: 17,
  },
  orderShipping: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMetaLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },
  orderMetaVal: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.gray900,
  },
  balanceTotalLabel: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.gray900,
  },
  balanceTotalVal: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.emerald600,
  },

  // Points step selector
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    fontWeight: '600',
  },
  sliderValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.emerald700,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  stepBtnActive: {
    backgroundColor: Colors.emerald600,
    borderColor: Colors.emerald600,
  },
  stepBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.gray600,
  },
  stepBtnTextActive: {
    color: Colors.white,
  },

  // Notice
  noticeCard: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeText: {
    fontSize: FontSize.sm,
    color: Colors.blue600,
    lineHeight: 19,
    flex: 1,
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  termsText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.emerald600,
    fontWeight: '600',
  },

  // Bottom CTA
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.emerald600,
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    ...Shadow.lg,
  },
  confirmBtnDisabled: {
    backgroundColor: Colors.gray200,
    elevation: 0,
    shadowOpacity: 0,
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  confirmBtnTextDisabled: {
    color: Colors.gray400,
  },
  goBackBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  goBackText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.gray600,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalIconRow: {
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: Colors.gray900,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: FontSize.base,
    color: Colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: -6,
  },
  modalAmountCard: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  modalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalAmountLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },
  modalAmountVal: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.gray900,
  },
  modalConfirmBtn: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadow.lg,
  },
  modalConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  modalConfirmText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  modalCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.xl,
  },
  modalCancelText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.gray700,
  },
});
