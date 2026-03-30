import 'package:flutter/material.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';

/// ═══════════════════════════════════════════════════════════════════
/// ADMIN STRIPE CONFIG — Modern premium design
/// ═══════════════════════════════════════════════════════════════════
class AdminStripeConfigScreen extends StatefulWidget {
  const AdminStripeConfigScreen({super.key});

  @override
  State<AdminStripeConfigScreen> createState() =>
      _AdminStripeConfigScreenState();
}

class _AdminStripeConfigScreenState extends State<AdminStripeConfigScreen> {
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;

  final _secretKeyController = TextEditingController();
  final _publishableKeyController = TextEditingController();
  final _webhookSecretController = TextEditingController();
  bool _isEnabled = false;
  String _maskedSecretKey = '';

  // Design tokens
  static const _accent = Color(0xFF1A1A2E);
  static const _indigo = Color(0xFF6366F1);
  static const _success = Color(0xFF10B981);
  static const _danger = Color(0xFFEF4444);
  static const _info = Color(0xFF3B82F6);
  static const _surface = Color(0xFFF8F9FC);

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  @override
  void dispose() {
    _secretKeyController.dispose();
    _publishableKeyController.dispose();
    _webhookSecretController.dispose();
    super.dispose();
  }

  Future<void> _loadConfig() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ApiService.client
          .get('/stripe/admin/config', requiresAuth: true);
      if (response.success) {
        final data = response.data;
        setState(() {
          _maskedSecretKey = data['secretKey'] ?? '';
          _publishableKeyController.text = data['publishableKey'] ?? '';
          _webhookSecretController.text = '';
          _isEnabled = data['isEnabled'] ?? false;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = response.errorMessage ?? 'Failed to load config';
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

  Future<void> _saveConfig() async {
    if (_secretKeyController.text.isEmpty &&
        _publishableKeyController.text.isEmpty) {
      _showSnack('Please provide at least the API keys', _danger);
      return;
    }
    setState(() => _isSaving = true);
    try {
      final body = <String, dynamic>{
        'publishableKey': _publishableKeyController.text.trim(),
      };
      if (_secretKeyController.text.isNotEmpty) {
        body['secretKey'] = _secretKeyController.text.trim();
      } else if (_maskedSecretKey.isNotEmpty) {
        body['secretKey'] = _maskedSecretKey;
      }
      if (_webhookSecretController.text.isNotEmpty) {
        body['webhookSecret'] = _webhookSecretController.text.trim();
      }

      final response = await ApiService.client
          .post('/stripe/admin/config', body: body, requiresAuth: true);
      if (response.success) {
        _showSnack('Stripe configuration saved successfully', _success);
        _secretKeyController.clear();
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
        currentRoute: '/admin/stripe',
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
                  Text('Loading Stripe config…',
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

    return ListView(
      padding: EdgeInsets.all(pad),
      children: [
        // ── Header ──
        Row(children: [
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Stripe Configuration',
                  style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: _accent,
                      letterSpacing: -0.5)),
              const SizedBox(height: 4),
              Text('Manage payment gateway integration',
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
                _isEnabled ? 'Active' : 'Not Configured',
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

        // ── API Keys Card ──
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
                    color: _indigo.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.key_rounded, color: _indigo, size: 20),
              ),
              const SizedBox(width: 14),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('API Keys',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: _accent)),
                const SizedBox(height: 2),
                Text('Find your keys at dashboard.stripe.com/apikeys',
                    style: TextStyle(fontSize: 12, color: Colors.grey[500])),
              ]),
            ]),
            const SizedBox(height: 24),

            _sectionLabel('PUBLIC KEY'),
            const SizedBox(height: 10),
            TextFormField(
              controller: _publishableKeyController,
              decoration: _inputDeco(
                'Publishable Key (pk_test_…)',
                icon: Icons.vpn_key_outlined,
                helper: 'This key is visible to your customers',
              ),
            ),
            const SizedBox(height: 20),

            _sectionLabel('SECRET KEY'),
            const SizedBox(height: 10),
            TextFormField(
              controller: _secretKeyController,
              obscureText: true,
              decoration: _inputDeco(
                'Secret Key (sk_test_…)',
                icon: Icons.lock_outline,
                helper: _maskedSecretKey.isNotEmpty
                    ? 'Current: $_maskedSecretKey (leave blank to keep)'
                    : 'Never shared publicly',
              ),
            ),
            const SizedBox(height: 20),

            _sectionLabel('WEBHOOK (OPTIONAL)'),
            const SizedBox(height: 10),
            TextFormField(
              controller: _webhookSecretController,
              obscureText: true,
              decoration: _inputDeco(
                'Webhook Secret (whsec_…)',
                icon: Icons.webhook_outlined,
                helper: 'Required only for webhook event verification',
              ),
            ),
            const SizedBox(height: 28),

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
                    Text('Test Mode',
                        style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: _info)),
                    const SizedBox(height: 4),
                    Text(
                      'Use test keys (pk_test_ / sk_test_) for development. Switch to live keys (pk_live_ / sk_live_) for production.',
                      style: TextStyle(
                          fontSize: 12, color: Colors.grey[600], height: 1.4),
                    ),
                  ]),
            ),
          ]),
        ),
        const SizedBox(height: 40),
      ],
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
