import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import CreateAccountForm from '@/components/auth/CreateAccountForm'
import { getSafeReturnPath } from '@/lib/auth/customer-auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a secure 7Th South Street customer account.',
}

type CreateAccountPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CreateAccountPage({ searchParams }: CreateAccountPageProps) {
  const query = await searchParams
  const requestedPath = Array.isArray(query.next) ? query.next[0] : query.next
  const returnTo = getSafeReturnPath(requestedPath, '/account')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect(returnTo)

  return (
    <AuthShell
      eyebrow="Join The Street"
      title="Create Account"
      description="Create your customer profile with a verified email and secure password."
      wide
    >
      <CreateAccountForm returnTo={returnTo} />
    </AuthShell>
  )
}
