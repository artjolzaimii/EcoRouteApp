import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Animated,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { applyReferralCode } from '@/lib/api';
import { AuthHeader } from '@/components/AuthHeader';

const CREAM = '#F1EFE8';
const GREEN = Colors.emerald600;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const navigation = useNavigation();

  const [fullName,         setFullName]         = useState('');
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [referralCode,     setReferralCode]     = useState('');
  const [showPassword,     setShowPassword]     = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [loading,          setLoading]          = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, fullName.trim());

      const trimmedCode = referralCode.trim().toUpperCase();
      if (trimmedCode) {
        applyReferralCode(trimmedCode).catch(() => {});
      }

      if (result.needsEmailVerification) {
        router.push({ pathname: '/email-verification', params: { email: result.email } });
      } else {
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: '(tabs)' }] }));
      }
    } catch (err: any) {
      Alert.alert('Sign up failed', err.message ?? 'An error occurred. Please try again.');
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

      {/* ── Decorative background leaves ── */}
      <View style={styles.leafTL} pointerEvents="none">
        <Ionicons name="leaf" size={210} color="rgba(5,150,105,0.045)" />
      </View>
      <View style={styles.leafBR} pointerEvents="none">
        <Ionicons name="leaf" size={150} color="rgba(5,150,105,0.035)" />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Brand header ── */}
          <AuthHeader tagline="Start earning rewards for greener trips" />

          {/* ── Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create your account</Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={17} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={Colors.gray400}
                  autoCapitalize="words"
                  returnKeyType="next"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={17} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={17} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 40 }]}
                  placeholder="password"
                  placeholderTextColor={Colors.gray400}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
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
                  onSubmitEditing={handleSignUp}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Referral Code — optional */}
            <View style={[styles.inputGroup, { marginBottom: 18 }]}>
              <View style={styles.inputWrap}>
                <Ionicons name="gift-outline" size={17} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Referral code (optional)"
                  placeholderTextColor={Colors.gray400}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  value={referralCode}
                  onChangeText={setReferralCode}
                />
              </View>
            </View>

            {/* Sign Up */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSignUp}
              activeOpacity={0.88}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.primaryBtnText}>Create Account</Text>
              }
            </TouchableOpacity>

            {/* Switch */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/log-in')}>
                <Text style={styles.switchLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: CREAM },
  scroll: { paddingHorizontal: 24 },

  // Decorative
  leafTL: { position: 'absolute', top: -40, left: -50, transform: [{ rotate: '25deg' }] },
  leafBR: { position: 'absolute', bottom: 60, right: -40, transform: [{ rotate: '-20deg' }] },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 22,
    ...Shadow.lg,
  },
  cardTitle: {
    fontSize: 20, fontWeight: '700', color: '#111',
    textAlign: 'center', marginBottom: 20,
  },

  // Inputs
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

  // Primary button
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 18,
    ...Shadow.md,
  },
  primaryBtnDisabled: { opacity: 0.65 },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { color: Colors.gray500, fontSize: 14 },
  switchLink: { color: GREEN, fontWeight: '700', fontSize: 14 },
});
