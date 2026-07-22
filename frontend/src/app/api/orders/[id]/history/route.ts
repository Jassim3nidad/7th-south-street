import { handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const { supabase } = await requireAdmin()
    
    if (!/^\d+$/.test(id)) return success([])

    const { data: history, error } = await (supabase as any)
      .from('order_status_history')
      .select('*')
      .eq('order_id', Number(id))
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Extract unique user IDs
    const userIds = Array.from(new Set((history || []).map((h: any) => h.created_by).filter(Boolean))) as string[]
    
    // Fetch users mapping
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

    const items = (history || []).map((h: any) => ({
      ...h,
      actor_email: h.created_by ? (usersMap[h.created_by] || 'Unknown Admin') : 'System'
    }))

    return success(items)
  } catch (error) {
    return handleRouteError(error, 'Unable to load order history')
  }
}
