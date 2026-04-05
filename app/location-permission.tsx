import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

export default function LocationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const circleScale = useRef(new Animated.Value(0.8)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(20)).current;
  const noteOpacity = useRef(new Animated.Value(0)).current;
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
      Animated.timing(noteOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(btnsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(btnsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon Illustration */}
        <Animated.View style={[styles.outerCircle, { transform: [{ scale: circleScale }], opacity: circleOpacity }]}>
          <View style={styles.innerCircle}>
            <Ionicons name="location-outline" size={80} color={ECO_GREEN} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleSlide }] }]}>
          Allow location access
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity, transform: [{ translateY: subtitleSlide }] }]}>
          EcoRoute needs your location to find green routes near you. We never share your location with third parties.
        </Animated.Text>

        {/* Privacy Note */}
        <Animated.View style={[styles.privacyBox, { opacity: noteOpacity }]}>
          <Text style={styles.privacyText}>🔒 Your privacy is our priority</Text>
        </Animated.View>
      </View>

      {/* Buttons */}
      <Animated.View style={[styles.btnsWrap, { opacity: btnsOpacity, transform: [{ translateY: btnsSlide }], paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/notification-permission')}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>Allow Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/sign-up')}
          activeOpacity={0.9}
        >
          <Text style={styles.secondaryBtnText}>Maybe Later</Text>
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
    marginBottom: 24,
  },
  privacyBox: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.emerald100,
  },
  privacyText: { color: Colors.gray600, fontSize: 14, textAlign: 'center' },
  btnsWrap: { paddingHorizontal: 24, gap: 12 },
  primaryBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.lg,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
  secondaryBtn: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ECO_GREEN,
  },
  secondaryBtnText: { color: ECO_GREEN, fontWeight: '700', fontSize: 17 },
});
