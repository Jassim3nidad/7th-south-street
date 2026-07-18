import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import LogoutButton from '@/components/auth/LogoutButton'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'View your 7Th South Street customer profile and order history.',
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
}).format(amount)

const formatDate = (value: string) => new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}).format(new Date(value))

const formatStatus = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) redirect('/login?next=/account')

  const [profileResult, customerResult, ordersResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name,phone')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('customers')
      .select('id,first_name,last_name,email,phone,email_verified_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('orders')
      .select('id,order_number,status,payment_status,total,created_at')
      .eq('customer_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const profile = profileResult.data
  const customer = customerResult.data
  const orders = ordersResult.data ?? []
  const detailsUnavailable = Boolean(profileResult.error || customerResult.error || ordersResult.error)
  const metadataName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : ''
  const customerName = [customer?.first_name, customer?.last_name].filter(Boolean).join(' ')
  const displayName = profile?.full_name || customerName || metadataName || 'Customer'
  const email = user.email || 'Not available'
  const phone = profile?.phone || customer?.phone || 'Not added'
  // Auth is the authority for verification; public customer metadata is display-only.
  const verified = Boolean(user.email_confirmed_at)

  return (
    <main className="site-shell">
      <Navbar />
      <div className="site-container account-page">
        <header className="account-header">
          <div>
            <p className="neo-kicker">Customer Account</p>
            <h1 className="neo-heading">Welcome, {displayName}</h1>
            <p>Manage your session and review orders connected to your verified account.</p>
          </div>
          <LogoutButton />
        </header>

        {detailsUnavailable ? (
          <div className="auth-notice auth-notice--error" role="alert">
            Some account details are temporarily unavailable. Refresh the page or try again later.
          </div>
        ) : null}

        <div className="account-grid">
          <section className="neo-panel account-profile" aria-labelledby="profile-heading">
            <div className="account-section-heading">
              <div>
                <p className="neo-kicker">Profile</p>
                <h2 id="profile-heading">Customer Details</h2>
              </div>
              <span className={`account-verification ${verified ? 'is-verified' : ''}`}>
                {verified ? 'Email Verified' : 'Verification Pending'}
              </span>
            </div>

            <dl className="account-details">
              <div><dt>Name</dt><dd>{displayName}</dd></div>
              <div><dt>Email</dt><dd>{email}</dd></div>
              <div><dt>Phone</dt><dd>{phone}</dd></div>
            </dl>
          </section>

          <section className="neo-panel account-orders" aria-labelledby="orders-heading">
            <div className="account-section-heading">
              <div>
                <p className="neo-kicker">History</p>
                <h2 id="orders-heading">Recent Orders</h2>
              </div>
              <span>{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
            </div>

            {orders.length ? (
              <div className="account-order-list">
                {orders.map(order => (
                  <article key={order.id} className="account-order neo-inset">
                    <div>
                      <strong>{order.order_number}</strong>
                      <time dateTime={order.created_at}>{formatDate(order.created_at)}</time>
                    </div>
                    <div className="account-order__status">
                      <span>{formatStatus(order.status)}</span>
                      <small>{formatStatus(order.payment_status)}</small>
                    </div>
                    <strong>{formatCurrency(Number(order.total))}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <div className="account-empty">
                <p>No orders are connected to this account yet.</p>
                <Link href="/shop" className="btn-primary">Shop The Collection</Link>
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
