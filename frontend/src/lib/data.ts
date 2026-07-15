import type { SupabaseClient } from '@supabase/supabase-js'
import { mapEvent, mapProduct } from '@/lib/catalog'
import type { Database } from '@/types/database'

const productSelection = `
  *,
  categories(name,slug),
  product_variants(*),
  product_images(*)
`

const eventSelection = `
  *,
  event_gallery(*)
`

export async function fetchProduct(supabase: SupabaseClient<Database>, identifier: string) {
  let query = supabase.from('products').select(productSelection)
  query = /^\d+$/.test(identifier)
    ? query.eq('id', Number(identifier))
    : query.eq('slug', identifier)

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data ? mapProduct(data) : null
}

export async function fetchEvent(supabase: SupabaseClient<Database>, identifier: string) {
  let query = supabase.from('events').select(eventSelection)
  query = /^\d+$/.test(identifier)
    ? query.eq('id', Number(identifier))
    : query.eq('slug', identifier)

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data ? mapEvent(data) : null
}
