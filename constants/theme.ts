// EcoRoute — Design Tokens
// Single source of truth for all colors, spacing, border radii, font sizes, and shadows.

export const Colors = {
  // Emerald / green (Home, Routes, Impact)
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald400: '#34d399',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065f46',
  emerald900: '#064e3b',

  // Purple / pink (Rewards)
  purple100: '#f3e8ff',
  purple500: '#a855f7',
  purple600: '#9333ea',
  purple700: '#7e22ce',
  pink600: '#db2777',

  // Indigo (Profile header)
  indigo600: '#4f46e5',

  // Neutral grays
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Accent
  red100: '#fee2e2',
  red600: '#dc2626',
  blue100: '#dbeafe',
  blue600: '#2563eb',
  amber100: '#fef3c7',
  amber600: '#d97706',
  amber700: '#b45309',
  yellow100: '#fef9c3',
  yellow500: '#eab308',
  yellow700: '#a16207',
  orange100: '#ffedd5',
  orange600: '#ea580c',
  green100: '#dcfce7',
  green600: '#16a34a',
  sky600: '#0284c7',

  // Overlays
  black40: 'rgba(0,0,0,0.4)',
  white10: 'rgba(255,255,255,0.1)',
  white20: 'rgba(255,255,255,0.2)',
  white30: 'rgba(255,255,255,0.3)',
  white70: 'rgba(255,255,255,0.7)',
  white80: 'rgba(255,255,255,0.8)',

  // Semantic text on green backgrounds
  emeraldText100: '#d1fae5', // light text on dark green bg
  purpleText100: '#f3e8ff',  // light text on purple bg
};

export const DarkColors = {
  emerald50: '#064e3b',
  emerald100: '#065f46',
  emerald200: '#047857',
  emerald400: '#10b981',
  emerald600: '#34d399',
  emerald700: '#6ee7b7',
  emerald800: '#a7f3d0',
  emerald900: '#ecfdf5',

  indigo600: '#818cf8',

  white: '#111827', // Use dark as "white" bg
  gray50: '#1f2937',
  gray100: '#374151',
  gray200: '#4b5563',
  gray300: '#6b7280',
  gray400: '#9ca3af',
  gray500: '#d1d5db',
  gray600: '#e5e7eb',
  gray700: '#f3f4f6',
  gray800: '#f9fafb',
  gray900: '#ffffff', // Use white as "dark" text
};

export const Theme = {
  light: {
    background: '#F1EFE8', // CREAM
    card: '#ffffff',
    text: '#111827',
    textSecondary: '#6b7280',
    primary: Colors.emerald600,
    border: '#e5e7eb',
    ...Colors,
  },
  dark: {
    background: '#0a0a0a',
    card: '#1a1a1a',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    primary: DarkColors.emerald400,
    border: '#2d2d2d',
    ...Colors, // Spread all to ensure keys
    ...DarkColors, // Overwrite with dark-specific ones
  },
};

export type AppTheme = typeof Theme.light;


export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};
