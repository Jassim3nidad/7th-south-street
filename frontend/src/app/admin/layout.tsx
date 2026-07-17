'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAdmin } from '@/store/admin'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useDismissibleLayer } from '@/hooks/useDismissibleLayer'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/admin/products', label: 'Products', icon: '◇' },
  { href: '/admin/orders', label: 'Orders', icon: '◫' },
  { href: '/admin/events', label: 'Events', icon: '◉' },
  { href: '/admin/customers', label: 'Customers', icon: '◎' },
  { href: '/admin/inventory', label: 'Inventory', icon: '◧' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout, isAuthenticated, setAuth } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileDrawerRef = useRef<HTMLElement>(null)

  useDismissibleLayer(mobileOpen, () => setMobileOpen(false), mobileDrawerRef)

  useEffect(() => {
    if (pathname === '/admin' || isAuthenticated()) return
    authApi.me('cookie-session')
      .then((response: any) => setAuth(response.data, 'cookie-session'))
      .catch(() => {
        logout()
        router.push('/admin')
      })
  }, [pathname, isAuthenticated, logout, router, setAuth])

  useEffect(() => setMobileOpen(false), [pathname])

  if (pathname === '/admin') return <>{children}</>

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      logout()
      toast.success('Logged out')
      router.push('/admin')
    }
  }

  const sidebarContent = (
    <>
      <div className="admin-brand">
        <span className="admin-brand__logo neo-inset"><Image src="/logo.png" alt="" width={28} height={28} className="brand-logo" /></span>
        <div>
          <p>The Vault</p>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="admin-navigation" aria-label="Admin navigation">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className={`admin-nav-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="admin-theme">
        <span>Appearance</span>
        <ThemeToggle />
      </div>

      <div className="admin-user">
        <div className="admin-user__identity">
          <span className="admin-user__avatar neo-inset">{admin?.name?.[0] || 'A'}</span>
          <div>
            <p>{admin?.name || 'Admin'}</p>
            <span>{admin?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost">Sign Out</button>
      </div>
    </>
  )

  return (
    <div className="admin-shell">
      <header className="admin-mobile-header neo-surface-sm">
        <div className="admin-mobile-header__brand">
          <span className="neo-inset"><Image src="/logo.png" alt="" width={28} height={28} className="brand-logo" /></span>
          <p>The Vault</p>
        </div>
        <button type="button" className="neo-icon-button" onClick={() => setMobileOpen(open => !open)} aria-label={mobileOpen ? 'Close admin menu' : 'Open admin menu'} aria-expanded={mobileOpen} aria-controls="admin-mobile-navigation">
          <span className="site-nav__hamburger" aria-hidden="true"><span /><span /><span /></span>
        </button>
      </header>

      <aside className="admin-sidebar neo-surface-sm">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="admin-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <aside ref={mobileDrawerRef} id="admin-mobile-navigation" className="admin-mobile-drawer neo-surface" onClick={event => event.stopPropagation()}>{sidebarContent}</aside>
        </div>
      )}

      <main className="admin-main">{children}</main>
    </div>
  )
}
