# =====================================================================
# backup-prod-db.ps1
# Take a custom-format pg_dump of the production Postgres database.
#
# Usage (from any directory):
#   pwsh -File "d:\Solo Website\backend\scripts\backup-prod-db.ps1"
#
# Requires:
#   - psql / pg_dump in PATH (auto-prepends C:\Program Files\PostgreSQL\16\bin)
#   - `az login` already done with access to the rg-Solo-Website resource group
#   - your current public IP must be allowed in Postgres firewall
#     (script tries to add a temp rule and removes it on exit)
#
# Output:
#   d:\Solo Website\backups\prod-<timestamp>.dump
# =====================================================================

[CmdletBinding()]
param(
  [string]$ResourceGroup       = 'rg-Solo-Website',
  [string]$Server              = 'pg-qlyb5greec2io',
  [string]$ContainerApp        = 'backend-qlyb5greec2io',
  [string]$SecretName          = 'database-url',
  [string]$BackupDir           = 'd:\Solo Website\backups',
  [int]   $MinExpectedSizeBytes = 100000
)

$ErrorActionPreference = 'Stop'

# 1. Tools
$pgBin = 'C:\Program Files\PostgreSQL\16\bin'
if (Test-Path $pgBin) { $env:PATH = "$pgBin;$env:PATH" }
foreach ($t in @('psql','pg_dump','az')) {
  if (-not (Get-Command $t -ErrorAction SilentlyContinue)) {
    throw "Required tool not found in PATH: $t"
  }
}

# 2. Get my public IP
try {
  $myIp = (Invoke-RestMethod -Uri 'https://api.ipify.org' -TimeoutSec 10).Trim()
} catch {
  throw "Could not detect public IP via api.ipify.org: $_"
}
Write-Host "Public IP: $myIp"

# 3. Open temp firewall rule
$ruleName = 'tmp-backup-' + (Get-Date -Format 'yyyyMMddHHmmss')
Write-Host "Opening firewall rule '$ruleName' for $myIp ..."
az postgres flexible-server firewall-rule create `
  --resource-group $ResourceGroup --name $Server `
  --rule-name $ruleName `
  --start-ip-address $myIp --end-ip-address $myIp | Out-Null

try {
  # 4. Pull DATABASE_URL from container app and strip Prisma-only `schema=` param
  Write-Host 'Fetching DATABASE_URL from Container App secret ...'
  $rawUrl = $null
  for ($i = 0; $i -lt 3 -and -not $rawUrl; $i++) {
    $rawUrl = az containerapp secret show `
      --name $ContainerApp --resource-group $ResourceGroup `
      --secret-name $SecretName --query value -o tsv 2>$null
    if (-not $rawUrl) { Start-Sleep -Seconds 5 }
  }
  if (-not $rawUrl) { throw 'Failed to retrieve database-url secret after 3 attempts.' }

  $uri     = [System.Uri]$rawUrl
  $query   = $uri.Query.TrimStart('?') -split '&' |
             Where-Object { $_ -and $_ -notmatch '^schema=' }
  $builder = [System.UriBuilder]::new($uri)
  $builder.Query = ($query -join '&')
  $dbUrl   = $builder.Uri.AbsoluteUri

  # 5. Run pg_dump
  if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
  }
  $ts     = Get-Date -Format 'yyyyMMddHHmmss'
  $backup = Join-Path $BackupDir "prod-$ts.dump"
  Write-Host "Dumping to: $backup"
  pg_dump --format=custom --no-owner --no-acl --dbname=$dbUrl --file=$backup

  if (-not (Test-Path $backup)) { throw "pg_dump did not produce $backup" }
  $size = (Get-Item $backup).Length
  if ($size -lt $MinExpectedSizeBytes) {
    throw "Backup file is suspiciously small ($size bytes). Aborting."
  }
  Write-Host "OK  Backup size: $size bytes"
  Write-Host "OK  Backup path: $backup"
}
finally {
  Write-Host "Removing firewall rule '$ruleName' ..."
  az postgres flexible-server firewall-rule delete `
    --resource-group $ResourceGroup --name $Server `
    --rule-name $ruleName --yes 2>$null | Out-Null
  Write-Host 'Firewall rule removed.'
}
