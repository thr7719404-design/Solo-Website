import 'package:flutter/material.dart';
import '../../models/dto/content_dto.dart';
import '../../models/blog.dart';
import 'package:intl/intl.dart';

/// Blog Latest Grid - Shows recent blog posts in a grid
class PortoBlogLatestGrid extends StatelessWidget {
  final LandingSectionDto section;
  final List<BlogPost>? posts;
  final Function(String)? onPostTap;

  const PortoBlogLatestGrid({
    super.key,
    required this.section,
    this.posts,
    this.onPostTap,
  });

  @override
  Widget build(BuildContext context) {
    final data = section.data;
    final config = section.config ?? {};
    
    final postsToShow = posts ?? _parsePostsFromData(data);
    final maxPosts = config['maxPosts'] as int? ?? 3;
    final displayPosts = postsToShow.take(maxPosts).toList();

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;
    final isTablet = screenWidth < 1024 && !isMobile;

    return Container(
      padding: EdgeInsets.symmetric(
        vertical: 64,
        horizontal: isMobile ? 16 : 60,
      ),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1320),
          child: Column(
            children: [
              if (section.title != null) ...[
                Text(
                  section.title!,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w300,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 8),
              ],
              if (section.subtitle != null) ...[
                Text(
                  section.subtitle!,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 40),
              ],
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: isMobile ? 1 : (isTablet ? 2 : 3),
                  crossAxisSpacing: 24,
                  mainAxisSpacing: 24,
                  childAspectRatio: isMobile ? 1.2 : 0.85,
                ),
                itemCount: displayPosts.length,
                itemBuilder: (context, index) {
                  return _buildBlogCard(context, displayPosts[index]);
                },
              ),
              const SizedBox(height: 32),
              OutlinedButton(
                onPressed: () => onPostTap?.call('/blog'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                child: const Text('View All Posts'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBlogCard(BuildContext context, BlogPost post) {
    return GestureDetector(
      onTap: () => onPostTap?.call('/blog/${post.slug}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Featured image
            Expanded(
              flex: 3,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                child: post.featuredImage != null
                    ? Image.network(
                        post.featuredImage!,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _buildPlaceholder(),
                      )
                    : _buildPlaceholder(),
              ),
            ),
            
            // Content
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category & Date
                    Row(
                      children: [
                        if (post.categoryName != null) ...[
                          Text(
                            post.categoryName!.toUpperCase(),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Theme.of(context).primaryColor,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const Text(' • ', style: TextStyle(color: Colors.grey)),
                        ],
                        if (post.publishedAt != null)
                          Text(
                            DateFormat('MMM d, yyyy').format(post.publishedAt!),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[600],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    
                    // Title
                    Text(
                      post.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    
                    // Excerpt
                    if (post.excerpt != null)
                      Expanded(
                        child: Text(
                          post.excerpt!,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                            height: 1.5,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: const Color(0xFFF5F5F5),
      child: const Center(
        child: Icon(Icons.article, size: 48, color: Colors.grey),
      ),
    );
  }

  List<BlogPost> _parsePostsFromData(Map<String, dynamic> data) {
    final postsData = data['posts'] as List<dynamic>?;
    if (postsData == null) return [];
    return postsData.map((p) => BlogPost.fromJson(p as Map<String, dynamic>)).toList();
  }
}

/// Blog Sidebar Widget
class PortoBlogSidebar extends StatelessWidget {
  final List<BlogCategory>? categories;
  final List<BlogPost>? recentPosts;
  final List<String>? popularTags;
  final Function(String)? onCategoryTap;
  final Function(String)? onPostTap;
  final Function(String)? onTagTap;

  const PortoBlogSidebar({
    super.key,
    this.categories,
    this.recentPosts,
    this.popularTags,
    this.onCategoryTap,
    this.onPostTap,
    this.onTagTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Categories
        if (categories != null && categories!.isNotEmpty) ...[
          const Text(
            'Categories',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          ...categories!.map((cat) => _buildCategoryItem(cat)),
          const SizedBox(height: 32),
        ],

        // Recent Posts
        if (recentPosts != null && recentPosts!.isNotEmpty) ...[
          const Text(
            'Recent Posts',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          ...recentPosts!.map((post) => _buildRecentPostItem(post)),
          const SizedBox(height: 32),
        ],

        // Tags
        if (popularTags != null && popularTags!.isNotEmpty) ...[
          const Text(
            'Popular Tags',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: popularTags!.map((tag) => _buildTagChip(tag)).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildCategoryItem(BlogCategory category) {
    return GestureDetector(
      onTap: () => onCategoryTap?.call(category.slug),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              category.name,
              style: const TextStyle(fontSize: 14),
            ),
            Text(
              '(${category.postCount})',
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentPostItem(BlogPost post) {
    return GestureDetector(
      onTap: () => onPostTap?.call(post.slug),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(
                width: 60,
                height: 60,
                child: post.featuredImage != null
                    ? Image.network(
                        post.featuredImage!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: const Color(0xFFF5F5F5),
                          child: const Icon(Icons.article, size: 24),
                        ),
                      )
                    : Container(
                        color: const Color(0xFFF5F5F5),
                        child: const Icon(Icons.article, size: 24),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  if (post.publishedAt != null)
                    Text(
                      DateFormat('MMM d, yyyy').format(post.publishedAt!),
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTagChip(String tag) {
    return GestureDetector(
      onTap: () => onTagTap?.call(tag),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFE5E5E5)),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          tag,
          style: const TextStyle(fontSize: 12),
        ),
      ),
    );
  }
}
