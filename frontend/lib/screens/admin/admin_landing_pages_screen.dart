import 'package:flutter/material.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../models/dto/content_dto.dart';
import '../../core/events/app_event_bus.dart';
import 'dart:async';
import 'dart:convert';

/// Admin Landing Pages CRUD Screen with Section Builder
class AdminLandingPagesScreen extends StatefulWidget {
  const AdminLandingPagesScreen({super.key});

  @override
  State<AdminLandingPagesScreen> createState() =>
      _AdminLandingPagesScreenState();
}

class _AdminLandingPagesScreenState extends State<AdminLandingPagesScreen> {
  bool _isLoading = true;
  List<LandingPageDto> _pages = [];
  List<LandingPageDto> _filteredPages = [];
  String? _error;
  StreamSubscription<AppEventData>? _eventSubscription;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadPages();
    _subscribeToEvents();
    _searchController.addListener(_filterPages);
  }

  @override
  void dispose() {
    _eventSubscription?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _subscribeToEvents() {
    _eventSubscription = AppEventBus().on(AppEvent.landingPagesChanged, (_) {
      _loadPages();
    });
  }

  Future<void> _loadPages() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final pages = await ApiService.content.getLandingPages();
      setState(() {
        _pages = pages;
        _filteredPages = pages;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _filterPages() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredPages = _pages;
      } else {
        _filteredPages = _pages.where((page) {
          return page.title.toLowerCase().contains(query) ||
              page.slug.toLowerCase().contains(query);
        }).toList();
      }
    });
  }

  Future<void> _createPage() async {
    final result = await _showPageDialog();
    if (result == null) return;

    try {
      await ApiService.content.createLandingPage(result);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Landing page created successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _editPage(LandingPageDto page) async {
    final result = await _showPageDialog(page: page);
    if (result == null) return;

    try {
      await ApiService.content.updateLandingPage(page.id, result);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Landing page updated successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _deletePage(LandingPageDto page) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Landing Page'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Are you sure you want to delete "${page.title}"?'),
            if (page.sections.isNotEmpty) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.orange.shade700),
                    const SizedBox(width: 8),
                    Text(
                      '${page.sections.length} sections will also be deleted',
                      style: TextStyle(color: Colors.orange.shade900),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
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
      await ApiService.content.deleteLandingPage(page.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Landing page deleted successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _toggleActive(LandingPageDto page) async {
    try {
      await ApiService.content.toggleLandingPageActive(page.id, !page.isActive);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            page.isActive ? 'Page deactivated' : 'Page activated',
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _openSectionBuilder(LandingPageDto page) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _LandingPageSectionBuilder(page: page),
      ),
    );
    _loadPages();
  }

  /// Create default CATEGORY_TILES section for Home page (one-click helper)
  Future<void> _createDefaultCategoryTilesForHome(LandingPageDto page) async {
    try {
      // 1) Always fetch the real home page WITH sections (do not trust page.sections from list screen)
      final home = await ApiService.content.getHomePage();

      if (home == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not fetch home page'),
            backgroundColor: Color(0xFFD32F2F),
          ),
        );
        return;
      }

      final alreadyExists = home.sections.any(
        (s) => s.type == LandingSectionType.categoryTiles,
      );

      if (alreadyExists) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Category tiles already exist on Home'),
            backgroundColor: Color(0xFFFFA000),
          ),
        );
        // Open the editor so you can modify them
        _openSectionBuilder(home);
        return;
      }

      // 2) Build payload with landingPageId as UUID (NOT slug) and encode data/config as JSON strings
      final payload = {
        "landingPageId": home.id, // MUST be UUID
        "type": "CATEGORY_TILES",
        "title": "Shop by Collection",
        "displayOrder": 1,
        "isActive": true,
        "data": jsonEncode({
          "tiles": [
            {
              "title": "Cookware",
              "imageUrl":
                  "https://images.unsplash.com/photo-1544526226-d3e79f7c4b5c?auto=format&fit=crop&w=1200&q=80",
              "linkUrl": "/category/cookware",
            },
            {
              "title": "Bakeware",
              "imageUrl":
                  "https://images.unsplash.com/photo-1607877742574-7c28a69a7f23?auto=format&fit=crop&w=1200&q=80",
              "linkUrl": "/category/bakeware",
            },
            {
              "title": "Kitchen Tools",
              "imageUrl":
                  "https://images.unsplash.com/photo-1556910633-5099dc3971e8?auto=format&fit=crop&w=1200&q=80",
              "linkUrl": "/category/kitchen-tools",
            },
            {
              "title": "Small Appliances",
              "imageUrl":
                  "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=1200&q=80",
              "linkUrl": "/category/small-appliances",
            },
          ],
        }),
        "config": jsonEncode({
          "columns": 4,
          "columnsMobile": 2,
          "aspectRatio": 1.2,
          "showTitle": true,
          "overlayOpacity": 0.3,
        }),
      };

      await ApiService.content.createSection(home.id, payload);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Default category tiles created'),
          backgroundColor: Color(0xFF2E7D32),
        ),
      );

      // Reload + open section builder to edit immediately
      await _loadPages();
      _openSectionBuilder(home);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error creating tiles: $e'),
          backgroundColor: const Color(0xFFD32F2F),
        ),
      );
    }
  }

  Future<Map<String, dynamic>?> _showPageDialog({LandingPageDto? page}) {
    final titleController = TextEditingController(text: page?.title ?? '');
    final slugController = TextEditingController(text: page?.slug ?? '');
    final descriptionController = TextEditingController(
      text: page?.description ?? '',
    );
    final metaTitleController = TextEditingController(
      text: page?.metaTitle ?? '',
    );
    final metaDescriptionController = TextEditingController(
      text: page?.metaDescription ?? '',
    );
    bool isActive = page?.isActive ?? true;
    bool showSeoSettings = true;
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
            constraints: const BoxConstraints(maxHeight: 680),
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
                        page == null ? Icons.add_box : Icons.edit_document,
                        color: Colors.blue.shade700,
                        size: 28,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              page == null
                                  ? 'New Landing Page'
                                  : 'Edit Landing Page',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Update page info and SEO settings',
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
                          // Section: Page Details
                          Text(
                            'PAGE DETAILS',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade600,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Two-column row: Title + Slug
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: titleController,
                                  decoration: InputDecoration(
                                    labelText: 'Page Title',
                                    hintText: 'Enter page title',
                                    helperText: 'Main heading for the page',
                                    prefixIcon:
                                        const Icon(Icons.title, size: 20),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    filled: true,
                                    fillColor: Colors.grey.shade50,
                                  ),
                                  validator: (v) => v == null || v.isEmpty
                                      ? 'Title is required'
                                      : null,
                                  onChanged: (value) {
                                    if (page == null) {
                                      slugController.text = value
                                          .toLowerCase()
                                          .replaceAll(
                                              RegExp(r'[^a-z0-9]+'), '-')
                                          .replaceAll(RegExp(r'^-|-$'), '');
                                    }
                                  },
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: TextFormField(
                                  controller: slugController,
                                  decoration: InputDecoration(
                                    labelText: 'URL Slug',
                                    hintText: 'page-url',
                                    helperText:
                                        'URL: /pages/${slugController.text.isNotEmpty ? slugController.text : "{slug}"}',
                                    prefixIcon:
                                        const Icon(Icons.link, size: 20),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    filled: true,
                                    fillColor: Colors.grey.shade50,
                                  ),
                                  validator: (v) => v == null || v.isEmpty
                                      ? 'Slug is required'
                                      : null,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Description (full width)
                          TextFormField(
                            controller: descriptionController,
                            decoration: InputDecoration(
                              labelText: 'Description (Optional)',
                              hintText: 'Brief description of the page',
                              helperText: 'Internal description for reference',
                              prefixIcon:
                                  const Icon(Icons.description, size: 20),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                            maxLines: 3,
                          ),

                          const SizedBox(height: 24),

                          // SEO Section (Collapsible)
                          InkWell(
                            onTap: () => setDialogState(
                                () => showSeoSettings = !showSeoSettings),
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
                                  Icon(Icons.search,
                                      color: Colors.blue.shade700, size: 20),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'SEO Settings',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.blue.shade900,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          showSeoSettings
                                              ? 'Configure search engine optimization'
                                              : 'Click to configure meta title and description',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.blue.shade700,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Icon(
                                    showSeoSettings
                                        ? Icons.expand_less
                                        : Icons.expand_more,
                                    color: Colors.blue.shade700,
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // SEO Content
                          if (showSeoSettings) ...[
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
                                  TextFormField(
                                    controller: metaTitleController,
                                    decoration: InputDecoration(
                                      labelText: 'Meta Title (Optional)',
                                      hintText: 'Page title for search engines',
                                      helperText:
                                          'Recommended: 50-60 characters',
                                      prefixIcon:
                                          const Icon(Icons.search, size: 20),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      filled: true,
                                      fillColor: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  TextFormField(
                                    controller: metaDescriptionController,
                                    decoration: InputDecoration(
                                      labelText: 'Meta Description (Optional)',
                                      hintText:
                                          'Page description for search engines',
                                      helperText:
                                          'Recommended: 150-160 characters',
                                      prefixIcon:
                                          const Icon(Icons.notes, size: 20),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      filled: true,
                                      fillColor: Colors.white,
                                    ),
                                    maxLines: 3,
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

                          Navigator.pop(context, {
                            'title': titleController.text,
                            'slug': slugController.text,
                            if (descriptionController.text.isNotEmpty)
                              'description': descriptionController.text,
                            if (metaTitleController.text.isNotEmpty)
                              'metaTitle': metaTitleController.text,
                            if (metaDescriptionController.text.isNotEmpty)
                              'metaDescription': metaDescriptionController.text,
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
                          elevation: 0,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.check, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              page == null ? 'Create Page' : 'Save Changes',
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

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/landing-pages',
        child: Column(
          children: [
            _buildStickyToolbar(),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildStickyToolbar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Title and count
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Landing Pages',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${_filteredPages.length} of ${_pages.length} pages',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(width: 32),
          // Search
          Expanded(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 400),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search pages...',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 20),
                          onPressed: () {
                            _searchController.clear();
                          },
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide:
                        BorderSide(color: Colors.blue.shade400, width: 2),
                  ),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  isDense: true,
                ),
              ),
            ),
          ),
          const Spacer(),
          // New Page button
          ElevatedButton.icon(
            onPressed: _createPage,
            icon: const Icon(Icons.add, size: 20),
            label: const Text('New Page'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Landing Pages',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${_pages.length} pages',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
          ElevatedButton.icon(
            onPressed: _createPage,
            icon: const Icon(Icons.add),
            label: const Text('New Page'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
            ),
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
              onPressed: _loadPages,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_filteredPages.isEmpty && _searchController.text.isNotEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('No pages found',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            Text(
              'Try a different search term',
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }

    if (_pages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.web_outlined, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 24),
            const Text(
              'No landing pages yet',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              'Create custom pages with drag-and-drop sections',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _createPage,
              icon: const Icon(Icons.add),
              label: const Text('Create First Page'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadPages,
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              _buildTableHeader(),
              const SizedBox(height: 8),
              ..._filteredPages.map((page) => _buildTableRow(page)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTableHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
      ),
      child: Row(
        children: [
          // Icon placeholder
          const SizedBox(width: 50),
          const SizedBox(width: 16),
          // Page
          const Expanded(
            flex: 3,
            child: Text(
              'PAGE',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
                letterSpacing: 0.5,
              ),
            ),
          ),
          // Slug
          const Expanded(
            flex: 2,
            child: Text(
              'SLUG',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
                letterSpacing: 0.5,
              ),
            ),
          ),
          // Sections
          Container(
            width: 100,
            alignment: Alignment.center,
            child: const Text(
              'SECTIONS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Status
          Container(
            width: 80,
            alignment: Alignment.center,
            child: const Text(
              'STATUS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Actions
          const SizedBox(
            width: 200,
            child: Text(
              'ACTIONS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTableRow(LandingPageDto page) {
    return InkWell(
      onTap: () => _editPage(page),
      hoverColor: Colors.blue.shade50.withOpacity(0.3),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(
            left: BorderSide(color: Colors.grey.shade200),
            right: BorderSide(color: Colors.grey.shade200),
            bottom: BorderSide(color: Colors.grey.shade200),
          ),
        ),
        child: Row(
          children: [
            // Icon
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.web, color: Colors.blue.shade700, size: 26),
            ),
            const SizedBox(width: 16),
            // Page title
            Expanded(
              flex: 3,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    page.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (page.description?.isNotEmpty ?? false) ...[
                    const SizedBox(height: 2),
                    Text(
                      page.description!,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ],
                ],
              ),
            ),
            // Slug
            Expanded(
              flex: 2,
              child: Text(
                '/pages/${page.slug}',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade700,
                  fontFamily: 'monospace',
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            // Sections count
            Container(
              width: 100,
              alignment: Alignment.center,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: page.sections.isEmpty
                      ? Colors.grey.shade100
                      : Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${page.sections.length}',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: page.sections.isEmpty
                        ? Colors.grey.shade600
                        : Colors.blue.shade700,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Status badge
            Container(
              width: 80,
              alignment: Alignment.center,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: page.isActive
                      ? Colors.green.shade50
                      : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: page.isActive
                        ? Colors.green.shade200
                        : Colors.grey.shade300,
                  ),
                ),
                child: Text(
                  page.isActive ? 'Active' : 'Draft',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: page.isActive
                        ? Colors.green.shade700
                        : Colors.grey.shade700,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Actions - use Flexible with Wrap to prevent overflow
            Flexible(
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.end,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  // Edit Sections button
                  Tooltip(
                    message: 'Edit Sections',
                    child: OutlinedButton.icon(
                      onPressed: () => _openSectionBuilder(page),
                      icon: const Icon(Icons.view_agenda, size: 16),
                      label: const Text('Sections'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.blue.shade700,
                        side: BorderSide(color: Colors.blue.shade200),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ),
                  ),
                  // Add Default Tiles button (only for Home page) - icon only to save space
                  if (page.slug == 'home')
                    Tooltip(
                      message: 'Add default category tiles',
                      child: OutlinedButton(
                        onPressed: () =>
                            _createDefaultCategoryTilesForHome(page),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.green.shade700,
                          side: BorderSide(color: Colors.green.shade200),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 6),
                          minimumSize: const Size(40, 36),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        child: const Icon(Icons.grid_view, size: 18),
                      ),
                    ),
                  // Visibility toggle
                  IconButton(
                    icon: Icon(
                      page.isActive ? Icons.visibility : Icons.visibility_off,
                      color:
                          page.isActive ? Colors.green.shade600 : Colors.grey,
                      size: 20,
                    ),
                    onPressed: () => _toggleActive(page),
                    tooltip: page.isActive ? 'Deactivate' : 'Activate',
                    constraints:
                        const BoxConstraints(minWidth: 36, minHeight: 36),
                    padding: EdgeInsets.zero,
                  ),
                  // More menu
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      if (value == 'edit') {
                        _editPage(page);
                      } else if (value == 'sections') {
                        _openSectionBuilder(page);
                      } else if (value == 'delete') {
                        _deletePage(page);
                      }
                    },
                    icon: const Icon(Icons.more_vert, size: 20),
                    padding: EdgeInsets.zero,
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit, size: 18),
                            SizedBox(width: 12),
                            Text('Edit Page'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'sections',
                        child: Row(
                          children: [
                            Icon(Icons.view_agenda, size: 18),
                            SizedBox(width: 12),
                            Text('Edit Sections'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 18, color: Colors.red),
                            SizedBox(width: 12),
                            Text('Delete', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getSectionColor(String type) {
    switch (type) {
      // Porto section types
      case LandingSectionType.hero:
        return Colors.indigo.shade50;
      case LandingSectionType.categoryTiles:
        return Colors.teal.shade50;
      case LandingSectionType.productCarousel:
        return Colors.cyan.shade50;
      case LandingSectionType.brandStrip:
        return Colors.amber.shade50;
      case LandingSectionType.promoBanner:
        return Colors.red.shade50;
      // Standard section types
      case LandingSectionType.productGrid:
        return Colors.blue.shade50;
      case LandingSectionType.categoryGrid:
        return Colors.green.shade50;
      case LandingSectionType.richText:
        return Colors.purple.shade50;
      case LandingSectionType.image:
        return Colors.orange.shade50;
      case LandingSectionType.bannerCarousel:
        return Colors.pink.shade50;
      default:
        return Colors.grey.shade200;
    }
  }
}

/// Section Builder Screen
class _LandingPageSectionBuilder extends StatefulWidget {
  final LandingPageDto page;

  const _LandingPageSectionBuilder({required this.page});

  @override
  State<_LandingPageSectionBuilder> createState() =>
      _LandingPageSectionBuilderState();
}

class _LandingPageSectionBuilderState
    extends State<_LandingPageSectionBuilder> {
  late List<LandingSectionDto> _sections;
  bool _isLoading = false;

  // UI-only filter state
  final TextEditingController _searchCtrl = TextEditingController();
  String _statusFilter = 'ALL'; // ALL, ACTIVE, DRAFT
  String _typeFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _sections = List.from(widget.page.sections);
    _searchCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  /// Get filtered sections based on search + status + type filters
  List<LandingSectionDto> get _filteredSections {
    return _sections.where((s) {
      // Search filter
      final query = _searchCtrl.text.toLowerCase();
      if (query.isNotEmpty) {
        final matchesTitle = (s.title?.toLowerCase() ?? '').contains(query);
        final matchesType = s.type.toLowerCase().contains(query);
        if (!matchesTitle && !matchesType) return false;
      }
      // Status filter
      if (_statusFilter == 'ACTIVE' && !s.isActive) return false;
      if (_statusFilter == 'DRAFT' && s.isActive) return false;
      // Type filter
      if (_typeFilter != 'ALL' && s.type != _typeFilter) return false;
      return true;
    }).toList();
  }

  /// Get unique section types with counts
  Map<String, int> get _typeCounts {
    final counts = <String, int>{};
    for (final s in _sections) {
      counts[s.type] = (counts[s.type] ?? 0) + 1;
    }
    return counts;
  }

  /// Toggle section active status
  Future<void> _toggleSectionActive(
      LandingSectionDto section, int realIndex) async {
    setState(() => _isLoading = true);
    try {
      final payload = {
        'isActive': !section.isActive,
      };
      final updated =
          await ApiService.content.updateSection(section.id, payload);
      setState(() {
        _sections[realIndex] = updated;
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              updated.isActive ? 'Section activated' : 'Section deactivated'),
          backgroundColor: updated.isActive ? Colors.green : Colors.orange,
        ),
      );
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  /// Copy text to clipboard
  void _copyToClipboard(String text, String label) {
    // Use Clipboard from services
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  /// Prepare section payload for API - encode data/config as JSON strings
  Map<String, dynamic> _preparePayload(Map<String, dynamic> result) {
    final payload = Map<String, dynamic>.from(result);
    // Backend expects data and config as JSON STRINGS
    if (payload['data'] != null && payload['data'] is Map) {
      payload['data'] = jsonEncode(payload['data']);
    }
    if (payload['config'] != null && payload['config'] is Map) {
      payload['config'] = jsonEncode(payload['config']);
    }
    return payload;
  }

  Future<void> _addSection() async {
    final result = await _showSectionDialog();
    if (result == null) return;

    setState(() => _isLoading = true);

    try {
      final payload = _preparePayload(result);
      final section = await ApiService.content.createSection(
        widget.page.id,
        payload,
      );
      setState(() {
        _sections.add(section);
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Section added')),
      );
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _editSection(LandingSectionDto section, int index) async {
    final result = await _showSectionDialog(section: section);
    if (result == null) return;

    setState(() => _isLoading = true);

    try {
      final payload = _preparePayload(result);
      final updated = await ApiService.content.updateSection(
        section.id,
        payload,
      );
      setState(() {
        _sections[index] = updated;
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Section updated')),
      );
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _deleteSection(LandingSectionDto section, int index) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Section'),
        content: Text(
          'Are you sure you want to delete "${(section.title?.isNotEmpty ?? false) ? section.title! : section.type}"?',
        ),
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

    setState(() => _isLoading = true);

    try {
      await ApiService.content.deleteSection(section.id);
      setState(() {
        _sections.removeAt(index);
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Section deleted')),
      );
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _reorderSections(int oldIndex, int newIndex) async {
    if (newIndex > oldIndex) newIndex--;

    setState(() {
      final section = _sections.removeAt(oldIndex);
      _sections.insert(newIndex, section);
    });

    try {
      final orders = _sections
          .asMap()
          .entries
          .map((entry) => {
                'id': entry.value.id,
                'displayOrder': entry.key,
              })
          .toList();

      await ApiService.content.reorderSections(widget.page.id, orders);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error reordering: $e')),
      );
    }
  }

  /// Move section up (decrease displayOrder)
  Future<void> _moveSectionUp(int index) async {
    if (index <= 0) return;
    _reorderSections(index, index - 1);
  }

  /// Move section down (increase displayOrder)
  Future<void> _moveSectionDown(int index) async {
    if (index >= _sections.length - 1) return;
    _reorderSections(
        index, index + 2); // +2 because of how Flutter handles the newIndex
  }

  Future<Map<String, dynamic>?> _showSectionDialog({
    LandingSectionDto? section,
  }) async {
    // Route to type-specific editors for better UX
    if (section != null) {
      switch (section.type) {
        case LandingSectionType.hero:
          return await _showHeroEditorDialog(section);
        case LandingSectionType.categoryTiles:
          return await _showCategoryTilesDialog(section);
        case LandingSectionType.categoryGrid:
          return await _showCategoryGridDialog(section);
        case LandingSectionType.productCarousel:
          return await _showProductCarouselDialog(section);
        case LandingSectionType.promoBanner:
          return await _showPromoBannerDialog(section);
        case LandingSectionType.brandStrip:
          return await _showBrandStripDialog(section);
        default:
          break;
      }
    }

    final titleController = TextEditingController(text: section?.title ?? '');
    String type = section?.type ?? LandingSectionType.richText;
    final configController = TextEditingController(
      text: section?.config != null
          ? section!.config!.entries
              .map((e) => '${e.key}: ${e.value}')
              .join('\n')
          : '',
    );
    bool isActive = section?.isActive ?? true;
    final formKey = GlobalKey<FormState>();

    final types = [
      // Porto section types (for CMS home page)
      LandingSectionType.hero,
      LandingSectionType.categoryTiles,
      LandingSectionType.productCarousel,
      LandingSectionType.brandStrip,
      LandingSectionType.promoBanner,
      // Standard section types
      LandingSectionType.productGrid,
      LandingSectionType.categoryGrid,
      LandingSectionType.richText,
      LandingSectionType.image,
      LandingSectionType.bannerCarousel,
    ];

    return showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          // Check if form is valid for enabling button
          final canSave = type.isNotEmpty;

          return Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 8,
            child: Container(
              width: 720,
              constraints: const BoxConstraints(maxHeight: 700),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 20),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: Colors.grey.shade200),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            section == null ? Icons.add_box : Icons.edit_note,
                            color: Colors.blue.shade700,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                section == null
                                    ? 'Add Section'
                                    : 'Edit Section',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Configure a section for this landing page',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Active toggle pill
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
                                scale: 0.8,
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
                            // Section label
                            Text(
                              'SECTION DETAILS',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey.shade600,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Two-column row: Type + Title
                            LayoutBuilder(
                              builder: (context, constraints) {
                                final isMobile = constraints.maxWidth < 600;
                                if (isMobile) {
                                  // Stack on mobile
                                  return Column(
                                    children: [
                                      _buildTypeDropdown(
                                          types, type, setDialogState),
                                      const SizedBox(height: 16),
                                      _buildTitleField(titleController),
                                    ],
                                  );
                                } else {
                                  // Side by side on desktop
                                  return Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        flex: 3,
                                        child: _buildTypeDropdown(
                                            types, type, setDialogState),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        flex: 2,
                                        child:
                                            _buildTitleField(titleController),
                                      ),
                                    ],
                                  );
                                }
                              },
                            ),

                            const SizedBox(height: 24),

                            // Configuration area
                            Text(
                              'CONFIGURATION',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey.shade600,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: configController,
                              decoration: InputDecoration(
                                labelText: 'Configuration (Optional)',
                                hintText: 'key: value format',
                                helperText:
                                    'Enter configuration as key:value pairs, one per line',
                                helperMaxLines: 2,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                filled: true,
                                fillColor: Colors.grey.shade50,
                              ),
                              maxLines: 8,
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 13,
                              ),
                            ),

                            // Dynamic hint based on type
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: Colors.blue.shade100,
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    Icons.info_outline,
                                    size: 18,
                                    color: Colors.blue.shade700,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Example for ${LandingSectionType.getDisplayName(type)}:',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.blue.shade900,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          _getConfigHint(type),
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: Colors.blue.shade800,
                                            fontFamily: 'monospace',
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

                  // Footer
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
                          onPressed: !canSave
                              ? null
                              : () {
                                  if (!formKey.currentState!.validate()) return;

                                  // Parse config (SAME LOGIC)
                                  final configMap = <String, dynamic>{};
                                  for (final line
                                      in configController.text.split('\n')) {
                                    if (line.contains(':')) {
                                      final parts = line.split(':');
                                      configMap[parts[0].trim()] =
                                          parts.sublist(1).join(':').trim();
                                    }
                                  }

                                  // Return SAME payload structure
                                  Navigator.pop(context, {
                                    'type': type,
                                    if (titleController.text.isNotEmpty)
                                      'title': titleController.text,
                                    'config': configMap,
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
                            elevation: 0,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.check, size: 18),
                              const SizedBox(width: 8),
                              Text(
                                section == null
                                    ? 'Add Section'
                                    : 'Save Changes',
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
          );
        },
      ),
    );
  }

  Widget _buildTypeDropdown(
      List<String> types, String type, StateSetter setDialogState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownButtonFormField<String>(
          initialValue: type,
          decoration: InputDecoration(
            labelText: 'Section Type',
            prefixIcon: Icon(_getSectionIcon(type), size: 20),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            filled: true,
            fillColor: Colors.white,
          ),
          items: types
              .map((t) => DropdownMenuItem(
                    value: t,
                    child: Row(
                      children: [
                        Icon(_getSectionIcon(t), size: 18),
                        const SizedBox(width: 8),
                        Text(LandingSectionType.getDisplayName(t)),
                      ],
                    ),
                  ))
              .toList(),
          onChanged: (v) {
            if (v != null) {
              setDialogState(() => type = v);
            }
          },
        ),
        const SizedBox(height: 4),
        Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Text(
            'Required • Choose the type of content',
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey.shade600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTitleField(TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: controller,
          decoration: InputDecoration(
            labelText: 'Title',
            hintText: 'Optional',
            prefixIcon: const Icon(Icons.title, size: 20),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Text(
            'Optional • Display heading for this section',
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey.shade600,
            ),
          ),
        ),
      ],
    );
  }

  IconData _getSectionIcon(String type) {
    switch (type) {
      // Porto section types
      case LandingSectionType.hero:
        return Icons.panorama_wide_angle;
      case LandingSectionType.categoryTiles:
        return Icons.grid_4x4;
      case LandingSectionType.productCarousel:
        return Icons.view_carousel_outlined;
      case LandingSectionType.brandStrip:
        return Icons.business;
      case LandingSectionType.promoBanner:
        return Icons.campaign;
      // Standard section types
      case LandingSectionType.productGrid:
        return Icons.grid_view;
      case LandingSectionType.categoryGrid:
        return Icons.category;
      case LandingSectionType.richText:
        return Icons.text_fields;
      case LandingSectionType.image:
        return Icons.image;
      case LandingSectionType.bannerCarousel:
        return Icons.view_carousel;
      default:
        return Icons.widgets;
    }
  }

  String _getConfigHint(String type) {
    switch (type) {
      // Porto section types
      case LandingSectionType.hero:
        return 'slides: [{imageUrl: "...", title: "...", subtitle: "...", ctaText: "...", ctaLink: "/..."}]';
      case LandingSectionType.categoryTiles:
        return 'Use the specialized Category Tiles editor (opens automatically)';
      case LandingSectionType.productCarousel:
        return 'source: featured|best_sellers|new_arrivals\nlimit: 12';
      case LandingSectionType.brandStrip:
        return 'brands: [{name: "Nike", logoUrl: "...", link: "/brand/nike"}, ...]';
      case LandingSectionType.promoBanner:
        return 'imageUrl: https://...\ntitle: Sale Up To 50%\nsubtitle: Limited Time\nctaText: Shop Now\nctaLink: /sale';
      // Standard section types
      case LandingSectionType.productGrid:
        return 'limit: 8\ncategoryId: optional\nisFeatured: true';
      case LandingSectionType.categoryGrid:
        return 'limit: 6';
      case LandingSectionType.richText:
        return 'content: Your HTML/markdown content here';
      case LandingSectionType.image:
        return 'imageUrl: https://...\naltText: Description';
      case LandingSectionType.bannerCarousel:
        return 'placement: HOME_HERO\nautoPlay: true';
      default:
        return 'key: value';
    }
  }

  // ==================== TYPE-SPECIFIC SECTION EDITORS ====================

  /// HERO Section Editor
  Future<Map<String, dynamic>?> _showHeroEditorDialog(
      LandingSectionDto? section) async {
    final titleController =
        TextEditingController(text: section?.title ?? 'Elevate Your Kitchen');
    final subtitleController =
        TextEditingController(text: section?.subtitle ?? '');
    bool isActive = section?.isActive ?? true;

    // Parse existing slides from section data
    List<Map<String, String>> slides = [];
    if (section != null && section.data['slides'] != null) {
      final rawSlides = section.data['slides'] as List<dynamic>;
      slides = rawSlides
          .map((s) => Map<String, String>.from({
                'title': s['title']?.toString() ?? '',
                'subtitle': s['subtitle']?.toString() ?? '',
                'imageUrl': s['imageUrl']?.toString() ?? '',
                'ctaText': s['ctaText']?.toString() ?? '',
                'ctaLink': s['ctaLink']?.toString() ?? '',
                'secondaryCtaText': s['secondaryCtaText']?.toString() ?? '',
                'secondaryCtaLink': s['secondaryCtaLink']?.toString() ?? '',
              }))
          .toList();
    } else {
      slides = [
        {
          'title': 'Elevate Your Kitchen',
          'subtitle': 'Premium cookware and home essentials',
          'imageUrl':
              'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600',
          'ctaText': 'Shop Now',
          'ctaLink': '/category/cookware',
          'secondaryCtaText': 'View Collection',
          'secondaryCtaLink': '/collections',
        },
      ];
    }

    // Config values
    double height = (section?.config?['height'] as num?)?.toDouble() ?? 600;
    double mobileHeight =
        (section?.config?['mobileHeight'] as num?)?.toDouble() ?? 400;
    bool autoPlay = section?.data['autoPlay'] as bool? ?? true;
    int interval = (section?.data['interval'] as num?)?.toInt() ?? 5000;
    double overlayOpacity =
        (section?.config?['overlayOpacity'] as num?)?.toDouble() ?? 0.4;
    String alignment = section?.data['alignment'] as String? ?? 'center';

    return await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          child: Container(
            width: 900,
            constraints: const BoxConstraints(maxHeight: 750),
            child: Column(
              children: [
                // Header
                _buildEditorHeader(
                  icon: Icons.panorama_wide_angle,
                  title: section == null
                      ? 'Add Hero Section'
                      : 'Edit Hero Section',
                  subtitle: '${slides.length} slide(s) configured',
                  isActive: isActive,
                  onActiveChanged: (v) => setDialogState(() => isActive = v),
                ),
                // Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Section Title
                        TextFormField(
                          controller: titleController,
                          decoration: const InputDecoration(
                            labelText: 'Section Title (optional)',
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Config Row
                        _buildLabeledSection('HERO SETTINGS'),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 16,
                          runSpacing: 16,
                          children: [
                            SizedBox(
                              width: 150,
                              child: TextFormField(
                                initialValue: height.toString(),
                                decoration: const InputDecoration(
                                  labelText: 'Height (px)',
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    height = double.tryParse(v) ?? 600,
                              ),
                            ),
                            SizedBox(
                              width: 150,
                              child: TextFormField(
                                initialValue: mobileHeight.toString(),
                                decoration: const InputDecoration(
                                  labelText: 'Mobile Height',
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    mobileHeight = double.tryParse(v) ?? 400,
                              ),
                            ),
                            SizedBox(
                              width: 150,
                              child: TextFormField(
                                initialValue: overlayOpacity.toString(),
                                decoration: const InputDecoration(
                                  labelText: 'Overlay Opacity',
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                  hintText: '0.0 - 1.0',
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    overlayOpacity = double.tryParse(v) ?? 0.4,
                              ),
                            ),
                            SizedBox(
                              width: 150,
                              child: DropdownButtonFormField<String>(
                                initialValue: alignment,
                                decoration: const InputDecoration(
                                  labelText: 'Alignment',
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                ),
                                items: ['left', 'center', 'right']
                                    .map((a) => DropdownMenuItem(
                                        value: a, child: Text(a.toUpperCase())))
                                    .toList(),
                                onChanged: (v) => setDialogState(
                                    () => alignment = v ?? 'center'),
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Checkbox(
                                  value: autoPlay,
                                  onChanged: (v) => setDialogState(
                                      () => autoPlay = v ?? true),
                                ),
                                const Text('Auto Play'),
                              ],
                            ),
                            if (autoPlay)
                              SizedBox(
                                width: 150,
                                child: TextFormField(
                                  initialValue: (interval ~/ 1000).toString(),
                                  decoration: const InputDecoration(
                                    labelText: 'Interval (sec)',
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                  ),
                                  keyboardType: TextInputType.number,
                                  onChanged: (v) =>
                                      interval = (int.tryParse(v) ?? 5) * 1000,
                                ),
                              ),
                          ],
                        ),

                        const SizedBox(height: 24),
                        _buildLabeledSection('SLIDES'),
                        const SizedBox(height: 12),

                        // Slides list
                        ...slides.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final slide = entry.value;
                          return _buildSlideEditor(
                            index: idx,
                            slide: slide,
                            onDelete: () =>
                                setDialogState(() => slides.removeAt(idx)),
                            onMoveUp: idx > 0
                                ? () => setDialogState(() {
                                      final item = slides.removeAt(idx);
                                      slides.insert(idx - 1, item);
                                    })
                                : null,
                            onMoveDown: idx < slides.length - 1
                                ? () => setDialogState(() {
                                      final item = slides.removeAt(idx);
                                      slides.insert(idx + 1, item);
                                    })
                                : null,
                          );
                        }),

                        // Add slide button
                        if (slides.length < 5)
                          OutlinedButton.icon(
                            onPressed: () => setDialogState(() {
                              slides.add({
                                'title': '',
                                'subtitle': '',
                                'imageUrl': '',
                                'ctaText': 'Shop Now',
                                'ctaLink': '',
                                'secondaryCtaText': '',
                                'secondaryCtaLink': '',
                              });
                            }),
                            icon: const Icon(Icons.add),
                            label: const Text('Add Slide'),
                          ),
                      ],
                    ),
                  ),
                ),
                // Footer
                _buildEditorFooter(
                  onCancel: () => Navigator.pop(context),
                  onSave: () {
                    final validSlides =
                        slides.where((s) => s['imageUrl']!.isNotEmpty).toList();
                    Navigator.pop(context, {
                      'type': LandingSectionType.hero,
                      'title': titleController.text,
                      if (subtitleController.text.isNotEmpty)
                        'subtitle': subtitleController.text,
                      'data': {
                        'slides': validSlides,
                        'autoPlay': autoPlay,
                        'interval': interval,
                        'alignment': alignment,
                      },
                      'config': {
                        'height': height,
                        'mobileHeight': mobileHeight,
                        'overlayOpacity': overlayOpacity,
                        'showDots': true,
                        'showArrows': true,
                      },
                      'isActive': isActive,
                    });
                  },
                  isNew: section == null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSlideEditor({
    required int index,
    required Map<String, String> slide,
    required VoidCallback onDelete,
    VoidCallback? onMoveUp,
    VoidCallback? onMoveDown,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Slide ${index + 1}',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                if (onMoveUp != null)
                  IconButton(
                      icon: const Icon(Icons.arrow_upward, size: 18),
                      onPressed: onMoveUp,
                      tooltip: 'Move Up'),
                if (onMoveDown != null)
                  IconButton(
                      icon: const Icon(Icons.arrow_downward, size: 18),
                      onPressed: onMoveDown,
                      tooltip: 'Move Down'),
                IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red, size: 18),
                    onPressed: onDelete,
                    tooltip: 'Delete'),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: slide['title'],
                    decoration: const InputDecoration(
                        labelText: 'Title',
                        border: OutlineInputBorder(),
                        isDense: true),
                    onChanged: (v) => slide['title'] = v,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    initialValue: slide['subtitle'],
                    decoration: const InputDecoration(
                        labelText: 'Subtitle',
                        border: OutlineInputBorder(),
                        isDense: true),
                    onChanged: (v) => slide['subtitle'] = v,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: slide['imageUrl'],
              decoration: const InputDecoration(
                  labelText: 'Background Image URL *',
                  border: OutlineInputBorder(),
                  isDense: true,
                  hintText: 'https://...'),
              onChanged: (v) => slide['imageUrl'] = v,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: slide['ctaText'],
                    decoration: const InputDecoration(
                        labelText: 'Primary Button Text',
                        border: OutlineInputBorder(),
                        isDense: true),
                    onChanged: (v) => slide['ctaText'] = v,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    initialValue: slide['ctaLink'],
                    decoration: const InputDecoration(
                        labelText: 'Primary Button Link',
                        border: OutlineInputBorder(),
                        isDense: true,
                        hintText: '/category/...'),
                    onChanged: (v) => slide['ctaLink'] = v,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: slide['secondaryCtaText'],
                    decoration: const InputDecoration(
                        labelText: 'Secondary Button Text',
                        border: OutlineInputBorder(),
                        isDense: true),
                    onChanged: (v) => slide['secondaryCtaText'] = v,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    initialValue: slide['secondaryCtaLink'],
                    decoration: const InputDecoration(
                        labelText: 'Secondary Button Link',
                        border: OutlineInputBorder(),
                        isDense: true),
                    onChanged: (v) => slide['secondaryCtaLink'] = v,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// PRODUCT_CAROUSEL Section Editor
  Future<Map<String, dynamic>?> _showProductCarouselDialog(
      LandingSectionDto? section) async {
    final titleController =
        TextEditingController(text: section?.title ?? 'Featured Products');
    final subtitleController =
        TextEditingController(text: section?.subtitle ?? '');
    final viewAllLinkController = TextEditingController(
        text: section?.data['viewAllLink'] as String? ?? '');
    bool isActive = section?.isActive ?? true;

    String source = section?.data['source'] as String? ?? 'featured';
    int limit = (section?.data['limit'] as num?)?.toInt() ?? 12;
    int itemsPerView = (section?.config?['itemsPerView'] as num?)?.toInt() ?? 4;
    int mobileItemsPerView =
        (section?.config?['mobileItemsPerView'] as num?)?.toInt() ?? 2;
    bool showArrows = section?.config?['showArrows'] as bool? ?? true;

    return await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          child: Container(
            width: 700,
            constraints: const BoxConstraints(maxHeight: 600),
            child: Column(
              children: [
                _buildEditorHeader(
                  icon: Icons.view_carousel,
                  title: section == null
                      ? 'Add Product Carousel'
                      : 'Edit Product Carousel',
                  subtitle: 'Horizontal scrolling product display',
                  isActive: isActive,
                  onActiveChanged: (v) => setDialogState(() => isActive = v),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: titleController,
                                decoration: const InputDecoration(
                                    labelText: 'Section Title',
                                    border: OutlineInputBorder()),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: TextFormField(
                                controller: subtitleController,
                                decoration: const InputDecoration(
                                    labelText: 'Subtitle (optional)',
                                    border: OutlineInputBorder()),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        _buildLabeledSection('DATA SOURCE'),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          initialValue: source,
                          decoration: const InputDecoration(
                              labelText: 'Product Source',
                              border: OutlineInputBorder()),
                          items: const [
                            DropdownMenuItem(
                                value: 'featured',
                                child: Text('Featured Products')),
                            DropdownMenuItem(
                                value: 'best_sellers',
                                child: Text('Best Sellers')),
                            DropdownMenuItem(
                                value: 'new_arrivals',
                                child: Text('New Arrivals')),
                            DropdownMenuItem(
                                value: 'on_sale', child: Text('On Sale')),
                          ],
                          onChanged: (v) =>
                              setDialogState(() => source = v ?? 'featured'),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                initialValue: limit.toString(),
                                decoration: const InputDecoration(
                                    labelText: 'Product Limit',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                keyboardType: TextInputType.number,
                                onChanged: (v) => limit = int.tryParse(v) ?? 12,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: TextFormField(
                                controller: viewAllLinkController,
                                decoration: const InputDecoration(
                                    labelText: 'View All Link',
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                    hintText: '/products?filter=...'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        _buildLabeledSection('DISPLAY SETTINGS'),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 16,
                          runSpacing: 16,
                          children: [
                            SizedBox(
                              width: 150,
                              child: TextFormField(
                                initialValue: itemsPerView.toString(),
                                decoration: const InputDecoration(
                                    labelText: 'Items Per View',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    itemsPerView = int.tryParse(v) ?? 4,
                              ),
                            ),
                            SizedBox(
                              width: 150,
                              child: TextFormField(
                                initialValue: mobileItemsPerView.toString(),
                                decoration: const InputDecoration(
                                    labelText: 'Mobile Items',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    mobileItemsPerView = int.tryParse(v) ?? 2,
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Checkbox(
                                    value: showArrows,
                                    onChanged: (v) => setDialogState(
                                        () => showArrows = v ?? true)),
                                const Text('Show Arrows'),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                _buildEditorFooter(
                  onCancel: () => Navigator.pop(context),
                  onSave: () {
                    Navigator.pop(context, {
                      'type': LandingSectionType.productCarousel,
                      'title': titleController.text,
                      if (subtitleController.text.isNotEmpty)
                        'subtitle': subtitleController.text,
                      'data': {
                        'source': source,
                        'limit': limit,
                        if (viewAllLinkController.text.isNotEmpty)
                          'viewAllLink': viewAllLinkController.text,
                      },
                      'config': {
                        'itemsPerView': itemsPerView,
                        'mobileItemsPerView': mobileItemsPerView,
                        'showArrows': showArrows,
                      },
                      'isActive': isActive,
                    });
                  },
                  isNew: section == null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// PROMO_BANNER Section Editor
  Future<Map<String, dynamic>?> _showPromoBannerDialog(
      LandingSectionDto? section) async {
    final titleController =
        TextEditingController(text: section?.title ?? 'Free Shipping');
    final subtitleController =
        TextEditingController(text: section?.subtitle ?? 'On orders over \$99');
    final imageUrlController =
        TextEditingController(text: section?.data['imageUrl'] as String? ?? '');
    final ctaTextController = TextEditingController(
        text: section?.data['ctaText'] as String? ?? 'Shop Now');
    final ctaUrlController = TextEditingController(
        text: section?.data['ctaUrl'] as String? ?? '/shop');
    bool isActive = section?.isActive ?? true;

    String backgroundColor =
        section?.data['backgroundColor'] as String? ?? '#1a1a1a';
    String textColor = section?.data['textColor'] as String? ?? '#ffffff';
    String alignment = section?.data['alignment'] as String? ?? 'center';
    double height = (section?.config?['height'] as num?)?.toDouble() ?? 300;
    double mobileHeight =
        (section?.config?['mobileHeight'] as num?)?.toDouble() ?? 200;

    return await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          child: Container(
            width: 700,
            constraints: const BoxConstraints(maxHeight: 650),
            child: Column(
              children: [
                _buildEditorHeader(
                  icon: Icons.campaign,
                  title: section == null
                      ? 'Add Promo Banner'
                      : 'Edit Promo Banner',
                  subtitle: 'Full-width promotional banner',
                  isActive: isActive,
                  onActiveChanged: (v) => setDialogState(() => isActive = v),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: titleController,
                                decoration: const InputDecoration(
                                    labelText: 'Banner Title *',
                                    border: OutlineInputBorder()),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: TextFormField(
                                controller: subtitleController,
                                decoration: const InputDecoration(
                                    labelText: 'Subtitle',
                                    border: OutlineInputBorder()),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: imageUrlController,
                          decoration: const InputDecoration(
                              labelText: 'Background Image URL (optional)',
                              border: OutlineInputBorder(),
                              hintText: 'https://...'),
                        ),
                        const SizedBox(height: 24),
                        _buildLabeledSection('CALL TO ACTION'),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: ctaTextController,
                                decoration: const InputDecoration(
                                    labelText: 'Button Text',
                                    border: OutlineInputBorder()),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: TextFormField(
                                controller: ctaUrlController,
                                decoration: const InputDecoration(
                                    labelText: 'Button Link *',
                                    border: OutlineInputBorder(),
                                    hintText: '/shop'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        _buildLabeledSection('STYLING'),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 16,
                          runSpacing: 16,
                          children: [
                            SizedBox(
                              width: 150,
                              child: TextFormField(
                                initialValue: backgroundColor,
                                decoration: const InputDecoration(
                                    labelText: 'BG Color',
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                    hintText: '#1a1a1a'),
                                onChanged: (v) => backgroundColor = v,
                              ),
                            ),
                            SizedBox(
                              width: 150,
                              child: TextFormField(
                                initialValue: textColor,
                                decoration: const InputDecoration(
                                    labelText: 'Text Color',
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                    hintText: '#ffffff'),
                                onChanged: (v) => textColor = v,
                              ),
                            ),
                            SizedBox(
                              width: 150,
                              child: DropdownButtonFormField<String>(
                                initialValue: alignment,
                                decoration: const InputDecoration(
                                    labelText: 'Alignment',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                items: ['left', 'center', 'right']
                                    .map((a) => DropdownMenuItem(
                                        value: a, child: Text(a.toUpperCase())))
                                    .toList(),
                                onChanged: (v) => setDialogState(
                                    () => alignment = v ?? 'center'),
                              ),
                            ),
                            SizedBox(
                              width: 120,
                              child: TextFormField(
                                initialValue: height.toString(),
                                decoration: const InputDecoration(
                                    labelText: 'Height',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    height = double.tryParse(v) ?? 300,
                              ),
                            ),
                            SizedBox(
                              width: 120,
                              child: TextFormField(
                                initialValue: mobileHeight.toString(),
                                decoration: const InputDecoration(
                                    labelText: 'Mobile H',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    mobileHeight = double.tryParse(v) ?? 200,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                _buildEditorFooter(
                  onCancel: () => Navigator.pop(context),
                  onSave: () {
                    Navigator.pop(context, {
                      'type': LandingSectionType.promoBanner,
                      'title': titleController.text,
                      if (subtitleController.text.isNotEmpty)
                        'subtitle': subtitleController.text,
                      'data': {
                        'backgroundColor': backgroundColor,
                        'textColor': textColor,
                        'alignment': alignment,
                        if (imageUrlController.text.isNotEmpty)
                          'imageUrl': imageUrlController.text,
                        if (ctaTextController.text.isNotEmpty)
                          'ctaText': ctaTextController.text,
                        'ctaUrl': ctaUrlController.text,
                      },
                      'config': {
                        'height': height,
                        'mobileHeight': mobileHeight,
                        'fullWidth': true,
                      },
                      'isActive': isActive,
                    });
                  },
                  isNew: section == null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// BRAND_STRIP Section Editor
  Future<Map<String, dynamic>?> _showBrandStripDialog(
      LandingSectionDto? section) async {
    final titleController =
        TextEditingController(text: section?.title ?? 'Our Brands');
    final subtitleController =
        TextEditingController(text: section?.subtitle ?? '');
    bool isActive = section?.isActive ?? true;

    // Parse existing brands from section data
    List<Map<String, String>> brands = [];
    if (section != null && section.data['brands'] != null) {
      final rawBrands = section.data['brands'] as List<dynamic>;
      brands = rawBrands
          .map((b) => Map<String, String>.from({
                'name': b['name']?.toString() ?? '',
                'logoUrl': b['logoUrl']?.toString() ?? '',
                'linkUrl': b['linkUrl']?.toString() ?? '',
              }))
          .toList();
    }

    int limit = (section?.data['limit'] as num?)?.toInt() ?? 8;
    bool scrollable = section?.config?['scrollable'] as bool? ?? true;
    bool showNames = section?.config?['showNames'] as bool? ?? false;
    double logoHeight =
        (section?.config?['logoHeight'] as num?)?.toDouble() ?? 60;
    String backgroundColor =
        section?.config?['backgroundColor'] as String? ?? '#f9f9f9';

    return await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          child: Container(
            width: 800,
            constraints: const BoxConstraints(maxHeight: 700),
            child: Column(
              children: [
                _buildEditorHeader(
                  icon: Icons.business,
                  title:
                      section == null ? 'Add Brand Strip' : 'Edit Brand Strip',
                  subtitle: brands.isEmpty
                      ? 'Uses catalog brands by default'
                      : '${brands.length} custom brand(s)',
                  isActive: isActive,
                  onActiveChanged: (v) => setDialogState(() => isActive = v),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: titleController,
                                decoration: const InputDecoration(
                                    labelText: 'Section Title',
                                    border: OutlineInputBorder()),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: TextFormField(
                                controller: subtitleController,
                                decoration: const InputDecoration(
                                    labelText: 'Subtitle (optional)',
                                    border: OutlineInputBorder()),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        _buildLabeledSection('SETTINGS'),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 16,
                          runSpacing: 16,
                          children: [
                            SizedBox(
                              width: 120,
                              child: TextFormField(
                                initialValue: limit.toString(),
                                decoration: const InputDecoration(
                                    labelText: 'Limit',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                keyboardType: TextInputType.number,
                                onChanged: (v) => limit = int.tryParse(v) ?? 8,
                              ),
                            ),
                            SizedBox(
                              width: 120,
                              child: TextFormField(
                                initialValue: logoHeight.toString(),
                                decoration: const InputDecoration(
                                    labelText: 'Logo Height',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    logoHeight = double.tryParse(v) ?? 60,
                              ),
                            ),
                            SizedBox(
                              width: 150,
                              child: TextFormField(
                                initialValue: backgroundColor,
                                decoration: const InputDecoration(
                                    labelText: 'BG Color',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                onChanged: (v) => backgroundColor = v,
                              ),
                            ),
                            Row(mainAxisSize: MainAxisSize.min, children: [
                              Checkbox(
                                  value: scrollable,
                                  onChanged: (v) => setDialogState(
                                      () => scrollable = v ?? true)),
                              const Text('Scrollable'),
                            ]),
                            Row(mainAxisSize: MainAxisSize.min, children: [
                              Checkbox(
                                  value: showNames,
                                  onChanged: (v) => setDialogState(
                                      () => showNames = v ?? false)),
                              const Text('Show Names'),
                            ]),
                          ],
                        ),
                        const SizedBox(height: 24),
                        _buildLabeledSection(
                            'CUSTOM BRANDS (optional - leave empty to use catalog brands)'),
                        const SizedBox(height: 12),
                        ...brands.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final brand = entry.value;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  Text('${idx + 1}.',
                                      style: TextStyle(
                                          color: Colors.grey.shade600,
                                          fontWeight: FontWeight.bold)),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TextFormField(
                                      initialValue: brand['name'],
                                      decoration: const InputDecoration(
                                          labelText: 'Name',
                                          border: OutlineInputBorder(),
                                          isDense: true),
                                      onChanged: (v) => brand['name'] = v,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextFormField(
                                      initialValue: brand['logoUrl'],
                                      decoration: const InputDecoration(
                                          labelText: 'Logo URL',
                                          border: OutlineInputBorder(),
                                          isDense: true),
                                      onChanged: (v) => brand['logoUrl'] = v,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextFormField(
                                      initialValue: brand['linkUrl'],
                                      decoration: const InputDecoration(
                                          labelText: 'Link URL',
                                          border: OutlineInputBorder(),
                                          isDense: true,
                                          hintText: '/brand/...'),
                                      onChanged: (v) => brand['linkUrl'] = v,
                                    ),
                                  ),
                                  IconButton(
                                      icon: const Icon(Icons.delete,
                                          color: Colors.red, size: 18),
                                      onPressed: () => setDialogState(
                                          () => brands.removeAt(idx))),
                                ],
                              ),
                            ),
                          );
                        }),
                        OutlinedButton.icon(
                          onPressed: () => setDialogState(() => brands
                              .add({'name': '', 'logoUrl': '', 'linkUrl': ''})),
                          icon: const Icon(Icons.add),
                          label: const Text('Add Custom Brand'),
                        ),
                      ],
                    ),
                  ),
                ),
                _buildEditorFooter(
                  onCancel: () => Navigator.pop(context),
                  onSave: () {
                    final validBrands =
                        brands.where((b) => b['name']!.isNotEmpty).toList();
                    Navigator.pop(context, {
                      'type': LandingSectionType.brandStrip,
                      'title': titleController.text,
                      if (subtitleController.text.isNotEmpty)
                        'subtitle': subtitleController.text,
                      'data': {
                        'limit': limit,
                        if (validBrands.isNotEmpty) 'brands': validBrands,
                      },
                      'config': {
                        'scrollable': scrollable,
                        'showNames': showNames,
                        'logoHeight': logoHeight,
                        'backgroundColor': backgroundColor,
                      },
                      'isActive': isActive,
                    });
                  },
                  isNew: section == null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// CATEGORY_GRID Section Editor
  Future<Map<String, dynamic>?> _showCategoryGridDialog(
      LandingSectionDto? section) async {
    final titleController =
        TextEditingController(text: section?.title ?? 'Shop by Category');
    final subtitleController =
        TextEditingController(text: section?.subtitle ?? '');
    bool isActive = section?.isActive ?? true;

    int limit = (section?.data['limit'] as num?)?.toInt() ?? 8;
    int columns = (section?.config?['columns'] as num?)?.toInt() ?? 4;
    int mobileColumns =
        (section?.config?['mobileColumns'] as num?)?.toInt() ?? 2;
    bool showDescription =
        section?.config?['showDescription'] as bool? ?? false;
    String cardStyle = section?.config?['cardStyle'] as String? ?? 'minimal';

    return await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          child: Container(
            width: 600,
            constraints: const BoxConstraints(maxHeight: 500),
            child: Column(
              children: [
                _buildEditorHeader(
                  icon: Icons.category,
                  title: section == null
                      ? 'Add Category Grid'
                      : 'Edit Category Grid',
                  subtitle: 'Uses catalog categories automatically',
                  isActive: isActive,
                  onActiveChanged: (v) => setDialogState(() => isActive = v),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: titleController,
                                decoration: const InputDecoration(
                                    labelText: 'Section Title',
                                    border: OutlineInputBorder()),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: TextFormField(
                                controller: subtitleController,
                                decoration: const InputDecoration(
                                    labelText: 'Subtitle',
                                    border: OutlineInputBorder()),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        _buildLabeledSection('DISPLAY SETTINGS'),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 16,
                          runSpacing: 16,
                          children: [
                            SizedBox(
                              width: 120,
                              child: TextFormField(
                                initialValue: limit.toString(),
                                decoration: const InputDecoration(
                                    labelText: 'Limit',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                keyboardType: TextInputType.number,
                                onChanged: (v) => limit = int.tryParse(v) ?? 8,
                              ),
                            ),
                            SizedBox(
                              width: 120,
                              child: TextFormField(
                                initialValue: columns.toString(),
                                decoration: const InputDecoration(
                                    labelText: 'Columns',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    columns = int.tryParse(v) ?? 4,
                              ),
                            ),
                            SizedBox(
                              width: 140,
                              child: TextFormField(
                                initialValue: mobileColumns.toString(),
                                decoration: const InputDecoration(
                                    labelText: 'Mobile Cols',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    mobileColumns = int.tryParse(v) ?? 2,
                              ),
                            ),
                            SizedBox(
                              width: 150,
                              child: DropdownButtonFormField<String>(
                                initialValue: cardStyle,
                                decoration: const InputDecoration(
                                    labelText: 'Card Style',
                                    border: OutlineInputBorder(),
                                    isDense: true),
                                items: ['minimal', 'card', 'overlay']
                                    .map((s) => DropdownMenuItem(
                                        value: s, child: Text(s.toUpperCase())))
                                    .toList(),
                                onChanged: (v) => setDialogState(
                                    () => cardStyle = v ?? 'minimal'),
                              ),
                            ),
                            Row(mainAxisSize: MainAxisSize.min, children: [
                              Checkbox(
                                  value: showDescription,
                                  onChanged: (v) => setDialogState(
                                      () => showDescription = v ?? false)),
                              const Text('Show Description'),
                            ]),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.info_outline,
                                  color: Colors.blue.shade700, size: 18),
                              const SizedBox(width: 8),
                              const Expanded(
                                  child: Text(
                                      'Categories are fetched automatically from your catalog.',
                                      style: TextStyle(fontSize: 13))),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                _buildEditorFooter(
                  onCancel: () => Navigator.pop(context),
                  onSave: () {
                    Navigator.pop(context, {
                      'type': LandingSectionType.categoryGrid,
                      'title': titleController.text,
                      if (subtitleController.text.isNotEmpty)
                        'subtitle': subtitleController.text,
                      'data': {
                        'limit': limit,
                      },
                      'config': {
                        'columns': columns,
                        'mobileColumns': mobileColumns,
                        'showDescription': showDescription,
                        'cardStyle': cardStyle,
                      },
                      'isActive': isActive,
                    });
                  },
                  isNew: section == null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Helper: Editor dialog header
  Widget _buildEditorHeader({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool isActive,
    required ValueChanged<bool> onActiveChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: Colors.blue.shade700, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold)),
                Text(subtitle,
                    style:
                        TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isActive ? Colors.green.shade50 : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color:
                      isActive ? Colors.green.shade200 : Colors.grey.shade300),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Active',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isActive
                            ? Colors.green.shade800
                            : Colors.grey.shade700)),
                const SizedBox(width: 8),
                Transform.scale(
                  scale: 0.85,
                  child: Switch(
                      value: isActive,
                      onChanged: onActiveChanged,
                      activeThumbColor: Colors.green.shade600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Helper: Editor dialog footer
  Widget _buildEditorFooter({
    required VoidCallback onCancel,
    required VoidCallback onSave,
    required bool isNew,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        border: Border(top: BorderSide(color: Colors.grey.shade300)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          OutlinedButton(onPressed: onCancel, child: const Text('Cancel')),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: onSave,
            style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade700,
                foregroundColor: Colors.white),
            child: Text(isNew ? 'Add Section' : 'Save Changes'),
          ),
        ],
      ),
    );
  }

  /// Helper: Section label
  Widget _buildLabeledSection(String label) {
    return Text(
      label,
      style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Colors.grey.shade600,
          letterSpacing: 0.5),
    );
  }

  Future<Map<String, dynamic>?> _showCategoryTilesDialog(
    LandingSectionDto? section,
  ) async {
    final titleController =
        TextEditingController(text: section?.title ?? 'Category Tiles');
    bool isActive = section?.isActive ?? true;

    // Parse existing tiles from section data
    List<Map<String, String>> tiles = [];
    if (section != null && section.data['tiles'] != null) {
      final rawTiles = section.data['tiles'] as List<dynamic>;
      tiles = rawTiles
          .map((t) => Map<String, String>.from({
                'title': t['title']?.toString() ?? '',
                'imageUrl': t['imageUrl']?.toString() ?? '',
                'linkUrl': t['linkUrl']?.toString() ?? '',
              }))
          .toList();
    } else {
      // Default tiles
      tiles = [
        {'title': 'Cookware', 'imageUrl': '', 'linkUrl': '/category/cookware'},
        {'title': 'Bakeware', 'imageUrl': '', 'linkUrl': '/category/bakeware'},
        {
          'title': 'Kitchen Tools',
          'imageUrl': '',
          'linkUrl': '/category/kitchen-tools'
        },
        {
          'title': 'Tableware',
          'imageUrl': '',
          'linkUrl': '/category/tableware'
        },
      ];
    }

    return await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          child: Container(
            width: 800,
            constraints: const BoxConstraints(maxHeight: 700),
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    border:
                        Border(bottom: BorderSide(color: Colors.grey.shade300)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.grid_4x4, color: Colors.blue.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              section == null
                                  ? 'Add Category Tiles'
                                  : 'Edit Category Tiles',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '${tiles.length} tiles configured',
                              style: TextStyle(
                                  fontSize: 12, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      ),
                      // Active toggle
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
                // Tiles list
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: tiles.length + 1,
                    itemBuilder: (context, index) {
                      if (index == tiles.length) {
                        // Add button
                        return OutlinedButton.icon(
                          onPressed: tiles.length < 8
                              ? () {
                                  setDialogState(() {
                                    tiles.add({
                                      'title': '',
                                      'imageUrl': '',
                                      'linkUrl': ''
                                    });
                                  });
                                }
                              : null,
                          icon: const Icon(Icons.add),
                          label: Text(
                              tiles.length >= 8 ? 'Max 8 tiles' : 'Add Tile'),
                        );
                      }

                      final tile = tiles[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Text(
                                '${index + 1}.',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    TextFormField(
                                      initialValue: tile['title'],
                                      decoration: const InputDecoration(
                                        labelText: 'Title',
                                        border: OutlineInputBorder(),
                                        isDense: true,
                                      ),
                                      onChanged: (v) => tile['title'] = v,
                                    ),
                                    const SizedBox(height: 8),
                                    TextFormField(
                                      initialValue: tile['imageUrl'],
                                      decoration: const InputDecoration(
                                        labelText: 'Image URL',
                                        border: OutlineInputBorder(),
                                        isDense: true,
                                        hintText: 'https://...',
                                      ),
                                      onChanged: (v) => tile['imageUrl'] = v,
                                    ),
                                    const SizedBox(height: 8),
                                    TextFormField(
                                      initialValue: tile['linkUrl'],
                                      decoration: const InputDecoration(
                                        labelText: 'Link URL',
                                        border: OutlineInputBorder(),
                                        isDense: true,
                                        hintText: '/category/...',
                                      ),
                                      onChanged: (v) => tile['linkUrl'] = v,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                icon:
                                    const Icon(Icons.delete, color: Colors.red),
                                onPressed: () {
                                  setDialogState(() => tiles.removeAt(index));
                                },
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                // Footer
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    border:
                        Border(top: BorderSide(color: Colors.grey.shade300)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: () {
                          // Filter out empty tiles
                          final validTiles = tiles
                              .where((t) => t['title']!.isNotEmpty)
                              .toList();

                          Navigator.pop(context, {
                            'type': LandingSectionType.categoryTiles,
                            'title': titleController.text,
                            'data': {'tiles': validTiles},
                            'config': {
                              'columns': 4,
                              'mobileColumns': 2,
                              'aspectRatio': 1.2,
                              'showTitle': true,
                              'overlayOpacity': 0.3,
                            },
                            'isActive': isActive,
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue.shade700,
                          foregroundColor: Colors.white,
                        ),
                        child: Text(
                            section == null ? 'Add Section' : 'Save Changes'),
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

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredSections;
    final typeCounts = _typeCounts;
    final hasFilters = _searchCtrl.text.isNotEmpty ||
        _statusFilter != 'ALL' ||
        _typeFilter != 'ALL';

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: Column(
        children: [
          // ─────────────────────────────────────────────────────────────────
          // STICKY HEADER
          // ─────────────────────────────────────────────────────────────────
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                child: Row(
                  children: [
                    // Back button
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new, size: 20),
                      onPressed: () => Navigator.pop(context),
                      tooltip: 'Back',
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.grey.shade100,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Title + subtitle
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                widget.page.title,
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${_sections.length} sections',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.blue.shade700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Drag to reorder • Tap to edit • Changes saved automatically',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Preview button
                    OutlinedButton.icon(
                      onPressed: () {
                        final url = '/#/${widget.page.slug}';
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Preview: $url')),
                        );
                      },
                      icon: const Icon(Icons.visibility_outlined, size: 18),
                      label: const Text('Preview'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.grey.shade700,
                        side: BorderSide(color: Colors.grey.shade300),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Add Section button
                    ElevatedButton.icon(
                      onPressed: _addSection,
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Add Section'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ─────────────────────────────────────────────────────────────────
          // TOOLBAR: Search + Filters
          // ─────────────────────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(
                bottom: BorderSide(color: Colors.grey.shade200),
              ),
            ),
            child: Column(
              children: [
                // Search + Status Filters row
                Row(
                  children: [
                    // Search box
                    Expanded(
                      flex: 2,
                      child: Container(
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: TextField(
                          controller: _searchCtrl,
                          decoration: InputDecoration(
                            hintText: 'Search sections...',
                            hintStyle: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade500,
                            ),
                            prefixIcon: Icon(Icons.search,
                                size: 20, color: Colors.grey.shade500),
                            suffixIcon: _searchCtrl.text.isNotEmpty
                                ? IconButton(
                                    icon: Icon(Icons.clear,
                                        size: 18, color: Colors.grey.shade500),
                                    onPressed: () => _searchCtrl.clear(),
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding:
                                const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Status filter chips
                    _buildFilterChip('All', 'ALL', _statusFilter == 'ALL',
                        () => setState(() => _statusFilter = 'ALL')),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                        'Active',
                        'ACTIVE',
                        _statusFilter == 'ACTIVE',
                        () => setState(() => _statusFilter = 'ACTIVE'),
                        color: Colors.green),
                    const SizedBox(width: 8),
                    _buildFilterChip('Draft', 'DRAFT', _statusFilter == 'DRAFT',
                        () => setState(() => _statusFilter = 'DRAFT'),
                        color: Colors.orange),
                  ],
                ),
                // Type filter chips row
                if (typeCounts.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildTypeChip('All Types', 'ALL', _typeFilter == 'ALL',
                            _sections.length),
                        ...typeCounts.entries.map((e) => Padding(
                              padding: const EdgeInsets.only(left: 8),
                              child: _buildTypeChip(
                                LandingSectionType.getDisplayName(e.key),
                                e.key,
                                _typeFilter == e.key,
                                e.value,
                              ),
                            )),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // ─────────────────────────────────────────────────────────────────
          // BODY: Sections List + Optional Overview Panel
          // ─────────────────────────────────────────────────────────────────
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final showOverview = constraints.maxWidth >= 1100;
                final mainContent = _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(color: Colors.black))
                    : _sections.isEmpty
                        ? _buildEmptyState()
                        : filtered.isEmpty
                            ? _buildNoResultsState(hasFilters)
                            : _buildSectionsList(filtered);

                if (!showOverview) {
                  return mainContent;
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Main content
                    Expanded(child: mainContent),
                    // Overview panel
                    _buildOverviewPanel(),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  /// Builds the right-side overview panel with stats and tips
  Widget _buildOverviewPanel() {
    final activeCount = _sections.where((s) => s.isActive).length;
    final draftCount = _sections.length - activeCount;

    return Container(
      width: 280,
      margin: const EdgeInsets.fromLTRB(0, 16, 20, 16),
      child: SingleChildScrollView(
        child: Column(
          children: [
            // Stats Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(Icons.analytics_outlined,
                            size: 20, color: Colors.blue.shade700),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Overview',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Total sections
                  _buildStatRow(
                    icon: Icons.layers_outlined,
                    label: 'Total Sections',
                    value: '${_sections.length}',
                    color: Colors.blue,
                  ),
                  const SizedBox(height: 12),
                  // Active sections
                  _buildStatRow(
                    icon: Icons.check_circle_outline,
                    label: 'Active',
                    value: '$activeCount',
                    color: Colors.green,
                  ),
                  const SizedBox(height: 12),
                  // Draft sections
                  _buildStatRow(
                    icon: Icons.edit_note_outlined,
                    label: 'Draft',
                    value: '$draftCount',
                    color: Colors.orange,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Tips Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(Icons.lightbulb_outline,
                            size: 20, color: Colors.amber.shade700),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Ordering Tips',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildTipItem(
                    '1.',
                    'Place your Hero section first for maximum impact.',
                  ),
                  const SizedBox(height: 10),
                  _buildTipItem(
                    '2.',
                    'Use Category Tiles early to help users navigate.',
                  ),
                  const SizedBox(height: 10),
                  _buildTipItem(
                    '3.',
                    'Alternate between product carousels and promo banners.',
                  ),
                  const SizedBox(height: 10),
                  _buildTipItem(
                    '4.',
                    'Drag sections to reorder instantly—changes save automatically.',
                  ),
                  const SizedBox(height: 10),
                  _buildTipItem(
                    '5.',
                    'Set sections to Draft to hide them without deleting.',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
            ),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildTipItem(String number, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Center(
            child: Text(
              number,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade600,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade700,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(
      String label, String value, bool selected, VoidCallback onTap,
      {Color? color}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? (color ?? Colors.blue).withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? (color ?? Colors.blue) : Colors.grey.shade300,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
            color: selected ? (color ?? Colors.blue) : Colors.grey.shade700,
          ),
        ),
      ),
    );
  }

  Widget _buildTypeChip(String label, String value, bool selected, int count) {
    return InkWell(
      onTap: () => setState(() => _typeFilter = value),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? Colors.blue.shade50 : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? Colors.blue.shade300 : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (value != 'ALL')
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: Icon(
                  _getSectionIcon(value),
                  size: 14,
                  color: selected ? Colors.blue.shade700 : Colors.grey.shade600,
                ),
              ),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: selected ? Colors.blue.shade700 : Colors.grey.shade700,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: selected ? Colors.blue.shade100 : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.blue.shade700 : Colors.grey.shade600,
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
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.view_agenda_outlined,
              size: 48,
              color: Colors.blue.shade300,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No sections yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add your first section to build this page',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _addSection,
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Add First Section'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoResultsState(bool hasFilters) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          const Text(
            'No matching sections',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your search or filters',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
          ),
          if (hasFilters) ...[
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () {
                setState(() {
                  _searchCtrl.clear();
                  _statusFilter = 'ALL';
                  _typeFilter = 'ALL';
                });
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.blue,
                side: BorderSide(color: Colors.blue.shade200),
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Clear all filters'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSectionsList(List<LandingSectionDto> filtered) {
    return ReorderableListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: filtered.length,
      onReorder: (oldIndex, newIndex) {
        // Map filtered indices to real indices
        final oldRealIndex = _sections.indexOf(filtered[oldIndex]);
        final newRealIndex = newIndex >= filtered.length
            ? _sections.length
            : _sections.indexOf(filtered[newIndex]);
        _reorderSections(oldRealIndex, newRealIndex);
      },
      proxyDecorator: (child, index, animation) {
        return AnimatedBuilder(
          animation: animation,
          builder: (context, child) {
            final elevation =
                Tween<double>(begin: 0, end: 8).evaluate(animation);
            return Material(
              elevation: elevation,
              borderRadius: BorderRadius.circular(16),
              shadowColor: Colors.black.withOpacity(0.15),
              child: child,
            );
          },
          child: child,
        );
      },
      itemBuilder: (context, index) {
        final section = filtered[index];
        final realIndex = _sections.indexOf(section);
        return _buildSectionCard(
          key: ValueKey(section.id),
          section: section,
          index: index,
          realIndex: realIndex,
          total: filtered.length,
        );
      },
    );
  }

  Widget _buildSectionCard({
    required Key key,
    required LandingSectionDto section,
    required int index,
    required int realIndex,
    required int total,
  }) {
    return Container(
      key: key,
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: () => _editSection(section, realIndex),
          borderRadius: BorderRadius.circular(14),
          hoverColor: Colors.blue.shade50.withOpacity(0.3),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Left: Type Icon Badge
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        _getSectionColor(section.type),
                        _getSectionColor(section.type).withOpacity(0.7),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getSectionIcon(section.type),
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),

                // Middle: Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title row
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              (section.title?.isNotEmpty ?? false)
                                  ? section.title!
                                  : LandingSectionType.getDisplayName(
                                      section.type),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Type pill
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              section.type,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey.shade700,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      // Meta row
                      Row(
                        children: [
                          // Order badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Text(
                              '#${realIndex + 1}',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // ID (truncated)
                          InkWell(
                            onTap: () => _copyToClipboard(section.id, 'ID'),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  section.id.substring(0, 8),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey.shade500,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(Icons.copy,
                                    size: 12, color: Colors.grey.shade400),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Right: Actions
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Active toggle
                    InkWell(
                      onTap: () => _toggleSectionActive(section, realIndex),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: section.isActive
                              ? Colors.green.shade50
                              : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: section.isActive
                                ? Colors.green.shade200
                                : Colors.grey.shade300,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              section.isActive
                                  ? Icons.check_circle
                                  : Icons.radio_button_unchecked,
                              size: 14,
                              color: section.isActive
                                  ? Colors.green.shade600
                                  : Colors.grey.shade500,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              section.isActive ? 'Active' : 'Draft',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: section.isActive
                                    ? Colors.green.shade700
                                    : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Up/Down arrows
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: realIndex > 0
                              ? () => _moveSectionUp(realIndex)
                              : null,
                          borderRadius: BorderRadius.circular(4),
                          child: Padding(
                            padding: const EdgeInsets.all(2),
                            child: Icon(
                              Icons.keyboard_arrow_up,
                              size: 20,
                              color: realIndex > 0
                                  ? Colors.grey.shade700
                                  : Colors.grey.shade300,
                            ),
                          ),
                        ),
                        InkWell(
                          onTap: realIndex < _sections.length - 1
                              ? () => _moveSectionDown(realIndex)
                              : null,
                          borderRadius: BorderRadius.circular(4),
                          child: Padding(
                            padding: const EdgeInsets.all(2),
                            child: Icon(
                              Icons.keyboard_arrow_down,
                              size: 20,
                              color: realIndex < _sections.length - 1
                                  ? Colors.grey.shade700
                                  : Colors.grey.shade300,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 4),

                    // Edit button
                    IconButton(
                      onPressed: () => _editSection(section, realIndex),
                      icon: Icon(Icons.edit_outlined,
                          size: 20, color: Colors.blue.shade600),
                      tooltip: 'Edit',
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.blue.shade50,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),

                    // Delete button
                    IconButton(
                      onPressed: () => _deleteSection(section, realIndex),
                      icon: Icon(Icons.delete_outline,
                          size: 20, color: Colors.red.shade400),
                      tooltip: 'Delete',
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.red.shade50,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Drag handle
                    ReorderableDragStartListener(
                      index: index,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.drag_indicator,
                          color: Colors.grey.shade500,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getSectionColor(String type) {
    switch (type) {
      case LandingSectionType.hero:
        return Colors.indigo;
      case LandingSectionType.categoryTiles:
        return Colors.teal;
      case LandingSectionType.productCarousel:
        return Colors.cyan.shade700;
      case LandingSectionType.brandStrip:
        return Colors.amber.shade700;
      case LandingSectionType.promoBanner:
        return Colors.red.shade600;
      case LandingSectionType.productGrid:
        return Colors.blue;
      case LandingSectionType.categoryGrid:
        return Colors.green;
      case LandingSectionType.richText:
        return Colors.purple;
      case LandingSectionType.image:
        return Colors.orange;
      case LandingSectionType.bannerCarousel:
        return Colors.pink;
      default:
        return Colors.grey;
    }
  }
}
