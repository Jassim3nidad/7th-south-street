import { handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { user, profile } = await requireAdmin()
    return success({
      id: user.id,
      name: profile?.full_name || user.email || 'Admin',
      email: profile?.email || user.email,
      role: 'admin',
    })
  } catch (error) {
    return handleRouteError(error, 'Unable to verify session')
  }
}
