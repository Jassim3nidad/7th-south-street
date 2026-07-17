'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { productsApi, categoriesApi } from '@/lib/api'
import toast from 'react-hot-toast'

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

export default function AdminProductsPage() {
  const { token } = useAdmin()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', compare_price: '', category_id: '', sku: '', status: 'available', is_featured: false, has_sizes: true })

  const load = () => {
    setLoading(true)
    productsApi.list({ per_page: '50' }).then((r: any) => setProducts(r.data || [])).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    categoriesApi.list().then((r: any) => setCategories(r.data || []))
  }, [])

  const openEdit = (p: any) => {
    setEditing(p)
    setForm({ name: p.name, description: p.description || '', price: p.price, compare_price: p.compare_price || '', category_id: p.category_id || '', sku: p.sku, status: p.status, is_featured: !!p.is_featured, has_sizes: !!p.has_sizes })
    setShowForm(true)
  }

  const openNew = () => { setEditing(null); setForm({ name:'', description:'', price:'', compare_price:'', category_id:'', sku:'', status:'available', is_featured:false, has_sizes:true }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      const body = { ...form, price: parseFloat(form.price), compare_price: form.compare_price ? parseFloat(form.compare_price) : null, category_id: parseInt(form.category_id) || null }
      if (editing) {
        await productsApi.update(editing.id, body, token)
        toast.success('Product updated')
      } else {
        await productsApi.create(body, token)
        toast.success('Product created')
      }
      setShowForm(false)
      load()
    } catch (err: any) { toast.error(err.message || 'Error') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return
    if (!token) return
    try { await productsApi.delete(id, token); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const statusColors: Record<string, string> = { available: 'text-green-400', sold_out: 'text-red-400', archived: 'text-white/30', coming_soon: 'text-yellow-400' }

  return (
    <div className="p-8 lg:p-10">
      <div className="admin-page-header">
        <div>
          <p className="neo-kicker mb-2">Manage</p>
          <h1 className="admin-page-title">Products</h1>
        </div>
        <button onClick={openNew} className="btn-primary text-xs px-6 py-2.5">+ Add Product</button>
      </div>

      {/* Table */}
      <div className="neo-table-shell overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Product', 'Category', 'Price', 'Stock', 'Status', 'Featured', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] tracking-widest uppercase text-white/30 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 skeleton w-20" /></td>)}
                </tr>
              ))
            ) : products.map((p: any) => (
              <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <p className="text-white/80 text-xs font-medium">{p.name}</p>
                  <p className="text-white/25 text-[10px] font-mono">{p.sku}</p>
                </td>
                <td className="px-4 py-3 text-white/40 text-xs">{p.category_name || '—'}</td>
                <td className="px-4 py-3 text-white/70 text-xs">{fmt(p.price)}</td>
                <td className="px-4 py-3 text-white/50 text-xs">{p.total_stock ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] tracking-wider capitalize ${statusColors[p.status] || 'text-white/30'}`}>{p.status?.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 text-white/30 text-xs">{p.is_featured ? '★' : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(p)} className="text-white/30 hover:text-[#C9A96E] text-[10px] tracking-widest uppercase transition-colors">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-white/20 hover:text-[#E63B2E] text-[10px] tracking-widest uppercase transition-colors">Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && products.length === 0 && (
          <div className="py-16 text-center text-white/20 text-sm">No products yet</div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="theme-backdrop fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={false} animate={{ opacity: 1, scale: 1 }}
            className="neo-modal w-full max-w-lg max-h-[90vh] overflow-y-auto p-8" role="dialog" aria-modal="true" aria-label={editing ? 'Edit product' : 'New product'}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-white text-xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{editing ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white transition-colors" aria-label="Close product form">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Product Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input-dark" placeholder="7SS Arch Logo Snapback" /></div>
              <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">SKU *</label>
                <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} required className="input-dark" placeholder="HW-SNAP-001" /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Price (PHP) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required className="input-dark" placeholder="895" /></div>
                <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Compare Price</label>
                  <input type="number" value={form.compare_price} onChange={e => setForm({...form, compare_price: e.target.value})} className="input-dark" placeholder="1200" /></div>
              </div>
              <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Category</label>
                <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="input-dark">
                  <option value="">— None —</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="input-dark resize-none" /></div>
              <div><label className="text-white/30 text-[10px] tracking-widest uppercase block mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-dark">
                  <option value="available">Available</option>
                  <option value="sold_out">Sold Out</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="archived">Archived</option>
                </select></div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} className="w-3 h-3 accent-[#C9A96E]" />
                  <span className="text-white/50 text-xs tracking-wider">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.has_sizes} onChange={e => setForm({...form, has_sizes: e.target.checked})} className="w-3 h-3 accent-[#C9A96E]" />
                  <span className="text-white/50 text-xs tracking-wider">Has Sizes</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary text-xs py-3">{editing ? 'Save Changes' : 'Create Product'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-outline text-xs py-3">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
