import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import WishlistRemoveButton from '@/components/account/WishlistRemoveButton'

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'Products you\'ve saved for later.',
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount)

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  let wishlistItems: Array<{
    product_id: number
    product_name: string
    product_slug: string
    min_price: number | null
    image_path: string | null
    product_status: string
  }> = []

  if (customer?.id) {
    const { data: rows } = await supabase
      .from('wishlists')
      .select('product_id, added_at')
      .eq('customer_id', customer.id)
      .order('added_at', { ascending: false })

    if (rows && rows.length > 0) {
      const productIds = rows.map(r => r.product_id)
      const { data: products } = await supabase
        .from('products')
        .select('id,name,slug,status')
        .in('id', productIds)

      const { data: variants } = await supabase
        .from('product_variants')
        .select('product_id,price')
        .in('product_id', productIds)
        .eq('is_active', true)

      const { data: images } = await supabase
        .from('product_images')
        .select('product_id,object_path')
        .in('product_id', productIds)
        .eq('is_primary', true)

      wishlistItems = (products ?? []).map(p => {
        const pVariants = (variants ?? []).filter(v => v.product_id === p.id)
        const minPrice = pVariants.length > 0 ? Math.min(...pVariants.map(v => Number(v.price))) : null
        const img = (images ?? []).find(i => i.product_id === p.id)
        return {
          product_id: p.id,
          product_name: p.name,
          product_slug: p.slug,
          min_price: minPrice,
          image_path: img?.object_path ?? null,
          product_status: p.status,
        }
      })
    }
  }

  return (
    <div className="account-section">
      <header className="account-section__header">
        <p className="neo-kicker">Saved Items</p>
        <h1 className="account-section__title">My Wishlist</h1>
        <p className="account-section__subtitle">{wishlistItems.length} saved {wishlistItems.length === 1 ? 'item' : 'items'}.</p>
      </header>

      {!customer?.id || wishlistItems.length === 0 ? (
        <div className="account-empty-state neo-inset">
          <p className="account-empty-state__heading">Your wishlist is empty</p>
          <p className="account-empty-state__body">Save items from the shop to find them here later.</p>
          <Link href="/shop" className="btn-primary">Browse the Collection</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map(item => (
            <div key={item.product_id} className="wishlist-card neo-surface">
              <Link href={`/shop/${item.product_slug}`} className="wishlist-card__image-wrap" tabIndex={-1} aria-hidden="true">
                {item.image_path ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${item.image_path}`}
                    alt={item.product_name}
                    className="wishlist-card__image"
                    loading="lazy"
                  />
                ) : (
                  <div className="wishlist-card__placeholder" aria-hidden="true" />
                )}
              </Link>
              <div className="wishlist-card__body">
                <Link href={`/shop/${item.product_slug}`} className="wishlist-card__name">
                  {item.product_name}
                </Link>
                {item.min_price !== null && (
                  <p className="wishlist-card__price">{formatCurrency(item.min_price)}</p>
                )}
                <div className="wishlist-card__actions">
                  <Link href={`/shop/${item.product_slug}`} className="btn-primary wishlist-card__cta">
                    {item.product_status === 'available' ? 'Shop Now' : item.product_status.replace('_', ' ')}
                  </Link>
                  <WishlistRemoveButton productId={item.product_id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
