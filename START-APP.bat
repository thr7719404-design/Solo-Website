@echo off
SETLOCAL
cd /d "%~dp0"

echo ====================================
echo Starting Solo E-commerce Services   
echo ====================================
echo.

echo [1/2] Starting Backend Server...
start "Backend Server" powershell -NoExit -Command "cd C:\Users\thr49\Test-website\backend; npm run start:dev"

timeout /t 8 /nobreak >nul

echo [2/2] Starting Frontend Server...
start "Frontend Server" powershell -NoExit -Command "cd C:\Users\thr49\Test-website\frontend; C:\Users\thr49\AppData\Local\Pub\Cache\bin\dhttpd.bat --host=0.0.0.0 --port=5000 --path=C:\Users\thr49\Test-website\frontend\build\web"

echo.
echo ====================================
echo Services Starting
echo ====================================
echo Backend:  http://localhost:3000/api
echo Frontend: http://localhost:5000
echo.
echo Login Credentials:
echo   Email: aiman@solo-ecommerce.com
echo   Password: Admin123
echo ====================================
echo.
pause
