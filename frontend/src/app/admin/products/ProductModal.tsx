'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="theme-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="neo-modal w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        aria-busy={saving || uploading}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border p-6">
          <div>
            <h2 id="product-modal-title" className="font-display text-2xl font-medium text-text-primary">{product ? 'Edit Product' : 'New Product'}</h2>
            {product && <p className="mt-1 font-mono text-xs text-text-muted">{product.sku}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost modal-close-button shrink-0 p-0" aria-label="Close product dialog">
            <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-border px-4 sm:px-6" role="tablist" aria-label="Product editor sections">
          <button id="product-basic-tab" role="tab" aria-selected={activeTab === 'basic'} aria-controls="product-basic-panel" onClick={() => setActiveTab('basic')} className={`min-h-11 shrink-0 rounded-t-xl px-4 py-3 text-xs uppercase tracking-widest transition-colors ${activeTab === 'basic' ? 'neo-inset rounded-b-none text-brand-accent' : 'border border-transparent text-text-muted hover:text-text-primary'}`}>Basic Info</button>
          <button id="product-variants-tab" role="tab" aria-selected={activeTab === 'variants'} aria-controls="product-variants-panel" onClick={() => setActiveTab('variants')} disabled={!form.has_sizes} className={`min-h-11 shrink-0 rounded-t-xl px-4 py-3 text-xs uppercase tracking-widest transition-colors disabled:opacity-40 ${activeTab === 'variants' ? 'neo-inset rounded-b-none text-brand-accent' : 'border border-transparent text-text-muted hover:text-text-primary'}`}>Variants & Sizes</button>
          <button id="product-images-tab" role="tab" aria-selected={activeTab === 'images'} aria-controls="product-images-panel" onClick={() => setActiveTab('images')} disabled={!product} className={`min-h-11 shrink-0 rounded-t-xl px-4 py-3 text-xs uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${activeTab === 'images' ? 'neo-inset rounded-b-none text-brand-accent' : 'border border-transparent text-text-muted hover:text-text-primary'}`} title={!product ? 'Save product first' : ''}>Images</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {activeTab === 'basic' && (
            <div id="product-basic-panel" role="tabpanel" aria-labelledby="product-basic-tab" tabIndex={0} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div><label htmlFor="product-name" className="mb-2 block text-xs uppercase tracking-widest text-text-muted">Name</label>
                <input id="product-name" required type="text" name="name" value={form.name} onChange={handleBasicChange} className="input-dark" /></div>

                <div><label htmlFor="product-sku" className="mb-2 block text-xs uppercase tracking-widest text-text-muted">Base SKU</label>
                <input id="product-sku" required type="text" name="sku" value={form.sku} onChange={handleBasicChange} className="input-dark font-mono" /></div>
              </div>

              <div><label htmlFor="product-description" className="mb-2 block text-xs uppercase tracking-widest text-text-muted">Description</label>
              <textarea id="product-description" name="description" value={form.description} onChange={handleBasicChange} rows={4} className="input-dark" /></div>

              <div className="grid md:grid-cols-3 gap-6">
                <div><label htmlFor="product-price" className="mb-2 block text-xs uppercase tracking-widest text-text-muted">Base Price (PHP)</label>
                <input id="product-price" required type="number" name="price" value={form.price} onChange={handleBasicChange} className="input-dark font-mono" /></div>

                <div><label htmlFor="product-compare-price" className="mb-2 block text-xs uppercase tracking-widest text-text-muted">Compare At (PHP)</label>
                <input id="product-compare-price" type="number" name="compare_price" value={form.compare_price} onChange={handleBasicChange} className="input-dark font-mono" /></div>

                <div><label htmlFor="product-category" className="mb-2 block text-xs uppercase tracking-widest text-text-muted">Category</label>
                <select id="product-category" name="category_id" value={form.category_id} onChange={handleBasicChange} className="input-dark appearance-none">
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              </div>

              <div className="neo-inset grid gap-2 p-3 md:grid-cols-2">
                <div className="admin-checkbox-option flex items-center gap-3 rounded-xl px-2">
                  <input type="checkbox" name="has_sizes" checked={form.has_sizes} onChange={handleBasicChange} className="h-5 w-5 rounded" id="has_sizes" />
                  <label htmlFor="has_sizes" className="cursor-pointer select-none text-sm text-text-primary">Product has variants/sizes</label>
                </div>
                <div className="admin-checkbox-option flex items-center gap-3 rounded-xl px-2">
                  <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleBasicChange} className="h-5 w-5 rounded" id="is_featured" />
                  <label htmlFor="is_featured" className="cursor-pointer select-none text-sm text-text-primary">Feature on homepage</label>
                </div>
              </div>

              <div><label htmlFor="product-status" className="mb-2 block text-xs uppercase tracking-widest text-text-muted">Status</label>
                <select id="product-status" name="status" value={form.status} onChange={handleBasicChange} className="input-dark appearance-none">
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
            <div id="product-variants-panel" role="tabpanel" aria-labelledby="product-variants-tab" tabIndex={0} className="space-y-4">
              <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-text-secondary">Define specific sizes, override prices, and track inventory for this product.</p>
                <button onClick={addVariant} className="btn-outline shrink-0 px-4">+ Add Variant</button>
              </div>

              {variants.length === 0 && (
                <div className="neo-inset border-dashed p-8 text-center text-sm text-text-muted">
                  No variants added. Base product SKU and price will be used.
                </div>
              )}

              {variants.map((v, idx) => (
                <div key={idx} className="admin-card flex flex-col items-start gap-4 p-4 md:flex-row md:items-end">
                  <div className="w-full md:w-auto flex-1">
                    <label htmlFor={`variant-size-${idx}`} className="mb-1 block text-[10px] uppercase text-text-muted">Size</label>
                    <input id={`variant-size-${idx}`} type="text" value={v.size} placeholder="e.g. OS, M, L" onChange={e => updateVariant(idx, 'size', e.target.value)} className="input-dark" />
                  </div>
                  <div className="w-full md:w-auto flex-1">
                    <label htmlFor={`variant-sku-${idx}`} className="mb-1 block text-[10px] uppercase text-text-muted">SKU Override</label>
                    <input id={`variant-sku-${idx}`} type="text" value={v.sku} placeholder={form.sku || 'SKU'} onChange={e => updateVariant(idx, 'sku', e.target.value)} className="input-dark font-mono" />
                  </div>
                  <div className="w-full md:w-24 md:flex-none">
                    <label htmlFor={`variant-stock-${idx}`} className="mb-1 block text-[10px] uppercase text-text-muted">Stock</label>
                    <input id={`variant-stock-${idx}`} type="number" value={v.stock_quantity} onChange={e => updateVariant(idx, 'stock_quantity', e.target.value)} className="input-dark font-mono" />
                  </div>
                  <div className="w-full md:w-32 md:flex-none">
                    <label htmlFor={`variant-price-${idx}`} className="mb-1 block text-[10px] uppercase text-text-muted">Price (Opt)</label>
                    <input id={`variant-price-${idx}`} type="number" value={v.price} placeholder={form.price} onChange={e => updateVariant(idx, 'price', e.target.value)} className="input-dark font-mono" />
                  </div>
                  <button onClick={() => removeVariant(idx)} className="btn-ghost admin-action-button self-end p-0 text-[var(--neo-error)]" aria-label={`Remove variant ${idx + 1}`}>
                    <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'images' && product && (
            <div id="product-images-panel" role="tabpanel" aria-labelledby="product-images-tab" tabIndex={0} className="space-y-6">
              <div className="flex items-center justify-center w-full">
                <label className={`neo-inset flex h-32 w-full flex-col items-center justify-center border-2 border-dashed transition-all focus-within:shadow-neo-focus ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-brand-accent'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="mb-3 h-8 w-8 text-text-muted" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="mb-2 text-sm text-text-secondary"><span className="font-semibold text-text-primary">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-text-muted">JPEG, PNG, WebP (Max 5MB)</p>
                  </div>
                  <input type="file" className="sr-only" multiple accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} disabled={uploading} aria-label="Upload product images" />
                </label>
              </div>
              
              {uploading && <p className="animate-pulse text-center text-xs text-brand-accent" role="status" aria-live="polite">Uploading secure images...</p>}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div key={img.id || img.url} className="admin-card group relative aspect-[3/4] overflow-hidden">
                    <Image src={img.url || img.publicUrl} alt={img.alt_text || 'Product image'} fill className="object-cover transition-transform group-hover:scale-105" />
                    {idx === 0 && <span className="order-status-badge status-confirmed absolute left-2 top-2">Primary</span>}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-between">
                        <button disabled={idx === 0} onClick={() => moveImage(idx, -1)} className="btn-outline admin-action-button p-0" aria-label={`Move image ${idx + 1} left`}>
                           <svg className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button disabled={idx === images.length - 1} onClick={() => moveImage(idx, 1)} className="btn-outline admin-action-button p-0" aria-label={`Move image ${idx + 1} right`}>
                           <svg className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                      <button onClick={() => handleDeleteImage(idx, img.object_path)} className="btn-ghost admin-action-button self-center bg-[var(--neo-error-soft)] p-0 text-[var(--neo-error)]" aria-label={`Delete image ${idx + 1}`}>
                        <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border p-6">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          {(activeTab === 'basic' || activeTab === 'variants') && (
            <button onClick={handleSave} disabled={saving} className="btn-primary px-8" aria-busy={saving}>
              {saving ? 'Saving...' : (product ? 'Save Changes' : 'Save & Continue')}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
