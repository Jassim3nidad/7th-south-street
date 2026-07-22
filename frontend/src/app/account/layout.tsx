import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import { createClient } from '@/lib/supabase/server'

const navItems = [
  { href: '/account', label: 'Overview', icon: '⌂', exact: true },
  { href: '/account/profile', label: 'Profile', icon: '◎' },
  { href: '/account/addresses', label: 'Addresses', icon: '◈' },
  { href: '/account/orders', label: 'Orders', icon: '◫' },
  { href: '/account/wishlist', label: 'Wishlist', icon: '♡' },
  { href: '/account/security', label: 'Security', icon: '⊗' },
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect('/login?next=/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Customer'
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <main className="site-shell">
      <div className="account-layout">
        {/* Sidebar */}
        <aside className="account-sidebar" aria-label="Account navigation">
          <div className="account-sidebar__identity">
            <div className="account-sidebar__avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="account-sidebar__user">
              <p>{displayName}</p>
              <span>{user.email}</span>
            </div>
          </div>

          <nav className="account-sidebar__nav" aria-label="Account sections">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="account-sidebar__link"
                aria-label={item.label}
              >
                <span className="account-sidebar__link-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="account-sidebar__footer">
            <LogoutButton
              className="btn-ghost"
              redirectTo="/login?message=signed-out"
            >
              Sign Out
            </LogoutButton>
          </div>
        </aside>

        {/* Main content */}
        <div className="account-main">
          {children}
        </div>
      </div>
    </main>
  )
}
