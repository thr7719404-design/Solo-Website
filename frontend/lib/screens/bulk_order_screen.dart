import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../widgets/modern_drawer.dart';
import '../providers/catalog_provider.dart';
import '../services/api_service.dart';
import '../models/dto/content_dto.dart';

class BulkOrderScreen extends StatefulWidget {
  const BulkOrderScreen({super.key});

  @override
  State<BulkOrderScreen> createState() => _BulkOrderScreenState();
}

class _BulkOrderScreenState extends State<BulkOrderScreen> {
  final _formKey = GlobalKey<FormState>();
  final _companyNameController = TextEditingController();
  final _contactNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _messageController = TextEditingController();

  String _selectedBusinessType = 'Hotel';
  final List<OrderItem> _orderItems = [OrderItem()];

  // CMS content
  LandingPageDto? _cmsPage;
  bool _isLoadingCms = true;

  @override
  void initState() {
    super.initState();
    _loadCmsContent();
  }

  Future<void> _loadCmsContent() async {
    try {
      final page = await ApiService.content.getLandingPage('bulk-orders');
      if (mounted) {
        setState(() {
          _cmsPage = page;
          _isLoadingCms = false;
        });
      }
    } catch (e) {
      // CMS page not found - use defaults
      if (mounted) {
        setState(() {
          _cmsPage = null;
          _isLoadingCms = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _companyNameController.dispose();
    _contactNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  void _addOrderItem() {
    setState(() {
      _orderItems.add(OrderItem());
    });
  }

  void _removeOrderItem(int index) {
    if (_orderItems.length > 1) {
      setState(() {
        _orderItems.removeAt(index);
      });
    }
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      // TODO: Implement form submission
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Quote Request Submitted'),
          content: const Text(
            'Thank you for your inquiry! Our team will review your request and get back to you within 24 hours.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      drawer: const ModernDrawer(),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'BULK ORDERS',
          style: TextStyle(
            fontFamily: 'WorkSans',
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black,
            letterSpacing: 2,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Hero Section
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 80),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFFB8860B).withOpacity(0.1),
                    Colors.white,
                  ],
                ),
              ),
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFFB8860B).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.business_center,
                      size: 40,
                      color: Color(0xFFB8860B),
                    ),
                  ),
                  const SizedBox(height: 30),
                  const Text(
                    'Bulk Orders & Wholesale',
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 42,
                      fontWeight: FontWeight.w300,
                      color: Colors.black,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    constraints: const BoxConstraints(maxWidth: 800),
                    child: Text(
                      'CFC is delighted to support hotels, restaurants, corporate offices, and property management companies with their kitchenware needs. We understand the importance of quality equipment in professional settings, and we\'re here to serve you.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 18,
                        fontWeight: FontWeight.w300,
                        color: Colors.black.withOpacity(0.8),
                        height: 1.7,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Benefits Section
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 60),
              color: Colors.grey[50],
              child: Column(
                children: [
                  const Text(
                    'Why Choose CFC for Bulk Orders?',
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 28,
                      fontWeight: FontWeight.w400,
                      color: Colors.black,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 40),
                  Wrap(
                    spacing: 30,
                    runSpacing: 30,
                    alignment: WrapAlignment.center,
                    children: [
                      _buildBenefitCard(
                        'Competitive Pricing',
                        'Volume discounts for bulk purchases',
                        Icons.price_check,
                      ),
                      _buildBenefitCard(
                        'Quality Assurance',
                        'Handpicked products that meet professional standards',
                        Icons.verified_outlined,
                      ),
                      _buildBenefitCard(
                        'Dedicated Support',
                        'Personal account manager for your business',
                        Icons.support_agent,
                      ),
                      _buildBenefitCard(
                        'Fast Delivery',
                        'Priority shipping for bulk orders',
                        Icons.local_shipping_outlined,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Quote Request Form
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 80),
              color: Colors.white,
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 900),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Request a Quote',
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 32,
                            fontWeight: FontWeight.w400,
                            color: Colors.black,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Fill out the form below and our team will get back to you within 24 hours',
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 14,
                            fontWeight: FontWeight.w300,
                            color: Colors.black.withOpacity(0.6),
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 40),

                        // Business Information
                        _buildSectionTitle('Business Information'),
                        const SizedBox(height: 20),

                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                'Company Name *',
                                _companyNameController,
                                'Please enter your company name',
                              ),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: _buildDropdown(),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                'Contact Name *',
                                _contactNameController,
                                'Please enter contact name',
                              ),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: _buildTextField(
                                'Email Address *',
                                _emailController,
                                'Please enter a valid email',
                                isEmail: true,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        _buildTextField(
                          'Phone Number *',
                          _phoneController,
                          'Please enter phone number',
                        ),

                        const SizedBox(height: 40),

                        // Order Items
                        _buildSectionTitle('Products & Quantities'),
                        const SizedBox(height: 20),

                        ...List.generate(_orderItems.length, (index) {
                          return _buildOrderItemRow(index);
                        }),

                        const SizedBox(height: 20),
                        OutlinedButton.icon(
                          onPressed: _addOrderItem,
                          icon: const Icon(Icons.add),
                          label: const Text('ADD ANOTHER ITEM'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFB8860B),
                            side: const BorderSide(color: Color(0xFFB8860B)),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 16,
                            ),
                            shape: const RoundedRectangleBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                          ),
                        ),

