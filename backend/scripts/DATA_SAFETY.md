# Data Safety Rules

## Why orders went missing
A previous reset of the database (snapshot file `solo_ecommerce_pre_cleanup_20260208.dump`
in the repo root) emptied the `Order` table. Subsequent deploys did not put the
data back. **The shipping-feature deploy did not delete anything** — orders were
already gone before that change.

## Mandatory rules going forward

### 1. Never run on prod
The following commands **destroy data** and must never run against the
production database:

| Command | Effect |
|---------|--------|
| `prisma migrate reset` | Drops & recreates the entire DB |
| `prisma db push --force-reset` | Same, silent |
| `prisma db push --accept-data-loss` | Drops columns/tables |
| `npm run prisma:seed` against prod | May upsert/replace seeded data |
| `pg_restore --clean` against prod | Drops everything before restoring |

Production deploys use **only** `prisma migrate deploy` (apply pending
migrations, never destructive). Today the Container App image runs
`node dist/main.js` and does **not** run any migrate command at startup —
keep it that way.

### 2. Backup before any schema or data change
Run `backend/scripts/backup-prod-db.ps1` before:
- Applying a new migration
- Running an ad-hoc SQL maintenance script
- Changing the `DATABASE_URL` secret

Backups land in the `solo-backups` storage container, retained 30 days.

### 3. Separate environments
- `DATABASE_URL` in local `.env` must point at a **dev** Postgres.
- The Container App secret `database-url` is the only place the prod URL
  lives. Never paste it into a terminal you might tab-complete from.

### 4. Destructive SQL is wrapped in transactions
See `clear-financial-data.sql`. Always:
- `BEGIN;` ... `COMMIT;`
- `psql -v ON_ERROR_STOP=1` so any error rolls back the whole script.
- Print row counts at the end.

### 5. Seed script is idempotent + scoped
`prisma/seed.ts` only **upserts** reference rows (settings, default admin).
It must never `deleteMany()` on `Order`, `User`, `Product`, etc.

### 6. Code review checklist for any DB change
- [ ] No `deleteMany({})` without a `where` clause
- [ ] No raw `TRUNCATE` outside `scripts/`
- [ ] No `prisma migrate reset` in any npm script
- [ ] If a migration drops a column, confirm a backup ran in CI first
