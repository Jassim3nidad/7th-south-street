import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const { supabase } = await requireAdmin()
    if (!/^\d+$/.test(id)) return failure('Product not found', 404)
    
    const body = await request.json()
    if (!Array.isArray(body.image_ids)) return failure('image_ids must be an array')
    
    const { error } = await supabase.rpc('admin_reorder_product_images', {
      p_product_id: Number(id),
      p_image_ids: body.image_ids
    })
    
    if (error) throw error
    return success(null, 'Images reordered')
  } catch (error) {
    return handleRouteError(error, 'Unable to reorder images')
  }
}
