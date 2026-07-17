'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useCart } from '@/store/cart'

const links = [
  { href: '/shop', label: 'Shop' },
  { href: '/events', label: 'Events' },
  { href: '/#brand', label: 'Brand' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { count, toggleCart } = useCart()
  const cartCount = count()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <motion.nav
        initial={false}
        animate={{ y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={`site-nav ${scrolled ? 'site-nav--scrolled' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="site-nav__inner">
          <Link href="/" className="site-nav__brand" aria-label="7Th South Street home">
            <span className="site-nav__logo neo-inset">
              <Image src="/logo.png" alt="" width={28} height={28} className="brand-logo" />
            </span>
            <span className="site-nav__wordmark">7Th South Street</span>
          </Link>

          <div className="hidden lg:flex site-nav__links">
            {links.map(link => {
              const active = link.href !== '/#brand' && pathname.startsWith(link.href)
              return (
                <Link key={link.href} href={link.href} className={`site-nav__link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="site-nav__actions">
            <button onClick={toggleCart} className="neo-icon-button" aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}>
              <svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && <span className="site-nav__count">{cartCount}</span>}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(open => !open)}
              className="neo-icon-button lg:hidden"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              <span className="sr-only">Menu</span>
              <span className="site-nav__hamburger" aria-hidden="true">
                <motion.span animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 6 : 0 }} />
                <motion.span animate={{ opacity: menuOpen ? 0 : 1 }} />
                <motion.span animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -6 : 0 }} />
              </span>
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-navigation"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="mobile-navigation neo-surface"
          >
            <nav aria-label="Mobile navigation">
              {links.map((link, index) => (
                <motion.div key={link.href} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + index * 0.05 }}>
                  <Link href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>
                </motion.div>
              ))}
            </nav>
            <p>7Th South Street © 2024</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
