import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from '@/types'
import { getSupabaseConfig } from '@/lib/supabase/config'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const { url, publishableKey } = getSupabaseConfig()
  return createServerClient<Database>(
    url,
    publishableKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createAdminSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const { url } = getSupabaseConfig()
  return createClient<Database>(
    url,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
