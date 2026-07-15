import { fetchEvent } from '@/lib/data'
import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const event = await fetchEvent(supabase, decodeURIComponent(id))
    return event ? success(event) : failure('Event not found', 404)
  } catch (error) {
    return handleRouteError(error, 'Unable to load event')
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const { supabase } = await requireAdmin()
    if (!/^\d+$/.test(id)) return failure('Event not found', 404)
    const body = await request.json()
    const update: Database['public']['Tables']['events']['Update'] = {}
    if (typeof body.title === 'string') update.title = body.title.trim()
    if (typeof body.description === 'string') update.description = body.description || null
    if (typeof body.event_date === 'string') update.event_date = body.event_date
    if (typeof body.end_date === 'string') update.end_date = body.end_date || null
    if (typeof body.location_name === 'string') update.location_name = body.location_name || null
    if (typeof body.location_address === 'string') update.location_address = body.location_address || null
    if (Number.isInteger(Number(body.max_rsvp))) update.max_rsvp = Number(body.max_rsvp)
    if (['upcoming', 'ongoing', 'past', 'cancelled'].includes(body.status)) update.status = body.status
    if (typeof body.is_featured === 'boolean') update.is_featured = body.is_featured
    const { error } = await supabase.from('events').update(update).eq('id', Number(id))
    if (error) throw error
    return success(null, 'Event updated')
  } catch (error) {
    return handleRouteError(error, 'Unable to update event')
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const { supabase } = await requireAdmin()
    if (!/^\d+$/.test(id)) return failure('Event not found', 404)
    const { error } = await supabase.from('events').delete().eq('id', Number(id))
    if (error) throw error
    return success(null, 'Event deleted')
  } catch (error) {
    return handleRouteError(error, 'Unable to delete event')
  }
}
