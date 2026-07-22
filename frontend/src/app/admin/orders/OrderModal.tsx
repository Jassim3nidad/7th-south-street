'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { ordersApi } from '@/lib/api'
import toast from 'react-hot-toast'

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

export function OrderModal({
  order,
  onClose,
  onUpdated
}: {
  order: any
  onClose: () => void
  onUpdated: () => void
}) {
  const { token } = useAdmin()
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState(order.notes || '')

  useEffect(() => {
    if (!token) return
    ordersApi.getHistory(order.id, token).then(r => {
      setHistory(r.data || [])
    }).finally(() => setLoadingHistory(false))
  }, [token, order.id])

  const handleUpdate = async (payload: { status?: string, payment_status?: string, notes?: string }) => {
    if (!token) return
    if (!confirm('Are you sure you want to update this order?')) return
    
    setUpdating(true)
    try {
      await ordersApi.update(order.id, payload, token)
      toast.success('Order updated successfully')
      onUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order')
    } finally {
      setUpdating(false)
    }
  }

  const getValidNextStatuses = () => {
    switch (order.status) {
      case 'pending': return ['confirmed', 'cancelled']
      case 'confirmed': return ['processing', 'cancelled']
      case 'processing': return ['shipped', 'cancelled']
      case 'shipped': return ['delivered']
      default: return []
    }
  }

  const nextStatuses = getValidNextStatuses()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="theme-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="neo-modal w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        aria-busy={updating}
      >
        
        <div className="flex items-center justify-between gap-4 border-b border-border p-6">
          <div>
            <h2 id="order-modal-title" className="font-display text-2xl font-medium text-text-primary">Order {order.order_number}</h2>
            <p className="mt-1 font-mono text-xs text-text-muted">Placed {new Date(order.created_at).toLocaleString('en-PH')}</p>
          </div>
          <button onClick={onClose} className="btn-ghost modal-close-button shrink-0 p-0" aria-label="Close order dialog">
            <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info (Left) */}
          <div className="md:col-span-2 space-y-8">
            {/* Line Items */}
            <div className="admin-card p-5">
              <h3 className="mb-4 border-b border-border pb-2 text-xs uppercase tracking-widest text-text-secondary">Line Items</h3>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <caption className="sr-only">Items included in order {order.order_number}</caption>
                <thead>
                  <tr className="border-b border-border text-left text-[10px] uppercase text-text-muted">
                    <th scope="col" className="pb-2 font-normal">Item</th>
                    <th scope="col" className="pb-2 font-normal">Size</th>
                    <th scope="col" className="pb-2 font-normal">Price</th>
                    <th scope="col" className="pb-2 font-normal">Qty</th>
                    <th scope="col" className="pb-2 text-right font-normal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="py-3">
                        <p className="text-text-primary">{item.product_name}</p>
                        <p className="font-mono text-[10px] text-text-muted">{item.sku}</p>
                      </td>
                      <td className="py-3 text-text-secondary">{item.size || 'OS'}</td>
                      <td className="py-3 text-text-secondary">{fmt(item.unit_price)}</td>
                      <td className="py-3 text-text-secondary">x{item.quantity}</td>
                      <td className="py-3 text-right text-text-primary">{fmt(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                <div className="flex justify-between text-text-secondary"><span>Shipping</span><span>{fmt(order.shipping_fee)}</span></div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-brand-accent"><span>Discount</span><span>-{fmt(order.discount_amount)}</span></div>
                )}
                <div className="flex justify-between pt-2 text-sm font-medium text-text-primary"><span>Total</span><span>{fmt(order.total)}</span></div>
              </div>
            </div>

            {/* Status History */}
            <div className="admin-card p-5">
              <h3 className="mb-4 border-b border-border pb-2 text-xs uppercase tracking-widest text-text-secondary">Status Timeline</h3>
              {loadingHistory ? (
                <div className="space-y-3" role="status" aria-label="Loading order status history">
                  <div className="skeleton h-4 w-1/2"></div>
                  <div className="skeleton h-4 w-1/3"></div>
                </div>
              ) : history.length === 0 ? (
                <p className="py-4 text-center text-xs text-text-muted">No history recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((h, i) => (
                    <div key={h.id} className="flex gap-4 relative">
                      {i !== history.length - 1 && <div className="absolute bottom-[-16px] left-[7px] top-6 w-[2px] bg-[var(--neo-border)]" />}
                      <div className="z-10 mt-1 h-4 w-4 flex-shrink-0 rounded-full border-4 border-[var(--neo-surface-strong)] bg-[var(--neo-accent)]" />
                      <div>
                        <p className={`order-status-badge status-${h.status}`}>{h.status}</p>
                        <p className="text-[10px] text-text-muted">{new Date(h.created_at).toLocaleString('en-PH')} by {h.actor_email}</p>
                        {h.notes && <p className="mt-1 text-xs italic text-text-secondary">"{h.notes}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="space-y-6">
            <div className="admin-card p-5">
              <h3 className="mb-4 border-b border-border pb-2 text-xs uppercase tracking-widest text-text-secondary">Customer & Shipping</h3>
              <div className="space-y-4 text-xs text-text-secondary">
                <div>
                  <p className="font-medium text-text-primary">{order.shipping_name}</p>
                  <p>{order.shipping_email}</p>
                  <p>{order.shipping_phone}</p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-text-primary">Address</p>
                  <p>{order.shipping_address}</p>
                  <p>{order.shipping_city}, {order.shipping_province}</p>
                  <p>{order.shipping_postal}, {order.shipping_country}</p>
                </div>
              </div>
            </div>

            <div className="admin-card p-5">
              <h3 className="mb-4 border-b border-border pb-2 text-xs uppercase tracking-widest text-text-secondary">Payment</h3>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-text-muted">Method</p>
                  <p className="text-sm uppercase text-text-primary">{order.payment_method}</p>
                </div>
                <div>
                  <label htmlFor="order-payment-status" className="mb-1 block text-[10px] uppercase tracking-widest text-text-muted">Status</label>
                  <select 
                    id="order-payment-status"
                    value={order.payment_status} 
                    onChange={e => handleUpdate({ payment_status: e.target.value })}
                    disabled={updating}
                    className="input-dark text-xs"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-card p-5">
              <h3 className="mb-4 border-b border-border pb-2 text-xs uppercase tracking-widest text-brand-accent">Fulfillment Actions</h3>
              <p className="mb-3 text-[10px] text-text-muted">Current Status: <strong className={`order-status-badge ml-1 status-${order.status}`}>{order.status}</strong></p>
              
              <div className="space-y-2">
                {nextStatuses.map(s => (
                  <button 
                    key={s} 
                    onClick={() => handleUpdate({ status: s, notes })}
                    disabled={updating}
                    className={`w-full ${s === 'cancelled' ? 'btn-outline text-[var(--neo-error)]' : 'btn-primary'}`}
                    aria-busy={updating}
                  >
                    Mark as {s}
                  </button>
                ))}
                {nextStatuses.length === 0 && (
                  <p className="text-center text-[10px] italic text-text-muted">No further actions available.</p>
                )}
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <label htmlFor="order-admin-notes" className="mb-1 block text-[10px] uppercase tracking-widest text-text-muted">Administrative Notes</label>
                <textarea 
                  id="order-admin-notes"
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  rows={2} 
                  placeholder="Optional internal note..." 
                  className="input-dark text-xs"
                />
                <button onClick={() => handleUpdate({ notes })} disabled={updating || notes === (order.notes || '')} className="btn-outline mt-2 w-full" aria-busy={updating}>Save Note Only</button>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
