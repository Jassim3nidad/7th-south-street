import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type OrderStatus = Database['public']['Enums']['order_status']

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Being Prepared',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const STATUS_DESC: Record<OrderStatus, string> = {
  pending: 'Your order has been received.',
  confirmed: 'Your order has been confirmed by our team.',
  processing: 'Your items are being picked and packed.',
  shipped: 'Your order is on its way.',
  delivered: 'Your order has been delivered.',
  cancelled: 'This order has been cancelled.',
  refunded: 'A refund has been issued.',
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))

export const metadata: Metadata = {
  title: 'Order Detail',
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const orderId = Number(id)
  if (!Number.isInteger(orderId) || orderId < 1) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // RLS enforces customer_user_id = auth.uid() — no extra filter needed
  const [orderResult, itemsResult] = await Promise.all([
    supabase.from('orders').select('*').eq('id', orderId).eq('customer_user_id', user.id).maybeSingle(),
    supabase.from('order_items').select('*').eq('order_id', orderId).order('id'),
  ])

  const order = orderResult.data
  if (!order) notFound()

  const items = itemsResult.data ?? []
  const currentStatus = order.status as OrderStatus
  const isTerminal = currentStatus === 'cancelled' || currentStatus === 'refunded'
  const currentStepIndex = isTerminal ? -1 : STATUS_STEPS.indexOf(currentStatus)

  return (
    <div className="account-section">
      <header className="account-section__header">
        <p className="neo-kicker">
          <Link href="/account/orders" className="order-detail__back">← Orders</Link>
        </p>
        <h1 className="account-section__title">{order.order_number}</h1>
        <p className="account-section__subtitle">
          Placed on {formatDate(order.created_at)}
        </p>
      </header>

      {/* Status Timeline */}
      {!isTerminal ? (
        <section className="order-timeline neo-panel" aria-label="Order status timeline">
          <h2 className="account-panel-heading">Order Progress</h2>
          <ol className="order-timeline__steps" aria-label="Status steps">
            {STATUS_STEPS.map((step, i) => {
              const isDone = i < currentStepIndex
              const isCurrent = i === currentStepIndex
              return (
                <li
                  key={step}
                  className={`order-timeline__step ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className="order-timeline__dot" aria-hidden="true">{isDone ? '✓' : isCurrent ? '●' : '○'}</span>
                  <div className="order-timeline__info">
                    <p className="order-timeline__label">{STATUS_LABEL[step]}</p>
                    {isCurrent && <p className="order-timeline__desc">{STATUS_DESC[step]}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ) : (
        <div className={`auth-notice ${currentStatus === 'cancelled' ? 'auth-notice--error' : ''}`} role="status">
          {STATUS_LABEL[currentStatus]}: {STATUS_DESC[currentStatus]}
        </div>
      )}

      <div className="order-detail-grid">
        {/* Order items */}
        <section className="neo-panel" aria-labelledby="order-items-heading">
          <h2 id="order-items-heading" className="account-panel-heading">Items Ordered</h2>
          <div className="order-items-list">
            {items.map(item => (
              <div key={item.id} className="order-item">
                <div className="order-item__info">
                  <p className="order-item__name">{item.product_name_snapshot}</p>
                  <p className="order-item__meta">
                    {item.size_snapshot !== 'OS' && <span>Size: {item.size_snapshot}</span>}
                    {item.color_snapshot && <span>Color: {item.color_snapshot}</span>}
                    <span>SKU: {item.sku_snapshot}</span>
                  </p>
                </div>
                <div className="order-item__qty-price">
                  <span className="order-item__qty">× {item.quantity}</span>
                  <span className="order-item__price">{formatCurrency(Number(item.line_total))}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="order-totals">
            <div className="order-totals__row">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="order-totals__row">
              <span>Shipping</span>
              <span>{Number(order.shipping_fee) === 0 ? 'Free' : formatCurrency(Number(order.shipping_fee))}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="order-totals__row order-totals__row--discount">
                <span>Discount</span>
                <span>−{formatCurrency(Number(order.discount_amount))}</span>
              </div>
            )}
            <div className="order-totals__row order-totals__row--total">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </section>

        {/* Shipping & payment */}
        <div className="order-meta-column">
          <section className="neo-panel" aria-labelledby="shipping-heading">
            <h2 id="shipping-heading" className="account-panel-heading">Shipping Address</h2>
            <address className="order-address">
              <p>{order.shipping_name}</p>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}{order.shipping_province ? `, ${order.shipping_province}` : ''} {order.shipping_postal}</p>
              <p>{order.shipping_country}</p>
              <p>{order.shipping_phone}</p>
            </address>
          </section>

          <section className="neo-panel" aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="account-panel-heading">Payment</h2>
            <dl className="account-details">
              <div>
                <dt>Method</dt>
                <dd>{order.payment_method.toUpperCase()}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{order.payment_status}</dd>
              </div>
              {order.payment_reference && (
                <div>
                  <dt>Reference</dt>
                  <dd>{order.payment_reference}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
