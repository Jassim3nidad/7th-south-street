'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/store/cart'
import { ordersApi } from '@/lib/api'
import { validateCartItems } from '@/app/actions/cart'
import { getCheckoutProfile } from '@/app/actions/checkout'
import toast from 'react-hot-toast'
import Image from 'next/image'

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

const SHIPPING_FEE = 150

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'', address:'', city:'', province:'', postal:'', payment_method:'cod', notes:'' })
  const [isValidating, setIsValidating] = useState(true)
  const [cartError, setCartError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      if (items.length === 0) {
        setIsValidating(false)
        setIsFetchingProfile(false)
        return
      }

      setIsValidating(true)
      try {
        // Validate cart
        const res = await validateCartItems(items)
        if (res.conflicts.length > 0) {
          setCartError('Your cart has issues that need to be resolved before checkout.')
          toast.error("Please review your cart items.")
        }
      } catch (error) {
        console.error("Cart validation error:", error)
      } finally {
        setIsValidating(false)
      }

      // Fetch profile
      try {
        const profile = await getCheckoutProfile()
        if (profile) {
          setForm(prev => ({
            ...prev,
            first_name: profile.first_name || prev.first_name,
            last_name: profile.last_name || prev.last_name,
            email: profile.email || prev.email,
            phone: profile.phone || prev.phone,
            address: profile.address || prev.address,
            city: profile.city || prev.city,
            province: profile.province || prev.province,
            postal: profile.postal || prev.postal,
          }))
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setIsFetchingProfile(false)
      }
    }
    init()
  }, []) // run once on load

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Your cart is empty'); return }
    if (cartError) { toast.error(cartError); return }
    
    // Front-end validation
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      // Re-validate strictly before final submission
      const validationRes = await validateCartItems(items)
      if (validationRes.conflicts.length > 0) {
        toast.error("Cart items changed! Please review your cart before checking out.")
        setCartError("Please review your cart items.")
        setLoading(false)
        router.push('/cart')
        return
      }

      const orderItems = items.map(item => ({ variant_id: item.variant_id, quantity: item.quantity }))
      const res: any = await ordersApi.create({
        idempotency_key: idempotencyKey,
        first_name: form.first_name,
        last_name: form.last_name,
        shipping_name: `${form.first_name} ${form.last_name}`,
        shipping_email: form.email,
        shipping_phone: form.phone,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_province: form.province,
        shipping_postal: form.postal,
        payment_method: form.payment_method,
        notes: form.notes,
        items: orderItems,
      })
      clearCart() // Only clear on successful order creation
      toast.success('Order placed!')
      router.push(`/order-confirmation?order=${res.data.order_number}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) return (
    <main className="site-shell">
      <Navbar />
      <div className="neo-state max-w-xl mx-auto mt-40 flex flex-col items-center justify-center gap-6 text-center px-6 py-20">
        <p className="text-white/20 text-2xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Your cart is empty</p>
        <button onClick={() => router.push('/shop')} className="btn-primary text-xs px-8 py-3">Shop Now</button>
      </div>
    </main>
  )

  if (isFetchingProfile || isValidating) {
    return (
      <main className="site-shell flex flex-col min-h-screen bg-[#080808]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="site-shell bg-[#080808] min-h-screen">
      <Navbar />
      <div className="site-container detail-layout max-w-6xl pt-32 lg:pt-40">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="neo-kicker mb-3">Checkout</p>
          <h1 className="neo-heading text-[clamp(2.5rem,5vw,4.5rem)]">Complete Your Order</h1>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} className="checkout-form neo-panel lg:col-span-3 space-y-8">
            <div>
              <p className="text-white/30 text-xs tracking-widest uppercase mb-4 pb-2 border-b border-white/[0.06]">Contact Info</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">First Name *</label>
                  <input name="first_name" value={form.first_name} onChange={handleChange} required className="input-dark" /></div>
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Last Name *</label>
                  <input name="last_name" value={form.last_name} onChange={handleChange} required className="input-dark" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-dark" /></div>
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Phone *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required className="input-dark" placeholder="+63 9XX XXX XXXX" /></div>
              </div>
            </div>

            <div>
              <p className="text-white/30 text-xs tracking-widest uppercase mb-4 pb-2 border-b border-white/[0.06]">Shipping Address (Philippines only)</p>
              <div className="space-y-3">
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Street Address *</label>
                  <input name="address" value={form.address} onChange={handleChange} required className="input-dark" /></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">City / Municipality *</label>
                    <input name="city" value={form.city} onChange={handleChange} required className="input-dark" /></div>
                  <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Region / Province *</label>
                    <input name="province" value={form.province} onChange={handleChange} required className="input-dark" /></div>
                </div>
                <div className="sm:w-1/2"><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Postal Code</label>
                  <input name="postal" value={form.postal} onChange={handleChange} className="input-dark" /></div>
              </div>
            </div>

            <div>
              <p className="text-white/30 text-xs tracking-widest uppercase mb-4 pb-2 border-b border-white/[0.06]">Payment Method</p>
              <div className="space-y-2">
                {[{ val:'cod', label:'Cash on Delivery' }, { val:'gcash', label:'GCash' }, { val:'bank_transfer', label:'Bank Transfer' }].map(opt => (
                  <label key={opt.val} className={`payment-option ${form.payment_method === opt.val ? 'is-active' : ''}`}>
                    <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${form.payment_method === opt.val ? 'border-[#C9A96E]' : 'border-white/20 group-hover:border-white/40'}`}>
                      {form.payment_method === opt.val && <div className="w-2 h-2 bg-[#C9A96E]" />}
                    </div>
                    <input type="radio" name="payment_method" value={opt.val} checked={form.payment_method === opt.val} onChange={handleChange} className="sr-only" />
                    <span className="text-white/60 text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Delivery Notes (optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="input-dark resize-none" placeholder="Any special instructions..." /></div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="neo-panel sticky top-24">
              <p className="text-white/30 text-xs tracking-widest uppercase mb-6">Order Summary</p>
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-3">
                    <div className="neo-inset w-14 h-18 overflow-hidden flex-shrink-0 aspect-[3/4]">
                      {item.image ? <Image src={item.image} alt={item.name} width={56} height={72} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center p-1"><Image src="/logo.png" alt="7SS Logo" width={56} height={72} className="brand-logo h-full w-full object-contain opacity-20" /></div>}
                    </div>
                    <div className="flex-1">
                      <p className="text-white/70 text-xs">{item.name}</p>
                      <p className="text-white/30 text-[10px]">Size: {item.size} · Qty: {item.quantity}</p>
                      <p className="text-white/60 text-xs mt-1">{fmt(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.06] pt-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-white/40">Subtotal</span><span className="text-white/60">{fmt(total())}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Shipping (Philippines)</span><span className="text-white/60">{fmt(SHIPPING_FEE)}</span></div>
                <div className="flex justify-between pt-3 border-t border-white/[0.06]">
                  <span className="text-white/70 font-medium">Total</span>
                  <span className="text-white text-base font-medium">{fmt(total() + SHIPPING_FEE)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
