import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={20} color={ECO_GREEN} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={40} color={ECO_GREEN} />
            </View>
          </View>

          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>Enter your email and we will send you a reset link</Text>

          {/* Email Field */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={() => router.push('/log-in')} activeOpacity={0.9}>
            <Text style={styles.submitBtnText}>Send Reset Link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToLoginBtn} onPress={() => router.push('/log-in')}>
            <Text style={styles.backToLoginText}>Back to login</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { color: ECO_GREEN, fontWeight: '600', fontSize: 16 },
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
  fieldWrap: { marginBottom: 24 },
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
  submitBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    ...Shadow.md,
  },
  submitBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
  backToLoginBtn: { alignItems: 'center' },
  backToLoginText: { color: ECO_GREEN, fontWeight: '600', fontSize: 14 },
});
