import 'package:flutter/material.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

/// ═══════════════════════════════════════════════════════════════════
/// ADMIN PROMO CODES — Modern premium design
/// ═══════════════════════════════════════════════════════════════════
class AdminPromoCodesScreen extends StatefulWidget {
  const AdminPromoCodesScreen({super.key});

  @override
  State<AdminPromoCodesScreen> createState() => _AdminPromoCodesScreenState();
}

class _AdminPromoCodesScreenState extends State<AdminPromoCodesScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _promoCodes = [];
  String? _error;

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
    _loadPromoCodes();
  }

  Future<void> _loadPromoCodes() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ApiService.client.get(
        '/promo-codes',
        queryParams: {'limit': 100},
        requiresAuth: true,
      );
      if (response.success) {
        setState(() {
          _promoCodes =
              List<Map<String, dynamic>>.from(response.data['data'] ?? []);
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = response.errorMessage ?? 'Failed to load promo codes';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _deletePromoCode(String id, String code) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => _ConfirmDialog(
        title: 'Delete Promo Code',
        message:
            'Are you sure you want to permanently delete "$code"? This action cannot be undone.',
        confirmLabel: 'Delete',
        confirmColor: _danger,
      ),
    );
    if (confirm != true) return;

    try {
      final response = await ApiService.client
          .delete('/promo-codes/$id', requiresAuth: true);
      if (response.success) {
        _showSnack('Promo code "$code" deleted', _success);
        _loadPromoCodes();
      }
    } catch (e) {
      _showSnack('Error: $e', _danger);
    }
  }

  Future<void> _toggleActive(String id, bool currentActive) async {
    try {
      final response = await ApiService.client.put(
        '/promo-codes/$id',
        body: {'isActive': !currentActive},
        requiresAuth: true,
      );
      if (response.success) {
        _showSnack(
            currentActive ? 'Promo code deactivated' : 'Promo code activated',
            _info);
        _loadPromoCodes();
      }
    } catch (e) {
      _showSnack('Error: $e', _danger);
    }
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

  void _showCreateEditDialog([Map<String, dynamic>? promo]) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _PromoCodeFormDialog(
        promo: promo,
        onSaved: () {
          Navigator.pop(ctx);
          _loadPromoCodes();
        },
      ),
    );
  }

  void _showOrdersDialog(Map<String, dynamic> promo) {
    showDialog(
      context: context,
      builder: (ctx) => _PromoOrdersDialog(promo: promo),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/promo-codes',
        child: Container(
          color: _surface,
          child: _isLoading ? _buildLoading() : _buildContent(),
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
        Text('Loading promo codes…',
            style: TextStyle(fontSize: 14, color: Colors.grey[400])),
      ]),
    );
  }

  Widget _buildContent() {
    final isMobile = MediaQuery.of(context).size.width < 900;
    final pad = isMobile ? 16.0 : 28.0;

    // Summary stats
    final activeCount = _promoCodes.where((p) {
      final isExpired = p['expiresAt'] != null &&
          DateTime.parse(p['expiresAt']).isBefore(DateTime.now());
      return p['isActive'] == true && !isExpired;
    }).length;
    final totalUsage = _promoCodes.fold<int>(
        0, (sum, p) => sum + ((p['usageCount'] as int?) ?? 0));

    return RefreshIndicator(
      onRefresh: _loadPromoCodes,
      child: ListView(
        padding: EdgeInsets.all(pad),
        children: [
          // ── Header ──
          Row(children: [
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Promo Codes',
                        style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: _accent,
                            letterSpacing: -0.5)),
                    const SizedBox(height: 4),
                    Text('Manage discount codes for your store',
                        style:
                            TextStyle(fontSize: 14, color: Colors.grey[500])),
                  ]),
            ),
            FilledButton.icon(
              onPressed: () => _showCreateEditDialog(),
              icon: const Icon(Icons.add_rounded, size: 20),
              label: const Text('New Promo Code'),
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
            _summaryTile('Total Codes', '${_promoCodes.length}',
                Icons.local_offer_outlined, _purple),
            const SizedBox(width: 14),
            _summaryTile(
                'Active', '$activeCount', Icons.check_circle_outline, _success),
            const SizedBox(width: 14),
            _summaryTile(
                'Total Uses', '$totalUsage', Icons.bar_chart_rounded, _info),
          ]),
          const SizedBox(height: 24),

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
              ]),
            ),
            const SizedBox(height: 16),
          ],

          // ── Empty State ──
          if (_promoCodes.isEmpty && !_isLoading) _buildEmptyState(),

          // ── Promo Cards ──
          if (_promoCodes.isNotEmpty)
            ..._promoCodes.map((promo) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildPromoCard(promo),
                )),

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

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Column(children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
              color: _purple.withOpacity(0.08), shape: BoxShape.circle),
          child: Icon(Icons.local_offer_outlined, size: 32, color: _purple),
        ),
        const SizedBox(height: 18),
        Text('No promo codes yet',
            style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700])),
        const SizedBox(height: 6),
        Text('Create your first promo code to start offering discounts',
            style: TextStyle(fontSize: 13, color: Colors.grey[400])),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: () => _showCreateEditDialog(),
          icon: const Icon(Icons.add_rounded, size: 18),
          label: const Text('Create Promo Code'),
          style: OutlinedButton.styleFrom(
            foregroundColor: _indigo,
            side: BorderSide(color: _indigo.withOpacity(0.3)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
      ]),
    );
  }

  Widget _buildPromoCard(Map<String, dynamic> promo) {
    final isExpired = promo['expiresAt'] != null &&
        DateTime.parse(promo['expiresAt']).isBefore(DateTime.now());
    final isActive = promo['isActive'] == true && !isExpired;
    final code = promo['code'] ?? '';
    final type = promo['type'] ?? '';
    final usageCount = promo['usageCount'] ?? 0;
    final usageLimit = promo['usageLimit'];
    final description = promo['description'] as String?;

    Color statusColor = isActive ? _success : (isExpired ? _warning : _danger);
    String statusText =
        isActive ? 'Active' : (isExpired ? 'Expired' : 'Inactive');

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: isActive ? Colors.grey.shade100 : _danger.withOpacity(0.12)),
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
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              // ── Left: Icon ──
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: _typeColor(type).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_typeIcon(type), color: _typeColor(type), size: 22),
              ),
              const SizedBox(width: 16),

              // ── Middle: Info ──
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        // Code badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _accent.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(code,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: _accent,
                                fontFamily: 'monospace',
                                letterSpacing: 1,
                              )),
                        ),
                        const SizedBox(width: 10),
                        // Status pill
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(statusText,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              )),
                        ),
                      ]),
                      const SizedBox(height: 8),
                      // Details row
                      Wrap(spacing: 16, runSpacing: 4, children: [
                        _detailChip(Icons.sell_outlined, _formatType(type)),
                        _detailChip(Icons.attach_money_rounded,
                            _formatValue(type, promo['value'])),
                        _detailChip(Icons.people_outline,
                            '$usageCount${usageLimit != null ? '/$usageLimit' : ''} uses'),
                        _detailChip(
                            Icons.event_outlined,
                            promo['expiresAt'] != null
                                ? 'Expires ${DateFormat('MMM d, yyyy').format(DateTime.parse(promo['expiresAt']))}'
                                : 'No expiry'),
                      ]),
                      if (description != null && description.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(description,
                            style: TextStyle(
                                fontSize: 12, color: Colors.grey[400]),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                      ],
                    ]),
              ),
              const SizedBox(width: 12),

              // ── Right: Actions ──
              Row(mainAxisSize: MainAxisSize.min, children: [
                _actionBtn(Icons.receipt_long_outlined, 'View Orders',
                    Colors.grey[600]!, () => _showOrdersDialog(promo)),
                _actionBtn(Icons.edit_outlined, 'Edit', _info,
                    () => _showCreateEditDialog(promo)),
                _actionBtn(
                  promo['isActive'] == true
                      ? Icons.pause_circle_outline
                      : Icons.play_circle_outline,
                  promo['isActive'] == true ? 'Deactivate' : 'Activate',
                  promo['isActive'] == true ? _warning : _success,
                  () => _toggleActive(promo['id'], promo['isActive'] == true),
                ),
                _actionBtn(Icons.delete_outline, 'Delete', _danger,
                    () => _deletePromoCode(promo['id'], code)),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailChip(IconData icon, String text) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 14, color: Colors.grey[400]),
      const SizedBox(width: 4),
      Text(text,
          style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500)),
    ]);
  }

  Widget _actionBtn(
      IconData icon, String tip, Color color, VoidCallback onTap) {
    return Tooltip(
      message: tip,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Container(
          width: 34,
          height: 34,
          margin: const EdgeInsets.only(left: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 17, color: color),
        ),
      ),
    );
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'PERCENTAGE':
        return _purple;
      case 'FIXED_AMOUNT':
        return _info;
      case 'FREE_SHIPPING':
        return _success;
      default:
        return Colors.grey;
    }
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'PERCENTAGE':
        return Icons.percent_rounded;
      case 'FIXED_AMOUNT':
        return Icons.payments_outlined;
      case 'FREE_SHIPPING':
        return Icons.local_shipping_outlined;
      default:
        return Icons.local_offer_outlined;
    }
  }

  String _formatType(String? type) {
    switch (type) {
      case 'PERCENTAGE':
        return 'Percentage';
      case 'FIXED_AMOUNT':
        return 'Fixed Amount';
      case 'FREE_SHIPPING':
        return 'Free Shipping';
      default:
        return type ?? '';
    }
  }

  String _formatValue(String? type, dynamic value) {
    final v =
        (value is num) ? value.toDouble() : (double.tryParse('$value') ?? 0);
    switch (type) {
      case 'PERCENTAGE':
        return '${v.toStringAsFixed(0)}% off';
      case 'FIXED_AMOUNT':
        return 'AED ${v.toStringAsFixed(2)} off';
      case 'FREE_SHIPPING':
        return 'Free shipping';
      default:
        return v.toString();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  CONFIRM DIALOG
// ═══════════════════════════════════════════════════════════════════
class _ConfirmDialog extends StatelessWidget {
  final String title;
  final String message;
  final String confirmLabel;
  final Color confirmColor;

  const _ConfirmDialog({
    required this.title,
    required this.message,
    required this.confirmLabel,
    required this.confirmColor,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 380,
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
                color: confirmColor.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(Icons.warning_amber_rounded,
                color: confirmColor, size: 24),
          ),
          const SizedBox(height: 16),
          Text(title,
              style:
                  const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(message,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          const SizedBox(height: 24),
          Row(children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context, false),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                  side: BorderSide(color: Colors.grey.shade300),
                ),
                child:
                    Text('Cancel', style: TextStyle(color: Colors.grey[700])),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: () => Navigator.pop(context, true),
                style: FilledButton.styleFrom(
                  backgroundColor: confirmColor,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(confirmLabel),
              ),
            ),
          ]),
        ]),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
