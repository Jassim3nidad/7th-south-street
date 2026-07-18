import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Request a secure password reset for your 7Th South Street account.',
}

export default async function ForgotPasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/account')

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Reset Your Password"
      description="Enter your email and we will send a time-limited password reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
