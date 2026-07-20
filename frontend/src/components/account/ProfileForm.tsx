'use client'

import { useRef, useState, useTransition } from 'react'
import { updateProfile } from '@/app/actions/account'

type Props = {
  initialName: string
  initialPhone: string
}

export default function ProfileForm({ initialName, initialPhone }: Props) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="auth-form" noValidate>
      {success && (
        <div className="auth-notice auth-notice--success" role="status" aria-live="polite">
          Profile updated successfully.
        </div>
      )}
      {error && (
        <div className="auth-notice auth-notice--error" role="alert">
          {error}
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="profile-full-name">Full Name</label>
        <input
          id="profile-full-name"
          name="full_name"
          type="text"
          className="input-dark"
          defaultValue={initialName}
          placeholder="Your full name"
          maxLength={201}
          required
          disabled={isPending}
          aria-describedby={error ? 'profile-error' : undefined}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="profile-phone">Phone Number</label>
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          className="input-dark"
          defaultValue={initialPhone}
          placeholder="+63 9XX XXX XXXX"
          maxLength={32}
          disabled={isPending}
        />
        <p className="auth-field__hint">Optional. Used for order notifications.</p>
      </div>

      <button
        type="submit"
        className="btn-primary auth-form__submit"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
