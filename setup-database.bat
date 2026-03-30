@echo off
echo.
echo ================================================
echo  Solo Ecommerce - Docker PostgreSQL Setup
echo ================================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo.
    echo Please:
    echo 1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    echo 2. Start Docker Desktop
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo [1/5] Docker is running...

REM Stop and remove existing container if it exists
echo [2/5] Cleaning up any existing containers...
docker stop solo-postgres >nul 2>&1
docker rm solo-postgres >nul 2>&1

REM Start PostgreSQL container
echo [3/5] Starting PostgreSQL container...
docker run --name solo-postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=solo_ecommerce ^
  -p 5432:5432 ^
  -d postgres:15-alpine

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start PostgreSQL container!
    pause
    exit /b 1
)

echo [4/5] Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

REM Run migrations
echo [5/5] Running database migrations...
cd /d "%~dp0backend"
call npx prisma migrate dev --name init

if %errorlevel% neq 0 (
    echo [ERROR] Migration failed!
    echo.
    echo Make sure:
    echo - The .env file has the correct DATABASE_URL
    echo - PostgreSQL container is running: docker ps
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================
echo  SUCCESS! Database is ready!
echo ================================================
echo.
echo PostgreSQL container: solo-postgres
echo Database: solo_ecommerce
echo Port: 5432
echo.
echo Next steps:
echo   cd backend
echo   npm run seed
echo   npm run start:dev
echo.
pause
