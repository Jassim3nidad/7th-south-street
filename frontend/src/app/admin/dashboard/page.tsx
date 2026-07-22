'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAdmin } from '@/store/admin'
import { dashboardApi } from '@/lib/api'

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

function StatCard({ label, value, sub, accent = false }: { label: string; value: React.ReactNode; sub?: string; accent?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="admin-card p-6 transition-transform hover:-translate-y-0.5">
      <p className="text-white/30 text-[10px] tracking-widest uppercase mb-3">{label}</p>
      <div className={`text-3xl font-light mb-1 ${accent ? 'text-[#C9A96E]' : 'text-white'}`}
        style={{ fontFamily: 'Cormorant Garamond, serif' }}>{value}</div>
      {sub && <p className="text-white/20 text-xs">{sub}</p>}
    </motion.div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="admin-card p-6 h-[116px] flex flex-col animate-pulse">
      <div className="w-20 h-3 bg-white/10 rounded mb-4"></div>
      <div className="w-24 h-8 bg-white/10 rounded"></div>
    </div>
  )
}

function SectionSkeleton({ height = 'h-[300px]' }: { height?: string }) {
  return <div className={`admin-card p-6 ${height} animate-pulse bg-white/[0.02]`}></div>
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="neo-surface-sm px-3 py-2 text-xs border border-white/10 shadow-xl rounded-md bg-[#0a0a0a]">
      <p className="text-white/40 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          <span className="capitalize text-white/70 mr-2">{p.name}:</span>
          <span className="font-medium text-white">{p.name === 'revenue' ? fmt(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { token } = useAdmin()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    let from: string | undefined
    let to: string | undefined
    const now = new Date()

    if (dateRange === '7d') {
      const d = new Date(); d.setDate(d.getDate() - 7); from = d.toISOString();
    } else if (dateRange === '30d') {
      const d = new Date(); d.setDate(d.getDate() - 30); from = d.toISOString();
    } else if (dateRange === 'ytd') {
      const d = new Date(now.getFullYear(), 0, 1); from = d.toISOString();
    } // 'all' leaves from/to undefined

    dashboardApi.stats(token, from, to)
      .then((r: any) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, dateRange])

  const overview = data?.overview || {}
  const recentOrders = data?.recent_orders || []
  const lowStock = data?.low_stock || []
  const salesByMonth = data?.sales_by_month || []
  const topProducts = data?.top_products || []
  const upcomingEvents = data?.upcoming_events || []

  const statusColors: Record<string, string> = { pending: 'text-yellow-400', confirmed: 'text-blue-400', processing: 'text-purple-400', shipped: 'text-cyan-400', delivered: 'text-green-400', cancelled: 'text-red-400', refunded: 'text-pink-400' }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="admin-page-header mb-0">
          <div><p className="neo-kicker mb-2">Analytics</p>
          <h1 className="admin-page-title">The Vault</h1></div>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'ytd', label: 'This Year' },
            { id: 'all', label: 'All Time' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDateRange(f.id)}
              className={`px-4 py-1.5 text-xs tracking-wider uppercase whitespace-nowrap transition-colors rounded-md ${dateRange === f.id ? 'bg-[#C9A96E] text-black font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total Revenue" value={fmt(overview.total_revenue || 0)} accent />
            <StatCard label="Orders" value={String(overview.total_orders || 0)} />
            <StatCard label="Pending Orders" value={
              <span className="text-yellow-400">{overview.pending_orders || 0}</span>
            } />
            <StatCard label="Customers" value={String(overview.total_customers || 0)} />
            <StatCard label="Products" value={String(overview.total_products || 0)} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 admin-card p-6">
          <p className="text-white/30 text-[10px] tracking-widest uppercase mb-6 flex justify-between">
            <span>Revenue Trends</span>
            <span className="text-[#C9A96E]">Excludes Cancelled/Refunded</span>
          </p>
          {loading ? (
            <div className="h-[260px] animate-pulse bg-white/5 rounded-md"></div>
          ) : salesByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesByMonth} barSize={24} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: 'var(--neo-text-soft)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: 'var(--neo-text-soft)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="revenue" fill="var(--neo-accent-strong)" opacity={0.9} name="revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-white/15 text-sm font-light">No sales data for this period</div>
          )}
        </div>

        {/* Top Products */}
        <div className="admin-card p-6 flex flex-col">
          <p className="text-white/30 text-[10px] tracking-widest uppercase mb-6">Top Products</p>
          {loading ? (
            <div className="space-y-4 flex-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-white/5 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {topProducts.length === 0 && <div className="h-full flex items-center justify-center text-white/15 text-sm">No sales yet</div>}
              {topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 -mx-2 hover:bg-white/5 rounded transition-colors">
                  <div className="min-w-0">
                    <p className="text-white/80 text-xs truncate font-medium">{p.name}</p>
                    <p className="text-white/40 text-[10px] mt-1">{p.sold} sold</p>
                  </div>
                  <p className="text-[#C9A96E] text-xs font-mono">{fmt(p.revenue || 0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="admin-card p-6 flex flex-col lg:col-span-1">
          <p className="text-white/30 text-[10px] tracking-widest uppercase mb-6">Recent Orders</p>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-white/5 rounded animate-pulse"></div>)}
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.length === 0 && <p className="text-white/15 text-sm py-4 text-center">No orders yet</p>}
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-white/60 text-xs font-mono">{order.order_number}</p>
                    <p className="text-white/40 text-[10px] mt-1">{order.shipping_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-xs">{fmt(order.total)}</p>
                    <p className={`text-[9px] font-medium tracking-wider uppercase mt-1 ${statusColors[order.status] || 'text-white/30'}`}>{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock & Popups */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
          {/* Low Stock */}
          <div className="admin-card p-6 flex flex-col">
            <p className="text-white/30 text-[10px] tracking-widest uppercase mb-6 flex items-center">
              Low Stock Alerts
              {!loading && lowStock.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-[#E63B2E]/20 text-[#E63B2E] text-[9px] font-bold rounded">{lowStock.length}</span>}
            </p>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded animate-pulse"></div>)}
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {lowStock.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-white/15 text-sm py-8">
                    <span className="text-2xl mb-2">✨</span>
                    <p>Inventory levels healthy</p>
                  </div>
                )}
                {lowStock.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div className="min-w-0 pr-4">
                      <p className="text-white/70 text-xs truncate">{item.product_name}</p>
                      <p className="text-white/30 text-[10px] tracking-wider mt-1">Size: {item.size}</p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${item.stock_quantity <= 2 ? 'text-[#E63B2E] border-[#E63B2E]/30 bg-[#E63B2E]/5' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5'}`}>
                      {item.stock_quantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="admin-card p-6 flex flex-col">
            <p className="text-white/30 text-[10px] tracking-widest uppercase mb-6">Upcoming Pop-ups</p>
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-12 bg-white/5 rounded animate-pulse"></div>)}
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {upcomingEvents.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-white/15 text-sm py-8">
                    <span className="text-2xl mb-2">🗓️</span>
                    <p>No upcoming events</p>
                  </div>
                )}
                {upcomingEvents.map((evt: any) => (
                  <div key={evt.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0 group">
                    <div className="min-w-0 pr-4">
                      <p className="text-white/80 text-xs font-medium truncate group-hover:text-[#C9A96E] transition-colors">{evt.title}</p>
                      <p className="text-white/40 text-[10px] mt-1">{new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {evt.location_name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white/80 text-xs font-mono">{evt.rsvp_count} <span className="text-white/30">/ {evt.max_rsvp > 0 ? evt.max_rsvp : '∞'}</span></p>
                      <p className="text-white/30 text-[9px] uppercase tracking-wider mt-1">RSVPs</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
