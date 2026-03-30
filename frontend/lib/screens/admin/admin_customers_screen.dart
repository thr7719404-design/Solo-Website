import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../services/api/customers_api.dart';
import 'dart:async';

/// ═══════════════════════════════════════════════════════════════════
/// ADMIN CUSTOMERS — Modern premium design with field filters
/// ═══════════════════════════════════════════════════════════════════
class AdminCustomersScreen extends StatefulWidget {
  const AdminCustomersScreen({super.key});

  @override
  State<AdminCustomersScreen> createState() => _AdminCustomersScreenState();
}

class _AdminCustomersScreenState extends State<AdminCustomersScreen> {
  bool _isLoading = true;
  CustomerListDto? _customersData;
  String? _error;
  int _currentPage = 1;
  final int _pageSize = 20;
  String _searchQuery = '';
  bool _showInactive = false;
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;

  // Per-field filter controllers
  final _nameFilterCtrl = TextEditingController();
  final _emailFilterCtrl = TextEditingController();
  final _phoneFilterCtrl = TextEditingController();
  String _statusFilter = 'all'; // 'all', 'active', 'inactive'
  String _ordersFilter = 'all'; // 'all', 'has_orders', 'no_orders'
  bool _showFilters = false;

  // Design tokens
  static const _accent = Color(0xFF1A1A2E);
  static const _indigo = Color(0xFF6366F1);
  static const _success = Color(0xFF10B981);
  static const _danger = Color(0xFFEF4444);
  static const _warning = Color(0xFFF59E0B);
  static const _info = Color(0xFF3B82F6);
  static const _purple = Color(0xFF8B5CF6);
  static const _surface = Color(0xFFF8F9FC);

