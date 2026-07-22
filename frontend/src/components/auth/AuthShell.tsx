import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type AuthShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  wide?: boolean
}

export default function AuthShell({ eyebrow, title, description, children, wide = false }: AuthShellProps) {
  return (
    <main className="site-shell">
      <section className="auth-page" aria-labelledby="auth-page-title">
        <div className="auth-page__glow" aria-hidden="true" />
        <div className={`auth-card neo-panel ${wide ? 'auth-card--wide' : ''}`}>
          <Link href="/" className="auth-card__brand" aria-label="7Th South Street home">
            <span className="auth-card__logo neo-inset">
              <Image src="/logo.png" alt="" width={32} height={32} className="brand-logo" />
            </span>
            <span>
              <strong>7Th South Street</strong>
              <small>Customer Account</small>
            </span>
          </Link>

          <div className="auth-card__heading">
            <p className="neo-kicker">{eyebrow}</p>
            <h1 id="auth-page-title" className="neo-heading">{title}</h1>
            <p>{description}</p>
          </div>

          {children}
        </div>
      </section>
    </main>
  )
}

export function AuthNotice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'success' | 'error' }) {
  return (
    <div
      className={`auth-notice auth-notice--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </div>
  )
}
