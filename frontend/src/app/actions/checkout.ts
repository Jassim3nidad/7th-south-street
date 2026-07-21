'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

export type CheckoutProfile = {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  postal: string
}

export async function getCheckoutProfile(): Promise<CheckoutProfile | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*, customer_addresses(*)')
      .eq('user_id', user.id)
      .single()

    if (customerError || !customer) {
      return null
    }

    // Attempt to find a default address, otherwise use the first one
    const address = customer.customer_addresses?.find((a: any) => a.is_default) || customer.customer_addresses?.[0]

    return {
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: address ? `${address.address_line1} ${address.address_line2 || ''}`.trim() : '',
      city: address?.city || '',
      province: address?.province || '',
      postal: address?.postal_code || '',
    }
  } catch (error) {
    console.error('Failed to get checkout profile:', error)
    return null
  }
}
