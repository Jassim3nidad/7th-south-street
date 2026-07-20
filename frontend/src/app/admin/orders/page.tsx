'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAdmin } from '@/store/admin'
import { ordersApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { useDismissibleLayer } from '@/hooks/useDismissibleLayer'

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)
const statusColors: Record<string, string> = { pending:'text-yellow-400', confirmed:'text-blue-400', processing:'text-purple-400', shipped:'text-cyan-400', delivered:'text-green-400', cancelled:'text-red-400', refunded:'text-orange-400' }

export default function AdminOrdersPage() {
  const { token } = useAdmin()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useDismissibleLayer(Boolean(selected), () => setSelected(null), modalRef)

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    ordersApi.list(filter ? { status: filter } : {}, token)
      .then((r: any) => setOrders(r.data || []))
      .finally(() => setLoading(false))
  }, [filter, token])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: number, status: string) => {
    if (!token) return
    try {
      await ordersApi.update(id, { status }, token)
      toast.success('Status updated')
      load()
      if (selected?.id === id) setSelected({ ...selected, status })
    } catch { toast.error('Failed') }
  }

  return (
    <div className="p-8 lg:p-10">
      <div className="admin-page-header">
        <div>
          <p className="neo-kicker mb-2">Manage</p>
          <h1 className="admin-page-title">Orders</h1>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter orders by status"
          className="input-dark !w-auto text-xs">
          <option value="">All Status</option>
          {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="neo-table-shell overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Order #','Customer','Date','Total','Payment','Status','Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] tracking-widest uppercase text-white/30 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-white/[0.04]">
                {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 skeleton w-16" /></td>)}
              </tr>
            )) : orders.map((o: any) => (
              <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer" role="button" onClick={() => setSelected(o)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(o) } }} tabIndex={0}>
                <td className="px-4 py-3 text-[#C9A96E] text-xs font-mono">{o.order_number}</td>
                <td className="px-4 py-3 text-white/60 text-xs">{o.shipping_name || o.guest_email}</td>
                <td className="px-4 py-3 text-white/30 text-xs">{new Date(o.created_at).toLocaleDateString('en-PH')}</td>
                <td className="px-4 py-3 text-white/70 text-xs">{fmt(o.total)}</td>
                <td className="px-4 py-3"><span className={`text-[10px] tracking-wider capitalize ${o.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>{o.payment_status}</span></td>
                <td className="px-4 py-3"><span className={`text-[10px] tracking-wider capitalize ${statusColors[o.status] || 'text-white/30'}`}>{o.status}</span></td>
                <td className="px-4 py-3">
                  <select value={o.status} onClick={e => e.stopPropagation()} onChange={e => updateStatus(o.id, e.target.value)} aria-label={`Update status for order ${o.order_number}`}
                    className="bg-white/[0.04] border border-white/[0.08] px-2 py-1 text-[10px] text-white/50 focus:outline-none">
                    {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && orders.length === 0 && <div className="py-16 text-center text-white/20 text-sm">No orders yet</div>}
      </div>

      {/* Order detail modal */}
      {selected && (
        <div className="theme-backdrop fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div ref={modalRef} className="neo-modal w-full max-w-md p-8 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Order ${selected.order_number}`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[#C9A96E] text-xs font-mono">{selected.order_number}</p>
                <p className={`text-xs capitalize mt-1 ${statusColors[selected.status] || 'text-white/30'}`}>{selected.status}</p>
              </div>
              <button onClick={() => setSelected(null)} className="modal-close-button text-white/30 hover:text-white" aria-label="Close order details">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="border-b border-white/[0.06] pb-3">
                <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">Customer</p>
                <p className="text-white/70">{selected.shipping_name}</p>
                <p className="text-white/40 text-xs">{selected.shipping_email}</p>
                <p className="text-white/40 text-xs">{selected.shipping_phone}</p>
              </div>
              <div className="border-b border-white/[0.06] pb-3">
                <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">Shipping Address</p>
                <p className="text-white/50 text-xs leading-relaxed">{selected.shipping_address}, {selected.shipping_city}, {selected.shipping_province}</p>
              </div>
              <div>
                <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">Totals</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-white/40">Subtotal</span><span className="text-white/60">{fmt(selected.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Shipping</span><span className="text-white/60">{fmt(selected.shipping_fee)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-white/[0.06]"><span className="text-white/60">Total</span><span className="text-white font-medium">{fmt(selected.total)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
