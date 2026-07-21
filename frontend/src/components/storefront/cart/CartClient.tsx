'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/store/cart'
import Link from 'next/link'
import Image from 'next/image'
import { validateCartItems } from '@/app/actions/cart'
import toast from 'react-hot-toast'

export default function CartClient() {
  const { items, removeItem, updateQty, total, isHydrated, setValidatedItems } = useCart()
  const [isValidating, setIsValidating] = useState(true)
  const [conflicts, setConflicts] = useState<string[]>([])

  useEffect(() => {
    if (isHydrated) {
      if (items.length === 0) {
        setIsValidating(false)
        return
      }
      const validate = async () => {
        setIsValidating(true)
        setConflicts([])
        try {
          const res = await validateCartItems(items)
          if (res.conflicts.length > 0) {
            setConflicts(res.conflicts)
            toast.error("Some items in your cart have been updated due to stock or price changes.")
          }
          setValidatedItems(res.validItems)
        } catch (error) {
          console.error("Cart validation error:", error)
          toast.error("Failed to validate cart items.")
        } finally {
          setIsValidating(false)
        }
      }
      validate()
    }
  }, [isHydrated]) // only run on initial hydration mount

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

  if (!isHydrated) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="neo-state max-w-xl mx-auto mt-20 flex flex-col items-center justify-center gap-6 text-center px-6 py-20">
        <div className="neo-inset w-20 h-20 flex items-center justify-center rounded-full mb-2">
          <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div>
          <h2 className="neo-heading text-3xl mb-2 text-white/40">Your cart is empty</h2>
          <p className="text-white/30 text-sm">Looks like you haven't added anything yet.</p>
        </div>
        <Link href="/shop" className="btn-primary mt-4">
          Return to Shop
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
      {/* Conflicts Banner */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
            <div className="bg-[#E63B2E]/10 border border-[#E63B2E]/20 p-4 px-6 space-y-2 rounded-xl">
              <div className="flex items-center gap-2 text-[#E63B2E] font-medium text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Please review the following changes to your cart:
              </div>
              <ul className="list-disc list-inside text-[#E63B2E]/80 text-xs space-y-1 ml-1">
                {conflicts.map((conflict, i) => (
                  <li key={i}>{conflict}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-12 lg:gap-16 relative">
        {isValidating && (
          <div className="absolute inset-0 bg-[#080808]/50 backdrop-blur-[2px] z-10 flex items-start justify-center pt-32">
            <div className="w-10 h-10 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin shadow-[0_0_15px_rgba(201,169,110,0.2)]" />
          </div>
        )}

        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-4 border-b border-white/[0.06] text-white/30 text-xs tracking-widest uppercase">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-3 text-right">Total</div>
          </div>
          
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={`${item.id}-${item.size}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative sm:grid sm:grid-cols-12 gap-6 items-center py-6 border-b border-white/[0.06] flex flex-col"
              >
                {/* Product Info */}
                <div className="col-span-6 flex gap-6 w-full">
                  <div className="w-24 h-32 sm:w-28 sm:h-36 neo-inset overflow-hidden flex-shrink-0 relative">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 96px, 112px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <Image src="/logo.png" alt="7SS Logo" width={80} height={96} className="brand-logo h-full w-full object-contain opacity-20" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center py-2 flex-1 min-w-0">
                    <p className="text-white/50 text-[10px] tracking-widest uppercase mb-1">7SS</p>
                    <Link href={`/shop/${item.sku.split('-')[0] || item.id}`} className="text-white text-lg font-medium truncate hover:text-[#C9A96E] transition-colors">{item.name}</Link>
                    <p className="text-white/40 text-sm mt-1 tracking-wider">Size: {item.size}</p>
                    <p className="text-[#C9A96E] text-base mt-2 sm:hidden">{fmt(item.price)}</p>
                    <button
                      onClick={() => removeItem(item.id, item.size)}
                      className="text-white/20 hover:text-[#E63B2E] text-xs tracking-wider uppercase transition-colors mt-auto self-start pt-4 sm:pt-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Mobile: Row for Qty and Total */}
                <div className="flex items-center justify-between w-full sm:hidden">
                  <div className="cart-quantity neo-inset flex items-center rounded-xl overflow-hidden h-10">
                    <button onClick={() => updateQty(item.id, item.size, item.quantity - 1)} className="w-10 h-full flex items-center justify-center text-white/40 hover:text-white transition-colors">−</button>
                    <span className="w-8 text-center text-white text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.size, item.quantity + 1)} className="w-10 h-full flex items-center justify-center text-white/40 hover:text-white transition-colors">+</button>
                  </div>
                  <span className="text-white font-medium">{fmt(item.price * item.quantity)}</span>
                </div>

                {/* Desktop: Qty */}
                <div className="col-span-3 hidden sm:flex justify-center">
                  <div className="cart-quantity neo-inset flex items-center rounded-xl overflow-hidden h-10">
                    <button onClick={() => updateQty(item.id, item.size, item.quantity - 1)} className="w-10 h-full flex items-center justify-center text-white/40 hover:text-white transition-colors">−</button>
                    <span className="w-8 text-center text-white text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.size, item.quantity + 1)} className="w-10 h-full flex items-center justify-center text-white/40 hover:text-white transition-colors">+</button>
                  </div>
                </div>

                {/* Desktop: Total */}
                <div className="col-span-3 hidden sm:block text-right">
                  <p className="text-white font-medium">{fmt(item.price * item.quantity)}</p>
                  <p className="text-white/30 text-xs mt-1">{fmt(item.price)} each</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="neo-panel sticky top-32">
            <h2 className="text-white text-sm font-medium tracking-widest uppercase mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-sm mb-6 border-b border-white/[0.06] pb-6">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Subtotal</span>
                <span className="text-white font-medium">{fmt(total())}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Estimated Shipping</span>
                <span className="text-white font-medium">Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-white/70 font-medium">Estimated Total</span>
              <div className="text-right">
                <span className="text-white text-2xl font-medium block leading-none">{fmt(total())}</span>
                <span className="text-white/30 text-[10px] uppercase tracking-widest mt-1.5 block">PHP</span>
              </div>
            </div>

            <Link href="/checkout" className="btn-primary w-full text-center py-4 text-sm block">
              Proceed to Checkout
            </Link>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-white/30 text-xs">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure encrypted checkout
              </div>
              <div className="flex items-center gap-3 text-white/30 text-xs">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Easy 14-day returns policy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
