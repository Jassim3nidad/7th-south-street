'use client'

import { useState, useTransition } from 'react'
import { sendPasswordResetEmail } from '@/app/actions/account'

export default function SecurityActions({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSendReset = () => {
    setError('')
    startTransition(async () => {
      const result = await sendPasswordResetEmail()
      if (result?.error) {
        setError(result.error)
      } else {
        setSent(true)
      }
    })
  }

  if (sent) {
    return (
      <div className="auth-notice auth-notice--success" role="status" aria-live="polite">
        A password reset link has been sent to <strong>{email}</strong>. Check your inbox and spam folder.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {error && (
        <div className="auth-notice auth-notice--error" role="alert">{error}</div>
      )}
      <button
        type="button"
        className="btn-primary"
        style={{ width: 'fit-content' }}
        onClick={handleSendReset}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? 'Sending…' : 'Send Reset Link'}
      </button>
    </div>
  )
}
