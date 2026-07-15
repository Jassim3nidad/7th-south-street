# Production cutover record

This record distinguishes completed repository work, hosted Supabase verification, and production steps that require source or account credentials. A Git push or hosted database migration is not evidence of a Vercel production deployment.

## Completion matrix

| Item | State | Evidence or blocker |
| --- | --- | --- |
| Git synchronization | Complete | `main` and `codex/migration-supabase` were fetched and pulled before stabilization work began. |
| Migration implementation | Complete | Next.js uses Supabase Postgres, Auth, Storage, RLS, and transactional RPCs. |
| Exposed PAT verification | Blocked on account session | The previously disclosed PAT still authenticates. The dashboard and CLI sessions are signed out, so account-token deletion cannot be completed without owner sign-in. |
| Current-source secret scan | Complete | No disclosed PAT, service-role value, or legacy default password is present in tracked source or browser bundles. |
| MySQL source discovery | Partial | MySQL 8 is running locally and a Workbench profile exists, but the ignored backend password is blank/invalid and the data directory is ACL-protected. |
| MySQL backup | Blocked | A valid source login is required. Do not reset MySQL grants before a verified backup. |
| MySQL migration/reconciliation | Blocked | Source rows cannot be read until source authentication is restored. |
| Image source discovery | Partial | A signature inventory found 0 files in the repository upload directories. Database image references and any remote hosting filesystem remain inaccessible. |
| Image migration | Blocked | No authoritative source image set or product relationship data is available. |
| Supabase administrator | Blocked | No owner email/password was supplied and no existing Auth owner account is present. |
| Vercel project/configuration | Blocked | No `.vercel` link or CLI session exists; the in-app Vercel flow reaches a GitHub credential screen. |
| Production deployment/smoke tests | Blocked | No authenticated Vercel project or production URL is available. |
| Adviser hardening | Verified | Migration `20260715001000` isolates privileged implementations in `private`; hosted pgTAP passes 10/10 and both Advisers report no issues. |
| Pull request | Pending final validation | Create after hosted migration/tests and all current branch checks pass. Merge still requires repository approval. |

## Source backup procedure

1. Restore a valid read-capable MySQL login without changing grants or restarting with `skip-grant-tables`.
2. Run `scripts/backup-and-analyze-mysql.ps1` with the ignored backend environment file.
3. Confirm the full and data-only dump sizes and SHA-256 hashes in the generated report.
4. Store the artifact directory outside Git and copy it to the approved encrypted backup location.
5. Review every nonzero anomaly before running an import.

The backup script never prints the password and uses `MYSQL_PWD` only for the lifetime of the process.

## Image inventory procedure

Run `scripts/inventory-legacy-images.ps1` for every confirmed upload root. The output records source paths, byte counts, SHA-256 hashes, supported signatures, corrupt files, and duplicate hashes. Reconcile that manifest with `product_images` before uploading anything to Supabase Storage.

## Credential actions still requiring the owner

- Sign in to Supabase Account → Access Tokens and delete the disclosed classic token. Verify the old token then returns an authentication failure.
- Provide or securely create the intended administrator email and password. Never send the password through Git or place it in migration SQL.
- Sign in to Vercel (or provide an approved Vercel CLI token through the secure environment), select/create the project, and confirm the production domain.
- Restore access to the authoritative MySQL source and the hosting filesystem containing real uploads.

## Verification boundaries

- **Local:** package tests, lint, type checking, build, and secret scanning.
- **Hosted Supabase:** migration history, pgTAP/RLS tests, Storage denial, database lint, advisers, and controlled concurrency.
- **Preview:** not available until Vercel is authenticated and linked.
- **Production:** not available until real data/images, administrator setup, Vercel deployment, and the deployed URL are verified.

## Rollback readiness

Keep the PHP/MySQL implementation and original uploads unchanged and read-only during acceptance. The recommended rollback window is at least seven days after verified production cutover, extended to cover the longest order-fulfillment cycle if operationally required. A rollback must reconcile orders and inventory written after cutover before traffic is returned to MySQL.
