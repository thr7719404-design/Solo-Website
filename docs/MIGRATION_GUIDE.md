# Solo Website — Full Migration to New Domain + New Azure Subscription

**Document Version:** 2.0
**Date:** 09 May 2026
**Author:** Solo Engineering Team
**Status:** Final

---

## Overview

This guide covers the complete migration of the Solo e-commerce platform — source code, database, media assets, and Azure infrastructure — from one Azure subscription and domain to a new Azure subscription and new domain.

**Everything is done from a single PC (PC 1).** The source code is already on GitHub. AzCopy copies media blobs directly between the two Azure storage accounts (server-to-server — no local download). The database is dumped and restored over the network. A second azd environment targets the new subscription alongside the old one.

```
PC 1
 │
 ├─── git push ──────────────────► GitHub (Solo-Final-Website)
 │
 ├─── pg_dump ──► (RAM pipe) ──► psql ──────────► New Azure PostgreSQL
 │
 ├─── azcopy copy (server-to-server) ──────────► New Azure Blob Storage
 │
 ├─── azd provision ────────────────────────────► New Azure subscription
 │
 └─── azd deploy ────────────────────────────────► New Container App + SWA
```

---

## Prerequisites Checklist

All of these are already satisfied on PC 1:

| Item | Status |
|------|--------|
| Source code pushed to GitHub | ✅ `https://github.com/thr7719404-design/Solo-Final-Website` |
| `infra/main.bicep` fixes (storage name + domain) | ✅ Already committed and pushed |
| Azure CLI installed | ✅ Already installed |
| Azure Developer CLI (`azd`) installed | ✅ Already installed |
| Docker Desktop installed | ✅ Already installed |
| Node.js 20 installed | ✅ Already installed |
| New Azure subscription ID | Get from Azure Portal → Subscriptions |
| New domain name | Your DNS registrar |
| Old PostgreSQL password | Azure Portal → old PostgreSQL → Connection strings |
| `pg_dump` / `pg_restore` | https://www.postgresql.org/download/windows/ (Command Line Tools only) |
| AzCopy v10 | https://aka.ms/downloadazcopy-v10-windows |

---

## PHASE 0 — Install Missing Tools (if not already present)

Only install what you don't have. On PC 1, verify first:

```powershell
node -v; az --version; azd version; docker --version; git --version
```

If `pg_dump` is missing:
- Download PostgreSQL client tools: https://www.postgresql.org/download/windows/
- Select only "Command Line Tools" during install.

If AzCopy is missing:
- Download: https://aka.ms/downloadazcopy-v10-windows
- Extract and add the folder to `PATH`, or note the full path for later commands.

---

## PHASE 1 — Source Code ✅ Already Done

The source code is already committed and pushed to the new repo:

```
https://github.com/thr7719404-design/Solo-Final-Website
```

The following fixes are already applied in `infra/main.bicep`:
- Storage account name: `stsolowebsite` → `stmedia${resourceToken}` (unique per subscription)
- Domain references: `solotestsite.site` → `yournewdomain.com` (update to your actual new domain — see Phase 1b below)

### 1b. Set your actual new domain (do this now if you know it)

Open `infra/main.bicep` and replace `yournewdomain.com` with your real domain in both places:

```powershell
# Quick check — find the placeholder lines
Select-String -Path "infra\main.bicep" -Pattern "yournewdomain"
```

Then commit and push the update:

```powershell
cd "D:\Solo Website"
git add infra/main.bicep
git commit -m "chore: set real new domain in infra"
git push new-origin main
```

---

## PHASE 2 — Capture Old Database Connection Details

No dump file is written to disk. In Phase 7, the data will be piped directly from the old PostgreSQL to the new one using a single command.

```powershell
# Confirm you are on the old subscription
az account show --query "{sub:id, name:name}" -o table

# If needed, switch back to old subscription
az account set --subscription "<OLD_SUBSCRIPTION_ID>"

# Get the old PostgreSQL hostname
$OLD_PG_HOST = az postgres flexible-server list `
    --query "[0].fullyQualifiedDomainName" -o tsv
Write-Host "Old DB host: $OLD_PG_HOST"

