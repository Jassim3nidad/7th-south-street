import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const { supabase } = await requireAdmin()
    if (!/^\d+$/.test(id)) return failure('Order not found', 404)
    const { data, error } = await supabase
      .from('orders')
      .select('*,order_items(*)')
      .eq('id', Number(id))
      .maybeSingle()
    if (error) throw error
    if (!data) return failure('Order not found', 404)

    return success({
      ...data,
      items: (data.order_items ?? []).map((item: Record<string, any>) => ({
        ...item,
        product_name: item.product_name_snapshot,
        sku: item.sku_snapshot,
        size: item.size_snapshot,
        color: item.color_snapshot,
        unit_price: item.unit_price_snapshot,
        subtotal: item.line_total,
      })),
    })
  } catch (error) {
    return handleRouteError(error, 'Unable to load order')
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const { supabase } = await requireAdmin()
    if (!/^\d+$/.test(id)) return failure('Order not found', 404)
    const body = await request.json()
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    const validPaymentStatuses = ['unpaid', 'paid', 'refunded']
    
    const status = body.status || null
    if (status && !validStatuses.includes(status)) return failure('Invalid order status', 400)
    
    const paymentStatus = body.payment_status || null
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) return failure('Invalid payment status', 400)

    const { error } = await supabase.rpc('admin_update_order', {
      p_order_id: Number(id),
      p_status: status,
      p_payment_status: paymentStatus,
      p_payment_reference: body.payment_reference || null,
      p_notes: body.notes || null,
    })
    if (error) throw error
    return success(null, 'Order updated')
  } catch (error) {
    return handleRouteError(error, 'Unable to update order')
  }
}
