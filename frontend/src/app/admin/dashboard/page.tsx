'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

import { dashboardApi } from '@/lib/api'

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

function StatCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }}
      className="admin-card p-6 transition-transform hover:-translate-y-0.5">
      <p className="text-white/30 text-[10px] tracking-widest uppercase mb-3">{label}</p>
      <p className={`text-3xl font-light mb-1 ${accent ? 'text-[#C9A96E]' : 'text-white'}`}
        style={{ fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
      {sub && <p className="text-white/20 text-xs">{sub}</p>}
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="neo-surface-sm px-3 py-2 text-xs">
      <p className="text-white/40 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.name === 'revenue' ? fmt(p.value) : p.value}</p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    
    dashboardApi.stats()
      .then((r: any) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const overview = data?.overview || {}
  const recentOrders = data?.recent_orders || []
  const lowStock = data?.low_stock || []
  const salesByMonth = data?.sales_by_month || []
  const topProducts = data?.top_products || []

  const statusColors: Record<string, string> = { pending: 'text-yellow-400', confirmed: 'text-blue-400', processing: 'text-purple-400', shipped: 'text-cyan-400', delivered: 'text-green-400', cancelled: 'text-red-400' }

  return (
    <div className="p-8 lg:p-10">
      {/* Header */}
      <div className="admin-page-header">
        <div><p className="neo-kicker mb-2">Overview</p>
        <h1 className="admin-page-title">Dashboard</h1></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Revenue" value={fmt(overview.total_revenue || 0)} accent />
        <StatCard label="Total Orders" value={String(overview.total_orders || 0)} />
        <StatCard label="Products" value={String(overview.total_products || 0)} />
        <StatCard label="Customers" value={String(overview.total_customers || 0)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 admin-card p-6">
          <p className="text-white/30 text-[10px] tracking-widest uppercase mb-6">Revenue — Last 6 Months</p>
          {salesByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesByMonth} barSize={20}>
                <XAxis dataKey="month" tick={{ fill: 'var(--neo-text-soft)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--neo-text-soft)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--neo-hover)' }} />
                <Bar dataKey="revenue" fill="var(--neo-accent-strong)" opacity={0.88} name="revenue" radius={[8, 8, 2, 2]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-white/15 text-sm">No sales data yet</div>
          )}
        </div>

        {/* Top Products */}
        <div className="admin-card p-6">
          <p className="text-white/30 text-[10px] tracking-widest uppercase mb-6">Top Products</p>
          <div className="space-y-4">
            {topProducts.length === 0 && <p className="text-white/15 text-sm">No data</p>}
            {topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white/70 text-xs truncate">{p.name}</p>
                  <p className="text-white/25 text-[10px]">{p.sold} sold</p>
                </div>
                <p className="text-[#C9A96E] text-xs flex-shrink-0">{fmt(p.revenue || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="admin-card p-6">
          <p className="text-white/30 text-[10px] tracking-widest uppercase mb-6">Recent Orders</p>
          <div className="space-y-3">
            {recentOrders.length === 0 && <p className="text-white/15 text-sm">No orders yet</p>}
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <div>
                  <p className="text-white/60 text-xs font-mono">{order.order_number}</p>
                  <p className="text-white/30 text-[10px]">{order.shipping_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs">{fmt(order.total)}</p>
                  <p className={`text-[10px] tracking-wider capitalize ${statusColors[order.status] || 'text-white/30'}`}>{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div className="admin-card p-6">
          <p className="text-white/30 text-[10px] tracking-widest uppercase mb-6">
            Low Stock Alerts
            {lowStock.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-[#E63B2E]/20 text-[#E63B2E] text-[9px] rounded-sm">{lowStock.length}</span>}
          </p>
          <div className="space-y-3">
            {lowStock.length === 0 && <p className="text-white/15 text-sm">All good — stock levels normal</p>}
            {lowStock.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <div>
                  <p className="text-white/60 text-xs">{item.product_name}</p>
                  <p className="text-white/25 text-[10px] tracking-wider">Size: {item.size}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 border ${item.stock_quantity <= 2 ? 'text-[#E63B2E] border-[#E63B2E]/30' : 'text-yellow-400 border-yellow-400/30'}`}>
                  {item.stock_quantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
