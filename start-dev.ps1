# Solo Ecommerce - Development Startup Script

Write-Host "🚀 Starting Solo Ecommerce Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Add Flutter and Node to PATH
$env:Path += ";C:\flutter\bin"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Navigate to project root
Set-Location "c:\Users\aiman\OneDrive\Desktop\Solo"

Write-Host "✅ Environment configured" -ForegroundColor Green
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Yellow
Write-Host "  1. Start Backend:  cd backend; npm run start:dev" -ForegroundColor White
Write-Host "  2. Start Frontend: cd frontend; flutter run -d chrome" -ForegroundColor White
Write-Host "  3. Start Both:     .\start-both.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""
