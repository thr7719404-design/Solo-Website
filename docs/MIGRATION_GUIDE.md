# Solo Website — Full Migration to New Domain + New Azure Subscription

**Document Version:** 1.0
**Date:** 09 May 2026
**Author:** Solo Engineering Team
**Status:** Final

---

## Overview

This guide covers the complete migration of the Solo e-commerce platform — source code, database, media assets, and Azure infrastructure — from one Azure subscription and domain to a new Azure subscription and new domain on a second PC.

---

## Prerequisites Checklist

Before you begin, have the following ready:

| Item | Where to Find It |
|------|-----------------|
| Old PostgreSQL password | `.azure/Solo-Website/` env or Azure Portal → PostgreSQL → Connection strings |
| New Azure subscription ID | Azure Portal → Subscriptions |
| New domain name | Your DNS registrar |
| DNS registrar access | GoDaddy / Namecheap / Cloudflare etc. |
| GitHub account access | https://github.com/thr7719404-design |
| `pg_dump` / `pg_restore` binaries | Installed with PostgreSQL client tools |
| AzCopy v10 | https://aka.ms/downloadazcopy-v10-windows |

---

## PHASE 0 — Set Up the Second PC

Install all required tools in order:

```powershell
# 1. Node.js 20 LTS
winget install OpenJS.NodeJS.LTS

# 2. Azure CLI
winget install Microsoft.AzureCLI

# 3. Azure Developer CLI (azd)
winget install Microsoft.Azd

# 4. Docker Desktop
winget install Docker.DockerDesktop

# 5. Git
winget install Git.Git

# 6. Python 3.11+
winget install Python.Python.3.11

# Restart terminal after installs, then verify:
node -v; az --version; azd version; docker --version; git --version
```

Also download and install PostgreSQL client tools (for `pg_dump` / `pg_restore`):
- https://www.postgresql.org/download/windows/
- During installation, select only "Command Line Tools" if you don't need the full server.

Download AzCopy v10:
- https://aka.ms/downloadazcopy-v10-windows
- Extract and add to `PATH`, or run directly with its full path.

---

## PHASE 1 — Fix Infra Code and Push to GitHub (Run on the FIRST PC)

Do this before anything else. Fix the two hardcoded values in `infra/main.bicep`, then commit everything and push to the new GitHub repository.

### 1a. Fix the Storage Account Name in main.bicep

The current name `stsolowebsite` is globally unique to the old subscription and will fail in a new one. Open `infra/main.bicep` and change:

```bicep
// BEFORE
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'stsolowebsite'

// AFTER
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'stmedia${resourceToken}'
```

### 1b. Update the Custom Domain in main.bicep

In `infra/main.bicep`, change both occurrences of the old domain:

```bicep
// In containerApp env vars — BEFORE
{ name: 'FRONTEND_URL', value: 'https://${staticWebApp.properties.defaultHostname},https://www.solotestsite.site' }

// AFTER
{ name: 'FRONTEND_URL', value: 'https://${staticWebApp.properties.defaultHostname},https://www.yournewdomain.com' }
```

```bicep
// In outputs — BEFORE
output STATIC_WEB_APP_URL string = 'https://www.solotestsite.site'

// AFTER
output STATIC_WEB_APP_URL string = 'https://www.yournewdomain.com'
```

### 1c. Update Admin Email (optional)

```bicep
{ name: 'ADMIN_EMAIL', value: 'admin@yournewdomain.com' }
```

### 1d. Commit all changes and push to the new GitHub repo

```powershell
cd "D:\Solo Website"

# Stage everything (node_modules, .azure, .env files are already git-ignored)
git add -A
git commit -m "chore: migrate to new subscription — fix storage name, update domain"

# Add the new GitHub repo as a remote and push
git remote add new-origin https://github.com/thr7719404-design/Solo-Final-Website.git
git push new-origin main

# Verify it's there
Write-Host "Push complete — https://github.com/thr7719404-design/Solo-Final-Website"
```

> **What IS pushed:** all source code, `infra/main.bicep`, `docs/`, `azure.yaml`, `docker-compose.yml`, `frontend-react/`, `backend/` (excluding `dist/`, `node_modules/`).  
> **What is NOT pushed (git-ignored):** `.azure/` (azd env + secrets), `.env` files, `node_modules/`, `dist/`, `build/`. You will recreate these on PC 2.

---

## PHASE 2 — Export the Database (Run on the FIRST PC)

Do this while still connected to the OLD Azure subscription.

```powershell
# Login and select the old subscription
az login
az account set --subscription "<OLD_SUBSCRIPTION_ID>"

# Get the old PostgreSQL hostname
$PG_HOST = az postgres flexible-server list `
    --query "[0].fullyQualifiedDomainName" -o tsv
Write-Host "Old DB host: $PG_HOST"

# Dump the full database
$env:PGPASSWORD = "<YOUR_OLD_POSTGRES_PASSWORD>"
pg_dump --host=$PG_HOST --port=5432 --username=soloadmin `
        --dbname=solo_ecommerce `
        --format=custom --no-owner --no-acl `
        --file="D:\solo_ecommerce_migration.dump"

Write-Host "Dump complete: D:\solo_ecommerce_migration.dump"
```

---

## PHASE 3 — Export Media Files from Blob Storage (Run on the FIRST PC)

```powershell
# Get the old storage account connection string
$OLD_CONN = az storage account show-connection-string `
    --name stsolowebsite `
    --resource-group rg-Solo-Website `
    --query connectionString -o tsv

