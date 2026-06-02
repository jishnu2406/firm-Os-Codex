'use client'
// ============================================================
// FIRM OS — Auth Page
// Google OAuth sign-in with premium design
// ============================================================

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

  async function handleGoogleSignIn() {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
    } catch {
      setError('Authentication failed. Please try again.')
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
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(107, 124, 255, 0.08) 0%, transparent 60%), linear-gradient(rgba(107,124,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(107,124,255,0.03) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 48px 48px, 48px 48px',
      }} />

      <div className="animate-fade-in" style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '400px',
        padding: '0 24px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px',
            background: 'var(--accent)',
            borderRadius: '14px',
            marginBottom: '20px',
            boxShadow: '0 0 32px rgba(107,124,255,0.4)',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="2" fill="white" fillOpacity="0.9"/>
              <rect x="16" y="4" width="8" height="8" rx="2" fill="white" fillOpacity="0.6"/>
              <rect x="4" y="16" width="8" height="8" rx="2" fill="white" fillOpacity="0.6"/>
              <rect x="16" y="16" width="8" height="8" rx="2" fill="white" fillOpacity="0.3"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '24px', fontWeight: '600',
            color: 'var(--text)', letterSpacing: '-0.02em',
            marginBottom: '6px',
          }}>
            Firm OS
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Command Center for Design Studios
          </p>
        </div>

        {/* Card */}
        <div className="surface" style={{ padding: '32px' }}>
          <h2 style={{
            fontSize: '18px', fontWeight: '500',
            color: 'var(--text)', marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>
            Sign in to your studio
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '28px' }}>
            Continue with your Google account to access your workspace.
          </p>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              background: isLoading ? 'var(--border)' : 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text)',
              fontSize: '14px', fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => !isLoading && ((e.target as HTMLElement).style.borderColor = 'var(--accent)')}
            onMouseLeave={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')}
          >
            {isLoading ? (
              <div style={{
                width: '16px', height: '16px',
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4"/>
                <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z" fill="#34A853"/>
                <path d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z" fill="#FBBC05"/>
                <path d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z" fill="#EA4335"/>
              </svg>
            )}
            {isLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <p style={{
            textAlign: 'center', marginTop: '20px',
            color: 'var(--muted)', fontSize: '12px',
          }}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p style={{
          textAlign: 'center', marginTop: '24px',
          color: 'var(--muted)', fontSize: '12px',
        }}>
          New studio? You&apos;ll be guided through setup after sign-in.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
