import { handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin()
    const page = Math.max(1, Number(new URL(request.url).searchParams.get('page') ?? 1) || 1)
    const perPage = 20
    const { data, error, count } = await supabase
      .from('newsletter_subscribers')
      .select('id,email,name,source,is_active,consent_recorded_at,subscribed_at,unsubscribed_at', { count: 'exact' })
      .order('subscribed_at', { ascending: false })
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
    return handleRouteError(error, 'Unable to load subscribers')
  }
}
