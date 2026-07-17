import test from 'node:test'
import assert from 'node:assert/strict'
import { getThemeInitScript, isThemePreference, resolveTheme, THEME_STORAGE_KEY } from './theme'

test('validates supported theme preferences', () => {
  assert.equal(isThemePreference('light'), true)
  assert.equal(isThemePreference('dark'), true)
  assert.equal(isThemePreference('system'), true)
  assert.equal(isThemePreference('auto'), false)
  assert.equal(isThemePreference(null), false)
})

test('resolves explicit and system theme preferences', () => {
  assert.equal(resolveTheme('light', true), 'light')
  assert.equal(resolveTheme('dark', false), 'dark')
  assert.equal(resolveTheme('system', true), 'dark')
  assert.equal(resolveTheme('system', false), 'light')
})

test('produces a synchronous initialization script with the shared storage key', () => {
  const script = getThemeInitScript()
  assert.match(script, new RegExp(THEME_STORAGE_KEY))
  assert.match(script, /dataset\.theme/)
  assert.match(script, /prefers-color-scheme: dark/)
})
