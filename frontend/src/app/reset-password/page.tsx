import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import AuthShell, { AuthNotice } from '@/components/auth/AuthShell'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import { getAuthLinkErrorMessage, hasRecoveryIntent } from '@/lib/auth/customer-auth'
import { RECOVERY_INTENT_COOKIE } from '@/lib/auth/recovery-intent'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Choose New Password',
  description: 'Securely update your 7Th South Street account password.',
}

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const query = await searchParams
  const errorValue = Array.isArray(query.error) ? query.error[0] : query.error
  const cookieStore = await cookies()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const recoveryIntent = hasRecoveryIntent(cookieStore.get(RECOVERY_INTENT_COOKIE)?.value, user?.id)
  const canResetPassword = Boolean(user && recoveryIntent && !errorValue)

  return (
    <AuthShell
      eyebrow="Secure Recovery"
      title="Choose A New Password"
      description="Use a strong password that is unique to your 7Th South Street account."
    >
      {canResetPassword ? (
        <ResetPasswordForm />
      ) : (
        <div className="auth-invalid-link">
          <AuthNotice tone="error">
            {getAuthLinkErrorMessage(errorValue) || 'This password reset session is missing or has expired. Request a new link and try again.'}
          </AuthNotice>
          <Link href="/forgot-password" className="btn-primary">Request New Reset Link</Link>
          <Link href="/login" className="btn-ghost">Back to Login</Link>
        </div>
      )}
    </AuthShell>
  )
}
