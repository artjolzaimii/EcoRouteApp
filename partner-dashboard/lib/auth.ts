'use client'

import { supabase } from './supabase'
import { api } from './api'

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  // Verify the user has PARTNER role
  const profile = await api.get<{ role: string }>('/api/partner/me').catch(() => null)
  if (!profile) {
    await supabase.auth.signOut()
    throw new Error('This account does not have partner access.')
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
