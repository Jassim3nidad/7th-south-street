'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { inventoryApi } from '@/lib/api'

export function InventoryHistoryModal({
  variant,
  onClose
}: {
  variant: any
  onClose: () => void
}) {
  const { token } = useAdmin()
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    inventoryApi.getMovements(token, variant.id, page).then((res: any) => {
      setMovements(res.data || [])
      setTotalPages(res.meta?.last_page || 1)
    }).finally(() => setLoading(false))
  }, [token, variant.id, page])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-light text-[#C9A96E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Movement History</h2>
            <p className="text-white/40 text-xs mt-1 font-mono">{variant.product_name} • {variant.size} • {variant.sku}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 no-scrollbar">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-md" />)}
            </div>
          ) : movements.length === 0 ? (
            <div className="p-12 text-center text-white/30 text-sm">No movement history found for this variant.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] border-b border-white/5 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-[10px] tracking-widest uppercase text-white/40 font-normal">Date</th>
                  <th className="px-6 py-3 text-[10px] tracking-widest uppercase text-white/40 font-normal">Change</th>
                  <th className="px-6 py-3 text-[10px] tracking-widest uppercase text-white/40 font-normal">Reason</th>
                  <th className="px-6 py-3 text-[10px] tracking-widest uppercase text-white/40 font-normal">Admin</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id} className="border-b border-white/[0.02]">
                    <td className="px-6 py-4 text-white/60 text-xs">
                      {new Date(m.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs ${m.quantity_delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {m.quantity_delta > 0 ? '+' : ''}{m.quantity_delta}
                        </span>
                        <span className="text-white/20 text-[10px]">→ {m.stock_after}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/80 text-xs max-w-[200px] truncate" title={m.reason}>
                      {m.reason}
                    </td>
                    <td className="px-6 py-4 text-white/40 text-[10px] truncate max-w-[150px]" title={m.actor_email}>
                      {m.actor_email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/[0.01]">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs text-white/50 hover:text-white disabled:opacity-30">Previous</button>
            <span className="text-xs text-white/30">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs text-white/50 hover:text-white disabled:opacity-30">Next</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
