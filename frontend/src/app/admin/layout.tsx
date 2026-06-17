'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdmin } from '@/store/admin'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/admin/products', label: 'Products', icon: '▦' },
  { href: '/admin/orders', label: 'Orders', icon: '◫' },
  { href: '/admin/events', label: 'Events', icon: '◎' },
  { href: '/admin/customers', label: 'Customers', icon: '◉' },
  { href: '/admin/inventory', label: 'Inventory', icon: '◧' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, token, logout, isAuthenticated } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/admin' && !isAuthenticated()) {
      router.push('/admin')
    }
  }, [pathname, isAuthenticated])

  if (pathname === '/admin') return <>{children}</>

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-white/[0.06] flex flex-col fixed inset-y-0 left-0 z-20">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center">
              <img src="/logo.png" alt="7SS Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
            </div>
            <div>
              <p className="text-white text-xs font-medium tracking-[0.15em] uppercase">The Vault</p>
              <p className="text-white/20 text-[9px] tracking-widest">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-wider transition-all duration-200 rounded-sm ${
                  active
                    ? 'bg-white/[0.06] text-[#C9A96E] border-l-2 border-[#C9A96E]'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-full flex items-center justify-center">
              <span className="text-[#C9A96E] text-[10px]">{admin?.name?.[0] || 'A'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white/70 text-xs truncate">{admin?.name || 'Admin'}</p>
              <p className="text-white/25 text-[10px] tracking-wider uppercase">{admin?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-left text-white/25 hover:text-[#E63B2E] text-[10px] tracking-widest uppercase transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}
