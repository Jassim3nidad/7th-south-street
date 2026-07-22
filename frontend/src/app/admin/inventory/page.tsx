'use client'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { inventoryApi } from '@/lib/api'
import { InventoryAdjustmentModal } from './InventoryAdjustmentModal'
import { InventoryHistoryModal } from './InventoryHistoryModal'

export default function AdminInventoryPage() {
  const { token } = useAdmin()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [adjusting, setAdjusting] = useState<any>(null)
  const [viewingHistory, setViewingHistory] = useState<any>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    const isLowStock = statusFilter === 'low'
    inventoryApi.list(token, search, isLowStock)
      .then((r: any) => {
        let filtered = r.data || []
        if (statusFilter === 'out') {
          filtered = filtered.filter((i: any) => i.stock_quantity === 0)
        } else if (statusFilter === 'instock') {
          filtered = filtered.filter((i: any) => i.stock_quantity > i.low_stock_threshold)
        }
        setItems(filtered)
      })
      .finally(() => setLoading(false))
  }, [token, search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => load(), 300)
    return () => clearTimeout(timer)
  }, [load])

  const handleExport = () => {
    const headers = ['Product', 'SKU', 'Size', 'Stock', 'Threshold', 'Status']
    const rows = items.map(i => {
      const isOut = i.stock_quantity === 0
      const isLow = !isOut && i.stock_quantity <= i.low_stock_threshold
      const status = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'
      return `"${i.product_name}","${i.sku}","${i.size || 'OS'}","${i.stock_quantity}","${i.low_stock_threshold}","${status}"`
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', `inventory-export-${new Date().toISOString().split('T')[0]}.csv`)
    a.click()
  }

  const grouped = items.reduce((acc: any, item: any) => {
    if (!acc[item.product_name]) acc[item.product_name] = []
    acc[item.product_name].push(item)
    return acc
  }, {})

  return (
    <div className="p-8 lg:p-10">
      <div className="admin-page-header flex-col md:flex-row items-start md:items-end gap-4">
        <div>
          <p className="neo-kicker mb-2">Manage</p>
          <h1 className="admin-page-title">Inventory</h1>
        </div>
        <button onClick={handleExport} disabled={loading || items.length === 0} className="btn-secondary text-xs px-6 py-2.5">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Search inventory by product or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors appearance-none md:w-48"
        >
          <option value="all">All Inventory</option>
          <option value="instock">In Stock (Healthy)</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Grid */}
      <div className="space-y-5">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-none" />)
        ) : Object.keys(grouped).length === 0 ? (
          <div className="p-12 text-center text-white/30 text-sm border border-white/5 rounded-lg border-dashed">
            No inventory records found matching your filters.
          </div>
        ) : Object.entries(grouped).map(([productName, variants]: [string, any]) => {
          const totalStock = variants.reduce((sum: number, v: any) => sum + v.stock_quantity, 0)
          const hasLow = variants.some((v: any) => v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold)
          const hasOut = variants.some((v: any) => v.stock_quantity === 0)
          
          return (
            <div key={productName} className={`admin-card p-6 ${hasOut ? 'border-red-900/30' : hasLow ? 'border-yellow-900/30' : ''}`}>
              <div className="inventory-card__header flex flex-col md:flex-row md:items-center justify-between mb-5 gap-2">
                <div className="inventory-card__identity flex items-center gap-3">
                  <p className="text-white/80 text-sm font-medium">{productName}</p>
                  {hasOut && <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border border-red-500/30 text-red-400">Contains Out of Stock</span>}
                  {!hasOut && hasLow && <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border border-yellow-500/30 text-yellow-400">Contains Low Stock</span>}
                </div>
                <span className="text-white/25 text-xs">{totalStock} total units across {variants.length} variant(s)</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {variants.map((v: any) => {
                  const isOut = v.stock_quantity === 0
                  const isLow = !isOut && v.stock_quantity <= v.low_stock_threshold
                  return (
                    <div key={v.id} className={`inventory-variant neo-inset p-4 flex flex-col justify-between group ${isOut ? 'border-red-900/40 bg-red-950/20' : isLow ? 'border-yellow-900/40 bg-yellow-950/10' : ''}`}>
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className={`text-[10px] tracking-widest uppercase font-medium ${isOut ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-[#C9A96E]'}`}>
                              {v.size || 'OS'}
                            </p>
                            <p className="text-[9px] text-white/30 font-mono mt-0.5">{v.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-light ${isOut ? 'text-red-400/50' : 'text-white'}`}>{v.stock_quantity}</p>
                            <p className="text-[8px] text-white/20 uppercase tracking-wider">in stock</p>
                          </div>
                        </div>
                        {isOut && <p className="text-red-400 text-[9px] tracking-wider mt-1">Out of stock</p>}
                        {isLow && <p className="text-yellow-400 text-[9px] tracking-wider mt-1">Low stock (Threshold: {v.low_stock_threshold})</p>}
                      </div>
                      
                      <div className="flex gap-2 mt-4 pt-4 border-t border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setAdjusting(v)} className="flex-1 py-1.5 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-[#C9A96E]/20 hover:text-[#C9A96E] text-white/60 transition-colors rounded">
                          Adjust
                        </button>
                        <button onClick={() => setViewingHistory(v)} className="flex-1 py-1.5 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/60 transition-colors rounded">
                          History
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {adjusting && (
          <InventoryAdjustmentModal 
            variant={adjusting} 
            onClose={() => setAdjusting(null)} 
            onSaved={() => { setAdjusting(null); load() }} 
          />
        )}
        {viewingHistory && (
          <InventoryHistoryModal 
            variant={viewingHistory} 
            onClose={() => setViewingHistory(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