                        const SizedBox(height: 40),

                        // Additional Information
                        _buildSectionTitle('Additional Information'),
                        const SizedBox(height: 20),

                        TextFormField(
                          controller: _messageController,
                          maxLines: 5,
                          decoration: InputDecoration(
                            hintText:
                                'Tell us more about your needs, timeline, delivery address, or any specific requirements...',
                            hintStyle: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 14,
                              color: Colors.grey[400],
                            ),
                            border: const OutlineInputBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.zero,
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            focusedBorder: const OutlineInputBorder(
                              borderRadius: BorderRadius.zero,
                              borderSide: BorderSide(
                                  color: Color(0xFFB8860B), width: 2),
                            ),
                          ),
                        ),

                        const SizedBox(height: 40),

                        // Submit Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _submitForm,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFB8860B),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.zero,
                              ),
                              elevation: 0,
                            ),
                            child: const Text(
                              'SUBMIT QUOTE REQUEST',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 2,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBenefitCard(String title, String description, IconData icon) {
    return Container(
      width: 200,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, size: 40, color: const Color(0xFFB8860B)),
          const SizedBox(height: 15),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Colors.black,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 12,
              fontWeight: FontWeight.w300,
              color: Colors.black.withOpacity(0.7),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontFamily: 'WorkSans',
        fontSize: 18,
        fontWeight: FontWeight.w500,
        color: Colors.black,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller,
    String validationMessage, {
    bool isEmail = false,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(
          fontFamily: 'WorkSans',
          fontSize: 14,
        ),
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.zero,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: Color(0xFFB8860B), width: 2),
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return validationMessage;
        }
        if (isEmail && !value.contains('@')) {
          return 'Please enter a valid email';
        }
        return null;
      },
    );
  }

  Widget _buildDropdown() {
    return DropdownButtonFormField<String>(
      initialValue: _selectedBusinessType,
      decoration: InputDecoration(
        labelText: 'Business Type *',
        labelStyle: const TextStyle(
          fontFamily: 'WorkSans',
          fontSize: 14,
        ),
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.zero,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: Color(0xFFB8860B), width: 2),
        ),
      ),
      items: const [
        DropdownMenuItem(value: 'Hotel', child: Text('Hotel')),
        DropdownMenuItem(value: 'Restaurant', child: Text('Restaurant')),
        DropdownMenuItem(
            value: 'Corporate Office', child: Text('Corporate Office')),
        DropdownMenuItem(
            value: 'Property Management', child: Text('Property Management')),
        DropdownMenuItem(
            value: 'Catering Company', child: Text('Catering Company')),
        DropdownMenuItem(value: 'Other', child: Text('Other')),
      ],
      onChanged: (value) {
        setState(() {
          _selectedBusinessType = value!;
        });
      },
    );
  }

  Widget _buildOrderItemRow(int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        color: Colors.grey[50],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 3,
                child: DropdownButtonFormField<String>(
                  initialValue: _orderItems[index].category,
                  decoration: InputDecoration(
                    labelText: 'Category',
                    filled: true,
                    fillColor: Colors.white,
                    border: const OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                  ),
                  items: context.watch<CatalogProvider>().categories.map((cat) {
                    return DropdownMenuItem(
                      value: cat.name,
                      child: Text(cat.name),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _orderItems[index].category = value;
                      _orderItems[index].product = null;
                    });
                  },
                  validator: (value) => value == null ? 'Required' : null,
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                flex: 3,
                child: DropdownButtonFormField<String>(
                  initialValue: _orderItems[index].product,
                  decoration: InputDecoration(
                    labelText: 'Product',
                    filled: true,
                    fillColor: Colors.white,
                    border: const OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                  ),
                  // TODO: Fetch products from API based on selected category
                  items: <DropdownMenuItem<String>>[
                    const DropdownMenuItem(
                      value: 'product_placeholder',
                      child: Text('Select a category first'),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _orderItems[index].product = value;
                    });
                  },
                  validator: (value) => value == null ? 'Required' : null,
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                flex: 2,
                child: TextFormField(
                  initialValue: _orderItems[index].quantity.toString(),
                  decoration: InputDecoration(
                    labelText: 'Quantity',
                    filled: true,
                    fillColor: Colors.white,
                    border: const OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (value) {
                    _orderItems[index].quantity = int.tryParse(value) ?? 1;
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Required';
                    if (int.tryParse(value) == null) return 'Number only';
                    return null;
                  },
                ),
              ),
              if (_orderItems.length > 1) ...[
                const SizedBox(width: 10),
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline,
                      color: Colors.red),
                  onPressed: () => _removeOrderItem(index),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class OrderItem {
  String? category;
  String? product;
  int quantity;

  OrderItem({this.category, this.product, this.quantity = 1});
}
