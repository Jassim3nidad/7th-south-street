import { handleRouteError, success } from '@/lib/http'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return success(null, 'Logged out')
  } catch (error) {
    return handleRouteError(error, 'Unable to sign out')
  }
}
