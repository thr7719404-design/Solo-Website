# PostgreSQL Installation Script
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "PostgreSQL 15 Installation" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Attempting to install PostgreSQL 15..." -ForegroundColor Yellow
Write-Host ""

winget install --id PostgreSQL.PostgreSQL.15 --silent

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "If installation was successful:" -ForegroundColor Cyan
Write-Host "1. Check PostgreSQL service status:" -ForegroundColor White
Write-Host "   Get-Service postgresql*" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start service if needed:" -ForegroundColor White
Write-Host "   Start-Service postgresql-x64-15" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Create the database:" -ForegroundColor White
Write-Host "   .\create-database.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
