'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { productsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import Image from 'next/image'

export function ProductModal({
  product,
  categories,
  onClose,
  onSaved
}: {
  product: any | null
  categories: any[]
  onClose: () => void
  onSaved: () => void
}) {
  const { token } = useAdmin()
  const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'images'>('basic')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Basic Info
  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    price: product?.price || '',
    compare_price: product?.compare_price || '',
    category_id: product?.category_id || '',
    sku: product?.sku || '',
    status: product?.status || 'draft',
    is_featured: !!product?.is_featured,
    has_sizes: product?.has_sizes ?? true,
  })

  // Variants
  const [variants, setVariants] = useState<any[]>(
    product?.product_variants || []
  )

  // Images
  const [images, setImages] = useState<any[]>(
    product?.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
  )

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm(f => ({ ...f, [name]: val }))
  }

  const addVariant = () => {
    setVariants([...variants, { id: null, sku: '', size: '', price: form.price, compare_at_price: form.compare_price, stock_quantity: 0, is_active: true }])
  }
  const removeVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx))
  }
  const updateVariant = (idx: number, field: string, val: any) => {
    const newV = [...variants]
    newV[idx] = { ...newV[idx], [field]: val }
    setVariants(newV)
  }

  const handleSave = async () => {
    if (!token) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        category_id: parseInt(form.category_id) || null,
        variants: form.has_sizes ? variants.map(v => ({
          ...v,
          price: v.price ? parseFloat(v.price) : parseFloat(form.price) || 0,
          compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
          stock_quantity: parseInt(v.stock_quantity) || 0
        })) : []
      }

      if (product) {
        await productsApi.update(product.id, payload, token)
        toast.success('Product updated')
      } else {
        await productsApi.create(payload, token)
        toast.success('Product created. You can now add images.')
      }
      onSaved()
      if (!product) onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token || !product) return
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      let newImages = [...images]
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isPrimary = newImages.length === 0
        const res = await productsApi.uploadImage(product.id, file, isPrimary)
        newImages.push({ ...res, sort_order: newImages.length })
      }
      setImages(newImages)
      toast.success('Images uploaded')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleDeleteImage = async (idx: number, objectPath: string) => {
    if (!token || !product) return
    try {
      await productsApi.deleteImage(objectPath, token)
      const newImages = images.filter((_, i) => i !== idx)
      setImages(newImages)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete image')
    }
  }

  const moveImage = async (idx: number, dir: -1 | 1) => {
    if (!token || !product) return
    if (idx + dir < 0 || idx + dir >= images.length) return
    const newImages = [...images]
    const temp = newImages[idx]
    newImages[idx] = newImages[idx + dir]
    newImages[idx + dir] = temp
    setImages(newImages)
    try {
      await productsApi.reorderImages(product.id, newImages.map(img => img.id), token)
    } catch (err: any) {
      toast.error('Failed to reorder')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-light text-[#C9A96E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{product ? 'Edit Product' : 'New Product'}</h2>
            {product && <p className="text-white/40 text-xs mt-1 font-mono">{product.sku}</p>}
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          <button onClick={() => setActiveTab('basic')} className={`py-3 px-4 text-xs tracking-widest uppercase transition-colors border-b-2 ${activeTab === 'basic' ? 'border-[#C9A96E] text-[#C9A96E]' : 'border-transparent text-white/40 hover:text-white'}`}>Basic Info</button>
          <button onClick={() => setActiveTab('variants')} disabled={!form.has_sizes} className={`py-3 px-4 text-xs tracking-widest uppercase transition-colors border-b-2 disabled:opacity-30 ${activeTab === 'variants' ? 'border-[#C9A96E] text-[#C9A96E]' : 'border-transparent text-white/40 hover:text-white'}`}>Variants & Sizes</button>
          <button onClick={() => setActiveTab('images')} disabled={!product} className={`py-3 px-4 text-xs tracking-widest uppercase transition-colors border-b-2 disabled:opacity-30 disabled:cursor-not-allowed ${activeTab === 'images' ? 'border-[#C9A96E] text-[#C9A96E]' : 'border-transparent text-white/40 hover:text-white'}`} title={!product ? 'Save product first' : ''}>Images</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div><label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Name</label>
                <input required type="text" name="name" value={form.name} onChange={handleBasicChange} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors" /></div>
                
                <div><label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Base SKU</label>
                <input required type="text" name="sku" value={form.sku} onChange={handleBasicChange} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E] font-mono transition-colors" /></div>
              </div>

              <div><label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Description</label>
              <textarea name="description" value={form.description} onChange={handleBasicChange} rows={4} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors" /></div>

              <div className="grid md:grid-cols-3 gap-6">
                <div><label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Base Price (PHP)</label>
                <input required type="number" name="price" value={form.price} onChange={handleBasicChange} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E] font-mono transition-colors" /></div>
                
                <div><label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Compare At (PHP)</label>
                <input type="number" name="compare_price" value={form.compare_price} onChange={handleBasicChange} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E] font-mono transition-colors" /></div>
                
                <div><label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Category</label>
                <select name="category_id" value={form.category_id} onChange={handleBasicChange} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors appearance-none">
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 p-4 bg-white/[0.02] rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <input type="checkbox" name="has_sizes" checked={form.has_sizes} onChange={handleBasicChange} className="w-4 h-4 accent-[#C9A96E] bg-white/10 border-none rounded" id="has_sizes" />
                  <label htmlFor="has_sizes" className="text-sm text-white/80 select-none cursor-pointer">Product has variants/sizes</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleBasicChange} className="w-4 h-4 accent-[#C9A96E] bg-white/10 border-none rounded" id="is_featured" />
                  <label htmlFor="is_featured" className="text-sm text-white/80 select-none cursor-pointer">Feature on homepage</label>
                </div>
              </div>

              <div><label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Status</label>
                <select name="status" value={form.status} onChange={handleBasicChange} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors appearance-none">
                  <option value="draft">Draft (Hidden)</option>
                  <option value="available">Available</option>
                  <option value="sold_out">Sold Out</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-white/50">Define specific sizes, override prices, and track inventory for this product.</p>
                <button onClick={addVariant} className="text-xs text-[#C9A96E] hover:text-white uppercase tracking-wider transition-colors">+ Add Variant</button>
              </div>

              {variants.length === 0 && (
                <div className="p-8 text-center text-white/30 border border-white/5 rounded-lg border-dashed bg-white/[0.02]">
                  No variants added. Base product SKU and price will be used.
                </div>
              )}

              {variants.map((v, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="w-full md:w-auto flex-1">
                    <label className="block text-[10px] uppercase text-white/30 mb-1">Size</label>
                    <input type="text" value={v.size} placeholder="e.g. OS, M, L" onChange={e => updateVariant(idx, 'size', e.target.value)} className="w-full bg-transparent border-b border-white/20 px-1 py-1 text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors" />
                  </div>
                  <div className="w-full md:w-auto flex-1">
                    <label className="block text-[10px] uppercase text-white/30 mb-1">SKU Override</label>
                    <input type="text" value={v.sku} placeholder={form.sku || 'SKU'} onChange={e => updateVariant(idx, 'sku', e.target.value)} className="w-full bg-transparent border-b border-white/20 px-1 py-1 text-sm text-white focus:outline-none focus:border-[#C9A96E] font-mono transition-colors" />
                  </div>
                  <div className="w-full md:w-auto w-24">
                    <label className="block text-[10px] uppercase text-white/30 mb-1">Stock</label>
                    <input type="number" value={v.stock_quantity} onChange={e => updateVariant(idx, 'stock_quantity', e.target.value)} className="w-full bg-transparent border-b border-white/20 px-1 py-1 text-sm text-white focus:outline-none focus:border-[#C9A96E] font-mono transition-colors" />
                  </div>
                  <div className="w-full md:w-auto w-32">
                    <label className="block text-[10px] uppercase text-white/30 mb-1">Price (Opt)</label>
                    <input type="number" value={v.price} placeholder={form.price} onChange={e => updateVariant(idx, 'price', e.target.value)} className="w-full bg-transparent border-b border-white/20 px-1 py-1 text-sm text-white focus:outline-none focus:border-[#C9A96E] font-mono transition-colors" />
                  </div>
                  <button onClick={() => removeVariant(idx)} className="text-red-400/50 hover:text-red-400 transition-colors p-2 self-end mb-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'images' && product && (
            <div className="space-y-6">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-lg cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#C9A96E] transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="mb-2 text-sm text-white/50"><span className="font-semibold text-white/80">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-white/30">JPEG, PNG, WebP (Max 5MB)</p>
                  </div>
                  <input type="file" className="hidden" multiple accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
              
              {uploading && <p className="text-xs text-[#C9A96E] animate-pulse text-center">Uploading secure images...</p>}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div key={img.id || img.url} className="relative group aspect-[3/4] bg-white/5 rounded-lg overflow-hidden border border-white/10">
                    <Image src={img.url || img.publicUrl} alt={img.alt_text || 'Product image'} fill className="object-cover transition-transform group-hover:scale-105" />
                    {idx === 0 && <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider">Primary</span>}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-between">
                        <button disabled={idx === 0} onClick={() => moveImage(idx, -1)} className="p-1.5 bg-white/10 rounded hover:bg-[#C9A96E] hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-white/10 disabled:hover:text-white">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button disabled={idx === images.length - 1} onClick={() => moveImage(idx, 1)} className="p-1.5 bg-white/10 rounded hover:bg-[#C9A96E] hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-white/10 disabled:hover:text-white">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                      <button onClick={() => handleDeleteImage(idx, img.object_path)} className="self-center p-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-[#0a0a0a]">
          <button onClick={onClose} className="px-6 py-2.5 text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
          {(activeTab === 'basic' || activeTab === 'variants') && (
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-8 py-2.5 disabled:opacity-50">
              {saving ? 'Saving...' : (product ? 'Save Changes' : 'Save & Continue')}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
