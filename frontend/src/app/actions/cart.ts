'use server'

import { createClient } from '@/lib/supabase/server'
import { CartItem } from '@/store/cart'

export type ValidationResult = {
  validItems: CartItem[]
  conflicts: string[]
}

export async function validateCartItems(clientItems: CartItem[]): Promise<ValidationResult> {
  if (!clientItems || clientItems.length === 0) {
    return { validItems: [], conflicts: [] }
  }

  const supabase = await createClient()
  const conflicts: string[] = []
  const validItems: CartItem[] = []

  // Extract variant IDs to query
  const variantIds = clientItems.map((item) => item.variant_id)

  // Query variants and their associated products in a single call
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select(`
      id,
      product_id,
      price,
      stock_quantity,
      is_active,
      sku,
      products!inner (
        id,
        name,
        status,
        images:product_images(object_path, is_primary)
      )
    `)
    .in('id', variantIds)

  if (error || !variants) {
    console.error('Failed to validate cart items:', error)
    return { validItems: [], conflicts: ['Failed to validate cart items. Please try again.'] }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const publicStorageUrl = (path: string) => {
    if (!path) return ''
    const encodedPath = path.split('/').map(encodeURIComponent).join('/')
    return `${baseUrl}/storage/v1/object/public/product-images/${encodedPath}`
  }

  for (const clientItem of clientItems) {
    // Note: Due to typing of products in the join, we cast appropriately
    const variantData = variants.find((v) => v.id === clientItem.variant_id) as any

    if (!variantData) {
      conflicts.push(`${clientItem.name} is no longer available.`)
      continue
    }

    const product = variantData.products

    if (product.status !== 'available' || !variantData.is_active) {
      conflicts.push(`${product.name} is no longer available.`)
      continue
    }

    const serverPrice = Number(variantData.price)
    if (serverPrice !== clientItem.price) {
      conflicts.push(`The price of ${product.name} has changed from ₱${clientItem.price} to ₱${serverPrice}.`)
    }

    const availableStock = Number(variantData.stock_quantity)
    if (availableStock === 0) {
      conflicts.push(`${product.name} (Size: ${clientItem.size}) is out of stock.`)
      continue
    }

    let finalQuantity = clientItem.quantity
    if (clientItem.quantity > availableStock) {
      conflicts.push(`Only ${availableStock} left for ${product.name} (Size: ${clientItem.size}). Quantity adjusted.`)
      finalQuantity = availableStock
    }

    // Get primary image from the join
    const primaryImgObj = product.images?.find((img: any) => img.is_primary) || product.images?.[0]
    const primaryImage = primaryImgObj?.object_path ? publicStorageUrl(primaryImgObj.object_path) : clientItem.image

    validItems.push({
      ...clientItem,
      price: serverPrice,
      quantity: finalQuantity,
      image: primaryImage,
      sku: variantData.sku || clientItem.sku,
    })
  }

  return { validItems, conflicts }
}
