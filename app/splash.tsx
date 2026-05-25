import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import { BrandLogo } from '@/components/BrandLogo';

const DARK_GREEN = '#1A5C38';

export default function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(20)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  const dot0Scale = useRef(new Animated.Value(1)).current;
  const dot1Scale = useRef(new Animated.Value(1)).current;
  const dot2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const pulseDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(900 - delay),
        ]),
      );

    setTimeout(() => {
      pulseDot(dot0Scale, 0).start();
      pulseDot(dot1Scale, 200).start();
      pulseDot(dot2Scale, 400).start();
    }, 1400);

    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Logo */}
      <Animated.View style={[styles.logoBox, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <BrandLogo size={88} />
      </Animated.View>

      {/* Brand Name */}
      <Animated.Text style={[styles.brandName, { opacity: titleOpacity, transform: [{ translateY: titleSlide }] }]}>
        EcoRoute
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity, transform: [{ translateY: taglineSlide }] }]}>
        Navigate greener. Everywhere.
      </Animated.Text>

      {/* Loading Dots */}
      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        {[dot0Scale, dot1Scale, dot2Scale].map((anim, i) => (
          <Animated.View key={i} style={[styles.dot, { transform: [{ scale: anim }] }]} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoBox: {
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 32,
  },
  brandName: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
  },
  tagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    marginBottom: 96,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: 80,
  },
  dot: {
    width: 12,
    height: 12,
    backgroundColor: Colors.white,
    borderRadius: 6,
    opacity: 0.8,
  },
});
