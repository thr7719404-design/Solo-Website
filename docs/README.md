# Solo E-Commerce — Documentation Index

> **Single source of truth.** This is the canonical, current documentation set
> for the Solo E-Commerce platform. Older standalone docs at the repo root
> remain for historical context but are superseded by the documents in this
> folder. Date: May 2026.

## Audience map

| If you are… | Start here |
|---|---|
| New engineer | [01 Scope & Vision](./01-scope-and-vision.md) → [03 High-Level Design](./03-high-level-design.md) |
| Backend engineer | [04 Low-Level Design](./04-low-level-design.md) → [06 API Reference](./06-api-reference.md) |
| Frontend engineer | [07 Frontend Architecture](./07-frontend-architecture.md) |
| DBA / data engineer | [05 Database & ER Diagram](./05-database-er-diagram.md) |
| SRE / DevOps | [09 Deployment & Operations](./09-deployment-and-operations.md) |
| Security reviewer | [08 Security & Compliance](./08-security-and-compliance.md) |
| QA / test engineer | [10 Testing & QA](./10-testing-and-qa.md) |
| Product / business | [01 Scope & Vision](./01-scope-and-vision.md) → [02 Functional Spec](./02-functional-spec.md) |

## Document set

1. [Scope & Vision](./01-scope-and-vision.md) — business context, goals, personas, non-goals
2. [Functional Specification](./02-functional-spec.md) — user-facing features and flows
3. [High-Level Design](./03-high-level-design.md) — system architecture, components, data flow
4. [Low-Level Design](./04-low-level-design.md) — module-level design of each backend domain
5. [Database & ER Diagram](./05-database-er-diagram.md) — schema, entities, relationships, indexes
6. [API Reference](./06-api-reference.md) — REST endpoint catalogue grouped by controller
7. [Frontend Architecture](./07-frontend-architecture.md) — React + Vite SPA layout, state, routing
8. [Security & Compliance](./08-security-and-compliance.md) — auth, RBAC, OWASP posture, secrets
9. [Deployment & Operations](./09-deployment-and-operations.md) — Azure topology, CI/CD, runbooks
10. [Testing & QA](./10-testing-and-qa.md) — test pyramid, smoke, unit, E2E, coverage matrix

## Quick reference

| Item | Value |
|---|---|
| Backend (live) | `https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io` |
| Frontend (live) | `https://agreeable-field-0fa189b0f.7.azurestaticapps.net/` |
| Region | `eastus2` |
| Azure RG | `rg-Solo-Website` |
| Backend stack | NestJS 10 · Prisma 5 · PostgreSQL 14 · Node 20 |
| Frontend stack | React 19 · Vite 6 · TypeScript 5 · Zustand 5 · React-Router 7 |
| Hosting | Azure Container Apps (backend) · Azure Static Web Apps (frontend) |
| Database | Azure Database for PostgreSQL Flexible Server |
| Object storage | Azure Blob Storage (`media` container) |
| Payments | Stripe (cards) · Tabby · Tamara (BNPL) |
| Currency | AED (UAE Dirham) — VAT 5% |
| IaC | Bicep ([infra/main.bicep](../infra/main.bicep)) |
| Orchestration | `azd` (Azure Developer CLI) |

## Conventions used in this docs set

- All API paths are shown with the global `/api` prefix.
- Code references use repo-relative paths.
- Diagrams are Mermaid so they render in GitHub / VS Code.
- `[deferred]`, `[planned]`, `[deprecated]` tags flag forward-looking items.
