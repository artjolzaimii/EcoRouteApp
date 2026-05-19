// Dynamic Expo config — reads EXPO_PUBLIC_GOOGLE_MAPS_KEY at build time
// This file replaces app.json for dynamic configuration support.
// Keep app.json for IDE tooling, but this file takes precedence at build time.

module.exports = ({ config }) => ({
  ...config,
  name: 'EcoRouteApp',
  slug: 'EcoRouteApp',
  owner: 'ecoroute',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'ecorouteapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.anonymous.EcoRouteApp',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.anonymous.EcoRouteApp',
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      },
    },
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-web-browser',
    'expo-router',
    [
      'expo-image-picker',
      {
        photosPermission: 'EcoRoute accesses your photos to let you set a profile picture.',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'EcoRoute uses your location to find eco-friendly routes.',
        locationWhenInUsePermission: 'EcoRoute uses your location to find eco-friendly routes.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: { backgroundColor: '#000000' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
