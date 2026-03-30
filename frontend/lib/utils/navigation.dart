import 'package:flutter/material.dart';

/// Navigate to the Loyalty Program page
void navigateToLoyalty(BuildContext context) {
  Navigator.pushNamed(context, '/loyalty');
}

/// Navigate to a route by path
void navigateToRoute(BuildContext context, String route) {
  if (route.isEmpty) return;

  // Handle external URLs
  if (route.startsWith('http://') || route.startsWith('https://')) {
    // TODO: Open external URLs in browser
    return;
  }

  // Internal route navigation
  Navigator.pushNamed(context, route);
}
