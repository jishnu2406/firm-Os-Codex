import { NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseConfig } from '@/lib/supabase/config'

type LoginBody = {
  username?: string
  password?: string
  redirect?: string
}

const USERNAME_EMAIL_DOMAIN = 'firmos.app'

export async function POST(request: Request) {
  let body: LoginBody

  try {
    body = await request.json() as LoginBody
  } catch {
    return jsonError('Enter a username and password.', 400)
  }

  const username = normalizeUsername(body.username ?? '')
  const password = body.password ?? ''
  const redirectTo = sanitizeRedirect(body.redirect)

  if (!username) {
    return jsonError('Enter a valid username.', 400)
  }

  if (!password) {
    return jsonError('Enter your password.', 400)
  }

  const email = `${username}@${USERNAME_EMAIL_DOMAIN}`
  const supabase = await createServerSupabaseClient()
  const signedIn = await signInWithPassword(supabase, email, password)

  if (signedIn.ok) {
    await supabase
      .from('firmos_users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', signedIn.userId)

    return NextResponse.json({ redirectTo })
  }

  if (!isInitialAccessPassword(password)) {
    return jsonError('Wrong username or password. Use your current studio password.', 401)
  }

  const created = await createFirstTimeOwnerAccount(supabase, username, email, password)

  if (!created.ok) {
    return jsonError(created.message, created.status)
  }

  return NextResponse.json({ redirectTo })
}

async function signInWithPassword(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { ok: false as const }
  }

  return { ok: true as const, userId: data.user.id }
}

async function createFirstTimeOwnerAccount(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  username: string,
  email: string,
  password: string
) {
  const fullName = usernameToDisplayName(username)

  if (hasUsableServiceRoleKey()) {
    const admin = await createAdminSupabaseClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username,
        auth_method: 'firmos_username_password',
      },
    })

    if (error || !data.user) {
      const message = error?.message.toLowerCase().includes('already')
        ? 'This username already exists. Sign in with the password set for that studio owner.'
        : error?.message ?? 'Could not create the studio owner account.'
      return { ok: false as const, status: 409, message }
    }

    await admin
      .from('firmos_users')
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'MEMBER',
      }, { onConflict: 'id' })
  } else {
    const emailAutoConfirmEnabled = await isEmailAutoConfirmEnabled()

    if (!emailAutoConfirmEnabled) {
      return {
        ok: false as const,
        status: 503,
        message: 'First-time username login needs SUPABASE_SERVICE_ROLE_KEY in Vercel, or Supabase Auth email confirmations must be turned off.',
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
          auth_method: 'firmos_username_password',
        },
      },
    })

    if (error) {
      const message = error.message.toLowerCase().includes('already')
        ? 'This username already exists. Sign in with the password set for that studio owner.'
        : error.message
      return { ok: false as const, status: 409, message }
    }

    if (!data.session) {
      return {
        ok: false as const,
        status: 503,
        message: 'Account created, but Supabase is waiting for email confirmation. Add SUPABASE_SERVICE_ROLE_KEY in Vercel or disable email confirmations in Supabase Auth.',
      }
    }
  }

  const signedIn = await signInWithPassword(supabase, email, password)

  if (!signedIn.ok) {
    return {
      ok: false as const,
      status: 503,
      message: 'The owner account was created, but the sign-in session could not be started. Try signing in again.',
    }
  }

  await supabase
    .from('firmos_users')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', signedIn.userId)

  return { ok: true as const }
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function usernameToDisplayName(username: string) {
  return username
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isInitialAccessPassword(password: string) {
  const initialPassword = process.env.FIRMOS_INITIAL_ACCESS_PASSWORD
  return Boolean(initialPassword) && password === initialPassword
}

function hasUsableServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(key && !key.startsWith('your_') && !key.startsWith('sb_publishable_'))
}

async function isEmailAutoConfirmEnabled() {
  try {
    const { url, publishableKey } = getSupabaseConfig()
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
    })

    if (!response.ok) return false

    const settings = await response.json() as { mailer_autoconfirm?: boolean }
    return settings.mailer_autoconfirm === true
  } catch {
    return false
  }
}

function sanitizeRedirect(value?: string) {
  if (value?.startsWith('/') && !value.startsWith('//')) return value
  return '/'
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}