# Store old password — you will need it in Phase 7
# (Do not commit this to git)
$OLD_PG_PASS = "<YOUR_OLD_POSTGRES_PASSWORD>"
```

> **Why no dump file?** PostgreSQL data can be piped directly between two servers using `pg_dump | psql`. The data streams through local RAM only — never written to disk — the same principle as AzCopy server-to-server but for Postgres.

---

## PHASE 3 — Copy Media Blobs Directly to New Storage (Server-to-Server)

No local download needed. AzCopy copies directly between two Azure storage accounts over the network.

```powershell
# Still on OLD subscription — get old storage connection string
$OLD_CONN = az storage account show-connection-string `
    --name stsolowebsite `
    --resource-group rg-Solo-Website `
    --query connectionString -o tsv

# Generate a read SAS token on the OLD container (7-day window)
$SRC_SAS = az storage container generate-sas `
    --connection-string $OLD_CONN `
    --name media --permissions rl `
    --expiry (Get-Date).AddDays(7).ToString("yyyy-MM-dd") -o tsv

# Build the source URL
$SRC_URL = "https://stsolowebsite.blob.core.windows.net/media?$SRC_SAS"
Write-Host "Source ready: $SRC_URL"
```

> **Leave this terminal open** — you'll need `$SRC_URL` in Phase 8 after the new storage account is provisioned.

---

## PHASE 4 — Skip (No Second PC Needed)

Source code transfer via GitHub (Phase 1) replaces this phase entirely.

---

## PHASE 5 — Initialize azd for the New Subscription (same PC)

`azd` supports multiple named environments on the same machine. You will create a new one pointing at the new subscription, without touching the existing `Solo-Website` environment.

```powershell
cd "D:\Solo Website"

# Login / add the new Azure account (opens browser — sign in with new account credentials)
az login
# List all cached subscriptions to find the new one
az account list --query "[].{name:name, id:id}" -o table

# Switch CLI to the new subscription
az account set --subscription "<NEW_SUBSCRIPTION_ID>"

# Log azd into the new account
azd auth login

# Create a new azd environment — do NOT reuse "Solo-Website"
azd env new solo-prod-new

# Point it at the new subscription and region
azd env set AZURE_SUBSCRIPTION_ID "<NEW_SUBSCRIPTION_ID>"
azd env set AZURE_LOCATION "eastus2"
azd env set AZURE_ENV_NAME "solo-prod-new"

