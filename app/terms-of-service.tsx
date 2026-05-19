import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using EcoRoute, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.',
  },
  {
    title: '2. Use of the Service',
    body: 'EcoRoute provides eco-friendly route planning, CO₂ impact tracking, and a rewards programme. You agree to use the service lawfully and only for its intended purpose. You must not attempt to abuse, reverse-engineer, or interfere with the service.',
  },
  {
    title: '3. Account Responsibility',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account. Please notify us immediately if you suspect unauthorised access.',
  },
  {
    title: '4. EcoPoints & Rewards',
    body: 'EcoPoints are earned by completing eco-friendly trips, earning badges, and participating in challenges. Points have no monetary value and cannot be exchanged for cash. EcoRoute reserves the right to adjust, expire, or revoke points in cases of abuse or misuse. Coupons and rewards issued through the app are subject to the terms of the partner providing them.',
  },
  {
    title: '5. Referral Programme',
    body: 'You may invite friends using your referral code. You earn bonus points when a referred friend creates a verified account. Referral rewards are granted at EcoRoute\'s discretion and may be adjusted to prevent abuse. Self-referrals and bulk account creation are prohibited.',
  },
  {
    title: '6. Location Data',
    body: 'The app requires location permission to calculate routes and CO₂ savings. You grant EcoRoute a limited licence to process your location data solely for this purpose. You may revoke location permission at any time via your device settings, though some features may be unavailable as a result.',
  },
  {
    title: '7. Intellectual Property',
    body: 'All content, branding, and software in EcoRoute are the property of EcoRoute and its licensors. You may not reproduce, distribute, or create derivative works without explicit written permission.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'EcoRoute is provided "as is" without warranties of any kind. We are not liable for route accuracy, CO₂ estimates (which are based on industry averages), or any decisions you make based on information in the app. Use the service as a guide, not as a definitive environmental audit.',
  },
  {
    title: '9. Termination',
    body: 'You may delete your account at any time from Profile → Privacy & Security. EcoRoute may suspend or terminate accounts that violate these terms. Upon termination, your data will be permanently deleted.',
  },
  {
    title: '10. Changes to Terms',
    body: 'We may update these terms from time to time. We will notify you of significant changes via in-app notification. Continued use of the app after changes constitutes acceptance of the updated terms.',
  },
  {
    title: '11. Contact',
    body: 'For questions about these Terms of Service, please contact us at legal@ecorouteapp.com.',
  },
];

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaCard}>
          <Ionicons name="document-text-outline" size={32} color={Colors.blue600} />
          <View style={{ flex: 1 }}>
            <Text style={styles.metaTitle}>EcoRoute Terms of Service</Text>
            <Text style={styles.metaDate}>Last updated: May 2025</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          Please read these terms carefully before using EcoRoute. By using the app you agree to the following conditions.
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
    backgroundColor: Colors.blue100,
    borderRadius: 16,
    padding: 16,
  },
  metaTitle: { color: Colors.blue600, fontWeight: '700', fontSize: 15 },
  metaDate: { color: Colors.blue600, fontSize: 12, marginTop: 2, opacity: 0.8 },
  intro: { color: Colors.gray600, fontSize: 14, lineHeight: 22 },
  section: { gap: 8 },
  sectionTitle: { color: Colors.gray900, fontWeight: '700', fontSize: 15 },
  sectionBody: { color: Colors.gray600, fontSize: 14, lineHeight: 22 },
});
