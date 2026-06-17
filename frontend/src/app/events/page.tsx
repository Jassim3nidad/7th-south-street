'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/layout/CartDrawer'
import { eventsApi } from '@/lib/api'

function CountdownTimer({ eventDate }: { eventDate: string }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const calc = () => {
      const diff = new Date(eventDate).getTime() - Date.now()
      if (diff <= 0) return
      setTime({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [eventDate])
  return (
    <div className="flex items-center gap-4">
      {[['d', time.d], ['h', time.h], ['m', time.m], ['s', time.s]].map(([label, val]) => (
        <div key={label as string} className="text-center">
          <div className="text-white text-2xl font-light w-10" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{String(val).padStart(2, '0')}</div>
          <div className="text-white/30 text-[9px] tracking-widest uppercase mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eventsApi.list()
      .then((r: any) => setEvents(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const upcoming = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing')
  const past = events.filter(e => e.status === 'past')

  return (
    <main className="bg-[#080808] min-h-screen">
      <Navbar />
      <CartDrawer />

      {/* Header */}
      <div className="pt-32 pb-16 px-6 lg:px-12 max-w-7xl mx-auto border-b border-white/[0.06]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#C9A96E] text-xs tracking-[0.4em] uppercase mb-3">Pop-Ups</p>
          <h1 className="text-white font-light" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px, 6vw, 80px)', letterSpacing: '-0.02em' }}>
            Events
          </h1>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mb-20">
            <p className="text-white/30 text-xs tracking-widest uppercase mb-8 pb-4 border-b border-white/[0.06]">Upcoming</p>
            <div className="space-y-4">
              {upcoming.map((event: any, i: number) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="border border-white/[0.06] hover:border-white/[0.12] transition-colors duration-300 p-6 lg:p-8">
                    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                      <div className="lg:col-span-2">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-[#C9A96E] text-xs tracking-widest uppercase">
                            {new Date(event.event_date).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-white/30 text-xs">
                            {new Date(event.event_date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h2 className="text-white text-3xl lg:text-4xl font-light mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          {event.title}
                        </h2>
                        {event.location_name && (
                          <p className="text-white/40 text-sm mb-3">{event.location_name}</p>
                        )}
                        {event.location_address && (
                          <p className="text-white/25 text-xs">{event.location_address}</p>
                        )}
                        {event.description && (
                          <p className="text-white/30 text-sm leading-relaxed mt-4 max-w-lg">{event.description}</p>
                        )}
                        <div className="mt-6 flex gap-3">
                          <Link href={`/events/${event.slug}`} className="btn-primary text-xs px-6 py-3">RSVP</Link>
                          <Link href={`/events/${event.slug}`} className="btn-ghost text-xs px-6 py-3">Details</Link>
                        </div>
                      </div>
                      <div className="border-t lg:border-t-0 lg:border-l border-white/[0.06] pt-4 lg:pt-0 lg:pl-8">
                        <p className="text-white/20 text-[10px] tracking-widest uppercase mb-4">Countdown</p>
                        <CountdownTimer eventDate={event.event_date} />
                        {event.max_rsvp > 0 && (
                          <div className="mt-6">
                            <div className="flex justify-between text-xs text-white/30 mb-1.5">
                              <span>{event.rsvp_count} going</span>
                              <span>{event.max_rsvp - event.rsvp_count} spots left</span>
                            </div>
                            <div className="h-px bg-white/[0.06]">
                              <div className="h-px bg-[#C9A96E]" style={{ width: `${(event.rsvp_count / event.max_rsvp) * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-8 pb-4 border-b border-white/[0.06]">Past Events</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {past.map((event: any, i: number) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <div className="border border-white/[0.06] p-5 opacity-60">
                    <p className="text-white/30 text-xs mb-2">
                      {new Date(event.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h3 className="text-white/70 text-lg font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{event.title}</h3>
                    {event.location_name && <p className="text-white/25 text-xs mt-1">{event.location_name}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {!loading && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <p className="text-white/20 text-2xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>No events scheduled yet</p>
            <p className="text-white/15 text-sm">Check back soon — something's always cooking.</p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
