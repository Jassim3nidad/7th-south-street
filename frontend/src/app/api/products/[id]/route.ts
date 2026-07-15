import { fetchProduct } from '@/lib/data'
import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const product = await fetchProduct(supabase, decodeURIComponent(id))
    return product ? success(product) : failure('Product not found', 404)
  } catch (error) {
    return handleRouteError(error, 'Unable to load product')
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const { supabase } = await requireAdmin()
    if (!/^\d+$/.test(id)) return failure('Product not found', 404)
    const body = await request.json()
    const { data, error } = await supabase.rpc('admin_save_product', {
      p_product_id: Number(id),
      p_product: body,
    })
    if (error) throw error
    return success(data, 'Product updated')
  } catch (error) {
    return handleRouteError(error, 'Unable to update product')
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const { supabase } = await requireAdmin()
    if (!/^\d+$/.test(id)) return failure('Product not found', 404)
    const { error } = await supabase.rpc('admin_delete_product', {
      p_product_id: Number(id),
    })
    if (error) throw error
    return success(null, 'Product deleted')
  } catch (error) {
    return handleRouteError(error, 'Unable to delete product')
  }
}
