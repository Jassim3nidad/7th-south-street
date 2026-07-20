import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AddressManager from '@/components/account/AddressManager'

export const metadata: Metadata = {
  title: 'My Addresses',
  description: 'Manage your saved shipping addresses.',
}

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const addresses = customer?.id
    ? (await supabase
        .from('customer_addresses')
        .select('id,label,address_line1,address_line2,city,province,postal_code,country,is_default')
        .eq('customer_id', customer.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })).data ?? []
    : []

  return (
    <div className="account-section">
      <header className="account-section__header">
        <p className="neo-kicker">Shipping</p>
        <h1 className="account-section__title">My Addresses</h1>
        <p className="account-section__subtitle">Saved addresses speed up checkout on your next order.</p>
      </header>

      {customer?.id ? (
        <AddressManager addresses={addresses} />
      ) : (
        <div className="account-empty-state neo-inset">
          <p className="account-empty-state__heading">No customer record found</p>
          <p className="account-empty-state__body">Place your first order to activate address management.</p>
        </div>
      )}
    </div>
  )
}
