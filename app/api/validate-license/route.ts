// ============================================================
// FIRM OS — License Key Validation Route
// POST /api/validate-license
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { validateLicenseKey } from '@/lib/utils/license'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { license_key, studio_id } = await request.json()

    if (!license_key || !studio_id) {
      return NextResponse.json({ error: 'license_key and studio_id are required' }, { status: 400 })
    }

    // Validate format
    const validation = validateLicenseKey(license_key)
    if (!validation.valid) {
      return NextResponse.json({ success: false, message: validation.message }, { status: 400 })
    }

    // Check if key already used
    const adminSupabase = await createAdminSupabaseClient()
    const { data: existing } = await adminSupabase
      .from('subscriptions')
      .select('id, studio_id')
      .eq('license_key', license_key.toUpperCase())
      .single()

    if (existing && existing.studio_id !== studio_id) {
      return NextResponse.json(
        { success: false, message: 'License key is already in use by another studio.' },
        { status: 409 }
      )
    }

    // Upsert subscription
    const { error: subError } = await adminSupabase
      .from('subscriptions')
      .upsert({
        studio_id,
        license_key: license_key.toUpperCase(),
        type: validation.type!,
        status: 'ACTIVE',
        activated_at: new Date().toISOString(),
        expires_at: validation.expiresAt!.toISOString(),
        grace_period_ends_at: new Date(
          validation.expiresAt!.getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        amount_cents: validation.type === 'MONTHLY' ? 2900 : 29900,
        currency: 'USD',
      }, { onConflict: 'license_key' })

    if (subError) throw subError

    return NextResponse.json({
      success: true,
      type: validation.type,
      expiresAt: validation.expiresAt,
      message: validation.message,
    })
  } catch (error) {
    console.error('License validation error:', error)
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 })
  }
}
