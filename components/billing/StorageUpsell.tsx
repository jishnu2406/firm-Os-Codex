'use client'

import { useMemo, useState } from 'react'
import { bytesToGB, calculateStoragePrice, formatBytes, STORAGE_PRICING } from '@/lib/utils/license'
import type { SubscriptionType } from '@/types'

interface StorageUpsellProps {
  studioId: string
  storageUsed: number
  storageLimit: number
}

export default function StorageUpsell({ studioId, storageUsed, storageLimit }: StorageUpsellProps) {
  const currentLimitGb = bytesToGB(storageLimit)
  const maxAdditionalGb = Math.max(0, Math.min(9, STORAGE_PRICING.MAX_GB - Math.ceil(currentLimitGb)))
  const options = Array.from({ length: maxAdditionalGb }, (_, index) => index + 1)
  const [gbToAdd, setGbToAdd] = useState(options[0] ?? 0)
  const [billingCycle, setBillingCycle] = useState<SubscriptionType>('MONTHLY')
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const storagePercent = storageLimit > 0 ? Math.min(100, Math.round((storageUsed / storageLimit) * 100)) : 0

  const price = useMemo(
    () => calculateStoragePrice(gbToAdd, billingCycle),
    [gbToAdd, billingCycle]
  )

  async function purchaseStorage() {
    if (!gbToAdd) {
      setMessage('Storage is already at the 12GB limit.')
      return
    }

    setIsPurchasing(true)
    setMessage(null)

    const response = await fetch('/api/storage-upsell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studio_id: studioId,
        gb_to_add: gbToAdd,
        billing_cycle: billingCycle,
      }),
    })

    const payload = await response.json()
    setIsPurchasing(false)
    setMessage(response.ok ? `Storage upgraded by ${gbToAdd}GB.` : payload.error ?? 'Purchase failed.')
  }

  return (
    <div className="surface" style={{ padding: '18px', display: 'grid', gap: '16px' }}>
      <div>
        <h2 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600 }}>Storage Upgrade</h2>
        <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px' }}>
          {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
        </p>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        <div style={{ height: '10px', border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${storagePercent}%`, background: 'var(--accent)', transition: 'width 240ms ease' }} />
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{storagePercent}% used</div>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Additional GB</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {options.length === 0 ? (
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Maximum storage reached.</span>
          ) : (
            options.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setGbToAdd(option)}
                style={{
                  ...optionButtonStyle,
                  background: gbToAdd === option ? 'var(--accent)' : 'var(--surface)',
                  color: gbToAdd === option ? 'var(--bg)' : 'var(--text)',
                  borderColor: gbToAdd === option ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {option}GB
              </button>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Billing</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['MONTHLY', 'YEARLY'] as SubscriptionType[]).map(cycle => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              style={{
                ...optionButtonStyle,
                background: billingCycle === cycle ? 'var(--accent)' : 'var(--surface)',
                color: billingCycle === cycle ? 'var(--bg)' : 'var(--text)',
                borderColor: billingCycle === cycle ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {cycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--text)', fontSize: '22px', fontWeight: 700 }}>{price.display}</div>
          <div style={{ color: 'var(--muted)', fontSize: '12px' }}>for {gbToAdd}GB additional storage</div>
        </div>
        <button type="button" onClick={() => void purchaseStorage()} disabled={isPurchasing || gbToAdd === 0} style={primaryButtonStyle}>
          {isPurchasing ? 'Processing...' : 'Purchase Storage'}
        </button>
      </div>

      {message && (
        <div className="surface-inset" style={{ padding: '10px 12px', color: 'var(--text)', fontSize: '12px' }}>
          {message}
        </div>
      )}
    </div>
  )
}

const optionButtonStyle = {
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontFamily: 'inherit',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
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
