import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Colors, Shadow } from '@/constants/theme';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

export default function NotificationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const circleScale = useRef(new Animated.Value(0.8)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(20)).current;
  const btnsOpacity = useRef(new Animated.Value(0)).current;
  const btnsSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.spring(circleScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(circleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(subtitleSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(btnsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const enableNotifications = async () => {
    try {
      await Notifications.requestPermissionsAsync();
    } catch {
      // Permission request failed or not supported on this platform — proceed anyway
    }
    router.push('/sign-up');
  };

  const goToSignUp = () => router.push('/sign-up');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Content */}
      <View style={styles.content}>
        <Animated.View style={[styles.outerCircle, { transform: [{ scale: circleScale }], opacity: circleOpacity }]}>
          <View style={styles.innerCircle}>
            <Ionicons name="notifications-outline" size={80} color={ECO_GREEN} />
          </View>
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleSlide }] }]}>
          Stay on your green streak
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity, transform: [{ translateY: subtitleSlide }] }]}>
          Get notified about badge unlocks, Green Points earned, and weekly impact summaries.
        </Animated.Text>
      </View>

      {/* Buttons */}
      <Animated.View style={[styles.btnsWrap, { opacity: btnsOpacity, transform: [{ translateY: btnsSlide }], paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={enableNotifications} activeOpacity={0.9}>
          <Text style={styles.primaryBtnText}>Enable Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={goToSignUp} activeOpacity={0.7}>
          <Text style={styles.skipBtnText}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  outerCircle: {
    width: 192,
    height: 192,
    backgroundColor: Colors.white,
    borderRadius: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    ...Shadow.lg,
  },
  innerCircle: {
    width: 128,
    height: 128,
    backgroundColor: Colors.emerald50,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#1A1A1A', fontSize: 28, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  subtitle: {
    color: Colors.gray600,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 320,
  },
  btnsWrap: { paddingHorizontal: 24, gap: 8 },
  primaryBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.lg,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { color: Colors.gray600, fontWeight: '600', fontSize: 16 },
});
