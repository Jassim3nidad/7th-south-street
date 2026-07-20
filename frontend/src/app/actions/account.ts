'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// ── Profile ────────────────────────────────────────────────────

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login?next=/account/profile')

  const fullName = (formData.get('full_name') as string | null)?.trim() ?? ''
  const phone = (formData.get('phone') as string | null)?.trim() ?? ''

  if (!fullName || fullName.length > 201) {
    return { error: 'Please enter a valid name (1–201 characters).' }
  }
  if (phone && phone.length > 32) {
    return { error: 'Phone number must be 32 characters or fewer.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone: phone || null })
    .eq('id', user.id)

  if (error) return { error: 'Unable to update profile. Please try again.' }

  revalidatePath('/account')
  revalidatePath('/account/profile')
  return { success: true }
}

// ── Addresses ─────────────────────────────────────────────────

async function getCustomerId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.id ?? null
}

export async function addAddress(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login?next=/account/addresses')

  const customerId = await getCustomerId(supabase, user.id)
  if (!customerId) return { error: 'No customer record found. Please contact support.' }

  const label = (formData.get('label') as string | null)?.trim() || 'Home'
  const addressLine1 = (formData.get('address_line1') as string | null)?.trim() ?? ''
  const addressLine2 = (formData.get('address_line2') as string | null)?.trim() || null
  const city = (formData.get('city') as string | null)?.trim() ?? ''
  const province = (formData.get('province') as string | null)?.trim() || null
  const postalCode = (formData.get('postal_code') as string | null)?.trim() || null
  const country = (formData.get('country') as string | null)?.trim() || 'Philippines'
  const isDefault = formData.get('is_default') === 'true'

  if (!addressLine1) return { error: 'Address line 1 is required.' }
  if (!city) return { error: 'City is required.' }
  if (!country) return { error: 'Country is required.' }

  // If setting as default, unset others first
  if (isDefault) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', customerId)
  }

  const { error } = await supabase.from('customer_addresses').insert({
    customer_id: customerId,
    label,
    address_line1: addressLine1,
    address_line2: addressLine2,
    city,
    province,
    postal_code: postalCode,
    country,
    is_default: isDefault,
  })

  if (error) return { error: 'Unable to save address. Please try again.' }

  revalidatePath('/account/addresses')
  return { success: true }
}

export async function updateAddress(id: number, formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login?next=/account/addresses')

  const customerId = await getCustomerId(supabase, user.id)
  if (!customerId) return { error: 'No customer record found.' }

  const label = (formData.get('label') as string | null)?.trim() || 'Home'
  const addressLine1 = (formData.get('address_line1') as string | null)?.trim() ?? ''
  const addressLine2 = (formData.get('address_line2') as string | null)?.trim() || null
  const city = (formData.get('city') as string | null)?.trim() ?? ''
  const province = (formData.get('province') as string | null)?.trim() || null
  const postalCode = (formData.get('postal_code') as string | null)?.trim() || null
  const country = (formData.get('country') as string | null)?.trim() || 'Philippines'
  const isDefault = formData.get('is_default') === 'true'

  if (!addressLine1) return { error: 'Address line 1 is required.' }
  if (!city) return { error: 'City is required.' }

  if (isDefault) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', customerId)
  }

  const { error } = await supabase
    .from('customer_addresses')
    .update({ label, address_line1: addressLine1, address_line2: addressLine2, city, province, postal_code: postalCode, country, is_default: isDefault })
    .eq('id', id)
    .eq('customer_id', customerId)

  if (error) return { error: 'Unable to update address. Please try again.' }

  revalidatePath('/account/addresses')
  return { success: true }
}

export async function deleteAddress(id: number) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login?next=/account/addresses')

  const customerId = await getCustomerId(supabase, user.id)
  if (!customerId) return { error: 'No customer record found.' }

  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', id)
    .eq('customer_id', customerId)

  if (error) return { error: 'Unable to delete address. Please try again.' }

  revalidatePath('/account/addresses')
  return { success: true }
}

export async function setDefaultAddress(id: number) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login?next=/account/addresses')

  const customerId = await getCustomerId(supabase, user.id)
  if (!customerId) return { error: 'No customer record found.' }

  // Unset all, then set the target
  await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_id', customerId)
  const { error } = await supabase
    .from('customer_addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('customer_id', customerId)

  if (error) return { error: 'Unable to set default address. Please try again.' }

  revalidatePath('/account/addresses')
  return { success: true }
}

// ── Wishlist ───────────────────────────────────────────────────

export async function toggleWishlist(productId: number) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Sign in to save items to your wishlist.', requiresAuth: true }

  const customerId = await getCustomerId(supabase, user.id)
  if (!customerId) return { error: 'No customer record found.' }

  // Check existing
  const { data: existing } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('customer_id', customerId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('customer_id', customerId)
      .eq('product_id', productId)
    if (error) return { error: 'Unable to remove from wishlist.' }
    revalidatePath('/account/wishlist')
    return { success: true, saved: false }
  } else {
    const { error } = await supabase
      .from('wishlists')
      .insert({ customer_id: customerId, product_id: productId })
    if (error) return { error: 'Unable to add to wishlist.' }
    revalidatePath('/account/wishlist')
    return { success: true, saved: true }
  }
}

// ── Security — send password reset email ──────────────────────

export async function sendPasswordResetEmail() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || !user.email) return { error: 'Unable to determine your account email.' }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  })

  if (error) return { error: 'Unable to send reset email. Please try again.' }
  return { success: true }
}

// ── Account Deletion ───────────────────────────────────────────

export async function deleteAccount(confirmation: string) {
  if (confirmation !== 'DELETE') return { error: 'Type DELETE to confirm account deletion.' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Sign out before deletion to clear session cookies
  await supabase.auth.signOut()

  // Use service-role client for admin deletion — never exposes key to browser
  const serviceClient = createServiceClient()
  const { error } = await serviceClient.auth.admin.deleteUser(user.id)

  if (error) {
    // Re-authentication would be needed; redirect to login with message
    redirect('/login?message=deletion-failed')
  }

  redirect('/?message=account-deleted')
}