  @override
  void initState() {
    super.initState();
    _loadCustomers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _nameFilterCtrl.dispose();
    _emailFilterCtrl.dispose();
    _phoneFilterCtrl.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      if (_searchQuery != value) {
        setState(() {
          _searchQuery = value;
          _currentPage = 1;
        });
        _loadCustomers();
      }
    });
  }

  Future<void> _loadCustomers() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await ApiService.customers.getCustomers(
        page: _currentPage,
        limit: _pageSize,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        includeInactive: _showInactive,
      );
      setState(() {
        _customersData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _goToPage(int page) {
    setState(() => _currentPage = page);
    _loadCustomers();
  }

  void _showSnack(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(color: Colors.white)),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      margin: const EdgeInsets.all(16),
    ));
  }

  /// Client-side filter on the loaded list
  List<CustomerDto> get _filteredCustomers {
    final all = _customersData?.items ?? [];
    return all.where((c) {
      if (_nameFilterCtrl.text.isNotEmpty &&
          !c.fullName
              .toLowerCase()
              .contains(_nameFilterCtrl.text.toLowerCase())) {
        return false;
      }
      if (_emailFilterCtrl.text.isNotEmpty &&
          !c.email
              .toLowerCase()
              .contains(_emailFilterCtrl.text.toLowerCase())) {
        return false;
      }
      if (_phoneFilterCtrl.text.isNotEmpty) {
        final phone = c.phone ?? '';
        if (!phone.toLowerCase().contains(_phoneFilterCtrl.text.toLowerCase()))
          return false;
      }
      if (_statusFilter == 'active' && !c.isActive) return false;
      if (_statusFilter == 'inactive' && c.isActive) return false;
      if (_ordersFilter == 'has_orders' && c.ordersCount == 0) return false;
      if (_ordersFilter == 'no_orders' && c.ordersCount > 0) return false;
      return true;
    }).toList();
  }

  bool get _hasActiveFilters =>
      _nameFilterCtrl.text.isNotEmpty ||
      _emailFilterCtrl.text.isNotEmpty ||
      _phoneFilterCtrl.text.isNotEmpty ||
      _statusFilter != 'all' ||
      _ordersFilter != 'all';

  int get _activeFilterCount {
    int c = 0;
    if (_nameFilterCtrl.text.isNotEmpty) c++;
    if (_emailFilterCtrl.text.isNotEmpty) c++;
    if (_phoneFilterCtrl.text.isNotEmpty) c++;
    if (_statusFilter != 'all') c++;
    if (_ordersFilter != 'all') c++;
    return c;
  }

  void _clearAllFilters() {
    setState(() {
      _nameFilterCtrl.clear();
      _emailFilterCtrl.clear();
      _phoneFilterCtrl.clear();
      _statusFilter = 'all';
      _ordersFilter = 'all';
    });
  }

  // ── Create Customer ──
  Future<void> _createCustomer() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const _CustomerFormDialog(),
    );
    if (result == null) return;

    try {
      final dto = CreateCustomerDto(
        fullName: result['fullName'],
        email: result['email'],
        phone: result['phone'],
        password: result['password'],
        isActive: result['isActive'] ?? true,
      );
      final response = await ApiService.customers.createCustomer(dto);
      if (!mounted) return;

      if (response.generatedPassword != null) {
        await showDialog(
          context: context,
          builder: (context) => _PasswordRevealDialog(
            customerName: response.fullName,
            password: response.generatedPassword!,
          ),
        );
      } else {
        _showSnack(
            'Customer "${response.fullName}" created successfully', _success);
      }
      _loadCustomers();
    } catch (e) {
      if (!mounted) return;
      _showSnack(
          'Error: ${e.toString().replaceAll('Exception: ', '')}', _danger);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/customers',
        child: Container(
          color: _surface,
          child: _isLoading && _customersData == null
              ? _buildLoading()
              : _buildContent(),
        ),
      ),
    );
  }

  Widget _buildLoading() {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: _accent)),
        const SizedBox(height: 16),
        Text('Loading customers…',
            style: TextStyle(fontSize: 14, color: Colors.grey[400])),
      ]),
    );
  }

  Widget _buildContent() {
    final isMobile = MediaQuery.of(context).size.width < 900;
    final pad = isMobile ? 16.0 : 28.0;
    final customers = _filteredCustomers;
    final totalCustomers = _customersData?.total ?? 0;
    final activeCount =
        (_customersData?.items ?? []).where((c) => c.isActive).length;
    final withOrders =
        (_customersData?.items ?? []).where((c) => c.ordersCount > 0).length;

    return RefreshIndicator(
      onRefresh: _loadCustomers,
      child: ListView(
        padding: EdgeInsets.all(pad),
        children: [
          // ── Header ──
          Row(children: [
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Customers',
                        style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: _accent,
                            letterSpacing: -0.5)),
                    const SizedBox(height: 4),
                    Text('Manage your customer base',
                        style:
                            TextStyle(fontSize: 14, color: Colors.grey[500])),
                  ]),
            ),
            const SizedBox(width: 12),
            FilledButton.icon(
              onPressed: _createCustomer,
              icon: const Icon(Icons.person_add_alt_1_rounded, size: 20),
              label: const Text('New Customer'),
              style: FilledButton.styleFrom(
                backgroundColor: _indigo,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ]),
          const SizedBox(height: 24),

          // ── Summary Cards ──
          Row(children: [
            _summaryTile(
                'Total', '$totalCustomers', Icons.people_outline, _purple),
            const SizedBox(width: 14),
            _summaryTile(
                'Active', '$activeCount', Icons.check_circle_outline, _success),
            const SizedBox(width: 14),
            _summaryTile('With Orders', '$withOrders',
                Icons.shopping_bag_outlined, _info),
          ]),
          const SizedBox(height: 20),

          // ── Search & Filter Bar ──
          _buildSearchFilterBar(),
          const SizedBox(height: 16),

          // ── Field Filters ──
          if (_showFilters) ...[
            _buildFieldFilters(),
            const SizedBox(height: 16),
          ],

          // ── Error ──
          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: _danger.withOpacity(0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _danger.withOpacity(0.15)),
              ),
              child: Row(children: [
                Icon(Icons.error_outline, color: _danger, size: 18),
                const SizedBox(width: 10),
                Expanded(
                    child: Text(_error!,
                        style: TextStyle(color: _danger, fontSize: 13))),
                TextButton(
                    onPressed: _loadCustomers, child: const Text('Retry')),
              ]),
            ),
            const SizedBox(height: 16),
          ],

          // ── Empty State ──
          if (customers.isEmpty && !_isLoading) _buildEmptyState(),

          // ── Customer Cards ──
          if (customers.isNotEmpty)
            ...customers.map((c) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _buildCustomerCard(c),
                )),

          // ── Pagination ──
          if (_customersData != null && _customersData!.totalPages > 1) ...[
            const SizedBox(height: 16),
            _buildPagination(),
          ],

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _summaryTile(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 8,
                offset: const Offset(0, 3))
          ],
        ),
        child: Row(children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 14),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value,
                style: TextStyle(
                    fontSize: 22, fontWeight: FontWeight.w700, color: _accent)),
            Text(label,
                style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w500)),
          ]),
        ]),
      ),
    );
  }

  Widget _buildSearchFilterBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 3))
        ],
      ),
      child: Row(children: [
        // Search
        Expanded(
          child: TextField(
            controller: _searchController,
            onChanged: _onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Search by name, email or phone…',
              hintStyle: TextStyle(fontSize: 13, color: Colors.grey[400]),
              prefixIcon:
                  Icon(Icons.search_rounded, size: 20, color: Colors.grey[400]),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.close_rounded,
                          size: 18, color: Colors.grey[400]),
                      onPressed: () {
                        _searchController.clear();
                        _onSearchChanged('');
                      },
                    )
                  : null,
              filled: true,
              fillColor: _surface,
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: Colors.grey.shade200)),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: Colors.grey.shade200)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: _indigo, width: 1.5)),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Filter Toggle
        _pillButton(
          icon: Icons.filter_list_rounded,
          label: 'Filters',
          isActive: _showFilters || _hasActiveFilters,
          badge: _hasActiveFilters ? _activeFilterCount : 0,
          onTap: () => setState(() => _showFilters = !_showFilters),
        ),
        const SizedBox(width: 8),
        // Show Inactive Toggle
        _pillButton(
          icon: _showInactive
              ? Icons.visibility_rounded
              : Icons.visibility_off_outlined,
          label: 'Inactive',
          isActive: _showInactive,
          onTap: () {
            setState(() {
              _showInactive = !_showInactive;
              _currentPage = 1;
            });
            _loadCustomers();
          },
        ),
        const SizedBox(width: 8),
        // Refresh
        InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: _loadCustomers,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: _isLoading
                ? Padding(
                    padding: const EdgeInsets.all(10),
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: _indigo))
                : Icon(Icons.refresh_rounded,
                    size: 18, color: Colors.grey[500]),
          ),
        ),
      ]),
    );
  }

  Widget _pillButton(
      {required IconData icon,
      required String label,
      required bool isActive,
      int badge = 0,
      required VoidCallback onTap}) {
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? _indigo.withOpacity(0.08) : _surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
              color:
                  isActive ? _indigo.withOpacity(0.3) : Colors.grey.shade200),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 16, color: isActive ? _indigo : Colors.grey[500]),
          const SizedBox(width: 6),
          Text(label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isActive ? _indigo : Colors.grey[600],
              )),
          if (badge > 0) ...[
            const SizedBox(width: 6),
            Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(color: _indigo, shape: BoxShape.circle),
              child: Center(
                  child: Text('$badge',
                      style: const TextStyle(
                          fontSize: 10,
                          color: Colors.white,
                          fontWeight: FontWeight.w700))),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _buildFieldFilters() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _indigo.withOpacity(0.15)),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 3))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(Icons.tune_rounded, size: 16, color: _indigo),
            const SizedBox(width: 8),
            Text('FIELD FILTERS',
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.grey[500],
                    letterSpacing: 0.8)),
            const Spacer(),
            if (_hasActiveFilters)
              TextButton.icon(
                onPressed: _clearAllFilters,
                icon: Icon(Icons.clear_all_rounded, size: 16, color: _danger),
                label: Text('Clear All',
                    style: TextStyle(fontSize: 12, color: _danger)),
                style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8)),
              ),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(
                child: _filterField(
                    _nameFilterCtrl, 'Name', Icons.person_outline)),
            const SizedBox(width: 12),
            Expanded(
                child: _filterField(
                    _emailFilterCtrl, 'Email', Icons.email_outlined)),
            const SizedBox(width: 12),
            Expanded(
                child: _filterField(
                    _phoneFilterCtrl, 'Phone', Icons.phone_outlined)),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            // Status filter
            Expanded(
                child: _filterDropdown(
              'Status',
              Icons.toggle_on_outlined,
              _statusFilter,
              {
                'all': 'All Statuses',
                'active': 'Active Only',
                'inactive': 'Inactive Only'
              },
              (v) => setState(() => _statusFilter = v),
            )),
            const SizedBox(width: 12),
            // Orders filter
            Expanded(
                child: _filterDropdown(
              'Orders',
              Icons.shopping_bag_outlined,
              _ordersFilter,
              {
                'all': 'All Customers',
                'has_orders': 'Has Orders',
                'no_orders': 'No Orders'
              },
              (v) => setState(() => _ordersFilter = v),
            )),
            const Expanded(child: SizedBox()), // spacer
          ]),
        ],
      ),
    );
  }

  Widget _filterField(TextEditingController ctrl, String label, IconData icon) {
    return TextField(
      controller: ctrl,
      onChanged: (_) => setState(() {}),
      decoration: InputDecoration(
        hintText: 'Filter by $label',
        hintStyle: TextStyle(fontSize: 12, color: Colors.grey[400]),
        prefixIcon: Icon(icon, size: 16, color: Colors.grey[400]),
        suffixIcon: ctrl.text.isNotEmpty
            ? IconButton(
                icon: Icon(Icons.close_rounded,
                    size: 14, color: Colors.grey[400]),
                onPressed: () {
                  ctrl.clear();
                  setState(() {});
                },
              )
            : null,
        filled: true,
        fillColor: _surface,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: Colors.grey.shade200)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: Colors.grey.shade200)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: _indigo, width: 1.5)),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        isDense: true,
      ),
      style: const TextStyle(fontSize: 13),
    );
  }

  Widget _filterDropdown(String label, IconData icon, String value,
      Map<String, String> options, ValueChanged<String> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
            color: value != 'all'
                ? _indigo.withOpacity(0.3)
                : Colors.grey.shade200),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          icon: Icon(Icons.keyboard_arrow_down_rounded,
              size: 18, color: Colors.grey[500]),
          style: TextStyle(fontSize: 13, color: _accent),
          items: options.entries
              .map((e) => DropdownMenuItem(
                    value: e.key,
                    child: Row(children: [
                      Icon(icon, size: 15, color: Colors.grey[400]),
                      const SizedBox(width: 8),
                      Text(e.value,
                          style: TextStyle(
                              fontSize: 12,
                              color:
                                  e.key == value ? _accent : Colors.grey[600])),
                    ]),
                  ))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Column(children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
              color: _purple.withOpacity(0.08), shape: BoxShape.circle),
          child: Icon(Icons.people_outline, size: 32, color: _purple),
        ),
        const SizedBox(height: 18),
        Text(
          _hasActiveFilters
              ? 'No customers match your filters'
              : _searchQuery.isNotEmpty
                  ? 'No customers found for "$_searchQuery"'
                  : 'No customers yet',
          style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700]),
        ),
        const SizedBox(height: 6),
        Text(
          _hasActiveFilters
              ? 'Try adjusting or clearing your filters'
              : 'Create your first customer to get started',
          style: TextStyle(fontSize: 13, color: Colors.grey[400]),
        ),
        const SizedBox(height: 20),
        if (_hasActiveFilters)
          OutlinedButton.icon(
            onPressed: _clearAllFilters,
            icon: const Icon(Icons.clear_all_rounded, size: 18),
            label: const Text('Clear Filters'),
            style: OutlinedButton.styleFrom(
              foregroundColor: _indigo,
              side: BorderSide(color: _indigo.withOpacity(0.3)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
          )
        else if (_searchQuery.isNotEmpty)
          OutlinedButton.icon(
            onPressed: () {
              _searchController.clear();
              _onSearchChanged('');
            },
            icon: const Icon(Icons.clear_rounded, size: 18),
            label: const Text('Clear Search'),
            style: OutlinedButton.styleFrom(
              foregroundColor: _indigo,
              side: BorderSide(color: _indigo.withOpacity(0.3)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
          )
        else
          OutlinedButton.icon(
            onPressed: _createCustomer,
            icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
            label: const Text('Add Customer'),
            style: OutlinedButton.styleFrom(
              foregroundColor: _indigo,
              side: BorderSide(color: _indigo.withOpacity(0.3)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
          ),
      ]),
    );
  }

  Widget _buildCustomerCard(CustomerDto customer) {
    final dateFormat = DateFormat('MMM d, yyyy');
    final initial =
        customer.fullName.isNotEmpty ? customer.fullName[0].toUpperCase() : '?';
    final avatarColor = _avatarColor(initial);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: customer.isActive
                ? Colors.grey.shade100
                : _danger.withOpacity(0.12)),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 3))
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => Navigator.of(context).pushNamed(
            '/admin/customers/details',
            arguments: {'customerId': customer.id},
          ),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(children: [
              // ── Avatar ──
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: avatarColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                    child: Text(initial,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: avatarColor,
                        ))),
              ),
              const SizedBox(width: 16),

              // ── Info ──
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Text(customer.fullName,
                            style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: _accent)),
                        const SizedBox(width: 10),
                        // Status pill
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: customer.isActive
                                ? _success.withOpacity(0.1)
                                : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            customer.isActive ? 'Active' : 'Inactive',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: customer.isActive
                                  ? _success
                                  : Colors.grey[500],
                            ),
                          ),
                        ),
                      ]),
                      const SizedBox(height: 6),
                      Wrap(spacing: 16, runSpacing: 4, children: [
                        _detailChip(Icons.email_outlined, customer.email),
                        _detailChip(
                            Icons.phone_outlined, customer.phone ?? 'No phone'),
                        _detailChip(Icons.shopping_bag_outlined,
                            '${customer.ordersCount} orders',
                            highlight: customer.ordersCount > 0),
                        _detailChip(Icons.location_on_outlined,
                            '${customer.addressesCount} addresses'),
                        _detailChip(Icons.calendar_today_outlined,
                            dateFormat.format(customer.createdAt)),
                      ]),
                    ]),
              ),

              // ── Arrow ──
              Icon(Icons.chevron_right_rounded,
                  color: Colors.grey[300], size: 22),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _detailChip(IconData icon, String text, {bool highlight = false}) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 13, color: highlight ? _success : Colors.grey[400]),
      const SizedBox(width: 4),
      Text(text,
          style: TextStyle(
            fontSize: 12,
            color: highlight ? _success : Colors.grey[600],
            fontWeight: highlight ? FontWeight.w600 : FontWeight.w500,
          )),
    ]);
  }

  Color _avatarColor(String initial) {
    const colors = [
      _purple,
      _info,
      _success,
      _warning,
      _danger,
      Color(0xFF06B6D4),
      Color(0xFFEC4899)
    ];
    return colors[initial.codeUnitAt(0) % colors.length];
  }

  Widget _buildPagination() {
    final data = _customersData!;
    final totalPages = data.totalPages;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 3))
        ],
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        _pageBtn(Icons.chevron_left_rounded,
            data.hasPrevPage ? () => _goToPage(_currentPage - 1) : null),
        const SizedBox(width: 8),
        ...List.generate(
          totalPages > 5 ? 5 : totalPages,
          (index) {
            int pageNum;
            if (totalPages <= 5) {
              pageNum = index + 1;
            } else if (_currentPage <= 3) {
              pageNum = index + 1;
            } else if (_currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + index;
            } else {
              pageNum = _currentPage - 2 + index;
            }

            final isCurrent = _currentPage == pageNum;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: InkWell(
                onTap: () => _goToPage(pageNum),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 36,
                  height: 36,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isCurrent ? _indigo : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('$pageNum',
                      style: TextStyle(
                        fontSize: 13,
                        color: isCurrent ? Colors.white : Colors.grey[600],
                        fontWeight:
                            isCurrent ? FontWeight.w700 : FontWeight.w500,
                      )),
                ),
              ),
            );
          },
        ),
        const SizedBox(width: 8),
        _pageBtn(Icons.chevron_right_rounded,
            data.hasNextPage ? () => _goToPage(_currentPage + 1) : null),
        const SizedBox(width: 16),
        Text('Page $_currentPage of $totalPages',
            style: TextStyle(fontSize: 12, color: Colors.grey[500])),
      ]),
    );
  }

  Widget _pageBtn(IconData icon, VoidCallback? onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: onTap != null ? _surface : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Icon(icon,
            size: 18, color: onTap != null ? _accent : Colors.grey[300]),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
//  NEW CUSTOMER DIALOG — Modern Design
// ═══════════════════════════════════════════════════════════════════
class _CustomerFormDialog extends StatefulWidget {
  const _CustomerFormDialog();

  @override
  State<_CustomerFormDialog> createState() => _CustomerFormDialogState();
}

class _CustomerFormDialogState extends State<_CustomerFormDialog> {
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  static const _accent = Color(0xFF1A1A2E);
  static const _indigo = Color(0xFF6366F1);

  final _fullNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _isActive = true;

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  InputDecoration _inputDeco(String label,
      {IconData? icon, String? hint, Widget? suffix}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon:
          icon != null ? Icon(icon, size: 18, color: Colors.grey[400]) : null,
      suffixIcon: suffix,
      filled: true,
      fillColor: const Color(0xFFF8F9FC),
      labelStyle: TextStyle(fontSize: 13, color: Colors.grey[600]),
      hintStyle: TextStyle(fontSize: 13, color: Colors.grey[400]),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade200)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade200)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: _indigo, width: 1.5)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 0,
      backgroundColor: Colors.white,
      child: Container(
        width: 500,
        constraints: const BoxConstraints(maxHeight: 600),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          // ── Header ──
          Container(
            padding: const EdgeInsets.fromLTRB(28, 24, 20, 20),
            decoration: BoxDecoration(
                border:
                    Border(bottom: BorderSide(color: Colors.grey.shade100))),
            child: Row(children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                    color: _indigo.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.person_add_alt_1_rounded,
                    color: _indigo, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('New Customer',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: _accent)),
                      const SizedBox(height: 2),
                      Text('Add a new customer to your store',
                          style:
                              TextStyle(fontSize: 12, color: Colors.grey[500])),
                    ]),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(Icons.close_rounded,
                    color: Colors.grey[400], size: 20),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.grey.shade100,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ]),
          ),

          // ── Form ──
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(28, 22, 28, 8),
              child: Form(
                key: _formKey,
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _sectionLabel('PERSONAL INFORMATION'),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _fullNameCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration: _inputDeco('Full Name',
                            icon: Icons.person_outline, hint: 'John Doe'),
                        validator: (v) => v == null || v.trim().isEmpty
                            ? 'Name is required'
                            : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        decoration: _inputDeco('Email',
                            icon: Icons.email_outlined,
                            hint: 'john@example.com'),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty)
                            return 'Email is required';
                          if (!RegExp(r'^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$')
                              .hasMatch(v.trim())) return 'Enter a valid email';
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _phoneCtrl,
                        keyboardType: TextInputType.phone,
                        decoration: _inputDeco('Phone (optional)',
                            icon: Icons.phone_outlined),
                      ),
                      const SizedBox(height: 22),
                      _sectionLabel('SECURITY'),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _passwordCtrl,
                        obscureText: _obscurePassword,
                        decoration: _inputDeco(
                          'Password',
                          icon: Icons.lock_outline,
                          hint: 'Leave empty to auto-generate',
                          suffix: IconButton(
                            icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                size: 18,
                                color: Colors.grey[400]),
                            onPressed: () => setState(
                                () => _obscurePassword = !_obscurePassword),
                          ),
                        ),
                        validator: (v) {
                          if (v != null && v.isNotEmpty && v.length < 6)
                            return 'Min. 6 characters';
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),
                      // Active toggle
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8F9FC),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Row(children: [
                          Icon(Icons.power_settings_new_rounded,
                              size: 18, color: Colors.grey[500]),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Active',
                                      style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600)),
                                  Text('Customer can login and place orders',
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.grey[400])),
                                ]),
                          ),
                          Switch.adaptive(
                            value: _isActive,
                            activeColor: _indigo,
                            onChanged: (v) => setState(() => _isActive = v),
                          ),
                        ]),
                      ),
                      const SizedBox(height: 10),
                    ]),
              ),
            ),
          ),

          // ── Footer ──
          Container(
            padding: const EdgeInsets.fromLTRB(28, 16, 28, 20),
            decoration: BoxDecoration(
                border: Border(top: BorderSide(color: Colors.grey.shade100))),
            child: Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    side: BorderSide(color: Colors.grey.shade300),
                  ),
                  child: Text('Cancel',
                      style: TextStyle(
                          color: Colors.grey[700],
                          fontWeight: FontWeight.w500)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () {
                    if (!_formKey.currentState!.validate()) return;
                    Navigator.pop(context, {
                      'fullName': _fullNameCtrl.text.trim(),
                      'email': _emailCtrl.text.trim(),
                      'phone': _phoneCtrl.text.trim(),
                      'password': _passwordCtrl.text,
                      'isActive': _isActive,
                    });
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: _indigo,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Create Customer',
                      style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(text,
        style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Colors.grey[500],
            letterSpacing: 0.8));
  }
}

