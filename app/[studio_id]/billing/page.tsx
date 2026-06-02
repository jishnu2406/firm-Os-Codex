import { redirect } from 'next/navigation'
import StorageUpsell from '@/components/billing/StorageUpsell'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatBytes, maskLicenseKey } from '@/lib/utils/license'
import type { StorageAddon, Studio, Subscription } from '@/types'

export default async function BillingPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('users')
    .select('studio_id')
    .eq('id', user.id)
    .single()

  if (!profile?.studio_id) redirect('/setup-firm')

  const [studioResult, subscriptionResult, addonsResult] = await Promise.all([
    supabase
      .from('studios')
      .select('*')
      .eq('id', profile.studio_id)
      .single(),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('studio_id', profile.studio_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('storage_addons')
      .select('*')
      .eq('studio_id', profile.studio_id)
      .order('purchased_at', { ascending: false }),
  ])

  const studio = studioResult.data as Studio | null
  if (!studio) redirect('/setup-firm')

  const subscription = subscriptionResult.data as Subscription | null
  const addons = (addonsResult.data ?? []) as StorageAddon[]

  return (
    <div style={{ padding: '24px', display: 'grid', gap: '18px' }}>
      <div>
        <h1 style={{ color: 'var(--text)', fontSize: '24px', fontWeight: 600 }}>Billing</h1>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>
          License, subscription, and storage capacity.
        </p>
      </div>

      <section className="surface" style={{ padding: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        <BillingMetric
          label="License key"
          value={subscription ? maskLicenseKey(subscription.license_key) : 'No license on file'}
        />
        <BillingMetric
          label="Status"
          value={subscription?.status ?? 'INACTIVE'}
          badge
        />
        <BillingMetric
          label="Expiry"
          value={subscription ? formatDate(subscription.expires_at) : 'Not scheduled'}
        />
        <BillingMetric
          label="Storage"
          value={`${formatBytes(studio.storage_used)} / ${formatBytes(studio.storage_limit)}`}
        />
      </section>

      <StorageUpsell
        studioId={studio.id}
        storageUsed={studio.storage_used}
        storageLimit={studio.storage_limit}
      />

      <section className="surface" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600 }}>Storage Add-ons</h2>
        </div>
        {addons.length === 0 ? (
          <div style={{ padding: '28px 18px', color: 'var(--muted)', fontSize: '13px' }}>No storage add-ons purchased.</div>
        ) : (
          addons.map(addon => (
            <div key={addon.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', gap: '12px', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{addon.gb_purchased}GB</span>
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{addon.billing_cycle}</span>
              <span style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'right' }}>{formatDate(addon.purchased_at)}</span>
            </div>
          ))
        )}
      </section>
    </div>
  )
}

function BillingMetric({ label, value, badge = false }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="surface-inset" style={{ padding: '14px', minWidth: 0 }}>
      <div style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '8px' }}>{label}</div>
      {badge ? (
        <span style={badgeStyle}>{value}</span>
      ) : (
        <div style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </div>
      )}
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

const badgeStyle = {
  display: 'inline-flex',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  background: 'var(--bg)',
  color: 'var(--accent)',
  padding: '4px 9px',
  fontSize: '11px',
  fontWeight: 700,
} as const
