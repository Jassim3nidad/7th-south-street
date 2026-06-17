'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

type Product = {
  id: number
  name: string
  slug: string
  price: number
  compare_price?: number
  status: string
  category_name?: string
  primary_image?: string
  total_stock?: number
}

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n)

  const isSoldOut = product.status === 'sold_out' || (product.total_stock !== undefined && product.total_stock === 0)
  const isLowStock = !isSoldOut && product.total_stock !== undefined && product.total_stock > 0 && product.total_stock <= 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group product-card"
    >
      <Link href={`/shop/${product.slug}`} className="block">
        {/* Image container */}
        <div className="relative aspect-[3/4] bg-[#111010] border border-white/[0.05] overflow-hidden mb-4">
          {product.primary_image ? (
            <Image
              src={product.primary_image}
              alt={product.name}
              fill
              className="product-card-image object-cover"
            />
          ) : (
            <div className="product-card-image absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/logo.png" alt="7SS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.15 }} />
              </div>
              <span className="text-white/10 text-xs tracking-widest uppercase">{product.category_name}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isSoldOut && (
              <span className="px-2 py-1 bg-[#080808]/90 text-white/50 text-[9px] tracking-widest uppercase border border-white/10">
                Sold Out
              </span>
            )}
            {isLowStock && (
              <span className="px-2 py-1 bg-[#C9A96E]/10 text-[#C9A96E] text-[9px] tracking-widest uppercase border border-[#C9A96E]/30">
                Low Stock
              </span>
            )}
            {product.compare_price && product.compare_price > product.price && (
              <span className="px-2 py-1 bg-[#E63B2E]/10 text-[#E63B2E] text-[9px] tracking-widest uppercase border border-[#E63B2E]/30">
                Sale
              </span>
            )}
          </div>

          {/* Quick add overlay */}
          {!isSoldOut && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">
              <div className="bg-[#080808]/95 backdrop-blur-sm border-t border-white/10 py-3 text-center">
                <span className="text-white text-[10px] font-medium tracking-widest uppercase">View Product</span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1.5">
          {product.category_name && (
            <p className="text-white/30 text-[10px] tracking-widest uppercase">{product.category_name}</p>
          )}
          <h3 className="text-white text-sm font-medium leading-snug group-hover:text-[#C9A96E] transition-colors duration-200">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isSoldOut ? 'text-white/30' : 'text-white'}`}>
              {fmt(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-white/30 text-sm line-through">{fmt(product.compare_price)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
