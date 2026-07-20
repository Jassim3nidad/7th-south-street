import type { Metadata } from 'next'
import DeleteAccountForm from '@/components/account/DeleteAccountForm'

export const metadata: Metadata = {
  title: 'Delete Account',
  description: 'Permanently delete your 7Th South Street account.',
}

export default function DeleteAccountPage() {
  return (
    <div className="account-section">
      <header className="account-section__header">
        <p className="neo-kicker" style={{ color: 'var(--neo-error)' }}>Danger Zone</p>
        <h1 className="account-section__title">Delete Account</h1>
        <p className="account-section__subtitle">This action is permanent and cannot be undone.</p>
      </header>

      <div className="neo-panel" style={{ maxWidth: '38rem' }}>
        <div className="auth-notice auth-notice--error" style={{ marginBottom: '1.5rem' }}>
          <strong>Warning:</strong> Deleting your account will permanently remove your profile,
          saved addresses, and wishlist. Your order history will be anonymized. You will be
          immediately signed out.
        </div>

        <DeleteAccountForm />
      </div>
    </div>
  )
}
