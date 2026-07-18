'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  GENERIC_RESEND_MESSAGE,
  GENERIC_SIGNUP_MESSAGE,
  getAuthErrorMessage,
  isDuplicateSignupError,
  normalizeEmail,
  validateCreateAccount,
  type CreateAccountErrors,
  type CreateAccountField,
  type CreateAccountValues,
} from '@/lib/auth/customer-auth'
import { AuthNotice } from './AuthShell'
import PasswordField from './PasswordField'

type CreateAccountFormProps = {
  returnTo: string
}

const initialValues: CreateAccountValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function getCallbackUrl(returnTo: string) {
  const callbackUrl = new URL('/auth/callback', window.location.origin)
  callbackUrl.searchParams.set('next', returnTo)
  return callbackUrl.toString()
}

export default function CreateAccountForm({ returnTo }: CreateAccountFormProps) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<CreateAccountErrors>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const updateField = (field: CreateAccountField, value: string) => {
    setValues(current => ({ ...current, [field]: value }))
    setFieldErrors(current => ({ ...current, [field]: undefined }))
    setError('')
  }

  const showVerificationState = () => {
    setError('')
    setSuccess(GENERIC_SIGNUP_MESSAGE)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    const validationErrors = validateCreateAccount(values)
    setFieldErrors(validationErrors)
    setError('')
    setSuccess('')
    if (Object.keys(validationErrors).length) return

    setLoading(true)
    const email = normalizeEmail(values.email)
    const firstName = values.firstName.trim()
    const lastName = values.lastName.trim()

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
          emailRedirectTo: getCallbackUrl(returnTo),
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
        },
      })

      if (signUpError) {
        if (isDuplicateSignupError(signUpError)) showVerificationState()
        else setError(getAuthErrorMessage(signUpError, 'register'))
        return
      }

      if (data.session) {
        router.replace(returnTo)
        router.refresh()
        return
      }

      showVerificationState()
    } catch (signUpError) {
      setError(getAuthErrorMessage(signUpError, 'register'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resending) return
    setResending(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: normalizeEmail(values.email),
        options: { emailRedirectTo: getCallbackUrl(returnTo) },
      })

      if (resendError) {
        setError(getAuthErrorMessage(resendError, 'resend'))
        return
      }
      setSuccess(GENERIC_RESEND_MESSAGE)
    } catch (resendError) {
      setError(getAuthErrorMessage(resendError, 'resend'))
    } finally {
      setResending(false)
    }
  }

  const loginHref = returnTo === '/account' ? '/login' : `/login?next=${encodeURIComponent(returnTo)}`

  if (success) {
    return (
      <div className="auth-verification-state">
        {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}
        <AuthNotice tone="success">{success}</AuthNotice>
        <div className="auth-verification-state__icon neo-inset" aria-hidden="true">✓</div>
        <p>Verification links expire for your protection.</p>
        <button type="button" className="btn-outline" onClick={handleResend} disabled={resending} aria-busy={resending}>
          {resending ? 'Sending…' : 'Resend Verification Email'}
        </button>
        <Link href={loginHref} className="btn-ghost">Back to Login</Link>
      </div>
    )
  }

  return (
    <>
      {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        <div className="auth-form__row">
          <div className="auth-field">
            <label htmlFor="register-first-name">First Name</label>
            <input
              id="register-first-name"
              name="firstName"
              value={values.firstName}
              onChange={event => updateField('firstName', event.target.value)}
              autoComplete="given-name"
              maxLength={80}
              required
              className="input-dark"
              aria-invalid={fieldErrors.firstName ? true : undefined}
              aria-describedby={fieldErrors.firstName ? 'register-first-name-error' : undefined}
            />
            {fieldErrors.firstName ? <p id="register-first-name-error" className="auth-field__error">{fieldErrors.firstName}</p> : null}
          </div>

          <div className="auth-field">
            <label htmlFor="register-last-name">Last Name</label>
            <input
              id="register-last-name"
              name="lastName"
              value={values.lastName}
              onChange={event => updateField('lastName', event.target.value)}
              autoComplete="family-name"
              maxLength={80}
              required
              className="input-dark"
              aria-invalid={fieldErrors.lastName ? true : undefined}
              aria-describedby={fieldErrors.lastName ? 'register-last-name-error' : undefined}
            />
            {fieldErrors.lastName ? <p id="register-last-name-error" className="auth-field__error">{fieldErrors.lastName}</p> : null}
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={values.email}
            onChange={event => updateField('email', event.target.value)}
            autoComplete="email"
            inputMode="email"
            required
            className="input-dark"
            placeholder="you@example.com"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
          />
          {fieldErrors.email ? <p id="register-email-error" className="auth-field__error">{fieldErrors.email}</p> : null}
        </div>

        <PasswordField
          id="register-password"
          name="password"
          label="Password"
          value={values.password}
          onChange={event => updateField('password', event.target.value)}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          error={fieldErrors.password}
          hint="Use at least 8 characters with a letter and a number."
        />

        <PasswordField
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          value={values.confirmPassword}
          onChange={event => updateField('confirmPassword', event.target.value)}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          error={fieldErrors.confirmPassword}
        />

        <p className="auth-form__terms">
          By creating an account, you agree to use 7Th South Street services responsibly.
        </p>

        <button type="submit" disabled={loading} className="btn-primary auth-form__submit">
          {loading ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>

      <p className="auth-card__switch">
        Already have an account? <Link href={loginHref}>Log In</Link>
      </p>
    </>
  )
}
