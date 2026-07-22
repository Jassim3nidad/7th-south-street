'use client'

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import OrderDetails from '@/components/orders/OrderDetails'
import { getTrackedOrder, TrackedOrder } from '@/app/actions/orders'
import toast from 'react-hot-toast'

function TrackOrderForm() {
  const searchParams = useSearchParams()
  const initialOrderNumber = searchParams.get('order') || ''
  
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<TrackedOrder | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber || !email) {
      toast.error('Please enter both your order number and email.')
      return
    }

    setLoading(true)
    try {
      const result = await getTrackedOrder(orderNumber, email)
      if (result) {
        setOrder(result)
        toast.success('Order found!')
      } else {
        setOrder(null)
        toast.error('Order not found. Please verify your details.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to fetch order at this time.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-32 sm:py-40">
      {!order ? (
        <div className="neo-panel max-w-md mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="neo-heading text-3xl">Track Order</h1>
            <p className="neo-muted mt-2 text-sm">Enter your order details below</p>
          </div>
          <form onSubmit={handleTrack} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="orderNumber" className="neo-kicker block">Order Number</label>
              <input
                id="orderNumber"
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="7SS-XXXXXXXX"
                className="input-dark"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="neo-kicker block">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-dark"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-xs tracking-[0.2em] uppercase disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 text-center">
             <button onClick={() => setOrder(null)} className="btn-ghost">
               &larr; Track Another Order
             </button>
          </div>
          <OrderDetails order={order} />
        </motion.div>
      )}
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <main className="site-shell flex min-h-screen flex-col">
      <Suspense fallback={
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full animate-spin" />
        </div>
      }>
        <TrackOrderForm />
      </Suspense>
    </main>
  )
}
