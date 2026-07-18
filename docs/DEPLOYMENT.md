# Deployment guide

## Deployment status boundary

The Supabase database migrations and development seed can be deployed independently from the Next.js frontend. A database migration succeeding does not mean Vercel is configured or the production site is live.

## Supabase

### Link and inspect

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list --linked
npx supabase db push --dry-run
```

Inspect the dry-run and confirm the linked project name before applying anything.

### Apply migrations

```bash
npx supabase db push
```

Use `--include-seed` only for a new development environment. Do not seed a production project that already contains migrated catalog data.

### Generate application types

```bash
npx supabase gen types typescript --linked > frontend/src/types/database.ts
```

Review and commit the generated change whenever the database schema changes.

### Database checks

```bash
npx supabase db lint --linked --level warning
npx supabase db advisors --linked --type security
npx supabase db advisors --linked --type performance
```

Anonymous checkout and RSVP are intentional security-definer entry points. Treat any new or expanded warning as a release blocker until it is reviewed.

## Vercel

Configure the project root as `frontend`.

Required browser-safe variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=https://www.example.com
```

Required server-only variables:

```env
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
NEWSLETTER_RATE_LIMIT_SALT=a-long-random-value
```

Optional migration/operations variable (never required by the browser application):

```env
SUPABASE_DB_URL=postgresql://...
```

Rules:

- Never prefix the service-role key or database URL with `NEXT_PUBLIC_`.
- Never paste privileged values into client code, screenshots, logs, issues, or build output.
- Scope Vercel secrets to the required environments.
- Rotate a secret immediately if it is exposed.
- Remove the legacy `NEXT_PUBLIC_API_URL` after the Supabase release is accepted.

## Auth URL configuration

In Supabase Auth URL configuration:

- Set the Site URL to the production `NEXT_PUBLIC_SITE_URL`.
- Add the exact production callback URL: `https://7th-south-street.vercel.app/auth/callback`.
- Add the exact local callback URLs: `http://localhost:3000/auth/callback` and `http://127.0.0.1:3000/auth/callback`.
- Add an exact `/auth/callback` URL for each approved preview deployment that will exercise Auth.
- Do not use wildcard redirect patterns broader than required for approved preview domains.

In Supabase Auth email and password configuration:

- Enable email confirmations. Both registration confirmation and password recovery return through `/auth/callback`; the application validates any relative destination before redirecting.
- Require passwords of at least eight characters with at least one letter and one number, matching `supabase/config.toml` and the application validation.
- Enable secure password changes so stale signed-in sessions must reauthenticate; recovery-link sessions remain eligible because they are freshly verified.
- Configure a production SMTP provider and verified sender before enabling customer registration. Supabase's development inbox and hosted default email allowance are not production delivery guarantees.
- Review the confirmation and recovery templates, expiry settings, rate limits, and sender branding in the hosted project.

The checked-in `supabase/config.toml` configures the local stack. Changing it or applying SQL migrations does not update the hosted project's Auth URL, SMTP, confirmation, or password settings; verify those settings separately in every Supabase environment.

## Create the first administrator

Create the user in Supabase Auth; do not insert a password or Auth user through a migration. Then assign the database role:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('owner@example.com')
on conflict do nothing;
```

Verify that exactly one user matched. Sign in at `/admin`, test one read and one harmless write, sign out, and confirm a non-admin receives a denial.

## Storage

The `product-images` bucket is created by migration with:

- Public object delivery.
- A 5 MB limit.
- JPEG, PNG, and WebP MIME allowlist.
- Admin-only metadata and write policies under `products/`.

The Next.js upload route verifies file signatures and uses generated object names. Do not upload through a service-role browser client.

## Pre-release gate

```bash
cd frontend
npm ci
npm audit
npm test
npm run type-check
npm run lint
npm run build

cd ..
npx supabase test db
npx supabase db lint --linked --level warning
npx supabase db advisors --linked --type security
npx supabase db advisors --linked --type performance
```

When testing against a disposable or explicitly approved hosted project, run `npm run test:hosted-concurrency` from `frontend/`. It proves that two simultaneous purchases of the last unit produce exactly one order and one stock movement, then removes its uniquely named QA data.

Then verify in the deployment environment:

- Public category, product, product-detail, and event pages.
- Hidden/archived product denial.
- Admin login, session refresh, logout, and non-admin denial.
- Admin product, event, order, customer, inventory, and dashboard paths.
- Checkout price tampering, insufficient stock, invalid variants, and duplicate submission.
- Cross-user order denial.
- Authorized and unauthorized Storage uploads/deletes.
- Newsletter invalid input, duplicate submission, and rate limiting.
- No privileged values appear in browser bundles or logs.

## Cutover and rollback

Keep the PHP backend available but read-only during the acceptance window. If rollback is required:

1. Stop new writes on the failing release.
2. Redeploy the previous frontend commit.
3. Reconcile orders created in Supabase during the cutover window.
4. Restore database state only from a verified backup/PITR point.
5. Do not delete Storage objects or Supabase rows until reconciliation is signed off.

The full MySQL migration and reconciliation procedure is in [SUPABASE_MIGRATION.md](SUPABASE_MIGRATION.md).
