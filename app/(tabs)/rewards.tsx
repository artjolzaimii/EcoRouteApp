import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

type RewardColor = 'amber' | 'green' | 'blue' | 'purple';

const colorMap: Record<RewardColor, { bg: string; icon: string }> = {
  amber:  { bg: Colors.amber100,  icon: Colors.amber600  },
  green:  { bg: Colors.green100,  icon: Colors.green600  },
  blue:   { bg: Colors.blue100,   icon: Colors.blue600   },
  purple: { bg: Colors.purple100, icon: Colors.purple600 },
};

const userPoints = 2840;
const nextReward = 3000;

const rewards = [
  { id: 1, name: 'Free Coffee',       partner: 'Starbucks',        points: 500,  color: 'amber'  as RewardColor, icon: 'cafe-outline'         as const, discount: '100% Off',      expiry: 'Valid for 30 days',   popular: true  },
  { id: 2, name: '$10 Off Purchase',  partner: 'REI',              points: 800,  color: 'green'  as RewardColor, icon: 'bag-outline'          as const, discount: '$10 Off',       expiry: 'Valid for 60 days',   popular: true  },
  { id: 3, name: 'Free Bike Tune-up', partner: 'Local Bike Shop',  points: 1200, color: 'blue'   as RewardColor, icon: 'bicycle-outline'      as const, discount: '$50 Value',     expiry: 'Valid for 90 days',   popular: false },
  { id: 4, name: 'Premium Upgrade',   partner: 'EcoRoute Plus',    points: 2000, color: 'purple' as RewardColor, icon: 'flash-outline'        as const, discount: '3 Months Free', expiry: 'Instant activation',  popular: true  },
];

const redeemedRewards = [
  { id: 101, name: 'Free Coffee',      partner: 'Starbucks',   redeemedDate: 'March 25, 2026', code: 'ECO-CF-9283', status: 'Active' },
  { id: 102, name: '$5 Off Purchase',  partner: 'Whole Foods', redeemedDate: 'March 20, 2026', code: 'ECO-WF-7421', status: 'Used'   },
];

