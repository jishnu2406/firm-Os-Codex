'use client'
// ============================================================
// FIRM OS — Setup Firm Wizard
// Multi-step onboarding for new studio creation
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateLicenseKey } from '@/lib/utils/license'

type Step = 'studio' | 'license' | 'done'

export default function SetupFirmPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('studio')
  const [studioName, setStudioName] = useState('')
  const [studioSlug, setStudioSlug] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdStudio, setCreatedStudio] = useState<{ id: string; slug: string } | null>(null)

  function handleNameChange(val: string) {
    setStudioName(val)
    setStudioSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function handleCreateStudio() {
    if (!studioName.trim() || !studioSlug.trim()) {
      setError('Studio name is required.')
      return
    }
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    // Check slug availability
    const { data: existing } = await supabase
      .from('studios')
      .select('id')
      .eq('slug', studioSlug)
      .single()

    if (existing) {
      setError('This studio slug is already taken. Please choose a different name.')
      setIsLoading(false)
      return
    }

    // Create studio
    const { data: studio, error: studioError } = await supabase
      .from('studios')
      .insert({ name: studioName, slug: studioSlug })
      .select()
      .single()

    if (studioError || !studio) {
      setError('Failed to create studio. Please try again.')
      setIsLoading(false)
      return
    }

    // Assign user as OWNER
    await supabase
      .from('users')
      .update({ studio_id: studio.id, role: 'OWNER' })
      .eq('id', user.id)

    setCreatedStudio({ id: studio.id, slug: studio.slug })
    setStep('license')
    setIsLoading(false)
  }

  async function handleActivateLicense() {
    if (!licenseKey.trim()) {
      // Skip — allow setup without license for demo
      await finalizeOnboarding()
      return
    }

    const localValidation = validateLicenseKey(licenseKey)
    if (!localValidation.valid) {
      setError(localValidation.message)
      return
    }

    setIsLoading(true)
    setError(null)

    const res = await fetch('/api/validate-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey, studio_id: createdStudio!.id }),
    })

    const data = await res.json()
    if (!data.success) {
      setError(data.message ?? 'License activation failed.')
      setIsLoading(false)
      return
    }

    await finalizeOnboarding()
  }

  async function finalizeOnboarding() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ onboarded: true }).eq('id', user.id)
    }
    setStep('done')
    setTimeout(() => router.push(`/${createdStudio!.slug}/dashboard`), 1500)
  }

  const steps = ['studio', 'license', 'done']
  const stepIndex = steps.indexOf(step)

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Progress dots */}
      <div style={{ position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
        {['Studio', 'License', 'Launch'].map((s, i) => (
          <div key={s} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: i <= stepIndex ? 'var(--text)' : 'var(--muted)',
            fontSize: '12px', fontWeight: i === stepIndex ? '600' : '400',
            transition: 'color 0.2s',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: i < stepIndex ? 'var(--accent)' : i === stepIndex ? 'var(--accent)' : 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '600', color: i <= stepIndex ? '#fff' : 'var(--muted)',
              transition: 'background 0.3s',
            }}>
              {i < stepIndex ? '✓' : i + 1}
            </div>
            {s}
            {i < 2 && <div style={{ width: '24px', height: '1px', background: i < stepIndex ? 'var(--accent)' : 'var(--border)' }} />}
          </div>
        ))}
      </div>

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
        {/* ── Step 1: Studio Details ── */}
        {step === 'studio' && (
          <div className="surface" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Initialize your studio
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
                Set up your Firm OS workspace. This creates your isolated studio environment.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Studio Name
                </label>
                <input
                  value={studioName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Acme Design Studio"
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text)', fontSize: '14px',
                    fontFamily: 'inherit', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Studio Slug
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--muted)', fontSize: '13px',
                  }}>firmos.app/</span>
                  <input
                    value={studioSlug}
                    onChange={e => setStudioSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="acme-design"
                    style={{
                      width: '100%', padding: '10px 14px 10px 96px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text)', fontSize: '14px',
                      fontFamily: 'inherit', outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleCreateStudio}
              disabled={isLoading || !studioName}
              style={{
                marginTop: '28px', width: '100%', padding: '12px',
                background: studioName ? 'var(--accent)' : 'var(--border)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontSize: '14px', fontWeight: '600', cursor: studioName ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'all 0.15s',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Creating…' : 'Create Studio →'}
            </button>
          </div>
        )}

        {/* ── Step 2: License Key ── */}
        {step === 'license' && (
          <div className="surface" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Activate your license
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
                Enter your license key to activate full access. You can also skip this step and activate later.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                License Key
              </label>
              <input
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
                placeholder="DNAXFOS/MBAP-XXXX-XXXX-XXXX-XXXX"
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text)', fontSize: '13px',
                  fontFamily: 'monospace', outline: 'none',
                  letterSpacing: '0.05em',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted)' }}>
                Monthly: DNAXFOS/MBAP-XXXX-XXXX-XXXX-XXXX &nbsp;·&nbsp; Yearly: DNAXFOS/YRLY-XXXX-XXXX-XXXX-XXXX
              </p>
            </div>

            {error && (
              <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button
                onClick={finalizeOnboarding}
                style={{
                  flex: 1, padding: '12px',
                  background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: '10px', color: 'var(--muted)',
                  fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Skip for now
              </button>
              <button
                onClick={handleActivateLicense}
                disabled={isLoading}
                style={{
                  flex: 2, padding: '12px',
                  background: 'var(--accent)', border: 'none',
                  borderRadius: '10px', color: '#fff',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: 'inherit', opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? 'Activating…' : 'Activate License →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 'done' && (
          <div className="surface" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px',
              background: 'rgba(90, 175, 106, 0.15)',
              border: '1px solid rgba(90, 175, 106, 0.3)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '28px',
            }}>
              ✓
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em', marginBottom: '12px' }}>
              Studio initialized
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Launching your Command Center…
            </p>
            <div style={{
              marginTop: '24px', height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', background: 'var(--accent)',
                animation: 'progress 1.5s ease-out forwards',
              }} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress { from { width: 0 } to { width: 100% } }
      `}</style>
    </div>
  )
}
