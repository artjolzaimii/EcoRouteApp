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
import { AuthHeader } from '@/components/AuthHeader';

const CREAM = '#F1EFE8';
const GREEN = Colors.emerald600;

export default function LogInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const navigation = useNavigation();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: '(tabs)' }] }));
    } catch (err: any) {
      Alert.alert('Login failed', err.message ?? 'Please check your credentials and try again.');
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
          { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Brand header ── */}
          <AuthHeader tagline="Continue your green journey" />

          {/* ── Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>

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
                  returnKeyType="done"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogIn}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotRow} onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign in */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleLogIn}
              activeOpacity={0.88}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.primaryBtnText}>Sign In</Text>
              }
            </TouchableOpacity>

            {/* Switch */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/sign-up')}>
                <Text style={styles.switchLink}>Sign Up</Text>
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
  scroll: { paddingHorizontal: 24, flexGrow: 1, justifyContent: 'center' },

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
  inputGroup: { marginBottom: 14 },
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

  // Forgot
  forgotRow: { alignItems: 'flex-end', marginTop: 8 },
  forgotText: { color: GREEN, fontSize: 13, fontWeight: '600' },

  // Primary button
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
    ...Shadow.md,
  },
  primaryBtnDisabled: { opacity: 0.65 },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { color: Colors.gray500, fontSize: 14 },
  switchLink: { color: GREEN, fontWeight: '700', fontSize: 14 },
});
