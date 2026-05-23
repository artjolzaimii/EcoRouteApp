import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

type SignUpResult = {
  email: string;
  needsEmailVerification: boolean;
};

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  resendVerificationEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

function getSupabaseProjectRef(): string {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return 'missing';

  try {
    return new URL(supabaseUrl).hostname.split('.')[0] ?? 'unknown';
  } catch {
    return 'invalid-url';
  }
}

function getEmailRedirectTo(): string {
  return 'ecorouteapp://log-in';
}

async function registerPushToken(session: Session): Promise<void> {
  // ── DIAGNOSTIC LOGS — remove after confirming token registration works ──────
  console.log('[push] registration start');
  try {
    const { status } = await Notifications.getPermissionsAsync();
    console.log('[push] permission status:', status);
    if (status !== 'granted') {
      console.log('[push] exit: permission not granted — token skipped');
      return;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    console.log('[push] projectId present:', Boolean(projectId));
    if (!projectId) {
      console.warn('[push] exit: projectId missing from Constants.expoConfig.extra.eas — skipping');
      return;
    }

    console.log('[push] calling getExpoPushTokenAsync...');
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[push] token obtained, prefix:', token?.slice(0, 20));

    const endpoint = `${API_BASE_URL}/api/user/push-token`;
    console.log('[push] POST', endpoint);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ token }),
    });
    console.log('[push] response status:', res.status);
  } catch (err) {
    // Never crash the auth flow due to push token issues
    console.warn('[push] registration failed:', (err as Error).message);
  }
}

async function ensureProfile(session: Session): Promise<void> {
  const userId = session.user.id;
  const email = session.user.email ?? '';
  const fullName =
    (session.user.user_metadata?.full_name as string | undefined) ??
    email.split('@')[0];

  try {
    await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authUserId: userId, email, fullName, supabaseUserIdConfirmed: true }),
    });
  } catch {
    // Silent — don't block login if the backend is temporarily unreachable
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing session on mount and ensure backend profile exists
    supabase.auth.getSession().then(({ data }) => {
      console.log('[auth/session] initial session', {
        hasSession: Boolean(data.session),
        authUserId: data.session?.user.id,
        email: data.session?.user.email,
        emailConfirmedAt: data.session?.user.email_confirmed_at,
        supabaseProjectRef: getSupabaseProjectRef(),
      });
      setSession(data.session);
      setLoading(false);
      if (data.session) {
        ensureProfile(data.session);
        registerPushToken(data.session);
      }
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[auth/state] change', {
        event,
        hasSession: Boolean(newSession),
        authUserId: newSession?.user.id,
        email: newSession?.user.email,
        emailConfirmedAt: newSession?.user.email_confirmed_at,
        supabaseProjectRef: getSupabaseProjectRef(),
      });
      setSession(newSession);
      if (event === 'SIGNED_IN' && newSession) {
        ensureProfile(newSession);
        registerPushToken(newSession);
      }
      // Deep link from password-reset email lands here as PASSWORD_RECOVERY
      if (event === 'PASSWORD_RECOVERY') router.replace('/reset-password');
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.warn('[auth/login] Supabase login failed', {
        email,
        message: error.message,
        status: error.status,
        supabaseProjectRef: getSupabaseProjectRef(),
      });

      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Please verify your email first, then log in.');
      }

      throw error;
    }

    console.log('[auth/login] Supabase login succeeded', {
      hasSession: Boolean(data.session),
      authUserId: data.user?.id,
      email: data.user?.email ?? email,
      emailConfirmedAt: data.user?.email_confirmed_at,
      supabaseProjectRef: getSupabaseProjectRef(),
    });

    // Verify the account is not suspended on our backend
    if (data.session) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        if (res.status === 403) {
          await supabase.auth.signOut();
          throw new Error('Your account has been suspended. Please contact support.');
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('suspended')) throw err;
        // Network error — don't block login if backend is unreachable
      }
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: getEmailRedirectTo(),
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed — no user returned');

    console.log('[auth/signup] Supabase signUp result', {
      hasUserId: Boolean(data.user.id),
      authUserId: data.user.id,
      hasSession: Boolean(data.session),
      email: data.user.email ?? email,
      emailConfirmedAt: data.user.email_confirmed_at,
      emailRedirectTo: getEmailRedirectTo(),
      supabaseProjectRef: getSupabaseProjectRef(),
    });

    // Provision the backend profile
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authUserId: data.user.id,
        email,
        fullName,
        supabaseUserIdConfirmed: true,
      }),
    });

    if (!res.ok) {
      let errorMsg = 'Backend profile creation failed';
      try {
        const json = await res.json();
        errorMsg = json.error ?? errorMsg;
      } catch {
        // ignore parse error
      }
      throw new Error(errorMsg);
    }

    return {
      email: data.user.email ?? email,
      needsEmailVerification: !data.session,
    };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: getEmailRedirectTo() },
    });

    if (error) {
      console.warn('[auth/resend] Supabase resend failed', {
        email,
        message: error.message,
        status: error.status,
        emailRedirectTo: getEmailRedirectTo(),
        supabaseProjectRef: getSupabaseProjectRef(),
      });
      throw error;
    }

    console.log('[auth/resend] Supabase resend succeeded', {
      email,
      emailRedirectTo: getEmailRedirectTo(),
      supabaseProjectRef: getSupabaseProjectRef(),
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, resendVerificationEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
