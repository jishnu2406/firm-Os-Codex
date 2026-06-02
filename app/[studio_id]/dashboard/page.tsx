import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardView from '@/components/dashboard/DashboardView'

export default async function DashboardPage({
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
    .select('studio_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.studio_id) redirect('/setup-firm')

  // Parallel data fetching
  const [projectsResult, filesResult, membersResult] = await Promise.all([
    supabase.from('projects').select('id, name, status, created_at').eq('studio_id', profile.studio_id).order('created_at', { ascending: false }).limit(10),
    supabase.from('file_vault').select('id, file_name, file_type, file_size, created_at, ai_category').eq('studio_id', profile.studio_id).order('created_at', { ascending: false }).limit(8),
    supabase.from('users').select('id, full_name, role, avatar_url, last_seen_at').eq('studio_id', profile.studio_id),
  ])

  const projects = projectsResult.data ?? []
  const files = filesResult.data ?? []
  const members = membersResult.data ?? []

  const stats = {
    total_projects: projects.length,
    active_projects: projects.filter(p => p.status === 'ACTIVE').length,
    total_files: files.length,
    team_members: members.length,
  }

  return (
    <DashboardView
      stats={stats}
      recentProjects={projects}
      recentFiles={files}
      teamMembers={members}
      userRole={profile.role}
      studioSlug={studioSlug}
    />
  )
}
