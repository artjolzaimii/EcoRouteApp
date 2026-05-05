import { Colors, Shadow } from '@/constants/theme';
import { usePreferences } from '@/context/PreferencesContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Unit = 'km' | 'miles';
type TransportMode = 'walk' | 'bike' | 'bus' | 'train';
type Appearance = 'light' | 'dark' | 'system';

export default function PreferencesScreen() {
    const insets = useSafeAreaInsets();
    const { prefs, setPrefs, theme } = usePreferences();

    const [unit, setUnit] = useState<Unit>(prefs.unit);
    const [defaultMode, setDefaultMode] = useState<TransportMode>(prefs.defaultMode);
    const [appearance, setAppearance] = useState<Appearance>(prefs.appearance);

    const { toggleNotifications } = usePreferences();

    useEffect(() => {
        setUnit(prefs.unit);
        setDefaultMode(prefs.defaultMode);
        setAppearance(prefs.appearance);
    }, [prefs]);

    const handleSave = async () => {
        await setPrefs({ unit, defaultMode, appearance });
        Alert.alert('Preferences Saved', 'Your preferences have been updated.', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    };

    const appearanceOptions: { label: string; value: Appearance }[] = [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'System', value: 'system' },
    ];

    const modeOptions: { label: string; value: TransportMode; icon: any }[] = [
        { label: 'Walk', value: 'walk', icon: 'walk-outline' },
        { label: 'Bike', value: 'bike', icon: 'bicycle-outline' },
        { label: 'Bus', value: 'bus', icon: 'bus-outline' },
        { label: 'Train', value: 'train', icon: 'train-outline' },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
            <StatusBar style={prefs.appearance === 'dark' ? 'light' : 'dark'} />

            <View style={styles.header}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()} activeOpacity={0.9}>
                    <Ionicons name="arrow-back-outline" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Preferences</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={sectionStyles.section}>
                    <Text style={[sectionStyles.sectionLabel, { color: theme.textSecondary }]}>DISTANCE UNITS</Text>
                    <View style={[sectionStyles.card, { backgroundColor: theme.card, padding: 6 }]}>
                        <View style={styles.pillRow}>
                            <TouchableOpacity
                                style={[styles.pill, unit === 'km' && { backgroundColor: theme.primary }]}
                                onPress={() => setUnit('km')}
                            >
                                <Text style={[styles.pillText, unit === 'km' && { color: Colors.white }]}>Kilometers (km)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pill, unit === 'miles' && { backgroundColor: theme.primary }]}
                                onPress={() => setUnit('miles')}
                            >
                                <Text style={[styles.pillText, unit === 'miles' && { color: Colors.white }]}>Miles (mi)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={sectionStyles.section}>
                    <Text style={[sectionStyles.sectionLabel, { color: theme.textSecondary }]}>DEFAULT TRANSPORT MODE</Text>
                    <View style={[sectionStyles.card, { backgroundColor: theme.card, padding: 12 }]}>
                        <View style={styles.modeGrid}>
                            {modeOptions.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.modeItem, defaultMode === opt.value && { borderColor: theme.primary, backgroundColor: theme.background }]}
                                    onPress={() => setDefaultMode(opt.value)}
                                >
                                    <Ionicons name={opt.icon} size={24} color={defaultMode === opt.value ? theme.primary : theme.textSecondary} />
                                    <Text style={[styles.modeLabel, { color: theme.text }]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={sectionStyles.section}>
                    <Text style={[sectionStyles.sectionLabel, { color: theme.textSecondary }]}>NOTIFICATIONS</Text>
                    <View style={[sectionStyles.card, { backgroundColor: theme.card, padding: 16 }]}>
                        <View style={sectionStyles.itemRow}>
                            <View style={sectionStyles.itemIconBox}>
                                <Ionicons name="notifications-outline" size={22} color={theme.primary} />
                            </View>
                            <View style={sectionStyles.itemText}>
                                <Text style={[sectionStyles.itemTitle, { color: theme.text }]}>Enable Notifications</Text>
                                <Text style={[sectionStyles.itemSubtitle, { color: theme.textSecondary }]}>Recieve alerts, badges & eco-tips</Text>
                            </View>
                            <TouchableOpacity
                                style={[sectionStyles.toggleBase, prefs.notificationsEnabled ? { backgroundColor: theme.primary } : { borderWidth: 1, borderColor: theme.gray300 }]}
                                onPress={toggleNotifications}
                                activeOpacity={0.8}
                            >
                                <View style={[sectionStyles.toggleHandle, prefs.notificationsEnabled ? { alignSelf: 'flex-end', backgroundColor: Colors.white } : { alignSelf: 'flex-start', backgroundColor: theme.gray300 }]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={sectionStyles.section}>
                    <Text style={[sectionStyles.sectionLabel, { color: theme.textSecondary }]}>APPEARANCE</Text>
                    <View style={[sectionStyles.card, { backgroundColor: theme.card, padding: 6 }]}>
                        <View style={styles.pillRow}>
                            {appearanceOptions.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.pill, appearance === opt.value && { backgroundColor: theme.primary }]}
                                    onPress={() => setAppearance(opt.value)}
                                >
                                    <Text style={[styles.pillText, appearance === opt.value && { color: Colors.white }]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: theme.background }]}>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave} activeOpacity={0.9}>
                    <Text style={styles.saveBtnText}>Save Preferences</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const sectionStyles = StyleSheet.create({
    section: { gap: 12, marginBottom: 24 },
    sectionLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, marginLeft: 4 },
    card: { borderRadius: 24, padding: 16, ...Shadow.md },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    itemIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
    itemText: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: '600' },
    itemSubtitle: { fontSize: 13, marginTop: 2 },
    toggleBase: { width: 50, height: 28, borderRadius: 14, padding: 4, justifyContent: 'center' },
    toggleHandle: { width: 20, height: 20, borderRadius: 10 },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
    headerTitle: { fontSize: 24, fontWeight: '700' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 8, gap: 24 },
    section: { gap: 12 },
    sectionLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, marginLeft: 4 },
    card: { borderRadius: 24, ...Shadow.md, overflow: 'hidden' },
    pillRow: { flexDirection: 'row', padding: 6, gap: 4 },
    pill: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 18 },
    pillText: { fontSize: 14, fontWeight: '600', color: Colors.gray600 },
    modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    modeItem: { flex: 1, minWidth: '45%', paddingVertical: 16, alignItems: 'center', borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
    modeLabel: { fontSize: 14, fontWeight: '600', marginTop: 8 },
    footer: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    saveBtn: { borderRadius: 20, paddingVertical: 16, alignItems: 'center', ...Shadow.md },
    saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
