/**
 * BrandLogo — reusable EcoRoute logo for React Native screens.
 *
 * Usage:
 *   <BrandLogo size={80} />
 *   <BrandLogo size={18} style={{ marginRight: 4 }} />
 *
 * The component renders the actual logo PNG with resizeMode="contain" so it
 * never stretches or distorts regardless of the container size.
 */
import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const LOGO_SOURCE = require('@/assets/images/ecoroute_logo.png');

interface BrandLogoProps {
  /** Square dimension (width === height). Defaults to 40. */
  size?: number;
  /** Extra image-level styles (e.g. borderRadius, margin). */
  style?: StyleProp<ImageStyle>;
}

export function BrandLogo({ size = 40, style }: BrandLogoProps) {
  return (
    <Image
      source={LOGO_SOURCE}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel="EcoRoute logo"
    />
  );
}
