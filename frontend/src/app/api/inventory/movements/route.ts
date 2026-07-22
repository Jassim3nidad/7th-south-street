import { handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin()
    const { searchParams } = new URL(request.url)
    
    const variantId = searchParams.get('variant_id')
    const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get('per_page') ?? 20) || 20))

    let query = supabase
      .from('inventory_movements')
      .select('*, product_variants(sku)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)
      
    if (variantId) {
      query = query.eq('variant_id', Number(variantId))
    }

    const { data: movements, error, count } = await query
    if (error) throw error
    
    // Extract unique user IDs
    const userIds = Array.from(new Set((movements || []).map(m => m.actor_user_id).filter(Boolean))) as string[]
    
    // Fetch users (only possible because requireAdmin returns the service_role client)
    const usersMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
      if (!usersError && usersData?.users) {
        usersData.users.forEach(u => {
          if (userIds.includes(u.id)) {
            usersMap[u.id] = u.email || 'Unknown Admin'
          }
        })
      }
    }

    const items = (movements || []).map(m => ({
      ...m,
      actor_email: m.actor_user_id ? (usersMap[m.actor_user_id] || 'Unknown') : 'System',
      sku: (m.product_variants as any)?.sku || 'Unknown'
    }))

    const total = count ?? 0
    return success(items, 'OK', 200, {
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.max(1, Math.ceil(total / perPage)),
    })
  } catch (error) {
    return handleRouteError(error, 'Unable to load inventory movements')
  }
}
