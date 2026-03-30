# -----------------------------
# Postgres "latest only" backup
# Output: .\backups\latest.dump
# -----------------------------

$BackupDir = Join-Path $PSScriptRoot "backups"
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# ---- EDIT THESE ----
$DbName = "solo_ecommerce"          # <-- your DEV database name
$DbHost = "localhost"
$Port   = "5433"                    # Updated to match your PostgreSQL 17 port
$User   = "postgres"
# --------------------

# Optional: set password in this session only (safer than hardcoding in the file)
# Uncomment the next line and enter your password when prompted:
# $env:PGPASSWORD = Read-Host -AsSecureString "Enter DB password" | ConvertFrom-SecureString

$OutFile = Join-Path $BackupDir "latest.dump"

Write-Host "Backing up database '$DbName' to $OutFile ..."

# PostgreSQL 17 path
$PgDump = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"

& $PgDump `
  -h $DbHost -p $Port -U $User `
  -F c -Z 9 `
  --no-owner --no-privileges `
  -f $OutFile `
  $DbName

if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed with exit code $LASTEXITCODE"
}

Write-Host "✅ Backup complete: $OutFile"
