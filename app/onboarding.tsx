import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const cards: { icon: IoniconName; title: string; subtitle: string }[] = [
  {
    icon: 'map-outline',
    title: 'The greenest route',
    subtitle: 'Walk, cycle, bus and scooter combined into one smart journey',
  },
  {
    icon: 'leaf-outline',
    title: 'Track your impact',
    subtitle: 'See exactly how much CO₂ you save every trip',
  },
  {
    icon: 'gift-outline',
    title: 'Earn real rewards',
    subtitle: 'Green Points unlock discounts at local eco businesses',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const dotWidth0 = useRef(new Animated.Value(32)).current;
  const dotWidth1 = useRef(new Animated.Value(8)).current;
  const dotWidth2 = useRef(new Animated.Value(8)).current;

  const dotWidths = [dotWidth0, dotWidth1, dotWidth2];

  const animateDots = (index: number) => {
    dotWidths.forEach((w, i) =>
      Animated.timing(w, { toValue: i === index ? 32 : 8, duration: 300, useNativeDriver: false }).start(),
    );
  };

  const goToNext = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(nextIndex);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
      animateDots(nextIndex);
    });
  };

  const handleNext = () => {
    if (current < cards.length - 1) {
      goToNext(current + 1);
    } else {
      router.push('/location-permission');
    }
  };

  const handleSkip = () => {
    router.push('/location-permission');
  };

  const card = cards[current];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Skip */}
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Card Content */}
      <View style={styles.cardSection}>
        <Animated.View style={{ opacity: opacityAnim, transform: [{ translateX: slideAnim }], alignItems: 'center' }}>
          {/* Illustration Circle */}
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Ionicons name={card.icon} size={80} color={ECO_GREEN} />
            </View>
          </View>

          <Text style={styles.title}>{card.title}</Text>
          <Text style={styles.subtitle}>{card.subtitle}</Text>
        </Animated.View>
      </View>

      {/* Pagination Dots */}
      <View style={styles.dotsRow}>
        {cards.map((_, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { width: dotWidths[i], backgroundColor: i === current ? ECO_GREEN : Colors.gray300 }]}
          />
        ))}
      </View>

      {/* Next / Get Started Button */}
      <View style={[styles.btnWrap, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9}>
          <Text style={styles.nextBtnText}>{current === cards.length - 1 ? 'Get Started' : 'Next'}</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  skipRow: { paddingHorizontal: 24, paddingVertical: 16, alignItems: 'flex-end' },
  skipText: { color: Colors.emerald600, fontWeight: '600', fontSize: 16 },
  cardSection: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  outerCircle: {
    width: 192,
    height: 192,
    backgroundColor: Colors.white,
    borderRadius: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
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
  subtitle: { color: Colors.gray600, fontSize: 17, lineHeight: 26, textAlign: 'center', maxWidth: 320 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4 },
  btnWrap: { paddingHorizontal: 24 },
  nextBtn: {
    backgroundColor: ECO_GREEN,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.lg,
  },
  nextBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
});
