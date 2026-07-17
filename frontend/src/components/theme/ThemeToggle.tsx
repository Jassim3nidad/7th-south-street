'use client'

import { useRef, type KeyboardEvent } from 'react'
import { themePreferences, type ThemePreference } from '@/lib/theme'
import { useTheme } from './ThemeProvider'

const options: Array<{ value: ThemePreference; label: string; icon: React.ReactNode }> = [
  {
    value: 'light',
    label: 'Light',
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></svg>,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 15.1A8.5 8.5 0 0 1 8.9 3.6 8.5 8.5 0 1 0 20.4 15.1Z" /></svg>,
  },
  {
    value: 'system',
    label: 'System',
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>,
  },
]

export default function ThemeToggle({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const { preference, setTheme } = useTheme()
  const buttons = useRef<Array<HTMLButtonElement | null>>([])

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % themePreferences.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + themePreferences.length) % themePreferences.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = themePreferences.length - 1
    else return

    event.preventDefault()
    const nextTheme = themePreferences[nextIndex]
    setTheme(nextTheme)
    buttons.current[nextIndex]?.focus()
  }

  return (
    <div className={`theme-toggle ${compact ? 'theme-toggle--compact' : ''} ${className}`.trim()} role="radiogroup" aria-label="Color theme">
      {options.map((option, index) => {
        const selected = preference === option.value
        return (
          <button
            key={option.value}
            ref={element => { buttons.current[index] = element }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${option.label} theme`}
            title={`${option.label} theme`}
            tabIndex={selected ? 0 : -1}
            className={`theme-toggle__option ${selected ? 'is-active' : ''}`}
            onClick={() => setTheme(option.value)}
            onKeyDown={event => handleKeyDown(event, index)}
          >
            <span className="theme-toggle__icon">{option.icon}</span>
            <span className="theme-toggle__label">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
