import { NextRequest } from 'next/server'
import { handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const { supabase } = await requireAdmin()
    const { data, error } = await supabase.rpc('admin_dashboard_stats', {
      p_start_date: from || undefined,
      p_end_date: to || undefined
    })
    
    if (error) throw error
    return success(data)
  } catch (error) {
    return handleRouteError(error, 'Unable to load dashboard statistics')
  }
}