// ═══════════════════════════════════════════════════════════════════
//  PASSWORD REVEAL DIALOG — Modern Design
// ═══════════════════════════════════════════════════════════════════
class _PasswordRevealDialog extends StatelessWidget {
  final String customerName;
  final String password;

  const _PasswordRevealDialog(
      {required this.customerName, required this.password});

  static const _indigo = Color(0xFF6366F1);
  static const _success = Color(0xFF10B981);

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: 420,
        padding: const EdgeInsets.all(28),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
                color: _success.withOpacity(0.1), shape: BoxShape.circle),
            child: const Icon(Icons.check_circle_rounded,
                color: _success, size: 28),
          ),
          const SizedBox(height: 16),
          const Text('Customer Created',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text('"$customerName" has been added successfully.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(Icons.key_rounded, size: 16, color: Colors.amber[700]),
                const SizedBox(width: 8),
                Text('Auto-generated Password',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Colors.amber[800])),
              ]),
              const SizedBox(height: 10),
              SelectableText(password,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  )),
              const SizedBox(height: 8),
              Text('Save this password — it will not be shown again.',
                  style: TextStyle(fontSize: 11, color: Colors.grey[600])),
            ]),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => Navigator.pop(context),
              style: FilledButton.styleFrom(
                backgroundColor: _indigo,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Done',
                  style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ),
        ]),
      ),
    );
  }
}
