// ============================================================
// FIRM OS — Next.js Middleware
// Handles: Auth, Multi-tenant routing, Subscription gating
// ============================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/auth', '/auth/callback', '/setup-firm', '/subscription-expired']
const STATIC_PREFIXES = ['/_next', '/favicon', '/public', '/api/webhooks']

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Skip static assets
  if (STATIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r)) || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Create Supabase client with cookie-based session management
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user }, error } = await supabase.auth.getUser()

  // ──────────────────────────────────────────────────────────
  // UNAUTHENTICATED — redirect to auth
  // ──────────────────────────────────────────────────────────
  if (!user || error) {
    // Persist intended destination
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ──────────────────────────────────────────────────────────
  // AUTHENTICATED — resolve studio context
  // ──────────────────────────────────────────────────────────

  const { data: profile } = await supabase
    .from('firmos_users')
    .select('id, studio_id, onboarded, role')
    .eq('id', user.id)
    .single()

  // ── New user — no studio yet → onboarding wizard
  if (!profile?.studio_id || !profile?.onboarded) {
    if (!pathname.startsWith('/setup-firm')) {
      return NextResponse.redirect(new URL('/setup-firm', request.url))
    }
    return response
  }

  const { data: studio } = await supabase
    .from('studios')
    .select('id, slug, is_active')
    .eq('id', profile.studio_id)
    .single()

  const studioSlug = studio?.slug
  if (!studioSlug) {
    return NextResponse.redirect(new URL('/setup-firm', request.url))
  }

  // ── Root path → redirect to studio dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${studioSlug}/dashboard`, request.url))
  }

  // ── Already on setup-firm but has studio → redirect to dashboard
  if (pathname.startsWith('/setup-firm')) {
    return NextResponse.redirect(new URL(`/${studioSlug}/dashboard`, request.url))
  }

  // ── Subscription gating (skip for billing/expired routes)
  const isExemptRoute =
    pathname.endsWith('/billing') ||
    pathname.includes('/subscription') ||
    pathname.startsWith('/subscription-expired')

  if (!isExemptRoute) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, expires_at, grace_period_ends_at')
      .eq('studio_id', profile.studio_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const isBlocked = isSubscriptionBlocked(subscription)

    if (isBlocked) {
      const expiredUrl = new URL(`/${studioSlug}/billing`, request.url)
      expiredUrl.searchParams.set('gate', 'subscription')
      return NextResponse.redirect(expiredUrl)
    }
  }

  // ── Validate studio slug in URL matches the user's studio
  const studioInPath = pathname.split('/')[1]
  if (
    studioInPath &&
    !PUBLIC_ROUTES.some(r => pathname.startsWith(r)) &&
    studioInPath !== studioSlug &&
    !studioInPath.startsWith('_') &&
    !studioInPath.startsWith('api')
  ) {
    // Cross-tenant access attempt — redirect to own dashboard
    return NextResponse.redirect(new URL(`/${studioSlug}/dashboard`, request.url))
  }

  // Attach studio context to headers for server components
  response.headers.set('x-studio-id', studio?.id ?? '')
  response.headers.set('x-studio-slug', studioSlug ?? '')
  response.headers.set('x-user-role', profile.role ?? 'MEMBER')

  return response
}

// ──────────────────────────────────────────────────────────
// Subscription block logic with grace period
// ──────────────────────────────────────────────────────────
function isSubscriptionBlocked(subscription: any): boolean {
  if (!subscription) return true // No subscription = blocked

  const { status, expires_at, grace_period_ends_at } = subscription

  if (status === 'ACTIVE') return false

  if (status === 'HOLD') return true

  if (status === 'EXPIRED') {
    // Allow 7-day grace period
    if (grace_period_ends_at) {
      return new Date() > new Date(grace_period_ends_at)
    }
    return new Date() > new Date(expires_at)
  }

  return true
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
