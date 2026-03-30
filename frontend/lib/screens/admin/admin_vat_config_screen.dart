import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';

/// ═══════════════════════════════════════════════════════════════════
/// ADMIN VAT CONFIG — Modern premium design
/// ═══════════════════════════════════════════════════════════════════
class AdminVatConfigScreen extends StatefulWidget {
  const AdminVatConfigScreen({super.key});

  @override
  State<AdminVatConfigScreen> createState() => _AdminVatConfigScreenState();
}

class _AdminVatConfigScreenState extends State<AdminVatConfigScreen> {
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;

  final _vatPercentController = TextEditingController();
  final _vatLabelController = TextEditingController();
  bool _isEnabled = true;

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
    _loadConfig();
  }

  @override
  void dispose() {
    _vatPercentController.dispose();
    _vatLabelController.dispose();
    super.dispose();
  }

  Future<void> _loadConfig() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ApiService.client
          .get('/settings/admin/vat', requiresAuth: true);
      if (response.success) {
        final data = response.data;
        setState(() {
          _vatPercentController.text = (data['vatPercent'] ?? 5).toString();
          _vatLabelController.text = data['label'] ?? 'VAT';
          _isEnabled = data['isEnabled'] ?? true;
          _isLoading = false;
        });
      } else {
        // First time — set defaults
        setState(() {
          _vatPercentController.text = '5';
          _vatLabelController.text = 'VAT';
          _isEnabled = true;
          _isLoading = false;
        });
      }
    } catch (e) {
      // Possibly first-time — set defaults
      setState(() {
        _vatPercentController.text = '5';
        _vatLabelController.text = 'VAT';
        _isEnabled = true;
        _isLoading = false;
      });
    }
  }

  Future<void> _saveConfig() async {
    final percent = double.tryParse(_vatPercentController.text.trim());
    if (percent == null || percent < 0 || percent > 100) {
      _showSnack('VAT percentage must be between 0 and 100', _danger);
      return;
    }
    final label = _vatLabelController.text.trim();
    if (label.isEmpty) {
      _showSnack('Label is required', _danger);
      return;
    }

    setState(() => _isSaving = true);
    try {
      final response = await ApiService.client.post(
        '/settings/admin/vat',
        body: {
          'vatPercent': percent,
          'isEnabled': _isEnabled,
          'label': label,
        },
        requiresAuth: true,
      );
      if (response.success) {
        _showSnack('VAT configuration saved successfully', _success);
        _loadConfig();
      } else {
        throw Exception(response.errorMessage ?? 'Failed to save');
      }
    } catch (e) {
      _showSnack(
          'Error: ${e.toString().replaceAll('Exception: ', '')}', _danger);
    } finally {
      setState(() => _isSaving = false);
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

  InputDecoration _inputDeco(String label,
      {IconData? icon, String? hint, String? helper, Widget? suffix}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      helperText: helper,
      prefixIcon:
          icon != null ? Icon(icon, size: 18, color: Colors.grey[400]) : null,
      suffixIcon: suffix,
      filled: true,
      fillColor: _surface,
      labelStyle: TextStyle(fontSize: 13, color: Colors.grey[600]),
      hintStyle: TextStyle(fontSize: 13, color: Colors.grey[400]),
      helperStyle: TextStyle(fontSize: 11, color: Colors.grey[400]),
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
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/vat-config',
        child: Container(
          color: _surface,
          child: _isLoading
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                  SizedBox(
                      width: 40,
                      height: 40,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.5, color: _accent)),
                  const SizedBox(height: 16),
                  Text('Loading VAT config…',
                      style: TextStyle(fontSize: 14, color: Colors.grey[400])),
                ]))
              : _buildContent(),
        ),
      ),
    );
  }

  Widget _buildContent() {
    final isMobile = MediaQuery.of(context).size.width < 900;
    final pad = isMobile ? 16.0 : 28.0;
    final percent = double.tryParse(_vatPercentController.text.trim()) ?? 0;

    return ListView(
      padding: EdgeInsets.all(pad),
      children: [
        // ── Header ──
        Row(children: [
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('VAT Configuration',
                  style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: _accent,
                      letterSpacing: -0.5)),
              const SizedBox(height: 4),
              Text('Configure VAT rate applied to all orders',
                  style: TextStyle(fontSize: 14, color: Colors.grey[500])),
            ]),
          ),
          // Status badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: _isEnabled
                  ? _success.withOpacity(0.08)
                  : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: _isEnabled
                      ? _success.withOpacity(0.3)
                      : Colors.grey.shade300),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(
                _isEnabled ? Icons.check_circle_rounded : Icons.cancel_outlined,
                size: 16,
                color: _isEnabled ? _success : Colors.grey[500],
              ),
              const SizedBox(width: 6),
              Text(
                _isEnabled
                    ? 'Active (${percent.toStringAsFixed(percent == percent.roundToDouble() ? 0 : 1)}%)'
                    : 'Disabled',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: _isEnabled ? _success : Colors.grey[600],
                ),
              ),
            ]),
          ),
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
              TextButton(onPressed: _loadConfig, child: const Text('Retry')),
            ]),
          ),
          const SizedBox(height: 16),
        ],

        // ── Summary Tiles ──
        Row(children: [
          _summaryTile(
              'Current Rate',
              '${percent.toStringAsFixed(percent == percent.roundToDouble() ? 0 : 1)}%',
              Icons.percent_rounded,
              _purple),
          const SizedBox(width: 14),
          _summaryTile('Status', _isEnabled ? 'Enabled' : 'Disabled',
              Icons.toggle_on_outlined, _isEnabled ? _success : Colors.grey),
          const SizedBox(width: 14),
          _summaryTile(
              'Label',
              _vatLabelController.text.isEmpty
                  ? 'VAT'
                  : _vatLabelController.text,
              Icons.label_outline,
              _info),
        ]),
        const SizedBox(height: 24),

        // ── Warning Banner ──
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: _warning.withOpacity(0.06),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _warning.withOpacity(0.2)),
          ),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                  color: _warning.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10)),
              child:
                  Icon(Icons.warning_amber_rounded, color: _warning, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Critical Setting',
                        style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: _warning)),
                    const SizedBox(height: 4),
                    Text(
                      'This VAT rate is applied to all new orders and cart calculations across the entire storefront. '
                      'Changes take effect immediately for new orders. Existing orders are not affected.',
                      style: TextStyle(
                          fontSize: 12, color: Colors.grey[600], height: 1.4),
                    ),
                  ]),
            ),
          ]),
        ),
        const SizedBox(height: 20),

        // ── Config Card ──
        Container(
          padding: const EdgeInsets.all(24),
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
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                    color: _purple.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10)),
                child: Icon(Icons.percent_rounded, color: _purple, size: 20),
              ),
              const SizedBox(width: 14),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('VAT Settings',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: _accent)),
                const SizedBox(height: 2),
                Text('Configure the VAT rate and display label',
                    style: TextStyle(fontSize: 12, color: Colors.grey[500])),
              ]),
            ]),
            const SizedBox(height: 28),

            // VAT Percentage
            _sectionLabel('VAT RATE'),
            const SizedBox(height: 10),
            TextFormField(
              controller: _vatPercentController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
              ],
              onChanged: (_) => setState(() {}),
              decoration: _inputDeco(
                'VAT Percentage',
                icon: Icons.percent_rounded,
                hint: '5',
                helper: 'Enter a value between 0 and 100 (e.g. 5 for 5%)',
              ),
            ),
            const SizedBox(height: 22),

            // VAT Label
            _sectionLabel('DISPLAY LABEL'),
            const SizedBox(height: 10),
            TextFormField(
              controller: _vatLabelController,
              decoration: _inputDeco(
                'VAT Label',
                icon: Icons.label_outline,
                hint: 'VAT',
                helper: 'Displayed on invoices and checkout (e.g. VAT)',
              ),
            ),
            const SizedBox(height: 22),

            // Enabled Toggle
            _sectionLabel('STATUS'),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: _surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: _isEnabled
                        ? _success.withOpacity(0.3)
                        : Colors.grey.shade200),
              ),
              child: Row(children: [
                Icon(
                  _isEnabled
                      ? Icons.check_circle_rounded
                      : Icons.cancel_outlined,
                  size: 20,
                  color: _isEnabled ? _success : Colors.grey[400],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                            _isEnabled
                                ? 'VAT collection is enabled'
                                : 'VAT collection is disabled',
                            style: const TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w600)),
                        Text(
                          _isEnabled
                              ? 'VAT will be calculated and added to all new orders'
                              : 'No VAT will be applied to orders',
                          style:
                              TextStyle(fontSize: 11, color: Colors.grey[400]),
                        ),
                      ]),
                ),
                Switch.adaptive(
                  value: _isEnabled,
                  activeColor: _indigo,
                  onChanged: (v) => setState(() => _isEnabled = v),
                ),
              ]),
            ),
            const SizedBox(height: 28),

            // Preview
            if (_isEnabled) ...[
              _sectionLabel('PREVIEW'),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(children: [
                  _previewLine('Subtotal', 'AED 100.00'),
                  const SizedBox(height: 8),
                  _previewLine(
                    '${_vatLabelController.text.isEmpty ? 'VAT' : _vatLabelController.text} (${percent.toStringAsFixed(percent == percent.roundToDouble() ? 0 : 1)}%)',
                    'AED ${(100 * percent / 100).toStringAsFixed(2)}',
                    color: _indigo,
                  ),
                  const Divider(height: 20),
                  _previewLine('Total',
                      'AED ${(100 + 100 * percent / 100).toStringAsFixed(2)}',
                      isBold: true),
                ]),
              ),
              const SizedBox(height: 28),
            ],

            // Save button
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _isSaving ? null : _saveConfig,
                icon: _isSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.save_rounded, size: 20),
                label: Text(_isSaving ? 'Saving…' : 'Save Configuration',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                style: FilledButton.styleFrom(
                  backgroundColor: _indigo,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ]),
        ),

        const SizedBox(height: 20),

        // ── Info Box ──
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: _info.withOpacity(0.04),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _info.withOpacity(0.15)),
          ),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                  color: _info.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10)),
              child: Icon(Icons.info_outline_rounded, color: _info, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('How it works',
                        style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: _info)),
                    const SizedBox(height: 6),
                    _infoBullet(
                        'VAT is applied as a percentage of the order subtotal'),
                    _infoBullet(
                        'The rate is used in cart summary, checkout, and order creation'),
                    _infoBullet(
                        'Invoices automatically reflect the VAT amount'),
                    _infoBullet(
                        'Changes only affect new orders — existing orders remain unchanged'),
                  ]),
            ),
          ]),
        ),
        const SizedBox(height: 40),
      ],
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
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(value,
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: _accent),
                  overflow: TextOverflow.ellipsis),
              Text(label,
                  style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.w500)),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _previewLine(String label, String value,
      {bool isBold = false, Color? color}) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label,
          style: TextStyle(
            fontSize: 13,
            color: color ?? Colors.grey[600],
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
          )),
      Text(value,
          style: TextStyle(
            fontSize: 13,
            color: color ?? _accent,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
          )),
    ]);
  }

  Widget _infoBullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('•  ', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
        Expanded(
            child: Text(text,
                style: TextStyle(
                    fontSize: 12, color: Colors.grey[600], height: 1.4))),
      ]),
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
