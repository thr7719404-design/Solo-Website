import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import '../../services/api_service.dart';

/// ═══════════════════════════════════════════════════════════════════
/// ADMIN ORDER DETAILS — Modern premium design
/// ═══════════════════════════════════════════════════════════════════
class AdminOrderDetailsScreen extends StatefulWidget {
  final String orderId;
  const AdminOrderDetailsScreen({super.key, required this.orderId});

  @override
  State<AdminOrderDetailsScreen> createState() =>
      _AdminOrderDetailsScreenState();
}

class _AdminOrderDetailsScreenState extends State<AdminOrderDetailsScreen> {
  Map<String, dynamic>? _order;
  bool _isLoading = true;
  bool _isUpdatingStatus = false;
  String? _error;

  // Design tokens
  static const _accent = Color(0xFF1A1A2E);
  static const _indigo = Color(0xFF6366F1);
  static const _surface = Color(0xFFF8F9FC);
  static const _success = Color(0xFF10B981);
  static const _danger = Color(0xFFEF4444);
  static const _warning = Color(0xFFF59E0B);
  static const _info = Color(0xFF3B82F6);
  static const _purple = Color(0xFF8B5CF6);

  static const List<String> _allStatuses = [
    'PENDING',
    'PAYMENT_PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ];

  @override
  void initState() {
    super.initState();
    _loadOrderDetails();
  }

  Future<void> _loadOrderDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final order = await ApiService.admin.getOrderById(widget.orderId);
      setState(() {
        _order = order;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _downloadInvoice() async {
    if (_order == null) return;
    try {
      _showSnack('Downloading invoice…', _info);
      final bytes = await ApiService.admin.downloadInvoicePdf(widget.orderId);
      final blob = html.Blob([bytes], 'application/pdf');
      final url = html.Url.createObjectUrlFromBlob(blob);
      // ignore: unused_local_variable
      final anchor = html.AnchorElement(href: url)
        ..setAttribute('download', 'invoice_${_order!['orderNumber']}.pdf')
        ..click();
      html.Url.revokeObjectUrl(url);
      _showSnack('Invoice downloaded', _success);
    } catch (e) {
      _showSnack('Could not download invoice: $e', _danger);
    }
  }

  Future<void> _updateStatus(String newStatus,
      {String? notes, String? trackingNumber}) async {
    setState(() => _isUpdatingStatus = true);
    try {
      await ApiService.admin.updateOrderStatus(
        widget.orderId,
        status: newStatus,
        notes: notes,
        trackingNumber: trackingNumber,
      );
      _showSnack('Status updated to $newStatus', _success);
      await _loadOrderDetails(); // Refresh
    } catch (e) {
      _showSnack('Failed to update status: $e', _danger);
    } finally {
      if (mounted) setState(() => _isUpdatingStatus = false);
    }
  }

  void _showUpdateStatusDialog() {
    final currentStatus = _order?['status'] as String? ?? 'PENDING';
    String selectedStatus = currentStatus;
    final notesController = TextEditingController();
    final trackingController =
        TextEditingController(text: _order?['trackingNumber'] ?? '');

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setDialogState) {
          return Dialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: _indigo.withOpacity(0.06),
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(16)),
                  ),
                  child: Row(children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                          color: _indigo.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.edit_note_rounded,
                          color: _indigo, size: 22),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                        child: Text('Update Order Status',
                            style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: _accent))),
                    IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () => Navigator.pop(ctx)),
                  ]),
                ),
                // Body
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _sectionLabel('NEW STATUS'),
                        const SizedBox(height: 8),
                        Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _allStatuses.map((s) {
                              final isSelected = selectedStatus == s;
                              final color = _statusColor(s);
                              return InkWell(
                                borderRadius: BorderRadius.circular(20),
                                onTap: () =>
                                    setDialogState(() => selectedStatus = s),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? color.withOpacity(0.15)
                                        : Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                        color: isSelected
                                            ? color.withOpacity(0.5)
                                            : Colors.grey.shade200),
                                  ),
                                  child: Text(s,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: isSelected
                                            ? color
                                            : Colors.grey[500],
                                      )),
                                ),
                              );
                            }).toList()),
                        if (selectedStatus == 'SHIPPED') ...[
                          const SizedBox(height: 18),
                          _sectionLabel('TRACKING NUMBER'),
                          const SizedBox(height: 8),
                          TextField(
                            controller: trackingController,
                            decoration: _inputDecor('Enter tracking number'),
                          ),
                        ],
                        const SizedBox(height: 18),
                        _sectionLabel('NOTES (OPTIONAL)'),
                        const SizedBox(height: 8),
                        TextField(
                          controller: notesController,
                          maxLines: 3,
                          decoration: _inputDecor('Add a note…'),
                        ),
                      ]),
                ),
                // Footer
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  child: Row(children: [
                    Expanded(
                        child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        side: BorderSide(color: Colors.grey.shade300),
                      ),
                      child: const Text('Cancel',
                          style: TextStyle(color: _accent)),
                    )),
                    const SizedBox(width: 12),
                    Expanded(
                        child: FilledButton(
                      onPressed: selectedStatus == currentStatus
                          ? null
                          : () {
                              Navigator.pop(ctx);
                              _updateStatus(
                                selectedStatus,
                                notes: notesController.text,
                                trackingNumber: selectedStatus == 'SHIPPED'
                                    ? trackingController.text
                                    : null,
                              );
                            },
                      style: FilledButton.styleFrom(
                        backgroundColor: _indigo,
                        disabledBackgroundColor: Colors.grey.shade200,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Update Status'),
                    )),
                  ]),
                ),
              ]),
            ),
          );
        });
      },
    );
  }

  InputDecoration _inputDecor(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade200)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade200)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: _indigo)),
      filled: true,
      fillColor: Colors.white,
    );
  }

  Widget _sectionLabel(String text) {
    return Text(text,
        style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Colors.grey[400],
            letterSpacing: 0.8));
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

  double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  String _fmtCurrency(double amount) => 'AED ${amount.toStringAsFixed(2)}';

  String _fmtDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      return DateFormat('MMM dd, yyyy — HH:mm').format(DateTime.parse(dateStr));
    } catch (_) {
      return dateStr;
    }
  }

  // ─── Status colors ─────────────────────────────────────────────
  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return _warning;
      case 'CONFIRMED':
        return _info;
      case 'PROCESSING':
        return _purple;
      case 'SHIPPED':
        return const Color(0xFF0D9488);
      case 'DELIVERED':
        return _success;
      case 'CANCELLED':
        return _danger;
      case 'DELAYED':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Color _paymentStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return _warning;
      case 'PAID':
        return _success;
      case 'FAILED':
        return _danger;
      case 'REFUNDED':
        return _purple;
      default:
        return Colors.grey;
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Icons.schedule_rounded;
      case 'CONFIRMED':
        return Icons.check_circle_outline_rounded;
      case 'PROCESSING':
        return Icons.sync_rounded;
      case 'SHIPPED':
        return Icons.local_shipping_rounded;
      case 'DELIVERED':
        return Icons.done_all_rounded;
      case 'CANCELLED':
        return Icons.cancel_outlined;
      case 'DELAYED':
        return Icons.warning_amber_rounded;
      default:
        return Icons.circle_outlined;
    }
  }

  /// Parse the actual target status from the notes (e.g. "Status changed to Delivered")
  String _parseTargetStatus(Map<String, dynamic> entry) {
    final notes = entry['notes'] as String?;
    if (notes != null && notes.contains('Status changed to ')) {
      final target = notes.replaceFirst('Status changed to ', '').trim();
      return target.toUpperCase();
    }
    if (notes != null && notes.contains('Tracking:')) {
      return 'SHIPPED';
    }
    return entry['status'] ?? 'UNKNOWN';
  }

  // ─── Build ─────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _surface,
      appBar: _buildAppBar(),
      body: _buildBody(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded, color: _accent),
        onPressed: () => Navigator.pop(context),
      ),
      title: Text(
        _order != null ? 'Order #${_order!['orderNumber']}' : 'Order Details',
        style: const TextStyle(
            fontSize: 17, fontWeight: FontWeight.w700, color: _accent),
      ),
      actions: [
        if (_order != null) ...[
          _appBarAction(Icons.edit_note_rounded, 'Update Status',
              _showUpdateStatusDialog),
          _appBarAction(
              Icons.receipt_long_rounded, 'Invoice', _downloadInvoice),
        ],
        _appBarAction(Icons.refresh_rounded, 'Refresh', _loadOrderDetails),
        const SizedBox(width: 8),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: Colors.grey.shade100),
      ),
    );
  }

  Widget _appBarAction(IconData icon, String tooltip, VoidCallback onTap) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(8),
          margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 8),
          decoration: BoxDecoration(
            color: _surface,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 20, color: _accent),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
        SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: _accent)),
        const SizedBox(height: 16),
        Text('Loading order…',
            style: TextStyle(fontSize: 14, color: Colors.grey[400])),
      ]));
    }

    if (_error != null) {
      return Center(
          child: Container(
        margin: const EdgeInsets.all(32),
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _danger.withOpacity(0.15)),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
                color: _danger.withOpacity(0.1),
                borderRadius: BorderRadius.circular(14)),
            child: Icon(Icons.error_outline_rounded, color: _danger, size: 28),
          ),
          const SizedBox(height: 16),
          Text('Error loading order',
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w600, color: _danger)),
          const SizedBox(height: 8),
          Text(_error!,
              style: TextStyle(fontSize: 13, color: Colors.grey[500]),
              textAlign: TextAlign.center),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: _loadOrderDetails,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Retry'),
            style: FilledButton.styleFrom(backgroundColor: _indigo),
          ),
        ]),
      ));
    }

    if (_order == null) {
      return const Center(child: Text('Order not found'));
    }

    final isMobile = MediaQuery.of(context).size.width < 900;
    final pad = isMobile ? 16.0 : 28.0;

    return ListView(
      padding: EdgeInsets.all(pad),
      children: [
        _buildHeaderSection(),
        const SizedBox(height: 16),
        _buildStatusUpdateBar(),
        const SizedBox(height: 20),
        // Two-column layout for addresses on desktop
        if (!isMobile)
          IntrinsicHeight(
            child:
                Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Expanded(child: _buildCustomerCard()),
              const SizedBox(width: 16),
              Expanded(child: _buildAddressesRow()),
            ]),
          )
        else ...[
          _buildCustomerCard(),
          const SizedBox(height: 16),
          _buildAddressCard('Shipping Address', Icons.local_shipping_outlined,
              _order!['shippingAddress']),
          const SizedBox(height: 16),
          _buildAddressCard('Billing Address', Icons.receipt_long_outlined,
              _order!['billingAddress']),
        ],
        const SizedBox(height: 20),
        _buildOrderItemsCard(),
        const SizedBox(height: 20),
        if (!isMobile)
          IntrinsicHeight(
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(flex: 3, child: _buildOrderSummaryCard()),
              const SizedBox(width: 16),
              Expanded(flex: 4, child: _buildStatusHistoryCard()),
            ]),
          )
        else ...[
          _buildOrderSummaryCard(),
          const SizedBox(height: 20),
          _buildStatusHistoryCard(),
        ],
        const SizedBox(height: 40),
      ],
    );
  }

  // ─── Header Section ──────────────────────────────────────────
  Widget _buildHeaderSection() {
    final status = _order!['status'] ?? 'UNKNOWN';
    final paymentStatus = _order!['paymentStatus'] ?? 'UNKNOWN';
    final createdAt = _fmtDate(_order!['createdAt']?.toString());
    final paymentMethod =
        _order!['paymentMethod']?.toString().replaceAll('_', ' ') ?? 'N/A';

    return _card(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
                color: _indigo.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12)),
            child: Icon(Icons.receipt_rounded, color: _indigo, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text('Order #${_order!['orderNumber']}',
                    style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: _accent,
                        letterSpacing: -0.3)),
                const SizedBox(height: 4),
                Text('Placed $createdAt',
                    style: TextStyle(fontSize: 13, color: Colors.grey[500])),
              ])),
          _statusBadge(status, _statusColor(status)),
          const SizedBox(width: 8),
          _statusBadge(paymentStatus, _paymentStatusColor(paymentStatus)),
        ]),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _surface,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(children: [
            _headerPill(Icons.payment_rounded, 'Payment', paymentMethod),
            _dividerVertical(),
            _headerPill(
                Icons.local_shipping_outlined,
                'Shipping',
                _order!['shippingMethod']?.toString().replaceAll('_', ' ') ??
                    'N/A'),
            if (_order!['trackingNumber'] != null &&
                (_order!['trackingNumber'] as String).isNotEmpty) ...[
              _dividerVertical(),
              _headerPill(
                  Icons.qr_code_rounded, 'Tracking', _order!['trackingNumber']),
            ],
          ]),
        ),
      ]),
    );
  }

  Widget _headerPill(IconData icon, String label, String value) {
    return Expanded(
        child: Row(children: [
      Icon(icon, size: 16, color: Colors.grey[400]),
      const SizedBox(width: 8),
      Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Colors.grey[400],
                letterSpacing: 0.5)),
        Text(value,
            style: const TextStyle(
                fontSize: 12, fontWeight: FontWeight.w600, color: _accent),
            overflow: TextOverflow.ellipsis),
      ])),
    ]));
  }

  Widget _dividerVertical() {
    return Container(
        width: 1,
        height: 28,
        margin: const EdgeInsets.symmetric(horizontal: 12),
        color: Colors.grey.shade200);
  }

  Widget _statusBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
              letterSpacing: 0.3)),
    );
  }

  // ─── Quick Status Update Bar ──────────────────────────────────
  Widget _buildStatusUpdateBar() {
    final currentStatus = _order!['status'] ?? 'PENDING';
    return _card(
        child: Row(children: [
      Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
            color: _warning.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8)),
        child: Icon(Icons.update_rounded, size: 17, color: _warning),
      ),
      const SizedBox(width: 12),
      const Expanded(
          child: Text('Update Status',
              style: TextStyle(
                  fontSize: 14, fontWeight: FontWeight.w600, color: _accent))),
      if (_isUpdatingStatus)
        const SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2, color: _indigo))
      else
        SizedBox(
          height: 36,
          child: PopupMenuButton<String>(
            tooltip: 'Change status',
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            offset: const Offset(0, 40),
            onSelected: (newStatus) {
              if (newStatus == 'SHIPPED') {
                _showUpdateStatusDialog();
              } else {
                _updateStatus(newStatus);
              }
            },
            itemBuilder: (_) => _allStatuses
                .where((s) => s != currentStatus)
                .map((s) => PopupMenuItem(
                      value: s,
                      child: Row(children: [
                        Icon(_statusIcon(s), size: 16, color: _statusColor(s)),
                        const SizedBox(width: 10),
                        Text(s,
                            style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: _statusColor(s))),
                      ]),
                    ))
                .toList(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: _indigo,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: const [
                Icon(Icons.swap_vert_rounded, size: 16, color: Colors.white),
                SizedBox(width: 6),
                Text('Change',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.white)),
              ]),
            ),
          ),
        ),
    ]));
  }

  // ─── Customer Card ────────────────────────────────────────────
  Widget _buildCustomerCard() {
    final customer = _order!['customer'] as Map<String, dynamic>?;
    if (customer == null) return const SizedBox.shrink();

    final name =
        '${customer['firstName'] ?? ''} ${customer['lastName'] ?? ''}'.trim();
    final email = customer['email'] ?? 'N/A';
    final phone = customer['phone'] as String?;

    return _card(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _cardHeader(Icons.person_outline_rounded, 'Customer'),
      const SizedBox(height: 16),
      Row(children: [
        CircleAvatar(
          radius: 22,
          backgroundColor: _indigo.withOpacity(0.1),
          child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
              style: const TextStyle(
                  fontSize: 18, fontWeight: FontWeight.w700, color: _indigo)),
        ),
        const SizedBox(width: 14),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name.isNotEmpty ? name : 'Unknown',
              style: const TextStyle(
                  fontSize: 14, fontWeight: FontWeight.w600, color: _accent)),
          const SizedBox(height: 2),
          Text(email, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
          if (phone != null && phone.isNotEmpty)
            Text(phone,
                style: TextStyle(fontSize: 12, color: Colors.grey[500])),
        ])),
      ]),
    ]));
  }

  // ─── Two-column Addresses ──────────────────────────────────────
  Widget _buildAddressesRow() {
    return Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Expanded(
          child: _buildAddressCard('Shipping Address',
              Icons.local_shipping_outlined, _order!['shippingAddress'])),
      const SizedBox(width: 16),
      Expanded(
          child: _buildAddressCard('Billing Address',
              Icons.receipt_long_outlined, _order!['billingAddress'])),
    ]);
  }

  Widget _buildAddressCard(
      String title, IconData icon, Map<String, dynamic>? address) {
    if (address == null) return const SizedBox.shrink();

    final fullName =
        '${address['firstName'] ?? ''} ${address['lastName'] ?? ''}'.trim();
    final line1 = address['addressLine1'] ?? '';
    final line2 = address['addressLine2'] ?? '';
    final city = address['city'] ?? '';
    final postalCode = address['postalCode'] ?? '';
    final phone = address['phone'] ?? '';

    return _card(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _cardHeader(icon, title),
      const SizedBox(height: 14),
      if (fullName.isNotEmpty)
        Text(fullName,
            style: const TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600, color: _accent)),
      const SizedBox(height: 4),
      if (line1.isNotEmpty) _addressLine(line1),
      if (line2.isNotEmpty) _addressLine(line2),
      if (city.isNotEmpty || postalCode.isNotEmpty)
        _addressLine('$city${postalCode.isNotEmpty ? ', $postalCode' : ''}'),
      if (phone.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Row(children: [
            Icon(Icons.phone_outlined, size: 14, color: Colors.grey[400]),
            const SizedBox(width: 6),
            Text(phone,
                style: TextStyle(fontSize: 12, color: Colors.grey[500])),
          ]),
        ),
    ]));
  }

  Widget _addressLine(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Text(text,
          style: TextStyle(fontSize: 13, color: Colors.grey[600], height: 1.4)),
    );
  }

  // ─── Order Items ──────────────────────────────────────────────
  Widget _buildOrderItemsCard() {
    final items = (_order!['items'] as List<dynamic>?) ?? [];

    return _card(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        _cardHeader(Icons.shopping_bag_outlined, 'Order Items'),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
              color: _indigo.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12)),
          child: Text('${items.length} item${items.length != 1 ? 's' : ''}',
              style: const TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w600, color: _indigo)),
        ),
      ]),
      const SizedBox(height: 16),
      ...items.asMap().entries.map((e) {
        final isLast = e.key == items.length - 1;
        return Column(children: [
          _buildOrderItem(e.value as Map<String, dynamic>),
          if (!isLast) Divider(height: 24, color: Colors.grey.shade100),
        ]);
      }),
    ]));
  }

  Widget _buildOrderItem(Map<String, dynamic> item) {
    final imageUrl = item['imageUrl'] as String?;
    final name = item['name'] ?? 'Unknown Product';
    final sku = item['sku'] ?? 'N/A';
    final quantity = item['quantity'] ?? 0;
    final unitPrice = _toDouble(item['unitPrice']);
    final subtotal = _toDouble(item['subtotal']);

    final hasValidImage =
        imageUrl != null && imageUrl.isNotEmpty && imageUrl.startsWith('http');

    return Row(children: [
      Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade100),
        ),
        clipBehavior: Clip.antiAlias,
        child: hasValidImage
            ? Image.network(imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _imagePlaceholder())
            : _imagePlaceholder(),
      ),
      const SizedBox(width: 14),
      Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(name,
            style: const TextStyle(
                fontSize: 14, fontWeight: FontWeight.w600, color: _accent)),
        const SizedBox(height: 4),
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(4)),
            child: Text('SKU: $sku',
                style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w500)),
          ),
          const SizedBox(width: 8),
          Text('Qty: $quantity × ${_fmtCurrency(unitPrice)}',
              style: TextStyle(fontSize: 12, color: Colors.grey[500])),
        ]),
      ])),
      Text(_fmtCurrency(subtotal),
          style: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w700, color: _accent)),
    ]);
  }

  Widget _imagePlaceholder() {
    return Container(
      color: _surface,
      child: Center(
          child: Icon(Icons.inventory_2_outlined,
              size: 24, color: Colors.grey[300])),
    );
  }

  // ─── Order Summary ────────────────────────────────────────────
  Widget _buildOrderSummaryCard() {
    final subtotal = _toDouble(_order!['subtotal']);
    final discount = _toDouble(_order!['discount']);
    final vat = _toDouble(_order!['vat']);
    final shippingCost = _toDouble(_order!['shippingCost']);
    final total = _toDouble(_order!['total']);
    final redeem = _toDouble(_order!['loyaltyRedeemAed']);
    final earned = _toDouble(_order!['loyaltyEarnAed']);
    final promoCode = _order!['promoCode'] as String?;
    final notes = _order!['notes'] as String?;

    return _card(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _cardHeader(Icons.receipt_outlined, 'Order Summary'),
      const SizedBox(height: 18),
      _summaryLine('Subtotal', _fmtCurrency(subtotal)),
      if (discount > 0)
        _summaryLine('Discount', '-${_fmtCurrency(discount)}', color: _success),
      _summaryLine(
          'Shipping', shippingCost > 0 ? _fmtCurrency(shippingCost) : 'Free',
          color: shippingCost == 0 ? _success : null),
      _summaryLine('VAT', _fmtCurrency(vat)),
      if (redeem > 0)
        _summaryLine('Loyalty Redeemed', '-${_fmtCurrency(redeem)}',
            color: _warning),
      Divider(height: 28, color: Colors.grey.shade200),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('Total',
            style: TextStyle(
                fontSize: 16, fontWeight: FontWeight.w700, color: _accent)),
        Text(_fmtCurrency(total),
            style: const TextStyle(
                fontSize: 16, fontWeight: FontWeight.w700, color: _accent)),
      ]),
      if (earned > 0) ...[
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: _success.withOpacity(0.06),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: _success.withOpacity(0.15)),
          ),
          child: Row(children: [
            Icon(Icons.stars_rounded, size: 16, color: _success),
            const SizedBox(width: 8),
            Text('Loyalty Earned: +${_fmtCurrency(earned)}',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _success)),
          ]),
        ),
      ],
      if (promoCode != null && promoCode.isNotEmpty) ...[
        const SizedBox(height: 10),
        Row(children: [
          Icon(Icons.confirmation_number_outlined,
              size: 14, color: Colors.grey[400]),
          const SizedBox(width: 6),
          Text('Promo: ',
              style: TextStyle(fontSize: 12, color: Colors.grey[500])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
                color: _indigo.withOpacity(0.08),
                borderRadius: BorderRadius.circular(6)),
            child: Text(promoCode,
                style: const TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w700, color: _indigo)),
          ),
        ]),
      ],
      if (notes != null && notes.isNotEmpty) ...[
        const SizedBox(height: 10),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(Icons.notes_rounded, size: 14, color: Colors.grey[400]),
          const SizedBox(width: 6),
          Expanded(
              child: Text(notes,
                  style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[500],
                      fontStyle: FontStyle.italic))),
        ]),
      ],
    ]));
  }

  Widget _summaryLine(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
        Text(value,
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: color ?? _accent)),
      ]),
    );
  }

  // ─── Status History (Timeline) ────────────────────────────────
  Widget _buildStatusHistoryCard() {
    final history = (_order!['statusHistory'] as List<dynamic>?) ?? [];
    if (history.isEmpty) return const SizedBox.shrink();

    // Deduplicate: collapse entries with exact same notes + status within 5s
    final dedupedHistory = <Map<String, dynamic>>[];
    for (final entry in history) {
      final e = entry as Map<String, dynamic>;
      if (dedupedHistory.isEmpty) {
        dedupedHistory.add(e);
        continue;
      }
      final prev = dedupedHistory.last;
      final prevNotes = prev['notes'] ?? '';
      final currNotes = e['notes'] ?? '';
      if (prevNotes == currNotes && prev['status'] == e['status']) {
        continue; // Skip exact duplicate
      }
      dedupedHistory.add(e);
    }

    return _card(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        _cardHeader(Icons.timeline_rounded, 'Status History'),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12)),
          child: Text(
              '${dedupedHistory.length} update${dedupedHistory.length != 1 ? 's' : ''}',
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[500])),
        ),
      ]),
      const SizedBox(height: 20),
      ...dedupedHistory.asMap().entries.map((e) {
        final isLast = e.key == dedupedHistory.length - 1;
        final isFirst = e.key == 0;
        return _buildTimelineItem(e.value, isFirst: isFirst, isLast: isLast);
      }),
    ]));
  }

  Widget _buildTimelineItem(Map<String, dynamic> entry,
      {bool isFirst = false, bool isLast = false}) {
    final targetStatus = _parseTargetStatus(entry);
    final color = _statusColor(targetStatus);
    final icon = _statusIcon(targetStatus);
    final notes = entry['notes'] as String?;
    final createdAt = entry['createdAt'] != null
        ? DateFormat('MMM dd, yyyy — HH:mm')
            .format(DateTime.parse(entry['createdAt'].toString()))
        : 'N/A';

    // Clean up the display note (remove "Status changed to X" redundancy)
    String? displayNote;
    if (notes != null) {
      if (notes.startsWith('Status changed to ')) {
        displayNote = null; // The badge already shows the target status
      } else if (notes.contains(' - Tracking: ')) {
        final parts = notes.split(' - Tracking: ');
        displayNote = 'Tracking: ${parts.last}';
      } else {
        displayNote = notes;
      }
    }

    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Timeline track
        SizedBox(
            width: 40,
            child: Column(children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color:
                      isFirst ? color.withOpacity(0.15) : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: isFirst
                          ? color.withOpacity(0.4)
                          : Colors.grey.shade200),
                ),
                child: Icon(icon,
                    size: 16, color: isFirst ? color : Colors.grey[400]),
              ),
              if (!isLast)
                Expanded(
                    child: Container(
                  width: 2,
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  color: Colors.grey.shade200,
                )),
            ])),
        const SizedBox(width: 12),
        // Content
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(targetStatus,
                      style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: color)),
                ),
                const Spacer(),
                Text(createdAt,
                    style: TextStyle(fontSize: 11, color: Colors.grey[400])),
              ]),
              if (displayNote != null) ...[
                const SizedBox(height: 4),
                Text(displayNote,
                    style: TextStyle(fontSize: 12, color: Colors.grey[500])),
              ],
            ]),
          ),
        ),
      ]),
    );
  }

  // ─── Shared Widgets ───────────────────────────────────────────
  Widget _card({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
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
      child: child,
    );
  }

  Widget _cardHeader(IconData icon, String title) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
            color: _indigo.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, size: 17, color: _indigo),
      ),
      const SizedBox(width: 10),
      Text(title,
          style: const TextStyle(
              fontSize: 15, fontWeight: FontWeight.w700, color: _accent)),
    ]);
  }
}
