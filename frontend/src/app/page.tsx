'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/layout/CartDrawer'
import ProductCard from '@/components/shop/ProductCard'

const SAMPLE_PRODUCTS = [
  { id: 1, name: '7SS Arch Logo Snapback', slug: '7ss-arch-logo-snapback', price: 895, category_name: 'Headwear', status: 'available' },
  { id: 2, name: 'South Street Fitted', slug: 'south-street-fitted-59fifty', price: 1200, category_name: 'Headwear', status: 'available' },
  { id: 3, name: '7SS Oversized Tee — Bone', slug: '7ss-oversized-tee-bone', price: 650, category_name: 'Tops', status: 'available' },
  { id: 4, name: '7SS Premium Hoodie', slug: '7ss-premium-hoodie-black', price: 1895, category_name: 'Hoodies & Sweats', status: 'available' },
]

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.3])
  const [products, setProducts] = useState(SAMPLE_PRODUCTS)

  useEffect(() => {
    fetch('/api/products?featured=1&per_page=4')
      .then(response => response.json())
      .then(response => { if (response.data?.length) setProducts(response.data) })
      .catch(() => {})
  }, [])

  return (
    <main className="site-shell">
      <Navbar />
      <CartDrawer />

      <section ref={heroRef} className="neo-hero" aria-labelledby="home-title">
        <motion.div className="neo-hero__glow" style={{ y: heroY, opacity: heroOpacity }} aria-hidden="true" />
        <div className="site-container neo-hero__grid">
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }} className="neo-hero__copy">
            <p className="neo-kicker">Premium Underground Streetwear</p>
            <h1 id="home-title" className="neo-heading neo-hero__title">7Th<br />South<br />Street.</h1>
            <div className="neo-hero__actions">
              <Link href="/shop" className="btn-primary">Shop Now</Link>
              <Link href="/events" className="btn-outline">Upcoming Events</Link>
            </div>
          </motion.div>

          <motion.div initial={false} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.78, ease: [0.22, 1, 0.36, 1] }} className="neo-hero__art neo-surface" aria-hidden="true">
            <span className="neo-hero__watermark">7SS</span>
            <div className="neo-hero__medallion neo-inset">
              <Image src="/logo.png" alt="" width={128} height={128} className="brand-logo" />
            </div>
            <div className="neo-hero__art-copy">
              <span>Nonchalant Luxury.</span>
              <span>Underground Culture.</span>
            </div>
            <span className="neo-hero__index">07 / SS</span>
          </motion.div>
        </div>
      </section>

      <div className="neo-ticker neo-inset" aria-label="Brand statement">
        <div className="ticker-content">
          {Array(8).fill('7TH SOUTH STREET — PREMIUM UNDERGROUND STREETWEAR — PHILIPPINES — MINIMALIST — DARK — ').join('')}
        </div>
      </div>

      <section className="site-section" aria-labelledby="featured-title">
        <div className="site-container">
          <motion.div initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="section-heading">
            <div>
              <p className="neo-kicker">Featured</p>
              <h2 id="featured-title" className="neo-heading">The Collection</h2>
            </div>
            <Link href="/shop" className="section-heading__link">View All <span aria-hidden="true">→</span></Link>
          </motion.div>

          <div className="product-grid">
            {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
          </div>
        </div>
      </section>

      <section id="brand" className="site-section neo-story" aria-labelledby="brand-title">
        <div className="site-container neo-story__grid">
          <motion.div initial={false} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.62 }} className="neo-story__copy">
            <p className="neo-kicker">The Brand</p>
            <h2 id="brand-title" className="neo-heading">Nonchalant<br />Luxury.<br />Underground<br />Culture.</h2>
            <p className="neo-story__body">
              7Th South Street is not a brand — it&apos;s a frequency. Born from the streets of the Philippines, built on the principle that real style never needs to announce itself. We make pieces for those who know.
            </p>
            <Link href="/shop" className="btn-outline">Explore Shop</Link>
          </motion.div>

          <motion.div initial={false} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.62, delay: 0.12 }} className="neo-story__visual neo-surface">
            <div className="neo-story__logo neo-inset"><Image src="/logo.png" alt="7Th South Street logo" width={128} height={128} className="brand-logo" /></div>
            <p>Campaign 2024</p>
            <span aria-hidden="true">7SS</span>
          </motion.div>
        </div>
      </section>

      <section className="site-section" aria-labelledby="newsletter-title">
        <div className="site-container">
          <motion.div initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="neo-newsletter neo-surface">
            <p className="neo-kicker">Stay Connected</p>
            <h2 id="newsletter-title" className="neo-heading">First to know.</h2>
            <p>New drops, pop-ups, and behind-the-scenes. No spam.</p>
            <form
              onSubmit={async event => {
                event.preventDefault()
                const input = event.currentTarget.querySelector('input') as HTMLInputElement
                try {
                  await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: input.value }) })
                  const toast = (await import('react-hot-toast')).default
                  toast.success("You're in.")
                  input.value = ''
                } catch {}
              }}
            >
              <label htmlFor="home-newsletter" className="sr-only">Email address</label>
              <input id="home-newsletter" type="email" required placeholder="Enter your email" className="input-dark" />
              <button type="submit" className="btn-primary">Subscribe</button>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
