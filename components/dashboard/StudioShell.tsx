'use client'
// ============================================================
// FIRM OS — Studio Shell (App Chrome)
// Sidebar + topbar + subscription gate
// ============================================================

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { User, Studio, Subscription } from '@/types'
import { formatBytes } from '@/lib/utils/license'
import SubscriptionGate from '@/components/subscription/SubscriptionGate'
import PreferencesPanel from '@/components/ui/PreferencesPanel'

interface Props {
  user: User
  studio: Studio
  subscription: Subscription | null
  studioSlug: string
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: 'dashboard', label: 'Command Center', icon: '⌘', shortcut: '1' },
  { href: 'projects', label: 'Projects', icon: '◫', shortcut: '2' },
  { href: 'vault', label: 'File Vault', icon: '⬡', shortcut: '3' },
  { href: 'settings', label: 'Settings', icon: '◎', shortcut: '4' },
  { href: 'billing', label: 'Billing', icon: '◈', shortcut: '5' },
]

export default function StudioShell({ user, studio, subscription, studioSlug, children }: Props) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Subscription status check
  const isSubscriptionBlocked =
    subscription?.status === 'EXPIRED' || subscription?.status === 'HOLD' || !subscription

  const storagePercent = Math.round((studio.storage_used / studio.storage_limit) * 100)
  const storageWarning = storagePercent > 85

  const activeSection = pathname.split('/')[2] ?? 'dashboard'

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'var(--bg)', fontFamily: 'var(--font-family)',
    }}>
      {/* ── Subscription Gate Overlay ── */}
      {isSubscriptionBlocked && activeSection !== 'billing' && activeSection !== 'settings' && (
        <SubscriptionGate
          studio={studio}
          studioSlug={studioSlug}
          subscription={subscription}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarCollapsed ? '60px' : '220px',
        minWidth: sidebarCollapsed ? '60px' : '220px',
        height: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Studio header */}
        <div style={{
          padding: sidebarCollapsed ? '16px 10px' : '20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '10px',
          minHeight: '64px',
        }}>
          <div style={{
            width: '32px', height: '32px', minWidth: '32px',
            background: 'var(--accent)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '700', color: '#fff',
            boxShadow: '0 0 12px rgba(107,124,255,0.3)',
          }}>
            {studio.name.charAt(0).toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                fontSize: '13px', fontWeight: '600',
                color: 'var(--text)', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {studio.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                {studio.current_tier}
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(p => !p)}
            style={{
              marginLeft: 'auto', width: '24px', height: '24px',
              background: 'transparent', border: 'none',
              color: 'var(--muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '4px', flexShrink: 0,
              transition: 'color 0.15s',
            }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.href
            return (
              <Link
                key={item.href}
                href={`/${studioSlug}/${item.href}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: sidebarCollapsed ? '10px' : '8px 10px',
                  borderRadius: '8px', textDecoration: 'none',
                  background: isActive ? 'rgba(107,124,255,0.12)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--muted)',
                  fontSize: '13px', fontWeight: isActive ? '500' : '400',
                  transition: 'all 0.1s',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  position: 'relative',
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <span style={{ flex: 1 }}>{item.label}</span>
                )}
                {!sidebarCollapsed && (
                  <span style={{
                    fontSize: '10px', color: 'var(--border)',
                    background: 'var(--bg)', padding: '2px 5px',
                    borderRadius: '3px', fontFamily: 'monospace',
                  }}>
                    ⌥{item.shortcut}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Storage bar */}
        {!sidebarCollapsed && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Storage</span>
              <span style={{ fontSize: '11px', color: storageWarning ? '#f59e0b' : 'var(--muted)' }}>
                {storagePercent}%
              </span>
            </div>
            <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${storagePercent}%`,
                background: storageWarning ? '#f59e0b' : 'var(--accent)',
                borderRadius: '2px',
                transition: 'width 0.5s',
              }} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
              {formatBytes(studio.storage_used)} / {formatBytes(studio.storage_limit)}
            </div>
          </div>
        )}

        {/* User footer */}
        <div style={{
          padding: sidebarCollapsed ? '12px 8px' : '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '28px', height: '28px', minWidth: '28px',
            borderRadius: '50%',
            background: user.avatar_url ? `url(${user.avatar_url}) center/cover` : 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: '#fff', fontWeight: '600',
          }}>
            {!user.avatar_url && user.full_name.charAt(0)}
          </div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{user.role}</div>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setShowPreferences(true)}
              style={{
                width: '24px', height: '24px', background: 'transparent',
                border: 'none', color: 'var(--muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '4px', fontSize: '14px',
              }}
              title="Preferences"
            >
              ⚙
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main style={{
        flex: 1, overflow: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Top bar */}
        <div style={{
          height: '52px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px',
          background: 'var(--surface)',
          gap: '16px',
        }}>
          <div style={{ flex: 1 }} />

          {/* Subscription status pill */}
          {subscription && (
            <div className={`badge badge-${subscription.status.toLowerCase()}`}>
              <span style={{ fontSize: '8px' }}>●</span>
              {subscription.type} {subscription.status}
            </div>
          )}

          {/* Clock */}
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </main>

      {/* Preferences panel */}
      {showPreferences && (
        <PreferencesPanel onClose={() => setShowPreferences(false)} />
      )}
    </div>
  )
}
