'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'done'>('idle')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === 'loading') return
    setStatus('loading')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      await fetch(`${apiUrl}/api/newsletter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      setStatus('done')
      setEmail('')
    } catch { setStatus('idle') }
  }

  return (
    <footer style={{ background: '#080808', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 80, paddingBottom: 40 }}>
      {/* Ticker */}
      <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 0', marginBottom: 64 }}>
        <div className="ticker-content" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase' }}>
          {Array(8).fill('7TH SOUTH STREET — PREMIUM UNDERGROUND STREETWEAR — PHILIPPINES — ').join('')}
        </div>
      </div>

      <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 64 }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/logo.png" alt="7Th South Street Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
              </div>
              <span style={{ color: '#F5F2EE', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500 }}>7Th South Street</span>
            </div>
            <p style={{ color: 'rgba(245,242,238,0.35)', fontSize: 13, lineHeight: 1.8, maxWidth: 280, marginBottom: 32 }}>
              Premium underground streetwear from the Philippines. Minimalist by design. Nonchalant by nature.
            </p>
            {status === 'done' ? (
              <p style={{ color: '#C9A96E', fontSize: 12, letterSpacing: '0.1em' }}>You're in. ✓</p>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', maxWidth: 300 }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" required
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', padding: '10px 16px', color: '#F5F2EE', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                <button type="submit" disabled={status === 'loading'}
                  style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,242,238,0.6)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  {status === 'loading' ? '...' : 'Sub'}
                </button>
              </form>
            )}
          </div>

          {/* Navigation */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 24 }}>Navigation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{href:'/shop',label:'Shop All'},{href:'/shop?category=headwear',label:'Headwear'},{href:'/shop?category=tops',label:'Tops'},{href:'/shop?category=hoodies-sweats',label:'Hoodies'},{href:'/events',label:'Events'}].map(l => (
                <Link key={l.href} href={l.href} style={{ color: 'rgba(245,242,238,0.35)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#F5F2EE'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(245,242,238,0.35)'}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 24 }}>Follow</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{href:'https://instagram.com/7thsouthstreet',label:'Instagram'},{href:'https://tiktok.com',label:'TikTok'},{href:'https://twitter.com',label:'Twitter / X'}].map(l => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'rgba(245,242,238,0.35)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#C9A96E'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(245,242,238,0.35)'}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, letterSpacing: '0.08em' }}>© 2024 7Th South Street. All rights reserved.</p>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.12)'}>
            Admin
          </Link>
        </div>
      </div>
    </footer>
  )
}
