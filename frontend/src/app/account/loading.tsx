export default function AccountLoading() {
  return (
    <main className="site-shell">
      <div className="site-container account-page account-loading" role="status" aria-live="polite">
        <p className="neo-kicker">Customer Account</p>
        <h1 className="neo-heading">Loading Your Account…</h1>
        <div className="neo-panel account-loading__panel" aria-hidden="true" />
        <span className="sr-only">Loading customer profile and orders.</span>
      </div>
    </main>
  )
}
