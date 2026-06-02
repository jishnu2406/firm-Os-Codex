// ============================================================
// FIRM OS — Core Type Definitions
// ============================================================

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'DESIGNER' | 'MEMBER'
export type SubscriptionType = 'MONTHLY' | 'YEARLY'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'HOLD'
export type StudioTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
export type FileType = 'PDF' | 'IMAGE' | 'DOC' | 'VIDEO' | 'OTHER'
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED'

// ============================================================
// DATABASE MODELS
// ============================================================

export interface Studio {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  updated_at: string
  current_tier: StudioTier
  storage_used: number
  storage_limit: number
  extra_storage: number
  settings: StudioSettings
  is_active: boolean
}

export interface StudioSettings {
  theme: WorkspaceTheme
  font: FontStyle
  layout: WorkspaceLayout
  notifications: boolean
}

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  studio_id: string | null
  created_at: string
  updated_at: string
  last_seen_at: string | null
  onboarded: boolean
  preferences: UserPreferences
}

export interface UserPreferences {
  theme?: WorkspaceTheme
  font?: FontStyle
  layout?: WorkspaceLayout
  sidebar_collapsed?: boolean
  notifications_email?: boolean
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  studio_id: string
  created_by: string | null
  created_at: string
  updated_at: string
  due_date: string | null
  cover_url: string | null
  tags: string[]
  metadata: Record<string, unknown>
}

export interface FileVaultEntry {
  id: string
  file_name: string
  file_url: string
  storage_path: string
  file_size: number
  file_type: FileType
  mime_type: string | null
  project_id: string | null
  studio_id: string
  uploaded_by: string | null
  created_at: string
  ai_summary: string | null
  ai_tags: string[]
  ai_category: string | null
  ai_processed: boolean
  thumbnail_url: string | null
  is_archived: boolean
  metadata: Record<string, unknown>
}

export interface Subscription {
  id: string
  studio_id: string
  license_key: string
  type: SubscriptionType
  status: SubscriptionStatus
  created_at: string
  updated_at: string
  expires_at: string
  activated_at: string | null
  cancelled_at: string | null
  grace_period_ends_at: string | null
  amount_cents: number
  currency: string
  metadata: Record<string, unknown>
}

export interface StorageAddon {
  id: string
  studio_id: string
  gb_purchased: number
  price_cents: number
  billing_cycle: SubscriptionType
  purchased_at: string
  expires_at: string | null
}

// ============================================================
// DESIGN SYSTEM TYPES
// ============================================================

export type WorkspaceTheme =
  | 'slate-dark'
  | 'slate-light'
  | 'obsidian'
  | 'arctic'
  | 'taupe'
  | 'mocha'
  | 'forest'
  | 'high-contrast'
  | 'warm-cream'
  | 'midnight-blue'

export type FontStyle =
  | 'geist'
  | 'inter'
  | 'dm-sans'
  | 'plus-jakarta'
  | 'sora'
  | 'editorial-new'
  | 'pp-neue-montreal'
  | 'freight-display'
  | 'cormorant'
  | 'instrument-serif'

export type WorkspaceLayout = 'compact' | 'optimized' | 'normal' | 'ai-desired'

export interface ThemeConfig {
  id: WorkspaceTheme
  label: string
  preview: string
  bg: string
  surface: string
  border: string
  text: string
  accent: string
  muted: string
  isDark: boolean
}

export interface FontConfig {
  id: FontStyle
  label: string
  family: string
  category: 'sans' | 'serif' | 'display'
  specimen: string
}

export interface LayoutConfig {
  id: WorkspaceLayout
  label: string
  description: string
  icon: string
}

// ============================================================
// APP STATE & CONTEXT
// ============================================================

export interface AppContext {
  studio: Studio | null
  user: User | null
  subscription: Subscription | null
  preferences: PreferencesState
  isLoading: boolean
}

export interface PreferencesState {
  theme: WorkspaceTheme
  font: FontStyle
  layout: WorkspaceLayout
  setTheme: (theme: WorkspaceTheme) => void
  setFont: (font: FontStyle) => void
  setLayout: (layout: WorkspaceLayout) => void
}

// ============================================================
// API TYPES
// ============================================================

export interface LicenseValidationResult {
  valid: boolean
  type: SubscriptionType | null
  message: string
  expiresAt?: Date
}

export interface StorageUpsellRequest {
  studio_id: string
  gb_to_add: number
  billing_cycle: SubscriptionType
}

export interface AIAnalysisResult {
  summary: string
  category: string
  tags: string[]
  confidence: number
  extractedText?: string
}

export interface FileUploadResult {
  id: string
  file_url: string
  storage_path: string
  ai_analysis?: AIAnalysisResult
}

export interface DashboardStats {
  total_projects: number
  active_projects: number
  total_files: number
  storage_used: number
  storage_limit: number
  team_members: number
  recent_activity: AuditEntry[]
}

export interface AuditEntry {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  created_at: string
  metadata: Record<string, unknown>
}

// ============================================================
// FORM TYPES
// ============================================================

export interface SetupFirmForm {
  studio_name: string
  studio_slug: string
  license_key: string
  role: UserRole
}

export interface ProjectForm {
  name: string
  description: string
  status: ProjectStatus
  due_date: string
  tags: string[]
}

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

type SupabaseTable<Row> = {
  Row: Row & Record<string, unknown>
  Insert: Partial<Row> & Record<string, unknown>
  Update: Partial<Row> & Record<string, unknown>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      studios: SupabaseTable<Studio>
      firmos_users: SupabaseTable<User>
      firmos_projects: SupabaseTable<Project>
      file_vault: SupabaseTable<FileVaultEntry>
      subscriptions: SupabaseTable<Subscription>
      storage_addons: SupabaseTable<StorageAddon>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      subscription_type: SubscriptionType
      subscription_status: SubscriptionStatus
      file_type: FileType
      project_status: ProjectStatus
    }
    CompositeTypes: Record<string, never>
  }
}
