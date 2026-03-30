/// Integration Test Driver
///
/// Run tests with:
/// - flutter test integration_test (simple)
/// - flutter drive --driver=test_driver/integration_test.dart --target=integration_test/app_test.dart (with driver)
library;

import 'package:integration_test/integration_test_driver.dart';

Future<void> main() => integrationDriver();
