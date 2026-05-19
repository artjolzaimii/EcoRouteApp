'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Icon } from '@/components/ui/Icon'
import { api } from '@/lib/api'

interface PartnerProfile {
  id: string
  businessName: string
  businessEmail: string | null
  phone: string | null
  location: string | null
  logoUrl: string | null
}

export default function SettingsPage() {
  const [profile,  setProfile]  = useState<PartnerProfile | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    api.get<PartnerProfile>('/api/partner/me')
      .then((p) => {
        setProfile(p)
        setName(p.businessName)
        setEmail(p.businessEmail ?? '')
        setPhone(p.phone ?? '')
        setLocation(p.location ?? '')
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api.put<PartnerProfile>('/api/partner/me', {
        businessName:  name,
        businessEmail: email || null,
        phone:         phone || null,
        location:      location || null,
      })
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const initials = profile?.businessName
    ? profile.businessName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      <Topbar
        title="Settings"
        sub="Your business profile."
      />
      <div className="content" style={{ maxWidth: 720 }}>
        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }} />
        ) : (
          <div className="card">
            <div className="card-head"><div className="card-title">Business profile</div></div>

            {/* Logo */}
            <div className="h-stack" style={{ gap: 18, marginBottom: 22 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 18,
                background: 'linear-gradient(135deg, var(--eco-400), var(--eco-700))',
                color: 'white', display: 'grid', placeItems: 'center',
                fontWeight: 700, fontSize: 24, flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <button className="btn btn-secondary">
                  <Icon name="upload" size={14} /> Upload logo
                </button>
                <div className="hint" style={{ marginTop: 8 }}>PNG or SVG, square, min 512px.</div>
              </div>
            </div>

            <div className="v-stack">
              <div className="field">
                <label className="label">Business name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="row-2">
                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Phone</label>
                  <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label className="label">Location</label>
                <div className="input-with-icon">
                  <Icon className="ic-l" name="pin" size={14} />
                  <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--rose-600)', fontSize: 13, padding: '10px 14px', background: 'var(--rose-50)', borderRadius: 8, marginTop: 12 }}>
                {error}
              </div>
            )}

            <div className="divider" />
            <div className="h-stack" style={{ justifyContent: 'flex-end', gap: 10 }}>
              {saved && <span style={{ fontSize: 13, color: 'var(--eco-700)' }}>Saved!</span>}
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
