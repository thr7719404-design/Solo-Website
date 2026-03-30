import 'package:flutter/material.dart';
import '../widgets/modern_drawer.dart';
import '../services/api_service.dart';
import '../models/dto/content_dto.dart';

class AboutUsScreen extends StatefulWidget {
  const AboutUsScreen({super.key});

  @override
  State<AboutUsScreen> createState() => _AboutUsScreenState();
}

class _AboutUsScreenState extends State<AboutUsScreen> {
  LandingPageDto? _cmsPage;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCmsContent();
  }

  Future<void> _loadCmsContent() async {
    try {
      final page = await ApiService.content.getLandingPage('about-us');
      if (mounted) {
        setState(() {
          _cmsPage = page;
          _isLoading = false;
        });
      }
    } catch (e) {
      // CMS page not found - use hardcoded fallback
      if (mounted) {
        setState(() {
          _cmsPage = null;
          _isLoading = false;
        });
      }
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
          'ABOUT US',
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _cmsPage != null
              ? _buildCmsContent()
              : _buildHardcodedContent(),
    );
  }

  Widget _buildCmsContent() {
    // Render CMS-driven content from _cmsPage
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Hero section from CMS
          if (_cmsPage!.title != null || _cmsPage!.subtitle != null)
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
                      Icons.restaurant_menu,
                      size: 40,
                      color: Color(0xFFB8860B),
                    ),
                  ),
                  const SizedBox(height: 30),
                  Text(
                    _cmsPage!.title,
                    style: const TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 42,
                      fontWeight: FontWeight.w300,
                      color: Colors.black,
                      letterSpacing: 1,
                    ),
                  ),
                  if (_cmsPage!.subtitle != null) ...[
                    const SizedBox(height: 20),
                    Text(
                      _cmsPage!.subtitle!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 18,
                        fontWeight: FontWeight.w300,
                        color: Colors.black87,
                        height: 1.6,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          // Render sections from CMS
          for (final section in _cmsPage!.sections)
            _buildCmsSection(section),
        ],
      ),
    );
  }

  Widget _buildCmsSection(LandingSectionDto section) {
    // Handle different section types
    switch (section.type) {
      case LandingSectionType.richText:
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 40),
          color: Colors.grey[50],
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 800),
              child: Text(
                section.config?['content'] ?? '',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 20,
                  fontWeight: FontWeight.w300,
                  color: Colors.black87,
                  height: 1.8,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
        );
      default:
        // Default section rendering
        return const SizedBox.shrink();
    }
  }

  Widget _buildHardcodedContent() {
    // Original hardcoded content as fallback
    return SingleChildScrollView(
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
                      Icons.restaurant_menu,
                      size: 40,
                      color: Color(0xFFB8860B),
                    ),
                  ),
                  const SizedBox(height: 30),
                  const Text(
                    'Who We Are',
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 42,
                      fontWeight: FontWeight.w300,
                      color: Colors.black,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Welcome to CFC – your destination for thoughtfully curated kitchenware, tableware, and cookware.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 18,
                      fontWeight: FontWeight.w300,
                      color: Colors.black87,
                      height: 1.6,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
            ),

            // CFC Meaning Section
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 60),
              color: Colors.white,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _buildCFCCard(
                      'Collation',
                      'We bring together beautiful, functional pieces',
                      Icons.grid_view_rounded,
                      const Color(0xFFB8860B),
                    ),
                  ),
                  const SizedBox(width: 30),
                  Expanded(
                    child: _buildCFCCard(
                      'Formation',
                      'Shape them into harmonious collections for every home and occasion',
                      Icons.auto_awesome_mosaic,
                      const Color(0xFFD4AF37),
                    ),
                  ),
                  const SizedBox(width: 30),
                  Expanded(
                    child: _buildCFCCard(
                      'Curation',
                      'Carefully handpick only what meets our standards of quality, design, and durability',
                      Icons.verified_outlined,
                      const Color(0xFFB8860B),
                    ),
                  ),
                ],
              ),
            ),

            // Description
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 40),
              color: Colors.grey[50],
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 800),
                  child: const Text(
                    'From everyday cooking essentials to elegant table settings for guests, CFC is here to make every meal feel a little more special.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 20,
                      fontWeight: FontWeight.w300,
                      color: Colors.black87,
                      height: 1.8,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ),

            // Mission Section
            _buildSectionWithIcon(
              'Our Mission',
              'Our mission is to elevate everyday dining and cooking by offering:',
              [
                'High-quality kitchenware, tableware, and cookware that look good and perform even better.',
                'Well-curated collections that make it easy for customers to style their kitchen and table with confidence.',
                'Accessible style and quality, so more homes can enjoy beautiful, functional pieces without compromise.',
              ],
              'We exist to help you cook, host, and live better – one plate, pan, and glass at a time.',
              Icons.track_changes,
              Colors.white,
            ),

            // Vision Section
            _buildSectionWithIcon(
              'Our Vision',
              'Our vision is to become the go-to destination for modern kitchen and dining essentials, known for:',
              [
                'Inspiring homes to create warm, welcoming dining experiences.',
                'Setting a standard where design, quality, and practicality always go hand in hand.',
                'Building a brand that customers trust whenever they need to refresh their kitchen or dining space.',
              ],
              'We want CFC to be the name people think of when they say, "Let\'s upgrade our kitchen and table."',
              Icons.visibility_outlined,
              Colors.grey[50]!,
            ),

            // Values Section
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 80),
              color: Colors.white,
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: const Color(0xFFB8860B).withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.favorite_border,
                          color: Color(0xFFB8860B),
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 20),
                      const Text(
                        'Our Values',
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 36,
                          fontWeight: FontWeight.w300,
                          color: Colors.black,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'At CFC, everything we do is guided by a simple set of values:',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 16,
                      fontWeight: FontWeight.w300,
                      color: Colors.black.withOpacity(0.7),
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 60),
                  Wrap(
                    spacing: 30,
                    runSpacing: 30,
                    alignment: WrapAlignment.center,
                    children: [
                      _buildValueCard(
                        'Quality First',
                        'We select materials and products that are made to last, not just look good for a moment.',
                        Icons.star_border,
                      ),
                      _buildValueCard(
                        'Thoughtful Design',
                        'Every item should feel good in the hand, work well in the kitchen, and look beautiful on the table.',
                        Icons.palette_outlined,
                      ),
                      _buildValueCard(
                        'Curation, Not Clutter',
                        'We believe in smart choices, not endless options. Our collections are carefully edited to make shopping easier.',
                        Icons.filter_list,
                      ),
                      _buildValueCard(
                        'Everyday Practicality',
                        'Our pieces are meant to be used and enjoyed daily – from quick breakfasts to big family gatherings.',
                        Icons.home_outlined,
                      ),
                      _buildValueCard(
                        'Sustainability Mindset',
                        'We prioritize durable products and responsible sourcing to encourage long-term use over disposable trends.',
                        Icons.eco_outlined,
                      ),
                      _buildValueCard(
                        'Customer-Centric',
                        'We listen, learn, and refine our collections based on how real people cook, set their tables, and live.',
                        Icons.people_outline,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Call to Action
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 60),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFFB8860B),
                    const Color(0xFFD4AF37),
                  ],
                ),
              ),
              child: Column(
                children: [
                  const Text(
                    'Ready to Transform Your Kitchen?',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 32,
                      fontWeight: FontWeight.w300,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFFB8860B),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 40,
                        vertical: 20,
                      ),
                      shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'EXPLORE OUR COLLECTIONS',
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
    );
  }

  Widget _buildCFCCard(String title, String description, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 35,
              color: color,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 20,
              fontWeight: FontWeight.w500,
              color: color,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 15),
          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 14,
              fontWeight: FontWeight.w300,
              color: Colors.black.withOpacity(0.7),
              height: 1.6,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionWithIcon(
    String title,
    String intro,
    List<String> points,
    String closing,
    IconData icon,
    Color backgroundColor,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 80),
      color: backgroundColor,
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 900),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: const Color(0xFFB8860B).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      icon,
                      color: const Color(0xFFB8860B),
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 20),
                  Text(
                    title,
                    style: const TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 36,
                      fontWeight: FontWeight.w300,
                      color: Colors.black,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 30),
              Text(
                intro,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 16,
                  fontWeight: FontWeight.w300,
                  color: Colors.black.withOpacity(0.7),
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 40),
              ...points.map((point) => Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          margin: const EdgeInsets.only(top: 8),
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: Color(0xFFB8860B),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: Text(
                            point,
                            style: const TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 16,
                              fontWeight: FontWeight.w300,
                              color: Colors.black87,
                              height: 1.7,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )),
              const SizedBox(height: 30),
              Text(
                closing,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 18,
                  fontWeight: FontWeight.w400,
                  color: Colors.black,
                  height: 1.8,
                  letterSpacing: 0.3,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildValueCard(String title, String description, IconData icon) {
    return Container(
      width: 280,
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            icon,
            size: 40,
            color: const Color(0xFFB8860B),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.black,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 15),
          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 13,
              fontWeight: FontWeight.w300,
              color: Colors.black.withOpacity(0.7),
              height: 1.6,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
