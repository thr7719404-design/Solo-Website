@echo off
REM ============================================================================
REM Inventory Database Setup - Simple Batch Runner
REM ============================================================================
REM Double-click this file to run the database setup wizard
REM ============================================================================

echo.
echo ================================================================================
echo     INVENTORY DATABASE SETUP WIZARD
echo ================================================================================
echo.
echo This will set up your PostgreSQL inventory database and import Excel data.
echo.
echo Press any key to continue, or close this window to cancel...
pause >nul

echo.
echo Running PowerShell setup script...
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0setup-database-complete.ps1"

if errorlevel 1 (
    echo.
    echo ================================================================================
    echo     SETUP ENCOUNTERED ERRORS
    echo ================================================================================
    echo.
    echo Please check the output above for error details.
    echo.
) else (
    echo.
    echo ================================================================================
    echo     SETUP COMPLETED SUCCESSFULLY!
    echo ================================================================================
    echo.
    echo Your database is ready to use.
    echo.
)

echo.
echo Press any key to exit...
pause >nul
