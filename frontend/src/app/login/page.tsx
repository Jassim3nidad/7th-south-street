import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import LoginForm from '@/components/auth/LoginForm'
import { getAuthLinkErrorMessage, getAuthStatusMessage, getSafeReturnPath } from '@/lib/auth/customer-auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your 7Th South Street customer account.',
}

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams
  const returnTo = getSafeReturnPath(firstValue(query.next), '/account')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect(returnTo)

  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Log In"
      description="Access your account, order history, and saved customer details."
    >
      <LoginForm
        returnTo={returnTo}
        initialError={getAuthLinkErrorMessage(firstValue(query.error))}
        initialMessage={getAuthStatusMessage(firstValue(query.message))}
      />
    </AuthShell>
  )
}
