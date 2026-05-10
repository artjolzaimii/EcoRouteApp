import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Guards tab screens — redirects to /log-in if no session
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (!session && inTabsGroup) {
      router.replace('/log-in');
    }
  }, [session, loading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Stack>
          {/* Entry / Welcome */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Onboarding & permissions */}
          <Stack.Screen name="splash" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="location-permission" options={{ headerShown: false }} />
          <Stack.Screen name="notification-permission" options={{ headerShown: false }} />

          {/* Auth */}
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="log-in" options={{ headerShown: false }} />
          <Stack.Screen name="email-verification" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="reset-password" options={{ headerShown: false }} />

          {/* Main tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Route flows */}
          <Stack.Screen name="search" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="route-detail" options={{ headerShown: false }} />
          <Stack.Screen name="navigation" options={{ headerShown: false }} />
          <Stack.Screen name="trip-completed" options={{ headerShown: false }} />
          <Stack.Screen name="saved-routes" options={{ headerShown: false }} />

          {/* Impact */}
          <Stack.Screen name="monthly-report" options={{ headerShown: false }} />

          {/* Profile */}
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />

          {/* Rewards / Coupons */}
          <Stack.Screen name="coupon-detail" options={{ headerShown: false }} />
          <Stack.Screen name="coupon-redeemed" options={{ headerShown: false }} />
          <Stack.Screen name="coupon-already-redeemed" options={{ headerShown: false }} />

          {/* Legacy */}
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthGuard>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
