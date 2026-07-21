'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type TrackedOrder = {
  id: number
  order_number: string
  status: string
  created_at: string
  shipping_name: string
  shipping_email: string
  shipping_phone: string
  shipping_address: string
  shipping_city: string
  shipping_province: string | null
  shipping_postal: string | null
  shipping_country: string
  payment_method: string
  payment_status: string
  subtotal: number
  shipping_fee: number
  total: number
  items: Array<{
    id: number
    product_name: string
    size: string
    color: string | null
    unit_price: number
    quantity: number
    subtotal: number
  }>
}

export async function getTrackedOrder(
  orderNumber: string,
  email?: string,
  key?: string
): Promise<TrackedOrder | null> {
  try {
    // 1. Try authenticated user via RLS (normal client)
    const supabase = await createClient()
    const { data: authData } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)
      .maybeSingle()

    if (authData) {
      return formatOrderResponse(authData)
    }

    // 2. Fall back to secure guest mechanisms via service_role
    if (!email && !key) {
      return null // No auth, no email, no key -> Deny
    }

    const adminClient = createServiceClient()
    let query = adminClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)

    if (email) {
      // Track Order Page case
      query = query.ilike('shipping_email', email.trim())
    } else if (key) {
      // Immediate Post-Checkout case
      query = query.eq('idempotency_key', key)
    }

    const { data: guestData, error } = await query.maybeSingle()

    if (error || !guestData) {
      return null
    }

    return formatOrderResponse(guestData)
  } catch (error) {
    console.error('Error fetching tracked order:', error)
    return null
  }
}

function formatOrderResponse(data: any): TrackedOrder {
  return {
    id: data.id,
    order_number: data.order_number,
    status: data.status,
    created_at: data.created_at,
    shipping_name: data.shipping_name,
    shipping_email: data.shipping_email,
    shipping_phone: data.shipping_phone,
    shipping_address: data.shipping_address,
    shipping_city: data.shipping_city,
    shipping_province: data.shipping_province,
    shipping_postal: data.shipping_postal,
    shipping_country: data.shipping_country,
    payment_method: data.payment_method,
    payment_status: data.payment_status,
    subtotal: Number(data.subtotal),
    shipping_fee: Number(data.shipping_fee),
    total: Number(data.total),
    items: (data.order_items || []).map((item: any) => ({
      id: item.id,
      product_name: item.product_name_snapshot,
      size: item.size_snapshot,
      color: item.color_snapshot,
      unit_price: Number(item.unit_price_snapshot),
      quantity: item.quantity,
      subtotal: Number(item.line_total)
    }))
  }
}
