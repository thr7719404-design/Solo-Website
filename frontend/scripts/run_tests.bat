@echo off
REM Integration Test Runner Script for Windows

echo =====================================
echo Solo E-commerce Integration Tests
echo =====================================

REM Check if flutter is available
where flutter >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: flutter is not installed or not in PATH
    exit /b 1
)

REM Run unit tests first
echo.
echo Running Unit Tests...
flutter test test/unit/ --coverage

REM Run widget tests
echo.
echo Running Widget Tests...
flutter test test/widget/ --coverage

REM Run DTO parsing tests
echo.
echo Running DTO Parsing Tests...
flutter test test/dto/ --coverage

REM List available devices
echo.
echo Available devices:
flutter devices

echo.
echo =====================================
echo To run integration tests manually:
echo flutter test integration_test -d windows
echo =====================================
