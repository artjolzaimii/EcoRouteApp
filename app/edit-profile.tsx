import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Switch,
  Animated,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

type NotifKey = 'weeklySummary' | 'badgeAlerts' | 'streakReminders' | 'ecoPartnerNearby';

type NotifConfig = { key: NotifKey; title: string; subtitle: string };

const notifConfig: NotifConfig[] = [
  { key: 'weeklySummary', title: 'Weekly summary', subtitle: 'Your eco impact recap every week' },
  { key: 'badgeAlerts', title: 'Badge alerts', subtitle: 'Get notified when you earn badges' },
  { key: 'streakReminders', title: 'Streak reminders', subtitle: 'Daily reminders to keep your streak alive' },
  { key: 'ecoPartnerNearby', title: 'Eco-Partner nearby alerts', subtitle: 'Offers from eco businesses on your route' },
];

type ProfileData = { fullName: string; email: string };

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [notifications, setNotifications] = useState<Record<NotifKey, boolean>>({
    weeklySummary: true,
    badgeAlerts: true,
    streakReminders: false,
    ecoPartnerNearby: true,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    api.get<ProfileData>('/api/user/profile')
      .then((data) => {
        setFullName(data.fullName ?? '');
        setEmail(data.email ?? session?.user?.email ?? '');
      })
      .catch(() => {
        setEmail(session?.user?.email ?? '');
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  const toggleNotif = (key: NotifKey, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/api/user/profile', { fullName: fullName.trim() });
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Save failed', err.message ?? 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <LinearGradient colors={[Colors.emerald400, Colors.emerald600]} style={styles.avatar}>
              {loadingProfile ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </LinearGradient>
            <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.9}>
              <Ionicons name="camera-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={email}
                editable={false}
              />
              <Text style={styles.fieldNote}>Email cannot be changed</Text>
            </View>
          </View>

          {/* Notification Preferences */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notification Preferences</Text>
            {notifConfig.map((item, i) => (
              <View key={item.key}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.notifRow}>
                  <View style={styles.notifText}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Switch
                    value={notifications[item.key]}
                    onValueChange={(val) => toggleNotif(item.key, val)}
                    trackColor={{ false: Colors.gray300, true: ECO_GREEN }}
                    thumbColor={Colors.white}
                  />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.9}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: { color: '#1A1A1A', fontSize: 24, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, gap: 20 },
  inner: { gap: 20 },
  avatarWrap: { alignItems: 'center', position: 'relative' },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  avatarInitials: { color: Colors.white, fontSize: 36, fontWeight: '700' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 40,
    height: 40,
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: CREAM,
    ...Shadow.md,
  },
  card: { backgroundColor: Colors.white, borderRadius: 28, padding: 24, gap: 16, ...Shadow.md },
  cardTitle: { color: '#1A1A1A', fontSize: 17, fontWeight: '700' },
  fieldWrap: { gap: 8 },
  label: { color: Colors.gray700, fontSize: 14, fontWeight: '500' },
  input: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    color: '#1A1A1A',
    fontSize: 15,
  },
  inputDisabled: { backgroundColor: Colors.gray100, color: Colors.gray500 },
  fieldNote: { color: Colors.gray500, fontSize: 12 },
  divider: { height: 1, backgroundColor: Colors.gray100 },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  notifText: { flex: 1, marginRight: 12 },
  notifTitle: { color: '#1A1A1A', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  notifSubtitle: { color: Colors.gray600, fontSize: 13 },
  footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: CREAM },
  saveBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.md,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
