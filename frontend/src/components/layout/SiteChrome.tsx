'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import CartDrawer from '@/components/layout/CartDrawer'
import Footer from '@/components/layout/Footer'

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  if (isAdminRoute) return <div>{children}</div>

  return (
    <div className="site-shell">
      <Navbar />
      <CartDrawer />
      {children}
      <Footer />
    </div>
  )
}
