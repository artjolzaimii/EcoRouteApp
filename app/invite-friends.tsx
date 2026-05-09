import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

function deriveReferralCode(userId: string): string {
  const raw = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `ECO-${raw}`;
}

const BENEFITS = [
  { icon: 'flash-outline' as const, color: Colors.yellow500, bg: Colors.yellow100, title: '50 bonus points', sub: 'You earn 50 EcoPoints when a friend joins' },
  { icon: 'leaf-outline' as const, color: Colors.emerald600, bg: Colors.emerald100, title: 'Extra streak protection', sub: 'Get one free streak day saved per referral' },
  { icon: 'trophy-outline' as const, color: Colors.purple600, bg: Colors.purple100, title: 'Unlock referral badge', sub: 'Earn the "Eco Ambassador" badge at 3 referrals' },
];

export default function InviteFriendsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [copied, setCopied] = useState(false);

  const userId = session?.user?.id ?? 'ECO123';
  const referralCode = deriveReferralCode(userId);
  const shareMessage = `Hey! Join me on EcoRoute — the app that helps you travel greener and earn rewards 🌿\n\nUse my referral code ${referralCode} when you sign up!\n\nhttps://ecorouteapp.com/join`;

  const copyCode = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareNative = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: 'Join EcoRoute',
      });
    } catch {
      // user cancelled or error
    }
  };

  const shareVia = (platform: string) => {
    Alert.alert(
      `Share on ${platform}`,
      `Copy your referral code and paste it in ${platform}:\n\n${referralCode}`,
      [
        { text: 'Copy Code', onPress: copyCode },
        { text: 'OK' },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[Colors.emerald600, Colors.emerald700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="people-outline" size={40} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>Invite & Earn Together</Text>
          <Text style={styles.heroSub}>
            Share EcoRoute with friends and both of you earn rewards. Every referral helps grow the eco community!
          </Text>
        </LinearGradient>

        {/* Referral Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          <View style={styles.codeCard}>
            <View style={styles.codePill}>
              <Text style={styles.codeText}>{referralCode}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnActive]}
              onPress={copyCode}
              activeOpacity={0.8}
            >
              <Ionicons name={copied ? 'checkmark-outline' : 'copy-outline'} size={18} color={copied ? Colors.white : Colors.emerald600} />
              <Text style={[styles.copyBtnText, copied && styles.copyBtnTextActive]}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share Via</Text>
          <TouchableOpacity style={styles.shareMainBtn} onPress={shareNative} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.emerald600, Colors.emerald700]}
              style={styles.shareMainGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="share-social-outline" size={20} color={Colors.white} />
              <Text style={styles.shareMainText}>Share with Friends</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.shareRow}>
            {[
              { label: 'WhatsApp', icon: 'logo-whatsapp' as const, color: '#25D366' },
              { label: 'Telegram', icon: 'paper-plane-outline' as const, color: '#0088cc' },
              { label: 'Messages', icon: 'chatbubble-outline' as const, color: Colors.blue600 },
              { label: 'Email', icon: 'mail-outline' as const, color: Colors.gray600 },
            ].map((s) => (
              <TouchableOpacity
                key={s.label}
                style={styles.shareAppBtn}
                onPress={() => shareVia(s.label)}
                activeOpacity={0.8}
              >
                <View style={[styles.shareAppIcon, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                </View>
                <Text style={styles.shareAppLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You Both Get</Text>
          <View style={styles.benefitsCard}>
            {BENEFITS.map((b, i) => (
              <React.Fragment key={b.title}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.benefitRow}>
                  <View style={[styles.benefitIcon, { backgroundColor: b.bg }]}>
                    <Ionicons name={b.icon} size={20} color={b.color} />
                  </View>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{b.title}</Text>
                    <Text style={styles.benefitSub}>{b.sub}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Share preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message Preview</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewText}>{shareMessage}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.gray50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: '#1A1A1A', fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  hero: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 12, marginBottom: 8 },
  heroIconWrap: {
    width: 72,
    height: 72,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: Colors.white, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  section: { gap: 10, marginBottom: 8 },
  sectionTitle: { color: Colors.gray500, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  codeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadow.sm,
  },
  codePill: {
    flex: 1,
    backgroundColor: Colors.emerald50,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.emerald200,
    borderStyle: 'dashed',
  },
  codeText: { color: Colors.emerald700, fontSize: 22, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.emerald50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.emerald600,
  },
  copyBtnActive: { backgroundColor: Colors.emerald600, borderColor: Colors.emerald600 },
  copyBtnText: { color: Colors.emerald600, fontWeight: '700', fontSize: 14 },
  copyBtnTextActive: { color: Colors.white },
  shareMainBtn: { borderRadius: 16, overflow: 'hidden', ...Shadow.md },
  shareMainGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  shareMainText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  shareRow: { flexDirection: 'row', justifyContent: 'space-between' },
  shareAppBtn: { alignItems: 'center', gap: 6, flex: 1 },
  shareAppIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  shareAppLabel: { color: Colors.gray600, fontSize: 11, fontWeight: '500' },
  benefitsCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, gap: 16, ...Shadow.sm },
  divider: { height: 1, backgroundColor: Colors.gray100 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  benefitIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  benefitText: { flex: 1 },
  benefitTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 15, marginBottom: 2 },
  benefitSub: { color: Colors.gray500, fontSize: 13, lineHeight: 18 },
  previewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.emerald600,
    ...Shadow.sm,
  },
  previewText: { color: Colors.gray700, fontSize: 13, lineHeight: 20 },
});
