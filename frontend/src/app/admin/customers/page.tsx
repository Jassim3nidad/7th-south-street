'use client'
import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { customersApi } from '@/lib/api'
import { CustomerModal } from './CustomerModal'

export default function AdminCustomersPage() {
  const { token } = useAdmin()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    const params: Record<string, string> = {}
    if (search) params.search = search

    customersApi.list(params, token)
      .then((r: any) => setCustomers(r.data || []))
      .finally(() => setLoading(false))
  }, [search, token])

  useEffect(() => {
    const timer = setTimeout(() => load(), 400)
    return () => clearTimeout(timer)
  }, [load])

  return (
    <div className="p-8 lg:p-10">
      <div className="admin-page-header">
        <div>
          <p className="neo-kicker mb-2">Manage</p>
          <h1 className="admin-page-title">Customers</h1>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="neo-table-shell overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Name','Email','Phone','Status','Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] tracking-widest uppercase text-white/30 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(6)].map((_,i) => (
              <tr key={i} className="border-b border-white/[0.04]">
                {[...Array(5)].map((_,j) => <td key={j} className="px-4 py-3"><div className="h-3 skeleton w-24" /></td>)}
              </tr>
            )) : customers.map((c: any) => (
              <tr key={c.id} onClick={() => setSelectedCustomer(c)} className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors">
                <td className="px-4 py-3 text-white/80 text-xs">{c.first_name} {c.last_name}</td>
                <td className="px-4 py-3 text-white/50 text-xs font-mono">{c.email}</td>
                <td className="px-4 py-3 text-white/30 text-xs">{c.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${c.user_id ? 'bg-[#C9A96E]/10 border-[#C9A96E]/30 text-[#C9A96E]' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    {c.user_id ? 'Registered' : 'Guest'}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/30 text-xs">{new Date(c.created_at).toLocaleDateString('en-PH')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && customers.length === 0 && (
          <div className="py-16 text-center text-white/20 text-sm border border-white/5 border-dashed m-4 rounded">
            No customers match your criteria.
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedCustomer && (
          <CustomerModal 
            customer={selectedCustomer} 
            onClose={() => setSelectedCustomer(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
