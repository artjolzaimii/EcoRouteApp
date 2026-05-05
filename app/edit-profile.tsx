import { Colors, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { prefs, setPrefs, theme } = usePreferences();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [notifications, setNotifications] = useState<Record<NotifKey, boolean>>({
    weeklySummary: prefs.notificationsEnabled,
    badgeAlerts: prefs.notificationsEnabled,
    streakReminders: false,
    ecoPartnerNearby: prefs.notificationsEnabled,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    api.get<ProfileData>('/api/user/profile')
      .then((data) => {
        const name = data.fullName ?? prefs.fullName ?? '';
        setFullName(name);
        setEmail(data.email ?? session?.user?.email ?? '');
        if (data.fullName && data.fullName !== prefs.fullName) {
          setPrefs({ fullName: data.fullName });
        }
      })
      .catch(() => {
        setFullName(prefs.fullName ?? '');
        setEmail(session?.user?.email ?? '');
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  const toggleNotif = (key: NotifKey, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPrefs({ photoUri: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/api/user/profile', { fullName: fullName.trim() });
      setPrefs({ fullName: fullName.trim() });
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      // Fallback for demo if API fails
      setPrefs({ fullName: fullName.trim() });
      Alert.alert('Profile Updated', 'Local profile updated (API unavailable).');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  // Use theme colors
  const bgColor = theme.background;
  const cardColor = theme.card;
  const textColor = theme.text;
  const subtextColor = theme.textSecondary;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: bgColor }]}>
      <StatusBar style={prefs.appearance === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: cardColor }]} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
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
            <View style={styles.avatarShadow}>
              <LinearGradient colors={[Colors.emerald400, Colors.emerald600]} style={styles.avatar}>
                {loadingProfile ? (
                  <ActivityIndicator color={Colors.white} />
                ) : prefs.photoUri ? (
                  <Image source={{ uri: prefs.photoUri }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                )}
              </LinearGradient>
            </View>
            <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.9} onPress={pickImage}>
              <Ionicons name="camera-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
            {prefs.photoUri && (
              <TouchableOpacity
                style={[styles.removePhotoBtn, { backgroundColor: theme.red600 }]}
                activeOpacity={0.8}
                onPress={() => setPrefs({ photoUri: null })}
              >
                <Ionicons name="close-outline" size={16} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Info */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: subtextColor }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.gray50, color: textColor, borderColor: theme.gray200 }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={subtextColor}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: subtextColor }]}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled, { backgroundColor: theme.gray100, color: theme.gray500, borderColor: theme.gray200 }]}
                value={email}
                editable={false}
              />
              <Text style={[styles.fieldNote, { color: subtextColor }]}>Email cannot be changed</Text>
            </View>
          </View>

          {/* Notification Preferences */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Notification Preferences</Text>
            {notifConfig.map((item, i) => (
              <View key={item.key}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: theme.gray100 }]} />}
                <View style={styles.notifRow}>
                  <View style={styles.notifText}>
                    <Text style={[styles.notifTitle, { color: textColor }]}>{item.title}</Text>
                    <Text style={[styles.notifSubtitle, { color: subtextColor }]}>{item.subtitle}</Text>
                  </View>
                  <Switch
                    value={notifications[item.key]}
                    onValueChange={(val) => toggleNotif(item.key, val)}
                    trackColor={{ false: theme.gray300, true: theme.primary }}
                    thumbColor={Colors.white}
                  />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: bgColor }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled, { backgroundColor: theme.primary }]}
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
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
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
    overflow: 'hidden',
  },
  avatarShadow: {
    width: 128,
    height: 128,
    borderRadius: 64,
    ...Shadow.lg,
  },
  avatarImg: { width: 128, height: 128 },
  avatarInitials: { color: Colors.white, fontSize: 36, fontWeight: '700' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'transparent',
    ...Shadow.md,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 0,
    right: '35%',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadow.sm,
  },
  card: { borderRadius: 24, padding: 24, gap: 16, ...Shadow.md },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  fieldWrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
  },
  inputDisabled: { opacity: 0.8 },
  fieldNote: { fontSize: 12 },
  divider: { height: 1 },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  notifText: { flex: 1, marginRight: 12 },
  notifTitle: { fontWeight: '600', fontSize: 15, marginBottom: 2 },
  notifSubtitle: { fontSize: 13 },
  footer: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  saveBtn: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.md,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
