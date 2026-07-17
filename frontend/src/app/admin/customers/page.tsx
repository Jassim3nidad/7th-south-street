'use client'
import { useEffect, useState } from 'react'
import { useAdmin } from '@/store/admin'
import { } from '@/lib/api'

export default function AdminCustomersPage() {
  const { token } = useAdmin()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('/api/customers', { credentials: 'same-origin' })
      .then(r => r.json())
      .then((r: any) => setCustomers(r.data || []))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="p-8 lg:p-10">
      <div className="admin-page-header">
        <div><p className="neo-kicker mb-2">Manage</p>
        <h1 className="admin-page-title">Customers</h1></div>
      </div>
      <div className="neo-table-shell overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Name','Email','Phone','Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] tracking-widest uppercase text-white/30 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(6)].map((_,i) => (
              <tr key={i} className="border-b border-white/[0.04]">
                {[...Array(4)].map((_,j) => <td key={j} className="px-4 py-3"><div className="h-3 skeleton w-24" /></td>)}
              </tr>
            )) : customers.map((c: any) => (
              <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70 text-xs">{c.first_name} {c.last_name}</td>
                <td className="px-4 py-3 text-white/40 text-xs">{c.email}</td>
                <td className="px-4 py-3 text-white/30 text-xs">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-white/25 text-xs">{new Date(c.created_at).toLocaleDateString('en-PH')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && customers.length === 0 && <div className="py-16 text-center text-white/20 text-sm">No customers yet</div>}
      </div>
    </div>
  )
}
