import { mapEvent } from '@/lib/catalog'
import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type EventStatus = Database['public']['Enums']['event_status']
const eventStatuses: EventStatus[] = ['upcoming', 'ongoing', 'past', 'cancelled']

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    let query = supabase
      .from('events')
      .select('*,event_gallery(*)')
      .order('event_date')
    const status = searchParams.get('status') as EventStatus | null
    if (status && eventStatuses.includes(status)) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return success((data ?? []).map(mapEvent))
  } catch (error) {
    return handleRouteError(error, 'Unable to load events')
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin()
    const body = await request.json()
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    if (!title || !body?.event_date) return failure('Title and event date are required')
    const slug = (typeof body.slug === 'string' && body.slug.trim())
      || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${new Date(body.event_date).getFullYear()}`
    const { data, error } = await supabase
      .from('events')
      .insert({
        title,
        slug,
        description: body.description || null,
        event_date: body.event_date,
        end_date: body.end_date || null,
        location_name: body.location_name || null,
        location_address: body.location_address || null,
        max_rsvp: Number(body.max_rsvp ?? 0),
        status: body.status || 'upcoming',
        is_featured: Boolean(body.is_featured),
      })
      .select('id')
      .single()
    if (error) throw error
    return success(data, 'Event created', 201)
  } catch (error) {
    return handleRouteError(error, 'Unable to create event')
  }
}
