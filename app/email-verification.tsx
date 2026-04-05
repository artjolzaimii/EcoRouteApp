import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;
const EMAIL = 'you@example.com';

export default function EmailVerificationScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }], opacity: iconOpacity }]}>
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Ionicons name="mail" size={36} color={Colors.white} />
              </View>
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Check your email</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            We sent a verification link to{'\n'}
            <Text style={styles.email}>{EMAIL}</Text>
          </Text>

          {/* Actions */}
          <View style={styles.actionsWrap}>
            <TouchableOpacity style={styles.resendBtn} activeOpacity={0.9}>
              <Text style={styles.resendBtnText}>Resend email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.changeBtn} onPress={() => router.push('/sign-up')} activeOpacity={0.7}>
              <Text style={styles.changeBtnText}>Change email</Text>
            </TouchableOpacity>
          </View>

          {/* Continue */}
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.continueBtnText}>Continue to app →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  inner: { width: '100%', alignItems: 'center' },
  iconWrap: { marginBottom: 32 },
  iconOuter: {
    width: 96,
    height: 96,
    backgroundColor: Colors.emerald50,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 64,
    height: 64,
    backgroundColor: ECO_GREEN,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#1A1A1A', fontSize: 28, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  subtitle: { color: Colors.gray600, fontSize: 17, lineHeight: 26, textAlign: 'center', marginBottom: 32 },
  email: { color: '#1A1A1A', fontWeight: '600' },
  actionsWrap: { width: '100%', gap: 8, marginBottom: 32 },
  resendBtn: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ECO_GREEN,
    ...Shadow.sm,
  },
  resendBtnText: { color: ECO_GREEN, fontWeight: '700', fontSize: 17 },
  changeBtn: { alignItems: 'center', paddingVertical: 8 },
  changeBtnText: { color: Colors.gray600, fontWeight: '600', fontSize: 16 },
  continueBtn: { alignItems: 'center' },
  continueBtnText: { color: ECO_GREEN, fontWeight: '600', fontSize: 14 },
});
