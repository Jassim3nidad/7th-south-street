'use client'
import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '@/store/admin'
import { inventoryApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminInventoryPage() {
  const { token } = useAdmin()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<number, string>>({})

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    inventoryApi.list(token).then((r: any) => setItems(r.data || [])).finally(() => setLoading(false))
  }, [token])

  useEffect(() => { load() }, [load])

  const saveStock = async (id: number) => {
    if (!token || editing[id] === undefined) return
    try {
      await inventoryApi.update(id, parseInt(editing[id]), token)
      toast.success('Stock updated')
      setEditing(prev => { const n = { ...prev }; delete n[id]; return n })
      load()
    } catch { toast.error('Failed to update') }
  }

  const grouped = items.reduce((acc: any, item: any) => {
    if (!acc[item.product_name]) acc[item.product_name] = []
    acc[item.product_name].push(item)
    return acc
  }, {})

  return (
    <div className="p-8 lg:p-10">
      <div className="admin-page-header">
        <div>
          <p className="neo-kicker mb-2">Manage</p>
          <h1 className="admin-page-title">Inventory</h1>
        </div>
        <div className="flex items-center gap-2 text-white/20 text-xs">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span> In Stock
          <span className="w-2 h-2 bg-yellow-400 rounded-full ml-2"></span> Low
          <span className="w-2 h-2 bg-red-400 rounded-full ml-2"></span> Out
        </div>
      </div>

      <div className="space-y-5">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-none" />)
        ) : Object.entries(grouped).map(([productName, variants]: [string, any]) => {
          const totalStock = variants.reduce((sum: number, v: any) => sum + v.stock_quantity, 0)
          const hasLow = variants.some((v: any) => v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold)
          const hasOut = variants.some((v: any) => v.stock_quantity === 0)
          return (
            <div key={productName} className={`admin-card p-6 ${hasOut ? 'border-red-900/30' : hasLow ? 'border-yellow-900/30' : ''}`}>
              <div className="inventory-card__header flex items-center justify-between mb-5">
                <div className="inventory-card__identity flex items-center gap-3">
                  <p className="text-white/80 text-sm font-medium">{productName}</p>
                  {hasOut && <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border border-red-500/30 text-red-400">Out of Stock</span>}
                  {!hasOut && hasLow && <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border border-yellow-500/30 text-yellow-400">Low Stock</span>}
                </div>
                <span className="text-white/25 text-xs">{totalStock} total units</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {variants.map((v: any) => {
                  const isOut = v.stock_quantity === 0
                  const isLow = !isOut && v.stock_quantity <= v.low_stock_threshold
                  return (
                    <div key={v.id} className={`inventory-variant neo-inset p-3 ${isOut ? 'border-red-900/40 bg-red-950/20' : isLow ? 'border-yellow-900/40 bg-yellow-950/10' : ''}`}>
                      <p className={`text-[10px] tracking-widest uppercase mb-2 font-medium ${isOut ? 'text-red-400/60' : isLow ? 'text-yellow-400/60' : 'text-white/40'}`}>
                        {v.size || 'OS'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={editing[v.id] !== undefined ? editing[v.id] : v.stock_quantity}
                          onChange={e => setEditing(prev => ({ ...prev, [v.id]: e.target.value }))}
                          className={`inventory-stock-input w-14 bg-transparent border px-2 py-1 text-sm text-center focus:outline-none transition-colors ${editing[v.id] !== undefined ? 'border-[#C9A96E]/40 text-white' : 'border-white/10 text-white/60'}`}
                        />
                        {editing[v.id] !== undefined && (
                          <button onClick={() => saveStock(v.id)}
                            className="inventory-save-button flex items-center justify-center border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-colors" aria-label={`Save stock for size ${v.size || 'OS'}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {isOut && <p className="text-red-400 text-[9px] tracking-wider mt-1.5">Out of stock</p>}
                      {isLow && <p className="text-yellow-400 text-[9px] tracking-wider mt-1.5">Low stock</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {!loading && items.length === 0 && (
          <div className="py-20 text-center text-white/20 text-sm">No inventory data found</div>
        )}
      </div>
    </div>
  )
}
