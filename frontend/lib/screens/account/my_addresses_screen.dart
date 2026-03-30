import 'package:flutter/material.dart';
import 'account_shell.dart';

/// Standalone My Addresses Screen for storefront
/// Routes directly to AccountShell with Addresses tab selected
class MyAddressesScreen extends StatelessWidget {
  const MyAddressesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Delegate to AccountShell with addresses tab (index 3)
    return const AccountShell(initialIndex: 3);
  }
}
