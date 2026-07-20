'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from '@/app/actions/account'

export default function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const isConfirmed = confirmation === 'DELETE'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConfirmed) return
    setError('')
    startTransition(async () => {
      const result = await deleteAccount(confirmation)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      {error && (
        <div className="auth-notice auth-notice--error" role="alert">{error}</div>
      )}

      <div className="auth-field">
        <label htmlFor="delete-confirm">
          Type <strong>DELETE</strong> to confirm account deletion
        </label>
        <input
          id="delete-confirm"
          type="text"
          className="input-dark"
          value={confirmation}
          onChange={e => setConfirmation(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          spellCheck={false}
          disabled={isPending}
          aria-describedby="delete-confirm-hint"
        />
        <p id="delete-confirm-hint" className="auth-field__hint">
          This action is irreversible. Your account and personal data will be permanently deleted.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          type="submit"
          className="btn-primary"
          disabled={!isConfirmed || isPending}
          aria-busy={isPending}
          style={{
            background: isConfirmed ? 'var(--neo-error)' : undefined,
            opacity: !isConfirmed ? 0.5 : 1,
          }}
        >
          {isPending ? 'Deleting Account…' : 'Permanently Delete Account'}
        </button>
        <a href="/account/security" className="btn-ghost">
          Cancel
        </a>
      </div>
    </form>
  )
}
