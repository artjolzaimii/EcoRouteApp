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

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in both password fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.warn('[auth/reset-password] updateUser failed', {
          message: error.message, status: error.status,
        });
        Alert.alert('Failed to reset password', error.message);
        return;
      }
      console.log('[auth/reset-password] password updated successfully');
      Alert.alert('Password updated', 'Your password has been reset. Please log in.', [
        { text: 'OK', onPress: () => router.replace('/log-in') },
      ]);
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

      {/* Decorative leaf */}
      <View style={styles.leafTL} pointerEvents="none">
        <Ionicons name="leaf" size={180} color="rgba(5,150,105,0.045)" />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Ionicons name="lock-closed-outline" size={28} color={Colors.white} />
              </View>
            </View>
          </View>

          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>Enter your new password below.</Text>

          {/* Card */}
          <View style={styles.card}>
            {/* New password */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={17} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 40 }]}
                  placeholder="new password"
                  placeholderTextColor={Colors.gray400}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm password */}
            <View style={[styles.inputGroup, { marginBottom: 20 }]}>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={17} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 40 }]}
                  placeholder="confirm password"
                  placeholderTextColor={Colors.gray400}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onSubmitEditing={handleReset}
                  editable={!loading}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleReset}
              activeOpacity={0.88}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.primaryBtnText}>Update Password</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/log-in')}>
            <Text style={styles.backToLoginText}>Back to login</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: CREAM },
  leafTL: { position: 'absolute', top: -40, left: -50, transform: [{ rotate: '25deg' }] },
  scroll: { paddingHorizontal: 24 },

  iconWrap:  { alignItems: 'center', marginBottom: 24 },
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

  title:    { fontSize: 24, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.gray500, textAlign: 'center', marginBottom: 28 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    ...Shadow.lg,
    marginBottom: 20,
  },
  inputGroup: { marginBottom: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 9,
  },
  inputIcon: { marginRight: 10 },
  input:     { flex: 1, fontSize: 15, color: '#111' },
  eyeBtn:    { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },

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
