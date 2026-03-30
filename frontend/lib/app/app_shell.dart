import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../widgets/app_header/unified_app_header.dart';
import '../widgets/app_drawer/unified_app_drawer.dart';
import '../providers/catalog_provider.dart';

class AppShell extends StatefulWidget {
  final Widget child;
  final bool showDrawer;

  const AppShell({
    super.key,
    required this.child,
    this.showDrawer = true,
  });

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  @override
  void initState() {
    super.initState();
    // Load categories on app startup (uses cache if valid)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadCategories();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const UnifiedAppHeader(),
      drawer: widget.showDrawer ? const UnifiedAppDrawer() : null,
      body: widget.child,
    );
  }
}
