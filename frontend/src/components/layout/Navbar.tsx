'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { useCart } from '@/store/cart'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useDismissibleLayer } from '@/hooks/useDismissibleLayer'
import { getAuthErrorMessage } from '@/lib/auth/customer-auth'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/shop', label: 'Shop' },
  { href: '/events', label: 'Events' },
  { href: '/#brand', label: 'Brand' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
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
    let active = true
    const supabase = createClient()

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!active) return
        setAuthUser(data.user ?? null)
      } catch (error) {
        if (!active) return
        setAuthUser(null)
      } finally {
        if (active) setAuthReady(true)
      }
    }

    void checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setAuthUser(session?.user ?? null)
      setAuthReady(true)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useDismissibleLayer(menuOpen, () => setMenuOpen(false), mobileMenuRef)

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setLogoutError('')

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) throw new Error('Logout failed')

      setAuthUser(null)
      setMenuOpen(false)
      router.replace('/')
      router.refresh()
    } catch (error) {
      const message = getAuthErrorMessage(error, 'logout')
      setLogoutError(message)
      toast.error(message)
    } finally {
      setIsLoggingOut(false)
    }
  }

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
            {authReady && (authUser ? (
              <>
                <Link href="/account" className={`site-nav__link ${pathname.startsWith('/account') ? 'is-active' : ''}`} aria-current={pathname.startsWith('/account') ? 'page' : undefined}>
                  Account
                </Link>
                <button type="button" onClick={handleLogout} disabled={isLoggingOut} aria-busy={isLoggingOut} className="site-nav__link border-0 bg-transparent">
                  {isLoggingOut ? 'Signing out…' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={`site-nav__link ${pathname === '/login' ? 'is-active' : ''}`} aria-current={pathname === '/login' ? 'page' : undefined}>
                  Login
                </Link>
                <Link href="/create-account" className={`site-nav__link ${pathname === '/create-account' ? 'is-active' : ''}`} aria-current={pathname === '/create-account' ? 'page' : undefined}>
                  Create Account
                </Link>
              </>
            ))}
          </div>

          <div className="site-nav__actions">
            <ThemeToggle compact className="site-nav__theme" />
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
            ref={mobileMenuRef}
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
              {authReady && (authUser ? (
                <>
                  <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <Link href="/account" onClick={() => setMenuOpen(false)} aria-current={pathname.startsWith('/account') ? 'page' : undefined}>Account</Link>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      aria-busy={isLoggingOut}
                      className="w-full rounded-2xl border-0 bg-transparent px-4 py-3 text-left text-[2rem] font-medium text-[var(--neo-text)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {isLoggingOut ? 'Signing out…' : 'Logout'}
                    </button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <Link href="/login" onClick={() => setMenuOpen(false)} aria-current={pathname === '/login' ? 'page' : undefined}>Login</Link>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <Link href="/create-account" onClick={() => setMenuOpen(false)} aria-current={pathname === '/create-account' ? 'page' : undefined}>Create Account</Link>
                  </motion.div>
                </>
              ))}
            </nav>
            <div className="mobile-navigation__theme">
              <span>Appearance</span>
              <ThemeToggle />
            </div>
            <p>7Th South Street © 2024</p>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="sr-only" role="status" aria-live="polite">
        {logoutError || (isLoggingOut ? 'Signing out.' : '')}
      </p>
    </>
  )
}
