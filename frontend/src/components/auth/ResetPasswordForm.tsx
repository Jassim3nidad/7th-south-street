'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage, validatePasswordReset, type PasswordResetErrors } from '@/lib/auth/customer-auth'
import { AuthNotice } from './AuthShell'
import LogoutButton from './LogoutButton'
import PasswordField from './PasswordField'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<PasswordResetErrors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [updatedButSessionActive, setUpdatedButSessionActive] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    const validationErrors = validatePasswordReset(password, confirmPassword)
    setFieldErrors(validationErrors)
    setError('')
    if (Object.keys(validationErrors).length) return

    setLoading(true)
    let passwordUpdated = false

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(getAuthErrorMessage(updateError, 'reset'))
        return
      }
      passwordUpdated = true

      // End the short-lived recovery session after the credential changes.
      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!logoutResponse.ok) {
        setUpdatedButSessionActive(true)
        setError('Your password was updated, but we could not end the recovery session. Retry signing out before leaving this device.')
        return
      }
      router.replace('/login?message=password-updated')
      router.refresh()
    } catch (updateError) {
      // A failed logout must not be presented as a failed password update.
      if (passwordUpdated) {
        setUpdatedButSessionActive(true)
        setError('Your password was updated, but the recovery session is still active. Retry signing out before leaving this device.')
      } else {
        setError(getAuthErrorMessage(updateError, 'reset'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (updatedButSessionActive) {
    return (
      <div className="auth-invalid-link">
        <AuthNotice tone="success">Your password has been updated successfully.</AuthNotice>
        {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}
        <LogoutButton className="btn-primary" redirectTo="/login?message=password-updated">
          Sign Out And Continue
        </LogoutButton>
      </div>
    )
  }

  return (
    <>
      {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        <PasswordField
          id="reset-password"
          name="password"
          label="New Password"
          value={password}
          onChange={event => {
            setPassword(event.target.value)
            setFieldErrors(current => ({ ...current, password: undefined }))
          }}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          error={fieldErrors.password}
          hint="Use at least 8 characters with a letter and a number."
        />

        <PasswordField
          id="reset-confirm-password"
          name="confirmPassword"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={event => {
            setConfirmPassword(event.target.value)
            setFieldErrors(current => ({ ...current, confirmPassword: undefined }))
          }}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          error={fieldErrors.confirmPassword}
        />

        <button type="submit" disabled={loading} className="btn-primary auth-form__submit">
          {loading ? 'Updating Password…' : 'Update Password'}
        </button>
      </form>

      <p className="auth-card__switch">
        Need another link? <Link href="/forgot-password">Request Password Reset</Link>
      </p>
    </>
  )
}
