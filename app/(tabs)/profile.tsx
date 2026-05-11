import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileData = {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: string;
  stats?: {
    totalTrips: number;
    totalDistanceKm: number;
    totalCo2SavedG: number;
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    badgeCount?: number;
  };
  userBadges?: { badge: { name: string; description?: string } }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gramsToKg(g: number): string {
  return (g / 1000).toFixed(1);
}

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function treesEquivalent(co2SavedG: number): string {
  // average tree absorbs ~21 kg CO2/year = 21,000 g
  const trees = co2SavedG / 21000;
  if (trees < 0.1) return `${co2SavedG}g of CO₂ saved`;
  return `≈ ${trees.toFixed(1)} tree${trees >= 1.05 ? 's' : ''} per year`;
}

type EcoLevel = { label: string; emoji: string; color: string; minPts: number; maxPts: number };
const ECO_LEVELS: EcoLevel[] = [
  { label: 'Seedling', emoji: '🌱', color: Colors.emerald400, minPts: 0, maxPts: 99 },
  { label: 'Sprout', emoji: '🌿', color: Colors.emerald600, minPts: 100, maxPts: 499 },
  { label: 'Sapling', emoji: '🌲', color: Colors.green600, minPts: 500, maxPts: 1999 },
  { label: 'Tree Guardian', emoji: '🌳', color: Colors.emerald700, minPts: 2000, maxPts: 4999 },
  { label: 'Forest Champion', emoji: '🌍', color: Colors.emerald800, minPts: 5000, maxPts: Infinity },
];

function getEcoLevel(points: number): EcoLevel & { progress: number; index: number } {
  let idx = 0;
  for (let i = ECO_LEVELS.length - 1; i >= 0; i--) {
    if (points >= ECO_LEVELS[i].minPts) { idx = i; break; }
  }
  const level = ECO_LEVELS[idx];
  const range = level.maxPts === Infinity ? 1 : level.maxPts - level.minPts + 1;
  const progress = level.maxPts === Infinity ? 1 : Math.min((points - level.minPts) / range, 1);
  return { ...level, progress, index: idx };
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  route?: string;
  onPress?: () => void;
  badge?: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, session } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.get<ProfileData>('/api/user/profile');
      setProfile(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnread = useCallback(async () => {
    try {
      const res = await api.get<{ notifications: unknown[]; unreadCount: number }>('/api/notifications');
      setUnreadNotifs(res.unreadCount ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadProfile();
    loadUnread();
  }, [loadProfile, loadUnread]));

  const handleLogOut = async () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/log-in'); } },
    ]);
  };

  const handleShareImpact = async () => {
    const co2Kg = profile?.stats ? gramsToKg(profile.stats.totalCo2SavedG) : '0';
    const trips = profile?.stats?.totalTrips ?? 0;
    const points = profile?.stats?.totalPoints ?? 0;
    try {
      await Share.share({
        message: `🌿 My EcoRoute Impact:\n• ${co2Kg} kg CO₂ saved\n• ${trips} eco-trips completed\n• ${points} EcoPoints earned\n\nJoin me and help the planet! 🌍 ecorouteapp.com`,
        title: 'My EcoRoute Impact',
      });
    } catch {
      // user cancelled
    }
  };

  // ─── Derived values ─────────────────────────────────────────────────────────
  const displayName = profile?.fullName ?? session?.user?.email?.split('@')[0] ?? 'You';
  const displayEmail = profile?.email ?? session?.user?.email ?? '';
  const totalCo2Kg = profile?.stats ? gramsToKg(profile.stats.totalCo2SavedG) : '0.0';
  const memberSince = profile?.createdAt ? formatMemberSince(profile.createdAt) : '—';
  const totalPoints = profile?.stats?.totalPoints ?? 0;
  const ecoLevel = getEcoLevel(totalPoints);
  const trees = treesEquivalent(profile?.stats?.totalCo2SavedG ?? 0);
  const initials = displayName.charAt(0).toUpperCase();
  const streak = profile?.stats?.currentStreak ?? 0;
  const longestStreak = profile?.stats?.longestStreak ?? 0;

  const statCards = [
    {
      label: 'Eco Trips',
      value: String(profile?.stats?.totalTrips ?? 0),
      icon: 'leaf-outline' as const,
      bg: Colors.emerald100,
      color: Colors.emerald600,
    },
    {
      label: 'Badges',
      value: String(profile?.stats?.badgeCount ?? 0),
      icon: 'trophy-outline' as const,
      bg: Colors.yellow100,
      color: Colors.yellow500,
    },
    {
      label: 'Points',
      value: String(totalPoints),
      icon: 'flash-outline' as const,
      bg: Colors.blue100,
      color: Colors.blue600,
    },
  ];

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', route: '/edit-profile' },
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          route: '/notifications',
          badge: unreadNotifs > 0 ? String(unreadNotifs) : undefined,
        },
        { icon: 'shield-checkmark-outline', label: 'Privacy & Security', route: '/privacy-security' },
      ],
    },
    {
      title: 'App Settings',
      items: [
        { icon: 'location-outline', label: 'Saved Routes', route: '/saved-routes' },
        { icon: 'settings-outline', label: 'Preferences', route: '/preferences' },
        {
          icon: 'card-outline',
          label: 'Payment Methods',
          onPress: () => Alert.alert('Coming Soon', 'Payment methods will be available in a future update.'),
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          icon: 'people-outline',
          label: 'Friends & Leaderboard',
          onPress: () => Alert.alert('Coming Soon', 'Leaderboards are coming in the next update!'),
        },
        { icon: 'share-social-outline', label: 'Invite Friends', route: '/invite-friends' },
        {
          icon: 'ribbon-outline',
          label: 'Challenges',
          onPress: () => router.push('/(tabs)'),
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Header gradient ── */}
      <LinearGradient
        colors={[Colors.indigo600, Colors.purple600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="person-outline" size={24} color={Colors.white} />
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/preferences')}>
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardTop}>
            {/* Avatar */}
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/edit-profile')}>
              {loading ? (
                <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }]}>
                  <ActivityIndicator color={Colors.white} />
                </View>
              ) : profile?.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <LinearGradient
                  colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.12)']}
                  style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera-outline" size={10} color={Colors.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
                  <Text style={styles.profileEmail} numberOfLines={1}>{displayEmail}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/edit-profile')}>
                  <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              <View style={styles.profileBadges}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{ecoLevel.emoji} {ecoLevel.label}</Text>
                </View>
                {streak > 0 && (
                  <View style={styles.rankBadge}>
                    <Ionicons name="flame-outline" size={12} color="rgba(253,224,71,1)" />
                    <Text style={styles.rankBadgeText}>{streak}d streak</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Impact Row */}
          <View style={styles.impactRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.impactLabel}>CO₂ Saved Total</Text>
              <Text style={styles.impactValue}>{totalCo2Kg} kg</Text>
              <Text style={styles.impactSub}>{trees}</Text>
            </View>
            <TouchableOpacity
              style={styles.shareImpactBtn}
              onPress={handleShareImpact}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={16} color={Colors.white} />
              <Text style={styles.shareImpactText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* ── Stat Cards ── */}
      <View style={styles.statsWrap}>
        <View style={styles.statsRow}>
          {statCards.map((s) => (
            <View key={s.label} style={[styles.statCard, Shadow.lg, { backgroundColor: Colors.white }]}>
              <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Eco Level Card ── */}
      <View style={styles.levelCardWrap}>
        <View style={[styles.levelCard, Shadow.md]}>
          <View style={styles.levelCardTop}>
            <View>
              <Text style={styles.levelCardTitle}>Eco Level</Text>
              <Text style={[styles.levelCardName, { color: ecoLevel.color }]}>
                {ecoLevel.emoji} {ecoLevel.label}
              </Text>
            </View>
            <View>
              <Text style={styles.levelCardPts}>{totalPoints.toLocaleString()}</Text>
              <Text style={styles.levelCardPtsLabel}>EcoPoints</Text>
            </View>
          </View>
          <View style={styles.levelBarBg}>
            <View style={[styles.levelBarFill, { width: `${(ecoLevel.progress * 100).toFixed(0)}%` as any, backgroundColor: ecoLevel.color }]} />
          </View>
          {ecoLevel.maxPts !== Infinity && (
            <Text style={styles.levelNextPts}>
              {ecoLevel.maxPts + 1 - totalPoints} pts to {ECO_LEVELS[ecoLevel.index + 1]?.label}
            </Text>
          )}
          {streak > 0 && (
            <View style={styles.streakRow}>
              <Ionicons name="flame-outline" size={14} color={Colors.orange600} />
              <Text style={styles.streakText}>{streak} day streak</Text>
              {longestStreak > 0 && <Text style={styles.streakBest}>Best: {longestStreak}d</Text>}
            </View>
          )}
        </View>
      </View>

      {/* ── Recent Badges ── */}
      {(profile?.userBadges?.length ?? 0) > 0 && (
        <View style={styles.badgesWrap}>
          <View style={styles.badgesSectionHeader}>
            <Text style={styles.badgesSectionTitle}>Recent Badges</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/rewards' as any)} activeOpacity={0.7}>
              <Text style={styles.badgesSeeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesRow}>
            {profile!.userBadges!.map((ub, i) => (
              <View key={i} style={styles.badgeChip}>
                <Ionicons name="trophy-outline" size={14} color={Colors.yellow500} />
                <Text style={styles.badgeChipText} numberOfLines={1}>{ub.badge.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Menu Sections ── */}
      <View style={styles.menuWrap}>
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => {
                const isLast = idx === section.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.menuItem, !isLast && styles.menuItemBorder]}
                    activeOpacity={0.7}
                    onPress={item.onPress ?? (item.route ? () => router.push(item.route as any) : undefined)}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuItemIconBox}>
                        <Ionicons name={item.icon} size={20} color={Colors.gray600} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.menuItemRight}>
                      {item.badge && (
                        <View style={styles.menuBadge}>
                          <Text style={styles.menuBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward-outline" size={18} color={Colors.gray400} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* ── Member Since ── */}
        <LinearGradient colors={[Colors.emerald600, Colors.emerald700]} style={styles.memberCard}>
          <View style={styles.memberRow}>
            <View style={styles.memberIconBox}>
              <Ionicons name="earth-outline" size={28} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberSinceLabel}>Member Since</Text>
              <Text style={styles.memberSinceValue}>{memberSince}</Text>
              <Text style={styles.memberSinceSub}>
                Thank you for making every journey count. Together we're building a greener world! 🌿
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.shareImpactCardBtn} onPress={handleShareImpact} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={16} color={Colors.white} />
            <Text style={styles.shareImpactCardText}>Share My Impact</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Log Out ── */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={handleLogOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.red600} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* ── Version ── */}
        <View style={styles.versionWrap}>
          <Text style={styles.versionText}>EcoRoute v1.2.0</Text>
          <Text style={styles.versionText}>Made with 💚 for a sustainable future</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  // Header
  header: { paddingHorizontal: 24, paddingBottom: 56, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },

  // Profile card
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    gap: 16,
  },
  profileCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  avatar: { width: 72, height: 72, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarInitials: { color: Colors.white, fontSize: 28, fontWeight: '700' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  profileInfo: { flex: 1 },
  profileNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  profileName: { color: Colors.white, fontSize: 18, fontWeight: '700', marginBottom: 2 },
  profileEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  profileBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  levelBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  levelBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234,179,8,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rankBadgeText: { color: 'rgba(253,224,71,1)', fontSize: 11, fontWeight: '600' },

  // Impact row
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  impactLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 2 },
  impactValue: { color: Colors.white, fontSize: 26, fontWeight: '800' },
  impactSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  shareImpactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  shareImpactText: { color: Colors.white, fontSize: 13, fontWeight: '600' },

  // Stats
  statsWrap: { paddingHorizontal: 24, marginTop: -28, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { color: Colors.gray900, fontWeight: '700', fontSize: 18 },
  statLabel: { color: Colors.gray500, fontSize: 10, textAlign: 'center' },

  // Eco Level Card
  levelCardWrap: { paddingHorizontal: 24, marginBottom: 20 },
  levelCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, gap: 12 },
  levelCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  levelCardTitle: { color: Colors.gray500, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  levelCardName: { fontSize: 20, fontWeight: '800' },
  levelCardPts: { color: Colors.gray900, fontSize: 22, fontWeight: '800', textAlign: 'right' },
  levelCardPtsLabel: { color: Colors.gray500, fontSize: 11, textAlign: 'right' },
  levelBarBg: { height: 8, backgroundColor: Colors.gray100, borderRadius: 4, overflow: 'hidden' },
  levelBarFill: { height: 8, borderRadius: 4 },
  levelNextPts: { color: Colors.gray500, fontSize: 12 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  streakText: { color: Colors.orange600, fontSize: 13, fontWeight: '600' },
  streakBest: { color: Colors.gray400, fontSize: 12, marginLeft: 4 },

  // Badges
  badgesWrap: { paddingHorizontal: 24, marginBottom: 16 },
  badgesSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badgesSectionTitle: { color: Colors.gray700, fontSize: 15, fontWeight: '700' },
  badgesSeeAll: { color: Colors.emerald600, fontSize: 13, fontWeight: '600' },
  badgesRow: { gap: 8, paddingBottom: 4 },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.yellow100,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.yellow500 + '40',
  },
  badgeChipText: { color: Colors.yellow700, fontSize: 12, fontWeight: '600', maxWidth: 120 },

  // Menu
  menuWrap: { paddingHorizontal: 24, gap: 20, paddingBottom: 16 },
  menuSection: { gap: 8 },
  menuSectionTitle: {
    color: Colors.gray500,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  menuCard: { backgroundColor: Colors.white, borderRadius: 18, overflow: 'hidden', ...Shadow.sm },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuItemIconBox: { width: 38, height: 38, backgroundColor: Colors.gray100, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuItemLabel: { color: Colors.gray900, fontWeight: '500', fontSize: 15 },
  menuBadge: {
    backgroundColor: Colors.red600,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  menuBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },

  // Member card
  memberCard: { borderRadius: 20, padding: 22, gap: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  memberIconBox: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberSinceLabel: { color: Colors.emeraldText100, fontSize: 12, marginBottom: 4 },
  memberSinceValue: { color: Colors.white, fontSize: 20, fontWeight: '700', marginBottom: 6 },
  memberSinceSub: { color: Colors.emeraldText100, fontSize: 12, lineHeight: 18 },
  shareImpactCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  shareImpactCardText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  // Log out
  logoutBtn: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  logoutText: { color: Colors.red600, fontWeight: '600', fontSize: 15 },

  // Version
  versionWrap: { alignItems: 'center', paddingVertical: 16, gap: 4, marginBottom: 8 },
  versionText: { color: Colors.gray400, fontSize: 12 },
});
