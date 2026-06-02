// ============================================================
// FIRM OS — Storage Upsell Route
// POST /api/storage-upsell
// Adds storage to a studio (1-12GB @ $1/GB/mo or $10/GB/yr)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { calculateStoragePrice, gbToBytes, STORAGE_PRICING } from '@/lib/utils/license'
import type { SubscriptionType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studio_id, gb_to_add, billing_cycle } = await request.json() as {
      studio_id: string
      gb_to_add: number
      billing_cycle: SubscriptionType
    }

    // Validate inputs
    if (!studio_id || !gb_to_add || !billing_cycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (gb_to_add < 1 || gb_to_add > STORAGE_PRICING.MAX_GB - STORAGE_PRICING.BASE_GB) {
      return NextResponse.json(
        { error: `Storage add-on must be between 1 and ${STORAGE_PRICING.MAX_GB - STORAGE_PRICING.BASE_GB} GB` },
        { status: 400 }
      )
    }

    // Verify user is OWNER/ADMIN of this studio
    const { data: userProfile } = await supabase
      .from('firmos_users')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (userProfile?.studio_id !== studio_id || !['OWNER', 'ADMIN'].includes(userProfile?.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch current studio storage
    const adminSupabase = await createAdminSupabaseClient()
    const { data: studio } = await adminSupabase
      .from('studios')
      .select('storage_limit, extra_storage')
      .eq('id', studio_id)
      .single()

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
    }

    const currentLimitGB = studio.storage_limit / (1024 * 1024 * 1024)
    if (currentLimitGB + gb_to_add > STORAGE_PRICING.MAX_GB) {
      return NextResponse.json(
        { error: `Cannot exceed ${STORAGE_PRICING.MAX_GB}GB total storage limit` },
        { status: 400 }
      )
    }

    const pricing = calculateStoragePrice(gb_to_add, billing_cycle)
    const additionalBytes = gbToBytes(gb_to_add)

    // In production: process payment with Stripe here
    // const paymentIntent = await stripe.paymentIntents.create({ amount: pricing.cents, currency: 'usd' })

    // Update storage limit
    const expiresAt = billing_cycle === 'MONTHLY'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    await adminSupabase
      .from('studios')
      .update({
        storage_limit: studio.storage_limit + additionalBytes,
        extra_storage: (studio.extra_storage ?? 0) + additionalBytes,
      })
      .eq('id', studio_id)

    // Record the addon
    await adminSupabase.from('storage_addons').insert({
      studio_id,
      gb_purchased: gb_to_add,
      price_cents: pricing.cents,
      billing_cycle,
      expires_at: expiresAt.toISOString(),
    })

    return NextResponse.json({
      success: true,
      gb_added: gb_to_add,
      price: pricing.display,
      new_limit_gb: currentLimitGB + gb_to_add,
      expires_at: expiresAt,
    })
  } catch (error) {
    console.error('Storage upsell error:', error)
    return NextResponse.json({ error: 'Storage upgrade failed' }, { status: 500 })
  }
}
