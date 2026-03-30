import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/account_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/modern_drawer.dart';

/// Account shell layout with sidebar navigation
/// Provides consistent layout for all account sub-pages
class AccountShell extends StatefulWidget {
  final int initialIndex;

  const AccountShell({super.key, this.initialIndex = 0});

  @override
  State<AccountShell> createState() => _AccountShellState();
}

class _AccountShellState extends State<AccountShell> {
  late int _selectedIndex;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<_MenuItem> _menuItems = [
    _MenuItem(icon: Icons.person_outline, title: 'Profile', route: 'profile'),
    _MenuItem(
        icon: Icons.receipt_long_outlined, title: 'Orders', route: 'orders'),
    _MenuItem(
        icon: Icons.account_balance_wallet_outlined,
        title: 'Loyalty Cash',
        route: 'loyalty'),
    _MenuItem(
        icon: Icons.location_on_outlined,
        title: 'Addresses',
        route: 'addresses'),
    _MenuItem(
        icon: Icons.payment_outlined,
        title: 'Payment Methods',
        route: 'payments'),
    _MenuItem(icon: Icons.lock_outline, title: 'Security', route: 'security'),
  ];

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
    // Defer data loading to after the first frame to avoid setState during build
    SchedulerBinding.instance.addPostFrameCallback((_) {
      _loadAccountData();
    });
  }

  Future<void> _loadAccountData() async {
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated) {
      await context.read<AccountProvider>().loadAll();
    }
  }

  void _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFB8860B),
            ),
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await context.read<AuthProvider>().logout();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You have been logged out'),
            backgroundColor: Color(0xFFB8860B),
          ),
        );
        Navigator.of(context)
            .pushNamedAndRemoveUntil('/login', (route) => false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    // Show loading while checking authentication
    if (authProvider.isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFB8860B)),
        ),
      );
    }

    // Redirect to login if not authenticated
    if (!authProvider.isAuthenticated) {
      // Use addPostFrameCallback to avoid navigation during build
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          Navigator.of(context).pushReplacementNamed('/login');
        }
      });
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFB8860B)),
        ),
      );
    }

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.grey[50],
      appBar: _buildAppBar(),
      drawer: const ModernDrawer(),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isMobile = constraints.maxWidth < 768;

          if (isMobile) {
            return _buildMobileContent();
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSidebar(),
              Expanded(child: _buildContent()),
            ],
          );
        },
      ),
    );
  }

  void _showAccountSectionsSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
              ),
              child: Row(
                children: [
                  const Text(
                    'Account Sections',
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            ...List.generate(_menuItems.length, (index) {
              final item = _menuItems[index];
              final isSelected = _selectedIndex == index;
              return ListTile(
                leading: Icon(
                  item.icon,
                  color: isSelected ? const Color(0xFFB8860B) : Colors.black54,
                ),
                title: Text(
                  item.title,
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    color:
                        isSelected ? const Color(0xFFB8860B) : Colors.black87,
                  ),
                ),
                trailing: isSelected
                    ? const Icon(Icons.check, color: Color(0xFFB8860B))
                    : null,
                onTap: () {
                  setState(() => _selectedIndex = index);
                  Navigator.pop(context);
                },
              );
            }),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _buildMobileContent() {
    return Column(
      children: [
        // Account section selector button
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: OutlinedButton(
            onPressed: _showAccountSectionsSheet,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              side: const BorderSide(color: Color(0xFFB8860B)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(_menuItems[_selectedIndex].icon,
                    color: const Color(0xFFB8860B), size: 20),
                const SizedBox(width: 8),
                Text(
                  _menuItems[_selectedIndex].title,
                  style: const TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFB8860B),
                  ),
                ),
                const Spacer(),
                const Icon(Icons.keyboard_arrow_down, color: Color(0xFFB8860B)),
              ],
            ),
          ),
        ),
        Expanded(child: _buildContent()),
      ],
    );
  }

  PreferredSizeWidget _buildAppBar() {
    final isMobile = MediaQuery.of(context).size.width < 768;
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      leading: isMobile
          ? IconButton(
              icon: const Icon(Icons.menu, color: Colors.black),
              onPressed: () => _scaffoldKey.currentState?.openDrawer(),
            )
          : IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.black),
              onPressed: () => Navigator.pop(context),
            ),
      title: const Text(
        'MY ACCOUNT',
        style: TextStyle(
          fontFamily: 'WorkSans',
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Colors.black,
          letterSpacing: 2,
        ),
      ),
      actions: [
        // Cart icon
        IconButton(
          icon: const Icon(Icons.shopping_bag_outlined, color: Colors.black),
          onPressed: () => Navigator.pushNamed(context, '/cart'),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildSidebar() {
    return Container(
      width: 280,
      color: Colors.white,
      child: Column(
        children: [
          _buildUserHeader(),
          const Divider(height: 1),
          Expanded(
            child: ListView.builder(
              itemCount: _menuItems.length,
              itemBuilder: (context, index) => _buildMenuItem(index),
            ),
          ),
          const Divider(height: 1),
          _buildLogoutButton(),
        ],
      ),
    );
  }

  Widget _buildUserHeader() {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;
    final accountProvider = context.watch<AccountProvider>();
    final profile = accountProvider.profile;

    // Build display name from profile or user data
    String displayName = '';
    if (profile != null) {
      displayName =
          '${profile['firstName'] ?? ''} ${profile['lastName'] ?? ''}'.trim();
    }
    if (displayName.isEmpty && user != null) {
      displayName = '${user.firstName ?? ''} ${user.lastName ?? ''}'.trim();
    }

    // Get email - require user to have email
    final email = profile?['email'] ?? user?.email ?? '';
    if (email.isEmpty) {
      // No valid user data - show nothing or loading
      return Container(
        padding: const EdgeInsets.all(24),
        child: const Center(
          child: CircularProgressIndicator(color: Color(0xFFB8860B)),
        ),
      );
    }

    final emailVerified =
        profile?['emailVerified'] ?? user?.emailVerified ?? false;

    // Use email username as fallback display name
    if (displayName.isEmpty) {
      displayName = email.split('@').first;
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [const Color(0xFFB8860B).withOpacity(0.1), Colors.white],
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFFB8860B), Color(0xFFDAA520)],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFB8860B).withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Center(
              child: Text(
                displayName.isNotEmpty ? displayName[0].toUpperCase() : '?',
                style: const TextStyle(
                  fontFamily: 'Playfair Display',
                  fontSize: 32,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            displayName,
            style: const TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            email,
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 13,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: emailVerified
                  ? Colors.green.withOpacity(0.1)
                  : Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  emailVerified ? Icons.verified : Icons.warning_amber_rounded,
                  size: 14,
                  color: emailVerified ? Colors.green : Colors.orange,
                ),
                const SizedBox(width: 4),
                Text(
                  emailVerified ? 'Verified' : 'Not Verified',
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: emailVerified ? Colors.green : Colors.orange,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(int index, {bool inDrawer = false}) {
    final item = _menuItems[index];
    final isSelected = _selectedIndex == index;

    return InkWell(
      onTap: () {
        setState(() => _selectedIndex = index);
        if (inDrawer) {
          Navigator.pop(context);
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFB8860B).withOpacity(0.1)
              : Colors.transparent,
          border: Border(
            left: BorderSide(
              color: isSelected ? const Color(0xFFB8860B) : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(
              item.icon,
              color: isSelected ? const Color(0xFFB8860B) : Colors.black54,
              size: 22,
            ),
            const SizedBox(width: 16),
            Text(
              item.title,
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? const Color(0xFFB8860B) : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoutButton() {
    return InkWell(
      onTap: _handleLogout,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Row(
          children: [
            Icon(Icons.logout, color: Colors.red[400], size: 22),
            const SizedBox(width: 16),
            Text(
              'Logout',
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.red[400],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: _buildSelectedPage(),
    );
  }

  Widget _buildSelectedPage() {
    switch (_selectedIndex) {
      case 0:
        return const ProfilePage();
      case 1:
        return const OrdersPage();
      case 2:
        return const LoyaltyPage();
      case 3:
        return const AddressesPage();
      case 4:
        return const PaymentMethodsPage();
      case 5:
        return const SecurityPage();
      default:
        return const ProfilePage();
    }
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final String route;

  _MenuItem({required this.icon, required this.title, required this.route});
}

// ============================================================================
// PROFILE PAGE
// ============================================================================

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _populateForm();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _populateForm() {
    final accountProvider = context.read<AccountProvider>();
    final profile = accountProvider.profile;
    if (profile != null) {
      _firstNameController.text = profile['firstName'] ?? '';
      _lastNameController.text = profile['lastName'] ?? '';
      _phoneController.text = profile['phone'] ?? '';
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    final accountProvider = context.read<AccountProvider>();
    final success = await accountProvider.saveProfile(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      phone: _phoneController.text.trim().isEmpty
          ? null
          : _phoneController.text.trim(),
    );

    if (mounted) {
      if (success) {
        setState(() => _isEditing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(accountProvider.error ?? 'Failed to update profile'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _resendVerification() async {
    final accountProvider = context.read<AccountProvider>();
    final email = accountProvider.profile?['email'];

    if (email == null) return;

    try {
      await ApiService.auth.resendVerificationEmail(email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Verification email sent! Check your inbox.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send verification email: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final accountProvider = context.watch<AccountProvider>();
    final profile = accountProvider.profile;
    final emailVerified = profile?['emailVerified'] ?? false;

    // Update form when profile loads
    if (profile != null && _firstNameController.text.isEmpty) {
      _populateForm();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Profile Information'),
        const SizedBox(height: 24),
        if (accountProvider.loadingProfile)
          const Center(
              child: CircularProgressIndicator(color: Color(0xFFB8860B)))
        else
          _buildProfileCard(emailVerified),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontFamily: 'Playfair Display',
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        if (!_isEditing)
          TextButton.icon(
            onPressed: () => setState(() => _isEditing = true),
            icon: const Icon(Icons.edit, size: 18),
            label: const Text('Edit'),
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFFB8860B),
            ),
          ),
      ],
    );
  }

  Widget _buildProfileCard(bool emailVerified) {
    final accountProvider = context.watch<AccountProvider>();
    final profile = accountProvider.profile;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Email (read-only)
              _buildReadOnlyField(
                'Email Address',
                profile?['email'] ?? '',
                Icons.email_outlined,
                suffix: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: emailVerified
                        ? Colors.green.withOpacity(0.1)
                        : Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    emailVerified ? 'Verified' : 'Not Verified',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: emailVerified ? Colors.green : Colors.orange,
                    ),
                  ),
                ),
              ),

              if (!emailVerified) ...[
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: _resendVerification,
                  icon: const Icon(Icons.send, size: 16),
                  label: const Text('Resend verification email'),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFB8860B),
                    padding: EdgeInsets.zero,
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // First Name
              _buildFormField(
                'First Name',
                _firstNameController,
                Icons.person_outline,
                enabled: _isEditing,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'First name is required';
                  }
                  if (value.trim().length < 2) {
                    return 'First name must be at least 2 characters';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Last Name
              _buildFormField(
                'Last Name',
                _lastNameController,
                Icons.person_outline,
                enabled: _isEditing,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Last name is required';
                  }
                  if (value.trim().length < 2) {
                    return 'Last name must be at least 2 characters';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Phone
              _buildFormField(
                'Phone Number',
                _phoneController,
                Icons.phone_outlined,
                enabled: _isEditing,
                hint: '+971 50 123 4567',
              ),

              if (_isEditing) ...[
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () {
                        _populateForm();
                        setState(() => _isEditing = false);
                      },
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 16),
                    ElevatedButton(
                      onPressed:
                          accountProvider.savingProfile ? null : _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFB8860B),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 32, vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: accountProvider.savingProfile
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'Save Changes',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReadOnlyField(String label, String value, IconData icon,
      {Widget? suffix}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontFamily: 'WorkSans',
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(icon, color: Colors.grey[500], size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  value,
                  style: const TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 15,
                    color: Colors.black87,
                  ),
                ),
              ),
              if (suffix != null) suffix,
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFormField(
    String label,
    TextEditingController controller,
    IconData icon, {
    bool enabled = true,
    String? hint,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontFamily: 'WorkSans',
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          enabled: enabled,
          validator: validator,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: Colors.grey[500], size: 20),
            hintText: hint,
            filled: true,
            fillColor: enabled ? Colors.white : Colors.grey[100],
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFB8860B), width: 2),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[200]!),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// SECURITY PAGE
// ============================================================================

class SecurityPage extends StatefulWidget {
  const SecurityPage({super.key});

  @override
  State<SecurityPage> createState() => _SecurityPageState();
}

class _SecurityPageState extends State<SecurityPage> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscureCurrentPassword = true;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await ApiService.auth.changePassword(
        currentPassword: _currentPasswordController.text,
        newPassword: _newPasswordController.text,
      );

      if (mounted) {
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password changed successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Failed to change password: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Security Settings',
          style: TextStyle(
            fontFamily: 'Playfair Display',
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Manage your password and security preferences',
          style: TextStyle(
            fontFamily: 'WorkSans',
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 32),

        // Change Password Card
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: Colors.grey[200]!),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFB8860B).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.lock_outline,
                          color: Color(0xFFB8860B),
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Change Password',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Update your password regularly for better security',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 13,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Current Password
                  _buildPasswordField(
                    'Current Password',
                    _currentPasswordController,
                    _obscureCurrentPassword,
                    () => setState(() =>
                        _obscureCurrentPassword = !_obscureCurrentPassword),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your current password';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),

                  // New Password
                  _buildPasswordField(
                    'New Password',
                    _newPasswordController,
                    _obscureNewPassword,
                    () => setState(
                        () => _obscureNewPassword = !_obscureNewPassword),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter a new password';
                      }
                      if (value.length < 8) {
                        return 'Password must be at least 8 characters';
                      }
                      if (!RegExp(r'[A-Z]').hasMatch(value)) {
                        return 'Password must contain an uppercase letter';
                      }
                      if (!RegExp(r'[a-z]').hasMatch(value)) {
                        return 'Password must contain a lowercase letter';
                      }
                      if (!RegExp(r'[0-9]').hasMatch(value)) {
                        return 'Password must contain a number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),

                  // Confirm Password
                  _buildPasswordField(
                    'Confirm New Password',
                    _confirmPasswordController,
                    _obscureConfirmPassword,
                    () => setState(() =>
                        _obscureConfirmPassword = !_obscureConfirmPassword),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please confirm your new password';
                      }
                      if (value != _newPasswordController.text) {
                        return 'Passwords do not match';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 32),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _changePassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFB8860B),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'Update Password',
                              style: TextStyle(
                                color: Colors.white,
                                fontFamily: 'WorkSans',
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(height: 24),

        // Account Info Card
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: Colors.grey[200]!),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Account Information',
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 16),
                _buildInfoRow(
                  Icons.calendar_today_outlined,
                  'Member Since',
                  _formatDate(
                      context.read<AccountProvider>().profile?['createdAt']),
                ),
                const SizedBox(height: 12),
                _buildInfoRow(
                  Icons.update_outlined,
                  'Last Updated',
                  _formatDate(
                      context.read<AccountProvider>().profile?['updatedAt']),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'N/A';
    try {
      final DateTime dateTime =
          date is DateTime ? date : DateTime.parse(date.toString());
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    } catch (e) {
      return 'N/A';
    }
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: Colors.grey[500], size: 18),
        const SizedBox(width: 12),
        Text(
          '$label: ',
          style: TextStyle(
            fontFamily: 'WorkSans',
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontFamily: 'WorkSans',
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordField(
    String label,
    TextEditingController controller,
    bool obscure,
    VoidCallback toggleObscure, {
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontFamily: 'WorkSans',
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          validator: validator,
          decoration: InputDecoration(
            prefixIcon:
                Icon(Icons.lock_outline, color: Colors.grey[500], size: 20),
            suffixIcon: IconButton(
              icon: Icon(
                obscure
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                color: Colors.grey[500],
                size: 20,
              ),
              onPressed: toggleObscure,
            ),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFB8860B), width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.red),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// PLACEHOLDER PAGES (Orders, Loyalty, Addresses, Payment Methods)
// ============================================================================

class OrdersPage extends StatelessWidget {
  const OrdersPage({super.key});

  @override
  Widget build(BuildContext context) {
    final accountProvider = context.watch<AccountProvider>();
    final orders = accountProvider.orders;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Order History',
          style: TextStyle(
            fontFamily: 'Playfair Display',
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 24),
        if (accountProvider.loadingOrders)
          const Center(
              child: CircularProgressIndicator(color: Color(0xFFB8860B)))
        else if (orders.isEmpty)
          _buildEmptyState(
            Icons.receipt_long_outlined,
            'No orders yet',
            'Your order history will appear here',
          )
        else
          ...orders.map((order) => _buildOrderCard(order)),
      ],
    );
  }

  Widget _buildOrderCard(dynamic order) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Order #${order['orderNumber'] ?? order['id']}',
                  style: const TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order['status']).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    order['status'] ?? 'Unknown',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: _getStatusColor(order['status']),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Total: AED ${_formatTotal(order['total'])}',
              style: const TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            if (order['createdAt'] != null) ...[
              const SizedBox(height: 8),
              Text(
                'Date: ${_formatDate(order['createdAt'])}',
                style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 13,
                  color: Colors.grey[600],
                ),
              ),
            ],
            if (order['items'] != null &&
                (order['items'] as List).isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              Text(
                '${(order['items'] as List).length} item(s)',
                style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 13,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'DELIVERED':
        return Colors.green;
      case 'PENDING':
      case 'PROCESSING':
        return Colors.orange;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatTotal(dynamic total) {
    if (total == null) return '0.00';
    if (total is num) return total.toStringAsFixed(2);
    if (total is String) {
      final parsed = double.tryParse(total);
      return parsed?.toStringAsFixed(2) ?? total;
    }
    return total.toString();
  }

  String _formatDate(dynamic date) {
    if (date == null) return '';
    try {
      final dateTime = DateTime.parse(date.toString());
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    } catch (e) {
      return date.toString();
    }
  }

  Widget _buildEmptyState(IconData icon, String title, String subtitle) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          children: [
            Icon(icon, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              title,
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LoyaltyPage extends StatelessWidget {
  const LoyaltyPage({super.key});

  @override
  Widget build(BuildContext context) {
    final accountProvider = context.watch<AccountProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Loyalty Cash',
          style: TextStyle(
            fontFamily: 'Playfair Display',
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 24),

        // Balance Card
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFB8860B), Color(0xFFDAA520)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Available Balance',
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'AED ${accountProvider.loyaltyBalance.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontFamily: 'Playfair Display',
                    fontSize: 36,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Stats
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Total Earned',
                'AED ${accountProvider.loyaltyTotalEarned.toStringAsFixed(2)}',
                Icons.arrow_upward,
                Colors.green,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildStatCard(
                'Total Redeemed',
                'AED ${accountProvider.loyaltyTotalRedeemed.toStringAsFixed(2)}',
                Icons.arrow_downward,
                Colors.blue,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(
      String label, String value, IconData icon, Color color) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 12),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AddressesPage extends StatelessWidget {
  const AddressesPage({super.key});

  void _showAddEditDialog(BuildContext context,
      {Map<String, dynamic>? address}) {
    final isEdit = address != null;
    final formKey = GlobalKey<FormState>();

    final labelController =
        TextEditingController(text: address?['label'] ?? '');
    final firstNameController =
        TextEditingController(text: address?['firstName'] ?? '');
    final lastNameController =
        TextEditingController(text: address?['lastName'] ?? '');
    final addressLine1Controller =
        TextEditingController(text: address?['addressLine1'] ?? '');
    final addressLine2Controller =
        TextEditingController(text: address?['addressLine2'] ?? '');
    final cityController = TextEditingController(text: address?['city'] ?? '');
    final postalCodeController =
        TextEditingController(text: address?['postalCode'] ?? '');
    final phoneController =
        TextEditingController(text: address?['phone'] ?? '');
    bool isDefault = address?['isDefault'] ?? false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(isEdit ? 'Edit Address' : 'Add New Address'),
          content: SizedBox(
            width: MediaQuery.of(context).size.width > 600
                ? 500
                : double.maxFinite,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFormField(
                      controller: labelController,
                      label: 'Label (e.g., Home, Office)',
                      icon: Icons.label_outline,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildFormField(
                            controller: firstNameController,
                            label: 'First Name',
                            required: true,
                            validator: (v) =>
                                v == null || v.isEmpty ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildFormField(
                            controller: lastNameController,
                            label: 'Last Name',
                            required: true,
                            validator: (v) =>
                                v == null || v.isEmpty ? 'Required' : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildFormField(
                      controller: phoneController,
                      label: 'Phone',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    _buildFormField(
                      controller: addressLine1Controller,
                      label: 'Street Address',
                      icon: Icons.location_on_outlined,
                      required: true,
                      validator: (v) =>
                          v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    _buildFormField(
                      controller: addressLine2Controller,
                      label: 'Apartment, suite, etc. (optional)',
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildFormField(
                            controller: cityController,
                            label: 'City',
                            required: true,
                            validator: (v) =>
                                v == null || v.isEmpty ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildFormField(
                            controller: postalCodeController,
                            label: 'Postal Code (optional)',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Country - Fixed to UAE
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Country',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[700],
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 14),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.flag_outlined,
                                  size: 18, color: Colors.grey[600]),
                              const SizedBox(width: 12),
                              const Text(
                                'United Arab Emirates',
                                style: TextStyle(
                                    fontSize: 14, color: Colors.black87),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    CheckboxListTile(
                      value: isDefault,
                      onChanged: (v) =>
                          setDialogState(() => isDefault = v ?? false),
                      title: const Text('Set as default address'),
                      contentPadding: EdgeInsets.zero,
                      activeColor: const Color(0xFFB8860B),
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            Consumer<AccountProvider>(
              builder: (ctx, provider, _) => ElevatedButton(
                onPressed: provider.savingAddress
                    ? null
                    : () async {
                        if (!formKey.currentState!.validate()) return;

                        final data = {
                          'label': labelController.text.isNotEmpty
                              ? labelController.text
                              : null,
                          'firstName': firstNameController.text,
                          'lastName': lastNameController.text,
                          'addressLine1': addressLine1Controller.text,
                          'addressLine2': addressLine2Controller.text.isNotEmpty
                              ? addressLine2Controller.text
                              : null,
                          'city': cityController.text,
                          'postalCode': postalCodeController.text.isNotEmpty
                              ? postalCodeController.text
                              : null,
                          'phone': phoneController.text.isNotEmpty
                              ? phoneController.text
                              : null,
                          'isDefault': isDefault,
                        };

                        bool success;
                        if (isEdit) {
                          success =
                              await provider.updateAddress(address['id'], data);
                        } else {
                          success = await provider.createAddress(data);
                        }

                        if (success && ctx.mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                  isEdit ? 'Address updated' : 'Address added'),
                              backgroundColor: const Color(0xFFB8860B),
                            ),
                          );
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFB8860B),
                  foregroundColor: Colors.white,
                ),
                child: provider.savingAddress
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : Text(isEdit ? 'Save Changes' : 'Add Address'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormField({
    required TextEditingController controller,
    required String label,
    IconData? icon,
    bool required = false,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          required ? '$label *' : label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          validator: validator,
          decoration: InputDecoration(
            hintText: label,
            hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
            prefixIcon: icon != null
                ? Icon(icon, size: 20, color: Colors.grey[500])
                : null,
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFB8860B), width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.red),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }

  void _showDeleteConfirmation(
      BuildContext context, Map<String, dynamic> address) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Address'),
        content: Text(
            'Are you sure you want to delete "${address['label'] ?? 'this address'}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final provider = context.read<AccountProvider>();
              final success = await provider.deleteAddress(address['id']);
              if (success && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Address deleted'),
                    backgroundColor: Color(0xFFB8860B),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final accountProvider = context.watch<AccountProvider>();
    final addresses = accountProvider.addresses;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Saved Addresses',
              style: TextStyle(
                fontFamily: 'Playfair Display',
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            ElevatedButton.icon(
              onPressed: () => _showAddEditDialog(context),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add New'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB8860B),
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        if (accountProvider.loadingAddresses)
          const Center(
              child: CircularProgressIndicator(color: Color(0xFFB8860B)))
        else if (addresses.isEmpty)
          _buildEmptyState(context)
        else
          ...addresses.map((addr) => _buildAddressCard(context, addr)),
      ],
    );
  }

  Widget _buildAddressCard(BuildContext context, dynamic address) {
    final isDefault = address['isDefault'] == true;
    final label = address['label'] ??
        '${address['firstName'] ?? ''} ${address['lastName'] ?? ''}'.trim();
    final fullName =
        '${address['firstName'] ?? ''} ${address['lastName'] ?? ''}'.trim();

    final addressParts = <String>[];
    if (address['addressLine1'] != null)
      addressParts.add(address['addressLine1']);
    if (address['addressLine2'] != null &&
        address['addressLine2'].toString().isNotEmpty) {
      addressParts.add(address['addressLine2']);
    }
    if (address['city'] != null) addressParts.add(address['city']);
    if (address['state'] != null && address['state'].toString().isNotEmpty) {
      addressParts.add(address['state']);
    }
    if (address['postalCode'] != null &&
        address['postalCode'].toString().isNotEmpty) {
      addressParts.add(address['postalCode']);
    }
    if (address['country'] != null) addressParts.add(address['country']);

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isDefault ? const Color(0xFFB8860B) : Colors.grey[200]!,
          width: isDefault ? 2 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.location_on_outlined,
                  color: isDefault ? const Color(0xFFB8860B) : Colors.grey[400],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            label.isNotEmpty ? label : 'Address',
                            style: const TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (isDefault) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFB8860B).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'Default',
                                style: TextStyle(
                                  fontFamily: 'WorkSans',
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFFB8860B),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (fullName.isNotEmpty && label != fullName) ...[
                        const SizedBox(height: 4),
                        Text(
                          fullName,
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 14,
                            color: Colors.grey[700],
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Text(
                        addressParts.join(', '),
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                      if (address['phone'] != null &&
                          address['phone'].toString().isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Phone: ${address['phone']}',
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                      if (address['email'] != null &&
                          address['email'].toString().isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          address['email'],
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (!isDefault)
                  TextButton.icon(
                    onPressed: () async {
                      final provider = context.read<AccountProvider>();
                      final success =
                          await provider.setDefaultAddress(address['id']);
                      if (success && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Default address updated'),
                            backgroundColor: Color(0xFFB8860B),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.check_circle_outline, size: 18),
                    label: const Text('Set as Default'),
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFFB8860B),
                    ),
                  ),
                TextButton.icon(
                  onPressed: () => _showAddEditDialog(context,
                      address: address as Map<String, dynamic>),
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  label: const Text('Edit'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.grey[600],
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _showDeleteConfirmation(
                      context, address as Map<String, dynamic>),
                  icon: const Icon(Icons.delete_outline, size: 18),
                  label: const Text('Delete'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red[400],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          children: [
            Icon(Icons.location_on_outlined, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'No addresses saved',
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Add a delivery address to speed up checkout',
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _showAddEditDialog(context),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add Your First Address'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB8860B),
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PaymentMethodsPage extends StatelessWidget {
  const PaymentMethodsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final accountProvider = context.watch<AccountProvider>();
    final methods = accountProvider.paymentMethods;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Payment Methods',
              style: TextStyle(
                fontFamily: 'Playfair Display',
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            ElevatedButton.icon(
              onPressed: () {
                // TODO: Add payment method dialog
              },
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add New'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB8860B),
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        if (accountProvider.loadingPayments)
          const Center(
              child: CircularProgressIndicator(color: Color(0xFFB8860B)))
        else if (methods.isEmpty)
          _buildEmptyState()
        else
          ...methods.map((method) => _buildPaymentCard(method)),
      ],
    );
  }

  Widget _buildPaymentCard(dynamic method) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Icon(Icons.credit_card, color: Colors.grey[400]),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '•••• ${method['lastFour'] ?? '****'}',
                    style: const TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    method['brand'] ?? 'Card',
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            if (method['isDefault'] == true)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFB8860B).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Default',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFFB8860B),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          children: [
            Icon(Icons.payment_outlined, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'No payment methods',
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Save a payment method for faster checkout',
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
