import { redirect } from 'next/navigation'
import SettingsView from '@/components/settings/SettingsView'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Studio, User } from '@/types'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('firmos_users')
    .select('studio_id')
    .eq('id', user.id)
    .single()

  if (!profile?.studio_id) redirect('/setup-firm')

  const [studioResult, membersResult] = await Promise.all([
    supabase
      .from('studios')
      .select('*')
      .eq('id', profile.studio_id)
      .single(),
    supabase
      .from('firmos_users')
      .select('*')
      .eq('studio_id', profile.studio_id)
      .order('created_at', { ascending: true }),
  ])

  if (!studioResult.data) redirect('/setup-firm')

  return (
    <SettingsView
      studio={studioResult.data as Studio}
      members={(membersResult.data ?? []) as User[]}
    />
  )
}
