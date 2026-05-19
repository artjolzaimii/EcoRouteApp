import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly to us, such as your name and email address when you create an account. We also collect location data (with your permission) to calculate routes and CO₂ savings, and usage data such as trips completed, badges earned, and EcoPoints accumulated.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to provide and improve the EcoRoute service, calculate your environmental impact, award EcoPoints and badges, personalise your experience, and send you notifications you have opted into.',
  },
  {
    title: '3. Location Data',
    body: 'Location access is requested only when you plan a route. We use your location solely to compute eco-friendly route options and CO₂ savings versus driving. We do not store your precise location history beyond the trip summary (origin/destination addresses and coordinates).',
  },
  {
    title: '4. Data Sharing',
    body: 'We do not sell your personal data to third parties. We may share anonymised, aggregated data for research or public reporting on sustainable transport trends. We use Supabase (database and authentication) and Google Maps (routing) as infrastructure providers, each bound by their own data-processing agreements.',
  },
  {
    title: '5. Data Retention',
    body: 'We retain your account data for as long as your account is active. You can delete your account at any time from Profile → Privacy & Security → Delete Account. Deletion permanently removes all your trips, badges, points, and personal information from our systems.',
  },
  {
    title: '6. Security',
    body: 'Your data is stored securely with Supabase on encrypted servers. Authentication tokens are short-lived and refreshed automatically. We follow industry best practices for data protection.',
  },
  {
    title: '7. Your Rights',
    body: 'You have the right to access, correct, or delete your personal data at any time. You can update your profile information from the Edit Profile screen, manage notification preferences, or permanently delete your account from Privacy & Security settings.',
  },
  {
    title: '8. Contact',
    body: 'If you have any questions about this privacy policy or how we handle your data, please contact us at privacy@ecorouteapp.com.',
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaCard}>
          <Ionicons name="shield-checkmark-outline" size={32} color={Colors.purple600} />
          <View style={{ flex: 1 }}>
            <Text style={styles.metaTitle}>EcoRoute Privacy Policy</Text>
            <Text style={styles.metaDate}>Last updated: May 2025</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          EcoRoute is committed to protecting your privacy. This policy explains what information we collect, how we use it, and the choices you have.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
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
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.purple100,
    borderRadius: 16,
    padding: 16,
  },
  metaTitle: { color: Colors.purple600, fontWeight: '700', fontSize: 15 },
  metaDate: { color: Colors.purple600, fontSize: 12, marginTop: 2, opacity: 0.8 },
  intro: { color: Colors.gray600, fontSize: 14, lineHeight: 22 },
  section: { gap: 8 },
  sectionTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 15 },
  sectionBody: { color: Colors.gray600, fontSize: 14, lineHeight: 22 },
});
