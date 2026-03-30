/// Blog Post Model
class BlogPost {
  final int id;
  final String title;
  final String slug;
  final String? excerpt;
  final String? content;
  final String? featuredImage;
  final String? author;
  final DateTime? publishedAt;
  final String? categoryName;
  final List<String> tags;
  final int readTime;

  BlogPost({
    required this.id,
    required this.title,
    required this.slug,
    this.excerpt,
    this.content,
    this.featuredImage,
    this.author,
    this.publishedAt,
    this.categoryName,
    this.tags = const [],
    this.readTime = 5,
  });

  factory BlogPost.fromJson(Map<String, dynamic> json) {
    return BlogPost(
      id: json['id'] as int,
      title: json['title'] as String,
      slug: json['slug'] as String,
      excerpt: json['excerpt'] as String?,
      content: json['content'] as String?,
      featuredImage: json['featuredImage'] as String?,
      author: json['author'] as String?,
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'])
          : null,
      categoryName: json['category']?['name'] as String?,
      tags: (json['tags'] as List<dynamic>?)
              ?.map((t) => t['tag']?['name'] as String? ?? '')
              .where((t) => t.isNotEmpty)
              .toList() ??
          [],
      readTime: json['readTime'] as int? ?? 5,
    );
  }
}

/// Blog Category Model
class BlogCategory {
  final int id;
  final String name;
  final String slug;
  final int postCount;

  BlogCategory({
    required this.id,
    required this.name,
    required this.slug,
    this.postCount = 0,
  });

  factory BlogCategory.fromJson(Map<String, dynamic> json) {
    return BlogCategory(
      id: json['id'] as int,
      name: json['name'] as String,
      slug: json['slug'] as String,
      postCount: (json['_count']?['posts'] as int?) ?? 0,
    );
  }
}
