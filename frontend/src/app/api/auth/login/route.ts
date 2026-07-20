import { failure, handleRouteError, success } from '@/lib/http'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!email || !password) return failure('Email and password are required')

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) return failure('Invalid credentials', 401)

    const [{ data: role }, { data: profile }] = await Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name,email')
        .eq('id', data.user.id)
        .maybeSingle(),
    ])

    if (!role) {
      await supabase.auth.signOut()
      return failure('Administrator access required', 403)
    }

    return success({
      token: 'cookie-session',
      admin: {
        id: data.user.id,
        name: profile?.full_name || data.user.email || 'Admin',
        email: profile?.email || data.user.email,
        role: 'admin',
      },
    }, 'Login successful')
  } catch (error) {
    return handleRouteError(error, 'Unable to sign in')
  }
}
