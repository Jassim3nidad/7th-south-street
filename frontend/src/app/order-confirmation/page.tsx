'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <main className="bg-[#080808] min-h-screen">
      <Navbar />
      <div className="pt-40 flex flex-col items-center justify-center gap-8 text-center px-6 pb-24">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.6 }}
          className="w-16 h-16 border border-[#C9A96E]/40 flex items-center justify-center">
          <svg className="w-7 h-7 text-[#C9A96E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-[#C9A96E] text-xs tracking-[0.4em] uppercase mb-4">Order Confirmed</p>
          <h1 className="text-white font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 5vw, 60px)', letterSpacing: '-0.02em' }}>
            Thank you.
          </h1>
          {orderNumber && (
            <p className="text-white/40 text-sm mb-2">
              Order <span className="text-white/60 font-mono">{orderNumber}</span>
            </p>
          )}
          <p className="text-white/30 text-sm max-w-sm mx-auto leading-relaxed">
            We've received your order and will be in touch shortly. Check your email for confirmation.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex gap-4">
          <Link href="/shop" className="btn-primary text-xs px-8 py-3">Continue Shopping</Link>
          <Link href="/" className="btn-outline text-xs px-8 py-3">Back to Home</Link>
        </motion.div>
      </div>
    </main>
  )
}

export default function OrderConfirmationPage() {
  return <Suspense><OrderConfirmationContent /></Suspense>
}
