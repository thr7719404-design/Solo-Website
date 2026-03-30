import 'package:flutter/material.dart';
import '../screens/search_screen.dart';
import '../models/product.dart';

class SearchBar extends StatelessWidget {
  final Function(Product) onAddToCart;

  const SearchBar({super.key, required this.onAddToCart});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => SearchScreen(onAddToCart: onAddToCart),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(Icons.search, color: Colors.grey[400]),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Search for products, brands...',
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 15,
                ),
              ),
            ),
            Icon(Icons.tune, color: Colors.grey[400], size: 20),
          ],
        ),
      ),
    );
  }
}
