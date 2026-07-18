'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthErrorMessage, getSafeReturnPath } from '@/lib/auth/customer-auth'

type LogoutButtonProps = {
  children?: ReactNode
  className?: string
  redirectTo?: string
  showError?: boolean
}

export default function LogoutButton({
  children = 'Log Out',
  className = 'btn-outline',
  redirectTo = '/login?message=signed-out',
  showError = true,
}: LogoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Logout request failed')

      router.replace(getSafeReturnPath(redirectTo, '/login'))
      router.refresh()
    } catch (logoutError) {
      setError(getAuthErrorMessage(logoutError, 'logout'))
      setLoading(false)
    }
  }

  return (
    <div className="auth-logout">
      <button
        type="button"
        className={className}
        onClick={handleLogout}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? 'Signing Out…' : children}
      </button>
      {showError && error ? <p className="auth-field__error" role="alert">{error}</p> : null}
    </div>
  )
}