const challenges = [
  { title: 'Weekend Warrior',  description: 'Complete 5 eco-trips this weekend', reward: '+200 points', progress: 3,  total: 5  },
  { title: 'Bike Champion',    description: 'Bike 50km this month',               reward: '+500 points', progress: 32, total: 50 },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'available' | 'redeemed'>('available');

  const progressPct = (userPoints / nextReward) * 100;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        {/* Points Card */}
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
              <Text style={styles.progressLabelVal}>{(nextReward - userPoints).toLocaleString()} points away</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Active Challenges */}
      <View style={styles.challengeWrap}>
        <View style={[styles.card, styles.challengeCard]}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeTitle}>Active Challenges</Text>
            <Ionicons name="star" size={18} color={Colors.yellow500} />
          </View>
          <View style={styles.challengeList}>
            {challenges.map((c) => {
              const pct = (c.progress / c.total) * 100;
              return (
                <View key={c.title} style={styles.challengeItem}>
                  <View style={styles.challengeItemTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.challengeName}>{c.title}</Text>
                      <Text style={styles.challengeDesc}>{c.description}</Text>
                    </View>
                    <Text style={styles.challengeReward}>{c.reward}</Text>
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
                    <Text style={styles.challengeProgress}>{c.progress}/{c.total}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <View style={styles.tabBar}>
          {(['available', 'redeemed'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'available' ? 'Available' : 'My Rewards'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {activeTab === 'available' ? (
        <View style={styles.rewardList}>
          {rewards.map((reward) => {
            const c = colorMap[reward.color];
            const canAfford = userPoints >= reward.points;
            return (
              <View key={reward.id} style={[styles.rewardCard, !canAfford && styles.rewardCardDim]}>
                <View style={styles.rewardCardInner}>
                  <View style={[styles.rewardIconBox, { backgroundColor: c.bg }]}>
                    <Ionicons name={reward.icon} size={28} color={c.icon} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <View style={styles.rewardInfoTop}>
                      <View>
                        <Text style={styles.rewardName}>{reward.name}</Text>
                        <Text style={styles.rewardPartner}>{reward.partner}</Text>
                      </View>
                      {reward.popular && (
                        <View style={styles.popularBadge}>
                          <Ionicons name="star" size={10} color={Colors.yellow700} />
                          <Text style={styles.popularText}>Popular</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.rewardMeta}>
                      <Text style={styles.discountText}>{reward.discount}</Text>
                      <View style={styles.expiryRow}>
                        <Ionicons name="time-outline" size={12} color={Colors.gray400} />
                        <Text style={styles.expiryText}>{reward.expiry}</Text>
                      </View>
                    </View>

                    <View style={styles.rewardBottom}>
                      <View style={styles.rewardPointsRow}>
                        <Ionicons name="sparkles-outline" size={14} color={Colors.purple500} />
                        <Text style={styles.rewardPointsText}>{reward.points} points</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.redeemBtn, !canAfford && styles.redeemBtnLocked]}
                        disabled={!canAfford}
                        activeOpacity={0.85}
                        onPress={() => router.push('/coupon-detail')}
                      >
                        <Text style={[styles.redeemBtnText, !canAfford && styles.redeemBtnTextLocked]}>
                          {canAfford ? 'Redeem' : 'Locked'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Partner CTA */}
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
          {redeemedRewards.map((r) => (
            <View key={r.id} style={styles.redeemedCard}>
              <View style={styles.redeemedTop}>
                <View>
                  <Text style={styles.rewardName}>{r.name}</Text>
                  <Text style={styles.rewardPartner}>{r.partner}</Text>
                </View>
                <View style={[styles.statusBadge, r.status === 'Active' ? styles.statusActive : styles.statusUsed]}>
                  <Text style={[styles.statusText, r.status === 'Active' ? styles.statusTextActive : styles.statusTextUsed]}>
                    {r.status}
                  </Text>
                </View>
              </View>

              <View style={styles.codeBox}>
                <Text style={styles.codeBoxLabel}>Redemption Code</Text>
                <Text style={styles.codeText}>{r.code}</Text>
              </View>

              <View style={styles.redeemedBottom}>
                <Text style={styles.redeemedDate}>Redeemed: {r.redeemedDate}</Text>
                {r.status === 'Active' && (
                  <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/coupon-redeemed')}>
                    <Text style={styles.useNowText}>Use Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <View style={{ height: 24 }} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  // Header
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
  sparkleBox: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsProgressWrap: { gap: 8 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabelText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  progressLabelVal: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 4 },

  // Challenges
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

  // Tabs
  tabSelector: { paddingHorizontal: 24, marginBottom: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 12, padding: 4, ...Shadow.sm },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.purple600, ...Shadow.md },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: Colors.gray600 },
  tabBtnTextActive: { color: Colors.white },

  // Available rewards
  rewardList: { paddingHorizontal: 24, gap: 16 },
  rewardCard: { backgroundColor: Colors.white, borderRadius: 16, ...Shadow.lg, overflow: 'hidden' },
  rewardCardDim: { opacity: 0.6 },
  rewardCardInner: { flexDirection: 'row', padding: 20, gap: 16 },
  rewardIconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rewardInfo: { flex: 1 },
  rewardInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rewardName: { color: Colors.gray900, fontWeight: '700', fontSize: 15, marginBottom: 2 },
  rewardPartner: { color: Colors.gray600, fontSize: 13 },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.yellow100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  popularText: { color: Colors.yellow700, fontSize: 10, fontWeight: '600' },
  rewardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  discountText: { color: Colors.purple600, fontWeight: '700', fontSize: 17 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiryText: { color: Colors.gray400, fontSize: 12 },
  rewardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardPointsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rewardPointsText: { color: Colors.gray900, fontWeight: '600', fontSize: 14 },
  redeemBtn: { backgroundColor: Colors.purple600, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  redeemBtnLocked: { backgroundColor: Colors.gray200 },
  redeemBtnText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  redeemBtnTextLocked: { color: Colors.gray400 },

  // CTA card
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

  // Redeemed
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
});
