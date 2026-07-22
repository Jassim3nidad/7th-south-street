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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="theme-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="neo-modal w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-history-title"
        aria-busy={loading}
      >
        
        <div className="flex items-start justify-between gap-4 border-b border-border p-6 sm:items-center">
          <div>
            <h2 id="inventory-history-title" className="font-display text-2xl font-medium text-text-primary">Movement History</h2>
            <p className="mt-1 font-mono text-xs text-text-muted">{variant.product_name} • {variant.size} • {variant.sku}</p>
          </div>
          <button onClick={onClose} className="btn-ghost modal-close-button shrink-0 p-0" aria-label="Close inventory history dialog">
            <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 no-scrollbar">
          {loading ? (
            <div className="space-y-4 p-6" role="status" aria-label="Loading inventory movement history">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-md" />)}
            </div>
          ) : movements.length === 0 ? (
            <div className="neo-inset m-6 p-12 text-center text-sm text-text-muted">No movement history found for this variant.</div>
          ) : (
            <table className="w-full min-w-[42rem] text-left text-sm">
              <caption className="sr-only">Inventory movement history for {variant.product_name}</caption>
              <thead className="sticky top-0 border-b border-border bg-[var(--neo-table-head)]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-[10px] font-normal uppercase tracking-widest text-text-muted">Date</th>
                  <th scope="col" className="px-6 py-3 text-[10px] font-normal uppercase tracking-widest text-text-muted">Change</th>
                  <th scope="col" className="px-6 py-3 text-[10px] font-normal uppercase tracking-widest text-text-muted">Reason</th>
                  <th scope="col" className="px-6 py-3 text-[10px] font-normal uppercase tracking-widest text-text-muted">Admin</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id} className="border-b border-border transition-colors hover:bg-[var(--neo-hover)]">
                    <td className="px-6 py-4 text-xs text-text-secondary">
                      {new Date(m.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`order-status-badge font-mono ${m.quantity_delta > 0 ? 'status-delivered' : 'status-cancelled'}`}>
                          {m.quantity_delta > 0 ? '+' : ''}{m.quantity_delta}
                        </span>
                        <span className="text-[10px] text-text-muted">→ {m.stock_after}</span>
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-4 text-xs text-text-primary" title={m.reason}>
                      {m.reason}
                    </td>
                    <td className="max-w-[150px] truncate px-6 py-4 text-[10px] text-text-muted" title={m.actor_email}>
                      {m.actor_email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border p-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="btn-ghost px-3">Previous</button>
            <span className="text-xs text-text-muted" aria-live="polite">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="btn-ghost px-3">Next</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
