import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/account/ProfileForm'

export const metadata: Metadata = {
  title: 'Edit Profile',
  description: 'Update your 7Th South Street account profile.',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileResult, customerResult] = await Promise.all([
    supabase.from('profiles').select('full_name,phone').eq('id', user.id).maybeSingle(),
    supabase.from('customers').select('first_name,last_name,phone').eq('user_id', user.id).maybeSingle(),
  ])

  const profile = profileResult.data
  const customer = customerResult.data
  const initialName = profile?.full_name
    || [customer?.first_name, customer?.last_name].filter(Boolean).join(' ')
    || ''
  const initialPhone = profile?.phone || customer?.phone || ''

  return (
    <div className="account-section">
      <header className="account-section__header">
        <p className="neo-kicker">Account</p>
        <h1 className="account-section__title">Edit Profile</h1>
        <p className="account-section__subtitle">Update your display name and phone number.</p>
      </header>

      <div className="account-content-grid">
        <section className="neo-panel" aria-labelledby="profile-form-heading">
          <h2 id="profile-form-heading" className="account-panel-heading">Personal Information</h2>
          <ProfileForm initialName={initialName} initialPhone={initialPhone} />
        </section>

        <section className="neo-panel" aria-labelledby="account-identity-heading">
          <h2 id="account-identity-heading" className="account-panel-heading">Account Identity</h2>
          <dl className="account-details">
            <div>
              <dt>Email Address</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Email Status</dt>
              <dd>
                <span className={`account-verification ${user.email_confirmed_at ? 'is-verified' : ''}`}>
                  {user.email_confirmed_at ? 'Verified' : 'Pending verification'}
                </span>
              </dd>
            </div>
            <div>
              <dt>Member Since</dt>
              <dd>{new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'long' }).format(new Date(user.created_at))}</dd>
            </div>
          </dl>
          <p className="account-identity-note">
            Email address is managed through your authentication provider and cannot be changed here.
          </p>
        </section>

        <section className="neo-panel" aria-labelledby="password-heading">
          <h2 id="password-heading" className="account-panel-heading">Password</h2>
          <p className="account-section__subtitle" style={{ marginBottom: '1.25rem' }}>
            Change your password by requesting a secure reset link sent to your email.
          </p>
          <a href="/account/security" className="btn-outline" style={{ display: 'inline-flex' }}>
            Change Password
          </a>
        </section>
      </div>
    </div>
  )
}
