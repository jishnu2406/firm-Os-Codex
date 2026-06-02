// ============================================================
// FIRM OS — Supabase Client Utilities
// ============================================================

// ── lib/supabase/client.ts ──────────────────────────────────
// Browser-side client (React components)

import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/types'
import { getSupabaseConfig } from '@/lib/supabase/config'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (client) return client
  const { url, publishableKey } = getSupabaseConfig()
  client = createBrowserClient<Database>(
    url,
    publishableKey
  )
  return client
}

export { getSupabaseBrowserClient as createClient }
