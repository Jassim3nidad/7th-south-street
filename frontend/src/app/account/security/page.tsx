import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SecurityActions from '@/components/account/SecurityActions'

export const metadata: Metadata = {
  title: 'Security',
  description: 'Manage your 7Th South Street account security settings.',
}

export default async function SecurityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="account-section">
      <header className="account-section__header">
        <p className="neo-kicker">Security</p>
        <h1 className="account-section__title">Account Security</h1>
        <p className="account-section__subtitle">Manage your password and account access.</p>
      </header>

      <div className="account-content-grid">
        <section className="neo-panel" aria-labelledby="password-section-heading">
          <h2 id="password-section-heading" className="account-panel-heading">Change Password</h2>
          <p className="account-section__subtitle" style={{ marginBottom: '1.5rem' }}>
            We'll send a secure password reset link to <strong>{user.email}</strong>.
            The link expires after 1 hour.
          </p>
          <SecurityActions email={user.email!} />
        </section>

        <section className="neo-panel" aria-labelledby="danger-section-heading">
          <h2 id="danger-section-heading" className="account-panel-heading">Danger Zone</h2>
          <p className="account-section__subtitle" style={{ marginBottom: '1.5rem' }}>
            Permanently delete your account and all personal data. This action cannot be undone.
            Your order history will be anonymized but not deleted.
          </p>
          <a href="/account/delete" className="btn-outline security-delete-link">
            Delete Account
          </a>
        </section>
      </div>
    </div>
  )
}
