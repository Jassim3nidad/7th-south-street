import { handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin()
    const searchParams = new URL(request.url).searchParams
    const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
    const search = searchParams.get('search')
    const perPage = 20
    
    let query = supabase
      .from('customers')
      .select('id,first_name,last_name,email,phone,created_at,user_id', { count: 'exact' })
      
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)
    if (error) throw error
    const total = count ?? 0
    return success(data ?? [], 'OK', 200, {
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.max(1, Math.ceil(total / perPage)),
    })
  } catch (error) {
    return handleRouteError(error, 'Unable to load customers')
  }
}
