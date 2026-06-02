'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectStatus } from '@/types'

interface ProjectsViewProps {
  initialProjects: Project[]
  studioId: string
  userId: string
}

const STATUSES: ProjectStatus[] = ['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED']

export default function ProjectsView({ initialProjects, studioId, userId }: ProjectsViewProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('DRAFT')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function createProject() {
    if (!name.trim()) {
      setMessage('Project name is required.')
      return
    }

    setIsSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        status,
        studio_id: studioId,
        created_by: userId,
        tags: [],
        metadata: {},
      })
      .select()
      .single()

    setIsSaving(false)

    if (error || !data) {
      setMessage(error?.message ?? 'Project could not be created.')
      return
    }

    setProjects(current => [data as Project, ...current])
    setName('')
    setStatus('DRAFT')
    setShowForm(false)
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: '24px', fontWeight: 600 }}>Projects</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>
            {projects.length} project{projects.length === 1 ? '' : 's'}
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(current => !current)} style={primaryButtonStyle}>
          New Project
        </button>
      </div>

      {showForm && (
        <div className="surface" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 180px auto', gap: '12px', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: '6px', color: 'var(--muted)', fontSize: '12px' }}>
            Name
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              style={inputStyle}
              placeholder="Client launch system"
            />
          </label>
          <label style={{ display: 'grid', gap: '6px', color: 'var(--muted)', fontSize: '12px' }}>
            Status
            <select value={status} onChange={event => setStatus(event.target.value as ProjectStatus)} style={inputStyle}>
              {STATUSES.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => void createProject()} disabled={isSaving} style={primaryButtonStyle}>
            {isSaving ? 'Saving...' : 'Create'}
          </button>
        </div>
      )}

      {message && (
        <div className="surface" style={{ padding: '12px 14px', color: 'var(--text)' }}>
          {message}
        </div>
      )}

      <div className="surface" style={{ overflow: 'hidden' }}>
        {projects.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)' }}>
            No projects yet.
          </div>
        ) : (
          projects.map(project => (
            <div
              key={project.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px, 1fr) 140px 140px',
                gap: '14px',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {project.name}
                </div>
                {project.description && (
                  <div style={{ color: 'var(--muted)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.description}
                  </div>
                )}
              </div>
              <span style={badgeStyle}>{project.status}</span>
              <span style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'right' }}>
                {formatDate(project.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

const primaryButtonStyle = {
  padding: '10px 16px',
  background: 'var(--accent)',
  border: '1px solid var(--accent)',
  borderRadius: '8px',
  color: 'var(--bg)',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
} as const

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: '13px',
} as const

const badgeStyle = {
  justifySelf: 'start',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  background: 'var(--bg)',
  color: 'var(--accent)',
  padding: '4px 9px',
  fontSize: '11px',
  fontWeight: 700,
} as const
