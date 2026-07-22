'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { customersApi } from '@/lib/api'

export function CustomerModal({
  customer,
  onClose
}: {
  customer: any
  onClose: () => void
}) {
  const { token } = useAdmin()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    customersApi.get(customer.id, token).then(r => {
      setProfile(r.data)
    }).finally(() => setLoading(false))
  }, [token, customer.id])

  const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="theme-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="neo-modal w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={`Customer details${customer?.email ? ` for ${customer.email}` : ''}`}
        aria-busy={loading}
      >
        
        {loading || !profile ? (
          <div className="flex justify-center p-12" role="status" aria-live="polite">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-accent border-t-transparent" aria-hidden="true" />
            <span className="sr-only">Loading customer details</span>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-border p-6 sm:items-center">
              <div>
                <h2 className="font-display text-2xl font-medium text-text-primary">
                  {profile.first_name} {profile.last_name}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="min-w-0 break-all font-mono text-xs text-text-secondary">{profile.email}</p>
                  <span className={`order-status-badge ${profile.is_registered ? 'status-confirmed' : ''}`}>
                    {profile.is_registered ? 'Registered' : 'Guest'}
                  </span>
                  {profile.is_subscribed && <span className="order-status-badge status-shipped">Newsletter</span>}
                </div>
              </div>
              <button onClick={onClose} className="btn-ghost modal-close-button shrink-0 p-0" aria-label="Close customer dialog">
                <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Order History */}
              <div className="admin-card p-5">
                <h3 className="mb-4 border-b border-border pb-2 text-xs uppercase tracking-widest text-text-secondary">Order History</h3>
                {profile.orders.length === 0 ? (
                  <p className="py-4 text-center text-xs text-text-muted">No orders found.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.orders.map((o: any) => (
                      <div key={o.id} className="neo-inset flex items-center justify-between gap-3 p-3">
                        <div>
                          <p className="font-mono text-sm text-brand-accent">{o.order_number}</p>
                          <p className="text-[10px] text-text-muted">{new Date(o.created_at).toLocaleDateString('en-PH')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-text-primary">{fmt(o.total)}</p>
                          <p className="text-[10px] uppercase tracking-wider text-text-secondary">{o.status} • {o.payment_status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RSVP History */}
              <div className="admin-card p-5">
                <h3 className="mb-4 border-b border-border pb-2 text-xs uppercase tracking-widest text-text-secondary">Event RSVPs</h3>
                {profile.rsvps.length === 0 ? (
                  <p className="py-4 text-center text-xs text-text-muted">No RSVPs found.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.rsvps.map((r: any) => (
                      <div key={r.id} className="neo-inset p-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-medium text-text-primary">{r.event_title}</p>
                          <span className={`order-status-badge ${r.event_status === 'past' ? '' : 'status-delivered'}`}>
                            {r.event_status}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary">Event Date: {new Date(r.event_date).toLocaleDateString('en-PH')}</p>
                        <p className="mt-1 text-[10px] text-text-muted">RSVPed: {new Date(r.created_at).toLocaleDateString('en-PH')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
