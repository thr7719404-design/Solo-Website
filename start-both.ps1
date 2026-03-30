# Start both Backend and Frontend

Write-Host "Starting Solo Ecommerce - Full Stack..." -ForegroundColor Cyan
Write-Host ""

# Add paths
$env:Path += ";C:\flutter\bin"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Start Backend in new window
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\aiman\OneDrive\Desktop\Solo\backend; `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); npm run start:dev"

Start-Sleep -Seconds 5

# Start Frontend in new window with HTML renderer to fix input bugs
Write-Host "Starting Flutter Frontend (HTML renderer)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\aiman\OneDrive\Desktop\Solo\frontend; `$env:Path += ';C:\flutter\bin'; flutter run -d web-server --web-port=5000 --web-renderer html"

Write-Host ""
Write-Host "Both servers starting..." -ForegroundColor Green
Write-Host "   Backend:  http://localhost:3001/api" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Login: admin@solo-ecommerce.com / AdminPassword123!" -ForegroundColor Cyan
