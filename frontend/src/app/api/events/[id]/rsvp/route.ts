import { failure, handleRouteError, success } from '@/lib/http'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!/^\d+$/.test(id)) return failure('Event not found', 404)
    const body = await request.json()
    const supabase = await createClient()

    const { data: event } = await supabase
      .from('events')
      .select('event_date, end_date')
      .eq('id', Number(id))
      .single()

    if (!event) return failure('Event not found', 404)
    const deadline = event.end_date || event.event_date
    if (new Date() > new Date(deadline)) {
      return failure('Event is no longer accepting RSVPs', 400)
    }

    const { data, error } = await supabase.rpc('rsvp_event', {
      p_event_id: Number(id),
      p_name: body?.name ?? '',
      p_email: body?.email ?? '',
      p_phone: body?.phone ?? null,
    })
    if (error) throw error
    const result = data as { created?: boolean } | null
    if (result && result.created === false) {
      return failure('You have already registered for this event', 400)
    }
    return success(data, 'Reservation received', 201)
  } catch (error) {
    return handleRouteError(error, 'Unable to reserve a place')
  }
}
