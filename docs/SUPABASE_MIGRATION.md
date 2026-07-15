# Supabase migration runbook

## Current state

- The Next.js frontend uses same-origin route handlers backed by Supabase.
- Supabase migrations, RLS policies, Storage policies, seed data, generated TypeScript types, and pgTAP tests are version controlled.
- The PHP backend and legacy MySQL SQL files are retained temporarily. They are not called by the migrated frontend.
- The development catalog is deployed to the linked Supabase project.
- Production MySQL records and local upload files have not been supplied or imported. Do not remove PHP until those records and files pass reconciliation.

## Endpoint migration matrix

| Legacy behavior | New implementation | Authorization |
| --- | --- | --- |
| `POST /auth/login` | Next.js `/api/auth/login` + Supabase Auth | Email/password; database admin role required |
| `POST /auth/logout` | Next.js `/api/auth/logout` | Current cookie session |
| `GET /products` | Next.js `/api/products` + RLS reads | Public catalog rows only; admins also see archived rows |
| `GET /products/{id}` | Next.js `/api/products/[id]` + RLS reads | Public catalog rows only; admins also see archived rows |
| `POST/PUT/DELETE /products` | Next.js handlers + admin RPC/table writes | Verified admin |
| `GET/POST /categories` | Next.js `/api/categories` | Public active reads; admin writes |
| `GET /events` | Next.js `/api/events` | Public non-cancelled reads; admin sees all |
| `POST/PUT/DELETE /events` | Next.js event handlers | Verified admin |
| `POST /events/{id}/rsvp` | `rsvp_event` RPC through Next.js | Public, capacity checked, email unique per event |
| `POST /orders` | `create_order` RPC through Next.js | Public or authenticated; trusted values computed in Postgres |
| `GET/PUT /orders` | Next.js order handlers and admin RPC | Verified admin; customers have RLS access only to their own rows |
| `GET/PUT /inventory` | Next.js handlers + `admin_adjust_inventory` | Verified admin; movements are audited |
| `GET /customers` | Next.js `/api/customers` | Verified admin |
| `POST /newsletter` | Server-only Next.js handler + `subscribe_newsletter` | Public route; RPC executable only by service role |
| `GET /dashboard/stats` | `admin_dashboard_stats` RPC | Verified admin |
| `POST/DELETE /upload` | Next.js `/api/upload` + Supabase Storage | Verified admin, MIME/signature/size/path validation |

## Access-control matrix

| Resource | Anonymous | Authenticated customer | Administrator |
| --- | --- | --- | --- |
| Categories | Read active | Read active | Full management |
| Products/variants/images | Read public catalog | Read public catalog | Full management |
| Events/gallery | Read non-cancelled | Read non-cancelled | Full management |
| Profiles | None | Read/update own | Full management |
| Customers/addresses/wishlist | None | Own rows only | Full management |
| Orders/items | Create through RPC; no direct reads | Create through RPC; read own | Read/manage all |
| Inventory movements | None | None | Read/manage through trusted workflows |
| Newsletter records | None | None | Admin reads; server-only subscription function |
| Audit logs/analytics | None | None | Read |
| Storage writes | None | None | `product-images/products/**` only |

All public tables have RLS enabled. Grants make an operation available to a database role; policies determine which rows that role can access. Direct order inserts are not allowed by policy, even though authenticated admins can manage orders.

## Secure order behavior

`public.create_order` is the only customer checkout write path. It:

1. Requires one to 50 cart entries and quantities from one to 25.
2. Aggregates duplicate variant IDs.
3. Acquires an advisory lock for the idempotency key.
4. Locks each variant row in stable ID order.
5. Requires an active variant on an available product.
6. Reads prices from Postgres and ignores extra client price/total fields.
7. Rejects insufficient inventory.
8. Uses a server-defined shipping fee.
9. Inserts the order and immutable product/SKU/size/color/price snapshots.
10. Decrements stock and inserts inventory movements in the same transaction.
11. Returns the existing sanitized result when the idempotency key is retried.

Any exception rolls back the order, item rows, inventory changes, and movements.

## Product image Storage

Bucket: `product-images`

- Public object URLs are enabled for storefront display.
- Anonymous bucket metadata listing has no broad `storage.objects` SELECT policy.
- Only authenticated database admins may select metadata, upload, update, or delete.
- Object names must start with `products/`.
- The server generates UUID filenames and permits JPEG, PNG, or WebP up to 5 MB.
- The route verifies magic bytes in addition to the browser-provided MIME type.
- If the database image record fails, the newly uploaded object is removed.
- Replaced images should be deleted only after the replacement object and database record succeed.

## Production MySQL data migration

The local MySQL service is present, but its configured application login does not authenticate. Do not reset grants or use `skip-grant-tables` without a verified backup. Perform this procedure during a scheduled migration window once a valid source login is available and record all outputs.

Run `scripts/backup-and-analyze-mysql.ps1` only after the source credentials have been verified. It creates full and data-only dumps outside Git, hashes both artifacts, records exact source row counts, and produces anomaly counts without writing database credentials to the report. Run `scripts/inventory-legacy-images.ps1` against every confirmed upload root to produce a signature-checked, SHA-256 image manifest before uploading objects.

