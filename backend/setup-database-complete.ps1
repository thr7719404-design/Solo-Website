# ============================================================================
# Automated Database Setup Script
# ============================================================================
# This script automates the entire database setup and import process
#
# Prerequisites:
# - PostgreSQL installed and running
# - Python 3.8+ installed
# - Excel file in Downloads folder
# ============================================================================

param(
    [string]$DbName = "inventory_db",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432"
)

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "INVENTORY DATABASE SETUP WIZARD" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

# Check if PostgreSQL is running
Write-Host "`nStep 1: Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($null -eq $pgService) {
    Write-Host "  WARNING: PostgreSQL service not found!" -ForegroundColor Red
    Write-Host "  Please ensure PostgreSQL is installed and running." -ForegroundColor Red
    $continue = Read-Host "  Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
} else {
    if ($pgService.Status -eq 'Running') {
        Write-Host "  PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "  ! PostgreSQL is not running. Attempting to start..." -ForegroundColor Yellow
        Start-Service $pgService.Name
        Start-Sleep -Seconds 3
        Write-Host "  PostgreSQL started" -ForegroundColor Green
    }
}

# Install Python dependencies
Write-Host "`nStep 2: Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install --user pandas openpyxl psycopg2-binary --no-warn-script-location
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ! Warning: Some dependencies may have failed to install" -ForegroundColor Yellow
}

# Check if database exists
Write-Host "`nStep 3: Checking database..." -ForegroundColor Yellow
$env:PGPASSWORD = $DbPassword
$dbExists = psql -h $DbHost -p $DbPort -U $DbUser -lqt 2>$null | Select-String -Pattern $DbName

if ($dbExists) {
    Write-Host "  ! Database '$DbName' already exists" -ForegroundColor Yellow
    $recreate = Read-Host "  Do you want to DROP and recreate it? (y/n)"
    
    if ($recreate -eq 'y') {
        Write-Host "  Dropping existing database..." -ForegroundColor Yellow
        
        # Terminate existing connections
        $terminateQuery = "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DbName' AND pid <> pg_backend_pid();"
        psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c $terminateQuery 2>$null | Out-Null
        
        # Drop database
        $dropQuery = "DROP DATABASE IF EXISTS $DbName;"
        psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c $dropQuery 2>$null
        
        # Create database
        Write-Host "  Creating database..." -ForegroundColor Yellow
        $createQuery = "CREATE DATABASE $DbName;"
        psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c $createQuery
        Write-Host "  Database recreated" -ForegroundColor Green
    }
} else {
    Write-Host "  Creating database '$DbName'..." -ForegroundColor Yellow
    $createQuery = "CREATE DATABASE $DbName;"
    psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c $createQuery 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Database created" -ForegroundColor Green
    } else {
        Write-Host "  Failed to create database" -ForegroundColor Red
        Write-Host "  Please check your PostgreSQL credentials and try again." -ForegroundColor Red
        exit 1
    }
}

# Run schema SQL
Write-Host "`nStep 4: Creating database schema..." -ForegroundColor Yellow
$schemaFile = Join-Path $PSScriptRoot "database_schema.sql"

if (Test-Path $schemaFile) {
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $schemaFile 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Schema created successfully" -ForegroundColor Green
    } else {
        Write-Host "  Schema creation failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  Schema file not found: $schemaFile" -ForegroundColor Red
    exit 1
}

# Update import script with connection details
Write-Host "`nStep 5: Configuring import script..." -ForegroundColor Yellow
$importScript = Join-Path $PSScriptRoot "import_excel_to_db.py"

if (Test-Path $importScript) {
    $content = Get-Content $importScript -Raw
    $content = $content -replace "('host':\s*)'[^']*'", "`$1'$DbHost'"
    $content = $content -replace "('port':\s*)[\d]*", "`$1$DbPort"
    $content = $content -replace "('database':\s*)'[^']*'", "`$1'$DbName'"
    $content = $content -replace "('user':\s*)'[^']*'", "`$1'$DbUser'"
    $content = $content -replace "('password':\s*)'[^']*'", "`$1'$DbPassword'"
    $content | Set-Content $importScript -NoNewline
    Write-Host "  Import script configured" -ForegroundColor Green
} else {
    Write-Host "  ✗ Import script not found: $importScript" -ForegroundColor Red
    exit 1
}

# Check for Excel file
Write-Host "`nStep 6: Checking Excel file..." -ForegroundColor Yellow
$excelFile = "C:\Users\$env:USERNAME\Downloads\Data Sheet with UAE Prices 2025 2026  Sent to Aiment and Tarek 21.12.2025 (2).xlsx"

if (Test-Path $excelFile) {
    Write-Host "  Excel file found" -ForegroundColor Green
} else {
    Write-Host "  ! Excel file not found at default location" -ForegroundColor Yellow
    Write-Host "  Expected: $excelFile" -ForegroundColor Yellow
    $customPath = Read-Host "  Enter full path to Excel file (or press Enter to skip import)"
    
    if ($customPath) {
        if (Test-Path $customPath) {
            $excelFile = $customPath
            Write-Host "  Using custom file path" -ForegroundColor Green
        } else {
            Write-Host "  ✗ File not found: $customPath" -ForegroundColor Red
            Write-Host "  Skipping import..." -ForegroundColor Yellow
            $excelFile = $null
        }
    } else {
        $excelFile = $null
    }
}

# Run import
if ($excelFile) {
    Write-Host "`nStep 7: Importing data from Excel..." -ForegroundColor Yellow
    Write-Host "  This may take several minutes depending on data size..." -ForegroundColor Cyan
    
    python $importScript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Import completed successfully" -ForegroundColor Green
    } else {
        Write-Host "  ! Import completed with some errors" -ForegroundColor Yellow
        Write-Host "  Check the output above for details" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nStep 7: Skipping data import" -ForegroundColor Yellow
}

# Final summary
Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Cyan

Write-Host "`nDatabase Connection Details:" -ForegroundColor Cyan
Write-Host "  Host: $DbHost" -ForegroundColor White
Write-Host "  Port: $DbPort" -ForegroundColor White
Write-Host "  Database: $DbName" -ForegroundColor White
Write-Host "  Username: $DbUser" -ForegroundColor White

Write-Host "`nConnection String:" -ForegroundColor Cyan
Write-Host "  postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Connect to the database using psql or pgAdmin" -ForegroundColor White
Write-Host "  2. Run queries using the views:" -ForegroundColor White
Write-Host "     - SELECT * FROM vw_products_complete;" -ForegroundColor Gray
Write-Host "     - SELECT * FROM vw_current_inventory;" -ForegroundColor Gray
Write-Host "  3. Integrate with your NestJS backend" -ForegroundColor White
Write-Host "  4. Read DATABASE_README.md for detailed documentation" -ForegroundColor White

Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan

# Open database in default application
$openDb = Read-Host "`nWould you like to open pgAdmin or psql now? (pgadmin/psql/n)"

if ($openDb -eq 'pgadmin') {
    Start-Process "pgadmin4"
} elseif ($openDb -eq 'psql') {
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName
}

Write-Host "`nThank you for using the Database Setup Wizard!" -ForegroundColor Green
