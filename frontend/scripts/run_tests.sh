#!/bin/bash
# Integration Test Runner Script

echo "====================================="
echo "Solo E-commerce Integration Tests"
echo "====================================="

# Check if flutter is available
if ! command -v flutter &> /dev/null; then
    echo "Error: flutter is not installed or not in PATH"
    exit 1
fi

# Run unit tests first
echo ""
echo "Running Unit Tests..."
flutter test test/unit/ --coverage

# Run widget tests
echo ""
echo "Running Widget Tests..."
flutter test test/widget/ --coverage

# Run DTO parsing tests
echo ""
echo "Running DTO Parsing Tests..."
flutter test test/dto/ --coverage

# Run integration tests (requires a device)
echo ""
echo "Running Integration Tests..."
echo "Note: Integration tests require a connected device or emulator"
echo "Use: flutter test integration_test -d <device_id>"
echo "Or:  flutter test integration_test -d windows (for Windows)"

# List available devices
flutter devices

echo ""
echo "====================================="
echo "To run integration tests manually:"
echo "flutter test integration_test -d windows"
echo "====================================="
