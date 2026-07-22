import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!/^\d+$/.test(id)) return failure('Customer not found', 404)
    
    const { supabase } = await requireAdmin()
    
    // 1. Fetch Customer basic data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', Number(id))
      .single()
      
    if (customerError || !customer) return failure('Customer not found', 404)

    // 2. Fetch Orders history
    const { data: orders } = await (supabase as any)
      .from('orders')
      .select('id, order_number, total, status, payment_status, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })

    // 3. Fetch RSVP history
    const { data: rsvps } = await (supabase as any)
      .from('event_rsvps')
      .select('id, created_at, events(title, event_date, status)')
      .eq('email', customer.email)
      .order('created_at', { ascending: false })

    // 4. Fetch Newsletter status
    const { data: newsletter } = await supabase
      .from('newsletter_subscribers')
      .select('is_active')
      .eq('email', customer.email)
      .single()

    const profile = {
      ...customer,
      is_registered: !!customer.user_id,
      is_subscribed: newsletter?.is_active ?? false,
      orders: orders || [],
      rsvps: (rsvps || []).map((r: any) => ({
        id: r.id,
        created_at: r.created_at,
        event_title: r.events?.title,
        event_date: r.events?.event_date,
        event_status: r.events?.status
      }))
    }

    return success(profile)
  } catch (error) {
    return handleRouteError(error, 'Unable to load customer profile')
  }
}
