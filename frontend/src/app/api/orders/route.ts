import { randomUUID } from 'crypto'
import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type OrderStatus = Database['public']['Enums']['order_status']
const orderStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

type SubmittedItem = {
  variant_id?: unknown
  product_id?: unknown
  size?: unknown
  color?: unknown
  quantity?: unknown
}

async function resolveVariantId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  item: SubmittedItem,
) {
  if (Number.isInteger(Number(item.variant_id)) && Number(item.variant_id) > 0) {
    return Number(item.variant_id)
  }

  const productId = Number(item.product_id)
  if (!Number.isInteger(productId) || productId < 1) return null

  let query = supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId)
    .eq('size', typeof item.size === 'string' && item.size ? item.size : 'OS')
    .eq('is_active', true)
    .order('id')
    .limit(1)

  if (typeof item.color === 'string') query = query.eq('color', item.color)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data?.id ? Number(data.id) : null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return failure('Order items are required')
    }

    const supabase = await createClient()
    const items = []
    for (const submitted of body.items as SubmittedItem[]) {
      const variantId = await resolveVariantId(supabase, submitted)
      const quantity = Number(submitted.quantity)
      if (!variantId || !Number.isInteger(quantity) || quantity < 1) {
        return failure('Every item requires a valid variant and quantity')
      }
      items.push({ variant_id: variantId, quantity })
    }

    const idempotencyKey = body.idempotency_key || randomUUID()

    const { data, error } = await supabase.rpc('create_order', {
      p_items: items,
      p_customer_information: {
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.shipping_email,
      },
      p_shipping_information: {
        name: body.shipping_name,
        email: body.shipping_email,
        phone: body.shipping_phone,
        address: body.shipping_address,
        city: body.shipping_city,
        province: body.shipping_province,
        postal: body.shipping_postal,
        country: body.shipping_country || 'Philippines',
      },
      p_payment_method: body.payment_method || 'cod',
      p_notes: body.notes || null,
      p_idempotency_key: idempotencyKey,
    })
    if (error) throw error

    return success({ ...(data as Record<string, unknown>), tracking_key: idempotencyKey }, 'Order placed', 201)
  } catch (error) {
    return handleRouteError(error, 'Unable to place order')
  }
}

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
    const perPage = 20
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)
    const status = searchParams.get('status') as OrderStatus | null
    if (status && orderStatuses.includes(status)) query = query.eq('status', status)
    const { data, error, count } = await query
    if (error) throw error

    const total = count ?? 0
    return success(data ?? [], 'OK', 200, {
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.max(1, Math.ceil(total / perPage)),
    })
  } catch (error) {
    return handleRouteError(error, 'Unable to load orders')
  }
}