//  PROMO CODE CREATE / EDIT DIALOG — Modern Design
// ═══════════════════════════════════════════════════════════════════
class _PromoCodeFormDialog extends StatefulWidget {
  final Map<String, dynamic>? promo;
  final VoidCallback onSaved;

  const _PromoCodeFormDialog({this.promo, required this.onSaved});

  @override
  State<_PromoCodeFormDialog> createState() => _PromoCodeFormDialogState();
}

class _PromoCodeFormDialogState extends State<_PromoCodeFormDialog> {
  final _formKey = GlobalKey<FormState>();
  bool _isSaving = false;

  static const _accent = Color(0xFF1A1A2E);
  static const _indigo = Color(0xFF6366F1);

  late final TextEditingController _codeCtrl;
  late final TextEditingController _descCtrl;
  late final TextEditingController _valueCtrl;
  late final TextEditingController _minOrderCtrl;
  late final TextEditingController _maxDiscountCtrl;
  late final TextEditingController _usageLimitCtrl;

  String _type = 'PERCENTAGE';
  bool _isActive = true;
  DateTime _startsAt = DateTime.now();
  DateTime? _expiresAt;

  bool get _isEditing => widget.promo != null;

  @override
  void initState() {
    super.initState();
    final p = widget.promo;
    _codeCtrl = TextEditingController(text: p?['code'] ?? '');
    _descCtrl = TextEditingController(text: p?['description'] ?? '');
    _valueCtrl = TextEditingController(text: (p?['value'] ?? '').toString());
    _minOrderCtrl =
        TextEditingController(text: p?['minOrderAmount']?.toString() ?? '');
    _maxDiscountCtrl =
        TextEditingController(text: p?['maxDiscount']?.toString() ?? '');
    _usageLimitCtrl =
        TextEditingController(text: p?['usageLimit']?.toString() ?? '');

    if (p != null) {
      _type = p['type'] ?? 'PERCENTAGE';
      _isActive = p['isActive'] ?? true;
      _startsAt = p['startsAt'] != null
          ? DateTime.parse(p['startsAt'])
          : DateTime.now();
      _expiresAt =
          p['expiresAt'] != null ? DateTime.parse(p['expiresAt']) : null;
    }
  }

