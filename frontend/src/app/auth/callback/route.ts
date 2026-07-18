import { NextResponse } from 'next/server'
import { getSafeReturnPath } from '@/lib/auth/customer-auth'
import { clearRecoveryIntentCookie, setRecoveryIntentCookie } from '@/lib/auth/recovery-intent'
import { createClient } from '@/lib/supabase/server'

const supportedOtpTypes = new Set([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
] as const)

type SupportedOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'

function errorRedirect(origin: string, recoveryFlow: boolean) {
  const path = recoveryFlow ? '/reset-password' : '/login'
  const redirectUrl = new URL(path, origin)
  redirectUrl.searchParams.set('error', 'invalid_or_expired_link')
  return clearRecoveryIntentCookie(NextResponse.redirect(redirectUrl))
}

function successRedirect(origin: string, nextPath: string, recoveryUserId?: string) {
  const destination = recoveryUserId ? '/reset-password' : nextPath
  const response = NextResponse.redirect(new URL(destination, origin))

  return recoveryUserId
    ? setRecoveryIntentCookie(response, recoveryUserId)
    : clearRecoveryIntentCookie(response)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const requestedType = requestUrl.searchParams.get('type')
  const otpType = requestedType && supportedOtpTypes.has(requestedType as SupportedOtpType)
    ? requestedType as SupportedOtpType
    : null
  const requestedPath = requestUrl.searchParams.get('next')
  const recoveryFlow = otpType === 'recovery' || requestedPath?.startsWith('/reset-password') === true
  const nextPath = getSafeReturnPath(requestedPath, recoveryFlow ? '/reset-password' : '/account')

  if (
    requestUrl.searchParams.has('error')
    || requestUrl.searchParams.has('error_code')
    || requestUrl.searchParams.has('error_description')
  ) {
    return errorRedirect(requestUrl.origin, recoveryFlow)
  }

  const supabase = await createClient()

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // auth-js returns redirectType at runtime for PKCE exchanges, although the
      // public AuthTokenResponse type currently omits it.
      const isRecoveryExchange = otpType === 'recovery'
        || ('redirectType' in data && data.redirectType === 'recovery')
      const recoveryUserId = isRecoveryExchange ? data.user?.id : undefined
      return successRedirect(requestUrl.origin, nextPath, recoveryUserId)
    }
  }

  if (tokenHash && otpType) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType })
    if (!error) {
      const recoveryUserId = otpType === 'recovery' ? data.user?.id : undefined
      return successRedirect(requestUrl.origin, nextPath, recoveryUserId)
    }
  }

  return errorRedirect(requestUrl.origin, recoveryFlow)
}
