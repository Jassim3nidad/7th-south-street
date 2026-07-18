'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  GENERIC_RECOVERY_MESSAGE,
  getAuthErrorMessage,
  isValidEmail,
  normalizeEmail,
} from '@/lib/auth/customer-auth'
import { AuthNotice } from './AuthShell'

function getRecoveryCallbackUrl() {
  const callbackUrl = new URL('/auth/callback', window.location.origin)
  callbackUrl.searchParams.set('next', '/reset-password')
  callbackUrl.searchParams.set('type', 'recovery')
  return callbackUrl.toString()
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.')
      return
    }

    setLoading(true)
    setEmailError('')
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
        redirectTo: getRecoveryCallbackUrl(),
      })

      if (recoveryError) {
        const message = getAuthErrorMessage(recoveryError, 'recovery')
        if (message === GENERIC_RECOVERY_MESSAGE) setSuccess(message)
        else setError(message)
        return
      }

      // Keep the response identical whether or not an account exists.
      setSuccess(GENERIC_RECOVERY_MESSAGE)
    } catch (recoveryError) {
      setError(getAuthErrorMessage(recoveryError, 'recovery'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {success ? <AuthNotice tone="success">{success}</AuthNotice> : null}
      {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        <div className="auth-field">
          <label htmlFor="recovery-email">Email</label>
          <input
            id="recovery-email"
            name="email"
            type="email"
            value={email}
            onChange={event => {
              setEmail(event.target.value)
              setEmailError('')
            }}
            autoComplete="email"
            inputMode="email"
            required
            className="input-dark"
            placeholder="you@example.com"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? 'recovery-email-error' : undefined}
          />
          {emailError ? <p id="recovery-email-error" className="auth-field__error">{emailError}</p> : null}
        </div>

        <button type="submit" disabled={loading} className="btn-primary auth-form__submit">
          {loading ? 'Sending Reset Link…' : 'Send Reset Link'}
        </button>
      </form>

      <p className="auth-card__switch">
        Remembered your password? <Link href="/login">Back to Login</Link>
      </p>
    </>
  )
}
