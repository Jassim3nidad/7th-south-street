import { Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import OrderDetails from '@/components/orders/OrderDetails'
import { getTrackedOrder } from '@/app/actions/orders'

async function OrderConfirmationContent({ searchParams }: { searchParams: Promise<{ order?: string, key?: string }> }) {
  const resolvedParams = await searchParams
  const orderNumber = resolvedParams.order
  const trackingKey = resolvedParams.key

  if (!orderNumber) {
    return (
      <div className="neo-panel max-w-2xl mx-auto flex flex-col items-center justify-center gap-6 text-center px-6 py-20">
        <p className="text-white/40">No order number provided.</p>
        <Link href="/" className="btn-outline px-8 py-3 text-xs">Return Home</Link>
      </div>
    )
  }

  const order = await getTrackedOrder(orderNumber, undefined, trackingKey)

  if (!order) {
    return (
      <div className="neo-panel max-w-2xl mx-auto flex flex-col items-center justify-center gap-6 text-center px-6 py-20">
        <p className="text-white/40 mb-4">We could not retrieve this order's details. If you recently placed this order, check your email for confirmation.</p>
        <Link href={`/track?order=${orderNumber}`} className="btn-primary px-8 py-3 text-xs mb-2">Track Order Manually</Link>
        <Link href="/" className="btn-outline px-8 py-3 text-xs">Return Home</Link>
      </div>
    )
  }

  return <OrderDetails order={order} isImmediateConfirmation={true} />
}

export default function OrderConfirmationPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return (
    <main className="site-shell flex flex-col min-h-screen bg-[#080808]">
      <Navbar />
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-32 sm:py-40">
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full animate-spin" />
          </div>
        }>
          <OrderConfirmationContent searchParams={searchParams as Promise<{ order?: string, key?: string }>} />
        </Suspense>
      </div>
    </main>
  )
}
