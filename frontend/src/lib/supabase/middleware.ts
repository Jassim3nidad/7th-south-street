import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSafeReturnPath } from '@/lib/auth/customer-auth'
import { SUPABASE_COOKIE_OPTIONS } from './cookie-options'
import type { Database } from '@/types/database'

function isRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function redirectWithSessionCookies(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url)
  response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie))
  return redirect
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const { data, error } = await supabase.auth.getClaims()
  const pathname = request.nextUrl.pathname
  const userId = !error && typeof data?.claims?.sub === 'string' ? data.claims.sub : null
  const isProtectedAdminPath = pathname.startsWith('/admin/')
  const isProtectedCustomerPath = isRoute(pathname, '/account')
  const isGuestOnlyPath = ['/login', '/create-account', '/forgot-password'].includes(pathname)

  if (isProtectedCustomerPath && !userId) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return redirectWithSessionCookies(loginUrl, response)
  }

  if (isGuestOnlyPath && userId) {
    const destination = getSafeReturnPath(request.nextUrl.searchParams.get('next'), '/account')
    return redirectWithSessionCookies(new URL(destination, request.url), response)
  }

  if (isProtectedAdminPath) {
    if (!userId) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin'
      loginUrl.search = ''
      return redirectWithSessionCookies(loginUrl, response)
    }

    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!role) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin'
      loginUrl.search = ''
      loginUrl.searchParams.set('error', 'forbidden')
      return redirectWithSessionCookies(loginUrl, response)
    }
  }

  return response
}
