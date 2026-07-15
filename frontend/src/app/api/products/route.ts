import { mapProduct } from '@/lib/catalog'
import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type ProductStatus = Database['public']['Enums']['product_status']
const productStatuses: ProductStatus[] = ['available', 'sold_out', 'archived', 'coming_soon']

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
    const perPage = Math.min(50, Math.max(1, Number(searchParams.get('per_page') ?? 12) || 12))
    const category = searchParams.get('category')
    const categorySelection = category ? 'categories!inner(name,slug)' : 'categories(name,slug)'

    let query = supabase
      .from('products')
      .select(`*,${categorySelection},product_variants(*),product_images(*)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    if (category) query = query.eq('categories.slug', category)
    if (searchParams.has('featured')) query = query.eq('is_featured', true)
    const status = searchParams.get('status') as ProductStatus | null
    if (status && productStatuses.includes(status)) query = query.eq('status', status)
    if (searchParams.get('search')) query = query.ilike('name', `%${searchParams.get('search')!.trim()}%`)

    const { data, error, count } = await query
    if (error) throw error

    const total = count ?? 0
    return success((data ?? []).map(mapProduct), 'OK', 200, {
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.max(1, Math.ceil(total / perPage)),
    })
  } catch (error) {
    return handleRouteError(error, 'Unable to load products')
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin()
    const body = await request.json()
    if (!body || typeof body !== 'object') return failure('Product details are required')

    const { data, error } = await supabase.rpc('admin_create_product', {
      p_product: body,
    })
    if (error) throw error

    return success(data, 'Product created', 201)
  } catch (error) {
    return handleRouteError(error, 'Unable to create product')
  }
}
