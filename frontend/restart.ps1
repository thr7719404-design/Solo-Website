# Kill any running dart processes
taskkill /F /IM dart.exe /T 2>$null

# Wait for processes to fully terminate
Start-Sleep -Seconds 3

# Take ownership and remove build directory
if (Test-Path "build") {
    takeown /F build /R /D Y 2>$null
    icacls build /grant Everyone:F /T /C /Q 2>$null
    Remove-Item -Path build -Recurse -Force -ErrorAction SilentlyContinue
}

# Wait for file system to release
Start-Sleep -Seconds 2

# Start Flutter
flutter run -d web-server --web-port 5000
