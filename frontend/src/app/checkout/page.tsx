'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/store/cart'
import { ordersApi } from '@/lib/api'
import toast from 'react-hot-toast'
import Image from 'next/image'

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

const SHIPPING_FEE = 150

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'', address:'', city:'', province:'', postal:'', payment_method:'cod', notes:'' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Your cart is empty'); return }
    setLoading(true)
    try {
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
      clearCart()
      toast.success('Order placed!')
      router.push(`/order-confirmation?order=${res.data.order_number}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) return (
    <main className="bg-[#080808] min-h-screen">
      <Navbar />
      <div className="pt-40 flex flex-col items-center justify-center gap-6 text-center px-6">
        <p className="text-white/20 text-2xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Your cart is empty</p>
        <button onClick={() => router.push('/shop')} className="btn-primary text-xs px-8 py-3">Shop Now</button>
      </div>
    </main>
  )

  return (
    <main className="bg-[#080808] min-h-screen">
      <Navbar />
      <div className="pt-28 max-w-6xl mx-auto px-6 lg:px-12 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-[#C9A96E] text-xs tracking-[0.4em] uppercase mb-3">Checkout</p>
          <h1 className="text-white font-light" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.02em' }}>Complete Your Order</h1>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
            <div>
              <p className="text-white/30 text-xs tracking-widest uppercase mb-4 pb-2 border-b border-white/[0.06]">Contact Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">First Name *</label>
                  <input name="first_name" value={form.first_name} onChange={handleChange} required className="input-dark" /></div>
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Last Name *</label>
                  <input name="last_name" value={form.last_name} onChange={handleChange} required className="input-dark" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-dark" /></div>
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Phone *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required className="input-dark" placeholder="+63 9XX XXX XXXX" /></div>
              </div>
            </div>

            <div>
              <p className="text-white/30 text-xs tracking-widest uppercase mb-4 pb-2 border-b border-white/[0.06]">Shipping Address</p>
              <div className="space-y-3">
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Street Address *</label>
                  <input name="address" value={form.address} onChange={handleChange} required className="input-dark" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">City *</label>
                    <input name="city" value={form.city} onChange={handleChange} required className="input-dark" /></div>
                  <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Province</label>
                    <input name="province" value={form.province} onChange={handleChange} className="input-dark" /></div>
                </div>
                <div className="w-1/2"><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Postal Code</label>
                  <input name="postal" value={form.postal} onChange={handleChange} className="input-dark" /></div>
              </div>
            </div>

            <div>
              <p className="text-white/30 text-xs tracking-widest uppercase mb-4 pb-2 border-b border-white/[0.06]">Payment Method</p>
              <div className="space-y-2">
                {[{ val:'cod', label:'Cash on Delivery' }, { val:'gcash', label:'GCash' }, { val:'bank', label:'Bank Transfer' }].map(opt => (
                  <label key={opt.val} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${form.payment_method === opt.val ? 'border-[#C9A96E]' : 'border-white/20 group-hover:border-white/40'}`}>
                      {form.payment_method === opt.val && <div className="w-2 h-2 bg-[#C9A96E]" />}
                    </div>
                    <input type="radio" name="payment_method" value={opt.val} checked={form.payment_method === opt.val} onChange={handleChange} className="sr-only" />
                    <span className="text-white/60 text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Order Notes (optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="input-dark resize-none" placeholder="Any special instructions..." /></div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-[#F5F2EE] text-[#080808] text-xs font-medium tracking-widest uppercase hover:bg-[#C9A96E] transition-colors duration-300 disabled:opacity-50">
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="border border-white/[0.06] p-6 sticky top-24">
              <p className="text-white/30 text-xs tracking-widest uppercase mb-6">Order Summary</p>
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-3">
                    <div className="w-14 h-18 bg-white/[0.04] border border-white/[0.06] overflow-hidden flex-shrink-0 aspect-[3/4]">
                      {item.image ? <Image src={item.image} alt={item.name} width={56} height={72} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center p-1"><img src="/logo.png" alt="7SS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.15 }} /></div>}
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
                <div className="flex justify-between"><span className="text-white/40">Shipping</span><span className="text-white/60">{fmt(SHIPPING_FEE)}</span></div>
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
