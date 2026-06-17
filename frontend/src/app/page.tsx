'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/layout/CartDrawer'

// Sample products shown even without backend
const SAMPLE_PRODUCTS = [
  { id: 1, name: '7SS Arch Logo Snapback', slug: '7ss-arch-logo-snapback', price: 895, category_name: 'Headwear', status: 'available' },
  { id: 2, name: 'South Street Fitted', slug: 'south-street-fitted-59fifty', price: 1200, category_name: 'Headwear', status: 'available' },
  { id: 3, name: '7SS Oversized Tee — Bone', slug: '7ss-oversized-tee-bone', price: 650, category_name: 'Tops', status: 'available' },
  { id: 4, name: '7SS Premium Hoodie', slug: '7ss-premium-hoodie-black', price: 1895, category_name: 'Hoodies & Sweats', status: 'available' },
]

function ProductCard({ product, index }: { product: any; index: number }) {
  const fmt = (n: number) => '₱' + n.toLocaleString('en-PH')
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group"
    >
      <Link href={`/shop/${product.slug}`} className="block">
        {/* Image */}
        <div
          className="relative overflow-hidden mb-4 bg-[#111010] border border-white/[0.05]"
          style={{ aspectRatio: '3/4' }}
        >
          {/* Placeholder with brand watermark */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: 'linear-gradient(135deg, #0E0C0A 0%, #161412 100%)' }}
          >
            <div
              className="border border-white/[0.06] flex items-center justify-center transition-all duration-500 group-hover:border-[#C9A96E]/20"
              style={{ width: 56, height: 56 }}
            >
              <img src="/logo.png" alt="7SS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.15 }} className="transition-all duration-500 group-hover:opacity-30" />
            </div>
            <span className="text-white/[0.08] text-[10px] tracking-[0.4em] uppercase">{product.category_name}</span>
          </div>
          {/* Hover overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 border-t border-white/10 py-3 text-center"
            style={{
              background: 'rgba(8,8,8,0.92)',
              backdropFilter: 'blur(4px)',
              transform: 'translateY(100%)',
              transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            ref={el => {
              if (!el) return
              const parent = el.closest('.group')
              if (!parent) return
              parent.addEventListener('mouseenter', () => el.style.transform = 'translateY(0)')
              parent.addEventListener('mouseleave', () => el.style.transform = 'translateY(100%)')
            }}
          >
            <span className="text-white text-[10px] font-medium tracking-widest uppercase">View Product</span>
          </div>
        </div>
        {/* Info */}
        <div>
          <p className="text-white/30 text-[10px] tracking-widest uppercase mb-1">{product.category_name}</p>
          <h3 className="text-white/80 text-sm font-medium mb-1.5 group-hover:text-[#C9A96E] transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-white/60 text-sm">{fmt(product.price)}</p>
        </div>
      </Link>
    </motion.div>
  )
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const [products, setProducts] = useState(SAMPLE_PRODUCTS)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) return
    fetch(`${apiUrl}/api/products?featured=1&per_page=4`)
      .then(r => r.json())
      .then(r => { if (r.data?.length) setProducts(r.data) })
      .catch(() => {}) // silently fall back to sample data
  }, [])

  return (
    <main style={{ background: '#080808', minHeight: '100vh' }}>
      <Navbar />
      <CartDrawer />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ height: '100vh', display: 'flex', alignItems: 'flex-end' }}>
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          {/* Dark cinematic background */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0A0808 0%, #080808 50%, #0C0A08 100%)' }} />
          {/* Radial gold glow */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 65% 40%, rgba(201,169,110,0.04) 0%, transparent 70%)' }} />
          {/* Subtle grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          {/* Giant 7SS watermark */}
          <div className="absolute right-0 top-1/2 pointer-events-none select-none" style={{ transform: 'translate(-4%, -50%)', opacity: 0.025 }}>
            <span style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(180px, 22vw, 380px)', fontWeight: 300, lineHeight: 1, color: 'white', letterSpacing: '-0.04em' }}>
              7SS
            </span>
          </div>
        </motion.div>

        {/* Hero content */}
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 w-full pb-24 lg:pb-32" style={{ zIndex: 10 }}>


          <motion.h1
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontSize: 'clamp(54px, 8vw, 120px)',
              fontWeight: 300,
              letterSpacing: '-0.035em',
              lineHeight: 0.98,
              color: '#F5F2EE',
              marginBottom: 40,
            }}
          >
            7Th<br />South<br />Street.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
            style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
          >
            <Link href="/shop" className="btn-primary">Shop Now</Link>
            <Link href="/events" className="btn-outline">Upcoming Events</Link>
          </motion.div>
        </div>

        {/* Scroll line */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{ zIndex: 10 }}
        >
          <motion.div
            animate={{ scaleY: [1, 0.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)' }}
          />
        </motion.div>
      </section>

      {/* ── TICKER ────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 0', overflow: 'hidden' }}>
        <div className="ticker-content" style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase' }}>
          {Array(8).fill('7TH SOUTH STREET — PREMIUM UNDERGROUND STREETWEAR — PHILIPPINES — MINIMALIST — DARK — ').join('')}
        </div>
      </div>

      {/* ── FEATURED COLLECTION ───────────────────────────────── */}
      <section className="py-24 lg:py-36" style={{ maxWidth: '88rem', margin: '0 auto', padding: '96px 48px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <p style={{ color: '#C9A96E', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 12 }}>Featured</p>
            <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, color: '#F5F2EE', letterSpacing: '-0.02em', lineHeight: 1 }}>
              The Collection
            </h2>
          </div>
          <Link href="/shop" style={{ color: 'rgba(245,242,238,0.4)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', transition: 'color 0.2s' }}
            className="hover:text-white">
            View All →
          </Link>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* ── BRAND STORY ───────────────────────────────────────── */}
      <section id="brand" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '96px 48px' }}>
        <div style={{ maxWidth: '88rem', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="grid-cols-1 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <p style={{ color: '#C9A96E', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 24 }}>The Brand</p>
            <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(40px, 5vw, 76px)', fontWeight: 300, color: '#F5F2EE', lineHeight: 1.0, letterSpacing: '-0.025em', marginBottom: 32 }}>
              Nonchalant<br />Luxury.<br />Underground<br />Culture.
            </h2>
            <p style={{ color: 'rgba(245,242,238,0.35)', fontSize: 14, lineHeight: 1.8, maxWidth: 400, marginBottom: 32 }}>
              7Th South Street is not a brand — it's a frequency. Born from the streets of the Philippines, built on the principle that real style never needs to announce itself. We make pieces for those who know.
            </p>
            <Link href="/shop" className="btn-outline">Explore Shop</Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }} style={{ position: 'relative' }}>
            <div style={{ aspectRatio: '4/5', background: '#111010', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201,169,110,0.05) 0%, transparent 70%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo.png" alt="7Th South Street Logo" style={{ width: '85%', height: '85%', objectFit: 'contain', opacity: 0.6 }} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase' }}>Campaign 2024</p>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -16, right: -16, width: 96, height: 96, border: '1px solid rgba(201,169,110,0.08)' }} />
          </motion.div>
        </div>
      </section>

      {/* ── NEWSLETTER ────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p style={{ color: '#C9A96E', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16 }}>Stay Connected</p>
            <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, color: '#F5F2EE', letterSpacing: '-0.02em', marginBottom: 16 }}>
              First to know.
            </h2>
            <p style={{ color: 'rgba(245,242,238,0.3)', fontSize: 14, marginBottom: 40 }}>New drops, pop-ups, and behind-the-scenes. No spam.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const input = (e.target as HTMLFormElement).querySelector('input') as HTMLInputElement
                try {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                  await fetch(`${apiUrl}/api/newsletter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: input.value }) })
                  const toast = (await import('react-hot-toast')).default
                  toast.success("You're in.")
                  input.value = ''
                } catch { }
              }}
              style={{ display: 'flex', gap: 0, maxWidth: 380, margin: '0 auto' }}
            >
              <input type="email" required placeholder="Enter your email"
                className="input-dark"
                style={{ flex: 1, borderRight: 'none' }} />
              <button type="submit" className="btn-primary" style={{ padding: '12px 28px', whiteSpace: 'nowrap' }}>
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
