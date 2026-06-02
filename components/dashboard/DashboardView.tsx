'use client'
// ============================================================
// FIRM OS — Dashboard View (Command Center)
// ============================================================

import { usePreferences } from '@/lib/hooks/usePreferences'
import type { FileType, UserRole, ProjectStatus } from '@/types'

interface Stats {
  total_projects: number
  active_projects: number
  total_files: number
  team_members: number
}

interface Props {
  stats: Stats
  recentProjects: RecentProject[]
  recentFiles: RecentFile[]
  teamMembers: TeamMember[]
  userRole: UserRole
  studioSlug: string
}

interface RecentProject {
  id: string
  name: string
  status: ProjectStatus
  created_at: string
}

interface RecentFile {
  id: string
  file_name: string
  file_type: FileType
  file_size: number
  created_at: string
  ai_category: string | null
}

interface TeamMember {
  id: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  last_seen_at: string | null
}

const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  DRAFT: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' },
  ACTIVE: { bg: 'rgba(90,175,106,0.15)', text: '#5aaf6a' },
  REVIEW: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  COMPLETED: { bg: 'rgba(107,124,255,0.15)', text: '#6b7cff' },
  ARCHIVED: { bg: 'rgba(107,114,128,0.08)', text: '#6b7280' },
}

const FILE_ICONS: Record<string, string> = {
  PDF: '📄',
  IMAGE: '🖼',
  DOC: '📝',
  VIDEO: '🎬',
  OTHER: '📎',
}

export default function DashboardView({ stats, recentProjects, recentFiles, teamMembers, userRole, studioSlug }: Props) {
  const { layout } = usePreferences()

  const isCompact = layout === 'compact'
  const pad = isCompact ? '16px' : '24px'
  const gap = isCompact ? '12px' : '20px'
  const cardPad = isCompact ? '16px' : '24px'

  return (
    <div style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: gap }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontSize: isCompact ? '18px' : '22px',
            fontWeight: '600', letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}>
            Command Center
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) && (
          <a
            href={`/${studioSlug}/projects`}
            style={{
              padding: '8px 16px', background: 'var(--accent)',
              border: 'none', borderRadius: '8px', color: '#fff',
              fontSize: '13px', fontWeight: '500', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}
          >
            + New Project
          </a>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap,
      }}>
        {[
          { label: 'Total Projects', value: stats.total_projects, icon: '◫', delta: null },
          { label: 'Active Now', value: stats.active_projects, icon: '◉', delta: null },
          { label: 'Vault Files', value: stats.total_files, icon: '⬡', delta: null },
          { label: 'Team Members', value: stats.team_members, icon: '◎', delta: null },
        ].map((stat, i) => (
          <div key={i} className="surface animate-fade-in" style={{
            padding: cardPad,
            animationDelay: `${i * 60}ms`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: isCompact ? '24px' : '32px', fontWeight: '300', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {stat.value}
                </p>
              </div>
              <span style={{
                width: '32px', height: '32px',
                background: 'rgba(107,124,255,0.1)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', color: 'var(--accent)',
              }}>
                {stat.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid: Projects + Files ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: layout === 'ai-desired'
          ? (stats.total_files > stats.total_projects ? '1fr 1.5fr' : '1.5fr 1fr')
          : '1fr 1fr',
        gap,
        alignItems: 'start',
      }}>
        {/* Recent Projects */}
        <div className="surface animate-fade-in" style={{ padding: cardPad, animationDelay: '240ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Recent Projects</h2>
            <a href={`/${studioSlug}/projects`} style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}>View all →</a>
          </div>

          {recentProjects.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              No projects yet. Create your first project to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentProjects.slice(0, 6).map(project => {
                const sc = STATUS_COLORS[project.status as ProjectStatus] ?? STATUS_COLORS.DRAFT
                return (
                  <div key={project.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: isCompact ? '8px' : '10px',
                    borderRadius: '8px',
                    transition: 'background 0.1s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: sc.text, flexShrink: 0,
                    }} />
                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.name}
                    </span>
                    <span style={{
                      fontSize: '10px', padding: '2px 7px', borderRadius: '99px',
                      background: sc.bg, color: sc.text,
                      fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {project.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Vault Files */}
        <div className="surface animate-fade-in" style={{ padding: cardPad, animationDelay: '300ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>File Vault</h2>
            <a href={`/${studioSlug}/vault`} style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}>Open vault →</a>
          </div>

          {recentFiles.length === 0 ? (
            <div style={{
              padding: '32px 16px',
              border: '1px dashed var(--border)', borderRadius: '10px',
              textAlign: 'center', color: 'var(--muted)', fontSize: '13px',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⬡</div>
              Drag files here or open the File Vault to upload assets.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentFiles.slice(0, 6).map(file => (
                <div key={file.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: isCompact ? '8px' : '10px', borderRadius: '8px',
                  transition: 'background 0.1s', cursor: 'pointer',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <span style={{ fontSize: '16px' }}>{FILE_ICONS[file.file_type] ?? '📎'}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.file_name}
                    </div>
                    {file.ai_category && (
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{file.ai_category}</div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '10px', color: 'var(--muted)',
                    background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px',
                  }}>
                    {file.file_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Team Members ── */}
      <div className="surface animate-fade-in" style={{ padding: cardPad, animationDelay: '360ms' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Team</h2>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {teamMembers.map(member => (
            <div key={member.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: '8px',
            }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: member.avatar_url ? `url(${member.avatar_url}) center/cover` : 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', color: '#fff', fontWeight: '600',
                flexShrink: 0,
              }}>
                {!member.avatar_url && member.full_name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{member.full_name}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
