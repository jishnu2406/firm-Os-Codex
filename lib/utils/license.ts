// ============================================================
// FIRM OS — License Key Validation
// Monthly: DNAXFOS/MBAP-XXXX-XXXX-XXXX-XXXX
// Yearly:  DNAXFOS/YRLY-XXXX-XXXX-XXXX-XXXX
// ============================================================

import type { LicenseValidationResult, SubscriptionType } from '@/types'

const MONTHLY_PREFIX = 'DNAXFOS/MBAP'
const YEARLY_PREFIX = 'DNAXFOS/YRLY'
const HASH_SEGMENT = '[A-F0-9]{4}'
const KEY_PATTERN = new RegExp(
  `^(${MONTHLY_PREFIX}|${YEARLY_PREFIX})-(${HASH_SEGMENT})-(${HASH_SEGMENT})-(${HASH_SEGMENT})-(${HASH_SEGMENT})$`,
  'i'
)

export function validateLicenseKey(key: string): LicenseValidationResult {
  if (!key || typeof key !== 'string') {
    return { valid: false, type: null, message: 'License key is required.' }
  }

  const normalized = key.trim().toUpperCase()

  if (!KEY_PATTERN.test(normalized)) {
    return {
      valid: false,
      type: null,
      message: 'Invalid key format. Expected DNAXFOS/MBAP-XXXX-XXXX-XXXX-XXXX or DNAXFOS/YRLY-XXXX-XXXX-XXXX-XXXX',
    }
  }

  const type: SubscriptionType = normalized.startsWith(MONTHLY_PREFIX) ? 'MONTHLY' : 'YEARLY'
  const expiresAt = computeExpiry(type)

  return {
    valid: true,
    type,
    message: `Valid ${type.toLowerCase()} license key.`,
    expiresAt,
  }
}

function computeExpiry(type: SubscriptionType): Date {
  const now = new Date()
  if (type === 'MONTHLY') {
    return new Date(now.setMonth(now.getMonth() + 1))
  }
  return new Date(now.setFullYear(now.getFullYear() + 1))
}

export function generateLicenseKey(type: SubscriptionType): string {
  const prefix = type === 'MONTHLY' ? MONTHLY_PREFIX : YEARLY_PREFIX
  const segments = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0')
  )
  return `${prefix}-${segments.join('-')}`
}

export function maskLicenseKey(key: string): string {
  const parts = key.split('-')
  if (parts.length < 3) return key
  const prefix = parts.slice(0, 2).join('-')
  const masked = parts
    .slice(2)
    .map((p, i) => (i < parts.length - 3 ? '••••' : p))
    .join('-')
  return `${prefix}-${masked}`
}

// ── Storage pricing ────────────────────────────────────────

export const STORAGE_PRICING = {
  BASE_GB: 3,
  MAX_GB: 12,
  PRICE_PER_GB_MONTHLY_CENTS: 100, // $1/GB/month
  PRICE_PER_GB_YEARLY_CENTS: 1000, // $10/GB/year (2 months free)
}

export function calculateStoragePrice(
  gbToAdd: number,
  cycle: SubscriptionType
): { cents: number; display: string } {
  const ratePerGB =
    cycle === 'MONTHLY'
      ? STORAGE_PRICING.PRICE_PER_GB_MONTHLY_CENTS
      : STORAGE_PRICING.PRICE_PER_GB_YEARLY_CENTS

  const cents = gbToAdd * ratePerGB
  const dollars = (cents / 100).toFixed(2)
  const period = cycle === 'MONTHLY' ? '/mo' : '/yr'

  return { cents, display: `$${dollars}${period}` }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function bytesToGB(bytes: number): number {
  return bytes / (1024 * 1024 * 1024)
}

export function gbToBytes(gb: number): number {
  return gb * 1024 * 1024 * 1024
}
