# 7Th South Street

The storefront now uses Next.js route handlers with Supabase Postgres, Auth, and Storage. The former PHP/MySQL backend remains in `backend/` only as a temporary rollback and feature-comparison reference; the Next.js application no longer calls it.

## Architecture

```text
Browser
  -> Next.js 15 App Router
     -> Supabase Auth (cookie-based SSR sessions)
     -> Supabase Postgres (RLS on every exposed table)
     -> Postgres RPC (transactional checkout and trusted totals)
     -> Supabase Storage (product-images bucket)
```

Important security boundaries:

- The browser submits only variant IDs and quantities at checkout.
- `create_order` locks inventory, reads current prices, creates immutable item snapshots, decrements stock, records movements, and handles idempotency in one transaction.
- Cancelling an order restores its stock exactly once, records cancellation movements, and prevents reopening a cancelled order.
- Admin pages and route handlers verify a current Supabase user and a database-backed `user_roles` entry.
- Supabase sessions are cookie-based; admin tokens are not stored in `localStorage`.
- The service-role key is used only by the server-only newsletter route and must never be exposed through `NEXT_PUBLIC_*`.
- Product image uploads require an admin session, a permitted MIME type, a matching file signature, a 5 MB maximum, and a `products/` object path.

## Repository layout

```text
frontend/                  Next.js application and same-origin route handlers
supabase/migrations/       Versioned Postgres, RLS, Storage, and RPC migrations
supabase/seed.sql          Catalog development seed (no Auth users or passwords)
supabase/tests/database/   Rollback-only pgTAP security tests
scripts/                    Backup and source/image inventory tooling
backend/                   Temporary legacy PHP implementation
database/                  Legacy MySQL schema and seed for migration reference
docs/                      Deployment and migration runbooks
```

## Local development

Prerequisites:

- Node.js and npm
- Docker Desktop for the local Supabase stack
- Supabase CLI (`npx supabase` is supported)

```bash
cd frontend
npm install
cp .env.example .env.local
```

Set these browser-safe values in `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Set these server-only values when their workflows are used:

```env
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_key
NEWSLETTER_RATE_LIMIT_SALT=a-long-random-value
```

Never commit `.env.local`.

Start the local Supabase stack and apply all migrations and seed data:

```bash
cd ..
npx supabase start
npx supabase db reset
cd frontend
npm run dev
```

## Validation

```bash
cd frontend
npm run type-check
npm run lint
npm test
npm run build

cd ..
npx supabase test db
npx supabase db lint --local --level warning
```

The tests cover catalog RLS, cross-user order access, non-admin denial, trusted totals, insufficient inventory, invalid variants, duplicate-submission idempotency, exact-once cancellation restocking, public-function privilege boundaries, admin inventory updates, Storage write/delete denial, server-only newsletter access, and upload signatures. `npm run test:hosted-concurrency` is an explicit hosted-only check that creates uniquely named QA rows and removes them in a `finally` block.

Customer Auth database tests additionally cover profile provisioning, fixed non-privileged roles, email-confirmation synchronization, verified legacy-customer linking, protected identity fields, and cross-user profile, customer, address, and wishlist isolation.

## Administrator setup

No administrator password is stored or seeded. Create a new user in Supabase Auth with a unique password, then assign the role using the user's verified email:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('owner@example.com')
on conflict do nothing;
```

Confirm the query inserted exactly one row before attempting `/admin`. Do not reuse the legacy documented password.

## Migration and deployment

See [docs/SUPABASE_MIGRATION.md](docs/SUPABASE_MIGRATION.md) for the endpoint matrix, RLS model, MySQL data migration, verification checklist, and rollback procedure. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Supabase and Vercel deployment. The evidence-based production completion matrix is maintained in [docs/PRODUCTION_CUTOVER.md](docs/PRODUCTION_CUTOVER.md).
