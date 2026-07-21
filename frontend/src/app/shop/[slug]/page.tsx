import { notFound } from "next/navigation"
import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { fetchProduct, fetchRelatedProducts } from "@/lib/data"
import ProductDetailClient from "@/components/storefront/catalog/ProductDetailClient"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const product: any = await fetchProduct(supabase, decodeURIComponent(slug))

  if (!product) return { title: "Product Not Found" }

  return {
    title: `${product.name} | 7TH SOUTH STREET`,
    description: product.description || product.meta_description || "Nonchalant Luxury. Underground Culture.",
    openGraph: {
      title: product.name,
      description: product.description || "Nonchalant Luxury. Underground Culture.",
      images: product.primary_image ? [product.primary_image] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  
  const product: any = await fetchProduct(supabase, decodeURIComponent(slug))
  if (!product) {
    notFound()
  }

  // Check wishlist status securely
  let initialSaved = false
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (customer) {
      const { data: wishlist } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("customer_id", customer.id)
        .eq("product_id", product.id)
        .maybeSingle()
      
      if (wishlist) initialSaved = true
    }
  }

  // Fetch related products from the same category
  const relatedProducts = await fetchRelatedProducts(
    supabase,
    product.category_id || null,
    product.id,
    4
  )

  return (
    <ProductDetailClient
      product={product}
      initialSaved={initialSaved}
      relatedProducts={relatedProducts}
    />
  )
}
