# Solo E-commerce - Start Services Script
# This script starts both the backend and frontend services

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║   🛍️  Solo E-commerce - Starting Services            ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Add Flutter to PATH
$env:Path += ";C:\flutter\bin"

# Get the current directory
$projectRoot = $PSScriptRoot

# Start Backend in new window
Write-Host "🚀 Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; npm run start:dev"

# Wait a bit for backend to initialize
Start-Sleep -Seconds 5

# Start Frontend in new window
Write-Host "🎨 Starting Flutter Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path += ';C:\flutter\bin'; cd '$projectRoot\frontend'; flutter run -d web-server --web-port=5000"

Write-Host ""
Write-Host "✅ Services starting in separate windows..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3000/api" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Admin Login:" -ForegroundColor Cyan
Write-Host "   Email:    admin@solo-ecommerce.com" -ForegroundColor White
Write-Host "   Password: AdminPassword123!" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Alternative Admin:" -ForegroundColor Cyan
Write-Host "   Email:    aiman@solo-ecommerce.com" -ForegroundColor White
Write-Host "   Password: Admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
