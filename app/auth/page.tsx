'use client'
// ============================================================
// FIRM OS - Username/password sign-in
// ============================================================

import { FormEvent, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  )
}

function AuthPageContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const submittedUsername = String(formData.get('username') ?? '')
    const submittedPassword = String(formData.get('password') ?? '')

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/username-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: submittedUsername, password: submittedPassword, redirect }),
      })
      const data = await response.json() as { redirectTo?: string; error?: string }

      if (!response.ok) {
        throw new Error(data.error ?? 'Authentication failed. Please try again.')
      }

      window.location.assign(data.redirectTo ?? redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-root" style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(107, 124, 255, 0.08) 0%, transparent 60%), linear-gradient(rgba(107,124,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(107,124,255,0.03) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 48px 48px, 48px 48px',
      }} />

      <div className="animate-fade-in" style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '400px',
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            background: 'var(--accent)',
            borderRadius: '14px',
            marginBottom: '20px',
            boxShadow: '0 0 32px rgba(107,124,255,0.4)',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="8" height="8" rx="2" fill="white" fillOpacity="0.9" />
              <rect x="16" y="4" width="8" height="8" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="4" y="16" width="8" height="8" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="16" y="16" width="8" height="8" rx="2" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--text)',
            marginBottom: '6px',
          }}>
            Firm OS
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Command Center for Design Studios
          </p>
        </div>

        <form className="surface" method="post" onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '500',
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            Sign in to your studio
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
            Enter your studio username and access password.
          </p>

          <div style={{ display: 'grid', gap: '14px' }}>
            <label style={labelStyle}>
              Username
              <input
                name="username"
                autoComplete="username"
                placeholder="studio-owner"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter access password"
                style={inputStyle}
              />
            </label>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginTop: '18px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444',
              fontSize: '13px',
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: isLoading ? 'var(--border)' : 'var(--accent)',
              border: '1px solid transparent',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
              opacity: isLoading ? 0.75 : 1,
            }}
          >
            {isLoading && (
              <span style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.35)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
            {isLoading ? 'Signing in...' : 'Enter Command Center'}
          </button>

          <p style={{
            textAlign: 'center',
            marginTop: '20px',
            color: 'var(--muted)',
            fontSize: '12px',
            lineHeight: 1.6,
          }}>
            First-time owners can sign in with the initial access password, then change it in Settings.
          </p>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'var(--muted)',
          fontSize: '12px',
        }}>
          New studio? You will be guided through setup after sign-in.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const labelStyle = {
  display: 'grid',
  gap: '6px',
  color: 'var(--muted)',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
} as const

const inputStyle = {
  width: '100%',
  padding: '11px 13px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
} as const
