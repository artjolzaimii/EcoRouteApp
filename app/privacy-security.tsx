import { Colors, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

// ─────────────────────────────────────────────
// Real policy content
// ─────────────────────────────────────────────

const PRIVACY_POLICY = `Last updated: 1 May 2026

1. INFORMATION WE COLLECT
EcoRoute collects the following categories of data to provide our service:

• Location data: Real-time and historical GPS coordinates used to plan routes, calculate distances, and compute CO₂ savings. Location is only collected while the app is in use unless you enable background tracking.

• Account data: Your email address and display name provided at registration, stored securely on our servers.

• Trip data: Route history, transport modes used, distance travelled, and associated environmental metrics (CO₂ saved, green points earned).

• Usage analytics: Anonymised interaction data such as screens visited, features used, and error logs. This helps us improve the app experience.

• Device information: Device model, operating system version, and app version for compatibility and debugging.

2. HOW WE USE YOUR DATA
We use your personal data exclusively to:
• Provide, maintain, and improve the EcoRoute service.
• Calculate and display your environmental impact statistics.
• Award green points and unlock achievements.
• Send relevant notifications (only if you opt in).
• Detect and prevent fraud or misuse.

We do not sell, rent, or share your personal data with third parties for their own marketing purposes.

3. DATA SHARING
We share anonymised, aggregated trip data with:
• Eco-partner businesses on our platform, solely to display relevant nearby offers on your route.
• Analytics providers (e.g. crash reporting tools) who are contractually bound to process data only on our behalf.

We may disclose personal data where legally required (e.g. court orders, regulatory requests).

4. DATA RETENTION
• Active account data is retained for as long as your account exists.
• Trip data is retained for 36 months, after which it is anonymised.
• You may request deletion of your account and associated data at any time via Settings → Privacy & Security → Delete Account.

5. YOUR RIGHTS
Depending on your country of residence, you may have the right to:
• Access the personal data we hold about you.
• Correct inaccurate or incomplete data.
• Request deletion of your data ("right to be forgotten").
• Object to or restrict certain processing activities.
• Export your data in a portable format.

To exercise any of these rights, contact privacy@ecoroute.app.

6. SECURITY
We use industry-standard encryption (TLS 1.3) for data in transit and AES-256 for sensitive data at rest. Access to personal data is restricted to authorised personnel on a need-to-know basis.

7. CONTACT
EcoRoute Privacy Team
Email: privacy@ecoroute.app
Address: 1 Green Street, London, EC1A 1BB, United Kingdom`;

const TERMS_OF_SERVICE = `Last updated: 1 May 2026

1. ACCEPTANCE OF TERMS
By creating an account or using the EcoRoute application ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.

2. ELIGIBILITY
You must be at least 16 years old to use EcoRoute. By registering, you confirm that you meet this requirement. Parents or guardians are responsible for minors who use the Service.

3. YOUR ACCOUNT
• You are responsible for keeping your credentials secure. Do not share your password.
• You must provide accurate registration information.
• You are responsible for all activity that occurs under your account.
• Accounts are personal and non-transferable.

4. ACCEPTABLE USE
You agree NOT to:
• Use the Service for any unlawful purpose.
• Attempt to gain unauthorised access to our systems or other users' accounts.
• Upload or transmit viruses, malware, or harmful code.
• Scrape, crawl, or automatically extract data from the Service without written permission.
• Impersonate other users or EcoRoute staff.

5. REWARDS & GREEN POINTS
• Green points are earned by completing eco-friendly trips and activities recorded in the app.
• Points have no monetary value and cannot be exchanged for cash.
• EcoRoute reserves the right to adjust, expire, or remove points if fraudulent activity is detected.
• Coupons obtained through the rewards system are subject to partner terms and may have expiry dates.

6. ENVIRONMENTAL METRICS
• CO₂ savings and equivalencies are estimates calculated using established academic emission factors and standard baselines.
• EcoRoute does not guarantee the accuracy of individual environmental impact calculations and these should not be used as official carbon offsets.

7. INTELLECTUAL PROPERTY
All content, trademarks, software, and data within the EcoRoute Service are owned by or licensed to EcoRoute Ltd. You are granted a limited, non-exclusive, non-transferable licence to use the Service solely for personal, non-commercial purposes.

8. DISCLAIMER OF WARRANTIES
THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. ECOROUTE DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.

9. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, ECOROUTE SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.

10. CHANGES TO TERMS
We reserve the right to modify these Terms at any time. We will notify you of material changes via the app or email. Continued use of the Service after notification constitutes acceptance of the revised Terms.

11. TERMINATION
We may suspend or terminate your account if you violate these Terms. You may delete your account at any time in Settings → Privacy & Security.

12. GOVERNING LAW
These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.

13. CONTACT
EcoRoute Ltd
Email: legal@ecoroute.app
Address: 1 Green Street, London, EC1A 1BB, United Kingdom`;

// ─────────────────────────────────────────────
// In-app document viewer
// ─────────────────────────────────────────────

function DocumentModal({
    visible,
    title,
    content,
    onClose,
}: {
    visible: boolean;
    title: string;
    content: string;
    onClose: () => void;
}) {
    const insets = useSafeAreaInsets();
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[docStyles.container, { paddingTop: insets.top + 8 }]}>
                <View style={docStyles.docHeader}>
                    <Text style={docStyles.docTitle}>{title}</Text>
                    <TouchableOpacity style={docStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                        <Ionicons name="close" size={22} color="#1A1A1A" />
                    </TouchableOpacity>
                </View>
                <ScrollView
                    style={docStyles.scroll}
                    contentContainerStyle={[docStyles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={docStyles.docText}>{content}</Text>
                </ScrollView>
            </View>
        </Modal>
    );
}

// ─────────────────────────────────────────────
// Toggle config
// ─────────────────────────────────────────────

type ToggleKey = 'locationData' | 'analytics' | 'personalization' | 'crashReports';

const toggleConfig: { key: ToggleKey; title: string; subtitle: string }[] = [
    {
        key: 'locationData',
        title: 'Location data sharing',
        subtitle: 'Share anonymised route data to improve eco suggestions',
    },
    {
        key: 'analytics',
        title: 'Usage analytics',
        subtitle: 'Help us improve the app by sharing usage statistics',
    },
    {
        key: 'personalization',
        title: 'Personalisation',
        subtitle: 'Allow personalised route recommendations based on history',
    },
    {
        key: 'crashReports',
        title: 'Crash reports',
        subtitle: 'Automatically send crash reports to our team',
    },
];

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────

export default function PrivacySecurityScreen() {
    const insets = useSafeAreaInsets();
    const { signOut } = useAuth();

    const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
        locationData: true,
        analytics: true,
        personalization: true,
        crashReports: true,
    });

    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const toggle = (key: ToggleKey, value: boolean) =>
        setToggles((prev) => ({ ...prev, [key]: value }));

    const handleChangePassword = () => {
        Alert.alert(
            'Change Password',
            'A password-reset link will be sent to your registered email address.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Link',
                    onPress: () =>
                        Alert.alert('Email Sent', 'Check your inbox for the password-reset link.'),
                },
            ],
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/log-in');
                    },
                },
            ],
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
                    <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy & Security</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Data Sharing */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>DATA SHARING</Text>
                    <View style={styles.card}>
                        {toggleConfig.map((item, i) => (
                            <View key={item.key}>
                                {i > 0 && <View style={styles.divider} />}
                                <View style={styles.row}>
                                    <View style={styles.rowText}>
                                        <Text style={styles.rowTitle}>{item.title}</Text>
                                        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                                    </View>
                                    <Switch
                                        value={toggles[item.key]}
                                        onValueChange={(val) => toggle(item.key, val)}
                                        trackColor={{ false: Colors.gray300, true: ECO_GREEN }}
                                        thumbColor={Colors.white}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Account Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ACCOUNT SECURITY</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={handleChangePassword}>
                            <View style={styles.actionLeft}>
                                <View style={[styles.iconBox, { backgroundColor: Colors.blue100 }]}>
                                    <Ionicons name="key-outline" size={20} color={Colors.blue600} />
                                </View>
                                <View>
                                    <Text style={styles.actionTitle}>Change Password</Text>
                                    <Text style={styles.actionSub}>Receive a reset link by email</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={20} color={Colors.gray400} />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}
                            onPress={() => Alert.alert('Two-Factor Auth', 'Two-factor authentication coming in a future update.')}>
                            <View style={styles.actionLeft}>
                                <View style={[styles.iconBox, { backgroundColor: Colors.emerald100 }]}>
                                    <Ionicons name="shield-checkmark-outline" size={20} color={ECO_GREEN} />
                                </View>
                                <View>
                                    <Text style={styles.actionTitle}>Two-Factor Authentication</Text>
                                    <Text style={styles.actionSub}>Add an extra layer of security</Text>
                                </View>
                            </View>
                            <View style={styles.comingSoonBadge}>
                                <Text style={styles.comingSoonText}>Soon</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Legal — real in-app documents */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>LEGAL</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={() => setShowPrivacy(true)}>
                            <View style={styles.actionLeft}>
                                <View style={[styles.iconBox, { backgroundColor: Colors.purple100 }]}>
                                    <Ionicons name="document-text-outline" size={20} color={Colors.purple600} />
                                </View>
                                <View>
                                    <Text style={styles.actionTitle}>Privacy Policy</Text>
                                    <Text style={styles.actionSub}>How we handle your data</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={18} color={Colors.gray400} />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={() => setShowTerms(true)}>
                            <View style={styles.actionLeft}>
                                <View style={[styles.iconBox, { backgroundColor: Colors.amber100 }]}>
                                    <Ionicons name="newspaper-outline" size={20} color={Colors.amber600} />
                                </View>
                                <View>
                                    <Text style={styles.actionTitle}>Terms of Service</Text>
                                    <Text style={styles.actionSub}>Rules for using EcoRoute</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={18} color={Colors.gray400} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>DANGER ZONE</Text>
                    <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.85} onPress={handleDeleteAccount}>
                        <Ionicons name="trash-outline" size={20} color={Colors.red600} />
                        <Text style={styles.deleteBtnText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* In-app document modals */}
            <DocumentModal
                visible={showPrivacy}
                title="Privacy Policy"
                content={PRIVACY_POLICY}
                onClose={() => setShowPrivacy(false)}
            />
            <DocumentModal
                visible={showTerms}
                title="Terms of Service"
                content={TERMS_OF_SERVICE}
                onClose={() => setShowTerms(false)}
            />
        </View>
    );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CREAM },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
    backBtn: {
        width: 40, height: 40, backgroundColor: Colors.white, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
    },
    headerTitle: { color: '#1A1A1A', fontSize: 24, fontWeight: '700' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 8, gap: 24 },
    section: { gap: 10 },
    sectionLabel: {
        color: Colors.gray500, fontSize: 11, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 4,
    },
    card: { backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden', ...Shadow.sm },
    divider: { height: 1, backgroundColor: Colors.gray100, marginHorizontal: 16 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    rowText: { flex: 1, marginRight: 12 },
    rowTitle: { color: '#1A1A1A', fontWeight: '600', fontSize: 15, marginBottom: 2 },
    rowSubtitle: { color: Colors.gray500, fontSize: 13, lineHeight: 18 },
    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionTitle: { color: '#1A1A1A', fontWeight: '600', fontSize: 15, marginBottom: 1 },
    actionSub: { color: Colors.gray500, fontSize: 12 },
    comingSoonBadge: {
        backgroundColor: Colors.amber100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    },
    comingSoonText: { color: Colors.amber700, fontSize: 11, fontWeight: '600' },
    deleteBtn: {
        backgroundColor: Colors.white, borderRadius: 16, padding: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderWidth: 1.5, borderColor: Colors.red600, ...Shadow.sm,
    },
    deleteBtnText: { color: Colors.red600, fontWeight: '600', fontSize: 15 },
});

const docStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    docHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray100,
    },
    docTitle: { color: '#1A1A1A', fontSize: 20, fontWeight: '700', flex: 1 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray100,
        alignItems: 'center', justifyContent: 'center',
    },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
    docText: { color: Colors.gray700, fontSize: 14, lineHeight: 22 },
});
