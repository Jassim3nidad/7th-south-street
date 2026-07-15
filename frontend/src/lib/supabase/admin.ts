import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from './server'
import type { Database } from '@/types/database'

export class AuthorizationError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthorizationError'
    this.status = status
  }
}

export type AdminContext = {
  supabase: SupabaseClient<Database>
  user: User
  profile: { full_name: string | null; email: string | null } | null
}

export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new AuthorizationError('Authentication required', 401)
  }

  const [{ data: role }, { data: profile }] = await Promise.all([
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('full_name,email')
      .eq('id', userData.user.id)
      .maybeSingle(),
  ])

  if (!role) {
    throw new AuthorizationError('Administrator access required', 403)
  }

  return { supabase, user: userData.user, profile }
}
