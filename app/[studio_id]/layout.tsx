import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudioShell from '@/components/dashboard/StudioShell'
import type { Studio, Subscription, User } from '@/types'

export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ studio_id: string }>
}) {
  const { studio_id: studioSlug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.studio_id) redirect('/setup-firm')

  const [studioResult, subscriptionResult] = await Promise.all([
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
  ])

  if (!studioResult.data) redirect('/setup-firm')

  return (
    <StudioShell
      user={profile as User}
      studio={studioResult.data as Studio}
      subscription={subscriptionResult.data as Subscription | null}
      studioSlug={studioSlug}
    >
      {children}
    </StudioShell>
  )
}
