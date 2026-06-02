'use client'
// ============================================================
// FIRM OS — Subscription Gate
// Premium fullscreen renew screen
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Studio, Subscription } from '@/types'
import { validateLicenseKey } from '@/lib/utils/license'

interface Props {
  studio: Studio
  studioSlug: string
  subscription: Subscription | null
}

export default function SubscriptionGate({ studio, studioSlug, subscription }: Props) {
  const router = useRouter()
  const [licenseKey, setLicenseKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationState, setValidationState] = useState<'idle' | 'success' | 'error'>('idle')

  async function handleRenew() {
    const localCheck = validateLicenseKey(licenseKey)
    if (!localCheck.valid) {
      setError(localCheck.message)
      setValidationState('error')
      return
    }

    setIsValidating(true)
    setError(null)

    const res = await fetch('/api/validate-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey, studio_id: studio.id }),
    })

    const data = await res.json()
    setIsValidating(false)

    if (data.success) {
      setValidationState('success')
      setTimeout(() => router.refresh(), 1500)
    } else {
      setError(data.message ?? 'License activation failed.')
      setValidationState('error')
    }
  }

  const statusLabel = subscription?.status ?? 'INACTIVE'
  const isHold = subscription?.status === 'HOLD'

  return (
    <div className="subscription-gate">
      {/* Animated background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 40%, rgba(107,124,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(239,68,68,0.06) 0%, transparent 50%)',
        animation: 'pulse-bg 8s ease-in-out infinite',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '520px',
        padding: '0 24px',
      }}>
        {/* Status indicator */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '999px',
            background: isHold ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${isHold ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: isHold ? '#f59e0b' : '#ef4444',
            fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize: '8px' }}>●</span>
            Subscription {statusLabel}
          </div>

          <h1 style={{
            fontSize: '36px', fontWeight: '300',
            color: 'var(--text)', letterSpacing: '-0.03em',
            marginBottom: '12px', lineHeight: 1.1,
            fontFamily: '"Cormorant Garamond", Georgia, serif',
          }}>
            {isHold ? 'Account on Hold' : 'Subscription Expired'}
          </h1>

          <p style={{
            fontSize: '15px', color: 'var(--muted)',
            lineHeight: 1.6, maxWidth: '400px', margin: '0 auto',
          }}>
            {isHold
              ? `Your studio "${studio.name}" has been placed on hold. Contact support or reactivate your license to restore access.`
              : `Your subscription for "${studio.name}" has expired. Renew your license to regain full access to the Command Center.`
            }
          </p>
        </div>

        {/* Renew card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}>
          {validationState === 'success' ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(90,175,106,0.15)',
                border: '1px solid rgba(90,175,106,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', margin: '0 auto 16px', color: '#5aaf6a',
              }}>✓</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>
                License Activated
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                Restoring your workspace…
              </p>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
                Enter License Key
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
                Enter a valid monthly or yearly license key to restore access.
              </p>

              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <input
                  value={licenseKey}
                  onChange={e => { setLicenseKey(e.target.value); setError(null); setValidationState('idle') }}
                  placeholder="DNAXFOS/MBAP-XXXX-XXXX-XXXX-XXXX"
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${validationState === 'error' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '10px', color: 'var(--text)',
                    fontSize: '13px', fontFamily: 'monospace',
                    letterSpacing: '0.03em', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = validationState === 'error' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)')}
                  onKeyDown={e => e.key === 'Enter' && handleRenew()}
                />
              </div>

              {error && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px' }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleRenew}
                disabled={isValidating || !licenseKey}
                style={{
                  width: '100%', padding: '13px',
                  background: licenseKey ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                  border: 'none', borderRadius: '10px',
                  color: '#fff', fontSize: '14px', fontWeight: '600',
                  cursor: licenseKey && !isValidating ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                  opacity: isValidating ? 0.7 : 1,
                  boxShadow: licenseKey ? '0 4px 20px rgba(107,124,255,0.4)' : 'none',
                }}
              >
                {isValidating ? 'Validating…' : 'Activate & Restore Access'}
              </button>

              <div style={{
                display: 'flex', gap: '12px',
                marginTop: '16px', paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                <a
                  href={`/${studioSlug}/billing`}
                  style={{
                    flex: 1, padding: '10px',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: 'var(--muted)',
                    fontSize: '12px', textAlign: 'center', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  View Billing
                </a>
                <a
                  href="mailto:support@firmos.app"
                  style={{
                    flex: 1, padding: '10px',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: 'var(--muted)',
                    fontSize: '12px', textAlign: 'center', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  Contact Support
                </a>
              </div>
            </>
          )}
        </div>

        {/* Key format hint */}
        <p style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '11px', color: 'rgba(255,255,255,0.2)',
        }}>
          Monthly: DNAXFOS/MBAP-XXXX-XXXX-XXXX-XXXX &nbsp;·&nbsp; Yearly: DNAXFOS/YRLY-XXXX-XXXX-XXXX-XXXX
        </p>
      </div>

      <style>{`
        @keyframes pulse-bg {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
