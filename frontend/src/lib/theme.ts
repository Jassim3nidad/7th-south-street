export const THEME_STORAGE_KEY = '7ss-theme'

export const themePreferences = ['light', 'dark', 'system'] as const

export type ThemePreference = (typeof themePreferences)[number]
export type ResolvedTheme = Exclude<ThemePreference, 'system'>

export const themeMetaColors: Record<ResolvedTheme, string> = {
  light: '#E8EEF7',
  dark: '#171A21',
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && themePreferences.includes(value as ThemePreference)
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

export function getThemeInitScript() {
  const storageKey = JSON.stringify(THEME_STORAGE_KEY)
  const lightThemeColor = JSON.stringify(themeMetaColors.light)
  const darkThemeColor = JSON.stringify(themeMetaColors.dark)

  return `(function(){var root=document.documentElement;var preference='system';try{var stored=window.localStorage.getItem(${storageKey});if(stored==='light'||stored==='dark'||stored==='system'){preference=stored;}}catch(error){}var systemDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=preference==='dark'||(preference==='system'&&systemDark)?'dark':'light';root.dataset.theme=resolved;root.dataset.themePreference=preference;root.style.colorScheme=resolved;var meta=document.querySelector('meta[name="theme-color"]');if(meta){meta.setAttribute('content',resolved==='dark'?${darkThemeColor}:${lightThemeColor});}})();`
}
