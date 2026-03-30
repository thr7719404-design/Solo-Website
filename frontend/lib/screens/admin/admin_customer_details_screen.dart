import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../services/api/customers_api.dart';

/// Admin Customer Details Screen
class AdminCustomerDetailsScreen extends StatefulWidget {
  final String customerId;

  const AdminCustomerDetailsScreen({
    super.key,
    required this.customerId,
  });

  @override
  State<AdminCustomerDetailsScreen> createState() =>
      _AdminCustomerDetailsScreenState();
}

class _AdminCustomerDetailsScreenState extends State<AdminCustomerDetailsScreen>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  CustomerDetailsDto? _customer;
  String? _error;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadCustomer();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadCustomer() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final customer =
          await ApiService.customers.getCustomer(widget.customerId);
      setState(() {
        _customer = customer;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _showEditDialog() {
    if (_customer == null) return;

    final fullNameController = TextEditingController(text: _customer!.fullName);
    final emailController = TextEditingController(text: _customer!.email);
    final phoneController = TextEditingController(text: _customer!.phone ?? '');
    bool isActive = _customer!.isActive;
    bool isSaving = false;
    String? errorMessage;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text('Edit Customer'),
            content: SizedBox(
              width: 400,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red[300]!),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline,
                                color: Colors.red[700], size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                errorMessage!,
                                style: TextStyle(color: Colors.red[700]),
                              ),
                            ),
                          ],
                        ),
                      ),
                    TextField(
                      controller: fullNameController,
                      decoration: const InputDecoration(
                        labelText: 'Full Name *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.person),
                      ),
                      enabled: !isSaving,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: emailController,
                      decoration: const InputDecoration(
                        labelText: 'Email *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.email),
                      ),
                      keyboardType: TextInputType.emailAddress,
                      enabled: !isSaving,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Phone',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.phone),
                      ),
                      keyboardType: TextInputType.phone,
                      enabled: !isSaving,
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      title: const Text('Active'),
                      subtitle: Text(
                        isActive
                            ? 'Customer can log in'
                            : 'Customer is disabled',
                      ),
                      value: isActive,
                      onChanged: isSaving
                          ? null
                          : (value) {
                              setDialogState(() {
                                isActive = value;
                              });
                            },
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSaving ? null : () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: isSaving
                    ? null
                    : () async {
                        // Validate
                        final fullName = fullNameController.text.trim();
                        final email = emailController.text.trim();
                        final phone = phoneController.text.trim();

                        if (fullName.isEmpty) {
                          setDialogState(() {
                            errorMessage = 'Full name is required';
                          });
                          return;
                        }

                        if (email.isEmpty) {
                          setDialogState(() {
                            errorMessage = 'Email is required';
                          });
                          return;
                        }

                        if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                            .hasMatch(email)) {
                          setDialogState(() {
                            errorMessage = 'Please enter a valid email address';
                          });
                          return;
                        }

                        setDialogState(() {
                          isSaving = true;
                          errorMessage = null;
                        });

                        try {
                          await ApiService.customers.updateCustomer(
                            widget.customerId,
                            UpdateCustomerDto(
                              fullName: fullName,
                              email: email,
                              phone: phone.isNotEmpty ? phone : null,
                              isActive: isActive,
                            ),
                          );

                          if (mounted) {
                            Navigator.of(context).pop();
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              const SnackBar(
                                content: Text('Customer updated successfully'),
                                backgroundColor: Colors.green,
                              ),
                            );
                            _loadCustomer();
                          }
                        } catch (e) {
                          setDialogState(() {
                            isSaving = false;
                            errorMessage =
                                e.toString().replaceAll('Exception: ', '');
                          });
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                ),
                child: isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Save'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Disable Customer'),
        content: Text(
          'Disable this customer "${_customer?.fullName}"? They won\'t be able to log in.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _deleteCustomer();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Disable'),
          ),
        ],
      ),
    );
  }

  void _showAdjustLoyaltyDialog() {
    if (_customer == null) return;

    final amountController = TextEditingController();
    final descriptionController = TextEditingController();
    bool isSaving = false;
    String? errorMessage;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFB8860B).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.account_balance_wallet,
                    color: Color(0xFFB8860B),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Text('Adjust Loyalty Balance'),
              ],
            ),
            content: SizedBox(
              width: 400,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Current balance display
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.account_balance_wallet,
                              color: Color(0xFFB8860B)),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Current Balance',
                                style:
                                    TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                              Text(
                                'AED ${_customer!.loyalty.balanceAed.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFB8860B),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    if (errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red[300]!),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline,
                                color: Colors.red[700], size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                errorMessage!,
                                style: TextStyle(color: Colors.red[700]),
                              ),
                            ),
                          ],
                        ),
                      ),
                    TextField(
                      controller: amountController,
                      decoration: const InputDecoration(
                        labelText: 'Amount (AED) *',
                        hintText: 'e.g., 50 or -25',
                        helperText: 'Use negative value to deduct',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.attach_money),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(
                          decimal: true, signed: true),
                      enabled: !isSaving,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: descriptionController,
                      decoration: const InputDecoration(
                        labelText: 'Description (optional)',
                        hintText: 'e.g., Goodwill credit, Correction',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.description),
                      ),
                      maxLines: 2,
                      enabled: !isSaving,
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSaving ? null : () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: isSaving
                    ? null
                    : () async {
                        // Validate amount
                        final amountStr = amountController.text.trim();
                        final amount = double.tryParse(amountStr);

                        if (amount == null) {
                          setDialogState(() {
                            errorMessage = 'Please enter a valid number';
                          });
                          return;
                        }

                        if (amount == 0) {
                          setDialogState(() {
                            errorMessage = 'Amount cannot be 0';
                          });
                          return;
                        }

                        setDialogState(() {
                          isSaving = true;
                          errorMessage = null;
                        });

                        try {
                          final result =
                              await ApiService.customers.adjustLoyalty(
                            widget.customerId,
                            amountAed: amount,
                            description: descriptionController.text.trim(),
                          );

                          if (mounted) {
                            Navigator.of(context).pop();

                            // Show success snackbar
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  amount > 0
                                      ? 'Added AED ${amount.toStringAsFixed(2)} to loyalty balance'
                                      : 'Deducted AED ${amount.abs().toStringAsFixed(2)} from loyalty balance',
                                ),
                                backgroundColor: Colors.green,
                              ),
                            );

                            // Reload customer to refresh loyalty info
                            _loadCustomer();
                          }
                        } catch (e) {
                          setDialogState(() {
                            isSaving = false;
                            errorMessage =
                                e.toString().replaceAll('Exception: ', '');
                          });
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFB8860B),
                  foregroundColor: Colors.white,
                ),
                child: isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Save Adjustment'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _deleteCustomer() async {
    try {
      await ApiService.customers.deleteCustomer(widget.customerId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Customer disabled successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop(true); // Return true to signal refresh
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/customers',
        child: Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      color: Colors.white,
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back),
            tooltip: 'Back to Customers',
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _customer?.fullName ?? 'Customer Details',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (_customer != null)
                  Text(
                    _customer!.email,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
              ],
            ),
          ),
          if (_customer != null) ...[
            ElevatedButton.icon(
              onPressed: _showEditDialog,
              icon: const Icon(Icons.edit, size: 18),
              label: const Text('Edit'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton.icon(
              onPressed: _showAdjustLoyaltyDialog,
              icon: const Icon(Icons.account_balance_wallet, size: 18),
              label: const Text('Adjust Loyalty'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB8860B),
                foregroundColor: Colors.white,
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton.icon(
              onPressed: _showDeleteConfirmation,
              icon: const Icon(Icons.delete_outline, size: 18),
              label: const Text('Delete'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
            ),
            const SizedBox(width: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color:
                    _customer!.isActive ? Colors.green[100] : Colors.grey[200],
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _customer!.isActive ? 'Active' : 'Inactive',
                style: TextStyle(
                  color: _customer!.isActive
                      ? Colors.green[800]
                      : Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.black),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $_error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadCustomer,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_customer == null) {
      return const Center(child: Text('Customer not found'));
    }

    return Column(
      children: [
        _buildSummaryCard(),
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _tabController,
            labelColor: Colors.black,
            unselectedLabelColor: Colors.grey,
            indicatorColor: Colors.black,
            tabs: const [
              Tab(text: 'Details'),
              Tab(text: 'Addresses'),
              Tab(text: 'Orders'),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildDetailsTab(),
              _buildAddressesTab(),
              _buildOrdersTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard() {
    final customer = _customer!;
    final dateFormat = DateFormat('MMMM d, yyyy');

    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: Colors.grey[200],
            child: Text(
              customer.fullName.isNotEmpty
                  ? customer.fullName[0].toUpperCase()
                  : '?',
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  customer.fullName,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  customer.email,
                  style: TextStyle(color: Colors.grey[600]),
                ),
                if (customer.phone != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    customer.phone!,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ],
            ),
          ),
          _buildStatBox(
              'Orders', customer.ordersCount.toString(), Icons.shopping_bag),
          const SizedBox(width: 16),
          _buildStatBox('Addresses', customer.addressesCount.toString(),
              Icons.location_on),
          const SizedBox(width: 16),
          _buildLoyaltyStatBox(customer.loyalty.balanceAed),
          const SizedBox(width: 16),
          _buildStatBox('Member Since', dateFormat.format(customer.createdAt),
              Icons.calendar_today),
        ],
      ),
    );
  }

  Widget _buildLoyaltyStatBox(double balanceAed) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFB8860B).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: const Color(0xFFB8860B).withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        children: [
          const Icon(Icons.account_balance_wallet,
              color: Color(0xFFB8860B), size: 20),
          const SizedBox(height: 8),
          Text(
            'AED ${balanceAed.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFFB8860B),
            ),
          ),
          const Text(
            'Loyalty Balance',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFFB8860B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatBox(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.grey[600], size: 20),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailsTab() {
    final customer = _customer!;
    final dateFormat = DateFormat('MMMM d, yyyy \'at\' h:mm a');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Customer Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            _buildDetailRow('Full Name', customer.fullName),
            _buildDetailRow('Email', customer.email),
            _buildDetailRow('Phone', customer.phone ?? 'Not provided'),
            _buildDetailRow(
                'Status', customer.isActive ? 'Active' : 'Inactive'),
            _buildDetailRow('Created', dateFormat.format(customer.createdAt)),
            _buildDetailRow('Total Orders', customer.ordersCount.toString()),
            _buildDetailRow(
                'Total Addresses', customer.addressesCount.toString()),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 150,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressesTab() {
    final addresses = _customer!.addresses;

    return Column(
      children: [
        // Header with Add button
        Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${addresses.length} address${addresses.length == 1 ? '' : 'es'}',
                style: TextStyle(color: Colors.grey[600]),
              ),
              ElevatedButton.icon(
                onPressed: _showAddAddressDialog,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Address'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
        // Address list
        Expanded(
          child: addresses.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.location_off,
                          size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      const Text('No addresses yet'),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _showAddAddressDialog,
                        icon: const Icon(Icons.add),
                        label: const Text('Add First Address'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  itemCount: addresses.length,
                  itemBuilder: (context, index) {
                    final address = addresses[index];
                    return _buildAddressCard(address);
                  },
                ),
        ),
      ],
    );
  }

  void _showAddAddressDialog() {
    _showAddressFormDialog(null);
  }

  void _showEditAddressDialog(CustomerAddressDto address) {
    _showAddressFormDialog(address);
  }

  void _showAddressFormDialog(CustomerAddressDto? address) {
    final isEditing = address != null;
    final labelController = TextEditingController(text: address?.label ?? '');
    final fullNameController =
        TextEditingController(text: address?.fullName ?? '');
    final phoneController = TextEditingController(text: address?.phone ?? '');
    final cityController = TextEditingController(text: address?.city ?? '');
    final addressLine1Controller =
        TextEditingController(text: address?.addressLine1 ?? '');
    final addressLine2Controller =
        TextEditingController(text: address?.addressLine2 ?? '');
    bool isDefault = address?.isDefault ?? false;
    bool isSaving = false;
    String? errorMessage;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: Text(isEditing ? 'Edit Address' : 'Add Address'),
            content: SizedBox(
              width: 450,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red[300]!),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline,
                                color: Colors.red[700], size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                errorMessage!,
                                style: TextStyle(color: Colors.red[700]),
                              ),
                            ),
                          ],
                        ),
                      ),
                    TextField(
                      controller: labelController,
                      decoration: const InputDecoration(
                        labelText: 'Label (e.g. Home, Office)',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.label),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: fullNameController,
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.person),
                      ),
                      textCapitalization: TextCapitalization.words,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Phone',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.phone),
                      ),
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: cityController,
                      decoration: const InputDecoration(
                        labelText: 'City *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.location_city),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: addressLine1Controller,
                      decoration: const InputDecoration(
                        labelText: 'Address Line 1 *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.home),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: addressLine2Controller,
                      decoration: const InputDecoration(
                        labelText: 'Address Line 2',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.apartment),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      title: const Text('Default Address'),
                      subtitle: const Text('Use as primary shipping address'),
                      value: isDefault,
                      onChanged: (v) {
                        setDialogState(() => isDefault = v);
                      },
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSaving ? null : () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: isSaving
                    ? null
                    : () async {
                        // Validate required fields
                        if (cityController.text.trim().isEmpty) {
                          setDialogState(
                              () => errorMessage = 'City is required');
                          return;
                        }
                        if (addressLine1Controller.text.trim().isEmpty) {
                          setDialogState(() =>
                              errorMessage = 'Address Line 1 is required');
                          return;
                        }

                        setDialogState(() {
                          isSaving = true;
                          errorMessage = null;
                        });

                        try {
                          if (isEditing) {
                            final dto = UpdateAddressDto(
                              label: labelController.text.trim(),
                              fullName: fullNameController.text.trim(),
                              phone: phoneController.text.trim(),
                              city: cityController.text.trim(),
                              addressLine1: addressLine1Controller.text.trim(),
                              addressLine2: addressLine2Controller.text.trim(),
                              isDefault: isDefault,
                            );
                            await ApiService.customers
                                .updateAddress(address.id, dto);
                          } else {
                            final dto = CreateAddressDto(
                              label: labelController.text.trim(),
                              fullName: fullNameController.text.trim(),
                              phone: phoneController.text.trim(),
                              city: cityController.text.trim(),
                              addressLine1: addressLine1Controller.text.trim(),
                              addressLine2: addressLine2Controller.text.trim(),
                              isDefault: isDefault,
                            );
                            await ApiService.customers
                                .createAddress(widget.customerId, dto);
                          }

                          if (!context.mounted) return;
                          Navigator.pop(context);
                          _loadCustomer(); // Refresh customer data

                          ScaffoldMessenger.of(this.context).showSnackBar(
                            SnackBar(
                              content: Text(isEditing
                                  ? 'Address updated successfully'
                                  : 'Address added successfully'),
                              backgroundColor: Colors.green,
                            ),
                          );
                        } catch (e) {
                          setDialogState(() {
                            errorMessage =
                                e.toString().replaceAll('Exception: ', '');
                            isSaving = false;
                          });
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                ),
                child: isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(isEditing ? 'Save Changes' : 'Add Address'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showDeleteAddressConfirmation(CustomerAddressDto address) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Address'),
        content: Text(
          'Are you sure you want to delete this address?\n\n'
          '${address.label != null ? "${address.label}\n" : ""}'
          '${address.addressLine1}\n${address.city}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ApiService.customers.deleteAddress(address.id);
                _loadCustomer(); // Refresh customer data

                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Address deleted successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Failed to delete address: $e'),
                    backgroundColor: Colors.red,
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

  Future<void> _setDefaultAddress(CustomerAddressDto address) async {
    try {
      await ApiService.customers.setDefaultAddress(address.id);
      _loadCustomer(); // Refresh customer data

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Default address updated'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to set default address: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Widget _buildAddressCard(CustomerAddressDto address) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: address.isDefault
            ? Border.all(color: Colors.blue, width: 2)
            : Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    if (address.label != null && address.label!.isNotEmpty) ...[
                      Text(
                        address.label!,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    if (address.isDefault)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.blue[100],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Default',
                          style: TextStyle(
                            color: Colors.blue[800],
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              // Action buttons
              if (!address.isDefault)
                TextButton(
                  onPressed: () => _setDefaultAddress(address),
                  child: const Text('Set Default'),
                ),
              IconButton(
                onPressed: () => _showEditAddressDialog(address),
                icon: const Icon(Icons.edit, size: 18),
                tooltip: 'Edit',
                color: Colors.grey[600],
              ),
              IconButton(
                onPressed: () => _showDeleteAddressConfirmation(address),
                icon: const Icon(Icons.delete, size: 18),
                tooltip: 'Delete',
                color: Colors.red[400],
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (address.fullName != null && address.fullName!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                address.fullName!,
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
          Text(address.addressLine1),
          if (address.addressLine2 != null && address.addressLine2!.isNotEmpty)
            Text(address.addressLine2!),
          Text(address.city),
          if (address.phone != null && address.phone!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  Icon(Icons.phone, size: 14, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    address.phone!,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOrdersTab() {
    final orders = _customer!.orders;

    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_bag_outlined,
                size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('No orders yet'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        return _buildOrderCard(order);
      },
    );
  }

  Widget _buildOrderCard(CustomerOrderDto order) {
    final dateFormat = DateFormat('MMM d, yyyy');
    final currencyFormat =
        NumberFormat.currency(symbol: 'SAR ', decimalDigits: 2);

    Color statusColor;
    switch (order.status.toUpperCase()) {
      case 'COMPLETED':
      case 'DELIVERED':
        statusColor = Colors.green;
        break;
      case 'PENDING':
      case 'PROCESSING':
        statusColor = Colors.orange;
        break;
      case 'CANCELLED':
        statusColor = Colors.red;
        break;
      default:
        statusColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.orderNumber,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  dateFormat.format(order.createdAt),
                  style: TextStyle(color: Colors.grey[600], fontSize: 13),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                currencyFormat.format(order.total),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  order.status,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
