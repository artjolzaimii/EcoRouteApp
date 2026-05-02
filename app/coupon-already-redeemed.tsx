import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

export default function CouponAlreadyRedeemedScreen() {
  const insets = useSafeAreaInsets();
  const { title, partnerName } = useLocalSearchParams<{ title?: string; partnerName?: string }>();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-done-outline" size={48} color={Colors.gray400} />
        </View>

        <Text style={styles.heading}>Coupon already redeemed</Text>

        {title && partnerName && (
          <Text style={styles.sub}>{title} · {partnerName}</Text>
        )}

        <Text style={styles.body}>
          This coupon has already been used and cannot be redeemed again.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/(tabs)/rewards')}
        activeOpacity={0.9}
      >
        <Text style={styles.btnText}>Back to My Rewards</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1EFE8',
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    backgroundColor: Colors.gray100,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heading: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    color: Colors.gray500,
    fontSize: 15,
    textAlign: 'center',
  },
  body: {
    color: Colors.gray500,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  btn: {
    backgroundColor: Colors.purple600,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.md,
  },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 17 },
});
