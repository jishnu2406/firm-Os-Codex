'use client'
// ============================================================
// FIRM OS — Preferences Context
// Manages theme, font, and layout state with localStorage sync
// ============================================================

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { WorkspaceTheme, FontStyle, WorkspaceLayout } from '@/types'
import { getTheme, getFont } from '@/lib/utils/design-system'

interface PreferencesContextValue {
  theme: WorkspaceTheme
  font: FontStyle
  layout: WorkspaceLayout
  setTheme: (t: WorkspaceTheme) => void
  setFont: (f: FontStyle) => void
  setLayout: (l: WorkspaceLayout) => void
  isDark: boolean
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

const STORAGE_KEY = 'firmos:preferences'
const DEFAULT_PREFERENCES = {
  theme: 'slate-dark' as WorkspaceTheme,
  font: 'geist' as FontStyle,
  layout: 'normal' as WorkspaceLayout,
}

function loadPreferences() {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<WorkspaceTheme>(DEFAULT_PREFERENCES.theme)
  const [font, setFontState] = useState<FontStyle>(DEFAULT_PREFERENCES.font)
  const [layout, setLayoutState] = useState<WorkspaceLayout>(DEFAULT_PREFERENCES.layout)

  useEffect(() => {
    const prefs = loadPreferences()
    setThemeState(prefs.theme)
    setFontState(prefs.font)
    setLayoutState(prefs.layout)
  }, [])

  // Apply CSS variables to :root whenever theme/font changes
  useEffect(() => {
    const themeConfig = getTheme(theme)
    const fontConfig = getFont(font)
    const root = document.documentElement

    root.style.setProperty('--bg', themeConfig.bg)
    root.style.setProperty('--surface', themeConfig.surface)
    root.style.setProperty('--border', themeConfig.border)
    root.style.setProperty('--text', themeConfig.text)
    root.style.setProperty('--accent', themeConfig.accent)
    root.style.setProperty('--muted', themeConfig.muted)
    root.style.setProperty('--font-family', fontConfig.family)
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-layout', layout)
    root.classList.toggle('dark', themeConfig.isDark)
  }, [theme, font, layout])

  const save = useCallback((updates: Partial<typeof DEFAULT_PREFERENCES>) => {
    const current = loadPreferences()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...updates }))
  }, [])

  const setTheme = useCallback((t: WorkspaceTheme) => {
    setThemeState(t)
    save({ theme: t })
  }, [save])

  const setFont = useCallback((f: FontStyle) => {
    setFontState(f)
    save({ font: f })
  }, [save])

  const setLayout = useCallback((l: WorkspaceLayout) => {
    setLayoutState(l)
    save({ layout: l })
  }, [save])

  const isDark = getTheme(theme).isDark

  return (
    <PreferencesContext.Provider value={{ theme, font, layout, setTheme, setFont, setLayout, isDark }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
