import 'package:flutter/material.dart';
import '../models/category.dart';

class CategoryList extends StatelessWidget {
  final List<Category> categories;

  const CategoryList({super.key, required this.categories});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          return Padding(
            padding: EdgeInsets.only(
              right: index < categories.length - 1 ? 16 : 0,
            ),
            child: _buildCategoryItem(context, category),
          );
        },
      ),
    );
  }

  Widget _buildCategoryItem(BuildContext context, Category category) {
    return GestureDetector(
      onTap: () {
        // TODO: Navigate to category
      },
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Center(
              child: Text(
                category.icon,
                style: const TextStyle(fontSize: 32),
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: 80,
            child: Text(
              category.name,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
