import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export const metadata: Metadata = {
  title: 'Order History',
  description: 'View your full 7Th South Street order history.',
}

type OrderStatus = Database['public']['Enums']['order_status']

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  processing: 'status-processing',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
  refunded: 'status-refunded',
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const query = await searchParams
  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const perPage = 15

  const { data: orders, count } = await supabase
    .from('orders')
    .select('id,order_number,status,payment_status,total,created_at', { count: 'exact' })
    .eq('customer_user_id', user.id)
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  const total = count ?? 0
  const lastPage = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="account-section">
      <header className="account-section__header">
        <p className="neo-kicker">History</p>
        <h1 className="account-section__title">My Orders</h1>
        <p className="account-section__subtitle">{total} {total === 1 ? 'order' : 'orders'} total.</p>
      </header>

      {(orders ?? []).length === 0 ? (
        <div className="account-empty-state neo-inset">
          <p className="account-empty-state__heading">No orders yet</p>
          <p className="account-empty-state__body">When you place an order it will appear here.</p>
          <Link href="/shop" className="btn-primary">Browse the Collection</Link>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {orders!.map(order => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="order-row neo-inset"
              >
                <div className="order-row__info">
                  <strong className="order-row__number">{order.order_number}</strong>
                  <time className="order-row__date" dateTime={order.created_at}>
                    {formatDate(order.created_at)}
                  </time>
                </div>
                <div className="order-row__statuses">
                  <span className={`order-status-badge ${STATUS_CLASS[order.status as OrderStatus]}`}>
                    {STATUS_LABEL[order.status as OrderStatus]}
                  </span>
                  <span className={`order-status-badge ${order.payment_status === 'paid' ? 'status-delivered' : order.payment_status === 'refunded' ? 'status-refunded' : 'status-pending'}`}>
                    {order.payment_status}
                  </span>
                </div>
                <strong className="order-row__total">{formatCurrency(Number(order.total))}</strong>
                <span className="order-row__arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>

          {lastPage > 1 && (
            <nav className="orders-pagination" aria-label="Order history pages">
              {page > 1 && (
                <Link href={`/account/orders?page=${page - 1}`} className="btn-outline">← Previous</Link>
              )}
              <span className="orders-pagination__count">Page {page} of {lastPage}</span>
              {page < lastPage && (
                <Link href={`/account/orders?page=${page + 1}`} className="btn-outline">Next →</Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  )
}
