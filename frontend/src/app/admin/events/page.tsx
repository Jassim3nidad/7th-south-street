'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { eventsApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminEventsPage() {
  const { token } = useAdmin()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title:'', description:'', event_date:'', end_date:'', location_name:'', location_address:'', max_rsvp:'0', status:'upcoming', is_featured:false })

  const load = () => {
    setLoading(true)
    eventsApi.list({ all: '1' }).then((r: any) => setEvents(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ title:'', description:'', event_date:'', end_date:'', location_name:'', location_address:'', max_rsvp:'0', status:'upcoming', is_featured:false }); setShowForm(true) }
  const openEdit = (e: any) => { setEditing(e); setForm({ title:e.title, description:e.description||'', event_date:e.event_date?.slice(0,16)||'', end_date:e.end_date?.slice(0,16)||'', location_name:e.location_name||'', location_address:e.location_address||'', max_rsvp:e.max_rsvp||'0', status:e.status, is_featured:!!e.is_featured }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      const body = { ...form, max_rsvp: parseInt(form.max_rsvp) }
      if (editing) { await eventsApi.update(editing.id, body, token); toast.success('Event updated') }
      else { await eventsApi.create(body, token); toast.success('Event created') }
      setShowForm(false); load()
    } catch (err: any) { toast.error(err.message || 'Error') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this event?') || !token) return
    try { await eventsApi.delete(id, token); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }

  const statusColors: Record<string, string> = { upcoming:'text-green-400', ongoing:'text-blue-400', past:'text-white/30', cancelled:'text-red-400' }

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#C9A96E] text-[10px] tracking-[0.4em] uppercase mb-2">Manage</p>
          <h1 className="text-white text-3xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Events</h1>
        </div>
        <button onClick={openNew} className="btn-primary text-xs px-6 py-2.5">+ New Event</button>
      </div>

      <div className="space-y-3">
        {loading ? [...Array(3)].map((_,i) => <div key={i} className="h-20 skeleton" />) :
          events.map((ev: any) => (
            <div key={ev.id} className="border border-white/[0.06] p-5 hover:border-white/[0.1] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white/80 text-sm font-medium">{ev.title}</p>
                    <span className={`text-[10px] tracking-wider capitalize ${statusColors[ev.status] || 'text-white/30'}`}>{ev.status}</span>
                    {ev.is_featured ? <span className="text-[#C9A96E] text-[10px]">★ Featured</span> : null}
                  </div>
                  <p className="text-white/30 text-xs">{new Date(ev.event_date).toLocaleDateString('en-PH', { weekday:'short', month:'long', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                  {ev.location_name && <p className="text-white/20 text-xs mt-0.5">{ev.location_name}</p>}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-white/30 text-xs">{ev.rsvp_count} RSVPs</span>
                  <button onClick={() => openEdit(ev)} className="text-white/30 hover:text-[#C9A96E] text-[10px] tracking-widest uppercase transition-colors">Edit</button>
                  <button onClick={() => handleDelete(ev.id)} className="text-white/20 hover:text-[#E63B2E] text-[10px] tracking-widest uppercase transition-colors">Del</button>
                </div>
              </div>
            </div>
          ))
        }
        {!loading && events.length === 0 && <div className="py-16 text-center text-white/20">No events yet</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
            className="bg-[#0E0C0A] border border-white/[0.08] w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-white text-xl font-light" style={{ fontFamily:'Cormorant Garamond, serif' }}>{editing ? 'Edit Event' : 'New Event'}</h2>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Event Title *</label>
                <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} required className="input-dark" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Start Date/Time *</label>
                  <input type="datetime-local" value={form.event_date} onChange={e => setForm({...form,event_date:e.target.value})} required className="input-dark" /></div>
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">End Date/Time</label>
                  <input type="datetime-local" value={form.end_date} onChange={e => setForm({...form,end_date:e.target.value})} className="input-dark" /></div>
              </div>
              <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Location Name</label>
                <input value={form.location_name} onChange={e => setForm({...form,location_name:e.target.value})} className="input-dark" placeholder="The Collective BGC" /></div>
              <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Address</label>
                <input value={form.location_address} onChange={e => setForm({...form,location_address:e.target.value})} className="input-dark" /></div>
              <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={3} className="input-dark resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Max RSVP (0=unlimited)</label>
                  <input type="number" min="0" value={form.max_rsvp} onChange={e => setForm({...form,max_rsvp:e.target.value})} className="input-dark" /></div>
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="input-dark">
                    {['upcoming','ongoing','past','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form,is_featured:e.target.checked})} className="w-3 h-3 accent-[#C9A96E]" />
                <span className="text-white/50 text-xs tracking-wider">Feature on homepage</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary text-xs py-3">{editing ? 'Save' : 'Create'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-outline text-xs py-3">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
