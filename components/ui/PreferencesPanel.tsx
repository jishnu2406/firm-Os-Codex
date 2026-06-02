'use client'
// ============================================================
// FIRM OS — Preferences Panel
// Theme × Font × Layout controls
// ============================================================

import { usePreferences } from '@/lib/hooks/usePreferences'
import { THEMES, FONTS, LAYOUTS } from '@/lib/utils/design-system'

export default function PreferencesPanel({ onClose }: { onClose: () => void }) {
  const { theme, font, layout, setTheme, setFont, setLayout } = usePreferences()

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        className="animate-slide-in"
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 101,
          width: '320px',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          overflow: 'auto',
          boxShadow: '-24px 0 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Workspace Preferences
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'transparent', border: 'none',
              color: 'var(--muted)', cursor: 'pointer', fontSize: '16px',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* ── Themes ── */}
          <section>
            <h3 style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Color Theme
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                  style={{
                    padding: '0', border: 'none',
                    borderRadius: '8px', cursor: 'pointer',
                    overflow: 'hidden',
                    outline: theme === t.id ? `2px solid var(--accent)` : '2px solid transparent',
                    outlineOffset: '2px',
                    transition: 'outline 0.1s',
                  }}
                >
                  <div style={{
                    height: '36px',
                    background: t.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '2px',
                    borderRadius: '6px',
                    border: `1px solid ${t.border}`,
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.accent }} />
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: t.muted, opacity: 0.5 }} />
                  </div>
                </button>
              ))}
            </div>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
              {THEMES.find(t => t.id === theme)?.label}
            </p>
          </section>

          {/* ── Fonts ── */}
          <section>
            <h3 style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Font Style
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFont(f.id)}
                  style={{
                    padding: '10px 12px',
                    background: font === f.id ? 'rgba(107,124,255,0.1)' : 'transparent',
                    border: `1px solid ${font === f.id ? 'rgba(107,124,255,0.3)' : 'transparent'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.1s',
                    color: 'inherit',
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '14px', fontFamily: f.family,
                      color: font === f.id ? 'var(--accent)' : 'var(--text)',
                      fontWeight: '400',
                    }}>
                      {f.specimen}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '1px' }}>
                      {f.label}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px', color: 'var(--muted)',
                    background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {f.category}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Layouts ── */}
          <section>
            <h3 style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Workspace Layout
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {LAYOUTS.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id)}
                  style={{
                    padding: '12px',
                    background: layout === l.id ? 'rgba(107,124,255,0.1)' : 'var(--bg)',
                    border: `1px solid ${layout === l.id ? 'rgba(107,124,255,0.3)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    textAlign: 'left',
                    transition: 'all 0.1s',
                    color: 'inherit',
                  }}
                >
                  <span style={{
                    fontSize: '20px', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: layout === l.id ? 'rgba(107,124,255,0.15)' : 'var(--surface)',
                    borderRadius: '8px',
                    color: layout === l.id ? 'var(--accent)' : 'var(--muted)',
                  }}>
                    {l.icon}
                  </span>
                  <div>
                    <div style={{
                      fontSize: '13px', fontWeight: '500',
                      color: layout === l.id ? 'var(--accent)' : 'var(--text)',
                      marginBottom: '2px',
                    }}>
                      {l.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>
                      {l.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
