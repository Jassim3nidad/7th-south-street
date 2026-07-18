import { NextResponse } from 'next/server'
import { clearRecoveryIntentCookie } from '@/lib/auth/recovery-intent'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  const wantsJson = request.headers.get('accept')?.includes('application/json') === true

  if (error) {
    if (wantsJson) {
      return clearRecoveryIntentCookie(
        NextResponse.json({ error: 'Unable to sign out. Please try again.' }, { status: 503 }),
      )
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'logout_failed')
    return clearRecoveryIntentCookie(NextResponse.redirect(loginUrl, 303))
  }

  if (wantsJson) {
    return clearRecoveryIntentCookie(NextResponse.json({ success: true }))
  }

  return clearRecoveryIntentCookie(NextResponse.redirect(new URL('/', request.url), 303))
}
