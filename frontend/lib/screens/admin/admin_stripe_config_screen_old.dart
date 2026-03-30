import 'package:flutter/material.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';

/// Admin Stripe Configuration Screen
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
      final response = await ApiService.client.get(
        '/stripe/admin/config',
        requiresAuth: true,
      );

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
          _error = response.errorMessage ?? 'Failed to load Stripe config';
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide at least the keys')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final body = <String, dynamic>{
        'publishableKey': _publishableKeyController.text.trim(),
      };

      // Only send secretKey if user entered a new one
      if (_secretKeyController.text.isNotEmpty) {
        body['secretKey'] = _secretKeyController.text.trim();
      } else if (_maskedSecretKey.isNotEmpty) {
        // Keep existing key - don't send it
        body['secretKey'] = _maskedSecretKey; // Server will handle masked detection
      }

      if (_webhookSecretController.text.isNotEmpty) {
        body['webhookSecret'] = _webhookSecretController.text.trim();
      }

      final response = await ApiService.client.post(
        '/stripe/admin/config',
        body: body,
        requiresAuth: true,
      );

      if (response.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Stripe configuration saved successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
        _secretKeyController.clear();
        _loadConfig();
      } else {
        throw Exception(response.errorMessage ?? 'Failed to save configuration');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/stripe',
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Colors.black))
            : SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.payment, size: 32),
                        const SizedBox(width: 12),
                        const Text(
                          'Stripe Configuration',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color:
                                _isEnabled ? Colors.green[50] : Colors.red[50],
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: _isEnabled
                                  ? Colors.green
                                  : Colors.red.shade300,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _isEnabled
                                    ? Icons.check_circle
                                    : Icons.cancel,
                                size: 16,
                                color:
                                    _isEnabled ? Colors.green : Colors.red,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                _isEnabled ? 'Active' : 'Not Configured',
                                style: TextStyle(
                                  color:
                                      _isEnabled ? Colors.green : Colors.red,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Configure your Stripe API keys to enable credit card payments.',
                      style: TextStyle(
                          fontSize: 14, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 24),

                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(_error!,
                            style: const TextStyle(color: Colors.red)),
                      ),
                      const SizedBox(height: 16),
                    ],

                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'API Keys',
                            style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Find your keys at dashboard.stripe.com/apikeys',
                            style: TextStyle(
                                fontSize: 13, color: Colors.grey[500]),
                          ),
                          const SizedBox(height: 20),

                          // Publishable Key
                          TextFormField(
                            controller: _publishableKeyController,
                            decoration: InputDecoration(
                              labelText: 'Publishable Key (pk_test_...)',
                              border: const OutlineInputBorder(),
                              prefixIcon: const Icon(Icons.vpn_key_outlined),
                              helperText: 'This key is visible to your customers',
                              helperStyle:
                                  TextStyle(color: Colors.grey[500]),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Secret Key
                          TextFormField(
                            controller: _secretKeyController,
                            obscureText: true,
                            decoration: InputDecoration(
                              labelText: 'Secret Key (sk_test_...)',
                              border: const OutlineInputBorder(),
                              prefixIcon: const Icon(Icons.lock_outlined),
                              helperText: _maskedSecretKey.isNotEmpty
                                  ? 'Current: $_maskedSecretKey (leave blank to keep)'
                                  : 'Never shared publicly',
                              helperStyle:
                                  TextStyle(color: Colors.grey[500]),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Webhook Secret
                          TextFormField(
                            controller: _webhookSecretController,
                            obscureText: true,
                            decoration: InputDecoration(
                              labelText:
                                  'Webhook Secret (whsec_...) — Optional',
                              border: const OutlineInputBorder(),
                              prefixIcon:
                                  const Icon(Icons.webhook_outlined),
                              helperText:
                                  'Required only for webhook event verification',
                              helperStyle:
                                  TextStyle(color: Colors.grey[500]),
                            ),
                          ),
                          const SizedBox(height: 24),

                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton.icon(
                              onPressed: _isSaving ? null : _saveConfig,
                              icon: _isSaving
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white),
                                    )
                                  : const Icon(Icons.save),
                              label: Text(
                                  _isSaving ? 'Saving...' : 'Save Configuration'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.black,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Info box
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue[200]!),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline,
                              color: Colors.blue[700], size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Test Mode',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.blue[700],
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Use test keys (pk_test_/sk_test_) for development. '
                                  'Switch to live keys (pk_live_/sk_live_) for production.',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.blue[700],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
