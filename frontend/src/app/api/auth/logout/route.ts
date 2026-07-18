import { failure, handleRouteError, success } from '@/lib/http'
import { clearRecoveryIntentCookie } from '@/lib/auth/recovery-intent'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return clearRecoveryIntentCookie(failure('Unable to sign out. Please try again.', 503))
    }

    return clearRecoveryIntentCookie(success(null, 'Logged out'))
  } catch (error) {
    return clearRecoveryIntentCookie(handleRouteError(error, 'Unable to sign out'))
  }
}
