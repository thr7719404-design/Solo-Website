import 'package:flutter/material.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../models/dto/content_dto.dart';
import '../../core/events/app_event_bus.dart';
import 'dart:async';

/// Admin Banners CRUD Screen with full date window support
class AdminBannersScreen extends StatefulWidget {
  const AdminBannersScreen({super.key});

  @override
  State<AdminBannersScreen> createState() => _AdminBannersScreenState();
}

class _AdminBannersScreenState extends State<AdminBannersScreen> {
  bool _isLoading = true;
  List<BannerDto> _banners = [];
  String? _error;
  String? _filterPlacement;
  StreamSubscription<AppEventData>? _eventSubscription;

  final List<String> _placements = [
    'All Placements',
    BannerPlacement.homeHero,
    BannerPlacement.homeMid,
    BannerPlacement.homeSecondary,
    BannerPlacement.categoryTop,
    BannerPlacement.categoryMid,
    BannerPlacement.category,
    BannerPlacement.productSidebar,
    BannerPlacement.checkoutTop,
    BannerPlacement.promotion,
  ];

  @override
  void initState() {
    super.initState();
    _loadBanners();
    _subscribeToEvents();
  }

  @override
  void dispose() {
    _eventSubscription?.cancel();
    super.dispose();
  }

  void _subscribeToEvents() {
    _eventSubscription = AppEventBus().on(AppEvent.bannersChanged, (_) {
      _loadBanners();
    });
  }

