import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';

const features = [
  {
    icon: 'location-outline' as const,
    title: 'Smart Routes',
    description: 'Find the most eco-friendly paths',
  },
  {
    icon: 'leaf-outline' as const,
    title: 'Track Impact',
    description: 'See your carbon savings in real-time',
  },
  {
    icon: 'trending-up-outline' as const,
    title: 'Earn Rewards',
    description: 'Get rewarded for sustainable choices',
  },
];

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(featuresOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(900),
        Animated.parallel([
          Animated.timing(ctaOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(ctaSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={[Colors.emerald600, Colors.emerald800]} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {/* Logo + Title */}
        <Animated.View
          style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Animated.View style={[styles.logoBox, { transform: [{ scale: logoScale }] }]}>
            <Ionicons name="leaf" size={56} color={Colors.emerald600} />
          </Animated.View>
          <Text style={styles.title}>EcoRoute</Text>
          <Text style={styles.subtitle}>Navigate sustainably. Impact positively.</Text>
        </Animated.View>

        {/* Feature list */}
        <Animated.View style={[styles.featureList, { opacity: featuresOpacity }]}>
          {features.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Ionicons name={f.icon} size={24} color={Colors.white} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.description}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View style={{ opacity: ctaOpacity, transform: [{ translateY: ctaSlide }] }}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: Platform.OS === 'ios' ? 48 : 40,
    justifyContent: 'space-between',
  },
  logoSection: { alignItems: 'center' },
  logoBox: {
    width: 96,
    height: 96,
    backgroundColor: Colors.white,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.emeraldText100,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 24,
  },
  featureList: { gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  featureIconBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: { flex: 1 },
  featureTitle: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  featureDesc: { color: Colors.emeraldText100, fontSize: 13, lineHeight: 18 },
  ctaButton: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: { color: Colors.emerald700, fontWeight: '700', fontSize: 17 },
});
