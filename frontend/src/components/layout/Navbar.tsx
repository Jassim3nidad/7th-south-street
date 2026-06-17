'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/store/cart'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { count, toggleCart } = useCart()
  const cartCount = count()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '/shop', label: 'Shop' },
    { href: '/events', label: 'Events' },
    { href: '/#brand', label: 'Brand' },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 50,
          transition: 'background 0.5s ease, border-color 0.5s ease',
          background: scrolled ? 'rgba(8,8,8,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="7Th South Street Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
            </div>
            <span style={{ color: '#F5F2EE', fontSize: 12, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-body), sans-serif' }}>
              7Th South Street
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex" style={{ gap: 40, alignItems: 'center' }}>
            {links.map(l => (
              <Link key={l.href} href={l.href} style={{ color: 'rgba(245,242,238,0.45)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#F5F2EE'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(245,242,238,0.45)'}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Cart */}
            <button onClick={toggleCart} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,242,238,0.55)', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, background: '#C9A96E', color: '#080808', fontSize: 9, fontWeight: 600, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, padding: 4 }}
            >
              <motion.span animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 8 : 0 }} style={{ display: 'block', width: 22, height: 1, background: 'rgba(245,242,238,0.7)' }} />
              <motion.span animate={{ opacity: menuOpen ? 0 : 1 }} style={{ display: 'block', width: 22, height: 1, background: 'rgba(245,242,238,0.7)' }} />
              <motion.span animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -8 : 0 }} style={{ display: 'block', width: 22, height: 1, background: 'rgba(245,242,238,0.7)' }} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: '#080808', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 48px' }}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {links.map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                  <Link href={l.href} onClick={() => setMenuOpen(false)}
                    style={{ color: 'rgba(245,242,238,0.8)', fontSize: 'clamp(36px, 6vw, 52px)', fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 300, textDecoration: 'none', letterSpacing: '-0.01em', display: 'block' }}>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div style={{ marginTop: 64, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32 }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase' }}>7Th South Street © 2024</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