  Future<void> _loadBanners() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final banners = await ApiService.content.getAllBanners();
      setState(() {
        _banners = banners;
        _isLoading = false;
      });
    } catch (e) {
      // Fallback to public endpoint if admin endpoint not available
      try {
        final banners = await ApiService.content.getBanners();
        setState(() {
          _banners = banners;
          _isLoading = false;
        });
      } catch (e2) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  List<BannerDto> get _filteredBanners {
    if (_filterPlacement == null || _filterPlacement == 'All Placements') {
      return _banners;
    }
    return _banners.where((b) => b.placement == _filterPlacement).toList();
  }

  Future<void> _createBanner() async {
    final result = await _showBannerDialog();
    if (result == null) return;

    try {
      await ApiService.content.createBanner(result);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Banner created successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _editBanner(BannerDto banner) async {
    final result = await _showBannerDialog(banner: banner);
    if (result == null) return;

    try {
      await ApiService.content.updateBanner(banner.id, result);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Banner updated successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _deleteBanner(BannerDto banner) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Banner'),
        content: Text('Are you sure you want to delete "${banner.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ApiService.content.deleteBanner(banner.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Banner deleted successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _toggleActive(BannerDto banner) async {
    try {
      await ApiService.content.toggleBannerActive(banner.id, !banner.isActive);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            banner.isActive ? 'Banner deactivated' : 'Banner activated',
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<Map<String, dynamic>?> _showBannerDialog({BannerDto? banner}) {
    final titleController = TextEditingController(text: banner?.title ?? '');
    final subtitleController = TextEditingController(
      text: banner?.subtitle ?? '',
    );
    final ctaTextController =
        TextEditingController(text: banner?.ctaText ?? '');
    final ctaUrlController = TextEditingController(text: banner?.ctaUrl ?? '');
    final imageDesktopController = TextEditingController(
      text: banner?.imageDesktopUrl ?? '',
    );
    final imageMobileController = TextEditingController(
      text: banner?.imageMobileUrl ?? '',
    );
    final displayOrderController = TextEditingController(
      text: banner?.displayOrder.toString() ?? '0',
    );

    String placement = banner?.placement ?? BannerPlacement.homeHero;
    bool isActive = banner?.isActive ?? true;
    DateTime? startAt = banner?.startAt;
    DateTime? endAt = banner?.endAt;
    bool showSchedule = startAt != null || endAt != null;

    final formKey = GlobalKey<FormState>();

    return showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 8,
          child: Container(
            width: 720,
            constraints: const BoxConstraints(maxHeight: 720),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: Colors.grey.shade200),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        banner == null ? Icons.add_photo_alternate : Icons.edit,
                        color: Colors.blue.shade700,
                        size: 28,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              banner == null
                                  ? 'Create New Banner'
                                  : 'Edit Banner',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Configure banner content and display settings',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Active Switch in Header
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isActive
                              ? Colors.green.shade50
                              : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isActive
                                ? Colors.green.shade200
                                : Colors.grey.shade300,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Active',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: isActive
                                    ? Colors.green.shade800
                                    : Colors.grey.shade700,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Transform.scale(
                              scale: 0.85,
                              child: Switch(
                                value: isActive,
                                onChanged: (v) =>
                                    setDialogState(() => isActive = v),
                                activeThumbColor: Colors.green.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Content
                Flexible(
                  child: Form(
                    key: formKey,
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Section: Basic Content
                          _buildSectionLabel('Basic Content'),
                          const SizedBox(height: 12),

                          // Title (Full Width)
                          TextFormField(
                            controller: titleController,
                            decoration: InputDecoration(
                              labelText: 'Banner Title',
                              hintText: 'Enter a compelling title',
                              helperText:
                                  'Main heading displayed on the banner',
                              prefixIcon: const Icon(Icons.title),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                            validator: (v) => v == null || v.isEmpty
                                ? 'Title is required'
                                : null,
                          ),
                          const SizedBox(height: 16),

                          // Subtitle (Full Width)
                          TextFormField(
                            controller: subtitleController,
                            decoration: InputDecoration(
                              labelText: 'Subtitle (Optional)',
                              hintText: 'Add supporting text',
                              helperText: 'Secondary text below the title',
                              prefixIcon: const Icon(Icons.subtitles),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                            maxLines: 2,
                          ),

                          const SizedBox(height: 24),

                          // Section: Settings
                          _buildSectionLabel('Display Settings'),
                          const SizedBox(height: 12),

                          // 2-Column Row: Placement + Display Order
                          Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: DropdownButtonFormField<String>(
                                  initialValue: placement,
                                  decoration: InputDecoration(
                                    labelText: 'Placement',
                                    helperText: 'Where to show this banner',
                                    prefixIcon: const Icon(Icons.location_on),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    filled: true,
                                    fillColor: Colors.grey.shade50,
                                  ),
                                  items: _placements
                                      .where((p) => p != 'All Placements')
                                      .map((p) => DropdownMenuItem(
                                            value: p,
                                            child: Text(p),
                                          ))
                                      .toList(),
                                  onChanged: (v) {
                                    if (v != null) {
                                      setDialogState(() => placement = v);
                                    }
                                  },
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: TextFormField(
                                  controller: displayOrderController,
                                  decoration: InputDecoration(
                                    labelText: 'Order',
                                    helperText: 'Sort priority',
                                    prefixIcon: const Icon(Icons.sort),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    filled: true,
                                    fillColor: Colors.grey.shade50,
                                  ),
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 24),

                          // Section: Call to Action
                          _buildSectionLabel('Call to Action'),
                          const SizedBox(height: 12),

                          // 2-Column Row: CTA Text + CTA URL
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: ctaTextController,
                                  decoration: InputDecoration(
                                    labelText: 'Button Text (Optional)',
                                    hintText: 'Shop Now',
                                    helperText: 'Text on the button',
                                    prefixIcon: const Icon(Icons.touch_app),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    filled: true,
                                    fillColor: Colors.grey.shade50,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: TextFormField(
                                  controller: ctaUrlController,
                                  decoration: InputDecoration(
                                    labelText: 'Button URL (Optional)',
                                    hintText: '/products',
                                    helperText: 'Link destination',
                                    prefixIcon: const Icon(Icons.link),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    filled: true,
                                    fillColor: Colors.grey.shade50,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 24),

                          // Section: Images
                          _buildSectionLabel('Images'),
                          const SizedBox(height: 12),

                          // Desktop Image URL
                          TextFormField(
                            controller: imageDesktopController,
                            decoration: InputDecoration(
                              labelText: 'Desktop Image URL',
                              hintText:
                                  'https://example.com/banner-desktop.jpg',
                              helperText:
                                  'Image for desktop/tablet screens (required)',
                              prefixIcon: const Icon(Icons.desktop_windows),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                            validator: (v) => v == null || v.isEmpty
                                ? 'Desktop image URL is required'
                                : null,
                          ),
                          const SizedBox(height: 16),

                          // Mobile Image URL
                          TextFormField(
                            controller: imageMobileController,
                            decoration: InputDecoration(
                              labelText: 'Mobile Image URL (Optional)',
                              hintText: 'https://example.com/banner-mobile.jpg',
                              helperText: 'Optimized image for mobile screens',
                              prefixIcon: const Icon(Icons.phone_android),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Section: Schedule (Collapsible)
                          InkWell(
                            onTap: () => setDialogState(
                                () => showSchedule = !showSchedule),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.blue.shade200),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.schedule,
                                      color: Colors.blue.shade700),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Schedule (Optional)',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.blue.shade900,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          showSchedule
                                              ? 'Set start and end dates for this banner'
                                              : 'Click to configure display dates',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.blue.shade700,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Icon(
                                    showSchedule
                                        ? Icons.expand_less
                                        : Icons.expand_more,
                                    color: Colors.blue.shade700,
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // Schedule Content
                          if (showSchedule) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildDateField(
                                          context,
                                          label: 'Start Date',
                                          date: startAt,
                                          onSelect: (date) => setDialogState(
                                              () => startAt = date),
                                          onClear: () => setDialogState(
                                              () => startAt = null),
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: _buildDateField(
                                          context,
                                          label: 'End Date',
                                          date: endAt,
                                          onSelect: (date) => setDialogState(
                                              () => endAt = date),
                                          onClear: () => setDialogState(
                                              () => endAt = null),
                                        ),
                                      ),
                                    ],
                                  ),

                                  // Validation warning
                                  if (startAt != null &&
                                      endAt != null &&
                                      startAt!.isAfter(endAt!))
                                    Padding(
                                      padding: const EdgeInsets.only(top: 12),
                                      child: Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: Colors.red.shade50,
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          border: Border.all(
                                              color: Colors.red.shade200),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(Icons.warning,
                                                color: Colors.red.shade700,
                                                size: 20),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                'Start date must be before end date',
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  color: Colors.red.shade900,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),

                // Footer Actions
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    border: Border(
                      top: BorderSide(color: Colors.grey.shade200),
                    ),
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Cancel'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: () {
                          if (!formKey.currentState!.validate()) return;

                          if (startAt != null &&
                              endAt != null &&
                              startAt!.isAfter(endAt!)) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content:
                                    Text('Start date must be before end date'),
                                backgroundColor: Colors.red,
                              ),
                            );
                            return;
                          }

                          Navigator.pop(context, {
                            'title': titleController.text,
                            'placement': placement,
                            'imageDesktopUrl': imageDesktopController.text,
                            if (subtitleController.text.isNotEmpty)
                              'subtitle': subtitleController.text,
                            if (ctaTextController.text.isNotEmpty)
                              'ctaText': ctaTextController.text,
                            if (ctaUrlController.text.isNotEmpty)
                              'ctaUrl': ctaUrlController.text,
                            if (imageMobileController.text.isNotEmpty)
                              'imageMobileUrl': imageMobileController.text,
                            if (startAt != null)
                              'startAt': startAt!.toIso8601String(),
                            if (endAt != null)
                              'endAt': endAt!.toIso8601String(),
                            'displayOrder':
                                int.tryParse(displayOrderController.text) ?? 0,
                            'isActive': isActive,
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue.shade700,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 32, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 2,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.check, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              banner == null ? 'Create Banner' : 'Save Changes',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
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
      ),
    );
  }

  Widget _buildSectionLabel(String label) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: Colors.grey.shade700,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildDateField(
    BuildContext context, {
    required String label,
    required DateTime? date,
    required Function(DateTime) onSelect,
    required VoidCallback onClear,
  }) {
    return InkWell(
      onTap: () async {
        final selected = await showDatePicker(
          context: context,
          initialDate: date ?? DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime(2030),
        );
        if (selected != null) onSelect(selected);
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(
          children: [
            Icon(Icons.calendar_today, size: 18, color: Colors.grey.shade600),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    date != null
                        ? '${date.day}/${date.month}/${date.year}'
                        : 'Not set',
                    style: TextStyle(
                      fontSize: 14,
                      color:
                          date != null ? Colors.black87 : Colors.grey.shade500,
                      fontWeight:
                          date != null ? FontWeight.w500 : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
            if (date != null)
              IconButton(
                icon: Icon(Icons.clear, size: 18, color: Colors.grey.shade600),
                onPressed: onClear,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/banners',
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
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Banners',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '${_filteredBanners.length} of ${_banners.length} banners',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: _createBanner,
                icon: const Icon(Icons.add),
                label: const Text('New Banner'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 250,
                child: DropdownButtonFormField<String>(
                  initialValue: _filterPlacement ?? 'All Placements',
                  decoration: const InputDecoration(
                    labelText: 'Filter by Placement',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                  ),
                  items: _placements
                      .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                      .toList(),
                  onChanged: (v) {
                    setState(() {
                      _filterPlacement = v == 'All Placements' ? null : v;
                    });
                  },
                ),
              ),
            ],
          ),
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
              onPressed: _loadBanners,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_filteredBanners.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.image_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('No banners found'),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _createBanner,
              icon: const Icon(Icons.add),
              label: const Text('Create First Banner'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadBanners,
      child: GridView.builder(
        padding: const EdgeInsets.all(24),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 500,
          childAspectRatio: 1.2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        itemCount: _filteredBanners.length,
        itemBuilder: (context, index) =>
            _buildBannerCard(_filteredBanners[index]),
      ),
    );
  }

  Widget _buildBannerCard(BannerDto banner) {
    final isScheduled = banner.startAt != null || banner.endAt != null;
    final isWithinWindow = banner.isWithinDateWindow;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 3,
                child: Image.network(
                  banner.imageDesktopUrl,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: Colors.grey[200],
                    child: const Center(
                      child: Icon(Icons.broken_image, size: 48),
                    ),
                  ),
                ),
              ),
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              banner.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      if (banner.subtitle != null)
                        Text(
                          banner.subtitle!,
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      const Spacer(),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              banner.placement,
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.blue.shade700,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (!banner.isActive)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.grey[300],
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'Inactive',
                                style: TextStyle(fontSize: 10),
                              ),
                            ),
                          if (isScheduled && !isWithinWindow)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.orange.shade50,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Scheduled',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.orange.shade700,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            top: 8,
            right: 8,
            child: PopupMenuButton<String>(
              icon: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(4),
                ),
                child:
                    const Icon(Icons.more_vert, color: Colors.white, size: 20),
              ),
              onSelected: (value) {
                if (value == 'edit') {
                  _editBanner(banner);
                } else if (value == 'toggle') {
                  _toggleActive(banner);
                } else if (value == 'delete') {
                  _deleteBanner(banner);
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit, size: 20),
                      SizedBox(width: 12),
                      Text('Edit'),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'toggle',
                  child: Row(
                    children: [
                      Icon(
                        banner.isActive
                            ? Icons.visibility_off
                            : Icons.visibility,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Text(banner.isActive ? 'Deactivate' : 'Activate'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, size: 20, color: Colors.red),
                      SizedBox(width: 12),
                      Text('Delete', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
