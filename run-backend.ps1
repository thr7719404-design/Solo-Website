# Quick Start Script for Backend Server
Write-Host "Starting Solo Ecommerce Backend..." -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location "c:\Users\aiman\OneDrive\Desktop\Solo\backend"

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Start the server
Write-Host "Server starting on http://localhost:3001" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run start:dev
