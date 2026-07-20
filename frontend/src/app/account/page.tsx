import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your 7Th South Street customer account.',
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))

const STATUS_COLORS: Record<string, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  processing: 'status-processing',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
  refunded: 'status-refunded',
}

export default async function AccountOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null // layout redirects

  const [profileResult, ordersResult, wishlistResult] = await Promise.all([
    supabase.from('profiles').select('full_name,phone').eq('id', user.id).maybeSingle(),
    supabase
      .from('orders')
      .select('id,order_number,status,total,created_at')
      .eq('customer_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('wishlists')
      .select('product_id', { count: 'exact', head: true })
      .eq('customer_id',
        supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .then(() => 0) as unknown as number
      ),
  ])

  const profile = profileResult.data
  const recentOrders = ordersResult.data ?? []
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Customer'

  // Wishlist count via separate query
  const { data: customerData } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  let wishlistCount = 0
  if (customerData?.id) {
    const { count } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerData.id)
    wishlistCount = count ?? 0
  }

  return (
    <div className="account-section">
      {/* Header */}
      <header className="account-section__header">
        <p className="neo-kicker">Dashboard</p>
        <h1 className="account-section__title">Welcome back, {displayName}</h1>
        <p className="account-section__subtitle">Here's a summary of your account activity.</p>
      </header>

      {/* Quick stats */}
      <div className="account-overview-stats">
        <div className="account-stat neo-inset">
          <p className="account-stat__value">{recentOrders.length > 0 ? ordersResult.data?.length ?? 0 : 0}</p>
          <p className="account-stat__label">Recent Orders</p>
          <Link href="/account/orders" className="account-stat__link">View all →</Link>
        </div>
        <div className="account-stat neo-inset">
          <p className="account-stat__value">{wishlistCount}</p>
          <p className="account-stat__label">Wishlist Items</p>
          <Link href="/account/wishlist" className="account-stat__link">View all →</Link>
        </div>
        <div className="account-stat neo-inset">
          <p className="account-stat__value">{user.email_confirmed_at ? '✓' : '!'}</p>
          <p className="account-stat__label">{user.email_confirmed_at ? 'Email Verified' : 'Verify Email'}</p>
          {!user.email_confirmed_at && (
            <Link href="/account/security" className="account-stat__link">Verify →</Link>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="account-quick-links">
        {[
          { href: '/account/profile', label: 'Edit Profile', desc: 'Update your name and phone number' },
          { href: '/account/addresses', label: 'Manage Addresses', desc: 'Save shipping locations for fast checkout' },
          { href: '/account/orders', label: 'Order History', desc: 'View all past and pending orders' },
          { href: '/account/wishlist', label: 'My Wishlist', desc: 'Products you\'ve saved for later' },
        ].map(link => (
          <Link key={link.href} href={link.href} className="account-quick-link neo-surface">
            <p className="account-quick-link__label">{link.label}</p>
            <p className="account-quick-link__desc">{link.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <section className="account-recent-orders" aria-labelledby="recent-orders-heading">
          <div className="account-section__subheader">
            <p className="neo-kicker">Activity</p>
            <h2 id="recent-orders-heading" className="account-section__subtitle-heading">Recent Orders</h2>
            <Link href="/account/orders" className="account-section__view-all">View all</Link>
          </div>
          <div className="account-order-list">
            {recentOrders.map(order => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="account-order-row neo-inset">
                <div>
                  <strong className="account-order-row__number">{order.order_number}</strong>
                  <time className="account-order-row__date" dateTime={order.created_at}>
                    {formatDate(order.created_at)}
                  </time>
                </div>
                <span className={`account-order-row__status ${STATUS_COLORS[order.status] ?? ''}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <strong className="account-order-row__total">{formatCurrency(Number(order.total))}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentOrders.length === 0 && (
        <div className="account-empty-state neo-inset">
          <p className="account-empty-state__heading">No orders yet</p>
          <p className="account-empty-state__body">When you place your first order, it will appear here.</p>
          <Link href="/shop" className="btn-primary">Browse the Collection</Link>
        </div>
      )}
    </div>
  )
}
