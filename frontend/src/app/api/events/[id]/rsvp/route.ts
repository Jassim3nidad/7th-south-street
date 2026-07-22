import { failure, handleRouteError, success } from '@/lib/http'
import { createClient } from '@/lib/supabase/server'

import { requireAdmin } from '@/lib/supabase/admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!/^\d+$/.test(id)) return failure('Event not found', 404)
    
    const { supabase } = await requireAdmin()
    
    const { data, error } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', Number(id))
      .order('created_at', { ascending: false })

    if (error) throw error
    return success(data || [])
  } catch (error) {
    return handleRouteError(error, 'Unable to load RSVPs')
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!/^\d+$/.test(id)) return failure('Event not found', 404)
    const body = await request.json()
    const supabase = await createClient()

    const { data: event } = await supabase
      .from('events')
      .select('title, location_name, event_date, end_date')
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

    // Send transactional email
    if (body?.email) {
      import('@/lib/email').then(async ({ sendTransactionalEmail }) => {
        const { getRSVPConfirmationTemplate } = await import('@/lib/email-templates')
        
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://7thsouthstreet.com'
        const eventUrl = `\${siteUrl}/events/\${id}`

        const html = getRSVPConfirmationTemplate(
          event.title,
          body.name || 'Guest',
          new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
          event.location_name || 'TBA',
          eventUrl
        )

        await sendTransactionalEmail({
          idempotencyKey: `rsvp-\${id}-\${body.email}`,
          to: body.email,
          subject: `You're on the list - \${event.title}`,
          templateName: 'rsvp_confirmation',
          html
        })
      }).catch(err => console.error('Email trigger failed:', err))
    }

    return success(data, 'Reservation received', 201)
  } catch (error) {
    return handleRouteError(error, 'Unable to reserve a place')
  }
}
