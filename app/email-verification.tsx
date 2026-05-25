import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

const CREAM = '#F1EFE8';
const GREEN = Colors.emerald600;

export default function EmailVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { resendVerificationEmail } = useAuth();
  const [resending, setResending] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;
  const iconScale = useRef(new Animated.Value(0.7)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  const displayEmail = typeof email === 'string' && email.length > 0 ? email : 'your email';

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(iconScale,   { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleResend = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Go back to sign up and enter your email again.');
      return;
    }
    setResending(true);
    try {
      await resendVerificationEmail(email);
      Alert.alert('Email sent', 'Check your inbox for a new verification link.');
    } catch (err: any) {
      Alert.alert('Resend failed', err.message ?? 'Could not resend the verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Decorative leaf */}
      <View style={styles.leafTL} pointerEvents="none">
        <Ionicons name="leaf" size={180} color="rgba(5,150,105,0.045)" />
      </View>

      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center', width: '100%' }}>

          {/* Animated mail icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }], opacity: iconOpacity }]}>
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Ionicons name="mail" size={30} color={Colors.white} />
              </View>
            </View>
          </Animated.View>

          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a verification link to{'\n'}
            <Text style={styles.emailText}>{displayEmail}</Text>
          </Text>

          {/* Actions card */}
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.resendBtn, resending && styles.resendBtnDisabled]}
              onPress={handleResend}
              disabled={resending}
              activeOpacity={0.88}
            >
              {resending
                ? <ActivityIndicator color={GREEN} />
                : <Text style={styles.resendBtnText}>Resend email</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => router.push('/sign-up')}
              activeOpacity={0.7}
            >
              <Text style={styles.changeBtnText}>Change email address</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/log-in')} activeOpacity={0.7}>
            <Text style={styles.backLinkText}>Back to log in</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: CREAM },
  leafTL:  { position: 'absolute', top: -40, left: -50, transform: [{ rotate: '25deg' }] },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  iconWrap:  { marginBottom: 28 },
  iconOuter: {
    width: 88, height: 88,
    backgroundColor: Colors.emerald50,
    borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  iconInner: {
    width: 58, height: 58,
    backgroundColor: GREEN,
    borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
  },

  title:     { fontSize: 24, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 12 },
  subtitle:  { fontSize: 16, color: Colors.gray500, textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  emailText: { color: '#111', fontWeight: '600' },

  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    gap: 10,
    ...Shadow.lg,
    marginBottom: 20,
  },
  resendBtn: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GREEN,
  },
  resendBtnDisabled: { opacity: 0.65 },
  resendBtnText:     { color: GREEN, fontWeight: '700', fontSize: 15 },
  changeBtn:         { alignItems: 'center', paddingVertical: 8 },
  changeBtnText:     { color: Colors.gray500, fontWeight: '600', fontSize: 14 },

  backLink:     { alignItems: 'center', paddingVertical: 4 },
  backLinkText: { color: GREEN, fontWeight: '600', fontSize: 14 },
});
