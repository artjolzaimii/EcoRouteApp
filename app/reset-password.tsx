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
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
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
          message: error.message,
          status: error.status,
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={40} color={ECO_GREEN} />
            </View>
          </View>

          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>Enter your new password below</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={Colors.gray400}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={Colors.gray400}
                secureTextEntry={!showConfirm}
                returnKeyType="done"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={handleReset}
                editable={!loading}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleReset}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToLoginBtn} onPress={() => router.replace('/log-in')}>
            <Text style={styles.backToLoginText}>Back to login</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  inner: { width: '100%' },
  iconWrap: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    backgroundColor: Colors.emerald50,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#1A1A1A', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtitle: { color: Colors.gray600, fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  fieldWrap: { marginBottom: 16 },
  label: { color: Colors.gray700, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    color: '#1A1A1A',
    fontSize: 15,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  submitBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    ...Shadow.md,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
  backToLoginBtn: { alignItems: 'center' },
  backToLoginText: { color: ECO_GREEN, fontWeight: '600', fontSize: 14 },
});
