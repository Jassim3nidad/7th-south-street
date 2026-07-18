import 'server-only'
import type { NextResponse } from 'next/server'

export const RECOVERY_INTENT_COOKIE = 'customer-auth-recovery-intent'
export const RECOVERY_INTENT_MAX_AGE_SECONDS = 15 * 60

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export function setRecoveryIntentCookie(response: NextResponse, userId: string) {
  response.cookies.set({
    name: RECOVERY_INTENT_COOKIE,
    value: userId,
    ...cookieOptions,
    maxAge: RECOVERY_INTENT_MAX_AGE_SECONDS,
  })
  return response
}

export function clearRecoveryIntentCookie(response: NextResponse) {
  response.cookies.set({
    name: RECOVERY_INTENT_COOKIE,
    value: '',
    ...cookieOptions,
    maxAge: 0,
  })
  return response
}
