import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
  const isProtectedAdminPath = request.nextUrl.pathname.startsWith('/admin/')

  if (isProtectedAdminPath) {
    const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null

    if (error || !userId) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin'
      loginUrl.search = ''
      return NextResponse.redirect(loginUrl)
    }

    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!role) {
      await supabase.auth.signOut()
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin'
      loginUrl.search = 'error=forbidden'
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}
