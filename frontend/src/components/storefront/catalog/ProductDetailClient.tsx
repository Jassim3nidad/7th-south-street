
"use client"

import { useState, useTransition, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useCart } from "@/store/cart"
import toast from "react-hot-toast"
import ProductCard from "./ProductCard"
import WishlistToggle from "@/components/account/WishlistToggle"

type Props = {
  product: any
  initialSaved: boolean
  relatedProducts: any[]
}

export default function ProductDetailClient({ product, initialSaved, relatedProducts }: Props) {
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const { addItem, toggleCart } = useCart()
  const [isStickyVisible, setIsStickyVisible] = useState(false)

  useEffect(() => {
    if (product?.inventory?.length > 0) {
      const defaultSize = product.inventory[0].size
      setSelectedSize(defaultSize)
    }
  }, [product])

  useEffect(() => {
    const handleScroll = () => {
      const mainBtn = document.getElementById("add-to-cart-main")
      if (mainBtn) {
        const rect = mainBtn.getBoundingClientRect()
        setIsStickyVisible(rect.bottom < 0)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 }).format(n)

  const isSoldOut = product.status === "sold_out" || product.total_stock === 0
  const isComingSoon = product.status === "coming_soon"
  
  const sizeStock = product.inventory?.find((i: any) => i.size === selectedSize)
  const currentStock = sizeStock ? sizeStock.stock_quantity : 0
  const outOfStockInSize = sizeStock && currentStock === 0

  const handleAddToCart = () => {
    if (!product) return
    if (product.has_sizes && !selectedSize) { toast.error("Please select a size"); return }
    if (outOfStockInSize) { toast.error("Out of stock in this size"); return }
    if (quantity > currentStock) { toast.error(`Only ${currentStock} left in stock`); return }

    const primaryImg = product.images?.find((i: any) => i.is_primary)?.image_url || product.images?.[0]?.image_url || ""
    const selectedVariant = sizeStock || product.inventory?.[0]
    
    if (!selectedVariant?.variant_id) { toast.error("This product is not available"); return }
    
    addItem({
      id: product.id,
      variant_id: selectedVariant.variant_id,
      name: product.name,
      price: selectedVariant.price,
      size: selectedVariant.size || selectedSize || "OS",
      image: primaryImg,
      quantity: quantity,
      sku: selectedVariant.sku,
    })
    toast.success("Added to cart")
    toggleCart()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url: window.location.href
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard")
    }
  }

  return (
    <main className="site-shell">
      <div className="site-container detail-layout pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <div className="space-y-3">
            <motion.div
              key={activeImage}
              initial={false}
              animate={{ opacity: 1 }}
              className="neo-surface aspect-[4/5] overflow-hidden relative"
            >
              {product.images?.[activeImage]?.image_url ? (
                <Image src={product.images[activeImage].image_url} alt={product.name} fill className="object-cover" priority />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <Image src="/logo.png" alt="7SS Logo" width={200} height={200} className="brand-logo h-[40%] w-[40%] object-contain opacity-20" />
                </div>
              )}
            </motion.div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img: any, i: number) => (
                  <button key={i} onClick={() => setActiveImage(i)} aria-label={`View product image ${i + 1}`} aria-pressed={i === activeImage}
                    className={`product-thumbnail flex-shrink-0 neo-surface-sm w-16 h-20 md:w-20 md:h-24 ${i === activeImage ? "is-active" : ""}`}>
                    {img.image_url ? <Image src={img.image_url} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-[#111010]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail__info pt-4 lg:pt-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                {product.category_name && <p className="neo-kicker mb-2">{product.category_name}</p>}
                <h1 className="neo-heading text-[clamp(2rem,3.5vw,3.8rem)]">{product.name}</h1>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button onClick={handleShare} className="p-2 hover:bg-white/5 rounded-full transition-colors" aria-label="Share">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <WishlistToggle productId={product.id} initialSaved={initialSaved} />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <span className="text-white text-2xl font-medium">{fmt(product.price)}</span>
              {product.compare_price > product.price && (
                <span className="text-white/30 text-lg line-through">{fmt(product.compare_price)}</span>
              )}
            </div>

            {product.description && (
              <div className="text-white/60 text-sm leading-relaxed mb-8 border-t border-white/[0.06] pt-6">
                {product.description.split("\n").map((para: string, idx: number) => (
                  <p key={idx} className="mb-4 last:mb-0">{para}</p>
                ))}
              </div>
            )}

            {product.has_sizes && product.inventory?.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-white/50 text-xs tracking-widest uppercase">Size</p>
                    {selectedSize && <span className="text-white text-xs">{selectedSize}</span>}
                  </div>
                  <button onClick={() => setShowSizeGuide(true)} className="text-[#C9A96E] hover:text-[#e0c28b] text-xs uppercase tracking-widest underline underline-offset-4 transition-colors">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.inventory.map((inv: any) => {
                    const outOfStock = inv.stock_quantity === 0
                    return (
                      <button key={inv.size} onClick={() => { if(!outOfStock) { setSelectedSize(inv.size); setQuantity(1); } }} disabled={outOfStock}
                        className={`filter-chip ${selectedSize === inv.size ? "is-active" : ""} ${outOfStock ? "is-disabled line-through opacity-40" : ""}`}>
                        {inv.size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {!isSoldOut && !isComingSoon && (
              <div className="mb-8">
                <p className="text-white/50 text-xs tracking-widest uppercase mb-3">Quantity</p>
                <div className="flex items-center neo-surface-sm rounded-none w-max">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-white/50 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30" disabled={quantity <= 1}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                  <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(currentStock || 99, quantity + 1))} className="px-4 py-3 text-white/50 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30" disabled={outOfStockInSize || quantity >= currentStock}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
              </div>
            )}

            <div className="mb-8" id="add-to-cart-main">
              {isComingSoon ? (
                <div className="neo-inset py-4 text-center text-white/30 text-xs tracking-widest uppercase cursor-not-allowed">
                  Coming Soon
                </div>
              ) : isSoldOut ? (
                <div className="neo-inset py-4 text-center text-white/30 text-xs tracking-widest uppercase cursor-not-allowed">
                  Sold Out
                </div>
              ) : (
                <button onClick={handleAddToCart} disabled={outOfStockInSize}
                  className={`btn-primary w-full ${outOfStockInSize ? "opacity-50 cursor-not-allowed" : ""}`}>
                  {outOfStockInSize ? "Out of Stock in Selected Size" : "Add to Cart"}
                </button>
              )}
            </div>

            <div className="border-t border-white/[0.06] pt-6 space-y-3 mb-8">
              <p className="text-white/30 text-sm flex items-center justify-between">
                <span>SKU</span>
                <span className="text-white/60 font-mono text-xs">{product.sku}</span>
              </p>
              {currentStock > 0 && currentStock <= 10 && (
                <p className="text-[#C9A96E] text-sm flex items-center justify-between">
                  <span>Stock</span>
                  <span>Only {currentStock} left</span>
                </p>
              )}
            </div>

            <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
              <details className="group">
                <summary className="flex items-center justify-between py-4 cursor-pointer list-none text-sm font-medium tracking-wide uppercase text-white/70 hover:text-white transition-colors">
                  Shipping Information
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="pb-4 text-white/50 text-sm leading-relaxed">
                  <p className="mb-2">We ship nationwide across the Philippines. Standard shipping takes 3-5 business days for Metro Manila and 5-7 business days for provincial addresses.</p>
                  <p>International shipping to select Southeast Asian countries will be available soon.</p>
                </div>
              </details>
              
              <details className="group">
                <summary className="flex items-center justify-between py-4 cursor-pointer list-none text-sm font-medium tracking-wide uppercase text-white/70 hover:text-white transition-colors">
                  Returns & Exchanges
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="pb-4 text-white/50 text-sm leading-relaxed">
                  <p>Returns are accepted within 7 days of delivery for store credit or exchange, provided items are unworn, unwashed, and in original packaging.</p>
                  <p className="mt-2 text-[#C9A96E]">Note: Pop-up exclusives and limited drops are final sale.</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {relatedProducts?.length > 0 && (
          <div className="mt-24 border-t border-white/[0.06] pt-16">
            <h2 className="neo-heading text-2xl md:text-3xl mb-8">Related Drops</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isStickyVisible && !isSoldOut && !isComingSoon && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden neo-surface-sm border-t border-white/[0.06] p-4 flex items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] bg-[#080808]/90 backdrop-blur-md"
          >
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">{fmt(product.price)}</span>
              {selectedSize && <span className="text-white/50 text-xs">Size: {selectedSize}</span>}
            </div>
            <button onClick={handleAddToCart} disabled={outOfStockInSize}
              className={`btn-primary py-2 px-8 text-sm ${outOfStockInSize ? "opacity-50" : ""}`}>
              {outOfStockInSize ? "Out of Stock" : "Add to Cart"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSizeGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSizeGuide(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="neo-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowSizeGuide(false)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              
              <h2 className="neo-heading text-2xl mb-6">Size Guide</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-white/80 font-medium mb-4 uppercase tracking-widest text-sm">Tees & Hoodies (Inches)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-white/10 text-white/50">
                          <th className="pb-3 font-medium">Size</th>
                          <th className="pb-3 font-medium">Chest</th>
                          <th className="pb-3 font-medium">Length</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/80 divide-y divide-white/5">
                        <tr><td className="py-3">Small</td><td className="py-3">18 - 20</td><td className="py-3">27</td></tr>
                        <tr><td className="py-3">Medium</td><td className="py-3">20 - 22</td><td className="py-3">28</td></tr>
                        <tr><td className="py-3">Large</td><td className="py-3">22 - 24</td><td className="py-3">29</td></tr>
                        <tr><td className="py-3">X-Large</td><td className="py-3">24 - 26</td><td className="py-3">30</td></tr>
                        <tr><td className="py-3">XX-Large</td><td className="py-3">26 - 28</td><td className="py-3">31</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-white/80 font-medium mb-4 uppercase tracking-widest text-sm">Fitted Caps</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">
                    Measure the circumference of your head where the hat will sit. Keep the tape comfortably snug. 
                    If you fall between sizes, we recommend sizing up for a relaxed fit.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-white/10 text-white/50">
                          <th className="pb-3 font-medium">Size</th>
                          <th className="pb-3 font-medium">Inches</th>
                          <th className="pb-3 font-medium">CM</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/80 divide-y divide-white/5">
                        <tr><td className="py-3">7 1/8</td><td className="py-3">22 3/8</td><td className="py-3">56.8</td></tr>
                        <tr><td className="py-3">7 1/4</td><td className="py-3">22 3/4</td><td className="py-3">57.7</td></tr>
                        <tr><td className="py-3">7 3/8</td><td className="py-3">23 1/8</td><td className="py-3">58.7</td></tr>
                        <tr><td className="py-3">7 1/2</td><td className="py-3">23 1/2</td><td className="py-3">59.6</td></tr>
                        <tr><td className="py-3">7 5/8</td><td className="py-3">23 7/8</td><td className="py-3">60.6</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

