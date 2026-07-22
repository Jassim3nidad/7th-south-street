'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { eventsApi } from '@/lib/api'
import toast from 'react-hot-toast'

function Countdown({ date }: { date: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const calc = () => {
      const diff = new Date(date).getTime() - Date.now()
      if (diff <= 0) return
      setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id)
  }, [date])
  return (
    <div className="flex items-end gap-3 sm:gap-6">
      {[['Days', t.d], ['Hours', t.h], ['Min', t.m], ['Sec', t.s]].map(([l, v]) => (
        <div key={l as string}>
          <p className="text-white font-light" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 1 }}>{String(v).padStart(2, '0')}</p>
          <p className="text-white/25 text-[10px] tracking-widest uppercase mt-2">{l}</p>
        </div>
      ))}
    </div>
  )
}

export default function EventDetailPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpForm, setRsvpForm] = useState({ name: '', email: '', phone: '' })
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [rsvpDone, setRsvpDone] = useState(false)

  useEffect(() => {
    if (!slug) return
    eventsApi.get(slug as string)
      .then((r: any) => setEvent(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    setRsvpLoading(true)
    try {
      await eventsApi.rsvp(event.id, rsvpForm)
      toast.success("You're in! See you there.")
      setRsvpDone(true)
    } catch (err: any) {
      toast.error(err.message || 'RSVP failed')
    } finally {
      setRsvpLoading(false)
    }
  }

  if (loading) return (
    <main className="site-shell">
      <div className="pt-40 max-w-4xl mx-auto px-6 space-y-6">
        <div className="h-6 skeleton w-32" /><div className="h-16 skeleton w-2/3" /><div className="h-4 skeleton w-1/3" />
      </div>
    </main>
  )

  if (!event) return (
    <main className="site-shell flex items-center justify-center">
      <h1 className="neo-heading text-3xl">Event not found</h1>
    </main>
  )

  const isPast = event.status === 'past' || event.status === 'cancelled'
  const isFullyBooked = event.max_rsvp > 0 && event.rsvp_count >= event.max_rsvp

  return (
    <main className="site-shell">
      <div className="site-container detail-layout max-w-5xl">
        {/* Breadcrumb */}
        <p className="detail-breadcrumb text-white/20 text-xs tracking-widest uppercase mb-8">
          <Link href="/events" className="hover:text-white/40 transition-colors">Events</Link>
          <span className="mx-2">/</span>
          <span>{event.title}</span>
        </p>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left: Details */}
          <div className="lg:col-span-3 neo-panel">
            <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-6">
                <span className={`text-[10px] tracking-widest uppercase px-2 py-1 border ${isPast ? 'border-white/10 text-white/30' : 'border-[#C9A96E]/30 text-[#C9A96E]'}`}>
                  {event.status}
                </span>
                {event.is_featured && <span className="text-[#C9A96E] text-xs">★ Featured</span>}
              </div>
              <h1 className="text-white font-light mb-6" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 5vw, 64px)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                {event.title}
              </h1>

              {/* Poster */}
              {event.poster_url && (
                <div className="mb-8 relative aspect-[4/3] w-full overflow-hidden neo-surface-sm">
                  <img src={event.poster_url} alt={event.title} className="object-cover w-full h-full opacity-90" />
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-white/60 text-sm">
                    {new Date(event.event_date).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-white/30 text-xs">
                    {new Date(event.event_date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                    {event.end_date && ` — ${new Date(event.end_date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>

              {/* Location */}
              {event.location_name && (
                <div className="flex items-start gap-3 mb-8">
                  <svg className="w-4 h-4 text-white/25 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-white/60 text-sm">{event.location_name}</p>
                    {event.location_address && <p className="text-white/30 text-xs mt-0.5">{event.location_address}</p>}
                  </div>
                </div>
              )}

              {event.description && (
                <p className="text-white/40 text-sm leading-relaxed mb-10 border-t border-white/[0.06] pt-6">{event.description}</p>
              )}

              {/* Gallery */}
              {event.gallery && event.gallery.length > 0 && (
                <div className="mb-10">
                  <p className="text-white/20 text-[10px] tracking-widest uppercase mb-4">Gallery</p>
                  <div className="grid grid-cols-2 gap-4">
                    {event.gallery.map((img: any, i: number) => (
                      <div key={img.id} className={`relative overflow-hidden neo-surface-sm ${i === 0 && event.gallery.length % 2 !== 0 ? 'col-span-2 aspect-[21/9]' : 'aspect-square'}`}>
                        <img src={img.image_url} alt={`Gallery image ${i + 1}`} className="object-cover w-full h-full opacity-80 hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RSVP progress */}
              {event.max_rsvp > 0 && (
                <div className="mb-10">
                  <div className="flex justify-between text-xs text-white/30 mb-2">
                    <span>{event.rsvp_count} going</span>
                    <span>{event.max_rsvp} capacity</span>
                  </div>
                  <div className="h-px bg-white/[0.06]">
                    <div className="h-px bg-[#C9A96E] transition-all duration-500" style={{ width: `${Math.min(100, (event.rsvp_count / event.max_rsvp) * 100)}%` }} />
                  </div>
                  {isFullyBooked && <p className="text-[#E63B2E] text-xs tracking-wider mt-2">Fully booked</p>}
                </div>
              )}

              {/* Countdown */}
              {!isPast && (
                <div className="neo-inset p-6">
                  <p className="text-white/20 text-[10px] tracking-widest uppercase mb-6">Countdown</p>
                  <Countdown date={event.event_date} />
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: RSVP */}
          <div className="lg:col-span-2">
            <motion.div initial={false} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="neo-panel sticky top-24">
              {isPast ? (
                <div className="text-center py-8">
                  <p className="text-white/30 text-sm mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>This event has passed</p>
                  <p className="text-white/20 text-xs">Stay tuned for upcoming events.</p>
                </div>
              ) : isFullyBooked ? (
                <div className="text-center py-8">
                  <p className="text-white/30 text-sm" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>Fully Booked</p>
                </div>
              ) : rsvpDone ? (
                <div className="text-center py-8 space-y-3">
                  <div className="neo-inset w-12 h-12 flex items-center justify-center mx-auto">
                    <svg className="w-5 h-5 text-[#C9A96E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white/70 text-sm">RSVP Confirmed</p>
                  <p className="text-white/30 text-xs">We'll see you there.</p>
                </div>
              ) : (
                <>
                  <p className="text-white/30 text-[10px] tracking-widest uppercase mb-6">Reserve Your Spot</p>
                  <form onSubmit={handleRSVP} className="space-y-4">
                    <div><label htmlFor="event-rsvp-name" className="text-white/25 text-[10px] tracking-widest uppercase block mb-1.5">Name *</label>
                      <input id="event-rsvp-name" name="name" autoComplete="name" value={rsvpForm.name} onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })} required className="input-dark" placeholder="Your full name" /></div>
                    <div><label htmlFor="event-rsvp-email" className="text-white/25 text-[10px] tracking-widest uppercase block mb-1.5">Email *</label>
                      <input id="event-rsvp-email" name="email" type="email" autoComplete="email" value={rsvpForm.email} onChange={e => setRsvpForm({ ...rsvpForm, email: e.target.value })} required className="input-dark" placeholder="your@email.com" /></div>
                    <div><label htmlFor="event-rsvp-phone" className="text-white/25 text-[10px] tracking-widest uppercase block mb-1.5">Phone</label>
                      <input id="event-rsvp-phone" name="phone" type="tel" autoComplete="tel" value={rsvpForm.phone} onChange={e => setRsvpForm({ ...rsvpForm, phone: e.target.value })} className="input-dark" placeholder="+63 9XX XXX XXXX" /></div>
                    <button type="submit" disabled={rsvpLoading}
                      className="btn-primary w-full mt-2">
                      {rsvpLoading ? 'Confirming...' : 'RSVP Now — Free'}
                    </button>
                    <p className="text-white/15 text-[10px] text-center tracking-wider">No spam. Just event updates.</p>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}
