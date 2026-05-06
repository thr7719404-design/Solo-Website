# Solo Ecommerce

Production e-commerce platform for the MENA market. Headless **NestJS** API + **React (Vite)** SPA, deployed on **Azure Container Apps** + **Azure Static Web Apps**, backed by **Azure Database for PostgreSQL Flexible Server** (Prisma ORM).

> **Status:** Live in production. Core checkout, BNPL (Tabby + Tamara), Stripe, returns/RMA, loyalty, admin CMS all operational.

---

## Architecture

```
┌─────────────────────┐        ┌──────────────────────────┐        ┌────────────────────┐
│  React SPA (Vite)   │ HTTPS  │  NestJS API              │ TLS    │  PostgreSQL 15     │
│  Azure Static Web   │ ─────► │  Azure Container Apps    │ ─────► │  Flexible Server   │
│  Apps (CDN edge)    │        │  (auto-scale, 2+ replicas)│        │  PITR 30d          │
└─────────────────────┘        └──────────────────────────┘        └────────────────────┘
                                          │
                                          ├──► Stripe API   (circuit-broken)
                                          ├──► Tabby API    (circuit-broken)
                                          ├──► Tamara API   (circuit-broken)
                                          ├──► SMTP         (circuit-broken)
                                          └──► Application Insights (OTel traces, 50% sampling)
```

- **Auth**: JWT + Passport, argon2 password hashing, role-based admin guard.
- **Payments**: Stripe + Tabby + Tamara with webhook signature verification + idempotency table.
- **Resilience**: opossum circuit breakers around every outbound integration; structured `pino` logs with `x-request-id` correlation.
- **Observability**: Azure Monitor / OpenTelemetry auto-instrumentation (HTTP + Postgres).
- **Security**: Helmet, CORS allowlist, `@nestjs/throttler` rate limiting, Joi env validation, `npm audit` + Dependabot in CI.

Full details: [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), [BACKEND_API_DOCUMENTATION.md](BACKEND_API_DOCUMENTATION.md).

---

## Repository Layout

```
.
├── backend/              # NestJS API (TypeScript, Prisma, Jest)
│   ├── src/              #   feature modules: auth, products, orders, stripe, bnpl, ...
│   ├── prisma/           #   schema, migrations, seeds
│   ├── scripts/          #   ops scripts (diagnostics/, fixes/, sql/, excel/)
│   └── Dockerfile
├── frontend-react/       # React 18 + Vite SPA
│   └── src/              #   pages, components, hooks, store (zustand)
├── infra/                # Bicep IaC for Azure (azd-managed)
│   ├── main.bicep
│   └── main.parameters.json
├── .github/
│   ├── workflows/        # CI: backend-check, SWA deploy
│   ├── dependabot.yml
│   └── CODEOWNERS
├── azure.yaml            # azd service definitions
└── docker-compose.yml    # local Postgres + backend
```

---

## Prerequisites

- **Node.js 20+** and **npm 10+**
- **Docker Desktop** (for local Postgres via `docker-compose`)
- **Azure CLI** + **azd** (for cloud deploy)
- PostgreSQL client (`psql`) for ad-hoc queries

---

## Local Development

```powershell
# 1. Boot local Postgres
docker compose up -d db

# 2. Backend
cd backend
copy .env.example .env       # then edit DATABASE_URL, JWT_SECRET, STRIPE_*, etc.
npm install
npx prisma migrate deploy
npm run start:dev            # http://localhost:3000/api  (Swagger: /api/docs)

# 3. Frontend (new terminal)
cd frontend-react
npm install
npm run dev                  # http://localhost:5173
```

Health checks: `GET /api/health/live`, `GET /api/health/ready`.

---

## Deployment

Azure infrastructure and application deploys are managed via **azd**:

```powershell
azd auth login
azd env select <env-name>    # or `azd env new` first time
azd provision                # apply Bicep changes (idempotent)
azd deploy backend           # build container, push to ACR, roll Container App
azd deploy frontend          # build SPA, upload to Static Web Apps
```

Secrets (`STRIPE_SECRET_KEY`, `JWT_SECRET`, `ADMIN_PASSWORD`, etc.) live in azd env vars and are wired to Container App `secretRef`s by `infra/main.bicep`. Never commit secrets — `.env*` and `token.txt` are git-ignored.

---

## Testing

```powershell
cd backend
npm test                     # Jest unit
npm run test:e2e             # supertest e2e
npm run lint
npm audit --audit-level=high
```

CI runs the same on every PR via `.github/workflows/backend-check.yml`.

---

## Operational Scripts

Ad-hoc maintenance scripts live under [backend/scripts/](backend/scripts/README.md), organized by purpose:

| Folder | Purpose |
|---|---|
| `scripts/diagnostics/` | Read-only DB / API inspection |
| `scripts/fixes/` | One-off mutations — review before running |
| `scripts/sql/` | Raw SQL (prefer Prisma migrations going forward) |
| `scripts/excel/` | Python excel import / analysis |

These are excluded from the Docker image via `backend/.dockerignore`.

---

## Documentation Index

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design and module boundaries
- [SECURITY.md](SECURITY.md) — OWASP Top 10 / ASVS Level 2 controls
- [BACKEND_API_DOCUMENTATION.md](BACKEND_API_DOCUMENTATION.md) — REST endpoints
- [DATABASE_COMPLETE_DOCUMENTATION.md](DATABASE_COMPLETE_DOCUMENTATION.md) — Prisma schema reference
- [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md) — React app structure
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) — Full doc map
- [README.legacy.md](README.legacy.md) — Previous Flutter-era README, kept for history

---

## License

Proprietary — © Solo. All rights reserved.
