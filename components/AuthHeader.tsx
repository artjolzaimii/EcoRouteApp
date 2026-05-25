/**
 * AuthHeader — shared brand block for all EcoRoute auth screens.
 * Renders the logo, "EcoRoute" wordmark, and an optional per-screen tagline.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BrandLogo } from './BrandLogo';
import { Colors } from '@/constants/theme';

interface AuthHeaderProps {
  tagline?: string;
}

export function AuthHeader({ tagline }: AuthHeaderProps) {
  return (
    <View style={styles.wrap}>
      <BrandLogo size={54} style={styles.logo} />
      <Text style={styles.name}>EcoRoute</Text>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:    { alignItems: 'center', marginBottom: 26 },
  logo:    { borderRadius: 14, marginBottom: 10 },
  name:    { fontSize: 24, fontWeight: '800', color: Colors.emerald800, letterSpacing: -0.4, marginBottom: 3 },
  tagline: { fontSize: 13, color: Colors.gray500, fontWeight: '500', letterSpacing: 0.1 },
});
