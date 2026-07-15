import { failure, handleRouteError, success } from '@/lib/http'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!/^\d+$/.test(id)) return failure('Event not found', 404)
    const body = await request.json()
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('rsvp_event', {
      p_event_id: Number(id),
      p_name: body?.name ?? '',
      p_email: body?.email ?? '',
      p_phone: body?.phone ?? null,
    })
    if (error) throw error
    return success(data, 'Reservation received', 201)
  } catch (error) {
    return handleRouteError(error, 'Unable to reserve a place')
  }
}
