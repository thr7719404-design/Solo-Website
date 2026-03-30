# Solo Ecommerce - Complete Backend Setup & Start Script

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Solo Ecommerce - Backend Setup & Start" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\backend"

# Step 1: Check Node.js
Write-Host "[1/6] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK Node.js $nodeVersion installed" -ForegroundColor Green
    }
    else {
        throw "Node not found"
    }
}
catch {
    Write-Host "ERROR Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Check Docker
Write-Host ""
Write-Host "[2/6] Checking Docker..." -ForegroundColor Yellow
$dockerAvailable = $false
try {
    docker version 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK Docker is running" -ForegroundColor Green
        $dockerAvailable = $true
    }
}
catch {
    Write-Host "WARNING Docker is not running (using SQLite instead)" -ForegroundColor Yellow
}

# Step 3: Setup Database
Write-Host ""
Write-Host "[3/6] Setting up database..." -ForegroundColor Yellow

if ($dockerAvailable -eq $true) {
    # Use PostgreSQL via Docker
    Write-Host "Using PostgreSQL (Docker)..." -ForegroundColor Cyan
    
    # Check if container exists
    $containerExists = docker ps -a --filter "name=solo-postgres" --format "{{.Names}}" 2>$null
    
    if ($containerExists) {
        Write-Host "Starting existing PostgreSQL container..." -ForegroundColor Cyan
        docker start solo-postgres | Out-Null
    }
    else {
        Write-Host "Creating new PostgreSQL container..." -ForegroundColor Cyan
        docker run --name solo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=solo_ecommerce -p 5432:5432 -d postgres:15-alpine | Out-Null
    }
    
    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    Write-Host "OK PostgreSQL is ready" -ForegroundColor Green
}
else {
    # Use SQLite
    Write-Host "Using SQLite (file-based database)..." -ForegroundColor Cyan
    
    # Check if DATABASE_URL is set to SQLite
    $envContent = Get-Content .env -Raw
    if ($envContent -notmatch 'DATABASE_URL="file:') {
        Write-Host "WARNING Updating .env to use SQLite..." -ForegroundColor Yellow
        $envContent = $envContent -replace 'DATABASE_URL="postgresql:[^"]*"', 'DATABASE_URL="file:./dev.db"'
        Set-Content .env $envContent
    }
    
    # Check Prisma schema
    $schemaContent = Get-Content prisma\schema.prisma -Raw
    if ($schemaContent -notmatch 'provider = "sqlite"') {
        Write-Host "WARNING Updating Prisma schema to use SQLite..." -ForegroundColor Yellow
        $schemaContent = $schemaContent -replace 'provider = "postgresql"', 'provider = "sqlite"'
        Set-Content prisma\schema.prisma $schemaContent
        
        # Regenerate Prisma Client
        Write-Host "Regenerating Prisma Client..." -ForegroundColor Cyan
        npx prisma generate | Out-Null
    }
    
    Write-Host "OK SQLite configured" -ForegroundColor Green
}

# Step 4: Check if database is initialized
Write-Host ""
Write-Host "[4/6] Checking database migrations..." -ForegroundColor Yellow
$migrationsExist = Test-Path "prisma\migrations"

if ($migrationsExist -eq $false) {
    Write-Host "Running initial migration..." -ForegroundColor Cyan
    npx prisma migrate dev --name init
    Write-Host "OK Database migrated" -ForegroundColor Green
}
else {
    Write-Host "OK Database already migrated" -ForegroundColor Green
}

# Step 5: Check if database is seeded
Write-Host ""
Write-Host "[5/6] Checking database seed..." -ForegroundColor Yellow

$needsSeed = $true
if ($dockerAvailable -eq $true) {
    try {
        $productCount = docker exec solo-postgres psql -U postgres -d solo_ecommerce -t -c "SELECT COUNT(*) FROM ""Product""" 2>$null
        if ($productCount -and $productCount.Trim() -gt 0) {
            $needsSeed = $false
        }
    }
    catch {
        # Keep needsSeed as true
    }
}
else {
    if (Test-Path "dev.db") {
        $needsSeed = $false
    }
}

if ($needsSeed -eq $true) {
    Write-Host "Seeding database with sample data..." -ForegroundColor Cyan
    npm run seed
    Write-Host "OK Database seeded" -ForegroundColor Green
}
else {
    Write-Host "OK Database already has data" -ForegroundColor Green
}

# Step 6: Start the server
Write-Host ""
Write-Host "[6/6] Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host " Backend Server Starting..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "API URL: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:3001/api" -ForegroundColor White

Write-Host "Health Check: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:3001/api/health" -ForegroundColor White

Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm run start:dev

