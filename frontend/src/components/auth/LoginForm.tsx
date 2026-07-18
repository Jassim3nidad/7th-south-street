'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage, isValidEmail, normalizeEmail } from '@/lib/auth/customer-auth'
import { AuthNotice } from './AuthShell'
import PasswordField from './PasswordField'

type LoginFormProps = {
  returnTo: string
  initialError?: string | null
  initialMessage?: string | null
}

export default function LoginForm({ returnTo, initialError, initialMessage }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError || '')
  const [emailError, setEmailError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.')
      return
    }

    setLoading(true)
    setError('')
    setEmailError('')

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      })

      if (signInError || !data.user) {
        setError(getAuthErrorMessage(signInError, 'login'))
        return
      }

      router.replace(returnTo)
      router.refresh()
    } catch (signInError) {
      setError(getAuthErrorMessage(signInError, 'login'))
    } finally {
      setLoading(false)
    }
  }

  const createAccountHref = returnTo === '/account'
    ? '/create-account'
    : `/create-account?next=${encodeURIComponent(returnTo)}`

  return (
    <>
      {initialMessage ? <AuthNotice tone="success">{initialMessage}</AuthNotice> : null}
      {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
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
            aria-describedby={emailError ? 'login-email-error' : undefined}
          />
          {emailError ? <p id="login-email-error" className="auth-field__error">{emailError}</p> : null}
        </div>

        <PasswordField
          id="login-password"
          name="password"
          label="Password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <div className="auth-form__utility">
          <Link href="/forgot-password">Forgot password?</Link>
        </div>

        <button type="submit" disabled={loading || !email || !password} className="btn-primary auth-form__submit">
          {loading ? 'Signing In…' : 'Log In'}
        </button>
      </form>

      <p className="auth-card__switch">
        New to 7Th South Street? <Link href={createAccountHref}>Create Account</Link>
      </p>
    </>
  )
}
