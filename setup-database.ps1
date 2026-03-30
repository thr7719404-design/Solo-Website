# Solo Ecommerce - Docker PostgreSQL Setup Script

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host " Solo Ecommerce - Docker PostgreSQL Setup" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running!" -ForegroundColor Red
    Write-Host "`nPlease:" -ForegroundColor Yellow
    Write-Host "1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    Write-Host "2. Start Docker Desktop" -ForegroundColor White
    Write-Host "3. Run this script again`n" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

# Stop and remove existing container if it exists
Write-Host "`n[2/5] Cleaning up any existing containers..." -ForegroundColor Yellow
docker stop solo-postgres 2>$null
docker rm solo-postgres 2>$null
Write-Host "✓ Cleanup complete" -ForegroundColor Green

# Start PostgreSQL container
Write-Host "`n[3/5] Starting PostgreSQL container..." -ForegroundColor Yellow
$result = docker run --name solo-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=solo_ecommerce `
  -p 5432:5432 `
  -d postgres:15-alpine 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start PostgreSQL container!" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ PostgreSQL container started" -ForegroundColor Green

# Wait for PostgreSQL to be ready
Write-Host "`n[4/5] Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "✓ PostgreSQL is ready" -ForegroundColor Green

# Run migrations
Write-Host "`n[5/5] Running database migrations..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"

$migrateResult = npx prisma migrate dev --name init 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Migration failed!" -ForegroundColor Red
    Write-Host "`nMake sure:" -ForegroundColor Yellow
    Write-Host "- The .env file has the correct DATABASE_URL" -ForegroundColor White
    Write-Host "- PostgreSQL container is running: docker ps`n" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Migrations complete" -ForegroundColor Green

# Success message
Write-Host "`n================================================" -ForegroundColor Green
Write-Host " SUCCESS! Database is ready!" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Green

Write-Host "PostgreSQL container: solo-postgres" -ForegroundColor Cyan
Write-Host "Database: solo_ecommerce" -ForegroundColor Cyan
Write-Host "Port: 5432`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run seed" -ForegroundColor White
Write-Host "  npm run start:dev`n" -ForegroundColor White

Read-Host "Press Enter to exit"
