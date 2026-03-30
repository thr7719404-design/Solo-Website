# PostgreSQL Setup Script for Solo E-commerce Platform
# This script installs PostgreSQL 15 on Windows

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "PostgreSQL 15 Setup for Solo E-commerce Platform" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script should be run as Administrator for best results." -ForegroundColor Yellow
    Write-Host "   However, we'll continue with user installation..." -ForegroundColor Yellow
    Write-Host ""
}

# Option 1: Install via winget
Write-Host "📦 Attempting to install PostgreSQL 15 via winget..." -ForegroundColor Cyan
Write-Host ""

try {
    # Try to install PostgreSQL
    winget install --id PostgreSQL.PostgreSQL.15 --silent --accept-package-agreements --accept-source-agreements
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL 15 installed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 IMPORTANT: Please note the password you set during installation." -ForegroundColor Yellow
        Write-Host "   Default username is: postgres" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🔄 You may need to restart your terminal for PATH changes to take effect." -ForegroundColor Yellow
        Write-Host ""
        
        # Wait for PostgreSQL service to start
        Write-Host "⏳ Waiting for PostgreSQL service to start..." -ForegroundColor Cyan
        Start-Sleep -Seconds 10
        
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Green
        Write-Host "1. Open a NEW PowerShell window (to get updated PATH)" -ForegroundColor White
        Write-Host "2. Run: cd c:\Users\aiman\OneDrive\Desktop\Solo" -ForegroundColor White
        Write-Host "3. Run: .\create-database.ps1" -ForegroundColor White
        Write-Host ""
    }
    elseif ($LASTEXITCODE -eq -1978335189) {
        Write-Host "ℹ️  PostgreSQL is already installed!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next step: Run .\create-database.ps1" -ForegroundColor Green
        Write-Host ""
    }
    else {
        throw "Installation failed with exit code: $LASTEXITCODE"
    }
}
catch {
    Write-Host "❌ Winget installation failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 MANUAL INSTALLATION REQUIRED:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please download and install PostgreSQL manually:" -ForegroundColor White
    Write-Host "1. Visit: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" -ForegroundColor Cyan
    Write-Host "2. Download PostgreSQL 15.x for Windows x86-64" -ForegroundColor White
    Write-Host "3. Run the installer with these settings:" -ForegroundColor White
    Write-Host "   - Password: postgres" -ForegroundColor Yellow
    Write-Host "   - Port: 5432" -ForegroundColor Yellow
    Write-Host "   - Locale: Default" -ForegroundColor Yellow
    Write-Host "4. After installation, run: .\create-database.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Alternative - Use Docker (if you have it installed):" -ForegroundColor White
    Write-Host "   docker run --name solo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=solo_ecommerce -p 5432:5432 -d postgres:15-alpine" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
