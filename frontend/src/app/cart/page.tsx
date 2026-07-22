import { Metadata } from 'next'
import CartClient from '@/components/storefront/cart/CartClient'

export const metadata: Metadata = {
  title: 'Your Cart | 7TH SOUTH STREET',
  description: 'Review your cart and proceed to checkout.',
}

export default function CartPage() {
  return (
    <main className="site-shell bg-[#080808] min-h-screen flex flex-col">
      <div className="flex-1 pt-32 lg:pt-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-8">
          <h1 className="neo-heading text-[clamp(2.5rem,4vw,3.5rem)]">Your Cart</h1>
        </div>
        
        <CartClient />
      </div>
    </main>
  )
}
