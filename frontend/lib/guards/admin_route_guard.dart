import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../screens/admin/admin_login_screen.dart';

/// Route guard that requires ADMIN or SUPER_ADMIN role
///
/// Shows a login screen if user is not authenticated or doesn't have admin role.
class AdminRouteGuard extends StatefulWidget {
  final Widget child;

  const AdminRouteGuard({
    super.key,
    required this.child,
  });

  @override
  State<AdminRouteGuard> createState() => _AdminRouteGuardState();
}

class _AdminRouteGuardState extends State<AdminRouteGuard> {
  bool _isLoading = true;
  bool _isAuthorized = false;
  bool _showLogin = false;
  String? _userName;

  @override
  void initState() {
    super.initState();
    _checkAuthorization();
  }

  Future<void> _checkAuthorization() async {
    try {
      final user = await ApiService.auth.getCurrentUser();

      if (user.role == 'ADMIN' || user.role == 'SUPER_ADMIN') {
        setState(() {
          _isAuthorized = true;
          _isLoading = false;
          _userName = user.firstName ?? 'Admin';
        });
      } else {
        // User is logged in but not admin - show login form
        setState(() {
          _isAuthorized = false;
          _isLoading = false;
          _showLogin = true;
        });
      }
    } catch (e) {
      debugPrint('AdminRouteGuard: Error checking auth: $e');
      // Not logged in - show login form
      setState(() {
        _isAuthorized = false;
        _isLoading = false;
        _showLogin = true;
      });
    }
  }

  void _onLoginSuccess() {
    // Re-check authorization after successful login
    setState(() {
      _isLoading = true;
      _showLogin = false;
    });
    _checkAuthorization();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                color: Colors.black,
                strokeWidth: 2,
              ),
              const SizedBox(height: 16),
              Text(
                'Verifying access...',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_showLogin || !_isAuthorized) {
      return AdminLoginScreen(
        onLoginSuccess: _onLoginSuccess,
      );
    }

    // User is authorized - render child directly
    return widget.child;
  }
}
