'use client'

import { useTransition } from 'react'
import { toggleWishlist } from '@/app/actions/account'

export default function WishlistRemoveButton({ productId }: { productId: number }) {
  const [isPending, startTransition] = useTransition()

  const handleRemove = () => {
    startTransition(async () => {
      await toggleWishlist(productId)
    })
  }

  return (
    <button
      type="button"
      className="btn-ghost wishlist-card__remove"
      onClick={handleRemove}
      disabled={isPending}
      aria-label="Remove from wishlist"
      aria-busy={isPending}
    >
      {isPending ? '…' : '♡ Remove'}
    </button>
  )
}
