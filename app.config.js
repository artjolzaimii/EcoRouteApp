// Dynamic Expo config — reads EXPO_PUBLIC_GOOGLE_MAPS_KEY at build time
// This file replaces app.json for dynamic configuration support.
// Keep app.json for IDE tooling, but this file takes precedence at build time.

module.exports = ({ config }) => ({
  ...config,
  name: 'EcoRoute',
  slug: 'EcoRouteApp',
  owner: 'ecoroute',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/ecoroute_logo.png',
  scheme: 'ecorouteapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.ecoroute.app',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/ecoroute_logo.png',
      backgroundColor: '#10B981',
      monochromeImage: './assets/images/notification-icon.png',
    },
    notification: {
      icon: './assets/images/notification-icon.png',
      color: '#10B981',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.ecoroute.app',
    googleServicesFile: "./google-services.json",
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
  extra: {
    eas: {
      projectId: '44d4ba2f-3d26-42a8-9b54-aeac5f16c304',
    },
  },
  plugins: [
    'expo-web-browser',
    'expo-router',
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#10B981',
      },
    ],
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
        image: './assets/images/ecoroute_logo.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: { backgroundColor: '#0f172a' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