# Generate a short-lived SAS token for AzCopy
$SAS = az storage container generate-sas `
    --connection-string $OLD_CONN `
    --name media `
    --permissions rl `
    --expiry (Get-Date).AddDays(7).ToString("yyyy-MM-dd") -o tsv

# Download all media blobs to a local folder
azcopy copy "https://stsolowebsite.blob.core.windows.net/media/*?$SAS" `
             "D:\media-backup\" --recursive

Write-Host "Media export complete: D:\media-backup\"
```

Transfer both `D:\solo_ecommerce_migration.dump` and `D:\media-backup\` to the second PC (USB drive, network share, or OneDrive).

---

## PHASE 4 — Clone the Repo on the Second PC

The source code is already fixed and pushed to GitHub in Phase 1. On the second PC:

```powershell
# Clone the new repo
git clone https://github.com/thr7719404-design/Solo-Final-Website.git "D:\Solo Website"
cd "D:\Solo Website"

# Install all npm dependencies
cd backend;        npm ci; cd ..
cd frontend-react; npm ci; cd ..
npm ci              # root workspace (Playwright, etc.)

Write-Host "Source code ready"
```

Verify the infra changes from Phase 1 are present:

```powershell
Select-String -Path "infra\main.bicep" -Pattern "stmedia"
Select-String -Path "infra\main.bicep" -Pattern "yournewdomain"
# Both should return matches
```

---

## PHASE 5 — Initialize azd for the New Subscription

```powershell
cd "D:\Solo Website"

# Login to the new Azure account
azd auth login

# Create a new named environment — do NOT reuse "Solo-Website"
azd env new solo-prod-new

# Point it at the new subscription and region
azd env set AZURE_SUBSCRIPTION_ID "<NEW_SUBSCRIPTION_ID>"
azd env set AZURE_LOCATION "eastus2"
azd env set AZURE_ENV_NAME "solo-prod-new"

# Set all secrets
azd env set POSTGRES_PASSWORD "<STRONG_NEW_PASSWORD>"
azd env set JWT_ACCESS_SECRET "<64_CHAR_RANDOM_STRING>"
azd env set JWT_REFRESH_SECRET "<64_CHAR_RANDOM_STRING>"
azd env set ADMIN_PASSWORD "AdminPassword123!"
```

Generate strong JWT secrets with PowerShell:

```powershell
# Generate a 64-character alphanumeric secret
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

## PHASE 7 — Restore the Database

```powershell
# Get the new DB connection details from azd environment
$NEW_PG_HOST = azd env get-value POSTGRES_FQDN
$NEW_PG_PASS = azd env get-value POSTGRES_PASSWORD

# Restore the dump
$env:PGPASSWORD = $NEW_PG_PASS
pg_restore --host=$NEW_PG_HOST --port=5432 --username=soloadmin `
           --dbname=solo_ecommerce `
           --no-owner --no-acl `
           --verbose "D:\solo_ecommerce_migration.dump"

Write-Host "Database restore complete"

# Verify row counts
psql --host=$NEW_PG_HOST --port=5432 --username=soloadmin `
     --dbname=solo_ecommerce `
     -c "SELECT tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;"
```

> The NestJS backend also runs `prisma migrate deploy` automatically on startup, so any pending schema migrations are applied on first boot.

---

## PHASE 8 — Upload Media Files to New Blob Storage

```powershell
# Get the new storage account name (it's now dynamic)
$NEW_STORAGE = az storage account list `
    --resource-group rg-Solo-Website-New `
    --query "[0].name" -o tsv

Write-Host "New storage account: $NEW_STORAGE"

# Get the connection string
$NEW_CONN = az storage account show-connection-string `
    --name $NEW_STORAGE `
    --resource-group rg-Solo-Website-New `
    --query connectionString -o tsv

# Generate a SAS token for upload
$UPLOAD_SAS = az storage container generate-sas `
    --connection-string $NEW_CONN `
    --name media `
    --permissions aclrw `
    --expiry (Get-Date).AddDays(1).ToString("yyyy-MM-dd") -o tsv

# Upload all media files from backup
azcopy copy "D:\media-backup\*" `
    "https://$NEW_STORAGE.blob.core.windows.net/media/?$UPLOAD_SAS" `
    --recursive --overwrite=true

# Verify blob count
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

| # | Phase | Tool | Est. Time |
|---|-------|------|-----------|
| 0 | Install tools on PC 2 | winget | 10 min |
| 1 | Fix `main.bicep`, commit + push to new GitHub repo | git | 5 min |
| 2 | `pg_dump` from old PostgreSQL | pg_dump | 2–5 min |
| 3 | AzCopy media blobs to local | azcopy | varies |
| 4 | `git clone` new repo on PC 2, `npm ci` | git | 5 min |
| 5 | `azd env new`, set secrets | azd | 3 min |
| 6 | `azd provision` — create all Azure resources | azd | 10–15 min |
| 7 | `pg_restore` to new PostgreSQL | pg_restore | 5–15 min |
| 8 | AzCopy media files to new Blob Storage | azcopy | varies |
| 9 | `azd deploy` — build + push + deploy | azd | 8–12 min |
| 10 | Custom domain DNS + CORS update | az CLI + registrar | 5–30 min |
| 11 | Smoke test all endpoints + UI | browser | 5 min |
| 12 | Delete old resource group | az CLI | async |

---

*End of Migration Guide.*
