'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {loading || !profile ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-light text-[#C9A96E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {profile.first_name} {profile.last_name}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-white/60 text-xs font-mono">{profile.email}</p>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${profile.is_registered ? 'bg-[#C9A96E]/10 border-[#C9A96E]/30 text-[#C9A96E]' : 'bg-white/5 border-white/10 text-white/40'}`}>
                    {profile.is_registered ? 'Registered' : 'Guest'}
                  </span>
                  {profile.is_subscribed && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-500/10 border-blue-500/30 text-blue-400">Newsletter</span>}
                </div>
              </div>
              <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Order History */}
              <div className="admin-card p-5">
                <h3 className="text-xs tracking-widest uppercase text-white/50 mb-4 border-b border-white/5 pb-2">Order History</h3>
                {profile.orders.length === 0 ? (
                  <p className="text-white/30 text-xs py-4 text-center">No orders found.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.orders.map((o: any) => (
                      <div key={o.id} className="flex justify-between items-center bg-white/[0.02] p-3 rounded border border-white/5">
                        <div>
                          <p className="text-sm font-mono text-[#C9A96E]">{o.order_number}</p>
                          <p className="text-[10px] text-white/40">{new Date(o.created_at).toLocaleDateString('en-PH')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white/80">{fmt(o.total)}</p>
                          <p className="text-[10px] uppercase tracking-wider text-white/50">{o.status} • {o.payment_status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RSVP History */}
              <div className="admin-card p-5">
                <h3 className="text-xs tracking-widest uppercase text-white/50 mb-4 border-b border-white/5 pb-2">Event RSVPs</h3>
                {profile.rsvps.length === 0 ? (
                  <p className="text-white/30 text-xs py-4 text-center">No RSVPs found.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.rsvps.map((r: any) => (
                      <div key={r.id} className="bg-white/[0.02] p-3 rounded border border-white/5">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm text-white/80 font-medium">{r.event_title}</p>
                          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/10 ${r.event_status === 'past' ? 'text-white/30' : 'text-green-400'}`}>
                            {r.event_status}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40">Event Date: {new Date(r.event_date).toLocaleDateString('en-PH')}</p>
                        <p className="text-[10px] text-white/30 mt-1">RSVPed: {new Date(r.created_at).toLocaleDateString('en-PH')}</p>
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
