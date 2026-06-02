'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatBytes } from '@/lib/utils/license'
import type { FileType, FileVaultEntry } from '@/types'

type VaultFilter = 'ALL' | 'PDF' | 'IMAGE' | 'DOC' | 'AI'
type UploadStatus = 'uploading' | 'done' | 'error'
type AnalysisStatus = 'pending' | 'unavailable'

interface UploadItem {
  id: string
  name: string
  progress: number
  status: UploadStatus
  message: string
}

interface FileVaultViewProps {
  initialFiles: FileVaultEntry[]
  studioId: string
  studioSlug: string
  userId: string
  storageUsed: number
  storageLimit: number
}

const ACCEPTED_EXTENSIONS = '.pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt'
const FILTERS: { key: VaultFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PDF', label: 'PDF' },
  { key: 'IMAGE', label: 'Image' },
  { key: 'DOC', label: 'Doc' },
  { key: 'AI', label: 'AI Processed' },
]

const FILE_ICONS: Record<FileType, string> = {
  PDF: '📄',
  IMAGE: '🖼️',
  DOC: '📝',
  VIDEO: '🎬',
  OTHER: '📎',
}

export default function FileVaultView({
  initialFiles,
  studioId,
  studioSlug,
  userId,
  storageUsed,
  storageLimit,
}: FileVaultViewProps) {
  const supabase = useMemo(() => createClient(), [])
  const inputRef = useRef<HTMLInputElement>(null)
  const analysisTimers = useRef<Record<string, number>>({})
  const [files, setFiles] = useState<FileVaultEntry[]>(initialFiles)
  const [filter, setFilter] = useState<VaultFilter>('ALL')
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [analysisStates, setAnalysisStates] = useState<Record<string, AnalysisStatus>>({})
  const [localStorageUsed, setLocalStorageUsed] = useState(storageUsed)

  const activeFiles = useMemo(
    () => files.filter(file => !file.is_archived),
    [files]
  )

  const filteredFiles = useMemo(() => {
    if (filter === 'AI') return activeFiles.filter(file => file.ai_processed)
    if (filter === 'ALL') return activeFiles
    return activeFiles.filter(file => file.file_type === filter)
  }, [activeFiles, filter])

  const quotaExceeded = error?.toLowerCase().includes('storage quota')

  useEffect(() => {
    const pendingIds = Object.entries(analysisStates)
      .filter(([, status]) => status === 'pending')
      .map(([id]) => id)

    if (pendingIds.length === 0) return

    const poll = window.setInterval(async () => {
      const { data } = await supabase
        .from('file_vault')
        .select('*')
        .in('id', pendingIds)

      if (!data) return

      const completedIds = new Set(
        data
          .filter(row => row.ai_processed)
          .map(row => row.id)
      )

      if (completedIds.size === 0) return

      setFiles(current =>
        current.map(file => {
          const refreshed = data.find(row => row.id === file.id)
          return refreshed ? (refreshed as FileVaultEntry) : file
        })
      )

      setAnalysisStates(current => {
        const next = { ...current }
        completedIds.forEach(id => {
          delete next[id]
          window.clearTimeout(analysisTimers.current[id])
          delete analysisTimers.current[id]
        })
        return next
      })
    }, 4000)

    return () => window.clearInterval(poll)
  }, [analysisStates, supabase])

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return
    await uploadFiles(Array.from(fileList))
    if (inputRef.current) inputRef.current.value = ''
  }

  async function uploadFiles(selectedFiles: File[]) {
    setError(null)

    for (const file of selectedFiles) {
      if (!isAcceptedFile(file)) {
        setError(`${file.name} is not an accepted vault file type.`)
        continue
      }

      if (localStorageUsed + file.size > storageLimit) {
        setError('Storage quota exceeded. Add storage from /billing before uploading more files.')
        continue
      }

      const uploadId = crypto.randomUUID()
      const progressTimer = window.setInterval(() => {
        setUploads(current =>
          current.map(item =>
            item.id === uploadId
              ? { ...item, progress: Math.min(item.progress + 8, 90) }
              : item
          )
        )
      }, 250)

      setUploads(current => [
        ...current,
        { id: uploadId, name: file.name, progress: 8, status: 'uploading', message: 'Uploading' },
      ])

      try {
        const fileType = resolveFileType(file)
        const safeName = file.name.replace(/[^a-zA-Z0-9._ -]/g, '_')
        const storagePath = `${studioId}/${crypto.randomUUID()}-${safeName}`

        const { error: uploadError } = await supabase.storage
          .from('firm-vault')
          .upload(storagePath, file, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: signedData } = await supabase.storage
          .from('firm-vault')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 7)
        const { data: publicData } = supabase.storage
          .from('firm-vault')
          .getPublicUrl(storagePath)
        const fileUrl = signedData?.signedUrl ?? publicData.publicUrl

        const { data: insertedFile, error: insertError } = await supabase
          .from('file_vault')
          .insert({
            file_name: file.name,
            file_url: fileUrl,
            storage_path: storagePath,
            file_size: file.size,
            file_type: fileType,
            mime_type: file.type || null,
            studio_id: studioId,
            uploaded_by: userId,
            ai_tags: [],
            ai_processed: false,
            is_archived: false,
            metadata: {},
          })
          .select()
          .single()

        if (insertError || !insertedFile) throw insertError ?? new Error('File row was not created.')

        const vaultFile = insertedFile as FileVaultEntry
        setFiles(current => [vaultFile, ...current])
        setLocalStorageUsed(current => current + file.size)
        setUploads(current =>
          current.map(item =>
            item.id === uploadId
              ? { ...item, progress: 100, status: 'done', message: 'Analyzing' }
              : item
          )
        )
        window.setTimeout(() => {
          setUploads(current => current.filter(item => item.id !== uploadId))
        }, 2500)

        void triggerAnalysis(vaultFile)
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
        setUploads(current =>
          current.map(item =>
            item.id === uploadId
              ? { ...item, progress: 100, status: 'error', message: 'Upload failed' }
              : item
          )
        )
      } finally {
        window.clearInterval(progressTimer)
      }
    }
  }

  async function triggerAnalysis(file: FileVaultEntry) {
    setAnalysisStates(current => ({ ...current, [file.id]: 'pending' }))
    analysisTimers.current[file.id] = window.setTimeout(() => {
      setAnalysisStates(current => {
        if (current[file.id] !== 'pending') return current
        return { ...current, [file.id]: 'unavailable' }
      })
    }, 30000)

    try {
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: file.id,
          file_url: file.file_url,
          file_type: file.file_type,
          file_name: file.file_name,
        }),
      })

      if (!response.ok) throw new Error('AI analysis failed.')

      const payload = await response.json()
      if (payload.analysis) {
        setFiles(current =>
          current.map(item =>
            item.id === file.id
              ? {
                  ...item,
                  ai_summary: payload.analysis.summary,
                  ai_tags: payload.analysis.tags ?? [],
                  ai_category: payload.analysis.category,
                  ai_processed: true,
                }
              : item
          )
        )
        setAnalysisStates(current => {
          const next = { ...current }
          delete next[file.id]
          return next
        })
        window.clearTimeout(analysisTimers.current[file.id])
        delete analysisTimers.current[file.id]
      }
    } catch {
      // The timeout badge and polling loop handle the user-visible state.
    }
  }

  async function archiveFile(fileId: string) {
    const { error: archiveError } = await supabase
      .from('file_vault')
      .update({ is_archived: true })
      .eq('id', fileId)

    if (archiveError) {
      setError(archiveError.message)
      return
    }

    setFiles(current =>
      current.map(file => (file.id === fileId ? { ...file, is_archived: true } : file))
    )
  }

  async function deleteFile(file: FileVaultEntry) {
    if (!window.confirm(`Delete "${file.file_name}" from the vault?`)) return

    const { error: deleteError } = await supabase
      .from('file_vault')
      .delete()
      .eq('id', file.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    void supabase.storage.from('firm-vault').remove([file.storage_path])
    setFiles(current => current.filter(item => item.id !== file.id))
    setLocalStorageUsed(current => Math.max(0, current - file.file_size))
  }

  function openFilePicker() {
    inputRef.current?.click()
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: '24px', fontWeight: 600 }}>
            File Vault
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>
            {formatBytes(localStorageUsed)} used of {formatBytes(storageLimit)}
          </p>
        </div>
        <button
          type="button"
          onClick={openFilePicker}
          style={primaryButtonStyle}
        >
          Browse files
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS}
        onChange={event => void handleFilesSelected(event.target.files)}
        style={{ display: 'none' }}
      />

      <div
        className={`surface-inset ${isDragging ? 'drop-zone-active' : ''}`}
        onDragEnter={event => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={event => {
          event.preventDefault()
          setIsDragging(false)
          void uploadFiles(Array.from(event.dataTransfer.files))
        }}
        style={{
          minHeight: '168px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '28px',
          borderStyle: 'dashed',
          transition: 'border-color 160ms ease, box-shadow 160ms ease, background 160ms ease',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '34px', lineHeight: 1 }}>📎</div>
          <div style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 600 }}>
            Drop files here
          </div>
          <button type="button" onClick={openFilePicker} style={secondaryButtonStyle}>
            Browse files
          </button>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="surface" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {uploads.map(item => (
            <div key={item.id} style={{ display: 'grid', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: 'var(--text)', fontSize: '12px' }}>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
                <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{item.message}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${item.progress}%`,
                    height: '100%',
                    background: item.status === 'error' ? 'var(--muted)' : 'var(--accent)',
                    transition: 'width 240ms ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="surface" style={{ padding: '12px 14px', color: 'var(--text)', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span>{error}</span>
          {quotaExceeded && (
            <Link href={`/${studioSlug}/billing`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Open /billing
            </Link>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FILTERS.map(item => {
            const isActive = filter === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                style={{
                  ...filterButtonStyle,
                  background: isActive ? 'var(--accent)' : 'var(--surface)',
                  color: isActive ? 'var(--bg)' : 'var(--text)',
                  borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
          {filteredFiles.length} file{filteredFiles.length === 1 ? '' : 's'}
        </span>
      </div>

      {activeFiles.length === 0 ? (
        <EmptyVault onUpload={openFilePicker} />
      ) : filteredFiles.length === 0 ? (
        <div className="surface" style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)' }}>
          No files match this filter.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '14px',
          }}
        >
          {filteredFiles.map(file => (
            <article
              key={file.id}
              className="surface"
              onMouseEnter={() => setHoveredFileId(file.id)}
              onMouseLeave={() => setHoveredFileId(null)}
              style={{
                minHeight: '188px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '24px', lineHeight: 1 }}>{FILE_ICONS[file.file_type] ?? FILE_ICONS.OTHER}</span>
                {renderAiBadge(file, analysisStates[file.id])}
              </div>

              <div style={{ minWidth: 0 }}>
                <div title={file.file_name} style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.file_name}
                </div>
                {file.ai_summary && (
                  <div title={file.ai_summary} style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.ai_summary}
                  </div>
                )}
              </div>

              {file.ai_tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {file.ai_tags.slice(0, 5).map(tag => (
                    <span key={tag} style={tagStyle}>{tag}</span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 'auto', display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', color: 'var(--muted)', fontSize: '11px' }}>
                  <span>{formatBytes(file.file_size)}</span>
                  <span>{formatDate(file.created_at)}</span>
                </div>
                <div
                  style={{
                    display: hoveredFileId === file.id ? 'flex' : 'none',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button type="button" onClick={() => window.open(file.file_url, '_blank', 'noreferrer')} style={actionButtonStyle}>
                    Download
                  </button>
                  <button type="button" onClick={() => void archiveFile(file.id)} style={actionButtonStyle}>
                    Archive
                  </button>
                  <button type="button" onClick={() => void deleteFile(file)} style={actionButtonStyle}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyVault({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="surface" style={{ minHeight: '320px', padding: '44px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <pre aria-hidden style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.1 }}>
{`      ______
    /      /|
   /______/ |
   |      | |
   | VAULT| /
   |______|/`}
        </pre>
        <h2 style={{ color: 'var(--text)', fontSize: '18px', fontWeight: 600 }}>Your vault is empty</h2>
        <button type="button" onClick={onUpload} style={primaryButtonStyle}>
          Upload files
        </button>
      </div>
    </div>
  )
}

function renderAiBadge(file: FileVaultEntry, status?: AnalysisStatus) {
  if (file.ai_processed) {
    return <span style={badgeStyle}>AI</span>
  }

  if (status === 'pending') {
    return <span className="animate-pulse-glow" style={badgeStyle}>Analyzing...</span>
  }

  if (status === 'unavailable') {
    return <span style={badgeStyle}>Analysis unavailable</span>
  }

  return null
}

function resolveFileType(file: File): FileType {
  if (file.type === 'application/pdf') return 'PDF'
  if (file.type.startsWith('image/')) return 'IMAGE'
  if (
    file.type === 'application/msword' ||
    file.type.startsWith('application/vnd.openxmlformats')
  ) {
    return 'DOC'
  }
  return 'OTHER'
}

function isAcceptedFile(file: File) {
  const name = file.name.toLowerCase()
  return (
    file.type === 'application/pdf' ||
    file.type.startsWith('image/') ||
    file.type === 'application/msword' ||
    file.type.startsWith('application/vnd.openxmlformats') ||
    file.type === 'text/plain' ||
    ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.doc', '.docx', '.txt'].some(ext => name.endsWith(ext))
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

const secondaryButtonStyle = {
  padding: '9px 14px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
} as const

const filterButtonStyle = {
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontFamily: 'inherit',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
} as const

const actionButtonStyle = {
  padding: '6px 8px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: '11px',
  cursor: 'pointer',
} as const

const badgeStyle = {
  border: '1px solid var(--border)',
  borderRadius: '999px',
  background: 'var(--bg)',
  color: 'var(--accent)',
  padding: '3px 7px',
  fontSize: '10px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const

const tagStyle = {
  border: '1px solid var(--border)',
  borderRadius: '999px',
  background: 'var(--bg)',
  color: 'var(--muted)',
  padding: '2px 7px',
  fontSize: '10px',
} as const
