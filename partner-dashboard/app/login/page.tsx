'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Left poster */}
      <div className="auth-poster">
        <div>
          <div className="auth-poster brand-mark">
            <Icon name="leaf" size={24} color="#fff" />
          </div>
        </div>

        <div>
          <h2>Sell to a community that cares about the planet.</h2>
          <p>
            The EcoRoute Partner Portal lets you list eco-friendly products and services,
            accept Green Points or cash, and reach 12,000+ riders across Europe.
          </p>
        </div>

        <div className="auth-stats">
          <div>
            <div className="n">12.4k</div>
            <div className="l">Active riders</div>
          </div>
          <div>
            <div className="n">340+</div>
            <div className="l">Eco-partners</div>
          </div>
          <div>
            <div className="n">58.2t</div>
            <div className="l">CO₂ saved together</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleLogin}>
          <h1>Welcome back</h1>
          <p className="lead">Sign in to manage your marketplace listings.</p>

          <div className="field">
            <label className="label">Email</label>
            <div className="input-with-icon">
              <Icon className="ic-l" name="user" size={16} />
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Password</label>
            <div className="input-with-icon">
              <Icon className="ic-l" name="shield" size={16} />
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)' }}
              >
                <Icon name={showPw ? 'eyeOff' : 'eye'} size={16} />
              </button>
            </div>
          </div>

          <div className="row-between">
            <button
              type="button"
              className={`checkbox ${remember ? 'on' : ''}`}
              onClick={() => setRemember(!remember)}
            >
              <span className="box">
                {remember && <Icon name="check" size={11} strokeWidth={2.4} />}
              </span>
              Remember me
            </button>
            <a href="#" className="link">Forgot password?</a>
          </div>

          {error && (
            <div style={{ color: 'var(--rose-600)', fontSize: 13, padding: '10px 14px', background: 'var(--rose-50)', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign in to partner portal'}
          </button>

          <div className="auth-divider">or continue with</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              <Icon name="google" size={16} /> Google
            </button>
            <button type="button" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              <Icon name="apple" size={16} /> Apple
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--gray-500)' }}>
            New to EcoRoute?{' '}
            <a href="#" className="link">Apply to become a partner</a>
          </p>
        </form>
      </div>
    </div>
  )
}
