'use client'

import { useState, useTransition } from 'react'
import { toggleWishlist } from '@/app/actions/account'

type Props = {
  productId: number
  initialSaved: boolean
}

export default function WishlistToggle({ productId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleWishlist(productId)
      if (result.requiresAuth) {
        setMessage('Sign in to save items to your wishlist.')
        return
      }
      if (result.error) {
        setMessage(result.error)
        return
      }
      setSaved(result.saved ?? !saved)
      setMessage(result.saved ? 'Added to wishlist.' : 'Removed from wishlist.')
      setTimeout(() => setMessage(''), 2500)
    })
  }

  return (
    <div className="wishlist-toggle">
      <button
        type="button"
        className={`wishlist-toggle__btn ${saved ? 'is-saved' : ''}`}
        onClick={handleToggle}
        disabled={isPending}
        aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-pressed={saved}
        aria-busy={isPending}
      >
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      {message && (
        <p className="wishlist-toggle__message" role="status" aria-live="polite">{message}</p>
      )}
    </div>
  )
}
