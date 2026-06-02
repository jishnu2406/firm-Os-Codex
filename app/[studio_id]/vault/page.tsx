import { redirect } from 'next/navigation'
import FileVaultView from '@/components/vault/FileVaultView'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { FileVaultEntry, Studio } from '@/types'

export default async function VaultPage({
  params,
}: {
  params: Promise<{ studio_id: string }>
}) {
  const { studio_id: studioSlug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('users')
    .select('studio_id')
    .eq('id', user.id)
    .single()

  if (!profile?.studio_id) redirect('/setup-firm')

  const [filesResult, studioResult] = await Promise.all([
    supabase
      .from('file_vault')
      .select('*')
      .eq('studio_id', profile.studio_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('studios')
      .select('id, storage_used, storage_limit')
      .eq('id', profile.studio_id)
      .single(),
  ])

  const studio = studioResult.data as Pick<Studio, 'id' | 'storage_used' | 'storage_limit'> | null

  return (
    <FileVaultView
      initialFiles={(filesResult.data ?? []) as FileVaultEntry[]}
      studioId={profile.studio_id}
      studioSlug={studioSlug}
      userId={user.id}
      storageUsed={studio?.storage_used ?? 0}
      storageLimit={studio?.storage_limit ?? 0}
    />
  )
}
