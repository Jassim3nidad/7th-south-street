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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-light text-[#C9A96E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Order {order.order_number}</h2>
            <p className="text-white/40 text-xs mt-1 font-mono">Placed {new Date(order.created_at).toLocaleString('en-PH')}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info (Left) */}
          <div className="md:col-span-2 space-y-8">
            {/* Line Items */}
            <div className="admin-card p-5">
              <h3 className="text-xs tracking-widest uppercase text-white/50 mb-4 border-b border-white/5 pb-2">Line Items</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-white/30 border-b border-white/5">
                    <th className="pb-2 font-normal">Item</th>
                    <th className="pb-2 font-normal">Size</th>
                    <th className="pb-2 font-normal">Price</th>
                    <th className="pb-2 font-normal">Qty</th>
                    <th className="pb-2 font-normal text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-white/[0.02]">
                      <td className="py-3">
                        <p className="text-white/80">{item.product_name}</p>
                        <p className="text-[10px] text-white/40 font-mono">{item.sku}</p>
                      </td>
                      <td className="py-3 text-white/60">{item.size || 'OS'}</td>
                      <td className="py-3 text-white/60">{fmt(item.unit_price)}</td>
                      <td className="py-3 text-white/60">x{item.quantity}</td>
                      <td className="py-3 text-right text-white/80">{fmt(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs">
                <div className="flex justify-between text-white/50"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                <div className="flex justify-between text-white/50"><span>Shipping</span><span>{fmt(order.shipping_fee)}</span></div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-[#C9A96E]"><span>Discount</span><span>-{fmt(order.discount_amount)}</span></div>
                )}
                <div className="flex justify-between text-white text-sm font-medium pt-2"><span>Total</span><span>{fmt(order.total)}</span></div>
              </div>
            </div>

            {/* Status History */}
            <div className="admin-card p-5">
              <h3 className="text-xs tracking-widest uppercase text-white/50 mb-4 border-b border-white/5 pb-2">Status Timeline</h3>
              {loadingHistory ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/5 rounded w-1/2"></div>
                  <div className="h-4 bg-white/5 rounded w-1/3"></div>
                </div>
              ) : history.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">No history recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((h, i) => (
                    <div key={h.id} className="flex gap-4 relative">
                      {i !== history.length - 1 && <div className="absolute left-[7px] top-6 bottom-[-16px] w-[2px] bg-white/10" />}
                      <div className="w-4 h-4 rounded-full bg-white/10 border-4 border-[#0a0a0a] z-10 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-white/80 capitalize">{h.status}</p>
                        <p className="text-[10px] text-white/40">{new Date(h.created_at).toLocaleString('en-PH')} by {h.actor_email}</p>
                        {h.notes && <p className="text-xs text-white/50 mt-1 italic">"{h.notes}"</p>}
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
              <h3 className="text-xs tracking-widest uppercase text-white/50 mb-4 border-b border-white/5 pb-2">Customer & Shipping</h3>
              <div className="space-y-4 text-xs text-white/60">
                <div>
                  <p className="text-white/80 font-medium">{order.shipping_name}</p>
                  <p>{order.shipping_email}</p>
                  <p>{order.shipping_phone}</p>
                </div>
                <div>
                  <p className="text-white/80 font-medium mb-1">Address</p>
                  <p>{order.shipping_address}</p>
                  <p>{order.shipping_city}, {order.shipping_province}</p>
                  <p>{order.shipping_postal}, {order.shipping_country}</p>
                </div>
              </div>
            </div>

            <div className="admin-card p-5">
              <h3 className="text-xs tracking-widest uppercase text-white/50 mb-4 border-b border-white/5 pb-2">Payment</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Method</p>
                  <p className="text-white/80 text-sm uppercase">{order.payment_method}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Status</p>
                  <select 
                    value={order.payment_status} 
                    onChange={e => handleUpdate({ payment_status: e.target.value })}
                    disabled={updating}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E] transition-colors"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-card p-5 border border-[#C9A96E]/20">
              <h3 className="text-xs tracking-widest uppercase text-[#C9A96E] mb-4 border-b border-white/5 pb-2">Fulfillment Actions</h3>
              <p className="text-[10px] text-white/40 mb-3">Current Status: <strong className="text-white uppercase">{order.status}</strong></p>
              
              <div className="space-y-2">
                {nextStatuses.map(s => (
                  <button 
                    key={s} 
                    onClick={() => handleUpdate({ status: s, notes })}
                    disabled={updating}
                    className={`w-full py-2 text-xs rounded uppercase tracking-wider transition-all border ${s === 'cancelled' ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/10'}`}
                  >
                    Mark as {s}
                  </button>
                ))}
                {nextStatuses.length === 0 && (
                  <p className="text-center text-[10px] text-white/30 italic">No further actions available.</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Administrative Notes</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  rows={2} 
                  placeholder="Optional internal note..." 
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E] transition-colors" 
                />
                <button onClick={() => handleUpdate({ notes })} disabled={updating || notes === (order.notes || '')} className="mt-2 w-full py-1.5 text-[10px] uppercase tracking-widest bg-white/10 text-white/60 hover:text-white rounded disabled:opacity-30">Save Note Only</button>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
