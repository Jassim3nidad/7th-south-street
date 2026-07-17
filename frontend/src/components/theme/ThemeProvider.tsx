'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  isThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  themeMetaColors,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme'

type ThemeContextValue = {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function updateDocumentTheme(preference: ThemePreference): ResolvedTheme {
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolvedTheme = resolveTheme(preference, systemPrefersDark)
  const root = document.documentElement

  root.dataset.theme = resolvedTheme
  root.dataset.themePreference = preference
  root.style.colorScheme = resolvedTheme

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  themeColor?.setAttribute('content', themeMetaColors[resolvedTheme])

  return resolvedTheme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const preferenceRef = useRef<ThemePreference>('system')

  const applyTheme = useCallback((nextPreference: ThemePreference) => {
    const nextResolvedTheme = updateDocumentTheme(nextPreference)
    setResolvedTheme(nextResolvedTheme)
  }, [])

  const setTheme = useCallback((nextPreference: ThemePreference) => {
    preferenceRef.current = nextPreference
    setPreference(nextPreference)

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference)
    } catch {
      // The preference still applies for this visit when storage is unavailable.
    }

    applyTheme(nextPreference)
  }, [applyTheme])

  useEffect(() => {
    const initialPreference = isThemePreference(document.documentElement.dataset.themePreference)
      ? document.documentElement.dataset.themePreference
      : 'system'

    preferenceRef.current = initialPreference
    setPreference(initialPreference)
    applyTheme(initialPreference)
    document.documentElement.dataset.themeReady = 'true'

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      if (preferenceRef.current === 'system') applyTheme('system')
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return
      const nextPreference = isThemePreference(event.newValue) ? event.newValue : 'system'
      preferenceRef.current = nextPreference
      setPreference(nextPreference)
      applyTheme(nextPreference)
    }

    media.addEventListener('change', handleSystemChange)
    window.addEventListener('storage', handleStorage)

    return () => {
      media.removeEventListener('change', handleSystemChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [applyTheme])

  const value = useMemo(() => ({ preference, resolvedTheme, setTheme }), [preference, resolvedTheme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
