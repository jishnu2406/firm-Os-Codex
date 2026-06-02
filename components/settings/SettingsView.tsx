'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Studio, User } from '@/types'

interface SettingsViewProps {
  studio: Studio
  members: User[]
}

export default function SettingsView({ studio, members }: SettingsViewProps) {
  const [studioName, setStudioName] = useState(studio.name)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function saveStudioName() {
    if (!studioName.trim()) {
      setMessage('Studio name is required.')
      return
    }

    setIsSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('studios')
      .update({ name: studioName.trim() })
      .eq('id', studio.id)

    setIsSaving(false)
    setMessage(error ? error.message : 'Studio name updated.')
  }

  const settings = studio.settings ?? {
    theme: 'slate-dark',
    font: 'geist',
    layout: 'normal',
    notifications: true,
  }

  return (
    <div style={{ padding: '24px', display: 'grid', gap: '18px' }}>
      <div>
        <h1 style={{ color: 'var(--text)', fontSize: '24px', fontWeight: 600 }}>Settings</h1>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>
          Studio profile and team access.
        </p>
      </div>

      <section className="surface" style={{ padding: '18px', display: 'grid', gap: '14px' }}>
        <h2 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600 }}>Studio</h2>
        <label style={{ display: 'grid', gap: '6px', color: 'var(--muted)', fontSize: '12px', maxWidth: '460px' }}>
          Studio name
          <input
            value={studioName}
            onChange={event => setStudioName(event.target.value)}
            style={inputStyle}
          />
        </label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => void saveStudioName()} disabled={isSaving} style={primaryButtonStyle}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {message && <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{message}</span>}
        </div>
      </section>

      <section className="surface" style={{ padding: '18px', display: 'grid', gap: '14px' }}>
        <h2 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600 }}>Workspace Preferences</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <ReadOnlyPreference label="Theme" value={settings.theme} />
          <ReadOnlyPreference label="Font" value={settings.font} />
          <ReadOnlyPreference label="Layout" value={settings.layout} />
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '12px' }}>
          Managed from the sidebar gear icon.
        </p>
      </section>

      <section className="surface" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600 }}>Team Members</h2>
        </div>
        {members.length === 0 ? (
          <div style={{ padding: '32px 18px', color: 'var(--muted)' }}>No team members found.</div>
        ) : (
          members.map(member => (
            <div
              key={member.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px, 1fr) minmax(180px, 1fr) 110px',
                gap: '14px',
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {member.full_name || member.email}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {member.email}
              </span>
              <span style={badgeStyle}>{member.role}</span>
            </div>
          ))
        )}
      </section>
    </div>
  )
}

function ReadOnlyPreference({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-inset" style={{ padding: '12px' }}>
      <div style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '6px' }}>{label}</div>
      <div style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: '13px',
} as const

const primaryButtonStyle = {
  padding: '10px 16px',
  background: 'var(--accent)',
  border: '1px solid var(--accent)',
  borderRadius: '8px',
  color: 'var(--bg)',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
} as const

const badgeStyle = {
  justifySelf: 'start',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  background: 'var(--bg)',
  color: 'var(--accent)',
  padding: '4px 9px',
  fontSize: '11px',
  fontWeight: 700,
} as const
