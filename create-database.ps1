# Database Creation Script for Solo E-commerce Platform
# This script creates the database and runs migrations

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Database Setup for Solo E-commerce Platform" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Set PostgreSQL connection details
$env:PGPASSWORD = "postgres"
$dbName = "solo_ecommerce"
$dbUser = "postgres"
$dbHost = "localhost"
$dbPort = "5432"

# Test PostgreSQL connection
Write-Host "🔍 Testing PostgreSQL connection..." -ForegroundColor Cyan
try {
    $testConnection = & psql -U $dbUser -h $dbHost -p $dbPort -d postgres -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Cannot connect to PostgreSQL server!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
        Write-Host "1. Make sure PostgreSQL is installed (run .\setup-postgresql.ps1)" -ForegroundColor White
        Write-Host "2. Check if PostgreSQL service is running:" -ForegroundColor White
        Write-Host "   Get-Service postgresql*" -ForegroundColor Cyan
        Write-Host "3. If service is stopped, start it:" -ForegroundColor White
        Write-Host "   Start-Service postgresql-x64-15" -ForegroundColor Cyan
        Write-Host "4. Verify password is 'postgres' or update .env file" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    
    Write-Host "✅ PostgreSQL connection successful!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error testing connection: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure 'psql' command is available in your PATH." -ForegroundColor Yellow
    Write-Host "You may need to restart your terminal after installing PostgreSQL." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if database already exists
Write-Host "🔍 Checking if database '$dbName' exists..." -ForegroundColor Cyan
$dbExists = & psql -U $dbUser -h $dbHost -p $dbPort -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName'" 2>&1

if ($dbExists -eq "1") {
    Write-Host "⚠️  Database '$dbName' already exists!" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to drop and recreate it? This will DELETE ALL DATA! (yes/no)"
    
    if ($response -eq "yes") {
        Write-Host "🗑️  Dropping existing database..." -ForegroundColor Yellow
        & psql -U $dbUser -h $dbHost -p $dbPort -d postgres -c "DROP DATABASE $dbName;" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to drop database! Make sure no connections are active." -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ Database dropped successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "ℹ️  Skipping database creation. Will run migrations on existing database..." -ForegroundColor Cyan
        Write-Host ""
    }
}
else {
    # Create database
    Write-Host "📦 Creating database '$dbName'..." -ForegroundColor Cyan
    & psql -U $dbUser -h $dbHost -p $dbPort -d postgres -c "CREATE DATABASE $dbName;" 2>&1 | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create database!" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Database created successfully!" -ForegroundColor Green
    Write-Host ""
}

# Navigate to backend directory
Set-Location -Path "c:\Users\aiman\OneDrive\Desktop\Solo\backend"

# Run Prisma migrations
Write-Host "🔄 Running Prisma migrations..." -ForegroundColor Cyan
Write-Host ""

try {
    $migrateOutput = npx prisma migrate dev --name init 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host $migrateOutput
        exit 1
    }
    
    Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error running migrations: $_" -ForegroundColor Red
    exit 1
}

# Seed database
Write-Host "🌱 Seeding database with sample data..." -ForegroundColor Cyan
Write-Host "   This will create 800+ products across 7 departments..." -ForegroundColor Gray
Write-Host ""

try {
    $seedOutput = npm run seed 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Seeding encountered issues, but database is ready!" -ForegroundColor Yellow
        Write-Host $seedOutput
    } else {
        Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
        Write-Host ""
    }
} catch {
    Write-Host "⚠️  Seeding skipped or failed: $_" -ForegroundColor Yellow
    Write-Host "   You can run 'npm run seed' manually later." -ForegroundColor Gray
    Write-Host ""
}

Write-Host "====================================================" -ForegroundColor Green
Write-Host "✅ DATABASE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   npm run start:dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. The API will be available at:" -ForegroundColor White
Write-Host "   http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. API Documentation:" -ForegroundColor White
Write-Host "   http://localhost:3001/api" -ForegroundColor Cyan
Write-Host ""

# Clean up
$env:PGPASSWORD = $null

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
