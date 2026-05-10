import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
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
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const navigation = useNavigation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Ionicons name="leaf" size={40} color={Colors.white} />
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create your account</Text>

          {/* Full Name */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor={Colors.gray400}
              autoCapitalize="words"
              returnKeyType="next"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={Colors.gray400}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
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
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSignUp}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </Svg>
            <Text style={styles.socialBtnText}>Sign up with Google</Text>
          </TouchableOpacity>

          {/* Apple */}
          <TouchableOpacity style={styles.appleBtn} activeOpacity={0.85}>
            <Ionicons name="logo-apple" size={20} color={Colors.white} />
            <Text style={styles.appleBtnText}>Sign up with Apple</Text>
          </TouchableOpacity>

          {/* Log In Link */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/log-in')}>
              <Text style={styles.switchLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scrollContent: { paddingHorizontal: 24 },
  inner: { width: '100%' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { backgroundColor: Colors.white, borderRadius: 28, padding: 24, ...Shadow.lg },
  cardTitle: { color: '#1A1A1A', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  fieldWrap: { marginBottom: 16 },
  label: { color: Colors.gray700, fontSize: 14, fontWeight: '500', marginBottom: 8 },
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
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  primaryBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...Shadow.md,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray200 },
  dividerText: { color: Colors.gray500, fontSize: 14 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.gray200,
    paddingVertical: 14,
    marginBottom: 12,
  },
  socialBtnText: { color: Colors.gray700, fontWeight: '600', fontSize: 15 },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    backgroundColor: '#111827',
    paddingVertical: 14,
    marginBottom: 20,
  },
  appleBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { color: Colors.gray600, fontSize: 14 },
  switchLink: { color: ECO_GREEN, fontWeight: '600', fontSize: 14 },
});
