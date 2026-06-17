'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/layout/CartDrawer'
import ProductCard from '@/components/shop/ProductCard'
import { productsApi, categoriesApi } from '@/lib/api'

function ShopContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    categoriesApi.list().then((r: any) => setCategories(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = { page: page.toString(), per_page: '12' }
    if (category) params.category = category
    if (search) params.search = search
    productsApi.list(params)
      .then((r: any) => { setProducts(r.data || []); setMeta(r.meta) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category, search, page])

  const setFilter = (cat: string) => {
    const params = new URLSearchParams()
    if (cat) params.set('category', cat)
    if (search) params.set('search', search)
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <main className="bg-[#080808] min-h-screen">
      <Navbar />
      <CartDrawer />

      {/* Header */}
      <div className="pt-32 pb-12 px-6 lg:px-12 max-w-7xl mx-auto border-b border-white/[0.06]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[#C9A96E] text-xs tracking-[0.4em] uppercase mb-3">Store</p>
          <h1 className="text-white font-light" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px, 6vw, 80px)', letterSpacing: '-0.02em' }}>
            All Products
          </h1>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          <button onClick={() => setFilter('')}
            className={`flex-shrink-0 px-5 py-2 text-xs tracking-widest uppercase border transition-all duration-200 ${!category ? 'border-white/40 text-white' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}>
            All
          </button>
          {categories.map((cat: any) => (
            <button key={cat.id} onClick={() => setFilter(cat.slug)}
              className={`flex-shrink-0 px-5 py-2 text-xs tracking-widest uppercase border transition-all duration-200 ${category === cat.slug ? 'border-white/40 text-white' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-10 max-w-sm">
          <input
            type="text"
            defaultValue={search}
            placeholder="Search products..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value
                const params = new URLSearchParams()
                if (category) params.set('category', category)
                if (val) params.set('search', val)
                router.push(`/shop?${params.toString()}`)
              }
            }}
            className="w-full bg-white/[0.04] border border-white/10 px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#C9A96E]/40"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] skeleton" />
                <div className="h-3 skeleton w-3/4" />
                <div className="h-3 skeleton w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <p className="text-white/20 text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>No products found</p>
            <button onClick={() => setFilter('')} className="text-[#C9A96E] text-xs tracking-widest uppercase hover:text-white transition-colors">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex justify-center gap-2 mt-16">
                {[...Array(meta.last_page)].map((_, i) => (
                  <button key={i} onClick={() => {
                    const params = new URLSearchParams()
                    if (category) params.set('category', category)
                    if (search) params.set('search', search)
                    params.set('page', String(i + 1))
                    router.push(`/shop?${params.toString()}`)
                  }}
                    className={`w-9 h-9 text-xs border transition-all ${page === i + 1 ? 'border-white/40 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  )
}

export default function ShopPage() {
  return <Suspense><ShopContent /></Suspense>
}
