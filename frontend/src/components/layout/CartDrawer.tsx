'use client'
import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/store/cart'
import Link from 'next/link'
import Image from 'next/image'
import { useDismissibleLayer } from '@/hooks/useDismissibleLayer'
import { validateCartItems } from '@/app/actions/cart'
import toast from 'react-hot-toast'

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQty, total, count, isHydrated, setValidatedItems } = useCart()
  const drawerRef = useRef<HTMLDivElement>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [conflicts, setConflicts] = useState<string[]>([])

  useDismissibleLayer(isOpen, toggleCart, drawerRef)

  useEffect(() => {
    if (isOpen && isHydrated && items.length > 0) {
      const validate = async () => {
        setIsValidating(true)
        setConflicts([])
        try {
          const res = await validateCartItems(items)
          if (res.conflicts.length > 0) {
            setConflicts(res.conflicts)
          }
          setValidatedItems(res.validItems)
        } catch (error) {
          console.error("Cart validation error:", error)
        } finally {
          setIsValidating(false)
        }
      }
      validate()
    }
  }, [isOpen, isHydrated]) // deliberately not adding items to avoid loop

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

  if (!isHydrated) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="theme-backdrop fixed inset-0 z-50 backdrop-blur-sm"
            onClick={toggleCart}
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="cart-drawer fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="cart-drawer__header flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div>
                <h2 className="text-white text-sm font-medium tracking-widest uppercase">Cart</h2>
                <p className="text-white/30 text-xs mt-0.5">{count()} {count() === 1 ? 'item' : 'items'}</p>
              </div>
              <button
                onClick={toggleCart}
                className="neo-icon-button"
                aria-label="Close cart"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conflicts */}
            {conflicts.length > 0 && (
              <div className="bg-[#E63B2E]/10 border-b border-[#E63B2E]/20 p-4 px-6 space-y-1">
                {conflicts.map((conflict, i) => (
                  <p key={i} className="text-[#E63B2E] text-xs flex items-start gap-2">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{conflict}</span>
                  </p>
                ))}
              </div>
            )}

            {/* Items */}
            <div className="cart-drawer__items flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {isValidating && items.length > 0 && (
                <div className="absolute inset-0 bg-[#080808]/50 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
                </div>
              )}
              
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="neo-inset w-16 h-16 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-white/30 text-sm">Your cart is empty</p>
                  <button
                    onClick={toggleCart}
                    className="btn-ghost text-xs"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={`${item.id}-${item.size}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="cart-drawer__item flex gap-4 p-3 neo-surface-sm"
                  >
                    {/* Image */}
                    <div className="cart-drawer__item-image w-20 h-24 neo-inset overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={80} height={96} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2">
                          <Image src="/logo.png" alt="7SS Logo" width={80} height={96} className="brand-logo h-full w-full object-contain opacity-20" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                      <p className="text-white/40 text-xs mt-0.5 tracking-wider">Size: {item.size}</p>
                      <p className="text-[#C9A96E] text-sm mt-1">{fmt(item.price)}</p>

                      <div className="cart-drawer__item-controls flex items-center justify-between mt-3">
                        {/* Qty */}
                        <div className="cart-quantity neo-inset flex items-center rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQty(item.id, item.size, item.quantity - 1)}
                            className="cart-quantity__button flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-white text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.id, item.size, item.quantity + 1)}
                            className="cart-quantity__button flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id, item.size)}
                          className="cart-remove-button text-white/20 hover:text-[#E63B2E] text-xs tracking-wider uppercase transition-colors"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="cart-drawer__footer border-t border-white/[0.06] px-6 py-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs tracking-widest uppercase">Subtotal</span>
                  <span className="text-white text-base font-medium">{fmt(total())}</span>
                </div>
                <p className="text-white/20 text-xs text-center">Shipping & taxes calculated at checkout</p>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/cart"
                    onClick={toggleCart}
                    className="btn-ghost w-full"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={toggleCart}
                    className="btn-primary w-full"
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

