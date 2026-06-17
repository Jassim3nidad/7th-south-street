'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/store/cart'
import Link from 'next/link'
import Image from 'next/image'

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQty, total, count } = useCart()

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={toggleCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-[#0E0C0A] border-l border-white/[0.06] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div>
                <h2 className="text-white text-sm font-medium tracking-widest uppercase">Cart</h2>
                <p className="text-white/30 text-xs mt-0.5">{count()} {count() === 1 ? 'item' : 'items'}</p>
              </div>
              <button
                onClick={toggleCart}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 border border-white/10 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-white/30 text-sm">Your cart is empty</p>
                  <button
                    onClick={toggleCart}
                    className="text-[#C9A96E] text-xs tracking-widest uppercase hover:text-white transition-colors"
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
                    className="flex gap-4 py-4 border-b border-white/[0.05]"
                  >
                    {/* Image */}
                    <div className="w-20 h-24 bg-white/[0.04] border border-white/[0.06] overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={80} height={96} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2">
                          <img src="/logo.png" alt="7SS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.15 }} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                      <p className="text-white/40 text-xs mt-0.5 tracking-wider">Size: {item.size}</p>
                      <p className="text-[#C9A96E] text-sm mt-1">{fmt(item.price)}</p>

                      <div className="flex items-center justify-between mt-3">
                        {/* Qty */}
                        <div className="flex items-center border border-white/10">
                          <button
                            onClick={() => updateQty(item.id, item.size, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-white text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.id, item.size, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id, item.size)}
                          className="text-white/20 hover:text-[#E63B2E] text-xs tracking-wider uppercase transition-colors"
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
              <div className="border-t border-white/[0.06] px-6 py-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs tracking-widest uppercase">Subtotal</span>
                  <span className="text-white text-base font-medium">{fmt(total())}</span>
                </div>
                <p className="text-white/20 text-xs">Shipping calculated at checkout</p>
                <Link
                  href="/checkout"
                  onClick={toggleCart}
                  className="block w-full text-center py-3.5 bg-[#F5F2EE] text-[#080808] text-xs font-medium tracking-widest uppercase hover:bg-[#C9A96E] transition-colors duration-300"
                >
                  Checkout
                </Link>
                <button
                  onClick={toggleCart}
                  className="block w-full text-center py-2 text-white/30 text-xs tracking-widest uppercase hover:text-white transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