### 1. Freeze and back up

```bash
mysqldump --single-transaction --routines --triggers \
  -u SOURCE_USER -p 7th_south_street > database/mysql-backup-YYYYMMDD.sql
sha256sum database/mysql-backup-YYYYMMDD.sql
```

Store the dump and checksum outside the application host as well. Confirm a test restore before continuing.

### 2. Capture source reconciliation data

Record source counts for every table and export these checks separately:

```sql
select count(*) from categories;
select count(*) from products;
select count(*) from inventory;
select count(*) from orders;
select count(*) from order_items;
select count(*) from customers;

select lower(email), count(*) from customers group by lower(email) having count(*) > 1;
select sku, count(*) from products group by sku having count(*) > 1;
select slug, count(*) from products group by slug having count(*) > 1;
```

Also export product prices, stock by product/size/color, order totals, item totals, and all source timestamps with their assumed timezone.

### 3. Apply the destination schema

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

Do not include `supabase/seed.sql` in a production data import if real catalog rows will be loaded.

### 4. Load source tables into staging

Use the Supabase MySQL migration tool or `pgloader` to load the source into a non-exposed schema such as `mysql_staging`. Do not point a blind schema conversion at `public`; the target normalizes MySQL `inventory` into `product_variants` and renames immutable order-item fields.

Example `pgloader` outline:

```lisp
load database
  from mysql://SOURCE_USER:SOURCE_PASSWORD@SOURCE_HOST/7th_south_street
  into postgresql://DEST_USER:DEST_PASSWORD@DEST_HOST/postgres
  alter schema '7th_south_street' rename to 'mysql_staging';
```

Keep credentials out of shell history and logs. Use protected environment variables or an approved secrets manager.

### 5. Transform staging data

Run reviewed, transaction-wrapped SQL that:

- Preserves category, product, customer, order, and event IDs.
- Maps each MySQL inventory row to one `product_variants` row.
- Creates collision-free variant SKUs. Do not silently merge duplicate source SKUs.
- Copies order item values into snapshot columns.
- Normalizes emails to lowercase only after duplicate resolution.
- Converts MySQL local timestamps to `timestamptz` using the verified source timezone.
- Converts local upload URLs to Storage object paths only after each file is uploaded and verified.
- Resets every identity sequence with `setval(pg_get_serial_sequence(...), max(id), true)`.

Stop and record an anomaly rather than dropping or coercing invalid data silently.

### 6. Reconcile destination data

Required checks:

- Source and destination row counts, with a documented explanation for normalized tables.
- Every foreign key validates.
- No duplicate product slugs, variant SKUs, customer emails, or order numbers.
- Product and variant prices match the source.
- Stock totals match by product, size, and color.
- `orders.total = subtotal + shipping_fee - discount_amount` for every order.
- Every order item has `line_total = unit_price_snapshot * quantity`.
- Order totals equal the sum of item totals plus shipping minus discount.
- Nulls and timezones match documented expectations.
- A sample of historical orders displays unchanged after products are edited.

### 7. Cut over

1. Put the legacy checkout/admin backend into maintenance mode.
2. Take a final incremental dump and import changes.
3. Repeat reconciliation.
4. Upload and verify all Storage objects.
5. Configure production environment variables.
6. Run RLS, Auth, Storage, checkout, and production smoke tests.
7. Deploy the Next.js release.
8. Keep PHP read-only until the acceptance window closes.

## Administrator setup

The old documented administrator password is considered exposed and is not present in Supabase seeds.

1. Create or invite the intended owner through Supabase Auth.
2. Require a unique password and MFA where available.
3. Confirm the user's email.
4. Insert the `admin` role by verified user UUID or email.
5. Test `/admin`, logout, expired-session behavior, and a non-admin denial.
6. Keep at least two accountable owners for recovery; do not create shared credentials.

## Validation commands

```bash
cd frontend
npm ci
npm audit
npm test
npm run type-check
npm run lint
npm run build

cd ..
npx supabase start
npx supabase db reset
npx supabase test db
npx supabase db lint --local --level warning
npx supabase db advisors --linked --type security
npx supabase db advisors --linked --type performance
```

The public `create_order`, `rsvp_event`, and `is_admin` functions are `SECURITY INVOKER` boundaries. Their privileged implementations live in the non-exposed `private` schema. This keeps the required guest workflows callable without exposing `SECURITY DEFINER` functions through the public Data API. The pgTAP suite asserts this layout, validation behavior, and exact execution grants.

## Rollback

1. Do not delete the PHP backend until production acceptance is complete.
2. If the frontend cutover fails, redeploy the last known-good frontend commit and restore its legacy API configuration.
3. Disable new Supabase writes during rollback to avoid split-brain orders.
4. Export any Supabase orders created after cutover and reconcile them into the restored system before reopening checkout.
5. Restore database data from a verified Supabase backup/PITR point when required. Do not improvise destructive down migrations in production.
6. Keep Storage objects until reconciliation is complete; removing a database row does not prove an object is safe to delete.
7. Record the incident window, order IDs, reconciliation result, and final authoritative system.
