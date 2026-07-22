import { handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin()
    const { searchParams } = new URL(request.url)
    let query = supabase
      .from('product_variants')
      .select('id,product_id,sku,size,color,stock_quantity,low_stock_threshold,is_active,products!inner(name)')
      .order('product_id')
      .order('id')
    if (searchParams.has('low_stock')) {
      // PostgREST cannot compare two columns in a filter, so filter the small admin result below.
    }
    const { data, error } = await query
    if (error) throw error

    let items = (data ?? []).map((item) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products
      return {
        ...item,
        product_name: product?.name ?? '',
        product_sku: item.sku,
      }
    })
    
    const search = searchParams.get('search')?.toLowerCase()
    if (search) {
      items = items.filter(i => i.product_name.toLowerCase().includes(search) || i.product_sku.toLowerCase().includes(search))
    }
    const filtered = searchParams.has('low_stock')
      ? items.filter((item) => item.stock_quantity <= item.low_stock_threshold)
      : items
    return success(filtered)
  } catch (error) {
    return handleRouteError(error, 'Unable to load inventory')
  }
}
