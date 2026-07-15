type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function asRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : []
}

function publicStorageUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl || !path) return ''
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `${baseUrl}/storage/v1/object/public/product-images/${encodedPath}`
}

export function mapProduct(row: unknown) {
  const product = asRecord(row)
  const category = asRecord(product.categories)
  const variants = asRecords(product.product_variants)
    .sort((a, b) => Number(a.id) - Number(b.id))
  const images = asRecords(product.product_images)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((image) => ({
      ...image,
      image_url: publicStorageUrl(String(image.object_path ?? '')),
    })) as Array<JsonRecord & { image_url: string }>
  const primaryVariant = variants.find((variant) => variant.is_active !== false) ?? variants[0]
  const primaryImage = images.find((image) => image.is_primary) ?? images[0]

  return {
    ...product,
    category_name: category.name ?? null,
    category_slug: category.slug ?? null,
    sku: primaryVariant?.sku ?? '',
    price: Number(primaryVariant?.price ?? 0),
    compare_price: primaryVariant?.compare_at_price == null
      ? null
      : Number(primaryVariant.compare_at_price),
    total_stock: variants.reduce((total, variant) => total + Number(variant.stock_quantity ?? 0), 0),
    primary_image: primaryImage?.image_url ?? null,
    images,
    inventory: variants.map((variant) => ({
      id: Number(variant.id),
      variant_id: Number(variant.id),
      sku: String(variant.sku ?? ''),
      size: String(variant.size ?? 'OS'),
      color: String(variant.color ?? ''),
      price: Number(variant.price ?? 0),
      compare_price: variant.compare_at_price == null ? null : Number(variant.compare_at_price),
      stock_quantity: Number(variant.stock_quantity ?? 0),
      low_stock_threshold: Number(variant.low_stock_threshold ?? 0),
      is_active: variant.is_active !== false,
    })),
  }
}

export function mapEvent(row: unknown) {
  const event = asRecord(row)
  const gallery = asRecords(event.event_gallery)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((image) => ({
      ...image,
      image_url: publicStorageUrl(String(image.object_path ?? '')),
    }))

  return {
    ...event,
    poster_url: event.poster_object_path
      ? publicStorageUrl(String(event.poster_object_path))
      : null,
    gallery,
  }
}
