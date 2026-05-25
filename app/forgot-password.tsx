import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const CREAM = '#F1EFE8';
const GREEN = Colors.emerald600;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSendReset = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: 'ecorouteapp://reset-password',
      });
      if (error) {
        console.warn('[auth/forgot-password] resetPasswordForEmail failed', {
          email: trimmed, message: error.message, status: error.status,
        });
        Alert.alert('Failed to send reset link', error.message);
        return;
      }
      console.log('[auth/forgot-password] reset email sent', { email: trimmed });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {/* Decorative leaves */}
      <View style={styles.leafTL} pointerEvents="none">
        <Ionicons name="leaf" size={180} color="rgba(5,150,105,0.045)" />
      </View>

      {/* Back button */}
      <View style={[styles.backRow, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={18} color={GREEN} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Ionicons
                  name={sent ? 'checkmark-outline' : 'mail-outline'}
                  size={30}
                  color={Colors.white}
                />
              </View>
            </View>
          </View>

          {/* Text */}
          <Text style={styles.title}>
            {sent ? 'Check your inbox' : 'Reset password'}
          </Text>
          <Text style={styles.subtitle}>
            {sent
              ? `We sent a reset link to\n${email.trim()}\n\nOpen it to set a new password.`
              : "Enter your email and we'll send you a reset link."}
          </Text>

          {/* Form (only when not yet sent) */}
          {!sent && (
            <View style={styles.card}>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={17} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={handleSendReset}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleSendReset}
                activeOpacity={0.88}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/log-in')}>
            <Text style={styles.backToLoginText}>Back to login</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: CREAM },
  leafTL:  { position: 'absolute', top: -40, left: -50, transform: [{ rotate: '25deg' }] },
  backRow: { paddingHorizontal: 24, paddingBottom: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: GREEN, fontWeight: '600', fontSize: 15 },
  scroll:  { paddingHorizontal: 24 },

  // Icon
  iconWrap:  { alignItems: 'center', marginTop: 32, marginBottom: 24 },
  iconOuter: {
    width: 80, height: 80,
    backgroundColor: Colors.emerald50,
    borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  iconInner: {
    width: 52, height: 52,
    backgroundColor: GREEN,
    borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },

  title:    { fontSize: 24, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.gray500, textAlign: 'center', lineHeight: 22, marginBottom: 28 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    ...Shadow.lg,
    marginBottom: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 9,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input:     { flex: 1, fontSize: 15, color: '#111' },

  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    ...Shadow.md,
  },
  primaryBtnDisabled: { opacity: 0.65 },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  backToLogin:     { alignItems: 'center', paddingVertical: 8 },
  backToLoginText: { color: GREEN, fontWeight: '600', fontSize: 14 },
});
