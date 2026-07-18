import type { CookieOptionsWithName } from '@supabase/ssr'

export const SUPABASE_COOKIE_OPTIONS: CookieOptionsWithName = {
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}
