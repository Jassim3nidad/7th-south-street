'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { inventoryApi } from '@/lib/api'
import toast from 'react-hot-toast'

export function InventoryAdjustmentModal({
  variant,
  onClose,
  onSaved
}: {
  variant: any
  onClose: () => void
  onSaved: () => void
}) {
  const { token } = useAdmin()
  const [stock, setStock] = useState(variant.stock_quantity.toString())
  const [threshold, setThreshold] = useState(variant.low_stock_threshold.toString())
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!token) return
    if (!reason.trim()) {
      toast.error('An adjustment reason is required for auditing.')
      return
    }
    const s = parseInt(stock)
    if (isNaN(s) || s < 0) {
      toast.error('Stock must be a non-negative number.')
      return
    }
    
    setSaving(true)
    try {
      await inventoryApi.update(variant.id, {
        stock_quantity: s,
        reason: reason.trim(),
        low_stock_threshold: parseInt(threshold) || 5
      }, token)
      toast.success('Inventory adjusted successfully')
      onSaved()
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust inventory')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="theme-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="neo-modal w-full max-w-lg overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-adjustment-title"
        aria-busy={saving}
      >
        
        <div className="flex items-start justify-between gap-4 border-b border-border p-6 sm:items-center">
          <div>
            <h2 id="inventory-adjustment-title" className="font-display text-2xl font-medium text-text-primary">Adjust Inventory</h2>
            <p className="mt-1 font-mono text-xs text-text-muted">{variant.product_name} • {variant.size} • {variant.sku}</p>
          </div>
          <button onClick={onClose} className="btn-ghost modal-close-button shrink-0 p-0" aria-label="Close inventory adjustment dialog">
            <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="inventory-new-quantity" className="mb-2 block text-xs uppercase tracking-widest text-text-muted">New Quantity</label>
              <input id="inventory-new-quantity" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="input-dark inventory-stock-input" />
            </div>
            <div>
              <label htmlFor="inventory-low-stock-threshold" className="mb-2 block text-xs uppercase tracking-widest text-text-muted">Low Stock Threshold</label>
              <input id="inventory-low-stock-threshold" type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} className="input-dark inventory-stock-input" />
            </div>
          </div>

          <div>
            <label htmlFor="inventory-adjustment-reason" className="mb-2 block text-xs uppercase tracking-widest text-text-muted">Reason for Adjustment</label>
            <textarea id="inventory-adjustment-reason" required aria-required="true" aria-describedby="inventory-adjustment-hint" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Restock shipment received, found damaged item, manual count correction" className="input-dark" />
            <p id="inventory-adjustment-hint" className="mt-2 text-[10px] text-text-muted">This reason will be permanently recorded in the audit log.</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border p-6">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving || !reason.trim()} className="btn-primary inventory-save-button px-8" aria-busy={saving}>
            {saving ? 'Saving...' : 'Confirm Adjustment'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
