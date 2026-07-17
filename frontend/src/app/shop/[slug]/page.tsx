'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/layout/CartDrawer'
import { productsApi } from '@/lib/api'
import { useCart } from '@/store/cart'
import toast from 'react-hot-toast'

export default function ProductPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const { addItem, toggleCart } = useCart()

  useEffect(() => {
    if (!slug) return
    productsApi.get(slug as string)
      .then((r: any) => { setProduct(r.data); if (r.data?.inventory?.length > 0) setSelectedSize(r.data.inventory[0].size) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

  const handleAddToCart = () => {
    if (!product) return
    if (product.has_sizes && !selectedSize) { toast.error('Please select a size'); return }
    const sizeStock = product.inventory?.find((i: any) => i.size === selectedSize)
    if (sizeStock && sizeStock.stock_quantity === 0) { toast.error('Out of stock in this size'); return }
    const primaryImg = product.images?.find((i: any) => i.is_primary)?.image_url || product.images?.[0]?.image_url || ''
    const selectedVariant = sizeStock || product.inventory?.[0]
    if (!selectedVariant?.variant_id) { toast.error('This product is not available'); return }
    addItem({
      id: product.id,
      variant_id: selectedVariant.variant_id,
      name: product.name,
      price: selectedVariant.price,
      size: selectedVariant.size || selectedSize || 'OS',
      image: primaryImg,
      quantity: 1,
      sku: selectedVariant.sku,
    })
    toast.success('Added to cart')
    toggleCart()
  }

  if (loading) return (
    <main className="site-shell">
      <Navbar />
      <div className="pt-32 max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12">
        <div className="aspect-square skeleton" />
        <div className="space-y-4 pt-8">
          <div className="h-4 skeleton w-1/3" />
          <div className="h-10 skeleton w-2/3" />
          <div className="h-6 skeleton w-1/4" />
        </div>
      </div>
    </main>
  )

  if (!product) return (
    <main className="site-shell flex items-center justify-center">
      <Navbar />
      <p className="text-white/30">Product not found</p>
    </main>
  )

  const isSoldOut = product.status === 'sold_out' || product.total_stock === 0

  return (
    <main className="site-shell">
      <Navbar />
      <CartDrawer />

      <div className="site-container detail-layout">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <div className="space-y-3">
            <motion.div
              key={activeImage}
              initial={false}
              animate={{ opacity: 1 }}
              className="neo-surface aspect-[4/5] overflow-hidden relative"
            >
              {product.images?.[activeImage]?.image_url ? (
                <Image src={product.images[activeImage].image_url} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <Image src="/logo.png" alt="7SS Logo" width={200} height={200} className="brand-logo h-[40%] w-[40%] object-contain opacity-20" />
                </div>
              )}
            </motion.div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img: any, i: number) => (
                  <button key={i} onClick={() => setActiveImage(i)} aria-label={`View product image ${i + 1}`} aria-pressed={i === activeImage}
                    className={`product-thumbnail neo-surface-sm ${i === activeImage ? 'is-active' : ''}`}>
                    {img.image_url ? <Image src={img.image_url} alt="" width={64} height={80} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#111010]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="product-detail__info neo-panel">
            {product.category_name && <p className="neo-kicker mb-4">{product.category_name}</p>}
            <h1 className="neo-heading mb-4 text-[clamp(2rem,3.5vw,3.8rem)]">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-8">
              <span className="text-white text-2xl font-medium">{fmt(product.price)}</span>
              {product.compare_price > product.price && (
                <span className="text-white/30 text-lg line-through">{fmt(product.compare_price)}</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-white/50 text-sm leading-relaxed mb-8 border-t border-white/[0.06] pt-6">{product.description}</p>
            )}

            {/* Size selector */}
            {product.has_sizes && product.inventory?.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/50 text-xs tracking-widest uppercase">Size</p>
                  {selectedSize && <p className="text-white/30 text-xs tracking-wider">{selectedSize}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.inventory.map((inv: any) => {
                    const outOfStock = inv.stock_quantity === 0
                    return (
                      <button key={inv.size} onClick={() => !outOfStock && setSelectedSize(inv.size)} disabled={outOfStock}
                        className={`filter-chip ${selectedSize === inv.size ? 'is-active' : ''} ${outOfStock ? 'is-disabled line-through' : ''}`}>
                        {inv.size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Status */}
            {isSoldOut ? (
              <div className="neo-inset py-4 text-center text-white/30 text-xs tracking-widest uppercase mb-4">
                Sold Out
              </div>
            ) : (
              <button onClick={handleAddToCart}
                className="btn-primary w-full mb-4">
                Add to Cart
              </button>
            )}

            {/* Meta */}
            <div className="border-t border-white/[0.06] pt-6 space-y-2">
              <p className="text-white/20 text-xs tracking-wider">SKU: {product.sku}</p>
              {product.total_stock > 0 && product.total_stock <= 10 && (
                <p className="text-[#C9A96E] text-xs tracking-wider">Only {product.total_stock} left</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