  @override
  void dispose() {
    _codeCtrl.dispose();
    _descCtrl.dispose();
    _valueCtrl.dispose();
    _minOrderCtrl.dispose();
    _maxDiscountCtrl.dispose();
    _usageLimitCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    try {
      final body = <String, dynamic>{
        'code': _codeCtrl.text.trim().toUpperCase(),
        'description':
            _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
        'type': _type,
        'value': double.tryParse(_valueCtrl.text) ?? 0,
        'isActive': _isActive,
        'startsAt': _startsAt.toIso8601String(),
      };

      if (_minOrderCtrl.text.isNotEmpty)
        body['minOrderAmount'] = double.tryParse(_minOrderCtrl.text) ?? 0;
      if (_maxDiscountCtrl.text.isNotEmpty)
        body['maxDiscount'] = double.tryParse(_maxDiscountCtrl.text) ?? 0;
      if (_usageLimitCtrl.text.isNotEmpty)
        body['usageLimit'] = int.tryParse(_usageLimitCtrl.text);
      if (_expiresAt != null) body['expiresAt'] = _expiresAt!.toIso8601String();

      final response = _isEditing
          ? await ApiService.client.put('/promo-codes/${widget.promo!['id']}',
              body: body, requiresAuth: true)
          : await ApiService.client
              .post('/promo-codes', body: body, requiresAuth: true);

      if (response.success) {
        widget.onSaved();
      } else {
        throw Exception(response.errorMessage ?? 'Failed to save');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _pickDate(bool isStart) async {
    final initial = isStart
        ? _startsAt
        : (_expiresAt ?? DateTime.now().add(const Duration(days: 30)));
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2024),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
                primary: _indigo,
                onPrimary: Colors.white,
                surface: Colors.white),
          ),
          child: child!,
        );
      },
    );
    if (date != null) {
      setState(() {
        if (isStart) {
          _startsAt = date;
        } else {
          _expiresAt = date;
        }
      });
    }
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
        borderSide: BorderSide(color: Colors.grey.shade200),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey.shade200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: _indigo, width: 1.5),
      ),
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
        width: 520,
        constraints: const BoxConstraints(maxHeight: 680),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Header ──
            Container(
              padding: const EdgeInsets.fromLTRB(28, 24, 20, 20),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
              ),
              child: Row(children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _indigo.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                      _isEditing ? Icons.edit_outlined : Icons.add_rounded,
                      color: _indigo,
                      size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                            _isEditing
                                ? 'Edit Promo Code'
                                : 'Create Promo Code',
                            style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: _accent)),
                        const SizedBox(height: 2),
                        Text(
                            _isEditing
                                ? 'Update the promo code details'
                                : 'Set up a new discount for your customers',
                            style: TextStyle(
                                fontSize: 12, color: Colors.grey[500])),
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
                      // Section: Basic Info
                      _sectionLabel('Basic Information'),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _codeCtrl,
                        enabled: !_isEditing,
                        textCapitalization: TextCapitalization.characters,
                        decoration: _inputDeco('Promo Code',
                            icon: Icons.code_rounded, hint: 'e.g. SUMMER25'),
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, letterSpacing: 1),
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Code is required' : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _descCtrl,
                        decoration: _inputDeco('Description (optional)',
                            icon: Icons.notes_rounded,
                            hint: 'Summer sale discount'),
                        maxLines: 2,
                        minLines: 1,
                      ),
                      const SizedBox(height: 22),

                      // Section: Discount
                      _sectionLabel('Discount Configuration'),
                      const SizedBox(height: 12),
                      // Type selector as segmented button
                      _buildTypeSelector(),
                      const SizedBox(height: 14),
                      if (_type != 'FREE_SHIPPING') ...[
                        TextFormField(
                          controller: _valueCtrl,
                          keyboardType: TextInputType.number,
                          decoration: _inputDeco(
                            _type == 'PERCENTAGE'
                                ? 'Percentage (%)'
                                : 'Amount (AED)',
                            icon: _type == 'PERCENTAGE'
                                ? Icons.percent_rounded
                                : Icons.attach_money_rounded,
                          ),
                          validator: (v) => v == null || v.isEmpty
                              ? 'Value is required'
                              : null,
                        ),
                        const SizedBox(height: 14),
                      ],
                      Row(children: [
                        Expanded(
                            child: TextFormField(
                          controller: _minOrderCtrl,
                          keyboardType: TextInputType.number,
                          decoration: _inputDeco('Min Order (AED)',
                              icon: Icons.shopping_cart_outlined),
                        )),
                        const SizedBox(width: 12),
                        Expanded(
                            child: TextFormField(
                          controller: _maxDiscountCtrl,
                          keyboardType: TextInputType.number,
                          decoration: _inputDeco('Max Discount (AED)',
                              icon: Icons.shield_outlined),
                        )),
                      ]),
                      const SizedBox(height: 22),

                      // Section: Limits & Schedule
                      _sectionLabel('Limits & Schedule'),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _usageLimitCtrl,
                        keyboardType: TextInputType.number,
                        decoration: _inputDeco('Usage Limit',
                            icon: Icons.group_outlined,
                            hint: 'Leave blank for unlimited'),
                      ),
                      const SizedBox(height: 14),
                      Row(children: [
                        Expanded(
                            child: _datePicker(
                                'Starts At', _startsAt, () => _pickDate(true))),
                        const SizedBox(width: 12),
                        Expanded(
                            child: _datePicker(
                          'Expires At',
                          _expiresAt,
                          () => _pickDate(false),
                          clearable: _expiresAt != null,
                          onClear: () => setState(() => _expiresAt = null),
                        )),
                      ]),
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
                                  Text('Code can be used by customers',
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
                    ],
                  ),
                ),
              ),
            ),

            // ── Footer ──
            Container(
              padding: const EdgeInsets.fromLTRB(28, 16, 28, 20),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: Colors.grey.shade100)),
              ),
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
                    onPressed: _isSaving ? null : _save,
                    style: FilledButton.styleFrom(
                      backgroundColor: _indigo,
                      disabledBackgroundColor: _indigo.withOpacity(0.5),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    child: _isSaving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : Text(_isEditing ? 'Save Changes' : 'Create Code',
                            style:
                                const TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: Colors.grey[500],
          letterSpacing: 0.8,
        ));
  }

  Widget _buildTypeSelector() {
    final types = [
      ('PERCENTAGE', 'Percentage', Icons.percent_rounded),
      ('FIXED_AMOUNT', 'Fixed Amount', Icons.payments_outlined),
      ('FREE_SHIPPING', 'Free Shipping', Icons.local_shipping_outlined),
    ];

    return Row(
      children: types.map((t) {
        final isSelected = _type == t.$1;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: t.$1 != 'FREE_SHIPPING' ? 8 : 0),
            child: InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: () => setState(() => _type = t.$1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected
                      ? _indigo.withOpacity(0.08)
                      : const Color(0xFFF8F9FC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected ? _indigo : Colors.grey.shade200,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(t.$3,
                      size: 20, color: isSelected ? _indigo : Colors.grey[400]),
                  const SizedBox(height: 5),
                  Text(t.$2,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.w500,
                        color: isSelected ? _indigo : Colors.grey[600],
                      )),
                ]),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _datePicker(String label, DateTime? value, VoidCallback onTap,
      {bool clearable = false, VoidCallback? onClear}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: InputDecorator(
        decoration: _inputDeco(label,
            icon: Icons.calendar_today_outlined,
            suffix: clearable
                ? IconButton(
                    icon: Icon(Icons.close_rounded,
                        size: 16, color: Colors.grey[400]),
                    onPressed: onClear,
                  )
                : null),
        child: Text(
          value != null ? DateFormat('MMM d, yyyy').format(value) : 'Not set',
          style: TextStyle(
            fontSize: 13,
            color: value != null ? _accent : Colors.grey[400],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
//  PROMO ORDERS DIALOG — Modern Design
// ═══════════════════════════════════════════════════════════════════
class _PromoOrdersDialog extends StatefulWidget {
  final Map<String, dynamic> promo;
  const _PromoOrdersDialog({required this.promo});

  @override
  State<_PromoOrdersDialog> createState() => _PromoOrdersDialogState();
}

class _PromoOrdersDialogState extends State<_PromoOrdersDialog> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _orders = [];
  Map<String, dynamic>? _promoInfo;

  static const _accent = Color(0xFF1A1A2E);
  static const _indigo = Color(0xFF6366F1);
  static const _success = Color(0xFF10B981);

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    try {
      final response = await ApiService.client.get(
        '/promo-codes/${widget.promo['id']}/orders',
        queryParams: {'limit': 50},
        requiresAuth: true,
      );
      if (response.success) {
        setState(() {
          _promoInfo = response.data['promoCode'];
          _orders =
              List<Map<String, dynamic>>.from(response.data['orders'] ?? []);
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0.0;
    return 0.0;
  }

  @override
  Widget build(BuildContext context) {
    final code = widget.promo['code'] ?? '';

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 0,
      backgroundColor: Colors.white,
      child: SizedBox(
        width: 640,
        height: 520,
        child: Column(children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(24, 20, 16, 16),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
            ),
            child: Row(children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                    color: _indigo.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.receipt_long_outlined,
                    color: _indigo, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Orders using $code',
                          style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: _accent)),
                      if (_promoInfo != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          '${_promoInfo!['usageCount']}${_promoInfo!['usageLimit'] != null ? '/${_promoInfo!['usageLimit']}' : ''} uses · ${_promoInfo!['type']}',
                          style:
                              TextStyle(fontSize: 12, color: Colors.grey[500]),
                        ),
                      ],
                    ]),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(Icons.close_rounded,
                    size: 20, color: Colors.grey[400]),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.grey.shade100,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ]),
          ),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                : _orders.isEmpty
                    ? Center(
                        child:
                            Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.inbox_outlined,
                            size: 36, color: Colors.grey[300]),
                        const SizedBox(height: 10),
                        Text('No orders have used this code yet',
                            style: TextStyle(
                                fontSize: 13, color: Colors.grey[400])),
                      ]))
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _orders.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, i) => _orderCard(_orders[i]),
                      ),
          ),
        ]),
      ),
    );
  }

  Widget _orderCard(Map<String, dynamic> order) {
    final customer = order['customer'] as Map?;
    final customerName =
        '${customer?['firstName'] ?? ''} ${customer?['lastName'] ?? ''}'.trim();
    final total = _toDouble(order['total']);
    final discount = _toDouble(order['discount']);
    final createdAt = order['createdAt'] != null
        ? DateFormat('MMM d, yyyy').format(DateTime.parse(order['createdAt']))
        : '';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
              color: _success.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8)),
          child: const Icon(Icons.shopping_bag_outlined,
              color: _success, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('#${order['orderNumber']}',
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w600, color: _accent)),
            const SizedBox(height: 2),
            Text('$customerName · $createdAt',
                style: TextStyle(fontSize: 11, color: Colors.grey[500])),
          ]),
        ),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('AED ${total.toStringAsFixed(2)}',
              style: const TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w600, color: _accent)),
          const SizedBox(height: 2),
          Text('-AED ${discount.toStringAsFixed(2)}',
              style: TextStyle(
                  fontSize: 11, color: _success, fontWeight: FontWeight.w500)),
        ]),
      ]),
    );
  }
}
