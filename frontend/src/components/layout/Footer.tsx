'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

const navigation = [
  { href: '/shop', label: 'Shop All' },
  { href: '/shop?category=headwear', label: 'Headwear' },
  { href: '/shop?category=tops', label: 'Tops' },
  { href: '/shop?category=hoodies-sweats', label: 'Hoodies' },
  { href: '/events', label: 'Events' },
]

const social = [
  { href: 'https://instagram.com/7thsouthstreet', label: 'Instagram' },
  { href: 'https://tiktok.com', label: 'TikTok' },
  { href: 'https://twitter.com', label: 'Twitter / X' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email || status === 'loading') return
    setStatus('loading')
    try {
      await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      setStatus('done')
      setEmail('')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__ticker neo-inset">
        <div className="ticker-content">
          {Array(8).fill('7TH SOUTH STREET — PREMIUM UNDERGROUND STREETWEAR — PHILIPPINES — ').join('')}
        </div>
      </div>

      <div className="site-container site-footer__surface neo-surface">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <div className="site-footer__identity">
              <span className="site-footer__logo neo-inset"><Image src="/logo.png" alt="" width={28} height={28} className="brand-logo" /></span>
              <span>7Th South Street</span>
            </div>
            <p>Premium underground streetwear from the Philippines. Minimalist by design. Nonchalant by nature.</p>
            {status === 'done' ? (
              <p className="site-footer__success" role="status">You&apos;re in. ✓</p>
            ) : (
              <form onSubmit={handleSubscribe} className="site-footer__form">
                <label htmlFor="footer-email" className="sr-only">Your email</label>
                <input id="footer-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Your email" required className="input-dark" />
                <button type="submit" disabled={status === 'loading'} className="btn-primary" aria-label="Subscribe to newsletter">
                  {status === 'loading' ? '…' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>

          <div className="site-footer__links">
            <p>Navigation</p>
            <nav aria-label="Footer navigation">
              {navigation.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            </nav>
          </div>

          <div className="site-footer__links">
            <p>Follow</p>
            <div>
              {social.map(link => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>)}
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© 2024 7Th South Street. All rights reserved.</p>
          <Link href="/admin">Admin</Link>
        </div>
      </div>
    </footer>
  )
}
