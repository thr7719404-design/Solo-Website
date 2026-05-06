# backend/scripts

Operational and maintenance scripts. **Not** part of the runtime container image —
excluded via `.dockerignore`. Run locally against the appropriate environment with
explicit `DATABASE_URL` set.

## Layout

| Folder | Contents | Purpose |
|---|---|---|
| `diagnostics/` | `check-*.js`, `test-*.js` | Read-only DB / API inspection. Safe to run in any env. |
| `fixes/` | `fix-*.js`, `reset-*.js`, `update-*.js`, `migrate-*.js`, `enable-*.js`, `backup-*.js`, `create-*.js` | One-off mutation scripts. **Destructive — review before running.** |
| `sql/` | `*.sql` | Raw DDL / seed SQL. Prefer Prisma migrations for schema changes going forward. |
| `excel/` | `*.py` | Excel import / analysis tooling (Python). |
| (root) | `apply-pending-migrations.mjs`, `backup-prod-db.ps1`, `seed_categories_tree.js`, `replace_categories.js`, `migrate_inventory_schema.ts`, `verify_inventory_migration.ts`, `test-setup.ts` | Maintained pipeline scripts referenced from CI / npm scripts. |

## Conventions

- New schema changes go through `prisma migrate dev` / `prisma migrate deploy`, not `sql/`.
- New diagnostics should be TypeScript and live under `diagnostics/`.
- Anything in `fixes/` is fire-and-forget — once applied to all envs, delete it.
- Always set `DATABASE_URL` explicitly; do not rely on `.env` defaults for prod operations.
