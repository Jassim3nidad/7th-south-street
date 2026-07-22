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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="theme-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="neo-modal w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rsvp-modal-title"
        aria-busy={loading}
      >
        
        <div className="flex flex-col items-start justify-between gap-4 border-b border-border p-6 sm:flex-row sm:items-center">
          <div>
            <h2 id="rsvp-modal-title" className="font-display text-2xl font-medium text-text-primary">RSVP List</h2>
            <p className="mt-1 font-mono text-xs text-text-muted">{event.title} • {rsvps.length} Guests</p>
          </div>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button onClick={handleExport} disabled={loading || rsvps.length === 0} className="btn-outline px-4" aria-label={`Export ${rsvps.length} RSVPs as CSV`}>
              Export CSV
            </button>
            <button onClick={onClose} className="btn-ghost modal-close-button shrink-0 p-0" aria-label="Close RSVP dialog">
              <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0 no-scrollbar">
          {loading ? (
            <div className="space-y-4 p-6" role="status" aria-label="Loading RSVPs">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton rounded-md" />)}
            </div>
          ) : rsvps.length === 0 ? (
            <div className="neo-inset m-6 p-12 text-center text-sm text-text-muted">No RSVPs yet.</div>
          ) : (
            <table className="w-full min-w-[42rem] text-left text-sm">
              <caption className="sr-only">RSVP guests for {event.title}</caption>
              <thead className="sticky top-0 border-b border-border bg-[var(--neo-table-head)]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-[10px] font-normal uppercase tracking-widest text-text-muted">Name</th>
                  <th scope="col" className="px-6 py-3 text-[10px] font-normal uppercase tracking-widest text-text-muted">Email</th>
                  <th scope="col" className="px-6 py-3 text-[10px] font-normal uppercase tracking-widest text-text-muted">Phone</th>
                  <th scope="col" className="px-6 py-3 text-right text-[10px] font-normal uppercase tracking-widest text-text-muted">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r, i) => (
                  <tr key={i} className="border-b border-border transition-colors hover:bg-[var(--neo-hover)]">
                    <td className="px-6 py-3 text-xs text-text-primary">{r.name}</td>
                    <td className="px-6 py-3 text-xs text-text-secondary">{r.email}</td>
                    <td className="px-6 py-3 text-xs text-text-secondary">{r.phone || '-'}</td>
                    <td className="px-6 py-3 text-right text-xs text-text-muted">
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
