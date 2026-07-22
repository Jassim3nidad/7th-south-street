"use client";

export default function NewsletterForm() {
  return (
    <section className="site-section" aria-labelledby="newsletter-heading">
      <div className="site-container">
        <div className="neo-newsletter neo-panel">
          <h2 id="newsletter-heading" className="neo-heading">
            Join The Inner Circle
          </h2>
          <p>
            Early access to drops, private events, and exclusive archives.
          </p>

          <form className="!block" onSubmit={async (e) => {
            e.preventDefault()
            const form = e.currentTarget
            const email = (form.elements.namedItem('email') as HTMLInputElement).value
            const website = (form.elements.namedItem('website') as HTMLInputElement).value
            const btn = form.querySelector('button')
            if (btn) {
              btn.disabled = true
              btn.setAttribute('aria-busy', 'true')
              btn.textContent = '...'
            }
            await fetch('/api/newsletter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, website, source: 'homepage' })
            })
            if (btn) {
              btn.disabled = false
              btn.removeAttribute('aria-busy')
              btn.textContent = 'Subscribed ✓'
              setTimeout(() => { btn.textContent = 'Subscribe' }, 3000)
            }
            form.reset()
          }}>
            {/* Honeypot field */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="homepage-website">Website</label>
              <input id="homepage-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <label htmlFor="homepage-email" className="sr-only">Email address</label>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <input
                id="homepage-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="ENTER YOUR EMAIL"
                required
                className="input-dark flex-1 font-bold uppercase tracking-widest"
              />
              <button type="submit" className="btn-primary w-full sm:w-auto" aria-live="polite">
                Subscribe
              </button>
            </div>
            <p className="mt-3 text-xs" style={{ color: "var(--neo-text-soft)" }}>
              By subscribing, you consent to receive marketing emails and updates.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
