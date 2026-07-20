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

## Local Development (Zero-Config Setup)

We have streamlined local development so you can run the entire stack locally with minimal configuration.

### 1. Prerequisites
- **Node.js 20+** and **npm 10+**
- **Docker Desktop** (Required for local Supabase. **Windows Users:** Ensure WSL2 is enabled and integrated with Docker Desktop.)
- **Supabase CLI** (installed globally or run via `npx supabase`)

### 2. Startup Guide
From the root of the repository, simply run the setup script. This will install dependencies and automatically copy the local `.env.example` to `frontend/.env.local` for you:

```bash
npm run setup
```

*(Note: The environment variables in `.env.example` point to deterministic local Supabase instances and use placeholder keys that work automatically with local Supabase. Do not change these for local dev.)*

### 3. Connect to Local Supabase & Migrate
Start the local Supabase stack. This command automatically provisions the Postgres database, runs all schema migrations, and loads the development seed data:

```bash
npx supabase start
```
*Wait for the CLI to print out your local credentials and confirm the containers are running.*

### 4. Start the Application
With the database running, start the Next.js development server:

```bash
npm run dev
```
Navigate to `http://localhost:3000`. 
*(Note: If you forgot to set environment variables or `.env.local` is missing, the Next.js startup script will intentionally fail and print a helpful error message.)*

### 5. Administrator Setup
To test "The Vault" (Admin Dashboard), you must create an administrator account. No admin passwords are saved in the codebase.

1. Sign up for a normal account on `http://localhost:3000`.
2. Connect to the local database using the Supabase Studio UI (typically `http://localhost:54323`).
3. Run this SQL query to grant admin privileges to your test user:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('your_email@example.com')
on conflict do nothing;
```

### 6. Storage Configuration
The `product-images` bucket is created automatically by the database migrations during `npx supabase start`. You can verify this in the local Supabase Studio.

### Troubleshooting
- **Windows Docker Issues:** If `npx supabase start` fails on Windows, verify that the Docker daemon is running and that WSL2 backend is selected in Docker settings.
- **Port Conflicts:** Ensure ports `3000`, `54321`, `54322`, and `54323` are not occupied by other services.
- **Missing Env Vars:** If the build fails with `❌ Missing required environment variable`, re-run `npm run setup` to ensure `.env.local` is properly linked.

## Migration and deployment

See [docs/SUPABASE_MIGRATION.md](docs/SUPABASE_MIGRATION.md) for the endpoint matrix, RLS model, MySQL data migration, verification checklist, and rollback procedure. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Supabase and Vercel deployment. The evidence-based production completion matrix is maintained in [docs/PRODUCTION_CUTOVER.md](docs/PRODUCTION_CUTOVER.md).
