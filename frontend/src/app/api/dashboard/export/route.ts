import { NextRequest } from 'next/server'
import { handleRouteError } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin()
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Fetch raw order data for the export
    let query = supabase
      .from('orders')
      .select('order_number,created_at,shipping_name,shipping_email,status,payment_method,payment_status,total,discount_amount')
      .order('created_at', { ascending: false })

    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const { data, error } = await query
    if (error) throw error

    // Generate CSV string
    const headers = ['Order Number', 'Date', 'Customer Name', 'Email', 'Status', 'Payment Method', 'Payment Status', 'Total (PHP)', 'Discount (PHP)']
    const rows = (data || []).map(order => [
      order.order_number,
      new Date(order.created_at).toISOString(),
      order.shipping_name,
      order.shipping_email,
      order.status,
      order.payment_method,
      order.payment_status,
      order.total,
      order.discount_amount
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    return handleRouteError(error, 'Unable to export dashboard data')
  }
}
