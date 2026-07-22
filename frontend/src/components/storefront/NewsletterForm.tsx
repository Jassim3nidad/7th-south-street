"use client";

export default function NewsletterForm() {
  return (
    <section className="w-full bg-base py-24 border-t border-border">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="font-display text-2xl font-black uppercase tracking-widest text-text-primary mb-4 md:text-3xl">
          Join The Inner Circle
        </h2>
        <p className="text-sm text-text-secondary mb-8">
          Early access to drops, private events, and exclusive archives.
        </p>
        
        <form className="flex flex-col gap-4 max-w-md mx-auto" onSubmit={async (e) => {
          e.preventDefault()
          const form = e.currentTarget
          const email = (form.elements.namedItem('email') as HTMLInputElement).value
          const website = (form.elements.namedItem('website') as HTMLInputElement).value
          const btn = form.querySelector('button')
          if (btn) btn.disabled = true
          if (btn) btn.textContent = '...'
          await fetch('/api/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, website, source: 'homepage' })
          })
          if (btn) {
             btn.disabled = false
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
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <input 
              type="email" 
              name="email"
              placeholder="ENTER YOUR EMAIL" 
              required
              className="flex-1 rounded-none border border-border bg-base px-4 py-3 text-sm font-bold uppercase tracking-widest text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button 
              type="submit"
              className="rounded-none bg-text-primary px-8 py-3 text-sm font-bold uppercase tracking-widest text-base transition hover:bg-brand-500"
            >
              Subscribe
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2">
            By subscribing, you consent to receive marketing emails and updates.
          </p>
        </form>
      </div>
    </section>
  );
}
