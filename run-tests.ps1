# Solo E-commerce - Full Test Suite Runner
# This script runs all tests across backend and frontend

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$E2EOnly,
    [switch]$Coverage
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Solo E-commerce Test Suite" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$RootDir = $PSScriptRoot

# Backend Tests
if (-not $FrontendOnly) {
    Write-Host "Running Backend Tests..." -ForegroundColor Yellow
    Set-Location "$RootDir\backend"
    
    if ($E2EOnly) {
        Write-Host "Running E2E tests only..." -ForegroundColor Gray
        npm run test:e2e:only
    } else {
        Write-Host "Running setup and E2E tests..." -ForegroundColor Gray
        npm run test:e2e
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Backend tests had failures" -ForegroundColor Red
        $ErrorCount++
    } else {
        Write-Host "Backend tests passed" -ForegroundColor Green
    }
    Write-Host ""
}

# Frontend Tests
if (-not $BackendOnly) {
    Write-Host "Running Frontend Tests..." -ForegroundColor Yellow
    Set-Location "$RootDir\frontend"
    
    # Unit tests
    Write-Host "Running unit tests..." -ForegroundColor Gray
    if ($Coverage) {
        flutter test test/unit/ --coverage
    } else {
        flutter test test/unit/
    }
    if ($LASTEXITCODE -ne 0) { $ErrorCount++ }
    
    # Widget tests
    Write-Host "Running widget tests..." -ForegroundColor Gray
    if ($Coverage) {
        flutter test test/widget/ --coverage
    } else {
        flutter test test/widget/
    }
    if ($LASTEXITCODE -ne 0) { $ErrorCount++ }
    
    # DTO tests
    Write-Host "Running DTO parsing tests..." -ForegroundColor Gray
    flutter test test/dto/
    if ($LASTEXITCODE -ne 0) { $ErrorCount++ }
    
    Write-Host ""
}

# Integration Tests (requires device)
if ($E2EOnly -or (-not $BackendOnly -and -not $FrontendOnly)) {
    Write-Host "Integration Tests Note:" -ForegroundColor Yellow
    Write-Host "To run Flutter integration tests, use:" -ForegroundColor Gray
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  flutter test integration_test -d windows" -ForegroundColor White
    Write-Host ""
}

Set-Location $RootDir

Write-Host "=====================================" -ForegroundColor Cyan
if ($ErrorCount -eq 0) {
    Write-Host "  All tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host "  Some tests had failures ($ErrorCount)" -ForegroundColor Red
}
Write-Host "=====================================" -ForegroundColor Cyan

exit $ErrorCount
