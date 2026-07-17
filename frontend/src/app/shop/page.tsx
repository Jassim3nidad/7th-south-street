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
    <main className="site-shell">
      <Navbar />
      <CartDrawer />

      {/* Header */}
      <div className="page-header site-container neo-surface-sm">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="neo-kicker">Store</p>
          <h1 className="neo-heading">
            All Products
          </h1>
        </motion.div>
      </div>

      <div className="site-container page-content">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          <button onClick={() => setFilter('')}
            className={`filter-chip ${!category ? 'is-active' : ''}`}>
            All
          </button>
          {categories.map((cat: any) => (
            <button key={cat.id} onClick={() => setFilter(cat.slug)}
              className={`filter-chip ${category === cat.slug ? 'is-active' : ''}`}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-10 max-w-sm">
          <label htmlFor="product-search" className="sr-only">Search products</label>
          <input
            id="product-search"
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
            className="input-dark"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="product-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] skeleton" />
                <div className="h-3 skeleton w-3/4" />
                <div className="h-3 skeleton w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="neo-state flex flex-col items-center justify-center py-24 gap-4 text-center">
            <p className="text-white/20 text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>No products found</p>
            <button onClick={() => setFilter('')} className="btn-ghost">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex justify-center gap-2 mt-16">
                {[...Array(meta.last_page)].map((_, i) => (
                  <button key={i} aria-label={`Go to page ${i + 1}`} aria-current={page === i + 1 ? 'page' : undefined} onClick={() => {
                    const params = new URLSearchParams()
                    if (category) params.set('category', category)
                    if (search) params.set('search', search)
                    params.set('page', String(i + 1))
                    router.push(`/shop?${params.toString()}`)
                  }}
                    className={`pagination-button ${page === i + 1 ? 'is-active' : ''}`}>
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
