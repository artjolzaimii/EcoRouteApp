import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const user = {
  name: 'Alex Morgan',
  email: 'alex.morgan@email.com',
  memberSince: 'January 2026',
  level: 'Eco Champion',
  rank: 'Top 5%',
  totalImpact: '892 kg CO₂',
};

const stats = [
  { label: 'Total Trips',   value: '687', icon: 'location-outline' as const, bg: Colors.emerald100, color: Colors.emerald600 },
  { label: 'Achievements',  value: '24',  icon: 'trophy-outline'   as const, bg: Colors.yellow100,  color: Colors.yellow500  },
  { label: 'Friends',       value: '42',  icon: 'people-outline'   as const, bg: Colors.blue100,    color: Colors.blue600    },
];

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  toggle?: boolean;
  route?: string;
};

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline',           label: 'Edit Profile',        route: '/edit-profile' },
      { icon: 'notifications-outline',    label: 'Notifications',       toggle: true },
      { icon: 'shield-checkmark-outline', label: 'Privacy & Security' },
    ],
  },
  {
    title: 'App Settings',
    items: [
      { icon: 'location-outline',  label: 'Saved Routes',    route: '/saved-routes' },
      { icon: 'settings-outline',  label: 'Preferences'       },
      { icon: 'card-outline',      label: 'Payment Methods'   },
    ],
  },
  {
    title: 'Community',
    items: [
      { icon: 'people-outline',        label: 'Friends & Leaderboard' },
      { icon: 'share-social-outline',  label: 'Invite Friends'        },
      { icon: 'trophy-outline',        label: 'Challenges'            },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
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
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardTop}>
            {/* Avatar */}
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.avatar}
            >
              <Ionicons name="person-outline" size={40} color={Colors.white} />
            </LinearGradient>

            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <View>
                  <Text style={styles.profileName}>{user.name}</Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/edit-profile')}>
                  <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              <View style={styles.profileBadges}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{user.level}</Text>
                </View>
                <View style={styles.rankBadge}>
                  <Ionicons name="trending-up-outline" size={12} color="rgba(253,224,71,1)" />
                  <Text style={styles.rankBadgeText}>{user.rank}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.impactRow}>
            <Text style={styles.impactLabel}>Total Environmental Impact</Text>
            <Text style={styles.impactValue}>{user.totalImpact}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsWrap}>
        <View style={styles.statsRow}>
          {stats.map((s) => (
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

      {/* Menu Sections */}
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
                    onPress={item.route ? () => router.push(item.route as any) : undefined}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuItemIconBox}>
                        <Ionicons name={item.icon} size={20} color={Colors.gray600} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                    </View>
                    {item.toggle ? (
                      <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        trackColor={{ false: Colors.gray300, true: Colors.emerald600 }}
                        thumbColor={Colors.white}
                      />
                    ) : (
                      <Ionicons name="chevron-forward-outline" size={20} color={Colors.gray400} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Member Since */}
        <LinearGradient colors={[Colors.emerald600, Colors.emerald700]} style={styles.memberCard}>
          <View style={styles.memberRow}>
            <View style={styles.memberIconBox}>
              <Ionicons name="trophy-outline" size={28} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberSinceLabel}>Member Since</Text>
              <Text style={styles.memberSinceValue}>{user.memberSince}</Text>
              <Text style={styles.memberSinceSub}>
                You've made a positive impact on the planet for over 2 months!
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={() => router.replace('/log-in')}>
          <Ionicons name="log-out-outline" size={20} color={Colors.red600} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionWrap}>
          <Text style={styles.versionText}>EcoRoute v1.2.0</Text>
          <Text style={styles.versionText}>Made with 💚 for a sustainable future</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  // Header
  header: { paddingHorizontal: 24, paddingBottom: 56, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  profileInfo: { flex: 1 },
  profileNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  profileName: { color: Colors.white, fontSize: 20, fontWeight: '700', marginBottom: 2 },
  profileEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  profileBadges: { flexDirection: 'row', gap: 8 },
  levelBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  levelBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234,179,8,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rankBadgeText: { color: 'rgba(253,224,71,1)', fontSize: 11, fontWeight: '600' },
  impactRow: { paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  impactLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4 },
  impactValue: { color: Colors.white, fontSize: 24, fontWeight: '700' },

  // Stats
  statsWrap: { paddingHorizontal: 24, marginTop: -28, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 6 },
  statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { color: Colors.gray900, fontWeight: '700', fontSize: 18 },
  statLabel: { color: Colors.gray500, fontSize: 11, textAlign: 'center' },

  // Menu
  menuWrap: { paddingHorizontal: 24, gap: 24, paddingBottom: 16 },
  menuSection: { gap: 8 },
  menuSectionTitle: {
    color: Colors.gray500,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  menuCard: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', ...Shadow.sm },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemIconBox: { width: 40, height: 40, backgroundColor: Colors.gray100, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuItemLabel: { color: Colors.gray900, fontWeight: '500', fontSize: 15 },

  // Member since
  memberCard: { borderRadius: 16, padding: 24 },
  memberRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  memberIconBox: { width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  memberSinceLabel: { color: Colors.emeraldText100, fontSize: 13, marginBottom: 4 },
  memberSinceValue: { color: Colors.white, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  memberSinceSub: { color: Colors.emeraldText100, fontSize: 13, lineHeight: 18 },

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
