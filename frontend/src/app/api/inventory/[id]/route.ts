import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const { supabase } = await requireAdmin()
    if (!/^\d+$/.test(id)) return failure('Product variant not found', 404)
    const body = await request.json()
    const stock = Number(body?.stock_quantity)
    if (!Number.isInteger(stock) || stock < 0) return failure('Stock must be a non-negative integer')
    const { data, error } = await supabase.rpc('admin_adjust_inventory', {
      p_variant_id: Number(id),
      p_stock_quantity: stock,
      p_reason: 'Admin inventory update',
    })
    if (error) throw error
    return success({ stock_quantity: data }, 'Stock updated')
  } catch (error) {
    return handleRouteError(error, 'Unable to update inventory')
  }
}
