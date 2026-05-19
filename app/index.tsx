import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { hasCompletedOnboarding } from '@/lib/preferences';

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    hasCompletedOnboarding().then(setOnboardingDone);
  }, []);

  // Hold here until both the auth session and the onboarding flag are known.
  // This prevents a flash of the onboarding screen on every cold start.
  if (onboardingDone === null || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1EFE8' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={session ? '/(tabs)' : '/log-in'} />;
}
