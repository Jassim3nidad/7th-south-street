'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { productsApi, categoriesApi } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { ProductModal } from './ProductModal'

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

export default function AdminProductsPage() {
  const { token } = useAdmin()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => {
    setLoading(true)
    let params: any = { per_page: '100' }
    if (search.trim()) params.search = search.trim()
    if (statusFilter !== 'all') params.status = statusFilter

    productsApi.list(params).then((r: any) => {
      // Products might not have product_images loaded properly from list API if nested,
      // but list API does include product_variants and product_images!
      setProducts(r.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [search, statusFilter])

  useEffect(() => {
    categoriesApi.list().then((r: any) => setCategories(r.data || []))
  }, [])

  const openEdit = (p: any) => {
    setEditing(p)
    setShowForm(true)
  }

  const openNew = () => {
    setEditing(null)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this product and ALL its images from storage? This cannot be undone.')) return
    if (!token) return
    try { 
      await productsApi.delete(id, token)
      toast.success('Product and images deleted')
      load() 
    } catch { 
      toast.error('Failed to delete') 
    }
  }

  const handleArchive = async (p: any) => {
    if (!token) return
    const newStatus = p.status === 'archived' ? 'available' : 'archived'
    try {
      await productsApi.update(p.id, { ...p, status: newStatus }, token)
      toast.success(`Product ${newStatus === 'archived' ? 'archived' : 'restored'}`)
      load()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const statusColors: Record<string, string> = { available: 'text-green-400 bg-green-400/10 border-green-400/20', sold_out: 'text-red-400 bg-red-400/10 border-red-400/20', archived: 'text-white/30 bg-white/5 border-white/10', coming_soon: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', draft: 'text-purple-400 bg-purple-400/10 border-purple-400/20' }

  return (
    <div className="p-8 lg:p-10">
      <div className="admin-page-header flex-col md:flex-row items-start md:items-end gap-4">
        <div>
          <p className="neo-kicker mb-2">Manage</p>
          <h1 className="admin-page-title">Products</h1>
        </div>
        <button onClick={openNew} className="btn-primary text-xs px-6 py-2.5">+ Add Product</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Search products by name or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors appearance-none md:w-48"
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="draft">Draft</option>
          <option value="sold_out">Sold Out</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="neo-table-shell overflow-x-auto min-h-[400px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3 text-left text-[10px] tracking-widest uppercase text-white/30 font-normal w-12">Img</th>
              {['Product', 'Category', 'Price', 'Inventory', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] tracking-widest uppercase text-white/30 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 skeleton w-20 rounded" /></td>)}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">
                  No products found.
                </td>
              </tr>
            ) : products.map((p: any) => {
              const primaryImage = p.product_images?.find((img: any) => img.is_primary) || p.product_images?.[0]
              const totalStock = p.product_variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0
              const variantCount = p.product_variants?.length || 0

              return (
                <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded bg-white/5 border border-white/10 overflow-hidden relative flex items-center justify-center">
                      {primaryImage ? (
                        <Image src={primaryImage.url || primaryImage.publicUrl || ''} alt={p.name} fill className="object-cover" />
                      ) : (
                        <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/80 text-xs font-medium flex items-center gap-2">
                      {p.name}
                      {p.is_featured && <span className="text-[9px] bg-[#C9A96E]/20 text-[#C9A96E] px-1.5 py-0.5 rounded">FEATURED</span>}
                    </p>
                    <p className="text-white/25 text-[10px] font-mono mt-1">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{p.categories?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-[#C9A96E] font-mono text-xs">{fmt(p.price)}</p>
                    {p.compare_price && <p className="text-white/20 text-[10px] font-mono line-through">{fmt(p.compare_price)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/70 text-xs">{totalStock} in stock</p>
                    <p className="text-white/30 text-[10px]">{variantCount} variant{variantCount !== 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] px-2 py-1 rounded-md border uppercase tracking-widest ${statusColors[p.status] || 'text-white/50'}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/product/${p.slug}`} target="_blank" className="text-white/30 hover:text-white transition-colors" title="Preview">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </Link>
                      <button onClick={() => handleArchive(p)} className="text-white/30 hover:text-yellow-400 transition-colors" title={p.status === 'archived' ? 'Restore' : 'Archive'}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                      </button>
                      <button onClick={() => openEdit(p)} className="text-white/30 hover:text-[#C9A96E] transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-white/30 hover:text-red-400 transition-colors" title="Delete Permanently">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showForm && (
          <ProductModal 
            product={editing} 
            categories={categories} 
            onClose={() => setShowForm(false)} 
            onSaved={() => { setShowForm(false); load() }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
