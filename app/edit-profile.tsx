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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { api, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase'; // still needed for auth token

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

const NOTIF_PREFS_KEY = 'ecoroute_notif_prefs';
const DEFAULT_NOTIF_PREFS: Record<NotifKey, boolean> = {
  weeklySummary: true,
  badgeAlerts: true,
  streakReminders: false,
  ecoPartnerNearby: true,
};

type ProfileData = { fullName: string; email: string; avatarUrl?: string | null };

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [notifications, setNotifications] = useState<Record<NotifKey, boolean>>(DEFAULT_NOTIF_PREFS);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    api.get<ProfileData>('/api/user/profile')
      .then((data) => {
        setFullName(data.fullName ?? '');
        setEmail(data.email ?? session?.user?.email ?? '');
        setAvatarUrl(data.avatarUrl ?? null);
      })
      .catch(() => {
        setEmail(session?.user?.email ?? '');
      })
      .finally(() => setLoadingProfile(false));

    AsyncStorage.getItem(NOTIF_PREFS_KEY)
      .then((raw) => {
        if (raw) setNotifications({ ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) });
      })
      .catch(() => {});
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setAvatarUploading(true);
    try {
      // Resolve MIME type from the URI extension
      const rawExt = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      // Build multipart form — send to our backend so it uploads via service-role
      // key and bypasses Supabase RLS on the avatars bucket.
      const form = new FormData();
      form.append('avatar', { uri, name: `avatar.${ext}`, type: mimeType } as any);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${API_BASE_URL}/api/user/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');

      setAvatarUrl(json.data.avatarUrl);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Could not upload photo. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const toggleNotif = (key: NotifKey, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated)).catch(() => {});
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
    : (email ? email[0].toUpperCase() : '?');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

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
            {loadingProfile || avatarUploading ? (
              <View style={[styles.avatarCircle, styles.avatarLoading]}>
                <ActivityIndicator color={Colors.white} size="large" />
              </View>
            ) : avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarCircle}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <LinearGradient colors={[Colors.emerald400, Colors.emerald600]} style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
            )}

            <TouchableOpacity
              style={styles.cameraBtn}
              activeOpacity={0.9}
              onPress={pickImage}
              disabled={avatarUploading}
            >
              <Ionicons name="camera-outline" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.avatarHint}>Tap the camera icon to change your photo</Text>

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
              <Text style={styles.fieldNote}>Email cannot be changed here</Text>
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
  avatarWrap: { alignItems: 'center', position: 'relative', marginBottom: 4 },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  avatarLoading: { backgroundColor: Colors.emerald600 },
  avatarInitials: { color: Colors.white, fontSize: 36, fontWeight: '700' },
  avatarHint: { textAlign: 'center', color: Colors.gray500, fontSize: 12, marginBottom: 8 },
  cameraBtn: {
    position: 'absolute',
    bottom: 4,
    right: '34%',
    width: 36,
    height: 36,
    backgroundColor: ECO_GREEN,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
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
