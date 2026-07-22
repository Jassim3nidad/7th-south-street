'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { eventsApi } from '@/lib/api'

export function EventRsvpModal({
  event,
  onClose
}: {
  event: any
  onClose: () => void
}) {
  const { token } = useAdmin()
  const [rsvps, setRsvps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    eventsApi.getRsvps(event.id, token).then(r => {
      setRsvps(r.data || [])
    }).finally(() => setLoading(false))
  }, [token, event.id])

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Timestamp']
    const rows = rsvps.map(r => `"${r.name}","${r.email}","${r.phone || ''}","${new Date(r.created_at).toISOString()}"`)
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', `rsvp-${event.slug}-${new Date().toISOString().split('T')[0]}.csv`)
    a.click()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-light text-[#C9A96E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>RSVP List</h2>
            <p className="text-white/40 text-xs mt-1 font-mono">{event.title} • {rsvps.length} Guests</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleExport} disabled={loading || rsvps.length === 0} className="btn-secondary text-xs px-4 py-2">
              Export CSV
            </button>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0 no-scrollbar">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton rounded-md" />)}
            </div>
          ) : rsvps.length === 0 ? (
            <div className="p-12 text-center text-white/30 text-sm">No RSVPs yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] border-b border-white/5 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-[10px] tracking-widest uppercase text-white/40 font-normal">Name</th>
                  <th className="px-6 py-3 text-[10px] tracking-widest uppercase text-white/40 font-normal">Email</th>
                  <th className="px-6 py-3 text-[10px] tracking-widest uppercase text-white/40 font-normal">Phone</th>
                  <th className="px-6 py-3 text-[10px] tracking-widest uppercase text-white/40 font-normal text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r, i) => (
                  <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                    <td className="px-6 py-3 text-white/80 text-xs">{r.name}</td>
                    <td className="px-6 py-3 text-white/60 text-xs">{r.email}</td>
                    <td className="px-6 py-3 text-white/50 text-xs">{r.phone || '-'}</td>
                    <td className="px-6 py-3 text-white/30 text-xs text-right">
                      {new Date(r.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
