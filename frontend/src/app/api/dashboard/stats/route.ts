import { handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { supabase } = await requireAdmin()
    const { data, error } = await supabase.rpc('admin_dashboard_stats')
    if (error) throw error
    return success(data)
  } catch (error) {
    return handleRouteError(error, 'Unable to load dashboard statistics')
  }
}
