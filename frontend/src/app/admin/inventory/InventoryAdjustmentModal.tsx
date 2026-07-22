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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-light text-[#C9A96E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Adjust Inventory</h2>
            <p className="text-white/40 text-xs mt-1 font-mono">{variant.product_name} • {variant.size} • {variant.sku}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">New Quantity</label>
              <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Low Stock Threshold</label>
              <input type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Reason for Adjustment</label>
            <textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Restock shipment received, found damaged item, manual count correction" className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors" />
            <p className="text-white/30 text-[10px] mt-2">This reason will be permanently recorded in the audit log.</p>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-[#0a0a0a]">
          <button onClick={onClose} className="px-6 py-2.5 text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !reason.trim()} className="btn-primary text-sm px-8 py-2.5 disabled:opacity-50">
            {saving ? 'Saving...' : 'Confirm Adjustment'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
