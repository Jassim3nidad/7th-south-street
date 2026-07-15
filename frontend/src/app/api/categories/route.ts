import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (error) throw error
    return success(data ?? [])
  } catch (error) {
    return handleRouteError(error, 'Unable to load categories')
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin()
    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) return failure('Category name is required')
    const slug = (typeof body.slug === 'string' && body.slug.trim())
      || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description: body.description || null,
        sort_order: Number(body.sort_order ?? 0),
      })
      .select('id')
      .single()
    if (error) throw error
    return success(data, 'Category created', 201)
  } catch (error) {
    return handleRouteError(error, 'Unable to create category')
  }
}
