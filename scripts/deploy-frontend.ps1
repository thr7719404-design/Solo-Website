<#
.SYNOPSIS
    Build and deploy the React frontend to the canonical Azure Static Web App.

.DESCRIPTION
    Canonical frontend resource:
        ResourceGroup: rg-Solo-Website
        SWA Name     : swa-qlyb5greec2io
        Default host : agreeable-field-0fa189b0f.7.azurestaticapps.net
        Custom domain: https://www.solotestsite.site

    Equivalent to `azd deploy frontend` for this template; kept as a manual
    fallback in case azd is unavailable.

.NOTES
    Requirements:
      - Azure CLI signed in (az login) with access to the SWA's resource group
      - Node + npm in PATH
      - SWA CLI available via `npx @azure/static-web-apps-cli`
#>

[CmdletBinding()]
param(
    [string] $SwaName        = 'swa-qlyb5greec2io',
    [string] $ResourceGroup  = 'rg-Solo-Website',
    [string] $FrontendDir    = 'frontend-react',
    [string] $DistDir        = 'dist',
    [switch] $SkipBuild
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "==> Deploy target: $SwaName ($ResourceGroup)" -ForegroundColor Cyan

# 1. Verify .env.production exists (or generate from azd env if available).
$envFile = Join-Path $FrontendDir '.env.production'
if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Host "==> $envFile missing; trying to derive from azd env..." -ForegroundColor Yellow
    $backendUri = & azd env get-value BACKEND_URI 2>$null
    if (-not $backendUri) {
        throw "Cannot find BACKEND_URI. Either run 'azd provision' first or create $envFile manually."
    }
    "VITE_API_BASE_URL=$backendUri/api" | Set-Content -Path $envFile -Encoding utf8
    Write-Host "    wrote VITE_API_BASE_URL=$backendUri/api"
}

# 2. Build.
if (-not $SkipBuild) {
    Write-Host "==> Building frontend (npm run build)..." -ForegroundColor Cyan
    Push-Location $FrontendDir
    try {
        if (-not (Test-Path -LiteralPath 'node_modules')) {
            npm ci
            if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
        }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
    }
    finally {
        Pop-Location
    }
}

$buildOutput = Join-Path $FrontendDir $DistDir
if (-not (Test-Path -LiteralPath $buildOutput)) {
    throw "Build output not found at $buildOutput"
}

# 3. Fetch deployment token (never store it in source).
Write-Host "==> Fetching deployment token from $SwaName..." -ForegroundColor Cyan
$deploymentToken = & az staticwebapp secrets list `
    --name $SwaName `
    --resource-group $ResourceGroup `
    --query 'properties.apiKey' `
    -o tsv
if (-not $deploymentToken) {
    throw "Failed to retrieve deployment token. Are you logged into 'az' on the right subscription?"
}

# 4. Deploy via SWA CLI.
Write-Host "==> Deploying $buildOutput to $SwaName..." -ForegroundColor Cyan
$env:SWA_CLI_DEPLOYMENT_TOKEN = $deploymentToken
try {
    npx -y @azure/static-web-apps-cli deploy $buildOutput `
        --deployment-token $deploymentToken `
        --env production
    if ($LASTEXITCODE -ne 0) { throw "swa deploy failed (exit $LASTEXITCODE)" }
}
finally {
    Remove-Item Env:SWA_CLI_DEPLOYMENT_TOKEN -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "==> SUCCESS" -ForegroundColor Green
Write-Host "    https://www.solotestsite.site (after DNS+hostname binding)"
Write-Host "    https://agreeable-field-0fa189b0f.7.azurestaticapps.net"
