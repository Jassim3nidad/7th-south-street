'use client'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { ordersApi } from '@/lib/api'
import { OrderModal } from './OrderModal'

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)
const statusColors: Record<string, string> = { pending:'text-yellow-400', confirmed:'text-blue-400', processing:'text-purple-400', shipped:'text-cyan-400', delivered:'text-green-400', cancelled:'text-red-400', refunded:'text-orange-400' }

export default function AdminOrdersPage() {
  const { token } = useAdmin()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    if (paymentFilter) params.payment_status = paymentFilter
    if (fromDate) params.from = new Date(fromDate).toISOString()
    if (toDate) params.to = new Date(toDate).toISOString()

    ordersApi.list(params, token)
      .then((r: any) => setOrders(r.data || []))
      .finally(() => setLoading(false))
  }, [search, statusFilter, paymentFilter, fromDate, toDate, token])

  useEffect(() => {
    const timer = setTimeout(() => load(), 400)
    return () => clearTimeout(timer)
  }, [load])

  const openOrder = async (order: any) => {
    if (!token) return
    try {
      const r = await ordersApi.get(order.id, token)
      setSelectedOrder(r.data)
    } catch {
      // ignore
    }
  }

  return (
    <div className="p-8 lg:p-10">
      <div className="admin-page-header">
        <div>
          <p className="neo-kicker mb-2">Manage</p>
          <h1 className="admin-page-title">Orders</h1>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="relative lg:col-span-2">
          <input 
            type="text" 
            placeholder="Search by order #, name, or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors appearance-none"
        >
          <option value="">All Fulfillment Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select 
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors appearance-none"
        >
          <option value="">All Payment Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>

        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-2 text-xs text-white focus:outline-none focus:border-[#C9A96E] transition-colors [color-scheme:dark]"
            title="From Date"
          />
          <span className="text-white/30 text-xs">-</span>
          <input 
            type="date" 
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-2 text-xs text-white focus:outline-none focus:border-[#C9A96E] transition-colors [color-scheme:dark]"
            title="To Date"
          />
        </div>
      </div>

      <div className="neo-table-shell overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Order #','Customer','Date','Total','Payment','Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] tracking-widest uppercase text-white/30 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-white/[0.04]">
                {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 skeleton w-16" /></td>)}
              </tr>
            )) : orders.map((o: any) => (
              <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => openOrder(o)}>
                <td className="px-4 py-3 text-[#C9A96E] text-xs font-mono">{o.order_number}</td>
                <td className="px-4 py-3 text-white/60 text-xs">{o.shipping_name || o.guest_email}</td>
                <td className="px-4 py-3 text-white/30 text-xs">{new Date(o.created_at).toLocaleDateString('en-PH')}</td>
                <td className="px-4 py-3 text-white/70 text-xs">{fmt(o.total)}</td>
                <td className="px-4 py-3"><span className={`text-[10px] tracking-wider uppercase ${o.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>{o.payment_status}</span></td>
                <td className="px-4 py-3"><span className={`text-[10px] tracking-wider uppercase border px-2 py-0.5 rounded ${statusColors[o.status] || 'text-white/30'} ${o.status === 'cancelled' ? 'border-red-900/50' : 'border-white/10'}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && orders.length === 0 && (
          <div className="py-16 text-center text-white/20 text-sm border border-white/5 border-dashed m-4 rounded">
            No orders match your criteria.
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            onUpdated={() => { load(); openOrder(selectedOrder); }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
