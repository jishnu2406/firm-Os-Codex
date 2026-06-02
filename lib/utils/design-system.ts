// ============================================================
// FIRM OS — Design System Configuration
// 10 Themes × 10 Fonts × 4 Layouts
// ============================================================

import type { ThemeConfig, FontConfig, LayoutConfig, WorkspaceTheme, FontStyle, WorkspaceLayout } from '@/types'

// ── WORKSPACE THEMES ──────────────────────────────────────

export const THEMES: ThemeConfig[] = [
  {
    id: 'slate-dark',
    label: 'Slate Dark',
    preview: '#1a1d23',
    bg: '#0f1117',
    surface: '#1a1d23',
    border: '#2a2d35',
    text: '#e8eaf0',
    accent: '#6b7cff',
    muted: '#6b7280',
    isDark: true,
  },
  {
    id: 'slate-light',
    label: 'Slate Light',
    preview: '#f1f3f9',
    bg: '#f8f9fc',
    surface: '#ffffff',
    border: '#e2e5ed',
    text: '#1a1d23',
    accent: '#4f5eff',
    muted: '#8b8fa8',
    isDark: false,
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    preview: '#0a0a0f',
    bg: '#050508',
    surface: '#0f0f18',
    border: '#1c1c28',
    text: '#d4d4f0',
    accent: '#9b59e8',
    muted: '#525270',
    isDark: true,
  },
  {
    id: 'arctic',
    label: 'Arctic',
    preview: '#eef3f8',
    bg: '#f5f8fc',
    surface: '#ffffff',
    border: '#dce4ef',
    text: '#1c2a3a',
    accent: '#0ea5e9',
    muted: '#94a3b8',
    isDark: false,
  },
  {
    id: 'taupe',
    label: 'Taupe',
    preview: '#c8b9a8',
    bg: '#f7f3ee',
    surface: '#fdfaf7',
    border: '#e2d8cf',
    text: '#2c2418',
    accent: '#a07850',
    muted: '#9a8a78',
    isDark: false,
  },
  {
    id: 'mocha',
    label: 'Mocha Dark',
    preview: '#2c1f14',
    bg: '#1a110a',
    surface: '#241810',
    border: '#3d2918',
    text: '#e8d5c0',
    accent: '#c8854a',
    muted: '#7a5a40',
    isDark: true,
  },
  {
    id: 'forest',
    label: 'Forest',
    preview: '#1e2d1e',
    bg: '#111a11',
    surface: '#182018',
    border: '#253325',
    text: '#d8e8d8',
    accent: '#5aaf6a',
    muted: '#4a6a4a',
    isDark: true,
  },
  {
    id: 'high-contrast',
    label: 'High Contrast',
    preview: '#000000',
    bg: '#000000',
    surface: '#0a0a0a',
    border: '#333333',
    text: '#ffffff',
    accent: '#ffff00',
    muted: '#888888',
    isDark: true,
  },
  {
    id: 'warm-cream',
    label: 'Warm Cream',
    preview: '#faf4e8',
    bg: '#fdf8f0',
    surface: '#fffef9',
    border: '#ede4d0',
    text: '#2a2018',
    accent: '#c9781e',
    muted: '#a8906a',
    isDark: false,
  },
  {
    id: 'midnight-blue',
    label: 'Midnight Blue',
    preview: '#0d1b3e',
    bg: '#07112a',
    surface: '#0d1b3e',
    border: '#162251',
    text: '#c8d8f8',
    accent: '#4d8af0',
    muted: '#405a90',
    isDark: true,
  },
]

// ── FONT STYLES ────────────────────────────────────────────

export const FONTS: FontConfig[] = [
  {
    id: 'geist',
    label: 'Geist',
    family: '"Geist", system-ui, sans-serif',
    category: 'sans',
    specimen: 'The quick brown fox',
  },
  {
    id: 'inter',
    label: 'Inter',
    family: '"Inter", system-ui, sans-serif',
    category: 'sans',
    specimen: 'Aa Bb Cc 123',
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    family: 'var(--font-dm-sans), sans-serif',
    category: 'sans',
    specimen: 'Design in motion',
  },
  {
    id: 'plus-jakarta',
    label: 'Plus Jakarta',
    family: '"Plus Jakarta Sans", sans-serif',
    category: 'sans',
    specimen: 'Modern workspace',
  },
  {
    id: 'sora',
    label: 'Sora',
    family: '"Sora", sans-serif',
    category: 'sans',
    specimen: 'Future forward',
  },
  {
    id: 'editorial-new',
    label: 'Editorial New',
    family: '"Editorial New", Georgia, serif',
    category: 'display',
    specimen: 'Craft & Vision',
  },
  {
    id: 'pp-neue-montreal',
    label: 'Neue Montreal',
    family: '"PP Neue Montreal", "Helvetica Neue", sans-serif',
    category: 'sans',
    specimen: 'Swiss precision',
  },
  {
    id: 'freight-display',
    label: 'Freight Display',
    family: '"Freight Display Pro", Georgia, serif',
    category: 'serif',
    specimen: 'Timeless editorial',
  },
  {
    id: 'cormorant',
    label: 'Cormorant',
    family: 'var(--font-cormorant), Georgia, serif',
    category: 'serif',
    specimen: 'Elegant refinement',
  },
  {
    id: 'instrument-serif',
    label: 'Instrument Serif',
    family: 'var(--font-instrument-serif), Georgia, serif',
    category: 'serif',
    specimen: 'Sharp and defined',
  },
]

// ── WORKSPACE LAYOUTS ──────────────────────────────────────

export const LAYOUTS: LayoutConfig[] = [
  {
    id: 'compact',
    label: 'Compact',
    description: 'Dense data streams for active tracking. Maximum information density with reduced padding.',
    icon: '▤',
  },
  {
    id: 'optimized',
    label: 'Optimized',
    description: 'Clean spacing for project management. Balanced content hierarchy with comfortable breathing room.',
    icon: '▦',
  },
  {
    id: 'normal',
    label: 'Normal',
    description: 'Standard navigation and content views. Comfortable default for everyday use.',
    icon: '▧',
  },
  {
    id: 'ai-desired',
    label: 'AI Desired',
    description: 'Dynamic layout that automatically restructures modules based on active projects and studio data.',
    icon: '◈',
  },
]

// ── CSS VARIABLE GENERATOR ─────────────────────────────────

export function generateThemeCSSVars(theme: ThemeConfig): string {
  return `
    --bg: ${theme.bg};
    --surface: ${theme.surface};
    --border: ${theme.border};
    --text: ${theme.text};
    --accent: ${theme.accent};
    --muted: ${theme.muted};
    --font: ${FONTS.find(f => f.id === 'geist')?.family};
  `.trim()
}

export function getTheme(id: WorkspaceTheme): ThemeConfig {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}

export function getFont(id: FontStyle): FontConfig {
  return FONTS.find(f => f.id === id) ?? FONTS[0]
}

export function getLayout(id: WorkspaceLayout): LayoutConfig {
  return LAYOUTS.find(l => l.id === id) ?? LAYOUTS[2]
}
