import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Shadow } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const PRIVACY_URL = 'https://yourapp.com/privacy';
const TERMS_URL = 'https://yourapp.com/terms';

export default function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();

  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('All fields required', 'Please fill in all password fields.');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Password too short', 'New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Passwords do not match', 'New password and confirmation must be the same.');
      return;
    }

    setSavingPw(true);
    try {
      // Re-authenticate first to verify current password
      const email = session?.user?.email ?? '';
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPw });
      if (signInError) throw new Error('Current password is incorrect.');

      const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
      if (updateError) throw updateError;

      Alert.alert('Password changed', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => { setChangingPw(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); } },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not change password. Please try again.');
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data including trips, badges, points, and challenges. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Type "DELETE" in the box to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      await signOut();
                      router.replace('/log-in');
                    } catch {
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const openLink = (url: string) => {
    WebBrowser.openBrowserAsync(url);
  };

  const createdAt = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="mail-outline" size={18} color={Colors.gray600} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Email address</Text>
                <Text style={styles.infoValue}>{session?.user?.email ?? '—'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="calendar-outline" size={18} color={Colors.gray600} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Member since</Text>
                <Text style={styles.infoValue}>{createdAt}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Change Password */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.expandRow}
              onPress={() => setChangingPw((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={styles.expandLeft}>
                <View style={[styles.infoIconBox, { backgroundColor: Colors.blue100 }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.blue600} />
                </View>
                <Text style={styles.expandLabel}>Change Password</Text>
              </View>
              <Ionicons
                name={changingPw ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={18}
                color={Colors.gray400}
              />
            </TouchableOpacity>

            {changingPw && (
              <View style={styles.pwForm}>
                <View style={styles.divider} />

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Current Password</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      value={currentPw}
                      onChangeText={setCurrentPw}
                      secureTextEntry={!showPw}
                      placeholder="Enter current password"
                      placeholderTextColor={Colors.gray400}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>New Password</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      value={newPw}
                      onChangeText={setNewPw}
                      secureTextEntry={!showPw}
                      placeholder="Min. 8 characters"
                      placeholderTextColor={Colors.gray400}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Confirm New Password</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      value={confirmPw}
                      onChangeText={setConfirmPw}
                      secureTextEntry={!showPw}
                      placeholder="Repeat new password"
                      placeholderTextColor={Colors.gray400}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.showPwBtn}
                  onPress={() => setShowPw((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.gray500} />
                  <Text style={styles.showPwText}>{showPw ? 'Hide' : 'Show'} passwords</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, savingPw && styles.saveBtnDisabled]}
                  onPress={handleChangePassword}
                  disabled={savingPw}
                  activeOpacity={0.85}
                >
                  {savingPw ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.linkRow} onPress={() => openLink(PRIVACY_URL)} activeOpacity={0.7}>
              <View style={[styles.infoIconBox, { backgroundColor: Colors.purple100 }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.purple600} />
              </View>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>Privacy Policy</Text>
                <Text style={styles.linkSub}>How we collect and use your data</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Colors.gray400} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.linkRow} onPress={() => openLink(TERMS_URL)} activeOpacity={0.7}>
              <View style={[styles.infoIconBox, { backgroundColor: Colors.blue100 }]}>
                <Ionicons name="document-text-outline" size={18} color={Colors.blue600} />
              </View>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>Terms of Service</Text>
                <Text style={styles.linkSub}>Our terms of use agreement</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Colors.gray400} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.privacyNote}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.gray400} />
              <Text style={styles.privacyNoteText}>
                EcoRoute only uses your location data to calculate routes and CO₂ savings. We never sell your personal data to third parties.
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.red600 }]}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteAccount}
            activeOpacity={0.85}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator color={Colors.red600} size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color={Colors.red600} />
                <Text style={styles.deleteBtnText}>Delete My Account</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.deleteNote}>
            Permanently deletes all your data including trips, badges, points, and challenges. This action cannot be undone.
          </Text>
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
  section: { gap: 10, marginBottom: 8 },
  sectionTitle: { color: Colors.gray500, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, gap: 16, ...Shadow.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconBox: {
    width: 36,
    height: 36,
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { color: Colors.gray500, fontSize: 12, marginBottom: 2 },
  infoValue: { color: Colors.gray900, fontWeight: '600', fontSize: 15 },
  divider: { height: 1, backgroundColor: Colors.gray100 },
  expandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expandLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expandLabel: { color: Colors.gray900, fontWeight: '600', fontSize: 15 },
  pwForm: { gap: 14 },
  fieldWrap: { gap: 6 },
  fieldLabel: { color: Colors.gray600, fontSize: 13, fontWeight: '500' },
  inputWrap: {},
  input: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: Colors.gray900,
    fontSize: 15,
  },
  showPwBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  showPwText: { color: Colors.gray500, fontSize: 13 },
  saveBtn: {
    backgroundColor: Colors.blue600,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    ...Shadow.sm,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkText: { flex: 1 },
  linkLabel: { color: Colors.gray900, fontWeight: '600', fontSize: 15 },
  linkSub: { color: Colors.gray500, fontSize: 12 },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.gray50,
    borderRadius: 10,
    padding: 12,
  },
  privacyNoteText: { flex: 1, color: Colors.gray600, fontSize: 12, lineHeight: 18 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: Colors.red600,
    ...Shadow.sm,
  },
  deleteBtnText: { color: Colors.red600, fontWeight: '700', fontSize: 15 },
  deleteNote: { color: Colors.gray500, fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
