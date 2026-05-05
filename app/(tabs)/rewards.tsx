import { Colors, Shadow } from '@/constants/theme';
import { usePreferences } from '@/context/PreferencesContext';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Coupon = {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountValue: number;
  discountType: string;
  expiresAt: string | null;
  partner: { id: string; name: string; logoUrl: string | null };
};

type UserCoupon = {
  id: string;
  code: string;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  coupon: Coupon;
};

type CouponsData = {
  available: Coupon[];
  mine: UserCoupon[];
};

type UserStats = {
  totalPoints: number;
};

function formatDiscount(coupon: Coupon): string {
  if (coupon.discountType === 'PERCENT') return `${coupon.discountValue}% Off`;
  if (coupon.discountType === 'FIXED') return `$${coupon.discountValue} Off`;
  if (coupon.discountType === 'FREE_ITEM') return 'Free Item';
  return coupon.description?.split('.')[0] ?? 'Discount';
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'No expiry';
  const d = new Date(expiresAt);
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diffDays <= 0) return 'Expired';
  if (diffDays === 1) return 'Expires tomorrow';
  if (diffDays <= 30) return `Valid for ${diffDays} days`;
  return `Valid until ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

const ICON_COLORS: { bg: string; icon: string }[] = [
  { bg: Colors.amber100, icon: Colors.amber600 },
  { bg: Colors.green100, icon: Colors.green600 },
  { bg: Colors.blue100, icon: Colors.blue600 },
  { bg: Colors.purple100, icon: Colors.purple600 },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { formatDistance, prefs, theme } = usePreferences();
  const [activeTab, setActiveTab] = useState<'available' | 'redeemed'>('available');
  const [coupons, setCoupons] = useState<CouponsData>({ available: [], mine: [] });
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [couponsData, statsData] = await Promise.all([
        api.get<CouponsData>('/api/coupons'),
        api.get<UserStats>('/api/user/stats'),
      ]);
      setCoupons(couponsData);
      setUserPoints(statsData.totalPoints ?? 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Reload on focus so points balance stays fresh after a trip or redemption
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleRedeem = async (coupon: Coupon) => {
    Alert.alert(
      'Redeem Coupon',
      `Spend ${coupon.pointsCost} points for "${coupon.title}" from ${coupon.partner.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'default',
          onPress: async () => {
            setRedeeming(coupon.id);
            try {
              await api.post('/api/coupons/redeem', { couponId: coupon.id });
              await loadData(); // refresh data
              Alert.alert('Redeemed!', `Your coupon for ${coupon.partner.name} is ready in "My Rewards".`);
            } catch (err: any) {
              Alert.alert('Redemption failed', err.message ?? 'Could not redeem coupon.');
            } finally {
              setRedeeming(null);
            }
          },
        },
      ],
    );
  };

  // Hardcoded challenges (could be backed by API later)
  const challenges = [
    { title: 'Weekend Warrior', description: 'Complete 5 eco-trips this weekend', reward: '+200 points', progress: 0, total: 5, unit: 'trips' },
    { title: 'Bike Champion', description: `Bike ${formatDistance(50)} this month`, reward: '+500 points', progress: 0, total: 50, unit: 'km' },
  ];

  const nextRewardThreshold = coupons.available.length > 0
    ? Math.min(...coupons.available.map((c) => c.pointsCost))
    : 500;

  const progressPct = Math.min((userPoints / nextRewardThreshold) * 100, 100);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.purple600, Colors.pink600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.headerRow}>
          <Ionicons name="gift-outline" size={24} color={Colors.white} />
          <Text style={styles.headerTitle}>Rewards</Text>
        </View>
        <Text style={styles.headerSub}>Redeem points for exclusive perks</Text>

        <View style={styles.pointsCard}>
          <View style={styles.pointsCardTop}>
            <View>
              <Text style={styles.pointsCardLabel}>Your Points</Text>
              <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
            </View>
            <View style={styles.sparkleBox}>
              <Ionicons name="sparkles-outline" size={28} color={Colors.white} />
            </View>
          </View>
          <View style={styles.pointsProgressWrap}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabelText}>Next reward</Text>
              <Text style={styles.progressLabelVal}>
                {Math.max(nextRewardThreshold - userPoints, 0).toLocaleString()} points away
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Active Challenges */}
      <View style={styles.challengeWrap}>
        <View style={[styles.card, styles.challengeCard, { backgroundColor: theme.card }]}>
          <View style={styles.challengeHeader}>
            <Text style={[styles.challengeTitle, { color: theme.text }]}>Active Challenges</Text>
            <Ionicons name="star" size={18} color={theme.yellow500} />
          </View>
          <View style={styles.challengeList}>
            {challenges.map((c) => {
              const pct = (c.progress / c.total) * 100;
              return (
                <View key={c.title} style={[styles.challengeItem, { borderLeftColor: theme.primary }]}>
                  <View style={styles.challengeItemTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.challengeName, { color: theme.text }]}>{c.title}</Text>
                      <Text style={[styles.challengeDesc, { color: theme.textSecondary }]}>{c.description}</Text>
                    </View>
                    <Text style={[styles.challengeReward, { color: theme.primary }]}>{c.reward}</Text>
                  </View>
                  <View style={styles.challengeBarRow}>
                    <View style={styles.challengeTrack}>
                      <LinearGradient
                        colors={[Colors.purple500, Colors.pink600]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.challengeFill, { width: `${pct}%` as any }]}
                      />
                    </View>
                    <Text style={styles.challengeProgress}>
                      {c.unit === 'km' ? formatDistance(c.progress) : c.progress} / {c.unit === 'km' ? formatDistance(c.total) : c.total}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <View style={[styles.tabBar, { backgroundColor: theme.card }]}>
          {(['available', 'redeemed'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && { backgroundColor: theme.primary }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === tab ? Colors.white : theme.textSecondary }]}>
                {tab === 'available' ? 'Available' : 'My Rewards'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator color={Colors.purple600} style={{ marginTop: 40 }} />
      ) : activeTab === 'available' ? (
        <View style={styles.rewardList}>
          {coupons.available.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyStateText}>No coupons available right now</Text>
            </View>
          ) : (
            coupons.available.map((coupon, idx) => {
              const canAfford = userPoints >= coupon.pointsCost;
              const c = ICON_COLORS[idx % ICON_COLORS.length];
              const isRedeemingThis = redeeming === coupon.id;
              return (
                <View key={coupon.id} style={[styles.rewardCard, { backgroundColor: theme.card }, !canAfford && styles.rewardCardDim]}>
                  <View style={styles.rewardCardInner}>
                    <View style={[styles.rewardIconBox, { backgroundColor: c.bg }]}>
                      <Ionicons name="gift-outline" size={28} color={c.icon} />
                    </View>
                    <View style={styles.rewardInfo}>
                      <View style={styles.rewardInfoTop}>
                        <View>
                          <Text style={[styles.rewardName, { color: theme.text }]}>{coupon.title}</Text>
                          <Text style={[styles.rewardPartner, { color: theme.textSecondary }]}>{coupon.partner.name}</Text>
                        </View>
                      </View>

                      <View style={styles.rewardMeta}>
                        <Text style={[styles.discountText, { color: theme.primary }]}>{formatDiscount(coupon)}</Text>
                        <View style={styles.expiryRow}>
                          <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                          <Text style={[styles.expiryText, { color: theme.textSecondary }]}>{formatExpiry(coupon.expiresAt)}</Text>
                        </View>
                      </View>

                      <View style={styles.rewardBottom}>
                        <View style={styles.rewardPointsRow}>
                          <Ionicons name="sparkles-outline" size={14} color={theme.primary} />
                          <Text style={[styles.rewardPointsText, { color: theme.text }]}>{coupon.pointsCost} points</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.redeemBtn, { backgroundColor: theme.primary }, (!canAfford || isRedeemingThis) && { backgroundColor: theme.gray200 }]}
                          disabled={!canAfford || isRedeemingThis}
                          activeOpacity={0.85}
                          onPress={() => handleRedeem(coupon)}
                        >
                          {isRedeemingThis ? (
                            <ActivityIndicator color={Colors.white} size="small" />
                          ) : (
                            <Text style={[styles.redeemBtnText, !canAfford && styles.redeemBtnTextLocked]}>
                              {canAfford ? 'Redeem' : 'Locked'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <LinearGradient colors={[Colors.purple600, Colors.pink600]} style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Want more rewards?</Text>
            <Text style={styles.ctaSub}>Complete challenges and eco-trips to earn more points faster.</Text>
            <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.9}>
              <Text style={styles.ctaBtnText}>View Challenges</Text>
              <Ionicons name="chevron-forward-outline" size={14} color={Colors.purple600} />
            </TouchableOpacity>
          </LinearGradient>

          <View style={{ height: 24 }} />
        </View>
      ) : (
        <View style={styles.rewardList}>
          {coupons.mine.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyStateText}>No redeemed coupons yet</Text>
            </View>
          ) : (
            coupons.mine.map((uc) => {
              const isUsed = !!uc.usedAt;
              return (
                <View key={uc.id} style={[styles.redeemedCard, { backgroundColor: theme.card }]}>
                  <View style={styles.redeemedTop}>
                    <View>
                      <Text style={[styles.rewardName, { color: theme.text }]}>{uc.coupon.title}</Text>
                      <Text style={[styles.rewardPartner, { color: theme.textSecondary }]}>{uc.coupon.partner.name}</Text>
                    </View>
                    <View style={[styles.statusBadge, isUsed ? styles.statusUsed : { backgroundColor: theme.emerald100 }]}>
                      <Text style={[styles.statusText, isUsed ? styles.statusTextUsed : { color: theme.emerald600 }]}>
                        {isUsed ? 'Used' : 'Active'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.codeBox, { backgroundColor: theme.gray50 }]}>
                    <Text style={[styles.codeBoxLabel, { color: theme.textSecondary }]}>Redemption Code</Text>
                    <Text style={[styles.codeText, { color: theme.text }]}>{uc.code}</Text>
                  </View>

                  <View style={styles.redeemedBottom}>
                    <Text style={[styles.redeemedDate, { color: theme.textSecondary }]}>
                      Redeemed: {new Date(uc.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                    {!isUsed && (
                      <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/coupon-redeemed')}>
                        <Text style={[styles.useNowText, { color: theme.primary }]}>Use Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 24 }} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { paddingHorizontal: 24, paddingBottom: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  headerSub: { color: 'rgba(243,232,255,1)', fontSize: 13 },
  pointsCard: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pointsCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pointsCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  pointsValue: { color: Colors.white, fontSize: 36, fontWeight: '700' },
  sparkleBox: { width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pointsProgressWrap: { gap: 8 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabelText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  progressLabelVal: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 4 },
  challengeWrap: { paddingHorizontal: 24, marginTop: -24 },
  card: { backgroundColor: Colors.white, borderRadius: 16, ...Shadow.xl },
  challengeCard: { padding: 20, marginBottom: 16 },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  challengeTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 15 },
  challengeList: { gap: 16 },
  challengeItem: { borderLeftWidth: 4, borderLeftColor: Colors.purple500, paddingLeft: 16 },
  challengeItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  challengeName: { color: Colors.gray900, fontWeight: '600', fontSize: 13, marginBottom: 2 },
  challengeDesc: { color: Colors.gray500, fontSize: 11 },
  challengeReward: { color: Colors.purple600, fontSize: 11, fontWeight: '700', marginLeft: 8 },
  challengeBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  challengeTrack: { flex: 1, height: 6, backgroundColor: Colors.gray100, borderRadius: 3, overflow: 'hidden' },
  challengeFill: { height: '100%', borderRadius: 3 },
  challengeProgress: { color: Colors.gray600, fontSize: 11, fontWeight: '500' },
  tabSelector: { paddingHorizontal: 24, marginBottom: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 12, padding: 4, ...Shadow.sm },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.purple600, ...Shadow.md },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: Colors.gray600 },
  tabBtnTextActive: { color: Colors.white },
  rewardList: { paddingHorizontal: 24, gap: 16 },
  rewardCard: { backgroundColor: Colors.white, borderRadius: 16, ...Shadow.lg, overflow: 'hidden' },
  rewardCardDim: { opacity: 0.6 },
  rewardCardInner: { flexDirection: 'row', padding: 20, gap: 16 },
  rewardIconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rewardInfo: { flex: 1 },
  rewardInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rewardName: { color: Colors.gray900, fontWeight: '700', fontSize: 15, marginBottom: 2 },
  rewardPartner: { color: Colors.gray600, fontSize: 13 },
  rewardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  discountText: { color: Colors.purple600, fontWeight: '700', fontSize: 17 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiryText: { color: Colors.gray400, fontSize: 12 },
  rewardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardPointsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rewardPointsText: { color: Colors.gray900, fontWeight: '600', fontSize: 14 },
  redeemBtn: { backgroundColor: Colors.purple600, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, minWidth: 72, alignItems: 'center' },
  redeemBtnLocked: { backgroundColor: Colors.gray200 },
  redeemBtnText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  redeemBtnTextLocked: { color: Colors.gray400 },
  ctaCard: { borderRadius: 16, padding: 24, marginTop: 8 },
  ctaTitle: { color: Colors.white, fontWeight: '700', fontSize: 17, marginBottom: 8 },
  ctaSub: { color: 'rgba(243,232,255,1)', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ctaBtnText: { color: Colors.purple600, fontWeight: '600', fontSize: 13 },
  redeemedCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, ...Shadow.lg },
  redeemedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  statusActive: { backgroundColor: Colors.green100 },
  statusUsed: { backgroundColor: Colors.gray100 },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextActive: { color: Colors.green600 },
  statusTextUsed: { color: Colors.gray600 },
  codeBox: { backgroundColor: Colors.gray50, borderRadius: 12, padding: 12, marginBottom: 12 },
  codeBoxLabel: { color: Colors.gray500, fontSize: 11, marginBottom: 4 },
  codeText: { color: Colors.gray900, fontFamily: 'monospace', fontWeight: '700', fontSize: 18, letterSpacing: 2 },
  redeemedBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  redeemedDate: { color: Colors.gray500, fontSize: 13 },
  useNowText: { color: Colors.purple600, fontWeight: '600', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyStateText: { color: Colors.gray500, fontSize: 15 },
});
