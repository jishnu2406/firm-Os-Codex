import { redirect } from 'next/navigation'
import ProjectsView from '@/components/projects/ProjectsView'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

export default async function ProjectsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('users')
    .select('studio_id')
    .eq('id', user.id)
    .single()

  if (!profile?.studio_id) redirect('/setup-firm')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('studio_id', profile.studio_id)
    .order('created_at', { ascending: false })

  return (
    <ProjectsView
      initialProjects={(projects ?? []) as Project[]}
      studioId={profile.studio_id}
      userId={user.id}
    />
  )
}