# Set all required secrets
azd env set POSTGRES_PASSWORD "<STRONG_NEW_PASSWORD>"
azd env set JWT_ACCESS_SECRET "<64_CHAR_RANDOM_STRING>"
azd env set JWT_REFRESH_SECRET "<64_CHAR_RANDOM_STRING>"
azd env set ADMIN_PASSWORD "AdminPassword123!"
```

Generate strong JWT secrets with PowerShell:

```powershell
# Generate a 64-character alphanumeric secret (run twice — once per secret)
-join ((65..90)+(97..122)+(48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Create the new resource group:

```powershell
az group create --name rg-Solo-Website-New --location eastus2
azd env set AZURE_RESOURCE_GROUP "rg-Solo-Website-New"
```

---

## PHASE 6 — Provision All Azure Infrastructure

```powershell
cd "D:\Solo Website"

# Creates all resources from infra/main.bicep:
#   PostgreSQL Flexible Server, ACR, Container Apps Environment,
#   Container App (backend), Static Web App (frontend),
#   Blob Storage, App Insights, Log Analytics, Managed Identity
azd provision

# Select "solo-prod-new" when prompted
# Takes approximately 10-15 minutes
```

After provisioning, capture the output values:

```powershell
azd env get-values
# Key outputs to note:
#   BACKEND_URI                        — backend Container App HTTPS URL
#   POSTGRES_FQDN                      — new PostgreSQL hostname
#   AZURE_CONTAINER_REGISTRY_ENDPOINT  — new ACR login server
#   UPLOAD_BASE_URL                    — new Blob Storage media URL
```

---

## PHASE 7 — Stream Database Directly Old → New (No Local File)

This pipes `pg_dump` output directly into `psql` on the new server. No file is written to disk — the data goes through RAM only, just like AzCopy does for blobs.

```powershell
# Get the new DB details from azd
$NEW_PG_HOST = azd env get-value POSTGRES_FQDN
$NEW_PG_PASS = azd env get-value POSTGRES_PASSWORD

# $OLD_PG_HOST and $OLD_PG_PASS were set in Phase 2
# If the terminal was closed, regenerate:
#   $OLD_PG_HOST = az postgres flexible-server list --query "[0].fullyQualifiedDomainName" -o tsv
#   $OLD_PG_PASS = "<your old password>"

# Pipe old → new (plain SQL format — psql consumes it as it arrives)
$env:PGPASSWORD = $OLD_PG_PASS
pg_dump --host=$OLD_PG_HOST --port=5432 --username=soloadmin `
        --dbname=solo_ecommerce `
        --no-owner --no-acl `
        --format=plain | `
    & { $env:PGPASSWORD = $NEW_PG_PASS; psql `
        --host=$NEW_PG_HOST --port=5432 --username=soloadmin `
        --dbname=solo_ecommerce }

Write-Host "Database migration complete — no local file was created"

# Verify row counts on the new server
$env:PGPASSWORD = $NEW_PG_PASS
psql --host=$NEW_PG_HOST --port=5432 --username=soloadmin `
     --dbname=solo_ecommerce `
     -c "SELECT tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;"
```

> The NestJS backend also runs `prisma migrate deploy` automatically on startup, so any pending schema migrations are applied on first boot.

---

## PHASE 8 — Copy Media Blobs to New Storage (Server-to-Server)

No files are downloaded to your PC. AzCopy copies directly between the two Azure storage accounts over Microsoft's backbone network — fast and free of egress charges.

```powershell
# Get the new storage account name (dynamic token — query it)
$NEW_STORAGE = az storage account list `
    --resource-group rg-Solo-Website-New `
    --query "[0].name" -o tsv
Write-Host "New storage account: $NEW_STORAGE"

# Get connection string for the new account
$NEW_CONN = az storage account show-connection-string `
    --name $NEW_STORAGE --resource-group rg-Solo-Website-New `
    --query connectionString -o tsv

# Generate a write SAS token on the new (destination) container
$DST_SAS = az storage container generate-sas `
    --connection-string $NEW_CONN `
    --name media --permissions aclrw `
    --expiry (Get-Date).AddHours(4).ToString("yyyy-MM-ddTHH:mmZ") -o tsv

$DST_URL = "https://$NEW_STORAGE.blob.core.windows.net/media?$DST_SAS"

# Server-to-server copy — no local download
# $SRC_URL was set in Phase 3; if the terminal was closed, regenerate it:
#   $OLD_CONN = az storage account show-connection-string --name stsolowebsite --resource-group rg-Solo-Website --query connectionString -o tsv
#   $SRC_SAS  = az storage container generate-sas --connection-string $OLD_CONN --name media --permissions rl --expiry (Get-Date).AddDays(1).ToString("yyyy-MM-dd") -o tsv
#   $SRC_URL  = "https://stsolowebsite.blob.core.windows.net/media?$SRC_SAS"

azcopy copy $SRC_URL $DST_URL --recursive --overwrite=true

# Verify blob count in new account
az storage blob list --connection-string $NEW_CONN `
    --container-name media --query "length(@)"
```

---

## PHASE 9 — Build and Deploy Backend + Frontend

```powershell
cd "D:\Solo Website"

# Full deploy: builds Docker image → pushes to ACR → deploys Container App
#              builds React app → deploys to Static Web App
azd deploy

# Or deploy services individually:
azd deploy backend
azd deploy frontend
```

After deploy, test the backend:

```powershell
$BACKEND = azd env get-value BACKEND_URI
Invoke-RestMethod "$BACKEND/api/health"

# Get the Static Web App default URL
$SWA = az staticwebapp list `
    --resource-group rg-Solo-Website-New `
    --query "[0].defaultHostname" -o tsv
Write-Host "Frontend (default): https://$SWA"
```

---

## PHASE 10 — Configure the New Custom Domain

### 10a. Add custom domain to the Static Web App

```powershell
$SWA_NAME = az staticwebapp list `
    --resource-group rg-Solo-Website-New `
    --query "[0].name" -o tsv

az staticwebapp hostname set `
    --name $SWA_NAME `
    --resource-group rg-Solo-Website-New `
    --hostname "www.yournewdomain.com"

# Get the CNAME validation token to add to your DNS registrar
az staticwebapp hostname show `
    --name $SWA_NAME `
    --resource-group rg-Solo-Website-New `
    --hostname "www.yournewdomain.com"
```

### 10b. Add DNS records at your registrar

Go to your DNS registrar and add:

| Type | Name | Value |
|------|------|-------|
| CNAME | www | `<value from the command above>` |
| TXT | asuid.www | `<validationToken from the command above>` |

DNS propagation takes 5–30 minutes.

### 10c. Update CORS to allow the new domain

```powershell
$CA_NAME = az containerapp list `
    --resource-group rg-Solo-Website-New `
    --query "[0].name" -o tsv

$SWA_HOST = az staticwebapp list `
    --resource-group rg-Solo-Website-New `
    --query "[0].defaultHostname" -o tsv

az containerapp update `
    --name $CA_NAME `
    --resource-group rg-Solo-Website-New `
    --set-env-vars "FRONTEND_URL=https://www.yournewdomain.com,https://$SWA_HOST"
```

---

## PHASE 11 — Smoke Test

```powershell
$BACKEND = azd env get-value BACKEND_URI

# 1. Health check
Invoke-RestMethod "$BACKEND/api/health"

# 2. Admin login
$body = @{
    email    = "admin@solo-ecommerce.com"
    password = "AdminPassword123!"
} | ConvertTo-Json

$resp  = Invoke-RestMethod "$BACKEND/api/auth/login" `
             -Method POST -Body $body -ContentType "application/json"
$token = $resp.accessToken
Write-Host "Login OK — token acquired"

# 3. Product list
Invoke-RestMethod "$BACKEND/api/products" `
    -Headers @{ Authorization = "Bearer $token" }

# 4. Check a product image URL points to the new storage account
$products = Invoke-RestMethod "$BACKEND/api/products" `
    -Headers @{ Authorization = "Bearer $token" }
$products.data[0].images | Select-Object -First 3
```

Then open a browser and verify:
- Homepage loads products
- Login / registration works
- Cart and checkout flow
- Admin panel at `/admin`
- Product images render (from new Blob Storage)

---

## PHASE 12 — Decommission Old Resources

Only after fully confirming the new environment is working correctly:

```powershell
# Switch back to the OLD subscription on any PC
az login
az account set --subscription "<OLD_SUBSCRIPTION_ID>"

# Delete the entire old resource group (irreversible)
az group delete --name rg-Solo-Website --yes --no-wait

Write-Host "Old resources scheduled for deletion"
```

> `--no-wait` returns immediately; deletion runs in the background and takes ~5 minutes.

---

## Quick Reference — All Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_SUBSCRIPTION_ID` | New Azure subscription GUID | `xxxxxxxx-xxxx-...` |
| `AZURE_LOCATION` | Azure region | `eastus2` |
| `AZURE_ENV_NAME` | azd environment name | `solo-prod-new` |
| `AZURE_RESOURCE_GROUP` | Resource group name | `rg-Solo-Website-New` |
| `POSTGRES_PASSWORD` | PostgreSQL admin password | strong random string |
| `JWT_ACCESS_SECRET` | JWT signing secret (access) | 64-char random string |
| `JWT_REFRESH_SECRET` | JWT signing secret (refresh) | 64-char random string |
| `ADMIN_PASSWORD` | Bootstrap admin user password | `AdminPassword123!` |

---

## Full Phase Summary

| # | Phase | Tool | PC | Est. Time |
|---|-------|------|-----|-----------|
| 0 | Verify / install pg_dump + AzCopy if missing | winget | PC 1 | 5 min |
| 1 | Source code already on GitHub ✅ (set real domain if known) | git | PC 1 | 2 min |
| 2 | Capture old DB host + credentials (no dump file) | az CLI | PC 1 | 1 min |
| 3 | Prepare old Blob SAS token for server-to-server copy | az CLI | PC 1 | 1 min |
| 4 | _(skipped — no second PC needed)_ | — | — | — |
| 5 | `azd env new`, login to new sub, set secrets | azd | PC 1 | 5 min |
| 6 | `azd provision` — create all Azure resources | azd | PC 1 | 10–15 min |
| 7 | `pg_dump \| psql` pipe old → new (RAM only, no disk) | pg_dump + psql | PC 1 | 5–15 min |
| 8 | AzCopy server-to-server blob copy | azcopy | PC 1 | varies |
| 9 | `azd deploy` — build + push Docker image + deploy SWA | azd | PC 1 | 8–12 min |
| 10 | Custom domain DNS + CORS update | az CLI + registrar | PC 1 | 5–30 min |
| 11 | Smoke test all endpoints + UI | browser | PC 1 | 5 min |
| 12 | Delete old resource group | az CLI | PC 1 | async |

---

*End of Migration Guide.*
